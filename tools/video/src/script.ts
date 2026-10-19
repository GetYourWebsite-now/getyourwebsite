/**
 * Every word in the V2 launch video and every beat's timing — one file, so a
 * copy change is one edit and the timings are checked against the words they
 * carry. Source: docs/ads/LAUNCH-VIDEO-V2.md, as settled on 17 October 2026.
 *
 *   - No voiceover. The captions are the script, burned into every render;
 *     the 16:9 film also ships an .srt of the same cues.
 *   - Prices, the discount, the seat count and the agency range come from
 *     src/data/site.js. Nothing here types a number site.js owns.
 *   - Every site and account on screen is labelled once, small, lower left:
 *     the portal is "Demo account" (Rosa's Bakery); Cedar & Stone is "a
 *     fictional example"; Allergy Rescue Kit is a real client, live; Andy's
 *     Auto Shop (only in Ad_AllWeNeed) is "Demo business", as /work says.
 *   - No claim about how long a build takes. After the form is sent, a
 *     "Sent ✓" state holds before the cut, so the build does not read as
 *     instant.
 *
 * The reading rule (§0): a caption stays up for at least 1.2× its reading
 * time at 4 words a second, and never less than 1.6s — or 1.2s for a caption
 * of four words or fewer. Captions on screen together are read together.
 * Root.tsx and render.mjs refuse to start on a failure, after the timeline is
 * snapped to the 120 BPM grid.
 *
 * Node runs this file directly (type stripping) for `npm run table`: erasable
 * TypeScript only, extensions on imports.
 */
import { BETA, BETA_PERCENT, MARKET_RANGES, STARTUP_TIERS, betaPrice, money } from '../../../src/data/site.js';

// A beta ad that renders while the site is out of beta would advertise an
// offer the site no longer makes. Stop instead.
if (!BETA.on) {
  throw new Error('BETA.on is false in src/data/site.js: the launch video is a beta ad. Turn beta on, or rewrite the offer.');
}

/* Colour ------------------------------------------------------------------ */

/** The one accent, as on the site (--accent). */
export const ACCENT = '#2f3dd6';

export const TOKENS = {
  bg: '#ffffff',
  bgAlt: '#f6f7f9',
  ink: '#0a0a0c',
  inkSoft: '#4a4f58',
  inkMuted: '#6b7079',
  line: '#e6e7eb',
  lineInput: '#6b7079',
  black: '#0a0a0c',
};

/* Copy -------------------------------------------------------------------- */

/** "$560": the lowest Startup tier at the beta price. */
export const FROM_PRICE = money(betaPrice(Math.min(...STARTUP_TIERS.map((t: { price: number }) => t.price))));
export const OFFER = `Beta: ${BETA_PERCENT} off for the first ${BETA.seats} businesses`;
/** The ads' end cards (2.5–3s) hold eight words under the reading rule, so
 *  they drop "Beta:" — the URL beside it carries it. */
export const OFFER_SHORT = `${BETA_PERCENT} off for the first ${BETA.seats} businesses`;
export const CTA = 'getyourwebsite.now/beta';
/** The /beta form's own button label. */
export const BETA_CTA = BETA.cta;
export const AGENCY_RANGE = `Typically ${money(MARKET_RANGES.agency.low)}–${money(MARKET_RANGES.agency.high)}`;

export const COPY = {
  hook: ['You run the business.', "You don't build websites.", 'We do.'],
  built: 'Built around your business. Not a template.',
  click: 'Click it. Say what to change.',
  person: 'A person checks it before it goes live.',
  oneButton: 'You pick which version is live. One button.',
  hosted: 'Live on your own domain. Kept current.',
  startup: `Startup from ${FROM_PRICE}`,
  demoAccount: 'Demo account',
  demoBusiness: 'Demo business',
  cedar: 'Cedar & Stone is a fictional example.',
  ark: 'Allergy Rescue Kit · real client · live since September 2026',
  sent: 'Sent',
  allWeNeed: 'This is all we need.',
  buildRest: 'We build the rest.',
  sayIt: 'Say it. We change it. A person checks it.',
};

/** What the drawn /beta form types: the two fields a business fills about
 *  itself, in Cedar & Stone's own words from its page. */
export const FORM = {
  business: 'Cedar & Stone Landscaping',
  about: 'Garden design, build and care',
};

/** Ad_AllWeNeed's card: only what andysauto.org itself shows. No phone, no
 *  hours (the site has neither yet) and no rating. */
