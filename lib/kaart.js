// Clickmind-overzicht in gewone taal voor Henkjan (14 okt 2026: "begrijpbaar Clickmind-overzicht, met zoveel mogelijk de sites waar
// verkeer vandaan komt, en ALLE data"). Beschermde host: https://hjdk-api-henq.vercel.app/api/mm/clickmind
// Huisstijl outname.now: Inter, wit, één blauw #2B47C4, zachte vlakken #EEF1FC, pillen.
import { zones } from './mensmeter.js';
import { instelling } from './leer.js';
import { alleModals } from './modal.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const e = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const pct = (a, b) => (b ? Math.round(1000 * a / b) / 10 : null);
const dagStr = (o = 0) => new Date(Date.now() - o * 864e5).toISOString().slice(0, 10);
const NETNAAM = { propeller: 'PropellerAds', mondiad: 'Mondiad', richads: 'RichAds', mgid: 'MGID', clickadu: 'Clickadu', onbekend: 'onbekend' };
const OORDEEL = { zwart: ['nep', 'r'], verdacht: ['verdacht', 'o'], wit: ['echte mensen', 'g'], onbekend: ['te weinig gemeten', ''] };

export async function clickmindKaart(kv) {
  const D = [dagStr(0), dagStr(1), dagStr(2)];
  const [z, inst, leer, mds, bronH, ...blok] = await Promise.all([
    zones(kv, { dagen: 3 }), instelling(kv).catch(() => ({})), kv.get('mm:leer:laatst').catch(() => null), alleModals(kv).catch(() => []),
    Promise.all(D.map(d => kv.raw(['HGETALL', 'mm:bron:' + d]).catch(() => null))),
    ...['propeller', 'mondiad', 'richads', 'mgid'].map(n => kv.get('mm:blok:' + n).catch(() => null)),
  ]);
  const nets = ['propeller', 'mondiad', 'richads', 'mgid'];
  const blokKlaar = new Set(), blokWacht = new Set();
  blok.forEach((b, i) => { if (!b) return; for (const x of b.zones || []) blokKlaar.add(nets[i] + '|' + x); for (const x of b.wachtOpHenkjan || []) blokWacht.add(nets[i] + '|' + x); });
  const mensZ = new Set(((leer && leer.menszones) || []).map(m => m.netwerk + '|' + m.zone));

  // herkomst per zone en in totaal (sinds 15 okt 01:00 UTC)
  const B = {}, perZone = {};
  for (const h of bronH) for (let i = 0; h && i + 1 < h.length; i += 2) {
    const f = String(h[i]), v = N(h[i + 1]), p = f.split('|'); if (p.length < 4) continue;
    const veld = p[p.length - 1], bron = p[p.length - 2], net = p[0], zone = p.slice(1, p.length - 2).join('|');
    const b = B[bron] || (B[bron] = { bron, n: 0, m: 0, nets: new Set(), zones: new Set() }); if (veld === 'n') b.n += v; if (veld === 'm') b.m += v; b.nets.add(net); b.zones.add(net + '|' + zone);
    const zk = net + '|' + zone, pz = perZone[zk] || (perZone[zk] = {}); if (veld === 'n') pz[bron] = N(pz[bron]) + v;
  }
  const bronnen = Object.values(B).sort((a, b) => b.n - a.n);
  const bronTot = bronnen.reduce((s, b) => s + b.n, 0), bekend = bronnen.filter(b => b.bron !== 'onbekend').reduce((s, b) => s + b.n, 0);
  const bronLabel = b => b === 'onbekend' ? 'pushmelding of onbekend' : b.startsWith('app:') ? 'app ' + b.slice(4) : b.startsWith('site:') ? b.slice(5) : b;
  const topBron = zk => { const pz = perZone[zk]; if (!pz) return ''; const t = Object.entries(pz).sort((a, b) => b[1] - a[1]); const echt = t.filter(([b]) => b !== 'onbekend'); return echt.length ? echt.slice(0, 2).map(([b, n]) => bronLabel(b) + ' (' + n + ')').join(', ') : 'push/onbekend'; };

  // per netwerk
  const per = {};
  for (const r of z.zones) { if (r.netwerk === 'test') continue; const p = per[r.netwerk] || (per[r.netwerk] = { v: 0, js: 0, go: 0, mens: 0, dc: 0, zones: 0, zwart: 0, wit: 0, verdacht: 0 }); p.v += N(r.v); p.js += N(r.js); p.go += N(r.go); p.mens += N(r.mens); p.dc += N(r.dc); p.zones++; if (p[r.oordeel] != null) p[r.oordeel]++; }
  const tot = Object.values(per).reduce((a, p) => { for (const k of Object.keys(p)) a[k] = N(a[k]) + p[k]; return a; }, {});

  const pill = (t, c) => '<span class="p ' + (c || '') + '">' + e(t) + '</span>';
  const tabel = (kop, rijen, leeg) => '<div class="t"><table><thead><tr>' + kop.map(k => '<th>' + e(k) + '</th>').join('') + '</tr></thead><tbody>' + (rijen.length ? rijen.join('') : '<tr><td colspan="' + kop.length + '" class="s">' + e(leeg || 'nog niets') + '</td></tr>') + '</tbody></table></div>';
  const H = 'https://hjdk-api-henq.vercel.app';
  let h = '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Clickmind</title>'
    + '<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">'
    + '<style>:root{--b:#2B47C4;--z:#EEF1FC;--t:#1d2433;--s:#5b6478}*{box-sizing:border-box}body{margin:0;background:#fff;color:var(--t);font:16px/1.5 Inter,system-ui,sans-serif}main{max-width:1060px;margin:0 auto;padding:28px 16px 60px}'
    + 'h1{font-size:30px;margin:0 0 4px;letter-spacing:-.02em}h2{font-size:20px;margin:36px 0 10px}p{margin:6px 0}.s{color:var(--s);font-size:14px}'
    + '.k{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:20px 0}.k div{background:var(--z);border-radius:16px;padding:16px}.k b{display:block;font-size:26px;color:var(--b)}.k span{font-size:14px;color:var(--s)}'
    + '.v{background:var(--z);border-radius:16px;padding:14px 18px}.v li{margin:4px 0}.t{overflow-x:auto;border-radius:14px;border:1px solid #e3e7f5}table{border-collapse:collapse;width:100%;font-size:14px}th{background:var(--z);text-align:left;font-weight:600;padding:9px 10px;white-space:nowrap}td{padding:8px 10px;border-top:1px solid #eef0f6;vertical-align:top}'
    + '.p{display:inline-block;border-radius:99px;padding:2px 10px;font-size:13px;background:#f1f2f6;color:var(--s);white-space:nowrap}.p.g{background:#e6f4ea;color:#1e7a3c}.p.r{background:#fdecec;color:#b42318}.p.o{background:#fff4e0;color:#9a5b00}.p.b{background:var(--z);color:var(--b)}'
    + 'a{color:var(--b)}a.k2{display:inline-block;background:var(--b);color:#fff;border-radius:99px;padding:8px 16px;text-decoration:none;margin:4px 6px 4px 0;font-size:14px}</style></head><body><main>';
  h += '<h1>Clickmind</h1><p class="s">Wat Clickmind de laatste 3 dagen zag van het betaalde verkeer op je eigen pagina\'s en via /go. Bijgewerkt ' + e(new Date().toISOString().slice(0, 16).replace('T', ' ')) + ' UTC.</p>';
  h += '<div class="k"><div><b>' + N(tot.v).toLocaleString('nl-NL') + '</b><span>bezoeken en kliks</span></div><div><b>' + N(tot.js).toLocaleString('nl-NL') + '</b><span>gemeten in de browser</span></div><div><b>' + (pct(tot.mens, tot.js) ?? '-') + '%</b><span>echte mensen van wat gemeten is</span></div><div><b>' + N(tot.zwart) + ' / ' + N(tot.wit) + '</b><span>zones nep / zones met echte mensen</span></div></div>';

  h += '<h2>Wat er nu vanzelf gebeurt</h2><div class="v"><ul>';
  h += '<li>Blokkeren door Clickmind: ' + (inst.blokkeren ? pill('aan', 'g') : pill('uit')) + ' ' + blok.map((b, i) => b ? NETNAAM[nets[i]] + ' ' + (b.zones || []).length + ' zones klaar' + ((b.wachtOpHenkjan || []).length ? ', ' + b.wachtOpHenkjan.length + ' wachten op jou' : '') : null).filter(Boolean).join('; ') + '. Elke netwerkwacht zet die zones op de uitsluitlijst van elke campagne waar ze geld kosten, nooit de grootste bron.</li>';
  const modAan = mds.filter(m => !m.uit).map(m => m.site);
  h += '<li>Lerende modal: ' + (modAan.length ? 'aan op ' + e(modAan.join(', ')) + ', stuurt bezoekers naar todayin' : 'overal uit') + '.</li>';
  h += '<li>Leerronde elk uur op :12' + (leer ? ', laatste ' + e(String(leer.bijgewerkt).slice(11, 16)) + ' UTC' : '') + '. Terugbetalingsdossier elke nacht om 03:40 UTC (indienen alleen op jouw woord).</li></ul></div>';

  h += '<h2>Per netwerk</h2>' + tabel(['netwerk', 'bezoeken', 'gemeten', 'echte mensen', 'datacenter', 'zones nep', 'zones echt', 'zones'],
    Object.entries(per).sort((a, b) => b[1].v - a[1].v).map(([n, p]) => '<tr><td><b>' + e(NETNAAM[n] || n) + '</b></td><td>' + p.v + '</td><td>' + p.js + '</td><td>' + (pct(p.mens, p.js) ?? '-') + '%</td><td>' + (pct(p.dc, p.v) ?? '-') + '%</td><td>' + p.zwart + '</td><td>' + p.wit + '</td><td>' + p.zones + '</td></tr>'));

  h += '<h2>Waar het verkeer vandaan komt</h2><p class="s">Gemeten sinds 15 okt 01:00 UTC. ' + (bronTot ? Math.round(100 * bekend / bronTot) + '% van ' + bronTot + ' bezoeken heeft een bekende site of app.' : 'Nog geen bezoeken met herkomst.') + ' Een pushmelding komt van de telefoon zelf, niet van een site: daar is de zone het kleinste dat we zien. In-page, onclick en apps laten wel een site of app zien.</p>';
  h += tabel(['herkomst', 'bezoeken', 'echte mensen', 'netwerken', 'zones'], bronnen.slice(0, 40).map(b => '<tr><td><b>' + e(bronLabel(b.bron)) + '</b></td><td>' + b.n + '</td><td>' + b.m + (b.n ? ' (' + pct(b.m, b.n) + '%)' : '') + '</td><td>' + e([...b.nets].map(n => NETNAAM[n] || n).join(', ')) + '</td><td>' + b.zones.size + '</td></tr>'), 'De eerste bezoeken met herkomst komen binnen zodra er weer betaald verkeer op je pagina\'s of via /go loopt.');

  h += '<h2>Zones</h2><p class="s">Laatste 3 dagen, meeste bezoeken bovenaan. Nep = bezocht maar nooit een mens. Echte mensen = minstens 1 mens en 20% of meer van wat gemeten is.</p>';
  const zl = z.zones.filter(r => r.netwerk !== 'test'), zToon = zl.filter(r => N(r.v) >= 5 || r.oordeel !== 'onbekend').slice(0, 80);
  h += tabel(['netwerk', 'zone', 'bezoeken', 'echte mensen', 'oordeel', 'waarom', 'herkomst', 'actie'], zToon.map(r => {
    const zk = r.netwerk + '|' + r.zone, o = OORDEEL[r.oordeel] || [r.oordeel, ''];
    const act = mensZ.has(zk) ? pill('menszone: nooit blokkeren', 'g') : blokKlaar.has(zk) ? pill('wordt geblokkeerd', 'r') : blokWacht.has(zk) ? pill('wacht op jou (grootste bron)', 'o') : '';
    return '<tr><td>' + e(NETNAAM[r.netwerk] || r.netwerk) + '</td><td>' + e(r.zone) + '</td><td>' + N(r.v) + '</td><td>' + (r.mensPct == null ? '-' : r.mensPct + '%') + '</td><td>' + pill(o[0], o[1]) + '</td><td class="s">' + e(r.waarom || '') + '</td><td class="s">' + e(topBron(zk)) + '</td><td>' + act + '</td></tr>';
  }));
  if (zl.length > zToon.length) h += '<p class="s">Plus ' + (zl.length - zToon.length) + ' zones met minder dan 5 bezoeken en nog geen oordeel (alles staat in Zones 7 dagen hieronder).</p>';

  const ak = leer && leer.aankomst && leer.aankomst.laagste ? leer.aankomst.laagste : [];
  h += '<h2>Betaald tegen aangekomen (PropellerAds, vandaag)</h2><p class="s">Kliks die PropellerAds rekent tegen kliks die echt bij ons aankomen. Onder de 30% is nep.</p>';
  h += tabel(['zone', 'betaald', 'aangekomen', 'aankomst'], ak.slice(0, 20).map(a => '<tr><td>' + e(a.zone) + '</td><td>' + N(a.betaald) + '</td><td>' + N(a.aangekomen) + '</td><td>' + pill(a.pct + '%', a.pct < 30 ? 'r' : a.pct < 60 ? 'o' : 'g') + '</td></tr>'));

  const v = dagStr(1);
  h += '<h2>Alle data</h2><p class="s">Alles wat Clickmind per klik en per bezoek vastlegt, per dag te downloaden (JSON; terugbetaling ook als CSV).</p><p>'
    + '<a class="k2" href="' + H + '/api/mm/export?dag=' + D[0] + '&n=5000">Kliks via /go vandaag</a><a class="k2" href="' + H + '/api/mm/export?dag=' + v + '&n=5000">Kliks via /go gisteren</a>'
    + '<a class="k2" href="' + H + '/api/mm/export?soort=pagina&dag=' + D[0] + '&n=5000">Paginabezoeken vandaag</a><a class="k2" href="' + H + '/api/mm/zones?dagen=7">Zones 7 dagen</a>'
    + '<a class="k2" href="' + H + '/api/mm/patronen?dagen=3">Botfarms</a><a class="k2" href="' + H + '/api/mm/amazonmeter?dag=' + v + '">Amazon-meter gisteren</a>'
    + '<a class="k2" href="' + H + '/api/mm/terugbetaling?net=propeller&van=' + v + '&tot=' + v + '&formaat=csv">Terugbetaling gisteren (CSV)</a><a class="k2" href="' + H + '/api/mm/overzicht">Technisch overzicht</a></p>';
  h += '<div class="v"><b>Per klik en per bezoek</b><ul><li>Netwerk, campagne, zone, advertentie en klik-id van het netwerk.</li><li>Server: land, regio, stad, tijdzone, netwerk van de provider (ASN), datacenter of niet, TLS-vingerafdruk, alle browserkoppen en hun volgorde, app (Android), herkomst (site), IP alleen als netwerkdeel en versleutelde code.</li>'
    + '<li>Browser (op je eigen pagina\'s en de /go-meetpagina): vingerafdruk, scherm, WebGL, batterij, verbinding, toestel, headless of emulator, tijdzone, zichtbaar en aangeraakt.</li><li>Persoon: dezelfde bezoeker over dagen, zones en netwerken heen (eigen cookie, 6 maanden), terugkomen en herhaalkliks.</li><li>Uitkomsten: echt, actie, aanmelding en koop, per zone en campagne.</li></ul></div>';
  return h + '</main></body></html>';
}
