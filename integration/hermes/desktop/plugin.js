import { SandboxedFrame, useTheme } from '@hermes/plugin-sdk'
import { createElement as h, useEffect, useRef, useState } from 'react'

const mapping = {'track.list':'list','track.get':'get','track.create':'create','track.update':'update','snapshot.create':'snapshot','snapshot.list':'snapshots','snapshot.restore':'restore','list_sections':'sections','update_section':'update_section','analyze_track':'analyze','export_track':'export'}
const capability = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), n => n.toString(16).padStart(2,'0')).join('')

// useTheme is the documented read-only painted palette (including previews).
// SandboxedFrame has no automatic theme bridge in Hermes v0.22.7.
const colorKeys = ['background','foreground','card','muted','mutedForeground','primary','primaryForeground','secondary','secondaryForeground','border','input','ring','midground','destructive','sidebarBackground','sidebarBorder']
function themeSnapshot(appearance) {
  const theme = appearance?.theme
  const colors = Object.fromEntries(colorKeys.filter(key => typeof theme?.colors?.[key] === 'string').map(key => [key,theme.colors[key]]))
  const typography = Object.fromEntries(['fontSans','fontMono'].filter(key => typeof theme?.typography?.[key] === 'string').map(key => [key,theme.typography[key]]))
  return {version:1,scheme:appearance?.renderedMode || appearance?.resolvedMode || 'dark',colors,typography}
}
function Studio({ctx}) {
  const snapshot = themeSnapshot(useTheme())
  const themeKey = JSON.stringify(snapshot)
  const theme = useRef(snapshot); theme.current = snapshot
  const themeSender = useRef(null)
  const frame = useRef(null)
  const [url,setUrl] = useState('')
  const [error,setError] = useState('')
  const [generation,setGeneration] = useState(0)
  useEffect(() => {
    let closed = false, ready = false, outstanding = 0
    const cap = capability()
    const send = (type,payload,id=crypto.randomUUID()) => frame.current?.contentWindow?.postMessage({version:1,id,type,payload,capability:cap},'*')
    const receive = async event => {
      const m = event.data
      if (event.source !== frame.current?.contentWindow || event.origin !== 'null' || !m || m.version !== 1 || m.capability !== cap || typeof m.id !== 'string' || m.id.length > 128) return
      if (m.type === 'ready') { ready = true; send('init',{expanded:true,theme:theme.current}); return }
      if (!ready || m.type !== 'tool.request' || outstanding >= 8) return
      const p = m.payload
      if (!p || typeof p !== 'object' || Array.isArray(p) || Object.keys(p).some(k => !['operation','input'].includes(k)) || !Object.hasOwn(mapping,p.operation) || !p.input || typeof p.input !== 'object' || Array.isArray(p.input)) return
      if (JSON.stringify(p).length > 1048576) return
      outstanding++
      try {
        const result = await ctx.rest('/tool',{method:'POST',body:{op:mapping[p.operation],input:p.input},timeoutMs:15000})
        if (!closed) send('tool.result',result.ok ? {ok:true,data:result.data} : {ok:false,error:{code:result.code,message:result.error}},m.id)
      } catch { if (!closed) send('tool.result',{ok:false,error:{code:'BACKEND_UNAVAILABLE',message:'Enable the Python backend if desired; check its status.'}},m.id) }
      finally { outstanding-- }
    }
    themeSender.current = payload => { if (ready && !closed) send('theme',payload) }
    window.addEventListener('message',receive)
    ctx.rest('/bootstrap').then(result => {
      if (closed) return
      if (!result.ok) { setError(result.fix || 'Backend unavailable'); return }
      if (result.transport !== 'hermes-origin-v2' || typeof result.document !== 'string' || result.document.length > 6000000 || !result.document.includes('poptart-guest')) throw Error('Outdated backend: rescan Desktop plugins and retry')
      // ctx.rest authenticated the bundle request on the Hermes origin. The SDK
      // renders data HTML through its own same-origin /assets/webapp-guest.html
      // shell in Webapp; native Desktop renders the opaque data document directly.
      // SDK Webapp intentionally discards data-URL fragments; bind the guest in
      // its document instead. This is a frame capability, never a service token.
      const binding = JSON.stringify({capability:cap,parent:location.origin,opaqueRelay:true,theme:theme.current}).replace(/</g,'\\u003c')
      const html = result.document.replace('</head>','<script>window.__POPTART_HOST__='+binding+';</script></head>')
      setUrl('data:text/html;charset=utf-8,' + encodeURIComponent(html))
    }).catch(() => { if (!closed) setError('Studio assets unavailable. Rescan plugins and retry; backend transport v2 is required.') })
    const handshakeTimeout = setTimeout(() => { if (!closed && !ready) setError('Studio did not connect. Check the plugin backend and reload; no direct sidecar connection is used.') },20000)
    // Poll only while this pane is mounted, no overlaps; guest preserves dirty edits.
    const timer = setInterval(() => { if (ready && !closed && outstanding === 0) send('refresh',{}) },3000)
    return () => { closed = true; themeSender.current = null; clearInterval(timer); clearTimeout(handshakeTimeout); window.removeEventListener('message',receive) }
  },[ctx,generation])
  useEffect(() => { themeSender.current?.(theme.current) },[themeKey])
  return h('div',{style:{height:'100%',colorScheme:snapshot.scheme,background:snapshot.colors.background || '#17171b',color:snapshot.colors.foreground || '#eee'}},
    h('button',{style:{height:28,boxSizing:'border-box',margin:'2px 4px',padding:'4px 10px',border:'1px solid '+(snapshot.colors.border || '#41414b'),borderRadius:5,background:snapshot.colors.secondary || '#29292f',color:snapshot.colors.secondaryForeground || '#ececf0',fontFamily:snapshot.typography.fontSans || 'system-ui,sans-serif',fontSize:11,cursor:'pointer'},onClick:()=>{setUrl('');setError('');setGeneration(n=>n+1)}},'Reload studio (stops audio)'),
    error ? h('p',{role:'alert'},error) : url ? h(SandboxedFrame,{ref:frame,src:url,title:'Poptart Strudel Studio',sandbox:'allow-scripts',onError:()=>setError('Studio frame failed to load. Reload after checking the backend.'),style:{width:'100%',height:'calc(100% - 32px)',border:0,background:snapshot.colors.background || '#17171b',colorScheme:snapshot.scheme}}) : h('p',null,'Loading studio from Hermes…'))
}
export default {
  id:'hermes-strudel-studio',name:'Strudel Studio',defaultEnabled:false,
  register(ctx) {
    ctx.register({id:'pane',area:'panes',title:'Strudel Studio',data:{placement:'right',width:'760px'},render:()=>h(Studio,{ctx})})
  }
}
