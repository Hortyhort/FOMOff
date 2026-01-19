(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const shared = (root.shared = root.shared || {});

  /**
   * Merge stored settings with defaults
   * Single source of truth - previously duplicated in 3 files
   */
  function mergeSettings(stored) {
    const merged = Object.assign({}, shared.DEFAULT_SETTINGS, stored || {});
    merged.siteOverrides = merged.siteOverrides || {};
    merged.falsePositives = merged.falsePositives || [];
    if (typeof merged.showBadges === "undefined") {
      merged.showBadges = typeof merged.badgesEnabled !== "undefined" ? merged.badgesEnabled : true;
    }
    return merged;
  }

  /**
   * Get site status (enabled, allowlisted, mode)
   */
  function getSiteStatus(settings, host) {
    const override = settings.siteOverrides[host] || {};
    const siteEnabled = override.enabled !== false && !override.allowlist;
    return {
      siteEnabled,
      allowlisted: !!override.allowlist,
      mode: override.mode || settings.mode
    };
  }

  shared.mergeSettings = mergeSettings;
  shared.getSiteStatus = getSiteStatus;
})();
