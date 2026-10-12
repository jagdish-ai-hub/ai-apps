// Counting words, characters, sentences and reading time. Works for languages without spaces (Japanese, Chinese, Thai) too.
// Pure functions, unit-tested with node --test.

const CJK = /[぀-ヿ㐀-䶿一-鿿豈-﫿ｦ-ﾟ가-힯]/u; // kana, Han, half-width kana, Hangul

/** Words, using the browser's word segmenter when it has one (it knows where Japanese or Thai words end), else a Unicode regex. */
export function wordList(text) {
  const t = String(text ?? '');
  if (!t.trim()) return [];
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    const seg = new Intl.Segmenter(undefined, { granularity: 'word' });
    const out = [];
    for (const s of seg.segment(t)) if (s.isWordLike) out.push(s.segment);
    return out;
  }
  return t.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? [];
}

/** Characters as people count them: code points, so an emoji or a rare Han character counts once. */
export const countChars = (text) => [...String(text ?? '')].length;

export const countParagraphs = (text) => String(text ?? '').split(/\n\s*\n/).filter((p) => p.trim()).length;

export function countSentences(text) {
  const t = String(text ?? '').trim();
  if (!t) return 0;
  const parts = t.split(/(?<=[.!?。！？…])\s+|(?<=[。！？])/u).filter((p) => /[\p{L}\p{N}]/u.test(p));
  return parts.length;
}

/** Reading and speaking time in minutes. Space-separated languages use words per minute; CJK text uses characters per minute. */
export const READING_WPM = 238; // typical silent reading speed for adults reading non-fiction
export const READING_CJK_CPM = 500;
export const SPEAKING_WPM = 150;
export const SPEAKING_CJK_CPM = 300;

export function analyze(text) {
  const t = String(text ?? '');
  const chars = countChars(t);
  const charsNoSpaces = [...t].filter((c) => !/\s/u.test(c)).length;
  const words = wordList(t);
  const cjkChars = [...t].filter((c) => CJK.test(c)).length;
  // Words made of CJK characters are counted by the segmenter, but reading time for them is better estimated from characters.
  const latinWords = words.filter((w) => !CJK.test(w)).length;
  const minutes = (wpm, cpm) => latinWords / wpm + cjkChars / cpm;
  return {
    chars,
    charsNoSpaces,
    words: words.length,
    sentences: countSentences(t),
    paragraphs: countParagraphs(t),
    lines: t === '' ? 0 : t.split(/\r\n|\r|\n/).length,
    bytes: new TextEncoder().encode(t).length,
    cjkChars,
    readingMinutes: minutes(READING_WPM, READING_CJK_CPM),
    speakingMinutes: minutes(SPEAKING_WPM, SPEAKING_CJK_CPM),
  };
}

/** "1 min 30 s", "45 s", "under 1 s" */
export function formatDuration(minutes) {
  const s = Math.round(minutes * 60);
  if (s <= 0) return '0 s';
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m} min ${r} s` : `${m} min`;
}

/** Most frequent words (case-insensitive), ignoring one- and two-letter words and numbers. */
export function topWords(text, limit = 10) {
  const counts = new Map();
  for (const w of wordList(text)) {
    const k = w.toLocaleLowerCase();
    if ([...k].length < 3 || /^\p{N}+$/u.test(k)) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([word, count]) => ({ word, count }));
}
