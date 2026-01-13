# Launch QA Checklist

- Install from `dist/` on chrome://extensions (Developer mode).
- Verify side panel opens and shows counts on the demo page.
- Confirm global On/Off disables all treatments.
- Confirm per-site toggle disables treatments and persists.
- Confirm allowlist keeps a site untouched after reload.
- Check Calm vs Zen modes apply different strength.
- Validate right-click Mute/Unmute works on page elements.
- Verify inspector shortcut (Ctrl+Shift+X) toggles picker.
- Ensure checkout buttons remain clickable and unchanged.
- Confirm journal toggle stops recording.
- Export journal JSON and validate contents.
- Delete all data resets settings and clears journal.
- Test on pages with fixed overlays for performance.
