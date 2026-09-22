# Raúl Gil Gonzalez — Web personal

Portfolio y web comercial de **Raúl Gil Gonzalez**, estudiante de Ingeniería Informática en Cáceres y desarrollador web. Funciona como carta de presentación, portfolio y landing de servicios (precios, proceso de trabajo, FAQ y contacto).

Sitio 100% estático — sin backend, sin base de datos, sin build obligatorio — pensado para publicarse en **GitHub Pages**.

## Tecnologías

HTML5, CSS3 y JavaScript "vanilla", sin frameworks ni dependencias de build.

¿Por qué esta elección y no React/Vite? Para una web de una sola página, con contenido que no cambia constantemente, un stack estático es más rápido de cargar, no depende de un paso de compilación, no tiene el problema de rutas de una SPA en GitHub Pages, y es más fácil de mantener para alguien que quiera tocar un texto o un precio sin tener que instalar nada. Si el proyecto creciera mucho (varias páginas, contenido dinámico, un blog...) tendría sentido reconsiderarlo.

- **HTML**: `index.html`, `404.html` — semántico, con metadatos SEO/Open Graph y datos estructurados (JSON-LD).
- **CSS**: `css/styles.css` — variables CSS (colores, tipografía, espaciados), sin preprocesador, mobile-first.
- **JS**: `js/main.js` — menú móvil, animaciones al hacer scroll, año dinámico del footer. Todo con mejora progresiva: si JavaScript no carga, la web se sigue viendo y leyendo bien.
- **Fuentes**: Space Grotesk (títulos) e Inter (texto), vía Google Fonts.
- **Iconos**: SVG propios (sprite en `index.html`), sin librerías externas.

## Estructura del proyecto

```
├── index.html          página principal
├── 404.html             página de error 404
├── css/styles.css       estilos (todo el diseño)
├── js/main.js           interactividad (menú, animaciones, año)
├── assets/              favicon, iconos, imagen de vista previa (Open Graph)
├── robots.txt
├── sitemap.xml
├── site.webmanifest     metadatos para "añadir a pantalla de inicio"
└── .nojekyll             evita que GitHub Pages procese el sitio con Jekyll
```

## Instalación y ejecución local

No hace falta instalar nada (no hay `npm install` ni dependencias). Basta con abrir `index.html` en un navegador, aunque para que rutas relativas y `fetch` funcionen igual que en producción es mejor servirlo con un servidor local simple:

```bash
# Opción 1: con Python (si lo tienes instalado)
python -m http.server 8000

# Opción 2: con Node (si lo tienes instalado)
npx serve .
```

Y abrir `http://localhost:8000` (o el puerto que indique la herramienta).

No hay paso de "build": los archivos de `index.html`, `css/` y `js/` son directamente los que se publican, tal cual.

## Publicarlo en GitHub Pages

1. Crea un repositorio nuevo en GitHub. Si quieres que la web viva en la raíz de `tuusuario.github.io` (sin `/nombre-repo/` en la URL), el repositorio debe llamarse **exactamente** `tuusuario.github.io`. Si usas otro nombre de repositorio, la web quedará en `tuusuario.github.io/nombre-repo/` (funciona igual, solo cambia la URL) — todas las rutas del proyecto son relativas, así que no hay que tocar nada en el código para que funcione en cualquiera de los dos casos.
2. Sube los archivos:
   ```bash
   git init
   git add .
   git commit -m "Primera versión de la web"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
   git push -u origin main
   ```
3. En GitHub, entra en **Settings → Pages**.
4. En "Build and deployment" → **Source**, elige **Deploy from a branch**.
5. En **Branch**, elige `main` y la carpeta `/ (root)`. Guarda.
6. Espera un par de minutos y la web estará disponible en la URL que GitHub Pages indique en esa misma pantalla.

No hace falta ninguna configuración adicional (no hay GitHub Actions, no hay build): el archivo `.nojekyll` ya le dice a GitHub Pages que sirva los archivos tal cual, sin procesarlos.

### Actualizar la web más adelante

Cada vez que quieras publicar un cambio:

```bash
git add .
git commit -m "Describe aquí el cambio"
git push
```

