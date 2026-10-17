// Voorspellers: wat zegt een klik vooraf over wat hij gaat doen? (Henkjan 16 okt: "Bedenk andere variabelen waarmee we kunnen
// voorspellen wat een klik gaat doen en vind die.")
// Per klik via /go en /w, en per bezoek op een eigen pagina, leggen we een rij eenvoudige voorspellers vast (uur en dag bij de
// bezoeker, deel van de maand, land, regio, postcodegebied, taal, provider, app, toestel, scherm, geheugen, verbinding, batterij,
// terugkomer, tijd sinds de vorige klik, aantal kliks en campagnes van dezelfde persoon in 24 uur, leeftijd van de zone, zoekterm).
// Tellers per dag in mm:vs:<dag> ("bron|voorspeller=waarde|uitkomst"), en voor Amazon per tag in mm:vst:<dag>.
// De voorspellers van een klik staan kort in mm:vf:<cid> (a = server, b = browser, 30 uur), zodat latere uitkomsten (meetpagina geladen,
// terugkomst binnen 24 uur, echt, actie, aanmelding, koop) aan dezelfde voorspellers worden toegeschreven.
// voorspel() rekent elk uur per voorspeller en waarde de lift uit tegen het gemiddelde, alleen met genoeg kliks (minstens 30) en
// alleen als het Wilson-interval (95%) het gemiddelde niet raakt. Zo verschijnt ruis niet als les.
// Privacy en Amazon: niets per klik naar Amazon (§2(b)); geen IP, geen volledige postcode, alleen gebieden van 2 cijfers.

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const paren = h => { if (!h) return []; if (Array.isArray(h)) { const o = []; for (let i = 0; i + 1 < h.length; i += 2) o.push([String(h[i]), h[i + 1]]); return o; } return Object.entries(h); };
const dagStr = (o = 0) => new Date(Date.now() + o * 864e5).toISOString().slice(0, 10);
const TTL = 15 * 86400;
const schoonW = v => String(v == null ? '' : v).toLowerCase().replace(/[|;=\s]+/g, '-').replace(/[^a-z0-9_.:+<>()-]/g, '').slice(0, 40) || '?';

export const LABEL = {
  net: 'netwerk', os: 'besturingssysteem', browser: 'browser', iosv: 'iOS-versie', uur: 'uur bij de bezoeker', dag: 'weekdag bij de bezoeker',
  maand: 'deel van de maand', land: 'land', regio: 'regio', pc2: 'postcodegebied', taal: 'taal van de browser', taalLand: 'taal past bij het land',
  app: 'app waarin geklikt', asn: 'provider', kw: 'zoekterm', terug: 'nieuw of terugkomer', sinds: 'tijd sinds vorige klik', p24: 'kliks van deze persoon in 24 uur',
  c24: 'campagnes van deze persoon in 24 uur', zleeft: 'leeftijd van de zone', geheugen: 'geheugen van het toestel (GB)', kernen: 'processorkernen',
  scherm: 'schermbreedte', dpr: 'scherpte van het scherm', con: 'verbinding', sd: 'databesparing aan', bat: 'batterij (%)', laden: 'aan de lader', donker: 'donkere modus',
  merk: 'merk van het toestel', aosv: 'Android-versie'
};
export const UIT = {
  rep: 'een snelle herhaalklik (zelfde persoon binnen 10 minuten)', bot: 'een botsignaal bij de klik (datacenter of headless)', aan: 'de meetpagina echt laadt (aangekomen)',
  botb: 'een botsignaal in de browser (headless, emulator of webdriver)', terug: 'binnen 24 uur terugkomt (na 10 minuten)', echt: 'een echt mens op de bestemming',
  actie: 'iets doet op de bestemming', aanmelding: 'zich aanmeldt', koop: 'koopt', mens: 'een echt mens op de eigen pagina'
};
// noemer per uitkomst: meetpagina alleen bij de js-variant, browserbot alleen bij een geladen meetpagina
const NOEMER = { aan: 'js', botb: 'aan' };
const UITKOMSTEN = { g: ['rep', 'bot', 'aan', 'botb', 'terug', 'echt', 'actie', 'aanmelding', 'koop'], p: ['mens'] };
// voorspellers die een uitkomst per definitie bepalen (geen les): een snelle herhaalklik is altijd een terugkomer met een vorige klik binnen 10 minuten
const ZELFDE = { rep: new Set(['terug', 'sinds', 'p24', 'c24']) };
const PROVIDER = { 7922: 'Comcast', 7018: 'AT&T', 20057: 'AT&T mobiel', 21928: 'T-Mobile US', 22394: 'Verizon mobiel', 6167: 'Verizon', 701: 'Verizon Business', 20115: 'Charter', 11427: 'Charter', 11426: 'Charter', 10796: 'Charter', 12271: 'Charter', 33363: 'Charter', 22773: 'Cox', 5650: 'Frontier', 209: 'Lumen', 30036: 'Mediacom', 11351: 'Charter', 3320: 'Deutsche Telekom', 3209: 'Vodafone DE', 6805: 'Telefonica DE', 8881: '1&1', 31334: 'Vodafone Kabel', 8447: 'A1 Oostenrijk', 25255: 'Drei AT', 13335: 'Cloudflare WARP', 714: 'Apple', 6185: 'Apple' };
const HOOFDTAAL = { us: 'en', gb: 'en', ca: 'en', au: 'en', nz: 'en', ie: 'en', de: 'de', at: 'de', ch: 'de', nl: 'nl', be: 'nl', fr: 'fr', es: 'es', mx: 'es', it: 'it', br: 'pt', pt: 'pt', in: 'en', za: 'en' };
const DAGEN = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const INAPP = /FBAN|FBAV|FB_IAB|Instagram|Line\/|; wv\)|GSA\/|Snapchat|musical_ly|TikTok|Pinterest|Twitter/i;

