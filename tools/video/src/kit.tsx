/**
 * The shared kit: fonts, easing, the format, kinetic type, captions, the
 * demo label and the push-in.
 *
 * Fonts are the site's own files from public/fonts, so the video and the site
 * cannot drift apart typographically. Rendering waits on them (delayRender):
 * a frame in a fallback face is a wrong frame.
 */
import React from 'react';
import { continueRender, delayRender, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import interUrl from '../../../public/fonts/Inter-Variable.woff2';
import monoUrl from '../../../public/fonts/JetBrainsMono-Variable.woff2';
import { FPS, TOKENS } from './script.ts';
import { FORMATS, type Format } from './sizes.ts';

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

/** The site's --ease. */
export const ease = Easing.bezier(0.16, 1, 0.3, 1);
/** Kinetic type's ease-out (§5): a plain cubic out. */
export const easeOut = Easing.out(Easing.cubic);

/** Seconds into the current <Sequence>. */
export const useSeconds = () => useCurrentFrame() / FPS;

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** 0 → 1 between two times, eased. */
export const ramp = (t: number, from: number, dur = 0.35, e = ease) =>
  interpolate(t, [from, from + dur], [0, 1], { easing: e, ...clamp });

/** Linear 0 → 1. */
export const lin = (t: number, from: number, to: number) => interpolate(t, [from, to], [0, 1], clamp);

/** The first `n` characters — typing. */
export const typedChars = (s: string, t: number, from: number, cps: number) =>
  s.slice(0, Math.max(0, Math.min(s.length, Math.floor((t - from) * cps + 1e-6))));

/* Format ------------------------------------------------------------------ */

export function useFormat() {
  const { width, height } = useVideoConfig();
  const format: Format = height > width ? 'portrait' : 'landscape';
  return { format, portrait: format === 'portrait', F: FORMATS[format] };
}

/* Surfaces ---------------------------------------------------------------- */

export const Surface: React.FC<{ tone?: 'bg' | 'alt' | 'dark'; children: React.ReactNode; style?: React.CSSProperties }> = ({ tone = 'bg', children, style }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: tone === 'dark' ? TOKENS.black : tone === 'alt' ? TOKENS.bgAlt : TOKENS.bg,
      fontFamily: FONT,
      color: TOKENS.ink,
      overflow: 'hidden',
      ...style,
    }}
  >
    {children}
  </div>
);

/**
 * The default way a hold stays alive (§0): a slow camera push-in, 1.00 →
 * `to` over `dur` seconds, around `origin`.
 */
export const PushIn: React.FC<{ from?: number; dur: number; to?: number; origin?: string; children: React.ReactNode }> = ({ from = 0, dur, to = 1.06, origin = '50% 50%', children }) => {
  const t = useSeconds();
  const s = interpolate(t, [from, from + dur], [1, to], clamp);
  return <div style={{ position: 'absolute', inset: 0, transform: `scale(${s})`, transformOrigin: origin }}>{children}</div>;
};

/* Kinetic type ------------------------------------------------------------ */

/** §5: Inter 700, tracking −0.02em, each word up from 8px below over 220ms,
 *  60ms apart. Returns when the last word has landed. */
export const WORD_GAP = 0.06;
export const WORD_IN = 0.22;
export const landedAt = (text: string, from: number) => from + (text.split(/\s+/).length - 1) * WORD_GAP + WORD_IN;

export const Kinetic: React.FC<{
  text: string;
  from: number;
  size: number;
  color?: string;
  weight?: number;
  align?: 'left' | 'center';
  lineHeight?: number;
  style?: React.CSSProperties;
}> = ({ text, from, size, color = TOKENS.ink, weight = 700, align = 'left', lineHeight = 1.08, style }) => {
  const t = useSeconds();
  const ws = text.split(/\s+/);
  return (
    <div style={{ fontFamily: FONT, fontSize: size, fontWeight: weight, letterSpacing: '-0.02em', lineHeight, color, textAlign: align, textWrap: 'balance', ...style }}>
      {ws.map((w, i) => {
        const p = ramp(t, from + i * WORD_GAP, WORD_IN, easeOut);
        return (
          <span key={i} style={{ display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 8}px)`, whiteSpace: 'pre' }}>
            {w}
            {i < ws.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </div>
  );
};

/** A burned-in caption: kinetic, in the format's caption band, on a quiet
 *  backing so it reads over anything. */
export const Caption: React.FC<{ text: string; from: number; to: number }> = ({ text, from, to }) => {
  const t = useSeconds();
  const { F } = useFormat();
  if (t < from || t >= to) return null;
  return (
    <div style={{ position: 'absolute', left: F.caption.x, top: F.caption.y, width: F.caption.w }}>
      <Kinetic text={text} from={from} size={F.caption.size} />
    </div>
  );
};

/** The lower third: what the picture is ("Demo account", "Cedar & Stone is
 *  a fictional example."). Small, lower left, once per subject. Bottom-
 *  anchored, so a long one wraps upwards and stays clear of 9:16's bottom
 *  320px. */
export const DemoLabel: React.FC<{ text: string }> = ({ text }) => {
  const { F } = useFormat();
  const right = F.label.align === 'right';
  return (
    <div
      style={{
        position: 'absolute', ...(right ? { right: F.label.x, top: F.label.y } : { left: F.label.x, bottom: F.H - F.label.y - F.label.size * 1.5 }),
        maxWidth: F.label.maxW, lineHeight: 1.25,
        padding: '6px 14px', borderRadius: 6,
        background: 'rgba(10,10,12,0.82)', border: '1px solid rgba(246,247,249,0.16)', color: '#f6f7f9',
        fontFamily: FONT, fontSize: F.label.size, fontWeight: 500, letterSpacing: '-0.005em',
      }}
    >
      {text}
    </div>
  );
};
