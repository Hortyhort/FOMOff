(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const shared = (root.shared = root.shared || {});

  const CATEGORIES = {
    URGENCY: "urgency",
    SCARCITY: "scarcity",
    SOCIAL_PROOF: "social_proof",
    NAG_OVERLAY: "nag_overlay",
    FORCED_ADDON: "forced_addon",
    FAKE_CHAT: "fake_chat",
    MANUAL: "manual"
  };

  const CATEGORY_LABELS = {
    [CATEGORIES.URGENCY]: "Urgency",
    [CATEGORIES.SCARCITY]: "Scarcity",
    [CATEGORIES.SOCIAL_PROOF]: "Social proof",
    [CATEGORIES.NAG_OVERLAY]: "Nag overlay",
    [CATEGORIES.FORCED_ADDON]: "Forced add-on",
    [CATEGORIES.FAKE_CHAT]: "Fake chat",
    [CATEGORIES.MANUAL]: "Manual"
  };

  const CONFIDENCE = {
    LOW: "Low",
    MEDIUM: "Med",
    HIGH: "High"
  };

  const MODES = {
    CALM: "calm",
    OFF: "off"
  };

  const DEFAULT_SETTINGS = {
    enabled: true,
    mode: MODES.CALM,
    journalingEnabled: true,
    journalRetentionDays: 30,
    showBadges: true,
    hasSeenIntro: false,
    siteOverrides: {},
    falsePositives: []
  };

  shared.CATEGORIES = CATEGORIES;
  shared.CATEGORY_LABELS = CATEGORY_LABELS;
  shared.CONFIDENCE = CONFIDENCE;
  shared.MODES = MODES;
  shared.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
})();