function lokaal(tz, t) {
  const at = new Date(t || Date.now());
  try { const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz || 'UTC', hour: 'numeric', hourCycle: 'h23', weekday: 'short', day: 'numeric' }).formatToParts(at).map(x => [x.type, x.value])); return { uur: N(p.hour) % 24, wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), dvm: N(p.day) }; }
  catch (e) { return { uur: at.getUTCHours(), wd: at.getUTCDay(), dvm: at.getUTCDate() }; }
}
const osVan = ua => (/Android/.test(ua) ? 'android' : /iPhone|iPad|iPod/.test(ua) ? 'ios' : /Windows/.test(ua) ? 'windows' : /Mac OS X|Macintosh/.test(ua) ? 'mac' : /CrOS|Linux/.test(ua) ? 'linux' : 'ander');
function browserVan(ua) {
  if (/; wv\)/.test(ua)) return 'webview'; if (/SamsungBrowser/.test(ua)) return 'samsung'; if (/EdgA?\/|EdgiOS/.test(ua)) return 'edge'; if (/OPR\/|Opera/.test(ua)) return 'opera';
  if (/Firefox|FxiOS/.test(ua)) return 'firefox'; if (/CriOS|Chrome\//.test(ua)) return 'chrome'; if (/Safari\//.test(ua) && /iPhone|iPad|Mac OS X/.test(ua)) return 'safari'; return 'ander';
}
function emmer(x, grenzen, namen) { for (let i = 0; i < grenzen.length; i++) if (x < grenzen[i]) return namen[i]; return namen[namen.length - 1]; }

