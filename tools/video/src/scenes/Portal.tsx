/**
 * The client portal, recorded from /demo — the real portal running on the
 * sample Rosa's Bakery account, labelled "Demo account". The URL bar says
 * getyourwebsite.now/demo because that is what was recorded.
 *
 * 16:9 shows the whole window and pushes in. 9:16 is re-framed, not cropped:
 * the view pans to whatever is happening — the headline being clicked, the
 * note being typed, the confirmation — at a scale where the portal's own
 * text is as large as the frame allows.
 */
import React from 'react';
import { Easing, Img, Sequence, interpolate, useCurrentFrame } from 'remotion';
import { COPY, FPS, TOKENS } from '../script.ts';
import { DemoLabel, clamp, ease, useFormat, useSeconds } from '../kit.tsx';
import { BrowserFrame, CLIPS, Clip, Still, browserLayout, eventsIn, mark, type ClipName, type View } from '../footage.tsx';
import { FORMATS, fit, type Box } from '../sizes.ts';
import { GlassBrowser, barHeight } from '../motion/Device3D.tsx';
import { Ring } from '../motion/Fx.tsx';
import { blend, focus, focusBox, pushIn, springAt } from '../motion/Stage.tsx';
import type { Scene, Sfx } from './types.ts';
import treeV3 from '../../assets/footage/portal-stills/tree-v3-live.png';
import treeV2 from '../../assets/footage/portal-stills/tree-v2-live.png';
import previewV3 from '../../assets/footage/portal-stills/preview-v3.png';
import previewV2 from '../../assets/footage/portal-stills/preview-v2.png';

const URL = 'getyourwebsite.now/demo';
const W = 1440, H = 838; // the recordings' CSS size

/** The browser frame that holds a whole recording in the stage. */
function frameBox(stage: Box, portrait: boolean): Box {
  if (portrait) return { ...stage };
  const bar = browserLayout(stage, false).bar;
  const f = fit(W, H, { x: stage.x, y: stage.y + bar, w: stage.w, h: stage.h - bar });
  return { x: f.x - 2, y: stage.y + (stage.h - f.h - bar) / 2, w: f.w + 4, h: f.h + bar + 2 };
}

/** Eased moves between views at clip times: [[t, view], …]. */
function path(keys: [number, View][]) {
  return (t: number): View => {
    const at = (k: keyof View) => interpolate(t, keys.map((p) => p[0]), keys.map((p) => p[1][k]), { ...clamp, easing: ease });
    return { cx: at('cx'), cy: at('cy'), w: at('w') };
  };
}
const whole = (push = 1): View => ({ cx: W / 2, cy: H / 2, w: W / push });

/** Clip sounds (clicks, keys) between clip times, in beat time. */
function clipSfx(name: ClipName, start: number, end: number, rate: number, offset = 0): Sfx[] {
  return [
    ...eventsIn(name, 'click', start, end, rate).map((t): Sfx => ({ t: t + offset, kind: 'click' })),
    ...eventsIn(name, 'key', start, end, rate).map((t): Sfx => ({ t: t + offset, kind: 'key' })),
  ];
}

/* V2.1: the portal on the stage --------------------------------------------
   The recordings sit in a dark-glass browser in 3D; the camera does the
   zooming (16:9). 9:16 keeps its re-framing views inside the frame, since a
   1440px recording is too small to read whole at 1000px across. */

/** Map a point of a recording (CSS px) through a view into the screen,
 *  for a recording filling a GlassBrowser at `box`. */
function onScreen(box: Box, portrait: boolean, v: View, X: number, Y: number) {
  const bar = barHeight(portrait);
  const cw = box.w - 2, ch = box.h - bar - 1;
  const s = cw / v.w, vh = ch / s;
  return { x: box.x + 1 + (X - (v.cx - v.w / 2)) * s, y: box.y + bar + (Y - (v.cy - vh / 2)) * s, s };
}
/** The same, in the browser's content coordinates (0,0 its top-left). */
function inContent(box: Box, portrait: boolean, v: View, X: number, Y: number) {
  const p = onScreen(box, portrait, v, X, Y);
  return { x: p.x - box.x - 1, y: p.y - box.y - barHeight(portrait), s: p.s };
}

