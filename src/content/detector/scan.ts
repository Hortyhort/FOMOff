(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const content = (root.content = root.content || {});
  const shared = root.shared;

  function countMatches(text, patterns) {
    let count = 0;
    patterns.forEach((pattern) => {
      if (pattern.test(text)) {
        count += 1;
      }
    });
    return count;
  }

  function getMatchData(text) {
    const patterns = content.patterns;
    return {
      urgencyMatches: countMatches(text, patterns.urgency),
      scarcityMatches: countMatches(text, patterns.scarcity),
      socialMatches: countMatches(text, patterns.socialProof),
      nagMatches: countMatches(text, patterns.nagOverlay),
      fakeChatMatches: countMatches(text, patterns.fakeChat),
      timerLike: content.timerPattern.test(text)
    };
  }

  function findCandidateElement(textNode) {
    const element = textNode.parentElement;
    if (!element) return null;
    if (element.dataset && element.dataset.fomoffId) return null;
    if (shared.isTextHeavy(element, 320)) return null;
    if (element.children && element.children.length > 6) return null;
    return element;
  }

  function scanText(rootNode, context) {
    const detections = [];
    const walker = document.createTreeWalker(
      rootNode,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName ? parent.tagName.toLowerCase() : "";
          if (["script", "style", "noscript", "svg"].includes(tag)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (shared.isInsideExtensionUI(parent)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      },
      false
    );

    let node = walker.nextNode();
    while (node) {
      const text = node.nodeValue.replace(/\s+/g, " ").trim();
      if (text.length >= 4) {
        const matchData = getMatchData(text);
        const hasMatch =
          matchData.urgencyMatches ||
          matchData.scarcityMatches ||
          matchData.socialMatches ||
          matchData.nagMatches ||
          matchData.fakeChatMatches ||
          matchData.timerLike;

        if (hasMatch) {
          const element = findCandidateElement(node);
          if (element) {
            const scored = content.scoreElement(element, text, matchData, context);
            if (scored) {
              detections.push({ element, detection: scored });
            }
          }
        }
      }
      node = walker.nextNode();
    }

    return detections;
  }

  function scanForcedAddons(rootNode) {
    if (!rootNode.querySelectorAll) return [];
    const patterns = content.patterns;
    const detections = [];
    const inputs = rootNode.querySelectorAll(
      "input[type='checkbox'][checked], input[type='checkbox']:checked, input[type='radio']:checked"
    );

    inputs.forEach((input) => {
      if (input.dataset && input.dataset.fomoffId) return;
      const wrapper = input.closest("label") || input.parentElement;
      if (!wrapper) return;
      if (shared.isInsideExtensionUI(wrapper)) return;
      if (shared.hasFomoffIgnore(wrapper)) return;
      const text = (wrapper.textContent || "").replace(/\s+/g, " ").trim();
      if (!text) return;
      const matches = countMatches(text, patterns.forcedAddon);
      if (matches === 0) return;
      const detection = {
        category: shared.CATEGORIES.FORCED_ADDON,
        score: 70,
        confidence: shared.CONFIDENCE.MEDIUM,
        reasons: ["pre-selected add-on"]
      };
      detections.push({ element: wrapper, detection });
    });

    return detections;
  }

  function scanRoot(rootNode, context) {
    const detections = scanText(rootNode, context).concat(scanForcedAddons(rootNode));
    return detections;
  }

  content.scanRoot = scanRoot;
})();
