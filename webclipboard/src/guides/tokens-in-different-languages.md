---
title: "Tokens in Different Languages: Why Hindi, Thai and Japanese Cost More"
description: "We measured the same sentence in 11 languages with two OpenAI tokenizers. See why some scripts use up to four times as many tokens and how to plan for it."
h1: "Tokens in different languages"
lead: "The same message can use very different numbers of tokens depending on the language. We measured one sentence in 11 languages with two tokenizers to show how big the gap is, and how much it has narrowed."
category: "Tokens"
tool: tokens
updated: "2026-10-08"
related: ["how-tokenizers-work", "how-many-tokens-in-a-word-or-page", "how-llm-api-pricing-works"]
faq:
  - q: "Why do some languages use more tokens?"
    a: "A tokenizer's vocabulary is built from training text. If most of that text is English, English words become single tokens while words in other scripts are split into small pieces or even bytes."
  - q: "Is the newer tokenizer better for non-English text?"
    a: "In our measurements, yes. The same Hindi sentence took 69 tokens with cl100k_base and 25 with o200k_base. English barely changed."
  - q: "Does fewer characters mean fewer tokens?"
    a: "Not necessarily. Japanese and Chinese use fewer characters than English for the same meaning, but each character is often one or more tokens, so the counts are closer than the character counts suggest."
  - q: "Should I write my prompts in English to save money?"
    a: "Instructions in English often use fewer tokens, but the best language for a prompt depends on your task and the quality you need. Test both for cost and for answer quality before deciding."
---

## The experiment

We took one sentence from this site, the tagline "Copy text on one device and paste it on another, no app, no account", in its original English and in ten translations. We counted tokens with both OpenAI vocabularies in use today: the older `cl100k_base` (GPT-4 and GPT-3.5 era) and the newer `o200k_base` (GPT-4o and later). Every language says the same thing, so the comparison is fair as a sample, though a single sentence is an illustration and not a statistical study.

## Results

| Language | Characters | Tokens, o200k_base | Tokens, cl100k_base | Characters per token (o200k) |
|---|---|---|---|---|
| English | 69 | 17 | 17 | 4.1 |
| Spanish | 68 | 18 | 19 | 3.8 |
| French | 80 | 20 | 22 | 4.0 |
| German | 84 | 20 | 22 | 4.2 |
| Russian | 86 | 21 | 34 | 4.1 |
| Vietnamese | 103 | 28 | 46 | 3.7 |
| Korean | 44 | 27 | 34 | 1.6 |
| Chinese (Simplified) | 29 | 21 | 31 | 1.4 |
| Japanese | 40 | 30 | 38 | 1.3 |
| Hindi | 71 | 25 | 69 | 2.8 |
| Thai | 81 | 29 | 75 | 2.8 |

## What the numbers say

**Latin-script languages are cheap on both tokenizers.** Spanish, French and German need only one to three more tokens than English, and the two vocabularies give almost the same count.

**The older tokenizer was hard on some scripts.** With `cl100k_base`, the Hindi sentence needed 69 tokens, about four times the English 17. Thai needed 75, more than four times. Russian needed 34, twice the English count. These scripts were split into many small pieces, often down to bytes.

**The newer tokenizer closed most of the gap.** With `o200k_base`, the Hindi sentence dropped from 69 to 25 tokens, and Thai from 75 to 29. That is about one and a half to one and three-quarter times the English count, instead of four times.

**Chinese, Japanese and Korean are compact in characters but not in tokens.** The Chinese sentence is only 29 characters but needs 21 tokens, so each character costs about three-quarters of a token. Japanese is 40 characters and 30 tokens. If you estimate by character count and a four-characters-per-token rule, you will undercount these languages by a large margin.

## Why this happens

A tokenizer's vocabulary is learned from a sample of text. When that sample is mostly English, common English words earn their own vocabulary entries. Scripts that appear less often get fewer long entries, so their words are cut into small fragments. A bigger vocabulary, and a training sample with more multilingual text, gives those scripts more whole-word and whole-syllable entries. That is the difference we see between the two OpenAI vocabularies. For more on how entries are formed, read [how tokenizers work](/guides/how-tokenizers-work/).

## What it means for cost and limits

- **Cost scales with tokens.** If a Hindi message uses four times the tokens of the English equivalent, it costs four times as much to send at the same per-token price. On the newer tokenizer the multiple is closer to one and a half.
- **Context windows hold less.** A window that holds roughly 96,000 English words may hold far fewer words of Thai or Japanese on an older tokenizer.
- **Other providers differ again.** Different models use different tokenizers, so the ratios above do not carry over exactly. Measure with your provider's own counter.

## Practical advice

1. **Count real text, not assumptions.** Paste a typical message in your language into the token calculator and compare both tokenizers.
2. **Prefer models with newer tokenizers** if you process a lot of non-English text. The saving can be large.
3. **Do not estimate by characters** for Chinese, Japanese, Korean, Hindi or Thai. Use token counts.
4. **Budget with a margin.** Mixed-language documents, with names, URLs and code in Latin script, will land between the extremes.
5. **Test the prompt language.** English instructions are often cheaper, but if the answers get worse, the saving is not worth it. Measure both cost and quality.
6. **Watch the output side too.** The reply is billed in tokens as well, and a reply in Thai or Hindi uses more tokens than the same reply in English. See [how LLM API pricing works](/guides/how-llm-api-pricing-works/).
