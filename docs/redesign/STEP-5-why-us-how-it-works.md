# STEP 5 — Why Us, How it works, Benefits merge, voice sweep

Same protocol: read all of this, plan first (files, anything you can't verify,
anything that contradicts REDESIGN.md), wait for "go". After "go": build, run the
full suite, screenshot `/why-us`, `/how-it-works`, `/demo`, `/contact` at 1440 and
390 into `.shots/phase5/`, look at them, commit as "Phase 5: why us, how it works,
benefits merge", stop. Do not start Phase 6. Branch stays `redesign/light-rebuild`.

Also do everything in `docs/redesign/PHASE-5-TODO.md` — this step supersedes it.
Delete that file in the same commit once every item is done.

## 0. Carried-over fixes

1. On `/pricing`, the Custom card's example links have whitespace inside the
   anchors: "Allergy Rescue Kit␣" and "␣ChemEd…" — the underline runs under the
   space. Trim the whitespace inside the `<a>` tags; keep the middle-dot separator.
2. Delivery timing (PHASE-5-TODO): go with its option 2. One response-time promise,
   in the same words everywhere: **"We reply within one business day."** That phrase
   appears on `/free-mock`, `/contact`, `/why-us`, and anywhere else a reply time is
   mentioned. Every build-time estimate ("1–2 weeks", "usually …", "two to four
   days") is removed, not reworded.
3. Voice: "free mock" everywhere, never "free mockup" / "mock-up". `grep -rni
   "mock-up\|mockup" src` must return nothing when you're done (the README is Phase 6).
4. The mono sweep you offered: **no.** Mono stays on eyebrows, step numbers, the
   MOST POPULAR flag and the browser-frame URL. That's the system; leave it.

## 1. Benefits → merged, `/benefits` gone

REDESIGN §2 said to merge Benefits into How it works. Having read both, that's the
wrong target: How it works is about the *product* (versions, hosting, photos);
Benefits is about *why a business needs a site at all*. The right home for that
argument is **Why Us**, which is where a sceptical owner goes to decide whether to
trust us.

So:
- `/why-us` gains a section **"Why a website at all"** built from Benefits'
  "Same business, two very different weeks" (the with/without comparison, which
  the home page already shows in short form — reuse the same component, don't
  fork it) and "Three things a site actually does for you". Keep Benefits'
  "We're not going to make up numbers" paragraph — it's the most on-brand thing on
  the old site — as the section's closing line.
- `src/pages/benefits.astro` is deleted. Add a redirect `/benefits` →
  `/why-us#why-a-website` in `astro.config.mjs` (`redirects`), so old links and
  anything Google has indexed still land somewhere. Remove Benefits from Nav,
  Footer, the sitemap, and the verify page lists.
- Nav after this step: Our Work · Pricing · How it works · Why Us · [Get a free
  mock]. "Demo" leaves the nav (it's linked from How it works and the home platform
  section; it doesn't need a top-level slot). Footer keeps Demo and Contact.

## 2. `/why-us` — rewrite

The old page leads with "We're high school students. That's the point." That was
right when the pitch was sympathy and price. The business now sells a product with
real client work and $900+ tiers, so the student fact moves down the page and
becomes a reason to trust the *care*, not a reason to buy. Nothing about it is
hidden; it's just no longer the headline.

Order, alternating surfaces:

1. **Header** — eyebrow `WHY US`, H1 **"You talk to the people who build it."**
   (same line as the home page's Why Us teaser — keep them identical), lead: "We're
   a small team. Your project is not one of forty. When you email, the person who
   replies is the person who built your site, and they reply within one business
   day."
2. **How we work** — four short promises, two-up grid, each a bold line + one
   sentence. Use the existing "What it means for you" promises if they're still
   true; cut any that aren't. Must include: every version kept, you own the site,
   no templates / page builders, one business day replies. No invented numbers.
3. **Who we are** — H2 **"Two students, one company, two live clients."** Three
   paragraphs max, first person plural, built from the old "Three reasons we do
   this" but shorter: (a) the businesses here deserve to be online and we decided
   to fix that; (b) we live here — building something for a business down the road
   and then walking past it is the whole point; (c) we're paying for college with
   this, we'll say it plainly, and it means a happy client telling someone else is
   the entire business model.
   - The **names / school / town line**: render it **only if** `TEAM_NAMES` in
     `site.js` is non-empty. Add `export const TEAM_NAMES = ''` with a comment that
     Jack decides whether names go public. No `[EDIT]` tags anywhere on the page.
   - **Team photo**: the placeholder is gone (Step 1). Do not add a photo slot
     back. If a real photo exists later it gets added then.
   - Legal line, small, muted: "GetYourWebsite LLC, Michigan." — read `LEGAL_NAME`
     and `LEGAL_STATE` from `site.js`, don't hardcode.
4. **Why a website at all** — the merged Benefits section (§1), `id="why-a-website"`.
5. **The work** — the two client case-study thumbnails (the `thumb` variant from
   `/free-mock`, but *with* links here), heading "Judge us on these." One line:
   "Both are live. Click through and look around."
6. **CTA band** — the standard closing band → `/free-mock`.

Nothing on this page claims a number we don't have. No "100+ businesses", no
"5-star", no testimonial unless Jay's written OK exists in the repo (it doesn't).

## 3. `/how-it-works` — re-skin, keep the structure

The structure is good and it's the product page. Keep every section; re-skin to the
tokens:
- Light surfaces alternating; the only dark surface on the site is the footer
  (REDESIGN §1). Any dark panels on this page become light cards with the
  1px border.
- Replace any portal screenshots that still show the old dark theme with the
  light ones captured in Phase 2 (`public/shots/`), re-cropped if needed. Every
  screenshot must be of the real `client/` portal — nothing mocked up.
- Keep "Run the test yourself" → `/demo`. Keep the "It isn't one prompt into a
  chatbot" section; it's true and it's a differentiator — but verify each sentence
  against how `Generate-Website-v2` actually works today (21st.dev component
  search, vision ranking, human review before the client sees it). Drop any
  sentence you can't confirm from the repo or the n8n export.
- Mono stays on step numbers.

## 4. `/demo`

Re-theme the sandbox chrome (frame, header strip, caption) to the light tokens.
The portal inside the frame keeps the portal's own tokens — it's a screenshot of
the real product. If `tools/shots:teaser` exists, rerun it and commit the output;
if the `client/` dev server on :5174 isn't running, start it the way Phase 2 did.
Update `src/data/portal-sync.json` if the pinned commit changes (it probably
doesn't — note that in the commit body either way).

## 5. `/contact`

Keep the page; it's for everyone who isn't an ad click. Changes:
- Voice sweep (§0.3) and reply-time line (§0.2).
- Lead: "For a free mock, the fastest route is `/free-mock`. For anything else —
  an existing site, a quote for something unusual, a question — use the form
  below or email hello@getyourwebsite.now." Link the `/free-mock` mention.
- Keep the Formspree form as is, but add a hidden `source=contact` field to match
  `/free-mock`'s `source=free-mock`.
- The numbered "what happens next" steps: three steps, no timings except the one
  business day reply.

## 6. Before you commit

- `npm run verify` — all five gates green on the full page list (minus
  `/benefits`, plus `/free-mock` and `/free-mock/thanks`).
- `grep -rni "mock-up\|mockup\|weeks\|within a day or two" src` returns nothing
  (comments included — rewrite the comments).
- `grep -rn "\[EDIT" src` returns nothing.
- Screenshots in `.shots/phase5/`, looked at by you. Restart the dev server first.
- Delete `docs/redesign/PHASE-5-TODO.md`.
- Commit "Phase 5: why us, how it works, benefits merge". Stop.
