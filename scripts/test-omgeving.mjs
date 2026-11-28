// test lib/omgeving.js zonder netwerk: node scripts/test-omgeving.mjs
import * as O from '../lib/omgeving.js';
import * as T from '../lib/koopkracht-tabel.js';
import { LABEL } from '../lib/voorspel.js';

let ok = 0, fout = 0;
const ja = (c, t) => { if (c) { ok++; console.log('ok   ' + t); } else { fout++; console.log('FOUT ' + t); } };

function nepKv() {
  const m = new Map(), h = new Map(), ttl = new Map();
  const raw = async ([cmd, k, ...a]) => {
    if (cmd === 'GET') return m.has(k) ? m.get(k) : null;
    if (cmd === 'SET') { if (a.includes('NX') && m.has(k)) return null; m.set(k, a[0]); const i = a.indexOf('EX'); if (i >= 0) ttl.set(k, a[i + 1]); return 'OK'; }
    if (cmd === 'INCR') { const n = (Number(m.get(k)) || 0) + 1; m.set(k, String(n)); return n; }
    if (cmd === 'EXPIRE') { ttl.set(k, a[0]); return 1; }
    if (cmd === 'TTL') return ttl.get(k) || -1;
    if (cmd === 'HINCRBY') { const o = h.get(k) || {}; o[a[0]] = (Number(o[a[0]]) || 0) + a[1]; h.set(k, o); return o[a[0]]; }
    if (cmd === 'HSET') { const o = h.get(k) || {}; for (let i = 0; i < a.length; i += 2) o[a[i]] = String(a[i + 1]); h.set(k, o); return 1; }
    if (cmd === 'HSETNX') { const o = h.get(k) || {}; if (a[0] in o) return 0; o[a[0]] = String(a[1]); h.set(k, o); return 1; }
    if (cmd === 'HGET') return (h.get(k) || {})[a[0]] ?? null;
    if (cmd === 'HGETALL') return Object.entries(h.get(k) || {}).flat().map(String);
    return null;
  };
  return { m, h, ttl, raw };
}
const tel = (kv, dag) => Object.fromEntries(Object.entries(kv.h.get('mm:vs:' + dag) || {}));
const t = s => Date.parse(s);

// daglicht
ja(O.daglicht(52.37, 4.9, t('2026-06-21T12:00:00Z')) === 'licht', 'daglicht: Amsterdam 21 juni 12:00 UTC licht');
ja(O.daglicht(52.37, 4.9, t('2026-12-21T23:00:00Z')) === 'donker', 'daglicht: Amsterdam 21 dec 23:00 UTC donker');
ja(O.daglicht(52.37, 4.9, t('2026-06-21T20:30:00Z')) === 'schemer', 'daglicht: Amsterdam 21 juni 20:30 UTC schemer (zon net onder)');
ja(O.daglicht(40.71, -74.0, t('2026-06-21T14:00:00Z')) === 'licht' && O.daglicht(40.71, -74.0, t('2026-06-21T06:00:00Z')) === 'donker', 'daglicht: New York 10:00 lokaal licht, 02:00 lokaal donker');
ja(O.daglicht('x', 4, 1) === '' && O.daglicht(91, 0, 1) === '', 'daglicht: ongeldige plek geeft leeg');

// koopkracht
ja(T.US.length === 100000 && T.NL === '', 'tabel: US 100000 tekens, NL niet in het bestand (komt uit Redis, lib/kknl.js)');
ja(O.koopkracht('US', '90210', T) === '5 hoogste 20%' && O.koopkracht('us', '48201-1234', T) === '1 laagste 20%', 'koopkracht: 90210 hoogste, 48201 laagste (met ZIP+4)');
ja(O.koopkracht('us', '00501', T) === '' && O.koopkracht('us', 'abc', T) === '' && O.koopkracht('de', '10115', T) === '', 'koopkracht: onbekend, onleesbaar of ander land is leeg');
ja(O.koopkracht('nl', '1011 AB', T) === '', 'koopkracht: NL zonder tabel is leeg');
ja(O.koopkracht('nl', '1011AB', { NL: '0'.repeat(11) + '3' + '0'.repeat(8988) }) === '3 midden', 'koopkracht: NL gebruikt pc4 min 1000 als index');
ja(Object.keys(T.BRON).join() === 'us,nl' && /uszipcode/.test(T.BRON.us.bron), 'tabel: bron vermeld');

