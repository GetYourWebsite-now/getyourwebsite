/**
 * Real footage on the frame clock: the captured clips (capture.mjs), the
 * cursor drawn from their logs, and the thin dark device frames they sit in.
 *
 * Trims and speed changes live here and in the scenes, not in ffmpeg, so the
 * timings are in code (§5). A clip is played from `start` seconds at `rate`;
 * its log is read at the same clip time, so the cursor and the sounds stay on
 * the picture whatever the speed.
 */
import React from 'react';
import { Img, OffthreadVideo, useCurrentFrame } from 'remotion';
import { ACCENT, FPS, TOKENS } from './script.ts';
import { FONT, MONO, useFormat } from './kit.tsx';
import { URL_TEXT, type Box } from './sizes.ts';

import portalRequest from '../assets/footage/portal-request.webm';
import portalRequestLog from '../assets/footage/portal-request.json';
import portalSentence from '../assets/footage/portal-sentence.webm';
import portalSentenceLog from '../assets/footage/portal-sentence.json';
import portalSwitch from '../assets/footage/portal-switch.webm';
import portalSwitchLog from '../assets/footage/portal-switch.json';
import arkScroll from '../assets/footage/ark-phone-scroll.webm';
import arkScrollLog from '../assets/footage/ark-phone-scroll.json';

export type LogEvent = { t: number; type: 'move' | 'click' | 'key' | 'mark' | 'scroll'; x?: number; y?: number; ch?: string; label?: string; dy?: number };
export type ClipMeta = { name: string; width: number; height: number; duration: number; scale: number; log: LogEvent[] };

export const CLIPS = {
  'portal-request': { src: portalRequest, meta: portalRequestLog as ClipMeta },
  'portal-sentence': { src: portalSentence, meta: portalSentenceLog as ClipMeta },
  'portal-switch': { src: portalSwitch, meta: portalSwitchLog as ClipMeta },
  'ark-phone-scroll': { src: arkScroll, meta: arkScrollLog as ClipMeta },
};
export type ClipName = keyof typeof CLIPS;

/** A clip's mark (`c.mark()` in capture.mjs), in clip seconds. */
export const mark = (name: ClipName, label: string) => {
  const e = CLIPS[name].meta.log.find((x) => x.type === 'mark' && x.label === label);
  if (!e) throw new Error(`${name} has no mark "${label}"`);
  return e.t;
};

/** Events of a kind between two clip times, as seconds after `start` at `rate`. */
export const eventsIn = (name: ClipName, type: LogEvent['type'], start: number, end: number, rate: number) =>
  CLIPS[name].meta.log.filter((e) => e.type === type && e.t >= start && e.t < end).map((e) => (e.t - start) / rate);

/** What part of the recording to show, in its CSS pixels. `w` sets the zoom;
 *  the height follows the box's aspect. */
export type View = { cx: number; cy: number; w: number };

function cursorAt(log: LogEvent[], t: number) {
  let last = log[0];
  for (const e of log) {
    if (e.t > t) break;
    if (e.type === 'move') last = e;
  }
  return { x: last.x ?? 0, y: last.y ?? 0 };
}

/** The pointer: a 28px arrow, white with a 1px dark edge (§5). */
export const Arrow: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <svg width={28} height={28} viewBox="0 0 28 28" style={{ position: 'absolute', left: x - 4, top: y - 2, transform: `scale(${scale})`, transformOrigin: '4px 2px', overflow: 'visible', filter: 'drop-shadow(0 1px 2px rgba(10,10,12,.35))' }}>
    <path d="M4 2 L4 24 L9.6 18.6 L13.2 26.4 L17 24.7 L13.4 17 L21 17 Z" fill="#fff" stroke={TOKENS.ink} strokeWidth={1} strokeLinejoin="round" />
  </svg>
);

/**
 * A recording, shown through `view` (which may change with clip time — a
 * pan or a push-in), filling `box`, with the cursor drawn from its log.
 */
export const Clip: React.FC<{
  name: ClipName;
  box: Box;
  start?: number;
  rate?: number;
  view?: (clipT: number) => View;
  cursor?: boolean;
  /** V2.1 §6: a 6-frame cursor trail and a ring on each click (160ms). */
  trail?: boolean;
}> = ({ name, box, start = 0, rate = 1, view, cursor = true, trail = false }) => {
  const frame = useCurrentFrame();
  const { src, meta } = CLIPS[name];
  const clipT = start + (frame / FPS) * rate;
  const v = view ? view(clipT) : { cx: meta.width / 2, cy: meta.height / 2, w: meta.width };
  const s = box.w / v.w; // output px per CSS px
  const vh = box.h / s;
  const left = v.cx - v.w / 2, top = v.cy - vh / 2;
  const c = cursorAt(meta.log, clipT);
  const lastClick = [...meta.log].reverse().find((e) => e.type === 'click' && e.t <= clipT);
  const since = lastClick ? clipT - lastClick.t : 9;
  const pulse = since < 0.12 ? 1 - 0.18 * Math.sin((since / 0.12) * Math.PI) : 1;
  return (
    <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, overflow: 'hidden', background: TOKENS.bg }}>
      <OffthreadVideo
        src={src}
        startFrom={Math.round(start * FPS)}
        playbackRate={rate}
        muted
        style={{ position: 'absolute', left: -left * s, top: -top * s, width: meta.width * s, height: meta.height * s, maxWidth: 'none' }}
      />
      {cursor && trail && [6, 5, 4, 3, 2, 1].map((k) => {
        const p = cursorAt(meta.log, clipT - (k / FPS) * rate);
        return <div key={k} style={{ opacity: 0.32 * (1 - k / 7) }}><Arrow x={(p.x - left) * s} y={(p.y - top) * s} /></div>;
      })}
      {cursor && trail && meta.log.filter((e) => e.type === 'click' && clipT >= e.t && clipT < e.t + 0.16 * rate).map((e) => {
        const p = (clipT - e.t) / (0.16 * rate);
        const r = 6 + 22 * p;
        return <div key={e.t} style={{ position: 'absolute', left: (e.x! - left) * s - r, top: (e.y! - top) * s - r, width: 2 * r, height: 2 * r, borderRadius: r, border: `1.5px solid ${ACCENT}`, opacity: 1 - p }} />;
      })}
      {cursor && <Arrow x={(c.x - left) * s} y={(c.y - top) * s} scale={pulse} />}
    </div>
  );
};

