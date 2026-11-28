// Test van de ingang lib/sealed-gw.js zonder Redis en zonder echte AI: node scripts/test-sealed-gw.mjs
import { gwStap, gwStand, gwPagina, gwStatusPagina, gwKaart, gwTrek, openPills, leesJson } from '../lib/sealed-gw.js';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const mem = new Map(), H = new Map(), L = new Map();
const kv = {
  get: async k => mem.has(k) ? JSON.parse(mem.get(k)) : null,
  set: async (k, v) => { mem.set(k, JSON.stringify(v)); },
  mget: async (...ks) => ks.map(k => mem.has(k) ? JSON.parse(mem.get(k)) : null),
  del: async ks => { ks.forEach(k => mem.delete(k)); return ks.length; },
  raw: async a => {
    const [c, k, ...r] = a;
    if (c === 'HINCRBY') { const h = H.get(k) || new Map(); h.set(r[0], (h.get(r[0]) || 0) + Number(r[1])); H.set(k, h); return h.get(r[0]); }
    if (c === 'HGETALL') { const h = H.get(k) || new Map(); return [...h].flatMap(([f, v]) => [f, String(v)]); }
    if (c === 'LPUSH') { const l = L.get(k) || []; l.unshift(r[0]); L.set(k, l); return l.length; }
    if (c === 'LTRIM') return 'OK';
    if (c === 'LRANGE') return (L.get(k) || []).slice(Number(r[0]), Number(r[1]) + 1);
    if (c === 'EXPIRE') return 1;
    if (c === 'INCR') { const v = (Number(mem.get(k)) || 0) + 1; mem.set(k, String(v)); return v; }
    return null;
  }
};
let fout = 0; const ok = (c, m) => { if (!c) { fout++; console.log('FOUT:', m); } else console.log('ok:', m); };

// nep-AI: twee vragen, dan klaar
let beurt = 0;
const ai = async () => { beurt++; const klaar = beurt >= 3;
  return { txt: 'Hier is het: ' + JSON.stringify({ zeg: 'Fulfilment wordt meestal per order geprijsd. Mail me op jan@voorbeeld.nl of bel 0612345678', vraag: klaar ? '' : beurt === 1 ? 'Wat moet de partner kunnen?' : 'Wanneer wil je starten?', veld: beurt === 1 ? 'eisen' : 'termijn', sleutel: beurt === 1 ? 'eisen' : 'termijn', pills: klaar ? [] : beurt === 1 ? ['Dezelfde dag verzenden', 'Retouren', 'Bijzondere producten'] : ['Binnen zes weken', 'Later', 'Weet ik nog niet'], meer: false, klaar,
    feiten: [{veld:'onderwerp',bewijs:'fulfilmentpartner'}, {veld:'doel',bewijs:'verzending uitbesteden'}, {veld:'omvang',bewijs:'1.500 orders per maand'}, {veld:'regio',bewijs:'Zuid-Holland'}],
    kaart: { richting: 'zoekt', soort: 'fulfilment', titel: 'Webshop zoekt fulfilmentpartner', zoekt: 'Fulfilmentpartner', biedt: '1.500 orders per maand', waar: 'Zuid-Holland', wanneer: 'Binnen 6 weken', budget: '', mits: 'Opslag in Zuid-Holland', niet: 'Zelfde dag verzenden', partijen: [], waarde: 'middel' } }) }; };
const req = { headers: { 'x-vercel-ip-city': 'Gouda', 'x-vercel-ip-country': 'NL' } };
const meldingen = []; const meld = async t => meldingen.push(t);

ok(leesJson('x {"a":1} y').a === 1, 'JSON uit tekst halen');
let r = await gwStap(kv, { taal: 'nl', keuze: ['Iets inkopen of inhuren'], tekst: 'Ik zoek een fulfilmentpartner voor 1.500 orders per maand in Zuid-Holland. Ik wil de verzending uitbesteden.', open: ['Iets inkopen of inhuren', 'Klanten of opdrachten'] }, req, { ai, meld });
ok(r.ok && /^[a-f0-9]{24}$/.test(r.sid) && r.vraag && r.pills.length === 3, 'eerste beurt geeft vraag en pills');
ok(!/jan@voorbeeld|0612345678/.test(r.zeg), 'contactgegevens uit het antwoord gehaald');
const sid = r.sid;
r = await gwStap(kv, { sid, taal: 'nl', keuze: ['Dezelfde dag verzenden'] }, req, { ai, meld });
ok(r.ok && r.vraag, 'tweede beurt');
r = await gwStap(kv, { sid, taal: 'nl', tekst: 'Liefst voor 15:00 dezelfde dag weg' }, req, { ai, meld });
ok(r.klaar && r.kaart.soort === 'fulfilment' && r.borg === 75, 'derde beurt: kaart klaar, borg middel = 75');
const leer = await kv.raw(['HGETALL', 'gw:leer:fulfilment']);
ok(leer.includes('eisen: Dezelfde dag verzenden'), 'antwoord geleerd per soort en vraag');
ok(!(await gwStap(kv, {sid,actie:'kies',keuze:'uitzetten'}, req)).ok, 'vóór kaartcontrole niet uitzetten');
ok((await gwStap(kv, {sid,actie:'controle'}, req)).ok, 'kaart expliciet bevestigd');
r = await gwStap(kv, { sid, taal: 'nl', actie: 'kies', keuze: 'uitzetten', mail: 'koper@webshop.nl' }, req, { meld });
ok(r.ok && /^\/nl\/k\?i=[a-f0-9]{16}&s=[a-f0-9]{24}$/.test(r.link), 'kaart bewaard met statuslink');
const [, i, s] = r.link.match(/i=([a-f0-9]+)&s=([a-f0-9]+)/);
const rec = await gwKaart(kv, i, s);
ok(rec && rec.status === 'uitgezet' && rec.borg === 75 && rec.plaats === 'Gouda, NL', 'kaart leesbaar met sleutel');
ok(!(await gwKaart(kv, i, 'fout')), 'kaart niet leesbaar zonder juiste sleutel');
ok(meldingen.length === 1 && !/koper@webshop/.test(meldingen[0]), 'melding naar Henkjan zonder mailadres');

