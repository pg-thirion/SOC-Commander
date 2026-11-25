"use strict";
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const {chromium, firefox, webkit} = require("playwright");
const SOC = require("./engine.js");
const key="soc-commander-v1";
const assets={"index.html":"text/html; charset=utf-8","style.css":"text/css; charset=utf-8","engine.js":"text/javascript; charset=utf-8","app.js":"text/javascript; charset=utf-8","favicon.svg":"image/svg+xml"};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,"http://localhost");
 const name=url.pathname==="/SOC-Commander/"?"index.html":url.pathname.replace(/^\/SOC-Commander\//,"");
 if(!Object.hasOwn(assets,name)){res.writeHead(404);return res.end();}
 res.writeHead(200,{"Content-Type":assets[name],"X-Content-Type-Options":"nosniff"});
 res.end(fs.readFileSync(path.join(__dirname,name)));
});
async function state(page){return page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);}
async function click(page,sel){await page.locator(sel).click();}
async function response(page,c,action){
 await click(page,'[data-case="'+c.id+'"]');
 await click(page,'[data-action="'+action+'"]');
 assert.equal(await page.locator("#actionconfirm").isVisible(),true);
 await click(page,"#confirmact");
 await page.locator("#actionconfirm").waitFor({state:"hidden"});
}
async function campaign(page,base,viewport,mode){
 const errors=[],requests=[];
 page.on("pageerror",e=>errors.push(String(e)));
 page.on("console",m=>{if(m.type()==="error")errors.push(m.text());});
 page.on("request",r=>{if(!r.url().startsWith(base))requests.push(r.url());});
 await page.setViewportSize(viewport);
 await page.goto(base);
 assert(await page.locator("#welcome").isVisible());
 await click(page,"#help");
 assert(await page.locator("#guide").isVisible());
 await page.keyboard.press("Escape");
 await page.locator("#guide").waitFor({state:"hidden"});
 await click(page,'[data-mode="'+mode+'"]');
 await click(page,"#start");
 assert.equal((await state(page)).mode,mode);
 assert.equal(await page.locator(".alert").count(),3);
 assert(await page.locator("#game").isVisible());
 assert.equal(await page.locator("progress").count(),2);
 async function noOverflow(){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"horizontal overflow at "+viewport.width);}
 await noOverflow();
 let g=await state(page),c=g.cases[0];
 await click(page,'[data-case="'+c.id+'"]');
 await click(page,"#star"); assert.equal((await state(page)).cases[0].star,true); await page.locator("[data-triage=assigned]").selectOption("Tier 2"); await page.locator("[data-triage=verdict]").selectOption("Suspicious"); await page.locator("[data-triage=confidence]").selectOption("High"); await page.locator("#starred").check(); assert.equal(await page.locator(".alert").count(),1); await page.locator("#starred").uncheck(); await page.locator("#search").fill(SOC.scenarios[c.idx][4]); assert(await page.locator(".alert").count()>=1); await page.locator("#search").fill(""); await click(page,"#inspect");
 assert.equal((await state(page)).cases[0].seen,1);
 const note='<img src=x onerror=alert(1)> & <script>bad()</script>';
 await page.locator("#notes").fill(note);
 assert.equal((await state(page)).cases[0].note,note);
 await page.reload();
 assert.equal(await page.locator("#notes").inputValue(),note);
 assert.equal(await page.locator("#details img").count(),0);
 assert.equal(await page.locator("#details script").count(),0);
 await page.locator("#severity").selectOption("critical");
 for(const badge of await page.locator("#queue .severity").allTextContents())assert.equal(badge,"critical");
 await page.locator("#severity").selectOption("all");
 await click(page,'[data-case="'+c.id+'"]');
 await click(page,'[data-action="'+SOC.scenarios[c.idx][9]+'"]');
 await page.keyboard.press("Escape");
 assert.equal((await state(page)).correct,0);
 while(true){
  g=await state(page);
  if(g.status==="won")break;
  assert.notEqual(g.status,"lost");
  if(g.status==="briefing"){
   assert(await page.locator("#banner").isVisible());
   await page.reload();
   assert(await page.locator("#next").isVisible());
   await click(page,"#next");
   continue;
  }
  c=g.cases.filter(c=>c.status==="open"&&c.arrive<=g.turn).sort((a,b)=>SOC.deadline(g,a)-SOC.deadline(g,b))[0];
  if(!c){await click(page,"#wait");continue;}
  await response(page,c,SOC.scenarios[c.idx][9]);
 }
 g=await state(page);
 assert.equal(g.correct,21);assert.equal(g.health,100);assert.equal(g.business,100);
 assert.equal(g.blocked.length,SOC.scenarios.filter(s=>s[9]==="block").length);
 assert.match(await page.locator("#banner").innerText(),/Rank S/);
 await page.reload();assert.match(await page.locator("#banner").innerText(),/Rank S/);
 await noOverflow();
 for(const tool of ["intel","assets","controls","stats","archive","badges","report"]){await click(page,'[data-tool="'+tool+'"]'); assert(await page.locator("#toolbox").isVisible()); assert((await page.locator("#toolcontent").innerText()).length>0||tool==="report"); await page.keyboard.press("Escape"); await page.locator("#toolbox").waitFor({state:"hidden"});}
 await click(page,"#again");assert(await page.locator("#welcome").isVisible());
 await click(page,"#start");
 g=await state(page);c=g.cases[0];
 const wrong=Object.keys(SOC.actions).find(a=>a!==SOC.scenarios[c.idx][9]);
 await response(page,c,wrong);
 assert.equal((await state(page)).wrong,1);
 await click(page,"#restart");await page.keyboard.press("Escape");assert(await page.locator("#game").isVisible());
 await click(page,"#restart");await click(page,"#confirmnew");assert(await page.locator("#welcome").isVisible());
 await page.evaluate(k=>localStorage.setItem(k,"{invalid"),key);
 await page.reload();assert(await page.locator("#welcome").isVisible());
 assert.match(await page.locator("#saveerror").innerText(),/invalid/);
 await click(page,"#start");assert(await page.locator("#game").isVisible());
 assert.deepEqual(errors,[],"browser errors");assert.deepEqual(requests,[],"external requests");
}
(async()=>{
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const base="http://127.0.0.1:"+server.address().port+"/SOC-Commander/";
 try{
  for(const [name,browserType] of Object.entries({chromium,firefox,webkit})){
   const browser=await browserType.launch({headless:true});
   try{
    for(const [viewport,mode] of [[{width:1440,height:900},"standard"],[{width:390,height:844},"expert"],[{width:320,height:700},"training"]]){
     const context=await browser.newContext({viewport});
     try{await campaign(await context.newPage(),base,viewport,mode);console.log(name,viewport.width,mode,"PASS");}finally{await context.close();}
    }
   }finally{await browser.close();}
  }
 }finally{server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
