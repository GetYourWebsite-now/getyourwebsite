/**
 * One cut, V2.1: the dark stage, each beat under its camera, whip pans
 * between beats where the subject changes, the burned-in captions, the
 * indigo rule that persists across the whole cut, and grain over all of it.
 * Silent: no music, no effects.
 *
 *   back    StageBack — #0a0a0c and the indigo light (moves with the camera
 *           at 0.4×)
 *   world   the beat's View under its camera (Scene.camera, default the
 *           1.00 → 1.06 push-in)
 *   front   the beat's Overlay (lower thirds), the captions, the rule — not
 *           under the camera, but they whip with the world
 *   grain   6%, a new offset every frame
 *
 * A whip pan is 10 frames: the outgoing beat's last 5 slide out left, the
 * incoming beat's first 5 slide in from the right, with three trailing
 * copies at 35/25/15% opacity for motion blur.
 */
import React from 'react';
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { CUTS, FPS, frames, snapBeats, type Beat, type Cue, type CutId } from './script.ts';
import { clamp, ease } from './kit.tsx';
import { BAND_TOP, FORMATS, PORTRAIT_BAND_BOTTOM } from './sizes.ts';
import { Grain, STAGE, StageBack, World, pushIn, type Camera } from './motion/Stage.tsx';
import { BlurType, Rule, measure, wrap, type RuleAt } from './motion/Type.tsx';
import { Hook, Offer, EndCard } from './scenes/Type.tsx';
import { Build } from './scenes/Build.tsx';
import { Change, Switch, OneSentence } from './scenes/Portal.tsx';
import { Hosted } from './scenes/Hosted.tsx';
import { AllWeNeed, AssembleFast, ReceiptScene } from './scenes/Ads.tsx';
import type { Fmt, Scene } from './scenes/types.ts';

export const SCENES: Record<Beat['scene'], Scene> = {
  hook: Hook, build: Build, change: Change, switch: Switch, hosted: Hosted, offer: Offer,
  receipt: ReceiptScene, allWeNeed: AllWeNeed, assembleFast: AssembleFast, oneSentence: OneSentence, endCard: EndCard,
};

export const beatsFor = (cut: CutId) => snapBeats(CUTS[cut]);

const WHIP = 5; // frames each side of the cut
const WHIP_DISTANCE = 0.8; // of the frame width

/* Captions and the rule ----------------------------------------------------- */

/** A caption's lines and box, by the format's layout. */
export function captionBox(text: string, f: Fmt) {
  const C = FORMATS[f.portrait ? 'portrait' : 'landscape'].caption;
  const lines = wrap(text, C.size, C.w);
  const lh = C.size * 1.06;
  const top = f.portrait ? C.y : C.bottom - lines.length * lh;
  const w = Math.max(...lines.map((l) => measure(l, C.size)));
  return { x: C.x, top, w, h: lines.length * lh, size: C.size, maxW: C.w };
}

const captionRule = (text: string, f: Fmt): RuleAt => {
  const b = captionBox(text, f);
  return { x: b.x, y: b.top + b.h + 16, w: b.w };
};

const activeCaption = (b: Beat, t: number): Cue | undefined =>
  b.cues.filter((c) => c.kind === 'caption' && t >= c.from && t < (c.to ?? b.seconds)).pop();

/** The rule starts for a caption this long before its first word, so it is
 *  under the caption before that word lands. */
const RULE_LEAD = 0.2;

/** A new target for the rule from `t` (cut seconds). `at` gives the target
 *  at any time after; `cut` means it changes on a whip pan's cut — no
 *  spring, it arrives with the incoming beat. */
type RuleEvent = { t: number; at: (T: number) => RuleAt | null; cut: boolean };

function ruleEvents(beats: Beat[], f: Fmt): RuleEvent[] {
  const out: RuleEvent[] = [];
  let start = 0;
  beats.forEach((b, i) => {
    const S = SCENES[b.scene];
    const whip = !!S.whipIn && i > 0;
    const s0 = start;
    const lead = S.ruleLead ?? RULE_LEAD;
    if (S.rule) {
      const moments = [0, ...b.cues.map((c) => Math.max(0, c.from - lead))]
        .filter((t, k, a) => a.indexOf(t) === k && t < b.seconds).sort((p, q) => p - q);
      for (const m of moments) out.push({ t: s0 + m, at: (T) => S.rule!(T - s0, b, b.seconds, f), cut: whip && m === 0 });
    } else {
      for (const c of b.cues.filter((x) => x.kind === 'caption')) {
        const m = Math.max(0, c.from - lead);
        const target = captionRule(c.text, f);
        out.push({ t: s0 + m, at: () => target, cut: whip && m === 0 });
      }
    }
    start += b.seconds;
  });
  return out.sort((p, q) => p.t - q.t);
}

/* One beat ------------------------------------------------------------------ */

