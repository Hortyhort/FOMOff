(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const background = (root.background = root.background || {});
  const shared = root.shared;

  const MENU_IDS = {
    MUTE: "fomoff-mute-element",
    UNMUTE: "fomoff-unmute-element",
    ALLOW_SITE: "fomoff-allow-site"
  };

  function createMenus() {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: MENU_IDS.MUTE,
        title: "Mute this element",
        contexts: ["all"]
      });
      chrome.contextMenus.create({
        id: MENU_IDS.UNMUTE,
        title: "Unmute this element",
        contexts: ["all"]
      });
    chrome.contextMenus.create({
      id: MENU_IDS.ALLOW_SITE,
      title: "Trust this site",
      contexts: ["all"]
    });
    });
  }

  // Helper to safely send messages without "Unchecked runtime.lastError" warnings
  function safeSendMessage(tabId, message) {
    chrome.tabs.sendMessage(tabId, message, () => {
      if (chrome.runtime.lastError) {
        // Silently ignore - tab may be an error page or restricted URL
      }
    });
  }

  function handleClick(info, tab) {
    if (!tab || !tab.id) return;
    if (info.menuItemId === MENU_IDS.MUTE) {
      safeSendMessage(tab.id, { type: "fomoff:context-action", action: "mute" });
    }
    if (info.menuItemId === MENU_IDS.UNMUTE) {
      safeSendMessage(tab.id, { type: "fomoff:context-action", action: "unmute" });
    }
    if (info.menuItemId === MENU_IDS.ALLOW_SITE) {
      const host = shared.getHostFromUrl(tab.url);
      if (host) {
        background.storage.setSiteEnabled(host, false, true).then(() => {
          safeSendMessage(tab.id, { type: "fomoff:set-enabled", enabled: false });
        });
      }
    }
  }

  background.initContextMenus = function initContextMenus() {
    createMenus();
    chrome.contextMenus.onClicked.addListener(handleClick);
  };
})();