// voorspellers die de server bij elke klik of elk bezoek kent. x = { ua, tz, al, land, regio, pc, asn, xrw, net, kw, t }
export function serverVoorspellers(x) {
  const ua = String(x.ua || ''), f = {}, land = String(x.land || '').toLowerCase();
  if (x.net) f.net = x.net;
  f.os = osVan(ua); f.browser = browserVan(ua);
  const iv = /OS (\d+)_\d+.* like Mac OS X/.exec(ua); if (iv) f.iosv = 'ios' + iv[1];
  const l = lokaal(x.tz, x.t); f.uur = String(Math.floor(l.uur / 3) * 3).padStart(2, '0') + '-' + String(Math.floor(l.uur / 3) * 3 + 3).padStart(2, '0'); f.dag = DAGEN[l.wd] || '?';
  f.maand = l.dvm <= 3 ? 'begin (1-3)' : l.dvm >= 14 && l.dvm <= 16 ? 'midden (14-16)' : l.dvm >= 28 ? 'eind (28-31)' : 'rest';
  if (land) { f.land = land; if (x.regio) f.regio = land + '-' + String(x.regio).toLowerCase().slice(0, 4); }
  const pc = String(x.pc || '').replace(/\s/g, ''); if (land && /^\d{2}/.test(pc)) f.pc2 = land + '-' + pc.slice(0, 2);
  const taal = (/^([a-z]{2})/i.exec(String(x.al || '')) || [])[1]; if (taal) { f.taal = taal.toLowerCase(); if (HOOFDTAAL[land]) f.taalLand = f.taal === HOOFDTAAL[land] ? 'gelijk' : 'anders'; }
  f.app = x.xrw ? 'app:' + schoonW(x.xrw) : INAPP.test(ua) ? 'in-app' : 'browser';
  const asn = N(x.asn); if (asn) f.asn = PROVIDER[asn] ? PROVIDER[asn] + ' (' + asn + ')' : String(asn);
  if (x.kw) f.kw = String(x.kw).toLowerCase().trim().slice(0, 40);
  return f;
}
// voorspellers uit de geschiedenis van de persoon en de zone. vorig = mm:p, pl = mm:pl-regels (nieuwste eerst), zEerst = eerste keer zone gezien (ms)
export function persoonVoorspellers({ vorig, pl, t, zEerst }) {
  const f = {}; t = t || Date.now();
  f.terug = vorig ? 'terug' : 'nieuw';
  if (!vorig) f.sinds = 'nieuw'; else f.sinds = emmer(t - N(vorig.laatst), [600e3, 3600e3, 864e5, 7 * 864e5], ['<10 min', '10 min-1 uur', '1-24 uur', '1-7 dagen', '7 dagen+']);
  if (Array.isArray(pl)) {
    const d = pl.map(r => String(r).split('|')).filter(p => t - N(p[0]) < 864e5 && t - N(p[0]) >= 0);
    f.p24 = emmer(d.length, [1, 2, 4], ['0', '1', '2-3', '4+']);
    f.c24 = emmer(new Set(d.map(p => p[1] + '|' + p[2])).size, [1, 2, 4], ['0', '1', '2-3', '4+']);
  }
  if (zEerst) f.zleeft = emmer(t - N(zEerst), [864e5, 3 * 864e5, 7 * 864e5], ['<1 dag', '1-3 dagen', '3-7 dagen', '7 dagen+']);
  return f;
}
// voorspellers die alleen de browser kent (meetpagina van /go en mm.js op eigen pagina's)
export function browserVoorspellers(c) {
  const f = {}; if (!c || typeof c !== 'object') return f;
  const ua = String(c.ua || ''), ios = /iPhone|iPad|iPod/.test(ua);
  if (N(c.mem)) f.geheugen = emmer(N(c.mem), [3, 6], ['2 of minder', '4', '8+']);
  if (N(c.hc)) f.kernen = emmer(N(c.hc), [5, 7], ['4 of minder', '6', '8+']);
  const s = /^(\d+)x(\d+)x([\d.]+)/.exec(String(c.scr || ''));
  if (s) { const w = Math.min(N(s[1]), N(s[2])); f.scherm = emmer(w, [361, 390, 414], ['360 of smaller', '361-389', '390-413', '414+']); f.dpr = emmer(N(s[3]), [1.5, 2.5], ['1', '2', '3+']); }
  const con = String(c.con || '').split('|'); if (con[0] || con[4]) { f.con = con[4] ? (con[4] === 'wifi' ? 'wifi' : con[4] === 'cellular' ? 'mobiel netwerk' : con[4]) : con[0]; if (con[0] && con[4] === 'cellular') f.con = 'mobiel ' + con[0]; f.sd = con[3] === '1' ? 'ja' : 'nee'; }
  const b = String(c.bat || '').split('|'); if (b[0] !== '' && b.length >= 2) { f.bat = emmer(N(b[0]), [20, 50, 80], ['<20', '20-49', '50-79', '80+']); f.laden = b[1] === '1' ? 'ja' : 'nee'; }
  if (typeof c.mq === 'string' && c.mq.length) f.donker = c.mq[0] === '1' ? 'ja' : 'nee';
  const model = String((c.uah && c.uah.model) || '');
  if (ios) f.merk = 'apple';
  else if (model) f.merk = /^SM-|^Galaxy/i.test(model) ? 'samsung' : /moto/i.test(model) ? 'motorola' : /Pixel/i.test(model) ? 'google' : /Redmi|POCO|^M2|Xiaomi|^2\d{3}/i.test(model) ? 'xiaomi' : /OnePlus|^CPH|^IN20|^LE21|^NE22/i.test(model) ? 'oneplus/oppo' : /^TCL|^T\d{3}|^onn|^BLU|^Revvl|^REVVL/i.test(model) ? 'tcl/onn/blu/revvl' : /^LM-|^LG/i.test(model) ? 'lg' : 'ander';
  const pv = /^(\d+)/.exec(String((c.uah && c.uah.pv) || '')); if (!ios && pv && /Android/.test(ua)) f.aosv = emmer(N(pv[1]), [11, 13, 14, 15], ['10 of ouder', '11-12', '13', '14', '15+']);
  return f;
}

