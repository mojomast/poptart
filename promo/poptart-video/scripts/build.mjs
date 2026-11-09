import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {root,settings,scenes,command,read} from './common.mjs';
process.chdir(root);
await import('./inputs.mjs');
assert.equal(read('inputs/complex-demo.json').tempo,settings.bpm);
command('python3',['scripts/media.py']);
if(!fs.existsSync('.cache/native/manifest.json'))command(process.execPath,['scripts/capture.mjs']);
fs.mkdirSync('.build/compositions',{recursive:true});
fs.mkdirSync('.build/assets',{recursive:true});
fs.cpSync('assets','.build/assets',{recursive:true});
for(const file of ['hermes-webapp.png','banner.png'])fs.copyFileSync(`inputs/${file}`,`.build/assets/${file}`);
for(const file of ['master.wav','grain.png','asterisk.svg'])fs.copyFileSync(`.cache/${file}`,`.build/assets/${file}`);
// Relative symlinks reuse only our own cache; do not duplicate thousands of frames.
for(const name of ['source-frames','native']){
  const dest=`.build/assets/${name}`;
  if(!fs.existsSync(dest))fs.symlinkSync(`../../.cache/${name}`,dest,'dir');
}
const plan=scenes();fs.writeFileSync('.cache/edit.json',JSON.stringify(plan,null,2));
await build({entryPoints:['shared/runtime.js'],bundle:true,format:'iife',globalName:'PoptartScore',outfile:'.build/runtime.js',target:'chrome120'});
const hosts=plan.map((s,i)=>{
  const id=`score-${i+1}`;
  fs.writeFileSync(`.build/compositions/${s.id}.html`,`<template><section id="${id}" class="score-scene" data-composition-id="${id}" data-width="1920" data-height="1080" data-duration="${s.duration}" data-no-timeline><canvas class="score-canvas" width="1920" height="1080" aria-label="${s.id}" data-layout-ignore></canvas></section><script>PoptartScore.mount(${i});</script></template>`);
  return `<div id="host-${i+1}" class="clip score-host" data-composition-id="${id}" data-composition-src="compositions/${s.id}.html" data-start="${s.start}" data-duration="${s.duration}" data-track-index="1" data-no-timeline></div>`;
}).join('\n');
fs.writeFileSync('.build/index.html',fs.readFileSync('index.html','utf8').replace('<!-- SCENES -->',hosts));
fs.copyFileSync('style.css','.build/style.css');
for(const dir of ['out','previews'])fs.mkdirSync(dir,{recursive:true});
console.log('Built SCORE SHEET / 21 bars / 126 BPM / 2400 frames / 8 scenes.');
