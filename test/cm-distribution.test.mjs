import test from 'node:test';
import assert from 'node:assert/strict';
import {DAY,hash,normalizePinterest,parseFlipboard,fit,makePlan,inSeason,safeTarget} from '../lib/cm-trends.js';
import {createService,authorized,catalogItems,publication,PREFIX,acquire,release,localDay,pinImageTree} from '../lib/cm-distribution.js';
import {storageState,canonical} from '../lib/cm-flipboard.js';
const NOW=Date.parse('2026-11-05T14:00:00Z');
const item={id:'oc_12345',title:'Glazen kerstballen goud set van 26',image:'https://cdn.kadoly.com/test.jpg',url:'https://kadoly.com/product/oc_12345',kind:'product'};
const trend={id:hash('kerst'),keyword:'landelijke kerstversiering',network:'pinterest',region:'NL+BE+LU',dataAt:NOW-3*DAY,monthly:600,source:'https://trends.pinterest.com/'};
const catalog={at:NOW,items:[{id:item.id,t:item.title,img:item.image,vr:true}]};
class FakeKV{
 data=new Map();sets=new Map();
 async get(k){return this.data.get(k)??null;}
 async set(k,v){this.data.set(k,structuredClone(v));return 'OK';}
 async mget(...ks){return Promise.all(ks.map(k=>this.get(k)));}
 async incr(k){let v=Number(await this.get(k)||0)+1;await this.set(k,v);return v;}
 async raw(a){let [op,key,...rest]=a;
  if(op==='SET'){if(this.data.has(key))return null;this.data.set(key,rest[0]);return 'OK';}
  if(op==='EVAL'){let k=rest[1],token=rest[2];if(this.data.get(k)===token){this.data.delete(k);return 1;}return 0;}
  if(op==='EXPIRE')return 1;
  if(op==='SMEMBERS')return [...(this.sets.get(key)||[])];
  throw new Error('unsupported '+a.join(' '));
 }
}
const pinData={trends:[{keyword:trend.keyword,pct_growth_wow:20,pct_growth_mom:600,time_series:{'2026-11-02':100}}]};
const pinApi=async path=>path==='/user_account'?{username:'kadoly_shop'}:pinData;
function service(options={}){
 const kv=options.kv||new FakeKV();kv.data.set('hjdk:shop:cat',catalog);
 const calls=[];
 const s=createService({kv,pinApi,ensureBoard:async()=> '123',createPin:async p=>{calls.push(p);return{id:'900'};},
  fetcher:async()=>({ok:true,headers:{get:()=> 'image/png'},arrayBuffer:async()=>new ArrayBuffer(3000),text:async()=>'<rss><channel></channel></rss>'}),now:()=>NOW,env:{CM_PINTEREST_STANDARD:'1'},...options});
 return {s,kv,calls};
}
test('seasons reject stale Halloween while retaining coming Christmas',()=>{assert.equal(inSeason('halloween',NOW),false);assert.equal(inSeason('kerstdecoratie',NOW),true);assert.equal(inSeason('sinterklaas',Date.parse('2026-12-06')),false);});
test('source date governs Pinterest freshness, not retrieval time',()=>{const rows=normalizePinterest(pinData,'NL+BE+LU','growing',NOW);assert.equal(rows.length,1);assert.equal(rows[0].monthly,600);assert.equal(normalizePinterest(pinData,'NL+BE+LU','growing',NOW+15*DAY).length,0);assert.equal(normalizePinterest({trends:[{keyword:'kerst'}]},'NL+BE+LU','growing',NOW).length,0);});
test('Flipboard current editorial presence is never fabricated growth',()=>{const xml='<rss><channel><item><title>Christmas decorations</title><link>https://example.com/story</link><pubDate>Thu, 05 Nov 2026 10:00:00 GMT</pubDate></item></channel></rss>';const [row]=parseFlipboard(xml,'https://flipboard.com/topic/christmas.rss',NOW);assert.equal(row.signal,'recent_editorial_placement');assert.equal(row.monthly,null);assert.equal(parseFlipboard(xml,'https://flipboard.com/topic/christmas.rss',NOW+5*DAY).length,0);});
test('relevance blocks generic gifts, mismatched geography, workshop intent and outdoors',()=>{assert.ok(fit(item,trend,NOW));assert.equal(fit(item,{...trend,region:'US'},NOW),null);assert.equal(fit(item,{...trend,keyword:'gifts'},NOW),null);assert.equal(fit(item,{...trend,keyword:'kerstworkshop bloemschikken'},NOW),null);assert.equal(fit(item,{...trend,keyword:'buiten kerst'},NOW),null);});
test('unavailable trend provider cannot silently yield invented seasonal signals',async()=>{const {s}=service({pinApi:async()=>{throw new Error('403');}});const result=await s.scan();assert.equal(result.signals,0);assert.equal(result.selected.length,0);assert.ok(result.sources.every(s=>s.status==='unavailable'));});
test('one source outage preserves the independently available source',async()=>{const {s}=service({pinApi:async()=>{throw new Error('403');},fetcher:async()=>({ok:true,text:async()=>'<rss><item><title>Christmas decorations</title><link>https://example.com/x</link><pubDate>Thu, 05 Nov 2026 10:00:00 GMT</pubDate></item></rss>'})});const r=await s.scan();assert.ok(r.selected.some(x=>x.network==='flipboard'));assert.ok(!r.selected.some(x=>x.network==='pinterest'));});
test('stale catalog and out of stock cannot produce publish candidates',()=>{assert.throws(()=>catalogItems({...catalog,at:NOW-2*DAY},NOW),/STALE/);assert.equal(catalogItems({...catalog,items:[{...catalog.items[0],vr:false}]},NOW).length,0);});
test('old catalog imports may get one original trend visual, with bounded diverse selection',()=>{const plan=makePlan([item], [trend],{}, {},NOW);assert.equal(plan.length,1);const p=publication(plan[0]);assert.match(p.image,/op=beeld/);assert.notEqual(p.image,item.image);assert.equal(makePlan([item],[trend],{'pinterest:oc_12345':true},{},NOW).length,0);assert.equal(pinImageTree(plan[0]).props.children.length,5);});
test('account identity must match kadoly_shop before any write',async()=>{const {s,calls}=service({pinApi:async path=>path==='/user_account'?{username:'other'}:pinData});await s.scan();const r=await s.publish();assert.equal(calls.length,0);assert.equal(r.results[0].state,'wrong_account');});
test('API Standard tier must be explicitly confirmed',async()=>{const {s,calls}=service({env:{}});await s.scan();const r=await s.publish();assert.equal(calls.length,0);assert.equal(r.results[0].state,'standard_access_unconfirmed');});
test('successful Pinterest publication is persistent and idempotent',async()=>{const {s,kv,calls}=service();await s.scan();const r=await s.publish();assert.equal(r.results[0].status,'published');assert.equal(calls.length,1);assert.match(calls[0].link,/distuit\?id=/);await s.publish();assert.equal(calls.length,1);await s.scan();assert.equal((await kv.get(PREFIX+'plan')).length,0);});
test('timeout/crash after POST boundary remains uncertain and is not retried',async()=>{let attempts=0;const {s,kv}=service({createPin:async()=>{attempts++;throw new Error('timeout');}});await s.scan();await s.publish();await s.publish();await s.scan();await s.publish();assert.equal(attempts,1);assert.equal((await kv.get(PREFIX+'recent'))[0].status,'uncertain');});
test('two concurrent publishers cannot both post',async()=>{let entered,finish;const gate=new Promise(r=>entered=r),done=new Promise(r=>finish=r);const {s}=service({createPin:async()=>{entered();await done;}});await s.scan();const first=s.publish();await gate;const second=await s.publish();assert.equal(second.state,'busy');finish();await first;});
test('scan uses the same lock as publish, preventing changed attribution in flight',async()=>{const {s,kv}=service();const token=await acquire(kv,'pipeline',600);assert.equal((await s.scan()).state,'busy');assert.equal((await s.publish()).state,'busy');await release(kv,'pipeline',token);});
test('an old worker cannot remove a newer lease',async()=>{const kv=new FakeKV();kv.data.set(PREFIX+'lock:pipeline','new');await release(kv,'pipeline','old');assert.equal(kv.data.get(PREFIX+'lock:pipeline'),'new');});
test('daily cap and post-plan stock revalidation prevent writes',async()=>{const {s,kv,calls}=service();await s.scan();await kv.set(PREFIX+'daily:'+localDay(NOW)+':pinterest',3);await s.publish();assert.equal(calls.length,0);await kv.set(PREFIX+'daily:'+localDay(NOW)+':pinterest',0);await kv.set('hjdk:shop:cat',{at:NOW,items:[]});await s.publish();assert.equal(calls.length,0);});
test('Flipboard absent session is blocked; old verified IDs remain deduped',async()=>{const fetcher=async()=>({ok:true,text:async()=>'<rss><item><title>Christmas decorations</title><link>https://example.com/x</link><pubDate>Thu, 05 Nov 2026 10:00:00 GMT</pubDate></item></rss>'});const {s}=service({pinApi:async()=>{throw new Error('no token');},fetcher});await s.scan();assert.equal((await s.publish()).results[0].state,'login_required');const h=service({pinApi:async()=>{throw new Error('no token');},fetcher,history:{productIds:[item.id]}});assert.equal((await h.s.scan()).selected.length,0);});
test('performance keeps paid, carts and verified humans separate from arrivals',async()=>{const {s,kv}=service();kv.sets.set(PREFIX+'codes:a',new Set(['c1','c2']));kv.data.set('hjdk:shc:c1',{ym:true,px:{cart:NOW,afreken:NOW,koop123:NOW}});kv.data.set('hjdk:shc:c2',{});const v=await s.performance([{id:'a',network:'pinterest',trendId:'t'}]);assert.deepEqual(v['pinterest:t'],{visits:2,humans:1,carts:1,checkout:1,paid:1});});
test('public link never accepts arbitrary destinations or secret-bearing URLs',()=>{assert.throws(()=>safeTarget('https://evil.test/product'));assert.throws(()=>safeTarget('https://user:password@kadoly.com/product'));assert.equal(canonical('https://keuzehulp.best/api/shop/distuit?id='+hash('x')),'https://keuzehulp.best/api/shop/distuit?id='+hash('x'));assert.throws(()=>canonical('https://keuzehulp.best/api/shop/distuit?id=bad'));});
test('auth accepts only nonempty configured bearer secrets',()=>{assert.equal(authorized({headers:{}},{}),false);assert.equal(authorized({headers:{authorization:'Bearer yes'}},{CRON_SECRET:'yes'}),true);assert.equal(authorized({headers:{authorization:'Bearer no'}},{CRON_SECRET:'yes'}),false);});
test('server session filters unrelated cookies and origins',()=>{const state=storageState(Buffer.from(JSON.stringify({cookies:[{domain:'.flipboard.com',name:'a'},{domain:'google.com',name:'b'}],origins:[{origin:'https://google.com'},{origin:'https://flipboard.com'}]})).toString('base64'));assert.equal(state.cookies.length,1);assert.equal(state.origins.length,1);});