// aanbodkaart in het netwerk die past
beurt = 0;
const ai2 = async () => ({ txt: JSON.stringify({ zeg: 'Duidelijk.', vraag: '', pills: [], klaar: true, feiten:[{veld:'onderwerp',bewijs:'fulfilmentpartner voor webshops'},{veld:'doel',bewijs:'Ik zoek klanten'},{veld:'regio',bewijs:'Zuid-Holland'},{veld:'omvang',bewijs:'1.500 orders per maand'},{veld:'eisen',bewijs:'Dezelfde dag verzenden'}], kaart: { richting: 'heeft', soort: 'fulfilment', titel: 'Fulfilmentbedrijf heeft ruimte', biedt: 'Fulfilmentpartner voor webshops, opslag in Zuid-Holland', waarde: 'middel' } }) });
let r2 = await gwStap(kv, { taal: 'nl', keuze: ['Klanten of opdrachten'], tekst:'Ik ben fulfilmentpartner voor webshops in Zuid-Holland. Ik zoek klanten voor 1.500 orders per maand. Dezelfde dag verzenden is mogelijk.' }, req, { ai: ai2, meld });
ok(r2.klaar && r2.borg === 0, 'aanbodkant: geen borg');
ok((await gwStap(kv, {sid:r2.sid,actie:'controle'}, req)).ok,'aanbodkaart bevestigd');
r2 = await gwStap(kv, { sid: r2.sid, taal: 'nl', actie: 'kies', keuze: 'staan' }, req, { meld });
ok(r2.ok && r2.netwerk === 1, 'aanbod vindt de vraag in het netwerk');
ok((await gwKaart(kv, i, s)).netwerk.length === 1, 'de vraag ziet het aanbod ook');

// reserve zonder AI
const r3 = await gwStap(kv, { taal: 'en', keuze: ['Customers or work'] }, req, { ai: async () => { throw new Error('weg'); }, meld });
ok(r3.ok && !r3.ai && r3.vraag && r3.pills.length, 'zonder AI loopt de chat door met een reservevraag');
{ const weg = async () => { const e = new Error('credit op'); e.status = 402; throw e; };
  let x = await gwStap(kv, { taal: 'nl', keuze: ['Iets inkopen of inhuren'] }, req, { ai: weg }), n = 1;
  x = await gwStap(kv, { sid: x.sid, taal: 'nl', tekst: 'Fulfilment voor 1500 orders per maand' }, req, { ai: weg }); n++;
  const vragen = new Set();
  while (!x.klaar && n < 10) { vragen.add(x.vraag); x = await gwStap(kv, { sid: x.sid, taal: 'nl', keuze: [x.pills[0]] }, req, { ai: weg }); n++; }
  ok(x.klaar && n <= 6 && vragen.size === n - 2, 'zonder AI: geen herhaalde vraag en concept binnen 6 beurten');
  ok(/Fulfilment/.test(x.kaart.zoekt) && x.kaart.mits, 'zonder AI: expliciete antwoorden blijven op het concept');
  ok(!(await gwStap(kv,{sid:x.sid,actie:'kies',keuze:'uitzetten'},req)).ok,'reserveconcept gaat niet automatisch naar partijen');
  ok(/402 credit op/.test(String((await kv.get('gw:aifout') || {}).fout)), 'zonder AI: de reden staat in gw:aifout'); }

const st = await gwStand(kv);
ok(st.trechter7d.start === 4 && st.trechter7d.uitzet === 1 && st.kaarten.length === 2, 'stand: trechter en kaarten');
ok(await gwTrek(kv, i, s) && (await gwKaart(kv, i, s)).status === 'ingetrokken', 'intrekken');

// pagina's: script moet geldig zijn
const dir = mkdtempSync(join(tmpdir(), 'gw-'));
for (const taal of ['nl', 'en', 'de']) {
  const html = gwPagina(taal, { geo: { stad: 'Gouda', land: 'NL' }, open: await openPills(kv, taal) });
  const js = (html.match(/<script>([\s\S]*?)<\/script>/) || [])[1] || '';
  const f = join(dir, taal + '.js'); writeFileSync(f, js);
  let geldig = true; try { execFileSync(process.execPath, ['--check', f]); } catch (e) { geldig = false; console.log(String(e.stderr || e)); }
  ok(geldig && html.includes('Gouda'), 'pagina ' + taal + ': script geldig en plaats getoond');
  writeFileSync(join(dir, taal + '.html'), html);
}
const sp = gwStatusPagina('nl', await gwKaart(kv, i, s));
ok(/Ingetrokken/.test(sp), 'statuspagina toont stand');
ok(/klopt niet/.test(gwStatusPagina('nl', null)), 'statuspagina zonder kaart');
console.log('html in', dir);
console.log(fout ? fout + ' FOUT(EN)' : 'ALLES OK');
process.exit(fout ? 1 : 0);

