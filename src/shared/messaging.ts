(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const shared = (root.shared = root.shared || {});

  /**
   * Safely send message to a tab, handling lastError
   * Prevents "Unchecked runtime.lastError" warnings
   */
  function safeSendMessage(tabId, message, callback) {
    if (!tabId) {
      if (callback) callback(null);
      return;
    }
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        // Silently ignore - tab may be an error page or restricted URL
        if (callback) callback(null);
        return;
      }
      if (callback) callback(response);
    });
  }

  /**
   * Safely execute script on a tab, handling lastError
   */
  function safeExecuteScript(tabId, files) {
    return new Promise((resolve) => {
      chrome.scripting.executeScript(
        { target: { tabId }, files },
        () => {
          if (chrome.runtime.lastError) {
            // Silently ignore - tab may be an error page or restricted URL
          }
          resolve();
        }
      );
    });
  }

  shared.safeSendMessage = safeSendMessage;
  shared.safeExecuteScript = safeExecuteScript;
})();
