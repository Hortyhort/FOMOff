import fs from "fs";
import path from "path";

const root = process.cwd();
const srcDir = path.join(root, "src");

const PATTERNS = [
  { label: "fetch()", regex: /\bfetch\s*\(/ },
  { label: "XMLHttpRequest", regex: /\bXMLHttpRequest\b/ },
  { label: "sendBeacon", regex: /\bsendBeacon\b/ },
  { label: "external URL", regex: /https?:\/\// }
];

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      return;
    }
    if (entry.isFile()) {
      files.push(fullPath);
    }
  });
  return files;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const hits = [];
  PATTERNS.forEach((pattern) => {
    lines.forEach((line, index) => {
      if (pattern.regex.test(line)) {
        hits.push({
          label: pattern.label,
          line: index + 1,
          text: line.trim()
        });
      }
    });
  });
  return hits;
}

function main() {
  if (!fs.existsSync(srcDir)) {
    console.error("no-network-check: src/ directory not found.");
    process.exit(1);
  }

  const files = walk(srcDir);
  const allHits = [];

  files.forEach((filePath) => {
    const hits = scanFile(filePath);
    if (hits.length) {
      allHits.push({ filePath, hits });
    }
  });

  if (!allHits.length) {
    console.log("no-network-check: OK");
    return;
  }

  console.error("no-network-check: potential network usage detected");
  allHits.forEach(({ filePath, hits }) => {
    console.error(`- ${path.relative(root, filePath)}`);
    hits.forEach((hit) => {
      console.error(`  L${hit.line}: [${hit.label}] ${hit.text}`);
    });
  });
  process.exit(1);
}

main();
