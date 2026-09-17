(()=>{ "use strict";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const AudioCtx=window.AudioContext||window.webkitAudioContext;
let audioCtx=null;
let soundOn=localStorage.getItem('shin-sfx')!=='off';
let musicOn=localStorage.getItem('shin-music')!=='off';
let bgm=null;
let uiBoot=null;
let musicUnlocked=false;
let saveTimer=0;

function beep(type='hover'){
  if(!soundOn||!AudioCtx)return;
  try{
    audioCtx ||= new AudioCtx();
    if(audioCtx.state==='suspended')audioCtx.resume();
    const o=audioCtx.createOscillator(),g=audioCtx.createGain(),n=audioCtx.currentTime;
    const f={hover:620,click:880,confirm:1040,alert:170}[type]||620;
    o.connect(g);g.connect(audioCtx.destination);o.type=type==='alert'?'sawtooth':'sine';
    o.frequency.setValueAtTime(f,n);o.frequency.exponentialRampToValueAtTime(f*1.35,n+.07);
    g.gain.setValueAtTime(type==='alert'?.035:.018,n);g.gain.exponentialRampToValueAtTime(.0001,n+(type==='alert'?.25:.09));
    o.start(n);o.stop(n+(type==='alert'?.25:.09));
  }catch(e){}
}

function initBoot(){
  const boot=$('#boot');
  if(!boot)return;
  if(sessionStorage.getItem('shin_boot_seen')){boot.classList.add('done');return}
  const log=$('#bootLog'),lines=['INITIALIZING ENDPOINT_OS...','CHECKING IDENTITY NODE...','LOADING STUDENT PROFILE...','SYNCING INTERESTS MODULES...','CALIBRATING MOTION SYSTEM...','ESTABLISHING VISUAL LINK...','SIGNAL: STABLE','ACCESS GRANTED.'];
  let i=0;
  const tick=()=>{
    if(i<lines.length){log.insertAdjacentHTML('beforeend',`<div><span>//</span> ${lines[i++]}</div>`);beep('hover');setTimeout(tick,95)}
    else{setTimeout(()=>boot.classList.add('done'),520);sessionStorage.setItem('shin_boot_seen','1')}
  };
  tick();
}

function initReveal(){
  const els=$$('.reveal');if(!els.length)return;
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('show');io.unobserve(e.target)}}),{threshold:.08});
  els.forEach(e=>io.observe(e));
}

function initMode(){
  const b=$('#modeBtn');if(!b)return;
  const sync=()=>{const bad=localStorage.getItem('system-mode')==='compromised';document.body.classList.toggle('system-compromised',bad);b.textContent=bad?'SYSTEM: COMPROMISED':'SYSTEM: ONLINE'};
  sync();
  b.onclick=()=>{beep('click');setTimeout(()=>{localStorage.setItem('system-mode',localStorage.getItem('system-mode')==='compromised'?'online':'compromised');sync();beep(document.body.classList.contains('system-compromised')?'alert':'confirm')},330)};
}

function ensureUiAudio(){
  if(!uiBoot){uiBoot=new Audio('assets/ui-boot.wav');uiBoot.preload='auto';uiBoot.volume=.52;}
  return uiBoot;
}

function unlockAudio(){
  if(musicUnlocked)return;
  musicUnlocked=true;
  ensureUiAudio();
  if(musicOn) playBgm();
  playBootCue();
}

function playBootCue(){
  if(!soundOn)return;
  const a=ensureUiAudio();
  try{a.currentTime=0;const p=a.play();if(p&&p.catch)p.catch(()=>{});}catch(e){}
}

function loadMusic(){
  if(bgm)return bgm;
  bgm=new Audio('assets/protocol-flow.mp3');
  bgm.loop=true;
  bgm.preload='auto';
  bgm.volume=.42;
  const saved=parseFloat(sessionStorage.getItem('shin-bgm-time')||'0');
  if(Number.isFinite(saved)&&saved>0) bgm.currentTime=saved;
  bgm.addEventListener('timeupdate',()=>sessionStorage.setItem('shin-bgm-time',String(bgm.currentTime)),{passive:true});
  bgm.addEventListener('ended',()=>{try{bgm.currentTime=0;bgm.play();}catch(e){}});
  return bgm;
}

