import {text,label,photo,p,hit,waveform,rect,accent} from '../shared/draw.js';
export function draw(g,t,e){
  text(g,e.copy.continuation[0],72,258,148);
  hit(g,t,60/126,()=>{rect(g,1370,188,475,62,p.error);label(g,'ERROR / STILL PLAYING',1392,230,p.ink,23);});
  const img=e.images.error;
  // Actual error and transport region; actual invalid source above it.
  photo(g,img,98,1340,2850,590,72,355,1776,368);
  photo(g,img,98,2180,2820,265,72,745,1776,167);
  label(g,e.copy.continuation[1],74,963,p.text,29);accent(g,e.copy.continuation[2],1,74,1002,29,true);
  waveform(g,e,1180,977,660,62,Math.floor(e.time*60),Math.floor(e.time*60)+120,p.text);
}
