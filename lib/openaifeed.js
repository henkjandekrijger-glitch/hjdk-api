// Productfeed voor ChatGPT Shopping (24 nov 2026, Henkjan: "Ja . begin ." op: Kadoly in de productresultaten van ChatGPT).
// Formaat: OpenAI product feed, JSONL, één regel per product. De negen verplichte velden: item_id, title, description, url, brand,
// seller_name, image_url, availability, price; plus target_countries en store_country (geo) en condition.
// Bron: developers.openai.com/commerce/specs/file-upload/products (gelezen via zoekresultaten 24 nov 2026). Zoeken staat standaard aan,
// afrekenen in ChatGPT standaard uit; dat laten we zo. Aanmelden doet Henkjan op chatgpt.com/merchants, daarna geeft hij deze URL op:
// https://go.kadoly.com/api/shop/chatgpt.jsonl (fn/shop.js op=chatgpt). Uitverkochte producten blijven erin als out_of_stock.
// Prijs = wat de klant betaalt (inclusief btw en verzending), zoals overal bij Kadoly. Foto als JPEG via /api/shop/beeld (geen webp).
// Omschrijving: de feiten uit de gids als het product daar staat (waarom en wat de maker niet noemt), anders titel, merk en levertijd.
import { aanbevelingToegestaan } from './gids-onderzoek.js';

const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const schoon = (s, max) => String(s == null ? '' : s).replace(/<[^>]+>/g, ' ').replace(/[–—]/g, ',').replace(/\s+/g, ' ').trim().slice(0, max);
const RUB = { wonen: 'Wonen en decoratie', hobby: 'Hobby en creatief', kids: 'Kinderen en speelgoed', tech: 'Tech en gadgets', beauty: 'Beauty en verzorging', mode: 'Mode en accessoires', keuken: 'Keuken en tafel', cadeaus: 'Cadeaus', dieren: 'Dieren' };
const hoofd = x => x ? x.charAt(0).toUpperCase() + x.slice(1).replace(/-/g, ' ') : '';

// items: shopcatalogus (hjdk:shop:cat), gids: pid -> { waarom, beperking, slug }
export function openaiFeed(items, gids = {}, opt = {}) {
  const landen = opt.landen || ['NL', 'BE'];
  const regels = []; const tel = { totaal: 0, opVoorraad: 0, metGids: 0, overgeslagen: 0 };
  for (const it of items || []) {
    const p = N(it.p); if (!(p > 0) || !it.img || !it.t || !it.id) { tel.overgeslagen++; continue; }
    if (!aanbevelingToegestaan(it)) { tel.overgeslagen++; continue; }
    const totaal = Math.round((p + (it.fs ? 0 : N(it.vk))) * 100) / 100;
    const g = gids[it.id]; const merk = schoon(it.b, 70) || 'Kadoly';
    const delen = [schoon(it.t, 300) + (it.b ? ', van ' + merk : '') + '.'];
    if (g && g.waarom) { delen.push(schoon(g.waarom, 1500)); if (g.beperking) delen.push('Goed om te weten: ' + schoon(g.beperking, 800)); tel.metGids++; }
    if (N(it.lt)) delen.push('Binnen ' + N(it.lt) + ' werkdagen in huis.');
    delen.push('Prijs inclusief btw en verzending. Gratis retourneren binnen 14 dagen.');
    const op = it.vr !== false; tel.totaal++; if (op) tel.opVoorraad++;
    const r = {
      item_id: String(it.id),
      title: schoon(it.t, 150),
      description: schoon(delen.join(' '), 5000),
      url: 'https://kadoly.com/product/' + encodeURIComponent(it.id) + '?lang=nl',
      brand: merk,
      seller_name: 'Kadoly',
      image_url: 'https://go.kadoly.com/api/shop/beeld/' + encodeURIComponent(it.id) + '/sq.jpg',
      availability: op ? 'in_stock' : 'out_of_stock',
      price: totaal.toFixed(2) + ' EUR',
      condition: 'new',
      target_countries: landen,
      store_country: 'NL',
    };
    const cat = [RUB[it.c] || hoofd(it.c), hoofd(it.s)].filter(Boolean).join(' > '); if (cat) r.product_category = cat;
    regels.push(JSON.stringify(r));
  }
  return { jsonl: regels.join('\n') + (regels.length ? '\n' : ''), tel };
}

// pid -> eerste gids waarin het product staat (feiten + slug), uit GIDSEN van lib/gidsen-kadoly.js
export function gidsPerPid(GIDSEN) {
  const m = {};
  for (const [slug, g] of Object.entries(GIDSEN || {})) for (const k of (g.keuze || [])) if (k.pid && !m[k.pid] && k.waarom) m[k.pid] = { slug, h1: g.h1, waarom: k.waarom, beperking: k.beperking || '' };
  return m;
}

// pid -> alle gidsen waarin het product staat (voor de links op de productpagina van kadoly.com, TAAK G in lib/shopprompt.js)
export function gidsenPerPid(GIDSEN) {
  const m = {};
  for (const [slug, g] of Object.entries(GIDSEN || {})) for (const k of (g.keuze || [])) if (k.pid) { const l = m[k.pid] || (m[k.pid] = []); if (!l.some(x => x.slug === slug)) l.push({ slug, url: 'https://gids.kadoly.com/' + slug, titel: String(g.h1 || g.titel || '') }); }
  return m;
}
