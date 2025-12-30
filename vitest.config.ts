import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["packages/engine/**/*.test.ts", "packages/game/**/*.test.ts"],
    exclude: ["packages/extension/**"],
    globals: false,
  },
  resolve: {
    alias: {
      "@vscdc/engine": path.resolve(__dirname, "packages/engine/src/index.ts"),
      "@vscdc/game": path.resolve(__dirname, "packages/game/src/index.ts"),
    },
  },
});
