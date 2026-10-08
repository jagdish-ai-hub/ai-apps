---
title: "How to Reduce Token Usage and Cut AI API Costs (Measured)"
description: "Practical ways to use fewer tokens in prompts and replies, with measured savings: shorter instructions, CSV instead of JSON, trimmed history, capped output and more."
h1: "How to reduce token usage"
lead: "Fewer tokens means lower cost, faster replies and more room in the context window. These tips come with measured counts, so you can see what each one is actually worth."
category: "Tokens"
tool: tokens
updated: "2026-10-08"
related: ["how-llm-api-pricing-works", "how-tokenizers-work", "tokens-in-different-languages"]
faq:
  - q: "What is the fastest way to cut token usage?"
    a: "Trim what you resend on every request: shorten the system prompt, drop old conversation turns or summarise them, and cap the length of replies. These apply to every call, so the savings repeat."
  - q: "Does removing whitespace and indentation save tokens?"
    a: "Only a little. Runs of spaces and line breaks usually merge into one token. In our test, removing indentation from a small Python function saved 4 tokens out of 25. Shortening wording and data formats saves much more."
  - q: "Is CSV cheaper than JSON for tables?"
    a: "Yes, usually by a lot, because JSON repeats every field name for every row. A five-row table took 174 tokens as pretty JSON and 55 as CSV in our test."
  - q: "Will shorter prompts make answers worse?"
    a: "They can if you remove information the model needs. Cut repetition and politeness, not requirements, and compare outputs before and after."
---

## Start with what repeats

A saving made once is worth little. A saving made on content sent with every request is multiplied by every call. Look first at:

1. The **system prompt** and standing instructions.
2. **Examples** included in the prompt.
3. **Tool definitions** you send each time.
4. **Conversation history** that gets resent.

Use the token calculator to count each of these separately, so you know where the tokens are.

## 1. Say it shorter

Politeness and repetition cost tokens and rarely help the model. We measured two versions of the same instruction with `o200k_base`:

- *"You are a helpful assistant. Please read the following customer review very carefully and then tell me, in a short answer, whether the customer sounds positive, negative or neutral about the product."* **37 tokens**
- *"Classify the review as positive, negative or neutral."* **11 tokens**

Same task, 70 percent fewer tokens. Over a million requests, that is 26 million fewer input tokens.

## 2. Ask for short answers

Output tokens are usually the pricier side. Ask the model for exactly the form you need, and set a maximum output length in the API.

- *"The sentiment of this review is positive."* **8 tokens**
- *"positive"* **1 token**

If your program only needs a label, ask for the label. Asking for a single word, a number, or a fixed set of values keeps output small and easy to parse.

## 3. Choose compact data formats

JSON repeats every key for every row. For tabular data, a different format is far cheaper. We encoded the same five-row table (first name, last name, age, city) four ways:

| Format | Tokens |
|---|---|
| Pretty-printed JSON | 174 |
| Minified JSON | 95 |
| Markdown table | 76 |
| CSV | 55 |

CSV used under a third of the tokens of pretty JSON. If you need JSON, at least minify it. A small four-field object dropped from 40 to 23 tokens when minified. If the model must reply in JSON, keep field names short.

## 4. Do not waste effort on whitespace

It is tempting to strip every space and line break. The saving is small, because tokenizers merge runs of whitespace: eight spaces in a row, or four line breaks, are one token each. Removing the indentation from a small Python function saved only 4 tokens out of 25. Keep your code readable, and spend your effort on wording and data format.

## 5. Trim or summarise conversation history

Every turn of a chat resends the earlier messages, so cost grows quickly, as we showed in [how LLM API pricing works](/guides/how-llm-api-pricing-works/). Ways to control it:

- Keep only the last few turns verbatim.
- Replace older turns with a short summary.
- Drop tool output and logs once they have been used.
- Start a fresh conversation when the topic changes.

## 6. Send only relevant context

Pasting a whole document when the question concerns one section is the most common waste. Split long documents into passages, retrieve only the passages that match the question, and send those. Several short, relevant passages beat one huge file for both cost and answer quality.

## 7. Use caching where available

If the start of your prompt is identical across requests, some providers charge less for the repeated part. Put stable material first, such as instructions and reference text, and the part that changes last, such as the user's question. Check your provider's rules for how much must match and how long the cache lasts.

## 8. Match the model to the task

A smaller, cheaper model often handles classification, extraction and formatting just as well as a large one. Test a small model first, and move up only where quality needs it.

## 9. Batch related work

If you need the same instructions applied to many short items, sending ten items in one request pays for the instructions once instead of ten times. Keep batches small enough that the model stays accurate and its output is easy to split.

## 10. Mind the language and the numbers

Non-English text can take more tokens, especially on older tokenizers, as the [tokens in different languages](/guides/tokens-in-different-languages/) comparison shows. Writing numbers without thousands separators also helps slightly: `1,000,000` is 5 tokens and `1000000` is 3 in our test.

## A simple workflow

1. Paste your real prompt into the token calculator and note the count.
2. Apply one change at a time, such as a shorter instruction or CSV instead of JSON.
3. Re-count after each change to see what it saved.
4. Compare answer quality before and after, so you do not trade accuracy for cost.
5. Add your prices to see the saving per request and across your volume.
