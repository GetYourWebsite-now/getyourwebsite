/**
 * Captures the real Cedar & Stone concept site (public/landscaping.html) for
 * the phone in the launch video.   npm run capture
 *
 * What it does to the page, and nothing else:
 *   - Every loremflickr image is answered with one of the four Pexels photos
 *     in assets/photos (see PHOTOS.md for why and for the sources). The
 *     request never leaves the machine; an image this script doesn't know
 *     about fails the capture rather than slipping through.
 *   - Lazy images are made eager, because a full-page capture never scrolls.
 *   - The hero's "340+ gardens since 2011" badge (.leaf) is hidden: an
 *     invented statistic, even a fictional business's, reads in an ad as a
 *     number someone is claiming. It is absolutely positioned over the photo,
 *     so hiding it moves nothing else.
 *
 * The capture stops at the top of the section holding the testimonial. That
 * quote is part of a fictional site, and an ad must not show an invented
 * review, labelled or not.
 *
 * Output: assets/captures/landscaping-390.jpg — 390 CSS px wide at 2x, from
 * the top of the page to that cut. Committed, so a render needs no browser
 * and no network; re-run this when landscaping.html or the photos change.
 *
 * Uses the site's Playwright and sharp (../../node_modules): this folder has
 * its own package.json, but no reason to install a second browser.
 */
import { chromium } from '../../node_modules/playwright/index.mjs';
import sharp from '../../node_modules/sharp/lib/index.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const PAGE = new URL('../../public/landscaping.html', import.meta.url).href;
const OUT = here('./assets/captures/landscaping-390.jpg');

// loremflickr's ?lock= id for each slot on the page → our photo.
const PHOTOS = {
  311: 'hero-garden-path.jpg',
  312: 'design-formal-garden.jpg',
  313: 'build-stone-patio.jpg',
  314: 'maintenance-hedge.jpg',
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

const served = new Set();
await page.route('**/loremflickr.com/**', (route) => {
  const lock = new URL(route.request().url()).searchParams.get('lock');
  const file = PHOTOS[lock];
  if (!file) {
    console.error(`✗ unknown loremflickr image ${route.request().url()} — add it to PHOTOS or remove it`);
    process.exitCode = 1;
    return route.abort();
  }
  served.add(lock);
  return route.fulfill({ status: 200, contentType: 'image/jpeg', body: readFileSync(here(`./assets/photos/${file}`)) });
});

await page.goto(PAGE, { waitUntil: 'networkidle' });
const badge = await page.$$eval('.hero-img .leaf', (els) => els.length);
if (badge !== 1) throw new Error(`expected one .hero-img .leaf badge to hide, found ${badge}`);
await page.addStyleTag({ content: '.hero-img .leaf { display: none !important; }' });
await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; }));
await page.waitForLoadState('networkidle');
await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
});

const broken = await page.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src));
if (broken.length) throw new Error(`images failed to load: ${broken.join(', ')}`);

const cut = await page.evaluate(() => {
  const q = document.querySelector('blockquote');
  if (!q) throw new Error('no testimonial found — check where the capture should stop');
  return Math.floor(q.closest('section').getBoundingClientRect().top + scrollY);
});

const png = await page.screenshot({ fullPage: true, clip: { x: 0, y: 0, width: 390, height: cut } });
await browser.close();

await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(OUT);
const meta = await sharp(OUT).metadata();
console.log(`✓ ${OUT.replace(process.cwd() + '/', '')} — ${meta.width}×${meta.height}, cut at ${cut}px (above the testimonial), photos served: ${[...served].sort().join(', ')}`);
if (served.size !== Object.keys(PHOTOS).length) {
  console.error(`✗ expected all ${Object.keys(PHOTOS).length} photos to be used`);
  process.exitCode = 1;
}
