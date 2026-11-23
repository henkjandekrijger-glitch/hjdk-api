// Vroege voorspeller (Henkjan 23 nov 2026: "Ja doe ." op het voorstel: leer welke signalen uit de eerste minuut van een bezoek later
// een verkoop, aanmelding of actie voorspellen, en oordeel zo na een paar dozijn bezoekers in plaats van na dagen; slechte advertenties
// gaan dan uren eerder uit. Idee uit "What If We Could Compute Our Way Out of Guesswork?" (Life in the Singularity, 23 nov 2026):
// batterijonderzoekers testten 224 laadmethodes in 16 dagen in plaats van 500, omdat de eerste metingen al voorspelden hoe lang een
// batterij meegaat.)
//
// Data (alles bestaat al, niets extra per bezoek): de ruwe Clickmind-log in Blob en Redis (lib/ruwarchief.js leesRuwDag):
//   raw:  go-regels (klik via /go of /w: cid, net, camp, zone, cr = advertentie-id) en u-regels (uitkomst per cid: actie, aanmelding, koop ...)
//   rawp: paginabezoeken (vid, mmc = cid van de klik, gedrag in c: tijd, aanrakingen, scrollen, eerste tik) en sinds 23 nov pu-regels
//         (uitkomst per vid via /api/mm/puit, lib/mensmeter.js paginaUitkomst), zodat ook sites zonder /go (todayin Curaçao, Kadoly) leren.
// Model: per site een logistische regressie op ~22 vroege kenmerken (alleen meetmomenten tot 45 s en van voor de uitkomst), doel = de
// diepste uitkomst met genoeg voorbeelden (koop, dan aanmelding, dan actie). Getoetst op een vaste vijfde van de bezoekers (AUC).
// Oordeel: per advertentie (net|campagne|advertentie), zone, campagne en pagina de verwachte uitkomsten van de laatste 3 dagen tegen het
// gemiddelde van de betaalde bezoekers, gekrompen naar het gemiddelde (K bezoekers). "uit" = na minN bezoekers minder dan de helft van
// gemiddeld en ook de echte uitkomsten (gekrompen) onder 75%; "sterk" = meer dan 1,6x. Een advertentie die niemand raakt is zo na ~30-50 bezoekers uit.
// Controle (CLAUDE.md "Nooit vastlopen"): een model telt alleen als AUC >= 0,62 met minstens 5 positieve toetsbezoeken, en elke ronde
// kijkt of de oordelen van 3 dagen eerder uitkwamen (echte uitkomsten per bezoek daarna). Klopt minder dan 60% van de uit-oordelen,
// dan gaat die site vanzelf op "alleen melden" tot het weer klopt. Netwerken handelen alleen op /api/mm/vroeguit (betrouwbaar = ja).
import { leesRuwDag } from './ruwarchief.js';

export const VROEG = 'mm:vroeg:laatst', VROEG_HIST = 'mm:vroeg:hist';
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const DOELEN = [ // diepste eerst; welke u-soorten tellen als dat doel
  ['koop', ['koop', 'betaald']],
  ['aanmelding', ['aanmelding', 'bevestigd', 'abonnee', 'lid']],
  ['actie', ['actie', 'dialoog', 'mand', 'kassa', 'bewust', 'klik', 'deel']],
];
const DOEL_VAN = Object.fromEntries(DOELEN.flatMap(([d, l]) => l.map(s => [s, d])));
const RANG = { actie: 1, aanmelding: 2, koop: 3 };
export const INSTEL = { dagen: 8, recent: 3, minPos: 20, minN: 30, K: 15, uit: 0.5, sterk: 1.6, aucMin: 0.62, toetsPosMin: 5, rijpUur: 24, maxT: 45000, controleMin: 0.6 };

const HOOFDTAAL = { us: 'en', gb: 'en', ca: 'en', au: 'en', nz: 'en', ie: 'en', de: 'de', at: 'de', ch: 'de', nl: 'nl', be: 'nl', fr: 'fr', es: 'es', mx: 'es', it: 'it', br: 'pt', pt: 'pt', cw: 'nl', co: 'es', ve: 'es', ar: 'es' };
export const KENMERKEN = ['basis', 'mens', 'interactie', '3s in beeld', 'tijdzone klopt niet', 'datacenter', 'headless/emulator', 'tijd op pagina', 'aangeraakt', 'aanrakingen',
  'gescrold', 'scrollen', 'scrolldiepte', 'eerste tik binnen 5 s', 'spreiding aanrakingen', 'iPhone', 'Android', 'in een app', 'taal past bij land', 'nacht bij bezoeker',
  'licht toestel (<=2 GB)', 'terugkomer', 'mensmeter-score'];

