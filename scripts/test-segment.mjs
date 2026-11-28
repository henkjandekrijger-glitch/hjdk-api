// test lib/segment.js zonder netwerk: node scripts/test-segment.mjs
// (28 nov 2026, taak dnhwt6: "Clickmind segmenteren per product"): koopkrachtscore, segmentconversie, zoneprofiel per segment, tik voor wie
import * as S from '../lib/segment.js';
import * as O from '../lib/omgeving.js';
import * as W from '../lib/wissel.js';
import { LABEL } from '../lib/voorspel.js';

let ok = 0, fout = 0;
const ja = (c, t) => { if (c) { ok++; console.log('ok   ' + t); } else { fout++; console.log('FOUT ' + t); } };
const gets = []; globalThis.fetch = async u => { gets.push(String(u)); return { status: 200, ok: true, json: async () => ({}) }; };
const na = (ms = 30) => new Promise(r => setTimeout(r, ms));

function nepKv() {
  const m = new Map(), h = new Map(), ttl = new Map(), l = new Map();
  const H = k => { if (!h.has(k)) h.set(k, {}); return h.get(k); };
  const raw = async ([cmd, k, ...a]) => {
    if (cmd === 'GET') return m.has(k) ? m.get(k) : null;
    if (cmd === 'SET') { if (a.includes('NX') && m.has(k)) return null; m.set(k, a[0]); const i = a.indexOf('EX'); if (i >= 0) ttl.set(k, a[i + 1]); return 'OK'; }
    if (cmd === 'INCR') { const n = (Number(m.get(k)) || 0) + 1; m.set(k, String(n)); return n; }
    if (cmd === 'EXISTS') return m.has(k) || h.has(k) ? 1 : 0;
    if (cmd === 'EXPIRE') { ttl.set(k, a[0]); return 1; }
    if (cmd === 'HINCRBY') { const o = H(k); o[a[0]] = (Number(o[a[0]]) || 0) + Number(a[1]); return o[a[0]]; }
    if (cmd === 'HSET') { const o = H(k); for (let i = 0; i + 1 < a.length; i += 2) o[a[i]] = String(a[i + 1]); return 1; }
    if (cmd === 'HSETNX') { const o = H(k); if (a[0] in o) return 0; o[a[0]] = String(a[1]); return 1; }
    if (cmd === 'HGET') return (h.get(k) || {})[a[0]] ?? null;
    if (cmd === 'HMGET') { const o = h.get(k) || {}; return a.map(f => o[f] ?? null); }
    if (cmd === 'HGETALL') { const o = h.get(k); return o ? Object.entries(o).flat().map(String) : []; }
    if (cmd === 'RPUSH') { const x = l.get(k) || []; x.push(a[0]); l.set(k, x); return x.length; }
    return null;
  };
  return { m, h, ttl, l, raw, get: async k => m.has(k) ? m.get(k) : null, set: async (k, v) => { m.set(k, v); return 'OK'; } };
}
const veld = (kv, k, f) => Number((kv.h.get(k) || {})[f] || 0);
const dag = new Date().toISOString().slice(0, 10), nu = Date.now();

