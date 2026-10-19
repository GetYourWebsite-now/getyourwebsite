/**
 * The mark: rounded hexagon holding two overlapping pages. Geometry copied
 * from assets/brand/mark-indigo-transparent.svg (and its white-on-black twin,
 * for the hook frame), inlined so the outline can draw itself in.
 *
 * `draw` is 0 → 1: outline 0–0.55, fill 0.55–0.75, pages 0.75–1. At 1 it is
 * the SVG file exactly. Solid fill only: no gradient on the mark.
 */
import React from 'react';
import { interpolate } from 'remotion';
import { ACCENT, TOKENS } from '../script.ts';

const HEX =
  'M 779.257812 192.570312 L 1219.90625 445.902344 C 1238.007812 456.308594 1249.167969 475.59375 1249.167969 496.472656 L 1249.167969 1001.121094 C 1249.167969 1022 1238.007812 1041.285156 1219.90625 1051.691406 L 779.257812 1305.023438 C 761.144531 1315.4375 738.855469 1315.4375 720.742188 1305.023438 L 280.09375 1051.691406 C 261.992188 1041.285156 250.832031 1022 250.832031 1001.121094 L 250.832031 496.472656 C 250.832031 475.59375 261.992188 456.308594 280.09375 445.902344 L 720.742188 192.570312 C 738.855469 182.152344 761.144531 182.152344 779.257812 192.570312 Z';

const c = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const Mark: React.FC<{ size: number; draw?: number; inverse?: boolean; page?: string; style?: React.CSSProperties }> = ({ size, draw = 1, inverse, page: pageColour, style }) => {
  const fg = inverse ? '#ffffff' : ACCENT;
  const page = pageColour ?? (inverse ? TOKENS.black : '#ffffff');
  const outline = interpolate(draw, [0, 0.55], [1, 0], c);
  const fill = interpolate(draw, [0.55, 0.75], [0, 1], c);
  const p1 = interpolate(draw, [0.75, 0.88], [0, 1], c);
  const p2 = interpolate(draw, [0.85, 1], [0, 1], c);
  // Cropped to the hexagon (250–1250 × 182–1316) so `size` is the mark's
  // height, not the file's padded square.
  return (
    <svg viewBox="240 172 1020 1154" height={size} width={(size * 1020) / 1154} style={{ display: 'block', overflow: 'visible', ...style }} aria-hidden="true">
      <path d={HEX} fill={fg} fillOpacity={fill} stroke={fg} strokeWidth={36} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={outline} />
      <rect x="483.63" y="483.63" width="355.16" height="355.16" rx="33.75" fill={page} opacity={p1} />
      <rect x="661.21" y="661.21" width="355.16" height="355.16" rx="33.75" fill={page} opacity={p2} />
    </svg>
  );
};
