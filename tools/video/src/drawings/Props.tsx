/**
 * Drawn props that are not on the site: the hook's phone and workbench, the
 * intake form, and the phone frame the real Cedar & Stone capture sits in.
 *
 * Drawn in the site's style, from its tokens: flat fills, 1px lines, 8px
 * radii, no texture, no photography. Nothing here pretends to be a capture.
 */
import React from 'react';
import { Img } from 'remotion';
import { lin, ramp, typed, FONT } from '../kit.tsx';
import { ACCENT, EXAMPLE, TOKENS } from '../script.ts';

/* The hook: a phone face-down on a workbench, buzzing once ---------------- */

/**
 * Seen from above: plank seams across the bench, the phone's back with its
 * camera module, lying at a slight angle. From above a face-down phone reads
 * as a phone at a glance; from the side it read as a grey slab.
 */
export const BENCH_BOX = [900, 640] as const;

export const FaceDownPhone: React.FC<{ t: number }> = ({ t }) => {
  // One buzz, 0.8–1.3s: a fast shake under an envelope, then still.
  const env = lin(t, 0.8, 0.9) * (1 - lin(t, 1.15, 1.3));
  const dx = Math.sin(t * Math.PI * 2 * 26) * 6 * env;
  const w = 'rgba(255,255,255,';
  return (
    <svg viewBox={`0 0 ${BENCH_BOX[0]} ${BENCH_BOX[1]}`} width={BENCH_BOX[0]} height={BENCH_BOX[1]} style={{ display: 'block', overflow: 'visible' }}>
      {/* The bench top, and its plank seams. */}
      <rect x={0} y={0} width={900} height={640} rx={10} fill={`${w}0.06)`} />
      {[160, 320, 480].map((y) => <rect key={y} x={0} y={y} width={900} height={2} fill={`${w}0.12)`} />)}
      {/* The phone, face-down. */}
      <g transform={`translate(${450 + dx} 320) rotate(-9)`}>
        <rect x={-110} y={-225} width={220} height={450} rx={36} fill={`${w}0.24)`} stroke={`${w}0.40)`} strokeWidth={2} />
        <rect x={-92} y={-207} width={88} height={88} rx={22} fill={`${w}0.34)`} />
        <circle cx={-67} cy={-182} r={15} fill={`${w}0.55)`} />
        <circle cx={-29} cy={-182} r={15} fill={`${w}0.55)`} />
        <circle cx={-67} cy={-144} r={15} fill={`${w}0.55)`} />
      </g>
      {/* Vibration marks, only while it buzzes. */}
      <g stroke={`${w}0.6)`} strokeWidth={4} fill="none" strokeLinecap="round" opacity={env}>
        <path d="M300 250 q-20 70 0 140" />
        <path d="M272 230 q-30 90 0 180" />
        <path d="M600 250 q20 70 0 140" />
        <path d="M628 230 q30 90 0 180" />
      </g>
    </svg>
  );
};

/* The intake form ---------------------------------------------------------- */

/** 16:9: 640 × 470. 9:16: a narrower card with larger type (520 × 480), so
 *  its 20px labels clear 34px at 85% of a 1080-wide frame. Same fields, same
 *  order, same timing. */
export const FORM_BOX = { landscape: [640, 470], portrait: [520, 480] } as const;

const FORM_TYPE = {
  landscape: { pad: '34px 36px', gap: 22, label: 17, input: 19, inputH: 50, button: 18, buttonH: 48, check: 26 },
  portrait: { pad: '30px 30px', gap: 20, label: 20, input: 23, inputH: 58, button: 22, buttonH: 56, check: 32 },
} as const;

const FIELDS = [
  { label: 'Business name', value: EXAMPLE.name, at: [0.4, 1.4] },
  { label: 'Where you work', value: EXAMPLE.area, at: [1.55, 2.1] },
  { label: 'What you do', value: EXAMPLE.what, at: [2.25, 3.25] },
] as const;

