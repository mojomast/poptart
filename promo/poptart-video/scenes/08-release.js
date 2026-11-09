import {text,label,star,waveform,p,line} from '../shared/draw.js';
export function draw(g,t,e){
  // Last downbeat = beat 80; thereafter the conductor is completely at rest.
  const beats=Math.min(80,e.time*126/60);
  star(g,312,448,350,beats);
  text(g,e.copy.brand,620,527,260,p.text);
  label(g,e.copy.end,630,614,p.text,27);
  line(g,630,680,1848,680,p.rule,2);
  text(g,e.copy.url,630,775,47,p.text,500,true);
  label(g,e.copy.credit,630,877,p.text,23);
  waveform(g,e,75,972,1773,48,0,2400,p.dim);
}
