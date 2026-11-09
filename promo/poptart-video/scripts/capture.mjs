// Capture the unmodified v024 UI at DSF=3. The isolated harness controls only
// the native Drawer clock for deterministic replay; it never paints UI/tokens.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {build} from 'esbuild';
import puppeteer from 'puppeteer-core';
import {root,repo,settings,chrome} from './common.mjs';
import {createApp} from '../../../server/index.js';
await import('./inputs.mjs');
const dest=path.join(root,'.cache/native');fs.mkdirSync(dest,{recursive:true});
const track=JSON.parse(fs.readFileSync(path.join(root,'inputs/complex-demo.json')));
const token=randomBytes(32).toString('hex');
const store=path.join(root,'.cache/capture-store.json');
if(fs.existsSync(store))fs.unlinkSync(store);
const service=createApp({file:store,token});await new Promise(r=>service.listen(0,'127.0.0.1',r));
const tool=async(operation,input={})=>(await fetch(`http://127.0.0.1:${service.address().port}/api/tool`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({operation,input})})).json();
const created=await tool('track.create',track);assert.ok(created.ok,JSON.stringify(created));
const bundle=async(contents)=>(await build({stdin:{contents,resolveDir:repo,loader:'tsx'},bundle:true,format:'iife',write:false,logLevel:'silent',define:{'process.env.NODE_ENV':'"production"'}})).outputFiles[0].text;
const audioJS=await bundle(`import React from 'react';import{createRoot}from'react-dom/client';import{Audio}from'./src/Audio';import{engine}from'./src/engine';window.__captureEngine=engine;createRoot(document.getElementById('root')).render(<Audio/>);`);
const playerJS=await bundle(`import React from 'react';import{createRoot}from'react-dom/client';import{Player}from'./src/Player';createRoot(document.getElementById('root')).render(<Player/>);`);
const samples=Object.fromEntries(['bd','sd','hh'].map(n=>[n,`data:audio/wav;base64,${fs.readFileSync(path.join(repo,`public/samples/${n}.wav`)).toString('base64')}`]));
const wrap=(config,js,css='')=>`<!doctype html><html><head><style>html,body{margin:0} ${css}</style></head><body><div id="root"></div><script>${config}</script><script>${js.replaceAll('</script','<\\/script')}</script></body></html>`;
const audioHTML=wrap(`window.__POPTART_GUEST__=${JSON.stringify({samples})}`,audioJS);
const safeJSON=value=>JSON.stringify(value).replaceAll('<','\\u003c');
const playerHTML=wrap(`window.__POPTART_HOST__={capability:'capture-local',parent:'null',opaqueRelay:true};window.__POPTART_GUEST__=${safeJSON({audioHtml:audioHTML})}`,playerJS,fs.readFileSync(path.join(repo,'src/studio.css'),'utf8'));
const hostHTML=`<!doctype html><html><body style="margin:0"><iframe title="Studio" sandbox="allow-scripts" style="border:0;width:100vw;height:100vh"></iframe><script>const f=document.querySelector('iframe');f.srcdoc=${safeJSON(playerHTML)};addEventListener('message',async e=>{if(e.source!==f.contentWindow)return;const m=e.data;if(m.type==='ready')f.contentWindow.postMessage({version:1,id:'init',type:'init',capability:'capture-local',payload:{expanded:true}},'*');if(m.type==='tool.request'){const r=await fetch('/tool',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(m.payload)});f.contentWindow.postMessage({version:1,id:m.id,type:'tool.result',capability:'capture-local',payload:await r.json()},'*')}})</script></body></html>`;
const host=http.createServer(async(req,res)=>{if(req.url==='/tool'){const chunks=[];for await(const c of req)chunks.push(c);const {operation,input}=JSON.parse(Buffer.concat(chunks));res.setHeader('content-type','application/json');return res.end(JSON.stringify(await tool(operation,input)));}res.setHeader('content-type','text/html');res.end(hostHTML.replaceAll("parent:'null'",`parent:'http://127.0.0.1:${host.address().port}'`));});
await new Promise(r=>host.listen(0,'127.0.0.1',r));
const browser=await puppeteer.launch({executablePath:chrome(),headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--disable-dev-shm-usage']});
try {
  const page=await browser.newPage();await page.setViewport({width:1280,height:900,deviceScaleFactor:3});
  page.on('pageerror',e=>console.error(e.message));
  await page.goto(`http://127.0.0.1:${host.address().port}`,{waitUntil:'networkidle0'});
  const player=page.frames().find(f=>f.parentFrame()===page.mainFrame());
  await player.waitForSelector('.track-item');await player.click('.track-item');await player.waitForSelector('textarea');
  const audio=await(await player.$('iframe')).contentFrame();await audio.waitForSelector('button[aria-label="Play"]');
  await audio.click('button[aria-label="Play"]');await audio.waitForFunction(()=>window.__captureEngine.getState().playing);
  await player.waitForSelector('.mini-highlight');
  await page.screenshot({path:path.join(dest,'full.png')});
  await audio.evaluate(async()=>{const e=window.__captureEngine;e.drawer.stop();await e.mod.getAudioContext().suspend();});
  const code=await player.$('.code-content');const box=await code.boundingBox();
  // Capture code, real native marks, and just enough context. Source pixels stay 3x.
  const clip={x:box.x,y:box.y,width:Math.min(box.width,1010),height:Math.min(box.height,370)};
  const manifest={productCommit:settings.productCommit,deviceScaleFactor:3,viewport:[1280,900],clip,frames:{},tokenBoxes:{},method:'Native Drawer replay of evaluated source; original React DOM/CSS; no painted overlays',source:track.code};
  const files=new Map();
  const intervals=[[Math.round(32*60/126*60),Math.round(48*60/126*60)],[Math.round(68*60/126*60),Math.round(74*60/126*60)]];
  for(const [first,last] of intervals)for(let frame=first;frame<last;frame++) {
    // Main is applied on cycle 6 without resetting the scheduler. Spectral
    // verification gives C/G/A/F at source 13.039s onward, not A/F/C/G.
    // The selected source downbeat 1.610524s is cycle 0 (A minor).
    const phase=frame/60*126/240;
    await audio.evaluate(p=>{const e=window.__captureEngine;const d=e.drawer;d.scheduler={pattern:e.repl.state.pattern,now:()=>p};d.visibleHaps=e.repl.state.pattern.queryArc(Math.max(0,p-8),p+.001);d.lastFrame=p-.09;d.framer.onFrame();},phase);
    // A round trip flushes the real postMessage → PatternEditor text-node marks.
    await player.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const signature=await player.$$eval('.mini-highlight',els=>els.map(e=>`${e.dataset.start}:${e.dataset.end}`).join(','));
    assert.ok(signature,'native highlight ranges missing');
    const key=createHash('sha256').update(signature).digest('hex').slice(0,16);
    if(!files.has(key)){
      await page.screenshot({path:path.join(dest,`code-${key}.png`),clip});
      manifest.tokenBoxes[`code-${key}.png`]=await player.$$eval('.mini-highlight',(els,clip)=>els.map(el=>{const r=el.getBoundingClientRect();return{x:(r.x-clip.x)*3,y:(r.y-clip.y)*3,width:r.width*3,height:r.height*3};}),clip);
      files.set(key,true);
    }
    manifest.frames[frame]=`code-${key}.png`;
  }
  // Actual invalid edit: the real engine rejects it and retains the Pattern.
  const before=await audio.evaluate(()=>window.__captureEngine.getState().lastGoodCode);
  await player.$eval('textarea',(el,code)=>{const set=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;set.call(el,code+'\n)');el.dispatchEvent(new Event('input',{bubbles:true}));},track.code);
  await audio.click('button[aria-label="Play"]');await audio.waitForSelector('[role="alert"]');
  const invalid=await audio.evaluate(()=>{const e=window.__captureEngine;return{state:e.getState(),message:document.querySelector('[role="alert"]').textContent};});
  assert.equal(invalid.state.lastGoodCode,before);assert.equal(invalid.state.playing,true);
  const continuingAudio=await audio.evaluate(async()=>{
    const e=window.__captureEngine,a=e.mod.getAudioContext().createAnalyser();
    e.mod.getSuperdoughAudioController().output.destinationGain.connect(a);
    await new Promise(r=>setTimeout(r,2200));const peaks=[];
    for(let window=0;window<2;window++){let peak=0;for(let j=0;j<16;j++){const data=new Float32Array(a.fftSize);a.getFloatTimeDomainData(data);for(const x of data)peak=Math.max(peak,Math.abs(x));await new Promise(r=>setTimeout(r,40));}peaks.push(peak);}
    a.disconnect();return peaks;
  });
  assert.ok(continuingAudio.every(p=>p>.001),'Audio must continue beyond existing sample tails');
  await page.screenshot({path:path.join(dest,'error.png')});
  manifest.invalidEdit={playing:invalid.state.playing,lastGoodUnchanged:true,message:invalid.message,continuingAudioPeaks:continuingAudio};
  // Restore matching source; save genuine revisions through normal UI controls.
  await player.$eval('textarea',(el,code)=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,code);el.dispatchEvent(new Event('input',{bubbles:true}));},track.code);
  await audio.click('button[aria-label="Play"]');await audio.waitForFunction(()=>!window.__captureEngine.getState().error);
  manifest.revisions=[];
  for(let i=0;i<3;i++) {
    await player.$eval('textarea',(el,code)=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,code);el.dispatchEvent(new Event('input',{bubbles:true}));},track.code+'\n'+' '.repeat(i+1));
    await player.click('.save-button');await player.waitForFunction(()=>document.querySelector('.save-button')?.textContent.includes('Saved'));
    const label=await player.$eval('.track-meta',el=>el.textContent);manifest.revisions.push(label);
    await page.screenshot({path:path.join(dest,`revision-${i+1}.png`)});
  }
  manifest.uniqueCodeFrames=files.size;
  fs.writeFileSync(path.join(dest,'manifest.json'),JSON.stringify(manifest,null,2));
  const used=new Set(Object.values(manifest.frames));
  for(const file of fs.readdirSync(dest))if(/^code-[a-f0-9]+\.png$/.test(file)&&!used.has(file))fs.unlinkSync(path.join(dest,file));
  console.log(`Native capture complete: ${files.size} unique code states, ${Object.keys(manifest.frames).length} 60fps mappings, real error and three real revision saves.`);
} finally {await browser.close();host.close();service.close();}
