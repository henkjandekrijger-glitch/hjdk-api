// Keuzehulp als agent voor de AI-assistent van de bezoeker (Henkjan 19 nov 2026, over de centrale keuzehulp-chat: "Dit moet de agent worden
// waar mensen terugkomen. En die gaan ze koppelen aan hun assistent."). Openbare MCP-server (Streamable HTTP, JSON-RPC 2.0 over POST, geen login)
// op https://keuzehulp.best/mcp, https://whichtobuy.best/mcp en https://kaufberater.best/mcp; de taal volgt de host (?m=nl|us|de op de vercel.app-host).
// Tools: zoek_keuzehulp (catalogus van lib/kzchat.js), vraag_advies (kzChat zelf, bron 'mcp'), volg (willekeurige volgcode in KV) en wat_is_nieuw.
// Alles telt mee: intentielog (bron mcp), 100k-teller (via kzChat, één keer per sessie per wat), funnel per persoon (lib/funnel.js, bron mcp, mijlpaal
// 'gekoppeld' bij de eerste volg). Persoon = hash van de Mcp-Session-Id (of het IP als een client geen sessie meestuurt), na volg de volgcode.
// Geen namen, e-mail of IP-adressen in de opslag. Kosten: alleen de Haiku-aanroep die de chat al doet, onder het dagplafond van kzChat.
// Opslag: kzmcp:v:<code> volgrecord (180 dagen), kzmcp:d:<dag> tellers per site, kzmcp:rl:* tempo per 10 minuten.
// Uitlegpagina's: /koppel (NL), /connect (US), /verbinden (DE); ontdekbaar via llms.txt en /.well-known/mcp.json (servercard, SEP-2127-vorm).
import { createHash, randomBytes } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import { kv } from './db.js';

