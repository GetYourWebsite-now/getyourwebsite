/**
 * Site-wide data. Almost everything you'll want to change day to day lives
 * here rather than inside a page: contact details, nav links, the Our Work
 * grid and the pricing tiers.
 *
 * Where a value is still unset, the comment says so and says what the code
 * does without it. Nothing here silently degrades: an unset analytics code
 * emits no script, an unset portal URL renders no Sign in link.
 */

/** Where the contact form is delivered, and what shows in the footer. */
export const CONTACT_EMAIL = 'hello@getyourwebsite.now';

/**
 * Formspree form ID — the part after /f/ in the endpoint they give you
 * (e.g. "xyzabcd" from https://formspree.io/f/xyzabcd). It is pointed at
 * CONTACT_EMAIL above. The free plan covers 50 submissions a month.
 *
 * Both forms post here: /contact sends source=contact and /free-mock sends
 * source=free-mock, so the two can be told apart in the inbox. If this is
 * ever emptied, the contact form shows a notice and falls back to the email
 * address rather than failing silently.
 */
export const FORMSPREE_FORM_ID = 'xqpkrbez';

/**
 * Social links. None yet; the footer renders no social list while this is
 * empty rather than showing dead icons. Add entries as
 * { label: 'Instagram', href: 'https://instagram.com/...' } and the footer
 * picks them up.
 */
export const SOCIALS = [];

/**
 * The four links in the middle of the nav bar.
 *
 * Demo is deliberately not one of them: it is linked from How it works and
 * from the home page's platform section, which is where someone is actually
 * curious about it, and a shorter bar gives the CTA more room. Benefits is
 * gone entirely — merged into /why-us, with a redirect in astro.config.mjs.
 */
