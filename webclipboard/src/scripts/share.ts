// Share this tool: native share sheet on phones, a language-aware menu on desktop.
// It only ever shares the page's canonical URL, never the current address (which may carry a clip code in #hash).

type Cfg = { lang: string; url: string; title: string; text: string; ui: Record<string, string> };
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const cfg: Cfg = JSON.parse($('share-config').textContent || '{}');

const touch = matchMedia('(pointer: coarse)').matches;
const canNative = typeof navigator.share === 'function' && touch;

type Net = { id: string; label: string; href: (url: string, text: string, title: string) => string; touchOnly?: boolean };
const enc = encodeURIComponent;
const NETS: Record<string, Net> = {
  whatsapp: { id: 'whatsapp', label: 'WhatsApp', href: (u, t) => `https://wa.me/?text=${enc(`${t} ${u}`)}` },
  telegram: { id: 'telegram', label: 'Telegram', href: (u, t) => `https://t.me/share/url?url=${enc(u)}&text=${enc(t)}` },
  facebook: { id: 'facebook', label: 'Facebook', href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${enc(u)}` },
  x: { id: 'x', label: 'X', href: (u, t) => `https://x.com/intent/tweet?text=${enc(t)}&url=${enc(u)}` },
  linkedin: { id: 'linkedin', label: 'LinkedIn', href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${enc(u)}` },
  reddit: { id: 'reddit', label: 'Reddit', href: (u, _t, title) => `https://www.reddit.com/submit?url=${enc(u)}&title=${enc(title)}` },
  line: { id: 'line', label: 'LINE', href: (u) => `https://social-plugins.line.me/lineit/share?url=${enc(u)}` },
  vk: { id: 'vk', label: 'VK', href: (u, _t, title) => `https://vk.com/share.php?url=${enc(u)}&title=${enc(title)}` },
  weibo: { id: 'weibo', label: 'Weibo', href: (u, t) => `https://service.weibo.com/share/share.php?url=${enc(u)}&title=${enc(t)}` },
  email: { id: 'email', label: cfg.ui.email, href: (u, t, title) => `mailto:?subject=${enc(title)}&body=${enc(`${t}\n\n${u}`)}` },
  sms: { id: 'sms', label: cfg.ui.sms, touchOnly: true, href: (u, t) => `sms:?&body=${enc(`${t} ${u}`)}` },
};

// Which networks lead depends on the visitor's language, because messaging habits differ by region.
const BASE = ['whatsapp', 'telegram', 'facebook', 'x', 'linkedin', 'reddit', 'email', 'sms'];
const ORDER: Record<string, string[]> = {
  ja: ['line', ...BASE],
  th: ['line', ...BASE],
  'zh-tw': ['line', ...BASE],
  id: ['whatsapp', 'line', 'telegram', 'facebook', 'x', 'linkedin', 'reddit', 'email', 'sms'],
  ru: ['telegram', 'vk', 'whatsapp', 'facebook', 'x', 'email', 'sms'],
  uk: ['telegram', 'whatsapp', 'facebook', 'x', 'linkedin', 'reddit', 'email', 'sms'],
  'zh-cn': ['weibo', 'email', 'sms'],
};
const order = (ORDER[cfg.lang] || BASE).filter((id) => touch || !NETS[id].touchOnly);

function tracked(medium: string): string {
  const u = new URL(cfg.url);
  u.searchParams.set('utm_source', 'share');
  u.searchParams.set('utm_medium', medium);
  return u.toString();
}

const dialog = $<HTMLDialogElement>('share-dialog');
const fab = $('share-fab');

function buildMenu() {
  const grid = $('share-grid');
  grid.replaceChildren(
    ...order.map((id) => {
      const n = NETS[id];
      const a = document.createElement('a');
      a.className = 'share-tile';
      a.textContent = n.label;
      a.href = n.href(tracked(id), cfg.text, cfg.title);
      a.dataset.net = id;
      if (!n.href('', '', '').startsWith('mailto:') && !n.href('', '', '').startsWith('sms:')) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
      a.addEventListener('click', () => setTimeout(() => dialog.close(), 150));
      return a;
    }),
  );
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
