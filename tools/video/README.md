# Launch video

V2.1 of the beta launch video, as a Remotion project: the 30.5s film in 16:9
and 9:16, and three short vertical ads. The brief is
`docs/ads/LAUNCH-VIDEO-V2.md` — V2 for the script and footage, the "V2.1 —
motion pass" section at the bottom for how it moves. Its own
`package.json`; nothing here is part of the site build or `npm run verify`.

**V2.1 is silent.** No music, no sound effects, no audio stream in any file;
the captions carry it. The effects and `src/audio.tsx` are kept for a later
pass that brings sound back (`assets/sfx/SFX.md`).

```bash
cd tools/video
npm install
npm run table     # every cut's beats on the 120 BPM grid, each caption's
                  # time on screen against the reading rule, the text floor
npm run studio    # scrub it in the browser
npm run stills    # contact sheets → out/contact-sheet*.png
npm run render    # stills, then all five MP4s + Launch16x9.srt → out/, gated
npm run capture   # re-record the footage (needs `npm run build` at the root)

node render.mjs film            # the two films only
node render.mjs film16          # the 16:9 film: contact sheet, MP4, .srt
node render.mjs one Ad_Receipt  # one cut's MP4 and its gates
node render.mjs motion          # the hook + build motion test (V2.1 §9 step 1)
```

## What's in `out/`

`out/` is gitignored; `npm run render` rebuilds all of it.

| File | Frame | Length |
| --- | --- | --- |
| `Launch16x9.mp4` + `Launch16x9.srt` | 1920×1080 | 30.5s |
| `Launch9x16.mp4` | 1080×1920 | 30.5s |
| `Ad_Receipt.mp4` — an agency's receipt, then ours | 1080×1920 | 10s |
| `Ad_AllWeNeed.mp4` — Andy's card, then Andy's site assembling | 1080×1920 | 10s |
| `Ad_OneSentence.mp4` — one sentence in the portal, sent | 1080×1920 | 8s |
| `contact-sheet.png`, `contact-sheet-9x16.png`, `contact-sheet-ads.png` | stills, one or two per beat | |

`node render.mjs motion` adds `motion-test.mp4` (the film's hook and build);
it is not part of `render`.

## Gates

`render.mjs` fails the run on any of these:

- **Reading rule** (before anything renders): a caption stays up at least
  1.2× its reading time at 4 words a second, never under 1.6s (1.2s for four
  words or fewer). **Text floor**: nothing under 28px at 1080p or 34px on
  1080×1920; real recordings are exempt but framed as large as they allow.
- **Nothing still**: no frame identical to the one 15 frames before it, and
  no 0.5s window whose mean difference is under 0.08 (160px greyscale).
- **Silent**: no audio stream.
- **No pure black or white**: no frame with half or more of its pixels at
  #000 or #fff. The stage is #0a0a0c, type #f6f7f9.
- Under **25 MB**; **H.264, yuv420p, limited range, BT.709**, 30fps.

## Where things are

- `src/script.ts` — every word, every beat's timing on the 120 BPM grid, and
  the reading rule. Prices, the discount and the seat count are imported
  from the site's `src/data/site.js`; the file refuses to load if beta is
  off.
- `src/sizes.ts` — the two frames' layouts (stage, caption band, lower
  third) and the text floor.
- `src/Cut.tsx` — one cut: the dark stage, each beat under its camera, whip
  pans with motion blur between beats, the burned-in captions, the indigo
  rule that runs under them through the whole cut, and grain.
- `src/motion/` — the motion system. `Stage.tsx` (the stage, grain, camera
  push-ins and the helpers that frame a point or a box), `Device3D.tsx`
  (browser and phone frames that enter from depth and drift), `Type.tsx`
  (captions that land word by word with blur, the rule), `Fx.tsx` (the
  click ring).
- `src/scenes/` — the beats. `Type.tsx` the hook and end cards, `Build.tsx`
  the form and the site assembling, `Portal.tsx` the portal recordings
  (a change request, Host this version, one sentence), `Hosted.tsx`
  Allergy Rescue Kit, `Ads.tsx` the ads' own scenes, `Sites.tsx` the
  captured sites.
- `src/footage.tsx` — plays a recording and draws its cursor, click rings
  and trail from the recording's log.
- `capture.mjs` → `assets/footage/` — real screen recordings of the /demo
  portal, stepped one frame at a time so every run gives the same clip, and
  full-page captures of the three sites. What it changes during capture
  (photos, a domain, a hidden badge and prices) is listed at the top of the
  file and next to each site.
- `assets/photos/` — the Pexels photos that stand in for loremflickr during
  capture; sources and licence in `PHOTOS.md`.

## Honesty rules this follows

The site's (`CLAUDE.md`) and the brief's §0. In particular:

- Every claim in a caption is true of the shipped product. The portal
  footage is the /demo sandbox, which mirrors the real portal, labelled
  "Demo account".
- Cedar & Stone is a fictional business's concept site, built by hand, and
  its lower third in the build beat says "Cedar & Stone is a fictional
  example."
- Allergy Rescue Kit is a real client, shown with its owner's approval. It
  is hosted on Railway, not on our setup, so nothing in its beat says
  anything about hosting.
- Andy's Auto Shop is a demo business, labelled "Demo business", never
  called a client.
- No invented statistics, reviews or customer counts, no build-time claims,
  no third-party logos, no stock footage. The agency range on the receipt is
  the sourced `MARKET_RANGES` figure from `site.js`.
