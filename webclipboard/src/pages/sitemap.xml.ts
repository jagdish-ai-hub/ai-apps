import { languages, localePath, absolute } from '../lib/i18n';
import { guides, guidesFor, guidePath, guidesHubPath, guideAlternates } from '../lib/guides';
import { guideLangs } from '../lib/guidelangs.js';
import { tokenLangs } from '../lib/tokenlangs';
import { qrKinds, qrLangs, qrPath, qrAlternates } from '../lib/qrpages';
import { langByCode } from '../lib/i18n';
import { landingLangs, landingPath, landingAlternates, LANDING_SLUG } from '../lib/landings';
import { tools, toolPath } from '../lib/tools';

const lastmod = new Date().toISOString().slice(0, 10);
const legal = ['/about/', '/privacy/', '/terms/', '/contact/'];
const toolUrls = ['/tools/', ...tools.map((t) => toolPath(t.slug)), ...tokenLangs.map((l) => `/tokens-in/${l.slug}/`)];

export function GET() {
  const alternates = [
    ...languages.map((l) => `<xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${absolute(localePath(l.code))}"/>`),
    `<xhtml:link rel="alternate" hreflang="x-default" href="${absolute('/')}"/>`,
  ].join('');
  const home = languages
    .map((l) => `<url><loc>${absolute(localePath(l.code))}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>${l.code === 'en' ? '1.0' : '0.9'}</priority>${alternates}</url>`)
    .join('');
  const alt = (slug: string) => guideAlternates(slug, absolute, (l) => langByCode(l).hreflang).map((a) => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`).join('');
  const guidePages = guideLangs.map((l) => [
    `<url><loc>${absolute(guidesHubPath(l))}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
    ...guidesFor(l).map((g) => `<url><loc>${absolute(guidePath(g.slug, l))}</loc><lastmod>${g.meta.updated}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority>${alt(g.slug)}</url>`),
  ].join('')).join('');
  const landingAlt = landingLangs.length ? landingAlternates(absolute, (l) => langByCode(l).hreflang).map((a) => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`).join('') : '';
  const qrAlt = (kind: (typeof qrKinds)[number]) => (qrLangs.length ? qrAlternates(kind, absolute, (l) => langByCode(l).hreflang).map((a) => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`).join('') : '');
  const qrEnAlt = new Map(qrKinds.map((k) => [qrPath(k, 'en'), qrAlt(k)]));
  const qrNative = qrKinds.flatMap((k) => qrLangs.map((l) => `<url><loc>${absolute(qrPath(k, l))}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority>${qrAlt(k)}</url>`)).join('');
  const toolPages = toolUrls.map((p) => `<url><loc>${absolute(p)}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.9</priority>${p === landingPath('en') ? landingAlt : qrEnAlt.get(p) ?? ''}</url>`).join('')
    + qrNative
    + landingLangs.map((l) => `<url><loc>${absolute(landingPath(l))}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority>${landingAlt}</url>`).join('');
  const pages = legal.map((p) => `<url><loc>${absolute(p)}</loc><lastmod>${lastmod}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${home}${toolPages}${guidePages}${pages}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
