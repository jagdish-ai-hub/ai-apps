// Markdown -> safe HTML (preview and print), built from marked's token tree.
// Raw HTML in the source is never passed through: it is shown as plain text. Only elements built here reach the DOM.
import { marked } from 'marked';

export const lex = (md) => marked.lexer(String(md ?? '').replace(/\r\n?/g, '\n'), { gfm: true, breaks: false });

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
/** marked leaves entities such as &amp; and &#39; as written; turn them into real characters. */
export function decode(s) {
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
    }
    return NAMED[e.toLowerCase()] ?? m;
  });
}

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Only web and mail links are kept; javascript:, data: etc. render as plain text. */
export const safeHref = (href) => (/^(https?:\/\/|mailto:)/i.test(String(href).trim()) ? String(href).trim() : null);

function inline(tokens = []) {
  return tokens.map((t) => {
    switch (t.type) {
      case 'strong': return `<strong>${inline(t.tokens)}</strong>`;
      case 'em': return `<em>${inline(t.tokens)}</em>`;
      case 'del': return `<del>${inline(t.tokens)}</del>`;
      case 'codespan': return `<code>${esc(decode(t.text))}</code>`;
      case 'br': return '<br>';
      case 'link': {
        const href = safeHref(t.href);
        return href ? `<a href="${esc(href)}" rel="noopener noreferrer">${inline(t.tokens)}</a>` : inline(t.tokens);
      }
      case 'image': return esc(`[image: ${decode(t.text || t.title || '')}]`);
      case 'escape': return esc(t.text);
      case 'html': return esc(t.text ?? t.raw);
      case 'text': return t.tokens ? inline(t.tokens) : esc(decode(t.text));
      default: return esc(decode(t.text ?? t.raw ?? ''));
    }
  }).join('');
}

function listItem(item) {
  const box = item.task ? `<input type="checkbox" disabled${item.checked ? ' checked' : ''}> ` : '';
  const body = item.tokens.map((c) => (c.type === 'text' ? inline(c.tokens ?? [c]) : block([c]))).join('');
  return `<li>${box}${body}</li>`;
}

function block(tokens = []) {
  return tokens.map((t) => {
    switch (t.type) {
      case 'heading': return `<h${t.depth}>${inline(t.tokens)}</h${t.depth}>`;
      case 'paragraph': return `<p>${inline(t.tokens)}</p>`;
      case 'text': return `<p>${t.tokens ? inline(t.tokens) : esc(decode(t.text))}</p>`;
      case 'code': return `<pre><code>${esc(t.text)}</code></pre>`;
      case 'blockquote': return `<blockquote>${block(t.tokens)}</blockquote>`;
      case 'hr': return '<hr>';
      case 'list': {
        const tag = t.ordered ? 'ol' : 'ul';
        const start = t.ordered && t.start && t.start !== 1 ? ` start="${Number(t.start)}"` : '';
        return `<${tag}${start}>${t.items.map(listItem).join('')}</${tag}>`;
      }
      case 'table': {
        const cell = (tag, c) => `<${tag}${c.align ? ` style="text-align:${c.align}"` : ''}>${inline(c.tokens)}</${tag}>`;
        const head = `<thead><tr>${t.header.map((c) => cell('th', c)).join('')}</tr></thead>`;
        const body = `<tbody>${t.rows.map((r) => `<tr>${r.map((c) => cell('td', c)).join('')}</tr>`).join('')}</tbody>`;
        return `<table>${head}${body}</table>`;
      }
      case 'html': return `<p>${esc((t.text ?? t.raw).trim())}</p>`;
      case 'space': case 'def': return '';
      default: return t.text ? `<p>${esc(decode(t.text))}</p>` : '';
    }
  }).join('');
}

export const markdownToHtml = (md) => block(lex(md));

/** Markdown syntax removed, text kept. Used by the "strip markdown" tool and by tests. */
export function markdownToPlain(md) {
  const inl = (tokens = []) => tokens.map((t) => {
    if (t.type === 'br') return '\n';
    if (t.type === 'image') return decode(t.text || '');
    if (t.tokens) return inl(t.tokens);
    return decode(t.text ?? t.raw ?? '');
  }).join('');
  const blk = (tokens = [], depth = 0) => tokens.map((t) => {
    switch (t.type) {
      case 'heading': case 'paragraph': return inl(t.tokens) + '\n\n';
      case 'text': return (t.tokens ? inl(t.tokens) : decode(t.text)) + '\n';
      case 'code': return t.text + '\n\n';
      case 'blockquote': return blk(t.tokens, depth);
      case 'hr': return '\n';
      case 'list': return t.items.map((it, i) => {
        const mark = (t.ordered ? `${Number(t.start || 1) + i}. ` : '• ') + (it.task ? (it.checked ? '\u2611 ' : '\u2610 ') : '');
        return `${'  '.repeat(depth)}${mark}${blk(it.tokens, depth + 1).replace(/\n+$/, '')}\n`;
      }).join('') + '\n';
      case 'table': return [t.header, ...t.rows].map((r) => r.map((c) => inl(c.tokens)).join(' | ')).join('\n') + '\n\n';
      case 'space': case 'def': case 'checkbox': return '';
      default: return decode(t.text ?? '') + '\n';
    }
  }).join('');
  return blk(lex(md)).replace(/\n{3,}/g, '\n\n').trim();
}
