(function () {
  const shared = globalThis.FOMOff.shared;
  const shareCard = globalThis.FOMOffShare;

  const elements = {
    globalToggle: document.getElementById("global-toggle"),
    siteHost: document.getElementById("site-host"),
    siteStatus: document.getElementById("site-status"),
    siteToggle: document.getElementById("site-toggle"),
    siteAllow: document.getElementById("site-allow"),
    badgesToggle: document.getElementById("badges-toggle"),
    totalCount: document.getElementById("total-count"),
    foundCount: document.getElementById("found-count"),
    foundDot: document.getElementById("found-dot"),
    summaryGroups: document.getElementById("summary-groups"),
    summarySection: document.getElementById("summary-section"),
    summaryNote: document.getElementById("summary-note"),
    modeNote: document.getElementById("mode-note"),
    detectionsList: document.getElementById("detections-list"),
    cleanState: document.getElementById("clean-state"),
    shareQuick: document.getElementById("share-quick"),
    shareQuickCopy: document.getElementById("share-quick-copy"),
    shareQuickOptions: document.getElementById("share-quick-options"),
    shareBlock: document.getElementById("share-block"),
    sharePanel: document.getElementById("share-panel"),
    sharePreview: document.getElementById("share-preview"),
    shareHideSite: document.getElementById("share-hide-site"),
    shareCopy: document.getElementById("share-copy"),
    shareDownload: document.getElementById("share-download"),
    infoSheet: document.getElementById("info-sheet"),
    sheetTitle: document.getElementById("sheet-title"),
    sheetBody: document.getElementById("sheet-body"),
    sheetClose: document.getElementById("sheet-close"),
    introBanner: document.getElementById("intro-banner"),
    introDismiss: document.getElementById("intro-dismiss"),
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
    lastPayload: null,
    lastTotal: 0,
    cleanPulseShown: false,
    shareOpen: false,
    newFindings: false,
    tabInitialized: false
  };

  const GROUPS = [
    {
      id: "high",
      title: "High pressure",
      categories: [shared.CATEGORIES.URGENCY, shared.CATEGORIES.SCARCITY]
    },
    {
      id: "social",
      title: "Social manipulation",
      categories: [shared.CATEGORIES.SOCIAL_PROOF, shared.CATEGORIES.FAKE_CHAT]
    },
    {
      id: "friction",
      title: "Friction tricks",
      categories: [shared.CATEGORIES.NAG_OVERLAY, shared.CATEGORIES.FORCED_ADDON]
    }
  ];

  const INFO_CONTENT = {
    mode: {
      title: "Modes",
      items: [
        "Calm: gently de-emphasizes pressure cues without breaking pages.",
        "Off: disables treatment for this site."
      ]
    },
    badges: {
      title: "Badges",
      items: [
        "We place small callouts near detected pressure tactics.",
        "They never block clicks and can be hidden per item or per site."
      ]
    },
    site: {
      title: "Site controls",
      items: [
        "Pause: stop treatments on this site until you resume.",
        "Trust: keep this site untouched until you remove trust."
      ]
    },
    permissions: {
      title: "Why we need access",
      items: [
        "We read the page to detect pressure tactics and dim them in place.",
        "All processing stays on your device - nothing leaves the browser.",
        "We never use external servers or analytics."
      ]
    }
  };

  const SUMMARY_PHRASES = {
    [shared.CATEGORIES.URGENCY]: "urgency cues",
    [shared.CATEGORIES.SCARCITY]: "scarcity cues",
    [shared.CATEGORIES.SOCIAL_PROOF]: "social proof nudges",
    [shared.CATEGORIES.FAKE_CHAT]: "fake chat prompts",
    [shared.CATEGORIES.NAG_OVERLAY]: "interrupting overlays",
    [shared.CATEGORIES.FORCED_ADDON]: "pre-checked add-ons",
    [shared.CATEGORIES.MANUAL]: "manual mutes"
  };

  function getTotal(payload) {
    if (!payload) return 0;
    const value = payload.total;
    const total = Number(value);
    return Number.isFinite(total) ? total : 0;
  }

  function openSheet(key) {
    const info = INFO_CONTENT[key];
    if (!info) return;
    elements.sheetTitle.textContent = info.title;
    elements.sheetBody.innerHTML = "";
    info.items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      elements.sheetBody.appendChild(li);
    });
    elements.infoSheet.hidden = false;
    elements.infoSheet.style.display = "flex";
    elements.sheetClose.focus();
  }

  function isIntroBannerVisible() {
    return !elements.introBanner.hidden;
  }

  function closeSheet() {
    elements.infoSheet.hidden = true;
    elements.infoSheet.style.display = "none";
  }

  // Use shared getSiteStatus
  function getSiteStatus(settings) {
    return shared.getSiteStatus(settings, state.host);
  }

  function updateSiteUI(settings) {
    const status = getSiteStatus(settings);
    elements.siteHost.textContent = state.host || "(no site)";

    if (status.allowlisted) {
      elements.siteStatus.textContent = "Trusted site - we'll stay quiet here.";
    } else {
      elements.siteStatus.textContent = status.siteEnabled
        ? "Active and watching for pressure."
        : "Paused on this site.";
    }

    elements.siteToggle.textContent = status.siteEnabled ? "Pause on this site" : "Resume on this site";
    elements.siteAllow.textContent = status.allowlisted ? "Remove trust" : "Trust this site";
    elements.siteToggle.hidden = status.allowlisted;
    elements.siteAllow.hidden = false;
  }

  function updateModeUI(mode) {
    document.querySelectorAll(".mode").forEach((button) => {
      const isActive = button.dataset.mode === mode;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    if (mode === shared.MODES.CALM) {
      elements.modeNote.textContent = "Recommended - gentle dimming, minimal risk.";
    } else {
      elements.modeNote.textContent = "No page changes on this site.";
    }
  }

  function getSummaryLine(counts) {
    const entries = Object.entries(counts || {})
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
    if (!entries.length) return "";
    const labels = entries.slice(0, 2).map(([category]) => SUMMARY_PHRASES[category] || category.toLowerCase());
    const line = labels.length === 1 ? labels[0] : `${labels[0]} and ${labels[1]}`;
    if (entries.length > 2) {
      return `We dimmed ${line} and more.`;
    }
    return `We dimmed ${line}.`;
  }

  function renderSummaryGroups(counts) {
    elements.summaryGroups.innerHTML = "";

    GROUPS.forEach((group) => {
      const total = group.categories.reduce((sum, category) => sum + (counts[category] || 0), 0);
      if (total === 0) return;

      const wrapper = document.createElement("div");
      wrapper.className = "summary-group";

      const title = document.createElement("div");
      title.className = "summary-group-title";
      title.textContent = group.title;

      const pills = document.createElement("div");
      pills.className = "summary-pills";

      group.categories.forEach((category) => {
        const count = counts[category] || 0;
        const pill = document.createElement("div");
        pill.className = "summary-pill";
        if (count > 0) pill.classList.add("active");
        pill.innerHTML = `<strong>${count}</strong>${shared.CATEGORY_LABELS[category]}`;
        pills.appendChild(pill);
      });

      wrapper.appendChild(title);
      wrapper.appendChild(pills);
      elements.summaryGroups.appendChild(wrapper);
    });
  }

  function renderDetections(items) {
    elements.detectionsList.innerHTML = "";
    if (!items.length) {
      elements.detectionsList.hidden = true;
      return;
    }
    elements.detectionsList.hidden = false;
    items.forEach((item) => {
      const entry = globalThis.FOMOffPanel.renderItem(item);
      elements.detectionsList.appendChild(entry);
    });
  }

  function animateTick(element) {
    element.classList.remove("tick");
    requestAnimationFrame(() => {
      element.classList.add("tick");
      setTimeout(() => element.classList.remove("tick"), 200);
    });
  }

  function updateCounts(payload) {
    const total = getTotal(payload);
    elements.totalCount.textContent = total;
    elements.foundCount.textContent = total;
    if (total > state.lastTotal) {
      animateTick(elements.totalCount);
      animateTick(elements.foundCount);
      elements.foundDot.hidden = false;
      state.newFindings = true;
      if (!elements.detectionsTab.hidden) {
        setTimeout(() => {
          if (!elements.detectionsTab.hidden) {
            elements.foundDot.hidden = true;
            state.newFindings = false;
          }
        }, 1500);
      }
    }
    state.lastTotal = total;
  }

  function updateCleanState(payload) {
    const total = getTotal(payload);
    elements.cleanState.hidden = total !== 0;
    if (total > 0) {
      state.cleanPulseShown = false;
    }
    if (total === 0 && !state.cleanPulseShown) {
      elements.cleanState.classList.add("pulse");
      state.cleanPulseShown = true;
      setTimeout(() => elements.cleanState.classList.remove("pulse"), 700);
    }
  }

  function updateSummary(payload) {
    const total = getTotal(payload);
    elements.summarySection.classList.toggle("clean", total === 0);
    if (total === 0) {
      elements.summaryGroups.innerHTML = "";
      elements.summaryNote.hidden = true;
      return;
    }
    const summaryLine = getSummaryLine(payload.counts || {});
    elements.summaryNote.textContent = summaryLine;
    elements.summaryNote.hidden = !summaryLine;
    renderSummaryGroups(payload.counts || {});
  }

  function getShareData(payload) {
    const items = (payload.items || []).slice(0, 4).map((item) => item.snippet || "");
    return {
      host: state.host,
      total: payload.total || 0,
      counts: payload.counts || {},
      snippets: items
    };
  }

  function renderSharePreview(payload) {
    if (!shareCard || !payload) return;
    const data = getShareData(payload);
    data.hideHost = elements.shareHideSite.checked;
    const dataUrl = shareCard.renderDataUrl(data);
    elements.sharePreview.innerHTML = "";
    const img = document.createElement("img");
    img.src = dataUrl;
    img.alt = "Reality check card preview";
    elements.sharePreview.appendChild(img);
  }

  function updateShareSection(payload) {
    const total = getTotal(payload);
    elements.shareQuick.hidden = total <= 0;
    elements.shareBlock.hidden = total <= 0;
    elements.shareBlock.style.display = total <= 0 ? "none" : "grid";
    if (total <= 0) {
      elements.sharePanel.hidden = true;
      state.shareOpen = false;
      elements.shareQuickOptions.textContent = "More options";
      return;
    }
    elements.shareQuickOptions.textContent = state.shareOpen ? "Hide options" : "More options";
    if (state.shareOpen) {
      renderSharePreview(payload);
    }
  }

  function showIntroBanner() {
    elements.introBanner.hidden = false;
  }

  function hideIntroBanner() {
    elements.introBanner.hidden = true;
    chrome.runtime.sendMessage({ type: "fomoff:update-settings", payload: { hasSeenIntro: true } });
  }

  async function copyShareImage() {
    if (!shareCard || !state.lastPayload) return;
    const data = getShareData(state.lastPayload);
    data.hideHost = elements.shareHideSite.checked;
    const blob = await shareCard.renderBlob(data);
    if (!blob) return;
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        return;
      } catch (error) {
        // Fallback to download below.
      }
    }
    downloadShareImage(blob);
  }

  function downloadShareImage(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "fomoff-reality-check.png";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function updateFromPayload(payload) {
    if (!payload) return;
    state.lastPayload = payload;
    if (!state.tabInitialized && getTotal(payload) > 0) {
      setActiveTab("detections");
      state.tabInitialized = true;
    }
    updateCounts(payload);
    updateSummary(payload);
    renderDetections(payload.items || []);
    updateCleanState(payload);
    updateShareSection(payload);
  }

  function updateSettingsUI(settings) {
    state.settings = settings;
    elements.globalToggle.checked = settings.enabled;
    elements.badgesToggle.checked = settings.showBadges !== false;
    updateSiteUI(settings);
    updateModeUI(settings.mode);
    elements.journalToggle.checked = settings.journalingEnabled;
    elements.journalRetention.value = String(settings.journalRetentionDays || 30);
    if (!settings.hasSeenIntro && !isIntroBannerVisible()) {
      showIntroBanner();
    }
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
        return;
      }
      chrome.storage.local.get(["settings"], (result) => {
        updateSettingsUI(shared.mergeSettings(result.settings));
      });
    });
  }

  // Helper to safely send messages without "Unchecked runtime.lastError" warnings
  function safeSendMessage(tabId, message, callback) {
    if (!tabId) {
      if (callback) callback(null);
      return;
    }
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        // Silently ignore - tab may be an error page or restricted URL
        if (callback) callback(null);
        return;
      }
      if (callback) callback(response);
    });
  }

  function sendEnabledToTab() {
    const status = getSiteStatus(state.settings);
    const enabled = state.settings.enabled && status.siteEnabled && status.mode !== shared.MODES.OFF;
    safeSendMessage(state.tabId, { type: "fomoff:set-enabled", enabled });
    safeSendMessage(state.tabId, { type: "fomoff:set-mode", mode: status.mode });
  }

  function handleActions(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const item = button.closest(".item");
    if (!item) return;
    const id = item.dataset.id;
    if (!id) return;

    if (button.dataset.action === "unmute") {
      safeSendMessage(state.tabId, { type: "fomoff:unmute", id });
    }
    if (button.dataset.action === "preview") {
      safeSendMessage(state.tabId, { type: "fomoff:preview", id });
    }
    if (button.dataset.action === "false-positive") {
      safeSendMessage(state.tabId, { type: "fomoff:report-false-positive", id });
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

  function setActiveTab(tabName) {
    elements.tabs.forEach((tab) => {
      const isActive = tab.dataset.tab === tabName;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });
    elements.detectionsTab.hidden = tabName !== "detections";
    elements.journalTab.hidden = tabName !== "journal";
    if (tabName === "journal") {
      loadJournal();
    }
    if (tabName === "detections") {
      elements.foundDot.hidden = true;
      state.newFindings = false;
    }
  }

  function handleTabSwitch(event) {
    const button = event.target.closest(".tab");
    if (!button) return;
    setActiveTab(button.dataset.tab);
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
      shared.exportAsJson(journal || {}, "fomoff-journal.json");
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
    refreshSettings();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.id || !tab.url) {
        updateFromPayload({ total: 0, counts: {}, items: [] });
        return;
      }
      state.tabId = tab.id;
      try {
        state.host = new URL(tab.url).host;
      } catch (error) {
        state.host = "";
      }
      elements.siteHost.textContent = state.host || "(no site)";

      chrome.runtime.sendMessage({ type: "fomoff:ensure-injected", tabId: state.tabId }, () => {
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
    const status = getSiteStatus(state.settings);
    if (status.allowlisted) {
      chrome.runtime.sendMessage(
        { type: "fomoff:set-site-enabled", host: state.host, enabled: true },
        (settings) => {
          updateSettingsUI(settings);
          sendEnabledToTab();
        }
      );
      return;
    }
    chrome.runtime.sendMessage({ type: "fomoff:allow-site", host: state.host }, (settings) => {
      updateSettingsUI(settings);
      sendEnabledToTab();
    });
  });

  elements.badgesToggle.addEventListener("change", () => {
    chrome.runtime.sendMessage(
      { type: "fomoff:update-settings", payload: { showBadges: elements.badgesToggle.checked } },
      (settings) => updateSettingsUI(settings)
    );
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

  elements.shareQuickOptions.addEventListener("click", () => {
    state.shareOpen = !state.shareOpen;
    elements.sharePanel.hidden = !state.shareOpen;
    elements.shareQuickOptions.textContent = state.shareOpen ? "Hide options" : "More options";
    if (state.shareOpen && state.lastPayload) {
      renderSharePreview(state.lastPayload);
    }
  });

  elements.shareHideSite.addEventListener("change", () => {
    if (state.shareOpen && state.lastPayload) {
      renderSharePreview(state.lastPayload);
    }
  });

  elements.shareQuickCopy.addEventListener("click", async () => {
    const original = elements.shareQuickCopy.textContent;
    await copyShareImage();
    elements.shareQuickCopy.textContent = "Copied";
    setTimeout(() => {
      elements.shareQuickCopy.textContent = original;
    }, 1500);
  });

  elements.shareCopy.addEventListener("click", copyShareImage);
  elements.shareDownload.addEventListener("click", async () => {
    if (!shareCard || !state.lastPayload) return;
    const data = getShareData(state.lastPayload);
    data.hideHost = elements.shareHideSite.checked;
    const blob = await shareCard.renderBlob(data);
    if (blob) downloadShareImage(blob);
  });

  document.querySelectorAll("[data-info]").forEach((button) => {
    button.addEventListener("click", () => {
      openSheet(button.dataset.info);
    });
  });

  elements.sheetClose.addEventListener("click", closeSheet);
  elements.infoSheet.addEventListener("click", (event) => {
    if (event.target === elements.infoSheet) closeSheet();
  });

  elements.introDismiss.addEventListener("click", hideIntroBanner);

  elements.exportJournal.addEventListener("click", exportJournal);
  elements.deleteAll.addEventListener("click", deleteAll);

  document.addEventListener("click", handleActions);
  document.addEventListener("click", handleModeClick);
  document.addEventListener("click", handleTabSwitch);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!elements.infoSheet.hidden) {
        closeSheet();
      }
      if (isIntroBannerVisible()) {
        hideIntroBanner();
      }
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "fomoff:state") {
      updateFromPayload(message.payload);
    }
  });

  init();
})();
