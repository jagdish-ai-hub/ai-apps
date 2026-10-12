// Case conversion helpers. Pure functions, unit-tested with node --test.

const SMALL = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'so', 'yet', 'as', 'at', 'by', 'in', 'of', 'off', 'on', 'per', 'to', 'up', 'via', 'vs', 'from', 'into', 'over', 'with']);

export const upper = (s) => s.toLocaleUpperCase();
export const lower = (s) => s.toLocaleLowerCase();

/** First letter of each word upper-case, rest lower-case. */
export const capitalizeWords = (s) => s.toLocaleLowerCase().replace(/(^|[\s\-\u2013\u2014/(])(["'\u201c\u2018]?)(\p{L})/gu, (_, pre, quote, ch) => pre + quote + ch.toLocaleUpperCase());

/** Title case in the English style: small words stay lower-case unless they are first or last. */
export function titleCase(s) {
  const words = s.toLocaleLowerCase().split(/(\s+)/);
  const idx = words.map((w, i) => (/\S/.test(w) ? i : -1)).filter((i) => i >= 0);
  const first = idx[0];
  const last = idx[idx.length - 1];
  return words
    .map((w, i) => {
      if (!/\S/.test(w)) return w;
      const bare = w.replace(/[^\p{L}\p{N}']/gu, '');
      if (i !== first && i !== last && SMALL.has(bare)) return w;
      return w.replace(/\p{L}/u, (ch) => ch.toLocaleUpperCase());
    })
    .join('');
}

/** Sentence case: first letter of each sentence upper-case, the rest lower-case. */
export function sentenceCase(s) {
  let out = s.toLocaleLowerCase();
  out = out.replace(/(^\s*|[.!?。！？]\s+|\n\s*)(\p{L})/gu, (_, pre, ch) => pre + ch.toLocaleUpperCase());
  return out.replace(/\bi\b(?=[\s'.,!?]|$)/g, 'I');
}

/** Upper-case where it was lower-case and the other way round. */
export const invertCase = (s) => [...s].map((c) => (c === c.toLocaleLowerCase() ? c.toLocaleUpperCase() : c.toLocaleLowerCase())).join('');

/** aLtErNaTiNg: letters alternate, counting letters only. */
export function alternatingCase(s) {
  let i = 0;
  return [...s].map((c) => (/\p{L}/u.test(c) ? (i++ % 2 === 0 ? c.toLocaleLowerCase() : c.toLocaleUpperCase()) : c)).join('');
}

/** Split an identifier or phrase into words: handles spaces, - _ . / and camelCase boundaries. */
export function splitWords(s) {
  return s
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/** Apply a word-based style to each line separately, so multi-line lists convert line by line. */
const perLine = (s, f) => s.split('\n').map((line) => f(splitWords(line))).join('\n');
const cap = (w) => w.charAt(0).toLocaleUpperCase() + w.slice(1).toLocaleLowerCase();

export const camelCase = (s) => perLine(s, (ws) => ws.map((w, i) => (i === 0 ? w.toLocaleLowerCase() : cap(w))).join(''));
export const pascalCase = (s) => perLine(s, (ws) => ws.map(cap).join(''));
export const snakeCase = (s) => perLine(s, (ws) => ws.map((w) => w.toLocaleLowerCase()).join('_'));
export const kebabCase = (s) => perLine(s, (ws) => ws.map((w) => w.toLocaleLowerCase()).join('-'));
export const constantCase = (s) => perLine(s, (ws) => ws.map((w) => w.toLocaleUpperCase()).join('_'));

export const MODES = [
  { id: 'upper', label: 'UPPER CASE', fn: upper },
  { id: 'lower', label: 'lower case', fn: lower },
  { id: 'sentence', label: 'Sentence case', fn: sentenceCase },
  { id: 'capitalize', label: 'Capitalize Each Word', fn: capitalizeWords },
  { id: 'title', label: 'Title Case', fn: titleCase },
  { id: 'camel', label: 'camelCase', fn: camelCase },
  { id: 'pascal', label: 'PascalCase', fn: pascalCase },
  { id: 'snake', label: 'snake_case', fn: snakeCase },
  { id: 'kebab', label: 'kebab-case', fn: kebabCase },
  { id: 'constant', label: 'CONSTANT_CASE', fn: constantCase },
  { id: 'alternating', label: 'aLtErNaTiNg', fn: alternatingCase },
  { id: 'inverse', label: 'iNVERSE', fn: invertCase },
];
