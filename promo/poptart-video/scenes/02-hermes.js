import {text,label,photo,mix,clamp,rail,line,p,star} from '../shared/draw.js';
export function draw(g,t,e){
  text(g,e.copy.hermesTitle[0],72,265,136);text(g,e.copy.hermesTitle[1],72,409,136,p.lime);
  label(g,'A STRUDEL',76,493,p.text,27);label(g,'STUDIO.',76,534,p.text,27);
  const image=e.images.hero;
  // Full window first; rail pushes toward real code/chat without enlarging pixels.
  const u=clamp((t-1.7)/1.3);const crop=[mix(0,620,u),mix(0,125,u),mix(1684,1050,u),mix(1113,694,u)];
  rail(g,0,t,()=>photo(g,image,...crop,834,180,1000,661));
  line(g,821,174,821,851,p.lime,2);line(g,821,174,850,174,p.lime,2);line(g,821,851,850,851,p.lime,2);
  star(g,112,819,60,e.time*126/60);label(g,'DOCKED.',161,831,p.text,24);
  label(g,e.copy.hermes[1],74,988,p.text,32);
}
