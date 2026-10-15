# Launch video

Concept A from `docs/ads/LAUNCH-VIDEO.md`, as a Remotion project: the 52s
film in 16:9 and 9:16, and three 15s vertical ads. Its own `package.json`;
nothing here is part of the site build or `npm run verify`.

```bash
cd tools/video
npm install
npm run table     # every cut's beats and text cards, checked against the
                  # reading-time rule (fails if a card is too short)
npm run studio    # scrub it in the browser
npm run stills    # contact sheets → out/contact-sheet*.png
npm run render    # stills, then all five MP4s + Launch16x9.srt → out/
npm run capture   # re-capture the Cedar & Stone site (after it changes)
```

| Output | Size | Length |
| --- | --- | --- |
| `Launch16x9.mp4` + `.srt` | 1920×1080 | 52s |
| `Launch9x16.mp4` | 1080×1920 | 52s |
| `Ad9x16_V1.mp4` pain → product | 1080×1920 | 15s |
| `Ad9x16_V2.mp4` positioning | 1080×1920 | 15s |
| `Ad9x16_V3.mp4` offer-forward | 1080×1920 | 15s |

H.264, 30fps, yuv420p in limited range (color_range tv, BT.709-tagged), each
20 MB or less (render.mjs checks the size). `out/` is gitignored.

## Where things are

- `src/script.ts` — every word, the accent, every beat's timing, and the
  reading-time rule (a card stays up for 2× its reading time at 4 words/s;
  cards on screen together are read together). Prices and the beta offer are
  imported from `src/data/site.js`; the file refuses to load if beta is off.
- `src/drawings/` — the site's drawings ported to the frame clock:
  `MergeDiagram` (MergeAnim.astro), `ClickToChange`, `VersionTree` (reads the
  site's own `src/data/version-tree.js`), `DomainConnect`, the `Mark`; and
  `Props.tsx`, the drawn things that aren't on the site (the hook's phone,
  the intake form, the phone frame).
- `capture.mjs` → `assets/captures/landscaping-390.jpg` — the real
  `public/landscaping.html`, with its loremflickr images swapped for the
  Pexels photos in `assets/photos/` (sources and licence in `PHOTOS.md`),
  cut off above the page's fictional testimonial.
- `assets/brand/` — the two marks, copied from `public/brand/variants/`.

## Honesty rules this follows

The site's, and the doc's §2 and §4. In particular: Cedar & Stone is labelled
fictional whenever its site is on screen, and the form and the site are not
shown as cause and effect (the site was built by hand, not generated from
that form). Its domain is `cedarandstone.example`, because cedarandstone.com
is a real business. No free mock, no Cloudflare claim, no invented review.
