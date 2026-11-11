// Vraag naast aanbod voor Kadoly (Henkjan 10 nov 2026: "Vind voor kadoly.com ook onderwerpen voor chatgpt om naar boven te halen
// en in de winkel te brengen je kunt demandradar gebruiken").
// Bron: Demand Radar /api/zoekvraag (thema's kadoly-wonen, kadoly-hobby, kadoly-cadeau; NL en BE; per thema hooguit één keer per
// 7 dagen bij DataForSEO gekocht, daarna gratis uit de opslag). Hier per onderwerp: hoeveel mensen er per maand naar zoeken,
// hoeveel Kadoly ervan heeft, of er al een gids is, en welke vragen mensen stellen (die vragen stellen ze ook aan ChatGPT).
// Uitkomst per onderwerp: 'nieuwe gids' (vraag en aanbod, nog geen gids), 'gids aanscherpen' (gids bestaat, zoektermen erin),
// 'in de winkel brengen' (vraag, te weinig aanbod: inkopen bij Orderchamp), of niets (te weinig vraag).
// Lerend: de dagelijkse gidsronde kiest uit deze lijst; wat een gids daarna oplevert (bezoek uit AI en zoek, kliks naar de winkel)
// staat per gids in /api/gids?op=stand en telt mee in de volgorde (geleerd).
import { kv } from './db.js';
import { GIDSEN } from './gidsen-kadoly.js';
import { KADOLY_BIJ } from './kz-kadoly.js';

export const VRAAG_THEMAS = ['kadoly-wonen', 'kadoly-hobby', 'kadoly-cadeau'];
const DR = 'https://demandradar-ivory.vercel.app/api/zoekvraag';
const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

