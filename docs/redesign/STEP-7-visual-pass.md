# STEP 7 — Visual pass: less text, more product, new mark

Feedback on the rebuilt site, verbatim from the team: *too much text; more
images and animations, and they shouldn't be useless; Stripe and Cluely as the
bar for UI, motion and the balance of text / image / blank space; techy but
reliable; say plainly that we do the work for them.*

Prerequisite: the client portal light re-skin
(`~/Developer/GetYourWebsiteAdmin/client/LIGHT-RESKIN.md`) is committed on
`client/light-reskin`. Its commit hash goes into `portal-sync.json` in §2. If
it isn't done yet, stop and say so.

Same protocol: plan first, wait for "go". Then build, run every gate,
screenshot `/`, `/how-it-works`, `/demo` at 1440 and 390 into
`.shots/phase7/`, look at them, commit "Phase 7: visual pass", stop. Branch
`redesign/light-rebuild`. The honesty rules do not relax for this step: no
stock photos, no invented numbers, no fake UI — every picture is of the product
or a stylised drawing of something the product really does.

## 1. The mark

`public/brand/mark.svg` is the new logo: a hexagon holding two overlapping
pages, one flat fill. Wire it in:
- Nav and footer: mark at 24px, inlined so it takes `currentColor` (indigo on
  light, white in the footer), wordmark "GetYourWebsite" in Inter 600 — same as
  now, just the new mark. The gold mark is retired everywhere.
- `favicon.svg`, `apple-touch-icon.png` (180px, mark on white with 20px
  padding), and `og.png` (regenerate via `shots:og`).
- Gold stays only on the free-mock badge. `grep -rn "f5c24b" src` should hit
  the badge token and nothing else.
- `public/brand/mark-gradient-source.png` is the original Canva export; keep
  it for reference, don't use it on the site.

## 2. Real portal, light

- Re-pin `src/data/portal-sync.json` to the `client/light-reskin` commit and
  rebuild the `/demo` sandbox to it. The `.sandbox` dark token overrides go
  away; the sandbox is now light like everything else, and the banner's
  literal colours (Phase 5) can go back to tokens.
- Re-run `shots:portal` against the light portal on :5174. Every portal
  screenshot on `/` and `/how-it-works` is replaced.
- The hero keeps the drawn version tree — it's better than a screenshot there.

## 3. Cut the words

Visible word counts today (nav/footer excluded): home **1,065**, how-it-works
911, why-us 860, pricing 774, work 548. Targets: home **≤ 550**, how-it-works
≤ 550, why-us ≤ 600. Pricing and work are fine.

Rules for every section on `/` and `/how-it-works`:
- Eyebrow (optional) · headline ≤ 8 words · one line ≤ 22 words · the visual.
  No second paragraph. Bullets only where they're the content (pricing,
  case-study facts).
- Section padding goes up to 112px at desktop (Stripe spacing), 64px mobile.
- One primary button per section, two only in the hero.
- Add a `tools/words.mjs` gate (`npm run verify:words`) that prints the
  per-page count and fails above the targets, and wire it into `verify`.

Nothing factual gets lost: facts that come out of body copy move into the
visual's labels or into `/how-it-works`.

## 4. The hero says we do the work

Headline stays. Lead becomes one line: **"You never touch a website builder.
Tell us about the business; we build it, host it and keep it current."**
Delete the second sentence that's there now. Under the buttons, the "Live for
Allergy Rescue Kit and the ChemEd 2027 Interest Map" line stays — it's the
proof.

## 5. Four animations, each one earning its place

All drawn in the same system as `VersionTree.astro`: SVG/CSS, Inter labels,
white cards, `--line` strokes, indigo for the one thing that matters. Loop
5–8s, `prefers-reduced-motion` shows the final frame, no libraries, no WebGL,
nothing heavier than what the hero already does. Build each as its own
component in `src/components/anim/`.

**(a) `MergeAnim.astro` — the positioning section.** New section on `/`,
directly under the hero. Three columns at desktop, stacked on mobile:
- Left: a column of plain-text labels in `--muted` — *Squarespace · Wix ·
  Base44 · Replit* — heading **"You do the work"**, one line: "Templates and
  prompts. Nights and weekends. Yours to maintain."
- Right: labels *Design studios · Marketing agencies* — heading **"They do the
  work"**, one line: "Done for you, at agency prices and agency timelines."
- Centre: the two columns' lines converge on our mark, which draws itself in
  (hexagon outline via `pathLength`, pages fade in). Heading **"Done for you.
  Without the agency bill."** One line: "Built, hosted and kept current by
  people you can email. From $900."
- Brand names are plain text in our own type, never their logos or colours.
  No claims about their prices or quality beyond the two lines above.
- Replace the current with/without comparison on `/` with this; the
  comparison stays on `/why-us`.

**(b) `ClickToChange.astro` — the "click the paragraph" moment.** A small
drawn page; a cursor clicks a heading; the heading gets an indigo outline; a
note box appears with "Make this warmer"; it sends; a new node appears on a
mini version tree with "Approved". This replaces the body copy in the
platform section that currently explains it in words.

**(c) `PhotoDrop.astro`** — a photo tile drags onto an empty slot in a drawn
page, the slot fills, "Saved". Replaces the "Your photos" paragraph.

**(d) `DomainConnect.astro`** — a domain field types `rosasbakery.com`,
a check appears, a padlock, "Live". Replaces the "Hosting and the domain"
paragraph. Keep the one sentence about Cloudflare's network, it's true and
it's the reliability signal.

(b)–(d) sit in the platform section of `/` as a three-row alternating layout
(visual left / text right, then swapped), and are reused on `/how-it-works`
in place of the equivalent paragraphs there.

## 6. Techy but reliable — the tone check

Techy is the motion, the mono eyebrows, the product drawings. Reliable is
white space, Inter, one accent, real client sites, "a person reviews every
change", "we reply within one business day". If a change makes it look like a
launch-week AI startup — gradients, glow, marquee logo walls, "10x" —
it's wrong for this audience. A plumber has to trust it.

## 7. Gates before commit

- `verify` + all gates green, including the new `verify:words`.
- `verify:portal` green against the new pin.
- Lighthouse ≥ 95 on `/` still (animations are CSS/SVG; if perf drops, the
  animation is too heavy — simplify it, don't lazy-hack it).
- `grep -rn "f5c24b" src` → badge only. `grep -rn "Outfit\|Clash" src` → nothing.
- Screenshots in `.shots/phase7/`, plus a 6-second screen recording of `/`
  scrolling at 1440 (`tools/record.mjs`, Playwright video) saved to
  `.shots/phase7/home.webm` — motion can't be judged from stills.
- Commit "Phase 7: visual pass". Stop.
