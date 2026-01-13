# FOMOff V1.5/V2 Implementation Plan

## File changes
- Add shared tokens: `src/shared/designTokens.ts`.
- Side panel: update `src/ui/sidepanel/index.html`, `src/ui/sidepanel/styles.css`, `src/ui/sidepanel/app.ts`, add `src/ui/sidepanel/shareCard.ts`.
- Options: update `src/ui/options/index.html`, `src/ui/options/styles.css`, `src/ui/options/app.ts`.
- Content badges: add `src/content/badges/layer.ts`, `src/content/badges/position.ts` (overlay + positioning), wire into `src/content/index.ts`.
- Storage + background: update `src/shared/types.ts`, `src/background/storage.ts`, `src/background/contextMenus.ts`, `src/background/service_worker.ts`.
- Docs + store copy: update `README.md`, `store/listing.md`, `docs/PLACEHOLDERS.md`.

## Data model updates
- Settings defaults:
  - `showBadges: true`
  - `hasSeenIntro: false`
- Site overrides:
  - `allowlist: boolean`
  - `enabled: boolean`
  - `mode?: "calm" | "zen" | "off"`
  - `snoozeUntil?: number` (epoch ms)

## UI wire changes
- Side panel:
  - Clean zero-state card with shield pulse.
  - Summary grouped into three sections with emphasized pills.
  - Tabs: `Found (N)` label, new findings dot.
  - Share report module: generate PNG card with optional hide-site toggle.
  - Controls: `Pause on this site`, `Trust this site`, `Snooze 1 hour`, `Show on-page badges`.
- Options:
  - Rename Allowlist to Trusted sites.
  - Add badges toggle and optional notifications toggle.

## Performance safeguards
- Badges overlay in Shadow DOM with throttled reposition on scroll/resize.
- Only update badge positions for visible elements.
- Reuse existing MutationObserver pipeline; no extra full DOM scans.
- Debounced UI updates for counts and new findings indicator.