/* Change ------------------------------------------------------------------
   §6: the camera dives 1.8× into the real request box as the note types,
   follows it as the panel scrolls to Send, and pulls back on Send. The
   cursor has a 6-frame trail and a ring on each click. When the portal
   says the request was sent, that line pops (0.9 → 1); then, as the person
   caption reads, the camera dives 1.6× onto "Versions in review —
   Version 5 · In review", the chip gets the ring pulse, and the camera
   pulls back before the cut. (The recording has no "approved" state — the
   sandbox, like the portal, leaves a request in review — so the ring is on
   "In review".) */

const CHANGE = { start: 1.0, end: 9.1 };
/** Where things are in portal-request (CSS px, clip seconds), read off its
 *  frames. */
const REQ = {
  typing: { x: 1230, y: 601 }, // the note's box while it types
  toSend: { x: 1230, y: 560 }, // the box and Send, after the 193px scroll
  scroll: 5.267,
  typed: 4.77, // last key
  shown: 7.52, // the portal page with "Your change request was sent" is up
  banner: { x: 268, y: 63, w: 976, h: 62 },
  pageBg: '#f5f7f9',
  chip: { x: 442, y: 617, w: 84, h: 26 }, // "In review", Version 5
  review: { x: 276, y: 530, w: 960, h: 174 }, // the "Versions in review" card
};
/** Beat seconds, after the sent line pops: the dive onto the review card,
 *  the chip's ring, the pull-back. */
const REVIEW = { dive: 0.22, ring: 0.62, back: 0.95 };
const changeRate = (dur: number) => (CHANGE.end - CHANGE.start) / dur;
/** Beat seconds of a clip time. */
const atBeat = (clipT: number, dur: number) => (clipT - CHANGE.start) / changeRate(dur);

const changeView = (portrait: boolean) => {
  if (!portrait) return () => whole();
  const picked = mark('portal-request', 'picked'), sent = mark('portal-request', 'sent');
  return path([
    [CHANGE.start, { cx: 300, cy: 380, w: 640 }],
    [picked + 0.4, { cx: 300, cy: 380, w: 640 }],
    [picked + 1.0, { cx: 1180, cy: 470, w: 560 }],
    [sent + 0.5, { cx: 1180, cy: 470, w: 560 }],
    [sent + 1.0, { cx: 700, cy: 440, w: 900 }],
  ]);
};

