// vite.config.ts
import { defineConfig, loadEnv } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { VitePWA } from "file:///home/project/node_modules/vite-plugin-pwa/dist/index.js";

// package.json
var package_default = {
  name: "vite-react-typescript-starter",
  private: true,
  version: "1.0.8",
  type: "module",
  scripts: {
    dev: "vite",
    build: "vite build",
    lint: "eslint .",
    preview: "vite preview"
  },
  dependencies: {
    "lucide-react": "^0.344.0",
    react: "^18.3.1",
    "react-dom": "^18.3.1",
    xlsx: "^0.18.5"
  },
  devDependencies: {
    "@eslint/js": "^9.9.1",
    "@types/node": "^24.0.14",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    autoprefixer: "^10.4.18",
    eslint: "^9.9.1",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.11",
    globals: "^15.9.0",
    postcss: "^8.4.35",
    tailwindcss: "^3.4.1",
    typescript: "^5.5.3",
    "typescript-eslint": "^8.3.0",
    vite: "^5.4.2",
    "vite-plugin-pwa": "^1.0.1"
  }
};

// vite.config.ts
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    // Definir variables de entorno globales para la aplicación cliente
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(package_default.version)
    },
    plugins: [
      react(),
      VitePWA({
        registerType: "prompt",
        includeAssets: ["favicon.ico", "apple-touch-icon.png"],
        manifest: {
          name: "Status Management",
          short_name: "StatusApp",
          description: "Aplicaci\xF3n para la gesti\xF3n de estados de env\xEDo.",
          theme_color: "#ffffff",
          icons: [
            {
              src: "pwa-192x192.png",
              // placeholder
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "pwa-512x512.png",
              // placeholder
              sizes: "512x512",
              type: "image/png"
            }
          ]
        }
      })
    ],
    optimizeDeps: {
      exclude: ["lucide-react"]
    },
    server: {
      proxy: {
        // Configuración del proxy para las llamadas a la API
        [env.VITE_API_URL]: {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, _res) => {
              console.log("proxy error", err);
            });
            proxy.on("proxyReq", (_proxyReq, req, _res) => {
              const fullUrl = env.VITE_API_URL + req.url;
              console.log(`
\u{1F50D} Request: ${req.method} ${fullUrl}`);
            });
            proxy.on("proxyRes", (proxyRes, req, _res) => {
              console.log(`\u{1F4E1} Response: ${proxyRes.statusCode} ${req.url}`);
            });
          }
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicGFja2FnZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSc7XG5cbi8vIEltcG9ydGFyIGVsIHBhY2thZ2UuanNvbiBwYXJhIGxlZXIgbGEgdmVyc2lcdTAwRjNuXG5pbXBvcnQgcGFja2FnZUpzb24gZnJvbSAnLi9wYWNrYWdlLmpzb24nO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIC8vIENhcmdhciB2YXJpYWJsZXMgZGUgZW50b3Jub1xuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksICcnKTtcblxuICByZXR1cm4ge1xuICAgIC8vIERlZmluaXIgdmFyaWFibGVzIGRlIGVudG9ybm8gZ2xvYmFsZXMgcGFyYSBsYSBhcGxpY2FjaVx1MDBGM24gY2xpZW50ZVxuICAgIGRlZmluZToge1xuICAgICAgJ2ltcG9ydC5tZXRhLmVudi5WSVRFX0FQUF9WRVJTSU9OJzogSlNPTi5zdHJpbmdpZnkocGFja2FnZUpzb24udmVyc2lvbiksXG4gICAgfSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCgpLFxuICAgICAgVml0ZVBXQSh7XG4gICAgICAgIHJlZ2lzdGVyVHlwZTogJ3Byb21wdCcsXG4gICAgICAgIGluY2x1ZGVBc3NldHM6IFsnZmF2aWNvbi5pY28nLCAnYXBwbGUtdG91Y2gtaWNvbi5wbmcnXSxcbiAgICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgICBuYW1lOiAnU3RhdHVzIE1hbmFnZW1lbnQnLFxuICAgICAgICAgIHNob3J0X25hbWU6ICdTdGF0dXNBcHAnLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXBsaWNhY2lcdTAwRjNuIHBhcmEgbGEgZ2VzdGlcdTAwRjNuIGRlIGVzdGFkb3MgZGUgZW52XHUwMEVEby4nLFxuICAgICAgICAgIHRoZW1lX2NvbG9yOiAnI2ZmZmZmZicsXG4gICAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3JjOiAncHdhLTE5MngxOTIucG5nJywgLy8gcGxhY2Vob2xkZXJcbiAgICAgICAgICAgICAgc2l6ZXM6ICcxOTJ4MTkyJyxcbiAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6ICdwd2EtNTEyeDUxMi5wbmcnLCAvLyBwbGFjZWhvbGRlclxuICAgICAgICAgICAgICBzaXplczogJzUxMng1MTInLFxuICAgICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgIF0sXG4gICAgb3B0aW1pemVEZXBzOiB7XG4gICAgICBleGNsdWRlOiBbJ2x1Y2lkZS1yZWFjdCddLFxuICAgIH0sXG4gICAgc2VydmVyOiB7XG4gICAgICBwcm94eToge1xuICAgICAgICAvLyBDb25maWd1cmFjaVx1MDBGM24gZGVsIHByb3h5IHBhcmEgbGFzIGxsYW1hZGFzIGEgbGEgQVBJXG4gICAgICAgIFtlbnYuVklURV9BUElfVVJMXToge1xuICAgICAgICAgIHRhcmdldDogZW52LlZJVEVfQVBJX1VSTCxcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgICBjb25maWd1cmU6IChwcm94eSwgX29wdGlvbnMpID0+IHtcbiAgICAgICAgICAgIC8vIE1hbmVqbyBkZSBlcnJvcmVzIGRlbCBwcm94eVxuICAgICAgICAgICAgcHJveHkub24oJ2Vycm9yJywgKGVyciwgX3JlcSwgX3JlcykgPT4ge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygncHJveHkgZXJyb3InLCBlcnIpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIExvZyBkZXRhbGxhZG8gZGUgbGFzIHBldGljaW9uZXMgc2FsaWVudGVzXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm94eS5vbigncHJveHlSZXEnLCAoX3Byb3h5UmVxLCByZXEsIF9yZXMpID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgZnVsbFVybCA9IGVudi5WSVRFX0FQSV9VUkwgKyByZXEudXJsO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgXFxuXHVEODNEXHVERDBEIFJlcXVlc3Q6ICR7cmVxLm1ldGhvZH0gJHtmdWxsVXJsfWApO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIExvZyBkZSBsYXMgcmVzcHVlc3RhcyByZWNpYmlkYXNcbiAgICAgICAgICAgIHByb3h5Lm9uKCdwcm94eVJlcycsIChwcm94eVJlcywgcmVxLCBfcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBcdUQ4M0RcdURDRTEgUmVzcG9uc2U6ICR7cHJveHlSZXMuc3RhdHVzQ29kZX0gJHtyZXEudXJsfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfTtcbn0pOyIsICJ7XG4gIFwibmFtZVwiOiBcInZpdGUtcmVhY3QtdHlwZXNjcmlwdC1zdGFydGVyXCIsXG4gIFwicHJpdmF0ZVwiOiB0cnVlLFxuICBcInZlcnNpb25cIjogXCIxLjAuOFwiLFxuICBcInR5cGVcIjogXCJtb2R1bGVcIixcbiAgXCJzY3JpcHRzXCI6IHtcbiAgICBcImRldlwiOiBcInZpdGVcIixcbiAgICBcImJ1aWxkXCI6IFwidml0ZSBidWlsZFwiLFxuICAgIFwibGludFwiOiBcImVzbGludCAuXCIsXG4gICAgXCJwcmV2aWV3XCI6IFwidml0ZSBwcmV2aWV3XCJcbiAgfSxcbiAgXCJkZXBlbmRlbmNpZXNcIjoge1xuICAgIFwibHVjaWRlLXJlYWN0XCI6IFwiXjAuMzQ0LjBcIixcbiAgICBcInJlYWN0XCI6IFwiXjE4LjMuMVwiLFxuICAgIFwicmVhY3QtZG9tXCI6IFwiXjE4LjMuMVwiLFxuICAgIFwieGxzeFwiOiBcIl4wLjE4LjVcIlxuICB9LFxuICBcImRldkRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJAZXNsaW50L2pzXCI6IFwiXjkuOS4xXCIsXG4gICAgXCJAdHlwZXMvbm9kZVwiOiBcIl4yNC4wLjE0XCIsXG4gICAgXCJAdHlwZXMvcmVhY3RcIjogXCJeMTguMy41XCIsXG4gICAgXCJAdHlwZXMvcmVhY3QtZG9tXCI6IFwiXjE4LjMuMFwiLFxuICAgIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjogXCJeNC4zLjFcIixcbiAgICBcImF1dG9wcmVmaXhlclwiOiBcIl4xMC40LjE4XCIsXG4gICAgXCJlc2xpbnRcIjogXCJeOS45LjFcIixcbiAgICBcImVzbGludC1wbHVnaW4tcmVhY3QtaG9va3NcIjogXCJeNS4xLjAtcmMuMFwiLFxuICAgIFwiZXNsaW50LXBsdWdpbi1yZWFjdC1yZWZyZXNoXCI6IFwiXjAuNC4xMVwiLFxuICAgIFwiZ2xvYmFsc1wiOiBcIl4xNS45LjBcIixcbiAgICBcInBvc3Rjc3NcIjogXCJeOC40LjM1XCIsXG4gICAgXCJ0YWlsd2luZGNzc1wiOiBcIl4zLjQuMVwiLFxuICAgIFwidHlwZXNjcmlwdFwiOiBcIl41LjUuM1wiLFxuICAgIFwidHlwZXNjcmlwdC1lc2xpbnRcIjogXCJeOC4zLjBcIixcbiAgICBcInZpdGVcIjogXCJeNS40LjJcIixcbiAgICBcInZpdGUtcGx1Z2luLXB3YVwiOiBcIl4xLjAuMVwiXG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxjQUFjLGVBQWU7QUFDL1AsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsZUFBZTs7O0FDRnhCO0FBQUEsRUFDRSxNQUFRO0FBQUEsRUFDUixTQUFXO0FBQUEsRUFDWCxTQUFXO0FBQUEsRUFDWCxNQUFRO0FBQUEsRUFDUixTQUFXO0FBQUEsSUFDVCxLQUFPO0FBQUEsSUFDUCxPQUFTO0FBQUEsSUFDVCxNQUFRO0FBQUEsSUFDUixTQUFXO0FBQUEsRUFDYjtBQUFBLEVBQ0EsY0FBZ0I7QUFBQSxJQUNkLGdCQUFnQjtBQUFBLElBQ2hCLE9BQVM7QUFBQSxJQUNULGFBQWE7QUFBQSxJQUNiLE1BQVE7QUFBQSxFQUNWO0FBQUEsRUFDQSxpQkFBbUI7QUFBQSxJQUNqQixjQUFjO0FBQUEsSUFDZCxlQUFlO0FBQUEsSUFDZixnQkFBZ0I7QUFBQSxJQUNoQixvQkFBb0I7QUFBQSxJQUNwQix3QkFBd0I7QUFBQSxJQUN4QixjQUFnQjtBQUFBLElBQ2hCLFFBQVU7QUFBQSxJQUNWLDZCQUE2QjtBQUFBLElBQzdCLCtCQUErQjtBQUFBLElBQy9CLFNBQVc7QUFBQSxJQUNYLFNBQVc7QUFBQSxJQUNYLGFBQWU7QUFBQSxJQUNmLFlBQWM7QUFBQSxJQUNkLHFCQUFxQjtBQUFBLElBQ3JCLE1BQVE7QUFBQSxJQUNSLG1CQUFtQjtBQUFBLEVBQ3JCO0FBQ0Y7OztBRDVCQSxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUV4QyxRQUFNLE1BQU0sUUFBUSxNQUFNLFFBQVEsSUFBSSxHQUFHLEVBQUU7QUFFM0MsU0FBTztBQUFBO0FBQUEsSUFFTCxRQUFRO0FBQUEsTUFDTixvQ0FBb0MsS0FBSyxVQUFVLGdCQUFZLE9BQU87QUFBQSxJQUN4RTtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFFBQ2QsZUFBZSxDQUFDLGVBQWUsc0JBQXNCO0FBQUEsUUFDckQsVUFBVTtBQUFBLFVBQ1IsTUFBTTtBQUFBLFVBQ04sWUFBWTtBQUFBLFVBQ1osYUFBYTtBQUFBLFVBQ2IsYUFBYTtBQUFBLFVBQ2IsT0FBTztBQUFBLFlBQ0w7QUFBQSxjQUNFLEtBQUs7QUFBQTtBQUFBLGNBQ0wsT0FBTztBQUFBLGNBQ1AsTUFBTTtBQUFBLFlBQ1I7QUFBQSxZQUNBO0FBQUEsY0FDRSxLQUFLO0FBQUE7QUFBQSxjQUNMLE9BQU87QUFBQSxjQUNQLE1BQU07QUFBQSxZQUNSO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFDQSxjQUFjO0FBQUEsTUFDWixTQUFTLENBQUMsY0FBYztBQUFBLElBQzFCO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixPQUFPO0FBQUE7QUFBQSxRQUVMLENBQUMsSUFBSSxZQUFZLEdBQUc7QUFBQSxVQUNsQixRQUFRLElBQUk7QUFBQSxVQUNaLGNBQWM7QUFBQSxVQUNkLFFBQVE7QUFBQSxVQUNSLFdBQVcsQ0FBQyxPQUFPLGFBQWE7QUFFOUIsa0JBQU0sR0FBRyxTQUFTLENBQUMsS0FBSyxNQUFNLFNBQVM7QUFDckMsc0JBQVEsSUFBSSxlQUFlLEdBQUc7QUFBQSxZQUNoQyxDQUFDO0FBR1csa0JBQU0sR0FBRyxZQUFZLENBQUMsV0FBVyxLQUFLLFNBQVM7QUFDekQsb0JBQU0sVUFBVSxJQUFJLGVBQWUsSUFBSTtBQUN2QyxzQkFBUSxJQUFJO0FBQUEscUJBQWlCLElBQUksTUFBTSxJQUFJLE9BQU8sRUFBRTtBQUFBLFlBQ3RELENBQUM7QUFHRCxrQkFBTSxHQUFHLFlBQVksQ0FBQyxVQUFVLEtBQUssU0FBUztBQUM1QyxzQkFBUSxJQUFJLHVCQUFnQixTQUFTLFVBQVUsSUFBSSxJQUFJLEdBQUcsRUFBRTtBQUFBLFlBQzlELENBQUM7QUFBQSxVQUNIO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
