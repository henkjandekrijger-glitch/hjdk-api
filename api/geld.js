// HET GELDSCHERM van Clickmind (Henkjan 13 nov 2026: "Ja voer ze alle 7 door", punt 6: één geldscherm; punt 1: alles in één munt).
// https://hjdk-api-henq.vercel.app/api/geld  (alleen op de beschermde vercel.app-host, achter de Vercel-inlog)
//   ?vorm=json   alles als JSON
//   ?vers=1      nu opnieuw ophalen (anders hoogstens eens per 5 minuten, de bronnen zijn zwaar)
//   POST         de munt opslaan (formulier onderaan, of JSON { waarden: { project: { uitkomst: dollars } }, eurUsd })
// Per project in dollars: uitgegeven (PropellerAds en Mondiad per campagne), opgeleverd (uitkomsten uit Clickmind x de munt uit
// lib/waarde.js, plus echte Kadoly-verkopen uit de shop zelf), dollar terug per dollar uit, verspild geld en wat Clickmind deed.
// Alleen lezen: dit scherm wijzigt nooit campagnes, biedingen, budgetten of instellingen van netwerken.
import { kv } from '../lib/db.js';
import { leesWaarde, zetWaarde, projectVan, waardeVan, PROJECTEN, PROJECT_NAAM, UITKOMSTEN, UITKOMST_NAAM } from '../lib/waarde.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const r2 = x => Math.round(N(x) * 100) / 100;
const dagUTC = (o = 0) => new Date(Date.now() + o * 864e5).toISOString().slice(0, 10);
const estDag = () => new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10); // PropellerAds-dag: EST, vast UTC-5 (05:00 UTC)
const rows = x => (Array.isArray(x) ? x : Array.isArray(x && x.data) ? x.data : Array.isArray(x && x.items) ? x.items : Array.isArray(x && x.rows) ? x.rows : Array.isArray(x && x.content) ? x.content : []);
const paren = h => { const o = []; if (!h) return o; if (Array.isArray(h)) { for (let i = 0; i + 1 < h.length; i += 2) o.push([String(h[i]), h[i + 1]]); return o; } return Object.entries(h); };
const NETTEN = ['propeller', 'mondiad'];
const K_STAND = 'mm:geld:stand', K_LOCK = 'mm:geld:lock', VERS_MS = 5 * 60e3;
const PA = () => (process.env.PA_LUS_URL || 'https://propellerads-mcp.vercel.app');

// beschermde host: zelfde check als api/mm.js (*.vercel.app zit achter de Vercel-inlog, ssoProtection all_except_custom_domains)
const beschermd = req => /\.vercel\.app$/i.test(String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]) && /\.vercel\.app$/i.test(String(req.headers.host || '').split(':')[0]);

// ---------- bronnen ----------
async function paPost(body, ms = 28000) {
  const s = process.env.SHOP_SLEUTEL || ''; if (!s) return { ok: false, fout: 'SHOP_SLEUTEL ontbreekt' };
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
  try { const r = await fetch(PA() + '/api/statistiek', { method: 'POST', headers: { 'content-type': 'application/json', 'x-shop-sleutel': s }, body: JSON.stringify(body), signal: ac.signal }); const j = await r.json().catch(() => ({})); return j && j.ok ? j : { ok: false, fout: String((j && j.fout) || 'HTTP ' + r.status).slice(0, 120) }; }
  catch (e) { return { ok: false, fout: String(e && e.message || e).slice(0, 120) }; } finally { clearTimeout(t); }
}
// PropellerAds per campagne voor een dag in tijdzone tz; voorbije dagen 6 uur in de cache
async function paDag(d, tz) {
  const verleden = d < (tz === '-0500' ? estDag() : dagUTC()), ck = 'mm:geld:pa:' + tz + ':' + d;
  if (verleden) { const c = await kv.get(ck).catch(() => null); if (c && Array.isArray(c.rijen)) return c; }
  const j = await paPost({ perCampagne: true, dag: d, tz });
  if (!j.ok) return { fout: 'PropellerAds ' + d + ': ' + j.fout, rijen: [] };
  const uit = { rijen: (j.rijen || []).filter(r => N(r.kliks) || N(r.kosten)).map(r => ({ camp: String(r.camp), naam: String(r.naam || '').slice(0, 140), kliks: N(r.kliks), kosten: N(r.kosten) })) };
  if (verleden) await kv.set(ck, uit, { ex: 6 * 3600 }).catch(() => {});
  return uit;
}
// Mondiad per campagne (UTC-dag) via de Mondiad-MCP; namen erbij als het rapport ze niet geeft
async function mdNamen(md) {
  const c = await kv.get('mm:geld:mdnamen').catch(() => null); if (c && typeof c === 'object' && Object.keys(c).length) return c;
  const naam = {};
  for (let pagina = 0; pagina < 4; pagina++) { const l = rows(await md('mondiad_list_campaigns', { size: 500, page: pagina, sortBy: 'ID', sortDirection: 'DESC', responseFields: ['ID', 'NAME'] })); for (const x of l) naam[String(x.id)] = String(x.name || '').slice(0, 140); if (l.length < 500) break; }
  await kv.set('mm:geld:mdnamen', naam, { ex: 6 * 3600 }).catch(() => {}); return naam;
}
async function mdDag(d, md) {
  const verleden = d < dagUTC(), ck = 'mm:geld:md:' + d;
  if (verleden) { const c = await kv.get(ck).catch(() => null); if (c && Array.isArray(c.rijen)) return c; }
  try {
    const rep = rows(await md('mondiad_campaign_report', { startDate: d, endDate: d, breakdown: 'CAMPAIGN', size: 500, sortBy: 'SPENT', sortDirection: 'DESC' }));
    let rijen = rep.map(r => ({ camp: String(r.campaignId || ''), naam: String(r.campaignName || '').slice(0, 140), kliks: N(r.clicks), kosten: N(r.spent) })).filter(r => r.camp && (r.kliks || r.kosten));
    if (rijen.some(r => !r.naam)) { const nm = await mdNamen(md).catch(() => ({})); rijen = rijen.map(r => ({ ...r, naam: r.naam || nm[r.camp] || '' })); }
    const uit = { rijen }; if (verleden) await kv.set(ck, uit, { ex: 6 * 3600 }).catch(() => {}); return uit;
  } catch (e) { return { fout: 'Mondiad ' + d + ': ' + String(e && e.message || e).slice(0, 100), rijen: [] }; }
}
async function hash(k) { const o = {}; try { for (const [f, v] of paren(await kv.raw(['HGETALL', k]))) o[f] = N(v); } catch (e) {} return o; }
// "net|camp|veld" -> { "net|camp": { veld: n } }
function perCamp(h) { const o = {}; for (const [f, v] of Object.entries(h)) { const p = f.split('|'); if (p.length < 3) continue; const k = p[0] + '|' + p[1], veld = p.slice(2).join('|'); const x = o[k] || (o[k] = {}); x[veld] = N(x[veld]) + v; } return o; }

