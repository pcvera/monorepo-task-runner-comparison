import { defineConfig } from "vite-plus";

/**
 * Mirrors turborepo/packages/sample/turbo.json: strip-comments then build,
 * with explicit inputs aligned to that demo (see monorepo-comparison docs).
 */
export default defineConfig({
  run: {
    tasks: {
      "strip-comments": {
        command: "node scripts/strip-comments.cjs",
        input: ["src/**/*.js"],
      },
      build: {
        command: "node scripts/dummy-build.cjs",
        dependsOn: ["strip-comments"],
        input: ["build/stripped-comments/**", "src/build-only.json"],
      },
    },
  },
});
