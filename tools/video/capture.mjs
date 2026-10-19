/**
 * Captures the film's footage: real screen recordings, never drawings.
 * `npm run capture` (needs `npm run build` at the repo root first — /demo is
 * captured from the built site, served locally). `npm run capture -- andys`
 * re-captures only the clips whose names start with "andys".
 *
 *   assets/footage/portal-request.webm   click the headline, type a note, send
 *   assets/footage/portal-sentence.webm  a one-sentence request, sent
 *   assets/footage/portal-switch.webm    Host this version on v2
 *   assets/footage/portal-stills/*.png   the version tree and the preview with
 *                                        v3 and with v2 live, for the switch
 *                                        beat's split screen
 *   assets/footage/andys-1440.jpg, andys-390.jpg, andys-sections.json
 *   assets/footage/andys-phone-scroll.webm
 *
 * Each recording has a `<name>.json` beside it: its size and a log of every
 * cursor move, click and keystroke with its time in the clip. A screenshot
 * has no cursor in it, so the video draws one from that log, and places the
 * keyboard ticks and click sounds from the same log.
 *
 * How it records. Playwright's recordVideo encodes at a fixed low bitrate and
 * drops the 2× device scale, and a 2× screenshot takes ~90ms, so nothing
 * real-time gets 30 crisp frames a second. So each clip is stepped, one frame
 * at a time, on a clock the script controls:
 *   - page JavaScript runs on Playwright's fake clock (context.clock), paused
 *     and advanced exactly 1/30s per frame — timers, Date, rAF;
 *   - CSS transitions and animations run at RATE of real time (CDP
 *     Animation.setPlaybackRate), and each frame waits the real time that
 *     makes them advance the same 1/30s;
 *   - the mouse and keyboard act at fixed frame numbers.
 * Then each frame is a lossless 2× screenshot of the portal (or phone), and
 * the frames are encoded VP9 at high quality. The same script gives the same
 * clip.
 *
 * What is changed during capture, and only here (the site is not touched):
 *   - loremflickr images in the bakery preview → the Pexels photos in
 *     assets/photos (see PHOTOS.md). An unexpected loremflickr request fails
 *     the capture rather than slipping into a frame.
 *   - rosasbakery.com → rosasbakery.example: rosasbakery.com is a registered
 *     domain, and the ad must not show it as one of our sites (BACKLOG.md).
 *   - The sandbox's own banner ("Live demo with sample data…") is cropped
 *     off: the frame is the portal. The video labels it "Demo account".
 *
 * The three real sites (sections below) are captured down to a cut above
 * whatever must not be in an ad; what is below the cut is never saved.
 */
import { chromium } from '../../node_modules/playwright/index.mjs';
import sharp from '../../node_modules/sharp/lib/index.js';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const DIST = here('../../dist/');
const OUT = here('./assets/footage/');
const PHOTOS = here('./assets/photos/');
const TMP = here('./out/.capture/');
const FPS = 30;
const FRAME_MS = 1000 / FPS;
const DPR = 2;
/** CSS animations run at this fraction of real time while capturing. */
const RATE = 0.1;
const only = process.argv.slice(2);
const want = (name) => only.length === 0 || only.some((o) => name.startsWith(o));

if (!existsSync(join(DIST, 'demo/index.html'))) {
  throw new Error('No dist/demo/index.html: run `npm run build` at the repo root first.');
}
mkdirSync(OUT, { recursive: true });

