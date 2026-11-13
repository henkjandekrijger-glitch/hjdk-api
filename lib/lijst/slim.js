// AI-onderdelen van de verlanglijst (via de AI Gateway, lib/ai.js): foto herkennen, smaakprofiel, Kadoly-tips bij een lijst, gedicht, cadeauzoeker.
// Haiku voor alles behalve het gedicht (Sonnet). Antwoorden in de taal van de bezoeker.
import { berichten, HAIKU, SONNET } from '../ai.js';
import { TAALNAAM } from './taal.js';
import { catalogus, kdKaart } from './haal.js';

const json = txt => { try { return JSON.parse((/\{[\s\S]*\}/.exec(String(txt || '')) || ['{}'])[0]); } catch (e) { return {}; } };
const taalVan = t => TAALNAAM[t] || 'English';

export async function fotoHerken(b64, mime, taal) {
  const r = await berichten({ fn: 'wl-foto', model: HAIKU, max: 300, timeout: 25000,
    system: 'You identify the product in a photo or screenshot so it can go on a wishlist. Reply with only JSON: {"titel":string,"merk":string|null,"zoek":string,"zeker":number}. titel: short product name in ' + taalVan(taal) + ' (max 70 chars, include brand and model if visible). zoek: best web shop search query (brand + model or product type + key feature). zeker: 0-1 how sure you are. If there is no product, titel="" and zeker=0.',
    user: [{ type: 'image', source: { type: 'base64', media_type: mime || 'image/jpeg', data: b64 } }, { type: 'text', text: 'What product is this?' }] });
  const j = json(r.txt); return { titel: String(j.titel || '').slice(0, 120), merk: j.merk ? String(j.merk).slice(0, 60) : null, zoek: String(j.zoek || j.titel || '').slice(0, 120), zeker: Number(j.zeker) || 0 };
}

export async function smaakProfiel({ naam, keuzes, items, taal }) {
  const r = await berichten({ fn: 'wl-smaak', model: HAIKU, max: 400, timeout: 20000,
    system: 'You write a warm, concrete taste profile for a wishlist, read by friends and family looking for a gift. Language: ' + taalVan(taal) + '. Reply with only JSON: {"tekst":string,"richtingen":[string,string,string]}. tekst: 2 short sentences about what makes this person happy, no clichés, no exclamation marks. richtingen: 3 concrete gift directions (max 6 words each) that are NOT already on the list.',
    user: 'Name: ' + naam + '\nChoices: ' + keuzes.join('; ') + '\nOn the list: ' + (items.join('; ') || '(nothing yet)') });
  const j = json(r.txt); return { tekst: String(j.tekst || '').slice(0, 400), richtingen: (Array.isArray(j.richtingen) ? j.richtingen : []).slice(0, 3).map(x => String(x).slice(0, 60)) };
}

// kandidaten uit de catalogus: per subcategorie een paar, binnen budget, nooit wat elders goedkoper is (lib/lijst/haal.js catalogus)
async function kandidaten(max, n) {
  const cat = await catalogus(); const per = {}; const uit = [];
  const lijst = cat.filter(i => !max || Number(i.p) <= max).sort((a, b) => (a.id < b.id ? -1 : 1));
  const dag = Number(new Date().toISOString().slice(8, 10)); // elke dag een andere greep
  for (const i of lijst) { const k = (i.c || '') + '/' + (i.s || ''); per[k] = per[k] || []; per[k].push(i); }
  const groepen = Object.values(per); let ronde = 0;
  while (uit.length < n && ronde < 6) { for (const g of groepen) { const i = g[(dag + ronde) % g.length]; if (g.length > ronde && i && !uit.includes(i)) uit.push(i); if (uit.length >= n) break; } ronde++; }
  return uit;
}
const regel = i => i.id + ' | ' + String(i.t).slice(0, 70) + ' | EUR ' + Number(i.p).toFixed(2) + ' | ' + (i.c || '');

