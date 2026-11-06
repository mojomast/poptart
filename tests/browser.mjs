import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const serviceToken=await readFile(process.env.POPTART_TOKEN_FILE || '.workspace/service.token','utf8');

// Start service and Vite separately as described in README; use a disposable workspace.
const url=process.env.STUDIO_URL || 'http://127.0.0.1:5173/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 const page=await browser.newPage();
 await page.addInitScript(() => {
   const original=AudioNode.prototype.connect;
   AudioNode.prototype.connect=function(destination,...rest){
     if(destination instanceof AudioDestinationNode && !window.__studioAnalyser){
       const analyser=this.context.createAnalyser(); original.call(this,analyser); window.__studioAnalyser=analyser;
     }
     return original.call(this,destination,...rest);
   };
 });
 await page.goto(url); const player=page.frameLocator('iframe[title="Poptart music editor"]');
 await player.getByRole('button',{name:'New track',exact:true}).first().click();
 const listed=await (await fetch((process.env.SERVICE_URL || 'http://127.0.0.1:4311')+'/api/tool',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+serviceToken},body:JSON.stringify({operation:'track.list',input:{}})})).json();
 const track=listed.data.at(-1); assert.ok(track?.id);
 await page.getByLabel('OPERATION').fill('track.update');
 await page.getByLabel('INPUT JSON').fill(JSON.stringify({trackId:track.id,expectedRevision:track.revision,changes:{title:'Agent changed title'}}));
 await page.getByRole('button',{name:/Run command/}).click();
 await player.getByLabel('Track title').waitFor();
 await page.waitForFunction(() => document.querySelector('iframe') !== null);
 await player.getByLabel('Track title').waitFor({state:'visible'});
 await page.waitForTimeout(300);
 assert.equal(await player.getByLabel('Track title').inputValue(),'Agent changed title');
 const editor=player.getByLabel('Pattern code'); await editor.fill('s("bd*4")');
 const audio=player.frameLocator('iframe[title="Isolated audio controls"]');
 await audio.getByRole('button',{name:'Play',exact:true}).click();
 await audio.getByRole('status').getByText('Playing').waitFor({timeout:15000});
 const af=page.frames().find(f=>f.url().includes('/audio')); assert.ok(af);
 const peak=await af.evaluate(async()=>{
   const analyser=window.__studioAnalyser; if(!analyser) return -1;
   let max=0; for(let i=0;i<30;i++){const d=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(d);max=Math.max(max,...d.map(Math.abs));await new Promise(r=>setTimeout(r,50));}return max;
 });
 assert.ok(peak>0.00001,`expected nonzero sample audio, got ${peak}`);
 const denied=await af.evaluate(async()=>{try {const r=await fetch('/api/tool',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'track.list',input:{}})});return r.status;} catch {return 'blocked';}});
 assert.ok(denied === 403 || denied === 'blocked');
 await editor.fill('s("bd*4)'); await audio.getByRole('button',{name:'Play',exact:true}).click();
 await audio.getByRole('alert').getByText(/Unterminated string/).waitFor({timeout:10000});
 await audio.getByRole('status').getByText('Playing',{exact:true}).waitFor();
 await page.waitForTimeout(3000);
 const afterError = await af.evaluate(async()=>{const a=window.__studioAnalyser;let max=0;for(let i=0;i<20;i++){const d=new Float32Array(a.fftSize);a.getFloatTimeDomainData(d);max=Math.max(max,...d.map(Math.abs));await new Promise(r=>setTimeout(r,50));}return max});
 assert.ok(afterError>0.00001,`last pattern should keep producing audio after an invalid edit: ${afterError}`);
 await audio.getByRole('button',{name:'Stop',exact:true}).click();
 await audio.getByText('Stopped').waitFor();
 await page.getByRole('button',{name:/Reload/}).click();
 await page.getByText('Connected',{exact:true}).waitFor({timeout:10000});
 console.log(JSON.stringify({browser:browser.version(),samplePeak:peak,afterInvalidPeak:afterError,opaqueApiStatus:denied,invalidEdit:'error displayed',reload:'connected'}));
} finally {await browser.close();}
