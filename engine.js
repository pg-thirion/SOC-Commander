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
 return {version:1,mode,seed,order,shift:1,turn:0,health:100,business:100,score:0,streak:0,bestStreak:0,correct:0,wrong:0,missed:0,investigated:0,limit:limits[mode],cases:[],history:[],blocked:[],status:"playing"};
}
function start(mode,seed){const g=createGame(mode,seed);return openShift(g);}
function openShift(g){g.turn=0;g.cases=g.order.slice((g.shift-1)*7,g.shift*7).map((idx,i)=>({idx,id:"INC-"+String(g.shift*100+i+1),arrive:i<3?0:(i-2)*3,seen:0,status:"open",note:"",action:null,delta:0}));g.status="playing";return g;}
function severity(c){return scenarios[c.idx][2];}
function deadline(g,c){const base={critical:18,high:24,medium:32,low:40}[severity(c)];return c.arrive+Math.round(base*({training:1.6,standard:1,expert:.75}[g.mode]));}
function log(g,msg){g.history.push({shift:g.shift,turn:g.turn,msg});}
function clamp(v){return Math.max(0,Math.min(100,v));}
function finishCheck(g){if(g.health<=0||g.business<=0){g.status="lost";return;}if(g.cases.every(c=>c.status!=="open"))g.status=g.shift===3?"won":"briefing";}
function tick(g,cost=1){if(g.status!=="playing"||!Number.isSafeInteger(cost)||cost<=0)return false;g.turn=Math.min(g.limit,g.turn+cost);for(const c of g.cases){if(c.status==="open"&&(g.turn>=g.limit||g.turn>=deadline(g,c))){c.status="missed";g.missed++;g.streak=0;const threat=scenarios[c.idx][9]!=="dismiss";g.health=clamp(g.health-(threat?({critical:24,high:15,medium:8,low:4}[severity(c)]):0));g.business=clamp(g.business-3);g.score-=threat?80:25;log(g,c.id+" expired without resolution.");}}finishCheck(g);return true;}
function inspect(g,id){const c=g.cases.find(x=>x.id===id);if(g.status!=="playing"||!c||c.status!=="open"||c.arrive>g.turn||c.seen>=3)return false;c.seen++;g.investigated++;log(g,id+" evidence "+c.seen+" reviewed.");tick(g,1);return true;}
function act(g,id,action){const c=g.cases.find(x=>x.id===id);if(g.status!=="playing"||!c||c.status!=="open"||c.arrive>g.turn||!Object.hasOwn(actions,action))return false;const s=scenarios[c.idx];const good=action===s[9];c.status=good?"correct":"wrong";c.action=action;const amount=good?100+c.seen*15+Math.min(g.streak,5)*10:-60;c.delta=amount;g.score+=amount;if(good){g.correct++;g.streak++;g.bestStreak=Math.max(g.bestStreak,g.streak);if(action==="block"&&!g.blocked.includes(s[4]))g.blocked.push(s[4]);}else{g.wrong++;g.streak=0;if(s[9]!=="dismiss")g.health=clamp(g.health-({critical:20,high:12,medium:7,low:4}[s[2]]));if(action!=="dismiss")g.business=clamp(g.business-12);}
 log(g,id+" · "+actions[action]+" · "+(good?"Correct":"Incorrect"));tick(g,2);return true;}
function next(g){if(g.status!=="briefing")return false;g.shift++;openShift(g);return true;}
function note(g,id,value){const c=g.cases.find(x=>x.id===id);if(g.status!=="playing"||!c||c.status!=="open"||c.arrive>g.turn)return false;c.note=String(value).slice(0,500);return true;}
for(const scenario of scenarios) Object.freeze(scenario);
Object.freeze(scenarios);
Object.freeze(actions);
const SOC=Object.freeze({scenarios,actions,start,deadline,tick,inspect,act,next,note});
if(typeof module !== 'undefined') module.exports=SOC;
