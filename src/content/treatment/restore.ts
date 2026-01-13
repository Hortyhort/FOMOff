(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const content = (root.content = root.content || {});

  const ORIGINAL_STYLES = new WeakMap();

  function rememberStyle(element, props) {
    if (!element) return;
    if (!ORIGINAL_STYLES.has(element)) {
      ORIGINAL_STYLES.set(element, {});
    }
    const record = ORIGINAL_STYLES.get(element);
    Object.keys(props).forEach((key) => {
      if (!(key in record)) {
        record[key] = element.style[key];
      }
    });
  }

  function restoreElement(element) {
    if (!element) return;
    element.classList.remove("fomoff-muted", "fomoff-zen", "fomoff-collapsed");
    element.dataset.fomoffMuted = "false";
    const record = ORIGINAL_STYLES.get(element);
    if (record) {
      Object.keys(record).forEach((key) => {
        element.style[key] = record[key];
      });
      ORIGINAL_STYLES.delete(element);
    }
    delete element.dataset.fomoffMode;
  }

  content.rememberStyle = rememberStyle;
  content.restoreElement = restoreElement;
})();