export const ANDYS_CARD = [
  { label: 'Business', value: "Andy's Auto Shop" },
  { label: 'Trade', value: 'Auto repair' },
  { label: 'Services', value: 'Engine diagnostics · Brakes & suspension · Routine maintenance' },
];

/** Ad_Receipt. The agency range is the sourced one in site.js; nothing else
 *  on either receipt is a number. */
export const RECEIPTS = {
  agency: { head: 'AGENCY WEBSITE', lines: [AGENCY_RANGE, 'One-time'] },
  ours: { head: 'GETYOURWEBSITE', lines: [`Startup from ${FROM_PRICE}`, 'Built from your info', 'A person reviews every change'] },
};

/* Timing ------------------------------------------------------------------ */

export const FPS = 30;
export const READ_WORDS_PER_SECOND = 4;
export const HOLD_MULTIPLE = 1.2;
export const MIN_HOLD = 1.6;
export const MIN_HOLD_SHORT = 1.2;
export const SHORT_WORDS = 4;

export type SceneId =
  | 'hook' | 'build' | 'change' | 'switch' | 'hosted' | 'offer'
  | 'receipt' | 'allWeNeed' | 'assembleFast' | 'oneSentence' | 'endCard';

export type Cue = {
  text: string;
  /** Seconds from the start of the beat. */
  from: number;
  /** Seconds from the start of the beat; defaults to the beat's end. */
  to?: number;
  /** caption: burned-in caption. type: the picture is the words (hook,
   *  offer, receipts) — still held to the reading rule. */
  kind: 'caption' | 'type';
  /** The one word drawn in indigo (V2.1 §4). */
  accent?: string;
};

export type Beat = {
  scene: SceneId;
  seconds: number;
  cues: Cue[];
  /** Scene-specific options. */
  variant?: string;
  /** Snap this beat's END to the 120 BPM grid (§2). */
  snap?: boolean;
};

const cap = (text: string, accent: string, from = 0.15, to?: number): Cue => ({ text, accent, from, to, kind: 'caption' });
const typ = (text: string, from: number, to?: number, accent?: string): Cue => ({ text, accent, from, to, kind: 'type' });

/** Each hook card's share of the hook. */
export const HOOK_CARD = 1.3;

/** The 30.5s film, both aspect ratios (V2.1 pacing: the form 2.0s plus a
 *  0.7s "Sent ✓" hold after the click, and the assembly at least 3.0s inside
 *  the build; a dive in Change; Switch 4.0s; the end card held 4.0s after it
 *  lands). Cuts are on a 120 BPM grid. */
export const FILM: Beat[] = [
  { scene: 'hook', seconds: 4.0, snap: true, cues: [typ(COPY.hook[0], 0, HOOK_CARD, 'business'), typ(COPY.hook[1], HOOK_CARD, 2 * HOOK_CARD, 'websites'), typ(COPY.hook[2], 2 * HOOK_CARD, undefined, 'We')] },
  { scene: 'build', seconds: 6.0, snap: true, cues: [cap(COPY.built, 'template', 0.2)] },
  { scene: 'change', seconds: 6.5, snap: true, cues: [cap(COPY.click, 'change', 0.15, 2.6), cap(COPY.person, 'person', 2.6)] },
  { scene: 'switch', seconds: 4.0, snap: true, cues: [cap(COPY.oneButton, 'live', 0.15)] },
  { scene: 'hosted', seconds: 5.0, snap: true, cues: [cap(COPY.hosted, 'domain', 0.15)] },
  { scene: 'offer', seconds: 5.0, cues: [typ(COPY.startup, 0.35, undefined, FROM_PRICE), typ(OFFER, 0.6), typ(CTA, 0.9)] },
];

/** The three vertical ads (§4): three separate ideas, not cuts of the film. */
export const ADS: Record<'Receipt' | 'AllWeNeed' | 'OneSentence', Beat[]> = {
  Receipt: [
    {
      scene: 'receipt', seconds: 7.0, snap: true,
      cues: [
        typ([RECEIPTS.agency.head, ...RECEIPTS.agency.lines].join(' '), 0.2, 2.6),
        typ([RECEIPTS.ours.head, ...RECEIPTS.ours.lines].join(' '), 2.9),
      ],
    },
    { scene: 'endCard', seconds: 3.0, cues: [typ(`${OFFER_SHORT} ${CTA}`, 0.1)] },
  ],
  AllWeNeed: [
    { scene: 'allWeNeed', seconds: 3.8, snap: true, cues: [cap(COPY.allWeNeed, 'need', 1.4)] },
    { scene: 'assembleFast', seconds: 3.2, snap: true, cues: [cap(COPY.buildRest, 'rest', 0.6)] },
    { scene: 'endCard', seconds: 3.0, cues: [typ(`${OFFER_SHORT} ${CTA}`, 0.1)] },
  ],
  OneSentence: [
    { scene: 'oneSentence', seconds: 5.5, snap: true, cues: [cap(COPY.sayIt, 'person', 2.2)] },
    { scene: 'endCard', seconds: 2.5, cues: [typ(`${OFFER_SHORT} ${CTA}`, 0.1)] },
  ],
};

