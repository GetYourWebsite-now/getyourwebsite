/**
 * Site-wide data. Almost everything you'll want to change day to day lives
 * here rather than inside a page: contact details, nav links, the Our Work
 * grid and the pricing tiers.
 *
 * Anything marked [EDIT] is a placeholder Jack still needs to fill in.
 * There's a full list of them at the bottom of README.md.
 */

/** [EDIT] Where the contact form is delivered and what shows in the footer. */
export const CONTACT_EMAIL = 'hello@getyourwebsite.now';

/**
 * [EDIT] Formspree form ID — the part after /f/ in the endpoint they give you
 * (e.g. "xyzabcd" from https://formspree.io/f/xyzabcd). Create a form at
 * https://formspree.io, point it at CONTACT_EMAIL above, and paste the ID here.
 * Free plan covers 50 submissions a month.
 * Until this is a real ID the contact form shows a friendly notice and falls
 * back to the email address, so nothing silently disappears.
 */
export const FORMSPREE_FORM_ID = 'xqpkrbez';

/** [EDIT] Social links. Delete any you don't want — the footer adapts. */
export const SOCIALS = [
  // { label: 'Instagram', href: 'https://instagram.com/...' }, // [EDIT]
  // { label: 'TikTok', href: 'https://tiktok.com/@...' },      // [EDIT]
];

/** The five links that sit in the middle of the nav bar. */
export const NAV_LINKS = [
  { label: 'Our Work', href: '/work' },
  { label: 'Demo', href: '/demo' },
  { label: 'Pricing', href: '/pricing' },
  // "How it works" took the slot Benefits used to hold. Six links plus the gold
  // CTA plus Sign in overflowed the header at the width the burger hands over
  // at — there were 81px of slack before any of this was added. Benefits is
  // still a live page, linked from the home page and the footer.
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Why Us', href: '/why-us' },
];

/**
 * The Our Work grid. Adding a new mock site is a one-object job: drop the
 * HTML file in public/, take a screenshot into public/shots/, add an entry.
 */
export const PROJECTS = [
  {
    slug: 'bakery',
    name: "Rosa's Bakery",
    type: 'Bakery',
    href: '/bakery.html',
    shot: '/shots/bakery.webp',
    blurb: 'Warm, appetite-first layout where the daily menu and the address do the selling.',
    featured: true,
  },
  {
    slug: 'dental',
    name: 'Bright Smile Dental',
    type: 'Dental practice',
    href: '/dental.html',
    shot: '/shots/dental.webp',
    blurb: 'Calm, trust-building design built around one job: getting an appointment booked.',
    featured: true,
  },
  {
    slug: 'gym',
    name: 'Iron Forge Gym',
    type: 'Gym',
    href: '/gym.html',
    shot: '/shots/gym.webp',
    blurb: 'High-contrast and loud, with class times and membership tiers front and centre.',
    featured: true,
  },
  {
    slug: 'auto',
    name: 'Redline Auto Repair',
    type: 'Auto repair',
    href: '/auto.html',
    shot: '/shots/auto.webp',
    blurb: 'Industrial and direct — services, upfront pricing and a phone number you can hit from anywhere.',
  },
  {
    slug: 'landscaping',
    name: 'Cedar & Stone Landscaping',
    type: 'Landscaping',
    href: '/landscaping.html',
    shot: '/shots/landscaping.webp',
    blurb: 'Organic and photo-led, with a seasonal service list and a quote request that takes 20 seconds.',
  },
  {
    slug: 'restaurant',
    name: 'Vela Kitchen',
    type: 'Restaurant',
    href: '/restaurant.html',
    shot: '/shots/restaurant.webp',
    blurb: 'Editorial and confident, with a full menu, hours and reservations without a single PDF.',
  },
];

/**
 * The home page proof strip. Facts about us, not page counts.
 *
 * The rule from CLAUDE.md applies here harder than anywhere: no invented
 * statistics. Every figure has to be something we can stand behind, and
 * `note` says on what basis.
 *
 * Two things are deliberately NOT here:
 *
 *   Page counts. The first version of this strip was "2 / 65 / 51", but two
 *   of those three were page counts of a single client's site, which reads
 *   as one fact padded out to three.
 *
 *   An accessibility claim. Both client sites were measured — 66 pages,
 *   7,180 text nodes — and the handful of flags were false positives of a
 *   colour-only method (white headings over photographs, which pixel-sample
 *   at 3.6–3.7:1 and pass as large text, plus visually-hidden skip links).
 *   That is good evidence, but it is not a WCAG AA conformance claim: AA
 *   covers alt text, focus order, labels and landmarks, none of which was
 *   tested. Measure those properly and this can become a third figure.
 *
 * Re-check when a client project changes.
 */
export const PROOF = {
  figures: [
    {
      value: '2',
      label: 'live client projects',
      note: 'Allergy Rescue Kit and the ChemEd 2027 interest map',
    },
    {
      value: 'Sept 2026',
      label: 'first client site went live',
      note: 'Allergy Rescue Kit',
    },
  ],
  // A footnote, not body copy, and not hover-only — a title attribute would
  // hide the sourcing from anyone on a phone or a keyboard.
  footnote:
    'Both projects are publicly reachable; allergyrescuekit.com is linked ' +
    'from the hero above. Checked 7 October 2026.',
};

/** Just the three we lead with on the home page. */
export const FEATURED_PROJECTS = PROJECTS.filter((p) => p.featured);

/**
 * Pricing tiers. All prices are [EDIT] placeholders — change the `price`
 * strings here and the pricing page and home teaser both update.
 */
