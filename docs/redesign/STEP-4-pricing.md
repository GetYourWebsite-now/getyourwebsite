# STEP 4 — Pricing page, pricing data, `/free-mock` landing page

Read all of this before touching anything. Plan first (same as Step 3: list files,
flag anything that contradicts REDESIGN.md or the facts you can verify, then wait
for "go"). After "go": build, run the full verify suite, screenshot `/pricing`,
`/free-mock` and `/` at 1440 and 390 into `.shots/phase4/`, look at them yourself,
commit as "Phase 4: pricing, Care plan, /free-mock", and stop. Do not start Phase 5.

Branch stays `redesign/light-rebuild`. Nothing merges to main.

## 0. Two small fixes first (before the plan)

1. On `/work` and the home 2-up, the ChemEd live link renders as the raw hostname in
   monospace (`chemed-interest-map-production.up.railway.app →`). That reads as a
   dev artefact, not a case study. Change the link *label* on both case studies to a
   human phrase, same style as the rest of the component:
   - ARK: `Open allergyrescuekit.com →`
   - ChemEd: `Open the interest map →`
   The `href` values do not change. Keep the ChemEd "sample attendees" caption.
2. The home pricing teaser still shows Launch $150 / Orbit $350 / Deep Space $600+
   and "A site like Rosa's Bakery". It gets rebuilt in this step from the new
   `TIERS` — make sure it reads from the same data as `/pricing` so they can never
   drift again.

## 1. Pricing data — `src/data/site.js`

Replace `TIERS` entirely. Three one-time build tiers plus one recurring Care plan.
Keep the shape the existing components expect (`id`, `name`, `price`, `tagline`,
`features`, `popular`) and add `kind: 'build' | 'care'`, `period` (`'one-time'`,
`'/mo'`), `deposit` where relevant, and `example` + `exampleHref` pointing at **real
client work only** — never at a concept site. If a tier has no real example yet,
omit the field and render nothing (do not invent one).

