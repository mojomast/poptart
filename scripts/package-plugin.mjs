import {cp, mkdir, rm, writeFile} from 'node:fs/promises';
const root = new URL('../integration/hermes/',import.meta.url);
for (const name of ['assets','service','skills']) await rm(new URL(name,root),{recursive:true,force:true});
await mkdir(root,{recursive:true});
for (const [src,dst] of [['dist','assets'],['server','service'],['skills','skills']]) await cp(new URL('../'+src,import.meta.url),new URL(dst,root),{recursive:true,filter:path=>!path.endsWith('.test.js')});
for (const name of ['LICENSE','NOTICE','THIRD_PARTY_LICENSES.md']) await cp(new URL('../'+name,import.meta.url),new URL(name,root));
console.log('Packaged integration/hermes (generated assets/service/skills; run build before installation)');

// SDK SandboxedFrame data documents are delivered over authenticated ctx.rest.
// Bundle both opaque realms independently: no anonymous asset URL, host-local
// address, module imports or service credential is needed inside either guest.
const {build} = await import('esbuild');
const {readFile, mkdtemp} = await import('node:fs/promises');
const {tmpdir} = await import('node:os');
const {join} = await import('node:path');
const {createHash} = await import('node:crypto');
const temporary = await mkdtemp(join(tmpdir(),'poptart-bundle-'));
try {
  for (const view of ['player','audio']) await build({entryPoints:[`src/hermes-${view}.tsx`],bundle:true,jsx:'automatic',format:'iife',platform:'browser',minify:true,legalComments:'inline',define:{'process.env.NODE_ENV':'"production"'},outfile:join(temporary,view+'.js')});
  const samples = Object.fromEntries(await Promise.all(['bd','sd','hh'].map(async name=>[name,'data:audio/wav;base64,'+(await readFile(new URL('../public/samples/'+name+'.wav',import.meta.url))).toString('base64')])));
  const escapeScript = value => value.replace(/<\/script/gi,'<\\/script');
  const page = (view,js,config,css='') => '<!doctype html><html class="hermes-dark"><head><meta charset="utf-8"><meta name="poptart-guest" content="hermes-origin-v2"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{margin:0;min-height:100%;background:var(--studio-bg,#17171b);color:var(--studio-text,#eee);color-scheme:inherit}'+css.replace(/<\/style/gi,'<\\/style')+'</style></head><body><div id="root"></div><script>window.__POPTART_GUEST__='+escapeScript(JSON.stringify(config))+';</script><script>'+escapeScript(js)+'</script></body></html>';
  const audio = page('audio',await readFile(join(temporary,'audio.js'),'utf8'),{samples});
  const document = page('player',await readFile(join(temporary,'player.js'),'utf8'),{audioHtml:audio},await readFile(join(temporary,'player.css'),'utf8'));
  await writeFile(new URL('guest-document.html',root),document);
  await writeFile(new URL('guest-build.json',root),JSON.stringify({transport:'hermes-origin-v2',sha256:createHash('sha256').update(document).digest('hex')}));
  console.log(`Hermes-origin guest document: ${Buffer.byteLength(document)} bytes (no network asset imports)`);
} finally { await rm(temporary,{recursive:true,force:true}); }
