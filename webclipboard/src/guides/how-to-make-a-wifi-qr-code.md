---
title: "How to Make a Wi-Fi QR Code So Guests Can Join With One Scan"
description: "Create a Wi-Fi QR code for iPhone and Android: what goes in it, WPA or WEP, hidden networks, special characters, printing it safely and using a guest network."
h1: "How to make a Wi-Fi QR code"
lead: "A Wi-Fi QR code lets a guest join your network by scanning, with no long password to read out. Here is how to make one, keep it safe and fix it if it does not connect."
category: "QR codes"
updated: "2026-10-12"
tool: wifi-qr-code-generator
related: ["share-wifi-password", "how-to-make-a-qr-code-for-free", "how-to-share-passwords-safely"]
faq:
  - q: "How do I make a QR code for my Wi-Fi?"
    a: "Enter the network name and password in a Wi-Fi QR code generator, choose the security type and download the image. Guests point their camera at it and tap to join."
  - q: "Does a Wi-Fi QR code work on iPhone and Android?"
    a: "On recent versions, yes: the built-in camera app reads the format and offers to join the network. Very old phones may need a QR reader app."
  - q: "Is it safe to put my Wi-Fi password on a QR code?"
    a: "The password is in the code, so anyone who scans it can join. Use a guest network for codes that many people can see, and change the password if the code spreads further than you wanted."
  - q: "What security type should I choose?"
    a: "WPA / WPA2 / WPA3 for nearly every network made in the last ten years. WEP only for very old routers, and no password only for open networks."
  - q: "Can I make a QR code for a hidden network?"
    a: "Yes. Tick the hidden network option so the phone looks for the network even though it does not broadcast its name."
---

## What goes inside a Wi-Fi QR code

A Wi-Fi code is an ordinary QR code that contains a short line of text describing your network. It looks like this: `WIFI:T:WPA;S:MyNetwork;P:mypassword;;`. `T` is the security type, `S` is the network name (the SSID), `P` is the password, and an extra `H:true;` marks a hidden network. A phone's camera app recognises this format and offers to join the network. The guest does not read, spell or type a password, and a long random password becomes as easy as a short one.

## Make one

With the [Wi-Fi QR code generator](/wifi-qr-code-generator/):

1. Enter the **network name** exactly as your phone shows it, including capital letters.
2. Enter the **password**, and choose the **security** type. Most networks are WPA / WPA2 / WPA3. Tick the box if the network is hidden.
3. Scan the preview with a phone camera. It should offer to join the network.
4. Download a **PNG** or **SVG** and print it, or show it on a screen.

The password is used only in your browser to draw the code. It is not uploaded, stored or logged. Characters that have a special meaning in the format (semicolons, commas, colons, quotation marks and backslashes) are escaped for you, so unusual passwords work.

## Choose the right security type

- **WPA / WPA2 / WPA3** for almost every router made in the last ten years. The code format treats these the same way.
- **WEP** only for a very old router. WEP is weak, so consider replacing the router or the setting.
- **No password** for an open network, such as a public hotspot.

You can find the type in your router's settings, where it is often listed as WPA2-PSK, WPA3 or "WPA2/WPA3 mixed". If your phone connects to the network with a password, it is one of the WPA types.

## Where to put the code

Anyone who scans a Wi-Fi code gets the password, so think about who can reach it. A code on the fridge or in a spare room is fine. A code on a café wall or a shared hallway is not a good idea for your main network. For any code that many people can see, set up a **guest network**: it keeps visitors apart from your own computers and smart-home devices, you can change its password without disconnecting your own things, and many routers can turn it off with one switch. The guide to [sharing a Wi-Fi password safely](/guides/share-wifi-password/) explains guest networks and other ways to share, and [how to share a password safely](/guides/how-to-share-passwords-safely/) covers passwords in general.

If a code spreads further than you meant, change the password on the router, then make and print a new code.

## When the code does not connect

- **Check for typos.** The network name and password are case-sensitive, and look-alike characters such as 0 and O or l and 1 are easy to confuse.
- **Match the security type** to your router. A WPA code for a WEP network will not connect.
- **Check the image.** The code needs good light, a clear print and a blank border around it. Do not stretch it.
- **Hidden networks.** Tick the hidden option, and make sure the name is exact.
- **Old phones and apps.** Some older phones and third-party camera apps do not read the format. Try a QR reader app, or write the password under the code.
- **Enterprise networks.** Networks that need a personal username and login, as many schools and offices do, cannot be joined with a code like this.

## Printing tips

Make the code at least about 4 cm (1.5 inches) wide for a code on a shelf or a table card, since people will scan it close up. Print on matte paper, add the network name in text beside the code, and consider laminating it if it will be handled. Keep a digital copy of the SVG so you can reprint it if you change the router. If you run a business, add the network name and a line like "Scan to join".

## Other ways to give someone your Wi-Fi

Phones can share a network with a nearby phone without any code: an iPhone offers to share the password to another iPhone that tries to join, and Android phones can show a QR code from the Wi-Fi settings. A code you made yourself is useful when you want to print it once and not repeat the steps for each guest. To send a password to someone who is not in the room, use an expiring clip, as described in the guide to [sharing a Wi-Fi password safely](/guides/share-wifi-password/).

## Privacy

Your password is never sent anywhere by the generator. Treat the printed code like the password itself, and do not post a photo of it online.
