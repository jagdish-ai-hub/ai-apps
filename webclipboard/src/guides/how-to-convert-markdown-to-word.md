---
title: "How to Convert Markdown to a Word Document (.docx)"
description: "Convert Markdown to Word with real headings, lists, links, code blocks and tables. Includes how to copy ChatGPT answers into Word without stray symbols."
h1: "How to convert Markdown to a Word document"
lead: "Pasting Markdown into Word leaves stray symbols everywhere. Here is how to get proper headings, lists and tables, whether the text came from a README, a notes app or an AI chat."
category: "Convert and save"
updated: "2026-10-12"
tool: markdown-to-word
related: ["how-to-convert-markdown-to-pdf", "how-to-convert-text-to-word", "how-to-reduce-token-usage"]
faq:
  - q: "How do I convert Markdown to Word?"
    a: "Paste the Markdown into a Markdown to Word converter, check the preview and download the .docx. Headings, lists, links, code blocks and tables become real Word formatting."
  - q: "How do I copy a ChatGPT answer into Word without the symbols?"
    a: "Copy the answer with the chat's copy button, which keeps the Markdown, then paste it into a Markdown to Word converter and download the .docx. Pasting directly into Word leaves symbols such as ## and **."
  - q: "Will the headings work with Word's navigation pane?"
    a: "Yes, if the converter uses Word's built-in Heading styles, as the one linked in this guide does. The navigation pane, table of contents and style changes then work normally."
  - q: "Can I convert a Markdown table to a Word table?"
    a: "Yes. A correctly written Markdown table becomes a real Word table with a shaded header row and the column alignment you set."
  - q: "Do I need Pandoc?"
    a: "No. Pandoc is a powerful command-line tool but needs installation. A browser converter does the common cases in seconds without installing anything."
---

## Why pasted Markdown looks wrong in Word

Markdown describes formatting with symbols: `#` for headings, `**bold**`, `- item` for lists, `[text](url)` for links and pipes for tables. Word does not read those symbols. If you paste Markdown into Word, you get a document full of literal `#` and `**` characters and tables made of vertical bars.

A converter reads the symbols and writes the formatting Word understands. The result is an ordinary Word document you can edit, restyle and print.

## The quick way: a browser converter

Open <a href="/markdown-to-word/">Markdown to Word</a>, paste your Markdown, and check the preview. Choose the **font**, **size**, **page size** and **margins**, then press **Download Word file (.docx)**.

What you get:

- **Headings** from `#` to `######` as Word's Heading 1 to Heading 6 styles, so the navigation pane and an automatic table of contents work.
- **Lists**, including nested lists, with real bullets and numbering that restarts for each list.
- **Task lists** shown as ☐ and ☑ boxes.
- **Links** as clickable hyperlinks.
- **Code** in a shaded block with a monospace font, and `inline code` highlighted.
- **Block quotes** with an indent and a vertical bar.
- **Tables** with a shaded header row and column alignment.

Everything is built on your device; the text is never uploaded.

## Copying an AI answer into Word

This is the most common reason people need a converter. The steps:

1. In the chat, find the **copy** button on the answer. It copies the Markdown source. Selecting text with the mouse usually copies the displayed text and loses table structure.
2. Paste it into the converter. The preview shows how the document will look.
3. Download the .docx, open it and edit it as usual.

If the answer contains a table, check the preview to confirm the columns line up. Long answers are cheaper to produce if you ask for shorter replies; the guide to [reducing token usage](/guides/how-to-reduce-token-usage/) has tips on that.

## What does not convert

To keep the converter safe and private, a few things are left out:

- **Images:** the alt text is written instead. Insert pictures in Word afterwards.
- **Raw HTML:** shown as plain text.
- **Maths** (LaTeX) and **syntax colouring** in code: not rendered.
- **Footnotes and definition lists:** treated as ordinary text.

For books or papers that need those features, Pandoc, a command-line tool, is the standard answer.

## Other ways to do it

- **Pandoc:** `pandoc notes.md -o notes.docx` is powerful and scriptable, but needs an install.
- **Notes apps and editors:** Obsidian, Typora and VS Code extensions can export to Word.
- **Google Docs:** recent versions can detect Markdown you paste (look for a Markdown option under Tools, Preferences), which converts it into formatting. Check that your version has it.

For a one-off document on any device, the browser route is quicker than any of these.

## Tips for a tidy document

- Leave a **blank line** before lists, tables and code blocks.
- Put a **space after the `#`** of a heading.
- Use a serif font for reports and a sans-serif font for notes.
- After converting, open the document and check the table widths; Word adjusts them to the page.

If you only need to read or print the result, [converting Markdown to PDF](/guides/how-to-convert-markdown-to-pdf/) is quicker, and for text without Markdown see [converting text to Word](/guides/how-to-convert-text-to-word/).

## A small before-and-after example

Suppose a chat answer contains this Markdown:

```
## Weekly plan
- **Monday:** write the draft
- **Tuesday:** review with the team
```

Pasted straight into Word, you see the `##` and the `**` marks. After conversion, "Weekly plan" is a Heading 2, the two lines are a real bulleted list, and "Monday:" and "Tuesday:" are bold. You can then change the look of every heading at once from Word's Styles pane instead of editing each line by hand.

## After you have the Word file

Check three things before you send it: that the headings appear in the navigation pane (View, Navigation Pane in Word), that the tables fit the page width, and that any links open the right address. Add your own cover page, header or page numbers in Word if you need them. If the recipient only needs to read the document, export a PDF from Word, or use the PDF route described in the guide to [converting Markdown to PDF](/guides/how-to-convert-markdown-to-pdf/).

## Privacy

A browser-based converter keeps your text on your device. If the Markdown contains private notes, avoid services that ask you to upload a file, because they process it on their own servers.
