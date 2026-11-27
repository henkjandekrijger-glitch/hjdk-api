// Gratis vermeldingen Kadoly (taak dxy7ri, 27 nov 2026, vervolg op 3ehsxs): waarom 5.030 goedgekeurde producten bijna geen vertoningen krijgen, en het voorstel voor Henkjan.
// Live op /api/shop?op=gratisstand&vorm=voorstel (pagina) of &vorm=diag (JSON), beschermde host. Alleen lezen: dit verandert niets aan prijzen, titels, feed of campagnes.
// analyseer() is puur (test: node scripts/test-gratisvoorstel.mjs); fn/shop.js haalt de gegevens op (Merchant Center 5876502305, feed van de winkel, catalogus met marge).

const r2 = x => Math.round(x * 100) / 100;
const basis = id => String(id).split('-')[0];
// voorstelprijs: net onder de marktprijs van Google, eindigend op ,95 (134,58 wordt 133,95; 15,00 wordt 14,95)
export const naarMarkt = b => r2(Math.floor(b + 0.05) - 0.05);

// feed van de winkel (google-shopping-nl.xml) per item: id, merk, gtin, titel, en welke velden er zijn
export function leesFeed(xml) {
  const uit = []; const tag = (it, t) => { const m = it.match(new RegExp('<g:' + t + '>(?:<!\\[CDATA\\[)?([^<\\]]*)')); return m ? m[1].trim() : ''; };
  for (const it of String(xml || '').split('<item>').slice(1)) uit.push({ id: tag(it, 'id'), merk: tag(it, 'brand'), gtin: tag(it, 'gtin'), titel: tag(it, 'title'), cert: /<g:certification>/.test(it), unit: /<g:unit_pricing_measure>/.test(it), retour: /<g:return_policy_label>/.test(it), cat: /<g:google_product_category>/.test(it), idNee: /<g:identifier_exists>\s*(?:<!\[CDATA\[)?no/i.test(it) });
  return uit;
}

// prest: { offerId: {gk,gv,bk,bv} } 28 dagen; perDag: { 'JJJJ-MM-DD': {gk,gv,bk,bv} }; prijs: { offerId: {prijs, benchmark, titel} };
// feed: leesFeed(); cat: catalogus-items { id, t, b (merk), mg (marge per bestelling in EUR) }
export function analyseer({ prest = {}, perDag = {}, prijs = {}, feed = [], cat = [], minMarge = 5 } = {}) {
  // 1. reeks per dag, gratis tegen betaald
  const dagen = Object.keys(perDag).sort().map(d => ({ dag: d, gv: perDag[d].gv || 0, gk: perDag[d].gk || 0, bv: perDag[d].bv || 0, bk: perDag[d].bk || 0 }));
  const somV = a => a.reduce((s, x) => s + x.gv, 0); const laatste7 = dagen.slice(-7), ervoor7 = dagen.slice(-14, -7);
  const eersteGratis = (dagen.find(x => x.gv > 0) || {}).dag || null;
  const reeks = { dagen, eersteDagMetGratisVertoning: eersteGratis, gratisVert7: somV(laatste7), gratisVertVorige7: somV(ervoor7), gratisVert28: somV(dagen), betaaldVert28: dagen.reduce((s, x) => s + x.bv, 0) };
  // 2. prijs tegen de marktprijs van Google, en of vertoningen daarmee samenhangen
  const bak = { goedkoper: { n: 0, gv: 0, gk: 0, bv: 0, bk: 0 }, gelijk: { n: 0, gv: 0, gk: 0, bv: 0, bk: 0 }, duurder: { n: 0, gv: 0, gk: 0, bv: 0, bk: 0 }, geenMarktprijs: { n: 0, gv: 0, gk: 0, bv: 0, bk: 0 } };
  const ids = new Set([...feed.map(f => f.id), ...Object.keys(prest)]);
  for (const id of ids) { const p = prijs[id]; const k = !p || !p.benchmark || !p.prijs ? 'geenMarktprijs' : p.prijs < p.benchmark * 0.98 ? 'goedkoper' : p.prijs <= p.benchmark * 1.02 ? 'gelijk' : 'duurder';
    const x = prest[id] || {}; const b = bak[k]; b.n++; b.gv += x.gv || 0; b.gk += x.gk || 0; b.bv += x.bv || 0; b.bk += x.bk || 0; }
  for (const b of Object.values(bak)) { b.gratisVertPer100 = b.n ? r2(100 * b.gv / b.n) : 0; b.betaaldVertPer100 = b.n ? r2(100 * b.bv / b.n) : 0; }
  // 3. velden in de feed
  const C = new Map(cat.map(i => [String(i.id), i])); const merken = {};
  for (const f of feed) merken[f.merk || '(leeg)'] = (merken[f.merk || '(leeg)'] || 0) + 1;
  const kadolyMetGtin = feed.filter(f => /^kadoly$/i.test(f.merk) && f.gtin);
  const velden = { items: feed.length, metGtin: feed.filter(f => f.gtin).length, identifierExistsNee: feed.filter(f => f.idNee).length, certificaat: feed.filter(f => f.cert).length, unitPricing: feed.filter(f => f.unit).length, retourLabel: feed.filter(f => f.retour).length, productcategorie: feed.filter(f => f.cat).length,
    merkKadoly: feed.filter(f => /^kadoly$/i.test(f.merk)).length, merkKadolyMetGtin: kadolyMetGtin.length, topMerken: Object.entries(merken).sort((a, b) => b[1] - a[1]).slice(0, 8) };
  // 4. voorstel prijs: alleen basisproducten (een variant heeft de prijs van één maat of kleur), duurder dan de markt
  const prijsRijen = [];
  for (const [id, p] of Object.entries(prijs)) { if (id.includes('-') || !p.benchmark || !p.prijs || p.prijs <= p.benchmark * 1.02) continue;
    const it = C.get(id); const nieuw = naarMarkt(p.benchmark); const mg = it && it.mg != null ? Number(it.mg) : null; const mgNieuw = mg == null ? null : r2(mg - (p.prijs - nieuw)); const x = prest[id] || {};
    const advies = mg == null ? 'marge onbekend: niet wijzigen' : mgNieuw >= minMarge ? 'naar marktprijs' : 'niet verlagen: marge te klein';
    prijsRijen.push({ id, titel: String((it && it.t) || p.titel || '').slice(0, 70), nu: p.prijs, markt: r2(p.benchmark), boven: Math.round((p.prijs / p.benchmark - 1) * 100), nieuw: advies === 'naar marktprijs' ? nieuw : null, marge: mg == null ? null : r2(mg), margeNieuw: advies === 'naar marktprijs' ? mgNieuw : null, advies, gv: x.gv || 0, bv: x.bv || 0, bk: x.bk || 0 }); }
  prijsRijen.sort((a, b) => (a.advies === 'naar marktprijs' ? 0 : 1) - (b.advies === 'naar marktprijs' ? 0 : 1) || (b.bv + 50 * b.gv) - (a.bv + 50 * a.gv) || b.boven - a.boven);
  const naar = prijsRijen.filter(r => r.advies === 'naar marktprijs');
  // 5. voorstel merk: de feed zegt 'Kadoly', de winkel kent het echte merk en er staat een GTIN bij (Google koppelt GTIN en merk aan de catalogus van de fabrikant)
  const merkRijen = []; for (const f of kadolyMetGtin) { const it = C.get(basis(f.id)); const echt = it && String(it.b || '').trim(); if (!echt || /^kadoly$/i.test(echt)) continue; merkRijen.push({ id: f.id, titel: f.titel.slice(0, 70), gtin: f.gtin, nu: f.merk, nieuw: echt, gv: (prest[f.id] || {}).gv || 0, bv: (prest[f.id] || {}).bv || 0 }); }
  merkRijen.sort((a, b) => b.bv - a.bv);
  return { reeks, prijs: { metMarktprijs: Object.values(prijs).filter(p => p.benchmark && p.prijs).length, bak, basisDuurder: prijsRijen.length, naarMarkt: naar.length, margeInleveringPerVerkoop: r2(naar.reduce((s, r) => s + (r.nu - r.nieuw), 0)), rijen: prijsRijen.slice(0, 150) },
    velden, merk: { teCorrigeren: merkRijen.length, rijen: merkRijen.slice(0, 150) } };
}

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const eur = x => x == null ? '' : '€ ' + Number(x).toFixed(2).replace('.', ',');
const n = x => Number(x || 0).toLocaleString('nl-NL');

export function voorstelHtml(a, { at = '', fouten = [] } = {}) {
  const R = a.reeks, P = a.prijs, V = a.velden, B = P.bak, M = a.merk;
  const max = Math.max(1, ...R.dagen.map(d => d.gv));
  const balk = R.dagen.map(d => `<div class="d" title="${esc(d.dag)}: ${d.gv} gratis vertoningen, ${d.gk} kliks"><i style="height:${Math.round(60 * d.gv / max)}px"></i><span>${esc(d.dag.slice(8))}</span></div>`).join('');
  const bakRij = (k, naam) => `<tr><td>${naam}</td><td>${n(B[k].n)}</td><td>${n(B[k].gv)}</td><td>${B[k].gratisVertPer100}</td><td>${n(B[k].bv)}</td><td>${B[k].betaaldVertPer100}</td></tr>`;
  const prijsRij = r => `<tr><td>${esc(r.titel)}<br><small>${esc(r.id)}</small></td><td>${eur(r.nu)}</td><td>${eur(r.markt)} <small>(+${r.boven}%)</small></td><td><b>${r.nieuw == null ? 'blijft' : eur(r.nieuw)}</b></td><td>${r.marge == null ? '?' : eur(r.marge)} &rarr; ${r.margeNieuw == null ? '' : eur(r.margeNieuw)}</td><td>${n(r.bv)} / ${n(r.gv)}</td><td>${esc(r.advies)}</td></tr>`;
  const merkRij = r => `<tr><td>${esc(r.titel)}<br><small>${esc(r.id)}</small></td><td>${esc(r.gtin)}</td><td>${esc(r.nu)}</td><td><b>${esc(r.nieuw)}</b></td><td>${n(r.bv)} / ${n(r.gv)}</td></tr>`;
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Kadoly gratis vermeldingen: voorstel</title>
<style>:root{--ink:#000;--bg:#fff;--lijn:#000}@media (prefers-color-scheme:dark){:root{--ink:#fff;--bg:#000;--lijn:#fff}}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,sans-serif}main{max-width:1000px;margin:0 auto;padding:16px}h1{font-size:24px;margin:0 0 8px}h2{font-size:18px;margin:32px 0 8px}
small{font-size:13px}table{border-collapse:collapse;width:100%;font-size:13px;display:block;overflow-x:auto}td,th{border-bottom:1px solid var(--lijn);padding:6px 8px;text-align:left;vertical-align:top}th{font-weight:700}
.reeks{display:flex;align-items:flex-end;gap:2px;height:84px;border-bottom:1px solid var(--lijn)}.d{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end}.d i{display:block;width:100%;background:var(--ink);min-height:1px}.d span{font-size:13px}
.kaart{border:2px solid var(--lijn);padding:12px 16px;margin:16px 0}</style></head><body><main>
<h1>Kadoly gratis vermeldingen: voorstel</h1>
<p><small>Gemeten ${esc(at)} uit Merchant Center 5876502305, de feed van de winkel en de marges van de winkel. Deze pagina verandert niets.${fouten.length ? ' Niet gelukt: ' + esc(fouten.join('; ')) : ''}</small></p>
<div class="kaart"><b>De vraag:</b> mogen deze ${n(P.naarMarkt)} producten naar net onder de marktprijs van Google (marge blijft minstens € 5 per bestelling, samen ${eur(P.margeInleveringPerVerkoop)} minder als elk één keer verkoopt)${M.teCorrigeren ? `, en mag de winkel bij ${n(M.teCorrigeren)} producten het echte merk in de feed zetten in plaats van Kadoly` : ''}? Titels en de betaalde Shopping-campagne blijven zoals ze zijn.</div>
<h2>1. Gratis vertoningen per dag (28 dagen)</h2>
<div class="reeks">${balk}</div>
<p>Laatste 7 dagen ${n(R.gratisVert7)} gratis vertoningen, de 7 dagen daarvoor ${n(R.gratisVertVorige7)}. Eerste dag met een gratis vertoning: ${esc(R.eersteDagMetGratisVertoning || 'geen')}. Ter vergelijking: betaald ${n(R.betaaldVert28)} vertoningen in dezelfde 28 dagen.</p>
<h2>2. Prijs tegen de markt en vertoningen (28 dagen, per product)</h2>
<table><tr><th>Prijs tegen marktprijs Google</th><th>Producten</th><th>Gratis vert.</th><th>Per 100 producten</th><th>Betaald vert.</th><th>Per 100 producten</th></tr>${bakRij('goedkoper', 'Goedkoper (meer dan 2% onder)')}${bakRij('gelijk', 'Gelijk (binnen 2%)')}${bakRij('duurder', 'Duurder (meer dan 2% boven)')}${bakRij('geenMarktprijs', 'Google kent geen marktprijs')}</table>
<h2>3. Voorstel prijzen (${n(P.naarMarkt)} van ${n(P.basisDuurder)} te dure producten)</h2>
<p><small>Alleen producten zonder maat of kleur. Nieuw = net onder de marktprijs, eindigend op ,95. Wie dan minder dan € 5 verdient, blijft op zijn prijs. Kolom vert. = betaald / gratis, 28 dagen.</small></p>
<table><tr><th>Product</th><th>Nu</th><th>Markt</th><th>Nieuw</th><th>Marge</th><th>Vert.</th><th>Advies</th></tr>${P.rijen.map(prijsRij).join('')}</table>
<h2>4. Voorstel merk (${n(M.teCorrigeren)} producten)</h2>
<p><small>In de feed staat bij ${n(V.merkKadoly)} van ${n(V.items)} producten het merk Kadoly, bij ${n(V.merkKadolyMetGtin)} met de streepjescode (GTIN) van een ander merk. Google koppelt GTIN en merk aan de productcatalogus; klopt het merk niet, dan komt het product slechter in de vergelijking. Hieronder alleen producten waarvan de winkel het echte merk kent.</small></p>
<table><tr><th>Product</th><th>GTIN</th><th>Nu</th><th>Nieuw</th><th>Vert.</th></tr>${M.rijen.map(merkRij).join('')}</table>
<h2>5. Velden in de feed</h2>
<table><tr><th>Veld</th><th>Producten</th></tr><tr><td>Totaal</td><td>${n(V.items)}</td></tr><tr><td>Met GTIN</td><td>${n(V.metGtin)}</td></tr><tr><td>identifier_exists = no</td><td>${n(V.identifierExistsNee)}</td></tr><tr><td>Productcategorie</td><td>${n(V.productcategorie)}</td></tr><tr><td>Certificaat</td><td>${n(V.certificaat)}</td></tr><tr><td>Unit pricing</td><td>${n(V.unitPricing)}</td></tr><tr><td>Retourlabel</td><td>${n(V.retourLabel)}</td></tr><tr><td>Meest gebruikte merken</td><td>${V.topMerken.map(([m, k]) => esc(m) + ' ' + n(k)).join(', ')}</td></tr></table>
<h2>Oordeel over 14 dagen</h2>
<p>Getal: gratis vertoningen per dag (gemiddelde van 7 dagen) en gratis kliks, op deze pagina en in /api/shop?op=gratisstand; bestellingen met srsltid in /api/shop?op=gconv&amp;vorm=stand. Raak als de producten met een nieuwe prijs of merk per 100 producten meer gratis vertoningen krijgen dan de rest.</p>
</main></body></html>`;
}
