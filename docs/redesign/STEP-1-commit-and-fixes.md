# Step 1 — Commit Phases 1–2, then small fixes

Read this whole file before doing anything. Then do it in order.

## A. Commit what exists

Two commits, in this order, from the current working tree:

1. `Phase 1: light tokens, Inter, nav and footer` — the token/font/nav/footer changes.
2. `Phase 2: home hero, proof, how it works, platform rows` — everything else.

If the changes can't be cleanly separated, one commit titled `Phases 1–2: light redesign, home page` is acceptable. Do not leave the tree uncommitted.

Decision: **keep the brand mark as-is.** No redraw.

## B. Fixes (commit as `Phase 2 fixes`)

1. **Proof strip.** Currently "2 / 65 / 51" — two of the three numbers are page counts of one client, which reads as padding. Replace with two or three facts about GetYourWebsite itself, each sourceable: e.g. "2 live client sites", "Launched September 2026", "Every site accessibility-checked (WCAG AA)". Move the sitemap-count methodology note out of body copy into a small footnote or `title` attribute.
2. **Platform section.** Keep the hero portal screenshot as-is. For the two other portal screenshots, crop tighter on the feature being described. Check whether `~/Developer/GetYourWebsiteAdmin/client` has a light theme; if it does, re-shoot those two in light.
3. **Why Us.** Remove the `[EDIT: team photo]` dashed placeholder box entirely. The text column stands alone until a real photo exists.

## C. Verify and report

Run the full verify suite, screenshot `/` at 390 and 1440 into `.shots/step1/`, look at them, and report what changed. Then stop and wait — do not start the hero pass or Phase 3.
