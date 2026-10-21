// Leerlus voor het aanmeldblok (mail + browsermeldingen) op keuzehulp.best, whichtobuy.best en kaufberater.best.
// Per bezoek: één variant (Thompson-steekproef, nieuwe varianten eerst extra verkeer). Per 150 keer gezien (hooguit 1x per uur):
// verliezers eruit (<5% kans de beste), winnaar vastleggen (>95%), nieuwe variant laten bedenken door zes rollen + voorzitter (AI Gateway).
// Signaalcheck bij elke aanroep (hooguit 1x per uur). Eigenaarspagina: /api/keuze-updates?op=leer op elke site.
import { kv } from './db.js';

const LANG = { kz: 'nl', us: 'en', de: 'de' };
const NAAM = { kz: 'Keuzehulp', us: 'Which To Buy', de: 'Kaufberater' };
const RONDE_N = 150, MIN_BESLUIT = 100, MAX_PER_DAG = 10;
const PRINCIPES = ['helderheid', 'verliesaversie', 'nieuwsgierigheid', 'kleine eerste stap', 'nut nu', 'exclusief eerst', 'sociale bewijskracht (alleen echte cijfers)', 'autonomie', 'concreet voordeel'];

// Startvarianten. Mail = altijd de dagelijkse nieuwe keuzehulp. Meldingen = updates van deze gids (sc 'gids') of ook nieuwe keuzehulpen (sc 'gids+nieuw').
export const SEEDS = {
  nl: [
    { id: 'n0', t: 'Elke dag één nieuwe keuzehulp', d: 'Eén nieuwe keuzehulp per dag per e-mail. Bevestig je adres; afmelden kan altijd.', b: 'Stuur mij de dagelijkse keuzehulp', pb: 'Zet meldingen aan', pf: false, sc: 'gids', pl: 'eind', principe: 'helderheid' },
    { id: 'n1', t: 'Kies slimmer. Ontvang onze volgende keuzehulp.', d: 'Elke ochtend één korte keuzehulp in je mail. Geen reclame, afmelden met één klik.', b: 'Ja, stuur me de volgende', pb: 'Zet meldingen aan', pf: false, sc: 'gids', pl: 'eind', principe: 'autonomie' },
    { id: 'n2', t: 'Prijsalarm voor jouw advies', d: 'Je krijgt een melding als de prijs van dit advies echt zakt of als er een beter model is. Hooguit één per dag.', b: 'Mail mij elke dag een nieuwe keuzehulp', pb: 'Zet prijsalarm aan', pf: true, sc: 'gids', pl: 'advies', principe: 'verliesaversie' },
    { id: 'n3', t: 'Als eerste weten wat er nieuw is', d: 'Eén melding als er een nieuwe keuzehulp live staat of als deze verandert. Hooguit één per dag, uitzetten kan altijd.', b: 'Liever per mail', pb: 'Ja, stuur me een melding', pf: true, sc: 'gids+nieuw', pl: 'eind', principe: 'exclusief eerst' }
  ],
  en: [
    { id: 'e0', t: 'One new buying guide each day', d: 'One new buying guide by email each day. Confirm your address; unsubscribe anytime.', b: 'Send me the daily buying guide', pb: 'Enable updates', pf: false, sc: 'gids', pl: 'eind', principe: 'helderheid' },
    { id: 'e1', t: 'Choose with confidence. Get our next guide.', d: 'One short buying guide in your inbox each morning. No ads, unsubscribe in one click.', b: 'Yes, send me the next one', pb: 'Enable updates', pf: false, sc: 'gids', pl: 'eind', principe: 'autonomie' },
    { id: 'e2', t: 'Price alert for your pick', d: 'Get a notification when the price of this pick really drops or a better model comes out. At most once a day.', b: 'Email me a new guide each day', pb: 'Turn on price alert', pf: true, sc: 'gids', pl: 'advies', principe: 'verliesaversie' },
    { id: 'e3', t: 'Be the first to see what is new', d: 'One notification when a new guide goes live or this one changes. At most once a day, turn off anytime.', b: 'I prefer email', pb: 'Yes, notify me', pf: true, sc: 'gids+nieuw', pl: 'eind', principe: 'exclusief eerst' }
  ],
  de: [
    { id: 'd0', t: 'Jeden Tag ein neuer Kaufberater', d: 'Ein neuer Kaufberater pro Tag per E-Mail. Adresse bestätigen; jederzeit abmelden.', b: 'Täglichen Kaufberater erhalten', pb: 'Meldungen aktivieren', pf: false, sc: 'gids', pl: 'eind', principe: 'helderheid' },
    { id: 'd1', t: 'Besser entscheiden. Erhalte den nächsten Kaufberater.', d: 'Jeden Morgen ein kurzer Kaufberater per E-Mail. Keine Werbung, Abmelden mit einem Klick.', b: 'Ja, schick mir den nächsten', pb: 'Meldungen aktivieren', pf: false, sc: 'gids', pl: 'eind', principe: 'autonomie' },
    { id: 'd2', t: 'Preisalarm für deine Empfehlung', d: 'Du bekommst eine Meldung, wenn der Preis dieser Empfehlung wirklich sinkt oder ein besseres Modell kommt. Höchstens einmal am Tag.', b: 'Jeden Tag einen neuen Kaufberater per Mail', pb: 'Preisalarm aktivieren', pf: true, sc: 'gids', pl: 'advies', principe: 'verliesaversie' },
    { id: 'd3', t: 'Als Erster wissen, was neu ist', d: 'Eine Meldung, wenn ein neuer Kaufberater online ist oder sich dieser ändert. Höchstens einmal am Tag, jederzeit abschaltbar.', b: 'Lieber per E-Mail', pb: 'Ja, benachrichtige mich', pf: true, sc: 'gids+nieuw', pl: 'eind', principe: 'exclusief eerst' }
  ]
};

