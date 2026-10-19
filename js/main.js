const PHONE = '918960848700';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const waUrl = t => `https://wa.me/${PHONE}?text=${encodeURIComponent(t)}`;

/* ---------- contact links ---------- */
document.querySelectorAll('[data-wa]').forEach(a => a.href = waUrl(a.dataset.wa));
document.querySelectorAll('[data-tel]').forEach(a => a.href = 'tel:+' + PHONE);

/* ---------- reveals (below the fold only) ---------- */
if (!RM && 'IntersectionObserver' in window){
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.remove('wait'); io.unobserve(e.target); } }), {rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.rv').forEach(el => {
    if (el.getBoundingClientRect().top < innerHeight * .92) return;
    el.classList.add('wait'); io.observe(el);
  });
}

/* ---------- nav: ballpoint underline marks the section you're in ---------- */
if ('IntersectionObserver' in window){
  const links = [...document.querySelectorAll('.nav a[href^="#"]')];
  const nio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => a.getAttribute('href') === '#' + e.target.id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
  }), {rootMargin:'-45% 0px -50% 0px'});
  links.forEach(a => { const t = document.querySelector(a.getAttribute('href')); if (t) nio.observe(t); });
}
