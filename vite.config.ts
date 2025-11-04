import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "./", // 👈 muy importante para producción (rutas relativas)
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@resoluciones": path.resolve(__dirname, "./src/apps/promociones/src"),
    },
  },
});
