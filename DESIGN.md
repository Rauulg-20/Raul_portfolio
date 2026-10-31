# Dirección de arte — «Parte»

Documento de referencia del diseño de la web. Si vas a cambiar algo visual,
lee esto antes: explica **por qué** cada decisión está tomada, para que la web
siga siendo coherente y no vuelva a parecer una plantilla.

## La idea

El producto que se vende no es un chat. Es **un parte de trabajo**: por la
mañana abres el correo y sabes a quién llamar primero. La web está diseñada
como ese documento — un informe bien compuesto, no un folleto con brillos.

De ahí salen todas las decisiones: retícula visible, filetes en vez de
tarjetas flotantes, números tabulares, tipografía de documento y un único
color de marca.

**El detalle que firma el diseño:** el panel de contactos triados del hero.
Es la salida real del producto (quién ha escrito, qué pide, con qué prioridad),
no una burbuja de chat genérica. La barra de prioridad y los dígitos monoespaciados
reaparecen en precios y en la ficha de contacto como motivo.

## Color

Seis colores con un papel asignado. Nada decorativo.

| Token | Valor | Para qué |
|---|---|---|
| `--paper` | `#F4F2ED` | Lienzo. Neutro cálido y de baja saturación |
| `--paper-2` | `#E8E5DD` | Filas alternas, bloques hundidos |
| `--paper-3` | `#DCD8CE` | Rellenos de refuerzo, barras |
| `--ink` | `#17191A` | Texto principal, filetes fuertes |
| `--ink-muted` | `#5A6063` | Texto secundario |
| `--ink-subtle` | `#686D70` | Metadatos, notas al pie |
| `--pine` | `#14453A` | **El único acento.** Marca, botones primarios, sección oscura |
| `--hairline` | `#D6D2C8` | El filete. El recurso estructural de toda la web |

**Escala de señal** — solo para prioridad de contactos. Tiene significado, no
es decoración, y por eso puede usar colores que en otro sitio serían ruido:

| Token | Valor | Significado |
|---|---|---|
| `--signal-high` | `#9E3A1F` | Urgente |
| `--signal-mid` | `#7E5910` | Templado |
| `--signal-low` | `#5F676B` | Frío |

Todos los pares de texto/fondo usados en la web superan WCAG AA (4,5:1).
Comprobado: `ink/paper` 15,8 · `ink-muted/paper` 5,7 · `pine/paper` 9,7 ·
`paper/pine` 9,7 · `ink-subtle/paper` 4,7.

**Prohibido:** degradados azul→morado, resplandores, orbes difuminados,
`backdrop-filter` decorativo, un segundo color de marca.

## Tipografía

**IBM Plex Sans** + **IBM Plex Mono**. Dos familias, tres papeles.

- **Display** — Plex Sans **300** en tamaños grandes. El peso ligero en títulos
  grandes es la firma tipográfica: da autoridad sin gritar. No usar 700 en display.
- **Texto** — Plex Sans 400, con 500/600 solo para énfasis y UI.
- **Dato** — Plex Mono para cifras, precios, horas, marcadores de sección y
  tablas. En **caja normal**, no en mayúsculas espaciadas (eso ya es un tópico).

El interletrado se cierra conforme crece el tamaño (`-0.03em` en display,
normal a 16px). Los números de tabla y los precios llevan `tabular-nums`.

## Geometría y materia

- **Radios 0–3px.** La web es cuadrada. Nada de 26px.
- **Sin sombras.** Cero. La profundidad se consigue con filetes y con fondo.
- **Filete de 1px** como separador: entre secciones, entre filas, entre columnas.
- **Barra de 3px** en el borde izquierdo para marcar prioridad o destacar.

## Ritmo

La web es clara de principio a fin con **una sola sección oscura** en pino, al
cierre (contacto). Ese contraste único hace el trabajo que en otras webs hacen
diez degradados. Las demás secciones se separan con filete y con cambios de
densidad, no alternando rellenos.

Composición **asimétrica**: raíl estrecho a la izquierda con el marcador de
sección en mono y los metadatos; columna ancha a la derecha con el contenido.
Nada centrado por defecto.

## Movimiento

Discreto y motivado. Solo hay tres cosas que se mueven:

1. Las filas del parte del hero entran escalonadas **una vez**, al cargar.
2. La conversación de ejemplo se escribe sola cuando entra en pantalla.
3. Estados de `hover`/`focus`: cambio de filete y de fondo, sin desplazamientos.

No hay parallax, ni inclinación 3D, ni foco de luz siguiendo al ratón, ni
banda de texto en marcha, ni aparición por scroll en todas las secciones.
Todo se desactiva con `prefers-reduced-motion`.

## La prueba

Antes de añadir algo, la pregunta de control:

> ¿Habría hecho esto igual para cualquier otra web de servicios?

Si la respuesta es sí, es un valor por defecto y hay que repensarlo.