// ---- 1. koopkrachtscore: de tabel ----
{
  const B = x => S.kksBereken(x);
  ja(B({ a: { os: 'ios' }, o: { koopkracht: '5 hoogste 20%' } }).kks === 'hoog' && B({ a: { os: 'ios' }, o: { koopkracht: '5 hoogste 20%' } }).som === 3, 'hoog: hoogste 20% plus iOS (2 + 1)');
  ja(B({ a: { os: 'android' }, o: { koopkracht: '1 laagste 20%' } }).kks === 'laag', 'laag: laagste 20% plus Android (-2 - 1)');
  ja(B({ a: { os: 'ios', n_conn: 'wifi' } }).kks === 'midden', 'midden: iOS plus wifi (2 punten, onder de grens 3)');
  ja(B({ a: { os: 'ios' } }).kks === '' && B({}).kks === '' && B({ a: { os: 'ander' }, o: { koopkracht: '3 midden' } }).kks === '', 'minder dan twee signalen: geen score');
  ja(B({ a: { os: 'android' }, o: { koopkracht: '5-hoogste-20' }, b: { tjaar: '0-1-jaar-oud', toestel: 'samsung galaxy s24 ultra', con: 'wifi' } }).kks === 'hoog' && B({ a: { os: 'android' }, o: { koopkracht: '5-hoogste-20' }, b: { tjaar: '0-1-jaar-oud', toestel: 'samsung galaxy s24 ultra', con: 'wifi' } }).punten.toestel === 2, 'Android met nieuw duur toestel en wifi in een rijk gebied: hoog (toestel begrensd op +2)');
  ja(B({ a: { os: 'android' }, b: { tjaar: '6+ jaar oud', toestel: 'samsung galaxy a10', con: 'mobiel 3g' } }).kks === 'laag', 'oud goedkoop Android op traag mobiel: laag');
  ja(JSON.stringify(B({ a: { os: 'android' }, o: { koopkracht: '4 boven midden' }, b: { tjaar: '2-3 jaar oud' } })) === JSON.stringify(B({ a: { os: 'android' }, o: { koopkracht: '4-boven-midden' }, b: { tjaar: '2-3-jaar-oud' } })), 'ruwe waarde en opgeslagen waarde (vfTekst) geven dezelfde score');
  ja(B({ a: { os: 'ios', iosv: 'ios14' } }).punten.toestel === -1 && B({ a: { os: 'ios', iosv: 'ios18' } }).punten.toestel === undefined, 'oude iOS-versie telt als oud toestel, nieuwe iOS zegt niets');
  ja(B({ a: { os: 'android', n_device: 'phone' } }).signalen === 1, 'een gewoon toesteltype van het netwerk is geen signaal');
  ja(LABEL.kks === 'koopkrachtscore', 'LABEL: kks = koopkrachtscore');
  const tekst = JSON.stringify(S.PUNTEN, (k, v) => v instanceof RegExp ? String(v) : v);
  ja(!/gezond|geloof|religi|afkomst|etni|vrouw|man\b|geslacht|gender/i.test(tekst), 'geen gevoelige kenmerken en geen geslacht in de punten');
}