// Onderwerpen: re = zoekterm, cat = producttitel in de catalogus (kleine letters). Volgorde telt: eerste treffer wint.
export const KERNEN = [
  ['kerstbal', 'Kerstballen', /kerstbal/, /kerstbal/],
  ['kerststal', 'Kerststal', /kerststal/, /kerststal/],
  ['kerstkrans', 'Kerstkransen en adventskransen', /kerstkrans|deurkrans|adventskrans|krans/, /krans/],
  ['kerstboomversiering', 'Kerstboomversiering en ornamenten', /kerstboomversiering|kerstornament|kerst ornament|kersthanger/, /ornament|kersthanger|kerstboomhanger/],
  ['kerstdecoratie', 'Kerstdecoratie', /kerstdecoratie|kerstversiering|kerst decoratie|kerstbeeld/, /kerst/],
  ['schoencadeau', 'Schoencadeautjes Sinterklaas', /schoencadeau|schoen cadeau|sinterklaascadeau|surprise/, /sinterklaas|sint |piet/],
  ['orchidee', 'Orchideeën', /orchidee/, /orchidee|phalaenopsis/],
  ['kunstplant', 'Kunstplanten en kunstbloemen', /kunstplant|kunstbloem|nepplant|kunst plant/, /kunstplant|kunstbloem|kunstmatige|levensechte/],
  ['sierpot', 'Bloempotten en sierpotten', /bloempot|plantenpot|sierpot|bloem pot|planten pot/, /bloempot|plantenpot|sierpot|\bpot\b|pot voor/],
  ['plantenbak', 'Plantenbakken', /plantenbak|plantenbakken/, /plantenbak/],
  ['plantenstandaard', 'Plantenstandaards en plantenrekken', /plantenstandaard|plantenrek|plantentafel|plantenzuil|plantenkolom/, /plantenstandaard|plantenrek|plantentafel|plantenkolom|plantenzuil/],
  ['vaas', 'Vazen', /vaas|vazen|vaasje/, /vaas|vase|vazen|vaasje/],
  ['muurcirkel', 'Muurcirkels', /muurcirkel|wandcirkel/, /muurcirkel/],
  ['tuinposter', 'Tuinposters', /tuinposter|tuin poster/, /tuinposter/],
  ['muursticker', 'Muurstickers', /muursticker|muurstickers/, /muursticker/],
  ['wanddecoratie', 'Wanddecoratie', /wanddecoratie|muurdecoratie|wandkleed|wandbord|wanddeco/, /wanddecoratie|muurdecoratie|wandkleed|wandbord|wanddeco/],
  ['tafellamp', 'Tafellampen', /tafellamp|tafel lamp|oplaadbare lamp|snoerloze lamp|draadloze lamp|leeslamp|bureaulamp/, /tafellamp|oplaadbare|draadloze lamp|leeslamp|bureaulamp/],
  ['hanglamp', 'Hanglampen', /hanglamp/, /hanglamp/],
  ['lantaarn', 'Lantaarns en windlichten', /lantaarn|windlicht/, /lantaarn|windlicht/],
  ['kandelaar', 'Kandelaars en kaarshouders', /kandelaar|kaarshouder|theelichthouder|waxinelichthouder/, /kandelaar|kaarshouder|theelicht|waxine/],
  ['geurkaars', 'Geurkaarsen en kaarsen', /geurkaars|kaars/, /kaars/],
  ['windgong', 'Windgongen', /windgong|windorgel/, /windgong/],
  ['windspinner', 'Windspinners', /windspinner|windmolen tuin|windspel/, /windspinner/],
  ['tuinbeeld', 'Tuinbeelden en tuindecoratie', /tuinbeeld|tuindecoratie|tuinsteker|tuin decoratie/, /tuinbeeld|tuindecoratie|tuinsteker/],
  ['bijzettafel', 'Bijzettafels', /bijzettafel/, /bijzettafel/],
  ['dienblad', 'Dienbladen', /dienblad/, /dienblad/],
  ['plaid', 'Plaids en dekens', /plaid|wollen deken|deken/, /plaid|deken|blanket/],
  ['sierkussen', 'Sierkussens', /sierkussen|kussen/, /kussen/],
  ['mand', 'Manden en wasmanden', /wasmand|opbergmand|rieten mand|mand/, /mand/],
  ['diffuser', 'Geurstokjes en diffusers', /diffuser|geurstokjes/, /diffuser|geurstok/],
  ['3d-puzzel', '3D-puzzels en bouwpakketten', /3d puzzel|bouwpakket|modelbouw|3d houten/, /3d|bouwpakket|bouwset|modelbouw/],
  ['legpuzzel', 'Legpuzzels', /legpuzzel|houten puzzel|puzzel volwassenen|puzzels/, /legpuzzel|puzzel/],
  ['muziekdoos', 'Muziekdozen', /muziekdoos/, /muziekdoos/],
  ['spaarpot', 'Spaarpotten', /spaarpot/, /spaarpot/],
  ['sokken', 'Sokken', /alpaca sokken|sokken/, /sokken/],
  ['handzeep', 'Handzeep', /handzeep/, /handzeep|zeep/],
  ['scheerset', 'Scheren', /scheerset|scheermes|scheerkwast|scheerolie/, /scheer/],
  ['servies', 'Servies', /servies|ontbijtbord|dinerbord/, /servies|bord|kom /],
  ['mok', 'Mokken en bekers', /mokken|mok |beker/, /mok|beker/],
  ['theepot', 'Theepotten en koffie', /theepot|koffiekan/, /theepot|koffie|thee/],
];

// Cadeauvragen: 'cadeau voor <wie>' of een gelegenheid. Die vragen stellen mensen letterlijk aan ChatGPT.
const WIE = [['vrouw', /vrouw|vriendin|haar\b|zus|dames/], ['man', /\bman\b|mannen|vriend\b|hem\b|broer|heren/], ['moeder', /moeder|mama|oma/], ['vader', /vader|papa|opa/],
  ['collega', /collega|personeel|werknemer|baas/], ['kind', /kind|kinderen|jongen|meisje|tiener|baby|peuter/], ['leerkracht', /juf|meester|leraar|leerkracht/],
  ['iemand die alles heeft', /alles heeft|heeft alles/], ['tuinliefhebber', /tuin|planten/], ['nieuwe woning', /nieuwe woning|housewarming|verhuis/],
  ['pensioen of afscheid', /pensioen|afscheid/], ['verjaardag', /verjaardag|jarig|\d+ jaar/], ['geboorte', /geboorte|kraam/], ['bedankt', /bedank/], ['sterkte of beterschap', /sterkte|beterschap|rouw/]];