/* A static server for dist/ ------------------------------------------------- */

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json', '.ico': 'image/x-icon', '.jpg': 'image/jpeg' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  let file = join(DIST, p);
  if (!existsSync(file) && existsSync(join(file, 'index.html'))) file = join(file, 'index.html');
  if (!existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;

/* Capture-time substitutions ------------------------------------------------ */

const PHOTO_FOR_LOCK = { 11: 'hero-loaves.jpg', 21: 'sourdough.jpg', 22: 'croissants.jpg', 23: 'cake.jpg', 31: 'interior.jpg' };

async function prepare(context) {
  await context.route(/loremflickr\.com/, (route) => {
    const url = new URL(route.request().url());
    const width = Number(url.pathname.split('/')[1]);
    // The sandbox's own image library (320px, Assets tab) is never shown.
    if (width < 600) return route.abort();
    const file = PHOTO_FOR_LOCK[url.searchParams.get('lock')];
    if (!file) throw new Error(`Unmapped loremflickr image: ${url}`);
    return route.fulfill({ contentType: 'image/jpeg', body: readFileSync(join(PHOTOS, file)) });
  });
  await context.route(`${ORIGIN}/**`, async (route) => {
    const response = await route.fetch();
    const type = response.headers()['content-type'] ?? '';
    if (!/html|javascript/.test(type)) return route.fulfill({ response });
    const body = (await response.text()).replaceAll('rosasbakery.com', 'rosasbakery.example');
    return route.fulfill({ response, body });
  });
}

/* The stepper -------------------------------------------------------------- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

/**
 * Records `act` frame by frame. `crop` is a CSS-pixel box in the viewport;
 * the frames are that box at 2×, and everything logged is relative to it.
 */
async function record(page, name, crop, act) {
  const context = page.context();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Animation.enable');
  await cdp.send('Animation.setPlaybackRate', { playbackRate: RATE });
  await context.clock.pauseAt(Date.now() + 1000);

  const dir = join(TMP, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const log = [];
  let frame = 0;
  let mark = performance.now();

  /** One frame: a 2× screenshot of the crop, then page time and CSS time
   *  both advance by 1/30s. Playwright's screenshot, not CDP's: CDP's clip is
   *  in document coordinates and misplaces the sandbox's fixed layout. The
   *  text caret stays in (`caret: 'initial'`) — typing should look typed. */
  async function tick() {
    const buf = await page.screenshot({ clip: crop, scale: 'device', animations: 'allow', caret: 'initial', timeout: 10000 });
    if (frame === 0) {
      const m = await sharp(buf).metadata();
      if (m.width !== crop.width * DPR) throw new Error(`${name}: frames are ${m.width}px wide, not ${DPR}×`);
    }
    writeFileSync(join(dir, `${String(frame).padStart(5, '0')}.png`), buf);
    frame++;
    await context.clock.runFor(FRAME_MS);
    const spent = performance.now() - mark;
    const owed = FRAME_MS / RATE - spent;
    if (owed < 0 && frame > 1) console.warn(`  ${name}: frame ${frame} took ${spent.toFixed(0)}ms, CSS ran ${(-owed * RATE).toFixed(1)}ms ahead`);
    await sleep(Math.max(0, owed));
    mark = performance.now();
  }
  const t = () => +(frame / FPS).toFixed(3);
  let at = { x: crop.x + crop.width * 0.62, y: crop.y + crop.height * 0.72 };
  await page.mouse.move(at.x, at.y);
  log.push({ t: 0, type: 'move', x: at.x - crop.x, y: at.y - crop.y });

  const c = {
    /** Holds for `ms`, frame by frame. */
    async wait(ms) { for (let i = Math.round(ms / FRAME_MS); i > 0; i--) await tick(); },
    /** Moves the real mouse along an eased path over `ms`. */
    async move(x, y, ms = 600) {
      const from = at, steps = Math.max(1, Math.round(ms / FRAME_MS));
      for (let i = 1; i <= steps; i++) {
        const p = easeInOut(i / steps);
        const px = from.x + (x - from.x) * p, py = from.y + (y - from.y) * p;
        await page.mouse.move(px, py);
        log.push({ t: t(), type: 'move', x: +(px - crop.x).toFixed(1), y: +(py - crop.y).toFixed(1) });
        await tick();
      }
      at = { x, y };
    },
    async to(locator, ms = 600, dx = 0.5, dy = 0.5) {
      const b = await locator.boundingBox();
      if (!b) throw new Error(`${name}: nothing to move to`);
      await c.move(b.x + b.width * dx, b.y + b.height * dy, ms);
    },
    async click() {
      log.push({ t: t(), type: 'click', x: +(at.x - crop.x).toFixed(1), y: +(at.y - crop.y).toFixed(1) });
      await page.mouse.down();
      await tick(); await tick();
      await page.mouse.up();
    },
    /** Types at `cps` characters a second. */
    async type(text, cps = 12) {
      const per = Math.max(1, Math.round(FPS / cps));
      for (const ch of text) {
        log.push({ t: t(), type: 'key', ch });
        await page.keyboard.type(ch);
        for (let i = 0; i < per; i++) await tick();
      }
    },
    /** Scrolls with the mouse wheel, `dy` CSS px over `ms`, eased. */
    async scroll(dy, ms = 700) {
      const steps = Math.max(1, Math.round(ms / FRAME_MS));
      let done = 0;
      log.push({ t: t(), type: 'scroll', dy });
      for (let i = 1; i <= steps; i++) {
        const want = Math.round(dy * easeInOut(i / steps));
        await page.mouse.wheel(0, want - done);
        done = want;
        await tick();
      }
    },
    /** Wheels whatever is under the cursor until `locator` is in the frame. */
    async reveal(locator, ms = 600) {
      const b = await locator.boundingBox();
      if (!b) throw new Error(`${name}: nothing to reveal`);
      const over = Math.round(b.y + b.height - (crop.y + crop.height - 70));
      if (over > 0) await c.scroll(over, ms);
    },
    mark(label) { log.push({ t: t(), type: 'mark', label }); },
  };

  await act(c);
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
  await cdp.detach();

  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(dir, '%05d.png'),
    '-c:v', 'libvpx-vp9', '-crf', '18', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2',
    '-pix_fmt', 'yuv420p', join(OUT, `${name}.webm`)]);
  rmSync(dir, { recursive: true, force: true });
  const meta = { name, fps: FPS, scale: DPR, width: crop.width, height: crop.height, frames: frame, duration: +(frame / FPS).toFixed(3), log };
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify(meta, null, 1));
  const n = (type) => log.filter((e) => e.type === type).length;
  console.log(`✓ ${name}.webm  ${meta.duration.toFixed(1)}s, ${n('click')} clicks, ${n('key')} keys`);
}

