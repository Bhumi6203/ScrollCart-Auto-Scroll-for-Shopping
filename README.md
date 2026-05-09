# ScrollMate — Auto Scroll for Shopping Sites (and everywhere else)

We all know Instagram has auto scroll. You just sit back and the feed comes to you.

So why don't shopping sites have that?

If you've ever spent an entire day scrolling through Myntra or Amazon looking for the perfect product — you know how tiring it gets. ScrollMate fixes that. It brings auto scroll to any website, so you can sit back, browse, and actually enjoy shopping without your finger going numb.

![ScrollMate Demo](scrollcartgif.gif)

---

## The Problem

Shopping sites like Myntra, Amazon, and Nykaa have hundreds of products per page. Finding something you like means scrolling. A lot. For a long time. There's no built-in way to auto scroll like Instagram or YouTube Shorts — you're just manually dragging that page down forever.

For people who love shopping but hate the endless scrolling, that's genuinely annoying.

---

## The Solution

ScrollMate is a Chrome Extension that adds auto scroll to any website. Open it, hit Start, and the page scrolls on its own. You control the speed. You can pause it by hovering. When you spot something you like, it stops — no awkward scrambling to turn it off.

It works on Myntra, Amazon, Nykaa, and honestly any site you open in Chrome.

---

## Features

- One-click auto scroll from the popup or a floating button on the page
- Speed slider — go slow for browsing, fast for skimming
- Scroll up or down
- Pauses automatically when you hover (so you can actually look at something)
- Floating button that stays on screen — right-click it for quick settings
- Keyboard shortcut — `Alt + S` to toggle, `Alt + H` to hide the button
- Auto-stops when it hits the top or bottom of the page
- Works on Single Page Apps like Myntra where the page doesn't fully reload on navigation
- Settings saved so you don't have to reconfigure every time

---

## How to Install

1. Download or clone this repo
2. Go to `chrome://extensions/` in Chrome
3. Turn on **Developer Mode** (top right corner)
4. Click **Load unpacked** and select the `autoscroll-extension` folder
5. Pin it to your toolbar and you're good to go

---

## How to Use

| What you want | How to do it |
|---|---|
| Start scrolling | Click the extension icon → Start Scrolling |
| Change speed | Use the slider in the popup |
| Scroll upward | Toggle ▲ Up in the popup |
| Use it without opening popup | Click "Show Button" — a floating button appears on the page |
| Quick settings on the page | Right-click the floating button |
| Toggle with keyboard | `Alt + S` anywhere on the page |

---

## How it works (the interesting bits)

**Staying alive on SPAs** — Sites like Myntra are Single Page Apps, meaning when you click around, the page doesn't actually reload. Chrome only injects extension scripts on real page loads, so the extension would silently stop working after you navigate. ScrollMate re-injects itself whenever a tab finishes loading, and self-heals if it ever loses connection to the page.

**Finding the right scroll target** — On some sites the page itself doesn't scroll — an inner `div` does. Instead of blindly calling `window.scrollBy()`, ScrollMate walks up the DOM to find the actual scrollable container and scrolls that instead.

**60fps scroll loop** — Uses `setInterval` at 16ms with `behavior: instant` so it's smooth without fighting the browser's own scroll animations.

---

## File Structure

```
autoscroll-extension/
├── manifest.json       # Chrome Extension config (Manifest V3)
├── content.js          # The scroll engine, runs on every page
├── background.js       # Service worker — handles re-injection and badge
├── popup.html          # The popup UI
├── popup.js            # Popup logic
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Built by

Bhumi Singh — 3rd year CS student  
Built this because I was tired of scrolling Myntra for hours and thought — Instagram does this automatically, why can't my shopping tab?

---

*Works on Chrome. Tested on Myntra, Amazon, and Nykaa.*


