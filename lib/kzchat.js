// Intentiechat op alle keuzehulpen (keuzehulp.best, whichtobuy.best, kaufberater.best). Henkjan 16 nov 2026: "ontwerp deze zelf lerende zelf
// reparerende hyper intelligente intent chat ook gericht op mensen om je heen" en "ja zeker" op bouwen op de WAM-motor, "Leer van elkaar".
// Van WAM overgenomen (lib/wam-overdracht.js, lessen 13 tot 16 nov): terugbereiken is het lek, dus na een antwoord eerst één tik op de
// hoogte blijven (push waar de site dat heeft); delen alleen rond een echte samen-beslissing; geen antwoord zonder bron; veiligheidsfilter
// en tempo (lib/wam-leer.js veilig, tempoOk); vaste dagkosten (KZ_CHAT_PLAFOND, standaard $3).
// Zelfreparerend: valt de AI uit (fout, geen sleutel, plafond), dan antwoordt een woordzoeker uit de eigen pagina. Elke vraag wordt een intentie
// (lib/intentie.js) met wat, voor wie, budget, wanneer en of het een samen-beslissing is; onbeantwoorde vragen in kz:chat:open voor de nachtronde.
import { createHash } from 'node:crypto';
import { kv } from './db.js';
import { berichten, HAIKU } from './ai.js';
import { mobiVraag } from './mobiliseer.js'; // wedervraag bij een bedrijf met een dossier (26 nov 2026)
import { intentieLog } from './intentie.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const kort = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
const dag = () => new Date().toISOString().slice(0, 10);
const TAAL = { nl: 'Dutch', us: 'English', de: 'German as written in Germany (with ß, e.g. Größe, not Grösse)', kadoly: 'Dutch' };
const HOST = { nl: 'keuzehulp.best', us: 'whichtobuy.best', de: 'kaufberater.best', kadoly: 'gids.kadoly.com' }; // kadoly: de gids van de webshop Kadoly (19 nov 2026, Henkjan: "gebruik de lerende chat die we nu in alle keuzehulpen aan het hangen zijn"), antwoorden uit de winkel via fn/gids.js kzKadoly
const NIET = { kadoly: 'Dat weet ik nu niet zeker. Vertel wat je zoekt, voor wie en wanneer, dan zoek ik mee. Henkjan van Kadoly helpt ook via WhatsApp.', nl: 'Daar hebben we nog geen keuzehulp voor, dus we maken er een. Vertel wat je zoekt, voor wie en wanneer, dan nemen we dat mee.', us: 'We do not have a guide for that yet, so we will make one. Tell me what you need, who it is for and when, and we will build it in.', de: 'Dafür haben wir noch keinen Ratgeber, also bauen wir einen. Sag mir, was du suchst, für wen und bis wann, dann nehmen wir das auf.' };
const DRUK = { kadoly: 'Het is even druk. Stel je vraag over een paar minuten opnieuw, of app Henkjan van Kadoly.', nl: 'Het is even druk. Stel je vraag over een paar minuten opnieuw.', us: 'It is busy right now. Please ask again in a few minutes.', de: 'Gerade ist viel los. Frag bitte in ein paar Minuten noch einmal.' };
const PLAFOND = () => Number(process.env.KZ_CHAT_PLAFOND || 3);
const STOP = new Set('de het een en of voor met van in op je jij bij wat hoe welke welk is zijn the a an and or for with of to what which how do does is are der die das ein eine und oder für mit von zu was wie welche ist ich my mijn mein kan can kann'.split(' '));
export const woorden = s => String(s || '').toLowerCase().replace(/[^a-z0-9à-ÿ ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));

// alle keuzehulpen van een site (NL uit fn/kz.js, US/DE uit lib/wtb.js), 10 minuten in het geheugen
const CACHE = {};
export async function alle(site) { // ook gebruikt door de MCP-server (lib/kzmcp.js)
  const c = CACHE[site]; if (c && Date.now() - c.at < 600000) return c.l;
  let l = [];
  if (site === 'kadoly') { const G = await import('../fn/gids.js'); l = await G.chatItems(); CACHE[site] = { at: Date.now(), l }; return l; } // gidsen, rubrieken en redactie van gids.kadoly.com
  if (site === 'nl') { const { allItems } = await import('../fn/kz.js'); l = await allItems(); try { const R = await import('./rdam.js'); l = l.concat(await R.chatItems()); } catch (e) {} try { const Z = await import('./zorg.js'); l = l.concat(Z.chatItems()); } catch (e) {} try { const HK = await import('./huiskopen.js'); l = l.concat(await HK.chatItems()); } catch (e) {} try { const RS = await import('./rijschool.js'); l = l.concat(await RS.chatItems()); } catch (e) {} try { const AD = await import('./advocaat.js'); l = l.concat(await AD.chatItems()); } catch (e) {} try { const HY = await import('./hypotheek.js'); l = l.concat(await HY.chatItems()); } catch (e) {} try { const HD = await import('./huisdier.js'); l = l.concat(HD.chatItems()); } catch (e) {} try { const B = await import('./stekkerbatterij.js'); const b = B.batteryItem(); const tb = l.find(x => x && x.slug === 'thuisbatterij') || {}; const extraFaq = (B.BATTERY_SECTIONS || []).map(([, h, ps]) => ({ q: h, a: (ps || []).join(' ') })).concat((tb.faq || []).filter(f => f && /stekker|plug-in|veilig|brand/i.test(String(f.q) + ' ' + String(f.a)))).concat((B.BATTERY_FAQ || []).map(([q, a]) => ({ q, a }))); const modellen = 'Modellen: ' + B.BATTERY_MODELS.map(m => m.name + ' (' + m.storage + '): ' + m.fit + ' Controleer: ' + m.check).join(' | '); const al = l.findIndex(x => x && x.slug === 'stekkerbatterij'); if (al >= 0) l[al] = { ...l[al], uitleg: modellen + ' ' + (l[al].uitleg || ''), faq: extraFaq.concat(l[al].faq || []) }; else l = l.concat([{ ...b, pad: '/stekkerbatterij', term: 'thuisbatterij met stekker', uitleg: modellen, faq: extraFaq }]); } catch (e) {} }
  if (site === 'nl') { try { const RH = await import('./rekenhulp.js'); l = RH.chatVerrijk(l); } catch (e) {} } // rekenhulpen (fietsmaat, maattabellen) in de catalogus, 19 nov 2026
  else { const W = await import('./wtb.js'); l = await W.items(W.MARKETS[site]); if (site === 'us') { try { const N = await import('./nexyhelp.js'); l = l.concat(N.chatItems()); } catch (e) {} try { const LW = await import('./lcwaarom.js'); l = l.concat(LW.chatItems()); } catch (e) {} } }
  try { const CH = await import('./chirurgie.js'); l = l.concat(CH.chatItems(site)); } catch (e) {} // keuzehulp chirurgie in nl, en en de (20 nov 2026)
  // voorkant (lib/cadeauvinder.js, slug vraag): algemene ingang; wijs de keuzehulp aan die past, en als er geen is: we maken er een (kzmaak/wtbmaak leest de vragen zonder antwoord)
  l = l.concat([{ slug: 'vraag', pad: '/', term: { nl: 'je keuze', us: 'your choice', de: 'deiner Wahl' }[site], title: { nl: 'Keuzehulp', us: 'Which To Buy', de: 'Kaufberater' }[site],
    kort: { nl: 'Dit is de voorkant. Zoek uit wat de bezoeker wil kiezen of regelen, vraag hoogstens één ding door, en wijs de keuzehulp aan die past (slug in pagina). Mist de bezoeker iets, vraag wat precies.', us: 'This is the front page. Find out what the visitor wants to choose or arrange, ask at most one follow-up, and point to the guide that fits (slug in pagina). If they miss something, ask what exactly.', de: 'Das ist die Startseite. Finde heraus, was der Besucher wählen oder regeln will, frag höchstens einmal nach und zeig den passenden Ratgeber (Slug in pagina). Fehlt ihm etwas, frag, was genau.' }[site] }]);
  // algemene chat (Henkjan 20 nov 2026: "algemene chat ... put uit alle keuzehulpen op een zeer strakke LP waar alleen veld en paar pills"; lib/cadeauvinder.js lpPagina, /chat):
  // antwoordt zelf met de feiten van de best passende keuzehulp (kennis zet die volledig in de context) en linkt die keuzehulp
  l = l.concat([{ slug: 'alles', alles: true, pad: '/chat', term: { nl: 'je vraag', us: 'your question', de: 'deine Frage' }[site], title: { nl: 'Vraag het de keuzehulp', us: 'Ask Which To Buy', de: 'Frag den Kaufberater' }[site],
    kort: 'This is the general chat that draws on every guide of the site. Answer the question yourself with the facts of BEST MATCHING GUIDE below: the concrete choice first, with its price and date when given. Always put the slug of that guide in pagina so the visitor can open it. If no guide matches, ask what exactly they want to choose and set weet to false.' }]);
  // vraag-eerst cadeauvinder (lib/cadeauvinder.js, slug cadeau-vinden): kent alle cadeaugidsen van de site, zodat de chat er een kan aanwijzen
  try { const GIFT = /cadeau|kado|sinterklaas|kerst|gift|christmas|stocking|geschenk|weihnacht|wichtel/i; const gids = l.filter(x => x && x.slug && GIFT.test(x.slug + ' ' + (x.title || ''))).slice(0, 60);
    l = l.concat([{ slug: 'cadeau-vinden', pad: { nl: '/cadeau-vinden', us: '/gift-finder', de: '/geschenk-finden' }[site], term: { nl: 'cadeau', us: 'gift', de: 'Geschenk' }[site], title: { nl: 'Cadeau vinden', us: 'Gift finder', de: 'Geschenk finden' }[site],
      kort: { nl: 'De bezoeker zoekt een cadeau. Vraag zo nodig naar budget of interesses en wijs de cadeaugids aan die het best past (zet de slug in pagina).', us: 'The visitor is looking for a gift. Ask for budget or interests if needed and point to the gift guide that fits best (put its slug in pagina).', de: 'Der Besucher sucht ein Geschenk. Frag bei Bedarf nach Budget oder Interessen und zeig den passenden Geschenkratgeber (Slug in pagina).' }[site],
      uitleg: 'Gift guides on this site (slug: title): ' + gids.map(x => x.slug + ': ' + kort(x.title || x.h1, 70)).join(' | ') }]); } catch (e) {}
  CACHE[site] = { at: Date.now(), l }; return l;
}