/* The portal --------------------------------------------------------------- */

// The new headless mode; the old headless shell renders a few CSS effects
// differently from a real browser.
const browser = await chromium.launch({ channel: 'chromium' });

async function portal() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: DPR });
  await prepare(context);
  await context.addInitScript(() => {
    Element.prototype.requestFullscreen = () => Promise.reject(new Error('refused for capture'));
  });
  const page = await context.newPage();
  // `load`, not `networkidle`: the seat banner keeps asking the backend.
  await page.goto(`${ORIGIN}/demo/`, { waitUntil: 'load' });
  await sleep(600);
  // The sandbox's own Fullscreen button, taking its fallback path (the one
  // iPhone Safari gets): the portal fills the window under the sandbox
  // banner, which the crop leaves out. The real Fullscreen API resizes a
  // headless window, so it is refused here and the fallback runs instead.
  await page.locator('[data-fullscreen]').first().click();
  await sleep(800);
  if (!(await page.evaluate(() => document.querySelector('[data-sandbox]').classList.contains('is-fullscreen')))) {
    throw new Error('The sandbox did not take its fullscreen layout');
  }
  // The rest of /demo — the site's nav and the sections around the sandbox —
  // still paints through the fallback layout in a headless window, so it is
  // hidden for capture: every sibling of every ancestor of the sandbox.
  await page.evaluate(() => {
    for (let el = document.querySelector('[data-sandbox]'); el && el !== document.body; el = el.parentElement) {
      for (const sib of el.parentElement.children) if (sib !== el && sib.tagName !== 'SCRIPT' && sib.tagName !== 'STYLE') sib.style.display = 'none';
    }
    scrollTo(0, 0);
  });
  await sleep(400);
  // The page clock goes in after the page is up; record() pauses it.
  await context.clock.install();
  const f = await page.locator('.sandbox__frame').boundingBox();
  const crop = { x: Math.round(f.x), y: Math.round(f.y), width: Math.round(f.width), height: Math.round(f.height) };
  const $ = (s) => page.locator(s).first();
  return { context, page, crop, $ };
}

/** How far to wheel so `sel` sits in the lower part of the window. */
async function scrollToShow(page, sel) {
  const b = await page.locator(sel).first().boundingBox();
  return Math.max(0, Math.round(b.y - 900 * 0.62));
}