const dag = (d = new Date()) => new Date(d.getTime() - 4 * 3600000).toISOString().slice(0, 10); // Curaçao-dag
const K = { pool: s => 'updates:pool:' + s, v: (s, id, e) => 'updates:v:' + s + ':' + id + ':' + e, vd: (d, s, e) => 'updates:vd:' + d + ':' + s + ':' + e, ronde: s => 'updates:ronde:' + s, lessen: s => 'updates:lessen:' + s, alarm: s => 'updates:alarm:' + s, log: s => 'updates:leerlog:' + s };
const EV = ['cta', 'focus', 'request', 'push', 'confirmed', 'win'];

export async function pool(site) {
  let p = null; try { p = await kv.get(K.pool(site)); } catch {}
  if (!p || !Array.isArray(p.varianten) || !p.varianten.length) { p = { varianten: SEEDS[LANG[site]].map(v => ({ ...v, actief: true, bron: 'start', born: Date.now() })) }; try { await kv.set(K.pool(site), p); } catch {} }
  return p;
}
export const variant = async (site, vid) => { const p = await pool(site); return p.varianten.find(v => v.id === vid) || p.varianten.find(v => v.actief) || p.varianten[0]; };

function gamma(k) { if (k < 1) return gamma(k + 1) * Math.pow(Math.random(), 1 / k); const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { x = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random()); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = Math.random(); if (u < 1 - .0331 * x ** 4 || Math.log(u) < .5 * x * x + d * (1 - v + Math.log(v))) return d * v; } }
const beta = (a, b) => { const x = gamma(a), y = gamma(b); return x / (x + y); };

