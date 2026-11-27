// Campagne-archief van Clickmind (Henkjan 26 nov 2026: "Haal alles van propeller ads op alle data en gooi die in clikmind en alles van alle
// andere platforms waar we campagnes draaien zodat ook iedere campagne naar CM mind om beter te worden").
// Elke ochtend (cron 05:57 UTC) voor gisteren (UTC), per netwerk alles wat het netwerk weet, naast wat Clickmind zelf mat:
//  - PropellerAds en Google Ads via propellerads-mcp /api/statistiek {archief} (de sleutels blijven daar): instellingen (formaat, biedmodel,
//    bod per land, dagbudget, landing, targeting), creatives (titel, tekst, beeld, cta) en cijfers per campagne, creative, land, os en zone;
//  - Mondiad via de eigen Mondiad-koppeling (lib/mdmcp.js) per campagne; TikTok via lib/tiktok.js per advertentie;
//  - eigen uitkomsten per campagne uit Clickmind (mm:cu, mm:cx, mm:c: echt mens, actie, aanmelding, dialoog, koop) en hun waarde in dollars
//    (de munt van /api/geld, lib/waarde.js).
// Elke nieuwe creative krijgt eenmalig labels (haak, emotie, belofte): eerst AI op de server, lukt dat niet dan de werklijst cm:crl:todo die een chat of geplande taak met eigen tokens labelt (op=campagnes&labelwerk=1, terug met &labels=).
// Leren: leer() telt over 14 dagen per kenmerk (netwerk, project, formaat, land, os, biedmodel, bod, landing, cta, haak, emotie, belofte)
// kosten, kliks, echte mensen en waarde, en zet de beste en slechtste naast elkaar. Alleen meten en adviseren: Clickmind wijzigt hier
// geen campagne. MGID, RichAds en Clickadu hebben hun sleutel in een eigen koppeling en staan hier nog niet in (zie stand.ontbreekt).
import { kv } from './db.js';
import { createHash } from 'node:crypto';
import { projectVan, leesWaarde, waardeVan } from './waarde.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const r2 = x => Math.round(N(x) * 100) / 100;
const gisteren = () => new Date(Date.now() - 864e5).toISOString().slice(0, 10);
const paren = h => { if (!h) return []; if (Array.isArray(h)) { const o = []; for (let i = 0; i + 1 < h.length; i += 2) o.push([String(h[i]), h[i + 1]]); return o; } return Object.entries(h); };
const DAG_TTL = 120 * 86400;

async function lus(body, ms = 58000) {
  const s = process.env.SHOP_SLEUTEL || ''; if (!s) return { ok: false, fout: 'geen SHOP_SLEUTEL' };
  try {
    const r = await fetch((process.env.PA_LUS_URL || 'https://propellerads-mcp.vercel.app') + '/api/statistiek', { method: 'POST', headers: { 'content-type': 'application/json', 'x-shop-sleutel': s }, body: JSON.stringify(body), signal: AbortSignal.timeout(ms) });
    return (await r.json().catch(() => null)) || { ok: false, fout: 'HTTP ' + r.status };
  } catch (e) { return { ok: false, fout: String(e && e.message || e).slice(0, 120) }; }
}

// eigen uitkomsten per netwerk|campagne op een dag (zelfde bronnen als /api/geld)
async function uitkomsten(d) {
  const o = {};
  for (const k of ['mm:cu:', 'mm:cx:', 'mm:c:']) {
    let h = null; try { h = await kv.raw(['HGETALL', k + d]); } catch (e) {}
    for (const [f, v] of paren(h)) { const p = f.split('|'); if (p.length < 3) continue; const key = p[0] + '|' + p[1], veld = p.slice(2).join('|'), x = o[key] || (o[key] = {}); x[k + veld] = N(x[k + veld]) + N(v); }
  }
  const uit = {};
  for (const [key, x] of Object.entries(o)) uit[key] = { echt: Math.max(N(x['mm:cu:echt']), N(x['mm:cx:m']), N(x['mm:c:mens'])), actie: N(x['mm:cu:actie']) + N(x['mm:cx:actie']), aanmelding: N(x['mm:cu:aanmelding']) + N(x['mm:cx:aanmelding']), dialoog: N(x['mm:cu:dialoog']), koop: N(x['mm:cu:koop']), bezoek: N(x['mm:c:n']) };
  return uit;
}