// wat de chat weet: de pagina zelf (kort antwoord, uitleg, fouten, vragen, FAQ), de producten met prijs van vandaag per situatie (NL) en de
// keuzehulpen die het best bij de vraag passen uit de hele catalogus (les curacao.day: de chat kent de hele catalogus)
const SPEC = new Set(['alles', 'vraag', 'cadeau-vinden']);
function blokVan(site, x, kop) { // alle feiten van één keuzehulp, voor de pagina zelf en voor de algemene chat
  const r = [kop + ' (slug ' + x.slug + '): ' + kort(x.title || x.h1, 140)];
  if (x.kort) r.push('Short answer: ' + kort(x.kort, 700));
  if (x.uitleg || x.guide) r.push('What matters: ' + kort(x.uitleg || x.guide, 2600));
  const fouten = x.fouten || x.mistakes; if (fouten && fouten.length) r.push('Common mistakes: ' + fouten.slice(0, 6).map(y => kort(y, 160)).join(' | '));
  (x.questions || []).forEach((q, i) => r.push('Choice question ' + (i + 1) + ': ' + kort(q.q, 120) + ' Options: ' + (q.options || []).map(o => kort(o.label, 60)).join(' / ')));
  (x.faq || []).slice(0, 18).forEach(f => r.push('FAQ: ' + kort(f.q, 160) + ' Answer: ' + kort(f.a, 500)));
  return r;
}
async function kennis(site, it, vraag, all) {
  const r = [];
  if (it && it.alles) { // algemene chat: de best passende keuzehulp volledig, met prijzen van vandaag (NL)
    const q = woorden(vraag); const sc = all.filter(x => x && x.slug && !SPEC.has(x.slug)).map(x => { const t = new Set(woorden((x.term || '') + ' ' + x.slug.replace(/-/g, ' '))), w = new Set(woorden(x.title || '')); return { x, s: q.filter(z => t.has(z)).length * 2 + q.filter(z => w.has(z)).length }; }).filter(o => o.s > 0).sort((a, b) => b.s - a.s);
    r.push(...blokVan(site, it, 'THIS PAGE'));
    if (sc[0]) { r.push(...blokVan(site, sc[0].x, 'BEST MATCHING GUIDE')); if (site === 'nl') { try { const t = await kv.get('hjdk:kz:sit:' + sc[0].x.slug); if (t && t.rijen) r.push('Products by situation, price at bol.com on ' + t.dag + ': ' + t.rijen.slice(0, 12).map(x => kort(x.situatie, 60) + ' -> ' + kort(x.product, 70) + ' EUR ' + Number(x.prijs).toFixed(2)).join(' | ')); } catch (e) {} } }
    if (sc.length > 1) r.push('OTHER GUIDES ON THIS SITE (slug: title: short answer): ' + sc.slice(1, 9).map(o => o.x.slug + ': ' + kort(o.x.title, 90) + ': ' + kort(o.x.kort || o.x.intro, 160)).join(' | '));
    return r.join('\n');
  }
  if (it) {
    r.push('THIS PAGE (slug ' + it.slug + '): ' + kort(it.title || it.h1, 140));
    if (it.kort) r.push('Short answer: ' + kort(it.kort, 700));
    if (it.uitleg || it.guide) r.push('What matters: ' + kort(it.uitleg || it.guide, 2600));
    const fouten = it.fouten || it.mistakes; if (fouten && fouten.length) r.push('Common mistakes: ' + fouten.slice(0, 6).map(x => kort(x, 160)).join(' | '));
    (it.questions || []).forEach((q, i) => r.push('Choice question ' + (i + 1) + ': ' + kort(q.q, 120) + ' Options: ' + (q.options || []).map(o => kort(o.label, 60)).join(' / ')));
    (it.faq || []).slice(0, 18).forEach(f => r.push('FAQ: ' + kort(f.q, 160) + ' Answer: ' + kort(f.a, 500)));
    if (site === 'nl') { try { const t = await kv.get('hjdk:kz:sit:' + it.slug); if (t && t.rijen) r.push('Products by situation, price at bol.com on ' + t.dag + ': ' + t.rijen.slice(0, 12).map(x => kort(x.situatie, 60) + ' -> ' + kort(x.product, 70) + ' EUR ' + Number(x.prijs).toFixed(2)).join(' | ')); } catch (e) {} }
  }
  const q = woorden(vraag); const sc = all.filter(x => x && x.slug && (!it || x.slug !== it.slug)).map(x => { const w = new Set(woorden((x.term || '') + ' ' + x.slug.replace(/-/g, ' ') + ' ' + (x.title || ''))); return { x, s: q.filter(z => w.has(z)).length }; }).filter(o => o.s > 0).sort((a, b) => b.s - a.s).slice(0, 12);
  if (sc.length) r.push('OTHER GUIDES ON THIS SITE (slug: title: short answer): ' + sc.map(o => o.x.slug + ': ' + kort(o.x.title, 90) + ': ' + kort(o.x.kort || o.x.intro, 160)).join(' | '));
  return r.join('\n');
}

// woordzoeker zonder AI (zelfreparatie): beste FAQ of kort antwoord van deze pagina, anders de best passende andere keuzehulp
function zoek(vraag, it, all) {
  const q = woorden(vraag); if (!q.length) return null;
  const tw = new Set(woorden(it && (it.term || it.title))); const qq = q.filter(w => !tw.has(w)); if (!qq.length) return null;
  let best = null;
  for (const f of (it && it.faq) || []) { const w = new Set(woorden(f.q + ' ' + f.a)); const s = qq.filter(x => w.has(x)).length + qq.filter(x => woorden(f.q).includes(x)).length; if (s >= 3 && (!best || s > best.s)) best = { s, a: kort(f.a, 600), pagina: '' }; }
  if (best) return best;
  for (const x of all) { if (it && x.slug === it.slug) continue; const w = new Set(woorden((x.term || '') + ' ' + x.slug.replace(/-/g, ' ') + ' ' + (x.title || ''))); const s = qq.filter(z => w.has(z)).length; if (s >= 2 && (!best || s > best.s)) best = { s, a: kort(x.kort || x.intro, 500), pagina: x.slug }; }
  return best;
}

// Reserve-antwoord (19 nov 2026, chat keuzehulp-pillfix): een chat eindigt nooit zonder antwoord. Geeft het model niets, faalt het, is het plafond
// bereikt of weet het het niet, dan de best passende keuzehulp uit de catalogus met link en één zin, plus pills om verder te gaan (andere passende
// keuzehulpen en het overzicht). Aanleiding: "Ik zoek: Fietsmaat. Voor: Collega. Budget: Middenklasse." kreeg om 11:00 UTC alleen "we maken er een",
// omdat /fietsmaat niet in de catalogus stond en het model daarom weet=false gaf. Bij pills zoeken we op de velden (wat, situatie), niet op de zinnetjes eromheen.
const RES = { nl: () => 'Hiervoor past deze keuzehulp het best, daar heb je in een paar tikken je antwoord.', us: () => 'This guide fits best, it gets you your answer in a few taps.', de: () => 'Dafür passt dieser Ratgeber am besten, dort hast du mit wenigen Klicks deine Antwort.' }; // de link met de titel zet de chat eronder
const TERUG = { nl: t => 'Dat kan ik nog niet plaatsen' + (t ? ' bij ' + t : '') + '. Wat bedoel je precies, of wat is er aan de hand? Typ het in een paar woorden, dan help ik je verder.', us: t => 'I cannot place that yet' + (t ? ' with ' + t : '') + '. What do you mean exactly, or what happened? Type it in a few words and I will help you further.', de: t => 'Das kann ich' + (t ? ' bei ' + t : '') + ' noch nicht einordnen. Was meinst du genau, oder was ist passiert? Schreib es in ein paar Worten, dann helfe ich dir weiter.' };
const OVERZICHT = { kadoly: [['Alle gidsen van Kadoly', '/'], ['Van de redactie', '/redactie']], nl: [['Alle keuzehulpen', '/keuzehulp'], ['Cadeau vinden', '/cadeau-vinden']], us: [['All guides', '/all'], ['Gift finder', '/gift-finder']], de: [['Alle Kaufberater', '/all'], ['Geschenk finden', '/geschenk-finden']] };
const padVan = (site, x) => x.pad || '/' + x.slug;
export function reserve(site, v, vel, it, all) {
  const bron = vel && (vel.wat || vel.situatie) ? [vel.wat, vel.situatie].filter(Boolean).join(' ') : v;
  const q = [...new Set(woorden(bron))]; const sc = [];
  for (const x of all || []) {
    if (!x || !x.slug || x.slug === 'vraag' || (it && x.slug === it.slug)) continue;
    const w = woorden((typeof x.term === 'string' ? x.term : '') + ' ' + x.slug.replace(/-/g, ' ') + ' ' + (x.title || ''));
    let s = 0; for (const z of q) { if (w.includes(z)) s += 2; else if (z.length >= 5 && w.some(y => y.length >= 4 && (z.includes(y) || y.includes(z)))) s += 1; }
    if (s >= 2) sc.push({ x, s });
  }
  sc.sort((a, b) => b.s - a.s || String(a.x.slug).length - String(b.x.slug).length);
  const ov = OVERZICHT[site] || OVERZICHT.nl;
  if (!sc.length) return { pagina: '', verder: ov };
  const b = sc[0].x, titel = kort(b.title || b.term, 90);
  return { pagina: b.slug, a: (RES[site] || RES.nl)(titel), verder: sc.slice(1, 3).map(o => [kort(o.x.title || o.x.term, 40), padVan(site, o.x)]).concat(ov.slice(0, 1)) };
}

