"use strict";
const scenarios = [
  [
    "Brute force burst",
    "Identity",
    "high",
    "IDP-01",
    "198.51.100.21",
    "Password failures across 42 accounts in 90 seconds.",
    "Login logs show rotating usernames from one external address.",
    "Threat feed lists this simulated address as credential abuse.",
    "No successful authentication. No authorised test is scheduled.",
    "block",
    "Password spraying was stopped at the perimeter. No account takeover occurred."
  ],
  [
    "Unusual mailbox rule",
    "Email",
    "high",
    "EXCH-02",
    "203.0.113.42",
    "New rule forwards invoices to an unfamiliar external mailbox.",
    "Audit trail shows a successful sign-in from an unfamiliar device.",
    "The new rule hides copies of forwarded messages.",
    "Account owner confirms they did not create the rule.",
    "revoke",
    "Revoke sessions and remove the forwarding rule to contain mailbox compromise."
  ],
  [
    "Scheduled vulnerability scan",
    "Network",
    "medium",
    "WEB-01",
    "192.0.2.14",
    "A scanner touched 120 ports on a web server.",
    "Source maps to the internal security vendor's approved scanner.",
    "Change ticket SEC-302 authorises the scan window.",
    "No abnormal execution or outbound traffic follows.",
    "dismiss",
    "This is authorised testing. Blocking it would disrupt security assurance."
  ],
  [
    "Suspicious PowerShell",
    "Endpoint",
    "critical",
    "FIN-WS07",
    "198.51.100.88",
    "Encoded PowerShell triggered an endpoint rule.",
    "Process tree shows a document launching an unexpected script.",
    "Endpoint logs show an unsigned child process and unusual outbound traffic.",
    "Finance confirms no maintenance or automation is planned.",
    "isolate",
    "Isolating the workstation limits lateral movement while preserving evidence."
  ],
  [
    "Mass file encryption",
    "Endpoint",
    "critical",
    "FILE-02",
    "203.0.113.66",
    "Hundreds of files renamed within one minute.",
    "Endpoint telemetry identifies rapid writes by an untrusted process.",
    "Canary files have been modified and backup access attempted.",
    "No approved bulk migration exists for this host.",
    "isolate",
    "Contain the affected server immediately, then coordinate recovery from verified backups."
  ],
  [
    "New admin membership",
    "Identity",
    "critical",
    "IDP-01",
    "192.0.2.91",
    "A standard user was added to privileged administrators.",
    "Directory logs identify a compromised service account as actor.",
    "No approval exists for the privilege change.",
    "A subsequent privileged sign-in came from a new device.",
    "revoke",
    "Remove unauthorised privileges and invalidate the compromised sessions."
  ],
  [
    "Backup traffic spike",
    "Network",
    "medium",
    "BACKUP-01",
    "192.0.2.30",
    "Large outbound transfer triggered the volume threshold.",
    "Destination is the contracted backup storage endpoint.",
    "Backup job IDs match the approved nightly schedule.",
    "Transfer size matches the full backup manifest.",
    "dismiss",
    "Expected backup traffic is not an exfiltration incident."
  ],
  [
    "Phishing campaign",
    "Email",
    "high",
    "MAIL-GW",
    "203.0.113.73",
    "Multiple employees received a fake benefits notice.",
    "Mail headers fail sender alignment and the link is untrusted.",
    "Sandbox reports a simulated credential capture page.",
    "Message trace identifies 19 delivered copies.",
    "quarantine",
    "Quarantine the campaign and coordinate checks for users who interacted."
  ],
  [
    "Beacon-like traffic",
    "Network",
    "high",
    "ENG-WS12",
    "198.51.100.56",
    "A workstation contacts the same destination every 60 seconds.",
    "Network flow shows small, regular outbound sessions.",
    "Endpoint logs tie the traffic to an unsigned executable.",
    "The application owner denies installing the executable.",
    "isolate",
    "Host containment stops the suspected command channel and preserves forensic evidence."
  ],
  [
    "Deployment service login",
    "Identity",
    "low",
    "CI-01",
    "192.0.2.40",
    "Service account used a new build runner.",
    "Build logs identify the runner in today's release pipeline.",
    "Change ticket confirms the runner replacement.",
    "No interactive user sessions or privilege changes were observed.",
    "dismiss",
    "The sign-in is explained by an authorised infrastructure change."
  ],
  [
    "Web exploit attempts",
    "Network",
    "high",
    "WEB-01",
    "203.0.113.19",
    "WAF reports repeated suspicious requests from one address.",
    "WAF logs show repeated blocked requests and no successful responses.",
    "The simulated reputation feed marks the source as hostile.",
    "Application health and file integrity remain normal.",
    "block",
    "Block the hostile source and monitor the application for further attempts."
  ],
  [
    "Lost laptop session",
    "Identity",
    "high",
    "HR-WS03",
    "198.51.100.41",
    "A device marked lost still holds active cloud sessions.",
    "Asset desk ticket confirms the laptop was reported missing.",
    "Identity logs show a new session from the device.",
    "The account owner has not authorised current access.",
    "revoke",
    "Invalidate sessions and follow the lost-device response process."
  ],
  [
    "Antivirus test file",
    "Endpoint",
    "low",
    "LAB-WS01",
    "192.0.2.60",
    "Endpoint protection flagged a test signature.",
    "File hash matches the standard harmless antivirus test artefact.",
    "Lab ticket authorises an endpoint detection validation.",
    "Protection quarantined the test file as expected.",
    "dismiss",
    "The detection is expected and confirms the protection control works."
  ],
  [
    "Suspicious attachment",
    "Email",
    "high",
    "MAIL-GW",
    "203.0.113.83",
    "An invoice attachment has unusual file metadata.",
    "Mail sandbox flags an unexpected executable child process.",
    "Message trace shows delivery to five employees.",
    "Finance confirms the sender is impersonating a supplier.",
    "quarantine",
    "Remove the malicious message from affected mailboxes and investigate execution."
  ],
  [
    "Unusual outbound data",
    "Network",
    "critical",
    "DB-01",
    "198.51.100.99",
    "A database server began transferring sensitive records externally.",
    "Flow records show a new destination and large sustained upload.",
    "Database audit confirms bulk reads by an unexpected process.",
    "Data owner confirms no authorised export.",
    "isolate",
    "Contain the server, preserve logs and initiate the data exposure response."
  ],
  [
    "Firewall deny surge",
    "Network",
    "medium",
    "EDGE-01",
    "203.0.113.101",
    "Repeated probes triggered perimeter alerts.",
    "All connections were denied by the existing policy.",
    "The simulated reputation feed identifies persistent hostile probing.",
    "There are no successful connections or internal host alerts.",
    "block",
    "Add a scoped deny rule and monitor for continued abuse."
  ],
  [
    "Travel sign-in",
    "Identity",
    "medium",
    "IDP-01",
    "192.0.2.80",
    "An employee logged in from an unfamiliar region.",
    "MFA challenge was satisfied by the registered device.",
    "Travel desk confirms the employee is travelling.",
    "Device posture and subsequent activity match normal behaviour.",
    "dismiss",
    "Corroborating context supports a legitimate travelling employee."
  ],
  [
    "Incident response exercise",
    "Endpoint",
    "medium",
    "LAB-WS02",
    "192.0.2.85",
    "Multiple endpoint detections appeared during an exercise.",
    "Exercise controller confirms the simulation identifier.",
    "Test hosts and timing match the approved exercise scope.",
    "No production assets are affected.",
    "dismiss",
    "Record the exercise detection and avoid disrupting authorised validation."
  ],
  [
    "Compromised API token",
    "Identity",
    "critical",
    "API-01",
    "198.51.100.111",
    "A service token is accessing endpoints outside its normal scope.",
    "Audit logs show requests inconsistent with the service's duties.",
    "The token owner confirms it was exposed in a simulated incident.",
    "No change ticket authorises the expanded access.",
    "revoke",
    "Revoke and rotate the compromised credential, then review access logs."
  ],
  [
    "DNS anomaly",
    "Network",
    "high",
    "OPS-WS02",
    "203.0.113.112",
    "One host is making unusual high-volume DNS requests.",
    "DNS logs show long, irregular subdomains to an unapproved domain.",
    "Endpoint records show a newly installed unsigned process.",
    "The service owner cannot explain the traffic.",
    "isolate",
    "Isolate the suspicious endpoint and investigate possible data leakage."
  ],
  [
    "Password reset lure",
    "Email",
    "medium",
    "MAIL-GW",
    "198.51.100.124",
    "Several password expiry emails arrived unexpectedly.",
    "The displayed sender does not match the envelope domain.",
    "Message links point to an unapproved simulated site.",
    "The identity team confirms no reset campaign is active.",
    "quarantine",
    "Remove the phishing messages and check for affected accounts."
  ]
];
const actions = {"block":"Block source IP","isolate":"Isolate host","revoke":"Revoke access","quarantine":"Quarantine email","dismiss":"Close as benign"};
function createGame(mode="standard", seed=Date.now()) {
 const limits={training:180,standard:125,expert:95};
 if(!Object.hasOwn(limits,mode)) mode="standard";
 seed=Number.isFinite(seed)?Math.trunc(seed):Date.now(); let n=seed>>>0; const order=scenarios.map((_,i)=>i);
 for(let i=order.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[order[i],order[j]]=[order[j],order[i]];}
 // Rotate the full campaign into three waves, each seven alerts.
 return {version:1,mode,seed,order,shift:1,turn:0,health:100,business:100,score:0,streak:0,bestStreak:0,correct:0,wrong:0,missed:0,investigated:0,limit:limits[mode],cases:[],history:[],blocked:[],archive:[],status:"playing"};
}
function start(mode,seed){const g=createGame(mode,seed);return openShift(g);}
function openShift(g){g.turn=0;g.cases=g.order.slice((g.shift-1)*7,g.shift*7).map((idx,i)=>({idx,id:"INC-"+String(g.shift*100+i+1),arrive:i<3?0:(i-2)*3,seen:0,status:"open",note:"",action:null,delta:0,star:false,assigned:"Unassigned",verdict:"Unclassified",confidence:"Unknown",resolvedAt:null,hints:0}));g.status="playing";return g;}
function severity(c){return scenarios[c.idx][2];}
function deadline(g,c){const base={critical:18,high:24,medium:32,low:40}[severity(c)];return c.arrive+Math.round(base*({training:1.6,standard:1,expert:.75}[g.mode]));}
function log(g,msg){g.history.push({shift:g.shift,turn:g.turn,msg});}
function clamp(v){return Math.max(0,Math.min(100,v));}
function finishCheck(g){if(g.health<=0||g.business<=0){g.status="lost";return;}if(g.cases.every(c=>c.status!=="open"))g.status=g.shift===3?"won":"briefing";}
function tick(g,cost=1){if(g.status!=="playing"||!Number.isSafeInteger(cost)||cost<=0)return false;g.turn=Math.min(g.limit,g.turn+cost);for(const c of g.cases){if(c.status==="open"&&(g.turn>=g.limit||g.turn>=deadline(g,c))){c.status="missed";c.resolvedAt=Math.min(g.turn,deadline(g,c),g.limit);g.missed++;g.streak=0;const threat=scenarios[c.idx][9]!=="dismiss";g.health=clamp(g.health-(threat?({critical:24,high:15,medium:8,low:4}[severity(c)]):0));g.business=clamp(g.business-3);g.score-=threat?80:25;log(g,c.id+" expired without resolution.");}}finishCheck(g);return true;}
function inspect(g,id){const c=g.cases.find(x=>x.id===id);if(g.status!=="playing"||!c||c.status!=="open"||c.arrive>g.turn||c.seen>=3)return false;c.seen++;g.investigated++;log(g,id+" evidence "+c.seen+" reviewed.");tick(g,1);return true;}
function act(g,id,action){const c=g.cases.find(x=>x.id===id);if(g.status!=="playing"||!c||c.status!=="open"||c.arrive>g.turn||!Object.hasOwn(actions,action))return false;const s=scenarios[c.idx];const good=action===s[9];c.status=good?"correct":"wrong";c.action=action;c.resolvedAt=g.turn;const amount=good?100+c.seen*15+Math.min(g.streak,5)*10:-60;c.delta=amount;g.score+=amount;if(good){g.correct++;g.streak++;g.bestStreak=Math.max(g.bestStreak,g.streak);if(action==="block"&&!g.blocked.includes(s[4]))g.blocked.push(s[4]);}else{g.wrong++;g.streak=0;if(s[9]!=="dismiss")g.health=clamp(g.health-({critical:20,high:12,medium:7,low:4}[s[2]]));if(action!=="dismiss")g.business=clamp(g.business-12);}
 log(g,id+" · "+actions[action]+" · "+(good?"Correct":"Incorrect"));tick(g,2);return true;}
