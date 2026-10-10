/**
 * Records the home page scrolling, for judging the animations.
 *
 *   node tools/record.mjs [out.webm] [path]     (npm run record)
 *
 * Motion cannot be reviewed from stills: a still shows a frame, not whether
 * the frame is reached at the right moment or whether a loop reads as
 * calm or as a blinking light. This captures a 6-second Playwright video at
 * 1440x900 that scrolls once, top to bottom, through every section.
 *
 * The scroll is eased and continuous rather than jumped, so each animation
 * is seen starting as it comes into view — which is what the observer in
 * src/scripts/anim.js is for. Six seconds is the brief's length; the page is
 * long, so the recording is a pass over it, not a dwell on each drawing.
 *
 * Needs a dev server on :4321. Default output: .shots/phase7/home.webm.
 */
import { chromium } from 'playwright';
import { mkdirSync, renameSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';

const OUT = process.argv[2] ?? '.shots/phase7/home.webm';
const PATH = process.argv[3] ?? '/';
const BASE = process.env.BASE ?? 'http://localhost:4321';
const SIZE = { width: 1440, height: 900 };
const SECONDS = 6;

const tmp = join(dirname(OUT), '.record-tmp');
mkdirSync(tmp, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: SIZE,
  recordVideo: { dir: tmp, size: SIZE },
});
const page = await ctx.newPage();
const recordingStarted = Date.now();

await page.goto(BASE + PATH, { waitUntil: 'networkidle' });
await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });
await page.evaluate(() => document.fonts.ready);

const scrollStarted = Date.now();

// One eased pass from top to bottom in SECONDS, driven by rAF so it is smooth
// in the video rather than a series of jumps.
await page.evaluate(
  (ms) =>
    new Promise((done) => {
      // The site sets scroll-behavior: smooth on <html>; with it, every
      // per-frame scrollTo starts a new smooth scroll and the page crawls.
      document.documentElement.style.scrollBehavior = 'auto';
      const end = document.documentElement.scrollHeight - innerHeight;
      const t0 = performance.now();
      const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
      const step = (now) => {
        const t = Math.min(1, (now - t0) / ms);
        scrollTo(0, end * ease(t));
        if (t < 1) requestAnimationFrame(step);
        else done();
      };
      requestAnimationFrame(step);
    }),
  SECONDS * 1000
);

const video = page.video();
await ctx.close();
await browser.close();

// Playwright records from the moment the page is created, so the raw file
// opens on a couple of seconds of loading and ends on whatever closing the
// context takes. Keep only the scroll — SECONDS from the moment it started —
// when ffmpeg is available; otherwise keep the whole thing.
const raw = await video.path();
const from = ((scrollStarted - recordingStarted) / 1000).toFixed(2);
try {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', from, '-i', raw, '-t', String(SECONDS), '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '32', OUT]);
} catch {
  console.log('  (ffmpeg not found — keeping the untrimmed recording, load included)');
  renameSync(raw, OUT);
}
rmSync(tmp, { recursive: true, force: true });
console.log(`✓ ${OUT} — ${SECONDS}s at ${SIZE.width}x${SIZE.height}, ${PATH}`);
