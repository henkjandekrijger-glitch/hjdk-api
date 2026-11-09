// Tours boeken op curacao.day (Henkjan 9 nov 2026: "Tours boeken met prijs en sterren ... Zorg dat dit er netjes op komt met pics en ze bij ons
// netjes kunnen kiezen met de chat via keuzehulpen (Guide) die we hebben", "ik wil gewoon compleet zijn" en "totaal in sync met design en UX").
// Tour-modus van de excursiegids (data/cur/excursies.json), alleen voor onderwerp excursies:
// - De Guide als chat bovenaan: dezelfde vragen en dezelfde rangorde als de keuzehulp (curRang), zonder AI. Kies een antwoord per vraag of typ
//   wat je zoekt; woorden worden via de tags van de antwoorden herkend (5 talen). De verborgen velden ah-q<n> blijven de bron, dus go() in
//   renderOnderwerp ordent de tourkaarten opnieuw en de meting (route-...) blijft gelijk.
// - Alle tours als kaarten: vrije foto (Wikimedia Commons, CC0/BY/BY-SA/PD, liggend, met maker en licentie onder de foto, niet bijgesneden),
//   sterren met aantal reviews, vanaf-prijs, feiten, gratis annuleren en ophalen als we dat zagen, en een knop "Bekijk en boek" naar de beste
//   plek om te boeken (veld boek; anders de boekbare Tripadvisor-pagina uit de bronnen; anders de site). Geen affiliate, dus geen vergoedingszin.
// - Op één pagina nooit twee keer dezelfde foto (Henkjan 9 nov 2026): tourFotos verdeelt de foto's over de tours in rangorde; op = geen beeld.
// - Filter op soort als tekstlijst (geen pillen), met aantallen.
import { kv } from './db.js';

