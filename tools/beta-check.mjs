/**
 * Proves the beta switch (BETA in src/data/site.js) does what it says and
 * nothing else.
 *
 *   node tools/beta-check.mjs        (npm run verify:beta)
 *
 * Builds the site twice — GYW_BETA=off, then GYW_BETA=on — and checks:
 *
 *   on    every primary call to action and every pricing-card button goes
 *         to /beta; "free mock" appears nowhere a visitor can read except
 *         the legal pages (which describe the portal's free preview, still a
 *         real thing); /free-mock and its thank-you are redirects to /beta;
 *         /beta is noindex, posts source=beta and lands on /beta/thanks;
 *         neither landing page is in the sitemap.
 *
 *   off   no page a visitor reaches mentions the beta or links to /beta;
 *         /free-mock is the real page again and /beta redirects to it.
 *
 *   diff  the two builds are compared page by page, tag by tag. Every
 *         difference has to involve the switch — beta wording, the free-mock
 *         wording it replaces, the beta prices, or one of the few switch
 *         points declared below. Anything else fails, because it means the
 *         switch is changing something it shouldn't. Non-HTML files must be
 *         byte-identical.
 *
 * Builds into dist/ and leaves dist/ as the default build (whatever BETA.on
 * says) when it finishes. Needs no dev server.
 */
import { execSync } from 'node:child_process';
import { cpSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  BETA,
  STARTUP_TIERS,
  money,
  betaPrice,
  perRevision,
} from '../src/data/site.js';

const WORK = 'node_modules/.cache/beta-check';
const defaultOn = BETA.on;

let failures = 0;
const pass = (m) => console.log(`  ✓ ${m}`);
const fail = (m) => { console.log(`  ✗ ${m}`); failures += 1; };

function build(mode) {
  execSync('npx astro build', {
    stdio: 'ignore',
    env: { ...process.env, GYW_BETA: mode },
  });
  const out = join(WORK, mode);
  rmSync(out, { recursive: true, force: true });
  cpSync('dist', out, { recursive: true });
  return out;
}

function files(dir) {
  const out = [];
  (function walk(d) {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else out.push(relative(dir, p));
    }
  })(dir);
  return out.sort();
}

/** The page path a dist file serves, e.g. "beta/thanks/index.html" → "/beta/thanks". */
const pathOf = (f) => '/' + f.replace(/index\.html$/, '').replace(/\/$/, '');

/** Visible-ish text: tags, scripts and styles removed, whitespace collapsed. */
function textOf(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
}

const isRedirect = (html, to) =>
  new RegExp(`<meta http-equiv="refresh" content="\\d+;url=${to.replace(/\//g, '\\/')}/?"`).test(html);

console.log('\nBuilding with beta off, then on…');
const OFF = build('off');
const ON = build('on');
if (!defaultOn) execSync('npx astro build', { stdio: 'ignore' });

const read = (dir, f) => readFileSync(join(dir, f), 'utf8');
const htmlFiles = (dir) => files(dir).filter((f) => f.endsWith('.html'));

// ── Beta on ──────────────────────────────────────────────────────────────
console.log('\nBeta on');

const LEGAL = ['/privacy', '/terms'];
const REDIRECTS_ON = ['/free-mock', '/free-mock/thanks'];

{
  const wrong = [];
  for (const f of htmlFiles(ON)) {
    const html = read(ON, f);
    // Primary buttons that go somewhere on this site. Two are not calls to
    // action and are allowed: the 404's "Back to the home page", and
    // outbound tool links (the PageSpeed test on /how-it-works).
    for (const m of html.matchAll(/<a[^>]*class="[^"]*btn--primary[^"]*"[^>]*href="([^"]+)"|<a[^>]*href="([^"]+)"[^>]*class="[^"]*btn--primary[^"]*"/g)) {
      const href = m[1] ?? m[2];
      if (f === '404.html' || /^https?:/.test(href)) continue;
      if (!/^\/beta\/?$/.test(href)) wrong.push(`${pathOf(f)} → ${href}`);
    }
    for (const m of html.matchAll(/<a[^>]*class="[^"]*tier__cta[^"]*"[^>]*href="([^"]+)"|<a[^>]*href="([^"]+)"[^>]*class="[^"]*tier__cta[^"]*"/g)) {
      const href = m[1] ?? m[2];
      if (!/^\/beta\/?$/.test(href)) wrong.push(`${pathOf(f)} tier → ${href}`);
    }
  }
  wrong.length
    ? fail(`calls to action not pointing at /beta: ${wrong.slice(0, 5).join('; ')}`)
    : pass('every primary call to action and pricing-card button goes to /beta');
}

