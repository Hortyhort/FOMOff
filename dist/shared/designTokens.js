(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const shared = (root.shared = root.shared || {});

  shared.designTokens = {
    colors: {
      ink: "#1f2f30",
      muted: "#5a6b6c",
      card: "#ffffff",
      border: "#d4c7b5",
      accent: "#d07a3a",
      accentSoft: "#f6e3d4",
      teal: "#2b8a8a",
      tealSoft: "#d3ebe9",
      bgTop: "#ffffff",
      bgMid: "#f6f2ea",
      bgBottom: "#e7ede9"
    },
    fonts: {
      heading: '600 20px "Futura", "Trebuchet MS", "Gill Sans", "Century Gothic", sans-serif',
      body: '400 13px "Futura", "Trebuchet MS", "Gill Sans", "Century Gothic", sans-serif',
      small: '400 11px "Futura", "Trebuchet MS", "Gill Sans", "Century Gothic", sans-serif'
    },
    radii: {
      md: 12,
      lg: 16
    }
  };
})();
