(function () {
  const shared = globalThis.FOMOff.shared;
  const tokens = shared.designTokens || {};

  function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const words = text.split(" ");
    let line = "";
    let lines = 0;
    for (let i = 0; i < words.length; i += 1) {
      const test = line ? `${line} ${words[i]}` : words[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, y);
        line = words[i];
        y += lineHeight;
        lines += 1;
        if (lines >= maxLines - 1) break;
      } else {
        line = test;
      }
    }
    if (line && lines < maxLines) {
      ctx.fillText(line, x, y);
    }
  }

  function buildCanvas(data) {
    const width = 900;
    const height = 520;
    const scale = window.devicePixelRatio || 1;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, tokens.colors ? tokens.colors.bgTop : "#ffffff");
    gradient.addColorStop(0.5, tokens.colors ? tokens.colors.bgMid : "#f6f2ea");
    gradient.addColorStop(1, tokens.colors ? tokens.colors.bgBottom : "#e7ede9");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = tokens.colors ? tokens.colors.card : "#ffffff";
    roundedRect(ctx, 32, 32, width - 64, height - 64, 24);
    ctx.fill();

    ctx.strokeStyle = tokens.colors ? tokens.colors.border : "#d4c7b5";
    ctx.lineWidth = 1;
    roundedRect(ctx, 32, 32, width - 64, height - 64, 24);
    ctx.stroke();

    const hostLabel = data.hideHost ? "This site" : data.host || "This site";
    const headline = data.headline || `Cart ${hostLabel} - Reality Check`;
    const subhead = data.subhead || "pressure tactics detected";
    const footer = data.footer || "FOMOff - Reality Check";
    ctx.fillStyle = tokens.colors ? tokens.colors.ink : "#1f2f30";
    ctx.font = tokens.fonts ? tokens.fonts.heading : "600 20px Futura, sans-serif";
    ctx.fillText(headline, 64, 80);

    ctx.font = "600 64px Futura, sans-serif";
    ctx.fillStyle = tokens.colors ? tokens.colors.teal : "#2b8a8a";
    ctx.fillText(String(data.total || 0), 64, 150);

    ctx.font = "400 16px Futura, sans-serif";
    ctx.fillStyle = tokens.colors ? tokens.colors.ink : "#1f2f30";
    ctx.fillText(subhead, 64, 180);

    const categoryEntries = Object.entries(data.counts || {})
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    let pillX = 64;
    let pillY = 210;
    ctx.font = "500 12px Futura, sans-serif";

    categoryEntries.forEach(([category, count]) => {
      const label = shared.CATEGORY_LABELS[category] || category;
      const text = `${count} ${label}`;
      const textWidth = ctx.measureText(text).width;
      const pillWidth = textWidth + 24;
      ctx.fillStyle = tokens.colors ? tokens.colors.accentSoft : "#f6e3d4";
      roundedRect(ctx, pillX, pillY, pillWidth, 26, 13);
      ctx.fill();
      ctx.strokeStyle = tokens.colors ? tokens.colors.accent : "#d07a3a";
      ctx.stroke();
      ctx.fillStyle = "#7a4b1f";
      ctx.fillText(text, pillX + 12, pillY + 18);
      pillX += pillWidth + 8;
    });

    ctx.fillStyle = tokens.colors ? tokens.colors.ink : "#1f2f30";
    ctx.font = "600 14px Futura, sans-serif";
    const snippets = (data.snippets || []).filter(Boolean).slice(0, 4);
    if (snippets.length) {
      ctx.fillText("Examples (trimmed):", 64, 280);

      ctx.font = "400 13px Futura, sans-serif";
      ctx.fillStyle = tokens.colors ? tokens.colors.muted : "#5a6b6c";
      let snippetY = 305;

      snippets.forEach((snippet) => {
        const trimmed = snippet.length > 96 ? `${snippet.slice(0, 93)}...` : snippet;
        drawWrappedText(ctx, `"${trimmed}"`, 64, snippetY, 760, 18, 2);
        snippetY += 36;
      });
    }

    ctx.fillStyle = tokens.colors ? tokens.colors.muted : "#5a6b6c";
    ctx.font = tokens.fonts ? tokens.fonts.small : "400 11px Futura, sans-serif";
    ctx.fillText(footer, 64, height - 64);

    ctx.strokeStyle = tokens.colors ? tokens.colors.teal : "#2b8a8a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width - 110, height - 76);
    ctx.lineTo(width - 86, height - 76);
    ctx.lineTo(width - 74, height - 56);
    ctx.lineTo(width - 122, height - 56);
    ctx.closePath();
    ctx.stroke();

    return canvas;
  }

  function renderDataUrl(data) {
    const canvas = buildCanvas(data);
    return canvas.toDataURL("image/png");
  }

  function renderBlob(data) {
    return new Promise((resolve) => {
      const canvas = buildCanvas(data);
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }

  globalThis.FOMOffShare = {
    renderDataUrl,
    renderBlob
  };
})();
