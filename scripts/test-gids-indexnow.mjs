import assert from 'node:assert/strict';
import { gidsIndexPlan } from '../lib/gids-indexnow.js';
const a={id:'oc_1',t:'Vaas blauw',p:10,vk:3,lt:2,vr:true,c:'wonen',s:'vazen',v:2};
const b={id:'oc_2',t:'Spel',p:20,vr:true,c:'hobby'};
const onderwerp={id:'vaas',bronnen:['rhs'],match:i=>/vaas/i.test(i.t)};
function plan(items,vorig=null){return gidsIndexPlan({host:'https://gids.kadoly.com',items,gidsen:[{slug:'vaas-kiezen',keuze:[{pid:'oc_1'}]}],onderzoek:[onderwerp],bronnen:{rhs:{url:'https://www.rhs.org.uk/'}},nieuw:items.filter(i=>i.vr!==false),rubrieken:[...new Set(items.filter(i=>i.vr!==false).map(i=>i.c))].map(c=>({c,items:items.filter(i=>i.vr!==false&&i.c===c)})),vorig,versies:{home:'1'}});}
const first=plan([a,b]);
assert.ok(first.urls.length>0);
assert.deepEqual(plan([b,a],first).urls,[], 'catalogusvolgorde verandert geen inhoud');
assert.deepEqual(plan([{...a,v:50},b],first).urls,[], 'views zijn geen inhoudswijziging');
for(const change of [{p:12},{vk:5},{fs:true},{lt:8},{vr:false},{t:'Vaas groen'}]){
 const next=plan([{...a,...change},b],first);
 assert.ok(next.urls.includes('https://gids.kadoly.com/onderzoek-vaas'),JSON.stringify(change));
 assert.ok(next.urls.includes('https://gids.kadoly.com/vaas-kiezen'));
 assert.ok(!next.urls.includes('https://gids.kadoly.com/rubriek/hobby'));
}
assert.equal(plan([a],first).verwijderd,1);
console.log('IndexNow: prijs, verzending, voorraad, levertijd, titel, ongewijzigd en verwijdering geslaagd.');
