# Asistente de IA de la web (agente de atención al cliente)

Chat de la web de Raúl Gil Gonzalez que responde a los visitantes sobre servicios, precios y forma de trabajar, y cuando alguien quiere contratar o hablar con Raúl, le prepara un mensaje para enviárselo por WhatsApp.

Son dos piezas:

- **El chat** (`../js/asistente.js` y sus estilos en `../css/styles.css`): botón flotante y ventana de conversación. Está en la web, en GitHub Pages.
- **El Worker** (esta carpeta): un pequeño servidor en Cloudflare que guarda la clave de la API de Claude y hace de intermediario. Es necesario porque GitHub Pages solo sirve archivos: si la clave estuviera en la web, cualquiera podría verla y gastar a tu costa.

```
navegador ──▶ Worker de Cloudflare (guarda la clave) ──▶ API de Claude
```

El historial de cada conversación se guarda en el navegador del visitante (`sessionStorage`, se borra al cerrar la pestaña). El Worker no guarda nada.

## Lo que necesitas (una sola vez)

1. **Cuenta en la plataforma de Claude** — https://platform.claude.com
   - Añade un método de pago o compra créditos.
   - Crea una clave de API (empieza por `sk-ant-`). Guárdala bien: no se vuelve a mostrar.
   - **Pon un límite de gasto mensual** en los ajustes de la cuenta (por ejemplo, 10 $). Es la protección más importante: pase lo que pase, nunca gastarás más de esa cifra.
2. **Cuenta gratuita en Cloudflare** — https://dash.cloudflare.com/sign-up

## Desplegar el Worker

Desde esta carpeta (`agente/`):

```bash
npm install
npx wrangler login                          # abre el navegador para autorizar tu cuenta de Cloudflare
npx wrangler secret put ANTHROPIC_API_KEY   # pega la clave cuando la pida (no se guarda en ningún archivo)
npm run deploy
```

Al terminar, wrangler muestra la dirección del Worker, del estilo `https://asistente-raul.TU-SUBDOMINIO.workers.dev`. Ábrela en el navegador: debe decir *"Asistente de Raúl Gil Gonzalez: funcionando."*

## Activarlo en la web

En `index.html`, al final del todo, pega esa dirección en `data-endpoint`:

```html
<script src="js/asistente.js" data-endpoint="https://asistente-raul.TU-SUBDOMINIO.workers.dev" defer></script>
```

Sube el cambio (`git add . && git commit -m "Activar asistente" && git push`). En unos minutos aparecerá el botón **"¿Dudas? Pregúntame"** abajo a la derecha, y en la sección de agentes un bloque **"Pruébalo ahora"**. Mientras `data-endpoint` esté vacío no se muestra nada de esto.

## Cambiar la información o los precios

Todo lo que sabe el asistente está en **`src/conocimiento.js`**. Si cambias algo en la web (un precio, un servicio, un proyecto nuevo), cámbialo también ahí y vuelve a desplegar con `npm run deploy`.

## Modelo y coste

En `wrangler.toml`:

- `MODEL = "claude-opus-5-5"` — el modelo actual de Anthropic, el más capaz de la familia Opus.
- `EFFORT = "low"` — cuánto razona antes de responder. Para un chat de dudas, `low` basta y es lo más rápido y barato.

Coste aproximado con **Claude Opus 5.5** (4 $ / 20 $ por millón de tokens de entrada / salida; la parte fija del prompt se reutiliza de la caché a 0,20 $ por millón):

| | Aproximado |
|---|---|
| Por mensaje | 0,5 – 1,5 céntimos de dólar |
| Primer mensaje tras 5 minutos sin uso | ~1,5 céntimos más (se vuelve a guardar el prompt en caché) |
| Conversación típica (4–5 mensajes) | 3 – 7 céntimos |
| 100 conversaciones al mes | 3 – 7 $ |

**Alternativa mucho más barata:** `MODEL = "claude-haiku-5-5"` (0,10 $ / 0,50 $ por millón de tokens) cuesta unas 40 veces menos, a cambio de respuestas algo menos finas. Es una línea; la decisión es tuya.

Son estimaciones: el razonamiento interno del modelo también se cobra como salida. Para ver el consumo real, ejecuta `npm run logs` mientras alguien usa el chat (cada mensaje muestra sus tokens) o revisa el uso en la plataforma de Claude.

## Seguridad y control de gasto

- La clave vive como secreto en Cloudflare; nunca llega a la web ni al repositorio.
- El Worker solo acepta peticiones de tu web (`ALLOWED_ORIGINS` en `wrangler.toml`; incluye `localhost:8000` para pruebas).
- Máximo 10 mensajes por minuto por persona (IP), 12 mensajes por conversación, 600 caracteres por mensaje y un tope de tokens por respuesta.
- La comprobación del origen frena a otras webs, pero no a alguien que llame al Worker desde un script: por eso el **límite de gasto** de la plataforma de Claude es imprescindible. Si algún día notas abuso, se puede añadir Cloudflare Turnstile (un captcha invisible).
- **Respaldo ante rechazos:** si los filtros de seguridad de Claude rechazan un mensaje (muy improbable en este uso), otro modelo responde automáticamente (`fallbacks: 'default'` en `src/index.js`). Para quitarlo, borra ese parámetro y su beta en `BETAS`.

## Privacidad

Los mensajes del chat se envían a la API de Claude (Anthropic) para generar la respuesta; el Worker no los guarda. El propio chat avisa de que no se compartan datos sensibles. Si el asistente va a recoger datos personales (nombres, teléfonos…), conviene añadir a la web una página de política de privacidad que lo mencione.

## Probar en local

- **Sin clave ni red:** `npm test` ejecuta 16 pruebas del Worker con la API de Claude simulada.
- **Con clave, de verdad:** copia `.dev.vars.example` como `.dev.vars` (está en `.gitignore`), pon tu clave y ejecuta `npm run dev` (el Worker queda en `http://localhost:8787`). En otra terminal, desde la raíz del proyecto, `python -m http.server 8000`, y pon temporalmente `data-endpoint="http://localhost:8787"` en `index.html` (sin subir ese cambio).

## Archivos

| Archivo | Qué hace |
|---|---|
| `src/index.js` | El Worker: valida la petición, llama a Claude y devuelve la respuesta |
| `src/conocimiento.js` | Prompt del sistema: normas del asistente e información del negocio |
| `wrangler.toml` | Nombre, modelo, esfuerzo, webs permitidas y límite por IP |
| `test/worker.test.mjs` | Pruebas sin red (`npm test`) |
| `.dev.vars.example` | Plantilla para la clave en local |
