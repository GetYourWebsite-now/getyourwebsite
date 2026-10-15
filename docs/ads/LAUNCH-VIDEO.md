# Launch video — concepts, script, and the build brief

Status: concepts and script. Nothing built yet. Jack picks a concept and
settles the three decisions in §0, then the brief in §6 goes to Claude Code.

Every video is **code-generated** (Remotion, rendered with headless Chrome,
encoded with FFmpeg): a function of time, so a bad frame is a code fix, not a
re-roll. It reuses the drawings that already exist on the site
(`src/components/anim/*`, `VersionTree.astro`) and the real concept sites in
`public/*.html`. Same honesty rules as the site: no invented stats, reviews,
customer counts, logos of other companies, or timelines we can't defend.

## 0. Decisions (settled 2026-10-13)

1. **This is a beta launch, not the official launch.** The video does **not**
   promise a free mock. The call to action is an **interest form**: "We're in
   beta. Tell us about your business and we'll invite you." Beta pricing:
   **30% off Startup for the first 30 businesses.** Startup is one-time and
   priced by revisions: Startup 10 $600 → $420, Startup 30 $900 → $630,
   Startup 60 $1,200 → $840. Maintenance is unchanged by the beta: $49, $89
   and $179 a month for 6, 15 and 40 revisions a month, extras $5 each.
   (Figures as of 2026-10-13; `src/data/site.js` is the source, and the
   video imports from it rather than typing them.) The free-mock promise
   returns when beta ends. The site is already on the same footing — see
   `docs/redesign/STEP-9-beta-pricing-truth.md` — so an ad click and the
   site say the same thing.
2. **Accent: indigo `#2f3dd6`.** The mark is recoloured to match; the
   rounded-hexagon shape from the supplied files is adopted
   (`public/brand/variants/mark-indigo-transparent.svg`).
3. **Captions only, everywhere.** No voiceover. The on-screen text column in
   §2 is the caption script; the VO column is not used (with it, no beat
   could meet the reading-time rule in §5). Burned in on the 9:16 renders,
   an .srt alongside the 16:9.
4. **Build order:** concept A film (52s, 16:9 + 9:16) and the three 15s
   vertical ads in one run.

## 1. Four concepts

**A. "Stay on the job"** — direct response, trades. The example script's
structure: owner mid-job → DIY-vs-agency bind → see it before you pay →
click-to-change → a person reviews → one button decides what's live → CTA.
Best for cold Meta traffic to plumbers/electricians/landscapers. Highest
expected click-through; most work (needs a trades hook scene).

**B. "Done for you. Without the agency bill."** — the home-page merge
animation as a film. DIY names stream in from the left, agency types from
the right, they converge on the mark; then three product moments; then the
price and the CTA. Cheapest to make (80% exists), on-brand, honest.
Positioning-led rather than pain-led, so weaker as a cold hook, strong as
retargeting.

**C. "One button."** — one continuous shot of a bakery's version tree
growing over a year: First build → Warmer photos → Online orders → Christmas
→ Spring menu, the Live badge hopping between them. No people, no pitch
until the end card. Stripe-calm. Works on the site, in a pitch deck, and as
a looping ad. Explains the product's one real differentiator.

**D. "Two students, two live clients."** — the honesty angle. Real screens of
allergyrescuekit.com and the ChemEd map; "Launched 10 September 2026 after 24
build rounds"; "we reply within one business day"; the mark; CTA. Trust-led.
Only for retargeting (people who already visited) — cold viewers don't care
who we are yet.

**Recommendation:** build **A** as the launch film (45–55s, 16:9 + 9:16) and
cut the 15s vertical ads from it; build **C** second as the loop for the site
and for retargeting. B and D are variants of scenes A already contains.

## 2. Concept A — scene table (16:9, 52s)

Example business: **Cedar & Stone Landscaping** — a fictional business we
built a full concept site for (`public/landscaping.html`). Trades-adjacent,
real product output, already labelled fictional on the site. Lower-third on
first appearance: *"Cedar & Stone is an example business we built to show
the product."*

| t | Visual | On-screen text | VO (optional) |
|---|---|---|---|
| 0–3 | Black frame → one line of type snaps in, large. No stock footage: a drawn phone, face-down on a drawn workbench, buzzing once and going still. | **Your phone should be ringing. Not your to-do list.** | Your phone should be ringing. |
| 3–9 | The merge drawing from the site, slowed down. Left column types in: Squarespace · Wix · Base44 · Replit → *You do the work.* Right: Design studios · Marketing agencies → *They do the work, at agency prices.* | **Do it yourself. Or pay an agency for meetings.** | Build it yourself at night, or pay an agency to hold meetings about it. |
| 9–12 | Columns collapse into the mark. | **Done for you. Without the agency bill.** | There's a third way. |
| 12–20 | A drawn form: "Cedar & Stone Landscaping · Livonia · lawn care, hardscape" typed in. Cut: the real `landscaping.html` homepage scrolls on a drawn phone. | **Built from your real business info. Not a template.** *(lower-third: example business)* | Tell us about the business. We build the site from what you actually do — services, area, hours — not a template with your name pasted in. |
| 20–26 | `ClickToChange` drawing: cursor taps the hero heading, note box "Add 24/7 emergency service", Sent. A node appears: *Version 2 · In review*. | **Click it. Say what to change.** | Want something changed? Click it and say so in plain words. |
| 26–31 | The node flips to *Approved*. A small "Reviewed by a person" line under it. | **A person checks every change before it goes live.** | A person builds it and checks it. Nothing goes live on its own. |
| 31–38 | `VersionTree` drawing: five nodes, the Live badge jumps from "Online orders" to "Christmas" on one click, then back in January. | **You choose which version is live. One button.** | Every version is kept. Christmas site in December, everyday site in January — one button. |
| 38–44 | `DomainConnect` drawing: cedarandstone.com → Connect → padlock → Live. Beneath: *Hosting · domain · monthly changes · one plan.* | **Hosted on Cloudflare's network. One plan covers it.** | We register the domain, host it on Cloudflare's network, and keep it current. One plan. |
| 44–52 | White end card. Mark draws itself in. Wordmark. "Now in beta" line. Offer. CTA. | **Now in beta.** / **30% off for the first 30 businesses.** / **Join the list at getyourwebsite.now/beta** | We're in beta. The first thirty businesses get thirty percent off. Put your name down at getyourwebsite dot now slash beta. |

