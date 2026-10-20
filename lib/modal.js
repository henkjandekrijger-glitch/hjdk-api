// Clickmind: de lerende modal.
// DE LERENDE MODAL (Henkjan 14 okt 2026): "nog meer uit een klik halen met een lerende modal op onze sites: andere site tonen of e-mail invoeren",
// en daarna: "maak Clickmind overal beschikbaar en de modal zeer intelligent en zeer lerend".
// Eén script op elke eigen pagina:  <script src="https://whichtobuy.best/cm.js" data-site="<site>" async></script>
//   Per paginabezoek kiest de server een arm: e-mail, een andere eigen site (uit de catalogus: elke site toont de andere) of niets (controlegroep).
//   Zo slim mogelijk:
//   - Contextueel leren per bezoeker (lineaire Thompson sampling): per arm een Bayesiaans model op 19 kenmerken (mobiel, terug, netwerk,
//     zoekmachine, uur, land, eerder gezien of geklikt, kwaliteit van de zone, abonnee). Het model voorspelt de waarde van elke arm voor deze
//     bezoeker en trekt uit de onzekerheid, zodat het blijft verkennen. Weinig data per site: het model leent van hetzelfde soort arm op alle sites.
//   - Het moment leert apart (bij weggaan, na 12/25/45 seconden, bij 50/80% scrollen), net als de tekst: elke arm heeft varianten, en de
//     leerronde laat Claude elke dag een nieuwe uitdager schrijven op basis van de winnaar; verliezers gaan eruit.
//   - Automatische rem: kost een arm aantoonbaar de gewone klik (bv. naar Amazon) en levert hij minder op dan niets tonen, dan gaat hij 7 dagen uit.
//   - In de browser: nooit vóór minSec, nooit aan bots (mensmeter), nooit als er al een venster open is, iemand typt of op een betaal-, inlog-
//     of winkelwagenpagina zit, hoogstens één keer per 'cap' uur.
//   - Gemeten per beslissing (ook bij de controlegroep): toon, klik, sluit, hoofd (gewone klik naar buiten), en op de andere site automatisch
//     echt, actie en aanmelding (cm.js op die site meldt ze met de klik-id mmc). Waarde = som van de gebeurtenissen x waarde in centen.
//   - Nooit Amazon in de modal, nooit een beloning voor kopen, nooit de terugknop kapen.
//   - E-mail: via de eigen aanmeldfunctie van de pagina (window.mmAanmelden), of met doel 'moonlighter' rechtstreeks bij de Moonlighter-lijst
//     (welkomstmail en afmelden regelt Moonlighter), anders bewaard met de toestemmingstekst in mm:mail:<lijst>.
// Opslag: mm:modal:<site> instelling (met model, momLeer, varLeer, varianten, rem), mm:modals namen, mm:cmsites catalogus,
//   mm:md:<dag> tellers "<site>|<arm>|<seg>|<veld>", "<site>|@<moment>|*|<veld>", "<site>|<arm>~<variant>|*|<veld>" (60 d),
//   mm:mdl:<dag> beslissingen met kenmerken (21 d), mm:mdv:<dag> gebeurtenissen per beslissing "mid|ev" (21 d),
//   mm:cid:<mid> (30 d, velden modal, arm, seg, mom, var), mm:mu:<mid>:<ev> dubbelcheck, mm:mqc:<site>:<id> cap, mm:mail:<lijst> adressen, mm:zq zonekwaliteit.
import { createHash } from 'node:crypto';
import { nieuwId, dag } from './mensmeter.js';
import { soortPersoon, beta, uitkomst } from './wissel.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const T = { teller: 60 * 86400, cid: 30 * 86400, log: 21 * 86400 };
const paren = h => { if (!h) return []; if (Array.isArray(h)) { const o = []; for (let i = 0; i + 1 < h.length; i += 2) o.push([String(h[i]), h[i + 1]]); return o; } return Object.entries(h); };
export const SEGMENTEN = ['m-n', 'm-t', 'd-n', 'd-t'];
export const EVENTS = ['toon', 'klik', 'sluit', 'hoofd'];
export const VELDEN = ['n', 'toon', 'klik', 'sluit', 'hoofd', 'echt', 'actie', 'aanmelding', 'koop'];
export const MOMENTEN = ['exit', 'tijd:12', 'tijd:25', 'tijd:45', 'scroll:50', 'scroll:80'];
const WAARDE = { hoofd: 1, klik: 2, echt: 0.3, actie: 1, aanmelding: 70, koop: 300 };
// kenmerken voor het contextuele model (volgorde ligt vast; een nieuw kenmerk = nieuwe versie van FEAT, het model leert dan opnieuw)
export const FEAT = ['bias', 'mob', 'terug', 'betaald', 'propeller', 'mondiad', 'anderNet', 'zoek', 'nacht', 'ochtend', 'avond', 'us', 'dach', 'nlbe', 'gezien', 'geklikt', 'zoneMens', 'zoneSlecht', 'abonnee'];
// Alleen eigen domeinen, nooit Amazon (een Amazon-link in een pop-up is riskant voor het Associates-account)
const EIGEN = /^(?:[a-z0-9-]+\.)*(todayin\.email|finds\.email|mylevel\.today|whichtobuy\.best|kaufberater\.best|keuzehulp\.best|outname\.now|yoo\.rs|praisy\.me|moonlighter\.email|nexy\.help)$/i;
export const eigenHost = h => EIGEN.test(String(h || '').split(':')[0]);
export function siteUrlOk(u) { try { const x = new URL(String(u).replace(/\{[a-z]+\}/g, 'x')); return x.protocol === 'https:' && eigenHost(x.hostname) && !x.username && !x.password; } catch (e) { return false; } }
const tekst = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u2028\u2029]/g, ' ').trim().slice(0, n);
const VERBODEN = /amazon|cashback|gratis cadeau|free gift|guarantee|garantie|last chance|laatste kans|only today|alleen vandaag|limited time|winner|gewonnen|congratulations|gefeliciteerd|act now|urgent/i;

