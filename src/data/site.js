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
 * Every form posts here: /contact sends source=contact, /beta sends
 * source=beta and /free-mock sends source=free-mock, so they can be told
 * apart in the inbox. If this is ever emptied, the contact form shows a
 * notice and falls back to the email address rather than failing silently.
 */
export const FORMSPREE_FORM_ID = 'xqpkrbez';

/**
 * Beta mode — one switch.
 *
 * While `on`, every primary call to action on the site reads `cta` and points
 * at `path`, the hero says we're in beta, Startup prices show the discount,
 * and nothing a visitor can read mentions the free mock: /free-mock and its
 * thank-you page build as redirects to /beta. Set `on` to false and all of
 * that reverses — /beta redirects to /free-mock and the free-mock wording
 * comes back. `npm run verify:beta` builds the site both ways and proves the
 * switch changes nothing else.
 *
 * `discount` applies to the Startup tiers only; Maintenance is list price
 * either way. /beta-terms says so, and reads these same numbers.
 */
export const BETA = {
  on: true,
  discount: 0.30,
  seats: 30,
  cta: 'Join the beta',
  path: '/beta',
};

// tools/beta-check.mjs builds once each way by setting GYW_BETA. Nothing else
// should set it; the line above is the switch. `typeof process` so the file
// still loads if a client-side script ever imports it.
const forcedBeta = typeof process !== 'undefined' ? process.env.GYW_BETA : undefined;
if (forcedBeta === 'on' || forcedBeta === 'off') BETA.on = forcedBeta === 'on';

/** "30%", from BETA.discount, for the sentences that quote it. */
export const BETA_PERCENT = `${Math.round(BETA.discount * 100)}%`;

/** The primary call to action, everywhere one appears: nav, hero, footer, closing bands. */
export const PRIMARY_CTA = BETA.on
  ? { label: BETA.cta, href: BETA.path }
  : { label: 'Get a free mock', href: '/free-mock' };

/** The same action, as worded on a pricing card. */
export const TIER_CTA = BETA.on
  ? { label: BETA.cta, href: BETA.path }
  : { label: 'Start with a free mock', href: '/free-mock' };

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
 * Everything on /work, in three kinds.
 *
 *   kind: 'client'    real work, for people who paid us.
 *   kind: 'platform'  a real site on a real domain that our platform built
 *                     and hosts, for a business that is not a paying client.
 *                     The proof that the hosting works; never call it a client.
 *   kind: 'concept'   fictional businesses we built to show range.
 *
 * The distinctions are the honest part and they must stay visible in the UI:
 * a concept site dressed as a client site is the single most damaging thing
 * this page could do, and a demo business dressed as a paying one is the
 * second.
 *
 * Client and platform entries carry `sector`, three `built` bullets and a
 * one-line `outcome`. Every bullet has to be true of the shipped site today —
 * the facts below were checked against the live sites and the project repos
 * in October 2026, and where a figure is approximate it says so.
 *
 * `hidden: true` keeps an entry's facts but renders it nowhere. ChemEd is
 * hidden: it is a one-off web app, not something we can build for a plumber,
 * so it stopped being an example of what we sell.
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
    hidden: true,
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
    slug: 'andys-auto',
    kind: 'platform',
    name: "Andy's Auto Shop",
    type: 'Auto repair',
    sector: 'Auto repair',
    href: 'https://andysauto.org',
    linkLabel: 'Open andysauto.org',
    shot: '/shots/andysauto-desktop.webp',
    shotPhone: '/shots/andysauto-phone.webp',
    // Checked against the live site, October 2026: generated by the platform
    // (its image-slot markup is in the page), served through Cloudflare, four
    // pages — Home, Services, About, Visit — and email as the only contact.
    // No phone number or hours yet; see BACKLOG.md before using it in an ad.
    shotNote: 'Demo business on a real domain, hosted on our platform.',
    blurb:
      "A real domain, built and hosted entirely on our platform: generated from the shop's information, custom domain connected, served from Cloudflare's network, every version kept.",
    built: [
      'Built by our software, not by hand.',
      'Hosted on our platform — the same hosting a client gets.',
      'Live at andysauto.org, on its own domain.',
    ],
    outcome: BETA.on
      ? 'Everything a beta client gets, on a live domain.'
      : 'Everything a client gets, on a live domain.',
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

/**
 * The live sites: real work on real domains, in the order every page shows
 * them. Allergy Rescue Kit first (a client), then Andy's Auto Shop (our
 * platform). /, /work, /why-us and /beta all read this, so the pair can only
 * be wrong in one place.
 */
export const LIVE_SITES = PROJECTS.filter(
  (p) => (p.kind === 'client' || p.kind === 'platform') && !p.hidden
);

/** The fictional mocks, shown after the live sites and labelled as such. */
export const CONCEPT_PROJECTS = PROJECTS.filter((p) => p.kind === 'concept');

