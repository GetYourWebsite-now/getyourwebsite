/**
 * Renders the launch video.
 *
 *   npm run stills   contact sheets: one frame per beat, late in the beat so
 *                    each shows its finished state — out/contact-sheet.png
 *                    (the 16:9 film, the one the brief asks for) plus
 *                    out/contact-sheet-9x16.png and out/contact-sheet-ads.png
 *   npm run render   stills, then all five MP4s and the film's .srt
 *
 * Look at the contact sheets before rendering video: a wrong frame is a code
 * fix, and finding it in a still is cheaper than in a 52s render.
 *
 * Every MP4 is H.264, yuv420p, limited range (color_range tv, BT.709), and
 * must come in at 20 MB or less. If one
 * doesn't, it is re-rendered at a lower quality (CRF +3, twice at most) and
 * the run fails if it still doesn't fit.
 */
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import sharp from '../../node_modules/sharp/lib/index.js';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CUTS, FPS, assertReadingTime, compositionId, frames } from './src/script.ts';

const mode = process.argv[2] ?? 'stills';
const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const OUT = here('./out/');
const MAX_BYTES = 20 * 1024 * 1024;
mkdirSync(OUT, { recursive: true });

assertReadingTime();

console.log('Bundling…');
const serveUrl = await bundle({ entryPoint: here('./src/index.ts') });

/** Frame numbers late in each beat (0.25s before it ends). */
function beatFrames(beats) {
  let start = 0;
  return beats.map((b) => {
    const at = start + frames(b.seconds) - Math.round(0.25 * FPS);
    start += frames(b.seconds);
    return { at, scene: b.scene };
  });
}

async function stillsFor(id) {
  const composition = await selectComposition({ serveUrl, id: compositionId(id) });
  const shots = [];
  for (const { at, scene } of beatFrames(CUTS[id])) {
    const file = `${OUT}.stills/${id}-${String(at).padStart(4, '0')}.png`;
    mkdirSync(`${OUT}.stills`, { recursive: true });
    await renderStill({ composition, serveUrl, output: file, frame: at });
    shots.push({ file, label: `${(at / FPS).toFixed(1)}s ${scene}` });
  }
  return { composition, shots };
}

async function sheet(name, groups, cols) {
  const tiles = [];
  for (const { composition, shots } of groups) {
    const w = composition.width > composition.height ? 480 : 216;
    const h = Math.round((w * composition.height) / composition.width);
    for (const s of shots) tiles.push({ ...s, w, h });
  }
  const cellW = Math.max(...tiles.map((t) => t.w)) + 16;
  const cellH = Math.max(...tiles.map((t) => t.h)) + 40;
  const rows = Math.ceil(tiles.length / cols);
  const parts = await Promise.all(tiles.map(async (t, i) => {
    const img = await sharp(t.file).resize(t.w, t.h).png().toBuffer();
    const label = Buffer.from(`<svg width="${cellW}" height="28"><text x="0" y="20" font-family="Helvetica" font-size="15" fill="#4a4f58">${t.label}</text></svg>`);
    const x = (i % cols) * cellW + 8, y = Math.floor(i / cols) * cellH + 8;
    return [{ input: img, left: x, top: y }, { input: label, left: x, top: y + t.h + 6 }];
  }));
  await sharp({ create: { width: cols * cellW, height: rows * cellH + 8, channels: 3, background: '#ffffff' } })
    .composite(parts.flat()).png().toFile(`${OUT}${name}`);
  console.log(`✓ out/${name}`);
}

const film = await stillsFor('Launch16x9');
await sheet('contact-sheet.png', [film], 4);
await sheet('contact-sheet-9x16.png', [await stillsFor('Launch9x16')], 6);
await sheet('contact-sheet-ads.png', [await stillsFor('Ad9x16_V1'), await stillsFor('Ad9x16_V2'), await stillsFor('Ad9x16_V3')], 9);

if (mode !== 'all') process.exit(0);

/* Video --------------------------------------------------------------------- */

const srtTime = (s) => {
  const ms = Math.round(s * 1000);
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

function srt(beats) {
  let start = 0, n = 0;
  const out = [];
  for (const b of beats) {
    for (const c of b.cues) {
      out.push(`${++n}\n${srtTime(start + c.from)} --> ${srtTime(start + (c.to ?? b.seconds))}\n${(c.lines ?? [c.text]).join('\n')}\n`);
    }
    start += b.seconds;
  }
  return out.join('\n');
}

let failed = 0;
for (const id of Object.keys(CUTS)) {
  const composition = await selectComposition({ serveUrl, id: compositionId(id) });
  const file = `${OUT}${id}.mp4`;
  let crf = 20, bytes = Infinity;
  for (let attempt = 0; attempt < 3 && bytes > MAX_BYTES; attempt++, crf += 3) {
    // bt709: Remotion converts to limited range (zscale range=limited) and
    // tags the stream bt709 / color_range tv. Its 'default' passed the
    // full-range JPEG frames straight through as yuvj420p.
    await renderMedia({ composition, serveUrl, codec: 'h264', crf, pixelFormat: 'yuv420p', colorSpace: 'bt709', outputLocation: file, imageFormat: 'jpeg', jpegQuality: 92 });
    bytes = statSync(file).size;
    console.log(`  ${id} at CRF ${crf}: ${(bytes / 1048576).toFixed(1)} MB`);
  }
  if (bytes > MAX_BYTES) { console.error(`✗ ${id} is over 20 MB`); failed++; }
  else console.log(`✓ out/${id}.mp4`);
}

writeFileSync(`${OUT}Launch16x9.srt`, srt(CUTS.Launch16x9));
console.log('✓ out/Launch16x9.srt');
process.exit(failed ? 1 : 0);
