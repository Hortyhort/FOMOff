importScripts(
  "../shared/types.js",
  "../shared/url.js",
  "../shared/hash.js",
  "../shared/settings.js",
  "../shared/messaging.js",
  "./storage.js",
  "./contextMenus.js",
  "./commands.js"
);

(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const background = (root.background = root.background || {});
  const shared = root.shared;

  const CONTENT_SCRIPT_FILES = [
    "shared/types.js",
    "shared/debounce.js",
    "shared/dom.js",
    "shared/url.js",
    "shared/hash.js",
    "shared/settings.js",
    "content/detector/patterns.js",
    "content/detector/score.js",
    "content/treatment/styles.js",
    "content/treatment/badge.js",
    "content/treatment/restore.js",
    "content/treatment/apply.js",
    "content/detector/scan.js",
    "content/detector/observe.js",
    "content/badges/position.js",
    "content/badges/layer.js",
    "content/index.js"
  ];

  function ensureInjected(tabId) {
    return new Promise((resolve) => {
      chrome.scripting.executeScript(
        {
          target: { tabId },
          files: CONTENT_SCRIPT_FILES
        },
        () => {
          // Check for lastError to prevent "Unchecked runtime.lastError" warnings
          // This occurs when the tab is showing an error page or restricted URL
          if (chrome.runtime.lastError) {
            // Silently ignore - tab may be an error page or restricted URL
          }
          resolve();
        }
      );
    }).catch(() => {
      // Ignore injection errors for restricted pages.
    });
  }

  async function shouldInject(url) {
    const settings = await background.storage.getSettings();
    const host = shared.getHostFromUrl(url);
    const override = settings.siteOverrides[host] || {};
    const enabled =
      settings.enabled &&
      override.enabled !== false &&
      !override.allowlist;
    return enabled;
  }

  async function maybeInject(tabId, url) {
    if (!url || !tabId) return;
    if (await shouldInject(url)) {
      await ensureInjected(tabId);
    }
  }

  function persistSiteState(host, settings) {
    if (!host || !settings) return;
    const override = settings.siteOverrides[host] || {};
    const trusted = !!override.allowlist;
    const paused = trusted || override.enabled === false;
    chrome.storage.local.set({
      siteState: {
        trusted,
        paused
      }
    });
  }

  function initSidePanel() {
    if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    }
  }

  function formatBadgeText(total) {
    if (!Number.isFinite(total) || total <= 0) return "";
    if (total > 99) return "99+";
    return String(total);
  }

  function formatBadgeTitle(payload) {
    if (!payload) return "FOMOff";
    const total = Number.isFinite(payload.total) ? payload.total : 0;
    if (total <= 0) return "FOMOff: clean site";
    const counts = payload.counts || {};
    const top = Object.entries(counts)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([category]) => shared.CATEGORY_LABELS[category] || category);
    const detail = top.length ? ` • ${top.join(", ")}` : "";
    return `FOMOff: ${total} muted${detail}`;
  }

  function updateActionBadge(tabId, payload) {
    if (!chrome.action || !tabId) return;
    const total = payload && Number.isFinite(payload.total) ? payload.total : 0;
    const text = formatBadgeText(total);
    chrome.action.setBadgeText({ text, tabId });
    chrome.action.setBadgeBackgroundColor({ color: "#2a8a8a", tabId });
    const title = formatBadgeTitle(payload);
    chrome.action.setTitle({ title, tabId });
  }

  chrome.runtime.onInstalled.addListener(() => {
    initSidePanel();
    background.initContextMenus();
    background.initCommands();
  });

  chrome.runtime.onStartup.addListener(() => {
    initSidePanel();
    background.initContextMenus();
    background.initCommands();
  });

  chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
    if (info.status === "complete") {
      maybeInject(tabId, tab.url);
    }
  });

  chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      // Check for lastError to prevent "Unchecked runtime.lastError" warnings
      if (chrome.runtime.lastError) {
        return;
      }
      maybeInject(activeInfo.tabId, tab && tab.url);
    });
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) return;

    if (message.type === "fomoff:ensure-injected") {
      ensureInjected(message.tabId).then(() => sendResponse({ ok: true }));
      return true;
    }

    if (message.type === "fomoff:get-settings") {
      background.storage.getSettings().then((settings) => sendResponse(settings));
      return true;
    }

    if (message.type === "fomoff:state" && sender && sender.tab && sender.tab.id) {
      updateActionBadge(sender.tab.id, message.payload);
      return false;
    }

    if (message.type === "fomoff:set-global-enabled") {
      background.storage.updateSettings({ enabled: !!message.enabled }).then((settings) => {
        sendResponse(settings);
      });
      return true;
    }

    if (message.type === "fomoff:set-mode") {
      background.storage.updateSettings({ mode: message.mode }).then((settings) => {
        sendResponse(settings);
      });
      return true;
    }

    if (message.type === "fomoff:update-settings") {
      background.storage.updateSettings(message.payload || {}).then((settings) => {
        sendResponse(settings);
      });
      return true;
    }

    if (message.type === "fomoff:set-site-enabled") {
      background.storage
        .setSiteEnabled(message.host, !!message.enabled, false)
        .then((settings) => {
          persistSiteState(message.host, settings);
          sendResponse(settings);
        });
      return true;
    }

    if (message.type === "fomoff:allow-site") {
      background.storage
        .setSiteOverride(message.host, { enabled: false, allowlist: true, snoozeUntil: null })
        .then((settings) => {
          persistSiteState(message.host, settings);
          sendResponse(settings);
        });
      return true;
    }

    if (message.type === "fomoff:journal") {
      background.storage.updateJournal(message.payload.counts).then(() => {
        sendResponse({ ok: true });
      });
      return true;
    }

    if (message.type === "fomoff:get-journal") {
      background.storage.getJournal().then((journal) => sendResponse(journal));
      return true;
    }

    if (message.type === "fomoff:reset-all") {
      chrome.storage.local.clear(() => sendResponse({ ok: true }));
      return true;
    }

    return false;
  });
})();
