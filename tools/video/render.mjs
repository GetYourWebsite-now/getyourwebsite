/**
 * Renders the V2 launch video and runs its gates.
 *
 *   npm run stills       contact sheets, one frame per beat (late in the beat,
 *                        and one early for beats that change in the middle):
 *                        out/contact-sheet.png (16:9 film),
 *                        out/contact-sheet-9x16.png, out/contact-sheet-ads.png
 *   npm run render       stills, then the five MP4s, the 16:9 .srt, the gates
 *   node render.mjs film the two films only (no stills), with their gates
 *   node render.mjs motion  the V2.1 motion test: the film's hook and build,
 *                        16:9 — out/motion-test.mp4
 *   node render.mjs film16  the 16:9 film only: its contact sheet, MP4, .srt
 *   node render.mjs one <cut>  one cut's MP4 and its gates (e.g. Ad_Receipt)
 *
 * Gates (§5), each failing the run:
 *   - reading rule and text floor (before anything renders)
 *   - no still frames: no frame identical to the one 15 frames before it, and
 *     no 0.5s window whose mean difference (frame vs 15 frames before, on a
 *     160px greyscale copy) is under STILL_THRESHOLD
 *   - silent: no audio stream (V2.1 drops sound and the loudness gate)
 *   - no pure black (#000) or pure white (#fff) frame: on a 160px copy, no
 *     frame with PURE_LIMIT or more of its pixels at 0,0,0 or 255,255,255
 *     (±1 for the YUV round trip). The stage is #0a0a0c, type #f6f7f9.
 *   - each file under 25 MB
 *   - H.264, yuv420p, limited range (color_range tv), BT.709
 */
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import sharp from '../../node_modules/sharp/lib/index.js';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, renameSync, rmSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CUTS, FPS, assertReadingTime, compositionId, frames, snapBeats } from './src/script.ts';
import { assertTextSize } from './src/sizes.ts';

const mode = process.argv[2] ?? 'stills';
const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const OUT = here('./out/');
const MAX_BYTES = 25 * 1024 * 1024;
const STILL_THRESHOLD = 0.08; // mean |Δ| on 0–255 greyscale, 160px wide
const PURE_LIMIT = 0.5; // share of a frame's pixels that are pure black or white
mkdirSync(OUT, { recursive: true });

const beatsOf = (cut) => snapBeats(CUTS[cut]);

assertReadingTime(Object.fromEntries(Object.keys(CUTS).map((c) => [c, beatsOf(c)])));
assertTextSize();

console.log('Bundling…');
const serveUrl = await bundle({ entryPoint: here('./src/index.ts') });

/* Contact sheets ----------------------------------------------------------- */

function shotsFor(beats) {
  let start = 0;
  const out = [];
  for (const b of beats) {
    const len = frames(b.seconds);
    // Beats that change half-way (the form, then the site; the click, then
    // the split) get an early frame too.
    if (['build', 'switch', 'receipt', 'oneSentence', 'hook'].includes(b.scene)) out.push({ at: start + Math.round(len * 0.35), scene: b.scene });
    out.push({ at: start + len - Math.round(0.2 * FPS), scene: b.scene });
    start += len;
  }
  return out;
}

async function stillsFor(cut) {
  const composition = await selectComposition({ serveUrl, id: compositionId(cut) });
  const shots = [];
  mkdirSync(`${OUT}.stills`, { recursive: true });
  for (const { at, scene } of shotsFor(beatsOf(cut))) {
    const file = `${OUT}.stills/${cut}-${String(at).padStart(4, '0')}.png`;
    await renderStill({ composition, serveUrl, output: file, frame: at });
    shots.push({ file, label: `${cut.replace('Launch', '')} ${(at / FPS).toFixed(1)}s ${scene}` });
  }
  return { composition, shots };
}

async function sheet(name, groups, cols) {
  const tiles = [];
  for (const { composition, shots } of groups) {
    const w = composition.width > composition.height ? 640 : 300;
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

if (mode === 'stills' || mode === 'all') {
  await sheet('contact-sheet.png', [await stillsFor('Launch16x9')], 4);
  await sheet('contact-sheet-9x16.png', [await stillsFor('Launch9x16')], 6);
  await sheet('contact-sheet-ads.png', [await stillsFor('Ad_Receipt'), await stillsFor('Ad_AllWeNeed'), await stillsFor('Ad_OneSentence')], 7);
}

/* Video and gates ------------------------------------------------------------ */

const probe = (file) => JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], { encoding: 'utf8' }));

/** Frame-vs-15-frames-before differences on a 160px greyscale copy. */
function stillCheck(file) {
  const { width, height } = probe(file).streams.find((s) => s.codec_type === 'video');
  const w = 160, h = Math.round((160 * height) / width / 2) * 2;
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', `scale=${w}:${h}:flags=area,format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30 });
  const n = raw.length / (w * h);
  const d = [];
  for (let i = 15; i < n; i++) {
    let s = 0;
    const a = (i - 15) * w * h, b = i * w * h;
    for (let k = 0; k < w * h; k++) s += Math.abs(raw[b + k] - raw[a + k]);
    d.push({ i, mad: s / (w * h) });
  }
  const identical = d.filter((x) => x.mad === 0).map((x) => x.i);
  const slow = [];
  for (let j = 0; j + 15 <= d.length; j++) {
    const mean = d.slice(j, j + 15).reduce((s, x) => s + x.mad, 0) / 15;
    if (mean < STILL_THRESHOLD) slow.push({ from: d[j].i, mean });
  }
  return { identical, slow, min: Math.min(...d.map((x) => x.mad)) };
}

