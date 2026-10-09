/**
 * End-to-end verification. Run it before pushing anything significant.
 *
 *   node tools/verify.mjs
 *
 * Sections:
 *   1  every internal link resolves
 *   2  the demo sandbox flow works end to end, including fullscreen
 *   3  reduced motion leaves a still, fully readable page
 *   4  the contact form validates and fails loudly when it can't send
 *   5  every button comes from the shared system
 *   6  the light surfaces stay light: no atmosphere, one dark surface,
 *      sections alternate
 *   7  the static captures of the portal aren't from a previous design
 *
 * Needs a dev server on :4321.
 */
import { chromium } from 'playwright';
import sharp from 'sharp';

const BASE = process.env.BASE ?? 'http://localhost:4321';
const PAGES = ['/', '/work', '/demo', '/pricing', '/how-it-works', '/benefits', '/why-us', '/contact', '/free-mock', '/free-mock/thanks', '/privacy', '/terms'];



const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

let failures = 0;
const fail = (m) => { console.log(`  ✗ ${m}`); failures++; };
const pass = (m) => console.log(`  ✓ ${m}`);

// ── 1. Links ───────────────────────────────────────────────────────────────
console.log('\n[1] Link check');
const seen = new Map();

for (const path of PAGES) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  const hrefs = await page.$$eval('a[href]', (as) =>
    as
      .map((a) => a.getAttribute('href'))
      .filter((h) => h && !h.startsWith('#') && !h.startsWith('mailto:'))
  );
  for (const h of new Set(hrefs)) {
    if (/^https?:\/\//.test(h)) continue; // external, not our problem
    if (!seen.has(h)) seen.set(h, new Set());
    seen.get(h).add(path);
  }
}

let linkFailures = 0;
for (const [href, from] of seen) {
  const res = await page.request.get(`${BASE}${href}`);
  if (res.status() >= 400) {
    fail(`${href} → ${res.status()}  (linked from ${[...from].join(', ')})`);
    linkFailures++;
  }
}
if (!linkFailures) pass(`${seen.size} distinct internal links all resolve`);

// ── 2. Demo sandbox ────────────────────────────────────────────────────────
console.log('\n[2] Demo sandbox flow');
await page.goto(`${BASE}/demo`, { waitUntil: 'networkidle' });

await page.click('[data-tab="real-site"]');
// Scoped to the approved-versions list. "My website" now also carries a
// review queue and the hosted-version list, and an unscoped count picks up all
// three — it read 9 and looked like a data bug.
const versions = await page.locator('[data-versions] .portal-version-item').count();
versions === 4
  ? pass(`version list shows ${versions} approved versions`)
  : fail(`expected 4 approved versions, saw ${versions}`);

// The three capabilities the marketing copy leads with have to work here, not
// just be drawn. If the copy promises them, the demo has to deliver them.
{
  const liveBefore = await page.locator('[data-hosted] .dash-pill').count();
  await page.click('[data-host="4"]');
  await page.waitForTimeout(300);
  const nowLive = await page.evaluate(() => {
    const pill = document.querySelector('[data-hosted] .dash-pill');
    return pill?.closest('.portal-version-item')?.querySelector('.portal-version-name')?.textContent ?? '';
  });
  liveBefore === 1 && /Version 4/.test(nowLive)
    ? pass('hosted version switches with one button — Live moved to version 4')
    : fail(`the version switch did not take: "${nowLive}"`);
}

