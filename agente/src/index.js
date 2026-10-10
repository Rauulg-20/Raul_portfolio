/**
 * Asistente de la web de Raúl Gil Gonzalez — Cloudflare Worker.
 *
 * El chat de la web envía aquí cada mensaje junto con el historial de la
 * conversación. El Worker llama a la API de Claude con la clave guardada como
 * secreto (nunca llega al navegador) y devuelve la respuesta. No guarda nada:
 * el historial vive en el navegador del visitante.
 *
 * Contrato:
 *   POST { history: MessageParam[], message: string }
 *   200  { reply, handoff: { resumen } | null, turn: MessageParam[], truncated?, limitReached? }
 *   4xx/5xx { error, message }
 * El navegador debe añadir `turn` tal cual a su historial: el modelo exige que
 * el historial no se edite (solo se añade al final), o rechaza la petición.
 */
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from './conocimiento.js';

const MODELO_POR_DEFECTO = 'claude-opus-5-5';
const ESFUERZO_POR_DEFECTO = 'low';      // conversación sencilla: poco razonamiento, respuesta rápida
const MAX_TOKENS = 3000;                 // razonamiento + respuesta; también hace de tope de coste
const MAX_CARACTERES = 600;              // por mensaje del visitante
const MAX_MENSAJES_VISITANTE = 12;       // por conversación
const MAX_CUERPO_BYTES = 400_000;        // el historial incluye los bloques de razonamiento
const MAX_MENSAJES_HISTORIAL = 60;

const BETAS = [
  'server-side-fallback-2026-07-01',      // fallbacks: 'default' (si el modelo rechaza, responde otro)
  'thinking-binding-controls-2026-08-01', // thinking.block_binding
];

const HERRAMIENTA_CONTACTO = 'ofrecer_contacto_con_raul';

const TOOLS = [
  {
    name: HERRAMIENTA_CONTACTO,
    description:
      'Muestra al visitante un botón para continuar la conversación con Raúl por WhatsApp, con un mensaje ya redactado que resume lo que necesita. Úsala cuando el visitante quiera contratar algo o pedir presupuesto, quiera hablar directamente con Raúl, necesite algo que no encaja en los planes, o pregunte algo que no puedes responder con tu información.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        resumen: {
          type: 'string',
          description:
            'Mensaje en primera persona, como si lo escribiera el propio visitante a Raúl, con lo que necesita en una o dos frases. Empieza por "Hola Raúl,". Máximo 300 caracteres.',
        },
      },
      required: ['resumen'],
      additionalProperties: false,
    },
  },
];

const TEXTOS = {
  rechazo:
    'Con eso no puedo ayudarte. Si tienes alguna duda sobre las webs o los agentes de IA de Raúl, pregúntame, o escríbele directamente por WhatsApp.',
  limite:
    'Hemos llegado al límite de mensajes de esta conversación. Si quieres seguir, escribe a Raúl por WhatsApp o empieza una conversación nueva.',
  ocupado:
    'Ahora mismo no puedo responder porque hay muchas consultas. Prueba de nuevo en un momento o escribe a Raúl por WhatsApp.',
  error: 'No he podido responder ahora mismo. Prueba de nuevo en un momento o escribe a Raúl por WhatsApp.',
  historial: 'Algo ha fallado con esta conversación. Empieza una nueva y te sigo ayudando.',
  rapido: 'Vas muy rápido: espera unos segundos antes de enviar otro mensaje.',
  largo: `El mensaje es demasiado largo (máximo ${MAX_CARACTERES} caracteres).`,
};

