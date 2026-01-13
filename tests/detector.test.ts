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
