# Store Listing Draft

## Title
FOMOff - Mute Shopping Pressure

## Short description
Calm dark-pattern pressure tactics in real time with a gentle, reversible dim.

## Detailed description
FOMOff mutes manipulative shopping pressure without breaking pages. It detects common dark patterns like countdown timers, "only X left" scarcity claims, social proof nags, interrupting overlays, pre-checked add-ons, and fake chat prompts. Instead of deleting elements, FOMOff de-emphasizes them with a calm visual treatment and clear badges so you can shop with clarity.

Highlights:
- Real-time detection with explainable reasons and confidence levels.
- Reversible calming treatment - no broken checkout flows.
- Per-site controls, allowlist, and element-level unmute.
- Optional local journal of tactics encountered (exportable JSON).
- 100% offline, no tracking, no analytics, no remote config.

## Permissions justification
- `scripting`: inject the content script that detects and dims pressure tactics.
- `tabs`: read the active tab URL to apply per-site rules.
- `storage`: store settings, allowlist, and the optional local journal.
- `contextMenus`: enable right-click mute/unmute actions.
- `sidePanel`: show the Reality Check side panel UI.
- Keyboard shortcuts use the commands API for the inspector toggle.
- Host permissions (`<all_urls>`): allow FOMOff to run on the sites you visit.

## Screenshot captions (text only)
1. "Reality Check side panel with 12 tactics muted."
2. "Muted scarcity banner with explainable badge."
3. "Zen Shopping mode softly demotes an interrupting overlay."
4. "Per-site controls and allowlist management."
5. "Local journal of tactics by day (private + offline)."
