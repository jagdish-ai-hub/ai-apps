// Small helpers shared by the tool pages (no framework, no dependencies).
export const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

export async function copyText(text: string, btn?: HTMLElement) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  if (btn) {
    const old = btn.textContent;
    btn.textContent = 'Copied';
    setTimeout(() => (btn.textContent = old), 1400);
  }
}

/** Wire the Paste / Example / Clear buttons that every tool page has. */
export function wireInput(prefix: string, area: HTMLTextAreaElement, sample: string, onChange: () => void) {
  $(`${prefix}-sample`)?.addEventListener('click', () => { area.value = sample; onChange(); area.focus(); });
  $(`${prefix}-clear`)?.addEventListener('click', () => { area.value = ''; onChange(); area.focus(); });
  $(`${prefix}-paste`)?.addEventListener('click', async () => {
    try { area.value = await navigator.clipboard.readText(); onChange(); }
    catch { alert('Your browser did not allow reading the clipboard. Paste with Ctrl+V (or long-press and Paste) instead.'); }
  });
  area.addEventListener('input', onChange);
}

export type Encoder = { encode: (t: string, o?: object) => number[]; decode: (ids: number[]) => string };
const loaders: Record<string, () => Promise<Encoder>> = {
  o200k_base: () => import('gpt-tokenizer/encoding/o200k_base') as unknown as Promise<Encoder>,
  cl100k_base: () => import('gpt-tokenizer/encoding/cl100k_base') as unknown as Promise<Encoder>,
};
const cache: Record<string, Promise<Encoder>> = {};
/** The OpenAI vocabularies are large, so they are only downloaded when a tool needs them. */
export const getEncoder = (name: string) => (cache[name] ||= loaders[name]());
export const PLAIN = { disallowedSpecial: new Set<string>() }; // treat "<|endoftext|>" as ordinary text
