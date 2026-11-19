// Zorgverzekering 2027 voor heel Nederland (Henkjan 17 nov 2026: "zorgverzekeringen helemaal compleet maakt voor Nederland want komt veel
// verkeer aan . Ik wil gevonden worden in de AIs" en "Gaat om goed vergelijken" met de look van todayin.email/surgery, en "vooral intent
// trainen via de chat"). Alles komt uit data/zorg/*.json (verzameld uit de sites van verzekeraars en officiële bronnen, elk feit met bron
// en datum); ontbreekt iets, dan staat het er niet. Informatief: geen advies, geen bemiddeling.
import { measureTag } from './kleur.js';
import { kzuxBlok } from './kzux.js';
import { formulier, updates } from './zorgmail.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HOST = 'keuzehulp.best', BASIS = 'https://' + HOST + '/zorgverzekering';
const DIR = process.env.ZORG_TEST_DIR || join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'zorg');
const lees = f => { try { return JSON.parse(readFileSync(join(DIR, f), 'utf8')); } catch (e) { return null; } };
let CACHE = null;
export function data() {
  if (CACHE) return CACHE;
  const basis = lees('basis-2027.json') || { polissen: [] }, aanv = lees('aanvullend-2027.json') || { pakketten: [] }, regels = lees('regels-2027.json') || { feiten: [] }, vragen = lees('vragen-2027.json') || {}, labelTeksten = lees('teksten-labels.json') || {}, teksten = { ...labelTeksten, ...(lees('teksten.json') || {}) };
  const vp = ((lees('vraagpaginas.json') || {}).paginas || []).filter(x => x && x.slug && x.h1); vp.forEach(x => { if (!teksten[x.slug]) teksten[x.slug] = { kort: x.kort, alineas: x.alineas || [], faq: x.faq || [] }; });
  const antwoorden = [...((lees('antwoorden-a.json') || {}).antwoorden || []), ...((lees('antwoorden-b.json') || {}).antwoorden || [])].filter(x => x && x.vraag && x.antwoord);
  CACHE = { basis, aanv, regels, vragen, teksten, vp, antwoorden, labelTeksten }; return CACHE;
}
const knip = (x, n = 155) => { x = String(x || ''); if (x.length <= n) return x; const z = x.slice(0, n), p = z.lastIndexOf('. '); return p > 80 ? z.slice(0, p + 1) : z.replace(/\s+\S*$/, ''); };
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const slugify = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' en ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const eur = n => n == null || isNaN(n) ? '' : '€\u00a0' + Number(n).toFixed(2).replace('.', ',');
const eurP = p => eur(p.premie) + ((p.premieJaar || p.jaar) && (p.premieJaar || p.jaar) < 2027 ? ' <span class="klein">(2026)</span>' : '');
const eur0 = n => n == null || isNaN(n) ? '' : '€\u00a0' + Math.round(Number(n)).toLocaleString('nl-NL');
const feit = id => (data().regels.feiten || []).find(f => f.id === id) || null;
const feitZoek = re => (data().regels.feiten || []).find(f => re.test(f.id + ' ' + (f.onderwerp || '') + ' ' + (f.feit || ''))) || null;
const VORM = { natura: 'Natura', restitutie: 'Restitutie', budget: 'Budget', combinatie: 'Combinatie' };
const kortL = l => String(l || '').replace(/\s*\(.*?\)/g, '').trim();
export const naamP = p => { const l = kortL(p.label); return String(p.polis).toLowerCase().startsWith(l.toLowerCase()) ? p.polis : l + ' ' + p.polis; };
const polissen = () => (data().basis.polissen || []).filter(p => p && p.label && p.polis && !/niet bevestigd/i.test(p.polis)).map(p => ({ ...p, id: slugify(naamP(p)) }));
const metPremie = () => polissen().filter(p => typeof p.premie2027 === 'number' && p.premie2027 > 50).sort((a, b) => a.premie2027 - b.premie2027);
const labels = () => { const m = {}; polissen().forEach(p => { const k = slugify(p.label); (m[k] = m[k] || { slug: k, label: p.label, concern: p.concern, polissen: [] }).polissen.push(p); }); return Object.values(m).sort((a, b) => a.label.localeCompare(b.label, 'nl')); };
const vandaag = () => new Date().toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'long', year: 'numeric' });
const ORG = { '@type': 'Organization', '@id': 'https://keuzehulp.best/#org', name: 'keuzehulp.best', url: 'https://keuzehulp.best/' };

