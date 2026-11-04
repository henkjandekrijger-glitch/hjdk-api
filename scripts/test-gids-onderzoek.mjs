import test from 'node:test';
import assert from 'node:assert/strict';
import { ONDERZOEK, BRONNEN, onderzoekVoor, onderzoekPagina, adviesBlok, dekking } from '../lib/gids-onderzoek.js';
import { bronVan, bronScript, eventsPerDag, vergelijkDagen, groeiRonde } from '../lib/gids-groei.js';
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
