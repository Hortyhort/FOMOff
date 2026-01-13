import fs from "fs";
import path from "path";
import vm from "vm";

const root = process.cwd();
const context = {
  console,
  setTimeout,
  clearTimeout
};
context.globalThis = context;

const results = { passed: 0, failed: 0 };

context.assert = (condition, message) => {
  if (!condition) throw new Error(message || "Assertion failed");
};

context.test = (name, fn) => {
  try {
    fn();
    results.passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    results.failed += 1;
    console.error(`FAIL ${name}`);
    console.error(error.message);
  }
};

function runFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  vm.runInNewContext(content, context, { filename: filePath });
}

// Load source modules needed for tests.
[
  "src/shared/types.ts",
  "src/shared/hash.ts",
  "src/content/detector/patterns.ts",
  "src/content/detector/score.ts",
  "src/background/storage.ts"
].forEach((file) => runFile(path.join(root, file)));

// Run tests.
[
  "tests/detector.test.ts",
  "tests/score.test.ts",
  "tests/storage.test.ts"
].forEach((file) => runFile(path.join(root, file)));

if (results.failed) {
  process.exitCode = 1;
}
