const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const COL=['#0a5cff','#00c8ff','#6a5cff','#00e0b8','#ff3d9a','#ffb020','#22c55e','#f97316','#ef4444','#8b5cf6'];
let user=null;const KEY=()=>'studyplanner.v2.'+user;
function load(){try{const x=JSON.parse(localStorage.getItem(KEY()));if(x&&x.subjects)return x}catch(e){}
 return{subjects:[{id:1,name:'Mathematics',c:COL[0]},{id:2,name:'Science',c:COL[1]},{id:3,name:'English',c:COL[2]}],tasks:[],log:[],goal:120,nid:10}}
let D=null,tab='Dashboard',flt='All';
const save=()=>{try{localStorage.setItem(KEY(),JSON.stringify(D))}catch(e){}};
const TABS=[['Dashboard','dash'],['Tasks','task'],['Syllabus','book'],['Progress','ok'],['Analytics','chart']];
const ic=n=>`<svg class="ic"><use href="#i-${n}"/></svg>`;
const dk=d=>(d||new Date()).toLocaleDateString('en-CA');
const mins=d=>D.log.filter(l=>l.d===d).reduce((a,l)=>a+l.m,0);
const tot=()=>D.log.reduce((a,l)=>a+l.m,0);
const fmt=m=>m>=60?Math.floor(m/60)+'h'+(m%60?' '+m%60+'m':''):m+'m';
const sub=id=>D.subjects.find(s=>s.id==id)||{name:'General',c:'#64748b'};
const last7=()=>[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d});
function streak(){let c=0;const d=new Date();if(!mins(dk(d)))d.setDate(d.getDate()-1);while(mins(dk(d))){c++;d.setDate(d.getDate()-1)}return c}
const opts=(v)=>D.subjects.map(s=>`<option value="${s.id}" ${s.id==v?'selected':''}>${esc(s.name)}</option>`).join('')||'<option value="0">General</option>';
const fd=s=>new Date(s+'T00:00').toLocaleDateString('en',{month:'short',day:'numeric'});

function taskRow(x,full){const od=!x.done&&x.due&&x.due<dk();
 return `<div class="task ${x.done?'done':''}"><button class="chk ${x.done?'on':''}" data-a="tog" data-i="${x.id}" aria-label="Toggle task">${x.done?ic('ok'):''}</button>
 <div class="t"><b>${esc(x.title)}</b><span class="mu"><span class="dot" style="background:${sub(x.s).c}"></span>${esc(sub(x.s).name)}${x.due?' · Due '+fd(x.due):''}${od?' · <span style="color:var(--bad)">Overdue</span>':''}</span></div>
 ${full?`<button class="x" data-a="del" data-i="${x.id}" aria-label="Delete task">${ic('x')}</button>`:''}</div>`}
function ring(p,inner,col){const C=2*Math.PI*65;return `<div class="ring"><svg width="150" height="150" viewBox="0 0 150 150"><circle cx="75" cy="75" r="65" stroke="var(--bd)"/><circle id="${col||''}" cx="75" cy="75" r="65" stroke="var(--ac)" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-Math.min(1,p))}" style="transition:stroke-dashoffset .8s"/></svg><div class="c">${inner}</div></div>`}
const head=(t,s)=>`<h1>${t}</h1><p class="sub">${s}</p>`;

