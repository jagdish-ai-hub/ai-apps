---
title: "How to Count Words and Characters, and Work Out Reading Time"
description: "Count words, characters with and without spaces, sentences and reading time. Includes character limits, how Japanese and Chinese are counted and why tools differ."
h1: "How to count words and characters (and reading time)"
lead: "Essays have word limits, posts have character limits, and speeches have time limits. Here is how to count each, what the counts really mean, and where tools disagree."
category: "Text tools"
updated: "2026-10-12"
tool: word-counter
related: ["how-to-change-text-case", "how-many-tokens-in-a-word-or-page", "how-to-convert-text-to-word"]
faq:
  - q: "What is the difference between characters with and without spaces?"
    a: "Characters with spaces count every symbol including spaces, tabs and line breaks. Characters without spaces leave out all whitespace. Check which one a limit refers to."
  - q: "How is reading time worked out?"
    a: "By dividing the word count by an average reading speed, commonly around 200 to 250 words a minute for adults. For Japanese, Chinese and Korean, characters per minute are used instead."
  - q: "Why does my word count differ between programs?"
    a: "Programs treat hyphenated words, numbers, symbols and line breaks differently. A word processor, a website and a school system can give slightly different counts for the same text."
  - q: "How are words counted in languages without spaces?"
    a: "A tool must find word boundaries with a dictionary or segmentation rules. Browsers include word segmenters for Japanese, Chinese and Thai. Many limits for these languages are set in characters instead."
  - q: "Are tokens the same as words?"
    a: "No. Tokens are the pieces an AI model reads, and the ratio to words depends on the language. Use a token counter for AI prompts and a word counter for essays."
---

## Words, characters and what they count

A **word count** is the number of words. A **character count** is the number of symbols, and it comes in two kinds: **with spaces**, which includes spaces, tabs and line breaks, and **without spaces**, which leaves all whitespace out. Sentences and paragraphs are counted by punctuation and blank lines. The [word counter](/word-counter/) shows all of these as you type, plus lines and the size of the text in bytes.

Whenever you are given a limit, check which count it refers to. "500 characters" for a form field normally includes spaces; an academic limit is almost always in words; a design brief might say "about 40 characters per line". The same text gives different numbers depending on the rule.

## Why counts differ between tools

There is no single official definition of a word. A word processor splits on spaces and then makes decisions about hyphens ("well-known": one word or two?), numbers, symbols standing alone, and URLs. A website's counter may split on punctuation as well. Your school's submission system may count differently from the program you wrote in. If a limit is strict, count with the program the person checking will use, and leave a small margin.

## Languages without spaces

Japanese, Chinese and Thai are written without spaces between words, so counting words means finding the boundaries first. Modern browsers include a word segmenter that does this with dictionary-based rules, and the word counter uses it. The result is a good estimate but not a rule, and for these languages limits are usually set in **characters** instead. Korean uses spaces between phrases, but its words carry endings that make "word" a looser idea too. Emoji and rare characters count as one character in the counter, though some systems store them as two or more units, which is why a field can fill up sooner than the count suggests.

## Reading time and speaking time

Reading time is the word count divided by a reading speed. Studies of silent reading by adults put typical non-fiction reading at around 200 to 250 words a minute, and the counter uses about 238. Slow, technical or unfamiliar text takes longer; skimming is faster. For Japanese, Chinese and Korean the counter uses characters per minute (about 500) instead. **Speaking time** is slower, about 150 words a minute for a comfortable speech, so a five-minute talk is roughly 750 words. Treat these as planning figures, and time yourself reading the text aloud for an important speech.

## Common limits

Here are limits that people run into, although services change their rules, so confirm the current figure:

- **Text messages (SMS):** one message segment holds 160 characters in the basic GSM alphabet, and fewer (70) if the text contains emoji or letters outside that alphabet, which then splits into several segments.
- **Search result snippets:** descriptions are usually trimmed at roughly 150 to 160 characters, with no fixed rule.
- **Social posts and ad headlines:** each platform sets its own limit and may count links, emoji or certain scripts differently.
- **Essays and abstracts:** word limits, normally excluding references, but check the instructions.

The counter has an optional **Character limit** field that shows how many characters are left, or how many you are over.

## Tips for cutting or filling to length

To cut: remove adverbs and repeated phrases, replace long phrases with one word, and delete the introduction that restates the question. To fill: add an example, a definition or a counter-argument rather than padding. The **Most used words** list in the counter shows repeated words worth varying. After editing, count again, because deleting a sentence also changes the sentence and paragraph numbers.

## Counting tokens for AI

If you are writing for an AI model, words are the wrong unit. Models read **tokens**, and the number of tokens per word varies a lot between languages. Use the [token calculator](/token-calculator/) for prompts, and see [how many tokens a word or page uses](/guides/how-many-tokens-in-a-word-or-page/) for English rules of thumb. To tidy the text itself, the guide to [changing text case](/guides/how-to-change-text-case/) covers capitals, and [converting text to a Word document](/guides/how-to-convert-text-to-word/) covers the next step if you need a file.

## Privacy

A browser-based counter analyses the text on your device and does not upload it, which matters for drafts, contracts and personal writing. Close the page when you are done to clear the text.