/** A still (screenshot) shown through a view, the same way. `size` is the
 *  image's CSS size (the files are 2×). */
export const Still: React.FC<{ src: string; size: [number, number]; box: Box; view: View }> = ({ src, size, box, view }) => {
  const s = box.w / view.w;
  const vh = box.h / s;
  const left = view.cx - view.w / 2, top = view.cy - vh / 2;
  return (
    <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, overflow: 'hidden', background: TOKENS.bg }}>
      <Img src={src} style={{ position: 'absolute', left: -left * s, top: -top * s, width: size[0] * s, height: size[1] * s, maxWidth: 'none' }} />
    </div>
  );
};

/* Device frames ------------------------------------------------------------ */

const FRAME_INK = '#16171a';

/** Thin, dark, no bezels: a 2px edge and a bar with the real URL in mono. */
export function browserLayout(box: Box, portrait: boolean) {
  const bar = Math.round(URL_TEXT[portrait ? 'portrait' : 'landscape'] * 2.1);
  return { bar, content: { x: box.x + 2, y: box.y + bar, w: box.w - 4, h: box.h - bar - 2 } as Box };
}

export const BrowserFrame: React.FC<{ box: Box; url: string; children: React.ReactNode }> = ({ box, url, children }) => {
  const { portrait } = useFormat();
  const { bar } = browserLayout(box, portrait);
  const size = URL_TEXT[portrait ? 'portrait' : 'landscape'];
  // A narrow frame drops the window dots so the whole URL fits.
  const narrow = box.w < url.length * size * 0.62 + bar * 2.4;
  return (
    <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: FRAME_INK, boxShadow: '0 2px 4px rgba(10,10,12,.08), 0 24px 60px rgba(10,10,12,.16)' }} />
      <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: bar, display: 'flex', alignItems: 'center', gap: 10, padding: `0 ${narrow ? 8 : bar * 0.4}px` }}>
        {!narrow && [0, 1, 2].map((i) => <span key={i} style={{ width: 12, height: 12, borderRadius: 6, background: '#3a3c42' }} />)}
        <div style={{ marginLeft: narrow ? 0 : bar * 0.3, flex: 1, justifyContent: narrow ? 'center' : 'flex-start', height: bar * 0.66, borderRadius: 8, background: '#25272c', display: 'flex', alignItems: 'center', padding: `0 ${bar * 0.3}px`, fontFamily: MONO, fontSize: size, color: '#d2d5db', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {url}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 2, top: bar, right: 2, bottom: 2, borderRadius: '0 0 10px 10px', overflow: 'hidden', background: TOKENS.bg }}>
        <div style={{ position: 'absolute', left: -(box.x + 2), top: -(box.y + bar), width: 4000, height: 4000 }}>{children}</div>
      </div>
    </div>
  );
};

/** A phone: thin dark edge, no notch art, the URL in a bar at the top. */
export function phoneLayout(box: Box, portrait: boolean) {
  const edge = 10;
  const bar = Math.round(URL_TEXT[portrait ? 'portrait' : 'landscape'] * 2.1);
  return { edge, bar, content: { x: box.x + edge, y: box.y + edge + bar, w: box.w - 2 * edge, h: box.h - 2 * edge - bar } as Box };
}

export const PhoneFrame: React.FC<{ box: Box; url: string; children: React.ReactNode }> = ({ box, url, children }) => {
  const { portrait } = useFormat();
  const { edge, bar } = phoneLayout(box, portrait);
  const size = URL_TEXT[portrait ? 'portrait' : 'landscape'];
  return (
    <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 54, background: FRAME_INK, boxShadow: '0 2px 4px rgba(10,10,12,.08), 0 24px 60px rgba(10,10,12,.18)' }} />
      <div style={{ position: 'absolute', left: edge, top: edge, right: edge, height: bar, borderRadius: '44px 44px 0 0', background: '#1f2125', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: size, color: '#d2d5db' }}>
        {url}
      </div>
      <div style={{ position: 'absolute', left: edge, top: edge + bar, right: edge, bottom: edge, borderRadius: '0 0 44px 44px', overflow: 'hidden', background: TOKENS.bg }}>
        <div style={{ position: 'absolute', left: -(box.x + edge), top: -(box.y + edge + bar), width: 4000, height: 4000 }}>{children}</div>
      </div>
    </div>
  );
};

export { FONT };
