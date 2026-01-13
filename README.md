# FOMOff

FOMOff is a Manifest V3 Chrome extension that mutes manipulative shopping pressure in real time by de-emphasizing dark-pattern elements without breaking pages. It runs 100% client-side, works offline, and keeps all data on your device.

## What it does
- Detects urgency timers, scarcity claims, social proof pressure, nag overlays, forced add-ons, and fake chat prompts.
- Applies a calm visual treatment (opacity, saturation, weight, subtle badges) instead of deleting content.
- Offers per-site controls, explainable reasons, and reversible unmute actions.
- Optional local journal to track daily counts (local-only, exportable JSON).
- Shareable Reality Check card (PNG) and on-page badges for screenshot-ready clarity.

## How it works
1. A lightweight content script scans text nodes with curated patterns.
2. Signals (keyword match, timer-like text, near-purchase proximity, sticky overlays) are scored into Low/Med/High confidence.
3. Matched elements receive a reversible "Calm Treatment" with a small inline badge.

Example detections:
- "Deal ends in 00:12:03" -> Urgency timer
- "Only 3 left in stock" -> Scarcity
- "23 people are viewing" -> Social proof

Screenshot placeholders:
- `docs/screenshot-sidepanel.png` (side panel summary)
- `docs/screenshot-muted-element.png` (badge + muted element)
- `docs/screenshot-share-card.png` (Reality Check card)
- `docs/screenshot-journal.png` (journal tab)
- `docs/screenshot-options.png` (options page)
- `docs/screenshot-demo.png` (demo page)

## Quick start
```bash
npm install
npm run build
```

Load `dist/` in `chrome://extensions` (Developer mode -> Load unpacked).

### Development
```bash
npm run build   # Copy-based build into dist
npm run build:vite  # Optional Vite build if you switch to bundled entry points
```

### Tests
```bash
npm test
```

## Architecture
```
src/
  background/   # service worker, context menus, commands, storage
  content/      # detection, scoring, treatment, inspector
  ui/           # side panel + options
  shared/       # utilities and constants
```

Key flows:
- `background/service_worker.ts` injects content scripts via `chrome.scripting` and handles settings.
- Content scripts detect + apply treatments, store in-memory records, and report counts.
- Side panel shows per-page reality checks and controls.

## Demo page
Open `demo/index.html` in a browser tab to trigger sample patterns offline.

## Known limitations
- Conservative detection may miss subtle or obfuscated tactics.
- Content scripts are injected into pages that permit scripting; restricted pages won't be modified.
- Some inline badges may be suppressed on highly stylized elements.

## Privacy
See `PRIVACY.md` - no tracking, no analytics, no network calls.