function playBgm(){
  if(!musicOn)return;
  const a=loadMusic();
  try{a.volume=.42;const p=a.play();if(p&&p.catch)p.catch(()=>{document.body.classList.add('audio-awaiting-gesture')});else document.body.classList.remove('audio-awaiting-gesture');}catch(e){document.body.classList.add('audio-awaiting-gesture')}
}
function pauseBgm(){if(!bgm)return;try{bgm.pause();sessionStorage.setItem('shin-bgm-time',String(bgm.currentTime))}catch(e){}}
function setMusic(v){musicOn=v;localStorage.setItem('shin-music',v?'on':'off');if(v){playBgm()}else pauseBgm()}

function buildAudioDock(){
  const dock=document.createElement('div');dock.className='audio-dock';dock.innerHTML=`
    <div class="audio-visual"><span class="audio-bars"><i></i><i></i><i></i><i></i><i></i></span><span class="audio-label"><b>PROTOCOL FLOW</b><small>ENDPOINT // BACKGROUND SIGNAL</small></span></div>
    <button class="audio-btn music-toggle" type="button" aria-label="Toggle background music"><span class="music-state">BGM</span><b>${musicOn?'ON':'OFF'}</b></button>
    <button class="audio-btn sfx-toggle-inline" type="button" aria-label="Toggle interface sound effects"><span>SFX</span><b>${soundOn?'ON':'OFF'}</b></button>`;
  document.body.appendChild(dock);
  const m=dock.querySelector('.music-toggle'),s=dock.querySelector('.sfx-toggle-inline');
  m.addEventListener('click',e=>{e.stopPropagation();unlockAudio();setMusic(!musicOn);m.querySelector('b').textContent=musicOn?'ON':'OFF';beep('confirm')});
  s.addEventListener('click',e=>{e.stopPropagation();soundOn=!soundOn;localStorage.setItem('shin-sfx',soundOn?'on':'off');s.querySelector('b').textContent=soundOn?'ON':'OFF';if(soundOn){unlockAudio();beep('confirm')}});
}

function initAudio(){
  buildAudioDock();
  const prime=()=>unlockAudio();
  addEventListener('pointerdown',prime,{once:true,passive:true});
  addEventListener('keydown',prime,{once:true,passive:true});
  addEventListener('touchstart',prime,{once:true,passive:true});
  // Best-effort autoplay. Browsers may require one user gesture for unmuted media.
  if(musicOn)playBgm();
  // Re-enter the system sound on every page after the music has already been unlocked.
  if(musicUnlocked)playBootCue();
  addEventListener('pagehide',()=>{if(bgm)sessionStorage.setItem('shin-bgm-time',String(bgm.currentTime));});
}

function initSFX(){
  const interactive='a,.system-btn,.audio-btn,.archive-open,.contact-row,.profile-command,.target-btn,.ghost-btn';
  document.addEventListener('pointerover',e=>{const el=e.target.closest?.(interactive);if(el)beep('hover')},{passive:true});
  document.addEventListener('click',e=>{const el=e.target.closest?.(interactive);if(el)beep('click')},{passive:true});
}

function initTilt(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  $$('[data-tilt]').forEach(el=>{
    let raf=0,lastX=0,lastY=0;
    const render=()=>{raf=0;const r=el.getBoundingClientRect(),x=(lastX-r.left)/r.width-.5,y=(lastY-r.top)/r.height-.5;el.style.transform=`perspective(1200px) rotateX(${y*-3}deg) rotateY(${x*4}deg) translateZ(8px)`};
    el.addEventListener('mousemove',e=>{if(innerWidth<820)return;lastX=e.clientX;lastY=e.clientY;if(!raf)raf=requestAnimationFrame(render)},{passive:true});
    el.addEventListener('mouseleave',()=>{if(raf)cancelAnimationFrame(raf);el.style.transform=''},{passive:true});
  });
}

