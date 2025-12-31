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
    port: 3000,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "vendor-react": ["react", "react-dom"],
          "vendor-recharts": ["recharts"],
          "vendor-framer": ["framer-motion"],
          "vendor-zustand": ["zustand"],
          // Feature chunks
          charts: [
            "./src/components/charts/AreaChartWidget.tsx",
            "./src/components/charts/BarChartWidget.tsx",
            "./src/components/charts/LineChartWidget.tsx",
            "./src/components/charts/PieChartWidget.tsx",
            "./src/components/charts/RadarChartWidget.tsx",
            "./src/components/charts/ChartWidget.tsx",
          ],
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
    chunkSizeWarningLimit: 500,
  },
});
