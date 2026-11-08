import {cp, mkdir, rm, writeFile, readdir} from 'node:fs/promises';
const installed = new URL('../integration/hermes/',import.meta.url);
const check = process.argv.includes('--check');
const {pathToFileURL} = await import('node:url');
const {mkdtemp: makeTemp} = await import('node:fs/promises');
const {tmpdir: systemTemp} = await import('node:os');
const root = check ? pathToFileURL((await makeTemp(systemTemp()+'/poptart-check-'))+'/') : installed;
for (const name of ['service','skills']) await rm(new URL(name,root),{recursive:true,force:true});
await mkdir(root,{recursive:true});
for (const [src,dst] of [['server','service'],['skills','skills']]) await cp(new URL('../'+src,import.meta.url),new URL(dst,root),{recursive:true,filter:path=>!path.endsWith('.test.js')});
for (const name of ['LICENSE','NOTICE','THIRD_PARTY_LICENSES.md']) await cp(new URL('../'+name,import.meta.url),new URL(name,root));
// Only the authenticated, self-contained guest is shipped; standalone dist/
// (including binary WAV files) is not needed by the Hermes sidecar.

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
  for (const view of ['player','audio']) await build({entryPoints:[`src/hermes-${view}.tsx`],bundle:true,jsx:'automatic',format:'iife',platform:'browser',minify:true,charset:'ascii',legalComments:'inline',define:{'process.env.NODE_ENV':'"production"'},outfile:join(temporary,view+'.js')});
  const samples = Object.fromEntries(await Promise.all(['bd','sd','hh'].map(async name=>[name,'data:audio/wav;base64,'+(await readFile(new URL('../public/samples/'+name+'.wav',import.meta.url))).toString('base64')])));
  const escapeScript = value => value.replace(/<\/script/gi,'<\\/script');
  const page = (view,js,config,css='') => '<!doctype html><html class="hermes-dark"><head><meta charset="utf-8"><meta name="poptart-guest" content="hermes-origin-v2"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{margin:0;min-height:100%;background:var(--studio-bg,#17171b);color:var(--studio-text,#eee);color-scheme:inherit}'+css.replace(/<\/style/gi,'<\\/style')+'</style></head><body><div id="root"></div><script>window.__POPTART_GUEST__='+escapeScript(JSON.stringify(config))+';</script><script>'+escapeScript(js)+'</script></body></html>';
  const audio = page('audio',await readFile(join(temporary,'audio.js'),'utf8'),{samples});
  const document = page('player',await readFile(join(temporary,'player.js'),'utf8'),{audioHtml:audio},await readFile(join(temporary,'player.css'),'utf8'));
  await writeFile(new URL('guest-document.html',root),document);
  await writeFile(new URL('guest-build.json',root),JSON.stringify({transport:'hermes-origin-v2',sha256:createHash('sha256').update(document).digest('hex')}));
  console.log(`Hermes-origin guest document: ${Buffer.byteLength(document)} bytes (no network asset imports)`);
} finally { await rm(temporary,{recursive:true,force:true}); }

// Compare bytes in a temporary tree: check mode never rewrites committed files.
if (check) {
  async function files(url, prefix='') {
    const result=[];
    for (const entry of await readdir(url,{withFileTypes:true})) {
      if (entry.isDirectory()) result.push(...await files(new URL(entry.name+'/',url),prefix+entry.name+'/'));
      else result.push(prefix+entry.name);
    }
    return result.sort();
  }
  try {
    const expected=await files(root);
    const actual=(await files(installed)).filter(name => ['service/','skills/'].some(p=>name.startsWith(p)) || ['LICENSE','NOTICE','THIRD_PARTY_LICENSES.md','guest-document.html','guest-build.json'].includes(name)).filter(name=>!name.includes('__pycache__/'));
    if (JSON.stringify(expected)!==JSON.stringify(actual)) throw Error('Packaged file list differs; run npm run build');
    for (const name of expected) {
      if (!(await readFile(new URL(name,root))).equals(await readFile(new URL(name,installed)))) throw Error('Stale packaged file: '+name+'; run npm run build');
    }
    console.log(`Committed package matches source (${expected.length} files)`);
  } finally { await rm(root,{recursive:true,force:true}); }
} else console.log('Packaged self-contained integration/hermes; commit regenerated files with source changes');
