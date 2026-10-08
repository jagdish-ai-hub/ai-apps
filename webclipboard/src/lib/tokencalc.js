// Pure helpers for the token calculator (no DOM, unit-tested with node --test).

export const CONTEXT_WINDOWS = [
  { label: '8K', size: 8_192 },
  { label: '32K', size: 32_768 },
  { label: '128K', size: 128_000 },
  { label: '200K', size: 200_000 },
  { label: '1M', size: 1_000_000 },
];

export const MAX_CHARS = 1_000_000;

/** Parse a user-typed number ("2.50", "2,5", " 10 "); returns NaN when empty or invalid. */
export function parseNumber(value) {
  if (typeof value === 'number') return value;
  const s = String(value ?? '').trim().replace(',', '.');
  if (s === '') return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/** Cost of `tokens` at `pricePerMillion` (price per 1,000,000 tokens). NaN when no price was given. */
export function cost(tokens, pricePerMillion) {
  const p = parseNumber(pricePerMillion);
  if (!Number.isFinite(p) || p < 0) return NaN;
  return (tokens / 1_000_000) * p;
}

/** Cost breakdown for one request and for `requests` requests. */
export function estimate({ inputTokens, outputTokens, inputPrice, outputPrice, requests = 1 }) {
  const out = Math.max(0, Math.floor(parseNumber(outputTokens)) || 0);
  const n = Math.max(1, Math.floor(parseNumber(requests)) || 1);
  const input = cost(inputTokens, inputPrice);
  const output = cost(out, outputPrice);
  const known = [input, output].filter(Number.isFinite);
  const perRequest = known.length ? known.reduce((a, b) => a + b, 0) : NaN;
  return { input, output, perRequest, total: Number.isFinite(perRequest) ? perRequest * n : NaN, requests: n, outputTokens: out };
}

/** Money formatting that keeps small amounts readable: 0.000375 stays 0.000375, 12.3456 becomes 12.35. */
export function formatMoney(value, symbol = '$') {
  if (!Number.isFinite(value)) return '–';
  const abs = Math.abs(value);
  let digits;
  if (abs === 0) digits = 2;
  else if (abs >= 1) digits = 2;
  else if (abs >= 0.01) digits = 4;
  else digits = Math.min(8, Math.max(4, 2 - Math.floor(Math.log10(abs)) + 1));
  return `${symbol}${value.toLocaleString('en-US', { minimumFractionDigits: Math.min(digits, 2), maximumFractionDigits: digits })}`;
}

export const countWords = (text) => (text.trim() === '' ? 0 : text.trim().split(/\s+/).length);

/** The common "4 characters per token" English rule of thumb. Inaccurate for CJK, other scripts and code. */
export const quickEstimate = (text) => (text.length === 0 ? 0 : Math.ceil([...text].length / 4));

/** Share of a context window used by `tokens` (can exceed 100). */
export const windowUse = (tokens, size) => (tokens / size) * 100;

/**
 * Turn token ids into displayable groups. A single token can be a fragment of a multi-byte character
 * (emoji, CJK), which decodes to U+FFFD on its own, so consecutive tokens are merged until the text is clean.
 * @param {number[]} ids
 * @param {(ids:number[])=>string} decode
 * @returns {{text:string, ids:number[]}[]}
 */
export function groupTokens(ids, decode) {
  const groups = [];
  let pending = [];
  for (const id of ids) {
    pending.push(id);
    const text = decode(pending);
    if (!text.includes('�') || pending.length >= 4) {
      groups.push({ text, ids: pending });
      pending = [];
    }
  }
  if (pending.length) groups.push({ text: decode(pending), ids: pending });
  return groups;
}
