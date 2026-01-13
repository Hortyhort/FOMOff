(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const content = (root.content = root.content || {});

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function computeBadgePosition(rect, badgeRect, viewport) {
    const offset = 8;
    const minX = 8;
    const minY = 8;
    const maxX = viewport.width - badgeRect.width - 8;
    const maxY = viewport.height - badgeRect.height - 8;

    let x = rect.right + offset;
    let y = rect.top - offset;

    if (x > maxX) {
      x = rect.left - badgeRect.width - offset;
    }

    if (y < minY) {
      y = rect.bottom + offset;
    }

    x = clamp(x, minX, Math.max(minX, maxX));
    y = clamp(y, minY, Math.max(minY, maxY));

    return { x, y };
  }

  content.computeBadgePosition = computeBadgePosition;
})();
