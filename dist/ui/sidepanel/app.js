(function () {
  const shared = globalThis.FOMOff.shared;
  const shareCard = globalThis.FOMOffShare;

  const elements = {
    globalToggle: document.getElementById("global-toggle"),
    siteHost: document.getElementById("site-host"),
    siteStatus: document.getElementById("site-status"),
    siteToggle: document.getElementById("site-toggle"),
    siteAllow: document.getElementById("site-allow"),
    siteSnooze: document.getElementById("site-snooze"),
    badgesToggle: document.getElementById("badges-toggle"),
    totalCount: document.getElementById("total-count"),
    foundCount: document.getElementById("found-count"),
    foundDot: document.getElementById("found-dot"),
    summaryGroups: document.getElementById("summary-groups"),
    summarySection: document.getElementById("summary-section"),
    modeNote: document.getElementById("mode-note"),
    detectionsList: document.getElementById("detections-list"),
    cleanState: document.getElementById("clean-state"),
    shareBlock: document.getElementById("share-block"),
    shareToggle: document.getElementById("share-toggle"),
    sharePanel: document.getElementById("share-panel"),
    sharePreview: document.getElementById("share-preview"),
    shareHideSite: document.getElementById("share-hide-site"),
    shareCopy: document.getElementById("share-copy"),
    shareDownload: document.getElementById("share-download"),
    infoSheet: document.getElementById("info-sheet"),
    sheetTitle: document.getElementById("sheet-title"),
    sheetBody: document.getElementById("sheet-body"),
    sheetClose: document.getElementById("sheet-close"),
    introOverlay: document.getElementById("intro-overlay"),
    introHighlight: document.getElementById("intro-highlight"),
    introCard: document.getElementById("intro-card"),
    introStep: document.getElementById("intro-step"),
    introTitle: document.getElementById("intro-title"),
    introText: document.getElementById("intro-text"),
    introNext: document.getElementById("intro-next"),
    introSkip: document.getElementById("intro-skip"),
    introReset: document.getElementById("intro-reset"),
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
    tabInitialized: false,
    introIndex: 0
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
        "Zen Shopping: stronger de-emphasis; may reduce nag overlays when safe.",
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
        "Snooze: take a 1-hour break without forgetting your settings.",
        "Trust: keep this site untouched until you remove trust."
      ]
    }
  };

  function getTotal(payload) {
    if (!payload) return 0;
    const value = payload.total;
    const total = Number(value);
    return Number.isFinite(total) ? total : 0;
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
    elements.sheetClose.focus();
  }

  function closeSheet() {
    elements.infoSheet.hidden = true;
  }

  function getSiteStatus(settings) {
    const override = settings.siteOverrides[state.host] || {};
    const snoozed = override.snoozeUntil && override.snoozeUntil > Date.now();
    const siteEnabled = override.enabled !== false && !override.allowlist && !snoozed;
    return {
      siteEnabled,
      allowlisted: !!override.allowlist,
      snoozed,
      snoozeUntil: override.snoozeUntil || null,
      mode: override.mode || settings.mode
    };
  }

  function updateSiteUI(settings) {
    const status = getSiteStatus(settings);
    elements.siteHost.textContent = state.host || "(no site)";

    if (status.allowlisted) {
      elements.siteStatus.textContent = "Trusted site - we'll stay quiet here.";
    } else if (status.snoozed) {
      elements.siteStatus.textContent = `Snoozed until ${formatTime(status.snoozeUntil)}.`;
    } else {
      elements.siteStatus.textContent = status.siteEnabled
        ? "Active and watching for pressure."
        : "Paused on this site.";
    }

    elements.siteToggle.textContent = status.siteEnabled ? "Pause on this site" : "Resume on this site";
    elements.siteAllow.textContent = status.allowlisted ? "Remove trust" : "Trust this site";
    elements.siteSnooze.textContent = status.snoozed ? "Snoozed" : "Snooze 1 hour";
    elements.siteSnooze.disabled = status.snoozed;

    elements.siteToggle.hidden = status.allowlisted;
    elements.siteSnooze.hidden = status.allowlisted;
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
    } else if (mode === shared.MODES.ZEN) {
      elements.modeNote.textContent = "Stronger calming for shopping pages (still reversible).";
    } else {
      elements.modeNote.textContent = "No page changes on this site.";
    }
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
      return;
    }
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
    elements.shareBlock.hidden = total <= 0;
    elements.shareBlock.style.display = total <= 0 ? "none" : "grid";
    if (total <= 0) {
      elements.sharePanel.hidden = true;
      state.shareOpen = false;
      return;
    }
    if (state.shareOpen) {
      renderSharePreview(payload);
    }
  }

  const INTRO_STEPS = [
    {
      title: "FOMOff turns down manipulative pressure tricks.",
      text: "Countdowns, scarcity, social proof. Nothing leaves your device.",
      targets: []
    },
    {
      title: "Start with Calm.",
      text: "Use Zen for stronger shopping pages. You can always undo.",
      targets: ["#mode-section"]
    },
    {
      title: "Badges and share are the magic.",
      text: "Badges label pressure on the page. Share creates a screenshot-ready report.",
      targets: ["#badges-row", "#share-block"]
    }
  ];

  function getTargetRect(selectors) {
    const visible = selectors
      .map((selector) => document.querySelector(selector))
      .filter((element) => element && !element.hidden && element.offsetParent !== null);
    if (!visible.length) return null;
    let rect = null;
    visible.forEach((element) => {
      const next = element.getBoundingClientRect();
      if (!rect) {
        rect = { top: next.top, left: next.left, right: next.right, bottom: next.bottom };
        return;
      }
      rect.top = Math.min(rect.top, next.top);
      rect.left = Math.min(rect.left, next.left);
      rect.right = Math.max(rect.right, next.right);
      rect.bottom = Math.max(rect.bottom, next.bottom);
    });
    return rect;
  }

  function updateIntroHighlight() {
    const step = INTRO_STEPS[state.introIndex];
    if (!step || !step.targets.length) {
      elements.introHighlight.style.display = "none";
      return;
    }
    const rect = getTargetRect(step.targets);
    if (!rect) {
      elements.introHighlight.style.display = "none";
      return;
    }
    const padding = 6;
    const top = Math.max(8, rect.top - padding);
    const left = Math.max(8, rect.left - padding);
    const width = Math.min(window.innerWidth - left - 8, rect.right - rect.left + padding * 2);
    const height = Math.min(window.innerHeight - top - 8, rect.bottom - rect.top + padding * 2);
    elements.introHighlight.style.display = "block";
    elements.introHighlight.style.top = `${top}px`;
    elements.introHighlight.style.left = `${left}px`;
    elements.introHighlight.style.width = `${width}px`;
    elements.introHighlight.style.height = `${height}px`;
  }

  function showIntroStep(index) {
    state.introIndex = index;
    const step = INTRO_STEPS[index];
    if (!step) return;
    elements.introStep.textContent = `${index + 1}/${INTRO_STEPS.length}`;
    elements.introTitle.textContent = step.title;
    elements.introText.textContent = step.text;
    elements.introNext.textContent = index === INTRO_STEPS.length - 1 ? "Got it" : "Next";
    elements.introSkip.hidden = index === INTRO_STEPS.length - 1;
    updateIntroHighlight();
  }

  function startIntro() {
    elements.introOverlay.hidden = false;
    showIntroStep(0);
    elements.introNext.focus();
  }

  function closeIntro(markSeen) {
    elements.introOverlay.hidden = true;
    if (markSeen) {
      chrome.runtime.sendMessage({ type: "fomoff:update-settings", payload: { hasSeenIntro: true } }, (settings) => {
        if (settings) updateSettingsUI(settings);
      });
    }
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

  function downloadShareImage(blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fomoff-reality-check.png";
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
    if (!elements.introOverlay.hidden) {
      updateIntroHighlight();
    }
  }

  function updateSettingsUI(settings) {
    state.settings = settings;
    elements.globalToggle.checked = settings.enabled;
    elements.badgesToggle.checked = settings.showBadges !== false;
    updateSiteUI(settings);
    updateModeUI(settings.mode);
    elements.journalToggle.checked = settings.journalingEnabled;
    elements.journalRetention.value = String(settings.journalRetentionDays || 30);
    if (!settings.hasSeenIntro && elements.introOverlay.hidden) {
      startIntro();
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
      }
    });
  }

  function sendEnabledToTab() {
    const status = getSiteStatus(state.settings);
    const enabled =
      state.settings.enabled && status.siteEnabled && status.mode !== shared.MODES.OFF && !status.snoozed;
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

  elements.siteSnooze.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "fomoff:snooze-site", host: state.host }, (settings) => {
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

  elements.shareToggle.addEventListener("click", () => {
    state.shareOpen = !state.shareOpen;
    elements.sharePanel.hidden = !state.shareOpen;
    if (state.shareOpen && state.lastPayload) {
      renderSharePreview(state.lastPayload);
    }
  });

  elements.shareHideSite.addEventListener("change", () => {
    if (state.shareOpen && state.lastPayload) {
      renderSharePreview(state.lastPayload);
    }
  });

  elements.shareCopy.addEventListener("click", copyShareImage);
  elements.shareDownload.addEventListener("click", async () => {
    if (!shareCard || !state.lastPayload) return;
    const data = getShareData(state.lastPayload);
    data.hideHost = elements.shareHideSite.checked;
    const blob = await shareCard.renderBlob(data);
    if (blob) downloadShareImage(blob);
  });

  document.querySelectorAll(".info-icon").forEach((button) => {
    button.addEventListener("click", () => {
      openSheet(button.dataset.info);
    });
  });

  elements.sheetClose.addEventListener("click", closeSheet);
  elements.infoSheet.addEventListener("click", (event) => {
    if (event.target === elements.infoSheet) closeSheet();
  });

  elements.introNext.addEventListener("click", () => {
    if (state.introIndex >= INTRO_STEPS.length - 1) {
      closeIntro(true);
      return;
    }
    showIntroStep(state.introIndex + 1);
  });

  elements.introSkip.addEventListener("click", () => closeIntro(true));
  elements.introReset.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "fomoff:update-settings", payload: { hasSeenIntro: false } }, (settings) => {
      if (settings) updateSettingsUI(settings);
    });
  });

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
      if (!elements.introOverlay.hidden) {
        closeIntro(true);
      }
    }
  });

  window.addEventListener("resize", () => {
    if (!elements.introOverlay.hidden) {
      updateIntroHighlight();
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "fomoff:state") {
      updateFromPayload(message.payload);
    }
  });

  init();
})();