GitHub Pages se actualiza solo, unos minutos después del `push`.

## Personalización

Todo el contenido (textos, precios, datos de contacto) está escrito directamente en el HTML — no hay un panel de administración ni un archivo de configuración central, porque para una web de una sola página añadir esa capa habría sido complicar algo que puede resolverse con un buscar-y-reemplazar. Los sitios donde se repite cada dato son estos:

| Dato | Dónde buscarlo | Aparece en |
|---|---|---|
| Nombre | `Raúl Gil Gonzalez` | Título, cabecera, hero, footer, metadatos |
| WhatsApp | `34658953935` (el número, sin `+` ni espacios) | Botones de WhatsApp (`wa.me`), en `index.html` |
| Instagram | `rauulg_20` | Enlaces a Instagram |
| Email | `rauulg2008@gmail.com` | Botones de email (`mailto:`) |
| Precios | `99 €`, `199 €`, `399 €`, `30 €/mes` | Sección `#precios` |

Un editor de código con "buscar en todos los archivos" (Ctrl+Shift+F en VS Code) encuentra todas las apariciones de golpe.

**Nota sobre los enlaces de WhatsApp:** cada botón de precio incluye un mensaje predefinido distinto (por ejemplo, "...me interesa el plan Medium..."). Si cambias el número de WhatsApp, busca `wa.me/34658953935` y sustitúyelo en cada aparición.

### Añadir la foto de perfil

La sección "Sobre mí" ya está preparada para mostrar una foto tuya: solo falta guardar el archivo de imagen en:

```
assets/raul-perfil.jpg
```

(Formato vertical, idealmente proporción 4:5 — por ejemplo 1000×1250 px — para que encaje bien en el marco ya diseñado. Si usas otro nombre de archivo o formato, actualiza el `src` en `index.html`, dentro de la sección `id="sobre-mi"`.)

### Cambiar el dominio en el SEO

Antes de publicar, busca `raulgilgonzalez.github.io` en estos archivos y sustitúyelo por tu URL real de GitHub Pages (la sabrás después del primer despliegue, o antes si vas a usar un dominio propio):

- `index.html` (etiquetas `canonical`, `og:url`, `og:image`, JSON-LD)
- `404.html` (`canonical`)
- `robots.txt` (línea `Sitemap:`)
- `sitemap.xml` (`<loc>`)

Si más adelante conectas un dominio propio (por ejemplo `raulgil.dev`), añade un archivo `CNAME` en la raíz del proyecto con ese dominio dentro, y configúralo también en Settings → Pages → Custom domain.

## Añadir futuros proyectos al portfolio

La sección "Proyectos" (`id="proyectos"`) tiene una tarjeta destacada (Nevila) y una tarjeta "fantasma" invitando a contactar. Para añadir un proyecto nuevo:

1. Copia el bloque `<article class="project-card project-card--featured">...</article>` completo (está en `index.html`, dentro de `<div class="projects-grid">`).
2. Pégalo antes de la tarjeta "fantasma" (`project-card--ghost`) y cambia el título, la descripción, las etiquetas (`<span class="tag">`) y el enlace.
3. Si ya tienes dos o más proyectos reales, puedes quitar la tarjeta "fantasma" o dejarla al final.

No hay límite técnico de proyectos: la cuadrícula (`.projects-grid`) se reorganiza sola.

## Accesibilidad y SEO — qué incluye

- HTML semántico (`header`, `nav`, `main`, `section`, `footer`), un único `<h1>`, jerarquía de encabezados correcta.
- Enlace "saltar al contenido", estados de foco visibles, navegación completa por teclado.
- Menú móvil accesible (`aria-expanded`, cierre con `Esc`).
- Contraste de color comprobado en textos y botones.
- `prefers-reduced-motion` respetado: quien lo tenga activado en su sistema no ve animaciones.
- Metadatos: title, meta description, Open Graph, Twitter Card, canonical, `robots.txt`, `sitemap.xml`, datos estructurados (schema.org/Person).

## Licencia

Código y contenido de uso personal para Raúl Gil Gonzalez. No incluye licencia de código abierto.
