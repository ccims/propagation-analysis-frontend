// Plugins
import vue from "@vitejs/plugin-vue";
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

// Utilities
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue({
            template: {
                transformAssetUrls,
                compilerOptions: {
                    isCustomElement: (tag) => ["task-lists", "relative-time"].includes(tag)
                }
            }
        }),
        // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
        vuetify({
            autoImport: true,
            styles: {
                configFile: "src/styles/settings.scss"
            }
        })
    ],
    define: { "process.env": {} },
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url))
        },
        extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"]
    },
    server: {
        port: 4200,
        proxy: {
            "/api/graphql": {
                target: "https://frontend.gropius.duckdns.org/api/graphql",
                changeOrigin: true,
                secure: false,
                ws: true,
                ignorePath: true
            },
            "/api/login": {
                target: "https://frontend.gropius.duckdns.org/api/login",
                changeOrigin: true,
                secure: false,
                ws: true,
                rewrite: (path) => path.replace(/^\/api\/login/, "")
            }
        }
    },
    optimizeDeps: {
        exclude: ["vuetify", "@github/task-lists-element"],
    }
});
