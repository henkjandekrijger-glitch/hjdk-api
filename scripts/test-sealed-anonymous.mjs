import assert from 'node:assert/strict';
import { anonymousService, validateAnonymous, CHANNELS } from '../lib/sealed-anonymous.js';
import { renderPagina, renderSealedSpecial, sitemap, GROWTH_SCRIPT } from '../lib/sealed.js';
import { PAGINAS } from '../lib/sealed-content.js';
import { GUIDANCE, proposalBrief } from '../lib/sealed-briefs.js';
import vm from 'node:vm';

const records=new Map(), lists=new Map();
const kv={
 get:async k=>records.get(k)||null,
 set:async(k,v,o)=>{records.set(k,v);assert.equal(o.ex,90*86400);},
 incr:async k=>{const n=(records.get(k)||0)+1;records.set(k,n);return n;},
 del:async ks=>{let n=0;for(const k of ks)n+=records.delete(k)?1:0;return n;},
 raw:async([op,k,...args])=>{if(op==='SET'){if(!records.has(k))records.set(k,args[0]);return 'OK';}if(op==='LPUSH'){lists.set(k,[args[0],...(lists.get(k)||[])]);return 1;}if(op==='LREM')lists.set(k,(lists.get(k)||[]).filter(x=>x!==args[1]));return 'OK';}
};
const valid={type:'succession',sector:'services',market:'europe',timing:'one-year',terms:'I would consider a gradual transfer if the team can continue and the proposed financing is explained first.',consent:true,language:'en'};
assert(CHANNELS.includes('test')); assert(GROWTH_SCRIPT.includes("q.get('qa')==='1'"));
const service=anonymousService(kv,async()=>{throw Error('provider unavailable');});
assert.equal(validateAnonymous({...valid,terms:'not enough'}).error,'more-detail');
assert.equal(validateAnonymous({...valid,terms:valid.terms+' Contact me at private@example.com'}).error,'contact-details');
assert.equal(validateAnonymous({...valid,terms:valid.terms+' My number is 0612345678'}).error,'contact-details');
assert.equal(validateAnonymous({...valid,consent:false}).error,'consent');
assert.equal(validateAnonymous({...valid,type:'unknown'}).error,'incomplete');
const req={headers:{'x-forwarded-for':'192.0.2.12'}};
const saved=await service.submit(req,{...valid,mail:'ignored@example.com',name:'Ignored',ref:'https://private.example/?secret=1',bod:9000000});
assert.equal(saved.status,201);const {id,token}=saved.body;
assert.equal(token.length,43);assert.match(id,/^[a-f0-9]{32}$/);
const record=records.get('si:i:'+id);assert.equal(record.status,'pending-review');assert(!JSON.stringify(record).includes('ignored'));assert(!('bod'in record));assert(!JSON.stringify(record).includes(token));assert(!JSON.stringify([...records.keys()]).includes('192.0.2.12'));
assert.equal((await service.control('receipt',{id,token:'x'.repeat(43)})).status,404);
const receipt=await service.control('receipt',{id,token});assert.equal(receipt.status,200);assert(!('controlHash'in receipt.body.record));
const partner=await service.submit(req,{...valid,mode:'partner',terms:valid.terms+' I would first ask for a broad transition timetable and explain funding limits before requesting any identifying details.'});
assert.equal(partner.status,201);assert.equal(records.get('si:i:'+partner.body.id).screening.status,'unavailable-pending-manual');
assert.equal((await service.control('withdraw',{id,token})).status,200);assert.equal((await service.control('receipt',{id,token})).status,404);
for(let i=0;i<3;i++)await service.submit(req,valid);assert.equal((await service.submit(req,valid)).status,429);
const xml=sitemap();assert.equal([...xml.matchAll(/<loc>/g)].length,28);assert(!/<loc>[^<]*\/(seal|manage|partners)<\/loc>/.test(xml));
let scripts=0;
for(const h of [...PAGINAS.map(p=>renderPagina(p)),...['nl','en','de'].flatMap(t=>['seal','manage','partners'].map(s=>renderSealedSpecial(t,s)))]){
 for(const m of h.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){if(m[0].includes('application/ld+json'))JSON.parse(m[1]);else{new vm.Script(m[1]);scripts++;}}
 assert(!h.includes('type="email"'));assert(!h.includes('<li>undefined</li>'));
}
for(const t of ['nl','en','de']){const h=renderSealedSpecial(t,'manage');assert(h.includes('noindex,follow'));assert(!h.includes('src="/cm.js"'));}
// What the form shows must be the same brief the AI is asked to assess.
let briefChecks=0, reviewContext;
const typedService=anonymousService(kv,async(text,context)=>{reviewContext=context;return {status:'advisory',understands:false,specific:false,personal_details:false,missing:['Explain your approach']};});
assert.throws(()=>proposalBrief('unknown'));
for(const language of ['nl','en','de']){
 records.delete('si:ai:'+new Date().toISOString().slice(0,10)); // isolate each language's review budget
 assert.equal(new Set(Object.values(GUIDANCE[language]).map(pair=>pair[1])).size,8);
 for(const partner of [false,true]){
  const html=renderSealedSpecial(language,partner?'partners':'seal');
  const script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('function formBrowser'))[1];
  const guide={},select={value:'',addEventListener:(event,fn)=>{select.change=fn;}}, form={elements:{type:select}}, notice={};
  vm.runInNewContext(script,{document:{getElementById:id=>({'anonymous-form':form,'anon-notice':notice,'anon-guidance':guide}[id])},location:{search:'?type=board'},URLSearchParams});
  assert.equal(select.value,'board');assert.equal(guide.textContent,GUIDANCE[language].board[partner?1:0]);
  for(const type of Object.keys(GUIDANCE[language])){
   select.value=type;select.change();assert.equal(guide.textContent,GUIDANCE[language][type][partner?1:0]);
   if(partner){
    assert.equal(proposalBrief(type,language),guide.textContent);
    const result=await typedService.submit({headers:{'x-forwarded-for':'192.0.2.'+(30+briefChecks)}},{...valid,mode:'partner',type,language,terms:valid.terms+' I would discuss the practical limits and missing information before asking to identify the person behind these conditions.'});
    assert.equal(result.status,201);assert.deepEqual(reviewContext,{type,language});assert.equal(records.get('si:i:'+result.body.id).status,'pending-review');briefChecks++;
   }
  }
 }
}
records.set('si:ai:'+new Date().toISOString().slice(0,10),20);reviewContext=null;
const capped=await typedService.submit({headers:{'x-forwarded-for':'192.0.2.200'}},{...valid,mode:'partner',terms:valid.terms+' I would discuss practical limits and missing information before asking for any identifying information.'});
assert.equal(capped.status,201);assert.equal(reviewContext,null);assert.equal(records.get('si:i:'+capped.body.id).screening.status,'pending-manual');
console.log(JSON.stringify({ok:true,checks:'anonymous persistence, rejection, hashed controls, unauthorised access, withdrawal, AI failure, rate limiting, public/private rendering, type-specific form and AI context',pages:19,sitemap:35,scripts,briefChecks}));

