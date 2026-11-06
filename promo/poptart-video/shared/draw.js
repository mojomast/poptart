import p from '../palette.json';
export const clamp=x=>Math.max(0,Math.min(1,x));
export const mix=(a,b,t)=>a+(b-a)*clamp(t);
export function rect(g,x,y,w,h,color=p.panel){g.fillStyle=color;g.fillRect(x,y,w,h);}
export function line(g,x,y,x2,y2,color=p.rule,width=1){g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.stroke();}
export function text(g,value,x,y,size=30,color=p.text,weight=900,mono=false,spacing=0){
  g.fillStyle=color;g.font=`${weight} ${size}px ${mono?'ScoreMono':'ScoreGrotesk'}`;g.textBaseline='alphabetic';g.textAlign='left';g.letterSpacing=`${spacing}px`;
  const m=g.measureText(value);if(x<0||x+m.width>1920.5||y>1080)throw new Error(`Text out of frame: ${value}`);
  g.fillText(value,x,y);g.letterSpacing='0px';
}
export function label(g,value,x,y,color=p.text,size=22){text(g,value,x,y,size,color,500,true,1.8);}
export function accent(g,value,wordIndex,x,y,size,mono=false){
  const words=value.split(' '),prefix=words.slice(0,wordIndex).join(' ')+(wordIndex?' ':'');
  text(g,value,x,y,size,p.text,mono?500:900,mono,mono?1.8:0);
  g.letterSpacing=mono?'1.8px':'0px';const offset=g.measureText(prefix).width;
  text(g,words[wordIndex],x+offset,y,size,p.lime,mono?500:900,mono,mono?1.8:0);
}
export function hit(g,time,at,draw){if(time+1e-5<at)return;const u=clamp((time-at)/.16);g.save();g.translate(0,6*Math.pow(1-u,2));draw();g.restore();}
export function star(g,x,y,size,beats,color=p.lime){
  g.save();g.translate(x,y);g.rotate(beats*Math.PI/3);g.fillStyle=color;
  for(const a of [0,Math.PI/4,Math.PI/2,3*Math.PI/4]){g.save();g.rotate(a);g.fillRect(-size*7/106,-size/2,size*14/106,size);g.restore();}g.restore();
}
export function photo(g,img,sx,sy,sw,sh,x,y,w,h){
  if(!img)throw new Error('Missing captured image');
  if(sx<0||sy<0||sx+sw>img.width+.5||sy+sh>img.height+.5)throw new Error(`Crop outside image: ${[sx,sy,sw,sh]} / ${img.width}x${img.height}`);
  if(w>sw+1||h>sh+1)throw new Error(`Source pixel upscale: ${sw}x${sh} -> ${w}x${h}`);
  g.drawImage(img,sx,sy,sw,sh,x,y,w,h);
}
export function waveform(g,env,x,y,w,h,from=0,to=2400,color=p.text){
  const a=env.audio.peaks;g.strokeStyle=color;g.lineWidth=2;g.beginPath();
  for(let i=0;i<Math.floor(w/4);i++){const k=Math.min(a.length-1,Math.floor(from+(to-from)*i/(w/4)));const amp=Math.min(1,a[k]*2.8);const xx=x+i*4;g.moveTo(xx,y-amp*h/2);g.lineTo(xx,y+amp*h/2);}g.stroke();
}
export function chrome(g,t,env){
  const b=Math.floor(t*126/60+1e-6),bar=Math.floor(b/4)+1;
  label(g,'POPTART / SCORE SHEET',72,64,p.text,19);
  label(g,`126 BPM  /  ${String(bar).padStart(2,'0')}.${b%4+1}`,1415,64,p.text,19);
  for(let i=0;i<5;i++){const y=180+i*168;line(g,72,y,1848,y);label(g,String(i+1).padStart(2,'0'),26,y+5,p.dim,13);}
  for(let i=0;i<84;i++){const x=72+i*(1776/84);rect(g,x,1029,16,3,i<=b?p.text:p.rule);}
  const active=72+(t*126/60%84)*1776/84;rect(g,active,1022,2,18,p.lime);
  label(g,'STRUDEL STUDIO FOR HERMES',72,1062,p.dim,16);
  label(g,env.settings.release.toUpperCase(),1740,1062,p.dim,16);
}
export function steps(g,env,t,x,y,w){
  const offset=Math.floor(t*126/60/4)*16;
  for(let i=0;i<16;i++){
    const energy=env.audio.steps[(offset+i)%336],on=Math.floor(t*126/60*4)%16===i;
    rect(g,x+i*w/16,y,Math.floor(w/16)-5,Math.max(4,energy*220),on?p.lime:p.rule);
  }
}
export function rail(g,at,local,draw){g.save();g.translate(Math.round(36*Math.pow(1-clamp((local-at)/.25),2)),0);draw();g.restore();}
export {p};