export async function stats(site, ids) {
  const vals = await kv.mget(...ids.flatMap(id => EV.map(e => K.v(site, id, e))));
  return Object.fromEntries(ids.map((id, i) => [id, Object.fromEntries(EV.map((e, j) => [e, Number(vals[i * EV.length + j]) || 0]))]));
}
// kans dat elke variant de beste is (winst per keer gezien)
export function kansBeste(st, ids, n = 4000) {
  const won = Object.fromEntries(ids.map(id => [id, 0]));
  for (let r = 0; r < n; r++) { let best = null, bv = -1; for (const id of ids) { const s = st[id]; const x = beta(s.win + 1, Math.max(0, s.cta - s.win) + 1); if (x > bv) { bv = x; best = id; } } won[best]++; }
  return Object.fromEntries(ids.map(id => [id, won[id] / n]));
}
export async function chooseVariant(site) {
  const p = await pool(site); const act = p.varianten.filter(v => v.actief); if (!act.length) return p.varianten[0].id;
  const st = await stats(site, act.map(v => v.id));
  const nieuw = act.filter(v => st[v.id].cta < MIN_BESLUIT);
  if (nieuw.length && Math.random() < Math.min(.5, .2 * nieuw.length)) return nieuw[Math.floor(Math.random() * nieuw.length)].id; // nieuwe varianten eerst ~20% per stuk
  if (Math.random() < .1) return act[Math.floor(Math.random() * act.length)].id;
  let best = act[0].id, bv = -1; for (const v of act) { const s = st[v.id]; const x = beta(s.win + 1, Math.max(0, s.cta - s.win) + 1); if (x > bv) { bv = x; best = v.id; } } return best;
}
export async function incrV(site, vid, kind, token) {
  if (!vid || !EV.includes(kind)) return; const d = dag(); const ops = [[K.v(site, vid, kind), 1], [K.vd(d, site, kind), 1]];
  if ((kind === 'request' || kind === 'push') && token) { let once = null; try { once = await kv.raw(['SET', 'updates:win:' + token, '1', 'NX', 'EX', String(14 * 86400)]); } catch {} if (once) ops.push([K.v(site, vid, 'win'), 1], [K.vd(d, site, 'win'), 1]); }
  try { await kv.incrMany(ops); } catch {}
}

async function dagTellers(site, dagen = 2) {
  const ds = Array.from({ length: dagen }, (_, i) => dag(new Date(Date.now() - i * 86400000)));
  const vals = await kv.mget(...ds.flatMap(d => EV.map(e => K.vd(d, site, e))));
  const out = Object.fromEntries(EV.map(e => [e, 0])); ds.forEach((d, i) => EV.forEach((e, j) => { out[e] += Number(vals[i * EV.length + j]) || 0; })); return out;
}

// signaalcheck: hooguit 1x per uur opnieuw rekenen
export async function signaal(site, ctx = {}) {
  let oud = null; try { oud = await kv.get(K.alarm(site)); } catch {}
  if (oud && Date.now() - oud.at < 3600000 && !ctx.forceer) return oud;
  const t = await dagTellers(site, 2); const a = [];
  if (ctx.mail === false) a.push({ code: 'A', tekst: 'Mailsleutel ontbreekt: aanmeldingen kunnen geen bevestigingsmail krijgen.' });
  if (t.cta >= 30 && t.win === 0) a.push({ code: 'F', tekst: t.cta + ' keer gezien in 2 dagen en 0 aanmeldingen: het blok zelf werkt niet (knop, tekst of plek).' });
  if (t.request >= 10 && t.confirmed === 0) a.push({ code: 'B', tekst: t.request + ' aanvragen en 0 bevestigd in 2 dagen: komt de bevestigingsmail wel aan (spam, afzender)?' });
  const w = ctx.worker; if (w && w.at && Date.now() - Date.parse(w.at) > 2 * 3600000) a.push({ code: 'W', tekst: 'De verzendronde draaide al meer dan 2 uur niet (laatste ' + w.at + ').' });
  if (w && w.errors > 0) a.push({ code: 'X', tekst: 'Verzendronde had ' + w.errors + ' fouten.' });
  const uit = { at: Date.now(), tellers2d: t, alarmen: a }; try { await kv.set(K.alarm(site), uit, { ex: 3 * 86400 }); } catch {} return uit;
}

