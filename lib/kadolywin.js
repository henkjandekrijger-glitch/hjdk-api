// Kadoly winactie (25 nov 2026, Henkjan: "ik wil mails verzamelen met prop ads . Dus zorg dat je CTA daar top is" en bij de keuze "Winactie";
// "Laat alles via mailmind en clickmind lopen"). PropellerAds-bezoekers landen op go.kadoly.com/shop op een actiepagina met één veld:
// e-mailadres, knop "Doe gratis mee". Aanmelden en bevestigen gaan door de motor van de lijst (lib/modalmotor.js, belofte winactie,
// dubbele bevestiging); de Mailmind-blokkeerlijst (mlm:af) geldt; Clickmind meet de pagina (cm.js) en elke stap telt per plek en advertentie.
// Pas na bevestigen doe je mee (welkomstmail zet je in de pot van de week). Trekking elke zondag na 20.00 uur Nederlandse tijd: op=winloting.
// Regels volgen de Gedragscode Promotionele Kansspelen 2014: gratis, prijs onder EUR 4.500, voorwaarden openbaar, winnaar per mail.
export const WIN = { prijs: 90, tot: '2026-12-27', van: '2026-11-25', organisator: 'Kadoly, onderdeel van AdsFair B.V., KvK 60126035, Albert Plesmanplein 20, 2805 AB Gouda', contact: 'henkjan@kadoly.com' };
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
<p><b>Prijs.</b> Elke week één sieraad naar keuze uit kadoly.com met een verkoopprijs tot en met € ${WIN.prijs}, verzending inbegrepen. Niet in te wisselen voor geld.</p>
<p><b>Trekking.</b> Elke zondag na 20.00 uur loten we de winnaar uit alle bevestigde deelnemers van die week. De winnaar krijgt binnen 3 dagen een mail en reageert binnen 14 dagen; anders loten we opnieuw. Kansspelbelasting betaalt de organisator.</p>
<p><b>Je gegevens.</b> We gebruiken je e-mailadres voor deze actie en voor onze mail met sieraden en cadeautips. Afmelden kan altijd met één klik onderaan elke mail. We delen je adres met niemand.</p>
<p><b>Verder.</b> Deze actie volgt de Gedragscode Promotionele Kansspelen 2014. Vragen of klachten: ${esc(WIN.contact)}.</p>`;
}
export function voorwaardenPagina() {
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Actievoorwaarden winactie | Kadoly</title><style>body{font:16px/1.6 -apple-system,system-ui,Segoe UI,Roboto,sans-serif;color:#000;max-width:34rem;margin:0 auto;padding:22px 18px}h1{font-size:24px;line-height:1.2}a{color:#000;font-weight:700}</style></head><body><h1>Actievoorwaarden winactie Kadoly</h1>${regelsHtml()}<p><a href="https://kadoly.com/shop">Naar Kadoly</a></p></body></html>`;
}
// De actiepagina. held = het product uit de advertentie (catalogus-item), set = naam van het pakket als de advertentie een set toont.
// Korte naam zonder merk na de komma en zonder "18k goud" (Waarborgwet: verguld is geen goud).
export const kortNaam = t => String(t || '').split(',')[0].replace(/\b18k\s*goud\s*vermeil\b/ig, 'verguld zilver').replace(/\b(18k|14k)\s*(goud|gold)\b/ig, 'verguld').replace(/\b(18k|14k)\b\s*/ig, '').replace(/\s{2,}/g, ' ').trim();
export function winPagina({ held, set = '', code = '', uitHref = '', look = '' }) {
  const z = trekking(); const naam = set || kortNaam(held.t); const prijs = Math.round((Number(held.p) || 0) + (Number(held.vk) || 0));
  const kop = set ? 'Win deze set' : 'Win dit sieraad';
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(kop)} | Kadoly</title>
<style>${look}
.wrap{max-width:30rem}.topbar .wrap{height:50px}main{padding:10px 0 4px}
.img{display:block;width:100%;max-height:38vh;aspect-ratio:1/1;object-fit:cover;border-radius:14px;background:#f3f4f6}
.tag{display:inline-block;margin:12px 0 6px;background:#000;color:#fff;font-weight:700;font-size:.875rem;padding:5px 10px;border-radius:999px}
h1{font-size:1.875rem;line-height:1.1;margin:2px 0 6px;letter-spacing:-.02em}.uitleg{margin:0 0 12px;font-size:1.0625rem;color:#000;background:none;padding:0}
form{display:grid;gap:10px}input[type=email]{font:inherit;font-size:1.125rem;padding:15px 14px;border:2px solid #000;border-radius:12px;width:100%;box-sizing:border-box;color:#000;background:#fff}
button{font:inherit;font-size:1.25rem;font-weight:800;padding:17px;border:0;border-radius:12px;background:#000;color:#fff;cursor:pointer}
.klein{font-size:.875rem;color:#000;margin:8px 0 0}.fout{color:#b91c1c;font-weight:700;margin:4px 0 0;font-size:.9375rem}
.klaar{border:2px solid #000;border-radius:14px;padding:16px;margin-top:4px}.klaar h2{margin:0 0 6px;font-size:1.375rem}
.zie{display:block;text-align:center;margin:12px 0 0;padding:14px;border:2px solid #000;border-radius:12px;color:#000;font-weight:800;text-decoration:none}
details{margin:22px 0 0;font-size:.9375rem}summary{font-weight:700;cursor:pointer}footer{margin-top:26px;font-size:.8125rem}</style>
<script src="/cm.js" data-site="kadolywin" async></script></head><body>
<header class="topbar"><div class="wrap"><span class="mark">Kadoly</span></div></header>
<main class="wrap">
<img class="img" src="${esc(held.img)}" alt="${esc(naam)}" width="460" height="460">
<span class="tag">Winactie · trekking ${esc(datumKort(z))}</span>
<h1>${esc(kop)}</h1>
<p class="uitleg">${esc(naam)}${prijs ? ' (€ ' + prijs + ')' : ''}. Elke week loten we 1 winnaar. Meedoen is gratis.</p>
<form id="f" novalidate><input type="email" name="email" id="e" placeholder="jouw@email.nl" autocomplete="email" inputmode="email" required aria-label="Je e-mailadres"><input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><button type="submit" id="k">Doe gratis mee</button><p class="fout" id="x" hidden></p></form>
<p class="klein">Je krijgt een mail om te bevestigen; pas dan doe je mee. Daarna af en toe sieradentips, afmelden met één klik.</p>
<div id="ok" hidden><div class="klaar"><h2>Bijna klaar</h2><p style="margin:0">Open de mail van Kadoly en tik op <b>Ja, meld me aan</b>. Dan doe je mee met de trekking van ${esc(datumKort(z))}.</p></div>${uitHref ? `<a class="zie" href="${esc(uitHref)}">Bekijk ${set ? 'de set' : 'het sieraad'} in de winkel</a>` : ''}</div>
<details><summary>Actievoorwaarden</summary>${regelsHtml()}</details>
</main>
<footer><div class="wrap"><p>Kadoly by AdsFair B.V. · KvK 60126035 · Gouda · <a href="https://kadoly.com/shop/privacy">Privacy</a></p></div></footer>
<script>(function(){var C=${JSON.stringify(code)},t0=Date.now(),mens=false;function b(e){try{navigator.sendBeacon('/api/shop/b',new Blob([JSON.stringify({c:C,e:e})],{type:'text/plain'}))}catch(x){}}
['scroll','touchstart','pointerdown','keydown'].forEach(function(ev){addEventListener(ev,function(){if(!mens){mens=true;b('mens')}},{passive:true})});
var f=document.getElementById('f'),e=document.getElementById('e'),x=document.getElementById('x'),k=document.getElementById('k');
e.addEventListener('input',function(){x.hidden=true});
f.addEventListener('submit',function(ev){ev.preventDefault();var v=e.value.trim();if(!/^[^\\s@]+@[^\\s@]+\\.[a-z]{2,}$/i.test(v)){x.textContent='Vul een geldig e-mailadres in.';x.hidden=false;e.focus();return}
k.disabled=true;k.textContent='Even geduld...';fetch('/api/shop/win',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({c:C,email:v,website:f.website.value,ms:Date.now()-t0})}).then(function(r){return r.json()}).then(function(j){
if(j&&j.ok){f.hidden=true;document.getElementById('ok').hidden=false;try{window.mmUitkomst&&window.mmUitkomst('aanmelding')}catch(z){}}else{k.disabled=false;k.textContent='Doe gratis mee';x.textContent=j&&j.fout==='email'?'Vul een geldig e-mailadres in.':'Dat lukte niet. Probeer het zo nog eens.';x.hidden=false}})
.catch(function(){k.disabled=false;k.textContent='Doe gratis mee';x.textContent='Geen verbinding. Probeer het nog eens.';x.hidden=false})})})();</script>
</body></html>`;
}
