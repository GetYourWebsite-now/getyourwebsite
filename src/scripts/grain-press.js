/**
 * Purple grain behind every section that holds a "Join the beta" button.
 *
 * Moving the pointer opens a small clear circle in the grain. It does not
 * get denser. The press sends all of it out in one radial wave from the
 * button.
 */
const HOLE = 78;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function isBetaButton(el) {
  if (!(el instanceof HTMLAnchorElement)) return false;
  if (!el.classList.contains('btn--primary')) return false;
  try {
    return new URL(el.href, location.origin).pathname.replace(/\/$/, '').endsWith('/beta');
  } catch {
    return false;
  }
}

function svgMask(w, h, inner) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${inner}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function applyMask(el, url) {
  el.style.maskImage = url;
  el.style.webkitMaskImage = url;
}

function clearMask(el) {
  el.style.maskImage = '';
  el.style.webkitMaskImage = '';
}

/** Grain hidden inside a soft circle. */
function holeMask(w, h, cx, cy, r) {
  return svgMask(w, h, `
    <defs>
      <filter id='b' x='-40%' y='-40%' width='180%' height='180%'>
        <feGaussianBlur stdDeviation='5'/>
      </filter>
      <mask id='m'>
        <rect width='100%' height='100%' fill='white'/>
        <circle cx='${cx}' cy='${cy}' r='${Math.max(0, r)}' fill='black' filter='url(#b)'/>
      </mask>
    </defs>
    <rect width='100%' height='100%' fill='white' mask='url(#m)'/>`);
}

/** A soft ring of grain. `r` is the outer edge, `band` its thickness. */
function ringMask(w, h, cx, cy, r, band) {
  const inner = Math.max(0, r - band);
  return svgMask(w, h, `
    <defs>
      <filter id='b' x='-40%' y='-40%' width='180%' height='180%'>
        <feGaussianBlur stdDeviation='4'/>
      </filter>
      <mask id='m'>
        <rect width='100%' height='100%' fill='black'/>
        <circle cx='${cx}' cy='${cy}' r='${Math.max(0, r)}' fill='white' filter='url(#b)'/>
        <circle cx='${cx}' cy='${cy}' r='${inner}' fill='black'/>
      </mask>
    </defs>
    <rect width='100%' height='100%' fill='white' mask='url(#m)'/>`);
}

function bind(section, buttons) {
  const grain = document.createElement('div');
  grain.className = 'section-grain';
  if (section.classList.contains('section--dark') || section.classList.contains('foot')) {
    grain.classList.add('is-dark');
  }
  grain.setAttribute('aria-hidden', 'true');
  const fill = document.createElement('div');
  fill.className = 'section-grain__fill';
  const ring = document.createElement('div');
  ring.className = 'section-grain__ring';
  grain.append(fill, ring);
  section.append(grain);

  let raf = 0;
  let hoverRaf = 0;
  let waving = false;
  let pointer = null;

  const hovered = () => buttons.some((btn) => btn.matches(':hover'));

  const paintHole = () => {
    hoverRaf = 0;
    if (!pointer || waving || grain.classList.contains('is-gone')) return;
    const bounds = grain.getBoundingClientRect();
    applyMask(fill, holeMask(
      bounds.width,
      bounds.height,
      pointer.x - bounds.left,
      pointer.y - bounds.top,
      HOLE,
    ));
  };

  const disarm = () => {
    if (waving || hovered()) return;
    grain.classList.remove('is-gone');
    if (pointer) paintHole();
    else clearMask(fill);
  };

  const finish = () => {
    waving = false;
    cancelAnimationFrame(raf);
    clearMask(fill);
    clearMask(ring);
    ring.style.opacity = '0';
    if (hovered()) grain.classList.add('is-gone');
    else {
      grain.classList.remove('is-gone');
      if (pointer) paintHole();
    }
  };

  const wave = (btn) => {
    if (waving) return;
    waving = true;
    if (hoverRaf) cancelAnimationFrame(hoverRaf);
    grain.classList.remove('is-gone');
    const bounds = grain.getBoundingClientRect();
    const button = btn.getBoundingClientRect();
    const w = bounds.width;
    const h = bounds.height;
    const cx = button.left + button.width / 2 - bounds.left;
    const cy = button.top + button.height / 2 - bounds.top;
    const maxR = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
    const band = Math.max(180, Math.min(320, maxR * 0.34));
    const start = performance.now();
    const dur = Math.min(1100, Math.max(720, maxR / 1.7));

    const frame = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - (1 - t) ** 2;
      const r = eased * (maxR + band);
      applyMask(fill, holeMask(w, h, cx, cy, Math.max(0, r - band)));
      applyMask(ring, ringMask(w, h, cx, cy, r, band));
      const fade = t < 0.78 ? 1 : 1 - (t - 0.78) / 0.22;
      ring.style.opacity = r < 30 ? '0' : String(fade);
      if (t < 1) raf = requestAnimationFrame(frame);
      else finish();
    };
    raf = requestAnimationFrame(frame);
  };

  section.addEventListener('pointermove', (event) => {
    pointer = { x: event.clientX, y: event.clientY };
    if (waving || grain.classList.contains('is-gone') || hoverRaf) return;
    hoverRaf = requestAnimationFrame(paintHole);
  });
  section.addEventListener('pointerleave', () => {
    pointer = null;
    if (waving) return;
    clearMask(fill);
  });

  for (const btn of buttons) {
    btn.addEventListener('pointerleave', disarm);
    btn.addEventListener('pointerdown', () => wave(btn));
  }
}

const groups = new Map();
for (const btn of document.querySelectorAll('a.btn--primary')) {
  if (!isBetaButton(btn)) continue;
  const section = btn.closest('.section');
  if (!section) continue;
  if (!groups.has(section)) groups.set(section, []);
  groups.get(section).push(btn);
}

for (const [section, buttons] of groups) {
  if (reduced) {
    const grain = document.createElement('div');
    grain.className = 'section-grain';
    if (section.classList.contains('section--dark') || section.classList.contains('foot')) {
      grain.classList.add('is-dark');
    }
    grain.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('div');
    fill.className = 'section-grain__fill';
    grain.append(fill);
    section.append(grain);
    continue;
  }
  bind(section, buttons);
}
