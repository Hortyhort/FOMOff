(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const shared = (root.shared = root.shared || {});

  shared.getHostFromUrl = function getHostFromUrl(url) {
    if (!url) return "";
    try {
      return new URL(url).host;
    } catch (error) {
      return "";
    }
  };
})();