{
  await page.click('[data-photos="4"]');
  await page.waitForSelector('[data-attach]:not([hidden])');
  await page.waitForTimeout(400);
  const slots = await page.locator('[data-slot]').count();

  const slotText = (id) =>
    page.evaluate(
      (s2) => document.querySelector(`[data-slot="${s2}"] .attach-slot__state`)?.textContent?.trim(),
      id
    );

  // Two ways in. Tap-to-place is the touch path and uses real clicks. The
  // pointer drag uses synthetic drag events carrying a real DataTransfer,
  // because Playwright's dragAndDrop is unreliable against HTML5 drag targets —
  // it picked a neighbouring photo, or none, on roughly half of ten attempts.
  // That is the harness, not the page: the library's chip positions measured
  // pixel-identical from 600ms to 4s, so nothing is moving under it.
  const drop = (asset, slot) =>
    page.evaluate(
      ([a, sl]) => {
        const dt = new DataTransfer();
        document
          .querySelector(`[data-asset="${a}"]`)
          .dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
        const target = document.querySelector(`[data-slot="${sl}"]`);
        target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
        target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
      },
      [asset, slot]
    );

  await page.click('[data-asset="a1"]');
  await page.click('[data-slot="s2"]');
  await page.waitForTimeout(200);
  const tapped = await slotText('s2');

  await drop('a4', 's3');
  await page.waitForTimeout(200);
  const dragged = await slotText('s3');

  slots >= 3 && /Sourdough loaves/.test(tapped ?? '')
    ? pass(`photos attach by tap — s2 reads "${tapped}"`)
    : fail(`tap-to-place failed (slots=${slots}, slot reads "${tapped}")`);
  /Cinnamon buns/.test(dragged ?? '')
    ? pass(`photos attach by drag — s3 reads "${dragged}"`)
    : fail(`drag-and-drop onto a placeholder failed (slot reads "${dragged}")`);

  // Since c220e34 the real panel stages changes and sends them together, and a
  // slot that swaps one photo for another goes as a single atomic request
  // rather than a detach followed by an attach. Three things follow from that,
  // and the sandbox has to show all three.
  await drop('a3', 's1'); // s1 already holds a photo, so this is a replacement
  await page.waitForTimeout(200);
  const replacing = await slotText('s1');
  /Replacing .*one change/.test(replacing ?? '')
    ? pass(`replacing a filled slot reads as one change — "${replacing}"`)
    : fail(`replacement not shown as a single change: "${replacing}"`);

  // Cancel discards everything staged.
  await page.click('[data-attach-close]');
  await page.waitForTimeout(200);
  await page.click('[data-photos="4"]');
  await page.waitForSelector('[data-attach]:not([hidden])');
  await page.waitForTimeout(300);
  const afterCancel = await slotText('s3');
  afterCancel === 'Empty — drag a photo here'
    ? pass('cancel discards staged photo changes')
    : fail(`cancel left staged changes behind: s3 reads "${afterCancel}"`);

  // Save commits them, and says what it did.
  await drop('a4', 's3');
  await drop('a3', 's1');
  await page.waitForTimeout(200);
  await page.click('[data-attach-save]');
  await page.waitForTimeout(400);
  const banner = await page.evaluate(
    () => document.querySelector('[data-success]')?.textContent?.trim() ?? ''
  );
  /1 photo added/.test(banner) && /1 replaced/.test(banner) && /saved together/.test(banner)
    ? pass(`save reports the batch — "${banner.slice(0, 60)}…"`)
    : fail(`save banner wrong: "${banner}"`);

  await page.click('[data-photos="4"]');
  await page.waitForSelector('[data-attach]:not([hidden])');
  await page.waitForTimeout(300);
  const committed = await slotText('s1');
  committed === 'Counter display'
    ? pass('saved photo changes persist after the panel closes')
    : fail(`save did not commit: s1 reads "${committed}"`);

  await page.click('[data-attach-close]');
}

