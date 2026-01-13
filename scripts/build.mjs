import fs from "fs";
import path from "path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const distDir = path.join(root, "dist");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(dest, content) {
  ensureDir(path.dirname(dest));
  fs.writeFileSync(dest, content);
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyTree(current) {
  const entries = fs.readdirSync(current, { withFileTypes: true });
  entries.forEach((entry) => {
    const srcPath = path.join(current, entry.name);
    const relPath = path.relative(srcDir, srcPath);
    if (entry.isDirectory()) {
      copyTree(srcPath);
      return;
    }
    if (entry.isFile()) {
      if (entry.name.endsWith(".ts")) {
        const destPath = path.join(distDir, relPath.replace(/\.ts$/, ".js"));
        const content = fs.readFileSync(srcPath, "utf8");
        writeFile(destPath, content);
        return;
      }
      const destPath = path.join(distDir, relPath);
      copyFile(srcPath, destPath);
    }
  });
}

ensureDir(distDir);
copyTree(srcDir);
copyFile(path.join(root, "manifest.json"), path.join(distDir, "manifest.json"));
copyFile(path.join(root, "PRIVACY.md"), path.join(distDir, "PRIVACY.md"));

const assetsDir = path.join(root, "assets");
if (fs.existsSync(assetsDir)) {
  const assetEntries = fs.readdirSync(assetsDir, { withFileTypes: true });
  assetEntries.forEach((entry) => {
    if (!entry.isFile()) return;
    copyFile(path.join(assetsDir, entry.name), path.join(distDir, "assets", entry.name));
  });
}

console.log("FOMOff build complete.");
