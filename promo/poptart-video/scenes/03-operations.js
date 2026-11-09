import {text,label,photo,hit,p,rect,star,accent} from '../shared/draw.js';
export function draw(g,t,e){
  text(g,e.copy.operations[0],72,222,120);accent(g,e.copy.operations[1],0,72,352,120);
  const k=Math.min(4,Math.floor(t/(60/126)));
  e.copy.ops.forEach((op,i)=>hit(g,t,i*60/126,()=>{const x=78+i*350;rect(g,x-8,400,322,56,i===k?p.highlightFill:p.ink);label(g,op,x,438,i===k?p.lime:p.text,25);}));
  // Actual Hermes instruction/result at native scale, paired with original
  // source-video code at exactly the audio's source time.
  photo(g,e.images.hero,282,225,610,322,72,516,610,322);
  photo(g,e.source,245,337,1000,330,778,516,1000,330);
  label(g,'HERMES / POPTART_STUDIO',74,890,p.text,20);
  label(g,'ORIGINAL TRACK / PACKAGED CAPTURE',780,890,p.text,20);
  label(g,'ONE TOOL. ELEVEN OPS.',74,988,p.text,31);star(g,1796,960,52,e.time*126/60);
}
