# FOMOff

[![CI](https://github.com/YOUR_USERNAME/fomoff/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/fomoff/actions/workflows/ci.yml)

FOMOff is a Manifest V3 Chrome extension that mutes manipulative shopping pressure in real time by de-emphasizing dark-pattern elements without breaking pages. It runs 100% client-side, works offline, and keeps all data on your device.

## What it does
- Detects urgency timers, scarcity claims, social proof pressure, nag overlays, forced add-ons, and fake chat prompts
- Applies a calm visual treatment (opacity, saturation, weight, subtle badges) instead of deleting content
- Offers per-site controls, explainable reasons, and reversible unmute actions
- Optional local journal to track daily counts (local-only, exportable JSON)
- Shareable Reality Check card (PNG), on-page badges, and a live toolbar count

## How it works
1. A lightweight content script scans text nodes with curated patterns.
2. Signals (keyword match, timer-like text, near-purchase proximity, sticky overlays) are scored into Low/Med/High confidence.
3. Safety guards skip critical UI (checkout, pricing, and form controls) before applying treatment.
4. Matched elements receive a reversible "Calm Treatment" with a small inline badge.

Example detections:
- "Deal ends in 00:12:03" -> Urgency timer
- "Only 3 left in stock" -> Scarcity
- "23 people are viewing" -> Social proof

## Quick start
```bash
npm install
npm run build
```

Load `dist/` in `chrome://extensions` (Developer mode -> Load unpacked).

## Development

```bash
npm run watch         # Watch mode for development
npm run build         # Production build
npm run test          # Run tests
npm run test:watch    # Watch tests
npm run test:coverage # Coverage report
npm run lint          # TypeScript type checking
npm run verify        # No-network check + tests
npm run release       # Bump version, build, package
```

## Architecture
```
src/
  background/      # service worker, context menus, commands, storage
  content/         # detection, scoring, treatment, badges
    detector/      # patterns, scanning, scoring
    treatment/     # styles, apply, restore
    badges/        # badge positioning and layer
  ui/sidepanel/    # side panel UI
  shared/          # utilities, types, messaging, settings
tests/
  detector/        # pattern and score tests
.github/workflows/ # CI pipeline
```

Key flows:
- `background/service_worker.ts` injects content scripts via `chrome.scripting` and handles settings
- Content scripts detect + apply treatments, store in-memory records, and report counts
- Side panel shows per-page reality checks and controls
- Shared modules provide safe messaging, settings merging, and export utilities

## Demo page
Open `demo/index.html` in a browser tab to trigger sample patterns offline.

## Known limitations
- Conservative detection may miss subtle or obfuscated tactics.
- Content scripts are injected into pages that permit scripting; restricted pages won't be modified.
- Some inline badges may be suppressed on highly stylized elements.
- Critical checkout/pricing UI is skipped by design for safety.

## Privacy
See `PRIVACY.md` - no tracking, no analytics, no network calls.