// AI-labels per creative, eenmalig (cm:crl:<hash>). Eerst eigen tokens (Henkjan 26 nov 2026: eigen accounts eerst, gateway als terugval):
// lukt AI op de server niet, dan gaat de tekst naar de werklijst cm:crl:todo; een chat of geplande taak labelt die met eigen tokens
// (op=campagnes&labelwerk=1 lezen, op=campagnes&labels=<JSON> terugzetten). leer() leest de labels bij het tellen.
const crlKey = t => 'cm:crl:' + createHash('sha1').update(t).digest('hex').slice(0, 16);
const crTekst = c => [c.titel, c.tekst].filter(Boolean).join(' / ').slice(0, 400);
async function labels(crs, max = 25) {
  let nieuw = 0, fout = '', aiUit = false;
  for (const c of crs) {
    const t = crTekst(c); if (t.length < 8) continue;
    const k = crlKey(t);
    let l = await kv.get(k).catch(() => null);
    if (!l && !aiUit && nieuw < max) {
      nieuw++;
      try {
        const { berichten, HAIKU } = await import('./ai.js');
        const r = await berichten({ fn: 'cm-creative-label', model: HAIKU, max: 80, timeout: 15000, cacheTtl: 90 * 86400, system: LABEL_SYS, user: t });
        const m = String(r.txt || '').match(/\{[\s\S]*\}/); l = m ? JSON.parse(m[0]) : null;
        if (l) await kv.set(k, l, { ex: 90 * 86400 }).catch(() => {}); else fout = 'geen JSON';
      } catch (e) { fout = String(e && e.message || e).slice(0, 100); aiUit = true; }
    }
    if (l) c.ai = { haak: String(l.haak || '-').toLowerCase(), emotie: String(l.emotie || '-').toLowerCase(), belofte: String(l.belofte || '').slice(0, 40) };
    else await kv.raw(['HSET', 'cm:crl:todo', k.slice(7), t]).catch(() => {});
  }
  return { nieuw, fout };
}
export const LABEL_SYS = 'Je labelt een advertentietekst. Antwoord alleen met JSON: {"haak":"nieuwsgierig|voordeel|angst|bewijs|vraag|getal|korting|gratis|urgentie|persoonlijk|anders","emotie":"blij|bang|boos|nieuwsgierig|neutraal","belofte":"max 4 woorden"}';
export async function labelWerk(n = 80) {
  const h = paren(await kv.raw(['HGETALL', 'cm:crl:todo']).catch(() => null));
  return { uitleg: 'Creatives zonder label. Label elk met ' + LABEL_SYS.slice(46) + ' en zet terug met ?op=campagnes&labels={"<k>":{"haak":..,"emotie":..,"belofte":..}}', open: h.length, werk: h.slice(0, n).map(([k, t]) => ({ k, tekst: t })) };
}
export async function zetLabels(obj) {
  let n = 0; const H = ['nieuwsgierig', 'voordeel', 'angst', 'bewijs', 'vraag', 'getal', 'korting', 'gratis', 'urgentie', 'persoonlijk', 'anders'], E = ['blij', 'bang', 'boos', 'nieuwsgierig', 'neutraal'];
  for (const [k, l] of Object.entries(obj || {})) {
    if (!/^[0-9a-f]{16}$/.test(k) || !l) continue;
    const v = { haak: H.includes(String(l.haak)) ? l.haak : 'anders', emotie: E.includes(String(l.emotie)) ? l.emotie : 'neutraal', belofte: String(l.belofte || '').slice(0, 40), door: 'eigen' };
    await kv.set('cm:crl:' + k, v, { ex: 90 * 86400 }); await kv.raw(['HDEL', 'cm:crl:todo', k]).catch(() => {}); n++;
  }
  return { ok: true, gezet: n };
}

