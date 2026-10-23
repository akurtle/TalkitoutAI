import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Relative base so the build works from any static host path (Vercel, Cloudflare Pages, GitHub Pages).
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  server: { port: 5180 },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-dom/client"],
          flow: ["@xyflow/react"],
          motion: ["motion/react"],
        },
      },
    },
  },
});
