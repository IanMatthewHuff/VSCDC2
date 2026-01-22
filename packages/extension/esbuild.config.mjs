import * as esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes("--watch");
const isWeb = process.argv.includes("--web");
const isAll = process.argv.includes("--all");

/** @type {esbuild.BuildOptions} */
const sharedOptions = {
  bundle: true,
  external: ["vscode"],
  sourcemap: true,
  minify: false,
  // Resolve workspace packages
  alias: {
    "@vscdc/engine": path.resolve(__dirname, "../engine/src/index.ts"),
    "@vscdc/game": path.resolve(__dirname, "../game/src/index.ts"),
  },
};

/** @type {esbuild.BuildOptions} */
const nodeExtensionBuildOptions = {
  ...sharedOptions,
  entryPoints: ["src/extension.ts"],
  outfile: "dist/extension.js",
  format: "cjs",
  platform: "node",
  target: "node18",
};

/** @type {esbuild.BuildOptions} */
const webExtensionBuildOptions = {
  ...sharedOptions,
  entryPoints: ["src/extension.ts"],
  outfile: "dist/web/extension.js",
  format: "cjs",
  platform: "browser",
  target: "es2020",
  // Web extensions need these defines for browser compatibility
  define: {
    "process.env.NODE_ENV": '"production"',
  },
};

// Find test files
const testFiles = await glob("src/test/**/*.test.ts");

/** @type {esbuild.BuildOptions} */
const testBuildOptions = {
  ...sharedOptions,
  entryPoints: testFiles,
  outdir: "dist/test",
  format: "cjs",
  platform: "node",
  target: "node18",
};

/**
 * Build the extension for the specified target(s)
 */
async function build() {
  if (isWatch) {
    // Watch mode - build both Node and Web
    const nodeCtx = await esbuild.context(nodeExtensionBuildOptions);
    const webCtx = await esbuild.context(webExtensionBuildOptions);
    const testCtx = await esbuild.context(testBuildOptions);
    await nodeCtx.watch();
    await webCtx.watch();
    await testCtx.watch();
    console.log("Watching for changes...");
  } else if (isWeb) {
    // Web only
    await esbuild.build(webExtensionBuildOptions);
    console.log("Web build complete");
  } else if (isAll) {
    // Build both Node and Web
    await esbuild.build(nodeExtensionBuildOptions);
    await esbuild.build(webExtensionBuildOptions);
    if (testFiles.length > 0) {
      await esbuild.build(testBuildOptions);
    }
    console.log("All builds complete (Node + Web)");
  } else {
    // Default: Node only (backwards compatible)
    await esbuild.build(nodeExtensionBuildOptions);
    if (testFiles.length > 0) {
      await esbuild.build(testBuildOptions);
    }
    console.log("Build complete");
  }
}

build();
