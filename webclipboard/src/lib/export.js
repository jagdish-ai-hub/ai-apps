// Browser-only helpers for saving text as a file or as a PDF. Nothing here talks to a server.

export function saveBlob(blob, filename) {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export const safeName = (s, fallback = 'document') =>
  (String(s || '').trim().replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-').replace(/\s+/g, ' ').replace(/^\.+/, '').slice(0, 80) || fallback);

export const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const FONT_STACK = {
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Noto Sans CJK JP", "Hiragino Sans", "Yu Gothic", sans-serif',
  serif: 'Georgia, "Times New Roman", "Noto Serif", "Noto Serif CJK JP", "Hiragino Mincho ProN", "Yu Mincho", serif',
  mono: 'ui-monospace, Consolas, "Courier New", "Noto Sans Mono", monospace',
};
const PAGE_SIZE = { a4: 'A4', letter: 'Letter' };
const MARGIN_MM = { narrow: '12mm', normal: '25mm', wide: '32mm' };

/**
 * Opens the browser's print dialog showing only `node` (a prepared element), so "Save as PDF" produces the document.
 * The browser's own fonts are used, so every script (Japanese, Hindi, Thai, Arabic...) prints correctly.
 */
export function printAsPdf(node, options = {}, title = 'document') {
  const { font = 'sans', size = 12, page = 'a4', margin = 'normal' } = options;
  const root = document.createElement('div');
  root.id = 'print-root';
  root.appendChild(node);
  const style = document.createElement('style');
  style.id = 'print-style';
  style.textContent = `
    @page { size: ${PAGE_SIZE[page] || 'A4'}; margin: ${MARGIN_MM[margin] || '25mm'}; }
    #print-root { display: none; }
    @media print {
      body > *:not(#print-root) { display: none !important; }
      html, body { background: #fff !important; }
      #print-root { display: block !important; color: #000; background: #fff; font: ${Number(size) || 12}pt/1.5 ${FONT_STACK[font] || FONT_STACK.sans}; }
    }`;
  const oldTitle = document.title;
  document.title = safeName(title);
  document.head.appendChild(style);
  document.body.appendChild(root);
  const cleanup = () => {
    root.remove();
    style.remove();
    document.title = oldTitle;
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  // On phones print() can return before the dialog is closed, so cleanup waits for afterprint (hidden outside print anyway).
  setTimeout(() => window.print(), 50);
  setTimeout(cleanup, 120_000);
}

export function textNode(text) {
  const pre = document.createElement('div');
  pre.style.whiteSpace = 'pre-wrap';
  pre.style.overflowWrap = 'anywhere';
  pre.style.tabSize = '4';
  pre.textContent = text;
  return pre;
}

export function htmlNode(html) {
  const box = document.createElement('div');
  box.className = 'print-md';
  box.innerHTML = html; // html comes from markdownToHtml(), which escapes all text and only emits its own tags
  return box;
}
