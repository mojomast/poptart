import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Opaque-origin player modules need CORS. Do not expose the rest of the
// development workspace (in particular data/, /@fs/ or API routes) to them.
export default defineConfig({
  plugins: [react(), {
    name: 'opaque-frame-resource-allowlist',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.headers.origin === 'null') {
          const path = (req.url || '').split('?')[0];
          const allowed = ['/src/', '/node_modules/.vite/', '/node_modules/vite/dist/client/', '/@vite/', '/@id/', '/samples/'].some(prefix => path.startsWith(prefix)) || path === '/@react-refresh';
          if (!allowed) { res.statusCode = 403; res.end('Forbidden'); return; }
        }
        next();
      });
    },
  }],
  server: { host: '127.0.0.1', port: 5173, strictPort: true, cors: true, proxy: { '/api': 'http://127.0.0.1:4311' } },
});
