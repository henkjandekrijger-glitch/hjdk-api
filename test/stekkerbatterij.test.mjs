import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as core from '../lib/stekkerbatterij.js';
const {batteryEconomics,batteryAdvice,batteryRoute,bolBatteryLink,amazonBatteryLink,isCompleteBatteryProduct,BATTERY_MODELS,BATTERY_URL}=core;
test('27 routes give appropriate advice; no-solar, unknown connection and backup do not imply a purchase',()=>{
 for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++)assert.ok(batteryAdvice([a,b,c]).title);
 assert.deepEqual(batteryRoute('9-NaN--'),[0,0,0]);
 assert.equal(batteryAdvice([0,2,0]).kind,'backup');
 assert.deepEqual(batteryAdvice([1,0,0]).ids,[]);
 assert.deepEqual(batteryAdvice([0,0,2]).ids,[]);
 assert.equal(batteryAdvice([1,1,0]).kind,'dynamic');
 assert.ok(!batteryAdvice([1,1,0]).ids.includes('homewizard'));
});
test('energy calculation deducts losses, forgone export, standby and subscriptions',()=>{
 const v={mode:'solar',capacity:2.7,days:220,efficiency:90,buy:.30,charge:.05,investment:1200,fees:0,standby:3};
 const r=batteryEconomics(v);assert.ok(Math.abs(r.gross-130.68)<1e-8);assert.ok(Math.abs(r.net-122.796)<1e-8);assert.ok(Math.abs(r.output-534.6)<1e-8);
 assert.equal(batteryEconomics({...v,charge:.4}).payback,null);
 assert.equal(batteryEconomics({...v,efficiency:101}),null);assert.equal(batteryEconomics({...v,days:-1}),null);
 assert.equal(batteryEconomics({...v,days:0,standby:0}).net,0);
 assert.ok(batteryEconomics({...v,mode:'dynamic',charge:-.05}).net>r.net);
});
test('bol affiliate link resolves to the intended term; NL Amazon tag stays on NL marketplace',()=>{
 const link=new URL(bolBatteryLink('Anker SOLIX Solarbank 3','kz_stekkerbatterij-000-anker'));
 assert.equal(link.hostname,'partner.bol.com');assert.equal(link.searchParams.get('s'),'1547300');
 const dest=new URL(link.searchParams.get('url'));assert.equal(dest.hostname,'www.bol.com');assert.equal(dest.searchParams.get('searchtext'),'Anker SOLIX Solarbank 3');
 const amz=new URL(amazonBatteryLink('Zendure SolarFlow','yoorsbrug-21'));assert.equal(amz.hostname,'www.amazon.nl');assert.equal(amz.searchParams.get('tag'),'yoorsbrug-21');
});
test('product matching rejects service, cable, extension battery, wrong generation and foreign URLs',()=>{
 const p={title:'Anker SOLIX Solarbank 3 E2700 Pro - thuisbatterij',url:'https://www.bol.com/nl/nl/p/example/123/'};
 assert.equal(isCompleteBatteryProduct(p,'anker'),true);
 for(const title of ['Plug-in thuisbatterij laten aansluiten - Zoofy','Anker SOLIX Solarbank 3 E2700 Pro uitbreidingsaccu','Anker BP2700 voor Solarbank 3','Anker Solarbank 3 E2700 accukabel'])assert.equal(isCompleteBatteryProduct({...p,title},'anker'),false);
 assert.equal(isCompleteBatteryProduct({...p,url:'https://evil.example/battery'},'anker'),false);
 assert.equal(isCompleteBatteryProduct({...p,title:'Zendure SolarFlow 800 Pro 2'},'zendure'),false);
 assert.equal(isCompleteBatteryProduct({...p,title:'HomeWizard Plug-In Battery 2.7 kWh'},'homewizard'),true);
});
let page;
async function pageModule(){
 if(page)return page;
 const kv={incrMany:async()=>{}};
 globalThis.__batteryFixture={...core,look:()=>'',ACCENTS:{keuzehulp:{}},kv,getAmzTagOnly:async()=>({market:'www.amazon.nl',tag:'yoorsbrug-21'}),searchCached:async query=>({at:Date.now(),products:[{title:query+' laten aansluiten',url:'https://www.bol.com/nl/nl/p/service/1/',price:89},{title:query,url:'https://www.bol.com/nl/nl/p/battery/2/',price:1200}]})};
 let s=await readFile(new URL('../lib/stekkerbatterij-page.js',import.meta.url),'utf8');s=s.replace(/^import .*;\n/gm,'');s='const {'+Object.keys(globalThis.__batteryFixture).join(',')+'}=globalThis.__batteryFixture;\n'+s;
 page=await import('data:text/javascript;base64,'+Buffer.from(s).toString('base64'));return page;
}
test('SSR includes complete indexable content, matching schema, selected advice and tracked links without invented offers',async()=>{
 const m=await pageModule(),html=m.renderBatteryPage({tag:'yoorsbrug-21',route:[0,0,0]});
 assert.match(html,/<link rel="canonical" href="https:\/\/keuzehulp.best\/stekkerbatterij">/);assert.match(html,/Salderingsregeling|salderingsregeling/);assert.match(html,/partner.bol.com/);assert.match(html,/tag=yoorsbrug-21/);
 for(const model of BATTERY_MODELS)assert.ok(html.includes(model.name));
 const schema=m.batterySchema();assert.equal(schema['@graph'][0].mainEntityOfPage,BATTERY_URL);assert.equal(schema['@graph'].find(x=>x['@type']==='FAQPage').mainEntity.length,core.BATTERY_FAQ.length);assert.ok(!JSON.stringify(schema).includes('AggregateRating'));assert.ok(!JSON.stringify(schema).includes('"offers"'));
 const scripts=[...html.matchAll(/<script(?: ([^>]*))?>([\s\S]*?)<\/script>/g)].filter(x=>!x[1]||!x[1].includes('application/'));for(const x of scripts)new Function(x[2]);
 assert.match(m.renderBatteryPage({tag:'yoorsbrug-21',route:[0,2,0]}),/Begin met een passend noodstroomontwerp/);
});
test('real offer pipeline excludes service results and keeps source times',async()=>{
 const m=await pageModule(),offers=await m.batteryOffers();assert.equal(offers.length,3);assert.ok(offers.every(x=>x.price===1200&&x.at&&!/laten aansluiten/.test(x.title)));
 const r={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},send(v){this.body=v;return this;}};
 await m.batteryHandler({method:'GET',url:'/api/keuze-tools?tool=battery&market=nl&a=0-1-0',headers:{}},r);
 assert.equal(r.code,200);assert.equal(r.headers['x-robots-tag'],'index, follow');assert.match(r.body,/regelbare opslag/);assert.match(r.body,/Productprijzen uit de bol-bron/);
});
test('hosting route and catalog integration keep a single canonical guide',async()=>{
 const v=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
 const route=v.rewrites.find(x=>x.source==='/stekkerbatterij');assert.equal(route.destination,'/api/keuze-tools?tool=battery&market=nl');
 const cat=await readFile(new URL('../lib/keuze-extra-content.js',import.meta.url),'utf8');assert.match(cat,/batteryItem\(\)/);
});
