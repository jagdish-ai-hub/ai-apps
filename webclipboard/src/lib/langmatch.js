// Browser-language detection. Deliberately self-contained and ES5-style: Base.astro inlines this function's source into
// the <head> of the English homepage (so the redirect runs before first paint) and src/scripts/langprefs.ts imports it.

/**
 * Pick a supported site language from the browser's preferred-language list (navigator.languages).
 * The first entry that is either English or a supported language wins, so a visitor who prefers English
 * and also lists Spanish second stays on English. Unsupported languages are skipped. Falls back to 'en'.
 * @param {string[]} tags  e.g. ['es-MX', 'en-US']
 * @param {string[]} codes site language codes, e.g. ['en', 'es', 'zh-cn', 'zh-tw', 'no', 'fil']
 * @returns {string}
 */
export function detectLanguage(tags, codes) {
  for (var i = 0; i < tags.length; i++) {
    var parts = String(tags[i]).toLowerCase().split('_').join('-').split('-');
    var p = parts[0];
    if (!p) continue;
    if (p === 'en') return 'en';
    var c = p;
    if (p === 'zh') {
      c = parts.indexOf('hant') > -1 || parts.indexOf('tw') > -1 || parts.indexOf('hk') > -1 || parts.indexOf('mo') > -1 ? 'zh-tw' : 'zh-cn';
    } else if (p === 'nb' || p === 'nn') {
      c = 'no';
    } else if (p === 'tl') {
      c = 'fil';
    }
    if (codes.indexOf(c) > -1) return c;
  }
  return 'en';
}
