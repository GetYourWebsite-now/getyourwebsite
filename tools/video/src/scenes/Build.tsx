/**
 * Build (V2.1 §5): the /beta form fills itself on a dark-glass card in 3D,
 * Send, "Sent ✓", a 0.3s time jump to an empty browser frame entering from
 * depth, then Cedar & Stone assembling from its own sections.
 *
 * The form is the one drawn element (V2 §1 D): /beta's real form at its real
 * sizes and positions — measured from the built page (labels 15px/600,
 * inputs 52px, 24px between fields) — scaled up as one unit, re-coloured as
 * dark glass for the stage. It is framed tight on the two fields it types, in
 * two shots with a hard cut between them, so the required name and email
 * fields (left empty: nothing is invented to fill them) are never in shot.
 * Typing is silent; the caret blinks at 530ms.
 *
 * Pacing (Jack, 17–18 October): the form is typed and sent in 1.6s, then
 * "Sent ✓" holds 0.7s after the click so the flash and the ring finish and
 * the cursor leaves; the assembly is at least 3.0s. The 0.3s jump between
 * them is the cut that says time passed: nothing here says how long a build
 * takes. Cedar & Stone is a
 * fictional business whose site we built by hand; the lower third says so.
 */
import React from 'react';
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { ACCENT, BETA_CTA, COPY, FORM, FPS } from '../script.ts';
import { DemoLabel, FONT, clamp, ease, typedChars, useFormat } from '../kit.tsx';
import { Arrow } from '../footage.tsx';
import { BAND_TOP, FORMATS, FORM_SCALE, type Box } from '../sizes.ts';
import { CHROME, Device3D, GlassBrowser, barHeight } from '../motion/Device3D.tsx';
import { ON_STAGE, blend, pushIn, springAt, type Camera } from '../motion/Stage.tsx';
import { AssembleDepth, SITES, depthLanded, overviewBox } from './Sites.tsx';
import type { Fmt, Scene, Sfx } from './types.ts';

/* The form, in its own CSS pixels ---------------------------------------- */

const FORM_W = 524, FORM_H = 926, PAD = 33;
const FIELDS = [
  { label: 'Business name', y: 80, h: 52, key: 'business' },
  { label: 'Your name', y: 186, h: 52 },
  { label: 'Email', y: 292, h: 52 },
  { label: 'Phone', opt: true, y: 398, h: 52 },
  { label: 'Current website, if any', opt: true, y: 504, h: 52, placeholder: 'https://' },
  { label: 'One line about the business', opt: true, y: 610, h: 88, key: 'about', placeholder: 'e.g. Plumbing, Livonia, 15 years' },
] as const;
const SUBMIT = { y: 761, h: 56 };

/** The two shots, as bands of the form (CSS px). Neither reaches "Your
 *  name" (y 186) or "Email" (y 292). */
const SHOTS = [{ top: 14, bottom: 176 }, { top: 596, bottom: 836 }];
/** Across: the whole card in 16:9; in 9:16 the field column only (x 27–497),
 *  since at the 34px text floor the 524px card is wider than the frame. */
const SHOT_X = { landscape: { left: 0, right: FORM_W }, portrait: { left: 27, right: 497 } };

/** Dark glass, for the stage. */
const GLASS = { label: ON_STAGE, muted: '#8b909a', field: '#1b1c22', border: '#3a3d46', placeholder: '#6b7079' };

const SITE = SITES.cedar;

/** The timeline, seconds into the beat. */
export const BUILD = {
  business: { from: 0.1, cps: 40 },
  shot2: 0.8,
  about: { from: 0.85, cps: 48 },
  send: 1.6,
  cut: 2.3, // "Sent ✓" holds 0.7s after the click
  jump: 0.3, // the empty frame alone, before anything assembles
  step: 0.09, // between sections
  scroll: 3.2, // the assembly's own length: the push down the page ends here
};
/** The cursor leaves after the click, before the jump. */
const CURSOR_OUT = { from: BUILD.send + 0.22, to: BUILD.send + 0.6 };
const businessEnd = BUILD.business.from + FORM.business.length / BUILD.business.cps;
const aboutEnd = BUILD.about.from + FORM.about.length / BUILD.about.cps;
const ASSEMBLE_AT = BUILD.cut + BUILD.jump;
const LANDED_AT = ASSEMBLE_AT + depthLanded(SITE, BUILD.step);

