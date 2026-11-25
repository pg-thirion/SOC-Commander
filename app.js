"use strict";
(function boot(){
 const $=id=>document.getElementById(id);
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const key="soc-commander-v1";
 const labels={training:"Recruit",standard:"Analyst",expert:"Commander"};
 const statuses={open:"Open",correct:"Resolved",wrong:"Incorrect response",missed:"Expired"};
 let g=null,selected=null,mode="standard",pending=null;
 function valid(x){
  if(!x||x.version!==1||!Object.hasOwn(labels,x.mode)||!["playing","briefing","won","lost"].includes(x.status)||!Number.isInteger(x.shift)||x.shift<1||x.shift>3)return false;
  if(!Array.isArray(x.order)||x.order.length!==21||new Set(x.order).size!==21||!x.order.every(i=>Number.isInteger(i)&&i>=0&&i<21))return false;
  if(!["turn","health","business","score","streak","bestStreak","correct","wrong","missed","investigated","limit"].every(k=>Number.isFinite(x[k])))return false;
  if(x.turn<0||x.health<0||x.health>100||x.business<0||x.business>100||x.limit<=0)return false;
  return Array.isArray(x.cases)&&x.cases.length===7&&x.cases.every((c,i)=>c.idx===x.order[(x.shift-1)*7+i]&&c.id==="INC-"+String(x.shift*100+i+1)&&Number.isInteger(c.arrive)&&c.arrive>=0&&Number.isInteger(c.seen)&&c.seen>=0&&c.seen<=3&&Object.hasOwn(statuses,c.status)&&typeof c.note==="string"&&Number.isFinite(c.delta)&&(c.action===null||Object.hasOwn(SOC.actions,c.action)))&&Array.isArray(x.history)&&x.history.every(h=>h&&typeof h.msg==="string"&&Number.isFinite(h.shift)&&Number.isFinite(h.turn))&&Array.isArray(x.blocked)&&x.blocked.every(ip=>typeof ip==="string");
 }
 try{const stored=JSON.parse(localStorage.getItem(key));if(valid(stored))g=stored;}catch{}
 function save(){try{if(g)localStorage.setItem(key,JSON.stringify(g));$("saveerror").textContent="";}catch{$("saveerror").textContent="Local storage unavailable. Progress will not survive a reload.";}}
 function time(t){return String(Math.floor(t/60)).padStart(2,"0")+":"+String(t%60).padStart(2,"0");}
 function visible(){return g.cases.filter(c=>c.arrive<=g.turn||c.status!=="open");}
 function active(){return g?.cases.find(c=>c.id===selected);}
 function sev(s){return '<span class="severity '+esc(s)+'">'+esc(s)+'</span>';}
 function metric(label,value,bar){return '<div class="metric"><span>'+label+'</span><b>'+esc(value)+'</b>'+(bar?'<div class="meter '+(value<40?"danger":"")+'" role="meter" aria-label="'+label+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+value+'"><i style="width:'+value+'%"></i></div>':"")+'</div>';}
 function render(){
  $("welcome").hidden=!!g;$("game").hidden=!g;$("restart").hidden=!g;
  if(!g)return;
  const cases=visible();
  if(!cases.some(c=>c.id===selected))selected=cases.find(c=>c.status==="open")?.id||cases[0]?.id||null;
  $("shiftlabel").textContent="Shift "+g.shift+" of 3 · "+labels[g.mode]+" difficulty · "+(g.cases.length-cases.length)+" incoming";
  $("clock").textContent=time(g.turn)+" / "+time(g.limit);
  $("metrics").innerHTML=metric("Security integrity",g.health,true)+metric("Business continuity",g.business,true)+metric("Analyst score",g.score,false)+metric("Correct responses",g.correct+"/21",false)+metric("Current streak",g.streak,false);
  const open=cases.filter(c=>c.status==="open").length;$("alertcount").textContent=open+" open";
  $("wait").disabled=g.status!=="playing";
  const f=$("filter").value,sv=$("severity").value;
  const shown=cases.filter(c=>(f==="all"||(f==="open"?c.status==="open":c.status!=="open"))&&(sv==="all"||SOC.scenarios[c.idx][2]===sv)).sort((a,b)=>Number(a.status!=="open")-Number(b.status!=="open")||SOC.deadline(g,a)-SOC.deadline(g,b));
  $("queue").innerHTML=shown.length?shown.map(c=>{
   const s=SOC.scenarios[c.idx],left=Math.max(0,Math.min(g.limit,SOC.deadline(g,c))-g.turn);
   return '<button class="alert '+(selected===c.id?"selected":"")+'" data-case="'+esc(c.id)+'" aria-pressed="'+(selected===c.id)+'"><div class="row"><span class="mono">'+esc(c.id)+'</span>'+sev(s[2])+'</div><strong>'+esc(s[0])+'</strong><small>'+esc(s[1])+' · '+esc(c.status==="open"?left+" min remaining":statuses[c.status])+'</small></button>';
  }).join(""):'<div class="empty">No matching alerts. Adjust the filters or advance time.</div>';
  const c=active();
  if(!c){$("details").innerHTML='<div class="empty">Select an alert to investigate.</div>';$("response").innerHTML='<div class="empty">No incident selected.</div>';}
  else{
   const s=SOC.scenarios[c.idx],can=c.status==="open"&&g.status==="playing";
   const left=Math.max(0,Math.min(g.limit,SOC.deadline(g,c))-g.turn);
   const fact=(a,b)=>'<div class="fact"><span>'+a+'</span><b>'+esc(b)+'</b></div>';
   let evidence="";
   for(let i=0;i<3;i++){evidence+=i<c.seen?'<div class="evidence"><b>EVIDENCE 0'+(i+1)+'</b><p>'+esc(s[6+i])+'</p></div>':'<div class="locked">Evidence '+(i+1)+' · '+(can?"Not reviewed":"Not investigated")+'</div>';}
   const outcome=c.status==="open"?"":'<div class="outcome '+(c.status==="correct"?"":"bad")+'"><h3>'+esc(statuses[c.status])+(c.status==="missed"?"":" · "+(c.delta>0?"+":"")+c.delta+" XP")+'</h3><p>Recommended response: '+esc(SOC.actions[s[9]])+'. '+esc(s[10])+'</p></div>';
   $("details").innerHTML='<div class="panel-head"><h2>Incident investigation</h2><span class="mono">'+esc(c.id)+'</span></div><div class="case-body"><div class="case-title"><h2>'+esc(s[0])+'</h2>'+sev(s[2])+'</div><p class="summary">'+esc(s[5])+'</p><div class="facts">'+fact("Affected asset",s[3])+fact("Source address",s[4])+fact("Detection source",s[1])+fact("Response window",c.status==="open"?left+" min":statuses[c.status])+'</div>'+outcome+'<div class="evidence-title"><h2>Evidence timeline</h2><span class="mono">'+c.seen+' / 3 reviewed</span></div>'+evidence+'<button id="inspect" class="investigate" '+(!can||c.seen===3?"disabled":"")+'>'+(c.seen===3?"All evidence reviewed":"Investigate evidence (+1 min)")+'</button><label class="notes">Analyst notes<textarea id="notes" maxlength="500" placeholder="Record your observations and reasoning…" '+(!can?"disabled":"")+'>'+esc(c.note)+'</textarea></label></div>';
   $("response").innerHTML='<div class="response"><p>Choose the best primary response for '+esc(c.id)+'. Each action costs 2 simulated minutes.</p>'+Object.entries(SOC.actions).map(([id,label])=>'<button data-action="'+id+'" '+(!can?"disabled":"")+'>'+esc(label)+' <small>+2m</small></button>').join("")+'</div>';
  }
  $("blockcount").textContent=g.blocked.length;$("blocklist").innerHTML=g.blocked.length?g.blocked.map(ip=>'<code>'+esc(ip)+' · DENY</code>').join(""):'<p class="small">No blocked addresses.</p>';
  $("history").innerHTML=g.history.length?g.history.slice(-35).reverse().map(h=>'<article><span>S'+h.shift+' / '+time(h.turn)+'</span>'+esc(h.msg)+'</article>').join(""):'<p class="small">Waiting for analyst activity.</p>';
  const b=$("banner");b.hidden=g.status==="playing";b.classList.toggle("bad",g.status==="lost");
  if(g.status==="briefing"){const n=g.cases.filter(c=>c.status==="correct").length;b.innerHTML='<div><h3>Shift '+g.shift+' debrief</h3><p>'+n+' of 7 handled correctly · '+g.cases.filter(c=>c.status==="missed").length+' expired. Security '+g.health+'% · Business '+g.business+'%.</p></div><button id="next" class="primary">Begin shift '+(g.shift+1)+' →</button>';}
  else if(g.status==="won"||g.status==="lost"){const rank=g.correct===21?"S":g.correct>=18?"A":g.correct>=15?"B":g.correct>=11?"C":"D";b.innerHTML='<div><h3>'+(g.status==="lost"?"Operation failed":"Campaign complete · Rank "+rank)+'</h3><p>'+g.correct+'/21 correct · '+g.wrong+' incorrect · '+g.missed+' missed · '+g.investigated+' evidence reviewed · Best streak '+g.bestStreak+' · '+g.score+' XP.</p></div><button id="again" class="primary">Play again</button>';}
 }
 function changed(){save();render();}
 function show(id){const d=$(id);if(!d.open)d.showModal();}
 $("help").addEventListener("click",()=>show("guide"));
 $("restart").addEventListener("click",()=>show("confirm"));
 $("confirmnew").addEventListener("click",()=>{$("confirm").close();g=null;selected=null;render();});
 $("modes").addEventListener("click",e=>{const b=e.target.closest("[data-mode]");if(!b)return;mode=b.dataset.mode;for(const el of $("modes").querySelectorAll("button")){el.classList.toggle("chosen",el===b);el.setAttribute("aria-pressed",String(el===b));}});
 $("start").addEventListener("click",()=>{g=SOC.start(mode);selected=null;$("filter").value="all";$("severity").value="all";changed();});
 $("wait").addEventListener("click",()=>{if(g&&SOC.tick(g))changed();});
 for(const id of ["filter","severity"])$(id).addEventListener("change",render);
 $("queue").addEventListener("click",e=>{const b=e.target.closest("[data-case]");if(b){selected=b.dataset.case;render();const replacement=$("queue").querySelector('[data-case="'+selected+'"]');replacement?.focus();}});
 $("details").addEventListener("click",e=>{if(e.target.id==="inspect"&&g&&SOC.inspect(g,selected)){changed();$("inspect")?.focus();}});
 $("details").addEventListener("input",e=>{if(e.target.id==="notes"&&g&&SOC.note(g,selected,e.target.value))save();});
 $("response").addEventListener("click",e=>{const b=e.target.closest("[data-action]");if(!b||b.disabled||!active())return;pending={id:selected,action:b.dataset.action};$("actiontext").textContent=SOC.actions[pending.action]+" for "+pending.id+"? This resolves the alert and advances simulated time by two minutes.";show("actionconfirm");});
 $("confirmact").addEventListener("click",()=>{const p=pending;pending=null;$("actionconfirm").close();if(p&&g&&SOC.act(g,p.id,p.action))changed();});
 $("actionconfirm").addEventListener("close",()=>{pending=null;});
 $("banner").addEventListener("click",e=>{if(e.target.id==="next"&&SOC.next(g)){selected=null;$("filter").value="all";$("severity").value="all";changed();}else if(e.target.id==="again"){g=null;selected=null;render();}});
 document.addEventListener("click",e=>{const b=e.target.closest("[data-close]");if(b)$(b.dataset.close).close();});
 for(const b of $("modes").querySelectorAll("button"))b.setAttribute("aria-pressed",String(b.dataset.mode===mode));
 render();
})();
