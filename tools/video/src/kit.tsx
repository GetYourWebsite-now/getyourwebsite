/**
 * The shared kit: fonts, the site's easing, the frame layout for each aspect
 * ratio, and the three kinds of text card (headline, lower third, end card).
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
import { FORMATS, place, type Box } from './sizes.ts';

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

/* Layout ------------------------------------------------------------------ */

export type Layout = {
  portrait: boolean;
  W: number;
  H: number;
  /** Where the headline sits. */
  head: { x: number; y: number; w: number; size: number };
  /** The box a drawing fills. */
  stage: { x: number; y: number; w: number; h: number };
  /** Where a lower third sits (portrait: in the headline's place). */
  lower: { x: number; y: number };
};

/**
 * 16:9 — headline top left, drawing below it.
 * 9:16 — the top 220px and bottom 320px stay clear of text (TikTok and Reels
 * draw their own UI there): headline from y 240, drawing in the middle,
 * nothing below y 1600.
 */
export function useLayout(): Layout {
  const { width: W, height: H } = useVideoConfig();
  const portrait = H > W;
  return portrait
    ? {
        portrait, W, H,
        head: { x: 70, y: 250, w: 940, size: FORMATS.portrait.headSize },
        stage: { x: 50, y: 620, w: 980, h: 940 },
        lower: { x: 70, y: 280 },
      }
    : {
        portrait, W, H,
        head: { x: 150, y: 110, w: 1500, size: FORMATS.landscape.headSize },
        stage: { x: 150, y: 300, w: 1620, h: 680 },
        lower: { x: 150, y: 950 },
      };
}

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

/** Absolutely places a drawing's natural-size box, scaled to fit the stage. */
export const Fit: React.FC<{ w: number; h: number; box?: Layout['stage']; children: React.ReactNode }> = ({ w, h, box, children }) => {
  const L = useLayout();
  const b = box ?? L.stage;
  const s = Math.min(b.w / w, b.h / h);
  return (
    <div
      style={{
        position: 'absolute',
        left: b.x + (b.w - w * s) / 2,
        top: b.y + (b.h - h * s) / 2,
        width: w,
        height: h,
        transform: `scale(${s})`,
        transformOrigin: '0 0',
      }}
    >
      {children}
    </div>
  );
};

/**
 * Places a drawing by the rule in sizes.ts: ~70% / ~85% of the frame's width,
 * capped by the band under the headline, centred in that band, scaled as one
 * unit. `box.x/y` crop to the drawing's content.
 */
export const Place: React.FC<{ box: Box; band?: { top: number; bottom: number }; children: React.ReactNode }> = ({ box, band, children }) => {
  const L = useLayout();
  const p = place(L.portrait ? 'portrait' : 'landscape', box, band);
  return (
    <div style={{ position: 'absolute', left: p.left, top: p.top, width: box.w, height: box.h, transform: `scale(${p.s})`, transformOrigin: '0 0' }}>
      <div style={{ position: 'absolute', left: -(box.x ?? 0), top: -(box.y ?? 0) }}>{children}</div>
    </div>
  );
};

/* Text cards -------------------------------------------------------------- */

/** A headline: fades up over 300ms at `from`. On the 9:16 renders this is the
 *  burned-in caption. */
export const Headline: React.FC<{ text: string; from: number; color?: string; center?: boolean }> = ({ text, from, color = TOKENS.ink, center }) => {
  const t = useSeconds();
  const L = useLayout();
  const p = ramp(t, from, 0.3);
  return (
    <div
      style={{
        position: 'absolute',
        left: L.head.x,
        top: L.head.y,
        width: L.head.w,
        fontFamily: FONT,
        fontSize: L.head.size,
        fontWeight: 600,
        lineHeight: 1.1,
        letterSpacing: '-0.025em',
        color,
        textAlign: center ? 'center' : 'left',
        textWrap: 'balance',
        opacity: p,
        transform: `translateY(${(1 - p) * 14}px)`,
      }}
    >
      {text}
    </div>
  );
};

/** The quiet label that says what a picture is. */
export const LowerThird: React.FC<{ text: string; from: number }> = ({ text, from }) => {
  const t = useSeconds();
  const L = useLayout();
  const p = ramp(t, from, 0.3);
  return (
    <div
      style={{
        position: 'absolute',
        left: L.lower.x,
        top: L.lower.y,
        padding: L.portrait ? '18px 26px' : '14px 22px',
        background: TOKENS.bg,
        border: `1px solid ${TOKENS.line}`,
        borderRadius: 8,
        fontFamily: FONT,
        fontSize: L.portrait ? 40 : 34,
        fontWeight: 500,
        color: TOKENS.inkSoft,
        opacity: p,
        transform: `translateY(${(1 - p) * 8}px)`,
        boxShadow: '0 1px 2px rgba(10,10,12,.04), 0 8px 24px rgba(10,10,12,.06)',
      }}
    >
      {text}
    </div>
  );
};
