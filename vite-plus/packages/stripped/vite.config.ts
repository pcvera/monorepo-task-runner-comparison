import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: "node scripts/strip-comments.cjs",
        input: ["src/**/*.js", "scripts/**/*.cjs"],
      },
    },
  },
});
