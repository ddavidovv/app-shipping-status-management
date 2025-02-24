import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || 'https://api-test.cttexpress.com';
  
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          secure: false,
          headers: {
            'Authorization': env.VITE_JWT_TOKEN,
            'client_secret': env.VITE_CLIENT_SECRET,
            'client_id': env.VITE_CLIENT_ID
          },
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              const fullUrl = apiUrl + req.url.replace(/^\/api/, '');
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
              console.log('Status:', proxyRes.statusCode);
              console.log('Path:', req.url);
              if (proxyRes.statusCode >= 400) {
                console.log('Response Headers:', proxyRes.headers);
              }
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            });
          }
        }
      }
    }
  };
});