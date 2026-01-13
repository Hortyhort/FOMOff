(function () {
  const shared = globalThis.FOMOff.shared;

  const elements = {
    globalToggle: document.getElementById("global-toggle"),
    siteHost: document.getElementById("site-host"),
    siteStatus: document.getElementById("site-status"),
    siteToggle: document.getElementById("site-toggle"),
    siteAllow: document.getElementById("site-allow"),
    totalCount: document.getElementById("total-count"),
    breakdown: document.getElementById("breakdown"),
    detectionsList: document.getElementById("detections-list"),
    tabs: Array.from(document.querySelectorAll(".tab")),
    detectionsTab: document.getElementById("detections-tab"),
    journalTab: document.getElementById("journal-tab"),
    journalList: document.getElementById("journal-list"),
    journalToggle: document.getElementById("journal-toggle"),
    journalRetention: document.getElementById("journal-retention"),
    exportJournal: document.getElementById("export-journal"),
    deleteAll: document.getElementById("delete-all")
  };

  const state = {
    tabId: null,
    host: "",
    settings: null,
    lastPayload: null
  };

  function getSiteStatus(settings) {
    const override = settings.siteOverrides[state.host] || {};
    const siteEnabled = override.enabled !== false && !override.allowlist;
    return {
      siteEnabled,
      allowlisted: !!override.allowlist,
      mode: override.mode || settings.mode
    };
  }

  function updateSiteUI(settings) {
    const status = getSiteStatus(settings);
    elements.siteHost.textContent = state.host || "(no site)";
    if (status.allowlisted) {
      elements.siteStatus.textContent = "Always allowed";
    } else {
      elements.siteStatus.textContent = status.siteEnabled ? "Active" : "Muted for this site";
    }
    elements.siteToggle.textContent = status.siteEnabled ? "Turn off" : "Turn on";
  }

  function updateModeUI(mode) {
    document.querySelectorAll(".mode").forEach((button) => {
      const isActive = button.dataset.mode === mode;
      button.classList.toggle("active", isActive);
    });
  }

  function renderBreakdown(counts) {
    elements.breakdown.innerHTML = "";
    const categories = Object.values(shared.CATEGORIES).filter(
      (key) => key !== shared.CATEGORIES.MANUAL
    );
    categories.forEach((category) => {
      const chip = document.createElement("div");
      chip.className = "breakdown-chip";
      chip.innerHTML = `<span>${shared.CATEGORY_LABELS[category]}</span><span>${counts[category] || 0}</span>`;
      elements.breakdown.appendChild(chip);
    });
  }

  function renderDetections(items) {
    elements.detectionsList.innerHTML = "";
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "site-status";
      empty.textContent = "No pressure tactics detected on this page.";
      elements.detectionsList.appendChild(empty);
      return;
    }
    items.forEach((item) => {
      const entry = globalThis.FOMOffPanel.renderItem(item);
      elements.detectionsList.appendChild(entry);
    });
  }

  function updateFromPayload(payload) {
    if (!payload) return;
    state.lastPayload = payload;
    elements.totalCount.textContent = payload.total || 0;
    renderBreakdown(payload.counts || {});
    renderDetections(payload.items || []);
  }

  function updateSettingsUI(settings) {
    state.settings = settings;
    elements.globalToggle.checked = settings.enabled;
    updateSiteUI(settings);
    updateModeUI(settings.mode);
    elements.journalToggle.checked = settings.journalingEnabled;
    elements.journalRetention.value = String(settings.journalRetentionDays || 30);
  }

  function requestState() {
    if (!state.tabId) return;
    chrome.tabs.sendMessage(
      state.tabId,
      { type: "fomoff:get-state" },
      (response) => {
        if (chrome.runtime.lastError) {
          updateFromPayload({ total: 0, counts: {}, items: [] });
          return;
        }
        updateFromPayload(response);
      }
    );
  }

  function refreshSettings() {
    chrome.runtime.sendMessage({ type: "fomoff:get-settings" }, (settings) => {
      if (settings) {
        updateSettingsUI(settings);
      }
    });
  }

  function sendEnabledToTab() {
    const status = getSiteStatus(state.settings);
    const enabled = state.settings.enabled && status.siteEnabled && status.mode !== shared.MODES.OFF;
    chrome.tabs.sendMessage(state.tabId, { type: "fomoff:set-enabled", enabled });
    chrome.tabs.sendMessage(state.tabId, { type: "fomoff:set-mode", mode: status.mode });
  }

  function handleActions(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const item = button.closest(".item");
    if (!item) return;
    const id = item.dataset.id;
    if (!id) return;

    if (button.dataset.action === "unmute") {
      chrome.tabs.sendMessage(state.tabId, { type: "fomoff:unmute", id });
    }
    if (button.dataset.action === "preview") {
      chrome.tabs.sendMessage(state.tabId, { type: "fomoff:preview", id });
    }
    if (button.dataset.action === "false-positive") {
      chrome.tabs.sendMessage(state.tabId, { type: "fomoff:report-false-positive", id });
    }
    if (button.dataset.action === "allow-site") {
      chrome.runtime.sendMessage({ type: "fomoff:allow-site", host: state.host }, (settings) => {
        updateSettingsUI(settings);
        sendEnabledToTab();
      });
    }
  }

  function handleModeClick(event) {
    const button = event.target.closest(".mode");
    if (!button) return;
    const mode = button.dataset.mode;
    chrome.runtime.sendMessage({ type: "fomoff:set-mode", mode }, () => {
      refreshSettings();
      sendEnabledToTab();
    });
  }

  function handleTabSwitch(event) {
    const button = event.target.closest(".tab");
    if (!button) return;
    elements.tabs.forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");
    const tabName = button.dataset.tab;
    elements.detectionsTab.hidden = tabName !== "detections";
    elements.journalTab.hidden = tabName !== "journal";
    if (tabName === "journal") {
      loadJournal();
    }
  }

  function loadJournal() {
    chrome.runtime.sendMessage({ type: "fomoff:get-journal" }, (journal) => {
      elements.journalList.innerHTML = "";
      const entries = Object.entries(journal || {}).sort((a, b) => (a[0] < b[0] ? 1 : -1));
      if (!entries.length) {
        const empty = document.createElement("div");
        empty.className = "site-status";
        empty.textContent = "No journal entries yet.";
        elements.journalList.appendChild(empty);
        return;
      }
      entries.forEach(([date, entry]) => {
        const row = document.createElement("div");
        row.className = "journal-row";
        row.innerHTML = `<span>${date}</span><span>${entry.total}</span>`;
        elements.journalList.appendChild(row);
      });
    });
  }

  function exportJournal() {
    chrome.runtime.sendMessage({ type: "fomoff:get-journal" }, (journal) => {
      const blob = new Blob([JSON.stringify(journal || {}, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "fomoff-journal.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    });
  }

  function deleteAll() {
    chrome.runtime.sendMessage({ type: "fomoff:reset-all" }, () => {
      refreshSettings();
      requestState();
      loadJournal();
    });
  }

  function init() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.id || !tab.url) return;
      state.tabId = tab.id;
      try {
        state.host = new URL(tab.url).host;
      } catch (error) {
        state.host = "";
      }
      elements.siteHost.textContent = state.host || "(no site)";

      chrome.runtime.sendMessage({ type: "fomoff:ensure-injected", tabId: state.tabId }, () => {
        refreshSettings();
        requestState();
      });
    });
  }

  elements.globalToggle.addEventListener("change", () => {
    chrome.runtime.sendMessage(
      { type: "fomoff:set-global-enabled", enabled: elements.globalToggle.checked },
      (settings) => {
        updateSettingsUI(settings);
        sendEnabledToTab();
      }
    );
  });

  elements.siteToggle.addEventListener("click", () => {
    const status = getSiteStatus(state.settings);
    const nextEnabled = !status.siteEnabled;
    chrome.runtime.sendMessage(
      { type: "fomoff:set-site-enabled", host: state.host, enabled: nextEnabled },
      (settings) => {
        updateSettingsUI(settings);
        sendEnabledToTab();
      }
    );
  });

  elements.siteAllow.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "fomoff:allow-site", host: state.host }, (settings) => {
      updateSettingsUI(settings);
      sendEnabledToTab();
    });
  });

  elements.journalToggle.addEventListener("change", () => {
    chrome.runtime.sendMessage(
      { type: "fomoff:update-settings", payload: { journalingEnabled: elements.journalToggle.checked } },
      (settings) => updateSettingsUI(settings)
    );
  });

  elements.journalRetention.addEventListener("change", () => {
    chrome.runtime.sendMessage(
      {
        type: "fomoff:update-settings",
        payload: { journalRetentionDays: Number(elements.journalRetention.value) }
      },
      (settings) => updateSettingsUI(settings)
    );
  });

  elements.exportJournal.addEventListener("click", exportJournal);
  elements.deleteAll.addEventListener("click", deleteAll);

  document.addEventListener("click", handleActions);
  document.addEventListener("click", handleModeClick);
  document.addEventListener("click", handleTabSwitch);

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "fomoff:state") {
      updateFromPayload(message.payload);
    }
  });

  init();
})();