export const vfTekst = f => Object.entries(f).map(([k, v]) => k + '=' + schoonW(v)).join(';').slice(0, 900);
export const vfLees = s => { const f = {}; for (const d of String(s || '').split(';')) { const i = d.indexOf('='); if (i > 0) f[d.slice(0, i)] = d.slice(i + 1); } return f; };
const schoonF = f => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, schoonW(v)]));

// tellers: bron g = klik via /go of /w, p = bezoek op een eigen pagina; uit = { n: 1, rep: 1, ... }
export function telCmds(D, bron, f, uit) {
  const k = 'mm:vs:' + D, c = []; f = schoonF(f);
  for (const [nm, v] of Object.entries(f)) for (const [u, n] of Object.entries(uit)) if (n) c.push(['HINCRBY', k, bron + '|' + nm + '=' + v + '|' + u, n]);
  if (c.length) c.push(['EXPIRE', k, TTL]); return c;
}
// Amazon: hoeveel kliks per voorspeller-waarde naar welke tag gingen (zoekterm, provider en postcode niet, om het klein te houden)
export function tagCmds(D, f, tag) {
  if (!tag || tag === '-') return []; const k = 'mm:vst:' + D, c = []; f = schoonF(f);
  for (const [nm, v] of Object.entries(f)) if (!['kw', 'asn', 'pc2', 'regio'].includes(nm)) c.push(['HINCRBY', k, nm + '=' + v + '|' + String(tag).slice(0, 40), 1]);
  if (c.length) c.push(['EXPIRE', k, TTL]); return c;
}
// markeert de eerste dag met live tellers (oudere dagen mogen uit de ruwe log worden aangevuld)
export async function markeerStart(kv) { try { await kv.raw(['SET', 'mm:vs:start', dagStr(), 'NX']); } catch (e) {} }

// ---- uitrekenen ----
function wilson(k, n, z = 1.96) { if (!n) return [0, 1]; const p = k / n, d = 1 + z * z / n, m = (p + z * z / (2 * n)) / d, w = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d; return [Math.max(0, m - w), Math.min(1, m + w)]; }
const pct1 = x => Math.round(x * 1000) / 10;
const nl = x => String(x).replace('.', ',');

