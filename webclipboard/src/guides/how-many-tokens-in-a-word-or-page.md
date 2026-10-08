---
title: "How Many Tokens Is a Word, a Page or a Book? Rules of Thumb"
description: "Quick conversions between words, characters and tokens, with measured examples for prose, code, JSON and URLs, and what common context window sizes hold."
h1: "How many tokens is a word, a page or a book?"
lead: "You rarely have a tokenizer open when you plan a prompt. These rules of thumb get you close, and the measured examples show where they break."
category: "Tokens"
tool: tokens
updated: "2026-10-08"
related: ["how-tokenizers-work", "how-llm-api-pricing-works", "tokens-in-different-languages"]
faq:
  - q: "How many tokens are in 1,000 words?"
    a: "For ordinary English prose, roughly 1,300 tokens, using the common rule that 100 tokens is about 75 words. Technical text, code and unusual names push the number higher."
  - q: "How many characters is one token?"
    a: "About four characters in English prose. We measured 4.58 characters per token on one paragraph. For Japanese or Chinese it is closer to one or two characters per token."
  - q: "How many words fit in a 128K context window?"
    a: "Roughly 96,000 English words, if nothing else uses the window. The reply and any system instructions also count, so plan for less."
  - q: "Why is my count higher than the rule of thumb?"
    a: "Code, numbers, URLs, emoji, non-English text and unusual formatting all split into more tokens than plain English prose, so a rule built on prose underestimates them."
---

## The two rules that get you most of the way

For English prose, two conversions are worth remembering:

- **1 token is about 4 characters.**
- **100 tokens is about 75 words**, or about 1.33 tokens per word.

We checked both on a real paragraph from this site: 293 characters and 57 words became 64 tokens with `o200k_base`. That is 4.58 characters per token and 1.12 tokens per word, a little better than the rule because the paragraph used short common words. Treat the rules as a middle estimate, not a guarantee.

## Words to tokens

| Text | Words | Approx. tokens (rule of thumb) |
|---|---|---|
| A short email | 100 | 130 |
| A one-page document | 500 | 670 |
| A long blog post | 1,500 | 2,000 |
| A research paper | 8,000 | 10,700 |
| A short novel | 50,000 | 67,000 |

## What fits in a context window

A context window is the total number of tokens a model can handle in one request, including your input, any instructions and the reply. Converting common window sizes into English words (at 0.75 words per token):

| Context window | Approx. words | Roughly equal to |
|---|---|---|
| 8K (8,192) | 6,100 | A long magazine article |
| 32K (32,768) | 24,500 | A short story collection |
| 128K | 96,000 | A full-length novel |
| 200K | 150,000 | A very long novel |
| 1M | 750,000 | Several full-length books at once |

Remember to leave room for the answer. If you paste 120,000 tokens into a 128K window, there is little space left for the model to write.

## Where the rules of thumb fail

Prose is the easy case. These measured examples, all with `o200k_base`, show how other kinds of text behave:

| Text | Characters | Tokens | Characters per token |
|---|---|---|---|
| English paragraph | 293 | 64 | 4.6 |
| Small JavaScript function with a console call | 62 | 23 | 2.7 |
| Pretty-printed JSON object (4 fields) | 100 | 40 | 2.5 |
| Same JSON, minified | 70 | 23 | 3.0 |
| A web address | 55 | 13 | 4.2 |
| An email address | 20 | 6 | 3.3 |
| The number 1234567 | 7 | 3 | 2.3 |

Code and structured data produce fewer characters per token than prose because of punctuation, short identifiers and symbols. If your input is mostly code or JSON, plan for roughly 2.5 to 3 characters per token, not 4.

## Other languages

The four-characters rule is an English rule. In our tests, Japanese and Chinese averaged about 1.3 to 1.4 characters per token, and Hindi and Thai about 2.8. If your text is not English, measure it. See [tokens in different languages](/guides/tokens-in-different-languages/) for the full comparison.

## How to estimate quickly without a tool

1. **Count words.** Most word processors show a word count.
2. **Multiply by 1.33** for ordinary English text.
3. **Add a safety margin** of 10 to 20 percent, more if the text has code, tables, numbers, URLs or non-English passages.
4. **Add the expected reply length** and compare the total with the context window.

## Measure your own ratio in two minutes

The best rule of thumb is the one built from your own text. If you process the same kind of content repeatedly, such as support tickets, product descriptions or meeting notes, calibrate once:

1. **Pick three to five typical samples**, including a short one, a long one and an awkward one with names, numbers or links.
2. **Paste each into the token calculator** and note the characters-per-token figure it shows.
3. **Average the results.** That number replaces the generic four characters per token.
4. **Re-check when the content changes.** A switch from plain prose to tables, code or another language changes the ratio.

With a calibrated ratio you can estimate a whole batch from its total character count, which is often available without opening any file.

## Common estimating mistakes

- **Counting only your question.** The system prompt, earlier turns and attached documents are all input.
- **Forgetting the reply.** Output tokens count towards the context window and are usually billed at a higher rate.
- **Using word counts for code.** Code has few spaces, so word counters understate it badly.
- **Using character counts for Chinese, Japanese or Korean.** One character is often about one token, so dividing by four undercounts by a wide margin.
- **Mixing up tokenizers.** A count from one model's tokenizer is only a guide for another model's.

## When to use an exact count

A rough estimate is enough for planning. Use an exact count when:

- You are close to a context limit and a truncated prompt would break something.
- You are estimating a large bill, such as processing thousands of documents.
- Your content is code, JSON, or another language.
- You are comparing two prompt designs to see which is cheaper.

Paste the text into the token calculator for an exact count with OpenAI's tokenizers. Other providers use different tokenizers, so for their models treat the number as a close guide and confirm with their own counter, as explained in [how tokenizers work](/guides/how-tokenizers-work/).
