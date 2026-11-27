// Het ene overzicht (Henkjan 27 nov 2026: "Ik vind oversight en dasboard onduidelijk laat me hier 1 overzicht UX zien", daarna "Ja" op het
// ontwerp): dashboard en oversight op één pagina, met bovenaan de takenlijst als zijn interface. Volgorde: taak typen, samenvatting, Taken
// (jij, bezig, wacht, klaar in één lijst, met opruimen), Geleerd van jou (wat hij vaker vraagt en zijn beslissingen met uitkomst), Bewaking,
// Geld en campagnes, Projecten, Meer. Eén kolom, één rijpatroon, drie lettermaten, één accent en één waarschuwingskleur, nooit grijs.
// De data komt uit dashData (d), met d.taken (lib/taken.js) en d.vol (oversight en campagnestand compleet). Niets hier schrijft: elke tik is
// een link naar /dashboard?doe=<JSON> of het formulier ?taak=..., en fn/mm.js stuurt daarna terug naar deze pagina.
import { campRegels } from './campstand.js';
import { aiUrl, aiKeuze, AI, startTekst } from './dashboard.js';
import { ACCOUNTS, ZWAARTE, DREMPEL, VENSTER, STIL_DAGEN, STIL_MIN, besluitStand, lessen, oppakPrompt } from './taken.js';

const HOST = 'https://hjdk-api-henq.vercel.app';
const esc = s => String(s == null ? '' : s).replace(/[—–]/g, '-').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MND = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const dag = x => (/^\d{4}-\d{2}-\d{2}/.test(String(x || '')) ? Number(String(x).slice(8, 10)) + ' ' + MND[Number(String(x).slice(5, 7)) - 1] : '');
const num = n => (n == null ? '' : String(Math.round(n * 100) / 100).replace('.', ','));
const geld = (n, t = '$') => (n < 0 ? '-' : '') + t + Math.abs(Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace('.', ',');
const knip = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + ' …' : t; };
const cap = s => String(s).charAt(0).toUpperCase() + String(s).slice(1);
const r = (label, inhoud, a) => '<div class="r' + (a ? ' a' : '') + '"><b>' + label + '</b><span>' + inhoud + '</span></div>';
const lijst = rijen => (rijen.length ? '<div class="lijst">' + rijen.join('') + '</div>' : '');
const blok = (k, h) => (h ? '<div class="blok"><h3>' + k + '</h3>' + h + '</div>' : '');
const doe = o => '/dashboard?doe=' + encodeURIComponent(JSON.stringify(o));
const KNOP = { browser: 'Claude', chatgpt: 'ChatGPT', desktop: 'Claude desktop' };
const LABEL = { jij: 'Jij', bezig: 'Bezig', wacht: 'Wacht', klaar: 'Klaar' };
const ZW = { licht: 'licht model', gewoon: 'gewoon model', zwaar: 'zwaar model' };
const UITSLAG = { raak: 'Raak', mis: 'Mis', nee: 'Nee', loopt: 'Loopt', gedaan: 'Gedaan', 'meet nog': 'Meet nog' };

export const CSS = `:root{--bg:#fff;--ink:#0B1640;--accent:#2B47C4;--on:#fff;--soft:#EEF1FC;--line:#D3DAF4;--alarm:#B3261E}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0A1030;--ink:#EEF1FC;--accent:#9DB0FF;--on:#0A1030;--soft:#141D4A;--line:#2A3670;--alarm:#FF8A80;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0A1030;--ink:#EEF1FC;--accent:#9DB0FF;--on:#0A1030;--soft:#141D4A;--line:#2A3670;--alarm:#FF8A80;color-scheme:dark}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font:400 18px/1.55 "Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
.w{max-width:680px;margin:0 auto;padding:18px 16px 56px;display:flex;flex-direction:column;gap:44px}
header{display:flex;align-items:center;justify-content:space-between;gap:12px}.merk{font-weight:700;letter-spacing:-.01em;color:var(--ink);text-decoration:none}.meta{color:var(--accent)}
h1,h2,h3{margin:0;text-wrap:balance}h1{font-size:40px;line-height:1.08;font-weight:700;letter-spacing:-.025em}h2{font-size:26px;line-height:1.2;font-weight:600;letter-spacing:-.015em}h3{font-size:18px;line-height:1.4;font-weight:700}
p{margin:0}a{color:var(--accent);text-underline-offset:4px;text-decoration-thickness:1px}
section{display:flex;flex-direction:column;gap:14px;scroll-margin-top:16px}
.lijst{display:flex;flex-direction:column;border-top:1px solid var(--line)}
.r{display:grid;grid-template-columns:88px 1fr;gap:14px;padding:13px 0;border-bottom:1px solid var(--line);overflow-wrap:anywhere}.r>b{color:var(--accent);font-weight:700;font-variant-numeric:tabular-nums}.r>span{min-width:0}.r.a>b{color:var(--alarm)}
details{border-bottom:1px solid var(--line)}summary{cursor:pointer;padding:14px 0;list-style:none;display:grid;grid-template-columns:1fr auto;gap:2px 14px;overflow-wrap:anywhere}summary::-webkit-details-marker{display:none}summary b{font-weight:700;min-width:0}summary i{font-style:normal;font-weight:700;color:var(--accent);font-variant-numeric:tabular-nums}summary span{grid-column:1/-1;color:var(--accent)}summary .balk{grid-column:1/-1}
.balk{height:8px;border-radius:999px;background:var(--soft);overflow:hidden;margin-top:6px}.balk i{display:block;height:100%;border-radius:999px;background:var(--accent)}
.in{padding:6px 0 26px;display:flex;flex-direction:column;gap:22px;overflow-wrap:anywhere}.t .in{gap:12px}.blok{display:flex;flex-direction:column;gap:8px}
.btn{align-self:flex-start;background:var(--accent);color:var(--on);border:0;border-radius:999px;padding:15px 28px;font:inherit;font-weight:700;line-height:1.2;text-decoration:none;text-align:center;cursor:pointer}
.tool{background:var(--soft);border-radius:18px;padding:22px}.tool .lijst{border-top:0}.tool .r:last-child{border-bottom:0;padding-bottom:0}.tool .r:first-child{padding-top:0}
.sub{border:0;margin-top:6px}.sub summary{display:inline;padding:0;color:var(--accent);text-decoration:underline;text-underline-offset:4px;text-decoration-thickness:1px}.sub .lijst{margin-top:10px}
.t summary i.al{color:var(--alarm)}.filter a.nu{font-weight:700;text-decoration:none;color:var(--ink)}[hidden]{display:none!important}
.invoer{display:flex;flex-direction:column;gap:12px}textarea,select,input[type=text]{width:100%;background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:12px 14px;font:inherit}
.rij2{display:flex;gap:12px;flex-wrap:wrap;align-items:center}.rij2 select{flex:1 1 220px;width:auto}
.antw{display:flex;gap:10px 14px;flex-wrap:wrap;align-items:center}.kn{display:inline-block;background:var(--accent);color:var(--on);border:0;border-radius:999px;padding:9px 18px;font:inherit;font-weight:700;line-height:1.2;text-decoration:none;cursor:pointer}
.typ{display:flex;gap:10px;flex:1 1 100%}.typ input{flex:1 1 auto}.meld{background:var(--soft);border-radius:10px;padding:12px 14px}
footer{padding-top:18px;border-top:1px solid var(--line)}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
@media (max-width:480px){h1{font-size:32px}h2{font-size:23px}.btn{align-self:stretch}.w{gap:36px}.r{grid-template-columns:76px 1fr;gap:12px}}`;