export const Change: Scene = {
  View: ({ dur }) => {
    const frame = useCurrentFrame();
    const { portrait, F } = useFormat();
    const rate = changeRate(dur);
    const box = frameBox(F.stage, portrait);
    const view = changeView(portrait);
    const clipT = CHANGE.start + (frame / FPS) * rate;
    const shownAt = atBeat(REQ.shown, dur);
    const chipAt = shownAt + REVIEW.ring;
    return (
      <GlassBrowser
        box={box}
        url={URL}
        enter={{ at: 0, fromRotY: 12, phase: 2.1, drift: 0.6 }}
        content={(cw, ch) => {
          const v = view(clipT);
          const b = inContent(box, portrait, v, REQ.banner.x, REQ.banner.y);
          const pop = springAt(frame, shownAt);
          const chip = inContent(box, portrait, v, REQ.chip.x, REQ.chip.y);
          return (
            <>
              <Clip name="portal-request" box={{ x: 0, y: 0, w: cw, h: ch }} start={CHANGE.start} rate={rate} view={view} trail />
              {/* The sent line pops: the same pixels, 0.9 → 1 on the spring. */}
              {frame >= Math.round(shownAt * FPS) && pop < 0.995 && (
                <div style={{ position: 'absolute', left: b.x, top: b.y, width: REQ.banner.w * b.s, height: REQ.banner.h * b.s, background: REQ.pageBg }}>
                  <div style={{ position: 'absolute', inset: 0, transform: `scale(${0.9 + 0.1 * pop})`, opacity: Math.min(1, pop * 1.4) }}>
                    <Clip
                      name="portal-request"
                      box={{ x: 0, y: 0, w: REQ.banner.w * b.s, h: REQ.banner.h * b.s }}
                      start={CHANGE.start}
                      rate={rate}
                      cursor={false}
                      view={() => ({ cx: REQ.banner.x + REQ.banner.w / 2, cy: REQ.banner.y + REQ.banner.h / 2, w: REQ.banner.w })}
                    />
                  </div>
                </div>
              )}
              <Ring x={chip.x} y={chip.y} w={REQ.chip.w * chip.s} h={REQ.chip.h * chip.s} at={chipAt} dur={0.4} radius={6} grow={0.6} />
            </>
          );
        }}
      />
    );
  },
  Overlay: () => <DemoLabel text={COPY.demoAccount} />,
  camera: (t, dur, f) => {
    const rest = pushIn(t, dur, f.W, f.H, 1.04);
    if (f.portrait) return rest;
    const frame = Math.round(t * FPS);
    const F = FORMATS.landscape;
    const box = frameBox(F.stage, false);
    const typeAt = atBeat(3.0, dur) - 0.15; // the click into the box
    const sendAt = atBeat(mark('portal-request', 'sent'), dur);
    const scrolled = interpolate(t, [atBeat(REQ.scroll, dur), atBeat(REQ.scroll, dur) + 0.4], [0, 1], { ...clamp, easing: ease });
    const target = {
      x: REQ.typing.x + (REQ.toSend.x - REQ.typing.x) * scrolled,
      y: REQ.typing.y + (REQ.toSend.y - REQ.typing.y) * scrolled,
    };
    const p0 = onScreen(box, false, whole(), target.x, target.y);
    const dive = focus(f.W, f.H, p0.x, p0.y, 1.8);
    const p = springAt(frame, typeAt) * (1 - springAt(frame, sendAt - 0.05));
    // The person beat: onto the review card, so the chip and its ring read.
    const shownAt = atBeat(REQ.shown, dur);
    const r0 = onScreen(box, false, whole(), REQ.review.x + REQ.review.w / 2, REQ.review.y + REQ.review.h / 2);
    const review = focus(f.W, f.H, r0.x, r0.y, 1.6);
    const q = springAt(frame, shownAt + REVIEW.dive) * (1 - springAt(frame, shownAt + REVIEW.back));
    return blend(blend(rest, dive, p), review, q);
  },
  sfx: (_, dur) => {
    const rate = changeRate(dur);
    return [...clipSfx('portal-request', CHANGE.start, CHANGE.end, rate), { t: (mark('portal-request', 'sent') - CHANGE.start) / rate + 0.25, kind: 'pop' }];
  },
  label: 'Demo account',
  whipIn: true,
};

/* Switch ------------------------------------------------------------------
   The click on "Host this version" (the camera pushes in on it), then a
   split screen: the version tree (left / top) and the preview (right /
   bottom), entering from depth from opposite sides. The tree draws in left
   to right, connectors and all; then the Live pill — its own pixels, cut
   from the still — moves from Version 3 to Version 2 along the connector,
   with a ring as it arrives. The preview switches palette with its 1.04×
   push. Both frames stay whole, the tree's title and the whole preview in
   them: the camera pushes in on the pair, not past it. The four stills are
   the sandbox's own screens. */

const SWITCH = { start: 0.2 };
/** "Hosted version" and its four rows in portal-switch, names to buttons
 *  (CSS px). */
