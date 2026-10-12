// The three QR code tool pages exist in English and in other languages. Content: src/qr/<code>.json (English is the source).
export type QrKind = 'text' | 'url' | 'wifi';
export const QR_KINDS: Record<QrKind, string> = { text: 'qr-code-generator', url: 'url-to-qr-code', wifi: 'wifi-qr-code-generator' };
export const qrKinds = Object.keys(QR_KINDS) as QrKind[];

export interface QrPageContent {
  title: string; description: string; h1: string; lead: string; eyebrow: string;
  steps: string[]; sections: { h2: string; paras: string[] }[]; faq: { q: string; a: string }[]; relatedGuides?: string[];
}
export interface QrContent { ui: Record<string, any>; pages: Record<QrKind, QrPageContent> }

const files = import.meta.glob('../qr/*.json', { eager: true, import: 'default' }) as Record<string, QrContent>;
export const qrContent: Record<string, QrContent> = Object.fromEntries(Object.entries(files).map(([p, d]) => [p.split('/').pop()!.replace('.json', ''), d]));
export const qrLangs = Object.keys(qrContent).filter((l) => l !== 'en');

export const qrPath = (kind: QrKind, lang = 'en') => (lang === 'en' ? `/${QR_KINDS[kind]}/` : `/${lang}/${QR_KINDS[kind]}/`);
export const kindOfSlug = (slug: string): QrKind | undefined => qrKinds.find((k) => QR_KINDS[k] === slug);

/** Reciprocal hreflang for one QR page across every language that has it (English is x-default). */
export function qrAlternates(kind: QrKind, absolute: (p: string) => string, hreflangOf: (lang: string) => string) {
  const langs = ['en', ...qrLangs];
  if (langs.length < 2) return [];
  return [...langs.map((l) => ({ hreflang: hreflangOf(l), href: absolute(qrPath(kind, l)) })), { hreflang: 'x-default', href: absolute(qrPath(kind, 'en')) }];
}
