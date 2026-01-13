test("scoreSignals weights urgency cues", () => {
  const result = globalThis.FOMOff.content.scoreSignals({
    keywordMatches: 1,
    timerLike: true,
    nearPurchase: true,
    sticky: false,
    highZ: false,
    overlay: false,
    checkedAddon: false,
    chatBubble: false
  });
  assert(result.score >= 60, "expected urgency score to be strong");
});

test("scoreSignals boosts add-ons", () => {
  const result = globalThis.FOMOff.content.scoreSignals({
    keywordMatches: 1,
    timerLike: false,
    nearPurchase: false,
    sticky: false,
    highZ: false,
    overlay: false,
    checkedAddon: true,
    chatBubble: false
  });
  assert(result.score >= 60, "expected add-on score to be strong");
});