// weer: beide bronnen
const metno = { properties: { timeseries: [{ data: { instant: { details: { air_temperature: 14.2 } }, next_1_hours: { summary: { symbol_code: 'lightrainshowers_night' } } } }] } };
ja(JSON.stringify(O.weerMetno(metno)) === '{"weer":"regen","temp":"10-19"}', 'metno: lichte regenbui, 14 graden');
const m6 = { properties: { timeseries: [{ data: { instant: { details: { air_temperature: -3 } }, next_6_hours: { summary: { symbol_code: 'heavysnow' } } } }] } };
ja(O.weerMetno(m6).weer === 'sneeuw' && O.weerMetno(m6).temp === 'onder 0', 'metno: terugval op next_6_hours, sneeuw onder 0');
const sym = c => O.weerMetno({ properties: { timeseries: [{ data: { instant: { details: { air_temperature: 31 } }, next_1_hours: { summary: { symbol_code: c } } } }] } });
ja(['clearsky_day:helder', 'fair_night:helder', 'partlycloudy_day:half bewolkt', 'cloudy:bewolkt', 'fog:mist', 'rainandthunder:onweer', 'sleet:sneeuw', 'rain:regen'].every(x => sym(x.split(':')[0]).weer === x.split(':')[1]) && sym('cloudy').temp === '30+', 'metno: alle symboolgroepen');
ja(O.weerMetno({}) === null && O.weerMetno({ properties: { timeseries: [{ data: { instant: { details: {} } } }] } }) === null, 'metno: leeg of kapot geeft null');
ja(JSON.stringify(O.weerOpenMeteo({ current: { temperature_2m: 25.5, weather_code: 61 } })) === '{"weer":"regen","temp":"20-29"}', 'open-meteo: WMO 61 is regen');
ja([[0, 'helder'], [2, 'half bewolkt'], [3, 'bewolkt'], [45, 'mist'], [73, 'sneeuw'], [81, 'regen'], [96, 'onweer']].every(([k, w]) => O.weerOpenMeteo({ current: { temperature_2m: 5, weather_code: k } }).weer === w), 'open-meteo: WMO-groepen');

