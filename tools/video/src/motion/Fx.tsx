/**
 * The few effects V2.1 allows on real footage: a 1px indigo ring that
 * expands from something and fades (a click, an arrival, "Sent ✓"), and a
 * pop — a region of the picture springing 0.9 → 1.
 */
import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { ACCENT, FPS } from '../script.ts';
import { clamp, ease } from '../kit.tsx';

/** A ring centred on (x, y), `w × h` at rest, growing 1.35× and fading over
 *  `dur` seconds from `at`. */
export const Ring: React.FC<{ x: number; y: number; w: number; h: number; at: number; dur?: number; radius?: number; grow?: number }> = ({ x, y, w, h, at, dur = 0.3, radius = 10, grow: by = 0.35 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [Math.round(at * FPS), Math.round(at * FPS) + Math.max(2, Math.round(dur * FPS))], [0, 1], { ...clamp, easing: ease });
  if (p <= 0 || p >= 1) return null;
  const g = 1 + by * p;
  return <div style={{ position: 'absolute', left: x - (w * g) / 2, top: y - (h * g) / 2, width: w * g, height: h * g, borderRadius: radius * g, border: `1px solid ${ACCENT}`, opacity: 1 - p, pointerEvents: 'none' }} />;
};