// ---- catalogus: elke eigen site als aanbod op de andere sites (Henkjan: "andere site tonen") ----
export const CATALOGUS = [
  { id: 'todayin', host: 'todayin.email', taal: 'en', url: 'https://todayin.email/for-you?src=clickmind&zone={site}&campaign={arm}', titel: 'Your news, only what you care about', tekst: 'Pick a few topics and get one short email a day.', knop: 'Pick my topics' },
  { id: 'finds', host: 'finds.email', taal: 'en', url: 'https://finds.email/?n=clickmind&z={site}&c={arm}', titel: "Today's best finds", tekst: 'A short daily list of useful things people actually buy.', knop: "Show me today's list" },
  { id: 'aitest', host: 'mylevel.today', taal: 'en', url: 'https://mylevel.today/ai-job-risk-test?c=cm-{site}&z={arm}', titel: 'Will AI take your job?', tekst: 'A 2-minute test. See your score and compare it with friends.', knop: 'Take the test' },
  { id: 'whichtobuy', host: 'whichtobuy.best', taal: 'en', url: 'https://whichtobuy.best/?src=clickmind&z={site}', titel: 'Not sure which one to buy?', tekst: 'Three questions, one honest pick. Buying guides written for 2026.', knop: 'Find my pick' },
  { id: 'kaufberater', host: 'kaufberater.best', taal: 'de', url: 'https://kaufberater.best/?src=clickmind&z={site}', titel: 'Unsicher, was Sie kaufen sollen?', tekst: 'Drei Fragen, eine ehrliche Empfehlung. Kaufberater für 2026.', knop: 'Meine Empfehlung finden' },
  { id: 'keuzehulp', host: 'keuzehulp.best', taal: 'nl', url: 'https://keuzehulp.best/?src=clickmind&z={site}', titel: 'Twijfel je wat je moet kopen?', tekst: 'Drie vragen, één eerlijk advies. Keuzehulpen voor 2026.', knop: 'Vind mijn keuze' }
];
export async function catalogus(kv) { const c = await kv.get('mm:cmsites').catch(() => null); return Array.isArray(c) && c.length ? c : CATALOGUS; }
export async function bewaarCatalogus(kv, lijst) {
  if (!Array.isArray(lijst) || !lijst.length || lijst.length > 20) return { ok: false, fout: '1 tot 20 sites' };
  const uit = [];
  for (const s of lijst) {
    const id = String(s.id || '').toLowerCase(); if (!/^[a-z0-9-]{2,20}$/.test(id)) return { ok: false, fout: 'id: ' + id };
    if (!siteUrlOk(s.url) || !eigenHost(s.host)) return { ok: false, fout: id + ': url en host moeten een eigen site zijn (nooit Amazon)' };
    const x = { id, host: String(s.host).toLowerCase(), taal: /^[a-z]{2}$/.test(s.taal) ? s.taal : 'en', url: String(s.url).slice(0, 600), titel: tekst(s.titel, 80), tekst: tekst(s.tekst, 240), knop: tekst(s.knop, 40), uit: s.uit === true };
    if (!x.titel || !x.knop || VERBODEN.test(x.titel + ' ' + x.tekst + ' ' + x.knop)) return { ok: false, fout: id + ': titel en knop nodig, geen verboden woorden' };
    uit.push(x);
  }
  await kv.set('mm:cmsites', uit); CACHE.clear(); return { ok: true, catalogus: uit };
}

// ---- instelling controleren ----
export function checkModal(c, oud) {
  const f = m => ({ ok: false, fout: m });
  if (!c || typeof c !== 'object') return f('geen JSON-object');
  const site = String(c.site || '').toLowerCase(); if (!/^[a-z0-9-]{2,30}$/.test(site)) return f('site: 2-30 tekens a-z, 0-9 of -');
  const domeinen = (Array.isArray(c.domeinen) ? c.domeinen : []).map(d => String(d).toLowerCase().trim()).filter(Boolean).slice(0, 6);
  if (!domeinen.length || !domeinen.every(eigenHost)) return f('domeinen: 1 tot 6 eigen domeinen waar het script mag draaien');
  const w = c.waarde || {}, waarde = {};
  for (const [k, d] of Object.entries(WAARDE)) waarde[k] = Math.max(0, Math.min(100000, N(w[k] != null ? w[k] : d)));
  if (!Array.isArray(c.armen) || !c.armen.length || c.armen.length > 8) return f('armen: 1 tot 8 (waarvan minstens één controlegroep, soort geen)');
  const ids = new Set(), armen = [];
  for (const a of c.armen) {
    const id = String(a.id || '').toLowerCase(); if (!/^[a-z0-9-]{1,20}$/.test(id) || id.startsWith('x-') || ids.has(id)) return f('arm-id ontbreekt, is ongeldig, begint met x- of is dubbel: ' + id); ids.add(id);
    const gewicht = Math.max(0, Math.min(1000, N(a.gewicht != null ? a.gewicht : 1)));
    const wie = ['alle', 'nieuw', 'terug'].includes(a.wie) ? a.wie : 'alle';
    if (a.soort === 'geen') { armen.push({ id, soort: 'geen', gewicht, wie }); continue; }
    const moment = MOMENTEN.includes(a.moment) ? a.moment : 'leer';
    const basis = { id, soort: a.soort, gewicht, wie, moment, titel: tekst(a.titel, 80), tekst: tekst(a.tekst, 240), knop: tekst(a.knop, 40), nee: tekst(a.nee || (c.taal === 'de' ? 'Nein danke' : c.taal === 'nl' ? 'Nee, dank je' : 'No thanks'), 40), notitie: a.notitie ? tekst(a.notitie, 200) : undefined };
    if (!basis.titel || !basis.knop) return f('arm ' + id + ': titel en knop zijn nodig');
    if (VERBODEN.test(basis.titel + ' ' + basis.tekst + ' ' + basis.knop)) return f('arm ' + id + ': verboden woord (geen Amazon, geen valse haast of beloning)');
    if (a.soort === 'site') {
      if (!siteUrlOk(a.url)) return f('arm ' + id + ': url moet https zijn en naar een eigen site gaan (nooit Amazon)');
      armen.push({ ...basis, url: String(a.url).slice(0, 600) });
    } else if (a.soort === 'email') {
      const lijst = String(a.lijst || site).toLowerCase(); if (!/^[a-z0-9-]{2,30}$/.test(lijst)) return f('arm ' + id + ': lijst 2-30 tekens');
      const doel = ['moonlighter', 'eigen', 'bewaar', 'todayin'].includes(a.doel) ? a.doel : 'bewaar';
      armen.push({ ...basis, lijst, doel, veld: tekst(a.veld || (c.taal === 'de' ? 'Ihre E-Mail' : c.taal === 'nl' ? 'Je e-mailadres' : 'Your email'), 40), klein: tekst(a.klein || 'Unsubscribe anytime. We never share your email.', 160), dank: tekst(a.dank || 'Thanks! Check your inbox.', 120) });
    } else return f('arm ' + id + ': soort moet email, site of geen zijn');
  }
  if (!armen.some(a => a.soort === 'geen' && a.wie === 'alle')) return f('een controlegroep is verplicht (soort geen, wie alle): zonder kun je niet zien of de modal de gewone klik kost');
  const m = {
    site, domeinen, uit: c.uit !== false, modus: c.modus === 'vast' ? 'vast' : 'leer', verken: Math.max(0.02, Math.min(0.5, N(c.verken) || 0.1)),
    controle: Math.max(0.05, Math.min(0.5, N(c.controle) || 0.1)), cap: Math.max(1, Math.min(24 * 30, N(c.cap) || 72)), minSec: Math.max(3, Math.min(120, N(c.minSec) || 8)),
    taal: /^[a-z]{2}$/.test(String(c.taal || '')) ? c.taal : 'en', catalogus: c.catalogus !== false, catalogusAlleen: Array.isArray(c.catalogusAlleen) ? c.catalogusAlleen.map(x => String(x).toLowerCase()).filter(x => /^[a-z0-9-]{2,20}$/.test(x)).slice(0, 10) : undefined, claude: c.claude !== false, waarde, armen,
    notitie: c.notitie ? tekst(c.notitie, 400) : undefined, versie: N(oud && oud.versie) + 1, bijgewerkt: new Date().toISOString()
  };
  for (const k of ['leer', 'leerAt', 'model', 'momLeer', 'varLeer', 'varianten', 'rem', 'claudeAt']) if (oud && oud[k] != null) m[k] = oud[k];
  return { ok: true, modal: m };
}

