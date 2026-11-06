import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
  server: { host: '127.0.0.1', port: 5173, strictPort: true, cors: true, proxy: { '/api': { target: 'http://127.0.0.1:4311', configure(proxy) { proxy.on('proxyReq', (out, req) => { if (!req.headers.origin || req.headers.origin === 'http://127.0.0.1:5173') { try { out.setHeader('Authorization', 'Bearer ' + readFileSync(resolve(process.env.POPTART_TOKEN_FILE || '.workspace/service.token'), 'utf8')); } catch { /* service returns 401 */ } } }); } } } },
});
