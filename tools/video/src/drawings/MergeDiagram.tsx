/**
 * The home page's merge diagram (src/components/anim/MergeAnim.astro), driven
 * by the frame clock instead of CSS.
 *
 * Same content as the site: "If you build it yourself / You do the work /
 * Squarespace · Wix · Replit" on the left, "If you hire an agency / They do
 * the work / Design studios · Freelancers · Dev shops" on the right, three
 * mirrored paths a side into the mark, "GetYourWebsite / We do the work" in
 * the centre. Same two layouts: side by side in 16:9; in 9:16 both blocks on
 * top and all six paths converging down into the mark, never left–mark–right
 * stacked (that reads as a sequence).
 *
 * The site's price lines are left out: in a film they would be eight more
 * numbers to read in a five-second beat, against the reading-time rule.
 *
 * Modes:
 *   build       the two columns type in; no paths, no mark yet (film beat 2)
 *   collapse    columns already there; paths draw in from the outside, the
 *               mark fades up as the first lands, ours arrives (film beat 3)
 *   standalone  everything, quickly, for the 15s cut that opens on it
 */
import React from 'react';
import { ramp, typed, lin, FONT } from '../kit.tsx';
import { MERGE, TOKENS } from '../script.ts';
import { Mark } from './Mark.tsx';

type Mode = 'build' | 'collapse' | 'standalone';

const G = {
  wide: {
    box: [1620, 560],
    head: 28, verb: 44, name: 34,
    left: { x: 540, align: 'right' as const },
    right: { x: 1080, align: 'left' as const },
    centre: 810,
    headY: 40, verbY: 84, rows: [250, 320, 390],
    mark: { cx: 810, cy: 320, h: 150 },
    paths: (rows: number[]) => [
      ...rows.map((y) => `M560 ${y} C668 ${y} 668 320 748 320`),
      ...rows.map((y) => `M1060 ${y} C952 ${y} 952 320 872 320`),
    ],
    ours: { y: 40 },
  },
  tall: {
    box: [980, 900],
    head: 35, verb: 46, name: 36,
    blocks: [245, 735],
    headY: 0, verbY: 46, rows: [150, 205, 260],
    mark: { cx: 490, top: 556, h: 176 },
    paths: () => [
      ...[165, 245, 325].map((x) => `M${x} 312 C${x} 446 490 420 490 556`),
      ...[815, 735, 655].map((x) => `M${x} 312 C${x} 446 490 420 490 556`),
    ],
    ours: { y: 762 },
  },
};

/** Later than any beat: "not in this mode". interpolate() needs finite input. */
const NEVER = 1e4;

/** When each element arrives, by mode. Seconds into the beat. */
function timings(mode: Mode) {
  if (mode === 'build') return { colL: 0.5, colR: 1.7, nameGap: 0.4, paths: NEVER, mark: NEVER, ours: NEVER };
  if (mode === 'collapse') return { colL: -9, colR: -9, nameGap: 0, paths: 0.2, mark: 1.3, ours: 1.6 };
  return { colL: 0, colR: 0, nameGap: 0, paths: 0.35, mark: 1.45, ours: 1.75 };
}

const Text: React.FC<{ x: number; y: number; size: number; weight: number; color: string; align: 'left' | 'right' | 'center'; o: number; children: React.ReactNode }> = ({ x, y, size, weight, color, align, o, children }) => {
  // An 800px box anchored at x by its left edge, right edge or middle.
  const left = align === 'left' ? x : align === 'right' ? x - 800 : x - 400;
  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left,
        width: 800,
        textAlign: align,
        fontFamily: FONT,
        fontSize: size,
        fontWeight: weight,
        lineHeight: 1.2,
        letterSpacing: weight >= 600 ? '-0.015em' : 'normal',
        color,
        whiteSpace: 'nowrap',
        opacity: o,
      }}
    >
      {children}
    </div>
  );
};

