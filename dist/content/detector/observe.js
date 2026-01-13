(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const content = (root.content = root.content || {});
  const shared = root.shared;

  function observePage(state, contextProvider, onDetections) {
    if (!document.body) return null;
    const pendingRoots = new Set();
    const getContext =
      typeof contextProvider === "function" ? contextProvider : () => contextProvider;

    const flush = shared.debounce(() => {
      const roots = Array.from(pendingRoots);
      pendingRoots.clear();
      roots.forEach((node) => {
        const detections = content.scanRoot(node, getContext());
        if (detections.length) {
          onDetections(detections);
        }
      });
    }, 350);

    const observer = new MutationObserver((mutations) => {
      if (!state.enabled) return;
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData" && mutation.target.parentElement) {
          pendingRoots.add(mutation.target.parentElement);
        }
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            pendingRoots.add(node);
          }
        });
      });
      if (pendingRoots.size) {
        flush();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return observer;
  }

  content.observePage = observePage;
})();
