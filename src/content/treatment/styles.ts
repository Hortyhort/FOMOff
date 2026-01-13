(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const content = (root.content = root.content || {});

  const STYLE_ID = "fomoff-style";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      :root {
        --fomoff-muted-opacity: 0.45;
        --fomoff-muted-opacity-zen: 0.3;
        --fomoff-muted-filter: saturate(0.6);
        --fomoff-muted-filter-zen: grayscale(0.45) blur(0.6px) saturate(0.4);
        --fomoff-badge-bg: #eef4f5;
        --fomoff-badge-text: #2a3a3a;
        --fomoff-badge-border: #c7d6d6;
        --fomoff-highlight: #2aa8a8;
      }

      .fomoff-muted {
        opacity: var(--fomoff-muted-opacity) !important;
        filter: var(--fomoff-muted-filter) !important;
        font-weight: 400 !important;
        transition: opacity 180ms ease, filter 180ms ease, transform 180ms ease;
      }

      .fomoff-muted.fomoff-zen {
        opacity: var(--fomoff-muted-opacity-zen) !important;
        filter: var(--fomoff-muted-filter-zen) !important;
        transform: scale(0.98);
      }

      .fomoff-muted.fomoff-collapsed {
        max-height: 1.6em !important;
        overflow: hidden !important;
      }

      .fomoff-muted[data-fomoff-badge] {
        position: relative !important;
      }

      .fomoff-muted[data-fomoff-badge]::after {
        content: attr(data-fomoff-badge);
        position: absolute;
        top: -10px;
        right: -6px;
        background: var(--fomoff-badge-bg);
        color: var(--fomoff-badge-text);
        border: 1px solid var(--fomoff-badge-border);
        border-radius: 999px;
        font-size: 10px;
        letter-spacing: 0.02em;
        padding: 2px 6px;
        opacity: 0.8;
        pointer-events: none;
        white-space: nowrap;
      }

      .fomoff-muted[data-fomoff-badge]:hover::after {
        opacity: 1;
      }

      .fomoff-inspector-highlight {
        outline: 2px solid var(--fomoff-highlight) !important;
        outline-offset: 2px !important;
      }

      .fomoff-picker-tip {
        position: fixed;
        bottom: 16px;
        left: 16px;
        z-index: 2147483646;
        background: #f7f3ec;
        color: #2d3838;
        border: 1px solid #d7c9b8;
        border-radius: 12px;
        padding: 10px 14px;
        font-size: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  content.ensureStyles = ensureStyles;
})();
