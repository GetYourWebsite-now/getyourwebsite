/**
 * How big each drawing is on screen, and whether its text is big enough.
 *
 * The rule (October 13, 2026):
 *   - A drawing fills ~70% of the frame's width in 16:9 and ~85% in 9:16,
 *     vertically centred in the band under the headline. If that would make
 *     it taller than the band, it is scaled to the band instead.
 *   - It is scaled as one unit. In 9:16 the three wide drawings (form,
 *     click-to-change, domain card) have their own stacked layout with
 *     larger type, as the site's version tree does on a phone; each layout
 *     is then scaled as one unit.
 *   - Its smallest text must come out at ≥ 28px in 16:9 and ≥ 34px in 9:16.
 *     The version tree in 16:9 runs at 86% of the width to get there: its
 *     geometry is the site's, shared, and not ours to change.
 *   - The phone in the site scene is exempt from the floor: it shows a real
 *     page at that page's own type sizes, and the headline carries the
 *     beat. It fills its band's height in both formats instead.
 *
 * assertTextSize() enforces the floor; Root.tsx and render.mjs call it.
 *
 * `minText` is each drawing's smallest font size in its own units, and
 * `smallest` names what that text is, so the number can be checked against
 * the drawing. Change a font in a drawing → change it here.
 *
 * Pure TypeScript: Node runs it for `npm run table`, Remotion for the frames.
 */

export type Format = 'landscape' | 'portrait';

export const FORMATS = {
  landscape: { W: 1920, H: 1080, frac: 0.7, band: { top: 260, bottom: 1040 }, minText: 28, headSize: 64 },
  portrait: { W: 1080, H: 1920, frac: 0.85, band: { top: 500, bottom: 1600 }, minText: 34, headSize: 72 },
} as const;

/** A drawing's box in its own units. x/y crop to its content where the
 *  drawing's coordinate box is larger than what it draws. */
export type Box = { x?: number; y?: number; w: number; h: number; minText: number; smallest: string; frac?: number };

export const DRAWINGS: Record<string, Record<Format, Box>> = {
  merge: {
    landscape: { x: 160, y: 30, w: 1320, h: 400, minText: 28, smallest: 'column headers' },
    portrait: { x: 30, y: 0, w: 920, h: 870, minText: 35, smallest: 'column headers' },
  },
  form: {
    landscape: { w: 640, h: 470, minText: 17, smallest: 'field labels' },
    portrait: { w: 520, h: 480, minText: 20, smallest: 'field labels' },
  },
  clickToChange: {
    // In its well: the drawing plus 24px padding (16px in 9:16) each side.
    landscape: { w: 568, h: 328, minText: 12, smallest: 'Live pill, In review / Approved chips, "Reviewed by a person"' },
    portrait: { w: 452, h: 484, minText: 17, smallest: 'Live pill, chips, Send, "Reviewed by a person"' },
  },
  versionTree: {
    landscape: { w: 700, h: 330, minText: 12, smallest: '"Approved" captions, Live pill, browser URL', frac: 0.86 },
    portrait: { w: 420, h: 460, minText: 16, smallest: '"Approved" captions, Live pill, browser URL' },
  },
  domainConnect: {
    landscape: { w: 400, h: 212, minText: 12, smallest: 'Live pill' },
    portrait: { w: 420, h: 360, minText: 16, smallest: 'URL, Live pill' },
  },
};

export type Placement = { s: number; left: number; top: number; width: number; height: number; widthShare: number; heightBound: boolean };

export function place(format: Format, box: { w: number; h: number; frac?: number }, band?: { top: number; bottom: number }): Placement {
  const F = FORMATS[format];
  const b = band ?? F.band;
  const byWidth = ((box.frac ?? F.frac) * F.W) / box.w;
  const byHeight = (b.bottom - b.top) / box.h;
  const s = Math.min(byWidth, byHeight);
  const width = box.w * s, height = box.h * s;
  return { s, width, height, left: (F.W - width) / 2, top: b.top + (b.bottom - b.top - height) / 2, widthShare: width / F.W, heightBound: byHeight < byWidth };
}

/* The end card ---------------------------------------------------------------- */

/** Mark ≥ 160 / 200px; the offer line at headline size; CTA text ≥ 32 / 36px.
 *  The 9:16 card stays centred above the bottom 320px (Scenes.tsx). */
export const END_CARD = {
  landscape: { mark: 160, wordmark: 40, beta: 40, offer: FORMATS.landscape.headSize, cta: 36 },
  portrait: { mark: 200, wordmark: 44, beta: 44, offer: FORMATS.portrait.headSize, cta: 40 },
} as const;

/* The hook ------------------------------------------------------------------- */

/** 16:9 only: the workbench and phone at ~50% of the frame's width, centred
 *  in the band under the headline. No text in it, so no floor applies. */
export const HOOK_BOX = { w: 900, h: 640, frac: 0.5 } as const;

/* The phone in the site scene ---------------------------------------------- */

/** No headline in that beat, so the phone gets the frame's height less a
 *  margin (16:9), or the band under the lower third (9:16). */
export const PHONE_BAND = {
  landscape: { top: 80, bottom: 1000 },
  portrait: { top: 400, bottom: 1600 },
} as const;
/** Screen 390 × 844 CSS px, plus a 4.5% bezel each side. */
export const phoneScreenWidth = (format: Format) => {
  const b = PHONE_BAND[format];
  return Math.floor((b.bottom - b.top) / (844 / 390 + 0.09));
};
/** The captured page's smallest visible text, in CSS px, measured above the
 *  cut with the badge hidden: the eyebrow ("Hudson Valley · Est. 2011") and
 *  the season labels, 12px. */
export const CAPTURE_MIN_TEXT = 12;

/* The check ------------------------------------------------------------------ */

export type SizeRow = { drawing: string; format: Format; scale: number; widthShare: number; heightBound: boolean; smallestPx: number; floor: number; ok: boolean; exempt?: boolean; smallest: string };

export function checkTextSize(): SizeRow[] {
  const rows: SizeRow[] = [];
  for (const format of ['landscape', 'portrait'] as const) {
    for (const [drawing, boxes] of Object.entries(DRAWINGS)) {
      const box = boxes[format];
      const p = place(format, box);
      const smallestPx = box.minText * p.s;
      rows.push({ drawing, format, scale: p.s, widthShare: p.widthShare, heightBound: p.heightBound, smallestPx, floor: FORMATS[format].minText, ok: smallestPx >= FORMATS[format].minText - 1e-9, smallest: box.smallest });
    }
    const sw = phoneScreenWidth(format);
    rows.push({ drawing: 'phone (captured page)', format, scale: sw / 390, widthShare: (sw * 1.09) / FORMATS[format].W, heightBound: true, smallestPx: CAPTURE_MIN_TEXT * (sw / 390), floor: FORMATS[format].minText, ok: CAPTURE_MIN_TEXT * (sw / 390) >= FORMATS[format].minText, exempt: true, smallest: 'the page\'s own eyebrow text (exempt: a real page)' });
  }
  return rows;
}

export function assertTextSize() {
  const bad = checkTextSize().filter((r) => !r.ok && !r.exempt);
  if (bad.length) {
    throw new Error(`Drawing text under the floor:\n  ${bad.map((r) => `${r.format} ${r.drawing}: ${r.smallestPx.toFixed(1)}px, needs ${r.floor}px (${r.smallest})`).join('\n  ')}`);
  }
}
