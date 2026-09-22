/**
 * Raúl Gil Gonzalez — Desarrollo Web
 * JS vanilla, sin dependencias. Mejora progresiva:
 * si esto no se ejecuta, la web sigue siendo 100% funcional y legible.
 */
(function () {
  'use strict';

  // Marca que JS está activo (activa las animaciones de aparición en CSS).
  document.documentElement.classList.add('js');

  /* ---------- Menú móvil ---------- */
  var menuToggle = document.getElementById('menu-toggle');
  var mobileMenu = document.getElementById('mobile-menu');

  if (menuToggle && mobileMenu) {
    var menuIconUse = menuToggle.querySelector('use');
    var menuLinks = mobileMenu.querySelectorAll('a');

    var openMenu = function () {
      mobileMenu.dataset.state = 'open';
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', 'Cerrar menú');
      if (menuIconUse) menuIconUse.setAttribute('href', '#icon-close');
      document.body.style.overflow = 'hidden';
    };

    var closeMenu = function () {
      mobileMenu.dataset.state = 'closed';
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Abrir menú');
      if (menuIconUse) menuIconUse.setAttribute('href', '#icon-menu');
      document.body.style.overflow = '';
    };

    menuToggle.addEventListener('click', function () {
      var isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) closeMenu(); else openMenu();
    });

    menuLinks.forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        menuToggle.focus();
      }
    });

    // Si la ventana pasa a tamaño de escritorio con el menú abierto, ciérralo.
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 900 && menuToggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
      }
    });
  }

  /* ---------- Aparición al hacer scroll ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
      );
      revealEls.forEach(function (el) { revealObserver.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    }
  }

  /* ---------- Enlace activo en la navegación ---------- */
  var sections = document.querySelectorAll('main > section[id]');
  if (sections.length && 'IntersectionObserver' in window) {
    var allNavLinks = document.querySelectorAll('.nav__list a[href^="#"], .mobile-menu__list a[href^="#"]');
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          allNavLinks.forEach(function (link) { link.classList.remove('is-active'); });
          document
            .querySelectorAll('.nav__list a[href="#' + entry.target.id + '"], .mobile-menu__list a[href="#' + entry.target.id + '"]')
            .forEach(function (link) { link.classList.add('is-active'); });
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach(function (section) { navObserver.observe(section); });
  }

  /* ---------- Año dinámico en el footer ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