const SLECHT = /—|–|ultiem|revolutionair|ongekend|game.?changer|unlock|elevate|seamless|ultimate|revolutionary|unglaublich|einzigartig|!{1,}/i;
function geldig(v, lang) {
  const len = (s, a, b) => typeof s === 'string' && s.trim().length >= a && s.trim().length <= b;
  if (!len(v.t, 8, 70) || !len(v.d, 20, 190) || !len(v.b, 4, 44) || !len(v.pb, 4, 34)) return false;
  if ([v.t, v.d, v.b, v.pb].some(s => SLECHT.test(s))) return false;
  if (!['gids', 'gids+nieuw'].includes(v.sc) || !['advies', 'eind'].includes(v.pl)) return false;
  if (/\d+[.,]?\d*\s*(%|procent|percent|prozent|mensen|people|leute|lezers|readers|Leser)/i.test(v.t + ' ' + v.d)) return false; // geen verzonnen aantallen
  return true;
}
async function bedenk(site, act, st, lessen, oidc) {
  const lang = LANG[site];
  const system = 'Je bent een team van zes rollen (data-analist, koperpsycholoog, gedragseconoom, producent, mediabuyer, techneut) plus een voorzitter. Je verbetert het aanmeldblok van ' + NAAM[site] + ' (keuzehulpsite). Mail = altijd één nieuwe keuzehulp per dag (dubbele opt-in). Meldingen = updates of prijsdaling van de bekeken keuzehulp (sc "gids"), of ook nieuwe keuzehulpen (sc "gids+nieuw"). Regels: alleen ware beloftes, geen verzonnen aantallen of reviews, geen aftelklokken, geen gedachtestreepjes, geen uitroeptekens, geen marketingwoorden, gewone taal zoals een mens schrijft. Taal van de tekst: ' + lang + '. Antwoord alleen met JSON.';
  const user = JSON.stringify({ doel: 'meer aanmeldingen (mail of meldingen) per keer dat het blok echt gezien is', varianten: act.map(v => ({ id: v.id, titel: v.t, tekst: v.d, mailknop: v.b, meldknop: v.pb, meldingenEerst: v.pf, scope: v.sc, plek: v.pl, principe: v.principe, gezien: st[v.id].cta, aanmeldingen: st[v.id].win })), lessen: lessen.slice(0, 12).map(l => l.les), principes: PRINCIPES,
    opdracht: 'Elke rol doet één voorstel voor een nieuwe variant die het grootste lek aanpakt; elke rol geeft de anderen een score van -2 tot +2; de voorzitter kiest er één. Geef {"rollen":[{"rol":"","voorstel":""}],"keuze":{"t":"titel max 70 tekens","d":"tekst max 190","b":"mailknop max 44","pb":"meldknop max 34","pf":true|false,"sc":"gids"|"gids+nieuw","pl":"advies"|"eind","principe":"een van de principes","waarom":"één zin"}}' });
  const { claude } = await import('./wtb.js'); const r = await claude(system, user, { fn: 'updates-leer', max: 3000, oidc });
  const txt = String(r.txt || ''); const m = txt.match(/\{[\s\S]*\}/); if (!m) throw new Error('geen JSON');
  const k = JSON.parse(m[0]).keuze; if (!k) throw new Error('geen keuze'); k.pf = !!k.pf; if (!geldig(k, lang)) throw new Error('voorstel voldoet niet aan de regels');
  return { t: k.t.trim(), d: k.d.trim(), b: k.b.trim(), pb: k.pb.trim(), pf: k.pf, sc: k.sc, pl: k.pl, principe: String(k.principe || '').slice(0, 60), waarom: String(k.waarom || '').slice(0, 200) };
}

