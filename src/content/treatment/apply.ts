(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const content = (root.content = root.content || {});
  const shared = root.shared;

  function shouldCollapse(element, mode) {
    if (mode !== shared.MODES.ZEN) return false;
    if (!element || !element.textContent) return false;
    if (shared.isFormOrControl(element)) return false;
    if (element.querySelector && element.querySelector("input, button, select, textarea, a[href]")) {
      return false;
    }
    const text = element.textContent.trim();
    if (text.length < 40) return false;
    const rect = element.getBoundingClientRect();
    if (rect.height < 36 || rect.height > 260) return false;
    return true;
  }

  function applyTreatment(element, detection, mode) {
    if (!element) return false;
    if (shared.isCriticalElement && shared.isCriticalElement(element)) return false;
    content.ensureStyles();
    element.classList.add("fomoff-muted");
    element.dataset.fomoffMuted = "true";
    element.dataset.fomoffCategory = detection.category;
    element.dataset.fomoffConfidence = detection.confidence;
    element.dataset.fomoffMode = mode;

    if (mode === shared.MODES.ZEN) {
      element.classList.add("fomoff-zen");
    }

    if (shouldCollapse(element, mode)) {
      content.rememberStyle(element, { maxHeight: "", overflow: "" });
      element.classList.add("fomoff-collapsed");
    }

    content.applyBadge(element, detection);
    return true;
  }

  content.applyTreatment = applyTreatment;
})();
