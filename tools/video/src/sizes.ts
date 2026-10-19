/**
 * Frame layout for each format, and the text floor (§0): no drawn text under
 * 28px in 16:9 or 34px on 1080×1920. Real screen recordings are exempt —
 * they're framed so their own UI is as large as the frame allows.
 *
 * Every piece of drawn text has its size listed in TEXT, by format, in output
 * pixels (for the drawn /beta form: CSS size × the scale it is drawn at).
 * checkTextSize() holds each against the floor; Root.tsx and render.mjs
 * refuse to run on a failure.
 *
 * 9:16: the top 220px and the bottom 320px stay clear of text (TikTok and
 * Reels draw their own interface there). Captions sit in the upper band,
 * the picture below them.
 */
export type Format = 'landscape' | 'portrait';
export type Box = { x: number; y: number; w: number; h: number };

export const SAFE = { top: 220, bottom: 1600 };

/** 16:9: where the stage-dark caption band starts (its first 56px fade in).
 *  Devices pass behind it when the camera dives, so the caption always reads. */
export const BAND_TOP = 860;
/** 9:16: the caption band above the picture ends here (its last 56px fade
 *  out), just above the stage. */
export const PORTRAIT_BAND_BOTTOM = 556;

export const FORMATS = {
  // 16:9 (V2.1): the caption sits low-left in a stage-dark band at the
  // bottom, bottom at y 984, the indigo rule under it; the lower third at the
  // right of the band, below the rule's line; the devices above.
  landscape: {
    W: 1920, H: 1080, minText: 28,
    caption: { x: 120, y: 0, bottom: 984, w: 1680, size: 64 },
    stage: { x: 120, y: 52, w: 1680, h: 820 } as Box,
    label: { x: 120, y: 1018, size: 30, maxW: 1000, align: 'right' as const },
    hook: 110,
  },
  // 9:16: caption in the upper safe band from y 250, the picture below it
  // (560–1480), the lower third under the picture, above the safe line.
  portrait: {
    W: 1080, H: 1920, minText: 34,
    caption: { x: 70, y: 250, bottom: 0, w: 940, size: 72 },
    stage: { x: 40, y: 560, w: 1000, h: 920 } as Box,
    label: { x: 64, y: 1530, size: 36, maxW: 952, align: 'left' as const },
    hook: 128,
  },
} as const;

/** The /beta form is drawn at its real CSS sizes, then scaled: by this much. */
export const FORM_SCALE = { landscape: 2.6, portrait: 2.27 };
/** Its smallest text: the 15px labels and the "optional" marks. */
export const FORM_MIN_CSS = 15;

/** Device frame chrome: the URL bar's text. */
export const URL_TEXT = { landscape: 28, portrait: 34 };

/** Every piece of drawn text, by format, in output px. */
export const TEXT: Record<string, Record<Format, number>> = {
  caption: { landscape: FORMATS.landscape.caption.size, portrait: FORMATS.portrait.caption.size },
  hook: { landscape: FORMATS.landscape.hook, portrait: FORMATS.portrait.hook },
  'demo label': { landscape: FORMATS.landscape.label.size, portrait: FORMATS.portrait.label.size },
  'URL bar': URL_TEXT,
  '/beta form labels': { landscape: FORM_MIN_CSS * FORM_SCALE.landscape, portrait: FORM_MIN_CSS * FORM_SCALE.portrait },
  'offer: price': { landscape: 120, portrait: 120 },
  'offer: beta line': { landscape: 56, portrait: 60 },
  'offer: CTA button': { landscape: 40, portrait: 44 },
  'receipt: lines': { landscape: 46, portrait: 46 },
  'all-we-need card: labels': { landscape: 34, portrait: 36 },
  'all-we-need card: values': { landscape: 44, portrait: 46 },
};

export type SizeCheck = { what: string; format: Format; px: number; floor: number; ok: boolean };

export function checkTextSize(): SizeCheck[] {
  const out: SizeCheck[] = [];
  for (const [what, by] of Object.entries(TEXT)) {
    for (const format of ['landscape', 'portrait'] as Format[]) {
      const floor = FORMATS[format].minText;
      out.push({ what, format, px: by[format], floor, ok: by[format] >= floor });
    }
  }
  return out;
}

export function assertTextSize() {
  const bad = checkTextSize().filter((c) => !c.ok);
  if (bad.length) throw new Error(`Text under the floor:\n  ${bad.map((c) => `${c.what} (${c.format}): ${c.px}px < ${c.floor}px`).join('\n  ')}`);
}

/** Scale and place a `w × h` box to fit inside `into`, centred. */
export function fit(w: number, h: number, into: Box) {
  const s = Math.min(into.w / w, into.h / h);
  return { s, x: into.x + (into.w - w * s) / 2, y: into.y + (into.h - h * s) / 2, w: w * s, h: h * s };
}
