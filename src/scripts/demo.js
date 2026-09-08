/**
 * Demo sandbox behaviour — a no-backend recreation of the client portal.
 *
 * Everything lives in the `state` object below. There are no network calls, no
 * auth and no storage: reload the page (or press "Reset demo") and you're back
 * to the seed data.
 *
 * The element picker, the friendly labels and the prompt format are ported
 * directly from the real app so the "What we'll send" preview is byte-for-byte
 * what our client portal would actually deliver:
 *   client/src/clientRevision.js  → friendlyElementLabel, buildClientRevisionPrompt,
 *                                   formatClientPageLabel
 *   client/src/revisePicker.js    → the parent side of the picker messaging
 *   backend/src/siteRevisionPreview.js → the picker script injected into the preview
 */

const root = document.querySelector('[data-sandbox]');
if (root) init(root);

// ── Seed data ──────────────────────────────────────────────────────────────
// Shapes mirror what /api/client/sites returns in the real app.

function seed() {
  return {
    tab: 'explore',
    businessName: "Rosa's Bakery",
    mock: { placeId: 'demo-rosas-bakery', businessName: "Rosa's Bakery", createdAt: '2025-03-04' },

    /**
     * Versions, with parents — the real portal stores parentVersionId and draws
     * the tree from it (client/src/versionTreeLayout.js). The seed deliberately
     * contains a real branch: v4 is the Christmas version, taken from v2 rather
     * than from v3, because that is exactly the shape the seasonal story on
     * /how-it-works describes. A straight line would not show what a tree is
     * for.
     */
    site: {
      businessName: "Rosa's Bakery",
      viewStatus: 'ready',
      versionId: 'v3',
      versionNumber: 3,
      approvedAt: '2025-06-18',
      versions: [
        { versionId: 'v4', versionNumber: 4, approvedAt: '2025-11-24', parent: 2, label: 'Christmas' },
        { versionId: 'v3', versionNumber: 3, approvedAt: '2025-06-18', parent: 2 },
        { versionId: 'v2', versionNumber: 2, approvedAt: '2025-05-02', parent: 1 },
        { versionId: 'v1', versionNumber: 1, approvedAt: '2025-04-11', parent: null },
      ],
      // "Versions in review" — built, waiting on a human to approve it.
      pending: [{ versionNumber: 5, sentAt: '2025-11-28', parent: 3 }],
    },

    /** Which approved version is actually serving. The one-button switch. */
    hosting: { domain: 'rosasbakery.com', status: 'active', hostedVersion: 3 },

    /**
     * The image library, and the photo slots on the site. Attaching is the
     * other capability the marketing copy promises, so it has to work here.
     */
    assets: [
      { id: 'a1', name: 'Sourdough loaves' },
      { id: 'a2', name: 'Shopfront morning' },
      { id: 'a3', name: 'Counter display' },
      { id: 'a4', name: 'Cinnamon buns' },
    ],
    slots: [
      { id: 's1', label: 'Header photo', assetId: 'a2' },
      { id: 's2', label: 'About section', assetId: null },
      { id: 's3', label: 'Menu photo', assetId: null },
    ],

    // Change requests sent during this demo session.
    sent: [],
    // The workspace, when it's open.
    revising: null,
  };
}

// ── Ported from client/src/clientRevision.js ───────────────────────────────

const KIND_BY_TAG = {
  h1: 'main title', h2: 'section title', h3: 'section title', h4: 'heading',
  h5: 'heading', h6: 'heading', p: 'paragraph', img: 'image', button: 'button',
  nav: 'menu', header: 'top area', footer: 'bottom area', section: 'section',
  article: 'section', main: 'section', ul: 'list', ol: 'list', li: 'list item',
  form: 'form', input: 'form field', textarea: 'form field', select: 'form field',
  video: 'video', span: 'text', strong: 'text', em: 'text', small: 'text',
  div: 'part of the page',
};

function formatClientPageLabel(pagePath) {
  if (!pagePath || pagePath === 'index.html') return 'Home page';
  const clean = String(pagePath).replace(/\.html?$/i, '').replace(/[-_]/g, ' ');
  return clean
    .split('/')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' / ');
}

function friendlyElementLabel(descriptor = {}) {
  const tag = String(descriptor.tagName ?? 'div').toLowerCase();
  const kind = KIND_BY_TAG[tag] || 'part of the page';
  const preview = String(descriptor.textPreview ?? '').trim();

  if (tag === 'img') {
    if (preview && preview.toLowerCase() !== 'image') return `The image labeled "${preview}"`;
    return 'This image';
  }
  if (preview) return `The ${kind} that says "${preview}"`;
  return `This ${kind}`;
}

