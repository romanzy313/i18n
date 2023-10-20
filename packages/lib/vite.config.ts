import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "simply-i18n",
      // fileName: (format) => `simply-i18n.${format}.js`,
      fileName: (format) => `index.${format}.js`,
    },
    sourcemap: true,
  },

  // test: {
  //   coverage: {
  //     enabled: true,
  //     reporter: ["text", "json", "html"],
  //     provider: "v8", // or 'v8'
  //   },
  // },
} as any);
