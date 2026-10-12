// Split text into chunks of at most `size` tokens, packing whole paragraphs, sentences or lines and repeating a little of the
// end of each chunk at the start of the next (the overlap) so that meaning is not cut at a boundary. Pure; the tokenizer is injected.

const sentenceSplit = (text) => {
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    return [...new Intl.Segmenter(undefined, { granularity: 'sentence' }).segment(text)].map((s) => s.segment);
  }
  return text.match(/[^.!?。！？]+[.!?。！？]*\s*/gu) ?? [text];
};

/** Break text into the smallest units we are willing to keep whole. */
export function toUnits(text, splitOn) {
  const t = String(text).replace(/\r\n?/g, '\n');
  if (splitOn === 'line') return t.split(/(?<=\n)/).filter((u) => u.trim());
  if (splitOn === 'sentence') return t.split(/(?<=\n\n)/).flatMap((p) => sentenceSplit(p)).filter((u) => u.trim());
  return t.split(/(?<=\n\s*\n)/).filter((u) => u.trim()); // paragraph (default)
}

/**
 * @param {string} text
 * @param {{size:number, overlap:number, splitOn?:'paragraph'|'sentence'|'line', encode:(s:string)=>number[]}} o
 * @returns {{index:number, text:string, tokens:number, overlapTokens:number}[]}
 */
export function chunkText(text, { size, overlap = 0, splitOn = 'paragraph', encode }) {
  size = Math.max(1, Math.floor(size));
  overlap = Math.max(0, Math.min(Math.floor(overlap), size - 1));
  const count = (s) => encode(s).length;
  const cache = new Map();
  const tokensOf = (s) => (cache.has(s) ? cache.get(s) : (cache.set(s, count(s)), cache.get(s)));

  // A unit that alone is larger than a chunk is cut at the largest prefix that fits (a sentence, then characters).
  const fit = (unit) => {
    if (tokensOf(unit) <= size) return [unit];
    if (splitOn !== 'sentence') {
      const parts = sentenceSplit(unit);
      if (parts.length > 1) return parts.flatMap(fit);
    }
    const cps = [...unit];
    const out = [];
    let start = 0;
    while (start < cps.length) {
      let lo = 1;
      let hi = cps.length - start;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (tokensOf(cps.slice(start, start + mid).join('')) <= size) lo = mid;
        else hi = mid - 1;
      }
      out.push(cps.slice(start, start + lo).join(''));
      start += lo;
    }
    return out;
  };

  const units = toUnits(text, splitOn).flatMap(fit);
  const chunks = [];
  let current = [];
  let carried = 0; // tokens at the start of `current` that were repeated from the previous chunk
  let fresh = 0; // units added since the last chunk was emitted (the overlap alone never makes a chunk)

  const flush = () => {
    if (!current.length) return;
    const joined = current.join('');
    chunks.push({ index: chunks.length, text: joined.replace(/\s+$/, ''), tokens: count(joined.replace(/\s+$/, '')), overlapTokens: carried });
  };

  for (const unit of units) {
    const candidate = current.join('') + unit;
    if (current.length && count(candidate) > size) {
      flush();
      // Start the next chunk with whole units from the end of this one, up to `overlap` tokens.
      const tail = [];
      let tokens = 0;
      for (let i = current.length - 1; i >= 0 && overlap > 0; i--) {
        const t = tokensOf(current[i]);
        if (tokens + t > overlap) break;
        tail.unshift(current[i]);
        tokens += t;
      }
      // Never let the repeated part plus the next unit overflow the chunk.
      while (tail.length && count(tail.join('') + unit) > size) tail.shift();
      current = tail;
      carried = tail.length ? count(tail.join('')) : 0;
      fresh = 0;
    }
    current.push(unit);
    fresh++;
  }
  if (fresh > 0) flush();
  return chunks;
}

export const toJsonl = (chunks) => chunks.map((c) => JSON.stringify({ id: c.index, text: c.text, tokens: c.tokens })).join('\n') + (chunks.length ? '\n' : '');
export const toJson = (chunks, meta = {}) => JSON.stringify({ ...meta, chunks: chunks.map((c) => ({ id: c.index, text: c.text, tokens: c.tokens })) }, null, 2);
