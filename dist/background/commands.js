(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const background = (root.background = root.background || {});
  const shared = root.shared;

  async function toggleSite(tab) {
    if (!tab || !tab.id) return;
    const host = shared.getHostFromUrl(tab.url);
    if (!host) return;
    const settings = await background.storage.getSettings();
    const override = settings.siteOverrides[host] || {};
    const snoozed = override.snoozeUntil && override.snoozeUntil > Date.now();
    const currentlyEnabled = override.enabled !== false && !override.allowlist && !snoozed;
    const nextEnabled = !currentlyEnabled;
    await background.storage.setSiteEnabled(host, nextEnabled, false);
    chrome.tabs.sendMessage(tab.id, { type: "fomoff:set-enabled", enabled: nextEnabled });
  }

  function handleCommand(command, tab) {
    if (command === "toggle-inspector") {
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: "fomoff:toggle-inspector" });
      }
    }
    if (command === "toggle-site") {
      toggleSite(tab);
    }
  }

  background.initCommands = function initCommands() {
    chrome.commands.onCommand.addListener(handleCommand);
  };
})();
