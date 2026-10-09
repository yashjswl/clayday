/* clayday · shared: icon sprite, logo, claymorphic sounds, ripple, toast */
(()=>{
'use strict';
const $=s=>document.querySelector(s);

/* ---------- colourful icon sprite ---------- */
const G=(id,a,b)=>`<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
const DEFS=G('gP','#cfc6ff','#7d6bf0')+G('gK','#ffc6dc','#ff6f9f')+G('gO','#ffd7b0','#ff8a4c')+G('gG','#bdf3da','#34c493')+G('gB','#c4e8ff','#4aa8f0')+G('gY','#fff3b8','#ffc532');
const INK='#3b3563';
const face=(g,mouth,extra='')=>`<circle cx="12" cy="12" r="10" fill="url(#${g})"/><ellipse cx="8.5" cy="6.5" rx="3.2" ry="1.7" fill="#fff" opacity=".45" transform="rotate(-25 8.5 6.5)"/>${extra}${mouth}`;
const eyes=`<circle cx="8.6" cy="10.2" r="1.35" fill="${INK}"/><circle cx="15.4" cy="10.2" r="1.35" fill="${INK}"/>`;
const ICONS={
  cal:`<rect x="3" y="5" width="18" height="16" rx="5" fill="url(#gB)"/><path d="M3 10a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v1H3z" fill="url(#gK)"/><rect x="7.2" y="2.4" width="2.6" height="5" rx="1.3" fill="#7d6bf0"/><rect x="14.2" y="2.4" width="2.6" height="5" rx="1.3" fill="#7d6bf0"/><rect x="6.5" y="13.5" width="3" height="3" rx="1" fill="#fff"/><rect x="10.5" y="13.5" width="3" height="3" rx="1" fill="#fff" opacity=".8"/><rect x="14.5" y="13.5" width="3" height="3" rx="1" fill="#fff" opacity=".6"/>`,
  target:`<circle cx="12" cy="12" r="10" fill="url(#gK)"/><circle cx="12" cy="12" r="6.8" fill="#fff"/><circle cx="12" cy="12" r="4.2" fill="url(#gK)"/><circle cx="12" cy="12" r="1.7" fill="url(#gY)"/>`,
  check:`<circle cx="12" cy="12" r="10" fill="url(#gG)"/><ellipse cx="8.5" cy="6.5" rx="3.2" ry="1.7" fill="#fff" opacity=".45" transform="rotate(-25 8.5 6.5)"/><path d="m7.2 12.4 3.2 3.2 6.4-6.8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  flame:`<path d="M12 1.8c.9 3.6 5.8 5.8 5.8 11.3a5.8 5.8 0 0 1-11.6 0c0-2.1.9-3.6 2.1-4.9.2 1.5.9 2.3 1.7 2.7C9.7 8.3 10.5 4.5 12 1.8z" fill="url(#gO)"/><path d="M12 21.3a3.2 3.2 0 0 1-3.2-3.2c0-1.9 1.6-2.9 2.4-4.5 1.3 1.1 4 2.4 4 4.5a3.2 3.2 0 0 1-3.2 3.2z" fill="url(#gY)"/>`,
  alarm:`<circle cx="5" cy="5.6" r="3" fill="url(#gO)"/><circle cx="19" cy="5.6" r="3" fill="url(#gO)"/><circle cx="12" cy="13" r="8.6" fill="url(#gK)"/><circle cx="12" cy="13" r="6.2" fill="#fff"/><path d="M12 9v4.4l2.8 1.8" fill="none" stroke="#7d6bf0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  timer:`<rect x="9.6" y="1.8" width="4.8" height="3" rx="1.5" fill="#7d6bf0"/><circle cx="12" cy="13.6" r="8.4" fill="url(#gP)"/><circle cx="12" cy="13.6" r="6" fill="#fff"/><path d="M12 13.6V9.4" stroke="#ff6f9f" stroke-width="2.2" stroke-linecap="round"/><path d="m18.2 6.6 1.6-1.6" stroke="#ffc532" stroke-width="2.2" stroke-linecap="round"/>`,
  bolt:`<path d="M13.8 1.8 4.6 13.4h6L9.4 22.2l10-12.4h-6.2z" fill="url(#gY)" stroke="#ff9d3c" stroke-width="1" stroke-linejoin="round"/>`,
  drop:`<path d="M12 2c3.8 4.7 6.4 7.7 6.4 11.4a6.4 6.4 0 0 1-12.8 0C5.6 9.7 8.2 6.7 12 2z" fill="url(#gB)"/><ellipse cx="9.4" cy="14" rx="1.4" ry="2.6" fill="#fff" opacity=".6" transform="rotate(12 9.4 14)"/>`,
  note:`<rect x="4" y="3" width="15" height="18" rx="4" fill="url(#gY)"/><path d="M8 8.5h7M8 12h7M8 15.5h4" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/><path d="m15.6 19.6.6-3 5.2-5.2a1.6 1.6 0 0 1 2.2 2.2l-5.2 5.2z" fill="url(#gP)" transform="translate(-1.6 .4)"/>`,
  chart:`<rect x="3" y="12" width="5.2" height="9" rx="2" fill="url(#gB)"/><rect x="9.4" y="3" width="5.2" height="18" rx="2" fill="url(#gK)"/><rect x="15.8" y="8" width="5.2" height="13" rx="2" fill="url(#gG)"/>`,
  sun:`<g stroke="#ffb02e" stroke-width="2.2" stroke-linecap="round"><path d="M12 1.8v2.4M12 19.8v2.4M1.8 12h2.4M19.8 12h2.4M4.8 4.8l1.7 1.7M17.5 17.5l1.7 1.7M4.8 19.2l1.7-1.7M17.5 6.5l1.7-1.7"/></g><circle cx="12" cy="12" r="5.6" fill="url(#gY)"/>`,
  moon:`<path d="M20.6 14.6A9 9 0 1 1 9.4 3.4a7.2 7.2 0 0 0 11.2 11.2z" fill="url(#gP)"/><circle cx="15.5" cy="6" r="1" fill="#fff" opacity=".7"/><circle cx="18.6" cy="9.6" r=".7" fill="#fff" opacity=".6"/>`,
  volon:`<path d="M3 9.5h3.6L11.6 5v14l-5-4.5H3z" fill="url(#gP)" stroke="#7d6bf0" stroke-width="1" stroke-linejoin="round"/><path d="M15 8.6a4.8 4.8 0 0 1 0 6.8M17.8 5.8a8.8 8.8 0 0 1 0 12.4" fill="none" stroke="#ff6f9f" stroke-width="2" stroke-linecap="round"/>`,
  voloff:`<path d="M3 9.5h3.6L11.6 5v14l-5-4.5H3z" fill="url(#gP)" stroke="#7d6bf0" stroke-width="1" stroke-linejoin="round" opacity=".7"/><path d="m15.4 9.4 5 5.2m0-5.2-5 5.2" stroke="#ff6f9f" stroke-width="2.2" stroke-linecap="round"/>`,
  dl:`<circle cx="12" cy="12" r="10" fill="url(#gB)"/><path d="M12 6.8v8m-3.8-3.6 3.8 3.8 3.8-3.8M7.8 17.8h8.4" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  ul:`<circle cx="12" cy="12" r="10" fill="url(#gG)"/><path d="M12 17.2v-8m-3.8 3.6L12 9l3.8 3.8M7.8 6.2h8.4" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  plus:`<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`,
  x:`<path d="m6.5 6.5 11 11m0-11-11 11" stroke="#ff6f9f" stroke-width="3" stroke-linecap="round"/>`,
  play:`<path d="M7 4.6v14.8a1.2 1.2 0 0 0 1.8 1l11.6-7.4a1.2 1.2 0 0 0 0-2L8.8 3.6A1.2 1.2 0 0 0 7 4.6z" fill="url(#gG)"/>`,
  pause:`<rect x="5" y="4" width="5" height="16" rx="2.2" fill="url(#gO)"/><rect x="14" y="4" width="5" height="16" rx="2.2" fill="url(#gO)"/>`,
  reset:`<path d="M5 12a7 7 0 1 0 2.2-5.1" fill="none" stroke="url(#gB)" stroke-width="3" stroke-linecap="round"/><path d="m3.4 3.8.6 5.2 5.2-.7z" fill="#4aa8f0" stroke="#4aa8f0" stroke-width="1.2" stroke-linejoin="round"/>`,
  pin:`<circle cx="12" cy="8" r="6" fill="url(#gK)"/><circle cx="10.2" cy="6.4" r="1.7" fill="#fff" opacity=".6"/><path d="M12 13.6v8" stroke="#7a74a6" stroke-width="2.2" stroke-linecap="round"/>`,
  spark:`<path d="M12 2c.8 5 2.9 7.2 8 8-5.1.8-7.2 3-8 8-.8-5-2.9-7.2-8-8 5.1-.8 7.2-3 8-8z" fill="url(#gY)"/><path d="m19 15.5.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5z" fill="url(#gK)"/>`,
  user:`<circle cx="12" cy="8" r="4.6" fill="url(#gP)"/><path d="M3.6 21c.4-4.6 3.8-7 8.4-7s8 2.4 8.4 7z" fill="url(#gK)"/>`,
  logout:`<path d="M4 4.6A2.6 2.6 0 0 1 6.6 2H12v20H6.6A2.6 2.6 0 0 1 4 19.4z" fill="url(#gO)"/><path d="M10 12h10m-3.6-3.8L20 12l-3.6 3.8" fill="none" stroke="#7d6bf0" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  lock:`<path d="M7.6 10.5V8a4.4 4.4 0 0 1 8.8 0v2.5" fill="none" stroke="#7d6bf0" stroke-width="2.6" stroke-linecap="round"/><rect x="4.4" y="10" width="15.2" height="11.4" rx="4" fill="url(#gO)"/><circle cx="12" cy="14.9" r="1.6" fill="#fff"/><path d="M12 15.5v2.2" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
  mail:`<rect x="2.5" y="5" width="19" height="14.4" rx="4.4" fill="url(#gB)"/><path d="m4.4 8.6 6.4 4.6a2 2 0 0 0 2.4 0l6.4-4.6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  eye:`<path d="M1.8 12S5.6 5.4 12 5.4 22.2 12 22.2 12 18.4 18.6 12 18.6 1.8 12 1.8 12z" fill="url(#gB)"/><circle cx="12" cy="12" r="3.8" fill="#fff"/><circle cx="12" cy="12" r="2" fill="#7d6bf0"/>`,
  eyeoff:`<path d="M1.8 12S5.6 5.4 12 5.4 22.2 12 22.2 12 18.4 18.6 12 18.6 1.8 12 1.8 12z" fill="url(#gB)" opacity=".55"/><circle cx="12" cy="12" r="3.2" fill="#fff" opacity=".8"/><path d="m4 20 16-16" stroke="#ff6f9f" stroke-width="2.6" stroke-linecap="round"/>`,
  trash:`<path d="M9 3.6a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 3.6V5H9z" fill="#7d6bf0"/><rect x="3.4" y="4.4" width="17.2" height="3.2" rx="1.6" fill="url(#gP)"/><path d="M5.6 9h12.8l-.9 10.2a2.6 2.6 0 0 1-2.6 2.4H9.1a2.6 2.6 0 0 1-2.6-2.4z" fill="url(#gK)"/><path d="M10 11.6v6m4-6v6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`,
  shield:`<path d="M12 2 4 5.2v6c0 5 3.3 8.6 8 10.8 4.7-2.2 8-5.8 8-10.8v-6z" fill="url(#gG)"/><path d="m8.4 12 2.6 2.6 4.6-5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  /* habit icons */
  dumbbell:`<rect x="2" y="8.4" width="3.4" height="7.2" rx="1.6" fill="url(#gK)"/><rect x="5" y="6" width="3.6" height="12" rx="1.8" fill="url(#gP)"/><rect x="8.4" y="10.8" width="7.2" height="2.4" fill="#a39fc9"/><rect x="15.4" y="6" width="3.6" height="12" rx="1.8" fill="url(#gP)"/><rect x="18.6" y="8.4" width="3.4" height="7.2" rx="1.6" fill="url(#gK)"/>`,
  book:`<path d="M12 6.4C10 4.6 6.6 4 3 4.6v13.8c3.6-.6 7 0 9 1.8z" fill="url(#gB)"/><path d="M12 6.4c2-1.8 5.4-2.4 9-1.8v13.8c-3.6-.6-7 0-9 1.8z" fill="url(#gP)"/><path d="M5.6 8.4c1.6-.2 3 0 4.2.6M5.6 11.6c1.6-.2 3 0 4.2.6" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".8"/>`,
  lotus:`<path d="M12 4c2.8 2.4 3.8 5.6 0 10-3.8-4.4-2.8-7.6 0-10z" fill="url(#gK)"/><path d="M3 9c3.6-.2 6.2 1.4 7.4 5.4-4 1-7.2-.6-7.4-5.4zM21 9c-.2 4.8-3.4 6.4-7.4 5.4C14.8 10.4 17.4 8.8 21 9z" fill="url(#gP)"/><path d="M5 20c3-3.2 11-3.2 14 0" fill="none" stroke="url(#gG)" stroke-width="2.6" stroke-linecap="round"/>`,
  star:`<path d="m12 2.4 2.9 6 6.5.9-4.7 4.6 1.1 6.5L12 17.2l-5.8 3.2 1.1-6.5L2.6 9.3l6.5-.9z" fill="url(#gY)" stroke="#ffb02e" stroke-width="1" stroke-linejoin="round"/>`,
  heart:`<path d="M12 21C5 15.6 2.4 12.2 2.4 8.6a5 5 0 0 1 9.6-2 5 5 0 0 1 9.6 2c0 3.6-2.6 7-9.6 12.4z" fill="url(#gK)"/><ellipse cx="7" cy="8" rx="1.6" ry="2.4" fill="#fff" opacity=".5" transform="rotate(25 7 8)"/>`,
  music:`<path d="M9 17.4V5.6l11-2.2v11.8" fill="none" stroke="#7d6bf0" stroke-width="2.4" stroke-linejoin="round"/><circle cx="6.4" cy="17.6" r="3.4" fill="url(#gK)"/><circle cx="17.4" cy="15.4" r="3.4" fill="url(#gB)"/>`,
  code:`<rect x="2" y="4" width="20" height="16" rx="5" fill="url(#gP)"/><path d="m9.6 9-3 3 3 3m4.8-6 3 3-3 3" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  apple:`<path d="M12 7.6c-2-1.6-7-1.2-7 4.6 0 4.4 3 9.2 5.2 9.2 1.2 0 1.2-.8 1.8-.8s.6.8 1.8.8c2.2 0 5.2-4.8 5.2-9.2 0-5.8-5-6.2-7-4.6z" fill="url(#gK)"/><path d="M12 7.6c0-2.4 1-4.4 3.4-5.2.4 2.6-.8 4.6-3.4 5.2z" fill="url(#gG)"/>`,
  coffee:`<path d="M17 9h1.6a3.2 3.2 0 0 1 0 6.4H17" fill="none" stroke="url(#gP)" stroke-width="2.4"/><path d="M3.6 8.4h13.4v6.4a5.2 5.2 0 0 1-5.2 5.2H8.8a5.2 5.2 0 0 1-5.2-5.2z" fill="url(#gO)"/><path d="M7.6 2.6c-.8 1.2.8 1.8 0 3m3.6-3c-.8 1.2.8 1.8 0 3" stroke="#a39fc9" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,
  sprout:`<path d="M12 21v-9" stroke="#34c493" stroke-width="2.6" stroke-linecap="round"/><path d="M12 13C12 8 8 5.4 3.4 5.8 3.2 10.6 6.6 13.6 12 13z" fill="url(#gG)"/><path d="M12 11c0-4.4 3.2-7 8-6.8.2 4.8-3 7.4-8 6.8z" fill="url(#gY)"/>`,
  /* moods */
  m1:face('gB',`<path d="M8.6 16.4q3.4-3 6.8 0" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`,eyes+`<path d="M17.6 12.4c.8 1.2 1 2.2 0 2.8-1-.6-.8-1.6 0-2.8z" fill="#fff" opacity=".9"/>`),
  m2:face('gP',`<path d="M9 16q3-1.8 6 0" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`,eyes),
  m3:face('gY',`<path d="M9 15.4h6" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`,eyes),
  m4:face('gG',`<path d="M8.4 14.2q3.6 3.8 7.2 0" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`,eyes+`<circle cx="6.4" cy="13.4" r="1.4" fill="#ff6f9f" opacity=".5"/><circle cx="17.6" cy="13.4" r="1.4" fill="#ff6f9f" opacity=".5"/>`),
  m5:face('gO',`<path d="M7.8 13.4h8.4a4.2 4.2 0 0 1-8.4 0z" fill="${INK}"/><path d="M9.4 15.6q2.6 1.4 5.2 0" stroke="#ff6f9f" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,`<path d="m8.6 7.8.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2L5.7 10l2-.3z" fill="#ffe36b" stroke="#ffb02e" stroke-width=".6"/><path d="m15.4 7.8.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2L12.5 10l2-.3z" fill="#ffe36b" stroke="#ffb02e" stroke-width=".6" transform="translate(0 0)"/>`)
};
const HABIT_ICONS=['dumbbell','book','drop','target','lotus','star','heart','moon','music','code','apple','coffee','sprout','sun'];

function mountSprite(){
  if($('#clay-sprite'))return;
  const s=document.createElementNS('http://www.w3.org/2000/svg','svg');
  s.id='clay-sprite';s.setAttribute('width','0');s.setAttribute('height','0');s.style.cssText='position:absolute;pointer-events:none';
  s.innerHTML=`<defs>${DEFS}</defs>`+Object.entries(ICONS).map(([k,v])=>`<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('');
  document.body.prepend(s);
}
const icon=(n,cls='')=>`<svg class="i ${cls}" aria-hidden="true" focusable="false"><use href="#i-${n}"/></svg>`;
function hydrate(root=document){root.querySelectorAll('[data-i]').forEach(e=>{if(!e.dataset.done){e.insertAdjacentHTML('afterbegin',icon(e.dataset.i));e.dataset.done=1}})}

/* ---------- logo: "clayday", just playing with type ---------- */
const LOGO=[
  ['c',-6,1,1.02],['l',3,-2,1.12],['a',-3,2,.98],['y',6,3,1.06],['d',-4,-2,1.12],['a',4,2,.98],['y',-3,3,1.06]
];
function logo(el){
  el.classList.add('logo');el.setAttribute('role','img');el.setAttribute('aria-label','clayday');
  el.innerHTML=LOGO.map((l,i)=>`<b aria-hidden="true" style="--r:${l[1]}deg;--y:${l[2]}px;--sc:${l[3]};--n:${i}">${l[0]}</b>`).join('');
}

/* ---------- claymorphic click sounds ---------- */
const Clay={icon,logo,hydrate,HABIT_ICONS,soundOn:true};
try{Clay.soundOn=localStorage.getItem('clayday.sound')!=='0'}catch(e){}
let ctx=null,noiseBuf=null;
function audio(){
  if(!ctx){try{ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}
  if(ctx.state==='suspended')ctx.resume();
  return ctx;
}
function noise(c){
  if(noiseBuf)return noiseBuf;
  noiseBuf=c.createBuffer(1,c.sampleRate*.1,c.sampleRate);
  const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  return noiseBuf;
}
function bloop(c,t,f0,f1,vol,len){
  const o=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter();
  o.type='sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+len*.8);
  lp.type='lowpass';lp.frequency.value=1800;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+len);
  o.connect(lp).connect(g).connect(c.destination);o.start(t);o.stop(t+len+.02);
  const o2=c.createOscillator(),g2=c.createGain();
  o2.type='triangle';o2.frequency.setValueAtTime(f0/2,t);o2.frequency.exponentialRampToValueAtTime(f1/2,t+len*.8);
  g2.gain.setValueAtTime(.0001,t);g2.gain.exponentialRampToValueAtTime(vol*.5,t+.01);g2.gain.exponentialRampToValueAtTime(.0001,t+len);
  o2.connect(g2).connect(c.destination);o2.start(t);o2.stop(t+len+.02);
}
function squish(c,t,vol){
  const s=c.createBufferSource(),bp=c.createBiquadFilter(),g=c.createGain();
  s.buffer=noise(c);bp.type='bandpass';bp.frequency.value=700;bp.Q.value=.9;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+.06);
  s.connect(bp).connect(g).connect(c.destination);s.start(t);s.stop(t+.08);
}
Clay.sfx=(kind='pop')=>{
  if(!Clay.soundOn)return;
  const c=audio();if(!c)return;
  const t=c.currentTime,j=1+(Math.random()-.5)*.12;
  switch(kind){
    case 'up':bloop(c,t,330*j,620*j,.28,.2);squish(c,t,.05);break;
    case 'down':bloop(c,t,420*j,200*j,.26,.2);squish(c,t,.05);break;
    case 'chime':[523.25,659.25,783.99,1046.5].forEach((f,i)=>bloop(c,t+i*.09,f,f*.97,.22,.45));break;
    case 'soft':bloop(c,t,260*j,150*j,.2,.14);break;
    case 'oops':bloop(c,t,240*j,120*j,.3,.3);bloop(c,t+.11,200*j,100*j,.26,.3);break;
    default:bloop(c,t,380*j,170*j,.3,.16);squish(c,t,.06);
  }
};
Clay.setSound=on=>{Clay.soundOn=on;try{localStorage.setItem('clayday.sound',on?'1':'0')}catch(e){}};

/* every click: sound + ripple */
document.addEventListener('click',ev=>{
  const t=ev.target;
  const on=t.closest&&t.closest('[data-on]');
  if(on&&!t.closest('[data-silent]'))Clay.sfx(on.dataset.on==='1'?'down':'up');
  else if(t.closest&&t.closest('input,textarea,select'))Clay.sfx('soft');
  else Clay.sfx('pop');
  const r=document.createElement('div');r.className='ripple';r.style.left=ev.clientX+'px';r.style.top=ev.clientY+'px';
  document.body.appendChild(r);setTimeout(()=>r.remove(),600);
},true);

/* ---------- toast ---------- */
let tt;
Clay.toast=(msg,ic='spark')=>{
  let t=$('#toast');
  if(!t){t=document.createElement('div');t.id='toast';t.className='toast clay';t.setAttribute('role','status');document.body.appendChild(t)}
  t.innerHTML=`${icon(ic)}<span></span>`;t.lastChild.textContent=msg;
  t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2800);
};

/* ---------- theme (device-level, so the login page matches) ---------- */
Clay.applyTheme=th=>{document.documentElement.dataset.theme=th;try{localStorage.setItem('clayday.theme',th)}catch(e){}};
try{const th=localStorage.getItem('clayday.theme');if(th)document.documentElement.dataset.theme=th}catch(e){}

window.Clay=Clay;
const boot=()=>{mountSprite();hydrate();document.querySelectorAll('[data-logo]').forEach(logo)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