// één leerronde per site; veilig vaak aan te roepen (wacht zelf op 150 nieuwe keer gezien en 1 uur)
export async function ronde(site, ctx = {}) {
  const sig = await signaal(site, ctx); const p = await pool(site); const act = p.varianten.filter(v => v.actief);
  const st = await stats(site, p.varianten.map(v => v.id)); const totCta = act.reduce((n, v) => n + st[v.id].cta, 0);
  let r = null; try { r = await kv.get(K.ronde(site)); } catch {} r = r || { at: 0, cta: 0, nr: 0, vandaag: { dag: '', n: 0 } };
  const uur = new Date(Date.now() - 4 * 3600000).getUTCHours();
  const uit = { site, nr: r.nr, gezienSindsRonde: totCta - r.cta, nodig: RONDE_N, alarmen: sig.alarmen, gedaan: [] };
  if (!ctx.forceer && (totCta - r.cta < RONDE_N || Date.now() - r.at < 3600000)) return { ...uit, wacht: true };
  if (sig.alarmen.some(a => a.code === 'F' || a.code === 'A')) return { ...uit, wacht: true, reden: 'alarm eerst oplossen' };
  if (r.vandaag.dag !== dag()) r.vandaag = { dag: dag(), n: 0 };
  const kans = kansBeste(st, act.map(v => v.id)); const leider = act.slice().sort((a, b) => kans[b.id] - kans[a.id])[0];
  const lessen = (await kv.get(K.lessen(site)).catch(() => null)) || [];
  const rate = id => st[id].cta ? (100 * st[id].win / st[id].cta).toFixed(1) + '%' : 'n.v.t.';
  let wijz = 0;
  for (const v of act) {
    if (wijz >= 2 || r.vandaag.n >= MAX_PER_DAG) break;
    if (v.id !== leider.id && st[v.id].cta >= MIN_BESLUIT && kans[v.id] < .05) {
      v.actief = false; v.gestopt = Date.now(); wijz++; r.vandaag.n++;
      const les = { at: Date.now(), principe: v.principe, les: '"' + v.t + '" (' + v.principe + ', ' + (v.pf ? 'meldingen eerst' : 'mail eerst') + ', ' + v.sc + ', plek ' + v.pl + ') verloor: ' + rate(v.id) + ' tegen ' + rate(leider.id) + ' bij "' + leider.t + '" (' + leider.principe + ').' };
      lessen.unshift(les); uit.gedaan.push('gestopt ' + v.id + ': ' + les.les);
    }
  }
  if (st[leider.id].cta >= 300 && kans[leider.id] > .95 && !leider.winnaar) { leider.winnaar = Date.now(); lessen.unshift({ at: Date.now(), principe: leider.principe, les: 'Winnaar: "' + leider.t + '" (' + leider.principe + ') met ' + rate(leider.id) + ' over ' + st[leider.id].cta + ' keer gezien.' }); uit.gedaan.push('winnaar ' + leider.id); }
  const nacht = uur < 6;
  if (!nacht && wijz < 2 && r.vandaag.n < MAX_PER_DAG && p.varianten.filter(v => v.actief).length < 4) {
    try { const nv = await bedenk(site, p.varianten.filter(v => v.actief), st, lessen, ctx.oidc); const id = LANG[site][0] + 'a' + (p.varianten.length + 1) + Date.now().toString(36).slice(-3);
      p.varianten.push({ ...nv, id, actief: true, bron: 'ai', born: Date.now() }); wijz++; r.vandaag.n++; uit.gedaan.push('nieuw ' + id + ': "' + nv.t + '" (' + nv.principe + ') ' + nv.waarom); }
    catch (e) { uit.gedaan.push('geen nieuwe variant: ' + String(e.message || e).slice(0, 120)); }
  }
  try { await kv.set(K.pool(site), p); await kv.set(K.lessen(site), lessen.slice(0, 60)); } catch {}
  r = { ...r, at: Date.now(), cta: totCta, nr: r.nr + 1, laatste: uit.gedaan }; try { await kv.set(K.ronde(site), r); const log = (await kv.get(K.log(site))) || []; log.unshift({ at: Date.now(), nr: r.nr, gedaan: uit.gedaan, kans }); await kv.set(K.log(site), log.slice(0, 100)); } catch {}
  return { ...uit, nr: r.nr, kans };
}

