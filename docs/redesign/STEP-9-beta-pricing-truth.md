# STEP 9 — Beta mode, real pricing, truthful examples, legal pages

Team review of the launched site (2026-10-13) plus the business decision to
launch as a **beta**. This step is everything that changes *what the site
says*. Visual depth is STEP-10, run after this.

Protocol: plan first, wait for "go". Build on branch `beta-mode` off `main`.
Run every gate, screenshot `/`, `/pricing`, `/work`, `/why-us`, `/beta`,
`/cookies`, `/beta-terms` at 1440 and 390 into `.shots/phase9/`, look,
commit "Beta mode, revision-based pricing, platform example, legal pages",
stop. Jack merges and deploys.

Hard rules unchanged: every claim true of the product today; prices only in
`site.js`; no invented numbers; legal pages are edited *only* as §6 says.

## 1. Beta mode — one switch

```js
export const BETA = {
  on: true,
  discount: 0.30,        // off Startup tiers only; Maintenance unchanged
  seats: 30,             // "the first 30 businesses"
  cta: 'Join the beta',
  path: '/beta',
};
```

While `BETA.on`:
- Every primary CTA site-wide reads `BETA.cta` → `BETA.path` (nav, hero,
  closing bands, tier cards, footer). Hero's secondary "See a live client
  site" stays.
- Hero gains one line under the buttons, 14px `--ink-muted`: *"In beta.
  We're taking on a small number of businesses — the first 30 at 30% off."*
- **No "free mock" anywhere a visitor can read.** How-it-works step 1
  becomes "You tell us about the business"; FAQ 1 keeps the deposit answer
  and drops the mock; `/contact` lead points at `/beta`. Gate: `grep -rli
  "free mock" dist/` is empty apart from `dist/free-mock/` itself.
- `/free-mock` → `/beta` and `/free-mock/thanks` → `/beta/thanks` redirects
  (generated from `BETA.on`; reversed when off). `/free-mock` keeps building.
- **`/beta`** — ad landing page, same bones as `/free-mock`: logo only, no
  nav, two columns, the two live-site thumbnails (§4) on the left. H1
  **"We're in beta. Want in?"** Lead: *"We build, host and keep your website
  current, and a person checks every change before it goes live. We're
  taking on a small number of businesses while we finish the product — the
  first 30 at 30% off. Tell us about yours."* Same six fields, hidden
  `source=beta`, button **"Join the beta"**, `_next` → `/beta/thanks`. Under
  the button: *"No cost to apply, no card. We'll reply within one business
  day."* `noindex`, not in sitemap, in every verify list. A link to
  `/beta-terms` ("How the beta works") under the form.
- **`/beta/thanks`** — "You're on the list." + the one-business-day line.
- When `BETA.on` is false the site must be byte-identical to today's `main`
  except this step's other changes. `tools/beta-check.mjs` (`verify:beta`)
  builds both ways and proves it.

## 2. Pricing — what the product actually sells

The backend sells two things (`billing_products`): a one-time **Startup**
plan with a number of included revisions that expire after 90 days, and a
monthly **Maintenance** plan with included revisions per month and
**$5 per extra revision**. There are **no page limits** and there is **no
Custom tier**. Pages, "booking integration", "copywriting pass", "Google
Business Profile" — all of that goes. Tiers differ by **included revisions**,
and the per-revision price falls as you go up.

Replace `BUILD_TIERS` / `CARE` in `site.js` with:

```js
export const STARTUP_TIERS = [
  { id: 'startup-10', name: 'Startup 10', price: 600,  revisions: 10 },
  { id: 'startup-30', name: 'Startup 30', price: 900,  revisions: 30, popular: true },
  { id: 'startup-60', name: 'Startup 60', price: 1200, revisions: 60 },
];
export const STARTUP_REVISIONS_EXPIRE_DAYS = 90;
export const MAINTENANCE_TIERS = [
  { id: 'care-6',  name: 'Maintenance 6',  monthly: 49,  revisions: 6 },
  { id: 'care-15', name: 'Maintenance 15', monthly: 89,  revisions: 15 },
  { id: 'care-40', name: 'Maintenance 40', monthly: 179, revisions: 40 },
];
export const EXTRA_REVISION = 5;
export const DEPOSIT = 0.5;
```

Numbers are integers; every rendered price is formatted from these (and
from `BETA.discount`), never typed. "Care plan" is renamed **Maintenance**
everywhere — that's what the portal calls it.

`/pricing`, top to bottom:
1. H1 **"Pay for changes, not pages."** Lead: *"Every site starts with a
   Startup plan. Keep it current with a Maintenance plan. Both are priced by
   how many changes you'll want — and the more you include, the less each
   one costs."*
2. **Startup** — three cards. Price large; while `BETA.on`, list price struck
   through in `--ink-muted`, beta price beside it; "one-time" under it.
   Three lines per card: *N revisions included · use them within 90 days ·
   unlimited pages*. Per-revision line in `--ink-muted`: "$60 per revision"
   / "$30" / "$20" — computed. One button each → `BETA.path`.
3. **Maintenance** — three cards, same pattern, "/mo", *N revisions a
   month · extras $5 each · hosting, domain and SSL included · every
   version kept*. Per-revision line. No monthly/yearly toggle (the product
   has no yearly price).
4. **What a revision is** — one short block: *"One change request, sent
   from your portal, applied as a new version. 'Make the hero warmer and
   swap the photo' is one revision. A person reviews each one before it goes
   live."* This replaces the FAQ item of the same name.
5. **Every plan includes** — unlimited pages · your own domain · hosted on
   Cloudflare's network · every version kept · a person reviews every change.
