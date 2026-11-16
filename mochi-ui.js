(function mochiUI(){
'use strict';
const $=id=>document.getElementById(id);
const app=$('app'),dock=$('settings-dock'),sheet=$('settings-sheet');
const backdrop=$('sheet-backdrop'),grab=$('sheet-grab');
const sound=$('sound-toggle'),haptic=$('haptic-toggle');
const consent=$('consent-dialog'),photo=$('photo-dialog'),preview=$('photo-image');
const materialNames={mochi:'經典麻糬',crunch:'脆脆史萊姆',clay:'紙黏土',bubble:'泡泡',wrap:'泡泡紙'};
let currentMaterial='mochi';
const vibrationSupported=typeof navigator.vibrate==='function';
let consented=false,soundOn=false,hapticOn=false,audioContext=null,noiseBuffer=null;
let photoData='',photoBlob=null,lastStretch=0,lastPress=0;
const cookieName='mochi_sensory';
function cookieValue(){
  const found=document.cookie.split('; ').find(k=>k.startsWith(cookieName+'='));
  return found?decodeURIComponent(found.slice(cookieName.length+1)):null;
}
function persist(){
  if(!consented)return;
  const value='v1:'+Number(soundOn)+':'+Number(hapticOn);
  document.cookie=cookieName+'='+encodeURIComponent(value)+'; Path=/Fatboynowadays/; Max-Age=15552000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');
}
const existing=cookieValue();
if(existing&&/^v1:[01]:[01]$/.test(existing)){
  const parts=existing.split(':');consented=true;soundOn=parts[1]==='1';hapticOn=parts[2]==='1'&&vibrationSupported;
}
function updateControls(){
  sound.setAttribute('aria-checked',String(soundOn));
  haptic.setAttribute('aria-checked',String(hapticOn));
  if(!vibrationSupported){
    haptic.disabled=true;
    haptic.setAttribute('aria-disabled','true');
    haptic.title='此瀏覽器不支援網頁震動';
    const detail=haptic.parentElement?.querySelector('.setting-desc');
    if(detail)detail.textContent='此瀏覽器不支援網頁震動（iOS Safari 通常不支援）';
  }
}
function consentOpen(open){
  consent.classList.toggle('is-open',open);
  consent.setAttribute('aria-hidden',String(!open));
  if(open)$('consent-allow').focus();
}
function enableAudio(){
  if(!soundOn)return;
  try{
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return;
    if(!audioContext)audioContext=new Ctx({latencyHint:'interactive'});
    if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
    if(!noiseBuffer){
      const size=Math.round(audioContext.sampleRate*.35);
      noiseBuffer=audioContext.createBuffer(1,size,audioContext.sampleRate);
      const data=noiseBuffer.getChannelData(0);
      for(let i=0;i<size;i++)data[i]=Math.random()*2-1;
    }
  }catch(err){console.warn('Audio disabled by browser',err);}
}
function beep(f0,f1,len,vol,type='sine'){
  if(!audioContext||audioContext.state!=='running')return;
  const c=audioContext,t=c.currentTime,o=c.createOscillator(),gain=c.createGain();
  o.type=type;o.frequency.setValueAtTime(Math.max(10,f0),t);
  o.frequency.exponentialRampToValueAtTime(Math.max(10,f1),t+len);
  gain.gain.setValueAtTime(.0001,t);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),t+.012);
  gain.gain.exponentialRampToValueAtTime(.0001,t+len);
  o.connect(gain).connect(c.destination);o.start(t);o.stop(t+len+.015);
}
function noise(len,vol,frequency=1800){
  if(!audioContext||audioContext.state!=='running'||!noiseBuffer)return;
  const c=audioContext,t=c.currentTime,source=c.createBufferSource();
  source.buffer=noiseBuffer;
  const filter=c.createBiquadFilter();filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.8;
  const gain=c.createGain();gain.gain.setValueAtTime(.0001,t);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),t+.004);
  gain.gain.exponentialRampToValueAtTime(.0001,t+len);
  source.connect(filter).connect(gain).connect(c.destination);source.start(t);source.stop(t+Math.min(len,noiseBuffer.duration));
}
function feedback(kind,intensity=1){
  if(!consented)return;
  const now=performance.now();
  if(kind==='stretch'&&now-lastStretch<125)return;
  if(kind==='press'&&now-lastPress<90)return;
  if(kind==='stretch')lastStretch=now;
  if(kind==='press')lastPress=now;
  if(soundOn){
    enableAudio();
    const v=Math.max(.2,Math.min(1,intensity));
    const mat=currentMaterial;
    if(kind==='press'){
      if(mat==='clay'){noise(.055,.032*v,380);beep(85,55,.075,.027*v);}
      else if(mat==='bubble'||mat==='wrap'){beep(570,350,.055,.037*v);}
      else if(mat==='crunch'){noise(.075,.05*v,2150);beep(140,100,.07,.032*v);}
      else beep(115,75,.12,.027*v);
    }else if(kind==='stretch'){
      if(mat==='clay')noise(.05,.013*v,480);
      else if(mat==='crunch')noise(.07,.037*v,2100);
      else beep(100+v*40,80,.08,.019*v);
    }else if(kind==='tear'){
      noise(.21,mat==='clay'?.20:.15,mat==='crunch'?3100:1300);
      beep(mat==='bubble'?950:260,mat==='bubble'?140:70,.24,.11,'triangle');
    }else if(kind==='rejoin'){
      beep(130,260,.22,.067,'sine');beep(170,95,.23,.032,'triangle');
    }else if(kind==='pop'){
      noise(.085,mat==='wrap'?.13:.072,mat==='wrap'?3200:2400);
      beep(mat==='wrap'?780:580,100,.09,.066,'triangle');
    }else if(kind==='select'){
      beep(490,720,.08,.028);
    }else if(kind==='reset'){
      beep(380,260,.14,.025);
    }
  }
  if(hapticOn&&typeof navigator.vibrate==='function'){
    const patterns={press:7,stretch:5,tear:[20,35,28],rejoin:[15,20,15],pop:16,select:7,reset:8};
    try{navigator.vibrate(patterns[kind]||7);}catch(_){}
  }
}
window.MochiFeedback=feedback;
window.MochiMaterial=()=>currentMaterial;
$('consent-allow').addEventListener('click',()=>{
  consented=true;soundOn=true;hapticOn=vibrationSupported;persist();updateControls();
  enableAudio();consentOpen(false);feedback('select');
});
$('consent-decline').addEventListener('click',()=>{
  consented=false;soundOn=false;hapticOn=false;updateControls();consentOpen(false);
});
sound.addEventListener('click',()=>{
  if(!consented){consentOpen(true);return;}
  soundOn=!soundOn;persist();updateControls();if(soundOn){enableAudio();feedback('select');}
});
haptic.addEventListener('click',()=>{
  if(!consented){consentOpen(true);return;}
  hapticOn=!hapticOn;persist();updateControls();
  if(hapticOn)feedback('select');
});
updateControls();
function settingsOpen(open){
  sheet.classList.toggle('is-open',open);
  backdrop.classList.toggle('is-open',open);
  sheet.setAttribute('aria-hidden',String(!open));
  backdrop.setAttribute('aria-hidden',String(!open));
  $('settings-open').setAttribute('aria-expanded',String(open));
}
$('settings-open').addEventListener('click',()=>settingsOpen(!sheet.classList.contains('is-open')));
$('settings-close').addEventListener('click',()=>settingsOpen(false));
backdrop.addEventListener('click',()=>settingsOpen(false));
let gesture=null;
function beginSwipe(e){gesture={id:e.pointerId,y:e.clientY,x:e.clientX};}
function endSwipe(e,opening){
  if(!gesture||e.pointerId!==gesture.id)return;
  const dy=e.clientY-gesture.y,dx=e.clientX-gesture.x;
  gesture=null;
  if(Math.abs(dx)>Math.abs(dy))return;
  if(opening&&dy< -24)settingsOpen(true);
  if(!opening&&dy>35)settingsOpen(false);
}
dock.addEventListener('pointerdown',beginSwipe);
dock.addEventListener('pointerup',e=>endSwipe(e,true));
grab.addEventListener('pointerdown',beginSwipe);
grab.addEventListener('pointerup',e=>endSwipe(e,false));
$('sheet-reset').addEventListener('click',()=>{
  $('reset').click();settingsOpen(false);
});
document.querySelectorAll('.material-tile').forEach(btn=>btn.addEventListener('click',()=>{
  currentMaterial=btn.dataset.material;
  $('dock-material').textContent=materialNames[currentMaterial];
  document.querySelectorAll('.material-tile').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));
  window.MochiAPI?.setMaterial?.(currentMaterial);
  feedback('select');
}));
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  if(photo.classList.contains('is-open'))photoOpen(false);
  else if(consent.classList.contains('is-open'))consentOpen(false);
  else if($('palette-library').classList.contains('is-open'))$('palette-library').querySelector('.palette-close').click();
  else settingsOpen(false);
});
// Disable touch selection, browser double-tap and Safari multi-finger pinch
// inside the playground. OS-level accessibility zoom is not affected.
for(const name of ['gesturestart','gesturechange','gestureend']){
  document.addEventListener(name,e=>e.preventDefault(),{passive:false});
}
app.addEventListener('dblclick',e=>{if(e.target.closest('button,input'))return;e.preventDefault();},{passive:false});
let lastTap=0;
$('stage').addEventListener('touchend',e=>{
  const now=Date.now();
  if(now-lastTap<300)e.preventDefault();
  lastTap=now;
},{passive:false});

