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

test("does not flag limited edition as scarcity", () => {
  const patterns = globalThis.FOMOff.content.patterns;
  const sample = "Limited edition print";
  const hit = patterns.scarcity.some((pattern) => pattern.test(sample));
  assert(!hit, "expected scarcity pattern to ignore limited edition");
});

test("does not flag popular opinion as social proof", () => {
  const patterns = globalThis.FOMOff.content.patterns;
  const sample = "Popular opinion: teal is calming";
  const hit = patterns.socialProof.some((pattern) => pattern.test(sample));
  assert(!hit, "expected social proof patterns to ignore popular opinion");
});

test("does not flag sale ends when it ends as urgency", () => {
  const patterns = globalThis.FOMOff.content.patterns;
  const sample = "Sale ends when it ends";
  const hit = patterns.urgency.some((pattern) => pattern.test(sample));
  assert(!hit, "expected urgency patterns to ignore generic phrasing");
});

test("does not flag need help button without question mark", () => {
  const patterns = globalThis.FOMOff.content.patterns;
  const sample = "Need help button";
  const hit = patterns.fakeChat.some((pattern) => pattern.test(sample));
  assert(!hit, "expected fake chat patterns to require direct prompt");
});
