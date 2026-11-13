// Integratietest van de echte route en SSR met een geïsoleerde catalogus/database.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as crypto from 'node:crypto';
import * as volledig from '../lib/gids-catalogus.js';
import * as indexnow from '../lib/gids-indexnow.js';
import * as bewijs from '../lib/gids-onderzoek.js';
import * as alle from '../lib/gidsen-alle.js';
import * as groei from '../lib/gids-groei.js';
import * as gidsen from '../lib/gidsen-kadoly.js';
const catalog=(fs.existsSync('catalog-audit.json') ? JSON.parse(fs.readFileSync('catalog-audit.json','utf8')) : ['Witte Phalaenopsis Orchidee', 'Bloempot wit', 'Tafellamp oplaadbaar', 'Bamboe sokken', 'Kaars rood', '3D houten puzzel', 'Vaas glas', 'Serviesset beige', ...Array.from({length:25},(_,i)=>'Glazen mok '+i)].map((t,i)=>({id:'oc_'+i,t,vr:true}))).map(i=>({...i,p:20,vk:4.95,c:'wonen',s:'decoratie',lt:3,l:Date.now(),img:'',sc:0}));
for(const g of Object.values(gidsen.GIDSEN)) for(const k of g.keuze) if(!catalog.some(i=>i.id===k.pid)) catalog.push({id:k.pid,t:k.naam,vr:true,p:20,vk:4.95,c:'wonen',s:'decoratie',lt:3,l:Date.now(),img:'',sc:0});
for(let k=0;k<140;k++)catalog.push({id:'oc_extra'+k,t:(k%2?'Mok':'Dinerbord')+' test '+k,vr:true,p:k+1,vk:3,c:'keuken',s:'servies',lt:3,l:Date.now()});
for(let k=0;k<140;k++)catalog.push({id:'oc_pot'+k,t:(k%2?'Bloempot voor binnen':'Plantenbak buiten')+' test '+k,vr:true,p:k+1,vk:3,c:'wonen',s:'planten',lt:3,l:Date.now()});
catalog.push({id:'oc_ring',t:'Metalen Paddenstoelring voor Plantenpotten',vr:true,p:20,vk:3,c:'wonen',s:'planten',lt:3,l:Date.now()});
const context=vm.createContext({console,URL,Buffer,Date,Set,Map,process:{env:{}},AbortSignal,fetch:()=>{throw Error('Geen externe requests in rendertest');}});
const synth=obj=>new vm.SyntheticModule(Object.keys(obj),function(){for(const [k,v]of Object.entries(obj))this.setExport(k,v);},{context});
const code=fs.readFileSync('api/gids.js','utf8');
const kv={get:async k=>k==='hjdk:shop:cat'?{items:catalog}:null,set:async()=>{},raw:async()=>[],mget:async(...keys)=>keys.map(()=>null)};
const nb=Object.fromEntries([...new Set([...code.matchAll(/NB\.([\w]+)/g)].map(m=>m[1]))].map(k=>[k,/^[A-Z_]+$/.test(k)?'':k==='blok'?()=>'':k==='mailKlaar'?async()=>false:k==='blokInfo'?async()=>({}):async()=>[]]));
const stubs={'../lib/gidsen-alle.js':alle,'../lib/gids-indexnow.js':indexnow,'../lib/gids-catalogus.js':volledig,'../lib/db.js':{kv},'../lib/look.js':{lookNieuw:()=>''},'../lib/gidsen-kadoly.js':gidsen,'../lib/ai.js':{berichten:()=>{},HAIKU:'test'},'node:crypto':crypto,'../lib/kadoly-nieuws.js':nb,'../lib/gids-onderzoek.js':bewijs,'../lib/gids-groei.js':groei};
const module=new vm.SourceTextModule(code,{context});await module.link(name=>{assert.ok(stubs[name],name);return synth(stubs[name]);});await module.evaluate();
async function render(query,host='gids.kadoly.com'){let body='',status=200;const headers={};const res={setHeader:(k,v)=>headers[k]=v,status(n){status=n;return this;},send(x){body=x;return this;},json(x){body=x;return this;},end(){return this;}};await module.namespace.default({url:'/api/gids?'+query,method:'GET',headers:{host,'user-agent':'render-test-bot'}},res);assert.equal(status,200,typeof body==='string'?body.slice(0,200):JSON.stringify(body));if(typeof body==='string'&&body.includes('<html')){assert.equal((body.match(/<h1[ >]/g)||[]).length,1);for(const match of body.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))JSON.parse(match[1]);}return {body,headers};}
for(const p of bewijs.ONDERZOEK){const {body}=await render('slug=onderzoek-'+p.id);assert.ok(body.includes('Wat bewijst dit niet?'));assert.ok(body.includes('Bronnen en belangen'));assert.ok(body.includes('rel="canonical" href="https://gids.kadoly.com/onderzoek-'+p.id+'"'));}
assert.ok((await render('slug=onderzoek-en-bronnen')).body.includes('geen onafhankelijke testorganisatie'));
const all=(await render('slug=alle-producten')).body;assert.equal((all.match(/<tr id="product-/g)||[]).length,catalog.filter(i=>i.vr!==false).length); assert.ok(all.includes('/alle-producten'));
const home=(await render('')).body;assert.ok(home.includes('/onderzoek-en-bronnen'));
const leg=(await render('slug=houten-legpuzzel-volwassenen')).body;assert.ok(leg.includes('href="https://pubmed.ncbi.nlm.nih.gov/39842256/"'));assert.ok(leg.includes('Bronnen en beperkingen'));assert.ok(!leg.includes('snel mee klaar'));
for(const slug of ['wollen-deken','kerstkrans','vaas-kiezen']) {
 const h=(await render('slug='+slug)).body;
 const graph=[...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>JSON.parse(m[1])['@graph']||[]);
 const art=graph.find(x=>x['@type']==='Article');
 assert.deepEqual(art.citation,gidsen.GIDSEN[slug].bronnen.map(id=>bewijs.BRONNEN[id].url));
 for(const url of art.citation)assert.ok(h.includes('href="'+url.replace(/&/g,'&amp;')+'"'));
 assert.equal(graph.find(x=>x['@type']==='ItemList').itemListElement.length,gidsen.GIDSEN[slug].keuze.length);
 assert.ok(!h.includes('Minst kriebel'));assert.ok(!h.includes('Reken op bruin'));
}
for(const id of ['vaas-verse-bloemen','tafellamp-lumen','bamboe-textiel-claims'])assert.ok(home.includes('href="/onderzoek-'+id+'"'));
assert.ok(!home.includes('producten van onafhankelijke Europese makers'));
const rub=(await render('rubriek=wonen')).body; const schema=[...rub.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>JSON.parse(m[1])['@graph']||[]).find(x=>x['@type']==='ItemList'&&x.name.startsWith('Nieuw in')); assert.equal(schema.itemListElement.length,24); assert.equal((rub.match(/class="nw-a"/g)||[]).length,24);await render('slug=nieuw-bij-kadoly');await render('slug=3d-houten-puzzel-volwassenen');
const sitemap=(await render('op=sitemap')).body;assert.ok(sitemap.includes('/onderzoek-tafellamp-lumen'));assert.ok(!sitemap.includes('<loc>https://gids.kadoly.com/</loc><lastmod>'));
assert.ok((await render('op=llmsfull')).body.includes('Ravensburger'));
const report=(await render('op=groei','hjdk-api-henq.vercel.app')).body;assert.ok(report.includes('noindex,nofollow'));
assert.equal((await render('op=onderzoekstand')).body.exactModelGetest,0);
console.log(JSON.stringify({routes:'8 onderwerpen, bronhub, home, rubriek, nieuw, bestaande gids, sitemap, llms-full, beschermd groeirapport',dekking:bewijs.dekking(catalog)},null,2));





const sh=(await render('slug=serviesset')).body;
const graph=sh.split('<script type="application/ld+json">').slice(1).flatMap(s=>JSON.parse(s.split('</script>')[0])['@graph']||[]);
const al=graph.find(x=>x['@type']==='ItemList'&&x.name==='Alle servies bij Kadoly');
const visible=sh.slice(sh.indexOf('<section id="alle">')).split('</section>')[0];
const visibleIds=visible.split('href="/naar/').slice(1).map(s=>s.split('?')[0]);
assert.equal(al.numberOfItems,120);
assert.deepEqual(al.itemListElement.map(x=>x.url.split('/').pop()),visibleIds);
assert.equal(graph.find(x=>x['@type']==='Article').citation.length,2);
assert.ok(sh.includes('51/23/EM'));assert.ok(sh.includes('Ovengebruik van de brunchset eerst bevestigen'));
const g=gidsen.GIDSEN.serviesset;
const choose=answers=>g.check.regels.find(r=>Object.entries(r.als).every(([k,v])=>v.includes(answers[k])));
assert.equal(choose({wat:'brunch',oven:'ja',stijl:'rustiek'}).pid,undefined);
for(const stijl of ['strak','rustiek'])assert.equal(choose({wat:'compleet',oven:'ja',stijl}).pid,'oc_4174004737720321');
console.log('Servies: 120 zichtbare schema-items in gelijke volgorde; bron en beslisroutes geslaagd.');


const ph=(await render('slug=bloempot-binnen')).body;
const pg=ph.split('<script type="application/ld+json">').slice(1).flatMap(s=>JSON.parse(s.split('</script>')[0])['@graph']||[]);
const pl=pg.find(x=>x.name==='Alle bloempotten en plantenbakken bij Kadoly');
const pv=ph.slice(ph.indexOf('<section id="alle">')).split('</section>')[0].split('href="/naar/').slice(1).map(s=>s.split('?')[0]);
assert.equal(pl.numberOfItems,120);assert.deepEqual(pl.itemListElement.map(x=>x.url.split('/').pop()),pv);
assert.ok(!pv.includes('oc_ring'));assert.ok(ph.includes('SPES-804P'));assert.ok(ph.includes('2026-06-02'));
assert.equal(pg.find(x=>x['@type']==='Article').citation.length,2);
const pot=gidsen.GIDSEN['bloempot-binnen'];
assert.ok(!JSON.stringify(pot).includes('Meet na met de foto'));assert.ok(!JSON.stringify(pot).includes('zijn deze potten te klein'));
assert.ok(pot.faq.find(x=>x.v==='Is een metalen bloempot waterdicht?').a.includes('niet hetzelfde als waterdicht'));
assert.ok(pot.keuze.find(x=>x.pid==='oc_4174003434799105').beperking.includes('kleur is onbekend'));
console.log('Bloempot: bron/variantgrenzen en 120 schema-items exact gelijk aan zichtbare lijst; accessoire uitgesloten.');

// De veiligheidsbeslissing mag geen model kiezen voordat onbekende constructie is opgelost.
const fire=gidsen.GIDSEN.tafelhaard;
assert.ok(bewijs.bronLink({t:'Bioethanol Vuurpot'}).includes('href="/tafelhaard"'));
assert.ok(!bewijs.bronLink({t:'Bioethanol Vuurschaal'}).includes('href="/tafelhaard"'));
assert.equal(bewijs.ONDERZOEK.length,8);
assert.equal(fire.keuze.length,6);
assert.ok(fire.check.regels.every(r=>!r.pid));
assert.ok(fire.tabel.every(r=>!r.pid));
assert.ok(fire.kort.includes('binnen raden we'));
assert.ok(!fire.kort.includes('buiten in de wind'));
assert.ok(fire.check.regels.find(r=>r.id==='binnen').als.waar.includes('binnen'));
assert.ok(fire.check.regels.find(r=>r.id==='open').als.brander.includes('open'));
assert.ok(fire.check.regels.find(r=>r.id==='onbekend').als.brander.includes('onbekend'));
const fh=(await render('slug=tafelhaard')).body;
const fg=[...fh.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>JSON.parse(m[1])['@graph']||[]);
assert.deepEqual(fg.find(x=>x['@type']==='Article').citation,fire.bronnen.map(id=>bewijs.BRONNEN[id].url));
for(const id of fire.bronnen) assert.ok(fh.includes('href="'+bewijs.BRONNEN[id].url+'"'));
assert.ok(fh.includes('IKEA-Stiftung Deutschland'));
assert.ok(fh.includes('Houswise Vesper, Altair, Quad en Astra'));
assert.ok(fh.includes('niet dat onze producten zijn teruggeroepen'));
assert.ok((await render('op=llmsfull')).body.includes(bewijs.BRONNEN.ethanolHouswise.url));
console.log('Tafelhaard: zes feitenkaarten, bronnen/schema gelijk en geen automatische brandend-gebruikaanbeveling.');


