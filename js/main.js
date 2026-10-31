/**
 * Raúl Gil Gonzalez — Agentes de IA y páginas web
 * JS vanilla, sin dependencias. Mejora progresiva: si esto no se ejecuta,
 * la web sigue siendo 100 % funcional y legible (las pestañas se muestran
 * todas seguidas y no hay animaciones).
 *
 * El movimiento es deliberadamente escaso — ver DESIGN.md.
 */
(function () {
  'use strict';

  /* ---------- Configuración ---------- */
  // Número de WhatsApp (con prefijo de país, sin "+" ni espacios).
  // Todos los botones con atributo data-wa usan este número.
  var WHATSAPP_NUMBER = '34658953935';

  var root = document.documentElement;
  root.classList.add('js');

  var motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (motionOK) root.classList.add('motion');

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Enlaces de WhatsApp con mensaje predefinido ---------- */
  $$('[data-wa]').forEach(function (link) {
    var msg = link.getAttribute('data-wa');
    link.href = 'https://wa.me/' + WHATSAPP_NUMBER + (msg ? '?text=' + encodeURIComponent(msg) : '');
  });

  /* ---------- Menú móvil ---------- */
  var menuToggle = $('#menu-toggle');
  var mobileMenu = $('#mobile-menu');

  if (menuToggle && mobileMenu) {
    var menuIconUse = $('use', menuToggle);
    var isOpen = function () { return menuToggle.getAttribute('aria-expanded') === 'true'; };

    var setMenu = function (open) {
      mobileMenu.dataset.state = open ? 'open' : 'closed';
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      if (menuIconUse) menuIconUse.setAttribute('href', open ? '#icon-close' : '#icon-menu');
      document.body.style.overflow = open ? 'hidden' : '';
    };

    menuToggle.addEventListener('click', function () { setMenu(!isOpen()); });
    $$('a', mobileMenu).forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) { setMenu(false); menuToggle.focus(); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1100 && isOpen()) setMenu(false);
    });
  }

  /* ---------- Enlace activo en la navegación ---------- */
  var sections = $$('main > section[id]');
  if (sections.length && 'IntersectionObserver' in window) {
    var navLinks = $$('.nav__list a[href^="#"], .mobile-menu__list a[href^="#"]');
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (section) { navObserver.observe(section); });
  }

  /* ---------- Pestañas (precios y FAQ) ---------- */
  var tabGroups = [];
  // Enlace directo a una pestaña (#precios-agentes, #precios-packs, #faq-agentes...)
  var hashId = location.hash.length > 1 ? decodeURIComponent(location.hash.slice(1)) : '';
  var hashPanel = null;

  $$('[data-tabs]').forEach(function (group) {
    var tabs = $$('[role="tab"]', group);
    if (!tabs.length) return;
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    var current = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0];
    panels.forEach(function (panel, i) {
      if (panel && hashId && panel.id === hashId) { current = tabs[i]; hashPanel = panel; }
    });

    var activate = function (tab, focus) {
      current = tab;
      tabs.forEach(function (t, i) {
        var selected = t === tab;
        t.setAttribute('aria-selected', selected ? 'true' : 'false');
        t.tabIndex = selected ? 0 : -1;
        if (panels[i]) panels[i].hidden = !selected;
      });
      if (focus) tab.focus();
    };

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { activate(tab); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        if (next !== null) { e.preventDefault(); activate(tabs[next], true); }
      });
    });

    activate(current);
    tabGroups.push({ tabs: tabs, panels: panels, activate: activate });
  });

  var activatePanel = function (id) {
    for (var g = 0; g < tabGroups.length; g++) {
      for (var p = 0; p < tabGroups[g].panels.length; p++) {
        var panel = tabGroups[g].panels[p];
        if (panel && panel.id === id) { tabGroups[g].activate(tabGroups[g].tabs[p]); return panel; }
      }
    }
    return null;
  };

  // Enlaces que abren una pestaña concreta (p. ej. "Precios de agentes")
  $$('[data-tab-target]').forEach(function (link) {
    link.addEventListener('click', function () { activatePanel(link.getAttribute('data-tab-target')); });
  });

  // La pestaña del enlace directo ya está activa; solo falta llevar al usuario a su sección
  if (hashPanel) {
    var sectionFromHash = hashPanel.closest('section');
    if (sectionFromHash) setTimeout(function () { sectionFromHash.scrollIntoView(); }, 0);
  }

  /* ---------- Scroll: filete de la cabecera y carril del proceso ---------- */
  var header = $('#site-header');
  var proceso = $('.process');
  var pasos = proceso ? $$('.process__step', proceso) : [];

  // El carril solo se anima si hay movimiento permitido. Si no, el CSS lo deja
  // completo y los marcadores en ámbar: un estado final, no uno a medias.
  var carrilVivo = !!proceso && pasos.length > 0 && motionOK;
  if (carrilVivo) proceso.classList.add('is-live');

  // El marcador se centra sobre el carril; para saber dónde está hace falta el
  // tamaño del marcador (--marca) y el relleno superior del paso, que cambian
  // con el punto de ruptura. Se miden al cargar y al redimensionar, no en cada
  // fotograma.
  var marcaPx = 34, relleno = 24;
  var medir = function () {
    if (!carrilVivo) return;
    var rem = parseFloat(getComputedStyle(root).fontSize) || 16;
    var m = parseFloat(getComputedStyle(proceso).getPropertyValue('--marca'));
    if (m) marcaPx = m * rem;
    var pt = parseFloat(getComputedStyle(pasos[0]).paddingTop);
    if (pt) relleno = pt;
  };

  var actualizarCabecera = function () {
    if (header) header.classList.toggle('is-scrolled', (window.pageYOffset || root.scrollTop) > 8);
  };

  var actualizarCarril = function () {
    if (!carrilVivo) return;
    var limite = window.innerHeight * 0.62; // a partir de aquí un paso cuenta como alcanzado
    var caja = proceso.getBoundingClientRect();
    var centro = function (paso) {
      return paso.getBoundingClientRect().top + relleno + marcaPx / 2;
    };

    var alcanzados = 0;
    for (var i = 0; i < pasos.length; i++) {
      var ok = centro(pasos[i]) < limite;
      pasos[i].classList.toggle('is-reached', ok);
      if (ok) alcanzados++;
    }

    // El relleno del carril llega hasta el último marcador alcanzado.
    var avance = 0;
    if (alcanzados === pasos.length) {
      avance = 1;                                    // proceso recorrido entero
    } else if (alcanzados > 0) {
      var arriba = caja.top + marcaPx;               // el carril empieza y acaba
      var alto = caja.height - marcaPx * 2;          // a la altura de los marcadores
      if (alto > 0) {
        avance = (centro(pasos[alcanzados - 1]) - arriba) / alto;
        if (avance < 0) avance = 0; else if (avance > 1) avance = 1;
      }
    }
    proceso.style.setProperty('--avance', avance.toFixed(4));
  };

  var pendiente = false;
  var cuadro = function () {
    pendiente = false;
    actualizarCabecera();
    actualizarCarril();
  };
  var pedirCuadro = function () {
    if (!pendiente) { pendiente = true; requestAnimationFrame(cuadro); }
  };

  window.addEventListener('scroll', pedirCuadro, { passive: true });
  window.addEventListener('resize', function () { medir(); pedirCuadro(); });
  medir();
  cuadro();

  /* ---------- Hora local en Cáceres ---------- */
  // Un dato real: si son las 23:40 allí, se entiende por qué hace falta un agente.
  var clock = $('[data-clock]');
  var clockTime = $('[data-clock-time]');
  if (clock && clockTime && window.Intl && Intl.DateTimeFormat) {
    try {
      var fmt = new Intl.DateTimeFormat('es-ES', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Madrid'
      });
      var tick = function () { clockTime.textContent = fmt.format(new Date()); };
      tick();
      clock.hidden = false;
      setInterval(tick, 30000);
    } catch (e) { /* zona horaria no soportada: la hora simplemente no se muestra */ }
  }

  /* ---------- Conversación de ejemplo que se escribe sola ---------- */
  // Solo se prepara tras el primer scroll de una persona: así un buscador que
  // renderice la página ve siempre la conversación completa, nunca a medias.
  var demo = $('[data-chat-demo]');
  if (demo && motionOK && 'IntersectionObserver' in window) {
    var chatBody = $('.chat-demo__body', demo);
    var bubbles = $$('.chat-bubble', demo);
    var typing = $('.chat-typing', demo);

    var isOnScreen = function (el) {
      var r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    };

    var play = function () {
      var i = 0;
      var next = function () {
        if (i >= bubbles.length) { typing.hidden = true; return; }
        var bubble = bubbles[i];
        if (bubble.classList.contains('chat-bubble--agent')) {
          chatBody.insertBefore(typing, bubble);
          typing.hidden = false;
          setTimeout(function () {
            typing.hidden = true;
            bubble.classList.remove('is-pending');
            i++;
            setTimeout(next, 500);
          }, 1100);
        } else {
          bubble.classList.remove('is-pending');
          i++;
          setTimeout(next, 750);
        }
      };
      setTimeout(next, 300);
    };

    window.addEventListener('scroll', function () {
      if (isOnScreen(demo)) return; // ya a la vista: se queda la conversación completa
      // Reserva el alto final para que el resto de la página no salte
      chatBody.style.minHeight = chatBody.offsetHeight + 'px';
      bubbles.forEach(function (b) { b.classList.add('is-pending'); });
      var demoObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { observer.disconnect(); play(); }
        });
      }, { threshold: 0.45 });
      demoObserver.observe(demo);
    }, { once: true, passive: true });
  }

  /* ---------- Año dinámico en el footer ---------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