/** Per frame, the share of pixels that are pure black or pure white. */
function pureCheck(file) {
  const { width, height } = probe(file).streams.find((s) => s.codec_type === 'video');
  const w = 160, h = Math.round((160 * height) / width / 2) * 2;
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', `scale=${w}:${h}:flags=area,format=rgb24`, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30 });
  const px = w * h, n = raw.length / (px * 3);
  let worst = { i: 0, share: 0, black: 0, white: 0 };
  for (let i = 0; i < n; i++) {
    let black = 0, white = 0;
    for (let k = 0; k < px; k++) {
      const o = (i * px + k) * 3, r = raw[o], g = raw[o + 1], b = raw[o + 2];
      if (r <= 1 && g <= 1 && b <= 1) black++;
      else if (r >= 254 && g >= 254 && b >= 254) white++;
    }
    const share = (black + white) / px;
    if (share > worst.share) worst = { i, share, black: black / px, white: white / px };
  }
  return worst;
}

function gates(file, name) {
  const fails = [];
  const p = probe(file);
  const v = p.streams.find((s) => s.codec_type === 'video');
  const a = p.streams.find((s) => s.codec_type === 'audio');
  const bytes = statSync(file).size;
  if (v.codec_name !== 'h264') fails.push(`codec ${v.codec_name}`);
  if (v.pix_fmt !== 'yuv420p') fails.push(`pix_fmt ${v.pix_fmt}`);
  if (v.color_range !== 'tv') fails.push(`color_range ${v.color_range}`);
  if (v.color_space !== 'bt709') fails.push(`color_space ${v.color_space}`);
  if (a) fails.push('has an audio stream (V2.1 is silent)');
  if (bytes >= MAX_BYTES) fails.push(`${(bytes / 1048576).toFixed(1)} MB ≥ 25 MB`);
  const P = pureCheck(file);
  if (P.share >= PURE_LIMIT) fails.push(`frame at ${(P.i / FPS).toFixed(2)}s is ${(P.share * 100).toFixed(0)}% pure black/white`);
  const S = stillCheck(file);
  if (S.identical.length) fails.push(`${S.identical.length} frame(s) identical to 15 frames before (first at ${(S.identical[0] / FPS).toFixed(2)}s)`);
  if (S.slow.length) fails.push(`still for 0.5s from ${(S.slow[0].from / FPS).toFixed(2)}s (mean Δ ${S.slow[0].mean.toFixed(3)})`);
  console.log(`  ${fails.length ? '✗' : '✓'} ${name}: ${v.width}×${v.height} ${v.pix_fmt}/${v.color_range}/${v.color_space}, ${Number(p.format.duration).toFixed(2)}s, ${(bytes / 1048576).toFixed(1)} MB, silent, min Δ ${S.min.toFixed(3)}, pure px max ${(P.share * 100).toFixed(1)}% (${(P.black * 100).toFixed(1)}% #000, ${(P.white * 100).toFixed(1)}% #fff) at ${(P.i / FPS).toFixed(2)}s${fails.length ? `\n      ${fails.join('\n      ')}` : ''}`);
  return fails.length;
}

async function renderOne(id, file, inputProps) {
  const composition = await selectComposition({ serveUrl, id, inputProps });
  await renderMedia({
    composition, serveUrl, inputProps, codec: 'h264', crf: 20, pixelFormat: 'yuv420p', colorSpace: 'bt709',
    imageFormat: 'jpeg', jpegQuality: 92, muted: true, outputLocation: file,
    onProgress: ({ progress }) => { if (Math.round(progress * 100) % 25 === 0) process.stdout.write(`\r  ${id} ${Math.round(progress * 100)}%   `); },
  });
  process.stdout.write('\n');
}

let failed = 0;

if (mode === 'motion') {
  const file = `${OUT}motion-test.mp4`;
  await renderOne('MotionTest', file);
  failed += gates(file, 'motion-test.mp4 (hook + build, 16:9)');
}

const srtTime = (s) => {
  const ms = Math.round(s * 1000);
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

function srt(beats) {
  let start = 0, n = 0;
  const out = [];
  for (const b of beats) {
    for (const c of b.cues) out.push(`${++n}\n${srtTime(start + c.from)} --> ${srtTime(start + (c.to ?? b.seconds))}\n${c.text}\n`);
    start += b.seconds;
  }
  return out.join('\n');
}

if (mode === 'film16') {
  await sheet('contact-sheet.png', [await stillsFor('Launch16x9')], 4);
  const file = `${OUT}Launch16x9.mp4`;
  await renderOne(compositionId('Launch16x9'), file);
  failed += gates(file, 'Launch16x9.mp4');
  writeFileSync(`${OUT}Launch16x9.srt`, srt(beatsOf('Launch16x9')));
  console.log('✓ out/Launch16x9.srt');
}

if (mode === 'one') {
  const cut = process.argv[3];
  if (!CUTS[cut]) throw new Error(`node render.mjs one <cut>: one of ${Object.keys(CUTS).join(', ')}`);
  const file = `${OUT}${cut}.mp4`;
  await renderOne(compositionId(cut), file);
  failed += gates(file, `${cut}.mp4`);
}

if (mode === 'all' || mode === 'film') {
  for (const cut of Object.keys(CUTS).filter((c) => mode === 'all' || c.startsWith('Launch'))) {
    const file = `${OUT}${cut}.mp4`;
    await renderOne(compositionId(cut), file);
    failed += gates(file, `${cut}.mp4`);
  }
  writeFileSync(`${OUT}Launch16x9.srt`, srt(beatsOf('Launch16x9')));
  console.log('✓ out/Launch16x9.srt');
}

rmSync(`${OUT}.stills`, { recursive: true, force: true });
// The bundle is ~50 MB in the temp folder; a session of renders fills a disk.
rmSync(serveUrl, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