const L = (nl, en, de, es, pt) => ({ nl, en, de, es, pt });
export const TL = {
  chat: L('Vraag de gids', 'Ask the guide', 'Frag den Guide', 'Pregunta a la guía', 'Pergunte ao guia'),
  intro: L('Ik help je kiezen uit {n} tours. Beantwoord een paar korte vragen of typ wat je zoekt.', 'I help you pick from {n} tours. Answer a few short questions or type what you are looking for.', 'Ich helfe dir, aus {n} Touren zu wählen. Beantworte ein paar kurze Fragen oder schreib, was du suchst.', 'Te ayudo a elegir entre {n} tours. Responde unas preguntas cortas o escribe lo que buscas.', 'Eu ajudo você a escolher entre {n} passeios. Responda algumas perguntas rápidas ou escreva o que procura.'),
  typ: L('Of typ wat je zoekt, bijvoorbeeld snorkelen met kinderen', 'Or type what you want, for example snorkeling with kids', 'Oder schreib, was du suchst, zum Beispiel Schnorcheln mit Kindern', 'O escribe lo que buscas, por ejemplo snorkel con niños', 'Ou escreva o que procura, por exemplo snorkel com crianças'),
  zoek: L('Zoek', 'Find', 'Suchen', 'Buscar', 'Buscar'),
  uitslag: L('Dit past het best bij jou:', 'These fit you best:', 'Das passt am besten zu dir:', 'Esto es lo que mejor te encaja:', 'Isto combina mais com você:'),
  niets: L('Dat herken ik niet goed. Kies hieronder wat je zoekt:', 'I did not quite get that. Pick what you are looking for:', 'Das habe ich nicht ganz verstanden. Wähle, was du suchst:', 'No lo entendí bien. Elige lo que buscas:', 'Não entendi bem. Escolha o que procura:'),
  opnieuw: L('Opnieuw kiezen', 'Start over', 'Neu wählen', 'Elegir de nuevo', 'Escolher de novo'),
  alleZien: L('Alle tours in deze volgorde', 'All tours in this order', 'Alle Touren in dieser Reihenfolge', 'Todos los tours en este orden', 'Todos os passeios nesta ordem'),
  boek: L('Bekijk en boek', 'View and book', 'Ansehen und buchen', 'Ver y reservar', 'Ver e reservar'),
  details: L('Meer over deze tour', 'More about this tour', 'Mehr zu dieser Tour', 'Más sobre este tour', 'Mais sobre este passeio'),
  annuleren: L('Gratis annuleren tot {h} uur vooraf', 'Free cancellation up to {h} hours before', 'Kostenlos stornieren bis {h} Std. vorher', 'Cancelación gratis hasta {h} h antes', 'Cancelamento grátis até {h} h antes'),
  ophalen: L('Ophalen bij je hotel mogelijk', 'Hotel pickup available', 'Abholung vom Hotel möglich', 'Recogida en el hotel disponible', 'Busca no hotel disponível'),
  duur: L('{h} uur', '{h} hours', '{h} Std.', '{h} h', '{h} h'),
  vanaf: L('vanaf', 'from', 'ab', 'desde', 'a partir de'),
  via: L('boeken via', 'book via', 'buchen über', 'reservar en', 'reservar em'),
  alle: L('Alle tours', 'All tours', 'Alle Touren', 'Todos los tours', 'Todos os passeios'),
  alleSub: L('{n} tours en uitjes, van de aanbieders zelf. Gerangschikt op reviews, of op jouw antwoorden hierboven.', '{n} tours and trips, straight from the providers. Ranked by reviews, or by your answers above.', '{n} Touren und Ausflüge, direkt von den Anbietern. Sortiert nach Bewertungen oder nach deinen Antworten oben.', '{n} tours y salidas, directo de los proveedores. Ordenados por reseñas o por tus respuestas de arriba.', '{n} passeios, direto dos fornecedores. Ordenados por avaliações ou pelas suas respostas acima.'),
  voorTegen: L('Voor- en nadelen uit reviews', 'Pros and cons from reviews', 'Vor- und Nachteile aus Bewertungen', 'Ventajas y desventajas de las reseñas', 'Prós e contras das avaliações'),
  reviews: L('reviews', 'reviews', 'Bewertungen', 'reseñas', 'avaliações'),
  foto: L('Foto', 'Photo', 'Foto', 'Foto', 'Foto'),
  geen: L('Geen tours met deze keuze.', 'No tours with this choice.', 'Keine Touren mit dieser Auswahl.', 'No hay tours con esta opción.', 'Nenhum passeio com esta opção.'),
};
// filter op soort (tags uit excursies.json); volgorde = wat bezoekers het meest zoeken
const FILTER = [
  ['', L('Alles', 'All', 'Alle', 'Todo', 'Tudo')],
  ['klein-curacao', L('Klein Curaçao', 'Klein Curaçao', 'Klein Curaçao', 'Klein Curazao', 'Klein Curaçao')],
  ['boot', L('Boottochten', 'Boat trips', 'Bootstouren', 'Paseos en barco', 'Passeios de barco')],
  ['snorkel', L('Snorkelen', 'Snorkeling', 'Schnorcheln', 'Snorkel', 'Snorkel')],
  ['schildpadden', L('Schildpadden', 'Sea turtles', 'Schildkröten', 'Tortugas', 'Tartarugas')],
  ['offroad', L('Jeep, quad en buggy', 'Jeep, ATV and buggy', 'Jeep, Quad und Buggy', 'Jeep, cuatrimoto y buggy', 'Jipe, quadriciclo e buggy')],
  ['stadstour', L('Stad en cultuur', 'City and culture', 'Stadt und Kultur', 'Ciudad y cultura', 'Cidade e cultura')],
  ['zonsondergang', L('Zonsondergang', 'Sunset', 'Sonnenuntergang', 'Atardecer', 'Pôr do sol')],
  ['kinderen', L('Met kinderen', 'With kids', 'Mit Kindern', 'Con niños', 'Com crianças')],
  ['cruise-gast', L('Voor cruisegasten', 'For cruise guests', 'Für Kreuzfahrtgäste', 'Para cruceristas', 'Para cruzeiristas')],
  ['halve-dag', L('Halve dag', 'Half day', 'Halber Tag', 'Medio día', 'Meio dia')],
];
// woorden die een antwoord in de chat aanzetten, per tag (alle talen door elkaar; zonder accenten, kleine letters)
const TAGKW = {
  'klein-curacao': ['klein'], schildpadden: ['schildpad', 'turtle', 'tortuga', 'tartaruga', 'schildkr'], snorkel: ['snorkel', 'schnorchel'],
  zonsondergang: ['zonsondergang', 'sunset', 'atardecer', 'por do sol', 'sonnenuntergang', 'avond', 'evening'], feest: ['feest', 'party', 'fiesta', 'festa', 'borrel', 'drinks', 'open bar'],
  offroad: ['jeep', 'offroad', 'off road', 'buggy', 'utv', 'safari', 'jipe'], quad: ['quad', 'atv', 'cuatrimoto', 'quadriciclo'],
  stadstour: ['stad', 'city', 'willemstad', 'cultuur', 'culture', 'cultura', 'ciudad', 'cidade', 'stadt', 'kultur', 'walking', 'wandel', 'museum', 'dieren', 'animals'],
  kinderen: ['kids', 'kinderen', 'kind ', 'family', 'gezin', 'familie', 'ninos', 'criancas', 'kinder', 'children', 'familia'],
  'cruise-gast': ['cruise', 'crucero', 'cruzeiro', 'kreuzfahrt', 'schip', 'ship'], 'halve-dag': ['halve dag', 'half day', 'medio dia', 'meio dia', 'halbtag', 'paar uur', 'few hours'],
  budget: ['goedkoop', 'cheap', 'budget', 'barato', 'gunstig', 'laagste prijs', 'lowest price', 'betaalbaar', 'affordable'],
  'kleine-groep': ['kleine groep', 'small group', 'prive', 'private', 'grupo pequeno', 'kleine gruppe', 'rustig', 'quiet'],
  'eten-inbegrepen': ['lunch', 'bbq', 'eten', 'food', 'comida', 'essen'], catamaran: ['catamaran', 'katamaran'], boot: ['boot', 'boat', 'barco', 'varen', 'sail'],
};
const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const optieWoorden = (vr, m, tx) => vr.map(q => (q.opties || []).map((op, k) => k === 0 ? [] : [...new Set([...(op.plus || []).flatMap(t => TAGKW[t] || []), ...(op.vereist ? TAGKW[op.vereist] || [] : []), ...norm(tx(op.label, m)).split(/[^a-z0-9]+/).filter(w => w.length > 4)])]));

