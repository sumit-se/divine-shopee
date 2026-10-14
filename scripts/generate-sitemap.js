#!/usr/bin/env node
/**
 * Writes public/sitemap.xml from the live catalogue.
 *
 *   npm run build                      # runs this first, then react-scripts
 *   npm run sitemap                    # on its own, against a local backend
 *   API_URL=https://api.divineshopee.in npm run sitemap
 *
 * `npm run build` chains this ahead of react-scripts so a deploy cannot ship a
 * sitemap older than the catalogue it describes. It has to run before the
 * build rather than after: react-scripts copies public/ into build/, so a
 * sitemap written afterwards would sit in public/ and never reach the bundle.
 *
 * The output is a plain file that Apache serves directly -- note that
 * public/.htaccess rewrites everything that is not a real file to index.html,
 * so the sitemap resolves only because it exists on disk.
 *
 * Why generated rather than written by hand: the shop has 83 products and they
 * come and go. An unlisted product's page 404s ("no longer available"), and a
 * sitemap is a promise to the crawler that the URLs in it resolve -- a stale
 * one feeds Google dead links and costs the whole file credibility. The two
 * flags that decide this, `available` (the admin's Listed/Unlist column) and
 * `visible`, are read straight from the API every run.
 *
 * Why not a backend endpoint: it would serve from the API host, so the sitemap
 * would live on a different origin from the pages it lists, which a crawler
 * treats as a cross-site sitemap and largely ignores unless both hosts are
 * verified. Generating a file onto the storefront keeps it same-origin.
 */

const fs = require('fs');
const path = require('path');

// The canonical host. Everything in a sitemap must be absolute, and these URLs
// have to match the host the pages actually serve on -- apex and www count as
// different sites to a crawler, so picking the wrong one wastes the file.
const SITE = (process.env.SITE_URL || 'https://divineshopee.in').replace(/\/+$/, '');
const API = (process.env.API_URL || 'http://localhost:8080').replace(/\/+$/, '');
const STORE = process.env.STORE || 'divineStore';
// not LANG: that is a real shell variable and arrives as something like en_GB.UTF-8
const LANG = process.env.SITEMAP_LANG || 'en';

const OUT = path.join(__dirname, '..', 'public', 'sitemap.xml');

// Routes with no data behind them. The private half of App.js -- cart,
// checkout, my-account, login, the order pages -- is deliberately absent:
// those are one shopper's pages, and robots.txt disallows them.
const STATIC_PAGES = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/rudraksha-recommendation', changefreq: 'monthly', priority: '0.6' },
  { loc: '/contact', changefreq: 'yearly', priority: '0.3' }
];

// /content/:id pages, by slug. The content listing endpoint returns a 500, so
// these cannot be discovered automatically -- add them here as they are
// created (about-us, privacy-policy, terms, shipping-policy and so on).
const CONTENT_PAGES = [];

const xmlEscape = s =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

async function api(pathAndQuery) {
  const url = `${API}/api/v1/${pathAndQuery}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

/** Every visible category, flattened out of the tree the API returns. */
async function categories() {
  const data = await api(`category?store=${STORE}&lang=${LANG}&count=500`);
  const out = [];
  let hidden = 0;
  const walk = node => {
    const slug = node.description && node.description.friendlyUrl;
    // `bracelets` and `gemstones` are visible:false -- they are not linked from
    // the shop, so listing them would invite a crawler to pages the owner has
    // taken down.
    if (node.visible && slug) out.push(slug);
    else if (!node.visible) hidden++;
    (node.children || []).forEach(walk);
  };
  (data.categories || []).forEach(walk);
  return { slugs: out, hidden };
}

/** Every listed, purchasable product, paged through until the API runs out. */
async function products() {
  const out = [];
  let skipped = 0, page = 0, pages = 1;
  while (page < pages) {
    const data = await api(`products?store=${STORE}&lang=${LANG}&count=100&page=${page}`);
    pages = data.totalPages || 1;
    for (const p of data.products || []) {
      const slug = p.description && p.description.friendlyUrl;
      // `available` is what the admin's Listed/Unlist column writes. An
      // unlisted product's page 404s, so it must never reach the sitemap.
      if (!slug || !p.available || !p.visible) { skipped++; continue; }
      out.push({ slug, lastmod: p.creationDate || null });
    }
    page++;
  }
  return { items: out, skipped };
}

const urlEntry = ({ loc, lastmod, changefreq, priority }) =>
  '  <url>\n'
  + `    <loc>${xmlEscape(SITE + loc)}</loc>\n`
  + (lastmod ? `    <lastmod>${xmlEscape(lastmod)}</lastmod>\n` : '')
  + `    <changefreq>${changefreq}</changefreq>\n`
  + `    <priority>${priority}</priority>\n`
  + '  </url>';

(async () => {
  const { slugs: cats, hidden } = await categories();
  const { items: prods, skipped } = await products();

  const entries = [
    ...STATIC_PAGES,
    ...CONTENT_PAGES.map(slug => ({
      loc: `/content/${slug}`, changefreq: 'yearly', priority: '0.3'
    })),
    ...cats.map(slug => ({
      loc: `/category/${slug}`, changefreq: 'weekly', priority: '0.8'
    })),
    // Products carry no lastModified, so creationDate is the only honest date
    // available; a made-up "today" on every run tells the crawler the whole
    // catalogue changed daily and it stops believing the field.
    ...prods.map(p => ({
      loc: `/product/${p.slug}`, lastmod: p.lastmod,
      changefreq: 'weekly', priority: '0.7'
    }))
  ];

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + entries.map(urlEntry).join('\n') + '\n'
    + '</urlset>\n';

  fs.writeFileSync(OUT, xml, 'utf8');

  console.log(`sitemap.xml written to ${OUT}`);
  console.log(`  host              ${SITE}`);
  console.log(`  static pages      ${STATIC_PAGES.length}`);
  console.log(`  content pages     ${CONTENT_PAGES.length}`);
  console.log(`  categories        ${cats.length}  (${hidden} hidden, excluded)`);
  console.log(`  products          ${prods.length}  (${skipped} unlisted or slugless, excluded)`);
  console.log(`  total URLs        ${entries.length}`);
})().catch(err => {
  console.error('sitemap generation failed:', err.message);
  console.error('is the backend running, and is API_URL right? currently ' + API);
  // Failing here stops `npm run build`, which is the point: the sitemap that
  // would otherwise ship is the last one generated, and it can advertise
  // products that have since been unlisted -- those pages 404, and a sitemap
  // full of dead URLs is worth less than no sitemap at all.
  //
  // SITEMAP_OPTIONAL=1 builds anyway, shipping whatever sitemap.xml is already
  // on disk. For a CI box or a machine with no backend to reach, where the
  // alternative is not being able to build at all.
  if (process.env.SITEMAP_OPTIONAL) {
    const existing = fs.existsSync(OUT);
    console.error(existing
      ? 'SITEMAP_OPTIONAL set -- continuing, shipping the sitemap.xml already on disk'
      : 'SITEMAP_OPTIONAL set -- continuing, but there is no sitemap.xml to ship');
    process.exit(0);
  }
  process.exit(1);
});
