import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { createHash,randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as ui from '../lib/tsc-ranking-ui.js';
import * as dental from '../lib/tsc-dental.js';
import * as searchIntent from '../lib/tsc-search-intent.js';
import * as acquisition from '../lib/tsc-acquisition.js';
import * as catalog from '../lib/tsc-catalog.js';
import * as ranking from '../lib/tsc-reviewrank.js';
import * as engage from '../lib/tsc-engagement.js';
import * as signup from '../lib/tsc-signup.js';
import { SURGERY_FAVICON } from '../lib/tsc-design.js';
import { topicPicker } from '../lib/tsc-topic-picker.js';
import * as data from '../lib/tsc-data.js';
import { LIJSTEN,RANK_SLUGS } from '../lib/tsc-rank.js';
import * as provider from '../lib/tsc-provider.js';
import * as lookLayer from '../lib/tsc-look.js';
import * as linkLayer from '../lib/tsc-links.js';
import * as chirurgie from '../lib/chirurgie.js';
import { FN_JS } from '../lib/funnel.js';
import { metHuisstijl } from '../lib/huisstijl.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let checks=0;
async function test(name,fn){await fn();checks++;console.log('ok',name);}
const raw=fs.readFileSync(path.join(root,'lib/tsc.js'),'utf8').replace(/^import\b[^;\n]*;[^\n]*\n/gm,'');
const names={...data,SURGERY_FAVICON,ROUTES:JSON.parse(fs.readFileSync(path.join(root,'data/tsc-routes.json'))),LIJSTEN,RANK_SLUGS,...ui,...catalog,...signup,...dental,...searchIntent,...ranking,FN_JS,metHuisstijl, ...provider, ...lookLayer, ...linkLayer };
const render=new Function(...Object.keys(names),raw.replace(/export /g,'')+';return {home,rankPagina,pagina,checkPagina,extraPagina,llms,ALL,pageDate,tscHandler};')(...Object.values(names));
const out=path.join(root,'qa-render');fs.mkdirSync(out,{recursive:true});
const scriptCheck=html=>{for(const m of html.matchAll(/<script(?![^>]*application\/(?:ld\+)?json)[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);};
await test('active surgery renderer keeps dental answers and limits ranking claims',()=>{
 const ids=[['procedure-dental-implants','Wat kost een implantaat inclusief abutment en kroon?'],['procedure-veneers','Kan ik facings zonder slijpen kiezen?'],['procedure-aligners','Zijn retainers inbegrepen in de prijs?']];
 for(const [id,q] of ids){
  const html=chirurgie.lijstPagina(data.SITE.base,id,'nl',{aanmeld:'<section id="mail"></section>'});
  assert.ok(html.includes(q),id);assert.ok(html.includes('rel="noopener nofollow"'),id);assert.ok(html.includes('Alle tandheelkundige onderwerpen'),id);
  assert.ok(!/Onze eerste keus|De beste klinieken/.test(html),id);assert.ok(html.includes('geen oordeel over veiligheid, geschiktheid of behandelresultaat'),id);
  scriptCheck(html);
 }
 const dr=chirurgie.rang('bbl-dr'),y=[...dr.rij,...dr.rest].find(x=>/Yily De Los Santos/i.test(x.k.naam));
 assert.ok(y);assert.equal(y.e.sources.included.some(x=>/suspend|geschorst/i.test(x.waarschuwing||'')),false);assert.ok(y.s.erv<30);
 assert.ok(!/Kies Dr\. Yily|Choose Dr\. Yily|Wählen Sie Dr\. Yily/.test(chirurgie.lijstPagina(data.SITE.base,'bbl-dr','nl',{})));
 const direct=Object.entries(LIJSTEN).flatMap(([id,l])=>(l.klinieken||[]).filter(k=>k.kind==='doctor').map(k=>({id,k}))).find(x=>chirurgie.PAGINA[Object.keys(chirurgie.PAGINA).find(slug=>chirurgie.PAGINA[slug].id===x.id&&chirurgie.PAGINA[slug].k===x.k.id&&chirurgie.PAGINA[slug].taal==='en')]);
 if(direct){const slug=Object.keys(chirurgie.PAGINA).find(x=>chirurgie.PAGINA[x].id===direct.id&&chirurgie.PAGINA[x].k===direct.k.id&&chirurgie.PAGINA[x].taal==='en'),html=chirurgie.pagina(data.SITE.base,slug,{}),ld=JSON.parse(html.match(/application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.ok(ld['@graph'].some(x=>x['@type']==='Physician'&&x.name===direct.k.naam));}
});
await test('all public SSR pages: unique IDs, correct language, scripts and metadata',()=>{
 for(const tl of ['en','nl','de']){
  for(const cat of [false,true]){const html=render.home(data.SITE.base,tl,cat);assert.equal((html.match(/id="mail"/g)||[]).length,1);if(!cat)assert.ok(html.indexOf('id="mail"')>html.indexOf('id="ingrepen"'));scriptCheck(html);fs.writeFileSync(path.join(out,(cat?'catalog-':'home-')+tl+'.html'),html);}
  for(const [id,l] of Object.entries(LIJSTEN)){
   const slug=l.slugs[tl];if(!slug)continue;const html=render.rankPagina(data.SITE.base,slug,{id,taal:tl},{});
   assert.equal((html.match(/<h1>/g)||[]).length,1);assert.ok(html.includes('lang="'+tl+'"'));assert.ok(html.includes('href="'+data.SITE.base+'/'+slug+'"'));assert.ok(!html.includes('data-compare'));
   assert.equal((html.match(/id="mail"/g)||[]).length,1);assert.ok(html.indexOf('id="mail"')<html.indexOf('id="clinics"'));
   const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length,'duplicate ID '+slug);
   for(const [other,s] of Object.entries(l.slugs))assert.ok(html.includes('hreflang="'+other+'" href="'+data.absUrl(s)+'"'));
   const ld=JSON.parse(html.match(/application\/(?:ld\+)?json">([\s\S]*?)<\/script>/)[1]);const lists=ld['@graph'].filter(x=>x['@type']==='ItemList');assert.equal(lists.length,2);
   for(const [i,kind]of ['clinic','doctor'].entries()){const r=ranking.reviewRanking(l,kind);assert.deepEqual(lists[i].itemListElement.map(x=>x.name),r.ranked.map(x=>x.k.naam));for(const item of lists[i].itemListElement)assert.ok(html.includes('id="'+item.url.split('#')[1]+'"'));}
   assert.equal(html.includes('content="noindex"'),!!l.noindex);assert.ok(!html.includes('aggregateRating'));
   assert.ok(ui.choiceTitle(l,tl).length<=60);assert.ok(ui.choiceDescription(l,tl).length<=155);
   scriptCheck(html);if(['procedure-laser-eye','procedure-whitening','tummy-mexico','hair-turkey'].includes(id))fs.writeFileSync(path.join(out,slug.replaceAll('/','_')+'.html'),html);
  }
 }
 for(const [slug,pg]of Object.entries(data.PAGES)){const html=render.pagina(data.SITE.base,slug,pg,{});scriptCheck(html);assert.equal((html.match(/id="mail"/g)||[]).length,1);}
});
await test('sitemap excludes sparse pages and uses page-specific dates',()=>{
 const all=render.ALL();for(const [slug,i]of Object.entries(RANK_SLUGS))assert.equal(all.includes(slug),!LIJSTEN[i.id].noindex);
 assert.equal(render.pageDate('check-surgeon-turkey'),'2026-11-14');assert.ok(!render.llms().includes('Profiles are ordered by documented fields'));
});
const rv=(platform,score,n,scope='organization',extra={})=>({platform,score,max:5,aantal:n,scope,bron:'https://'+platform+'.example/review/a',datum:'2026-11-15',...extra});
await test('review scope: doctor and facility figures cannot inflate clinic score',()=>{
 const p={reviews:[rv('A',2,100),rv('B',5,500,'doctor'),rv('C',5,500,'facility')]};assert.equal(ranking.reviewSources(p).included.length,1);assert.equal(ranking.experienceIndex(p,4).score,(200+80)/120);
});
await test('invalid, unavailable and suspended reviews excluded visibly',()=>{
 const p={reviews:[rv('A',5,100,'organization',{waarschuwing:'account suspended'}),rv('B',4,20,'organization',{rating_available:false})]};const r=ranking.experienceIndex(p);assert.equal(r.eligible,false);assert.equal(r.sources.excluded[0].reason,'platform_restriction');
 const actual=ranking.reviewRanking(LIJSTEN['hair-turkey'],'doctor');assert.ok(actual.unranked.some(r=>r.k.naam.includes('Serkan')));
});
await test('duplicate URL and multiple profiles from one platform count once',()=>{
 const a=rv('A',4,10),b={...a,bron:a.bron+'/branch',aantal:50},p={reviews:[a,a,b]};assert.equal(ranking.reviewSources(p).included.length,1);assert.equal(ranking.reviewSources(p).included[0].aantal,50);
});
await test('10-point scale, platform cap, strong disagreement and no unique-patient total',()=>{
 const p={reviews:[rv('A',2.6,211),rv('B',8.7,13613,'organization',{max:10})]},r=ranking.experienceIndex(p,4);
 assert.ok(r.range>1.7);assert.equal(r.unique_patients,null);assert.equal(r.source_counts[1].count,13613);
 assert.equal(ranking.experienceIndex({reviews:[rv('A',5,100)]},4).score,ranking.experienceIndex({reviews:[rv('A',5,1000000)]},4).score);
});
await test('ranking invariant to payment; serious unresolved issues outside ranking',()=>{
 const p={naam:'A',id:'a',reviews:[rv('A',4.5,100)]};assert.deepEqual(ranking.experienceIndex(p),ranking.experienceIndex({...p,paid:999999,boost:100}));assert.equal(ranking.experienceIndex({...p,risico:[{ernst:'zwaar'}]}).eligible,false);
});
await test('individual doctor reviews match identity and never inherit clinic rating',()=>{
 const p={naam:'Clinic',artsen:[{naam:'Ada Smith',bron:'https://clinic.example/ada'}],reviews:[rv('A',5,100)]};assert.equal(ranking.physicianRecords([p]).length,0);
 p.reviews.push(rv('RealSelf',4,30,'doctor',{bron:'https://www.realself.com/dr/ada-smith-london'}));assert.equal(ranking.physicianRecords([p])[0].reviews.length,1);
});
await test('consent, topics, legacy delivery and self-declared warmth',()=>{
 assert.equal(engage.signupPreferences({topics:['laser-eye']}).ok,false);assert.equal(engage.signupPreferences({topics:['bad'],consent:true}).ok,false);
 assert.deepEqual(engage.selectedTopics({topics:['hair','hair','laser-eye']}),['hair','laser-eye']);
 assert.equal(engage.dueToday({actief:true,ingreep:'hair'},'2026-11-15',[]),false);
 assert.equal(engage.dueToday({actief:true,frequency:'daily',consent_version:engage.CONSENT_VERSION},'2026-11-15',[]),true);
 assert.equal(engage.warmth({opens:900,clicks:900}).stage,'unknown');assert.equal(engage.experimentVerdict(0,0,0,0).winner,null);
});
await test('signup uses an explicit daily request, custom picker and no consent checkbox',()=>{
 for(const tl of ['nl','en','de']){
  const html=signup.signupBlock(data.SITE.base,'test',{ingreep:'hair'},tl);
  assert.ok(!/type="checkbox"/.test(html));assert.ok(!/select[^>]+id="tsc-(?:topic|ingreep)"/.test(html));
  assert.equal((html.match(/id="tsc-learn"/g)||[]).length,1);assert.equal((html.match(/data-tp-id=/g)||[]).length,42);
  assert.ok(html.includes('request_button_and_email_confirmation'));assert.ok(html.includes('aria-haspopup="dialog"'));
  assert.ok(html.includes(signup.SIGNUP_COPY[tl].success));scriptCheck(html);
 }
});
await test('topic picker: searches, limits to 8, saves explicitly, cancels and restores focus',()=>{
 const make=()=>({value:'',hidden:false,attributes:{},events:{},dataset:{},setAttribute(k,v){this.attributes[k]=v},getAttribute(k){return this.attributes[k]},addEventListener(k,fn){this.events[k]=fn},dispatchEvent(){},focus(){d.activeElement=this}});
 const byId=Object.fromEntries(['tp-dialog','tp-open','tsc-topics','tp-search','tp-count','tp-error','tp-apply','tp-value','tp-close','tp-empty','tp-clear'].map(id=>[id,make()]));
 const groups=['',...new Set(catalog.PROCEDURES.map(p=>p.group))].map(group=>{const e=make();e.dataset.tpGroup=group;return e});
 const options=catalog.PROCEDURES.map(p=>{const li=make(),button=make(),mark=make();li.dataset={group:p.group,search:(p.nl+' '+p.en).toLowerCase()};button.dataset.tpId=p.id;button.querySelector=()=>mark;li.querySelector=()=>button;return {li,button}});
 const panel=make(),modal=byId['tp-dialog'];modal.querySelectorAll=s=>s==='[data-tp-id]'?options.map(x=>x.button):s==='[data-tp-item]'?options.map(x=>x.li):groups;modal.querySelector=()=>panel;
 modal.showModal=()=>{modal.open=true};modal.close=()=>{modal.open=false;modal.events.close()};
 const docEvents={},d={getElementById:id=>byId[id],addEventListener(k,fn){docEvents[k]=fn},activeElement:null};
 vm.runInNewContext(topicPicker('nl',['hair']).match(/<script>([\s\S]*?)<\/script>/)[1],{document:d,Event:class{}});
 const open=()=>byId['tp-open'].onclick(),choose=id=>options.find(x=>x.button.dataset.tpId===id).button.onclick();
 assert.deepEqual(JSON.parse(byId['tsc-topics'].value),['hair']);open();assert.equal(d.activeElement,byId['tp-search']);
 byId['tp-search'].value='oog';byId['tp-search'].events.input();assert.ok(options.some(x=>!x.li.hidden&&x.button.dataset.tpId==='laser-eye'));assert.ok(options.find(x=>x.button.dataset.tpId==='hair').li.hidden);
 byId['tp-search'].value='zzzz-no-match';byId['tp-search'].events.input();let prevented=false;byId['tp-search'].events.keydown({key:'Enter',preventDefault(){prevented=true}});assert.ok(prevented);

 choose('laser-eye');byId['tp-close'].onclick();assert.deepEqual(JSON.parse(byId['tsc-topics'].value),['hair']);assert.equal(d.activeElement,byId['tp-open']);
 open();choose('hair');choose('laser-eye');byId['tp-apply'].onclick();assert.deepEqual(JSON.parse(byId['tsc-topics'].value),['laser-eye']);
 open();byId['tp-clear'].onclick();assert.equal(byId['tp-apply'].disabled,true);for(const p of catalog.PROCEDURES.slice(0,9))choose(p.id);assert.match(byId['tp-count'].textContent,/^8 \/ 8/);assert.ok(byId['tp-error'].textContent);byId['tp-apply'].onclick();assert.equal(JSON.parse(byId['tsc-topics'].value).length,8);
 open();assert.equal(options.filter(x=>!x.li.hidden).length,42);groups.find(g=>g.dataset.tpGroup==='ogen').onclick();assert.equal(options.filter(x=>!x.li.hidden).length,4);
 byId['tp-value']=null;assert.doesNotThrow(()=>docEvents.click({target:{closest:()=>({dataset:{followTopic:'hair'}})}}));
});
await test('catalog filters do not touch the topic picker; favicon is served before database work',async()=>{
 const html=render.home(data.SITE.base,'nl',false);assert.ok(html.includes("querySelectorAll('#sr-topicgroups>section[data-group]')"));assert.ok(html.includes('/surgery/favicon.svg?v=4'));
 const headers={},res={setHeader(k,v){headers[k]=v},status(n){this.code=n;return this},send(body){this.body=body;return this}};
 await render.tscHandler({headers:{host:'todayin.email'}},res,new URL('https://todayin.email/true-surgery?p=favicon.svg'));
 assert.equal(res.code,200);assert.match(headers['content-type'],/image\/svg\+xml/);assert.equal(res.body,SURGERY_FAVICON);assert.ok(!res.body.includes('<script'));
});
await test('preference HTML resists script injection',()=>{
 const html=signup.preferencesBlock(data.SITE.base,'a'.repeat(48),{taal:'nl',topics:['hair']},'</script><script>alert(1)</script>');assert.ok(!html.includes('alert(1)'));scriptCheck(html);
});
// In-memory Redis/provider adapters: exercise the real mail module without sending mail or touching production.
const db=new Map(),sent=[],metrics=[],news=JSON.parse(fs.readFileSync(path.join(root,'data/tsc-nieuws.json')));let sendHook=null;
const clone=v=>v==null?v:structuredClone(v);
const kv={async get(k){return clone(db.get(k)??null)},async set(k,v){db.set(k,clone(v));return 'OK'},async incr(k){const n=(Number(db.get(k))||0)+1;db.set(k,n);return n},async raw(args){const[cmd,key,...args2]=args;if(cmd==='GET'){const v=db.get(key);return v==null?null:typeof v==='string'?v:JSON.stringify(v)}if(cmd==='SET'){if(args2.includes('NX')&&db.has(key))return null;db.set(key,args2[0]);return 'OK'}if(cmd==='SMEMBERS')return [...(db.get(key)||new Set())];if(cmd==='SADD'){const s=db.get(key)||new Set(),old=s.size;args2.forEach(x=>s.add(x));db.set(key,s);return s.size-old}if(cmd==='SREM'){const s=db.get(key)||new Set();return Number(s.delete(args2[0]))}if(cmd==='HGETALL')return Object.entries(db.get(key)||{}).flatMap(([k,v])=>[k,String(v)]);if(cmd==='HINCRBY'){const h=db.get(key)||{};h[args2[0]]=(Number(h[args2[0]])||0)+Number(args2[1]);db.set(key,h);return h[args2[0]]}if(cmd==='EXPIRE')return 1;if(cmd==='EVAL'){const realkey=args2[1],arg=args2[2];if(key.includes('ARGV[2]')){const v=db.get(realkey),raw=typeof v==='string'?v:JSON.stringify(v);if(raw!==arg)return 0;db.set(realkey,args2[3]);return 1}if(key.includes('cjson.decode')){const a=db.get(realkey);if(!a)return null;const merged={...clone(a),...JSON.parse(arg)};db.set(realkey,merged);return JSON.stringify(merged)}if(db.get(realkey)===arg){db.delete(realkey);return 1}return 0}throw new Error('unexpected Redis command '+cmd)}};
await test('visit telemetry rejects automation and reports browser-days honestly',async()=>{
 const html=render.home(data.SITE.base,'nl',false);assert.ok(html.includes('navigator.webdriver'));assert.ok(html.includes('tsc:visit:'));assert.ok(html.includes('setTimeout(go,10000)'));
 const routeSource=raw.replace(/await import\('\.\/db\.js'\)/g,"await __load('db')"),route=new Function(...Object.keys(names),'__load',routeSource.replace(/export /g,'')+';return tscHandler;')(...Object.values(names),async name=>name==='db'?{kv}:{});
 const dag=new Date().toISOString().slice(0,10),key='tsc:d:'+dag;db.delete(key);
 const call=async ua=>{let body='';const res={setHeader(){},status(){return this},send(x){body=x;return this}};await route({headers:{host:'todayin.email','user-agent':ua},method:'POST',body:{b:'direct',p:'nl/tandheelkunde'}},res,new URL('https://todayin.email/true-surgery?p=tel'));return JSON.parse(body)};
 assert.deepEqual(await call('Mozilla/5.0 HeadlessChrome Playwright'),{ok:true,counted:false,reason:'automation'});assert.equal(db.get(key),undefined);
 assert.deepEqual(await call('Mozilla/5.0 Safari/605.1.15'),{ok:true,counted:true});assert.equal(db.get(key).bezoek,1);assert.equal(db.get(key).bezoek_direct,1);assert.equal(db.get(key)['bezoek|nl/tandheelkunde'],1);
});
// Raw SET stores encoded JSON, just as production Redis does.
const get=kv.get;kv.get=async k=>{const v=await get(k);if(typeof v==='string'&&v[0]==='{'){try{return JSON.parse(v)}catch{}}return v};
const mailSource=fs.readFileSync(path.join(root,'lib/tsc-mail-v3.js'),'utf8').replace(/^import\b[^;\n]*;[^\n]*\n/gm,'').replace(/^export \{[^}]+\};\n/gm,'').replace(/export /g,'');
const inputs={createHash,randomBytes,kv,SITE:data.SITE,SRC:data.SRC,NEWS:news,...catalog,...engage,...acquisition,...dental,mailTopThree:provider.mailTopThree,stuur:async(m,idem)=>{if(sendHook)await sendHook(m,idem);sent.push({m,idem});return {id:'test'}},tel:async(...x)=>metrics.push(x),geopend:async()=>{},klik:async()=>data.SITE.base,oldStand:async()=>({abonnees:0})};
const M=new Function(...Object.keys(inputs),mailSource+';return {aanmelden,bevestig,afmelden,preferences,savePreferences,deliver,ronde,past,routeMail,learningStand,mailEvent,acquisitionStand};')(...Object.values(inputs));
const D=new Date().toISOString().slice(0,10),H=t=>createHash('sha256').update(t).digest('hex');
const subscriber=(id,extra={})=>({id,email:id+'@example.invalid',taal:'nl',topics:['laser-eye'],ingreep:'laser-eye',naar:'any',actief:true,frequency:'daily',consent_version:engage.CONSENT_VERSION,af:'a'.repeat(48),pref:'b'.repeat(48),gezien:[],...extra});
const save=async a=>{await kv.set('tsc:abo:'+a.id,a);await kv.set('tsc:af:'+H(a.af),a.id);await kv.set('tsc:pref:'+H(a.pref),a.id);await kv.raw(['SADD','tsc:abos',a.id])};
await test('double opt-in flow: selected topics, no hidden destination, no second mail same day',async()=>{
 db.clear();sent.length=0;metrics.length=0;
 const b={email:'test@example.invalid',taal:'nl',topics:['laser-eye','lipo'],naar:'turkey',consent:true,learn:false,ms:2000,variant:'A',entry_topic:'hair'};assert.equal((await M.aanmelden(b,'test-ip')).ok,true);assert.equal(sent.length,1);
 const t=sent[0].m[0].html.match(/bevestig\?t=([a-f0-9]{48})/)[1];const a=await M.bevestig(t);assert.equal(a.naar,'any');assert.deepEqual(a.topics,['laser-eye','lipo']);assert.equal(sent.length,2);assert.ok(!sent[1].m[0].html.includes('<img'));
 await M.bevestig(t);await M.ronde();assert.equal(sent.length,2);assert.equal(metrics.filter(x=>x[0]==='bevestigd').length,1);
});
await test('daily no-news mail uses a real lesson and matching rotating topic URL',()=>{
 const a=subscriber('links',{topics:['hair','laser-eye']});const m=M.routeMail(a,[],false,D),lesson=engage.dailyLesson(a,D);assert.ok(m.html.includes(catalog.procedureSlug(lesson.topic,'nl')+'?bron=mail'));assert.ok(m.html.includes('geen nieuw nieuws'));assert.ok(!m.html.includes('choosing-who-will-do-your-cosmetic-procedure'));
});
await test('dry run makes no writes and all 101 subscribers are considered',async()=>{
 db.clear();for(let i=0;i<101;i++)await save(subscriber('s'+i,{af:String(i).padStart(48,'a'),pref:String(i).padStart(48,'b')}));const size=db.size;const r=await M.ronde({droog:true});assert.equal(r.mail,101);assert.equal(db.size,size);
 sent.length=0;const live=await M.ronde();assert.equal(live.mail,101);assert.equal(sent.length,101);await M.ronde();assert.equal(sent.length,101);
});
await test('concurrent sends share recipient lock and preserve unsubscribe during send',async()=>{
 db.clear();sent.length=0;const a=subscriber('race');await save(a);sendHook=async()=>{sendHook=null;await M.afmelden(a.af)};
 await Promise.all([M.deliver(a,[]),M.deliver(a,[])]);assert.equal(sent.length,1);assert.equal((await kv.get('tsc:abo:'+a.id)).actief,false);assert.equal((await M.ronde()).mail,0);
});
await test('fresh changes-only preference overrides a stale daily snapshot',async()=>{
 db.clear();sent.length=0;const a=subscriber('changed');await save({...a,frequency:'changes',gezien:news.items.map(x=>x.id)});assert.equal(await M.deliver(a,[]),false);assert.equal(sent.length,0);
});
await test('preference save never reactivates an unsubscribed user or needs tracking consent',async()=>{
 db.clear();const a=subscriber('prefs',{actief:false});await save(a);const r=await M.savePreferences({token:a.pref,topics:['lipo'],stage:'consult',consent:true,learn:false});assert.equal(r.ok,true);assert.equal((await kv.get('tsc:abo:'+a.id)).actief,false);assert.equal(r.warmth.stage,'consult');
});
await test('legacy malformed seen collection and missing preference token recover safely',async()=>{
 db.clear();sent.length=0;const a=subscriber('legacy',{topics:['lipo'],ingreep:'lipo',van:'NL',gezien:{},pref:undefined,frequency:'changes',consent_version:undefined});await kv.set('tsc:abo:'+a.id,a);await kv.raw(['SADD','tsc:abos',a.id]);assert.equal(await M.deliver(a,[]),true);const saved=await kv.get('tsc:abo:'+a.id);assert.ok(Array.isArray(saved.gezien));assert.match(saved.pref,/^[a-f0-9]{48}$/);assert.equal(saved.frequency,'changes');
});
await test('saved outbox cannot deliver topics after preference changes',async()=>{
 db.clear();sent.length=0;const a=subscriber('outbox');await save(a);let attempts=0;sendHook=async()=>{attempts++;throw Error('temporary provider failure')};await assert.rejects(M.deliver(a,[]));sendHook=null;await M.savePreferences({token:a.pref,topics:['lipo'],consent:true,learn:false});assert.equal(await M.deliver(a,[]),false);assert.equal(sent.length,0);assert.equal(attempts,1);
});
await test('fast autofill receives a real confirmation request',async()=>{
 db.clear();sent.length=0;const result=await M.aanmelden({email:'fast@example.invalid',topics:['aligners'],consent:true,ms:400,taal:'nl',van:'NL'},'fast-ip');assert.equal(result.ok,true);assert.equal(sent.length,1);
});
await test('confirmation provider failure is honest and immediate retry reuses the idempotency key',async()=>{
 db.clear();sent.length=0;const idem=[];let attempts=0;sendHook=async(m,key)=>{idem.push(key);if(++attempts===1)throw Error('temporary')};const b={email:'retry@example.invalid',topics:['veneers'],consent:true,taal:'nl',van:'NL'};
 assert.equal((await M.aanmelden(b,'retry-ip')).ok,false);assert.equal(sent.length,0);assert.equal((await M.aanmelden(b,'retry-ip')).ok,true);assert.equal(sent.length,1);assert.equal(idem[0],idem[1]);sendHook=null;
});
await test('concurrent double click creates one confirmation message',async()=>{
 db.clear();sent.length=0;let release;const barrier=new Promise(r=>release=r);let entered;const waiting=new Promise(r=>entered=r);sendHook=async()=>{entered();await barrier};const b={email:'double@example.invalid',topics:['aligners'],consent:true,taal:'en',van:'GB'};const first=M.aanmelden(b,'double-ip');await waiting;const second=await M.aanmelden(b,'double-ip');assert.equal(second.ok,false);release();assert.equal((await first).ok,true);assert.equal(sent.length,1);sendHook=null;
});
await test('assignment is not exposure; acknowledged visibility deduplicates and controls attribution',async()=>{
 db.clear();sent.length=0;const view='1'.repeat(32),assigned=await M.mailEvent({event:'signup_assign',visible:true,view,taal:'nl',topic:'aligners',attribution:{source:'test',campaign:'dental',content:'one'}},'view-ip','Mozilla');assert.equal(assigned.ok,true);assert.equal((await M.learningStand()).cohorts.length,0);
 const ack={event:'signup_view',visible:true,view,receipt:assigned.receipt,variant:assigned.variant};await M.mailEvent(ack,'view-ip','Mozilla');await M.mailEvent(ack,'view-ip','Mozilla');let c=(await M.learningStand()).cohorts[0];assert.equal(c[assigned.variant+'_seen'],1);
 await M.aanmelden({email:'cohort@example.invalid',topics:['aligners'],consent:true,taal:'nl',van:'NL',receipt:assigned.receipt,variant:assigned.variant==='A'?'B':'A'},'view-ip');const token=sent[0].m[0].html.match(/bevestig\?t=([a-f0-9]{48})/)[1];await M.bevestig(token);c=(await M.learningStand()).cohorts.find(c=>c.cohort.startsWith('signup:'));assert.equal(c[assigned.variant+'_yes'],1);assert.equal(c[assigned.variant==='A'?'B_yes':'A_yes']||0,0);const rows=(await M.acquisitionStand()).rows;assert.ok(rows.some(r=>r.attribution.campaign==='dental'&&r.confirmed_first_optins===1));
});
await test('late visibility acknowledgement counts only the assigned displayed variant',async()=>{
 db.clear();sent.length=0;const view='2'.repeat(32),assigned=await M.mailEvent({event:'signup_assign',visible:true,view,taal:'en',topic:'veneers'},'late-ip','Mozilla');
 await M.aanmelden({email:'late@example.invalid',topics:['veneers'],consent:true,taal:'en',receipt:assigned.receipt},'late-ip');await M.mailEvent({event:'signup_view',visible:true,view,receipt:assigned.receipt,variant:assigned.variant},'late-ip','Mozilla');await M.bevestig(sent[0].m[0].html.match(/bevestig\?t=([a-f0-9]{48})/)[1]);const c=(await M.learningStand()).cohorts.find(c=>c.cohort.startsWith('signup:'));assert.equal(c[assigned.variant+'_seen'],1);assert.equal(c[assigned.variant+'_yes'],1);
});
await test('legacy render cohorts cannot appear as active visible-form experiments',async()=>{
 db.clear();await kv.raw(['SADD','tsc:learn:cohorts','signup:nl:veneers']);await kv.raw(['HINCRBY','tsc:learn:signup:nl:veneers','A_seen','1000']);await kv.raw(['HINCRBY','tsc:learn:signup:nl:veneers','A_yes','900']);const st=await M.learningStand();assert.equal(st.cohorts.length,0);assert.equal(st.legacy_cohorts.length,1);assert.equal(st.legacy_cohorts[0].active,false);assert.equal(st.legacy_cohorts[0].verdict.winner,null);
});
await test('unacknowledged assignment and bots cannot create experiment conversions',async()=>{
 db.clear();sent.length=0;assert.equal((await M.mailEvent({event:'signup_assign',visible:true,view:'a'.repeat(32)},'bot-ip','Googlebot')).ok,false);const assigned=await M.mailEvent({event:'signup_assign',visible:true,view:'3'.repeat(32),taal:'nl',topic:'aligners'},'unseen-ip','Mozilla');await M.aanmelden({email:'unseen@example.invalid',topics:['aligners'],consent:true,taal:'nl',receipt:assigned.receipt},'unseen-ip');await M.bevestig(sent[0].m[0].html.match(/bevestig\?t=([a-f0-9]{48})/)[1]);assert.ok(!(await M.learningStand()).cohorts.some(c=>c.cohort.startsWith('signup:')));
});
await test('news matching respects explicit origin and destination preferences',()=>{
 const item={taal:'nl',ingreep:['aligners'],home_countries:['NL'],countries:['BE']};assert.equal(M.past(item,{taal:'nl',topics:['aligners'],naar:'any',van:'NL',follow_countries:['BE']}),true);assert.equal(M.past(item,{taal:'nl',topics:['aligners'],naar:'any',van:'US',follow_countries:['BE']}),false);assert.equal(M.past(item,{taal:'nl',topics:['aligners'],naar:'any',van:'NL',follow_countries:['TR']}),false);
});
await test('dental topics have sourced context, brand evidence and meaningful indexable coverage',()=>{
 const alignerPrices=dental.dentalPrices('aligners','nl',data.SITE.base);assert.ok(alignerPrices.includes('Invisalign-traject'));assert.ok(alignerPrices.includes('retainers'));assert.ok(alignerPrices.includes('GST'));const facts=dental.dentalChatFacts();assert.ok(facts.includes('1415')||facts.includes('1,415'));assert.ok(facts.includes('Motto'));assert.ok(facts.includes('https://www.smileclinic.sk/en/prices/'));assert.ok(facts.includes('still unknown'));assert.ok(facts.includes('PAGINA dental'));
 for(const id of dental.DENTAL_TOPICS){const list=LIJSTEN['procedure-'+id];assert.ok(list.klinieken.length>=5,id);assert.equal(list.noindex,false,id);}
 const noPrep=searchIntent.dentalSearchQuestions('veneers','nl').find(x=>x.q.includes('zonder slijpen'));assert.ok(noPrep);assert.ok(noPrep.a.includes('KNMT-kader'));assert.equal(noPrep.source,'https://knmt.nl/praktijkzaken/kwaliteitskader-cosmetische-mondzorg/cosmetische-mondzorg-in-beeld');const veneerContextHtml=render.rankPagina(data.SITE.base,'nl/ingrepen/facings',{id:'procedure-veneers',taal:'nl'},{});assert.ok(veneerContextHtml.includes('KNMT-kader cosmetische mondzorg, bekeken 17 november 2026'));assert.ok(veneerContextHtml.includes('href="'+noPrep.source+'"'));assert.ok(!veneerContextHtml.includes('NHS adviseert'));
 const aligners=LIJSTEN['procedure-aligners'];assert.ok(aligners.klinieken.some(k=>k.offers.aligners.brands?.includes('Invisalign')));assert.ok(aligners.klinieken.some(k=>k.offers.aligners.brands?.includes('Motto')));assert.ok(aligners.klinieken.some(k=>!k.offers.aligners.brands));
 for(const tl of ['nl','en','de']){scriptCheck(dental.newsletterPreview(data.SITE.base,tl));const html=dental.dentalHub(data.SITE.base,tl);assert.ok(html.includes('1415')||html.includes('1.415')||html.includes('1,415'));assert.ok(render.ALL().includes(dental.dentalSlug(tl)));assert.ok(!render.ALL().includes(dental.previewSlug(tl)));}
});
await test('all-topics lessons rotate instead of always choosing hair',()=>{
 const topics=new Set(Array.from({length:12},(_,i)=>engage.dailyLesson({topics:['all'],taal:'nl'},new Date(Date.UTC(2026,10,i+1)).toISOString().slice(0,10)).topic));assert.ok(topics.size>5);
});
await test('confirmation and unsubscribe GET/HEAD do not mutate subscriptions',async()=>{
 let confirm=0,leave=0;const routeSource=raw.replace(/await import\('\.\/db\.js'\)/g,"await __load('db')").replace(/await import\('\.\/tsc-mail-v3\.js'\)/g,"await __load('mail')");const load=async name=>name==='db'?{kv}:{bevestig:async()=>{confirm++;return {welcome_accepted:true}},afmelden:async()=>{leave++;return {}}};const route=new Function(...Object.keys(names),'__load',routeSource.replace(/export /g,'')+';return tscHandler;')(...Object.values(names),load);
 for(const path of ['bevestig','af'])for(const method of ['GET','HEAD','POST']){let html='';const headers={},res={setHeader(k,v){headers[k]=v},status(){return this},send(body){html=body;return this},end(){return this}};await route({headers:{host:'todayin.email'},method},res,new URL('https://todayin.email/true-surgery?p='+path+'&t='+'a'.repeat(48)+'&taal=nl'));assert.equal(headers['x-robots-tag'],'noindex');if(method!=='POST')assert.ok(String(html).includes('method="post"'));}
 assert.equal(confirm,1);assert.equal(leave,1);
 for(const body of ['List-Unsubscribe=One-Click',{'List-Unsubscribe':'One-Click'}]){let reply='';const headers={},res={setHeader(k,v){headers[k]=v},status(){return this},send(x){reply=x;return this}};await route({headers:{host:'todayin.email','content-type':'application/x-www-form-urlencoded'},method:'POST',body},res,new URL('https://todayin.email/true-surgery?p=af&t='+'b'.repeat(48)));assert.equal(headers['content-type'],'application/json; charset=utf-8');assert.equal(JSON.parse(reply).ok,true);}assert.equal(leave,3);
 for(const language of ['nl','en','de'])for(const preview of [false,true]){const slug=preview?dental.previewSlug(language):dental.dentalSlug(language);let html='';const res={setHeader(){},status(){return this},send(body){html=body;return this}};await route({headers:{host:'todayin.email'},method:'GET'},res,new URL('https://todayin.email/true-surgery?p='+slug));assert.ok(html.includes(preview?'content="noindex"':'content="index,follow,max-snippet:-1"'));if(preview)for(const tl of ['en','nl','de']){const target=data.SITE.base+'/'+dental.previewSlug(tl);assert.ok(html.includes('<a href="'+target+'"'),'preview language link '+tl);assert.ok(html.includes('hreflang="'+tl+'" href="'+target+'"'),'preview alternate '+tl);}const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length);scriptCheck(html);fs.writeFileSync(path.join(out,(preview?'preview-':'dental-')+language+'.html'),html);}

});
await test('dental campaign starts with visible dental topics and sourced fallback answers',()=>{
 const html=signup.signupBlock(data.SITE.base,'nl/tandheelkunde',{topics:['dental-implants','veneers','aligners']},'nl');assert.ok(html.includes('dental-implants'));assert.ok(html.includes('veneers'));assert.ok(html.includes('aligners'));
 const src=fs.readFileSync(path.join(root,'lib/tsc-chat.js'),'utf8'),a=src.indexOf('const STOP ='),b=src.indexOf('export async function tscVraag',a),find=new Function('PAGES','zonderBron','dentalChatQuestions','dentalSlug','dentalSearchQuestions','quoteGuideSlug',src.slice(a,b)+';return zoekAntwoord;')(data.PAGES,s=>s,dental.dentalChatQuestions,dental.dentalSlug,searchIntent.dentalSearchQuestions,searchIntent.quoteGuideSlug);
 const answer=find('Is Invisalign hetzelfde als aligners?','nl/tandheelkunde','nl');assert.equal(answer.pagina,'nl/tandheelkunde');assert.ok(answer.a.includes('merk'));assert.ok(!dental.quoteChecklist('nl',false).includes('Implantaat'));const white=searchIntent.dentalSearchQuestions('whitening','nl');assert.ok(white.length>=3);assert.ok(!JSON.stringify(white).match(/operatie|anesthesie|narcose/i));
});
await test('GSC subsite regex includes surgery and excludes sibling and Curaçao paths',()=>{
 const src=fs.readFileSync(path.join(root,'lib/gsc.js'),'utf8'),a=src.indexOf('export function pageScopeFilter'),b=src.indexOf('\nexport async function rows',a);const fn=new Function(src.slice(a,b).replace('export ','')+';return pageScopeFilter;')();const f=fn('https://todayin.email/surgery'),re=new RegExp(f.dimensionFilterGroups[0].filters[0].expression);
 assert.ok(re.test('https://todayin.email/surgery'));assert.ok(re.test('https://todayin.email/surgery/nl'));assert.ok(!re.test('https://todayin.email/surgery-other'));assert.ok(!re.test('https://todayin.email/curacao'));assert.deepEqual(fn(),{});
});
await test('LLM subsite citations require structured URLs inside surgery',()=>{
 const src=fs.readFileSync(path.join(root,'lib/zicht.js'),'utf8'),a=src.indexOf('export function scopedCitationURLs'),b=src.indexOf('\nexport async function meetLLM',a);const fn=new Function(src.slice(a,b).replace('export ','')+';return scopedCitationURLs;')(),site={host:'todayin.email',pathPrefix:'/surgery'};
 assert.deepEqual(fn(site,{choices:[{message:{content:'https://todayin.email/surgery'}}]}),[]);assert.deepEqual(fn(site,{citations:['https://todayin.email/curacao/nl','https://todayin.email/surgery-other','https://todayin.email/surgery/nl']}),['https://todayin.email/surgery/nl']);
});

await test('focused quote landing: three indexable translations and value before signup',async()=>{
 const routeSource=raw.replace(/await import\('\.\/db\.js'\)/g,"await __load('db')"),route=new Function(...Object.keys(names),'__load',routeSource.replace(/export /g,'')+';return tscHandler;')(...Object.values(names),async()=>({kv}));
 for(const language of ['nl','en','de']){const slug=searchIntent.quoteGuideSlug(language);let html='',status=0;const res={setHeader(){},status(n){status=n;return this},send(s){html=s;return this}};await route({headers:{host:'todayin.email'},method:'GET'},res,new URL('https://todayin.email/true-surgery?p='+slug));assert.equal(status,200);assert.ok(!html.includes('content="noindex"'));assert.ok(html.indexOf('id="quote-check"')<html.indexOf('id="mail"'));const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length);assert.ok(render.ALL().includes(slug));assert.ok(render.llms().includes(slug));scriptCheck(html);for(const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))JSON.parse(m[1]);}
});
await test('quote checker preserves unknowns and transmits no amounts',()=>{
 const html=searchIntent.quoteGuideBody(data.SITE.base,'nl','',''),source=html.match(/<script>([\s\S]*?)<\/script>/)[1],els={'quote-check':{},'quote-result':{},'quote-currency':{value:'EUR'}};for(let i=0;i<3;i++)els['quote-amount-'+i]={value:[1000,250,200][i]};for(let i=0;i<5;i++)els['quote-part-'+i]={checked:false};new Function('document',source)({getElementById:id=>els[id]});els['quote-check'].onsubmit({preventDefault(){}});assert.ok(els['quote-result'].textContent.includes('1.450'));assert.ok(els['quote-result'].textContent.includes('Nog te bevestigen'));assert.ok(!/fetch\(|sendBeacon|XMLHttpRequest/.test(source));
});

console.log(JSON.stringify({checks,ssrRankPages:Object.keys(RANK_SLUGS).length,topics:catalog.PROCEDURES.length,lists:Object.keys(LIJSTEN).length,indexableLists:Object.values(LIJSTEN).filter(l=>!l.noindex).length,realEmailsSent:0}));


