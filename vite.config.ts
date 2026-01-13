import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, "src/ui/sidepanel/index.html"),
        options: resolve(__dirname, "src/ui/options/index.html")
      }
    }
  }
});
