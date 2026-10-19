# Launch video V2 — "Built while you work"

Written 2026-10-17 after Jack reviewed V1: "the first phone scene is horrid,
the rest feels like our actual website at our website's pace, and the ads
are just the main video cut up." He is right. V1 was eleven slides held for
twice their reading time, drawn in the site's own illustrations, with no
sound. V2 is a different kind of film: **real footage of the real product,
fast cuts, kinetic type, music and UI sound.** No illustrated UI anywhere.

Branch `ads/launch-video-v2` off `main`. Keep the Remotion project in
`tools/video/`; replace the scenes. Plan first, then wait for go. Where this
brief and `LAUNCH-VIDEO.md` disagree, this one wins.

## 0. Rules that replace V1's

- **Reading rule:** a caption stays ≥ 1.2× its reading time at 4 words/s,
  minimum 1.6s. Captions animate in word by word (each word ~60ms apart), so
  the eye is led through them. `script.ts` still refuses to render on a
  failure; the multiplier is 1.2, not 2.
- **Nothing is ever still.** No frame may be identical to the frame 15
  frames before it. Add that as a render gate: after the MP4 is written,
  sample frame differences with ffmpeg and fail if any 0.5s window has a
  mean absolute difference under a small threshold. Camera push-ins
  (1.00 → 1.06 over a shot) are the default way to satisfy it on a hold.
- **Cuts, not fades**, except the end card, which fades in over 300ms.
- **Honesty rules unchanged.** No invented stats, dates, reviews or
  customer counts. No timeline claims about how long a build takes. Fictional
  demo data is labelled once per video, small, lower-left: "Demo account".
  Prices, the discount and the seat count come from `src/data/site.js`.
- Text floors from V1 stay: smallest text ≥ 28px at 1080p, ≥ 34px on
  1080×1920. Real screen recordings are exempt but are framed so their own
  UI text is as large as the frame allows.
- Captions burned into **both** formats (social autoplay is muted); SRT
  alongside the 16:9 as well.
- No voiceover. Captions + music + SFX.

## 1. Footage to capture (Playwright, deterministic, before any scene work)

All captures go in `tools/video/assets/footage/` and are committed (they are
the film). Record at 2× device scale so they stay crisp when pushed in.

