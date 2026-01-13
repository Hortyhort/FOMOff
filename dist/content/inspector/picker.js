(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const content = (root.content = root.content || {});
  const shared = root.shared;

  function startInspector(state) {
    if (state.inspector && state.inspector.active) return;
    content.ensureStyles();

    const inspectorState = {
      active: true,
      current: null,
      tip: null
    };

    function updateHighlight(target) {
      if (inspectorState.current && inspectorState.current !== target) {
        inspectorState.current.classList.remove("fomoff-inspector-highlight");
      }
      inspectorState.current = target;
      if (target) {
        target.classList.add("fomoff-inspector-highlight");
      }
    }

    function onMove(event) {
      const target = document.elementFromPoint(event.clientX, event.clientY);
      if (!target || shared.isInsideExtensionUI(target) || target === document.body) {
        updateHighlight(null);
        return;
      }
      updateHighlight(target);
    }

    function onClick(event) {
      event.preventDefault();
      event.stopPropagation();
      const target = document.elementFromPoint(event.clientX, event.clientY);
      if (!target || shared.isInsideExtensionUI(target)) return;
      if (state.onPick) {
        state.onPick(target);
      }
    }

    function onKey(event) {
      if (event.key === "Escape") {
        stopInspector(state);
      }
    }

    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey, true);

    const tip = document.createElement("div");
    tip.className = "fomoff-picker-tip";
    tip.textContent = "Inspector: click to mute/unmute, Esc to exit.";
    document.body.appendChild(tip);

    inspectorState.tip = tip;
    inspectorState.cleanup = () => {
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey, true);
      updateHighlight(null);
      if (tip && tip.parentNode) tip.parentNode.removeChild(tip);
    };

    state.inspector = inspectorState;
  }

  function stopInspector(state) {
    if (!state.inspector || !state.inspector.active) return;
    state.inspector.active = false;
    if (state.inspector.cleanup) {
      state.inspector.cleanup();
    }
    state.inspector = null;
  }

  function toggleInspector(state) {
    if (state.inspector && state.inspector.active) {
      stopInspector(state);
    } else {
      startInspector(state);
    }
  }

  content.toggleInspector = toggleInspector;
  content.stopInspector = stopInspector;
})();
