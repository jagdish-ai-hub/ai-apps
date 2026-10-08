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

const files = import.meta.glob('../guides/*.md', { eager: true }) as Record<string, any>;

export const guides: Guide[] = Object.entries(files)
  .map(([path, mod]) => ({
    slug: path.split('/').pop()!.replace(/\.md$/, ''),
    meta: mod.frontmatter as GuideMeta,
    Content: mod.Content,
    headings: mod.getHeadings(),
  }))
  .sort((a, b) => a.slug.localeCompare(b.slug));

export const guidePath = (slug: string) => `/guides/${slug}/`;
export const findGuide = (slug: string) => guides.find((g) => g.slug === slug);