const BetaForm: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const business = typedChars(FORM.business, t, BUILD.business.from, BUILD.business.cps);
  const about = typedChars(FORM.about, t, BUILD.about.from, BUILD.about.cps);
  const active = t < BUILD.shot2 ? 'business' : t < BUILD.send ? 'about' : null;
  const typing = (active === 'business' && t < businessEnd) || (active === 'about' && t < aboutEnd);
  const caretOn = typing || Math.floor(t / 0.53) % 2 === 0;
  const sent = t >= BUILD.send;
  const sendFrame = Math.round(BUILD.send * FPS);
  // "Sent ✓": the button flashes light for 2 frames.
  const flash = frame >= sendFrame && frame < sendFrame + 2;
  const label = { fontSize: 15, fontWeight: 600, lineHeight: '24px', letterSpacing: '-0.075px', color: GLASS.label } as const;
  return (
    <div style={{ position: 'relative', width: FORM_W, height: FORM_H, background: CHROME, fontFamily: FONT }}>
      <div style={{ position: 'absolute', left: PAD, top: 33, fontSize: 20.8, fontWeight: 600, letterSpacing: '-0.52px', lineHeight: '23px', color: GLASS.label }}>Tell us about the business</div>
      {FIELDS.map((f) => {
        const value = 'key' in f ? (f.key === 'business' ? business : about) : '';
        const isActive = 'key' in f && f.key === active;
        return (
          <React.Fragment key={f.label}>
            <div style={{ position: 'absolute', left: PAD, top: f.y, ...label }}>
              {f.label}
              {'opt' in f && <span style={{ fontWeight: 400, color: GLASS.muted }}> optional</span>}
            </div>
            <div style={{ position: 'absolute', left: PAD, top: f.y + 31, width: 458, height: f.h, boxSizing: 'border-box', border: `1px solid ${isActive ? ACCENT : GLASS.border}`, borderRadius: 6, background: GLASS.field, padding: '12px 14.4px', fontSize: 16, lineHeight: '25.6px', color: GLASS.label }}>
              {value ? value : !isActive && 'placeholder' in f ? <span style={{ color: GLASS.placeholder }}>{f.placeholder}</span> : null}
              {isActive && caretOn && <span style={{ display: 'inline-block', width: 1.5, height: 19, marginLeft: 1, background: GLASS.label, verticalAlign: '-3px' }} />}
            </div>
          </React.Fragment>
        );
      })}
      <div style={{ position: 'absolute', left: PAD, top: SUBMIT.y, width: 458, height: SUBMIT.h, borderRadius: 6, background: flash ? ON_STAGE : ACCENT, color: flash ? ACCENT : ON_STAGE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 550, letterSpacing: '-0.136px' }}>
        {sent ? `${COPY.sent} ✓` : BETA_CTA}
      </div>
      <div style={{ position: 'absolute', left: PAD, top: 833, fontSize: 15, lineHeight: '24px', color: GLASS.muted }}>No cost to apply, no card. We reply within one business day.</div>
    </div>
  );
};

/** Where the current shot of the form sits on screen. */
function formShot(f: Fmt, t: number) {
  const F = FORMATS[f.portrait ? 'portrait' : 'landscape'];
  const band = SHOTS[t >= BUILD.shot2 ? 1 : 0];
  const fmt = f.portrait ? 'portrait' : 'landscape';
  const s = FORM_SCALE[fmt], X = SHOT_X[fmt];
  const w = (X.right - X.left) * s, h = (band.bottom - band.top) * s;
  const box: Box = { x: (f.W - w) / 2, y: F.stage.y + (F.stage.h - h) / 2, w, h };
  // The button's centre, on screen.
  const button = { x: box.x + (PAD + 229 - X.left) * s, y: box.y + (SUBMIT.y + SUBMIT.h / 2 - band.top) * s };
  return { band, s, box, button, left: X.left };
}

/** The assembly's browser frame. 16:9: 80% of the width. 9:16: the whole
 *  page, page-shaped. */
function siteBox(f: Fmt): Box {
  const F = FORMATS[f.portrait ? 'portrait' : 'landscape'];
  return f.portrait ? overviewBox(SITE, F.stage, barHeight(true)) : { x: (f.W - 1536) / 2, y: F.stage.y, w: 1536, h: F.stage.h };
}

/**
 * The "Sent ✓" dive: centred on the button across, and only as deep as
 * keeps the whole card in frame — its edges inside the frame, the field's
 * label below the top, the button above the 16:9 caption band. (The card is
 * 1362px wide at its 2.6× scale, so a 1.8× dive would crop both sides.)
 */
function sentDive(f: Fmt): Camera {
  const L = formShot(f, BUILD.shot2);
  const margin = 48;
  const P = FORMATS.portrait.stage;
  const bottom = f.portrait ? P.y + P.h : BAND_TOP; // what the picture may use
  const top = f.portrait ? P.y : 0;
  // Never below 1: in 9:16 the card already fills the width, so this is a
  // re-centre, not a dive.
  const s = Math.max(1, Math.min(1.8, (f.W - 2 * margin) / L.box.w, (bottom - top - 2 * margin) / L.box.h));
  // Centre the card's band in the usable height; across, the button (the
  // button is centred on the card, so the card is too).
  const cardMid = L.box.y + L.box.h / 2;
  const py = cardMid - ((top + bottom) / 2 - f.H / 2) / s;
  return { s, px: L.button.x, py };
}