| id | name | price | period | what's in it |
|---|---|---|---|---|
| `launch` | **Launch** | **$900** | one-time | Up to 5 pages, built from your free mock · 2 revision rounds · contact form to your inbox · mobile-first · basic on-page SEO (titles, descriptions, sitemap) · launched on your own domain · example: Allergy Rescue Kit is *not* this tier (it's 65 pages) — no example |
| `growth` | **Growth** `popular: true` | **$1,600** | one-time | Up to 10 pages · booking/scheduling or quote-form integration · copywriting pass on every page · Google Business Profile tune-up · 4 revision rounds · we handle your photos and assets · everything in Launch · example: Allergy Rescue Kit → `https://allergyrescuekit.com` |
| `custom` | **Custom** | **from $3,000** | one-time | Web apps and data-driven sites: interactive maps, state-by-state content, calculators, client portals · integrations with the tools you already use · scoped and quoted per project · example: ChemEd 2027 Interest Map → `https://chemed-interest-map-production.up.railway.app/` |
| `care` | **Care plan** | **$49** | /mo (or **$490**/yr) | Required to host with us. Hosting on Cloudflare's network · domain and SSL managed for you · every version of your site kept and switchable from the portal · 1 revision credit a month (rolls over, max 3) · uptime monitoring · email support, reply within one business day |

Honesty constraints (same bar as Step 3 — verify before writing):
- "Hosting on Cloudflare's network" is only true for sites hosted through the GYW
  platform. ARK is hosted on Railway. So the ARK example on the Growth card is an
  example of the *build*, not the Care plan — do not imply ARK is on Care.
- "Every version kept and switchable" — confirm the portal actually exposes
  restore/switch (the Restore Changes workflow exists in n8n; the client portal has
  a versions list). If the client-facing switch isn't live yet, write "every version
  kept, and we switch it for you on request" instead.
- "1 revision credit a month" — this is a new policy, not a feature that exists in
  code. Fine to state; just don't claim it's automated.
- Delivery times: do **not** print week counts. Our one real data point is ARK at
  24 rounds; we don't have a defensible "1–2 weeks". Leave `delivery` out.

`PRICING_DISCLAIMER` becomes: "Final quote after we've seen your free mock. Most
businesses land in Launch or Growth; we'll tell you which before you pay anything."

Add `PRICING_FAQ` (array of `{ q, a }`) with exactly these, in this order:
1. **What do I pay, and when?** — 50% deposit when you approve the mock and pick a
   tier; the balance when the site goes live on your domain. Paid by card through
   a Stripe checkout link we send you. *(Leave the Stripe sentence in only if a
   checkout link flow exists or Jack confirms; otherwise "we send you an invoice".)*
2. **Do I have to take the Care plan?** — Only if you want us to host it. Custom
   domains are tied to the Care plan because that's what pays for hosting, SSL and
   keeping every version. If you'd rather host it yourself, we hand over the files
   and you're done.
3. **What counts as a revision round?** — One batch of changes, sent together,
   that we apply as a new version. Three small tweaks in one message is one round;
   three messages on three days is three.
4. **Can I change tiers later?** — Yes. Going up is the price difference; going down
   isn't a thing because the work is already done.
5. **What if I already have a website?** — We rebuild it from scratch, moving across
   whatever is worth keeping. You keep your domain; nothing goes offline during the
   switch.
6. **Who owns the site?** — You do, once it's paid for. Code, content, domain. The
   portal is ours; the site is yours.

## 2. `/pricing` page layout

Top to bottom. Section backgrounds must alternate (verify's alternation check will
catch it if they don't):

1. **Header** — eyebrow `PRICING`, H1 "Simple prices. One of them is free." (the free
   mock is the hook — say it in the H1), one-sentence lead: "Three ways to build,
   one plan to keep it running. The mock that starts every project costs nothing."
2. **Build tiers** — three cards, Growth highlighted with the indigo border and the
   `MOST POPULAR` tag exactly as the home teaser does now. Price large (48px+),
   `one-time` small beneath. Feature list with the thin check marks. One button per
   card: "Start with a free mock" → `/free-mock`. Custom's button says "Tell us
   about the project" → `/contact`. Example link under the feature list where one
   exists ("Built this way: Allergy Rescue Kit →").
3. **Care plan** — a single full-width card, not a fourth column. Left: name, price
   with a **monthly / yearly** toggle (the only toggle on the page; yearly shows
   `$490/yr · two months free`). Right: the feature list in two columns. Footnote:
   "Required to host with us. Cancel any time; we hand over the files."
4. **Every plan includes** — four short items in a row: your own domain · every
   version kept · a person reviews every change · no templates, no page builders.
5. **Comparison table** — rows: Pages · Revision rounds · Contact form ·
   Booking / quote integration · Copywriting pass · Google Business Profile ·
   Custom features & integrations · Hosting & domain (→ "via Care plan" for all
   three) · Who builds it (→ "Us, by hand" for all three). Columns Launch / Growth /
   Custom. Check marks and short text, no icons beyond the check. Collapses to a
   stacked list on mobile (390px) — do not let it scroll horizontally.
6. **FAQ** — `PRICING_FAQ`, native `<details>`/`<summary>` so it works without JS,
   styled to the tokens. First item open by default.
7. **CTA** — same closing band as the home page: "See your business online before
   you pay anything." → `/free-mock`.

No gradients, no glow, no bento, no glass — same rules as the rest of the rebuild.

## 3. Home page pricing teaser

Rebuild the "Three ways to get off the ground" section from the new `TIERS`
(build tiers only; the Care plan gets one line under the cards: "Hosting and
upkeep: Care plan, $49/mo"). Replace the concept-site "A site like …" links with the
real example links where they exist, nothing where they don't. Keep "Full pricing
and FAQ →" to `/pricing`.

## 4. `/free-mock` — the ad landing page

New page `src/pages/free-mock.astro`. This is where paid ads will send people, so
it has one job and no exits:

- **No site nav.** Logo only, top-left, linking to `/`. No footer links except
  Privacy and Terms.
- Two columns at ≥900px, stacked below. Left: H1 "See your business online before
  you pay anything.", three lines of what happens (you tell us about the business →
  we build a real homepage mock → you decide), and the two client case-study
  thumbnails side by side (reuse the compact `CaseStudy` thumbnails, no bullets).
  Right: the form.
- **Form:** Formspree, same `FORMSPREE_FORM_ID` as `/contact`, with a hidden
  `source=free-mock` field so we can tell these apart in the inbox. Fields, in this
  order, nothing else: Business name (required) · Your name (required) · Email
  (required) · Phone (optional) · Current website, if any (optional) · One line
  about the business (textarea, optional, placeholder "e.g. Plumbing, Livonia, 15
  years"). Button: "Build my free mock". Under it, small: "No cost, no card, no
  commitment. We'll email you within one business day."
- Honeypot field (hidden `_gotcha`) — Formspree supports it; add it.
- Success state: Formspree redirects by default; set `_next` to `/free-mock?sent=1`
  and render a thank-you panel in place of the form when `sent=1` is in the URL.
  Must work with JS disabled (the redirect does).
- Add `<meta name="robots" content="noindex">` — ads traffic only, not for search.
- Add it to `verify` so the contrast, wraps and voids checks cover it.

## 5. Nav

Add nothing. `/free-mock` is not in the nav or the footer. Every existing "Get a
free mock" button site-wide now points to `/free-mock` instead of `/contact`.
`/contact` stays for everything else.

## 6. Before you commit

- `npm run verify` and all five gates green.
- Screenshots `/pricing`, `/free-mock`, `/` at 1440 and 390 into `.shots/phase4/`.
  Restart the dev server first (your own Step 3 lesson).
- Check the comparison table at 390 by eye, not just by the voids script.
- Confirm no price string appears anywhere in `src/` except `src/data/site.js`
  (`grep -rn '\$[0-9]' src --include=*.astro` should return nothing).
- Commit "Phase 4: pricing, Care plan, /free-mock". Stop.
