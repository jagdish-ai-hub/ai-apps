---
title: "How to Remove Markdown Symbols From ChatGPT Text (Asterisks, Hashes)"
description: "Remove the asterisks, hashes and pipes from AI-written text for email, messages and forms: why they appear, a free tool, manual fixes and how to ask for plain text."
h1: "How to remove Markdown symbols from ChatGPT text"
lead: "AI answers often arrive full of asterisks, hash signs and vertical bars. Here is where they come from and the quickest ways to get clean plain text."
category: "AI answers"
updated: "2026-10-12"
tool: strip-markdown
related: ["how-to-copy-chatgpt-answer-into-word", "how-to-save-chatgpt-answer-as-pdf", "how-to-change-text-case"]
faq:
  - q: "Why does AI text contain asterisks and hash signs?"
    a: "Assistants write in Markdown, where **word** means bold, ## means a heading and - means a bullet. The chat window renders them as formatting. Pasted elsewhere, the symbols appear literally."
  - q: "How can I remove them quickly?"
    a: "Paste the text into a Markdown stripper. It removes the symbols and keeps the words, lists and numbers, so you can copy clean plain text."
  - q: "Can I stop the assistant from using Markdown?"
    a: "Usually, by asking for it: say 'plain text only, no Markdown or special formatting'. The answer may still include some formatting, so check it before you paste."
  - q: "What happens to tables when the symbols are removed?"
    a: "Each row becomes a line with cells separated by a vertical bar, which stays readable in plain text. If you need a real table, convert to Word or paste into a spreadsheet instead."
  - q: "Will find and replace work?"
    a: "For a few symbols, yes. Replacing ** with nothing removes bold marks. But headings, lists, links and tables need more than one rule, which is why a converter is faster for long answers."
---

## Where the symbols come from

AI assistants write in **Markdown**: a set of plain-text conventions for formatting. `**bold**` means bold, `*italic*` means italic, a line starting with `##` is a heading, lines starting with `-` or `1.` are lists, backticks mark code, `[text](address)` is a link, and a table is made of vertical bars. A chat window turns those into real formatting. An email, a text message, a form field or a spreadsheet cell does not, so there the symbols show up as clutter.

## The quick way: a Markdown stripper

The [Strip Markdown](/strip-markdown/) tool removes the symbols and keeps the content:

1. Paste the text into the top box.
2. The plain text appears below as you type.
3. Press **Copy plain text** and paste it where you need it.

It turns headings into plain lines, removes the marks around bold and italic words, keeps the text of links, keeps code characters, changes bullets to "•", keeps the numbers of numbered lists, and writes table rows as lines with the cells separated by " | ". Links are reduced to their text, so if you need the addresses, copy them first. The conversion runs in your browser, and your text is not uploaded.

## Fixing it by hand

For short text you can remove the symbols yourself with find and replace:

- Replace `**` with nothing to remove bold marks, and do the same for `__`.
- Replace `## ` and `# ` at the start of lines with nothing. In many editors you can use a regular expression such as `^#+\s*`.
- Replace `- ` at the start of a line with "• " or a number you type.
- Remove backticks.

This works for a paragraph or two. It becomes slow and error-prone for long answers with tables and links, which is where a converter saves time. Be careful that find and replace does not remove an asterisk that is part of the real text, for example in a footnote or a multiplication.

## Ask for plain text in the first place

You can often avoid the problem by asking. Add a line such as "Reply in plain text only, with no Markdown, no bullet symbols and no bold" to your request. Assistants usually follow it, though a long answer may still slip some formatting in, so check before pasting. If you are building an app that shows model output, you can also say this in the system prompt, and many chat interfaces let you save such an instruction as a custom setting.

## When to keep the formatting instead

If the answer is going into a document, the formatting is worth keeping; you just want it as real formatting. Convert it to a Word file with the guide to [copying a ChatGPT answer into Word](/guides/how-to-copy-chatgpt-answer-into-word/), or save it as a PDF with [how to save a ChatGPT answer as a PDF](/guides/how-to-save-chatgpt-answer-as-pdf/). For a spreadsheet, paste a table into the first cell, then split the text by the "|" separator.

## A worked example

Suppose the assistant gives you this:

```
## Meeting recap
**Decisions**
- Launch moves to *November*
- Ben sends the price list
```

Pasted into an email as it is, the recipient sees the hash signs and asterisks. After stripping the Markdown, it reads "Meeting recap", then "Decisions", then two lines starting with a bullet: "Launch moves to November" and "Ben sends the price list". The words are the same, and nothing is left to confuse a reader who does not use Markdown. If you need the headings to stand out in plain text, add a blank line before each one or write them in capitals yourself.

## What you may still need to fix

A few things survive any conversion. Nested lists are indented with spaces, which some email programs collapse. Long lines may wrap in unexpected places in plain-text email. Characters such as the bullet "•" are fine in modern programs but can show as a question mark in very old systems; replace them with a hyphen if that happens. Always read the result once before you send it.

## Tidying the case and spacing afterwards

After removing the symbols you may want to fix capital letters. The guide to [changing text case](/guides/how-to-change-text-case/) covers sentence case, title case and other styles, and a [case converter](/case-converter/) does it in one click. If the text came out with doubled spaces or extra blank lines, a quick pass in your editor will clean those.

## Privacy

AI answers can contain information you would not post publicly. Use a tool that processes text in your browser and does not upload it, and check the result before you send it on.
