# Phase 5 — carried over

Things found during earlier phases that belong to Phase 5 (Why Us / How it
works / Benefits merge, About story) rather than where they were found.

## Delivery-time claims that survived the pricing rewrite

Phase 4 removed week counts from pricing deliberately: the only real data
point we have is ARK at 24 build rounds, and there is no defensible "1–2
weeks". `TIERS.delivery` is gone and the old pricing FAQ that said "two to
four days … one to three weeks" went with it.

These are still live elsewhere and now contradict a pricing page that
carefully refuses to promise a timeline:

- `src/pages/contact.astro` — "We reply within a day or two" (the numbered
  steps list, and again in the body copy lower down).
- `src/pages/why-us.astro` — the four-step list: "We build a free mockup —
  a real homepage concept for your business, usually …".

Decide one of:

1. Drop the timings entirely, matching pricing.
2. Keep a *response* time only ("we reply within one business day", which is
   what `/free-mock` already promises) and drop *build* timings, which are
   the ones we cannot defend.

Option 2 is probably right — a reply-time promise is ours to control, a
build-time estimate depends on how fast content comes back from the client.
Whatever is chosen, `/free-mock` says "within one business day" and the rest
of the site should say the same thing in the same words.

## Also worth a look in Phase 5

- The README's colour and type sections still describe the old four-colour
  palette and Clash Display (flagged in-file; the final pass rewrites them).
- `/contact` still carries the older "Request a free mockup" voice while the
  rest of the site now says "free mock".
