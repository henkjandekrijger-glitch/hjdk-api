// Clubwerving van Kadoly (Henkjan 23 nov 2026: "Maak een mail voor verenigingen en clubs en vindt al die clubs om ze te mailen met een aanbieding
// die ze niet kunnen weerstaan dan gaan we er iedere dag 10 mailen . of meer . Dit moet lerend zijn .").
//
// Waarom zo en niet anders:
// - Wet: ongevraagde mail voor commerciële doelen mag in Nederland ook naar rechtspersonen alleen met toestemming, behalve naar gegevens die
//   juist daarvoor zijn bekendgemaakt (Telecommunicatiewet art. 11.7). Een info@-adres is dat niet. Een club die op zijn eigen sponsorpagina
//   vraagt om sponsors te mailen wel. Daarom mailen we alleen een adres dat op de sponsorpagina van de club zelf staat, en bewaren we die pagina
//   als bewijs (c.mb). Ons aanbod is ook echt sponsoring: de club krijgt geld per aankoop.
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
export function onderwerp(c, i) { const f = ONDERWERPEN[i] || ONDERWERPEN[0]; for (const lim of [38, 30, 24, 18, 12]) { const s = f(naamKort(c.n, lim)); if (s.length <= 60) return s; } return ONDERWERPEN[0](naamKort(c.n, 40)).slice(0, 60); }
function seizoen(t = Date.now()) { const { maand, dag } = nlDeel(t); if ((maand === 11 && dag >= 10) || (maand === 12 && dag <= 5)) return 'de komende weken hun Sinterklaas- en kerstcadeaus'; if (maand === 12 && dag <= 24) return 'de komende weken hun kerstcadeaus'; return 'hun cadeaus'; }
const ONDERTEKEN = 'Groet,\nHenkjan de Krijger\nKadoly, ADSFAIR B.V. in Gouda\n06 55395630 (bellen of WhatsApp: https://wa.me/31655395630)';
export function mailTekst(c, { link, arm = 0, opvolg = false, t = Date.now() } = {}) {
  const n = naamKort(c.n);
  if (opvolg) return { onderwerp: 'Re: ' + onderwerp(c, arm), tekst: `Hallo,\n\nNog een aanvulling op mijn mail over sponsoring. Een lid kan bij een aankoop zijn eigen zegel ook aan de club geven. Dan krijgt ${n} €4 voor die aankoop in plaats van €2.\n\nDe pagina voor ${n} staat nog klaar:\n${link}\n\nGroet,\nHenkjan de Krijger\n06 55395630\n\nLiever geen mail meer? Antwoord met stop.` };
  return { onderwerp: onderwerp(c, arm), tekst: `Hallo,\n\nIk las de sponsorpagina van ${n}. Ik heb een voorstel dat de club niets kost.\n\nIk ben Henkjan van Kadoly, een cadeauwinkel. Kopen leden ${seizoen(t)} via jullie clublink, dan krijgt ${n} €2 per aankoop. Leden betalen niets extra en sparen zelf mee: elke aankoop geeft een zegel, en een volle kaart van 5 zegels is al een cadeau gratis.\n\nIk heb alvast een pagina voor ${n} gemaakt, met jullie eigen link en een bericht voor de groepsapp:\n${link}\n\nMag ik weten wat je ervan vindt?\n\n${ONDERTEKEN}\n\nLiever geen mail meer van mij? Antwoord met stop, dan hoor je niets meer.` };
}

