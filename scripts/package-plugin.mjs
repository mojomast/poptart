import {cp, mkdir, rm, writeFile} from 'node:fs/promises';
const root = new URL('../integration/hermes/',import.meta.url);
for (const name of ['assets','service','skills']) await rm(new URL(name,root),{recursive:true,force:true});
await mkdir(root,{recursive:true});
for (const [src,dst] of [['dist','assets'],['server','service'],['skills','skills']]) await cp(new URL('../'+src,import.meta.url),new URL(dst,root),{recursive:true,filter:path=>!path.endsWith('.test.js')});
for (const name of ['LICENSE','NOTICE','THIRD_PARTY_LICENSES.md']) await cp(new URL('../'+name,import.meta.url),new URL(name,root));
console.log('Packaged integration/hermes (generated assets/service/skills; run build before installation)');
