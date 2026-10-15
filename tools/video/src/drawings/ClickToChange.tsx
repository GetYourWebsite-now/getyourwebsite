/**
 * src/components/anim/ClickToChange.astro, on the frame clock: a cursor clicks
 * a heading on the client's site, the heading takes the portal's indigo
 * selection outline, a note takes the request and sends, and a new version
 * arrives on a mini version tree — "In review" first, then "Approved", with
 * "Reviewed by a person" under it.
 *
 * Every step is one the product has (the portal's click-to-select picker, a
 * note per selection, one send, a person reviewing before approval). The
 * In review beat stays for the same reason it does on the site: a node that
 * jumped straight to Approved would draw a product we do not have.
 *
 * Wider than the site's drawing (520 against 400) so the real Cedar & Stone
 * headline fits the outline; the site's says "Fresh bread daily".
 *
 * `t` is seconds on this drawing's own timeline. The film runs it across two
 * beats — "Click it" (0–3.5) then "A person checks" (3.5–8.5) — so the second
 * beat picks up where the first left off.
 */
import React from 'react';
import { interpolate } from 'remotion';
import { ease, lin, ramp, typed, FONT } from '../kit.tsx';
import { ACCENT, EXAMPLE, TOKENS } from '../script.ts';

export const CTC_BOX = [520, 280] as const;

const K = {
  cursorIn: 0.2, toHeading: [0.25, 0.9], click1: 0.95,
  note: 1.15, type: [1.3, 2.3], toSend: [2.3, 2.75], click2: 2.8,
  cursorOut: 3.0, edge: [2.95, 3.3], node: 3.15, approved: 4.6, person: 4.9,
};

const Cursor: React.FC<{ x: number; y: number; o: number }> = ({ x, y, o }) => (
  <path
    transform={`translate(${x} ${y})`}
    d="M0 0 L0 17 L4.6 12.6 L7.6 19.4 L10.4 18.2 L7.4 11.6 L13.4 11.6 Z"
    fill={TOKENS.ink}
    stroke="#fff"
    strokeWidth={1}
    strokeLinejoin="round"
    opacity={o}
  />
);

const Ring: React.FC<{ cx: number; cy: number; t: number; at: number }> = ({ cx, cy, t, at }) => {
  const p = lin(t, at, at + 0.35);
  if (p <= 0 || p >= 1) return null;
  return <circle cx={cx} cy={cy} r={6 + p * 12} fill="none" stroke={ACCENT} strokeWidth={1.5} opacity={1 - p} />;
};