// ---- 1. koopkrachtscore: het moment en precies eenmaal ----
const srv = { lat: '40.7128', lon: '-74.0060', land: 'US', regio: 'NY', stad: 'New York', pc: '90210' };
const metno = { properties: { timeseries: [{ data: { instant: { details: { air_temperature: 14 } }, next_1_hours: { summary: { symbol_code: 'rain' } } } }] } };
const nepFetch = async () => ({ ok: true, status: 200, json: async () => metno });
const klik = (cid, extra = {}) => Object.assign({ cid, srv, t: nu, D: dag, uit: { n: 1, rep: 0, bot: 0, js: 0, ud: 1 }, tag: '-', vf: { os: 'ios' }, zp: 'wtb-test|propeller|777|-' }, extra);
{
  const kv = nepKv(), cid = 'aaaa0000aaaa0001'; let geslapen = 0;
  const f = await O.verwerkO(kv, klik(cid), { fetchFn: nepFetch, slaap: async ms => { geslapen += ms; } });
  const vf = kv.h.get('mm:vf:' + cid);
  ja(f.kks === 'hoog' && vf.kks === 'hoog' && /kks=hoog/.test(vf.o) && vf.zp === 'wtb-test|propeller|777|-', '302-klik: score vast in o en in veld kks, product en zone bij de klik');
  ja(geslapen === 0, '302-klik: geen wachten (de meetpagina komt nooit)');
  ja(veld(kv, 'mm:vs:' + dag, 'g|kks=hoog|n') === 1 && veld(kv, 'mm:vs:' + dag, 'g|kks=hoog|ud') === 1, 'voorspeller kks geteld met de klik (n en ud)');
  ja(veld(kv, 'mm:seg:' + dag, 'klik') === 1 && veld(kv, 'mm:seg:' + dag, 'kks_hoog') === 1 && kv.ttl.get('mm:seg:' + dag) === 15 * 86400, 'controle: klik met score vandaag, 15 dagen');
  ja(veld(kv, 'mm:segz:' + dag, 'wtb-test|kk-hoog|propeller|777|-|n') === 1 && kv.ttl.get('mm:segz:' + dag) === 15 * 86400, 'zoneprofiel: klik in het segment kk-hoog, 15 dagen');
  ja(!/90210|40\.71|74\.00/.test(JSON.stringify([...kv.h.entries(), ...kv.m.entries()])), 'privacy: geen postcode en geen coordinaten opgeslagen');
  await O.oUitkomst(kv, cid, 'echt', dag).then(c => Promise.all(c.map(x => kv.raw(x))));
  await O.oUitkomst(kv, cid, 'echt', dag).then(c => Promise.all(c.map(x => kv.raw(x))));
  ja(veld(kv, 'mm:vs:' + dag, 'g|kks=hoog|echt') === 1 && veld(kv, 'mm:segz:' + dag, 'wtb-test|kk-hoog|propeller|777|-|echt') === 1, 'uitkomst na de score: precies eenmaal bij kks en in het zoneprofiel');
}
{ // js-klik: de meetpagina en 51Degrees komen binnen de wachttijd en tellen mee
  const kv = nepKv(), cid = 'aaaa0000aaaa0002'; let geslapen = 0;
  const f = await O.verwerkO(kv, klik(cid, { vf: { os: 'android' }, uit: { n: 1, js: 1 }, srv: { land: 'nl' } }), { fetchFn: nepFetch, slaap: async ms => { geslapen = ms; await kv.raw(['HSET', 'mm:vf:' + cid, 'b', 'con=wifi;tjaar=0-1-jaar-oud;toestel=google-pixel-9-pro']); } });
  ja(geslapen > 3000 && f.kks === 'midden' && kv.h.get('mm:vf:' + cid).kks === 'midden', 'js-klik: wacht tot 4 s na de klik en neemt toestel en verbinding mee (android -1, toestel +2, wifi +1 = midden)');
}
{ // te weinig signalen: veld kks '-', telt als onbekend, geen voorspellerwaarde
  const kv = nepKv(), cid = 'aaaa0000aaaa0003';
  await O.verwerkO(kv, klik(cid, { vf: { os: 'ander' }, srv: { land: 'de' } }), { fetchFn: nepFetch });
  ja(kv.h.get('mm:vf:' + cid).kks === '-' && veld(kv, 'mm:seg:' + dag, 'kks_onbekend') === 1 && !Object.keys(kv.h.get('mm:vs:' + dag) || {}).some(x => /kks=/.test(x)), 'te weinig signalen: kks "-", geteld als onbekend, geen voorspellerwaarde');
}
{ // zonder vf (andere aanroepers): niets anders dan voorheen
  const kv = nepKv(), cid = 'aaaa0000aaaa0004'; const a = klik(cid); delete a.vf; delete a.zp;
  const f = await O.verwerkO(kv, a, { fetchFn: nepFetch });
  ja(!('kks' in f) && !('kks' in kv.h.get('mm:vf:' + cid)) && !kv.h.has('mm:seg:' + dag), 'zonder vf: geen score en geen nieuwe tellers (oude gedrag)');
}
{ // willekeurige volgorde: uitkomst voor of na de score, twee schrijvers, altijd precies eenmaal
  let slecht = 0;
  for (let i = 0; i < 60; i++) {
    const kv = nepKv(), cid = 'bbbb0000bbbb' + String(1000 + i), vertraag = () => new Promise(r => setTimeout(r, Math.floor(Math.random() * 4)));
    const wr = async () => { await vertraag(); const c = await O.oUitkomst(kv, cid, 'aanmelding', dag); await Promise.all(c.map(x => kv.raw(x))); };
    await Promise.all([(async () => { await vertraag(); await O.verwerkO(kv, klik(cid), { fetchFn: nepFetch }); })(), wr(), wr()]);
    if (veld(kv, 'mm:vs:' + dag, 'g|kks=hoog|aanmelding') !== 1 || veld(kv, 'mm:segz:' + dag, 'wtb-test|kk-hoog|propeller|777|-|aanmelding') !== 1 || veld(kv, 'mm:vs:' + dag, 'g|kks=hoog|n') !== 1) slecht++;
  }
  ja(slecht === 0, 'willekeurige volgorde, 60 keer: klik en aanmelding altijd precies eenmaal onder dezelfde score');
}
ja(S.zpVan({ wissel: 'WTB-x', net: 'propeller', zone: '123', sz: '9' }) === 'wtb-x|propeller|123|9' && S.zpVan({ camp: 'c1', net: 'mondiad', zone: '5' }) === 'c1|mondiad|5|-' && S.zpVan({ wissel: 'w', net: 'mail', zone: 'p' }) === '' && S.zpVan({ wissel: 'w', net: 'propeller', zone: '-' }) === '', 'zoneprofiel alleen voor betaalde zones (geen mail, geen zone "-"), product = wissel, anders campagne');