// ---------- berekenen (zwaar; hoogstens eens per 5 minuten) ----------
async function berekenRuw() {
  const t0 = Date.now(), fouten = [];
  const D = Array.from({ length: 7 }, (_, i) => dagUTC(-i)), E = estDag();
  // 1. uitgaven: PropellerAds (7 UTC-dagen + de PropellerAds-dag van vandaag), in groepjes van 4 tegelijk
  const paTaken = [...D.map(d => [d, '+0000']), [E, '-0500']], paRes = [];
  for (let i = 0; i < paTaken.length; i += 4) paRes.push(...await Promise.all(paTaken.slice(i, i + 4).map(([d, tz]) => paDag(d, tz))));
  const pa = {}; D.forEach((d, i) => { pa[d] = paRes[i]; if (paRes[i].fout) fouten.push(paRes[i].fout); });
  const paEst = paRes[D.length]; if (paEst.fout) fouten.push(paEst.fout);
  // Mondiad: na elkaar (de MCP-sessie is gedeeld)
  const mo = {}; let md = null;
  try { md = (await import('../lib/mdmcp.js')).md; } catch (e) { fouten.push('Mondiad niet te laden'); }
  for (const d of D) { if (!md) { mo[d] = { rijen: [] }; continue; } if (Date.now() - t0 > 70e3) { mo[d] = { fout: 'Mondiad ' + d + ': overgeslagen (te traag)', rijen: [] }; fouten.push(mo[d].fout); continue; } mo[d] = await mdDag(d, md); if (mo[d].fout) fouten.push(mo[d].fout); }

  // campagne -> project (namen over alle dagen)
  const naam = {}; for (const d of D) { for (const r of pa[d].rijen) naam['propeller|' + r.camp] = r.naam; for (const r of mo[d].rijen) naam['mondiad|' + r.camp] = r.naam; } for (const r of paEst.rijen) naam['propeller|' + r.camp] = naam['propeller|' + r.camp] || r.naam;
  const projVan = k => (naam[k] ? projectVan(naam[k]) : null);
  const leeg = () => Object.fromEntries(PROJECTEN.map(p => [p, {}]));
  const uit = leeg(), tel = leeg(), pbbot = leeg(), camps = leeg(), uitPaDag = {};
  for (const d of D) {
    for (const [net, bron] of [['pa', pa[d]], ['md', mo[d]]]) for (const r of bron.rijen) {
      const p = projectVan(r.naam), x = uit[p][d] || (uit[p][d] = { pa: 0, md: 0, kliks: 0 }); x[net] += r.kosten; x.kliks += r.kliks; if (r.kosten > 0) (camps[p][net + r.camp] = 1);
    }
  }
  for (const r of paEst.rijen) { const p = projectVan(r.naam); uitPaDag[p] = N(uitPaDag[p]) + r.kosten; }

  // 2. uitkomsten uit Clickmind per campagne: mm:cu (klik-id), mm:cx (todayin, spel, bzz zonder klik-id), mm:c (mensmeter), mm:zx (lezers per zone)
  const andereNetten = {}, zonderNaam = {};
  for (const d of D) {
    const [cu, cx, c, zx] = await Promise.all([hash('mm:cu:' + d), hash('mm:cx:' + d), hash('mm:c:' + d), hash('mm:zx:' + d)]);
    const U = perCamp(cu), X = perCamp(cx), C = perCamp(c);
    for (const k of new Set([...Object.keys(U), ...Object.keys(X)])) {
      const net = k.split('|')[0], u = U[k] || {}, x = X[k] || {}, m = C[k] || {};
      if (!NETTEN.includes(net)) { if (net !== 'test' && net !== 'onbekend') andereNetten[net] = N(andereNetten[net]) + N(u.echt) + N(u.actie) + N(u.aanmelding) + N(u.dialoog) + N(u.koop); continue; }
      let p = projVan(k); if (!p) { p = 'overig'; zonderNaam[k] = 1; }
      const t = tel[p][d] || (tel[p][d] = { echt: 0, actie: 0, aanmelding: 0, lezer: 0, dialoog: 0, koop: 0 });
      t.echt += Math.max(N(u.echt), N(x.m), N(m.mens)); t.actie += N(u.actie) + N(x.actie); t.aanmelding += N(u.aanmelding) + N(x.aanmelding); t.dialoog += N(u.dialoog); t.koop += N(u.koop);
      if (N(u.pbbot)) pbbot[p][d] = N(pbbot[p][d]) + N(u.pbbot);
    }
    // lezers komen alleen per zone binnen (todayin Curaçao, bzz /api/cw): toegerekend aan todayin
    let lez = 0; for (const [f, v] of Object.entries(zx)) { const p = f.split('|'); if (p[2] === 'lezer' && NETTEN.includes(p[0])) lez += v; }
    if (lez) { const t = tel.todayin[d] || (tel.todayin[d] = { echt: 0, actie: 0, aanmelding: 0, lezer: 0, dialoog: 0, koop: 0 }); t.lezer += lez; }
  }

  // 3. Kadoly: de shop zelf (betaalde bestellingen uit de datapagina van de shop, elk uur door de shop-lus opgehaald)
  const shop = { verkopen: {}, omzetEur: {}, margeEur: {}, margeBekend: 0, metKenmerk: 0, bestellingen: [], feedAt: null };
  try {
    const f = await kv.get('hjdk:shop:lusfeed'); shop.feedAt = f && f.at ? new Date(f.at).toISOString() : null;
    let kost = null; try { kost = await kv.get('hjdk:shop:kost'); } catch (e) {}
    for (const o of (f && f.orders) || []) {
      if (!/paid|betaald/i.test(String(o.s || '')) || /^test/i.test(String(o.hj || ''))) continue;
      const d = String(o.at || '').slice(0, 10); if (!D.includes(d)) continue;
      const v = N(o.v), n = Math.max(1, N(o.n)), k = kost && kost[o.p];
      let marge = null; if (k && k.c != null) marge = v / 1.21 - n * N(k.c) - N(k.z) - (0.029 * v + 0.30); else if (k && k.m != null) marge = n * N(k.m);
      shop.verkopen[d] = N(shop.verkopen[d]) + 1; shop.omzetEur[d] = N(shop.omzetEur[d]) + v; if (marge != null) { shop.margeEur[d] = N(shop.margeEur[d]) + marge; shop.margeBekend++; }
      if (o.hj) shop.metKenmerk++;
      shop.bestellingen.push({ dag: d, bedragEur: r2(v), margeEur: marge == null ? null : r2(marge), viaAdvertentie: !!o.hj, methode: o.m || '' });
    }
  } catch (e) { fouten.push('shopbestellingen: ' + String(e && e.message || e).slice(0, 80)); }
  for (const d of D) if (shop.verkopen[d]) { const t = tel.kadoly[d] || (tel.kadoly[d] = { echt: 0, actie: 0, aanmelding: 0, lezer: 0, dialoog: 0, koop: 0 }); t.koop = Math.max(t.koop, shop.verkopen[d]); }

  // 4. verspild
  const versp = { dubbel: {}, dubbelFout: null, blok: null, aankomst: null };
  try { // herhaalkliks: geld naar mensen die we die dag al hadden (alleen /go, lib/mensgeld.js)
    let mensgeld = null;
    for (const d of D) { if (!N(await kv.raw(['EXISTS', 'mm:arm:' + d]).catch(() => 0))) continue; if (!mensgeld) mensgeld = (await import('../lib/mensgeld.js')).mensgeld; const m = await mensgeld(kv, { dag: d, pa: pa[d], mo: mo[d] }); versp.dubbel[d] = N(m && m.totaal && m.totaal.dubbelGeld); }
  } catch (e) { versp.dubbelFout = String(e && e.message || e).slice(0, 100); }
  try { // zones op het blokvoorstel en wat ze kostten (PropellerAds per zone, campagnes met uitgaven)
    const b = (await kv.get('mm:blok:propeller')) || {}, klaar = new Set((b.zones || []).map(String)), wacht = new Set((b.wachtOpHenkjan || []).map(String));
    const idsVan = ds => { const s = {}; for (const d of ds) for (const r of pa[d].rijen) if (r.kosten > 0) s[r.camp] = N(s[r.camp]) + r.kosten; return Object.entries(s).sort((a, c) => c[1] - a[1]).slice(0, 80).map(x => x[0]); };
    const zk = async (ids, van, tot) => { if (!ids.length) return { ok: true, rijen: [] }; return paPost({ perZone: true, campagnes: ids, van, tot }, 25000); };
    const [zv, z7] = await Promise.all([zk(idsVan([D[0]]), D[0], D[0]), zk(idsVan(D), D[6], D[0])]);
    const som = (j, set) => (j.rijen || []).filter(r => set.has(String(r.zone))).reduce((s, r) => s + N(r.kosten), 0);
    const tel2 = (j, set) => (j.rijen || []).filter(r => set.has(String(r.zone)) && N(r.kosten) > 0).length;
    versp.blok = { aan: !!b.aan, bijgewerkt: b.bijgewerkt || null, klaar: klaar.size, wacht: wacht.size, vandaag: zv.ok ? { klaar: r2(som(zv, klaar)), wacht: r2(som(zv, wacht)), zonesKlaar: tel2(zv, klaar) } : null, week: z7.ok ? { klaar: r2(som(z7, klaar)), wacht: r2(som(z7, wacht)), zonesKlaar: tel2(z7, klaar) } : null, fout: [zv.fout, z7.fout].filter(Boolean).join('; ') || null };
  } catch (e) { versp.blok = { fout: String(e && e.message || e).slice(0, 100) }; }
  try { // betaald maar niet aangekomen (leerronde, vandaag, campagnes via /go en /w)
    const l = await kv.get('mm:leer:laatst'); const a = l && l.aankomst;
    if (a) { const z = (a.laagste || []).filter(x => N(x.betaald) > 0); versp.aankomst = { at: l.bijgewerkt, zones: z.length, dollar: r2(z.reduce((s, x) => s + N(x.kosten) * Math.max(0, 1 - N(x.aangekomen) / N(x.betaald)), 0)), kliksWeg: z.reduce((s, x) => s + Math.max(0, N(x.betaald) - N(x.aangekomen)), 0), fout: a.fout || null }; }
  } catch (e) {}

  // 5. wat Clickmind deed
  const cm = { blokgedaan: [], dossiers: [] };
  try { cm.blokgedaan = ((await kv.raw(['LRANGE', 'mm:blokgedaan:propeller', 0, 5])) || []).map(x => { try { const o = JSON.parse(x); return { t: o.t, geblokkeerd: N(o.geblokkeerd), samenvatting: String(o.samenvatting || '').slice(0, 300), fouten: (o.fouten || []).length }; } catch (e) { return null; } }).filter(Boolean); } catch (e) {}
  try {
    const idx = (((await kv.raw(['SMEMBERS', 'mm:terug:index'])) || []).map(String)).filter(k => D.includes(k.split(':')[1])).sort().reverse();
    for (const k of idx.slice(0, 14)) {
      const [net, d] = k.split(':'); const x = await kv.get('mm:terug:' + k).catch(() => null); if (!x) continue;
      const ing = await kv.get('mm:terug:ingediend:' + k).catch(() => null);
      // ongeveer: sterk bewijs per campagne x de klikprijs van die campagne die dag (alleen PropellerAds, UTC-dag)
      let dollar = null; if (net === 'propeller' && pa[d]) { const cpc = {}; for (const r of pa[d].rijen) if (r.kliks) cpc[r.camp] = r.kosten / r.kliks; dollar = r2((x.perCampagne || []).reduce((s, c) => s + N(c.sterk) * N(cpc[String(c.campagne)]), 0)); }
      cm.dossiers.push({ netwerk: net, dag: d, kliksViaOns: N(x.kliksViaOns), verdacht: N(x.verdacht), sterk: N(x.sterkBewijs), pct: x.pctVerdacht, uiterlijk: x.uiterlijkIndienen || null, dollar, ingediend: ing ? (typeof ing === 'object' ? (ing.at || ing.t || true) : ing) : null });
    }
  } catch (e) {}

  const kort = {}; for (const f of fouten) { const m = /^(PropellerAds|Mondiad) (\d{4}-\d{2}-\d{2}): (.*)$/.exec(f); const k = m ? m[1] + ': ' + m[3] : f; (kort[k] || (kort[k] = [])).push(m ? m[2] : ''); }
  const foutKort = Object.entries(kort).map(([k, ds]) => ds.filter(Boolean).length > 1 ? k + ' (' + ds.length + ' dagen)' : (ds[0] ? k + ' (' + ds[0] + ')' : k));
  return { at: new Date().toISOString(), duurMs: Date.now() - t0, dagen: D, paDag: E, uit, uitPaDag, tel, pbbot, campagnes: Object.fromEntries(PROJECTEN.map(p => [p, Object.keys(camps[p]).length])), shop, verspild: versp, clickmind: cm, fouten: foutKort, andereNetten, zonderNaam: Object.keys(zonderNaam).length };
}

