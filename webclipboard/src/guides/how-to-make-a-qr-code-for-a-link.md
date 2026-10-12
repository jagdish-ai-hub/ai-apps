---
title: "How to Make a QR Code for a Link That Never Expires"
description: "Turn any web address into a QR code: add https automatically, avoid long links, choose static over dynamic codes, and test before you print. Free, no sign-up."
h1: "How to make a QR code for a link"
lead: "A QR code for a link lets people open a page by pointing a camera, with no typing. Here is how to make one, keep it working, and avoid the common traps."
category: "QR codes"
updated: "2026-10-12"
tool: url-to-qr-code
related: ["how-to-make-a-qr-code-for-free", "how-to-make-a-wifi-qr-code", "send-text-from-phone-to-pc"]
faq:
  - q: "How do I turn a URL into a QR code?"
    a: "Paste the address into a URL to QR code tool, check the preview with your phone and download the PNG or SVG. A good tool adds https:// if you leave it out."
  - q: "Will my link QR code stop working?"
    a: "A static code, which contains the address itself, works as long as the page exists. A dynamic code that points to a service's redirect address can stop if the service ends or the plan expires."
  - q: "Can I track how many people scan it?"
    a: "Not from a static code itself. Add tracking parameters such as utm_source to the address, and read the visits in your own web analytics."
  - q: "Should I use a link shortener?"
    a: "Only for a very long address, and choose one you control or trust, because the code will break if the shortener stops. Often it is better to link to a shorter page on your own site."
  - q: "Is it safe to scan a QR code on a sticker?"
    a: "Be careful. Read the address your phone shows before opening it, and do not enter passwords or payment details on a page reached from an unfamiliar code."
---

## Why a QR code for a link

Typing a web address on a phone is slow and easy to get wrong. A QR code replaces it: the person points their camera, taps the banner that appears, and the page opens. That is why QR codes appear on menus, posters, packaging, tickets and slides. Almost any address can go in one: a website, a menu, a map location, a form, a social profile, a video, an app store page or a download.

## Make one

With the [URL to QR code](/url-to-qr-code/) tool:

1. Paste or type the address. If you leave out **https://**, it is added for you.
2. Scan the preview with a phone to confirm the right page opens.
3. Open **Appearance and size** if you want a different size, colours or error correction.
4. Download a **PNG** for screens, or an **SVG** for print.

The tool checks the address as you type: it refuses links that could run code (such as `javascript:`), warns about spaces, and tells you if the text does not look like a web address. It also accepts `mailto:` and `tel:` links, which open the email or phone app. Everything happens in your browser, so the address is not uploaded.

## Use a short, stable address

The longer the address, the denser the code, and the harder it is to scan from a distance or from a poor print. If your link carries long tracking parameters, consider linking to a clean page instead and measuring visits another way. Make sure the address will still work next year: do not point a printed code at a temporary page, a staging site or a file in a folder you might move. If the destination might change, link to a stable page that you can update.

## Static and dynamic codes

A **static** code contains the address itself. It works forever and without any service, but cannot count scans. A **dynamic** code contains the service's own short address, which redirects to yours. That allows scan counts and lets you change the destination later, but it makes the code depend on the service: if you stop paying or the company closes, every printed copy breaks. For anything printed, a static code is the safer choice. To measure results, add parameters such as `utm_source=poster` to your address and read them in your analytics.

## Before you print

- **Scan it with two phones**, one iPhone and one Android, in real lighting.
- **Check the page on mobile.** Most scans happen on phones, so the page should load fast and fit a small screen.
- **Size and distance.** At least about 2 cm (0.8 inch) wide for something held in the hand, larger on a poster.
- **Quiet zone.** Leave a blank border of four modules around the code.
- **Contrast.** Dark code on a light background; avoid patterned or photographic backgrounds.
- **Add a call to action** such as "Scan for the menu".

## Making codes for email and phone

A `mailto:` link opens a new email to an address, and a `tel:` link offers to call a number. Both work with the tool: type `mailto:hello@example.com` or `tel:+1234567890`. For longer text, such as a message, use the general [QR code generator](/qr-code-generator/), and for Wi-Fi use the [Wi-Fi QR code generator](/wifi-qr-code-generator/).

## Staying safe with QR codes

People cannot see where a code points until their phone shows the address. Anyone can stick a fake code over a real one. If you are scanning, read the address first, and be careful with codes that ask you to log in or pay. If you are publishing codes, use your own domain, print them where they cannot be easily covered, and make the destination clear in the text next to the code. The guide on [making a QR code for free](/guides/how-to-make-a-qr-code-for-free/) has more on size, colours and error correction.

## Privacy

The generator builds the code in your browser and does not store the address. A QR code contains the address in plain form, so anyone who scans it can read it; do not put a private link in a public code.
