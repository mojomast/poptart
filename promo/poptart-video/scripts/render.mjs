import fs from 'node:fs';
import {root,command,settings} from './common.mjs';
process.chdir(root);let lock;
try{lock=fs.openSync('.cache/render.lock','wx');}catch{throw new Error('This project already has a render lock. Confirm its owner has stopped before removing it.');}
try{
  fs.writeFileSync(lock,String(process.pid));
  const allowed=fs.readFileSync('/proc/self/status','utf8').match(/^Cpus_allowed_list:\s*(.+)$/m)[1];
  const cpus=allowed.split(',').flatMap(part=>{const [lo,hi=lo]=part.split('-').map(Number);return Array.from({length:hi-lo+1},(_,i)=>lo+i);}).slice(0,2).join(',');
  // HyperFrames derives its encoder -threads from availableParallelism().
  // Two-core affinity therefore caps its internal FFmpeg encoders as well.
  command('taskset',['-c',cpus,'npx','hyperframes','render','.build','--fps','60','--quality','draft','--workers','2','--output','out/poptart-master-next.mp4']);
  command('ffmpeg',['-y','-hide_banner','-nostdin','-threads','2','-filter_threads','2','-i','out/poptart-master-next.mp4','-vf','scale=1280:720:flags=lanczos','-c:v','libx264','-preset','medium','-crf','21','-maxrate','3500k','-bufsize','7000k','-pix_fmt','yuv420p','-threads','2','-c:a','aac','-b:a','192k','-movflags','+faststart','out/poptart-preview-next.mp4']);
  if(fs.statSync('out/poptart-preview-next.mp4').size>settings.previewMaxBytes)throw new Error('720p preview exceeds 25MB');
  // Keep existing review links playable until both new encodes are complete.
  fs.renameSync('out/poptart-master-next.mp4','out/poptart-master.mp4');
  fs.renameSync('out/poptart-preview-next.mp4','previews/poptart-preview-720p.mp4');
}finally{fs.closeSync(lock);fs.unlinkSync('.cache/render.lock');}
