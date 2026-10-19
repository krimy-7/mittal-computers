/* "Shutter khulta hai": the shop shutter rolls up, the camera walks in and lands on the Mittal processor.
   RM comes from main.js, which also fills the data-wa / data-tel links. Everything here is scoped. */
(function(){
document.getElementById('top').classList.add('solid');   // the signboard sits under the bar from the first frame

/* ---------- scroll → one progress value p (0..1 across the pinned range), lightly smoothed ---------- */
const $ = id => document.getElementById(id);
const wrap = $('heroWrap'), fb = $('fb'), hero = $('hero'), shutter = $('shutter'), front = $('front'), hint = $('hint'), arrive = $('arrive'), fbg = $('fbg');
const clamp = v => Math.min(1, Math.max(0, v));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const smooth = t => t * t * t * (t * (t * 6 - 15) + 10);
let target = 0, cur = 0, raf = 0, last = 0, draw3d = null;

function read(){ const span = wrap.offsetHeight - innerHeight; target = span > 0 ? clamp(-wrap.getBoundingClientRect().top / span) : 0; }
function apply(p){
  const roll = smooth(seg(p, .03, .5));                 // shutter: 3% → 50%
  shutter.style.transform = `translate3d(0,${(-roll * 100).toFixed(3)}%,0)`;
  shutter.style.visibility = roll > .999 ? 'hidden' : '';
  const walk = seg(p, .48, .74);                        // walking in under the signboard
  front.style.transform = walk ? `scale(${1 + walk * walk * 1.8})` : '';
  front.style.opacity = 1 - seg(p, .56, .72);
  hint.style.opacity = 1 - seg(p, 0, .05);
  arrive.style.opacity = seg(p, .86, .97);
  if (draw3d) draw3d(p, roll);
  else {                                                 // flat drawing: push in on the chip, bring it to the middle
    const k = smooth(seg(p, .48, 1)), w = fb.clientWidth, h = fb.clientHeight, f = Math.max(w / 1200, h / 800);
    const s = 1 + k * k * (.6 * Math.min(w / f, h / f) / 56 - 1);
    fbg.setAttribute('transform', `translate(${680 - 80 * k} ${430 - 30 * k}) scale(${s}) translate(-680 -430)`);
  }
}
function tick(now){
  raf = 0;
  const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
  cur += (target - cur) * (1 - Math.exp(-dt * 14));
  if (Math.abs(target - cur) < 2e-4) { cur = target; last = 0; } else raf = requestAnimationFrame(tick);
  apply(cur);
}
function onScroll(){ read(); if (!raf) raf = requestAnimationFrame(tick); }
if (!RM){
  addEventListener('scroll', onScroll, {passive:true});
  addEventListener('resize', onScroll);
  read(); cur = target; apply(cur);
}

/* ---------- inside the shop: matte paper-world 3D, rendered only when p changes ---------- */
(function(){
  if (RM || !window.THREE) return;
  const canvas = $('shop3d');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({canvas, antialias:true}); } catch (e) { return; }
  if (!renderer.getContext()) return;
  const smallScreen = Math.min(innerWidth, innerHeight) < 700;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, smallScreen ? 1.5 : 2));
  renderer.setClearColor(0xe9e0cd, 1);

  const INK = 0x1d2c6f, INK2 = 0x2c3c86, SKY = 0x22a6e0, SLIP = 0xfcfaf4, PAPER2 = 0xe9e0cd, KRAFT = 0xddcdac, FRAME = 0xc9b48a;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xe9e0cd, 6.5, 15);
  const camera = new THREE.PerspectiveCamera(44, 1, .01, 40);
  scene.add(new THREE.AmbientLight(0xfff6e8, .3));
  scene.add(new THREE.HemisphereLight(0xfffaf2, 0xd9cbb0, .55));
  const sun = new THREE.DirectionalLight(0xffefd9, .24); sun.position.set(-1.6, 4, 2.4); scene.add(sun);

  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const lam = (c, o = {}) => new THREE.MeshLambertMaterial(Object.assign({color:c}, o));
  const BOX = new THREE.BoxGeometry(1, 1, 1);
  const mesh = (geo, mat, x, y, z, sx = 1, sy = 1, sz = 1, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.y = ry; scene.add(m); return m; };
  const tex = (w, h, draw, rep) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const t = new THREE.CanvasTexture(cv); t.anisotropy = maxAniso;
    if (rep){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
    t.redraw = () => { const c = cv.getContext('2d'); c.clearRect(0, 0, w, h); draw(c, w, h); t.needsUpdate = true; }; t.redraw(); return t; };

  /* ---- room: 4.4 wide, back wall at z=-6, shopfront at z=0 (the DOM frame), extended forward so the edges never show ---- */
  const W2 = 2.2, BACK = -6, FRONTZ = 5, RL = FRONTZ - BACK, RZ = (FRONTZ + BACK) / 2, CEIL = 3;
  const floorTex = tex(256, 256, (c, w, h) => { c.fillStyle = '#e4d8be'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(29,44,111,.16)'; c.lineWidth = 3; c.strokeRect(0, 0, w, h); }, [W2 * 2 / .6, RL / .6]);
  const floor = mesh(new THREE.PlaneGeometry(W2 * 2, RL), lam(0xffffff, {map:floorTex}), 0, 0, RZ); floor.rotation.x = -Math.PI / 2;
  const pegTex = tex(128, 128, (c, w, h) => { c.fillStyle = '#ebe3d1'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(29,44,111,.2)'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++){ c.beginPath(); c.arc(16 + i * 32, 16 + j * 32, 3, 0, 7); c.fill(); } }, [W2 * 2 / .25, CEIL / .25]);
  mesh(new THREE.PlaneGeometry(W2 * 2, CEIL), lam(0xffffff, {map:pegTex}), 0, CEIL / 2, BACK);
  const wallMat = lam(0xf6efe2);
  const lw = mesh(new THREE.PlaneGeometry(RL, CEIL), wallMat, -W2, CEIL / 2, RZ); lw.rotation.y = Math.PI / 2;
  const rw = mesh(new THREE.PlaneGeometry(RL, CEIL), wallMat, W2, CEIL / 2, RZ); rw.rotation.y = -Math.PI / 2;
  const ceil = mesh(new THREE.PlaneGeometry(W2 * 2, RL), lam(0xfaf6ee), 0, CEIL, RZ); ceil.rotation.x = Math.PI / 2;
  const tube = new THREE.MeshBasicMaterial({color:0xfffcf4});
  [[-.75, -3.6], [.75, -3.6], [0, -.9]].forEach(([x, z]) => { mesh(BOX, tube, x, CEIL - .03, z, 1.25, .035, .06); mesh(BOX, lam(INK), x, CEIL - .012, z, 1.32, .02, .09); });

  /* ---- everything boxy goes through two instanced meshes ---- */
  const boxes = [];
  const add = (x, y, z, sx, sy, sz, c, ry = 0) => boxes.push({x, y, z, sx, sy, sz, c, ry});
  let seed = 2010; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const STOCK = [INK, INK, INK2, SLIP, SLIP, KRAFT, KRAFT, PAPER2, SKY];
  // back wall shelves full of boxes
  [.75, 1.3, 1.85, 2.4].forEach(y => {
    add(0, y - .02, BACK + .19, W2 * 2 - .1, .04, .38, FRAME);
    for (let x = -W2 + .12; x < W2 - .3;){ const w = .16 + rnd() * .26, h = .16 + rnd() * .3, d = .2 + rnd() * .12; add(x + w / 2, y + h / 2, BACK + .18, w, h, d, STOCK[Math.floor(rnd() * STOCK.length)]); x += w + .03 + rnd() * .05; }
  });
  // left wall: shelves; right wall: PC cabinets and monitor cartons on the floor
  [.9, 1.5, 2.1].forEach(y => {
    add(-W2 + .17, y - .02, -4.4, .34, .04, 2.6, FRAME);
    for (let z = -5.6; z < -3.3;){ const d = .18 + rnd() * .26, h = .18 + rnd() * .3; add(-W2 + .17, y + h / 2, z + d / 2, .26, h, d, STOCK[Math.floor(rnd() * STOCK.length)]); z += d + .04; }
  });
  [-5.4, -4.85, -4.3].forEach((z, i) => { add(W2 - .3, .23, z, .22, .46, .45, INK); add(W2 - .3, .3, z + .1, .225, .02, .12, i === 1 ? SKY : SLIP); });
  add(W2 - .35, .3, -3.5, .3, .6, .7, KRAFT); add(W2 - .35, .75, -3.5, .28, .3, .62, SLIP);

  /* ---- the glass display counter ---- */
  const CW = 3, CD = .62, CH = 1, CZ = -2.2, FT = .028;
  add(0, .07, CZ, CW, .14, CD, INK);                            // plinth
  add(0, (CH + .14) / 2, CZ - CD / 2, FT, CH - .14, FT, INK);           // sliding-door post, shopkeeper side
  [-CW / 2, -.5, .5, CW / 2].forEach(x => add(x, (CH + .14) / 2, CZ + CD / 2, FT, CH - .14, FT, INK));   // front posts
  [-CW / 2, CW / 2].forEach(x => add(x, (CH + .14) / 2, CZ - CD / 2, FT, CH - .14, FT, INK));
  add(0, CH - .01, CZ + CD / 2, CW + FT, FT, FT, INK); add(0, .55, CZ + CD / 2, CW, FT * .7, FT * .7, INK);
  add(0, CH - .01, CZ - CD / 2, CW + FT, FT, FT, INK);
  [-CW / 2, CW / 2].forEach(x => add(x, CH - .01, CZ, FT, FT, CD, INK));
  // stock inside the counter (two levels)
  [[.15, 9], [.565, 8]].forEach(([y, n]) => { for (let i = 0; i < n; i++){ const x = -CW / 2 + .2 + i * (CW - .4) / (n - 1) + (rnd() - .5) * .08, w = .14 + rnd() * .14, h = .05 + rnd() * .12, d = .12 + rnd() * .14;
    add(x, y + h / 2, CZ - .04 + (rnd() - .5) * .14, w, h, d, STOCK[Math.floor(rnd() * STOCK.length)], (rnd() - .5) * .3); } });

  // on top: monitor (its back to us, facing the shopkeeper), stamp pad, the processor box
  add(-1, CH + .006, CZ - .1, .2, .012, .15, INK); add(-1, CH + .12, CZ - .13, .035, .22, .03, INK);
  add(-1, CH + .36, CZ - .1, .6, .36, .04, INK, .12); add(-1, CH + .36, CZ - .08, .2, .14, .01, INK2, .12);
  add(-.12, CH + .008, CZ + .06, .085, .016, .055, INK, -.2); add(-.12, CH + .0165, CZ + .06, .07, .002, .042, SKY, -.2);
  const CHIP = new THREE.Vector3(.3, CH + .052, CZ + .02);
  add(CHIP.x, CH + .022, CHIP.z, .17, .044, .17, INK, .1);           // processor box
  add(CHIP.x, CH + .0455, CHIP.z, .14, .004, .14, KRAFT, .1);          // insert
  add(CHIP.x, CH + .049, CHIP.z, .082, .004, .082, INK2, .1);          // substrate

  const inst = new THREE.InstancedMesh(BOX, lam(0xffffff), boxes.length);
  const O = new THREE.Object3D(), C = new THREE.Color();
  boxes.forEach((b, i) => { O.position.set(b.x, b.y, b.z); O.rotation.set(0, b.ry, 0); O.scale.set(b.sx, b.sy, b.sz); O.updateMatrix(); inst.setMatrixAt(i, O.matrix); inst.setColorAt(i, C.set(b.c)); });
  scene.add(inst);

  // glass: one clear material, drawn after everything opaque
  const glass = lam(0xe8f0ef, {transparent:true, opacity:.22, depthWrite:false});
  mesh(BOX, glass, 0, CH - .009, CZ, CW + .02, .018, CD + .02);              // top slab
  mesh(BOX, glass, 0, .556, CZ, CW - .04, .008, CD - .06);                  // inner shelf
  mesh(new THREE.PlaneGeometry(CW, CH - .14), glass, 0, (CH + .14) / 2, CZ + CD / 2);
  mesh(new THREE.PlaneGeometry(CW, CH - .14), glass, 0, (CH + .14) / 2, CZ - CD / 2);
  [-1, 1].forEach(s => { const p = mesh(new THREE.PlaneGeometry(CD, CH - .14), glass, s * CW / 2, (CH + .14) / 2, CZ); p.rotation.y = Math.PI / 2; });
  const sheen = tex(512, 128, (c, w, h) => { c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,.5)'; [[60, 34], [150, 12], [330, 46], [400, 14]].forEach(([x, bw]) => { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + bw, 0); c.lineTo(x + bw - 40, h); c.lineTo(x - 40, h); c.fill(); });
    c.strokeStyle = 'rgba(29,44,111,.35)'; c.lineWidth = 3; c.strokeRect(1.5, 1.5, w - 3, h - 3); });
  const top = mesh(new THREE.PlaneGeometry(CW, CD), new THREE.MeshBasicMaterial({map:sheen, transparent:true, depthWrite:false}), 0, CH + .0004, CZ); top.rotation.x = -Math.PI / 2;

  // soft contact shadows (printed, not lit)
  const blob = tex(128, 128, (c, w, h) => { const g = c.createRadialGradient(64, 64, 8, 64, 64, 64); g.addColorStop(0, 'rgba(29,44,111,.55)'); g.addColorStop(1, 'rgba(29,44,111,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  const shadow = new THREE.MeshBasicMaterial({map:blob, transparent:true, depthWrite:false});
  const shade = (x, y, z, sx, sz, o = 1) => { const m = mesh(new THREE.PlaneGeometry(1, 1), o === 1 ? shadow : Object.assign(shadow.clone(), {opacity:o}), x, y, z, sx, sz); m.rotation.x = -Math.PI / 2; };
  shade(0, .002, CZ + .02, CW + .7, CD + .6, .7);
  shade(W2 - .32, .002, -4.6, .7, 2.6, .5);
  shade(CHIP.x + .01, CH + .001, CHIP.z + .015, .3, .3, .6);
  shade(-.42, CH + .001, CZ + .07, .36, .44, .45);
  shade(-1, CH + .001, CZ - .1, .36, .3, .5);

  /* ---- bill book (cash memo) and the Mittal processor ---- */
  const logoImg = new Image(); logoImg.src = 'logo.png';
  const billTex = tex(512, 700, (c, w, h) => {
    c.fillStyle = '#fcfaf4'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#1d2c6f'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '700 54px Mukta, sans-serif'; c.fillText('मित्तल कंप्यूटर्स', w / 2, 70);
    c.font = '600 26px "IBM Plex Mono", monospace'; c.fillText('CASH MEMO', w / 2, 128);
    c.strokeStyle = 'rgba(29,44,111,.5)'; c.lineWidth = 2;
    c.strokeRect(28, 160, w - 56, h - 200);
    c.beginPath(); c.moveTo(110, 160); c.lineTo(110, h - 40); c.moveTo(w - 130, 160); c.lineTo(w - 130, h - 40); c.stroke();
    for (let y = 214; y < h - 40; y += 46){ c.beginPath(); c.moveTo(28, y); c.lineTo(w - 28, y); c.stroke(); }
    c.fillStyle = '#116fab'; c.textAlign = 'left'; c.font = '400 30px Kalam, cursive';
    c.fillText('1', 60, 238); c.fillText('Processor', 128, 238);
  });
  const coverMat = lam(INK);
  const book = mesh(BOX, [coverMat, coverMat, lam(0xffffff, {map:billTex}), coverMat, coverMat, coverMat], -.42, CH + .009, CZ + .07, .22, .018, .3, .2);
  const pen = mesh(new THREE.CylinderGeometry(.0055, .0055, .14, 10), lam(INK), -.2, CH + .006, CZ + .2); pen.rotation.set(0, .6, Math.PI / 2);
  const cap = mesh(new THREE.CylinderGeometry(.0062, .0062, .035, 10), lam(SKY), 0, 0, 0); cap.position.set(-.2 + Math.cos(.6) * .06, CH + .006, CZ + .2 - Math.sin(.6) * .06); cap.rotation.copy(pen.rotation);

  const chipTex = tex(512, 512, (c, w, h) => {
    c.fillStyle = '#f6f3ea'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#1d2c6f'; c.lineWidth = 6; c.strokeRect(22, 22, w - 44, h - 44);
    if (logoImg.complete && logoImg.naturalWidth){ const lw2 = 420, lh = lw2 * logoImg.naturalHeight / logoImg.naturalWidth; c.drawImage(logoImg, (w - lw2) / 2, 190 - lh / 2, lw2, lh); }
    c.fillStyle = '#1d2c6f'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '700 52px Mukta, sans-serif'; c.fillText('मित्तल कंप्यूटर्स', w / 2, 340);
    c.font = '500 24px "IBM Plex Mono", monospace'; if ('letterSpacing' in c) c.letterSpacing = '4px'; c.fillText('Est. 2010 · Gorakhpur', w / 2, 420); if ('letterSpacing' in c) c.letterSpacing = '0px';
    c.beginPath(); c.moveTo(40, h - 40); c.lineTo(78, h - 40); c.lineTo(40, h - 78); c.fill();
  });
  const ihsSide = lam(0xd9d4c6);
  mesh(BOX, [ihsSide, ihsSide, new THREE.MeshBasicMaterial({map:chipTex}), ihsSide, ihsSide, ihsSide], CHIP.x, CH + .053, CHIP.z, .066, .006, .066, .1);

  /* ---- camera: doorway → counter → straight down onto the processor ---- */
  let W = 1, H = 1, path, endD = .2, portrait = false;
  const look0 = new THREE.Vector3(), look = new THREE.Vector3(), pos = new THREE.Vector3();
  function size(){
    W = canvas.clientWidth; H = canvas.clientHeight; portrait = W / H < 1;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.fov = portrait ? 58 : 44; camera.updateProjectionMatrix();
    look0.set(0, portrait ? 1.26 : 1, -2.6);
    endD = .066 / (.5 * 2 * Math.tan(camera.fov * Math.PI / 360) * Math.min(1, W / H));   // chip ≈ half the short side
    path = new THREE.CatmullRomCurve3(portrait
      ? [new THREE.Vector3(0, 1.5, 2.7), new THREE.Vector3(.08, 1.48, .3), new THREE.Vector3(.22, 1.38, -1.1), new THREE.Vector3(CHIP.x, CHIP.y + endD * .97, CHIP.z + endD * .22)]
      : [new THREE.Vector3(0, 1.62, 2.4), new THREE.Vector3(.08, 1.55, .3), new THREE.Vector3(.22, 1.4, -1.2), new THREE.Vector3(CHIP.x, CHIP.y + endD * .97, CHIP.z + endD * .22)]);
  }
  let inView = true, painted = false;
  draw3d = (p, roll) => {
    if (!inView || (painted && roll <= 0 && p < .03)) return;   // shutter fully down: nothing to show
    painted = true;
    const s = seg(p, .46, 1), t = 1 - Math.pow(1 - Math.pow(s, 1.5), 3);   // gentle start, long slow landing on the chip
    path.getPointAt(t, pos);
    pos.z += (1 - roll) * .6;                                      // a step closer while the shutter goes up
    look.copy(look0).lerp(CHIP, smooth(Math.min(1, t * 1.2)));
    camera.position.copy(pos); camera.lookAt(look);
    camera.setViewOffset(W, H, 0, (portrait ? -.02 : -.05) * H * (1 - t) + .06 * H * t, W, H);
    renderer.render(scene, camera);
  };
  size();
  addEventListener('resize', () => { size(); painted = false; apply(cur); });
  new IntersectionObserver(es => { inView = es[0].isIntersecting; if (inView) apply(cur); }).observe(wrap);

  const ready = document.fonts ? Promise.race([Promise.all([document.fonts.load('700 40px Mukta', 'मित्तल'), document.fonts.load('600 20px "IBM Plex Mono"'), document.fonts.load('400 20px Kalam')]), new Promise(r => setTimeout(r, 2000))]) : Promise.resolve();
  const logoReady = new Promise(r => { if (logoImg.complete) r(); else { logoImg.onload = logoImg.onerror = r; } });
  Promise.all([ready, logoReady]).then(() => { billTex.redraw(); chipTex.redraw(); painted = false; apply(cur); hero.classList.add('gl'); });
})();
})();

/* snap the painted headline onto the shutter's rib grid (layout-only; the shutter's own scroll transform doesn't change it) */
(function(){
  const sh = document.getElementById('shutter'), paint = sh && sh.querySelector('.paint'), wrapEl = document.getElementById('heroWrap');
  if (!paint) return;
  // move the headline and the taped notice separately: the headline stays under the rib shading, the notice stays above it
  const parts = [paint.querySelector('h1'), paint.querySelector('.notice')].filter(Boolean);
  function snap(){
    parts.forEach(el => el.style.translate = '');
    const rib = parseFloat(getComputedStyle(wrapEl).getPropertyValue('--rib')) || 24;
    const off = parts[0].getBoundingClientRect().top - sh.getBoundingClientRect().top, d = Math.round(off / rib) * rib - off;
    parts.forEach(el => el.style.translate = `0 ${d}px`);
  }
  addEventListener('resize', snap);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(snap);
  snap();
})();
