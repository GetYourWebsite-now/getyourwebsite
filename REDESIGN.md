# GetYourWebsite redesign — Claude Code prompt

Paste everything below the line into Claude Code opened in `~/Developer/getyourwebsite`. Drafted 2026-10-07 from the current repo (`src/data/site.js`, `global.css`, `work.astro`, `pricing.astro`) plus research on Stripe/Mercury/Linear-style fintech sites and a 21st.dev component scan. Decisions Jack still owns are marked **[JACK]**. Full copy also lives in the GYWN project at `website/getyourwebsite.now/redesign-prompt.md`.

---

Read `CLAUDE.md`, `README.md`, `FEEDBACK.md`, `src/data/site.js`, `src/styles/global.css`, `src/layouts/BaseLayout.astro`, every file in `src/pages/` and `src/components/`, and `tools/*.mjs` before changing anything. Then print a plan (files you'll touch, decisions, questions) and wait for my OK. Work in the phases below; after each phase run the full verify suite (`npm run verify && npm run verify:pacing && npm run verify:contrast && npm run verify:wraps && npm run verify:voids && npm run verify:portal`), screenshot every changed page at 390px and 1440px with Playwright, **look at the screenshots**, and show me before moving on.

## 0. What we're doing and why

GetYourWebsite has become a software product (client portal, versioning, managed hosting on Cloudflare, AI-assisted generation with human review) sold to local businesses at **$900–$3,000+** per site plus a monthly care plan. The site still looks like a student design studio: dark space hero, black-hole animation, white/black/silver/gold palette, "built by high school students" in the hero. Rebuild it as a **light, restrained, fintech-grade marketing site** — the restraint of Stripe, Mercury and Linear, not their gradients — where the product screenshots and real client work do the talking.

Two rules from `CLAUDE.md` stay absolute: every capability claim must be true of `client/` today, and `/demo` must match the portal (`npm run verify:portal`).

## 1. Design system — replace tokens, keep the architecture

Everything visual lives in `:root` in `global.css` and `HEADING_FONT` in `site.js`. Change tokens; don't restyle pages one by one.

**Colour (light-first).** Replace the dark-section default. New tokens:

```css
--bg: #ffffff;            /* page */
--bg-alt: #f6f7f9;        /* alternating sections, screenshot wells */
--ink: #0a0a0c;           /* headings */
--ink-soft: #4a4f58;      /* body on light — already AA */
--ink-muted: #6b7079;     /* captions, eyebrows (AA on white at >=14px) */
--line: #e6e7eb;
--accent: #2f3dd6;        /* ONE accent: deep indigo. links, primary buttons, focus rings, "most popular" tier */
--accent-hover: #2531b0;
--accent-soft: rgba(47, 61, 214, 0.08);
--gold: #f5c24b;          /* brand mark + the free-mock badge ONLY. Never text on white. */
--footer: #0a0a0c;        /* the single dark surface */
```

Rules: sections alternate `--bg` / `--bg-alt`, footer is the only dark surface, **no gradients, no glow, no stars, no glassmorphism, no bento grids, no mesh backgrounds** (delete `.has-stars`, `.has-glow`, the ambient drift in `ambient.js`, and the `section--dark` variant except for the footer). Radius 8px on cards, 6px on buttons, nothing larger. Shadows: one soft shadow for screenshots (`0 1px 2px rgba(10,10,12,.06), 0 12px 32px rgba(10,10,12,.08)`), none on cards (use `--line` borders). Keep `verify:contrast` green.

**Type.** Stripe's look comes from one restrained grotesque, not from decoration. Move to a single family:

- Body + UI: **Inter** (variable, SIL OFL), self-hosted in `public/fonts/`, `font-feature-settings: 'cv11', 'ss01'`. Replace Work Sans.
- Headings: **Inter Display** weights (or the variable's `opsz` axis at 32), weight 600, `--h-track: -0.025em`. Add `'inter'` to the `HEADING_FONT` switch and make it the default; keep `'clash'` selectable for comparison; remove Outfit and the Google Fonts request entirely.
- Numbers/labels: **Geist Mono** or keep JetBrains Mono — one mono, used only for prices, stats and eyebrow labels. `tabular-nums` on body.
- Scale: hero `clamp(2.5rem, 1.2rem + 4.6vw, 4.5rem)` (fintech heroes are 56–72px, not 96), body 17px / 1.6, lead 20px. Max line length 60ch.

**[JACK]** Alternative if Inter feels generic: **Geist** (Vercel, open) for everything — warmer, still neutral. Decide before Phase 2 ships; it's one token.

## 2. Pages and structure

### Home (`index.astro`)
1. **Nav** — logo left, 5 links centre, "Sign in" (only when `PORTAL_URL` is set) + indigo "Get a free mock" right. Sticky, white, 1px bottom border, no blur. Ref: 21st.dev *Centered Nav Header* (id 21220).
2. **Hero** — left: eyebrow "Websites for local businesses", H1 "Your business, online in two weeks." (**[JACK]** final line), 20px lead stating the offer in one sentence (free mock → launch → we host and maintain), two buttons (primary "Get a free mock", secondary "See a live client site" → allergyrescuekit.com). Right: a **real screenshot of the client portal's version tree** in a browser frame, no 3D tilt. Keep the self-building-site canvas only as an optional small inline animation inside that frame **[JACK]** — if it can't read as "product" on white, delete `hero.js`. Ref: *Hero with Product Mockup* (4710).
3. **Proof strip** — three real numbers only (e.g. "2 live client sites · 64 pages shipped · AA accessibility on ARK's launch audit") — nothing we can't source from a repo or report. No logo wall.
4. **Case studies** (new) — ARK and ChemEd cards with screenshot, one-line outcome, link. Ref: *Portfolio Showcase Grid* (29523), but 2-up and symmetric.
5. **How it works** — 3 numbered steps, typography only, no icons in circles: Free mock → Approve and pay → We build, you choose what's live. Ref: *How It Works Steps* (26891).
6. **Platform** — 4 feature rows alternating text/screenshot: versioning ("press host on last year's Christmas site"), managed hosting + domain, drag-and-drop images, the research+review build process. Cloudflare wording rules from `FEEDBACK.md` §1b apply verbatim.
7. **Pricing teaser** — 3 tiers from `TIERS`, link to /pricing.
8. **One testimonial** — Jay Wilson's "Thanks for such a great site! Best one ever." is real (email 2026-09-10) — **[JACK]** get his OK before publishing with his name; until then omit the section. Ref: *Single Voice Spotlight Testimonial* (28169).
9. **FAQ** — 6 questions (pricing, timeline, who owns the site, hosting, what if I already have a site, who builds it). `<details>`-based. Ref: *Ghost Accordion* (29230).
10. **Final CTA + footer** (footer is the one dark block).

Move "built by high school students" out of the hero and into **Why Us** as the founders' story, written as an advantage (faster, cheaper, hungrier, you talk to the people who build it). It's a differentiator in a paragraph and a liability in a headline.

### Our Work (`work.astro`) — restructure
- Rename H1 to "Work" and delete "real client work coming soon."
- **Section 1 — Client work.** Two full-width case-study blocks: screenshot (desktop + phone), client, sector, what we built (3 factual bullets), outcome, live link.
  - **Allergy Rescue Kit** — allergyrescuekit.com. Facts from the repo: Astro, 13 pages + 51 state-law pages driven by a verified dataset, WCAG AA, structured data, no-cookie privacy posture, launched Sept 10 2026, 24 build rounds with founder feedback. Link live.
  - **ChemEd 2027 Interest Map** — for the ChemEd 2027 conference (EMU). Facts: Next.js + Postgres web app, 131k-school typeahead, clustered/heatmap/choropleth map, organizer admin + CSV import. **[JACK]** public URL and whether the organizer allows naming them; if not, "a national chemistry-education conference".
  - Add both to `PROJECTS` with `kind: 'client'` and real `shot`s — Playwright at 1440×900 and 390×844 into `public/shots/` (ARK from the live site; ChemEd from a local `npm run dev` of `~/Developer/chemed-interest-map` if the public URL is unknown).
- **Section 2 — Concept sites.** The six existing mocks under an honest heading ("Concept sites — fictional businesses we built to show range"), 3-up grid, visually quieter than Section 1.
- `FEATURED_PROJECTS` on the home page = the two client sites only.

### Pricing (`pricing.astro`) — see §3. Add a comparison table under the tiers (ref *Feature Comparison Table*, 21218) and the FAQ.

### Other pages
- `/how-it-works`, `/benefits`, `/why-us`: re-skin to the new tokens; merge Benefits into How it works (content overlaps — propose the merge in your plan).
- `/demo`: re-theme the sandbox chrome only; the portal inside keeps the portal's tokens (update both in the same commit, rerun `shots:teaser`).
- `/contact` → also create **`/free-mock`**: one-screen page, Formspree form reduced to business name, email, phone, current website (optional). This is the ad landing page; no nav beyond the logo.

## 3. Pricing — content for `TIERS`

Replace the $150/$350/$600+ placeholders. Recommended structure (**[JACK]** confirm numbers):

| Tier | Price | What's in it |
|---|---|---|
| **Launch** | **$900** one-time | Up to 5 pages, built from your free mock; 2 revision rounds; contact form; mobile-first; basic on-page SEO; launched on your domain |
| **Growth** (most popular) | **$1,600** one-time | Up to 10 pages; booking/scheduling or quote-form integration; copywriting pass; Google Business Profile tune-up; 4 revision rounds; photo and asset handling |
| **Custom** | **from $3,000** | Web apps and data-driven sites (interactive maps, 50-state content, calculators, portals); integrations; scoped per project |
| **Care plan** (required to host) | **$49/mo** or **$490/yr** | Hosting on Cloudflare's network, domain + SSL management, every version kept and switchable, 1 revision credit/month, uptime monitoring, email support |

Rationale: three one-time tiers with the middle highlighted is what SMB-facing fintechs do (Square and Revolut show price; enterprise hides it — we show it). $900 not $800: the floor of "real agency" pricing, still under the $1k threshold. The Care plan is where the business becomes a business — it's required because custom domains are gated on maintenance in `client/`, so say so plainly. 50% deposit via Stripe Checkout, balance at launch — state it in the FAQ. Keep `PRICING_DISCLAIMER` but soften: "Final quote after we review your free mock."

Pricing page layout: tiers → "Every plan includes" row (versioning, hosting via Care, human review, no templates) → comparison table → FAQ → CTA. No monthly/yearly toggle on build tiers (one-time); a toggle only on the Care plan card.

## 4. Using 21st.dev — as references, not dependencies

This is an Astro + plain-CSS site. **Do not install shadcn, React or Tailwind.** Use 21st.dev for structure and motion ideas only: fetch each referenced component's code with the REST API (`POST https://21st.dev/api/prompts` with `{prompt_type:'basic', demo_id}` and the `x-api-key` from `~/.config/gyw/n8n.env` → `TWENTYFIRST_API_KEY`), read it, and port the layout, spacing rhythm and any transition into Astro components + CSS custom properties. Reference IDs: nav 21220 · hero 4710 · steps 26891 · pricing 18957 / 28342 · comparison 21218 · testimonial 28169 · FAQ 29230 · case-study grid 29523. Skip anything with glow, glass, 3D sculptures, spotlight cursors or bento layouts — those are the "AI-made" tells we're removing.

## 5. Build order
1. Tokens + fonts + Nav + Footer (whole site goes light; verify suite green).
2. Home hero + proof + how-it-works + platform rows (needs portal screenshots — take them from a local `client/` dev build with the seeded demo client).
3. Work page restructure + case-study screenshots + `PROJECTS` data.
4. Pricing data + page + comparison + FAQ; `/free-mock`.
5. Why Us / How it works / Benefits merge; About story.
6. Final pass: `verify:*`, Lighthouse on `/`, `/work`, `/pricing` (target >=95 all four), update `README.md` and `CLAUDE.md` for the new palette rules, update `src/data/portal-sync.json` if `/demo` changed.

Stop after each phase and show screenshots. Do not invent statistics, testimonials or client names.
