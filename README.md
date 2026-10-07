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
3. Add one object to the `PROJECTS` array in `src/data/site.js`.

The grid picks it up automatically.

---

## Design system

> **Partly stale — rewritten in the redesign's final pass.** The palette is
> now light-first with a single indigo accent and the type is Inter and
> JetBrains Mono; the sections describing the old dark-section atmosphere and
> the scroll hero have been removed, but the colour and type notes below
> still describe the old design. `src/styles/global.css` is the accurate
> source until they are rewritten.

Four colours and nothing else — white, black, silver and gold. They're defined
at the top of `src/styles/global.css` along with a couple of derived colours
that exist purely for contrast:

| Token | Use |
| --- | --- |
| `--white` `--black` | backgrounds and text |
| `--silver` `--silver-light` | secondary text and borders on dark |
| `--gold` | the accent — CTAs and highlights only, kept rare on purpose |
| `--ink-soft` | muted text on white (silver fails contrast there) |
| `--gold-deep` | gold that's legible on white |

Every pairing meets WCAG AA. **Never put plain `--gold` text on white** — use
`--gold-deep`.

Type is Clash Display for headings, Work Sans for body and JetBrains Mono for
labels and figures. The heading face is self-hosted from `public/fonts/`; the
other two come from Google Fonts.

`HEADING_FONT` in `src/data/site.js` is the switch — `clash`, `cabinet`, `sora`
or `outfit`. BaseLayout preloads the right file and points `--font-display` at
it. Each face can also carry its own `track`, which overrides `--h-track`: a
wider face has to be set tighter to hold the same line counts, and that belongs
to the face rather than to the layout.

Two tokens travel with the face: `--h-track` and `--h-word`. They are a pair
and have to be tuned together — opening the word gaps widens every line, so the
letters have to go tighter to pay for it. Clash Display runs at -0.055em with
0.08em of word spacing.

**If you change the heading font, run `npm run verify:wraps`.** Swapping the
face changes the width of every heading on the site, so "does it still look
right" is a question about forty headings, not the one you happened to look at.
It counts the line boxes for each and flags orphans — a line much shorter than
the rest, anywhere in the heading — at desktop and mobile. Clash Display needed
four adjustments to match Outfit's line counts, all recorded in the CSS next to
the values: `--h-track` to -0.055em, `--t-h3` down from 1.6rem, the final CTA
heading down from 3.4rem, and `--t-display`'s mobile end down so "Websites that
are" stops breaking across two lines and orphaning "are".

Sections alternate: `.section` for white and `.section--alt` for the grey
surface. The footer is the only dark surface on the site, and `npm run verify`
fails if a second one appears.

### Buttons

There is one button system, defined once in `global.css`. Use it — don't style
a button inline, or the site drifts.

| Class | Use |
| --- | --- |
| `.btn .btn--gold` | primary. One per screen; it's the thing we want clicked. |
| `.btn .btn--ghost` | secondary, on a dark background |
| `.btn .btn--outline` | secondary, on a light background |
| `.link-arrow` | tertiary — a text link with a gold arrow |

Sizes are `.btn--sm`, nothing (medium), and `.btn--lg`.

The hover and press effects are space-themed: a dark "event horizon" ring
tightens inward on hover, a lensing sweep crosses the secondary buttons, and
pressing collapses a ring inward instead of the usual outward ripple. All of it
is decoration — `src/scripts/buttons.js` never touches the click, and none of
it runs under reduced motion, where the colour and focus changes carry the
feedback on their own.

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

Most of the things that have broken on this site broke invisibly, so they're
tests now rather than things to remember. They live in `tools/` and each one
needs `npm run dev` running in another terminal.

```bash
npm run verify           # links, the demo flow, hero copy clearance, reduced
                         # motion, the contact form, buttons, light surfaces
npm run verify:contrast  # every text node on every page against the surface it
                         # is actually painted on, plus button and form-control
                         # edges against theirs (WCAG 1.4.3 and 1.4.11)
npm run verify:wraps     # how every heading wraps at desktop and mobile
npm run verify:voids     # scroll-reveal never leaves a fast scroller a blank screen
npm run verify:portal    # fails if the /demo sandbox has fallen behind the real portal
npm run shots:portal     # regenerate the home page's client-portal screenshots
npm run shots:teaser     # regenerate the /demo teaser image from the sandbox
```

