import { SandboxedFrame } from '@hermes/plugin-sdk'
import { createElement as h, useEffect, useRef, useState } from 'react'

const mapping = {'track.list':'list','track.get':'get','track.create':'create','track.update':'update','snapshot.create':'snapshot','snapshot.list':'snapshots','snapshot.restore':'restore','list_sections':'sections','update_section':'update_section','analyze_track':'analyze','export_track':'export'}
const capability = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), n => n.toString(16).padStart(2,'0')).join('')

function Studio({ctx}) {
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
      if (m.type === 'ready') { ready = true; send('init',{expanded:true}); return }
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
    window.addEventListener('message',receive)
    ctx.rest('/bootstrap').then(result => {
      if (closed) return
      if (!result.ok) { setError(result.fix || 'Backend unavailable'); return }
      const target = new URL(result.studioUrl)
      if (target.protocol !== 'http:' || target.hostname !== '127.0.0.1' || target.pathname !== '/player') throw Error('Invalid local studio URL')
      target.searchParams.set('hermes','1')
      target.hash = new URLSearchParams({cap,parent:location.origin}).toString()
      setUrl(target.href)
    }).catch(() => { if (!closed) setError('Python backend unavailable. Enable it only if desired. Local Desktop is required; remote gateways are not supported.') })
    // Poll only while this pane is mounted, no overlaps; guest preserves dirty edits.
    const timer = setInterval(() => { if (ready && !closed && outstanding === 0) send('refresh',{}) },3000)
    return () => { closed = true; clearInterval(timer); window.removeEventListener('message',receive) }
  },[ctx,generation])
  return h('div',{style:{height:'100%',background:'var(--ui-bg, #171717)',color:'var(--ui-fg, #eee)'}},
    h('button',{onClick:()=>{setUrl('');setError('');setGeneration(n=>n+1)}},'Reload studio (stops audio)'),
    error ? h('p',{role:'alert'},error) : url ? h(SandboxedFrame,{ref:frame,src:url,title:'Poptart Strudel Studio',sandbox:'allow-scripts',style:{width:'100%',height:'calc(100% - 32px)',border:0}}) : h('p',null,'Connecting to local studio…'))
}
export default {
  id:'hermes-strudel-studio',name:'Strudel Studio',defaultEnabled:false,
  register(ctx) {
    ctx.register({id:'pane',area:'panes',title:'Strudel Studio',data:{placement:'right',width:'760px'},render:()=>h(Studio,{ctx})})
  }
}
