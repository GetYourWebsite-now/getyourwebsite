/**
 * The ads' own scenes, V2.1: the receipt, the "all we need" card and the
 * fast assembly, on the dark stage. (The request box is in Portal.tsx; the
 * end card in Type.tsx.)
 */
import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { ANDYS_CARD, COPY, FPS, RECEIPTS, TOKENS } from '../script.ts';
import { DemoLabel, FONT, MONO, clamp, ramp, typedChars, useFormat } from '../kit.tsx';
import { TEXT } from '../sizes.ts';
import { CHROME, Device3D, GlassBrowser, barHeight } from '../motion/Device3D.tsx';
import { ON_STAGE, STAGE, springAt } from '../motion/Stage.tsx';
import { AssembleDepth, SITES, assembleSfx, depthLanded, overviewBox } from './Sites.tsx';
import type { Scene, Sfx } from './types.ts';

/* Ad_Receipt -------------------------------------------------------------
   A thermal receipt prints line by line out of a slot on the dark stage,
   is torn off and falls away, and a second prints. The paper is the
   stage's off-white, never pure white. The agency range is the sourced one
   in site.js; nothing else on either receipt is a number. The rule sits
   under the paper's torn edge and follows it down as it feeds. */

const R = {
  one: { head: 0.2, lines: [0.6, 1.0] },
  rip: 2.6,
  two: { head: 2.9, lines: [3.3, 3.7, 4.1] },
  lineH: 70,
  w: 960,
  slotH: 34,
};
const PAPER = ON_STAGE;

/** How far the paper has fed at `t`. */
const fedAt = (times: { head: number; lines: number[] }, t: number) =>
  [times.head, ...times.lines].reduce((h, at, i) => h + ramp(t, at, 0.18) * (i === 0 ? 150 : R.lineH + (i === 1 ? 40 : 0)), 60);

/** The paper's top (under the slot): the slot and the longer receipt, fully
 *  fed, centred vertically in the frame. */
const paperTop = (H: number) => {
  const fed = Math.max(fedAt(R.one, 1e6), fedAt(R.two, 1e6));
  return Math.round((H - R.slotH - fed) / 2) + R.slotH;
};

const Receipt: React.FC<{ head: string; lines: string[]; times: { head: number; lines: number[] }; t: number; x: number; y: number; w: number }> = ({ head, lines, times, t, x, y, w }) => {
  const { format } = useFormat();
  const size = TEXT['receipt: lines'][format];
  const rows = [{ text: head, at: times.head, head: true }, ...lines.map((l, i) => ({ text: l, at: times.lines[i], head: false }))];
  const shown = rows.filter((r) => t >= r.at);
  const fed = fedAt(times, t);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: fed, background: PAPER, boxShadow: '0 60px 120px rgba(0,0,0,.55)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 48, right: 48, top: 56, fontFamily: MONO, fontSize: size, lineHeight: `${R.lineH}px`, color: TOKENS.ink, letterSpacing: '-0.01em' }}>
        {shown.map((r, i) => {
          // Each line lands like the type: blur and rise, on the spring.
          const p = Math.min(1, ramp(t, r.at, 0.22));
          return (
            <div key={i} style={{ fontWeight: r.head ? 700 : 500, marginBottom: i === 0 ? 40 : 0, borderBottom: i === 0 ? `3px dashed ${TOKENS.inkMuted}` : 'none', paddingBottom: i === 0 ? 24 : 0, opacity: p, filter: p < 0.99 ? `blur(${6 * (1 - p)}px)` : undefined, transform: `translateY(${10 * (1 - p)}px)` }}>
              {r.text}
            </div>
          );
        })}
      </div>
      {/* The torn edge, cut out of the stage */}
      <svg width={w} height={22} style={{ position: 'absolute', left: 0, bottom: -1 }} viewBox={`0 0 ${w} 22`} preserveAspectRatio="none">
        <path d={`M0 22 ${Array.from({ length: Math.ceil(w / 24) + 1 }, (_, i) => `L${i * 24} ${i % 2 ? 6 : 16}`).join(' ')} L${w} 22 Z`} fill={STAGE} />
      </svg>
    </div>
  );
};

