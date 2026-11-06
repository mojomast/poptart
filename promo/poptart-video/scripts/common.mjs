import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const repo=path.resolve(root,'../..');
export const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
export const settings=read('settings.json');
export function command(bin,args,opts={}) {return execFileSync(bin,args,{cwd:root,stdio:'inherit',...opts});}
export function chrome(dir=path.join(os.homedir(),'.cache/hyperframes/chrome')) {
  for(const f of fs.readdirSync(dir,{withFileTypes:true})) {
    const p=path.join(dir,f.name);if(f.isFile()&&f.name==='chrome-headless-shell')return p;
    if(f.isDirectory()){const found=chrome(p);if(found)return found;}
  }
}
export function scenes() {
  let beat=0;return settings.scenes.map(s=>{
    const startBeat=beat;beat+=s.bars*4;
    return {...s,startBeat,endBeat:beat,startFrame:Math.round(startBeat*60/settings.bpm*60),endFrame:Math.round(beat*60/settings.bpm*60)};
  }).map(s=>({...s,start:s.startFrame/60,end:s.endFrame/60,duration:(s.endFrame-s.startFrame)/60}));
}