// ---- 2. segmentconversie ----
const urlArm = { id: 'a', soort: 'url', url: 'https://whichtobuy.best/x', gewicht: 1 };
const amzArm = { id: 'b', soort: 'amazon', k: 'socks', tag: 'test-20', gewicht: 1 };
{
  const zonder = W.checkWissel({ naam: 'oud', armen: [urlArm], pb: { propeller: 'echt' } });
  ja(zonder.ok && zonder.wissel.pbseg === undefined && !('pbseg' in JSON.parse(JSON.stringify(zonder.wissel))), 'bestaande wissel zonder pbseg: instelling ongewijzigd (geen pbseg-veld)');
  const met = W.checkWissel({ naam: 'seg', armen: [urlArm], pb: { propeller: 'echt' }, pbseg: 'kk-hoog' });
  ja(met.ok && met.wissel.pbseg === 'kk-hoog', 'wissel met pb echt en pbseg kk-hoog wordt aangenomen');
  const amz = W.checkWissel({ naam: 'seg2', armen: [urlArm, amzArm], pb: { propeller: 'echt' }, pbseg: 'kk-hoog' });
  ja(!amz.ok && /Amazon/.test(amz.fout), 'Amazon-arm met pbseg: geweigerd (harde grens)');
  ja(!W.checkWissel({ naam: 'seg3', armen: [urlArm], pbseg: 'kk-hoog' }).ok && !W.checkWissel({ naam: 'seg4', armen: [urlArm], pb: { propeller: 'echt' }, pbseg: 'vrouw' }).ok, 'pbseg zonder pb of met een onbekend segment: geweigerd');
  ja(W.checkWissel({ naam: 'seg5', armen: [urlArm, amzArm], pb: { propeller: 'echt' } }).ok, 'zonder pbseg blijft een wissel met een Amazon-arm gewoon toegestaan (niets veranderd)');
}
const ctx = cid => ({ cid, pid: 'p1', net: 'propeller', zone: '777', camp: '55', sub: 'SUB1234567' });
{ // wisselKlik: zonder pbseg exact hetzelfde klikrecord, met pbseg alleen pbg erbij en nooit bij een Amazon-arm
  const kv = nepKv(), w = W.checkWissel({ naam: 'oud', armen: [urlArm], pb: { propeller: 'echt' } }).wissel;
  await W.wisselKlik(kv, w, { arm: w.armen[0], soort: ['nieuw'], vast: true }, ctx('cccc0000cccc0001'));
  const r = kv.h.get('mm:cid:cccc0000cccc0001'); delete r.t;
  ja(JSON.stringify(r) === JSON.stringify({ pid: 'p1', wissel: 'oud', arm: 'a', net: 'propeller', zone: '777', camp: '55', tag: '', pbs: 'echt', sub: 'SUB1234567' }), 'zonder pbseg: klikrecord precies als voorheen (pbs en sub, geen pbg)');
  const ws = W.checkWissel({ naam: 'seg', armen: [urlArm], pb: { propeller: 'echt' }, pbseg: 'kk-hoog' }).wissel;
  await W.wisselKlik(kv, ws, { arm: ws.armen[0], soort: ['nieuw'], vast: true }, ctx('cccc0000cccc0002'));
  ja(kv.h.get('mm:cid:cccc0000cccc0002').pbg === 'kk-hoog', 'met pbseg: pbg bij de klik');
  const nep = Object.assign({}, ws, { armen: [urlArm, Object.assign({}, amzArm, { variant: '302', p: 'b', m: 'com' })] }); // ook als iemand de controle omzeilt
  await W.wisselKlik(kv, nep, { arm: nep.armen[1], soort: ['nieuw'], vast: true }, ctx('cccc0000cccc0003'));
  ja(!('pbg' in kv.h.get('mm:cid:cccc0000cccc0003')), 'Amazon-arm krijgt nooit een segment, ook niet buiten checkWissel om');
}
const zet = (kv, cid, extra = {}) => kv.h.set('mm:cid:' + cid, Object.assign({ t: String(nu), pid: 'p1', wissel: 'seg', arm: 'a', net: 'propeller', zone: '777', camp: '55', tag: '', pbs: 'echt', sub: 'SUB1234567' }, extra));
{ // zonder pbg: postback zoals altijd, eenmaal per klik
  const kv = nepKv(), cid = 'dddd0000dddd0001'; zet(kv, cid); gets.length = 0;
  const r1 = await W.uitkomst(kv, { cid, soort: 'echt' }), r2 = await W.uitkomst(kv, { cid, soort: 'echt' });
  ja(r1.pb === 200 && r2.dubbel && gets.length === 1 && /visitor_id=SUB1234567/.test(gets[0]) && veld(kv, 'mm:cu:' + dag, 'propeller|55|pb200') === 1 && !r1.segment, 'zonder segment: één postback zoals voorheen, tweede keer dubbel');
  const cid2 = 'dddd0000dddd0002'; zet(kv, cid2, { pbs: 'aanmelding' }); gets.length = 0;
  await W.uitkomst(kv, { cid: cid2, soort: 'echt' }); ja(gets.length === 0, 'andere uitkomst dan pb: geen postback (ongewijzigd)');
}
{ // botzone blijft gelden (mondiad, eigen cache)
  const kv = nepKv(), cid = 'dddd0000dddd0003'; kv.m.set('mm:blok:mondiad', { zones: ['777'] }); zet(kv, cid, { net: 'mondiad' }); gets.length = 0;
  const r = await W.uitkomst(kv, { cid, soort: 'echt' });
  ja(!r.pb && gets.length === 0 && veld(kv, 'mm:cu:' + dag, 'mondiad|55|pbbot') === 1, 'botzone: geen postback, wel geteld (ongewijzigd)');
}
{ // segment kk-hoog
  const kv = nepKv(); gets.length = 0;
  const c1 = 'eeee0000eeee0001'; zet(kv, c1, { pbg: 'kk-hoog' }); kv.h.set('mm:vf:' + c1, { kks: 'hoog' });
  const c2 = 'eeee0000eeee0002'; zet(kv, c2, { pbg: 'kk-hoog' }); kv.h.set('mm:vf:' + c2, { kks: 'laag' });
  const c3 = 'eeee0000eeee0003'; zet(kv, c3, { pbg: 'kk-hoog' }); kv.h.set('mm:vf:' + c3, { kks: '-' });
  const c4 = 'eeee0000eeee0004'; zet(kv, c4, { pbg: 'kk-hoog', t: String(nu - 3600e3) }); // oud en geen score
  const r1 = await W.uitkomst(kv, { cid: c1, soort: 'echt' }), r2 = await W.uitkomst(kv, { cid: c2, soort: 'echt' }), r3 = await W.uitkomst(kv, { cid: c3, soort: 'echt' }), r4 = await W.uitkomst(kv, { cid: c4, soort: 'echt' });
  ja(r1.segment === 'in' && r1.pb === 200 && gets.length === 1, 'kk-hoog en score hoog: postback');
  ja(r2.segment === 'buiten' && r3.segment === 'onbekend' && r4.segment === 'onbekend' && gets.length === 1, 'score laag (buiten), "-" of oud zonder score (onbekend): geen postback');
  ja(veld(kv, 'mm:seg:' + dag, 'pb_in_kk-hoog') === 1 && veld(kv, 'mm:seg:' + dag, 'pb_buiten_kk-hoog') === 1 && veld(kv, 'mm:seg:' + dag, 'pb_onbekend_kk-hoog') === 2 && veld(kv, 'mm:seg:' + dag, 'pb_gestuurd') === 1, 'controle: 1 gemeld, 1 buiten, 2 onbekend, 1 verstuurd');
  const t = S.segTekst(await S.segStand(kv, 1)); ja(/kk-hoog 1 gemeld, 1 buiten, 2 onbekend/.test(t), 'tekst toont gemeld, buiten en onbekend');}
{ // uitkomst vóór de score: wacht, de late verwerking stuurt hem precies eenmaal
  const kv = nepKv(), cid = 'ffff0000ffff0001'; zet(kv, cid, { pbg: 'kk-hoog' }); gets.length = 0;
  const r = await W.uitkomst(kv, { cid, soort: 'echt' });
  ja(r.segment === 'wacht' && gets.length === 0 && kv.h.get('mm:vf:' + cid).pbw_echt, 'uitkomst voor de score: wacht, markering gezet, nog geen postback');
  await O.verwerkO(kv, klik(cid), { fetchFn: nepFetch }); await na();
  ja(gets.length === 1 && veld(kv, 'mm:seg:' + dag, 'pb_laat') === 1 && veld(kv, 'mm:seg:' + dag, 'pb_in_kk-hoog') === 1, 'late verwerking: score hoog, postback eenmaal gestuurd');
  await S.naVast(kv, cid); await W.uitkomst(kv, { cid, soort: 'echt' }); ja(gets.length === 1, 'nog eens: geen tweede postback');
  const kv2 = nepKv(), c2 = 'ffff0000ffff0002'; zet(kv2, c2, { pbg: 'kk-hoog' }); gets.length = 0;
  await W.uitkomst(kv2, { cid: c2, soort: 'echt' }); await O.verwerkO(kv2, klik(c2, { srv: { land: 'nl' }, vf: { os: 'android', n_conn: '3g' } }), { fetchFn: nepFetch });
  ja(gets.length === 0 && veld(kv2, 'mm:seg:' + dag, 'pb_buiten_kk-hoog') === 1, 'late verwerking: score laag, geen postback, geteld als buiten');
}
{ // gelijktijdig, vele keren: nooit twee postbacks, nooit twee beslissingen
  let slecht = 0;
  for (let i = 0; i < 40; i++) {
    const kv = nepKv(), cid = 'abab0000abab' + String(1000 + i); zet(kv, cid, { pbg: 'kk-hoog' }); const voor = gets.length, vertraag = () => new Promise(r => setTimeout(r, Math.floor(Math.random() * 4)));
    await Promise.all([(async () => { await vertraag(); await O.verwerkO(kv, klik(cid), { fetchFn: nepFetch }); })(), (async () => { await vertraag(); await W.uitkomst(kv, { cid, soort: 'echt' }); })()]); await na(5);
    const beslist = ['in', 'buiten', 'onbekend'].reduce((s, x) => s + veld(kv, 'mm:seg:' + dag, 'pb_' + x + '_kk-hoog'), 0);
    if (gets.length - voor !== 1 || beslist !== 1) slecht++;
  }
  ja(slecht === 0, 'willekeurige volgorde, 40 keer: precies één beslissing en één postback');
}
{ // voor-haar: alleen uit de tik
  const kv = nepKv(); gets.length = 0;
  const c1 = 'acac0000acac0001'; zet(kv, c1, { pbg: 'voor-haar', vw: 'voor-haar' });
  const c2 = 'acac0000acac0002'; zet(kv, c2, { pbg: 'voor-haar' });
  const c3 = 'acac0000acac0003'; zet(kv, c3, { pbg: 'voor-haar', vw: 'voor-mij' });
  const r1 = await W.uitkomst(kv, { cid: c1, soort: 'echt' }), r2 = await W.uitkomst(kv, { cid: c2, soort: 'echt' }), r3 = await W.uitkomst(kv, { cid: c3, soort: 'echt' });
  ja(r1.segment === 'in' && r2.segment === 'onbekend' && r3.segment === 'buiten' && gets.length === 1, 'voor-haar: alleen met de eigen tik "voor haar" een postback; zonder tik onbekend');
}