const GEL = [['kerst', /kerst/], ['sinterklaas', /sinterklaas|sint\b|schoen/], ['valentijn', /valentijn/], ['moederdag', /moederdag/], ['vaderdag', /vaderdag/]];
// cadeaukaarten, bonnen en winkelnamen zijn geen productvraag
// merken, winkels en plaatsnamen die toevallig het woord bevatten (Vaassen, Makado Beek, Pantropica) zijn geen vraag die Kadoly kan beantwoorden
const MERK_UIT = /kleurplaat|vaassen|funda|hoeve|pantropica|makado|kadoman|ikea|\baction\b|gamma|praxis|karwei|intratuin|rituals|hkliving|gillette|xenos|jysk|kwantum|leen bakker|dille|hornbach|bol\.com|amazon|temu|shein|aliexpress/;
const CADEAU_UIT = /cadeaukaart|cadeau kaart|cadeaubon|kadobon|kadokaart|giftcard|gift card|cadeaucard|\bvvv\b|v v v|besteden|saldo|\bbol\b|intertoys|blokker|hema|action|kruidvat|\bcode\b|inwisselen|geldig/;
// producten waar mensen in cadeauvragen naar zoeken: heeft Kadoly ze niet (minder dan 3), dan is het een inkooptip
export const CADEAU_PRODUCT = [['sieraden', /sieraad|sieraden|ketting|armband|oorbel|ring\b/, /sieraad|ketting|armband|oorbel|\bring\b/], ['parfum', /parfum|geur(?!kaars)/, /parfum/],
  ['bloemen', /bloemen|boeket/, /boeket|bos bloemen|verse bloemen/], ['chocolade en snoep', /chocola|bonbon|snoep/, /chocola|bonbon/], ['wijn en drank', /wijn|whisky|gin\b|bier|drank|champagne/, /wijn|whisky|\bgin\b|bier|champagne/],
  ['knuffels', /knuffel/, /knuffel/], ['boeken', /\bboek|boeken/, /\bboek\b|boeken/], ['horloges', /horloge/, /horloge/], ['tassen en portemonnees', /\btas\b|tassen|portemonnee/, /\btas\b|tassen|portemonnee/],
  ['wellness en verzorging', /wellness|spa\b|verwen|beauty|verzorging|badset/, /verwen|wellness|badzout|bodylotion|badbruis|giftset|verzorging/], ['cadeaupakketten en boxen', /pakket|box\b|cadeaubox|giftbox|mand\b/, /pakket|giftbox|cadeaubox|cadeauset|giftset/],
  ['gepersonaliseerd', /gepersonaliseerd|met naam|naam erop|foto/, /gepersonaliseerd|met naam/], ['kaarsen', /kaars/, /kaars/], ['planten', /plant|orchidee/, /plant|orchidee/], ['puzzels en spellen', /puzzel|spel\b|spellen/, /puzzel|spel\b|spellen/]];
const VRAAGWOORD = /^(wat|welke|welk|hoe|waar|wanneer|waarom|is |zijn |kan |mag |moet )|beste|goede|leuke|ideeën|ideeen|idee|tips|origineel|originele|bijzonder|onder \d+|tot \d+|\d+ euro|vs\b|of /;

export function kernVan(k) {
  if (/cadeau|kado|cadeautje|kadootje|geschenk|presentje|giftset|cadeaubox/.test(k)) {
    const g = GEL.find(([, r]) => r.test(k)), w = WIE.find(([, r]) => r.test(k));
    if (g && w) return { id: 'cadeau-' + g[0] + '-' + w[0].replace(/\s+/g, '-'), naam: g[0][0].toUpperCase() + g[0].slice(1) + 'cadeau voor ' + w[0], cadeau: true };
    if (w) return { id: 'cadeau-' + w[0].replace(/\s+/g, '-'), naam: 'Cadeau voor ' + w[0], cadeau: true };
    if (g) return { id: 'cadeau-' + g[0], naam: g[0][0].toUpperCase() + g[0].slice(1) + 'cadeau', cadeau: true };
    const prod = KERNEN.find(([, , re]) => re.test(k)); if (prod) return { id: prod[0], naam: prod[1], cat: prod[3] };
    return { id: 'cadeau-algemeen', naam: 'Cadeau (algemeen)', cadeau: true };
  }
  const prod = KERNEN.find(([, , re]) => re.test(k)); return prod ? { id: prod[0], naam: prod[1], cat: prod[3] } : null;
}

