import assert from 'node:assert/strict';
import {validFrontDate,frontDate,frontFeedbackClient} from '../lib/voorkant-interactie.js';
import {normaliseFrontItems,renderCompleteFront,frontUpdateItems,frontInventory} from '../lib/voorkant-compleet.js';
import {readFrontSignals,writeFrontSignal,FRONT_SIGNAL_LUA} from '../lib/voorkant-signalen.js';
import handler from '../fn/keuze-voorkant.js';
const browser='test-browser-0123456789',target='zorgkosten-2027';
for(const v of ['2026-02-30','2026-13-01','banana','2099-01-01',''])assert.equal(validFrontDate(v),null);
assert.equal(validFrontDate('2026-11-19T10:00:00Z'),'2026-11-19');
assert.match(frontDate({},'nl'),/onbekend/);assert.doesNotMatch(frontDate({},'nl'),/<time/);
assert.match(frontDate({publishAt:'2026-11-18'},'de'),/Hinzugefügt/);
const rows=normaliseFrontItems([{slug:'nieuw',title:'Nieuw',updatedAt:'2026-11-19',publishAt:'2026-11-18'}],'nl');
assert.equal(rows[0].updatedAt,'2026-11-19');assert.equal(rows[0].publishedAt,'2026-11-18');
assert.equal(normaliseFrontItems([{slug:'airfryer',title:'Airfryer',publishAt:'2026-11-18'}],'nl')[0].updatedAt,null);
for(const market of ['nl','us','de']){
 const html=renderCompleteFront(market,{signals:{votes:{[target]:5}}});
 assert.equal((html.match(/data-front-vote=/g)||[]).length,3);
 assert.ok((html.match(/data-front-update=/g)||[]).length>=frontInventory(market).length);
 assert.equal((html.match(/data-front-update=/g)||[]).length,(html.match(/class="fp-updated"/g)||[]).length-3);
 assert.match(html,/data-front-feedback/);assert.ok(!html.includes('0 stemmen'));
}
let calls=[];
const store={raw:async args=>{calls.push(args);if(args[0]==='EVAL')return [1,target];if(args[1].endsWith(':votes'))return [target,'2'];return ['fietsmaat|count','3','fietsmaat|lastAt','2026-11-23T22:00:00Z'];}};
let r=await writeFrontSignal({action:'vote',target,active:true,browser},{market:'nl',network:'test-net',store});
assert.equal(r.body.choice,target);assert.equal(r.body.votes[target],2);
assert.equal(calls.filter(c=>c[0]==='EVAL').length,1);assert.ok(calls[0].includes(FRONT_SIGNAL_LUA));
const report=await readFrontSignals('nl',{store});assert.deepEqual(report.updates,[{slug:'fietsmaat',count:3,lastAt:'2026-11-23T22:00:00Z'}]);
assert.ok(!JSON.stringify(report).includes(browser));
for(const body of [{action:'vote',target:'made-up',active:true,browser},{action:'vote',target,browser},{action:'update',target:'../../etc',browser},{action:'vote',target,active:true,browser:'x'}]){
 calls=[];r=await writeFrontSignal(body,{market:'nl',store});assert.equal(r.status,400);assert.equal(calls.length,0);
}
r=await writeFrontSignal({action:'update',target:'fietsmaat',browser},{market:'nl',targets:frontUpdateItems(frontInventory('nl'),'nl'),store:{raw:async()=>[0]}});assert.equal(r.body.duplicate,true);assert.equal(r.body.registered,true);
r=await writeFrontSignal({action:'vote',target,active:true,browser},{market:'nl',store:{raw:async()=>[-1]}});assert.equal(r.status,429);
r=await writeFrontSignal({action:'vote',target,active:true,browser},{market:'nl',store:{raw:async()=>{throw Error('offline')}}});assert.equal(r.status,503);assert.equal(r.body.ok,false);
for(const [req,expected] of [
 [{method:'GET',url:'/api/keuze-voorkant?op=feedback',headers:{}},405],
 [{method:'POST',url:'/api/keuze-voorkant?op=feedback',headers:{host:'example.test',origin:'https://evil.test','content-type':'application/json'},body:{}},403],
 [{method:'POST',url:'/api/keuze-voorkant?op=feedback',headers:{'content-type':'text/plain'},body:'{}'},415],
 [{method:'POST',url:'/api/keuze-voorkant?op=feedback',headers:{'content-type':'application/json'},body:'{'},400]
]){let status;const res={setHeader(){},status(n){status=n;return this},json(){},end(){}};await handler(req,res);assert.equal(status,expected);}
console.log('Feedback: datums, alle kaarten, bronmetadata, API-validatie, onbekende doelen, dubbele verzoeken, privacy, limiet en opslagfouten gecontroleerd.');
