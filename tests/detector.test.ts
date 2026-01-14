test("detects urgency text", () => {
  const patterns = globalThis.FOMOff.content.patterns;
  const sample = "Deal ends in 00:12:03";
  const hit = patterns.urgency.some((pattern) => pattern.test(sample));
  assert(hit, "expected urgency pattern to match");
});

test("detects scarcity text", () => {
  const patterns = globalThis.FOMOff.content.patterns;
  const sample = "Only 3 left in stock";
  const hit = patterns.scarcity.some((pattern) => pattern.test(sample));
  assert(hit, "expected scarcity pattern to match");
});

test("detects social proof text", () => {
  const patterns = globalThis.FOMOff.content.patterns;
  const sample = "23 people are viewing";
  const hit = patterns.socialProof.some((pattern) => pattern.test(sample));
  assert(hit, "expected social proof pattern to match");
});

test("detects nag overlay text", () => {
  const patterns = globalThis.FOMOff.content.patterns;
  const sample = "Wait! Before you go, unlock 10%";
  const hit = patterns.nagOverlay.some((pattern) => pattern.test(sample));
  assert(hit, "expected nag overlay pattern to match");
});

test("detects fake chat text", () => {
  const patterns = globalThis.FOMOff.content.patterns;
  const sample = "Jessica from support is here to help";
  const hit = patterns.fakeChat.some((pattern) => pattern.test(sample));
  assert(hit, "expected fake chat pattern to match");
});

test("detects forced add-on text", () => {
  const patterns = globalThis.FOMOff.content.patterns;
  const sample = "Add shipping insurance to protect your order";
  const hit = patterns.forcedAddon.some((pattern) => pattern.test(sample));
  assert(hit, "expected forced add-on pattern to match");
});