// ---- 4. tik voor wie ----
{
  const kv = nepKv(), cid = 'adad0000adad0001'; zet(kv, cid, { pbs: '', 'u:echt': '1' }); kv.h.set('mm:vf:' + cid, { zp: 'seg|propeller|777|42' });
  ja(!(await S.voorWie(kv, { cid, w: 'man' })).ok && !(await S.voorWie(kv, { cid: 'xyz', w: 'haar' })).ok, 'tik: alleen mij, haar of hem, en een geldige klik-id');
  ja(!(await S.voorWie(kv, { cid: 'adad0000adad9999', w: 'haar' })).ok && veld(kv, 'mm:seg:' + dag, 'tik_onbekend') === 1, 'tik bij een onbekende klik: geweigerd en geteld');
  const r = await S.voorWie(kv, { cid, w: 'haar' }), r2 = await S.voorWie(kv, { cid, w: 'hem' });
  ja(r.ok && r.w === 'voor-haar' && r2.dubbel && kv.h.get('mm:cid:' + cid).vw === 'voor-haar', 'eerste tik telt, een tweede tik verandert niets');
  ja(veld(kv, 'mm:segz:' + dag, 'seg|voor-haar|propeller|777|42|n') === 1 && veld(kv, 'mm:segz:' + dag, 'seg|voor-haar|propeller|777|42|echt') === 1, 'tik: klik en de uitkomst van voor de tik in het zoneprofiel');
  const r3 = await W.uitkomst(kv, { cid, soort: 'aanmelding' });
  ja(r3.ok && veld(kv, 'mm:segz:' + dag, 'seg|voor-haar|propeller|777|42|aanmelding') === 1 && veld(kv, 'mm:seg:' + dag, 'tik_voor-haar') === 1, 'uitkomst na de tik telt bij het segment voor-haar');
}