// maandreeks: Demand Radar geeft de laatste 12 maanden, nieuwste eerst. Vast = laagste maand, piek = hoogste, jaar = gemiddelde.
function reeks(m) { const v = (m || []).map(N).filter(x => x >= 0); if (!v.length) return null; return { nu: v[0], vast: Math.min(...v), piek: Math.max(...v), gem: Math.round(v.reduce((a, b) => a + b, 0) / v.length), m: v }; }

async function haalEen(th, cc, vers) {
  const sleutel = 'gk:vraag:' + th + ':' + cc; let d = null;
  try { d = await kv.get(sleutel); } catch (e) {}
  if (vers || !d || Date.now() - N(d.at) > 24 * 3600e3) {
    // zoekvraag koopt per thema hooguit één keer per 7 dagen (binnen de DataForSEO-dagrem); daarna gratis uit de opslag
    try { const r = await fetch(DR + '?thema=' + th + '&cc=' + cc, { signal: AbortSignal.timeout(50000) }); if (r.ok) { const j = await r.json(); if (j.markt) { d = { at: Date.now(), bijgewerkt: j.bijgewerkt, termen: (j.markt.termen || []).map(x => ({ k: x.k, v: x.v, y: x.y, i: x.i, m: x.m })) }; try { await kv.set(sleutel, d); } catch (e) {} } } else if (!d) d = { at: 0, fout: 'zoekvraag ' + r.status, termen: [] }; } catch (e) { if (!d) d = { at: 0, fout: String(e.message || e).slice(0, 80), termen: [] }; }
  }
  return d;
}
export async function haalVraag(vers = false) {
  const uit = {};
  // NL eerst (die aanroep koopt beide markten van het thema), parallel per thema; daarna BE uit de opslag
  const nl = await Promise.all(VRAAG_THEMAS.map(th => haalEen(th, 'NL', vers)));
  const be = await Promise.all(VRAAG_THEMAS.map(th => haalEen(th, 'BE', vers)));
  VRAAG_THEMAS.forEach((th, i) => { if (nl[i]) uit[th + ':NL'] = nl[i]; if (be[i]) uit[th + ':BE'] = be[i]; });
  return uit;
}

// gidsen en keuzehulp.best-pagina's met Kadoly-blok die over dit onderwerp gaan
function dekking(kern) {
  const gidsen = Object.values(GIDSEN).filter(g => { const t = (g.slug + ' ' + g.titel).toLowerCase().replace(/-/g, ' '); const k = KERNEN.find(x => x[0] === kern.id); return k ? k[2].test(t) || t.includes(kern.id.replace(/-/g, ' ')) : false; }).map(g => g.slug);
  const kz = Object.entries(KADOLY_BIJ).filter(([s]) => { const t = s.replace(/-/g, ' '); const k = KERNEN.find(x => x[0] === kern.id); if (kern.cadeau) { const w = kern.naam.toLowerCase().replace(/^.*cadeau voor /, '').replace(/cadeau$/, '').trim(); return !!w && (' ' + t + ' ').includes(' ' + w + ' '); } return k ? k[2].test(t) : false; }).map(([s]) => s);
  return { gidsen, kz };
}

