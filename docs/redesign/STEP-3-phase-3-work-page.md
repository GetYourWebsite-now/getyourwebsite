# Step 3 — Phase 3: Work page and case studies

Read this whole file and REDESIGN.md §2 "Our Work" before doing anything. **Plan first, then wait for my OK before building.**

## Goal

Real client work leads. Fictional concept sites are demoted and labelled honestly.

## Work page (`work.astro`)

1. H1: "Work". Delete "real client work coming soon."
2. **Section 1 — Client work.** Two full-width case-study blocks, in this order:
   - **Allergy Rescue Kit** — https://allergyrescuekit.com. Facts (from the repo, don't embellish): Astro static site; 13 pages plus 51 state pages generated from a verified state-law dataset; WCAG AA; structured data; no analytics or tracking cookies by policy; launched 10 Sept 2026 after 24 build rounds with founder feedback. Live link.
   - **ChemEd 2027 Interest Map** — https://chemed-interest-map-production.up.railway.app/. Facts: Next.js + Postgres web app for the ChemEd 2027 conference (EMU, July 2027); 131k-school typeahead from NCES data; clustered / heatmap / choropleth map modes; organizer admin with CSV import/export. Name the conference, not any individual. Live link.
   - Each block: desktop + phone screenshot, client, sector, "what we built" (3 factual bullets), one-line outcome, live link. Alternate image side.
3. **Section 2 — Concept sites.** The six existing mocks under the heading "Concept sites — fictional businesses we built to show range", 3-up grid, visually quieter (smaller cards, no featured treatment).

## Screenshots

Take them with Playwright into `public/shots/`:
- ARK: 1440×900 and 390×844 of the home page from the live URL.
- ChemEd: 1440×900 and 390×844 from the live URL, **map view, not the list view**. Wait for tiles and markers to load before capturing. If the map shows demo attendees, that's acceptable for now.

## Data

- Add both to `PROJECTS` in `src/data/site.js` with `kind: 'client'`; give the six mocks `kind: 'concept'`.
- `FEATURED_PROJECTS` = the two client sites only.
- Home page "Our Work" section: replace the three concept cards with the two client cases (2-up, symmetric) and a "See all work →" link.
- Update `ProjectCard.astro` or add a `CaseStudy.astro` component as needed.

## Verify and report

Verify suite green, screenshots of `/` and `/work` at 390 and 1440 into `.shots/phase3/`. Look at them. Commit as `Phase 3: client case studies, work page restructure`. Then stop and wait for Phase 4 (pricing).