test('preview deployments never publish',async()=>{const {s,calls}=service({env:{VERCEL_ENV:'preview',CM_PINTEREST_STANDARD:'1'}});await s.scan();assert.equal((await s.publish()).state,'preview_no_publication');assert.equal(calls.length,0);});

test('existing paid and guide redirects retain their source; organic carries Clickmind codes',async()=>{
 const fs=await import('node:fs/promises'),vm=await import('node:vm');
 const source=await fs.readFile(new URL('../api/shop.js',import.meta.url),'utf8');
 const body=source.slice(source.indexOf('async function direct(req, res, x) {'),source.indexOf('async function land(req, res, url) {'));
 const records=new Map(),ctx={Buffer,URL,Promise,setTimeout,Date,NETTEN:{mg:'MGID',x:'Overig'},CM_NET:{mg:'mgid',x:'onbekend'},K:{rec:c=>'rec:'+c,set:()=> 'set',hll:()=> 'hll'},
  kv:{get:async k=>records.get(k)||null,set:async(k,v)=>{records.set(k,v);},raw:async()=>1},
  leesCookie:()=> '0123456789abcdef',nieuwId:()=> '1234abcd',pk:s=>s,apparaat:()=> 'device',cidKoppel:async()=>{},
  laterAf:p=>p,inc:async()=>{},uurTel:async()=>{},sadd:async()=>{},verwerkKlik:async()=>{},serverSignalen:()=>({}),D8:()=> '20261105',nlUur:()=> '10',dbNood:()=>{}};
 vm.createContext(ctx);vm.runInContext(body+'; this.runDirectTest=direct;',ctx);
 async function run(extra){const headers={},res={setHeader:(k,v)=>headers[k]=v,end:()=>{}};await ctx.runDirectTest({headers:{}},res,{net:'mg',clickid:'abc',zone:'',cr:'',camp:'',pid:'oc_12345',code:Math.random().toString(36).slice(2),bot:false,vrij:true,...extra});return new URL(headers.location);}
 const paid=await run({});assert.equal(paid.searchParams.get('utm_source'),'mgid');assert.equal(paid.searchParams.get('utm_medium'),'push');
 const guide=await run({net:'x',bron:{medium:'gids',campaign:'lamp'}});assert.equal(guide.searchParams.get('utm_source'),'kadoly-gids');assert.equal(guide.searchParams.get('utm_medium'),'gids');
 const organic=await run({net:'x',distributionId:hash('post'),trendId:hash('trend'),bron:{source:'pinterest',medium:'organic',campaign:'cm-'+hash('trend')}});assert.equal(organic.searchParams.get('utm_source'),'pinterest');assert.equal(organic.searchParams.get('utm_medium'),'organic');assert.ok(organic.searchParams.get('hj'));assert.ok(organic.searchParams.get('mmc'));assert.ok([...records.values()].some(r=>r.dist===hash('post')));
});

test('failed image rendering does not attempt a pin or consume its publication marker',async()=>{const {s,kv,calls}=service({fetcher:async()=>({ok:false,text:async()=>''})});await s.scan();await s.publish();assert.equal(calls.length,0);assert.equal(await kv.get(PREFIX+'done:pinterest:'+item.id),null);});
