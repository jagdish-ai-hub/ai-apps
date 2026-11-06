// Sitemaps: /sitemap.xml is an index pointing to one sitemap per language (/sitemap-<code>.xml).
// Every URL comes from the same lists that build the pages, so a sitemap can never list a page that does not exist.
// A URL belongs to the language of its first path segment (/ja/... -> ja); everything else (tools, token pages, legal) is English.
import { languages, localePath, absolute, langByCode } from './i18n';
import { guidesFor, guidePath, guidesHubPath, guideAlternates, hubAlternates } from './guides';
import { guideLangs } from './guidelangs.js';
import { tokenLangs } from './tokenlangs';
import { qrKinds, qrLangs, qrPath, qrAlternates } from './qrpages';
import { landingLangs, landingPath, landingAlternates } from './landings';
import { tools, toolPath } from './tools';

const lastmod = new Date().toISOString().slice(0, 10);
const legal = ['/about/', '/privacy/', '/terms/', '/contact/'];
const XMLNS = 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';

type Alt = { hreflang: string; href: string };
type Entry = { path: string; lastmod: string; changefreq: string; priority: string; alternates: Alt[] };

const hreflang = (code: string) => langByCode(code).hreflang;
const homeAlternates: Alt[] = [
  ...languages.map((l) => ({ hreflang: l.hreflang, href: absolute(localePath(l.code)) })),
  { hreflang: 'x-default', href: absolute('/') },
];

function entries(): Entry[] {
  const e = (path: string, changefreq: string, priority: string, alternates: Alt[] = [], updated = lastmod): Entry => ({ path, lastmod: updated, changefreq, priority, alternates });
  const landingAlt = landingLangs.length ? landingAlternates(absolute, hreflang) : [];
  const qrAlt = (k: (typeof qrKinds)[number]) => (qrLangs.length ? qrAlternates(k, absolute, hreflang) : []);
  const qrEnAlt = new Map(qrKinds.map((k) => [qrPath(k, 'en'), qrAlt(k)]));
  const toolUrls = ['/tools/', ...tools.map((t) => toolPath(t.slug)), ...tokenLangs.map((l) => `/tokens-in/${l.slug}/`)];
  return [
    ...languages.map((l) => e(localePath(l.code), 'weekly', l.code === 'en' ? '1.0' : '0.9', homeAlternates)),
    ...toolUrls.map((p) => e(p, 'monthly', '0.9', p === landingPath('en') ? landingAlt : qrEnAlt.get(p) ?? [])),
    ...qrKinds.flatMap((k) => qrLangs.map((l) => e(qrPath(k, l), 'monthly', '0.8', qrAlt(k)))),
    ...landingLangs.map((l) => e(landingPath(l), 'monthly', '0.8', landingAlt)),
    ...guideLangs.flatMap((l) => [
      e(guidesHubPath(l), 'weekly', '0.7', hubAlternates(absolute, hreflang)),
      ...guidesFor(l).map((g) => e(guidePath(g.slug, l), 'monthly', '0.8', guideAlternates(g.slug, absolute, hreflang), g.meta.updated)),
    ]),
    ...legal.map((p) => e(p, 'yearly', '0.3')),
  ];
}

const codes = new Set(languages.map((l) => l.code));
/** The language a URL path belongs to: its first segment if that is a language code, otherwise English. */
export const sitemapLangOf = (path: string) => {
  const first = path.split('/')[1];
  return first && first !== 'en' && codes.has(first) ? first : 'en';
};

/** Languages that have at least one URL, in the site's language order (English first). */
export const sitemapLangs = (): string[] => {
  const used = new Set(entries().map((x) => sitemapLangOf(x.path)));
  return languages.map((l) => l.code).filter((c) => used.has(c));
};

export const sitemapPath = (code: string) => `/sitemap-${code}.xml`;

export function generateLanguageSitemap(code: string): string {
  const urls = entries()
    .filter((x) => sitemapLangOf(x.path) === code)
    .map((x) => `<url><loc>${absolute(x.path)}</loc><lastmod>${x.lastmod}</lastmod><changefreq>${x.changefreq}</changefreq><priority>${x.priority}</priority>${
      x.alternates.map((a) => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`).join('')}</url>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset ${XMLNS} xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`;
}

export function generateSitemapIndexXml(): string {
  const items = sitemapLangs().map((c) => `<sitemap><loc>${absolute(sitemapPath(c))}</loc><lastmod>${lastmod}</lastmod></sitemap>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex ${XMLNS}>${items}</sitemapindex>`;
}
