import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["@mui/material", "@mui/icons-material"],
          query: ["@tanstack/react-query"],
          utils: ["dayjs", "clsx"],
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
