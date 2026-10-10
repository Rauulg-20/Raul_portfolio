# Raúl Gil Gonzalez — Páginas web y agentes de IA

Web personal y comercial de **Raúl Gil Gonzalez**, estudiante de Ingeniería Informática en Cáceres: portfolio, presentación y escaparate de sus dos servicios — **páginas web** y **agentes de IA** para negocios (atención al cliente, captación de clientes y reservas) — con precios, packs, proceso de trabajo, FAQ y contacto.

**Publicada en:** https://rauulg-20.github.io/Raul_portfolio/

Sitio 100 % estático — sin backend, sin base de datos y sin paso de compilación — servido con **GitHub Pages**.

## Tecnologías

HTML5, CSS3 y JavaScript "vanilla", sin frameworks ni dependencias.

¿Por qué no React/Vite? Para una web de una sola página, un stack estático carga más rápido, no necesita compilar nada, no tiene el problema de rutas de una SPA en GitHub Pages y se puede editar un texto o un precio sin instalar nada. Si el proyecto creciera mucho (varias páginas, blog, contenido dinámico) tendría sentido reconsiderarlo.

- **`index.html`** — todo el contenido, con metadatos SEO, Open Graph y datos estructurados (JSON-LD).
- **`css/styles.css`** — diseño completo con variables CSS (colores, tipografía, espaciados), mobile-first.
- **`js/main.js`** — interactividad. Todo es mejora progresiva: si JavaScript no carga, la web se sigue viendo y leyendo entera (las pestañas se muestran todas seguidas y no hay animaciones).
- **Fuentes**: Space Grotesk (títulos) e Inter (texto), vía Google Fonts.
- **Iconos**: SVG propios en un sprite al principio de `index.html`.

### Efectos de movimiento

Todo el movimiento está ligado al scroll o al ratón — nada se mueve solo — y se desactiva por completo si el sistema del visitante tiene activado "reducir movimiento".

| Efecto | Cómo se controla |
|---|---|
| Parallax por capas (fondos, ventana de código, chat, foto, captura de Nevila) | Atributo `data-parallax="velocidad"`. Positivo = la capa va más lenta que el scroll (se ve "al fondo"); negativo = más rápida ("delante"). `data-parallax-max="px"` limita el recorrido. |
| Profundidad con el ratón en el hero (solo escritorio) | `data-depth="n"` en cada capa: cuanto mayor, más se desplaza. |
| Banda de texto a dos velocidades | `data-velocity-row="factor"` en cada fila (el signo marca la dirección). |
| Foco de luz e inclinación 3D en tarjetas (solo escritorio) | `data-spotlight` y `data-tilt`. |
| Aparición al hacer scroll | `data-reveal` (y `data-reveal-delay="1..4"` para escalonar). |
| Contador de la nota y conversación de ejemplo que se escribe sola | Se activan tras el primer scroll de una persona; un buscador que renderice la página ve siempre el estado final (12,928 y la conversación completa). |

## Estructura

```
├── index.html          página principal
├── 404.html            página de error 404
├── css/styles.css      estilos
├── js/main.js          interactividad
├── assets/             favicon, iconos, foto, captura de Nevila, imagen para redes (og-image.png)
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
| Email | `rauulg2008@gmail.com` | Botones de email |
| Precios webs | `99 €`, `199 €`, `399 €`, `30 €/mes` | Pestaña "Webs" de `#precios`, pilar de servicios |
| Precios agentes | `350 €`, `49 €/mes` | Sección `#agentes`, pestaña "Agentes IA", pilar de servicios, FAQ |
| Packs | `399 €`, `499 €`, `699 €`, `69 €/mes` y los importes "Por separado" / "Ahorras" | Pestaña "Packs" |

**Mensajes de WhatsApp:** cada botón lleva su mensaje predefinido en el atributo `data-wa` (por ejemplo `data-wa="Hola Raúl, me interesa el agente de reservas."`). Para cambiar un mensaje, edita ese texto; si cambias un precio, revisa también el `data-wa` del botón correspondiente, que lo menciona.

**Enlaces directos a pestañas:** `…/Raul_portfolio/#precios-agentes`, `#precios-packs` o `#faq-agentes` abren la página directamente en esa pestaña (útil para mandar por WhatsApp o Instagram).

### Cambiar la foto o la captura

- Foto de perfil: `assets/raul-perfil.jpg` (vertical; se recorta a proporción 3:4).
- Captura de Nevila: `assets/proyecto-nevila.png` (horizontal).
- Imagen para redes: `assets/og-image.png` (1200 × 630 px).

Si usas otro nombre de archivo, actualiza el `src` correspondiente en `index.html`.

## Añadir proyectos al portfolio

La sección `#proyectos` tiene la tarjeta destacada de Nevila y debajo una franja "¿Tu web o tu agente, los siguientes?". Para añadir un proyecto:

1. Copia el bloque `<article class="project-card project-card--featured">…</article>`.
2. Pégalo justo debajo y cambia el título, la descripción, las etiquetas (`<span class="tag">`), la captura y el enlace.
3. Con dos o más proyectos reales puedes quitar la franja o dejarla al final.

## SEO y dominio

- Las URLs absolutas (`canonical`, `og:url`, `og:image`, JSON-LD, `sitemap.xml`, `robots.txt`) apuntan a `https://rauulg-20.github.io/Raul_portfolio/`. Si algún día conectas un dominio propio, busca esa URL y sustitúyela, y añade un archivo `CNAME` con el dominio en la raíz.
- Al ser una web de proyecto (con `/Raul_portfolio/` en la ruta), los buscadores solo leen el `robots.txt` de la raíz del dominio; para que Google conozca el sitemap, envíalo desde Google Search Console.

## Accesibilidad

- HTML semántico, un único `<h1>`, jerarquía de encabezados correcta.
- Enlace "saltar al contenido", foco visible, navegación completa con teclado (las pestañas se manejan con las flechas).
- Menú móvil accesible (`aria-expanded`, cierre con `Esc`).
- Contraste comprobado en textos y botones.
- `prefers-reduced-motion` respetado.

## Licencia

Código y contenido de uso personal para Raúl Gil Gonzalez. No incluye licencia de código abierto.