One note while the redesign is in flight: the sections of this README
describing the old dark-section atmosphere, the four-colour palette and the
scroll hero are stale, and are rewritten in the final pass. The hero,
`tools/pacing.mjs`, `tools/ambient-shots.mjs`, `src/scripts/hero.js` and
`src/scripts/ambient.js` are already gone.

`npm run shots:portal` needs the client portal running locally — see the
header of `tools/portal-shots.mjs`. It screenshots the real portal with seeded
Rosa's Bakery data and no backend, so the pictures on the home page are of the
product rather than of a mock-up of it.

`tools/shots.mjs` is a general screenshot harness if you want to eyeball
something: `node tools/shots.mjs .shots "pricing=/pricing" "hero70=/@0.7"`, where
`@0.7` scrubs the hero to 70% of its scroll.

One thing to know before you trust a screenshot: a large WebP can report
`complete` with a real `naturalWidth` and still not be rasterised when a
capture happens, so it shoots as an empty box that looks exactly like a broken
image path. `tools/shots.mjs` awaits `img.decode()` on everything first. If you
write your own capture, do the same.

### And by hand

Turn on "Reduce motion" in **System Settings → Accessibility → Display** and
reload the home page: the version tree in the hero should be fully drawn and
completely still, with the Live badge on Online orders. `npm run verify`
checks that nothing is animating, but not that what's left looks deliberate.

Lighthouse: run it against `npm run preview`, not the dev server. Expect 100 on
accessibility, best practices and SEO, and 0ms Total Blocking Time, everywhere.
Performance is 100 on most pages but bounces between about 95 and 100 on `/demo`
and `/benefits` depending on which image wins the Largest Contentful Paint race —
that's measurement noise, so don't chase a three-point drop on one run.

---

## `[EDIT]` placeholders — the list of things left for you

Search the project for `[EDIT]` to find them all. In priority order:

| # | What | Where |
| --- | --- | --- |
| 1 | **Your email address** — the form destination and the footer address | `CONTACT_EMAIL` in `src/data/site.js` |
| 2 | **Web3Forms access key** — until this is set the contact form cannot send | `WEB3FORMS_KEY` in `src/data/site.js` |
| 3 | **Final tier prices** — currently $150 / $350 / $600+ | `TIERS` in `src/data/site.js` |
| 4 | **Social links** — add them or leave the array empty to hide the row | `SOCIALS` in `src/data/site.js` |
| 5 | **Your names, school and town** | `src/pages/why-us.astro`, in the `.story__names` block |
| 6 | **Team photo** — drop it at `public/team.webp`, then swap the placeholder for an `<img>` | `src/pages/why-us.astro` and `src/pages/index.astro` |
| 7 | **A real statistic with a source**, if you want one on Benefits | `src/pages/benefits.astro`, the `.stat-slot` block |
| 8 | **Custom domain** when you buy one | see "Deploying" above |
| 9 | **GoatCounter site code**, if you want visitor stats | `GOATCOUNTER_ID` in `src/data/site.js` |
| 10 | **Portal URL** — turns the "Sign in" link on. Left empty because `portal.getyourwebsite.now` answered HTTP 522 on every attempt | `PORTAL_URL` in `src/data/site.js` |
| 11 | **Maintenance plan price**, quoted in the hosting/domain FAQ | `src/pages/pricing.astro` |

---

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
  the staff admin app). After changing the sandbox, run `npm run shots:teaser`:
  the home page shows a picture of it (`public/shots/demo.webp`) and that
  picture is not generated by the build, so it can silently go stale — it did
  exactly that when the portal moved from mint to gold. `npm run verify`
  checks the asset's accent hue and fails if it's from the old design.
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