function lokaalUur(tz, t) { try { return N(new Intl.DateTimeFormat('en-US', { timeZone: tz || 'UTC', hour: 'numeric', hourCycle: 'h23' }).format(new Date(t))) % 24; } catch (e) { return new Date(t).getUTCHours(); } }
const lg = (x, max) => Math.min(1, Math.log1p(Math.max(0, N(x))) / Math.log1p(max));

// kenmerken van één meetmoment (paginaregel). Alles tussen 0 en 1.
export function kenmerk(r) {
  const c = r.c || {}, v = r.vlag || {}, ua = String(r.ua || c.ua || ''), land = String(r.land || '').toLowerCase();
  const taal = (/^([a-z]{2})/i.exec(String(r.al || c.lang || '')) || [])[1];
  const uur = lokaalUur(r.tz || c.tz, N(r.t) || Date.now());
  return [1, v.mens ? 1 : 0, v.int ? 1 : 0, v.vis3 ? 1 : 0, v.tz ? 1 : 0, (v.dc || r.dc === true) ? 1 : 0, (v.hl || v.em || N(c.wd) === 1) ? 1 : 0,
    lg(Math.min(N(c.t), INSTEL.maxT) / 1000, 45), N(c.nt) > 0 ? 1 : 0, lg(c.nt, 30), N(c.sc) > 0 ? 1 : 0, lg(c.sc, 50), lg(c.sd, 100),
    (c.t1 != null && N(c.t1) > 0 && N(c.t1) < 5000) ? 1 : 0, N(c.sp) > 20 ? 1 : 0, /iPhone|iPad|iPod/.test(ua) ? 1 : 0, /Android/.test(ua) ? 1 : 0,
    (r.xrw || /; wv\)|FBAN|FBAV|Instagram|TikTok/.test(ua)) ? 1 : 0, (taal && HOOFDTAAL[land] && taal.toLowerCase() === HOOFDTAAL[land]) ? 1 : 0,
    uur < 6 ? 1 : 0, (N(c.mem) > 0 && N(c.mem) <= 2) ? 1 : 0, v.rep ? 1 : 0, Math.min(1, Math.max(0, N(r.score) / 100))];
}
export const siteVan = pg => String(pg || '').split('/')[0].toLowerCase().replace(/^www\./, '').slice(0, 40) || '?';
const padVan = pg => { const s = String(pg || ''); const i = s.indexOf('/'); return (i < 0 ? '/' : s.slice(i)).slice(0, 80); };
const vijfde = vid => (parseInt(String(vid).slice(-4), 16) || 0) % 5 === 0; // vaste toetsgroep

// ---- logistische regressie (Newton, L2) ----
function los(A, b) { // Gauss met pivot
  const n = b.length, M = A.map((r, i) => r.concat([b[i]]));
  for (let i = 0; i < n; i++) {
    let p = i; for (let k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k;
    [M[i], M[p]] = [M[p], M[i]]; const d = M[i][i] || 1e-9;
    for (let k = i + 1; k < n; k++) { const f = M[k][i] / d; if (!f) continue; for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j]; }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / (M[i][i] || 1e-9); }
  return x;
}
const sig = z => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, z))));
export const kans = (w, x) => { let z = 0; for (let i = 0; i < w.length; i++) z += w[i] * x[i]; return sig(z); };
export function train(X, y, { l2 = 1, iter = 12 } = {}) {
  const d = X[0].length, pos = y.reduce((a, b) => a + b, 0);
  const w = new Array(d).fill(0); w[0] = Math.log((pos + 0.5) / (y.length - pos + 0.5));
  for (let it = 0; it < iter; it++) {
    const g = new Array(d).fill(0), H = Array.from({ length: d }, () => new Array(d).fill(0));
    for (let n = 0; n < X.length; n++) {
      const x = X[n], p = kans(w, x), e = p - y[n], s = p * (1 - p);
      for (let i = 0; i < d; i++) { if (!x[i]) continue; g[i] += e * x[i]; const sx = s * x[i]; for (let j = i; j < d; j++) if (x[j]) H[i][j] += sx * x[j]; }
    }
    for (let i = 1; i < d; i++) { g[i] += l2 * w[i]; H[i][i] += l2; }
    for (let i = 0; i < d; i++) for (let j = 0; j < i; j++) H[i][j] = H[j][i];
    const st = los(H, g); let m = 0; for (let i = 0; i < d; i++) { w[i] -= st[i]; m = Math.max(m, Math.abs(st[i])); }
    if (m < 1e-5) break;
  }
  return w;
}
export function auc(p, y) {
  const r = p.map((v, i) => [v, y[i]]).sort((a, b) => a[0] - b[0]); let pos = 0, neg = 0, som = 0, i = 0;
  while (i < r.length) { let j = i; while (j < r.length && r[j][0] === r[i][0]) j++; const rang = (i + j + 1) / 2; for (let k = i; k < j; k++) if (r[k][1]) { pos++; som += rang; } else neg++; i = j; }
  return pos && neg ? (som - pos * (pos + 1) / 2) / (pos * neg) : null;
}

