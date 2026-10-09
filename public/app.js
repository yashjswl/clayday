/* clayday · dashboard app (data lives in Cloudflare D1 via /api) */
(()=>{
'use strict';
const {icon,sfx,toast}=Clay;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const dkey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const TODAY=()=>dkey(new Date());
const toMin=t=>{const [h,m]=t.split(':').map(Number);return h*60+m};
const fromMin=m=>`${pad(Math.floor(m/60))}:${pad(m%60)}`;
const fmt=m=>{const h=Math.floor(m/60),mm=m%60,ap=h>=12?'PM':'AM';return `${(h%12)||12}${mm?':'+pad(mm):''} ${ap}`};
const dur=m=>{const h=Math.floor(m/60),mm=m%60;return (h?h+'h ':'')+(mm?mm+'m':'')||'0m'};
const uid=()=>Math.random().toString(36).slice(2,9);

/* ---------- API ---------- */
async function api(path,opt={}){
  const r=await fetch('/api/'+path,{credentials:'same-origin',...opt,headers:{'content-type':'application/json',...(opt.headers||{})}});
  if(r.status===401&&path!=='login'){location.replace('/login');throw new Error('unauthorized')}
  let j={};try{j=await r.json()}catch(_){}
  if(!r.ok){const e=new Error(j.error||'Request failed');e.status=r.status;throw e}
  return j;
}

/* ---------- state ---------- */
const defaultHabits=[
  {id:'h1',e:'dumbbell',n:'Exercise'},{id:'h2',e:'book',n:'Reading'},{id:'h3',e:'drop',n:'Hydration'},
  {id:'h4',e:'target',n:'Focus hours'},{id:'h5',e:'lotus',n:'Meditate'}
];
let S={theme:'light',sound:true,days:{},tasks:[],habits:defaultHabits,log:{},notes:''};
let USER=null,rev=0,dirty=false,inflight=false,saveT=null;

function setSaveState(s){
  const el=$('#saveState');el.className='savestate'+(s==='saving'?' saving':s==='error'?' error':'');
  el.textContent=s==='saving'?'Saving…':s==='error'?'Offline – retrying':'Saved';
}
function save(){dirty=true;setSaveState('saving');clearTimeout(saveT);saveT=setTimeout(()=>flush(),700)}
async function flush(unloading){
  if(!dirty)return;
  if(inflight){saveT=setTimeout(()=>flush(),400);return}
  inflight=true;dirty=false;
  const body=JSON.stringify({data:S});
  try{
    const r=await fetch('/api/data',{method:'PUT',credentials:'same-origin',headers:{'content-type':'application/json'},body,keepalive:!!unloading&&body.length<60000});
    if(r.status===401){location.replace('/login');return}
    if(!r.ok)throw new Error((await r.json().catch(()=>({}))).error||'save failed');
    rev=(await r.json()).rev;
    setSaveState(dirty?'saving':'saved');
  }catch(e){dirty=true;setSaveState('error');clearTimeout(saveT);saveT=setTimeout(()=>flush(),5000)}
  finally{inflight=false}
}
function adopt(data){
  S=Object.assign({theme:'light',sound:true,days:{},tasks:[],habits:defaultHabits,log:{},notes:''},data||{});
}

function day(k=TODAY()){
  const d=S.days[k]||(S.days[k]={});
  d.prio=d.prio||[{t:'',d:false},{t:'',d:false},{t:'',d:false}];
  d.energy=d.energy||[];d.water=d.water||0;d.focusSessions=d.focusSessions||0;d.focusMin=d.focusMin||0;
  if(!d.blocks){
    d.blocks=k===TODAY()?[
      {id:uid(),t:'Morning routine',s:420,e:480,k:'pers'},
      {id:uid(),t:'Deep work: main project',s:540,e:660,k:'deep'},
      {id:uid(),t:'Team stand-up',s:690,e:720,k:'meet'},
      {id:uid(),t:'Lunch break',s:780,e:825,k:'brk'},
      {id:uid(),t:'Deep work: learning',s:870,e:960,k:'deep'},
      {id:uid(),t:'Daily review',s:1020,e:1050,k:'oth'}
    ]:[];
  }
  return d;
}
let selEnergy=null;

/* ---------- header ---------- */
function tickClock(){
  const n=new Date(),h=n.getHours();
  $('#clock').textContent=n.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
  $('#date').textContent=n.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'});
  $('#greet').textContent=h<5?'Burning the midnight oil':h<12?'Good morning':h<17?'Good afternoon':h<21?'Good evening':'Good night';
}
function applyPrefs(){
  Clay.applyTheme(S.theme);Clay.setSound(S.sound);
  $('#btnTheme').innerHTML=icon(S.theme==='dark'?'sun':'moon');
  $('#btnSound').innerHTML=icon(S.sound?'volon':'voloff');
}

/* ---------- KPIs ---------- */
function streakOf(id,from=new Date()){
  const L=S.log[id]||{};let d=new Date(from),n=0;
  if(!L[dkey(d)])d=addDays(d,-1);
  while(L[dkey(d)]){n++;d=addDays(d,-1)}
  return n;
}
function completedOn(k){
  const d=S.days[k];let n=d&&d.prio?d.prio.filter(p=>p.d&&p.t.trim()).length:0;
  return n+S.tasks.filter(t=>t.done&&t.doneAt===k).length;
}
const prevKpi={};
function countUp(el,to,key){
  const from=prevKpi[key]??0;prevKpi[key]=to;
  if(from===to){el.textContent=to;return}
  const t0=performance.now();
  (function f(t){const p=Math.min(1,(t-t0)/600),e=1-Math.pow(1-p,3);el.textContent=Math.round(from+(to-from)*e);if(p<1)requestAnimationFrame(f)})(t0);
}
function renderKPIs(){
  const d=day(),k=TODAY();
  const prioDone=d.prio.filter(p=>p.d&&p.t.trim()).length;
  const done=completedOn(k);
  const open=S.tasks.filter(t=>!t.done).length+d.prio.filter(p=>p.t.trim()&&!p.d).length;
  const streaks=S.habits.map(h=>streakOf(h.id));
  const active=streaks.filter(s=>s>0).length,best=Math.max(0,...streaks);
  const soon=S.tasks.filter(t=>!t.done&&t.due&&t.due<=dkey(addDays(new Date(),7))).length;
  const items=[
    ['check','Tasks done today',done,`${open} still open`,'done'],
    ['flame','Active streaks',active,`best run: ${best} day${best===1?'':'s'}`,'streak'],
    ['alarm','Deadlines this week',soon,soon?'keep an eye on them':'all clear','soon'],
    ['timer','Focus minutes',d.focusMin,`${d.focusSessions} session${d.focusSessions===1?'':'s'}`,'focus']
  ];
  const el=$('#kpis');
  if(!el.children.length){
    el.innerHTML=items.map((x,i)=>`<div class="clay kpi card" style="--i:${i}"><div class="badge" style="animation-delay:${i*-.8}s">${icon(x[0])}</div><div><div class="n" data-k="${x[4]}">0</div><div class="l" data-l="${x[4]}"></div></div></div>`).join('');
  }
  items.forEach(x=>{countUp(el.querySelector(`[data-k=${x[4]}]`),x[2],x[4]);el.querySelector(`[data-l=${x[4]}]`).textContent=x[1]+' · '+x[3]});
  $('#subline').textContent=`${prioDone}/3 priorities done · ${active} habit streak${active===1?'':'s'} running · ${soon} deadline${soon===1?'':'s'} ahead`;
}

/* ---------- timeline ---------- */
const H0=6,H1=23,HH=60;
function renderTimeline(){
  const d=day(),el=$('#tl');
  const top=m=>(m-H0*60)*HH/60;
  let h='';
  for(let i=H0;i<=H1;i++)h+=`<div class="hour"><div class="hl">${fmt(i*60)}</div><div class="ln"></div></div>`;
  const bl=[...d.blocks].sort((a,b)=>a.s-b.s);
  let body='',cur=8*60,i=0;
  const slot=(s,e)=>{if(e-s>=30)body+=`<div class="slot" data-act="slot" data-s="${s}" data-e="${e}" style="top:${top(s)+3}px;height:${top(e)-top(s)-6}px;animation-delay:${i++*50}ms">${icon('plus')} Open · ${dur(e-s)}</div>`};
  bl.forEach(b=>{
    if(b.s>cur)slot(cur,Math.min(b.s,20*60));
    cur=Math.max(cur,b.e);
  });
  if(cur<20*60)slot(cur,20*60);
  bl.forEach(b=>{
    const hgt=Math.max(30,top(b.e)-top(b.s)-4);
    body+=`<div class="blk ${b.k}${b.done?' done':''}" data-act="blk" data-id="${b.id}" data-on="${b.done?1:0}" style="top:${top(b.s)+2}px;height:${hgt}px;animation-delay:${i++*60}ms"><b>${esc(b.t)}</b><small>${fmt(b.s)} – ${fmt(b.e)} · ${dur(b.e-b.s)}</small><button class="x" data-act="delBlock" data-silent data-id="${b.id}" title="Delete" aria-label="Delete block">${icon('x')}</button></div>`;
  });
  const keep=el.scrollTop;
  el.innerHTML=`<div style="position:relative">${h}<div class="tlbody" style="height:${(H1-H0)*HH}px">${body}<div class="now" id="now"></div></div></div>`;
  el.scrollTop=keep;
  placeNow(true);
}
function placeNow(first){
  const n=$('#now');if(!n)return;
  const m=new Date().getHours()*60+new Date().getMinutes();
  if(m<H0*60||m>H1*60){n.style.display='none';return}
  n.style.display='';n.style.top=((m-H0*60)*HH/60)+'px';
  if(first){const tl=$('#tl');if(!tl.dataset.scrolled){tl.dataset.scrolled=1;tl.scrollTo({top:Math.max(0,(m-H0*60)*HH/60-140),behavior:'smooth'})}}
}

/* ---------- priorities ---------- */
const PCOL=['#ff8fb0','#ffb26b','#7d6bf0'];
let lastAllDone=false;
function renderPrios(){
  const d=day();
  $('#prios').innerHTML=d.prio.map((p,i)=>`<div class="prio${p.d?' done':''}" style="--k:${i}">
    <span class="num" style="background:${PCOL[i]}">${i+1}</span>
    <input type="text" data-prio="${i}" value="${esc(p.t)}" maxlength="120" aria-label="Priority ${i+1}" placeholder="${['Most important thing today…','Second priority…','Third priority…'][i]}" autocomplete="off">
    <button class="chk${p.d?' on':''}" data-act="prio" data-i="${i}" data-on="${p.d?1:0}" aria-label="Toggle priority ${i+1}"></button></div>`).join('');
  updatePrioBar(true);
}
function updatePrioBar(initial){
  const d=day(),filled=d.prio.filter(p=>p.t.trim()),done=filled.filter(p=>p.d).length;
  const pct=filled.length?Math.round(done/filled.length*100):0;
  $('#pBar').style.width=pct+'%';$('#pPct').textContent=pct+'%';$('#pCount').textContent=`${done}/${filled.length||3} done`;
  const all=filled.length===3&&done===3;
  if(all&&!lastAllDone&&!initial){confetti();toast('All three priorities crushed!','star');sfx('chime')}
  lastAllDone=all;
}

/* ---------- tasks ---------- */
let tFilter='all';
function dueTag(due){
  if(!due)return '';
  const diff=Math.round((new Date(due+'T00:00')-new Date(TODAY()+'T00:00'))/864e5);
  if(diff<0)return `<span class="tag warn">${-diff}d overdue</span>`;
  if(diff===0)return `<span class="tag warn">Today</span>`;
  if(diff===1)return `<span class="tag soon">Tomorrow</span>`;
  return `<span class="tag${diff<=3?' soon':''}">in ${diff}d</span>`;
}
function renderTasks(){
  const list=S.tasks.filter(t=>tFilter==='all'||(tFilter==='done'?t.done:!t.done));
  $('#tasks').innerHTML=list.length?list.map((t,i)=>`<div class="item${t.done?' done':''}" style="animation-delay:${Math.min(i,8)*40}ms">
    <button class="chk${t.done?' on':''}" data-act="task" data-id="${t.id}" data-on="${t.done?1:0}" aria-label="Toggle task"></button>
    <span class="tx">${esc(t.t)}</span>${t.done?'':dueTag(t.due)}
    <button class="x" data-act="delTask" data-silent data-id="${t.id}" aria-label="Delete task">${icon('x')}</button></div>`).join(''):`<div class="empty">${icon(tFilter==='done'?'sprout':'spark')}${tFilter==='done'?'Nothing finished yet':'No tasks here. Add one above!'}</div>`;
  $('#tCount').textContent=`${S.tasks.filter(t=>t.done).length}/${S.tasks.length} done`;
  const dl=S.tasks.filter(t=>!t.done&&t.due).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,6);
  $('#deadlines').innerHTML=dl.length?dl.map((t,i)=>`<div class="item" style="animation-delay:${i*50}ms"><span class="pinic">${icon('pin')}</span><span class="tx">${esc(t.t)}<br><span class="sub">${new Date(t.due+'T00:00').toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'})}</span></span>${dueTag(t.due)}</div>`).join(''):`<div class="empty">${icon('cal')}No deadlines set. Give a task a due date.</div>`;
}

/* ---------- habits ---------- */
const hIcon=n=>Clay.HABIT_ICONS.includes(n)?n:'star';
function renderHabits(){
  const days=[...Array(7)].map((_,i)=>addDays(new Date(),i-6));
  $('#habits').innerHTML=S.habits.length?S.habits.map((h,i)=>{
    const L=S.log[h.id]||{},on=!!L[TODAY()],st=streakOf(h.id);
    return `<div class="habit${on?' on':''}" style="--k:${i}">
      <button class="em" data-act="habit" data-id="${h.id}" data-d="${TODAY()}" data-on="${on?1:0}" aria-label="Toggle ${esc(h.n)} today">${icon(hIcon(h.e))}</button>
      <div class="mid"><div class="nm">${esc(h.n)}</div>
        <div class="dots">${days.map((d,j)=>{const k=dkey(d);return `<button class="dot${L[k]?' on':''}${j===6?' today':''}" data-act="habit" data-id="${h.id}" data-d="${k}" data-on="${L[k]?1:0}" title="${d.toLocaleDateString([],{weekday:'long'})}" aria-label="${esc(h.n)} on ${d.toLocaleDateString([],{weekday:'long'})}"></button>`}).join('')}</div></div>
      <div class="streak${st>=3?' hot':''}" title="Current streak">${icon(st>=3?'flame':'spark')}${st}</div>
      <button class="x" data-act="delHabit" data-silent data-id="${h.id}" title="Remove" aria-label="Remove habit">${icon('x')}</button></div>`}).join(''):`<div class="empty">${icon('spark')}No habits yet. Add one!</div>`;
}

/* ---------- energy ---------- */
const ecol=n=>{const hue=Math.round((n-1)/9*130);return [`hsl(${hue},85%,68%)`,`hsl(${hue+12},75%,56%)`]};
function renderEnergy(){
  const d=day();
  $('#scale').innerHTML=[...Array(10)].map((_,i)=>{const n=i+1,[a,b]=ecol(n);return `<button class="sc${selEnergy===n?' on':''}" data-act="scale" data-n="${n}" style="--c1:${a};--c2:${b}">${n}</button>`}).join('');
  $('#eLog').innerHTML=d.energy.length?[...d.energy].reverse().map((e,i)=>{const [a,b]=ecol(e.l);return `<div class="item" style="animation-delay:${i*40}ms"><span class="lv" style="--c1:${a};--c2:${b}">${e.l}</span><span class="tx">${e.note?esc(e.note):'<span class="sub">No note</span>'}<br><span class="sub">${esc(e.time)}</span></span><button class="x" data-act="delEnergy" data-silent data-id="${e.id}" aria-label="Delete entry">${icon('x')}</button></div>`}).join(''):`<div class="empty">No check-ins yet today</div>`;
  const days=[...Array(7)].map((_,i)=>addDays(new Date(),i-6));
  $('#eChart').innerHTML=days.map(dt=>{
    const k=dkey(dt),en=(S.days[k]||{}).energy||[],avg=en.length?en.reduce((a,b)=>a+b.l,0)/en.length:0;
    const [a,b]=avg?ecol(Math.round(avg)):['#cfc8ee','#cfc8ee'];
    return `<div class="cbar${k===TODAY()?' today':''}"><span>${avg?avg.toFixed(1):'–'}</span><i data-h="${avg*10}" style="--c1:${a};--c2:${b}"></i><span>${dt.toLocaleDateString([],{weekday:'short'}).slice(0,2)}</span></div>`}).join('');
  growBars('#eChart');
}
function growBars(sel){requestAnimationFrame(()=>requestAnimationFrame(()=>$$(sel+' i[data-h]').forEach(i=>i.style.height=Math.max(6,+i.dataset.h)+'%')))}
function renderWeek(){
  const days=[...Array(7)].map((_,i)=>addDays(new Date(),i-6));
  const vals=days.map(d=>completedOn(dkey(d))),mx=Math.max(3,...vals);
  $('#wChart').innerHTML=days.map((dt,i)=>`<div class="cbar${dkey(dt)===TODAY()?' today':''}"><span>${vals[i]}</span><i data-h="${vals[i]/mx*85}" style="--c1:var(--mint);--c2:var(--sky)"></i><span>${dt.toLocaleDateString([],{weekday:'short'}).slice(0,2)}</span></div>`).join('');
  growBars('#wChart');
}

/* ---------- water / mood / quote ---------- */
function renderWater(){
  const d=day();
  $('#glasses').innerHTML=[...Array(8)].map((_,i)=>`<button class="gl${i<d.water?' on':''}" data-act="water" data-i="${i}" aria-label="Glass ${i+1}"></button>`).join('');
  $('#wStat').textContent=`${d.water*250} / 2000 ml`;
  $('#moods').innerHTML=[1,2,3,4,5].map(n=>`<button class="mood${d.mood===n?' on':''}" data-act="mood" data-n="${n}" aria-label="Mood ${n} of 5">${icon('m'+n)}</button>`).join('');
}
const QUOTES=[['The secret of getting ahead is getting started.','Mark Twain'],['Small daily improvements lead to stunning results.','Robin Sharma'],['Focus on being productive instead of busy.','Tim Ferriss'],['You don’t have to be great to start, but you have to start to be great.','Zig Ziglar'],['Energy flows where attention goes.','Tony Robbins'],['Done is better than perfect.','Sheryl Sandberg'],['What you do every day matters more than what you do once in a while.','Gretchen Rubin']];
function renderQuote(){const q=QUOTES[Math.floor(Date.now()/864e5)%QUOTES.length];$('#quote').innerHTML=`“${esc(q[0])}”<small>— ${esc(q[1])}</small>`}

function renderAll(){renderKPIs();renderTimeline();renderPrios();renderTasks();renderHabits();renderEnergy();renderWeek();renderWater();$('#fStat').textContent=`${day().focusSessions} sessions today`;$('#notes').value=S.notes||''}
function refreshStats(){renderKPIs();renderWeek();renderTasks()}

/* ---------- confetti ---------- */
function confetti(){
  const cols=['#ff9fc4','#ffbf94','#8fe3c3','#8cd0ff','#a99bff','#ffe08a'];
  for(let i=0;i<34;i++){
    const c=document.createElement('div');c.className='confetti';
    const a=Math.random()*Math.PI*2,r=140+Math.random()*320;
    c.style.cssText=`left:${innerWidth/2}px;top:${innerHeight/2}px;background:${cols[i%6]};--dx:${Math.cos(a)*r}px;--dy:${Math.sin(a)*r+120}px;animation-delay:${Math.random()*.15}s`;
    document.body.appendChild(c);setTimeout(()=>c.remove(),2000);
  }
}

/* ---------- focus timer ---------- */
let tMin=25,tLeft=25*60,tRun=null;
function drawTimer(){
  const m=Math.floor(tLeft/60),s=tLeft%60;
  $('#tt').textContent=`${pad(m)}:${pad(s)}`;
  $('#pg').style.strokeDashoffset=339.3*(1-tLeft/(tMin*60));
  $('#ring').classList.toggle('run',!!tRun);
  $('#tStart').innerHTML=tRun?`${icon('pause')} Pause`:`${icon('play')} Start`;
  $('#tReset').innerHTML=`${icon('reset')} Reset`;
  document.title=tRun?`${pad(m)}:${pad(s)} · Focus`:'clayday';
}
function timerDone(){
  clearInterval(tRun);tRun=null;
  if(tMin>=25){const d=day();d.focusSessions++;d.focusMin+=tMin;save();$('#fStat').textContent=`${d.focusSessions} sessions today`;renderKPIs()}
  tLeft=tMin*60;drawTimer();sfx('chime');confetti();toast(tMin>=25?'Focus session complete. Take a break!':'Break over. Back to it!','timer');
}
function toggleTimer(){
  if(tRun){clearInterval(tRun);tRun=null}
  else{const end=Date.now()+tLeft*1000;tRun=setInterval(()=>{tLeft=Math.max(0,Math.round((end-Date.now())/1000));drawTimer();if(tLeft<=0)timerDone()},250)}
  drawTimer();
}

/* ---------- actions ---------- */
let habitIcon='star';
function renderPicker(){$('#picker').innerHTML=Clay.HABIT_ICONS.map(n=>`<button type="button" class="pick${n===habitIcon?' on':''}" data-act="pickIcon" data-n="${n}" aria-label="${n}">${icon(n)}</button>`).join('')}
const actions={
  prio(el){const d=day(),i=+el.dataset.i;if(!d.prio[i].t.trim()){toast('Write the priority first','note');$$('[data-prio]')[i].focus();return}d.prio[i].d=!d.prio[i].d;save();renderPrios();refreshStats()},
  task(el){const t=S.tasks.find(x=>x.id===el.dataset.id);t.done=!t.done;t.doneAt=t.done?TODAY():null;save();refreshStats()},
  delTask(el){S.tasks=S.tasks.filter(x=>x.id!==el.dataset.id);save();refreshStats()},
  habit(el){const L=S.log[el.dataset.id]=S.log[el.dataset.id]||{},k=el.dataset.d;if(L[k])delete L[k];else L[k]=true;save();renderHabits();renderKPIs()},
  delHabit(el){if(!confirm('Remove this habit and its history?'))return;S.habits=S.habits.filter(h=>h.id!==el.dataset.id);delete S.log[el.dataset.id];save();renderHabits();renderKPIs()},
  addHabit(){$('#hName').value='';habitIcon='star';renderPicker();$('#dlgHabit').showModal();$('#hName').focus()},
  pickIcon(el){habitIcon=el.dataset.n;renderPicker()},
  scale(el){selEnergy=+el.dataset.n;renderEnergy()},
  logEnergy(){
    if(!selEnergy){toast('Pick a level from 1–10 first','bolt');return}
    const d=day();d.energy.push({id:uid(),l:selEnergy,note:$('#eNote').value.trim().slice(0,300),time:new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})});
    selEnergy=null;$('#eNote').value='';save();renderEnergy();renderKPIs();toast('Energy logged','bolt');
  },
  delEnergy(el){const d=day();d.energy=d.energy.filter(e=>e.id!==el.dataset.id);save();renderEnergy()},
  water(el){const d=day(),n=+el.dataset.i+1;d.water=d.water===n?n-1:n;save();renderWater();if(d.water===8){toast('Hydration goal reached!','drop');confetti()}},
  mood(el){const d=day(),n=+el.dataset.n;d.mood=d.mood===n?null:n;save();renderWater()},
  addBlock(el,s,e){
    const now=new Date(),st=s??Math.ceil((now.getHours()*60+now.getMinutes())/15)*15;
    const end=Math.min((e??st+60),1439);
    $('#bTitle').value='';$('#bStart').value=fromMin(Math.min(st,1380));$('#bEnd').value=fromMin(end>st?end:Math.min(st+30,1439));
    $('#dlgBlock').showModal();$('#bTitle').focus();
  },
  slot(el){const s=+el.dataset.s,e=+el.dataset.e;actions.addBlock(null,s,Math.min(e,s+60))},
  blk(el){const b=day().blocks.find(x=>x.id===el.dataset.id);b.done=!b.done;save();renderTimeline()},
  delBlock(el){const d=day();d.blocks=d.blocks.filter(b=>b.id!==el.dataset.id);save();renderTimeline()}
};
document.addEventListener('click',ev=>{
  const el=ev.target.closest('[data-act]');
  if(el&&actions[el.dataset.act])actions[el.dataset.act](el,ev);
});