// Kadoly bij een lijst: per wens hoogstens één echt vergelijkbaar product, plus drie tips
export async function kadolyTips({ items, smaak, taal }) {
  const max = Math.max(60, ...items.map(i => Number(i.p) || 0)) * 1.3;
  const kand = await kandidaten(max, 140); if (!kand.length) return { per: {}, tips: [] };
  const r = await berichten({ fn: 'wl-tips', model: HAIKU, max: 600, timeout: 25000, cacheTtl: 6 * 3600,
    system: 'You match a wishlist with products from the Kadoly shop catalogue. Reply with only JSON: {"per":{"<wish id>":"<product id>"},"tips":[{"id":"<product id>","titel":string}]}. per: ONLY when the catalogue product is the very same product type as the wish (both an airfryer, both wireless earbuds, both a storage cabinet). Products from the same area (kitchen, decor, toys) do NOT count. Most wishes have no match; an empty per is normal and fine. tips: 3 catalogue products this person would likely enjoy, given the wishes and taste. titel: short product name in ' + taalVan(taal) + '. Use only ids from the catalogue.',
    user: 'Wishes:\n' + items.map(i => i.i + ' | ' + i.t).join('\n') + (smaak ? '\nTaste: ' + smaak : '') + '\n\nCatalogue (id | title | price | category):\n' + kand.map(regel).join('\n') });
  const j = json(r.txt); const ids = new Set(kand.map(i => i.id)); const per = {};
  for (const k in (j.per || {})) if (ids.has(j.per[k])) per[k] = j.per[k];
  const tips = (Array.isArray(j.tips) ? j.tips : []).filter(x => x && ids.has(x.id)).slice(0, 3).map(x => ({ id: x.id, titel: String(x.titel || '').slice(0, 80) }));
  return { per, tips };
}

export async function gedicht({ naam, gel, taal, items, roddel, extra, budget }) {
  const sint = taal === 'nl' && gel === 'sint';
  const r = await berichten({ fn: 'wl-gedicht', model: SONNET, max: 900, timeout: 40000,
    system: sint
      ? 'Je schrijft een Sinterklaasgedicht van 12 tot 20 regels in gepaard rijm, met een plagerig maar lief knipoogje naar ' + naam + '. Gebruik een of twee wensen en roddels, maar verklap niet wie het cadeau geeft. Geen platte of kwetsende grappen. Onderteken met "Sint en Piet". Alleen het gedicht.'
      : 'Write a warm, playful rhyming poem of 8 to 14 lines in ' + taalVan(taal) + ' for ' + naam + ' (occasion: ' + gel + '). Use one or two of the wishes and gossip tips, never reveal who gives the gift, nothing hurtful. Only the poem.',
    user: 'Wensen: ' + (items.join('; ') || '-') + '\nRoddels: ' + (roddel.join('; ') || '-') + (extra ? '\nMoet erin: ' + extra : '') + (budget ? '\nBudget: ' + budget : '') });
  return String(r.txt || '').trim().slice(0, 2000);
}

// cadeauzoeker over alle bronnen: Kadoly-producten plus ideeën met zoeklinks naar andere winkels
export async function zoekCadeau({ tekst, taal, lijst }) {
  const bud = (/(\d{2,4})\s*(?:€|eur|euro|\$|£)|(?:€|eur|euro|\$|£)\s*(\d{2,4})|max\.?\s*(\d{2,4})/i.exec(tekst) || []).slice(1).find(Boolean);
  const max = bud ? Number(bud) * 1.1 : 0; const kand = await kandidaten(max, 150);
  const r = await berichten({ fn: 'wl-zoek', model: HAIKU, max: 1200, timeout: 30000, cacheTtl: 3 * 3600,
    system: 'You are a thoughtful gift finder. Language: ' + taalVan(taal) + '. Reply with only JSON: {"kadoly":[{"id":string,"titel":string,"waarom":string}],"ideeen":[{"titel":string,"waarom":string,"zoek":string}]}. kadoly: up to 4 products from the Kadoly catalogue that truly fit (use only listed ids; skip if nothing fits). ideeen: 6 specific, non-obvious gift ideas from any shop, each with a one-sentence reason tied to what was said and a short shop search query. Respect the budget if given. No exclamation marks.',
    user: 'About the person: ' + tekst + (lijst ? '\nTheir wishlist: ' + lijst : '') + '\n\nKadoly catalogue (id | title | price | category):\n' + kand.map(regel).join('\n') });
  const j = json(r.txt); const per = {}; kand.forEach(i => { per[i.id] = i; });
  const kadoly = (Array.isArray(j.kadoly) ? j.kadoly : []).filter(x => x && per[x.id]).slice(0, 4).map(x => Object.assign(kdKaart(per[x.id]), { titel: String(x.titel || '').slice(0, 80), waarom: String(x.waarom || '').slice(0, 200) }));
  const ideeen = (Array.isArray(j.ideeen) ? j.ideeen : []).slice(0, 6).map(x => ({ titel: String(x.titel || '').slice(0, 80), waarom: String(x.waarom || '').slice(0, 220), zoek: String(x.zoek || x.titel || '').slice(0, 80) })).filter(x => x.titel);
  return { kadoly, ideeen };
}
