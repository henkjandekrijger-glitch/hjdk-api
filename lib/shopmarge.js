// Marge per product voor de Yoors Shop, en wat we daarom per product aan advertenties mogen uitgeven.
//
// De shop (Babita) stuurt per product de inkoopprijs en de verzendkosten die wij betalen naar
// /api/shop/marge?k=<haar link>. De verkoopprijs en de verzendkosten die de klant betaalt komen elk uur live uit de
// productlijst van de shop. Zo blijft de marge kloppen als er aan prijzen gewerkt wordt: wij rekenen hem steeds opnieuw uit.
//
// Rekenregels (bedragen in euro):
//   omzet zonder btw   = (prijs + verzending klant) / 1,21
//   betaalkosten       = 2,9% van (prijs + verzending klant) + 0,30
//   marge              = omzet zonder btw - inkoop zonder btw - verzending die wij betalen - betaalkosten
//                        (of de marge die de shop zelf meestuurt, als er geen inkoopprijs is)
//   max per verkoop    = de helft van de marge (de andere helft is winst)
//   max per winkelwagen= max per verkoop x deel van de winkelwagens dat betaalt (30% tot er 10 winkelwagens gemeten zijn)
//   testbudget         = 2 x max per verkoop: zoveel mag een product kosten voordat er een eerste verkoop moet zijn

export const K_KOST = 'hjdk:shop:kost';
const BTW = 1.21, FEE_PCT = 0.029, FEE_VAST = 0.30, AANDEEL = 0.5, START_BETAALT = 0.3;
const num = v => { const n = Number(String(v == null ? '' : v).replace(',', '.')); return Number.isFinite(n) ? n : null; };
const r2 = v => Math.round(v * 100) / 100;
const idOk = s => /^oc_\d{6,30}$/.test(String(s || '').trim()) ? String(s).trim() : '';

// Rekent de marge voor een product uit de catalogus (it: {p, vk}) met wat de shop doorgaf (k: {c, z, m}).
export function margeVan(it, k, betaalt = START_BETAALT) {
  if (!it || !k) return null;
  const prijs = Number(it.p) || 0, vk = Number(it.vk) || 0; if (!prijs) return null;
  let marge = null;
  if (k.c != null) marge = (prijs + vk) / BTW - k.c - (k.z || 0) - (FEE_PCT * (prijs + vk) + FEE_VAST);
  else if (k.m != null) marge = k.m;
  if (marge == null) return null;
  const maxV = Math.max(0, marge * AANDEEL);
  return { marge: r2(marge), maxVerkoop: r2(maxV), maxWinkelwagen: r2(maxV * betaalt), testbudget: r2(2 * maxV) };
}

// Leest JSON ({items:[...]}, een lijst, of één product) of CSV (kopregel met id,cost_price,our_shipping,margin).
function regels(body) {
  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) return Array.isArray(body) ? body : Array.isArray(body.items) ? body.items : [body];
  const t = String(body || '').trim(); if (!t) return [];
  if (t[0] === '{' || t[0] === '[') { try { return regels(JSON.parse(t)); } catch (e) { return []; } }
  const rijen = t.split(/\r?\n/).map(r => r.split(/[;,\t]/).map(x => x.trim().replace(/^"|"$/g, ''))); const kop = rijen.shift().map(x => x.toLowerCase());
  return rijen.filter(r => r.length > 1).map(r => Object.fromEntries(kop.map((h, i) => [h, r[i]])));
}

export async function ontvang(kv, body) {
  const lijst = regels(body).slice(0, 5000); const kaart = (await kv.get(K_KOST)) || {}; let goed = 0; const fout = [];
  for (const x of lijst) {
    const id = idOk(x.id || x.product_id); if (!id) { fout.push({ id: x.id || null, reden: 'onbekend id' }); continue; }
    const c = num(x.cost_price ?? x.inkoop), z = num(x.our_shipping ?? x.ship_cost ?? x.verzending_wij), m = num(x.margin ?? x.marge);
    if (x.delete === true || x.verwijder === true) { delete kaart[id]; goed++; continue; }
    if (c == null && m == null) { fout.push({ id, reden: 'geen cost_price of margin' }); continue; }
    if ((c != null && (c < 0 || c > 10000)) || (z != null && (z < 0 || z > 500))) { fout.push({ id, reden: 'bedrag klopt niet' }); continue; }
    kaart[id] = { c, z: z || 0, m, at: Date.now() }; goed++;
  }
  if (goed) await kv.set(K_KOST, kaart);
  return { ok: true, ontvangen: lijst.length, opgeslagen: goed, fouten: fout.slice(0, 50), producten: Object.keys(kaart).length };
}

// Stand per product: alleen producten waarvan de shop iets doorgaf, met de live prijs uit de catalogus.
export async function margeStand(kv, items, betaalt = START_BETAALT) {
  const kaart = (await kv.get(K_KOST)) || {}; const perId = {}; for (const i of items || []) perId[i.id] = i;
  const lijst = []; let laatst = 0, onbekend = 0;
  for (const [id, k] of Object.entries(kaart)) { laatst = Math.max(laatst, k.at || 0); const it = perId[id]; if (!it) { onbekend++; continue; } const m = margeVan(it, k, betaalt); if (m) lijst.push(Object.assign({ id, t: it.t, p: it.p, vk: it.vk || 0, inkoop: k.c, wij: k.z }, m)); }
  lijst.sort((a, b) => b.marge - a.marge);
  return { producten: lijst.length, catalogus: (items || []).length, onbekend, laatst, betaalt, verlies: lijst.filter(x => x.marge <= 0).length, lijst };
}

// Zet de marge op de catalogusproducten (veld mg), zodat de rangorde erop stuurt. Een marge uit de productlijst zelf gaat voor.
export function zetMarge(items, kaart) { if (!kaart) return items; for (const i of items) { if (i.mg == null && kaart[i.id]) { const m = margeVan(i, kaart[i.id]); if (m) i.mg = m.marge; } } return items; }