const preview = (page) => page.frameLocator('[data-revise] iframe[data-frame]');

/** True once the open workspace's preview has loaded with every image. */
const previewReady = (page) => page.evaluate(() => {
  const d = document.querySelector('[data-revise] iframe[data-frame]')?.contentDocument;
  return !!d && d.readyState === 'complete' && [...d.images].every((i) => i.complete && i.naturalWidth > 0);
});

async function openWorkspace(page, $, how) {
  await $('.client-nav-tab[data-tab="real-site"]').click();
  await $(how).click();
  for (let i = 0; i < 50 && !(await previewReady(page)); i++) await sleep(100);
  if (!(await previewReady(page))) throw new Error('The preview did not load');
}

if (want('portal-request')) {
  const { context, page, crop, $ } = await portal();
  await openWorkspace(page, $, '[data-revise-vnum="3"]');
  await record(page, 'portal-request', crop, async (c) => {
    await c.wait(500);
    await c.to(preview(page).locator('h1').first(), 900, 0.3, 0.5);
    await c.wait(250);
    await c.click();
    c.mark('picked');
    await c.wait(600);
    await c.to($('[data-notes] textarea'), 700, 0.3, 0.4);
    await c.click();
    await c.wait(200);
    await c.type('Make this warmer');
    await c.wait(400);
    await c.reveal($('[data-send]'), 600);
    await c.to($('[data-send]'), 700);
    await c.wait(150);
    await c.click();
    c.mark('sent');
    await c.wait(900); // the sandbox's own 650ms round trip, then the success line
    if (!(await page.locator('[data-revise]').isHidden())) throw new Error('portal-request: did not send');
    c.mark('success');
    await c.wait(1600);
  });
  await context.close();
}

if (want('portal-sentence')) {
  const { context, page, crop, $ } = await portal();
  await openWorkspace(page, $, '[data-revise-latest]');
  await record(page, 'portal-sentence', crop, async (c) => {
    await c.wait(400);
    await c.to($('[data-overall]'), 800, 0.3, 0.35);
    await c.click();
    await c.wait(200);
    await c.type("Say we're open Sundays now");
    await c.wait(400);
    await c.reveal($('[data-send]'), 600);
    await c.to($('[data-send]'), 700);
    await c.wait(150);
    await c.click();
    c.mark('sent');
    await c.wait(900);
    if (!(await page.locator('[data-revise]').isHidden())) throw new Error('portal-sentence: did not send');
    c.mark('success');
    await c.wait(1800);
  });
  await context.close();
}

if (want('portal-switch')) {
  const { context, page, crop, $ } = await portal();
  await $('.client-nav-tab[data-tab="real-site"]').click();
  await $('[data-host="2"]').scrollIntoViewIfNeeded();
  await sleep(300);
  await record(page, 'portal-switch', crop, async (c) => {
    await c.wait(400);
    await c.to($('[data-host="2"]'), 900);
    await c.wait(200);
    await c.click();
    c.mark('switched');
    await c.wait(1600);
  });
  await context.close();

  // Stills for the split screen: the tree and the preview, before and after.
  const stills = join(OUT, 'portal-stills');
  mkdirSync(stills, { recursive: true });
  for (const v of [3, 2]) {
    const s = await portal();
    if (v === 2) {
      await s.$('.client-nav-tab[data-tab="real-site"]').click();
      await s.$('[data-host="2"]').click();
    }
    await s.$('.client-nav-tab[data-tab="version-tree"]').click();
    await s.context.clock.runFor(1000);
    await sleep(400);
    await s.page.locator('.sandbox__frame').screenshot({ path: join(stills, `tree-v${v}-live.png`) });
    await openWorkspace(s.page, s.$, `[data-revise-vnum="${v}"]`);
    await s.context.clock.runFor(1000);
    await sleep(400);
    await s.page.locator('[data-revise] .client-revise-preview-body').screenshot({ path: join(stills, `preview-v${v}.png`) });
    await s.context.close();
  }
  console.log('✓ portal-stills/ tree-v3-live, tree-v2-live, preview-v3, preview-v2');
}

/* Real sites --------------------------------------------------------------- */

