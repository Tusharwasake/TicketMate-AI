import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
    assetsDir: "assets",
    sourcemap: false,
    minify: "esbuild",
  },
  server: {
    mimeTypes: {
      "application/javascript": ["js", "mjs"],
    },
  },
  preview: {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
    },
  },
  define: {
    global: "globalThis",
  },
});
