# STEP 6 — Final pass. No merge, no deploy.

Same protocol: plan first, wait for "go". After "go": do everything below, run the
full suite, commit as "Phase 6: final pass", stop. **Do not merge to `main` and do
not deploy** — that's a separate instruction Jack gives after he's looked at the
branch himself. Branch stays `redesign/light-rebuild`.

## 0. Carried-over fixes

1. **CTA label.** Every primary call-to-action on the site says **"Get a free
   mock"** — same words, no arrow. `/demo`'s closing band still says "Request a free
   mock →". `grep -rn "Request a free\|free mock →" src` must return nothing.
2. **`/contact` radio.** The "what's this about" group still defaults to "A free
   mock", which nudges people toward the form the new lead tells them not to use.
   Default it to "Something else"; keep the free-mock option (with a hint linking
   `/free-mock`).
3. **404 page.** Check `/404` by eye at both widths — it was never in a phase. Light
   tokens, one line, one link home, same bare footer as `/free-mock`.

## 1. Social preview image

`public/og.png` is the old dark design. Every link shared on Facebook, iMessage,
LinkedIn will show it. Replace it:
- 1200×630, light background `--bg`, the brand mark + wordmark top-left, the
  headline "Your business online — built, hosted, and kept current for you." in
  Inter at a size that reads at thumbnail, and the hero's version-tree SVG (static
  final state, no animation) on the right. No gradients, no glow.
- Generate it with Playwright from a one-off HTML file in `tools/` (so it's
  reproducible: `npm run shots:og`), not by hand.
- Add a page-specific OG image for `/pricing` only if it's trivial; otherwise one
  image site-wide is fine.
- Look at the output. The text must not clip.

## 2. Meta Pixel — build the slot, leave it off

The ad plan needs a Meta Pixel on `/free-mock` and `/free-mock/thanks` for
retargeting and the Lead event. The privacy page currently says "We don't use
analytics, advertising or tracking cookies" — which is true today and must stay
true until Jack decides otherwise. So:
- Add `export const META_PIXEL_ID = ''` to `site.js` with a comment: *"Leave
  empty until the privacy page's 'Cookies and tracking' section has been updated
  to disclose the Meta Pixel. Setting this without that edit makes the privacy
  page false."*
- In `BaseLayout.astro`, when `META_PIXEL_ID` is non-empty: load the pixel on
  every page, fire `PageView`, and on `/free-mock/thanks` fire `Lead`. When empty:
  emit nothing — not a comment, not an empty script tag. Verify with a build grep
  that `connect.facebook.net` appears nowhere in `dist/` while the ID is empty.
- In the commit body, write out the exact sentence the privacy page needs when
  the pixel is turned on (Jack will paste it into the legal page himself). Do not
  edit `/privacy` or `/terms` in this step.

## 3. Lighthouse

Run Lighthouse (`npx lighthouse`, mobile preset, against `npm run preview`) on
`/`, `/work`, `/pricing`, `/free-mock`. Target ≥95 on all four categories. Put the
four score lines in the commit body. If anything is below 95, fix it if it's
ours (image sizes, missing `width`/`height`, unused CSS, font preload) and report
it if it's not (Formspree, MapLibre tiles on a screenshot we don't load). Don't
chase a 94 with hacks.

Specific things to check while you're there:
- Every `<img>` has explicit `width`/`height` and `loading="lazy"` below the fold.
- Inter is preloaded (woff2, the weights actually used), nothing else is.
- `public/shots/*` are optimised (webp, ≤200 KB each; the ARK and ChemEd client
  shots can be larger but not >400 KB).
- No console errors on any page.

## 4. Docs

- `README.md`: rewrite the colour, type and components sections for the new
  system (one accent, Inter + JetBrains Mono for eyebrows, light surfaces, footer
  only dark). Remove the `[EDIT]` convention — there are none left. Document the
  scripts: every `verify:*`, `shots:*`, and what each gate catches. Keep it short;
  the file is for the next person who touches the repo, not a design essay.
- `CLAUDE.md`: update the hard rules for the new palette (no gradients/glow/
  bento/glass; gold is the brand mark and one badge only; prices only in
  `site.js`; one reply-time phrase; legal pages are not edited for voice). Add the
  three traps this rebuild hit so they don't recur: stale Astro dev-server CSS
  after `cp` (restart before capturing), `Astro.url.searchParams` is empty on
  static builds, JSX newline-between-anchors makes a stray space.
- Delete `REDESIGN.md` — it's done. Keep `docs/redesign/STEP-*.md` as the record.
- `.gitignore`: add `Claude outputs/`.

## 5. Final checks before commit

- `npm run build` clean; `npm run verify` and all gates green.
- `git status` shows only intended changes; nothing in `.shots/` is tracked.
- Click through every nav and footer link on the preview build — no 404s, the
  `/benefits` redirect lands on `/why-us#why-a-website`.
- Screenshot `/` and `/pricing` at 1440 one last time into `.shots/phase6/`.
- Commit "Phase 6: final pass". Then write a short `docs/redesign/HANDOFF.md`:
  what changed per phase (one line each, commit hashes), the known open items
  (ARK hosting claim, Meta Pixel + privacy sentence, TEAM_NAMES, testimonial
  needs Jay's OK), and the exact commands to merge and deploy — but don't run
  them. Stop.
