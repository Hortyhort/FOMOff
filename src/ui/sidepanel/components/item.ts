(function () {
  const root = (globalThis.FOMOffPanel = globalThis.FOMOffPanel || {});
  const shared = globalThis.FOMOff.shared;

  function createAction(label, action, variant) {
    const button = document.createElement("button");
    button.className = `button ${variant || "ghost"}`.trim();
    button.textContent = label;
    button.dataset.action = action;
    return button;
  }

  root.renderItem = function renderItem(item) {
    const wrapper = document.createElement("div");
    wrapper.className = "item";
    wrapper.dataset.id = item.id;

    const header = document.createElement("div");
    header.className = "item-header";

    const chip = document.createElement("div");
    chip.className = "item-chip";
    chip.textContent = shared.CATEGORY_LABELS[item.category] || "Muted";

    const confidence = document.createElement("div");
    confidence.className = "item-confidence";
    confidence.textContent = `Confidence: ${item.confidence}`;

    header.appendChild(chip);
    header.appendChild(confidence);

    const snippet = document.createElement("div");
    snippet.className = "item-snippet";
    snippet.textContent = item.snippet || "(no text)";

    const reasons = document.createElement("div");
    reasons.className = "item-reasons";
    reasons.textContent = item.reasons && item.reasons.length
      ? `Why: ${item.reasons.join(" - ")}`
      : "Why: keyword match";

    const actions = document.createElement("div");
    actions.className = "item-actions";
    actions.appendChild(createAction(item.muted ? "Unmute" : "Mute", "unmute", "primary"));
    actions.appendChild(createAction("Preview", "preview"));
    actions.appendChild(createAction("Allow site", "allow-site"));
    actions.appendChild(createAction("False positive", "false-positive"));

    wrapper.appendChild(header);
    wrapper.appendChild(snippet);
    wrapper.appendChild(reasons);
    wrapper.appendChild(actions);

    return wrapper;
  };
})();
