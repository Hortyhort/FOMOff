(function () {
  const root = (globalThis.FOMOff = globalThis.FOMOff || {});
  const content = (root.content = root.content || {});
  const shared = root.shared;

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
    const dx = ax - bx;
    const dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
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

  function scoreSignals(signals) {
    let score = 0;
    const reasons = [];

    if (signals.keywordMatches > 0) {
      score += Math.min(35 + signals.keywordMatches * 8, 55);
      reasons.push("keyword match");
    }

    if (signals.timerLike) {
      score += 28;
      reasons.push("timer-like text");
    }

    if (signals.nearPurchase) {
      score += 12;
      reasons.push("near purchase action");
    }

    if (signals.sticky) {
      score += 18;
      reasons.push("sticky/fixed positioning");
    }

    if (signals.highZ) {
      score += 8;
      reasons.push("high z-index");
    }

    if (signals.overlay) {
      score += 12;
      reasons.push("overlay sizing");
    }

    if (signals.checkedAddon) {
      score += 36;
      reasons.push("pre-selected add-on");
    }

    if (signals.chatBubble) {
      score += 20;
      reasons.push("chat-like widget");
    }

    return { score, reasons };
  }

  function scoreElement(element, text, matchData, context) {
    if (!shared.isProbablyVisible(element)) return null;
    if (shared.isFormOrControl(element)) return null;
    if (shared.hasFomoffIgnore(element)) return null;

    const style = getComputedStyle(element);
    const sticky = style.position === "fixed" || style.position === "sticky";
    const zIndex = getZIndex(style);
    const highZ = zIndex >= 800;
    const rect = element.getBoundingClientRect();
    const overlay = sticky && rect.width >= 220 && rect.height >= 60;
    const nearPurchase = isNearCta(element, context.ctaRects);

    const categoryScores = {};
    const categoryReasons = {};
    const categories = shared.CATEGORIES;

    function applyScore(category, signals) {
      const scored = scoreSignals(signals);
      categoryScores[category] = (categoryScores[category] || 0) + scored.score;
      categoryReasons[category] = (categoryReasons[category] || []).concat(scored.reasons);
    }

    if (matchData.urgencyMatches > 0 || matchData.timerLike) {
      applyScore(categories.URGENCY, {
        keywordMatches: matchData.urgencyMatches,
        timerLike: matchData.timerLike,
        nearPurchase,
        sticky: false,
        highZ: false,
        overlay: false,
        checkedAddon: false,
        chatBubble: false
      });
    }

    if (matchData.scarcityMatches > 0) {
      applyScore(categories.SCARCITY, {
        keywordMatches: matchData.scarcityMatches,
        timerLike: false,
        nearPurchase,
        sticky: false,
        highZ: false,
        overlay: false,
        checkedAddon: false,
        chatBubble: false
      });
    }

    if (matchData.socialMatches > 0) {
      applyScore(categories.SOCIAL_PROOF, {
        keywordMatches: matchData.socialMatches,
        timerLike: false,
        nearPurchase,
        sticky: false,
        highZ: false,
        overlay: false,
        checkedAddon: false,
        chatBubble: false
      });
    }

    if (matchData.nagMatches > 0 || overlay || highZ) {
      applyScore(categories.NAG_OVERLAY, {
        keywordMatches: matchData.nagMatches,
        timerLike: false,
        nearPurchase: false,
        sticky,
        highZ,
        overlay,
        checkedAddon: false,
        chatBubble: false
      });
    }

    if (matchData.fakeChatMatches > 0) {
      const chatBubble = sticky && rect.width < 460 && rect.height < 360;
      applyScore(categories.FAKE_CHAT, {
        keywordMatches: matchData.fakeChatMatches,
        timerLike: false,
        nearPurchase: false,
        sticky,
        highZ,
        overlay: false,
        checkedAddon: false,
        chatBubble
      });
    }

    let bestCategory = null;
    let bestScore = 0;

    Object.keys(categoryScores).forEach((category) => {
      const score = categoryScores[category];
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    });

    if (!bestCategory || bestScore < 35) return null;

    return {
      category: bestCategory,
      score: Math.min(bestScore, 100),
      confidence: confidenceFromScore(bestScore),
      reasons: categoryReasons[bestCategory] || []
    };
  }

  content.scoreElement = scoreElement;
  content.scoreSignals = scoreSignals;
})();
