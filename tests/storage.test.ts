test("mergeSettings applies defaults", () => {
  const mergeSettings = globalThis.FOMOff.background.storage.mergeSettings;
  const merged = mergeSettings({ enabled: false, siteOverrides: { "example.com": { allowlist: true } } });
  assert(merged.enabled === false, "expected enabled to remain false");
  assert(merged.mode === globalThis.FOMOff.shared.MODES.CALM, "expected default mode");
  assert(merged.showBadges === true, "expected badges to default on");
  assert(merged.hasSeenIntro === false, "expected intro flag to default false");
  assert(merged.siteOverrides["example.com"].allowlist === true, "expected allowlist preserved");
});
