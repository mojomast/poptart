import { useEffect, useRef, useSyncExternalStore } from 'react';
import { createEngine } from './engine';
import './hermes-config';

// This child is an independent opaque-origin sandbox. It never receives the
// host capability or service access. Its messages are informational only.
export function Audio() {
  const pattern = useRef({code:'', tempo:120});
  const engine = useRef(createEngine());
  const state = useSyncExternalStore(engine.current.subscribe, engine.current.getState);
  const status = state.playing ? 'Playing' : state.lastGoodCode ? 'Stopped' : state.ready ? 'Ready' : 'Loading';
  useEffect(() => {
    void engine.current.boot({sampleBanks:[window.__POPTART_GUEST__?.samples ? {map:window.__POPTART_GUEST__.samples} : {map:{bd:'bd.wav',sd:'sd.wav',hh:'hh.wav'},baseUrl:new URL('/samples/', location.href).href}]}).catch(() => {});
    const receive = (e: MessageEvent) => {
      if (e.source !== parent || !e.data || e.data.type !== 'audio.pattern' || typeof e.data.code !== 'string' || e.data.code.length > 100000 || typeof e.data.tempo !== 'number') return;
      pattern.current = {code:e.data.code,tempo:e.data.tempo};
    };
    addEventListener('message',receive);
    const activeEngine = engine.current;
    return () => {removeEventListener('message',receive); activeEngine.stop();};
  }, []);
  const play = async () => {
    // Evaluation errors are independent of transport state. A rejected apply
    // leaves Playing visible when the last-known-good pattern is still active.
    try { await engine.current.play(pattern.current.code,pattern.current.tempo); }
    catch { /* engine state carries both the error and the actual transport */ }
  };
  return <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:'6px 10px',font:'14px system-ui',background:'#202024',color:'#eeeeef',padding:8}}>
    <button aria-label="Play" onClick={() => void play()}>▶ Play / apply</button>
    <button aria-label="Stop" onClick={() => engine.current.stop()}>■ Stop</button>
    <button aria-label={state.muted ? 'Unmute' : 'Mute'} onClick={() => engine.current.setMuted(!state.muted)}>{state.muted?'Unmute':'Mute'}</button>
    <span role="status">{status}</span>
    {state.error && <span role="alert" style={{flexBasis:'100%',fontSize:12,color:'#ffb4ab'}}>Error: {state.error}{state.playing ? ' — last good pattern is still playing.' : ''}</span>}
  </div>;
}