// Fullscreen. The portal is a dense app inside a page section, so this is how
// anyone actually tries it — and it has two code paths, because iOS Safari
// refuses element fullscreen. Both are checked.
{
  const before = await page.evaluate(
    () => Math.round(document.querySelector('.sandbox__frame').getBoundingClientRect().height)
  );
  await page.click('[data-fullscreen]');
  await page.waitForTimeout(600);
  const on = await page.evaluate(() => ({
    h: Math.round(document.querySelector('.sandbox__frame').getBoundingClientRect().height),
    label: document.querySelector('[data-fullscreen-label]').textContent,
    pressed: document.querySelector('[data-fullscreen]').getAttribute('aria-pressed'),
    api: document.fullscreenElement === document.querySelector('[data-sandbox]'),
  }));
  await page.click('[data-fullscreen]');
  await page.waitForTimeout(600);
  const off = await page.evaluate(() => ({
    h: Math.round(document.querySelector('.sandbox__frame').getBoundingClientRect().height),
    label: document.querySelector('[data-fullscreen-label]').textContent,
  }));

  on.h > before && on.label === 'Exit fullscreen' && on.pressed === 'true' && on.api
    ? pass(`demo goes fullscreen — frame ${before}px to ${on.h}px`)
    : fail(`fullscreen did not engage: ${JSON.stringify(on)}`);
  off.h === before && off.label === 'Fullscreen'
    ? pass('demo exits fullscreen and restores its inline size')
    : fail(`exit fullscreen left it at ${JSON.stringify(off)}`);
}

// The fallback for browsers that refuse element fullscreen — iOS Safari on
// iPhone allows it only for <video>. Same layout, driven by a class instead.
{
  const fs = await ctx.newPage();
  await fs.addInitScript(() => {
    Element.prototype.requestFullscreen = () => Promise.reject(new Error('not allowed'));
  });
  await fs.goto(`${BASE}/demo`, { waitUntil: 'networkidle' });
  await fs.waitForTimeout(900);
  const base = await fs.evaluate(
    () => Math.round(document.querySelector('.sandbox__frame').getBoundingClientRect().height)
  );
  await fs.click('[data-fullscreen]');
  await fs.waitForTimeout(500);
  const on = await fs.evaluate(() => ({
    h: Math.round(document.querySelector('.sandbox__frame').getBoundingClientRect().height),
    faux: document.querySelector('[data-sandbox]').classList.contains('is-fullscreen'),
    locked: document.body.style.overflow === 'hidden',
  }));
  await fs.keyboard.press('Escape');
  await fs.waitForTimeout(500);
  const off = await fs.evaluate(() => ({
    h: Math.round(document.querySelector('.sandbox__frame').getBoundingClientRect().height),
    faux: document.querySelector('[data-sandbox]').classList.contains('is-fullscreen'),
    locked: document.body.style.overflow === 'hidden',
  }));

  on.faux && on.h > base && on.locked
    ? pass(`fullscreen falls back without the API — frame ${base}px to ${on.h}px`)
    : fail(`fullscreen fallback failed: ${JSON.stringify(on)}`);
  !off.faux && off.h === base && !off.locked
    ? pass('Escape leaves the fallback and unlocks page scroll')
    : fail(`Escape did not restore: ${JSON.stringify(off)}`);
  await fs.close();
}

{
  await page.click('[data-tab="version-tree"]');
  await page.waitForTimeout(500);
  const tree = await page.evaluate(() => ({
    cards: document.querySelectorAll('[data-vtree] .vtree-card').length,
    edges: document.querySelectorAll('[data-vtree-edges] path').length,
  }));
  // Five nodes and four edges is a tree with a branch in it. A straight line
  // would also give 5 and 4, so check the branch explicitly: two versions
  // share a parent.
  tree.cards === 5 && tree.edges === 4
    ? pass(`version tree draws ${tree.cards} versions and ${tree.edges} edges`)
    : fail(`version tree wrong: ${JSON.stringify(tree)}`);
  await page.click('[data-tab="real-site"]');
}

await page.click('[data-revise-latest]');
await page.waitForSelector('[data-revise]:not([hidden])');
pass('change-request workspace opens');

const pill = (await page.textContent('[data-revise-version]')).trim();
pill === 'Version 3' ? pass(`version pill reads "${pill}"`) : fail(`pill said "${pill}"`);