function buildClientRevisionPrompt({ overallNotes = '', pageEditsByPage = {}, elementNotes = [] } = {}) {
  const sections = [];
  const overall = String(overallNotes ?? '').trim();

  if (overall) sections.push(`Overall changes for the whole website:\n${overall}`);

  const pages = new Set([
    ...Object.keys(pageEditsByPage),
    ...elementNotes.map((note) => note.page || 'index.html'),
  ]);

  for (const page of [...pages].sort((a, b) => a.localeCompare(b))) {
    const pageLabel = formatClientPageLabel(page);
    const pageWide = String(pageEditsByPage[page] ?? '').trim();
    const notes = elementNotes.filter(
      (note) => (note.page || 'index.html') === page && String(note.comment ?? '').trim()
    );

    if (!pageWide && notes.length === 0) continue;

    const lines = [`On the ${pageLabel}:`];
    if (pageWide) lines.push(`- Page-wide changes: ${pageWide}`);

    notes.forEach((note) => {
      const label = note.friendlyLabel || friendlyElementLabel(note);
      lines.push(
        [`- ${label}: ${String(note.comment).trim()}`, note.selector ? `  (reference: ${note.selector})` : null]
          .filter(Boolean)
          .join('\n')
      );
    });

    sections.push(lines.join('\n'));
  }

  return sections.join('\n\n');
}

function isClientRevisionValid({ overallNotes = '', pageEditsByPage = {}, elementNotes = [] } = {}) {
  if (String(overallNotes ?? '').trim()) return true;
  if (Object.values(pageEditsByPage).some((v) => String(v ?? '').trim())) return true;
  return elementNotes.some((n) => String(n.comment ?? '').trim());
}

// ── The picker, injected into the preview iframe ───────────────────────────
// Same behaviour and the same outline colours as the real preview: indigo
// dashed on hover, cyan solid once a note is attached.

const PICKER_SOURCE = 'gywn-revise-picker';
const IGNORE_TAGS = new Set(['html', 'body', 'head', 'script', 'style', 'link', 'meta']);

function installPicker(doc, onSelect) {
  if (doc.getElementById('gywn-revise-styles')) return;

  const style = doc.createElement('style');
  style.id = 'gywn-revise-styles';
  style.textContent =
    '.gywn-revise-hover{outline:2px dashed rgba(99,102,241,.9)!important;outline-offset:2px;cursor:crosshair!important}' +
    '.gywn-revise-selected{outline:3px solid rgba(34,211,238,.95)!important;outline-offset:2px}' +
    'a:hover,a:hover *{outline:2px dashed rgba(251,191,36,.85)!important;outline-offset:2px}';
  doc.head.appendChild(style);

  const isSelectable = (el) =>
    el &&
    el.nodeType === 1 &&
    !IGNORE_TAGS.has(el.tagName.toLowerCase()) &&
    el !== doc.body &&
    el !== doc.documentElement;

  function findSelectable(start) {
    let current = start && start.nodeType === 1 ? start : start && start.parentElement;
    while (current) {
      if (isSelectable(current)) return current;
      current = current.parentElement;
    }
    return null;
  }

  function textPreview(el) {
    if (el.tagName === 'IMG') return (el.getAttribute('alt') || el.getAttribute('title') || 'Image').trim();
    return (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100);
  }

  function buildSelector(el) {
    if (el.id) return `#${el.id}`;
    const path = [];
    let current = el;

    while (current && current.nodeType === 1 && current.tagName !== 'HTML') {
      let part = current.tagName.toLowerCase();
      if (current.id) {
        path.unshift(`#${current.id}`);
        break;
      }
      const parent = current.parentElement;
      if (parent) {
        const sameTag = [...parent.children].filter((c) => c.tagName === current.tagName);
        if (sameTag.length > 1) part += `:nth-of-type(${sameTag.indexOf(current) + 1})`;
      }
      path.unshift(part);
      current = parent;
      if (path.length >= 8) break;
    }
    return path.join(' > ');
  }

  let hovered = null;

  doc.addEventListener('mouseover', (e) => {
    const el = findSelectable(e.target);
    if (hovered && hovered !== el) hovered.classList.remove('gywn-revise-hover');
    if (el) el.classList.add('gywn-revise-hover');
    hovered = el;
  });

  doc.addEventListener('mouseleave', () => {
    if (hovered) hovered.classList.remove('gywn-revise-hover');
    hovered = null;
  });

  doc.addEventListener(
    'click',
    (e) => {
      // Links inside the preview must not navigate the demo away.
      e.preventDefault();
      e.stopPropagation();

      const el = findSelectable(e.target);
      if (!el) return;

      onSelect(
        {
          tagName: el.tagName.toLowerCase(),
          selector: buildSelector(el),
          textPreview: textPreview(el),
        },
        el
      );
    },
    true
  );

  doc.__gywnPickerSource = PICKER_SOURCE;
}

// ── Wiring ─────────────────────────────────────────────────────────────────

