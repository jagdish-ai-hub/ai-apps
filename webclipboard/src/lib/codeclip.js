// Code clips: a normal clip whose text starts with an invisible marker naming the language, e.g. "<U+2063>wc-code:python<U+2063>\n".
// The server stores it like any other text (and inside the encrypted envelope when a password is set, so the language stays private).
// Receivers that know the marker show the code highlighted; the marker is never part of the text a person copies or downloads.

const OPEN = '⁣wc-code:';
const CLOSE = '⁣\n';
const RE = /^⁣wc-code:([a-z0-9+#-]{1,20})⁣\n/;

/** Language ids the editor offers. `hljs` is the highlight.js name, `ext` the file extension used for downloads. */
export const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', hljs: 'javascript', ext: 'js' },
  { id: 'typescript', label: 'TypeScript', hljs: 'typescript', ext: 'ts' },
  { id: 'python', label: 'Python', hljs: 'python', ext: 'py' },
  { id: 'html', label: 'HTML / XML', hljs: 'xml', ext: 'html' },
  { id: 'css', label: 'CSS', hljs: 'css', ext: 'css' },
  { id: 'json', label: 'JSON', hljs: 'json', ext: 'json' },
  { id: 'bash', label: 'Bash / Shell', hljs: 'bash', ext: 'sh' },
  { id: 'sql', label: 'SQL', hljs: 'sql', ext: 'sql' },
  { id: 'java', label: 'Java', hljs: 'java', ext: 'java' },
  { id: 'c', label: 'C', hljs: 'c', ext: 'c' },
  { id: 'cpp', label: 'C++', hljs: 'cpp', ext: 'cpp' },
  { id: 'csharp', label: 'C#', hljs: 'csharp', ext: 'cs' },
  { id: 'go', label: 'Go', hljs: 'go', ext: 'go' },
  { id: 'rust', label: 'Rust', hljs: 'rust', ext: 'rs' },
  { id: 'php', label: 'PHP', hljs: 'php', ext: 'php' },
  { id: 'ruby', label: 'Ruby', hljs: 'ruby', ext: 'rb' },
  { id: 'kotlin', label: 'Kotlin', hljs: 'kotlin', ext: 'kt' },
  { id: 'swift', label: 'Swift', hljs: 'swift', ext: 'swift' },
  { id: 'yaml', label: 'YAML', hljs: 'yaml', ext: 'yml' },
  { id: 'markdown', label: 'Markdown', hljs: 'markdown', ext: 'md' },
];
export const languageById = (id) => LANGUAGES.find((l) => l.id === id);

/** Text to store: the marker plus the code. Plain text (no language) is stored as it is. */
export function encodeCode(text, lang) {
  return languageById(lang) ? `${OPEN}${lang}${CLOSE}${text}` : text;
}
export const MARKER_LENGTH = (lang) => OPEN.length + String(lang).length + CLOSE.length;

/** { lang, text } when `content` is a code clip with a language we know, otherwise null (it is ordinary text). */
export function decodeCode(content) {
  const m = RE.exec(String(content ?? ''));
  if (!m || !languageById(m[1])) return null;
  return { lang: m[1], text: content.slice(m[0].length) };
}
