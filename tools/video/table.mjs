/**
 * Prints every cut's beat table — start, length, text, words, how long it is
 * on screen against how long the rule needs — and fails if any card is
 * short. `npm run table`. Node runs script.ts directly (type stripping).
 */
import { CUTS, checkReadingTime, words, READ_WORDS_PER_SECOND, HOLD_MULTIPLE } from './src/script.ts';
import { checkTextSize } from './src/sizes.ts';

let failures = 0;
for (const [id, beats] of Object.entries(CUTS)) {
  if (id === 'Launch9x16') continue; // same beats as Launch16x9
  const total = beats.reduce((s, b) => s + b.seconds, 0);
  console.log(`\n${id}${id === 'Launch16x9' ? ' (and Launch9x16)' : ''} — ${total.toFixed(1)}s`);
  const checks = checkReadingTime(beats);
  let t = 0;
  beats.forEach((b, i) => {
    const cs = checks.filter((c) => c.beat === i);
    const line = cs.map((c) => `"${c.text}" (${words(c.text)}w, on ${c.shown.toFixed(1)}s / needs ${c.needed.toFixed(1)}s${c.ok ? '' : ' ✗'})`).join(' + ') || '(no text)';
    console.log(`  ${t.toFixed(1).padStart(4)}–${(t + b.seconds).toFixed(1).padEnd(4)} ${b.scene.padEnd(9)} ${line}`);
    t += b.seconds;
    failures += cs.filter((c) => !c.ok).length;
  });
}
console.log(`\nRule: on screen ≥ ${HOLD_MULTIPLE} × words ÷ ${READ_WORDS_PER_SECOND}/s. ${failures ? `${failures} card(s) short.` : 'Every card passes.'}\n`);

// Text size inside the drawings (sizes.ts). Enforced by Root.tsx and render.mjs.
console.log('Smallest text inside each drawing, as placed (floor 28px in 16:9, 34px in 9:16)\n');
for (const r of checkTextSize()) {
  console.log(`  ${r.ok ? '✓' : r.exempt ? '–' : '✗'} ${r.format.padEnd(9)} ${r.drawing.padEnd(22)} ×${r.scale.toFixed(2)}  ${(r.widthShare * 100).toFixed(0).padStart(3)}% wide${r.heightBound ? ' (height-bound)' : '               '}  smallest ${r.smallestPx.toFixed(1)}px / ${r.floor}  — ${r.smallest}`);
}
console.log('');
failures += checkTextSize().filter((r) => !r.ok && !r.exempt).length;
process.exit(failures ? 1 : 0);
