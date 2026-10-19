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

/* dukaan ki diary: Instagram's embed script loads only when the section is close, then the arrows page through the reels */
(function(){
  const sec = document.getElementById('insta'), list = document.getElementById('reels');
  if (!sec || !list) return;
  let loaded = false;
  function load(){
    if (loaded) return; loaded = true;
    const s = document.createElement('script'); s.async = true; s.src = 'https://www.instagram.com/embed.js';
    s.onload = () => window.instgrm && window.instgrm.Embeds.process();
    document.body.appendChild(s);
  }
  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)){ load(); io.disconnect(); } }, {rootMargin:'900px 0px'});
    io.observe(sec);
  } else load();
  const btns = sec.querySelectorAll('.rbtn');
  const step = () => (list.querySelector('.reel') || {offsetWidth:340}).offsetWidth + 28;
  function sync(){ btns[0].disabled = list.scrollLeft < 8; btns[1].disabled = list.scrollLeft + list.clientWidth > list.scrollWidth - 8; }
  btns.forEach(b => b.addEventListener('click', () => list.scrollBy({left: step() * +b.dataset.dir, behavior: RM ? 'auto' : 'smooth'})));
  list.addEventListener('scroll', sync, {passive:true}); addEventListener('resize', sync); sync();
})();
