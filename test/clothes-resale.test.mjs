import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const data=await fs.readFile(new URL('../lib/clothes-resale.js',import.meta.url),'utf8');
const dataUrl='data:text/javascript;base64,'+Buffer.from(data).toString('base64');
const m=await import(dataUrl);
const page=await fs.readFile(new URL('../lib/clothes-resale-page.js',import.meta.url),'utf8');
const renderer=await import('data:text/javascript;base64,'+Buffer.from(page.replace("import { look, ACCENTS } from './look.js';",'const look=()=>"";const ACCENTS={};').replace("'./clothes-resale.js'",JSON.stringify(dataUrl))).toString('base64'));
test('81 localized routes have correct own-store categories, server-rendered advice and schema',()=>{
 for(const market of ['nl','us','de'])for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++){
  const route=[a,b,c].join('-'),u=new URL(m.resaleLink(market,route)),sell=new URL(m.resaleLink(market,route,true));
  assert.equal(u.hostname,'yoo.rs');assert.equal(u.pathname,'/shop');assert.equal(u.searchParams.get('cat'),'mode');assert.equal(u.searchParams.get('sub'),['dames','heren','tassen'][b]);assert.equal(u.searchParams.get('lang'),market==='nl'?'nl':'en');assert.equal(sell.pathname,'/register');
  const html=renderer.renderResale(market,route);assert.ok(html.includes(m.RESALE[market].goalTitles[a]));assert.ok(html.includes(m.RESALE[market].checks[c]));assert.match(html,/method="get"/);assert.match(html,/op=tracker&v=2/);
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(schema['@graph'][2].mainEntity.length,5);assert.ok(html.includes('https://'+m.RESALE[market].host+'/'+m.RESALE[market].slug));
  assert.equal((html.match(/hreflang=/g)||[]).length,3);assert.equal(m.resaleItem(market).questions.length,3);
 }
 assert.deepEqual(m.resaleRoute('99--4-abc'),[2,0,2]);assert.deepEqual(m.resaleRoute(''),[0,0,0]);
});
test('US warnings remain explicit and no growth metrics, price or native-app promises are invented',()=>{
 const html=renderer.renderResale('us','2-0-0');assert.match(html,/US delivery was not offered/);assert.match(html,/US seller eligibility/);assert.match(html,/same company/);assert.doesNotMatch(html,/5,400|238%|14\.62|SoftwareApplication/);assert.match(html,/Browse pre-owned fashion/);
});
test('tracking records answer route and selected retailer without intercepting native form',()=>{
 const html=renderer.renderResale('nl','0-0-0'),js=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];const events={},hits=[];
 const form={addEventListener:(n,f)=>events[n]=f};const document={getElementById:id=>id==='resale-form'?form:{value:'2'},addEventListener:(n,f)=>events[n]=f};
 vm.runInNewContext(js,{document,Date,navigator:{sendBeacon:(u,b)=>hits.push(JSON.parse(b.parts[0]))},Blob:class{constructor(parts){this.parts=parts;}}});events.submit();events.click({target:{closest:()=>({dataset:{resaleOut:'yoors-shop'}})}});assert.match(hits[0].hits[0][0],/route-222$/);assert.match(hits[1].hits[0][0],/out-yoors-shop$/);
});
test('HTTP handler supports native query routes and rejects mutation or unknown market',async()=>{
 const response=()=>({code:0,body:'',setHeader(){},status(c){this.code=c;return this;},send(b){this.body=b;return this;}});
 let r=response();await renderer.resaleHandler({method:'GET'},r,new URL('https://x/?q0=2&q1=2&q2=1'),'de');assert.equal(r.code,200);assert.ok(r.body.includes(m.RESALE.de.goalTitles[2]));
 r=response();await renderer.resaleHandler({method:'POST'},r,new URL('https://x/'),'nl');assert.equal(r.code,405);
 r=response();await renderer.resaleHandler({method:'GET'},r,new URL('https://x/'),'xx');assert.equal(r.code,404);
});
