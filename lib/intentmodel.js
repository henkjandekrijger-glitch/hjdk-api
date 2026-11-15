// Intentiemodel: één rij per intentie (wat iemand wil, waarvoor, in welke situatie, in welke taal) met waar het antwoord staat.
// Henkjan 15 nov 2026: "Vanaf nu gaan we dus bouwen aan de 100k intenties ." en eerder: "een intentie model en portal te kunnen bouwen voor IEDERE intentie".
// Bronnen nu: (1) elke keuzehulp is een intentie met pagina; (2) elk antwoord op een keuzevraag is een situatie-intentie met een antwoord op die pagina;
// (3) elke vraag van een bezoeker uit de vraagbalk of het zoekvak (lib/intentie.js). Volgende bronnen: Demand Radar (zoekvolume per markt) en Search Console.
// Opslag: de rijen als gzip-JSON in Vercel Blob (privé, intentmodel/<site>.json.gz), de samenvatting in kz:im:stand. Bouw dagelijks (cron) of op de beschermde host.
import { gzipSync, gunzipSync } from 'node:zlib';
import { put, get } from '@vercel/blob';

const HOST = { nl: 'keuzehulp.best', us: 'whichtobuy.best', de: 'kaufberater.best' };
const WIL = [
  ['kosten', /\b(kost|kosten|prijs|price|cost|kosten?|preis|was kostet|how much)\b/i],
  ['vergelijken', /\b(vs|versus|verschil|difference|unterschied|vergleich|of zelf|or buy)\b/i],
  ['maat', /\b(maat|maten|size|sizing|größe|groesse|hoe groot|hoe hoog|welke maat)\b/i],
  ['cadeau', /\b(cadeau|kado|gift|geschenk|sinterklaas|kerst|christmas|weihnacht)\b/i],
  ['hoe', /^(hoe|how|wie)\b/i],
];
const wil = t => { t = String(t || ''); for (const [w, re] of WIL) if (re.test(t)) return w; return 'kiezen'; };
const paren = h => { if (!h) return {}; if (!Array.isArray(h)) return h; const o = {}; for (let i = 0; i + 1 < h.length; i += 2) o[String(h[i])] = h[i + 1]; return o; };

function rijenVoor(site, items, vragen) {
  const host = HOST[site], out = [];
  for (const it of items) {
    if (!it || !it.slug) continue; const url = 'https://' + host + '/' + it.slug, wat = String(it.term || it.title || it.slug);
    out.push({ id: site + ':' + it.slug, taal: site, wil: wil(it.title + ' ' + it.slug), wat, situatie: '', bron: 'pagina', antwoord: url, status: 'pagina' });
    (it.questions || []).forEach((q, qi) => (q && q.options || []).forEach((o, oi) => { if (!o || !o.label) return;
      out.push({ id: site + ':' + it.slug + ':' + qi + '-' + oi, taal: site, wil: wil(it.title + ' ' + it.slug), wat, situatie: String(q.q || '') + ': ' + o.label, bron: 'situatie', antwoord: url, status: 'antwoord op pagina' }); }));
  }
  for (const [q, n] of Object.entries(vragen)) out.push({ id: site + ':v:' + q.slice(0, 80), taal: site, wil: wil(q), wat: q, situatie: '', bron: 'bezoeker', n: Number(n) || 1, antwoord: '', status: 'nog geen pagina' });
  return out;
}

export async function bouwModel(kv) {
  const [{ allItems }, W] = await Promise.all([import('../api/kz.js'), import('./wtb.js')]);
  const lijsten = { nl: await allItems(), us: await W.items(W.MARKETS.us), de: await W.items(W.MARKETS.de) };
  const stand = { at: new Date().toISOString(), per: {}, totaal: 0 };
  for (const site of Object.keys(lijsten)) {
    const vragen = paren(await kv.raw(['HGETALL', 'kz:int:n:' + site]).catch(() => null));
    const rijen = rijenVoor(site, lijsten[site], vragen);
    const tel = k => rijen.filter(r => r.bron === k).length, perWil = {}; rijen.forEach(r => { perWil[r.wil] = (perWil[r.wil] || 0) + 1; });
    stand.per[site] = { totaal: rijen.length, pagina: tel('pagina'), situatie: tel('situatie'), bezoeker: tel('bezoeker'), perWil };
    stand.totaal += rijen.length;
    try { await put('intentmodel/' + site + '.json.gz', gzipSync(Buffer.from(JSON.stringify(rijen))), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/gzip' }); stand.per[site].opgeslagen = true; } catch (e) { stand.per[site].opgeslagen = false; stand.per[site].fout = String(e.message || e).slice(0, 120); }
  }
  try { await kv.set('kz:im:stand', stand); } catch (e) {}
  return stand;
}
export async function modelStand(kv) { try { return (await kv.get('kz:im:stand')) || null; } catch (e) { return null; } }
export async function modelRijen(site) {
  if (!HOST[site]) return []; try { const r = await get('intentmodel/' + site + '.json.gz', { access: 'private' }); if (!r || !r.stream) return []; const ch = []; for await (const c of r.stream) ch.push(c); return JSON.parse(gunzipSync(Buffer.concat(ch)).toString()); } catch (e) { return []; }
}
