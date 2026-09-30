import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: "gh-pages-src",
  base: "/warikan-note/",
  publicDir: "public",
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(process.cwd()) } },
  css: { postcss: path.resolve(process.cwd(), "postcss.config.mjs") },
  build: { outDir: "../pages-dist", emptyOutDir: true },
});
