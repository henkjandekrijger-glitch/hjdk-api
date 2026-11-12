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
// gebeurtenissen uit de browser (eenmaal per beslissing): toon, klik, sluit, hoofd (gewone klik naar buiten), veld (in het e-mailveld getikt),
// typ (begon te typen), koop (betaald binnen 7 dagen na de beslissing, ook bij de controlegroep; bedankpagina met data-cm-betaald)
import { KEUZES as CHAT_KEUZES } from './kadolykeuzes.js';
export const EVENTS = ['toon', 'klik', 'sluit', 'hoofd', 'veld', 'typ', 'koop', 'mand', 'kassa', 'bewust', 'verder']; // mand/kassa/bewust (10 nov, Henkjan: "de trechter is er daar kun je toch al op leren en sturen met de modal"): na de beslissing op Nu kopen getikt, afrekenpagina open, 20 s of een veld op de afrekenpagina
export const VELDEN = ['n', 'toon', 'klik', 'sluit', 'hoofd', 'veld', 'typ', 'echt', 'actie', 'aanmelding', 'bevestigd', 'mand', 'kassa', 'bewust', 'koop', 'verder'];
// verder (11 nov, Henkjan: "Maak modal extreeem lerend maar zorg ook dat je geen klanten weg jaagt !!"): de bezoeker opent binnen 30 minuten na de
// beslissing nog een pagina van de site. Telt ook bij de controlegroep. Een dicht signaal (veel vaker dan Nu kopen), dus het model leert sneller,
// en een versie die mensen wegjaagt verliest erop. Standaard waarde 0; een site zet het aan met waarde.verder (Kadoly: 1).
export const MOMENTEN = ['exit', 'tijd:12', 'tijd:25', 'tijd:45', 'scroll:50', 'scroll:80'];
// VORMEN (Henkjan 5 nov 2026: "Mijn modal moet overal kunnen staan en iedere vorm aannemen"): midden = kaart in het midden (op een telefoon
// van onderen), onder = kaart van onderen, hoek = kaartje in de hoek zonder donkere achtergrond, balk = smalle balk boven of onder,
// blok = in de pagina zelf op een plek <div data-cm-plek="naam">, vol = hele scherm. De vorm leert per apparaat, net als het moment.
export const VORMEN = ['midden', 'onder', 'hoek', 'balk', 'blok', 'vol'];
const VORMEN_OUD = ['midden']; // een site zonder eigen keuze houdt de vorm van voor 5 nov (midden, op een telefoon van onderen); andere vormen alleen op Henkjans woord
const WAARDE = { hoofd: 1, klik: 2, veld: 0, typ: 0, echt: 0.3, actie: 1, aanmelding: 70, bevestigd: 0, mand: 8, kassa: 1, bewust: 20, koop: 300, verder: 0 };
// kenmerken voor het contextuele model (volgorde ligt vast; nieuwe kenmerken komen achteraan, oude beslissingen krijgen daar 0)
// v2 (5 nov): product (productpagina), intern (al op de site rondgeklikt), social (van social media), warm (tikte deze sessie op kopen)
export const FEAT = ['bias', 'mob', 'terug', 'betaald', 'propeller', 'mondiad', 'anderNet', 'zoek', 'nacht', 'ochtend', 'avond', 'us', 'dach', 'nlbe', 'gezien', 'geklikt', 'zoneMens', 'zoneSlecht', 'abonnee', 'product', 'intern', 'social', 'warm'];
// Alleen eigen domeinen, nooit Amazon (een Amazon-link in een pop-up is riskant voor het Associates-account)
const EIGEN = /^(?:[a-z0-9-]+\.)*(todayin\.email|finds\.email|mylevel\.today|whichtobuy\.best|kaufberater\.best|keuzehulp\.best|outname\.now|yoo\.rs|yoors\.shop|kadoly\.com|praisy\.me|moonlighter\.email|nexy\.help)$/i;
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
    const wie = ['alle', 'nieuw', 'terug', 'kassa'].includes(a.wie) ? a.wie : 'alle'; // kassa: alleen wie de afgelopen 7 dagen op de afrekenpagina was en niet betaalde
    if (a.soort === 'geen') { armen.push({ id, soort: 'geen', gewicht, wie }); continue; }
    const moment = MOMENTEN.includes(a.moment) ? a.moment : 'leer';
    const vorm = VORMEN.includes(a.vorm) ? a.vorm : 'leer', plek = /^[a-z0-9-]{1,30}$/.test(String(a.plek || '')) ? String(a.plek) : undefined;
    if (a.beeld && !siteUrlOk(a.beeld)) return f('arm ' + id + ': beeld moet een https-adres op een eigen domein zijn');
    const paginas = Array.isArray(a.paginas) ? a.paginas.map(x => String(x).toLowerCase()).filter(x => /^[a-z]{2,12}$/.test(x)).slice(0, 6) : undefined;
    const basis = { id, soort: a.soort, gewicht, wie, paginas, moment, vorm, plek, beeld: a.beeld ? String(a.beeld).slice(0, 400) : undefined, titel: tekst(a.titel, 80), tekst: tekst(a.tekst, 240), knop: tekst(a.knop, 40), nee: tekst(a.nee || (c.taal === 'de' ? 'Nein danke' : c.taal === 'nl' ? 'Nee, dank je' : 'No thanks'), 40), notitie: a.notitie ? tekst(a.notitie, 200) : undefined };
    if (!basis.titel || !basis.knop) return f('arm ' + id + ': titel en knop zijn nodig');
    if (VERBODEN.test(basis.titel + ' ' + basis.tekst + ' ' + basis.knop)) return f('arm ' + id + ': verboden woord (geen Amazon, geen valse haast of beloning)');
    if (a.soort === 'site') {
      if (!siteUrlOk(a.url)) return f('arm ' + id + ': url moet https zijn en naar een eigen site gaan (nooit Amazon)');
      armen.push({ ...basis, url: String(a.url).slice(0, 600) });
    } else if (a.soort === 'email') {
      const lijst = String(a.lijst || site).toLowerCase(); if (!/^[a-z0-9-]{2,30}$/.test(lijst)) return f('arm ' + id + ': lijst 2-30 tekens');
      const doel = ['moonlighter', 'eigen', 'bewaar', 'todayin', 'kadoly'].includes(a.doel) ? a.doel : 'bewaar';
      armen.push({ ...basis, lijst, doel, veld: tekst(a.veld || (c.taal === 'de' ? 'Ihre E-Mail' : c.taal === 'nl' ? 'Je e-mailadres' : 'Your email'), 40), klein: tekst(a.klein || 'Unsubscribe anytime. We never share your email.', 160), dank: tekst(a.dank || 'Thanks! Check your inbox.', 120) });
    } else if (a.soort === 'chat') { // chat in de modal (11 nov): tikknoppen met vaste antwoorden, eigen vraag naar Claude, WhatsApp-knop (lib/kadolychat.js)
      const corpus = String(a.corpus || 'kadoly').toLowerCase(); if (corpus !== 'kadoly') return f('arm ' + id + ': corpus kadoly');
      const wa = String(a.wa || '').replace(/\D/g, ''); if (wa && !/^\d{8,15}$/.test(wa)) return f('arm ' + id + ': wa = telefoonnummer met landcode, alleen cijfers');
      armen.push({ ...basis, corpus, wa, veld: tekst(a.veld || 'Typ je vraag', 40) });
    } else if (a.soort === 'knop') { // knop op de pagina zelf: de eigen koopknop indrukken, naar een blok scrollen of terug naar de afrekenpagina (geen mail, geen andere site)
      const doelKnop = String(a.doelKnop || '').toLowerCase(); if (!/^(koop|kassa|[a-z0-9-]{2,30})$/.test(doelKnop)) return f('arm ' + id + ': doelKnop koop, kassa of de naam van een blok (data-cm-zicht)');
      armen.push({ ...basis, doelKnop });
    } else return f('arm ' + id + ': soort moet email, site, knop, chat of geen zijn');
  }
  if (!armen.some(a => a.soort === 'geen' && a.wie === 'alle')) return f('een controlegroep is verplicht (soort geen, wie alle): zonder kun je niet zien of de modal de gewone klik kost');
  const m = {
    site, domeinen, uit: c.uit !== false, modus: c.modus === 'vast' ? 'vast' : 'leer', verken: Math.max(0.02, Math.min(0.5, N(c.verken) || 0.1)),
    controle: Math.max(0.05, Math.min(0.5, N(c.controle) || 0.1)), cap: Math.max(1, Math.min(24 * 30, N(c.cap) || 72)), minSec: Math.max(3, Math.min(120, N(c.minSec) || 8)),
    taal: /^[a-z]{2}$/.test(String(c.taal || '')) ? c.taal : 'en',
    vormen: Array.isArray(c.vormen) && c.vormen.some(v => VORMEN.includes(v)) ? VORMEN.filter(v => c.vormen.includes(v)) : (oud && Array.isArray(oud.vormen) ? oud.vormen : VORMEN_OUD.slice()),
    remOp: ['hoofd', 'koop', 'actie', 'mand', 'bewust'].includes(c.remOp) ? c.remOp : 'hoofd',
    stijl: checkStijl(c.stijl), instructies: c.instructies ? tekst(c.instructies, 1500) : undefined,
    nooit: (Array.isArray(c.nooit) ? c.nooit : []).map(x => String(x).toLowerCase().trim()).filter(x => /^\/[a-z0-9\/_.-]{0,60}$/.test(x)).slice(0, 30),
    catalogus: c.catalogus !== false, catalogusAlleen: Array.isArray(c.catalogusAlleen) ? c.catalogusAlleen.map(x => String(x).toLowerCase()).filter(x => /^[a-z0-9-]{2,20}$/.test(x)).slice(0, 10) : undefined, claude: c.claude !== false, waarde, armen,
    notitie: c.notitie ? tekst(c.notitie, 400) : undefined, versie: N(oud && oud.versie) + 1, bijgewerkt: new Date().toISOString()
  };
  for (const k of ['leer', 'leerAt', 'model', 'momLeer', 'momBron', 'vormLeer', 'vormBron', 'varLeer', 'varianten', 'rem', 'claudeAt']) if (oud && oud[k] != null) m[k] = oud[k];
  return { ok: true, modal: m };
}