{
  const hits = files(ON).filter((f) => {
    const p = pathOf(f);
    if (REDIRECTS_ON.some((r) => p === r || p === r + '/')) return false;
    if (LEGAL.includes(p)) return false;
    return /free mock/i.test(read(ON, f));
  });
  hits.length
    ? fail(`"free mock" readable on: ${hits.join(', ')}`)
    : pass('"free mock" appears nowhere a visitor can read (legal pages and the redirects aside)');
}

{
  const a = read(ON, 'free-mock/index.html');
  const b = read(ON, 'free-mock/thanks/index.html');
  isRedirect(a, '/beta') && isRedirect(b, '/beta/thanks')
    ? pass('/free-mock → /beta and /free-mock/thanks → /beta/thanks')
    : fail('/free-mock pages are not redirects to the beta pages');
}

{
  const html = read(ON, 'beta/index.html');
  const ok =
    /<meta name="robots" content="noindex"/.test(html) &&
    /name="source" value="beta"/.test(html) &&
    /name="_next" value="[^"]*\/beta\/thanks\/?"/.test(html) &&
    html.includes(BETA.cta);
  ok ? pass('/beta is noindex, posts source=beta, and lands on /beta/thanks')
     : fail('/beta is missing noindex, source=beta or the /beta/thanks redirect');
}

{
  const sm = read(ON, 'sitemap.xml');
  /\/beta<|\/beta\/|\/free-mock/.test(sm.replace(/beta-terms/g, ''))
    ? fail('a landing page is listed in sitemap.xml')
    : pass('neither landing page is in the sitemap');
}

// ── Beta off ─────────────────────────────────────────────────────────────
console.log('\nBeta off');

// Pages that may still say "beta" with the switch off: the beta terms
// themselves (a business that joined during the beta is still covered), and
// the two legal pages that point at them.
const BETA_ALLOWED_OFF = ['/beta-terms', '/privacy', '/terms'];
const REDIRECTS_OFF = ['/beta', '/beta/thanks'];

{
  const hits = [];
  for (const f of htmlFiles(OFF)) {
    const p = pathOf(f);
    if (BETA_ALLOWED_OFF.includes(p) || REDIRECTS_OFF.includes(p)) continue;
    const html = read(OFF, f);
    if (/\bbeta\b/i.test(textOf(html))) hits.push(`${p} (text)`);
    if (/href="\/beta(\/thanks)?\/?"/.test(html)) hits.push(`${p} (link)`);
  }
  hits.length
    ? fail(`beta still visible with the switch off: ${hits.join(', ')}`)
    : pass('no page mentions or links to the beta');
}

{
  const fm = read(OFF, 'free-mock/index.html');
  const beta = read(OFF, 'beta/index.html');
  const thanks = read(OFF, 'beta/thanks/index.html');
  /name="source" value="free-mock"/.test(fm) && isRedirect(beta, '/free-mock') && isRedirect(thanks, '/free-mock/thanks')
    ? pass('/free-mock is the real page again; /beta and /beta/thanks redirect to it')
    : fail('/free-mock is not restored, or /beta does not redirect to it');
}

// ── The switch changes nothing else ─────────────────────────────────────
console.log('\nOn vs off');

