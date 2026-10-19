import { languages, localePath, absolute } from './i18n';
import { guides, guidesFor, guidePath, guidesHubPath, guideAlternates } from './guides';
import { guideLangs } from './guidelangs.js';
import { tokenLangs } from './tokenlangs';
import { qrKinds, qrLangs, qrPath, qrAlternates } from './qrpages';
import { langByCode } from './i18n';
import { landingLangs, landingPath, landingAlternates } from './landings';
import { tools, toolPath } from './tools';

const lastmod = new Date().toISOString().slice(0, 10);
const legal = ['/about/', '/privacy/', '/terms/', '/contact/'];

/** All hreflang alternate links for a given URL, across every language that has it. */
const allAlternates = (pathForLang: (code: string) => string) => {
  const langs = languages.filter((l) => pathForLang(l.code));
  return [
    ...langs.map((l) => `<xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${absolute(pathForLang(l.code))}"/>`),
    `<xhtml:link rel="alternate" hreflang="x-default" href="${absolute(pathForLang('en'))}"/>`,
  ].join('');
};

/** Build a <url> entry string */
const urlEntry = (loc: string, lastmod: string, changefreq: string, priority: string, alternates = '') =>
  `<url><loc>${absolute(loc)}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority>${alternates}</url>`;

/**
 * Generate a sitemap for a single language.
 * For English (langCode === 'en'): includes home, guides, QR, landing, shared tools, and legal.
 * For other languages: includes only home, guides (if available for that lang), QR, landing (if available for that lang).
 * Shared tools and legal pages are only in the English sitemap to avoid duplication.
 */
export function generateLanguageSitemap(langCode: string): string {
  const lang = languages.find((l) => l.code === langCode)!;
  const isEnglish = langCode === 'en';

  const entries: string[] = [];

  // --- Home page (always included, with hreflang alternates) ---
  const homeAlternates = allAlternates((c) => localePath(c));
  entries.push(urlEntry(localePath(langCode), lastmod, 'weekly', isEnglish ? '1.0' : '0.9', homeAlternates));

  // --- Shared tool pages and legal pages (only in English sitemap) ---
  if (isEnglish) {
    // Tools: /tools/, /<tool-slug>/, /tokens-in/<slug>/
    const toolUrls = ['/tools/', ...tools.map((t) => toolPath(t.slug)), ...tokenLangs.map((l) => `/tokens-in/${l.slug}/`)];
    for (const p of toolUrls) {
      let alternates = '';
      if (p === '/iphone-to-windows-clipboard/') {
        alternates = landingLangs.length
          ? landingAlternates(absolute, (l) => langByCode(l).hreflang).map((a) => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`).join('')
          : '';
      } else {
        const kind = qrKinds.find((k) => qrPath(k, 'en') === p);
        if (kind) {
          alternates = qrAlternates(kind, absolute, (l) => langByCode(l).hreflang).map((a) => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`).join('');
        }
      }
      entries.push(urlEntry(p, lastmod, 'monthly', '0.9', alternates));
    }

    // Legal pages: /about/, /privacy/, /terms/, /contact/
    for (const p of legal) {
      entries.push(urlEntry(p, lastmod, 'yearly', '0.3', ''));
    }
  }

  // --- Guide pages for this language (if any) ---
  if (guideLangs.includes(langCode)) {
    entries.push(urlEntry(guidesHubPath(langCode), lastmod, 'weekly', '0.7', ''));
    for (const g of guidesFor(langCode)) {
      const alt = guideAlternates(g.slug, absolute, (l) => langByCode(l).hreflang).map((a) => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`).join('');
      entries.push(urlEntry(guidePath(g.slug, langCode), g.meta.updated, 'monthly', '0.8', alt));
    }
  }

  // --- QR code pages for this language ---
  for (const kind of qrKinds) {
    const path = qrPath(kind, langCode);
    const alternates = qrLangs.length
      ? qrAlternates(kind, absolute, (l) => langByCode(l).hreflang).map((a) => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`).join('')
      : `<xhtml:link rel="alternate" hreflang="${lang.hreflang}" href="${absolute(path)}"/>`;
    entries.push(urlEntry(path, lastmod, 'monthly', '0.8', alternates));
  }

  // --- Landing pages for this language (if any) ---
  if (landingLangs.includes(langCode)) {
    const landingAlt = landingAlternates(absolute, (l) => langByCode(l).hreflang).map((a) => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`).join('');
    entries.push(urlEntry(landingPath(langCode), lastmod, 'monthly', '0.8', landingAlt));
  }

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join('')}</urlset>`;
}

/**
 * Generate a sitemap index XML referencing all language-specific sitemaps.
 */
export function generateSitemapIndexXml(): string {
  const sitemaps = languages
    .map((lang) => `<sitemap><loc>${absolute('/')}sitemap-${lang.code}.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemaps}</sitemapindex>`;
}
