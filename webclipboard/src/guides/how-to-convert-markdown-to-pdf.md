---
title: "How to Convert Markdown to PDF (Free, No Install)"
description: "Convert Markdown to a formatted PDF with headings, lists, code and tables: browser tool, VS Code, Pandoc and AI answers compared, with tips to avoid common problems."
h1: "How to convert Markdown to PDF"
lead: "Markdown is great for writing and awkward for sharing. This guide shows the quickest ways to turn a Markdown document, a README or an AI answer into a clean PDF."
category: "Convert and save"
updated: "2026-10-12"
tool: markdown-to-pdf
related: ["how-to-convert-markdown-to-word", "how-to-convert-text-to-pdf", "share-code-snippets-online"]
faq:
  - q: "What is the easiest way to convert Markdown to PDF?"
    a: "Paste the Markdown into a browser-based Markdown to PDF tool, check the preview and use Save as PDF. It needs no installation and works on phones as well as computers."
  - q: "Can I convert a ChatGPT answer to PDF?"
    a: "Yes. AI answers are written in Markdown. Copy the answer, ideally with the chat's copy button, paste it into a Markdown to PDF tool and save the result. Headings, lists, code blocks and tables are kept."
  - q: "Why do some of my Markdown tables look broken?"
    a: "Markdown tables need a header row followed by a separator row such as |---|---|, and every row should use the same number of pipe characters. A missing separator line is the usual cause."
  - q: "Are images included in the PDF?"
    a: "Not in a privacy-first browser converter, because it does not load images from other sites. The alt text is shown instead. Tools that run on your computer, such as Pandoc, can embed local images."
  - q: "Does Markdown to PDF work for other languages?"
    a: "Yes, if the converter uses your device's fonts. A browser tool does, so Japanese, Chinese, Hindi, Arabic and other scripts print correctly."
---

## What Markdown to PDF needs to do

Markdown is plain text with a few symbols that describe structure: `#` for headings, `*` or `-` for lists, `**bold**`, backticks for code and pipes for tables. A converter must read those symbols, lay the result out on pages and save a PDF. The best ones also show a **preview**, so you can fix a missing blank line or a broken table before saving.

## The quick way: a browser tool

Open the <a href="/markdown-to-pdf/">Markdown to PDF</a> tool, paste your Markdown and look at the preview. Choose a font, size, page size and margins, then press **Save as PDF** and choose **Save as PDF** in the print window.

It supports headings, bold, italic, strikethrough, nested lists, task lists, links, inline code, fenced code blocks, block quotes, horizontal rules and aligned tables. It runs entirely in your browser, so private notes are not uploaded, and it works in every language because it uses your device's fonts.

## Converting an AI chat answer

AI assistants write their answers in Markdown. The fastest workflow:

1. Use the assistant's **copy** button under the answer. It copies the Markdown source, including the symbols.
2. Paste into the converter. The preview should show real headings, lists and tables.
3. Save the PDF.

If you select the answer with the mouse instead, you usually copy rendered text without the symbols, which loses the tables. The same Markdown can become a Word file with [Markdown to Word](/guides/how-to-convert-markdown-to-word/) when you need to edit it.

## Other ways to convert Markdown

- **VS Code:** with a Markdown PDF extension you can export a file from the editor. It suits people who already work in VS Code.
- **Pandoc:** a command-line converter. `pandoc notes.md -o notes.pdf` creates a PDF, and it is excellent for long documents, but it needs a LaTeX or other PDF engine installed and extra setup for non-Latin scripts.
- **Notes apps:** Obsidian, Typora and others have an Export to PDF command.
- **GitHub:** open the README, then use your browser's print function, though the page includes GitHub's menus unless you choose the print view.

For one-off conversions on any device, the browser tool is faster than installing software.

## Fixing common problems

- **A list or heading is shown as plain text.** Markdown needs a **blank line** before lists and tables, and a space after the `#` of a heading (`# Title`, not `#Title`).
- **A table is broken.** Check that the second line is a separator (`|---|---|`) and that each row has the same number of columns.
- **Lines run together.** In Markdown a single line break does not start a new paragraph. Leave a blank line, or end the line with two spaces.
- **Code is not formatted.** Wrap it in three backticks on a line of its own before and after.
- **Raw HTML disappears.** For safety, browser converters show it as text. Rewrite it in Markdown.

## Getting a good-looking result

- Pick a **serif font at 11 or 12 pt** for reports and a **sans-serif font** for notes.
- Use **normal margins** for documents that will be printed, narrow margins for wide tables.
- Break long tables into smaller ones; wide tables are scaled to the page width.
- The PDF is always black on white, whichever theme the page uses on screen.

## Sharing the PDF

Send the PDF as an email attachment, upload it to a form, or move it from your phone to a computer by sending the text, not the file, through the [online clipboard](/): paste, note the code and open it on the other device. For code snippets in particular, the guide to [sharing code snippets online](/guides/share-code-snippets-online/) has more options.

## Privacy

If your Markdown contains private notes, keep the conversion on your own device. Browser tools that convert locally never send the text away, while services that ask you to upload a file process it on their servers.