// weer ophalen: url, header, cache, dagmax, pauze
const plek = { lat: 52.3731, lon: 4.8922, land: 'nl', regio: 'nh', stad: 'Amsterdam', t: t('2026-11-28T10:20:00Z') };
let urls = [], kop = null;
const nepFetch = async (u, o) => { urls.push(u); kop = o.headers; return { ok: true, status: 200, json: async () => metno }; };
const kv = nepKv();
const w1 = await O.weer(kv, plek, { fetchFn: nepFetch });
ja(w1 && w1.weer === 'regen' && /locationforecast\/2\.0\/compact\?lat=52\.37&lon=4\.89$/.test(urls[0]) && /hjdk-clickmind/.test(kop['user-agent']), 'weer: metno-url met herkenbare User-Agent en coordinaten op 2 decimalen');
ja([...kv.m.keys()].some(k => k === 'mm:weer:nl|nh|amsterdam') && kv.ttl.get('mm:weer:nl|nh|amsterdam') === 3600 && !/52\.37|4\.89/.test([...kv.m.keys()].join()), 'weer: sleutel per stad, een uur bewaard, zonder coordinaten');
const w2 = await O.weer(kv, Object.assign({}, plek, { lat: 52.4, lon: 4.9, t: t('2026-11-28T10:50:00Z') }), { fetchFn: nepFetch });
ja(w2 && w2.temp === '10-19' && urls.length === 1 && kv.h.get('mm:omg:2026-11-28').wcache === 1, 'weer: zelfde stad binnen het uur komt uit het geheugen (geen tweede opvraag)');
await O.weer(kv, Object.assign({}, plek, { t: t('2026-11-28T11:05:00Z') }), { fetchFn: nepFetch });
ja(urls.length === 1, 'weer: vlak na het hele uur geen nieuwe opvraag (Expires-regel van MET Norway)');
kv.m.delete('mm:weer:nl|nh|amsterdam'); kv.m.delete('mm:weer:nl|nh|amsterdam:slot'); // een uur later: het geheugen is verlopen
await O.weer(kv, Object.assign({}, plek, { t: t('2026-11-28T11:25:00Z') }), { fetchFn: nepFetch });
ja(urls.length === 2, 'weer: na een uur een nieuwe opvraag');
const zonder = await O.weer(nepKv(), { lat: 52.04, lon: 4.97, t: plek.t }, { fetchFn: nepFetch });
ja(zonder && urls.length === 3, 'weer: zonder stad werkt op een raster');
const kvr = nepKv(); await O.weer(kvr, { lat: 52.04, lon: 4.97, t: plek.t }, { fetchFn: nepFetch });
ja([...kvr.m.keys()].some(k => k === 'mm:weer:ll52,5'), 'weer: zonder stad een raster van 0,5 graad in de sleutel');
// open-meteo als andere bron
O.WEER.bron = 'openmeteo';
let omU = null; const kvo = nepKv();
const wo = await O.weer(kvo, plek, { fetchFn: async u => { omU = u; return { ok: true, json: async () => ({ current: { temperature_2m: 3, weather_code: 3 } }) }; } });
ja(wo && wo.weer === 'bewolkt' && /open-meteo\.com.*current=temperature_2m,weather_code/.test(omU), 'weer: bron openmeteo');
O.WEER.bron = 'uit'; urls = [];
ja(await O.weer(nepKv(), plek, { fetchFn: nepFetch }) === null && urls.length === 0, 'weer: bron uit doet geen opvraag');
O.WEER.bron = 'metno';
// dagmax
const kvd = nepKv(); kvd.m.set('mm:weern:2026-11-28', String(O.WEER.dag)); urls = [];
ja(await O.weer(kvd, plek, { fetchFn: nepFetch }) === null && urls.length === 0 && kvd.h.get('mm:omg:2026-11-28').wcap === 1, 'weer: boven de dagmax geen opvraag, geteld');
// slot: stoot kliks uit dezelfde stad
const kvs = nepKv(); urls = [];
const slow = async (u, o) => { urls.push(u); await new Promise(r => setTimeout(r, 20)); return { ok: true, json: async () => metno }; };
const rs = await Promise.all([1, 2, 3, 4].map(() => O.weer(kvs, plek, { fetchFn: slow })));
ja(urls.length === 1 && rs.filter(Boolean).length === 1, 'weer: een stoot kliks uit dezelfde stad geeft één opvraag');
// fouten, pauze, ingrijpen
const kvf = nepKv(); urls = [];
const stuk = async u => { urls.push(u); return { ok: false, status: 503 }; };
for (let i = 0; i < 34; i++) await O.weer(kvf, Object.assign({}, plek, { stad: 'Stad' + i }), { fetchFn: stuk });
const sf = await O.stand(kvf);
ja(sf.fouten.http503 >= 31 && sf.pauze && sf.pauze.nogSeconden === 6 * 3600, 'pauze: na meer dan 30 fouten en meer dan de helft van de opvragen zes uur pauze');
const voor = urls.length, pv = (await O.stand(kvf)).overgeslagen.pauze; await O.weer(kvf, Object.assign({}, plek, { stad: 'Nieuw' }), { fetchFn: stuk });
ja(urls.length === voor && (await O.stand(kvf)).overgeslagen.pauze === pv + 1, 'pauze: tijdens de pauze geen opvraag');
ja(/PAUZE/.test(O.standTekst(sf)) && /http503/.test(O.standTekst(sf)), 'stand: tekst toont pauze en fouten');
const kvn = nepKv(); await O.weer(kvn, plek, { fetchFn: async () => { throw new Error('time-out'); } });
ja((await O.stand(kvn)).fouten.net === 1 && !(await O.stand(kvn)).pauze, 'fout: netwerkfout geteld, nog geen pauze');
const kvj = nepKv(); await O.weer(kvj, plek, { fetchFn: async () => ({ ok: true, json: async () => ({ onzin: 1 }) }) });
ja((await O.stand(kvj)).fouten.inhoud === 1, 'fout: onleesbaar antwoord geteld als inhoud');

