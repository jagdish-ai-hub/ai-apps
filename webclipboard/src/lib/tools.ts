// Registry of every tool page. Used by the /tools/ hub, the homepage cards, the sitemap and the tests.
// Each tool lives at /<slug>/ and (where `guide` is set) has its own guide at /guides/<guide>/.
export type ToolGroup = 'transfer' | 'convert' | 'tokens';

export interface ToolInfo {
  slug: string;
  name: string;
  short: string;
  group: ToolGroup;
  guide?: string;
}

export const toolGroups: Record<ToolGroup, { title: string; blurb: string }> = {
  transfer: { title: 'Move text between devices', blurb: 'Copy on one device and paste on another with a 6-digit code or QR code. No app, no account.' },
  convert: { title: 'Convert and download', blurb: 'Turn text or Markdown into a Word file or a PDF. Everything runs in your browser, so your text never leaves your device.' },
  tokens: { title: 'LLM and token tools', blurb: 'Count tokens with real OpenAI tokenizers and estimate what a prompt will cost.' },
};

export const tools: ToolInfo[] = [
  { slug: 'iphone-to-windows-clipboard', name: 'iPhone to Windows Clipboard', short: 'Copy text on your iPhone and paste it on a Windows PC with a 6-digit code or QR code. No app, no iCloud, no sign-in.', group: 'transfer', guide: 'send-a-link-from-iphone-to-pc' },
  { slug: 'text-to-pdf', name: 'Text to PDF', short: 'Paste any text and save it as a PDF, with your choice of font, size, page size and margins.', group: 'convert', guide: 'how-to-convert-text-to-pdf' },
  { slug: 'text-to-word', name: 'Text to Word', short: 'Turn plain text into a real .docx file you can open in Word, Google Docs or LibreOffice.', group: 'convert', guide: 'how-to-convert-text-to-word' },
  { slug: 'markdown-to-pdf', name: 'Markdown to PDF', short: 'Paste Markdown, preview it and save a formatted PDF with headings, lists, code and tables.', group: 'convert', guide: 'how-to-convert-markdown-to-pdf' },
  { slug: 'markdown-to-word', name: 'Markdown to Word', short: 'Convert Markdown to a .docx with real Word headings, lists, links, code blocks and tables.', group: 'convert', guide: 'how-to-convert-markdown-to-word' },
  { slug: 'token-calculator', name: 'Token Calculator', short: 'Count tokens with OpenAI tokenizers and estimate input and output cost at your own prices.', group: 'tokens' },
  { slug: 'o200k-base-token-counter', name: 'o200k_base Token Counter', short: 'Token counter locked to the o200k_base vocabulary used by GPT-4o and newer models.', group: 'tokens' },
  { slug: 'cl100k-base-tokenizer', name: 'cl100k_base Tokenizer', short: 'Token counter locked to cl100k_base, used by GPT-4, GPT-3.5 and embeddings v3.', group: 'tokens' },
  { slug: 'token-cost-by-language', name: 'Token Cost by Language', short: 'How many more tokens the same sentence costs in 30 languages, with downloadable data.', group: 'tokens' },
];

export const toolPath = (slug: string) => `/${slug}/`;
export const findTool = (slug: string) => tools.find((t) => t.slug === slug);