const V={};
const tmin=t=>{const[a,b]=t.split(':');return +a*60+ +b};
const hm=m=>{m=m%1440;const h=Math.floor(m/60),n=m%60;return(h%12||12)+':'+String(n).padStart(2,'0')+(h<12?' AM':' PM')};
const TC={sleep:'#6a5cff',college:'#0a5cff',study:'#00c8ff',act:'#ff3d9a',free:'#94a3b8'};
function buildTT(p){const T=[],sl=tmin(p.sl),wk=tmin(p.wk);
 if(sl>wk){T.push({n:'Sleep',s:0,e:wk,k:'sleep'},{n:'Sleep',s:sl,e:1440,k:'sleep'})}else T.push({n:'Sleep',s:sl,e:wk,k:'sleep'});
 T.push({n:'College',s:tmin(p.cs),e:tmin(p.ce),k:'college'});
 const ss=tmin(p.ss);T.push({n:'Study ('+p.sh+' h goal)',s:ss,e:Math.min(1440,ss+Math.round(p.sh*60)),k:'study'});
 if(p.an)T.push({n:p.an,s:tmin(p.as),e:tmin(p.ae),k:'act'});
 T.sort((a,b)=>a.s-b.s);const R=[];let c=0;
 T.forEach(b=>{if(b.s>c)R.push({n:'Free time, meals and rest',s:c,e:b.s,k:'free'});if(b.s<c)b.o=1;R.push(b);c=Math.max(c,b.e)});
 if(c<1440)R.push({n:'Free time, meals and rest',s:c,e:1440,k:'free'});return R}
let editing=false;
const pad=n=>String(n).padStart(2,'0');
const to12=t=>{if(!t)return['',''];const[a,b]=t.split(':').map(Number);return[(a%12||12)+':'+pad(b),a<12?'AM':'PM']};
const parseT=(x,ap)=>{const m=x.trim().match(/^(\d{1,2})(?:[:.]?(\d{2}))?$/);if(!m)return'';const h=+m[1],n=+(m[2]||0);if(h<1||h>12||n>59)return'';return pad(h%12+(ap==='PM'?12:0))+':'+pad(n)};
const tfld=(id,l,v)=>{const[t,ap]=to12(v);return `<div class="fld"><label for="p_${id}">${l}</label><div style="display:flex;gap:6px"><input id="p_${id}" type="text" inputmode="numeric" placeholder="7:30" value="${t}"><select id="p_${id}_ap" style="width:78px;flex:none"><option>AM</option><option ${ap==='PM'?'selected':''}>PM</option></select></div></div>`};
const fld=(id,l,t,v,x)=>`<div class="fld"><label for="p_${id}">${l}</label><input id="p_${id}" type="${t}" value="${v||''}" ${x||''}></div>`;
V.Setup=()=>{const p=D.prof||{};
 return head(D.prof?'Edit your schedule':'Set up your day','Tell us about your day and we will build your timetable. Nothing is assumed.')+
 `<div class="card"><div class="sec" style="margin-top:0">Sleep</div><div class="row">${tfld('sl','Go to sleep at',p.sl)}${tfld('wk','Wake up at',p.wk)}</div>
 <div class="sec">College</div><div class="row">${tfld('cs','Leave for / start college',p.cs)}${tfld('ce','Back / finish at',p.ce)}</div>
 <div class="sec">Study</div><div class="row">${tfld('ss','Start studying at',p.ss)}${fld('sh','Hours you will study today','number',p.sh,'min="0.5" max="16" step="0.5" placeholder="e.g. 3"')}</div>
 <div class="sec">Other activity (optional)</div><div class="row">${fld('an','Activity name','text',p.an,'placeholder="e.g. Sports, Music"')}${tfld('as','From',p.as)}${tfld('ae','To',p.ae)}</div>
 <p class="aerr" id="perr"></p><div style="display:flex;gap:10px"><button class="btn" data-a="setup">Generate timetable</button>${D.prof?'<button class="btn ghost" data-a="cancel">Cancel</button>':''}</div></div>`};
