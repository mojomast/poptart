// Production-asset + actual plugin.js bridge regression. A small React SDK
// adapter loads the installed Webapp guest-shell HTML/CSP fixture. This is not
// a signed-in real Hermes session; the browser cannot reach the sidecar.
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
const sdkGuest=JSON.parse(await readFile('tests/fixtures/hermes-guest-shell.json','utf8'));
const guestDocument=await readFile('integration/hermes/guest-document.html','utf8');
const guestBuild=JSON.parse(await readFile('integration/hermes/guest-build.json','utf8'));
const base=`http://127.0.0.1:${service.address().port}`;
const mapping={list:'track.list',get:'track.get',create:'track.create',update:'track.update',snapshot:'snapshot.create',restore:'snapshot.restore',analyze:'analyze_track',export:'export_track'};
const tool=async (op,input) => (await fetch(base+'/api/tool',{method:'POST',headers:{'Content-Type':'application/json',authorization:'Bearer '+token},body:JSON.stringify({operation:mapping[op],input})})).json();
const bundle=await build({stdin:{contents:`import React from 'react'; import {createRoot} from 'react-dom/client'; import plugin from './integration/hermes/desktop/plugin.js'; const ctx={rest:async(path,opts)=>{const r=await fetch('/test'+path,{method:opts?.method||'GET',headers:{'Content-Type':'application/json'},body:opts?.body?JSON.stringify(opts.body):undefined});return r.json()},register:c=>createRoot(document.getElementById('root')).render(c.render())};plugin.register(ctx);`,resolveDir:process.cwd()},bundle:true,format:'esm',write:false,plugins:[{name:'sdk-contract-shim',setup(b){b.onResolve({filter:/^@hermes\/plugin-sdk$/},()=>({path:'sdk',namespace:'shim'}));b.onLoad({filter:/.*/,namespace:'shim'},()=>({contents:`import React from 'react';export const SandboxedFrame=React.forwardRef((p,ref)=>React.createElement('iframe',{...p,ref,src:'/assets/webapp-guest.html',sandbox:'allow-scripts',referrerPolicy:'no-referrer',onLoad:e=>{e.target.contentWindow.postMessage({type:'hermes-preview-document',html:decodeURIComponent(p.src.slice(p.src.indexOf(',')+1).split('#')[0]),sandbox:'allow-scripts'},'*')}}));`,resolveDir:process.cwd()}))}}]});
let staleBootstrap=false;
const host=createServer(async(req,res)=>{
  if(req.url==='/assets/webapp-guest.html'){res.setHeader('Content-Type','text/html');res.setHeader('Content-Security-Policy',sdkGuest.policy);return res.end(sdkGuest.html)}
  if(req.url==='/bundle.js'){res.setHeader('Content-Type','text/javascript');return res.end(bundle.outputFiles[0].text)}
  if(req.url==='/test/bootstrap'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(staleBootstrap?{ok:true,studioUrl:base+'/player'}:{ok:true,...guestBuild,document:guestDocument}))}
  if(req.url==='/test/tool'&&req.method==='OPTIONS'){res.writeHead(403);return res.end()}
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
 const browserRequests=[];let workletsLoaded=false;
 page.on('console',message=>{if(message.text().includes('AudioWorklets loaded'))workletsLoaded=true});
 await page.addInitScript(()=>{window.__poptartCspErrors=[];addEventListener('securitypolicyviolation',event=>window.__poptartCspErrors.push(event.violatedDirective))});
 await page.route(base+'/**',route=>route.abort()); // remote browser cannot reach the host-only sidecar
 page.on('request',request=>{if(/^https?:/.test(request.url()))browserRequests.push(request.url())});
 const issues=[];page.on('pageerror',e=>{issues.push(e.message);console.error('Guest page error:',e.message)});
 await page.goto(`http://127.0.0.1:${host.address().port}`);
 const shell=page.frameLocator('iframe[title="Poptart Strudel Studio"]');
 const player=shell.frameLocator('iframe[title="Preview content"]');
 await player.getByText('SESSION READY').waitFor();
 const paneUrl=await page.locator('iframe').first().getAttribute('src');
 assert.equal(paneUrl,'/assets/webapp-guest.html');
 assert.ok(!paneUrl.includes(base), 'pane must never navigate to the sidecar');
 assert.equal(await page.locator('iframe').first().getAttribute('sandbox'),'allow-scripts');
 assert.equal(await page.locator('iframe').first().getAttribute('referrerpolicy'),'no-referrer');
 await player.getByRole('button',{name:'New track',exact:true}).click();
 await player.getByLabel('Track title').waitFor();
 const code=player.getByLabel('Pattern code');
 await code.fill('s("bd*4")');
 const audio=player.frameLocator('iframe[title="Isolated audio controls"]');
 await audio.getByRole('button',{name:'Play',exact:true}).click();
 await audio.getByRole('status').getByText('Playing',{exact:true}).waitFor({timeout:15000});
 const af=await (await player.locator('iframe[title="Isolated audio controls"]').elementHandle()).contentFrame();
 const measure=async()=>af.evaluate(async()=>{const a=window.__studioAnalyser;if(!a)return -1;let peak=0;for(let i=0;i<30;i++){const d=new Float32Array(a.fftSize);a.getFloatTimeDomainData(d);peak=Math.max(peak,...d.map(Math.abs));await new Promise(r=>setTimeout(r,50))}return peak});
 const peak=await measure();assert.ok(peak>0.00001,`nonzero sample output required: ${peak}`);
 // Neither the nested execution frame nor malformed editor envelopes get a host capability.
 const beforeHostile=(await tool('list',{})).data.length;
 const pf=await (await player.locator('body').elementHandle()).ownerFrame();
 await pf.evaluate(()=>{const cap=window.__POPTART_HOST__.capability;for(const [version,capability] of [[2,cap],[1,'wrong']])parent.postMessage({version,capability,id:'forged',type:'tool.request',payload:{operation:'track.create',input:{title:'forged',code:'silence',tempo:120,sections:[]}}},'*')});
 await af.evaluate(()=>parent.parent.postMessage({version:1,id:'nested',type:'tool.request',payload:{operation:'track.create',input:{}}},'*'));
 await page.waitForTimeout(150);
 assert.equal((await tool('list',{})).data.length,beforeHostile);
 const denied=await af.evaluate(async url=>{try{return (await fetch(url+'/test/tool',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status}catch{return 'blocked'}},`http://127.0.0.1:${host.address().port}`);
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
 await audio.getByRole('button',{name:'Stop',exact:true}).click();
 await audio.getByRole('status').getByText('Stopped',{exact:true}).waitFor();
 await page.waitForTimeout(1000);
 // Verify a synth in the same independently opaque data-document realm.
 await code.fill('note("c4*4").s("sine").gain(0.2)');
 await audio.getByRole('button',{name:'Play',exact:true}).click();
 await audio.getByRole('status').getByText('Playing',{exact:true}).waitFor();
 await page.waitForTimeout(500);
 const synthPeak=await measure();assert.ok(synthPeak>0.00001);
 await code.fill('this is not valid $$$');
 // Dirty edits must survive poll notifications.
 const list=await tool('list',{});const track=list.data[0];
 await tool('update',{trackId:track.id,expectedRevision:track.revision,changes:{title:'external edit'}});
 await player.getByText(/track changed elsewhere/).waitFor({timeout:7000});
 assert.equal(await code.inputValue(),'this is not valid $$$');
 await page.getByRole('button',{name:'Reload studio (stops audio)'}).click();
 await player.getByText('SESSION READY').waitFor();
 assert.ok(af.isDetached(),'Reload must destroy old audio realm');
 const cspViolations=(await Promise.all(page.frames().map(frame=>frame.evaluate(()=>window.__poptartCspErrors||[])))).flat();
 assert.deepEqual(cspViolations,[]);assert.ok(workletsLoaded,'bundled AudioWorklets must initialize under guest CSP');
 staleBootstrap=true;
 await page.getByRole('button',{name:'Reload studio (stops audio)'}).click();
 await page.getByRole('alert').getByText(/transport v2/).waitFor();
 assert.equal(await page.locator('iframe').count(),0,'old loopback bootstrap must be rejected');
 assert.equal(await page.getByRole('alert').evaluate(el=>getComputedStyle(el.parentElement).colorScheme),'dark');
 assert.ok(browserRequests.every(url=>new URL(url).origin===`http://127.0.0.1:${host.address().port}`),'all browser HTTP requests must use the Hermes host origin');
 assert.ok(!browserRequests.some(url=>url.startsWith(base)), 'browser must never request the sidecar');
 console.log(JSON.stringify({hermesOriginDocument:true,sidecarUnreachableFromBrowser:true,staleLoopbackBootstrapRejected:true,darkFailureState:true,workletsLoaded,cspViolations,synthPeak,productionAssets:true,samplePeak:peak,mutedPeak,hiddenPeak,afterInvalidPeak:afterInvalid,opaqueNoReferrerHandshake:true,userGestureSamplePlayback:true,invalidEditError:true,dirtyPollPreserved:true,reloadReconnected:true,opaqueApiDenied:denied,hostileMessagesIgnored:true,pageErrors:issues}));
 assert.deepEqual(issues,[]);
} finally {await browser?.close();await new Promise(r=>host.close(r));await new Promise(r=>service.close(r));await rm(temp,{recursive:true,force:true})}