// ---------- opslag ----------
async function regels() { const r = await kv.get('cw:regels').catch(() => null); return { ...STD, ...(r && typeof r === 'object' ? r : {}) }; }
async function zetRegels(r) { await kv.set('cw:regels', r); }
async function club(id) { const s = await kv.raw(['HGET', 'cw:club', id]).catch(() => null); return s ? json(s) : null; }
async function bewaar(c) { await kv.raw(['HSET', 'cw:club', c.id, JSON.stringify(c)]); }
async function tel(wat, n = 1, t = Date.now()) { try { const k = 'cw:tel:' + dagNL(t); await kv.raw(['HINCRBY', k, wat, String(n)]); await kv.raw(['EXPIRE', k, String(120 * 86400)]); await kv.raw(['HINCRBY', 'cw:tot', wat, String(n)]); } catch (e) {} }
async function arm(v, wat, n = 1) { try { await kv.raw(['HINCRBY', 'cw:arm:' + v, wat, String(n)]); } catch (e) {} }
const hash = a => { const o = {}; for (let j = 0; j + 1 < (a || []).length; j += 2) o[a[j]] = N(a[j + 1]); return o; };
async function hlees(k) { return hash(await kv.raw(['HGETALL', k]).catch(() => [])); }

// ---------- 1. vinden: OpenStreetMap ----------
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
const NAAMRE = '^((s|v|h|t|k|z|r|b|w|l|m|g|c)[.]?(v|c|t|s)[.]?( |$)|(ltc|mhc|rfc|wsv|ltv|gtv|hcv|kc|kv|zc|rv|tv) )|vereniging|club|scouting|harmonie|fanfare|koor|majorette|drumband';
const PROV = ['NL-ZH', 'NL-NH', 'NL-UT', 'NL-NB', 'NL-GE', 'NL-OV', 'NL-LI', 'NL-FR', 'NL-GR', 'NL-DR', 'NL-FL', 'NL-ZE']; // per provincie: heel NL in één vraag gaf 406/504 (23 nov)
const query = p => `[out:json][timeout:100];area["ISO3166-2"="${p}"]->.p;(nwr["club"]["name"]["website"](area.p);nwr["club"]["name"]["contact:website"](area.p);nwr["sport"]["name"~"${NAAMRE}",i]["website"](area.p);nwr["sport"]["name"~"${NAAMRE}",i]["contact:website"](area.p););out tags;`;
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
  const p = PROV[o.next] || PROV[0], t0 = Date.now(), st = []; let j = null;
  for (const u of OVERPASS) { if (Date.now() - t0 > budget - 20000) break;
    try { const r = await fetch(u, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'gids.kadoly.com (clubzoeker)', accept: 'application/json' }, body: 'data=' + encodeURIComponent(query(p)), signal: AbortSignal.timeout(Math.min(105000, budget - (Date.now() - t0))) }); st.push(r.status); if (r.ok) { j = await r.json(); break; } } catch (e) { st.push(String(e.name || e).slice(0, 30)); } }
  if (!j || !Array.isArray(j.elements)) { o.fout = p + ': ' + st.join(','); o.foutAt = Date.now(); await kv.set('cw:osm', o); return { ok: false, provincie: p, status: st }; }
  const bekend = new Set((await kv.raw(['SMEMBERS', 'cw:domein']).catch(() => [])) || []);
  const nieuw = uitOsm(j.elements, bekend);
  for (let i = 0; i < nieuw.length; i += 300) { const deel = nieuw.slice(i, i + 300);
    await kv.raw(['HSET', 'cw:club', ...deel.flatMap(c => [c.id, JSON.stringify(c)])]); await kv.raw(['RPUSH', 'cw:scan', ...deel.map(c => c.id)]); await kv.raw(['SADD', 'cw:domein', ...deel.map(c => c.d)]); }
  o.next++; o.n = N(o.n) + nieuw.length; o.per = { ...(o.per || {}), [p]: nieuw.length }; delete o.fout; if (o.next >= PROV.length) o.klaar = Date.now(); o.at = Date.now();
  await kv.set('cw:osm', o); await tel('gevonden', nieuw.length);
  return { ok: true, provincie: p, elementen: j.elements.length, nieuw: nieuw.length };
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
export function score(adres, dom, naam) {
  const [l, d] = adres.split('@'); if (!l || !d) return -1;
  if (/^(no-?reply|webmaster|privacy|avg|abuse|postmaster|wordpress|example|test|ledenadministratie|ledenadmin|leden|administratie|jeugd|wedstrijd|scheidsrechter|kantine|materiaal|trainer|technisch|naam|uw|jouw|your|vertrouwens)/.test(l)) return -1;
  if (/\.(png|jpe?g|gif|webp|svg)$/.test(d) || /sentry|wixpress|example|domain\.|godaddy|w3\.org|schema\.org/.test(d)) return -1;
  const rol = /sponsor|commerc|marketing|business|zakelijk|partner|^pr$/.test(l) ? 5 : /bestuur|secretar|voorzitter|penningmeester|info|contact|vereniging|club/.test(l) ? 2 : 0;
  const eigen = d === dom || d.endsWith('.' + dom) || dom.endsWith('.' + d);
  if (eigen) return rol + 3;
  if (VRIJ.test(d)) { const tok = woorden(naam).some(w => l.includes(w)) || woorden(dom.split('.')[0]).some(w => l.includes(w)); return tok ? Math.max(2, rol + 1) : rol >= 2 ? rol + 1 : -1; }
  return rol >= 2 ? rol : -1; // ander domein: alleen een rol-adres, nooit iemands eigen werkadres
}
export function sponsorLinks(html, basis) {
  const dom = domein(basis), uit = new Map();
  for (const m of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]{0,300}?)<\/a>/gi)) {
    const txt = (m[2].replace(/<[^>]+>/g, ' ') + ' ' + m[1]).toLowerCase(); let s = 0;
    if (/sponsor/.test(txt)) s += 3; if (/word.?sponsor|sponsor.?worden|sponsoring|sponsormogelijkhed|sponsorpakket/.test(txt)) s += 2; if (/business.?club|club van \d+|vrienden van|adverteren/.test(txt)) s += 2;
    if (!s) continue; let u; try { u = new URL(m[1], basis); } catch (e) { continue; }
    if (!/^https?:$/.test(u.protocol) || /\.(pdf|jpe?g|png|docx?|zip)$/i.test(u.pathname)) continue; const hd = u.hostname.toLowerCase().replace(/^www\./, ''); if (hd !== dom && !hd.endsWith('.' + dom)) continue;
    u.hash = ''; const k = u.toString(); uit.set(k, Math.max(uit.get(k) || 0, s));
  }
  return [...uit.entries()].sort((a, b) => b[1] - a[1]).map(x => x[0]).slice(0, 2);
}
export async function scanClub(c, haalF = haal) {
  const thuis = await haalF(c.w); if (!thuis) return { st: 'geen', r: 'site' };
  const basis = thuis.url, dom = domein(basis) || c.d; let links = sponsorLinks(thuis.t, basis);
  const echt = links.length; if (!echt) links = [new URL('/sponsoring/', basis).toString()];
  for (const l of links) {
    const p = await haalF(l); if (!p || !/sponsor/i.test(p.t.replace(/<[^>]+>/g, ' '))) continue;
    const kies = adressen(p.t).map(a => ({ a, s: score(a, dom, c.n) })).filter(x => x.s >= 2).sort((x, y) => y.s - x.s);
    if (kies.length) return { st: 'klaar', m: kies[0].a, mb: p.url, d: dom };
  }
  return { st: 'geen', r: echt ? 'geen adres op sponsorpagina' : 'geen sponsorpagina' };
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
  if (!o || !o.klaar || Date.now() - o.klaar > 60 * 86400000) { if (!(o && o.foutAt && Date.now() - o.foutAt < 3600000)) uit.osm = await vindOsm(130000); } // na een fout een uur wachten
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
async function zAccount() {
  if (process.env.ZERNIO_MAIL_ACCOUNT) return process.env.ZERNIO_MAIL_ACCOUNT;
  const k = await kv.get('cw:zacc').catch(() => null); if (k && k.id && Date.now() - N(k.at) < 86400000) return k.id; if (!ZK()) return '';
  const r = await zApi('/accounts?limit=200'); const l = (r.j && (r.j.accounts || r.j.data || r.j.items)) || (Array.isArray(r.j) ? r.j : []);
  const a = l.find(x => /mail|gmail|google|outlook|microsoft|imap/i.test(String(x.platform || x.type || ''))); const id = a ? String(idVan(a) || '') : '';
  await kv.set('cw:zacc', { id, at: Date.now(), adres: a ? String(a.username || a.email || '').replace(/^(.).*(@.*)$/, '$1…$2') : '' }); return id;
}
async function verstuur({ aan, onderwerp: ond, tekst, af, antwoordOp }) {
  const acc = await zAccount(); if (!acc) return { ok: false, fout: 'geen mailbox gekoppeld in Zernio' };
  const body = { accountId: acc, to: [{ email: aan }], fromName: 'Henkjan de Krijger', subject: ond, text: tekst, headers: { 'List-Unsubscribe': '<' + af + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }, metadata: { stroom: 'kadoly-clubs' } };
  if (antwoordOp) body.replyToMessageId = antwoordOp;
  const r = await zApi('/email/messages', { method: 'POST', body }); return r.ok ? { ok: true, id: String(idVan(r.j) || '') } : { ok: false, fout: 'zernio ' + r.status + ' ' + String((r.j && (r.j.error && (r.j.error.code || r.j.error.message) || r.j.message)) || '').slice(0, 80) };
}
// antwoorden en bounces: eens per dag de mailbox nalopen op mail van de clubs die we mailden (laatste 21 dagen)
async function leesAntwoorden() {
  const acc = await zAccount(); if (!acc) return { gelezen: false };
  const ids = ((await kv.raw(['LRANGE', 'cw:gestuurd', '-400', '-1']).catch(() => [])) || []); const clubs = [];
  for (const id of ids) { const c = await club(id); if (c && c.m && c.vo && Date.now() - c.vo < 21 * 86400000 && !c.ant && !c.bo) clubs.push(c); }
  const uit = { gelezen: true, antwoord: 0, bounce: 0 }; const na = new Date(Date.now() - 22 * 86400000).toISOString();
  const lees = async q => { const r = await zApi('/email/threads?accountId=' + encodeURIComponent(acc) + '&after=' + encodeURIComponent(na) + '&limit=100&searchQueryNative=' + encodeURIComponent(q)); return r.ok ? JSON.stringify(r.j).toLowerCase() : ''; };
  for (let i = 0; i < clubs.length; i += 15) { const deel = clubs.slice(i, i + 15); const s = await lees('from:(' + deel.map(c => c.m).join(' OR ') + ')');
    for (const c of deel) if (s.includes(c.m)) { c.ant = Date.now(); uit.antwoord++; await markeer(c, 'ant'); } }
  const b = await lees('from:(mailer-daemon OR postmaster) newer_than:21d');
  for (const c of clubs) if (!c.ant && b.includes(c.m)) { c.bo = Date.now(); uit.bounce++; await markeer(c, 'bo'); }
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
    if (top[1] >= 0.95 && R.volgende < ONDERWERPEN.length) { const win = N(top[0].slice(1)), weg = R.armen.find(i => i !== win); R.armen = [win, R.volgende]; R.volgende++; R.gedaan = [...(R.gedaan || []), { dag: dagNL(), winnaar: 'o' + win, weg: 'o' + weg, kans: top[1] }].slice(-20); uit.push('onderwerp o' + win + ' wint (' + Math.round(top[1] * 100) + '%), o' + weg + ' eruit, o' + R.armen[1] + ' erbij'); } }
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
  if (!droog && (await kv.raw(['SET', 'cw:dag:' + dagNL(nu), '1', 'NX', 'EX', '90000']).catch(() => null)) === 'OK') { uit.antwoorden = await leesAntwoorden().catch(e => ({ fout: String(e.message).slice(0, 80) })); uit.geleerd = await leer(R); await zetRegels(R); }
  const vandaag = await hlees('cw:tel:' + dagNL(nu)); const per = Math.ceil(R.perDag / 6); let ruimte = Math.max(0, Math.min(per, R.perDag - N(vandaag.verstuurd)));
  const S = await armStand(R), P = await import('./postlus.js');
  // opvolgen: 7 dagen na de eerste mail, zonder antwoord, bounce, afmelding of aanmelding
  let opv = Math.max(1, Math.ceil(per / 2)); const ids = ((await kv.raw(['LRANGE', 'cw:gestuurd', '-300', '-1']).catch(() => [])) || []);
  for (const id of ids) { if (opv <= 0) break; const c = await club(id); if (!c || c.op || c.ant || c.bo || c.af || c.code || !c.zid || nu - N(c.vo) < 7 * 86400000 || nu - N(c.vo) > 14 * 86400000) continue;
    if (N(await kv.raw(['SISMEMBER', 'cw:af', hk(c.m)]).catch(() => 0))) continue;
    const m = mailTekst(c, { link: c.link, arm: N(String(c.v || 'o0').slice(1)), opvolg: true, t: nu });
    if (droog) { uit.opvolg++; opv--; continue; }
    const r = await verstuur({ aan: c.m, onderwerp: m.onderwerp, tekst: m.tekst, af: af(c.tok), antwoordOp: c.zid }); if (!r.ok) { uit.fouten.push(r.fout); break; }
    c.op = nu; await bewaar(c); await tel('opvolg'); await arm(c.v, 'opvolg'); uit.opvolg++; opv--; }
  // nieuwe clubs
  if (droog) { const k = ((await kv.raw(['LRANGE', 'cw:rij', '0', String(Math.max(0, ruimte - 1))]).catch(() => [])) || []); uit.verstuurd = k.length; uit.zouMailen = []; for (const id of k) { const c = await club(id); if (c) uit.zouMailen.push(c.n); } ruimte = 0; }
  while (ruimte > 0) { const id = await kv.raw(['LPOP', 'cw:rij']).catch(() => null); if (!id) { uit.rijLeeg = true; break; } const c = await club(id); if (!c || !c.m || c.vo) continue;
    if (N(await kv.raw(['SISMEMBER', 'cw:af', hk(c.m)]).catch(() => 0))) { c.st = 'af'; await bewaar(c); continue; }
    const v = kiesArm(R, S), tok = await zorgTok(c), mm = mailTekst(c, { link: '{link}', arm: N(v.slice(1)), t: nu });
    const g = await P.meld({ project: 'kadoly-clubs', doel: 'Club zet de klaarstaande sponsorpagina van Kadoly aan', aan: c.m, soort: 'organisatie', taal: 'nl', onderwerp: mm.onderwerp, variant: v, lessen: LESSEN, wie: 'clubwerving', links: clubUrl(tok) });
    const link = (g && g.links && g.links[0] && g.links[0].gebruik) || clubUrl(tok); const m = mailTekst(c, { link, arm: N(v.slice(1)), t: nu });
    const r = await verstuur({ aan: c.m, onderwerp: m.onderwerp, tekst: m.tekst, af: af(tok) });
    if (!r.ok) { uit.fouten.push(r.fout); await kv.raw(['LPUSH', 'cw:rij', id]); if (g && g.id) await P.uitkomst({ id: g.id, uitkomst: 'geen', toelichting: 'niet verstuurd: ' + r.fout }).catch(() => {}); break; }
    if (g && g.id) await P.uitkomst({ id: g.id, uitkomst: 'verstuurd' }).catch(() => {});
    Object.assign(c, { st: 'verstuurd', v, vo: nu, zid: r.id, pid: g && g.id, link }); await bewaar(c);
    await kv.raw(['RPUSH', 'cw:gestuurd', id]); await kv.raw(['HSET', 'cw:adresid', hk(c.m), id]); await tel('verstuurd', 1, nu); await arm(v, 'verstuurd'); S[v] = S[v] || {}; S[v].verstuurd = N(S[v].verstuurd) + 1;
    uit.verstuurd++; ruimte--; await new Promise(z => setTimeout(z, 4000 + Math.random() * 6000)); }
  await kv.set('cw:laatste', { at: nu, ...uit, antwoorden: undefined }).catch(() => {});
  return uit;
}

