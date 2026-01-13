(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const content = (root.content = root.content || {});
  const shared = root.shared;

  const BADGE_LAYER_ID = "fomoff-badge-layer";

  const state = {
    enabled: true,
    layer: null,
    container: null,
    badgeMap: new Map(),
    scheduled: false,
    updatePositions: null
  };

  function ensureLayer() {
    if (state.layer && state.container) return;
    const layer = document.createElement("div");
    layer.id = BADGE_LAYER_ID;
    layer.setAttribute("data-fomoff-ui", "true");
    layer.style.position = "fixed";
    layer.style.inset = "0";
    layer.style.zIndex = "2147483645";
    layer.style.pointerEvents = "none";

    const shadow = layer.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      :host {
        all: initial;
      }
      .badge-root {
        position: fixed;
        inset: 0;
        pointer-events: none;
        font-family: "Futura", "Trebuchet MS", "Gill Sans", "Century Gothic", sans-serif;
      }
      .badge {
        position: fixed;
        max-width: 220px;
        display: grid;
        gap: 6px;
        pointer-events: auto;
        z-index: 2147483646;
      }
      .badge-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #f6e3d4;
        color: #7a4b1f;
        border: 1px solid #d2b79f;
        border-radius: 999px;
        font-size: 11px;
        padding: 4px 10px;
        box-shadow: 0 6px 14px rgba(32, 44, 45, 0.16);
        white-space: nowrap;
      }
      .badge-detail {
        background: #ffffff;
        border: 1px solid #d7c9b8;
        border-radius: 12px;
        font-size: 11px;
        color: #334040;
        padding: 8px 10px;
        line-height: 1.4;
        box-shadow: 0 10px 20px rgba(32, 44, 45, 0.18);
        opacity: 0;
        transform: translateY(-4px);
        transition: opacity 160ms ease, transform 160ms ease;
      }
      .badge:hover .badge-detail {
        opacity: 1;
        transform: translateY(0);
      }
      .badge-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 6px;
      }
      .badge-hide {
        border: none;
        background: #eef4f5;
        color: #2c3a3a;
        border-radius: 999px;
        font-size: 10px;
        padding: 2px 8px;
        cursor: pointer;
      }
    `;

    const container = document.createElement("div");
    container.className = "badge-root";

    shadow.appendChild(style);
    shadow.appendChild(container);

    shadow.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.classList.contains("badge-hide")) return;
      const badge = target.closest(".badge");
      if (!badge) return;
      const id = badge.dataset.fomoffId;
      if (!id) return;
      const entry = state.badgeMap.get(id);
      if (entry && entry.element) {
        entry.element.dataset.fomoffBadgeHidden = "true";
      }
      removeBadge(id);
      if (content.badges && typeof content.badges.onHide === "function") {
        content.badges.onHide(id, entry ? entry.element : null);
      }
    });

    document.body.appendChild(layer);
    state.layer = layer;
    state.container = container;

    const debounced = shared.debounce(() => scheduleUpdate(), 120);
    window.addEventListener("scroll", debounced, true);
    window.addEventListener("resize", debounced);

    state.updatePositions = debounced;
  }

  function scheduleUpdate() {
    if (state.scheduled) return;
    state.scheduled = true;
    requestAnimationFrame(() => {
      state.scheduled = false;
      refreshPositions();
    });
  }

  function refreshPositions() {
    if (!state.enabled) return;
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    state.badgeMap.forEach((entry) => {
      if (!entry.element.isConnected) {
        removeBadge(entry.id);
        return;
      }
      if (!shared.isProbablyVisible(entry.element)) {
        entry.badge.style.opacity = "0";
        return;
      }
      const rect = entry.element.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > viewport.height || rect.right < 0 || rect.left > viewport.width) {
        entry.badge.style.opacity = "0";
        return;
      }
      entry.badge.style.opacity = "1";
      const badgeRect = entry.badge.getBoundingClientRect();
      const position = content.computeBadgePosition(rect, badgeRect, viewport);
      entry.badge.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
    });
  }

  function buildBadgeDetail(record) {
    const label = shared.CATEGORY_LABELS[record.category] || "Pressure";
    const snippet = record.snippet ? `"${record.snippet}"` : "this copy";
    return `Why: ${snippet} is a ${label.toLowerCase()} pressure tactic.`;
  }

  function createBadge(entry) {
    const badge = document.createElement("div");
    badge.className = "badge";
    badge.dataset.fomoffId = entry.id;

    const pill = document.createElement("div");
    pill.className = "badge-pill";
    pill.textContent = `FOMOff: ${shared.CATEGORY_LABELS[entry.record.category] || "Muted"}`;

    const detail = document.createElement("div");
    detail.className = "badge-detail";
    detail.textContent = buildBadgeDetail(entry.record);

    const actions = document.createElement("div");
    actions.className = "badge-actions";
    const hide = document.createElement("button");
    hide.type = "button";
    hide.className = "badge-hide";
    hide.textContent = "Hide this";
    actions.appendChild(hide);
    detail.appendChild(actions);

    badge.appendChild(pill);
    badge.appendChild(detail);

    return badge;
  }

  function addBadge(element, record) {
    if (!state.enabled) return;
    if (!element || !record) return;
    if (element.dataset.fomoffBadgeHidden === "true") return;
    ensureLayer();
    if (state.badgeMap.has(record.id)) return;

    const badge = createBadge({ id: record.id, record });
    state.container.appendChild(badge);
    state.badgeMap.set(record.id, { id: record.id, badge, element, record });
    scheduleUpdate();
  }

  function removeBadge(id) {
    const entry = state.badgeMap.get(id);
    if (!entry) return;
    if (entry.badge && entry.badge.parentNode) {
      entry.badge.parentNode.removeChild(entry.badge);
    }
    state.badgeMap.delete(id);
  }

  function clearBadges() {
    state.badgeMap.forEach((entry) => {
      if (entry.badge && entry.badge.parentNode) {
        entry.badge.parentNode.removeChild(entry.badge);
      }
    });
    state.badgeMap.clear();
  }

  function setEnabled(enabled) {
    state.enabled = !!enabled;
    if (!state.enabled) {
      clearBadges();
      if (state.layer) {
        state.layer.style.display = "none";
      }
      return;
    }
    ensureLayer();
    state.layer.style.display = "block";
    scheduleUpdate();
  }

  function sync(records) {
    if (!state.enabled) return;
    records.forEach((entry) => {
      addBadge(entry.element, entry.record);
    });
    scheduleUpdate();
  }

  content.badges = {
    addBadge,
    removeBadge,
    clearBadges,
    setEnabled,
    sync,
    onHide: null
  };
})();