const SCRIPT = '(function(){var D=document,nu="open";function filter(f){nu=f;D.querySelectorAll(".filter a").forEach(function(a){a.className=a.getAttribute("data-f")===f?"nu":""});D.querySelectorAll("#rij details.t").forEach(function(x){var s=x.getAttribute("data-s");x.hidden=!(f==="alles"||(f==="open"&&s!=="klaar")||f===s)})}'
  + 'D.addEventListener("click",function(e){var t=e.target;if(!t.getAttribute)return;if(t.getAttribute("data-f")){e.preventDefault();filter(t.getAttribute("data-f"));return}if(t.getAttribute("data-zelf")){e.preventDefault();D.getElementById("zelf").hidden=false;t.remove();return}if(t.getAttribute("data-typ")){e.preventDefault();var f=t.parentNode.querySelector("form.typ");f.hidden=false;t.remove();f.querySelector("input[type=text]").focus()}});'
  + 'filter(location.hash==="#klaar"?"klaar":"open");function o(){var h=location.hash.slice(1);if(!h)return;var e=D.getElementById(h);if(e&&e.tagName==="DETAILS"){e.open=true;e.scrollIntoView()}}addEventListener("hashchange",o);o()})();';

export function overzichtHtml(d, opt = {}) {
  const ai = aiKeuze(opt.ai), knop = KNOP[ai], P = d.projecten || [], vandaag = d.vandaag, nuMs = Date.parse(d.gemaakt) || Date.now();
  const s = d.taken || { taken: [], besluiten: [], gewoon: [], accounts: {}, weg: {} }, o = (d.vol && d.vol.ov) || null, camp = (d.vol && d.vol.camp) || null;
  const naam = Object.fromEntries(P.map(p => [p.id, p.naam])), link = id => '<a href="#' + esc(id) + '">' + esc(naam[id] || id) + '</a>', pn = id => esc(naam[id] || id || 'Project: de agent kiest');
  const cur = t => { const m = typeof t === 'number' ? t : Date.parse(t); return new Date((isFinite(m) ? m : nuMs) - 4 * 36e5).toISOString(); };
  const wanneer = t => (cur(t).slice(0, 10) === cur(nuMs).slice(0, 10) ? cur(t).slice(11, 16) : dag(cur(t)));
  const weg = k => '<a href="' + esc(doe({ weg: [k] })) + '">Haal weg</a>';
  const bijDoel = id => { const p = P.find(x => x.id === id); return p && p.pct != null ? '<p>Hoort bij het doel van ' + esc(p.naam) + ': nu ' + esc(num(p.nu)) + ' van ' + esc(num(p.doelgetal)) + ' ' + esc(p.eenheid) + '.</p>' : ''; };
  const kop = t => knip(String(t).replace(/^Zeg\s+/i, '').replace(/"/g, ''), 62);
  const taak = (st, titel, meta, body, extra = '') => '<details class="t" data-s="' + st + '"' + extra + '><summary><b>' + esc(titel) + '</b><i' + (st === 'jij' ? ' class="al"' : '') + '>' + LABEL[st] + '</i><span>' + meta + '</span></summary><div class="in">' + body + '</div></details>';
  // antwoorden: knoppen uit de keuzes van de agent, anders uit de vraag zelf ("weg" of "upgrade", ja of nee); altijd ook typen en weghalen
  const keuzes = (t, k) => { if (k && k.length) return k; const q = [...String(t).matchAll(/"([^"]{2,24})"/g)].map(m => m[1]); return q.length ? q.slice(0, 3) : (/ja of nee|(^|: )ja\b/i.test(t) ? ['Ja', 'Nee'] : []); };
  const antw = (basis, t, k) => '<div class="antw">' + keuzes(t, k).map(x => '<a class="kn" href="' + esc(doe({ antwoord: Object.assign({}, basis, { tekst: cap(x) }) })) + '">' + esc(cap(x)) + '</a>').join('')
    + '<a href="#" data-typ="1">Typ antwoord</a><form class="typ" method="get" action="/dashboard" hidden><input type="hidden" name="doe" value="' + esc(JSON.stringify({ antwoord: basis })) + '"><input type="text" name="tekst" aria-label="Je antwoord" placeholder="Je antwoord" required><button class="kn" type="submit">Stuur</button></form>'
    + '<a href="' + esc(doe({ antwoord: Object.assign({}, basis, { weg: true }) })) + '">Haal weg</a></div>';

  // 1. De lijst: jij, bezig, wacht, klaar
  const T = s.taken.filter(x => x.status !== 'weg');
  const voorstel = (o && o.dagen && o.dagen[0] && !s.weg['voorstel|' + o.dagen[0].dag] && o.dagen[0].voorstel) || [], vDag = (o && o.dagen && o.dagen[0] && o.dagen[0].dag) || vandaag;
  const jijRijen = T.filter(x => x.status === 'jij').map(x => taak('jij', kop(x.vraag), pn(x.project) + ' · takenlijst · ' + esc(wanneer(x.vraagT || x.t)), '<p>Hoort bij je taak: ' + esc(knip(x.tekst, 300)) + '</p>' + (x.toon ? '<p><a href="' + esc(x.toon) + '">Bekijk het eerst</a></p>' : '') + bijDoel(x.project) + antw({ id: x.id }, x.vraag, x.keuzes)))
    .concat((d.wacht || []).map(w => taak('jij', kop(w.tekst), esc(naam[w.id] || w.id) + ' · ' + esc(w.chat) + ' · ' + esc(wanneer(w.t)), (kop(w.tekst).endsWith('…') ? '<p>' + esc(w.tekst) + '</p>' : '') + (w.toon ? '<p><a href="' + esc(w.toon) + '">Bekijk het eerst</a></p>' : '') + bijDoel(w.id) + antw({ project: w.id, chat: w.chat, vraag: w.tekst }, w.tekst))));
  if (voorstel.length) jijRijen.push(taak('jij', voorstel.length + ' voorstellen voor dure zoekwoorden die wel verkopen', 'KDP-boeken · zoekwoordencheck · ' + esc(dag(vDag)), lijst(voorstel.map(v => r('', esc(knip(v, 220)))))
    + '<div class="antw"><a class="kn" href="' + esc(doe({ taak: { tekst: 'Henkjan zei ja op de ' + voorstel.length + ' voorstellen van de zoekwoordencheck van ' + vDag + ' (dure zoekwoorden die wel verkopen). Voer ze door volgens OVERDRACHT-KDP sectie 2a en meld per zoekwoord wat je deed. Voorstellen: ' + knip(voorstel.join(' | '), 420), project: 'kdp' }, weg: ['voorstel|' + vDag] })) + '">Ja</a><a class="kn" href="' + esc(doe({ weg: ['voorstel|' + vDag] })) + '">Nee</a></div>'));
  const jijHtml = jijRijen.map((h, i) => (i < 2 ? h.replace('<details class="t"', '<details class="t" open') : h));
  const start = x => (x.account === 'chatgpt' || ai === 'chatgpt' ? '<a href="https://chatgpt.com/?q=' + esc(encodeURIComponent(knip(x.tekst, 1500))) + '">Open in ChatGPT</a>'
    : '<a href="' + (ai === 'desktop' ? 'claude://claude.ai' : 'https://claude.ai') + '/new?q=' + esc(encodeURIComponent(oppakPrompt('claude-1', x.id))) + '">Start nu in ' + knop + '</a>');
  const stil = x => nuMs - Date.parse(x.antwoordT || x.t) > STIL_DAGEN * 864e5;
  const bezigT = T.filter(x => x.status === 'bezig'), wachtT = T.filter(x => x.status === 'wacht'), klaarT = T.filter(x => x.status === 'klaar').reverse();
  const bezigC = []; for (const p of P) for (const c of p.chats || []) if (!c.klaar && nuMs - Date.parse(c.t) < 6 * 36e5 && !s.weg['chat|' + p.id + '|' + c.naam + '|' + c.t]) bezigC.push({ id: p.id, c });
  const klaarO = []; for (const p of P) for (const it of ((p.output && p.output.items) || [])) if (it.dag === vandaag && !it.auto && !s.weg['out|' + it.id] && !klaarT.some(x => x.output === it.id)) klaarO.push({ id: p.id, it });
  klaarO.sort((a, b) => String(b.it.t || '').localeCompare(String(a.it.t || '')));
  const bezigHtml = bezigT.map(x => taak('bezig', knip(x.tekst, 62), pn(x.project) + ' · ' + esc(ACCOUNTS[x.door] || x.door) + (x.zwaarte ? ' · ' + ZW[x.zwaarte] : '') + ' · sinds ' + esc(wanneer(x.pakT)) + (nuMs - Date.parse(x.hart || x.pakT) > STIL_MIN * 6e4 ? ' · geen teken van leven, een ander account neemt het over' : ''), '<p>' + esc(x.tekst) + '</p>' + (x.antwoord ? '<p>Je antwoord: ' + esc(x.antwoord) + '</p>' : '') + '<p>' + weg(x.id) + '</p>'))
    .concat(bezigC.map(b => taak('bezig', knip(b.c.waar, 62), esc(naam[b.id] || b.id) + ' · chat ' + esc(b.c.naam) + ' · sinds ' + esc(wanneer(b.c.t)), '<p>' + esc(b.c.waar) + '</p>' + (b.c.volgende ? '<p>Daarna: ' + esc(b.c.volgende) + '</p>' : '') + '<p>' + (b.c.link ? '<a href="' + esc(b.c.link) + '">Open de chat</a> · ' : '') + weg('chat|' + b.id + '|' + b.c.naam + '|' + b.c.t) + '</p>')));
  const wachtHtml = wachtT.map(x => taak('wacht', knip(x.tekst, 62), pn(x.project) + ' · ' + esc(ACCOUNTS[x.account] || 'account dat het eerst kijkt') + (x.account === 'chatgpt' ? '' : ' · ' + (ZW[x.zwaarte] || 'model dat bij de taak past')) + (stil(x) ? ' · ligt ' + STIL_DAGEN + ' dagen stil: mag het weg?' : ''),
    '<p>' + esc(x.tekst) + '</p>' + (x.antwoord ? '<p>Je antwoord: ' + esc(x.antwoord) + '</p>' : '') + (x.reden ? '<p>Teruggelegd: ' + esc(x.reden) + '</p>' : '') + '<p>' + start(x) + ' · ' + weg(x.id) + '</p>'));
  const klaarHtml = klaarT.map(x => taak('klaar', knip(x.tekst, 62), pn(x.project) + (x.door ? ' · ' + esc(ACCOUNTS[x.door] || x.door) : '') + (x.bron === 'gewoonte' ? ' · uit zichzelf gedaan' : '') + ' · ' + esc(wanneer(x.klaarT)), '<p>' + esc(x.resultaat) + '</p><p>' + (x.link ? '<a href="' + esc(x.link) + '">Bekijk</a> · ' : '') + weg(x.id) + '</p>'))
    .concat(klaarO.map(k => taak('klaar', knip(k.it.wat, 62), esc(naam[k.id] || k.id) + (k.it.wie ? ' · ' + esc(k.it.wie) : '') + ' · ' + esc(wanneer(k.it.t || nuMs)), '<p>' + esc(k.it.wat) + '</p>' + (k.it.intentie ? '<p>Moet opleveren: ' + esc(knip(k.it.intentie, 220)) + '</p>' : '') + '<p>' + (k.it.link ? '<a href="' + esc(k.it.link) + '">Bekijk</a> · ' : '') + weg('out|' + k.it.id) + '</p>')));
  const klaarKeys = klaarT.map(x => x.id).concat(klaarO.map(k => 'out|' + k.it.id)), stilKeys = wachtT.filter(stil).map(x => x.id);
  const openTel = jijHtml.length + bezigHtml.length + wachtHtml.length;
  // planregels die om zijn ja vragen blijven apart: dat zijn er veel en ze staan al in de planning
  const JIJ = /^henkjan\b|henkjans (ja|go|besluit)|\(henkjan\)|henkjan voegt/i, plan = [];
  for (const p of P) for (const x of p.open || []) if (JIJ.test(String(x.t).slice(0, 140))) plan.push({ d: x.d || '', id: p.id, t: x.t });
  for (const p of P) if (p.advies && !p.doel) plan.push({ d: '', id: p.id, t: 'Doelvoorstel, ja of nee: ' + p.advies });
  plan.sort((a, b) => String(a.d || '9').localeCompare(String(b.d || '9'))); const planLaat = plan.filter(x => x.d && x.d < vandaag).length;
  const meld = opt.melding ? '<p class="meld" role="status"><b>' + esc(opt.melding.tekst) + '</b>' + (opt.melding.terug && opt.melding.terug.length ? ' <a href="' + esc(doe({ terug: opt.melding.terug })) + '">Ongedaan maken</a>' : '') + (opt.melding.link ? ' <a href="' + esc(opt.melding.link) + '">' + esc(opt.melding.linkTekst || 'Terug') + '</a>' : '') + '</p>' : '';

  // 2. Geleerd van jou: wat hij vaker vraagt en zijn beslissingen met uitkomst
  const gew = s.gewoon.filter(g => g.status === 'proactief' || (g.status === 'telt' && g.recent >= 2)).map(g => (g.status === 'proactief'
    ? r('Zelf', '<b>' + esc(g.wat) + '</b><br>Je vroeg dit ' + g.recent + ' keer. Het dashboard doet het nu ' + ((g.ritme || 1) === 1 ? 'elke dag' : 'elke ' + g.ritme + ' dagen') + ' zelf en meldt het in je lijst.' + (g.laatst ? ' Laatst ' + esc(wanneer(g.laatst)) + '.' : '') + ' <a href="' + esc(doe({ gewoonte: { id: g.id, uit: true } })) + '">Niet meer doen</a>')
    : r(g.recent + ' van ' + DREMPEL, '<b>' + esc(g.wat) + '</b><br>Nog één keer vragen en het dashboard doet het daarna zelf. <a href="' + esc(doe({ gewoonte: { id: g.id, aan: true } })) + '">Nu al zelf doen</a> · <a href="' + esc(doe({ gewoonte: { id: g.id, uit: true } })) + '">Niet leren</a>')));
  const bs = besluitStand(s, d), les = lessen(s, d);
  const besRij = b => r(UITSLAG[b.uitslag] || 'Loopt', '<b>' + esc(knip(b.tekst, 110)) + '</b>' + (b.over ? '<br>Op: ' + esc(knip(b.over, 140)) : '') + (b.project ? '<br>' + link(b.project) + ' · ' + esc(wanneer(b.t)) : '<br>' + esc(wanneer(b.t)))
    + (b.wachtUur != null && b.wachtUur >= 1 ? ' · wachtte ' + esc(num(b.wachtUur)) + ' uur op je' : '') + (b.resultaat ? '<br>Uitkomst: ' + esc(knip(b.resultaat, 180)) : '') + (b.intentie ? '<br>Moet opleveren: ' + esc(knip(b.intentie, 180)) + (b.oordeel ? ' Oordeel ' + esc(dag(b.oordeel)) + '.' : '') : '') + (b.waarom && (b.uitslag === 'raak' || b.uitslag === 'mis') ? '<br>' + esc(b.waarom) : ''), b.uitslag === 'mis');

  // 3. Bewaking: wat niet goed gaat eerst, daarna wat goed staat
  const ingrijp = x => (x && x.verder ? ' <a href="' + esc(x.verder) + '">Laat Claude ingrijpen</a>' : '');
  const opv = d.opvallend || [], duur = opv.find(x => x.id === 'kosten'), verlies = opv.filter(x => /kosten in 7 dagen/.test(x.tekst));
  const laat = P.filter(p => p.telaat > 0), laatTel = laat.reduce((n, p) => n + p.telaat, 0), achter = d.achter || [], mis = [], goed = [];
  if (duur) mis.push(r('Te duur', '<b>Vercel</b><br>' + esc(duur.tekst.replace(/^Kosten: /, '')) + ingrijp(duur), 1));
  for (const x of verlies) mis.push(r('Verlies', link(x.id) + '<br>' + esc(x.tekst) + ingrijp(x), 1));
  for (const x of opv) if (x.id !== 'kosten' && !verlies.includes(x) && !/^(Waar je was)$/.test(x.naam || '') && x.zwaar >= 6) mis.push(r('Let op', (x.id && naam[x.id] ? link(x.id) : '<b>' + esc(x.naam || '') + '</b>') + '<br>' + esc(knip(x.tekst, 260)) + ingrijp(x), 1));
  if (achter.length) mis.push(r('Stil', '<b>Waar je was ontbreekt bij ' + achter.length + (achter.length === 1 ? ' project' : ' projecten') + '</b><br>Daar is gewerkt zonder dat er staat waar je was gebleven. Het vangnet schrijft het twee keer per dag bij.', 1));
  if (laat.length) mis.push(r('Te laat', '<b>' + laatTel + (laatTel === 1 ? ' planregel' : ' planregels') + '</b><br>' + laat.map(p => link(p.id) + ' ' + p.telaat).join(' · '), 1));
  const wachtOud = wachtT.length && Math.min(...wachtT.map(x => Date.parse(x.t))) < nuMs - 2 * 36e5;
  // oppakker en vangnet per account dat ze heeft aangezet: stil = te lang niet gelopen (ook als ze nog nooit liepen)
  let oppakAan = false;
  for (const acc of ['claude-1', 'claude-2']) { const aan = s.accounts['aan|' + acc]; if (!aan) continue; const a = s.accounts[acc], v = s.accounts['vangnet|' + acc];
    if (aan.oppak) { oppakAan = true; const st = nuMs - Date.parse((a && a.t) || aan.t) > 3 * 36e5;
      (st ? mis : goed).push(r(st ? 'Stil' : (a ? 'Goed' : 'Aan'), '<b>Oppakker ' + ACCOUNTS[acc] + '</b><br>' + (a ? 'Keek ' + esc(wanneer(a.t)) + ' voor het laatst in je lijst' + (a.gepakt ? ' en pakte ' + a.gepakt + (a.gepakt === 1 ? ' taak' : ' taken') : '') + '.' : 'Staat aan sinds ' + esc(wanneer(aan.t)) + ' en heeft nog niet gekeken.') + (st ? ' Hoort elk uur te kijken.' : ''), st)); }
    if (aan.vangnet) { const st = !!(v && v.fout) || nuMs - Date.parse((v && v.t) || aan.t) > 14 * 36e5;
      (st ? mis : goed).push(r(st ? 'Stil' : (v ? 'Goed' : 'Aan'), '<b>Vangnet ' + ACCOUNTS[acc] + '</b><br>' + (v ? (v.fout ? esc(v.fout) + ' (' + esc(wanneer(v.t)) + ')' : 'Liep ' + esc(wanneer(v.t)) + ' je chats na' + (v.standen ? ' en schreef bij ' + v.standen + (v.standen === 1 ? ' chat' : ' chats') + ' bij waar je was' : '') + '.') : 'Staat aan sinds ' + esc(wanneer(aan.t)) + ', loopt twee keer per dag je chats na.') + (st && !(v && v.fout) ? ' Hoort twee keer per dag te lopen.' : ''), st)); } }
  if (!oppakAan && wachtOud) mis.push(r('Stil', '<b>Geen oppakker aan</b><br>Er wacht al meer dan twee uur een taak en geen account pakt op.', 1));
  if (o) goed.push(r(o.status === 'ok' ? 'Goed' : 'Te laat', '<b>Zoekwoorden Amazon Ads</b><br>' + esc(o.zin) + (o.week ? ' Deze week ' + o.week.uit + ' bleeders uit, ongeveer ' + geld(o.week.geremd) + ' per dag minder verspild.' : '')
    + (o.dagen && o.dagen[0] && (o.dagen[0].bleeders || []).length ? '<details class="sub"><summary>Wat er uit ging</summary>' + lijst(o.dagen[0].bleeders.map(b => r(esc(b.markt), esc(b.woord) + ' · ' + esc(b.campagne) + '<br>' + b.kliks + ' kliks, ' + geld(b.kosten) + ', ' + b.aankopen + ' aankopen'))) + '</details>' : ''), o.status !== 'ok'));
  if (camp && camp.budget) goed.push(r(camp.budget.stand === 'ok' ? 'Goed' : 'Let op', '<b>Campagnebudget</b><br>Vandaag ' + geld(camp.budget.saldo) + ' van ' + geld(camp.budget.grens) + ' per saldo. ' + (camp.netten || []).length + ' netwerken melden.', camp.budget.stand !== 'ok'));

  // 4. Geld en campagnes
  const pm = (d.geld && d.geld.perMunt) || [], usd = pm.find(m => m.munt === 'USD'), eur = pm.find(m => m.munt === 'EUR'), teken = m => (m === 'EUR' ? '€' : '$');
  const geldRij = m => r(esc(m.munt), '<b>saldo ' + geld(m.totaal.saldo, teken(m.munt)) + '</b><br>kosten ' + geld(m.totaal.kosten, teken(m.munt)) + ' · omzet ' + geld(m.totaal.opbrengst, teken(m.munt)) + (m.totaal.waarde ? ' · geschatte waarde ' + geld(m.totaal.waarde, teken(m.munt)) : ''), m.totaal.saldo < 0);
  const campProj = camp && camp.projecten ? Object.entries(camp.projecten).filter(([, v]) => v.campagnes.length).sort((a, b) => b[1].kosten - a[1].kosten) : [], campTel = campProj.reduce((n, [, v]) => n + v.campagnes.length, 0), aank = camp && camp.aankomst && camp.aankomst[0];
  const campBlok = camp && camp.budget ? '<div class="blok"><h3>Campagnes vandaag, stand ' + esc(wanneer(camp.ontvangen)) + '</h3>' + lijst([r('Budget', geld(camp.budget.saldo) + ' van ' + geld(camp.budget.grens) + ' per saldo · gegarandeerde omzet ' + geld(camp.budget.omzet)), r('Netwerk', (camp.netten || []).map(n => esc(n.net) + ' ' + geld(n.kosten)).join(' · '))]
    .concat(aank ? [r('Kliks', aank.aangekomen + ' van ' + aank.kliks + ' aangekomen bij Clickmind (' + num(aank.pct) + '%)')] : [], campProj.map(([id, v]) => r(geld(v.kosten), link(id) + ' · ' + v.campagnes.length + (v.campagnes.length === 1 ? ' campagne' : ' campagnes'))), o ? [r('Amazon', link('kdp') + ' · ' + esc(o.zin))] : [])) + '</div>' : '';

  // 5. Projecten
  const metDoel = P.filter(p => p.pct != null), zonder = P.filter(p => p.pct == null);
  const onder = p => [p.pct != null ? num(p.nu) + ' van ' + num(p.doelgetal) + ' ' + p.eenheid : (p.doel ? 'Doel gezet, meting volgt' : (p.advies ? 'Doelvoorstel wacht op je ja' : 'Doel nog zetten')), (p.open || []).length ? p.open.length + ' open' + (p.telaat ? ', ' + p.telaat + ' te laat' : '') : '', p.laatste ? 'laatste werk ' + dag(p.laatste) : ''].filter(Boolean).join(' · ');
  const geldVan = id => pm.map(m => ({ t: teken(m.munt), p: m.projecten.find(x => x.id === id) })).filter(x => x.p);
  const kaart = p => { const cr = camp ? campRegels(camp, p.id, naam, p.id === 'kdp' && o ? 'Amazon Ads: ' + o.zin : '') : ((p.campagnes && p.campagnes.regels) || []);
    return '<details id="' + esc(p.id) + '"><summary><b>' + esc(p.naam) + '</b><i>' + (p.pct != null ? p.pct + '%' : '') + '</i><span>' + esc(onder(p)) + '</span>' + (p.pct != null ? '<div class="balk" role="img" aria-label="' + p.pct + ' procent"><i style="width:' + Math.max(0, Math.min(100, p.pct)) + '%"></i></div>' : '') + '</summary><div class="in">'
      + (p.wat ? '<p>' + esc(p.wat) + '</p>' : '')
      + '<a class="btn" href="' + esc(ai === 'browser' && p.verder ? p.verder : aiUrl(p, ai)) + '">Verder in ' + knop + '</a>'
      + blok('Waar je was gebleven', lijst((p.chats || []).map(c => r(esc(wanneer(c.t)), (c.link ? '<a href="' + esc(c.link) + '">' + esc(c.naam) + '</a>' : '<b>' + esc(c.naam) + '</b>') + (c.klaar ? ' (afgerond)' : '') + '<br>' + esc(c.waar) + (c.wacht.length ? '<br><b>Wacht op jou:</b> ' + c.wacht.map(esc).join(' · ') + (c.toon ? ' <a href="' + esc(c.toon) + '">Bekijk</a>' : '') : '') + (c.volgende ? '<br>Daarna: ' + esc(c.volgende) : '')))))
      + blok('Doel', '<p>' + esc(p.doel || (p.advies ? 'Voorstel: ' + p.advies : 'Nog geen doel. Zeg het in een chat of zet het als taak, dan staat het hier.')) + '</p>')
      + blok('Planning', lijst((p.open || []).slice(0, 4).map(x => r(x.d ? esc(dag(x.d)) : 'Open', esc(knip(x.t, 170)), x.d && x.d < vandaag))))
      + blok('Campagnes nu', lijst(cr.map(x => r('', esc(x)))))
      + blok('Geld, 7 dagen', lijst(geldVan(p.id).map(g => r('', 'kosten ' + geld(g.p.kosten, g.t) + ' · omzet ' + geld(g.p.opbrengst, g.t) + (g.p.waarde ? ' · geschatte waarde ' + geld(g.p.waarde, g.t) : '')))))
      + blok('Laatste werk', lijst((p.log || []).slice(0, 3).map(x => r(esc(dag(x.t)), esc(knip(x.tekst, 200))))))
      + '<p><a href="/dashboard?archiveer=' + esc(p.id) + '">Archiveer</a></p></div></details>'; };

  const samen = lijst([
    jijHtml.length || plan.length ? r('Jij', (jijHtml.length ? '<a href="#taken">' + jijHtml.length + (jijHtml.length === 1 ? ' ding wacht' : ' dingen wachten') + ' op jou</a>' : 'Niets wacht op jou in de lijst') + (plan.length ? '<br>en ' + plan.length + ' regels in de planning vragen om je ja' : ''), jijHtml.length > 0) : '',
    r('Taken', '<a href="#taken">' + [bezigHtml.length ? bezigHtml.length + ' bezig' : '', wachtHtml.length ? wachtHtml.length + (wachtHtml.length === 1 ? ' wacht' : ' wachten') : '', klaarHtml.length ? klaarHtml.length + ' klaar vandaag' : ''].filter(Boolean).join(', ') + '</a>' + (bezigHtml.length + wachtHtml.length + klaarHtml.length ? '<br>' : '') + 'Typ hierboven wat er moet gebeuren; een agent pakt het op'),
    mis.length ? r('Let op', '<a href="#bewaking">' + mis.length + (mis.length === 1 ? ' punt gaat' : ' punten gaan') + ' niet goed</a><br>' + [duur ? 'Vercel te duur' : '', achter.length ? 'bij ' + achter.length + ' projecten ontbreekt waar je was' : '', verlies.length ? verlies.length + (verlies.length === 1 ? ' project kost' : ' projecten kosten') + ' geld zonder opbrengst' : '', laatTel ? laatTel + ' planregels te laat' : ''].filter(Boolean).join(' · '), 1) : '',
    usd ? r('Geld', '<a href="#geld">7 dagen: saldo ' + geld(usd.totaal.saldo) + (eur ? ' en ' + geld(eur.totaal.saldo, '€') : '') + '</a>' + (camp && camp.budget ? '<br>Campagnes vandaag ' + geld(camp.budget.kosten) + ' in ' + campTel + ' campagnes' : ''), usd.totaal.saldo < 0) : '',
    r('Project', '<a href="#projecten">' + P.length + ' projecten, ' + metDoel.length + ' met een meetbaar doel</a>' + (metDoel.length ? '<br>' + metDoel.slice().sort((a, b) => b.pct - a.pct).slice(0, 3).map(p => esc(p.naam) + ' ' + p.pct + '%').join(' · ') : '')),
  ].filter(Boolean));
  const tweede = 'https://claude.ai/new?q=' + encodeURIComponent('Zet voor dit Claude-account (claude-2) de twee geplande taken van Henkjans dashboard aan: de oppakker en het vangnet. Lees ' + HOST + '/api/mm/dashboard?vorm=aanzetten&account=claude-2 met de Vercel-tool web_fetch_vercel_url en volg het.');

  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex"><title>Overzicht alle projecten</title><link rel="alternate" type="text/plain" href="/api/mm/dashboard?vorm=tekst" title="Voor een chat"><!--\n' + startTekst(d).replace(/--/g, '- -') + '\n-->'
    + '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap">'
    + '<style>' + CSS + '</style></head><body><div class="w">'
    + '<header><a class="merk" href="/dashboard">Overzicht</a><span class="meta">' + esc(dag(vandaag)) + ' · ' + esc(wanneer(nuMs)) + '</span></header>'
    + '<section><h1>Overzicht</h1>'
    + '<form class="tool invoer" method="get" action="/dashboard"><label for="tq"><b>Wat moet er gebeuren?</b></label><textarea id="tq" name="taak" rows="3" maxlength="800" required placeholder="Bijvoorbeeld: maak drie nieuwe advertenties voor Kadoly en laat ze me eerst zien"></textarea>'
    + '<div class="rij2"><select name="p" aria-label="Project"><option value="">Project: de agent kiest</option>' + P.map(x => '<option value="' + esc(x.id) + '">' + esc(x.naam) + '</option>').join('') + '</select><button class="btn" type="submit">Zet in de lijst</button></div>'
    + '<p>Account en model kiest het dashboard zelf: het account dat het eerst kijkt en het lichtste model dat de taak aankan. <a href="#" data-zelf="1">Zelf kiezen</a></p>'
    + '<div class="rij2" id="zelf" hidden><select name="acc" aria-label="Account"><option value="">Account: wie het eerst kijkt</option>' + Object.entries(ACCOUNTS).map(([k, v]) => '<option value="' + k + '">' + esc(v) + '</option>').join('') + '</select><select name="zw" aria-label="Model"><option value="">Model: past bij de taak</option>' + Object.entries(ZWAARTE).map(([k, v]) => '<option value="' + k + '">' + esc(v) + '</option>').join('') + '</select></div></form>'
    + '<div class="tool">' + samen + '</div></section>'
    + '<section id="taken"><h2>Taken</h2>' + meld + '<p>Dit is je lijst: wat op jou wacht, waar een agent of chat mee bezig is, wat klaarstaat en wat af is. Geld uitgeven, een campagne stoppen, mail versturen of iets live zetten gebeurt nooit zonder jouw ja.</p>'
    + '<p class="filter"><a href="#" data-f="open" class="nu">Open' + (openTel ? ' ' + openTel : '') + '</a>' + (jijHtml.length ? ' · <a href="#" data-f="jij">Jij ' + jijHtml.length + '</a>' : '') + (klaarHtml.length ? ' · <a href="#" data-f="klaar">Klaar ' + klaarHtml.length + '</a>' : '') + ' · <a href="#" data-f="alles">Alles</a></p>'
    + '<div class="lijst" id="rij">' + jijHtml.join('') + bezigHtml.join('') + wachtHtml.join('') + klaarHtml.join('') + '</div>'
    + (klaarKeys.length || stilKeys.length ? '<p>Opruimen: ' + [klaarKeys.length ? '<a href="' + esc(doe({ weg: klaarKeys })) + '">alles wat klaar is</a>' : '', stilKeys.length ? '<a href="' + esc(doe({ weg: stilKeys })) + '">wat ' + STIL_DAGEN + ' dagen stil ligt</a>' : ''].filter(Boolean).join(' · ') + '</p>' : '')
    + '<p>Klaar verdwijnt vanzelf na een dag. Wat ' + STIL_DAGEN + ' dagen stil ligt, vraagt of het weg mag.</p>'
    + (plan.length ? '<details><summary><b>Uit de planning</b><i>' + plan.length + '</i><span>Planregels die om je ja of actie vragen' + (planLaat ? ', ' + planLaat + ' te laat' : '') + '</span></summary><div class="in">' + lijst(plan.map(x => r(x.d ? esc(dag(x.d)) : 'Open', link(x.id) + '<br>' + esc(knip(x.t.replace(/^henkjan:\s*/i, ''), 130)), x.d && x.d < vandaag))) + '</div></details>' : '') + '</section>'
    + '<section id="geleerd"><h2>Geleerd van jou</h2>'
    + '<div class="blok"><h3>Wat je vaker vraagt</h3><p>Vraag je iets ' + DREMPEL + ' keer binnen ' + VENSTER + ' dagen, in een chat of hier, dan doet het dashboard het daarna zelf en meldt het in je lijst. Eén tik zet het weer uit.</p>' + lijst(gew) + '</div>'
    + '<div class="blok"><h3>Jouw beslissingen</h3><p>Elke taak en elk antwoord van jou staat hier met wat eruit kwam. Hoort er een meting bij, dan staat op de oordeeldatum raak of mis.</p>' + (les.length ? lijst(les.map(x => r('Les', esc(x)))) : '') + lijst(bs.slice(0, 8).map(besRij)) + '</div></section>'
    + '<section id="bewaking"><h2>Bewaking</h2>' + lijst(mis.concat(goed)) + '</section>'
    + '<section id="geld"><h2>Geld en campagnes</h2>' + (pm.length ? '<div class="blok"><h3>Laatste 7 dagen</h3>' + lijst(pm.map(geldRij)) + '</div>' : '') + campBlok + '</section>'
    + '<section id="projecten"><h2>Projecten</h2>' + (metDoel.length ? '<div class="blok"><h3>Met doel en meting, ' + metDoel.length + '</h3><div class="lijst">' + metDoel.map(kaart).join('') + '</div></div>' : '')
    + (zonder.length ? '<div class="blok"><h3>Nog zonder doel of meting, ' + zonder.length + '</h3><div class="lijst">' + zonder.map(kaart).join('') + '</div></div>' : '') + '</section>'
    + '<section id="meer"><h2>Meer</h2><div class="lijst">'
    + ((d.agenda || []).length ? '<details><summary><b>Planning</b><i>' + d.agenda.length + '</i><span>Alle planregels op datum</span></summary><div class="in">' + lijst(d.agenda.slice(0, 12).map(a => r(esc(dag(a.d)), link(a.id) + '<br>' + esc(knip(a.t, 160)), a.telaat))) + '</div></details>' : '')
    + (d.output && d.output.tot && d.output.tot.gemaakt ? '<details><summary><b>Gemaakt en geraakt</b><i>' + d.output.tot.gemaakt + '</i><span>Wat we maakten en of het getal bewoog</span></summary><div class="in">' + lijst([r('Samen', d.output.tot.gemaakt + ' gemaakt' + (d.output.tot.raak ? ', ' + d.output.tot.raak + ' raak' : '') + (d.output.tot.mis ? ', ' + d.output.tot.mis + ' mis' : '') + (d.output.tot.open ? ', ' + d.output.tot.open + ' open' : ''))].concat(d.output.tot.zonder ? [r('Let op', d.output.tot.zonder + ' keer iets gemaakt zonder te zeggen welk getal moest bewegen', 1)] : [], d.output.projecten.filter(x => x.tel.gemaakt).map(x => r(String(x.tel.gemaakt), link(x.id) + (x.tel.raak ? ' · ' + x.tel.raak + ' raak' : '') + (x.tel.mis ? ' · ' + x.tel.mis + ' mis' : '') + (x.tel.open ? ' · ' + x.tel.open + ' open' : ''))))) + '<p><a href="/api/mm/dashboard?vorm=output&amp;dagen=30">Alles van 30 dagen</a></p></div></details>' : '')
    + '<details><summary><b>Instellingen</b><i></i><span>Waar Verder opent, tweede account, leerprompt, skills, archief</span></summary><div class="in">' + lijst([
      r('Opent in', Object.keys(AI).map(k => (k === ai ? '<b>' + esc(AI[k]) + '</b>' : '<a href="/dashboard?ai=' + k + '">' + esc(AI[k]) + '</a>')).join(' · ')),
      r('Account', 'Je tweede Claude-account pakt ook taken op als je daar de oppakker aanzet. <a href="' + esc(tweede) + '">Open dit in je tweede account</a>'),
      r('Oud', '<a href="/api/mm/dashboard?vorm=oud">Het vorige dashboard</a>: leerprompt wijzigen, skills, archief' + ((d.archief || []).length ? ' (' + d.archief.length + ')' : '') + ' · <a href="/oversight">Oversight</a>')]) + '</div></details>'
    + '</div></section>'
    + '<footer><p>Stand van ' + esc(dag(vandaag)) + ' ' + esc(wanneer(nuMs)) + ' (Curaçao). Voor een chat: <a href="/api/mm/dashboard?vorm=start">startopdracht</a>.</p></footer></div>'
    + '<script>' + SCRIPT + '</script></body></html>';
}
