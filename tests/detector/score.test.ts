import { describe, it, expect } from "vitest";

// Signal weights (mirroring src/content/detector/score.ts)
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

interface Signals {
  keywordMatches?: number;
  timerLike?: boolean;
  nearPurchase?: boolean;
  sticky?: boolean;
  highZ?: boolean;
  overlay?: boolean;
  checkedAddon?: boolean;
  chatBubble?: boolean;
}

function scoreSignals(signals: Signals): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (signals.keywordMatches && signals.keywordMatches > 0) {
    score += Math.min(
      WEIGHTS.keywordBase + signals.keywordMatches * WEIGHTS.keywordBonus,
      WEIGHTS.keywordMax
    );
    reasons.push("keyword match");
  }
  if (signals.timerLike) {
    score += WEIGHTS.timer;
    reasons.push("timer-like text");
  }
  if (signals.nearPurchase) {
    score += WEIGHTS.nearPurchase;
    reasons.push("near purchase action");
  }
  if (signals.sticky) {
    score += WEIGHTS.sticky;
    reasons.push("sticky/fixed positioning");
  }
  if (signals.highZ) {
    score += WEIGHTS.highZ;
    reasons.push("high z-index");
  }
  if (signals.overlay) {
    score += WEIGHTS.overlay;
    reasons.push("overlay sizing");
  }
  if (signals.checkedAddon) {
    score += WEIGHTS.checkedAddon;
    reasons.push("pre-selected add-on");
  }
  if (signals.chatBubble) {
    score += WEIGHTS.chatBubble;
    reasons.push("chat-like widget");
  }

  return { score, reasons };
}

function confidenceFromScore(score: number): string {
  if (score >= 70) return "High";
  if (score >= 50) return "Med";
  return "Low";
}

describe("Score Calculation", () => {
  describe("Keyword Scoring", () => {
    it("gives base score for 1 keyword match", () => {
      const result = scoreSignals({ keywordMatches: 1 });
      expect(result.score).toBe(43); // 35 + 8
      expect(result.reasons).toContain("keyword match");
    });

    it("gives higher score for multiple matches", () => {
      const result = scoreSignals({ keywordMatches: 2 });
      expect(result.score).toBe(51); // 35 + 16
    });

    it("caps keyword score at max", () => {
      const result = scoreSignals({ keywordMatches: 10 });
      expect(result.score).toBe(WEIGHTS.keywordMax); // Capped at 55
    });

    it("gives no score for 0 matches", () => {
      const result = scoreSignals({ keywordMatches: 0 });
      expect(result.score).toBe(0);
    });
  });

  describe("Signal Combinations", () => {
    it("adds timer bonus to urgency", () => {
      const result = scoreSignals({ keywordMatches: 1, timerLike: true });
      expect(result.score).toBe(43 + 28); // keyword + timer
      expect(result.reasons).toContain("timer-like text");
    });

    it("adds near purchase bonus", () => {
      const result = scoreSignals({ keywordMatches: 1, nearPurchase: true });
      expect(result.score).toBe(43 + 12);
      expect(result.reasons).toContain("near purchase action");
    });

    it("combines multiple visual signals for overlays", () => {
      const result = scoreSignals({
        keywordMatches: 1,
        sticky: true,
        highZ: true,
        overlay: true
      });
      expect(result.score).toBe(43 + 18 + 8 + 12);
      expect(result.reasons).toContain("sticky/fixed positioning");
      expect(result.reasons).toContain("high z-index");
      expect(result.reasons).toContain("overlay sizing");
    });

    it("gives high score for fake chat signals", () => {
      const result = scoreSignals({
        keywordMatches: 1,
        sticky: true,
        chatBubble: true
      });
      expect(result.score).toBe(43 + 18 + 20);
      expect(result.reasons).toContain("chat-like widget");
    });
  });

  describe("Threshold", () => {
    it("threshold is 35", () => {
      expect(THRESHOLD).toBe(35);
    });

    it("single keyword match (43) exceeds threshold", () => {
      const result = scoreSignals({ keywordMatches: 1 });
      expect(result.score).toBeGreaterThan(THRESHOLD);
    });

    it("timer alone (28) does NOT exceed threshold", () => {
      const result = scoreSignals({ timerLike: true });
      expect(result.score).toBeLessThan(THRESHOLD);
    });
  });

  describe("Confidence Levels", () => {
    it("returns High for score >= 70", () => {
      expect(confidenceFromScore(70)).toBe("High");
      expect(confidenceFromScore(100)).toBe("High");
    });

    it("returns Med for score >= 50 and < 70", () => {
      expect(confidenceFromScore(50)).toBe("Med");
      expect(confidenceFromScore(69)).toBe("Med");
    });

    it("returns Low for score < 50", () => {
      expect(confidenceFromScore(49)).toBe("Low");
      expect(confidenceFromScore(35)).toBe("Low");
    });
  });
});

describe("Edge Cases", () => {
  it("handles empty signals object", () => {
    const result = scoreSignals({});
    expect(result.score).toBe(0);
    expect(result.reasons).toHaveLength(0);
  });

  it("handles all signals true", () => {
    const result = scoreSignals({
      keywordMatches: 3,
      timerLike: true,
      nearPurchase: true,
      sticky: true,
      highZ: true,
      overlay: true,
      checkedAddon: true,
      chatBubble: true
    });
    // Should include all bonuses
    expect(result.reasons.length).toBeGreaterThan(5);
    expect(result.score).toBeGreaterThan(100);
  });
});
