import { generateSitemapIndexXml } from '../lib/sitemap-utils';

export function GET() {
  const xml = generateSitemapIndexXml();
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}