export const TIERS = [
  {
    id: 'launch',
    name: 'Launch',
    price: '$150', // [EDIT: e.g. $150]
    tagline: 'Everything a small business actually needs, done properly.',
    pages: 'Up to 3 pages',
    revisions: '2 revision rounds',
    design: 'Clean template-based design, customised to your brand',
    delivery: '1–2 weeks',
    like: "A site like Rosa's Bakery",
    likeHref: '/bakery.html',
    features: [
      'Up to 3 pages',
      '2 revision rounds',
      'Template-based design customised to your brand',
      'Contact form that reaches your inbox',
      'Mobile-friendly on every screen',
    ],
  },
  {
    id: 'orbit',
    name: 'Orbit',
    price: '$350', // [EDIT: e.g. $350]
    tagline: 'A fully custom site with room to show everything you offer.',
    pages: 'Up to 6 pages',
    revisions: '4 revision rounds',
    design: 'Fully custom design, built around your brand',
    delivery: '2–3 weeks',
    like: 'A site like Bright Smile Dental',
    likeHref: '/dental.html',
    popular: true,
    features: [
      'Up to 6 pages',
      '4 revision rounds',
      'Fully custom design — no template',
      'Extra sections: menus, galleries, booking links',
      'Basic SEO setup so you turn up on Google',
      'Contact form that reaches your inbox',
    ],
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    price: '$600+', // [EDIT: e.g. $600+]
    tagline: 'The full build, with the details that make people stay.',
    pages: '8+ pages',
    revisions: '6 revision rounds',
    design: 'Fully custom design with animation and advanced features',
    delivery: 'Priority turnaround',
    like: 'A site like Iron Forge Gym — and beyond',
    likeHref: '/gym.html',
    features: [
      '8+ pages',
      '6 revision rounds',
      'Fully custom design with animation',
      'Advanced features built to order',
      'Full SEO setup',
      'Priority turnaround',
    ],
  },
];

export const PRICING_DISCLAIMER =
  'Example pricing. Every business is different — send an inquiry and we’ll reply with a personal quote after we review it.';

/**
 * Which typeface the headings use. Body and mono are unaffected.
 *
 *   'inter'   — the default, and also the body face. Headings are separated
 *               from body text by size, weight and Inter's optical-size axis
 *               rather than by being a different family. That restraint is
 *               the point: one grotesque, set well, is what the fintech sites
 *               this design follows actually do.
 *   'clash'   — Clash Display, self-hosted (Fontshare, ITF Free Font License)
 *   'cabinet' — Cabinet Grotesk, self-hosted (Fontshare, ITF Free Font License)
 *   'sora'    — Sora, self-hosted (Google Fonts, SIL Open Font License 1.1)
 *
 * The three alternatives are kept for comparison only. Changing this line is
 * the whole switch: BaseLayout preloads the right file and points
 * `--font-display` at it, and every heading follows. Each face can carry its
 * own `track`, because a wider face has to be set tighter to hold the same
 * line counts.
 *
 * Run `node tools/font-compare.mjs` to see them side by side, and
 * `npm run verify:wraps` after any change — swapping the face changes the
 * width of every heading on the site, which is a question about forty
 * headings rather than the one you happened to look at.
 */
export const HEADING_FONT = 'inter';

/**
 * GoatCounter site code, for privacy-friendly visitor counts.
 *
 * [EDIT] Sign up free at https://www.goatcounter.com and put your site code
 * here — just the code, not the full URL. For `rosas.goatcounter.com` that's
 * `rosas`. Leave it empty and no analytics script is emitted at all.
 *
 * GoatCounter over Plausible: no cookies, no consent banner needed, nothing
 * personal stored, and the script is about 3KB. It's free for non-commercial
 * use and cheap otherwise. The tag is `defer`red so it can never block a paint
 * or add to Total Blocking Time.
 */
export const GOATCOUNTER_ID = '';

/**
 * The client portal, for the "Sign in" link in the header and footer.
 *
 * [EDIT] Set this to https://portal.getyourwebsite.now once that subdomain is
 * serving. It answered HTTP 522 (Cloudflare reached, origin did not) on every
 * attempt while this was built, and a Sign in button that lands on an error
 * page is worse than no button — so the link is built, styled and tested, and
 * simply doesn't render while this is empty. Filling it in is the whole switch.
 *
 * Clients are given accounts by us. The label is "Sign in" and never "Sign up"
 * or "Log in" — there is no self-serve registration and the wording must not
 * imply one.
 */
export const PORTAL_URL = '';

/**
 * The live site, used to prefill the PageSpeed Insights link on /how-it-works.
 *
 * Deliberately this site and not one of the mock client sites: every mock pulls
 * its photos from loremflickr.com, a random placeholder service, so its score
 * would swing on images we don't control and wouldn't represent what a client
 * actually receives. Point this at a real hosted client site once there is one.
 */
export const LIVE_SITE_URL = 'https://getyourwebsite.now';

/**
 * Legal pages (/privacy, /terms).
 *
 * [EDIT] LEGAL_NAME must match the name on the LLC's Michigan filing exactly.
 * One word, as the business is written everywhere else. Michigan's registry
 * displays every entity name in capitals whatever case it was filed in, so
 * "GETYOURWEBSITE LLC" in a search result does not contradict this. Check the
 * filing itself if it ever matters in a dispute. (The Cloudflare account says
 * "Get Your Website LLC" and Railway calls the team "GYW LLC"; neither is the
 * filing.) If the LLC isn't actually filed yet, fix that before relying on
 * these pages — terms that name an entity that doesn't exist protect no one.
 *
 * Bump LEGAL_UPDATED whenever either page changes in substance.
 */
export const LEGAL_NAME = 'GetYourWebsite LLC';
export const LEGAL_STATE = 'Michigan';
export const LEGAL_UPDATED = 'October 3, 2026';