export async function voorspel(kv, { dagen = 7, min = 30 } = {}) {
  dagen = Math.max(1, Math.min(15, Math.round(N(dagen)) || 7));
  const D = Array.from({ length: dagen }, (_, i) => dagStr(-i));
  const [hs, ts, as] = await Promise.all([
    Promise.all(D.map(d => kv.raw(['HGETALL', 'mm:vs:' + d]).catch(() => null))),
    Promise.all(D.map(d => kv.raw(['HGETALL', 'mm:vst:' + d]).catch(() => null))),
    Promise.all(D.map(d => kv.raw(['HGETALL', 'mm:amz:' + d]).catch(() => null)))
  ]);
  // T[bron][voorspeller][waarde][uitkomst] = n
  const T = {}; let velden = 0;
  for (const h of hs) for (const [fld, v] of paren(h)) {
    velden++; const a = fld.split('|'); if (a.length < 3) continue; const [bron, kv2, u] = [a[0], a.slice(1, -1).join('|'), a[a.length - 1]]; const i = kv2.indexOf('='); if (i < 1) continue;
    const nm = kv2.slice(0, i), w = kv2.slice(i + 1); const x = ((T[bron] || (T[bron] = {}))[nm] || (T[bron][nm] = {}))[w] || (T[bron][nm][w] = {}); x[u] = N(x[u]) + N(v);
  }
  const vondsten = [];
  for (const [bron, F] of Object.entries(T)) for (const [nm, W] of Object.entries(F)) for (const u of UITKOMSTEN[bron] || []) {
    if (ZELFDE[u] && ZELFDE[u].has(nm)) continue;
    const den = NOEMER[u] || 'n'; let K = 0, Nn = 0; for (const x of Object.values(W)) { K += N(x[u]); Nn += N(x[den]); }
    if (Nn < min * 2 || !K) continue; const p0 = K / Nn; if (p0 >= 1) continue;
    for (const [w, x] of Object.entries(W)) {
      const n = N(x[den]), k = Math.min(N(x[u]), n); if (n < min || n === Nn) continue; if (Math.max(k, n * p0) < 5) continue;
      const p = k / n, [lo, hi] = wilson(k, n); if (p0 >= lo && p0 <= hi) continue;
      const lift = p0 ? p / p0 : 0; if (lift > 0.8 && lift < 1.25) continue;
      const z = (p - p0) / Math.sqrt(p0 * (1 - p0) / n);
      vondsten.push({ bron: bron === 'p' ? 'eigen pagina' : 'klik', voorspeller: nm, waarde: w, uitkomst: u, kliks: n, keer: k, pct: pct1(p), gemiddeld: pct1(p0), lift: Math.round(lift * 100) / 100, interval: [pct1(lo), pct1(hi)], z: Math.round(z * 10) / 10,
        zin: (bron === 'p' ? 'Bezoeken' : 'Kliks') + ' met ' + (LABEL[nm] || nm) + ' "' + w + '": ' + (lift >= 1 ? nl(Math.round(lift * 10) / 10) + 'x zo vaak' : k === 0 ? 'nooit' : nl(Math.round((1 - lift) * 100)) + '% minder vaak') + ' ' + (UIT[u] || u) + ' (' + nl(pct1(p)) + '% tegen ' + nl(pct1(p0)) + '%, ' + n + ' ' + (den === 'n' ? (bron === 'p' ? 'bezoeken' : 'kliks') : den === 'js' ? 'kliks met meetpagina' : 'geladen meetpagina\'s') + ')' });
    }
  }
  vondsten.sort((a, b) => Math.abs(b.z) * Math.min(1, Math.abs(Math.log(b.lift || 0.01))) - Math.abs(a.z) * Math.min(1, Math.abs(Math.log(a.lift || 0.01))));
  // dubbele vondsten (bijv. iOS en Safari: precies dezelfde kliks) maar één keer tonen
  { const gezien = new Set(); for (let i = 0; i < vondsten.length; i++) { const x = vondsten[i], k = x.bron + '|' + x.uitkomst + '|' + x.kliks + '|' + x.keer; if (gezien.has(k)) { x.dubbel = true; } else gezien.add(k); } }
  const uniek = vondsten.filter(x => !x.dubbel);
  // Amazon (zwak): verwachte artikelen per 100 Amazon-kliks per voorspeller-waarde, uit de conversie per tag per dag (Associates-meter)
  const amazon = []; const A = {}; // A[nm][w] = { n, som, tags:Set }
  D.forEach((d, i) => {
    const conv = {}; for (const [tag, v] of paren(as[i])) { try { const x = typeof v === 'string' ? JSON.parse(v) : v; if (N(x.kliks) >= 50) conv[tag] = N(x.artikelen) / N(x.kliks); } catch (e) {} }
    for (const [fld, v] of paren(ts[i])) { const j = fld.lastIndexOf('|'), kv2 = fld.slice(0, j), tag = fld.slice(j + 1); if (!(tag in conv)) continue; const e = kv2.indexOf('='), nm = kv2.slice(0, e), w = kv2.slice(e + 1); const x = ((A[nm] || (A[nm] = {}))[w] || (A[nm][w] = { n: 0, som: 0, tags: new Set() })); x.n += N(v); x.som += N(v) * conv[tag]; x.tags.add(tag); }
  });
  for (const [nm, W] of Object.entries(A)) {
    let n0 = 0, s0 = 0; for (const x of Object.values(W)) { n0 += x.n; s0 += x.som; } if (n0 < 600 || !s0) continue; const c0 = s0 / n0;
    for (const [w, x] of Object.entries(W)) { if (x.n < 300 || x.tags.size < 3 || x.n === n0) continue; const c = x.som / x.n, lift = c / c0; if (lift > 0.85 && lift < 1.18) continue;
      amazon.push({ voorspeller: nm, waarde: w, kliks: x.n, tags: x.tags.size, artikelenPer100: Math.round(c * 1000) / 10, gemiddeld: Math.round(c0 * 1000) / 10, lift: Math.round(lift * 100) / 100,
        zin: 'Kliks met ' + (LABEL[nm] || nm) + ' "' + w + '" gaan naar tags die ' + (lift >= 1 ? nl(Math.round(lift * 100) / 100) + 'x zo goed' : nl(Math.round((1 - lift) * 100)) + '% slechter') + ' converteren (' + nl(Math.round(c * 1000) / 10) + ' tegen ' + nl(Math.round(c0 * 1000) / 10) + ' artikelen per 100 kliks, ' + x.n + ' kliks, ' + x.tags.size + ' tags; zwak: Amazon telt per tag, niet per klik)' }); }
  }
  amazon.sort((a, b) => Math.abs(Math.log(b.lift)) * Math.sqrt(b.kliks) - Math.abs(Math.log(a.lift)) * Math.sqrt(a.kliks));
  const tel = b => { const f = T[b] && (T[b].os || T[b].net || T[b].uur); return f ? Object.values(f).reduce((s, x) => s + N(x.n), 0) : 0; };
  return { ok: true, bijgewerkt: new Date().toISOString(), dagen: D, start: await kv.get('mm:vs:start').catch(() => null), kliks: tel('g'), bezoeken: tel('p'), velden, minimum: min,
    uitleg: 'Per voorspeller en waarde: hoe vaak een uitkomst voorkomt tegen het gemiddelde van die voorspeller. Alleen met minstens ' + min + ' kliks en als het 95%-interval het gemiddelde niet raakt. Gesorteerd op sterkte (z-waarde en grootte van het verschil).',
    top: uniek.slice(0, 40), aantalVondsten: uniek.length, amazon: amazon.slice(0, 20) };
}

