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
// ---- lerende pagina (Henkjan 25 nov 2026: "Maak pagina volledig lerend per 50 verbeteren .") ----
// Elke versie verandert één of twee dingen. Bezoekers krijgen een versie via Thompson-trekking (Beta(1+mail, 1+bezoek-mail)), vast per klik.
// Elke 50 bezoeken een leermoment: de versie met de grootste kans de slechtste te zijn (vanaf 60%, elke actieve versie minstens 15 bezoeken)
// gaat eruit en de volgende uitdager uit de rij komt erbij. Zo verbetert de pagina elke 50 bezoeken. Stand: op=winstand (proef).
export const VARIANTEN = {
  a: { kop: 'Win {ding}', knop: 'Doe gratis mee' },
  b: { kop: 'Gratis kans op {ding}', knop: 'Ja, ik doe mee' },
  c: { kop: 'Win {ding}', knop: 'Doe gratis mee', formBoven: true },
  d: { kop: 'Win {ding}', knop: 'Doe gratis mee', tweestap: true },
  e: { kop: 'Wil jij {ding} winnen?', knop: 'Ja, stuur mij de kans' },
  f: { kop: 'Win {ding} van € {prijs}', knop: 'Doe gratis mee', pot: true },
  g: { kop: 'Gratis kans op {ding}', knop: 'Ja, ik doe mee', formBoven: true, tweestap: true },
  h: { kop: 'Win {ding}', knop: 'Doe gratis mee', sub: 'Zondag hoor je of je gewonnen hebt. Meedoen is gratis.' },
  i: { kop: '{ding} kan zondag van jou zijn', knop: 'Ik doe mee' },
  j: { kop: 'Win {ding}', knop: 'Doe gratis mee', formBoven: true, pot: true }
};
const PROEF_START = { actief: ['a', 'b', 'c', 'd'], rij: ['e', 'f', 'g', 'h', 'i', 'j'], uit: [], n: 0, leer: 0, log: [] };
const PK = 'kd:win:proef';
async function proef(kv) { const p = await kv.get(PK).catch(() => null); return p && Array.isArray(p.actief) ? p : JSON.parse(JSON.stringify(PROEF_START)); }
async function armStand(kv, id) { const h = await kv.raw(['HGETALL', 'kd:win:arm:' + id]).catch(() => null); const o = {}; if (Array.isArray(h)) for (let i = 0; i < h.length; i += 2) o[h[i]] = Number(h[i + 1]) || 0; else if (h && typeof h === 'object') for (const k in h) o[k] = Number(h[k]) || 0; return { bezoek: o.bezoek || 0, mail: o.mail || 0 }; }
function gamma(a) { if (a < 1) return gamma(a + 1) * Math.pow(Math.random(), 1 / a); const d = a - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { const u1 = Math.random(), u2 = Math.random(); x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = Math.random(); if (u < 1 - 0.0331 * x * x * x * x || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; } }
const beta = (a, b) => { const x = gamma(a), y = gamma(b); return x / (x + y); };
export async function kiesArm(kv, code) {
  if (code) { const al = await kv.get('kd:win:wa:' + code).catch(() => null); if (al && VARIANTEN[al]) return al; }
  const p = await proef(kv); let best = p.actief[0], bv = -1;
  for (const id of p.actief) { const s = await armStand(kv, id); const v = beta(1 + s.mail, 1 + Math.max(0, s.bezoek - s.mail)); if (v > bv) { bv = v; best = id; } }
  if (code) { await kv.set('kd:win:wa:' + code, best, { ex: 7 * 86400 }).catch(() => {}); await kv.raw(['HINCRBY', 'kd:win:arm:' + best, 'bezoek', '1']).catch(() => {});
    p.n = (p.n || 0) + 1; if (p.n - (p.leer || 0) >= 50) await leermoment(kv, p); else await kv.set(PK, p).catch(() => {}); }
  return best;
}
export async function armMail(kv, code) { const a = code ? await kv.get('kd:win:wa:' + code).catch(() => null) : null; if (!a || !VARIANTEN[a]) return null; const k = 'kd:win:wm:' + code; if (await kv.raw(['SET', k, '1', 'NX', 'EX', String(7 * 86400)]).catch(() => null)) await kv.raw(['HINCRBY', 'kd:win:arm:' + a, 'mail', '1']).catch(() => {}); return a; }
export async function leermoment(kv, p) {
  p = p || await proef(kv); p.leer = p.n; const S = {}; for (const id of p.actief) S[id] = await armStand(kv, id);
  let regel = 'leermoment na ' + p.n + ' bezoeken: ' + p.actief.map(id => id + ' ' + S[id].mail + '/' + S[id].bezoek).join(', ');
  if (p.actief.length >= 2 && p.actief.every(id => S[id].bezoek >= 15)) {
    const sl = Object.fromEntries(p.actief.map(id => [id, 0])); for (let r = 0; r < 4000; r++) { let w = null, wv = 2; for (const id of p.actief) { const v = beta(1 + S[id].mail, 1 + Math.max(0, S[id].bezoek - S[id].mail)); if (v < wv) { wv = v; w = id; } } sl[w]++; }
    const [slechtst, n] = Object.entries(sl).sort((a, b) => b[1] - a[1])[0]; const kans = n / 4000;
    if (kans >= 0.6) { p.actief = p.actief.filter(x => x !== slechtst); p.uit.push({ id: slechtst, at: new Date().toISOString(), ...S[slechtst], kans: Math.round(kans * 100) / 100 }); const nieuw = p.rij.shift(); if (nieuw) p.actief.push(nieuw); regel += '; ' + slechtst + ' eruit (' + Math.round(kans * 100) + '% kans slechtst)' + (nieuw ? ', ' + nieuw + ' erbij' : ''); }
    else regel += '; nog geen duidelijke verliezer (' + slechtst + ' ' + Math.round(kans * 100) + '%)';
  } else regel += '; te weinig bezoeken per versie';
  p.log = [{ at: new Date().toISOString(), t: regel }].concat(p.log || []).slice(0, 30); await kv.set(PK, p).catch(() => {});
  try { await kv.raw(['LPUSH', 'mm:handover:log', JSON.stringify({ t: new Date().toISOString(), wie: 'kadoly-winactie', tekst: 'Winactiepagina ' + regel })]); await kv.raw(['LTRIM', 'mm:handover:log', '0', '299']); } catch (e) {}
  return p;
}
export async function proefStand(kv) { const p = await proef(kv); const arms = {}; for (const id of [...p.actief, ...p.uit.map(x => x.id)]) { const s = await armStand(kv, id); arms[id] = { ...s, ratio: s.bezoek ? Math.round(1000 * s.mail / s.bezoek) / 10 + '%' : '-', actief: p.actief.includes(id), ...VARIANTEN[id] }; } return { n: p.n, volgendeLeer: (p.leer || 0) + 50, actief: p.actief, rij: p.rij, arms, uit: p.uit, log: p.log.slice(0, 10) }; }

export function winPagina({ held, set = '', bedrag = 0, code = '', uitHref = '', look = '', arm = 'a', pot = 0 }) {
  const V = VARIANTEN[arm] || VARIANTEN.a;
  const z = trekking(); const naam = set || kortNaam(held.t); const prijs = set ? Math.round(Number(bedrag) || 0) : Math.round((Number(held.p) || 0) + (Number(held.vk) || 0));
  const ding = set ? 'deze set' : 'dit sieraad';
  let kop = V.kop.replace('{ding}', ding).replace('{prijs}', String(prijs)); kop = kop.charAt(0).toUpperCase() + kop.slice(1);
  if (/\{prijs\}|€ 0\b/.test(kop) || (V.kop.includes('{prijs}') && !prijs)) kop = 'Win ' + ding;
  const sub = V.sub || 'Elke week loten we 1 winnaar. Meedoen is gratis.';
  const potRegel = V.pot && pot >= 10 ? `<p class="pot">${pot} mensen doen deze week al mee.</p>` : '';
  const formHtml = `<form id="f" novalidate${V.tweestap ? ' class="twee"' : ''}>${V.tweestap ? `<button type="button" id="k1">${esc(V.knop)}</button>` : ''}<input type="email" name="email" id="e" placeholder="jouw@email.nl" autocomplete="email" inputmode="email" required aria-label="Je e-mailadres"${V.tweestap ? ' hidden' : ''}><input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><button type="submit" id="k"${V.tweestap ? ' hidden' : ''}>${esc(V.tweestap ? 'Meld me aan' : V.knop)}</button><p class="fout" id="x" hidden></p></form>
<p class="klein">Je krijgt een mail om te bevestigen; pas dan doe je mee. Daarna af en toe sieradentips, afmelden met één klik.</p>`;
  const beeld = `<img class="img${V.formBoven ? ' klein-img' : ''}" src="${esc(held.img)}" alt="${esc(naam)}" width="460" height="460">`;
  const tekst = `<span class="tag">Winactie · trekking ${esc(datumKort(z))}</span>
<h1>${esc(kop)}</h1>
<p class="uitleg">${esc(naam)}${prijs ? ' (€ ' + prijs + ')' : ''}. ${esc(sub)}</p>${potRegel}`;
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(kop)} | Kadoly</title>
<style>${look}
.wrap{max-width:30rem}.topbar .wrap{height:50px}main{padding:10px 0 4px}
.img{display:block;width:100%;max-height:38vh;aspect-ratio:1/1;object-fit:cover;border-radius:14px;background:#f3f4f6}.klein-img{max-height:26vh;margin-top:14px}
.tag{display:inline-block;margin:12px 0 6px;background:#000;color:#fff;font-weight:700;font-size:.875rem;padding:5px 10px;border-radius:999px}
h1{font-size:1.875rem;line-height:1.1;margin:2px 0 6px;letter-spacing:-.02em}.uitleg{margin:0 0 12px;font-size:1.0625rem;color:#000;background:none;padding:0}.pot{margin:-4px 0 12px;font-weight:700}
form{display:grid;gap:10px}input[type=email]{font:inherit;font-size:1.125rem;padding:15px 14px;border:2px solid #000;border-radius:12px;width:100%;box-sizing:border-box;color:#000;background:#fff}
button{font:inherit;font-size:1.25rem;font-weight:800;padding:17px;border:0;border-radius:12px;background:#000;color:#fff;cursor:pointer}[hidden]{display:none!important}
.klein{font-size:.875rem;color:#000;margin:8px 0 0}.fout{color:#b91c1c;font-weight:700;margin:4px 0 0;font-size:.9375rem}
.klaar{border:2px solid #000;border-radius:14px;padding:16px;margin-top:4px}.klaar h2{margin:0 0 6px;font-size:1.375rem}
.zie{display:block;text-align:center;margin:12px 0 0;padding:14px;border:2px solid #000;border-radius:12px;color:#000;font-weight:800;text-decoration:none}
details{margin:22px 0 0;font-size:.9375rem}summary{font-weight:700;cursor:pointer}footer{margin-top:26px;font-size:.8125rem}</style>
<script src="/cm.js" data-site="kadolywin" async></script></head><body data-versie="${esc(arm)}">
<header class="topbar"><div class="wrap"><span class="mark">Kadoly</span></div></header>
<main class="wrap">
${V.formBoven ? tekst + formHtml + beeld : beeld + tekst + formHtml}
<div id="ok" hidden><div class="klaar"><h2>Bijna klaar</h2><p style="margin:0">Open de mail van Kadoly en tik op <b>Ja, meld me aan</b>. Dan doe je mee met de trekking van ${esc(datumKort(z))}.</p></div>${uitHref ? `<a class="zie" href="${esc(uitHref)}">Bekijk ${set ? 'de set' : 'het sieraad'} in de winkel</a>` : ''}</div>
<details><summary>Actievoorwaarden</summary>${regelsHtml()}</details>
</main>
<footer><div class="wrap"><p>Kadoly by AdsFair B.V. · KvK 60126035 · Gouda · <a href="https://kadoly.com/shop/privacy">Privacy</a></p></div></footer>
<script>(function(){var C=${JSON.stringify(code)},KN=${JSON.stringify(V.tweestap ? 'Meld me aan' : V.knop)},t0=Date.now(),mens=false;function b(e){try{navigator.sendBeacon('/api/shop/b',new Blob([JSON.stringify({c:C,e:e})],{type:'text/plain'}))}catch(x){}}
['scroll','touchstart','pointerdown','keydown'].forEach(function(ev){addEventListener(ev,function(){if(!mens){mens=true;b('mens')}},{passive:true})});
var f=document.getElementById('f'),e=document.getElementById('e'),x=document.getElementById('x'),k=document.getElementById('k'),k1=document.getElementById('k1');
if(k1)k1.addEventListener('click',function(){k1.hidden=true;e.hidden=false;k.hidden=false;e.focus()});
e.addEventListener('input',function(){x.hidden=true});
f.addEventListener('submit',function(ev){ev.preventDefault();var v=e.value.trim();if(!/^[^\\s@]+@[^\\s@]+\\.[a-z]{2,}$/i.test(v)){x.textContent='Vul een geldig e-mailadres in.';x.hidden=false;e.focus();return}
k.disabled=true;k.textContent='Even geduld...';fetch('/api/shop/win',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({c:C,email:v,website:f.website.value,ms:Date.now()-t0})}).then(function(r){return r.json()}).then(function(j){
if(j&&j.ok){f.hidden=true;document.getElementById('ok').hidden=false;try{window.mmUitkomst&&window.mmUitkomst('aanmelding')}catch(z){}}else{k.disabled=false;k.textContent=KN;x.textContent=j&&j.fout==='email'?'Vul een geldig e-mailadres in.':'Dat lukte niet. Probeer het zo nog eens.';x.hidden=false}})
.catch(function(){k.disabled=false;k.textContent=KN;x.textContent='Geen verbinding. Probeer het nog eens.';x.hidden=false})})})();</script>
</body></html>`;
}
