// test lib/jacht.js zonder netwerk: node scripts/test-jacht.mjs
// (28 nov 2026, taak d4rc1s: kopersjacht per product): product herkennen, gewichten, lift met krimp, vervagen van de hypothese,
// tellen per bezoek en uitkomst, exact en variaties, verloop, grenzen van het bod, vorm voor de netwerkwacht, controle
import * as J from '../lib/jacht.js';
import { paginaUitkomst } from '../lib/mensmeter.js';

let ok = 0, fout = 0;
const ja = (c, t) => { if (c) { ok++; console.log('ok   ' + t); } else { fout++; console.log('FOUT ' + t); } };
const na = (ms = 30) => new Promise(r => setTimeout(r, ms));
function nepKv() {
  const m = new Map(), h = new Map(), ttl = new Map(), l = new Map();
  const H = k => { if (!h.has(k)) h.set(k, {}); return h.get(k); };
  const raw = async ([cmd, k, ...a]) => {
    if (cmd === 'GET') return m.has(k) ? m.get(k) : null;
    if (cmd === 'SET') { if (a.includes('NX') && m.has(k)) return null; m.set(k, a[0]); return 'OK'; }
    if (cmd === 'EXPIRE') { ttl.set(k, a[0]); return 1; }
    if (cmd === 'HINCRBY') { const o = H(k); o[a[0]] = (Number(o[a[0]]) || 0) + Number(a[1]); return o[a[0]]; }
    if (cmd === 'HSET') { const o = H(k); for (let i = 0; i + 1 < a.length; i += 2) o[a[i]] = String(a[i + 1]); return 1; }
    if (cmd === 'HGET') return (h.get(k) || {})[a[0]] ?? null;
    if (cmd === 'HGETALL') { const o = h.get(k); return o ? Object.entries(o).flat().map(String) : []; }
    if (cmd === 'LPUSH') { const x = l.get(k) || []; x.unshift(a[0]); l.set(k, x); return x.length; }
    if (cmd === 'RPUSH') { const x = l.get(k) || []; x.push(a[0]); l.set(k, x); return x.length; }
    if (cmd === 'LTRIM') { const x = l.get(k) || []; l.set(k, x.slice(Number(a[0]), Number(a[1]) + 1)); return 'OK'; }
    if (cmd === 'LRANGE') { const x = l.get(k) || []; return x.slice(Number(a[0]), Number(a[1]) + 1); }
    return null;
  };
  return { m, h, ttl, l, raw, get: async k => m.get(k) ?? null, set: async (k, v) => { m.set(k, v); return 'OK'; } };
}
const dag = new Date().toISOString().slice(0, 10), nu = Date.now();
const tabel = { US: Object.assign([], { 90210: '5', 72201: '2' }), NL: [] };

// ---- product ----
ja(J.productVan({ pg: 'mylevel.today/cdl-practice-test' }) === 'mylevel-cdl', 'landingspad cdl-practice-test = MyLevel CDL');
ja(J.productVan({ pg: 'mylevel.today/real-estate-practice-exam?x=1' }) === 'mylevel-realestate', 'landingspad real-estate-practice-exam = MyLevel real estate');
ja(J.productVan({ pg: 'mylevel.today/es/cdl/hazmat' }) === 'mylevel-cdl', 'cdl in een taalpad');
ja(J.productVan({ pg: 'mylevel.today/dmv-practice-test' }) === '' && J.productVan({ pg: 'mylevel.today/medical-terminology-practice-test' }) === '', 'andere MyLevel-pagina: geen product');
ja(J.productVan({ camp: 'MYLEVEL push REAL ESTATE pass pack US' }) === 'mylevel-realestate' && J.productVan({ camp: 'mylevel-push-real-estate-pass-pack-us' }) === 'mylevel-realestate', 'campagnelijn en productsleutel van lib/segment.js herkend');
ja(J.productVan({ camp: 'MYLEVEL push CDL pass pack US' }) === 'mylevel-cdl' && J.productVan({ camp: '12199120' }) === '', 'CDL-lijn herkend, een campagnenummer alleen zegt niets');

