# Raúl Gil Gonzalez — Agentes de IA y páginas web

Web personal y comercial de **Raúl Gil Gonzalez**, estudiante de Ingeniería Informática en Cáceres: portfolio, presentación y escaparate de sus dos servicios — **agentes de IA** para empresas (captación y clasificación de contactos, reservas y atención al cliente) y **páginas web** — con precios, packs, proceso de trabajo, FAQ y contacto.

**Publicada en:** https://rauulg-20.github.io/Raul_portfolio/

Sitio 100 % estático — sin backend, sin base de datos y sin paso de compilación — servido con **GitHub Pages**.

## Tecnologías

HTML5, CSS3 y JavaScript "vanilla", sin frameworks ni dependencias.

¿Por qué no React/Vite? Para una web de una sola página, un stack estático carga más rápido, no necesita compilar nada, no tiene el problema de rutas de una SPA en GitHub Pages y se puede editar un texto o un precio sin instalar nada. Si el proyecto creciera mucho (varias páginas, blog, contenido dinámico) tendría sentido reconsiderarlo.

- **`index.html`** — todo el contenido, con metadatos SEO, Open Graph y datos estructurados (JSON-LD).
- **`css/styles.css`** — diseño completo con variables CSS (color, tipografía, geometría), mobile-first.
- **`js/main.js`** — interactividad. Todo es mejora progresiva: si JavaScript no carga, la web se sigue viendo y leyendo entera (las pestañas se muestran todas seguidas y no hay animaciones).
- **`DESIGN.md`** — **la dirección de arte y el porqué de cada decisión visual. Léelo antes de cambiar nada del diseño.**
- **Fuentes**: IBM Plex Sans (texto y títulos, con el display en peso 300), IBM Plex Serif cursiva (la palabra acentuada de cada titular) e IBM Plex Mono (cifras, precios, horas y etiquetas), vía Google Fonts.
- **Iconos**: SVG propios en un sprite al principio de `index.html`. Solo están los que se usan.

### Movimiento

El movimiento es deliberadamente escaso: solo hay tres cosas que se mueven, y todas se desactivan si el sistema del visitante tiene activado "reducir movimiento".

| Efecto | Dónde | Cómo se controla |
|---|---|---|
| Las filas del parte entran escalonadas, una sola vez | Hero | Clase `.motion` en `<html>` (la pone `js/main.js` si procede) + `animation-delay` por fila |
| La segunda tinta entra desde abajo en los botones | Toda la web | `.btn::before` con `transform:scaleY()` |
| La conversación de ejemplo se escribe sola | Sección Agentes | Se activa tras el primer scroll de una persona; un buscador que renderice la página ve siempre la conversación completa |
| Estados de `hover` y `focus` | Toda la web | Cambian el filete y el fondo, nunca desplazan el elemento |

No hay parallax, inclinación 3D, foco de luz siguiendo al ratón, banda de texto en marcha ni aparición por scroll en cada sección. Si vas a añadir movimiento, lee antes el apartado correspondiente de `DESIGN.md`.

## Estructura

```
├── index.html          página principal
├── 404.html            página de error 404
├── DESIGN.md           dirección de arte: color, tipografía, geometría, ritmo
├── css/styles.css      estilos
├── js/main.js          interactividad
├── js/asistente.js     chat del asistente de IA (se activa con la URL del Worker)
├── agente/             Worker de Cloudflare del asistente (ver agente/README.md)
├── assets/             favicon, iconos, foto de perfil, imagen para redes (og-image.png)
├── robots.txt
├── sitemap.xml
├── site.webmanifest
└── .nojekyll           evita que GitHub Pages procese el sitio con Jekyll
```

## Ejecutarlo en local

No hay nada que instalar. Basta con abrir `index.html` en el navegador, aunque es mejor servirlo con un servidor local para que todo se comporte igual que en producción:

```bash
python -m http.server 8000      # o bien: npx serve .
```

y abrir `http://localhost:8000`.

## Publicar cambios

El repositorio ya está conectado a GitHub Pages (rama `main`, carpeta `/ (root)`). Para publicar cualquier cambio:

```bash
git add .
git commit -m "Describe aquí el cambio"
git push
```

GitHub Pages se actualiza solo unos minutos después del `push`. No hace falta ninguna configuración adicional.

## Personalización

Los textos y precios están escritos directamente en `index.html`; un "buscar en todos los archivos" (Ctrl+Shift+F en VS Code) encuentra todas las apariciones.