function photoOpen(open){
  photo.classList.toggle('is-open',open);
  photo.setAttribute('aria-hidden',String(!open));
}
function capture(){
  try{
    const source=$('stage');
    const W=1080,H=1350;
    const out=document.createElement('canvas');out.width=W;out.height=H;
    const c=out.getContext('2d',{alpha:false});
    const bg=c.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,'#f9f1f5');bg.addColorStop(.5,'#fff7f3');bg.addColorStop(1,'#ece9f3');
    c.fillStyle=bg;c.fillRect(0,0,W,H);
    c.strokeStyle='#c8b3c766';c.lineWidth=2;
    [420,525].forEach(r=>{c.beginPath();c.arc(W/2,670,r,0,Math.PI*2);c.stroke();});
    // Composited floor shadow independent of the original HTML element.
    c.save();c.translate(540,820);c.scale(350,69);
    const sg=c.createRadialGradient(0,0,.03,0,0,1);
    sg.addColorStop(0,'#7d62734e');sg.addColorStop(1,'#7d627300');
    c.fillStyle=sg;c.beginPath();c.arc(0,0,1,0,Math.PI*2);c.fill();c.restore();
    const sw=source.clientWidth,sh=source.clientHeight;
    const nominalR=Math.min(sw*(sw<650?.355:.26),sh*(sw<650?.24:.29),286);
    const s=350/nominalR,cx=sw*.5,cy=sh*(sh<620?.52:(sw<650?.495:.525));
    c.drawImage(source,540-cx*s,660-cy*s,sw*s,sh*s);
    const particles=$("fx-layer");if(particles)c.drawImage(particles,540-cx*s,660-cy*s,sw*s,sh*s);
    c.fillStyle='#605062';c.font='700 22px sans-serif';c.fillText('SOFT MATTER STUDIO',82,90);
    c.fillStyle='#ae98ae';c.font='16px sans-serif';c.fillText('TACTILE EXPERIMENT / 002',82,120);
    c.fillStyle='#735c70';c.font='italic 112px Georgia,serif';c.fillText('mochi.',76,1148);
    c.fillStyle='#857585';c.font='20px sans-serif';c.fillText(materialNames[currentMaterial]+'   •   '+$('selected-code').textContent,84,1201);
    const color=getComputedStyle(document.documentElement).getPropertyValue('--chosen-color').trim()||'#EFB0BB';
    c.fillStyle=color;c.fillRect(W-133,1130,49,49);
    c.fillStyle='#a294a1';c.font='14px sans-serif';c.fillText('MADE TO BE TOUCHED',84,1282);
    photoData=out.toDataURL('image/png');
    preview.src=photoData;
    photoBlob=dataUrlToBlob(photoData);
    photoOpen(true);
    const flash=$('flash');flash.classList.add('flash');
    requestAnimationFrame(()=>flash.classList.remove('flash'));
  }catch(err){
    console.error('Unable to capture:',err);
    alert('目前無法拍攝。請確認瀏覽器支援 Canvas 截圖。');
  }
}
function dataUrlToBlob(url){
  const raw=atob(url.split(',')[1]),bytes=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  return new Blob([bytes],{type:'image/png'});
}
function download(){
  if(!photoBlob)return;
  const link=document.createElement('a');
  const url=URL.createObjectURL(photoBlob);
  link.href=url;link.download='MOCHI-LAB-'+new Date().toISOString().slice(0,10)+'.png';
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function share(){
  if(!photoBlob)return;
  const file=new File([photoBlob],'mochi-lab.png',{type:'image/png'});
  if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
    navigator.share({files:[file],title:'MOCHI LAB · My Soft Creation'}).catch(err=>{
      if(err.name!=='AbortError')download();
    });
  }else download();
}
$('capture').addEventListener('click',()=>requestAnimationFrame(capture));
$('dock-capture').addEventListener('click',()=>requestAnimationFrame(capture));
$('sheet-camera').addEventListener('click',()=>{settingsOpen(false);requestAnimationFrame(()=>requestAnimationFrame(capture));});
$('photo-close').addEventListener('click',()=>photoOpen(false));
$('photo-download').addEventListener('click',download);
$('photo-share').addEventListener('click',share);
photo.addEventListener('click',e=>{if(e.target===photo)photoOpen(false);});
consent.addEventListener('click',e=>{if(e.target===consent)consentOpen(false);});
})();