// ---- gewichten, krimp, vervagen ----
ja(J.GEWICHT.koop > J.GEWICHT.checkout && J.GEWICHT.checkout > J.GEWICHT.koopklik && J.GEWICHT.koopklik > J.GEWICHT.examen && J.GEWICHT.examen > 0, 'gewichten: koop > checkout > koopklik > examen');
ja(J.liftKrimp(1, 2, 0.01) < 3, 'lift met krimp: 1 uitkomst op 2 kliks wordt ' + J.liftKrimp(1, 2, 0.01).toFixed(2) + ' in plaats van 50');
ja(Math.abs(J.liftKrimp(200, 5000, 0.02) - 2) < 0.05, 'lift met krimp: bij veel kliks bijna de echte lift 2');
ja(J.liftKrimp(0, 10, 0) === 1, 'zonder uitkomsten bij het product: lift 1');
{ const a = J.vervaag({ lp: 2, m: 40, ld: 1, d: 0 }), b = J.vervaag({ lp: 2, m: 40, ld: 1, d: 40 }), c = J.vervaag({ lp: 2, m: 40, ld: 0.5, d: 4000 });
  ja(Math.abs(a.lift - 2) < 1e-9 && a.hypothese === 1, 'zonder eigen data: de hypothese helemaal (lift 2, 100%)');
  ja(Math.abs(b.lift - Math.SQRT2) < 1e-9 && b.hypothese === 0.5, 'evenveel data als sterkte: gemiddelde op logschaal (wortel 2), half hypothese');
  ja(c.lift < 0.52 && c.hypothese < 0.01, 'veel eigen data die het tegenspreekt: de data wint (' + c.lift.toFixed(2) + ')'); }

