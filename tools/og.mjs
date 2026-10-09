/**
 * Generates the social preview card at public/og.png.
 *
 *   npm run shots:og
 *
 * This is the image Facebook, iMessage, LinkedIn and Slack show for every
 * link to the site, and it is the one surface nobody ever looks at again
 * after it ships — the old one was still the dark space design five phases
 * after that design was deleted. So it is generated, not drawn by hand, and
 * the tree in it is built from src/data/version-tree.js, the same geometry
 * the hero renders. It cannot drift from the site without the build
 * drifting too.
 *
 * Needs nothing running: it loads a local HTML file with the fonts read off
 * disk as data URIs, so there is no server and no network.
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { WIDE } from '../src/data/version-tree.js';

const OUT = 'public/og.png';
const W = 1200;
const H = 630;

// The palette, from global.css. Literals because this file is rendered
// outside the site and has no stylesheet to inherit from.
const C = {
  bg: '#ffffff',
  bgAlt: '#f6f7f9',
  ink: '#0a0a0c',
  inkSoft: '#4a4f58',
  inkMuted: '#6b7079',
  line: '#e6e7eb',
  accent: '#2f3dd6',
  gold: '#f5c24b',
};

const fontDataUri = async (file) => {
  const buf = await readFile(`public/fonts/${file}`);
  return `data:font/woff2;base64,${buf.toString('base64')}`;
};

const inter = await fontDataUri('Inter-Variable.woff2');
const mono = await fontDataUri('JetBrainsMono-Variable.woff2');

/** The tree, drawn from the same constants the hero uses. */
const tree = () => {
  const edges = WIDE.edges
    .map((d) => `<path d="${d}" fill="none" stroke="${C.inkMuted}" stroke-width="1.5" stroke-linecap="round"/>`)
    .join('');

  const nodes = WIDE.nodes
    .map((n) => {
      const w = n.w ?? WIDE.w;
      const live = n.live
        ? `<rect x="${n.x + w - 58}" y="${n.y + WIDE.h - 31}" width="46" height="19" rx="5" fill="${C.accent}"/>` +
          `<text x="${n.x + w - 35}" y="${n.y + WIDE.h - 17}" font-size="11" font-weight="600" fill="#fff" text-anchor="middle">Live</text>`
        : '';
      return (
        `<rect x="${n.x}" y="${n.y}" width="${w}" height="${WIDE.h}" rx="9" fill="${C.bg}" stroke="${C.line}"/>` +
        `<text x="${n.x + 13}" y="${n.y + 26}" font-size="15" font-weight="600" fill="${C.ink}">${n.label}</text>` +
        `<text x="${n.x + 13}" y="${n.y + 47}" font-size="12" fill="${C.inkMuted}">Approved</text>` +
        live
      );
    })
    .join('');

  return `<svg viewBox="0 0 636 244" xmlns="http://www.w3.org/2000/svg" class="tree">${edges}${nodes}</svg>`;
};

const html = `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face { font-family: 'Inter'; src: url('${inter}') format('woff2'); font-weight: 100 900; }
  @font-face { font-family: 'JetBrains Mono'; src: url('${mono}') format('woff2'); font-weight: 100 800; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${W}px; height: ${H}px;
    display: grid; grid-template-rows: auto 1fr;
    padding: 56px 64px;
    background: ${C.bg};
    font-family: 'Inter', system-ui, sans-serif;
    font-optical-sizing: auto;
    -webkit-font-smoothing: antialiased;
  }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand svg { width: 34px; height: 34px; overflow: visible; }
  .brand span { font-size: 24px; font-weight: 600; letter-spacing: -0.03em; color: ${C.ink}; }

  .row { display: grid; grid-template-columns: 1fr 1.02fr; gap: 56px; align-items: center; }

  h1 {
    font-size: 54px; line-height: 1.1; font-weight: 600;
    letter-spacing: -0.03em; color: ${C.ink}; text-wrap: balance;
  }
  .sub {
    margin-top: 22px; font-size: 21px; line-height: 1.45; color: ${C.inkSoft};
  }

  /* The tree sits in the same light browser frame the hero uses. */
  .frame {
    border: 1px solid ${C.line}; border-radius: 10px; overflow: hidden;
    background: ${C.bg};
    box-shadow: 0 1px 2px rgba(10,10,12,.06), 0 12px 32px rgba(10,10,12,.08);
  }
  .bar {
    display: flex; align-items: center; gap: 6px;
    padding: 9px 12px; background: ${C.bgAlt}; border-bottom: 1px solid ${C.line};
  }
  .bar i { width: 9px; height: 9px; border-radius: 50%; background: #d2d5db; }
  .url {
    flex: 1; margin-left: 8px; padding: 3px 10px; border-radius: 6px;
    background: ${C.bg}; border: 1px solid ${C.line};
    font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${C.inkMuted};
  }
  .well { background: ${C.bgAlt}; padding: 16px 12px; }
  .tree { display: block; width: 100%; height: auto; }
</style>

<div class="brand">
  <svg viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="7" fill="${C.gold}"/>
    <circle cx="12.5" cy="13" r="6" fill="${C.ink}" opacity="0.22"/>
    <ellipse cx="16" cy="16" rx="14.2" ry="5.4" stroke="${C.ink}" stroke-width="1.6" transform="rotate(-28 16 16)"/>
  </svg>
  <span>GetYourWebsite</span>
</div>

<div class="row">
  <div>
    <h1>Your business online&nbsp;— built, hosted, and kept current for you.</h1>
    <p class="sub">Websites for local businesses. The first mock is free.</p>
  </div>

  <div class="frame">
    <div class="bar"><i></i><i></i><i></i><div class="url">portal.getyourwebsite.now</div></div>
    <div class="well">${tree()}</div>
  </div>
</div>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);

// Guard against the one failure nobody notices: a headline that clips.
const overflow = await page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll('h1, .sub, .brand span, .tree')) {
    const r = el.getBoundingClientRect();
    if (r.bottom > window.innerHeight + 1 || r.right > window.innerWidth + 1) {
      out.push(`${el.tagName.toLowerCase()}.${el.className} overflows`);
    }
    // 1px of tolerance is not enough: a balanced headline's line boxes
    // round such that scrollHeight sits a couple of pixels over
    // clientHeight with nothing actually cut off. 4px is still far below a
    // lost line of 54px type, which is the failure worth catching.
    if (el.scrollHeight > el.clientHeight + 4) {
      out.push(`${el.tagName.toLowerCase()} is clipped (${el.scrollHeight} > ${el.clientHeight})`);
    }
  }
  return out;
});

const png = await page.screenshot();
await browser.close();

await sharp(png).resize(W, H).png({ compressionLevel: 9 }).toFile(OUT);
const meta = await sharp(OUT).metadata();
const { size } = await sharp(OUT).stats().then(() => import('node:fs')).then((fs) => fs.statSync(OUT));

console.log(`\n✓ ${OUT} — ${meta.width}x${meta.height}, ${Math.round(size / 1024)} KB`);
if (overflow.length) {
  console.log('\n✗ content overflows or clips:');
  overflow.forEach((o) => console.log('   ' + o));
  process.exit(1);
}
console.log('  nothing clipped\n');
