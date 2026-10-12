---
title: "How to Chunk Text for RAG: Chunk Size, Overlap and Examples"
description: "How to split documents into chunks for retrieval-augmented generation: choosing size and overlap, paragraph versus sentence splitting, token limits and common mistakes."
h1: "How to chunk text for RAG: sizes, overlap and examples"
lead: "Before a language model can answer questions from your documents, those documents have to be cut into pieces it can find and read. How you cut them decides how good the answers are."
category: "AI answers"
updated: "2026-10-12"
tool: rag-text-chunker
related: ["how-many-tokens-in-a-word-or-page", "how-tokenizers-work", "how-to-prepare-jsonl-for-fine-tuning"]
faq:
  - q: "What is chunking in RAG?"
    a: "Chunking is splitting long documents into smaller pieces, usually measured in tokens, so each piece can be embedded, searched and passed to a language model along with a question."
  - q: "What chunk size is best?"
    a: "There is no universal best. A few hundred tokens, often 200 to 1,000, is a common starting point. Test with real questions and compare how well the right passage is retrieved."
  - q: "How much overlap should I use?"
    a: "Around 10 to 20 percent of the chunk size is a common rule of thumb. It keeps ideas at the boundary whole in at least one chunk without wasting too many tokens."
  - q: "Should I chunk by characters or by tokens?"
    a: "Tokens, because models and embedding services have token limits and charge per token. Characters are only a rough proxy, and the ratio differs between languages."
  - q: "Do I need a different chunk size for non-English text?"
    a: "The token limits are the same, but the same text takes more tokens in some languages. Count tokens for your own language rather than assuming English ratios."
---

## What chunking does

**Retrieval-augmented generation (RAG)** lets a language model answer using your own documents: product manuals, policies, articles, transcripts. The system first searches the documents for the passages that best match a question, then hands those passages to the model together with the question. Searching and sending whole documents is impractical, so documents are split into **chunks** that are small enough to embed, search and fit in a prompt.

Chunking sounds mechanical, but it shapes the answers. A chunk too small loses the surrounding explanation, so the model finds a sentence without its meaning. A chunk too large mixes several topics, dilutes the search match and uses more of the prompt than needed. And a cut in the middle of a sentence or a table can separate a fact from its context.

## Measure in tokens

Models and embedding services work in **tokens**, not characters or words, and they have limits and prices per token. A chunk "of 1,000 characters" can be 200 tokens in one language and 600 in another. The [token calculator](/token-calculator/) shows how any text is split, and the guide to [how many tokens a word or page uses](/guides/how-many-tokens-in-a-word-or-page/) gives the ratios for English. For other languages, count your own text, because the numbers differ a lot; the page on [tokens in different languages](/guides/tokens-in-different-languages/) explains why.

The [RAG text chunker](/rag-text-chunker/) splits by tokens with OpenAI's tokenizers and guarantees that no chunk exceeds the size you set.

## Choosing a chunk size

Common starting points, not rules:

- **200 to 400 tokens** for short factual passages, such as FAQs and glossaries, where each answer is brief.
- **400 to 800 tokens** for documentation and articles, where an explanation needs a few paragraphs.
- **Larger chunks** for long-form reasoning over a single narrative, where cutting loses the thread.

Also check the **limit of your embedding model**. Each embedding service accepts only a certain number of tokens per input; for example, OpenAI's text-embedding-3 models list 8,191 tokens at the time of writing. Check the current figure in your provider's documentation, and stay well below it, because very long inputs usually give blurrier embeddings.

## Choosing an overlap

Overlap repeats the end of one chunk at the start of the next. A common rule of thumb is **10 to 20 percent** of the chunk size, so an idea that falls on a boundary is whole in at least one chunk. Too little overlap risks cutting ideas; too much inflates the number of chunks, the storage and the cost. If your documents have clear structure, such as one topic per heading, good boundaries matter more than overlap.

## Where to cut

- **By paragraph** keeps ideas together and works well for prose with clear paragraphs.
- **By sentence** gives finer control and suits dense text, transcripts and languages with short paragraphs.
- **By line** suits lists, logs, subtitles and Q&A pairs where each line stands alone.
- **By heading or section** is often best for structured documents: split at headings first, then split long sections by size. Add the heading text to each chunk so it carries its context.

The chunker packs whole paragraphs, sentences or lines, so cuts fall at natural boundaries. Only a unit that is bigger than a whole chunk on its own is cut further, first at sentence boundaries and then by characters.

## Common mistakes

- **Cutting by a fixed number of characters** that splits words and sentences.
- **Ignoring structure.** Tables, code blocks and lists may need to stay whole or be converted to text first.
- **No metadata.** Store the document name, section title and position with each chunk so you can cite sources and rebuild context.
- **Never testing.** Collect twenty real questions and check whether the right chunk is retrieved. Change the size or overlap and compare.
- **Forgetting languages.** Count tokens in the language of your documents, because the same text can take far more tokens in some scripts.

## Using the output

The chunker produces a list with an id, the text and the token count of each chunk. Download it as **JSONL** (one chunk per line, easy to stream into an indexing script) or **JSON**. From there, you embed each chunk, store the vectors with their text and metadata, and search them at question time. If you later want to teach a model your style or format instead of giving it documents, see the guide to [preparing a JSONL file for fine-tuning](/guides/how-to-prepare-jsonl-for-fine-tuning/), which is a different task with a different file format.

## Privacy

Documents for RAG are often internal. Prefer tools that process text in your browser and do not upload it, as the chunker above does, and keep the downloaded files in a place with the same access controls as the originals.