// welke plek in de maandreeks is december en welke november? Uit de data zelf: de kerstzoektermen pieken in december, november is de buur met het meeste volume
function kerstMaanden(vraag) {
  const som = []; for (const d of Object.values(vraag)) for (const x of d.termen || []) if (/kerst/.test(String(x.k)) && Array.isArray(x.m) && x.m.length >= 12) x.m.forEach((v, i) => { som[i] = N(som[i]) + N(v); });
  if (!som.length) return null; const dec = som.indexOf(Math.max(...som)); const a = N(som[dec - 1]), b = N(som[dec + 1]); return { dec, nov: b >= a ? dec + 1 : dec - 1 };
}
export function kansen(vraag, catItems, { min = 150 } = {}) {
  const items = (catItems || []).filter(i => i && i.t && i.vr !== false);
  const per = {}, KM = kerstMaanden(vraag);
  for (const [sleutel, d] of Object.entries(vraag)) {
    const cc = sleutel.split(':')[1];
    for (const x of d.termen || []) {
      const k = String(x.k || '').toLowerCase(); if (CADEAU_UIT.test(k) || MERK_UIT.test(k)) continue; const kern = kernVan(k); if (!kern) continue;
      const r = reeks(x.m) || { nu: N(x.v), vast: N(x.v), piek: N(x.v), gem: N(x.v), m: [] };
      const o = per[kern.id] ||= { id: kern.id, naam: kern.naam, cadeau: !!kern.cadeau, cat: kern.cat || null, gem: 0, vast: 0, piek: 0, nu: 0, landen: {}, termen: [], vragen: [], gezien: new Set() };
      // Google geeft schrijfvarianten (enkelvoud, meervoud, met of zonder spatie) hetzelfde volume en dezelfde maandreeks: die tellen één keer
      const sleutelR = cc + ':' + (r.m.length ? r.m.join(',') : k); if (o.gezien.has(sleutelR) || o.gezien.has(cc + ':' + k)) continue; o.gezien.add(sleutelR); o.gezien.add(cc + ':' + k);
      o.gem += r.gem; o.vast += r.vast; o.piek += r.piek; o.nu += r.nu; o.landen[cc] = N(o.landen[cc]) + r.gem; o.novdec = N(o.novdec) + (KM && r.m.length > Math.max(KM.dec, KM.nov) ? Math.round((N(r.m[KM.dec]) + N(r.m[KM.nov])) / 2) : r.gem);
      const t = { k, cc, v: N(x.v), gem: r.gem, piek: r.piek, y: x.y ?? null, i: x.i || null };
      o.termen.push(t); if (VRAAGWOORD.test(k)) o.vragen.push(t);
    }
  }
  const lijst = [];
  for (const o of Object.values(per)) {
    o.termen.sort((a, b) => b.gem - a.gem); o.vragen.sort((a, b) => b.gem - a.gem);
    const aanbod = o.cat ? items.filter(i => o.cat.test(String(i.t).toLowerCase())) : [];
    const d = dekking(o);
    let actie = null;
    if (o.gem < min && o.piek < min * 3) actie = 'te weinig vraag';
    else if (o.cadeau) actie = d.kz.length || d.gidsen.length ? 'gids aanscherpen' : 'cadeaugids';
    else if (aanbod.length < 3) actie = 'in de winkel brengen';
    else if (d.gidsen.length) actie = 'gids aanscherpen';
    else actie = 'nieuwe gids';
    // score: vraag per maand (gemiddeld en de piek, voor seizoen) maal aandeel vraagtermen (wat mensen aan ChatGPT vragen)
    const vraagdeel = o.termen.length ? o.vragen.reduce((s, t) => s + t.gem, 0) / Math.max(1, o.gem) : 0;
    const score = Math.round((o.gem + 0.5 * N(o.novdec)) * (1 + Math.min(1, vraagdeel * 3)) * (actie === 'nieuwe gids' ? 1 : actie === 'cadeaugids' ? 0.9 : actie === 'in de winkel brengen' ? 0.6 : actie === 'gids aanscherpen' ? 0.5 : 0.1));
    lijst.push({ id: o.id, naam: o.naam, actie, score, zoekenPerMaand: o.gem, novDecPerMaand: N(o.novdec), piekmaand: o.piek, laagstemaand: o.vast, landen: o.landen, aanbod: aanbod.length,
      voorbeelden: aanbod.slice(0, 6).map(i => ({ id: i.id, t: i.t, b: i.b || null })), gidsen: d.gidsen, keuzehulpen: d.kz,
      toptermen: o.termen.slice(0, 10).map(t => ({ k: t.k, cc: t.cc, perMaand: t.gem, piek: t.piek, jaartrend: t.y })),
      vragen: o.vragen.slice(0, 10).map(t => ({ k: t.k, cc: t.cc, perMaand: t.gem, piek: t.piek })) });
  }
  return lijst.sort((a, b) => b.score - a.score);
}

