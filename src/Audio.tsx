import { useEffect, useRef, useState } from 'react';
import { createEngine } from './engine';

// This child is an independent opaque-origin sandbox. It never receives the
// host capability or service access. Its messages are informational only.
export function Audio() {
  const [status, setStatus] = useState('Ready');
  const [muted, setMuted] = useState(false);
  const pattern = useRef({code:'', tempo:120});
  const engine = useRef(createEngine());
  useEffect(() => {
    void engine.current.boot({sampleBanks:[{map:{bd:'bd.wav',sd:'sd.wav',hh:'hh.wav'},baseUrl:new URL('/samples/', location.href).href}]}).catch(e => setStatus(String(e)));
    const receive = (e: MessageEvent) => {
      if (e.source !== parent || !e.data || e.data.type !== 'audio.pattern' || typeof e.data.code !== 'string' || e.data.code.length > 100000 || typeof e.data.tempo !== 'number') return;
      pattern.current = {code:e.data.code,tempo:e.data.tempo};
    };
    addEventListener('message',receive);
    const activeEngine = engine.current;
    return () => {removeEventListener('message',receive); activeEngine.stop();};
  }, []);
  const play = async () => {
    try { await engine.current.play(pattern.current.code,pattern.current.tempo); setStatus('Playing'); }
    catch (e) { setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`); }
  };
  return <div style={{display:'flex',alignItems:'center',gap:10,font:'14px system-ui',background:'#f7f3eb',color:'#252222',padding:8}}>
    <button aria-label="Play" onClick={() => void play()}>▶ Play / apply</button>
    <button aria-label="Stop" onClick={() => {engine.current.stop();setStatus('Stopped')}}>■ Stop</button>
    <button aria-label={muted ? 'Unmute' : 'Mute'} onClick={() => {engine.current.setMuted(!muted);setMuted(!muted)}}>{muted?'Unmute':'Mute'}</button>
    <span role="status">{status}</span>
  </div>;
}