function initScramble(){
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%';
  $$('.scramble').forEach(el=>{const text=el.dataset.text||el.textContent;el.addEventListener('mouseenter',()=>{let n=0;clearInterval(el._scr);el._scr=setInterval(()=>{el.textContent=text.split('').map((c,i)=>c===' '||i<n?c:chars[(Math.random()*chars.length)|0]).join('');if(n++>text.length){clearInterval(el._scr);el.textContent=text}},26)})});
}

function initCursor(){
  if(matchMedia('(pointer:coarse)').matches)return;
  const aura=$('.cursor-aura'),line=$('.cursor-line');if(!aura&&!line)return;
  let tx=0,ty=0,raf=0;
  const render=()=>{raf=0;if(aura){aura.style.left=tx+'px';aura.style.top=ty+'px'}if(line)line.style.left=tx+'px';document.documentElement.style.setProperty('--mx',tx+'px');document.documentElement.style.setProperty('--my',ty+'px')};
  addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY;if(!raf)raf=requestAnimationFrame(render)},{passive:true});
  document.addEventListener('pointerover',e=>{const el=e.target.closest?.('a,.system-btn,.audio-btn');if(el&&aura)aura.classList.add('hot')},{passive:true});
  document.addEventListener('pointerout',e=>{if(aura&&!e.relatedTarget?.closest?.('a,.system-btn,.audio-btn'))aura.classList.remove('hot')},{passive:true});
}

function initHeroParallax(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const hero=$('#hero');if(!hero)return;
  const world=$('.hero-world'),c=$('.character-stage'),copy=$('.cinematic-copy');
  let x=0,y=0,raf=0;
  const render=()=>{raf=0;if(innerWidth<820)return;if(world)world.style.transform=`translate3d(${x*-12}px,${y*-8}px,0)`;if(c)c.style.transform=`translate3d(${x*10}px,${y*7}px,0) rotateY(${x*2}deg) rotateX(${y*-1.5}deg)`;if(copy)copy.style.transform=`translate3d(${x*-4}px,${y*-3}px,0)`};
  hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();x=(e.clientX-r.left)/r.width-.5;y=(e.clientY-r.top)/r.height-.5;if(!raf)raf=requestAnimationFrame(render)},{passive:true});
  hero.addEventListener('mouseleave',()=>{if(world)world.style.transform='';if(c)c.style.transform='';if(copy)copy.style.transform=''},{passive:true});
}

function initMagnetic(){
  if(matchMedia('(pointer:coarse)').matches)return;
  $$('.magnetic').forEach(el=>{let raf=0,lastX=0,lastY=0;el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();lastX=(e.clientX-r.left-r.width/2)*.12;lastY=(e.clientY-r.top-r.height/2)*.12;if(!raf)raf=requestAnimationFrame(()=>{raf=0;el.style.transform=`translate3d(${lastX}px,${lastY}px,0)`})},{passive:true});el.addEventListener('pointerleave',()=>{if(raf)cancelAnimationFrame(raf);el.style.transform=''},{passive:true})});
}

function initPageTransitions(){
  document.querySelectorAll('a[href$=".html"]').forEach(a=>a.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||a.target==='_blank')return;const href=a.getAttribute('href');if(!href)return;e.preventDefault();if(bgm)sessionStorage.setItem('shin-bgm-time',String(bgm.currentTime));playBootCue();document.body.classList.add('page-leaving');setTimeout(()=>location.href=href,320)}));
}

function initScroll(){
  let last=scrollY,raf=0,pending=0;
  addEventListener('scroll',()=>{pending=scrollY;if(raf)return;raf=requestAnimationFrame(()=>{raf=0;const d=pending-last;document.body.classList.toggle('scrolling-down',d>0);last=pending})},{passive:true});
}

initBoot();initReveal();initMode();initAudio();initSFX();initTilt();initScramble();initCursor();initHeroParallax();initMagnetic();initPageTransitions();initScroll();
})();