const HOSTED_LIST = { x: 290, y: 116, w: 942, h: 498 };
/** The Live pill in the stills (CSS px of a 1440px screen). */
export const PILL = {
  v3: { x: 763, y: 381.5, w: 40, h: 18 },
  v2: { x: 568, y: 435.5, w: 39, h: 18 },
  cardBg: '#eff0fc', // the live card's tint, under the pill
};
/** The tree's view: the "Version tree" title and the five versions. */
const TREE_VIEW: View = { cx: 701, cy: 398, w: 870 };
/** The preview, whole: the still is 1019 × 730 and the frame its shape. */
const PREVIEW = { w: 1019, h: 730 };
const PREVIEW_VIEW: View = { cx: PREVIEW.w / 2, cy: PREVIEW.h / 2, w: PREVIEW.w };

/** The path the pill takes: out of Version 3's left edge, down the
 *  connector into Version 2, to its place (CSS px; pill centres). */
const pillPath = (u: number) => {
  const P = [
    [PILL.v3.x + PILL.v3.w / 2, PILL.v3.y + PILL.v3.h / 2],
    [740, 352],
    [735, 452],
    [PILL.v2.x + PILL.v2.w / 2, PILL.v2.y + PILL.v2.h / 2],
  ];
  const k = 1 - u;
  const c = [k * k * k, 3 * k * k * u, 3 * k * u * u, u * u * u];
  return { x: c.reduce((s, w, i) => s + w * P[i][0], 0), y: c.reduce((s, w, i) => s + w * P[i][1], 0) };
};

function switchTimes() {
  const clickAt = mark('portal-switch', 'switched') - SWITCH.start;
  const splitAt = clickAt + 0.25;
  const drawn = splitAt + 0.5; // the tree has drawn in
  const moveAt = drawn + 0.05, arrive = moveAt + 0.5;
  const swapAt = arrive + 0.15; // the preview switches palette
  return { clickAt, splitAt, drawn, moveAt, arrive, swapAt };
}

/** Two frames, side by side (16:9) or stacked (9:16), each shaped to
 *  hold the preview still whole. */
function splitBoxes(stage: Box, portrait: boolean) {
  const gap = 28, bar = barHeight(portrait);
  const shaped = (w: number) => ((w - 2) * PREVIEW.h) / PREVIEW.w + bar + 1;
  let w = portrait ? stage.w : (stage.w - gap) / 2;
  if (portrait && 2 * shaped(w) + gap > stage.h) w = (((stage.h - gap) / 2 - bar - 1) * PREVIEW.w) / PREVIEW.h + 2;
  const h = shaped(w);
  const left = portrait ? stage.x + (stage.w - w) / 2 : stage.x;
  const top = portrait ? stage.y + (stage.h - 2 * h - gap) / 2 : stage.y + (stage.h - h) / 2;
  const a: Box = { x: left, y: top, w, h };
  const b: Box = portrait ? { x: left, y: top + h + gap, w, h } : { x: left + w + gap, y: top, w, h };
  return { a, b };
}

/** A crop of a still: the region `r` (CSS px of a 1440px screen) at `k`
 *  output px per CSS px, its top-left at (x, y). */
const Crop: React.FC<{ src: string; r: { x: number; y: number; w: number; h: number }; k: number; x: number; y: number; style?: React.CSSProperties }> = ({ src, r, k, x, y, style }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: r.w * k, height: r.h * k, overflow: 'hidden', borderRadius: (r.h * k) / 2, ...style }}>
    <Img src={src} style={{ position: 'absolute', left: -r.x * k, top: -r.y * k, width: 1440 * k, height: 839 * k, maxWidth: 'none' }} />
  </div>
);

