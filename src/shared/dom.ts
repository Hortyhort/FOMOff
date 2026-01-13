(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const shared = (root.shared = root.shared || {});

  shared.isProbablyVisible = function isProbablyVisible(element) {
    if (!element || !element.getBoundingClientRect) return false;
    const style = getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      return false;
    }
    const rect = element.getBoundingClientRect();
    return rect.width > 4 && rect.height > 4;
  };

  shared.isInteractive = function isInteractive(element) {
    if (!element || !element.tagName) return false;
    const tag = element.tagName.toLowerCase();
    if (["input", "select", "textarea", "button", "option"].includes(tag)) {
      return true;
    }
    if (tag === "a" && element.getAttribute("href")) {
      return true;
    }
    const role = element.getAttribute && element.getAttribute("role");
    return role === "button" || role === "link" || role === "menuitem";
  };

  shared.isFormOrControl = function isFormOrControl(element) {
    if (!element) return false;
    return !!element.closest("form, button, input, select, textarea, a[href]");
  };

  shared.isTextHeavy = function isTextHeavy(element, maxLen) {
    if (!element) return false;
    const text = element.textContent || "";
    return text.trim().length > maxLen;
  };

  shared.getTextSnippet = function getTextSnippet(element, maxLen) {
    if (!element) return "";
    const text = (element.textContent || "").replace(/\s+/g, " ").trim();
    if (text.length <= maxLen) return text;
    const sliceAt = Math.max(0, maxLen - 3);
    return `${text.slice(0, sliceAt)}...`;
  };

  shared.isSafeToBadge = function isSafeToBadge(element) {
    if (!element || !element.tagName) return false;
    const tag = element.tagName.toLowerCase();
    if (["input", "select", "textarea", "button", "svg", "path", "img"].includes(tag)) {
      return false;
    }
    return true;
  };

  shared.hasFomoffIgnore = function hasFomoffIgnore(element) {
    if (!element) return false;
    return !!element.closest("[data-fomoff-ignore]");
  };

  shared.isInsideExtensionUI = function isInsideExtensionUI(element) {
    if (!element) return false;
    return !!element.closest("[data-fomoff-ui]");
  };
})();
