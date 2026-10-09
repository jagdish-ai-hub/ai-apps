import * as o200k from 'gpt-tokenizer/encoding/o200k_base';
import * as cl100k from 'gpt-tokenizer/encoding/cl100k_base';
import { modelToEncodingMap } from 'gpt-tokenizer/mapping';
import pkg from 'gpt-tokenizer/package.json';
import allLanguages from '../i18n/languages.json';
import { computeRows, summarize } from './tokenstats.js';

const files = import.meta.glob('../i18n/*.json', { eager: true, import: 'default' }) as Record<string, any>;
const messagesByCode: Record<string, any> = {};
for (const [path, data] of Object.entries(files)) {
  const code = path.split('/').pop()!.replace('.json', '');
  if (code !== 'languages') messagesByCode[code] = data;
}

export const rows = computeRows({
  languages: allLanguages.filter((l) => messagesByCode[l.code]) as any,
  messagesByCode,
  encoders: { o200k, cl100k },
});
export const summary = summarize(rows);
export const libVersion: string = (pkg as any).version;
export const measuredOn = new Date().toISOString().slice(0, 10);
export const englishRow = rows.find((r) => r.code === 'en')!;

/** Model names the library maps to an encoding explicitly (models not listed use o200k_base by default). */
export const modelsFor = (encoding: string) => Object.entries(modelToEncodingMap).filter(([, e]) => e === encoding).map(([m]) => m);

export const encoders = { o200k_base: o200k, cl100k_base: cl100k } as const;