export const CUTS = {
  Launch16x9: FILM,
  Launch9x16: FILM,
  Ad_Receipt: ADS.Receipt,
  Ad_AllWeNeed: ADS.AllWeNeed,
  Ad_OneSentence: ADS.OneSentence,
} as const;
export type CutId = keyof typeof CUTS;


/** Remotion ids allow no "_": Ad_Receipt is registered as Ad-Receipt. */
export const compositionId = (name: string) => name.replace(/_/g, '-');

/* The reading rule -------------------------------------------------------- */

/** Words a reader reads: whitespace tokens with a letter or digit in them. */
export const words = (text: string) => text.split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;

export const frames = (seconds: number) => Math.round(seconds * FPS);
export const beatFrames = (beats: Beat[]) => beats.reduce((n, b) => n + frames(b.seconds), 0);

export const needed = (n: number) =>
  Math.max(n <= SHORT_WORDS ? MIN_HOLD_SHORT : MIN_HOLD, (n / READ_WORDS_PER_SECOND) * HOLD_MULTIPLE);

export type CueCheck = { beat: number; scene: SceneId; text: string; shown: number; needed: number; ok: boolean };

export function checkReadingTime(beats: Beat[]): CueCheck[] {
  const out: CueCheck[] = [];
  beats.forEach((b, beat) => {
    for (const c of b.cues) {
      const to = c.to ?? b.seconds;
      const together = b.cues.filter((o) => o.from < to && (o.to ?? b.seconds) > c.from);
      const n = together.reduce((sum, o) => sum + words(o.text), 0);
      const shown = to - c.from;
      out.push({ beat, scene: b.scene, text: c.text, shown, needed: needed(n), ok: shown + 1e-9 >= needed(n) });
    }
  });
  return out;
}

export function assertReadingTime(cuts: Record<string, Beat[]>) {
  const bad: string[] = [];
  for (const [id, beats] of Object.entries(cuts)) {
    for (const c of checkReadingTime(beats)) {
      if (!c.ok) bad.push(`${id} beat ${c.beat + 1} (${c.scene}): "${c.text}" is on for ${c.shown.toFixed(2)}s, needs ${c.needed.toFixed(2)}s`);
    }
  }
  if (bad.length) throw new Error(`Captions shorter than the reading rule:\n  ${bad.join('\n  ')}`);
}

/* The cut grid ------------------------------------------------------------ */

/** V2.1 is silent, but the cuts keep a 120 BPM grid so the rhythm survives:
 *  every snapped cut lands on a half second. */
export const GRID_BPM = 120;
const PERIOD = 60 / GRID_BPM;

/**
 * Snaps each `snap` beat's end to the grid: the nearest grid line at which
 * this beat's captions and the next beat's still pass the reading rule. The
 * beat after it absorbs the difference, so the cut's length doesn't change.
 */
export function snapBeats(beats: Beat[]): Beat[] {
  const out = beats.map((b) => ({ ...b, cues: b.cues.map((c) => ({ ...c })) }));
  const fits = (b: Beat, seconds: number) => seconds > 0 && checkReadingTime([{ ...b, seconds }]).every((c) => c.ok);
  let start = 0;
  for (let i = 0; i < out.length - 1; i++) {
    const b = out[i], next = out[i + 1];
    const end = start + b.seconds;
    if (b.snap) {
      const nearest = Math.round(end / PERIOD) * PERIOD;
      const candidates = [-2, -1, 0, 1, 2]
        .map((k) => Math.round((nearest + k * PERIOD) * FPS) / FPS)
        .sort((p, q) => Math.abs(p - end) - Math.abs(q - end));
      const pick = candidates.find((e) => fits(b, e - start) && fits(next, next.seconds - (e - end)));
      if (pick === undefined) throw new Error(`${b.scene}: no grid line near ${end.toFixed(2)}s keeps both beats readable`);
      next.seconds -= pick - end;
      b.seconds = pick - start;
    }
    start += b.seconds;
  }
  return out;
}
