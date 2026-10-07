/**
 * Screenshot harness for reviewing the site like a designer.
 *
 *   node tools/shots.mjs <outDir> <spec> [<spec> ...]
 *
 * A spec is `name=path`:
 *
 *   node tools/shots.mjs .shots "home=/" "pricing=/pricing"
 *
 * Every page is shot full-length at 1440 and at 390.
 *
 * Needs a dev server on :4321 and a browser: `npx playwright install chromium`.
 *
 * Three things it does that a plain page.screenshot() does not, each of which
 * has produced a misleading picture at some point:
 *
 *   1. Reveals everything. A full-page capture never scrolls, so the
 *      IntersectionObserver behind [data-reveal] never fires and half the
 *      page shoots at opacity 0.
 *   2. Eager-loads lazy images, for the same reason.
 *   3. WAITS FOR DECODE. This is the subtle one: a large WebP can be
 *      `complete` with a real naturalWidth and still not be rasterised when
 *      the capture happens, so it comes out as an empty box. That looked
 *      exactly like a broken image path, and cost an afternoon. img.decode()
 *      on everything before shooting is the fix.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [outDir, ...specs] = process.argv.slice(2);
if (!outDir || !specs.length) {
  console.error('usage: node tools/shots.mjs <outDir> name=path ...');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const BASE = process.env.BASE ?? 'http://localhost:4321';
const VIEWPORTS = [
  { tag: '1440', width: 1440, height: 900 },
  { tag: '390', width: 390, height: 844 },
];

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
  });
  const page = await ctx.newPage();

  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));

  for (const spec of specs) {
    const [name, path] = spec.split('=');

    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });

    await page.evaluate(() => {
      document.querySelector('astro-dev-toolbar')?.remove();
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
      document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
        img.loading = 'eager';
      });
    });

    await page.evaluate(() => document.fonts.ready);
    // See the note at the top: complete !== painted.
    await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
    await page.waitForTimeout(500);

    const file = `${outDir}/${name}-${vp.tag}.png`;
    // Chrome occasionally refuses a tall capture on the first attempt under
    // software rendering; it succeeds on a retry.
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try {
        await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
        ok = true;
      } catch (err) {
        if (attempt === 3) console.log(`✗ ${file} — ${err.message.split('\n')[0]}`);
        else await page.waitForTimeout(900);
      }
    }
    if (ok) console.log(`✓ ${file}`);
  }

  if (errors.length) {
    console.log(`\n⚠ console errors (${vp.tag}):`);
    [...new Set(errors)].forEach((e) => console.log('   ' + e));
  }

  await ctx.close();
}

await browser.close();