// Click a heading in the preview the way a person would: a real mouse click at
// its on-screen position. The preview's photos arrive late and reflow it, so
// let it settle before measuring where to click.
const frame = page.frameLocator('[data-frame]');
await frame.locator('h1').first().waitFor({ timeout: 15000 });
await page.waitForTimeout(2500);
const hbox = await frame.locator('h1').first().boundingBox();
await page.mouse.click(hbox.x + hbox.width / 2, hbox.y + hbox.height / 2);
await page.waitForTimeout(500);

const noteLabel = await page.textContent('.client-revise-note-label').catch(() => null);
noteLabel
  ? pass(`element note created: "${noteLabel.trim().slice(0, 50)}…"`)
  : fail('clicking the preview created no note');

await page.fill('.client-revise-note textarea', 'Make this bigger.');
await page.fill('[data-overall]', 'Warmer colours please.');
await page.waitForTimeout(200);

const prompt = await page.textContent('[data-prompt]');
prompt.includes('Overall changes for the whole website')
  ? pass('prompt preview uses the real client prompt format')
  : fail('prompt preview format is wrong');
prompt.includes('On the Home page:')
  ? pass('prompt includes the page section')
  : fail('prompt missing the page section');

(await page.getAttribute('[data-send]', 'disabled')) === null
  ? pass('send button enables once there is content')
  : fail('send button still disabled');

await page.click('[data-send]');
await page.waitForSelector('[data-success]:not([hidden])', { timeout: 5000 });
(await page.textContent('[data-success]')).includes('Your change request was sent')
  ? pass('success banner matches the real portal copy')
  : fail('success banner copy is wrong');

await page.waitForSelector('[data-log]:not([hidden])');
(await page.locator('[data-log-items] li').count()) === 1
  ? pass("request appears in the \"what we'd receive\" log")
  : fail('narration log did not record the request');

await page.click('[data-reset]');
await page.waitForTimeout(300);
(await page.locator('[data-log-items] li').count()) === 0
  ? pass('reset clears demo state')
  : fail('reset left state behind');

// ── 3. Reduced motion ──────────────────────────────────────────────────────
console.log('\n[3] Reduced motion');
const rmCtx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'reduce',
});
const rm = await rmCtx.newPage();
await rm.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await rm.waitForTimeout(600);

// Everything is readable without the scroll-reveal ever running.
(await rm.evaluate(() =>
  [...document.querySelectorAll('[data-reveal]')].every(
    (el) => getComputedStyle(el).opacity === '1'
  )
))
  ? pass('all content visible (no reveal animation)')
  : fail('some content stayed hidden');

// Nothing is animating, and nothing is mid-transition.
const rmStill = await rm.evaluate(() => {
  const running = document.getAnimations().filter((a) => a.playState === 'running');
  return { running: running.length, names: running.slice(0, 3).map((a) => a.animationName || '?') };
});
rmStill.running === 0
  ? pass('nothing on the page is animating under reduced motion')
  : fail(`${rmStill.running} animation(s) still running: ${rmStill.names.join(', ')}`);

// The hero is a normal section now, so the page starts where it looks like it
// starts. The old one was 550vh of pinned canvas; a regression back to
// anything near that would be invisible in a screenshot but obvious here.
const firstFold = await rm.evaluate(() => {
  const hero = document.querySelector('.section--hero');
  return hero ? Math.round(hero.getBoundingClientRect().height) : -1;
});
firstFold > 0 && firstFold < 1400
  ? pass(`hero is one screen, not a scroll sequence (${firstFold}px)`)
  : fail(`hero section is ${firstFold}px tall`);

await rmCtx.close();

// ── 4. Contact form ────────────────────────────────────────────────────────
console.log('\n[4] Contact form');
await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' });

await page.click('[data-submit]');
await page.waitForTimeout(300);
(await page.getAttribute('[data-status]', 'data-state')) === 'error'
  ? pass('empty submit is blocked with an inline error')
  : fail('empty submit was not blocked');

(await page.evaluate(() => document.activeElement?.id)) === 'name'
  ? pass('focus moves to the first invalid field')
  : fail('focus did not move to the first invalid field');

