import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: "node scripts/dummy-build.cjs",
        dependsOn: ["@repo/stripped#build"],
        input: [
          "src/**/*.json",
          "scripts/**/*.cjs",
          "../stripped/build/stripped-comments/**",
        ],
      },
    },
  },
});