const CACHE = new Map();
export async function leesModal(kv, site, vers = false) {
  const k = String(site || '').toLowerCase(), c = CACHE.get(k);
  if (!vers && c && Date.now() - c.at < 30000) return c.m;
  const m = await kv.get('mm:modal:' + k); let cat = null;
  if (m && m.catalogus) cat = await catalogus(kv);
  const v = m ? { ...m, alleArmen: alleArmen(m, cat) } : null;
  CACHE.set(k, { at: Date.now(), m: v }); return v;
}
// de eigen armen plus de catalogus (zelfde taal, niet de eigen site); geremde armen eruit
function alleArmen(m, cat) {
  const eigen = m.armen.slice();
  for (const s of cat || []) {
    if (s.uit || s.taal !== m.taal || m.domeinen.some(d => s.host === d || s.host.endsWith('.' + d)) || (m.catalogusAlleen && m.catalogusAlleen.length && !m.catalogusAlleen.includes(s.id))) continue;
    eigen.push({ id: 'x-' + s.id, soort: 'site', gewicht: 1, wie: 'alle', moment: 'leer', titel: s.titel, tekst: s.tekst, knop: s.knop, nee: m.taal === 'de' ? 'Nein danke' : m.taal === 'nl' ? 'Nee, dank je' : 'No thanks', url: s.url, doelSite: s.id });
  }
  const nu = Date.now();
  return eigen.filter(a => !(m.rem && m.rem[a.id] && nu - Date.parse(m.rem[a.id].at) < 7 * 864e5));
}
export async function bewaarModal(kv, c) {
  const oud = await kv.get('mm:modal:' + String(c && c.site || '').toLowerCase());
  const r = checkModal(c, oud); if (!r.ok) return r;
  await kv.set('mm:modal:' + r.modal.site, r.modal); await kv.raw(['SADD', 'mm:modals', r.modal.site]); CACHE.delete(r.modal.site);
  return r;
}
export async function alleModals(kv) { const ns = ((await kv.raw(['SMEMBERS', 'mm:modals']).catch(() => [])) || []).map(String).sort(); return (await Promise.all(ns.map(n => kv.get('mm:modal:' + n)))).filter(Boolean); }
const armType = a => (a.soort === 'geen' ? 'geen' : a.soort === 'email' ? 'email:' + (a.doel || 'bewaar') : 'site:' + (a.doelSite || (() => { try { return new URL(a.url.replace(/\{[a-z]+\}/g, 'x')).hostname; } catch (e) { return 'x'; } })()));

// ---- kleine lineaire algebra voor het model ----
function cholesky(A, d) { const L = new Array(d * d).fill(0); for (let i = 0; i < d; i++) for (let j = 0; j <= i; j++) { let s = A[i * d + j]; for (let k = 0; k < j; k++) s -= L[i * d + k] * L[j * d + k]; if (i === j) L[i * d + i] = Math.sqrt(Math.max(s, 1e-9)); else L[i * d + j] = s / L[j * d + j]; } return L; }
function losOp(L, b, d) { const y = new Array(d).fill(0); for (let i = 0; i < d; i++) { let s = b[i]; for (let k = 0; k < i; k++) s -= L[i * d + k] * y[k]; y[i] = s / L[i * d + i]; } const x = new Array(d).fill(0); for (let i = d - 1; i >= 0; i--) { let s = y[i]; for (let k = i + 1; k < d; k++) s -= L[k * d + i] * x[k]; x[i] = s / L[i * d + i]; } return x; }
function terugLT(L, z, d) { const x = new Array(d).fill(0); for (let i = d - 1; i >= 0; i--) { let s = z[i]; for (let k = i + 1; k < d; k++) s -= L[k * d + i] * x[k]; x[i] = s / L[i * d + i]; } return x; } // los L^T x = z op: x ~ N(0, A^-1)
function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
// Bayesiaanse ridge-regressie: prior N(mu0, (1/lam) I), ruis sigma^2. Geeft mu, de Cholesky L van A = lam I + X'X, en sigma.
// Het gemiddelde (bias) leert vrij; de andere kenmerken krimpen sterk naar het vertrekpunt, want losse aanmeldingen (70 cent) zijn ruis.
export function fit(X, y, { lam = 25, mu0 = null } = {}) {
  const d = FEAT.length, A = new Array(d * d).fill(0), b = new Array(d).fill(0);
  for (let i = 0; i < d; i++) { const l = i === 0 ? 0.5 : lam; A[i * d + i] = l; b[i] = l * (mu0 ? mu0[i] : 0); }
  for (let r = 0; r < X.length; r++) { const x = X[r]; for (let i = 0; i < d; i++) { if (!x[i]) continue; b[i] += x[i] * y[r]; for (let j = 0; j < d; j++) if (x[j]) A[i * d + j] += x[i] * x[j]; } }
  const L = cholesky(A, d), mu = losOp(L, b, d);
  let se = 0; for (let r = 0; r < X.length; r++) { let p = 0; for (let i = 0; i < d; i++) p += X[r][i] * mu[i]; se += (y[r] - p) ** 2; }
  const sigma = Math.max(0.5, Math.sqrt(se / Math.max(1, X.length)));
  return { mu: mu.map(v => Math.round(v * 1e4) / 1e4), L: L.map(v => Math.round(v * 1e4) / 1e4), sigma: Math.round(sigma * 1000) / 1000, n: X.length };
}
export function trek(model, x) { const d = FEAT.length, z = Array.from({ length: d }, gauss), w = terugLT(model.L, z, d); let s = 0; for (let i = 0; i < d; i++) s += x[i] * (model.mu[i] + model.sigma * w[i]); return s; }

