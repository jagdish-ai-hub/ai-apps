// Native-language versions of the iPhone-to-Windows landing page: src/landings/<code>.json, at /<code>/iphone-to-windows-clipboard/.
// The English version is the tool page /iphone-to-windows-clipboard/ (src/pages/iphone-to-windows-clipboard.astro).
export interface Landing {
  title: string;
  description: string;
  h1: string;
  lead: string;
  eyebrow: string;
  steps: string[];
  sections: { h2: string; paras: string[] }[];
  faq: { q: string; a: string }[];
  relatedGuides: string[];
  shareText: string;
}
const files = import.meta.glob('../landings/*.json', { eager: true, import: 'default' }) as Record<string, Landing>;
export const landings: Record<string, Landing> = Object.fromEntries(Object.entries(files).map(([p, d]) => [p.split('/').pop()!.replace('.json', ''), d]));
export const landingLangs = Object.keys(landings);
export const LANDING_SLUG = 'iphone-to-windows-clipboard';
export const landingPath = (lang = 'en') => (lang === 'en' ? `/${LANDING_SLUG}/` : `/${lang}/${LANDING_SLUG}/`);

/** hreflang alternates shared by every language version of the landing page (English included), with x-default on English. */
export function landingAlternates(absolute: (p: string) => string, hreflangOf: (lang: string) => string) {
  const langs = ['en', ...landingLangs];
  return [...langs.map((l) => ({ hreflang: hreflangOf(l), href: absolute(landingPath(l)) })), { hreflang: 'x-default', href: absolute(landingPath('en')) }];
}
