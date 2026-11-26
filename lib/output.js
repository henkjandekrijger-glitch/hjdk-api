// Output en outcome (Henkjan 26 nov 2026: "Zorg dat dashboard productie bijhoudt op mijn projecten maar een strikte scheiding maakt tussen
// output en outcome . Dus ik kan zien wat over bepaalde periode is gemaakt met intentie outcome te realiseren . Op dashboard zie ik waar ik
// goed of fout zat of kan dat bevragen via dashboard .").
//
// OUTPUT = wat we maakten (een pagina, campagne, boek, mailstroom, functie, ingreep). Elk stuk output heeft een intentie: welk getal van
// het project het moet bewegen, welke kant op, hoeveel, en wanneer we oordelen. Output telt nooit mee als resultaat.
// OUTCOME = het getal zelf: de meting van het project (nu) of het kasboek (opbrengst, kosten per dag). Dat staat los op het dashboard.
// OORDEEL = op de oordeeldatum vergelijkt dit bestand het getal vóór de output met het getal op de oordeeldatum: raak, mis, of geen meting.
// Een ronde of chat mag zelf oordelen (uitkomst), dat gaat voor het automatische oordeel.
//
// Opslag: kv mm:dash:out:<project> (lijst, nieuwste eerst, max 300), mm:dash:nuhist (hash <project>|<dag> = nu van die dag).
// Ook zonder melding telt productie mee: elke uitrol (werklog wie=deploy) die bij een project hoort staat als output "zonder intentie".

const OUT = 'mm:dash:out:'; const HIST = 'mm:dash:nuhist';
const kort = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
const dagUtc = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const plus = (dag, n) => dagUtc(Date.parse(dag + 'T12:00:00Z') + n * 864e5);
const rond = n => Math.round(n * 100) / 100;
export const METRIEKEN = ['nu', 'opbrengst', 'kosten', 'waarde'];

