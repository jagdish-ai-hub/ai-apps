import { site } from '../lib/i18n';

export function GET() {
  const pub = site.adsense.client.replace(/^ca-/, '');
  const body = pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : '# No ad publisher configured yet. Set adsense.client in site.config.json.\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
