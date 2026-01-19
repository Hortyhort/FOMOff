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
    const currentlyEnabled = override.enabled !== false && !override.allowlist;
    const nextEnabled = !currentlyEnabled;
    await background.storage.setSiteEnabled(host, nextEnabled, false);
    chrome.tabs.sendMessage(tab.id, { type: "fomoff:set-enabled", enabled: nextEnabled }, () => {
      if (chrome.runtime.lastError) {
        // Silently ignore - tab may be an error page or restricted URL
      }
    });
  }

  function handleCommand(command, tab) {
    if (command === "toggle-site") {
      toggleSite(tab);
    }
  }

  background.initCommands = function initCommands() {
    chrome.commands.onCommand.addListener(handleCommand);
  };
})();