// cadeauvragen per productsoort, naast het aanbod: minder dan 3 producten = in de winkel brengen (inkooptip, niet zelf inkopen)
export function inkoop(vraag, catItems) {
  const items = (catItems || []).filter(i => i && i.t && i.vr !== false); const per = {};
  for (const [sleutel, d] of Object.entries(vraag)) { const cc = sleutel.split(':')[1]; for (const x of d.termen || []) { const k = String(x.k || '').toLowerCase(); if (CADEAU_UIT.test(k) || !/cadeau|kado|geschenk|presentje/.test(k)) continue;
    const p = CADEAU_PRODUCT.find(([, re]) => re.test(k)); if (!p) continue; const r = reeks(x.m) || { gem: N(x.v), piek: N(x.v), m: [] };
    const o = per[p[0]] ||= { soort: p[0], gem: 0, piek: 0, termen: [], gezien: new Set() }; const s = cc + ':' + (r.m.length ? r.m.join(',') : k); if (o.gezien.has(s)) continue; o.gezien.add(s);
    o.gem += r.gem; o.piek += r.piek; o.termen.push({ k, cc, perMaand: r.gem }); } }
  return Object.values(per).map(o => { const def = CADEAU_PRODUCT.find(x => x[0] === o.soort); const aanbod = items.filter(i => def[2].test(String(i.t).toLowerCase())).length;
    return { soort: o.soort, zoekenPerMaand: o.gem, piekmaand: o.piek, aanbod, actie: aanbod < 3 || (aanbod < 10 && o.gem > 5000) ? 'in de winkel brengen' : 'in cadeaugidsen tonen', termen: o.termen.sort((a, b) => b.perMaand - a.perMaand).slice(0, 5) }; })
    .sort((a, b) => b.zoekenPerMaand - a.zoekenPerMaand);
}

export async function vraagKansen({ vers = false, catItems } = {}) {
  const vraag = await haalVraag(vers);
  const lijst = kansen(vraag, catItems);
  const bron = Object.fromEntries(Object.entries(vraag).map(([k, d]) => [k, { bijgewerkt: d.bijgewerkt || null, termen: (d.termen || []).length, ...(d.fout ? { fout: d.fout } : {}) }]));
  if (!lijst.length) return { ok: false, bron, uitleg: 'Nog geen zoekvraag binnen. Demand Radar koopt de data na 00:00 UTC (dagrem DataForSEO); de cron /api/gids?op=vraagkansen&vers=1 om 00:20 UTC haalt hem op.' };
  const tel = a => lijst.filter(x => x.actie === a).length;
  return { ok: true, bron, uitleg: 'zoekenPerMaand = gemiddeld per maand over 12 maanden (NL + BE); piekmaand = drukste maand; vragen = zoektermen met vraag- of keuzewoorden (wat, welke, beste, ideeën, onder 20 euro): zo vragen mensen het ook aan ChatGPT. actie: nieuwe gids (vraag en aanbod, nog geen gids), cadeaugids (cadeauvraag zonder pagina), gids aanscherpen (pagina bestaat, zet de grootste termen in titel en FAQ), in de winkel brengen (vraag, minder dan 3 producten: inkopen).',
    telling: { 'nieuwe gids': tel('nieuwe gids'), cadeaugids: tel('cadeaugids'), 'gids aanscherpen': tel('gids aanscherpen'), 'in de winkel brengen': tel('in de winkel brengen') },
    volgende: lijst.find(x => x.actie === 'nieuwe gids') || null, inkoop: inkoop(vraag, catItems), kansen: lijst.filter(x => x.actie !== 'te weinig vraag'), weinig: lijst.filter(x => x.actie === 'te weinig vraag').map(x => ({ id: x.id, naam: x.naam, zoekenPerMaand: x.zoekenPerMaand })) };
}
