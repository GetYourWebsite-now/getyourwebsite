# GetYourWebsite

The marketing site for GetYourWebsite — websites for local businesses, built by
high school students.

Eight pages (Home, Our Work, Demo, Pricing, How it works, Benefits, Why Us,
Contact) plus a 404, a scroll-driven hero where a website assembles itself and launches, six
live mock client sites, and an interactive demo of our real client portal.

---

## Running it locally

You need [Node.js](https://nodejs.org) 20 or newer. Then:

```bash
npm install
```

```bash
npm run dev
```

That starts a dev server at <http://localhost:4321> and reloads when you save.

Two other commands:

```bash
npm run build
```

Builds the finished site into `dist/`. This is what gets deployed.

```bash
npm run preview
```

Serves `dist/` so you can check the built site before you push.

---

## How the project is laid out

```
src/
  pages/           one file per URL — index.astro is "/", work.astro is "/work"
  layouts/
    BaseLayout.astro   the <head>, nav and footer every page shares
  components/      reusable pieces (Nav, Footer, ProjectCard, TierCard, Hero…)
  data/
    site.js        ← almost everything you'll want to change lives here
    url.js         link helper (see "Deploying" below)
    portal-sync.json   the client/ commit the demo sandbox was built against
  styles/
    global.css     the whole design system: colours, type, spacing, components
  scripts/
    buttons.js     the button press interaction
    reveal.js      the scroll-reveal animation
    demo.js        the demo sandbox

tools/             checks and screenshot harnesses — see "Verifying changes"

public/            copied to the site as-is, no build step
  bakery.html      the six mock client sites
  dental.html
  gym.html
  auto.html
  landscaping.html
  restaurant.html
  shots/           screenshots used on the Our Work cards
  og.png           the social sharing card
  favicon.svg
```

`.claude/` and `PROMPT.md` are tooling and the original brief. They stay in the
repo and are never copied into the built site.

### The things you'll actually edit

**`src/data/site.js`** holds the contact email, the form key, the nav links, the
Our Work grid and the pricing tiers. Changing a price there updates both the
pricing page and the home page teaser.

**Adding a seventh mock site** (a tech store, say) is three steps:

1. Put the HTML at `public/techstore.html`.
2. Save a screenshot to `public/shots/techstore.webp`.
3. Add one object to the `PROJECTS` array in `src/data/site.js`, with
   `kind: 'concept'`.

The grid picks it up automatically.

---

## Design system

Everything visual is a token in `:root` at the top of `src/styles/global.css`.
Change a token, not a page.

**Surfaces.** Two light ones that alternate down a page (`--bg` white,
`--bg-alt` grey) and one dark one (`--footer`), used by the footer and by
the single dark band on the home page (`.section--dark`, the platform
section). `npm run verify` fails on a third dark surface, a dark band off
the home page, or two adjacent sections with the same surface.

**Ink.** `--ink` headings, `--ink-soft` body, `--ink-muted` captions and
case-study sector labels. The margins are thin on purpose — `--ink-muted` on `--bg-alt` is
4.64:1 against a 4.5 requirement — so `npm run verify:contrast` is
load-bearing, not a formality.

**One accent.** `--accent` (indigo) carries links, primary buttons, focus
rings, the highlighted pricing tier and the live badge. If something needs
to stand out and it is none of those, the answer is weight or whitespace.

**Gold is not an accent.** `--gold` is the brand mark and the free-mock
badge. Nothing else, and never as text: it measures 1.65:1 on white.

**Lines.** `--line` is decorative and allowed to be faint. `--line-input` is
the edge of an interactive control, and has to clear 3:1 on *both* light
surfaces — WCAG 1.4.11. Using `--line` on an input is a real bug; the old
site had exactly that at 1.4:1.

**Depth, in listed places only.** Grain (`--grain`, a data-URI noise at 4%)
and one radial light per section, on the home page's hero, merge stage,
dark band and closing CTA band — `.depth` — and nowhere else. `--lift` on
tier cards, case-study frames, drawing wells and the hero browser frame,
rising 2px on hover. A light edge on primary buttons, on hover only.
`--shadow-shot` for product screenshots. No gradient on text, no glow, no
glass, no bento, no colour that is not a token. `npm run verify` holds the
list; `verify:contrast` measures text on a depth section against the
darkest pixel the grain and light can put under it.

**Radii.** 8px cards, 6px buttons and inputs. Nothing larger.

### Type

Inter and JetBrains Mono, both self-hosted in `public/fonts/`. There is no
Google Fonts request on this site.

Inter carries the `wght` and `opsz` axes in one file, so
`font-optical-sizing: auto` gives display headlines and text-cut body copy
from one 73KB download — which is why there is no separate display face.
Never set `font-variation-settings` for `opsz`; it overrides that.

Mono is only for the browser-frame URL, step numbers and code-like strings.
Eyebrows are rare and set in Inter (see `.eyebrow` in `global.css` and the
rule in CLAUDE.md). **Not** for prices: they are Inter with
`font-variant-numeric: tabular-nums`, because mono figures read as a
terminal readout rather than a number someone is being asked to pay.

Note the Fontsource subset does not carry Inter's `cv*`/`ss*` tables, so
character variants are no-ops and are deliberately not declared. `tnum`
does work — and puts the hyphen and `. , :` on a figure-width slot too, so
it is declared on price figures only, never on `body`. On `body` it spaced
every hyphenated word on the site ("one - time", "51 - state").

`HEADING_FONT` in `src/data/site.js` can point headings at Cabinet Grotesk
or Sora for comparison. **Run `npm run verify:wraps` after
any change** — swapping the face changes the width of every heading on the
site, which is a question about forty headings rather than the one you
looked at.

### Components

| Class | Use |
| --- | --- |
| `.btn .btn--primary` | the thing we want clicked; one per screen |
| `.btn .btn--secondary` | the alternative next to it |
| `.link-arrow` | tertiary — a text link with an arrow |
| `.card` | a bordered box; no shadow, no hover lift |
| `.lift` | a card that lifts: border, `--lift`, 2px rise on hover |
| `.shot` | a product screenshot, with `--shadow-shot` |
| `.depth` | grain and radial light — the four home sections only |

Sizes are `.btn--sm`, nothing (medium), `.btn--lg`. Hover is a colour change,
plus a 1px light edge on primary buttons, inside the button's box — the old
system had a ring, a sweep and a press ripple, and all three read as a
template. `verify` allows that one layer and no other.

Shared components worth knowing: `CaseStudy.astro` (full, `compact` and
`thumb` variants, one set of facts), `WebsiteCompare.astro` (used by the
home page and `/why-us`), `VersionTree.astro` (geometry lives in
`src/data/version-tree.js` so the social card cannot drift from it),
`TierCard`, `CarePlan`, `ComparisonTable`, `Faq`.

## Analytics

Off by default. Set `GOATCOUNTER_ID` in `src/data/site.js` to your GoatCounter
site code and the tag appears; leave it empty and no script is emitted at all,
which is why an unset placeholder costs nothing.

GoatCounter rather than Plausible or Google Analytics: no cookies, so no consent
banner, nothing personal stored, and roughly 3KB. The tag is `defer`red, so it
can't block a paint or add to Total Blocking Time.

---

## Where it's deployed

The site is live at **<https://getyourwebsite.now>**, served by the Railway
service with Cloudflare in front of it. The old `*.up.railway.app` URL no longer
resolves — don't send anyone to it.

`SITE_URL` in `astro.config.mjs` still defaults to the GitHub Pages address,
which is only used for `sitemap.xml`, `robots.txt` and canonical tags. Set it to
`https://getyourwebsite.now` in the deploy environment.

---

## Deploying

The site is static, so all three free hosts work. Two environment variables
control the build:

- **`SITE_URL`** — the public address. Used for `sitemap.xml`, `robots.txt` and
  the social card. Change this when you buy a domain.
- **`BASE_PATH`** — the sub-folder the site is served from. Defaults to `/`.

### GitHub Pages (already set up)

`.github/workflows/deploy.yml` builds and publishes on every push to `main`.

**One-time setup:** go to **Settings → Pages → Build and deployment** and set
**Source** to **GitHub Actions**. That's the only click.

The site then lives at <https://jackw21886-svg.github.io/getyourwebsite/>.

Because Pages serves project sites from a sub-folder, the workflow sets
`BASE_PATH=/getyourwebsite`. That's also why internal links are written as
`url('/pricing')` rather than `"/pricing"` — the helper in `src/data/url.js`
adds the prefix. **If you add a link, wrap it in `url()`** or it will 404 on
Pages.

### Netlify

Connect the repo at [app.netlify.com](https://app.netlify.com). `netlify.toml`
already has the build command and publish directory. Update `SITE_URL` in that
file to your Netlify address.

### Vercel

Import the repo at [vercel.com](https://vercel.com). `vercel.json` handles the
rest. Set `SITE_URL` in the project's environment variables.

### When you buy a domain

1. Change `SITE_URL` to the new domain (in the workflow, or in
   `netlify.toml` / Vercel's settings).
2. Set `BASE_PATH` to `/` — on Pages that means deleting the `BASE_PATH` line
   from the workflow.
3. On Pages, add the domain under **Settings → Pages → Custom domain**.

---

## The contact form

The form on `/contact` posts to [Web3Forms](https://web3forms.com), which is
free and needs no server.

**To switch it on:** get an access key (paste your email at web3forms.com, they
send you one), then put it in `WEB3FORMS_KEY` in `src/data/site.js`.

Until you do, the page shows a visible warning to you and the form fails with a
clear message pointing visitors at the email address instead — nothing
disappears silently.

The form has a honeypot field for spam, validates in the browser, and works
without JavaScript (Web3Forms just shows its own thank-you page instead of the
inline one).

---

## Verifying changes

Before pushing anything significant:

```bash
npm run build
```

Then check the pages at three widths — 360px, 768px and 1280px — and click
through the nav, the Our Work cards and the demo sandbox.

### The automated checks

Most of what has broken on this site broke invisibly, so it is a test rather
than something to remember. Each needs `npm run dev` in another terminal.

```bash
npm run verify           # links resolve · the demo sandbox flow end to end ·
                         # reduced motion · the contact form · the button
                         # system · surfaces and depth · the portal captures ·
                         # then the word budget (verify:words)
npm run verify:words     # visible words in <main> per page, against a budget:
                         # home 570, how-it-works 550, why-us 600
npm run verify:contrast  # every text node on every page against the surface
                         # it is actually painted on (worst pixel on a depth
                         # section), plus button and form-control edges
                         # (WCAG 1.4.3 and 1.4.11)
npm run verify:wraps     # how every heading wraps at 1440 and 390
npm run verify:voids     # scroll-reveal never leaves a fast scroller a blank
                         # screen
npm run verify:portal    # fails if /demo has fallen behind the real portal
npm run verify:beta      # builds with beta on and off; fails if the switch
                         # misses a CTA, leaves "free mock" readable, or
                         # changes anything that isn't a declared switch point
```

What each one has actually caught, so you know what you lose by skipping it:
`verify` found a second dark surface and two adjacent same-surface sections;
`verify:contrast` found the merge headers at 4.14:1 on the grain, an indigo
button at 2.60:1 on the footer, a form
border at 2.89:1, and our own sandbox chrome rendering near-white on light
grey; `verify:wraps` found a headline breaking to three lines with the
middle one orphaned.

Regenerating things:

```bash
npm run shots:portal     # the client-portal screenshots on the home page.
                         # Needs the portal running — see the header of
                         # tools/portal-shots.mjs
npm run shots:clients    # the ARK, Andy's Auto and ChemEd screenshots, from the
                         # live sites (pass a slug, e.g. andysauto, for one)
npm run shots:og         # public/og.png, the social card, plus favicon.svg
                         # and apple-touch-icon.png — all from
                         # public/brand/mark.svg
npm run record           # .shots/phase7/home.webm: 6s of the home page
                         # scrolling, for judging the animations
node tools/shots.mjs .shots "home=/" "work=/work"   # ad-hoc page captures
node tools/font-compare.mjs                          # heading faces side by side
```

### And by hand

Turn on "Reduce motion" in **System Settings → Accessibility → Display** and
reload the home page: the hero's version tree should be fully drawn and
completely still, with the Live badge on Online orders. The four drawings
in src/components/anim/ should each show their finished picture, still. `npm run verify`
checks that nothing is animating; it cannot check that what is left looks
deliberate.

Check the pricing comparison table at 390px by eye. It swaps to a stacked
list there, and it must never scroll sideways.

One thing to know before you trust a screenshot: a large WebP can report
`complete` with a real `naturalWidth` and still not be rasterised when the
capture happens, so it shoots as an empty box that looks exactly like a
broken path. `tools/shots.mjs` awaits `img.decode()` first. Do the same in
anything you write.

## Notes and known limitations

- **The mock sites use placeholder photos** from `loremflickr.com`, which serves
  a random image per keyword. They occasionally return something odd. When you
  have real client photos, host them in `public/` and swap the `src` attributes.
- **The demo sandbox has a Fullscreen control.** The portal is a dense app and a
  page section doesn't do it justice. It uses the Fullscreen API, with a
  fixed-overlay fallback for iOS Safari on iPhone, which allows element
  fullscreen only for `<video>`. Both paths are covered by `npm run verify`.
- **The demo sandbox mirrors our client app** (`GetYourWebsiteAdmin`,
  `development` branch, the **`client/`** workspace — not `frontend/`, which is
  the staff admin app). After changing the sandbox, run `npm run shots:portal`:
  the home page shows pictures of the real portal, and they are not generated
  by the build, so they can silently go stale — they did exactly that when the
  portal moved from mint to gold. `npm run verify` checks the accent hue of
  `public/shots/portal-my-website.webp` and fails if it is from the old design.
  If that app's screens change, update
  `src/components/DemoSandbox.astro` and `src/scripts/demo.js` to match — the
  whole value of that page is that it's honest.
- **There is no approve button in the demo** because there isn't one in the real
  client portal. Approval happens on our side and versions only appear once
  they're approved. `/demo` says so explicitly.
- **Anyone with reduced motion turned on** gets a still version of the same
  idea: the headline, both CTAs and a CSS drawing of the assembled site, all
  in flow so nothing overlaps. It's in the markup already, so it also covers
  no-JS and any browser without canvas.