| Dato | Qué buscar | Dónde aparece |
|---|---|---|
| Nombre | `Raúl Gil Gonzalez` | Título, cabecera, hero, footer, metadatos |
| WhatsApp | `34658953935` | `js/main.js` → `WHATSAPP_NUMBER` (lo usan todos los botones de WhatsApp) y los `href` de respaldo en `index.html` y `404.html` |
| Instagram | `rauulg_20` | Enlaces a Instagram |
| Email | `rauul.digital@gmail.com` | Botones de email |
| Precios webs | `99 €`, `199 €`, `399 €`, `30 €/mes` | Pestaña "Webs" de `#precios`, raíl del servicio "Páginas web" |
| Precios agentes | Captación `1.200 €` + `129 €/mes`, reservas `990 €` + `99 €/mes`, atención `690 €` + `79 €/mes` | Pestaña "Agentes IA", lista de tipos de agente de `#agentes`, raíl del servicio "Agentes de IA" |
| Packs | `690 €`, `790 €`, `950 €`, `89 €/mes` y los importes "Por separado" / "Ahorras" | Pestaña "Packs" |

> **Si cambias un precio, cámbialo en los dos sitios.** Los precios también viven dentro
> del asistente, en `agente/src/conocimiento.js`, porque es lo que responde cuando alguien
> le pregunta cuánto cuesta. Si solo actualizas la web, el agente cotiza los precios
> viejos. Y para que el cambio salga en vivo hay que volver a desplegar el worker:
> `cd agente && npm run deploy`.

**Mensajes de WhatsApp:** cada botón lleva su mensaje predefinido en el atributo `data-wa` (por ejemplo `data-wa="Hola Raúl, me interesa el agente de reservas."`). Para cambiar un mensaje, edita ese texto; si cambias un precio, revisa también el `data-wa` del botón correspondiente, que lo menciona.

**Enlaces directos a pestañas:** `…/Raul_portfolio/#precios-agentes`, `#precios-webs`, `#precios-packs`, `#faq-agentes` o `#faq-webs` abren la página directamente en esa pestaña (útil para mandar por WhatsApp o Instagram).

### Cambiar la foto

- Foto de perfil: `assets/raul-perfil.jpg` (vertical; se recorta a proporción 3:4).
- Imagen para redes: `assets/og-image.png` (1200 × 630 px).

Si usas otro nombre de archivo, actualiza el `src` correspondiente en `index.html`.

## Asistente de IA (agente de atención al cliente)

La web incluye un chat con IA que responde a los visitantes con la información del negocio y, cuando quieren contratar, les prepara un mensaje para enviarlo por WhatsApp. Funciona con un Worker de Cloudflare que guarda la clave de la API de Claude (GitHub Pages no puede guardar secretos).

La URL del Worker va en el `data-endpoint` del `<script src="js/asistente.js">`, al final de `index.html`. Si lo dejas vacío, el asistente queda desactivado. Pasos, costes y seguridad: **[agente/README.md](agente/README.md)**.

Las clases CSS del chat (`asistente__*`, `chat-bubble*`) las genera `js/asistente.js`. **No las renombres en el CSS sin tocar también ese archivo.**

## La sección «Pruébalo»

En lugar de una galería de proyectos, la web enseña el producto funcionando:
la sección `#pruebalo` (campo ámbar) invita a hablar con el asistente, que es
uno de los agentes que vendo, cargado con mi propia información.

Las preguntas de ejemplo de la tarjeta son texto, no botones: si el asistente
no carga (JavaScript bloqueado, Worker caído), la sección se sigue entendiendo
y el botón de WhatsApp funciona igual. El botón «Abrir el asistente» vive
dentro de un `<span data-asistente-cta hidden>` que solo muestra
`js/asistente.js` cuando el chat está realmente disponible: así nunca queda un
botón que no hace nada.

Si algún día quieres volver a enseñar proyectos, el sitio natural es entre
`#agentes` y `#pruebalo`.

## SEO y dominio

- Las URLs absolutas (`canonical`, `og:url`, `og:image`, JSON-LD, `sitemap.xml`, `robots.txt`) apuntan a `https://rauulg-20.github.io/Raul_portfolio/`. Si algún día conectas un dominio propio, busca esa URL y sustitúyela, y añade un archivo `CNAME` con el dominio en la raíz.
- Al ser una web de proyecto (con `/Raul_portfolio/` en la ruta), los buscadores solo leen el `robots.txt` de la raíz del dominio; para que Google conozca el sitemap, envíalo desde Google Search Console.

## Accesibilidad

- HTML semántico, un único `<h1>` y jerarquía de encabezados sin saltos de nivel.
- Enlace "saltar al contenido", foco visible (filete de 2 px en pino), navegación completa con teclado (las pestañas se manejan con las flechas, Inicio y Fin).
- Menú móvil accesible (`aria-expanded`, cierre con `Esc`).
- Contraste comprobado: todos los pares de texto y fondo superan WCAG AA (4,5:1). Los valores están en `DESIGN.md`.
- `prefers-reduced-motion` respetado, en CSS y en JavaScript.

## Licencia

Código y contenido de uso personal para Raúl Gil Gonzalez. No incluye licencia de código abierto.