const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export async function leerPagina(site, css) {
  const p = await pool(site); const ids = p.varianten.map(v => v.id); const st = await stats(site, ids); const act = p.varianten.filter(v => v.actief);
  const kans = act.length ? kansBeste(st, act.map(v => v.id), 3000) : {}; const sig = (await kv.get(K.alarm(site)).catch(() => null)) || { alarmen: [], tellers2d: {} };
  const r = (await kv.get(K.ronde(site)).catch(() => null)) || { nr: 0, cta: 0, at: 0 }; const lessen = (await kv.get(K.lessen(site)).catch(() => null)) || []; const log = (await kv.get(K.log(site)).catch(() => null)) || [];
  const tot = act.reduce((n, v) => n + st[v.id].cta, 0); const pct = (a, b) => b ? (100 * a / b).toFixed(1) + '%' : '-';
  const rij = v => { const s = st[v.id]; return '<div class="card"><div class="cat">' + e(v.actief ? (v.winnaar ? 'winnaar' : 'actief') : 'gestopt') + ' · ' + e(v.principe) + ' · ' + (v.pf ? 'meldingen eerst' : 'mail eerst') + ' · ' + e(v.sc) + ' · plek ' + e(v.pl) + (v.bron === 'ai' ? ' · bedacht door de lus' : '') + '</div><h3>' + e(v.t) + '</h3><p>' + e(v.d) + '</p><p>Gezien ' + s.cta + ' · aanmeldingen ' + s.win + ' (' + pct(s.win, s.cta) + ') · mail aangevraagd ' + s.request + ', bevestigd ' + s.confirmed + ' · meldingen aan ' + s.push + (v.actief ? ' · kans de beste ' + Math.round(100 * (kans[v.id] || 0)) + '%' : '') + '</p></div>'; };
  const body = '<p class="eyebrow">Leerlus aanmeldblok · ' + e(NAAM[site]) + '</p><h1>Wat het aanmeldblok leert</h1><p class="lead">Elk bezoek krijgt één variant. Elke ' + RONDE_N + ' keer gezien (hooguit eens per uur) gaan verliezers eruit en bedenkt de lus een nieuwe. Meldingen gaan uit bij een nieuwe keuzehulp, een inhoudelijke wijziging of een echte prijsdaling, hooguit één per dag.</p>'
    + (sig.alarmen && sig.alarmen.length ? '<div class="answer"><p><strong>Signaalcheck:</strong></p>' + sig.alarmen.map(a => '<p>' + e(a.code) + '. ' + e(a.tekst) + '</p>').join('') + '</div>' : '<div class="answer"><p><strong>Signaalcheck: geen alarm.</strong> Laatste 2 dagen: ' + (sig.tellers2d.cta || 0) + ' keer gezien, ' + (sig.tellers2d.win || 0) + ' aanmeldingen, ' + (sig.tellers2d.confirmed || 0) + ' mail bevestigd.</p></div>')
    + '<p class="meta">Ronde ' + r.nr + (r.at ? ', laatst ' + new Date(r.at).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : '') + ' · volgende ronde na ' + Math.max(0, RONDE_N - (tot - r.cta)) + ' keer gezien</p>'
    + '<h2>Varianten</h2><div class="grid">' + p.varianten.slice().sort((a, b) => (b.actief - a.actief) || ((kans[b.id] || 0) - (kans[a.id] || 0))).map(rij).join('') + '</div>'
    + '<h2>Lessen</h2>' + (lessen.length ? '<ul>' + lessen.slice(0, 20).map(l => '<li>' + e(l.les) + '</li>').join('') + '</ul>' : '<p>Nog geen lessen: elke variant heeft eerst ' + MIN_BESLUIT + ' keer gezien nodig.</p>')
    + '<h2>Rondes</h2>' + (log.length ? '<ul>' + log.slice(0, 15).map(l => '<li>' + new Date(l.at).toISOString().slice(0, 16).replace('T', ' ') + ' · ronde ' + l.nr + ': ' + e((l.gedaan || []).join(' | ') || 'niets gewijzigd') + '</li>').join('') + '</ul>' : '<p>Nog geen ronde gedraaid.</p>');
  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Leerlus aanmeldblok</title><style>' + css + '</style></head><body><main><div class="wrap">' + body + '</div></main></body></html>';
}
