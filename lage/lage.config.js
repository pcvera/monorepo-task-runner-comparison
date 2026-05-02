// @ts-check
/** @type {import("lage").ConfigFileOptions} */
const config = {
  npmClient: "pnpm",
  pipeline: {
    "@repo/stripped#build": {
      dependsOn: [],
      inputs: ["src/**/*.js", "scripts/**/*.cjs"],
      outputs: ["build/stripped-comments/**"],
    },
    "@repo/sample#build": {
      dependsOn: ["@repo/stripped#build"],
      inputs: [
        "src/**/*.json",
        "scripts/**/*.cjs",
        "../stripped/build/stripped-comments/**",
      ],
      outputs: ["dist/**"],
    },
  },
  cacheOptions: {
    outputGlob: ["build/stripped-comments/**", "dist/**"],
    environmentGlob: ["package.json", "pnpm-lock.yaml", "lage.config.js"],
  },
};
module.exports = config;
