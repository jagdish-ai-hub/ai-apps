import languages from '../src/i18n/languages.json' with { type: 'json' };

const CODES = new Set(languages.map((l) => l.code));

/** URL path prefix for a language: English lives at the site root. */
export function langPath(code) {
  return code === 'en' ? '/' : `/${code}/`;
}

/** Map one BCP-47 tag (e.g. "pt-BR", "zh-Hant-HK", "nb") to a supported site language, or null. */
export function matchTag(tag) {
  const t = tag.trim().toLowerCase();
  if (!t) return null;
  const [primary, ...rest] = t.split('-');
  if (primary === 'zh') {
    const traditional = rest.some((p) => ['hant', 'tw', 'hk', 'mo'].includes(p));
    return traditional ? 'zh-tw' : 'zh-cn';
  }
  if (primary === 'nb' || primary === 'nn') return 'no';
  if (primary === 'tl') return 'fil';
  return CODES.has(primary) ? primary : null;
}

/** Pick the best supported language from an Accept-Language header (falls back to English). */
export function negotiate(acceptLanguage) {
  if (!acceptLanguage) return 'en';
  const ranked = acceptLanguage
    .split(',')
    .map((part, i) => {
      const [tag, ...params] = part.split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      return { tag, q: q ? Number(q.slice(2)) || 0 : 1, i };
    })
    .filter((x) => x.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  for (const { tag } of ranked) {
    const code = matchTag(tag);
    if (code) return code;
  }
  return 'en';
}
