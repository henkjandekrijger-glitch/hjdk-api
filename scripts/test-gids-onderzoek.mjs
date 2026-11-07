import test from 'node:test';
import assert from 'node:assert/strict';
import { ONDERZOEK, BRONNEN, onderzoekVoor, onderzoekPagina, adviesBlok, dekking } from '../lib/gids-onderzoek.js';
import { bronVan, bronScript, eventsPerDag, vergelijkDagen, groeiRonde, googleRijen } from '../lib/gids-groei.js';
test('categorieadvies maakt geen producttest van materiaalbewijs',()=>{
  assert.equal(onderzoekVoor({t:'Kunstmatige Phalaenopsis Orchidee'}).some(p=>p.id==='kamerplanten-luchtzuivering'),false);
  assert.equal(onderzoekVoor({t:'Sierpot voor orchidee'}).some(p=>p.id==='kamerplanten-luchtzuivering'),false);
  assert.equal(onderzoekVoor({t:'Bamboe haarborstel'}).some(p=>p.id==='bamboe-textiel-claims'),false);
  assert.equal(onderzoekVoor({t:'Bamboe sokken heren'}).some(p=>p.id==='bamboe-textiel-claims'),true);
  assert.equal(onderzoekVoor({t:'Opblaasbare slaapbank'}).length,0);
  assert.equal(dekking([{t:'Bamboe sokken',vr:false},{t:'Bloempot wit',vr:true}]).totaal,1);
  assert.equal(dekking([{t:'Bloempot wit'}]).exactModelGetest,0);
});
test('HTML bevat bron, beperking, financiering en ontsnapt catalogustekst',()=>{
  for(const p of ONDERZOEK)for(const b of p.bronnen)assert.ok(BRONNEN[b]?.url.startsWith('https://'));
  const p=ONDERZOEK.find(p=>p.id==='houten-puzzels-bewijs');
  const h=onderzoekPagina(p,[{id:'oc_1',t:'3D houten puzzel <script>x</script>',b:'Maker & Co',p:10,vr:true}],()=> '€10,00',()=> 'morgen');
  assert.ok(h.includes('Ravensburger'));assert.ok(h.includes('geen 3D'));assert.ok(h.includes('&lt;script&gt;'));
  assert.ok(h.includes('id="p-oc_1"'));assert.ok(h.includes('geen van de onderstaande modellen zelf getest'));
  assert.ok(adviesBlok([{t:'Bamboe sokken'}]).includes('geen onafhankelijke test'));
});
test('AI-hosts komen vóór Google en misleidende referrers tellen niet als Google',()=>{
  for(const [url,bron] of [['https://gemini.google.com/app','gemini'],['https://www.google.nl/search','google'],['https://google.com.evil.example/','overig'],['https://example.com/?q=google.nl','overig'],['https://chatgpt.com/','chatgpt']]){
    assert.equal(bronVan(url),bron);assert.equal(new Function(bronScript+';return gidsBron;')()(url),bron);
  }
});
test('referrer-events en bots zijn verschillende tellers',()=>{
  assert.deepEqual(eventsPerDag({'home|v-google':2,'home|v-gemini':3,'_bot|googlebot|home':100,'home|t15':5}),{zoek:2,ai:3,perPagina:{home:{zoek:2,ai:3,overig:0}}});
});
test('weekvergelijking vraagt volle, niet-overlappende kalenderweken',()=>{
  assert.equal(vergelijkDagen([]).status,'te-weinig-data');
  const rows=Array.from({length:14},(_,i)=>({dag:'2026-10-'+String(i+1).padStart(2,'0'),clicks:i<7?0:2}));
  const r=vergelijkDagen(rows);assert.equal(r.voor,0);assert.equal(r.na,14);assert.equal(r.procent,null);assert.equal(r.status,'beschrijvend');
  rows[5].dag='2026-09-01';assert.equal(vergelijkDagen(rows).status,'te-weinig-data');
});
test('dagronde is idempotent en overschrijft geen succesvolle snapshot',async()=>{
  const current={dag:new Date().toISOString().slice(0,10),google:{status:'gemeten'}};let writes=0;
  const kv={get:async()=>current,set:async()=>writes++};assert.equal(await groeiRonde(kv,[]),current);assert.equal(writes,0);
});
test('nieuwe keukenproducten matchen inhoudelijk; accessoires en speelgoed niet',()=>{
 const heeft=t=>onderzoekVoor({t}).some(p=>p.id==='servies-gebruik');
 for(const t of ['Glazen Mokken 350ml','Witte Porseleinen Serveerplaat 22cm','Paarse Houten Saladebestek 33cm','Wicker Charger Plates met schelpen'])assert.ok(heeft(t),t);
 for(const t of ['Mokkenrek','Bestekhouder','Poppenservies speelgoed','Servieskast','Rustiek Stalen Decoratief Bestekset voor Keukenraam'])assert.equal(heeft(t),false,t);
 assert.ok(onderzoekVoor({t:'Waxinelichthouders Set van 2'}).some(p=>p.id==='kaarsen-gebruik'));
 const p=ONDERZOEK.find(p=>p.id==='servies-gebruik');
 const html=onderzoekPagina(p,[{id:'oc_4174004874297346',t:'Paarse Houten Saladebestek 33cm'}],()=> '€40,94',()=> 'later');
 assert.ok(html.includes('Materiaal is tegenstrijdig'));assert.ok(html.includes('2026-10-16'));assert.ok(html.includes('2026-11-06'));assert.ok(html.includes('glas-en-vorksymbool geen afkeuring'));
});

test('nieuwe planten­kolom krijgt passende drainagecheck en controleerbare winkelgegevens',()=>{
 const heeft=t=>onderzoekVoor({t}).some(p=>p.id==='bloempot-afvoergat');
 assert.equal(heeft('Hoge Cortenstaal Plantenkolom met Grote Schaal van Rostikal'),true);
 assert.equal(heeft('Houten plantenstandaard voor binnen'),false);
 const p=ONDERZOEK.find(p=>p.id==='bloempot-afvoergat');
 const html=onderzoekPagina(p,[{id:'oc_4174003686408193',t:'Hoge Cortenstaal Plantenkolom met Grote Schaal van Rostikal',b:'Rostikal',p:140.59,vr:true}],()=> '€140,59',()=> 'later');
 assert.ok(html.includes('Afvoermaterialen zijn volgens de winkel niet inbegrepen'));
 assert.ok(html.includes('gecontroleerd 7 november 2026'));
 assert.ok(html.includes('geen eigen producttest'));
});

test('lege GSC-respons is onbekend; geen fictieve 56 nul-dagen',()=>{
 assert.deepEqual(googleRijen([], '2026-11-03'),[]);
 const d=googleRijen([{keys:['2026-11-01'],impressions:4,clicks:1,ctr:.25,position:7}], '2026-11-03');
 assert.equal(d.length,3);assert.equal(d[0].imp,4);assert.equal(vergelijkDagen(d).status,'te-weinig-data');
});