export const HOST = { nl: 'keuzehulp.best', us: 'whichtobuy.best', de: 'kaufberater.best' };
export const KOPPEL = { nl: '/koppel', us: '/connect', de: '/verbinden' };
const NAAM = { nl: 'Keuzehulp', us: 'Which To Buy', de: 'Kaufberater' };
const VERSIE = '1.0.0';
const PROTO = ['2026-07-28', '2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const GECHECKT = '2026-11-19';
const hash = s => createHash('sha256').update(String(s)).digest('hex');
const kort = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const dag = () => new Date().toISOString().slice(0, 10);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const zin = t => { t = kort(t, 400); const m = t.match(/^.{20,220}?[.!?](\s|$)/); return m ? m[0].trim() : t.length <= 200 ? t : t.slice(0, 200).replace(/\s\S*$/, '') + '…'; };

export function siteVan(req, q) {
  const m = String((q && q.get && q.get('m')) || '').toLowerCase(); if (HOST[m]) return m;
  const h = String((req && req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) || '').toLowerCase().replace(/^www\./, '').split(':')[0];
  return h === 'whichtobuy.best' ? 'us' : h === 'kaufberater.best' ? 'de' : 'nl';
}
export const mcpUrl = site => 'https://' + HOST[site] + '/mcp';

async function tel(site, ev, n = 1) { if (TEST.aan) return; const k = 'kzmcp:d:' + dag(); try { await kv.raw(['HINCRBY', k, site + ':' + String(ev).slice(0, 60), String(n)]); await kv.raw(['EXPIRE', k, String(120 * 86400)]); } catch (e) {} }

// ---------- catalogus ----------
async function catalogus(site) { try { const C = await import('./kzchat.js'); return (await C.alle(site)) || []; } catch (e) { return []; } }
function urlVan(site, x) { const p = typeof x.pad === 'string' && x.pad ? x.pad : '/' + x.slug; return /^https?:\/\//.test(p) ? p : 'https://' + HOST[site] + (p.charAt(0) === '/' ? p : '/' + p); }
const titelVan = x => kort(x.title || x.h1 || String(x.slug || '').replace(/-/g, ' '), 140);
async function zoekIn(site, vraag, all, n = 5) {
  const { woorden } = await import('./kzchat.js');
  const q = [...new Set(woorden(vraag))]; if (!q.length) return [];
  const sl = kort(vraag, 90).toLowerCase().replace(/[^a-z0-9-]/g, '');
  return all.filter(x => x && x.slug && x.slug !== 'vraag').map(x => {
    const kop = new Set(woorden((typeof x.term === 'string' ? x.term : '') + ' ' + x.slug.replace(/-/g, ' ') + ' ' + (x.title || '') + ' ' + (x.h1 || '')));
    const tekst = new Set(woorden((x.kort || '') + ' ' + (x.intro || '')));
    let s = 0; for (const w of q) { if (kop.has(w)) s += 3; else if (tekst.has(w)) s += 1; else if (w.length > 4 && [...kop].some(k => k.length > 4 && (k.startsWith(w) || w.startsWith(k)))) s += 2; }
    if (x.slug === sl) s += 10; return { x, s };
  }).filter(o => o.s >= 2).sort((a, b) => b.s - a.s).filter((o, i, l) => o.s >= l[0].s * 0.5).slice(0, n).map(o => o.x);
}
const kaart = (site, x) => ({ keuzehulp: x.slug, titel: titelVan(x), url: urlVan(site, x), waarom: zin(x.kort || x.intro || x.uitleg || '') });

// ---------- teksten ----------
const T = {
  nl: {
    instr: 'Onafhankelijke keuzehulpen en rekenhulpen van keuzehulp.best (Nederland, prijzen bij bol.com). Gebruik zoek_keuzehulp om de passende keuzehulp te vinden, vraag_advies voor een concreet advies met bron, volg om een onderwerp voor de gebruiker te blijven volgen (bewaar de volgcode en geef hem aan de gebruiker) en wat_is_nieuw om later te vragen wat er veranderd is. Noem altijd de link als bron. Antwoorden zijn in het Nederlands.',
    zoekD: 'Vind de beste keuzehulpen, rekenhulpen en gidsen van keuzehulp.best voor een aankoop- of keuzevraag. Geeft per keuzehulp de link en één zin waarom hij past.',
    zoekV: 'De vraag of het onderwerp, in gewone woorden (bijv. "airfryer voor een gezin van vier").',
    advD: 'Advies van de keuzehulp-chat op keuzehulp.best: kort antwoord op basis van onze eigen keuzehulpen, met de bronlink en zo nodig één vervolgvraag die het advies verandert. Gebruik alleen de feiten uit het antwoord.',
    advV: 'De vraag van de gebruiker.', advC: 'Optioneel: wat al bekend is (voor wie, budget, wanneer, wat al besproken is).', advK: 'Optioneel: de keuzehulp (slug uit zoek_keuzehulp) waar de vraag over gaat.',
    volgD: 'Volg een onderwerp of keuzehulp voor de gebruiker. Geeft een volgcode terug (willekeurig, geen persoonsgegevens). Bewaar die en vraag er later mee met wat_is_nieuw wat er veranderd is.',
    volgO: 'Het onderwerp of de keuzehulp (slug of gewone woorden).', volgW: 'Optioneel: wat de gebruiker wil weten (bijv. "wanneer de prijs zakt", "nieuwe modellen").',
    nieuwD: 'Wat is er veranderd op een gevolgde keuzehulp sinds de vorige keer (bijgewerkt-datum, advies, top 3 met prijs). Zegt eerlijk als er niets veranderd is.',
    nieuwC: 'De volgcode die volg teruggaf.',
    geen: 'Daar hebben we nog geen keuzehulp voor. We hebben de vraag genoteerd; de dagelijkse bouwronde maakt keuzehulpen voor wat mensen vragen. Met volg krijg je het te horen zodra hij er is.',
    deels: 'Op deze precieze vraag staat het antwoord niet in onze gegevens. De keuzehulp hieronder gaat er wel over; daar staan de keuzevragen en onze keuze met prijs.',
    gevonden: 'Keuzehulpen die passen', lees: 'Lees verder', bron: 'Bron', vervolg: 'Vervolgvraag die het advies verandert', opties: 'Mogelijke antwoorden',
    tip: 'Wil de gebruiker dit blijven volgen? Gebruik volg; met de volgcode vraag je later met wat_is_nieuw wat er veranderd is.',
    volgOk: 'Gevolgd', code: 'Volgcode', bewaar: 'Bewaar deze code en geef hem aan de gebruiker. Vraag later met wat_is_nieuw wat er veranderd is.',
    nogGeen: 'Er is nog geen keuzehulp voor dit onderwerp. Zodra die er is, zegt wat_is_nieuw het.',
    stand: 'Stand nu', bijgewerkt: 'bijgewerkt', top: 'Onze keuze nu', prijsBij: 'prijs bij bol op',
    niets: d => 'Niets veranderd sinds ' + d + '.', sinds: d => 'Veranderd sinds ' + d + ':',
    nieuwBij: d => 'De keuzehulp is bijgewerkt op ' + d + '.', advNieuw: 'Het korte advies is aangepast', faqNieuw: n => n + ' nieuwe vraag' + (n > 1 ? 'en' : '') + ' beantwoord.',
    inTop: 'Nieuw in onze keuze', prijs: 'Prijs', nuEr: 'Er is nu een keuzehulp voor dit onderwerp', onbekend: 'Deze volgcode kennen we niet (meer). Volg het onderwerp opnieuw met volg.',
    druk: 'Even te veel vragen tegelijk. Probeer het over een paar minuten opnieuw.', fout: 'Dat lukte niet. Probeer het opnieuw.', leeg: 'Geef een vraag of onderwerp mee.',
  },
  us: {
    instr: 'Independent buying guides and calculators from whichtobuy.best (United States, live Amazon results). Use zoek_keuzehulp to find the right guide, vraag_advies for concrete advice with a source, volg to keep following a topic for the user (keep the follow code and give it to the user) and wat_is_nieuw to ask later what changed. Always cite the link. Answers are in English.',
    zoekD: 'Find the best buying guides, calculators and checklists on whichtobuy.best for a buying or choice question. Returns the link and one sentence on why each guide fits.',
    zoekV: 'The question or topic in plain words (e.g. "air fryer for a family of four").',
    advD: 'Advice from the guide chat on whichtobuy.best: a short answer based on our own guides, with the source link and, if useful, one follow-up question that changes the advice. Use only the facts in the answer.',
    advV: 'The user question.', advC: 'Optional: what is already known (who it is for, budget, when, what was discussed).', advK: 'Optional: the guide (slug from zoek_keuzehulp) the question is about.',
    volgD: 'Follow a topic or guide for the user. Returns a follow code (random, no personal data). Keep it and use it later with wat_is_nieuw to ask what changed.',
    volgO: 'The topic or guide (slug or plain words).', volgW: 'Optional: what the user wants to know (e.g. "when the price drops", "new models").',
    nieuwD: 'What changed on a followed guide since the last check (updated date, advice). Says honestly when nothing changed.',
    nieuwC: 'The follow code returned by volg.',
    geen: 'We do not have a guide for that yet. We noted the question; our daily build round makes guides for what people ask. Use volg to hear when it is there.',
    deels: 'The exact answer to this question is not in our data. The guide below covers the topic, with its choice questions and our pick.',
    gevonden: 'Guides that fit', lees: 'Read more', bron: 'Source', vervolg: 'Follow-up question that changes the advice', opties: 'Possible answers',
    tip: 'Does the user want to keep following this? Use volg; with the follow code, wat_is_nieuw tells later what changed.',
    volgOk: 'Following', code: 'Follow code', bewaar: 'Keep this code and give it to the user. Ask later with wat_is_nieuw what changed.',
    nogGeen: 'There is no guide for this topic yet. As soon as there is one, wat_is_nieuw will say so.',
    stand: 'Now', bijgewerkt: 'updated', top: 'Our pick now', prijsBij: 'price on',
    niets: d => 'Nothing changed since ' + d + '.', sinds: d => 'Changed since ' + d + ':',
    nieuwBij: d => 'The guide was updated on ' + d + '.', advNieuw: 'The short advice changed', faqNieuw: n => n + ' new question' + (n > 1 ? 's' : '') + ' answered.',
    inTop: 'New in our pick', prijs: 'Price', nuEr: 'There is now a guide for this topic', onbekend: 'We do not know this follow code (anymore). Follow the topic again with volg.',
    druk: 'Too many requests at once. Please try again in a few minutes.', fout: 'That did not work. Please try again.', leeg: 'Please pass a question or topic.',
  },
  de: {
    instr: 'Unabhängige Kaufberater und Rechner von kaufberater.best (Deutschland, aktuelle Amazon-Ergebnisse). Nutze zoek_keuzehulp, um den passenden Ratgeber zu finden, vraag_advies für einen konkreten Rat mit Quelle, volg, um ein Thema für den Nutzer weiter zu verfolgen (Folgecode aufbewahren und dem Nutzer geben), und wat_is_nieuw, um später zu fragen, was sich geändert hat. Nenne immer den Link als Quelle. Antworten auf Deutsch.',
    zoekD: 'Finde die besten Kaufberater, Rechner und Ratgeber von kaufberater.best für eine Kauf- oder Auswahlfrage. Gibt je Ratgeber den Link und einen Satz, warum er passt.',
    zoekV: 'Die Frage oder das Thema in einfachen Worten (z. B. "Heißluftfritteuse für vier Personen").',
    advD: 'Rat aus dem Chat von kaufberater.best: kurze Antwort auf Basis unserer eigenen Ratgeber, mit Quellenlink und bei Bedarf einer Rückfrage, die den Rat ändert. Nutze nur die Fakten aus der Antwort.',
    advV: 'Die Frage des Nutzers.', advC: 'Optional: was schon bekannt ist (für wen, Budget, wann, was besprochen wurde).', advK: 'Optional: der Ratgeber (Slug aus zoek_keuzehulp), um den es geht.',
    volgD: 'Verfolge ein Thema oder einen Ratgeber für den Nutzer. Gibt einen Folgecode zurück (zufällig, keine persönlichen Daten). Aufbewahren und später mit wat_is_nieuw fragen, was sich geändert hat.',
    volgO: 'Das Thema oder der Ratgeber (Slug oder einfache Worte).', volgW: 'Optional: was der Nutzer wissen will (z. B. "wann der Preis fällt", "neue Modelle").',
    nieuwD: 'Was hat sich bei einem verfolgten Ratgeber seit dem letzten Mal geändert (Aktualisierungsdatum, Rat). Sagt ehrlich, wenn sich nichts geändert hat.',
    nieuwC: 'Der Folgecode von volg.',
    geen: 'Dafür haben wir noch keinen Ratgeber. Wir haben die Frage notiert; unsere tägliche Bau-Runde macht Ratgeber für das, was Menschen fragen. Mit volg erfährst du, wenn er da ist.',
    deels: 'Die genaue Antwort auf diese Frage steht nicht in unseren Daten. Der Ratgeber unten behandelt das Thema, mit Auswahlfragen und unserer Wahl.',
    gevonden: 'Passende Ratgeber', lees: 'Weiterlesen', bron: 'Quelle', vervolg: 'Rückfrage, die den Rat ändert', opties: 'Mögliche Antworten',
    tip: 'Will der Nutzer das weiter verfolgen? Nutze volg; mit dem Folgecode sagt wat_is_nieuw später, was sich geändert hat.',
    volgOk: 'Verfolgt', code: 'Folgecode', bewaar: 'Bewahre diesen Code auf und gib ihn dem Nutzer. Frag später mit wat_is_nieuw, was sich geändert hat.',
    nogGeen: 'Für dieses Thema gibt es noch keinen Ratgeber. Sobald es einen gibt, sagt wat_is_nieuw es.',
    stand: 'Jetzt', bijgewerkt: 'aktualisiert', top: 'Unsere Wahl jetzt', prijsBij: 'Preis am',
    niets: d => 'Nichts geändert seit ' + d + '.', sinds: d => 'Geändert seit ' + d + ':',
    nieuwBij: d => 'Der Ratgeber wurde am ' + d + ' aktualisiert.', advNieuw: 'Der kurze Rat wurde angepasst', faqNieuw: n => n + ' neue Frage' + (n > 1 ? 'n' : '') + ' beantwortet.',
    inTop: 'Neu in unserer Wahl', prijs: 'Preis', nuEr: 'Für dieses Thema gibt es jetzt einen Ratgeber', onbekend: 'Diesen Folgecode kennen wir nicht (mehr). Verfolge das Thema neu mit volg.',
    druk: 'Gerade zu viele Anfragen. Bitte in ein paar Minuten noch einmal.', fout: 'Das hat nicht geklappt. Bitte noch einmal.', leeg: 'Bitte eine Frage oder ein Thema mitgeben.',
  },
};

export function tools(site) {
  const t = T[site] || T.nl, s = (d) => ({ type: 'string', description: d });
  return [
    { name: 'zoek_keuzehulp', title: { nl: 'Zoek keuzehulp', us: 'Find a guide', de: 'Ratgeber finden' }[site], description: t.zoekD, inputSchema: { type: 'object', properties: { vraag: s(t.zoekV) }, required: ['vraag'], additionalProperties: false }, annotations: { readOnlyHint: true, openWorldHint: false } },
    { name: 'vraag_advies', title: { nl: 'Vraag advies', us: 'Ask for advice', de: 'Rat fragen' }[site], description: t.advD, inputSchema: { type: 'object', properties: { vraag: s(t.advV), context: s(t.advC), keuzehulp: s(t.advK) }, required: ['vraag'], additionalProperties: false }, annotations: { readOnlyHint: true, openWorldHint: false } },
    { name: 'volg', title: { nl: 'Volg onderwerp', us: 'Follow a topic', de: 'Thema verfolgen' }[site], description: t.volgD, inputSchema: { type: 'object', properties: { onderwerp: s(t.volgO), wat_je_wilt_weten: s(t.volgW) }, required: ['onderwerp'], additionalProperties: false }, annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false } },
    { name: 'wat_is_nieuw', title: { nl: 'Wat is nieuw', us: 'What changed', de: 'Was ist neu' }[site], description: t.nieuwD, inputSchema: { type: 'object', properties: { volgcode: s(t.nieuwC) }, required: ['volgcode'], additionalProperties: false }, annotations: { readOnlyHint: true, openWorldHint: false } },
  ];
}

// ---------- funnel en tempo ----------
const fnId = s => hash('kzmcp|' + s).slice(0, 16);
// zelftest (alleen beschermd): eigen aanroepen tellen nergens mee; per aanroep gezet uit de header x-kzmcp-test (afgeleid van CRON_SECRET)
const ALS = new AsyncLocalStorage(); const TEST = { get aan() { const st = ALS.getStore(); return !!(st && st.test); } };
const testSleutel = () => { const g = process.env.CRON_SECRET || process.env.KV_REDIS_URL || process.env.REDIS_URL || ''; return g ? hash('kzmcp-test|' + g).slice(0, 24) : ''; };
async function stap(id, st, o) { if (TEST.aan) return; try { const F = await import('./funnel.js'); await F.funnelStap(id, st, o, 'mcp'); } catch (e) {} }
async function magNog(ip, sk) {
  const b = Math.floor(Date.now() / 600000); const ks = [['kzmcp:rl:s:' + hash(sk || ip).slice(0, 20) + ':' + b, 40], ['kzmcp:rl:i:' + hash(ip).slice(0, 20) + ':' + b, 600]];
  try { for (const [k, max] of ks) { const n = N(await kv.raw(['INCR', k])); if (n === 1) await kv.raw(['EXPIRE', k, '700']); if (n > max) return false; } } catch (e) {}
  return true;
}
async function logIntentie(site, q, slug, m, wie) { if (TEST.aan) return; try { const I = await import('./intentie.js'); await I.intentieLog(kv, { q, site, slug, m, bron: 'mcp' }, { headers: { 'x-forwarded-for': 'mcp:' + wie } }); } catch (e) {} }

// ---------- stand van een keuzehulp voor volg/wat_is_nieuw ----------
const itemDatum = x => [x.updatedAt, x.publishAt].filter(Boolean).filter(d => d <= dag()).sort().pop() || '';
async function standVan(site, x) {
  const s = { d: itemDatum(x), k: hash(String(x.kort || x.intro || '')).slice(0, 12), kort: kort(x.kort || x.intro, 300), faq: Array.isArray(x.faq) ? x.faq.length : 0, top: [] };
  // hypotheekrente (19 nov 2026): de gemiddelde rente uit de DNB/ECB-reeks hoort bij de stand, zodat wat_is_nieuw een rentewijziging meldt
  if (site === 'nl' && /^hypotheek(rente|-berekenen)$/.test(x.slug)) { try { const HY = await import('./hypotheek.js'); const b = HY.renteBeweging(await HY.rentes()); if (b) s.rente = { m: b.maand, v: b.v, tekst: HY.bewegingTekst(b) }; } catch (e) {} }
  if (site === 'nl') { try { const t = await kv.get('hjdk:kz:sit:' + x.slug); if (t && Array.isArray(t.rijen)) { const z = new Set(); for (const r of t.rijen) { const p = kort(r.product, 90); if (!p || z.has(p)) continue; z.add(p); s.top.push({ p, prijs: N(r.prijs), dag: String(t.dag || '') }); if (s.top.length >= 3) break; } } } catch (e) {} }
  return s;
}
const eur = (site, n) => site === 'nl' || site === 'de' ? '€ ' + Number(n).toFixed(2).replace('.', ',') : '$' + Number(n).toFixed(2);
function topRegels(site, t, top) { return top.map(x => '- ' + x.p + (x.prijs ? ', ' + eur(site, x.prijs) + (x.dag ? ' (' + t.prijsBij + ' ' + x.dag + ')' : '') : '')); }

// ---------- tools ----------
async function zoekKeuzehulp(site, a, ctx) {
  const t = T[site]; const v = kort(a.vraag, 300); if (v.length < 2) return fout(t.leeg);
  const all = await catalogus(site); const hits = (await zoekIn(site, v, all, 5)).map(x => kaart(site, x));
  await logIntentie(site, v, hits[0] ? hits[0].keuzehulp : '', hits.length ? 1 : 0, ctx.wie); await stap(ctx.fn, 'zie', hits[0] ? hits[0].keuzehulp : 'mcp');
  if (!hits.length) return ok(t.geen + '\n\n' + t.tip, { gevonden: [], volgen_kan: true });
  return ok(t.gevonden + ':\n' + hits.map(h => '- ' + h.titel + ': ' + h.url + (h.waarom ? '\n  ' + h.waarom : '')).join('\n') + '\n\n' + t.tip, { gevonden: hits });
}

async function vraagAdvies(site, a, ctx) {
  const t = T[site]; const v = kort(a.vraag, 400); if (v.length < 2) return fout(t.leeg);
  const all = await catalogus(site); let slug = String(a.keuzehulp || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90);
  if (slug && !all.some(x => x.slug === slug)) { const h = await zoekIn(site, slug.replace(/-/g, ' '), all, 1); slug = h[0] ? h[0].slug : ''; }
  if (!slug) { const h = await zoekIn(site, v + ' ' + kort(a.context, 200), all, 1); slug = h[0] ? h[0].slug : 'vraag'; }
  const C = await import('./kzchat.js');
  const hist = a.context ? [['b', kort(a.context, 300)]] : [];
  const r = await C.kzChat({ site, slug, vraag: v, hist, ip: 'mcp|' + ctx.wie, oidc: ctx.oidc, sid: 'mcp' + ctx.wie.slice(0, 24), bron: 'mcp', test: !!TEST.aan }).catch(() => null);
  if (!r || !r.ok) return fout(t.fout);
  await stap(ctx.fn, 'vraag', slug);
  const bronnen = []; const zet = x => { if (x && x.slug !== 'vraag' && !bronnen.some(b => b.keuzehulp === x.slug)) bronnen.push(kaart(site, x)); };
  if (r.pagina) zet(all.find(x => x.slug === r.pagina)); zet(all.find(x => x.slug === slug));
  if (!bronnen.length) (await zoekIn(site, v, all, 2)).forEach(zet);
  let txt = !r.weet && bronnen.length ? t.deels : kort(r.a, 900);
  if (bronnen.length) txt += '\n\n' + (r.pagina ? t.lees : t.bron) + ':\n' + bronnen.slice(0, 3).map(b => '- ' + b.titel + ': ' + b.url).join('\n');
  if (r.vervolg) txt += '\n\n' + t.vervolg + ': ' + r.vervolg + (r.opties && r.opties.length ? ' (' + t.opties + ': ' + r.opties.join(' / ') + ')' : '');
  txt += '\n\n' + t.tip;
  return ok(txt, { antwoord: !r.weet && bronnen.length ? t.deels : r.a, weet: !!r.weet, bronnen, vervolgvraag: r.vervolg || '', opties: r.opties || [], intentie: r.i || {} });
}

async function volg(site, a, ctx) {
  const t = T[site]; const o = kort(a.onderwerp, 160); if (o.length < 2) return fout(t.leeg);
  const wil = kort(a.wat_je_wilt_weten, 200); const all = await catalogus(site);
  const sl = o.toLowerCase().replace(/[^a-z0-9-]/g, ''); let x = all.find(y => y.slug === sl && y.slug !== 'vraag') || (await zoekIn(site, o, all, 1))[0] || null;
  const code = randomBytes(10).toString('hex'); const nu = Date.now();
  const rec = { site, o, wil, slug: x ? x.slug : '', t: nu, l: nu, n: 0, s: x ? await standVan(site, x) : null };
  try { await kv.set('kzmcp:v:' + hash(code).slice(0, 40), rec, { ex: 180 * 86400 }); } catch (e) { return fout(t.fout); }
  await tel(site, 'volg'); if (!TEST.aan) { try { await kv.raw(['INCR', 'kzmcp:volg:tot']); } catch (e) {} }
  await logIntentie(site, o + (wil ? ' ' + wil : ''), rec.slug, x ? 1 : 0, ctx.wie);
  const vf = fnId('v' + code); try { const F = await import('./funnel.js'); await F.funnelKoppel(ctx.fn, vf); } catch (e) {} await stap(vf, 'koppel', rec.slug || 'mcp');
  let txt = t.volgOk + ': ' + (x ? titelVan(x) + ' (' + urlVan(site, x) + ')' : o) + '\n' + t.code + ': ' + code + '\n' + t.bewaar;
  if (!x) txt += '\n' + t.nogGeen;
  else { const s = rec.s; txt += '\n\n' + t.stand + (s.d ? ' (' + t.bijgewerkt + ' ' + s.d + ')' : '') + ': ' + zin(s.rente ? s.rente.tekst : s.kort); if (s.top.length) txt += '\n' + t.top + ':\n' + topRegels(site, t, s.top).join('\n'); }
  return ok(txt, { volgcode: code, keuzehulp: x ? kaart(site, x) : null, onderwerp: o, wat_je_wilt_weten: wil });
}

async function watIsNieuw(site, a, ctx) {
  const t0 = T[site]; const code = String(a.volgcode || '').trim().toLowerCase(); if (!/^[a-f0-9]{20}$/.test(code)) return fout(t0.onbekend);
  const k = 'kzmcp:v:' + hash(code).slice(0, 40); const rec = await kv.get(k).catch(() => null); if (!rec) return fout(t0.onbekend);
  const rs = HOST[rec.site] ? rec.site : site, t = T[rs]; const all = await catalogus(rs);
  let x = rec.slug ? all.find(y => y.slug === rec.slug) : null; const wijz = [];
  if (!x && !rec.slug) { x = (await zoekIn(rs, rec.o, all, 1))[0] || null; if (x) { wijz.push(t.nuEr + ': ' + titelVan(x) + ' (' + urlVan(rs, x) + ')'); rec.slug = x.slug; } }
  const sinds = new Date(rec.l || rec.t).toISOString().slice(0, 10);
  const nu = x ? await standVan(rs, x) : null, oud = rec.s || {};
  if (nu && rec.s) {
    if (nu.d && nu.d !== oud.d) wijz.push(t.nieuwBij(nu.d));
    const rw = nu.rente && (!oud.rente || oud.rente.m !== nu.rente.m || oud.rente.v !== nu.rente.v);
    if (rw) wijz.push(nu.rente.tekst + (oud.rente ? ' Vorige keer: ' + String(oud.rente.v).replace('.', ',') + '%.' : ''));
    if (nu.k !== oud.k && !nu.rente) wijz.push(t.advNieuw + ': ' + zin(nu.kort));
    if (nu.faq > N(oud.faq)) wijz.push(t.faqNieuw(nu.faq - N(oud.faq)));
    const oudP = Object.fromEntries((oud.top || []).map(y => [y.p, y]));
    for (const y of nu.top) { const z = oudP[y.p]; if (!z) wijz.push(t.inTop + ': ' + y.p + (y.prijs ? ', ' + eur(rs, y.prijs) + (y.dag ? ' (' + t.prijsBij + ' ' + y.dag + ')' : '') : '')); else if (y.prijs && z.prijs && Math.abs(y.prijs - z.prijs) >= 0.01) wijz.push(t.prijs + ' ' + y.p + ': ' + eur(rs, z.prijs) + ' > ' + eur(rs, y.prijs) + (y.dag ? ' (' + t.prijsBij + ' ' + y.dag + ')' : '')); }
  }
  rec.l = Date.now(); rec.n = N(rec.n) + 1; if (nu) rec.s = nu; await kv.set(k, rec, { ex: 180 * 86400 }).catch(() => null);
  await tel(rs, wijz.length ? 'nieuw_ja' : 'nieuw_nee'); await stap(fnId('v' + code), 'terug', rec.slug || 'mcp');
  let txt = (wijz.length ? t.sinds(sinds) + '\n' + wijz.map(w => '- ' + w).join('\n') : t.niets(sinds)) + '\n';
  if (x) { txt += '\n' + titelVan(x) + ': ' + urlVan(rs, x) + (nu && nu.d ? ' (' + t.bijgewerkt + ' ' + nu.d + ')' : ''); if (nu && nu.top.length) txt += '\n' + t.top + ':\n' + topRegels(rs, t, nu.top).join('\n'); }
  else txt += '\n' + t.nogGeen;
  return ok(txt, { veranderd: wijz.length > 0, sinds, wijzigingen: wijz, keuzehulp: x ? kaart(rs, x) : null, bijgewerkt: nu ? nu.d : '', top: nu ? nu.top : [] });
}

const ok = (text, data) => ({ content: [{ type: 'text', text }], structuredContent: data || {} });
const fout = text => ({ content: [{ type: 'text', text }], isError: true });
const RUN = { zoek_keuzehulp: zoekKeuzehulp, vraag_advies: vraagAdvies, volg, wat_is_nieuw: watIsNieuw };

// ---------- JSON-RPC ----------
function kiesProto(v) { return PROTO.includes(v) ? v : '2025-06-18'; }
function serverInfo(site) { return { name: { nl: 'keuzehulp', us: 'whichtobuy', de: 'kaufberater' }[site], title: NAAM[site], version: VERSIE, websiteUrl: 'https://' + HOST[site] + KOPPEL[site] }; }
async function rpc(site, m, ctx) {
  const id = m.id, method = String(m.method || ''), p = (m.params && typeof m.params === 'object') ? m.params : {};
  const res = result => ({ jsonrpc: '2.0', id, result }), err = (code, message) => ({ jsonrpc: '2.0', id: id === undefined ? null : id, error: { code, message } });
  if (method === 'initialize' || method === 'server/discover') {
    await tel(site, 'init'); const cn = kort(p.clientInfo && p.clientInfo.name, 40).toLowerCase().replace(/[^a-z0-9._-]/g, ''); if (cn) await tel(site, 'client:' + cn);
    return res({ protocolVersion: kiesProto(String(p.protocolVersion || '')), capabilities: { tools: { listChanged: false } }, serverInfo: serverInfo(site), instructions: T[site].instr });
  }
  if (method === 'ping') return res({});
  if (method === 'tools/list') return res({ tools: tools(site) });
  if (method === 'resources/list') return res({ resources: [] });
  if (method === 'resources/templates/list') return res({ resourceTemplates: [] });
  if (method === 'prompts/list') return res({ prompts: [] });
  if (method === 'tools/call') {
    const name = String(p.name || ''); const fn = RUN[name]; if (!fn) return err(-32602, 'Unknown tool: ' + name.slice(0, 60));
    const a = p.arguments && typeof p.arguments === 'object' ? p.arguments : {};
    await tel(site, 'call:' + name);
    if (!await magNog(ctx.ip, ctx.sk)) { await tel(site, 'limiet'); return res(fout(T[site].druk)); }
    try { return res(await fn(site, a, ctx)); } catch (e) { await tel(site, 'fout'); return res(fout(T[site].fout)); }
  }
  return err(-32601, 'Method not found: ' + method.slice(0, 60));
}

function cors(res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('access-control-allow-headers', 'Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID');
  res.setHeader('access-control-expose-headers', 'Mcp-Session-Id, Mcp-Protocol-Version');
  res.setHeader('access-control-max-age', '86400');
}

export function serverCard(site) {
  return { name: 'best.' + HOST[site].split('.')[0] + '/keuzehulp', title: NAAM[site], description: T[site].zoekD, version: VERSIE, websiteUrl: 'https://' + HOST[site] + KOPPEL[site],
    remotes: [{ type: 'streamable-http', url: mcpUrl(site) }], supportedProtocolVersions: PROTO };
}

// llms.txt-blok per site (fn/kz.js en fn/wtb.js)
export function llmsDeel(site) {
  site = HOST[site] ? site : 'nl'; const u = mcpUrl(site), p = 'https://' + HOST[site] + KOPPEL[site];
  if (site === 'us') return '\n## Connect your AI assistant (MCP)\n\n- MCP server (Streamable HTTP, no login): ' + u + '\n- Tools: zoek_keuzehulp (find a guide), vraag_advies (advice with source), volg (follow a topic, returns a follow code), wat_is_nieuw (what changed since last time)\n- How to add it to Claude or ChatGPT: [' + p + '](' + p + ')\n- Server card: https://' + HOST[site] + '/.well-known/mcp.json\n';
  if (site === 'de') return '\n## KI-Assistenten verbinden (MCP)\n\n- MCP-Server (Streamable HTTP, ohne Login): ' + u + '\n- Tools: zoek_keuzehulp (Ratgeber finden), vraag_advies (Rat mit Quelle), volg (Thema verfolgen, gibt einen Folgecode), wat_is_nieuw (was sich seitdem geändert hat)\n- So verbindest du ihn mit Claude oder ChatGPT: [' + p + '](' + p + ')\n- Server-Card: https://' + HOST[site] + '/.well-known/mcp.json\n';
  return '\n\n## Koppel je AI-assistent (MCP)\n\n- MCP-server (Streamable HTTP, geen login): ' + u + '\n- Tools: zoek_keuzehulp (vind de keuzehulp), vraag_advies (advies met bron), volg (volg een onderwerp, geeft een volgcode), wat_is_nieuw (wat er sindsdien veranderde)\n- Zo koppel je hem aan Claude of ChatGPT: [' + p + '](' + p + ')\n- Servercard: https://' + HOST[site] + '/.well-known/mcp.json';
}

export async function mcpStand() {
  const dagen = []; for (let i = 0; i < 14; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); let h = null; try { h = await kv.raw(['HGETALL', 'kzmcp:d:' + d]); } catch (e) {} const pr = Array.isArray(h) ? h : h ? Object.entries(h).flat() : []; const o = {}; for (let j = 0; j + 1 < pr.length; j += 2) o[pr[j]] = N(pr[j + 1]); dagen.push({ dag: d, ...o }); }
  let volgTot = 0; try { volgTot = N(await kv.raw(['GET', 'kzmcp:volg:tot'])); } catch (e) {}
  return { ok: true, uitleg: 'MCP-server van de keuzehulpen: per dag per site init (koppelingen), client:<naam>, call:<tool>, volg, nieuw_ja/nieuw_nee, limiet, fout, kopie (MCP-adres gekopieerd op de koppelpagina).', urls: Object.keys(HOST).map(mcpUrl), volgcodesTotaal: volgTot, dagen };
}