export const NAV_LINKS = [
  { label: 'Our Work', href: '/work' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Why Us', href: '/why-us' },
];

/**
 * Everything on /work, in two kinds.
 *
 *   kind: 'client'   real work, for people who paid us. Leads the page.
 *   kind: 'concept'  fictional businesses we built to show range.
 *
 * The distinction is the honest part and it must stay visible in the UI: a
 * concept site dressed as a client site is the single most damaging thing
 * this page could do.
 *
 * Client entries carry `sector`, three `built` bullets and a one-line
 * `outcome`. Every bullet has to be true of the shipped site today — the
 * facts below were checked against the live sites and the project repos in
 * October 2026, and where a figure is approximate it says so.
 *
 * Adding a concept mock is still a one-object job: drop the HTML in public/,
 * screenshot into public/shots/, add an entry.
 */
export const PROJECTS = [
  {
    slug: 'ark',
    kind: 'client',
    name: 'Allergy Rescue Kit',
    type: 'Emergency medical equipment',
    sector: 'Emergency medical equipment',
    href: 'https://allergyrescuekit.com',
    linkLabel: 'Open allergyrescuekit.com',
    shot: '/shots/ark-desktop.webp',
    shotPhone: '/shots/ark-phone.webp',
    blurb:
      'A storefront and a 51-state legal reference for a stock-epinephrine cabinet, in one static site.',
    built: [
      'A static Astro site: 14 pages plus 51 state pages generated from a verified state-law dataset — every state and DC.',
      'Built to WCAG AA contrast, checked across all 65 pages.',
      'No analytics, no trackers and no cookies: the live site contacts no third-party host at all.',
    ],
    outcome: 'Launched 10 September 2026, after 24 build rounds with the founder.',
  },
  {
    slug: 'chemed',
    kind: 'client',
    name: 'ChemEd 2027 Interest Map',
    type: 'Academic conference',
    sector: 'Academic conference',
    href: 'https://chemed-interest-map-production.up.railway.app/',
    linkLabel: 'Open the interest map',
    shot: '/shots/chemed-desktop.webp',
    shotPhone: '/shots/chemed-phone.webp',
    // The live map is seeded with sample attendees until registration opens,
    // so the figures in the screenshot are not real sign-ups. Saying so costs
    // nothing and not saying so would be the kind of quiet overstatement this
    // page exists to avoid.
    shotNote: 'Shown with sample attendees — the map is live ahead of registration opening.',
    blurb:
      'A public “who is coming?” map for a chemistry-education conference, running before registration opens.',
    built: [
      'A Next.js and Postgres web app for ChemEd 2027, at Eastern Michigan University on 11–15 July 2027.',
      'A typeahead over the full NCES school directory — about 131,000 public, private and postsecondary schools — so nobody types an address.',
      'Three views of the same data: clustered dots, a heatmap and a state choropleth, plus an organiser admin with CSV import and export.',
    ],
    outcome: 'Live before registration opens, so the conference can see where interest is building.',
  },
  {
    slug: 'bakery',
    kind: 'concept',
    name: "Rosa's Bakery",
    type: 'Bakery',
    href: '/bakery.html',
    shot: '/shots/bakery.webp',
    blurb: 'Warm, appetite-first layout where the daily menu and the address do the selling.',
  },
  {
    slug: 'dental',
    kind: 'concept',
    name: 'Bright Smile Dental',
    type: 'Dental practice',
    href: '/dental.html',
    shot: '/shots/dental.webp',
    blurb: 'Calm, trust-building design built around one job: getting an appointment booked.',
  },
  {
    slug: 'gym',
    kind: 'concept',
    name: 'Iron Forge Gym',
    type: 'Gym',
    href: '/gym.html',
    shot: '/shots/gym.webp',
    blurb: 'High-contrast and loud, with class times and membership tiers front and centre.',
  },
  {
    slug: 'auto',
    kind: 'concept',
    name: 'Redline Auto Repair',
    type: 'Auto repair',
    href: '/auto.html',
    shot: '/shots/auto.webp',
    blurb: 'Industrial and direct — services, upfront pricing and a phone number you can hit from anywhere.',
  },
  {
    slug: 'landscaping',
    kind: 'concept',
    name: 'Cedar & Stone Landscaping',
    type: 'Landscaping',
    href: '/landscaping.html',
    shot: '/shots/landscaping.webp',
    blurb: 'Organic and photo-led, with a seasonal service list and a quote request that takes 20 seconds.',
  },
  {
    slug: 'restaurant',
    kind: 'concept',
    name: 'Vela Kitchen',
    type: 'Restaurant',
    href: '/restaurant.html',
    shot: '/shots/restaurant.webp',
    blurb: 'Editorial and confident, with a full menu, hours and reservations without a single PDF.',
  },
];

/*
 * There is no PROOF export any more. The home page carried a strip of
 * figures; with only two we could stand behind — client projects live, and
 * when the first went live — it duplicated the "Live for …" line in the hero
 * and read as an admission of being new. It comes back when there is a third
 * real number to put beside them, and the bar for that has not moved: each
 * figure has to be something a visitor could check, or that we can show the
 * working for. The accessibility measurement in tools/ is the closest
 * candidate; see the Phase 2 fixes commit for what it would still need.
 */

/** The real client work. This is what leads both /work and the home page. */
export const CLIENT_PROJECTS = PROJECTS.filter((p) => p.kind === 'client');

/** The fictional mocks, shown after the client work and labelled as such. */
export const CONCEPT_PROJECTS = PROJECTS.filter((p) => p.kind === 'concept');

/** Kept as the home page's name for the client pair. */
export const FEATURED_PROJECTS = CLIENT_PROJECTS;

/**
 * Pricing.
 *
 * Three one-time build tiers and one recurring Care plan. This is the only
 * place in the repo that holds a price — /pricing and the home teaser both
 * read it, so they cannot drift apart again.
 *
 * Three rules that shaped what is NOT here:
 *
 *   No delivery times. The only real data point we have is Allergy Rescue
 *   Kit at 24 build rounds, which supports no defensible build estimate. A
 *   timeline we invent is a timeline we miss. The only time promise on the
 *   site is the reply one: within one business day.
 *
 *   Examples point at real client work only, never at a concept site. A
 *   tier with no real example yet renders none — see Growth. Allergy Rescue
 *   Kit sits under Custom rather than Growth because it is 65 pages, 51 of
 *   them generated from a state-law dataset; "up to 10 pages" would be the
 *   first thing a sceptical reader checked and caught.
 *
 *   The Care plan's "switchable from the portal" is deliberate wording and
 *   it is true today: the client portal's HostingPanel has a "Host this
 *   version" button wired to POST /api/client/hosting/version. If that ever
 *   stops being client-facing, soften this to "we switch it for you on
 *   request" rather than leaving it.
 */
export const TIERS = [
  {
    id: 'launch',
    kind: 'build',
    name: 'Launch',
    price: '$900',
    period: 'one-time',
    tagline: 'A proper site for a business that mainly needs to be findable and contactable.',
    features: [
      'Up to 5 pages, built from your free mock',
      '2 revision rounds',
      'A contact form that reaches your inbox',
      'Mobile-first, on every screen',
      'Basic on-page SEO: titles, descriptions, sitemap',
      'Launched on your own domain',
    ],
  },
  {
    id: 'growth',
    kind: 'build',
    name: 'Growth',
    price: '$1,600',
    period: 'one-time',
    popular: true,
    tagline: 'For a business that sells from the site — bookings, quotes, and copy that works.',
    features: [
      'Everything in Launch',
      'Up to 10 pages',
      'Booking, scheduling or quote-form integration',
      'A copywriting pass on every page',
      'Google Business Profile tune-up',
      '4 revision rounds',
      'We handle your photos and assets',
    ],
  },
  {
    id: 'custom',
    kind: 'build',
    name: 'Custom',
    price: 'from $3,000',
    period: 'one-time',
    tagline: 'When the site is really an application.',
    features: [
      'Web apps and data-driven sites: interactive maps, state-by-state content, calculators, client portals',
      'Integrations with the tools you already use',
      'Scoped and quoted per project',
    ],
    examples: [
      { name: 'Allergy Rescue Kit', href: 'https://allergyrescuekit.com' },
      {
        name: 'ChemEd 2027 Interest Map',
        href: 'https://chemed-interest-map-production.up.railway.app/',
      },
    ],
  },
  {
    id: 'care',
    kind: 'care',
    name: 'Care plan',
    price: '$49',
    period: '/mo',
    priceYearly: '$490',
    periodYearly: '/yr',
    yearlyNote: 'two months free',
    tagline: 'Required to host with us.',
    features: [
      "Hosting on Cloudflare's network",
      'Domain and SSL managed for you',
      'Every version of your site kept, and switchable from the portal',
      'One revision credit a month, rolling over up to three',
      'Uptime monitoring',
      'Email support, reply within one business day',
    ],
    footnote: 'Required to host with us. Cancel any time; we hand over the files.',
  },
];

/** The three one-time tiers, for the cards and the comparison table. */
export const BUILD_TIERS = TIERS.filter((t) => t.kind === 'build');

/** The Care plan, which is a different shape and gets its own card. */
export const CARE_PLAN = TIERS.find((t) => t.kind === 'care');

/** The four things that are true whichever tier someone picks. */
export const EVERY_PLAN_INCLUDES = [
  'Your own domain',
  'Every version kept',
  'A person reviews every change',
  'No templates, no page builders',
];

/**
 * The comparison table. Rows are rendered in order; each row's `cells` are
 * in BUILD_TIERS order. `true` renders a check, `false` renders a dash,
 * a string renders as-is.
 */
export const PRICING_COMPARISON = [
  { label: 'Pages', cells: ['Up to 5', 'Up to 10', 'Scoped per project'] },
  { label: 'Revision rounds', cells: ['2', '4', 'Scoped per project'] },
  { label: 'Contact form', cells: [true, true, true] },
  { label: 'Booking / quote integration', cells: [false, true, true] },
  { label: 'Copywriting pass', cells: [false, true, true] },
  { label: 'Google Business Profile', cells: [false, true, true] },
  { label: 'Custom features & integrations', cells: [false, false, true] },
  { label: 'Hosting & domain', cells: ['via Care plan', 'via Care plan', 'via Care plan'] },
  { label: 'Who builds it', cells: ['Us, by hand', 'Us, by hand', 'Us, by hand'] },
];

export const PRICING_DISCLAIMER =
  "Final quote after we've seen your free mock. Most businesses land in Launch " +
  "or Growth; we'll tell you which before you pay anything.";

/**
 * The pricing FAQ. Plain answers to the things people actually ask before
 * they pay, including the ones it would be more comfortable to leave out.
 */
export const PRICING_FAQ = [
  {
    q: 'What do I pay, and when?',
    a: "50% deposit when you approve the mock and pick a tier; the balance when the site goes live on your domain. Paid by card through a Stripe checkout link we send you.",
  },
  {
    q: 'Do I have to take the Care plan?',
    a: "Only if you want us to host it. Custom domains are tied to the Care plan because that's what pays for hosting, SSL and keeping every version. If you'd rather host it yourself, we hand over the files and you're done.",
  },
  {
    q: 'What counts as a revision round?',
    a: 'One batch of changes, sent together, that we apply as a new version. Three small tweaks in one message is one round; three messages on three days is three.',
  },
  {
    q: 'Can I change tiers later?',
    a: "Yes. Going up is the price difference; going down isn't a thing, because the work is already done.",
  },
  {
    q: 'What if I already have a website?',
    a: 'We rebuild it from scratch, moving across whatever is worth keeping. You keep your domain, and nothing goes offline during the switch.',
  },
  {
    q: 'Who owns the site?',
    a: 'You do, once it\'s paid for. Code, content, domain. The portal is ours; the site is yours.',
  },
];

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
 * Unset. Sign up free at https://www.goatcounter.com and put the site code
 * here — just the code, not the full URL; for `rosas.goatcounter.com` that
 * is `rosas`. While it is empty no analytics script is emitted at all,
 * which is the current state and a deliberate one.
 *
 * GoatCounter over Plausible: no cookies, no consent banner needed, nothing
 * personal stored, and the script is about 3KB. It's free for non-commercial
 * use and cheap otherwise. The tag is `defer`red so it can never block a paint
 * or add to Total Blocking Time.
 */
export const GOATCOUNTER_ID = '';

/**
 * Meta (Facebook) Pixel ID, for the ad campaigns that will point at
 * /free-mock.
 *
 * Leave empty until the privacy page's "Cookies and tracking" section has
 * been updated to disclose the Meta Pixel. Setting this without that edit
 * makes the privacy page false.
 *
 * While it is empty BaseLayout emits nothing at all — no script tag, no
 * comment, no connection to facebook.net. When it is set it loads the pixel
 * on every page, fires PageView, and fires a Lead event on
 * /free-mock/thanks.
 */
export const META_PIXEL_ID = '';

/**
 * The client portal, for the "Sign in" link in the header and footer.
 *
 * Unset. Set it to https://portal.getyourwebsite.now once that subdomain is
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
 * LEGAL_NAME must match the name on the LLC's Michigan filing exactly.
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
/**
 * The founders' names, school and town, for the "Who we are" section on
 * /why-us. Empty by default and rendered only when it is not: putting two
 * students' names and their school on a public page is Jack's call to make,
 * not a default to inherit. The section reads correctly without it.
 *
 * Example: 'Jack and Zane, seniors at <school>, <town> Michigan'
 */
export const TEAM_NAMES = '';

export const LEGAL_NAME = 'GetYourWebsite LLC';
export const LEGAL_STATE = 'Michigan';
export const LEGAL_UPDATED = 'October 3, 2026';