export const ReceiptScene: Scene = {
  View: ({ dur }) => {
    const frame = useCurrentFrame();
    const t = frame / FPS;
    const { F } = useFormat();
    const x = (F.W - R.w) / 2;
    const y = paperTop(F.H);
    const ripP = interpolate(t, [R.rip, R.rip + 0.45], [0, 1], { ...clamp, easing: (v) => v * v });
    const push = interpolate(t, [R.two.head, dur], [1, 1.05], clamp);
    // The slot enters from depth like a device.
    return (
      <>
        <Device3D box={{ x: x - 40, y: y - R.slotH, w: R.w + 80, h: R.slotH }} enter={{ at: 0, fromRotY: 10, drift: 0.3 }} radius={10}>
          <div style={{ position: 'absolute', inset: 0, background: CHROME }} />
        </Device3D>
        {t < R.rip + 0.45 && (
          <div style={{ position: 'absolute', inset: 0, transform: `translateY(${ripP * 1500}px) rotate(${ripP * -9}deg)`, transformOrigin: '50% 30%', filter: ripP > 0.02 ? `blur(${ripP * 6}px)` : undefined }}>
            <Receipt head={RECEIPTS.agency.head} lines={RECEIPTS.agency.lines} times={R.one} t={t} x={x} y={y} w={R.w} />
          </div>
        )}
        {t >= R.two.head - 0.05 && (
          <div style={{ position: 'absolute', inset: 0, transform: `scale(${push})`, transformOrigin: '50% 30%' }}>
            <Receipt head={RECEIPTS.ours.head} lines={RECEIPTS.ours.lines} times={R.two} t={t} x={x} y={y} w={R.w} />
          </div>
        )}
      </>
    );
  },
  // Under the paper's torn edge, following it as it feeds.
  rule: (t, _b, _d, f) => {
    const x = (f.W - R.w) / 2;
    const y = paperTop(f.H);
    const second = t >= R.rip;
    const fed = second ? fedAt(R.two, t) : fedAt(R.one, t);
    if (second && t < R.two.head) return { x, y: y + 40, w: R.w };
    return { x, y: y + fed + 24, w: R.w };
  },
  ruleLead: 0,
  sfx: () => [
    ...[R.one.head, ...R.one.lines, R.two.head, ...R.two.lines].map((t): Sfx => ({ t, kind: 'printer', gain: 0.8 })),
    { t: R.rip, kind: 'rip' },
  ],
};

/* Ad_AllWeNeed ----------------------------------------------------------
   A dark-glass card in 3D types itself: only what andysauto.org shows.
   Then the site assembles from depth from its own sections, faster than
   the film's. */

const CARD = { from: 0.35, cps: 42, rowGap: 0.12, w: 940, y: 640 };
const LABEL_ON_STAGE = '#8b909a';

function rowTimes() {
  let t = CARD.from;
  return ANDYS_CARD.map((r) => {
    const at = t;
    t += r.value.length / CARD.cps + CARD.rowGap;
    return at;
  });
}

/** The card's height: padding, three label + value rows. */
function cardHeight(format: 'landscape' | 'portrait') {
  const lab = TEXT['all-we-need card: labels'][format], val = TEXT['all-we-need card: values'][format];
  // "Services" wraps to two lines at 940px.
  return 96 + 3 * (lab * 1.2 + 6 + val * 1.2) + val * 1.2 + 2 * 34;
}

export const AllWeNeed: Scene = {
  View: () => {
    const frame = useCurrentFrame();
    const t = frame / FPS;
    const { F, format } = useFormat();
    const times = rowTimes();
    const box = { x: (F.W - CARD.w) / 2, y: CARD.y, w: CARD.w, h: cardHeight(format) };
    return (
      <Device3D box={box} enter={{ at: 0, fromRotY: 14, phase: 0.8 }} radius={16}>
        <div style={{ position: 'absolute', inset: 0, padding: '48px 52px', fontFamily: FONT, background: CHROME, border: '1px solid rgba(246,247,249,0.08)', borderRadius: 16 }}>
          {ANDYS_CARD.map((r, i) => {
            const v = typedChars(r.value, t, times[i], CARD.cps);
            const on = springAt(frame, times[i] - 0.15);
            return (
              <div key={r.label} style={{ marginTop: i ? 34 : 0, opacity: Math.min(1, on * 1.5) }}>
                <div style={{ fontSize: TEXT['all-we-need card: labels'][format], fontWeight: 500, color: LABEL_ON_STAGE }}>{r.label}</div>
                <div style={{ marginTop: 6, fontSize: TEXT['all-we-need card: values'][format], fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.2, color: ON_STAGE, minHeight: '1.2em' }}>{v}</div>
              </div>
            );
          })}
        </div>
      </Device3D>
    );
  },
  Overlay: () => <DemoLabel text={COPY.demoBusiness} />,
  sfx: () => {
    const times = rowTimes();
    const out: Sfx[] = [];
    ANDYS_CARD.forEach((r, i) => { for (let c = 0; c < r.value.length; c += 2) out.push({ t: times[i] + c / CARD.cps, kind: 'key', gain: 0.8 }); });
    return out;
  },
  label: 'Demo business',
};

/** The same assembly from depth as the film's, the whole page in frame,
 *  a section every 150ms. */
const FAST = { from: 0.3, step: 0.15 };

export const AssembleFast: Scene = {
  View: ({ dur }) => {
    const { F, portrait } = useFormat();
    const box = overviewBox(SITES.andys, F.stage, barHeight(portrait));
    return (
      <GlassBrowser
        box={box}
        url={SITES.andys.url}
        enter={{ at: 0, fromRotY: -14, phase: 1.1, sweepAt: FAST.from + depthLanded(SITES.andys, FAST.step) }}
        content={(w, h) => <AssembleDepth site={SITES.andys} w={w} h={h} from={FAST.from} step={FAST.step} end={dur} mode="overview" />}
      />
    );
  },
  Overlay: () => <DemoLabel text={COPY.demoBusiness} />,
  sfx: () => assembleSfx(SITES.andys, FAST.from, FAST.step),
  label: 'Demo business',
  whipIn: true,
};
