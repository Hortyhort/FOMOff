(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const background = (root.background = root.background || {});
  const shared = root.shared;

  function mergeSettings(stored) {
    const merged = Object.assign({}, shared.DEFAULT_SETTINGS, stored || {});
    merged.siteOverrides = merged.siteOverrides || {};
    merged.falsePositives = merged.falsePositives || [];
    if (typeof merged.showBadges === "undefined") {
      merged.showBadges = typeof merged.badgesEnabled !== "undefined" ? merged.badgesEnabled : true;
    }
    return merged;
  }

  function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["settings"], (result) => {
        resolve(mergeSettings(result.settings));
      });
    });
  }

  function saveSettings(settings) {
    return chrome.storage.local.set({ settings });
  }

  async function updateSettings(partial) {
    const settings = await getSettings();
    const next = Object.assign({}, partial);
    if (typeof next.showBadges === "undefined" && typeof next.badgesEnabled !== "undefined") {
      next.showBadges = next.badgesEnabled;
    }
    delete next.badgesEnabled;
    const updated = Object.assign({}, settings, next);
    await saveSettings(updated);
    return updated;
  }

  async function setSiteOverride(host, override) {
    const settings = await getSettings();
    settings.siteOverrides[host] = Object.assign({}, settings.siteOverrides[host], override);
    await saveSettings(settings);
    return settings;
  }

  async function setSiteEnabled(host, enabled, allowlist) {
    return setSiteOverride(host, {
      enabled,
      allowlist: !!allowlist,
      snoozeUntil: null
    });
  }

  async function getJournal() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["journal"], (result) => {
        resolve(result.journal || {});
      });
    });
  }

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function pruneJournal(journal, retentionDays) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const cutoffKey = formatDate(cutoff);
    const next = {};
    Object.keys(journal).forEach((dateKey) => {
      if (dateKey >= cutoffKey) {
        next[dateKey] = journal[dateKey];
      }
    });
    return next;
  }

  async function updateJournal(counts) {
    const settings = await getSettings();
    if (!settings.journalingEnabled) return;
    const journal = await getJournal();
    const today = formatDate(new Date());

    const entry = journal[today] || { total: 0, categories: {} };
    Object.keys(counts).forEach((category) => {
      entry.total += counts[category];
      entry.categories[category] = (entry.categories[category] || 0) + counts[category];
    });
    journal[today] = entry;

    const pruned = pruneJournal(journal, settings.journalRetentionDays);
    await chrome.storage.local.set({ journal: pruned });
  }

  async function addFalsePositive(signature) {
    const settings = await getSettings();
    if (!settings.falsePositives.includes(signature)) {
      settings.falsePositives.push(signature);
      await saveSettings(settings);
    }
  }

  background.storage = {
    mergeSettings,
    getSettings,
    updateSettings,
    setSiteOverride,
    setSiteEnabled,
    getJournal,
    updateJournal,
    addFalsePositive
  };
})();
