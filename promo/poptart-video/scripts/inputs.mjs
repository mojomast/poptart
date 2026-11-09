import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {root,repo,settings,command} from './common.mjs';
fs.mkdirSync(path.join(root,'inputs'),{recursive:true});
const files=['complex-demo-packaged.mp4','complex-demo.json','highlights-v024.png','highlights-standalone-v024.png'];
if(files.some(f=>!fs.existsSync(path.join(root,'inputs',f)))){
  try{command('git',['cat-file','-e',`${settings.sourceCommit}^{commit}`],{cwd:repo,stdio:'pipe'});}
  catch{command('git',['fetch','origin','promo/poptart-video-input'],{cwd:repo});}
}
for(const f of files) {
  const dest=path.join(root,'inputs',f);
  if(!fs.existsSync(dest))fs.writeFileSync(dest,command('git',['show',`${settings.sourceCommit}:promo/poptart-video-input/${f}`],{cwd:repo,stdio:'pipe',maxBuffer:40e6}));
}
for(const f of ['banner.png','hermes-webapp.png'])fs.copyFileSync(path.join(repo,'docs/assets',f),path.join(root,'inputs',f));
const hashes=Object.fromEntries([...files,'banner.png','hermes-webapp.png'].map(f=>[f,createHash('sha256').update(fs.readFileSync(path.join(root,'inputs',f))).digest('hex')]));
fs.writeFileSync(path.join(root,'inputs/hashes.json'),JSON.stringify(hashes,null,2));
console.log('Original input branch assets resolved; SHA-256 inventory written.');