**A. The portal — from `/demo` on the built site.** `/demo` is the real
client portal running on sample data (Rosa's Bakery); it is what we ship.
Record with Playwright `recordVideo` at 1440×900, and **log every mouse
move/click with a timestamp to a JSON file** — Playwright does not render a
cursor, so Remotion draws one that follows the log. Flows, each its own
clip, each starting from a fresh load:
1. `portal-open.webm`: open the version list, click "Open" on a version,
   the preview fills.
2. `portal-request.webm`: click a headline in the preview, the request box
   appears, type "Make this warmer" at ~12 chars/s, send, the request shows
   as sent / in review. If the sandbox has an approve step, trigger it; if
   not, stop at "sent" and the caption carries "a person checks it".
3. `portal-switch.webm`: version tree; click a different version; the
   preview changes. If the sandbox swaps palettes between versions (the
   bakery / Christmas versions), capture both states.
4. `portal-photos.webm`: drag a photo from the library into a slot, save.
   (Only used if a scene needs it.)
If a flow does not exist in `/demo`, say so in the plan rather than faking
it; the monorepo client with `client/tools/browse.mjs` is the fallback.

**B. Andy's Auto — the real site.** Full-page screenshot of
https://andysauto.org at 1440 and at 390, plus a JSON of each top-level
section's bounding box, so the "assemble" scene can slide real sections in
one by one. **Check for the Halloween pumpkin strip**: if it is still on the
page, exclude that section from the assembly and say so. Also record a 6s
smooth scroll of the phone view (`andys-phone-scroll.webm`).

**C. Allergy Rescue Kit** — a 1440 screenshot of the home page, used once
in the "hosted" beat as the second real site. Hand-built, so it never
appears under a "built from your info" caption.

**D. The `/beta` form** — not recorded; drawn in Remotion from the real
markup/CSS so the typing can be controlled. It is the one drawn element,
and it is a form, not a product UI.

## 2. Sound

**Music.** You cannot judge music by ear, so do this: pick **three**
candidates from Pixabay Music (licence: free for commercial use, no
attribution) with these filters — no vocals, 100–125 BPM, tagged
minimal / electronic / indie / upbeat, **not** "corporate", not "cinematic",
30–60s or loopable, a clear downbeat for cuts. Save each with its licence
page URL and the licence text in `tools/video/assets/music/MUSIC.md`.
Render the hook+build (0–8s) three times, once per track, as
`out/music-A.mp4`, `music-B.mp4`, `music-C.mp4`. **Jack picks by ear**
before the full render. Cuts land on beats: compute the BPM from the file
and snap scene boundaries to the nearest beat.

**SFX** from Pixabay sound effects, same licence handling, in
`assets/sfx/`: a soft UI click, a keyboard tick (one per typed character,
pitch-varied ±5%), a short whoosh for the kinetic type, a "sent" pop.
Mix: music −14 LUFS integrated, ducked −6 dB under SFX hits; SFX peaks
−6 dBFS. Normalise the final mix to −14 LUFS, true peak −1 dBTP.

## 3. The film — 30.0s — `Launch16x9` 1920×1080 and `Launch9x16` 1080×1920

| Time | Beat | Screen | Caption |
|---|---|---|---|
| 0.0–2.6 | Hook | Black. Three lines punch in word by word, each replacing the last, white, 96px/120px. Music hits on "We do." | *You fix cars.* / *You don't build websites.* / *We do.* |
| 2.6–8.2 | Build | The drawn `/beta` form, centred, fills itself at typing speed with keyboard ticks: business name, trade, city. Send pops. Hard cut to a desktop frame: **Andy's Auto assembles** — header slides down, hero snaps in, then one real section every ~300ms, each with a whoosh, ending on the full site; slow push-in. Real URL in the frame's bar. | *Built from your business info. Not a template.* |
| 8.2–14.0 | Change | Cut to `portal-request.webm` in a desktop frame, push-in on the click. Drawn cursor follows the log. Typing ticks, "sent" pop. | *Click it. Say what to change.* then *A person checks it before it goes live.* |
| 14.0–19.0 | Switch | `portal-switch.webm`. On the click, split-screen: left the tree, right the preview changing. | *You pick which version is live. One button.* |
| 19.0–23.0 | Hosted | Andy's Auto phone scroll in a phone frame, URL bar visible; at 21.0 a second phone slides in beside it with Allergy Rescue Kit. | *Hosted, kept current, on your domain. One plan.* |
| 23.0–30.0 | Offer | Kinetic type on `--bg-alt`: *Startup from {betaPrice}* lands big; *Beta: 30% off for the first 30 businesses* under it; the mark draws in (indigo); CTA button `getyourwebsite.now/beta`. Music resolves. Hold ≥ 3s. | (the type is the caption) |

9:16 is **re-framed, not cropped**: the device frames fill the width, the
caption sits in the upper safe band, the end card stacks. Top 220px and
bottom 320px stay clear of text.

## 4. The ads — three separate ideas, 1080×1920

**`Ad_Receipt` — 10s.** A thermal receipt prints line by line with a
printer tick: *AGENCY WEBSITE* / *$1,000–$10,000* / *Weeks of calls* /
*Your evenings*. Rip (SFX). A second receipt prints: *GETYOURWEBSITE* /
*from {betaPrice}* / *Built from your info* / *A person checks every
change*. End card 3s. The agency range is the sourced one in `site.js`;
nothing else on the receipt is a number.

**`Ad_AllWeNeed` — 10s.** A plain card types itself: the kind of facts a
business already has — name, phone, hours, three services, "4.8 ★ (demo)".
Caption: *This is all we need.* Cut: Andy's Auto assembles (same component
as the film, faster, 200ms per section). Caption: *We build the rest.* End
card 3s. True of the product: the generator reads the business's listing
and reviews.

**`Ad_OneSentence` — 8s.** Only the portal request box, large. Cursor types
*"Say we're open Sundays now"*, sends (pop). **Cut** — a visible time jump,
not a morph — to the live preview with the header changed and a small
status chip *Approved · reviewed by a person*. Caption: *Say it. We change
it. A person checks it.* End card 2.5s. If `/demo` cannot show a changed
header, build the "after" as a second real capture with the sandbox's own
quick-edit flow; never a drawn page.