async function body(req) {
  let b = req.body;
  if (b === undefined && typeof req.on === 'function' && !req.readableEnded) b = await new Promise(r => { let s = ''; req.on('data', c => { s += c; if (s.length > 64000) req.destroy(); }); req.on('end', () => r(s)); req.on('error', () => r('')); });
  if (Buffer.isBuffer(b)) b = b.toString('utf8');
  if (typeof b === 'string') { if (b.length > 64000) throw new Error('groot'); b = JSON.parse(b); }
  return b;
}

export async function mcpHandler(req, res) {
  const url = new URL(req.url, 'https://keuzehulp.best'), q = url.searchParams, op = q.get('op') || '', site = siteVan(req, q);
  cors(res); res.setHeader('cache-control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (op === 'koppel') { const P = await import('./kzmcp-pagina.js'); return P.koppelPagina(req, res, site); }
  if (op === 'card') { res.setHeader('content-type', 'application/json; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=3600'); return res.status(200).send(JSON.stringify(serverCard(site), null, 2)); }
  if (op === 'selftest') { const besch = /\.vercel\.app$/i.test(String(req.headers.host || '')) || (process.env.CRON_SECRET && String(req.headers.authorization || '') === 'Bearer ' + process.env.CRON_SECRET); if (!besch) return res.status(403).json({ ok: false }); return res.status(200).json(await zelftest(String(q.get('doel') || site), q.get('advies') === '1')); }
  if (op === 'stand') { res.setHeader('x-robots-tag', 'noindex'); return res.status(200).json(await mcpStand()); }
  if (op === 'tik') { if (!/bot|crawl|spider|preview|headless/i.test(String(req.headers['user-agent'] || ''))) await tel(site, String(q.get('w') || '') === 'kopie' ? 'kopie' : 'tik'); return res.status(204).end(); }
  res.setHeader('x-robots-tag', 'noindex');
  if (req.method === 'DELETE') return res.status(204).end();
  const acc = String(req.headers.accept || '');
  if (req.method === 'GET' || req.method === 'HEAD') {
    if (/text\/html/.test(acc)) { res.setHeader('location', KOPPEL[site]); return res.status(302).end(); }
    if (/text\/event-stream/.test(acc)) { res.setHeader('allow', 'POST, DELETE, OPTIONS'); return res.status(405).json({ jsonrpc: '2.0', id: null, error: { code: -32000, message: 'Method not allowed: this server has no SSE stream, use POST.' } }); }
    res.setHeader('content-type', 'application/json; charset=utf-8'); return res.status(200).send(JSON.stringify(serverCard(site), null, 2));
  }
  if (req.method !== 'POST') { res.setHeader('allow', 'POST, GET, DELETE, OPTIONS'); return res.status(405).json({ jsonrpc: '2.0', id: null, error: { code: -32000, message: 'Method not allowed' } }); }
  let b; try { b = await body(req); } catch (e) { return res.status(400).json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); }
  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '').split(',')[0].trim() || 'onbekend';
  let sid = String(req.headers['mcp-session-id'] || ''); if (!/^[A-Za-z0-9._-]{8,128}$/.test(sid)) sid = '';
  const lijst = Array.isArray(b) ? b.slice(0, 20) : [b];
  if (!lijst.length || lijst.some(m => !m || typeof m !== 'object')) return res.status(400).json({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } });
  if (!sid && lijst.some(m => m.method === 'initialize')) sid = 'kz' + randomBytes(16).toString('hex');
  if (sid) res.setHeader('mcp-session-id', sid);
  const wie = hash('s|' + (sid || ip)).slice(0, 24);
  const ctx = { ip, sk: sid, wie, fn: fnId(sid || 'ip' + ip), oidc: String(req.headers['x-vercel-oidc-token'] || process.env.VERCEL_OIDC_TOKEN || '') };
  const test = !!(testSleutel() && String(req.headers['x-kzmcp-test'] || '') === testSleutel());
  const uit = await ALS.run({ test }, async () => { const u = [];
  for (const m of lijst) {
    if (m.jsonrpc !== '2.0') { if (m.id !== undefined) u.push({ jsonrpc: '2.0', id: m.id, error: { code: -32600, message: 'Invalid Request' } }); continue; }
    if (m.method === undefined || m.id === undefined || m.id === null) continue; // notificatie of antwoord van de client
    u.push(await rpc(site, m, ctx));
  } return u; });
  if (!uit.length) return res.status(202).end();
  const pv = lijst.find(m => m.method === 'initialize'); if (pv) res.setHeader('mcp-protocol-version', kiesProto(String((pv.params || {}).protocolVersion || '')));
  res.setHeader('content-type', 'application/json; charset=utf-8');
  return res.status(200).send(JSON.stringify(Array.isArray(b) ? uit : uit[0]));
}

