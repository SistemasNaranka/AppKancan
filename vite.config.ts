import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "./",
  cacheDir: "node_modules/.vite",
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
      "@mui/material",
      "@mui/icons-material",
      "@mui/system",
      "@mui/x-data-grid",
      "@mui/x-date-pickers",
      "@tanstack/react-query",
      "dayjs",
      "date-fns",
      "clsx",
      "chart.js",
      "react-chartjs-2",
      "lucide-react",
      "file-saver",
      "exceljs",
      "xlsx",
      "jspdf",
      "jspdf-autotable",
      "papaparse",
      "pdfjs-dist",
      "yup",
      "react-hook-form",
      "@hookform/resolvers",
    ],
    exclude: ["ollama"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@directus/sdk")) return "directus";
            if (
              id.includes("@mui") ||
              id.includes("@emotion") ||
              id.includes("@tanstack") ||
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router-dom")
            ) {
              return "vendor";
            }
          }
        },
      },
    },
    sourcemap: false,
    minify: "esbuild",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@resoluciones": path.resolve(__dirname, "./src/apps/resoluciones"),
    },
  },
});