function init(root) {
  let state = seed();

  const $ = (sel) => root.querySelector(sel);
  const $$ = (sel) => [...root.querySelectorAll(sel)];

  const el = {
    tabs: $$('[data-tab]'),
    panels: Object.fromEntries(
      $$('[data-panel]').map((p) => [p.dataset.panel, p])
    ),
    crumb: $('[data-crumb]'),
    burger: $('[data-burger]'),
    portal: $('[data-portal]'),
    exploreSummary: $('[data-explore-summary]'),
    kpiStatus: $('[data-kpi-status]'),
    kpiStatusTrend: $('[data-kpi-status-trend]'),
    kpiVersions: $('[data-kpi-versions]'),
    kpiVersionsTrend: $('[data-kpi-versions-trend]'),
    kpiAssets: $('[data-kpi-assets]'),
    kpiAssetsTrend: $('[data-kpi-assets-trend]'),
    recommended: $('[data-recommended]'),
    vtree: $('[data-vtree]'),
    vtreeEdges: $('[data-vtree-edges]'),
    pendingPanel: $('[data-pending-panel]'),
    pending: $('[data-pending]'),
    hosted: $('[data-hosted]'),
    domain: $('[data-domain]'),
    attach: $('[data-attach]'),
    attachVersion: $('[data-attach-version]'),
    slots: $('[data-slots]'),
    attachLibrary: $('[data-attach-library]'),
    assets: $('[data-assets]'),
    assetsEmpty: $('[data-assets-empty]'),
    versions: $('[data-versions]'),
    success: $('[data-success]'),
    latestVersion: $('[data-latest-version]'),
    latestApproved: $('[data-latest-approved]'),
    mockDate: $('[data-mock-date]'),
    overlay: $('[data-revise]'),
    frame: $('[data-frame]'),
    revisePill: $('[data-revise-version]'),
    pagePill: $('[data-page-pill]'),
    form: $('[data-revise-form]'),
    overall: $('[data-overall]'),
    pageEdits: $('[data-page-edits]'),
    notes: $('[data-notes]'),
    notesEmpty: $('[data-notes-empty]'),
    promptBox: $('[data-prompt-box]'),
    prompt: $('[data-prompt]'),
    send: $('[data-send]'),
    log: $('[data-log]'),
    logItems: $('[data-log-items]'),
  };

  const fmtDate = (iso) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  // The demo's stand-in for a hosted version of the site. Version 3 is the
  // current bakery mock; earlier versions get a small style override so you can
  // see that revisions actually changed something.
  const BASE = document.documentElement.dataset.base || '/';
  const previewUrl = () => `${BASE}bakery.html`.replace(/\/{2,}/g, '/');

  const VERSION_TWEAKS = {
    1: ':root{--terra:#8d8f93!important;--terra-d:#6f7175!important;--gold:#b9b199!important}',
    2: ':root{--terra:#b8763f!important;--terra-d:#96591f!important}',
    3: '',
  };

  // ── Rendering ────────────────────────────────────────────────────────────

  const TAB_LABELS = {
    explore: 'Explore',
    'real-site': 'My website',
    'version-tree': 'Version tree',
    'mock-site': 'Free preview',
    assets: 'Assets',
  };

  function renderTabs() {
    // Only the sidebar buttons carry the active state — the Explore quick-action
    // tiles also have data-tab and must not light up as nav.
    el.tabs.forEach((btn) => {
      if (btn.classList.contains('client-nav-tab')) {
        btn.classList.toggle('active', btn.dataset.tab === state.tab);
      }
    });
    Object.entries(el.panels).forEach(([id, panel]) => {
      panel.hidden = id !== state.tab;
    });
    el.crumb.textContent = TAB_LABELS[state.tab] || 'Portal';
  }

  /**
   * The Explore dashboard.
   *
   * The three cards and the recommendation list are derived the same way the
   * real ExploreTab does it: status and version count come from the site,
   * the image count from the asset library, and the recommendations are chosen
   * by those same conditions rather than being a fixed list.
   */
  function renderExplore() {
    const site = state.site;
    const versions = site.versions.length;
    const assets = state.assets.length;
    const ready = site.viewStatus === 'ready';

    el.exploreSummary.textContent = ready
      ? `Your website is ready on version ${site.versionNumber}. Jump into changes, images, or your free preview.`
      : 'Welcome to your client portal. Check back as we build your website and preview.';

    el.kpiStatus.textContent = ready ? 'Ready' : 'Not started';
    el.kpiStatusTrend.textContent = site.approvedAt
      ? `Approved ${fmtDate(site.approvedAt)}`
      : 'No approval yet';
    el.kpiVersions.textContent = String(versions);
    el.kpiVersionsTrend.textContent = versions
      ? `Latest v${site.versionNumber}`
      : 'No prior versions';
    el.kpiAssets.textContent = String(assets);
    el.kpiAssetsTrend.textContent = assets ? `${assets} public` : 'No photos uploaded';

    const recommended = [
      {
        title: 'Request website changes',
        detail: 'Click elements on your live site and tell us what to update.',
        cta: 'Open My website',
        tab: 'real-site',
      },
      {
        title: 'Review your free preview',
        detail: `Finished ${fmtDate(state.mock.createdAt)}. Open it anytime.`,
        cta: 'Open preview',
        tab: 'mock-site',
      },
      assets === 0
        ? {
            title: 'Upload your first photos',
            detail: 'Build a library of images you can attach to website placeholders.',
            cta: 'Go to Assets',
            tab: 'assets',
          }
        : {
            title: 'Browse your image library',
            detail: `${assets} image${assets === 1 ? '' : 's'} ready for your site.`,
            cta: 'Open Assets',
            tab: 'assets',
          },
    ];

    el.recommended.innerHTML = '';
    recommended.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'explore-recommended-row';
      li.innerHTML = `
        <span class="explore-recommended-mark" aria-hidden="true"></span>
        <div class="explore-recommended-copy">
          <div class="explore-recommended-title"></div>
          <div class="explore-recommended-detail"></div>
        </div>
        <button type="button" class="client-btn-soft" data-tab="${item.tab}"></button>`;
      li.querySelector('.explore-recommended-title').textContent = item.title;
      li.querySelector('.explore-recommended-detail').textContent = item.detail;
      li.querySelector('button').textContent = item.cta;
      el.recommended.appendChild(li);
    });
  }

  /**
   * The version tree.
   *
   * Depth flows left to right and siblings fan out on Y, which is the shape
   * client/src/versionTreeLayout.js produces. Rosa's v3 and v4 both hang off
   * v2 — that branch is the whole point of the view, and of the seasonal story
   * on /how-it-works. Edges are drawn as SVG curves leaving a parent's right
   * edge and entering a child's left.
   */
  function renderVersionTree() {
    const nodes = [
      ...state.site.versions.map((v) => ({
        n: v.versionNumber,
        parent: v.parent,
        approvedAt: v.approvedAt,
        label: v.label,
      })),
      ...state.site.pending.map((p) => ({
        n: p.versionNumber,
        parent: p.parent,
        pending: true,
      })),
    ];

    // Depth from the root, then spread siblings within each depth column.
    const byN = new Map(nodes.map((x) => [x.n, x]));
    const depthOf = (x) => {
      let d = 0;
      let cur = x;
      while (cur && cur.parent != null && byN.has(cur.parent)) {
        d++;
        cur = byN.get(cur.parent);
      }
      return d;
    };
    nodes.forEach((x) => { x.d = depthOf(x); });

    const cols = new Map();
    nodes.sort((a, b) => a.n - b.n).forEach((x) => {
      if (!cols.has(x.d)) cols.set(x.d, []);
      cols.get(x.d).push(x);
    });

    const W = 100 / (cols.size + 0.6);
    nodes.forEach((x) => {
      const col = cols.get(x.d);
      const i = col.indexOf(x);
      x.x = W * (x.d + 0.7);
      x.y = ((i + 1) / (col.length + 1)) * 100;
    });

    el.vtree.innerHTML = '';
    nodes.forEach((x) => {
      const live = !x.pending && state.hosting.hostedVersion === x.n;
      const card = document.createElement('div');
      card.className = `vtree-card${live ? ' is-live' : ''}${x.pending ? ' is-pending' : ''}`;
      card.style.left = `${x.x}%`;
      card.style.top = `${x.y}%`;
      card.innerHTML = `
        <div class="vtree-card__title"></div>
        <div class="vtree-card__meta"></div>`;
      card.querySelector('.vtree-card__title').textContent =
        `Version ${x.n}${x.label ? ` · ${x.label}` : ''}`;
      card.querySelector('.vtree-card__meta').textContent = x.pending
        ? 'In review'
        : live
          ? 'Live now'
          : `Approved ${fmtDate(x.approvedAt)}`;
      el.vtree.appendChild(card);
    });

    // Edges.
    //
    // Drawn in a normalised 0-100 x 0-100 space with preserveAspectRatio="none"
    // rather than in pixels. The pixel version needed the container measured,
    // which meant waiting for a frame in which the panel was actually visible —
    // and since the tree first renders while its tab is hidden, that measurement
    // came back zero and the edges silently never appeared. Percentages need no
    // measurement and no timing at all.
    const SVG_NS = 'http://www.w3.org/2000/svg';
    // Roughly half a card, as a share of the width — where an edge should stop.
    const HALF = 9;
    el.vtreeEdges.setAttribute('viewBox', '0 0 100 100');
    el.vtreeEdges.setAttribute('preserveAspectRatio', 'none');
    el.vtreeEdges.replaceChildren(
      ...nodes
        .filter((x) => x.parent != null && byN.has(x.parent))
        .map((x) => {
          const par = byN.get(x.parent);
          const x1 = par.x + HALF;
          const x2 = x.x - HALF;
          const mid = (x1 + x2) / 2;
          const path = document.createElementNS(SVG_NS, 'path');
          path.setAttribute(
            'd',
            `M${x1},${par.y} C${mid},${par.y} ${mid},${x.y} ${x2},${x.y}`
          );
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke', 'rgba(230,231,235,0.28)');
          // Non-scaling so the curve keeps an even weight despite the stretched
          // aspect ratio — without it the line thins horizontally and thickens
          // vertically.
          path.setAttribute('vector-effect', 'non-scaling-stroke');
          path.setAttribute('stroke-width', '1.5');
          return path;
        })
    );
  }

  /** Versions waiting on a human — the review step, made visible. */
  function renderPending() {
    const list = state.site.pending;
    el.pendingPanel.hidden = list.length === 0;
    el.pending.innerHTML = '';
    list.forEach((v) => {
      const li = document.createElement('li');
      li.className = 'portal-version-item';
      li.innerHTML = `
        <div>
          <div class="portal-version-name"></div>
          <div class="portal-meta"></div>
        </div>
        <span class="portal-status">In review</span>`;
      li.querySelector('.portal-version-name').textContent = `Version ${v.versionNumber}`;
      li.querySelector('.portal-meta').textContent =
        `Sent ${fmtDate(v.sentAt)} · we build it, then approve it`;
      el.pending.appendChild(li);
    });
  }

  /**
   * The hosted-version switch. This is the capability the home page and
   * /how-it-works both lead with, so in the demo it genuinely switches.
   */
  function renderHosting() {
    el.domain.textContent = state.hosting.domain;
    el.hosted.innerHTML = '';
    state.site.versions.forEach((v) => {
      const live = state.hosting.hostedVersion === v.versionNumber;
      const filled = live ? state.slots.filter((s2) => s2.assetId).length : null;
      const li = document.createElement('li');
      li.className = `portal-version-item${live ? ' is-live' : ''}`;
      li.innerHTML = `
        <div>
          <div class="portal-version-name"></div>
          <div class="portal-meta"></div>
        </div>
        <div class="portal-version-actions">
          <button type="button" class="client-btn-soft" data-host="${v.versionNumber}"></button>
        </div>`;
      const name = li.querySelector('.portal-version-name');
      name.textContent = `Version ${v.versionNumber}${v.label ? ` · ${v.label}` : ''}`;
      if (live) {
        const pill = document.createElement('span');
        pill.className = 'dash-pill';
        pill.textContent = 'Live';
        name.appendChild(pill);
      }
      li.querySelector('.portal-meta').textContent =
        live && filled != null
          ? `${filled} of ${state.slots.length} photos filled`
          : `Approved ${fmtDate(v.approvedAt)}`;
      const btn = li.querySelector('button');
      btn.textContent = live ? 'Hosting' : 'Host this version';
      btn.disabled = live;
      el.hosted.appendChild(li);
    });
  }

  // -- Attach images ---------------------------------------------------------
  // Drag a library photo onto a slot. Pointer drag for a mouse, tap-then-tap
  // for touch, because a demo nobody can use on a phone proves nothing.
  let armed = null;

  const assetImg = (id) => {
    const i = state.assets.findIndex((a) => a.id === id);
    return `https://loremflickr.com/320/240/bakery?lock=${i + 21}`;
  };

  function renderAttach() {
    el.attachVersion.textContent = `Version ${state.site.versionNumber}`;

    el.slots.innerHTML = '';
    state.slots.forEach((slot) => {
      const asset = state.assets.find((a) => a.id === slot.assetId);
      const row = document.createElement('div');
      row.className = `attach-slot${asset ? ' is-filled' : ''}${armed ? ' is-armed' : ''}`;
      row.dataset.slot = slot.id;
      row.innerHTML = `
        ${asset
          ? `<img class="attach-slot__thumb" src="${assetImg(asset.id)}" alt="" width="320" height="240" loading="eager">`
          : '<div class="attach-slot__thumb"></div>'}
        <div>
          <div class="attach-slot__label"></div>
          <div class="attach-slot__state"></div>
        </div>`;
      row.querySelector('.attach-slot__label').textContent = slot.label;
      row.querySelector('.attach-slot__state').textContent = asset
        ? asset.name
        : armed
          ? 'Tap to place the selected photo'
          : 'Empty — drag a photo here';
      el.slots.appendChild(row);
    });

    el.attachLibrary.innerHTML = '';
    state.assets.forEach((a) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `attach-chip${armed === a.id ? ' is-armed' : ''}`;
      chip.draggable = true;
      chip.dataset.asset = a.id;
      // Explicit dimensions, and eager. A lazily-loaded image with no
      // intrinsic size reflows the grid as it arrives, which moves the photo
      // you were reaching for out from under the cursor — you grab the wrong
      // one. The panel is opened deliberately, so there is nothing to defer.
      chip.innerHTML =
        `<img src="${assetImg(a.id)}" alt="" width="320" height="240" loading="eager"><span></span>`;
      chip.querySelector('span').textContent = a.name;
      el.attachLibrary.appendChild(chip);
    });
  }

  const SAMPLE_ASSETS = [
    'Sourdough loaves',
    'Shopfront morning',
    'Counter display',
    'Cinnamon buns',
  ];

  function renderAssets() {
    const has = state.assets.length > 0;
    el.assetsEmpty.hidden = has;
    el.assets.hidden = !has;
    el.assets.innerHTML = '';
    state.assets.forEach((name, i) => {
      const li = document.createElement('li');
      li.className = 'assets-card';
      const img = document.createElement('img');
      img.src = `https://loremflickr.com/320/240/bakery?lock=${i + 21}`;
      img.alt = '';
      img.loading = 'lazy';
      const span = document.createElement('span');
      span.className = 'assets-card__name';
      span.textContent = name;
      li.append(img, span);
      el.assets.appendChild(li);
    });
  }

  function renderSite() {
    const site = state.site;
    el.latestVersion.textContent = `Version ${site.versionNumber}`;
    el.latestApproved.textContent = `Approved ${fmtDate(site.approvedAt)}`;
    el.mockDate.textContent = `Finished ${fmtDate(state.mock.createdAt)}`;

    el.versions.innerHTML = '';
    site.versions.forEach((v) => {
      const isLatest = v.versionNumber === site.versionNumber;
      const li = document.createElement('li');
      li.className = 'portal-version-item';
      li.innerHTML = `
        <div>
          <div class="portal-version-name">Version ${v.versionNumber}${isLatest ? ' (latest)' : ''}</div>
          <div class="portal-meta">Approved ${fmtDate(v.approvedAt)}</div>
        </div>
        <div class="portal-version-actions">
          <button type="button" class="client-btn-soft" data-open-version="${v.versionNumber}">Open</button>
          <button type="button" class="client-btn-soft" data-revise-vnum="${v.versionNumber}">Request changes</button>
          <button type="button" class="client-btn-soft" data-photos="${v.versionNumber}">Add photos</button>
        </div>`;
      el.versions.appendChild(li);
    });
  }

  function renderLog() {
    el.log.hidden = state.sent.length === 0;
    el.logItems.innerHTML = '';
    state.sent.forEach((entry) => {
      const li = document.createElement('li');
      const time = document.createElement('time');
      time.textContent = `Version ${entry.versionNumber} · just now`;
      const pre = document.createElement('pre');
      pre.textContent = entry.prompt;
      li.append(time, pre);
      el.logItems.appendChild(li);
    });
  }

  function renderNotes() {
    const r = state.revising;
    if (!r) return;

    const pageNotes = r.elementNotes.filter((n) => n.page === r.currentPage);

    el.notesEmpty.hidden = pageNotes.length > 0;
    el.notes.hidden = pageNotes.length === 0;
    el.notes.innerHTML = '';

    pageNotes.forEach((note, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'client-revise-note-wrap';

      const card = document.createElement('div');
      card.className = 'client-revise-note';
      card.innerHTML = `
        <div class="client-revise-note-header">
          <span class="client-revise-note-index">${i + 1}</span>
          <div class="client-revise-note-meta">
            <div class="client-revise-note-label"></div>
          </div>
          <button type="button" class="client-revise-note-remove" aria-label="Remove this note">✕</button>
        </div>`;
      card.querySelector('.client-revise-note-label').textContent = note.friendlyLabel;

      const ta = document.createElement('textarea');
      ta.className = 'client-revise-textarea';
      ta.rows = 3;
      ta.placeholder = 'What should we change about this?';
      ta.value = note.comment;
      ta.addEventListener('input', () => {
        note.comment = ta.value;
        renderPrompt();
      });
      card.appendChild(ta);

      card.querySelector('.client-revise-note-remove').addEventListener('click', () => {
        unmark(note.id);
        r.elementNotes = r.elementNotes.filter((n) => n.id !== note.id);
        renderNotes();
        renderPrompt();
      });

      wrap.appendChild(card);
      el.notes.appendChild(wrap);
    });

    el.pagePill.textContent = formatClientPageLabel(r.currentPage);
  }

  function renderPrompt() {
    const r = state.revising;
    if (!r) return;

    const payload = {
      overallNotes: r.overallNotes,
      pageEditsByPage: r.pageEditsByPage,
      elementNotes: r.elementNotes,
    };

    const valid = isClientRevisionValid(payload);
    el.send.disabled = !valid;
    el.promptBox.hidden = !valid;
    if (valid) el.prompt.textContent = buildClientRevisionPrompt(payload);
  }

  // ── The revision workspace ───────────────────────────────────────────────

  function unmark(noteId) {
    const doc = el.frame.contentDocument;
    if (!doc) return;
    const marked = doc.querySelector(`[data-gywn-revise-id="${noteId}"]`);
    if (marked) {
      marked.classList.remove('gywn-revise-selected');
      marked.removeAttribute('data-gywn-revise-id');
    }
  }

  function openRevise(versionNumber) {
    state.revising = {
      versionNumber,
      currentPage: 'index.html',
      overallNotes: '',
      pageEditsByPage: {},
      elementNotes: [],
    };

    el.revisePill.textContent = `Version ${versionNumber}`;
    el.overall.value = '';
    el.pageEdits.value = '';
    el.overlay.hidden = false;
    el.send.disabled = true;
    el.promptBox.hidden = true;

    loadPreview(versionNumber);
    renderNotes();

    // Focus the dialog so keyboard users land inside it.
    el.overlay.querySelector('[role="dialog"]').setAttribute('tabindex', '-1');
    el.overlay.querySelector('[role="dialog"]').focus();
  }

  function closeRevise() {
    el.overlay.hidden = true;
    state.revising = null;
  }

  function loadPreview(versionNumber) {
    el.frame.src = previewUrl();
    el.frame.onload = () => {
      const doc = el.frame.contentDocument;
      if (!doc) return;

      // Make earlier versions look like earlier drafts.
      const tweak = VERSION_TWEAKS[versionNumber];
      if (tweak) {
        const s = doc.createElement('style');
        s.textContent = tweak;
        doc.head.appendChild(s);
      }

      installPicker(doc, (descriptor, node) => {
        const r = state.revising;
        if (!r) return;

        const existing = r.elementNotes.find(
          (n) => n.page === r.currentPage && n.selector === descriptor.selector
        );
        if (existing) return;

        const note = {
          id: `note-${r.elementNotes.length + 1}-${descriptor.selector.length}`,
          page: r.currentPage,
          tagName: descriptor.tagName,
          selector: descriptor.selector,
          textPreview: descriptor.textPreview,
          friendlyLabel: friendlyElementLabel(descriptor),
          comment: '',
        };

        r.elementNotes.push(note);
        node.classList.add('gywn-revise-selected');
        node.setAttribute('data-gywn-revise-id', note.id);

        renderNotes();
        renderPrompt();

        // Focus the textarea for the note that was just added, as the real
        // panel does.
        const boxes = el.notes.querySelectorAll('textarea');
        boxes[boxes.length - 1]?.focus();
      });
    };
  }

  // Same reason as the tab switch: the edge geometry is pixel-based.
  window.addEventListener('resize', () => {
    if (state.tab === 'version-tree') renderVersionTree();
  }, { passive: true });

  // ── Attach: drag and drop, plus tap-to-place ─────────────────────────────

  function placeAsset(slotId, assetId) {
    const slot = state.slots.find((x) => x.id === slotId);
    if (!slot) return;
    slot.assetId = assetId;
    armed = null;
    renderAttach();
  }

  root.addEventListener('dragstart', (e) => {
    const chip = e.target.closest?.('[data-asset]');
    if (!chip) return;
    e.dataTransfer.setData('text/plain', chip.dataset.asset);
    e.dataTransfer.effectAllowed = 'copy';
  });

  root.addEventListener('dragover', (e) => {
    const slot = e.target.closest?.('[data-slot]');
    if (!slot) return;
    // Without preventDefault the browser refuses the drop entirely — this is
    // the one line that makes HTML5 drag targets work at all.
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    slot.classList.add('is-over');
  });

  root.addEventListener('dragleave', (e) => {
    e.target.closest?.('[data-slot]')?.classList.remove('is-over');
  });

  root.addEventListener('drop', (e) => {
    const slot = e.target.closest?.('[data-slot]');
    if (!slot) return;
    e.preventDefault();
    slot.classList.remove('is-over');
    const assetId = e.dataTransfer.getData('text/plain');
    if (assetId) placeAsset(slot.dataset.slot, assetId);
  });

  // Touch path: a photo is armed by tapping it, then a slot takes it.
  root.addEventListener('click', (e) => {
    const slot = e.target.closest?.('[data-slot]');
    if (!slot || !armed) return;
    placeAsset(slot.dataset.slot, armed);
  });

  // ── Events ───────────────────────────────────────────────────────────────

  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;

    // Delegated, not bound per button: the Recommended-actions buttons are
    // rendered after init and carry data-tab too, so binding up front would
    // miss them and they'd do nothing.
    if (t.dataset.tab) {
      state.tab = t.dataset.tab;
      el.success.hidden = true;
      el.portal.classList.remove('is-nav-open');
      el.burger.setAttribute('aria-expanded', 'false');
      renderTabs();
      // The tree measures itself to place the edges, and a hidden panel has no
      // width — drawn at boot it silently produced no edges at all. Redraw it
      // once the panel is actually on screen.
      if (state.tab === 'version-tree') renderVersionTree();
      el.panels[state.tab]?.scrollIntoView?.({ block: 'nearest' });
      return;
    }

    // The one-button version switch.
    if (t.dataset.host) {
      state.hosting.hostedVersion = Number(t.dataset.host);
      renderHosting();
      renderVersionTree();
      renderExplore();
      el.success.hidden = false;
      el.success.textContent =
        `Version ${t.dataset.host} is now live on ${state.hosting.domain}.`;
      return;
    }

    if (t.dataset.photos) {
      el.attach.hidden = false;
      armed = null;
      renderAttach();
      return;
    }

    if (t.hasAttribute('data-attach-close')) {
      el.attach.hidden = true;
      armed = null;
      return;
    }

    if (t.hasAttribute('data-attach-save')) {
      el.attach.hidden = true;
      armed = null;
      const filled = state.slots.filter((s2) => s2.assetId).length;
      el.success.hidden = false;
      el.success.textContent =
        `Photos saved — ${filled} of ${state.slots.length} slots filled on version ${state.site.versionNumber}.`;
      renderHosting();
      renderExplore();
      return;
    }

    // Tap a library photo, then tap a slot. The touch path.
    if (t.dataset.asset) {
      armed = armed === t.dataset.asset ? null : t.dataset.asset;
      renderAttach();
      return;
    }

    if (t.hasAttribute('data-burger')) {
      const open = el.portal.classList.toggle('is-nav-open');
      t.setAttribute('aria-expanded', String(open));
      return;
    }

    // The real Assets tab uploads from your computer. There's no backend here,
    // so this drops in a few named samples to show what a filled library looks
    // like — and it's called out in the honesty list on the page.
    if (t.hasAttribute('data-add-asset')) {
      if (state.assets.length < SAMPLE_ASSETS.length) {
        state.assets = SAMPLE_ASSETS.slice(0, state.assets.length + 2);
        renderAssets();
        renderExplore();
      }
      return;
    }

    // "Check again" — the real button re-fetches; here it just blinks.
    if (t.dataset.check) {
      const original = t.textContent;
      t.textContent = 'Checking…';
      t.disabled = true;
      setTimeout(() => {
        t.textContent = original;
        t.disabled = false;
      }, 700);
      return;
    }

    if (t.hasAttribute('data-open-mock') || t.hasAttribute('data-open-site')) {
      window.open(previewUrl(), '_blank', 'noopener,noreferrer');
      return;
    }

    if (t.dataset.openVersion) {
      window.open(previewUrl(), '_blank', 'noopener,noreferrer');
      return;
    }

    if (t.hasAttribute('data-revise-latest')) {
      openRevise(state.site.versionNumber);
      return;
    }

    if (t.dataset.reviseVnum) {
      openRevise(Number(t.dataset.reviseVnum));
      return;
    }

    if (t.hasAttribute('data-close') || t.hasAttribute('data-cancel')) {
      closeRevise();
      return;
    }

    if (t.hasAttribute('data-refresh')) {
      if (state.revising) loadPreview(state.revising.versionNumber);
      return;
    }

    if (t.hasAttribute('data-signout')) {
      // There's no auth here — say so rather than pretending.
      alert('This is a demo, so there is nothing to sign out of. In the real portal this returns you to the login screen.');
      return;
    }

    if (t.hasAttribute('data-reset')) {
      state = seed();
      closeRevise();
      el.success.hidden = true;
      renderTabs();
      renderSite();
      renderExplore();
      renderVersionTree();
      renderPending();
      renderHosting();
      renderAssets();
      renderLog();
      return;
    }
  });

  el.overall.addEventListener('input', () => {
    if (!state.revising) return;
    state.revising.overallNotes = el.overall.value;
    renderPrompt();
  });

  el.pageEdits.addEventListener('input', () => {
    if (!state.revising) return;
    state.revising.pageEditsByPage[state.revising.currentPage] = el.pageEdits.value;
    renderPrompt();
  });

  el.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const r = state.revising;
    if (!r) return;

    const prompt = buildClientRevisionPrompt({
      overallNotes: r.overallNotes,
      pageEditsByPage: r.pageEditsByPage,
      elementNotes: r.elementNotes,
    });
    if (!prompt.trim()) return;

    el.send.disabled = true;
    el.send.textContent = 'Sending…';

    // Mimic the real round trip so the interaction feels the same.
    setTimeout(() => {
      state.sent.unshift({ versionNumber: r.versionNumber, prompt });
      closeRevise();

      el.send.textContent = 'Send change request';
      el.success.textContent = 'Your change request was sent. We’ll update your website from there.';
      el.success.hidden = false;

      state.tab = 'real-site';
      renderTabs();
      renderLog();

      el.success.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 650);
  });

  // Escape closes the workspace, as a dialog should.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !el.overlay.hidden) closeRevise();
  });

  renderTabs();
  renderSite();
  renderExplore();
  renderVersionTree();
  renderPending();
  renderHosting();
  renderAssets();
  renderLog();
}
