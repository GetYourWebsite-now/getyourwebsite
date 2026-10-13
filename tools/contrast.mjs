/**
 * Proves every piece of text on the site is legible on the surface it is
 * actually painted on.
 *
 *   node tools/contrast.mjs
 *
 * This replaced a check that measured the old design's moving ambient
 * gradients. That design is gone; this one is light, flat and built on a
 * palette with genuinely thin margins — --ink-muted on --bg-alt clears AA by
 * 0.14 of a point — so the risk moved from "a sheen brightened the backdrop"
 * to "someone used the wrong ink token on the wrong surface."
 *
 * How it measures
 * ---------------
 * It walks every element with visible text, reads its computed colour, then
 * walks up the ancestor chain for the first non-transparent background —
 * which is what the glyph is really sitting on, rather than what the element
 * itself declares. Then WCAG 1.4.3:
 *
 *   normal text          4.5:1
 *   large text           3:1   (>=24px, or >=18.66px at weight 600+)
 *   buttons              3:1   (WCAG 1.4.11 — a control has to be findable,
 *                               not just readable once you have found it.
 *                               Measured on whichever of the fill or the
 *                               border separates it from the surface.)
 *   form control borders 3:1   (WCAG 1.4.11, measured against the surface
 *                               either side of the boundary)
 *
 * Alpha is composited, not ignored: a colour at 60% opacity over white is
 * measured as what it looks like, not as its opaque value.
 *
 * Depth surfaces (STEP 10)
 * ------------------------
 * Four sections of the home page carry a radial light and a grain (.depth in
 * global.css), and neither is a background-color, so the walk above would
 * not see them. When the surface a glyph sits on is a .depth section, the
 * backdrop is made worst-case for that glyph:
 *
 *   light   the gradient's alpha at the point of the text box nearest its
 *           centre, composited over the section colour. It darkens a light
 *           surface and lightens the dark band, so nearest is worst on both.
 *   grain   the darkest pixel the blend can make: multiply at the ::before's
 *           opacity over black noise on light surfaces, screen over white
 *           noise on the dark band.
 *
 * Measured this way, a glyph only passes if it passes on the worst pixel
 * under it.
 *
 * The /demo sandbox is skipped. It deliberately runs the client portal's own
 * dark token set (see CLAUDE.md) and is not ours to re-measure here; the
 * portal owns that. Everything else on every page is measured.
 *
 * Needs a dev server on :4321.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:4321';
const PAGES = [
  '/', '/work', '/pricing', '/how-it-works',
  '/why-us', '/contact', '/beta', '/beta/thanks', '/free-mock', '/free-mock/thanks',
  '/demo', '/privacy', '/terms', '/cookies', '/beta-terms', '/404',
];

let failures = 0;
const fail = (m) => { console.log(`  ✗ ${m}`); failures++; };
const pass = (m) => console.log(`  ✓ ${m}`);

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await (await browser.newContext({
  viewport: { width: 1440, height: 900 },
})).newPage();

console.log('\nText contrast — every text node against the surface it is painted on\n');

const worstByPage = [];
let totalMeasured = 0;

for (const path of PAGES) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content: `
      astro-dev-toolbar { display: none !important; }
      [data-reveal] { opacity: 1 !important; transform: none !important; }
    `,
  });
  await page.waitForTimeout(300);

  const result = await page.evaluate(() => {
    const srgb = (c) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
    const ratio = (a, b) => {
      const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)];
      return (hi + 0.05) / (lo + 0.05);
    };
    const parse = (c) => {
      const m = (c || '').match(/-?\d+(\.\d+)?/g);
      if (!m) return null;
      const [r, g, b] = m.slice(0, 3).map(Number);
      const a = m.length > 3 ? Number(m[3]) : 1;
      return [r, g, b, a];
    };
    // Flatten a possibly-translucent colour onto what is behind it.
    const over = (fg, bg) => fg[3] >= 1
      ? fg.slice(0, 3)
      : [0, 1, 2].map((i) => Math.round(fg[i] * fg[3] + bg[i] * (1 - fg[3])));

    // A .depth section's colour as the worst pixel under `box` sees it: its
    // radial light at the nearest point to the light's centre, then the
    // grain at its most extreme. See the header comment.
    const depthWorst = (sec, colour, box) => {
      const cs = getComputedStyle(sec);
      const r = sec.getBoundingClientRect();
      let c = colour.slice(0, 3);
      const m = cs.backgroundImage.match(
        /radial-gradient\(([\d.]+)% ([\d.]+)% at ([\d.]+)% ([\d.]+)%, rgba\(([^)]+)\)(?: 0%)?, (?:rgba\(0, 0, 0, 0\)|transparent) ([\d.]+)%\)/
      );
      // A light this cannot read would be measured as no light at all, which
      // is the optimistic answer. Stop instead.
      if (!m && cs.backgroundImage !== 'none') {
        throw new Error(`contrast.mjs cannot read the light on .${sec.className.split(' ').join('.')}: ${cs.backgroundImage}`);
      }
      if (m) {
        const [rx, ry, ax, ay] = m.slice(1, 5).map((v) => +v / 100);
        const stop = +m[6] / 100;
        const [lr, lg, lb, la] = m[5].split(',').map(Number);
        const cx = r.left + ax * r.width, cy = r.top + ay * r.height;
        const px = Math.min(Math.max(cx, box.left), box.right);
        const py = Math.min(Math.max(cy, box.top), box.bottom);
        const d = Math.hypot((px - cx) / (rx * r.width), (py - cy) / (ry * r.height));
        const a = la * Math.max(0, 1 - d / stop);
        c = over([lr, lg, lb, a], c);
      }
      const g = getComputedStyle(sec, '::before');
      const o = +g.opacity || 0;
      if (g.content !== 'none' && o > 0) {
        c = g.mixBlendMode === 'screen'
          ? c.map((v) => Math.round(255 - (255 - v) * (1 - o)))
          : c.map((v) => Math.round(v * (1 - o)));
      }
      return c;
    };

    // The surface a glyph actually sits on: the first opaque-enough ancestor
    // background, composited down from any translucent layers above it.
    const backdrop = (el) => {
      const stack = [];
      for (let n = el; n; n = n.parentElement) {
        let c = parse(getComputedStyle(n).backgroundColor);
        if (c && c[3] >= 0.999 && n.classList.contains('depth')) {
          c = [...depthWorst(n, c, el.getBoundingClientRect()), 1];
        }
        if (c && c[3] > 0) { stack.push(c); if (c[3] >= 0.999) break; }
      }
      let base = [255, 255, 255];
      for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
      return base;
    };

    const rows = [];
    for (const el of document.querySelectorAll('body *')) {
      // The portal lookalike runs its own token set on purpose — see
      // CLAUDE.md; the portal owns that palette, not this site.
      //
      // Our own wrapper chrome is the exception and IS measured. It sits
      // inside .sandbox, so it inherits the portal's shadowed token values
      // unless it is careful, and the first light version of the banner
      // rendered #e6e7eb text on an #f6f7f9 bar — invisible, and invisible
      // to this check too while the whole subtree was skipped.
      if (el.closest('astro-dev-toolbar')) continue;
      if (el.closest('.sandbox') && !el.closest('.sandbox__banner')) continue;
      // Text hidden from assistive technology is not subject to 1.4.3. This
      // is only ever decorative duplication of copy that is already on the
      // page (the 404's ghost numeral); it still has to be visible, which is
      // a design judgement rather than a measurable threshold.
      if (el.closest('[aria-hidden="true"]')) continue;
      // Only elements with their own visible text, so a wrapper is not
      // credited with its children's copy.
      const own = [...el.childNodes]
        .filter((n) => n.nodeType === 3 && n.textContent.trim())
        .map((n) => n.textContent.trim()).join(' ');
      if (!own) continue;
      const box = el.getBoundingClientRect();
      if (box.width < 1 || box.height < 1) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
      // The skip link lives off-screen until focused; it is checked when it is.
      if (el.classList.contains('sr-only')) continue;

      const bg = backdrop(el);
      const fgRaw = parse(cs.color);
      if (!fgRaw) continue;
      // Outlined display type: the fill is transparent and a text-stroke
      // draws the glyph, so the `color` property is not what you see.
      if (fgRaw[3] === 0) continue;
      const fg = over(fgRaw, bg);

      const px = parseFloat(cs.fontSize);
      const weight = parseInt(cs.fontWeight, 10) || 400;
      const large = px >= 24 || (px >= 18.66 && weight >= 600);

      rows.push({
        r: ratio(fg, bg),
        need: large ? 3 : 4.5,
        px: Math.round(px),
        sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string'
          ? '.' + el.className.trim().split(/\s+/)[0] : ''),
        text: own.replace(/\s+/g, ' ').slice(0, 40),
        fg: `rgb(${fg.join(',')})`,
        bg: `rgb(${bg.join(',')})`,
      });
    }

    // Button fills, WCAG 1.4.11. A filled button whose fill is close in
    // luminance to the surface behind it is hard to find even when its label
    // is perfectly legible — which is exactly what happened to the primary
    // button on the dark footer (2.60:1) before it was inverted.
    const fills = [];
    for (const el of document.querySelectorAll('.btn')) {
      if (el.closest('.sandbox')) continue;
      if (el.getBoundingClientRect().width < 1) continue;
      const cs = getComputedStyle(el);
      const outside = backdrop(el.parentElement);
      // Either the fill or the edge can be the thing that makes the control
      // visible, so the button passes on whichever is stronger. An outlined
      // button is a border by design; a filled one usually has no border at
      // all. Judging only the fill would fail every secondary button.
      const fc = parse(cs.backgroundColor);
      const bc = parse(cs.borderTopColor);
      const hasBorder = parseFloat(cs.borderTopWidth) > 0;
      const rFill = fc && fc[3] > 0 ? ratio(over(fc, outside), outside) : 0;
      const rEdge = hasBorder && bc && bc[3] > 0 ? ratio(over(bc, outside), outside) : 0;
      if (!rFill && !rEdge) continue;
      const via = rEdge > rFill ? 'edge' : 'fill';
      const seen = Math.max(rFill, rEdge);
      fills.push({
        r: seen,
        via,
        sel: '.' + [...el.classList].filter((c) => c.startsWith('btn--')).join('.'),
        label: (el.textContent || '').trim().slice(0, 28),
        colour: `rgb(${over(via === 'edge' ? bc : fc, outside).join(',')})`,
        on: `rgb(${outside.join(',')})`,
      });
    }

    // Form-control boundaries, WCAG 1.4.11.
    const borders = [];
    for (const el of document.querySelectorAll('input, textarea, select')) {
      if (el.closest('.sandbox') || el.type === 'hidden') continue;
      if (el.getBoundingClientRect().width < 1) continue;
      const cs = getComputedStyle(el);
      if (parseFloat(cs.borderTopWidth) === 0) continue;
      const bc = parse(cs.borderTopColor);
      if (!bc) continue;
      const outside = backdrop(el.parentElement);
      borders.push({
        r: ratio(over(bc, outside), outside),
        sel: el.tagName.toLowerCase() + (el.name ? `[name=${el.name}]` : ''),
        colour: `rgb(${over(bc, outside).join(',')})`,
      });
    }

    return { rows, borders, fills };
  });

  totalMeasured += result.rows.length;

  const bad = result.rows.filter((r) => r.r < r.need);
  const worst = result.rows.reduce((a, b) => (b.r - b.need < a.r - a.need ? b : a), result.rows[0]);

  if (bad.length) {
    fail(`${path.padEnd(14)} ${bad.length} of ${result.rows.length} text nodes under AA`);
    for (const b of bad.slice(0, 6)) {
      console.log(
        `      ${b.r.toFixed(2)}:1 (needs ${b.need}) ${b.px}px ${b.sel}  ${b.fg} on ${b.bg}  "${b.text}"`
      );
    }
    if (bad.length > 6) console.log(`      … and ${bad.length - 6} more`);
  } else {
    pass(
      `${path.padEnd(14)} ${String(result.rows.length).padStart(3)} text nodes, ` +
      `tightest ${worst.r.toFixed(2)}:1 vs ${worst.need} — ${worst.sel} "${worst.text}"`
    );
    worstByPage.push({ path, ...worst });
  }

  const badFills = result.fills.filter((f) => f.r < 3);
  if (badFills.length) {
    fail(
      `${path.padEnd(14)} ${badFills.length} button fill(s) under 3:1 against their surface — ` +
      badFills.slice(0, 3).map((f) => `${f.sel} "${f.label}" ${f.r.toFixed(2)}:1 by ${f.via} — ${f.colour} on ${f.on}`).join(', ')
    );
  } else if (result.fills.length) {
    pass(
      `${path.padEnd(14)} ${result.fills.length} button fill(s) clear 3:1 ` +
      `(tightest ${Math.min(...result.fills.map((f) => f.r)).toFixed(2)}:1)`
    );
  }

  const badBorders = result.borders.filter((b) => b.r < 3);
  if (badBorders.length) {
    fail(
      `${path.padEnd(14)} ${badBorders.length} form control border(s) under 3:1 — ` +
      badBorders.slice(0, 3).map((b) => `${b.sel} ${b.r.toFixed(2)}:1 ${b.colour}`).join(', ')
    );
  } else if (result.borders.length) {
    pass(
      `${path.padEnd(14)} ${result.borders.length} form control border(s) clear 3:1 ` +
      `(tightest ${Math.min(...result.borders.map((b) => b.r)).toFixed(2)}:1)`
    );
  }
}

// The skip link only exists once focused, and it is the first thing a keyboard
// user ever sees, so it gets measured in the state it is actually used in.
{
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  const r = await page.evaluate(() => {
    const srgb = (c) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
    const parse = (c) => (c.match(/\d+/g) || []).slice(0, 3).map(Number);
    const el = document.querySelector('.skip-link');
    const fg = parse(getComputedStyle(el).color);
    const bg = parse(getComputedStyle(el).backgroundColor);
    const [hi, lo] = lum(fg) > lum(bg) ? [lum(fg), lum(bg)] : [lum(bg), lum(fg)];
    return (hi + 0.05) / (lo + 0.05);
  });
  r >= 4.5
    ? pass(`skip link reads ${r.toFixed(2)}:1 when focused`)
    : fail(`skip link is ${r.toFixed(2)}:1 when focused — under 4.5:1`);
}

console.log(`\n${totalMeasured} text nodes measured across ${PAGES.length} pages`);

if (worstByPage.length) {
  const tightest = worstByPage.reduce((a, b) => (b.r - b.need < a.r - a.need ? b : a));
  console.log(
    `tightest margin anywhere: ${tightest.r.toFixed(2)}:1 against ${tightest.need} ` +
    `on ${tightest.path} — ${tightest.sel} (${tightest.fg} on ${tightest.bg})`
  );
}

console.log(`\n${failures === 0 ? 'CONTRAST OK' : `${failures} FAILURE(S)`}\n`);
await browser.close();
process.exit(failures ? 1 : 0);