export const ClickToChange: React.FC<{ t: number }> = ({ t }) => {
  const heading = { x: 28, y: 66 };
  const send = { x: 330, y: 132 };
  // Pointer: in from the lower right, to the heading, then to Send.
  const cx = t < K.toSend[0]
    ? interpolate(t, K.toHeading, [300, heading.x + 92], { easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : interpolate(t, K.toSend, [heading.x + 92, send.x], { easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const cy = t < K.toSend[0]
    ? interpolate(t, K.toHeading, [250, heading.y - 6], { easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : interpolate(t, K.toSend, [heading.y - 6, send.y], { easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const cursorO = ramp(t, K.cursorIn, 0.2) * (1 - ramp(t, K.cursorOut, 0.25));

  const selected = t >= K.click1 ? 1 : 0;
  const noteP = ramp(t, K.note, 0.3);
  const typedText = typed(EXAMPLE.change, lin(t, K.type[0], K.type[1]));
  const sent = t >= K.click2;
  const edgeP = lin(t, K.edge[0], K.edge[1]);
  const nodeP = ramp(t, K.node, 0.3);
  const approved = t >= K.approved;
  const personP = ramp(t, K.person, 0.3);

  const text = { fontFamily: FONT } as const;

  return (
    <svg viewBox={`0 0 ${CTC_BOX[0]} ${CTC_BOX[1]}`} width={CTC_BOX[0]} height={CTC_BOX[1]} style={{ overflow: 'visible', display: 'block' }}>
      {/* The client's site */}
      <rect x={8} y={8} width={318} height={262} rx={8} fill={TOKENS.bg} stroke={TOKENS.line} />
      {[22, 32, 42].map((x) => <circle key={x} cx={x} cy={21} r={3} fill={TOKENS.dot} />)}
      <line x1={8} y1={34} x2={326} y2={34} stroke={TOKENS.line} />
      <text x={heading.x} y={heading.y} style={text} fontSize={16} fontWeight={600} letterSpacing="-0.01em" fill={TOKENS.ink}>{EXAMPLE.heading}</text>
      <rect x={18} y={46} width={300} height={28} rx={4} fill="none" stroke={ACCENT} strokeWidth={2} opacity={selected} />
      <rect x={28} y={88} width={240} height={6} rx={3} fill={TOKENS.line} />
      <rect x={28} y={100} width={180} height={6} rx={3} fill={TOKENS.line} />
      <rect x={28} y={118} width={280} height={96} rx={4} fill={TOKENS.bgAlt} />
      <path d="M48 202 L96 154 L128 184 L152 166 L206 202 Z" fill={TOKENS.line} />
      <circle cx={222} cy={146} r={10} fill={TOKENS.line} />
      <rect x={28} y={228} width={86} height={24} rx={4} fill={TOKENS.line} />

      {/* The note */}
      <g opacity={noteP} transform={`translate(0 ${(1 - noteP) * 4})`}>
        <rect x={116} y={84} width={232} height={68} rx={6} fill={TOKENS.bg} stroke={TOKENS.lineInput} />
        <text x={128} y={110} style={text} fontSize={13} fontWeight={600} fill={TOKENS.ink}>{typedText}</text>
        <rect x={290} y={122} width={50} height={20} rx={4} fill={ACCENT} />
        <text x={315} y={136} style={text} fontSize={12} fontWeight={600} fill="#fff" textAnchor="middle">{sent ? 'Sent' : 'Send'}</text>
      </g>

      {/* The mini version tree */}
      <rect x={378} y={58} width={130} height={48} rx={6} fill={TOKENS.bg} stroke={TOKENS.line} />
      <text x={390} y={78} style={text} fontSize={13} fontWeight={600} fill={TOKENS.ink}>Version 1</text>
      <rect x={390} y={85} width={32} height={14} rx={7} fill={ACCENT} />
      <text x={406} y={96} style={text} fontSize={12} fontWeight={600} letterSpacing="0.02em" fill="#fff" textAnchor="middle">Live</text>
      <path d="M443 106 L443 150" fill="none" stroke={TOKENS.inkMuted} strokeWidth={1.5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - edgeP} />
      <g opacity={nodeP} transform={`translate(0 ${(1 - nodeP) * 6})`}>
        <rect x={378} y={150} width={130} height={50} rx={6} fill={TOKENS.bg} stroke={ACCENT} />
        <text x={390} y={170} style={text} fontSize={13} fontWeight={600} fill={TOKENS.ink}>Version 2</text>
        {approved ? (
          <>
            <rect x={390} y={177} width={70} height={17} rx={8.5} fill={TOKENS.accentSoft} />
            <text x={396} y={189.5} style={text} fontSize={12} fontWeight={600} fill={ACCENT}>Approved</text>
          </>
        ) : (
          <>
            <rect x={390} y={177} width={68} height={17} rx={8.5} fill={TOKENS.bgAlt} stroke={TOKENS.line} />
            <text x={396} y={189.5} style={text} fontSize={12} fontWeight={600} fill={TOKENS.inkMuted}>In review</text>
          </>
        )}
      </g>
      <text x={443} y={222} style={text} fontSize={12} fontWeight={500} fill={TOKENS.inkSoft} textAnchor="middle" opacity={personP}>Reviewed by a person</text>

      {/* Pointer */}
      <Ring cx={heading.x + 92} cy={heading.y - 6} t={t} at={K.click1} />
      <Ring cx={send.x} cy={send.y} t={t} at={K.click2} />
      <Cursor x={cx} y={cy} o={cursorO} />
    </svg>
  );
};

/* 9:16 ----------------------------------------------------------------------
   The same picture stacked for a tall frame, with larger type: the client's
   site on top, the note over it, and the two versions side by side under
   it. Same steps, same timing (K). At 85% of a 1080-wide frame its smallest
   text, 17px here, comes out at ~34px. */

export const CTC_TALL_BOX = [420, 452] as const;

export const ClickToChangeTall: React.FC<{ t: number }> = ({ t }) => {
  const heading = { x: 28, y: 78 };
  const send = { x: 358, y: 210 };
  const target = { x: heading.x + 150, y: heading.y - 8 };
  const clamp = { easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
  const cx = t < K.toSend[0] ? interpolate(t, K.toHeading, [360, target.x], clamp) : interpolate(t, K.toSend, [target.x, send.x], clamp);
  const cy = t < K.toSend[0] ? interpolate(t, K.toHeading, [430, target.y], clamp) : interpolate(t, K.toSend, [target.y, send.y], clamp);
  const cursorO = ramp(t, K.cursorIn, 0.2) * (1 - ramp(t, K.cursorOut, 0.25));
  const noteP = ramp(t, K.note, 0.3);
  const edgeP = lin(t, K.edge[0], K.edge[1]);
  const nodeP = ramp(t, K.node, 0.3);
  const approved = t >= K.approved;
  const text = { fontFamily: FONT } as const;

  return (
    <svg viewBox={`0 0 ${CTC_TALL_BOX[0]} ${CTC_TALL_BOX[1]}`} width={CTC_TALL_BOX[0]} height={CTC_TALL_BOX[1]} style={{ overflow: 'visible', display: 'block' }}>
      {/* The client's site */}
      <rect x={8} y={8} width={404} height={300} rx={8} fill={TOKENS.bg} stroke={TOKENS.line} />
      {[24, 36, 48].map((x) => <circle key={x} cx={x} cy={24} r={4} fill={TOKENS.dot} />)}
      <line x1={8} y1={40} x2={412} y2={40} stroke={TOKENS.line} />
      <text x={heading.x} y={heading.y} style={text} fontSize={20} fontWeight={600} letterSpacing="-0.01em" fill={TOKENS.ink}>{EXAMPLE.heading}</text>
      <rect x={18} y={54} width={386} height={34} rx={4} fill="none" stroke={ACCENT} strokeWidth={2.5} opacity={t >= K.click1 ? 1 : 0} />
      <rect x={28} y={104} width={300} height={7} rx={3.5} fill={TOKENS.line} />
      <rect x={28} y={118} width={220} height={7} rx={3.5} fill={TOKENS.line} />
      <rect x={28} y={136} width={364} height={120} rx={5} fill={TOKENS.bgAlt} />
      <path d="M52 244 L112 184 L152 222 L182 200 L250 244 Z" fill={TOKENS.line} />
      <circle cx={272} cy={176} r={12} fill={TOKENS.line} />
      <rect x={28} y={270} width={100} height={26} rx={5} fill={TOKENS.line} />

      {/* The note */}
      <g opacity={noteP} transform={`translate(0 ${(1 - noteP) * 4})`}>
        <rect x={56} y={150} width={348} height={84} rx={7} fill={TOKENS.bg} stroke={TOKENS.lineInput} />
        <text x={72} y={182} style={text} fontSize={18} fontWeight={600} fill={TOKENS.ink}>{typed(EXAMPLE.change, lin(t, K.type[0], K.type[1]))}</text>
        <rect x={326} y={196} width={64} height={28} rx={5} fill={ACCENT} />
        <text x={358} y={215.5} style={text} fontSize={17} fontWeight={600} fill="#fff" textAnchor="middle">{t >= K.click2 ? 'Sent' : 'Send'}</text>
      </g>

      {/* The two versions, side by side */}
      <rect x={8} y={336} width={170} height={76} rx={7} fill={TOKENS.bg} stroke={TOKENS.line} />
      <text x={22} y={364} style={text} fontSize={18} fontWeight={600} fill={TOKENS.ink}>Version 1</text>
      <rect x={22} y={376} width={54} height={26} rx={13} fill={ACCENT} />
      <text x={49} y={395} style={text} fontSize={17} fontWeight={600} letterSpacing="0.02em" fill="#fff" textAnchor="middle">Live</text>
      <path d="M178 374 L222 374" fill="none" stroke={TOKENS.inkMuted} strokeWidth={2} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - edgeP} />
      <g opacity={nodeP} transform={`translate(0 ${(1 - nodeP) * 6})`}>
        <rect x={222} y={336} width={190} height={76} rx={7} fill={TOKENS.bg} stroke={ACCENT} strokeWidth={1.5} />
        <text x={236} y={364} style={text} fontSize={18} fontWeight={600} fill={TOKENS.ink}>Version 2</text>
        {approved ? (
          <>
            <rect x={236} y={376} width={100} height={26} rx={13} fill={TOKENS.accentSoft} />
            <text x={248} y={395} style={text} fontSize={17} fontWeight={600} fill={ACCENT}>Approved</text>
          </>
        ) : (
          <>
            <rect x={236} y={376} width={100} height={26} rx={13} fill={TOKENS.bgAlt} stroke={TOKENS.line} />
            <text x={248} y={395} style={text} fontSize={17} fontWeight={600} fill={TOKENS.inkMuted}>In review</text>
          </>
        )}
      </g>
      <text x={317} y={442} style={text} fontSize={17} fontWeight={500} fill={TOKENS.inkSoft} textAnchor="middle" opacity={ramp(t, K.person, 0.3)}>Reviewed by a person</text>

      {/* Pointer, drawn larger to match the type */}
      <Ring cx={target.x} cy={target.y} t={t} at={K.click1} />
      <Ring cx={send.x} cy={send.y} t={t} at={K.click2} />
      <g transform={`translate(${cx} ${cy}) scale(1.35) translate(${-cx} ${-cy})`}>
        <Cursor x={cx} y={cy} o={cursorO} />
      </g>
    </svg>
  );
};
