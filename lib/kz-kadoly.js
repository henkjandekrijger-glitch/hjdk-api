// Kadoly op keuzehulp.best (Henkjan 2 nov 2026: "maak ook keuzehulp voor kadoly.com producten en stuur door evt vergelijk met bol").
// Een keuzehulp met item.kadoly = '<gids>' toont bovenaan drie keuzes uit die gids van gids.kadoly.com (met de hand geschreven op makersfeiten),
// met de prijs inclusief verzending en de bezorgdag van vandaag uit de shopcatalogus; de drie vragen eronder vergelijken met bol.
// Verwante bestaande keuzehulpen (KADOLY_BIJ) tonen hetzelfde blok lager op de pagina. Kliks gaan via gids.kadoly.com/naar/<pid>
// (fn/shop.js op=gidsuit, Clickmind) met g=kz-<slug> en b=kz, dus ze staan per keuzehulp in /api/gids?op=stand.
// Eerlijk: we zeggen erbij dat Kadoly bij dezelfde makers hoort, en een uitverkocht product verdwijnt vanzelf.
import { kv } from './db.js';
import { GIDSEN, vulPids } from './gidsen-kadoly.js';

// 18 nov (Henkjan: "En Kadoly natuurlijk heb net weer veel producten toegevoegd"): de 3D-puzzels, windspinners en houten legpuzzels zijn uit de shop;
// hun koppelingen zijn eruit en de nieuwere gidsen (kaarsen, badset, whisky, servies, scheerset, alpaca sokken, bureau-accessoires) hangen nu aan bestaande keuzehulpen.
export const KADOLY_BIJ = {
  'cadeau-voor-iemand-die-alles-heeft': 'badset-cadeau',
  'kerstdecoratie-kiezen': 'kerstdecoratie',
  'kerstservies': 'serviesset',
  'kerstcadeau-collega': 'kaarsen-cadeau',
  'kerstcadeau-partner': 'badset-cadeau',
  'cadeau-opa': 'whisky-set-cadeau',
  'sinterklaas-cadeau-man': 'scheerset-cadeau',
  'sinterklaas-cadeau-man-100-euro': 'whisky-set-cadeau',
  'kerstpakket': 'whisky-set-cadeau',
  'cadeau-schoonmoeder': 'orchidee-cadeau',
  'cadeau-oma-80-jaar': 'orchidee-cadeau',
  'cadeau-juf-meester': 'kaarsen-cadeau',
  'cadeau-voor-zwangere-vrouw': 'badset-cadeau',
  'handdoeken': 'badset-cadeau',
  'zit-sta-bureau': 'houten-bureau-accessoires',
  'bureaustoel': 'houten-bureau-accessoires',
  'warmwaterkruik': 'alpaca-sokken',
  'kamerplanten-thuis-kiezen': 'sierpot-orchidee',
  'cadeau-voor-tuinliefhebbers': 'sierpot-orchidee',
  'leeslamp': 'oplaadbare-tafellamp',
  'bureaulamp': 'oplaadbare-tafellamp',
  'kerstcadeau-buren': 'lantaarn-voor-binnen',
  'cadeau-voor-iemand-die-net-verhuisd-is': 'lantaarn-voor-binnen',
  'schoencadeautjes': 'schoencadeautjes-sinterklaas',
  'kunstkerstboom': 'kerstballen-set',
  'kerstverlichting': 'kerstballen-set',
  'kerstboomstandaard-kiezen': 'kerstballen-set',
  'kinderkamer-opbergkast-speelgoed': 'muursticker-kinderkamer',
  'nachtlamp-kind-slaaptrainer': 'muursticker-kinderkamer',
  'plaid': 'wollen-deken',
  // 18 nov (Henkjan: lampen in de keuzehulpen en naar ons sturen): grote rotan hanglampen van Bazar Bizar
  'eettafel': 'grote-hanglamp',
  'eettafel-uitschuifbaar': 'grote-hanglamp',
  'bank': 'grote-hanglamp',
  'vloerkleed': 'grote-hanglamp',
  // 18 nov (Henkjan: high ticket, eerst Europa): massagestoelen van Rest Lords en buitensauna's van Baltresto, zodra ze in de shop staan
  'massagekussen': 'massagestoel',
  'massagegun': 'massagestoel',
  'buitensauna-barrelsauna': 'buitensauna',
  'massagestoel': 'massagestoel',
  'cadeau-voor-koude-voeten-en-winterwarmte': 'wollen-deken',
  'kerstcadeau-oma': 'wollen-deken',
};

const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let CAT = null, CAT_AT = 0;
async function catalogus() {
  if (CAT && Date.now() - CAT_AT < 300000) return CAT;
  let c = null; try { c = await kv.get('hjdk:shop:cat'); } catch (e) {}
  const m = {}; for (const i of ((c && c.items) || [])) m[i.id] = i; try { vulPids(m); } catch (e) {} CAT = m; CAT_AT = Date.now(); return m;
}
const thuis = i => Math.round((N(i.p) + (i.fs ? 0 : N(i.vk))) * 100) / 100;
const euro = n => '€ ' + N(n).toFixed(2).replace('.', ',');
function leverDag(lt) { const d = new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' }) + 'T12:00:00Z'); let n = Math.max(1, N(lt) || 5); while (n > 0) { d.setUTCDate(d.getUTCDate() + 1); const w = d.getUTCDay(); if (w !== 0 && w !== 6) n--; } return d.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', weekday: 'long', day: 'numeric', month: 'long' }); }

