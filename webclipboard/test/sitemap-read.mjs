// Reads the built sitemap index and every language sitemap it lists, so tests can search all sitemap XML at once.
import { readFileSync } from 'node:fs';
import { sitemapPageUrls } from '../src/lib/indexnow.js';

const dist = new URL('../dist/', import.meta.url);
const file = (url) => readFileSync(new URL(new URL(url, 'https://x/').pathname.slice(1), dist), 'utf8');

/** All page URLs listed across the sitemap index's children. */
export const sitemapUrls = () => sitemapPageUrls(file('/sitemap.xml'), file);

/** The concatenated XML of every child sitemap (for `includes` checks on <loc> and hreflang links). */
export const sitemapXml = () => {
  const index = file('/sitemap.xml');
  return [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => file(m[1])).join('\n');
};
