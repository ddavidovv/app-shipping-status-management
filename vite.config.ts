import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: {
        [env.VITE_API_URL]: {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: false,

          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              const fullUrl = env.VITE_API_URL + req.url;
              console.log('\n🔍 Request Details:');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('Full URL:', fullUrl);
              console.log('Method:', req.method);
              console.log('Headers:', proxyReq.getHeaders());
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('\n📡 Response Details:');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('Path:', req.url);
              if (proxyRes.statusCode) {
                console.log('Status:', proxyRes.statusCode);
                if (proxyRes.statusCode >= 400) {
                  console.log('Response Headers:', proxyRes.headers);
                }
              }
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            });
          }
        }
      }
    }
  };
});