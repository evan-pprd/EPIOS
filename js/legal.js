/* ===== EPIOS — pages légales : menu mobile + surlignage du sommaire ===== */
(function () {
  const btn = document.getElementById('menuBtn');
  const menu = document.getElementById('menu');
  if (btn && menu) {
    btn.addEventListener('click', () => menu.classList.toggle('open'));
    menu.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => menu.classList.remove('open'))
    );
  }

  // Sommaire : met en évidence la section visible
  const links = Array.from(document.querySelectorAll('.toc a'));
  const sections = links
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  if (!sections.length || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => {
        const on = a.getAttribute('href') === '#' + e.target.id;
        a.style.background = on ? 'var(--sky)' : '';
        a.style.color = on ? 'var(--azur)' : '';
      });
    });
  }, { rootMargin: '-90px 0px -70% 0px', threshold: 0 });

  sections.forEach(s => io.observe(s));
})();