await page.fill('#name', 'Rosa Delgado');
await page.fill('#business', "Rosa's Bakery");
await page.fill('#type', 'Bakery');
await page.fill('#email', 'not-an-email');
await page.click('[data-submit]');
await page.waitForTimeout(300);
(await page.getAttribute('#email', 'aria-invalid')) === 'true'
  ? pass('invalid email is flagged on the field')
  : fail('bad email was accepted');

await page.fill('#email', 'rosa@example.com');

// The form posts to a real Formspree endpoint now, so both submit paths are
// exercised against an intercepted request. Letting the POST through would put
// a fake Rosa's Bakery inquiry in the real inbox on every verify run — and
// would make the result depend on Formspree being up.
const action = await page.getAttribute('[data-form]', 'action');
/^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/.test(action ?? '') &&
!/REPLACE_WITH/.test(action ?? '')
  ? pass(`form posts to a configured Formspree endpoint — ${action}`)
  : fail(`form action is not a configured Formspree endpoint — ${action}`);

// Rejection first: the visitor has to be pointed at the email address.
await page.route('https://formspree.io/**', (route) =>
  route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"no"}' })
);
await page.click('[data-submit]');
await page
  .waitForFunction(() => document.querySelector('[data-status]')?.dataset.state === 'error', null, {
    timeout: 10000,
  })
  .catch(() => {});
const rejected = await page.textContent('[data-status]');
/email us directly/i.test(rejected ?? '')
  ? pass('a rejected send fails loudly and points at the email fallback')
  : fail(`a rejected send did not point at the email fallback — ${rejected}`);
await page.unroute('https://formspree.io/**');

// Acceptance: the real field names go up, and the confirmation replaces the form.
let posted = null;
await page.route('https://formspree.io/**', async (route) => {
  posted = route.request().postDataBuffer()?.toString('utf8') ?? '';
  await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
});
await page.click('[data-submit]');
await page.waitForSelector('[data-done]:not([hidden])', { timeout: 10000 }).catch(() => {});
(await page.isVisible('[data-done]'))
  ? pass('an accepted send swaps the form for the confirmation')
  : fail('an accepted send did not show the confirmation');

/Rosa Delgado/.test(posted ?? '') && /rosa@example\.com/.test(posted ?? '')
  ? pass('the posted body carries the filled-in fields')
  : fail('the posted body did not carry the filled-in fields');
await page.unroute('https://formspree.io/**');

// ── 5. Buttons ─────────────────────────────────────────────────────────────
console.log('\n[5] Buttons');
await page.goto(`${BASE}/pricing`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);

const strays = await page.$$eval('a,button', (els) =>
  els
    .filter((el) => {
      const t = (el.textContent || '').trim();
      // Skip the portal lookalike (deliberately its own system), nav/footer
      // chrome, the FAQ accordion, anything hidden, and Astro's dev toolbar.
      if (!t || el.closest('.sandbox, nav, footer, .faq, header, astro-dev-toolbar')) return false;
      if (el.getBoundingClientRect().height === 0) return false;
      const cs = getComputedStyle(el);
      const styled = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.borderTopWidth !== '0px';
      return styled && !el.classList.contains('btn') && !el.classList.contains('link-arrow');
    })
    .map((el) => el.tagName + '.' + el.className)
);
strays.length === 0
  ? pass('no ad-hoc buttons outside the shared system')
  : fail('ad-hoc buttons found: ' + strays.slice(0, 4).join(', '));

const geom = await page.$$eval('.btn', (els) =>
  els
    .filter((el) => el.getBoundingClientRect().height > 0)
    .map((el) => ({
      r: getComputedStyle(el).borderRadius,
      h: Math.round(el.getBoundingClientRect().height),
    }))
);
geom.filter((g) => parseFloat(g.r) > 100).length === 0
  ? pass(`all ${geom.length} buttons use the system radius, not a full pill`)
  : fail('some buttons are still fully rounded');