// ---- data van de laatste dagen ----
export async function lees(kv, dagen, tijd) {
  const klik = new Map(), uit = new Map(), bezoek = new Map(), t0 = Date.now(); let volledig = true, rijen = 0;
  const D = Array.from({ length: dagen }, (_, i) => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
  const zetUit = (sleutel, soort, t) => { const d = DOEL_VAN[soort]; if (!d) return; const o = uit.get(sleutel) || {}; if (!o[d] || t < o[d]) o[d] = t; uit.set(sleutel, o); };
  for (const d of D) {
    if (Date.now() - t0 > tijd) { volledig = false; break; }
    const r1 = await leesRuwDag(kv, 'raw', d, x => {
      rijen++;
      if (x.ty === 'go' && x.cid) klik.set(x.cid, { cr: x.cr && x.cr !== '-' ? String(x.cr) : '', net: x.net || '', camp: x.camp || '', zone: x.zone || '', w: x.p || '' });
      else if (x.ty === 'u' && x.cid) zetUit('c:' + x.cid, String(x.soort || ''), N(x.t));
    }, { tijd: Math.max(5000, tijd - (Date.now() - t0)) / 2 });
    const r2 = await leesRuwDag(kv, 'rawp', d, x => {
      rijen++;
      if (x.ty === 'pu' && x.vid) { zetUit('v:' + x.vid, String(x.soort || ''), N(x.t)); return; }
      if (x.ty !== 'p' || !x.vid) return;
      const ct = N(x.c && x.c.t); const b = bezoek.get(x.vid) || { vid: x.vid, site: siteVan(x.pg), pad: padVan(x.pg), mmc: '', net: x.net, camp: x.camp, zone: x.zone, cr: x.cr && x.cr !== '-' ? x.cr : '', t0: N(x.t), m: [] };
      if (x.c && /^[0-9a-f]{8,24}$/.test(String(x.c.mmc || ''))) b.mmc = String(x.c.mmc);
      if (!b.cr && x.c && x.c.cr) b.cr = String(x.c.cr).replace(/[^0-9A-Za-z_-]/g, '').slice(0, 30);
      if (ct <= INSTEL.maxT && b.m.length < 4) b.m.push({ t: N(x.t), x: kenmerk(x) });
      b.t0 = Math.min(b.t0, N(x.t)); bezoek.set(x.vid, b);
    }, { tijd: Math.max(5000, tijd - (Date.now() - t0)) });
    if (!r1.volledig || !r2.volledig) volledig = false;
  }
  return { klik, uit, bezoek, volledig, rijen, dagen: D };
}

// laatste meetmoment van voor de uitkomst (geen lek: wat er na de uitkomst gebeurt telt niet)
function vroegsteKenmerk(b, tUit) { const m = b.m.filter(x => !tUit || x.t < tUit); return m.length ? m[m.length - 1].x : null; }

export async function ronde(kv, { tijd = 200000, nu = Date.now(), leesFn = lees } = {}) { // leesFn: alleen voor de test
  const S = INSTEL, data = await leesFn(kv, S.dagen, tijd), perSite = new Map();
  for (const b of data.bezoek.values()) {
    const k = b.mmc ? data.klik.get(b.mmc) : null;
    if (k) { b.cr = b.cr || k.cr; b.net = (b.net && b.net !== 'onbekend') ? b.net : k.net; b.camp = (b.camp && b.camp !== '-') ? b.camp : k.camp; b.zone = (b.zone && b.zone !== '-') ? b.zone : k.zone; }
    const u = Object.assign({}, b.mmc ? data.uit.get('c:' + b.mmc) : null, data.uit.get('v:' + b.vid) || null);
    b.u = u; if (!perSite.has(b.site)) perSite.set(b.site, []); perSite.get(b.site).push(b);
  }
  // oordelen van 3 dagen terug (mm:vroeg:oordeel:<dag>) voor de controle
  const dTerug = new Date(nu - 3 * 864e5).toISOString().slice(0, 10), vorige = await kv.get('mm:vroeg:oordeel:' + dTerug).catch(() => null);
  const sites = {};
  for (const [site, lijst] of perSite) {
    const betaald = lijst.filter(b => b.net && b.net !== 'onbekend' && b.net !== '-' || (b.camp && b.camp !== '-'));
    if (betaald.length < 200) continue; // alleen sites met advertentieverkeer
    // doel kiezen: diepste uitkomst met genoeg voorbeelden onder rijpe bezoeken
    const rijp = lijst.filter(b => nu - b.t0 > S.rijpUur * 3600e3);
    let doel = null; const tellen = {};
    for (const [d] of DOELEN) { tellen[d] = rijp.filter(b => Object.keys(b.u).some(x => RANG[x] >= RANG[d])).length; if (!doel && tellen[d] >= S.minPos) doel = d; }
    const s = { bezoeken: lijst.length, betaald: betaald.length, uitkomsten: tellen, doel };
    sites[site] = s; if (!doel) { s.oordeel = 'te weinig uitkomsten om te leren (minstens ' + S.minPos + ' nodig)'; continue; }
    const heeft = b => Object.keys(b.u).some(x => RANG[x] >= RANG[doel]);
    const tUit = b => { let t = 0; for (const [x, v] of Object.entries(b.u)) if (RANG[x] >= RANG[doel] && (!t || v < t)) t = v; return t; };
    const Xtr = [], ytr = [], Xte = [], yte = [];
    for (const b of rijp) { const x = vroegsteKenmerk(b, tUit(b)); if (!x) continue; (vijfde(b.vid) ? Xte : Xtr).push(x); (vijfde(b.vid) ? yte : ytr).push(heeft(b) ? 1 : 0); }
    if (ytr.reduce((a, c) => a + c, 0) < 10) { s.oordeel = 'te weinig voorbeelden in de leergroep'; continue; }
    const w = train(Xtr, ytr), pte = Xte.map(x => kans(w, x)), A = auc(pte, yte), toetsPos = yte.reduce((a, c) => a + c, 0);
    s.model = { leer: Xtr.length, toets: Xte.length, toetsPos, auc: A == null ? null : Math.round(A * 1000) / 1000,
      gewichten: Object.fromEntries(KENMERKEN.map((k, i) => [k, Math.round(w[i] * 100) / 100])) };
    // controle van de vorige oordelen (3 dagen later): kregen de uit-groepen echt minder uitkomsten per bezoek?
    const ctl = controle(vorige && vorige.sites && vorige.sites[site], lijst, heeft, Date.parse(vorige && vorige.t) || 0);
    s.controle = ctl;
    s.betrouwbaar = A != null && A >= S.aucMin && toetsPos >= S.toetsPosMin && !(ctl && ctl.uitGetoetst >= 5 && ctl.uitKlopt < S.controleMin);
    s.waarom = s.betrouwbaar ? 'model voorspelt goed genoeg (AUC ' + s.model.auc + ')' : (A == null || A < S.aucMin) ? 'AUC ' + s.model.auc + ' onder ' + S.aucMin + ': alleen melden' : toetsPos < S.toetsPosMin ? 'te weinig positieve toetsbezoeken: alleen melden' : 'vorige uit-oordelen klopten te weinig: alleen melden';
    // recente bezoeken scoren en groeperen
    // gemiddelde = betaalde bezoeken (organisch verkeer gedraagt zich anders en zou elke advertentie slecht laten lijken)
    const isBetaald = b => (b.net && b.net !== 'onbekend' && b.net !== '-') || (b.camp && b.camp !== '-');
    const recent = lijst.filter(b => nu - b.t0 <= S.recent * 864e5 && b.m.length);
    for (const b of recent) b.p = kans(w, b.m[b.m.length - 1].x);
    const rb = recent.filter(isBetaald), gem = rb.length ? rb.reduce((a, b) => a + b.p, 0) / rb.length : 0;
    s.recent = { bezoeken: recent.length, betaald: rb.length, verwachtPer1000: Math.round(gem * 1e4) / 10, echtPer1000: rb.length ? Math.round(rb.filter(heeft).length / rb.length * 1e4) / 10 : 0 };
    const groep = (sleutel, alleen = isBetaald) => { const g = new Map(); for (const b of recent) { if (alleen && !alleen(b)) continue; const k = sleutel(b); if (!k) continue; const o = g.get(k) || { n: 0, p: 0, echt: 0 }; o.n++; o.p += b.p; if (heeft(b)) o.echt++; g.set(k, o); } return g; };
    const gemEcht = rb.length ? rb.filter(heeft).length / rb.length : 0;
    const oordeel = (g) => [...g.entries()].map(([k, o]) => {
      const idx = gem ? ((o.p + S.K * gem) / (o.n + S.K)) / gem : 1;
      // echte uitkomsten wegen mee zodra ze er zijn: uit alleen als ook de echte stand (gekrompen naar gemiddeld) onder 75% blijft
      const eIdx = gemEcht ? ((o.echt + S.K * gemEcht) / (o.n + S.K)) / gemEcht : 1;
      const o2 = o.n < S.minN ? 'volgt (nog ' + (S.minN - o.n) + ' bezoeken)' : idx < S.uit && eIdx < 0.75 ? 'uit' : idx > S.sterk && eIdx > 0.9 ? 'sterk' : 'gemiddeld';
      return { k, n: o.n, verwacht: Math.round(o.p * 100) / 100, echt: o.echt, index: Math.round(idx * 100), echtIndex: Math.round(eIdx * 100), oordeel: o2 };
    }).sort((a, b) => b.n - a.n).slice(0, 80);
    s.advertenties = oordeel(groep(b => b.cr ? [b.net, b.camp, b.cr].join('|') : ''));
    s.zones = oordeel(groep(b => (b.zone && b.zone !== '-') ? b.net + '|' + b.zone : ''));
    s.campagnes = oordeel(groep(b => (b.camp && b.camp !== '-') ? b.net + '|' + b.camp : ''));
    s.paginas = oordeel(groep(b => b.pad));
  }
  // dagfoto van de oordelen (alleen uit en sterk) voor de controle over 3 dagen
  try { const vandaag = new Date(nu).toISOString().slice(0, 10), fk = 'mm:vroeg:oordeel:' + vandaag;
    if (!(await kv.raw(['EXISTS', fk]).catch(() => 0))) await kv.set(fk, { t: new Date(nu).toISOString(), sites: Object.fromEntries(Object.entries(sites).filter(([, v]) => v.model).map(([k, v]) => [k, { doel: v.doel,
      advertenties: (v.advertenties || []).filter(x => x.oordeel === 'uit' || x.oordeel === 'sterk').map(x => ({ k: x.k, oordeel: x.oordeel })),
      zones: (v.zones || []).filter(x => x.oordeel === 'uit' || x.oordeel === 'sterk').map(x => ({ k: x.k, oordeel: x.oordeel })) }])) }, { ex: 10 * 86400 }); } catch (e) {}
  const uit = { ok: true, t: new Date(nu).toISOString(), volledig: data.volledig, rijen: data.rijen, dagen: data.dagen.length, instel: S, sites };
  await kv.set(VROEG, uit).catch(() => {});
  try { await kv.raw(['LPUSH', VROEG_HIST, JSON.stringify({ t: uit.t, sites: Object.fromEntries(Object.entries(sites).map(([k, v]) => [k, { doel: v.doel, auc: v.model && v.model.auc, betrouwbaar: !!v.betrouwbaar, uit: (v.advertenties || []).filter(x => x.oordeel === 'uit').length, controle: v.controle || null }])) })]); await kv.raw(['LTRIM', VROEG_HIST, 0, 59]); } catch (e) {}
  return uit;
}

// controle: groepen die de vorige ronde (minstens 2 dagen terug) "uit" of "sterk" kregen, tegen wat ze daarna echt deden
function controle(vorig, lijst, heeft, tV) {
  if (!vorig || !tV) return null;
  const na = lijst.filter(b => b.t0 > tV && ((b.net && b.net !== 'onbekend' && b.net !== '-') || (b.camp && b.camp !== '-')));
  if (na.length < 100) return null;
  const tot = na.length, echtTot = na.filter(heeft).length, gem = echtTot / tot;
  const toets = (lijstOordeel, sleutel, soort) => {
    let getoetst = 0, klopt = 0;
    for (const x of (lijstOordeel || []).filter(x => x.oordeel === soort)) {
      const g = na.filter(b => sleutel(b) === x.k); if (g.length < 20) continue;
      getoetst++; const r = g.filter(heeft).length / g.length; if (soort === 'uit' ? r < gem : r > gem) klopt++;
    }
    return { getoetst, klopt };
  };
  const sk = { advertenties: b => b.cr ? [b.net, b.camp, b.cr].join('|') : '', zones: b => b.net + '|' + b.zone };
  let uG = 0, uK = 0, sG = 0, sK = 0;
  for (const [veld, f] of Object.entries(sk)) { const a = toets(vorig[veld], f, 'uit'), b = toets(vorig[veld], f, 'sterk'); uG += a.getoetst; uK += a.klopt; sG += b.getoetst; sK += b.klopt; }
  return { gemNa: Math.round(gem * 1e4) / 100, uitGetoetst: uG, uitKlopt: uG ? Math.round(uK / uG * 100) / 100 : null, sterkGetoetst: sG, sterkKlopt: sG ? Math.round(sK / sG * 100) / 100 : null };
}

// voor de netwerkwachten: alleen betrouwbare uit-oordelen, alleen id's (geen gedrag, geen bezoekers)
export async function uitLijst(kv, { net = 'propeller' } = {}) {
  const v = await kv.get(VROEG).catch(() => null); if (!v) return { ok: true, betrouwbaar: false, advertenties: [], zones: [], uitleg: 'nog geen ronde' };
  const ads = [], zones = [];
  for (const [site, s] of Object.entries(v.sites || {})) {
    if (!s.betrouwbaar) continue;
    for (const x of s.advertenties || []) { const [n, camp, cr] = x.k.split('|'); if (n === net && x.oordeel === 'uit') ads.push({ site, campagne: camp, advertentie: cr, bezoeken: x.n, index: x.index }); }
    for (const x of s.zones || []) { const [n, zone] = x.k.split('|'); if (n === net && x.oordeel === 'uit') zones.push({ site, zone, bezoeken: x.n, index: x.index }); }
  }
  return { ok: true, t: v.t, net, betrouwbaar: ads.length + zones.length > 0, advertenties: ads, zones, regel: 'uit = na ' + INSTEL.minN + '+ bezoekers minder dan de helft van de verwachte uitkomsten van de betaalde bezoekers van de site, en ook de echte uitkomsten onder 75% van gemiddeld; alleen sites met een model dat klopt (AUC en controle)' };
}

// gewone taal voor Henkjan en de overdracht
export function tekst(v) {
  if (!v || !v.sites) return 'Vroege voorspeller: nog geen ronde.';
  const r = ['Vroege voorspeller (' + String(v.t).slice(0, 16).replace('T', ' ') + ' UTC, ' + v.dagen + ' dagen data' + (v.volledig ? '' : ', niet alles gelezen') + ')'];
  for (const [site, s] of Object.entries(v.sites)) {
    if (!s.model) { r.push('- ' + site + ': ' + (s.oordeel || 'geen model')); continue; }
    const top = Object.entries(s.model.gewichten).filter(([k]) => k !== 'basis').sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 4).map(([k, g]) => k + (g > 0 ? ' +' : ' ') + g).join(', ');
    const uit = (s.advertenties || []).filter(x => x.oordeel === 'uit').length, sterk = (s.advertenties || []).filter(x => x.oordeel === 'sterk').length;
    r.push('- ' + site + ': voorspelt ' + s.doel + ', AUC ' + s.model.auc + (s.betrouwbaar ? ' (telt)' : ' (alleen melden: ' + s.waarom + ')') + '; sterkste signalen: ' + top + '; advertenties uit ' + uit + ', sterk ' + sterk +
      (s.controle && s.controle.uitGetoetst ? '; vorige uit-oordelen klopten ' + Math.round(s.controle.uitKlopt * 100) + '% (' + s.controle.uitGetoetst + ')' : ''));
  }
  return r.join('\n');
}