export default {
  async fetch(request, env) {
    const origen = request.headers.get('Origin') || '';
    const permitidos = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    const permitido = permitidos.includes(origen);
    const cors = permitido
      ? {
          'Access-Control-Allow-Origin': origen,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
          Vary: 'Origin',
        }
      : { Vary: 'Origin' };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: permitido ? 204 : 403, headers: cors });
    }
    if (request.method === 'GET') {
      // Comprobación rápida tras desplegar: abre la URL del Worker en el navegador.
      return new Response('Asistente de Raúl Gil Gonzalez: funcionando.', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', ...cors },
      });
    }
    if (request.method !== 'POST') return json({ error: 'metodo_no_permitido' }, 405, cors);
    if (!permitido) return json({ error: 'origen_no_permitido' }, 403, cors);
    if (!env.ANTHROPIC_API_KEY) {
      console.error('Falta el secreto ANTHROPIC_API_KEY (npx wrangler secret put ANTHROPIC_API_KEY)');
      return json({ error: 'configuracion', message: TEXTOS.error }, 500, cors);
    }

    // Límite de mensajes por IP (si el binding está configurado en wrangler.toml)
    if (env.LIMITADOR) {
      const ip = request.headers.get('CF-Connecting-IP') || 'desconocida';
      const { success } = await env.LIMITADOR.limit({ key: ip });
      if (!success) return json({ error: 'demasiadas_peticiones', message: TEXTOS.rapido }, 429, cors);
    }

    // --- Validar la petición ---
    const cuerpo = await request.text();
    if (cuerpo.length > MAX_CUERPO_BYTES) return json({ error: 'historial', message: TEXTOS.historial }, 413, cors);

    let datos;
    try {
      datos = JSON.parse(cuerpo);
    } catch {
      return json({ error: 'peticion_invalida', message: TEXTOS.error }, 400, cors);
    }
    const mensaje = typeof datos?.message === 'string' ? datos.message.trim() : '';
    const historial = datos?.history;
    if (!mensaje) return json({ error: 'peticion_invalida', message: TEXTOS.error }, 400, cors);
    if (mensaje.length > MAX_CARACTERES) return json({ error: 'demasiado_largo', message: TEXTOS.largo }, 400, cors);
    if (!historialValido(historial)) return json({ error: 'historial', message: TEXTOS.historial }, 400, cors);

    if (contarMensajesVisitante(historial) >= MAX_MENSAJES_VISITANTE) {
      // No se llama al modelo ni se añade nada al historial.
      return json({ reply: TEXTOS.limite, handoff: null, turn: [], limitReached: true }, 200, cors);
    }

    // --- Llamar a Claude ---
    const mensajeVisitante = { role: 'user', content: mensaje };
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 30_000 });

    let respuesta;
    try {
      respuesta = await client.beta.messages.create({
        model: env.MODEL || MODELO_POR_DEFECTO,
        max_tokens: MAX_TOKENS,
        betas: BETAS,
        fallbacks: 'default',
        // El historial lo guarda el navegador: si llegara alterado, se descarta el
        // razonamiento afectado en lugar de fallar la petición.
        thinking: { type: 'adaptive', block_binding: { prefix_mismatch_behavior: 'drop_block' } },
        output_config: { effort: env.EFFORT || ESFUERZO_POR_DEFECTO },
        // Caché: un punto fijo tras el prompt del sistema (compartido por todos los
        // visitantes) y la caché automática para el resto de la conversación.
        cache_control: { type: 'ephemeral' },
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        tools: TOOLS,
        messages: [...historial, mensajeVisitante],
      });
    } catch (err) {
      return errorDeClaude(err, cors);
    }

    if (respuesta.stop_reason === 'refusal') {
      // No se añade nada al historial: la conversación sigue como estaba.
      return json({ reply: TEXTOS.rechazo, handoff: null, turn: [] }, 200, cors);
    }

    // El turno se devuelve completo (con los bloques de razonamiento) para que el
    // navegador lo reenvíe sin cambios en el siguiente mensaje.
    const turno = [mensajeVisitante, { role: 'assistant', content: respuesta.content }];

    let handoff = null;
    const llamadas = respuesta.content.filter((b) => b.type === 'tool_use');
    if (llamadas.length) {
      turno.push({
        role: 'user',
        content: llamadas.map((b) => {
          if (b.name === HERRAMIENTA_CONTACTO) {
            handoff = { resumen: limpiarResumen(b.input?.resumen, mensaje) };
            return {
              type: 'tool_result',
              tool_use_id: b.id,
              content: 'Se ha mostrado al visitante un botón para enviar ese mensaje a Raúl por WhatsApp.',
            };
          }
          return { type: 'tool_result', tool_use_id: b.id, content: 'Herramienta no disponible.', is_error: true };
        }),
      });
    }

    const reply = respuesta.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text.trim())
      .filter(Boolean)
      .join('\n\n');

    const u = respuesta.usage || {};
    console.log(
      `ok modelo=${respuesta.model} fin=${respuesta.stop_reason} entrada=${u.input_tokens} ` +
        `cache_leida=${u.cache_read_input_tokens} cache_escrita=${u.cache_creation_input_tokens} salida=${u.output_tokens}`
    );

    return json({ reply, handoff, turn: turno, truncated: respuesta.stop_reason === 'max_tokens' }, 200, cors);
  },
};

