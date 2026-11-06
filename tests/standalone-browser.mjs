// Disposable production-asset standalone host; no persistent tracks or services.
import {createServer} from 'node:http';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {createApp} from '../server/index.js';
const temp=await mkdtemp(join(tmpdir(),'poptart-standalone-'));
const token=randomBytes(32).toString('hex');
const tokenFile=join(temp,'service.token');
await writeFile(tokenFile,token,{mode:0o600});
const app=createApp({file:join(temp,'tracks.json'),token,assets:resolve('dist')});
let origin;
const host=createServer((req,res)=>{
  if(req.url.startsWith('/api/')) {
    if(req.headers.origin && req.headers.origin!==origin){res.writeHead(403);return res.end()}
    delete req.headers.origin;req.headers.authorization='Bearer '+token;
  }
  app.emit('request',req,res);
});
try {
 await new Promise(r=>host.listen(0,'127.0.0.1',r));
 origin=`http://127.0.0.1:${host.address().port}`;
 process.env.STUDIO_URL=origin;process.env.SERVICE_URL=origin;process.env.POPTART_TOKEN_FILE=tokenFile;
 await import('./browser.mjs');
} finally {await new Promise(r=>host.close(r));await rm(temp,{recursive:true,force:true})}
