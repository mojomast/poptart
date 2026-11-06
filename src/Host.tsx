import { useCallback, useEffect, useRef, useState } from 'react';
import type { ToolRequest } from '../shared/contracts';
import { envelope, tool, valid } from './protocol';

type Log = { direction: string; type: string; detail: string; time: string };
const token = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2, '0')).join('');

export function Host() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [capability, setCapability] = useState(token);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [logs, setLogs] = useState<Log[]>([]);
  const [command, setCommand] = useState('track.list');
  const [input, setInput] = useState('{}');
  const [result, setResult] = useState('');
  const log = useCallback((direction: string, type: string, detail = '') => setLogs(old => [{ direction, type, detail, time: new Date().toLocaleTimeString() }, ...old].slice(0, 50)), []);
  const send = useCallback((type: string, payload: unknown, id?: string) => {
    frame.current?.contentWindow?.postMessage(envelope(type, payload, capability, id), '*');
    log('HOST → PLAYER', type);
  }, [capability, log]);
  useEffect(() => {
    const receive = async (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || !valid(event.data, capability)) return;
      const message = event.data;
      log('PLAYER → HOST', message.type);
      if (message.type === 'ready') { setReady(true); send('init', { expanded }); }
      if (message.type === 'tool.request') {
        const request = message.payload as ToolRequest;
        if (!request || typeof request.operation !== 'string' || !request.input || typeof request.input !== 'object' || Array.isArray(request.input)) return;
        const response = await tool(request);
        send('tool.result', response, message.id);
      }
      if (message.type === 'resize.request') setExpanded(Boolean((message.payload as { expanded?: boolean })?.expanded));
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [capability, expanded, log, send]);
  const reload = () => { setReady(false); setCapability(token()); log('HOST', 'frame.reload', 'New capability issued'); };
  const run = async () => {
    try {
      const parsed = JSON.parse(input);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Input must be a JSON object');
      if (command === 'transport' || command === 'play' || command === 'stop' || command === 'mute' || command === 'unmute') {
        if (!ready) throw new Error('Player is not connected');
        const transportInput = command === 'transport' ? parsed : { ...parsed, action: command };
        const response = await tool({ operation: 'transport', input: transportInput });
        if (!response.ok) throw new Error(response.error.message);
        setResult('Transport request validated. Use the player’s audio controls to start or stop; remote transport is not connected.');
      } else {
        const response = await tool({ operation: command, input: parsed });
        setResult(JSON.stringify(response, null, 2));
        log('HOST → SERVICE', command, response.ok ? 'ok' : response.error.message);
        if (response.ok && ready) send('refresh', {});
      }
    } catch (error) { setResult(error instanceof Error ? error.message : String(error)); }
  };
  return <div className="host-shell">
    <header className="host-header"><a className="brand" href="/"><span className="brand-icon">✳</span> poptart <span className="brand-light">/ studio</span></a><div className="header-right"><span className="host-label">HOST ENVIRONMENT</span><span className={'connection ' + (ready ? 'online' : '')}><i />{ready ? 'Connected' : 'Connecting'}</span></div></header>
    <main className="host-main"><div className="page-heading"><div><div className="eyebrow">YOUR CREATIVE WORKSPACE <span> / </span> 01</div><h1>Make something <em>good.</em></h1><p>A little space for big ideas. Write patterns, shape your sound, and let it play.</p></div><div className="heading-stamp">SOUND<br/>IN MOTION <span>↗</span></div></div>
      <div className="workspace"><section className="player-wrap"><div className="panel-top"><div><span className="tiny-square"/> PLAYER <span className="muted">/ LIVE SESSION</span></div><div className="panel-actions"><button onClick={() => { const next = !expanded; setExpanded(next); if (ready) send('display', { expanded: next }); }}>{expanded ? '↙ Compact' : '↗ Expand'}</button><button onClick={reload}>↻ Reload</button></div></div><iframe key={capability} ref={frame} title="Poptart music editor" src={'/player#' + capability} sandbox="allow-scripts" className={expanded ? 'player-frame expanded' : 'player-frame compact'} /></section>
      <aside className="host-side"><section className="side-card"><div className="card-heading"><div><span className="eyebrow">THE CONTROL ROOM</span><h2>Agent commands<span>.</span></h2></div><span className="card-number">01</span></div><p>Talk to your workspace through the tool API, or send a transport command to the player.</p><label>OPERATION<input value={command} onChange={e => setCommand(e.target.value)} placeholder="track.list" /></label><label>INPUT <span>JSON</span><textarea value={input} onChange={e => setInput(e.target.value)} spellCheck={false} rows={4} /></label><button className="run-button" onClick={run}>Run command <span>↗</span></button>{result && <pre className="command-result">{result}</pre>}</section>
      <section className="side-card traffic"><div className="card-heading"><div><span className="eyebrow">BEHIND THE SCENES</span><h2>Traffic<span>.</span></h2></div><button className="clear" onClick={() => setLogs([])}>Clear</button></div><p>Messages between host, player, and service.</p><div className="traffic-list">{logs.length ? logs.map((item, i) => <div className="traffic-item" key={i}><div><b>{item.direction}</b><time>{item.time}</time></div><code>{item.type}</code>{item.detail && <small>{item.detail}</small>}</div>) : <div className="empty-traffic">Waiting for activity <span>···</span></div>}</div></section></aside></div>
      <footer><span>POPTART STUDIO © 2026 · AGPL-3.0-or-later · NO WARRANTY</span><a href="https://github.com/mojomast/poptart" target="_blank" rel="noreferrer">SOURCE & LICENSE ↗</a></footer></main></div>;
}
