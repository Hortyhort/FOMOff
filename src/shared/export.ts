(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const shared = (root.shared = root.shared || {});

  /**
   * Export data as JSON file download
   */
  function exportAsJson(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    downloadBlob(blob, filename);
  }

  /**
   * Download a blob as a file
   */
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  shared.exportAsJson = exportAsJson;
  shared.downloadBlob = downloadBlob;
})();