async function ruwStand(vers) {
  let c = null; try { c = await kv.get(K_STAND); } catch (e) {}
  const oud = c && c.at ? Date.now() - Date.parse(c.at) : Infinity;
  if (!vers && c && oud < VERS_MS) return c;
  // al iemand aan het rekenen? dan de vorige stand (als die er is)
  const slot = await kv.raw(['SET', K_LOCK, '1', 'NX', 'EX', '100']).catch(() => 'OK');
  if (slot !== 'OK' && c) return c;
  try { const r = await berekenRuw(); await kv.set(K_STAND, r, { ex: 6 * 3600 }).catch(() => {}); return r; }
  finally { await kv.del([K_LOCK]).catch(() => {}); }
}

// ---------- samenvatten met de munt (licht, elke keer opnieuw: een nieuwe munt telt meteen) ----------
function samenvatting(ruw, munt) {
  const D = ruw.dagen, sl = { vandaag: [D[0]], gisteren: [D[1]], week: D };
  const proj = {};
  for (const p of PROJECTEN) {
    const o = { naam: PROJECT_NAAM[p], campagnes7: N(ruw.campagnes[p]) };
    for (const [s, ds] of Object.entries(sl)) {
      const t = { echt: 0, actie: 0, aanmelding: 0, lezer: 0, dialoog: 0, koop: 0 }; let pa = 0, md = 0, kliks = 0, bot = 0;
      for (const d of ds) { const u = ruw.uit[p][d]; if (u) { pa += u.pa; md += u.md; kliks += u.kliks; } const x = ruw.tel[p][d]; if (x) for (const k of UITKOMSTEN) t[k] += N(x[k]); bot += N(ruw.pbbot[p][d]); }
      const w = waardeVan(munt, p, t), uitg = pa + md;
      o[s] = { uit: r2(uitg), pa: r2(pa), md: r2(md), kliks, waard: r2(w.dollar), verschil: r2(w.dollar - uitg), terugPerDollar: uitg > 0 ? Math.round(100 * w.dollar / uitg) / 100 : null, uitkomsten: t, opbouw: w.per, pbbot: bot };
    }
    o.paDag = r2(ruw.uitPaDag[p]);
    proj[p] = o;
  }
  const tot = {}; for (const s of Object.keys(sl)) { const u = PROJECTEN.reduce((a, p) => a + proj[p][s].uit, 0), w = PROJECTEN.reduce((a, p) => a + proj[p][s].waard, 0); tot[s] = { uit: r2(u), waard: r2(w), verschil: r2(w - u), terugPerDollar: u > 0 ? Math.round(100 * w / u) / 100 : null }; }
  tot.paDag = r2(PROJECTEN.reduce((a, p) => a + proj[p].paDag, 0));
  const sh = ruw.shop, som = o => D.reduce((a, d) => a + N(o[d]), 0);
  const shop = { verkopenVandaag: N(sh.verkopen[D[0]]), verkopen7: som(sh.verkopen), omzetEur7: r2(som(sh.omzetEur)), margeEur7: r2(som(sh.margeEur)), margeBekend: sh.margeBekend, metKenmerk: sh.metKenmerk, feedAt: sh.feedAt, bestellingen: sh.bestellingen, margeUsd7: r2(som(sh.margeEur) * munt.eurUsd) };
  return { projecten: proj, totaal: tot, shop };
}