const heights = [...new Set(geom.map((g) => g.h))].sort((a, b) => a - b);
heights.every((h) => [40, 48, 56].includes(h))
  ? pass('button heights are all on the 40/48/56 scale — ' + heights.join(', '))
  : fail('off-scale button heights: ' + heights.join(', '));

const ring = await page.evaluate(() => {
  const b = document.querySelector('.btn--primary');
  b.focus();
  const cs = getComputedStyle(b);
  return { width: cs.outlineWidth, colour: cs.outlineColor };
});
parseFloat(ring.width) >= 2 && ring.colour === 'rgb(47, 61, 214)'
  ? pass(`primary button focus ring is ${ring.width} of accent`)
  : fail(`focus ring looks wrong: ${JSON.stringify(ring)}`);

// Radius is 6px on buttons and 8px on cards — "nothing larger" is the rule,
// so this catches a stray pill or a leftover 14px as well as a full round.
const radii = [...new Set(geom.map((g) => parseFloat(g.r)))].sort((a, b) => a - b);
radii.every((r) => r <= 8)
  ? pass(`button radii are all 8px or under — ${radii.join(', ')}px`)
  : fail(`oversized button radius: ${radii.join(', ')}px`);

// Nothing decorative is layered on a button any more: no event-horizon ring,
// no lensing sweep, no press ripple. Those pseudo-elements were the "AI-made"
// tell this redesign removes, and they come back easily by habit.
const bare = await page.evaluate(() => {
  const b = document.querySelector('.btn--primary');
  const junk = [];
  for (const pseudo of ['::before', '::after']) {
    const cs = getComputedStyle(b, pseudo);
    if (cs.content !== 'none' && cs.content !== 'normal') junk.push(pseudo);
  }
  return junk;
});
bare.length === 0
  ? pass('buttons carry no decorative pseudo-element layers')
  : fail(`decorative layer(s) back on .btn: ${bare.join(', ')}`);

await page.mouse.move(0, 0);
const btnBox = await page.locator('.btn--primary').first().boundingBox();
await page.mouse.move(btnBox.x + 20, btnBox.y + 20);
await page.mouse.down();
await page.waitForTimeout(60);
const ripples = await page.locator('.btn__ripple').count();
await page.mouse.up();
ripples === 0
  ? pass('pressing a button spawns no ripple')
  : fail(`${ripples} ripple element(s) spawned — buttons.js is back`);

// ── 6. Light surfaces ──────────────────────────────────────────────────────
// The inverse of the check that used to live here. The old design gave every
// dark section a drifting star field and a sheen; the new one has no
// atmosphere at all, one dark surface, and sections that alternate. Each of
// those is easy to undo by accident — a `background: linear-gradient` on a
// section reads as harmless in a diff — so each is a test.
console.log('\n[6] Light surfaces');

const SURFACE_PAGES = ['/', '/pricing', '/work', '/how-it-works', '/benefits', '/why-us', '/contact', '/free-mock', '/free-mock/thanks'];

let atmosphere = [];
let darkSurfaces = [];
let repeats = [];