// ---- kenmerken van dit bezoek ----
const BETAALD = /^(propeller|mondiad|mgid|richads|clickadu|galaksion|google|bing|meta|md|mg|pa|ra|ca)$/;
export function kenmerken({ mob, terug, net, ref, uur, land, hist, zq, abonnee }) {
  net = String(net || '').toLowerCase(); land = String(land || '').toLowerCase(); uur = N(uur); hist = hist || {};
  const betaald = BETAALD.test(net) || /^(md|mg)\d/.test(net) ? 1 : 0;
  return [1, mob ? 1 : 0, terug ? 1 : 0, betaald, /^(propeller|pa)$/.test(net) ? 1 : 0, /^(mondiad|md)/.test(net) ? 1 : 0, betaald && !/^(propeller|pa|mondiad|md)/.test(net) ? 1 : 0,
    ref === 'zoek' ? 1 : 0, uur < 6 ? 1 : 0, uur >= 6 && uur < 12 ? 1 : 0, uur >= 18 ? 1 : 0, land === 'us' ? 1 : 0, /^(de|at|ch)$/.test(land) ? 1 : 0, /^(nl|be)$/.test(land) ? 1 : 0,
    N(hist.g) > 0 ? 1 : 0, N(hist.k) > 0 ? 1 : 0, zq === 'm' ? 1 : 0, zq === 'z' ? 1 : 0, abonnee ? 1 : 0];
}

// ---- kiezen ----
function gewogen(lijst, gewichten, r) { const som = gewichten.reduce((a, b) => a + b, 0); if (!(som > 0)) return lijst[Math.floor(r * lijst.length)]; let acc = 0; const h = r * som; for (let i = 0; i < lijst.length; i++) { acc += gewichten[i]; if (h < acc) return lijst[i]; } return lijst[lijst.length - 1]; }
export function kiesArm(m, { seg, abonnee, id, x }) {
  const terug = seg.endsWith('-t'), armen = m.alleArmen || m.armen;
  const geschikt = armen.filter(a => (a.wie === 'alle' || (a.wie === 'terug') === terug) && !(abonnee && a.soort === 'email'));
  if (!geschikt.length) return { arm: null };
  const ctrl = geschikt.filter(a => a.soort === 'geen');
  // de controlegroep krijgt altijd minstens 'controle' (per bezoeker vast), zodat zichtbaar blijft wat de modal kost
  const r = createHash('sha256').update(id + '|' + m.site + '|ctrl').digest().readUInt32BE(0) / 4294967296;
  if (ctrl.length && r < m.controle) return { arm: ctrl[0], hoe: 'controle' };
  const mdl = m.modus === 'leer' && m.model && m.model.arms ? m.model.arms : null;
  const metModel = mdl ? geschikt.filter(a => mdl[a.id]) : [];
  if (metModel.length >= 2) {
    // lineaire Thompson: armen zonder eigen model krijgen het model van hun soort (van alle sites), anders een optimistische gok
    const pool = m.model.pool || {};
    let best = null, bs = -Infinity;
    for (const a of geschikt) { const md = mdl[a.id] || pool[armType(a)]; const s = md ? trek(md, x) : Math.random() * 3; if (s > bs) { bs = s; best = a; } }
    return { arm: best, hoe: 'model' };
  }
  const geleerd = m.modus === 'leer' && m.leer ? (m.leer[seg] || m.leer['*']) : null;
  const gw = geschikt.map(a => Math.max(0, geleerd && geleerd[a.id] != null ? N(geleerd[a.id]) : N(a.gewicht)));
  return { arm: gewogen(geschikt, gw, Math.random()), hoe: geleerd ? 'segment' : 'verdeling' };
}
function kiesMoment(m, a) {
  if (a.moment && a.moment !== 'leer') return a.moment;
  const w = m.momLeer || {}; return gewogen(MOMENTEN, MOMENTEN.map(k => (w[k] != null ? N(w[k]) : 1)), Math.random());
}
function variantenVan(m, a) { const v = ((m.varianten || {})[a.id] || []).filter(x => !x.uit); return [{ vid: 'v0', titel: a.titel, tekst: a.tekst, knop: a.knop }].concat(v); }
function kiesVariant(m, a) { const vs = variantenVan(m, a), w = (m.varLeer || {})[a.id] || {}; return gewogen(vs, vs.map(v => (w[v.vid] != null ? N(w[v.vid]) : 1)), Math.random()); }

