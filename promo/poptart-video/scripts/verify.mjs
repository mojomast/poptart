import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {root,read,settings,scenes,command} from './common.mjs';
process.chdir(root);
const plan=scenes(),source=read('inputs/complex-demo.json'),native=read('.cache/native/manifest.json');
assert.equal(source.tempo,126);assert.equal(settings.bpm,source.tempo);
assert.equal(plan.length,8);assert.equal(plan.at(-1).endFrame,2400);
let maxError=0;
for(const s of plan){const error=Math.abs(s.start-s.startBeat*60/126);assert.ok(error<=1/60);maxError=Math.max(maxError,error);}
assert.ok(Math.abs((settings.sourceMainDownbeat-settings.audioSourceStart)/(240/126)-6)<1e-9);
for(const [file,hash] of Object.entries(read('inputs/hashes.json')))assert.equal(createHash('sha256').update(fs.readFileSync('inputs/'+file)).digest('hex'),hash);
assert.equal(fs.readdirSync('.cache/source-frames').filter(p=>p.endsWith('.jpg')).length,2400);
assert.equal(native.deviceScaleFactor,3);assert.ok(native.invalidEdit.playing&&native.invalidEdit.lastGoodUnchanged);
assert.ok(native.invalidEdit.continuingAudioPeaks.every(p=>p>.001));
assert.equal(JSON.parse(fs.readFileSync('../../shared/tool-schema.json')).parameters.properties.op.enum.length,11);
assert.deepEqual(native.revisions.map(v=>v.match(/REV (\d+)/)[1]),['2','3','4']);
for(const s of [plan[3],plan[6]])for(let f=s.startFrame;f<s.endFrame;f++)assert.ok(fs.existsSync('.cache/native/'+native.frames[f]),`native image ${f}`);
function bytes(dir){return fs.readdirSync(dir,{withFileTypes:true}).reduce((n,f)=>n+(f.isDirectory()?bytes(path.join(dir,f.name)):fs.lstatSync(path.join(dir,f.name)).isFile()?fs.statSync(path.join(dir,f.name)).size:0),0);}
assert.ok(bytes('.cache')<=settings.cacheMaxBytes);
const authored=['shared/runtime.js',...fs.readdirSync('scenes').map(n=>'scenes/'+n)];
for(const f of authored)assert.ok(!/Math\.random|Date\.now|setInterval|setTimeout|\bfetch\(/.test(fs.readFileSync(f,'utf8')),`non-deterministic render code ${f}`);
const report={bpm:126,bars:21,frames:2400,cutMaxErrorSeconds:maxError,sourceGridAnchor:settings.sourceMainDownbeat,nativeCodeStates:native.uniqueCodeFrames,cacheBytes:bytes('.cache'),media:[]};
// Internal beat edits: operation hits, code crop, error hit, revision stamps,
// montage cuts, asterisk entrance and its final rest. Check their actual frames.
const events=[[0,[0,1,2,3,4]],[2,[0,1,2,3,4]],[3,[8]],[4,[1]],[5,[0,4,8]],[6,[0,1,2,3,4]],[7,[6]]];
for(const [i,beats] of events)for(const b of beats){const actual=plan[i].startFrame+Math.ceil(b*60/126*60-1e-8);const ideal=(plan[i].startBeat+b)*60/126*60;assert.ok(Math.abs(actual-ideal)<=1,`off-grid event ${i}:${b}`);}
command('python3',['scripts/analyze-grid.py']);report.audioGrid=read('.cache/beat-evidence.json');
for(const [file,width,height] of [['out/poptart-master.mp4',1920,1080],['previews/poptart-preview-720p.mp4',1280,720]]){
  assert.ok(fs.existsSync(file),`Missing render ${file}`);
  const probe=JSON.parse(command('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{stdio:'pipe',encoding:'utf8'}));
  const v=probe.streams.find(s=>s.codec_type==='video');assert.equal(v.width,width);assert.equal(v.height,height);assert.equal(v.r_frame_rate,'60/1');assert.equal(+v.nb_frames,2400);assert.equal(+v.duration,40);
  assert.ok(probe.streams.some(s=>s.codec_type==='audio'));if(width===1280){assert.equal(v.codec_name,'h264');assert.ok(fs.statSync(file).size<=25000000);}
  const loud=spawnSync('ffmpeg',['-hide_banner','-nostdin','-threads','2','-filter_threads','2','-i',file,'-af','loudnorm=I=-14:TP=-1:LRA=11:print_format=json','-threads','2','-f','null','-'],{encoding:'utf8',maxBuffer:8e6});assert.equal(loud.status,0);
  const measured=JSON.parse(loud.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
  assert.ok(Math.abs(+measured.input_i+14)<=.6,`${file}: ${measured.input_i} LUFS`);assert.ok(+measured.input_tp<=-1,`${file}: ${measured.input_tp}dBTP`);
  command('ffmpeg',['-v','error','-threads','2','-i',file,'-threads','2','-f','null','-']);
  report.media.push({file,bytes:fs.statSync(file).size,lufs:+measured.input_i,truePeak:+measured.input_tp});
}
const stills=fs.readdirSync('previews/keyframes').filter(f=>f.endsWith('.png'));assert.equal(stills.length,8);
assert.equal(read('out/seek-check.json').exactPixelMatches,29);
fs.writeFileSync('out/verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