// ---------- foto's ----------
// Per tour een zoekterm voor Wikimedia Commons (de plek waar de tour naartoe gaat); daarna de soort als terugval.
const FOTO_Q = {
  'bluefinn-klein-curacao': 'Klein Curaçao', 'bluefinn-klein-curacao-sunset': 'Klein Curaçao', 'irie-klein-curacao': 'Klein Curaçao', 'miss-ann': 'Klein Curaçao', 'mermaid-boat-trips': 'Klein Curaçao', 'powerboat-caribbean': 'Klein Curaçao',
};
const NAAM_Q = [[/cooking|cocktail|shake|food|culinary|foodie|likeur|liqueur/i, 'Plasa Bieu'], [/cooking|cocktail|shake|food|culinary|foodie/i, 'Marshe Bieuw'], [/water bike|jet ?ski|sup\b|kayak|kajak|clear ?boat/i, 'Playa Piskado'], [/utv|atv|buggy|trail|kadushi/i, 'Christoffelpark'], [/utv|atv|buggy|trail|kadushi/i, 'Shete Boka'], [/klein cura/i, 'Klein Curaçao'], [/grote knip|kenepa|knip/i, 'Kenepa Curaçao'], [/kalki/i, 'Playa Kalki'], [/blue room|west coast|westpunt|westpoint|west island|all west/i, 'Westpunt Curaçao'], [/tugboat|seabob/i, 'Caracasbaai'], [/hato/i, 'Hato Caves'], [/shete boka/i, 'Shete Boka'], [/chobolobo|liqueur|distillery/i, 'Chobolobo'], [/sea aquarium|dolphin|ocean lens/i, 'Curaçao Sea Aquarium'], [/substation|submarine|semi sub/i, 'Curasub'], [/national park|christoffel/i, 'Christoffelpark'], [/porto mari|kunuku/i, 'Porto Mari'], [/walking|wandeltour|dundu|city|willemstad/i, 'Willemstad Punda'], [/splashy|amfibie|iguana/i, 'Otrobanda'], [/flamingo/i, 'Flamingo Curaçao'], [/sunset|zonsondergang|happy hour/i, 'Curaçao sunset'], [/fuik/i, 'Fuikbaai'], [/spaanse water|spanish water|tiki|private boat/i, 'Spaanse Water'], [/piscadera|jetski/i, 'Piscadera'], [/kayak|kajak|sup|mangrove/i, 'Rif Mangrove Willemstad'], [/fish/i, 'Curaçao fishing boat'], [/atv|quad|buggy|utv|off-road|jeep|safari/i, 'Curaçao landscape'], [/snorkel|turtle/i, 'Curaçao snorkeling']];
const TAG_Q = [['klein-curacao', 'Klein Curaçao'], ['schildpadden', 'Playa Piskado'], ['snorkel', 'Curaçao reef'], ['zonsondergang', 'Curaçao sunset'], ['offroad', 'Curaçao landscape'], ['stadstour', 'Willemstad'], ['boot', 'Curaçao boat']];
const RESERVE = ['Westpunt Curaçao', 'Caracasbaai', 'Spaanse Water', 'Willemstad', 'Christoffelpark', 'Shete Boka', 'Banda Abou']; // niemand zonder foto zolang er nog Curaçao-foto's over zijn
const fotoQ = v => [...new Set([v.fotoQ, FOTO_Q[v.id], ...NAAM_Q.filter(([r]) => r.test(v.naam || '')).map(([, q]) => q), ...TAG_Q.filter(([t]) => (v.tags || []).includes(t)).map(([, q]) => q), ...RESERVE].filter(Boolean))];
// alleen foto's van Curaçao zelf (titel, categorieën of beschrijving noemen een plek op het eiland) en nooit graven, kustwacht of een ander eiland
const OP_CUR = /curacao|willemstad|westpunt|caracas|banda abou|christoffel|shete boka|hato|otrobanda|punda|piscadera|spaanse water|jan thiel|kenepa|knip|lagun|piskado|chobolobo|scharloo|pietermaai|fuik|porto mari|daaibooi|kalki/;
const NIET = /cemetery|kerkhof|begraaf|tomb|grave|\bgraf\b|coast ?guard|kustwacht|cutter|aircraft|airplane|vliegtuig|dash 8|navy|marine corps|military|militair|police|politie|funeral|bonaire|aruba|sint maarten|st\.? maarten|indonesia|sardinia|sardegna|italy|italia|porto cervo|map|kaart|logo|flag|vlag|stamp|postzegel|coin|munt|diagram|scan/;
const LIC = l => /^(cc0|cc[ -]by(-sa)?[ -]?[\d.]*|public domain|pd[- \w]*)/i.test(l) && !/nc|nd/i.test(l);
const schoon = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const STOP = /^(curacao|playa|the|and|tour|tours|beach)$/;
async function kandidaten(q, diag) {
  const k = 'cur:tfoto3:' + norm(q); const oud = diag ? null : await kv.get(k).catch(() => null); if (oud && Array.isArray(oud.l)) return oud.l;
  const woorden = norm(q).split(/[^a-z0-9]+/).filter(w => w.length > 3 && !STOP.test(w)); const l = [];
  try {
    const u = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ action: 'query', generator: 'search', gsrsearch: q + ' filetype:bitmap', gsrnamespace: '6', gsrlimit: '40', prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime', iiurlwidth: '800', format: 'json', origin: '*' });
    const r = await fetch(u, { headers: { 'user-agent': 'curacao.day/1.0 (https://curacao.day)' }, signal: AbortSignal.timeout(6000) });
    const j = await r.json().catch(() => null); if (diag) diag.status = r.status;
    if (!j || !j.query) { if (diag) diag.fout = j ? JSON.stringify(j).slice(0, 300) : 'geen json'; return []; } // geen geldig antwoord: niet bewaren
    const pages = Object.values(j.query.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0)); if (diag) diag.paginas = pages.length;
    for (const pg of pages) {
      const ii = (pg.imageinfo || [])[0]; if (!ii) continue; const md = ii.extmetadata || {}, lic = schoon((md.LicenseShortName || {}).value), tl = norm(pg.title), ctx = tl + ' ' + norm(schoon((md.Categories || {}).value)) + ' ' + norm(schoon((md.ImageDescription || {}).value)).slice(0, 400);
      if (!/jpeg/i.test(ii.mime || '') || ii.width < 1000 || ii.height >= ii.width || ii.width / ii.height > 2.2 || !LIC(lic) || !ii.thumburl || (woorden.length && !woorden.every(w => tl.includes(w))) || !OP_CUR.test(ctx) || NIET.test(tl) || NIET.test(norm(schoon((md.ImageDescription || {}).value)).slice(0, 300))) continue;
      l.push({ src: ii.thumburl, w: ii.thumbwidth || 800, h: ii.thumbheight || 533, pagina: ii.descriptionurl, door: schoon((md.Artist || {}).value).replace(/\s+from\s+.*$/i, '').slice(0, 40) || 'Wikimedia Commons', lic });
      if (l.length >= 14) break;
    }
  } catch (e) { if (diag) diag.fout = String(e && e.message || e); return []; } // mislukt: niet bewaren, volgende keer opnieuw
  await kv.set(k, { l, t: Date.now() }, { ex: 21 * 86400 }).catch(() => {});
  return l;
}
export async function tourFotoTest(q) { const diag = {}; const l = await kandidaten(q || 'Klein Curaçao', diag); return { q, ...diag, gevonden: l.length, eerste: l.slice(0, 3) }; }
// items in rangorde: de bovenste tours kiezen eerst; elke foto maar één keer per pagina
export async function tourFotos(items) {
  const qs = [...new Set(items.flatMap(fotoQ))], C = {};
  await Promise.all(qs.map(async q => { C[q] = await Promise.race([kandidaten(q).catch(() => []), new Promise(r => setTimeout(() => r([]), 7000))]); }));
  const gebruikt = new Set(), uit = {};
  for (const v of items) for (const q of fotoQ(v)) { const f = (C[q] || []).find(x => !gebruikt.has(x.src)); if (f) { gebruikt.add(f.src); uit[v.id] = f; break; } }
  return uit;
}

