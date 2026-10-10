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
 * Output: public/shots/portal-my-website.webp and portal-assets.webp.
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
const ASSET_DATES = ['03-11', '04-02', '06-18'];
const ASSET_PUBLIC = [true, true, false];

// Thumbnails for the asset library: three photographic regions of our own
// Rosa's Bakery concept site, named for what they actually show.
//
// Two earlier attempts were worse in instructive ways. Four crops of four
// DIFFERENT concept sites put a dentist and a restaurant in a bakery's photo
// library under labels like "Sourdough loaves". Four quadrants of the bakery
// page fixed the subject but two of the quadrants were page headlines and
// buttons, so a "photo library" was showing screenshots of a web page. Only
// these regions are actual photographs.
const THUMB_SOURCES = [
  { label: 'Baker at the bench', region: { left: 540, top: 150, width: 300, height: 190 } },
  { label: 'Early shift', region: { left: 700, top: 165, width: 240, height: 180 } },
  { label: 'Morning dough', region: { left: 640, top: 378, width: 300, height: 150 } },
];

const ASSETS_FIXTURE = [
  ...THUMB_SOURCES.map((t, i) => ({
    id: i + 1,
    name: t.label.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.jpg',
    displayName: t.label,
    isPublic: ASSET_PUBLIC[i],
    createdAt: iso(ASSET_DATES[i]),
    url: `https://assets.invalid/${i + 1}.jpg`,
  }))
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
  [/\/api\/client\/assets$/, { assets: ASSETS_FIXTURE }],
  [/\/api\/client\/mock-websites$/, { websites: [] }],
  // `remainingRevisions` matters: without it the Request changes button
  // renders as "Request changes (undefined left)".
  // Approved versions that ship theme.js get the Theme colors panel on My
  // website (ThemeColorsPanel.jsx). Rosa's palette is the sample bakery
  // page's, the same seven values the /demo sandbox starts from.
  [/\/api\/client\/sites\/versions\/[^/]+\/theme$/, {
    available: true,
    colors: {
      background: '#FBF5EC', surface: '#FFFFFF', text: '#3A2A20', muted: '#8A7565',
      primary: '#C0633A', accent: '#D99A52', border: '#E7DCCB',
    },
  }],
  [/\/api\/client\/billing\/status$/, {
    plan: 'maintenance', status: 'active', paid: true, remainingRevisions: 1,
  }],
];

await mkdir(OUT, { recursive: true });

const THUMBS = await Promise.all(
  THUMB_SOURCES.map(({ region }) =>
    sharp('public/shots/bakery.webp')
      .extract(region)
      .resize(480, 480, { fit: 'cover' })
      .jpeg({ quality: 82 })
      .toBuffer()
  )
);




const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

/**
 * `cropTo` narrows the capture to the surface that actually demonstrates the
 * claim next to it, measured from the live layout rather than from guessed
 * pixel offsets. A full-tab screenshot shrunk into a column on the home page
 * reads as "a dark admin thing"; the panel on its own reads as the feature.
 *
 * Since the light re-skin these are light, on the same tokens as this site.
 */
async function capture({
  width, height, out, tab = 'explore', clip, cropTo,
}) {
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
  // Park the pointer somewhere harmless: a hovered node or + stub picks up a
  // hover state and the shot reads as mid-interaction.
  await page.mouse.move(2, 2);
  await page.waitForTimeout(400);

  if (unmocked.length) {
    console.log(`  ! unmocked API calls: ${[...new Set(unmocked)].join(', ')}`);
  }

  if (cropTo) {
    const all = cropTo.hasText
      ? page.locator(cropTo.selector, { hasText: cropTo.hasText })
      : page.locator(cropTo.selector);
    const n = await all.count();
    if (!n) throw new Error(`cropTo matched nothing: ${JSON.stringify(cropTo)}`);

    await all.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    // `union: true` takes the bounding box of every match rather than the
    // first one's container. A grid element is as wide as its column track
    // whatever is in it, so cropping to the container left the asset library
    // with 40% dead black space to the right of its three thumbnails.
    let box;
    if (cropTo.union) {
      const boxes = [];
      for (let i = 0; i < n; i++) boxes.push(await all.nth(i).boundingBox());
      const live = boxes.filter(Boolean);
      box = {
        x: Math.min(...live.map((b) => b.x)),
        y: Math.min(...live.map((b) => b.y)),
        width: Math.max(...live.map((b) => b.x + b.width)) - Math.min(...live.map((b) => b.x)),
        height: Math.max(...live.map((b) => b.y + b.height)) - Math.min(...live.map((b) => b.y)),
      };
    } else {
      box = await all.first().boundingBox();
    }
    const pad = cropTo.pad ?? 16;
    clip = {
      x: Math.max(0, box.x - pad),
      y: Math.max(0, box.y - pad),
      width: Math.min(width - Math.max(0, box.x - pad), box.width + pad * 2),
      height: Math.min(height - Math.max(0, box.y - pad), box.height + pad * 2),
    };
  }

  const png = await page.screenshot({ clip, animations: 'disabled' });
  // Same reasoning as tools/client-shots.mjs: twice the widest slot these
  // are shown in, not whatever the 2x capture happened to produce.
  await sharp(png).resize({ width: 1300, withoutEnlargement: true }).webp({ quality: 88 }).toFile(out);
  const meta = await sharp(out).metadata();
  console.log(`  ✓ ${out}  ${meta.width}x${meta.height}`);

  await ctx.close();
}

console.log('\nCapturing the client portal (seeded, no backend, no network)\n');
// The hero's version tree is DRAWN now (src/components/VersionTree.astro),
// not screenshotted: the portal's node labels came out at about 5px once a
// 2880px capture was scaled into a 600px column. The two
// captures that fed it, and the fullscreen-map and fork-crop machinery that
// existed only for them, went with it. Everything below is still a real
// screenshot of a real surface.

// Cropped to the panel each claim is about: the list of approved versions
// with their per-version actions, and the photo library itself.
await capture({
  width: 1280, height: 1000, out: `${OUT}/portal-my-website.webp`, tab: 'real-site',
  cropTo: { selector: '.dash-resource-panel', hasText: 'Approved versions' },
});
await capture({
  width: 1280, height: 1000, out: `${OUT}/portal-assets.webp`, tab: 'assets',
  cropTo: { selector: '.assets-grid > *', union: true, pad: 20 },
});

await browser.close();
console.log();
