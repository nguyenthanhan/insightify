import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    open: true,
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              if (/(^|\/)react($|\/)/.test(id) || /(^|\/)react-dom($|\/)/.test(id)) {
                return "vendor-react";
              }
              if (/(^|\/)framer-motion($|\/)/.test(id)) {
                return "vendor-framer";
              }
              if (/(^|\/)zustand($|\/)/.test(id)) {
                return "vendor-zustand";
              }
              return "vendor";
            }
            if (id.includes("/src/components/chat/")) {
              return "chat";
            }
            if (id.includes("/src/components/dashboard/")) {
              return "dashboard";
            }
          },
        },
      },
    },
    // Enable source maps for debugging
    sourcemap: false,
    // Chunk size warning limit
    chunkSizeWarningLimit: 800,
  },
});
