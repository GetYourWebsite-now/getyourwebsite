/**
 * Sound (V2 §2). Not used in V2.1, which is silent; kept for the pass that
 * brings sound back. The effects, each set to peak at −6 dBFS (times the
 * scene's own gain), keyboard ticks pitch-varied across five ±5% copies.
 * render.mjs then normalised the whole mix to −14 LUFS integrated, −1 dBTP
 * true peak.
 *
 * There is no music track: V2.1 dropped it. To bring music back, add the file to
 * assets/music/, run `node bpm.mjs` to measure its grid, drop and loudness
 * into src/music.json, and play it here under the effects, ducked 6 dB while
 * each one sounds.
 *
 * Effect levels come from src/music.json (`node bpm.mjs` measures them).
 */
import React from 'react';
import { Audio, Sequence } from 'remotion';
import { FPS } from './script.ts';

import levels from './music.json';
import type { Sfx, SfxKind } from './scenes/types.ts';

import click from '../assets/sfx/click.wav';
import key0 from '../assets/sfx/key-0.wav';
import key1 from '../assets/sfx/key-1.wav';
import key2 from '../assets/sfx/key-2.wav';
import key3 from '../assets/sfx/key-3.wav';
import key4 from '../assets/sfx/key-4.wav';
import whoosh from '../assets/sfx/whoosh.wav';
import pop from '../assets/sfx/pop.wav';
import rip from '../assets/sfx/rip.wav';
import printer from '../assets/sfx/printer.wav';

const L = levels as unknown as { sfxPeakDb: Record<string, number> };

const db = (x: number) => Math.pow(10, x / 20);
const SFX_PEAK = -6;

const SFX_FILES: Record<Exclude<SfxKind, 'key'>, string> = { click, whoosh, pop, rip, printer };
const KEYS = [key0, key1, key2, key3, key4];

function file(e: Sfx, i: number) {
  if (e.kind === 'key') {
    // Deterministic, not random: the same render twice sounds the same.
    const k = (i * 7 + Math.round(e.t * 100)) % KEYS.length;
    return { src: KEYS[k], peak: L.sfxPeakDb[`key-${k}`] };
  }
  return { src: SFX_FILES[e.kind], peak: L.sfxPeakDb[e.kind] };
}

export const Soundtrack: React.FC<{ events: Sfx[] }> = ({ events }) => (
  <>
    {events.map((e, i) => {
      const { src, peak } = file(e, i);
      const vol = db(SFX_PEAK - peak) * (e.gain ?? (e.kind === 'key' ? 0.55 : 1));
      return (
        <Sequence key={i} from={Math.max(0, Math.round(e.t * FPS))} durationInFrames={Math.round(0.6 * FPS)} layout="none">
          <Audio src={src} volume={Math.min(1, vol)} />
        </Sequence>
      );
    })}
  </>
);
