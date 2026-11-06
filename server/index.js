import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createStore } from './store.js';

const MAX_BODY = 1024 * 1024;
export function createApp({ file = resolve('data', 'tracks.json'), origin } = {}) {
  const store = createStore(file);
  return createServer(async (req, res) => {
    if (origin && req.headers.origin === origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    }
    const reply = (status, value) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(value));
    };
    if (req.url !== '/api/tool') return reply(404, { ok: false, error: { code: 'NOT_FOUND', message: 'Not found' } });
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    if (req.method !== 'POST') return reply(405, { ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST' } });
    if (!/^application\/json(?:\s*;|\s*$)/i.test(req.headers['content-type'] || '')) return reply(415, { ok: false, error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Content-Type must be application/json' } });
    try {
      const chunks = []; let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > MAX_BODY) return reply(413, { ok: false, error: { code: 'TOO_LARGE', message: 'Request body too large' } });
        chunks.push(chunk);
      }
      let request;
      try { request = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return reply(400, { ok: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON' } }); }
      return reply(200, await store.execute(request));
    } catch { if (!res.headersSent) reply(500, { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Request failed' } }); }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 3001);
  createApp({ file: resolve(process.env.POPTART_DATA_FILE || 'data/tracks.json'), origin: process.env.POPTART_UI_ORIGIN }).listen(port, '127.0.0.1', () => console.log(`Poptart service listening on http://127.0.0.1:${port}`));
}
