import {text,label,hit,star,line,p,steps} from '../shared/draw.js';
export function draw(g,t,e){
  const beat=60/126;
  for(let i=0;i<4;i++)if(t>=i*beat)line(g,72,180+i*168,1848,180+i*168,p.text,1);
  hit(g,t,0,()=>label(g,'POPTART',76,146,p.text,28));
  hit(g,t,beat,()=>text(g,e.copy.intro[0],72,349,160));
  hit(g,t,2*beat,()=>text(g,e.copy.intro[1],72,521,160));
  hit(g,t,3*beat,()=>text(g,e.copy.intro[2],72,772,238,p.lime));
  if(t>=4*beat)star(g,1550,540,390,(t-4*beat)/beat);
  steps(g,e,t,78,904,1040);label(g,'YOUR SOUND. YOUR RULES.',78,988,p.text,27);
}
