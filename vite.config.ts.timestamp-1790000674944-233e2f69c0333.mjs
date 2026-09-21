// vite.config.ts
import { defineConfig } from "file:///D:/DZVNbeats_website/node_modules/vite/dist/node/index.js";
import react from "file:///D:/DZVNbeats_website/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///D:/DZVNbeats_website/node_modules/vite-plugin-pwa/dist/index.js";
import { execSync } from "child_process";
import path from "path";
var __vite_injected_original_dirname = "D:\\DZVNbeats_website";
var watchBeatsPlugin = () => ({
  name: "watch-beats-plugin",
  configureServer(server) {
    const beatsDir = path.resolve(__vite_injected_original_dirname, "public/beats");
    server.watcher.add(beatsDir);
    server.watcher.on("add", (filePath) => {
      if (filePath.includes("beats") && !filePath.includes("covers")) {
        console.log("\u{1F3B5} [Vite Watcher] New beat uploaded to /public/beats/. Regenerating manifest & cover art...");
        try {
          execSync("node generate-manifest.js");
        } catch (err) {
          console.error("Error running generate-manifest:", err);
        }
      }
    });
  }
});
var vite_config_default = defineConfig({
  plugins: [
    react(),
    watchBeatsPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "DZVNbeats | Studio Beat Portfolio",
        short_name: "DZVNbeats",
        description: "Serverless Studio Beat Portfolio & Direct Licensing Platform",
        theme_color: "#09090b",
        background_color: "#09090b",
        display: "standalone",
        orientation: "portrait-primary",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        // EXPLICIT REQUIREMENT: Ignore /public/beats/ to prevent heavy audio caching & mobile quota crashes
        globIgnores: ["**/beats/**", "beats/**"],
        navigateFallbackDenylist: [/^\/beats/]
      }
    })
  ],
  base: process.env.NODE_ENV === "production" ? "/DZVNbeats/" : "/",
  server: {
    port: 3e3,
    open: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxEWlZOYmVhdHNfd2Vic2l0ZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcRFpWTmJlYXRzX3dlYnNpdGVcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L0RaVk5iZWF0c193ZWJzaXRlL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSc7XG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbi8vIEN1c3RvbSBWaXRlIHBsdWdpbiB0byB3YXRjaCBwdWJsaWMvYmVhdHMvIGZvbGRlciBhbmQgYXV0by1nZW5lcmF0ZSBtYW5pZmVzdCBvbiBmaWxlIGRyb3BcbmNvbnN0IHdhdGNoQmVhdHNQbHVnaW4gPSAoKSA9PiAoe1xuICBuYW1lOiAnd2F0Y2gtYmVhdHMtcGx1Z2luJyxcbiAgY29uZmlndXJlU2VydmVyKHNlcnZlcjogYW55KSB7XG4gICAgY29uc3QgYmVhdHNEaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAncHVibGljL2JlYXRzJyk7XG4gICAgc2VydmVyLndhdGNoZXIuYWRkKGJlYXRzRGlyKTtcbiAgICBzZXJ2ZXIud2F0Y2hlci5vbignYWRkJywgKGZpbGVQYXRoOiBzdHJpbmcpID0+IHtcbiAgICAgIGlmIChmaWxlUGF0aC5pbmNsdWRlcygnYmVhdHMnKSAmJiAhZmlsZVBhdGguaW5jbHVkZXMoJ2NvdmVycycpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdcdUQ4M0NcdURGQjUgW1ZpdGUgV2F0Y2hlcl0gTmV3IGJlYXQgdXBsb2FkZWQgdG8gL3B1YmxpYy9iZWF0cy8uIFJlZ2VuZXJhdGluZyBtYW5pZmVzdCAmIGNvdmVyIGFydC4uLicpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGV4ZWNTeW5jKCdub2RlIGdlbmVyYXRlLW1hbmlmZXN0LmpzJyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHJ1bm5pbmcgZ2VuZXJhdGUtbWFuaWZlc3Q6JywgZXJyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG59KTtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIHdhdGNoQmVhdHNQbHVnaW4oKSxcbiAgICBWaXRlUFdBKHtcbiAgICAgIHJlZ2lzdGVyVHlwZTogJ2F1dG9VcGRhdGUnLFxuICAgICAgaW5jbHVkZUFzc2V0czogWydmYXZpY29uLmljbycsICdhcHBsZS10b3VjaC1pY29uLnBuZycsICdtYXNrZWQtaWNvbi5zdmcnXSxcbiAgICAgIG1hbmlmZXN0OiB7XG4gICAgICAgIG5hbWU6ICdEWlZOYmVhdHMgfCBTdHVkaW8gQmVhdCBQb3J0Zm9saW8nLFxuICAgICAgICBzaG9ydF9uYW1lOiAnRFpWTmJlYXRzJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTZXJ2ZXJsZXNzIFN0dWRpbyBCZWF0IFBvcnRmb2xpbyAmIERpcmVjdCBMaWNlbnNpbmcgUGxhdGZvcm0nLFxuICAgICAgICB0aGVtZV9jb2xvcjogJyMwOTA5MGInLFxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiAnIzA5MDkwYicsXG4gICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcbiAgICAgICAgb3JpZW50YXRpb246ICdwb3J0cmFpdC1wcmltYXJ5JyxcbiAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICdwd2EtMTkyeDE5Mi5wbmcnLFxuICAgICAgICAgICAgc2l6ZXM6ICcxOTJ4MTkyJyxcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICdwd2EtNTEyeDUxMi5wbmcnLFxuICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICdwd2EtNTEyeDUxMi5wbmcnLFxuICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgcHVycG9zZTogJ2FueSBtYXNrYWJsZSdcbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH0sXG4gICAgICB3b3JrYm94OiB7XG4gICAgICAgIC8vIEVYUExJQ0lUIFJFUVVJUkVNRU5UOiBJZ25vcmUgL3B1YmxpYy9iZWF0cy8gdG8gcHJldmVudCBoZWF2eSBhdWRpbyBjYWNoaW5nICYgbW9iaWxlIHF1b3RhIGNyYXNoZXNcbiAgICAgICAgZ2xvYklnbm9yZXM6IFsnKiovYmVhdHMvKionLCAnYmVhdHMvKionXSxcbiAgICAgICAgbmF2aWdhdGVGYWxsYmFja0RlbnlsaXN0OiBbL15cXC9iZWF0cy9dXG4gICAgICB9XG4gICAgfSlcbiAgXSxcbiAgYmFzZTogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJyA/ICcvRFpWTmJlYXRzLycgOiAnLycsXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgb3BlbjogdHJ1ZVxuICB9XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1AsU0FBUyxvQkFBb0I7QUFDL1EsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsZUFBZTtBQUN4QixTQUFTLGdCQUFnQjtBQUN6QixPQUFPLFVBQVU7QUFKakIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTSxtQkFBbUIsT0FBTztBQUFBLEVBQzlCLE1BQU07QUFBQSxFQUNOLGdCQUFnQixRQUFhO0FBQzNCLFVBQU0sV0FBVyxLQUFLLFFBQVEsa0NBQVcsY0FBYztBQUN2RCxXQUFPLFFBQVEsSUFBSSxRQUFRO0FBQzNCLFdBQU8sUUFBUSxHQUFHLE9BQU8sQ0FBQyxhQUFxQjtBQUM3QyxVQUFJLFNBQVMsU0FBUyxPQUFPLEtBQUssQ0FBQyxTQUFTLFNBQVMsUUFBUSxHQUFHO0FBQzlELGdCQUFRLElBQUksb0dBQTZGO0FBQ3pHLFlBQUk7QUFDRixtQkFBUywyQkFBMkI7QUFBQSxRQUN0QyxTQUFTLEtBQUs7QUFDWixrQkFBUSxNQUFNLG9DQUFvQyxHQUFHO0FBQUEsUUFDdkQ7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUNGO0FBR0EsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04saUJBQWlCO0FBQUEsSUFDakIsUUFBUTtBQUFBLE1BQ04sY0FBYztBQUFBLE1BQ2QsZUFBZSxDQUFDLGVBQWUsd0JBQXdCLGlCQUFpQjtBQUFBLE1BQ3hFLFVBQVU7QUFBQSxRQUNSLE1BQU07QUFBQSxRQUNOLFlBQVk7QUFBQSxRQUNaLGFBQWE7QUFBQSxRQUNiLGFBQWE7QUFBQSxRQUNiLGtCQUFrQjtBQUFBLFFBQ2xCLFNBQVM7QUFBQSxRQUNULGFBQWE7QUFBQSxRQUNiLE9BQU87QUFBQSxVQUNMO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsVUFDUjtBQUFBLFVBQ0E7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxVQUNSO0FBQUEsVUFDQTtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFlBQ04sU0FBUztBQUFBLFVBQ1g7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLE1BQ0EsU0FBUztBQUFBO0FBQUEsUUFFUCxhQUFhLENBQUMsZUFBZSxVQUFVO0FBQUEsUUFDdkMsMEJBQTBCLENBQUMsVUFBVTtBQUFBLE1BQ3ZDO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsTUFBTSxRQUFRLElBQUksYUFBYSxlQUFlLGdCQUFnQjtBQUFBLEVBQzlELFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
