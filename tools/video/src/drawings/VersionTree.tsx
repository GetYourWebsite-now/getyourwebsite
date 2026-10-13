/**
 * src/components/VersionTree.astro on the frame clock, in the hero's browser
 * frame. Geometry and labels come from src/data/version-tree.js — the file
 * the site and the social card already share — so this is the same tree,
 * not a copy of it.
 *
 * Nodes arrive, edges draw once their source is there, then a tap on
 * Christmas moves the Live badge to it, and a tap on Online orders moves it
 * back: "Christmas site in December, everyday site in January". The badge
 * cross-fades, as on the site, because that is what pressing host does.
 *
 * In 9:16 (the narrow geometry) the captions, the Live pill and the URL are
 * set larger than the site's — 16px, so they clear 34px at 85% of a
 * 1080-wide frame. Node positions are the shared geometry, unchanged; only
 * this port's type differs, so the site's drawing is untouched.
 */
import React from 'react';
import { WIDE, NARROW } from '../../../../src/data/version-tree.js';
import { lin, ramp, FONT, MONO } from '../kit.tsx';
import { ACCENT, TOKENS } from '../script.ts';

type Node = { label: string; x: number; y: number; w?: number; live?: boolean; target?: boolean };
type Geo = { w: number; h: number; nodes: Node[]; edges: string[] };

const TIMES = {
  full: { node: 0.2, gap: 0.14, hop: 2.0, back: 3.6 },
  short: { node: 0.05, gap: 0.1, hop: 1.5, back: 3.0 },
};

export const TREE_BOX = { wide: [700, 330], narrow: [420, 460] } as const;

export const VersionTree: React.FC<{ t: number; portrait: boolean; mode?: 'full' | 'short' }> = ({ t, portrait, mode = 'full' }) => {
  const g: Geo = portrait ? NARROW : WIDE;
  const vb = portrait ? [356, 356] : [636, 244];
  const [bw, bh] = portrait ? TREE_BOX.narrow : TREE_BOX.wide;
  const K = TIMES[mode];
  const nodeP = (i: number) => ramp(t, K.node + i * K.gap, 0.3);
  // Edge i joins node i (or node 2, for the two branches) to the next.
  const edgeFrom = [0, 1, 2, 2];
  const edgeP = (i: number) => lin(t, K.node + edgeFrom[i] * K.gap + 0.2, K.node + edgeFrom[i] * K.gap + 0.5);
  // 1 while the badge is on Christmas.
  const there = ramp(t, K.hop, 0.25) * (1 - ramp(t, K.back, 0.25));

  // Type: the site's sizes in 16:9; larger captions, pill and URL in 9:16.
  const TY = portrait
    ? { label: 17, caption: 16, pill: { w: 58, h: 24, dx: 68, dy: 32, tx: 39, ty: 15, size: 16 }, url: 16 }
    : { label: 15, caption: 12, pill: { w: 46, h: 19, dx: 58, dy: 31, tx: 35, ty: 17, size: 12 }, url: 12 };

  const tapAt = (n: Node, at: number) => {
    const p = lin(t, at - 0.12, at + 0.25);
    if (p <= 0 || p >= 1) return null;
    const w = n.w ?? g.w;
    return <circle cx={n.x + w / 2} cy={n.y + g.h / 2} r={10 + p * 26} fill="none" stroke={ACCENT} strokeWidth={2} opacity={1 - p} />;
  };
  const christmas = g.nodes.find((n) => n.target)!;
  const live = g.nodes.find((n) => n.live)!;

  return (
    <div style={{ width: bw, height: bh, borderRadius: 8, overflow: 'hidden', background: TOKENS.bg, border: `1px solid ${TOKENS.line}`, boxShadow: '0 1px 2px rgba(10,10,12,.04), 0 8px 24px rgba(10,10,12,.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px', background: TOKENS.bgAlt, borderBottom: `1px solid ${TOKENS.line}`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.9)' }}>
        {[0, 1, 2].map((i) => <span key={i} style={{ width: 8, height: 8, borderRadius: 4, background: TOKENS.dot }} />)}
        <div style={{ flex: 1, marginLeft: 8, padding: '3px 10px', borderRadius: 6, background: TOKENS.bg, border: `1px solid ${TOKENS.line}`, fontFamily: MONO, fontSize: TY.url, color: TOKENS.inkMuted }}>portal.getyourwebsite.now</div>
      </div>
      <div style={{ background: TOKENS.bgAlt, padding: portrait ? '18px 20px' : '20px 24px', height: '100%' }}>
        <svg viewBox={`0 0 ${vb[0]} ${vb[1]}`} style={{ display: 'block', width: '100%', overflow: 'visible' }}>
          {g.edges.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={TOKENS.inkMuted} strokeWidth={1.5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - edgeP(i)} />
          ))}
          {g.nodes.map((n, i) => {
            const w = n.w ?? g.w;
            const badge = n.live ? 1 - there : n.target ? there : 0;
            return (
              <g key={n.label} opacity={nodeP(i)} transform={`translate(0 ${(1 - nodeP(i)) * 6})`}>
                <rect x={n.x} y={n.y} width={w} height={g.h} rx={9} fill={TOKENS.bg} stroke={TOKENS.line} />
                <text x={n.x + 13} y={n.y + 26} fontFamily={FONT} fontSize={TY.label} fontWeight={600} letterSpacing="-0.01em" fill={TOKENS.ink}>{n.label}</text>
                <text x={n.x + 13} y={n.y + (portrait ? 50 : 47)} fontFamily={FONT} fontSize={TY.caption} fill={TOKENS.inkMuted}>Approved</text>
                {(n.live || n.target) && (
                  <g opacity={badge}>
                    <rect x={n.x + w - TY.pill.dx} y={n.y + g.h - TY.pill.dy} width={TY.pill.w} height={TY.pill.h} rx={5} fill={ACCENT} />
                    <text x={n.x + w - TY.pill.tx} y={n.y + g.h - TY.pill.ty} fontFamily={FONT} fontSize={TY.pill.size} fontWeight={600} letterSpacing="0.02em" fill="#fff" textAnchor="middle">Live</text>
                  </g>
                )}
              </g>
            );
          })}
          {tapAt(christmas, K.hop)}
          {tapAt(live, K.back)}
        </svg>
      </div>
    </div>
  );
};
