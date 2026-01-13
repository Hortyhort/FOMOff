importScripts(
  "../shared/types.js",
  "../shared/url.js",
  "../shared/hash.js",
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
    "content/inspector/picker.js",
    "content/index.js"
  ];

  function ensureInjected(tabId) {
    return new Promise((resolve) => {
      chrome.scripting.executeScript(
        {
          target: { tabId },
          files: CONTENT_SCRIPT_FILES
        },
        () => resolve()
      );
    }).catch(() => {
      // Ignore injection errors for restricted pages.
    });
  }

  async function shouldInject(url) {
    const settings = await background.storage.getSettings();
    const host = shared.getHostFromUrl(url);
    const override = settings.siteOverrides[host] || {};
    const snoozed = override.snoozeUntil && override.snoozeUntil > Date.now();
    const enabled =
      settings.enabled &&
      settings.mode !== shared.MODES.OFF &&
      override.enabled !== false &&
      !override.allowlist &&
      !snoozed;
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
    const snoozed = override.snoozeUntil && override.snoozeUntil > Date.now();
    const trusted = !!override.allowlist;
    const paused = trusted || override.enabled === false || snoozed;
    chrome.storage.local.set({
      siteState: {
        trusted,
        paused,
        snoozeUntil: override.snoozeUntil || null
      }
    });
  }

  function initSidePanel() {
    if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    }
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

    if (message.type === "fomoff:snooze-site") {
      const snoozeUntil = Date.now() + 60 * 60 * 1000;
      background.storage
        .setSiteOverride(message.host, { enabled: false, allowlist: false, snoozeUntil })
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
