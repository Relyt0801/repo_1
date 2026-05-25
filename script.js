(function() {
  const btn = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (btn && mobileMenu) {
    btn.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      btn.setAttribute('aria-expanded', mobileMenu.classList.contains('open'));
    });
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }));
  }

  window.filterTeam = function(category) {
    document.querySelectorAll('.team-card').forEach(card => {
      card.style.display = (category === 'all' || card.dataset.category.includes(category)) ? '' : 'none';
    });
    document.querySelectorAll('.filter-btn').forEach(b => {
      const active = b.id === 'filter-' + category;
      b.classList.toggle('bg-primary', active);
      b.classList.toggle('text-on-primary', active);
      b.classList.toggle('bg-surface-container-high', !active);
      b.classList.toggle('text-on-surface-variant', !active);
    });
  };

  const sections = document.querySelectorAll('article[id]');
  const sideLinks = document.querySelectorAll('aside a[href^="#"]');
  if (sections.length && sideLinks.length) {
    window.setActive = function(el) {
      sideLinks.forEach(l => { l.classList.remove('active-tab'); l.classList.add('text-on-surface-variant'); });
      el.classList.add('active-tab'); el.classList.remove('text-on-surface-variant');
    };
    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(s => { if (window.scrollY >= s.offsetTop - 150) current = s.id; });
      sideLinks.forEach(l => {
        const active = l.getAttribute('href') === '#' + current;
        l.classList.toggle('active-tab', active);
        l.classList.toggle('text-on-surface-variant', !active);
      });
    });
  }

  const contactForm = document.querySelector('form#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type=submit]');
      const orig = submitBtn.textContent;
      submitBtn.textContent = 'Wird gesendet...';
      submitBtn.disabled = true;
      setTimeout(() => {
        submitBtn.textContent = 'Gesendet!';
        contactForm.reset();
        setTimeout(() => { submitBtn.textContent = orig; submitBtn.disabled = false; }, 3000);
      }, 1200);
    });
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) {
    document.querySelectorAll('.group[class*="cursor-pointer"], article').forEach(el => {
      el.addEventListener('mouseenter', () => el.style.transform = 'translateY(-2px)');
      el.addEventListener('mouseleave', () => el.style.transform = '');
    });
  }
})();
