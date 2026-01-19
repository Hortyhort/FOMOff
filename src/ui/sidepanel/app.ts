/**
 * FOMOff v2.0 — "Breath Mode" Side Panel
 * Anti-dashboard. Anti-manipulation. Pro-calm.
 *
 * Architecture:
 * - Level 0: Breathing orb (default view)
 * - Level 1: Summary + Share hero (tap orb)
 * - Level 2: Detection receipt (tap "show details")
 * - Settings: Bottom sheet drawer
 */
(function () {
  const shared = globalThis.FOMOff.shared;
  const shareCard = globalThis.FOMOffShare;

  // ═══════════════════════════════════════════════════════════════════════════
  // DOM References
  // ═══════════════════════════════════════════════════════════════════════════
  const $ = (id: string) => document.getElementById(id);

  const dom = {
    // Screen reader
    srAnnouncer: $("sr-announcer"),

    // Orb (Level 0)
    orbContainer: $("orb-container"),
    orb: $("orb"),
    orbLabel: $("orb-label"),
    orbSublabel: $("orb-sublabel"),

    // Level 1
    level1: $("level-1"),
    shareHero: $("share-hero"),
    sharePreview: $("share-preview"),
    btnCopyShare: $("btn-copy-share"),
    btnDownloadShare: $("btn-download-share"),
    btnShowDetails: $("btn-show-details"),
    cleanState: $("clean-state"),
    summarySection: $("summary-section"),
    summaryPills: $("summary-pills"),
    siteControl: $("site-control"),
    siteHost: $("site-host"),
    siteActive: $("site-active"),
    siteTrusted: $("site-trusted"),

    // Level 2
    level2: $("level-2"),
    receiptTotal: $("receipt-total"),
    receiptList: $("receipt-list"),
    tipSwipe: $("tip-swipe"),
    tipSwipeDismiss: $("tip-swipe-dismiss"),
    btnBackToSummary: $("btn-back-to-summary"),

    // Settings sheet
    btnSettings: $("btn-settings"),
    sheetBackdrop: $("sheet-backdrop"),
    settingsSheet: $("settings-sheet"),
    btnCloseSettings: $("btn-close-settings"),
    toggleBadges: $("toggle-badges"),
    toggleJournal: $("toggle-journal"),
    btnExport: $("btn-export"),
    btnReset: $("btn-reset"),

    // Intro
    introOverlay: $("intro-overlay"),
    btnTryDemo: $("btn-try-demo"),
    btnSkipIntro: $("btn-skip-intro"),

    // Toast
    toast: $("toast"),
    toastMessage: $("toast-message"),
    toastUndo: $("toast-undo")
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // State
  // ═══════════════════════════════════════════════════════════════════════════
  const state = {
    tabId: null as number | null,
    host: "",
    settings: null as any,
    payload: null as any,
    level: 0, // 0 = orb, 1 = summary, 2 = receipt
    lastUndo: null as (() => void) | null,
    toastTimeout: null as number | null,
    coachingShown: {
      swipe: false
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Utilities
  // ═══════════════════════════════════════════════════════════════════════════
  function haptic() {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }

  function announce(message: string) {
    if (dom.srAnnouncer) {
      dom.srAnnouncer.textContent = message;
    }
  }

  function getTotal(payload: any): number {
    if (!payload) return 0;
    const total = Number(payload.total);
    return Number.isFinite(total) ? total : 0;
  }

  function safeSend(tabId: number | null, message: any, callback?: (r: any) => void) {
    if (!tabId) {
      if (callback) callback(null);
      return;
    }
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        if (callback) callback(null);
        return;
      }
      if (callback) callback(response);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigation (Level Management)
  // ═══════════════════════════════════════════════════════════════════════════
  function showLevel(level: number) {
    state.level = level;

    // Hide all levels
    dom.level1!.hidden = true;
    dom.level2!.hidden = true;

    // Orb always visible, but changes based on level
    dom.orbContainer!.hidden = false;

    if (level === 0) {
      // Just the orb
      dom.orbContainer!.style.minHeight = "180px";
    } else if (level === 1) {
      // Orb compressed + summary
      dom.orbContainer!.style.minHeight = "120px";
      dom.level1!.hidden = false;
    } else if (level === 2) {
      // Hide orb entirely, show receipt
      dom.orbContainer!.hidden = true;
      dom.level2!.hidden = false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Orb State
  // ═══════════════════════════════════════════════════════════════════════════
  function updateOrb(payload: any) {
    const total = getTotal(payload);
    const orb = dom.orb!;
    const label = dom.orbLabel!;
    const sublabel = dom.orbSublabel!;

    // Remove all state classes
    orb.classList.remove("active", "clean");

    if (total === 0) {
      // Clean state
      orb.classList.add("clean");
      label.textContent = "All clear";
      sublabel.textContent = "No pressure tactics found";
      document.body.className = "state-clean";
    } else if (total <= 3) {
      // Calm state (few tactics)
      orb.classList.add("active");
      label.textContent = `${total} dimmed`;
      sublabel.textContent = total === 1 ? "pressure tactic" : "pressure tactics";
      document.body.className = "state-calm";
    } else {
      // Warn state (many tactics)
      orb.classList.add("active");
      label.textContent = `${total} dimmed`;
      sublabel.textContent = "This site uses pressure tactics";
      document.body.className = "state-warn";
    }

    announce(`${total} pressure tactics ${total === 0 ? "found" : "dimmed"} on this page`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Summary Pills
  // ═══════════════════════════════════════════════════════════════════════════
  const CATEGORY_LABELS: Record<string, string> = {
    [shared.CATEGORIES.URGENCY]: "Urgency",
    [shared.CATEGORIES.SCARCITY]: "Scarcity",
    [shared.CATEGORIES.SOCIAL_PROOF]: "Social proof",
    [shared.CATEGORIES.FAKE_CHAT]: "Fake chat",
    [shared.CATEGORIES.NAG_OVERLAY]: "Overlays",
    [shared.CATEGORIES.FORCED_ADDON]: "Add-ons"
  };

  function renderSummaryPills(counts: Record<string, number>) {
    const container = dom.summaryPills!;
    container.innerHTML = "";

    const entries = Object.entries(counts || {})
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
      dom.summarySection!.hidden = true;
      return;
    }

    dom.summarySection!.hidden = false;

    entries.forEach(([category, count]) => {
      const pill = document.createElement("div");
      pill.className = "pill active";
      pill.innerHTML = `<span class="pill-count">${count}</span> ${CATEGORY_LABELS[category] || category}`;
      container.appendChild(pill);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Share Card
  // ═══════════════════════════════════════════════════════════════════════════
  function getShareData(payload: any) {
    const items = (payload?.items || []).slice(0, 4).map((item: any) => item.snippet || "");
    return {
      host: state.host,
      total: payload?.total || 0,
      counts: payload?.counts || {},
      snippets: items,
      hideHost: false
    };
  }

  function renderSharePreview(payload: any) {
    if (!shareCard || !payload || getTotal(payload) === 0) {
      dom.shareHero!.hidden = true;
      return;
    }

    dom.shareHero!.hidden = false;
    const data = getShareData(payload);
    const dataUrl = shareCard.renderDataUrl(data);

    dom.sharePreview!.innerHTML = "";
    const img = document.createElement("img");
    img.src = dataUrl;
    img.alt = "Reality check card preview";
    dom.sharePreview!.appendChild(img);
  }

  async function copyShareImage() {
    if (!shareCard || !state.payload) return;
    const data = getShareData(state.payload);

    try {
      const blob = await shareCard.renderBlob(data);
      if (!blob) return;

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        showToast("Image copied!", null);
        haptic();
        return;
      }
    } catch (e) {
      // Fallback to download
    }

    downloadShareImage();
  }

  async function downloadShareImage() {
    if (!shareCard || !state.payload) return;
    const data = getShareData(state.payload);
    const blob = await shareCard.renderBlob(data);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fomoff-${state.host || "site"}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    haptic();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Receipt (Detection List)
  // ═══════════════════════════════════════════════════════════════════════════
  const CONFIDENCE_ICONS: Record<string, string> = {
    high: "⚠",
    medium: "ℹ",
    low: "·"
  };

  function renderReceipt(items: any[]) {
    const container = dom.receiptList!;
    container.innerHTML = "";

    dom.receiptTotal!.textContent = `${items.length} ${items.length === 1 ? "item" : "items"}`;

    if (items.length === 0) {
      container.innerHTML = '<div class="text-muted" style="text-align: center; padding: 24px;">No items yet</div>';
      return;
    }

    // Show coaching tip on first view
    if (!state.coachingShown.swipe && items.length > 0) {
      dom.tipSwipe!.hidden = false;
    }

    items.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "item";
      card.dataset.id = item.id;
      card.dataset.index = String(index);

      const confidence = (item.confidence || "medium").toLowerCase();
      const category = CATEGORY_LABELS[item.category] || item.category || "Unknown";

      card.innerHTML = `
        <div class="item-row">
          <span class="item-category">${category}</span>
          <span class="item-confidence ${confidence}">
            <span class="item-confidence-icon">${CONFIDENCE_ICONS[confidence] || "·"}</span>
            ${confidence}
          </span>
        </div>
        <div class="item-snippet">"${item.snippet || "..."}"</div>
        <div class="item-actions">
          <button class="btn-ghost" data-action="unmute">Unmute</button>
          <button class="btn-ghost" data-action="preview">Show on page</button>
        </div>
        <span class="item-swipe-hint">← swipe to unmute</span>
      `;

      // Swipe handling
      setupSwipeToUnmute(card, item.id);

      container.appendChild(card);
    });
  }

  function setupSwipeToUnmute(card: HTMLElement, itemId: string) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    const onStart = (e: TouchEvent | MouseEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      startX = clientX;
      currentX = clientX;
      isDragging = true;
      card.classList.add("swiping");
    };

    const onMove = (e: TouchEvent | MouseEvent) => {
      if (!isDragging) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      currentX = clientX;
      const diff = currentX - startX;

      // Only allow left swipe
      if (diff < 0) {
        card.style.transform = `translateX(${Math.max(diff, -100)}px)`;
        card.style.opacity = String(1 + diff / 200);
      }
    };

    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      card.classList.remove("swiping");

      const diff = currentX - startX;

      if (diff < -60) {
        // Threshold reached - unmute
        card.classList.add("dismissed");
        haptic();

        setTimeout(() => {
          unmuteItem(itemId, card);
        }, 200);
      } else {
        // Reset position
        card.style.transform = "";
        card.style.opacity = "";
      }
    };

    card.addEventListener("touchstart", onStart, { passive: true });
    card.addEventListener("touchmove", onMove, { passive: true });
    card.addEventListener("touchend", onEnd);
    card.addEventListener("mousedown", onStart);
    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseup", onEnd);
    card.addEventListener("mouseleave", onEnd);
  }

  function unmuteItem(itemId: string, card: HTMLElement) {
    const items = state.payload?.items || [];
    const item = items.find((i: any) => i.id === itemId);

    safeSend(state.tabId, { type: "fomoff:unmute", id: itemId });

    showToast(`Unmuted "${(item?.snippet || "item").slice(0, 20)}..."`, () => {
      // Undo: re-mute
      safeSend(state.tabId, { type: "fomoff:remute", id: itemId });
      card.classList.remove("dismissed");
      card.style.transform = "";
      card.style.opacity = "";
    });

    // Update local state
    state.payload.items = items.filter((i: any) => i.id !== itemId);
    state.payload.total = Math.max(0, (state.payload.total || 0) - 1);
    updateOrb(state.payload);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Toast
  // ═══════════════════════════════════════════════════════════════════════════
  function showToast(message: string, undoFn: (() => void) | null) {
    if (state.toastTimeout) {
      clearTimeout(state.toastTimeout);
    }

    dom.toastMessage!.textContent = message;
    dom.toastUndo!.hidden = !undoFn;
    state.lastUndo = undoFn;
    dom.toast!.hidden = false;

    state.toastTimeout = window.setTimeout(() => {
      dom.toast!.hidden = true;
      state.lastUndo = null;
    }, 5000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Site Control
  // ═══════════════════════════════════════════════════════════════════════════
  function updateSiteControl(settings: any) {
    const status = shared.getSiteStatus(settings, state.host);

    dom.siteHost!.textContent = state.host || "—";

    // Update toggle states
    const isActive = status.siteEnabled && !status.allowlisted;
    const isTrusted = status.allowlisted;

    dom.siteActive!.classList.toggle("active", isActive);
    dom.siteActive!.setAttribute("aria-pressed", String(isActive));

    dom.siteTrusted!.classList.toggle("active", isTrusted);
    dom.siteTrusted!.setAttribute("aria-pressed", String(isTrusted));
  }

  function setSiteActive() {
    chrome.runtime.sendMessage(
      { type: "fomoff:set-site-enabled", host: state.host, enabled: true },
      (settings) => {
        state.settings = settings;
        updateSiteControl(settings);
        sendStateToTab();
        haptic();
        showToast("FOMOff active on this site", () => setSiteTrusted());
      }
    );
  }

  function setSiteTrusted() {
    chrome.runtime.sendMessage(
      { type: "fomoff:allow-site", host: state.host },
      (settings) => {
        state.settings = settings;
        updateSiteControl(settings);
        sendStateToTab();
        haptic();
        showToast("Trusted this site", () => setSiteActive());
      }
    );
  }

  function sendStateToTab() {
    const status = shared.getSiteStatus(state.settings, state.host);
    const enabled = state.settings?.enabled && status.siteEnabled && status.mode !== shared.MODES.OFF;
    safeSend(state.tabId, { type: "fomoff:set-enabled", enabled });
    safeSend(state.tabId, { type: "fomoff:set-mode", mode: status.mode });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Settings Sheet
  // ═══════════════════════════════════════════════════════════════════════════
  function openSettings() {
    dom.sheetBackdrop!.classList.add("visible");
    dom.settingsSheet!.classList.add("visible");
    haptic();
  }

  function closeSettings() {
    dom.sheetBackdrop!.classList.remove("visible");
    dom.settingsSheet!.classList.remove("visible");
  }

  function updateSettingsUI(settings: any) {
    state.settings = settings;

    // Badges toggle
    const badgesOn = settings.showBadges !== false;
    dom.toggleBadges!.classList.toggle("on", badgesOn);
    dom.toggleBadges!.setAttribute("aria-checked", String(badgesOn));

    // Journal toggle
    const journalOn = settings.journalingEnabled === true;
    dom.toggleJournal!.classList.toggle("on", journalOn);
    dom.toggleJournal!.setAttribute("aria-checked", String(journalOn));

    updateSiteControl(settings);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Intro
  // ═══════════════════════════════════════════════════════════════════════════
  function showIntro() {
    dom.introOverlay!.hidden = false;
  }

  function hideIntro() {
    dom.introOverlay!.hidden = true;
    chrome.runtime.sendMessage({ type: "fomoff:update-settings", payload: { hasSeenIntro: true } });
  }

  function openDemo() {
    chrome.tabs.create({ url: chrome.runtime.getURL("demo/index.html") });
    hideIntro();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Data Flow
  // ═══════════════════════════════════════════════════════════════════════════
  function updateFromPayload(payload: any) {
    state.payload = payload || { total: 0, counts: {}, items: [] };

    updateOrb(state.payload);

    // Update Level 1 content
    const total = getTotal(state.payload);
    dom.cleanState!.hidden = total > 0;
    renderSummaryPills(state.payload.counts || {});
    renderSharePreview(state.payload);

    // Update Level 2 content
    renderReceipt(state.payload.items || []);
  }

  function requestState() {
    if (!state.tabId) return;
    safeSend(state.tabId, { type: "fomoff:get-state" }, (response) => {
      updateFromPayload(response);
    });
  }

  function refreshSettings() {
    chrome.runtime.sendMessage({ type: "fomoff:get-settings" }, (settings) => {
      if (settings) {
        updateSettingsUI(settings);

        // Show intro if first time
        if (!settings.hasSeenIntro) {
          showIntro();
        }
        return;
      }

      // Fallback to storage
      chrome.storage.local.get(["settings"], (result) => {
        updateSettingsUI(shared.mergeSettings(result.settings));
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Event Handlers
  // ═══════════════════════════════════════════════════════════════════════════
  function setupEventListeners() {
    // Orb tap → Level 1
    dom.orbContainer!.addEventListener("click", () => {
      if (state.level === 0) {
        showLevel(1);
        haptic();
      } else if (state.level === 1) {
        showLevel(0);
      }
    });

    dom.orbContainer!.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        dom.orbContainer!.click();
      }
    });

    // Show details → Level 2
    dom.btnShowDetails!.addEventListener("click", () => {
      showLevel(2);
      haptic();
    });

    // Back to summary
    dom.btnBackToSummary!.addEventListener("click", () => {
      showLevel(1);
    });

    // Share actions
    dom.btnCopyShare!.addEventListener("click", copyShareImage);
    dom.btnDownloadShare!.addEventListener("click", downloadShareImage);

    // Site toggles
    dom.siteActive!.addEventListener("click", setSiteActive);
    dom.siteTrusted!.addEventListener("click", setSiteTrusted);

    // Settings
    dom.btnSettings!.addEventListener("click", openSettings);
    dom.btnCloseSettings!.addEventListener("click", closeSettings);
    dom.sheetBackdrop!.addEventListener("click", closeSettings);

    // Toggle switches
    dom.toggleBadges!.addEventListener("click", () => {
      const newValue = !dom.toggleBadges!.classList.contains("on");
      chrome.runtime.sendMessage(
        { type: "fomoff:update-settings", payload: { showBadges: newValue } },
        updateSettingsUI
      );
      haptic();
    });

    dom.toggleJournal!.addEventListener("click", () => {
      const newValue = !dom.toggleJournal!.classList.contains("on");
      chrome.runtime.sendMessage(
        { type: "fomoff:update-settings", payload: { journalingEnabled: newValue } },
        updateSettingsUI
      );
      haptic();
    });

    // Export & Reset
    dom.btnExport!.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "fomoff:get-journal" }, (journal) => {
        shared.exportAsJson(journal || {}, "fomoff-journal.json");
      });
    });

    dom.btnReset!.addEventListener("click", () => {
      if (confirm("Reset all FOMOff data? This cannot be undone.")) {
        chrome.runtime.sendMessage({ type: "fomoff:reset-all" }, () => {
          refreshSettings();
          requestState();
          closeSettings();
          showToast("All data reset", null);
        });
      }
    });

    // Intro
    dom.btnTryDemo!.addEventListener("click", openDemo);
    dom.btnSkipIntro!.addEventListener("click", hideIntro);

    // Toast undo
    dom.toastUndo!.addEventListener("click", () => {
      if (state.lastUndo) {
        state.lastUndo();
        state.lastUndo = null;
      }
      dom.toast!.hidden = true;
    });

    // Coaching tip dismiss
    dom.tipSwipeDismiss!.addEventListener("click", () => {
      dom.tipSwipe!.hidden = true;
      state.coachingShown.swipe = true;
    });

    // Receipt item actions (delegation)
    dom.receiptList!.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest("button[data-action]") as HTMLElement;
      if (!btn) return;

      const item = btn.closest(".item") as HTMLElement;
      if (!item) return;

      const id = item.dataset.id;
      const action = btn.dataset.action;

      if (action === "unmute" && id) {
        item.classList.add("dismissed");
        setTimeout(() => unmuteItem(id, item), 200);
      }

      if (action === "preview" && id) {
        safeSend(state.tabId, { type: "fomoff:preview", id });
      }
    });

    // Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (dom.settingsSheet!.classList.contains("visible")) {
          closeSettings();
        } else if (!dom.introOverlay!.hidden) {
          hideIntro();
        } else if (state.level > 0) {
          showLevel(state.level - 1);
        }
      }
    });

    // Messages from background/content
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "fomoff:state") {
        updateFromPayload(message.payload);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Initialize
  // ═══════════════════════════════════════════════════════════════════════════
  function init() {
    setupEventListeners();
    refreshSettings();
    showLevel(0);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id || !tab.url) {
        updateFromPayload({ total: 0, counts: {}, items: [] });
        return;
      }

      state.tabId = tab.id;

      try {
        state.host = new URL(tab.url).host;
      } catch {
        state.host = "";
      }

      dom.siteHost!.textContent = state.host || "—";

      chrome.runtime.sendMessage({ type: "fomoff:ensure-injected", tabId: state.tabId }, () => {
        requestState();
      });
    });
  }

  init();
})();