// verwerkO en het precies-eenmaal-protocol
const srv = { lat: '40.7128', lon: '-74.0060', land: 'US', regio: 'NY', stad: 'New York', pc: '10001' };
const klik = { cid: 'aaaa1111bbbb2222', srv, t: t('2026-11-28T17:00:00Z'), D: '2026-11-28', uit: { n: 1, rep: 0, bot: 0, js: 1, ud: 1 }, tag: 'tg-20' };
const hv = kv => (kv.h.get('mm:vf:' + klik.cid) || {});
const F = { koopkracht: '5', daglicht: 'licht', weer: 'regen', temp: '10-19' };
// volgorde 1: eerst de late verwerking, dan de uitkomsten
{
  const k = nepKv(); const f = await O.verwerkO(k, klik, { fetchFn: nepFetch });
  ja(f && f.koopkracht === '5 hoogste 20%' && f.weer === 'regen' && f.daglicht === 'licht' && f.temp === '10-19', 'verwerkO: alle vier voorspellers');
  ja(/^daglicht=licht;/.test(hv(k).o) || /koopkracht=5-hoogste-20/.test(hv(k).o), 'verwerkO: o staat bij de klik, zonder postcode of coordinaten');
  ja(!/10001|40\.71|74\.00/.test(JSON.stringify([...k.h.entries()])) && !/10001|40\.71|74\.00/.test(JSON.stringify([...k.m.entries()])), 'privacy: postcode en coordinaten staan nergens in de opslag');
  const s = tel(k, '2026-11-28');
  ja(s['g|koopkracht=5-hoogste-20|n'] === 1 && s['g|weer=regen|js'] === 1 && s['g|daglicht=licht|ud'] === 1 && s['g|temp=10-19|n'] === 1, 'tellers: klik geteld met dezelfde uit-vlaggen als de klik');
  ja((k.h.get('mm:vst:2026-11-28') || {})['daglicht=licht|tg-20'] === 1, 'tellers: per tag voor Amazon-tags (tagCmds)');
  await O.oUitkomst(k, klik.cid, 'aan', '2026-11-28', 1).then(c => Promise.all(c.map(x => k.raw(x))));
  await O.oUitkomst(k, klik.cid, 'aan', '2026-11-28', 1).then(c => Promise.all(c.map(x => k.raw(x))));
  const s2 = tel(k, '2026-11-28');
  ja(s2['g|weer=regen|aan'] === 1 && s2['g|weer=regen|botb'] === 1, 'uitkomst na o: aan en botb precies eenmaal, ook bij herhaling');
  await O.oUitkomst(k, klik.cid, 'koop', '2026-11-28').then(c => Promise.all(c.map(x => k.raw(x))));
  ja(tel(k, '2026-11-28')['g|koopkracht=5-hoogste-20|koop'] === 1, 'uitkomst na o: koop geteld');
}
// volgorde 2: uitkomsten komen vóór o
{
  const k = nepKv();
  const c1 = await O.oUitkomst(k, klik.cid, 'aan', '2026-11-28', 0), c2 = await O.oUitkomst(k, klik.cid, 'echt', '2026-11-27');
  ja(c1.length === 0 && c2.length === 0 && hv(k)['u_aan'] === '2026-11-28' && hv(k)['u_echt'] === '2026-11-27', 'uitkomst voor o: alleen markering, nog niets geteld');
  await O.verwerkO(k, klik, { fetchFn: nepFetch });
  const s = tel(k, '2026-11-28'), s27 = tel(k, '2026-11-27');
  ja(s['g|weer=regen|aan'] === 1 && s27['g|weer=regen|echt'] === 1 && !s['g|weer=regen|botb'], 'late verwerking telt de wachtende uitkomsten op de dag uit de markering');
  const c3 = await O.oUitkomst(k, klik.cid, 'aan', '2026-11-28', 0);
  ja(c3.length === 0 && tel(k, '2026-11-28')['g|weer=regen|aan'] === 1, 'daarna dezelfde uitkomst nog eens: niet nog een keer');
}
// volgorde 3: gelijktijdig (markering en o kruisen elkaar)
{
  const k = nepKv();
  const [, cmds] = await Promise.all([O.verwerkO(k, klik, { fetchFn: nepFetch }), O.oUitkomst(k, klik.cid, 'aan', '2026-11-28', 1)]);
  await Promise.all(cmds.map(x => k.raw(x)));
  ja(tel(k, '2026-11-28')['g|weer=regen|aan'] === 1 && tel(k, '2026-11-28')['g|weer=regen|botb'] === 1, 'gelijktijdig: aan en botb precies eenmaal');
}
// elke volgorde, vele keren, willekeurige vertraging
{
  let slecht = 0;
  for (let i = 0; i < 60; i++) {
    const k = nepKv(), vertraag = () => new Promise(r => setTimeout(r, Math.floor(Math.random() * 4)));
    const wr = async () => { await vertraag(); const c = await O.oUitkomst(k, klik.cid, 'echt', '2026-11-28'); await Promise.all(c.map(x => k.raw(x))); };
    await Promise.all([(async () => { await vertraag(); await O.verwerkO(k, klik, { fetchFn: nepFetch }); })(), wr(), wr()]);
    if (tel(k, '2026-11-28')['g|weer=regen|echt'] !== 1) slecht++;
  }
  ja(slecht === 0, 'willekeurige volgorde, 60 keer, twee schrijvers: echt altijd precies eenmaal');
}
// zonder omgevingsdata niets schrijven
{
  const k = nepKv(); const f = await O.verwerkO(k, Object.assign({}, klik, { srv: { land: 'nl' } }), { fetchFn: nepFetch });
  ja(f === null && !k.h.has('mm:vf:' + klik.cid), 'zonder plek of postcode: niets bij de klik geschreven');
}
// kliks tellers voor de controle
{
  const k = nepKv(); await O.verwerkO(k, klik, { fetchFn: nepFetch }); const s = await O.stand(k);
  ja(s.kliks === 1 && s.metKoopkracht === 1 && s.metDaglicht === 1 && s.metWeer === 1 && s.opvragen === 1, 'stand: kliks, met koopkracht, daglicht, weer, opvragen');
}
// een uitkomst na 30 uur (hash al weg): de markering maakt een nieuwe hash, die moet een houdbaarheid krijgen (database is krap)
{
  const k = nepKv(); const c = await O.oUitkomst(k, 'cccc3333dddd4444', 'koop', '2026-11-28');
  ja(c.length === 0 && k.h.get('mm:vf:cccc3333dddd4444').u_koop === '2026-11-28' && k.ttl.get('mm:vf:cccc3333dddd4444') === 30 * 3600, 'late uitkomst zonder klikgeheugen: markering met houdbaarheid van 30 uur, niets geteld');
}
ja(LABEL.koopkracht && LABEL.daglicht && LABEL.weer && LABEL.temp && !('weer' in {}) , 'LABEL: vier nieuwe voorspellers');
// koopkracht Nederland (lib/kknl.js): gewogen vijfden, onbekend, drempel, lezen via koopkracht()
{
  const KN = await import('../lib/kknl.js');
  const rijen = []; for (let i = 0; i < 10; i++) rijen.push({ postcode: 1000 + i, inwoners: 100, inkomen: 20000 + i * 1000 });
  rijen.push({ postcode: 1010, inwoners: 100, inkomen: -99997 }, { postcode: 1011, inwoners: 100, inkomen: null }, { postcode: 1012, inwoners: 0, inkomen: 40000 }, { postcode: 1013, inwoners: 50, inkomen: -99995 }, { postcode: 1004, inwoners: 100, inkomen: 99999 });
  const v = KN.vijfden(rijen);
  ja(v.tabel.length === 9000 && v.meta.gevuld === 10 && v.meta.onbekend === 4 && v.meta.gezien === 14, 'kknl: 10 gevuld, 4 onbekend, dubbele postcode telt niet mee');
  ja(v.tabel.slice(0, 10) === '1122334455' && v.meta.perVijfde.join() === '2,2,2,2,2', 'kknl: tien gelijke PC4 in twee per vijfde, laag naar hoog');
  ja(v.tabel[10] === '0' && v.tabel[11] === '0' && v.tabel[12] === '0' && v.tabel[13] === '0' && v.tabel[5000] === '0', 'kknl: negatieve code, leeg, zonder inwoners en niet in de lijst zijn 0 (nooit opvullen)');
  ja(v.meta.grenzen.join() === '22000,24000,26000,28000', 'kknl: grenzen tussen de vijfden in inkomen');
  const w = KN.vijfden([{ postcode: 2000, inwoners: 800, inkomen: 10000 }, { postcode: 2001, inwoners: 50, inkomen: 20000 }, { postcode: 2002, inwoners: 50, inkomen: 30000 }, { postcode: 2003, inwoners: 50, inkomen: 40000 }, { postcode: 2004, inwoners: 50, inkomen: 50000 }]);
  ja(w.tabel.slice(1000, 1005) === '35555', 'kknl: gewogen op inwoners, niet op aantal gebieden (grote PC4 krijgt het midden, de kleine erboven alle hoog)');
  ja(!KN.geloofwaardig(v.meta, [2023]) && KN.geloofwaardig({ gevuld: 3500 }, [2023]) && !KN.geloofwaardig({ gevuld: 4000 }, [2023, 2024]) && !KN.geloofwaardig({ gevuld: 3499 }, [2023]) && !KN.geloofwaardig({ gevuld: 4000 }, []), 'kknl: drempel 3.500 PC4 en alleen jaarcode 2023');
  const grote = []; for (let i = 0; i < 4000; i++) grote.push({ postcode: 1000 + i, inwoners: 1000, inkomen: 25000 + (i * 7919) % 30000 });
  const g = KN.vijfden(grote); ja(g.meta.gevuld === 4000 && g.meta.perVijfde.every(n => n > 700 && n < 900), 'kknl: 4.000 PC4 verdeeld in vijfden van ongeveer 800');
  const TT = { NL: g.tabel, US: '' }; ja(O.koopkracht('nl', '1012AB', TT) !== '' && O.koopkracht('nl', '1012 AB', TT) === O.koopkracht('nl', '1012', TT) && O.koopkracht('nl', '9999ZZ', TT) === '' && O.koopkracht('nl', '0999AB', TT) === '', 'koopkracht: NL met tabel, spatie, onbekend en onder 1000');
  const k = nepKv(); ja(await KN.laadNL(k) === '', 'kknl: laadNL zonder tabel is leeg');
  await KN.bewaar(k, { ok: true, tabel: g.tabel, meta: Object.assign({ gehaald: new Date().toISOString() }, g.meta) });
  ja(await KN.laadNL(k) === g.tabel && (await KN.stand(k)).gevuld === 4000 && !(await KN.stand(k)).oud, 'kknl: bewaren, laden en stand (niet oud)');
  const f = nepKv(); await KN.bewaar(f, { ok: false, fout: 'proef' }); ja((await KN.stand(f)).oud && /LEEG/.test(KN.standTekst(await KN.stand(f))), 'kknl: lege stand zegt het hardop');
  // haalNL met een nep PDOK: 18 blokken, een pagina met next-link, alleen jaarcode 2023
  const data = {}; for (let p = 1000; p < 5000; p++) data[p] = { properties: { postcode: p, aantal_inwoners: 500, gemiddeld_inkomen_huishouden: p === 1500 ? -99997 : 30000 + (p % 97) * 500, jaarcode: 2023 }, geometry: null };
  const nep = async (url) => { const u = new URL(url), fl = decodeURIComponent(u.searchParams.get('filter')), m = /postcode>=(\d+) AND postcode<(\d+)/.exec(fl), a = Number(m[1]), b = Number(m[2]), c = Number(u.searchParams.get('cursor') || a), uit = []; for (let p = c; p < b && uit.length < 250; p++) if (data[p]) uit.push(data[p]); const volg = uit.length === 250 ? Number(uit[249].properties.postcode) + 1 : 0; return { ok: true, status: 200, json: async () => ({ features: uit, links: volg && volg < b ? [{ rel: 'next', href: u.origin + u.pathname + '?f=json&limit=250&filter=' + u.searchParams.get('filter') + '&cursor=' + volg }] : [] }) }; };
  const h = await KN.haalNL(nep); ja(h.ok && h.meta.gevuld === 3999 && h.meta.onbekend === 1 && h.tabel[500] === '0', 'kknl: haalNL met bladeren over pagina\'s, een onbekende PC4 blijft 0');
  const h2 = await KN.haalNL(async () => ({ ok: false, status: 500, json: async () => ({}) })); ja(!h2.ok && /500/.test(h2.fout), 'kknl: een fout van PDOK bewaart niets');
}
console.log(fout ? fout + ' fout' : 'alles ok (' + ok + ')'); process.exit(fout ? 1 : 0);
