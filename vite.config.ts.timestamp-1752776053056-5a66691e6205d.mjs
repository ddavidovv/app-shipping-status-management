// vite.config.ts
import { defineConfig, loadEnv } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { VitePWA } from "file:///home/project/node_modules/vite-plugin-pwa/dist/index.js";

// package.json
var package_default = {
  name: "vite-react-typescript-starter",
  private: true,
  version: "1.1.2",
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
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(package_default.version),
      // Opcional: También podemos incluir más información del package.json
      "import.meta.env.VITE_APP_NAME": JSON.stringify(package_default.name)
    },
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        devOptions: {
          enabled: true,
          type: "module"
        },
        workbox: {
          // Configuración balanceada para detectar cambios sin penalizar rendimiento
          clientsClaim: true,
          skipWaiting: true,
          cleanupOutdatedCaches: true,
          // Cache strategies optimizadas
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api-test\.cttexpress\.com\//,
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                networkTimeoutSeconds: 8,
                cacheableResponse: {
                  statuses: [0, 200]
                },
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 5 * 60
                  // 5 minutos
                }
              }
            }
          ]
        },
        includeAssets: ["favicon.ico", "apple-touch-icon.png"],
        manifest: {
          name: "Status Management",
          short_name: "StatusApp",
          description: `Aplicaci\xF3n para la gesti\xF3n de estados de env\xEDo v${package_default.version}`,
          theme_color: "#ffffff",
          start_url: `/?v=${package_default.version}`,
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicGFja2FnZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSc7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5cbi8vIEltcG9ydGFyIGVsIHBhY2thZ2UuanNvbiBwYXJhIGxlZXIgbGEgdmVyc2lcdTAwRjNuXG5pbXBvcnQgcGFja2FnZUpzb24gZnJvbSAnLi9wYWNrYWdlLmpzb24nO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIC8vIENhcmdhciB2YXJpYWJsZXMgZGUgZW50b3Jub1xuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksICcnKTtcblxuICByZXR1cm4ge1xuICAgIC8vIERlZmluaXIgdmFyaWFibGVzIGRlIGVudG9ybm8gZ2xvYmFsZXMgcGFyYSBsYSBhcGxpY2FjaVx1MDBGM24gY2xpZW50ZVxuICAgIGRlZmluZToge1xuICAgICAgJ2ltcG9ydC5tZXRhLmVudi5WSVRFX0FQUF9WRVJTSU9OJzogSlNPTi5zdHJpbmdpZnkocGFja2FnZUpzb24udmVyc2lvbiksXG4gICAgICAvLyBPcGNpb25hbDogVGFtYmlcdTAwRTluIHBvZGVtb3MgaW5jbHVpciBtXHUwMEUxcyBpbmZvcm1hY2lcdTAwRjNuIGRlbCBwYWNrYWdlLmpzb25cbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9BUFBfTkFNRSc6IEpTT04uc3RyaW5naWZ5KHBhY2thZ2VKc29uLm5hbWUpLFxuICAgIH0sXG4gICAgcGx1Z2luczogW1xuICAgICAgcmVhY3QoKSxcbiAgICAgIFZpdGVQV0Eoe1xuICAgICAgICByZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJyxcbiAgICAgICAgZGV2T3B0aW9uczoge1xuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgdHlwZTogJ21vZHVsZSdcbiAgICAgICAgfSxcbiAgICAgICAgd29ya2JveDoge1xuICAgICAgICAgIC8vIENvbmZpZ3VyYWNpXHUwMEYzbiBiYWxhbmNlYWRhIHBhcmEgZGV0ZWN0YXIgY2FtYmlvcyBzaW4gcGVuYWxpemFyIHJlbmRpbWllbnRvXG4gICAgICAgICAgY2xpZW50c0NsYWltOiB0cnVlLFxuICAgICAgICAgIHNraXBXYWl0aW5nOiB0cnVlLFxuICAgICAgICAgIGNsZWFudXBPdXRkYXRlZENhY2hlczogdHJ1ZSxcbiAgICAgICAgICAvLyBDYWNoZSBzdHJhdGVnaWVzIG9wdGltaXphZGFzXG4gICAgICAgICAgcnVudGltZUNhY2hpbmc6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdXJsUGF0dGVybjogL15odHRwczpcXC9cXC9hcGktdGVzdFxcLmN0dGV4cHJlc3NcXC5jb21cXC8vLFxuICAgICAgICAgICAgICBoYW5kbGVyOiAnTmV0d29ya0ZpcnN0JyxcbiAgICAgICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgICAgIGNhY2hlTmFtZTogJ2FwaS1jYWNoZScsXG4gICAgICAgICAgICAgICAgbmV0d29ya1RpbWVvdXRTZWNvbmRzOiA4LFxuICAgICAgICAgICAgICAgIGNhY2hlYWJsZVJlc3BvbnNlOiB7XG4gICAgICAgICAgICAgICAgICBzdGF0dXNlczogWzAsIDIwMF1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcbiAgICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDUwLFxuICAgICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNSAqIDYwIC8vIDUgbWludXRvc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAgaW5jbHVkZUFzc2V0czogWydmYXZpY29uLmljbycsICdhcHBsZS10b3VjaC1pY29uLnBuZyddLFxuICAgICAgICBtYW5pZmVzdDoge1xuICAgICAgICAgIG5hbWU6ICdTdGF0dXMgTWFuYWdlbWVudCcsXG4gICAgICAgICAgc2hvcnRfbmFtZTogJ1N0YXR1c0FwcCcsXG4gICAgICAgICAgZGVzY3JpcHRpb246IGBBcGxpY2FjaVx1MDBGM24gcGFyYSBsYSBnZXN0aVx1MDBGM24gZGUgZXN0YWRvcyBkZSBlbnZcdTAwRURvIHYke3BhY2thZ2VKc29uLnZlcnNpb259YCxcbiAgICAgICAgICB0aGVtZV9jb2xvcjogJyNmZmZmZmYnLFxuICAgICAgICAgIHN0YXJ0X3VybDogYC8/dj0ke3BhY2thZ2VKc29uLnZlcnNpb259YCxcbiAgICAgICAgICBpY29uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6ICdwd2EtMTkyeDE5Mi5wbmcnLCAvLyBwbGFjZWhvbGRlclxuICAgICAgICAgICAgICBzaXplczogJzE5MngxOTInLFxuICAgICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHNyYzogJ3B3YS01MTJ4NTEyLnBuZycsIC8vIHBsYWNlaG9sZGVyXG4gICAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXG4gICAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgXSxcbiAgICBvcHRpbWl6ZURlcHM6IHtcbiAgICAgIGV4Y2x1ZGU6IFsnbHVjaWRlLXJlYWN0J10sXG4gICAgfSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIHByb3h5OiB7XG4gICAgICAgIC8vIENvbmZpZ3VyYWNpXHUwMEYzbiBkZWwgcHJveHkgcGFyYSBsYXMgbGxhbWFkYXMgYSBsYSBBUElcbiAgICAgICAgW2Vudi5WSVRFX0FQSV9VUkxdOiB7XG4gICAgICAgICAgdGFyZ2V0OiBlbnYuVklURV9BUElfVVJMLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgICAgIGNvbmZpZ3VyZTogKHByb3h5LCBfb3B0aW9ucykgPT4ge1xuICAgICAgICAgICAgLy8gTWFuZWpvIGRlIGVycm9yZXMgZGVsIHByb3h5XG4gICAgICAgICAgICBwcm94eS5vbignZXJyb3InLCAoZXJyLCBfcmVxLCBfcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdwcm94eSBlcnJvcicsIGVycik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gTG9nIGRldGFsbGFkbyBkZSBsYXMgcGV0aWNpb25lcyBzYWxpZW50ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3h5Lm9uKCdwcm94eVJlcScsIChfcHJveHlSZXEsIHJlcSwgX3JlcykgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBmdWxsVXJsID0gZW52LlZJVEVfQVBJX1VSTCArIHJlcS51cmw7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBcXG5cdUQ4M0RcdUREMEQgUmVxdWVzdDogJHtyZXEubWV0aG9kfSAke2Z1bGxVcmx9YCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gTG9nIGRlIGxhcyByZXNwdWVzdGFzIHJlY2liaWRhc1xuICAgICAgICAgICAgcHJveHkub24oJ3Byb3h5UmVzJywgKHByb3h5UmVzLCByZXEsIF9yZXMpID0+IHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coYFx1RDgzRFx1RENFMSBSZXNwb25zZTogJHtwcm94eVJlcy5zdGF0dXNDb2RlfSAke3JlcS51cmx9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9O1xufSk7IiwgIntcbiAgXCJuYW1lXCI6IFwidml0ZS1yZWFjdC10eXBlc2NyaXB0LXN0YXJ0ZXJcIixcbiAgXCJwcml2YXRlXCI6IHRydWUsXG4gIFwidmVyc2lvblwiOiBcIjEuMS4yXCIsXG4gIFwidHlwZVwiOiBcIm1vZHVsZVwiLFxuICBcInNjcmlwdHNcIjoge1xuICAgIFwiZGV2XCI6IFwidml0ZVwiLFxuICAgIFwiYnVpbGRcIjogXCJ2aXRlIGJ1aWxkXCIsXG4gICAgXCJsaW50XCI6IFwiZXNsaW50IC5cIixcbiAgICBcInByZXZpZXdcIjogXCJ2aXRlIHByZXZpZXdcIlxuICB9LFxuICBcImRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJsdWNpZGUtcmVhY3RcIjogXCJeMC4zNDQuMFwiLFxuICAgIFwicmVhY3RcIjogXCJeMTguMy4xXCIsXG4gICAgXCJyZWFjdC1kb21cIjogXCJeMTguMy4xXCIsXG4gICAgXCJ4bHN4XCI6IFwiXjAuMTguNVwiXG4gIH0sXG4gIFwiZGV2RGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcIkBlc2xpbnQvanNcIjogXCJeOS45LjFcIixcbiAgICBcIkB0eXBlcy9ub2RlXCI6IFwiXjI0LjAuMTRcIixcbiAgICBcIkB0eXBlcy9yZWFjdFwiOiBcIl4xOC4zLjVcIixcbiAgICBcIkB0eXBlcy9yZWFjdC1kb21cIjogXCJeMTguMy4wXCIsXG4gICAgXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiOiBcIl40LjMuMVwiLFxuICAgIFwiYXV0b3ByZWZpeGVyXCI6IFwiXjEwLjQuMThcIixcbiAgICBcImVzbGludFwiOiBcIl45LjkuMVwiLFxuICAgIFwiZXNsaW50LXBsdWdpbi1yZWFjdC1ob29rc1wiOiBcIl41LjEuMC1yYy4wXCIsXG4gICAgXCJlc2xpbnQtcGx1Z2luLXJlYWN0LXJlZnJlc2hcIjogXCJeMC40LjExXCIsXG4gICAgXCJnbG9iYWxzXCI6IFwiXjE1LjkuMFwiLFxuICAgIFwicG9zdGNzc1wiOiBcIl44LjQuMzVcIixcbiAgICBcInRhaWx3aW5kY3NzXCI6IFwiXjMuNC4xXCIsXG4gICAgXCJ0eXBlc2NyaXB0XCI6IFwiXjUuNS4zXCIsXG4gICAgXCJ0eXBlc2NyaXB0LWVzbGludFwiOiBcIl44LjMuMFwiLFxuICAgIFwidml0ZVwiOiBcIl41LjQuMlwiLFxuICAgIFwidml0ZS1wbHVnaW4tcHdhXCI6IFwiXjEuMC4xXCJcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLGNBQWMsZUFBZTtBQUMvUCxPQUFPLFdBQVc7QUFDbEIsU0FBUyxlQUFlOzs7QUNGeEI7QUFBQSxFQUNFLE1BQVE7QUFBQSxFQUNSLFNBQVc7QUFBQSxFQUNYLFNBQVc7QUFBQSxFQUNYLE1BQVE7QUFBQSxFQUNSLFNBQVc7QUFBQSxJQUNULEtBQU87QUFBQSxJQUNQLE9BQVM7QUFBQSxJQUNULE1BQVE7QUFBQSxJQUNSLFNBQVc7QUFBQSxFQUNiO0FBQUEsRUFDQSxjQUFnQjtBQUFBLElBQ2QsZ0JBQWdCO0FBQUEsSUFDaEIsT0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLElBQ2IsTUFBUTtBQUFBLEVBQ1Y7QUFBQSxFQUNBLGlCQUFtQjtBQUFBLElBQ2pCLGNBQWM7QUFBQSxJQUNkLGVBQWU7QUFBQSxJQUNmLGdCQUFnQjtBQUFBLElBQ2hCLG9CQUFvQjtBQUFBLElBQ3BCLHdCQUF3QjtBQUFBLElBQ3hCLGNBQWdCO0FBQUEsSUFDaEIsUUFBVTtBQUFBLElBQ1YsNkJBQTZCO0FBQUEsSUFDN0IsK0JBQStCO0FBQUEsSUFDL0IsU0FBVztBQUFB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