// ---------- weergave ----------
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const usd = x => { const v = N(x); return (v < 0 ? '−' : '') + '$' + Math.abs(v).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
const usdKlein = x => { const v = N(x); return v > 0 && v < 0.1 ? '$' + v.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 3 }) : usd(v); };
const eur = x => '€' + N(x).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const getal = x => N(x).toLocaleString('nl-NL');
const tal = (x, een, meer) => getal(x) + ' ' + (N(x) === 1 ? een : meer);
const tijd = iso => iso ? String(iso).slice(0, 16).replace('T', ' ') + ' UTC' : 'onbekend';
const dagNL = d => { const [y, m, dd] = String(d).split('-').map(Number); return dd + ' ' + ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][m - 1]; };
const MEERV = { echt: ['echt mens', 'echte mensen'], actie: ['actie', 'acties'], aanmelding: ['aanmelding', 'aanmeldingen'], lezer: ['lezer', 'lezers'], dialoog: ['dialoog', 'dialogen'], koop: ['verkoop', 'verkopen'] };

function oordeelZin(o) {
  const v = o.vandaag, w = o.week;
  let z = o.naam + ': ';
  if (v.uit > 0 || v.waard > 0) z += 'vandaag ' + usd(v.uit) + ' uit, ' + usd(v.waard) + ' waard. ' + (v.verschil >= 0 ? 'Winst ' : 'Verlies ') + usd(Math.abs(v.verschil)) + '.';
  else z += 'vandaag niets uitgegeven.';
  if (w.uit > 0 || w.waard > 0) z += ' Zeven dagen: ' + (w.verschil >= 0 ? 'winst ' : 'verlies ') + usd(Math.abs(w.verschil)) + (w.terugPerDollar != null ? ' (' + usd(w.terugPerDollar) + ' terug per dollar)' : '') + '.';
  return z;
}
function regel(label, x) {
  return '<div class="rij"><b>' + esc(label) + '</b><span>' + usd(x.uit) + ' uit</span><span>' + usd(x.waard) + ' waard</span><span class="' + (x.verschil >= 0 ? 'plus' : 'min') + '">' + (x.verschil >= 0 ? 'winst ' : 'verlies ') + usd(Math.abs(x.verschil)) + '</span><span>' + (x.terugPerDollar == null ? 'geen uitgaven' : usd(x.terugPerDollar) + ' per $1') + '</span></div>';
}
function opbouwTekst(o, munt, p) {
  const delen = []; for (const u of UITKOMSTEN) { const x = o.opbouw[u]; if (!x) continue; delen.push(getal(x.n) + ' ' + MEERV[u][x.n === 1 ? 0 : 1] + ' × ' + usdKlein(munt.cent[p][u] / 100) + ' = ' + usd(x.dollar)); }
  return delen.length ? delen.join('; ') : 'geen uitkomsten gemeten';
}

