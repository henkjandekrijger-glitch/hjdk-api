// test lib/uitkomstterug.js zonder netwerk: node scripts/test-uitkomstterug.mjs
// (28 nov 2026, Henkjan: "Clickmind uitkomsten terug naar de klik"): Kadoly-koop, mail geopend en geklikt, Amazon per tag naar de zone
import * as T from '../lib/uitkomstterug.js';
import * as W from '../lib/wissel.js';
import * as M from '../lib/modal.js';

let ok = 0, fout = 0;
const ja = (c, t) => { if (c) { ok++; console.log('ok   ' + t); } else { fout++; console.log('FOUT ' + t); } };

const gets = []; // elke fetch is een postback: er mag er geen enkele langskomen
globalThis.fetch = async u => { gets.push(String(u)); return { status: 200, ok: true, json: async () => ({}) }; };

const na = () => new Promise(r => setTimeout(r, 30)); // mailTerug loopt na het antwoord (laterAf): even wachten voor de controle
function nepKv() {
  const m = new Map(), h = new Map(), l = new Map();
  const H = k => { if (!h.has(k)) h.set(k, {}); return h.get(k); };
  return { m, h, l, get: async k => m.has(k) ? m.get(k) : null, set: async (k, v) => { m.set(k, v); return 'OK'; }, raw: async ([cmd, k, ...a]) => {
    if (cmd === 'GET') return m.has(k) ? m.get(k) : null;
    if (cmd === 'SET') { m.set(k, a[0]); return 'OK'; }
    if (cmd === 'EXISTS') return m.has(k) || h.has(k) ? 1 : 0;
    if (cmd === 'EXPIRE') return 1;
    if (cmd === 'HINCRBY') { const o = H(k); o[a[0]] = (Number(o[a[0]]) || 0) + Number(a[1]); return o[a[0]]; }
    if (cmd === 'HSETNX') { const o = H(k); if (a[0] in o) return 0; o[a[0]] = a[1]; return 1; }
    if (cmd === 'HSET') { const o = H(k); for (let i = 0; i + 1 < a.length; i += 2) o[a[i]] = a[i + 1]; return 1; }
    if (cmd === 'HGET') return (h.get(k) || {})[a[0]] ?? null;
    if (cmd === 'HMGET') { const o = h.get(k) || {}; return a.map(f => o[f] ?? null); }
    if (cmd === 'HGETALL') { const o = h.get(k); return o ? Object.entries(o).flat().map(String) : []; }
    if (cmd === 'RPUSH') { const x = l.get(k) || []; x.push(a[0]); l.set(k, x); return x.length; }
    if (cmd === 'LLEN') return (l.get(k) || []).length;
    if (cmd === 'LRANGE') return (l.get(k) || []).slice(Number(a[0]), Number(a[1]) + 1);
    return null;
  } };
}
const dag = new Date().toISOString().slice(0, 10), nu = Date.now();
const veld = (kv, k, f) => Number((kv.h.get(k) || {})[f] || 0);

