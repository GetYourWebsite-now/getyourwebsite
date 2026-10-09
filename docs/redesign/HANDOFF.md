# Redesign handoff

Branch **`redesign/light-rebuild`**. Nothing merged, nothing deployed.

The brief was to take a site that looked like a student design studio — dark
space hero, black-hole animation, "built by high school students" in the
headline — and rebuild it as a light, restrained marketing site for a product
that sells at $900–$3,000 plus a care plan. The step files in this directory
are the record of how it was done, in order.

## What changed, per commit

| Commit | What |
| --- | --- |
| `89d0aa1` | **Phases 1–2.** Light tokens, Inter + JetBrains Mono self-hosted, nav and footer, the whole dark-section atmosphere deleted. New home page: hero, proof strip, how-it-works steps, platform rows built on real portal screenshots. `hero.js` and the 550vh scroll hero removed. |
| `f48478c` | **Phase 2 fixes.** Proof strip cut to facts about us; platform screenshots cropped to the feature each claim is about; team-photo placeholder removed. |
| `8573e4d` | **Hero.** The portal screenshot in the hero frame replaced with a drawn, animated version tree — same five labels, legible at every width, still under reduced motion. |
| `91b57e6` | **Phase 3.** Real client work leads `/work` and the home page; the six fictional mocks demoted and labelled. Two case studies built from facts checked against the live sites. |
| `ee0e59c` | **Phase 4.** Real prices, Care plan, comparison table, pricing FAQ, and `/free-mock` — the ad landing page, with no nav and no way out but the form. |
| `6e0ff5b` | **Pricing figures** set in Inter with tabular numerals rather than mono. |
| `6dafd77` | **Phase 5.** `/benefits` merged into `/why-us` and deleted (with a redirect); Why Us rewritten so the student fact argues for the care, not the discount; one reply-time promise site-wide. |
| `(this)` | **Phase 6.** New social card, Meta Pixel slot (off), Lighthouse, docs. |

## Open items — things that need a human decision

**1. The ARK hosting claim.** Allergy Rescue Kit is hosted on Railway, by its
own privacy page — not on the Cloudflare network the site says we host clients
on. The case study deliberately says nothing about hosting, so nothing on the
site is false. But if ARK is ever cited as an example of our hosting, it
would be.

**2. Meta Pixel + the privacy page.** `META_PIXEL_ID` in `src/data/site.js` is
empty and the layout emits nothing while it is — no script, no comment, no
connection to facebook.net. **Before setting it**, the "Cookies and tracking"
section of `/privacy` has to change, because it currently says we use none.
The sentence it needs:

> **Advertising.** We use the Meta Pixel on our free-mock pages
> (`/free-mock` and the thank-you page that follows it) to measure how well
> our ads work and to show ads to people who visited but did not get in
> touch. It sets cookies in your browser and sends Meta your IP address and
> the pages you viewed. You can opt out of this kind of advertising at
> <https://www.facebook.com/adpreferences/ad_settings> and through your
> browser's cookie controls.

Bump `LEGAL_UPDATED` in `site.js` in the same commit.

**3. `TEAM_NAMES`.** Empty in `site.js`. The "Who we are" section on `/why-us`
renders a names/school/town line only when it is set, and reads correctly
without it. Putting two students' names and their school on a public page is
your call, not a default.

**4. The testimonial.** Jay Wilson's "Thanks for such a great site! Best one
ever." (email, 2026-09-10) is real and is not on the site, because there is no
written permission in the repo to publish it with his name. Get that and it
can go on `/why-us` or the home page.

**5. `/terms` and `/privacy` still say "mockup"** while the rest of the site
says "mock". That was deliberate — published legal text is not edited for a
voice sweep — but if you ever revise those pages for another reason, align
them then.

**6. `/contact`'s first radio option is still "A free mock"**, with a hint
pointing at the faster form. It is no longer the default. If ad traffic ever
starts landing on `/contact` by mistake, that option is the place to look.

## To merge and deploy

Neither has been run. In order:

```bash
# 1. Look at the branch yourself first.
npm run dev            # or: npm run build && npm run preview

# 2. All five gates, with the dev server running in another terminal.
npm run verify && npm run verify:contrast && npm run verify:wraps \
  && npm run verify:voids && npm run verify:portal

# 3. Merge. --no-ff keeps the phase history readable as one unit.
git checkout main
git merge --no-ff redesign/light-rebuild

# 4. Push. Deploy is whatever the host does with main — see README,
#    "Where it's deployed".
git push origin main
```

If you would rather land it as one commit than eight, `git merge --squash`
instead of step 3 — but the per-phase messages carry the reasoning for a lot
of non-obvious decisions, and squashing throws that away.

## Where things live

- Design tokens and the rules that govern them: `src/styles/global.css`, and
  the summary in `README.md` → Design system.
- Hard rules and the three traps this codebase has already sprung:
  `CLAUDE.md`.
- Everything editable day to day — prices, nav, projects, contact details:
  `src/data/site.js`. It is the only file in the repo that contains a price.
- Regenerating images: `npm run shots:portal`, `shots:clients`, `shots:og`.
