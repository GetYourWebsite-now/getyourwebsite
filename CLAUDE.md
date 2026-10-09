# GetYourWebsite — notes for whoever (or whatever) works on this next

This is the **marketing site**. It is not the product.

## The product lives in another repo

**`github.com/GetYourWebsite-now/GetYourWebsiteAdmin`** — the GetYourWebsite-now
org, often written "GYWN". Private, so an unauthenticated GitHub API call to it
returns 404 rather than a permission error; use `git`, which has credentials.

Read it before changing anything that describes what the product does:

| Where | What it is |
| --- | --- |
| branch `development` | the live branch. `production` is far behind — do not read it |
| **`client/`** | **the client portal.** This is what /demo mirrors |
| `frontend/` | the *staff admin* app — leads, calls, users. Not the portal |
| `backend/` | the API, hosting, registrar and asset plumbing |
| `cloudflare/` | the worker that serves client sites |

**`client/`, not `frontend/`.** This has been got backwards before, because the
portal used to be the neglected one. It isn't any more.

The portal's own tokens mirror this site's — same four colours, same fonts — so
the demo sandbox reuses our palette under the portal's class names rather than
quarantining a foreign theme.

## Three rules that keep the site honest

**1. Every capability claim must be true of the shipped product today.** Check
it in `client/` first. If a capability has a condition on it — a custom domain
needs the Care plan, only approved versions can be hosted — the condition
belongs on the page. A capability with its limits stated reads as more credible
than one without, and this site's whole argument is credibility.

No superlatives we cannot prove, no invented statistics, no third-party logos
implying endorsement. Cloudflare is described as a network we host on, quoting
only their published figures, with a link so a visitor can check.

Two live consequences of this rule, both the result of actually checking:
Allergy Rescue Kit is hosted on **Railway**, not on our Cloudflare setup, so its
case study says nothing about hosting; and the ChemEd map's visible figures are
seeded sample data, so its screenshot is captioned saying so.

**2. The /demo sandbox must match the real portal.** It has drifted three times.
`src/data/portal-sync.json` records the `client/` commit it was built against,
and `npm run verify:portal` fails with a list of what has changed since. When
you rebuild the sandbox, update that file **in the same commit**, and re-run
`npm run shots:portal` — the home page shows pictures of the portal that also go
stale.

The sandbox is: no backend, no auth, no network, seeded with the fake Rosa's
Bakery client, and nothing copied from env files or real client data. Whatever
is not real about it goes in the "What's different from the real thing" list on
/demo — re-derive that list whenever the sandbox changes.

**3. The design is light, flat and one accent.** The specifics:

- Sections alternate `--bg` and `--bg-alt`. **The footer is the only dark
  surface on the site.** `npm run verify` fails on a second one.
- **No gradients, glow, glass, bento or textures.** Borders and whitespace do
  the separating. One shadow, `--shadow-shot`, for product screenshots only.
- **`--gold` is the brand mark and the free-mock badge. Nothing else, and never
  as text** — it is 1.65:1 on white. `--accent` does all the work.
- **Prices live only in `src/data/site.js`.** `grep -rn '\$[0-9]' src
  --include=*.astro` must return nothing — including in comments, which has
  caught it twice.
- **One reply-time promise, one phrasing:** "We reply within one business day."
  No build-time estimates anywhere; the only data point we have is ARK at 24
  rounds and it supports nothing.
- Mono is for eyebrows, step numbers, the MOST POPULAR flag and the
  browser-frame URL. Prices are Inter with `tabular-nums`.
- **`/privacy` and `/terms` are not edited for voice.** They are published legal
  text; they still say "mockup" and that is fine. `DemoSandbox.astro` keeps it
  too, because it mirrors the portal's own label.

## Three traps this codebase has already sprung

Each of these cost a debugging session. They look like bugs in your code.

**Astro's dev server serves stale CSS after a file is `cp`'d in.** A page can
render with only the first rule of its `<style>` block applied, which looks
exactly like a CSS parse error. Touch the file or restart `npm run dev` before
screenshotting anything.

**`Astro.url.searchParams` is empty on a static build.** Pages are rendered once
at build time, so a `?sent=1` branch compiles, deploys and silently serves the
same HTML to everyone. `Astro.url.pathname` *is* available, because each page
renders separately. The free-mock thank-you is a separate page for this reason.

**A newline between two sibling elements is a text node.** `</a>\n<a>` renders a
space, so a comma separator comes out as " , " and an underline runs under the
gap. Put them on one line — but note a JSX comment inside a `.map()` return
position is a second expression and will not compile, and `<script />`
self-closing with `set:html` will not either.

## Before pushing

```bash
npm run verify && npm run verify:contrast && npm run verify:wraps \
  && npm run verify:voids && npm run verify:portal
```

The README explains what each one measures. `verify:contrast` is the one to
respect: the light palette has pairings with under half a point of AA
headroom, so it is load-bearing rather than a formality.