// A difference is allowed if either side of it contains one of these.
const startupMarks = STARTUP_TIERS.flatMap((t) => {
  const b = betaPrice(t.price);
  return [money(b), money(perRevision(b, t.revisions)), money(t.price), money(perRevision(t.price, t.revisions))];
});
const MARKERS = [
  /beta/i,
  /free[ -]mock/i,
  /tier__was/,
  // Declared switch points whose wording names neither the beta nor the
  // mock: the home page's three-steps heading and its first two steps.
  /Three steps/,
  /Pick a plan|Approve and start/,
  /homepage concept|A few details through the form/,
  /Like it\?|Buy your Startup plan/,
  /Start with a free mock|Get a free mock/,
  // The MergeAnim price: "Startup from $420 in the beta" vs "Startup from $600".
  ...startupMarks.map((m) => new RegExp(m.replace(/[$.]/g, '\\$&') + '\\b')),
];

/** Myers diff over two token arrays; returns hunks of [aTokens, bTokens]. */
function diff(a, b) {
  const n = a.length, m = b.length, max = n + m;
  const v = new Map([[1, 0]]);
  const trace = [];
  outer: for (let d = 0; d <= max; d++) {
    trace.push(new Map(v));
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && (v.get(k - 1) ?? -1) < (v.get(k + 1) ?? -1))
        ? v.get(k + 1) ?? 0
        : (v.get(k - 1) ?? 0) + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) { x++; y++; }
      v.set(k, x);
      if (x >= n && y >= m) break outer;
    }
  }
  // Walk back to recover which tokens were removed and added.
  const removed = new Set(), added = new Set();
  let x = n, y = m;
  for (let d = trace.length - 1; d > 0; d--) {
    const vd = trace[d];
    const k = x - y;
    const prevK = k === -d || (k !== d && (vd.get(k - 1) ?? -1) < (vd.get(k + 1) ?? -1)) ? k + 1 : k - 1;
    const prevX = vd.get(prevK) ?? 0;
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) { x--; y--; }
    if (x === prevX) added.add(prevY); else removed.add(prevX);
    x = prevX; y = prevY;
  }
  // Group into hunks of contiguous changes.
  const hunks = [];
  let i = 0, j = 0, cur = null;
  while (i < n || j < m) {
    if (removed.has(i) || added.has(j)) {
      cur ??= { a: [], b: [] };
      if (removed.has(i)) cur.a.push(a[i++]);
      else cur.b.push(b[j++]);
    } else {
      if (cur) { hunks.push(cur); cur = null; }
      i++; j++;
    }
  }
  if (cur) hunks.push(cur);
  return hunks;
}

const tokens = (html) => html.split(/(?=<)|(?<=>)/).filter((t) => t.trim() !== '');

{
  const offFiles = files(OFF), onFiles = files(ON);
  const same = offFiles.length === onFiles.length && offFiles.every((f, i) => f === onFiles[i]);
  same ? pass(`both builds emit the same ${onFiles.length} files`)
       : fail('the two builds emit different file lists');

  const undeclared = [];
  let changedPages = 0;
  for (const f of onFiles) {
    if (!offFiles.includes(f)) continue;
    const a = readFileSync(join(OFF, f)), b = readFileSync(join(ON, f));
    if (a.equals(b)) continue;
    if (!f.endsWith('.html')) { undeclared.push(`${f} (non-HTML file differs)`); continue; }
    changedPages++;
    // A landing page that is a page one way and a redirect the other is the
    // switch itself, checked by the redirect assertions above — a tag diff
    // of a page against a meta refresh says nothing.
    if ([a, b].some((x) => x.toString().includes('http-equiv="refresh"'))) continue;
    for (const h of diff(tokens(a.toString()), tokens(b.toString()))) {
      const both = h.a.join('') + '\u0000' + h.b.join('');
      if (!MARKERS.some((re) => re.test(both))) {
        undeclared.push(`${pathOf(f)}: "${h.a.join('').slice(0, 70)}" → "${h.b.join('').slice(0, 70)}"`);
      }
    }
  }
  undeclared.length
    ? fail(`differences that are not the beta switch:\n      ${undeclared.slice(0, 8).join('\n      ')}`)
    : pass(`every difference across ${changedPages} changed pages is a declared switch point`);
}

rmSync(WORK, { recursive: true, force: true });
console.log();
if (failures) {
  console.log(`✗ ${failures} beta check${failures === 1 ? '' : 's'} failed.\n`);
  process.exit(1);
}
console.log('✓ the beta switch does what it says and nothing else\n');
