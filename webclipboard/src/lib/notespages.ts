// The two notes tool pages (notepad, share a note) exist in English and in other languages. Content: src/notes/<code>.json (English is the source).
// The URL slug is part of the content, because it is written in each language (/online-notepad/, /pt/bloco-de-notas-online/).
export type NotesKind = 'notepad' | 'share';
export const notesKinds: NotesKind[] = ['notepad', 'share'];

export interface NotesPageContent {
  slug: string; title: string; description: string; h1: string; lead: string; eyebrow: string;
  steps: string[]; sections: { h2: string; paras: string[] }[]; faq: { q: string; a: string }[]; relatedGuides?: string[];
}
export interface NotesContent { ui: Record<string, any>; pages: Record<NotesKind, NotesPageContent> }

const files = import.meta.glob('../notes/*.json', { eager: true, import: 'default' }) as Record<string, NotesContent>;
export const notesContent: Record<string, NotesContent> = Object.fromEntries(Object.entries(files).map(([p, d]) => [p.split('/').pop()!.replace('.json', ''), d]));
export const notesLangs = Object.keys(notesContent).filter((l) => l !== 'en');

export const notesSlug = (kind: NotesKind, lang = 'en') => notesContent[lang].pages[kind].slug;
export const notesPath = (kind: NotesKind, lang = 'en') => (lang === 'en' ? `/${notesSlug(kind, 'en')}/` : `/${lang}/${notesSlug(kind, lang)}/`);
/** Which notes page a slug belongs to, in the given language. */
export const kindOfNotesSlug = (slug: string, lang = 'en'): NotesKind | undefined => (notesContent[lang] ? notesKinds.find((k) => notesSlug(k, lang) === slug) : undefined);

/** Reciprocal hreflang for one notes page across every language that has it (English is x-default). */
export function notesAlternates(kind: NotesKind, absolute: (p: string) => string, hreflangOf: (lang: string) => string) {
  const langs = ['en', ...notesLangs];
  if (langs.length < 2) return [];
  return [...langs.map((l) => ({ hreflang: hreflangOf(l), href: absolute(notesPath(kind, l)) })), { hreflang: 'x-default', href: absolute(notesPath(kind, 'en')) }];
}
