# Pre-launch feedback — capabilities, proof, portal link, demo accuracy

Four workstreams. Palette, fonts, hero and button system all stay as they are. All suites green and push when done.

## 1. New capability content — what actually makes us different

Right now the site sells "students who build websites." It says almost nothing about the platform behind it, which is the real differentiator. Add this material. Placement is your call, but the likely shape is a new **How it works / What you get** section on the home page plus a fuller treatment on `/benefits` (or a new page if you judge that cleaner — propose it before building).

Cover these, in roughly this priority order:

**a. Versioning — lead with this. It's the strongest thing we have.**
- Every revision produces a new saved version of your site. Nothing is ever overwritten and nothing is lost.
- You send a batch of changes, a human reviews and builds them, and you get a new version you can add images to and publish independently of the others.
- **The headline capability: you choose which version is live with one button.** Use the seasonal example, it sells itself — in November you request "make it more Christmassy," approve the result, press host, and your site is Christmas-themed. In January you press host on the previous version and you're back. Build the theme once, reuse it every year.
- The portal shows this as a version tree with branching lineage, not a flat list.

**b. Hosting and domains, managed for you.**
- We handle hosting and domain registration end to end. The client never touches a registrar or a DNS record.
- Hosting runs on Cloudflare's global network. WORDING RULES — read carefully:
  - Say we host *on Cloudflare's network*. Never "our servers," never anything implying partnership, sponsorship, or endorsement by Cloudflare, and do not use the Cloudflare logo as a badge.
  - Use only Cloudflare's own published figures and link to https://www.cloudflare.com/network/ so a visitor can verify: hundreds of cities in 100+ countries, and sub-50ms to roughly 95% of the Internet-connected population.
  - Do NOT write "servers in almost every major city in the US" or any invented stat.
  - The point for a local business is plain: your site loads fast for the people near you, and it stays up.

**c. How the sites are actually made.**
- Not a single AI prompt. Generation is a multi-step process: web search and research about the specific business and its industry, curated component libraries, and multiple specialized agents that draft, critique, and refine — then a human reviews every site before the client sees it.
- Describe the process concretely. Do NOT claim to be "the most unique and detailed sites" or any superlative we cannot prove — the process description is more persuasive than the boast and it is defensible.

**d. Images and assets.**
- Drag and drop your photos onto the placeholders in your site and save. No file names, no uploads by email, no waiting on us.
- We host and manage your assets for you (usercontent.getyourwebsite.now) — optimized and served from the same fast network.

## 2. Performance proof — make it verifiable, not a boast

Add a performance section that lets visitors check us rather than trust us.

- Include a **"Run the test yourself"** link to PageSpeed Insights prefilled with one of our live demo sites: `https://pagespeed.web.dev/analysis?url=<URL-encoded demo site URL>`. Use a real, publicly reachable demo site.
- IMPORTANT accuracy guardrail: real Lighthouse scores move between runs (we have watched /demo swing 95↔100 on image LCP alone). So do NOT print a fixed "100/100" as a standing claim. Either state scores with the date and conditions they were measured under, or — better — show the four category names and let the live link speak. A prefilled test we invite people to run is far stronger proof than a number we typed ourselves.
- If you judge that no demo site is on a good enough public URL yet to showcase this, say so and stop rather than pointing the link at something unrepresentative.

## 3. Portal sign-in link

- Add a **Sign in** link to the site header pointing to `https://portal.getyourwebsite.now`.
- The label is exactly "Sign in" — never "Log in" or "Sign up." Clients are given accounts by us; there is no self-serve registration and the wording must not imply one.
- Visually it is secondary to the gold "Free Mockup" CTA — that stays the primary action. A quiet text link or ghost button in the nav is right, plus a matching link in the footer.
- Mobile menu gets it too. Keep it out of the way of the primary conversion path.

## 4. Demo accuracy — the dashboard demo is behind the product again

Zane's note: the demo must match the real dashboard. It has drifted a third time — `development` has moved 135 commits and the portal gained major surfaces the demo does not show.

- Source of truth is unchanged: `github.com/GetYourWebsite-now/GetYourWebsiteAdmin`, branch `development`, directory `client/` (NOT `frontend/`, which is the staff admin app).
- The demo has the right five tabs (Explore, My website, Version tree, Free preview, Assets) but their contents are stale. Study the current code and bring the sandbox up to date — in particular the surfaces behind `HostingPanel.jsx`, `QuickEditPanel.jsx`, `AttachImagesPanel.jsx`, `VersionTreeTab.jsx`, `AssetsTab.jsx`, `AccountTab.jsx` and `Billing.jsx`. Decide which of those belong in a marketing demo; billing and account may be better left out, but that should be a decision you make and note, not an omission by accident.
- The three capabilities we are now selling hardest MUST be visible and clickable in the demo, because the copy above promises them: **choosing which version is hosted with one button**, **drag-and-drop images onto placeholders**, and **the version tree**.
- Same rules as always: sandbox only, no backend, no auth, seeded with the fake Rosa's Bakery client, nothing from env files or real client data, and re-derive the "What's different from the real thing" honesty list so every claim in it is true of the new build.
- **Stop the drift permanently.** Add a check that fails loudly when the demo falls behind — e.g. record the `client/` commit the sandbox was built from and have a suite step compare it against the current `development` head, failing with a clear "demo is N commits behind the portal, rebuild it" message. A stale demo is a credibility problem on the page that exists specifically to prove we are credible.

## Ground rules for all of the above

- Every capability claim must be true of the shipped product today. If something on this list is not fully working yet (registrar flows, asset host, one-click version hosting), say so and leave it out or mark it clearly — do not describe a roadmap as a feature.
- No superlatives we cannot prove, no invented statistics, no third-party logos implying endorsement.
- Keep the existing voice: plain, specific, confident. The facts are strong enough without hype.
