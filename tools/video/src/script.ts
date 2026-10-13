/**
 * Every word in the launch video, the accent colour, and the timing of every
 * beat — one file, so a copy change is one edit and the timings are checked
 * against the words they carry.
 *
 * Source: docs/ads/LAUNCH-VIDEO.md, §2 (scene table) and §3 (15s cuts), as
 * settled on October 13, 2026:
 *   - Captions only. The on-screen text IS the caption script; the doc's VO
 *     column is not used. The 9:16 renders burn it in; the 16:9 film also
 *     ships an .srt of the same cues.
 *   - No "free mock" anywhere. Every call to action is CTA below.
 *   - "Hosted on Cloudflare's network" is out of the film.
 *   - Prices and the beta offer come from src/data/site.js. Nothing here
 *     types a number that site.js owns.
 *
 * The reading-time rule (§5 of the doc): every text card stays on screen for
 * at least twice its reading time, at READ_WORDS_PER_SECOND. Cards that are
 * on screen together are read together, so each is held to their combined
 * word count. checkReadingTime() enforces it; Root.tsx calls it, so the
 * studio and every render refuse to start on a card that is too short.
 *
 * Node runs this file directly (type stripping), for `npm run table`, so:
 * erasable TypeScript only — no enums, no namespaces, extensions on imports.
 */
import { BETA, BETA_PERCENT } from '../../../src/data/site.js';

// A beta ad that renders while the site is out of beta would advertise an
// offer the site no longer makes. Stop instead.
if (!BETA.on) {
  throw new Error('BETA.on is false in src/data/site.js: the launch video is a beta ad. Turn beta on, or rewrite the offer.');
}

/* Colour ------------------------------------------------------------------ */

/** The one accent, as on the site (--accent). */
export const ACCENT = '#2f3dd6';

/** The site's other tokens, for the drawings. Not an accent; not to be
 *  used for emphasis. */
export const TOKENS = {
  bg: '#ffffff',
  bgAlt: '#f6f7f9',
  ink: '#0a0a0c',
  inkSoft: '#4a4f58',
  inkMuted: '#6b7079',
  line: '#e6e7eb',
  lineInput: '#868c95',
  dot: '#d2d5db',
  accentSoft: 'rgba(47, 61, 214, 0.08)',
  black: '#0a0a0c',
};

/* Copy -------------------------------------------------------------------- */

export const OFFER = `${BETA_PERCENT} off for the first ${BETA.seats} businesses.`;
export const CTA = 'Join the list at getyourwebsite.now/beta';

export const COPY = {
  hook: 'Your phone should be ringing. Not your to-do list.',
  bind: 'Do it yourself. Or pay an agency for meetings.',
  third: 'Done for you. Without the agency bill.',
  builtFrom: 'Built from your real business info. Not a template.',
  fictional: 'Cedar & Stone is a fictional example.',
  click: 'Click it. Say what to change.',
  person: 'A person checks every change before it goes live.',
  oneButton: 'You choose which version is live. One button.',
  domain: 'Your domain, handled. One plan covers it.',
  tagline: 'You stay on the job.',
  endBeta: 'Now in beta.',
  endOffer: OFFER,
  endCta: CTA,
  /** The 15s cuts' end card: the offer in fewer words, because a 15s ad
   *  cannot hold the film's 15-word card for 7.5s and still say anything
   *  else. Same facts: beta, the discount, the seats, the CTA. */
  adOffer: `Beta: ${OFFER}`,
  offerHook: `Now in beta. ${OFFER}`,
};

/** The merge diagram: the same names, headers and verbs as the site's
 *  (src/components/anim/MergeAnim.astro). Diagram labels, not text cards. */
export const MERGE = {
  diy: { head: 'If you build it yourself', verb: 'You do the work', names: ['Squarespace', 'Wix', 'Replit'] },
  agency: { head: 'If you hire an agency', verb: 'They do the work', names: ['Design studios', 'Freelancers', 'Dev shops'] },
  ours: { head: 'GetYourWebsite', verb: 'We do the work' },
};

/** The example business, as public/landscaping.html describes it. The
 *  domain is the fictional one the site's own email uses: cedarandstone.com
 *  is someone else's live site. */
export const EXAMPLE = {
  name: 'Cedar & Stone Landscaping',
  area: 'Hudson Valley',
  what: 'Garden design, build and care',
  heading: 'Gardens that get better every year.',
  domain: 'cedarandstone.example',
  owner: 'Cedar & Stone',
  change: 'Add 24/7 emergency service',
};

/* Timing ------------------------------------------------------------------ */

export const FPS = 30;
export const READ_WORDS_PER_SECOND = 4;
export const HOLD_MULTIPLE = 2;

export type SceneId =
  | 'hook' | 'merge' | 'collapse' | 'form' | 'site' | 'click' | 'person'
  | 'tree' | 'domain' | 'tagline' | 'end' | 'endShort' | 'offerHook';

export type Cue = {
  text: string;
  /** Seconds from the start of the beat. */
  from: number;
  /** Seconds from the start of the beat; defaults to the beat's end. */
  to?: number;
  kind: 'headline' | 'lowerThird' | 'endCard';
  /** An end card's lines, styled separately; `text` is them joined. */
  lines?: string[];
};