// ---- Kadoly: betaald, klik met pb op koop (zou een postback geven zonder binnen) en voorspellers die al verlopen zijn maar in mm:vfl staan ----
{
  const kv = nepKv(), cid = 'aaaa1111bbbb';
  kv.h.set('mm:cid:' + cid, { t: String(nu), pid: 'p1', wissel: 'w1', arm: 'a', net: 'propeller', zone: '777', camp: '55', pbs: 'koop', sub: 'SUB123456' });
  kv.h.set('mm:vfl:' + cid, { a: 'os=android;uur=14', b: 'scherm=klein', t: String(nu) });
  const r = await T.kadolyKoop(kv, { mmc: cid, waarde: 24.5, order: 'o1' });
  ja(r.ok && r.soort === 'koop' && r.zone === '777', 'Kadoly: betaalde bestelling telt als koop bij de klik en zijn zone');
  ja(veld(kv, 'mm:zu:' + dag, 'propeller|777|koop') === 1 && veld(kv, 'mm:cu:' + dag, 'propeller|55|koop') === 1, 'koop staat bij de zone en bij de campagne');
  ja(veld(kv, 'mm:w:' + dag, 'w1|a|koop') === 1 && veld(kv, 'mm:w:' + dag, 'w1|a|cent') === 2450, 'koop staat bij de arm van de wissel met het bedrag');
  ja(veld(kv, 'mm:vs:' + dag, 'g|os=android|koop') === 1 && veld(kv, 'mm:vs:' + dag, 'g|scherm=klein|koop') === 1, 'voorspellers uit mm:vfl tellen mee voor koop (mm:vf was al verlopen)');
  ja(gets.length === 0, 'geen enkele postback naar een netwerk (binnen:true), ook niet met pb op koop');
  const r2 = await T.kadolyKoop(kv, { mmc: cid, waarde: 24.5, order: 'o2' });
  ja(r2.dubbel === true && veld(kv, 'mm:zu:' + dag, 'propeller|777|koop') === 1, 'tweede bestelling op dezelfde klik telt niet nog eens');
  const r3 = await T.kadolyKoop(kv, { mmc: 'ffff0000ffff', waarde: 5, order: 'o3' });
  const r4 = await T.kadolyKoop(kv, { mmc: '', waarde: 5, order: 'o4' });
  const S = await T.terugStand(kv, 1);
  ja(!r3.ok && !r4.ok && S.bronnen.kadoly.ok === 1 && S.bronnen.kadoly.dubbel === 1 && S.bronnen.kadoly.niet.klik_verlopen === 1 && S.bronnen.kadoly.niet.geen_mmc === 1, 'controle: 1 gekoppeld, 1 dubbel, 1 verlopen klik, 1 zonder mmc');
  ja(/Kadoly-koop: 1 bij een klik/.test(T.terugTekst(S)) && /mail geopend: 0 bij een klik.*keten staat op nul/.test(T.terugTekst(S)), 'tekst: gekoppeld en niet gekoppeld, bron op nul staat erbij');
}

// ---- aanmelding bewaart de voorspellers 30 dagen; de mail wordt later gelezen en geklikt ----
{
  const kv = nepKv(), van = 'cccc2222dddd', mid = 'eeee33334444';
  kv.h.set('mm:vf:' + van, { a: 'os=ios;uur=9', b: '', t: String(nu) });
  kv.h.set('mm:cid:' + mid, { t: String(nu), pid: 'p2', modal: 'site1', arm: 'm1', seg: 'm-n', net: 'mondiad', zone: '888', camp: '66', van });
  const a = await W.uitkomst(kv, { cid: mid, soort: 'aanmelding', bron: 'modal:site1' });
  ja(a.ok && (kv.h.get('mm:vfl:' + mid) || {}).a === 'os=ios;uur=9', 'aanmelding: voorspellers van de advertentieklik bewaard onder de modal-beslissing (vfl)');
  ja(!kv.h.has('mm:vfl:' + van) && !kv.h.has('mm:vfl:zonder'), 'alleen de klik met een aanmelding krijgt een vfl, niet de advertentieklik zelf');
  kv.h.delete('mm:vf:' + van); // de 30 uur zijn voorbij
  const md0 = veld(kv, 'mm:md:' + dag, 'site1|m1|m-n|mailopen');
  await M.modalUitkomst(kv, mid, 'mailopen'); await na();
  ja(veld(kv, 'mm:md:' + dag, 'site1|m1|m-n|mailopen') === md0 + 1, 'modal-tellers voor de arm tellen mailopen precies één keer (niet dubbel door uitkomst)');
  ja(veld(kv, 'mm:zu:' + dag, 'mondiad|888|mailopen') === 1 && veld(kv, 'mm:cu:' + dag, 'mondiad|66|mailopen') === 1, 'mail geopend telt bij de zone en de campagne van de klik');
  ja(veld(kv, 'mm:vs:' + dag, 'g|os=ios|mailopen') === 1, 'mail geopend telt bij de voorspellers (uit vfl, 2 dagen later nog beschikbaar)');
  await M.modalUitkomst(kv, mid, 'open'); await na(); // Mailmind meldt zijn open als 'open': zelfde soort, telt niet nog eens
  await M.modalUitkomst(kv, mid, 'bevestigd'); await na(); // lezer zegt ja of klikt: mailklik
  ja(veld(kv, 'mm:zu:' + dag, 'mondiad|888|mailopen') === 1 && veld(kv, 'mm:zu:' + dag, 'mondiad|888|mailklik') === 1 && veld(kv, 'mm:vs:' + dag, 'g|os=ios|mailklik') === 1, 'open eenmaal en klik eenmaal bij de zone en de voorspellers');
  const S = await T.terugStand(kv, 1);
  ja(S.bronnen.mailopen.ok === 1 && S.bronnen.mailopen.dubbel === 1 && S.bronnen.mailklik.ok === 1 && S.bronnen.mailopen.zonder_voorspellers === 0, 'controle mail: open 1 gekoppeld en 1 dubbel, klik 1 gekoppeld');
  // geen vfl (aanmelding zonder bewaarde voorspellers): wel de zone, en de controle zegt het
  const mid2 = 'eeee55556666'; kv.h.set('mm:cid:' + mid2, { t: String(nu), pid: 'p3', modal: 'site1', arm: 'm1', seg: 'm-n', net: 'mondiad', zone: '999', camp: '66', van: '' });
  await M.modalUitkomst(kv, mid2, 'mailopen'); await na();
  const S2 = await T.terugStand(kv, 1);
  ja(veld(kv, 'mm:zu:' + dag, 'mondiad|999|mailopen') === 1 && S2.bronnen.mailopen.zonder_voorspellers === 1, 'zonder bewaarde voorspellers: wel de zone, en de controle telt "zonder voorspellers"');
  ja(gets.length === 0, 'mail: geen postback');
}

