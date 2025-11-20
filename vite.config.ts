import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "./", // 👈 muy importante para producción (rutas relativas)
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor chunks
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["@mui/material", "@mui/icons-material"],
          query: ["@tanstack/react-query"],
          utils: ["dayjs", "clsx"],
        },
      },
    },
    // Habilitar source maps para debugging en producción
    sourcemap: true,
    // Optimizaciones adicionales
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Remover console.logs en producción
        drop_debugger: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@resoluciones": path.resolve(__dirname, "./src/apps/promociones/src"),
    },
  },
});