// stijl per site (Henkjan: "later OOK op andere sites staan met andere instructies"): kleuren, lettertype, ronding, kant van de hoek, balk boven of onder
const KLEUR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
export function checkStijl(s) {
  s = s && typeof s === 'object' ? s : {}; const o = {};
  for (const k of ['knop', 'knopTekst', 'kaart', 'tekst', 'zacht', 'rand', 'balk']) if (KLEUR.test(String(s[k] || ''))) o[k] = String(s[k]);
  if (/^[A-Za-z0-9 ,'-]{2,120}$/.test(String(s.font || ''))) o.font = String(s.font);
  if (s.ronding != null && Number.isFinite(Number(s.ronding))) o.ronding = Math.max(0, Math.min(28, Math.round(Number(s.ronding))));
  o.kant = s.kant === 'links' ? 'links' : 'rechts'; o.balkPlek = s.balkPlek === 'boven' ? 'boven' : 'onder';
  if (s.logo && siteUrlOk(s.logo)) o.logo = String(s.logo).slice(0, 400);
  return o;
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
const armType = a => (a.soort === 'geen' ? 'geen' : a.soort === 'chat' ? 'chat:' + (a.corpus || 'kadoly') : a.soort === 'knop' ? 'knop:' + a.doelKnop : a.soort === 'email' ? 'email:' + (a.doel || 'bewaar') : 'site:' + (a.doelSite || (() => { try { return new URL(a.url.replace(/\{[a-z]+\}/g, 'x')).hostname; } catch (e) { return 'x'; } })()));

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
export function kenmerken({ mob, terug, net, ref, uur, land, hist, zq, abonnee, pt, warm }) {
  net = String(net || '').toLowerCase(); land = String(land || '').toLowerCase(); uur = N(uur); hist = hist || {};
  const betaald = BETAALD.test(net) || /^(md|mg)\d/.test(net) ? 1 : 0;
  return [1, mob ? 1 : 0, terug ? 1 : 0, betaald, /^(propeller|pa)$/.test(net) ? 1 : 0, /^(mondiad|md)/.test(net) ? 1 : 0, betaald && !/^(propeller|pa|mondiad|md)/.test(net) ? 1 : 0,
    ref === 'zoek' ? 1 : 0, uur < 6 ? 1 : 0, uur >= 6 && uur < 12 ? 1 : 0, uur >= 18 ? 1 : 0, land === 'us' ? 1 : 0, /^(de|at|ch)$/.test(land) ? 1 : 0, /^(nl|be)$/.test(land) ? 1 : 0,
    N(hist.g) > 0 ? 1 : 0, N(hist.k) > 0 ? 1 : 0, zq === 'm' ? 1 : 0, zq === 'z' ? 1 : 0, abonnee ? 1 : 0,
    pt === 'product' ? 1 : 0, ref === 'intern' ? 1 : 0, ref === 'social' ? 1 : 0, warm ? 1 : 0];
}

// ---- kiezen ----
function gewogen(lijst, gewichten, r) { const som = gewichten.reduce((a, b) => a + b, 0); if (!(som > 0)) return lijst[Math.floor(r * lijst.length)]; let acc = 0; const h = r * som; for (let i = 0; i < lijst.length; i++) { acc += gewichten[i]; if (h < acc) return lijst[i]; } return lijst[lijst.length - 1]; }
export function kiesArm(m, { seg, abonnee, id, x, kl, pt }) {
  const terug = seg.endsWith('-t'), armen = m.alleArmen || m.armen;
  let geschikt = armen.filter(a => (a.wie === 'alle' || (a.wie === 'kassa' ? !!kl : (a.wie === 'terug') === terug)) && !(abonnee && a.soort === 'email') && (!a.paginas || !a.paginas.length || a.paginas.includes(String(pt || ''))));
  if (!geschikt.length) return { arm: null };
  const ctrl = geschikt.filter(a => a.soort === 'geen');
  // de controlegroep krijgt altijd minstens 'controle' (per bezoeker vast), zodat zichtbaar blijft wat de modal kost
  const r = createHash('sha256').update(id + '|' + m.site + '|ctrl').digest().readUInt32BE(0) / 4294967296;
  if (ctrl.length && r < m.controle) return { arm: ctrl[0], hoe: 'controle' };
  const mdl0 = m.modus === 'leer' && m.model && m.model.arms ? m.model.arms : null, past = md => md && Array.isArray(md.mu) && md.mu.length === FEAT.length;
  const mdl = mdl0 ? Object.fromEntries(Object.entries(mdl0).filter(([, md]) => past(md))) : null; // een model van een oudere FEAT-versie telt niet mee tot de volgende leerronde
  // opwarmen (11 nov): op kadoly koos het model na 4 uur bij 9 op de 10 bezoekers 'niets tonen' op 2 tegen 5 mandjes. Daarom: altijd 10% een willekeurige
  // versie, en zolang een versie die deze bezoeker kan krijgen minder dan 300 beslissingen heeft, doet 'niets tonen' alleen via de controlegroep mee
  const tonen = geschikt.filter(a => a.soort !== 'geen'), nArm = a => N(mdl0 && mdl0[a.id] && mdl0[a.id].n);
  if (m.modus === 'leer' && tonen.length && Math.random() < (m.verken != null ? N(m.verken) : 0.1)) return { arm: tonen[Math.floor(Math.random() * tonen.length)], hoe: 'verken' };
  if (m.modus === 'leer' && tonen.length && tonen.some(a => nArm(a) < 300)) geschikt = tonen;
  const metModel = mdl ? geschikt.filter(a => mdl[a.id]) : [];
  if (metModel.length >= 2) {
    // lineaire Thompson: armen zonder eigen model krijgen het model van hun soort (van alle sites), anders een optimistische gok
    const pool = m.model.pool || {};
    let best = null, bs = -Infinity;
    for (const a of geschikt) { const md = mdl[a.id] || [pool[armType(a)], pool[a.soort]].find(past) || null; const s = md ? trek(md, x) : Math.random() * 3; if (s > bs) { bs = s; best = a; } }
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
// vorm: vast per arm, of geleerd per apparaat (eigen cijfers van de site, en zolang die te weinig zijn wat de andere sites leerden)
// rustig (11 nov): wie al op Nu kopen tikte of bij de kassa was, krijgt nooit een venster over de pagina heen (midden, vol), alleen hoek, balk, onder of blok
const OVER = /^(midden|vol)$/;
function kiesVorm(m, a, { plekken, mob, rustig }) {
  let mag = (m.vormen || VORMEN_OUD).filter(v => v !== 'blok' || (plekken && plekken.length));
  if (rustig) { const r = mag.filter(v => !OVER.test(v)); if (!r.length) return mob ? 'onder' : 'hoek'; mag = r; if (a.vorm && OVER.test(a.vorm)) a = { ...a, vorm: 'leer' }; }
  if (!mag.length) return mob ? 'onder' : 'midden';
  if (a.vorm && a.vorm !== 'leer' && mag.includes(a.vorm)) return a.vorm;
  const L = m.vormLeer || {}, w = L[mob ? 'm' : 'd'] || L['*'] || {};
  return gewogen(mag, mag.map(k => (w[k] != null ? Math.max(0.5, N(w[k])) : 1)), Math.random());
}
function kiesPlek(a, plekken) { if (!plekken || !plekken.length) return ''; return a.plek && plekken.includes(a.plek) ? a.plek : plekken[0]; }
function variantenVan(m, a) { const v = ((m.varianten || {})[a.id] || []).filter(x => !x.uit); return [{ vid: 'v0', titel: a.titel, tekst: a.tekst, knop: a.knop }].concat(v); }
function kiesVariant(m, a) { const vs = variantenVan(m, a), w = (m.varLeer || {})[a.id] || {}; return gewogen(vs, vs.map(v => (w[v.vid] != null ? N(w[v.vid]) : 1)), Math.random()); }

// ---- beslissing voor één paginabezoek ----
// Eén beslissing per bezoeker per 'cap' uur. Is hij nog niet getoond (het moment kwam niet op die pagina), dan krijgt de volgende pagina
// dezelfde beslissing (zelfde arm, tekst en vorm), zodat de proef zuiver blijft en de modal op elke pagina van het bezoek kan komen.
let MAILKLAAR = { at: 0, v: false };
async function kadolyMailKlaar(kv) { if (Date.now() - MAILKLAAR.at < 60000) return MAILKLAAR.v; let v = false; try { v = !!(await kv.get('gk:nb:mailklaar')); } catch (e) {} MAILKLAAR = { at: Date.now(), v }; return v; }
const schoonPlekken = pl => String(pl || '').toLowerCase().split(',').map(x => x.trim()).filter(x => /^[a-z0-9-]{1,30}$/.test(x)).slice(0, 8);
// Andere naam voor dezelfde modal (5 nov: op kadoly.com laadt de bestaande Clickmind-regel cm.js met data-site="yoors"; die krijgt zo ook
// Henkjans Kadoly-modal, zonder dat de shop iets hoeft te wijzigen). mm:modalalias = hash naam -> modal.
let ALIAS = { at: 0, h: {} };
export async function modalAlias(kv, naam) { if (Date.now() - ALIAS.at > 60000) { let h = {}; try { h = Object.fromEntries(paren(await kv.raw(['HGETALL', 'mm:modalalias']))); } catch (e) {} ALIAS = { at: Date.now(), h }; } return ALIAS.h[String(naam || '').toLowerCase()] || ''; }
export async function zetModalAlias(kv, naam, naar) { naam = String(naam || '').toLowerCase(); naar = String(naar || '').toLowerCase(); if (!/^[a-z0-9-]{2,30}$/.test(naam)) return { ok: false, fout: 'naam' }; if (naar) { if (!(await kv.get('mm:modal:' + naar))) return { ok: false, fout: 'onbekende modal ' + naar }; await kv.raw(['HSET', 'mm:modalalias', naam, naar]); } else await kv.raw(['HDEL', 'mm:modalalias', naam]); ALIAS.at = 0; return { ok: true, naam, naar: naar || null }; }
export async function modalBeslis(kv, { site, pid, q, mmc, v, mob, abo, test, origin, land, net, ref, uur, hist, zone, kw, geo, pa, pt, warm, pl, kl }) {
  let m = await leesModal(kv, site);
  if (!m) { const al = await modalAlias(kv, site); if (al) m = await leesModal(kv, al); }
  const ctx = vulCtx(geo, kw), plekken = schoonPlekken(pl);
  pt = /^[a-z]{2,12}$/.test(String(pt || '')) ? String(pt) : '';
  // Duitstalig: alleen met dubbele bevestiging; de directe todayin-aanmelding (zonder bevestiging vooraf) dan niet aanbieden
  if (m && /^(de|at|ch)$/i.test(String(land || '')) && (m.alleArmen || m.armen).some(a => a.doel === 'todayin')) m = { ...m, alleArmen: (m.alleArmen || m.armen).filter(a => a.doel !== 'todayin') };
  if (!m) return { toon: false, reden: 'onbekende site' };
  let oHost = ''; try { oHost = origin ? new URL(origin).hostname.toLowerCase() : ''; } catch (e) {}
  if (oHost && !m.domeinen.some(d => oHost === d || oHost.endsWith('.' + d))) return { toon: false, reden: 'domein hoort niet bij deze site' };
  const pad = String(pa || '').toLowerCase().slice(0, 200);
  if (test) {
    const [tid, tv, tf] = String(test).toLowerCase().split('~'); const a = (m.alleArmen || m.armen).find(x => x.id === tid);
    if (!a) return { toon: false, reden: 'onbekende arm', armen: (m.alleArmen || m.armen).map(x => x.id), vormen: VORMEN };
    const vs = a.soort === 'geen' ? [] : variantenVan(m, a), vv = vs.find(x => x.vid === tv) || vs[0];
    const vorm = VORMEN.includes(tf) ? tf : kiesVorm(m, a, { plekken, mob });
    return { toon: a.soort !== 'geen', test: true, mid: '', min: 0, arm: openbaar(a, m, { cid: '', moment: 'tijd:1', variant: vv, ctx, vorm, plek: kiesPlek(a, plekken) }) };
  }
  if (m.uit) return { toon: false, reden: 'uit' };
  // Kadoly-lijst: alleen aanbieden als het verzenddomein bij Resend klaar is (anders kan de bevestigingsmail niet weg); een voorbeeld met ?mmm= mag altijd
  if ((m.alleArmen || m.armen).some(a => a.doel === 'kadoly') && !(await kadolyMailKlaar(kv))) { m = { ...m, alleArmen: (m.alleArmen || m.armen).filter(a => a.doel !== 'kadoly') }; if (!m.alleArmen.some(a => a.soort !== 'geen')) return { toon: false, reden: 'verzenddomein nog niet klaar' }; }
  if (pad && (m.nooit || []).some(x => pad === x || pad.startsWith(x.endsWith('/') ? x : x + '/') || pad.startsWith(x + '?'))) return { toon: false, reden: 'niet op deze pagina' };
  let k = null; if (/^[0-9a-f]{8,24}$/.test(String(mmc || ''))) k = Object.fromEntries(paren(await kv.raw(['HGETALL', 'mm:cid:' + mmc]).catch(() => null)));
  if (!pid && k && k.pid) pid = k.pid;
  const id = pid || (/^[0-9a-f]{16}$/.test(String(q || '')) ? 'q' + q : '');
  if (!id) return { toon: false, reden: 'geen bezoekers-id' };
  const capKey = 'mm:mqc:' + m.site + ':' + id, vorig = String((await kv.raw(['GET', capKey]).catch(() => '')) || '');
  if (vorig) {
    if (!/^[0-9a-f]{12}$/.test(vorig)) return { toon: false, reden: 'al gezien binnen ' + m.cap + ' uur' };
    const o = Object.fromEntries(paren(await kv.raw(['HGETALL', 'mm:cid:' + vorig]).catch(() => null)));
    const a = o.modal === m.site ? (m.alleArmen || m.armen).find(x => x.id === o.arm) : null;
    if (!a) return { toon: false, reden: 'al gezien binnen ' + m.cap + ' uur' };
    if (a.soort === 'geen') return { toon: false, mid: vorig, reden: 'controlegroep' };
    if (o['mu:toon'] || N(await kv.raw(['EXISTS', 'mm:mu:' + vorig + ':toon']).catch(() => 0)) > 0) return { toon: false, mid: vorig, reden: 'al getoond binnen ' + m.cap + ' uur' };
    if ((warm || kl) && OVER.test(o.vorm || '')) return { toon: false, mid: vorig, reden: 'koper: geen venster over de pagina' }; // liever niet tonen dan een koper storen
    const vr = variantenVan(m, a).find(x => x.vid === o.var) || variantenVan(m, a)[0];
    return { toon: true, mid: vorig, min: m.minSec, weer: true, arm: openbaar(a, m, { cid: vorig, moment: o.mom || kiesMoment(m, a), variant: vr, ctx, vorm: o.vorm || kiesVorm(m, a, { plekken, mob, rustig: !!(warm || kl) }), plek: o.vorm === 'blok' ? kiesPlek(a, plekken) : o.plek }) };
  }
  let p = null; if (pid && !pid.startsWith('q')) p = Object.fromEntries(paren(await kv.raw(['HGETALL', 'mm:p:' + pid]).catch(() => null)));
  const soort = soortPersoon(p && Object.keys(p).length ? p : null);
  const terug = N(v) > 1 || N(p && p.n) > 1, seg = (mob ? 'm' : 'd') + '-' + (terug ? 't' : 'n');
  const abonnee = !!(abo || soort.has('abonnee'));
  const mid = nieuwId(6);
  const capOk = String(await kv.raw(['SET', capKey, mid, 'NX', 'EX', Math.round(m.cap * 3600)])) === 'OK';
  if (!capOk) return { toon: false, reden: 'al gezien binnen ' + m.cap + ' uur' };
  const netNu = (k && k.net && k.net !== '-') ? k.net : String(net || '').toLowerCase().slice(0, 20), zoneNu = (k && k.zone && k.zone !== '-') ? k.zone : String(zone || '').slice(0, 40);
  const zq = netNu && zoneNu ? String((await kv.raw(['HGET', 'mm:zq', netNu + '|' + zoneNu]).catch(() => '')) || '') : '';
  const x = kenmerken({ mob, terug, net: netNu, ref, uur, land, hist, zq, abonnee, pt, warm: !!warm });
  const { arm: a, hoe } = kiesArm(m, { seg, abonnee, id, x, kl, pt });
  if (!a) return { toon: false, reden: 'geen arm voor deze bezoeker' };
  const vorm = a.soort === 'geen' ? '' : kiesVorm(m, a, { plekken, mob, rustig: !!(warm || kl) }), plek = vorm === 'blok' ? kiesPlek(a, plekken) : '';
  const mom = a.soort === 'geen' || vorm === 'blok' ? '' : kiesMoment(m, a), vr = a.soort === 'geen' ? null : kiesVariant(m, a); // een blok komt als de plek in beeld is: geen moment
  const D = dag(), md = 'mm:md:' + D, pre = m.site + '|';
  const cmds = [
    ['HSET', 'mm:cid:' + mid, 't', Date.now(), 'pid', id, 'wissel', '', 'modal', m.site, 'arm', a.id, 'seg', seg, 'mom', mom, 'var', vr ? vr.vid : '', 'vorm', vorm, 'plek', plek, 'pt', pt, 'net', netNu || '-', 'zone', zoneNu || '-', 'camp', (k && k.camp) || '-', 'tag', '', 'van', mmc || '', 'land', land || '', 'stad', ctx.stad, 'rg', ctx.rg, 'cc', ctx.cc, 'lat', ctx.lat, 'lon', ctx.lon, 'kw', ctx.kw],
    ['EXPIRE', 'mm:cid:' + mid, T.cid],
    ['HINCRBY', md, pre + a.id + '|' + seg + '|n', 1], ['EXPIRE', md, T.teller],
    ['RPUSH', 'mm:mdl:' + D, JSON.stringify({ mid, s: m.site, a: a.id, ty: armType(a), m: mom, v: vr ? vr.vid : '', f: vorm, pt, x, t: Date.now(), hoe })], ['EXPIRE', 'mm:mdl:' + D, T.log]
  ];
  if (mom) cmds.push(['HINCRBY', md, pre + '@' + mom + '|*|n', 1]);
  if (vorm) cmds.push(['HINCRBY', md, pre + '#' + vorm + '|' + seg + '|n', 1]);
  if (vr) cmds.push(['HINCRBY', md, pre + a.id + '~' + vr.vid + '|*|n', 1]);
  await Promise.all(cmds.map(c => kv.raw(c)));
  return { toon: a.soort !== 'geen', mid, min: m.minSec, arm: openbaar(a, m, { cid: mid, moment: mom, variant: vr, ctx, vorm, plek }) };
}
// wat de browser van een arm te zien krijgt (geen gewichten of notities)
function openbaar(a, m, { cid, moment, variant, ctx, vorm, plek }) {
  if (a.soort === 'geen') return { id: a.id, soort: 'geen' };
  const v = variant || { titel: a.titel, tekst: a.tekst, knop: a.knop }, c = ctx || vulCtx();
  const o = { id: a.id, soort: a.soort, moment: moment || 'exit', vorm: vorm || 'midden', plek: plek || '', stijl: m.stijl || {}, beeld: a.beeld || '', titel: vul(v.titel, c, m.taal), tekst: vul(v.tekst, c, m.taal), knop: vul(v.knop, c, m.taal), nee: a.nee, taal: m.taal };
  if (a.soort === 'site') { const u = new URL(a.url.replace(/\{([a-z]+)\}/g, (x, k) => encodeURIComponent(k === 'cid' ? cid : k === 'site' ? m.site : k === 'arm' ? a.id : ''))); u.searchParams.set('mmc', cid || 'test'); o.href = u.href; }
  if (a.soort === 'email') { o.veld = a.veld; o.klein = vul(a.klein, c, m.taal); o.dank = vul(a.dank, c, m.taal); o.doel = a.doel; }
  if (a.soort === 'knop') o.doel = a.doelKnop;
  if (a.soort === 'chat') { o.corpus = a.corpus; o.wa = a.wa; o.veld = a.veld; o.keuzes = CHAT_KEUZES; }
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
  return modalUitkomst(kv, mid, e);
}
// ook vanaf de server (bv. 'bevestigd' als iemand de bevestigingsmail van Kadoly aanklikt). Eenmaal per beslissing en soort, als veld
// mu:<soort> in het beslissingsrecord zelf (geen losse sleutels: de database is krap); oude losse sleutels mm:mu:<mid>:<soort> tellen nog mee.
export async function modalUitkomst(kv, mid, e) {
  mid = String(mid || ''); e = String(e || '');
  if (!/^[0-9a-f]{12}$/.test(mid) || !VELDEN.includes(e) || e === 'n') return { ok: false, fout: 'mid of soort' };
  const k = Object.fromEntries(paren(await kv.raw(['HGETALL', 'mm:cid:' + mid])));
  if (!k.modal) return { ok: false, fout: 'onbekende beslissing' };
  if (k['mu:' + e] || N(await kv.raw(['HSETNX', 'mm:cid:' + mid, 'mu:' + e, '1'])) !== 1) return { ok: true, dubbel: true };
  if (N(await kv.raw(['EXISTS', 'mm:mu:' + mid + ':' + e]).catch(() => 0)) > 0) return { ok: true, dubbel: true };
  await Promise.all(modalTellers(k, mid, e).map(c => kv.raw(c)));
  return { ok: true };
}
// tellers voor arm, segment, moment en variant, plus de gebeurtenis per beslissing voor het model (ook gebruikt door uitkomst() in wissel.js)
export function modalTellers(k, mid, e) {
  const D = new Date(N(k.t) || Date.now()).toISOString().slice(0, 10), md = 'mm:md:' + D, pre = k.modal + '|';
  const c = [['HINCRBY', md, pre + k.arm + '|' + (k.seg || 'm-n') + '|' + e, 1], ['EXPIRE', md, T.teller], ['HSET', 'mm:mdv:' + D, mid + '|' + e, 1], ['EXPIRE', 'mm:mdv:' + D, T.log]];
  if (k.mom) c.push(['HINCRBY', md, pre + '@' + k.mom + '|*|' + e, 1]);
  if (k.vorm) c.push(['HINCRBY', md, pre + '#' + k.vorm + '|' + (k.seg || 'm-n') + '|' + e, 1]);
  if (k.var) c.push(['HINCRBY', md, pre + k.arm + '~' + k.var + '|*|' + e, 1]);
  return c;
}

// ---- gedrag in en rond de modal (Henkjan 5 nov: "extreem lerend dus alle data van iedere beweging") ----
// Zonder toestemming alleen de tellers hierboven (veld, typ, sluit; per beslissing, geen inhoud). Met toestemming voor statistiek
// (yoors_consent a1 of m1, of window.cmToestemming) ook één rij per beslissing: hoe gesloten, hoe lang in beeld, scrolldiepte en tijd op de
// pagina bij het tonen, aantal foute invoer, schermbreedte. Nooit wat er in het veld getypt is. 14 dagen, hoogstens 5000 rijen per dag.
const HOE = ['kruis', 'nee', 'achter', 'esc', 'weg', 'klaar', 'knop'];
export async function modalGedrag(kv, b) {
  b = b && typeof b === 'object' ? b : {}; const mid = String(b.mid || '');
  if (!/^[0-9a-f]{12}$/.test(mid)) return { ok: false, fout: 'mid' };
  const k = Object.fromEntries(paren(await kv.raw(['HGETALL', 'mm:cid:' + mid]).catch(() => null)));
  if (!k.modal) return { ok: false, fout: 'onbekende beslissing' };
  const hoe = HOE.includes(b.hoe) ? b.hoe : '', D = new Date(N(k.t) || Date.now()).toISOString().slice(0, 10);
  if (hoe && N(await kv.raw(['HSETNX', 'mm:cid:' + mid, 'mh', hoe])) === 1) await kv.raw(['HINCRBY', 'mm:md:' + D, k.modal + '|!' + hoe + '|' + (k.vorm || '-') + '|n', 1]).catch(() => {});
  if (b.tm !== true && b.tm !== 1) return { ok: true, detail: false };
  if (N(await kv.raw(['HSETNX', 'mm:cid:' + mid, 'mg', '1'])) !== 1) return { ok: true, dubbel: true };
  const r = { mid, s: k.modal, a: k.arm, f: k.vorm || '', pl: k.plek || '', mo: k.mom || '', v: k.var || '', pt: k.pt || '', seg: k.seg || '', hoe,
    zicht: Math.max(0, Math.min(36e5, Math.round(N(b.zicht)))), sc: Math.max(0, Math.min(100, Math.round(N(b.sc)))), tp: Math.max(0, Math.min(36e2, Math.round(N(b.tp)))),
    fout: Math.max(0, Math.min(20, Math.round(N(b.fout)))), vw: Math.max(0, Math.min(5000, Math.round(N(b.vw) / 10) * 10)), t: Date.now() };
  const L = 'mm:mdg:' + dag();
  await kv.raw(['RPUSH', L, JSON.stringify(r)]); await kv.raw(['LTRIM', L, -5000, -1]); await kv.raw(['EXPIRE', L, 14 * 86400]);
  return { ok: true, detail: true };
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
  if (a.doel === 'kadoly') { // de nieuwsbrief van Kadoly (lib/kadoly-nieuws.js): dubbele opt-in via Resend, hooguit één mail per week
    const KN = await import('./kadoly-nieuws.js');
    const r = await KN.aanmelden({ email, waar: 'modal-' + k.modal, arm: 'c', ms: Math.max(2000, Date.now() - N(k.t)), mid }, String(ipNet || '')).catch(() => ({ ok: false }));
    if (!r.ok) return { ok: false, fout: r.fout === 'email' ? 'Dat e-mailadres klopt niet.' : r.fout === 'druk' ? 'Het is even druk. Probeer het zo nog eens.' : 'Aanmelden lukt nu niet. Probeer het later nog eens.' };
    await uitkomst(kv, { cid: mid, soort: 'aanmelding', bron: 'modal:' + k.modal + ':kadoly' });
    return { ok: true, eigenLijst: true, bevestigen: true };
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
  const opTel = (s, pre) => { const r = leeg(); for (const [sg, x] of Object.entries(s || {})) if (!pre || sg.startsWith(pre)) for (const v of VELDEN) r[v] += N(x[v]); return r; };
  const vormen = VORMEN.map(k => { const s0 = t['#' + k] || {}, x = opTel(s0), mo = opTel(s0, 'm-'), de = opTel(s0, 'd-'); return { vorm: k, ...x, dollarPer1000: per1000(x), mobiel: { ...mo, dollarPer1000: per1000(mo) }, desktop: { ...de, dollarPer1000: per1000(de) } }; });
  // hoe mensen de modal sluiten, per vorm (kruisje, nee, achtergrond, Escape, weg van de pagina, na aanmelden)
  const sluiten = {}; for (const [key, s0] of Object.entries(t)) if (key.startsWith('!')) for (const [f, x] of Object.entries(s0)) { (sluiten[f] || (sluiten[f] = {}))[key.slice(1)] = N(x.n); }
  const varianten = {};
  for (const a of armen) if (a.soort !== 'geen') varianten[a.id] = variantenVan(m, a).map(v => { const x = (t[a.id + '~' + v.vid] || {})['*'] || leeg(); return { vid: v.vid, titel: v.titel, bron: v.bron || 'start', ...x, pctKlik: x.toon ? Math.round(x.klik / x.toon * 1000) / 10 : null }; });
  return Object.assign(rijen, { momenten, vormen, sluiten, varianten });
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
function kansLager(a, b, n = 2000, v = 'hoofd') { let c = 0; for (let i = 0; i < n; i++) if (beta(1 + N(a[v]), 1 + N(a.n) - N(a[v])) < beta(1 + N(b[v]), 1 + N(b.n) - N(b[v]))) c++; return c / n; }

// ---- wegjagen (Henkjan 11 nov: "Maak modal extreeem lerend maar zorg ook dat je geen klanten weg jaagt !!") ----
// Per versie: klikken bezoekers na de beslissing nog verder op de site ('verder')? Vergeleken met de controlegroep op dezelfde soort pagina en
// hetzelfde soort bezoeker: een versie die alleen op productpagina's of alleen bij kopers komt, mag niet tegen alle bezoekers afgezet worden.
const VERDER_VANAF = Date.parse('2026-11-12T01:00:00Z'); // vanaf hier meet cm.js 'verder'
const I_WARM = FEAT.indexOf('warm');
export function wegjagen(m, rijen, ev) {
  const eigen = rijen.filter(r => r.s === m.site && N(r.t) >= VERDER_VANAF), heeft = r => { const s = ev.get(r.mid); return !!(s && s.has('verder')); };
  const ctrl = eigen.filter(r => r.ty === 'geen'), uit = [];
  for (const a of (m.alleArmen || m.armen)) {
    if (a.soort === 'geen') continue;
    const past = r => (!a.paginas || !a.paginas.length || a.paginas.includes(r.pt)) && (a.wie !== 'kassa' || N(r.x && r.x[I_WARM]) > 0);
    const A = eigen.filter(r => r.a === a.id), C = ctrl.filter(past), av = A.filter(heeft).length, cv = C.filter(heeft).length;
    let p = 0; if (A.length && C.length) for (let i = 0; i < 2000; i++) if (beta(1 + av, 1 + A.length - av) < beta(1 + cv, 1 + C.length - cv)) p++;
    uit.push({ id: a.id, n: A.length, verder: av, nC: C.length, verderC: cv, kansSlechter: p / 2000 });
  }
  return uit;
}
// waarom bezoekers twijfelen (Kadoly-chat: tikknoppen en eigen vragen van de laatste 7 dagen), voor de nieuwe teksten van Claude
async function twijfelRedenen(kv, site) {
  const NM = { levering: 'delivery time', verzending: 'shipping costs', retour: 'returns', betalen: 'how to pay', vertrouwen: 'is this shop trustworthy', whatsapp: 'wants a human on WhatsApp' }, tel = {};
  for (let i = 0; i < 7; i++) for (const [k, v] of paren(await kv.raw(['HGETALL', 'mm:kreden:' + site + ':' + dag(-i)]).catch(() => null))) if (NM[k]) tel[k] = (tel[k] || 0) + N(v);
  const top = Object.entries(tel).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => NM[k] + ' (' + n + 'x)');
  let vr = []; try { vr = ((await kv.raw(['LRANGE', 'mm:kvragen:' + site, '0', '7'])) || []).map(x => { try { return String(JSON.parse(x).v || ''); } catch (e) { return ''; } }).map(v => tekst(v.replace(/\S+@\S+/g, '…').replace(/\+?\d[\d\s-]{6,}\d/g, '…'), 120)).filter(Boolean); } catch (e) {}
  return [top.length && 'topics: ' + top.join(', '), vr.length && 'questions they typed: "' + vr.join('" / "') + '"'].filter(Boolean).join('; ');
}
const AANBOD = a => a.soort === 'email' ? 'an email signup' : a.soort === 'chat' ? 'a small chat where the visitor can ask a question and gets an answer right away (the button sends the question)'
  : a.soort === 'knop' ? ({ koop: 'help to order the product on this page (the button starts the order)', ookgekozen: 'show what other visitors chose who looked at this product', kassa: 'go back to the checkout the visitor already started' }[a.doelKnop] || 'one helpful step in the shop') : 'a link to another website';

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
  // oudere beslissingen (minder kenmerken) krijgen 0 op de nieuwe kenmerken, zodat er geen data verloren gaat
  return { rijen: rijen.filter(r => Array.isArray(r.x) && r.x.length >= 19 && r.x.length <= FEAT.length).map(r => (r.x.length < FEAT.length ? { ...r, x: r.x.concat(new Array(FEAT.length - r.x.length).fill(0)) } : r)), ev };
}

// ---- de leerronde (elk uur): model per arm, moment, varianten, rem, nieuwe teksten ----
export async function modalLeer(kv, { droog = false, claude = null } = {}) {
  const uit = [], modals = await alleModals(kv), cat = await catalogus(kv);
  const { rijen, ev } = await leesLog(kv, 7);
  const waardeRij = (r, w) => { const s = ev.get(r.mid); if (!s) return 0; let v = 0; for (const e of s) v += N(w[e]); return v; };
  // 1. modellen per soort arm over alle sites (lenen voor sites en armen met weinig data)
  const pool = {}, perType = {};
  for (const r of rijen) { (perType[r.ty] || (perType[r.ty] = [])).push(r); const sr = String(r.ty || '').split(':')[0]; if (sr && sr !== r.ty) (perType[sr] || (perType[sr] = [])).push(r); } // ook per soort (email, site): een nieuwe lijst of site leent van alle e-mailarmen
  for (const [ty, rr] of Object.entries(perType)) if (rr.length >= 30) pool[ty] = fit(rr.map(r => r.x), rr.map(r => waardeRij(r, WAARDE)), { lam: 15 });
  let claudeBudget = 3;
  // 1b. moment en vorm over alle sites samen: een nieuwe site (of een site met weinig data) begint met wat de andere sites leerden
  //     (Henkjan 5 nov: "later OOK op andere sites staan met andere instructies maar data nemen we mee voor die site")
  const standen = new Map();
  for (const m0 of modals) { const m = { ...m0, alleArmen: alleArmen(m0, m0.catalogus ? cat : null) }; standen.set(m0.site, { m, st: await modalStand(kv, m, 14) }); }
  const somRij = (rr) => { const r = leeg(); for (const x of rr) for (const v of VELDEN) r[v] += N(x[v]); return r; };
  const poolMom = MOMENTEN.map(k => ({ id: k, ...somRij([...standen.values()].map(({ st }) => st.momenten.find(x => x.moment === k) || leeg())) }));
  const poolVorm = { m: [], d: [] };
  for (const f of VORMEN) for (const [dk, nm] of [['m', 'mobiel'], ['d', 'desktop']]) poolVorm[dk].push({ id: f, ...somRij([...standen.values()].map(({ st }) => ((st.vormen.find(x => x.vorm === f) || {})[nm]) || leeg())) });
  const poolMomLeer = poolMom.reduce((s, x) => s + x.n, 0) >= 60 ? thompsonWaarde(poolMom, WAARDE, { verken: 0.15 }) : null;
  const poolVormLeer = {}; for (const dk of ['m', 'd']) if (poolVorm[dk].reduce((s, x) => s + x.n, 0) >= 60) poolVormLeer[dk] = thompsonWaarde(poolVorm[dk], WAARDE, { verken: 0.15 });
  for (const m0 of modals) {
    const { m, st } = standen.get(m0.site), w = m.waarde || WAARDE;
    const r = { site: m.site, modus: m.modus, uit: m.uit, beslissingen: st.reduce((s, x) => s + x.n, 0), dollarPer1000: Object.fromEntries(st.map(x => [x.id, x.dollarPer1000])), modelArmen: 0, rem: [], nieuweTekst: [] };
    const patch = {};
    if (m.modus === 'leer') {
      // 2. contextueel model per arm (minstens 30 beslissingen), met als vertrekpunt het model van zijn soort
      const arms = {}, eigenRijen = rijen.filter(x => x.s === m.site);
      for (const a of m.alleArmen) { const rr = eigenRijen.filter(x => x.a === a.id); if (rr.length >= 30) { const ty = armType(a); arms[a.id] = fit(rr.map(x => x.x), rr.map(x => waardeRij(x, w)), { lam: 25, mu0: (pool[ty] || pool[a.soort]) ? (pool[ty] || pool[a.soort]).mu : null }); } }
      r.modelArmen = Object.keys(arms).length;
      patch.model = { arms, pool, feat: FEAT, at: new Date().toISOString() };
      // 3. gewichten per segment (terugval als er nog geen model is)
      if (r.beslissingen >= 50) { const leer = { '*': thompsonWaarde(st.map(x => ({ id: x.id, ...x.segmenten['*'] })), w, { verken: m.verken }) }; for (const s of SEGMENTEN) { const rr = st.map(x => ({ id: x.id, ...x.segmenten[s] })); if (rr.reduce((t, x) => t + x.n, 0) >= 200) leer[s] = thompsonWaarde(rr, w, { verken: m.verken }); } patch.leer = leer; }
      // 4. moment en tekstvarianten
      if (st.momenten.reduce((s, x) => s + x.n, 0) >= 60) { patch.momLeer = thompsonWaarde(st.momenten.map(x => ({ id: x.moment, ...x })), w, { verken: 0.15 }); patch.momBron = 'eigen'; }
      else if (poolMomLeer && !(m.momLeer && m.momBron === 'eigen')) { patch.momLeer = poolMomLeer; patch.momBron = 'alle sites'; }
      // vorm per apparaat, alleen tussen de vormen die deze site toestaat
      const vormLeer = {}, vormBron = {};
      for (const [dk, nm] of [['m', 'mobiel'], ['d', 'desktop']]) {
        const eigen = st.vormen.filter(x => (m.vormen || VORMEN_OUD).includes(x.vorm)).map(x => ({ id: x.vorm, ...x[nm] }));
        if (eigen.reduce((s, x) => s + x.n, 0) >= 60) { vormLeer[dk] = thompsonWaarde(eigen, w, { verken: 0.15 }); vormBron[dk] = 'eigen'; }
        else if (poolVormLeer[dk]) { vormLeer[dk] = Object.fromEntries(Object.entries(poolVormLeer[dk]).filter(([f]) => (m.vormen || VORMEN_OUD).includes(f))); vormBron[dk] = 'alle sites'; }
      }
      if (Object.keys(vormLeer).length) { patch.vormLeer = vormLeer; patch.vormBron = vormBron; }
      const varLeer = {}, varianten = JSON.parse(JSON.stringify(m.varianten || {}));
      for (const [aid, vs] of Object.entries(st.varianten)) {
        if (vs.reduce((s, x) => s + x.n, 0) < 40) continue;
        const kans = thompsonWaarde(vs.map(x => ({ id: x.vid, ...x })), { ...WAARDE, ...w, hoofd: 0 }, { verken: 0.2 }); varLeer[aid] = kans;
        // verliezers eruit: veel vertoond en bijna geen kans meer om de beste te zijn (de start-tekst v0 blijft altijd)
        const actief = (varianten[aid] || []).filter(v => !v.uit);
        for (const v of actief) { const x = vs.find(y => y.vid === v.vid); if (x && x.toon >= 300 && N(kans[v.vid]) < 3 && actief.filter(y => !y.uit).length > 1) { v.uit = true; v.uitAt = new Date().toISOString(); } }
      }
      patch.varLeer = varLeer; patch.varianten = varianten;
      // 5. automatische rem: kost de arm aantoonbaar de gewone klik en levert hij minder op dan niets tonen, dan 7 dagen uit
      const rv = m.remOp || 'hoofd'; // waar de rem op let: de gewone klik (keuzehulpen) of kopen (shop)
      const ctrl = st.filter(x => x.soort === 'geen').reduce((s, x) => ({ n: s.n + x.n, hoofd: s.hoofd + x.hoofd, [rv]: N(s[rv]) + N(x[rv]), waarde: s.waarde + waardeVan(x, w) }), { n: 0, hoofd: 0, waarde: 0 });
      const rem = { ...(m.rem || {}) };
      for (const x of st) if (x.soort !== 'geen' && x.n >= 300 && ctrl.n >= 100 && !rem[x.id]) { const p = kansLager(x, ctrl, 2000, rv); if (p > 0.975 && waardeVan(x, w) / x.n < ctrl.waarde / ctrl.n) { rem[x.id] = { at: new Date().toISOString(), reden: 'kost ' + (rv === 'koop' ? 'verkopen' : 'de gewone klik') + ' (' + Math.round(N(x[rv]) / x.n * 1000) / 10 + '% tegen ' + Math.round(N(ctrl[rv]) / ctrl.n * 1000) / 10 + '%) en levert minder op dan niets tonen' }; r.rem.push(x.id); } }
      // 5b. wegjaag-rem (11 nov): klikken bezoekers na een versie aantoonbaar minder verder dan zonder modal (zelfde soort pagina en bezoeker), dan
      //     7 dagen uit. Lagere drempel dan de rem hierboven: liever te vroeg remmen dan klanten wegjagen.
      if (N(w.verder) > 0) for (const x of wegjagen(m, rijen, ev)) if (!rem[x.id] && x.n >= 80 && x.nC >= 80 && x.kansSlechter > 0.95 && x.verder / x.n < 0.85 * x.verderC / x.nC) {
        rem[x.id] = { at: new Date().toISOString(), reden: 'jaagt mensen weg: ' + Math.round(x.verder / x.n * 100) + ' van de 100 klikten verder, zonder modal ' + Math.round(x.verderC / x.nC * 100) }; r.rem.push(x.id); }
      for (const [id, x] of Object.entries(rem)) if (Date.now() - Date.parse(x.at) > 7 * 864e5) delete rem[id]; // na 7 dagen opnieuw proberen
      patch.rem = rem;
      // 6. Claude schrijft een nieuwe uitdager voor armen met genoeg vertoningen (hoogstens 1 per arm per dag)
      if (claude && m.claude && !m.uit) {
        const twijfel = await twijfelRedenen(kv, m.site).catch(() => '');
        for (const a of m.alleArmen) {
          if (claudeBudget <= 0 || a.soort === 'geen') break;
          const vs = st.varianten[a.id] || [], getoond = vs.reduce((s, x) => s + x.toon, 0), actief = (varianten[a.id] || []).filter(v => !v.uit).length + 1;
          const laatst = ((m.claudeAt || {})[a.id]) || 0;
          if (getoond < 60 || actief >= 4 || Date.now() - laatst < 864e5) continue; // 60 (was 150): sneller een uitdager bij weinig verkeer
          const best = vs.slice().sort((p, q) => N((varLeer[a.id] || {})[q.vid]) - N((varLeer[a.id] || {})[p.vid]))[0];
          const bron = variantenVan(m, a).find(v => v.vid === (best && best.vid)) || variantenVan(m, a)[0];
          claudeBudget--;
          try {
            const nieuw = await claude(
              'You write the copy for a small, honest pop-up box on a website. It offers the visitor one thing: ' + AANBOD(a) + '. It must never annoy or scare away a visitor who is about to buy: calm, helpful, no pressure. Language: ' + ({ en: 'English', de: 'German', nl: 'Dutch' }[m.taal] || 'English') + '. Rules: plain words, no hype, no fake urgency, no prizes, no "free gift", never mention Amazon, no exclamation marks in the title, no claims that are not in the original.' + (a.doel === 'todayin' ? ' The offer is a free daily local news email from todayin.email. Keep the placeholders {stad} (the visitor\'s town) and {interesse} (the topic of the page) exactly as written, and keep the [[ ]] brackets around optional parts.' : '') + (a.doel === 'kadoly' ? ' The offer is the Kadoly newsletter: at most one email a week (Friday) with new gift guides and news from the Kadoly shop, confirm first, unsubscribe in one click. Never promise discounts, prizes or anything free.' : '') + (m.instructies ? ' Instructions from the site owner (follow them): ' + m.instructies : '') + ' Title max 60 characters, text max 140, button max 30. Answer only JSON {"titel":"","tekst":"","knop":""}.',
              'Site: ' + m.site + '. Offer: ' + (a.url || a.lijst || '') + '.\nBest copy so far (' + (best ? best.toon + ' shown, ' + best.klik + ' clicked' : 'no data') + '):\nTitle: ' + bron.titel + '\nText: ' + bron.tekst + '\nButton: ' + bron.knop + (twijfel ? '\nWhat hesitating visitors on this site ask most (answer their real doubt honestly, only with facts from the copy or the owner instructions): ' + twijfel : '') + '\nWrite one new version that could get more people to click, with a different angle.',
              { fast: true, max: 300, fn: 'clickmind-modal' });
            const ruw = String(nieuw.txt).replace(/```(?:json)?/g, ''), j = JSON.parse(ruw.slice(ruw.indexOf('{'), ruw.lastIndexOf('}') + 1));
            const v = { vid: 'v' + Date.now().toString(36).slice(-5), titel: tekst(j.titel, 80), tekst: tekst(j.tekst, 240), knop: a.soort === 'chat' ? a.knop : tekst(j.knop, 40), bron: 'claude', at: new Date().toISOString() };
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

// ---- uurupdate (Henkjan 11 nov: "Ja blijf leren geef me iedere uur update"): simpel, vooruitgang of niet, alleen wat nieuw is ----
// Vergelijkt met de vorige update (mm:modaluur:<site>); per versie de waarde per 100 beslissingen tegen de controlegroep.
export async function modalUur(kv, site = 'kadoly', { bewaar = true } = {}) {
  const m = await leesModal(kv, site, true); if (!m) return { ok: false, fout: 'onbekende site' };
  const st = await modalStand(kv, m, 14), w = m.waarde || WAARDE, V = ['n', 'toon', 'klik', 'aanmelding', 'bevestigd', 'mand', 'bewust', 'koop'];
  const tot = Object.fromEntries(V.map(v => [v, st.reduce((s, x) => s + N(x[v]), 0)]));
  const per = Object.fromEntries(st.map(x => [x.id, Object.fromEntries(V.map(v => [v, N(x[v])]))]));
  let vorig = null; try { vorig = await kv.get('mm:modaluur:' + site); if (typeof vorig === 'string') vorig = JSON.parse(vorig); } catch (e) {}
  const d = Object.fromEntries(V.map(v => [v, tot[v] - N(vorig && vorig.tot && vorig.tot[v])]));
  const nl = x => String(Math.round(x * 10) / 10).replace('.', ','), wv = x => waardeVan(x, w) / Math.max(1, x.n) * 100;
  const ctrl = st.find(x => x.soort === 'geen') || { n: 0 };
  const L = [];
  const goed = d.koop > 0 || d.bevestigd > 0 || d.aanmelding > 0 || d.mand > 0 || d.klik > 0;
  L.push((goed ? 'Vooruitgang' : 'Geen vooruitgang') + (vorig ? ' sinds ' + new Date(vorig.at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Curacao' }) : '') + ': ' +
    [d.koop && d.koop + ' betaald', d.bevestigd && d.bevestigd + ' aanmelding bevestigd', d.aanmelding && d.aanmelding + ' aangemeld', d.mand && d.mand + ' keer Nu kopen', d.klik && d.klik + ' klik op de modal', d.toon + ' keer getoond'].filter(Boolean).join(', ') + '.');
  L.push('Totaal: ' + [tot.koop && tot.koop + ' betaald', tot.bevestigd && tot.bevestigd + ' bevestigd', tot.aanmelding && tot.aanmelding + ' aanmeldingen', tot.mand && tot.mand + ' keer Nu kopen', tot.klik && tot.klik + ' kliks', tot.toon + ' keer getoond'].filter(Boolean).join(', ') + '.');
  const NAAM = { zeker: 'Zekerheid', twijfel: 'Twijfel', klaar: 'Ligt klaar', ideeen: 'Mail ideeën', keuze: 'Mail keuzehulp', vraag: 'Chat' }, nm = x => NAAM[x.id] || x.id, p100 = (x, v) => nl(N(x[v]) / Math.max(1, x.n) * 100);
  const vs = st.filter(x => x.soort !== 'geen' && x.n > 0).sort((a, b) => wv(b) - wv(a));
  if (vs.length) L.push('Nu kopen per 100 bezoekers: niets tonen ' + p100(ctrl, 'mand') + ' · ' + vs.map(x => nm(x) + ' ' + p100(x, 'mand') + (x.n < 300 ? ' (' + x.n + ' bezoekers, nog te weinig)' : '')).join(' · ') + '.');
  const ma = vs.filter(x => x.soort === 'email'); if (ma.some(x => x.aanmelding)) L.push('Aanmeldingen per 100 bezoekers: ' + ma.map(x => nm(x) + ' ' + p100(x, 'aanmelding')).join(' · ') + '.');
  const rem = Object.entries(m.rem || {}); if (rem.length) L.push('Geremd: ' + rem.map(([id, x]) => (NAAM[id] || id) + ' (' + String(x.reden || 'doet het slechter dan niets tonen') + ')').join(' · ') + '.');
  if (N(w.verder) > 0) { // jagen we klanten weg? (11 nov) Alleen een regel als er genoeg gemeten is
    try { const { rijen, ev } = await leesLog(kv, 7); const wj = wegjagen(m, rijen, ev).filter(x => x.n >= 30 && x.nC >= 30);
      const slecht = wj.filter(x => x.kansSlechter > 0.8 && x.verder / x.n < 0.9 * x.verderC / x.nC), p = (a, b) => Math.round(a / Math.max(1, b) * 100);
      if (slecht.length) L.push('Let op, jaagt mogelijk mensen weg: ' + slecht.map(x => (NAAM[x.id] || x.id) + ' (' + p(x.verder, x.n) + ' van de 100 klikken verder, zonder modal ' + p(x.verderC, x.nC) + ')').join(' · ') + '. De rem grijpt in zodra het zeker is.');
      else if (wj.length) { const A = wj.reduce((s, x) => [s[0] + x.verder, s[1] + x.n], [0, 0]); const C = wj.reduce((s, x) => [s[0] + x.verderC, s[1] + x.nC], [0, 0]); L.push('Wegjagen: nee. Met modal klikken ' + p(A[0], A[1]) + ' van de 100 verder, zonder modal ' + p(C[0], C[1]) + '.'); }
    } catch (e) {}
  }
  if (site === 'kadoly') { // betalingen vandaag (UTC-dag) uit de lekketen en de mislukte betalingen met reden (Henkjan 11 nov: "Ik wil betalingen zien")
    try { const { lekketen } = await import('./shopketen.js'); const k = await lekketen(kv); const sn = id => N((k.stappen.find(x => x.id === id) || {}).n);
      const vandaag = new Date().toISOString().slice(0, 10); let fout = [];
      try { fout = ((await kv.raw(['LRANGE', 'hjdk:shop:betaalfout', '0', '49'])) || []).map(x => { try { return typeof x === 'string' ? JSON.parse(x) : x; } catch (e) { return null; } }).filter(o => o && new Date(o.at).toISOString().slice(0, 10) === vandaag); } catch (e) {}
      const b = sn('koop'), g = sn('betaal');
      L.push(b || g || fout.length ? 'Betalingen vandaag: ' + [g && g + ' gestart', b && b + ' betaald' + (k.omzet ? ' (€' + nl(k.omzet) + ')' : ''), fout.length && fout.length + ' mislukt' + (fout[0].r || fout[0].m ? ' (laatste: ' + [fout[0].m, fout[0].r].filter(Boolean).join(', ').slice(0, 120) + ')' : '')].filter(Boolean).join(', ') + '.' : 'Betalingen vandaag: nog geen.');
    } catch (e) {}
    try { const { redenenVandaag } = await import('./kadolychat.js'); const r = await redenenVandaag(kv, site); const NM = { levering: 'levertijd', verzending: 'verzendkosten', retour: 'retour', betalen: 'betalen', vertrouwen: 'betrouwbaar?', whatsapp: 'naar WhatsApp', 'whatsapp-vraag': 'vraag op WhatsApp' };
      const e = Object.entries(r).filter(([, n]) => n > 0).sort((x, y) => y[1] - x[1]); if (e.length) L.push('Twijfels in de chat vandaag: ' + e.map(([k, n]) => (NM[k] || k) + ' ' + n).join(' · ') + '.');
    } catch (e) {}
    try { const { proefStand } = await import('./proef.js'); const ps = await proefStand(kv, site); // lerende afrekenpagina: alleen onderdelen die live staan
      for (const f of (ps.factoren || []).filter(f => !f.uit && f.versies.some(v => v.gezien))) L.push('Afrekenpagina, ' + f.wat + ': ' + f.versies.filter(v => !v.uit).map(v => v.id + ' ' + v.gezien + 'x gezien' + (v.stappen.betaal ? ', ' + v.stappen.betaal + ' op Betalen' : '') + (v.stappen.koop ? ', ' + v.stappen.koop + ' betaald' : '')).join(' · ') + (/^winnaar/.test(f.oordeel) ? ' (' + f.oordeel + ')' : '') + '.');
    } catch (e) {}
  }
  if (bewaar) await kv.set('mm:modaluur:' + site, JSON.stringify({ at: Date.now(), tot, per })).catch(() => null);
  return { ok: true, tekst: L.join('\n'), tot, per, sinds: vorig ? vorig.at : null };
}