## 5. Build notes

- Recordings go in through `<OffthreadVideo>`; trim and speed-ramp in
  Remotion, not in ffmpeg, so timings live in `script.ts`.
- The cursor is a 28px drawn arrow (white with 1px dark edge) driven by the
  capture log; add a 120ms scale pulse on clicks.
- Device frames: thin, dark, no bezels, no notch art. Real URL text in the
  bar, monospace.
- Kinetic type: Inter 700, tracking −0.02em, words fly in from 8px below with
  a 220ms ease-out, 60ms apart.
- Contact sheets as before, one frame per beat, for review before the MP4s.
- Gates: reading rule (1.2×), text floors, **no-still-frame check**,
  loudness (−14 LUFS ±1), file size < 25 MB, `yuv420p` limited range.
- Output names: `Launch16x9.mp4` + `.srt`, `Launch9x16.mp4`, `Ad_Receipt.mp4`,
  `Ad_AllWeNeed.mp4`, `Ad_OneSentence.mp4`.

## 6. Order of work

1. Capture all footage (§1). Show me a contact sheet of the captures.
2. Music candidates (§2). Render `music-A/B/C.mp4`. **Stop; Jack picks.**
3. Build the film; contact sheet; **stop for review.**
4. Build the three ads; contact sheet; **stop for review.**
5. Render everything, run gates, commit "Launch video V2: real footage,
   kinetic type, sound", stop. Jack merges.

## Don't

- No drawn product UI. No stock footage, no AI people, no logos of other
  companies.
- Don't reuse `MergeDiagram`, `ClickToChange`, `VersionTree`,
  `DomainConnect` or the V1 phone. Delete them from `tools/video/src/drawings/`
  in the first commit so nothing falls back to them.
- Don't type a price anywhere. Don't claim how long a build takes.
- Don't push, merge or deploy.

---

# V2.1 — motion pass (2026-10-17, after Jack reviewed the first V2 cut)

Jack's verdict on the first cut: right structure, right footage, **no umph —
"it's just typing."** The reference is the startup launch film: Linear,
Raycast, Vercel, Arc. What those have and we don't: a dark stage, UI floating
in 3D space with parallax, a camera that dives into details, text that blurs
in and snaps into place, light moving across surfaces, spring physics on
everything. This pass adds that. Footage, copy, captions and the beat order
stay as reviewed. **Sound is removed entirely for now** — no music, no SFX;
the loudness gate is dropped. Keep the 120-BPM grid for cut timing anyway so
the rhythm survives.

## 1. The stage