/** A 1px indigo ring expanding from the button and fading. */
const Ring: React.FC<{ x: number; y: number; w: number; h: number; at: number }> = ({ x, y, w, h, at }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [Math.round(at * FPS), Math.round(at * FPS) + 9], [0, 1], { ...clamp, easing: ease });
  if (p <= 0 || p >= 1) return null;
  const grow = 1 + 0.35 * p;
  return <div style={{ position: 'absolute', left: x - (w * grow) / 2, top: y - (h * grow) / 2, width: w * grow, height: h * grow, borderRadius: 10, border: `1px solid ${ACCENT}`, opacity: 1 - p }} />;
};

export const Build: Scene = {
  View: ({ dur }) => {
    const frame = useCurrentFrame();
    const { width: W, height: H } = useVideoConfig();
    const { portrait } = useFormat();
    const f: Fmt = { W, H, portrait };
    const t = frame / FPS;
    if (t < BUILD.cut) {
      const L = formShot(f, t);
      // The cursor comes in for the button once the one-liner is typed, and
      // leaves down and right after the click.
      const out = interpolate(t, [CURSOR_OUT.from, CURSOR_OUT.to], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
      const cx = interpolate(t, [aboutEnd, BUILD.send - 0.02], [L.button.x + 300, L.button.x + 120], { ...clamp, easing: ease }) + out * 900;
      const cy = interpolate(t, [aboutEnd, BUILD.send - 0.02], [L.button.y + 200, L.button.y + 6], { ...clamp, easing: ease }) + out * 600;
      const since = t - BUILD.send;
      const pulse = since >= 0 && since < 0.12 ? 1 - 0.18 * Math.sin((since / 0.12) * Math.PI) : 1;
      return (
        <>
          <Device3D box={L.box} enter={{ at: 0, fromRotY: 14, phase: 0.4 }} radius={14}>
            <div style={{ position: 'absolute', left: -L.left * L.s, top: -L.band.top * L.s, transform: `scale(${L.s})`, transformOrigin: '0 0' }}>
              <BetaForm t={t} frame={frame} />
            </div>
          </Device3D>
          <Ring x={L.button.x} y={L.button.y} w={458 * L.s} h={SUBMIT.h * L.s} at={BUILD.send} />
          {t > aboutEnd - 0.05 && t < CURSOR_OUT.to && <Arrow x={cx} y={cy} scale={pulse} />}
        </>
      );
    }
    // The jump: an empty frame enters from depth; then the site assembles.
    const box = siteBox(f);
    return (
      <GlassBrowser
        box={box}
        url={SITE.url}
        enter={{ at: BUILD.cut, fromRotY: -14, phase: 1.3, sweepAt: LANDED_AT }}
        content={(w, h) => (
          <AssembleDepth site={SITE} w={w} h={h} from={ASSEMBLE_AT} step={BUILD.step} end={Math.min(dur, ASSEMBLE_AT + BUILD.scroll)} mode={portrait ? 'overview' : 'scroll'} />
        )}
      />
    );
  },
  Overlay: () => {
    const frame = useCurrentFrame();
    return frame >= Math.round(BUILD.cut * FPS) ? <DemoLabel text={COPY.cedar} /> : null;
  },
  // Dive into "Sent ✓" and pull back before the cut; then dive into the
  // first section as it lands, pull back, and push in slowly to the end.
  camera: (t, dur, f) => {
    const rest = pushIn(t, dur, f.W, f.H, 1.04);
    const frame = Math.round(t * FPS);
    if (t < BUILD.cut) {
      const dive = sentDive(f);
      const p = springAt(frame, BUILD.send - 0.3) * (1 - springAt(frame, BUILD.cut - 0.22));
      return blend(rest, dive, p);
    }
    const box = siteBox(f);
    const hero: Camera = { s: f.portrait ? 1.35 : 1.3, px: box.x + box.w * 0.42, py: box.y + box.h * (f.portrait ? 0.2 : 0.38) };
    const p = springAt(frame, ASSEMBLE_AT) * (1 - springAt(frame, LANDED_AT - 0.1));
    return blend(rest, hero, p);
  },
  sfx: () => {
    const keys: Sfx[] = [];
    for (let i = 0; i < FORM.business.length; i++) keys.push({ t: BUILD.business.from + i / BUILD.business.cps, kind: 'key' });
    for (let i = 0; i < FORM.about.length; i++) keys.push({ t: BUILD.about.from + i / BUILD.about.cps, kind: 'key' });
    return keys;
  },
  whipIn: true,
};
