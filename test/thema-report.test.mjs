import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { THEMA_GUIDES } from '../lib/thema-gidsen.js';
import { portionCost, heatCost, themeAdvice, renderThema, themaSchema } from '../lib/thema-tools.js';
import { normalizedUrl,visitSource,probeEvidence,reportDay,googleReport } from '../lib/vindbaarheid.js';
import { kv } from '../lib/db.js';
import handler from '../api/keuze-tools.js';
import reportHandler from '../api/vindbaarheid.js';
async function request(fn,url,body,method='GET',headers={}){let status=200,data;const h={};const res={setHeader(k,v){h[k.toLowerCase()]=v;},status(n){status=n;return this;},send(x){data=x;return this;},json(x){data=x;return this;},end(){return this;}};await fn({url,body,method,headers:{host:'keuzehulp.best',...headers}},res);return {status,data,headers:h};}
test('four real theme endpoints provide crawlable content, reciprocal languages and matching structured answers',async()=>{
  for(const [theme,markets]of Object.entries(THEMA_GUIDES))for(const [market,g]of Object.entries(markets)){
    const r=await request(handler,'/api/keuze-tools?tool='+theme+'&market='+market);assert.equal(r.status,200);assert.equal(r.headers['x-robots-tag'],'index, follow');assert(r.data.includes('<html lang="'+g.lang+'">'));assert(r.data.includes('rel="canonical" href="https://'+g.host+'/'+g.slug+'"'));assert.equal((r.data.match(/<h1>/g)||[]).length,1);assert(r.data.includes('hreflang="de-DE"'));assert(r.data.includes('hreflang="nl-NL"'));assert(r.data.includes('id="theme-cost"'));assert(!r.data.includes('368.000'));
    const ld=themaSchema(theme,market);assert.deepEqual(ld['@graph'].find(x=>x['@type']==='FAQPage').mainEntity.map(x=>x.acceptedAnswer.text),g.faq.map(x=>x[1]));
    await fs.writeFile(new URL('../../previews/'+theme+'-'+market+'.html',import.meta.url),r.data);
  }
  assert.equal((await request(handler,'/api/keuze-tools?tool=acai&market=us')).status,404);
});
test('German Amazon links use the configured existing German partner tag',()=>{
  const previous=process.env.WTB_TAG_DE;process.env.WTB_TAG_DE='existing-test-21';try{const html=renderThema('acai','de');assert(html.includes('www.amazon.de/s?'));assert(html.includes('tag=existing-test-21'));assert(!html.includes('amazon.com/'));assert(!html.includes('henq-21'));}finally{if(previous===undefined)delete process.env.WTB_TAG_DE;else process.env.WTB_TAG_DE=previous;}
});
test('portion costs compare own doses and include extras and shipping',()=>{
  assert.deepEqual(portionCost(8,400,100,1.5,.5),{base:2,total:4});assert.deepEqual(portionCost(15,100,5,1.5,0),{base:.75,total:2.25});
  for(const args of [[8,0,1,0,0],[8,100,101,0,0],[-1,100,5,0,0],[8,100,5,-1,0],[Infinity,100,5,0,0]])assert.equal(portionCost(...args),null);
});
test('heat calculator respects gas units and never treats SCOP as a fixed winter COP',()=>{
  const de=heatCost(.30,3,1000,.12,.90,'de'),nl=heatCost(.30,3,1000,1.2,.90,'nl');assert.equal(de.pump,100);assert.equal(de.resistance,300);assert(Math.abs(de.gas-133.3333333333)<.0001);assert(Math.abs(nl.gas-136.4715)<.01);assert.equal(de.breakEven,2.25);assert.equal(heatCost(.3,2,1000,.12,.9,'de').pump,150);assert.equal(heatCost(.3,0,1000,.12,.9,'de'),null);assert.equal(heatCost(.3,3,1000,.12,0,'de'),null);
});
test('advice blocks unsuitable equipment, no outside placement and whole-house assumptions',()=>{
  assert.match(themeAdvice('acai','de',[0,1,0]),/kein geeignetes Gerät/);assert.match(themeAdvice('acai','nl',[2,1,0]),/kant-en-klare/);assert.match(themeAdvice('heat','de',[1,0,0]),/Ohne sicheren Außenplatz/);assert.match(themeAdvice('heat','nl',[0,1,1]),/warmteverlies/);assert.match(themeAdvice('heat','de',[0,0,1]),/PortaSplit Cool nicht/);
});
test('referrer classification distinguishes AI, paid search, UTM and deceptive domains',()=>{
  assert.equal(visitSource('https://gemini.google.com'),'gemini');assert.equal(visitSource('https://google.com','',true),'google-betaald');assert.equal(visitSource('https://www.google.de'),'google');assert.equal(visitSource('https://copilot.microsoft.com'),'copilot');assert.equal(visitSource('https://chatgpt.com.attacker.net'),'overig');assert.equal(visitSource('','chatgpt'),'chatgpt-utm');assert.equal(visitSource(''),'direct-onbekend');assert.equal(visitSource('https://kaufberater.best'),'intern');
});
test('AI source metadata, answer links and simple domain mentions remain separate',()=>{
  const target='https://kaufberater.best/acai-bowl-zubereiten';let x=probeEvidence({choices:[{message:{content:'Siehe '+target+'.'}}]},target);assert(x.exactAnswerLink);assert(!x.exactCitation);
  x=probeEvidence({citations:[target+'?utm_source=test'],choices:[{message:{content:'Eine Bowl.'}}]},target);assert(x.exactCitation);assert(!x.exactAnswerLink);
  x=probeEvidence({choices:[{message:{content:'kaufberater.best ist ein Portal'}}]},target);assert(x.domainMention);assert(!x.exactCitation);assert(!x.exactAnswerLink);
  assert.equal(normalizedUrl('https://www.kaufberater.best/acai-bowl-zubereiten/?x=1'),target);assert.equal(reportDay(new Date('2026-10-17T02:00:00Z')),'2026-10-16');
});
test('unsupported national domains are never submitted to the provider',async()=>{
  const fetch0=global.fetch,oldIncr=kv.incr,oldRaw=kv.raw;let calls=[];kv.incr=async()=>1;kv.raw=async()=>1;global.fetch=async(url,o)=>{calls.push(JSON.parse(o.body));return {ok:true,json:async()=>({results:[{domain:'linden.com',available:true}]})};};
  try{let r=await request(handler,'/api/keuze-tools?op=domains',{domains:['linden.nl','linden.de']},'POST');assert.equal(calls.length,0);assert(r.data.results.every(x=>x.available===null&&x.unsupported));r=await request(handler,'/api/keuze-tools?op=domains',{domains:['linden.nl','linden.com']},'POST');assert.deepEqual(calls,[{domains:['linden.com']}]);assert.equal(r.data.results[0].available,null);assert.equal(r.data.results[1].available,true);}finally{global.fetch=fetch0;kv.incr=oldIncr;kv.raw=oldRaw;}
});
test('visit endpoint stores only whitelisted slug and normalized source with retention',async()=>{
  const get=kv.get,raw=kv.raw,incr=kv.incr;const commands=[];kv.get=async()=>[{slug:'acai-bowl-zubereiten'}];kv.incr=async()=>1;kv.raw=async args=>{commands.push(args);return 1;};
  try{const h={host:'kaufberater.best',origin:'https://kaufberater.best','x-forwarded-for':'192.0.2.4'};let r=await request(reportHandler,'/api/vindbaarheid?op=visit',{slug:'acai-bowl-zubereiten',ref:'https://chatgpt.com/c/private'},'POST',h);assert.equal(r.status,204);const c=commands.find(x=>x[0]==='HINCRBY');assert.equal(c[2],'acai-bowl-zubereiten|chatgpt');assert(!JSON.stringify(commands).includes('192.0.2.4'));assert(!JSON.stringify(commands).includes('private'));r=await request(reportHandler,'/api/vindbaarheid?op=visit',{slug:'invented-slug'},'POST',h);assert.equal(r.status,400);}finally{kv.get=get;kv.raw=raw;kv.incr=incr;}
});
test('GSC page totals remain independent of withheld query rows',async()=>{
  const fetch0=global.fetch,get=kv.get;kv.get=async()=>({t:'test-token',exp:Date.now()+3600000});global.fetch=async(url,options)=>{const b=JSON.parse(options.body);assert.equal(b.dataState,'final');const rows=b.dimensions.length===1&&b.dimensions[0]==='date'?[{keys:['2026-10-14'],impressions:12,clicks:1}]:b.dimensions.length===1?[{keys:['https://kaufberater.best/acai-bowl-zubereiten'],impressions:12,clicks:1,position:8}]:[{keys:['https://kaufberater.best/acai-bowl-zubereiten','acai bowl rezept'],impressions:5,clicks:1,position:8}];return {ok:true,json:async()=>({rows})};};
  try{const g=await googleReport('kaufberater.best',['sc-domain:kaufberater.best']);assert.equal(g.dataDate,'2026-10-14');assert.equal(g.pages[0].impressions,12);assert.equal(g.pages[0].queries[0].impressions,5);}finally{global.fetch=fetch0;kv.get=get;}
});
test('daily endpoint builds three-site report once, stores compact history and caps AI calls at six',async()=>{
 const old={fetch:global.fetch,get:kv.get,set:kv.set,raw:kv.raw,incr:kv.incr,del:kv.del},store=new Map();let probes=0;
 kv.get=async k=>k==='hjdk:gsc:at'?{t:'fake',exp:Date.now()+3600000}:store.get(k)||null;
 kv.set=async(k,v)=>{store.set(k,v);return 'OK';};kv.incr=async k=>{const n=(store.get(k)||0)+1;store.set(k,n);return n;};kv.del=async keys=>{keys.forEach(k=>store.delete(k));return keys.length;};
 kv.raw=async args=>{if(args[0]==='SET'){if(args.includes('NX')&&store.has(args[1]))return null;store.set(args[1],args[2]);return 'OK';}if(args[0]==='HGETALL')return [];if(args[0]==='EXPIRE')return 1;throw new Error('Unexpected Redis command');};
 global.fetch=async(url,options)=>{url=String(url);if(url==='https://www.googleapis.com/webmasters/v3/sites')return Response.json({siteEntry:['keuzehulp.best','whichtobuy.best','kaufberater.best'].map(h=>({siteUrl:'sc-domain:'+h}))});if(url.includes('/searchAnalytics/query')){const b=JSON.parse(options.body);if(b.dimensions[0]==='date')return Response.json({rows:[{keys:['2026-10-14'],impressions:10,clicks:0}]});return Response.json({rows:[]});}if(url.endsWith('/sitemap.xml'))return new Response('<urlset><url><loc>'+url.replace('/sitemap.xml','/test-guide')+'</loc></url></urlset>');if(url.includes('ai-gateway.vercel.sh')){probes++;return Response.json({choices:[{message:{content:'Advies met bron.'}}],citations:['https://kaufberater.best/acai-bowl-zubereiten']});}throw new Error('Unexpected network request');};
 const auth=process.env.AI_GATEWAY_API_KEY;process.env.AI_GATEWAY_API_KEY='fake';const bing=process.env.BING_WEBMASTER_KEY;delete process.env.BING_WEBMASTER_KEY;
 try{const r=await request(reportHandler,'/api/vindbaarheid?op=dag');assert.equal(r.status,200);assert.equal(probes,6);assert.equal(Object.keys(r.data.report.sites).length,3);assert.equal(r.data.report.sites.de.bing.status,'niet-gekoppeld');assert.equal(r.data.report.probes[0].exactCitation,true);assert.equal(typeof store.get('vind:snapshot:'+reportDay()),'string');const again=await request(reportHandler,'/api/vindbaarheid?op=dag');assert.equal(again.status,200);assert.equal(probes,6);const html=await request(reportHandler,'/vindbaarheid');assert.equal(html.status,200);assert(html.data.includes('Doelpagina als bron gemeld'));assert(html.data.includes('noindex,nofollow'));}
 finally{global.fetch=old.fetch;for(const k of ['get','set','raw','incr','del'])kv[k]=old[k];if(auth===undefined)delete process.env.AI_GATEWAY_API_KEY;else process.env.AI_GATEWAY_API_KEY=auth;if(bing===undefined)delete process.env.BING_WEBMASTER_KEY;else process.env.BING_WEBMASTER_KEY=bing;}
});