/* ---------- wiring ---------- */
function wire(){
  $('#taskForm').addEventListener('submit',e=>{
    e.preventDefault();const v=$('#taskText').value.trim();if(!v)return;
    S.tasks.unshift({id:uid(),t:v.slice(0,200),due:$('#taskDue').value||null,done:false});
    $('#taskText').value='';$('#taskDue').value='';save();refreshStats();
  });
  $('#tFilter').addEventListener('click',e=>{const c=e.target.closest('.chip');if(!c)return;tFilter=c.dataset.f;$$('#tFilter .chip').forEach(x=>x.classList.toggle('on',x===c));renderTasks()});
  $('#prios').addEventListener('change',e=>{const i=e.target.dataset.prio;if(i==null)return;const d=day();d.prio[i].t=e.target.value;if(!e.target.value.trim())d.prio[i].d=false;save();updatePrioBar();renderKPIs();renderWeek()});
  $('#prios').addEventListener('keydown',e=>{if(e.key==='Enter')e.target.blur()});
  $('#eNote').addEventListener('keydown',e=>{if(e.key==='Enter')actions.logEnergy()});
  let nt;
  $('#notes').addEventListener('input',e=>{S.notes=e.target.value.slice(0,20000);$('#noteSaved').textContent='saving…';clearTimeout(nt);nt=setTimeout(()=>{save();$('#noteSaved').textContent='saved'},500)});
  $('#btnTheme').addEventListener('click',()=>{S.theme=S.theme==='dark'?'light':'dark';save();applyPrefs()});
  $('#btnSound').addEventListener('click',()=>{S.sound=!S.sound;save();applyPrefs();sfx('up')});
  $('#btnExport').addEventListener('click',()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,2)],{type:'application/json'}));a.download=`clayday-${TODAY()}.json`;a.click();toast('Data exported','dl')});
  $('#btnImport').addEventListener('click',()=>$('#file').click());
  $('#file').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{const o=JSON.parse(t);if(!o.days||!o.habits)throw 0;adopt(o);save();applyPrefs();renderAll();toast('Data imported','ul')}catch(_){toast('That file doesn’t look right','x')}});e.target.value=''});
  $('#tStart').addEventListener('click',toggleTimer);
  $('#tReset').addEventListener('click',()=>{clearInterval(tRun);tRun=null;tLeft=tMin*60;drawTimer()});
  $$('[data-min]').forEach(b=>b.addEventListener('click',()=>{clearInterval(tRun);tRun=null;tMin=+b.dataset.min;tLeft=tMin*60;$$('[data-min]').forEach(x=>x.classList.toggle('on',x===b));drawTimer()}));
  $('#bCancel').addEventListener('click',()=>$('#dlgBlock').close());
  $('#hCancel').addEventListener('click',()=>$('#dlgHabit').close());
  $('#blockForm').addEventListener('submit',e=>{
    const s=toMin($('#bStart').value),en=toMin($('#bEnd').value);
    if(en<=s){e.preventDefault();toast('End time must be after start','alarm');return}
    day().blocks.push({id:uid(),t:$('#bTitle').value.trim().slice(0,80),s,e:en,k:$('#bType').value});save();renderTimeline();
  });
  $('#habitForm').addEventListener('submit',()=>{S.habits.push({id:uid(),e:habitIcon,n:$('#hName').value.trim().slice(0,30)});save();renderHabits();renderKPIs()});
  $$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));

  /* account */
  $('#btnAcct').addEventListener('click',()=>{
    $('#aName').textContent=USER.name;$('#aEmail').textContent=USER.email;
    ['pwCur','pwNew','delPw'].forEach(i=>$('#'+i).value='');['pwMsg','delMsg'].forEach(i=>{$('#'+i).textContent='';$('#'+i).className='msg'});
    $('#dlgAcct').showModal();
  });
  $('#aClose').addEventListener('click',()=>$('#dlgAcct').close());
  const admin=USER.role==='admin';
  $('#btnUsers').hidden=!admin;['delHr','delH','delForm'].forEach(i=>$('#'+i).hidden=admin);
  $('#btnUsers').addEventListener('click',()=>{$('#dlgAcct').close();$('#uMsg').textContent='';$('#dlgUsers').showModal();loadUsers()});
  $('#uClose').addEventListener('click',()=>$('#dlgUsers').close());
  $('#uGen').addEventListener('click',()=>{
    const cs='abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789',r=crypto.getRandomValues(new Uint32Array(14));
    $('#uPw').value=[...r].map(n=>cs[n%cs.length]).join('');
  });
  $('#addUserForm').addEventListener('submit',async e=>{
    e.preventDefault();
    try{
      const j=await api('admin/users',{method:'POST',body:JSON.stringify({name:$('#uName').value,email:$('#uEmail').value,password:$('#uPw').value})});
      const pw=$('#uPw').value;
      $('#uMsg').textContent=`Added ${j.user.name}. Share the password with them now: ${pw}`;$('#uMsg').className='msg ok';
      ['uName','uEmail','uPw'].forEach(i=>$('#'+i).value='');sfx('chime');loadUsers();
    }catch(er){$('#uMsg').textContent=er.message;$('#uMsg').className='msg bad';sfx('oops')}
  });
  $('#userList').addEventListener('click',async e=>{
    const b=e.target.closest('[data-uact]');if(!b)return;
    const id=b.dataset.id;
    try{
      if(b.dataset.uact==='del'){
        if(!confirm(`Delete ${b.dataset.nm} and all their data?`))return;
        await api('admin/users/'+id,{method:'DELETE'});toast('User deleted','trash');loadUsers();
      }else{
        const pw=prompt(`New password for ${b.dataset.nm} (8+ characters):`);if(!pw)return;
        await api(`admin/users/${id}/password`,{method:'POST',body:JSON.stringify({password:pw})});toast('Password reset. They were signed out.','shield');
      }
    }catch(er){toast(er.message,'x')}
  });
  $('#btnLogout').addEventListener('click',async()=>{await flush();try{await api('logout',{method:'POST'})}catch(_){}location.replace('/login')});
  const msg=(id,t,ok)=>{const m=$('#'+id);m.textContent=t;m.className='msg '+(ok?'ok':'bad')};
  $('#pwForm').addEventListener('submit',async e=>{
    e.preventDefault();
    try{await api('password',{method:'POST',body:JSON.stringify({current:$('#pwCur').value,next:$('#pwNew').value})});msg('pwMsg','Password updated. Other devices were signed out.',true);$('#pwCur').value=$('#pwNew').value='';sfx('chime')}
    catch(er){msg('pwMsg',er.message,false);sfx('oops')}
  });
  $('#delForm').addEventListener('submit',async e=>{
    e.preventDefault();
    if(!confirm('Really delete your account and all data? This cannot be undone.'))return;
    try{await api('account',{method:'DELETE',body:JSON.stringify({password:$('#delPw').value})});dirty=false;location.replace('/login')}
    catch(er){msg('delMsg',er.message,false);sfx('oops')}
  });
}