/**
 * A site, scrolled through once so its reveal-on-scroll runs, then back to
 * the top. `prepare` runs on the context first (routes, styles).
 */
async function sitePage(url, width, height, { clock = false, prep } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: DPR });
  if (prep) await prep(context);
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await sleep(1200);
  await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; }));
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 300) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
    scrollTo(0, 0);
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
  });
  await sleep(1200);
  const broken = await page.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src));
  if (broken.length) throw new Error(`${url}: images failed to load: ${broken.join(', ')}`);
  if (await page.evaluate(() => /pumpkin|halloween|🎃/i.test(document.body.innerHTML))) console.warn(`! ${url} has seasonal (pumpkin / Halloween) markup — check the frames`);
  if (clock) await context.clock.install();
  return { context, page };
}

/**
 * Full-page capture of `sections` (CSS selectors, in page order) down to the
 * top of `stopBefore`, as a 2× JPEG; and the sections' boxes as JSON. What is
 * below the cut never reaches the repository.
 */
async function capturePage(name, url, width, sectionsSel, stopBefore, opts) {
  const { context, page } = await sitePage(url, width, 900, opts);
  const shot = await page.screenshot({ fullPage: true });
  const info = await page.evaluate(({ list, stop }) => {
    const box = (el) => { const r = el.getBoundingClientRect(); return { y: Math.round(r.top + scrollY), height: Math.round(r.height) }; };
    const sections = list.map(({ id, sel, through }) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`no ${sel}`);
      const b = box(el);
      // `through`: the section runs on to the bottom of another element (a
      // demo bar and the header under it count as one).
      if (through) { const t = box(document.querySelector(through)); b.height = t.y + t.height - b.y; }
      return { id, ...b };
    });
    return { sections, stopAt: box(typeof stop === 'string' ? document.querySelector(stop) : null).y };
  }, { list: sectionsSel, stop: stopBefore });
  const m = await sharp(shot).metadata();
  await sharp(shot).extract({ left: 0, top: 0, width: m.width, height: info.stopAt * DPR }).jpeg({ quality: 90, mozjpeg: true }).toFile(join(OUT, `${name}-${width}.jpg`));
  await context.close();
  return info;
}

/** A smooth `ms` scroll of a phone view from the top to `to`, recorded. */
async function phoneScroll(name, url, toSel, { crop, ms = 6000, prep, back = 844 } = {}) {
  const { context, page } = await sitePage(url, 390, 844, { clock: true, prep });
  const to = await page.evaluate(({ sel, back }) => Math.round(document.querySelector(sel).getBoundingClientRect().top + scrollY - back), { sel: toSel, back });
  await page.evaluate(({ to, ms }) => {
    const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
    window.__scroll = () => {
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / ms);
        scrollTo(0, to * ease(p));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
  }, { to, ms });
  await record(page, name, crop ?? { x: 0, y: 0, width: 390, height: 844 }, async (c) => {
    await c.wait(500);
    c.mark('scroll');
    await page.evaluate(() => window.__scroll());
    await c.wait(ms + 300);
  });
  await context.close();
}

/* Cedar & Stone — public/landscaping.html, a concept site for a fictional
   business, hand-built by us. As in V1: its loremflickr images become the
   four Pexels photos (PHOTOS.md); the "340+ gardens since 2011" badge is
   hidden (an invented statistic reads as a claim); the service cards'
   prices ("From $850", "From $120 / visit") are hidden, so the only prices
   in the ad are ours; and the capture stops above the section with the
   invented testimonial. */

const CEDAR_PHOTOS = { 311: 'hero-garden-path.jpg', 312: 'design-formal-garden.jpg', 313: 'build-stone-patio.jpg', 314: 'maintenance-hedge.jpg' };

async function cedarPrep(context) {
  await context.route(/loremflickr\.com/, (route) => {
    const file = CEDAR_PHOTOS[new URL(route.request().url()).searchParams.get('lock')];
    if (!file) throw new Error(`Unmapped loremflickr image on landscaping.html: ${route.request().url()}`);
    return route.fulfill({ contentType: 'image/jpeg', body: readFileSync(join(PHOTOS, file)) });
  });
  await context.addInitScript(() => {
    const hide = () => {
      if (!document.head) return requestAnimationFrame(hide);
      const s = document.createElement('style');
      s.textContent = '.hero-img .leaf, .svc .from { display: none !important; }';
      document.head.appendChild(s);
    };
    hide();
  });
}

