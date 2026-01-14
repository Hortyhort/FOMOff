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

  function normalizeToken(value) {
    if (!value) return "";
    return String(value)
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[^a-z0-9]+/gi, " ")
      .toLowerCase();
  }

  function hasCriticalKeyword(element) {
    if (!element || !element.getAttribute) return false;
    const labelParts = [
      element.id,
      element.className,
      element.getAttribute("aria-label"),
      element.getAttribute("data-test"),
      element.getAttribute("data-testid"),
      element.getAttribute("data-qa")
    ]
      .filter(Boolean)
      .join(" ");
    if (!labelParts) return false;
    const normalized = normalizeToken(labelParts);
    return /(checkout|cart|bag|payment|order|subtotal|total|shipping|tax|price|amount|pay)\b/i.test(
      normalized
    );
  }

  shared.isCriticalElement = function isCriticalElement(element) {
    if (!element || !element.closest) return false;
    if (element.closest("[data-fomoff-critical]")) return true;
    if (element.closest("form, button, input, select, textarea")) return true;
    if (element.closest("a[href], [role='button'], [role='link'], [role='menuitem']")) return true;
    let current = element;
    let depth = 0;
    while (current && depth < 4) {
      if (hasCriticalKeyword(current)) return true;
      current = current.parentElement;
      depth += 1;
    }
    return false;
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
