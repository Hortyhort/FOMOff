(function () {
  const shared = globalThis.FOMOff.shared;

  const elements = {
    globalToggle: document.getElementById("global-toggle"),
    badgesToggle: document.getElementById("badges-toggle"),
    introReset: document.getElementById("intro-reset"),
    journalToggle: document.getElementById("journal-toggle"),
    journalRetention: document.getElementById("journal-retention"),
    allowlist: document.getElementById("allowlist"),
    exportJournal: document.getElementById("export-journal"),
    deleteAll: document.getElementById("delete-all")
  };

  let currentSettings = null;

  function updateModeUI(mode) {
    document.querySelectorAll(".mode").forEach((button) => {
      const isActive = button.dataset.mode === mode;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function renderAllowlist(settings) {
    elements.allowlist.innerHTML = "";
    const entries = Object.entries(settings.siteOverrides || {}).filter(
      ([, value]) => value && value.allowlist
    );
    if (!entries.length) {
      const empty = document.createElement("div");
      empty.className = "footer";
      empty.textContent = "No trusted sites yet.";
      elements.allowlist.appendChild(empty);
      return;
    }
    entries.forEach(([host]) => {
      const row = document.createElement("div");
      row.className = "allowlist-item";
      row.innerHTML = `<span>${host}</span>`;
      const button = document.createElement("button");
      button.className = "button";
      button.textContent = "Remove";
      button.addEventListener("click", () => {
        chrome.runtime.sendMessage(
          { type: "fomoff:set-site-enabled", host, enabled: true },
          refresh
        );
      });
      row.appendChild(button);
      elements.allowlist.appendChild(row);
    });
  }

  function updateUI(settings) {
    currentSettings = settings;
    elements.globalToggle.checked = settings.enabled;
    elements.badgesToggle.checked = settings.showBadges !== false;
    elements.journalToggle.checked = settings.journalingEnabled;
    elements.journalRetention.value = String(settings.journalRetentionDays || 30);
    updateModeUI(settings.mode);
    renderAllowlist(settings);
  }

  function refresh() {
    chrome.runtime.sendMessage({ type: "fomoff:get-settings" }, updateUI);
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
    chrome.runtime.sendMessage({ type: "fomoff:reset-all" }, refresh);
  }

  elements.globalToggle.addEventListener("change", () => {
    chrome.runtime.sendMessage(
      { type: "fomoff:set-global-enabled", enabled: elements.globalToggle.checked },
      refresh
    );
  });

  elements.badgesToggle.addEventListener("change", () => {
    chrome.runtime.sendMessage(
      { type: "fomoff:update-settings", payload: { showBadges: elements.badgesToggle.checked } },
      refresh
    );
  });

  elements.introReset.addEventListener("click", () => {
    chrome.runtime.sendMessage(
      { type: "fomoff:update-settings", payload: { hasSeenIntro: false } },
      refresh
    );
  });

  elements.journalToggle.addEventListener("change", () => {
    chrome.runtime.sendMessage(
      { type: "fomoff:update-settings", payload: { journalingEnabled: elements.journalToggle.checked } },
      refresh
    );
  });

  elements.journalRetention.addEventListener("change", () => {
    chrome.runtime.sendMessage(
      {
        type: "fomoff:update-settings",
        payload: { journalRetentionDays: Number(elements.journalRetention.value) }
      },
      refresh
    );
  });

  document.querySelectorAll(".mode").forEach((button) => {
    button.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "fomoff:set-mode", mode: button.dataset.mode }, refresh);
    });
  });

  elements.exportJournal.addEventListener("click", exportJournal);
  elements.deleteAll.addEventListener("click", deleteAll);

  refresh();
})();
