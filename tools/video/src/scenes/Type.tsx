/**
 * The scenes that are only type: the hook, the film's offer and the ads'
 * end card.
 */
import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { ACCENT, COPY, CTA, FPS, OFFER, OFFER_SHORT, type Beat } from '../script.ts';
import { BlurType, EXIT_FRAMES, exitProgress, exitStyle, landedWidth, measure, wordOpacityPasses, wrap } from '../motion/Type.tsx';
import { FORMATS } from '../sizes.ts';
import { FONT, clamp } from '../kit.tsx';
import { Mark } from '../drawings/Mark.tsx';
import { TEXT } from '../sizes.ts';
import type { Fmt, Scene, Sfx } from './types.ts';
import { ON_STAGE, pushIn, springAt } from '../motion/Stage.tsx';
import { Ring } from '../motion/Fx.tsx';
import { PILL } from './Portal.tsx';
import treeV2 from '../../assets/footage/portal-stills/tree-v2-live.png';

/* Hook ---------------------------------------------------------------------
   Three cards on the dark stage, centred, words blurring in. Each card
   exits with blur and a 1.04 scale over 6 frames as the next enters, so it
   reads as one continuous thought. The rule sits under the card speaking.

   The hand-over (Jack, 18 October): the outgoing card is under 20% opacity
   before the incoming card's first word passes 50%, so the two never read
   as one ("YoYou"). The exit starts EXIT_LEAD frames early to make that so;
   the module refuses to load if it isn't. */

const EXIT_LEAD = 3;
{
  const passes = wordOpacityPasses(0.5);
  const outgoing = 1 - exitProgress(passes, 0, EXIT_LEAD);
  if (outgoing >= 0.2) throw new Error(`Hook hand-over: the outgoing card is at ${(outgoing * 100).toFixed(0)}% when the next word passes 50%`);
}

const hookLayout = (text: string, f: Fmt) => {
  const size = f.portrait ? FORMATS.portrait.hook : FORMATS.landscape.hook;
  const maxW = f.portrait ? 940 : 1600;
  const lines = wrap(text, size, maxW);
  const lh = size * 1.06;
  const w = Math.max(...lines.map((l) => measure(l, size)));
  return { size, maxW, h: lines.length * lh, w };
};

export const Hook: Scene = {
  View: ({ beat }) => {
    const frame = useCurrentFrame();
    const { width: W, height: H } = useVideoConfig();
    const f: Fmt = { W, H, portrait: H > W };
    const t = frame / FPS;
    return (
      <AbsoluteFill>
        {beat.cues.map((c, i) => {
          const to = c.to ?? 99;
          // On from its entry until 6 frames after it hands over.
          if (t < c.from || frame > Math.round(to * FPS) - EXIT_LEAD + EXIT_FRAMES) return null;
          const L = hookLayout(c.text, f);
          return (
            <AbsoluteFill key={i} style={{ alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: L.maxW, ...exitStyle(frame, to, EXIT_LEAD) }}>
                <BlurType text={c.text} from={c.from} size={L.size} accent={c.accent} align="center" width={L.maxW} />
              </div>
            </AbsoluteFill>
          );
        })}
      </AbsoluteFill>
    );
  },
  // The rule under the card speaking, growing with its words as they land
  // (from the line's left edge), not drawn full width before they are in.
  rule: (t, beat, _dur, f) => {
    const c = beat.cues.filter((x) => t >= x.from).pop();
    if (!c) return null;
    const L = hookLayout(c.text, f);
    const grown = landedWidth(c.text, L.size, c.from, Math.round(t * FPS)) / measure(c.text, L.size);
    return { x: (f.W - L.w) / 2, y: f.H / 2 + L.h / 2 + 22, w: L.w * Math.min(1, grown) };
  },
  ruleLead: 0,
  sfx: (beat) => beat.cues.map((c): Sfx => ({ t: c.from, kind: 'whoosh', gain: 0.8 })),
};

