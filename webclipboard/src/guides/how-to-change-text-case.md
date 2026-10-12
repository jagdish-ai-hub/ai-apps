---
title: "How to Change Text Case: Upper, Lower, Sentence and Title Case"
description: "Change text between upper case, lower case, sentence case, title case, camelCase and snake_case. Rules for each style, Word shortcuts and fixing caps-lock text."
h1: "How to change text case: upper, lower, sentence and title case"
lead: "You typed a paragraph with caps lock on, or need a headline in title case, or a variable name in snake_case. Here is how each style works and the fastest way to convert."
category: "Text tools"
updated: "2026-10-12"
tool: case-converter
related: ["how-to-count-words-and-characters", "how-to-remove-markdown-from-chatgpt-text", "how-to-convert-text-to-word"]
faq:
  - q: "How do I fix text typed in all caps?"
    a: "Paste it into a case converter and choose Sentence case, which lowers everything and capitalises the first letter of each sentence. Then check names and acronyms, which need their capitals back."
  - q: "What is the difference between sentence case and title case?"
    a: "Sentence case capitalises only the first word and proper nouns, like a normal sentence. Title case capitalises most words in a headline, and keeps short words like 'of' and 'the' in lower case."
  - q: "Which words stay lower case in title case?"
    a: "Style guides differ, but short articles, conjunctions and prepositions usually stay lower case unless they are the first or last word. Check the guide your publication uses."
  - q: "What are camelCase and snake_case used for?"
    a: "They are naming styles in programming. camelCase joins words with each later word capitalised, snake_case joins them with underscores, and kebab-case uses hyphens, often in URLs and CSS."
  - q: "Does changing case work for every language?"
    a: "For alphabets with upper and lower case, such as Latin, Greek and Cyrillic, yes. Scripts without case, such as Japanese, Chinese, Hindi and Thai, are unaffected."
---

## The main styles

**UPPER CASE** makes every letter a capital. **lower case** makes every letter small. These are simple, and are the ones you will use to normalise text for comparison or to fix a block typed with caps lock.

**Sentence case** capitalises the first letter of each sentence and the pronoun "I", and leaves the rest lower case. It is the normal case for body text, and increasingly for headings and interface labels.

**Capitalize Each Word** makes every word start with a capital letter. **Title Case** is the headline style: most words are capitalised, but short words such as "a", "an", "the", "and", "but", "of" and "to" stay lower case unless they are first or last. Style guides disagree on the details, such as which prepositions count as short, so check the guide for your publication.

## Naming styles for code and files

Programmers use styles that join words without spaces:

- **camelCase:** `myVariableName`, first word lower case, later words capitalised.
- **PascalCase:** `MyClassName`, every word capitalised.
- **snake_case:** `my_variable_name`, lower case with underscores, common in Python and databases.
- **kebab-case:** `my-page-name`, lower case with hyphens, common in URLs and CSS.
- **CONSTANT_CASE:** `MY_CONSTANT_NAME`, upper case with underscores.

A good converter splits the text into words at spaces, punctuation and existing case changes, so you can go from `myVariableName` to `my_variable_name` directly, and a list with one name per line converts line by line. The [case converter](/case-converter/) does all of these.

## Fixing text typed in caps lock

If you typed a paragraph with caps lock on, paste it into the converter, choose **Sentence case**, and copy the result. It lowers all letters and then capitalises the start of each sentence and the word "I". Afterwards, restore the capitals in names, places and acronyms by hand, because a converter cannot know which words are proper nouns. In most word processors, you can also select the text and use the **Change case** command, or a shortcut such as Shift + F3 in Word on Windows, which cycles through upper, lower and capitalised forms.

## Rules worth knowing

- **Titles.** Choose one style and use it everywhere on a page. Sentence case is simpler and avoids debates about which words to capitalise.
- **Acronyms and brand names.** Converting to lower or sentence case flattens them (for example "NASA" or "iPhone"), so check them.
- **The Turkish "i".** In Turkish and Azerbaijani, the upper-case form of "i" is "İ" and of "ı" is "I". A converter that applies English rules can get these wrong, so check Turkish text.
- **German "ß".** The upper-case form is "SS" in standard conversion, so "straße" becomes "STRASSE".
- **Accessibility.** Long passages in all capitals are harder to read, and screen readers may spell out some capitalised words, so avoid all caps for body text.

## Case in practice: three quick examples

- **A shouted paragraph.** "PLEASE SEND THE REPORT BY FRIDAY. THANK YOU." becomes "Please send the report by Friday. Thank you." with Sentence case, and you only need to check names.
- **A headline.** "the lord of the rings and a tale of two cities" becomes "The Lord of the Rings and a Tale of Two Cities" in Title Case: short words stay lower case, and the first word is always capitalised.
- **A variable name.** "user first name" becomes `userFirstName` in camelCase, `user_first_name` in snake_case and `user-first-name` in kebab-case. Paste a column of names to convert them all at once.

Converting the same text more than once is safe, because the converter works from the characters, not from the previous result. Use **Use result as input** only when you want one style applied on top of another, for example to lower-case a list and then convert it to snake_case.

## Languages and scripts

Case exists in Latin, Greek, Cyrillic, Armenian and a few other alphabets. Scripts like Japanese, Chinese, Korean, Hindi, Arabic and Thai have no upper and lower case, so conversion leaves them unchanged. In mixed text, only the letters that have case are altered. The case converter uses your browser's Unicode rules, so accented letters convert correctly.

## Tidying text before you convert

If your text came from an AI chat and is full of symbols such as `**` and `##`, remove them first with [how to remove Markdown symbols from ChatGPT text](/guides/how-to-remove-markdown-from-chatgpt-text/), then change the case. If you need to check a length after editing, the guide to [counting words and characters](/guides/how-to-count-words-and-characters/) explains limits, and the guide to [converting text to a Word document](/guides/how-to-convert-text-to-word/) covers saving the finished text.

## Privacy

A browser-based converter changes your text on your device and does not upload it. Close the page when you are done to clear it.
