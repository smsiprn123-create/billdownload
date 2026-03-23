import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/accountdetailsByKno": {
        target: "https://jdvvnl.bijlimitra.com",
        changeOrigin: true,
        rewrite: (path) => path.replace("/api/accountdetailsByKno", "/jdvvnlmitra/accountdetailsByKno")
      }
    }
  }
});
