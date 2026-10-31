# Dirección de arte — «Tinta»

Documento de referencia del diseño de la web. Si vas a cambiar algo visual,
lee esto antes: explica **por qué** cada decisión está tomada, para que la web
siga siendo coherente y no acabe pareciendo una plantilla.

## La idea

La web está diseñada como **un impreso a dos tintas**: papel crema con grano,
verde botella y ámbar. No está iluminada por dentro —no hay resplandores, ni
degradados, ni cristal— está *impresa*. Esa es la diferencia con las webs
generadas automáticamente, que siempre tiran de luz y de brillo.

El producto que se vende no es un chat: es **un parte de trabajo**. Por la
mañana abres el correo y sabes a quién llamar primero. De ahí salen el hero,
la escala de prioridad y hasta la marca.

**Los tres detalles que firman el diseño:**

1. **El parte del hero.** La salida real del producto —los contactos de la
   noche ordenados por urgencia—, no una burbuja de chat genérica.
2. **La marca.** Tres barras decrecientes: urgente, templado, frío. Es la
   escala de prioridad del producto convertida en logotipo.
3. **La cursiva.** La palabra clave de cada titular va en serif cursiva
   ámbar. Es el único sitio donde aparece el serif, y por eso se nota.

## Color

Dos tintas sobre papel. Nada decorativo.

| Token | Valor | Para qué |
|---|---|---|
| `--paper` | `#F2EDE3` | Lienzo. Crema cálido |
| `--paper-2` | `#E8E1D3` | Bloques hundidos, filas alternas |
| `--paper-3` | `#DCD3C1` | Rellenos de refuerzo |
| `--ink` | `#15130F` | Texto principal, filetes fuertes |
| `--ink-muted` | `#57514A` | Texto secundario |
| `--ink-subtle` | `#676158` | Metadatos y notas |
| `--green` | `#0F3D30` | **Primera tinta.** Campos a sangre, botones, cabeceras |
| `--green-deep` | `#0A2C23` | Footer y cursiva sobre ámbar |
| `--amber` | `#C8761A` | **Segunda tinta.** Rellenos, tramas, acentos |
| `--hairline` | `#CFC6B4` | El filete: el recurso estructural de toda la web |

**El ámbar tiene tres valores y no son intercambiables.** El ámbar vivo es
precioso como relleno pero no alcanza AA como texto pequeño sobre papel:

- `--amber` `#C8761A` — rellenos, tramas, filetes, barras. Texto encima: `--on-amber`.
- `--amber-text` `#96540B` — cuando hace falta **texto** ámbar sobre papel (5,0:1).
- `--amber-light` `#E09A3E` — acentos **sobre verde** (5,1:1). Nunca sobre ámbar: se borra.

Sobre el campo ámbar, el texto secundario usa `--on-amber-muted` `#2A200D`
(4,6:1). El `#3A2A10` que parece razonable se queda en 3,99 y no vale.

**Escala de señal** — solo para prioridad de contactos. Tiene significado, no
es decoración:

| Token | Valor | Significado |
|---|---|---|
| `--signal-high` | `#9E3A1F` | Urgente |
| `--signal-mid` | `#7E5910` | Templado |
| `--signal-low` | `#5F676B` | Frío |

**Comprobado:** ningún par de texto y fondo de la web baja de WCAG AA. La
verificación se hace sobre el DOM renderizado, no sobre la paleta en teoría.

**Prohibido:** degradados azul→morado, resplandores, orbes difuminados,
`backdrop-filter` decorativo, sombras proyectadas, una tercera tinta.

## Tipografía

Una superfamilia, tres papeles. **IBM Plex.**

- **Display** — Plex Sans **300** en tamaños grandes. Grande y ligero, no
  grande y gordo. Nunca 700 en display.
- **Acento** — Plex **Serif cursiva** para la palabra clave del titular, en
  ámbar. Es el contraste que da carácter. Una por titular, no más.
- **Texto** — Plex Sans 400, con 600 para énfasis y UI.
- **Dato** — Plex Mono para cifras, precios, horas y marcadores, en **caja
  normal**. Las versales espaciadas ya son un tópico.

Interletrado cerrado conforme crece el tamaño (`-.04em` en display). Cifras y
precios con `tabular-nums` y `word-spacing` negativo: el espacio de la mono es
tan ancho que «1.200 €» se lee partido si no se cierra.

## Geometría y materia

- **Radios 0–2px.** La web es cuadrada.
- **Sin sombras.** Cero. La profundidad sale de los filetes, del color y del
  grano.
- **Filete de 1px** como separador: entre secciones, filas y columnas.
- **Grano** (`.grain`): capa fija de ruido SVG al 38 %, en `multiply`, sobre
  todo el contenido. Es lo que le da tacto de impreso. Va en `z-index:50`,
  por debajo de la cabecera y del asistente, que quedan limpios, y nunca
  intercepta el ratón.
- **Trama de semitono**: puntos de ámbar en `radial-gradient`, con máscara
  para que se desvanezca. Detrás del parte del hero. Es un recurso gráfico
  propio, no un resplandor.

## Ritmo

Lo que antes hacían diez degradados lo hacen aquí tres campos de color a
sangre:

```
hero  ·  datos  ·  sobre mí        →  papel
SERVICIOS                          →  VERDE
agentes                            →  papel
PRUÉBALO                           →  ÁMBAR
proceso                            →  papel
precios                            →  papel hundido
faq                                →  papel
CONTACTO                           →  VERDE
footer                             →  verde profundo
```

Composición **asimétrica**: raíl estrecho a la izquierda con el marcador de
sección, columna ancha a la derecha. Nada centrado por defecto.

## Movimiento

Discreto y motivado: cada movimiento dice algo.

1. **El carril del proceso.** En «De la idea a tenerlo funcionando», una línea
   ámbar se va llenando según bajas y los marcadores numerados se encienden al
   alcanzarlos. El movimiento *es* el proceso: por eso está ahí y no en otra
   sección. Sin JavaScript o con «reducir movimiento», el carril aparece
   completo y los marcadores en ámbar — un estado final, nunca uno a medias.
2. Las filas del parte entran escalonadas **una vez**, al cargar.
3. La conversación de ejemplo se escribe sola al entrar en pantalla.
4. En los botones, la segunda tinta entra **desde abajo** al pasar el ratón.
5. Los enlaces de texto **engordan** su subrayado, no lo estrenan.

No hay parallax, ni inclinación 3D, ni foco de luz, ni banda en marcha, ni
aparición por scroll en cada sección. Todo se desactiva con
`prefers-reduced-motion`.

## La prueba

Antes de añadir algo, la pregunta de control:

> ¿Habría hecho esto igual para cualquier otra web de servicios?

Si la respuesta es sí, es un valor por defecto y hay que repensarlo.