/* End cards (V2.1 §7) -------------------------------------------------------
   Dark. The mark arrives — in the film, growing out of the Live pill (the
   real pill from the version tree, the last indigo the viewer saw move); in
   the ads, springing up from depth — then the type blur-snaps in ("Startup
   from $560" with the price in indigo, in the film), the offer line under
   it, and the button last with the ring pulse. The rule settles to the
   button's width. The film's holds 4.0s with the light drifting. */

const MUTED_ON_STAGE = '#b4b8c1';
const MARK_GROW_AT = 0.12;

type EndSpec = { price?: string; offer: string; at: { price?: number; offer: number; cta: number }; pill: boolean };

function endLayout(f: Fmt, spec: Pick<EndSpec, 'price' | 'offer'>) {
  const fmt = f.portrait ? 'portrait' : 'landscape';
  const maxW = f.portrait ? 940 : 1500;
  const markH = f.portrait ? 180 : 150;
  const price = TEXT['offer: price'][fmt], beta = TEXT['offer: beta line'][fmt], cta = TEXT['offer: CTA button'][fmt];
  const priceLines = spec.price ? wrap(spec.price, price, maxW) : [];
  const betaLines = wrap(spec.offer, beta, maxW);
  const priceH = priceLines.length * price * 1.06, betaH = betaLines.length * beta * 1.15;
  const padY = f.portrait ? 30 : 26, padX = f.portrait ? 52 : 48;
  const btnW = measure(CTA, cta, 600) + 2 * padX, btnH = cta * 1.2 + 2 * padY;
  const gaps = [40, spec.price ? 26 : 0, 46];
  const total = markH + priceH + betaH + btnH + gaps.reduce((x, y) => x + y, 0);
  const P = FORMATS.portrait.stage;
  const top = f.portrait ? P.y + (P.h - total) / 2 : (f.H - total) / 2 - 8;
  const markTop = top, priceTop = markTop + markH + gaps[0], betaTop = priceTop + priceH + gaps[1], btnTop = betaTop + betaH + gaps[2];
  const priceW = priceLines.length ? Math.max(...priceLines.map((l) => measure(l, price))) : 0;
  const betaW = Math.max(...betaLines.map((l) => measure(l, beta)));
  return { maxW, markH, price, beta, cta, priceH, priceW, betaH, betaW, padX, padY, btnW, btnH, markTop, priceTop, betaTop, btnTop };
}