// Pill-flow (19 nov 2026, Henkjan: "Dus je moet leren welke pills. Als geleerd kun je steeds minder tokens gebruiken en af en toe dan weer steekproeven doen."):
// velden uit pills gaan voor die van de AI; een advies na alleen pills (pc) komt uit de cache per pill-pad zodra het pad 3 keer hetzelfde advies gaf,
// met een steekproef van 5% naar het model (25% na een afwijking). Antwoord met prijs: sleutel met de dag, 1 dag geldig; zonder prijs 7 dagen.
const V4 = ['wat', 'voorWie', 'budget', 'wanneer'];
const prijsIn = a => /[€$]\s?\d|\d\s?(euro|eur|dollar)\b/i.test(String(a || ''));
function adviesSig(j) { const a = String((j && j.a) || ''); const pr = (a.match(/[€$]\s?\d[\d.,]*/g) || []).sort(); const nm = a.split(/[.!?]\s+/).flatMap(z => z.split(/\s+/).slice(1)).filter(w => /^[A-Z0-9][\w-]{2,}/.test(w)).slice(0, 3).sort(); return [(j && j.pagina) || '', pr.join(','), nm.join(',')].join('|'); }
// JSON van het model, ook als er een losse aanhalingsteken in de tekst staat (21 nov 2026, 01:44 UTC: 'Expected , or } after property value', bezoeker kreeg FAQ-tekst)
function leesJ(t) { try { return JSON.parse(t); } catch (e) {
  const a = /"a"\s*:\s*"([\s\S]*?)"\s*,\s*"weet"/.exec(t); if (!a) throw e;
  const veld = k => { const x = new RegExp('"' + k + '"\\s*:\\s*"([^"]*)"').exec(t); return x ? x[1] : ''; };
  const op = /"opties"\s*:\s*\[([^\]]*)\]/.exec(t); const opties = op ? (op[1].match(/"([^"]*)"/g) || []).map(x => x.slice(1, -1)) : [];
  return { a: a[1].replace(/\\"/g, '"'), weet: !/"weet"\s*:\s*false/.test(t), pagina: veld('pagina'), vraag: veld('vraag'), opties, intentie: {}, samen: /"samen"\s*:\s*true/.test(t) };
} }
const CV = 'v10:'; // v10 (27 nov 2026): veld kaart (koopknop US/DE), regels voorraad en oude prijzen; // v8 (20 nov 23:50 UTC): veld volg in elk bewaard antwoord; v7 (20 nov 2026, 23:20 UTC): geen opvulzin als slot ('Prices move daily, so check today\'s price ...'); v6: DE Marstek 'das Gerät ist zeitweise ausverkauft' (niet 'der Preis'); v3 (20 nov 2026): antwoordstijlen, elke stijl een eigen cache; v4: Duits met ß (Größe, niet Grösse); v5: geen antwoord zonder prijs bewaren als om een prijs gevraagd is
// Doorpraten leert (20 nov 2026, Henkjan: "Waarom ? !!" op: bijna elk gesprek stopt na één antwoord en niets verbetert dat antwoord).
// Per opgeslagen antwoord (pill-pad of eerste vraag) tellen we hoe vaak het getoond werd (toon) en hoe vaak dezelfde bezoeker daarna binnen
// 15 minuten op dezelfde pagina nog iets vroeg (door). Een antwoord dat na 20 keer minder dan 25% doorpraat krijgt een uitdager (b): het model
// schrijft een ander antwoord dat eindigt met één concrete keuzevraag. Daarna om en om; na 30 keer elk blijft de beste staan en verliest de ander.
// Stand per pagina: kz:door:d:<dag> (toon/door per site:slug), per antwoord kz:door:<cachesleutel>. Te lezen in tool=tafel&op=dialoog (door).
const DOOR_MIN = 20, DOOR_DOEL = 0.25, DOOR_DUEL = 30;
// Dieper gesprek (20 nov 2026, Henkjan: "Gesprekken moeten echt veeel veeel veeel dieper vind gedrag waardoor je in gesprek blijft ."):
// vier antwoordstijlen strijden om doorpraten (vraagt dezelfde bezoeker binnen 15 minuten opnieuw iets). Thompson-steekproef per markt op
// kz:door:stijl (site:stijl:toon/door), dus de stijl die mensen in gesprek houdt krijgt vanzelf het meeste verkeer. a = zoals het was (controle).
export const STIJLEN = {
  a: { naam: 'Zoals het was: antwoord, vervolgvraag alleen als die het advies verandert', p: '' },
  b: { naam: 'Kort en altijd een vraag: de keus in één zin, dan één vraag die de keus scherper maakt', p: '\n- Style: give the concrete pick in ONE sentence. Then ALWAYS ask one question about their own situation that sharpens the pick, with 3 tappable answers in opties. Never end without a question.' },
  c: { naam: 'Open lus: de keus, dan het ene ding dat hem nog kan omgooien, en één antwoord tot je exacte match', p: '\n- Style: give the pick in one or two sentences. Then name the one thing in their situation that could still change it (their use, space, budget or timing) and ask about exactly that, with 3 tappable answers in opties. Say that one more answer gives them their exact match. Never end without a question.' },
  d: { naam: 'Spiegel en kies: hun situatie in een paar woorden, twee opties tegenover elkaar, welke ben jij', p: '\n- Style: mirror their situation in a few words. Then set two concrete options from the facts against each other (this one if X, that one if Y) and ask which situation is theirs; the situations are the 2 or 3 tappable answers in opties. Never end without a question.' },
};
const DIEP = '\n- If the visitor already answered one of your questions: build on exactly what they said, never repeat an earlier answer, and go one step deeper toward a decision (the exact pick for them, then the one practical thing they need next: what to check, where, what it costs per month or when to buy). Keep offering the next step as a question with opties.\n- Each tappable answer in opties is at most 4 words and complete, never cut off.\n- Never end the answer with a general tip such as checking today\'s price, prices changing or reading the page: the last sentence is the most useful fact for them, the follow-up goes in vraag.';
async function kiesStijl(site) {
  const r = await kv.raw(['HGETALL', 'kz:door:stijl2']).catch(() => null); const h = {}; if (Array.isArray(r)) for (let i = 0; i + 1 < r.length; i += 2) h[r[i]] = N(r[i + 1]);
  const beta = (a, b) => { const g = k => { let x = 0; for (let i = 0; i < k; i++) x -= Math.log(Math.random()); return x; }; const A = g(Math.min(a, 400)), B = g(Math.min(b, 400)); return A / (A + B); }; // gehele parameters, begrensd
  let best = 'a', bs = -1; for (const k of Object.keys(STIJLEN)) { const t = h[site + ':' + k + ':toon'] || 0, dd = Math.min(t, h[site + ':' + k + ':door'] || 0), x = beta(dd + 1, t - dd + 1); if (x > bs) { bs = x; best = k; } }
  return best;
}
export async function stijlStand() { const r = await kv.raw(['HGETALL', 'kz:door:stijl2']).catch(() => null); const o = {}; if (Array.isArray(r)) for (let i = 0; i + 1 < r.length; i += 2) { const m = /^(\w+):(\w):(toon|door)$/.exec(r[i]); if (m) { const k = m[1] + ':' + m[2]; (o[k] = o[k] || { site: m[1], stijl: m[2], naam: (STIJLEN[m[2]] || {}).naam || '', toon: 0, door: 0 })[m[3]] = N(r[i + 1]); } } return Object.values(o).map(x => ({ ...x, pct: x.toon ? Math.round(100 * x.door / x.toon) : 0 })).sort((a, b) => a.site < b.site ? -1 : a.site > b.site ? 1 : b.pct - a.pct); }
const UITDAGER = '\n- Earlier answers to this exact question made most visitors stop chatting. Write a better answer: first the one fact that matters most for their situation, then ask ONE concrete question that helps them decide (their use, size or budget) and give 2 or 3 tappable answers for it in opties. Do not only name one product with its price.';
async function doorStats(ck) { const r = await kv.raw(['HGETALL', 'kz:door:' + ck]).catch(() => null); const o = {}; if (Array.isArray(r)) for (let i = 0; i + 1 < r.length; i += 2) o[r[i]] = N(r[i + 1]); else if (r) for (const k in r) o[k] = N(r[k]); return o; }
const ratio = (st, v) => (st[v + ':door'] || 0) / Math.max(1, st[v + ':toon'] || 0);
export async function doorStand(d) { const r = await kv.raw(['HGETALL', 'kz:door:d:' + d]).catch(() => null); const o = {}; if (Array.isArray(r)) for (let i = 0; i + 1 < r.length; i += 2) { const [k, x] = [r[i].replace(/:(toon|door)$/, ''), r[i].match(/(toon|door)$/)[1]]; (o[k] = o[k] || { toon: 0, door: 0 })[x] = N(r[i + 1]); } return Object.entries(o).map(([k, x]) => ({ pagina: k, ...x, pct: x.toon ? Math.round(100 * x.door / x.toon) : 0 })).sort((a, b) => b.toon - a.toon).slice(0, 20); }
const pcTel = (d, k) => kv.raw(['HINCRBY', 'kz:pc:d:' + d, k, '1']).then(() => kv.raw(['EXPIRE', 'kz:pc:d:' + d, String(40 * 86400)])).catch(() => null);

// Eén woord zonder betekenis (tnrqqvmvk, Ifydtz7, saaqfbvfh): bijna geen klinkers of 5+ medeklinkers op rij, en het woord staat niet op de pagina.
// Echte losse woorden (lampen, 2026, Schwarzspeicher, iPhone17) blijven door.
export function isOnzin(v, it) {
  const w = String(v || '').trim().toLowerCase();
  if (!/^[a-z0-9äöüß]{4,20}$/.test(w) || /^\d+$/.test(w)) return false;
  const letters = w.replace(/[^a-zäöüß]/g, ''); if (letters.length < 4) return false;
  try { if (it && JSON.stringify(it).toLowerCase().includes(w)) return false; } catch (e) {}
  const klink = (letters.match(/[aeiouyäöü]/g) || []).length / letters.length;
  const run = Math.max(0, ...(letters.match(/[^aeiouäöü]+/g) || []).map(x => x.length));
  return klink < 0.2 || run >= 5;
}

// Winkelkaarten in de chat (21 nov 2026, Henkjan: "laat ze via chat klikken en onderzoeken en biedt bol of coolblue aan"): op keuzehulp.best
// krijgt een antwoord dat een product uit de situatietabel van vandaag noemt (hjdk:kz:sit:<slug>, bol-prijs met datum) die productkaart met de
// bol-partnerlink, plus één kaart om hetzelfde product bij Coolblue te bekijken (Awin via lib/aff.js, met ons klik-ID). De bol-subId krijgt -chat
// en, bij campagneverkeer, -Z<zone>-<klikcode>, zodat /api/bol/learn de order aan zone en campagne koppelt.
function kortId(s) { let h1 = 0x811c9dc5, h2 = 0x01000193; for (let i = 0; i < s.length; i++) { const ch = s.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 16777619) >>> 0; h2 = Math.imul(h2 + ch, 2246822519) >>> 0; } return (h1.toString(36) + h2.toString(36)).slice(0, 10); } // zelfde als shortId in fn/kz.js
const woordenP = s => String(s || '').toLowerCase().replace(/[^a-z0-9à-ÿ ]/g, ' ').split(/\s+/).filter(w => w.length > 2);
// Koopknop onder het advies op whichtobuy.best en kaufberater.best (27 nov 2026, Henkjan: "Ja doorvoeren", analyse: 1.395 chats op de
// balkonkraftwerk-pagina gaven 50 winkelkliks): per productnaam die het model in kaart zet de prijs van vandaag via de Amazon-API (6 uur cache,
// hooguit 2,5 s), anders een zoeklink op Amazon met onze tag. Nooit een oude prijs: zonder prijs van vandaag zegt de kaart 'prijs van vandaag bij Amazon'.
const AMZ_T = { us: { vandaag: 'today on Amazon', zonder: 'Today\'s price on Amazon' }, de: { vandaag: 'heute bei Amazon', zonder: 'Preis von heute bei Amazon' } };
async function amzKaarten(site, namen) {
  const W = await import('./wtb.js'); const m = W.MARKETS[site], t = AMZ_T[site]; if (!m || !t) return null;
  const een = async nm => { const naam = kort(nm, 80); if (naam.length < 4) return null; let p = null;
    try { const r = await Promise.race([W.amzSearch(m, naam, { count: 5 }), new Promise(res => setTimeout(() => res(null), 2500))]); const ws = woorden(naam).filter(w => w.length >= 3);
      p = r && (r.products || []).find(x => x.price != null && ws.filter(w => woorden(x.title).includes(w)).length >= Math.min(2, ws.length)) || null; } catch (e) {}
    const u = p ? p.url : W.searchLink(m, naam); return { n: kort(naam, 60), p: p ? (p.priceText || m.money(p.price)) + ' ' + t.vandaag : t.zonder, d: '', u, i: (p && p.image) || '', naam: kort(naam, 60), url: u }; }; // naam en url: zo leest het sjabloon (lib/sjabloon.js) de knop
  const uit = (await Promise.all(namen.slice(0, 2).map(een))).filter(Boolean); return uit.length ? uit : null;
}
async function winkelKaarten(slugP, antwoord, mmc, zone) {
  let t = null; try { t = await kv.get('hjdk:kz:sit:' + slugP); } catch (e) {} if (!t || !Array.isArray(t.rijen) || !t.rijen.length) return null;
  const a = String(antwoord || '').toLowerCase(), gezien = new Set(), uit = [];
  for (const r of t.rijen) {
    const w = woordenP(r.product).filter(x => !/^(airfryer|liter|zwart|wit|met|en|de|het)$/.test(x)).slice(0, 3); if (w.length < 2 || gezien.has(r.product)) continue;
    if (w.filter(x => a.includes(x)).length < 2) continue; gezien.add(r.product);
    const tag = '-chat' + (zone ? '-Z' + zone : '') + (mmc ? '-' + kortId(mmc) : '');
    const u = String(r.url || '').replace(/([?&]subid=)([^&]*)/, (m, k, v) => k + encodeURIComponent((decodeURIComponent(v) + tag).slice(0, 90)));
    if (!/^https:\/\/partner\.bol\.com\//.test(u)) continue;
    const prijs = r.prijs != null ? '€ ' + Number(r.prijs).toFixed(2).replace('.', ',') : '';
    const dag = t.dag ? new Date(t.dag + 'T12:00:00Z').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', timeZone: 'UTC' }) : '';
    uit.push({ n: kort(r.product, 60), p: prijs ? prijs + ' bij bol' : 'Bij bol', d: dag ? 'prijs van ' + dag : '', u });
    if (uit.length >= 2) break;
  }
  if (!uit.length) return null;
  try { const { affLink } = await import('./aff.js'); uit.push({ n: uit[0].n, p: 'Bekijk ook bij Coolblue', d: 'prijs en levertijd daar', u: affLink('coolblue-nl', slugP + '-chat', 'https://www.coolblue.nl/zoeken?query=' + encodeURIComponent(uit[0].n)) + (mmc ? '&mmc=' + encodeURIComponent(mmc) : '') }); } catch (e) {}
  return uit;
}
export async function kzChat({ site, slug, vraag, hist, ip, oidc, test, sid, vt, ik, bron, pillPad, velden, pc, mmc, zone }) {
  bron = bron === 'mcp' ? 'mcp' : 'chat'; // 'mcp': vraag via de AI-assistent van de bezoeker (lib/kzmcp.js, 19 nov 2026)
  site = HOST[site] ? site : 'nl'; const v = kort(vraag, 400); if (v.length < 2) return { ok: false, fout: 'leeg' };
  const d = dag();
  try { const { veilig } = await import('./wam-leer.js'); const vg = veilig(v); if (vg) return { ok: true, a: NIET[site], weet: false, geblokt: true }; } catch (e) {}
  if (!test) {
    const ih = createHash('sha256').update('kzc|' + String(ip || '')).digest('hex').slice(0, 16);
    const per = N(await kv.raw(['INCR', 'kz:chat:ip:' + ih + ':' + d]).catch(() => 0)); await kv.raw(['EXPIRE', 'kz:chat:ip:' + ih + ':' + d, '172800']).catch(() => null);
    if (per > 25) return { ok: true, a: DRUK[site], limiet: true };
    await kv.raw(['HINCRBY', 'kz:chat:d:' + d, site + ':vraag', '1']).catch(() => null); if (bron === 'mcp') await kv.raw(['HINCRBY', 'kz:chat:d:' + d, site + ':mcp', '1']).catch(() => null); await kv.raw(['EXPIRE', 'kz:chat:d:' + d, String(90 * 86400)]).catch(() => null);
  }
  { const mT = /^\s*(?:ik ben|i am|i'm|ich bin|hier ist|this is|hoi|hi|hallo|hello)?[\s,]*([A-Za-zÀ-ÿ]{2,20}-\d{2})\s*[.!]?\s*$/i.exec(v); // terugkomen met naam (lib/geheugen.js mijNaam)
    if (mT) { try { const G = await import('./geheugen.js'); const t = await G.mijTerug(mT[1]); if (t) { const w = (t.w || []).slice(0, 3).map(x => x.wat + (x.extra ? ' (' + x.extra + ')' : ''));
      const a = { nl: 'Welkom terug, ' + t.naam + '. ' + (w.length ? 'Je zocht: ' + w.join('; ') + '. Waar zal ik verder mee helpen?' : 'Waar zal ik je mee helpen?'), us: 'Welcome back, ' + t.naam + '. ' + (w.length ? 'You were looking for: ' + w.join('; ') + '. Where shall we pick up?' : 'What can I help you with?'), de: 'Willkommen zurück, ' + t.naam + '. ' + (w.length ? 'Du hast gesucht: ' + w.join('; ') + '. Wo sollen wir weitermachen?' : 'Wobei kann ich dir helfen?') }[site] || '';
      if (a) return { ok: true, a, weet: true, mijPid: t.pid, opties: (t.w || []).slice(0, 3).map(x => kort(x.wat, 40)) }; } } catch (e) {} } }
  const all = await alle(site).catch(() => []); const it = all.find(x => x.slug === slug) || null;
  // Onzin en bots (20 nov 2026, Henkjan: "Kille en zorgen dat ze geen tokens verpesten", na ~10 keer 'tnrqqvmvk' en dergelijke op whichtobuy):
  // getypte onzin gaat nooit naar het model en niet in het chatlog; twee keer onzin vanaf hetzelfde IP = dat IP de rest van de dag (48 uur) geen AI.
  if (!test && bron === 'chat' && !(pc && pillPad)) {
    const bh = createHash('sha256').update('kzc|' + String(ip || '')).digest('hex').slice(0, 16), bk = 'kz:chat:bot:' + bh;
    if (N(await kv.raw(['GET', bk]).catch(() => 0)) >= 2) { await kv.raw(['HINCRBY', 'kz:chat:d:' + d, site + ':bot', '1']).catch(() => null); return { ok: true, a: NIET[site], weet: true, bot: true }; }
    if (isOnzin(v, it)) {
      await kv.raw(['INCR', bk]).catch(() => null); await kv.raw(['EXPIRE', bk, '172800']).catch(() => null);
      await kv.raw(['HINCRBY', 'kz:chat:d:' + d, site + ':onzin', '1']).catch(() => null);
      return { ok: true, a: NIET[site], weet: true, onzin: true };
    }
  }
  const h = (Array.isArray(hist) ? hist : []).slice(-6).map(x => (x && x[0] === 'k' ? 'Assistant: ' : 'Visitor: ') + kort(x && x[1], 300)).join('\n');
  const kost = N(await kv.raw(['HGET', 'kz:chat:kost', d]).catch(() => 0));
  let j = null, fout = '', rawTxt = '';
  const vel = {}; if (velden && typeof velden === 'object') for (const k of [...V4, 'situatie']) { const x = kort(velden[k], 60); if (x) vel[k] = x; }
  const stijl = test ? 'a' : await kiesStijl(site).catch(() => 'a');
  const padS = kort(pillPad, 200).toLowerCase(); let ck = '', rec = null, uitCache = false, steek = false, recKey = '', maakB = false, vid = '';
  // Geleerd = geen tokens meer (20 nov 2026, Henkjan: "Voer dit ook door als geleerd dan geen tokens meer gebruiken"): een pill-pad, en een eerste vraag
  // zonder gesprek ervoor en zonder persoonlijke context, krijgt na één goed antwoord dat antwoord uit de opslag (met prijs 1 dag, anders 7 dagen).
  // Eerder pas na 3 gelijke antwoorden en daarna nog 5 tot 25% opnieuw naar de AI: 167 tikken op 19 nov, grotendeels dezelfde vraag.
  // ook als er alleen een vaste openingsvraag van de chat voor stond (bv. "What will you use it for most?"): geen eigen beurt van de bezoeker = eerste vraag
  const bezoekerEerder = (Array.isArray(hist) ? hist : []).some(x => x && x[0] !== 'k' && String(x[1] || '').trim());
  const eersteVraag = !bezoekerEerder && !(Array.isArray(ik) && ik.length) && !Object.keys(vel).length && v.length <= 300;
  if (!test && ((pc && padS) || eersteVraag)) {
    // CV: verhoog bij een gewijzigde bron (prijs, datum), dan bouwt elk pad zijn antwoord opnieuw op (20 nov 2026: 'Stand: laut Quelle 2026' bleef de hele dag)
    ck = pc && padS ? 'kz:pc:' + CV + stijl + ':' + site + ':' + (slug || '-') + ':' + createHash('sha256').update(padS).digest('hex').slice(0, 20)
      : 'kz:qc:' + CV + stijl + ':' + site + ':' + (slug || '-') + ':' + createHash('sha256').update(v.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()).digest('hex').slice(0, 20);
    const lees = async k => { try { const x = await kv.raw(['GET', k]); return x ? JSON.parse(x) : null; } catch (e) { return null; } };
    recKey = ck + ':' + d; rec = await lees(recKey); if (!rec) { recKey = ck; rec = await lees(recKey); }
    if (rec && rec.j && N(rec.n) >= 1) {
      const st = await doorStats(ck);
      if (rec.b && rec.b.j && (st['a:toon'] || 0) >= DOOR_DUEL && (st['b:toon'] || 0) >= DOOR_DUEL) { // duel klaar: de beste blijft
        const bWint = ratio(st, 'b') > ratio(st, 'a'); if (bWint) { rec.j = rec.b.j; rec.sig = rec.b.sig || rec.sig; } delete rec.b; rec.duels = N(rec.duels) + 1;
        await kv.raw(['SET', recKey, JSON.stringify(rec), 'KEEPTTL']).catch(() => null); await kv.raw(['DEL', 'kz:door:' + ck]).catch(() => null);
        await kv.raw(['LPUSH', 'kz:door:log', JSON.stringify({ t: Date.now(), site, slug, ck, winnaar: bWint ? 'b' : 'a', a: Math.round(100 * ratio(st, 'a')), b: Math.round(100 * ratio(st, 'b')) })]).catch(() => null); await kv.raw(['LTRIM', 'kz:door:log', '0', '199']).catch(() => null);
        j = rec.j; vid = 'a'; uitCache = true;
      } else if (rec.b && rec.b.j) { const bMinder = (st['b:toon'] || 0) <= (st['a:toon'] || 0); j = bMinder ? rec.b.j : rec.j; vid = bMinder ? 'b' : 'a'; uitCache = true; }
      else if ((st['a:toon'] || 0) >= DOOR_MIN && ratio(st, 'a') < DOOR_DOEL && (await kv.raw(['SET', 'kz:door:mk:' + ck, '1', 'NX', 'EX', '600']).catch(() => null)) === 'OK') { maakB = true; } // uitdager maken via het model
      else { j = rec.j; vid = 'a'; uitCache = true; }
      if (uitCache) await pcTel(d, 'treffer');
    }
  }
  if (uitCache) {}
  else if ((!process.env.ANTHROPIC_API_KEY && !oidc) || kost >= PLAFOND() * 1e6) { const z = zoek(v, it, all); j = z ? { a: z.a, weet: true, pagina: z.pagina } : { weet: false }; fout = kost >= PLAFOND() * 1e6 ? 'plafond' : 'zonder-ai'; }
  else if (site === 'kadoly') { // de winkel zelf: producten met prijs inclusief verzending en bezorgdag van vandaag (fn/gids.js kzKadoly)
    try { const G = await import('../fn/gids.js'); j = await G.kzKadoly({ slug, vraag: v, hist, velden: vel, ik, oidc });
      await kv.raw(['HINCRBY', 'kz:chat:kost', d, '2000']).catch(() => null); if (!test) await pcTel(d, pc && padS ? 'model_pill' : 'model_getypt');
    } catch (e) { fout = String(e.message || e).slice(0, 80); j = null; }
  }
  else {
    const system = 'You are the chat on ' + HOST[site] + ', an independent buying-guide site. You help a visitor choose, and you find out what they really want.\n' +
      'Rules:\n- Answer in ' + TAAL[site] + ', at most 3 short sentences, plain words, no lists, no dashes, no words in capitals.\n' +
      '- Use ONLY the facts below. Never invent products, prices, brands, numbers or shops. Give a price only with its date as shown.\n' +
      '- If another guide below fits the question better, say so and put its slug in pagina. Otherwise pagina is an empty string.\n' +
      '- If the facts do not answer the question, say that honestly and set weet to false.\n' +
      '- Today is ' + d + '. Never make a product the facts call sold out, out of stock, not available, nicht lieferbar, ausverkauft or niet leverbaar your first pick: recommend the best product that can be bought now, and mention the unavailable one only with a volg offer (volgSoort voorraad).\n' +
      (site === 'us' || site === 'de' ? '- A price dated more than 7 days before today is not today\'s price: do not state it as the price; say the button below shows today\'s price. Put in kaart the exact names (brand and model as written in the facts) of at most 2 products your answer recommends and that can be bought now, best first; they appear as buy buttons under your answer. Empty list when you recommend no product.\n' : '') +
      '- Only offer opties the facts above can answer; never offer an option you would have to answer with I do not know.\n' +
      '- If the visitor asks for the cheapest, the best or what fits them, name the concrete option or options from the facts with their price, not only a range. When the message asks for a price, the answer must contain that price with its date; never start the answer with yes or no.\n' +
      '- Never ask for something the visitor already said in this conversation (who it is for, how many people, budget, when, how much they use).\n' +
      '- Then ask at most ONE short follow-up question, only if the answer to it changes the advice (who it is for, budget, when needed, size or use). Give 2 or 3 short tappable answers for it in opties (max 4 words each).' + (STIJLEN[stijl] || STIJLEN.a).p + DIEP + '\n' +
      '- Fill intentie from what the visitor said only: wat (the product or service), voorWie (self, a named relation like mother, a group like family or team), budget, wanneer. Empty string when unknown.\n' +
      '- samen is true only when the visitor decides together with others (a shared gift, a family purchase, neighbours, a team).\n' +
      '- volg: only when the facts show something that will change or that we can find out later and that matters for this visitor (an item that is sold out or temporarily unavailable, a price that is weeks old or a sale such as Black Friday coming, an owner who can answer, a guide we still have to make, their own date), write ONE short natural question in the visitor\'s language offering to tell them, naming the thing, e.g. "Shall I let you know when the Marstek is back in stock?". Set volgSoort to voorraad, prijs, antwoord, nieuw or datum. Otherwise both empty. Never invent a reason.\n' +
      (maakB ? UITDAGER + '\n' : '') + 'Never put double quotes inside a text value (use single quotes). Reply with JSON only: {"a":"answer","weet":true,"pagina":"","vraag":"","opties":[],"intentie":{"wat":"","voorWie":"","budget":"","wanneer":""},"samen":false,"volg":"","volgSoort":""' + (site === 'us' || site === 'de' ? ',"kaart":[]' : '') + '}\n\n' + await kennis(site, it, it && it.alles ? v + ' ' + (Array.isArray(hist) ? hist : []).filter(x => x && x[0] !== 'k').map(x => String(x[1] || '')).slice(-3).join(' ') : v, all);
    const eerder = (Array.isArray(ik) ? ik : []).map(x => kort(x, 120)).filter(x => x && !/(^|\s)(bol|bol\.com|amazon|vandaag|deals?|heute|today)(\s|:|,|$)/i.test(x)).slice(0, 3); // per persoon (alleen uit deze browser): waar deze bezoeker eerder naar zocht
    const user = (eerder.length ? 'Earlier this visitor looked for: ' + eerder.join(' | ') + ' (use it to personalise; never ask again for what is already known)\n\n' : '') + (h ? 'Conversation so far:\n' + h + '\n\n' : '') + 'New message: ' + v;
    try {
      const r = await berichten({ fn: 'kz-chat', model: HAIKU, system, user, max: 450, timeout: 20000, directKey: process.env.ANTHROPIC_API_KEY, oidc: oidc || '', cacheTtl: 6 * 3600 });
      if (test) rawTxt = String(r.txt || '').slice(0, 2500); // test op de beschermde host: ruwe modeluitvoer mee terug
      const m = String(r.txt || '').match(/\{[\s\S]*\}/); j = m ? leesJ(m[0]) : null;
      await kv.raw(['HINCRBY', 'kz:chat:kost', d, '2000']).catch(() => null);
      if (!test) await pcTel(d, pc && padS ? 'model_pill' : 'model_getypt');
      if (maakB && rec && j && j.a && j.weet !== false) { rec.b = { j: { a: j.a, weet: true, pagina: j.pagina || '', intentie: j.intentie || {}, vraag: j.vraag || '', opties: Array.isArray(j.opties) ? j.opties.slice(0, 4) : [], samen: !!j.samen, volg: j.volg || '', volgSoort: j.volgSoort || '', kaart: Array.isArray(j.kaart) ? j.kaart.map(x => kort(x, 80)).filter(Boolean).slice(0, 2) : [] }, sig: adviesSig(j), t: Date.now() }; vid = 'b'; await kv.raw(['SET', recKey, JSON.stringify(rec), 'KEEPTTL']).catch(() => null); }
      // vraagt de bezoeker om een prijs en noemt het antwoord er geen, dan niet bewaren (20 nov 2026: 'Nenne die beste Wahl mit Preis' kreeg drie namen zonder prijs, voor iedereen)
      else if (ck && j && j.a && j.weet !== false && !(/\b(preis|price|prijs)\b/i.test(v) && !prijsIn(j.a))) { vid = 'a'; const sig = adviesSig(j), zelfde = rec && rec.sig === sig; if (rec && !zelfde && N(rec.n) >= 3) await pcTel(d, 'afwijk');
        const nr = { j: { a: j.a, weet: true, pagina: j.pagina || '', intentie: j.intentie || {}, vraag: j.vraag || '', opties: Array.isArray(j.opties) ? j.opties.slice(0, 4) : [], samen: !!j.samen, volg: j.volg || '', volgSoort: j.volgSoort || '', kaart: Array.isArray(j.kaart) ? j.kaart.map(x => kort(x, 80)).filter(Boolean).slice(0, 2) : [] }, sig, n: zelfde ? N(rec.n) + 1 : 1, af: zelfde ? Math.max(0, N(rec.af) - (steek ? 1 : 0)) : (rec ? 5 : 0), t: Date.now() };
        const metPrijs = prijsIn(j.a); await kv.raw(['SET', metPrijs ? ck + ':' + d : ck, JSON.stringify(nr), 'EX', String(metPrijs ? 86400 : 7 * 86400)]).catch(() => null); }
    } catch (e) { fout = String(e.message || e).slice(0, 80); const z = zoek(v, it, all); if (z) j = { a: z.a, weet: true, pagina: z.pagina }; }
  }
  // Dealspagina (19 nov 2026, onbeantwoord: "Ik zoek: vandaag bij bol. Voor: Vriend of vriendin. Budget: Prijs-kwaliteit."): de pill "vandaag bij bol"
  // is geen product; vraag door naar het product en geef drie tikbare opties, in plaats van geen antwoord.
  if (!(j && j.a && j.weet !== false) && site === 'nl' && (slug === 'deals' || /vandaag bij bol/i.test(v))) {
    const voor = vel.voorWie ? ' voor ' + String(vel.voorWie).toLowerCase() : '';
    j = { a: 'De deals van vandaag staan op deze pagina met de prijs bij bol van vandaag. Noem wat je zoekt' + voor + ', dan geef ik de beste keuze met prijs.', weet: true, pagina: '', vraag: 'Waar zoek je een deal voor?', opties: ['Koptelefoon', 'Airfryer', 'Cadeau onder 25 euro'], intentie: Object.assign({ wat: '', voorWie: vel.voorWie || '', budget: vel.budget || '', wanneer: '' }) };
  }
  // Voorkant-pills zonder onderwerp (20 nov 2026: "Mir fehlt ein Ratgeber" kreeg "Dafür passt dieser Ratgeber am besten" zonder ratgeber): vraag wat er mist.
  const MIST = { nl: [/^ik mis een keuzehulp$/i, 'Welke keuzehulp mis je? Typ het product of de vraag, dan maken we hem.', 'Wat moet hij helpen kiezen?'], us: [/^i miss a guide$/i, 'Which guide are you missing? Type the product or the question and we will build it.', 'What should it help you choose?'], de: [/^mir fehlt ein ratgeber$/i, 'Welcher Ratgeber fehlt dir? Schreib das Produkt oder die Frage, dann bauen wir ihn.', 'Wobei soll er dir helfen?'] };
  const ANDERS = { nl: [/^ik zoek iets anders$/i, 'Typ wat je zoekt, dan kijk ik welke keuzehulp past.'], us: [/^something else$/i, 'Type what you are looking for and I will find the guide that fits.'], de: [/^etwas anderes$/i, 'Schreib, was du suchst, dann finde ich den passenden Ratgeber.'] };
  const vMist = String(v || '').trim().replace(/[.!?]+$/, '');
  if (MIST[site] && MIST[site][0].test(vMist)) j = { a: MIST[site][1], weet: true, pagina: '', vraag: MIST[site][2], opties: [], intentie: {} };
  else if (ANDERS[site] && ANDERS[site][0].test(vMist)) j = { a: ANDERS[site][1], weet: true, pagina: '', vraag: '', opties: [], intentie: {} };
  let res = null; // reserve-antwoord: het model gaf niets, faalde, plafond, of weet het niet (zie reserve hierboven)
  // Wedervraag in plaats van een gok (26 nov 2026, Henkjan typte "blendle" op de strijkplankpagina en kreeg "Hiervoor past deze keuzehulp het best" met een
  // strijkplankgids en "Zal ik onthouden dat je strijkplank zoekt?": "chat moet zo intelligent zijn dat vraag wat er a d hand is of wat bedoel je ?").
  // Oorzaak: bij een getypte vraag zocht de reserve op het pill-veld van de pagina (wat = strijkplank) en niet op wat er getypt was. Nu: een getypte vraag
  // zoekt op de getypte woorden. Noemt hij een bedrijf met een dossier, dan vraagt de chat wat er aan de hand is (lib/mobiliseer.js). Raakt hij de pagina
  // en de catalogus niet, dan vraagt de chat wat je bedoelt. vraagTerug in het antwoord: de browser biedt dan geen onthouden of volgen aan.
  let terug = false;
  // midden in een gesprek (27 nov 2026, analyse: "A CPAP overnight", een optie die de chat zelf bood, kreeg "This guide fits best"): het eerlijke antwoord
  // van het model blijft staan, geen verwijzing naar een andere keuzehulp en geen wedervraag
  const middenIn = bezoekerEerder && !!(j && j.a && String(j.a).trim().length >= 20);
  if (!(j && j.a && j.weet !== false) && !middenIn) {
    const getypt = !pc && !!String(v || '').trim(), mb = getypt ? mobiVraag(site, v) : null;
    if (mb) { j = { a: mb.a, weet: true, pagina: '', vraag: mb.vraag, opties: mb.opties, intentie: {} }; terug = true; }
    else {
      const qv = woorden(v), eigen = new Set(woorden([it && it.term, it && it.title, ...((it && it.faq) || []).map(f => f && f.q)].filter(Boolean).join(' ')));
      const tw = new Set(woorden(it && (it.term || it.title))), opPagina = qv.some(w => tw.has(w) || (w.length >= 5 && eigen.has(w))); // korte gewone woorden (mijn, voor) tellen niet als raakvlak
      const r0 = reserve(site, v, getypt && !opPagina ? null : vel, it, all), mp = j && j.pagina ? all.find(x => x && x.slug === j.pagina) : null;
      // de reserve zoekt ook op stukjes van woorden en vindt zo bijna altijd iets; voor een wedervraag telt alleen een heel woord uit de vraag dat in een keuzehulp staat
      const strikt = getypt && !opPagina && (all || []).some(x => x && x.slug && x.slug !== 'vraag' && (ws => qv.some(w => w.length >= 4 && ws.has(w)))(new Set(woorden((typeof x.term === 'string' ? x.term : '') + ' ' + String(x.slug).replace(/-/g, ' ') + ' ' + (x.title || '')))));
      if (getypt && !opPagina && !mp && (!r0.pagina || !strikt)) { const tm = kort(it && (it.term || it.title), 60); j = { a: (TERUG[site] || TERUG.nl)(tm), weet: true, pagina: '', vraag: '', opties: [], intentie: {} }; terug = true; }
      else {
        res = mp ? { pagina: mp.slug, a: (RES[site] || RES.nl)(kort(mp.title || mp.term, 90)), verder: r0.verder } : r0;
        if (res.pagina) j = { ...(j || {}), a: res.a, weet: true, pagina: res.pagina };
      }
    }
    if (!fout && !(j && j.a)) fout = 'leeg';
  }
  const weet = !!(j && j.a && j.weet !== false), weetLog = res || terug ? false : weet;
  const pagina = j && j.pagina && all.some(x => x.slug === j.pagina) ? String(j.pagina) : '';
  const pTitel = pagina ? kort((all.find(x => x.slug === pagina) || {}).title, 90) : '';
  const opties = pc ? [] : (j && Array.isArray(j.opties) ? j.opties : []).map(x => { x = String(x || '').trim(); return x.length <= 40 ? x : x.slice(0, 40).replace(/\s+\S*$/, ''); }).filter(Boolean).slice(0, 3);
  const vervolg = j && j.vraag && !pc ? kort(j.vraag, 160) : '';
  const ii = Object.assign({}, (j && j.intentie) || {}); for (const k of V4) if (vel[k]) ii[k] = vel[k]; const samen = !!(j && j.samen);
  if (!test) {
    { // doorpraten tellen: vroeg dezelfde bezoeker binnen 15 minuten op deze pagina opnieuw iets, dan telt dat voor het vorige antwoord
      const wd = createHash('sha256').update('w|' + String(sid || 'ip' + String(ip || ''))).digest('hex').slice(0, 8), lk = 'kz:door:last:' + wd, nu = Date.now(), pk = 'kz:door:d:' + d, pg = site + ':' + (slug || '-');
      try { const last = JSON.parse((await kv.raw(['GET', lk])) || 'null'); if (last && nu - N(last.t) < 900000 && last.p === pg) { await kv.raw(['HINCRBY', pk, pg + ':door', '1']); if (last.ck && last.v) await kv.raw(['HINCRBY', 'kz:door:' + last.ck, last.v + ':door', '1']); if (last.st) await kv.raw(['HINCRBY', 'kz:door:stijl2', site + ':' + last.st + ':door', '1']); } } catch (e) {}
      if (weet) {
        await kv.raw(['HINCRBY', pk, pg + ':toon', '1']).catch(() => null); await kv.raw(['EXPIRE', pk, String(40 * 86400)]).catch(() => null);
        if (ck && vid) { await kv.raw(['HINCRBY', 'kz:door:' + ck, vid + ':toon', '1']).catch(() => null); await kv.raw(['EXPIRE', 'kz:door:' + ck, String(14 * 86400)]).catch(() => null); }
        if (!fout) await kv.raw(['HINCRBY', 'kz:door:stijl2', site + ':' + stijl + ':toon', '1']).catch(() => null); // alleen echte AI-antwoorden (20 nov 2026: gateway 402 telde FAQ-teksten als stijl; stijl2 begint schoon)
        await kv.raw(['SET', lk, JSON.stringify({ t: nu, p: pg, ck: ck && vid ? ck : '', v: vid, st: fout ? '' : stijl }), 'EX', '1800']).catch(() => null);
      } else await kv.raw(['DEL', lk]).catch(() => null);
    }
    const rij = JSON.stringify({ t: Date.now(), site, s: slug, v: v.slice(0, 300), ...(vid ? { cv: vid } : {}), st: stijl, weet: weetLog, ...(res ? { r: res.pagina ? 1 : 0 } : {}), p: pagina, i: { wat: kort(ii.wat, 60), voorWie: kort(ii.voorWie, 40), budget: kort(ii.budget, 30), wanneer: kort(ii.wanneer, 30) }, samen, f: fout, w: createHash('sha256').update('w|' + String(sid || 'ip' + String(ip || ''))).digest('hex').slice(0, 8), a: kort(weet ? j.a : NIET[site], 700), ...(bron === 'mcp' ? { b: 'mcp' } : {}), ...(padS ? { pad: padS.slice(0, 120), c: uitCache ? 1 : 0 } : {}) });
    await kv.raw(['LPUSH', 'kz:chat:log', rij]).catch(() => null); await kv.raw(['LTRIM', 'kz:chat:log', '0', '1999']).catch(() => null);
    if (bron !== 'mcp') { try { const CB = await import('./chatbewijs.js'); await CB.telVraag(site, slug, createHash('sha256').update(String(sid || 'ip' + String(ip || ''))).digest('hex').slice(0, 16)); } catch (e) {} } // wie nu in gesprek is (lib/chatbewijs.js)
    if (!weetLog) { await kv.raw(['LPUSH', 'kz:chat:open', rij]).catch(() => null); await kv.raw(['LTRIM', 'kz:chat:open', '0', '499']).catch(() => null); await kv.raw(['HINCRBY', 'kz:chat:d:' + d, site + ':open', '1']).catch(() => null); }
    if (samen) await kv.raw(['HINCRBY', 'kz:chat:d:' + d, site + ':samen', '1']).catch(() => null);
    // 100.000 intenties voor 31 dec 2026 (Henkjan 18 nov): een intentie telt pas met minstens 2 ingevulde velden (wat, voor wie, budget, wanneer), één keer per sessie per wat
    try { const vv = ['wat', 'voorWie', 'budget', 'wanneer'].filter(k => String(ii[k] || '').trim()).length;
      if (vv >= 2) { const dk = 'kz:i100:s:' + createHash('sha256').update((sid || 'ip' + String(ip || '')) + '|' + String(ii.wat || '').toLowerCase().trim()).digest('hex').slice(0, 24);
        if (N(await kv.raw(['SET', dk, '1', 'NX', 'EX', String(7 * 86400)]).then(x => x === 'OK' ? 1 : 0).catch(() => 0))) { await kv.raw(['HINCRBY', 'kz:i100:d:' + d, site, '1']).catch(() => null); await kv.raw(['EXPIRE', 'kz:i100:d:' + d, String(120 * 86400)]).catch(() => null); await kv.raw(['INCR', 'kz:i100:tot']).catch(() => null); } } } catch (e) {}
    await intentieLog(kv, { q: v, site, slug, m: weetLog ? 1 : 0, bron }, { headers: { 'x-forwarded-for': ip || '' } }).catch(() => null);
    // 18 nov: intentie per persoon volgen (lib/intentvolg.js); alleen met een sessie-id, en aan een abonnee alleen als de bezoeker zelf volgt
    try { const IV = await import('./intentvolg.js'); await IV.chatIntentie({ site, slug, sid, vt, intentie: ii, samen }); } catch (e) {}
  }
  const pad = pagina ? ((all.find(x => x.slug === pagina) || {}).pad || '') : '';
  const pv = site === 'kadoly' && j && Array.isArray(j.verder) && j.verder.length ? j.verder.slice(0, 4) : null; // producten uit de winkel als links (naar /naar/<pid>, gemeten in Clickmind)
  let prs = site === 'kadoly' && j && Array.isArray(j.producten) ? j.producten.slice(0, 3) : null;
  if (!prs && (site === 'us' || site === 'de') && j && j.a && j.weet !== false && Array.isArray(j.kaart) && j.kaart.length) { try { prs = await amzKaarten(site, j.kaart); } catch (e) {} } // koopknop onder het advies (27 nov 2026)
  if (!prs && site === 'nl' && j && j.a && j.weet !== false) { try { prs = await winkelKaarten(j.pagina && all.some(x => x.slug === j.pagina) ? j.pagina : slug, j.a, mmc, zone); } catch (e) {} } // productkaarten onder het antwoord (lib/kzux.js kxProd)
  const volg = weet && j && j.volg ? kort(j.volg, 160) : '', volgSoort = volg && /^(voorraad|prijs|antwoord|nieuw|datum)$/.test(String(j.volgSoort || '')) ? j.volgSoort : (volg ? 'anders' : '');
  return { ok: true, a: weet ? kort(j.a, 700) : NIET[site], weet, ...(terug ? { vraagTerug: 1 } : {}), ...(volg ? { volg, volgSoort } : {}), pagina, pad, pTitel, ...(prs && prs.length ? { producten: prs } : {}), ...(uitCache ? { cache: 1 } : {}), ...(pv ? { verder: res ? pv.concat(res.verder || []).slice(0, 5) : pv } : res ? { verder: res.verder, reserve: 1 } : {}), vervolg, opties, samen, i: { wat: kort(ii.wat, 60), voorWie: kort(ii.voorWie, 40), budget: kort(ii.budget, 30), wanneer: kort(ii.wanneer, 30) }, ...(fout ? { fout } : {}), ...(test && rawTxt ? { raw: rawTxt } : {}) };
}

// Rekenchat (19 nov 2026, lib/kzux.js kxReken): de velden uit de pills (wat, voor wie, budget als bandbreedte) tellen als intentie, zonder AI:
// zelfde chatlog, 100k-teller (minstens 2 velden, één keer per sessie per wat), intentielog (bron chat) en intentie per persoon als kzChat.
export async function kzRekenLog({ site, slug, q, velden, pad, sid, vt, ip }) {
  site = HOST[site] ? site : 'nl'; slug = String(slug || '').replace(/[^a-z0-9-]/gi, '').slice(0, 90); if (!slug) return { ok: false };
  const d = dag(), ii = {}; for (const k of V4) { const x = kort(velden && velden[k], 60); if (x) ii[k] = x; }
  const v = kort(q, 300) || ('rekenhulp ' + slug);
  const ih = createHash('sha256').update('kzr|' + String(ip || '')).digest('hex').slice(0, 16);
  const per = N(await kv.raw(['INCR', 'kz:chat:rip:' + ih + ':' + d]).catch(() => 0)); await kv.raw(['EXPIRE', 'kz:chat:rip:' + ih + ':' + d, '172800']).catch(() => null);
  if (per > 40) return { ok: true, limiet: true };
  await kv.raw(['HINCRBY', 'kz:chat:d:' + d, site + ':reken', '1']).catch(() => null); await kv.raw(['EXPIRE', 'kz:chat:d:' + d, String(90 * 86400)]).catch(() => null);
  const rij = JSON.stringify({ t: Date.now(), site, s: slug, v, weet: true, p: '', i: { wat: kort(ii.wat, 60), voorWie: kort(ii.voorWie, 40), budget: kort(ii.budget, 30), wanneer: kort(ii.wanneer, 30) }, samen: false, f: '', b: 'reken', pad: kort(pad, 120).toLowerCase(), c: 0 });
  await kv.raw(['LPUSH', 'kz:chat:log', rij]).catch(() => null); await kv.raw(['LTRIM', 'kz:chat:log', '0', '1999']).catch(() => null);
  let telt = false;
  try { const vv = V4.filter(k => String(ii[k] || '').trim()).length;
    if (vv >= 2) { const dk = 'kz:i100:s:' + createHash('sha256').update((sid || 'ip' + String(ip || '')) + '|' + String(ii.wat || '').toLowerCase().trim()).digest('hex').slice(0, 24);
      if (N(await kv.raw(['SET', dk, '1', 'NX', 'EX', String(7 * 86400)]).then(x => x === 'OK' ? 1 : 0).catch(() => 0))) { telt = true; await kv.raw(['HINCRBY', 'kz:i100:d:' + d, site, '1']).catch(() => null); await kv.raw(['EXPIRE', 'kz:i100:d:' + d, String(120 * 86400)]).catch(() => null); await kv.raw(['INCR', 'kz:i100:tot']).catch(() => null); } } } catch (e) {}
  await intentieLog(kv, { q: v, site, slug, m: 1, bron: 'chat' }, { headers: { 'x-forwarded-for': ip || '' } }).catch(() => null);
  try { const IV = await import('./intentvolg.js'); await IV.chatIntentie({ site, slug, sid, vt, intentie: ii, samen: false }); } catch (e) {}
  return { ok: true, telt };
}

// stand voor de nachtronde en het dagrapport: tellers per dag, laatste vragen en open vragen (alleen beschermde host)
export async function kzChatStand(vol) {
  const paren = h => { if (!h) return {}; if (!Array.isArray(h)) return h; const o = {}; for (let i = 0; i + 1 < h.length; i += 2) o[String(h[i])] = h[i + 1]; return o; };
  const dagen = []; for (let i = 0; i < 7; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); dagen.push({ dag: d, ...paren(await kv.raw(['HGETALL', 'kz:chat:d:' + d]).catch(() => null)), kostUsd: N(await kv.raw(['HGET', 'kz:chat:kost', d]).catch(() => 0)) / 1e6 }); }
  const lees = async k => ((await kv.raw(['LRANGE', k, '0', '99']).catch(() => [])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean);
  return { ok: true, plafondUsd: PLAFOND(), dagen, ...(vol ? { laatst: await lees('kz:chat:log'), open: await lees('kz:chat:open') } : {}) };
}

// Stand van het doel 100.000 intenties (minstens 2 velden) voor 31 december 2026
export async function i100Stand() {
  const nu = Date.now(), eind = Date.parse('2026-12-31T23:59:59Z'), dagenOver = Math.max(1, Math.ceil((eind - nu) / 864e5));
  const tot = N(await kv.raw(['GET', 'kz:i100:tot']).catch(() => 0)); const dagen = [];
  for (let i = 0; i < 14; i++) { const dd = new Date(nu - i * 864e5).toISOString().slice(0, 10); const h = await kv.raw(['HGETALL', 'kz:i100:d:' + dd]).catch(() => null); const pr = Array.isArray(h) ? h : h ? Object.entries(h).flat() : []; const per = {}; for (let j = 0; j + 1 < pr.length; j += 2) per[pr[j]] = N(pr[j + 1]); dagen.push({ dag: dd, totaal: Object.values(per).reduce((a, x) => a + x, 0), per }); }
  return { doel: 100000, totaal: tot, nodigPerDag: Math.ceil(Math.max(0, 100000 - tot) / dagenOver), dagenOver, vandaag: dagen[0].totaal, dagen, uitleg: 'Een intentie = chatvraag waaruit minstens 2 van wat, voor wie, budget en wanneer bekend zijn, één keer per sessie per product.' };
}

// Lerende pills (19 nov 2026): per stap (wat, voorWie, budget, situatie) en per soort (slug, of 'alg' voor stappen die op elke pagina gelijk zijn)
// een lijst kandidaten; de server kiest welke er staan met Thompson sampling op de waarde na de tik (volgende stap 1, intentie 3, advies 4,
// winkel 10, blijf 12, gekoppeld 15), met 20% verkenning zolang een kandidaat minder dan 200 keer gezien is. Tellers in kz:pil:<site>:<soort>:<stap>.
const PIL_SET = 'kz:pil:sets';
const pilLabel = x => kort(x, 40).replace(/\|/g, ' ');
const pilKey = (site, so, id) => 'kz:pil:' + (HOST[site] ? site : 'nl') + ':' + String(so || 'alg').replace(/[^a-z0-9-]/gi, '').slice(0, 60) + ':' + String(id || '').replace(/[^a-z]/gi, '').slice(0, 12);
function gss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const parenH = h => { if (!h) return {}; if (!Array.isArray(h)) return h; const o = {}; for (let i = 0; i + 1 < h.length; i += 2) o[String(h[i])] = h[i + 1]; return o; };
export async function kzPills({ site, stappen }) {
  const kies = {};
  for (const s of (Array.isArray(stappen) ? stappen : []).slice(0, 4)) {
    const id = String((s && s.id) || '').replace(/[^a-z]/gi, '').slice(0, 12); if (!id) continue;
    const kand = [...new Set((Array.isArray(s.k) ? s.k : []).map(pilLabel).filter(Boolean))].slice(0, 8); const K = Math.max(1, Math.min(4, N(s.n) || 4));
    if (kand.length <= K) { kies[id] = kand; continue; }
    const h = parenH(await kv.raw(['HGETALL', pilKey(site, s.so, id)]).catch(() => null));
    let N0 = 0, S0 = 0, Q0 = 0; const r = kand.map(l => { const n = N(h[l + '|n']), sm = N(h[l + '|s']), q = N(h[l + '|q']); N0 += n; S0 += sm; Q0 += q; return { l, n, s: sm }; });
    const mu0 = N0 ? S0 / N0 : 0.5, var0 = Math.max(0.25, N0 ? Q0 / N0 - mu0 * mu0 : 1);
    const gs = r.map((x, i) => { const ne = x.n + 2; return { l: x.l, n: x.n, w: (x.s + 2 * mu0) / ne + gss() * Math.sqrt(var0 / ne) + (x.n ? 0 : 0.001 * (kand.length - i)) }; }).sort((a, b) => b.w - a.w);
    const gekozen = gs.slice(0, K), rest = gs.slice(K);
    if (rest.length && Math.min(...gs.map(x => x.n)) < 200 && Math.random() < 0.2) gekozen[K - 1] = rest[Math.floor(Math.random() * rest.length)];
    kies[id] = gekozen.map(x => x.l);
  }
  return { ok: true, kies };
}
export async function kzPillEv({ site, ev }) {
  let n = 0;
  for (const e of (Array.isArray(ev) ? ev : []).slice(0, 12)) {
    if (!e || !e.id) continue; const key = pilKey(site, e.so, e.id);
    if (e.e === 'zie') { const ls = (Array.isArray(e.l) ? e.l : [e.l]).map(pilLabel).filter(Boolean).slice(0, 6); if (!ls.length) continue;
      const hl = N(await kv.raw(['HLEN', key]).catch(() => 0)); if (hl > 120) continue;
      await Promise.all(ls.map(l => kv.raw(['HINCRBY', key, l + '|n', '1']).catch(() => null))); await kv.raw(['SADD', PIL_SET, key]).catch(() => null); n++; }
    else if (e.e === 'w') { const l = pilLabel(e.l), w = Math.max(0, Math.min(20, N(e.w))), oud = Math.max(0, Math.min(w, N(e.oud))); if (!l || w <= oud) continue;
      if (!N(await kv.raw(['HEXISTS', key, l + '|n']).catch(() => 0))) continue;
      await kv.raw(['HINCRBYFLOAT', key, l + '|s', String(w - oud)]).catch(() => null); await kv.raw(['HINCRBYFLOAT', key, l + '|q', String(w * w - oud * oud)]).catch(() => null);
      if (!oud) await kv.raw(['HINCRBY', key, l + '|t', '1']).catch(() => null); n++; }
  }
  return { ok: true, n };
}
// stand: cache (treffers, modelaanroepen, steekproeven, afwijkingen per dag) en per stap de pills met gezien, getikt en gemiddelde waarde
export async function kzCacheStand() {
  const dagen = []; for (let i = 0; i < 7; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); const h = parenH(await kv.raw(['HGETALL', 'kz:pc:d:' + d]).catch(() => null)); const t = Object.fromEntries(Object.entries(h).map(([k, v]) => [k, N(v)])); const mp = N(t.model_pill), tr = N(t.treffer); dagen.push({ dag: d, ...t, pillAdviezen: mp + tr, cacheAandeelPct: mp + tr ? Math.round(100 * tr / (mp + tr)) : null }); }
  const sets = ((await kv.raw(['SMEMBERS', PIL_SET]).catch(() => [])) || []).slice(0, 80).sort(); const pills = {};
  for (const k of sets) { const h = parenH(await kv.raw(['HGETALL', k]).catch(() => null)); const per = {};
    for (const [f, v] of Object.entries(h)) { const i = f.lastIndexOf('|'); const l = f.slice(0, i), x = f.slice(i + 1); (per[l] = per[l] || { gezien: 0, getikt: 0, s: 0 }); if (x === 'n') per[l].gezien = N(v); if (x === 't') per[l].getikt = N(v); if (x === 's') per[l].s = N(v); }
    pills[k.replace(/^kz:pil:/, '')] = Object.entries(per).map(([l, o]) => ({ pill: l, gezien: o.gezien, getikt: o.getikt, waarde: o.gezien ? Math.round(100 * o.s / o.gezien) / 100 : null })).sort((a, b) => (b.waarde || 0) - (a.waarde || 0)); }
  return { ok: true, uitleg: 'Cache per pill-pad: treffer = advies uit de cache, model_pill = advies na pills via het model (nieuw pad of steekproef), steek = steekproef (5%, 25% na afwijking), afwijk = steekproef gaf ander advies, model_getypt = getypte vraag (altijd model). Pills: waarde = gemiddelde verste stap na de tik per keer gezien (volgende stap 1, intentie 3, advies 4, winkel 10, blijf 12, gekoppeld 15).', dagen, pills };
}
