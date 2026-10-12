---
title: "How to Prepare a JSONL File for Fine-Tuning a Chat Model"
description: "The chat fine-tuning JSONL format explained: messages and roles, common errors, how many examples to use, counting tokens, and a free validator for the broken line."
h1: "How to prepare a JSONL file for fine-tuning"
lead: "A fine-tuning job is only as good as its training file, and the upload fails on the smallest formatting slip. Here is the format, the common errors and how to check the file before you pay for a run."
category: "AI answers"
updated: "2026-10-12"
tool: jsonl-fine-tuning-validator
related: ["how-to-chunk-text-for-rag", "how-llm-api-pricing-works", "how-to-reduce-token-usage"]
faq:
  - q: "What is JSONL?"
    a: "JSON Lines: a text file with one complete JSON object per line, no commas between lines and no blank lines. It is a common format for datasets because each line can be read on its own."
  - q: "What does a chat fine-tuning example look like?"
    a: "A line such as {\"messages\": [{\"role\": \"user\", \"content\": \"Hi\"}, {\"role\": \"assistant\", \"content\": \"Hello!\"}]}, with an optional system message first. Check your provider's current documentation for exact fields."
  - q: "How many examples do I need?"
    a: "Providers ask for a small minimum (OpenAI has asked for at least 10 examples) and recommend many more for good results. Quality and consistency matter more than a huge count."
  - q: "Why does my upload fail with an unclear error?"
    a: "Usually a line is not valid JSON, there is a blank line, a message has no role or content, or the file uses the older prompt and completion format. A validator lists the exact line for each."
  - q: "How is the cost of fine-tuning calculated?"
    a: "Typically by the number of tokens in the training file multiplied by the number of passes over it, at a price per token. Count tokens before you start and check your provider's current pricing."
---

## What a training file looks like

Chat models are fine-tuned with a file of example conversations in **JSON Lines (JSONL)** format. Each line is one complete JSON object, and each object is one training example: a list of **messages**, each with a **role** and some **content**. A minimal example, on one line, looks like this:

`{"messages": [{"role": "system", "content": "You are a concise support assistant."}, {"role": "user", "content": "How do I reset my password?"}, {"role": "assistant", "content": "Open Settings, choose Security, then Reset password."}]}`

The roles are normally **system** (instructions, usually first and optional), **user** (what the person says) and **assistant** (what you want the model to answer). Some providers also support roles for tool use. The model is trained to produce the assistant messages, so each example should contain at least one, and good examples end with the reply you want. Always read your provider's current documentation for the exact fields and limits, because they change.

## The mistakes that break uploads

- **A line that is not valid JSON.** A missing quote, a trailing comma or an unescaped line break inside a string. Line breaks inside text must be written as `\n`.
- **Blank lines.** An empty line between examples, or at the end of some files, is an error for many tools.
- **One big JSON array** instead of one object per line. JSONL is not a JSON list.
- **Missing keys.** An example with no `messages`, a message with no `role` or no `content`.
- **Wrong roles**, such as "bot" or "human".
- **The old format.** Older fine-tuning used `prompt` and `completion` keys; chat models expect `messages`.
- **Invisible problems**, such as a byte-order mark at the start of the file, or smart quotes that replaced straight quotes in a text editor.

The error message from an upload often names a problem but not the line. The [JSONL fine-tuning validator](/jsonl-fine-tuning-validator/) reads every line and reports the line number and the reason, in your browser, without uploading the file.

## Warnings worth reading

Some things are legal but suspicious: an example with no assistant reply, an example whose last message is from the user, a system message that appears after the first message, identical examples, and a file with very few examples. These are reported as warnings, because there are valid reasons for some of them, but each deserves a second look.

## How many examples, and what makes them good

Providers usually set a small minimum (OpenAI has asked for at least 10 examples; check the current figure) and suggest that results improve with more, often starting to show with tens to hundreds of good examples. Quality beats quantity: examples should be correct, consistent in tone and format, and representative of the real requests. Include the hard cases, not just the easy ones. Remove duplicates and contradictions, and keep a separate set of examples aside to test the result on cases the model has not seen.

## Count the tokens

Training cost normally depends on the number of **tokens** in your file and the number of passes over it. The validator counts the tokens in the text of every message with OpenAI's tokenizers and shows the total, the average, the median and the largest example. Counts cover message text only; chat formatting adds a few tokens per message that are not included, and other providers tokenise differently, so confirm with your provider. Use the [token calculator](/token-calculator/) with your provider's price per million tokens to estimate the cost, and read [how LLM API pricing works](/guides/how-llm-api-pricing-works/) for how input and output prices differ. Long examples cost more and may exceed a per-example limit, so check the largest one.

## Reduce tokens without hurting quality

Examples that repeat a long system prompt every time pay for it every time. If a short instruction is enough after fine-tuning, shorten it. Trim greetings and filler from the assistant replies unless you want the model to say them. The guide to [reducing token usage](/guides/how-to-reduce-token-usage/) has more ideas, and if you are working with a long document rather than training data, see [chunking text for RAG](/guides/how-to-chunk-text-for-rag/).

## Privacy

Training data often contains customer conversations or internal text. Remove personal information before you build the file, check where a tool sends your data, and prefer validators that run in your browser. Keep the file in storage with the same protections as the original data.