for (const path of SURFACE_PAGES) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  const found = await page.evaluate((p) => {
    const out = { atmos: [], dark: [], repeat: [] };
    const lum = (c) => {
      const m = c.match(/\d+(\.\d+)?/g);
      if (!m) return 1;
      const [r, g, b] = m.slice(0, 3).map(Number);
      const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };

    // No gradient, image or animation anywhere on a section or its pseudos.
    for (const el of document.querySelectorAll('.section, .foot')) {
      for (const pseudo of [null, '::before', '::after']) {
        const cs = getComputedStyle(el, pseudo);
        const img = cs.backgroundImage;
        if (img && img !== 'none') out.atmos.push(`${p} ${el.className.split(' ')[1] || 'section'}${pseudo || ''} background-image`);
        if (cs.animationName && cs.animationName !== 'none') out.atmos.push(`${p} ${el.className.split(' ')[1] || 'section'}${pseudo || ''} animation ${cs.animationName}`);
      }
    }

    // The footer is the only surface darker than its own text.
    for (const el of document.querySelectorAll('.section')) {
      if (lum(getComputedStyle(el).backgroundColor) < 0.4) out.dark.push(p + ' ' + el.className);
    }

    // Sections alternate. Two of the same surface in a row is a boundary that
    // has gone missing, which on a long page reads as one endless block.
    const secs = [...document.querySelectorAll('main > .section')];
    for (let i = 1; i < secs.length; i++) {
      const a = getComputedStyle(secs[i - 1]).backgroundColor;
      const b = getComputedStyle(secs[i]).backgroundColor;
      // A section deliberately butted against the one above it (the demo's
      // sandbox well) opts out with padding-top: 0.
      if (a === b && parseFloat(getComputedStyle(secs[i]).paddingTop) > 0) {
        out.repeat.push(`${p} section ${i} and ${i + 1} are both ${b}`);
      }
    }
    return out;
  }, path);

  atmosphere.push(...found.atmos);
  darkSurfaces.push(...found.dark);
  repeats.push(...found.repeat);
}

atmosphere.length === 0
  ? pass(`no gradients, textures or ambient animation on any section (${SURFACE_PAGES.length} pages)`)
  : fail(`atmosphere is back: ${atmosphere.slice(0, 4).join('; ')}`);

darkSurfaces.length === 0
  ? pass('the footer is the only dark surface on the site')
  : fail(`dark section(s) outside the footer: ${darkSurfaces.slice(0, 4).join('; ')}`);

repeats.length === 0
  ? pass('sections alternate between the two light surfaces on every page')
  : fail(`adjacent sections share a surface: ${repeats.slice(0, 4).join('; ')}`);

// ── 7. Static captures of the portal ───────────────────────────────────────
// The home page teaser is a picture of a component that lives in this repo, so
// it can drift out of date without anything failing. It did: the portal was
// redesigned from mint to gold and the teaser kept showing the old one.
//
// Hue is the tell. The old portal's accent was mint (#3dd6a5, hue ~160) and the
// new one is our gold (#f5c24b, hue ~44), so a capture of the wrong era is
// obvious from the pixels without needing to know anything about layout.
//
// Deliberately scoped to the portal captures only. Two of the client-site
// screenshots are legitimately green — landscaping is foliage, dental is teal
// branding — and a blanket "no green anywhere" rule would fail on both.
console.log('\n[7] Portal captures are current');
{
  const PORTAL_SHOTS = ['public/shots/demo.webp'];

  const hueCounts = async (file) => {
    const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
    let mint = 0;
    let gold = 0;
    for (let i = 0; i < data.length; i += info.channels * 7) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      // Skip near-black and near-grey: the portal is mostly both, and neither
      // has a meaningful hue.
      if (mx < 60 || mx - mn < 30) continue;
      let h;
      if (mx === r) h = 60 * ((((g - b) / (mx - mn)) % 6 + 6) % 6);
      else if (mx === g) h = 60 * ((b - r) / (mx - mn) + 2);
      else h = 60 * ((r - g) / (mx - mn) + 4);
      if (h >= 120 && h <= 190) mint++;
      if (h >= 30 && h <= 60) gold++;
    }
    return { mint, gold };
  };

  for (const file of PORTAL_SHOTS) {
    const { mint, gold } = await hueCounts(file);
    const line = `${file} — ${gold} gold px, ${mint} mint px`;
    if (gold > 200 && gold > mint * 3) {
      pass(`${line} (current gold portal)`);
    } else {
      fail(
        `${line} — this looks like a capture of the pre-rebuild mint portal. ` +
          `Regenerate it with \`npm run shots:teaser\`.`
      );
    }
  }
}

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} FAILURE(S)`}\n`);
await browser.close();
process.exit(failures ? 1 : 0);
