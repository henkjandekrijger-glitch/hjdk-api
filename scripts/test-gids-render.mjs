// Integratietest van de echte route en SSR met een geïsoleerde catalogus/database.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as crypto from 'node:crypto';
import * as volledig from '../lib/gids-catalogus.js';
import * as bewijs from '../lib/gids-onderzoek.js';
import * as groei from '../lib/gids-groei.js';
import * as gidsen from '../lib/gidsen-kadoly.js';
const catalog=(fs.existsSync('catalog-audit.json') ? JSON.parse(fs.readFileSync('catalog-audit.json','utf8')) : ['Witte Phalaenopsis Orchidee', 'Bloempot wit', 'Tafellamp oplaadbaar', 'Bamboe sokken', 'Kaars rood', '3D houten puzzel', 'Vaas glas', 'Serviesset beige', ...Array.from({length:25},(_,i)=>'Glazen mok '+i)].map((t,i)=>({id:'oc_'+i,t,vr:true}))).map(i=>({...i,p:20,vk:4.95,c:'wonen',s:'decoratie',lt:3,l:Date.now(),img:'',sc:0}));
const context=vm.createContext({console,URL,Buffer,Date,Set,Map,process:{env:{}},AbortSignal,fetch:()=>{throw Error('Geen externe requests in rendertest');}});
const synth=obj=>new vm.SyntheticModule(Object.keys(obj),function(){for(const [k,v]of Object.entries(obj))this.setExport(k,v);},{context});
const code=fs.readFileSync('api/gids.js','utf8');
const kv={get:async k=>k==='hjdk:shop:cat'?{items:catalog}:null,set:async()=>{},raw:async()=>[],mget:async(...keys)=>keys.map(()=>null)};
const nb=Object.fromEntries([...new Set([...code.matchAll(/NB\.([\w]+)/g)].map(m=>m[1]))].map(k=>[k,/^[A-Z_]+$/.test(k)?'':k==='blok'?()=>'':k==='mailKlaar'?async()=>false:k==='blokInfo'?async()=>({}):async()=>[]]));
const stubs={'../lib/gids-catalogus.js':volledig,'../lib/db.js':{kv},'../lib/look.js':{lookNieuw:()=>''},'../lib/gidsen-kadoly.js':gidsen,'../lib/ai.js':{berichten:()=>{},HAIKU:'test'},'node:crypto':crypto,'../lib/kadoly-nieuws.js':nb,'../lib/gids-onderzoek.js':bewijs,'../lib/gids-groei.js':groei};
const module=new vm.SourceTextModule(code,{context});await module.link(name=>{assert.ok(stubs[name],name);return synth(stubs[name]);});await module.evaluate();
async function render(query,host='gids.kadoly.com'){let body='',status=200;const headers={};const res={setHeader:(k,v)=>headers[k]=v,status(n){status=n;return this;},send(x){body=x;return this;},json(x){body=x;return this;},end(){return this;}};await module.namespace.default({url:'/api/gids?'+query,method:'GET',headers:{host,'user-agent':'render-test-bot'}},res);assert.equal(status,200,typeof body==='string'?body.slice(0,200):JSON.stringify(body));if(typeof body==='string'&&body.includes('<html')){assert.equal((body.match(/<h1[ >]/g)||[]).length,1);for(const match of body.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))JSON.parse(match[1]);}return {body,headers};}
for(const p of bewijs.ONDERZOEK){const {body}=await render('slug=onderzoek-'+p.id);assert.ok(body.includes('Wat bewijst dit niet?'));assert.ok(body.includes('Bronnen en belangen'));assert.ok(body.includes('rel="canonical" href="https://gids.kadoly.com/onderzoek-'+p.id+'"'));}
assert.ok((await render('slug=onderzoek-en-bronnen')).body.includes('geen onafhankelijke testorganisatie'));
const all=(await render('slug=alle-producten')).body;assert.equal((all.match(/<tr id="product-/g)||[]).length,catalog.filter(i=>i.vr!==false).length); assert.ok(all.includes('/alle-producten'));
const home=(await render('')).body;assert.ok(home.includes('/onderzoek-en-bronnen'));
const rub=(await render('rubriek=wonen')).body; const schema=[...rub.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>JSON.parse(m[1])['@graph']||[]).find(x=>x['@type']==='ItemList'&&x.name.startsWith('Nieuw in')); assert.equal(schema.itemListElement.length,24); assert.equal((rub.match(/class="nw-a"/g)||[]).length,24);await render('slug=nieuw-bij-kadoly');await render('slug=3d-houten-puzzel-volwassenen');
const sitemap=(await render('op=sitemap')).body;assert.ok(sitemap.includes('/onderzoek-tafellamp-lumen'));assert.ok(!sitemap.includes('<loc>https://gids.kadoly.com/</loc><lastmod>'));
assert.ok((await render('op=llmsfull')).body.includes('Ravensburger'));
const report=(await render('op=groei','hjdk-api-henq.vercel.app')).body;assert.ok(report.includes('noindex,nofollow'));
assert.equal((await render('op=onderzoekstand')).body.exactModelGetest,0);
console.log(JSON.stringify({routes:'8 onderwerpen, bronhub, home, rubriek, nieuw, bestaande gids, sitemap, llms-full, beschermd groeirapport',dekking:bewijs.dekking(catalog)},null,2));

