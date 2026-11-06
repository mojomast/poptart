// Production-asset + real plugin.js bridge harness. SDK shim reproduces its
// documented iframe props; this is NOT an actual Hermes pane validation.
import {createServer} from 'node:http';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createApp} from '../server/index.js';
const temp=await mkdtemp(join(tmpdir(),'poptart-desktop-'));
const token=randomBytes(32).toString('hex');
const service=createApp({file:join(temp,'tracks.json'),token,assets:resolve('integration/hermes/assets')});
await new Promise(r=>service.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${service.address().port}`;
const mapping={list:'track.list',get:'track.get',create:'track.create',update:'track.update',snapshot:'snapshot.create',restore:'snapshot.restore',analyze:'analyze_track',export:'export_track'};
const tool=async (op,input) => (await fetch(base+'/api/tool',{method:'POST',headers:{'Content-Type':'application/json',authorization:'Bearer '+token},body:JSON.stringify({operation:mapping[op],input})})).json();
const bundle=await build({stdin:{contents:`import React from 'react'; import {createRoot} from 'react-dom/client'; import plugin from './integration/hermes/desktop/plugin.js'; const ctx={rest:async(path,opts)=>{const r=await fetch('/test'+path,{method:opts?.method||'GET',headers:{'Content-Type':'application/json'},body:opts?.body?JSON.stringify(opts.body):undefined});return r.json()},register:c=>createRoot(document.getElementById('root')).render(c.render())};plugin.register(ctx);`,resolveDir:process.cwd()},bundle:true,format:'esm',write:false,plugins:[{name:'sdk-contract-shim',setup(b){b.onResolve({filter:/^@hermes\/plugin-sdk$/},()=>({path:'sdk',namespace:'shim'}));b.onLoad({filter:/.*/,namespace:'shim'},()=>({contents:`import React from 'react';export const SandboxedFrame=React.forwardRef((p,ref)=>React.createElement('iframe',{...p,ref,sandbox:'allow-scripts',referrerPolicy:'no-referrer'}));`,resolveDir:process.cwd()}))}}]});
const host=createServer(async(req,res)=>{
  if(req.url==='/bundle.js'){res.setHeader('Content-Type','text/javascript');return res.end(bundle.outputFiles[0].text)}
  if(req.url==='/test/bootstrap'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({ok:true,studioUrl:base+'/player'}))}
  if(req.url==='/test/tool'){const chunks=[];for await(const c of req)chunks.push(c);const {op,input}=JSON.parse(Buffer.concat(chunks));const result=await tool(op,input);if(!result.ok)Object.assign(result,{code:result.error.code,error:result.error.message});res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(result))}
  res.setHeader('Content-Type','text/html');res.end('<html><body style="margin:0;background:#171717"><div id="root" style="height:100vh"></div><script type="module" src="/bundle.js"></script></body></html>');
});
await new Promise(r=>host.listen(0,'127.0.0.1',r));
let browser;
try {
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1400,height:1000}});
 // Instrument only this disposable test browser's audio graph, never Hermes or plugin production code.
 await page.addInitScript(() => {const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(destination,...rest){if(destination instanceof AudioDestinationNode&&!window.__studioAnalyser){const analyser=this.context.createAnalyser();connect.call(this,analyser);window.__studioAnalyser=analyser}return connect.call(this,destination,...rest)}});
 const issues=[];page.on('pageerror',e=>issues.push(e.message));
 await page.goto(`http://127.0.0.1:${host.address().port}`);
 const player=page.frameLocator('iframe[title="Poptart Strudel Studio"]');
 await player.getByText('SESSION READY').waitFor();
 assert.equal(await page.locator('iframe').first().getAttribute('sandbox'),'allow-scripts');
 assert.equal(await page.locator('iframe').first().getAttribute('referrerpolicy'),'no-referrer');
 await player.getByRole('button',{name:'New track',exact:true}).click();
 await player.getByLabel('Track title').waitFor();
 const code=player.getByLabel('Pattern code');
 await code.fill('s("bd*4")');
 const audio=player.frameLocator('iframe[title="Isolated audio controls"]');
 await audio.getByRole('button',{name:'Play',exact:true}).click();
 await audio.getByRole('status').getByText('Playing',{exact:true}).waitFor({timeout:15000});
 const af=page.frames().find(f=>f.url().includes('/audio'));
 const measure=async()=>af.evaluate(async()=>{const a=window.__studioAnalyser;if(!a)return -1;let peak=0;for(let i=0;i<30;i++){const d=new Float32Array(a.fftSize);a.getFloatTimeDomainData(d);peak=Math.max(peak,...d.map(Math.abs));await new Promise(r=>setTimeout(r,50))}return peak});
 const peak=await measure();assert.ok(peak>0.00001,`nonzero sample output required: ${peak}`);
 // Neither the nested execution frame nor malformed editor envelopes get a host capability.
 const beforeHostile=(await tool('list',{})).data.length;
 const pf=page.frames().find(f=>f.url().includes('/player'));
 await pf.evaluate(()=>{const cap=new URLSearchParams(location.hash.slice(1)).get('cap');for(const [version,capability] of [[2,cap],[1,'wrong']])parent.postMessage({version,capability,id:'forged',type:'tool.request',payload:{operation:'track.create',input:{title:'forged',code:'silence',tempo:120,sections:[]}}},'*')});
 await af.evaluate(()=>parent.parent.postMessage({version:1,id:'nested',type:'tool.request',payload:{operation:'track.create',input:{}}},'*'));
 await page.waitForTimeout(150);
 assert.equal((await tool('list',{})).data.length,beforeHostile);
 const denied=await af.evaluate(async url=>{try{return (await fetch(url+'/api/tool',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status}catch{return 'blocked'}},base);
 assert.ok(denied==='blocked'||denied===403);
 await code.fill('this is not valid $$$');
 await audio.getByRole('button',{name:'Play',exact:true}).click();
 await audio.getByRole('status').getByText(/Error:/).waitFor();
 const afterInvalid=await measure();assert.ok(afterInvalid>0.00001);
 await audio.getByRole('button',{name:'Mute',exact:true}).click();
 await audio.getByRole('button',{name:'Unmute',exact:true}).waitFor();
 await page.waitForTimeout(100);
 const mutedPeak=await measure();assert.ok(mutedPeak<0.00001,`muted output should be zero: ${mutedPeak}`);
 await audio.getByRole('button',{name:'Unmute',exact:true}).click();
 await page.locator('iframe').first().evaluate(el=>el.style.display='none');
 const hiddenPeak=await measure();assert.ok(hiddenPeak>0.00001);
 await page.locator('iframe').first().evaluate(el=>el.style.display='');
 // Dirty edits must survive poll notifications.
 const list=await tool('list',{});const track=list.data[0];
 await tool('update',{trackId:track.id,expectedRevision:track.revision,changes:{title:'external edit'}});
 await player.getByText(/track changed elsewhere/).waitFor({timeout:7000});
 assert.equal(await code.inputValue(),'this is not valid $$$');
 await page.getByRole('button',{name:'Reload studio (stops audio)'}).click();
 await player.getByText('SESSION READY').waitFor();
 assert.ok(af.isDetached(),'Reload must destroy old audio realm');
 console.log(JSON.stringify({productionAssets:true,samplePeak:peak,mutedPeak,hiddenPeak,afterInvalidPeak:afterInvalid,opaqueNoReferrerHandshake:true,userGestureSamplePlayback:true,invalidEditError:true,dirtyPollPreserved:true,reloadReconnected:true,opaqueApiDenied:denied,hostileMessagesIgnored:true,pageErrors:issues}));
 assert.deepEqual(issues,[]);
} finally {await browser?.close();await new Promise(r=>host.close(r));await new Promise(r=>service.close(r));await rm(temp,{recursive:true,force:true})}
