# STEP 9 — Beta mode

The site launched (main `779e257`) promising a free mock on every button and
sending ad traffic to `/free-mock`. The business is in beta: for now it takes
an **interest form**, invites businesses in, and gives the first 30 **30% off**
build tiers. The free-mock promise comes back when beta ends — so this is a
**switch, not a rewrite**. Flip one constant and the site returns to what it
is today.

Same protocol: plan first, wait for "go". Then build, run every gate,
screenshot `/`, `/pricing`, `/beta`, `/beta/thanks` at 1440 and 390 into
`.shots/phase9/`, look, commit "Beta mode: interest form, 30% beta pricing",
stop. Work on a branch `beta-mode` off `main`; Jack merges and deploys.

## 1. One switch in `site.js`

```js
export const BETA = {
  on: true,
  discount: 0.30,           // off Launch / Growth / Custom "from"; Care unchanged
  seats: 30,                // "the first 30 businesses"
  cta: 'Join the beta',     // every primary button while on
  path: '/beta',            // where every primary button goes while on
};
```

When `BETA.on` is false, every rule below is inert and the site is exactly
the current `main`: "Get a free mock" → `/free-mock`. Nothing in `/free-mock`
is deleted; it is just not linked while beta is on (keep it building, keep it
`noindex`, add it to the redirect list below so a stale ad link still lands).

## 2. What changes while `BETA.on`

- **Every primary CTA** site-wide reads `BETA.cta` and links to `BETA.path`
  (nav, hero, every closing band, tier cards, footer). The hero's secondary
  button "See a live client site" stays.
- **Hero lead** gains one short line under the buttons, Inter 14px
  `--ink-muted`: *"In beta. We're taking on a small number of businesses —
  the first 30 at 30% off."* The "Live for Allergy Rescue Kit…" line stays
  above it.
- **No "free mock" anywhere a visitor can read** while on: not in copy, not
  in button labels, not in the How-it-works steps ("A free mock" step becomes
  "You tell us about the business"), not in the FAQ ("What do I pay, and
  when?" keeps the deposit answer, drops the mock reference), not in
  `/contact`'s lead. Gate: a built-site grep for `free mock` returns nothing
  when `BETA.on` is true and returns the current count when false.
- **Pricing:** tier cards show the list price struck through in
  `--ink-muted` with the beta price beside it in `--ink`, computed from
  `BETA.discount` (`$900` → **$630**, `$1,600` → **$1,120**, `from $3,000` →
  **from $2,100**), and one line under the three cards: *"Beta pricing for
  the first 30 businesses. Care plan unchanged."* The comparison table and
  FAQ keep list prices (they describe the product, not the offer). The
  price-string grep gate still passes — nothing typed, all computed.
- **`/beta` (new page)** — the ad landing page, same bones as `/free-mock`:
  logo only, no nav, two columns, the two client thumbnails on the left. H1
  **"We're in beta. Want in?"** Lead: *"We build, host and keep your website
  current, and a person checks every change. We're taking on a small number
  of businesses while we finish the product — the first 30 at 30% off. Tell
  us about yours and we'll be in touch within one business day."* Form:
  same six fields as `/free-mock`, hidden `source=beta`, button **"Join the
  beta"**, `_next` → `/beta/thanks`. Below the button: *"No cost to apply, no
  card. We'll say yes or not yet within one business day."* `noindex`; not
  in sitemap; in all verify page lists.
- **`/beta/thanks`** — "You're on the list." One line: we reply within one
  business day. Same bare chrome.
- **Redirects** (`astro.config.mjs`): while on, `/free-mock` → `/beta` and
  `/free-mock/thanks` → `/beta/thanks`. While off, the reverse. Generate the
  `redirects` object from `BETA.on`.
- **`/demo`, `/why-us`, `/work`:** CTA swap only. No other copy changes.
- **Meta Pixel:** unchanged (still off). When it goes on, the Lead event
  fires on whichever thanks page is live.

## 3. What does not change

Prices in `site.js` (list prices stay $900 / $1,600 / from $3,000 / $49).
Legal pages. The portal pin. The animations. The word-count targets (the beta
line adds ~20 words to home; raise home's budget to 570 and say so in the
commit).

## 4. Gates

- All existing gates green, plus: build with `BETA.on = true` → `grep -rli
  "free mock" dist/` is empty except `dist/free-mock/` itself; build with
  `BETA.on = false` → site is byte-identical to `main` except this step's
  new files. Put that two-build check in `tools/beta-check.mjs` and wire it
  as `verify:beta`.
- `grep -rn '\$[0-9]' src --include=*.astro` still empty.
- Screenshots looked at. Commit on `beta-mode`. Stop.
