import { useCallback, useEffect, useRef, useState } from 'react';
import type { ToolRequest, ToolResult, Track } from '../shared/contracts';
import { envelope, valid } from './protocol';

const starter = 'stack(\n  note("c2 ~ c2 ~").s("triangle").decay(0.2),\n  note("<c3 eb3 g3 bb3>").s("sawtooth").lpf(800),\n  note("c5 eb5 g5 eb5").s("sine").gain(0.3)\n)';
const capability = location.hash.slice(1);
let hostOrigin = '';
try { hostOrigin = new URL(document.referrer).origin; } catch { /* no trusted parent */ }

export function Player() {
  const [connected, setConnected] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [track, setTrack] = useState<Track | null>(null);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [message, setMessage] = useState('');
  const pending = useRef(new Map<string, { resolve: (r: ToolResult) => void; timer: number }>());
  const audioFrame = useRef<HTMLIFrameElement>(null);
  const current = useRef(track); current.current = track;
  const dirtyRef = useRef(dirty); dirtyRef.current = dirty;
  const hasEdits = useRef(dirty); hasEdits.current = dirty;
  const section = useRef(sectionId); section.current = sectionId;
  const post = useCallback((type: string, payload: unknown, id?: string) => { if (hostOrigin && window.parent !== window) window.parent.postMessage(envelope(type, payload, capability, id), hostOrigin); }, []);
  const request = useCallback((operation: string, input: Record<string, unknown> = {}) => new Promise<ToolResult>(resolve => {
    const id = crypto.randomUUID();
    const timer = window.setTimeout(() => { pending.current.delete(id); resolve({ ok: false, error: { code: 'TIMEOUT', message: 'Host did not respond' } }); }, 10000);
    pending.current.set(id, { resolve, timer }); post('tool.request', { operation, input } satisfies ToolRequest, id);
  }), [post]);
  const refresh = useCallback(async () => {
    const response = await request('track.list');
    if (response.ok && Array.isArray(response.data)) {
      const list = response.data as Track[]; setTracks(list);
      const updated = list.find(t => t.id === current.current?.id);
      if (updated && updated.revision !== current.current?.revision) {
        if (dirtyRef.current) setMessage('The track changed elsewhere. Save will check for conflicts; your edits are preserved.');
        else setTrack(updated);
      }
    }
    else if (!response.ok) setMessage(response.error.message);
  }, [request]);
  const sendPattern = useCallback(() => {
    const active = current.current;
    if (!active) return;
    const code = active.sections.find(s => s.id === section.current)?.code ?? active.code;
    audioFrame.current?.contentWindow?.postMessage({type:'audio.pattern', code, tempo:active.tempo}, '*');
  }, []);
  useEffect(() => { sendPattern(); }, [track, sectionId, sendPattern]);
  const transport = useCallback(async (_action: string, _trackId?: string) => {
    setMessage('Use the audio controls inside the player to start or stop sound.');
  }, []);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== window.parent || event.origin !== hostOrigin || !valid(event.data, capability)) return;
      const m = event.data;
      if (m.type === 'init') { setConnected(true); setExpanded(Boolean((m.payload as { expanded?: boolean })?.expanded)); void refresh(); }
      if (m.type === 'tool.result') { const p = pending.current.get(m.id); if (p) { clearTimeout(p.timer); pending.current.delete(m.id); p.resolve(m.payload as ToolResult); } }
      if (m.type === 'refresh') void refresh();
      if (m.type === 'display') setExpanded(Boolean((m.payload as { expanded?: boolean })?.expanded));
      if (m.type === 'transport') { const p = m.payload as { action?: string; trackId?: string }; if (p?.action) void transport(p.action, p.trackId); }
    };
    window.addEventListener('message', receive); post('ready', {});
    return () => { window.removeEventListener('message', receive); };
  }, [post, refresh, transport]);
  useEffect(() => () => { pending.current.forEach(p => { clearTimeout(p.timer); p.resolve({ ok: false, error: { code: 'CLOSED', message: 'Player closed' } }); }); pending.current.clear(); }, []);
  const update = (changes: Partial<Track>) => { setTrack(t => t ? { ...t, ...changes } : t); setDirty(true); };
  const create = async () => {
    if (dirty && !window.confirm('Discard unsaved changes?')) return;
    setBusy(true); const response = await request('track.create', { title: 'Untitled track', code: starter, tempo: 120, sections: [] }); setBusy(false);
    if (response.ok) { setTrack(response.data as Track); setSectionId(null); setDirty(false); await refresh(); } else setMessage(response.error.message);
  };
  const save = async () => {
    if (!track) return; setBusy(true);
    const response = await request('track.update', { trackId: track.id, expectedRevision: track.revision, changes: { title: track.title, code: track.code, tempo: track.tempo, sections: track.sections } }); setBusy(false);
    if (response.ok) { setTrack(response.data as Track); setDirty(false); setMessage('Saved'); await refresh(); } else setMessage(response.error.message + (response.error.code === 'CONFLICT' ? ' — reload the track before saving again.' : ''));
  };
  const select = (t: Track) => { if (dirty && !window.confirm('Discard unsaved changes?')) return; setTrack(t); setSectionId(null); setDirty(false); setMessage(''); };
  const addSection = () => { if (!track) return; const id = crypto.randomUUID(); update({ sections: [...track.sections, { id, name: `Section ${track.sections.length + 1}`, code: track.code }] }); setSectionId(id); };
  const activeSection = track?.sections.find(s => s.id === sectionId);
  const code = activeSection?.code ?? track?.code ?? '';
  const setCode = (value: string) => { if (!track) return; if (activeSection) update({ sections: track.sections.map(s => s.id === activeSection.id ? { ...s, code: value } : s) }); else update({ code: value }); };
  return <div className={'studio ' + (!expanded ? 'is-compact' : '')}>
    <div className="studio-top"><div className="studio-logo"><span>✳</span><div>poptart <small>THE MUSIC WORKSPACE</small></div></div><div className="studio-status"><i/> {connected ? 'SESSION READY' : 'CONNECTING'} <span>● ● ●</span></div></div>
    <div className="studio-body"><aside className="library"><div className="library-title"><div><span className="eyebrow">YOUR LIBRARY</span><h3>Tracks <span>{String(tracks.length).padStart(2, '0')}</span></h3></div><button className="add-button" onClick={create} disabled={!connected || busy} aria-label="New track">＋</button></div><div className="track-list">{tracks.map((t, i) => <button key={t.id} className={'track-item ' + (track?.id === t.id ? 'active' : '')} onClick={() => select(t)}><span className="track-index">{String(i + 1).padStart(2, '0')}</span><span className="track-name">{t.title}<small>{t.tempo} BPM</small></span><span>↗</span></button>)}{!tracks.length && <p className="empty-library">Your tracks will live here.<br/>Start with a fresh idea.</p>}</div><button className="new-track" onClick={create} disabled={!connected || busy}>＋ <span>New track</span></button><div className="library-bottom"><span>✳</span> A LITTLE EVERY DAY<br/><small>MAKES A LOT OF SOMEDAY.</small></div></aside>
    <main className="editor">{track ? <><div className="editor-heading"><div><div className="eyebrow">NOW EDITING <span>/</span> TRACK {String(Math.max(0, tracks.findIndex(t => t.id === track.id)) + 1).padStart(2, '0')}</div><input className="title-input" aria-label="Track title" value={track.title} onChange={e => update({ title: e.target.value })}/><div className="track-meta">YOUR SOUND, YOUR RULES <span>✳</span> REV {track.revision}</div></div><button className="save-button" onClick={save} disabled={!dirty || busy}>{busy ? 'Saving…' : dirty ? 'Save changes ↗' : '✓ Saved'}</button></div>
      <div className="section-bar"><div className="section-tabs"><button className={!sectionId ? 'selected' : ''} onClick={() => setSectionId(null)}>Main pattern</button>{track.sections.map(s => <button className={sectionId === s.id ? 'selected' : ''} key={s.id} onClick={() => setSectionId(s.id)}>{s.name}</button>)}<button className="add-section" onClick={addSection}>＋ <span>Section</span></button></div><span className="section-label">PATTERN / {activeSection ? activeSection.name.toUpperCase() : 'MAIN'}</span></div>
      {activeSection && <div className="section-edit"><label>SECTION NAME <input value={activeSection.name} onChange={e => update({ sections: track.sections.map(s => s.id === activeSection.id ? { ...s, name: e.target.value } : s) })}/></label><button onClick={() => { update({ sections: track.sections.filter(s => s.id !== activeSection.id) }); setSectionId(null); }}>Remove section ×</button></div>}
      <div className="code-editor"><div className="code-top"><span><i/> PATTERN EDITOR</span><span>STRUDEL / JS</span></div><div className="code-content"><div className="line-numbers" aria-hidden="true">{code.split('\n').map((_, i) => <div key={i}>{String(i + 1).padStart(2, '0')}</div>)}</div><textarea aria-label="Pattern code" spellCheck={false} value={code} onChange={e => setCode(e.target.value)}/></div><div className="code-bottom"><span>✳ &nbsp; MAKE IT YOURS</span><span>{code.split('\n').length} LINES</span></div></div>
      <div className="transport"><iframe ref={audioFrame} title="Isolated audio controls" src="/audio" sandbox="allow-scripts" onLoad={sendPattern} style={{border:0,width:'100%',height:60}}/><label className="tempo"><span>TEMPO</span><input type="number" min="20" max="400" aria-label="Tempo" value={track.tempo} onChange={e => update({ tempo: Number(e.target.value) })}/><b>BPM</b></label></div>{message && <div className="notice" role="status">{message}</div>}</> : <div className="welcome"><span className="welcome-icon">✳</span><div className="eyebrow">A GOOD PLACE TO START</div><h2>Let's make<br/><em>some noise.</em></h2><p>Every great track starts somewhere. Create a track and start playing with patterns.</p><button className="save-button" disabled={!connected || busy} onClick={create}>＋ &nbsp; Create your first track</button>{message && <div className="notice">{message}</div>}</div>}</main></div>
    <div className="studio-footer"><span>✳ &nbsp; MADE TO BE PLAYED</span><span>THE POSSIBILITIES ARE ENDLESS &nbsp; ↗</span></div></div>;
}
