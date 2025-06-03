import { defineConfig } from "vite";
import type { UserConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ command, mode }) => {
  const config: UserConfig = {
    build: {
      rollupOptions: {
        input: {
          "template-loop-card": resolve(__dirname, "src/template-loop-card.ts"),
        },
        output: {
          entryFileNames: "template-loop-card.js",
        },
      },
    },
  };

  if (command == "build") {
    if (mode == "development") {
      return {
        build: {
          ...config.build,
          outDir: "./temp",
          watch: {},
          minify: false,
        },
      };
    }
  }

  return { ...config };
});
