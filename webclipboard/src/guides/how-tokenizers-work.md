---
title: "How Tokenizers Work: BPE, Vocabularies and Token IDs Explained"
description: "A plain-English explanation of how language-model tokenizers split text into tokens with byte-pair encoding, with real examples and token ids from OpenAI's tokenizers."
h1: "How tokenizers work"
lead: "Before a language model can read your text, a tokenizer turns it into numbers. Here is how that works, why \"HELLO\" and \"hello\" cost different amounts, and what the shaded blocks in the token calculator mean."
category: "Tokens"
tool: tokens
updated: "2026-10-08"
related: ["how-many-tokens-in-a-word-or-page", "tokens-in-different-languages", "how-to-reduce-token-usage"]
faq:
  - q: "What is a token in a language model?"
    a: "A token is a chunk of text from the model's fixed vocabulary. It can be a whole word, part of a word, a number, a space with a word attached, a symbol or even a single byte of a character."
  - q: "What is byte-pair encoding?"
    a: "Byte-pair encoding, or BPE, is a method that builds a vocabulary by repeatedly merging the most frequent pair of adjacent pieces in a large body of text. The resulting merge rules are used to split any new text into tokens."
  - q: "Why does the same word have different token counts in different forms?"
    a: "Because the vocabulary contains specific strings. A common lowercase word with a leading space may be a single entry, while the capitalised, uppercase or misspelled version may be split into several pieces."
  - q: "Do all AI models use the same tokenizer?"
    a: "No. Each model family trains its own tokenizer, so the same text can have different token counts and different token ids between providers, and even between generations of the same provider."
---

## Models read numbers, not letters

A neural network can only work with numbers. A tokenizer is the translation layer: it takes your text, cuts it into pieces called **tokens**, and replaces each piece with an integer id from a fixed table, the **vocabulary**. The model receives the list of ids, predicts the next id, and the tokenizer converts the answer back into text.

You can see this in the token calculator. The phrase `hello world` becomes two tokens. In OpenAI's `cl100k_base` vocabulary, those are the ids `15339` and `1917`. In the newer `o200k_base` vocabulary, they are `24912` and `2375`. Different vocabulary, different ids, and the model that uses each one has learned its own meaning for them.

## Where the vocabulary comes from: byte-pair encoding

Most modern tokenizers are built with **byte-pair encoding (BPE)**. The idea is simple:

1. Start with the smallest possible pieces, such as individual bytes.
2. Look through a huge collection of text and find the pair of neighbouring pieces that appears most often.
3. Merge that pair into one new piece and add it to the vocabulary.
4. Repeat thousands of times until the vocabulary reaches a chosen size.

The result is a vocabulary where very common strings, such as ` the`, `ing` or `tion`, are single entries, and rare strings are built from smaller ones. OpenAI's `cl100k_base` has roughly 100,000 entries and `o200k_base` has roughly 200,000. A bigger vocabulary can hold longer pieces for more languages and for code, so the same text often becomes fewer tokens.

## How a piece of text is actually split

When you send text, the tokenizer first uses a pattern to cut it into rough chunks, such as words, numbers, punctuation and whitespace. Then it applies the learned merges inside each chunk. A few consequences follow from that:

- **Leading spaces belong to the next word.** ` hello` with a space is its own vocabulary entry, separate from `hello`. Most English words are one token with their space attached.
- **Case matters.** `hello` is one token, but `HELLO` is two tokens in both vocabularies, because the uppercase form is rarer in training text.
- **Long or rare words break into pieces.** `tokenization` is two tokens, `unbelievable` is three, and `antidisestablishmentarianism` is six.
- **Numbers are cut into chunks.** `2026` is two tokens, while `1234567` takes three.
- **Whitespace runs are cheap.** Eight spaces in a row, or four line breaks, each count as a single token.
- **Web addresses and emails are expensive.** A URL such as `https://webclipboard.online/guides/share-wifi-password/` takes 13 tokens, and `jane.doe@example.com` takes 6, because they contain many unusual strings.

These counts are real results from the `o200k_base` tokenizer, and you can reproduce all of them in the calculator.

## Why it still works for any text: bytes

A tokenizer must be able to represent any character, including ones that did not appear in training. Byte-level BPE solves this by falling back to raw bytes. An emoji such as 🌍 is made of four bytes. A tokenizer that has seen it often learns a merge for it; one that has not will spell it out in several byte tokens. That is why the 🌍 emoji costs two tokens in `o200k_base` and three in `cl100k_base`, and why a family emoji made of several joined characters can cost 11 or 18 tokens.

This also explains the occasional odd block in the token view: one token can be only part of a character. The calculator groups such fragments together so you can read them.

## Special tokens

Vocabularies also contain **special tokens** that are not ordinary text, for example markers that mean "end of text" or that separate the system message from the user message. If your text happens to contain the literal characters of a special marker, the calculator treats them as ordinary text so that you get a count of what you typed.

## Why this matters in practice

- **Cost.** Providers bill per token, so a text with more tokens costs more. See [how LLM API pricing works](/guides/how-llm-api-pricing-works/).
- **Context limits.** The model's window is measured in tokens, not words, so your document may fit or not depending on how it tokenizes.
- **Odd model behaviour.** Models see tokens, not letters. That is one reason they can struggle to count the letters in a word or do long arithmetic: a number like `1234567` is not seen digit by digit.
- **Language fairness.** Vocabularies trained mostly on English are less efficient for other scripts. We measured this in [tokens in different languages](/guides/tokens-in-different-languages/).
- **Prompt design.** Small wording and formatting choices change counts. See [how to reduce token usage](/guides/how-to-reduce-token-usage/).

## Try it yourself

Open the token calculator, paste a sentence and look at the shaded blocks. Then change the case of a word, add an emoji, paste a URL, and switch between `o200k_base` and `cl100k_base`. Watching the boundaries move is the fastest way to build intuition for how tokenizers behave.
