/**
 * Asistente de IA de la web: botón flotante + ventana de chat.
 *
 * Habla con el Worker de Cloudflare de la carpeta agente/. Para activarlo, pon
 * la URL del Worker en el atributo data-endpoint de su <script> en index.html.
 * Sin URL no se muestra nada.
 *
 * El historial se guarda en sessionStorage (se borra al cerrar la pestaña) y
 * se reenvía tal cual en cada mensaje: el modelo exige que no se modifique.
 */
(function () {
  'use strict';

  var script = document.currentScript;
  var ENDPOINT = script ? (script.getAttribute('data-endpoint') || '').trim() : '';
  if (!ENDPOINT) return;

  var WHATSAPP = '34658953935';
  var CLAVE_SESION = 'asistente-raul-v1';
  var MAX_CARACTERES = 600;
  var BIENVENIDA = '¡Hola! Soy el asistente virtual de Raúl. Puedo contarte qué servicios ofrece, cuánto cuestan o cómo trabaja. ¿En qué te ayudo?';
  var SUGERENCIAS = ['¿Cuánto cuesta una web?', '¿Qué hace un agente de IA?', '¿Cómo trabajas?', 'Quiero hablar con Raúl'];
  var TEXTO_DERIVACION = 'Te he preparado un mensaje para Raúl. Puedes enviárselo por WhatsApp con el botón.';
  var TEXTO_VACIO = 'Perdona, no he sabido responder a eso. ¿Me lo puedes preguntar de otra forma?';
  var ERROR_GENERICO = 'No he podido responder ahora mismo. Prueba de nuevo en un momento o escribe a Raúl por WhatsApp.';
  var ERROR_RED = 'No he podido conectar. Revisa tu conexión e inténtalo de nuevo, o escribe a Raúl por WhatsApp.';

  /* ---------- Estado ---------- */
  var nuevoEstado = function () { return { history: [], items: [], limite: false }; };
  var estado = nuevoEstado();
  try {
    var guardado = JSON.parse(sessionStorage.getItem(CLAVE_SESION) || 'null');
    if (guardado && Array.isArray(guardado.history) && Array.isArray(guardado.items)) estado = guardado;
  } catch (e) { /* sin almacenamiento: conversación solo en memoria */ }

  var guardar = function () {
    try { sessionStorage.setItem(CLAVE_SESION, JSON.stringify(estado)); } catch (e) { /* lleno o bloqueado */ }
  };
  var ocupado = false;

  /* ---------- Utilidades de DOM ---------- */
  var crear = function (tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = texto;
    return n;
  };
  var icono = function (id) {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS(NS, 'use');
    use.setAttribute('href', '#' + id);
    svg.appendChild(use);
    return svg;
  };
  var enlaceWhatsApp = function (texto) {
    return 'https://wa.me/' + WHATSAPP + (texto ? '?text=' + encodeURIComponent(texto) : '');
  };

  // Texto del modelo -> nodos seguros (nunca innerHTML): quita restos de markdown
  // y convierte las URL en enlaces.
  var textoConEnlaces = function (texto) {
    var limpio = String(texto).replace(/\*\*(.+?)\*\*/g, '$1').replace(/^#{1,6}\s+/gm, '');
    var frag = document.createDocumentFragment();
    var partes = limpio.split(/(https?:\/\/[^\s)]+)/g);
    partes.forEach(function (parte, i) {
      if (i % 2 === 1) {
        var url = parte.replace(/[.,;:!?]+$/, '');
        var a = crear('a', '', url);
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        frag.appendChild(a);
        if (url.length < parte.length) frag.appendChild(document.createTextNode(parte.slice(url.length)));
      } else if (parte) {
        frag.appendChild(document.createTextNode(parte));
      }
    });
    return frag;
  };

  /* ---------- Estructura ---------- */
  var lanzador = crear('button', 'asistente-lanzador');
  lanzador.type = 'button';
  lanzador.setAttribute('aria-expanded', 'false');
  lanzador.setAttribute('aria-controls', 'asistente');
  lanzador.setAttribute('aria-label', 'Abrir el asistente virtual');
  var lanzadorIcono = crear('span', 'asistente-lanzador__icono');
  lanzadorIcono.appendChild(icono('icon-bot'));
  lanzador.appendChild(lanzadorIcono);
  lanzador.appendChild(crear('span', 'asistente-lanzador__texto', '¿Dudas? Pregúntame'));

  var panel = crear('section', 'asistente');
  panel.id = 'asistente';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'asistente-titulo');
  panel.hidden = true;

  var cabecera = crear('div', 'asistente__cabecera');
  var avatar = crear('span', 'chat-card__avatar');
  avatar.appendChild(icono('icon-bot'));
  var quien = crear('div', 'asistente__quien');
  var titulo = crear('p', 'asistente__titulo', 'Asistente de Raúl');
  titulo.id = 'asistente-titulo';
  var subtitulo = crear('p', 'asistente__subtitulo');
  var punto = crear('span', 'status-dot status-dot--sm');
  punto.setAttribute('aria-hidden', 'true');
  subtitulo.appendChild(punto);
  subtitulo.appendChild(document.createTextNode('Agente de IA · responde al momento'));
  quien.appendChild(titulo);
  quien.appendChild(subtitulo);

  var acciones = crear('div', 'asistente__acciones');
  var botonNueva = crear('button', 'asistente__boton-icono');
  botonNueva.type = 'button';
  botonNueva.setAttribute('aria-label', 'Empezar una conversación nueva');
  botonNueva.title = 'Conversación nueva';
  botonNueva.appendChild(icono('icon-plus'));
  var botonCerrar = crear('button', 'asistente__boton-icono');
  botonCerrar.type = 'button';
  botonCerrar.setAttribute('aria-label', 'Cerrar el asistente');
  botonCerrar.appendChild(icono('icon-close'));
  acciones.appendChild(botonNueva);
  acciones.appendChild(botonCerrar);

  cabecera.appendChild(avatar);
  cabecera.appendChild(quien);
  cabecera.appendChild(acciones);

  var registro = crear('div', 'asistente__registro');
  registro.setAttribute('role', 'log');
  registro.setAttribute('aria-live', 'polite');

  var sugerencias = crear('div', 'asistente__sugerencias');
  SUGERENCIAS.forEach(function (s) {
    var b = crear('button', 'asistente__sugerencia', s);
    b.type = 'button';
    b.addEventListener('click', function () { enviar(s); });
    sugerencias.appendChild(b);
  });

  var formulario = crear('form', 'asistente__formulario');
  var etiqueta = crear('label', 'visually-hidden', 'Escribe tu pregunta');
  etiqueta.htmlFor = 'asistente-entrada';
  var entrada = crear('textarea', 'asistente__entrada');
  entrada.id = 'asistente-entrada';
  entrada.rows = 1;
  entrada.maxLength = MAX_CARACTERES;
  entrada.placeholder = 'Escribe tu pregunta…';
  var botonEnviar = crear('button', 'asistente__enviar');
  botonEnviar.type = 'submit';
  botonEnviar.setAttribute('aria-label', 'Enviar');
  botonEnviar.appendChild(icono('icon-arrow-up'));
  formulario.appendChild(etiqueta);
  formulario.appendChild(entrada);
  formulario.appendChild(botonEnviar);

  var nota = crear('p', 'asistente__nota', 'Asistente con IA: puede equivocarse. No compartas datos sensibles. ');
  var notaEnlace = crear('a', '', 'Hablar con Raúl');
  notaEnlace.href = enlaceWhatsApp('Hola Raúl, vengo de tu web y me gustaría hablar contigo.');
  notaEnlace.target = '_blank';
  notaEnlace.rel = 'noopener noreferrer';
  nota.appendChild(notaEnlace);

  panel.appendChild(cabecera);
  panel.appendChild(registro);
  panel.appendChild(sugerencias);
  panel.appendChild(formulario);
  panel.appendChild(nota);

  var escribiendo = crear('p', 'chat-typing');
  escribiendo.innerHTML = '<span></span><span></span><span></span>';
  escribiendo.appendChild(crear('span', 'visually-hidden', 'El asistente está escribiendo'));

  document.body.appendChild(lanzador);
  document.body.appendChild(panel);

  /* ---------- Mensajes ---------- */
  var botonReinicio = function () {
    var b = crear('button', 'btn btn--secondary btn--sm asistente__reiniciar', 'Empezar una conversación nueva');
    b.type = 'button';
    b.addEventListener('click', reiniciar);
    return b;
  };

  var nodoMensaje = function (item) {
    if (item.tipo === 'visitante') return crear('p', 'chat-bubble chat-bubble--user', item.texto);

    if (item.tipo === 'asistente') {
      var p = crear('p', 'chat-bubble chat-bubble--agent');
      p.appendChild(textoConEnlaces(item.texto));
      return p;
    }

    if (item.tipo === 'derivacion') {
      var caja = crear('div', 'asistente__derivacion');
      caja.appendChild(crear('p', 'asistente__derivacion-etiqueta', 'Mensaje para Raúl'));
      caja.appendChild(crear('blockquote', '', item.texto));
      var wa = crear('a', 'btn btn--primary btn--sm');
      wa.href = enlaceWhatsApp(item.texto);
      wa.target = '_blank';
      wa.rel = 'noopener noreferrer';
      wa.appendChild(document.createTextNode('Enviar por WhatsApp'));
      wa.appendChild(icono('icon-arrow-right'));
      caja.appendChild(wa);
      return caja;
    }

    // error o límite
    var aviso = crear('div', 'asistente__aviso');
    aviso.appendChild(crear('p', '', item.texto));
    var enlaces = crear('div', 'asistente__aviso-acciones');
    var waAviso = crear('a', 'link-arrow', 'Escribir a Raúl por WhatsApp');
    waAviso.href = enlaceWhatsApp('Hola Raúl, vengo de tu web y tengo una pregunta.');
    waAviso.target = '_blank';
    waAviso.rel = 'noopener noreferrer';
    enlaces.appendChild(waAviso);
    if (item.reiniciar) enlaces.appendChild(botonReinicio());
    aviso.appendChild(enlaces);
    return aviso;
  };

  var bajarAlFinal = function () { registro.scrollTop = registro.scrollHeight; };

  var anadir = function (item) {
    estado.items.push(item);
    registro.insertBefore(nodoMensaje(item), escribiendo.parentNode === registro ? escribiendo : null);
    sugerencias.hidden = true;
    bajarAlFinal();
  };

  var pintarTodo = function () {
    registro.textContent = '';
    registro.appendChild(crear('p', 'chat-bubble chat-bubble--agent', BIENVENIDA));
    estado.items.forEach(function (item) { registro.appendChild(nodoMensaje(item)); });
    sugerencias.hidden = estado.items.length > 0;
    actualizarFormulario();
    bajarAlFinal();
  };

  var actualizarFormulario = function () {
    entrada.disabled = estado.limite;
    entrada.placeholder = estado.limite ? 'Conversación terminada' : 'Escribe tu pregunta…';
    botonEnviar.disabled = ocupado || estado.limite || !entrada.value.trim();
  };

  var ajustarAltura = function () {
    entrada.style.height = 'auto';
    entrada.style.height = Math.min(entrada.scrollHeight, 128) + 'px';
  };

  /* ---------- Envío ---------- */
  var enviar = function (texto) {
    texto = String(texto || '').trim().slice(0, MAX_CARACTERES);
    if (!texto || ocupado || estado.limite) return;

    anadir({ tipo: 'visitante', texto: texto });
    entrada.value = '';
    ajustarAltura();
    ocupado = true;
    registro.appendChild(escribiendo);
    bajarAlFinal();
    actualizarFormulario();

    var historialEnviado = estado.history;
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: historialEnviado, message: texto })
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (datos) {
          return { ok: res.ok, datos: datos || {} };
        });
      })
      .then(function (r) {
        var d = r.datos;
        if (escribiendo.parentNode) escribiendo.remove();
        if (!r.ok) {
          anadir({ tipo: 'aviso', texto: d.message || ERROR_GENERICO, reiniciar: d.error === 'historial' });
          return;
        }
        // Se añade el turno tal cual llega: nunca se modifica el historial ya enviado.
        if (Array.isArray(d.turn) && d.turn.length) estado.history = historialEnviado.concat(d.turn);
        if (d.limitReached) {
          estado.limite = true;
          anadir({ tipo: 'aviso', texto: d.reply || ERROR_GENERICO, reiniciar: true });
          return;
        }
        var respuesta = d.reply || (d.handoff ? TEXTO_DERIVACION : TEXTO_VACIO);
        anadir({ tipo: 'asistente', texto: respuesta });
        if (d.handoff && d.handoff.resumen) anadir({ tipo: 'derivacion', texto: d.handoff.resumen });
      })
      .catch(function () {
        if (escribiendo.parentNode) escribiendo.remove();
        anadir({ tipo: 'aviso', texto: ERROR_RED });
      })
      .then(function () {
        ocupado = false;
        actualizarFormulario();
        guardar();
        if (!panel.hidden && !estado.limite) entrada.focus();
      });
  };

  var reiniciar = function () {
    if (ocupado) return;
    estado = nuevoEstado();
    guardar();
    pintarTodo();
    entrada.focus();
  };

  /* ---------- Abrir y cerrar ---------- */
  var abrir = function () {
    if (panel.hidden) {
      panel.hidden = false;
      lanzador.setAttribute('aria-expanded', 'true');
      lanzador.setAttribute('aria-label', 'Cerrar el asistente virtual');
      document.documentElement.classList.add('asistente-abierto');
      bajarAlFinal();
    }
    (estado.limite ? botonNueva : entrada).focus();
  };
  var cerrar = function () {
    panel.hidden = true;
    lanzador.setAttribute('aria-expanded', 'false');
    lanzador.setAttribute('aria-label', 'Abrir el asistente virtual');
    document.documentElement.classList.remove('asistente-abierto');
    lanzador.focus();
  };

  lanzador.addEventListener('click', function () { if (panel.hidden) abrir(); else cerrar(); });
  botonCerrar.addEventListener('click', cerrar);
  botonNueva.addEventListener('click', reiniciar);
  panel.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.stopPropagation(); cerrar(); }
  });
  formulario.addEventListener('submit', function (e) { e.preventDefault(); enviar(entrada.value); });
  entrada.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); enviar(entrada.value); }
  });
  entrada.addEventListener('input', function () { ajustarAltura(); actualizarFormulario(); });

  // Cualquier botón con data-open-assistant abre el chat (p. ej. en la sección de agentes)
  document.addEventListener('click', function (e) {
    var disparador = e.target.closest && e.target.closest('[data-open-assistant]');
    if (disparador) { e.preventDefault(); abrir(); }
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-asistente-cta]'), function (n) { n.hidden = false; });

  pintarTodo();
})();