function next(g){if(g.status!=="briefing")return false;g.archive.push(...g.cases.map(c=>({...c,shift:g.shift})));g.shift++;openShift(g);return true;}
function note(g,id,value){const c=g.cases.find(x=>x.id===id);if(g.status!=="playing"||!c||c.status!=="open"||c.arrive>g.turn)return false;c.note=String(value).slice(0,500);return true;}

function upgrade(g){
 if(!Array.isArray(g.archive))g.archive=[];
 for(const c of g.cases){if(!Object.hasOwn(c,"star"))c.star=false;if(!Object.hasOwn(c,"assigned"))c.assigned="Unassigned";if(!Object.hasOwn(c,"verdict"))c.verdict="Unclassified";if(!Object.hasOwn(c,"confidence"))c.confidence="Unknown";if(!Object.hasOwn(c,"resolvedAt"))c.resolvedAt=null;if(!Object.hasOwn(c,"hints"))c.hints=0;}
 return g;
}
const triageFields=Object.freeze({assigned:Object.freeze(["Unassigned","Tier 1","Tier 2","Incident response"]),verdict:Object.freeze(["Unclassified","Suspicious","Malicious","Benign"]),confidence:Object.freeze(["Unknown","Low","Medium","High"])});
function triage(g,id,field,value){
 const c=g.cases.find(x=>x.id===id);
 if(!c||c.arrive>g.turn||c.status!=="open"||g.status!=="playing")return false;
 if(field==="star"&&typeof value==="boolean"){c.star=value;return true;}
 if(Object.hasOwn(triageFields,field)&&triageFields[field].includes(value)){c[field]=value;return true;}
 return false;
}
function allCases(g){return [...g.archive,...g.cases.map(c=>({...c,shift:g.shift}))];}
function hint(g,id){
 const c=g.cases.find(x=>x.id===id);
 if(g.mode==="expert"||!c||c.status!=="open"||c.arrive>g.turn||c.hints||g.status!=="playing")return false;
 if(allCases(g).reduce((a,c)=>a+c.hints,0)>=3)return false;
 c.hints=1;tick(g,1);return true;
}
function hintText(c){return {block:"Check whether the perimeter prevented access and whether any internal host is compromised.",isolate:"Look for endpoint execution or changes to sensitive files, then consider containment.",revoke:"Correlate identity audit records and determine whether the account or token remains trusted.",quarantine:"Review sender identity, message traces and attachment or URL analysis.",dismiss:"Look for corroborating approvals, expected activity and the absence of compromise."}[scenarios[c.idx][9]];}
function advance(g){if(g.status!=="playing")return false;const incoming=g.cases.filter(c=>c.status==="open"&&c.arrive>g.turn).map(c=>c.arrive);const due=g.cases.filter(c=>c.status==="open"&&c.arrive<=g.turn).map(c=>deadline(g,c));const t=Math.min(g.limit,...incoming,...due);return tick(g,Math.max(1,t-g.turn));}
function dailySeed(date=new Date()){return Number(date.toISOString().slice(0,10).replaceAll("-",""));}
function queue(g,options={}){
 const {search="",category="all",severity="all",status="all",sort="deadline",starred=false}=options;
 const q=String(search).trim().toLowerCase();
 const result=g.cases.filter(c=>c.arrive<=g.turn||c.status!=="open").filter(c=>{
  const s=scenarios[c.idx];
  return (category==="all"||s[1]===category)&&(severity==="all"||s[2]===severity)&&(status==="all"||(status==="open"?c.status==="open":c.status!=="open"))&&(!starred||c.star)&&(!q||[c.id,s[0],s[1],s[3],s[4]].some(v=>v.toLowerCase().includes(q)));
 });
 const rank={critical:0,high:1,medium:2,low:3};
 return result.sort((a,b)=>Number(a.status!=="open")-Number(b.status!=="open")||(sort==="severity"?rank[scenarios[a.idx][2]]-rank[scenarios[b.idx][2]]:sort==="arrival"?a.arrive-b.arrive:sort==="name"?scenarios[a.idx][0].localeCompare(scenarios[b.idx][0]):deadline(g,a)-deadline(g,b))||a.id.localeCompare(b.id));
}
function stats(g){
 const cs=allCases(g).filter(c=>c.shift<g.shift||c.arrive<=g.turn||c.status!=="open"),closed=cs.filter(c=>c.status!=="open"),timed=closed.filter(c=>c.status!=="missed"&&c.resolvedAt!==null);
 const categories={};for(const c of cs){const k=scenarios[c.idx][1];const row=categories[k]??(categories[k]={total:0,correct:0,wrong:0,missed:0});row.total++;if(c.status!=="open")row[c.status]++;}
 const resolved=g.correct+g.wrong+g.missed;
 return {accuracy:resolved?Math.round(100*g.correct/resolved):0,meanResponse:timed.length?Math.round(timed.reduce((a,c)=>a+c.resolvedAt-c.arrive,0)/timed.length*10)/10:null,reviewRate:resolved?Math.min(100,Math.round(100*closed.reduce((a,c)=>a+c.seen,0)/(3*resolved))):0,hints:cs.reduce((a,c)=>a+c.hints,0),categories,closed:resolved,triaged:cs.filter(c=>c.verdict!=="Unclassified").length};
}
function badges(g){const s=stats(g);return [["First response",g.correct>=1],["Five in a row",g.bestStreak>=5],["Evidence specialist",g.investigated>=15],["Perimeter defender",g.blocked.length>=3],["Shift survivor",g.shift>=2||g.status==="won"],["Perfect campaign",g.status==="won"&&g.correct===21],["Business guardian",g.status==="won"&&g.business===100],["Commander",g.status==="won"&&g.mode==="expert"],["Independent analyst",g.status==="won"&&s.hints===0],["Case manager",s.triaged>=7]];}
function assets(g){const map={};for(const c of allCases(g)){if(c.shift===g.shift&&c.arrive>g.turn&&c.status==="open")continue;const s=scenarios[c.idx];const a=map[s[3]]??(map[s[3]]={name:s[3],category:s[1],alerts:0,open:0,isolated:false});a.alerts++;if(c.status==="open")a.open++;if(c.status==="correct"&&c.action==="isolate")a.isolated=true;}return Object.values(map).sort((a,b)=>a.name.localeCompare(b.name));}
function controls(g){return allCases(g).filter(c=>c.status==="correct"&&c.action!=="dismiss").map(c=>({id:c.id,action:actions[c.action],target:c.action==="block"?scenarios[c.idx][4]:scenarios[c.idx][3],shift:c.shift}));}
function report(g){const s=stats(g);return ["SOC COMMANDER / CAMPAIGN REPORT","Seed: "+g.seed+" | Difficulty: "+g.mode+" | Shift: "+g.shift+" | Status: "+g.status,"Score: "+g.score+" | Security: "+g.health+"% | Business: "+g.business+"%","Accuracy: "+s.accuracy+"% | Mean response: "+(s.meanResponse===null?"N/A":s.meanResponse+" min"),"Correct: "+g.correct+" | Incorrect: "+g.wrong+" | Missed: "+g.missed,"",...allCases(g).filter(c=>c.shift<g.shift||c.arrive<=g.turn||c.status!=="open").map(c=>[c.id+" | "+scenarios[c.idx][0]+" | "+c.status,"Assigned: "+c.assigned+" | Verdict: "+c.verdict+" | Confidence: "+c.confidence,"Response: "+(actions[c.action]||"Pending")+" | Evidence: "+c.seen+"/3","Notes: "+(c.note||"(none)")].join("\n"))].join("\n");}
function validExtra(g){
 if(!Array.isArray(g.archive)||g.archive.length>(g.shift-1)*7||g.archive.length%7!==0)return false;
 const ids=new Set();
 for(const c of [...g.archive,...g.cases]){
  if(!c||typeof c.id!=="string"||ids.has(c.id)||!Number.isInteger(c.idx)||c.idx<0||c.idx>=scenarios.length||typeof c.star!=="boolean"||!Object.entries(triageFields).every(([k,v])=>v.includes(c[k]))||![0,1].includes(c.hints)||!(c.resolvedAt===null||Number.isInteger(c.resolvedAt)&&c.resolvedAt>=c.arrive&&c.resolvedAt<=g.limit))return false;
  ids.add(c.id);
 }
 return g.archive.every(c=>Number.isInteger(c.shift)&&c.shift>=1&&c.shift<g.shift&&/^INC-[1-3]0[1-7]$/.test(c.id)&&c.id.startsWith("INC-"+c.shift)&&c.idx===g.order[(c.shift-1)*7+Number(c.id.slice(-1))-1]&&["correct","wrong","missed"].includes(c.status)&&Number.isInteger(c.seen)&&c.seen>=0&&c.seen<=3&&Number.isInteger(c.arrive)&&c.arrive>=0&&typeof c.note==="string"&&c.note.length<=500&&(c.action===null||Object.hasOwn(actions,c.action)))&&allCases(g).reduce((n,c)=>n+c.hints,0)<=3;
}

for(const scenario of scenarios) Object.freeze(scenario);
Object.freeze(scenarios);
Object.freeze(actions);
const SOC=Object.freeze({scenarios,actions,start,deadline,tick,inspect,act,next,note,upgrade,triageFields,triage,allCases,hint,hintText,advance,dailySeed,queue,stats,badges,assets,controls,report,validExtra});
if(typeof module !== 'undefined') module.exports=SOC;
