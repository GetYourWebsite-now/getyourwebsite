/**
 * Screenshots the REAL client portal, with seeded demo data, for the home page.
 *
 *   node tools/portal-shots.mjs
 *
 * The home page shows a picture of the product. That picture has to be of the
 * product, not of our own /demo lookalike and not of a mock-up — if the portal
 * changes and the marketing shot does not, the home page is lying about what a
 * client gets. `npm run verify:portal` already catches the sandbox drifting;
 * this is the other half of the same idea.
 *
 * How it runs without a backend
 * -----------------------------
 * The portal normally talks to the API on :3001, which needs Postgres and real
 * secrets. Instead this starts nothing but the portal's own Vite dev server and
 * fulfils every /api call from the fixture below, in the browser. So the
 * rendering is the portal's real components, CSS and layout code, and the only
 * fake thing is the data — which is the same fake Rosa's Bakery client the
 * /demo sandbox is seeded with.
 *
 * Nothing here reads an env file, a real client record, or a credential. The
 * auth token is the literal string 'demo'.
 *
 * Before running:
 *   cd ~/Developer/GetYourWebsiteAdmin/client && npm install && npm run dev
 *
 * Output: public/shots/portal-version-tree.webp (+ -390 for the narrow crop).
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const PORTAL = process.env.PORTAL ?? 'http://localhost:5174';
const OUT = 'public/shots';

// ── The seeded client ──────────────────────────────────────────────────────
// Rosa's Bakery, the same fiction the /demo sandbox uses. The version history
// is the one the marketing copy describes: a seasonal branch that was built
// once, hosted, switched away from, and is still there to switch back to.

const USER = {
  id: 1,
  email: 'rosa@rosasbakery.example',
  name: 'Rosa Marchetti',
  businessName: "Rosa's Bakery",
  role: 'client',
};

const iso = (d) => `2026-${d}T15:04:00.000Z`;

const VERSIONS = [
  {
    versionId: 1, versionNumber: 1, parentVersionId: null, name: 'First build',
    status: 'approved', viewable: true, pendingReview: false, canAddNotes: true,
    createdAt: iso('03-14'), summary: 'The first build from your free mock.',
  },
  {
    versionId: 2, versionNumber: 2, parentVersionId: 1, name: 'Warmer photos',
    status: 'approved', viewable: true, pendingReview: false, canAddNotes: true,
    createdAt: iso('04-02'), summary: 'Warmer shopfront photography and a bigger menu.',
  },
  {
    versionId: 3, versionNumber: 3, parentVersionId: 2, name: 'Online orders',
    status: 'approved', viewable: true, pendingReview: false, canAddNotes: true,
    createdAt: iso('06-21'), summary: 'Order-ahead form and pickup times.',
  },
  {
    versionId: 4, versionNumber: 4, parentVersionId: 3, name: 'Christmas',
    status: 'approved', viewable: true, pendingReview: false, canAddNotes: true,
    createdAt: iso('11-08'), summary: 'Seasonal theme. Press host in November, switch back in January.',
  },
  {
    versionId: 5, versionNumber: 5, parentVersionId: 3, name: 'Spring menu',
    status: 'approved', viewable: true, pendingReview: false, canAddNotes: true,
    createdAt: iso('11-26'), summary: 'New spring menu, branched from the everyday site.',
  },
];

// /client/sites answers with the site object itself, not wrapped, and
// RealSiteTab reads these exact keys — `viewStatus: 'ready'` is what puts it
// in the live state rather than the "Pay to get started" empty one.
const SITE = {
  id: 1,
  viewStatus: 'ready',
  workerConfigured: true,
  businessName: "Rosa's Bakery",
  activeDomain: 'rosasbakery.example',
  versionId: 3,
  versionNumber: 3,
  approvedAt: iso('06-21'),
  approvedVersionCount: VERSIONS.length,
  unappliedNoteCount: 0,
  pendingVersions: [],
  versions: VERSIONS.map((v) => ({
    versionId: v.versionId,
    versionNumber: v.versionNumber,
    name: v.name,
    approvedAt: v.createdAt,
  })),
};

// A few files in the library. Thumbnails are served from our own bakery
// screenshot by the image route below, so the tab renders with real pictures
// without reaching the network or touching a real client's uploads.
const ASSETS = [
  { id: 1, name: 'shopfront-morning.jpg', displayName: 'Shopfront morning', isPublic: true, createdAt: iso('03-11'), url: 'https://assets.invalid/1.jpg' },
  { id: 2, name: 'sourdough-loaves.jpg', displayName: 'Sourdough loaves', isPublic: true, createdAt: iso('03-11'), url: 'https://assets.invalid/2.jpg' },
  { id: 3, name: 'cinnamon-buns.jpg', displayName: 'Cinnamon buns', isPublic: true, createdAt: iso('04-02'), url: 'https://assets.invalid/3.jpg' },
  { id: 4, name: 'counter-display.jpg', displayName: 'Counter display', isPublic: false, createdAt: iso('06-18'), url: 'https://assets.invalid/4.jpg' },
];

// Every endpoint the dashboard and the version tree touch. Anything not listed
// answers with an empty object rather than a network error, so one unmocked
// call can never silently turn into a broken-looking screenshot.
const ROUTES = [
  [/\/api\/client\/auth\/me$/, { user: USER }],
  [/\/api\/client\/sites$/, SITE],
  [/\/api\/client\/sites\/versions\/tree$/, { versions: VERSIONS, currentVersionId: 3 }],
  [/\/api\/client\/sites\/versions$/, { versions: VERSIONS }],
  [/\/api\/client\/hosting$/, {
    hosting: { status: 'live', domain: 'rosasbakery.example', hostedVersionNumber: 3, ssl: 'active' },
  }],
  [/\/api\/client\/revision-notes/, { notes: [] }],
  [/\/api\/client\/assets$/, { assets: ASSETS }],
  [/\/api\/client\/mock-websites$/, { websites: [] }],
  // `remainingRevisions` matters: without it the Request changes button
  // renders as "Request changes (undefined left)".
  [/\/api\/client\/billing\/status$/, {
    plan: 'maintenance', status: 'active', paid: true, remainingRevisions: 1,
  }],
];

await mkdir(OUT, { recursive: true });

// Thumbnails for the asset library: four different crops of sites we built
// ourselves, so the library reads as four photos rather than one repeated.
const THUMB_SOURCES = ['bakery', 'restaurant', 'landscaping', 'dental'];
const THUMBS = await Promise.all(
  THUMB_SOURCES.map((name) =>
    sharp(`public/shots/${name}.webp`)
      .resize(480, 480, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 80 })
      .toBuffer()
  )
);

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

async function capture({ width, height, out, tab = 'version-tree', clip, expandMap = false }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,   // the shot is displayed at roughly half size
  });

  // Order matters, and not the way it reads: Playwright runs the
  // LAST-registered matching route first, and route.continue() goes to the
  // network rather than to the next handler. So the broad deny is registered
  // first (lowest priority) and the API fixture last (highest). Registered
  // the other way round, every /api call is continued straight through
  // Vite's proxy to a backend that isn't running, and the portal renders its
  // "Request failed" state — which is exactly what the first run produced.
  let unmocked = [];

  // Anything that is not the portal's own origin is refused outright, so the
  // capture cannot quietly depend on the network.
  await ctx.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith(PORTAL) || url.startsWith('data:') || url.startsWith('blob:')) {
      return route.continue();
    }
    // Asset thumbnails are answered from our own bakery mock screenshot, so
    // the library renders with real pictures while still reaching nothing and
    // using no client's actual uploads.
    if (route.request().resourceType() === 'image') {
      // assets.invalid/<n>.jpg → the nth crop, so each row is a distinct photo.
      const n = Number(url.match(/\/(\d+)\.jpg$/)?.[1] ?? 1);
      return route.fulfill({
        status: 200,
        contentType: 'image/jpeg',
        body: THUMBS[(n - 1) % THUMBS.length],
      });
    }
    return route.abort();
  });

  await ctx.route('**/api/**', async (route) => {
    const url = route.request().url();
    const hit = ROUTES.find(([re]) => re.test(url.split('?')[0]));
    if (!hit) unmocked.push(url.replace(/^https?:\/\/[^/]+/, ''));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(hit ? hit[1] : {}),
    });
  });

  const page = await ctx.newPage();

  // Sign in without an auth server: the portal reads these two keys on boot.
  await page.addInitScript(() => {
    localStorage.setItem('gywn_client_token', 'demo');
    localStorage.setItem(
      'gywn_client_user',
      JSON.stringify({ id: 1, email: 'rosa@rosasbakery.example', name: 'Rosa Marchetti', role: 'client' })
    );
  });

  await page.goto(`${PORTAL}/?tab=${tab}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);

  // The tree is wider than the inline stage, so at rest the map is panned to
  // the root and the fork — the one thing the picture exists to show — sits
  // off the right edge. The portal's own fullscreen control gives the map the
  // whole panel, which is how a client would look at it too.
  if (expandMap) {
    await page.click('.version-tree-stage__toolbar button');
    await page.waitForTimeout(900);
    // In fullscreen the selected-node panel is an overlay along the bottom,
    // and it covers the lower branch. Dismissing it leaves the lineage on its
    // own, which is the one thing this picture is for. The live tip keeps its
    // gold highlight either way — that comes from being hosted, not selected.
    const dismiss = page.locator('[aria-label="Dismiss details"]');
    if (await dismiss.count()) {
      await dismiss.first().click();
      await page.waitForTimeout(700);
    }
  }

  // Park the pointer somewhere harmless: a hovered node or + stub picks up a
  // hover state and the shot reads as mid-interaction.
  await page.mouse.move(2, 2);
  await page.waitForTimeout(400);

  if (unmocked.length) {
    console.log(`  ! unmocked API calls: ${[...new Set(unmocked)].join(', ')}`);
  }

  // Node geometry, so a crop can be measured off the real layout rather than
  // guessed from a screenshot. In CSS pixels; multiply by deviceScaleFactor.
  const nodes = await page.$$eval('.version-tree-node', (els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        label: (el.textContent || '').trim().split('\n')[0].slice(0, 24),
        x: r.left, y: r.top, w: r.width, h: r.height,
      };
    })
  );

  const png = await page.screenshot({ clip, animations: 'disabled' });
  await sharp(png).webp({ quality: 88 }).toFile(out);
  const meta = await sharp(png).metadata();
  console.log(`  ✓ ${out}  ${meta.width}x${meta.height}`);

  await ctx.close();
  return { nodes, scale: meta.width / width };
}

console.log('\nCapturing the client portal (seeded, no backend, no network)\n');
const wide = await capture({
  width: 1440, height: 660, out: `${OUT}/portal-version-tree.webp`, expandMap: true,
});

// The platform rows on the home page. One capture per capability we claim, so
// each claim is illustrated by the surface that actually delivers it.
await capture({ width: 1280, height: 900, out: `${OUT}/portal-my-website.webp`, tab: 'real-site' });
await capture({ width: 1280, height: 860, out: `${OUT}/portal-assets.webp`, tab: 'assets' });

// The narrow shot is a CROP of the same capture, not a second render. Scaled
// into a phone-width browser frame the full tree's labels come out about 5px
// tall; the fork on its own stays readable and is the part that carries the
// idea. Same pixels, same data, just the half that survives the size.
{
  const src = `${OUT}/portal-version-tree.webp`;
  const meta = await sharp(src).metadata();

  // The fork: the three rightmost nodes — the live tip and the two branches
  // off it. Taken from the measured layout, so it keeps working when the
  // seeded history or the portal's node sizes change.
  const byX = [...wide.nodes].sort((a, b) => b.x - a.x).slice(0, 3);
  if (byX.length < 3) throw new Error('expected at least 3 nodes to crop the fork');
  const PAD = 28;
  const box = {
    x0: Math.min(...byX.map((n) => n.x)) - PAD * 3,   // room for the inbound edge
    y0: Math.min(...byX.map((n) => n.y)) - PAD,
    x1: Math.max(...byX.map((n) => n.x + n.w)) + PAD * 2, // room for the + stubs
    y1: Math.max(...byX.map((n) => n.y + n.h)) + PAD,
  };
  const S = wide.scale;
  const crop = {
    left: Math.max(0, Math.round(box.x0 * S)),
    top: Math.max(0, Math.round(box.y0 * S)),
    width: Math.round((box.x1 - box.x0) * S),
    height: Math.round((box.y1 - box.y0) * S),
  };
  crop.width = Math.min(crop.width, meta.width - crop.left);
  crop.height = Math.min(crop.height, meta.height - crop.top);
  await sharp(src).extract(crop).webp({ quality: 90 }).toFile(`${OUT}/portal-version-tree-narrow.webp`);
  console.log(
    `  ✓ ${OUT}/portal-version-tree-narrow.webp  ${crop.width}x${crop.height} ` +
    `(crop around ${byX.map((n) => n.label).reverse().join(' → ')})`
  );
}

await browser.close();
console.log();
