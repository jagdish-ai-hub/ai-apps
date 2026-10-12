export interface GuideMeta {
  title: string;
  description: string;
  h1: string;
  lead: string;
  category: string;
  updated: string;
  related: string[];
  faq: { q: string; a: string }[];
}
export interface Guide {
  slug: string;
  meta: GuideMeta;
  Content: any;
  headings: { depth: number; slug: string; text: string }[];
}

const load = (files: Record<string, any>): Guide[] =>
  Object.entries(files)
    .map(([path, mod]) => ({
      slug: path.split('/').pop()!.replace(/\.md$/, ''),
      meta: mod.frontmatter as GuideMeta,
      Content: mod.Content,
      headings: mod.getHeadings(),
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));

/** English guides, at /guides/<slug>/. */
export const guides: Guide[] = load(import.meta.glob('../guides/*.md', { eager: true }) as Record<string, any>);

/** Guides written natively in other languages, in src/guides/<code>/, at /<code>/guides/<slug>/. */
// import.meta.glob needs literal patterns, so each language with guides is listed here (and in guidelangs.js).
const native: Record<string, Guide[]> = {
  ja: load(import.meta.glob('../guides/ja/*.md', { eager: true }) as Record<string, any>),
  ko: load(import.meta.glob('../guides/ko/*.md', { eager: true }) as Record<string, any>),
  de: load(import.meta.glob('../guides/de/*.md', { eager: true }) as Record<string, any>),
  es: load(import.meta.glob('../guides/es/*.md', { eager: true }) as Record<string, any>),
  pt: load(import.meta.glob('../guides/pt/*.md', { eager: true }) as Record<string, any>),
};
export const nativeGuideLangs = Object.keys(native).filter((l) => native[l].length > 0);

export const guidesFor = (lang: string): Guide[] => (lang === 'en' ? guides : native[lang] ?? []);
export const guidePath = (slug: string, lang = 'en') => (lang === 'en' ? `/guides/${slug}/` : `/${lang}/guides/${slug}/`);
export const guidesHubPath = (lang = 'en') => (lang === 'en' ? '/guides/' : `/${lang}/guides/`);
export const findGuide = (slug: string, lang = 'en') => guidesFor(lang).find((g) => g.slug === slug);

/** Pages that exist in several languages share a slug. Returns hreflang alternates for a guide, or [] if it has no counterpart. */
export function guideAlternates(slug: string, absolute: (p: string) => string, hreflangOf: (lang: string) => string) {
  const langs = Object.keys(native).concat('en').filter((l) => findGuide(slug, l));
  if (langs.length < 2) return [];
  return [
    ...langs.map((l) => ({ hreflang: hreflangOf(l), href: absolute(guidePath(slug, l)) })),
    { hreflang: 'x-default', href: absolute(guidePath(slug, 'en')) },
  ];
}