async function loadUsers(){
  try{
    const {users}=await api('admin/users');
    $('#userList').innerHTML=users.map(u=>`<div class="item"><span class="lv" style="--c1:#cfc6ff;--c2:#7d6bf0">${esc(u.name.charAt(0).toUpperCase())}</span>
      <span class="tx">${esc(u.name)}${u.role==='admin'?' <span class="tag">admin</span>':''}<br><span class="sub">${esc(u.email)}</span></span>
      ${u.id===USER.id?'':`<button class="btn sm" data-uact="pw" data-id="${u.id}" data-nm="${esc(u.name)}" data-silent>Reset</button><button class="x" data-uact="del" data-silent data-id="${u.id}" data-nm="${esc(u.name)}" aria-label="Delete user">${icon('trash')}</button>`}</div>`).join('');
  }catch(er){$('#userList').innerHTML=`<div class="empty">${esc(er.message)}</div>`}
}

/* ---------- multi-device sync: pick up newer data when you return to the tab ---------- */
async function resync(){
  if(dirty||inflight||document.hidden)return;
  try{const j=await api('data');if(!dirty&&!inflight&&j.rev>rev&&j.data){adopt(j.data);rev=j.rev;applyPrefs();renderAll()}}catch(_){}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)flush(true);else resync()});
addEventListener('pagehide',()=>flush(true));

/* ---------- boot ---------- */
(async()=>{
  try{
    const me=await api('me');USER=me.user;
    const j=await api('data');adopt(j.data);rev=j.rev;
  }catch(e){
    if(e.message!=='unauthorized'){
      $('#splash').innerHTML=`<div style="text-align:center"><div data-logo></div><p class="sub" style="margin-top:14px">Couldn’t reach the server. <a class="linkbtn" href="/">Try again</a></p></div>`;
      document.querySelectorAll('#splash [data-logo]').forEach(Clay.logo);
    }
    return;
  }
  $('#name').textContent=USER.name;$('#whoName').textContent=USER.name.split(' ')[0];
  applyPrefs();tickClock();renderQuote();wire();renderAll();drawTimer();setSaveState('saved');
  $('#splash').classList.add('hide');
  setInterval(()=>{tickClock();placeNow()},30000);
  let curDay=TODAY();setInterval(()=>{if(TODAY()!==curDay){curDay=TODAY();renderAll()}},60000);
})();
})();
