"use strict";
const fs=require("node:fs");
const path=require("node:path");
const SOC=require("./engine.js");
function tests(SOC){
 let n=0;function assert(v,m){if(!v)throw Error(m);n++;}
 assert(SOC.scenarios.length===21,"21 cases");
 const outcomes={};for(const s of SOC.scenarios){assert(s.length===11&&Object.hasOwn(SOC.actions,s[9]),"complete scenario");outcomes[s[9]]=(outcomes[s[9]]||0)+1;}
 assert(Object.keys(outcomes).length===5,"all response types");
 for(const mode of ["training","standard","expert"]){for(let seed=0;seed<100;seed++){let g=SOC.start(mode,seed);assert(new Set(g.order).size===21,"no repeats");while(["playing","briefing"].includes(g.status)){if(g.status==="briefing"){assert(SOC.next(g),"advance shift");continue;}const c=g.cases.filter(c=>c.status==="open"&&c.arrive<=g.turn).sort((a,b)=>SOC.deadline(g,a)-SOC.deadline(g,b))[0];if(!c){SOC.tick(g);continue;}assert(SOC.inspect(g,c.id),"evidence");assert(SOC.act(g,c.id,SOC.scenarios[c.idx][9]),"correct response");assert(!SOC.act(g,c.id,"block"),"no double response");}assert(g.status==="won"&&g.correct===21&&g.health===100&&g.business===100,"perfect campaign");assert(g.blocked.length===outcomes.block,"blocklist");}}
 const g=SOC.start("standard",1),c=g.cases[0];
 assert(!SOC.inspect(g,g.cases[6].id),"cannot inspect incoming");assert(!SOC.act(g,c.id,"invalid"),"invalid action");assert(SOC.note(g,c.id,"x".repeat(700))&&c.note.length===500,"notes capped");
 for(let i=0;i<3;i++)assert(SOC.inspect(g,c.id),"reveal evidence");
 assert(!SOC.inspect(g,c.id),"evidence cap");const correct=SOC.scenarios[c.idx][9];const wrong=Object.keys(SOC.actions).find(k=>k!==correct);assert(SOC.act(g,c.id,wrong)&&g.wrong===1&&g.score<0,"penalty");
 let timeout=SOC.start("standard",3);SOC.tick(timeout,1000);assert(timeout.missed===7,"expired cases");
 while(timeout.status==="briefing"){SOC.next(timeout);SOC.tick(timeout,1000);}assert(timeout.status==="lost","loss condition");assert(!SOC.next(timeout)&&!SOC.tick(timeout),"terminal guard");
 const boundary=SOC.start("standard",1), first=boundary.cases[0];
 for(const cost of [0,-1,NaN,Infinity,0.5,Number.MAX_SAFE_INTEGER+1])assert(!SOC.tick(boundary,cost)&&boundary.turn===0,"reject invalid time advance");
 SOC.tick(boundary,Number.MAX_SAFE_INTEGER);assert(boundary.turn===boundary.limit,"clock stays within shift limit");assert(!SOC.note(boundary,first.id,"late"),"cannot edit closed incident");
 assert(Object.isFrozen(SOC)&&Object.isFrozen(SOC.scenarios)&&Object.isFrozen(SOC.scenarios[0]),"immutable reference data");
 return n;
}
function uiTests(SOC,source){
 const elements=new Map(),storage=new Map();
 function element(id){if(elements.has(id))return elements.get(id);const e={id,value:["filter","severity"].includes(id)?"all":"",hidden:false,open:false,disabled:false,innerHTML:"",textContent:"",listeners:{},dataset:{},classList:{toggle(){}},setAttribute(){},addEventListener(event,fn){this.listeners[event]=fn;},querySelectorAll(){return [];},querySelector(){return null;},focus(){},showModal(){this.open=true;},close(){this.open=false;this.listeners.close?.({});}};elements.set(id,e);return e;}
 const doc={getElementById:element,addEventListener(){}};
 const ls={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
 const launch=()=>new Function("SOC","document","localStorage",source)(SOC,doc,ls);
 function click(id,target={id}){element(id).listeners.click({target});}
 function check(v,m){if(!v)throw Error(m);}
 launch();check(!element("welcome").hidden&&element("game").hidden,"welcome");
 click("start");check(element("welcome").hidden&&!element("game").hidden,"game");
 const read=()=>JSON.parse(storage.get("soc-commander-v1"));
 let g=read(),c=g.cases[0];check(g.shift===1,"save");
 click("details",{id:"inspect"});check(read().cases[0].seen===1,"inspect");
 element("details").listeners.input({target:{id:"notes",value:"<script>test</script>"}});
 check(read().cases[0].note==="<script>test</script>","notes save");
 launch();check(element("details").innerHTML.includes("&lt;script&gt;test&lt;/script&gt;"),"escaped note and restored save");
 click("response",{closest:()=>({dataset:{action:SOC.scenarios[c.idx][9]},disabled:false})});check(element("actionconfirm").open,"confirm dialog");click("confirmact");check(read().correct===1,"action");
 click("wait");check(read().turn===4,"advance");
 click("restart");check(element("confirm").open,"restart confirmation");click("confirmnew");check(!element("welcome").hidden,"restart welcome");
 storage.set("soc-commander-v1","{bad");launch();check(!element("welcome").hidden,"invalid save recovers");
 storage.set("soc-commander-v1",JSON.stringify({...SOC.start("standard",1),turn:9999}));launch();check(!element("welcome").hidden,"out-of-range save rejected");
 return 12;
}
console.log('Engine assertions passed:', tests(SOC));
console.log('UI smoke checks passed:',uiTests(SOC,fs.readFileSync(path.join(__dirname,'app.js'),'utf8')));
