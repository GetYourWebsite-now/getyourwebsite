# Photos in the footage

Two hand-built pages on this site load their photos from loremflickr, and are
captured for the video: `public/bakery.html`, the sample page `/demo`
previews (Rosa's Bakery, in the portal footage), and `public/landscaping.html`
(Cedar & Stone, the concept site in the film). loremflickr serves whatever
Flickr returns for a keyword, under licences that vary photo to photo — some
non-commercial — and a capture of it is not guaranteed to be repeatable. A
paid ad needs both: commercial use, and the same frame every render. So none
of those photos appear in the video: `capture.mjs` routes each loremflickr
request to one of the files below, during capture only. The site itself is
unchanged.

## Licence

All nine are from Pexels, under the Pexels License
(https://www.pexels.com/license/, checked October 13 and 17, 2026): free to
use, commercial use including ads and marketing campaigns, attribution not
required, editing allowed. Not allowed: selling unaltered copies,
redistributing on stock platforms, using them as a trademark, implying that a
person or brand in them endorses us, or showing an identifiable person in a
bad light.

Chosen so those last two cannot come up: no faces, no identifiable people, no
brands or logos in any of them.

## Rosa's Bakery — `public/bakery.html`

Downloaded 17 October 2026 from images.pexels.com at the width given.

| File | Replaces (lock id) | Pexels photo | Photographer |
| --- | --- | --- | --- |
| `hero-loaves.jpg` (w 1600) | hero, `bakery,bread?lock=11` | [Sourdough bread with burnt crust on table](https://www.pexels.com/photo/sourdough-bread-with-burnt-crust-on-table-6605201/) | [Geraud pfeiffer](https://www.pexels.com/@geraud-pfeiffer/) |
| `sourdough.jpg` (w 1200) | menu card, `sourdough,bread?lock=21` | [Freshly Baked Sourdough Bread on a Black Surface](https://www.pexels.com/photo/freshly-baked-sourdough-bread-on-a-black-surface-4881596/) | [Jytte Elfferich](https://www.pexels.com/@jytte-elfferich-3251368/) |
| `croissants.jpg` (w 1200) | menu card, `croissant?lock=22` | [Delicious baked croissants on trays](https://www.pexels.com/photo/delicious-baked-croissants-on-trays-6152263/) | [Meruyert Gonullu](https://www.pexels.com/@meruyert-gonullu/) |
| `cake.jpg` (w 1200) | menu card, `cake,bakery?lock=23` | [Close-up of a Layer Cake with Chocolate and Fruits](https://www.pexels.com/photo/close-up-of-a-layer-cake-with-chocolate-and-fruits-18732594/) | [Abdurrahim Israfilov](https://www.pexels.com/@abdurrahim-israfilov-537700999/) |
| `interior.jpg` (w 1400) | visit, `bakery,cafe,interior?lock=31` | [Artisan Bakery Interior with Freshly Baked Bread](https://www.pexels.com/photo/artisan-bakery-interior-with-freshly-baked-bread-29380155/) | [Valeria Boltneva](https://www.pexels.com/@valeriya/) |

Rejected: Pexels 10438814 (a bakery interior) shows a shop's brand name on
boxes and signs throughout.

## Cedar & Stone — `public/landscaping.html`

Downloaded 13 October 2026 from
`images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg` at 1800px wide (hero)
and 1400px (cards).

| File | Replaces (lock id) | Pexels photo | Photographer |
| --- | --- | --- | --- |
| `hero-garden-path.jpg` (w 1800) | hero, `garden,landscaping,path?lock=311` | [Lush garden pathway with colorful flowers in summer](https://www.pexels.com/photo/lush-garden-pathway-with-colorful-flowers-in-summer-37266505/) | Neville Hawkins |
| `design-formal-garden.jpg` (w 1400) | Design card, `garden,design,plan?lock=312` | [Rectangular water feature with lush greenery](https://www.pexels.com/photo/rectangular-water-feature-with-lush-greenery-38296762/) | Rahime Gül |
| `build-stone-patio.jpg` (w 1400) | Build card, `patio,stone,landscaping?lock=313` | [Residential house with a patio in the backyard](https://www.pexels.com/photo/residential-house-with-a-patio-in-the-backyard-17240696/) | hi room |
| `maintenance-hedge.jpg` (w 1400) | Maintenance card, `hedge,trimming,gardener?lock=314` | [Crop gardener with secateurs working on bush](https://www.pexels.com/photo/crop-gardener-with-secateurs-working-on-bush-5231138/) | Anna Shvets |
