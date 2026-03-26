import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    host: true,
    hmr: {
      overlay: false,
    },
    watch: {
      usePolling: true,
    },
    proxy: {
      "/api": {
        target: "http://localhost:11000",
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@emotion/react",
      "@emotion/styled",
      "ollama",
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@directus/sdk")) return "directus";
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router-dom") ||
              id.includes("@mui") ||
              id.includes("@emotion") ||
              id.includes("@tanstack") ||
              id.includes("dayjs") ||
              id.includes("clsx") ||
              id.includes("pdfjs-dist") ||
              id.includes("file-saver")
            ) {
              return "vendor";
            }
          }
        },
      },
    },
    sourcemap: true,
    minify: "esbuild",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@resoluciones": path.resolve(__dirname, "./src/apps/promociones/src"),
    },
  },
});
