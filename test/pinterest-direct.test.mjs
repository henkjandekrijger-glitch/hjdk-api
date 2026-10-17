import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=async name=>{try{return await readFile(new URL('../lib/'+name,import.meta.url),'utf8');}catch{return readFile(new URL(name,import.meta.url),'utf8');}};
const plan=await import('data:text/javascript;base64,'+Buffer.from(await source('pinterest-plan.js')).toString('base64'));
test('variant timing, uncertain holds, legacy skip and local-day boundary',()=>{
 const catalog=[{slug:'bike'}],at=Date.UTC(2026,9,17,5),r={'nl:bike:0':{status:'published',at}};
 assert.equal(plan.nextPin(catalog,'nl',r,at+6*plan.DAY),null);
 assert.equal(plan.nextPin(catalog,'nl',r,at+7*plan.DAY).variant,1);
 r['nl:bike:1']={status:'uncertain',at};
 assert.equal(plan.nextPin(catalog,'nl',r,at+20*plan.DAY),null);
 assert.equal(plan.nextPin(catalog,'nl',r,at+21*plan.DAY).variant,2);
 assert.equal(plan.nextPin(catalog,'nl',{},at,new Set(['bike'])),null);
 assert.equal(plan.localDay(Date.UTC(2026,9,17,3,59)),'2026-10-16');
 assert.equal(plan.localDay(Date.UTC(2026,9,17,4)),'2026-10-17');
 assert.equal(plan.validateConfig({markets:['nl'],dailyPerMarket:99}).dailyPerMarket,3);
 assert.throws(()=>plan.validateConfig({markets:['fr']}));
});
test('worker persists before POST, enforces quota/lease and does not retry uncertain publication',async()=>{
 const mem=new Map(),calls=[];let fails=false,locked=false;
 const kv={get:async k=>mem.get(k),set:async(k,v)=>{mem.set(k,structuredClone(v));return 'OK';},mget:async(...ks)=>ks.map(k=>mem.get(k)),incr:async k=>{const v=(mem.get(k)||0)+1;mem.set(k,v);return v;},raw:async a=>{if(a[0]==='SET'){if(locked)return null;locked=true;return 'OK';}return 1;}};
 globalThis.__pinFixture={kv,...plan,tokenStatus:async()=> 'verbonden',socialCatalog:async()=>[{slug:'bike'}],ensureBoard:async()=> '123',pinConcept:(i,m,v)=>({title:'Bike',board:'Bikes',target:'https://keuzehulp.best/bike',image:'https://keuzehulp.best/image',headline:'Bike'}),createPin:async()=>{calls.push([...mem.keys()].some(k=>k.endsWith(':bike:0')&&mem.get(k).status==='uncertain'));if(fails)throw Error('timeout');return {id:'987'};},api:async()=>({})};
 let src=(await source('pinterest-direct.js')).replace(/^import .*;\n/gm,'');
 src='const {kv,tokenStatus,socialCatalog,ensureBoard,pinConcept,createPin,api,nextPin,localDay,DAY}=globalThis.__pinFixture;\n'+src;
 const engine=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
 assert.equal((await engine.runDirect()).state,'paused');
 mem.set(engine.CONFIG,{enabled:true,standard:true,markets:['nl'],dailyPerMarket:1});
 assert.equal((await engine.runDirect()).state,'published');assert.deepEqual(calls,[true]);
 assert.equal((await engine.runDirect()).state,'busy');locked=false;
 assert.equal((await engine.runDirect()).state,'nothing-due');assert.equal(calls.length,1);
 mem.clear();locked=false;fails=true;mem.set(engine.CONFIG,{enabled:true,standard:true,markets:['nl'],dailyPerMarket:3});
 assert.equal((await engine.runDirect()).state,'uncertain');locked=false;
 assert.equal((await engine.runDirect()).state,'nothing-due');assert.equal(calls.length,2);
 delete globalThis.__pinFixture;
});
test('management denies missing key and cross-site writes; health stays credential-free',async()=>{
 let src;try{src=await readFile(new URL('../api/pin-connect.js',import.meta.url),'utf8');}catch{src=await readFile(new URL('pin-connect.js',import.meta.url),'utf8');}
 src=src.replace(/^import .*;\n/gm,'');
 src="import {timingSafeEqual,randomBytes} from 'node:crypto';\nconst kv={},getApp=async()=>null,authUrl=()=>'',REDIRECT='https://example.com/callback',CONFIG='test',directStatus=async()=>({pinterest:'niet verbonden'}),runDirect=async()=>({}),pinAnalytics=async()=>({}),validateConfig=x=>x;\n"+src;
 const h=(await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'))).default;
 const res=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(v){this.body=v;return this;},end(){},send(v){this.body=v;}});
 const prev=process.env.HJDK_TOKEN;process.env.HJDK_TOKEN='fixture-only-key';
 try{
 let r=res();await h({url:'/api/pin-connect',method:'POST',headers:{},body:{op:'status'}},r);assert.equal(r.code,401);
 r=res();await h({url:'/api/pin-connect',method:'POST',headers:{authorization:'Bearer fixture-only-key',origin:'https://evil.example'},body:{op:'config'}},r);assert.equal(r.code,403);
 r=res();await h({url:'/api/pin-connect?op=health',method:'GET',headers:{}},r);assert.equal(r.code,200);assert.equal(r.body.service,'pinterest-direct');assert.ok(!JSON.stringify(r.body).includes('fixture'));
 r=res();await h({url:'/api/pin-connect',method:'POST',headers:{authorization:'Bearer fixture-only-key'},body:{op:'status'}},r);assert.equal(r.code,200);assert.equal(r.body.app,false);
 }finally{if(prev===undefined)delete process.env.HJDK_TOKEN;else process.env.HJDK_TOKEN=prev;}
});
