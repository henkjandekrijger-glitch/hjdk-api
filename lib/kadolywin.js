// Kadoly winactie (25 nov 2026, Henkjan: "ik wil mails verzamelen met prop ads . Dus zorg dat je CTA daar top is" en bij de keuze "Winactie";
// "Laat alles via mailmind en clickmind lopen"). PropellerAds-bezoekers landen op go.kadoly.com/shop op een actiepagina met één veld:
// e-mailadres, knop "Doe gratis mee". Aanmelden en bevestigen gaan door de motor van de lijst (lib/modalmotor.js, belofte winactie,
// dubbele bevestiging); de Mailmind-blokkeerlijst (mlm:af) geldt; Clickmind meet de pagina (cm.js) en elke stap telt per plek en advertentie.
// Pas na bevestigen doe je mee (welkomstmail zet je in de pot van de week). Trekking elke zondag na 20.00 uur Nederlandse tijd: op=winloting.
// Regels volgen de Gedragscode Promotionele Kansspelen 2014: gratis, prijs onder EUR 4.500, voorwaarden openbaar, winnaar per mail.
export const WIN = { prijs: 120, tot: '2026-12-27', van: '2026-11-25', organisator: 'Kadoly, onderdeel van AdsFair B.V., KvK 60126035, Albert Plesmanplein 20, 2805 AB Gouda', contact: 'henkjan@kadoly.com' };
const MAAND = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
const DAG = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function nl(t) { const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false, weekday: 'short' }).formatToParts(new Date(t)); const g = k => (f.find(x => x.type === k) || {}).value; return { dag: g('year') + '-' + g('month') + '-' + g('day'), uur: Number(g('hour')) % 24, wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')) }; }
// De zondag van de lopende ronde (JJJJ-MM-DD): zondag voor 20.00 uur is het die zondag, daarna de volgende.
export function trekking(t = Date.now()) { const n = nl(t); let plus = (7 - n.wd) % 7; if (plus === 0 && n.uur >= 20) plus = 7; const d = new Date(Date.parse(n.dag + 'T12:00:00Z') + plus * 864e5); return d.toISOString().slice(0, 10); }
export function datumKort(dag) { const d = new Date(dag + 'T12:00:00Z'); return DAG[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MAAND[d.getUTCMonth()]; }
export const loopt = (t = Date.now()) => { const d = nl(t).dag; return d >= WIN.van && d <= WIN.tot; };
const potK = dag => 'kd:win:pot:' + dag;
export async function doeMee(kv, email, t = Date.now()) { const m = String(email || '').trim().toLowerCase(); if (!m || !loopt(t)) return false; const k = potK(trekking(t)); await kv.raw(['SADD', k, m]); await kv.raw(['EXPIRE', k, String(120 * 86400)]); return true; }
export async function potGrootte(kv, dag = trekking()) { return Number(await kv.raw(['SCARD', potK(dag)]).catch(() => 0)) || 0; }
// Trekking: één willekeurige deelnemer uit de pot van die zondag; vast na de eerste keer (opnieuw alleen met &opnieuw=1, bijv. als de winnaar niet reageert).
export async function loting(kv, dag, { opnieuw = false } = {}) {
  const wk = 'kd:win:winnaar:' + dag; const al = await kv.get(wk).catch(() => null); if (al && !opnieuw) return { ok: true, al: true, ...al };
  const n = await potGrootte(kv, dag); if (!n) return { ok: false, fout: 'lege pot voor ' + dag };
  const m = await kv.raw(['SRANDMEMBER', potK(dag)]); const r = { dag, email: String(m), uit: n, at: new Date().toISOString(), eerder: al ? [].concat(al.eerder || [], [al.email]) : [] };
  await kv.set(wk, r, { ex: 180 * 86400 }); return { ok: true, ...r };
}
export function regelsHtml() {
  return `<p><b>Organisator.</b> ${esc(WIN.organisator)}.</p>
<p><b>Looptijd.</b> Van 25 november tot en met 27 december 2026. Elke week is een aparte ronde, van maandag 00.00 uur tot zondag 20.00 uur (Nederlandse tijd).</p>
<p><b>Meedoen.</b> Gratis. Vul je e-mailadres in en bevestig het via de link in de mail; pas dan doe je mee. Eén kans per e-mailadres per week. Vanaf 18 jaar, wonend in Nederland of België. Medewerkers van de organisator doen niet mee.</p>
<p><b>Prijs.</b> Elke week één winnaar. Die krijgt het product of de set van de actiepagina waarop hij of zij meedeed, of iets anders uit kadoly.com tot dezelfde verkoopprijs, met een maximum van € ${WIN.prijs}, verzending inbegrepen. Niet in te wisselen voor geld.</p>
<p><b>Trekking.</b> Elke zondag na 20.00 uur loten we de winnaar uit alle bevestigde deelnemers van die week. De winnaar krijgt binnen 3 dagen een mail en reageert binnen 14 dagen; anders loten we opnieuw.</p>
<p><b>Je gegevens.</b> We gebruiken je e-mailadres voor deze actie en voor onze mail met sieraden en cadeautips. Afmelden kan altijd met één klik onderaan elke mail. We delen je adres met niemand.</p>
<p><b>Verder.</b> Deze actie volgt de Gedragscode Promotionele Kansspelen 2014. Vragen of klachten: ${esc(WIN.contact)}.</p>`;
}
export function voorwaardenPagina() {
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Actievoorwaarden winactie | Kadoly</title><style>body{font:16px/1.6 -apple-system,system-ui,Segoe UI,Roboto,sans-serif;color:#000;max-width:34rem;margin:0 auto;padding:22px 18px}h1{font-size:24px;line-height:1.2}a{color:#000;font-weight:700}</style></head><body><h1>Actievoorwaarden winactie Kadoly</h1>${regelsHtml()}<p><a href="https://kadoly.com/shop">Naar Kadoly</a></p></body></html>`;
}
// De actiepagina. held = het product uit de advertentie (catalogus-item), set = naam van het pakket als de advertentie een set toont.
// Korte naam zonder merk na de komma en zonder "18k goud" (Waarborgwet: verguld is geen goud).
export const kortNaam = t => String(t || '').split(',')[0].replace(/\b18k\s*goud\s*vermeil\b/ig, 'verguld zilver').replace(/\b(18k|14k)\s*(goud|gold)\b/ig, 'verguld').replace(/\b(18k|14k)\b\s*/ig, '').replace(/\s{2,}/g, ' ').trim();
// ---- lerende pagina op elke variabele (Henkjan 25 nov 2026: "Maak pagina volledig lerend per 50 verbeteren ." en "Verbeter nu . Leer over alle variabelen .") ----
// De pagina bestaat uit losse knoppen (factoren): kop, knoptekst, volgorde, stappen, uitleg, label, prijs en beeld. Elke bezoeker krijgt per
// factor een stand via Thompson-trekking (Beta per stand), vast per klik. Beloning: aanmelding = 1, tik in het e-mailveld zonder aanmelding = 0,2
// (vroeg signaal, zo leert hij 5 keer sneller dan op aanmeldingen alleen). Elke 50 bezoeken een leermoment per factor: de stand met de grootste
// kans de slechtste te zijn (vanaf 80%, elke actieve stand minstens 20 bezoeken) gaat eruit, de volgende uitdager uit de rij komt erbij.
// Daarnaast leert hij wat we niet kiezen maar wel zien: advertentie, plek, campagne, toestel en uur (aanmelding per bezoek, op=winstand).
export const FACTOREN = {
  kop: { a: 'Win {ding}', b: 'Gratis kans op {ding}', c: 'Wil jij {ding} winnen?', d: '{Ding} kan zondag van jou zijn', e: 'Win {ding} t.w.v. € {prijs}', f: 'Maak kans op {ding}' },
  knop: { a: 'Doe gratis mee', b: 'Ja, ik doe mee', c: 'Ik wil winnen', d: 'Stuur mij de kans', e: 'Meedoen', f: 'Ja, ik wil {ding} winnen', g: 'Doe mee in 10 seconden', h: 'Geef mij die kans' }, // f, g, h: 25 nov 21:20 UTC (Henkjan: "Maak winactie betere CTA"): ik-vorm met het product, en de moeite die het kost
  volgorde: { beeld: 'beeld boven', form: 'formulier boven' },
  stappen: { een: 'meteen e-mailveld', twee: 'eerst knop, dan veld' },
  uitleg: { a: 'Elke week loten we 1 winnaar. Meedoen is gratis.', b: 'Zondag hoor je of je gewonnen hebt. Meedoen is gratis.', c: 'Gratis meedoen, geen aankoop nodig. Elke zondag 1 winnaar.' },
  label: { trekking: 'Winactie · trekking {datum}', aftellen: 'Nog {dagen} · trekking {datum}' },
  prijs: { met: 'waarde erbij', zonder: 'geen waarde' },
  beeld: { groot: 'groot', klein: 'klein' },
  kans: { uit: 'geen deelnemersregel', aan: 'echt aantal deelnemers deze week (kleine pot = grote kans)' }, // 25 nov 21:00 UTC: 414 PA-bezoekers, 1% aanmelding
  zeker: { a: 'Je krijgt een mail om te bevestigen; pas dan doe je mee. Daarna af en toe sieradentips, afmelden met één klik.', b: 'Gratis en zonder aankoop. Eén tik in de mail en je doet mee. Afmelden kan altijd met één klik.' },
  // Vertrekmodal (Henkjan 25 nov: "betere modal erbij als ze vertrekken die totale combi moet lerend zijn"): uit = controlegroep zonder modal;
  // terug = bij de terugknop of de muis naar boven; stil = na 15 s zonder tik in het e-mailveld; beide = wat het eerst komt. Eén keer per bezoek.
  vertrek: { uit: 'geen vertrekmodal', terug: 'bij terugknop of muis naar boven', stil: 'na 15 s zonder tik', beide: 'terugknop of 15 s' },
  mtekst: { a: 'Wacht even: je kans op {ding} staat nog open', b: 'Deze week doen pas {pot} mee: grote kans op {ding}', c: 'Liever eerst kijken? Doe mee en hoor zondag de uitslag' }
};
const FSTART = { kop: ['a', 'b', 'c', 'd'], knop: ['a', 'b', 'c'], volgorde: ['beeld', 'form'], stappen: ['een', 'twee'], uitleg: ['a', 'b'], label: ['trekking', 'aftellen'], prijs: ['met', 'zonder'], beeld: ['groot', 'klein'], kans: ['uit', 'aan'], zeker: ['a', 'b'], vertrek: ['uit', 'terug', 'stil', 'beide'], mtekst: ['a', 'b', 'c'] };
const FRIJ = { kop: ['e', 'f'], knop: ['d', 'e', 'h'], uitleg: ['c'] };
const BIJ = { knop: ['f', 'g'] }; // nieuwe standen die meteen meedoen in een lopende proef (een keer, p.bij)
// oude versies a-d (eerste ronde, 25 nov 17:37-20:00 UTC) tellen mee als start
export const VARIANTEN = { a: { kop: 'a', knop: 'a', volgorde: 'beeld', stappen: 'een' }, b: { kop: 'b', knop: 'b', volgorde: 'beeld', stappen: 'een' }, c: { kop: 'a', knop: 'a', volgorde: 'form', stappen: 'een', beeld: 'klein' }, d: { kop: 'a', knop: 'a', volgorde: 'beeld', stappen: 'twee' } };
const VEER = 0.2, PK = 'kd:win:fproef', FK = f => 'kd:win:f:' + f;
const leeg = () => ({ actief: JSON.parse(JSON.stringify(FSTART)), rij: JSON.parse(JSON.stringify(FRIJ)), uit: [], n: 0, leer: 0, log: [] });
async function hget(kv, k) { const h = await kv.raw(['HGETALL', k]).catch(() => null); const o = {}; if (Array.isArray(h)) for (let i = 0; i < h.length; i += 2) o[h[i]] = Number(h[i + 1]) || 0; else if (h && typeof h === 'object') for (const x in h) o[x] = Number(h[x]) || 0; return o; }
async function proef(kv) {
  const p = await kv.get(PK).catch(() => null); if (p && p.actief && !Array.isArray(p.actief)) {
    p.bij = p.bij || []; let nieuw = false; for (const [f, lijst] of Object.entries(BIJ)) for (const st of lijst) { const id = f + ':' + st; if (p.bij.includes(id)) continue; p.bij.push(id); nieuw = true; p.actief[f] = p.actief[f] || FSTART[f].slice(); if (!p.actief[f].includes(st)) p.actief[f].push(st); if (p.rij[f]) p.rij[f] = p.rij[f].filter(x => x !== st); }
    if (nieuw) { p.log = [{ at: new Date().toISOString(), t: 'erbij: ' + p.bij.slice(-4).join(', ') }].concat(p.log || []).slice(0, 30); await kv.set(PK, p).catch(() => {}); }
    return p; }
  const q = leeg(); // eerste keer: de cijfers van de oude versies a-d per factor overnemen
  for (const [id, v] of Object.entries(VARIANTEN)) { const s = await hget(kv, 'kd:win:arm:' + id); if (!s.bezoek) continue;
    for (const f of Object.keys(FSTART)) { const stand = v[f] || FSTART[f][0]; await kv.raw(['HINCRBY', FK(f), stand + ':b', String(s.bezoek)]).catch(() => {}); if (s.mail) await kv.raw(['HINCRBY', FK(f), stand + ':m', String(s.mail)]).catch(() => {}); } q.n += s.bezoek; }
  q.leer = q.n; q.log = [{ at: new Date().toISOString(), t: 'start per variabele, met de cijfers van versies a-d (' + q.n + ' bezoeken)' }]; await kv.set(PK, q).catch(() => {}); return q;
}
function gamma(a) { if (a < 1) return gamma(a + 1) * Math.pow(Math.random(), 1 / a); const d = a - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { const u1 = Math.random(), u2 = Math.random(); x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = Math.random(); if (u < 1 - 0.0331 * x * x * x * x || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; } }
const beta = (a, b) => { const x = gamma(a), y = gamma(b); return x / (x + y); };
const stand = (h, s) => { const b = h[s + ':b'] || 0, m = h[s + ':m'] || 0, v = h[s + ':v'] || 0; const r = Math.min(b, m + VEER * Math.max(0, v - m)); return { b, m, v, r }; };
const trek = st => beta(1 + st.r, 1 + Math.max(0, st.b - st.r));
const dagenTot = dag => { const n = Math.max(0, Math.round((Date.parse(dag + 'T18:00:00Z') - Date.now()) / 864e5)); return n <= 0 ? 'vandaag' : n === 1 ? '1 dag' : n + ' dagen'; };
export async function kiesKeus(kv, code, zie = {}) {
  if (code) { const al = await kv.get('kd:win:wk:' + code).catch(() => null); if (al && al.kop) return al; }
  const p = await proef(kv); const keus = {};
  for (const f of Object.keys(FSTART)) { const act = (p.actief[f] || FSTART[f]).filter(s => FACTOREN[f][s]); if (!act.length) { keus[f] = FSTART[f][0]; continue; } const h = await hget(kv, FK(f)); let best = act[0], bv = -1; for (const s of act) { const v = trek(stand(h, s)); if (v > bv) { bv = v; best = s; } } keus[f] = best; }
  if (code) { const zien = { a: zie.a || '', z: zie.z || '', k: zie.k || '', h: zie.h || '', u: String(new Date().getUTCHours()).padStart(2, '0') }; keus.zie = zien;
    await kv.set('kd:win:wk:' + code, keus, { ex: 7 * 86400 }).catch(() => {});
    for (const f of Object.keys(FSTART)) await kv.raw(['HINCRBY', FK(f), keus[f] + ':b', '1']).catch(() => {});
    await telZien(kv, zien, 'b');
    p.n = (p.n || 0) + 1; if (p.n - (p.leer || 0) >= 50) await leermoment(kv, p); else await kv.set(PK, p).catch(() => {}); }
  return keus;
}
async function telZien(kv, zien, w) { for (const [d, v] of Object.entries(zien || {})) if (v) await kv.raw(['HINCRBY', 'kd:win:zie:' + d, String(v).slice(0, 24) + ':' + w, '1']).catch(() => {}); }
async function eenmaal(kv, code, w) { return !!(await kv.raw(['SET', 'kd:win:w' + w + ':' + code, '1', 'NX', 'EX', String(7 * 86400)]).catch(() => null)); }
export async function keusMail(kv, code) { const k = code ? await kv.get('kd:win:wk:' + code).catch(() => null) : null; if (!k || !k.kop || !(await eenmaal(kv, code, 'm'))) return null;
  for (const f of Object.keys(FSTART)) if (k[f]) await kv.raw(['HINCRBY', FK(f), k[f] + ':m', '1']).catch(() => {}); await telZien(kv, k.zie, 'm'); return k; }
export async function keusVeld(kv, code) { const k = code ? await kv.get('kd:win:wk:' + code).catch(() => null) : null; if (!k || !k.kop || !(await eenmaal(kv, code, 'v'))) return null;
  for (const f of Object.keys(FSTART)) if (k[f]) await kv.raw(['HINCRBY', FK(f), k[f] + ':v', '1']).catch(() => {}); await telZien(kv, k.zie, 'v'); return k; }
export const armMail = keusMail; // oude naam
export async function keusTel(kv, code, w) { const k = code ? await kv.get('kd:win:wk:' + code).catch(() => null) : null; if (!k || !k.kop || !/^(t|mm|mx)$/.test(w) || !(await eenmaal(kv, code, w))) return null;
  for (const f of ['vertrek', 'mtekst']) if (k[f]) await kv.raw(['HINCRBY', FK(f), k[f] + ':' + w, '1']).catch(() => {}); return k; }
export async function leermoment(kv, p) {
  p = p || await proef(kv); p.leer = p.n; const delen = [];
  for (const f of Object.keys(FSTART)) { const act = p.actief[f] || FSTART[f]; if (act.length < 2) continue; const h = await hget(kv, FK(f)); const S = Object.fromEntries(act.map(s => [s, stand(h, s)]));
    let d = f + ' ' + act.map(s => s + ' ' + S[s].m + '/' + S[s].b + (S[s].v ? ' (' + S[s].v + ' tik)' : '')).join(', ');
    if (act.every(s => S[s].b >= 20)) { const sl = Object.fromEntries(act.map(s => [s, 0])); for (let r = 0; r < 3000; r++) { let w = null, wv = 2; for (const s of act) { const v = trek(S[s]); if (v < wv) { wv = v; w = s; } } sl[w]++; }
      const [slechtst, n] = Object.entries(sl).sort((a, b) => b[1] - a[1])[0]; const kans = n / 3000;
      if (kans >= 0.8) { p.actief[f] = act.filter(x => x !== slechtst); p.uit.push({ f, s: slechtst, at: new Date().toISOString(), ...S[slechtst], kans: Math.round(kans * 100) / 100 }); const nieuw = (p.rij[f] || []).shift(); if (nieuw) p.actief[f].push(nieuw); d += ': ' + slechtst + ' eruit (' + Math.round(kans * 100) + '%)' + (nieuw ? ', ' + nieuw + ' erbij' : ''); } }
    delen.push(d); }
  const regel = 'leermoment na ' + p.n + ' bezoeken: ' + delen.join('; ');
  p.log = [{ at: new Date().toISOString(), t: regel }].concat(p.log || []).slice(0, 30); p.uit = (p.uit || []).slice(-60); await kv.set(PK, p).catch(() => {});
  try { await kv.raw(['LPUSH', 'mm:handover:log', JSON.stringify({ t: new Date().toISOString(), wie: 'kadoly-winactie', tekst: 'Winactiepagina ' + regel })]); await kv.raw(['LTRIM', 'mm:handover:log', '0', '299']); } catch (e) {}
  return p;
}
const pct = (m, b) => b ? Math.round(1000 * m / b) / 10 + '%' : '-';
export async function proefStand(kv) {
  const p = await proef(kv); const factoren = {};
  for (const f of Object.keys(FSTART)) { const h = await hget(kv, FK(f)); factoren[f] = {}; for (const s of Object.keys(FACTOREN[f])) { const st = stand(h, s); if (!st.b && !(p.actief[f] || FSTART[f]).includes(s)) continue; factoren[f][s] = { tekst: FACTOREN[f][s], bezoek: st.b, tik: st.v, mail: st.m, aanmelding: pct(st.m, st.b), actief: (p.actief[f] || FSTART[f]).includes(s) }; if (f === 'vertrek' || f === 'mtekst') Object.assign(factoren[f][s], { modalGetoond: h[s + ':t'] || 0, modalWeg: h[s + ':mx'] || 0, uitModal: h[s + ':mm'] || 0 }); } }
  const gezien = {}; for (const d of ['a', 'z', 'k', 'h', 'u']) { const h = await hget(kv, 'kd:win:zie:' + d); const rij = {}; for (const [k, v] of Object.entries(h)) { const [id, w] = [k.slice(0, k.lastIndexOf(':')), k.slice(k.lastIndexOf(':') + 1)]; (rij[id] = rij[id] || { b: 0, v: 0, m: 0 })[w] = v; }
    gezien[{ a: 'advertentie', z: 'plek', k: 'campagne', h: 'toestel', u: 'uur (UTC)' }[d]] = Object.entries(rij).sort((x, y) => y[1].b - x[1].b).slice(0, 15).map(([id, o]) => ({ id, bezoek: o.b, tik: o.v, mail: o.m, aanmelding: pct(o.m, o.b) })); }
  return { n: p.n, volgendeLeer: (p.leer || 0) + 50, factoren, gezien, rij: p.rij, uit: p.uit.slice(-15), log: (p.log || []).slice(0, 10) };
}

export function winPagina({ held, set = '', bedrag = 0, code = '', uitHref = '', look = '', keus = {}, pot = 0 }) {
  const K = Object.assign({ kop: 'a', knop: 'a', volgorde: 'form', stappen: 'een', uitleg: 'a', label: 'trekking', prijs: 'met', beeld: 'klein', kans: 'uit', zeker: 'a', vertrek: 'uit', mtekst: 'a' }, keus);
  const z = trekking(); const naam = set || kortNaam(held.t); const prijs = set ? Math.round(Number(bedrag) || 0) : Math.round((Number(held.p) || 0) + (Number(held.vk) || 0));
  const ding = set ? 'deze set' : 'dit sieraad';
  let kop = (FACTOREN.kop[K.kop] || FACTOREN.kop.a); if (kop.includes('{prijs}') && !prijs) kop = FACTOREN.kop.a;
  kop = kop.replace('{Ding}', ding.charAt(0).toUpperCase() + ding.slice(1)).replace('{ding}', ding).replace('{prijs}', String(prijs)); kop = kop.charAt(0).toUpperCase() + kop.slice(1);
  const knop = (FACTOREN.knop[K.knop] || FACTOREN.knop.a).replace('{ding}', ding), twee = K.stappen === 'twee', boven = K.volgorde === 'form';
  const label = (FACTOREN.label[K.label] || FACTOREN.label.trekking).replace('{datum}', datumKort(z)).replace('{dagen}', dagenTot(z));
  const uitleg = FACTOREN.uitleg[K.uitleg] || FACTOREN.uitleg.a; const metPrijs = K.prijs !== 'zonder' && prijs && !kop.includes('€');
  const formHtml = `<form id="f" novalidate>${twee ? `<button type="button" id="k1">${esc(knop)}</button>` : ''}<input type="email" name="email" id="e" placeholder="jouw@email.nl" autocomplete="email" inputmode="email" required aria-label="Je e-mailadres"${twee ? ' hidden' : ''}><input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><button type="submit" id="k"${twee ? ' hidden' : ''}>${esc(twee ? 'Meld me aan' : knop)}</button><p class="fout" id="x" hidden></p></form>
<p class="klein">${esc(FACTOREN.zeker[K.zeker] || FACTOREN.zeker.a)}</p>`;
  const mStand = K.mtekst === 'b' && !(pot > 0 && pot < 50) ? 'a' : K.mtekst; const potTxt = pot === 1 ? '1 persoon' : pot + ' mensen';
  const mKop = (FACTOREN.mtekst[mStand] || FACTOREN.mtekst.a).replace('{ding}', ding).replace('{pot}', potTxt); const mKop1 = mKop.charAt(0).toUpperCase() + mKop.slice(1);
  const mSub = mStand === 'c' ? 'Je e-mailadres is genoeg. Zondag na 20.00 uur loten we de winnaar.' : esc(naam) + (prijs ? ' (€ ' + prijs + ')' : '') + '. Eén veld, gratis, geen aankoop nodig.';
  const modalHtml = K.vertrek === 'uit' ? '' : `<div id="vm" class="vm" hidden role="dialog" aria-modal="true" aria-labelledby="vmk"><div class="vk"><button type="button" class="vx" id="vx" aria-label="Sluiten">&times;</button><img src="${esc(held.img)}" alt="" width="88" height="88" class="vi"><h2 id="vmk">${esc(mKop1)}</h2><p>${mSub}</p><form id="vf" novalidate><input type="email" id="ve" placeholder="jouw@email.nl" autocomplete="email" inputmode="email" aria-label="Je e-mailadres"><button type="submit" id="vb">${esc(knop)}</button><p class="fout" id="vfx" hidden></p></form><p class="klein">Bevestig met één tik in de mail. Afmelden kan altijd.</p></div></div>`;
  const beeld = `<img class="img${K.beeld === 'klein' ? ' klein-img' : ''}" src="${esc(held.img)}" alt="${esc(naam)}" width="460" height="460">`;
  const tekst = `<span class="tag">${esc(label)}</span>
<h1>${esc(kop)}</h1>
<p class="uitleg">${esc(naam)}${metPrijs ? ' (€ ' + prijs + ')' : ''}. ${esc(uitleg)}</p>${K.kans === 'aan' && pot < 50 ? `<p class="uitleg"><b>${pot === 0 ? 'Deze week doet nog niemand mee' : pot === 1 ? 'Deze week doet pas 1 persoon mee' : 'Deze week doen pas ' + pot + ' mensen mee'}: je kans is groot.</b></p>` : ''}`;
  const versie = Object.keys(FSTART).map(f => f + ':' + K[f]).join(' ');
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(kop)} | Kadoly</title>
<style>${look}
.wrap{max-width:30rem}.topbar .wrap{height:50px}main{padding:10px 0 4px}
.img{display:block;width:100%;max-height:38vh;aspect-ratio:1/1;object-fit:cover;border-radius:14px;background:#f3f4f6}.klein-img{max-height:24vh}.boven .img{margin-top:14px}
.tag{display:inline-block;margin:12px 0 6px;background:#000;color:#fff;font-weight:700;font-size:.875rem;padding:5px 10px;border-radius:999px}
h1{font-size:1.875rem;line-height:1.1;margin:2px 0 6px;letter-spacing:-.02em}.uitleg{margin:0 0 12px;font-size:1.0625rem;color:#000;background:none;padding:0}
form{display:grid;gap:10px}input[type=email]{font:inherit;font-size:1.125rem;padding:15px 14px;border:2px solid #000;border-radius:12px;width:100%;box-sizing:border-box;color:#000;background:#fff}
button{font:inherit;font-size:1.25rem;font-weight:800;padding:17px;border:0;border-radius:12px;background:#000;color:#fff;cursor:pointer}[hidden]{display:none!important}
.klein{font-size:.875rem;color:#000;margin:8px 0 0}.fout{color:#b91c1c;font-weight:700;margin:4px 0 0;font-size:.9375rem}
.klaar{border:2px solid #000;border-radius:14px;padding:16px;margin-top:4px}.klaar h2{margin:0 0 6px;font-size:1.375rem}
.vm{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;z-index:50}.vk{position:relative;background:#fff;color:#000;width:100%;max-width:30rem;border-radius:18px 18px 0 0;padding:22px 18px 18px;box-sizing:border-box;max-height:85vh;overflow:auto}@media(min-width:700px){.vm{align-items:center}.vk{border-radius:18px}}.vk h2{font-size:1.5rem;line-height:1.15;margin:0 0 6px}.vk p{margin:0 0 12px}.vi{float:right;width:88px;height:88px;object-fit:cover;border-radius:10px;margin:0 0 8px 12px}.vx{position:absolute;top:6px;right:6px;width:44px;height:44px;padding:0;background:#fff;color:#000;font-size:1.75rem;line-height:1;border-radius:22px}.vk form{clear:both}
.zie{display:block;text-align:center;margin:12px 0 0;padding:14px;border:2px solid #000;border-radius:12px;color:#000;font-weight:800;text-decoration:none}
details{margin:22px 0 0;font-size:.9375rem}summary{font-weight:700;cursor:pointer}footer{margin-top:26px;font-size:.8125rem}</style>
<script src="/cm.js" data-site="kadolywin" async></script></head><body data-versie="${esc(versie)}">
<header class="topbar"><div class="wrap"><span class="mark">Kadoly</span></div></header>
<main class="wrap${boven ? ' boven' : ''}">
${boven ? tekst + formHtml + beeld : beeld + tekst + formHtml}
<div id="ok" hidden><div class="klaar"><h2>Bijna klaar</h2><p style="margin:0">Open de mail van Kadoly en tik op <b>Ja, ik doe mee</b>. Dan doe je mee met de trekking van ${esc(datumKort(z))}. Niets binnen? Kijk ook bij reclame of spam.</p><a id="mk" class="zie" hidden target="_blank" rel="noopener" href="#">Open je mail</a></div>${uitHref ? `<a class="zie" href="${esc(uitHref)}">Bekijk ${set ? 'de set' : 'het sieraad'} in de winkel</a>` : ''}</div>
<details><summary>Actievoorwaarden</summary>${regelsHtml()}</details>
</main>${modalHtml}
<footer><div class="wrap"><p>Kadoly by AdsFair B.V. · KvK 60126035 · Gouda · <a href="https://kadoly.com/shop/privacy">Privacy</a></p></div></footer>
<script>(function(){var C=${JSON.stringify(code)},KN=${JSON.stringify(twee ? 'Meld me aan' : knop)},KM=${JSON.stringify(knop)},VT=${JSON.stringify(K.vertrek)},t0=Date.now(),mens=false,veld=false,klaar=false,getoond=false;function b(e){try{navigator.sendBeacon('/api/shop/b',new Blob([JSON.stringify({c:C,e:e})],{type:'text/plain'}))}catch(x){}}
['scroll','touchstart','pointerdown','keydown'].forEach(function(ev){addEventListener(ev,function(){if(!mens){mens=true;b('mens')}},{passive:true})});
var f=document.getElementById('f'),e=document.getElementById('e'),x=document.getElementById('x'),k=document.getElementById('k'),k1=document.getElementById('k1');
function tik(){if(!veld){veld=true;b('veld')}}
if(k1)k1.addEventListener('click',function(){tik();k1.hidden=true;e.hidden=false;k.hidden=false;e.focus()});
e.addEventListener('focus',tik);e.addEventListener('input',function(){x.hidden=true});
function stuur(v,knop,fout,tekst,bron,ok){if(!/^[^\\s@]+@[^\\s@]+\\.[a-z]{2,}$/i.test(v)){fout.textContent='Vul een geldig e-mailadres in.';fout.hidden=false;return false}
knop.disabled=true;knop.textContent='Even geduld...';fetch('/api/shop/win',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({c:C,email:v,website:f.website.value,ms:Date.now()-t0,bron:bron})}).then(function(r){return r.json()}).then(function(j){
if(j&&j.ok){klaar=true;ok();mailKnop(v);try{window.mmUitkomst&&window.mmUitkomst('aanmelding')}catch(z){}}else{knop.disabled=false;knop.textContent=tekst;fout.textContent=j&&j.fout==='email'?'Vul een geldig e-mailadres in.':'Dat lukte niet. Probeer het zo nog eens.';fout.hidden=false}})
.catch(function(){knop.disabled=false;knop.textContent=tekst;fout.textContent='Geen verbinding. Probeer het nog eens.';fout.hidden=false});return true}
function mailKnop(v){var d=(String(v).split('@')[1]||'').toLowerCase(),u=/gmail|googlemail/.test(d)?'https://mail.google.com/mail/u/0/#search/from%3Akadoly':/hotmail|outlook|live\.|msn/.test(d)?'https://outlook.live.com/mail/0/':/yahoo/.test(d)?'https://mail.yahoo.com/':/icloud|^me\.com|^mac\.com/.test(d)?'https://www.icloud.com/mail':/ziggo/.test(d)?'https://webmail.ziggo.nl':/kpnmail|planet|hetnet|home\.nl|kpnplanet/.test(d)?'https://mail.kpnmail.nl':'';var a=document.getElementById('mk');if(a&&u){a.href=u;a.hidden=false}}
function paginaKlaar(){f.hidden=true;document.getElementById('ok').hidden=false}
f.addEventListener('submit',function(ev){ev.preventDefault();if(!stuur(e.value.trim(),k,x,KN,'pagina',paginaKlaar))e.focus()});
var vm=document.getElementById('vm');if(vm){var ve=document.getElementById('ve'),vb=document.getElementById('vb'),vfx=document.getElementById('vfx');
function toon(){if(getoond||klaar||veld)return;getoond=true;vm.hidden=false;b('mtoon');setTimeout(function(){try{ve.focus({preventScroll:true})}catch(z){}},250)}
function dicht(){vm.hidden=true;b('mweg')}
document.getElementById('vx').addEventListener('click',dicht);vm.addEventListener('click',function(ev){if(ev.target===vm)dicht()});ve.addEventListener('input',function(){vfx.hidden=true});
document.getElementById('vf').addEventListener('submit',function(ev){ev.preventDefault();stuur(ve.value.trim(),vb,vfx,KM,'modal',function(){vm.hidden=true;paginaKlaar()})});
if(VT==='terug'||VT==='beide'){try{history.pushState({kw:1},'')}catch(z){}addEventListener('popstate',function(){if(!getoond&&!klaar&&!veld){toon();try{history.pushState({kw:1},'')}catch(z){}}else{history.back()}});document.addEventListener('mouseout',function(ev){if(!ev.relatedTarget&&ev.clientY<=0)toon()})}
if(VT==='stil'||VT==='beide'){setTimeout(toon,15000)}}
})();</script>
</body></html>`;
}
