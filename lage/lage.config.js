// @ts-check
/** @type {import("lage").ConfigFileOptions} */
const config = {
  npmClient: "pnpm",
  pipeline: {
    "strip-comments": {
      dependsOn: [],
      inputs: ["src/**/*.js"],
      outputs: ["build/stripped-comments/**"],
    },
    build: {
      dependsOn: ["strip-comments"],
      inputs: ["build/stripped-comments/**", "src/build-only.json"],
      outputs: ["dist/**"],
    },
  },
  cacheOptions: {
    outputGlob: ["build/stripped-comments/**", "dist/**"],
    environmentGlob: ["package.json", "pnpm-lock.yaml", "lage.config.js"],
  },
};
module.exports = config;
