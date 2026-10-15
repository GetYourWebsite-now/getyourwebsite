# STEP 10 — Depth: the merge diagram, grain, one dark band, hover light

Team review: "flat, no dimension, surface-level; the merge section is the
main attraction and can be so much better." Run after STEP-9 is merged.

Protocol: plan first, wait for "go". Branch `depth` off `main`. Every gate,
screenshots of `/` at 1440 and 390 plus a 6s recording into
`.shots/phase10/`, look, commit "Depth: merge diagram, grain, dark band,
hover light", stop.

The brief is **subtle depth, still Stripe, not ClickUp**. A plumber has to
trust it. Nothing here adds a colour; everything uses the tokens that exist.

## 1. The merge diagram — rebuild it as a diagram

Problems: unequal paths, no prices, cramped, and "You do the work" was read
as *our* pitch. Rebuild `MergeAnim.astro`:

- **Symmetry.** Three paths each side, same lengths, same curve, mirrored.
  Left (DIY): *Squarespace · Wix · AI site builders* — one row each, plain
  text, no logos. Right (agencies): *Design studios · Marketing agencies ·
  Freelancers*.
- **Labels that can't be misread.** Each column gets a small header in
  `--ink-muted`, sentence case: **"If you build it yourself"** / **"If you
  hire an agency"**, and the centre: **"GetYourWebsite"**. The verbs "You do
  the work" / "They do the work" go under those headers as the first line,
  so they read as descriptions of *them*, not us.
- **Price ranges, honestly.** Under each column, in the same style as our
  price: left *"$16–$50 a month, plus your evenings"*; right *"typically
  $3,000–$10,000+ per site"*; centre *"Startup from $600 · Maintenance from
  $49/mo"* (computed from `site.js`, and the beta price while `BETA.on`).
  Verify the two outside ranges on the day against the builders' public
  pricing pages and two published agency-pricing surveys; write the range
  you can defend and put the URLs in a comment in the component. Say
  "typically", never a single number, never a per-competitor price.
- **Space.** The section gets its own full-height stage: 160px vertical
  padding at desktop, the diagram ≥ 720px wide, columns ≥ 220px from the
  mark, the mark 96px. At 390 it stacks: left column, mark, right column,
  with the paths redrawn vertically.
- **Motion.** Paths draw in from the outside over 1.2s (`pathLength`),
  staggered 120ms; the mark fades up after the first path lands; the price
  lines count up over 600ms. One 8s loop with a 3s hold at the end state.
  Reduced motion: end state.
- **Headline** stays: **"Done for you. Without the agency bill."** Add the
  one-line sub: *"Built and hosted by our platform, checked by a person,
  priced like a tool — not a retainer."*

## 2. A depth system, six rules

Add to `global.css` and use *only* as listed:

1. **Grain.** A `--grain` overlay: an SVG `feTurbulence` noise data-URI at
   3–4% opacity, `mix-blend-mode: multiply` on light surfaces, `screen` on
   dark. Applied to: the hero, the dark band (§3), the merge stage, the
   closing CTA band. Nowhere else. Must not move Lighthouse below 95.
2. **Radial light.** One soft radial gradient per surface that has grain:
   `radial-gradient(60% 50% at 30% 20%, rgba(47,61,214,0.06), transparent
   70%)` on light, `rgba(47,61,214,0.18)` on dark. One per section, top
   left or top right, never centred, never two.
3. **Card lift.** Cards get a 1px `--line` border *and* a two-layer shadow
   (`0 1px 2px rgba(10,10,12,.04), 0 8px 24px rgba(10,10,12,.06)`); on hover
   the second layer deepens to `.10` and the card rises 2px over 200ms.
   Applies to tier cards, case-study frames, the drawing frames.
4. **Hover light on primary buttons.** A 1px gradient edge
   (`linear-gradient(135deg, rgba(255,255,255,.35), transparent 40%)` as
   a mask-composited border) plus the existing darker fill. No glow, no
   blur, nothing outside the button's box.
5. **Section rhythm.** White / `--bg-alt` alternation stays, but every
   third surface may be the dark band (§3). Grain + radial make the `--bg-alt`
   surfaces read as paper, not grey.
6. **No gradients on text, no gradient fills on the mark, no blur-glows, no
   colour that isn't a token.** `verify:contrast` runs on every surface
   including the dark band.

## 3. One dark band

The platform section ("Running the site is the part we built." with the
three drawings) becomes the page's single dark surface: `--footer`
background, `--footer-ink` body, white headings, the drawings re-skinned
with dark frames (white strokes at 24%, indigo stays indigo, the "Live" and
"Approved" pills unchanged). Grain + radial per §2. Everything else on the
page stays light. This gives the page a middle, and makes the portal — the
product — the thing that looks different.

## 4. Hero dimension

Keep the version tree. Add: grain + a top-right radial; the browser frame
gets the card lift and a faint inner highlight line at its top edge; the
headline gets `text-wrap: balance`. Nothing else.

## 5. Gates

Every existing gate, including `verify:words` (no copy changes except §1),
`verify:contrast` on the dark band, Lighthouse ≥ 95 on `/` (grain is a data
URI, not a file). `grep -rn "linear-gradient\|radial-gradient" src` returns
only the lines §1–§4 add. Screenshots and the recording looked at. Commit.
Stop.
