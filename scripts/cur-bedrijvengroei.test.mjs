import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as K from '../lib/curkoppeling.js';
import * as H from '../lib/curbedrijf.js';
import * as M from '../lib/curmens.js';
import * as V from '../lib/curververs.js';
import * as UX from '../lib/curux.js';
import * as C from '../lib/cur.js';
import * as GV from '../lib/curgevonden.js';

test('exacte bronmatch bewaart filialen en wijst vreemde URL af',()=>{
 assert.equal(K.itemRef({url:'https://www.dominos.cw/'}),null);
 assert.equal(K.bedrijfsRef('https://curacao.day.evil.test/en/businesses/pizza/test'),null);
 assert.equal(K.itemRef({bronnen:['https://curacao.day/en/businesses/pizza/a','https://curacao.day/en/businesses/pizza/b']}),null);
 assert.equal(K.itemRef({bronnen:['https://curacao.day/en/businesses/pizza/a']}).key,'pizza/a');
 assert.equal(K.hoofdUrl('de',{key:'pizza/a'},new Set(['pizza/a'])),null);
 assert.equal(K.hoofdUrl('nl',{key:'pizza/a'},new Set()),null);
});
test('taalcorrectie behoudt hreflang, JSON-LD en taalmenu',()=>{
 const u='https://curacao.day/en/businesses/pizza/a';
 const h='<link rel="alternate" hreflang="en" href="'+u+'"><a href="'+u+'" hreflang="en">EN</a><script>'+JSON.stringify({url:u})+'</script><a href="'+u+'">Zaak</a>';
 const r=K.lokaleBedrijfsLinks(h,'nl');
 assert.equal((r.match(/\/en\/businesses\//g)||[]).length,3);
 assert.match(r,/<a href="https:\/\/curacao.day\/nl\/bedrijven\/pizza\/a">Zaak/);
});
test('onbekende nachttijden zijn geen etmaal, geen schema en geen gesloten claim',()=>{
 assert.deepEqual(H.urenVan('00:00-00:00'),[]);
 assert.equal(H.rooster(Object.fromEntries(H.DAGEN.map(k=>[k,'00:00-00:00']))),null);
 const r=H.rooster({mon:'09:00-18:00',tue:'00:00-00:00'});
 assert.equal(H.statusNu(r,Date.parse('2026-11-24T16:00:00Z')),null);
 assert.equal(H.ohSchema(r).length,1);
 assert.doesNotMatch(H.weekRegel('nl',r),/di|00:00/);
 const deels=H.rooster({mon:'09:00-17:00',wed:'09:00-17:00'});assert.equal(H.statusNu(deels,Date.parse('2026-11-23T22:00:00Z')),null);
});
test('bevestigd 24 uur en echte nachtdienst blijven behouden',()=>{
 const r=H.rooster({mon:'Open 24 hours'});const s=H.statusNu(r,Date.parse('2026-11-23T16:00:00Z'));
 assert.equal(H.statusTekst('nl',s),'24 uur open');
 assert.match(H.weekRegel('nl',r),/24 uur open/);
 assert.deepEqual(H.urenVan('18:00-02:00'),[[1080,1560]]);
});
test('lezersreviews uit beide contexten blijven zichtbaar zonder unieke-personenclaim',()=>{
 const r=H.samenReviews([{lijst:[{s:5,d:'2026-11-22',t:'A'}]},{lijst:[{s:3,d:'2026-11-23',t:'B'}]}]);
 assert.equal(r.n,2);assert.equal(r.gem,4);assert.equal(r.samengevoegd,true);assert.deepEqual(r.lijst.map(x=>x.t),['B','A']);
});
test('website sluit de eigen bron-URL uit',()=>{
 assert.equal(K.echteWebsite('https://curacao.day/en/businesses/pizza/a','https://pizzarroni.example/'),'https://pizzarroni.example/');
 assert.equal(K.echteWebsite('javascript:alert(1)'),null);
});
function gate({ua='Mozilla/5.0',webdriver=false,hidden=false}={}){
 let calls=0;const events={},timers=[];const d={visibilityState:hidden?'hidden':'visible',addEventListener:(n,f)=>events[n]=f};
 const context={window:{},document:d,navigator:{userAgent:ua,webdriver},setTimeout:f=>{timers.push(f);return timers.length},clearTimeout:()=>{},done:()=>calls++};
 vm.runInNewContext('('+M.bijMens.toString()+')(done)',context);
 return {context,events,timers,count:()=>calls};
}
test('bots en webdriver leveren geen meetevent; mens pas na zichtbaar of echte interactie',()=>{
 for(const x of [{ua:'Googlebot'},{ua:'ClaudeBot'},{webdriver:true}]){const g=gate(x);assert.equal(g.timers.length,0);assert.equal(g.count(),0)}
 const g=gate();assert.equal(g.count(),0);g.events.click({isTrusted:false});assert.equal(g.count(),0);g.events.click({isTrusted:true});assert.equal(g.count(),1);g.timers[0]();assert.equal(g.count(),1);
 const h=gate({hidden:true});assert.equal(h.timers.length,0);h.context.document.visibilityState='visible';h.events.visibilitychange();h.timers[0]();assert.equal(h.count(),1);
});
test('bronrefresh merkt wijziging binnen dezelfde omvang; gelijke bron houdt datum en slug',()=>{
 const x={place_id:'a',naam:'A',tel:'123',uren:{mon:'09:00-17:00'},slug:'vaste-slug',gewijzigd:'2026-10-22'};
 const f=v=>v.toLowerCase();
 const a=V.verversCategorie([{...x}], [x], '2026-11-23','2026-10-22',f);assert.equal(a.gewijzigd,0);assert.equal(a.items[0].gewijzigd,'2026-10-22');assert.equal(a.items[0].slug,'vaste-slug');
 const b=V.verversCategorie([{...x,tel:'456'}],[x],'2026-11-23','2026-10-22',f);assert.equal(b.gewijzigd,1);assert.equal(b.items[0].gewijzigd,'2026-11-23');
 assert.equal(V.magVerversen({n:13},{n:13,at:Date.now()-24*3600e3},Date.now(),false),true);
 assert.equal(V.magVerversen({n:13},{n:13,at:Date.now()},Date.now(),false),false);
});
const pizza=JSON.parse(fs.readFileSync(new URL('../data/cur/pizza.json',import.meta.url)));
const pv=pizza.items.find(x=>x.id==='pizzarroni');
const bedrijf={naam:pv.naam,slug:pv.id,tel:'+59998430870',adres:'158 Oude Caracasbaaiweg',score:4.8,aantal:374,plaats:'Willemstad',uren:{mon:'11:00-22:00'},lat:12.1,lng:-68.9};
const I={at:'2026-10-22T00:00:00Z',totaal:3,cats:{'pizza-restaurant':{n:3,en:'Pizza restaurants',t_nl:'Pizzeria’s',t_en:'Pizza restaurants'}}};
globalThis.__CUR_FIXTURES={'cw/gids/index.json':I,'cw/gids/namen.json':[[pv.naam,'pizza-restaurant',pv.id,'Willemstad',4.8,374]]};
test('echte productie-renderer voegt bronnen en feiten toe zonder rating-schema van derden',async()=>{
 const h=C.renderGidsBedrijf('nl',I,'pizza-restaurant',[bedrijf],bedrijf);
 assert.match(h,/In het kort/);assert.match(h,/Basisvolgorde/);assert.match(h,/vegan/);assert.match(h,/Tripadvisor/);assert.match(h,/href="https:\/\/curacao.day\/nl\/pizza"/);
 assert.match(h,/hreflang="en" href="https:\/\/curacao.day\/en\/businesses\/pizza-restaurant\/pizzarroni"/);
 const data=[...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(x=>JSON.parse(x[1]));
 assert.equal(JSON.stringify(data).includes('aggregateRating'),false);
 assert.match(h,/"dateModified":"2026-11-23"/);
 assert.ok(!h.includes('href="https://curacao.day/nl/bedrijven/pizza-restaurant/pizzarroni">Vergelijk in onze keuzehulp'));
 fs.mkdirSync(new URL('../../ux-checks/bedrijf-preview/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('../../ux-checks/bedrijf-preview/pizzarroni.html',import.meta.url),h);
});
test('canonical resolveert pas na bestaande doelcontrole en kaarten wijzen dan naar dezelfde zaak',async()=>{
 const stand=await C.bedrijfGroeiStand();assert.equal(stand.gekoppeldeZaken,1);
 const o=C.ONDERWERPEN.find(o=>o.id==='pizza');
 const h=C.renderBedrijf('nl',o,pizza,pv,null,null);
 assert.match(h,/<link rel="canonical" href="https:\/\/curacao.day\/nl\/bedrijven\/pizza-restaurant\/pizzarroni"/);
 assert.doesNotMatch(h,/<a[^>]+href="https:\/\/curacao.day\/en\/businesses[^>]+>Website/);
 assert.equal(C.alleCurUrls().some(u=>/\/pizza\/pizzarroni$/.test(u)),false);
 const sm=await C.gidsSitemap('nl');assert.match(sm,/\/nl\/bedrijven\/pizza-restaurant\/pizzarroni<\/loc><lastmod>2026-11-23/);
});
test('categorie met keuzehulp behoudt eigen alle-zaken zoekvraag',()=>{
 const h=C.renderGidsCat('nl',I,'pizza-restaurant',[bedrijf,{...bedrijf,naam:'B',slug:'b'},{...bedrijf,naam:'C',slug:'c'}]);
 assert.match(h,/<h1>[^<]*alle 3/);assert.doesNotMatch(h,/<h1>De beste/);assert.match(h,/https:\/\/curacao.day\/nl\/pizza/);
});
test('uitgeleverde meet-, verwijzer- en live-uren scripts compileren',()=>{
 new vm.Script(C.meetJs('nl','gids'));new vm.Script(UX.uxJs('https://keuzehulp.best'));
 new vm.Script(GV.verwijzerJs('pizzarroni').replace(/^<script>|<\/script>$/g,''));
 const h=C.renderGidsBedrijf('nl',I,'pizza-restaurant',[bedrijf],bedrijf);
 for(const m of h.matchAll(/<script(?![^>]*type=)[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
});