// Meld een stuk output met intentie. o = {wat, intentie, metriek ('nu'|'opbrengst'|'kosten'|'waarde'), richting ('omhoog'|'omlaag'),
// drempel (getal in de eenheid van de metriek, standaard 0), verwacht (tekst), oordeel (JJJJ-MM-DD, standaard over 7 dagen), dag, link}
export async function zetOutput(kv, project, o, wie = '') {
  if (!o || typeof o !== 'object' || !kort(o.wat, 300)) return { ok: false, fout: 'output: {"wat":"...","intentie":"welk getal en waarom","metriek":"nu|opbrengst|kosten|waarde","richting":"omhoog|omlaag","drempel":<getal>,"verwacht":"...","oordeel":"JJJJ-MM-DD","link":"https://..."}' };
  if (kort(o.intentie, 400).length < 10) return { ok: false, fout: 'output: geef de intentie (welk getal moet bewegen en waarom), minstens 10 tekens' };
  const metriek = METRIEKEN.includes(o.metriek) ? o.metriek : 'nu';
  const dag = /^\d{4}-\d{2}-\d{2}$/.test(String(o.dag || '')) ? o.dag : dagUtc();
  const oordeel = /^\d{4}-\d{2}-\d{2}$/.test(String(o.oordeel || '')) ? o.oordeel : plus(dag, 7);
  if (oordeel < dag) return { ok: false, fout: 'oordeel ligt voor de dag van de output' };
  const item = { id: Math.random().toString(36).slice(2, 8), dag, wat: kort(o.wat, 300), intentie: kort(o.intentie, 400), metriek,
    richting: o.richting === 'omlaag' ? 'omlaag' : 'omhoog', drempel: Number.isFinite(Number(o.drempel)) ? Number(o.drempel) : 0, verwacht: kort(o.verwacht, 200),
    oordeel, link: /^https:\/\//.test(String(o.link || '')) ? kort(o.link, 300) : '', wie: kort(o.wie || wie, 60), t: new Date().toISOString(), uitkomst: null };
  const l = (await kv.get(OUT + project).catch(() => null)) || [];
  l.unshift(item); await kv.set(OUT + project, l.slice(0, 300));
  return { ok: true, project, output: item.id, oordeel };
}

// Oordeel door een ronde of chat: {id, uitslag:'raak'|'mis'|'onduidelijk', waarom, voor, na}
export async function zetOordeel(kv, project, u, wie = '') {
  if (!u || !u.id || !['raak', 'mis', 'onduidelijk'].includes(u.uitslag)) return { ok: false, fout: 'oordeel: {"id":"<output-id>","uitslag":"raak|mis|onduidelijk","waarom":"..."}' };
  if (kort(u.waarom, 400).length < 10) return { ok: false, fout: 'oordeel: geef in waarom het getal en de reden' };
  const l = (await kv.get(OUT + project).catch(() => null)) || []; const it = l.find(x => x.id === u.id);
  if (!it) return { ok: false, fout: 'geen output met id ' + kort(u.id, 20) + ' in ' + project };
  it.uitkomst = { uitslag: u.uitslag, waarom: kort(u.waarom, 400), voor: u.voor == null ? null : Number(u.voor), na: u.na == null ? null : Number(u.na), door: kort(wie || 'chat', 60), t: new Date().toISOString() };
  await kv.set(OUT + project, l); return { ok: true, project, output: it.id, uitslag: u.uitslag };
}

export async function zetNuHist(kv, project, nu, dag = dagUtc()) { if (Number.isFinite(Number(nu))) await kv.raw(['HSET', HIST, project + '|' + dag, String(nu)]).catch(() => null); }
async function leesHist(kv) { let h = []; try { h = (await kv.raw(['HGETALL', HIST])) || []; } catch (e) {} if (h && !Array.isArray(h)) h = Object.entries(h).flat(); const r = {}; for (let i = 0; i + 1 < h.length; i += 2) { const [p, d] = String(h[i]).split('|'); (r[p] || (r[p] = {}))[d] = Number(h[i + 1]); } return r; }

// gemiddelde per dag van een kasboekmetriek over n dagen tot en met tot (alleen dagen met een boeking; null als er geen is)
function gem(reeks, metriek, tot, n) { const w = []; for (let i = 0; i < n; i++) { const d = reeks[plus(tot, -i)]; if (d && (d.opbrengst || d.kosten || d.waarde)) w.push(d[metriek] || 0); } return w.length ? { v: rond(w.reduce((a, b) => a + b, 0) / w.length), n: w.length } : null; }
// laatste nu-waarde op of voor dag (binnen 10 dagen)
function nuOp(hist, dag) { for (let i = 0; i <= 10; i++) { const d = plus(dag, -i); if (hist && hist[d] != null) return { v: hist[d], dag: d }; } return null; }

// Automatisch oordeel voor één stuk output (alleen als de oordeeldatum voorbij is en niemand zelf oordeelde)
export function oordeelVan(it, reeks, hist, vandaag = dagUtc()) {
  if (it.uitkomst) return it.uitkomst;
  if (!it.intentie) return { uitslag: 'geen intentie', waarom: 'zonder intentie gemaakt: er is niets om tegen te meten' };
  if (it.oordeel > vandaag) return { uitslag: 'open', waarom: 'oordeel op ' + it.oordeel };
  let voor, na;
  if (it.metriek === 'nu') { const a = nuOp(hist, plus(it.dag, -1)), b = nuOp(hist, it.oordeel); voor = a && a.v; na = b && b.dag > it.dag ? b.v : null; }
  else { const a = gem(reeks || {}, it.metriek, plus(it.dag, -1), 7), b = gem(reeks || {}, it.metriek, it.oordeel, Math.max(1, Math.min(7, Math.round((Date.parse(it.oordeel) - Date.parse(it.dag)) / 864e5)))); voor = a && a.v; na = b && b.v; }
  if (voor == null || na == null) return { uitslag: 'geen meting', waarom: 'het getal ' + it.metriek + ' is ' + (voor == null ? 'voor' : 'op de oordeeldatum') + ' niet gemeten', voor: voor == null ? null : voor, na: na == null ? null : na, door: 'auto' };
  const delta = rond(na - voor); const goed = it.richting === 'omlaag' ? -delta > it.drempel : delta > it.drempel;
  return { uitslag: goed ? 'raak' : 'mis', waarom: it.metriek + ' van ' + voor + ' naar ' + na + ' (' + (delta >= 0 ? '+' : '') + delta + ', nodig ' + (it.richting === 'omlaag' ? '-' : '+') + it.drempel + ')', voor, na, door: 'auto' };
}

// Alle output van een periode, met oordeel; deploys uit het werklog tellen mee als output zonder intentie.
export async function outputData(kv, projecten, log, reeks, dagen = 30, vandaag = dagUtc()) {
  const vanaf = plus(vandaag, -(dagen - 1)); const hist = await leesHist(kv);
  const per = {};
  await Promise.all(projecten.map(async p => {
    const l = ((await kv.get(OUT + p.id).catch(() => null)) || []).filter(x => x.dag >= vanaf);
    const items = l.map(x => Object.assign({}, x, { oordeelNu: oordeelVan(x, (reeks || {})[p.id], hist[p.id], vandaag) }));
    for (const x of (log || [])) if (String(x.wie) === 'deploy' && p.woorden && p.woorden.test(String(x.tekst || '')) && String(x.t).slice(0, 10) >= vanaf)
      items.push({ id: 'd' + String(x.t).slice(5, 16).replace(/\D/g, ''), dag: String(x.t).slice(0, 10), wat: kort(String(x.tekst).replace(/^Live gezet\s*/i, 'Uitrol '), 200), intentie: '', metriek: '', auto: true, oordeelNu: { uitslag: 'geen intentie', waarom: 'uitrol zonder gemelde intentie' } });
    items.sort((a, b) => b.dag.localeCompare(a.dag));
    const tel = { gemaakt: items.length, raak: 0, mis: 0, open: 0, geenMeting: 0, zonder: 0 };
    for (const it of items) { const u = it.oordeelNu.uitslag; if (u === 'raak') tel.raak++; else if (u === 'mis') tel.mis++; else if (u === 'open') tel.open++; else if (u === 'geen intentie') tel.zonder++; else tel.geenMeting++; }
    per[p.id] = { id: p.id, naam: p.naam, items, tel };
  }));
  const tot = { gemaakt: 0, raak: 0, mis: 0, open: 0, geenMeting: 0, zonder: 0 };
  for (const x of Object.values(per)) for (const k of Object.keys(tot)) tot[k] += x.tel[k];
  const beoordeeld = tot.raak + tot.mis;
  return { dagen, vanaf, tot, trefkans: beoordeeld ? Math.round(100 * tot.raak / beoordeeld) : null, projecten: projecten.map(p => per[p.id]).filter(x => x && x.items.length) };
}

export function outputTekst(o, alleen = '') {
  const r = ['OUTPUT EN OUTCOME, laatste ' + o.dagen + ' dagen (vanaf ' + o.vanaf + ')',
    'Output = wat we maakten, met de intentie welk getal het moet bewegen. Outcome = dat getal zelf (meting of kasboek). Output telt nooit als resultaat.',
    'Totaal: ' + o.tot.gemaakt + ' gemaakt, ' + o.tot.raak + ' raak, ' + o.tot.mis + ' mis, ' + o.tot.open + ' nog open, ' + o.tot.geenMeting + ' zonder meting, ' + o.tot.zonder + ' zonder intentie' + (o.trefkans != null ? '. Trefkans ' + o.trefkans + '%.' : '.'), ''];
  for (const p of o.projecten.filter(x => !alleen || x.id === alleen)) {
    r.push('## ' + p.naam + ' (' + p.id + '): ' + p.tel.gemaakt + ' gemaakt, ' + p.tel.raak + ' raak, ' + p.tel.mis + ' mis, ' + p.tel.open + ' open');
    for (const it of p.items.slice(0, 40)) r.push('- ' + it.dag + ' [' + it.oordeelNu.uitslag + '] ' + it.wat + (it.intentie ? ' | intentie: ' + it.intentie + (it.verwacht ? ' | verwacht: ' + it.verwacht : '') + ' | oordeel ' + it.oordeel : '') + (it.oordeelNu.waarom ? ' | ' + it.oordeelNu.waarom : '') + (it.id && !it.auto ? ' | id ' + it.id : ''));
    r.push('');
  }
  r.push('MELDEN (in dezelfde beurt als het werk): /api/mm/dashboard?zet={"project":"<id>","output":{"wat":"...","intentie":"welk getal moet bewegen en waarom","metriek":"nu|opbrengst|kosten|waarde","richting":"omhoog|omlaag","drempel":<getal>,"verwacht":"...","oordeel":"JJJJ-MM-DD","link":"https://..."}}',
    'ZELF OORDELEN (gaat voor het automatische oordeel): /api/mm/dashboard?zet={"project":"<id>","oordeel":{"id":"<output-id>","uitslag":"raak|mis|onduidelijk","waarom":"getal voor en na en de reden"}}',
    'Metriek nu = de meting op het dashboard; opbrengst, kosten en waarde = gemiddelde per dag uit het kasboek, 7 dagen voor de output tegen de dagen tot de oordeeldatum.');
  return r.join('\n');
}
