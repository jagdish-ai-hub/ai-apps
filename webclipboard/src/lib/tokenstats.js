// Build-time token statistics across the site's own translated copy. Pure functions (no I/O), unit-tested.

const PLAIN = { disallowedSpecial: new Set() };

/** The text measured for a language: tagline + both "about" paragraphs + the four how-to steps. */
export const corpusFor = (m) => [m.tagline, ...m.aboutText, ...m.steps].join('\n\n');

/**
 * @param {{languages: {code:string,name:string,englishName:string,script:string,htmlLang:string}[],
 *          messagesByCode: Record<string, any>,
 *          encoders: {o200k:{encode:Function}, cl100k:{encode:Function}}}} input
 */
export function computeRows({ languages, messagesByCode, encoders }) {
  const rows = languages.map((l) => {
    const text = corpusFor(messagesByCode[l.code]);
    const chars = [...text].length;
    const o200k = encoders.o200k.encode(text, PLAIN).length;
    const cl100k = encoders.cl100k.encode(text, PLAIN).length;
    return { code: l.code, name: l.name, englishName: l.englishName, script: l.script, htmlLang: l.htmlLang, text, chars, o200k, cl100k };
  });
  const en = rows.find((r) => r.code === 'en');
  if (!en) throw new Error('English baseline row is missing');
  return rows.map((r) => ({
    ...r,
    charsPerTokenO: r.chars / r.o200k,
    charsPerTokenC: r.chars / r.cl100k,
    ratioO: r.o200k / en.o200k,
    ratioC: r.cl100k / en.cl100k,
    saving: 1 - r.o200k / r.cl100k, // share of tokens saved by o200k_base compared with cl100k_base
  }));
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Headline figures, computed so the prose on the page can never drift from the data. */
export function summarize(rows) {
  const others = rows.filter((r) => r.code !== 'en');
  const by = (key, dir = 1) => [...others].sort((a, b) => dir * (a[key] - b[key]))[0];
  const totalO = others.reduce((n, r) => n + r.o200k, 0);
  const totalC = others.reduce((n, r) => n + r.cl100k, 0);
  return {
    count: rows.length,
    maxO: by('ratioO', -1),
    maxC: by('ratioC', -1),
    minO: by('ratioO', 1),
    minC: by('ratioC', 1),
    biggestSaving: by('saving', -1),
    smallestSaving: by('saving', 1),
    medianRatioO: median(others.map((r) => r.ratioO)),
    medianRatioC: median(others.map((r) => r.ratioC)),
    overallSaving: 1 - totalO / totalC,
    withinQuarterO: others.filter((r) => r.ratioO <= 1.25).length,
    withinQuarterC: others.filter((r) => r.ratioC <= 1.25).length,
    others: others.length,
  };
}

const csvCell = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replaceAll('"', '""')}"` : String(v));

export const CSV_COLUMNS = [
  ['code', (r) => r.code],
  ['language', (r) => r.englishName],
  ['native_name', (r) => r.name],
  ['script', (r) => r.script],
  ['characters', (r) => r.chars],
  ['tokens_o200k_base', (r) => r.o200k],
  ['tokens_cl100k_base', (r) => r.cl100k],
  ['chars_per_token_o200k_base', (r) => r.charsPerTokenO.toFixed(2)],
  ['chars_per_token_cl100k_base', (r) => r.charsPerTokenC.toFixed(2)],
  ['ratio_vs_english_o200k_base', (r) => r.ratioO.toFixed(2)],
  ['ratio_vs_english_cl100k_base', (r) => r.ratioC.toFixed(2)],
];

export function toCsv(rows) {
  return [CSV_COLUMNS.map(([h]) => h).join(','), ...rows.map((r) => CSV_COLUMNS.map(([, f]) => csvCell(f(r))).join(','))].join('\n') + '\n';
}

export function toJson(rows, meta) {
  return JSON.stringify(
    {
      ...meta,
      languages: rows.map((r) => Object.fromEntries(CSV_COLUMNS.map(([h, f]) => [h, Number.isNaN(Number(f(r))) ? f(r) : Number(f(r))]))),
    },
    null,
    2,
  );
}

export const fmtRatio = (x) => `${x.toFixed(2)}×`;
export const fmtPct = (x) => `${(x * 100).toFixed(0)}%`;