function pagina(ruw, sam, munt, melding) {
  const D = ruw.dagen, P = sam.projecten, T = sam.totaal;
  const actief = PROJECTEN.filter(p => P[p].week.uit > 0 || P[p].week.waard > 0 || P[p].paDag > 0).sort((a, b) => P[b].week.uit - P[a].week.uit);
  let h = '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Geld: wat het kost en wat het oplevert</title>'
    + '<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">'
    + '<style>:root{--b:#2B47C4;--z:#F2F4FB}*{box-sizing:border-box}body{margin:0;background:#fff;color:#000;font:18px/1.5 Inter,system-ui,-apple-system,sans-serif}main{max-width:980px;margin:0 auto;padding:28px 18px 72px}'
    + 'h1{font-size:34px;line-height:1.15;margin:0 0 8px;letter-spacing:-.02em}h2{font-size:26px;line-height:1.2;margin:48px 0 14px;letter-spacing:-.01em}p{margin:8px 0}b{font-weight:700}'
    + '.kaart{background:var(--z);border-radius:18px;padding:18px 20px;margin:14px 0;font-size:20px}.kaart h3{font-size:26px;margin:0 0 8px}'
    + '.oordeel{list-style:none;padding:0;margin:0}.oordeel li{background:var(--z);border-radius:14px;padding:14px 18px;margin:10px 0;font-size:20px;border-left:8px solid #C62828}.oordeel li.goed{border-left-color:#1B7F3B}.oordeel li.niets{border-left-color:#000}'
    + '.tot{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:18px 0}.tot div{background:var(--z);border-radius:18px;padding:16px 18px;font-size:20px}.tot strong{display:block;font-size:34px;line-height:1.1;font-weight:800}'
    + '.rij{display:grid;grid-template-columns:150px repeat(4,1fr);gap:4px 14px;padding:10px 0;border-top:2px solid #fff}.rij:first-of-type{border-top:0}.rij .min{font-weight:700}.rij .plus{font-weight:700}'
    + '.lijst{margin:8px 0;padding-left:22px}.lijst li{margin:6px 0}'
    + 'a.knop{display:inline-block;color:#000;text-decoration:none;border:2px solid #000;border-radius:99px;padding:8px 16px;margin:6px 8px 6px 0;font-weight:600}a.knop.blauw{background:var(--b);border-color:var(--b);color:#fff}'
    + '.melding{background:#FFF3C4;border-radius:14px;padding:12px 16px;margin:14px 0;font-size:20px}'
    + 'form .proj{background:var(--z);border-radius:18px;padding:16px 18px;margin:14px 0}form .proj h3{font-size:20px;margin:0 0 10px}.velden{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px}'
    + 'label{display:block;font-weight:600}input{width:100%;font:inherit;font-size:20px;color:#000;background:#fff;border:2px solid #000;border-radius:10px;padding:8px 10px;margin:4px 0}.bron{display:block}'
    + 'button{font:inherit;font-size:20px;font-weight:700;background:var(--b);color:#fff;border:0;border-radius:12px;padding:14px 30px;cursor:pointer;margin-top:10px}'
    + '@media(max-width:640px){h1{font-size:30px}.rij{grid-template-columns:1fr 1fr}.rij b{grid-column:1/-1}.tot strong{font-size:30px}}</style></head><body><main>';
  h += '<h1>Geld: wat het kost en wat het oplevert</h1><p>Alles in dollars. Bijgewerkt ' + esc(tijd(ruw.at)) + ' (hoogstens eens per 5 minuten opnieuw opgehaald). Vandaag is de UTC-dag ' + esc(dagNL(D[0])) + '; zeven dagen is ' + esc(dagNL(D[6])) + ' tot en met vandaag.</p>'
    + '<p><a class="knop" href="/api/mm/clickmind">Clickmind</a><a class="knop" href="/api/geld?vers=1">Nu opnieuw ophalen</a><a class="knop" href="#munt">Waarde per uitkomst</a></p>';
  if (melding) h += '<p class="melding">' + esc(melding) + '</p>';

  h += '<h2>Oordeel per project</h2><ul class="oordeel">' + (actief.length ? actief.map(p => '<li class="' + (P[p].week.uit === 0 && P[p].vandaag.uit === 0 ? 'niets' : P[p].week.verschil >= 0 ? 'goed' : '') + '">' + esc(oordeelZin(P[p])) + '</li>').join('') : '<li class="niets">Geen uitgaven en geen uitkomsten in de laatste zeven dagen.</li>') + '</ul>';

  h += '<div class="tot"><div>Vandaag uitgegeven<strong>' + usd(T.vandaag.uit) + '</strong>waard ' + usd(T.vandaag.waard) + '</div><div>Vandaag ' + (T.vandaag.verschil >= 0 ? 'winst' : 'verlies') + '<strong>' + usd(Math.abs(T.vandaag.verschil)) + '</strong>' + (T.vandaag.terugPerDollar == null ? '' : usd(T.vandaag.terugPerDollar) + ' terug per dollar') + '</div>'
    + '<div>Zeven dagen uitgegeven<strong>' + usd(T.week.uit) + '</strong>waard ' + usd(T.week.waard) + '</div><div>Zeven dagen ' + (T.week.verschil >= 0 ? 'winst' : 'verlies') + '<strong>' + usd(Math.abs(T.week.verschil)) + '</strong>' + (T.week.terugPerDollar == null ? '' : usd(T.week.terugPerDollar) + ' terug per dollar') + '</div></div>'
    + '<p>PropellerAds-dag (sinds 05:00 UTC, de dag waarop het budget telt): ' + usd(T.paDag) + ' uitgegeven bij PropellerAds.</p>';

  h += '<h2>Per project</h2>';
  for (const p of actief) {
    const o = P[p];
    h += '<div class="kaart"><h3>' + esc(o.naam) + '</h3>' + regel('Vandaag', o.vandaag) + regel('Gisteren', o.gisteren) + regel('Zeven dagen', o.week)
      + '<p>PropellerAds-dag (sinds 05:00 UTC): ' + usd(o.paDag) + ' uit. Zeven dagen: PropellerAds ' + usd(o.week.pa) + (o.week.md ? ', Mondiad ' + usd(o.week.md) : '') + ', ' + getal(o.week.kliks) + ' betaalde kliks, ' + tal(o.campagnes7, 'campagne', 'campagnes') + ' met uitgaven.</p>'
      + '<p>Waarde zeven dagen: ' + esc(opbouwTekst(o.week, munt, p)) + '.</p>';
    if (p === 'kadoly') { const s = sam.shop; h += '<p>Verkopen in de shop (zeven dagen): ' + getal(s.verkopen7) + (s.verkopen7 ? ', omzet ' + eur(s.omzetEur7) + (s.margeBekend ? ', marge uit de inkoopprijzen ' + eur(s.margeEur7) + ' (' + usd(s.margeUsd7) + ')' : '') + '; ' + getal(s.metKenmerk) + ' daarvan kwam via een advertentie' : '') + '. Gelezen uit de shop zelf (bijgewerkt ' + esc(tijd(s.feedAt)) + '), want de shop meldt verkopen niet altijd aan Clickmind.</p>'; }
    if (o.week.pbbot) h += '<p>Conversies die Clickmind niet aan het netwerk meldde omdat de zone een botzone is: vandaag ' + getal(o.vandaag.pbbot) + ', zeven dagen ' + getal(o.week.pbbot) + '.</p>';
    h += '</div>';
  }

  // verspild
  const V = ruw.verspild, dub = V.dubbel || {}, dubV = N(dub[D[0]]), dub7 = D.reduce((a, d) => a + N(dub[d]), 0);
  h += '<h2>Verspild</h2><div class="kaart"><ul class="lijst">';
  h += '<li><b>Herhaalkliks</b> (betaald voor iemand die we die dag al hadden): ' + (Object.keys(dub).length ? 'vandaag ' + usd(dubV) + ', zeven dagen ' + usd(dub7) + '. Alleen meetbaar voor kliks via /go.' : 'niets te meten: er liep de laatste zeven dagen geen verkeer via /go (Amazon staat uit).') + (V.dubbelFout ? ' Fout: ' + esc(V.dubbelFout) : '') + '</li>';
  const B = V.blok;
  if (B && !B.fout) h += '<li><b>Zones op het blokvoorstel</b>: ' + getal(B.klaar) + ' klaar om te blokkeren, ' + getal(B.wacht) + ' wachten op jouw woord (grootste bron van een campagne). Blokkeren staat ' + (B.aan ? 'aan' : 'uit') + '. ' + (B.vandaag ? 'Die zones kostten vandaag nog ' + usd(B.vandaag.klaar) + ' (' + tal(B.vandaag.zonesKlaar, 'zone', 'zones') + ' met uitgaven)' + (B.vandaag.wacht ? ' plus ' + usd(B.vandaag.wacht) + ' aan zones die op jou wachten' : '') + '. ' : '') + (B.week ? 'Zeven dagen: ' + usd(B.week.klaar) + (B.week.wacht ? ' plus ' + usd(B.week.wacht) + ' wachtend' : '') + ' (ook van voordat ze op de lijst kwamen).' : '') + '</li>';
  else h += '<li><b>Zones op het blokvoorstel</b>: kosten per zone niet op te halen' + (B && B.fout ? ' (' + esc(B.fout) + ')' : '') + '.</li>';
  const A = V.aankomst;
  h += '<li><b>Betaald maar niet aangekomen</b>: ' + (A ? usd(A.dollar) + ' vandaag (' + getal(A.kliksWeg) + ' kliks in ' + (A.zones === 1 ? 'de slechtste zone' : 'de ' + getal(A.zones) + ' slechtste zones') + ', alleen campagnes via /go en /w; leerronde ' + esc(tijd(A.at)) + ').' : 'nog geen meting van de leerronde.') + '</li></ul></div>';

  // wat Clickmind deed
  const C = ruw.clickmind, botV = PROJECTEN.reduce((a, p) => a + N(P[p].vandaag.pbbot), 0), bot7 = PROJECTEN.reduce((a, p) => a + N(P[p].week.pbbot), 0);
  h += '<h2>Wat Clickmind deed</h2><div class="kaart"><ul class="lijst">';
  h += '<li><b>Blokkeren</b>: ' + (C.blokgedaan.length ? C.blokgedaan.slice(0, 4).map(x => esc(tijd(x.t)) + ': ' + tal(x.geblokkeerd, 'zone', 'zones') + ' uitgesloten' + (x.samenvatting ? ' (' + esc(x.samenvatting) + ')' : '') + (x.fouten ? ', ' + x.fouten + ' fouten' : '')).join('<br>') : 'nog geen uitvoering gemeld.') + '</li>';
  h += '<li><b>Conversies tegengehouden voor botzones</b> (zodat het netwerk daar niet leert inkopen): vandaag ' + getal(botV) + ', zeven dagen ' + getal(bot7) + '.</li>';
  h += '<li><b>Terugbetalingsdossiers</b> (indienen alleen op jouw woord): ' + (C.dossiers.length ? '<br>' + C.dossiers.map(x => esc(x.netwerk) + ' ' + esc(dagNL(x.dag)) + ': ' + getal(x.verdacht) + ' verdachte kliks, ' + getal(x.sterk) + ' met sterk bewijs' + (x.dollar != null ? ', ongeveer ' + usd(x.dollar) : '') + '. ' + (x.ingediend ? 'Ingediend' + (typeof x.ingediend === 'string' ? ' ' + esc(tijd(x.ingediend)) : '') + '.' : 'Nog niet ingediend' + (x.uiterlijk ? ', uiterlijk ' + esc(dagNL(x.uiterlijk)) : '') + '.')).join('<br>') : 'geen dossiers in de laatste zeven dagen.') + '</li></ul>'
    + '<p><a class="knop" href="/api/mm/terugbetaling?net=propeller&van=' + D[1] + '&tot=' + D[1] + '&formaat=csv">Bewijs gisteren (CSV)</a></p></div>';

  // ontbreekt
  const mist = [
    'RichAds, MGID en Clickadu tellen hier niet mee: alleen PropellerAds en Mondiad.' + (Object.keys(ruw.andereNetten).length ? ' Er kwamen wel uitkomsten binnen via ' + Object.keys(ruw.andereNetten).map(esc).join(', ') + '.' : ''),
    'KDP-verkopen ziet Clickmind niet (de klik gaat door naar Amazon). Tot die er per dag in staan, is KDP hier alleen waard wat er aan echte mensen gemeten wordt.',
    'Lezers komen alleen per zone binnen (todayin Curaçao) en tellen bij todayin.',
    'Kadoly-verkopen komen uit de shop zelf; per campagne weten we niet welke advertentie verkocht.',
    'Vandaag, gisteren en zeven dagen zijn UTC-dagen; het budget telt per PropellerAds-dag (05:00 UTC).',
  ];
  if (ruw.zonderNaam) mist.push(getal(ruw.zonderNaam) + ' campagnes met uitkomsten maar zonder uitgaven in deze zeven dagen staan onder overig.');
  for (const f of ruw.fouten) mist.push('Fout bij ophalen: ' + esc(f));
  h += '<h2>Wat nog ontbreekt</h2><div class="kaart"><ul class="lijst">' + mist.map(x => '<li>' + x + '</li>').join('') + '</ul></div>';

  // de munt
  h += '<h2 id="munt">Waarde per uitkomst</h2><p>Wat elke uitkomst je waard is, in dollars. Waar "schatting" staat, is het een standaardgetal: zet je eigen getal en druk op Opslaan. Verkoop is de marge per verkoop, niet de omzet.</p><form method="post" action="/api/geld">';
  for (const p of PROJECTEN) {
    h += '<div class="proj"><h3>' + esc(PROJECT_NAAM[p]) + '</h3><div class="velden">';
    for (const u of UITKOMSTEN) { const c = munt.cent[p][u]; h += '<div><label for="w_' + p + '_' + u + '">' + esc(UITKOMST_NAAM[u]) + '</label><input id="w_' + p + '_' + u + '" name="w.' + p + '.' + u + '" inputmode="decimal" value="' + esc(String(Math.round(c * 100) / 10000).replace('.', ',')) + '"><span class="bron">' + (munt.bron[p][u] === 'eigen' ? 'eigen getal' : 'schatting, zet je eigen getal') + '</span></div>'; }
    h += '</div></div>';
  }
  h += '<div class="proj"><h3>Koers</h3><div class="velden"><div><label for="eurUsd">1 euro in dollar</label><input id="eurUsd" name="eurUsd" inputmode="decimal" value="' + esc(String(munt.eurUsd).replace('.', ',')) + '"><span class="bron">' + (munt.eurUsdBron === 'eigen' ? 'eigen getal' : 'schatting, zet je eigen getal') + '</span></div></div></div>';
  h += '<button type="submit">Opslaan</button>' + (munt.bijgewerkt ? '<p>Laatst opgeslagen ' + esc(tijd(munt.bijgewerkt)) + '.</p>' : '') + '</form>';
  return h + '</main></body></html>';
}

