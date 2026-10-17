import test from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import vm from'node:vm';
async function source(n){try{return await readFile(new URL('../lib/'+n,import.meta.url),'utf8')}catch{return readFile(new URL(n,import.meta.url),'utf8')}}
const uri='data:text/javascript;base64,'+Buffer.from(await source('sephora-nederland.js')).toString('base64'),data=await import(uri);let src=(await source('sephora-page.js')).replace("import {look,ACCENTS} from './look.js';","const look=()=>'',ACCENTS={keuzehulp:{}};").replace("'./sephora-nederland.js'",JSON.stringify(uri));const page=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
test('45 routes preserve exact-brand distinction, correct beauty destination and SSR',()=>{
 for(let brand=0;brand<3;brand++)for(let type=0;type<5;type++)for(let priority=0;priority<3;priority++){
  const r=[brand,type,priority],a=data.sephoraAdvice(r),u=new URL(a.shop);assert.equal(u.host,'yoo.rs');assert.equal(u.pathname,'/shop');assert.equal(u.searchParams.get('cat'),'beauty');assert.equal(u.searchParams.get('sub'),data.BEAUTY_TYPES[type].sub||null);assert.equal(u.searchParams.get('utm_content'),'route-'+r.join(''));assert.equal(a.exact,brand!==2);
  const h=page.renderSephora(r);assert.equal((h.match(/<h1>/g)||[]).length,1);assert.ok(h.includes('geen officiële Sephora-resellerstatus'));assert.ok(h.includes('SEPHORA COLLECTION'));assert.ok(h.includes('https://www.sephora.fr/'));assert.ok(!h.includes('50 searches'));assert.ok(!h.includes('€ 3,50'));
  const schema=JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(schema['@graph'][2].mainEntity.length,data.SEPHORA_FAQ.length);
 }
 assert.deepEqual(data.sephoraRoute(['<script>',999,-1]),[0,0,0]);
});
test('native form works server-side, client metrics run and bot-safe methods reject writes',async()=>{
 const h=page.renderSephora([2,3,1]);assert.ok(h.includes('name="q1"'));assert.ok(h.includes('method="get"'));assert.ok(h.includes('<option value="3" selected>Parfum'));
 const actions={},nodes={'beauty-choice':{addEventListener:(e,f)=>actions[e]=f}},hits=[];[2,3,1].forEach((v,i)=>nodes['beauty-q'+i]={value:String(v)});
 const script=h.match(/<script>\(function\(\)\{([\s\S]*?)<\/script>/)[0].replace(/^<script>|<\/script>$/g,'');vm.runInNewContext(script,{document:{getElementById:id=>nodes[id],addEventListener:()=>{}},navigator:{sendBeacon:(u,b)=>hits.push([u,b])},Date,Blob});actions.change();actions.submit();assert.equal(hits.length,4);
 const res={setHeader(){},status(n){this.code=n;return this;},end(){}};await page.sephoraHandler({method:'POST',url:'/api/keuze-tools'},res);assert.equal(res.code,405);
});
