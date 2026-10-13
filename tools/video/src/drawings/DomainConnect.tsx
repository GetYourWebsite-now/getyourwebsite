/**
 * src/components/anim/DomainConnect.astro on the frame clock: a domain typed
 * and connected, registered to the business, the address going live with a
 * padlock. "With Maintenance" stays in the picture from the first frame — a
 * custom domain needs Maintenance, and a condition belongs on the claim.
 *
 * The domain is cedarandstone.example, the fictional domain the concept
 * site's own email uses. cedarandstone.com is a real business's live site,
 * and an ad must not show someone else's domain being registered to us.
 */
import React from 'react';
import { lin, ramp, typed, FONT, MONO } from '../kit.tsx';
import { ACCENT, EXAMPLE, TOKENS } from '../script.ts';

export const DC_BOX = [400, 212] as const;

const K = { type: [0.35, 1.35], click: 1.55, check: 1.8, live: 2.2, lock: 2.45, pill: 2.7 };

export const DomainConnect: React.FC<{ t: number }> = ({ t }) => {
  const up = (at: number, d = 4) => {
    const p = ramp(t, at, 0.3);
    return { opacity: p, transform: `translate(0 ${(1 - p) * d})` };
  };
  const ring = lin(t, K.click, K.click + 0.35);
  const f = { fontFamily: FONT } as const;
  return (
    <svg viewBox={`0 0 ${DC_BOX[0]} ${DC_BOX[1]}`} width={DC_BOX[0]} height={DC_BOX[1]} style={{ overflow: 'visible', display: 'block' }}>
      <rect x={8} y={8} width={384} height={196} rx={8} fill={TOKENS.bg} stroke={TOKENS.line} />

      <rect x={28} y={30} width={250} height={42} rx={6} fill={TOKENS.bg} stroke={TOKENS.lineInput} />
      <text x={42} y={56} style={f} fontSize={16} fontWeight={500} fill={TOKENS.ink}>{typed(EXAMPLE.domain, lin(t, K.type[0], K.type[1]))}</text>
      <rect x={288} y={30} width={84} height={42} rx={6} fill={ACCENT} />
      <text x={330} y={55} style={f} fontSize={13} fontWeight={600} fill="#fff" textAnchor="middle">Connect</text>
      {ring > 0 && ring < 1 && <circle cx={330} cy={51} r={8 + ring * 14} fill="none" stroke={ACCENT} strokeWidth={1.5} opacity={1 - ring} />}

      <g {...up(K.check)}>
        <circle cx={39} cy={102} r={10} fill={ACCENT} />
        <path d="M34 102 L38 106 L45 98" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <text x={58} y={107} style={f} fontSize={13} fontWeight={600} fill={TOKENS.ink}>Registered to {EXAMPLE.owner}</text>
      </g>

      <g {...up(K.live)}>
        <rect x={28} y={130} width={344} height={42} rx={6} fill={TOKENS.bgAlt} stroke={TOKENS.line} />
        <g opacity={ramp(t, K.lock, 0.2)}>
          <rect x={40} y={148} width={13} height={10} rx={2} fill={TOKENS.ink} />
          <path d="M42.5 148 V144.5 a4 4 0 0 1 8 0 V148" fill="none" stroke={TOKENS.ink} strokeWidth={1.8} />
        </g>
        <text x={62} y={156} fontFamily={MONO} fontSize={12.5} fill={TOKENS.inkSoft}>https://{EXAMPLE.domain}</text>
        <g {...up(K.pill, 3)}>
          <rect x={318} y={142} width={42} height={18} rx={9} fill={ACCENT} />
          <text x={339} y={154.5} style={f} fontSize={12} fontWeight={600} letterSpacing="0.02em" fill="#fff" textAnchor="middle">Live</text>
        </g>
      </g>

      <text x={28} y={194} style={f} fontSize={13} fontWeight={500} fill={TOKENS.inkSoft}>With Maintenance</text>
    </svg>
  );
};

/* 9:16 ----------------------------------------------------------------------
   Stacked for a tall frame, with larger type: the field and Connect on their
   own rows, the address and its Live pill on two lines. Same steps, same
   timing (K). Smallest text 16px here, ~35px at 85% of a 1080-wide frame. */

export const DC_TALL_BOX = [420, 360] as const;

export const DomainConnectTall: React.FC<{ t: number }> = ({ t }) => {
  const up = (at: number, d = 5) => {
    const p = ramp(t, at, 0.3);
    return { opacity: p, transform: `translate(0 ${(1 - p) * d})` };
  };
  const ring = lin(t, K.click, K.click + 0.35);
  const f = { fontFamily: FONT } as const;
  return (
    <svg viewBox={`0 0 ${DC_TALL_BOX[0]} ${DC_TALL_BOX[1]}`} width={DC_TALL_BOX[0]} height={DC_TALL_BOX[1]} style={{ overflow: 'visible', display: 'block' }}>
      <rect x={8} y={8} width={404} height={344} rx={8} fill={TOKENS.bg} stroke={TOKENS.line} />

      <rect x={28} y={28} width={364} height={56} rx={7} fill={TOKENS.bg} stroke={TOKENS.lineInput} />
      <text x={46} y={63} style={f} fontSize={20} fontWeight={500} fill={TOKENS.ink}>{typed(EXAMPLE.domain, lin(t, K.type[0], K.type[1]))}</text>
      <rect x={28} y={96} width={364} height={50} rx={7} fill={ACCENT} />
      <text x={210} y={127} style={f} fontSize={18} fontWeight={600} fill="#fff" textAnchor="middle">Connect</text>
      {ring > 0 && ring < 1 && <circle cx={210} cy={121} r={10 + ring * 22} fill="none" stroke={ACCENT} strokeWidth={2} opacity={1 - ring} />}

      <g {...up(K.check)}>
        <circle cx={41} cy={180} r={13} fill={ACCENT} />
        <path d="M35 180 L39.5 184.5 L47.5 175.5" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        <text x={64} y={186} style={f} fontSize={17} fontWeight={600} fill={TOKENS.ink}>Registered to {EXAMPLE.owner}</text>
      </g>

      <g {...up(K.live)}>
        <rect x={28} y={210} width={364} height={92} rx={7} fill={TOKENS.bgAlt} stroke={TOKENS.line} />
        <g opacity={ramp(t, K.lock, 0.2)}>
          <rect x={42} y={232} width={16} height={12} rx={2.5} fill={TOKENS.ink} />
          <path d="M45 232 V227.5 a5 5 0 0 1 10 0 V232" fill="none" stroke={TOKENS.ink} strokeWidth={2.2} />
        </g>
        <text x={68} y={244} fontFamily={MONO} fontSize={16} fill={TOKENS.inkSoft}>https://{EXAMPLE.domain}</text>
        <g {...up(K.pill, 3)}>
          <rect x={68} y={260} width={56} height={26} rx={13} fill={ACCENT} />
          <text x={96} y={278.5} style={f} fontSize={16} fontWeight={600} letterSpacing="0.02em" fill="#fff" textAnchor="middle">Live</text>
        </g>
      </g>

      <text x={28} y={334} style={f} fontSize={17} fontWeight={500} fill={TOKENS.inkSoft}>With Maintenance</text>
    </svg>
  );
};