// ---------- vormgeving: de look van todayin.email/surgery (outname.now), met het blauw van keuzehulp.best ----------
export const CSS = `:root{--ink:#111113;--body:#3A3F47;--muted:#6B7280;--line:#E5E7EB;--line2:#B9BFC7;--acc:#2B47C4;--acc2:#EEF1FC;--bg:#fff;--ok:#1F7A4D}
@media (prefers-color-scheme:dark){:root{--ink:#F2F3F5;--body:#C9CDD3;--muted:#8B929B;--line:#272C37;--line2:#4A5260;--acc:#93A6FF;--acc2:#1B2246;--bg:#0F1116;--ok:#71CF9E}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:var(--bg);color:var(--body);font:400 17px/1.6 "Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
header{border-bottom:1px solid var(--line)}header .wrap{max-width:1080px;display:flex;align-items:center;gap:16px;padding:16px 20px;flex-wrap:wrap}
.mark{font-size:20px;font-weight:700;letter-spacing:-.02em;color:var(--ink);text-decoration:none}.mark em{color:var(--acc);font-style:normal}
.tl{margin-left:auto;display:flex;gap:4px;flex-wrap:wrap}.tl a{color:var(--muted);font-size:14px;font-weight:600;padding:4px 8px;border-radius:999px;text-decoration:none}.tl a:hover{color:var(--ink);background:var(--acc2)}
.wrap{max-width:800px;margin:0 auto;padding:0 20px}main{padding:28px 0 56px}
h1{font-size:clamp(32px,5.6vw,48px);line-height:1.12;letter-spacing:-.03em;color:var(--ink);margin:6px 0 14px;font-weight:700;text-wrap:balance}
h2{font-size:24px;line-height:1.3;letter-spacing:-.02em;color:var(--ink);font-weight:700;margin:44px 0 12px;text-wrap:balance}h3{font-size:18px;color:var(--ink);font-weight:600;margin:20px 0 6px}
p{margin:0 0 14px}.lead{font-size:19px;max-width:62ch}strong,b{color:var(--ink);font-weight:600}a{color:var(--acc);text-decoration:none}a:hover{text-decoration:underline}
.crumbs{font-size:14px;color:var(--muted);margin:0 0 8px}.crumbs a{color:var(--muted)}
.kaart{background:var(--acc2);border-radius:14px;padding:20px 22px;margin:18px 0}.kaart p:last-child{margin:0}
.klein{font-size:14px;color:var(--muted)}
.tabel{width:100%;border-collapse:collapse;margin:8px 0 6px;font-size:16px}.tabel th{text-align:left;font-size:14px;color:var(--muted);font-weight:600;padding:8px 6px;border-bottom:1px solid var(--line2);cursor:pointer;white-space:nowrap}.tabel td{padding:10px 6px;border-bottom:1px solid var(--line);vertical-align:top}.tabel td.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}.tabel tr.top td{background:var(--acc2)}
.tw{overflow-x:auto;-webkit-overflow-scrolling:touch}@media (max-width:520px){#vt th:nth-child(4),#vt td:nth-child(4){display:none}.tabel{font-size:15px}}
.pills{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 12px}.pills button,.pills a{font:inherit;font-size:15px;font-weight:600;border:1.5px solid var(--acc);background:transparent;color:var(--acc);border-radius:999px;padding:6px 14px;cursor:pointer;text-decoration:none}.pills button[aria-pressed=true]{background:var(--acc);color:#fff}
.reken{border:1px solid var(--line);border-radius:14px;padding:18px 20px;margin:18px 0}.reken label{display:block;font-size:15px;font-weight:600;color:var(--ink);margin:10px 0 4px}.reken select{width:100%;font:inherit;font-size:16px;padding:10px 14px;border:1px solid var(--line2);border-radius:999px;background:var(--bg);color:var(--ink)}
.uit{margin:14px 0 0}.uit ol{margin:6px 0 0;padding-left:20px}
.reken-alles{padding:0 0 4px!important}.reken-alles>summary{padding:14px 0;list-style:none;display:flex;justify-content:space-between}.reken-alles>summary::-webkit-details-marker{display:none}.reken-alles>summary::after{content:"+";font-weight:400;font-size:20px;line-height:1}.reken-alles[open]>summary::after{content:"\\2212"}.kx-rl{margin:4px 0 8px;padding-left:22px}.kx-rl li{margin:0 0 4px}
.kn{display:inline-block;background:var(--acc);color:#fff!important;border-radius:999px;padding:10px 18px;font-weight:600;text-decoration:none;margin:6px 8px 0 0}.kn.l{background:transparent;color:var(--acc)!important;border:1.5px solid var(--acc)}
.rij{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0}@media (max-width:640px){.rij{grid-template-columns:1fr}}
.tegel{border:1px solid var(--line);border-radius:14px;padding:14px 16px;text-decoration:none;color:var(--body);display:block}.tegel b{display:block;color:var(--ink)}.tegel:hover{border-color:var(--acc)}
details{border-top:1px solid var(--line);padding:16px 0 16px 20px}details:last-of-type{border-bottom:1px solid var(--line)}summary{cursor:pointer;font-weight:600;color:var(--ink);font-size:16px;line-height:1.6;list-style-position:outside}summary::marker{color:var(--muted)}details p{margin:8px 0 0;font-size:15px;line-height:1.75;color:var(--body)}

.chips{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 18px}.chips a{background:var(--acc2);color:var(--ink);border-radius:999px;padding:6px 14px;font-size:14px;font-weight:600;text-decoration:none}.chips a:hover{color:var(--acc);text-decoration:none}
footer{border-top:1px solid var(--line);padding:24px 0 40px;font-size:14px;color:var(--muted)}footer a{color:var(--muted)}
#kxf #kxq{border:0!important}`;
const NAV = '<nav class="tl"><a href="https://keuzehulp.best/zorgverzekering">Vergelijken</a><a href="https://keuzehulp.best/zorgverzekering/goedkoopste-zorgverzekering-2027">Goedkoopste</a><a href="https://keuzehulp.best/zorgverzekering/tandartsverzekering">Tandarts</a><a href="https://keuzehulp.best/zorgverzekering/overstappen">Overstappen</a><a href="https://keuzehulp.best/zorgverzekering/eigen-risico-2027">Eigen risico</a></nav>';
const MEET = measureTag('kz', 'a[rel~="nofollow"],form button', '.kx-ps button,#kxf button', 'zorg'); // bezoek per bron in dezelfde tellers als de andere keuzehulpen (c:kz-hv-<dag>-<bron>)
function doc({ titel, desc, pad, body, schema, noindex, canon }) {
  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(titel) + '</title><meta name="description" content="' + esc(desc) + '"><link rel="canonical" href="' + (canon || 'https://' + HOST + pad) + '">' + (noindex ? '<meta name="robots" content="noindex,follow">' : '') +
    '<link rel="icon" href="data:,"><style>' + CSS + '</style><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, '\\u003c') + '</script></head><body><header><div class="wrap"><a class="mark" href="https://keuzehulp.best/">keuzehulp<em>.best</em></a>' + NAV + '</div></header><main><div class="wrap">' + body +
    '</div></main><footer><div class="wrap"><p>keuzehulp.best is onafhankelijk en informatief: we geven geen advies en bemiddelen niet. Premies en vergoedingen komen van de sites van de verzekeraars en van officiële bronnen, met datum; controleer altijd de polisvoorwaarden voor je overstapt. Bijgewerkt ' + esc(vandaag()) + '.</p><p><a href="https://keuzehulp.best/zorgverzekering">Zorgverzekering vergelijken</a> · <a href="https://keuzehulp.best/zorgverzekering/updates">Alle wijzigingen</a> · <a href="https://keuzehulp.best/">Alle keuzehulpen</a></p><p>Wat betaalt je verzekering bij een ingreep? <a href="https://todayin.email/surgery/nl/staaroperatie-kosten">Staaroperatie: kosten en vergoeding</a> · <a href="https://todayin.email/surgery/nl/ooglidcorrectie-kosten">Ooglidcorrectie: kosten en vergoeding</a> · <a href="https://todayin.email/surgery/nl/borstverkleining-kosten">Borstverkleining: kosten en vergoeding</a> · <a href="https://todayin.email/surgery/nl">Klinieken en artsen vergelijken</a></p></div></footer>' + MEET + '</body></html>';
}
const chat = (slug, term, faq, reken, kop) => kzuxBlok({ alleenChat: true, kop: kop || 'Vraag het de keuzehulp', taal: 'nl', site: 'kzuxzorg', slug: 'zorg-' + slug, term, shop: '', prods: [], opties: [], faq: (faq || []).map(([q, a]) => ({ q, a })), reken });
const faqBlok = faq => faq.length ? '<h2>Vragen</h2>' + faq.map(([q, a]) => '<details><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('') : '';
const faqSchema = faq => faq.length ? { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) } : null;
const bronnen = list => { const u = [...new Set(list.filter(Boolean))].slice(0, 12); return u.length ? '<p class="klein">Bronnen: ' + u.map((x, i) => '<a href="' + esc(x) + '" rel="nofollow noopener" target="_blank">' + (i + 1) + '</a>').join(' · ') + '</p>' : ''; };
// overstapherinnering: een agenda-afspraak (.ics) zonder dat we iets opslaan (notify-me versie 1)
const herinner = (label) => formulier(labels().map(l => ({ slug: l.slug, label: kortL(l.label) })), label ? '/' + label : '', label);

