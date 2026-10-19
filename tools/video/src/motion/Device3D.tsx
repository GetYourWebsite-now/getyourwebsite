/**
 * Devices in 3D (V2.1 §2). Perspective on flat real footage — nothing more.
 *
 *   - Each device sits in perspective 1400px and enters from depth:
 *     translateZ(−700px) rotateY(14°), 60% opacity, 10px blur → flat and
 *     sharp, on the spring (a little overshoot).
 *   - On screen it drifts: rotateY ±2.5°, rotateX ±1.5°, on slow sines.
 *   - Light on the glass: a 1px white-20% top edge, and a soft specular
 *     band that slides across as it turns.
 *   - A large soft shadow lifts it off the stage.
 *   - Dark-glass chrome (#141418), the real URL in mono, no notch art.
 */
import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { FPS } from '../script.ts';
import { MONO, clamp, useFormat } from '../kit.tsx';
import { URL_TEXT, type Box } from '../sizes.ts';
import { springAt } from './Stage.tsx';

export const CHROME = '#141418';

export type Enter = {
  /** Seconds into the sequence when it starts entering (no entry if absent). */
  at?: number;
  /** Rotation it enters from, degrees (negative for the other side). */
  fromRotY?: number;
  /** Rest yaw, degrees: two devices can settle facing each other. */
  restRotY?: number;
  /** Drift phase, so two devices don't move in lockstep. */
  phase?: number;
  /** Drift amount, 1 = ±2.5°/±1.5°. */
  drift?: number;
  /** A fast specular sweep across the glass, at this time. */
  sweepAt?: number;
};

export function useDevice3D({ at, fromRotY = 14, restRotY = 0, phase = 0, drift = 1, sweepAt }: Enter) {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const p = at === undefined ? 1 : springAt(frame, at);
  const q = Math.min(1, p);
  const rotY = fromRotY * (1 - p) + restRotY + Math.sin(t * 0.55 + phase) * 2.5 * drift;
  const rotX = Math.sin(t * 0.43 + phase * 1.7) * 1.5 * drift;
  const z = -700 * (1 - p);
  const opacity = at === undefined ? 1 : 0.6 + 0.4 * q;
  const blur = at === undefined ? 0 : 10 * (1 - q);
  // The specular band's position follows the yaw; a sweep runs it across fast.
  const sweep = sweepAt === undefined ? -1 : interpolate(t, [sweepAt, sweepAt + 0.45], [-0.4, 1.4], clamp);
  const spec = sweep >= -0.4 && sweep < 1.4 && sweepAt !== undefined && t >= sweepAt ? sweep : 0.5 + rotY / 12;
  const visible = at === undefined || frame >= Math.round(at * FPS);
  return { rotY, rotX, z, opacity, blur, spec, visible, sweeping: sweepAt !== undefined && t >= sweepAt && t < sweepAt + 0.45 };
}

/** The 3D wrapper: a perspective container the size of `box`. */
export const Device3D: React.FC<{ box: Box; enter?: Enter; radius?: number; children: React.ReactNode }> = ({ box, enter = {}, radius = 14, children }) => {
  const d = useDevice3D(enter);
  if (!d.visible) return null;
  return (
    <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, perspective: 1400, perspectiveOrigin: '50% 50%' }}>
      <div
        style={{
          position: 'absolute', inset: 0, transformStyle: 'preserve-3d',
          transform: `translateZ(${d.z}px) rotateY(${d.rotY}deg) rotateX(${d.rotX}deg)`,
          opacity: d.opacity, filter: d.blur > 0.05 ? `blur(${d.blur}px)` : undefined,
        }}
      >
        <div style={{ position: 'absolute', inset: 0, borderRadius: radius, boxShadow: '0 60px 120px rgba(0,0,0,.55)', overflow: 'hidden', background: CHROME }}>
          {children}
          {/* The specular: a soft band of light across the glass. */}
          <div
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen',
              background: `linear-gradient(105deg, rgba(255,255,255,0) ${(d.spec - 0.25) * 100}%, rgba(255,255,255,${d.sweeping ? 0.16 : 0.07}) ${d.spec * 100}%, rgba(255,255,255,0) ${(d.spec + 0.25) * 100}%)`,
            }}
          />
          {/* The 1px lit top edge. */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: 'rgba(255,255,255,0.2)' }} />
        </div>
      </div>
    </div>
  );
};

/** The URL bar's height for a format. */
export const barHeight = (portrait: boolean) => Math.round(URL_TEXT[portrait ? 'portrait' : 'landscape'] * 2.1);

/** A dark-glass browser: chrome bar with the real URL, the content below. The
 *  content is positioned in the device's own coordinates (0,0 = top-left of
 *  the content area); `content(w, h)` renders it. */
export const GlassBrowser: React.FC<{ box: Box; url: string; enter?: Enter; content: (w: number, h: number) => React.ReactNode }> = ({ box, url, enter, content }) => {
  const { portrait } = useFormat();
  const bar = barHeight(portrait);
  const size = URL_TEXT[portrait ? 'portrait' : 'landscape'];
  const narrow = box.w < url.length * size * 0.62 + bar * 2.4;
  const cw = box.w - 2, ch = box.h - bar - 1;
  return (
    <Device3D box={box} enter={enter}>
      <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: bar, display: 'flex', alignItems: 'center', gap: 10, padding: `0 ${narrow ? 8 : bar * 0.4}px` }}>
        {!narrow && [0, 1, 2].map((i) => <span key={i} style={{ width: 12, height: 12, borderRadius: 6, background: '#2c2e35' }} />)}
        <div style={{ marginLeft: narrow ? 0 : bar * 0.3, flex: 1, height: bar * 0.66, borderRadius: 8, background: '#1d1e24', display: 'flex', alignItems: 'center', justifyContent: narrow ? 'center' : 'flex-start', padding: `0 ${bar * 0.3}px`, fontFamily: MONO, fontSize: size, color: '#c9ccd3', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {url}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 1, top: bar, width: cw, height: ch, overflow: 'hidden', borderRadius: '0 0 12px 12px', background: CHROME }}>
        {content(cw, ch)}
      </div>
    </Device3D>
  );
};

/** A dark-glass phone: thin edge, the URL at the top, no notch art. */
export const GlassPhone: React.FC<{ box: Box; url: string; enter?: Enter; content: (w: number, h: number) => React.ReactNode }> = ({ box, url, enter, content }) => {
  const { portrait } = useFormat();
  const bar = barHeight(portrait);
  const size = URL_TEXT[portrait ? 'portrait' : 'landscape'];
  const edge = 10;
  const cw = box.w - 2 * edge, ch = box.h - 2 * edge - bar;
  return (
    <Device3D box={box} enter={enter} radius={54}>
      <div style={{ position: 'absolute', left: edge, top: edge, right: edge, height: bar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: size, color: '#c9ccd3', whiteSpace: 'nowrap' }}>{url}</div>
      <div style={{ position: 'absolute', left: edge, top: edge + bar, width: cw, height: ch, overflow: 'hidden', borderRadius: '0 0 44px 44px', background: CHROME }}>
        {content(cw, ch)}
      </div>
    </Device3D>
  );
};

/** What a phone box must be for content of aspect cw:ch at height h. */
export const phoneWidthFor = (h: number, cw: number, ch: number, portrait: boolean) => ((h - 20 - barHeight(portrait)) * cw) / ch + 20;
