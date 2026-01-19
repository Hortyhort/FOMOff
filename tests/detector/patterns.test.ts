import { describe, it, expect } from "vitest";

// Pattern definitions (mirroring src/content/detector/patterns.ts)
const patterns = {
  urgency: [
    /\bends? in\b/i,
    /\bdeal ends\b/i,
    /\bflash sale\b/i,
    /\blimited time\b/i,
    /\btime left\b/i,
    /\bending soon\b/i
  ],
  scarcity: [
    /\bonly \d+ left\b/i,
    /\b\d+ left in stock\b/i,
    /\blow stock\b/i,
    /\blimited stock\b/i,
    /\bselling fast\b/i,
    /\blimited quantity\b/i
  ],
  socialProof: [
    /\b\d+ people (are )?(viewing|watching)\b/i,
    /\b\d+ bought in the last\b/i,
    /\bjust bought\b/i,
    /\btrending now\b/i,
    /\bpopular choice\b/i
  ],
  nagOverlay: [
    /\bwait!\b/i,
    /\bbefore you go\b/i,
    /\bdon't leave\b/i,
    /\bspin the wheel\b/i,
    /\bexclusive offer\b/i,
    /\bunlock .*%\b/i
  ],
  fakeChat: [
    /\blive chat\b/i,
    /\bfrom support\b/i,
    /\bneed help\?\b/i,
    /\bchat with\b/i,
    /\bi'?m here to help\b/i
  ]
};

const timerPattern = /\b\d{1,2}:\d{2}(:\d{2})?\b/;

function matchesAny(text: string, patternList: RegExp[]): boolean {
  return patternList.some((p) => p.test(text));
}

describe("Urgency Patterns", () => {
  it("matches 'ends in 2 hours'", () => {
    expect(matchesAny("Sale ends in 2 hours!", patterns.urgency)).toBe(true);
  });

  it("matches 'deal ends tonight'", () => {
    expect(matchesAny("This deal ends tonight", patterns.urgency)).toBe(true);
  });

  it("matches 'flash sale'", () => {
    expect(matchesAny("Flash Sale - 50% off!", patterns.urgency)).toBe(true);
  });

  it("matches 'limited time offer'", () => {
    expect(matchesAny("Limited time offer", patterns.urgency)).toBe(true);
  });

  it("matches 'ending soon'", () => {
    expect(matchesAny("Offer ending soon", patterns.urgency)).toBe(true);
  });

  it("does NOT match 'friendship ends'", () => {
    expect(matchesAny("Our friendship ends here", patterns.urgency)).toBe(false);
  });

  it("does NOT match generic product text", () => {
    expect(matchesAny("Premium leather wallet", patterns.urgency)).toBe(false);
  });
});

describe("Scarcity Patterns", () => {
  it("matches 'only 3 left'", () => {
    expect(matchesAny("Only 3 left in stock!", patterns.scarcity)).toBe(true);
  });

  it("matches '5 left in stock'", () => {
    expect(matchesAny("5 left in stock", patterns.scarcity)).toBe(true);
  });

  it("matches 'low stock'", () => {
    expect(matchesAny("Low stock - order soon", patterns.scarcity)).toBe(true);
  });

  it("matches 'selling fast'", () => {
    expect(matchesAny("Selling fast!", patterns.scarcity)).toBe(true);
  });

  it("does NOT match 'left side of page'", () => {
    expect(matchesAny("See the left side of the page", patterns.scarcity)).toBe(false);
  });

  it("does NOT match 'In Stock'", () => {
    expect(matchesAny("In Stock", patterns.scarcity)).toBe(false);
  });
});

describe("Social Proof Patterns", () => {
  it("matches '47 people viewing'", () => {
    expect(matchesAny("47 people viewing this item", patterns.socialProof)).toBe(true);
  });

  it("matches '12 people are watching'", () => {
    expect(matchesAny("12 people are watching", patterns.socialProof)).toBe(true);
  });

  it("matches 'just bought'", () => {
    expect(matchesAny("Someone in California just bought this", patterns.socialProof)).toBe(true);
  });

  it("matches 'trending now'", () => {
    expect(matchesAny("Trending now", patterns.socialProof)).toBe(true);
  });

  it("does NOT match 'people love quality'", () => {
    expect(matchesAny("People love quality products", patterns.socialProof)).toBe(false);
  });
});

describe("Nag Overlay Patterns", () => {
  it("matches 'Wait!'", () => {
    expect(matchesAny("Wait! Don't miss this deal", patterns.nagOverlay)).toBe(true);
  });

  it("matches 'before you go'", () => {
    expect(matchesAny("Before you go...", patterns.nagOverlay)).toBe(true);
  });

  it("matches 'spin the wheel'", () => {
    expect(matchesAny("Spin the wheel for a discount!", patterns.nagOverlay)).toBe(true);
  });

  it("matches 'unlock 20% off'", () => {
    expect(matchesAny("Unlock 20% off your order", patterns.nagOverlay)).toBe(true);
  });

  it("does NOT match 'wait for delivery'", () => {
    expect(matchesAny("Please wait for delivery confirmation", patterns.nagOverlay)).toBe(false);
  });
});

describe("Fake Chat Patterns", () => {
  it("matches 'live chat'", () => {
    expect(matchesAny("Start a live chat", patterns.fakeChat)).toBe(true);
  });

  it("matches 'need help?'", () => {
    expect(matchesAny("Need help?", patterns.fakeChat)).toBe(true);
  });

  it("matches 'I'm here to help'", () => {
    expect(matchesAny("Hi! I'm here to help", patterns.fakeChat)).toBe(true);
  });

  it("does NOT match 'help center'", () => {
    expect(matchesAny("Visit our help center", patterns.fakeChat)).toBe(false);
  });
});

describe("Timer Pattern", () => {
  it("matches '02:30'", () => {
    expect(timerPattern.test("Only 02:30 remaining")).toBe(true);
  });

  it("matches '1:45:30'", () => {
    expect(timerPattern.test("Time left: 1:45:30")).toBe(true);
  });

  it("matches '23:59'", () => {
    expect(timerPattern.test("Ends at 23:59")).toBe(true);
  });

  it("does NOT match just numbers", () => {
    expect(timerPattern.test("123456")).toBe(false);
  });

  it("does NOT match price", () => {
    expect(timerPattern.test("$19.99")).toBe(false);
  });
});
