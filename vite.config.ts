import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Importar el package.json para leer la versión
import packageJson from './package.json';

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Definir variables de entorno globales para la aplicación cliente
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
      // Opcional: También podemos incluir más información del package.json
      'import.meta.env.VITE_APP_NAME': JSON.stringify(packageJson.name),
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        workbox: {
          // Incluir la versión en el service worker para mejor cache busting
          additionalManifestEntries: [
            {
              url: '/version.json',
              revision: packageJson.version
            }
          ]
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
        manifest: {
          name: 'Status Management',
          short_name: 'StatusApp',
          description: `Aplicación para la gestión de estados de envío v${packageJson.version}`,
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png', // placeholder
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png', // placeholder
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: {
        // Configuración del proxy para las llamadas a la API
        [env.VITE_API_URL]: {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            // Manejo de errores del proxy
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });

            // Log detallado de las peticiones salientes
                        proxy.on('proxyReq', (_proxyReq, req, _res) => {
              const fullUrl = env.VITE_API_URL + req.url;
              console.log(`\n🔍 Request: ${req.method} ${fullUrl}`);
            });

            // Log de las respuestas recibidas
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log(`📡 Response: ${proxyRes.statusCode} ${req.url}`);
            });
          },
        },
      },
    },
  };
});