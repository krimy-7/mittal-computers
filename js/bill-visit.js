/* bill prints itself, map draws itself. Finished state is the default; .wait (motion allowed only) holds them blank until seen. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting){ e.target.classList.remove('wait'); io.unobserve(e.target); }
  }), {threshold:.3});
  ['billWrap', 'sketch'].forEach(id => {
    const el = document.getElementById(id);
    if (el){ el.classList.add('wait'); io.observe(el); }
  });
})();
