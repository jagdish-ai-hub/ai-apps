// Pure helpers behind the notes toolbar: Markdown formatting applied to a text box's value and selection.
// Each function takes (value, start, end) and returns { value, start, end } with the new text and selection.

const BLOCK = /^(#{1,6} |[-*+] \[[ xX]\] |[-*+] |\d+[.)] )/;
const PREFIX = { h1: '# ', h2: '## ', bullet: '- ', number: '1. ', check: '- [ ] ' };

const lineStart = (v, i) => v.lastIndexOf('\n', i - 1) + 1;
const lineEnd = (v, i) => { const e = v.indexOf('\n', i); return e < 0 ? v.length : e; };

/** Bold, italic over several lines: each non-empty line is wrapped on its own (after its list or heading mark), so the result stays valid Markdown. */
function wrapLines(value, start, end, mark) {
  const ls = lineStart(value, start);
  const le = lineEnd(value, end > start && value[end - 1] === '\n' ? end - 1 : end);
  const lines = value.slice(ls, le).split('\n').map((l) => { const p = BLOCK.exec(l)?.[0] ?? ''; return { l, p, body: l.slice(p.length) }; });
  const body = lines.filter((x) => x.body.trim() !== '');
  const wrapped = (x) => x.body.length > mark.length * 2 && x.body.startsWith(mark) && x.body.endsWith(mark);
  const removing = body.length > 0 && body.every(wrapped);
  const out = lines.map((x) => (x.body.trim() === '' ? x.l : x.p + (removing ? x.body.slice(mark.length, -mark.length) : mark + x.body + mark))).join('\n');
  return { value: value.slice(0, ls) + out + value.slice(le), start: ls, end: ls + out.length };
}

/** Bold, italic: wraps the selection, or removes the markers when the selection is already wrapped. */
function wrap(value, start, end, mark) {
  if (value.slice(start, end).includes('\n')) return wrapLines(value, start, end, mark);
  const before = value.slice(0, start), sel = value.slice(start, end), after = value.slice(end);
  if (before.endsWith(mark) && after.startsWith(mark)) {
    return { value: before.slice(0, -mark.length) + sel + after.slice(mark.length), start: start - mark.length, end: end - mark.length };
  }
  if (sel.length > mark.length * 2 && sel.startsWith(mark) && sel.endsWith(mark)) {
    const inner = sel.slice(mark.length, -mark.length);
    return { value: before + inner + after, start, end: start + inner.length };
  }
  return { value: before + mark + sel + mark + after, start: start + mark.length, end: end + mark.length };
}

/** Heading, bullet, numbered and checklist: applies a prefix to every line the selection touches; applying it again removes it. */
function linePrefix(value, start, end, kind) {
  const ls = lineStart(value, start);
  const le = lineEnd(value, end > start && value[end - 1] === '\n' ? end - 1 : end);
  const lines = value.slice(ls, le).split('\n');
  const content = lines.filter((l) => l.trim() !== '');
  const target = content.length ? content : lines;
  const has = (l) => (kind === 'number' ? /^\d+[.)] /.test(l) : l.startsWith(PREFIX[kind]) && (kind !== 'bullet' || !/^[-*+] \[[ xX]\] /.test(l)));
  const removing = target.every(has);
  let n = 0;
  const out = lines.map((l) => {
    if (l.trim() === '' && content.length) return l;
    const bare = l.replace(BLOCK, '');
    if (removing) return bare;
    n += 1;
    return (kind === 'number' ? `${n}. ` : PREFIX[kind]) + bare;
  }).join('\n');
  const next = value.slice(0, ls) + out + value.slice(le);
  return start === end ? { value: next, start: ls + out.length, end: ls + out.length } : { value: next, start: ls, end: ls + out.length };
}

export const FORMATS = ['bold', 'italic', 'h1', 'h2', 'bullet', 'number', 'check'];

export function applyFormat(value, start, end, kind) {
  if (start > end) [start, end] = [end, start];
  if (kind === 'bold') return wrap(value, start, end, '**');
  if (kind === 'italic') return wrap(value, start, end, '_');
  if (PREFIX[kind]) return linePrefix(value, start, end, kind);
  return { value, start, end };
}

/**
 * Enter inside a list: continue it on the next line (numbers count up, checklists start unchecked); on an empty item, leave the list.
 * Returns { value, start, end } or null when the current line is not a list item, so the browser inserts a normal line break.
 */
export function continueList(value, pos) {
  const ls = lineStart(value, pos);
  const line = value.slice(ls, pos);
  const m = /^(\s*)([-*+] \[[ xX]\] |[-*+] |(\d+)([.)]) )/.exec(line);
  if (!m) return null;
  const rest = value.slice(ls + m[0].length, lineEnd(value, pos));
  if (rest.trim() === '' && line.length === m[0].length) {
    // An empty item ends the list. After another list item the text that follows needs a blank line, or Markdown would treat it as part of that item.
    const prev = ls > 0 ? value.slice(lineStart(value, ls - 1), ls - 1) : '';
    const after = BLOCK.test(prev.trimStart()) && !/^#{1,6} /.test(prev.trimStart()) ? '\n' : '';
    return { value: value.slice(0, ls) + after + value.slice(lineEnd(value, pos)), start: ls + after.length, end: ls + after.length };
  }
  const marker = m[3] ? `${Number(m[3]) + 1}${m[4]} ` : /\[[ xX]\]/.test(m[2]) ? `${m[2][0]} [ ] ` : m[2];
  const insert = `\n${m[1]}${marker}`;
  const next = value.slice(0, pos) + insert + value.slice(pos);
  return { value: next, start: pos + insert.length, end: pos + insert.length };
}

/** The note as Markdown for export or sharing: the title becomes a top heading unless the note already starts with one. */
export function withTitle(title, md) {
  const t = String(title ?? '').trim();
  const body = String(md ?? '');
  return t && !/^\s*#\s/.test(body) ? `# ${t}\n\n${body}` : body;
}
