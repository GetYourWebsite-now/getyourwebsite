/**
 * Tempo and beat grid of an audio file. `node bpm.mjs <file> [from] [to]`
 * prints the BPM and the time of the first beat; `beats()` is what the video
 * imports (through the JSON it writes) to snap cuts to the beat.
 *
 * No BPM tool is installed and none is needed: decode to mono PCM with
 * ffmpeg, take the spectral flux (how much new energy each 23ms frame adds —
 * drum hits and note onsets), autocorrelate it over 60–200 BPM with a mild
 * preference for 120 (to settle double/half-tempo ties), refine the lag to a
 * fraction of a frame, then find the phase whose beats land on the most
 * onset energy. Downbeat = the beat of every four with the most energy.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const SR = 22050, N = 1024, HOP = 256;

export function analyse(file, from = 0, to = 90) {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-ss', String(from), '-t', String(to - from), '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  const x = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);

  // Spectral flux, log-compressed magnitudes, Hann window.
  const win = Float64Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
  const frames = Math.floor((x.length - N) / HOP);
  const flux = new Float64Array(frames);
  let prev = new Float64Array(N / 2);
  const re = new Float64Array(N), im = new Float64Array(N);
  for (let f = 0; f < frames; f++) {
    for (let i = 0; i < N; i++) { re[i] = x[f * HOP + i] * win[i]; im[i] = 0; }
    fft(re, im);
    const mag = new Float64Array(N / 2);
    let s = 0;
    for (let k = 1; k < N / 2; k++) {
      mag[k] = Math.log1p(100 * Math.hypot(re[k], im[k]));
      const d = mag[k] - prev[k];
      if (d > 0) s += d;
    }
    flux[f] = s;
    prev = mag;
  }
  // Remove the slow trend so loud passages don't dominate.
  const env = new Float64Array(frames);
  const W = 16;
  for (let f = 0; f < frames; f++) {
    let m = 0, n = 0;
    for (let j = Math.max(0, f - W); j < Math.min(frames, f + W); j++) { m += flux[j]; n++; }
    env[f] = Math.max(0, flux[f] - m / n);
  }

  const fps = SR / HOP;
  const ac = (lag) => { let s = 0; for (let f = lag; f < frames; f++) s += env[f] * env[f - lag]; return s / (frames - lag); };
  const scores = [];
  for (let bpm = 60; bpm <= 200; bpm += 0.25) {
    const lag = (60 / bpm) * fps;
    const l0 = Math.floor(lag), a = lag - l0;
    const v = (1 - a) * ac(l0) + a * ac(l0 + 1);
    // Also reward the double lag (a bar of 2) so the true beat beats a hi-hat subdivision.
    const l2 = Math.round(lag * 2), v2 = l2 < frames ? ac(l2) : 0;
    const prefer = Math.exp(-0.5 * Math.pow(Math.log2(bpm / 120) / 0.6, 2));
    scores.push({ bpm, score: (v + 0.5 * v2) * prefer, raw: v });
  }
  scores.sort((p, q) => q.score - p.score);
  const bpm = scores[0].bpm;

  // Phase: the offset whose beat grid collects the most onset energy.
  const period = (60 / bpm) * fps;
  let best = { phase: 0, e: -1 };
  for (let p = 0; p < period; p += 0.25) {
    let e = 0;
    for (let t = p; t < frames; t += period) e += env[Math.round(t)] ?? 0;
    if (e > best.e) best = { phase: p, e };
  }
  // Downbeat: which of four consecutive beats carries the most energy.
  const beatE = [0, 0, 0, 0];
  let i = 0;
  for (let t = best.phase; t < frames; t += period, i++) beatE[i % 4] += env[Math.round(t)] ?? 0;
  const down = beatE.indexOf(Math.max(...beatE));
  const firstBeat = from + best.phase / fps;
  const firstDownbeat = firstBeat + down * (60 / bpm);
  // Confidence: how far the winner stands above the median candidate.
  const median = scores[Math.floor(scores.length / 2)].score;
  return { file, bpm, firstBeat: +firstBeat.toFixed(3), firstDownbeat: +firstDownbeat.toFixed(3), confidence: +(scores[0].score / median).toFixed(2), runnersUp: scores.slice(1, 6).map((s) => s.bpm) };
}

/**
 * The strongest entry in the first `within` seconds: the downbeat where the
 * loudness of the next two bars most exceeds that of the bar before it — a
 * drop or a new section. The film puts it on "We do." Measured on bars of
 * the grid `analyse` found, so it is always a downbeat.
 */
