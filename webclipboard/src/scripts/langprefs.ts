// Language preference banner. Two cases, both written in a language the visitor can read:
//   auto    - the English homepage sent them to their language on a first visit: offer a way back to English (written in English).
//   suggest - the page is in another language than the one they prefer (or an English-only page): offer to switch.
// Suggestions are written in the language being offered. A choice made here, in the language menu or in the footer is saved ("wc-lang") and wins over the browser setting.
import { detectLanguage } from '../lib/langmatch.js';

type Ui = Record<string, { name: string; path: string; auto: string; back: string; suggest: string; close: string }>;
const KEY = 'wc-lang';
const DISMISSED = 'wc-lang-dismissed';
const cfg: { current: string; codes: string[] } = JSON.parse(document.getElementById('lang-config')?.textContent || '{"current":"en","codes":[]}');

const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } };
const session = (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } };
const clearSession = (k: string) => { try { sessionStorage.removeItem(k); } catch { /* ignore */ } };

const saved = read(KEY);
const browser = detectLanguage(navigator.languages?.length ? [...navigator.languages] : [navigator.language || 'en'], cfg.codes);
const wanted = saved && cfg.codes.includes(saved) ? saved : browser;

let kind: 'auto' | 'suggest' | null = null;
let target = cfg.current;
const auto = (session('wc-auto') || '').split(':')[0];
if (auto && auto === cfg.current && cfg.current !== 'en') {
  kind = 'auto';
  target = 'en';
  clearSession('wc-auto');
} else if (wanted !== cfg.current && read(DISMISSED) !== wanted) {
  kind = 'suggest';
  target = wanted;
}

if (kind) {
  const shownKind = kind;
  const shownTarget = target;
  fetch('/lang-ui.json')
    .then((r) => (r.ok ? (r.json() as Promise<Ui>) : Promise.reject()))
    .then((ui) => {
      const banner = document.getElementById('lang-banner')!;
      const go = document.getElementById('lang-banner-go') as HTMLAnchorElement;
      const text = document.getElementById('lang-banner-text')!;
      const here = ui[cfg.current] || ui.en;
      const there = ui[shownTarget] || ui.en;
      if (shownKind === 'auto') {
        // This banner exists to offer English to people who did not want the automatic switch, so it is written in English.
        text.textContent = ui.en.auto;
        go.textContent = ui.en.back;
        banner.lang = 'en';
      } else {
        text.textContent = there.suggest;
        go.textContent = there.name;
        banner.lang = shownTarget === 'en' ? 'en' : shownTarget;
      }
      go.href = there.path;
      go.lang = shownKind === 'suggest' ? banner.lang : '';
      go.addEventListener('click', (e) => {
        e.preventDefault();
        write(KEY, shownTarget);
        location.href = there.path + location.hash;
      });
      (document.getElementById('lang-banner-close') as HTMLElement).setAttribute('aria-label', shownKind === 'auto' ? ui.en.close : here.close);
      document.getElementById('lang-banner-close')!.addEventListener('click', () => {
        if (shownKind === 'suggest') write(DISMISSED, shownTarget);
        banner.hidden = true;
      });
      banner.hidden = false;
    })
    .catch(() => { /* the banner is a nicety; the site works without it */ });
}
