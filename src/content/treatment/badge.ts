(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const content = (root.content = root.content || {});
  const shared = root.shared;

  function applyBadge(element, detection) {
    if (!shared.isSafeToBadge(element)) return;
    const label = shared.CATEGORY_LABELS[detection.category] || "Muted";
    element.dataset.fomoffBadge = `Muted: ${label}`;
    element.dataset.fomoffWhy = detection.reasons.join(", ");
    const existingTitle = element.getAttribute("title");
    if (existingTitle && !element.dataset.fomoffTitle) {
      element.dataset.fomoffTitle = existingTitle;
    }
    element.setAttribute("title", `Muted: ${label}. Why: ${detection.reasons.join(", ")}`);
  }

  function removeBadge(element) {
    if (!element || !element.dataset) return;
    delete element.dataset.fomoffBadge;
    delete element.dataset.fomoffWhy;
    if (element.dataset.fomoffTitle) {
      element.setAttribute("title", element.dataset.fomoffTitle);
      delete element.dataset.fomoffTitle;
    } else {
      element.removeAttribute("title");
    }
  }

  content.applyBadge = applyBadge;
  content.removeBadge = removeBadge;
})();