if (want('cedar')) {
  const url = `${ORIGIN}/landscaping.html`;
  {
    const { context, page } = await sitePage(url, 1440, 900, { prep: cedarPrep });
    const badges = await page.$$eval('.hero-img .leaf', (els) => els.map((e) => getComputedStyle(e).display));
    if (badges.length !== 1 || badges[0] !== 'none') throw new Error(`expected one hidden .hero-img .leaf badge, found ${JSON.stringify(badges)}`);
    const prices = await page.$$eval('.svc .from', (els) => els.map((e) => getComputedStyle(e).display));
    if (prices.length !== 3 || prices.some((d) => d !== 'none')) throw new Error(`expected three hidden .svc .from prices, found ${JSON.stringify(prices)}`);
    if (await page.evaluate(() => /\$\d/.test(document.body.innerText))) throw new Error('a price is still visible on landscaping.html');
    await context.close();
  }
  const info = await capturePage('cedar', url, 1440, [
    { id: 'header', sel: '.demo-bar', through: 'header' },
    { id: 'hero', sel: 'section.hero' },
    { id: 'services', sel: '#services' },
    { id: 'seasons', sel: '#seasons' },
    { id: 'process', sel: '#process' },
  ], 'section:has(blockquote)', { prep: cedarPrep });
  writeFileSync(join(OUT, 'cedar-sections.json'), JSON.stringify({ url: 'public/landscaping.html', scale: DPR, 1440: info }, null, 1));
  console.log(`✓ cedar-1440.jpg (cut at ${info.stopAt}px, above the testimonial), cedar-sections.json`);
}

/* Allergy Rescue Kit — allergyrescuekit.com, a real client's live site, used
   with the owner's approval. Hand-built and hosted on Railway, so it is
   never shown under a "built from your info" or a hosting claim. Out of
   every frame: the About section (the founder's photo, another company's
   name) and everything below it (the price block, the footer). On a phone
   the site slides a quote bar ("$85 per cabinet") up from the bottom; the
   recording is framed above it (the top 784px of the 844px window), so
   another business's price never sits in our ad. Nothing on the page is
   changed. */

if (want('ark')) {
  const url = 'https://allergyrescuekit.com';
  const info = await capturePage('ark', url, 1440, [
    { id: 'header', sel: 'header.site-header' },
    { id: 'hero', sel: '#top' },
    { id: 'stats', sel: '#stats' },
  ], 'section:has(img[alt*="founder" i])');
  writeFileSync(join(OUT, 'ark-sections.json'), JSON.stringify({ url, scale: DPR, 1440: info }, null, 1));
  console.log(`✓ ark-1440.jpg (cut at ${info.stopAt}px, above About), ark-sections.json`);
  await phoneScroll('ark-phone-scroll', url, '#your-state', { crop: { x: 0, y: 0, width: 390, height: 784 }, back: 784 });
}

/* Andy's Auto Shop — andysauto.org, a demo business on a real domain,
   generated and hosted by the platform. Now only in Ad_AllWeNeed. Its About
   section (another company's logo on a car), the address strip and the
   closing call band (a placeholder phone number) are left out: the capture
   stops above About. */

if (want('andys')) {
  const info = await capturePage('andys', 'https://andysauto.org', 1440, [
    { id: 'header', sel: 'body > div:first-of-type' },
    { id: 'hero', sel: 'section.hero' },
    { id: 'fix', sel: 'section[aria-labelledby="fix-title"]' },
    { id: 'band', sel: 'section.band' },
    { id: 'how', sel: 'section[aria-labelledby="how-title"]' },
  ], 'section[aria-labelledby="shop-title"]');
  writeFileSync(join(OUT, 'andys-sections.json'), JSON.stringify({ url: 'https://andysauto.org', scale: DPR, 1440: info }, null, 1));
  console.log('✓ andys-1440.jpg, andys-sections.json');
}

await browser.close();
server.close();