/* ---------- Utilidades ---------- */

function json(datos, status, cabeceras) {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cabeceras },
  });
}

const TIPOS_BLOQUE_VISITANTE = new Set(['text', 'tool_result']);

// El historial llega del navegador, así que se comprueba su forma básica.
// Los bloques del asistente se aceptan tal cual: son los que devolvió la API.
export function historialValido(historial) {
  if (!Array.isArray(historial) || historial.length > MAX_MENSAJES_HISTORIAL) return false;
  return historial.every((m, i) => {
    if (!m || typeof m !== 'object') return false;
    if (i === 0 && m.role !== 'user') return false;
    if (m.role === 'user') {
      if (typeof m.content === 'string') return m.content.length > 0 && m.content.length <= MAX_CARACTERES;
      return (
        Array.isArray(m.content) &&
        m.content.length > 0 &&
        m.content.every((b) => b && typeof b === 'object' && TIPOS_BLOQUE_VISITANTE.has(b.type))
      );
    }
    if (m.role === 'assistant') {
      return Array.isArray(m.content) && m.content.every((b) => b && typeof b === 'object' && typeof b.type === 'string');
    }
    return false;
  });
}

export function contarMensajesVisitante(historial) {
  return historial.filter((m) => m.role === 'user' && typeof m.content === 'string').length;
}

function limpiarResumen(resumen, mensajeOriginal) {
  const texto = typeof resumen === 'string' ? resumen.replace(/\s+/g, ' ').trim() : '';
  return (texto || `Hola Raúl, ${mensajeOriginal}`).slice(0, 400);
}

function errorDeClaude(err, cors) {
  if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError) {
    console.error(`API de Claude ocupada (${err.status}): ${err.message}`);
    return json({ error: 'ocupado', message: TEXTOS.ocupado }, 503, cors);
  }
  if (err instanceof Anthropic.BadRequestError) {
    // Suele ser un historial alterado o inválido; también aparece aquí si se
    // agota el límite de gasto de la cuenta. El detalle queda en el registro.
    console.error(`Petición rechazada por la API (400): ${err.message}`);
    return json({ error: 'historial', message: TEXTOS.historial }, 400, cors);
  }
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    console.error(`Clave de API no válida o sin permisos (${err.status}): ${err.message}`);
    return json({ error: 'configuracion', message: TEXTOS.error }, 500, cors);
  }
  if (err instanceof Anthropic.APIError) {
    console.error(`Error de la API de Claude (${err.status}): ${err.message}`);
    return json({ error: 'error_api', message: TEXTOS.error }, 502, cors);
  }
  console.error('Error inesperado llamando a Claude:', err);
  return json({ error: 'error_red', message: TEXTOS.error }, 502, cors);
}
