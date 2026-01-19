(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const content = (root.content = root.content || {});
  const shared = root.shared;

  // Signal weights for scoring
  const WEIGHTS = {
    keywordBase: 35,
    keywordBonus: 8,
    keywordMax: 55,
    timer: 28,
    nearPurchase: 12,
    sticky: 18,
    highZ: 8,
    overlay: 12,
    checkedAddon: 36,
    chatBubble: 20
  };

  const THRESHOLD = 35;

  // Category configuration - data-driven instead of repetitive code
  const CATEGORY_CONFIG = {
    [shared.CATEGORIES.URGENCY]: {
      matchField: "urgencyMatches",
      useTimer: true,
      useNearPurchase: true
    },
    [shared.CATEGORIES.SCARCITY]: {
      matchField: "scarcityMatches",
      useNearPurchase: true
    },
    [shared.CATEGORIES.SOCIAL_PROOF]: {
      matchField: "socialMatches",
      useNearPurchase: true
    },
    [shared.CATEGORIES.NAG_OVERLAY]: {
      matchField: "nagMatches",
      useSticky: true,
      useHighZ: true,
      useOverlay: true,
      triggerOnVisual: true // Trigger even without keyword matches
    },
    [shared.CATEGORIES.FAKE_CHAT]: {
      matchField: "fakeChatMatches",
      useSticky: true,
      useHighZ: true,
      useChatBubble: true
    }
  };

  function confidenceFromScore(score) {
    if (score >= 70) return shared.CONFIDENCE.HIGH;
    if (score >= 50) return shared.CONFIDENCE.MEDIUM;
    return shared.CONFIDENCE.LOW;
  }

  function distanceBetween(rectA, rectB) {
    const ax = rectA.left + rectA.width / 2;
    const ay = rectA.top + rectA.height / 2;
    const bx = rectB.left + rectB.width / 2;
    const by = rectB.top + rectB.height / 2;
    return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
  }

  function isNearCta(element, ctaRects) {
    if (!ctaRects || !ctaRects.length) return false;
    const rect = element.getBoundingClientRect();
    return ctaRects.some((ctaRect) => distanceBetween(rect, ctaRect) < 260);
  }

  function getZIndex(style) {
    const raw = style.zIndex;
    if (!raw || raw === "auto") return 0;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function computeCategoryScore(config, matchData, signals) {
    let score = 0;
    const reasons = [];
    const matches = matchData[config.matchField] || 0;

    // Keyword matches
    if (matches > 0) {
      score += Math.min(WEIGHTS.keywordBase + matches * WEIGHTS.keywordBonus, WEIGHTS.keywordMax);
      reasons.push("keyword match");
    }

    // Timer boost (urgency only)
    if (config.useTimer && matchData.timerLike) {
      score += WEIGHTS.timer;
      reasons.push("timer-like text");
    }

    // Near purchase CTA
    if (config.useNearPurchase && signals.nearPurchase) {
      score += WEIGHTS.nearPurchase;
      reasons.push("near purchase action");
    }

    // Visual signals
    if (config.useSticky && signals.sticky) {
      score += WEIGHTS.sticky;
      reasons.push("sticky/fixed positioning");
    }

    if (config.useHighZ && signals.highZ) {
      score += WEIGHTS.highZ;
      reasons.push("high z-index");
    }

    if (config.useOverlay && signals.overlay) {
      score += WEIGHTS.overlay;
      reasons.push("overlay sizing");
    }

    if (config.useChatBubble && signals.chatBubble) {
      score += WEIGHTS.chatBubble;
      reasons.push("chat-like widget");
    }

    return { score, reasons };
  }

  function shouldEvaluateCategory(config, matchData, signals) {
    const matches = matchData[config.matchField] || 0;
    if (matches > 0) return true;
    if (config.matchField === "urgencyMatches" && matchData.timerLike) return true;
    if (config.triggerOnVisual && (signals.overlay || signals.highZ)) return true;
    return false;
  }

  function scoreElement(element, text, matchData, context) {
    if (!shared.isProbablyVisible(element)) return null;
    if (shared.isCriticalElement && shared.isCriticalElement(element)) return null;
    if (shared.hasFomoffIgnore(element)) return null;

    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    // Compute visual signals once
    const signals = {
      sticky: style.position === "fixed" || style.position === "sticky",
      highZ: getZIndex(style) >= 800,
      overlay: false,
      nearPurchase: isNearCta(element, context.ctaRects),
      chatBubble: false
    };

    signals.overlay = signals.sticky && rect.width >= 220 && rect.height >= 60;
    signals.chatBubble = signals.sticky && rect.width < 460 && rect.height < 360;

    // Score each category using config
    let bestCategory = null;
    let bestScore = 0;
    let bestReasons = [];

    for (const [category, config] of Object.entries(CATEGORY_CONFIG)) {
      if (!shouldEvaluateCategory(config, matchData, signals)) continue;

      const result = computeCategoryScore(config, matchData, signals);
      if (result.score > bestScore) {
        bestScore = result.score;
        bestCategory = category;
        bestReasons = result.reasons;
      }
    }

    if (!bestCategory || bestScore < THRESHOLD) return null;

    return {
      category: bestCategory,
      score: Math.min(bestScore, 100),
      confidence: confidenceFromScore(bestScore),
      reasons: bestReasons
    };
  }

  // Keep scoreSignals for backwards compatibility
  function scoreSignals(signals) {
    let score = 0;
    const reasons = [];

    if (signals.keywordMatches > 0) {
      score += Math.min(WEIGHTS.keywordBase + signals.keywordMatches * WEIGHTS.keywordBonus, WEIGHTS.keywordMax);
      reasons.push("keyword match");
    }
    if (signals.timerLike) { score += WEIGHTS.timer; reasons.push("timer-like text"); }
    if (signals.nearPurchase) { score += WEIGHTS.nearPurchase; reasons.push("near purchase action"); }
    if (signals.sticky) { score += WEIGHTS.sticky; reasons.push("sticky/fixed positioning"); }
    if (signals.highZ) { score += WEIGHTS.highZ; reasons.push("high z-index"); }
    if (signals.overlay) { score += WEIGHTS.overlay; reasons.push("overlay sizing"); }
    if (signals.checkedAddon) { score += WEIGHTS.checkedAddon; reasons.push("pre-selected add-on"); }
    if (signals.chatBubble) { score += WEIGHTS.chatBubble; reasons.push("chat-like widget"); }

    return { score, reasons };
  }

  content.scoreElement = scoreElement;
  content.scoreSignals = scoreSignals;
})();
