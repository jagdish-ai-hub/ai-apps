---
title: "How LLM API Pricing Works: Input, Output and Context Costs"
description: "Understand per-token pricing for AI APIs: input vs output prices, context windows, chat history growth and hidden costs, with worked examples and a formula."
h1: "How LLM API pricing works"
lead: "Most AI APIs bill by the token, with one price for what you send and another for what the model writes back. Here is the formula, a worked example, and the costs that catch people out."
category: "Tokens"
tool: tokens
updated: "2026-10-08"
related: ["how-to-reduce-token-usage", "how-many-tokens-in-a-word-or-page", "how-tokenizers-work"]
faq:
  - q: "Why are output tokens usually priced higher than input tokens?"
    a: "Generating text is more computationally expensive than reading it, so providers typically charge more for output. The exact ratio varies by provider and model, so always check the current pricing page."
  - q: "What does price per 1 million tokens mean?"
    a: "It is the cost of processing one million tokens. To price a request, divide the token count by 1,000,000 and multiply by the price. 2,000 tokens at 2.50 per million costs 0.005."
  - q: "Why does a chat get more expensive as it goes on?"
    a: "Each new message usually resends the earlier conversation as input, so the input tokens per request grow with every turn."
  - q: "Do hidden or reasoning tokens cost money?"
    a: "With some reasoning models, the hidden thinking the model does before answering is billed as output tokens even though you do not see it. Check how your model bills reasoning."
---

## The basic formula

Most providers publish prices **per 1 million tokens**, with separate rates for input and output:

> **cost = (input tokens ÷ 1,000,000 × input price) + (output tokens ÷ 1,000,000 × output price)**

The token calculator does this for you: paste your text to get the input token count, enter both prices, set the expected output length and the number of requests.

## Input, output and why they differ

- **Input tokens** are everything you send: your question, system instructions, earlier conversation, documents you attach and tool definitions.
- **Output tokens** are what the model writes back.

Providers generally charge more per output token than per input token, because generating text costs more computing than reading it. The size of the gap changes by provider and model, and prices change often, which is why the calculator has no built-in price list. Type in the numbers from the pricing page you are using.

## A worked example

These are made-up round prices for illustration only, not any real model's rates: **2.00 per million input tokens** and **8.00 per million output tokens**.

A request sends 3,000 input tokens (instructions plus a document) and receives 500 output tokens.

- Input: 3,000 ÷ 1,000,000 × 2.00 = **0.006**
- Output: 500 ÷ 1,000,000 × 8.00 = **0.004**
- Total per request: **0.010**

Run it 10,000 times and the total is **100**. Small per-request costs add up quickly at volume, so it pays to check the maths before launching a feature.

## Why chats cost more than you expect

A language model has no memory between requests. To continue a conversation, your application sends the earlier messages again as input. So the input grows every turn.

Take a chat where each of your messages is 200 tokens and each reply is 200 tokens, resending the full history each time:

| Turn | Input tokens sent | Output tokens |
|---|---|---|
| 1 | 200 | 200 |
| 2 | 600 | 200 |
| 3 | 1,000 | 200 |
| 10 | 3,800 | 200 |

Across ten turns, you send **20,000 input tokens** to receive **2,000 output tokens**. The total content of the conversation is only about 4,000 tokens, but you paid for 20,000 on the input side. Long-running chats and agents are where most surprise bills come from. Summarising or trimming old turns is the standard fix; see [how to reduce token usage](/guides/how-to-reduce-token-usage/).

## Costs that are easy to miss

- **System prompts.** A 1,000-token instruction block is paid for on every single request.
- **Tool and function definitions.** The descriptions of tools you offer count as input tokens each time.
- **Few-shot examples.** Examples in the prompt are billed on every call.
- **Retrieved documents.** If your app adds search results or file contents to each request, that text is input.
- **Images and audio.** These are converted to tokens too, often many more than you would guess.
- **Reasoning tokens.** Some models think before answering, and that hidden reasoning can be billed as output.
- **Retries.** A failed or repeated request is paid for again.
- **Chat formatting overhead.** Message roles and separators add a few tokens per message that raw text counts do not include.

## Discounts that may exist

Many providers offer ways to pay less, though the details change, so confirm them on the provider's page:

- **Cached input** at a lower price when the start of your prompt repeats between requests.
- **Batch processing** at a discount when you can wait for results instead of getting them immediately.
- **Smaller models** that cost a fraction of the flagship model's price and handle simple tasks well.

## Context windows and limits

Every model has a maximum number of tokens per request: the **context window**. It covers input and output together. Providers also apply **rate limits**, often measured in tokens per minute, so a very long prompt can hit a limit even when your request count is low. The calculator's "Does it fit?" section shows your text against common window sizes.

## A quick pre-launch checklist

1. Count the tokens in a typical request, including system prompt and any documents.
2. Estimate a typical output length and set a maximum for it.
3. Multiply by expected requests per day and by 30.
4. Add a margin for retries and growth in conversation length.
5. Compare two or three models; the cheapest one that does the job is the right one.