- **Dark throughout.** Background `#0a0a0c` (the site's `--footer`), never
  pure black, never white. The end card is dark too: white type, indigo
  button, the mark in indigo.
- One **indigo light** (`#2f3dd6` radial, ~40% of the frame, 18% opacity,
  blurred) that drifts slowly and moves *with* the camera at 0.4× — it is
  the far layer of the parallax.
- Grain over everything at 6%, animated (new noise seed every frame) so
  nothing is ever still even on a hold.
- A hairline **indigo rule** (2px) that lives at the bottom of the caption
  and whips to the new caption's width on every cut — the one element that
  persists across the whole film and ties the cuts together.

## 2. Devices in 3D

- Every browser/phone frame sits in `perspective: 1400px`. It **enters**
  from depth: `translateZ(-700px) rotateY(14deg)` with 60% opacity and 10px
  blur → `translateZ(0) rotateY(0)` sharp, on a Remotion `spring`
  (`damping: 16, stiffness: 120, mass: 0.9`) — a little overshoot, not a
  linear slide.
- While on screen, each device **drifts**: rotateY ±2.5°, rotateX ±1.5°, on
  a slow sine tied to the frame, plus the camera push-in. The light edge on
  the frame moves with the tilt: a 1px white-20% top edge and a soft
  specular highlight that slides across the glass as it rotates (a white
  linear mask that moves with rotateY).
- Shadow: a large soft one (`0 60px 120px rgba(0,0,0,.55)`) so the device
  reads as lifted off the stage.
- Frames are dark glass (`#141418` chrome, URL text in the mono font, real
  URL), no notch art.

## 3. Camera

- Default is never static: push-in 1.00 → 1.06 on every hold.
- **Dive zooms** on the detail that matters, with spring easing: 1.0 → 1.8×
  into the request box as "Make this warmer" types; into the Live pill as it
  moves; into the "Sent ✓" button; into the first assembling section. Pull
  back on a spring before the cut.
- **Whip pans** between beats where the subject changes: 10 frames,
  horizontal translate of the whole stage plus a 3-copy offset stack at
  35/25/15% opacity for motion blur. The caption rule whips with it.
- One **match cut**: the end card's mark grows out of the Live pill's indigo.

## 4. Type

- Captions and hook: Inter 700, `letter-spacing: -0.03em`. Each word enters
  with **blur 14px → 0, translateY 18px → 0, opacity 0 → 1, letter-spacing
  from -0.01em to -0.03em** (it tightens as it lands), 70ms apart, spring.
- One word per caption is **indigo**: "business", "template", "change",
  "live", "domain", "$560". Pick the noun that carries the beat.
- Captions sit low-left on the dark stage in 16:9, upper safe band in 9:16;
  the 2px indigo rule under them is the persistent element from §1.
- Hook cards: 110px (16:9) / 128px (9:16), centred, same blur-in; the
  previous card exits with blur + scale 1.04 as the next enters, overlapping
  6 frames, so it reads as one continuous thought.

## 5. The build beat, specifically

- Form: 2.0s total as already specified. The form itself is a dark-glass
  card on the stage, 3D like the devices. Typing has no sound; the caret
  blinks at 530ms.
- "Sent ✓": the button's indigo **flashes to white for 2 frames** and a ring
  (1px indigo) expands from it and fades — the only "effect" on the form.
- Time jump: hard cut to the empty dark browser frame entering from depth
  (§2), 0.3s.
- **Assembly from depth, not from the side:** each Cedar section starts at
  `translateZ(-900px)`, 30% opacity, 12px blur, slightly rotated (±3°), and
  springs into place with overshoot, 90ms apart, while the camera pushes
  down the page. The last section landing triggers a single light sweep
  across the whole frame (the specular from §2, fast).

## 6. Portal beats

- Change: dive zoom into the real request box (1.8×) as the text types;
  cursor has a 6-frame trail and a click ripple (ring, 160ms). On send, the
  panel's status line pops (scale 0.9 → 1 spring) and the camera pulls back.
- Person: the status chip flipping to approved gets the ring pulse; nothing
  else — this beat is short.
- Switch: split screen; the Live pill **moves** between nodes along the
  connector (not teleports) with the ring pulse on arrival, and the preview
  does its 1.04× push as the palette changes. Connector lines draw in.

## 7. Hosted and end

- ARK phone enters from depth; the desktop frame enters 300ms later from the
  opposite rotation so they settle facing each other slightly, like two
  panels on a stage. Slow counter-drift between them (parallax).
- End card: dark. The mark grows from the Live pill (match cut), "Startup
  from $560" blur-snaps in with "$560" indigo, the beta line under it, the
  button last with the ring pulse. Hold 4.0s with the light drifting; the
  indigo rule settles to the button's width.

## 8. Gates (updated)

- Drop: loudness, music/SFX presence.
- Keep: reading rule 1.2×/1.2s-min, text floors, no-still-frame (now
  trivially met by grain + drift — keep it anyway), size < 25 MB, yuv420p
  limited range, 9:16 safe zones.
- Add: **no pure black (#000) or pure white (#fff) frame anywhere** — the
  stage is #0a0a0c and type is #f6f7f9.

## 9. Order

1. Build §1–4 as reusable pieces (Stage, Device3D, Camera, Type) and show a
   10-second **motion test** on the hook + build beat only. Stop.
2. On OK, apply to the whole film. Contact sheet + MP4. Stop.
3. Ads get the same system. Contact sheet. Stop.
4. Render, gates, commit "Launch video V2.1: motion pass, silent", stop.

## Don't

- No gradients on text, no glow on text, no lens flares, no particles, no
  3D models, no stock anything. The 3D is perspective on flat real footage,
  nothing more.
- No sound of any kind in this pass.
- Don't change copy, captions, footage or beat order from the reviewed cut.
