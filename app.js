"use strict";
(function boot(){
 const $=id=>document.getElementById(id);
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const key="soc-commander-v1";
 const labels={training:"Recruit",standard:"Analyst",expert:"Commander"};
 const statuses={open:"Open",correct:"Resolved",wrong:"Incorrect response",missed:"Expired"};
 let g=null,selected=null,mode="standard",pending=null,tool=null;
 function valid(x){
  if(!x||x.version!==1||!Object.hasOwn(labels,x.mode)||!["playing","briefing","won","lost"].includes(x.status)||!Number.isInteger(x.shift)||x.shift<1||x.shift>3)return false;
  if(!Array.isArray(x.order)||x.order.length!==21||new Set(x.order).size!==21||!x.order.every(i=>Number.isInteger(i)&&i>=0&&i<21))return false;
  if(!["turn","health","business","score","streak","bestStreak","correct","wrong","missed","investigated","limit","seed"].every(k=>Number.isSafeInteger(x[k])))return false;
  if(x.limit!==({training:180,standard:125,expert:95}[x.mode])||x.turn<0||x.turn>x.limit||x.health<0||x.health>100||x.business<0||x.business>100||x.score< -1680||x.score>4200)return false;
  if([x.correct,x.wrong,x.missed,x.streak,x.bestStreak].some(n=>n<0||n>21)||x.correct+x.wrong+x.missed>x.shift*7||x.investigated<0||x.investigated>63||x.streak>x.bestStreak||x.bestStreak>x.correct)return false;
  if(!Array.isArray(x.cases)||x.cases.length!==7||!x.cases.every((c,i)=>c&&c.idx===x.order[(x.shift-1)*7+i]&&c.id==="INC-"+String(x.shift*100+i+1)&&c.arrive===(i<3?0:(i-2)*3)&&Number.isInteger(c.seen)&&c.seen>=0&&c.seen<=3&&Object.hasOwn(statuses,c.status)&&typeof c.note==="string"&&c.note.length<=500&&Number.isSafeInteger(c.delta)&&c.delta>=-60&&c.delta<=195&&((["correct","wrong"].includes(c.status)&&Object.hasOwn(SOC.actions,c.action))||(["open","missed"].includes(c.status)&&c.action===null))))return false;
  if(x.status==="playing"&&(x.health===0||x.business===0||x.cases.every(c=>c.status!=="open")))return false;
  if(["briefing","won"].includes(x.status)&&(x.health===0||x.business===0||x.cases.some(c=>c.status==="open")||(x.status==="won")!==(x.shift===3)))return false;
  if(x.status==="lost"&&x.health>0&&x.business>0)return false;
  return Array.isArray(x.history)&&x.history.length<=84&&x.history.every(h=>h&&typeof h.msg==="string"&&h.msg.length<=200&&Number.isSafeInteger(h.shift)&&h.shift>=1&&h.shift<=x.shift&&Number.isSafeInteger(h.turn)&&h.turn>=0&&h.turn<=x.limit)&&Array.isArray(x.blocked)&&x.blocked.length<=21&&new Set(x.blocked).size===x.blocked.length&&x.blocked.every(ip=>SOC.scenarios.some(s=>s[4]===ip&&s[9]==="block"));
 }
 try{const raw=localStorage.getItem(key);if(raw){if(raw.length>100000)throw Error("oversize");const stored=JSON.parse(raw);if(valid(stored)&&SOC.validExtra(SOC.upgrade(stored)))g=stored;else throw Error("invalid");}}catch{$("saveerror").textContent="Saved campaign unavailable or invalid. Start a new campaign to continue.";}
 function save(){try{if(g)localStorage.setItem(key,JSON.stringify(g));$("saveerror").textContent="";}catch{$("saveerror").textContent="Local storage unavailable. Progress will not survive a reload.";}}
 function time(t){return String(Math.floor(t/60)).padStart(2,"0")+":"+String(t%60).padStart(2,"0");}
 function visible(){return g.cases.filter(c=>c.arrive<=g.turn||c.status!=="open");}
 function active(){return g?.cases.find(c=>c.id===selected);}
 function sev(s){return '<span class="severity '+esc(s)+'">'+esc(s)+'</span>';}
 function metric(label,value,bar){return '<div class="metric"><span>'+label+'</span><b>'+esc(value)+'</b>'+(bar?'<progress class="meter '+(value<40?"danger":"")+'" aria-label="'+label+'" max="100" value="'+value+'">'+value+'%</progress>':"")+'</div>';}
 function render(){
  $("welcome").hidden=!!g;$("game").hidden=!g;$("restart").hidden=!g;
  if(!g)return;
  const cases=visible();
  if(!cases.some(c=>c.id===selected))selected=cases.find(c=>c.status==="open")?.id||cases[0]?.id||null;
  $("shiftlabel").textContent="Shift "+g.shift+" of 3 · "+labels[g.mode]+" difficulty · "+(g.cases.length-cases.length)+" incoming";
  $("clock").textContent=time(g.turn)+" / "+time(g.limit);
  $("metrics").innerHTML=metric("Security integrity",g.health,true)+metric("Business continuity",g.business,true)+metric("Analyst score",g.score,false)+metric("Correct responses",g.correct+"/21",false)+metric("Current streak",g.streak,false);
  const open=cases.filter(c=>c.status==="open").length;$("alertcount").textContent=open+" open";
  $("wait").disabled=g.status!=="playing";$("advance").disabled=g.status!=="playing";$("nextalert").disabled=!cases.some(c=>c.status==="open");
  const f=$("filter").value,sv=$("severity").value;
  const shown=SOC.queue(g,{status:f||"all",severity:sv||"all",search:$("search").value,category:$("category").value||"all",sort:$("sort").value||"deadline",starred:!!$("starred").checked});
  $("queue").innerHTML=shown.length?shown.map(c=>{
   const s=SOC.scenarios[c.idx],left=Math.max(0,Math.min(g.limit,SOC.deadline(g,c))-g.turn);
   return '<button class="alert '+(selected===c.id?"selected":"")+'" data-case="'+esc(c.id)+'" aria-pressed="'+(selected===c.id)+'"><div class="row"><span class="mono">'+esc(c.id)+'</span>'+sev(s[2])+'</div><strong>'+esc(s[0])+(c.star?" ★":"")+'</strong><small>'+esc(s[1])+' · '+esc(c.status==="open"?left+" min remaining":statuses[c.status])+'</small></button>';
  }).join(""):'<div class="empty">No matching alerts. Adjust the filters or advance time.</div>';
  const c=active();
  if(!c){$("details").innerHTML='<div class="empty">Select an alert to investigate.</div>';$("response").innerHTML='<div class="empty">No incident selected.</div>';}
  else{
   const s=SOC.scenarios[c.idx],can=c.status==="open"&&g.status==="playing";
   const left=Math.max(0,Math.min(g.limit,SOC.deadline(g,c))-g.turn);
   const fact=(a,b)=>'<div class="fact"><span>'+a+'</span><b>'+esc(b)+'</b></div>';
   let evidence="";
   for(let i=0;i<3;i++){evidence+=i<c.seen?'<div class="evidence"><b>EVIDENCE 0'+(i+1)+'</b><p>'+esc(s[6+i])+'</p></div>':'<div class="locked">Evidence '+(i+1)+' · '+(can?"Not reviewed":"Not investigated")+'</div>';}
   const triage=triageHTML(c,can);const outcome=c.status==="open"?"":'<div class="outcome '+(c.status==="correct"?"":"bad")+'"><h3>'+esc(statuses[c.status])+(c.status==="missed"?"":" · "+(c.delta>0?"+":"")+c.delta+" XP")+'</h3><p>Recommended response: '+esc(SOC.actions[s[9]])+'. '+esc(s[10])+'</p></div>';
   $("details").innerHTML='<div class="panel-head"><h2>Incident investigation</h2><span class="mono">'+esc(c.id)+'</span></div><div class="case-body"><div class="case-title"><h2>'+esc(s[0])+'</h2>'+sev(s[2])+'</div><p class="summary">'+esc(s[5])+'</p><div class="facts">'+fact("Affected asset",s[3])+fact("Source address",s[4])+fact("Detection source",s[1])+fact("Response window",c.status==="open"?left+" min":statuses[c.status])+'</div>'+triage+outcome+'<div class="evidence-title"><h2>Evidence timeline</h2><span class="mono">'+c.seen+' / 3 reviewed</span></div>'+evidence+'<button id="inspect" class="investigate" '+(!can||c.seen===3?"disabled":"")+'>'+(c.seen===3?"All evidence reviewed":"Investigate evidence (+1 min)")+'</button><label class="notes">Analyst notes<textarea id="notes" maxlength="500" placeholder="Record your observations and reasoning…" '+(!can?"disabled":"")+'>'+esc(c.note)+'</textarea></label></div>';
   $("response").innerHTML='<div class="response"><p>Choose the best primary response for '+esc(c.id)+'. Each action costs 2 simulated minutes.</p>'+Object.entries(SOC.actions).map(([id,label])=>'<button data-action="'+id+'" '+(!can?"disabled":"")+'>'+esc(label)+' <small>+2m</small></button>').join("")+'</div>';
  }
  $("blockcount").textContent=g.blocked.length;$("blocklist").innerHTML=g.blocked.length?g.blocked.map(ip=>'<code>'+esc(ip)+' · DENY</code>').join(""):'<p class="small">No blocked addresses.</p>';
  $("history").innerHTML=g.history.length?g.history.filter(h=>h.msg.toLowerCase().includes(($("activitysearch").value||"").toLowerCase())).slice(-35).reverse().map(h=>'<article><span>S'+h.shift+' / '+time(h.turn)+'</span>'+esc(h.msg)+'</article>').join(""):'<p class="small">Waiting for analyst activity.</p>';
  const b=$("banner");b.hidden=g.status==="playing";b.classList.toggle("bad",g.status==="lost");
  if(g.status==="briefing"){const n=g.cases.filter(c=>c.status==="correct").length;b.innerHTML='<div><h3>Shift '+g.shift+' debrief</h3><p>'+n+' of 7 handled correctly · '+g.cases.filter(c=>c.status==="missed").length+' expired. Security '+g.health+'% · Business '+g.business+'%.</p></div><button id="next" class="primary">Begin shift '+(g.shift+1)+' →</button>';}
  else if(g.status==="won"||g.status==="lost"){const rank=g.correct===21?"S":g.correct>=18?"A":g.correct>=15?"B":g.correct>=11?"C":"D";b.innerHTML='<div><h3>'+(g.status==="lost"?"Operation failed":"Campaign complete · Rank "+rank)+'</h3><p>'+g.correct+'/21 correct · '+g.wrong+' incorrect · '+g.missed+' missed · '+g.investigated+' evidence reviewed · Best streak '+g.bestStreak+' · '+g.score+' XP.</p></div><button id="again" class="primary">Play again</button>';}
 }
 function changed(){save();render();if(tool&&$("toolbox").open)renderTool();}
 function show(id){const d=$(id);if(!d.open)d.showModal();}
 $("help").addEventListener("click",()=>show("guide"));
 $("restart").addEventListener("click",()=>show("confirm"));
 $("confirmnew").addEventListener("click",()=>{$("confirm").close();g=null;selected=null;render();});
 $("modes").addEventListener("click",e=>{const b=e.target.closest("[data-mode]");if(!b)return;mode=b.dataset.mode;for(const el of $("modes").querySelectorAll("button")){el.classList.toggle("chosen",el===b);el.setAttribute("aria-pressed",String(el===b));}});
 $("start").addEventListener("click",()=>{const raw=$("seed").value;const num=Number(raw);g=SOC.start(mode,raw!==""&&Number.isInteger(num)&&num>=0&&num<=4294967295?num:undefined);selected=null;$("filter").value="all";$("severity").value="all";changed();});
 $("wait").addEventListener("click",()=>{if(g&&SOC.tick(g))changed();});
 for(const id of ["filter","severity","category","sort","starred"])$(id).addEventListener("change",render);for(const id of ["search","activitysearch"])$(id).addEventListener("input",render);
 $("queue").addEventListener("click",e=>{const b=e.target.closest("[data-case]");if(b){selected=b.dataset.case;render();const replacement=$("queue").querySelector('[data-case="'+selected+'"]');replacement?.focus();}});
 $("details").addEventListener("click",e=>{if(e.target.id==="inspect"&&g&&SOC.inspect(g,selected)){changed();$("inspect")?.focus();}else if(e.target.id==="star"&&g&&active()&&SOC.triage(g,selected,"star",!active().star))changed();else if(e.target.id==="hint"&&g&&SOC.hint(g,selected))changed();});
 $("details").addEventListener("change",e=>{const k=e.target.dataset?.triage;if(k&&g&&SOC.triage(g,selected,k,e.target.value))changed();});
 $("details").addEventListener("input",e=>{if(e.target.id==="notes"&&g&&SOC.note(g,selected,e.target.value))save();});
 $("response").addEventListener("click",e=>{const b=e.target.closest("[data-action]");if(!b||b.disabled||!active())return;pending={id:selected,action:b.dataset.action};$("actiontext").textContent=SOC.actions[pending.action]+" for "+pending.id+"? This resolves the alert and advances simulated time by two minutes.";show("actionconfirm");});
 $("confirmact").addEventListener("click",()=>{const p=pending;pending=null;$("actionconfirm").close();if(p&&g&&SOC.act(g,p.id,p.action))changed();});
 $("actionconfirm").addEventListener("close",()=>{pending=null;});
 $("banner").addEventListener("click",e=>{if(e.target.id==="next"&&SOC.next(g)){selected=null;$("filter").value="all";$("severity").value="all";changed();}else if(e.target.id==="again"){g=null;selected=null;render();}});
 document.addEventListener("click",e=>{const b=e.target.closest("[data-close]");if(b)$(b.dataset.close).close();});
 
 function triageHTML(c,can){
  const fields=Object.entries(SOC.triageFields).map(([k,v])=>'<label>'+esc(k[0].toUpperCase()+k.slice(1))+'<select data-triage="'+k+'" '+(!can?"disabled":"")+'>'+v.map(x=>'<option '+(c[k]===x?"selected":"")+'>'+esc(x)+'</option>').join("")+'</select></label>').join("");
  const remaining=3-SOC.stats(g).hints;
  return '<div class="triage"><div class="evidence-title"><h2>Case triage</h2><button id="star" aria-pressed="'+c.star+'" '+(!can?"disabled":"")+'>'+(c.star?"★ Starred":"☆ Star case")+'</button></div><div class="triage-fields">'+fields+'</div><button id="hint" '+(!can||c.hints||remaining<=0||g.mode==="expert"?"disabled":"")+'>'+(g.mode==="expert"?"Hints unavailable on Commander":"Request analyst hint (+1 min) · "+remaining+" left")+'</button>'+(c.hints?'<p class="hint">'+esc(SOC.hintText(c))+'</p>':'')+'</div>';
 }
 function renderTool(){
  if(!g)return;
  const s=SOC.stats(g),cs=SOC.allCases(g),row=(a,b)=>'<div class="toolrow"><strong>'+esc(a)+'</strong><span>'+esc(b)+'</span></div>',empty='<p class="small">No records yet.</p>';
  const titles={intel:"Threat intelligence",assets:"Asset inventory",controls:"Containment register",stats:"Performance analytics",archive:"Case archive",badges:"Achievements",report:"Campaign report"};
  $("tooltitle").textContent=titles[tool]||"Operations tool";
  let html="";
  if(tool==="intel"){
   const c=active();
   if(!c)html=empty;
   else{const a=SOC.scenarios[c.idx];html=row("Indicator",a[4])+row("Asset",a[3])+row("Source",a[1])+row("Context",c.seen>=2||c.status!=="open"?(a[9]==="dismiss"?"Corroborated legitimate activity":"Potentially hostile activity"):"Review at least two evidence records to unlock context")+row("Evidence reviewed",c.seen+"/3")+'<p class="small">Offline fictional indicator lookup. No external queries.</p>';}
  }else if(tool==="assets")html=SOC.assets(g).map(a=>row(a.name,a.category+" · "+a.alerts+" alerts · "+a.open+" open · "+(a.isolated?"Isolation recorded":"No isolation recorded"))).join("")||empty;
  else if(tool==="controls")html=SOC.controls(g).map(c=>row(c.action,c.target+" · "+c.id+" · Shift "+c.shift)).join("")||empty;
  else if(tool==="stats")html=row("Accuracy",s.accuracy+"%")+row("Mean response time",s.meanResponse===null?"N/A":s.meanResponse+" min")+row("Evidence coverage",s.reviewRate+"%")+row("Cases triaged",s.triaged)+row("Cases closed",s.closed)+row("Hints used",s.hints)+Object.entries(s.categories).map(([k,v])=>row(k,v.correct+" correct / "+v.total+" alerts · "+v.wrong+" wrong · "+v.missed+" missed")).join("");
  else if(tool==="archive")html=g.archive.map(c=>'<details class="archive-entry"><summary>'+esc(c.id+" · "+SOC.scenarios[c.idx][0]+" · "+c.status)+'</summary>'+row("Response",SOC.actions[c.action]||"Expired")+row("Assigned",c.assigned)+row("Verdict",c.verdict)+row("Confidence",c.confidence)+row("Notes",c.note||"None")+'</details>').join("")||'<p class="small">Completed shifts appear here with their notes and triage decisions.</p>';
  else if(tool==="badges")html=SOC.badges(g).map(([label,earned])=>row(label,earned?"Unlocked":"Locked")).join("");
  else if(tool==="report")html='<label class="notes">Campaign report<textarea id="reporttext" readonly rows="12">'+esc(SOC.report(g))+'</textarea></label><button id="downloadreport">Download report (.txt)</button>';
  $("toolcontent").innerHTML=html;
 }
 $("daily").addEventListener("click",()=>{$("seed").value=String(SOC.dailySeed());});
 $("advance").addEventListener("click",()=>{if(g&&SOC.advance(g))changed();});
 $("nextalert").addEventListener("click",()=>{if(!g)return;const q=SOC.queue(g,{status:"open"});if(!q.length)return;const i=q.findIndex(c=>c.id===selected);selected=q[(i+1)%q.length].id;render();});
 document.addEventListener("click",e=>{const b=e.target.closest("[data-tool]");if(!b||!g)return;tool=b.dataset.tool;renderTool();show("toolbox");});
 $("toolcontent").addEventListener("click",e=>{if(e.target.id!=="downloadreport"||!g)return;const url=URL.createObjectURL(new Blob([SOC.report(g)],{type:"text/plain;charset=utf-8"}));const link=document.createElement("a");link.href=url;link.download="soc-commander-report.txt";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});

 for(const b of $("modes").querySelectorAll("button"))b.setAttribute("aria-pressed",String(b.dataset.mode===mode));
 render();
})();