// ---- 3. zoneprofiel ----
{
  const kv = nepKv(), k = 'mm:segz:' + dag;
  kv.h.set(k, { 'w1|kk-hoog|propeller|111|-|n': 100, 'w1|kk-hoog|propeller|111|-|echt': 30, 'w1|kk-hoog|propeller|222|-|n': 200, 'w1|kk-hoog|propeller|222|-|echt': 2, 'w1|kk-hoog|propeller|333|-|n': 10, 'w1|kk-hoog|propeller|333|-|echt': 5,
    'w1|kk-laag|propeller|111|-|n': 100, 'w1|kk-laag|propeller|111|-|echt': 5, 'w2|kk-hoog|mondiad|9|8|n': 60, 'w2|kk-hoog|mondiad|9|8|echt': 6, 'w2|kk-hoog|mondiad|9|7|n': 40 });
  const r = await S.zoneProfiel(kv, { dagen: 2 }), w1 = r.producten.find(p => p.product === 'w1'), h = w1.segmenten.find(s => s.segment === 'kk-hoog');
  ja(h.kliks === 310 && h.echt === 37 && h.witteLijst.length === 1 && h.witteLijst[0].zone === 'propeller|111' && h.witteLijst[0].aandeel === 50, 'zone 111: witte-lijstkandidaat voor kk-hoog (30 van 100, aandeel 50% van zijn kliks)');
  ja(h.duidelijkNiet.length === 1 && h.duidelijkNiet[0].zone === 'propeller|222' && h.teWeinig === 1, 'zone 222 duidelijk niet (2 van 200), zone 333 te weinig kliks');
  const rs = await S.zoneProfiel(kv, { dagen: 2, prod: 'w2', sub: true });
  const rz = await S.zoneProfiel(kv, { dagen: 2, prod: 'w2' });
  ja(rs.producten.length === 1 && rs.producten[0].segmenten[0].zones === 2 && rz.producten[0].segmenten[0].zones === 1 && rz.producten[0].segmenten[0].kliks === 100, 'per product, en per subzone apart (2 subzones van 1 zone)');
  ja(![...kv.m.keys(), ...kv.h.keys()].some(x => /^mm:blok|lijst|zones/.test(x)), 'zoneprofiel schrijft niets (geen mm:blok, geen lijst)');
  ja(/witte lijst: propeller\|111/.test(S.profielTekst(r)) && /voorstel/.test(S.profielTekst(r)), 'tekst: witte lijst en dat het een voorstel is');
}
// geen enkele postback naar Amazon of een ander adres dan het netwerk
ja(gets.every(u => /^https:\/\/(ad\.propellerads\.com|postback\.mondiad\.com)\//.test(u)) && !gets.some(u => /amazon|amzn/.test(u)), 'alle postbacks gaan naar het netwerk, nooit naar Amazon');

console.log('\n' + ok + ' ok, ' + fout + ' fout');
process.exit(fout ? 1 : 0);
