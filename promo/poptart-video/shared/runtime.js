import settings from '../settings.json';
import copy from '../copy.json';
import audio from '../.cache/audio-data.json';
import native from '../.cache/native/manifest.json';
import plan from '../.cache/edit.json';
import {rect,chrome,p} from './draw.js';
import * as s1 from '../scenes/01-score.js';
import * as s2 from '../scenes/02-hermes.js';
import * as s3 from '../scenes/03-operations.js';
import * as s4 from '../scenes/04-highlights.js';
import * as s5 from '../scenes/05-continuation.js';
import * as s6 from '../scenes/06-library.js';
import * as s7 from '../scenes/07-drop.js';
import * as s8 from '../scenes/08-release.js';
const scenes=[s1,s2,s3,s4,s5,s6,s7,s8],cache=new Map(),images={};
const url=p=>window.__hyperframes?.assetUrl?window.__hyperframes.assetUrl(p):p;
async function load(path){
  if(cache.has(path))return cache.get(path);
  const ready=new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error(`Image missing: ${path}`));im.src=url(path);});cache.set(path,ready);
  if(cache.size>28)for(const key of cache.keys())if(key.includes('/code-')||key.includes('source-frames')){cache.delete(key);if(cache.size<=20)break;}
  return ready;
}
let ready;
function initialize(){return ready??=Promise.all([
  document.fonts.load('900 160px ScoreGrotesk'),document.fonts.load('500 30px ScoreMono'),
  ...Object.entries({hero:'hermes-webapp.png',grain:'grain.png',error:'native/error.png',revision1:'native/revision-1.png',revision2:'native/revision-2.png',revision3:'native/revision-3.png'}).map(async([key,path])=>{images[key]=await load('assets/'+path);})
]);}
const mounts={};
export function mount(index){
  const element=document.getElementById(`host-${index+1}`),canvas=element.querySelector('canvas');
  const g=canvas.getContext('2d',{alpha:false}),env={settings,copy,audio,images};
  async function render(local,signal){
    await initialize();if(signal?.aborted)return;
    const frame=Math.max(plan[index].startFrame,Math.min(plan[index].endFrame-1,Math.round((plan[index].start+local)*60)));
    const time=frame/60;env.time=time;
    if(index===2)env.source=await load(`assets/source-frames/${String(frame+1).padStart(5,'0')}.jpg`);
    if(index===3||index===6){const file=native.frames[frame];if(!file)throw new Error(`Native frame ${frame} absent`);env.native=await load(`assets/native/${file}`);env.tokenBoxes=native.tokenBoxes[file];}
    if(signal?.aborted)return;
    g.save();g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';rect(g,0,0,1920,1080,p.ink);
    chrome(g,time,env);scenes[index].draw(g,time-plan[index].start,env);
    g.globalAlpha=settings.grainOpacity;g.fillStyle=g.createPattern(images.grain,'repeat');g.fillRect(0,0,1920,1080);g.restore();
  }
  mounts[index]={render,canvas};
  window.__hyperframes.registerFrameSource({element,ready:initialize(),render,dispose:()=>{}});
}
export const test={mounts,plan,settings};