export const KDB_CSS = `.kdb{margin:22px 0}.kdb h2{margin:0 0 6px}.kdb-uit{color:var(--ink-2,#57534e);font-size:15px;margin:0 0 12px}.kdb-r{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-top:1px solid var(--line,#e7e5e4)}.kdb-r img{width:84px;height:84px;object-fit:cover;border-radius:12px;background:#EEF1FC;flex:none}.kdb-r .kdb-l{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--acc,#2B47C4);font-weight:600;margin:0 0 2px}.kdb-r h3{font-size:16px;margin:0 0 4px}.kdb-r p{margin:0 0 6px;font-size:15px}.kdb-r .kdb-let{color:#78716c;font-size:14px}.kdb-p{font-weight:600}.kdb-r .btn{display:inline-block;margin-top:4px;padding:9px 18px;border-radius:999px;background:var(--acc,#2B47C4);color:#fff;text-decoration:none;font-weight:600;font-size:15px}.kdb-meer{font-size:14px;margin:10px 0 0}`;

// boven: true op een Kadoly-keuzehulp (direct onder het korte antwoord), anders lager als "Ook bij Kadoly"
// Curady (curady.com, high-ticket tak van Kadoly; 19 nov 2026, Henkjan: "He.b je in mijn keuzehulp project gekeken? ... Werk samenn ."):
// zolang er geen Kadoly-producten in de gids staan, toont de keuzehulp bovenaan Curady als leverancier op maat, met een link naar de keuzehulp
// en de offerte op curady.com (Clickmind meet via cm.js daar; ?van=kz-<slug> laat zien welke keuzehulp de aanvraag bracht).
export const CURADY_KZ = { 'buitensauna-barrelsauna': ['/nl/buitensauna', 'buitensauna'], 'houtgestookte-hottub': ['/nl/hottub', 'hottub'], 'massagestoel': ['/nl/massagestoel', 'massagestoel'] };
function curadyBlok(item) {
  const c = CURADY_KZ[item.slug]; if (!c) return '';
  const u = 'https://curady.com' + c[0] + '?van=' + encodeURIComponent('kz-' + item.slug);
  return `<section class="txt kdb" id="curady"><h2>Op maat via Curady</h2><p class="kdb-uit">Curady is de wellnesswinkel van dezelfde makers als keuzehulp.best en Kadoly. Wil je liever een ${esc(c[1])} op maat met één aanspreekpunt voor keuze, levering en vragen achteraf? Beantwoord daar drie vragen en vraag een vrijblijvende offerte met de prijs tot aan je deur. Hieronder vergelijk je met wat nu bij bol te koop is.</p><p class="kdb-meer"><a href="${esc(u)}">Kies je ${esc(c[1])} bij Curady</a> · <a href="${esc(u)}#offerte">Vraag direct een offerte</a> · <a href="#q0">of vergelijk met bol</a></p></section>`;
}
export async function kadolyBlok(item) {
  const gs = item.kadoly || KADOLY_BIJ[item.slug]; const g = gs && GIDSEN[gs]; if (!g) return curadyBlok(item);
  const boven = !!item.kadoly; const cat = await catalogus().catch(() => ({}));
  const rijen = (g.keuze || []).map(k => ({ k, i: cat[k.pid] })).filter(x => x.i && x.i.vr !== false).slice(0, boven ? 3 : 2);
  if (!rijen.length) return curadyBlok(item);
  const gk = ('kz-' + item.slug).slice(0, 60);
  const kop = boven ? 'Onze keuze bij Kadoly' : 'Ook bij Kadoly';
  return `<section class="txt kdb" id="kadoly"><h2>${kop}</h2><p class="kdb-uit">Kadoly is een webwinkel van dezelfde makers als keuzehulp.best. ${boven ? 'Dit zijn de keuzes uit hun gids, met de prijs inclusief verzending. Wil je eerst vergelijken? De drie vragen hieronder zoeken het passende product bij bol.' : 'Uit hun gids over dit onderwerp, met de prijs inclusief verzending.'}</p>` +
    rijen.map(({ k, i }) => `<div class="kdb-r">${i.img ? `<img src="${esc(i.img)}" alt="${esc(k.naam || i.t)}" loading="lazy" width="84" height="84">` : ''}<div><p class="kdb-l">${esc(k.label)}</p><h3>${esc(k.naam || i.t)}</h3><p>${esc(k.waarom)}</p>${k.beperking ? `<p class="kdb-let">Let op: ${esc(k.beperking)}</p>` : ''}<p><span class="kdb-p">${euro(thuis(i))}</span> inclusief verzending · in huis rond ${esc(leverDag(i.lt))}</p><a class="btn" href="https://gids.kadoly.com/naar/${encodeURIComponent(k.pid)}?g=${encodeURIComponent(gk)}&b=kz" rel="nofollow">Bekijk bij Kadoly</a></div></div>`).join('') +
    `<p class="kdb-meer"><a href="https://gids.kadoly.com/${esc(gs)}">Lees de hele gids bij Kadoly</a>${boven ? ' · <a href="#q0">of vergelijk met bol</a>' : ''}</p></section>`;
}