export const IntakeForm: React.FC<{ t: number; portrait?: boolean }> = ({ t, portrait }) => {
  const fmt = portrait ? 'portrait' : 'landscape';
  const [w, h] = FORM_BOX[fmt];
  const T = FORM_TYPE[fmt];
  const sent = t >= 3.6;
  const press = lin(t, 3.45, 3.6) * (1 - lin(t, 3.6, 3.75));
  return (
    <div style={{ width: w, height: h, background: TOKENS.bg, border: `1px solid ${TOKENS.line}`, borderRadius: 8, padding: T.pad, fontFamily: FONT, boxShadow: '0 1px 2px rgba(10,10,12,.04), 0 8px 24px rgba(10,10,12,.06)', boxSizing: 'border-box' }}>
      {FIELDS.map((f) => {
        const p = lin(t, f.at[0], f.at[1]);
        const focus = t >= f.at[0] && t < f.at[1] + 0.1;
        return (
          <div key={f.label} style={{ marginBottom: T.gap }}>
            <div style={{ fontSize: T.label, fontWeight: 600, color: TOKENS.ink, marginBottom: 8 }}>{f.label}</div>
            <div style={{ height: T.inputH, border: `1px solid ${focus ? ACCENT : TOKENS.lineInput}`, boxShadow: focus ? `0 0 0 3px ${TOKENS.accentSoft}` : 'none', borderRadius: 6, padding: '0 16px', display: 'flex', alignItems: 'center', fontSize: T.input, color: TOKENS.ink, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {typed(f.value, p)}
            </div>
          </div>
        );
      })}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
        <div style={{ height: T.buttonH, padding: '0 26px', borderRadius: 6, background: ACCENT, color: '#fff', fontSize: T.button, fontWeight: 550, display: 'flex', alignItems: 'center', transform: `scale(${1 - press * 0.04})` }}>
          {sent ? 'Sent' : 'Send'}
        </div>
        {sent && (
          <svg width={T.check} height={T.check} viewBox="0 0 26 26" style={{ opacity: ramp(t, 3.6, 0.25) }}>
            <circle cx={13} cy={13} r={12} fill={ACCENT} />
            <path d="M7.5 13 L11.5 17 L19 9" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </div>
  );
};

/* A phone frame around a real capture -------------------------------------- */

/**
 * `src` is a full-page capture at 390 CSS px wide (assets/captures), and
 * `capture` its size in CSS px. The screen pans down until the bottom of the
 * screen reaches `scrollTo` (CSS px down the page), between `from` and `to`
 * seconds, eased at both ends.
 */
export const PhoneWithCapture: React.FC<{ t: number; src: string; capture: [number, number]; scrollTo: number; screenW: number; from: number; to: number }> = ({ t, src, capture, scrollTo, screenW, from, to }) => {
  const screenH = Math.round(screenW * (844 / 390));
  const scale = screenW / capture[0];
  const travel = Math.max(0, Math.min(scrollTo, capture[1]) * scale - screenH);
  const p = lin(t, from, to);
  const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  const bezel = Math.round(screenW * 0.045);
  return (
    <div style={{ width: screenW + bezel * 2, height: screenH + bezel * 2, borderRadius: screenW * 0.14, background: TOKENS.black, padding: bezel, boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(10,10,12,.06), 0 12px 32px rgba(10,10,12,.08)' }}>
      <div style={{ position: 'relative', width: screenW, height: screenH, borderRadius: screenW * 0.11, overflow: 'hidden', background: TOKENS.bg }}>
        <Img src={src} style={{ position: 'absolute', left: 0, top: -travel * eased, width: screenW, height: capture[1] * scale }} />
        <div style={{ position: 'absolute', top: bezel * 0.6, left: '50%', width: screenW * 0.28, height: bezel * 1.1, marginLeft: -screenW * 0.14, borderRadius: 999, background: TOKENS.black }} />
      </div>
    </div>
  );
};
