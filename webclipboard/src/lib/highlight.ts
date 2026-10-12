// Syntax highlighting with highlight.js (core plus the languages the code editor offers). Loaded on demand, only when code is shown.
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import java from 'highlight.js/lib/languages/java';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import php from 'highlight.js/lib/languages/php';
import ruby from 'highlight.js/lib/languages/ruby';
import kotlin from 'highlight.js/lib/languages/kotlin';
import swift from 'highlight.js/lib/languages/swift';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import { LANGUAGES, languageById } from './codeclip.js';

const registry: Record<string, any> = { javascript, typescript, python, xml, css, json, bash, sql, java, c, cpp, csharp, go, rust, php, ruby, kotlin, swift, yaml, markdown };
for (const [name, def] of Object.entries(registry)) hljs.registerLanguage(name, def);

export const MAX_HIGHLIGHT = 40_000; // longer texts are shown without colours so typing stays smooth

/** HTML with <span class="hljs-..."> wrappers. highlight.js escapes the code itself, so the result is safe to insert as HTML. */
export function highlight(code: string, lang: string): string {
  const l = languageById(lang);
  if (!l || code.length > MAX_HIGHLIGHT) return escapeHtml(code);
  try { return hljs.highlight(code, { language: l.hljs, ignoreIllegals: true }).value; } catch { return escapeHtml(code); }
}

/** Best guess among the offered languages, or null when nothing fits well. */
export function detect(code: string): string | null {
  const sample = code.slice(0, 4000);
  if (sample.trim().length < 12) return null;
  const r = hljs.highlightAuto(sample, LANGUAGES.map((l) => l.hljs));
  if (!r.language || (r.relevance ?? 0) < 4) return null;
  return LANGUAGES.find((l) => l.hljs === r.language)?.id ?? null;
}

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