V.Dashboard=()=>{const t=mins(dk()),goal=D.goal,pct=Math.min(100,Math.round(t/goal*100)),tp=D.log.filter(l=>l.d===dk()&&l.t),now=new Date().getHours()*60+new Date().getMinutes(),h=new Date().getHours();
 const TT=buildTT(D.prof),G=[];
 D.log.filter(l=>l.d===dk()).forEach(l=>{let x=G.find(q=>q.k===l.s);if(!x){x={k:l.s,...sub(l.s),m:0};G.push(x)}x.m+=l.m});
 const topc=G.length?G[G.length-1].c:'var(--ac2)';
 return head((h<12?'Good morning':h<18?'Good afternoon':'Good evening')+', '+esc(user),new Date().toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric'}))+
 `<div class="cols two"><div class="card"><h2>Today’s water jar</h2><div class="jarwrap"><div class="jar"><div class="water" data-h="${pct}">${G.map(x=>`<div class="lay" style="flex-grow:${x.m};background:${x.c}"></div>`).join('')}<svg class="wv" viewBox="0 0 200 20" preserveAspectRatio="none"><path style="fill:${topc}" d="M0 10 Q25 0 50 10 T100 10 T150 10 T200 10 V20 H0Z"/></svg><i></i><i></i><i></i></div><div class="pc">${pct}%</div></div>
 <div style="flex:1;min-width:150px"><div class="stat"><b>${fmt(t)}</b><span>of ${fmt(goal)} planned today</span></div><p class="mu" style="margin:12px 0 0">${pct>=100?'The jar is full. Great work today.':fmt(goal-t)+' more to fill the jar.'}</p><p class="mu" style="margin:6px 0 0">Streak: ${streak()} day${streak()==1?'':'s'} · Topics today: ${tp.length}</p>
 <div style="margin-top:10px">${G.map(x=>`<div class="sp" style="padding:3px 0"><span><span class="dot" style="background:${x.c}"></span>${esc(x.name)}</span><span class="mu">${fmt(x.m)}</span></div>`).join('')}</div></div></div></div>
 <div class="card"><h2>Add what you studied</h2><div class="row"><select id="dls">${opts()}</select><input id="dlt" placeholder="Topic completed (optional)"></div><div class="row"><input id="dlm" type="number" min="1" placeholder="Minutes studied"></div><button class="btn" data-a="dlog">Pour into jar</button><p class="msg">${tm.msg}</p>
 ${tp.length?'<div style="margin-top:10px">'+tp.map(l=>`<div class="sp" style="padding:4px 0"><span><span class="dot" style="background:${sub(l.s).c}"></span>${esc(l.t)}</span><span class="mu">${fmt(l.m)}</span></div>`).join('')+'</div>':''}</div></div>
 ${exams()}
 <div class="card"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px"><h2 style="margin:0">Your timetable</h2><button class="btn ghost" data-a="edit" style="padding:7px 14px">Edit schedule</button></div>
 ${TT.map(b=>`<div class="tt ${now>=b.s&&now<b.e?'now':''}" style="--c:${TC[b.k]}"><div class="tm">${hm(b.s)} – ${b.e>=1440?'12:00 AM':hm(b.e)}</div><div class="bl">${esc(b.n)}${b.o?'<span style="color:var(--bad)">Overlaps the previous block</span>':''}</div></div>`).join('')}</div>`};


V.Syllabus=()=>head('Syllabus','Add your subjects, then track chapters and set exam dates.')+`<div class="card"><h2>Add a subject</h2><div style="display:flex;gap:8px"><input id="ns" placeholder="e.g. Physics"><button class="btn" data-a="as">Add</button></div></div>`+(D.subjects.length?D.subjects.map(x=>{const c=x.ch||[];return `<div class="card"><div class="sp"><span><span class="dot" style="background:${x.c}"></span><b>${esc(x.name)}</b></span><span style="display:flex;align-items:center;gap:6px"><span class="mu">${spct(x)}% done</span><button class="x" data-a="ds" data-i="${x.id}" aria-label="Remove subject">${ic('x')}</button></span></div><div class="hb"><i style="width:${spct(x)}%;background:${x.c}"></i></div>
 <div class="fld" style="margin-bottom:12px"><label>Exam date</label><input type="date" data-ex="${x.id}" value="${x.ex||''}"></div>
 ${c.map(k=>`<div class="task ${k.done?'done':''}"><button class="chk ${k.done?'on':''}" data-a="tc" data-i="${x.id}" data-c="${k.id}" aria-label="Toggle chapter">${k.done?ic('ok'):''}</button><div class="t"><b>${esc(k.n)}</b></div><button class="x" data-a="dc" data-i="${x.id}" data-c="${k.id}" aria-label="Delete chapter">${ic('x')}</button></div>`).join('')}
 <div style="display:flex;gap:8px;margin-top:12px"><input id="nc_${x.id}" placeholder="Add a chapter or topic"><button class="btn ghost" data-a="ac" data-i="${x.id}">Add</button></div></div>`}).join(''):'<div class="card"><p class="empty">No subjects yet. Add one above.</p></div>');

V.Tasks=()=>{const L=D.tasks.filter(x=>flt==='All'||(flt==='Pending')===!x.done).sort((a,b)=>a.done-b.done||((a.due||'9')>(b.due||'9')?1:-1));
 return head('Tasks','Plan your work and track what you have completed.')+
 `<div class="card"><h2>New task</h2><input id="tt" placeholder="What do you need to study?" style="margin-bottom:10px"><div class="row"><select id="ts">${opts()}</select><input id="td" type="date"></div><button class="btn" data-a="add">Add task</button></div>
 <div class="card"><h2>All tasks</h2><div class="pills">${['All','Pending','Completed'].map(f=>`<button class="pill ${f===flt?'on':''}" data-a="flt" data-i="${f}">${f}</button>`).join('')}</div>${L.length?L.map(x=>taskRow(x,true)).join(''):'<p class="empty">Nothing to show here yet.</p>'}</div>`};

const daysTo=d=>Math.ceil((new Date(d+'T00:00')-new Date(new Date().toDateString()))/864e5);
const spct=x=>{const c=x.ch||[];return c.length?Math.round(c.filter(k=>k.done).length/c.length*100):0};
function exams(){const L=D.subjects.filter(x=>x.ex&&daysTo(x.ex)>=0).sort((a,b)=>a.ex>b.ex?1:-1);
 const w=L.map(x=>(1/Math.max(1,daysTo(x.ex)))*(1+(1-spct(x)/100))),sum=w.reduce((a,b)=>a+b,0)||1;
 return `<div class="card"><h2>Exam countdown</h2>${L.length?L.map((x,i)=>`<div class="sp" style="padding:6px 0"><span><span class="dot" style="background:${x.c}"></span>${esc(x.name)} <span class="tag ${daysTo(x.ex)<=3?'high':''}">${daysTo(x.ex)===0?'Today':daysTo(x.ex)+' d left'}</span></span><span class="mu">Syllabus ${spct(x)}% · ~${fmt(Math.round(D.goal*w[i]/sum))}/day</span></div>`).join(''):'<p class="empty">No exams yet. Add exam dates on the Syllabus page.</p>'}</div>`}
const tm={len:25,left:25*60,run:false,id:null,subj:0,msg:'',pomo:false,ph:'focus',rd:0};
const clock=()=>String(Math.floor(tm.left/60)).padStart(2,'0')+':'+String(tm.left%60).padStart(2,'0');

V.Progress=()=>{const n=new Date(),y=n.getFullYear(),mo=n.getMonth(),dim=new Date(y,mo+1,0).getDate(),off=new Date(y,mo,1).getDay();
 const ds=[...new Set(D.log.map(l=>l.d))].sort();let best=0,run=0,pv=null;
 ds.forEach(d=>{run=pv&&Math.round((new Date(d+'T00:00')-new Date(pv+'T00:00'))/864e5)===1?run+1:1;best=Math.max(best,run);pv=d});
 const full=ds.filter(d=>mins(d)>=D.goal).length,done=D.tasks.filter(x=>x.done).length;
 const cells=[...Array(off).fill('<span></span>'),...[...Array(dim)].map((_,i)=>{const m=mins(dk(new Date(y,mo,i+1)));return `<span class="cd ${m>=D.goal?'full':m>0?'part':''} ${i+1===n.getDate()?'td':''}" title="${fmt(m)}">${i+1}</span>`})];
 const B=[['First full jar',full>=1],['3-day streak',best>=3],['7-day streak',best>=7],['10 hours studied',tot()>=600],['100 hours studied',tot()>=6000],['10 tasks done',done>=10],['Syllabus complete',D.subjects.some(x=>(x.ch||[]).length&&spct(x)===100)]];
 return head('Progress','Your streaks, full-jar days and achievements.')+
 `<div class="grid"><div class="card stat"><span>Current streak</span><b>${streak()} d</b></div><div class="card stat"><span>Best streak</span><b>${best} d</b></div><div class="card stat"><span>Full-jar days</span><b>${full}</b></div><div class="card stat"><span>Total studied</span><b>${fmt(tot())}</b></div></div>
 <div class="cols two"><div class="card"><h2>${n.toLocaleDateString('en',{month:'long',year:'numeric'})}</h2><div class="cal">${['S','M','T','W','T','F','S'].map(d=>`<b class="mu">${d}</b>`).join('')}${cells.join('')}</div><p class="mu" style="margin:12px 0 0">Light = studied, bright = jar full.</p></div>
 <div class="card"><h2>Achievements</h2><div class="bdgs">${B.map(([t,ok])=>`<div class="bdg ${ok?'got':''}">${ic(ok?'ok':'x')}<span>${t}</span></div>`).join('')}</div></div></div>`};

V.Analytics=()=>{const days=last7(),v=days.map(d=>mins(dk(d))),mx=Math.max(...v,D.goal),all=tot(),dn=D.tasks.filter(x=>x.done).length,rate=D.tasks.length?Math.round(dn/D.tasks.length*100):0;
 const by=D.subjects.map(s=>({s,m:D.log.filter(l=>l.s===s.id).reduce((a,l)=>a+l.m,0)})),rec=D.log.slice(-6).reverse();
 return head('Analytics','A clear view of your study habits over time.')+
 `<div class="grid"><div class="card stat"><span>Daily average (7 days)</span><b>${fmt(Math.round(v.reduce((a,b)=>a+b,0)/7))}</b></div><div class="card stat"><span>Task completion</span><b>${rate}%</b></div><div class="card stat"><span>Sessions logged</span><b>${D.log.length}</b></div><div class="card stat"><span>Current streak</span><b>${streak()} d</b></div></div>
 <div class="card"><h2>Last 7 days</h2><div class="bars">${days.map((d,i)=>`<div class="${i===6?'td':''}"><span>${v[i]}</span><i style="height:${v[i]/mx*100}%"></i>${d.toLocaleDateString('en',{weekday:'short'})}</div>`).join('')}</div></div>
 <div class="cols two"><div class="card"><h2>Time by subject</h2>${by.length?by.map(x=>`<div class="sp"><span>${esc(x.s.name)}</span><span class="mu">${fmt(x.m)}</span></div><div class="hb"><i style="width:${all?x.m/all*100:0}%;background:${x.s.c}"></i></div>`).join(''):'<p class="empty">No subjects yet.</p>'}</div>
 <div class="card"><h2>Recent sessions</h2>${rec.length?rec.map(l=>`<div class="sp" style="padding:6px 0"><span><span class="dot" style="background:${sub(l.s).c}"></span>${esc(sub(l.s).name)}</span><span class="mu">${fmt(l.m)} · ${fd(l.d)}</span></div>`).join(''):'<p class="empty">Nothing logged yet.</p>'}</div></div>`};

function nav(){const h=TABS.map(([t,i])=>`<button class="${t===tab?'on':''}" data-a="tab" data-i="${t}">${ic(i)}<span>${t}</span></button>`).join('');$('#sn').innerHTML=h;$('#bn').innerHTML=h}
function render(){$('#view').innerHTML=(D.prof&&!editing?V[tab]:V.Setup)();nav();requestAnimationFrame(()=>requestAnimationFrame(()=>document.querySelectorAll('.water[data-h]').forEach(w=>w.style.height=w.dataset.h+'%')))}
function stop(){clearInterval(tm.id);tm.run=false}
function addLog(m,s,t){D.log.push({d:dk(),m:+m,s:+s||0,t:t||''});save()}
function tick(){tm.left--;const c=$('#tc');if(c)c.textContent=clock();const r=$('#tr');if(r){const C=2*Math.PI*65;r.style.transition='none';r.setAttribute('stroke-dashoffset',C*(tm.left/(tm.len*60)))}
 if(tm.left<=0){if(tm.pomo){if(tm.ph==='focus'){addLog(tm.len,tm.subj);tm.rd++;tm.ph='break';tm.len=tm.rd%4?5:15;tm.msg='Focus round done. Take a '+tm.len+' min break.'}else{tm.ph='focus';tm.len=25;tm.msg='Break over. Round '+(tm.rd+1)+' begins.'}tm.left=tm.len*60;try{navigator.vibrate&&navigator.vibrate(250)}catch(e){}if(tab==='Timer')render();return}
 stop();addLog(tm.len,tm.subj);tm.msg='Session complete. '+tm.len+' min logged.';tm.left=tm.len*60;if(tab==='Timer')render()}}

document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,i=b.dataset.i,v=s=>$(s)?$(s).value:'';
 if(a==='theme')setTheme(THEME()==='dark'?'light':'dark');
 else if(a==='out')logout();
 else if(a==='ac'){const n=v('#nc_'+i).trim(),x=D.subjects.find(q=>q.id==i);if(n&&x){(x.ch=x.ch||[]).push({id:D.nid++,n,done:false});save();render()}}
 else if(a==='tc'){const k=D.subjects.find(q=>q.id==i).ch.find(q=>q.id==b.dataset.c);k.done=!k.done;save();render()}
 else if(a==='dc'){const x=D.subjects.find(q=>q.id==i);x.ch=x.ch.filter(q=>q.id!=b.dataset.c);save();render()}
 else if(a==='edit'){editing=true;render()}
 else if(a==='cancel'){editing=false;render()}
 else if(a==='dlog'){const m=+v('#dlm');if(m>0){addLog(m,v('#dls'),v('#dlt').trim());tm.msg=m+' min added to the jar.';render()}}
 else if(a==='setup'){const g=k=>parseT(v('#p_'+k),v('#p_'+k+'_ap')),p={sl:g('sl'),wk:g('wk'),cs:g('cs'),ce:g('ce'),ss:g('ss'),sh:+v('#p_sh'),an:v('#p_an').trim(),as:g('as'),ae:g('ae')},er=$('#perr');
  if(!p.sl||!p.wk||!p.cs||!p.ce||!p.ss||!(p.sh>0)){er.textContent='Enter every time like 7:30 and choose AM or PM, and fill in your study hours.';return}
  if(tmin(p.ce)<=tmin(p.cs)){er.textContent='College end time must be after the start time.';return}
  if(p.an&&(!p.as||!p.ae||tmin(p.ae)<=tmin(p.as))){er.textContent='Give the activity a start time and a later end time.';return}
  D.prof=p;D.goal=Math.round(p.sh*60);save();editing=false;tab='Dashboard';render();window.scrollTo(0,0)}
 else if(a==='tab'){tab=i;render();window.scrollTo(0,0)}
 else if(a==='add'){const t=v('#tt').trim();if(!t)return;D.tasks.push({id:D.nid++,title:t,s:+v('#ts'),due:v('#td'),done:false});save();render()}
 else if(a==='tog'){const k=D.tasks.find(x=>x.id==i);k.done=!k.done;save();render()}
 else if(a==='del'){D.tasks=D.tasks.filter(x=>x.id!=i);save();render()}
 else if(a==='flt'){flt=i;render()}
 else if(a==='as'){const n=v('#ns').trim();if(n){D.subjects.push({id:D.nid++,name:n,c:COL.find(k=>!D.subjects.some(q=>q.c===k))||COL[D.subjects.length%COL.length]});save();render()}}
 else if(a==='ds'){D.subjects=D.subjects.filter(s=>s.id!=i);save();render()}
 else if(a==='goal'){D.goal=Math.max(10,+v('#gl')||120);save();render()}
 else if(a==='pm'){if(!tm.run){tm.pomo=i==='1';tm.ph='focus';tm.rd=0;tm.len=25;tm.left=1500;tm.msg='';render()}}
 else if(a==='len'){if(!tm.run){tm.len=+i;tm.left=tm.len*60;tm.msg='';render()}}
 else if(a==='go'){tm.subj=+v('#tsub')||tm.subj;if(tm.run){stop()}else{tm.msg='';tm.run=true;tm.id=setInterval(tick,1000)}render()}
 else if(a==='rs'){stop();tm.left=tm.len*60;tm.msg='';render()}
 else if(a==='log'){const m=+v('#lm');if(m>0){addLog(m,v('#ls'));tm.msg=m+' min added to your log.';render()}}});