export function drop(file, { bpm, firstDownbeat }, within = 60, minLeadIn = 3) {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-t', String(within + 10), '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  const x = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
  const bar = (4 * 60) / bpm;
  const rms = (t0, t1) => {
    let s = 0, n = 0;
    for (let i = Math.max(0, Math.round(t0 * SR)); i < Math.min(x.length, Math.round(t1 * SR)); i++) { s += x[i] * x[i]; n++; }
    return n ? Math.sqrt(s / n) : 0;
  };
  let best = { t: firstDownbeat, gain: -Infinity };
  for (let t = firstDownbeat; t + 2 * bar < within; t += bar) {
    if (t < minLeadIn) continue;
    const before = rms(t - bar, t), after = rms(t, t + 2 * bar);
    const gain = 20 * Math.log10((after + 1e-6) / (before + 1e-6));
    if (gain > best.gain) best = { t, gain };
  }
  return { at: +best.t.toFixed(3), gainDb: +best.gain.toFixed(1) };
}

/** Integrated loudness (LUFS) of a file, by ffmpeg's EBU R128 meter. */
export function loudness(file) {
  const r = spawnSync('ffmpeg', ['-v', 'info', '-nostats', '-i', file, '-af', 'ebur128=framelog=quiet', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  return Number(/I:\s+(-?[\d.]+) LUFS/.exec(r)?.[1]);
}

/** Sample peak (dBFS) of a file. */
export function peak(file) {
  const r = spawnSync('ffmpeg', ['-v', 'info', '-nostats', '-i', file, '-af', 'astats=measure_perchannel=none', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  return Number(/Peak level dB:\s+(-?[\d.]+)/.exec(r)?.[1]);
}

function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let j = 0; j < len / 2; j++) {
        const ar = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci;
        const ai = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr;
        re[i + j + len / 2] = re[i + j] - ar; im[i + j + len / 2] = im[i + j] - ai;
        re[i + j] += ar; im[i + j] += ai;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}

// `node bpm.mjs` analyses every track in assets/music into src/music.json,
// which the video reads; `node bpm.mjs <file> [from] [to]` prints one.
if (import.meta.url === `file://${process.argv[1]}`) {
  const [file, from, to] = process.argv.slice(2);
  if (file) {
    console.log(JSON.stringify(analyse(file, Number(from ?? 0), Number(to ?? 90))));
  } else {
    const { existsSync, readdirSync } = await import('node:fs');
    const dir = new URL('./assets/music/', import.meta.url).pathname;
    const out = {};
    // V2.1 has no track; the effects' peaks are still measured.
    for (const f of (existsSync(dir) ? readdirSync(dir) : []).filter((n) => n.endsWith('.mp3')).sort()) {
      const a = analyse(dir + f, 0, 60);
      // Half-BPM resolution is all the grid needs; keep the measured value.
      const d = drop(dir + f, a);
      out[f.slice(0, 1)] = { file: f, bpm: a.bpm, firstDownbeat: a.firstDownbeat, confidence: a.confidence, drop: d.at, dropGainDb: d.gainDb };
      console.log(`${f}: ${a.bpm} BPM, first downbeat ${a.firstDownbeat}s, drop at ${d.at}s (+${d.gainDb} dB)`);
    }
    // Levels (§2): each track's integrated loudness, so the mix can set it to
    // −14 LUFS, and each sound's peak, so it can be set to −6 dBFS.
    for (const k of Object.keys(out)) out[k].lufs = loudness(dir + out[k].file);
    const sfxDir = new URL('./assets/sfx/', import.meta.url).pathname;
    const peaks = {};
    for (const f of readdirSync(sfxDir).filter((n) => n.endsWith('.wav')).sort()) peaks[f.replace('.wav', '')] = peak(sfxDir + f);
    writeFileSync(new URL('./src/music.json', import.meta.url), JSON.stringify({ tracks: out, sfxPeakDb: peaks }, null, 1) + '\n');
    console.log('levels:', Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.lufs])), peaks);
  }
}
