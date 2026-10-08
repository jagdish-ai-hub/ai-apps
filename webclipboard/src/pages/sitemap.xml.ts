import { languages, localePath, absolute } from '../lib/i18n';

const lastmod = new Date().toISOString().slice(0, 10);
const legal = ['/about/', '/privacy/', '/terms/', '/contact/'];

export function GET() {
  const alternates = [
    ...languages.map((l) => `<xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${absolute(localePath(l.code))}"/>`),
    `<xhtml:link rel="alternate" hreflang="x-default" href="${absolute('/')}"/>`,
  ].join('');
  const home = languages
    .map((l) => `<url><loc>${absolute(localePath(l.code))}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>${l.code === 'en' ? '1.0' : '0.9'}</priority>${alternates}</url>`)
    .join('');
  const pages = legal.map((p) => `<url><loc>${absolute(p)}</loc><lastmod>${lastmod}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${home}${pages}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
