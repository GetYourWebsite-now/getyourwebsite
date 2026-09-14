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

## Two rules that keep the site honest

**1. Every capability claim must be true of the shipped product today.** Check
it in `client/` first. If a capability has a condition on it — a custom domain
needs the maintenance plan, only approved versions can be hosted — the condition
belongs on the page. A capability with its limits stated reads as more credible
than one without, and this site's whole argument is credibility.

No superlatives we cannot prove, no invented statistics, no third-party logos
implying endorsement. Cloudflare is described as a network we host on, quoting
only their published figures, with a link so a visitor can check.

**2. The /demo sandbox must match the real portal.** It has drifted three times.
`src/data/portal-sync.json` records the `client/` commit it was built against,
and `npm run verify:portal` fails with a list of what has changed since. When
you rebuild the sandbox, update that file **in the same commit**, and re-run
`npm run shots:teaser` — the home page shows a picture of the sandbox that also
goes stale.

The sandbox is: no backend, no auth, no network, seeded with the fake Rosa's
Bakery client, and nothing copied from env files or real client data. Whatever
is not real about it goes in the "What's different from the real thing" list on
/demo — re-derive that list whenever the sandbox changes.

## Before pushing

```bash
npm run verify && npm run verify:pacing && npm run verify:contrast \
  && npm run verify:wraps && npm run verify:voids && npm run verify:portal
```

The README explains what each one measures, and why several of them have
counter-intuitively generous timeouts (headless rendering advances the hero's
animation clock at roughly 0.6x wall time).
