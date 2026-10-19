/**
 * Type (V2.1 §4). Inter 700, letter-spacing −0.03em. Each word enters with
 * blur 14px → 0, up 18px → 0, opacity 0 → 1, and tightens from −0.01em to
 * −0.03em as it lands — 70ms apart, on the spring. One word per caption is
 * indigo: the noun that carries the beat.
 *
 * The rule: a 2px indigo line under whatever is speaking — the caption, the
 * hook, the end card's button — that whips to the new width on every cut. It
 * is the one element that persists across the film.
 */
import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { ACCENT, FPS } from '../script.ts';
import { FONT, clamp } from '../kit.tsx';
import { ON_STAGE, springAt } from './Stage.tsx';

export const TRACK_REST = -0.03;
export const WORD_STEP = 0.07;

/** Width of a line of Inter 700 at `size`, tracked −0.03em, in px. */
let ctx: CanvasRenderingContext2D | null = null;
export function measure(text: string, size: number, weight = 700) {
  ctx ??= document.createElement('canvas').getContext('2d');
  ctx!.font = `${weight} ${size}px Inter`;
  return ctx!.measureText(text).width + TRACK_REST * size * Math.max(0, text.length - 1);
}

/** Greedy word wrap to `max` px; returns the lines. */
export function wrap(text: string, size: number, max: number) {
  const out: string[] = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    const next = line ? `${line} ${w}` : w;
    if (line && measure(next, size) > max) { out.push(line); line = w; } else line = next;
  }
  if (line) out.push(line);
  return out;
}

const clean = (w: string) => w.replace(/[.,!?;:]+$/, '').toLowerCase();

/** A line of words blurring in. `from` is seconds into the sequence. */
export const BlurType: React.FC<{
  text: string;
  from: number;
  size: number;
  accent?: string;
  align?: 'left' | 'center';
  width?: number;
  lineHeight?: number;
  color?: string;
}> = ({ text, from, size, accent, align = 'left', width, lineHeight = 1.06, color = ON_STAGE }) => {
  const frame = useCurrentFrame();
  const words = text.split(/\s+/);
  return (
    <div style={{ width, fontFamily: FONT, fontWeight: 700, fontSize: size, lineHeight, textAlign: align, color }}>
      {words.map((w, i) => {
        const p = springAt(frame, from + i * WORD_STEP);
        const q = Math.min(1, p);
        const isAccent = accent !== undefined && clean(w) === clean(accent);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block', whiteSpace: 'pre',
              opacity: Math.min(1, q * 1.5),
              filter: q < 0.999 ? `blur(${14 * (1 - q)}px)` : undefined,
              transform: `translateY(${18 * (1 - p)}px)`,
              letterSpacing: `${-0.01 + (TRACK_REST + 0.01) * q}em`,
              color: isAccent ? ACCENT : undefined,
            }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </div>
  );
};

/** A card that exits: blur up and scale 1.04 over 6 frames, starting
 *  `lead` frames before `at` (its hand-over). */
export const EXIT_FRAMES = 6;
export const exitProgress = (frame: number, at: number, lead = 0) => {
  const start = Math.round(at * FPS) - lead;
  return interpolate(frame, [start, start + EXIT_FRAMES], [0, 1], clamp);
};
export const exitStyle = (frame: number, at: number, lead = 0): React.CSSProperties => {
  const p = exitProgress(frame, at, lead);
  if (p <= 0) return {};
  return { opacity: 1 - p, filter: `blur(${12 * p}px)`, transform: `scale(${1 + 0.04 * p})` };
};

/** The frame (after `from`) at which a word's opacity first passes `level`. */
export function wordOpacityPasses(level: number) {
  for (let f = 0; f < 60; f++) if (Math.min(1, Math.min(1, springAt(f, 0)) * 1.5) > level) return f;
  return 60;
}

/** Where the rule sits: under a line of type, `w` wide, from `x`. */
export type RuleAt = { x: number; y: number; w: number };

/** The rule's spring: quick, so it is under a line before its first word
 *  lands (a word takes ~0.35s to land; this settles in ~0.25s). */
export const RULE_SPRING = { damping: 22, stiffness: 300, mass: 0.6 };

/** The rule, springing from where it was (`prev`, or nowhere) to `next`. */
export const Rule: React.FC<{ prev: RuleAt | null; next: RuleAt; since: number; shift?: number }> = ({ prev, next, since, shift = 0 }) => {
  const frame = useCurrentFrame();
  const p = prev ? springAt(frame, since, RULE_SPRING) : 1;
  const lerp = (a: number, b: number) => a + (b - a) * p;
  const r = prev ? { x: lerp(prev.x, next.x), y: lerp(prev.y, next.y), w: lerp(prev.w, next.w) } : next;
  return <div style={{ position: 'absolute', left: r.x + shift, top: r.y, width: Math.max(0, r.w), height: 2, background: ACCENT }} />;
};

/** How wide a line is so far as its words land: each word adds its width
 *  as its own spring (the one BlurType uses) comes in. */
export function landedWidth(text: string, size: number, from: number, frame: number) {
  const words = text.split(/\s+/);
  let w = 0, before = 0;
  words.forEach((_, i) => {
    const upTo = measure(words.slice(0, i + 1).join(' '), size);
    w += (upTo - before) * Math.max(0, Math.min(1, springAt(frame, from + i * WORD_STEP)));
    before = upTo;
  });
  return w;
}
