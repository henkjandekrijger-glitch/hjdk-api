// Clubwerving van Kadoly (Henkjan 23 nov 2026: "Maak een mail voor verenigingen en clubs en vindt al die clubs om ze te mailen met een aanbieding
// die ze niet kunnen weerstaan dan gaan we er iedere dag 10 mailen . of meer . Dit moet lerend zijn .").
//
// Waarom zo en niet anders:
// - Adressen: eerst de sponsorpagina van de club (daar vragen ze om voorstellen), dan contact- of bestuurspagina en homepage. Henkjan koos na de uitleg
//   over Telecommunicatiewet 11.7: "Je kunt gewoon bestuursleden persoonlijk mailen als je email adres vindt en info mag ook gewoon van mij" (23 nov).
//   Eén adres per club, altijd met de pagina waar het stond (c.mb). Nooit naar wie al in een gekoppelde mailbox staat (bekend()).
// - Kanaal: Resend verbiedt koude mail (resend.com/legal/acceptable-use: "cold outreach, purchased lists, or scraped contact data"); daar
//   lopen alle mails van alle projecten over. Deze mails gaan daarom één voor één uit Henkjans eigen mailbox via Zernio (POST /v1/email/messages,
//   sleutel ZERNIO_API_KEY in Vercel, mailbox gekoppeld in Zernio), gespreid over de dag, met afmelden in één klik (List-Unsubscribe).
//
// Hoe het loopt:
// 1. Vinden (cron elke 2 uur, op=clubs&zoek=1): eens per 60 dagen alle clubs met een website uit OpenStreetMap (heel NL), daarna per ronde
//    40 sites: sponsorpagina zoeken, adres op die pagina lezen, het beste adres (sponsor/commercie > bestuur/secretariaat/info, eigen domein)
//    in de rij cw:rij. Geen sponsorpagina of geen adres daarop: niet mailen.
// 2. Mailen (cron werkdagen om de 2 uur, op=clubs&ronde=1): perDag (start 10) verdeeld over 6 rondes. Elke mail is gemeld in de POST-lus
//    (lib/postlus.js, project kadoly-clubs) met een meetlink naar de klaarstaande clubpagina (Clickmind). Na 7 dagen zonder antwoord,
//    afmelding of aanmelding één korte opvolgmail in dezelfde draad met één nieuw feit (€4 als een lid zijn eigen zegel aan de club geeft).
// 3. Clubpagina (op=clubs&c=<tok>): "Deze pagina staat klaar voor <club>", één zwarte knop "Zet de pagina aan"; dat maakt een partner
//    (lib/partner.js maakPartner, soort club) en stuurt naar het dashboard met eigen link en WhatsApp-bericht.
// 4. Leren: onderwerpregel a/b (eerst om en om tot 10, dan Thompson) op succes = clubpagina bekeken, antwoord of aangezet; winnaar bij 95%
//    vanaf 60 per arm, dan komt de volgende uit ONDERWERPEN erbij. Volume: bounce en afmelding onder 3% over 14 dagen: perDag +5 (hoogstens
//    max, eens per 3 dagen); bounce 6% of afmelding 5% of meer: halveren en melden.
// 5. Controle: op=clubs&stand=1 (beschermd) met wachtOp, cijfers per stap en per arm, lekken met wat er al aan gedaan is.
// Uit tot Henkjans woord: LIVE hieronder én kv cw:regels.aan, én de clubpagina moet live kunnen (lib/partner.js LIVE).
import { createHash, randomBytes } from 'node:crypto';
import { kv } from './db.js';

export const LIVE = false;
const HOST = 'https://gids.kadoly.com';
const STD = { aan: false, perDag: 10, max: 40, armen: [0, 1], volgende: 2, knopAt: 0, gedaan: [] };
const UA = 'Mozilla/5.0 (compatible; KadolyClubzoeker/1.0; +https://gids.kadoly.com)';
const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const h = s => createHash('sha256').update(String(s)).digest('hex');
const hk = s => h('cw:' + String(s).toLowerCase().trim()).slice(0, 24);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dagNL = (t = Date.now()) => new Date(t).toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });
const nlDeel = (t = Date.now()) => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', weekday: 'short', hour: 'numeric', hour12: false, month: 'numeric', day: 'numeric' }).formatToParts(new Date(t)).map(x => [x.type, x.value])); return { wd: p.weekday, uur: N(p.hour) % 24, maand: N(p.month), dag: N(p.day) }; };
const json = s => { try { return JSON.parse(s); } catch (e) { return null; } };
const MAILRE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

// ---------- teksten ----------
// Onderwerpen hooguit 60 tekens, concreet, met hun naam (regel onderwerp-concreet). Arm = index in deze lijst; nieuwe uitdagers onderaan.
export const ONDERWERPEN = [
  n => 'Sponsoring voor ' + n,
  n => n + ': €2 voor de clubkas bij elk cadeau',
  n => 'Vraag over de sponsorpagina van ' + n,
  n => 'Een sponsor voor ' + n + ' zonder loten te verkopen'
];
const LESSEN = ['eerst-tonen', 'recht-voor-zn-raap', 'bereikbaar', 'alleen-echte-feiten', 'meetlink', 'eerste-zin-ontvanger', 'opvolgen', 'geven-voor-vragen', 'twee-varianten', 'onderwerp-concreet', 'doel-een-zin', 'kort', 'een-link'];
const naamKort = (n, lim = 38) => { n = String(n || '').replace(/\s+/g, ' ').trim(); if (n === n.toUpperCase() && n.length > 4) n = n.toLowerCase().replace(/(^|\s)(\S)/g, (a, b, c) => b + c.toUpperCase()); return n.length > lim ? n.slice(0, lim).replace(/\s+\S*$/, '') : n; };
let EXTRA = []; // uitdagers die de leerronde toevoegde (kv cw:regels.extra, tekst met {club})
export const lijst = () => [...ONDERWERPEN, ...EXTRA.map(t => n => String(t).replace(/\{club\}/g, n))];
export function onderwerp(c, i) { const L = lijst(), f = L[i] || L[0]; for (const lim of [38, 30, 24, 18, 12]) { const s = f(naamKort(c.n, lim)); if (s.length <= 60) return s; } return ONDERWERPEN[0](naamKort(c.n, 40)).slice(0, 60); }
function seizoen(t = Date.now()) { const { maand, dag } = nlDeel(t); if ((maand === 11 && dag >= 10) || (maand === 12 && dag <= 5)) return 'de komende weken hun Sinterklaas- en kerstcadeaus'; if (maand === 12 && dag <= 24) return 'de komende weken hun kerstcadeaus'; return 'hun cadeaus'; }
const ONDERTEKEN = 'Groet,\nHenkjan de Krijger\nKadoly, ADSFAIR B.V. in Gouda\n06 55395630 (bellen of WhatsApp: https://wa.me/31655395630)';
export function mailTekst(c, { link, arm = 0, opvolg = false, t = Date.now() } = {}) {
  const n = naamKort(c.n), sp = c.mt ? c.mt === 'sponsor' : /sponsor|vrienden|business/i.test(c.mb || '');
  if (opvolg) return { onderwerp: 'Re: ' + onderwerp(c, arm), tekst: `Hallo,\n\nNog een aanvulling op mijn mail over sponsoring. Een lid kan bij een aankoop zijn eigen zegel ook aan de club geven. Dan krijgt ${n} €4 voor die aankoop in plaats van €2.\n\nDe pagina voor ${n} staat nog klaar:\n${link}\n\nGroet,\nHenkjan de Krijger\n06 55395630\n\nLiever geen mail meer? Antwoord met stop.` };
  return { onderwerp: onderwerp(c, arm), tekst: `Hallo,\n\n${sp ? 'Ik las de sponsorpagina van ' + n + '.' : 'Ik zag de site van ' + n + '.'} Ik heb een voorstel dat de club niets kost.\n\nIk ben Henkjan van Kadoly, een cadeauwinkel. Kopen leden ${seizoen(t)} via jullie clublink, dan krijgt ${n} €2 per aankoop. Leden betalen niets extra en sparen zelf mee: elke aankoop geeft een zegel, en een volle kaart van 5 zegels is al een cadeau gratis.\n\nIk heb alvast een pagina voor ${n} gemaakt, met jullie eigen link en een bericht voor de groepsapp:\n${link}\n\nMag ik weten wat je ervan vindt?\n\n${ONDERTEKEN}\n\nLiever geen mail meer van mij? Antwoord met stop, dan hoor je niets meer.` };
}

// ---------- opslag ----------
async function regels() { const r = await kv.get('cw:regels').catch(() => null); const R = { ...STD, ...(r && typeof r === 'object' ? r : {}) }; EXTRA = Array.isArray(R.extra) ? R.extra : []; return R; }
async function zetRegels(r) { await kv.set('cw:regels', r); }
async function club(id) { const s = await kv.raw(['HGET', 'cw:club', id]).catch(() => null); return s ? json(s) : null; }
async function bewaar(c) { await kv.raw(['HSET', 'cw:club', c.id, JSON.stringify(c)]); }
async function tel(wat, n = 1, t = Date.now()) { try { const k = 'cw:tel:' + dagNL(t); await kv.raw(['HINCRBY', k, wat, String(n)]); await kv.raw(['EXPIRE', k, String(120 * 86400)]); await kv.raw(['HINCRBY', 'cw:tot', wat, String(n)]); } catch (e) {} }
async function arm(v, wat, n = 1) { try { await kv.raw(['HINCRBY', 'cw:arm:' + v, wat, String(n)]); } catch (e) {} }
const hash = a => { const o = {}; for (let j = 0; j + 1 < (a || []).length; j += 2) o[a[j]] = N(a[j + 1]); return o; };
async function hlees(k) { return hash(await kv.raw(['HGETALL', k]).catch(() => [])); }