// ---------- boeken ----------
const TA = /tripadvisor\.[a-z.]+\/AttractionProductReview/i;
export function boekVan(v) {
  if (v.boek) return { u: v.boek, bron: v.boekBron || 'aanbieder' };
  const ta = (v.bronnen || []).find(u => TA.test(u)); if (ta) return { u: ta, bron: 'tripadvisor' };
  if (v.url) return { u: v.url, bron: 'aanbieder' };
  return null;
}
const BRONNAAM = { tripadvisor: 'Tripadvisor', getyourguide: 'GetYourGuide', viator: 'Viator' };

// ---------- opmaak (curacao.day: wit, gevelkleuren van de Handelskade, vlagblauw als hoofdknop, geen pillen) ----------
export const TOURS_CSS = '.gc{border:1px solid var(--line);border-top:6px solid #002B7F;border-radius:14px;padding:18px 18px 16px;margin:0 0 10px;background:var(--panel)}'
  + '.gc-n{margin:0;font-size:21px;font-weight:800;color:#002B7F;letter-spacing:-.01em}.gc-s{margin:4px 0 12px;font-size:16px;color:var(--ink)}'
  + '.gc-a{margin:12px 0 0}.gc-a>p{margin:0 0 6px;font-weight:700}.gc-u{margin:12px 0 0 auto;width:fit-content;max-width:85%;background:#EEF1FC;color:#111113;font-weight:600;border-radius:14px 14px 4px 14px;padding:9px 13px;font-size:16px}'
  + '.gc-o{display:flex;flex-direction:column}.gc-o button{display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;text-align:left;border:0;border-bottom:1px solid var(--line);background:none;color:var(--ink);font:600 16px/1.35 Inter,Arial,sans-serif;padding:12px 2px;cursor:pointer}.gc-o button::after{content:"→";color:#002B7F;font-weight:700}.gc-o button:hover{color:#002B7F}'
  + '.gc-f{display:flex;gap:8px;margin:16px 0 0;border-radius:12px;box-shadow:inset 0 0 0 1.5px var(--line-strong);padding:5px}.gc-f input{flex:1;min-width:0;border:0;background:none;color:var(--ink);font:inherit;font-size:16px;padding:8px 10px;outline:0}.gc-f button{border:0;border-radius:999px;background:#002B7F;color:#fff;font:700 16px Inter,Arial,sans-serif;padding:10px 18px;cursor:pointer}'
  + '.gc-t{display:grid;grid-template-columns:1fr auto;gap:2px 12px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line)}.gc-t a.gc-tn{font-weight:700;color:var(--ink);text-decoration:none}.gc-t a.gc-tn::before{content:"";display:inline-block;width:8px;height:8px;border-radius:2px;background:var(--c,#2F7D73);margin:0 9px 2px 0}.gc-t .gc-tm{grid-column:1;font-size:15px}.gc-t .gc-tb{grid-row:1/3;grid-column:2;font-weight:700;font-size:15px;color:#002B7F;text-decoration:underline;text-decoration-color:#002B7F;text-underline-offset:4px;white-space:nowrap}'
  + '.gc-x{margin:10px 0 0;display:flex;gap:18px;flex-wrap:wrap;font-size:15px;font-weight:600}.gc-x button,.gc-x a{border:0;background:none;padding:0;color:var(--ink);font:inherit;cursor:pointer;text-decoration:underline;text-decoration-color:var(--line-strong);text-underline-offset:4px}'
  + '.tflt{display:flex;flex-wrap:wrap;gap:4px 18px;margin:14px 0 18px;padding:0;list-style:none}.tflt button{border:0;background:none;padding:4px 0;color:var(--ink);font:600 16px Inter,Arial,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:8px}.tflt button::before{content:"";width:8px;height:8px;border-radius:2px;background:var(--c)}.tflt button small{font-weight:400;opacity:.75}.tflt button[aria-pressed=true]{text-decoration:underline;text-decoration-thickness:2px;text-decoration-color:#002B7F;text-underline-offset:6px}'
  + '.tg{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;align-items:start}.tk{--c:#2F7D73;border:1px solid var(--line);border-top:5px solid var(--c);border-radius:14px;overflow:hidden;background:var(--panel);display:flex;flex-direction:column;scroll-margin-top:90px}'
  + '.tk figure{margin:0}.tk img{display:block;width:100%;height:auto}.tk figcaption{font-size:12px;line-height:1.4;padding:5px 14px 0;opacity:.8}.tk figcaption a{color:inherit!important;text-decoration:none}'
  + '.tk .tb{padding:12px 16px 16px;display:flex;flex-direction:column;flex:1}.tk .tkk{margin:0 0 4px;font-size:14px;font-weight:700;color:#2A3566;text-transform:uppercase;letter-spacing:.04em}.tk .tnr{display:inline-block;background:#002B7F;color:#fff;border-radius:4px;padding:0 6px;margin-right:7px;letter-spacing:0}'
  + '.tk h3{font-size:19px;line-height:1.3;margin:0 0 6px}.tk h3 a{color:var(--ink);text-decoration:none}.tk h3 a:hover{color:#002B7F}.tk .tsc{margin:0 0 6px;font-size:17px;font-weight:800}.tk .tsc span{font-weight:400;font-size:15px}'
  + '.tk .tpr{margin:0 0 6px;font-size:16px}.tk .tpr b{font-size:19px}.tk .tft{list-style:none;padding:0;margin:0 0 10px;font-size:15px;line-height:1.5}.tk .tft li{margin:2px 0}.tk .tft li.ok{color:#2F7D73;font-weight:600}.tk .tft li.ok::before{content:"✓ "}'
  + '.tk .tbk{display:block;margin-top:auto;background:#002B7F;color:#fff!important;text-decoration:none;text-align:center;border-radius:10px;padding:12px 14px;font-weight:700;font-size:16px}.tk .tbk:hover{background:#13409B}.tk .tvia{display:block;text-align:center;font-size:13px;margin-top:5px;opacity:.8}'
  + '.tk details.mini{margin-top:10px;border:0;padding:0}.tk details.mini summary{font-size:15px}.tk .tmeer{font-size:15px;margin:8px 0 0}'
  + '.tg .tk:nth-child(8n+2){--c:#B54A2B}.tg .tk:nth-child(8n+3){--c:#E3A93B}.tg .tk:nth-child(8n+4){--c:#2F6FAE}.tg .tk:nth-child(8n+5){--c:#EE9A72}.tg .tk:nth-child(8n+6){--c:#C4923A}.tg .tk:nth-child(8n+7){--c:#8DC2A8}.tg .tk:nth-child(8n+8){--c:#C9473A}'
  + '.tflt li:nth-child(8n+1) button{--c:#002B7F}.tflt li:nth-child(8n+2) button{--c:#B54A2B}.tflt li:nth-child(8n+3) button{--c:#E3A93B}.tflt li:nth-child(8n+4) button{--c:#2F6FAE}.tflt li:nth-child(8n+5) button{--c:#2F7D73}.tflt li:nth-child(8n+6) button{--c:#C4923A}.tflt li:nth-child(8n+7) button{--c:#8DC2A8}.tflt li:nth-child(8n+8) button{--c:#C9473A}'
  + '.tk[hidden],.tk .tnr[hidden]{display:none!important}'
  + '@media (prefers-color-scheme:dark){.gc{border-top-color:#93A6FF}.gc-n{color:#C9D3FF}.gc-u{background:#1B2246;color:#F2F3F5}.gc-o button::after,.gc-t .gc-tb{color:#C9D3FF;text-decoration-color:#C9D3FF}.tk .tkk{color:#C9D3FF}.tk .tft li.ok{color:#71CF9E}.tk h3 a:hover{color:#C9D3FF}}'
  + '@media(max-width:640px){.gc{padding:16px 14px 14px}.tg{grid-template-columns:1fr}}';