// ---- Amazon: artikelen per tag naar zones naar het aandeel in de kliks, zwak en apart ----
{
  const kv = nepKv(), d = dag;
  kv.h.set('mm:amz:' + d, { 'bl-bku-20': JSON.stringify({ kliks: 100, artikelen: 10, omzet: 300 }), 'zz-leeg-20': JSON.stringify({ kliks: 50, artikelen: 2 }) });
  const rij = (zone, tag, net = 'propeller') => JSON.stringify({ ty: 'go', cid: 'x', tag, zone, net });
  const lijst = []; for (let i = 0; i < 30; i++) lijst.push(rij('111', 'bl-bku-20')); for (let i = 0; i < 10; i++) lijst.push(rij('222', 'bl-bku-20')); for (let i = 0; i < 2; i++) lijst.push(rij('333', 'bl-bku-20')); lijst.push(rij('-', 'bl-bku-20'), JSON.stringify({ ty: 'u', cid: 'q' }));
  kv.l.set('mm:raw:' + d, lijst);
  const r = await T.amazonNaarZone(kv, { dag: d });
  ja(r.ok && r.zwak === true && r.tags === 1 && r.zonder_kliks.join() === 'zz-leeg-20', 'Amazon: tag met kliks verdeeld, tag zonder kliks in de log gemeld');
  const Z = await T.zoneAmazon(kv, 3), z1 = Z.find(x => x.zone === 'propeller|111'), z2 = Z.find(x => x.zone === 'propeller|222');
  ja(z1 && z1.kliks === 30 && z1.artikelen === 7.14 && z2 && z2.artikelen === 2.38 && !Z.find(x => x.zone === 'propeller|333'), 'artikelen naar aandeel in de kliks (30 en 10 van 42), zones onder 3 kliks laten we weg');
  ja(veld(kv, 'mm:zu:' + d, 'propeller|111|koop') === 0 && !kv.h.has('mm:zu:' + d), 'Amazon komt nooit in de koop-tellers van een zone (zwak bewijs, apart)');
  const r2 = await T.amazonNaarZone(kv, { dag: d }); const Z2 = await T.zoneAmazon(kv, 3);
  ja(r2.ok && Z2.find(x => x.zone === 'propeller|111').artikelen === 7.14, 'opnieuw uitrekenen telt niet dubbel');
  const S = await T.terugStand(kv, 1);
  ja(S.bronnen.amazon.ok === 2 && S.bronnen.amazon.niet.tag_zonder_kliks_in_log === 2, 'controle Amazon: gekoppelde tags en tags zonder kliks (per uitrekening, dus twee rondes)');
  ja((await T.amazonNaarZone(kv, { dag: '2020-01-01' })).ok === false && gets.length === 0, 'dag zonder Associates-cijfers: melding en geen postback');
}

console.log('\n' + ok + ' ok, ' + fout + ' fout');
process.exit(fout ? 1 : 0);
