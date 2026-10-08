---
title: "How to Copy and Share Code Snippets Online (Quick and Private)"
description: "Share code, commands, logs and config files between machines or with a teammate using a short-lived online clipboard. Keep formatting intact and secrets out."
h1: "How to copy and share code snippets online"
lead: "Developers constantly need to move a command, a stack trace or a config block between machines. This is how to do it quickly with a temporary link, keep the formatting intact, and avoid leaking secrets."
category: "Developers"
updated: "2026-10-08"
related: ["copy-text-between-iphone-and-windows", "online-notes-transfer", "copy-text-to-a-public-computer-safely"]
faq:
  - q: "Does the clipboard keep code formatting and indentation?"
    a: "Yes. Text is stored exactly as pasted, including tabs, spaces and line breaks, and shown in a monospaced font. Syntax highlighting is not applied."
  - q: "Is it safe to share API keys or tokens this way?"
    a: "Avoid it. Anything that grants access should go through a secrets manager. If you have no other option, use a password, a 10-minute expiry and delete after first view, then rotate the secret afterwards."
  - q: "How much code can I share in one clip?"
    a: "Up to 100,000 characters per clip, which is thousands of lines. For larger files, split them or use a code hosting service."
  - q: "When should I use a code hosting service instead?"
    a: "Use one when the code needs history, review, permanent links or collaboration. Use a clipboard for short-lived hand-offs where you want no account, no repository and no leftovers."
---

## When a temporary clip is the right tool

Sometimes you need to get a few lines from one place to another and a repository would be overkill:

- Copying a command from your phone to a terminal on a server you are logged in to.
- Sending a stack trace to a colleague while you are on a call.
- Moving a config block to a fresh virtual machine that has a browser but no clipboard sharing.
- Handing someone a snippet in a chat that mangles code with smart quotes.
- Getting output off a locked-down machine where you cannot install tools or sign in.

In each case you want it fast, with no sign-up, and gone afterwards.

## How to share a snippet

1. Copy the code in your editor or terminal.
2. Open this site and paste it into **Send text**. The box uses a monospaced font so you can check indentation at a glance.
3. Choose an expiry. For a live debugging session, **10 minutes** or **1 hour** is plenty.
4. Press **Save to clipboard** and share the 6-digit code, the link or the QR code.
5. The other person opens it and presses **Copy** or **Download .txt**.

If you are sending between two machines of your own, scanning the QR code on a phone and opening the link on the second machine avoids typing six digits.

## Keeping the code intact

- **Tabs and spaces are kept.** What you paste is what is stored. Be aware that some terminals convert tabs to spaces on paste.
- **Plain text only.** Anything copied from a web page with formatting is flattened to text, which is what you want for code.
- **Smart quotes are the usual culprit** when a command fails after pasting from a chat app. If your command suddenly errors with strange characters, paste it through the clipboard and compare, or retype the quotes.
- **Line endings.** A snippet copied on Windows can have different line endings from one copied on Linux. For shell scripts, make sure the final file uses the endings your system expects.
- **Download as a file.** Use **Download .txt** if you need the content as a file, then rename it with the right extension.

## Keep secrets out

Code snippets often carry things that should not travel: API keys, access tokens, private keys, database passwords and connection strings. A few rules:

1. **Remove the secret first.** Replace it with a placeholder such as `YOUR_API_KEY`.
2. **If you must send it,** add a password, set a 10-minute expiry and turn on **Delete after the first view**. The password encrypts the text in your browser before upload, so the server never holds it in readable form.
3. **Send the password separately** from the code, on a different channel.
4. **Rotate it afterwards.** Treat any secret that has been transferred outside your secrets manager as exposed, and replace it.

This is a quick-transfer tool, not a secrets manager, so use a proper one whenever you can.

## Sharing logs and error messages

When you ask for help with a bug, the person helping needs the whole error message, not a screenshot of it. Paste the full stack trace into a clip, add the command you ran above it, and share the link. Before you do, check the output for:

- Usernames and home directory paths.
- Hostnames and internal IP addresses.
- Tokens in URLs or headers.
- Email addresses and other personal data.

## Clip, gist or repository?

| Need | Best choice |
|---|---|
| Move a snippet once, between machines or people | Online clipboard |
| Share a snippet that should have a permanent link | A code hosting snippet service |
| Work on code with history and review | A repository |
| Share a secret | A secrets manager |

## Small workflow tips

- Keep a clip open in a browser tab on your second machine so you can refresh and fetch the newest code.
- Put a comment on the first line, such as `# restart nginx on staging`, so the snippet explains itself when opened.
- If you are sending several commands, put each on its own line with a blank line between groups.
- Download a `.txt` copy if you want to keep the snippet; the clip itself will not last.
