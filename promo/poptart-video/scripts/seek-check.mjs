// Exercise the exact awaited frame-source entry point at random-access times.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';
import {root,chrome,scenes} from './common.mjs';
process.chdir(root);const build=path.join(root,'.build');
let html=fs.readFileSync('.build/index.html','utf8').replace('<script src="runtime.js"></script>','<script>window.__hyperframes={assetUrl:p=>p,registerFrameSource:()=>{}};</script><script src="runtime.js"></script>');
html=html.replace(/(<div id="host-\d+"[^>]*data-composition-src="([^"]+)"[^>]*>)<\/div>/g,(_,host,src)=>host+fs.readFileSync(path.join(build,src),'utf8').replace('<template>','').replace('</template>','')+'</div>');
html=html.replace(/<audio[\s\S]*?<\/audio>/g,'');
const server=http.createServer((req,res)=>{
  if(req.url==='/'){res.setHeader('content-type','text/html');return res.end(html);}
  const p=path.resolve(build,'.'+decodeURIComponent(req.url.split('?')[0]));
  if(!p.startsWith(build+path.sep)||!fs.existsSync(p)){res.statusCode=404;return res.end();}
  res.setHeader('content-type',({'.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.ttf':'font/ttf','.wav':'audio/wav'})[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);
});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await puppeteer.launch({executablePath:chrome(),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
  const page=await browser.newPage();await page.setViewport({width:1920,height:1080,deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'domcontentloaded'});
  const plan=scenes(),samples=[2.8,7.5,12.2,19.2,25.2,30.5,33.5,38.8];
  const times=[...samples,...plan.slice(1).flatMap(s=>[(s.startFrame-1)/60,s.startFrame/60,(s.startFrame+1)/60])];
  const seek=async t=>{await page.evaluate(async time=>{
    const api=PoptartScore.test,i=api.plan.findIndex(s=>time>=s.start&&time<s.end);
    document.querySelectorAll('.score-host').forEach((el,n)=>el.style.visibility=n===i?'visible':'hidden');
    await api.mounts[i].render(time-api.plan[i].start);
  },t);return createHash('sha256').update(await page.screenshot()).digest('hex');};
  const hashes=[];for(const t of times)hashes.push(await seek(t));
  for(let i=times.length-1;i>=0;i--)assert.equal(await seek(times[i]),hashes[i],`Pixels changed at ${times[i]}s`);
  assert.deepEqual(errors,[]);
  fs.writeFileSync('out/seek-check.json',JSON.stringify({frames:times,exactPixelMatches:times.length,pageErrors:errors},null,2));
  console.log(`PASS: ${times.length} exact shuffled/reverse seek matches, including every cut ±1 frame; no browser errors.`);
}finally{await browser.close();server.close();}