const BeatLayer: React.FC<{ beat: Beat; whipIn: boolean; whipOut: boolean }> = ({ beat, whipIn, whipOut }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const f: Fmt = { W, H, portrait: H > W };
  const S = SCENES[beat.scene];
  const t = frame / FPS;
  const len = frames(beat.seconds);
  const cam: Camera = S.camera ? S.camera(t, beat.seconds, f) : pushIn(t, beat.seconds, W, H);
  const shift = whipShift(frame, len, whipIn, whipOut, W);
  const moving = shift !== 0;
  const cap = activeCaption(beat, t);
  const layer = (dx: number, opacity: number, key: string) => (
    <AbsoluteFill key={key} style={{ opacity }}>
      <World cam={cam} shift={shift + dx}>
        <S.View beat={beat} dur={beat.seconds} />
      </World>
      {/* 16:9: the caption band stays stage-dark; devices pass behind it
          when the camera dives, so the caption always reads. */}
      {!f.portrait && <div style={{ position: 'absolute', left: 0, right: 0, top: BAND_TOP, bottom: 0, background: `linear-gradient(to bottom, rgba(10,10,12,0) 0px, ${STAGE} 56px)` }} />}
      {/* 9:16: the same above the picture, behind the caption band. */}
      {f.portrait && <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: PORTRAIT_BAND_BOTTOM, background: `linear-gradient(to top, rgba(10,10,12,0) 0px, ${STAGE} 56px)` }} />}
      <AbsoluteFill style={{ transform: `translateX(${shift + dx}px)` }}>
        {S.Overlay && <S.Overlay beat={beat} dur={beat.seconds} />}
        {cap && (() => {
          const b = captionBox(cap.text, f);
          return (
            <div style={{ position: 'absolute', left: b.x, top: b.top }}>
              <BlurType key={cap.text} text={cap.text} from={cap.from} size={b.size} accent={cap.accent} width={b.maxW} />
            </div>
          );
        })()}
      </AbsoluteFill>
    </AbsoluteFill>
  );
  if (!moving) return layer(0, 1, 'main');
  // Motion blur: three trailing copies, behind the direction of travel.
  const dir = shift > 0 ? 1 : -1;
  return (
    <>
      {[[120, 0.15], [80, 0.25], [40, 0.35]].map(([d, o]) => layer(dir * d, o, `blur-${d}`))}
      {layer(0, 1, 'main')}
    </>
  );
};

function whipShift(frame: number, len: number, whipIn: boolean, whipOut: boolean, W: number) {
  if (whipIn && frame < WHIP) return W * WHIP_DISTANCE * (1 - interpolate(frame + 1, [0, WHIP], [0, 1], { ...clamp, easing: ease }));
  if (whipOut && frame >= len - WHIP) return -W * WHIP_DISTANCE * interpolate(frame - (len - WHIP) + 1, [0, WHIP], [0, 1], { ...clamp, easing: ease });
  return 0;
}

/* The cut ------------------------------------------------------------------- */

export type CutProps = { cut: CutId };

export const Cut: React.FC<CutProps> = ({ cut }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const f: Fmt = { W, H, portrait: H > W };
  const beats = beatsFor(cut);
  const starts = beats.reduce<number[]>((a, b, i) => [...a, i ? a[i - 1] + frames(beats[i - 1].seconds) : 0], []);

  // The current beat's camera and whip offset drive the far layer too.
  const i = Math.max(0, starts.findLastIndex((s) => frame >= s));
  const b = beats[i], S = SCENES[b.scene];
  const local = frame - starts[i];
  const len = frames(b.seconds);
  const whipIn = !!S.whipIn && i > 0;
  const whipOut = i + 1 < beats.length && !!SCENES[beats[i + 1].scene].whipIn;
  const cam = S.camera ? S.camera(local / FPS, b.seconds, f) : pushIn(local / FPS, b.seconds, W, H);
  const shift = whipShift(local, len, whipIn, whipOut, W);

  // The rule: the latest target, sprung from where the one before had got
  // to — or, on a whip pan's cut, already there.
  const events = ruleEvents(beats, f);
  const T = frame / FPS;
  const k = events.findLastIndex((e) => e.t <= T + 1e-6);
  const next = k >= 0 ? events[k].at(T) : null;
  const prev = k > 0 && !events[k].cut ? events[k - 1].at(events[k].t - 1e-3) : null;

  return (
    <AbsoluteFill>
      <StageBack cam={cam} shift={shift} />
      {beats.map((bt, j) => (
        <Sequence key={j} from={starts[j]} durationInFrames={frames(bt.seconds)}>
          <BeatLayer beat={bt} whipIn={!!SCENES[bt.scene].whipIn && j > 0} whipOut={j + 1 < beats.length && !!SCENES[beats[j + 1].scene].whipIn} />
        </Sequence>
      ))}
      {next && <Rule prev={prev} next={next} since={k >= 0 ? events[k].t : 0} shift={shift} />}
      <Grain />
    </AbsoluteFill>
  );
};
