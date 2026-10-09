// Content for the two dedicated tokenizer pages. Statements here come from the gpt-tokenizer library's
// own documentation (v4), not from memory; the model list for cl100k_base is generated from the library.
export interface TokenizerInfo {
  id: 'o200k_base' | 'cl100k_base';
  path: string;
  title: string;
  description: string;
  h1: string;
  lead: string;
  other: 'o200k_base' | 'cl100k_base';
  approxVocab: string;
  usedBy: string;
  shortName: string;
}
export const TOKENIZERS: Record<TokenizerInfo['id'], TokenizerInfo> = {
  o200k_base: {
    id: 'o200k_base',
    path: '/o200k-base-token-counter/',
    title: 'o200k_base Token Counter: Count GPT-4o Tokens Online',
    description: 'Free o200k_base token counter. Paste text to count tokens exactly as the GPT-4o encoding does, see how it is split, and estimate cost. Runs in your browser.',
    h1: 'o200k_base token counter',
    lead: 'Count tokens with the o200k_base encoding, the one used by GPT-4o, GPT-4.1, GPT-5 and the o-series. Paste your text and see the exact count, the token split and the cost at your prices.',
    other: 'cl100k_base',
    approxVocab: 'about 200,000',
    usedBy: "The gpt-tokenizer library documents o200k_base as the encoding for GPT-5, GPT-4.1 and GPT-4o models and for the o-series reasoning models. Models the library does not list explicitly also default to it.",
    shortName: 'GPT-4o and newer',
  },
  cl100k_base: {
    id: 'cl100k_base',
    path: '/cl100k-base-tokenizer/',
    title: 'cl100k_base Tokenizer Online: Count GPT-4 & GPT-3.5 Tokens',
    description: 'Free cl100k_base tokenizer online. Paste text to count tokens exactly as the GPT-4 and GPT-3.5 encoding does, see the split and token ids, and estimate cost.',
    h1: 'cl100k_base tokenizer online',
    lead: 'Count tokens with the cl100k_base encoding used by GPT-4, GPT-3.5 and the text-embedding-3 models. Paste your text and see the exact count, the token split and the cost at your prices.',
    other: 'o200k_base',
    approxVocab: 'about 100,000',
    usedBy: 'The gpt-tokenizer library documents gpt-4-* and gpt-3.5-* models as using cl100k_base, and its model table also maps the text-embedding-3 and text-embedding-ada-002 embedding models to it.',
    shortName: 'GPT-4 and GPT-3.5',
  },
};
