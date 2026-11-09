import {text,label,photo,p,rect,steps,star,accent} from '../shared/draw.js';
export function draw(g,t,e){
  text(g,e.copy.highlightTitle[0],72,235,128);accent(g,e.copy.highlightTitle[1],0,72,373,128);
  const img=e.native;
  const lower=t>=8*60/126;
  // Source is DSF3: these are magnified native glyphs, not enlarged bitmap text.
  const sy=lower?Math.min(330,img.height-600):0;
  photo(g,img,0,sy,Math.min(2400,img.width),600,72,460,1776,444);
  rect(g,72,460,3,444,p.lime);
  // These margin ticks follow measured native token rectangles. No UI repaint.
  for(const box of e.tokenBoxes){const y=460+(box.y+box.height/2-sy)*444/600;if(y>=462&&y<=902)rect(g,52,y,16,2,p.lime);}
  steps(g,e,e.time,1240,226,608);star(g,1700,343,74,e.time*126/60);
  label(g,e.copy.highlights[1],74,988,p.text,34);
  label(g,'126 BPM / NATIVE TOKEN HIGHLIGHTS',74,938,p.dim,19);
}