// ---------- html ----------
// C: { m, o, rang, vr, t, getal, geld, scoresTxt, lijst, tx, esc, detailUrl, fotos, route }
export function renderTours(C) {
  const { m, rang, vr, getal, geld, scoresTxt, lijst, tx, esc, detailUrl, fotos = {} } = C, n = rang.length, T = k => tx(TL[k], m), vul = (s, o) => String(s).replace(/\{(\w)\}/g, (_, k) => o[k]);
  const route = C.route || vr.map(() => 0);
  const kaart = (x, i) => {
    const v = x.v, f = fotos[v.id], b = boekVan(v), [vo, te] = lijst(v), feiten = (v.feiten || []).map(z => tx(z, m)).filter(Boolean).slice(0, 2);
    const ok = [v.annuleren ? vul(T('annuleren'), { h: v.annuleren }) : '', v.ophalen ? T('ophalen') : ''].filter(Boolean);
    return '<article class="tk ah-r" id="t-' + esc(v.id) + '" data-id="' + esc(v.id) + '" data-t="' + esc((v.tags || []).join(' ')) + '">'
      + (f ? '<figure><img src="' + esc(f.src) + '" width="' + f.w + '" height="' + f.h + '" alt="' + esc(v.naam) + '" loading="' + (i < 3 ? 'eager' : 'lazy') + '" decoding="async"><figcaption><a href="' + esc(f.pagina) + '" target="_blank" rel="nofollow noopener">' + esc(T('foto')) + ': ' + esc(f.door) + ' · ' + esc(f.lic) + '</a></figcaption></figure>' : '')
      + '<div class="tb"><p class="tkk"><span class="tnr"' + (i < 3 ? '' : ' hidden') + '>' + (i < 3 ? 'Top ' + (i + 1) : '') + '</span>' + esc([tx(v.soort, m), v.plaats ? String(v.plaats).split(/[,/(]/)[0].trim() : ''].filter(Boolean).join(' · ')) + '</p>'
      + '<h3><a href="' + esc(detailUrl(v)) + '">' + esc(v.naam) + '</a></h3>'
      + (x.r ? '<p class="tsc">★ ' + getal(x.r.gemiddeld, 1) + ' <span>· ' + getal(x.r.aantal, 0) + ' ' + esc(T('reviews')) + '</span></p>' : '')
      + (v.prijs ? '<p class="tpr">' + esc(T('vanaf')) + ' <b>' + esc(geld(v.prijs)) + '</b></p>' : '')
      + ((v.duurU && !feiten.some(z => /\d/.test(z) && /(uur|hour|stund|hora|h\b)/i.test(z))) ? '<p class="tpr">' + esc(vul(T('duur'), { h: getal(v.duurU, v.duurU % 1 ? 1 : 0) })) + '</p>' : '')
      + (feiten.length || ok.length ? '<ul class="tft">' + feiten.map(z => '<li>' + esc(z) + '</li>').join('') + ok.map(z => '<li class="ok">' + esc(z) + '</li>').join('') + '</ul>' : '')
      + (b ? '<a class="tbk tbtn" href="' + esc(b.u) + '" target="_blank" rel="noopener nofollow" data-out="' + esc(v.id) + '">' + esc(T('boek')) + '</a>' + (BRONNAAM[b.bron] ? '<span class="tvia">' + esc(T('via')) + ' ' + BRONNAAM[b.bron] + '</span>' : '') : '<a class="tbk tbtn" href="' + esc(detailUrl(v)) + '">' + esc(T('details')) + '</a>')
      + ((vo.length || te.length) ? '<details class="mini"><summary>' + esc(T('voorTegen')) + '</summary><ul class="pm">' + vo.slice(0, 3).map(a => '<li class="p">' + esc(a) + '</li>').join('') + te.slice(0, 2).map(a => '<li class="m">' + esc(a) + '</li>').join('') + '</ul><p class="fine">' + scoresTxt(v) + '</p><p class="tmeer"><a href="' + esc(detailUrl(v)) + '">' + esc(T('details')) + ' →</a></p></details>' : '')
      + '</div></article>';
  };
  const telTag = t => rang.filter(x => !t || (x.v.tags || []).includes(t)).length;
  const filter = '<ul class="tflt" id="tflt">' + FILTER.filter(([t]) => telTag(t) > 0).map(([t, lab]) => '<li><button type="button" data-f="' + t + '" aria-pressed="' + (t ? 'false' : 'true') + '">' + esc(tx(lab, m)) + ' <small>' + telTag(t) + '</small></button></li>').join('') + '</ul>';
  // chat: eerste vraag staat al in de html (geen verspringing); het script neemt het over
  const Q = vr.map(q => ({ q: tx(q.q, m), o: (q.opties || []).map(op => tx(op.label, m)) }));
  const eerste = Q.length ? '<div class="gc-a" data-i="0"><p>' + esc(Q[0].q) + '</p><div class="gc-o">' + Q[0].o.map((o, k) => '<button type="button" data-k="' + k + '">' + esc(o) + '</button>').join('') + '</div></div>' : '';
  const chat = '<section class="gc" id="gc" aria-label="' + esc(T('chat')) + '" style="padding-top:18px"><p class="gc-n">' + esc(T('chat')) + '</p><p class="gc-s">' + esc(vul(T('intro'), { n })) + '</p><div id="gc-log" aria-live="polite">' + eerste + '</div>'
    + '<form class="gc-f" id="gc-f"><input id="gc-i" type="text" autocomplete="off" enterkeyhint="search" placeholder="' + esc(T('typ')) + '" aria-label="' + esc(T('typ')) + '"><button type="submit">' + esc(T('zoek')) + '</button></form></section>'
    + '<form id="ah-form" hidden onsubmit="return false">' + vr.map((q, qi) => '<input type="hidden" id="ah-q' + qi + '" value="' + (route[qi] || 0) + '">').join('') + '</form>';
  const J = {}; rang.forEach(x => { const v = x.v, b = boekVan(v); J[v.id] = { n: v.naam, s: x.r ? '★ ' + getal(x.r.gemiddeld, 1) : '', p: v.prijs ? tx(TL.vanaf, m) + ' ' + geld(v.prijs) : '', b: b ? b.u : '' }; });
  const W = optieWoorden(vr, m, tx);
  const js = '(function(){var Q=' + JSON.stringify(Q) + ',W=' + JSON.stringify(W) + ',J=' + JSON.stringify(J).replace(/</g, '\\u003c') + ',S=' + JSON.stringify({ uit: T('uitslag'), niets: T('niets'), opn: T('opnieuw'), alle: T('alleZien'), boek: T('boek'), geen: T('geen') }) + ';'
    + 'var d=document,log=d.getElementById("gc-log"),g=d.getElementById("tg"),flt="";function esc(x){return String(x).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c]})}function nm(x){return String(x||"").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase()}'
    + 'function hit(a){if(window.__curHit)window.__curHit(a)}function bel(c,h){var e=d.createElement("div");e.className=c;e.innerHTML=h;log.appendChild(e);return e}'
    + 'function zet(i,k){var h=d.getElementById("ah-q"+i);if(!h)return;h.value=k;h.dispatchEvent(new Event("change",{bubbles:true}))}'
    + 'function knoppen(b,i){b.querySelectorAll(".gc-o button").forEach(function(x){x.onclick=function(){var o=b.querySelector(".gc-o");if(o)o.remove();bel("gc-u",esc(x.textContent));zet(i,+x.getAttribute("data-k"));hit("chat-q"+i+"-"+x.getAttribute("data-k"));if(i+1<Q.length)vraag(i+1);else uitslag()}})}'
    + 'function vraag(i){var b=bel("gc-a","<p>"+esc(Q[i].q)+"</p><div class=\\"gc-o\\">"+Q[i].o.map(function(o,k){return"<button type=\\"button\\" data-k=\\""+k+"\\">"+esc(o)+"</button>"}).join("")+"</div>");b.setAttribute("data-i",i);knoppen(b,i)}'
    + 'function zicht(){return[].slice.call(g.querySelectorAll(".tk")).filter(function(e){return!e.hidden})}'
    + 'function uitslag(){var ids=zicht().slice(0,3).map(function(e){return e.getAttribute("data-id")});var b=bel("gc-a","<p>"+esc(S.uit)+"</p>"+ids.map(function(id,i){var x=J[id]||{};return"<div class=\\"gc-t\\" style=\\"--c:"+["#2F7D73","#B54A2B","#E3A93B"][i]+"\\"><a class=\\"gc-tn\\" href=\\"#t-"+esc(id)+"\\">"+esc(x.n)+"</a><span class=\\"gc-tm\\">"+esc([x.s,x.p].filter(Boolean).join(" · "))+"</span>"+(x.b?"<a class=\\"gc-tb gc-btn\\" href=\\""+esc(x.b)+"\\" target=\\"_blank\\" rel=\\"noopener nofollow\\" data-out=\\""+esc(id)+"\\">"+esc(S.boek)+"</a>":"")+"</div>"}).join("")+"<p class=\\"gc-x\\"><a href=\\"#tg\\">"+esc(S.alle)+" ↓</a><button type=\\"button\\">"+esc(S.opn)+"</button></p>");b.querySelector(".gc-x button").onclick=opnieuw;hit("chat-uitslag")}'
    + 'function opnieuw(){log.innerHTML="";Q.forEach(function(_,i){zet(i,0)});vraag(0)}'
    + 'var eerste=log.querySelector(".gc-a");if(eerste)knoppen(eerste,0);'
    + 'd.getElementById("gc-f").onsubmit=function(e){e.preventDefault();var inp=d.getElementById("gc-i"),t=inp.value.trim();if(!t)return false;inp.value="";var q=" "+nm(t)+" ",n=0;log.querySelectorAll(".gc-o").forEach(function(o){var a=o.parentNode;if(a&&a.parentNode)a.parentNode.removeChild(a)});bel("gc-u",esc(t));'
    + 'W.forEach(function(opts,i){var best=0;opts.forEach(function(ws,k){if(!best&&ws.some(function(w){return q.indexOf(w)>=0}))best=k});if(best)n++;zet(i,best)});hit("chat-tekst-"+n);if(n)uitslag();else{bel("gc-a","<p>"+esc(S.niets)+"</p>");vraag(0)}return false};'
    // rangnummers en filter na elke herordening
    + 'function nummer(){var z=zicht();g.querySelectorAll(".tnr").forEach(function(s){s.hidden=true});z.slice(0,3).forEach(function(e,i){var s=e.querySelector(".tnr");if(s){s.textContent="Top "+(i+1);s.hidden=false}});var leeg=d.getElementById("tg-leeg");if(leeg)leeg.hidden=!!z.length}'
    + 'Q.forEach(function(_,i){var h=d.getElementById("ah-q"+i);if(h)h.addEventListener("change",function(){setTimeout(nummer,0)})});'
    + 'd.querySelectorAll("#tflt button").forEach(function(btn){btn.onclick=function(){flt=btn.getAttribute("data-f");d.querySelectorAll("#tflt button").forEach(function(x){x.setAttribute("aria-pressed",x===btn?"true":"false")});g.querySelectorAll(".tk").forEach(function(e){e.hidden=!!flt&&(" "+e.getAttribute("data-t")+" ").indexOf(" "+flt+" ")<0});nummer();hit("filter-"+(flt||"alles"))}})'
    + '})();';
  const grid = '<section id="alle-tours"><h2>' + esc(T('alle')) + '</h2><p class="fine">' + esc(vul(T('alleSub'), { n })) + '</p>' + filter + '<div id="ah-top" hidden></div><div id="ah-store" hidden></div><p id="ah-geen" hidden></p><div class="tg" id="tg">' + rang.map(kaart).join('') + '</div><p id="tg-leeg" class="micro" hidden>' + esc(T('geen')) + '</p></section>';
  return { chat, grid, js };
}