document.addEventListener('change',e=>{if(e.target.dataset.ex){D.subjects.find(q=>q.id==e.target.dataset.ex).ex=e.target.value;save();render();return}if(e.target.id==='tsub')tm.subj=+e.target.value});
/* Theme */
const THEME=()=>document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light';
function paintTheme(){const d=THEME()==='dark';document.querySelectorAll('.tgl').forEach(b=>{b.innerHTML=ic(d?'sun':'moon')+(b.dataset.l?'<span>'+(d?'Light mode':'Dark mode')+'</span>':'');b.setAttribute('aria-label',d?'Switch to light mode':'Switch to dark mode')})}
function setTheme(t){document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem('sp_theme',JSON.stringify(t))}catch(e){}paintTheme()}
paintTheme();
/* Auth */
const S={get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const sha=async s=>{try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){return btoa(s)}};
let signup=false;
function start(n){user=n;D=load();stop();tm.left=tm.len*60;tm.msg='';editing=false;tab='Dashboard';tm.subj=D.subjects[0]?D.subjects[0].id:0;$('#auth').classList.add('hide');$('#app').classList.remove('hide');$('#un').textContent=n;render();window.scrollTo(0,0)}
function logout(){stop();S.del('sp_session');user=null;D=null;$('#app').classList.add('hide');$('#auth').classList.remove('hide');$('#apass').value='';$('#aerr').textContent=''}
$('#auser').value=S.get('sp_last')||'';
$('#asw').onclick=()=>{signup=!signup;$('#ago').textContent=signup?'Create account':'Log in';$('#atitle').textContent=signup?'Create your account':'Log in to continue';$('#asw').textContent=signup?'Have an account? Log in':'New here? Create an account';$('#apass').autocomplete=signup?'new-password':'current-password';$('#aerr').textContent=''};
$('#ago').onclick=async()=>{const n=$('#auser').value.trim().toLowerCase(),p=$('#apass').value,er=$('#aerr');
 if(n.length<3||p.length<4){er.textContent='Username needs 3+ characters and password 4+.';return}
 const us=S.get('sp_users')||{},h=await sha(p);
 if(signup){if(us[n]){er.textContent='That username is already taken.';return}us[n]=h;S.set('sp_users',us)}
 else if(us[n]!==h){er.textContent='Incorrect username or password.';return}
 S.set('sp_last',n);if($('#arem').checked)S.set('sp_session',n);else S.del('sp_session');start(n)};
$('#apass').addEventListener('keydown',e=>{if(e.key==='Enter')$('#ago').click()});
const ses=S.get('sp_session'),usr=S.get('sp_users')||{};
if(ses&&usr[ses])start(ses);