const merkVan = (naam, p) => /KAUFBERATER|WHICHTOBUY|KEUZEHULP/i.test(naam) ? 'keuzehulpen' : /SURGERY|CHIRURG/i.test(naam) ? 'chirurgie' : /SEALED/i.test(naam) ? 'sealed' : p;
const projGads = naam => /kadoly|shop/i.test(naam) ? 'kadoly' : /mylevel|dmv|asvab|citizenship|cdl|real estate/i.test(naam) ? 'mylevel' : projectVan(naam);

export async function ronde({ dag } = {}) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(String(dag || '')) ? dag : gisteren(), fouten = [], camps = [];
  const [pa, ga, uit, munt] = await Promise.all([lus({ archief: true, dag: d, max: 100 }), lus({ archief: true, net: 'gads', dag: d }), uitkomsten(d), leesWaarde(kv).catch(() => null)]);
  if (!pa.ok) fouten.push('propeller: ' + pa.fout);
  for (const c of pa.campagnes || []) camps.push({ net: 'propeller', ...c, project: projectVan(c.naam) });
  if (!ga.ok) fouten.push('gads: ' + ga.fout); for (const f of ga.fouten || []) fouten.push('gads ' + f);
  for (const c of ga.campagnes || []) camps.push({ net: 'gads', ...c, project: projGads(c.naam) });
  try { const { mdPerCampagne } = await import('./wachtuur.js'); const m = await mdPerCampagne(d); if (m.fout) fouten.push('mondiad: ' + m.fout); for (const r of m.rijen || []) if (r.kosten > 0 || r.kliks > 0) camps.push({ net: 'mondiad', id: r.camp, naam: r.naam, kliks: r.kliks, kosten: r2(r.kosten), project: projectVan(r.naam), creatives: [] }); } catch (e) { fouten.push('mondiad: ' + String(e.message || e).slice(0, 80)); }
  try { const T = await import('./tiktok.js'); const t = await T.ttRapport(d); if (!t.ok) fouten.push('tiktok: ' + String(t.fout || t.message || 'geen rapport').slice(0, 80)); else if ((t.rijen || []).some(x => x.spend > 0)) camps.push({ net: 'tiktok', id: 'tt-kadoly', naam: 'TikTok Kadoly', project: 'kadoly', kosten: r2(t.rijen.reduce((s, x) => s + x.spend, 0)), kliks: t.rijen.reduce((s, x) => s + x.kliks, 0), vert: t.rijen.reduce((s, x) => s + x.vert, 0), conv: t.rijen.reduce((s, x) => s + x.ttKoop, 0), creatives: t.rijen.filter(x => x.spend > 0).map(x => ({ id: x.id, titel: x.naam, kosten: x.spend, kliks: x.kliks, vert: x.vert, conv: x.ttKoop })) }); } catch (e) { fouten.push('tiktok: ' + String(e.message || e).slice(0, 80)); }
  // Een netwerk dat nu niet antwoordt maakt een dag die al in het archief staat niet leeg (27 nov 2026: PropellerAds weigert de tijdzone
  // voor dagen ouder dan een week, "Time zone is available only in the weekly period", en een nieuwe ronde voor zo'n dag gooide de
  // campagnes van dat netwerk weg). De oude campagnes van dat netwerk blijven staan; hun eigen uitkomsten worden hieronder opnieuw geteld.
  const mis = new Set([!pa.ok && 'propeller', !ga.ok && 'gads'].filter(Boolean));
  if (mis.size) { const oud = await kv.get('cm:camp:' + d).catch(() => null); if (Array.isArray(oud)) for (const c of oud) if (mis.has(c.net) && !camps.some(x => x.net === c.net && String(x.id) === String(c.id))) camps.push(c); }
  // eigen uitkomsten en waarde erbij
  for (const c of camps) {
    const u = uit[c.net + '|' + c.id] || uit[c.net + '|' + String(c.id).replace(/^g/, '')] || null;
    c.merk = merkVan(c.naam || '', c.project);
    c.eigen = u || { echt: 0, actie: 0, aanmelding: 0, dialoog: 0, koop: 0, bezoek: 0 }; c.gemeten = !!u;
    c.waarde = munt ? r2(waardeVan(munt, c.project, c.eigen).dollar) : null;
  }
  const L = await labels(camps.flatMap(c => c.creatives || []));
  await kv.set('cm:camp:' + d, camps, { ex: DAG_TTL }).catch(e => fouten.push('opslaan: ' + String(e.message || e).slice(0, 80)));
  await kv.raw(['SADD', 'cm:campdagen', d]).catch(() => {});
  const per = {}; for (const c of camps) { const p = per[c.net] || (per[c.net] = { campagnes: 0, kosten: 0, gemeten: 0 }); p.campagnes++; p.kosten = r2(p.kosten + N(c.kosten)); if (c.gemeten) p.gemeten++; }
  const r = { ok: true, dag: d, per_netwerk: per, nieuwe_labels: L.nieuw, fouten: L.fout ? [...fouten, 'labels: ' + L.fout] : fouten };
  await kv.set('cm:camp:laatste', { ...r, t: new Date().toISOString() }).catch(() => {});
  return r;
}