// ---- aanvullen uit de ruwe log (voor dagen vóór de live tellers) ----
export async function voorspelRuw(kv, d, { tijd = 45000 } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d || ''))) return { ok: false, fout: 'dag=JJJJ-MM-DD' };
  const start = await kv.get('mm:vs:start').catch(() => null);
  if (start && d >= start) return { ok: false, fout: 'vanaf ' + start + ' tellen de live tellers; aanvullen alleen voor eerdere dagen' };
  if (await kv.get('mm:vsruw:' + d).catch(() => null)) return { ok: false, fout: 'deze dag is al aangevuld' };
  const { leesRuwDag } = await import('./ruwarchief.js');
  const go = [], b = {}, u = []; const t0 = Date.now();
  const r1 = await leesRuwDag(kv, 'raw', d, x => { if (x.ty === 'go') go.push({ t: x.t, cid: x.cid, pid: x.pid, vorig: x.vorig, rep: x.rep, arm: x.arm, tag: x.tag, net: x.net, camp: x.camp, zone: x.zone, kw: x.kw, dc: x.ip && x.ip.dc === true, score: x.score, ua: (x.kop || {})['user-agent'] || '', tz: (x.geo || {}).tz || (x.kop || {})['x-vercel-ip-timezone'], al: (x.kop || {})['accept-language'], land: (x.geo || {}).land, regio: (x.geo || {}).regio, pc: (x.kop || {})['x-vercel-ip-postal-code'], asn: x.ip && x.ip.asn, xrw: x.xrw }); else if (x.ty === 'b') b[x.cid] = x; else if (x.ty === 'u') u.push(x); }, { tijd });
  if (!r1.volledig) return { ok: false, fout: 'ruwe log niet binnen de tijd gelezen', gelezen: r1.n };
  go.sort((a, z) => a.t - z.t);
  // direct optellen per veld (geen lange opdrachtenlijst in het geheugen)
  const som = {}, expire = new Set();
  const voeg = c => { for (const x of c) { if (x[0] === 'EXPIRE') { expire.add(x[1]); continue; } const s = x[1] + '\u0000' + x[2]; som[s] = N(som[s]) + N(x[3]); } };
  const vf = {}, perP = {}, laatst = {};
  for (const k of go) {
    const pl = (perP[k.pid] || []).slice(-20).reverse().map(x => [x.t, x.net, x.camp].join('|'));
    const f = Object.assign(serverVoorspellers({ ua: k.ua, tz: k.tz, al: k.al, land: k.land, regio: k.regio, pc: k.pc, asn: k.asn, xrw: k.xrw, net: k.net, kw: k.kw, t: k.t }), persoonVoorspellers({ vorig: k.vorig, pl, t: k.t }));
    const bot = k.dc || /HeadlessChrome|PhantomJS|Puppeteer|Playwright/i.test(k.ua);
    const uit = { n: 1, rep: k.rep ? 1 : 0, bot: bot ? 1 : 0, js: k.arm === 'js' ? 1 : 0 };
    const bk = b[k.cid]; let bf = {};
    if (bk) { uit.aan = 1; const v = bk.vlag || {}; uit.botb = v.hl || v.em || (bk.c && N(bk.c.wd) === 1) ? 1 : 0; bf = browserVoorspellers(bk.c); }
    const vorigeKlik = laatst[k.pid]; if (vorigeKlik && k.t - vorigeKlik.t >= 600e3 && k.t - vorigeKlik.t <= 864e5 && !vorigeKlik.terugGeteld) { vorigeKlik.terugGeteld = 1; voeg(telCmds(d, 'g', vorigeKlik.f, { terug: 1 })); }
    const alles = Object.assign({}, f, bf); vf[k.cid] = alles; laatst[k.pid] = { t: k.t, f: alles };
    voeg(telCmds(d, 'g', f, uit)); if (Object.keys(bf).length) voeg(telCmds(d, 'g', bf, { n: 1, aan: 1, js: 1, botb: uit.botb }));
    voeg(tagCmds(d, alles, k.tag));
    (perP[k.pid] || (perP[k.pid] = [])).push({ t: k.t, net: k.net, camp: k.camp });
  }
  for (const x of u) { const f = vf[x.cid]; if (f && UITKOMSTEN.g.includes(x.soort)) voeg(telCmds(d, 'g', f, { [x.soort]: 1 })); }
  // paginabezoeken (alleen serverkant: de compacte paginaregel bewaart de browsermeting niet)
  let pag = 0; const r2 = await leesRuwDag(kv, 'rawp', d, x => { if (x.ty !== 'p' || x.f === 'b') return; pag++; const f = serverVoorspellers({ ua: x.ua, tz: x.tz, al: x.al, land: x.land, regio: x.regio, asn: x.asn, xrw: x.xrw, net: x.net, t: x.t }); voeg(telCmds(d, 'p', f, { n: 1, mens: x.mens ? 1 : 0 })); }, { tijd: Math.max(5000, tijd - (Date.now() - t0)) });
  const lijst = Object.entries(som); let geschreven = 0;
  for (let i = 0; i < lijst.length; i += 500) { const p = lijst.slice(i, i + 500); await Promise.all(p.map(([s, n]) => { const j = s.indexOf('\u0000'); return kv.raw(['HINCRBY', s.slice(0, j), s.slice(j + 1), n]); })); geschreven += p.length; }
  for (const k of expire) await kv.raw(['EXPIRE', k, TTL]).catch(() => {});
  await kv.set('mm:vsruw:' + d, { t: new Date().toISOString(), kliks: go.length, bezoeken: pag }, { ex: 30 * 86400 });
  return { ok: true, dag: d, kliks: go.length, metMeetpagina: Object.keys(b).length, uitkomsten: u.length, bezoeken: pag, paginaVolledig: r2.volledig, velden: geschreven, seconden: Math.round((Date.now() - t0) / 100) / 10 };
}
