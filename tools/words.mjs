/**
 * Fails when a page carries more words than its budget.
 *
 *   node tools/words.mjs        (npm run verify:words)
 *
 * The feedback that started Phase 7 was "too much text". Cutting it once is
 * easy; keeping it cut is the hard part, because every fix adds a clarifying
 * sentence and nobody notices the page growing back. So the count is a gate.
 *
 * What counts: every whitespace-separated token in the rendered innerText of
 * <main>, at 1440px. That is what a visitor can actually see — nav and footer
 * excluded, closed <details> (the pricing FAQ) and screen-reader-only text
 * excluded, labels drawn inside SVGs included. Measured this way, with the
 * sr-only text in, the home page read 1,064 before Phase 7 against the 1,065
 * the brief counted by hand — so this is the same ruler, minus the words no
 * sighted visitor reads.
 *
 * Budgets: the Phase 7 targets for the three pages that were cut, and the
 * pre-Phase-7 counts for pricing and work, which were already fine and only
 * need to not grow. Home went from 550 to 570 in STEP 9, for the beta line
 * under the hero buttons.
 *
 * Needs a dev server on :4321.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:4321';

const BUDGET = {
  '/': 570,
  '/how-it-works': 550,
  '/why-us': 600,
  '/pricing': 774,
  '/work': 548,
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

let failures = 0;
console.log('\nVisible words in <main>\n');

for (const [path, max] of Object.entries(BUDGET)) {
  await page.goto(BASE + path, { waitUntil: 'load' });
  // .sr-only is clipped, not hidden, so innerText would still count it.
  await page.addStyleTag({ content: '.sr-only { display: none !important; }' });
  const count = await page.evaluate(
    () => (document.querySelector('main').innerText.match(/\S+/g) || []).length
  );
  const ok = count <= max;
  if (!ok) failures++;
  console.log(`  ${ok ? '✓' : '✗'} ${path.padEnd(14)} ${String(count).padStart(5)} / ${max}`);
}

await browser.close();

if (failures) {
  console.log(`\n✗ ${failures} page${failures === 1 ? '' : 's'} over budget. Cut words, or move facts into a visual's labels or onto /how-it-works.\n`);
  process.exit(1);
}
console.log('\n✓ every page within its word budget\n');