// ---------- tabel van alle basisverzekeringen met filters ----------
function tabel(ps, opts = {}) {
  const rijen = ps.map((p, i) => '<tr data-vorm="' + esc(p.vorm || '') + '"' + (i < 3 && opts.top ? ' class="top"' : '') + '><td><a href="/zorgverzekering/' + slugify(p.label) + '">' + esc(p.label) + '</a><br><span class="klein">' + esc(p.polis) + '</span></td><td>' + esc(VORM[p.vorm] || p.vorm || '') + '</td><td class="n">' + (p.premie2027 != null ? eur(p.premie2027) : '<span class="klein">volgt</span>') + '</td><td class="n">' + (p.premie2027 != null ? eur0(p.premie2027 * 12) : '') + '</td></tr>').join('');
  const vormen = [...new Set(ps.map(p => p.vorm).filter(Boolean))].sort();
  return '<div class="pills" id="vf"><button type="button" data-v="" aria-pressed="true">Alle</button>' + vormen.map(v => '<button type="button" data-v="' + esc(v) + '" aria-pressed="false">' + esc(VORM[v] || v) + '</button>').join('') + '</div>' +
    '<div class="tw"><table class="tabel" id="vt"><thead><tr><th>Verzekeraar en polis</th><th>Vorm</th><th class="n">Per maand</th><th class="n">Per jaar</th></tr></thead><tbody>' + rijen + '</tbody></table></div>' +
    '<script>(function(){var f=document.getElementById("vf"),t=document.getElementById("vt");if(!f||!t)return;f.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;[].forEach.call(f.children,function(x){x.setAttribute("aria-pressed",x===b?"true":"false")});var v=b.dataset.v;[].forEach.call(t.tBodies[0].rows,function(r){r.hidden=v&&r.dataset.vorm!==v})})})()</script>';
}
// ---------- rekenhulp: jaarkosten = 12 x premie + wat je van het eigen risico verwacht te betalen ----------
// 19 nov 2026, Henkjan: "Alle list boxen worden in design van design niet dit !!! En ook hier alles in de chat met pills. Hou je aan design !!":
// de rekenhulp vraagt nu in de chat met pills (rekenZorg, mechanisme lib/kzux.js kxReken), zelfde berekening in de browser zonder AI;
// het oude blok met keuzelijsten staat ingeklapt onder "Alles zelf invullen".
const zorgPolissen = () => metPremie().map(p => ({ l: naamP(p), u: '/zorgverzekering/' + slugify(p.label), p: '', v: /^100%/.test(p.vrijeKeuze || '') ? 'vrij' : '', m: p.premie2027, ver: (p.vrijwilligEigenRisico || []).map(x => [x.extra, x.premie]).filter(x => x[0] && x[1]) }));
function ZREKEN(o) {
  var e = function (n) { return '\u20ac\u00a0' + Math.round(n).toLocaleString('nl-NL'); }, g = Number(o.g || 0), v = o.v || '', L = [];
  ZP.forEach(function (p) { if (v && p.v !== v) return; var k = p.m * 12 + Math.min(g, ZER), b = { k: k, t: '' }; p.ver.forEach(function (x) { var kk = x[1] * 12 + Math.min(g, ZER + x[0]); if (kk < b.k) b = { k: kk, t: ' met ' + e(x[0]) + ' vrijwillig eigen risico' }; }); L.push({ p: p, k: b.k, t: b.t }); });
  L.sort(function (a, b) { return a.k - b.k; }); if (!L.length) return null;
  var z = g >= ZER ? 'het hele eigen risico van ' + e(ZER) : g > 0 ? e(g) + ' van het eigen risico' : 'niets van het eigen risico';
  return { vel: { budget: 'ongeveer ' + e(L[0].k) + ' per jaar', wanneer: '2027' }, q: 'zorgverzekering 2027: zorggebruik ' + (g >= ZER ? 'veel' : g > 0 ? 'een beetje' : 'bijna niets') + (v ? ', vrije keuze' : '') + ': goedkoopst ' + L[0].p.l + ' ' + e(L[0].k) + ' per jaar',
    h: '<p class="kx-rk-k">Goedkoopst voor jou in 2027, per jaar</p><ol class="kx-rl">' + L.slice(0, 5).map(function (x) { return '<li><a href="' + x.p.u + '">' + x.p.l + '</a>' + x.t + ': <b>' + e(x.k) + '</b></li>'; }).join('') + '</ol>' +
      '<p class="kx-rk-w">Zo rekenen we: 12 keer de premie plus ' + z + ' dat je waarschijnlijk zelf betaalt. Huisarts en zorg voor kinderen tellen niet mee voor het eigen risico. Premie zonder korting, van de sites van de verzekeraars (bronnen onder de tabel). Vrijwillig eigen risico loont alleen als je bijna geen zorg gebruikt.</p>' };
}
function rekenZorg() {
  const er = feit('eigen-risico-2027'), ps = zorgPolissen(); if (!ps.length || !er || !er.getal) return undefined;
  const gStap = { f: 'g', v: 'Hoeveel zorg verwacht je in 2027? Bijna niets is alleen de huisarts, een beetje is een paar keer medicijnen of bloedonderzoek, veel is ziekenhuis, specialist of vaste medicijnen.', p: [['Bijna niets', '0'], ['Een beetje', '200'], ['Veel', '9999']] };
  return { wat: 'zorgverzekering', tot: 2, voortg: '{n} van {t} klaar', ph: 'Of typ je vraag over je zorgverzekering', zelf: 'alles',
    st: [gStap, { f: 'v', v: 'Wil je zelf je zorgverlener kunnen kiezen zonder bij te betalen?', p: [['Maakt niet uit', ''], ['Ja, 100% vergoed', 'vrij']] }],
    na: [{ l: 'Andere zorgvraag', s: 'stap', st: gStap }, { l: 'Alle polissen vergelijken', s: 'link', href: '#vt' }, { l: 'Overstappen: zo werkt het', s: 'link', href: '/zorgverzekering/overstappen' }, { l: 'Alles zelf invullen', s: 'zelf' }, { l: 'Koppel aan je assistent', s: 'koppel', href: '/koppel' }],
    js: 'var REKEN=(function(){"use strict";var ZP=' + JSON.stringify(ps).replace(/</g, '\\u003c') + ',ZER=' + Number(er.getal) + ';' + ZREKEN.toString() + ';return ZREKEN})();' };
}
export const _zorgTest = { ZREKEN, rekenZorg };
function rekenhulp() {
  const er = feit('eigen-risico-2027'), ps = zorgPolissen();
  if (!ps.length || !er || !er.getal) return '';
  return '<details class="reken-alles" id="alles"><summary>Alles zelf invullen</summary><div class="reken" id="rk"><h2 style="margin-top:0">Wat kost het jou per jaar?</h2><p class="klein">Premie plus het deel van het eigen risico (' + eur0(er.getal) + ' in 2027) dat je waarschijnlijk betaalt. Huisarts en zorg voor kinderen tellen niet mee voor het eigen risico.</p>' +
    '<label for="rkg">Hoeveel zorg verwacht je in 2027?</label><select id="rkg"><option value="0">Bijna niets (alleen huisarts)</option><option value="200">Een beetje (een paar keer medicijnen of bloedonderzoek)</option><option value="9999" selected>Veel (ziekenhuis, specialist, vaste medicijnen)</option></select>' +
    '<label for="rkv">Wil je zelf je zorgverlener kunnen kiezen zonder bij te betalen?</label><select id="rkv"><option value="">Maakt niet uit</option><option value="vrij">Ja, 100% vergoed ook zonder contract</option></select>' +
    '<div class="uit" id="rku"></div></div>' +
    '<script>(function(){var P=' + JSON.stringify(ps) + ',ER=' + er.getal + ';function e(n){return "€ "+Math.round(n).toLocaleString("nl-NL")}function r(){var g=+document.getElementById("rkg").value,v=document.getElementById("rkv").value,o=[];P.forEach(function(p){if(v&&p.v!==v)return;var k=p.m*12+Math.min(g,ER),b={k:k,t:""};p.ver.forEach(function(x){var kk=x[1]*12+Math.min(g,ER+x[0]);if(kk<b.k)b={k:kk,t:" met "+e(x[0])+" vrijwillig eigen risico"}});o.push({p:p,k:b.k,t:b.t})});o.sort(function(a,b){return a.k-b.k});document.getElementById("rku").innerHTML="<strong>Goedkoopst voor jou</strong><ol>"+o.slice(0,5).map(function(x){return "<li>"+x.p.l+x.t+": "+e(x.k)+" per jaar</li>"}).join("")+"</ol><p class=\\"klein\\">Een schatting op basis van de premie zonder korting. Vrijwillig eigen risico loont alleen als je bijna geen zorg gebruikt.</p>"}document.getElementById("rkg").onchange=r;document.getElementById("rkv").onchange=r;window.__rkZet=function(c){if(c.g!=null)document.getElementById("rkg").value=String(c.g);if(c.v!=null)document.getElementById("rkv").value=String(c.v);r()};r()})()</script></details>';
}

