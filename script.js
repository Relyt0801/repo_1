// Stitch Studio — interactivity

(function () {
  'use strict';

  // ── Mobile menu toggle ──────────────────────────────────────────
  const menuToggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (menuToggle && menu) {
    menuToggle.addEventListener('click', () => {
      const open = menu.classList.toggle('hidden') === false;
      menuToggle.setAttribute('aria-expanded', String(open));
    });
    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menu.classList.add('hidden');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ── Theme toggle (light / dark) ─────────────────────────────────
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const applyAria = () => {
      const isDark = document.documentElement.classList.contains('dark');
      themeToggle.setAttribute(
        'aria-label',
        isDark ? 'Auf helles Farbschema umschalten' : 'Auf dunkles Farbschema umschalten'
      );
    };
    applyAria();
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      try {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
      } catch (e) {}
      applyAria();
    });
  }

  // ── Sign-up form (Formspree) ────────────────────────────────────
  // Replace FORMSPREE_ID with your real form ID from https://formspree.io
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/FORMSPREE_ID';

  const form = document.getElementById('signup-form');
  const status = document.getElementById('form-status');
  const submitBtn = document.getElementById('signup-submit');

  if (form && status && submitBtn) {
    const label = submitBtn.querySelector('.signup-label');
    const arrow = submitBtn.querySelector('.signup-arrow');
    const spinner = submitBtn.querySelector('.signup-spinner');
    const emailInput = form.querySelector('#email');

    const setStatus = (msg, tone) => {
      status.textContent = msg;
      status.className =
        'mt-4 text-sm min-h-[1.25rem] ' +
        (tone === 'error'
          ? 'text-red-200'
          : tone === 'success'
          ? 'text-emerald-200'
          : 'text-brand-100/90');
    };

    const setLoading = (loading) => {
      submitBtn.disabled = loading;
      if (label) label.textContent = loading ? 'Wird gesendet…' : 'Starten';
      if (arrow) arrow.classList.toggle('hidden', loading);
      if (spinner) spinner.classList.toggle('hidden', !loading);
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = (emailInput.value || '').trim();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus('Bitte gib eine gültige E-Mail-Adresse ein.', 'error');
        emailInput.focus();
        return;
      }

      // Demo-Modus, solange kein echter Endpoint hinterlegt ist
      if (FORMSPREE_ENDPOINT.includes('FORMSPREE_ID')) {
        setLoading(true);
        await new Promise((r) => setTimeout(r, 600));
        setLoading(false);
        setStatus(
          'Danke! (Demo-Modus — füge in script.js deinen Formspree-Endpoint ein, um Zustellungen zu aktivieren.)',
          'success'
        );
        form.reset();
        return;
      }

      setLoading(true);
      setStatus('', 'info');
      try {
        const res = await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        if (res.ok) {
          setStatus('Danke! Wir melden uns kurz bei dir.', 'success');
          form.reset();
        } else {
          const data = await res.json().catch(() => ({}));
          const msg =
            (data && data.errors && data.errors[0] && data.errors[0].message) ||
            'Hat nicht geklappt. Bitte später erneut versuchen.';
          setStatus(msg, 'error');
        }
      } catch (err) {
        setStatus('Netzwerkfehler. Bitte später erneut versuchen.', 'error');
      } finally {
        setLoading(false);
      }
    });
  }

  // ── Reveal on scroll (skipped under reduced motion) ─────────────
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    const targets = document.querySelectorAll('section > div, article, figure');
    targets.forEach((el) => el.classList.add('reveal'));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    targets.forEach((el) => io.observe(el));
  }
})();