// Historie inhalen (Henkjan 27 nov 2026: "Zit alle hist prop ad data hier al in nu ?" en "Ja ik geef toegang"): een rij dagen die nog niet in
// het archief staan, oudste eerst, met alle netwerken van de ronde (PropellerAds, Google Ads, Mondiad, TikTok). Elke aanroep (cron elke 5 minuten,
// /api/mm?op=campagnes&inhaal=1; starten met &van=&tot=) doet dagen tot ~200 seconden op zijn, met een slot zodat er nooit twee tegelijk lopen.
// Een dag waarop PropellerAds faalt komt nog twee keer terug. Klaar: het geheugen leest alles opnieuw in en de cron doet daarna niets meer (één lees).
export async function inhaal({ van, tot, tijd = 200e3 } = {}) {
  const ok = x => /^\d{4}-\d{2}-\d{2}$/.test(String(x || ''));
  let w = await kv.get('cm:inhaal').catch(() => null);
  if (ok(van) && ok(tot) && van <= tot) { w = { van, tot, gedaan: [], poging: {}, fouten: {}, per: {}, start: new Date().toISOString() }; await kv.set('cm:inhaal', w, { ex: 30 * 86400 }); }
  if (!w || w.klaar) return { ok: true, klaar: w ? w.klaar : null, rest: 0, per: w ? w.per : undefined };
  const slot = await kv.raw(['SET', 'cm:inhaal:slot', '1', 'NX', 'EX', '290']).catch(() => null);
  if (!slot) return { ok: true, bezig: true };
  const begin = Date.now(), alle = [], nu = [];
  for (let t = Date.parse(w.van + 'T00:00:00Z'); t <= Date.parse(w.tot + 'T00:00:00Z'); t += 864e5) alle.push(new Date(t).toISOString().slice(0, 10));
  try {
    for (const d of alle) {
      if (w.gedaan.includes(d)) continue;
      if (Date.now() - begin > tijd) break;
      const r = await ronde({ dag: d }).catch(e => ({ ok: false, fouten: ['propeller: ' + String(e && e.message || e).slice(0, 120)] }));
      w.poging[d] = (w.poging[d] || 0) + 1;
      if ((r.fouten || []).length) w.fouten[d] = r.fouten.slice(0, 3); else delete w.fouten[d];
      if (!(r.fouten || []).some(f => /^propeller/.test(f)) || w.poging[d] >= 3) {
        w.gedaan.push(d);
        for (const [n, p] of Object.entries(r.per_netwerk || {})) { const x = w.per[n] || (w.per[n] = { dagen: 0, campagnes: 0, kosten: 0 }); x.dagen++; x.campagnes += p.campagnes; x.kosten = r2(x.kosten + p.kosten); }
      }
      nu.push(d); await kv.set('cm:inhaal', w, { ex: 30 * 86400 }).catch(() => {});
    }
    const rest = alle.filter(d => !w.gedaan.includes(d)).length;
    if (!rest) {
      w.klaar = new Date().toISOString();
      w.geheugen = await import('./paspoort.js').then(P => P.ronde({})).then(g => ({ stukken: g.stukken, raak: g.raak, mis: g.mis })).catch(e => ({ fout: String(e && e.message || e).slice(0, 120) }));
      await kv.set('cm:inhaal', w, { ex: 30 * 86400 }).catch(() => {});
    }
    return { ok: true, nu, rest, per: w.per, dagenMetFout: Object.keys(w.fouten).length, klaar: w.klaar || null };
  } finally { await kv.raw(['DEL', 'cm:inhaal:slot']).catch(() => {}); }
}