// ---------- pagina's ----------
export const SITUATIES = [
  { slug: 'student', naam: 'Student', h1: 'Zorgverzekering voor studenten', re: /student/i },
  { slug: 'zzp', naam: 'Zzp\'er', h1: 'Zorgverzekering voor zzp\'ers', re: /zzp|zelfstandig/i },
  { slug: 'kinderen-en-gezin', naam: 'Gezin met kinderen', h1: 'Zorgverzekering voor je gezin en kinderen', re: /kind|gezin|18/i },
  { slug: '65-plus', naam: '65-plus', h1: 'Zorgverzekering voor 65-plussers', re: /65|aow|pensioen|oudere/i },
  { slug: 'chronisch-ziek', naam: 'Chronisch ziek', h1: 'Zorgverzekering als je chronisch ziek bent', re: /chronisch|compensatie/i },
  { slug: 'zwanger', naam: 'Zwanger', h1: 'Zorgverzekering als je zwanger bent', re: /zwanger|kraam|bevalling|verloskund/i },
  { slug: 'laag-inkomen', naam: 'Laag inkomen', h1: 'Zorgverzekering met een laag inkomen', re: /zorgtoeslag|inkomen|betaling|achterstand|wanbetal/i },
  { slug: 'buitenland', naam: 'Buitenland en expats', h1: 'Zorgverzekering in het buitenland of als expat', re: /buitenland|expat|verdragsland|kennismigrant|emigr/i },
];
export const VRAGEN = [
  { slug: 'eigen-risico-2027', h1: 'Eigen risico 2027', re: /eigen risico/i, cluster: 'eigen risico' },
  { slug: 'overstappen', h1: 'Overstappen van zorgverzekering in 2027', re: /overstap|opzeg|1 februari|31 december/i, cluster: 'overstappen' },
  { slug: 'natura-of-restitutie', h1: 'Natura, restitutie, budget of combinatie?', re: /natura|restitutie|budget|combinatie|hinderpaal|niet-gecontracteerd/i, cluster: 'polisvorm' },
  { slug: 'zorgtoeslag-2027', h1: 'Zorgtoeslag 2027', re: /zorgtoeslag/i, cluster: 'zorgtoeslag' },
  { slug: 'basispakket-2027', h1: 'Wat zit er in het basispakket 2027?', re: /basispakket|acceptatieplicht/i, cluster: 'premie' },
  { slug: 'collectieve-zorgverzekering', h1: 'Collectieve zorgverzekering: hoeveel korting nog in 2027?', re: /collectie|korting/i, cluster: 'collectief' },
  { slug: 'beste-zorgverzekering-2027', h1: 'Welke zorgverzekering past bij mij in 2027?', re: /natura|restitutie|eigen risico|aanvullend|vrije keuze/i, cluster: 'kiezen' },
];
const reVan = t => { try { return new RegExp(t || '^$', 'i'); } catch (e) { return /^$/; } };
export const VRAGEN_ALLE = () => VRAGEN.concat((data().vp || []).filter(x => !VRAGEN.some(v => v.slug === x.slug)).map(x => ({ slug: x.slug, h1: x.h1, re: reVan(x.re), cluster: x.cluster || '', term: x.term || x.h1 })));
export const DEKKING = [
  { slug: 'tandartsverzekering', h1: 'Tandartsverzekering 2027 vergelijken', veld: 'tandarts', naam: 'tandarts' },
  { slug: 'fysiotherapie-vergoeding', h1: 'Fysiotherapie vergoeding 2027 per verzekeraar', veld: 'fysio', naam: 'fysiotherapie' },
  { slug: 'bril-en-lenzen-vergoeding', h1: 'Bril en lenzen vergoeding 2027 per verzekeraar', veld: 'bril', naam: 'bril en lenzen' },
  { slug: 'alternatieve-zorg-vergoeding', h1: 'Alternatieve zorg vergoeding 2027', veld: 'alternatief', naam: 'alternatieve zorg' },
  { slug: 'buitenland-dekking', h1: 'Zorg in het buitenland: wat vergoedt je aanvullende verzekering?', veld: 'buitenland', naam: 'buitenland' },
  { slug: 'orthodontie-kinderen', h1: 'Orthodontie voor kinderen: vergoeding 2027', veld: 'orthodontieKind', naam: 'orthodontie' },
];
const antwoordenVoor = slug => (data().antwoorden || []).filter(x => x.pagina === slug);
const tekst = slug => { const t = (data().teksten || {})[slug] || null, a = antwoordenVoor(slug); if (!a.length) return t; const al = new Set(((t && t.faq) || []).map(f => String(f[0]).toLowerCase())); return { ...(t || {}), faq: [...((t && t.faq) || []), ...a.filter(x => !al.has(x.vraag.toLowerCase())).map(x => [x.vraag, x.antwoord])].slice(0, 30) }; }; // eigen geschreven teksten per pagina: {kort, alineas:[], faq:[[q,a]]}
const relevanteFeiten = re => (data().regels.feiten || []).filter(f => re.test((f.onderwerp || '') + ' ' + (f.feit || '') + ' ' + f.id));
const vragenVan = cluster => ((data().vragen.vragen) || []).filter(v => v && v.cluster === cluster).map(v => v.vraag || v.q).filter(Boolean).slice(0, 12);

