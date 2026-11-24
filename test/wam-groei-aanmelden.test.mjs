import test from 'node:test';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { aanmelden, afmelden, lokaleDag, VOLG_JS } from '../lib/wam-aanmelden.js';
import { kanaal, vatBezoekenSamen } from '../lib/wam-groei.js';
import { pagina, handel } from '../lib/wam-dossier.js';
import { PRAKTISCHE_HULP } from '../lib/wam-hulp.js';
import { schemaVoorPagina } from '../lib/wam-vindbaarheid.js';
const t = Date.parse('2026-11-23T12:00:00Z'), fp = 'a'.repeat(16);
const view = (vid, n=0, x={}) => ({ ty: 'p', vid, fp, t: t+n, pg: 'wearemany.now/', ref: 'https://www.google.nl/search?q=opzeggen', net: 'onbekend', camp: '-', c: { wd: 0 }, ...x });
test('Clickmind-beacons en interne vervolgstappen vormen één bezoek met het oorspronkelijke kanaal', () => {
  const r=vatBezoekenSamen([view('a'),view('a',1000,{f:'b',mens:1}),view('b',60000,{ref:'https://wearemany.now/'}),view('c',32*60000,{ref:'https://chatgpt.com/'})], '2026-11-23');
  assert.equal(r.bezoeken,2); assert.equal(r.paginaWeergaven,3); assert.equal(r.perKanaal.organisch,1); assert.equal(r.mensBevestigd.organisch,1); assert.equal(r.perKanaal.ai,1);
});
test('bots tellen niet voor de noordster; trackingcode alleen bewijst geen betaalde klik', () => {
  const r=vatBezoekenSamen([view('a',0,{c:{wd:1}}),view('b',0,{net:'tiktok',fp:'b'.repeat(16)}),view('c',0,{fp:'c'.repeat(16),c:{wd:'0',mmc:'a'.repeat(12)}})],'2026-11-23');
  assert.equal(r.botWeergaven,1); assert.equal(r.bezoeken,2); assert.equal(r.perKanaal.betaald,1); assert.equal(r.perKanaal.organisch,1);
  assert.equal(kanaal(view('d',0,{camp:'onbekende-campagne'})),'campagneOnbekend');
  assert.equal(kanaal(view('d',0,{ref:'https://google.evil.com/'})),'verwijzing');
  assert.equal(kanaal(view('d',0,{net:'google-ads'})),'betaald');
  assert.equal(kanaal(view('d',0,{net:'bing-ads',ref:'https://www.bing.com/'})),'betaald');
});
test('Curaçaose dagen beginnen om 04:00 UTC; een doorlopend bezoek over middernacht telt niet opnieuw', () => {
  assert.equal(lokaleDag(Date.parse('2026-11-24T03:59:00Z')),'2026-11-23');
  const b=Date.parse('2026-11-24T04:00:00Z');
  const r=vatBezoekenSamen([view('a',0,{t:b-60000}),view('b',0,{t:b+60000,ref:'https://wearemany.now/'})],'2026-11-24');
  assert.equal(r.bezoeken,0); assert.equal(r.paginaWeergaven,1);
});
test('geen aanmelding zonder toestemming of met een onbekend dossier; dubbel is geen nieuwe conversie',async()=>{
  const db={incr:async()=>1,raw:async a=>a[0]==='EVAL'?1:1};
  const b={email:'lezer@example.invalid',scope:'blendle',toestemming:true};
  const geenDb={incr:async()=>{throw Error('mag niet opslaan')}};
  assert.equal((await aanmelden({...b,toestemming:false},'ip',geenDb)).ok,false);
  assert.equal((await aanmelden({...b,scope:'__proto__'},'ip',geenDb)).ok,false);
  const r=await aanmelden(b,'ip',db); assert.ok(r.ok&&r.nieuw&&r.tok); assert.ok(!JSON.stringify(r).includes(b.email));
  const oud=await aanmelden(b,'ip',{...db,raw:async()=>0}); assert.ok(oud.ok&&!oud.nieuw&&!oud.tok);
  assert.equal((await afmelden({id:r.id,tok:'0'.repeat(40)},{get:async()=>({bewijs:'a'.repeat(64)})})).ok,false);
});
test('publieke formulieren hebben één inhoudsveld en zichtbare publicatietoestemming; wissen blijft besloten',async()=>{
  const h=pagina('bedrijven',true);
  assert.equal((h.match(/name="tekst"/g)||[]).length,10); assert.ok(!h.includes('type="radio"')&&!h.includes('name="akkoord"'));
  assert.ok(h.includes('anonieme publicatie na controle')&&h.includes('data-site="wmn" data-modal="wmn" data-meet="all" defer'));
  assert.ok(pagina('afmelden',true).includes('noindex'));
  const res={setHeader(){},status(n){this.code=n;return this},end(){},send(){},json(j){this.body=j;return this}};
  await handel('daanmelden',{method:'POST',headers:{host:'wearemany.now',origin:'https://extern.invalid'}},res,{beschermd:false});assert.equal(res.code,403);
  await handel('dgroei',{method:'GET',headers:{}},res,{beschermd:false});assert.equal(res.code,404);
});
test('de concrete Videoland-antwoorden staan in de zichtbare pagina én het FAQ-schema',()=>{
  const h=pagina('bedrijven/videoland',true),faq=schemaVoorPagina('/bedrijven/videoland','Videoland','')['@graph'].find(x=>x['@type']==='FAQPage');
  assert.equal(faq.mainEntity.length,3);
  for(const q of PRAKTISCHE_HULP.videoland.vragen)assert.ok(h.includes(q.vraag)&&h.includes(q.antwoord));
});

test('een snelle succesvolle actie wacht op het eerste mensmeterbeacon voordat het profiel wordt bevestigd',async()=>{
  const later=[],calls=[];let n=0;
  const c={window:{mensmeter:{vid:'a'.repeat(16)},mmUitkomst:()=>{}},document:{querySelector:()=>null,querySelectorAll:()=>[]},setTimeout:f=>later.push(f),fetch:async(url,o)=>{calls.push(JSON.parse(o.body));return {json:async()=>++n===1?{ok:false,fout:'onbekend bezoek'}:{ok:true}}}};
  vm.runInNewContext(VOLG_JS,c);c.window.wamMeetActie();await new Promise(r=>setImmediate(r));
  assert.equal(later.length,1);later.shift()();await new Promise(r=>setImmediate(r));
  assert.equal(calls.length,2);assert.equal(calls[1].antwoord,true);assert.equal(later.length,0);
});