// ---------- 1. vinden: OpenStreetMap ----------
const OVERPASS = ['https://overpass.openstreetmap.fr/api/interpreter', 'https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
const NAAMRE = '^((s|v|h|t|k|z|r|b|w|l|m|g|c)[.]?(v|c|t|s)[.]?( |$)|(ltc|mhc|rfc|wsv|ltv|gtv|hcv|kc|kv|zc|rv|tv) )|vereniging|club|scouting|harmonie|fanfare|koor|majorette|drumband';
const PROV = ['NL-ZH', 'NL-NH', 'NL-UT', 'NL-NB', 'NL-GE', 'NL-OV', 'NL-LI', 'NL-FR', 'NL-GR', 'NL-DR', 'NL-FL', 'NL-ZE']; // per provincie: heel NL in één vraag gaf 406/504 (23 nov)
const PNAAM = { 'NL-ZH': 'Zuid-Holland', 'NL-NH': 'Noord-Holland', 'NL-UT': 'Utrecht', 'NL-NB': 'Noord-Brabant', 'NL-GE': 'Gelderland', 'NL-OV': 'Overijssel', 'NL-LI': 'Limburg', 'NL-FR': 'Fryslân', 'NL-GR': 'Groningen', 'NL-DR': 'Drenthe', 'NL-FL': 'Flevoland', 'NL-ZE': 'Zeeland' };
const query = (p, opNaam) => `[out:json][timeout:100];${opNaam ? `area["name"="${PNAAM[p]}"]["admin_level"="4"]["boundary"="administrative"]` : `area["ISO3166-2"="${p}"]`}->.p;(nwr["club"]["name"]["website"](area.p);nwr["club"]["name"]["contact:website"](area.p);nwr["sport"]["name"~"${NAAMRE}",i]["website"](area.p);nwr["sport"]["name"~"${NAAMRE}",i]["contact:website"](area.p););out tags;`;
const SOCIAAL = /(^|\.)(facebook|instagram|twitter|x|linkedin|youtube|tiktok|google|goo|sites\.google|wikipedia|sportlink|knvb|knhb|knltb|nevobo)\.(com|nl|org|be)$/;
const NIET = /fitness|basic.?fit|sportschool|zwembad|sportpark|sporthal|sportcentrum|sportcomplex|gemeente|b\.?v\.?$|holding|winkel|restaurant|hotel|camping|kinderopvang/i;
const SPORT = { soccer: 'voetbal', field_hockey: 'hockey', hockey: 'hockey', tennis: 'tennis', korfball: 'korfbal', volleyball: 'volleybal', basketball: 'basketbal', handball: 'handbal', swimming: 'zwemmen', athletics: 'atletiek', gymnastics: 'gymnastiek', rowing: 'roeien', sailing: 'zeilen', golf: 'golf', baseball: 'honkbal', softball: 'softbal', rugby_union: 'rugby', rugby: 'rugby', cricket: 'cricket', judo: 'judo', equestrian: 'paardensport', table_tennis: 'tafeltennis', badminton: 'badminton', chess: 'schaken', cycling: 'wielrennen', ice_skating: 'schaatsen', padel: 'padel', canoe: 'kano', archery: 'handboog', shooting: 'schieten', billiards: 'biljart', bowls: 'jeu de boules', boules: 'jeu de boules', dance: 'dans', scout: 'scouting', music: 'muziek', choir: 'koor' };
export const domein = w => { try { return new URL(/^https?:\/\//i.test(w) ? w : 'https://' + w).hostname.toLowerCase().replace(/^www\./, ''); } catch (e) { return ''; } };
export function uitOsm(elements, gezien = new Set()) {
  const uit = [];
  for (const e of elements || []) {
    const t = e.tags || {}, naam = String(t.name || '').replace(/\s+/g, ' ').trim(), web = String(t.website || t['contact:website'] || '').split(';')[0].trim();
    if (!naam || !web || NIET.test(naam) || t.disused || t.shop || t.amenity === 'restaurant') continue;
    const d = domein(web); if (!d || SOCIAAL.test(d) || gezien.has(d)) continue; gezien.add(d);
    const s = String(t.sport || t.club || '').split(';')[0];
    uit.push({ id: 'o' + String(e.type || 'n')[0] + e.id, n: naam.slice(0, 90), s: SPORT[s] || s.slice(0, 20), p: String(t['addr:city'] || '').slice(0, 40), w: /^https?:\/\//i.test(web) ? web : 'https://' + web, d, st: 'nieuw', at: Date.now() });
  }
  return uit;
}
export async function vindOsm(budget = 120000) {
  let o = await kv.get('cw:osm').catch(() => null); if (!o || typeof o !== 'object' || o.at && o.next == null) o = { next: 0, n: 0 };
  if (o.klaar && Date.now() - o.klaar > 60 * 86400000) o = { next: 0, n: 0 }; if (o.klaar) return { klaar: true, n: o.n };
  // open = nog niet gelezen; een provincie die 4 keer faalt wordt overgeslagen, en een mislukte gaat achteraan zodat de rest doorloopt (24 nov: Noord-Holland gaf steeds een time-out en hield de andere 9 tegen)
  o.per = o.per || {}; o.leeg = o.leeg || {}; o.mis = o.mis || {}; const open = x => (o.per[x] == null || (o.per[x] === 0 && N(o.leeg[x]) < 2)) && N(o.mis[x]) < 4;
  const p = PROV.filter(open).sort((a, b) => N(o.mis[a]) - N(o.mis[b]))[0]; if (!p) { o.klaar = Date.now(); await kv.set('cw:osm', o); return { klaar: true, n: o.n }; }
  const opNaam = o.per[p] === 0, t0 = Date.now(), st = []; let j = null; // gaf de ISO-code niets, dan op naam
  // alle servers tegelijk, het eerste goede antwoord telt (24 nov: 3 van de 4 servers gaven niets terug en de eerste at het hele budget op; een antwoord met een remark is een time-out bij Overpass zelf en telt niet)
  const ac = new AbortController(), tm = setTimeout(() => ac.abort(), Math.max(5000, Math.min(100000, budget - 10000)));
  const een = async u => { try { const r = await fetch(u, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'gids.kadoly.com (clubzoeker)', accept: 'application/json' }, body: 'data=' + encodeURIComponent(query(p, opNaam)), signal: ac.signal }); if (!r.ok) { st.push(r.status); throw new Error('status'); } const x = await r.json(); if (!x || !Array.isArray(x.elements) || (x.remark && /error|timed out/i.test(String(x.remark)))) { st.push('remark'); throw new Error('remark'); } st.push(200); return x; } catch (e) { if (!/status|remark/.test(String(e.message))) st.push(String(e.name || e).slice(0, 30)); throw e; } };
  try { j = await Promise.any(OVERPASS.map(een)); } catch (e) { j = null; } clearTimeout(tm); ac.abort();
  if (!j || !Array.isArray(j.elements)) { o.fout = p + ': ' + st.join(','); o.foutAt = Date.now(); o.mis[p] = N(o.mis[p]) + 1; await kv.set('cw:osm', o); return { ok: false, provincie: p, status: st }; }
  const bekend = new Set((await kv.raw(['SMEMBERS', 'cw:domein']).catch(() => [])) || []);
  const nieuw = uitOsm(j.elements, bekend);
  for (let i = 0; i < nieuw.length; i += 300) { const deel = nieuw.slice(i, i + 300);
    await kv.raw(['HSET', 'cw:club', ...deel.flatMap(c => [c.id, JSON.stringify(c)])]); await kv.raw(['RPUSH', 'cw:scan', ...deel.map(c => c.id)]); await kv.raw(['SADD', 'cw:domein', ...deel.map(c => c.d)]); }
  if (!j.elements.length) o.leeg[p] = N(o.leeg[p]) + 1; o.per[p] = N(o.per[p]) + nieuw.length; o.n = N(o.n) + nieuw.length; o.next = PROV.filter(x => o.per[x] > 0 || N(o.leeg[x]) >= 2).length; delete o.fout; if (!PROV.some(open)) o.klaar = Date.now(); o.at = Date.now();
  await kv.set('cw:osm', o); await tel('gevonden', nieuw.length);
  return { ok: true, provincie: p, opNaam, elementen: j.elements.length, nieuw: nieuw.length };
}

// ---------- 1b. vinden: sponsorpagina en adres ----------
async function haal(u, ms = 9000) {
  try { const r = await fetch(u, { redirect: 'follow', headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' }, signal: AbortSignal.timeout(ms) });
    if (!r.ok) return null; const ct = r.headers.get('content-type') || ''; if (ct && !/html|text/i.test(ct)) return null;
    return { url: r.url || u, t: (await r.text()).slice(0, 900000) }; } catch (e) { return null; }
}
const cfDecode = hex => { try { const k = parseInt(hex.slice(0, 2), 16); let s = ''; for (let i = 2; i < hex.length; i += 2) s += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ k); return s; } catch (e) { return ''; } };
export function adressen(html) {
  const uit = new Set(), voeg = a => { a = String(a || '').toLowerCase().trim().replace(/^mailto:/, '').replace(/[.,;:)>\]]+$/, ''); try { a = decodeURIComponent(a); } catch (e) {} if (MAILRE.test(a) && a.length < 80) uit.add(a); };
  for (const m of html.matchAll(/data-cfemail="([0-9a-f]+)"/gi)) voeg(cfDecode(m[1]));
  for (const m of html.matchAll(/email-protection#([0-9a-f]+)/gi)) voeg(cfDecode(m[1]));
  for (const m of html.matchAll(/mailto:([^"'?>\s]+)/gi)) voeg(m[1]);
  const tekst = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&#64;|&commat;/g, '@').replace(/&#46;/g, '.');
  for (const m of tekst.matchAll(/[a-z0-9._%+-]+\s?(?:@|\[at\]|\(at\)|\[apenstaart\])\s?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/gi)) voeg(m[0].replace(/\s?(?:\[at\]|\(at\)|\[apenstaart\])\s?/i, '@').replace(/\s/g, ''));
  return [...uit];
}
const VRIJ = /^(gmail|googlemail|hotmail|outlook|live|yahoo|icloud|me|ziggo|kpnmail|kpnplanet|planet|home|hetnet|xs4all|chello|zonnet|msn|upcmail|telfort|tele2|online|casema|quicknet|solcon|caiway|freeler|tiscali)\./;
const woorden = n => String(n || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter(w => w.length >= 4 && !/^(vereniging|club|sport|voetbal|hockey|tennis|korfbal|stichting)$/.test(w));
// Welk adres mailen (Henkjan 23 nov 2026: "Je kunt gewoon bestuursleden persoonlijk mailen als je email adres vindt en info mag ook gewoon van mij"):
// sponsor/commercie > bestuur/secretariaat > info/contact > iemand op het eigen domein > een persoonlijk gratis adres (alleen van een bestuurs- of
// contactpagina). Nooit een ander domein: op een sponsorpagina zijn dat de sponsors zelf. Eén adres per club.
export function score(adres, dom, naam, soort = 'sponsor') {
  const [l, d] = adres.split('@'); if (!l || !d) return -1;
  if (/^(no-?reply|webmaster|privacy|avg|abuse|postmaster|wordpress|example|test|ledenadministratie|ledenadmin|leden|administratie|jeugd|wedstrijd|scheidsrechter|kantine|materiaal|trainer|technisch|naam|uw|jouw|your|vertrouwens|kledingcommissie|kleding|website|redactie)/.test(l)) return -1;
  if (/\.(png|jpe?g|gif|webp|svg)$/.test(d) || /sentry|wixpress|example|domain\.|godaddy|w3\.org|schema\.org/.test(d)) return -1;
  const eigen = d === dom || d.endsWith('.' + dom) || dom.endsWith('.' + d), vrij = VRIJ.test(d); if (!eigen && !vrij) return -1;
  let r = /sponsor|commerc|marketing|business|zakelijk|partner|^pr$/.test(l) ? 6 : /bestuur|secretar|voorzitter|penningmeester/.test(l) ? 4 : /info|contact|vereniging|club|^post|^mail|algemeen/.test(l) ? 3 : 2;
  if (vrij) { const tok = woorden(naam).some(w => l.includes(w)) || woorden(dom.split('.')[0]).some(w => l.includes(w)); if (!tok && r < 4) { if (soort === 'sponsor') return -1; r = 1; } }
  return r;
}
export function paginaLinks(html, basis) {
  const dom = domein(basis), sp = new Map(), co = new Map();
  for (const m of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]{0,300}?)<\/a>/gi)) {
    const txt = (m[2].replace(/<[^>]+>/g, ' ') + ' ' + m[1]).toLowerCase(); let s = 0, c = 0;
    if (/sponsor/.test(txt)) s += 3; if (/word.?sponsor|sponsor.?worden|sponsoring|sponsormogelijkhed|sponsorpakket/.test(txt)) s += 2; if (/business.?club|club van \d+|vrienden van|adverteren/.test(txt)) s += 2;
    if (/contact/.test(txt)) c += 2; if (/bestuur|organisatie|over (ons|de club|de vereniging)|commissies|secretariaat/.test(txt)) c += 3;
    if (!s && !c) continue; let u; try { u = new URL(m[1], basis); } catch (e) { continue; }
    if (!/^https?:$/.test(u.protocol) || /\.(pdf|jpe?g|png|docx?|zip)$/i.test(u.pathname)) continue; const hd = u.hostname.toLowerCase().replace(/^www\./, ''); if (hd !== dom && !hd.endsWith('.' + dom)) continue;
    u.hash = ''; const k = u.toString(); if (s) sp.set(k, Math.max(sp.get(k) || 0, s)); else co.set(k, Math.max(co.get(k) || 0, c));
  }
  const top = M => [...M.entries()].sort((a, b) => b[1] - a[1]).map(x => x[0]).slice(0, 2);
  return { sponsor: top(sp), contact: top(co) };
}
export const sponsorLinks = (html, basis) => paginaLinks(html, basis).sponsor;
export async function scanClub(c, haalF = haal) {
  const thuis = await haalF(c.w); if (!thuis) return { st: 'geen', r: 'site' };
  const basis = thuis.url, dom = domein(basis) || c.d, L = paginaLinks(thuis.t, basis), kand = [];
  const neem = (p, soort) => { for (const a of adressen(p.t)) { const sc = score(a, dom, c.n, soort); if (sc > 0) kand.push({ a, s: sc + (soort === 'sponsor' ? 0.5 : 0), mb: p.url, mt: soort }); } };
  const sp = L.sponsor.length ? L.sponsor : [new URL('/sponsoring/', basis).toString()];
  for (const l of sp) { const p = await haalF(l); if (p && /sponsor/i.test(p.t.replace(/<[^>]+>/g, ' '))) neem(p, 'sponsor'); if (kand.some(k => k.s >= 4)) break; }
  if (!kand.some(k => k.s >= 4)) { for (const l of (L.contact.length ? L.contact : [new URL('/contact/', basis).toString()]).slice(0, 2)) { const p = await haalF(l); if (p) neem(p, 'contact'); if (kand.some(k => k.s >= 4)) break; } }
  if (!kand.length) neem(thuis, 'home');
  if (!kand.length) return { st: 'geen', r: L.sponsor.length ? 'geen adres gevonden' : 'geen sponsorpagina en geen adres' };
  kand.sort((x, y) => y.s - x.s); const k = kand[0];
  return { st: 'klaar', m: k.a, mb: k.mb, mt: k.mt, d: dom, sc: Math.round(k.s) };
}
export async function scanRonde(n = 40, budget = 230000) {
  const t0 = Date.now(), uit = { bekeken: 0, klaar: 0, geen: 0 };
  const ids = []; for (let i = 0; i < n; i++) { const id = await kv.raw(['LPOP', 'cw:scan']).catch(() => null); if (!id) break; ids.push(id); }
  let i = 0; const werk = async () => { while (i < ids.length && Date.now() - t0 < budget) { const id = ids[i++]; const c = await club(id); if (!c) continue; uit.bekeken++;
    const r = await scanClub(c); Object.assign(c, r, { sa: Date.now() });
    if (r.st === 'klaar') { const nieuw = await kv.raw(['SADD', 'cw:adres', hk(r.m)]).catch(() => 1); if (!N(nieuw)) { c.st = 'dubbel'; } else { await kv.raw(['RPUSH', 'cw:rij', id]); uit.klaar++; await tel('klaar'); } }
    else { uit.geen++; await tel('geen'); }
    await bewaar(c); } };
  await Promise.all(Array.from({ length: 6 }, werk));
  for (; i < ids.length; i++) await kv.raw(['RPUSH', 'cw:scan', ids[i]]).catch(() => {}); // niet af binnen de tijd: terug in de rij
  await tel('gescand', uit.bekeken); return uit;
}
export async function zoek() {
  const t0 = Date.now(), uit = {}, o = await kv.get('cw:osm').catch(() => null);
  if (!o || !o.klaar || Date.now() - o.klaar > 60 * 86400000) { if (!(o && o.foutAt && Date.now() - o.foutAt < 3600000)) uit.osm = await vindOsm(110000); if (uit.osm && uit.osm.ok && Date.now() - t0 < 70000) uit.osm2 = await vindOsm(100000); } // twee provincies per ronde als de eerste snel lukt; // na een fout een uur wachten
  const rij = N(await kv.raw(['LLEN', 'cw:rij']).catch(() => 0)), R = await regels();
  if (rij > Math.max(200, R.perDag * 20)) { uit.overgeslagen = 'rij is lang genoeg'; uit.rij = rij; return uit; }
  const rest = 270000 - (Date.now() - t0); if (rest > 50000) uit.scan = await scanRonde(rest > 200000 ? 40 : 20, rest - 25000);
  return uit;
}

// ---------- 2. mailen via Zernio ----------
const ZK = () => process.env.ZERNIO_API_KEY || process.env.ZERNIO_KEY || '';
async function zApi(pad, { method = 'GET', body } = {}) {
  const r = await fetch('https://zernio.com/api/v1' + pad, { method, headers: { authorization: 'Bearer ' + ZK(), 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(25000) });
  return { ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) };
}
const idVan = x => x && (x.id || x._id || x.accountId || x.messageId || (x.message && (x.message.id || x.message._id)) || (x.data && (x.data.id || x.data._id)));
async function zAccounts() {
  if (process.env.ZERNIO_MAIL_ACCOUNT) return String(process.env.ZERNIO_MAIL_ACCOUNT).split(',').map(x => x.trim()).filter(Boolean);
  const k = await kv.get('cw:zacc').catch(() => null); if (k && Array.isArray(k.ids) && k.ids.length && Date.now() - N(k.at) < 6 * 3600000) return k.ids; if (!ZK()) return [];
  const r = await zApi('/accounts?limit=200'); const l = (r.j && (r.j.accounts || r.j.data || r.j.items)) || (Array.isArray(r.j) ? r.j : []);
  const m = l.filter(x => /mail|gmail|google|outlook|microsoft|imap/i.test(String(x.platform || x.type || '')) && /@/.test(String(x.username || x.email || x.displayName || ''))); const ids = m.map(a => String(idVan(a) || '')).filter(Boolean);
  await kv.set('cw:zacc', { ids, at: Date.now(), adressen: m.map(a => String(a.username || a.email || '').replace(/^(.).*(@.*)$/, '$1…$2')) }); return ids;
}
async function zAccount() { return (await zAccounts())[0] || ''; }
async function mijnAdres() { if (!ZK()) return ''; const r = await zApi('/accounts?limit=200'); const l = (r.j && (r.j.accounts || r.j.data || r.j.items)) || (Array.isArray(r.j) ? r.j : []);
  const a = l.find(x => /mail|gmail|google|outlook|microsoft|imap/i.test(String(x.platform || x.type || '')) && /@/.test(String(x.username || x.email || ''))); return a ? String(a.username || a.email).toLowerCase().trim() : ''; }
// Henkjan 23 nov 2026: "Stuur nooit naar iemand die NU al in mijn email box zit . Dus die ik zou kennen ." Vóór de eerste mail: staat het adres
// (of bij een eigen domein: iemand van dat domein) al in een gekoppelde mailbox, verzonden of ontvangen, dan niet mailen. Kan het niet gecontroleerd
// worden, dan ook niet mailen.
export function bekendQuery(c) { const d = String(c.m || '').split('@')[1] || ''; return VRIJ.test(d) ? 'from:' + c.m + ' OR to:' + c.m + ' OR cc:' + c.m : 'from:' + d + ' OR to:' + d + ' OR cc:' + d + (c.d && c.d !== d ? ' OR from:' + c.d + ' OR to:' + c.d : ''); }
async function bekend(c) {
  const ids = await zAccounts(); if (!ids.length) return { fout: 'geen mailbox' };
  for (const acc of ids) { const r = await zApi('/email/threads?accountId=' + encodeURIComponent(acc) + '&limit=1&searchQueryNative=' + encodeURIComponent(bekendQuery(c)));
    if (!r.ok) return { fout: 'mailbox niet te lezen (' + r.status + ')' }; const l = (r.j && (r.j.threads || r.j.data || r.j.items)) || (Array.isArray(r.j) ? r.j : []); if (l.length) return { bekend: true }; }
  return { bekend: false };
}
async function verstuur({ aan, onderwerp: ond, tekst, af, antwoordOp }) {
  const acc = await zAccount(); if (!acc) return { ok: false, fout: 'geen mailbox gekoppeld in Zernio' };
  const body = { accountId: acc, to: [{ email: aan }], fromName: 'Henkjan de Krijger', subject: ond, text: tekst, headers: { 'List-Unsubscribe': '<' + af + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }, metadata: { stroom: 'kadoly-clubs' } };
  if (antwoordOp) body.replyToMessageId = antwoordOp;
  const r = await zApi('/email/messages', { method: 'POST', body }); return r.ok ? { ok: true, id: String(idVan(r.j) || '') } : { ok: false, fout: 'zernio ' + r.status + ' ' + String((r.j && (r.j.error && (r.j.error.code || r.j.error.message) || r.j.message)) || '').slice(0, 80) };
}
// Henkjan 23 nov 2026: "Maak de email compleet lerend dus check iedere reactie wat je ervan kunt leren ." Elke ronde leest de mailboxen op mail van de
// clubs die we mailden (laatste 30 dagen), leest het antwoord zelf en deelt het in: stop (nooit meer mailen), afwezig (telt niet, opvolgmail mag),
// nee, later (bestuur bespreekt het), vraag of ja (Henkjan krijgt een seintje en antwoordt zelf). Bezwaren worden geteld per soort en per onderwerp;
// de leerronde (Claude, op=clubs&leer=1) leest elk nieuw antwoord en zet een les, een nieuwe onderwerpregel of een vraag op de clubpagina terug.
export function leesAntwoord(t) {
  const s = String(t || '').toLowerCase();
  if (/automatisch (gegenereerd|antwoord|bericht)|afwezigheid|ben (ik )?afwezig|out of office|autoreply|auto-reply|niet aanwezig|met vakantie|ben weer (aanwezig|bereikbaar)/.test(s) && s.length < 2500) return 'afwezig';
  if (/^\s*(stop|afmelden)\b|afmelden|uitschrijven|geen (mail|e-mail|berichten) meer|niet meer (mailen|benaderen)|verwijder (ons|mij|dit adres)/.test(s)) return 'stop';
  if (/geen interesse|niet geïnteresseerd|niet geinteresseerd|nee,? (dank|bedankt)|geen behoefte|doen we niet|niet voor ons|past niet bij|zien hiervan af|gaan we niet/.test(s)) return 'nee';
  if (/doorgestuurd|doorgezet|stuur (ik|het) door|zet (ik|het) door|bespreken|vergadering|commissie neemt|kom(en)? (ik|we|er) .{0,20}op terug|neemt contact/.test(s)) return 'later';
  if (/interesse|leuk|goed idee|mooi initiatief|graag|aangezet|doen we mee|we doen mee|klinkt (goed|leuk)|sluiten (graag )?aan/.test(s)) return /\?/.test(s) ? 'vraag' : 'ja';
  if (/\?/.test(s)) return 'vraag';
  return 'anders';
}
export const BEZWAREN = {
  'heeft al een actie of sponsor': /sponsorkliks|clubactie|rabo|clubsupport|al een (sponsor|actie|samenwerking)|hebben al /,
  'leden niet lastigvallen': /leden (niet )?(lastig|belasten|benaderen|storen)|commercie(el|le).{0,20}leden|privacy|avg/,
  'vertrouwen': /wie (zijn|ben) (jullie|je|u)|betrouwbaar|kvk|nooit van gehoord|oplichting|\bspam\b|nep/,
  'geen tijd of mensen': /geen tijd|vrijwilligers|geen mensen|te druk|capaciteit/,
  'te weinig opbrengst': /te weinig|maar €?\s?2|klein bedrag|niet de moeite|weinig op/,
  'verkeerde persoon': /verkeerde|niet de juiste|zit niet (meer )?in het bestuur|ben (geen|niet de)|stuur.{0,20}naar|ander adres/,
  'bestuur beslist': /bestuur(svergadering)?|commissie|alv|ledenvergadering/
};
export const bezwaren = t => { const s = String(t || '').toLowerCase(); return Object.entries(BEZWAREN).filter(([, re]) => re.test(s)).map(([k]) => k); };
const schoonAntw = t => String(t || '').replace(/<br\s*\/?>|<\/p>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').split(/\n(?:op .{5,80} schreef|on .{5,80} wrote|-----|van:|from:|verzonden:)/i)[0].split('\n').filter(r => !/^\s*>/.test(r)).join('\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, 700);
const lijstVan = j => (j && (j.messages || j.threads || j.data || j.items)) || (Array.isArray(j) ? j : []);
const vanAdres = x => String((x && (x.from && (x.from.email || x.from.address || x.from)) || x.sender || '')).toLowerCase().match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/)?.[0] || '';
async function meldHenkjan(tekst) { const s = process.env.MELD_SLEUTEL; if (!s) return false; try { const r = await fetch((process.env.MELD_URL || 'https://spel.todayin.email') + '/api/meld', { method: 'POST', headers: { 'content-type': 'application/json', 'x-meld-sleutel': s }, body: JSON.stringify({ bron: 'Kadoly clubwerving', tekst: tekst.slice(0, 3400) }), signal: AbortSignal.timeout(10000) }); const j = await r.json().catch(() => ({})); return !!(j && j.ok); } catch (e) { return false; } }
async function leesAntwoorden() {
  const accs = await zAccounts(); if (!accs.length) return { gelezen: false };
  const ids = ((await kv.raw(['LRANGE', 'cw:gestuurd', '-500', '-1']).catch(() => [])) || []), clubs = [];
  for (const id of ids) { const c = await club(id); if (c && c.m && c.vo && Date.now() - c.vo < 30 * 86400000 && !c.antw && !c.bo) clubs.push(c); }
  const uit = { gelezen: true, antwoord: 0, bounce: 0, soorten: {} }, na = new Date(Date.now() - 31 * 86400000).toISOString(), seintjes = [];
  const zoekQ = async (acc, q) => { const r = await zApi('/email/messages?accountId=' + encodeURIComponent(acc) + '&after=' + encodeURIComponent(na) + '&limit=50&searchQueryNative=' + encodeURIComponent(q)); return r.ok ? lijstVan(r.j) : []; };
  const tekstVan = async (acc, m) => { let t = m.text || m.body || m.snippet || m.html || ''; if (!m.text && idVan(m)) { const r = await zApi('/email/messages/' + encodeURIComponent(idVan(m)) + '?accountId=' + encodeURIComponent(acc)); const x = r.ok ? (r.j.message || r.j.data || r.j) : {}; t = x.text || x.body || x.html || t; } return t; };
  for (const acc of accs) {
    for (let i = 0; i < clubs.length; i += 15) { const deel = clubs.slice(i, i + 15).filter(c => !c.antw); if (!deel.length) continue;
      const L = await zoekQ(acc, 'from:(' + deel.map(c => c.m).join(' OR ') + ')');
      for (const c of deel) { const m = L.filter(x => vanAdres(x) === c.m).sort((a, b) => String(b.date || b.receivedAt || '').localeCompare(String(a.date || a.receivedAt || '')))[0]; if (!m) continue;
        const t = schoonAntw(await tekstVan(acc, m)), soort = leesAntwoord(t), bz = bezwaren(t);
        if (soort === 'afwezig') { c.afwezig = Date.now(); await bewaar(c); await tel('afwezig'); continue; }
        c.antw = { soort, bz, t, at: Date.now() }; c.ant = Date.now(); uit.antwoord++; uit.soorten[soort] = N(uit.soorten[soort]) + 1;
        await markeer(c, 'ant'); await tel('antw-' + soort); if (c.v) await arm(c.v, 'antw-' + soort); for (const b of bz) await kv.raw(['HINCRBY', 'cw:bezwaar', b, '1']).catch(() => {});
        if (soort === 'stop' && c.m) { await kv.raw(['SADD', 'cw:af', hk(c.m)]).catch(() => {}); c.af = Date.now(); await markeer(c, 'af'); }
        await kv.raw(['RPUSH', 'cw:antw', c.id]).catch(() => {});
        if (soort === 'ja' || soort === 'vraag' || soort === 'later' || soort === 'anders') seintjes.push(naamKort(c.n) + ' (' + soort + '): ' + t.slice(0, 220).replace(/\s+/g, ' '));
      } }
    const b = await zoekQ(acc, 'from:(mailer-daemon OR postmaster)'); const bs = JSON.stringify(b).toLowerCase();
    for (const c of clubs) if (!c.antw && !c.bo && bs.includes(c.m)) { c.bo = Date.now(); uit.bounce++; await markeer(c, 'bo'); }
  }
  if (seintjes.length) uit.seintje = await meldHenkjan('Clubs antwoordden op je sponsormail. Antwoord zelf vanuit je mailbox:\n' + seintjes.slice(0, 8).join('\n'));
  return uit;
}
async function markeer(c, wat) {
  const v = c.v || 'o0', eerst = !c.succes && (wat === 'zie' || wat === 'ant' || wat === 'aan');
  if (c.v) await arm(v, { zie: 'zie', ant: 'antwoord', aan: 'aan', bo: 'bounce', af: 'af' }[wat]); await tel({ zie: 'zie', ant: 'antwoord', aan: 'aan', bo: 'bounce', af: 'af' }[wat]);
  if (eerst && c.v) { c.succes = Date.now(); await arm(v, 'succes'); }
  await bewaar(c);
  if (c.pid && (wat === 'ant' || wat === 'bo')) { try { const P = await import('./postlus.js'); await P.uitkomst({ id: c.pid, uitkomst: wat === 'ant' ? 'antwoord' : 'bounce' }); } catch (e) {} }
}

// ---------- 4. leren ----------
const normaal = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
function gamma(k) { if (k < 1) return gamma(k + 1) * Math.pow(Math.random(), 1 / k); const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { x = normaal(); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = Math.random(); if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; } }
const beta = (a, b) => { const x = gamma(a), y = gamma(b); return x / (x + y); };
export async function armStand(R) { const o = {}; for (const i of R.armen) o['o' + i] = await hlees('cw:arm:o' + i); return o; }
export function kansBeste(S, n = 4000) { const k = Object.keys(S), w = Object.fromEntries(k.map(x => [x, 0])); for (let i = 0; i < n; i++) { let best = null, bv = -1; for (const x of k) { const s = N(S[x].succes), v = N(S[x].verstuurd); const b = beta(s + 1, Math.max(0, v - s) + 1); if (b > bv) { bv = b; best = x; } } w[best]++; } for (const x of k) w[x] = Math.round(w[x] / n * 1000) / 1000; return w; }
function kiesArm(R, S) {
  const k = R.armen.map(i => 'o' + i), weinig = k.filter(x => N(S[x] && S[x].verstuurd) < 10);
  if (weinig.length) return weinig.sort((a, b) => N(S[a] && S[a].verstuurd) - N(S[b] && S[b].verstuurd))[0];
  let best = k[0], bv = -1; for (const x of k) { const s = N(S[x].succes), v = N(S[x].verstuurd); const b = beta(s + 1, Math.max(0, v - s) + 1); if (b > bv) { bv = b; best = x; } } return best;
}
async function leer(R) {
  const S = await armStand(R), uit = [];
  if (R.armen.every(i => N(S['o' + i].verstuurd) >= 60)) { const P = kansBeste(S); const top = Object.entries(P).sort((a, b) => b[1] - a[1])[0];
    if (top[1] >= 0.95 && R.volgende < lijst().length) { const win = N(top[0].slice(1)), weg = R.armen.find(i => i !== win); R.armen = [win, R.volgende]; R.volgende++; R.gedaan = [...(R.gedaan || []), { dag: dagNL(), winnaar: 'o' + win, weg: 'o' + weg, kans: top[1] }].slice(-20); uit.push('onderwerp o' + win + ' wint (' + Math.round(top[1] * 100) + '%), o' + weg + ' eruit, o' + R.armen[1] + ' erbij'); } }
  // volume op bounces en afmeldingen van de laatste 14 dagen
  let V = 0, B = 0, A = 0; for (let i = 0; i < 14; i++) { const t = await hlees('cw:tel:' + dagNL(Date.now() - i * 864e5)); V += N(t.verstuurd); B += N(t.bounce); A += N(t.af); }
  if (V >= 30) { if (B / V >= 0.06 || A / V >= 0.05) { const oud = R.perDag; R.perDag = Math.max(5, Math.floor(R.perDag / 2)); R.knopAt = Date.now(); if (oud !== R.perDag) uit.push('volume ' + oud + ' naar ' + R.perDag + ' per dag: ' + B + ' bounces en ' + A + ' afmeldingen op ' + V); }
    else if (B / V < 0.03 && A / V < 0.03 && Date.now() - N(R.knopAt) > 3 * 86400000 && R.perDag < R.max) { const oud = R.perDag; R.perDag = Math.min(R.max, R.perDag + 5); R.knopAt = Date.now(); uit.push('volume ' + oud + ' naar ' + R.perDag + ' per dag'); } }
  return uit;
}

// ---------- 2b. de verzendronde ----------
const af = tok => HOST + '/api/gids?op=clubs&af=' + tok;
const clubUrl = tok => HOST + '/api/gids?op=clubs&c=' + tok;
async function zorgTok(c) { if (c.tok) return c.tok; let t = ''; for (let i = 0; i < 5; i++) { t = randomBytes(6).toString('base64url').replace(/[^a-zA-Z0-9]/g, 'x'); if (N(await kv.raw(['HSETNX', 'cw:tok', t, c.id]).catch(() => 0))) break; } c.tok = t; return t; }
export async function wachtOp(R) {
  const w = []; let ptLive = false; try { ptLive = (await import('./partner.js')).LIVE; } catch (e) {}
  if (!LIVE || !R.aan) w.push('jouw ja: daarna zet ik het aan');
  if (!ptLive) w.push('de clubpagina live (lib/partner.js LIVE)');
  if (!ZK()) w.push('Zernio-sleutel in Vercel (ZERNIO_API_KEY)');
  else if (!(await zAccount())) w.push('je mailbox koppelen in Zernio');
  return w;
}
export async function ronde({ nu = Date.now(), droog = false } = {}) {
  const R = await regels(), w = await wachtOp(R); if (w.length && !droog) return { ok: true, wacht: w };
  const { wd, uur } = nlDeel(nu); if (!droog && (/Sat|Sun/.test(wd) || uur < 8 || uur > 19)) return { ok: true, rust: wd + ' ' + uur + 'u' };
  const uit = { ok: true, verstuurd: 0, opvolg: 0, fouten: [], geleerd: [] };
  if (!droog && (await kv.raw(['SET', 'cw:dag:' + dagNL(nu), '1', 'NX', 'EX', '90000']).catch(() => null)) === 'OK') { uit.geleerd = await leer(R); await zetRegels(R); }
  if (!droog) uit.antwoorden = await leesAntwoorden().catch(e => ({ fout: String(e.message).slice(0, 80) })); // elke ronde: snel een seintje bij een antwoord
  const vandaag = await hlees('cw:tel:' + dagNL(nu)); const per = Math.ceil(R.perDag / 6); let ruimte = Math.max(0, Math.min(per, R.perDag - N(vandaag.verstuurd)));
  const S = await armStand(R), P = await import('./postlus.js');
  // opvolgen: 7 dagen na de eerste mail, zonder antwoord, bounce, afmelding of aanmelding
  let opv = Math.max(1, Math.ceil(per / 2)); const ids = ((await kv.raw(['LRANGE', 'cw:gestuurd', '-300', '-1']).catch(() => [])) || []);
  for (const id of ids) { if (opv <= 0) break; const c = await club(id); if (!c || c.op || c.ant || c.antw || c.bo || c.af || c.code || !c.zid || nu - N(c.vo) < 7 * 86400000 || nu - N(c.vo) > 14 * 86400000) continue;
    if (N(await kv.raw(['SISMEMBER', 'cw:af', hk(c.m)]).catch(() => 0))) continue;
    const m = mailTekst(c, { link: c.link, arm: N(String(c.v || 'o0').slice(1)), opvolg: true, t: nu });
    if (droog) { uit.opvolg++; opv--; continue; }
    const r = await verstuur({ aan: c.m, onderwerp: m.onderwerp, tekst: m.tekst, af: af(c.tok), antwoordOp: c.zid }); if (!r.ok) { uit.fouten.push(r.fout); break; }
    c.op = nu; await bewaar(c); await tel('opvolg'); await arm(c.v, 'opvolg'); uit.opvolg++; opv--; }
  // nieuwe clubs
  if (droog) { const k = ((await kv.raw(['LRANGE', 'cw:rij', '0', String(Math.max(0, ruimte - 1))]).catch(() => [])) || []); uit.verstuurd = k.length; uit.zouMailen = []; for (const id of k) { const c = await club(id); if (c) uit.zouMailen.push(c.n); } ruimte = 0; }
  while (ruimte > 0) { const id = await kv.raw(['LPOP', 'cw:rij']).catch(() => null); if (!id) { uit.rijLeeg = true; break; } const c = await club(id); if (!c || !c.m || c.vo) continue;
    if (N(await kv.raw(['SISMEMBER', 'cw:af', hk(c.m)]).catch(() => 0))) { c.st = 'af'; await bewaar(c); continue; }
    const bk = await bekend(c); if (bk.fout) { uit.fouten.push(bk.fout); await kv.raw(['LPUSH', 'cw:rij', id]); break; }
    if (bk.bekend) { c.st = 'bekend'; await bewaar(c); await tel('bekend'); uit.bekend = N(uit.bekend) + 1; continue; }
    const v = kiesArm(R, S), tok = await zorgTok(c), mm = mailTekst(c, { link: '{link}', arm: N(v.slice(1)), t: nu });
    const g = await P.meld({ project: 'kadoly-clubs', doel: 'Club zet de klaarstaande sponsorpagina van Kadoly aan', aan: c.m, soort: 'organisatie', taal: 'nl', onderwerp: mm.onderwerp, variant: v, lessen: LESSEN, wie: 'clubwerving', links: clubUrl(tok) });
    const link = (g && g.links && g.links[0] && g.links[0].gebruik) || clubUrl(tok); const m = mailTekst(c, { link, arm: N(v.slice(1)), t: nu });
    const r = await verstuur({ aan: c.m, onderwerp: m.onderwerp, tekst: m.tekst, af: af(tok) });
    if (!r.ok) { uit.fouten.push(r.fout); await kv.raw(['LPUSH', 'cw:rij', id]); if (g && g.id) await P.uitkomst({ id: g.id, uitkomst: 'geen', toelichting: 'niet verstuurd: ' + r.fout }).catch(() => {}); break; }
    if (g && g.id) await P.uitkomst({ id: g.id, uitkomst: 'verstuurd' }).catch(() => {});
    Object.assign(c, { st: 'verstuurd', v, vo: nu, zid: r.id, pid: g && g.id, link }); await bewaar(c);
    await kv.raw(['RPUSH', 'cw:gestuurd', id]); await kv.raw(['HSET', 'cw:adresid', hk(c.m), id]); await tel('verstuurd', 1, nu); await arm(v, 'verstuurd'); S[v] = S[v] || {}; S[v].verstuurd = N(S[v].verstuurd) + 1;
    uit.verstuurd++; ruimte--; await new Promise(z => setTimeout(z, 4000 + Math.random() * 6000)); }
  await kv.set('cw:laatste', { at: nu, ...uit }).catch(() => {});
  return uit;
}

// ---------- 5. stand ----------
export async function stand() {
  const R = await regels(), tot = await hlees('cw:tot'), S = await armStand(R), o = await kv.get('cw:osm').catch(() => null);
  const rij = N(await kv.raw(['LLEN', 'cw:rij']).catch(() => 0)), scan = N(await kv.raw(['LLEN', 'cw:scan']).catch(() => 0)), alle = N(await kv.raw(['HLEN', 'cw:club']).catch(() => 0));
  const dagen = {}; for (let i = 0; i < 14; i++) { const d = dagNL(Date.now() - i * 864e5), t = await hlees('cw:tel:' + d); if (Object.keys(t).length) dagen[d] = t; }
  const L = [], V = N(tot.verstuurd);
  if (o && o.fout) L.push({ lek: 'OpenStreetMap gaf geen antwoord', cijfers: o.fout + (o.mis ? ' (mislukt: ' + Object.entries(o.mis).map(([k, v]) => k + ' ' + v + 'x').join(', ') + ')' : ''), gedaan: 'per provincie, 5 servers tegelijk, na een uur opnieuw; een mislukte provincie gaat achteraan, na 4 keer overgeslagen tot de volgende lezing', oordeel: 'volgende zoekronde (elke 2 uur)' });
  const over = o && o.mis ? Object.entries(o.mis).filter(([, v]) => v >= 4).map(([k]) => k) : []; if (over.length) L.push({ lek: 'provincie lukt niet bij OpenStreetMap', cijfers: over.join(', ') + ' 4 keer mislukt', gedaan: 'overgeslagen, de rest loopt door', oordeel: 'bij de volgende lezing na 60 dagen, of eerder: zet cw:osm.mis voor die provincie op 0' });
  if (N(tot.gescand) >= 200 && N(tot.klaar) / N(tot.gescand) < 0.05) L.push({ lek: 'weinig clubs met een adres op hun sponsorpagina', cijfers: tot.klaar + ' van ' + tot.gescand + ' sites', gedaan: 'zoeken op sponsor, businessclub, vrienden van en /sponsoring', oordeel: 'na 400 sites' });
  if (V >= 40 && !N(tot.zie) && !N(tot.antwoord)) L.push({ lek: 'niemand opent de clubpagina of antwoordt', cijfers: V + ' mails, 0 bekeken, 0 antwoorden', gedaan: 'onderwerpregels wisselen per 60 mails', oordeel: 'bij 60 mails per onderwerp' });
  if (N(tot.zie) >= 20 && !N(tot.aan)) L.push({ lek: 'clubs bekijken de pagina maar zetten hem niet aan', cijfers: tot.zie + ' keer bekeken, 0 aangezet', gedaan: 'nog niets: knop en eerste scherm van de clubpagina nakijken', oordeel: 'na 20 keer bekeken' });
  if (V >= 30 && (N(tot.bounce) / V >= 0.06 || N(tot.af) / V >= 0.05)) L.push({ lek: 'te veel bounces of afmeldingen', cijfers: tot.bounce + ' bounces, ' + tot.af + ' afmeldingen op ' + V, gedaan: 'volume automatisch gehalveerd', oordeel: 'elke werkdag' });
  if (R.aan && LIVE && !rij && !scan) L.push({ lek: 'rij leeg', cijfers: '0 clubs klaar', gedaan: 'OpenStreetMap wordt na 60 dagen opnieuw gelezen', oordeel: 'volgende zoekronde' });
  const bz = await hlees('cw:bezwaar'), lessen = ((await kv.raw(['LRANGE', 'cw:lessen', '-10', '-1']).catch(() => [])) || []).map(json).filter(Boolean).reverse();
  const antwoorden = Object.fromEntries(Object.entries(tot).filter(([k]) => /^antw-/.test(k)).map(([k, v]) => [k.slice(5), v]));
  if (N(tot.bekend) >= 5 && N(tot.bekend) > V) L.push({ lek: 'veel clubs staan al in je mailbox', cijfers: tot.bekend + ' overgeslagen, ' + V + ' gemaild', gedaan: 'overgeslagen, zoals afgesproken', oordeel: 'elke ronde' });
  for (const [b, n] of Object.entries(bz)) if (n >= 3) L.push({ lek: 'bezwaar komt terug: ' + b, cijfers: n + ' keer', gedaan: 'de leerronde past mail of clubpagina aan (op=clubs&leer=1)', oordeel: 'volgende leerronde' });
  const voorbeeld = []; for (const id of ((await kv.raw(['LRANGE', 'cw:rij', '0', '11']).catch(() => [])) || [])) { const c = await club(id); if (c) voorbeeld.push({ id: c.id, club: c.n, plaats: c.p || undefined, sport: c.s || undefined, adres: '…@' + String(c.m).split('@')[1], soort: c.mt || 'sponsor', pagina: c.mb }); }
  return { ok: true, live: LIVE && R.aan, wachtOp: await wachtOp(R), regels: R, gevonden: { inOsm: o ? N(o.n) : 0, provincies: o ? N(o.next) + ' van ' + PROV.length : '0 van 12', clubs: alle, teScannen: scan, klaarOmTeMailen: rij, geenAdres: N(tot.geen), gescand: N(tot.gescand) },
    totaal: tot, perOnderwerp: Object.fromEntries(Object.entries(S).map(([k, s]) => [k, { onderwerp: (lijst()[N(k.slice(1))] || ONDERWERPEN[0])('<club>'), ...s }])), kansBeste: R.armen.every(i => N(S['o' + i].verstuurd) > 0) ? kansBeste(S) : undefined,
    antwoorden, bezwaren: bz, lessen, extraOnderwerpen: R.extra || [], extraVragen: R.faq || [], dagen, lekken: L, laatsteRonde: await kv.get('cw:laatste').catch(() => null), volgendeInRij: voorbeeld };
}

// ---------- doorloop (Henkjan 23 nov 2026: "voor we gaan mailen wil ik hele flow live doorlopen en feedback geven . Van hele zegel systeem een stap voor stap") ----------
// Alleen op de beschermde host. Een proefclub (kopie van een echte club, met Henkjans eigen adres), een proefpartner (code test-...), proefleden die hij
// zelf aanmeldt en proefaankopen (PROEF-...) die nergens meetellen (lib/samensparen.js test, lib/partner.js test). Opruimen haalt alles weer weg.
async function doorloop({ req, res, q, thuis, base, pagina, leesBody }) {
  const SS = await import('./samensparen.js'), PT = await import('./partner.js'); let T = (await kv.get('cw:test').catch(() => null)) || null; const a = String(q.get('a') || ''), melding = [];
  const b = req.method === 'POST' ? await leesBody(req) : {}; const adresIn = String(b.mail || q.get('mail') || '').toLowerCase().trim();
  const D = base + '&doorloop=1', terug = m => { res.setHeader('location', D + (m ? '&ok=' + encodeURIComponent(m) : '') + '#' + (q.get('naar') || '')); return res.status(303).end(); };
  if (a === 'start') { const ik = await mijnAdres(); if (!ik) return terug('Geen mailbox gekoppeld in Zernio');
    const id0 = String(q.get('id') || '') || ((await kv.raw(['LRANGE', 'cw:rij', '0', '0']).catch(() => [])) || [])[0]; const c0 = id0 ? await club(id0) : null; if (!c0) return terug('Nog geen club klaar om te mailen');
    if (T && T.id) await kv.raw(['HDEL', 'cw:club', T.id]).catch(() => {});
    const c = { ...c0, id: 'test-' + c0.id, m: ik, test: 1, st: 'klaar' }; delete c.tok; delete c.vo; delete c.code; const tok = await zorgTok(c); await bewaar(c);
    T = { id: c.id, tok, club: c.n, at: Date.now(), leden: [], orders: [] }; const m = mailTekst(c, { link: thuis + '/api/gids?op=clubs&c=' + tok, arm: 0 });
    const r = await verstuur({ aan: ik, onderwerp: m.onderwerp, tekst: m.tekst, af: thuis + '/api/gids?op=clubs&af=' + tok }); T.mail = r.ok ? Date.now() : 0; T.mailFout = r.ok ? '' : r.fout; await kv.set('cw:test', T, { ex: 14 * 86400 });
    return terug(r.ok ? 'De clubmail staat in je inbox' : 'Mail lukte niet: ' + r.fout); }
  if (!T && a) return terug('Begin bij stap 1');
  if (a === 'koop') { if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(adresIn)) return terug('Vul het adres van het proeflid in'); const n = Math.max(1, Math.min(5, N(b.n || q.get('n')) || 1)); let z = 0, naar = '';
    for (let i = 0; i < n; i++) { const o = 'PROEF-' + randomBytes(4).toString('hex'); const r = await SS.ssProefKoop(adresIn, o); T.orders.push(o); z += N(r.zegels); naar = r.naar || naar; if (!r.lid) { T.leden = [...new Set([...T.leden, adresIn])]; await kv.set('cw:test', T, { ex: 14 * 86400 }); return terug('Dit adres spaart nog niet: meld je eerst aan als lid'); } }
    T.leden = [...new Set([...T.leden, adresIn])]; await kv.set('cw:test', T, { ex: 14 * 86400 }); return terug(n + (n === 1 ? ' proefaankoop' : ' proefaankopen') + ': ' + z + ' zegel(s) op de kaart' + (naar === 'lid' ? ', en 1 voor wie uitnodigde' : naar === 'partner' ? ', en €2 voor de club' : '')); }
  if (a === 'retour') { const o = (T.orders || []).slice(-1)[0]; if (!o) return terug('Nog geen proefaankoop'); await SS.ssRetour(o); return terug('Laatste proefaankoop teruggestuurd'); }
  if (a === 'opruimen') { const n = await SS.ssProefOpruimen([...(T.leden || []), ...String(b.extra || '').split(/[\s,;]+/).filter(x => /@/.test(x))], T.orders || []);
    if (T.code) await kv.del(['pt:p:' + T.code, 'pt:s:' + T.code, 'pt:o:' + T.code]).catch(() => {});
    if (T.id) await kv.raw(['HDEL', 'cw:club', T.id]).catch(() => {}); if (T.tok) await kv.raw(['HDEL', 'cw:tok', T.tok]).catch(() => {}); await kv.del(['cw:test']); return terug('Opgeruimd: proefclub, proefpartner, ' + n + ' proefleden en ' + (T.orders || []).length + ' proefaankopen'); }
  // ---------- de pagina ----------
  const ik = await mijnAdres(), [lok, dom] = ik.split('@'), plus = w => lok && dom ? lok + '+' + w + '@' + dom : '';
  const P = T && T.code ? await PT.partner(T.code) : null, ps = T && T.code ? await hlees('pt:s:' + T.code) : {}; const leden = []; for (const ad of (T && T.leden) || []) { const l = await SS.ssProefLid(ad); if (l) leden.push({ ad, ...l }); }
  const lidL = await SS.ssProefLid(plus('lid')), vriendL = await SS.ssProefLid(plus('vriend'));
  let mk = false; try { mk = await (await import('./kadoly-nieuws.js')).mailKlaar(); } catch (e) {}
  const v = x => x ? ' <b>(gedaan)</b>' : '', knop = (t, act, veld = '', n = 0) => `<form class="cw-f" method="post" action="${esc(D + '&a=' + act + '&naar=' + act)}">${veld}${n ? `<input type="hidden" name="n" value="${n}">` : ''}<button type="submit">${esc(t)}</button></form>`;
  const adresVeld = w => `<input type="email" name="mail" value="${esc(plus(w))}" required aria-label="Adres van het proeflid">`;
  const kaartL = l => l ? `<p>${esc(l.naam)}: ${l.stand.kaarten} volle kaart(en), ${l.stand.opKaart} van 5 op de huidige kaart${l.ok ? '' : '. <b>Nog niet bevestigd:</b> klik eerst op de knop in de welkomstmail'}${l.club ? '. Geeft zijn zegels aan de club' : ''}.</p><p><a href="${esc(thuis + '/api/gids?op=ss&m=' + l.id + '&k=' + l.k)}">Open de kaart van ${esc(l.naam)}</a></p>` : '';
  let x = `<p class="kicker">Doorloop · alles is proef</p><h1>Het hele zegelsysteem, stap voor stap</h1><p>Je speelt eerst de club, dan het lid en zijn vriend. Niets telt mee en aan het eind ruim je alles op. Feedback? Zet het stapnummer erbij in de chat.</p>`;
  if (q.get('ok')) x += `<div class="cw-k"><p><b>${esc(q.get('ok'))}</b></p></div>`;
  if (!mk) x += `<div class="cw-k"><p><b>Let op:</b> de mails van Samen sparen (Resend) staan nog niet klaar, dus stap 5, 6 en 8 geven geen mail.</p></div>`;
  x += `<h2 id="start">1. De mail die de club krijgt${v(T && T.mail)}</h2><p>Een echte club uit de rij${T ? ' (' + esc(T.club) + ')' : ''}, maar dan naar jouw eigen inbox${ik ? ' (' + esc(ik) + ')' : ''}, uit je eigen Gmail. Lees hem zoals een bestuurslid hem leest.</p>${knop(T ? 'Stuur hem opnieuw' : 'Stuur de clubmail naar mij', 'start')}`;
  if (T) {
    x += `<h2>2. De clubpagina${v(T.code)}</h2><p>Klik in de mail op de link, of <a href="${esc(base + '&c=' + T.tok)}">open de clubpagina hier</a>. Druk op de zwarte knop met jouw adres.</p>`;
    x += `<h2>3. Het dashboard van de club${v(P)}</h2>${P ? `<p><a href="${esc(thuis + '/api/gids?op=partner&c=' + T.code + '&k=' + T.k)}">Open het dashboard van ${esc(P.naam)}</a>. Nu: ${N(ps.bestel)} aankopen, €${(N(ps.cent) / 100).toFixed(2).replace('.', ',')} voor de club.</p>` : '<p>Komt na stap 2.</p>'}`;
    x += `<h2>4. Als lid: de clublink${v(lidL)}</h2>${P ? `<p><a href="${esc(thuis + '/api/gids?op=ss&pt=' + T.code)}">Open de clublink als lid</a> (zo komt een lid binnen via de groepsapp). Meld je aan met <b>${esc(plus('lid'))}</b>: dat komt gewoon in je eigen inbox.</p>` : '<p>Komt na stap 2.</p>'}`;
    x += `<h2>5. De welkomstmail${v(lidL && lidL.ok)}</h2><p>Open de mail in je inbox en klik op de zwarte knop. Daarmee bevestig je het adres; pas daarna komen de zegelmails.</p>${kaartL(lidL)}`;
    x += `<h2 id="koop">6. Het lid koopt iets</h2><p>Een proefaankoop, zoals de winkel hem doorgeeft. Kijk daarna naar de mail "Je bestelling gaf 1 zegel", de kaart en het clubdashboard (€2 erbij).</p>${knop('Doe een proefaankoop', 'koop', adresVeld('lid'))}`;
    x += `<h2>7. Een zegel doorgeven${v(vriendL)}</h2><p>Op de kaart van het lid: "Geef je zegel door". Open die link (dat mag gewoon in deze browser) en meld je aan als vriend met <b>${esc(plus('vriend'))}</b>. Kijk of de deadline klopt en of de zegel cadeau op de kaart staat.</p>${kaartL(vriendL)}`;
    x += `<h2>8. De vriend koopt iets</h2><p>Het lid krijgt dan een zegel en de mail "Vriend kocht iets: 1 zegel voor jou".</p>${knop('Proefaankoop van de vriend', 'koop', adresVeld('vriend'))}`;
    x += `<h2>9. Een volle kaart</h2><p>Drie aankopen erbij: de kaart is vol. Kijk naar de mail "Je kaart is vol", kies een cadeau en druk op "Neem nu" (dat opent WhatsApp naar jou).</p>${knop('Drie proefaankopen voor het lid', 'koop', adresVeld('lid'), 3)}`;
    x += `<h2>10. Zegels aan de club geven</h2><p>Zet op de kaart van het lid "geef mijn zegels aan de club" aan en doe dan nog een proefaankoop bij stap 6. De club krijgt dan €4 voor die aankoop: €2 omdat het lid via de club kwam en €2 voor zijn zegel.</p>`;
    x += `<h2>11. Een retour</h2><p>De laatste proefaankoop gaat terug: de zegel gaat eraf en het clubbedrag ook.</p>${knop('Stuur de laatste aankoop terug', 'retour')}`;
    x += `<h2>12. Opruimen</h2><p>Haalt de proefclub, het proefdashboard, de proefleden en alle proefaankopen weg.${leden.length ? ' Proefleden: ' + leden.map(l => esc(l.ad)).join(', ') + '.' : ''}</p><form class="cw-f" method="post" action="${esc(D + '&a=opruimen')}"><input type="text" name="extra" value="${esc([plus('lid'), plus('vriend')].filter(Boolean).join(' '))}" aria-label="Adressen van proefleden"><button type="submit">Ruim alles op</button></form>`;
  }
  return pagina('Doorloop zegelsysteem', x);
}

// ---------- 3. pagina's ----------
const CSS = `<style>.cw-k{border:1px solid #D7DCE8;border-radius:16px;padding:16px 18px;margin:0 0 16px}.cw-f{display:grid;gap:10px;max-width:520px}.cw-f input[type=text],.cw-f input[type=email]{min-height:48px;border:1.5px solid #111113;border-radius:12px;padding:10px 12px;font:inherit;background:#fff;color:#111113}.cw-f button{min-height:52px;border:0;border-radius:999px;background:#111113;color:#fff;font:700 16px/1.2 system-ui,sans-serif;padding:14px 22px;cursor:pointer}.cw-stap li{margin:0 0 8px}.cw-wa{white-space:pre-wrap}</style>`;
export async function clubOp({ req, res, q, host, ua, kaal, leesBody, isBot }) {
  res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
  const beschermd = /\.vercel\.app$/i.test(host), cron = (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(String(ua));
  let ptLive = false; try { ptLive = (await import('./partner.js')).LIVE; } catch (e) {}
  const thuis = beschermd ? 'https://' + host : HOST, base = thuis + '/api/gids?op=clubs';
  const pagina = (titel, inhoud, code = 200) => { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(code).send(kaal(titel, CSS + (ptLive && LIVE ? '' : '<div class="cw-k"><p><b>Concept.</b> Dit staat nog niet live; alleen jij ziet het hier.</p></div>') + inhoud, '<script src="https://go.kadoly.com/cm.js" data-site="kadolyclubs" async></script>')); };
  const naar = u => { res.setHeader('location', u); return res.status(303).end(); };

  // afmelden: link in de mail en one-click (List-Unsubscribe-Post); werkt altijd, ook als de rest uit staat
  if (q.get('af')) { const id = await kv.raw(['HGET', 'cw:tok', String(q.get('af')).slice(0, 20)]).catch(() => null); const c = id ? await club(id) : null;
    if (c && c.m && N(await kv.raw(['SADD', 'cw:af', hk(c.m)]).catch(() => 0))) { c.af = Date.now(); await markeer(c, 'af'); }
    if (req.method === 'POST') return res.status(200).send('ok');
    return pagina('Afgemeld', `<h1>Je krijgt geen mail meer van Kadoly</h1><p>${c ? esc(naamKort(c.n)) + ' staat op onze lijst om nooit meer te mailen.' : 'Dit adres staat op onze lijst om nooit meer te mailen.'} Vragen? Bel of app Henkjan: 06 55395630.</p>`); }

  if (beschermd || cron) {
    if (q.get('zoek') === '1') return res.status(200).json({ ok: true, ...(await zoek()) });
    if (q.get('ronde') === '1') return res.status(200).json(await ronde({ droog: q.get('droog') === '1' }));
  }
  if (beschermd) {
    if (q.get('stand') === '1') return res.status(200).json(await stand());
    if (q.get('zet') === '1') { const R = await regels(); const ok = []; // alleen op Henkjans woord (in de chat)
      if (q.has('aan')) { R.aan = q.get('aan') === '1'; ok.push('aan=' + R.aan); } if (q.has('perDag')) { R.perDag = Math.max(1, Math.min(R.max, N(q.get('perDag')) || R.perDag)); ok.push('perDag=' + R.perDag); }
      await zetRegels(R); return res.status(200).json({ ok: true, gezet: ok, regels: R }); }
    if (q.get('leer') === '1') { // voor de leerronde: elk nieuw antwoord met soort, bezwaren en tekst
      const tot = N(await kv.raw(['LLEN', 'cw:antw']).catch(() => 0)), van = N(await kv.get('cw:leer:pos').catch(() => 0)), ids = ((await kv.raw(['LRANGE', 'cw:antw', String(van), '-1']).catch(() => [])) || []), uitL = [];
      for (const id of ids.slice(0, 40)) { const c = await club(id); if (c && c.antw) uitL.push({ id: c.id, club: c.n, sport: c.s, onderwerp: c.v, bron: c.mt || 'sponsor', adresSoort: /^(sponsor|commerc|marketing)/.test(String(c.m)) ? 'sponsor' : /^(bestuur|secretar|voorzitter|penning)/.test(String(c.m)) ? 'bestuur' : /^(info|contact)/.test(String(c.m)) ? 'info' : 'persoon', aangezet: !!c.code, ...c.antw }); }
      if (q.get('klaar') === '1') await kv.set('cw:leer:pos', van + ids.slice(0, 40).length);
      const R = await regels(); return res.status(200).json({ ok: true, nieuw: uitL.length, totaal: tot, antwoorden: uitL, bezwaren: await hlees('cw:bezwaar'), perOnderwerp: await armStand(R), onderwerpen: lijst().map(f => f('<club>')), extraVragen: R.faq || [], uitleg: 'lees elk antwoord; zet per antwoord een les met op=clubs&les=<tekst>; komt iets 3 keer terug: &uitdager=<onderwerp met {club}> of &vraag=<vraag>|<antwoord> (clubpagina); daarna &leer=1&klaar=1' }); }
    if (q.get('les') || q.get('uitdager') || q.get('vraag')) { const R = await regels(), ok = [];
      if (q.get('les')) { await kv.raw(['RPUSH', 'cw:lessen', JSON.stringify({ dag: dagNL(), les: String(q.get('les')).slice(0, 300) })]); await kv.raw(['LTRIM', 'cw:lessen', '-200', '-1']); ok.push('les'); }
      if (q.get('uitdager')) { const t = String(q.get('uitdager')).replace(/[<>]/g, '').slice(0, 70); if (/\{club\}/.test(t) && t.replace('{club}', '').length <= 45) { R.extra = [...(R.extra || []), t].slice(-10); ok.push('uitdager'); } else ok.push('uitdager geweigerd: {club} erin en hooguit 60 tekens'); }
      if (q.get('vraag')) { const [v, a] = String(q.get('vraag')).replace(/[<>]/g, '').split('|'); if (v && a) { R.faq = [...(R.faq || []).filter(x => x[0] !== v.trim()), [v.trim().slice(0, 90), a.trim().slice(0, 400)]].slice(-6); ok.push('vraag'); } }
      await zetRegels(R); return res.status(200).json({ ok: true, gezet: ok }); }
    if (q.get('ztest') === '1') { const accs = await zAccounts(); const r = accs[0] ? await zApi('/email/messages?accountId=' + encodeURIComponent(accs[0]) + '&limit=1') : null; const vorm = x => x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).slice(0, 30).map(([k, v]) => [k, Array.isArray(v) ? 'lijst(' + v.length + ')' + (v[0] && typeof v[0] === 'object' ? ' ' + Object.keys(v[0]).join(',') : '') : typeof v])) : x; return res.status(200).json({ ok: true, sleutel: !!ZK(), mailboxen: accs.length, berichtenVorm: r ? { status: r.status, vorm: vorm(r.j) } : null }); }
    if (q.get('doorloop') === '1') return await doorloop({ req, res, q, thuis, base, pagina, leesBody });
    if (q.get('voorbeeld') === '1') { // de echte mail voor de volgende clubs in de rij, zoals hij de deur uit gaat
      const ids = q.get('id') ? [q.get('id')] : ((await kv.raw(['LRANGE', 'cw:rij', '0', '2']).catch(() => [])) || []); let x = '<p class="kicker">Clubwerving · voorbeeld</p><h1>Zo gaat de mail de deur uit</h1>';
      for (const id of ids) { const c = await club(id); if (!c) continue; const tok = await zorgTok(c); await bewaar(c); const R = await regels();
        for (const a of R.armen) { const m = mailTekst(c, { link: HOST + '/m/xxxxx', arm: a }); x += `<div class="cw-k"><p><b>Aan:</b> …@${esc(String(c.m || '').split('@')[1] || '')} (gevonden op <a href="${esc(c.mb)}">${esc(c.mb)}</a>)<br><b>Onderwerp ${'o' + a}:</b> ${esc(m.onderwerp)}</p><pre class="cw-wa">${esc(m.tekst)}</pre></div>`; }
        x += `<p><a href="${esc(base + '&c=' + tok)}">Bekijk de clubpagina voor ${esc(naamKort(c.n))}</a></p>`; }
      return pagina('Clubwerving: voorbeeld', x); }
  }

  // ---------- clubpagina ----------
  const tok = String(q.get('c') || '').slice(0, 20); const id = tok ? await kv.raw(['HGET', 'cw:tok', tok]).catch(() => null) : null; const c = id ? await club(id) : null;
  if (!c || !(beschermd || (ptLive && LIVE))) return res.status(404).send('Niet gevonden');
  const n = naamKort(c.n);
  if (req.method === 'POST') { if (isBot(ua)) return res.status(403).send('Niet toegestaan'); const b = await leesBody(req); if (b.website) return naar(base + '&c=' + tok);
    const mail = String(b.mail || '').toLowerCase().trim().slice(0, 120), naam = String(b.naam || n).replace(/[<>"]/g, '').trim().slice(0, 60) || n;
    if (!MAILRE.test(mail)) return naar(base + '&c=' + tok + '&fout=1#aan');
    if (c.code) { const PT = await import('./partner.js'); const P = await PT.partner(c.code); if (P) return pagina('Al aan', `<h1>De pagina voor ${esc(n)} staat al aan</h1><p>De link naar jullie pagina ging naar het adres dat hem aanzette. Kwijt? Bel of app Henkjan: 06 55395630.</p>`); }
    const PT = await import('./partner.js'); const { code, k } = await PT.maakPartner({ naam, mail, soort: 'club', web: c.w, extra: { cw: c.id, ...(c.test ? { test: 1 } : {}) } });
    c.code = code; c.st = 'actief'; if (c.test) { await bewaar(c); const T = (await kv.get('cw:test').catch(() => null)) || {}; T.code = code; T.k = k; await kv.set('cw:test', T); } else await markeer(c, 'aan');
    return naar(thuis + '/api/gids?op=partner&c=' + code + '&k=' + k + '&nieuw=1'); }
  if (!beschermd && !isBot(ua) && !c.zie) { c.zie = Date.now(); await markeer(c, 'zie'); }
  // Henkjan 23 nov 2026: "Alle schermen simpeler !! ZO min mogelijjk op een scherm": kop, één zin, het adres, één knop; de rest onder Hoe werkt het?
  let x = `<h1>${esc(n)} krijgt €2 bij elke aankoop van een lid</h1><p>Leden sparen er zelf een gratis cadeau mee. 50 aankopen is €100 voor de clubkas.</p>`;
  x += `${q.get('fout') === '1' ? '<p><b>Vul een geldig e-mailadres in.</b></p>' : ''}<form class="cw-f" id="aan" method="post" action="${esc(base + '&c=' + tok)}"><input type="hidden" name="naam" value="${esc(n)}"><input type="email" name="mail" value="${esc(c.m || '')}" required maxlength="120" autocomplete="email" aria-label="E-mailadres voor jullie link"><input type="text" name="website" value="" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><button type="submit">Zet de pagina aan</button></form><p style="font-size:14px">Gratis. Geen contract, stoppen kan altijd.</p>`;
  const vragen = [['Wat moeten we doen?', 'Eén bericht in de groepsapp of nieuwsbrief zetten. Elk lid dat via jullie link meespaart, blijft bij ' + n + ' horen.'], ['Wat kost het?', 'Niets, voor de club en voor de leden. Leden betalen dezelfde prijs als zonder jullie link.'], ['Moeten we iets verkopen?', 'Nee. Geen loten, geen voorraad, geen geld innen.'], ['Wat hebben leden eraan?', 'Elke aankoop geeft een zegel. 5 zegels is een gratis cadeau. Geeft een lid zijn eigen zegel aan de club, dan krijgt de club €4.'], ['Hoe krijgen we het geld?', 'Op jullie eigen pagina zie je elke aankoop. Vanaf €10 maken we het op de 1e van de maand over. Bij een retour gaat het bedrag van die aankoop eraf.'], ['Wie zijn jullie?', 'Kadoly is een cadeauwinkel van ADSFAIR B.V. in Gouda. Bel of app Henkjan de Krijger: 06 55395630.'], ...(((await regels()).faq) || [])];
  x += `<details style="margin:28px 0 0;border-top:1px solid #D7DCE8;padding:14px 0 0"><summary style="cursor:pointer;font-weight:700;text-decoration:underline">Hoe werkt het?</summary>${vragen.map(([v, a]) => `<p><b>${esc(v)}</b><br>${esc(a)}</p>`).join('')}<p style="font-size:14px">Je kreeg deze pagina omdat ${(c.mt || 'sponsor') === 'sponsor' ? esc(n) + ' een sponsorpagina heeft op ' + esc(domein(c.mb || c.w)) : 'jullie adres op ' + esc(domein(c.mb || c.w)) + ' staat'}. <a href="${esc(base + '&af=' + tok)}">Geen mail meer van Kadoly</a></p></details>`;
  return pagina('Sponsoring voor ' + n, x);
}