// ---- hypothese ----
{ J.zetPriors(null); const P = J.priors();
  ja(P.length >= 10 && P.some(r => r.product === 'mylevel-cdl') && P.some(r => r.product === 'mylevel-realestate'), 'hypothese geladen voor beide producten (' + P.length + ' regels)');
  ja(P.every(r => /^https:\/\//.test(r.bron.url) && r.bron.citaat && r.bron.gelezen), 'elke regel heeft een https-bron met citaat en datum');
  ja(!J.geldigePrior({ product: 'mylevel-cdl', kenmerk: 'regio', waarde: 'us-tx', richting: 'meer', lift: 2, sterkte: 10, bron: { soort: 'https', url: '' } }), 'regel zonder bron telt niet');
  ja(!J.geldigePrior({ product: 'mylevel-cdl', kenmerk: 'geslacht', waarde: 'm', richting: 'meer', lift: 2, sterkte: 10, bron: { soort: 'henkjan', citaat: 'x' } }), 'gevoelig kenmerk telt niet');
  ja(!J.geldigePrior({ product: 'mylevel-cdl', kenmerk: 'regio', waarde: 'us-tx', richting: 'meer', lift: 0.5, sterkte: 10, bron: { soort: 'henkjan', citaat: 'x' } }), 'richting en lift moeten kloppen'); }

// ---- tellen: bezoek en uitkomst ----
const kv = nepKv(), f = { os: 'android', merk: 'samsung', regio: 'us-ar', app: 'browser', con: 'wifi' };
const b1 = await J.bezoek(kv, { vid: 'aaaa0000aaaa0001', net: 'propeller', zone: '11146783', camp: '12199120', sub: '', pg: 'mylevel.today/cdl-practice-test', f, srv: { tz: 'America/Chicago', land: 'US', pc: '72201' } }, { tabel });
ja(b1 && b1.p === 'mylevel-cdl' && b1.km.zone === 'propeller:11146783' && b1.km.tk === 'android-samsung' && b1.km.regio === 'us-ar' && /^\d\d$/.test(b1.km.uur) && b1.km.kk === '2-onder-midden' && !b1.km.sz, 'bezoek: product, zone, toestelklasse, regio, uur, koopkracht; geen subzone als die er niet is');
const H = () => kv.h.get('mm:jacht:' + dag) || {};
ja(H()['mylevel-cdl|_|n'] === 1 && H()['mylevel-cdl|regio=us-ar|n'] === 1 && kv.ttl.get('mm:jacht:' + dag) <= 15 * 86400, 'tellers in een hash per dag met verloop van hoogstens 15 dagen');
ja(!JSON.stringify(H()).includes('72201') && !kv.h.get('mm:vf:aaaa0000aaaa0001').j.includes('72201'), 'privacy: geen postcode bewaard, alleen de koopkrachtemmer');
ja(await J.bezoek(kv, { vid: 'aaaa0000aaaa0002', net: 'chatgpt.com', zone: '-', pg: 'mylevel.today/cdl-practice-test', f }) === null && H()['_m|mylevel-cdl|onbetaald'] === 1, 'onbetaald bezoek telt niet in het profiel');
ja(await J.bezoek(kv, { vid: 'aaaa0000aaaa0003', net: 'propeller', zone: '1', pg: 'mylevel.today/dmv-practice-test', f }) === null && H()['_m|onbekend_product'] === 1, 'pagina zonder product: alleen de controle');
await J.toestelLeeftijd(kv, 'aaaa0000aaaa0001', '2-3 jaar oud');
ja(H()['mylevel-cdl|tl=2-3-jaar-oud|n'] === 1, 'leeftijd van het toestel (51Degrees) komt later bij het bezoek');
const e1 = await J.uitkomst(kv, { vid: 'aaaa0000aaaa0001', soort: 'checkout' });
ja(e1 && e1.s === 'checkout' && H()['mylevel-cdl|_|checkout'] === 1 && H()['mylevel-cdl|zone=propeller:11146783|checkout'] === 1 && H()['mylevel-cdl|tl=2-3-jaar-oud|checkout'] === 1, 'uitkomst telt bij dezelfde kenmerkwaarden als het bezoek');
ja(kv.l.get('mm:jachtu').length === 1 && kv.ttl.get('mm:jachtu') <= 40 * 86400, 'diepe stap in de jachtlijst met verloop');
ja(await J.uitkomst(kv, { vid: 'ffff0000ffff0009', soort: 'koop' }) === null && H()['_m|zonder_bezoek_koop'] === 1, 'uitkomst zonder bekend bezoek: alleen de controle');
ja(await J.uitkomst(kv, { vid: 'aaaa0000aaaa0001', soort: 'prijs' }) === null, 'prijs zien is geen diepe stap');

// precies eenmaal via de bestaande poort van paginaUitkomst (SET NX op mm:vfu)
{ const k2 = nepKv(); await J.bezoek(k2, { vid: 'bbbb0000bbbb0001', net: 'propeller', zone: '10943332', pg: 'mylevel.today/real-estate-practice-exam', f: { os: 'ios', regio: 'us-fl' }, srv: { tz: 'America/New_York' } }, { tabel });
  await k2.raw(['HSET', 'mm:vf:bbbb0000bbbb0001', 'p', 'os=ios', 'ps', 'ml']);
  await paginaUitkomst(k2, { vid: 'bbbb0000bbbb0001', soort: 'examen' }); await paginaUitkomst(k2, { vid: 'bbbb0000bbbb0001', soort: 'examen' }); await na(80);
  ja((k2.h.get('mm:jacht:' + dag) || {})['mylevel-realestate|_|examen'] === 1, 'paginaUitkomst: examen twee keer gemeld telt een keer in de kopersjacht'); }

// ---- profiel ----
{ const hs = [Object.entries(H()).flat().map(String)]; J.zetPriors(null); const p = J.profielUit(hs, 'mylevel-cdl');
  const reg = p.kenmerken.find(k => k.kenmerk === 'regio'), ar = reg.waarden.find(w => w.waarde === 'us-ar'), nd = reg.waarden.find(w => w.waarde === 'us-nd');
  ja(p.kliks === 1 && p.gewogen === J.GEWICHT.checkout, 'profiel: 1 bezoek, gewogen punten van een checkout');
  ja(nd && nd.kliks === 0 && nd.aandeelHypothese === 100 && Math.abs(nd.lift - 1.99) < 0.01, 'hypothese zonder eigen data: 100% hypothese met de lift uit de bron');
  ja(ar && ar.aandeelHypothese > 90 && ar.aandeelData > 0, 'een klik met een checkout neemt maar een klein deel van de hypothese over');
  ja(ar.liftData === null, 'te weinig kliks voor een eigen lift: niets verzonnen'); }

// ---- jachtdoelen ----
const ev = (s, dagenOud, x = {}) => Object.assign({ t: nu - dagenOud * 864e5, p: 'mylevel-cdl', s, net: 'propeller', zone: '111', sz: 'a7', tk: 'ios', regio: 'us-tx', uur: '23', c: '12199120' }, x);
{ const prof = { kenmerken: [{ kenmerk: 'regio', waarden: [{ waarde: 'us-ar', lift: 1.9 }, { waarde: 'us-tx', lift: 1.3 }, { waarde: 'us-ca', lift: 0.8 }] }, { kenmerk: 'zone', waarden: [{ waarde: 'propeller:222', lift: 2, liftData: 2, marge: [1.3, 3] }, { waarde: 'propeller:333', lift: 1.5, liftData: 1.5, marge: [0.8, 2.5] }] }] };
  const D = J.doelenUit([ev('koop', 1)], prof), ex = D.find(d => d.soort === 'exact');
  ja(ex && ex.zone === '111' && ex.sz === 'a7' && ex.tk === 'ios' && ex.regio === 'us-tx' && ex.uur === '23', 'exact: zelfde zone, subzone, toestelklasse, regio en uur');
  ja(D.every(d => d === ex || d.vertrouwen < ex.vertrouwen), 'elke variatie heeft minder vertrouwen dan exact');
  ja(D.some(d => d.soort === 'andere-subzones' && d.sz === '*') && D.some(d => d.soort === 'uur-1' && d.uur === '22') && D.some(d => d.soort === 'uur+1' && d.uur === '00') && D.some(d => d.soort === 'uur+2' && d.uur === '01'), 'variaties: andere subzones en een of twee uur eerder of later (over middernacht)');
  ja(D.some(d => d.soort === 'vergelijkbare-regio' && d.regio === 'us-ar') && !D.some(d => d.soort === 'vergelijkbare-regio' && (d.regio === 'us-ca' || d.regio === 'us-tx')), 'vergelijkbare regio: alleen regio\'s met lift vanaf 1,2 en niet de eigen');
  ja(D.some(d => d.soort === 'lijkt-op-profiel' && d.zone === '222') && !D.some(d => d.zone === '333'), 'lijkt op het profiel: alleen zones met ondergrens boven 1');
  ja(D.every(d => d.redenen.length && /koop op \d{4}-\d{2}-\d{2}/.test(d.redenen[0]) && /^\d{4}-\d{2}-\d{2}$/.test(d.verloopt)), 'elk doel met reden (uitkomst, wanneer, gewicht) en verloopdatum');
  ja(J.doelenUit([ev('examen', 8)], prof).length === 0 && J.doelenUit([ev('koop', 8)], prof).length > 0 && J.doelenUit([ev('koop', 31)], prof).length === 0, 'verloop: examen na 7 dagen weg, koop jaagt 30 dagen');
  const kk = J.doelenUit([ev('koopklik', 0)], prof).find(d => d.soort === 'exact'), vr = J.doelenUit([ev('koop', 0)], prof).find(d => d.soort === 'exact'), ou = J.doelenUit([ev('koop', 20)], prof).find(d => d.soort === 'exact');
  ja(kk.vertrouwen < vr.vertrouwen && ou.vertrouwen < vr.vertrouwen, 'vertrouwen: zwaarder bij een koop dan bij een koopklik, lager naarmate de stap ouder is');
  const twee = J.doelenUit([ev('checkout', 0), ev('koopklik', 0)], prof).find(d => d.soort === 'exact');
  ja(twee.redenen.length === 2 && twee.vertrouwen <= 1, 'twee stappen op hetzelfde doel tellen samen, hoogstens 1'); }

// ---- bod ----
{ const zk = J.bodAdvies({ vertrouwen: 1, redenen: ['checkout op 2026-11-28 (gewicht 5)'] }), mk = J.bodAdvies({ vertrouwen: 1, redenen: ['koop op 2026-11-28 (gewicht 10)'] });
  ja(zk.richting === 'gelijk' && zk.factor === 1 && /weigert/.test(zk.waarom), 'zonder koop geen hoger bod (propellerads-mcp weigert dat zonder omzet)');
  ja(mk.richting === 'hoger' && mk.factor <= J.GRENS.factorMax && mk.omzet === true, 'met een koop: hoger, hoogstens x' + J.GRENS.factorMax);
  ja(/\$10 per dag per campagne/.test(mk.grens) && /\$100 per dag per saldo/.test(mk.grens) && mk.gedragenDoor.length === 1, 'de grens en de dragende uitkomsten staan bij elk advies'); }

// ---- netwerkwacht en controle ----
{ const r = await J.jacht(kv, { vers: true }), n = J.voorNet(r, 'propeller'), l = n.lijnen.find(x => x.product === 'mylevel-cdl');
  ja(n.voorstel && l.aparteCampagne && l.witteLijst.includes('11146783') && l.zones.every(z => /^\d+$/.test(z.zone) && z.bod), 'netwerkwacht: aparte campagne per lijn, witte lijst met zonenummers en bodadvies');
  ja(n.regels.some(x => /nooit de witte lijst op de brede campagne/.test(x)), 'regel: nooit op de brede campagne');
  const t = J.tekst(r, await J.stand(kv)); ja(/MyLevel CDL/.test(t) && /MyLevel real estate/.test(t) && /bls\.gov/.test(t), 'leesbare pagina: beide producten met hypothese en bron'); }
{ const k3 = nepKv(); await k3.raw(['HSET', 'mm:vs:' + dag, 'pml|net=propeller|n', 25]); const s = await J.stand(k3, { r: await J.jacht(k3, { dagen: 7, vers: true }) }); // vers: de korte cache hoort bij een database
  ja(s.alarm.some(a => /MEETGAT/.test(a)), 'controle: betaalde MyLevel-bezoeken zonder tellers per product = meetgat');
  ja(s.alarm.some(a => /MyLevel CDL: wel een hypothese, maar geen diepe stap/.test(a)), 'controle: hypothese zonder diepe stap in 7 dagen wordt hardop gezegd');
  const s2 = await J.stand(kv, { r: await J.jacht(kv, { dagen: 7, vers: true }) }); ja(!s2.alarm.some(a => /MEETGAT/.test(a)) && s2.producten.find(p => p.product === 'mylevel-cdl').jachtdoelen > 0, 'controle: tellers lopen, wel jachtdoelen, geen meetgat'); }

console.log('\n' + ok + ' goed, ' + fout + ' fout');
process.exit(fout ? 1 : 0);
