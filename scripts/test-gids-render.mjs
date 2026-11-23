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
import * as redactie from '../lib/kadoly-redactie.js';
import * as gidsen from '../lib/gidsen-kadoly.js';
const catalog=(fs.existsSync('catalog-audit.json') ? JSON.parse(fs.readFileSync('catalog-audit.json','utf8')) : ['Witte Phalaenopsis Orchidee', 'Bloempot wit', 'Tafellamp oplaadbaar', 'Bamboe sokken', 'Kaars rood', '3D houten puzzel', 'Vaas glas', 'Serviesset beige', ...Array.from({length:25},(_,i)=>'Glazen mok '+i)].map((t,i)=>({id:'oc_'+i,t,vr:true}))).map(i=>({...i,p:20,vk:4.95,c:'wonen',s:'decoratie',lt:3,l:Date.now(),img:'',sc:0}));
for(const g of Object.values(gidsen.GIDSEN)) for(const k of g.keuze) if(k.pid&&!catalog.some(i=>i.id===k.pid)) catalog.push({id:k.pid,t:k.naam,vr:true,p:20,vk:4.95,c:'wonen',s:'decoratie',lt:3,l:Date.now(),img:'',sc:0});
for(let k=0;k<140;k++)catalog.push({id:'oc_extra'+k,t:(k%2?'Mok':'Dinerbord')+' test '+k,vr:true,p:k+1,vk:3,c:'keuken',s:'servies',lt:3,l:Date.now()});
for(let k=0;k<140;k++)catalog.push({id:'oc_pot'+k,t:(k%2?'Bloempot voor binnen':'Plantenbak buiten')+' test '+k,vr:true,p:k+1,vk:3,c:'wonen',s:'planten',lt:3,l:Date.now()});
catalog.push({id:'oc_ring',t:'Metalen Paddenstoelring voor Plantenpotten',vr:true,p:20,vk:3,c:'wonen',s:'planten',lt:3,l:Date.now()});
catalog.push({id:'oc_4174005539848193',t:'Gevlochten Roze Bedbumper 2m Katoen voor Baby',vr:true,p:20,vk:4.95,lt:8,c:'kids',s:'baby',l:Date.now()+60000,img:''});
catalog.push({id:'oc_4174005507129345',t:'Grijze Baby Slaapzak met Fleece',vr:true,p:20,vk:4.95,lt:8,c:'kids',s:'baby',l:Date.now()+60000,img:''});
catalog.push({id:'dp_1019',t:'Yakiniku BBQ Kamado 22 inch XL',vr:true,p:1629,vk:0,lt:8,c:'wonen',s:'tuin',l:Date.now(),img:''});
const context=vm.createContext({console,URL,Buffer,Date,Set,Map,process:{env:{}},AbortSignal,fetch:()=>{throw Error('Geen externe requests in rendertest');}});
const synth=obj=>new vm.SyntheticModule(Object.keys(obj),function(){for(const [k,v]of Object.entries(obj))this.setExport(k,v);},{context});
const code=fs.readFileSync('fn/gids.js','utf8');
const kv={get:async k=>k==='hjdk:shop:cat'?{items:catalog}:null,set:async()=>{},raw:async()=>[],mget:async(...keys)=>keys.map(()=>null)};
const nb=Object.fromEntries([...new Set([...code.matchAll(/NB\.([\w]+)/g)].map(m=>m[1]))].map(k=>[k,/^[A-Z_]+$/.test(k)?'':k==='blok'?()=>'':k==='mailKlaar'?async()=>false:k==='blokInfo'?async()=>({}):async()=>[]]));
const stubs={'../lib/kadoly-redactie.js':redactie,'../lib/kzux.js':{kzuxBlok:()=>''},'../lib/funnel.js':{funnelStap:async()=>null,funnelStand:async()=>({}),funnelHtml:()=>'',fnIdUitCookie:()=>null,isFnBot:()=>true,bronVan:()=>'',FN_JS:()=>''},'../lib/gidsen-alle.js':alle,'../lib/gids-indexnow.js':indexnow,'../lib/gids-catalogus.js':volledig,'../lib/db.js':{kv},'../lib/look.js':{lookNieuw:()=>''},'../lib/gidsen-kadoly.js':gidsen,'../lib/ai.js':{berichten:()=>{},HAIKU:'test'},'node:crypto':crypto,'../lib/kadoly-nieuws.js':nb,'../lib/gids-onderzoek.js':bewijs,'../lib/gids-groei.js':groei};
// Groepscadeaus horen niet bij deze SSR-proef; geen opslag, mail of betaalverkeer.
stubs['../lib/groepscadeau.js']={gcLijst:()=>[],gcLlms:()=>'',LIVE:new Set(),gcOp:()=>{throw Error('Geen groepscadeau-acties in gidstest');}};
const imports=[];
const module=new vm.SourceTextModule(code,{context,importModuleDynamically:async name=>{imports.push(name);throw Error('Geen externe modules in routeproef');}});await module.link(name=>{assert.ok(stubs[name],name);return synth(stubs[name]);});await module.evaluate();
async function render(query,host='gids.kadoly.com'){let body='',status=200;const headers={};const res={setHeader:(k,v)=>headers[k]=v,status(n){status=n;return this;},send(x){body=x;return this;},json(x){body=x;return this;},end(){return this;}};await module.namespace.default({url:'/api/gids?'+query,method:'GET',headers:{host,'user-agent':'render-test-bot'}},res);assert.equal(status,200,typeof body==='string'?body.slice(0,200):JSON.stringify(body));if(typeof body==='string'&&body.includes('<html')){assert.equal((body.match(/<h1[ >]/g)||[]).length,1);for(const match of body.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))JSON.parse(match[1]);}return {body,headers};}
for(const p of bewijs.ONDERZOEK){const {body}=await render('slug=onderzoek-'+p.id);assert.ok(body.includes('Wat bewijst dit niet?'));assert.ok(body.includes('Bronnen en belangen'));assert.ok(body.includes('rel="canonical" href="https://gids.kadoly.com/onderzoek-'+p.id+'"'));}
assert.ok((await render('slug=onderzoek-en-bronnen')).body.includes('geen onafhankelijke testorganisatie'));
const all=(await render('slug=alle-producten')).body;assert.equal((all.match(/<tr id="product-/g)||[]).length,catalog.filter(i=>i.vr!==false).length); assert.ok(all.includes('/alle-producten'));
const home=(await render('')).body;assert.ok(home.includes('/onderzoek-en-bronnen')); assert.ok(!home.includes('5% bij 2 producten')); assert.ok(!home.includes('eerste bestelling wordt gratis'));
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







const whisky=gidsen.GIDSEN['whisky-set-cadeau'];
assert.ok(!JSON.stringify(whisky).includes('Te klein voor ijs'));
assert.ok(!JSON.stringify(whisky).includes('nog maar 2 op voorraad'));
const wh=(await render('slug=whisky-set-cadeau')).body;
const wg=[...wh.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>JSON.parse(m[1])['@graph']||[]);
assert.deepEqual(wg.find(x=>x['@type']==='Article').citation,whisky.bronnen.map(id=>bewijs.BRONNEN[id].url));
assert.ok(wh.includes('geen huidige veiligheidsgarantie')||wh.includes('geen huidige veiligheidsgarantie'.replace('huidige','actuele'))||wh.includes('geen huidige')||wh.includes('geen actuele veiligheidsgarantie'));
assert.ok(wh.includes('ICP-MS'));
assert.ok(!wh.includes('eerste bestelling gratis verzonden'));
assert.ok(wh.includes('Actueel verzendbeleid'));
assert.ok(wh.includes('waardevermindering'));
const wc={'oc_machine':{id:'oc_machine',t:'3kg Rotatie Tumbler voor Sieraden Polijsten van VEVOR',p:20,vr:true},'oc_drink':{id:'oc_drink',t:'Mini Whiskey Tumbler Glazen',p:20,vr:true},'oc_acryl':{id:'oc_acryl',t:'Witte Acrylaat Laag Tumbler Set van 6',p:20,vr:true}};
const wl=alle.alleVan('whisky-set-cadeau',[],wc,{},i=>i.p);
assert.equal(wl.n,2);
assert.ok(wl.groepen.some(x=>x.naam==='Acrylaat drinkbekers'&&x.items[0].id==='oc_acryl'));
assert.equal(bewijs.bronLink(wc.oc_machine),'');
assert.ok(bewijs.bronLink(wc.oc_drink).includes('/whisky-set-cadeau'));
console.log('Whisky: polijstmachine uitgesloten, acrylaat apart, bron/schema en materiaalgrenzen gecontroleerd.');

// Badset: onbekende huidgegevens mogen geen veiligheidsrang of automatische aankoop geven.
const badset=gidsen.GIDSEN['badset-cadeau'];
const onbekend=badset.check.regels.find(x=>x.id==='weet-huid');
assert.equal(onbekend.pid,undefined);
assert.ok(!badset.kort.includes('Geen enkele maker geeft'));
assert.ok(!JSON.stringify(badset).includes('de veiligste keuze'));
assert.ok(!JSON.stringify(badset).includes('Die gebruikt iedereen'));
assert.ok(!JSON.stringify(badset).includes('Alleen de geur verschilt'));
const bh=(await render('slug=badset-cadeau')).body;
const bg=[...bh.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>JSON.parse(m[1])['@graph']||[]);
assert.deepEqual(bg.find(x=>x['@type']==='Article').citation,badset.bronnen.map(id=>bewijs.BRONNEN[id].url));
assert.ok(bh.includes('Sanofi en Regeneron'));
assert.ok(bh.includes('geopende hygiëneproducten'));
console.log('Badset: onbekend zonder koopadvies, online/etiketgrens, sponsors en bron/schema gelijk.');

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

const candle=gidsen.GIDSEN['kaarsen-cadeau'];
assert.ok(!JSON.stringify(candle).includes('veilige grens'));
assert.ok(candle.faq.find(f=>f.v.includes('opgegeven brandduur')).a.includes('onbekend'));
assert.ok(!candle.check.regels.find(r=>r.id==='geurgevoelig').pid);
const ch=(await render('slug=kaarsen-cadeau')).body;
const cg=[...ch.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>JSON.parse(m[1])['@graph']||[]);
assert.deepEqual(cg.find(x=>x['@type']==='Article').citation,candle.bronnen.map(id=>bewijs.BRONNEN[id].url));
for(const id of candle.bronnen)assert.ok(ch.includes('href="'+bewijs.BRONNEN[id].url+'"'));
assert.ok(ch.includes('geen zuivere vergelijking van wassoorten'));
assert.ok(ch.includes('voedselcontactgeschiktheid'));
console.log('Kaarsen: bronnen zichtbaar/schema gelijk, onbekende brandduur en geurklachtenroute gecontroleerd.');

const desk=gidsen.GIDSEN['houten-bureau-accessoires'];
assert.ok(desk.kort.includes('capaciteit is niet onderling gemeten'));
assert.ok(!desk.check.regels.find(x=>x.id==='pennen').pid);
assert.ok(desk.check.regels.find(x=>x.id==='twijfel-zelf').als.wat.includes('pennen'));
assert.ok(!JSON.stringify(desk).includes('krasvrij'));
assert.ok(bewijs.bronLink({id:'oc_4173957651300353',t:'OakyBlocks'}).includes('Prijs en variant niet bevestigd'));
const list=alle.alleVan('houten-bureau-accessoires',[],{'oc_price':{id:'oc_price',t:'Modulaire Houten Bureau Organisers Set - Oakywood',p:27,vr:true}}, {},i=>i.p);
assert.equal(list.n,0);
const dh=(await render('slug=houten-bureau-accessoires')).body;
const dg=[...dh.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>JSON.parse(m[1])['@graph']||[]);
assert.deepEqual(dg.find(x=>x['@type']==='Article').citation,desk.bronnen.map(id=>bewijs.BRONNEN[id].url));
assert.ok(dh.includes('20 studies met 2.478'));
console.log('Bureau: bron-/variantgrenzen, prijsuitsluiting en conditionele keuzecheck geslaagd.');







const babyHub=(await render('slug=onderzoek-en-bronnen')).body;
assert.ok(babyHub.includes('Wij raden dit product af voor het babybed'));
assert.ok(babyHub.includes('TOG ontbreekt'));
assert.ok(babyHub.includes('geen test of terugroepactie'));
for(const slug of ['', 'nieuw-bij-kadoly', 'alle-producten']) {
  const h=(await render('slug='+slug)).body;
  assert.ok(h.includes('Geen NL-levering bevestigd'),slug);
  assert.ok(h.includes('/onderzoek-en-bronnen#nieuw-productadvies'),slug);
}
assert.equal(bewijs.leveringsBeperking({id:'oc_other'}),'');
assert.equal(bewijs.nieuwProductAdvies({id:'oc_other'}),'');
console.log('Nieuwe producten: babybed-advies, onbekende TOG, NL-leveringsbeperking op home/nieuw/aanbod geslaagd.');
const serviesProfiel=bewijs.ONDERZOEK.find(p=>p.id==='servies-gebruik');
for(const t of ['Nina Theeset - 3-delig','Lauren Dubbelwandig Glas 490 ml','Dubbelwandige glazen']) assert.ok(serviesProfiel.match({t}),t);
for(const t of ['Poppen theeset speelgoed','Theepot miniatuur','Bekerhouder']) assert.equal(serviesProfiel.match({t}),false,t);
assert.ok(bewijs.nieuwProductAdvies({id:'oc_nieuw',t:'Grijze Jersey Bedbumper voor Baby'}).includes('Niet gebruiken als bedomrander'));
assert.equal(bewijs.nieuwProductAdvies({id:'oc_hoes',t:'Hoes voor bedbumper'}),'');
for(const id of ['oc_4174005539848193','oc_4174005519319041','oc_4174005539094529'])assert.ok(bewijs.leveringsBeperking({id}).includes('Geen NL-levering'));
assert.equal(bewijs.leveringsBeperking({id:'oc_ongecontroleerd',t:'Bedbumper'}),'');
const nieuwSchema=JSON.parse((await render('slug=nieuw-bij-kadoly')).body.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const vind=(x)=>x&&typeof x==='object'?(x['@type']==='Product'&&x.offers?.url?.endsWith('oc_4174005539848193')?[x]:Object.values(x).flatMap(vind)):[];
const bumperSchema=vind(nieuwSchema);assert.ok(bumperSchema.length);assert.equal(bumperSchema[0].offers.shippingDetails,undefined);
assert.ok(babyHub.includes('instroom-19nov'));assert.ok(babyHub.includes('300 cm'));assert.ok(babyHub.includes('FTC'));
for(const id of ['dp_1010','dp_1013','dp_1017'])assert.ok(bewijs.bronLink({id}).includes('instroom-19nov'));
assert.ok(gidsen.GIDSEN['grote-hanglamp'].faq.some(f=>f.a.includes('geen absolute voorwaarden')));
console.log('19nov: serviesmatches/uitsluitingen, automatische bumpercheck, specifieke landrestricties en schema zonder NL-claim geslaagd.');

const zoekBaby=(await render('op=zoek&q=bedbumper')).body;
assert.ok(zoekBaby.includes('Geen NL-levering bevestigd'));
assert.ok(zoekBaby.includes('Niet gebruiken als bedomrander'));
const zoekJson=(await render('op=zoek&q=bedbumper&f=json')).body;
const beperkt=zoekJson.producten.find(p=>p.pid==='oc_4174005539848193');assert.ok(beperkt);assert.equal(beperkt.datum,'');
assert.equal(bewijs.aanbevelingToegestaan({id:'oc_andere',t:'Zachte Bedbumper voor Baby'}),false);
assert.equal(bewijs.aanbevelingToegestaan({id:'oc_4174005519319041',t:'Jersey'}),false);
assert.equal(bewijs.aanbevelingToegestaan({id:'ander',t:'Slaapzak'}),true);
const nieuw20=(await render('slug=nieuw-bij-kadoly')).body;
assert.ok(nieuw20.includes('Catalogusdatum'));assert.ok(!nieuw20.includes('Nieuw sinds <time'));
assert.ok(nieuw20.includes('geen telling van bewezen nieuwe introducties'));
assert.ok(!nieuw20.includes('producten kwamen er'));
const bron20=(await render('slug=onderzoek-en-bronnen')).body;
assert.ok(bron20.includes('meubels-20nov'));assert.ok(bron20.includes('71 kg'));
for(const id of ['dp_1021','dp_1027','dp_1035','dp_1037'])assert.ok(bewijs.bronLink({id}).includes('meubels-20nov'));
const catBron=(await render('op=nieuwstand','hjdk-api-henq.vercel.app')).body;
assert.equal(catBron.catalogusBron.records,catalog.length);assert.equal(catBron.catalogusBron.dubbeleIds.length,0);
console.log('20nov: zoekwaarschuwing/NL-datum, aanbevelingsuitsluiting, eerlijke catalogusdatum en vier meubelchecks geslaagd.');
const normLamp=volledig.normaliseerGidsProduct({id:'dp_1091',t:'De Garaffa Pendellamp',c:'keuken',s:'glazen'});
assert.equal(normLamp.c,'wonen');assert.equal(normLamp.s,'verlichting');assert.equal(normLamp.bronRubriek.c,'keuken');
for(const t of ['Marilyn Consoletafel van Glas','Het Bagagerek - Naturel','Tanner ladekast','Bijzettafel teak'])assert.equal(volledig.normaliseerGidsProduct({id:'dp_999',t,c:'keuken',s:'glazen'}).s,'meubels');
const geenNorm={id:'oc_123',t:'Marilyn Consoletafel',c:'keuken',s:'glazen'};assert.equal(volledig.normaliseerGidsProduct(geenNorm),geenNorm);
assert.equal(volledig.normaliseerGidsProduct({id:'dp_1074',t:'Het Jasmijnbord',c:'keuken',s:'servies'}).s,'muur');
assert.equal(volledig.normaliseerGidsProduct({id:'dp_1222',t:'Bowlzilla Schaal',c:'keuken',s:'servies'}).c,'keuken');
assert.ok(bewijs.leveringsBeperking({id:'oc_4174005507588097'}).includes('21 november'));
assert.equal(bewijs.aanbevelingToegestaan({id:'oc_4174005507588097'}),false);
assert.ok(bewijs.bronLink({id:'nieuw',t:'Mint Baby Slaapzak All-Seizoen'}).includes('instroom-21nov'));
assert.equal(bewijs.bronLink({id:'nieuw',t:'Slaapzak voor kamperen'}),'');
const gsDagen=Array.from({length:14},(_,i)=>({dag:'2026-11-'+String(i+5).padStart(2,'0'),imp:i===3?1:i===6?2:i===7?1:0,clicks:0}));
const vergelijking=groei.vergelijkDagen(gsDagen);assert.equal(vergelijking.vertoningen.voor,3);assert.equal(vergelijking.vertoningen.na,1);assert.equal(vergelijking.klikken.voor,0);assert.equal(vergelijking.klikken.na,0);assert.equal(vergelijking.eenheid,'klikken');
assert.equal(groei.vergelijkDagen(gsDagen.slice(1)).status,'te-weinig-data');
assert.equal(groei.vergelijkDagen(gsDagen.map((d,i)=>i===4?{...d,imp:null}:d)).status,'onbekend');
const vandaag=new Date().toISOString().slice(0,10),oudSnap={dag:vandaag,ai:{status:'ontbreekt'},google:{dagen:gsDagen,paginas:[]}};
const fakeKV={get:async k=>k==='gk:groei:laatste'?oudSnap:k.startsWith('zicht:meting:')?{dag:vandaag,llmCitatie:{model:'perplexity/sonar',panel:'vast',geslaagd:8,geciteerd:0,rate:0}}:null,raw:async()=>[],set:async()=>assert.fail('Historie mag niet worden overschreven')};
const actuele=await groei.groeiStand(fakeKV,[]);assert.equal(actuele.actueleAi.geslaagd,8);assert.equal(actuele.actueleAi.geciteerd,0);assert.equal(actuele.laatste.ai.status,'ontbreekt');assert.equal(actuele.vergelijkingActueel.vertoningen.voor,3);
assert.equal(await groei.actueleAiStand({get:async()=>({dag:'2026-01-01',llmCitatie:{geslaagd:8}})}),null);
const foutAI=await groei.actueleAiStand({get:async()=>({dag:vandaag,llm:[{fout:'402 krediet'}]})});assert.equal(foutAI.geciteerd,null);assert.equal(foutAI.fouten[0],'402 krediet');
assert.ok(groei.groeiHtml(actuele).includes('vertoningen 3 → 1'));
assert.ok((await render('slug=onderzoek-en-bronnen')).body.includes('Mint babyslaapzak'));
console.log('21nov: gerichte rubriekscorrectie, mintlandbeperking, beide weekmetrics en later AI-panel zonder snapshotwijziging geslaagd.');

// 22 november: kritische modelcheck in SSR en LLM-tekst, geen ongerelateerde match.
const hub22=(await render('slug=onderzoek-en-bronnen')).body;
assert.ok(hub22.includes('id="kamado-22nov"'));
for(const id of ['kamadoGgd','kamadoMaker','kamadoManual'])assert.ok(hub22.includes(bewijs.BRONNEN[id].url));
assert.ok(bewijs.bronLink({id:'dp_1019'}).includes('#kamado-22nov'));
assert.ok(!bewijs.bronLink({id:'test',t:'Hoes voor kamado'}).includes('#kamado-22nov'));
assert.ok((await render('op=llmsfull')).body.includes('Kamado 22 inch XL'));
for(const q of ['', 'slug=nieuw-bij-kadoly', 'slug=whisky-set-cadeau']) {
 const h=(await render(q)).body;
 assert.ok(h.includes('tegenstrijdigheid'));
 assert.ok(!h.includes('je krijgt een retourlabel en het hele bedrag terug'));
 assert.ok(!h.includes('versturen met gratis retourlabel'));
}
assert.ok((await render('slug=alle-producten')).body.includes('#kamado-22nov'));
// Handmatig aanmelden moet geen spaarmail uitvoeren; de normale cron blijft gelijk.
// De route heeft de echte groeifunctie reeds gekoppeld. Een bestaande dagmeting
// voorkomt een GSC-aanroep; alle opslag en fetch blijven geïsoleerd.
const oudeGet=kv.get;kv.get=async k=>k==='gk:groei:laatste'?{dag:new Date().toISOString().slice(0,10)}:oudeGet(k);
await render('op=indexnow&alleenGids=1','hjdk-api-henq.vercel.app');
assert.ok(!imports.includes('../lib/samensparen.js'));
kv.get=oudeGet;
console.log('22nov: Kamado-bronnen/SSR/LLM, retourtegenstrijdigheid en gidsronde zonder spaarmail geslaagd.');
// 23 november: sieradenmatch is categorieadvies, geen metaal- of testgarantie.
for(const t of ['14K Gouden Parel Oorbellen','Amelie Hoop Earrings','18k Gold Vermeil Smart Bracelet','Silver Ring','Halsketting met parel'])assert.ok(bewijs.sieraadMatch({t}),t);
for(const t of ['Sieradendoos','Earring holder','Servetring','Napkin rings','Key ring','Tand bijtring'])assert.ok(!bewijs.sieraadMatch({t}),t);
const sj=(await render('slug=onderzoek-en-bronnen')).body;
assert.ok(sj.includes('id="sieraden-23nov"'));assert.ok(sj.includes('48 voldeden'));assert.ok(sj.includes('geen overeenkomst met deze modellen'));
for(const id of ['sieraadNvwa','sieraadNvdv','sieraadEcha'])assert.ok(sj.includes(bewijs.BRONNEN[id].url));
assert.ok((await render('op=llmsfull')).body.includes('verguld is geen allergievrijbewijs'));
const sc=gidsen.GIDSEN['schoencadeautjes-sinterklaas'];
for(const pid of ['oc_4174002187829249','oc_4173959383220225']){
 assert.ok(!sc.keuze.some(k=>k.pid===pid));assert.ok(!sc.tabel.some(k=>k.pid===pid));assert.ok(!sc.check.regels.some(k=>k.pid===pid));
}
assert.ok(sc.keuze.some(k=>k.pid==='oc_4174004652687361'));
const scHtml=(await render('slug=schoencadeautjes-sinterklaas')).body;
assert.ok(scHtml.includes('/naar/oc_4174004652687361?g=schoencadeautjes-sinterklaas&b=tabel'));
assert.ok(!scHtml.includes('uiterlijk maandag 30 november'));assert.ok(scHtml.includes('tegenstrijdigheid'));
const kg=gidsen.GIDSEN.kerstcadeau;assert.equal(kg.bijgewerkt,'2026-11-23');
assert.ok(!JSON.stringify(kg).includes('uiterlijk woensdag 16 december'));
assert.ok((await render('slug=kerstcadeau')).body.includes('geen algemene uiterste besteldag'));
for(const g of Object.values(gidsen.GIDSEN))assert.ok(!(g.faq||[]).some(f=>f.a.includes('Je krijgt een retourlabel en het hele bedrag terug.')));
console.log('23nov: sieradenmatches/uitsluitingen, bronnen/llms, seizoensvoorraad/tabelprijs en retour-FAQ geslaagd.');
