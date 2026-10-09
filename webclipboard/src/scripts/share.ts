// Share this tool: native share sheet on phones, a language-aware menu with icons on desktop.
// It only ever shares the page's canonical URL, never the current address (which may carry a clip code in #hash).
import { networks, orderFor, opensExternally } from '../lib/sharenets.js';
import { iconSvg } from '../lib/shareicons.js';

type Cfg = { lang: string; url: string; title: string; text: string; ui: Record<string, string> };
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const cfg: Cfg = JSON.parse($('share-config').textContent || '{}');

const touch = matchMedia('(pointer: coarse)').matches;
const hasNative = typeof navigator.share === 'function';
const canNative = hasNative && touch; // phones go straight to the system sheet
const NETS = networks({ email: cfg.ui.email, sms: cfg.ui.sms });

function tracked(medium: string): string {
  const u = new URL(cfg.url);
  u.searchParams.set('utm_source', 'share');
  u.searchParams.set('utm_medium', medium);
  return u.toString();
}

const dialog = $<HTMLDialogElement>('share-dialog');
const fab = $('share-fab');

function tile(label: string, icon: string): HTMLElement {
  const el = document.createElement('span');
  el.className = 'tile-inner';
  el.innerHTML = iconSvg(icon); // static, trusted markup from shareicons.js
  const text = document.createElement('span');
  text.textContent = label;
  el.appendChild(text);
  return el;
}

function buildMenu() {
  const items: HTMLElement[] = orderFor(cfg.lang, touch).map((id) => {
    const n = NETS[id];
    const a = document.createElement('a');
    a.className = 'share-tile';
    a.dataset.net = id;
    a.href = n.href(tracked(id), cfg.text, cfg.title);
    if (opensExternally(n)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    a.appendChild(tile(n.label, id));
    a.addEventListener('click', () => setTimeout(() => dialog.close(), 150));
    return a;
  });
  // Desktop browsers that expose the system share sheet (AirDrop, Nearby Share, installed apps) get a "More" tile.
  if (hasNative && !touch) {
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'share-tile';
    more.dataset.net = 'more';
    more.appendChild(tile(cfg.ui.more, 'more'));
    more.addEventListener('click', async () => {
      try { await navigator.share({ title: cfg.title, text: cfg.text, url: tracked('native') }); dialog.close(); } catch { /* cancelled */ }
    });
    items.push(more);
  }
  $('share-grid').replaceChildren(...items);
  $<HTMLInputElement>('share-link').value = cfg.url;
}

async function openShare() {
  if (canNative) {
    try {
      await navigator.share({ title: cfg.title, text: cfg.text, url: tracked('native') });
      return;
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return; // user closed the sheet
      // anything else: fall through to the menu
    }
  }
  buildMenu();
  if (!dialog.open) dialog.showModal();
}

document.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('[data-share-open]')) void openShare();
});
$('share-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); }); // click on backdrop
$('share-copy').addEventListener('click', async (e) => {
  const btn = e.currentTarget as HTMLElement;
  try { await navigator.clipboard.writeText(tracked('copy')); } catch { $<HTMLInputElement>('share-link').select(); document.execCommand('copy'); }
  btn.textContent = cfg.ui.copied;
  setTimeout(() => (btn.textContent = cfg.ui.copy), 1600);
});

// Fade the floating button out while the footer is on screen so it never covers footer links.
const footer = document.querySelector('.site-footer');
if (footer && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => fab.classList.toggle('hide', entry.isIntersecting)).observe(footer);
}
