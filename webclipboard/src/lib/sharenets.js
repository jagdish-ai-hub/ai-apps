// Share destinations, ordering and link building. Pure functions, unit-tested; the browser script only renders them.

const enc = encodeURIComponent;

/** @param {{email:string, sms:string}} labels localised labels for the two generic channels */
export function networks(labels) {
  return {
    whatsapp: { id: 'whatsapp', label: 'WhatsApp', href: (u, t) => `https://wa.me/?text=${enc(`${t} ${u}`)}` },
    telegram: { id: 'telegram', label: 'Telegram', href: (u, t) => `https://t.me/share/url?url=${enc(u)}&text=${enc(t)}` },
    facebook: { id: 'facebook', label: 'Facebook', href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${enc(u)}` },
    x: { id: 'x', label: 'X', href: (u, t) => `https://x.com/intent/tweet?text=${enc(t)}&url=${enc(u)}` },
    linkedin: { id: 'linkedin', label: 'LinkedIn', href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${enc(u)}` },
    reddit: { id: 'reddit', label: 'Reddit', href: (u, _t, title) => `https://www.reddit.com/submit?url=${enc(u)}&title=${enc(title)}` },
    line: { id: 'line', label: 'LINE', href: (u) => `https://social-plugins.line.me/lineit/share?url=${enc(u)}` },
    vk: { id: 'vk', label: 'VK', href: (u, _t, title) => `https://vk.com/share.php?url=${enc(u)}&title=${enc(title)}` },
    weibo: { id: 'weibo', label: 'Weibo', href: (u, t) => `https://service.weibo.com/share/share.php?url=${enc(u)}&title=${enc(t)}` },
    email: { id: 'email', label: labels.email, scheme: 'mailto', href: (u, t, title) => `mailto:?subject=${enc(title)}&body=${enc(`${t}\n\n${u}`)}` },
    sms: { id: 'sms', label: labels.sms, scheme: 'sms', touchOnly: true, href: (u, t) => `sms:?&body=${enc(`${t} ${u}`)}` },
  };
}

const BASE = ['whatsapp', 'telegram', 'facebook', 'x', 'linkedin', 'reddit', 'email', 'sms'];
// Messaging habits differ by region, so the leading networks depend on the page language.
export const ORDER = {
  ja: ['line', ...BASE],
  th: ['line', ...BASE],
  'zh-tw': ['line', ...BASE],
  id: ['whatsapp', 'line', 'telegram', 'facebook', 'x', 'linkedin', 'reddit', 'email', 'sms'],
  ru: ['telegram', 'vk', 'whatsapp', 'facebook', 'x', 'email', 'sms'],
  uk: ['telegram', 'whatsapp', 'facebook', 'x', 'linkedin', 'reddit', 'email', 'sms'],
  'zh-cn': ['weibo', 'email', 'sms'],
};

/** Network ids to show for a language; SMS only on touch devices. */
export function orderFor(lang, touch) {
  const nets = networks({ email: '', sms: '' });
  return (ORDER[lang] || BASE).filter((id) => touch || !nets[id].touchOnly);
}

/** True for destinations that open an app or a new tab rather than another page. */
export const opensExternally = (net) => !net.scheme;
