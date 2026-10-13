/**
 * Screenshots the live client sites for the Work page.
 *
 *   node tools/client-shots.mjs
 *
 * These are the only pictures on the site of work we did for someone who
 * paid us, so they are taken from the live sites rather than from a local
 * build: what a visitor sees when they follow the link has to be what the
 * case study showed them.
 *
 * Output, into public/shots/:
 *   ark-desktop.webp     ark-phone.webp
 *   chemed-desktop.webp  chemed-phone.webp
 *
 * The ChemEd capture is the fiddly one, in two ways that both cost a run.
 *
 * `waitUntil: 'networkidle'` never resolves on it: MapLibre keeps streaming
 * tiles as long as the map is alive, so there is no idle moment to wait for.
 * Everything here loads to `domcontentloaded` and then waits on something
 * specific instead.
 *
 * And "the page loaded" is nowhere near "the map is drawn" — a naive
 * screenshot gets a grey rectangle. So the canvas is sampled until two
 * consecutive samples match AND it holds more than a handful of distinct
 * colours, which separates a drawn map from a placeholder. That wait is
 * capped hard: if the map has not settled by then the shot is saved anyway,
 * flagged in the output, and the run carries on rather than hanging.
 *
 * Usage: node tools/client-shots.mjs [slug]   (ark | chemed; default both)
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const OUT = 'public/shots';

const TARGETS = [
  {
    slug: 'ark',
    url: 'https://allergyrescuekit.com/',
    label: 'Allergy Rescue Kit',
  },
  {
    slug: 'chemed',
    url: 'https://chemed-interest-map-production.up.railway.app/',
    label: 'ChemEd 2027 Interest Map',
    map: true,
  },
  {
    // Built and hosted by our platform. Its image slots stay hidden until the
    // platform's loader marks each one ready (or missing), so a shot taken on
    // `load` alone catches a page with holes in it.
    slug: 'andysauto',
    url: 'https://andysauto.org/',
    label: "Andy's Auto Shop",
    platformImages: true,
  },
];

const VIEWPORTS = [
  { tag: 'desktop', width: 1440, height: 900 },
  { tag: 'phone', width: 390, height: 844 },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  // Software WebGL, for the MapLibre canvas.
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

/**
 * Waits for the map to stop changing and to look like a map.
 *
 * Sampled from Playwright's own screenshots, NOT by reading the canvas from
 * inside the page. That was the first attempt and it is a dead end: MapLibre
 * creates its WebGL context without `preserveDrawingBuffer`, so drawImage()
 * from that canvas yields a blank frame and every capture reports "1
 * distinct colour" — a perfectly drawn map looks identical to a grey box.
 * Playwright's compositor-level screenshot sees the real thing.
 *
 * Two consecutive near-identical frames, with enough colour variety to rule
 * out a placeholder, means drawn. Hard-capped; never blocks a run.
 */
async function waitForMapToSettle(page, { timeout = 60000 } = {}) {
  await page
    .waitForSelector('canvas.maplibregl-canvas, canvas', { timeout: Math.min(timeout, 20000) })
    .catch(() => {});

  // Fingerprint a downscaled frame: a coarse colour histogram plus the raw
  // bytes, so "changed" and "varied" can both be answered from one sample.
  const fingerprint = async () => {
    const png = await page.screenshot({ animations: 'disabled' });
    const { data, info } = await sharp(png)
      .resize(64, 40, { fit: 'fill' })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const colours = new Set();
    for (let i = 0; i + 2 < data.length; i += info.channels) {
      colours.add(`${data[i] >> 4},${data[i + 1] >> 4},${data[i + 2] >> 4}`);
    }
    return { key: Buffer.from(data).toString('base64'), variety: colours.size };
  };

  const started = Date.now();
  let last = null;
  while (Date.now() - started < timeout) {
    const now = await fingerprint();
    if (last && now.key === last.key) {
      // 12 is comfortably above a flat placeholder and well below a drawn
      // base map, which lands in the hundreds.
      return { ok: now.variety > 12, why: `${now.variety} colour buckets` };
    }
    last = now;
    await page.waitForTimeout(700);
  }
  return { ok: false, why: 'never settled' };
}

let failures = 0;
let warnings = 0;

const only = process.argv[2];
for (const target of TARGETS.filter((t) => !only || t.slug === only)) {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      // The phone shots should get the mobile layout, not a narrow desktop one.
      isMobile: vp.tag === 'phone',
      hasTouch: vp.tag === 'phone',
    });
    const page = await ctx.newPage();

    try {
      // domcontentloaded, not networkidle: see the note at the top.
      await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
      await page.evaluate(() => document.fonts.ready).catch(() => {});

      // Lazy images first, THEN decode, and never wait forever on either.
      // img.decode() on a lazily-loaded image that has not entered the
      // viewport does not reject — it simply never settles, so a bare
      // `.catch()` does not save you and the run hangs until it is killed.
      // That cost two runs before it was isolated.
      await page.evaluate(() => {
        for (const img of document.images) img.loading = 'eager';
      });
      await Promise.race([
        page.evaluate(() =>
          Promise.all([...document.images].map((i) => i.decode().catch(() => {})))
        ),
        new Promise((r) => setTimeout(r, 8000)),
      ]);

      if (target.platformImages) {
        await page
          .waitForFunction(
            () => !document.querySelector(
              '[data-placeholder-id]:not(.gywn-image-ready):not(.gywn-image-missing)'
            ),
            null,
            { timeout: 20000 }
          )
          .catch(() => console.log(`  ! ${target.slug}-${vp.tag}: image slots still pending — REVIEW BEFORE SHIPPING`));
      }

      let mapWarning = null;
      if (target.map) {
        const settled = await waitForMapToSettle(page, { timeout: 60000 });
        if (settled.ok) {
          console.log(`    ${target.slug}-${vp.tag}: map settled (${settled.why})`);
        } else {
          // Save what rendered rather than hanging or skipping, but make the
          // shot's status impossible to miss — an unreviewed grey rectangle
          // must never end up in a case study.
          mapWarning = settled.why;
          console.log(`  ! ${target.slug}-${vp.tag}: map did NOT settle (${settled.why}) — saving what rendered; REVIEW BEFORE SHIPPING`);
          warnings += 1;
        }
      }

      await page.waitForTimeout(600);

      const png = await page.screenshot({ animations: 'disabled' });
      const out = `${OUT}/${target.slug}-${vp.tag}.webp`;
      // Downscaled to roughly twice the largest size either shot is ever
      // displayed at. They were captured at 2x a 1440 viewport — 2880px
      // intrinsic for a slot that never exceeds 550px — which Lighthouse
      // scored as the largest-contentful-paint problem on /work.
      const maxW = vp.tag === 'desktop' ? 1200 : 300;
      await sharp(png).resize({ width: maxW }).webp({ quality: 82 }).toFile(out);
      const meta = await sharp(out).metadata();
      console.log(`  ${mapWarning ? '!' : '✓'} ${out}  ${meta.width}x${meta.height}`);
    } catch (err) {
      console.log(`  ✗ ${target.slug}-${vp.tag}: ${err.message.split('\n')[0]}`);
      failures += 1;
    }

    await ctx.close();
  }
}

await browser.close();
console.log();
if (warnings) {
  console.log(`${warnings} map capture(s) did not settle — look at them before they go on a page.`);
}
if (failures) {
  console.log(`${failures} capture(s) failed outright — do NOT ship a case study with a missing image.`);
  process.exit(1);
}
