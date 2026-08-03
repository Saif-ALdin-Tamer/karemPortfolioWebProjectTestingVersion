const root  = document.documentElement;
const dock  = document.getElementById('dock');
const svg   = document.getElementById('skin');
const fillP = document.getElementById('skinFill');
const bead  = document.getElementById('bead');
const tabs  = [...document.querySelectorAll('.dock__tabs [role="tab"]')];

const reduced = () => false; // matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (t) => t * t * (3 - 2 * t);

const hex = (s) => {
  const h = s.trim().replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const getAcc = (t) => {
  const acc = getComputedStyle(t).getPropertyValue('--acc') || '#c9f24a';
  return hex(acc);
};

let ACC = [];
// Initial setup
setTimeout(() => {
  ACC = tabs.map((t) => getAcc(t));
}, 100);

const mixRGB = (a, b, t) =>
  `${Math.round(a[0] + (b[0] - a[0]) * t)} ${Math.round(a[1] + (b[1] - a[1]) * t)} ${Math.round(a[2] + (b[2] - a[2]) * t)}`;

const G = { W: 0, H: 0, R: 17, D: 56, RB: 35, S: 17, CY: -6, slots: [], span: 80 };
const reach = (s, rb, by) => Math.sqrt(Math.max((s + rb) ** 2 - (s - by) ** 2, 1));

function measure() {
  if (!dock) return false;
  const r = dock.getBoundingClientRect();
  const W = Math.round(r.width), H = Math.round(r.height);
  if (W < 40 || H < 30) return false;

  G.slots = tabs.map((t) => {
    const b = t.getBoundingClientRect();
    return b.left - r.left + b.width / 2;
  });
  G.span = G.slots.length > 1 ? Math.abs(G.slots[1] - G.slots[0]) : W;

  G.W = W;
  G.H = H;
  G.R = H / 2;
  G.CY = 8;

  let D = Math.min(H * 0.55, G.span * 0.65);
  const minEdge = Math.min(G.slots[0], W - G.slots[0], G.slots[G.slots.length - 1], W - G.slots[G.slots.length - 1]);
  const room = Math.max(minEdge - G.R - 6, 10);
  for (let i = 0; i < 3; i++) {
    const hw = reach(D * 0.22, D / 2 + 6, G.CY);
    if (hw <= room) break;
    D *= room / hw;
  }
  G.D = Math.max(Math.round(D), 34);
  G.S = G.D * 0.22;
  G.RB = G.D / 2 + 6;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  dock.style.setProperty('--dock-r', `${G.R.toFixed(1)}px`);
  dock.style.setProperty('--bead-d', `${G.D}px`);
  dock.style.setProperty('--bead-cy', `${G.CY}px`);
  dock.style.setProperty('--rise', `${((H / 2 - G.CY) * 0.75).toFixed(1)}px`);
  return true;
}

function trough(bx, by, rb, sL, sR) {
  const { W, H, R } = G;
  const wing = (s, side) => {
    const L = s + rb;
    const half = reach(s, rb, by);
    const sx = bx + side * half;
    return { sx, s, tx: sx + ((bx - sx) / L) * s, ty: s + ((by - s) / L) * s };
  };
  const A = wing(sL, -1), B = wing(sR, +1);

  const a0 = Math.atan2(A.ty - by, A.tx - bx);
  const a1 = Math.atan2(B.ty - by, B.tx - bx);
  let sweep = ((a0 - a1) * 180) / Math.PI;
  while (sweep < 0) sweep += 360;
  const large = sweep > 180 ? 1 : 0;

  const n = (v) => v.toFixed(2);
  return (
    `M0 ${n(R)}` +
    `A${n(R)} ${n(R)} 0 0 1 ${n(R)} 0` +
    `L${n(clamp(A.sx, R, W - R))} 0` +
    `A${n(sL)} ${n(sL)} 0 0 1 ${n(A.tx)} ${n(A.ty)}` +
    `A${n(rb)} ${n(rb)} 0 ${large} 0 ${n(B.tx)} ${n(B.ty)}` +
    `A${n(sR)} ${n(sR)} 0 0 1 ${n(clamp(B.sx, R, W - R))} 0` +
    `L${n(W - R)} 0` +
    `A${n(R)} ${n(R)} 0 0 1 ${n(W)} ${n(R)}` +
    `L${n(W)} ${n(H - R)}` +
    `A${n(R)} ${n(R)} 0 0 1 ${n(W - R)} ${n(H)}` +
    `L${n(R)} ${n(H)}` +
    `A${n(R)} ${n(R)} 0 0 1 0 ${n(H - R)}` +
    `Z`
  );
}

let x = 0;
let v = 0;
let target = 0;
let dragging = false;
let raf = 0, last = 0;

function paint() {
  if (G.slots.length === 0) return;
  const q = clamp(v / 1100, -1, 1) * (dragging ? 0.5 : 1);
  const mag = Math.abs(q);

  const sL = clamp(G.S * (1 + 0.06 * mag + 0.40 * q), G.S * 0.55, G.S * 2.1);
  const sR = clamp(G.S * (1 + 0.06 * mag - 0.40 * q), G.S * 0.55, G.S * 2.1);

  let near = 0, nd = Infinity;
  for (let i = 0; i < tabs.length; i++) {
    const dx = Math.abs(x - G.slots[i]);
    if (dx < nd) { nd = dx; near = i; }
    tabs[i].style.setProperty('--t', smooth(clamp(1 - dx / (G.span * 0.55), 0, 1)).toFixed(3));
  }

  const d = trough(x, G.CY, G.RB, sL, sR);
  fillP.setAttribute('d', d);

  const sx = 1 + 0.07 * mag;
  const beadX = x - G.D / 2;
  const beadY = G.CY - G.D / 2;
  bead.style.transform = `translate3d(${beadX.toFixed(2)}px,${beadY.toFixed(2)}px,0) scale(${sx.toFixed(3)},${(1 / sx).toFixed(3)})`;

  const side = x >= G.slots[near] ? 1 : -1;
  const other = clamp(near + side, 0, tabs.length - 1);
  const t = other === near ? 0 : clamp(Math.abs(x - G.slots[near]) / G.span, 0, 1);
  if(ACC.length > 0) {
     root.style.setProperty('--glow-rgb', mixRGB(ACC[near], ACC[other], t));
  }
}

function loop(now) {
  raf = 0;
  const dt = Math.min((now - last) / 1000, 1 / 30);
  last = now;

  const K = dragging ? 1600 : 1400;
  const C = dragging ? 60 : 54;
  let step = dt;
  while (step > 0) {
    const h = Math.min(step, 1 / 240);
    v += (-K * (x - target) - C * v) * h;
    x += v * h;
    step -= h;
  }

  paint();
  if (Math.abs(x - target) > 0.05 || Math.abs(v) > 0.6 || dragging) run();
  else { x = target; v = 0; paint(); }
}

function run() {
  if (raf) return;
  last = performance.now();
  raf = requestAnimationFrame(loop);
}

function jump(to) {
  target = to;
  if (reduced() && !dragging) { x = to; v = 0; paint(); return; }
  run();
}

let current = Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'));

function select(i, { focus = false, animate = true } = {}) {
  current = (i + tabs.length) % tabs.length;
  tabs.forEach((t, n) => {
    t.setAttribute('aria-selected', String(n === current));
    t.tabIndex = n === current ? 0 : -1;
  });
  
  if (focus) tabs[current].focus();
  if (animate) jump(G.slots[current]);
  else { x = target = G.slots[current]; v = 0; paint(); }

  // trigger SPA navigation
  if (window.spaGo) {
    const section = tabs[current].getAttribute('data-nav-section');
    if (section) {
      window.spaGo(section);
    }
  }
}

tabs.forEach((t, i) =>
  t.addEventListener('click', (e) => { 
    e.preventDefault();
    if (!suppressClick) select(i); 
  })
);

let startX = 0, pid = null, suppressClick = false;

if (dock) {
  dock.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pid = e.pointerId;
    startX = e.clientX;
    suppressClick = false;
  });

  dock.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pid) return;
    if (!dragging && Math.abs(e.clientX - startX) < 7) return;
    if (!dragging) { dragging = true; suppressClick = true; dock.classList.add('is-dragging'); dock.setPointerCapture(pid); }
    e.preventDefault();
    const left = dock.getBoundingClientRect().left;
    const minS = Math.min(G.slots[0], G.slots[G.slots.length - 1]);
    const maxS = Math.max(G.slots[0], G.slots[G.slots.length - 1]);
    target = clamp(e.clientX - left, minS, maxS);
    run();
  });

  function release(e) {
    if (e.pointerId !== pid) return;
    pid = null;
    if (!dragging) return;
    dragging = false;
    dock.classList.remove('is-dragging');
    let near = 0, nd = Infinity;
    G.slots.forEach((s, i) => { const d = Math.abs(target - s); if (d < nd) { nd = d; near = i; } });
    select(near);
    setTimeout(() => { suppressClick = false; }, 0);
  }
  dock.addEventListener('pointerup', release);
  dock.addEventListener('pointercancel', release);

  function layout(animate) {
    if (!measure()) return;
    if (animate) jump(G.slots[current]);
    else { x = target = G.slots[current]; v = 0; paint(); }
    dock.classList.add('is-ready');
  }

  // Initialize once fonts are ready or immediately
  setTimeout(() => {
    ACC = tabs.map((t) => getAcc(t));
    layout(false);
    select(current, { animate: false });
  }, 100);
  
  let lastW = 0, lastH = 0;
  new ResizeObserver((entries) => {
    for (let entry of entries) {
      const cr = entry.contentRect;
      if (Math.abs(cr.width - lastW) > 1 || Math.abs(cr.height - lastH) > 1) {
        lastW = cr.width; lastH = cr.height;
        layout(false);
      }
    }
  }).observe(dock);
  if(document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => layout(false));
  }

  // Update layout only when language buttons are explicitly clicked
  ['portfolioLangBtn', 'floatingLangBtn'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        setTimeout(() => {
          layout(false);
          select(current, { animate: false });
        }, 150);
      });
    }
  });
}
