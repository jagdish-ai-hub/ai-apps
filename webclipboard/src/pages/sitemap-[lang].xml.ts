import type { APIContext } from 'astro';
import { generateLanguageSitemap, sitemapLangs } from '../lib/sitemap-utils';

export function GET({ params }: APIContext) {
  return new Response(generateLanguageSitemap(params.lang!), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

export function getStaticPaths() {
  return sitemapLangs().map((lang) => ({ params: { lang } }));
}
