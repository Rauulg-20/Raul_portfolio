// Pruebas del Worker sin red ni clave real: se sustituye `fetch` por una API de
// Claude simulada y se comprueba qué envía el Worker y qué devuelve.
// Ejecutar con: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

const ORIGEN = 'https://rauulg-20.github.io';
const CLAVE = 'sk-ant-prueba';
const env = (extra = {}) => ({ ANTHROPIC_API_KEY: CLAVE, ALLOWED_ORIGINS: `${ORIGEN},http://localhost:8000`, ...extra });

function peticion(cuerpo, { origen = ORIGEN, method = 'POST' } = {}) {
  return new Request('https://asistente.test/', {
    method,
    headers: { 'Content-Type': 'application/json', Origin: origen },
    body: method === 'POST' ? JSON.stringify(cuerpo) : undefined,
  });
}

let llamadas = [];
function simularClaude(...respuestas) {
  llamadas = [];
  let i = 0;
  globalThis.fetch = async (url, init = {}) => {
    const req = url instanceof Request ? url : null;
    const texto = req ? await req.text() : init.body;
    llamadas.push({
      url: req ? req.url : String(url),
      headers: new Headers(req ? req.headers : init.headers),
      body: JSON.parse(texto),
    });
    const r = respuestas[Math.min(i++, respuestas.length - 1)];
    return new Response(JSON.stringify(r.body), {
      status: r.status ?? 200,
      headers: { 'content-type': 'application/json', 'request-id': 'req_prueba' },
    });
  };
}

const mensaje = (content, stop_reason = 'end_turn') => ({
  body: {
    id: 'msg_prueba', type: 'message', role: 'assistant', model: 'claude-opus-5-5',
    content, stop_reason, stop_sequence: null,
    usage: { input_tokens: 12, output_tokens: 30, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
  },
});
const errorApi = (status, type) => ({ status, body: { type: 'error', error: { type, message: `simulado ${status}` } } });

const PENSAMIENTO = { type: 'thinking', thinking: '', signature: 'firma-simulada' };
const TEXTO = { type: 'text', text: 'Una web Medium cuesta 199 €.' };
const LLAMADA = {
  type: 'tool_use', id: 'toolu_1', name: 'ofrecer_contacto_con_raul',
  input: { resumen: 'Hola Raúl, quiero una web Medium para mi peluquería.' },
};

// Silencia los console.log/error del Worker durante las pruebas
console.log = () => {};
console.error = () => {};

test('GET responde para comprobar el despliegue', async () => {
  const r = await worker.fetch(peticion(null, { method: 'GET' }), env());
  assert.equal(r.status, 200);
  assert.match(await r.text(), /funcionando/);
});

test('preflight CORS: origen permitido → 204 con su origen', async () => {
  const r = await worker.fetch(peticion(null, { method: 'OPTIONS' }), env());
  assert.equal(r.status, 204);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), ORIGEN);
});

test('preflight CORS: origen ajeno → 403 sin cabecera CORS', async () => {
  const r = await worker.fetch(peticion(null, { method: 'OPTIONS', origen: 'https://otra-web.com' }), env());
  assert.equal(r.status, 403);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), null);
});

test('POST desde un origen ajeno → 403 y no llama a Claude', async () => {
  simularClaude(mensaje([TEXTO]));
  const r = await worker.fetch(peticion({ history: [], message: 'hola' }, { origen: 'https://otra-web.com' }), env());
  assert.equal(r.status, 403);
  assert.equal(llamadas.length, 0);
});

test('sin clave configurada → 500 y no llama a Claude', async () => {
  simularClaude(mensaje([TEXTO]));
  const r = await worker.fetch(peticion({ history: [], message: 'hola' }), env({ ANTHROPIC_API_KEY: '' }));
  assert.equal(r.status, 500);
  assert.equal(llamadas.length, 0);
});

test('respuesta normal: devuelve el texto y el turno completo, y la petición a Claude es correcta', async () => {
  simularClaude(mensaje([PENSAMIENTO, TEXTO]));
  const r = await worker.fetch(peticion({ history: [], message: '¿Cuánto cuesta una web?' }), env());
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.reply, TEXTO.text);
  assert.equal(d.handoff, null);
  assert.deepEqual(d.turn, [
    { role: 'user', content: '¿Cuánto cuesta una web?' },
    { role: 'assistant', content: [PENSAMIENTO, TEXTO] }, // el razonamiento vuelve intacto
  ]);

  assert.equal(llamadas.length, 1);
  const { url, headers, body } = llamadas[0];
  assert.match(url, /\/v1\/messages(\?|$)/);
  assert.equal(headers.get('x-api-key'), CLAVE);
  const betas = headers.get('anthropic-beta') || '';
  assert.match(betas, /server-side-fallback-2026-07-01/);
  assert.match(betas, /thinking-binding-controls-2026-08-01/);
  assert.equal(body.betas, undefined, 'betas va en la cabecera, no en el cuerpo');
  assert.equal(body.model, 'claude-opus-5-5');
  assert.equal(body.fallbacks, 'default');
  assert.equal(body.max_tokens, 3000);
  assert.deepEqual(body.thinking, { type: 'adaptive', block_binding: { prefix_mismatch_behavior: 'drop_block' } });
  assert.deepEqual(body.output_config, { effort: 'low' });
  assert.deepEqual(body.cache_control, { type: 'ephemeral' });
  assert.deepEqual(body.system[0].cache_control, { type: 'ephemeral' });
  assert.match(body.system[0].text, /asistente virtual de la web de Raúl Gil Gonzalez/);
  assert.equal(body.tools.length, 1);
  assert.equal(body.tools[0].strict, true);
  assert.equal(body.tool_choice, undefined, 'sin tool_choice forzado (daría 400 en este modelo)');
  assert.deepEqual(body.messages, [{ role: 'user', content: '¿Cuánto cuesta una web?' }]);
});

