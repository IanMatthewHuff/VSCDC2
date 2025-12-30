import * as esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes("--watch");

/** @type {esbuild.BuildOptions} */
const sharedOptions = {
  bundle: true,
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node18",
  sourcemap: true,
  minify: false,
  // Resolve workspace packages
  alias: {
    "@vscdc/engine": path.resolve(__dirname, "../engine/src/index.ts"),
    "@vscdc/game": path.resolve(__dirname, "../game/src/index.ts"),
  },
};

/** @type {esbuild.BuildOptions} */
const extensionBuildOptions = {
  ...sharedOptions,
  entryPoints: ["src/extension.ts"],
  outfile: "dist/extension.js",
};

// Find test files
const testFiles = await glob("src/test/**/*.test.ts");

/** @type {esbuild.BuildOptions} */
const testBuildOptions = {
  ...sharedOptions,
  entryPoints: testFiles,
  outdir: "dist/test",
};

if (isWatch) {
  const extCtx = await esbuild.context(extensionBuildOptions);
  const testCtx = await esbuild.context(testBuildOptions);
  await extCtx.watch();
  await testCtx.watch();
  console.log("Watching for changes...");
} else {
  await esbuild.build(extensionBuildOptions);
  if (testFiles.length > 0) {
    await esbuild.build(testBuildOptions);
  }
  console.log("Build complete");
}