export function hub() {
  const ps = metPremie(), alle = polissen(), er = feit('eigen-risico-2027'), t = tekst('hub') || {}, goedkoop = ps[0];
  const faq = (t.faq || []).slice(0, 8);
  const kort = '<div class="kaart">' + (goedkoop ? '<p><strong>Goedkoopste basisverzekering 2027:</strong> ' + esc(naamP(goedkoop)) + ' voor ' + eur(goedkoop.premie2027) + ' per maand (' + esc(VORM[goedkoop.vorm] || goedkoop.vorm) + ').</p>' : '') + (er && er.getal ? '<p><strong>Eigen risico 2027:</strong> ' + eur0(er.getal) + '.</p>' : '') + '<p><strong>Overstappen:</strong> kan tot en met 31 december; je nieuwe verzekeraar zegt je oude polis voor je op.</p>' + (t.kort ? '<p>' + esc(t.kort) + '</p>' : '') + '</div>';
  const body = '<p class="crumbs"><a href="/">keuzehulp.best</a> › Zorgverzekering</p><h1>Zorgverzekering 2027 vergelijken</h1>' + chat('hub', 'zorgverzekering 2027', faq, rekenZorg(), 'Wat kost het jou per jaar?') + '<p class="lead">Alle ' + alle.length + ' basisverzekeringen van 2027 naast elkaar, met de premie per maand en per jaar, de polisvorm en wat je zelf betaalt. Onafhankelijk, zonder advies of bemiddeling.</p>' + kort +
    rekenhulp() + '<h2>Alle basisverzekeringen 2027</h2><p class="klein">Gesorteerd van goedkoop naar duur, premie zonder korting. Tik op een vorm om te filteren.</p>' + tabel(ps.concat(alle.filter(p => p.premie2027 == null)), { top: true }) + bronnen(ps.map(p => p.bron)) +
    herinner() + '<h2>Voor jouw situatie</h2><div class="rij">' + SITUATIES.map(s => '<a class="tegel" href="/zorgverzekering/' + s.slug + '"><b>' + esc(s.naam) + '</b>Wat je moet weten en wat het kost</a>').join('') + '</div>' +
    '<h2>Aanvullend en tandarts</h2><div class="rij">' + DEKKING.map(s => '<a class="tegel" href="/zorgverzekering/' + s.slug + '"><b>' + esc(s.h1.replace(/ 2027.*$/, '')) + '</b>Per verzekeraar naast elkaar</a>').join('') + '</div>' +
    '<h2>Veelgestelde vragen</h2><div class="rij">' + VRAGEN.slice(0, 8).map(s => '<a class="tegel" href="/zorgverzekering/' + s.slug + '"><b>' + esc(s.h1) + '</b></a>').join('') + '</div>' + (VRAGEN_ALLE().length > 8 ? '<div class="chips">' + VRAGEN_ALLE().slice(8).map(s => '<a href="/zorgverzekering/' + s.slug + '">' + esc(s.h1) + '</a>').join('') + '</div>' : '') + '<p><a href="/zorgverzekering/vragen">Alle vragen over zorgverzekeringen</a></p>' +
    '<h2>Per verzekeraar</h2><div class="chips">' + labels().map(l => '<a href="/zorgverzekering/' + l.slug + '">' + esc(kortL(l.label)) + '</a>').join('') + '</div>' + faqBlok(faq);
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebPage', url: BASIS, name: 'Zorgverzekering 2027 vergelijken', inLanguage: 'nl-NL', dateModified: new Date().toISOString().slice(0, 10), publisher: { '@id': ORG['@id'] } }, { '@type': 'ItemList', name: 'Basisverzekeringen 2027 van goedkoop naar duur', numberOfItems: ps.length, itemListElement: ps.slice(0, 50).map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: naamP(p) + ' (' + eur(p.premie2027) + ' per maand)' })) }, faqSchema(faq)].filter(Boolean) };
  return doc({ titel: 'Zorgverzekering 2027 vergelijken: alle ' + alle.length + ' polissen', desc: (goedkoop ? 'Goedkoopste 2027: ' + goedkoop.label + ' ' + eur(goedkoop.premie2027) + ' p/m. ' : '') + 'Alle basisverzekeringen 2027 met premie, polisvorm en jaarkosten. Onafhankelijk.', pad: '/zorgverzekering', body, schema });
}
function goedkoopste() {
  const ps = metPremie(), t = tekst('goedkoopste-zorgverzekering-2027') || {}, faq = t.faq || [];
  const per = {}; ps.forEach(p => { if (p.vorm && !per[p.vorm]) per[p.vorm] = p; });
  const body = '<p class="crumbs"><a href="/zorgverzekering">Zorgverzekering</a> › Goedkoopste</p><h1>Goedkoopste zorgverzekering 2027</h1>' + chat('goedkoopste-zorgverzekering-2027', 'goedkoopste zorgverzekering 2027', faq, rekenZorg(), 'Wat kost het jou per jaar?') +
    (ps[0] ? '<div class="kaart"><p><strong>De goedkoopste basisverzekering van 2027 is ' + esc(naamP(ps[0])) + ' voor ' + eur(ps[0].premie2027) + ' per maand.</strong></p>' + Object.keys(per).map(v => '<p>Goedkoopste ' + esc((VORM[v] || v).toLowerCase()) + 'polis: ' + esc(naamP(per[v])) + ', ' + eur(per[v].premie2027) + '.</p>').join('') + '</div>' : '') +
    (t.alineas || []).map(a => '<p>' + esc(a) + '</p>').join('') + rekenhulp() + '<h2>De 20 goedkoopste basisverzekeringen</h2>' + tabel(ps.slice(0, 20), { top: true }) + bronnen(ps.slice(0, 20).map(p => p.bron)) + herinner() + faqBlok(faq);
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'ItemList', name: 'Goedkoopste zorgverzekeringen 2027', itemListElement: ps.slice(0, 20).map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: naamP(p) + ' (' + eur(p.premie2027) + ' per maand)' })) }, faqSchema(faq)].filter(Boolean) };
  return doc({ titel: 'Goedkoopste zorgverzekering 2027' + (ps[0] ? ': ' + ps[0].label + ' ' + eur(ps[0].premie2027) : ''), desc: 'De 20 goedkoopste basisverzekeringen van 2027 met premie per maand en per jaar, per polisvorm. Met rekenhulp voor je jaarkosten.', pad: '/zorgverzekering/goedkoopste-zorgverzekering-2027', body, schema });
}
function labelPagina(l) {
  const t = tekst(l.slug) || {}, faq = t.faq || [], pk = (data().aanv.pakketten || []).filter(p => slugify(p.label) === l.slug);
  const ps = l.polissen.slice().sort((a, b) => (a.premie2027 ?? 999) - (b.premie2027 ?? 999));
  const alle = metPremie(), plek = p => alle.findIndex(x => x.id === p.id) + 1;
  const body = '<p class="crumbs"><a href="/zorgverzekering">Zorgverzekering</a> › ' + esc(l.label) + '</p><h1>' + esc(l.label) + ' zorgverzekering 2027</h1>' + chat(l.slug, l.label + ' zorgverzekering', faq) + (t.kort ? '<p class="lead">' + esc(t.kort) + '</p>' : '') +
    '<div class="kaart">' + ps.map(p => '<p><strong>' + esc(p.polis) + '</strong> (' + esc(VORM[p.vorm] || p.vorm || '') + '): ' + (p.premie2027 != null ? eur(p.premie2027) + ' per maand' + (plek(p) ? ', plek ' + plek(p) + ' van ' + alle.length + ' op prijs' : '') : 'premie volgt') + (p.vrijeKeuze ? '. Niet-gecontracteerde zorg: ' + esc(p.vrijeKeuze) : '') + '.</p>').join('') + (l.concern ? '<p class="klein">Onderdeel van ' + esc(l.concern) + '.</p>' : '') + '</div>' +
    (t.alineas || []).map(a => '<p>' + esc(a) + '</p>').join('') +
    (pk.length ? '<h2>Aanvullende pakketten van ' + esc(l.label) + '</h2><div class="tw"><table class="tabel"><thead><tr><th>Pakket</th><th class="n">Per maand</th><th>Tandarts</th><th>Fysio</th><th>Bril</th></tr></thead><tbody>' + pk.map(p => '<tr><td>' + esc(p.pakket) + '</td><td class="n">' + eurP(p) + '</td><td>' + esc(p.tandarts || '') + '</td><td>' + esc(p.fysio || '') + '</td><td>' + esc(p.bril || '') + '</td></tr>').join('') + '</tbody></table></div>' : '') +
    bronnen(ps.map(p => p.bron).concat(pk.map(p => p.bron))) + '<h2>Vergelijk met andere verzekeraars</h2>' + tabel(alle.slice(0, 10), { top: true }) + herinner(l.slug) + faqBlok(faq);
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebPage', url: BASIS + '/' + l.slug, name: l.label + ' zorgverzekering 2027', inLanguage: 'nl-NL', publisher: { '@id': ORG['@id'] } }, faqSchema(faq)].filter(Boolean) };
  const p0 = ps.find(p => p.premie2027 != null);
  return doc({ titel: kortL(l.label) + (/zorgverzekering/i.test(l.label) ? '' : ' zorgverzekering') + ' 2027' + (p0 ? ': vanaf ' + eur(p0.premie2027) : ''), desc: l.label + ' 2027: ' + ps.length + ' basisverzekering' + (ps.length > 1 ? 'en' : '') + (p0 ? ' vanaf ' + eur(p0.premie2027) + ' per maand' : '') + (pk.length ? ', ' + pk.length + ' aanvullende pakketten' : '') + '. Vergeleken met alle andere verzekeraars.', pad: '/zorgverzekering/' + l.slug, body, schema });
}
function dekkingPagina(d) {
  const t = tekst(d.slug) || {}, faq = t.faq || [], pk = (data().aanv.pakketten || []).filter(p => p[d.veld] && !/^(geen|nee|niet)\b|alleen na ongeval/i.test(String(p[d.veld])));
  const body = '<p class="crumbs"><a href="/zorgverzekering">Zorgverzekering</a> › ' + esc(d.naam) + '</p><h1>' + esc(d.h1) + '</h1>' + chat(d.slug, d.naam + ' vergoeding', faq) +
    (t.kort ? '<div class="kaart"><p>' + esc(t.kort) + '</p></div>' : '') + (t.alineas || []).map(a => '<p>' + esc(a) + '</p>').join('') +
    (pk.length ? '<h2>' + pk.length + ' pakketten naast elkaar</h2><div class="tw"><table class="tabel"><thead><tr><th>Verzekeraar en pakket</th><th class="n">Per maand</th><th>' + esc(d.naam) + '</th></tr></thead><tbody>' + pk.sort((a, b) => (a.premie ?? 999) - (b.premie ?? 999)).map(p => '<tr><td><a href="/zorgverzekering/' + slugify(p.label) + '">' + esc(p.label) + '</a><br><span class="klein">' + esc(p.pakket) + '</span></td><td class="n">' + eurP(p) + '</td><td>' + esc(p[d.veld]) + '</td></tr>').join('') + '</tbody></table></div>' + bronnen(pk.map(p => p.bron)) : '') + herinner() + faqBlok(faq);
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebPage', url: BASIS + '/' + d.slug, name: d.h1, inLanguage: 'nl-NL', publisher: { '@id': ORG['@id'] } }, faqSchema(faq)].filter(Boolean) };
  return doc({ titel: d.h1.slice(0, 60), desc: d.h1 + ': ' + pk.length + ' pakketten met premie en vergoeding naast elkaar. Bron per verzekeraar, onafhankelijk.', pad: '/zorgverzekering/' + d.slug, body, schema, noindex: pk.length < 5 && !t.kort });
}
function feitenPagina(p, soort) {
  const t = tekst(p.slug) || {}, faq = t.faq || [], fs = relevanteFeiten(p.re).slice(0, 14);
  const body = '<p class="crumbs"><a href="/zorgverzekering">Zorgverzekering</a> › ' + esc(p.naam || p.h1) + '</p><h1>' + esc(p.h1) + '</h1>' + chat(p.slug, (p.naam || p.h1).toLowerCase(), faq) +
    (t.kort ? '<div class="kaart"><p>' + esc(t.kort) + '</p></div>' : '') + (t.alineas || []).map(a => '<p>' + esc(a) + '</p>').join('') +
    (fs.length ? '<h2>De regels op een rij</h2><ul>' + fs.map(f => '<li>' + (f.status === 'raming' ? '<span class="klein">Raming:</span> ' : f.status === 'voorstel' ? '<span class="klein">Voorstel, nog niet besloten:</span> ' : '') + esc(f.feit) + (f.bron ? ' <a class="klein" href="' + esc(f.bron) + '" rel="nofollow noopener" target="_blank">bron</a>' : '') + '</li>').join('') + '</ul>' : '') +
    (soort === 'situatie' ? '<h2>Goedkoopste basisverzekeringen 2027</h2>' + tabel(metPremie().slice(0, 10), { top: true }) : '') + herinner() + faqBlok(faq) +
    '<h2>Ook handig</h2><div class="chips">' + VRAGEN_ALLE().filter(v => v.slug !== p.slug).slice(0, 10).map(v => '<a href="/zorgverzekering/' + v.slug + '">' + esc(v.h1) + '</a>').join('') + '</div>';
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebPage', url: BASIS + '/' + p.slug, name: p.h1, inLanguage: 'nl-NL', publisher: { '@id': ORG['@id'] } }, faqSchema(faq)].filter(Boolean) };
  return doc({ titel: p.h1.slice(0, 60), desc: knip(t.kort || p.h1 + ': de regels, bedragen en deadlines voor 2027 uit officiële bronnen.'), pad: '/zorgverzekering/' + p.slug, body, schema, noindex: !fs.length && !t.kort });
}
export function pagina(slug) {
  if (!metPremie().length) return null; // nog geen data: niets live zetten
  if (!slug) return hub();
  if (slug === 'goedkoopste-zorgverzekering-2027') return goedkoopste();
  if (slug === 'updates') return updatesPagina();
  const s = SITUATIES.find(x => x.slug === slug); if (s) return feitenPagina(s, 'situatie');
  if (slug === 'vragen') return vragenPagina();
  const v = VRAGEN_ALLE().find(x => x.slug === slug); if (v) return feitenPagina(v, 'vraag');
  const d = DEKKING.find(x => x.slug === slug); if (d) return dekkingPagina(d);
  const l = labels().find(x => x.slug === slug); if (l) return labelPagina(l);
  if (losseLabels().includes(slug)) return losPagina(slug);
  return null;
}
// archief van de wijzigingsmail: todayin.email/verzekeringen (rewrite in todayin site/vercel.json) en keuzehulp.best/zorgverzekering/updates
// labels zonder eigen polis in 2027 (gestopt of anders genoemd) die nog veel gezocht worden: alleen de eigen tekst
const LOS_NAAM = { zekur: 'ZEKUR', anderzorg: 'Anderzorg', ditzo: 'Ditzo', promovendum: 'Promovendum', 'izz-door-cz': 'IZZ door CZ' };
const losseLabels = () => Object.keys(data().labelTeksten || {}).filter(k => !labels().some(l => l.slug === k));
function losPagina(slug) {
  const t = tekst(slug) || {}, faq = t.faq || [], naam = LOS_NAAM[slug] || slug.replace(/-/g, ' ');
  const body = '<p class="crumbs"><a href="/zorgverzekering">Zorgverzekering</a> › ' + esc(naam) + '</p><h1>' + esc(naam) + ' zorgverzekering 2027</h1>' + chat(slug, naam + ' zorgverzekering', faq) + (t.kort ? '<div class="kaart"><p>' + esc(t.kort) + '</p></div>' : '') + (t.alineas || []).map(a => '<p>' + esc(a) + '</p>').join('') + '<h2>De goedkoopste basisverzekeringen 2027</h2>' + tabel(metPremie().slice(0, 10), { top: true }) + herinner() + faqBlok(faq);
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebPage', url: BASIS + '/' + slug, name: naam + ' zorgverzekering 2027', inLanguage: 'nl-NL', publisher: { '@id': ORG['@id'] } }, faqSchema(faq)].filter(Boolean) };
  return doc({ titel: naam + ' zorgverzekering 2027: wat er verandert', desc: knip(t.kort || naam + ' zorgverzekering in 2027.'), pad: '/zorgverzekering/' + slug, body, schema });
}
export function updatesPagina() {
  const d = new Date().toISOString().slice(0, 10), lijst = updates().filter(x => x.dag <= d && (!x.labels || x.labels.includes('*')));
  const per = updates().filter(x => x.dag <= d && x.labels && !x.labels.includes('*'));
  const body = '<p class="crumbs"><a href="https://keuzehulp.best/zorgverzekering">Zorgverzekering</a> › Updates</p><h1>Zorgverzekering: wat er verandert</h1><p class="lead">Elke wijziging aan premies, vergoedingen, regels en deadlines voor 2027, met datum en bron. Aanmelden en je krijgt alleen een mail als er iets verandert.</p>' + herinner() +
    lijst.map(it => '<h2 style="font-size:20px;margin:32px 0 6px">' + esc(it.kop) + '</h2><p class="klein"><time datetime="' + esc(it.dag) + '">' + esc(new Date(it.dag + 'T12:00:00Z').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })) + '</time></p><p>' + esc(it.tekst || '') + '</p><p class="klein">' + (it.pad ? '<a href="https://keuzehulp.best/zorgverzekering' + esc(it.pad) + '">Lees meer</a>' : '') + (it.bron ? (it.pad ? ' · ' : '') + '<a href="' + esc(it.bron) + '" rel="nofollow noopener" target="_blank">bron</a>' : '') + '</p>').join('') +
    (per.length ? '<h2>Premie 2027 per verzekeraar</h2><ul>' + per.map(it => '<li><a href="https://keuzehulp.best/zorgverzekering' + esc(it.pad) + '">' + esc(it.kop) + '</a></li>').join('') + '</ul>' : '');
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'ItemList', name: 'Wijzigingen zorgverzekering 2027', itemListElement: lijst.slice(0, 30).map((it, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'NewsArticle', headline: it.kop, datePublished: it.dag, description: it.tekst, publisher: { '@id': ORG['@id'] } } })) }] };
  return doc({ titel: 'Zorgverzekering 2027: alle wijzigingen en deadlines', desc: 'Wat er in 2027 verandert aan premies, eigen risico, basispakket en zorgtoeslag, met datum en bron. Mail bij elke wijziging.', pad: '/zorgverzekering/updates', canon: 'https://todayin.email/verzekeringen', body, schema });
}
// alle vragen op één pagina, per onderwerp (Henkjan 17 nov: "heel erg compleet ... met content en vragen")
const CLUSTERNAAM = { overstappen: 'Overstappen', opzeggen: 'Opzeggen', polisvorm: 'Natura, combinatie en vrije keuze', 'eigen risico': 'Eigen risico', premie: 'Premie', verzekeraar: 'Verzekeraars', 'betalen/achterstand': 'Betalen en achterstand', tandarts: 'Tandarts', fysio: 'Fysiotherapie', bril: 'Bril en lenzen', buitenland: 'Buitenland', doelgroep: 'Voor jouw situatie', collectief: 'Collectief', zorgtoeslag: 'Zorgtoeslag', overig: 'Overig' };
export function vragenPagina() {
  const a = data().antwoorden || [], g = {}; a.forEach(x => (g[x.cluster || 'overig'] = g[x.cluster || 'overig'] || []).push(x));
  const delen = Object.keys(g).sort((x, y) => g[y].length - g[x].length);
  const body = '<p class="crumbs"><a href="/zorgverzekering">Zorgverzekering</a> › Alle vragen</p><h1>Alle vragen over je zorgverzekering in 2027</h1>' + chat('vragen', 'zorgverzekering 2027') + '<p class="lead">' + a.length + ' vragen die mensen echt stellen, met een kort antwoord en de cijfers van 2027. Staat jouw vraag er niet bij, stel hem dan aan de keuzehulp hierboven.</p><div class="chips">' + delen.map(c => '<a href="#' + slugify(c) + '">' + esc(CLUSTERNAAM[c] || c) + '</a>').join('') + '</div>' +
    delen.map(c => '<h2 id="' + slugify(c) + '">' + esc(CLUSTERNAAM[c] || c) + '</h2>' + g[c].map(x => '<details><summary>' + esc(x.vraag) + '</summary><p>' + esc(x.antwoord) + (x.pagina ? ' <a href="/zorgverzekering/' + esc(x.pagina) + '">Meer hierover</a>' : '') + '</p></details>').join('')).join('') + herinner();
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'FAQPage', mainEntity: a.slice(0, 120).map(x => ({ '@type': 'Question', name: x.vraag, acceptedAnswer: { '@type': 'Answer', text: x.antwoord } })) }] };
  return doc({ titel: 'Zorgverzekering 2027: ' + a.length + ' vragen en antwoorden', desc: 'Antwoord op ' + a.length + ' vragen over zorgverzekering 2027: overstappen, eigen risico, premie, tandarts, zorgtoeslag en meer. Met cijfers en bronnen.', pad: '/zorgverzekering/vragen', body, schema, noindex: a.length < 20 });
}
export function melding(titel, tekst) { return doc({ titel, desc: tekst, pad: '/zorgverzekering', body: '<h1>' + esc(titel) + '</h1><p class="lead">' + esc(tekst) + '</p><p><a class="kn" href="/zorgverzekering">Naar de vergelijking</a></p>', schema: { '@context': 'https://schema.org', '@graph': [ORG] }, noindex: true }); }
export function labelLijst() { return labels().map(l => ({ slug: l.slug, label: kortL(l.label) })); }
export function paden() { return ['', 'goedkoopste-zorgverzekering-2027', ...SITUATIES.map(s => s.slug), 'vragen', ...VRAGEN_ALLE().map(s => s.slug), ...DEKKING.map(s => s.slug), ...labels().map(l => l.slug), ...losseLabels()]; }
export function sitemap() { if (!metPremie().length) return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'; return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + paden().map(p => '<url><loc>' + BASIS + (p ? '/' + p : '') + '</loc></url>').join('') + '</urlset>'; }
// voor de chat (lib/kzchat.js): elke zorgpagina als keuzehulp met de feiten erin
export function chatItems() {
  if (!metPremie().length) return [];
  const ps = metPremie(), feiten = (data().regels.feiten || []).map(f => f.feit).filter(Boolean).slice(0, 60);
  const prijs = ps.slice(0, 40).map(p => naamP(p) + ' (' + (VORM[p.vorm] || p.vorm) + ') ' + eur(p.premie2027) + ' per maand' + (p.vrijeKeuze ? ', niet-gecontracteerd ' + p.vrijeKeuze : '')).join('; ');
  const pk = (data().aanv.pakketten || []).slice(0, 60).map(p => p.label + ' ' + p.pakket + ' ' + eur(p.premie) + ': tandarts ' + (p.tandarts || '-') + ', fysio ' + (p.fysio || '-') + ', bril ' + (p.bril || '-')).join('; ');
  const item = (slug, title, kort) => ({ slug: 'zorg-' + (slug || 'hub'), pad: '/zorgverzekering' + (slug ? '/' + slug : ''), term: title.toLowerCase(), title, kort, uitleg: 'Basisverzekeringen 2027 van goedkoop naar duur: ' + prijs + '. Regels 2027: ' + feiten.join(' ') + ' Aanvullende pakketten: ' + pk, faq: ((tekst(slug || 'hub') || {}).faq || []).map(([q, a]) => ({ q, a })) });
  return [item('', 'Zorgverzekering 2027 vergelijken', 'Alle basisverzekeringen 2027 met premie, polisvorm en jaarkosten.'), item('goedkoopste-zorgverzekering-2027', 'Goedkoopste zorgverzekering 2027', 'De goedkoopste basisverzekeringen van 2027.'),
    ...SITUATIES.map(s => item(s.slug, s.h1, s.h1 + ' in 2027.')), ...VRAGEN_ALLE().map(s => item(s.slug, s.h1, ((tekst(s.slug) || {}).kort) || s.h1 + '.')), ...DEKKING.map(s => item(s.slug, s.h1, ((tekst(s.slug) || {}).kort) || s.h1 + '.')), ...labels().map(l => item(l.slug, kortL(l.label) + ' zorgverzekering 2027', ((tekst(l.slug) || {}).kort) || kortL(l.label) + ' zorgverzekering 2027.')), item('vragen', 'Alle vragen over zorgverzekering 2027', 'Antwoorden op vragen over zorgverzekering 2027.')];
}
export function llmsDeel() {
  const ps = metPremie(); if (!ps.length) return '';
  return '\n\n## Zorgverzekering 2027 ([vergelijken](' + BASIS + '))\n\n- [Alle basisverzekeringen 2027](' + BASIS + '): ' + ps.length + ' polissen met premie; goedkoopste ' + naamP(ps[0]) + ' ' + eur(ps[0].premie2027) + ' per maand.\n' + paden().filter(Boolean).slice(0, 40).map(p => '- [' + p.replace(/-/g, ' ') + '](' + BASIS + '/' + p + ')').join('\n');
}
