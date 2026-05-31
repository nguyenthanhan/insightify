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
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "vendor-react": ["react", "react-dom"],
          "vendor-framer": ["framer-motion"],
          "vendor-zustand": ["zustand"],
          // Recharts will be automatically code-split via lazy loading
          // Feature chunks
          chat: [
            "./src/components/chat/ChatDialog.tsx",
            "./src/components/chat/ChatButton.tsx",
            "./src/components/chat/ChatInput.tsx",
            "./src/components/chat/MessageList.tsx",
            "./src/components/chat/MessageItem.tsx",
          ],
          dashboard: [
            "./src/components/dashboard/DashboardTemplate.tsx",
            "./src/components/dashboard/MetricsGrid.tsx",
            "./src/components/dashboard/ActivityFeed.tsx",
          ],
        },
      },
    },
    // Enable source maps for debugging
    sourcemap: false,
    // Chunk size warning limit
    chunkSizeWarningLimit: 800,
  },
});
