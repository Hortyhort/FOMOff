# Acquirer Readiness Scorecard (Target 4.5/5)

This scorecard maps the extension to acquisition-grade evidence without compromising privacy or safety.

## Trust & privacy (Goal: 5/5)
- Evidence: `PRIVACY.md`, `docs/REVIEWER_CHECKLIST.md`, `scripts/no-network-check.mjs`
- Claims: no tracking, no network calls, offline-only behavior.

## Safety & reversibility (Goal: 4.5/5)
- Evidence: `docs/SAFETY_GUARDS.md`, `store/qa-checklist.md`
- Claims: critical UI untouched, reversible treatments, per-site pause/trust.

## Detection quality (Goal: 4.3/5)
- Evidence: `tests/detector.test.ts`, `tests/score.test.ts`
- Claims: curated patterns with conservative thresholds; false-positive tests included.

## UX clarity & trust (Goal: 4.5/5)
- Evidence: `docs/REVIEWER_CHECKLIST.md`
- Claims: 10-second comprehension, explainable reasons, calm zero-state.

## Viral surfaces (Goal: 4.5/5)
- Evidence: toolbar badge count, 1-tap share, on-page badges, weekly recap.
- Claims: visible impact and shareable proof without tracking.

## Performance (Goal: 4.2/5)
- Evidence: throttled observers, incremental scanning, limited DOM impact.
- Claims: no full DOM rescans; badge layer optimized.

## Evidence artifacts (Goal: 4.5/5)
- Proof plan: `docs/PROOF_PLAN_90D.md`
- QA template: `docs/QA_LOG_TEMPLATE.md`
- Reviewer checklist: `docs/REVIEWER_CHECKLIST.md`

## Open risks (to monitor)
- False positives on highly stylized sites.
- Checkout elements inside non-standard structures.
- Localization coverage (currently English-first).