const bodVak = b => b == null ? '-' : b < 0.02 ? '<0.02' : b < 0.05 ? '0.02-0.05' : b < 0.2 ? '0.05-0.20' : b < 1 ? '0.20-1' : '1+';
const hostVan = u => { try { return new URL(u).host.replace(/^www\./, ''); } catch (e) { return '-'; } };

async function dagen(n) { const uit = []; for (let i = 1; i <= n; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); const x = await kv.get('cm:camp:' + d).catch(() => null); if (x) uit.push(...x.map(c => ({ ...c, dag: d }))); } return uit; }

// per kenmerk: kosten, kliks, echte mensen, waarde; campagne-kenmerken op campagneniveau, creative-kenmerken op creativeniveau
export async function leer({ dagen: n = 14, project = '', net = '' } = {}) {
  let rs = await dagen(Math.min(60, n));
  if (project) rs = rs.filter(c => c.project === project || c.merk === project); if (net) rs = rs.filter(c => c.net === net);
  const G = {}, LC = {};
  for (const c of rs) for (const cr of c.creatives || []) if (!cr.ai) { const t = crTekst(cr); if (t.length < 8) continue; const k = crlKey(t); if (!(k in LC)) LC[k] = await kv.get(k).catch(() => null); const l = LC[k]; if (l) cr.ai = { haak: String(l.haak || '-'), emotie: String(l.emotie || '-'), belofte: String(l.belofte || '') }; }
  const tel = (k, w, x) => { const g = (G[k] || (G[k] = {}))[w] || (G[k][w] = { kosten: 0, kliks: 0, echt: 0, uitkomsten: 0, waarde: 0, n: 0 }); g.kosten += N(x.kosten); g.kliks += N(x.kliks); g.echt += N(x.echt); g.uitkomsten += N(x.uitkomsten); g.waarde += N(x.waarde); g.n++; };
  for (const c of rs) {
    const e = c.eigen || {}, x = { kosten: c.kosten, kliks: c.kliks, echt: e.echt, uitkomsten: N(e.actie) + N(e.aanmelding) + N(e.dialoog) + N(e.koop), waarde: c.waarde }, i = c.instellingen || {};
    tel('netwerk', c.net, x); tel('merk', c.merk || c.project || '-', x); tel('formaat', c.net + ':' + (i.formaat ?? '-'), x); tel('biedmodel', c.net + ':' + (i.biedmodel ?? '-'), x);
    tel('bod', bodVak((i.boden || [])[0] ? i.boden[0].bod : null), x); tel('landing', hostVan(i.landing), x);
    for (const l of c.landen || []) tel('land', String(l.land), { kosten: l.kosten, kliks: l.kliks });
    for (const o of c.os || []) tel('os', String(o.os), { kosten: o.kosten, kliks: o.kliks });
    // creatives: eigen uitkomsten zijn er per campagne; verdeel ze naar rato van de kliks van de creative
    const kl = (c.creatives || []).reduce((s, y) => s + N(y.kliks), 0) || 1;
    for (const cr of c.creatives || []) { const a = N(cr.kliks) / kl, y = { kosten: cr.kosten, kliks: cr.kliks, echt: N(e.echt) * a, uitkomsten: x.uitkomsten * a, waarde: N(c.waarde) * a };
      if (cr.ai) { tel('haak', cr.ai.haak, y); tel('emotie', cr.ai.emotie, y); } tel('cta', cr.cta || '-', y); }
  }
  const lijst = {};
  for (const [k, ws] of Object.entries(G)) lijst[k] = Object.entries(ws).map(([w, g]) => ({ w, kosten: r2(g.kosten), kliks: Math.round(g.kliks), echt: Math.round(g.echt), uitkomsten: Math.round(g.uitkomsten), waarde: r2(g.waarde), per_echt: g.echt ? r2(g.kosten / g.echt) : null, waarde_per_dollar: g.kosten ? r2(g.waarde / g.kosten) : null, cpc: g.kliks ? Math.round(10000 * g.kosten / g.kliks) / 10000 : null }))
    .sort((a, b) => b.kosten - a.kosten).slice(0, 25);
  // advies: per kenmerk de beste en slechtste met minstens $5 kosten (op waarde per dollar, anders op kosten per echt mens)
  const advies = [];
  for (const [k, l] of Object.entries(lijst)) {
    const m = l.filter(x => x.kosten >= 5 && x.w !== '-' && x.w !== '–'); if (m.length < 2 || !m.some(x => x.echt > 0 || x.waarde > 0)) continue; // land en os hebben alleen netwerkcijfers
    const opWaarde = m.some(x => x.waarde > 0), sc = x => opWaarde ? N(x.waarde_per_dollar) : (x.per_echt == null ? -1e9 : -x.per_echt);
    const s = [...m].sort((a, b) => sc(b) - sc(a)), best = s[0], slecht = s[s.length - 1];
    advies.push(opWaarde ? `${k}: ${best.w} levert $${best.waarde_per_dollar} per $1 (${best.kosten} uitgegeven), ${slecht.w} $${slecht.waarde_per_dollar} (${slecht.kosten})`
      : `${k}: ${best.w} kost $${best.per_echt ?? '?'} per echt mens (${best.kosten} uitgegeven), ${slecht.w} $${slecht.per_echt ?? 'geen mens'} (${slecht.kosten})`);
  }
  const camps = {}; for (const c of rs) { const k = c.net + ':' + c.id, x = camps[k] || (camps[k] = { net: c.net, id: c.id, naam: c.naam, project: c.project, kosten: 0, kliks: 0, echt: 0, waarde: 0, dagen: 0 }); x.kosten += N(c.kosten); x.kliks += N(c.kliks); x.echt += N((c.eigen || {}).echt); x.waarde += N(c.waarde); x.dagen++; }
  const cl = Object.values(camps).map(x => ({ ...x, kosten: r2(x.kosten), waarde: r2(x.waarde), per_echt: x.echt ? r2(x.kosten / x.echt) : null, zonder_meting: x.echt === 0 && x.kosten >= 3 })).sort((a, b) => b.kosten - a.kosten);
  return { uitleg: 'Campagne-archief van Clickmind: alles wat de netwerken weten (instellingen, creatives, cijfers per creative, land, os, zone) naast de eigen uitkomsten en hun waarde. per_echt = kosten per echt mens; waarde_per_dollar = waarde van de uitkomsten per uitgegeven dollar. Per campagne: ?op=campagnes&campagne=<net>:<id>.',
    laatste_ronde: await kv.get('cm:camp:laatste').catch(() => null), dagen: n, campagnes: cl.length, advies, kenmerken: lijst, top_campagnes: cl.slice(0, 30),
    ontbreekt: ['MGID, RichAds en Clickadu: sleutel zit in hun eigen koppeling, nog niet in het archief'] };
}

export async function campagne(sleutel, n = 30) {
  const [net, id] = String(sleutel || '').split(':'); const rs = (await dagen(Math.min(60, n))).filter(c => c.net === net && String(c.id) === String(id));
  return { campagne: sleutel, dagen: rs.length, laatste_instellingen: (rs[0] || {}).instellingen || null, creatives: (rs[0] || {}).creatives || [], per_dag: rs.map(c => ({ dag: c.dag, kosten: c.kosten, kliks: c.kliks, vert: c.vert, eigen: c.eigen, waarde: c.waarde, landen: (c.landen || []).slice(0, 5), zones: (c.zones || []).slice(0, 5) })) };
}