// ---------- 5. stand ----------
export async function stand() {
  const R = await regels(), tot = await hlees('cw:tot'), S = await armStand(R), o = await kv.get('cw:osm').catch(() => null);
  const rij = N(await kv.raw(['LLEN', 'cw:rij']).catch(() => 0)), scan = N(await kv.raw(['LLEN', 'cw:scan']).catch(() => 0)), alle = N(await kv.raw(['HLEN', 'cw:club']).catch(() => 0));
  const dagen = {}; for (let i = 0; i < 14; i++) { const d = dagNL(Date.now() - i * 864e5), t = await hlees('cw:tel:' + d); if (Object.keys(t).length) dagen[d] = t; }
  const L = [], V = N(tot.verstuurd);
  if (o && o.fout) L.push({ lek: 'OpenStreetMap gaf geen antwoord', cijfers: o.fout, gedaan: 'per provincie, 4 servers, na een uur opnieuw', oordeel: 'volgende zoekronde (elke 2 uur)' });
  if (N(tot.gescand) >= 200 && N(tot.klaar) / N(tot.gescand) < 0.05) L.push({ lek: 'weinig clubs met een adres op hun sponsorpagina', cijfers: tot.klaar + ' van ' + tot.gescand + ' sites', gedaan: 'zoeken op sponsor, businessclub, vrienden van en /sponsoring', oordeel: 'na 400 sites' });
  if (V >= 40 && !N(tot.zie) && !N(tot.antwoord)) L.push({ lek: 'niemand opent de clubpagina of antwoordt', cijfers: V + ' mails, 0 bekeken, 0 antwoorden', gedaan: 'onderwerpregels wisselen per 60 mails', oordeel: 'bij 60 mails per onderwerp' });
  if (N(tot.zie) >= 20 && !N(tot.aan)) L.push({ lek: 'clubs bekijken de pagina maar zetten hem niet aan', cijfers: tot.zie + ' keer bekeken, 0 aangezet', gedaan: 'nog niets: knop en eerste scherm van de clubpagina nakijken', oordeel: 'na 20 keer bekeken' });
  if (V >= 30 && (N(tot.bounce) / V >= 0.06 || N(tot.af) / V >= 0.05)) L.push({ lek: 'te veel bounces of afmeldingen', cijfers: tot.bounce + ' bounces, ' + tot.af + ' afmeldingen op ' + V, gedaan: 'volume automatisch gehalveerd', oordeel: 'elke werkdag' });
  if (R.aan && LIVE && !rij && !scan) L.push({ lek: 'rij leeg', cijfers: '0 clubs klaar', gedaan: 'OpenStreetMap wordt na 60 dagen opnieuw gelezen', oordeel: 'volgende zoekronde' });
  const voorbeeld = []; for (const id of ((await kv.raw(['LRANGE', 'cw:rij', '0', '11']).catch(() => [])) || [])) { const c = await club(id); if (c) voorbeeld.push({ id: c.id, club: c.n, plaats: c.p || undefined, sport: c.s || undefined, adres: '…@' + String(c.m).split('@')[1], sponsorpagina: c.mb }); }
  return { ok: true, live: LIVE && R.aan, wachtOp: await wachtOp(R), regels: R, gevonden: { inOsm: o ? N(o.n) : 0, provincies: o ? N(o.next) + ' van ' + PROV.length : '0 van 12', clubs: alle, teScannen: scan, klaarOmTeMailen: rij, geenAdres: N(tot.geen), gescand: N(tot.gescand) },
    totaal: tot, perOnderwerp: Object.fromEntries(Object.entries(S).map(([k, s]) => [k, { onderwerp: ONDERWERPEN[N(k.slice(1))]({ toString: () => '<club>' }), ...s }])), kansBeste: R.armen.every(i => N(S['o' + i].verstuurd) > 0) ? kansBeste(S) : undefined,
    dagen, lekken: L, laatsteRonde: await kv.get('cw:laatste').catch(() => null), volgendeInRij: voorbeeld };
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
    const PT = await import('./partner.js'); const { code, k } = await PT.maakPartner({ naam, mail, soort: 'club', web: c.w, extra: { cw: c.id } });
    c.code = code; c.st = 'actief'; await markeer(c, 'aan');
    return naar(thuis + '/api/gids?op=partner&c=' + code + '&k=' + k + '&nieuw=1'); }
  if (!beschermd && !isBot(ua) && !c.zie) { c.zie = Date.now(); await markeer(c, 'zie'); }
  const wa = `Koop je cadeaus via deze link en steun ${n}: de club krijgt €2 bij elke aankoop, en jij spaart mee. Elke aankoop geeft een zegel, 5 zegels is een cadeau gratis. [jullie link]`;
  let x = `<p class="kicker">Sponsoring door Kadoly</p><h1>${esc(n)} krijgt €2 bij elke aankoop van een lid</h1>`;
  x += `<div class="answer"><p><b>Deze pagina staat klaar voor ${esc(n)}.</b> Leden kopen hun cadeaus bij Kadoly via jullie link. De club krijgt €2 per aankoop en de leden sparen zelf een gratis cadeau. Het kost de club en de leden niets.</p><p>Voorbeeld: 50 aankopen is €100 voor de clubkas.</p></div>`;
  x += `<div class="cw-k" id="aan">${q.get('fout') === '1' ? '<p><b>Vul een geldig e-mailadres in.</b></p>' : ''}<form class="cw-f" method="post" action="${esc(base + '&c=' + tok)}"><input type="text" name="naam" value="${esc(n)}" maxlength="60" aria-label="Naam van de club"><input type="email" name="mail" value="${esc(c.m || '')}" required maxlength="120" autocomplete="email" aria-label="E-mailadres voor jullie link"><input type="text" name="website" value="" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><button type="submit">Zet de pagina aan voor ${esc(n)}</button></form><p class="meta">Je krijgt meteen jullie eigen link. Geen contract, stoppen kan altijd.</p></div>`;
  x += `<h2>Zo werkt het</h2><ol class="cw-stap"><li>Zet de pagina aan. Je krijgt meteen jullie eigen link en een bericht voor de groepsapp.</li><li>Deel het bericht in de app of nieuwsbrief van de club.</li><li>Elk lid dat via jullie link meespaart, blijft bij ${esc(n)} horen. Bij elke aankoop krijgt de club €2. Vanaf €10 maken we het over.</li></ol>`;
  x += `<h2>Dit bericht kunnen jullie delen</h2><div class="cw-k"><p class="cw-wa">${esc(wa)}</p></div>`;
  x += `<h2>Vragen</h2>${[['Wat kost het?', 'Niets, voor de club en voor de leden. Leden betalen dezelfde prijs als zonder jullie link.'], ['Moeten we iets verkopen?', 'Nee. Geen loten, geen voorraad, geen geld innen. Jullie delen alleen de link.'], ['Wat hebben leden eraan?', 'Elke aankoop geeft een zegel. Een kaart is 5 zegels, en een volle kaart is al een cadeau gratis. Een lid kan zijn eigen zegel ook aan de club geven: dan krijgt de club €4 voor die aankoop.'], ['Hoe krijgen we het geld?', 'Op jullie eigen pagina zie je elke aankoop en wat de club verdiende. Vanaf €10 maken we het over. Stuurt iemand iets terug, dan gaat het bedrag van die aankoop eraf.'], ['Kunnen we stoppen?', 'Ja, wanneer je wilt. Laat het weten, dan stopt de link.'], ['Wie zijn jullie?', 'Kadoly is een cadeauwinkel van ADSFAIR B.V. in Gouda. Vragen? Bel of app Henkjan de Krijger: 06 55395630.']].map(([v, a]) => `<details class="faq"><summary>${esc(v)}</summary><div class="a"><p>${esc(a)}</p></div></details>`).join('')}`;
  x += `<p class="meta">Je kreeg deze pagina omdat ${esc(n)} een sponsorpagina heeft op ${esc(domein(c.mb || c.w))}. <a href="${esc(base + '&af=' + tok)}">Geen mail meer van Kadoly</a></p>`;
  return pagina('Sponsoring voor ' + n, x);
}