export const MergeDiagram: React.FC<{ t: number; mode: Mode; portrait: boolean }> = ({ t, mode, portrait }) => {
  const T = timings(mode);
  const col = (side: 'diy' | 'agency', start: number) => {
    const m = MERGE[side];
    const headO = ramp(t, start, 0.3);
    const names = m.names.map((n, i) => {
      const s = start + 0.35 + i * T.nameGap;
      const p = mode === 'build' ? lin(t, s, s + 0.35) : 1;
      return { text: mode === 'build' ? typed(n, p) : n, o: mode === 'build' ? (p > 0 ? 1 : 0) : 1 };
    });
    return { head: m.head, verb: m.verb, headO, names };
  };
  const L = col('diy', T.colL);
  const R = col('agency', T.colR);
  const pathP = (i: number) => lin(t, T.paths + (i % 3) * 0.12, T.paths + (i % 3) * 0.12 + 1.2);
  const markO = ramp(t, T.mark, 0.4);
  const oursO = ramp(t, T.ours, 0.35);

  if (!portrait) {
    const g = G.wide;
    const side = (c: typeof L, x: number, align: 'left' | 'right') => (
      <>
        <Text x={x} y={g.headY} size={g.head} weight={500} color={TOKENS.inkSoft} align={align} o={c.headO}>{c.head}</Text>
        <Text x={x} y={g.verbY} size={g.verb} weight={600} color={TOKENS.ink} align={align} o={c.headO}>{c.verb}</Text>
        {c.names.map((n, i) => (
          <Text key={i} x={x} y={g.rows[i] - g.name * 0.62} size={g.name} weight={400} color={TOKENS.inkSoft} align={align} o={n.o}>{n.text}</Text>
        ))}
      </>
    );
    return (
      <div style={{ position: 'relative', width: g.box[0], height: g.box[1] }}>
        <svg width={g.box[0]} height={g.box[1]} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {g.paths(g.rows).map((d, i) => (
            <path key={i} d={d} fill="none" stroke={TOKENS.lineInput} strokeWidth={2.5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - pathP(i)} />
          ))}
        </svg>
        {side(L, g.left.x, 'right')}
        {side(R, g.right.x, 'left')}
        <div style={{ position: 'absolute', left: g.mark.cx, top: g.mark.cy - g.mark.h / 2, transform: `translate(-50%, ${(1 - markO) * 10}px)`, opacity: markO }}>
          <Mark size={g.mark.h} />
        </div>
        <Text x={g.centre} y={g.ours.y} size={g.head} weight={500} color={TOKENS.inkSoft} align="center" o={oursO}>{MERGE.ours.head}</Text>
        <Text x={g.centre} y={g.verbY} size={g.verb} weight={600} color={TOKENS.ink} align="center" o={oursO}>{MERGE.ours.verb}</Text>
      </div>
    );
  }

  const g = G.tall;
  const block = (c: typeof L, cx: number) => (
    <>
      <Text x={cx} y={g.headY} size={g.head} weight={500} color={TOKENS.inkSoft} align="center" o={c.headO}>{c.head}</Text>
      <Text x={cx} y={g.verbY} size={g.verb} weight={600} color={TOKENS.ink} align="center" o={c.headO}>{c.verb}</Text>
      {c.names.map((n, i) => (
        <Text key={i} x={cx} y={g.rows[i] - g.name * 0.62} size={g.name} weight={400} color={TOKENS.inkSoft} align="center" o={n.o}>{n.text}</Text>
      ))}
    </>
  );
  return (
    <div style={{ position: 'relative', width: g.box[0], height: g.box[1] }}>
      <svg width={g.box[0]} height={g.box[1]} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {g.paths().map((d, i) => (
          <path key={i} d={d} fill="none" stroke={TOKENS.lineInput} strokeWidth={2.5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - pathP(i)} />
        ))}
      </svg>
      {block(L, g.blocks[0])}
      {block(R, g.blocks[1])}
      <div style={{ position: 'absolute', left: g.mark.cx, top: g.mark.top, transform: `translate(-50%, ${(1 - markO) * 10}px)`, opacity: markO }}>
        <Mark size={g.mark.h} />
      </div>
      <Text x={490} y={g.ours.y} size={g.head} weight={500} color={TOKENS.inkSoft} align="center" o={oursO}>{MERGE.ours.head}</Text>
      <Text x={490} y={g.ours.y + 46} size={g.verb} weight={600} color={TOKENS.ink} align="center" o={oursO}>{MERGE.ours.verb}</Text>
    </div>
  );
};
