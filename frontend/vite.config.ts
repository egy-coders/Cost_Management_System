import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const rawApiBaseUrl = (env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
  const proxyTarget = rawApiBaseUrl.endsWith("/api") ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true
        },
        "/media": {
          target: proxyTarget,
          changeOrigin: true
        }
      }
    }
  };
});
