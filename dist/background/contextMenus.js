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
        title: "Always allow on this site",
        contexts: ["all"]
      });
    });
  }

  function handleClick(info, tab) {
    if (!tab || !tab.id) return;
    if (info.menuItemId === MENU_IDS.MUTE) {
      chrome.tabs.sendMessage(tab.id, { type: "fomoff:context-action", action: "mute" });
    }
    if (info.menuItemId === MENU_IDS.UNMUTE) {
      chrome.tabs.sendMessage(tab.id, { type: "fomoff:context-action", action: "unmute" });
    }
    if (info.menuItemId === MENU_IDS.ALLOW_SITE) {
      const host = shared.getHostFromUrl(tab.url);
      if (host) {
        background.storage.setSiteEnabled(host, false, true).then(() => {
          chrome.tabs.sendMessage(tab.id, { type: "fomoff:set-enabled", enabled: false });
        });
      }
    }
  }

  background.initContextMenus = function initContextMenus() {
    createMenus();
    chrome.contextMenus.onClicked.addListener(handleClick);
  };
})();
