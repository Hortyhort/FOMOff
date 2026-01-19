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
        --fomoff-muted-filter: saturate(0.6);
        --fomoff-badge-bg: #eef4f5;
        --fomoff-badge-text: #2a3a3a;
        --fomoff-badge-border: #c7d6d6;
      }

      .fomoff-muted {
        opacity: var(--fomoff-muted-opacity) !important;
        filter: var(--fomoff-muted-filter) !important;
        font-weight: 400 !important;
        transition: opacity 180ms ease, filter 180ms ease;
      }

      .fomoff-muted.fomoff-collapsed {
        max-height: 1.6em !important;
        overflow: hidden !important;
      }

      .fomoff-muted[data-fomoff-badge] {
        position: relative !important;
      }

      body[data-fomoff-inline-badges="true"] .fomoff-muted[data-fomoff-badge]::after {
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
    `;
    document.head.appendChild(style);
  }

  content.ensureStyles = ensureStyles;
})();
