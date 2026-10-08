import { absolute } from '../lib/i18n';

export function GET() {
  const body = ['User-agent: *', 'Allow: /', 'Disallow: /api/', 'Disallow: /c/', '', `Sitemap: ${absolute('/sitemap.xml')}`, ''].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