6. **FAQ** — rewrite to match: (1) what do I pay and when — 50% deposit on
   Startup when you say yes, balance at launch, Maintenance monthly by card;
   (2) do I need Maintenance — yes to host with us, otherwise we hand over
   the files; (3) what happens when revisions run out — Startup: buy more or
   wait for Maintenance to renew; Maintenance: $5 each, or move up a tier;
   (4) can I change tier — up any time, pay the difference; (5) existing
   site — rebuilt, domain kept, nothing offline; (6) who owns the site —
   unchanged. Drop the comparison table; the cards *are* the comparison.
7. Closing band → `BETA.path`.

Home pricing teaser: the three Startup cards from the same data, one line
under them: "Hosting and upkeep: Maintenance from $49/mo." (computed).

**Flag in the commit body, for Jack and Zane:** the backend currently has
*one* Startup product and *one* Maintenance product. The tiers on the site
don't exist in Stripe yet. Beta is invite-only so nothing can be bought from
the site today, but the products must exist before the first beta client
checks out.

## 3. Why Us — say what's true

"You talk to the people who build it" is not true: clients work through the
portal, the site is generated by our software, and a person reviews each
change. Rewrite the home teaser and `/why-us` header:

- H1 **"Built by our software. Checked by a person."** Lead: *"Your site is
  generated from your real business information, and nothing goes live —
  not the first build, not a one-line change — until one of us has looked at
  it. Questions go to email; we reply within one business day."*
- Promises grid: *every version kept · you own the site · unlimited pages ·
  a person reviews every change*. Drop "no templates" (true but it's now
  the hero's job) and "we reply within one business day" moves into the
  lead.
- "Two students, one company, two live clients." → **"Two students, one
  company, two live sites."** Paragraph 3 (college money) unchanged.

## 4. Examples — ARK stays, ChemEd goes, Andy's Auto is the hosting proof

ChemEd is a one-off we can't build for a plumber, so it comes off `/`, `/work`
and `/why-us` (keep its `PROJECTS` entry with `hidden: true`; delete nothing).

**andysauto.org** is a real domain, **built and hosted end-to-end on our
platform** (assets served from the platform, custom domain through the
hosting flow). It is *not* a paying client — don't call it one. It's the
proof that the hosting works. Facts to verify before writing (open the site):
Astro? no — it's a platform-generated site; sections Home / Services / About
/ Visit; no phone number yet; contact is email only.

- `/work`: Section 1 **"Live sites"** — two case studies. ARK as now.
  **Andy's Auto Shop** — sector "Auto repair", one line: *"A real domain,
  built and hosted entirely on our platform: generated from the shop's
  information, custom domain connected, served from Cloudflare's network,
  every version kept."* Bullets: built by our software, not by hand · hosted
  on our platform (ARK is not — don't imply it) · andysauto.org on its own
  domain. Outcome line: *"Everything a beta client gets, on a live domain."*
  Lower-third / caption: *"Demo business on a real domain, hosted on our
  platform."* Link "Open andysauto.org →".
- `/` 2-up: ARK + Andy's. Heading **"Two live sites."** Lead: *"One we built
  by hand for a client. One our platform built and hosts. Both open to
  anyone."*
- `/why-us` "Judge us on these": same pair.
- `/beta` thumbnails: same pair.
- Screenshot via `shots:clients` (add andysauto.org; desktop + phone).
- Note in BACKLOG: Andy's Auto needs a phone number and hours before it's
  used in a "built to get calls" ad.

## 5. The portal animations — a note, not a change

Keep the four drawings. Add to BACKLOG.md: *"When the light portal ships and
the revision/host/domain flows are final, record the real portal (same
Rosa's Bakery fixture) and replace the drawings on `/` and `/how-it-works`
with screen recordings. The drawings are placeholders for the real thing."*

## 6. Legal — only this

This is the one step where the legal pages are edited, because Jack asked
for it. Changes are additive and every sentence must be true of the built
site; put *"drafted to describe what the site does; not legal advice —
Jack to review before merge"* in the commit body.

- **`/cookies` (new).** First inventory what the built site actually sets:
  load every page headless, list cookies and storage. Expected: no
  first-party cookies; Cloudflare may set `__cf_bm`; Formspree sets nothing
  on our domain; `/demo` sandbox uses in-memory state only; Meta Pixel is
  off. Write the page from that inventory, in the privacy page's voice, with
  a section *"If we turn on advertising measurement"* describing the Meta
  Pixel exactly as `HANDOFF.md`'s sentence does, marked "not currently in
  use". Link it from the footer and from `/privacy`'s cookies section.
- **`/beta-terms` (new).** How the beta works: limited seats; 30% off
  Startup tiers for the first 30 businesses, Maintenance at list price; the
  product is still changing and some features may be added or removed;
  revisions and the one-business-day reply apply as on `/pricing`; we may
  decline an application or end the beta, in which case paid work is
  completed or refunded pro-rata; your data as per `/privacy`; standard
  Terms apply where this page is silent. Linked from `/beta` and the footer.
- **`/privacy`, `/terms`:** read both in full against the live site and fix
  only (a) anything no longer true, (b) "mockup" → "mock" if a sentence is
  being touched anyway, (c) add Stripe as a payment processor if missing,
  (d) a one-line pointer to `/cookies` and `/beta-terms`. List every edited
  sentence, before and after, in the commit body. Bump `LEGAL_UPDATED`.

## 7. Gates

All existing gates + `verify:beta`; price grep still empty; "free mock" grep
as §1; `grep -rn "ChemEd\|chemed" src/pages src/components` → nothing
rendered (data entry may remain); Lighthouse ≥95 on `/` and `/pricing`.
Word budgets: home 570, pricing unchanged, why-us 600. Screenshots looked
at. Commit. Stop.
