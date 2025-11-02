var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
// Resolve __dirname equivalent for ESM
var __dirname = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
    plugins: __spreadArray([
        react(),
        runtimeErrorOverlay(),
        themePlugin()
    ], (process.env.NODE_ENV !== "production" &&
        process.env.REPL_ID !== undefined
        ? [
            await import("@replit/vite-plugin-cartographer").then(function (m) {
                return m.cartographer();
            }),
        ]
        : []), true),
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "client", "src"),
            "@shared": path.resolve(__dirname, "shared"),
            "@assets": path.resolve(__dirname, "attached_assets"),
        },
    },
    root: path.resolve(__dirname, "client"),
    build: {
        outDir: path.resolve(__dirname, "dist/public"),
        emptyOutDir: true,
    },
});
