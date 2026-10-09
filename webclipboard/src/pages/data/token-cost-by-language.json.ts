import { rows, libVersion, measuredOn } from '../../lib/langdata';
import { toJson } from '../../lib/tokenstats.js';
import { absolute } from '../../lib/i18n';

export function GET() {
  const body = toJson(rows, {
    title: 'Token cost by language',
    source: absolute('/token-cost-by-language/'),
    measured_on: measuredOn,
    tokenizers: ['o200k_base', 'cl100k_base'],
    tokenizer_library: `gpt-tokenizer ${libVersion}`,
    sample: 'WebClipboard homepage copy: tagline, two about paragraphs and four how-to steps, in each language',
    note: 'ratio_vs_english is tokens for that language divided by tokens for the English version of the same copy, per tokenizer. Translations were written by the site, not by professional translators.',
  });
  return new Response(body + '\n', { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
