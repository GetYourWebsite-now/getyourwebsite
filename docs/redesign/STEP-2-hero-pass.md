# Step 2 — Hero pass

Read this whole file before doing anything.

The hero is clean but static. It is the one place on the site where we spend visual budget — the Stripe move is motion *inside the product*, not decoration around it. Everything else on the page stays restrained.

## 1. Replace the raw screenshot with a stylised version tree

Inside the existing browser frame, replace the dark portal screenshot with a **light-themed, stylised rendering** of the version tree:

- 5 nodes using the portal's real labels: `First build` → `Warmer photos` → `Online orders` → branches to `Christmas` and `Spring menu`.
- Larger type than the real portal (legible at 1440 hero size and at 390).
- Each node: white card, 1px `--line` border, label + small "Approved" caption.
- One node carries an indigo `Live` badge.
- Connectors: 1.5px `--ink-muted` lines with a subtle curve on the branches.
- Background inside the frame: `--bg-alt`. No gradients, no glow, no shadows beyond the frame's own.

This is honest — it is the real feature with real labels — but readable.

## 2. Animate it on load

- Nodes fade/slide in in sequence (~120ms apart), connectors draw after their source node appears.
- After ~1.5s the `Live` badge moves from `Online orders` to `Christmas`; after another ~2s it moves back. Loop with a pause.
- Total loop ~5s. Respect `prefers-reduced-motion`: show the final state, no motion.
- SVG + CSS or a small vanilla script. **No libraries.**
- If `hero.js` (the old self-building-site canvas) is no longer used anywhere, delete it and its verify tooling references cleanly.

## 3. Copy

- Headline: **"Your business online — built, hosted, and kept current for you."** Also propose two alternates in the same register (states what we do, not a slogan) and list them in your report.
- Lead: cut to **two sentences** max.
- Under the buttons add one quiet line in `--ink-muted`: "Live for [Allergy Rescue Kit](https://allergyrescuekit.com) and the [ChemEd 2027 Interest Map](https://chemed-interest-map-production.up.railway.app/)" — plain text links, no logos.

## 4. Verify and report

Verify suite green, screenshots at 390 and 1440 into `.shots/step2/`, plus 3 sequential frames of the animation. Look at them. Commit as `Hero: animated version tree`. Then stop and wait — do not start Phase 3.