function leesBody(req) {
  const b = req.body;
  if (b && typeof b === 'object' && !Buffer.isBuffer(b)) return b;
  const t = Buffer.isBuffer(b) ? b.toString('utf8') : String(b || '');
  if (/^\s*[{[]/.test(t)) { try { return JSON.parse(t); } catch (e) { return {}; } }
  return Object.fromEntries(new URLSearchParams(t));
}

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex, nofollow');
  if (!beschermd(req)) return res.status(403).send('alleen via de beschermde vercel.app-host');
  const url = new URL(req.url, 'https://' + (req.headers.host || 'x'));
  try {
    if (req.method === 'POST') {
      const b = leesBody(req); let obj;
      if (b && b.waarden && typeof b.waarden === 'object') obj = { waarden: b.waarden, eurUsd: b.eurUsd, eenheid: b.eenheid };
      else { const w = {}; for (const [k, v] of Object.entries(b || {})) { const m = /^w\.([a-z-]+)\.([a-z]+)$/.exec(k); if (m) (w[m[1]] || (w[m[1]] = {}))[m[2]] = v; } obj = { waarden: w, eurUsd: b && b.eurUsd }; }
      const r = await zetWaarde(kv, obj);
      const json = /json/.test(String(req.headers['content-type'] || '')) || url.searchParams.get('vorm') === 'json';
      if (json) return res.status(r.ok ? 200 : 400).json(r);
      const m = r.ok ? (r.gewijzigd ? 'Opgeslagen: ' + r.gewijzigd + ' ' + (r.gewijzigd === 1 ? 'getal' : 'getallen') + ' aangepast.' : 'Opgeslagen, er veranderde niets.') : 'Niet opgeslagen: ' + r.fout;
      res.statusCode = 303; res.setHeader('location', '/api/geld?m=' + encodeURIComponent(m) + '#munt'); return res.end();
    }
    const vers = url.searchParams.get('vers') === '1';
    const [ruw, munt] = await Promise.all([ruwStand(vers), leesWaarde(kv)]);
    const sam = samenvatting(ruw, munt);
    if (url.searchParams.get('vorm') === 'json') return res.status(200).json({ ok: true, at: ruw.at, duurMs: ruw.duurMs, dagen: ruw.dagen, paDag: ruw.paDag, oordeel: PROJECTEN.filter(p => sam.projecten[p].week.uit > 0 || sam.projecten[p].week.waard > 0).sort((a, b) => sam.projecten[b].week.uit - sam.projecten[a].week.uit).map(p => oordeelZin(sam.projecten[p])), ...sam, verspild: ruw.verspild, clickmind: ruw.clickmind, fouten: ruw.fouten, andereNetten: ruw.andereNetten, munt });
    res.setHeader('content-type', 'text/html; charset=utf-8');
    return res.status(200).send(pagina(ruw, sam, munt, String(url.searchParams.get('m') || '').slice(0, 300)));
  } catch (e) {
    return res.status(500).json({ ok: false, fout: String(e && e.message || e).slice(0, 300) });
  }
}
