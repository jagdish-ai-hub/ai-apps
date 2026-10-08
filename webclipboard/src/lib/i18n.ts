import allLanguages from '../i18n/languages.json';
import site from '../../site.config.json';

export type Lang = (typeof allLanguages)[number];
export type Messages = Record<string, any>;

const files = import.meta.glob('../i18n/*.json', { eager: true, import: 'default' }) as Record<string, Messages>;
const byCode: Record<string, Messages> = {};
for (const [path, data] of Object.entries(files)) {
  const code = path.split('/').pop()!.replace('.json', '');
  if (code !== 'languages') byCode[code] = data;
}

// Only languages that have a translation file are built, linked, and listed in the sitemap/hreflang,
// so an untranslated language can never publish English text under its own URL.
const languages = allLanguages.filter((l) => byCode[l.code]);

export { languages, site };

/** Messages for a language; any missing key falls back to English so a half-translated language still builds. */
export function messages(code: string): Messages {
  return { ...byCode.en, ...(byCode[code] ?? {}) };
}

export const fill = (s: string) => s.replaceAll('{max}', site.maxChars.toLocaleString('en-US'));

/** Path of a page in a language: English is at the root, others under /<code>/. */
export function localePath(code: string, page = '/'): string {
  return code === 'en' ? page : `/${code}${page}`;
}

export const absolute = (path: string) => `https://${site.domain}${path}`;

export function langByCode(code: string): Lang {
  return allLanguages.find((l) => l.code === code) ?? allLanguages[0];
}
