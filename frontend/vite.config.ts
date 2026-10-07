import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 28031,
    proxy: {
      "/api": {
        target: "http://localhost:29069",
        changeOrigin: true
      },
      "/uploads": {
        target: "http://localhost:29069",
        changeOrigin: true
      }
    }
  }
});

