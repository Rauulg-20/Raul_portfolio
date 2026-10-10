/**
 * Raúl Gil Gonzalez — Páginas web y agentes de IA
 * JS vanilla, sin dependencias. Mejora progresiva: si esto no se ejecuta,
 * la web sigue siendo 100 % funcional y legible (sin animaciones).
 */
(function () {
  'use strict';

  /* ---------- Configuración ---------- */
  // Número de WhatsApp (con prefijo de país, sin "+" ni espacios).
  // Todos los botones con atributo data-wa usan este número.
  var WHATSAPP_NUMBER = '34658953935';

  var root = document.documentElement;
  root.classList.add('js');

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var motionOK = !reducedMotion;
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
      if (window.innerWidth >= 1120 && isOpen()) setMenu(false);
    });
  }

  /* ---------- Aparición al hacer scroll ---------- */
  var revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
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
    var indicator = $('.tabs__indicator', group);
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    var current = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0];
    panels.forEach(function (panel, i) {
      if (panel && hashId && panel.id === hashId) { current = tabs[i]; hashPanel = panel; }
    });

    var moveIndicator = function () {
      if (!indicator) return;
      indicator.style.width = current.offsetWidth + 'px';
      indicator.style.transform = 'translateX(' + current.offsetLeft + 'px)';
    };

    var activate = function (tab, focus) {
      current = tab;
      tabs.forEach(function (t, i) {
        var selected = t === tab;
        t.setAttribute('aria-selected', selected ? 'true' : 'false');
        t.tabIndex = selected ? 0 : -1;
        if (panels[i]) panels[i].hidden = !selected;
      });
      moveIndicator();
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

    // Estado inicial sin animaciones (ni el indicador ni el color de las pestañas)
    var instant = tabs.concat(indicator ? [indicator] : []);
    instant.forEach(function (el) { el.style.transition = 'none'; });
    activate(current);
    void group.offsetWidth;
    instant.forEach(function (el) { el.style.transition = ''; });

    tabGroups.push({ tabs: tabs, panels: panels, activate: activate, move: moveIndicator });
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

  // Enlaces que abren una pestaña concreta (p. ej. "Ver precios de agentes")
  $$('[data-tab-target]').forEach(function (link) {
    link.addEventListener('click', function () { activatePanel(link.getAttribute('data-tab-target')); });
  });

  // La pestaña del enlace directo ya está activa; solo falta llevar al usuario a su sección
  if (hashPanel) {
    var sectionFromHash = hashPanel.closest('section');
    if (sectionFromHash) setTimeout(function () { sectionFromHash.scrollIntoView(); }, 0);
  }

  // Reajusta el indicador cuando cambian las medidas (tamaño de ventana o carga de fuentes)
  var refreshIndicators = function () { tabGroups.forEach(function (g) { g.move(); }); };
  window.addEventListener('resize', refreshIndicators);
  window.addEventListener('load', refreshIndicators);
  if (document.fonts) {
    if (document.fonts.ready) document.fonts.ready.then(refreshIndicators);
    if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', refreshIndicators);
  }

  /* ---------- Scroll: cabecera, barra de progreso, parallax y banda ---------- */
  var header = $('#site-header');
  var progress = $('.scroll-progress');

  var parallaxItems = $$('[data-parallax]').map(function (el) {
    return {
      el: el,
      ref: el.parentElement,
      // En el hero (arriba del todo) el desplazamiento parte de 0 y crece al hacer scroll;
      // en el resto de secciones es 0 cuando el bloque está centrado en pantalla.
      fromTop: !!el.closest('.hero'),
      speed: parseFloat(el.getAttribute('data-parallax')) || 0,
      max: parseFloat(el.getAttribute('data-parallax-max')) || 140
    };
  });

  var velocity = $('[data-velocity]');
  var velocityRows = velocity ? $$('[data-velocity-row]', velocity) : [];

  var updateChrome = function () {
    var y = window.pageYOffset || root.scrollTop;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (progress) {
      var max = root.scrollHeight - window.innerHeight;
      progress.style.setProperty('--progress', max > 0 ? Math.min(y / max, 1).toFixed(4) : '0');
    }
  };

  var updateParallax = function (vh) {
    var scrollY = window.pageYOffset || root.scrollTop;
    for (var i = 0; i < parallaxItems.length; i++) {
      var item = parallaxItems[i];
      var rect = item.ref.getBoundingClientRect();
      if (rect.bottom < -vh * 0.5 || rect.top > vh * 1.5) continue;
      var y = item.fromTop
        ? scrollY * item.speed
        : -((rect.top + rect.height / 2) - vh / 2) * item.speed;
      if (y > item.max) y = item.max; else if (y < -item.max) y = -item.max;
      item.el.style.setProperty('--py', y.toFixed(1) + 'px');
    }
  };

  var updateVelocity = function (vh) {
    if (!velocity) return;
    var rect = velocity.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > vh) return;
    var progressInView = (vh - rect.top) / (vh + rect.height); // 0 → 1 mientras cruza la pantalla
    var shift = (progressInView - 0.5) * Math.min(window.innerWidth, 1400) * 0.55;
    velocityRows.forEach(function (row) {
      var factor = parseFloat(row.getAttribute('data-velocity-row')) || 1;
      row.style.transform = 'translate3d(' + (shift * factor).toFixed(1) + 'px,0,0)';
    });
  };

  var ticking = false;
  var frame = function () {
    ticking = false;
    var vh = window.innerHeight;
    updateChrome();
    if (motionOK) { updateParallax(vh); updateVelocity(vh); }
  };
  var requestFrame = function () {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  };
  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', requestFrame);
  frame();

  /* ---------- Profundidad con el ratón en el hero ---------- */
  var stage = $('[data-depth-stage]');
  if (stage && motionOK && finePointer) {
    var heroEl = stage.closest('.hero') || stage;
    var layers = $$('[data-depth]', stage);
    var target = { x: 0, y: 0 };
    var currentPos = { x: 0, y: 0 };
    var depthRaf = null;

    var depthTick = function () {
      currentPos.x += (target.x - currentPos.x) * 0.08;
      currentPos.y += (target.y - currentPos.y) * 0.08;
      layers.forEach(function (layer) {
        var d = parseFloat(layer.getAttribute('data-depth')) || 1;
        layer.style.setProperty('--mx', (currentPos.x * d * 7).toFixed(2) + 'px');
        layer.style.setProperty('--my', (currentPos.y * d * 5).toFixed(2) + 'px');
      });
      var settled = Math.abs(target.x - currentPos.x) < 0.002 && Math.abs(target.y - currentPos.y) < 0.002;
      depthRaf = settled ? null : requestAnimationFrame(depthTick);
    };
    var kick = function () { if (!depthRaf) depthRaf = requestAnimationFrame(depthTick); };

    heroEl.addEventListener('pointermove', function (e) {
      var r = heroEl.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      kick();
    });
    heroEl.addEventListener('pointerleave', function () { target.x = 0; target.y = 0; kick(); });
  }

  /* ---------- Foco de luz e inclinación 3D en tarjetas ---------- */
  if (finePointer) {
    $$('[data-spotlight]').forEach(function (card) {
      var tilt = motionOK && card.hasAttribute('data-tilt');
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = e.clientX - r.left;
        var y = e.clientY - r.top;
        card.style.setProperty('--sx', x + 'px');
        card.style.setProperty('--sy', y + 'px');
        if (tilt) {
          card.style.setProperty('--rx', (((y / r.height) - 0.5) * -5).toFixed(2) + 'deg');
          card.style.setProperty('--ry', (((x / r.width) - 0.5) * 5).toFixed(2) + 'deg');
        }
      });
      if (tilt) {
        card.addEventListener('pointerleave', function () {
          card.style.setProperty('--rx', '0deg');
          card.style.setProperty('--ry', '0deg');
        });
      }
    });
  }

  // Los efectos "de una sola vez" (contador y chat) solo se preparan tras el primer
  // scroll de una persona: así un buscador que renderice la página ve siempre el
  // contenido final (12,928 y la conversación completa), nunca un estado a medias.
  var isOnScreen = function (el) {
    var r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  };
  var onFirstScroll = function (fn) {
    window.addEventListener('scroll', fn, { once: true, passive: true });
  };

  /* ---------- Contador (nota de acceso) ---------- */
  var counters = $$('[data-count-to]');
  if (counters.length && motionOK && 'IntersectionObserver' in window && window.Intl) {
    var runCounter = function (el) {
      var to = parseFloat(el.getAttribute('data-count-to'));
      var decimals = parseInt(el.getAttribute('data-count-decimals') || '0', 10);
      var format = new Intl.NumberFormat('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      var finalText = el.textContent;
      var start = null;
      var duration = 1600;
      var step = function (ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        el.textContent = format.format(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step); else el.textContent = finalText;
      };
      requestAnimationFrame(step);
    };
    onFirstScroll(function () {
      var counterObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { observer.unobserve(entry.target); runCounter(entry.target); }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (c) { if (!isOnScreen(c)) counterObserver.observe(c); });
    });
  }

  /* ---------- Conversación de ejemplo que se escribe sola ---------- */
  var demo = $('[data-chat-demo]');
  if (demo && motionOK && 'IntersectionObserver' in window) {
    var chatBody = $('.chat-demo__body', demo);
    var bubbles = $$('.chat-bubble', demo);
    var typing = $('.chat-typing', demo);

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

    onFirstScroll(function () {
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
    });
  }

  /* ---------- Año dinámico en el footer ---------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
