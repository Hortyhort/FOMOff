# Reviewer Checklist (Critical)

This checklist is intentionally strict. Any Critical blocker is an automatic reject.

## Critical blockers (fail fast)
- [ ] No checkout breakage: default behavior never disables buttons, hides required pricing/shipping info, or blocks navigation.
- [ ] Treatments are reversible for every element (panel unmute + per-site controls).
- [ ] Zero network activity (no analytics, no remote config, no external assets).
- [ ] Privacy statements match behavior (no data leaves device).
- [ ] Permissions are minimal and justified.
- [ ] No security hazards (overlays never block clicks or trap focus).

## Core functionality
- [ ] Detects all 6 categories: urgency, scarcity, social proof, nag overlays, forced add-ons, fake chat.
- [ ] Conservative defaults (low false positives; no sweeping DOM edits).
- [ ] Confidence levels and "why" reasons are accurate and visible.
- [ ] Zen mode increases treatment strength but stays non-destructive.
- [ ] Per-site pause, snooze, and trust behave as labeled.
- [ ] Safety guard skips critical UI (checkout, pricing, form controls).

## Side panel UX (10-second comprehension)
- [ ] Mode labels + microcopy explain Calm vs Zen vs Off without docs.
- [ ] Site controls show only relevant actions (no contradictions).
- [ ] Summary hierarchy is clear; zero-state is calm and obvious.
- [ ] Found (N) tab updates live and default behavior is correct.
- [ ] New findings dot appears only when count increases.
- [ ] Onboarding shows once and can be replayed from settings.
- [ ] Toolbar badge count reflects live totals on the active tab.

## On-page badges
- [ ] Badges never shift layout or break UI.
- [ ] Badges do not block underlying clicks.
- [ ] Positioning is stable on scroll/resize (throttled).
- [ ] Per-badge hide works; per-site badge toggle works.

## Shareable Reality Check card
- [ ] Works offline with deterministic layout.
- [ ] Clipboard copy works; download fallback works.
- [ ] Hide site name toggle works.
- [ ] Example snippets are trimmed and readable.

## Performance & stability
- [ ] MutationObserver is throttled; no full DOM rescans.
- [ ] CPU usage remains low on large pages.
- [ ] No memory leaks after SPA navigation.
- [ ] No console errors on demo + real sites.

## Settings & storage
- [ ] Global toggle applies across all sites.
- [ ] Per-site overrides persist across restarts.
- [ ] Snooze auto-resumes correctly.
- [ ] Journal retention prunes old entries.
- [ ] Export JSON and Delete All are reliable.
- [ ] Settings migration preserves existing users.

## Offline + no network proof
- [ ] DevTools Network tab shows no requests from the extension.
- [ ] Extension functions with network disabled.
- [ ] No external fonts, images, or scripts.

## Accessibility (must pass)
- [ ] All controls are keyboard reachable.
- [ ] Visible focus states on buttons, toggles, and tabs.
- [ ] Inputs have accessible labels.
- [ ] Contrast meets WCAG AA for small text.
- [ ] Dialogs can be dismissed with Escape.

## Visual quality
- [ ] Calm, premium hierarchy with consistent spacing.
- [ ] Tertiary actions are visually de-emphasized.
- [ ] Zero-state feels intentional, not empty.
- [ ] Share card is screenshot-worthy.

## Compatibility (manual testing)
- [ ] Demo page: all 6 patterns trigger; unmute works.
- [ ] 3-5 real shopping sites (Amazon, Shopify, Target, Etsy, BestBuy, etc.).
- [ ] SPA navigation updates counts without reload.
- [ ] Checkout flows remain intact.

## Store readiness
- [ ] README covers build/run, limitations, architecture.
- [ ] PRIVACY.md is explicit and accurate.
- [ ] Store listing updated with badges + share card.
- [ ] Permissions justification matches manifest.
- [ ] Screenshot captions align with actual UI.

## Evidence (attach for review)
- [ ] Unit tests run: `node scripts/run-tests.mjs`
- [ ] Build generated: `node scripts/build.mjs`
- [ ] Manual test notes recorded (sites + observed behavior).
