import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { readFile, stat, realpath } from 'node:fs/promises';
import { loadToken } from './token.js';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createStore } from './store.js';

const MAX_BODY = 1024 * 1024;
export function createApp({ file = resolve('data', 'tracks.json'), origin, token, assets } = {}) {
  if (typeof token !== 'string' || token.length < 32) throw new Error('A service token is required');
  const store = createStore(file);
  return createServer(async (req, res) => {
    // Public, read-only bundled assets contain no state or credentials.
    if (assets && req.method === 'GET' && !req.url.startsWith('/api/')) {
      try {
        let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        if (['/', '/player', '/audio'].includes(path)) path = '/index.html';
        if (path !== '/index.html' && !/^\/(assets|samples)\/[A-Za-z0-9_.\/-]+$/.test(path)) throw Error();
        const root = await realpath(assets);
        const target = await realpath(resolve(root, '.' + path));
        if (!target.startsWith(root + '/') || !(await stat(target)).isFile()) throw Error();
        const ext = target.split('.').pop();
        res.writeHead(200, {'Content-Type': ({html:'text/html',js:'text/javascript',css:'text/css',wav:'audio/wav',json:'application/json'})[ext] || 'application/octet-stream', 'Access-Control-Allow-Origin':'*', 'Cache-Control':'no-cache', 'X-Content-Type-Options':'nosniff'});
        return res.end(await readFile(target));
      } catch { res.writeHead(404); return res.end(); }
    }
    if (origin && req.headers.origin === origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    }
    const reply = (status, value) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(value));
    };
    // Browser requests from an opaque player or unrelated site must never reach tools.
    // Browser origin is not authentication; all API callers also need the bearer token.
    const allowedOrigin = origin || 'http://127.0.0.1:5173';
    if (req.headers.origin && req.headers.origin !== allowedOrigin) return reply(403, { ok: false, error: { code: 'FORBIDDEN', message: 'Origin is not authorized' } });
    if (req.url !== '/api/tool') return reply(404, { ok: false, error: { code: 'NOT_FOUND', message: 'Not found' } });
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    const supplied = Buffer.from(req.headers.authorization || '');
    const expected = Buffer.from('Bearer ' + token);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return reply(401, { ok: false, error: { code: 'UNAUTHORIZED', message: 'Service authentication required' } });
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
  const port = Number(process.env.PORT ?? 4311);
  const token = await loadToken(resolve(process.env.POPTART_TOKEN_FILE || '.workspace/service.token'));
  createApp({ file: resolve(process.env.POPTART_DATA_FILE || 'data/tracks.json'), origin: process.env.POPTART_UI_ORIGIN, token, assets: process.env.POPTART_ASSETS }).listen(port, '127.0.0.1', function () { console.log(JSON.stringify({port:this.address().port})); });
}