// ---- beslissing voor één paginabezoek ----
export async function modalBeslis(kv, { site, pid, q, mmc, v, mob, abo, test, origin, land, net, ref, uur, hist, zone, kw, geo }) {
  let m = await leesModal(kv, site);
  const ctx = vulCtx(geo, kw);
  // Duitstalig: alleen met dubbele bevestiging; de directe todayin-aanmelding (zonder bevestiging vooraf) dan niet aanbieden
  if (m && /^(de|at|ch)$/i.test(String(land || '')) && (m.alleArmen || m.armen).some(a => a.doel === 'todayin')) m = { ...m, alleArmen: (m.alleArmen || m.armen).filter(a => a.doel !== 'todayin') };
  if (!m) return { toon: false, reden: 'onbekende site' };
  let oHost = ''; try { oHost = origin ? new URL(origin).hostname.toLowerCase() : ''; } catch (e) {}
  if (oHost && !m.domeinen.some(d => oHost === d || oHost.endsWith('.' + d))) return { toon: false, reden: 'domein hoort niet bij deze site' };
  if (test) {
    const [tid, tv] = String(test).toLowerCase().split('~'); const a = (m.alleArmen || m.armen).find(x => x.id === tid);
    if (!a) return { toon: false, reden: 'onbekende arm', armen: (m.alleArmen || m.armen).map(x => x.id) };
    const vs = a.soort === 'geen' ? [] : variantenVan(m, a), vv = vs.find(x => x.vid === tv) || vs[0];
    return { toon: a.soort !== 'geen', test: true, mid: '', min: 0, arm: openbaar(a, m, { cid: '', moment: 'tijd:1', variant: vv, ctx }) };
  }
  if (m.uit) return { toon: false, reden: 'uit' };
  let k = null; if (/^[0-9a-f]{8,24}$/.test(String(mmc || ''))) k = Object.fromEntries(paren(await kv.raw(['HGETALL', 'mm:cid:' + mmc]).catch(() => null)));
  if (!pid && k && k.pid) pid = k.pid;
  const id = pid || (/^[0-9a-f]{16}$/.test(String(q || '')) ? 'q' + q : '');
  if (!id) return { toon: false, reden: 'geen bezoekers-id' };
  let p = null; if (pid && !pid.startsWith('q')) p = Object.fromEntries(paren(await kv.raw(['HGETALL', 'mm:p:' + pid]).catch(() => null)));
  const soort = soortPersoon(p && Object.keys(p).length ? p : null);
  const terug = N(v) > 1 || N(p && p.n) > 1, seg = (mob ? 'm' : 'd') + '-' + (terug ? 't' : 'n');
  const abonnee = !!(abo || soort.has('abonnee'));
  const capOk = String(await kv.raw(['SET', 'mm:mqc:' + m.site + ':' + id, '1', 'NX', 'EX', Math.round(m.cap * 3600)])) === 'OK';
  if (!capOk) return { toon: false, reden: 'al gezien binnen ' + m.cap + ' uur' };
  const netNu = (k && k.net && k.net !== '-') ? k.net : String(net || '').toLowerCase().slice(0, 20), zoneNu = (k && k.zone && k.zone !== '-') ? k.zone : String(zone || '').slice(0, 40);
  const zq = netNu && zoneNu ? String((await kv.raw(['HGET', 'mm:zq', netNu + '|' + zoneNu]).catch(() => '')) || '') : '';
  const x = kenmerken({ mob, terug, net: netNu, ref, uur, land, hist, zq, abonnee });
  const { arm: a, hoe } = kiesArm(m, { seg, abonnee, id, x });
  if (!a) return { toon: false, reden: 'geen arm voor deze bezoeker' };
  const mom = a.soort === 'geen' ? '' : kiesMoment(m, a), vr = a.soort === 'geen' ? null : kiesVariant(m, a);
  const mid = nieuwId(6), D = dag(), md = 'mm:md:' + D, pre = m.site + '|';
  const cmds = [
    ['HSET', 'mm:cid:' + mid, 't', Date.now(), 'pid', id, 'wissel', '', 'modal', m.site, 'arm', a.id, 'seg', seg, 'mom', mom, 'var', vr ? vr.vid : '', 'net', netNu || '-', 'zone', zoneNu || '-', 'camp', (k && k.camp) || '-', 'tag', '', 'van', mmc || '', 'land', land || '', 'stad', ctx.stad, 'rg', ctx.rg, 'cc', ctx.cc, 'lat', ctx.lat, 'lon', ctx.lon, 'kw', ctx.kw],
    ['EXPIRE', 'mm:cid:' + mid, T.cid],
    ['HINCRBY', md, pre + a.id + '|' + seg + '|n', 1], ['EXPIRE', md, T.teller],
    ['RPUSH', 'mm:mdl:' + D, JSON.stringify({ mid, s: m.site, a: a.id, ty: armType(a), m: mom, v: vr ? vr.vid : '', x, t: Date.now(), hoe })], ['EXPIRE', 'mm:mdl:' + D, T.log]
  ];
  if (mom) cmds.push(['HINCRBY', md, pre + '@' + mom + '|*|n', 1]);
  if (vr) cmds.push(['HINCRBY', md, pre + a.id + '~' + vr.vid + '|*|n', 1]);
  await Promise.all(cmds.map(c => kv.raw(c)));
  return { toon: a.soort !== 'geen', mid, min: m.minSec, arm: openbaar(a, m, { cid: mid, moment: mom, variant: vr, ctx }) };
}
// wat de browser van een arm te zien krijgt (geen gewichten of notities)
function openbaar(a, m, { cid, moment, variant, ctx }) {
  if (a.soort === 'geen') return { id: a.id, soort: 'geen' };
  const v = variant || { titel: a.titel, tekst: a.tekst, knop: a.knop }, c = ctx || vulCtx();
  const o = { id: a.id, soort: a.soort, moment: moment || 'exit', titel: vul(v.titel, c, m.taal), tekst: vul(v.tekst, c, m.taal), knop: vul(v.knop, c, m.taal), nee: a.nee, taal: m.taal };
  if (a.soort === 'site') { const u = new URL(a.url.replace(/\{([a-z]+)\}/g, (x, k) => encodeURIComponent(k === 'cid' ? cid : k === 'site' ? m.site : k === 'arm' ? a.id : ''))); u.searchParams.set('mmc', cid || 'test'); o.href = u.href; }
  if (a.soort === 'email') { o.veld = a.veld; o.klein = vul(a.klein, c, m.taal); o.dank = vul(a.dank, c, m.taal); o.doel = a.doel; }
  return o;
}
// Ingevuld per bezoeker (Henkjan 14 okt: "met informatie uit de browser ingevuld"): {stad} = plaats van het IP-adres, {interesse} = waar de pagina over gaat
// (data-interest op de scriptregel of <meta name="cm-interest">). [[ ... ]] valt weg als er een lege plek in staat.
export function vulCtx(geo, kw) {
  const g = geo || {}, schoon = (x, n) => String(x || '').replace(/[<>"{}\[\]]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
  const interesse = schoon(kw, 60).replace(/\b(best|top|which|to buy|buying guide|review[s]?|20\d\d|for (men|women)|vs\.?)\b/gi, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  return { stad: schoon(g.stad, 60), rg: schoon(g.rg, 10), cc: schoon(g.cc, 2).toUpperCase(), lat: /^-?\d{1,3}(\.\d+)?$/.test(String(g.lat || '')) ? String(g.lat) : '', lon: /^-?\d{1,3}(\.\d+)?$/.test(String(g.lon || '')) ? String(g.lon) : '', kw: interesse.length >= 3 ? interesse : '' };
}
export function vul(t, c, taal) {
  if (!t || t.indexOf('{') < 0) return t;
  const w = { stad: c.stad || '', interesse: c.kw || '' };
  t = String(t).replace(/\[\[([\s\S]*?)\]\]/g, (x, deel) => (/\{(stad|interesse)\}/.test(deel) && deel.match(/\{(stad|interesse)\}/g).some(p => !w[p.slice(1, -1)]) ? '' : deel));
  const weg = { stad: taal === 'de' ? 'deinem Ort' : taal === 'nl' ? 'jouw plaats' : 'your town', interesse: taal === 'de' ? 'deine Themen' : taal === 'nl' ? 'jouw onderwerpen' : 'what you follow' };
  return t.replace(/\{(stad|interesse)\}/g, (x, k) => w[k] || weg[k]).replace(/\s+([,.!?])/g, '$1').replace(/\s{2,}/g, ' ').trim();
}

// ---- gebeurtenis bij een beslissing (eenmaal per beslissing en soort) ----
export async function modalEv(kv, { mid, e }) {
  mid = String(mid || ''); e = String(e || '');
  if (!/^[0-9a-f]{12}$/.test(mid) || !EVENTS.includes(e)) return { ok: false, fout: 'mid of e' };
  const k = Object.fromEntries(paren(await kv.raw(['HGETALL', 'mm:cid:' + mid])));
  if (!k.modal) return { ok: false, fout: 'onbekende beslissing' };
  if (String(await kv.raw(['SET', 'mm:mu:' + mid + ':' + e, '1', 'NX', 'EX', T.cid])) !== 'OK') return { ok: true, dubbel: true };
  await Promise.all(modalTellers(k, mid, e).map(c => kv.raw(c)));
  return { ok: true };
}
// tellers voor arm, segment, moment en variant, plus de gebeurtenis per beslissing voor het model (ook gebruikt door uitkomst() in wissel.js)
export function modalTellers(k, mid, e) {
  const D = new Date(N(k.t) || Date.now()).toISOString().slice(0, 10), md = 'mm:md:' + D, pre = k.modal + '|';
  const c = [['HINCRBY', md, pre + k.arm + '|' + (k.seg || 'm-n') + '|' + e, 1], ['EXPIRE', md, T.teller], ['HSET', 'mm:mdv:' + D, mid + '|' + e, 1], ['EXPIRE', 'mm:mdv:' + D, T.log]];
  if (k.mom) c.push(['HINCRBY', md, pre + '@' + k.mom + '|*|' + e, 1]);
  if (k.var) c.push(['HINCRBY', md, pre + k.arm + '~' + k.var + '|*|' + e, 1]);
  return c;
}

// ---- e-mail uit de modal ----
const MAIL = /^[^\s@<>()[\],;:"]{1,64}@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}$/i;
export async function modalMail(kv, { mid, email, bewaar, ipNet, land }) {
  mid = String(mid || ''); email = String(email || '').trim().toLowerCase();
  if (!/^[0-9a-f]{12}$/.test(mid)) return { ok: false, fout: 'mid' };
  if (email.length > 254 || !MAIL.test(email)) return { ok: false, fout: 'e-mailadres klopt niet' };
  const rl = 'mm:mailrl:' + createHash('sha256').update(String(ipNet || '')).digest('hex').slice(0, 16);
  if (N(await kv.raw(['INCR', rl])) > 5) return { ok: false, fout: 'te veel aanmeldingen vanaf dit adres, probeer het later' };
  await kv.raw(['EXPIRE', rl, 3600]);
  const k = Object.fromEntries(paren(await kv.raw(['HGETALL', 'mm:cid:' + mid])));
  if (!k.modal) return { ok: false, fout: 'onbekende beslissing' };
  const m = await leesModal(kv, k.modal); const a = m && (m.alleArmen || m.armen).find(x => x.id === k.arm);
  if (!a || a.soort !== 'email') return { ok: false, fout: 'deze beslissing was geen e-mailaanbod' };
  if (a.doel === 'todayin') { // meteen aanmelden bij todayin.email: nieuws uit de eigen plaats plus het onderwerp van de pagina (Henkjan 14 okt)
    const r = await todayinAanmelden({ email, k, site: k.modal }).catch(e => ({ ok: false, fout: String(e && e.message || e).slice(0, 120) }));
    try { await kv.raw(['LPUSH', 'mm:tilog', JSON.stringify({ t: new Date().toISOString(), site: k.modal, arm: k.arm, ok: r.ok, status: r.status || null, plaats: !!k.stad, onderwerp: k.kw || '', fout: r.fout || null })]); await kv.raw(['LTRIM', 'mm:tilog', 0, 199]); } catch (e) {}
    if (!r.ok) return { ok: false, fout: r.fout || 'Something went wrong. Please try again.' };
    await uitkomst(kv, { cid: mid, soort: 'aanmelding', bron: 'modal:' + k.modal + ':todayin' });
    return { ok: true, eigenLijst: true, todayin: true };
  }
  if (bewaar !== false && a.doel === 'bewaar') {
    const oud = await kv.raw(['HGET', 'mm:mail:' + a.lijst, email]);
    if (!oud) await kv.raw(['HSET', 'mm:mail:' + a.lijst, email, JSON.stringify({ t: new Date().toISOString(), site: k.modal, arm: k.arm, net: k.net, zone: k.zone, camp: k.camp, land: land || k.land || '', toestemming: a.titel + ' | ' + a.knop + ' | ' + a.klein, bevestigd: false })]);
  }
  await uitkomst(kv, { cid: mid, soort: 'aanmelding', bron: 'modal:' + k.modal });
  return { ok: true, eigenLijst: bewaar === false || a.doel !== 'bewaar' };
}

// Aanmelden via het gewone formulier van todayin.email (site/api/_ti.js POST): plaats uit het IP-adres, onderwerp als niche.
// src=clickmind (eigen verkeer, geen postback), campaign=cm-<site>. Lukt de plaats niet, dan nog eens op coordinaten.
export async function todayinAanmelden({ email, k, site }) {
  const URL_TI = (process.env.TODAYIN_URL || 'https://todayin.email').replace(/\/$/, '') + '/api/ti';
  const stuur = async (metPlaats) => {
    const f = new URLSearchParams({ email, src: 'clickmind', campaign: 'cm-' + String(site || '').slice(0, 30), ts: String(Math.max(2000, Math.min(36e5, Date.now() - N(k.t)))), website: '' });
    if (metPlaats && k.stad) { f.set('place', k.stad); f.set('ipcity', k.stad); }
    if (k.cc) f.set('cc', String(k.cc).toLowerCase()); if (k.rg) f.set('rg', k.rg); if (k.lat && k.lon) { f.set('lat', k.lat); f.set('lon', k.lon); }
    if (k.kw) f.set('niche', k.kw);
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 15000);
    try { const r = await fetch(URL_TI, { method: 'POST', body: f, headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'Clickmind/1 (+https://whichtobuy.best)' }, redirect: 'manual', signal: ac.signal }); const h = await r.text().catch(() => ''); return { status: r.status, h }; }
    finally { clearTimeout(t); }
  };
  let r = await stuur(true);
  if (r.status === 400 && /Place not found|couldn.t find that place/i.test(r.h) && k.lat && k.lon) r = await stuur(false);
  if (r.status === 200) return { ok: true, status: 200 };
  const fout = /does not look right|could not use that email/i.test(r.h) ? 'That email address can\u2019t receive mail. Typo?' : /Place not found|couldn.t find that place/i.test(r.h) ? 'We couldn\u2019t find your town. Please try again later.' : 'Something went wrong. Please try again.';
  return { ok: false, status: r.status, fout };
}

// ---- stand: per arm (en segment), per moment en per variant ----
const leeg = () => Object.fromEntries(VELDEN.map(v => [v, 0]));
async function tellers(kv, site, dagen) {
  const D = Array.from({ length: Math.max(1, Math.min(60, dagen)) }, (_, i) => dag(-i));
  const hs = await Promise.all(D.map(d => kv.raw(['HGETALL', 'mm:md:' + d]).catch(() => null)));
  const t = {};
  for (const h of hs) for (const [f, v] of paren(h)) { const p = f.split('|'); if (p[0] !== site || !VELDEN.includes(p[3])) continue; const s = (t[p[1]] || (t[p[1]] = {})); const r = (s[p[2]] || (s[p[2]] = leeg())); r[p[3]] += N(v); }
  return t;
}
const waardeVan = (x, w) => VELDEN.reduce((s, e) => s + (w[e] ? N(x[e]) * w[e] : 0), 0);
export async function modalStand(kv, m, dagen = 14) {
  const t = await tellers(kv, m.site, dagen), w = m.waarde || WAARDE, armen = m.alleArmen || m.armen;
  const som = s => { const r = leeg(); for (const x of Object.values(s || {})) for (const v of VELDEN) r[v] += N(x[v]); return r; };
  const ctrl = armen.filter(a => a.soort === 'geen').map(a => som(t[a.id])), cn = ctrl.reduce((s, x) => s + x.n, 0), ch = ctrl.reduce((s, x) => s + x.hoofd, 0);
  const hoofdCtrl = cn ? ch / cn : null;
  const per1000 = x => (x.n ? Math.round(waardeVan(x, w) / x.n * 1000) / 100 : null);
  const rijen = armen.map(a => { const x = som(t[a.id]); const segs = {}; for (const s of SEGMENTEN) segs[s] = (t[a.id] || {})[s] || leeg(); segs['*'] = x;
    return { id: a.id, soort: a.soort, ...x, pctToon: x.n ? Math.round(x.toon / x.n * 1000) / 10 : null, pctKlik: x.toon ? Math.round(x.klik / x.toon * 1000) / 10 : null, pctHoofd: x.n ? Math.round(x.hoofd / x.n * 1000) / 10 : null,
      hoofdTegenControle: x.n && hoofdCtrl != null && a.soort !== 'geen' ? Math.round((x.hoofd / x.n - hoofdCtrl) * 1000) / 10 : null, dollarPer1000: per1000(x), segmenten: segs }; });
  const momenten = MOMENTEN.map(k => { const x = (t['@' + k] || {})['*'] || leeg(); return { moment: k, ...x, dollarPer1000: per1000(x) }; });
  const varianten = {};
  for (const a of armen) if (a.soort !== 'geen') varianten[a.id] = variantenVan(m, a).map(v => { const x = (t[a.id + '~' + v.vid] || {})['*'] || leeg(); return { vid: v.vid, titel: v.titel, bron: v.bron || 'start', ...x, pctKlik: x.toon ? Math.round(x.klik / x.toon * 1000) / 10 : null }; });
  return Object.assign(rijen, { momenten, varianten });
}

// ---- Thompson op waarde (tellers): per trekking per gebeurtenis een beta, maal de waarde ----
export function thompsonWaarde(rijen, waarde, { verken = 0.1, trekkingen = 3000 } = {}) {
  if (!rijen.length) return {};
  // alleen gebeurtenissen die al eens voorkwamen: een zeldzame dure gebeurtenis zonder enige meting is anders pure ruis
  const ev = Object.keys(waarde).filter(e => waarde[e] && rijen.some(x => N(x[e]) > 0)), winst = rijen.map(() => 0);
  for (let i = 0; i < trekkingen; i++) {
    let best = -1, bi = 0;
    rijen.forEach((x, j) => { let v = 0; for (const e of ev) v += beta(1 + N(x[e]), 1 + Math.max(0, N(x.n) - N(x[e]))) * waarde[e]; if (v > best) { best = v; bi = j; } });
    winst[bi]++;
  }
  const k = rijen.length, vloer = Math.min(verken / k, 1 / k), rest = 1 - vloer * k;
  return Object.fromEntries(rijen.map((x, j) => [x.id, Math.round((vloer + rest * winst[j] / trekkingen) * 1000) / 10]));
}
// kans dat de gewone-klikratio van a lager ligt dan die van b
function kansLager(a, b, n = 2000) { let c = 0; for (let i = 0; i < n; i++) if (beta(1 + a.hoofd, 1 + a.n - a.hoofd) < beta(1 + b.hoofd, 1 + b.n - b.hoofd)) c++; return c / n; }

// ---- beslissingen en hun gebeurtenissen van de laatste dagen (voor het model) ----
async function leesLog(kv, dagen = 7, max = 60000) {
  const rijen = [], ev = new Map();
  for (let i = 0; i < dagen && rijen.length < max; i++) {
    const D = dag(-i), len = N(await kv.raw(['LLEN', 'mm:mdl:' + D]).catch(() => 0));
    for (let van = Math.max(0, len - 20000); van < len && rijen.length < max; van += 5000) {
      const l = (await kv.raw(['LRANGE', 'mm:mdl:' + D, van, van + 4999]).catch(() => [])) || [];
      for (const s of l) { try { rijen.push(JSON.parse(s)); } catch (e) {} }
    }
    for (const [f] of paren(await kv.raw(['HGETALL', 'mm:mdv:' + D]).catch(() => null))) { const [mid, e] = f.split('|'); const s = ev.get(mid) || new Set(); s.add(e); ev.set(mid, s); }
  }
  return { rijen: rijen.filter(r => Array.isArray(r.x) && r.x.length === FEAT.length), ev };
}

// ---- de leerronde (elk uur): model per arm, moment, varianten, rem, nieuwe teksten ----
export async function modalLeer(kv, { droog = false, claude = null } = {}) {
  const uit = [], modals = await alleModals(kv), cat = await catalogus(kv);
  const { rijen, ev } = await leesLog(kv, 7);
  const waardeRij = (r, w) => { const s = ev.get(r.mid); if (!s) return 0; let v = 0; for (const e of s) v += N(w[e]); return v; };
  // 1. modellen per soort arm over alle sites (lenen voor sites en armen met weinig data)
  const pool = {}, perType = {};
  for (const r of rijen) (perType[r.ty] || (perType[r.ty] = [])).push(r);
  for (const [ty, rr] of Object.entries(perType)) if (rr.length >= 30) pool[ty] = fit(rr.map(r => r.x), rr.map(r => waardeRij(r, WAARDE)), { lam: 15 });
  let claudeBudget = 3;
  for (const m0 of modals) {
    const m = { ...m0, alleArmen: alleArmen(m0, m0.catalogus ? cat : null) };
    const st = await modalStand(kv, m, 14), w = m.waarde || WAARDE;
    const r = { site: m.site, modus: m.modus, uit: m.uit, beslissingen: st.reduce((s, x) => s + x.n, 0), dollarPer1000: Object.fromEntries(st.map(x => [x.id, x.dollarPer1000])), modelArmen: 0, rem: [], nieuweTekst: [] };
    const patch = {};
    if (m.modus === 'leer') {
      // 2. contextueel model per arm (minstens 30 beslissingen), met als vertrekpunt het model van zijn soort
      const arms = {}, eigenRijen = rijen.filter(x => x.s === m.site);
      for (const a of m.alleArmen) { const rr = eigenRijen.filter(x => x.a === a.id); if (rr.length >= 30) { const ty = armType(a); arms[a.id] = fit(rr.map(x => x.x), rr.map(x => waardeRij(x, w)), { lam: 25, mu0: pool[ty] ? pool[ty].mu : null }); } }
      r.modelArmen = Object.keys(arms).length;
      patch.model = { arms, pool, feat: FEAT, at: new Date().toISOString() };
      // 3. gewichten per segment (terugval als er nog geen model is)
      if (r.beslissingen >= 50) { const leer = { '*': thompsonWaarde(st.map(x => ({ id: x.id, ...x.segmenten['*'] })), w, { verken: m.verken }) }; for (const s of SEGMENTEN) { const rr = st.map(x => ({ id: x.id, ...x.segmenten[s] })); if (rr.reduce((t, x) => t + x.n, 0) >= 200) leer[s] = thompsonWaarde(rr, w, { verken: m.verken }); } patch.leer = leer; }
      // 4. moment en tekstvarianten
      if (st.momenten.reduce((s, x) => s + x.n, 0) >= 60) patch.momLeer = thompsonWaarde(st.momenten.map(x => ({ id: x.moment, ...x })), w, { verken: 0.15 });
      const varLeer = {}, varianten = JSON.parse(JSON.stringify(m.varianten || {}));
      for (const [aid, vs] of Object.entries(st.varianten)) {
        if (vs.reduce((s, x) => s + x.n, 0) < 40) continue;
        const kans = thompsonWaarde(vs.map(x => ({ id: x.vid, ...x })), { klik: 2, echt: 0.3, actie: 1, aanmelding: 70, koop: 300 }, { verken: 0.2 }); varLeer[aid] = kans;
        // verliezers eruit: veel vertoond en bijna geen kans meer om de beste te zijn (de start-tekst v0 blijft altijd)
        const actief = (varianten[aid] || []).filter(v => !v.uit);
        for (const v of actief) { const x = vs.find(y => y.vid === v.vid); if (x && x.toon >= 300 && N(kans[v.vid]) < 3 && actief.filter(y => !y.uit).length > 1) { v.uit = true; v.uitAt = new Date().toISOString(); } }
      }
      patch.varLeer = varLeer; patch.varianten = varianten;
      // 5. automatische rem: kost de arm aantoonbaar de gewone klik en levert hij minder op dan niets tonen, dan 7 dagen uit
      const ctrl = st.filter(x => x.soort === 'geen').reduce((s, x) => ({ n: s.n + x.n, hoofd: s.hoofd + x.hoofd, waarde: s.waarde + waardeVan(x, w) }), { n: 0, hoofd: 0, waarde: 0 });
      const rem = { ...(m.rem || {}) };
      for (const x of st) if (x.soort !== 'geen' && x.n >= 300 && ctrl.n >= 100 && !rem[x.id]) { const p = kansLager(x, ctrl); if (p > 0.975 && waardeVan(x, w) / x.n < ctrl.waarde / ctrl.n) { rem[x.id] = { at: new Date().toISOString(), reden: 'kost de gewone klik (' + x.pctHoofd + '% tegen ' + Math.round(ctrl.hoofd / ctrl.n * 1000) / 10 + '%) en levert minder op dan niets tonen' }; r.rem.push(x.id); } }
      for (const [id, x] of Object.entries(rem)) if (Date.now() - Date.parse(x.at) > 7 * 864e5) delete rem[id]; // na 7 dagen opnieuw proberen
      patch.rem = rem;
      // 6. Claude schrijft een nieuwe uitdager voor armen met genoeg vertoningen (hoogstens 1 per arm per dag)
      if (claude && m.claude && !m.uit) {
        for (const a of m.alleArmen) {
          if (claudeBudget <= 0 || a.soort === 'geen') break;
          const vs = st.varianten[a.id] || [], getoond = vs.reduce((s, x) => s + x.toon, 0), actief = (varianten[a.id] || []).filter(v => !v.uit).length + 1;
          const laatst = ((m.claudeAt || {})[a.id]) || 0;
          if (getoond < 150 || actief >= 4 || Date.now() - laatst < 864e5) continue;
          const best = vs.slice().sort((p, q) => N((varLeer[a.id] || {})[q.vid]) - N((varLeer[a.id] || {})[p.vid]))[0];
          const bron = variantenVan(m, a).find(v => v.vid === (best && best.vid)) || variantenVan(m, a)[0];
          claudeBudget--;
          try {
            const nieuw = await claude(
              'You write the copy for a small, honest pop-up box on a website. It offers the visitor one thing: ' + (a.soort === 'email' ? 'an email signup' : 'a link to another website') + '. Language: ' + ({ en: 'English', de: 'German', nl: 'Dutch' }[m.taal] || 'English') + '. Rules: plain words, no hype, no fake urgency, no prizes, no "free gift", never mention Amazon, no exclamation marks in the title, no claims that are not in the original.' + (a.doel === 'todayin' ? ' The offer is a free daily local news email from todayin.email. Keep the placeholders {stad} (the visitor\'s town) and {interesse} (the topic of the page) exactly as written, and keep the [[ ]] brackets around optional parts.' : '') + ' Title max 60 characters, text max 140, button max 30. Answer only JSON {"titel":"","tekst":"","knop":""}.',
              'Site: ' + m.site + '. Offer: ' + (a.url || a.lijst || '') + '.\nBest copy so far (' + (best ? best.toon + ' shown, ' + best.klik + ' clicked' : 'no data') + '):\nTitle: ' + bron.titel + '\nText: ' + bron.tekst + '\nButton: ' + bron.knop + '\nWrite one new version that could get more people to click, with a different angle.',
              { fast: true, max: 300, fn: 'clickmind-modal' });
            const ruw = String(nieuw.txt).replace(/```(?:json)?/g, ''), j = JSON.parse(ruw.slice(ruw.indexOf('{'), ruw.lastIndexOf('}') + 1));
            const v = { vid: 'v' + Date.now().toString(36).slice(-5), titel: tekst(j.titel, 80), tekst: tekst(j.tekst, 240), knop: tekst(j.knop, 40), bron: 'claude', at: new Date().toISOString() };
            if (v.titel && v.knop && !VERBODEN.test(v.titel + ' ' + v.tekst + ' ' + v.knop)) { (varianten[a.id] || (varianten[a.id] = [])).push(v); patch.claudeAt = { ...(patch.claudeAt || m.claudeAt || {}), [a.id]: Date.now() }; r.nieuweTekst.push(a.id + ': ' + v.titel); }
          } catch (e) { r.claudeFout = String(e && e.message || e).slice(0, 120); }
        }
        patch.varianten = varianten;
      }
      if (!droog) { const vers = await kv.get('mm:modal:' + m.site); if (vers) { Object.assign(vers, patch, { leerAt: new Date().toISOString() }); await kv.set('mm:modal:' + m.site, vers); CACHE.delete(m.site); } }
    }
    uit.push(r);
  }
  return uit;
}
