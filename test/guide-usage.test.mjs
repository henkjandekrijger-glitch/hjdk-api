import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const calls=[],seen=new Set();
globalThis.usageKV={raw:async args=>{calls.push(args);if(args[0]==='SET'&&args.at(-1)==='NX'){if(seen.has(args[1]))return null;seen.add(args[1]);return 'OK';}return [];}};
const source=await fs.readFile(new URL('../lib/guide-usage.js',import.meta.url),'utf8');
const mod=await import('data:text/javascript;base64,'+Buffer.from(source.replace("import { kv } from './db.js';",'const kv=globalThis.usageKV;')).toString('base64'));
test('Curaçao day boundary, seven days, ranking threshold and current catalog only',()=>{
 assert.equal(mod.usageDay(new Date('2026-10-18T03:59:59Z')),'2026-10-17');assert.equal(mod.usageDay(new Date('2026-10-18T04:00:00Z')),'2026-10-18');
 assert.deepEqual(mod.usageDays(2,new Date('2026-10-18T02:00:00Z')),['2026-10-17','2026-10-16']);
 const items=[{slug:'a'},{slug:'b'},{slug:'c'}];
 assert.deepEqual(mod.rankUsage([[{slug:'a',eligible:2},{slug:'b',eligible:3},{slug:'deleted',eligible:99}],[{slug:'a',eligible:2}]],items).map(x=>x.slug),['a','b']);
 for(const [src,fp,paid,expected]of [['google',false,false,true],['direct-onbekend',false,false,true],['intern',false,false,false],['google',true,false,false],['google',false,true,false]])assert.equal(mod.eligibleUsage(src,fp,paid),expected);
});
test('server deduplicates repeated use; FP remains measured but gives no rank points',async()=>{
 const base={site:'kz',slug:'a',event:'use',session:'test-session-unique',source:'google',fp:true,paid:false};
 assert.equal(await mod.recordUsage(base),true);assert.equal(await mod.recordUsage(base),false);
 const increments=calls.filter(x=>x[0]==='HINCRBY');assert.deepEqual(increments.map(x=>x[2]),['a|use','a|fpUse']);
 await mod.recordUsage({...base,session:'second-session',fp:false});assert.equal(calls.filter(x=>x[2]==='a|eligible').length,1);
});
const trackerSource=await fs.readFile(new URL('../lib/vindbaarheid.js',import.meta.url),'utf8');
const tracker=trackerSource.slice(trackerSource.indexOf('export const TRACKER=String.raw`')+'export const TRACKER=String.raw`'.length,trackerSource.lastIndexOf('`;'));
function browser(path,storage=new Map(),ref='',query=''){
 const events={},sent=[];const context={navigator:{userAgent:'Mozilla/5.0',sendBeacon:(url,blob)=>{sent.push(JSON.parse(blob.parts[0]));return true;}},location:{pathname:path,search:query,href:'https://keuzehulp.best'+path+query,origin:'https://keuzehulp.best'},document:{referrer:ref,addEventListener:(e,cb)=>events[e]=cb},sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},crypto:{randomUUID:()=> 'test-session-id-123456'},URL,URLSearchParams,Date,Blob:class{constructor(parts){this.parts=parts;}}};vm.runInNewContext(tracker,context);return {sent,events,storage};
}
test('browser FP marker propagates without referrer and interactions count once',()=>{
 const home=browser('/');assert.equal(home.sent.length,1);assert.equal(home.sent[0].kind,'home');const anchor={href:'https://keuzehulp.best/a'};home.events.click({target:{closest:()=>anchor}});assert.match(anchor.href,/from=fp/);
 const fp=browser('/a',home.storage);assert.equal(fp.sent[0].fp,true);fp.events.change({target:{closest:()=>({})}});fp.events.click({target:{closest:()=>({})}});assert.deepEqual(fp.sent.map(x=>x.kind),['view','use']);assert.equal(fp.sent[1].fp,true);
 const external=browser('/a',new Map(),'https://www.google.nl/search?q=test');external.events.click({target:{closest:()=>({})}});assert.equal(external.sent[1].fp,false);assert.match(external.sent[1].ref,/google/);
 assert.equal(browser('/a',new Map(),'','?from=fp').sent[0].fp,true);
 const rf=browser('/a',new Map(),'https://keuzehulp.best/');assert.equal(rf.sent[0].fp,true);
});
test('SSR has localized truthful empty state without invented trending winner',async()=>{
 for(const site of ['kz','us','de']){const html=await mod.trendingBlock(site,[{slug:'a',title:'A'}]);assert.match(html,/id="trending-guides"/);assert.doesNotMatch(html,/href="\/a/);assert.match(html,/3/);}
});