const EndView: React.FC<{ spec: EndSpec; accent?: string }> = ({ spec, accent }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const f: Fmt = { W, H, portrait: H > W };
  const L = endLayout(f, spec);
  const g = springAt(frame, spec.pill ? MARK_GROW_AT : 0);
  // The film: the pill grows and gives way to the mark, which grows from the
  // pill's height to its own. The ads: the mark springs up from depth.
  const pillK = 4;
  const pillW = PILL.v2.w * pillK, pillH = PILL.v2.h * pillK;
  const from = spec.pill ? pillH / L.markH : 0.6;
  const markScale = interpolate(Math.min(g, 1.2), [0, 1], [from, 1]);
  const markOpacity = interpolate(g, [0, 0.35], [0, 1], clamp);
  const markBlur = spec.pill ? 0 : 10 * (1 - Math.min(1, g));
  const pillScale = 1 + 0.6 * Math.min(1, g);
  const pillOpacity = spec.pill ? interpolate(g, [0.05, 0.4], [1, 0], clamp) : 0;
  const markMid = L.markTop + L.markH / 2;
  const b = springAt(frame, spec.at.cta);
  const center: React.CSSProperties = { position: 'absolute', left: (W - L.maxW) / 2, width: L.maxW };
  return (
    <AbsoluteFill>
      {pillOpacity > 0 && (
        <div style={{ position: 'absolute', left: W / 2 - pillW / 2, top: markMid - pillH / 2, width: pillW, height: pillH, opacity: pillOpacity, transform: `scale(${pillScale})` }}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: pillH / 2 }}>
            <Img src={treeV2} style={{ position: 'absolute', left: -PILL.v2.x * pillK, top: -PILL.v2.y * pillK, width: 1440 * pillK, height: 839 * pillK, maxWidth: 'none' }} />
          </div>
        </div>
      )}
      <div style={{ position: 'absolute', left: 0, right: 0, top: L.markTop, height: L.markH, display: 'flex', justifyContent: 'center', opacity: markOpacity, transform: `scale(${markScale})`, filter: markBlur > 0.05 ? `blur(${markBlur}px)` : undefined }}>
        <Mark size={L.markH} page={ON_STAGE} />
      </div>
      {spec.price && (
        <div style={{ ...center, top: L.priceTop }}>
          <BlurType text={spec.price} from={spec.at.price!} size={L.price} accent={accent} align="center" width={L.maxW} />
        </div>
      )}
      <div style={{ ...center, top: L.betaTop }}>
        <BlurType text={spec.offer} from={spec.at.offer} size={L.beta} align="center" width={L.maxW} lineHeight={1.15} color={spec.price ? MUTED_ON_STAGE : ON_STAGE} />
      </div>
      {frame >= Math.round(spec.at.cta * FPS) && (
        <div
          style={{
            position: 'absolute', left: (W - L.btnW) / 2, top: L.btnTop, width: L.btnW, height: L.btnH, borderRadius: 10,
            background: ACCENT, color: ON_STAGE, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT, fontWeight: 600, fontSize: L.cta, letterSpacing: '-0.03em',
            opacity: Math.min(1, b * 1.5), transform: `translateY(${14 * (1 - b)}px) scale(${0.92 + 0.08 * b})`,
            filter: b < 0.98 ? `blur(${8 * (1 - Math.min(1, b))}px)` : undefined,
          }}
        >
          {CTA}
        </div>
      )}
      <Ring x={W / 2} y={L.btnTop + L.btnH / 2} w={L.btnW} h={L.btnH} at={spec.at.cta + 0.3} dur={0.45} />
    </AbsoluteFill>
  );
};

/** Under the first line of type as it lands, then the button's width. */
const endRule = (spec: (beat: Beat) => EndSpec) => (t: number, beat: Beat, _dur: number, f: Fmt) => {
  const S = spec(beat);
  const L = endLayout(f, S);
  if (t < S.at.cta - 0.2) {
    return S.price
      ? { x: (f.W - L.priceW) / 2, y: L.priceTop + L.priceH + 10, w: L.priceW }
      : { x: (f.W - L.betaW) / 2, y: L.betaTop + L.betaH + 10, w: L.betaW };
  }
  return { x: (f.W - L.btnW) / 2, y: L.btnTop + L.btnH + 18, w: L.btnW };
};

const filmEnd = (beat: Beat): EndSpec => {
  const [price, offer, cta] = beat.cues;
  return { price: COPY.startup, offer: OFFER, at: { price: price.from, offer: offer.from, cta: cta.from }, pill: true };
};
const adEnd = (beat: Beat): EndSpec => {
  const from = beat.cues[0].from;
  return { offer: OFFER_SHORT, at: { offer: from, cta: from + 0.45 }, pill: false };
};

/** The film's end card. */
export const Offer: Scene = {
  View: ({ beat }) => <EndView spec={filmEnd(beat)} accent={beat.cues[0].accent} />,
  rule: endRule(filmEnd),
  // Held still but for a slow push and the light: 1.02, so the button never
  // reaches the rule under it.
  camera: (t, dur, f) => pushIn(t, dur, f.W, f.H, 1.02),
  sfx: (beat) => [{ t: beat.cues[0].from, kind: 'whoosh', gain: 0.9 }, { t: beat.cues[1].from, kind: 'whoosh', gain: 0.6 }],
};

/** The ads' end card: the mark, the offer, the CTA. */
export const EndCard: Scene = {
  View: ({ beat }) => <EndView spec={adEnd(beat)} />,
  rule: endRule(adEnd),
  camera: (t, dur, f) => pushIn(t, dur, f.W, f.H, 1.02),
  sfx: (beat) => [{ t: beat.cues[0].from, kind: 'whoosh', gain: 0.7 }, { t: beat.cues[0].from + 0.5, kind: 'pop', gain: 0.6 }],
};
