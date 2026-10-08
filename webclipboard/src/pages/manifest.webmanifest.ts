import { site } from '../lib/i18n';

export function GET() {
  const manifest = {
    name: `${site.siteName} – Online Clipboard`,
    short_name: site.siteName,
    description: 'Copy text on one device and paste it on another.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#030604',
    theme_color: '#030604',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
  return new Response(JSON.stringify(manifest), { headers: { 'Content-Type': 'application/manifest+json' } });
}