// Zelftest van buitenaf: echte POSTs naar https://<host>/mcp zoals Claude en ChatGPT ze doen (via de echte routes), zonder mee te tellen.
async function zelftest(doel, advies) {
  const site = HOST[doel] ? doel : 'nl', url = mcpUrl(site), uit = { url, stappen: [] }; let sid = '', id = 0;
  const post = async (m, metSessie = true) => { const h = { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-06-18', 'user-agent': 'kzmcp-zelftest', 'x-kzmcp-test': testSleutel() }; if (metSessie && sid) h['mcp-session-id'] = sid;
    const t0 = Date.now(); const r = await fetch(url, { method: 'POST', headers: h, body: JSON.stringify(m), signal: AbortSignal.timeout(25000) }); const tx = await r.text(); let j = null; try { j = JSON.parse(tx); } catch (e) {}
    return { status: r.status, ct: r.headers.get('content-type') || '', sid: r.headers.get('mcp-session-id') || '', acao: r.headers.get('access-control-allow-origin') || '', ms: Date.now() - t0, j, tx: j ? '' : tx.slice(0, 200) }; };
  const kortR = r => ({ status: r.status, ms: r.ms, ct: r.ct, ...(r.j && r.j.error ? { fout: r.j.error } : {}), ...(r.tx ? { tekst: r.tx } : {}) });
  const tekstVan = r => r.j && r.j.result && r.j.result.content && r.j.result.content[0] ? kort(r.j.result.content[0].text, 500) : '';
  try {
    let r = await post({ jsonrpc: '2.0', id: ++id, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'kzmcp-zelftest', version: '1' } } }, false); sid = r.sid;
    uit.stappen.push({ stap: 'initialize', ...kortR(r), sessie: !!sid, cors: r.acao, versie: r.j && r.j.result && r.j.result.protocolVersion, server: r.j && r.j.result && r.j.result.serverInfo });
    r = await post({ jsonrpc: '2.0', method: 'notifications/initialized' }); uit.stappen.push({ stap: 'notifications/initialized', ...kortR(r) });
    r = await post({ jsonrpc: '2.0', id: ++id, method: 'tools/list' }); uit.stappen.push({ stap: 'tools/list', ...kortR(r), tools: r.j && r.j.result ? r.j.result.tools.map(x => x.name) : null });
    const q = { nl: 'airfryer voor een gezin van vier', us: 'air fryer for a family of four', de: 'Heißluftfritteuse für vier Personen' }[site];
    r = await post({ jsonrpc: '2.0', id: ++id, method: 'tools/call', params: { name: 'zoek_keuzehulp', arguments: { vraag: q } } }); uit.stappen.push({ stap: 'zoek_keuzehulp', ...kortR(r), tekst: tekstVan(r) });
    const eerste = r.j && r.j.result && r.j.result.structuredContent && (r.j.result.structuredContent.gevonden || [])[0];
    if (advies) { r = await post({ jsonrpc: '2.0', id: ++id, method: 'tools/call', params: { name: 'vraag_advies', arguments: { vraag: { nl: 'Welke inhoud heb ik nodig voor 4 personen?', us: 'What size do I need for 4 people?', de: 'Welche Größe brauche ich für 4 Personen?' }[site], context: { nl: 'budget 150 euro', us: 'budget 150 dollars', de: 'Budget 150 Euro' }[site], keuzehulp: eerste ? eerste.keuzehulp : '' } } }); uit.stappen.push({ stap: 'vraag_advies', ...kortR(r), tekst: tekstVan(r) }); }
    r = await post({ jsonrpc: '2.0', id: ++id, method: 'tools/call', params: { name: 'volg', arguments: { onderwerp: eerste ? eerste.keuzehulp : q, wat_je_wilt_weten: 'prijs' } } }); const code = r.j && r.j.result && r.j.result.structuredContent && r.j.result.structuredContent.volgcode; uit.stappen.push({ stap: 'volg', ...kortR(r), code: !!code, tekst: tekstVan(r) });
    if (code) { r = await post({ jsonrpc: '2.0', id: ++id, method: 'tools/call', params: { name: 'wat_is_nieuw', arguments: { volgcode: code } } }); uit.stappen.push({ stap: 'wat_is_nieuw', ...kortR(r), tekst: tekstVan(r) }); try { await kv.del(['kzmcp:v:' + hash(code).slice(0, 40)]); } catch (e) {} }
    r = await post({ jsonrpc: '2.0', id: ++id, method: 'tools/list' }, false); uit.stappen.push({ stap: 'tools/list zonder sessie', ...kortR(r) });
    const g = await fetch(url, { headers: { accept: 'text/event-stream' }, signal: AbortSignal.timeout(15000) }); uit.stappen.push({ stap: 'GET sse', status: g.status });
    const o = await fetch(url, { method: 'OPTIONS', headers: { origin: 'https://claude.ai', 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type,mcp-session-id,mcp-protocol-version' }, signal: AbortSignal.timeout(15000) }); uit.stappen.push({ stap: 'OPTIONS', status: o.status, headers: o.headers.get('access-control-allow-headers') });
  } catch (e) { uit.fout = String(e.message || e).slice(0, 200); }
  uit.ok = !uit.fout && uit.stappen.every(x => x.status < 400 || x.stap === 'GET sse') && uit.stappen.some(x => x.stap === 'wat_is_nieuw' && x.status === 200); return uit;
}
