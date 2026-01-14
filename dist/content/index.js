(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const content = (root.content = root.content || {});
  const shared = root.shared;

  if (content.initialized) return;
  content.initialized = true;

  const state = {
    enabled: true,
    mode: shared.MODES.CALM,
    host: "",
    observer: null,
    records: new Map(),
    order: [],
    counter: 0,
    lastContextElement: null,
    journalingEnabled: true,
    journalRetentionDays: 30,
    showBadges: true,
    falsePositives: new Set(),
    inspector: null,
    onPick: null,
    snoozeTimer: null,
    previewTimers: new Map()
  };

  content.state = state;

  function mergeSettings(stored) {
    const merged = Object.assign({}, shared.DEFAULT_SETTINGS, stored || {});
    merged.siteOverrides = merged.siteOverrides || {};
    merged.falsePositives = merged.falsePositives || [];
    if (typeof merged.showBadges === "undefined") {
      merged.showBadges = typeof merged.badgesEnabled !== "undefined" ? merged.badgesEnabled : true;
    }
    return merged;
  }

  function getHost() {
    return location && location.host ? location.host : "";
  }

  function getSiteOverride(settings, host) {
    return settings.siteOverrides[host] || {};
  }

  function computeEnabled(settings, host) {
    const siteOverride = getSiteOverride(settings, host);
    const globalEnabled = settings.enabled && settings.mode !== shared.MODES.OFF;
    const snoozed = siteOverride.snoozeUntil && siteOverride.snoozeUntil > Date.now();
    const siteEnabled = siteOverride.enabled !== false && !siteOverride.allowlist && !snoozed;
    const mode = siteOverride.mode || settings.mode;
    return {
      enabled: globalEnabled && siteEnabled && mode !== shared.MODES.OFF,
      mode,
      snoozed,
      snoozeUntil: siteOverride.snoozeUntil || null
    };
  }

  function buildContext() {
    const ctaRects = [];
    const patterns = content.patterns.buyCta;
    const candidates = document.querySelectorAll(
      "button, a, input[type='submit'], input[type='button'], [role='button']"
    );
    candidates.forEach((el) => {
      const text = (el.textContent || el.value || "").replace(/\s+/g, " ").trim();
      if (!text) return;
      if (patterns.some((pattern) => pattern.test(text))) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          ctaRects.push(rect);
        }
      }
    });
    return { ctaRects };
  }

  function buildSignature(host, detection, snippet) {
    const raw = `${host}|${detection.category}|${snippet.toLowerCase()}`;
    return shared.hashString(raw);
  }

  function addRecord(element, detection, snippet) {
    const id = `fomoff-${Date.now()}-${state.counter++}`;
    element.dataset.fomoffId = id;
    const record = {
      id,
      category: detection.category,
      confidence: detection.confidence,
      score: detection.score,
      reasons: detection.reasons,
      snippet,
      muted: true,
      time: Date.now()
    };
    state.records.set(id, { element, record });
    state.order.unshift(id);
    return record;
  }

  function setBadgeMode(enabled) {
    state.showBadges = !!enabled;
    const shouldShow = state.showBadges && state.enabled;
    if (document.body) {
      document.body.dataset.fomoffInlineBadges = shouldShow ? "false" : "true";
    }
    if (!content.badges) return;
    content.badges.setEnabled(shouldShow);
    if (shouldShow) {
      content.badges.sync(Array.from(state.records.values()));
    }
  }

  function applyDetections(detections) {
    if (!detections.length) return;
    const counts = {};

    detections.forEach(({ element, detection }) => {
      if (!element || element.dataset.fomoffId) return;
      const snippet = shared.getTextSnippet(element, 160);
      const signature = buildSignature(state.host, detection, snippet);
      if (state.falsePositives.has(signature)) return;
      const applied = content.applyTreatment(element, detection, state.mode);
      if (!applied) return;
      const record = addRecord(element, detection, snippet);
      if (state.showBadges && content.badges) {
        content.badges.addBadge(element, record);
      }
      counts[detection.category] = (counts[detection.category] || 0) + 1;
    });

    if (Object.keys(counts).length) {
      notifyUpdate();
      sendJournal(counts);
    }
  }

  function scanInitial() {
    if (!state.enabled) return;
    const context = buildContext();
    const detections = content.scanRoot(document.body, context);
    applyDetections(detections);
  }

  function startObserver() {
    if (state.observer) return;
    state.observer = content.observePage(state, buildContext, applyDetections);
  }

  function stopObserver() {
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
  }

  function unmuteAll() {
    state.records.forEach(({ element }) => {
      content.removeBadge(element);
      content.restoreElement(element);
    });
    if (content.badges) {
      content.badges.clearBadges();
    }
    state.records.clear();
    state.order = [];
  }

  function setEnabled(enabled) {
    state.enabled = enabled;
    if (!enabled) {
      stopObserver();
      unmuteAll();
    } else {
      startObserver();
      scanInitial();
    }
    notifyUpdate();
    setBadgeMode(state.showBadges);
  }

  function setMode(mode) {
    state.mode = mode;
    state.records.forEach(({ element }) => {
      if (element.dataset.fomoffManual) return;
      element.classList.remove("fomoff-zen", "fomoff-collapsed");
      if (mode === shared.MODES.ZEN) {
        element.classList.add("fomoff-zen");
      }
    });
    notifyUpdate();
  }

  function scheduleSnooze(settings) {
    if (state.snoozeTimer) {
      clearTimeout(state.snoozeTimer);
      state.snoozeTimer = null;
    }
    const override = getSiteOverride(settings, state.host);
    if (!override.snoozeUntil) return;
    const remaining = override.snoozeUntil - Date.now();
    if (remaining <= 0) return;
    state.snoozeTimer = setTimeout(async () => {
      const updated = await loadSettings();
      const status = computeEnabled(updated, state.host);
      state.mode = status.mode;
      setEnabled(status.enabled);
    }, remaining + 200);
  }

  function notifyUpdate() {
    if (!state.emitUpdate) {
      state.emitUpdate = shared.debounce(() => {
        chrome.runtime.sendMessage({
          type: "fomoff:state",
          payload: getStatePayload()
        });
      }, 200);
    }
    state.emitUpdate();
  }

  function getStatePayload() {
    const counts = {};
    state.records.forEach(({ record }) => {
      counts[record.category] = (counts[record.category] || 0) + (record.muted ? 1 : 0);
    });
    return {
      enabled: state.enabled,
      mode: state.mode,
      host: state.host,
      total: Object.values(counts).reduce((sum, value) => sum + value, 0),
      counts,
      items: state.order
        .map((id) => state.records.get(id))
        .filter(Boolean)
        .map(({ record }) => record)
    };
  }

  function sendJournal(counts) {
    if (!state.journalingEnabled) return;
    chrome.runtime.sendMessage({
      type: "fomoff:journal",
      payload: { counts }
    });
  }

  function toggleMute(element) {
    if (!element) return;
    if (element.dataset.fomoffId) {
      const entry = state.records.get(element.dataset.fomoffId);
      if (entry && entry.record.muted) {
        content.removeBadge(element);
        content.restoreElement(element);
        if (content.badges) {
          content.badges.removeBadge(entry.record.id);
        }
        entry.record.muted = false;
      } else if (entry) {
        const applied = content.applyTreatment(element, entry.record, state.mode);
        if (applied) {
          if (state.showBadges && content.badges) {
            content.badges.addBadge(element, entry.record);
          }
          entry.record.muted = true;
        }
      }
      notifyUpdate();
      return;
    }

    const detection = {
      category: shared.CATEGORIES.MANUAL,
      confidence: shared.CONFIDENCE.HIGH,
      score: 100,
      reasons: ["user muted"]
    };
    const applied = content.applyTreatment(element, detection, state.mode);
    if (!applied) return;
    element.dataset.fomoffManual = "true";
    const record = addRecord(element, detection, shared.getTextSnippet(element, 120));
    if (state.showBadges && content.badges) {
      content.badges.addBadge(element, record);
    }
    notifyUpdate();
  }

  function unmuteById(id) {
    const entry = state.records.get(id);
    if (!entry) return;
    content.removeBadge(entry.element);
    content.restoreElement(entry.element);
    if (content.badges) {
      content.badges.removeBadge(id);
    }
    entry.record.muted = false;
    notifyUpdate();
  }

  function previewToggle(id) {
    const entry = state.records.get(id);
    if (!entry) return;
    if (state.previewTimers.has(id)) {
      clearTimeout(state.previewTimers.get(id));
      state.previewTimers.delete(id);
    }
    const wasMuted = entry.record.muted;
    if (wasMuted) {
      unmuteById(id);
    } else {
      const applied = content.applyTreatment(entry.element, entry.record, state.mode);
      if (applied) {
        if (state.showBadges && content.badges) {
          content.badges.addBadge(entry.element, entry.record);
        }
        entry.record.muted = true;
      } else {
        entry.record.muted = false;
      }
      notifyUpdate();
    }
    const timer = setTimeout(() => {
      state.previewTimers.delete(id);
      const current = state.records.get(id);
      if (!current) return;
      if (wasMuted) {
        const applied = content.applyTreatment(current.element, current.record, state.mode);
        if (applied) {
          if (state.showBadges && content.badges) {
            content.badges.addBadge(current.element, current.record);
          }
          current.record.muted = true;
        } else {
          current.record.muted = false;
        }
      } else {
        content.removeBadge(current.element);
        content.restoreElement(current.element);
        if (content.badges) {
          content.badges.removeBadge(id);
        }
        current.record.muted = false;
      }
      notifyUpdate();
    }, 1500);
    state.previewTimers.set(id, timer);
  }

  function reportFalsePositive(id) {
    const entry = state.records.get(id);
    if (!entry) return;
    const signature = buildSignature(state.host, entry.record, entry.record.snippet);
    state.falsePositives.add(signature);
    chrome.storage.local.get(["settings"], (result) => {
      const settings = mergeSettings(result.settings);
      settings.falsePositives = Array.from(state.falsePositives);
      chrome.storage.local.set({ settings });
    });
    unmuteById(id);
  }

  function handleMessage(message, sender, sendResponse) {
    if (!message || !message.type) return;
    switch (message.type) {
      case "fomoff:get-state":
        sendResponse(getStatePayload());
        break;
      case "fomoff:set-enabled":
        setEnabled(!!message.enabled);
        sendResponse({ ok: true });
        break;
      case "fomoff:set-mode":
        if (message.mode) {
          setMode(message.mode);
        }
        sendResponse({ ok: true });
        break;
      case "fomoff:unmute":
        if (message.id) {
          unmuteById(message.id);
        }
        sendResponse({ ok: true });
        break;
      case "fomoff:preview":
        if (message.id) {
          previewToggle(message.id);
        }
        sendResponse({ ok: true });
        break;
      case "fomoff:toggle-inspector":
        state.onPick = (target) => toggleMute(target);
        content.toggleInspector(state);
        sendResponse({ ok: true });
        break;
      case "fomoff:context-action":
        if (message.action === "mute" && state.lastContextElement) {
          toggleMute(state.lastContextElement);
        }
        if (message.action === "unmute" && state.lastContextElement) {
          if (state.lastContextElement.dataset.fomoffId) {
            unmuteById(state.lastContextElement.dataset.fomoffId);
          }
        }
        sendResponse({ ok: true });
        break;
      case "fomoff:report-false-positive":
        if (message.id) {
          reportFalsePositive(message.id);
        }
        sendResponse({ ok: true });
        break;
      default:
        break;
    }
  }

  function onContextMenu(event) {
    state.lastContextElement = event.target;
  }

  function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["settings"], (result) => {
        resolve(mergeSettings(result.settings));
      });
    });
  }

  async function init() {
    state.host = getHost();
    const settings = await loadSettings();
    state.journalingEnabled = settings.journalingEnabled;
    state.journalRetentionDays = settings.journalRetentionDays;
    state.falsePositives = new Set(settings.falsePositives || []);
    state.showBadges = settings.showBadges !== false;
    if (content.badges) {
      content.badges.onHide = (id) => {
        const entry = state.records.get(id);
        if (entry) entry.record.badgeHidden = true;
      };
    }

    const status = computeEnabled(settings, state.host);
    state.mode = status.mode;
    setEnabled(status.enabled);
    setBadgeMode(state.showBadges);
    scheduleSnooze(settings);

    document.addEventListener("contextmenu", onContextMenu, true);
  }

  chrome.runtime.onMessage.addListener(handleMessage);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.settings) return;
    const settings = mergeSettings(changes.settings.newValue);
    state.journalingEnabled = settings.journalingEnabled;
    state.journalRetentionDays = settings.journalRetentionDays;
    state.falsePositives = new Set(settings.falsePositives || []);
    state.showBadges = settings.showBadges !== false;
    const status = computeEnabled(settings, state.host);
    state.mode = status.mode;
    setEnabled(status.enabled);
    setBadgeMode(state.showBadges);
    scheduleSnooze(settings);
  });

  init();
})();