/**
 * Pricing — what the product actually sells.
 *
 * The backend (GetYourWebsiteAdmin, `billing_products`) sells two things: a
 * one-time Startup plan with included revisions that expire after 90 days,
 * and a monthly Maintenance plan with included revisions each month and a
 * metered price per extra revision. No page limits, no Custom tier. The tiers
 * below differ only in how many revisions are included, and the price per
 * revision falls as you go up.
 *
 * This is the only place in the repo that holds a price. Every price on the
 * site is formatted from these integers (and from BETA.discount) by the
 * helpers below — never typed into a page. `npm run verify` greps for
 * stray price strings precisely to stop that coming back.
 *
 * As of October 2026 the backend has ONE Startup product (30 revisions) and
 * ONE Maintenance product (6 revisions, $5 extras). The other tiers do not
 * exist in Stripe yet. Beta is invite-only, so nothing can be bought from the
 * site — but they have to exist before the first beta client checks out.
 *
 * No delivery times, deliberately. The only data point we have is Allergy
 * Rescue Kit at 24 build rounds, which supports no defensible estimate. The
 * only time promise on the site is the reply one: within one business day.
 */
export const STARTUP_TIERS = [
  { id: 'startup-10', name: 'Startup 10', price: 600, revisions: 10 },
  { id: 'startup-30', name: 'Startup 30', price: 900, revisions: 30, popular: true },
  { id: 'startup-60', name: 'Startup 60', price: 1200, revisions: 60 },
];
export const STARTUP_REVISIONS_EXPIRE_DAYS = 90;

export const MAINTENANCE_TIERS = [
  { id: 'care-6', name: 'Maintenance 6', monthly: 49, revisions: 6 },
  { id: 'care-15', name: 'Maintenance 15', monthly: 89, revisions: 15 },
  { id: 'care-40', name: 'Maintenance 40', monthly: 179, revisions: 40 },
];

/** Per extra revision on Maintenance, metered onto the monthly invoice. */
export const EXTRA_REVISION = 5;

/** "$1,200", "$8.17". Whole dollars print without cents. */
export function money(n) {
  const whole = Number.isInteger(n);
  return '$' + n.toLocaleString('en-US', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  });
}

/** A Startup price after the beta discount, in whole dollars. */
export const betaPrice = (price) => Math.round(price * (1 - BETA.discount));

/** What a Startup tier costs today: the beta price while beta is on. */
export const startupPrice = (tier) => (BETA.on ? betaPrice(tier.price) : tier.price);

/**
 * Price per included revision, to the cent. Worked in cents so 179 / 40
 * rounds to 4.48 rather than floating-point's 4.47.
 */
export const perRevision = (price, revisions) => Math.round((price * 100) / revisions) / 100;

/** The things that are true whichever tiers someone picks. */
export const EVERY_PLAN_INCLUDES = [
  'Unlimited pages',
  'Your own domain',
  "Hosted on Cloudflare's network",
  'Every version kept',
  'A person reviews every change',
];

/**
 * The pricing FAQ. Plain answers to the things people actually ask before
 * they pay, including the ones it would be more comfortable to leave out.
 *
 * Checked against the portal and backend, October 2026: Startup is a single
 * full-price Stripe Checkout bought in the portal before the site is built;
 * a client on Startup alone cannot buy extra revisions — the backend
 * requires a Maintenance subscription for those.
 */
export const PRICING_FAQ = [
  {
    q: 'What do I pay, and when?',
    a: "Startup is paid in full at checkout in your portal, before we build. If you change your mind before the build starts, we refund it in full. Maintenance is billed monthly by card. Payments go through Stripe.",
  },
  {
    q: 'Do I need Maintenance?',
    a: "Yes, to host with us: it's what pays for hosting, your domain and SSL, and keeping every version. If you'd rather host it yourself, we hand over the files and you're done.",
  },
  {
    q: 'What happens when my revisions run out?',
    a: `On Startup alone, start Maintenance — its monthly revisions, and extras at ${money(EXTRA_REVISION)} each, pick up from there. On Maintenance, extras are ${money(EXTRA_REVISION)} each, or you can move up a tier.`,
  },
  {
    q: 'Can I change tier?',
    a: 'Yes. Up, any time, and you pay the difference.',
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
 *   'cabinet' — Cabinet Grotesk, self-hosted (Fontshare, ITF Free Font License)
 *   'sora'    — Sora, self-hosted (Google Fonts, SIL Open Font License 1.1)
 *
 * The two alternatives are kept for comparison only. Changing this line is
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
 * /beta (or /free-mock, while beta is off).
 *
 * Leave empty until /cookies has been updated to say the Pixel is in use —
 * its "If we turn on advertising measurement" section is written and marked
 * "not currently in use" — and /privacy's "Cookies and tracking" section
 * agrees. Setting this without those edits makes both pages false.
 *
 * While it is empty BaseLayout emits nothing at all — no script tag, no
 * comment, no connection to facebook.net. When it is set it loads the pixel
 * on every page, fires PageView, and fires a Lead event on the ad landing
 * page's thank-you: /beta/thanks while beta is on, /free-mock/thanks while
 * it is off.
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
export const LEGAL_UPDATED = 'October 13, 2026';
