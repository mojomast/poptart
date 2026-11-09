import {text,label,photo,p,hit,rect,star} from '../shared/draw.js';
export function draw(g,t,e){
  text(g,e.copy.library[0],72,262,130);text(g,e.copy.library[1],72,402,130,p.lime);
  label(g,e.copy.library[2],78,504,p.text,28);
  const n=Math.min(2,Math.floor(t/(4*60/126)));
  const img=e.images['revision'+(n+1)];
  // Header with real REV n, then right library, both recaptured at DSF3.
  photo(g,img,98,285,1500,235,72,610,1000,157);
  photo(g,img,3132,280,550,420,1298,345,550,420);
  photo(g,img,3132,2370,700,175,1280,850,568,142);
  for(let i=0;i<=n;i++)hit(g,t,i*4*60/126,()=>{rect(g,78+i*316,812,284,80,p.panel);label(g,`REV ${i+2}`,100+i*316,865,p.text,29);});
  star(g,1210,662,76,e.time*126/60);
  label(g,'A LITTLE EVERY DAY.',74,988,p.text,32);
}