export const Switch: Scene = {
  View: ({ dur }) => {
    const frame = useCurrentFrame();
    const t = frame / FPS;
    const { portrait, F } = useFormat();
    const T = switchTimes();
    const stage = F.stage;
    if (t < T.splitAt) {
      const box = frameBox(stage, portrait);
      const view = portrait
        ? path([[SWITCH.start, { cx: 800, cy: 430, w: 1040 }], [T.clickAt + SWITCH.start, { cx: 860, cy: 440, w: 920 }]])
        : () => whole();
      return (
        <GlassBrowser
          box={box}
          url={URL}
          enter={{ at: 0, fromRotY: 8, phase: 0.7, drift: 0.6 }}
          content={(cw, ch) => <Clip name="portal-switch" box={{ x: 0, y: 0, w: cw, h: ch }} start={SWITCH.start} view={view} trail />}
        />
      );
    }
    const { a, b } = splitBoxes(stage, portrait);
    const draw = interpolate(t, [T.splitAt + 0.1, T.drawn], [0, 1], { ...clamp, easing: ease });
    const after = t >= T.arrive;
    const pushPreview = interpolate(t, [T.swapAt, T.swapAt + 0.9], [1, 1.04], { ...clamp, easing: ease });
    const u = interpolate(t, [T.moveAt, T.arrive], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    const moving = t >= T.moveAt && t < T.arrive;
    return (
      <>
        <GlassBrowser
          box={a}
          url={URL}
          enter={{ at: T.splitAt, fromRotY: 14, restRotY: 2, phase: 0 }}
          content={(cw, ch) => {
            const at = (X: number, Y: number) => inContent(a, portrait, TREE_VIEW, X, Y);
            const p3 = at(PILL.v3.x, PILL.v3.y), p2 = at(PILL.v2.x, PILL.v2.y);
            const c = at(pillPath(u).x, pillPath(u).y);
            const k = p3.s;
            return (
              <>
                {/* The tree draws in, left to right. */}
                <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${(1 - draw) * 100}% 0 0)` }}>
                  <Still src={after ? treeV2 : treeV3} size={[1440, 839]} box={{ x: 0, y: 0, w: cw, h: ch }} view={TREE_VIEW} />
                </div>
                {/* While it moves, the pill's place on Version 3 is the card's tint. */}
                {moving && <div style={{ position: 'absolute', left: p3.x - 2, top: p3.y - 2, width: PILL.v3.w * k + 4, height: PILL.v3.h * k + 4, background: PILL.cardBg }} />}
                {moving && <Crop src={treeV3} r={PILL.v3} k={k} x={c.x - (PILL.v3.w * k) / 2} y={c.y - (PILL.v3.h * k) / 2} style={{ boxShadow: '0 6px 16px rgba(47,61,214,.35)' }} />}
                <Ring x={p2.x + (PILL.v2.w * k) / 2} y={p2.y + (PILL.v2.h * k) / 2} w={PILL.v2.w * k} h={PILL.v2.h * k} at={T.arrive} dur={0.4} radius={(PILL.v2.h * k) / 2} grow={0.8} />
              </>
            );
          }}
        />
        <GlassBrowser
          box={b}
          url={URL}
          enter={{ at: T.splitAt + 0.1, fromRotY: -14, restRotY: -2, phase: Math.PI }}
          content={(cw, ch) => (
            <Still
              src={t >= T.swapAt ? previewV2 : previewV3}
              size={[1019, 730]}
              box={{ x: 0, y: 0, w: cw, h: ch }}
              view={{ cx: PREVIEW_VIEW.cx, cy: PREVIEW_VIEW.cy, w: PREVIEW_VIEW.w / pushPreview }}
            />
          )}
        />
      </>
    );
  },
  Overlay: () => <DemoLabel text={COPY.demoAccount} />,
  // Push in on "Host this version" up to the click; then dive into the Live
  // pill as it moves, and pull back for the preview's change.
  camera: (t, dur, f) => {
    const rest = pushIn(t, dur, f.W, f.H, 1.04);
    if (f.portrait) return rest;
    const frame = Math.round(t * FPS);
    const T = switchTimes();
    const stage = FORMATS.landscape.stage;
    if (t < T.splitAt) {
      // Push in on the "Hosted version" list — every version's name and its
      // button inside the frame — rather than on the button alone.
      const box = frameBox(stage, false);
      const a = onScreen(box, false, whole(), HOSTED_LIST.x, HOSTED_LIST.y);
      const b = onScreen(box, false, whole(), HOSTED_LIST.x + HOSTED_LIST.w, HOSTED_LIST.y + HOSTED_LIST.h);
      return blend(rest, focusBox(f.W, f.H, { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y }, 1.35, 64), springAt(frame, 0.3));
    }
    // Both frames stay whole: as the pill moves, the camera pushes in on
    // the pair only as far as keeps them both in frame.
    const { a, b } = splitBoxes(stage, false);
    const pair = { x: a.x, y: a.y, w: b.x + b.w - a.x, h: a.h };
    const p = springAt(frame, T.drawn - 0.25);
    return blend(rest, focusBox(f.W, f.H, pair, 1.1, 40), p);
  },
  sfx: () => {
    const clickAt = mark('portal-switch', 'switched') - SWITCH.start;
    return [...clipSfx('portal-switch', SWITCH.start, 99, 1), { t: clickAt + 0.25, kind: 'whoosh', gain: 0.6 }, { t: clickAt + 0.6, kind: 'pop', gain: 0.6 }];
  },
  label: 'Demo account',
};

/* Ad_OneSentence ------------------------------------------------------------
   Only the request box, large. The sentence is typed and sent; then a cut —
   a visible time jump — to the portal saying it was sent, with the version
   in review: "we build it, then approve it". The sandbox cannot show the
   changed site, and the ad doesn't pretend it can. */

export const OneSentence: Scene = {
  View: ({ dur }) => {
    const frame = useCurrentFrame();
    const t = frame / FPS;
    const { F } = useFormat();
    const firstKey = CLIPS['portal-sentence'].meta.log.find((e) => e.type === 'key')!.t;
    const start = firstKey - 0.35;
    const sent = mark('portal-sentence', 'sent'), success = mark('portal-sentence', 'success');
    const rate = 1.15;
    const cutAt = (sent + 0.3 - start) / rate;
    const stage = F.stage;
    const box: Box = { x: stage.x, y: stage.y + 40, w: stage.w, h: stage.h - 80 };
    if (t < cutAt) {
      // The sidebar's "whole website" box, then down to the Send button.
      const view = path([[start, { cx: 1225, cy: 240, w: 470 }], [sent - 1.1, { cx: 1225, cy: 240, w: 470 }], [sent - 0.4, { cx: 1225, cy: 560, w: 470 }]]);
      return (
        <GlassBrowser
          box={box}
          url={URL}
          enter={{ at: 0, fromRotY: 14, phase: 0.3 }}
          content={(cw, ch) => <Clip name="portal-sentence" box={{ x: 0, y: 0, w: cw, h: ch }} start={start} rate={rate} view={view} trail />}
        />
      );
    }
    // The jump: a fresh frame enters from depth on the confirmation, the
    // request in review.
    const after = success + 0.2;
    const view = path([[after, { cx: 690, cy: 440, w: 900 }], [after + (dur - cutAt), { cx: 700, cy: 440, w: 840 }]]);
    return (
      <GlassBrowser
        box={box}
        url={URL}
        enter={{ at: cutAt, fromRotY: -14, phase: 1.9 }}
        content={(cw, ch) => (
          <Sequence from={Math.round(cutAt * FPS)} layout="none">
            <Clip name="portal-sentence" box={{ x: 0, y: 0, w: cw, h: ch }} start={after} view={view} />
          </Sequence>
        )}
      />
    );
  },
  Overlay: () => <DemoLabel text={COPY.demoAccount} />,
  sfx: () => {
    const firstKey = CLIPS['portal-sentence'].meta.log.find((e) => e.type === 'key')!.t;
    const start = firstKey - 0.35, rate = 1.15;
    const sent = mark('portal-sentence', 'sent');
    return [...clipSfx('portal-sentence', start, sent + 0.3, rate), { t: (sent - start) / rate + 0.1, kind: 'pop' }, { t: (sent + 0.3 - start) / rate, kind: 'whoosh', gain: 0.5 }];
  },
  label: 'Demo account',
};
