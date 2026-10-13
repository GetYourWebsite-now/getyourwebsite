/**
 * sitemap.xml.
 *
 * Lists the real pages plus the concept sites, which are worth indexing —
 * they're the portfolio. 404 is deliberately left out, and so are the live
 * sites: they are other domains, and a sitemap may only list its own.
 *
 * If you add a page, add it to PAGES below.
 *
 * /beta and /free-mock are deliberately absent and must stay that way: they
 * are the ad landing pages (one live, one a redirect, depending on BETA),
 * both carry <meta name="robots" content="noindex">, and listing them here
 * would ask search engines to index pages we have told them not to.
 */
import type { APIRoute } from 'astro';
import { CONCEPT_PROJECTS } from '../data/site.js';

const PAGES = [
  { path: '/', priority: '1.0' },
  { path: '/work', priority: '0.9' },
  { path: '/demo', priority: '0.8' },
  { path: '/how-it-works', priority: '0.8' },
  { path: '/pricing', priority: '0.9' },
  { path: '/why-us', priority: '0.7' },
  { path: '/contact', priority: '0.9' },
  { path: '/privacy', priority: '0.3' },
  { path: '/terms', priority: '0.3' },
  { path: '/cookies', priority: '0.3' },
  { path: '/beta-terms', priority: '0.3' },
];

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://example.com');
  const today = new Date().toISOString().slice(0, 10);

  const entries = [
    ...PAGES.map((p) => ({ loc: new URL(p.path, base).href, priority: p.priority })),
    ...CONCEPT_PROJECTS.map((p) => ({ loc: new URL(p.href, base).href, priority: '0.5' })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${today}</lastmod>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
