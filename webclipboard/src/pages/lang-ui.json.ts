import { languages, messages, localePath } from '../lib/i18n';

// Small lookup used by the language banner, fetched only when a banner is shown: each language's name, home path
// and the three banner strings, so a suggestion can be written in the visitor's own language.
export function GET() {
  const out: Record<string, Record<string, string>> = {};
  for (const l of languages) {
    const m = messages(l.code);
    out[l.code] = { name: l.name, path: localePath(l.code), auto: m.langAuto, back: m.langBack, suggest: m.langSuggest, close: m.shareClose };
  }
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
