/**
 * Prints every cut's beats, snapped to the 120 BPM grid, with every
 * caption's time on screen against what the reading rule needs; then the
 * text sizes against the floor. Fails on any short caption or small text.
 * `npm run table`. Node runs the .ts files directly (type stripping).
 */
import { CUTS, GRID_BPM, checkReadingTime, snapBeats, words, READ_WORDS_PER_SECOND, HOLD_MULTIPLE, MIN_HOLD, MIN_HOLD_SHORT, SHORT_WORDS } from './src/script.ts';
import { checkTextSize } from './src/sizes.ts';

let failures = 0;
console.log(`Cuts snapped to a ${GRID_BPM} BPM grid.`);
{
  for (const [id, nominal] of Object.entries(CUTS)) {
    if (id === 'Launch9x16') continue; // same beats as Launch16x9
    const beats = snapBeats(nominal);
    const total = beats.reduce((s, b) => s + b.seconds, 0);
    console.log(`\n${id}${id === 'Launch16x9' ? ' (and Launch9x16)' : ''} — ${total.toFixed(2)}s`);
    const checks = checkReadingTime(beats);
    let t = 0;
    beats.forEach((b, i) => {
      const cs = checks.filter((c) => c.beat === i);
      console.log(`  ${t.toFixed(2).padStart(5)}–${(t + b.seconds).toFixed(2).padEnd(5)} ${b.scene.padEnd(12)}`);
      for (const c of cs) console.log(`      "${c.text}" (${words(c.text)}w) on ${c.shown.toFixed(2)}s / needs ${c.needed.toFixed(2)}s${c.ok ? '' : '  ✗'}`);
      t += b.seconds;
      failures += cs.filter((c) => !c.ok).length;
    });
  }
}
console.log(`\nRule: on screen ≥ max(${HOLD_MULTIPLE} × words ÷ ${READ_WORDS_PER_SECOND}/s, ${MIN_HOLD}s; ${MIN_HOLD_SHORT}s at ${SHORT_WORDS} words or fewer). ${failures ? `${failures} short.` : 'Every caption passes.'}\n`);
console.log('Drawn text (floor 28px in 16:9, 34px in 9:16)');
for (const r of checkTextSize()) console.log(`  ${r.ok ? '✓' : '✗'} ${r.format.padEnd(9)} ${r.what.padEnd(28)} ${r.px.toFixed(1)}px`);
failures += checkTextSize().filter((r) => !r.ok).length;
process.exit(failures ? 1 : 0);
