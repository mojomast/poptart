import {text,label,photo,waveform,p,rect,star} from '../shared/draw.js';
export function draw(g,t,e){
  const beat=Math.floor(t*126/60+1e-5);const img=e.native;
  if(beat<4){const sx=[0,300,0,540][beat];const sy=[0,180,330,90][beat];photo(g,img,sx,Math.min(sy,img.height-520),2040,520,72,232,1776,453);}
  waveform(g,e,72,710,1776,470,Math.floor(e.time*60)-60,Math.floor(e.time*60)+240,p.text);
  rect(g,72,870,1776,147,p.ink);text(g,'MADE TO BE',72,936,76);text(g,'PLAYED.',670,990,118,p.lime);
  star(g,1750,958,86,e.time*126/60);
}
