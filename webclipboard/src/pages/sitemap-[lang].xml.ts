import { languages } from '../lib/i18n';
import { generateLanguageSitemap } from '../lib/sitemap-utils';

export function GET(context) {
  const lang = context.params.lang;
  const sitemapXml = generateLanguageSitemap(lang);
  return new Response(sitemapXml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
}

export function getStaticPaths() {
  return languages.map((lang) => ({ params: { lang: lang.code } }));
}