export type Beat = {
  scene: SceneId;
  seconds: number;
  cues: Cue[];
  /** Scene-specific options, e.g. a shortened drawing for a 15s cut. */
  variant?: string;
};

const headline = (text: string, from = 0.3): Cue => ({ text, from, kind: 'headline' });

const endCard = (lines: string[], from = 0.4): Cue => ({ text: lines.join(' '), lines, from, kind: 'endCard' });

/** The 52s film, both aspect ratios. */
export const FILM: Beat[] = [
  { scene: 'hook', seconds: 5.0, cues: [headline(COPY.hook)] },
  { scene: 'merge', seconds: 5.2, cues: [headline(COPY.bind)] },
  { scene: 'collapse', seconds: 4.0, cues: [headline(COPY.third)] },
  { scene: 'form', seconds: 5.0, cues: [headline(COPY.builtFrom)] },
  { scene: 'site', seconds: 4.5, cues: [{ text: COPY.fictional, from: 0.5, kind: 'lowerThird' }] },
  { scene: 'click', seconds: 3.5, cues: [headline(COPY.click)] },
  { scene: 'person', seconds: 5.0, cues: [headline(COPY.person)] },
  { scene: 'tree', seconds: 5.0, cues: [headline(COPY.oneButton)] },
  { scene: 'domain', seconds: 4.0, cues: [headline(COPY.domain)] },
  { scene: 'tagline', seconds: 2.8, cues: [headline(COPY.tagline, 0.2)] },
  { scene: 'end', seconds: 8.0, cues: [endCard([COPY.endBeta, COPY.endOffer, COPY.endCta])] },
];

/** The three 15s vertical ads (§3), one proof beat each — see the table. */
export const ADS: Record<'V1' | 'V2' | 'V3', Beat[]> = {
  // Pain → product.
  V1: [
    { scene: 'hook', seconds: 4.9, cues: [headline(COPY.hook, 0.2)] },
    { scene: 'click', seconds: 3.3, cues: [headline(COPY.click, 0.2)], variant: 'short' },
    { scene: 'end', seconds: 6.8, cues: [endCard([COPY.adOffer, COPY.endCta], 0.2)] },
  ],
  // Positioning.
  V2: [
    { scene: 'collapse', seconds: 3.8, cues: [headline(COPY.third, 0.2)], variant: 'standalone' },
    { scene: 'tree', seconds: 4.3, cues: [headline(COPY.oneButton, 0.2)], variant: 'short' },
    { scene: 'end', seconds: 6.9, cues: [endCard([COPY.adOffer, COPY.endCta], 0.2)] },
  ],
  // Offer-forward: the offer is the hook, so the end card is the CTA alone.
  V3: [
    { scene: 'offerHook', seconds: 5.3, cues: [headline(COPY.offerHook, 0.2)] },
    { scene: 'person', seconds: 4.8, cues: [headline(COPY.person, 0.2)], variant: 'short' },
    { scene: 'endShort', seconds: 4.9, cues: [endCard([COPY.endCta], 0.2)] },
  ],
};

/* The rule ---------------------------------------------------------------- */

/** Words a reader reads: whitespace tokens, not counting lone punctuation
 *  such as a middle dot or a dash. */
export const words = (text: string) => text.split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;

export const frames = (seconds: number) => Math.round(seconds * FPS);
export const beatFrames = (beats: Beat[]) => beats.reduce((n, b) => n + frames(b.seconds), 0);

export type CueCheck = {
  beat: number;
  scene: SceneId;
  text: string;
  shown: number;
  needed: number;
  ok: boolean;
};

export function checkReadingTime(beats: Beat[]): CueCheck[] {
  const out: CueCheck[] = [];
  beats.forEach((b, beat) => {
    for (const c of b.cues) {
      const to = c.to ?? b.seconds;
      const together = b.cues.filter((o) => o.from < to && (o.to ?? b.seconds) > c.from);
      const n = together.reduce((sum, o) => sum + words(o.text), 0);
      const needed = (n / READ_WORDS_PER_SECOND) * HOLD_MULTIPLE;
      const shown = to - c.from;
      out.push({ beat, scene: b.scene, text: c.text, shown, needed, ok: shown + 1e-9 >= needed });
    }
  });
  return out;
}

export const CUTS = {
  Launch16x9: FILM,
  Launch9x16: FILM,
  Ad9x16_V1: ADS.V1,
  Ad9x16_V2: ADS.V2,
  Ad9x16_V3: ADS.V3,
} as const;

/** Remotion ids allow no "_": Ad9x16_V1 is registered as Ad9x16-V1. */
export const compositionId = (name: string) => name.replace(/_/g, '-');

export function assertReadingTime() {
  const bad: string[] = [];
  for (const [id, beats] of Object.entries(CUTS)) {
    for (const c of checkReadingTime(beats)) {
      if (!c.ok) bad.push(`${id} beat ${c.beat + 1} (${c.scene}): "${c.text}" is on for ${c.shown.toFixed(2)}s, needs ${c.needed.toFixed(2)}s`);
    }
  }
  if (bad.length) throw new Error(`Text cards shorter than ${HOLD_MULTIPLE}x reading time:\n  ${bad.join('\n  ')}`);
}