test('el segundo mensaje reenvía el historial exactamente igual y solo añade al final', async () => {
  simularClaude(mensaje([PENSAMIENTO, TEXTO]));
  const primero = await (await worker.fetch(peticion({ history: [], message: 'Hola' }), env())).json();

  simularClaude(mensaje([PENSAMIENTO, { type: 'text', text: 'Claro.' }]));
  await worker.fetch(peticion({ history: primero.turn, message: '¿Y una Premium?' }), env());
  const enviado = llamadas[0].body.messages;
  assert.equal(
    JSON.stringify(enviado.slice(0, primero.turn.length)),
    JSON.stringify(primero.turn),
    'el prefijo debe ser idéntico byte a byte'
  );
  assert.deepEqual(enviado.at(-1), { role: 'user', content: '¿Y una Premium?' });
});

test('la herramienta de contacto devuelve el resumen y cierra la llamada con su resultado', async () => {
  simularClaude(mensaje([PENSAMIENTO, LLAMADA], 'tool_use'));
  const d = await (await worker.fetch(peticion({ history: [], message: 'Quiero contratar una web' }), env())).json();
  assert.equal(d.reply, '');
  assert.deepEqual(d.handoff, { resumen: LLAMADA.input.resumen });
  assert.equal(d.turn.length, 3);
  assert.equal(d.turn[2].role, 'user');
  assert.equal(d.turn[2].content[0].type, 'tool_result');
  assert.equal(d.turn[2].content[0].tool_use_id, 'toolu_1');

  // Siguiente mensaje tras la derivación: historial que acaba en tool_result + nuevo mensaje
  simularClaude(mensaje([PENSAMIENTO, { type: 'text', text: 'De nada.' }]));
  const r = await worker.fetch(peticion({ history: d.turn, message: 'Gracias' }), env());
  assert.equal(r.status, 200);
  assert.equal(llamadas[0].body.messages.length, 4);
});

test('rechazo del modelo: mensaje amable y no se toca el historial', async () => {
  simularClaude(mensaje([], 'refusal'));
  const d = await (await worker.fetch(peticion({ history: [], message: 'algo raro' }), env())).json();
  assert.match(d.reply, /no puedo ayudarte/);
  assert.deepEqual(d.turn, []);
});

test('mensaje demasiado largo → 400 sin llamar a Claude', async () => {
  simularClaude(mensaje([TEXTO]));
  const r = await worker.fetch(peticion({ history: [], message: 'a'.repeat(601) }), env());
  assert.equal(r.status, 400);
  assert.equal((await r.json()).error, 'demasiado_largo');
  assert.equal(llamadas.length, 0);
});

test('límite de mensajes por conversación: avisa y no llama a Claude', async () => {
  const historial = [];
  for (let i = 0; i < 12; i++) {
    historial.push({ role: 'user', content: `pregunta ${i}` });
    historial.push({ role: 'assistant', content: [{ type: 'text', text: 'respuesta' }] });
  }
  simularClaude(mensaje([TEXTO]));
  const d = await (await worker.fetch(peticion({ history: historial, message: 'otra más' }), env())).json();
  assert.equal(d.limitReached, true);
  assert.deepEqual(d.turn, []);
  assert.equal(llamadas.length, 0);
});

test('historial con forma inválida → 400', async () => {
  simularClaude(mensaje([TEXTO]));
  const empiezaPorAsistente = [{ role: 'assistant', content: [{ type: 'text', text: 'hola' }] }];
  const bloqueRaro = [{ role: 'user', content: [{ type: 'image', source: {} }] }];
  for (const history of [empiezaPorAsistente, bloqueRaro, 'no-es-un-array']) {
    const r = await worker.fetch(peticion({ history, message: 'hola' }), env());
    assert.equal(r.status, 400);
  }
  assert.equal(llamadas.length, 0);
});

test('API saturada (5xx) → 503 con mensaje para el visitante', async () => {
  simularClaude(errorApi(500, 'api_error'));
  const r = await worker.fetch(peticion({ history: [], message: 'hola' }), env());
  assert.equal(r.status, 503);
  assert.equal((await r.json()).error, 'ocupado');
});

test('la API rechaza la petición (400) → error de historial', async () => {
  simularClaude(errorApi(400, 'invalid_request_error'));
  const r = await worker.fetch(peticion({ history: [], message: 'hola' }), env());
  assert.equal(r.status, 400);
  assert.equal((await r.json()).error, 'historial');
});

test('limitador por IP: si dice que no → 429 sin llamar a Claude', async () => {
  simularClaude(mensaje([TEXTO]));
  const LIMITADOR = { limit: async () => ({ success: false }) };
  const r = await worker.fetch(peticion({ history: [], message: 'hola' }), env({ LIMITADOR }));
  assert.equal(r.status, 429);
  assert.equal(llamadas.length, 0);
});

test('MODEL y EFFORT de wrangler.toml cambian el modelo y el esfuerzo', async () => {
  simularClaude(mensaje([TEXTO]));
  await worker.fetch(peticion({ history: [], message: 'hola' }), env({ MODEL: 'claude-haiku-5-5', EFFORT: 'medium' }));
  assert.equal(llamadas[0].body.model, 'claude-haiku-5-5');
  assert.deepEqual(llamadas[0].body.output_config, { effort: 'medium' });
});
