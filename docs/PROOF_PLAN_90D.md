# 90-Day Proof Plan (No Network, No Tracking)

Goal: produce acquirer-grade evidence without external telemetry.

## Metrics (manual or local-only)
- False positive rate (by category).
- Checkout breakage incidents (must remain zero).
- D7/D30 retention (manual panel check-ins).
- Share usage (count of exported images during manual sessions).
- Performance notes (CPU spikes, DOM lag).

## Collection methods (privacy-safe)
- Manual QA logs (see `docs/QA_LOG_TEMPLATE.md`).
- Local journal export for volunteer sessions (opt-in only).
- Internal run notes after each build.

## Phase plan

### Days 0–30: Baseline safety + accuracy
- Run QA on demo + 5 real sites weekly.
- Log any false positives and adjust patterns conservatively.
- Target: 0 checkout breakages, <3% false positives.

### Days 31–60: UX clarity + sharing impact
- Run panel comprehension checks with 5–10 users.
- Capture share usage in manual sessions.
- Target: users explain Calm vs Zen in <10 seconds.

### Days 61–90: Stability + retention proof
- Run longer browsing sessions (30–60 min) across SPAs.
- Weekly recap checks (journal export).
- Target: no memory leaks, stable badge positioning, consistent counts.

## Outputs (what to show acquirers)
- QA log excerpts (redacted, no personal data).
- Safety guard documentation (`docs/SAFETY_GUARDS.md`).
- Reviewer checklist completion (`docs/REVIEWER_CHECKLIST.md`).
- Example share cards and screenshots (local assets only).
