/**
 * The shared kit: fonts, the site's easing and the plain surface.
 *
 * Fonts are the site's own files from public/fonts, loaded by URL, so the
 * video and the site cannot drift apart typographically. Rendering waits on
 * them (delayRender) — a frame in a fallback face is a wrong frame.
 */
import React from 'react';
import { continueRender, delayRender, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import interUrl from '../../../public/fonts/Inter-Variable.woff2';
import monoUrl from '../../../public/fonts/JetBrainsMono-Variable.woff2';
import { FPS, TOKENS } from './script.ts';

/* Fonts ------------------------------------------------------------------- */

const fontHandle = delayRender('Loading Inter and JetBrains Mono');
Promise.all([
  new FontFace('Inter', `url(${interUrl}) format('woff2')`, { weight: '100 900' }).load(),
  new FontFace('JetBrains Mono', `url(${monoUrl}) format('woff2')`, { weight: '100 800' }).load(),
])
  .then((faces) => {
    faces.forEach((f) => document.fonts.add(f));
    continueRender(fontHandle);
  })
  .catch((err) => {
    throw new Error(`Fonts failed to load: ${err}`);
  });

export const FONT = "'Inter', system-ui, sans-serif";
export const MONO = "'JetBrains Mono', ui-monospace, monospace";

/* Time -------------------------------------------------------------------- */

/** The site's --ease: cubic-bezier(0.16, 1, 0.3, 1). 200–400ms, never bouncy. */
export const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** Seconds into the current <Sequence>. */
export const useSeconds = () => useCurrentFrame() / FPS;

/** 0 → 1 between two times, eased. */
export const ramp = (t: number, from: number, dur = 0.35) =>
  interpolate(t, [from, from + dur], [0, 1], { easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

/** Linear 0 → 1, for typing and pans. */
export const lin = (t: number, from: number, to: number) =>
  interpolate(t, [from, to], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

/** The first `p` of a string, by characters — typing. */
export const typed = (s: string, p: number) => s.slice(0, Math.round(s.length * p));

/* Surfaces ---------------------------------------------------------------- */

export const Surface: React.FC<{ tone?: 'bg' | 'alt' | 'dark'; children: React.ReactNode }> = ({ tone = 'bg', children }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: tone === 'dark' ? TOKENS.black : tone === 'alt' ? TOKENS.bgAlt : TOKENS.bg,
      fontFamily: FONT,
      color: TOKENS.ink,
      fontFeatureSettings: 'normal',
      overflow: 'hidden',
    }}
  >
    {children}
  </div>
);