Closing tagline (voice + text, last 2s): **We build it, host it, and keep it
current. You stay on the job.**

Not in the script, on purpose: "free mock" (not promised during beta); "live in five clicks" (the *build* takes days
— only switching versions is one click, and that's what we show); any
timeline; any customer count; "you own your site" / "no contract" until the
Terms say it in those words; andysauto or any site without a working call
button; competitor logos — names only, in our own type.

## 3. The 15s vertical cuts (9:16, captions only)

Three variants from the same assets, for A/B testing on $360:

- **V1 Pain → product:** 0–3 hook (phone face-down) · 3–8 built-from-your-info
  (form → Cedar & Stone homepage) · 8–12 click-to-change · 12–15 beta end card.
- **V2 Positioning:** 0–5 merge drawing (names → mark) with "Done for you.
  Without the agency bill." · 5–11 version tree, Live badge hops · 11–15 end
  card.
- **V3 Offer-forward:** 0–3 "Now in beta. 30% off for the first 30 businesses."
  · 3–9 homepage on phone · 9–12 "A person checks every change" · 12–15 beta
  end card.

Alternative first-3-second hooks to rotate against V1's:
- "Still no website? Your competitors' phones are ringing."
- "You shouldn't have to build your own website at 11pm."
- "We're taking 30 businesses into beta. Yours?"

## 4. What's real, what's drawn

Real: `landscaping.html` (full concept site), the portal screenshots in
`public/shots/`, allergyrescuekit.com and the ChemEd map (concept D only),
every price in `site.js`. Drawn in the site's own style: the phone, the
form, the four animations, the version tree. Nothing else — no stock video,
no stock photos, no AI-generated people.

Screen recordings to capture later to replace drawings with the real thing
(only once the light portal is live): request-changes overlay on a real
revision; the Host-this-version button in the version tree; the domain
search → connect flow.

## 5. Brand kit for the video

- Mark: `public/brand/variants/` — rounded hexagon, two pages. Use
  `mark-indigo-transparent.svg` on light frames; the white-on-black variant
  only for the opening hook frame.
- Type: Inter 600 for display, Inter 400 body, JetBrains Mono for the browser
  URL only. Tabular figures for the price.
- Colour: `#ffffff` / `#f6f7f9` surfaces, `#0a0a0c` ink, `#2f3dd6` accent
  (or `#5900ff` if decision 2 goes the other way — one variable).
- Motion: 200–400ms ease-out moves, `pathLength` line draws, nothing
  bouncy. Each text card on screen ≥ 2× its reading time.
- Safe areas: 9:16 keeps the top 220px and bottom 320px clear of text
  (TikTok/Reels UI).

## 6. Brief for Claude Code (paste once decisions in §0 are made)

> Read docs/ads/LAUNCH-VIDEO.md. Build concept A as a Remotion project in
> `tools/video/` (its own package.json; it must not touch the site build or
> `verify`). Compositions: `Launch16x9` (1920×1080, 52s), `Launch9x16`
> (1080×1920, 52s), and `Ad9x16_V1`, `_V2`, `_V3` (1080×1920, 15s), 30fps.
> All copy and the accent colour live in one `script.ts` file as named
> constants; prices and the beta discount are imported from
> `src/data/site.js`, never typed. The end card and every CTA say "Join the
> list at getyourwebsite.now/beta" — no "free mock" anywhere in the video. Reuse the site's drawings by porting `src/components/anim/*` and
> `VersionTree.astro` to React components driven by Remotion's frame clock,
> not CSS animation. The Cedar & Stone homepage is `public/landscaping.html`
> rendered in a drawn phone frame via an iframe screenshot sequence — never a
> mock-up of it. Honesty rules in §2 and §4 apply exactly; if a scene needs
> something that isn't real, draw it in the site's style and label it, or
> cut it. Render a contact sheet (one frame per scene) to
> `tools/video/out/contact-sheet.png` and look at it before rendering video.
> Prerequisite: `docs/redesign/STEP-9-beta-mode.md` has been run and
> `/beta` exists on the site. Then render all five MP4s to `tools/video/out/`, each ≤ 20 MB, H.264,
> with burned-in captions for the 9:16 cuts and SRT files for the 16:9.
> Add `tools/video/out/` to .gitignore. Commit "Launch video: Remotion
> project" on a branch `ads/launch-video`. Stop.
