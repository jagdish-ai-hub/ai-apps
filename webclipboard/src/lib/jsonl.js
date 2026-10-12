// Checks a JSONL file of chat-format training examples ({"messages":[{"role":...,"content":...}, ...]} on every line)
// and counts tokens. Pure; the tokenizer is injected. The rules are deliberately conservative: errors are things that make an
// example unreadable, warnings are things worth a second look. Always confirm against your provider's current documentation.

export const ROLES = ['system', 'developer', 'user', 'assistant', 'tool', 'function'];

const contentText = (content) => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map((p) => (typeof p === 'string' ? p : p && typeof p.text === 'string' ? p.text : '')).join('\n');
  return '';
};

/**
 * @param {string} raw whole file contents
 * @param {{encode?:(s:string)=>number[], maxTokens?:number}} [o]
 */
export function validateJsonl(raw, { encode, maxTokens } = {}) {
  const text = String(raw ?? '').replace(/^﻿/, '');
  const lines = text.split(/\r\n|\r|\n/);
  while (lines.length && lines[lines.length - 1] === '') lines.pop(); // a trailing newline is normal
  const errors = [];
  const warnings = [];
  const examples = [];
  const seen = new Map();
  const add = (list, line, message) => list.push({ line, message });

  if (/^﻿/.test(String(raw ?? ''))) add(warnings, 1, 'The file starts with a byte-order mark (BOM); some tools reject it.');

  lines.forEach((ln, i) => {
    const n = i + 1;
    if (!ln.trim()) { add(errors, n, 'Empty line. JSONL needs exactly one JSON object per line, with no blank lines between them.'); return; }
    let obj;
    try { obj = JSON.parse(ln); } catch (e) { add(errors, n, `Not valid JSON: ${String(e.message).replace(/^JSON\.parse: /, '')}`); return; }
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) { add(errors, n, 'Each line must be a JSON object, like {"messages": [...]}.'); return; }
    if (!('messages' in obj)) {
      if ('prompt' in obj || 'completion' in obj) add(errors, n, 'This is the older prompt/completion format. Chat fine-tuning expects {"messages": [{"role": ..., "content": ...}]}.');
      else add(errors, n, 'Missing the "messages" key.');
      return;
    }
    if (!Array.isArray(obj.messages) || obj.messages.length === 0) { add(errors, n, '"messages" must be a non-empty array.'); return; }

    let ok = true;
    let tokens = 0;
    let hasAssistant = false;
    obj.messages.forEach((m, j) => {
      const where = `message ${j + 1}`;
      if (m === null || typeof m !== 'object' || Array.isArray(m)) { add(errors, n, `${where} must be an object with "role" and "content".`); ok = false; return; }
      if (!ROLES.includes(m.role)) { add(errors, n, `${where} has ${m.role === undefined ? 'no "role"' : `an unknown role ${JSON.stringify(m.role)}`}. Expected one of ${ROLES.join(', ')}.`); ok = false; }
      if (m.role === 'assistant') hasAssistant = true;
      const hasCalls = Array.isArray(m.tool_calls) || m.function_call;
      if (m.content === undefined || m.content === null) {
        if (!(m.role === 'assistant' && hasCalls)) { add(errors, n, `${where} has no "content".`); ok = false; }
      } else if (typeof m.content !== 'string' && !Array.isArray(m.content)) { add(errors, n, `${where}: "content" must be a string (or a list of content parts).`); ok = false; }
      else if (typeof m.content === 'string' && m.content.trim() === '' && m.role !== 'assistant') add(warnings, n, `${where} (${m.role}) has empty content.`);
      if (encode) tokens += encode(contentText(m.content)).length;
    });
    if (!ok) return;
    if (!hasAssistant) add(warnings, n, 'No assistant message, so there is nothing for the model to learn to say.');
    else if (obj.messages[obj.messages.length - 1].role !== 'assistant') add(warnings, n, 'The last message is not from the assistant.');
    const sysAt = obj.messages.findIndex((m) => m.role === 'system' || m.role === 'developer');
    if (sysAt > 0) add(warnings, n, 'A system message appears after the first message; it is normally first.');

    const key = ln.trim();
    if (seen.has(key)) add(warnings, n, `Identical to line ${seen.get(key)}.`);
    else seen.set(key, n);

    examples.push({ line: n, messages: obj.messages.length, tokens });
    if (maxTokens && encode && tokens > maxTokens) add(warnings, n, `${tokens.toLocaleString()} tokens, over your limit of ${Number(maxTokens).toLocaleString()}.`);
  });

  const total = examples.reduce((s, e) => s + e.tokens, 0);
  if (examples.length > 0 && examples.length < 10) add(warnings, 0, `Only ${examples.length} valid example${examples.length === 1 ? '' : 's'}. Providers usually ask for at least 10, and far more gives better results.`);
  const sorted = [...examples].sort((a, b) => a.tokens - b.tokens);
  return {
    totalLines: lines.length,
    valid: examples.length,
    errors,
    warnings,
    examples,
    tokens: encode ? { total, min: sorted[0]?.tokens ?? 0, max: sorted[sorted.length - 1]?.tokens ?? 0, mean: examples.length ? total / examples.length : 0, median: sorted.length ? sorted[sorted.length >> 1].tokens : 0 } : null,
    ok: errors.length === 0 && examples.length > 0,
  };
}
