// Registry of every tool page. Used by the /tools/ hub, the homepage cards, the sitemap and the tests.
// Each tool lives at /<slug>/ and (where `guide` is set) has its own guide at /guides/<guide>/.
export type ToolGroup = 'transfer' | 'qr' | 'convert' | 'ai' | 'text' | 'tokens';

export interface ToolInfo {
  slug: string;
  name: string;
  short: string;
  group: ToolGroup;
  guide?: string;
}

export const toolGroups: Record<ToolGroup, { title: string; blurb: string }> = {
  transfer: { title: 'Move text between devices', blurb: 'Copy on one device and paste on another with a 6-digit code or QR code. No app, no account.' },
  qr: { title: 'QR codes', blurb: 'Make QR codes for text, links and Wi-Fi networks. Download PNG or SVG. Codes never expire and nothing is uploaded.' },
  convert: { title: 'Convert and download', blurb: 'Turn text or Markdown into a Word file or a PDF. Everything runs in your browser, so your text never leaves your device.' },
  ai: { title: 'AI answers and prompts', blurb: 'Tools for the text that AI assistants produce and consume: get answers into Word or PDF, clean up Markdown, split documents for retrieval, and check training files.' },
  text: { title: 'Everyday text tools', blurb: 'Count words and characters, and change the case of any text. Everything runs in your browser.' },
  tokens: { title: 'LLM and token tools', blurb: 'Count tokens with real OpenAI tokenizers and estimate what a prompt will cost.' },
};

export const tools: ToolInfo[] = [
  { slug: 'iphone-to-windows-clipboard', name: 'iPhone to Windows Clipboard', short: 'Copy text on your iPhone and paste it on a Windows PC with a 6-digit code or QR code. No app, no iCloud, no sign-in.', group: 'transfer', guide: 'send-a-link-from-iphone-to-pc' },
  { slug: 'code-share', name: 'Share Code Online', short: 'Write or paste code with syntax highlighting, get a 6-digit code, and open it on any device. Optional password and auto-delete.', group: 'transfer', guide: 'how-to-share-code-online-with-syntax-highlighting' },
  { slug: 'qr-code-generator', name: 'QR Code Generator', short: 'Turn any text into a QR code and download it as PNG or SVG, with your choice of size and colours.', group: 'qr', guide: 'how-to-make-a-qr-code-for-free' },
  { slug: 'url-to-qr-code', name: 'URL to QR Code', short: 'Make a QR code for a link. The code never expires and scans are not tracked.', group: 'qr', guide: 'how-to-make-a-qr-code-for-a-link' },
  { slug: 'wifi-qr-code-generator', name: 'Wi-Fi QR Code Generator', short: 'Let guests join your Wi-Fi by scanning a code. The password never leaves your browser.', group: 'qr', guide: 'how-to-make-a-wifi-qr-code' },
  { slug: 'text-to-pdf', name: 'Text to PDF', short: 'Paste any text and save it as a PDF, with your choice of font, size, page size and margins.', group: 'convert', guide: 'how-to-convert-text-to-pdf' },
  { slug: 'text-to-word', name: 'Text to Word', short: 'Turn plain text into a real .docx file you can open in Word, Google Docs or LibreOffice.', group: 'convert', guide: 'how-to-convert-text-to-word' },
  { slug: 'markdown-to-pdf', name: 'Markdown to PDF', short: 'Paste Markdown, preview it and save a formatted PDF with headings, lists, code and tables.', group: 'convert', guide: 'how-to-convert-markdown-to-pdf' },
  { slug: 'markdown-to-word', name: 'Markdown to Word', short: 'Convert Markdown to a .docx with real Word headings, lists, links, code blocks and tables.', group: 'convert', guide: 'how-to-convert-markdown-to-word' },
  { slug: 'chatgpt-to-word', name: 'ChatGPT to Word', short: 'Paste an AI answer and download it as a Word file, with real headings, lists, tables and code blocks.', group: 'ai', guide: 'how-to-copy-chatgpt-answer-into-word' },
  { slug: 'chatgpt-to-pdf', name: 'ChatGPT to PDF', short: 'Paste an AI answer, preview it, and save a clean PDF with its headings, lists, tables and code.', group: 'ai', guide: 'how-to-save-chatgpt-answer-as-pdf' },
  { slug: 'strip-markdown', name: 'Strip Markdown', short: 'Remove the asterisks, hashes and pipes from AI-written text and keep clean plain text for email or chat.', group: 'ai', guide: 'how-to-remove-markdown-from-chatgpt-text' },
  { slug: 'rag-text-chunker', name: 'RAG Text Chunker', short: 'Split a long document into token-sized chunks with overlap, and download them as JSON or JSONL.', group: 'ai', guide: 'how-to-chunk-text-for-rag' },
  { slug: 'jsonl-fine-tuning-validator', name: 'JSONL Fine-Tuning Validator', short: 'Check a chat-format JSONL training file line by line and count its tokens, without uploading it.', group: 'ai', guide: 'how-to-prepare-jsonl-for-fine-tuning' },
  { slug: 'word-counter', name: 'Word Counter', short: 'Count words, characters, sentences and reading time, including for Japanese, Chinese and Thai text.', group: 'text', guide: 'how-to-count-words-and-characters' },
  { slug: 'case-converter', name: 'Case Converter', short: 'Change text to upper case, lower case, sentence case, title case, camelCase, snake_case and more.', group: 'text', guide: 'how-to-change-text-case' },
  { slug: 'token-calculator', name: 'Token Calculator', short: 'Count tokens with OpenAI tokenizers and estimate input and output cost at your own prices.', group: 'tokens' },
  { slug: 'o200k-base-token-counter', name: 'o200k_base Token Counter', short: 'Token counter locked to the o200k_base vocabulary used by GPT-4o and newer models.', group: 'tokens' },
  { slug: 'cl100k-base-tokenizer', name: 'cl100k_base Tokenizer', short: 'Token counter locked to cl100k_base, used by GPT-4, GPT-3.5 and embeddings v3.', group: 'tokens' },
  { slug: 'token-cost-by-language', name: 'Token Cost by Language', short: 'How many more tokens the same sentence costs in 30 languages, with downloadable data.', group: 'tokens' },
];

export const toolPath = (slug: string) => `/${slug}/`;
export const findTool = (slug: string) => tools.find((t) => t.slug === slug);
