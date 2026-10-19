/* ---------- pegboard: hooks sit in real holes, tags swing like pendulums ---------- */
(function(){
  const peg = document.querySelector('.peg'); if (!peg) return;
  const hangs = [...peg.querySelectorAll('.hang')];
  const PITCH = 32, FIRST = 16, HX = 17, HY = 6.8;   // hole grid (matches .peg background) + hole centre inside .hook

  function snap(){
    hangs.forEach(h => h.style.removeProperty('--sx'));
    hangs.forEach(h => h.style.removeProperty('--sy'));
    const b = peg.getBoundingClientRect(), cs = getComputedStyle(peg);
    const ox = b.left + parseFloat(cs.borderLeftWidth), oy = b.top + parseFloat(cs.borderTopWidth);
    hangs.forEach(h => {
      const r = h.querySelector('.hook').getBoundingClientRect();
      const x = r.left + HX - ox, y = r.top + HY - oy, to = v => Math.round((v - FIRST) / PITCH) * PITCH + FIRST - v;
      h.style.setProperty('--sx', to(x).toFixed(1) + 'px');
      h.style.setProperty('--sy', to(y).toFixed(1) + 'px');
    });
  }
  let q = 0; const later = () => { cancelAnimationFrame(q); q = requestAnimationFrame(snap); };
  snap(); addEventListener('resize', later); addEventListener('load', later);
  if (document.fonts) document.fonts.ready.then(later);

  if (RM) return;
  // damped spring around the hook: a'' = -K·a - C·a'  (period ~1.1s, settles in ~3s)
  const K = 34, C = 3.4;
  hangs.forEach(h => {
    const sw = h.querySelector('.swing');
    let a = 0, v = 0, last = 0, raf = 0, pushed = 0;
    function tick(t){
      const dt = last ? Math.min((t - last) / 1000, .032) : 1 / 60; last = t;
      v += (-K * a - C * v) * dt; a += v * dt;
      if (Math.abs(a) < .02 && Math.abs(v) < .05){ a = v = 0; raf = 0; sw.style.removeProperty('--a'); return; }
      sw.style.setProperty('--a', a.toFixed(3) + 'deg');
      raf = requestAnimationFrame(tick);
    }
    function push(dir, amt){
      const now = performance.now(); if (now - pushed < 650) return; pushed = now;
      v += dir * amt;
      if (!raf){ last = 0; raf = requestAnimationFrame(tick); }
    }
    const side = e => { const r = sw.getBoundingClientRect(); return e.clientX < r.left + r.width / 2 ? -1 : 1; };
    h.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') push(side(e), 30); });
    h.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') push(side(e), 42); });
    h.addEventListener('focusin', () => push(1, 18));
  });
})();

/* ---------- the estimate slip ---------- */
(function(){
  const form = document.getElementById('qform'), nameEl = document.getElementById('q-name'), err = document.getElementById('q-name-err'),
        readout = document.getElementById('readout'), sent = document.getElementById('sent'), wrap = form.closest('.slip-wrap');
  const BUDGETS = ['Under ₹40k','₹40–70k','₹70k–1.2L','₹1.2L+'];
  const val = n => (form.querySelector(`[name="${n}"]:checked`) || {}).value || '';
  document.getElementById('slipDate').textContent = new Date().toLocaleDateString('en-IN', {day:'2-digit', month:'2-digit', year:'numeric'});

  let prev = new Set();
  function seat(){
    const use = val('use'), bi = BUDGETS.indexOf(val('budget')), names = [];
    if (use || bi >= 0){
      names.push('Processor (CPU)');
      names.push(use === 'Editing & design' || bi >= 2 ? 'RAM × 2' : 'RAM');
      names.push('SSD');
      if (use === 'Gaming' || use === 'Editing & design') names.push(bi >= 2 ? 'Powerful graphics card' : 'Graphics card');
      names.push('Power supply');
    }
    readout.innerHTML = names.length
      ? names.map((n, i) => `<li class="${prev.has(n) ? '' : 'new'}" style="animation-delay:${i * 70}ms"><span class="n">${String(i + 1).padStart(2, '0')}</span><span>${n}</span><span class="r">counter pe</span></li>`).join('')
      : '<li class="empty">Kaam ya budget pe tick karo, list yahan bharegi.</li>';
    prev = new Set(names);
  }
  form.addEventListener('change', seat);
  seat();

  nameEl.addEventListener('input', () => { if (nameEl.value.trim()){ err.hidden = true; nameEl.removeAttribute('aria-invalid'); } });

  // stamp lands (~120ms), paper nudges, then the top sheet tears off the book while WhatsApp opens
  function stamp(done){
    form.classList.remove('stamped'); void form.offsetWidth; form.classList.add('stamped');
    if (RM) return done();
    if (!wrap.classList.contains('torn')) setTimeout(() => wrap.classList.add('torn'), 420);
    setTimeout(done, 520);
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = nameEl.value.trim();
    if (!name){ err.hidden = false; nameEl.setAttribute('aria-invalid','true'); nameEl.focus(); return; }
    const must = form.must.value.trim();
    const lines = ['Hi Mittal Computers, I would like a custom PC quote.', '', 'Name: ' + name, 'Use: ' + (val('use') || 'Not sure yet'), 'Budget: ' + (val('budget') || 'Not sure yet')];
    if (must) lines.push('Must-haves: ' + must);
    lines.push('', '(Sent from your website)');
    const url = waUrl(lines.join('\n'));
    stamp(() => {
      const w = window.open(url, '_blank');
      if (w) w.opener = null;
      sent.hidden = false;
      sent.innerHTML = 'Parchi stamped. Opening WhatsApp… If nothing opened, <a href="' + url + '" target="_blank" rel="noopener">tap here to send</a>.';
    });
  });
})();
