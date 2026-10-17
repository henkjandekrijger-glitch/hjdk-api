// Clickmind: de wissel.
// DE WISSEL (Henkjan 14 okt 2026, stap 2 en 4 van het klikregister): één link per advertentie, de wissel kiest per klik wat iemand te zien krijgt.
//   https://whichtobuy.best/w/<naam>?n=<netwerk>&c=<campagne>&z=<zone>&s=<klik-id netwerk>&b=<advertentie>
//   Een wissel heeft armen: een Amazon-bestemming (zoekterm of ASIN, eigen tag, js-meetpagina of direct) of een eigen pagina (spel, todayin, finds, MYLEVEL ...).
//   - modus "vast": de gewichten uit de instelling (vaste verdeling, zodat vanaf dag één vastligt wie wat zag).
//   - modus "leer": de leerronde (lib/leer.js, elk uur) zet de gewichten met Thompson sampling op de uitkomsten; een vloer houdt elke arm in beeld.
//   - per persoon vast: wie eenmaal een arm kreeg, houdt die zolang hij erbij hoort (veld w:<naam> in mm:p:<pid>).
//   - stap 4 (eigen publiek): een arm kan alleen voor een soort persoon gelden: nieuw, terug (eerder geklikt, niet in de laatste 10 minuten),
//     mens (deed eerder iets echts), abonnee of geen-abonnee. Zo krijgt een terugkerend echt mens het aanbod om te blijven (finds, todayin).
// Uitkomsten: bestemmingen melden per klik-id (mmc in de URL) via /api/mm/uitkomst (of het script /mmu.js) echt, actie, aanmelding of koop.
// Amazon meldt geen klik-id terug: de dagronde zet de Associates-cijfers per tag per dag in /api/mm/amazon; de leerronde koppelt die aan de armen met die tag.
// Opslag: mm:wissel:<naam> instelling (JSON), mm:wissels namen, mm:w:<dag> tellers "<wissel>|<arm>|<veld>" (60 d),
//   mm:cid:<cid> wat de klik kreeg (30 d), mm:u:<cid>:<soort> dubbelcheck (30 d), mm:zu:<dag> uitkomsten per zone (60 d), mm:amz:<dag> Associates per tag (90 d).
import { createHash } from 'node:crypto';
import { amazonBouw, tagOk, schoon, netNaam, dag } from './mensmeter.js';
import { shopUitkomst } from './shopdirect.js';
import { telCmds, vfLees } from './voorspel.js';

const T = { teller: 60 * 86400, cid: 30 * 86400, amz: 90 * 86400 };
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const paren = h => { if (!h) return []; if (Array.isArray(h)) { const o = []; for (let i = 0; i + 1 < h.length; i += 2) o.push([String(h[i]), h[i + 1]]); return o; } return Object.entries(h); };
export const UITKOMSTEN = ['echt', 'actie', 'aanmelding', 'koop'];
export const WIE = ['alle', 'nieuw', 'terug', 'mens', 'abonnee', 'geen-abonnee', 'regel']; // regel = alleen bereikbaar via een regel, nooit via de verdeling
// regels gaan voor de verdeling: wie in die groep valt, gaat altijd naar die arm. amazon24 = klikte in de laatste 24 uur al naar Amazon (cookie staat al:
// een nieuwe klik naar Amazon levert niets extra op), herhaal = klikte in de laatste 10 minuten al.
export const ALS = ['amazon24', 'herhaal', 'terug', 'mens', 'abonnee', 'nieuw'];

// Alleen naar eigen domeinen en Amazon: nooit een open doorverwijzing.
const EIGEN = /^(?:[a-z0-9-]+\.)*(todayin\.email|finds\.email|mylevel\.today|whichtobuy\.best|kaufberater\.best|keuzehulp\.best|outname\.now|yoo\.rs|praisy\.me|moonlighter\.email|amazon\.(?:com|de|co\.uk|ca|fr|it|es|nl|com\.au))$/i;
export function urlOk(u) { try { const x = new URL(String(u).replace(/\{[a-z]+\}/g, 'x')); return x.protocol === 'https:' && EIGEN.test(x.hostname) && !x.username && !x.password; } catch (e) { return false; } }

// ---- instelling controleren (alles wat binnenkomt, ook van de dagronde) ----
export function checkWissel(c, oud) {
  const f = m => ({ ok: false, fout: m });
  if (!c || typeof c !== 'object') return f('geen JSON-object');
  const naam = String(c.naam || '').toLowerCase(); if (!/^[a-z0-9-]{2,40}$/.test(naam)) return f('naam: 2-40 tekens a-z, 0-9 of -');
  const modus = c.modus === 'leer' ? 'leer' : 'vast';
  const doel = ['opbrengst', 'aanmelding', 'actie', 'echt', 'koop'].includes(c.doel) ? c.doel : 'opbrengst';
  const verken = Math.max(0.02, Math.min(0.5, N(c.verken) || 0.1));
  if (!Array.isArray(c.armen) || !c.armen.length || c.armen.length > 12) return f('armen: 1 tot 12');
  const ids = new Set(), tags = {}, armen = [];
  for (const a of c.armen) {
    const id = String(a.id || '').toLowerCase(); if (!/^[a-z0-9-]{1,20}$/.test(id) || ids.has(id)) return f('arm-id ontbreekt, is ongeldig of dubbel: ' + id); ids.add(id);
    const wie = WIE.includes(a.wie) ? a.wie : 'alle';
    const gewicht = Math.max(0, Math.min(1000, N(a.gewicht)));
    if (a.soort === 'amazon') {
      if (!tagOk(a.tag)) return f('arm ' + id + ': ongeldige Amazon-tag');
      if (!a.k && !a.a) return f('arm ' + id + ': zoekterm (k) of ASIN (a) nodig');
      const test = amazonBouw({ k: a.k, a: a.a, m: a.m, tag: a.tag, sub: 'x' }); if (!test) return f('arm ' + id + ': Amazon-bestemming klopt niet (markt of ASIN)');
      if (tags[a.tag]) return f('arm ' + id + ': tag ' + a.tag + ' staat al op arm ' + tags[a.tag] + ' (elke Amazon-arm een eigen tag, anders kan de leerronde niet meten)');
      tags[a.tag] = id;
      armen.push({ id, soort: 'amazon', k: a.k ? String(a.k).slice(0, 150) : undefined, a: a.a ? String(a.a).toUpperCase() : undefined, m: String(a.m || 'com'), tag: a.tag, variant: a.variant === 'js' ? 'js' : '302', p: String(a.p || id).replace(/[^A-Za-z0-9]/g, '').slice(0, 8) || 'w', gewicht, wie, notitie: a.notitie ? String(a.notitie).slice(0, 200) : undefined });
    } else if (a.soort === 'url') {
      if (!urlOk(a.url)) return f('arm ' + id + ': url moet https zijn en naar een eigen domein of Amazon gaan');
      armen.push({ id, soort: 'url', url: String(a.url).slice(0, 600), gewicht, wie, notitie: a.notitie ? String(a.notitie).slice(0, 200) : undefined });
    } else return f('arm ' + id + ': soort moet amazon of url zijn');
  }
  if (!armen.some(a => a.wie === 'alle' || a.wie === 'nieuw')) return f('minstens één arm voor iedereen (wie alle of nieuw), anders krijgen nieuwe bezoekers niets');
  const regels = [];
  for (const r of Array.isArray(c.regels) ? c.regels.slice(0, 5) : []) {
    if (!ALS.includes(r && r.als)) return f('regel: als moet een van ' + ALS.join(', ') + ' zijn');
    if (!ids.has(String(r.arm || '').toLowerCase())) return f('regel: arm ' + r.arm + ' bestaat niet');
    regels.push({ als: r.als, arm: String(r.arm).toLowerCase() });
  }
  const w = { naam, uit: c.uit !== false, modus, doel, verken, armen, regels, notitie: c.notitie ? String(c.notitie).slice(0, 400) : undefined,
    versie: N(oud && oud.versie) + 1, bijgewerkt: new Date().toISOString(), leer: oud && oud.leer, leerAt: oud && oud.leerAt };
  return { ok: true, wissel: w };
}

// ---- lezen en bewaren (instelling 30 s in het geheugen) ----
const CACHE = new Map();
export async function leesWissel(kv, naam, vers = false) {
  const k = String(naam || '').toLowerCase(), c = CACHE.get(k);
  if (!vers && c && Date.now() - c.at < 30000) return c.w;
  const w = await kv.get('mm:wissel:' + k); CACHE.set(k, { at: Date.now(), w: w || null }); return w || null;
}
export async function bewaarWissel(kv, c) {
  const oud = await kv.get('mm:wissel:' + String(c && c.naam || '').toLowerCase());
  const r = checkWissel(c, oud); if (!r.ok) return r;
  if (oud && oud.leer) { const ids = new Set(r.wissel.armen.map(a => a.id)); r.wissel.leer = Object.fromEntries(Object.entries(oud.leer).filter(([k]) => ids.has(k))); }
  await kv.set('mm:wissel:' + r.wissel.naam, r.wissel); await kv.raw(['SADD', 'mm:wissels', r.wissel.naam]); CACHE.delete(r.wissel.naam);
  return r;
}
export async function alleWissels(kv) { const ns = ((await kv.raw(['SMEMBERS', 'mm:wissels']).catch(() => [])) || []).map(String).sort(); const ws = await Promise.all(ns.map(n => kv.get('mm:wissel:' + n))); return ws.filter(Boolean); }

// ---- welke soort persoon is dit (stap 4) ----
export function soortPersoon(p, nu = Date.now()) {
  const s = new Set(['alle']);
  if (!p || !N(p.n)) { s.add('nieuw'); s.add('geen-abonnee'); return s; }
  if (nu - N(p.laatst) >= 600000) s.add('terug'); else s.add('herhaal');
  if (N(p.echt) + N(p.actie) + N(p.aanmelding) + N(p.koop) > 0) s.add('mens');
  if (N(p.aanmelding) > 0 || p.abonnee) s.add('abonnee'); else s.add('geen-abonnee');
  if (N(p.amzLaatst) && nu - N(p.amzLaatst) < 864e5) s.add('amazon24');
  return s;
}
// ---- arm kiezen: per persoon vast, gewogen, deterministisch per persoon ----
export function kiesArm(w, persoon, pid, nu = Date.now()) {
  const soort = soortPersoon(persoon, nu);
  for (const r of w.regels || []) if (soort.has(r.als)) { const a = w.armen.find(x => x.id === r.arm); if (a) return { arm: a, soort: [...soort], vast: true, regel: r.als }; }
  const geschikt = w.armen.filter(a => soort.has(a.wie));
  if (!geschikt.length) return null;
  // per persoon vast, maar opnieuw kiezen als de persoon in een andere groep valt (bv. van nieuw naar terug: dan komen de terug-armen erbij)
  const sig = geschikt.map(a => a.id).join(','), [vastId, vastSig] = String((persoon && persoon['w:' + w.naam]) || '').split('|');
  if (vastId && vastSig === sig) { const a = geschikt.find(x => x.id === vastId); if (a) return { arm: a, soort: [...soort], vast: true, sig }; }
  const gw = geschikt.map(a => Math.max(0, w.modus === 'leer' && w.leer && w.leer[a.id] != null ? N(w.leer[a.id]) : N(a.gewicht)));
  let som = gw.reduce((x, y) => x + y, 0); const g = som > 0 ? gw : geschikt.map(() => 1); if (!(som > 0)) som = g.length;
  const h = createHash('sha256').update(pid + '|' + w.naam + '|' + w.versie + '|' + sig).digest().readUInt32BE(0) / 4294967296 * som;
  let acc = 0; for (let i = 0; i < geschikt.length; i++) { acc += g[i]; if (h < acc) return { arm: geschikt[i], soort: [...soort], vast: false, sig }; }
  return { arm: geschikt[geschikt.length - 1], soort: [...soort], vast: false, sig };
}
// ---- bestemming bouwen ----
export function bestemming(arm, ctx) {
  if (arm.soort === 'amazon') return amazonBouw({ k: arm.k, a: arm.a, m: arm.m, tag: arm.tag, sub: arm.p + '-' + (ctx.zone === '-' ? 'x' : ctx.zone) + (ctx.cr && ctx.cr !== '-' ? '-' + String(ctx.cr).slice(0, 14) : '') }); // ascsubtag per zone, nooit per klik (Associates §2(b))
  const vul = { net: ctx.net, zone: ctx.zone, camp: ctx.camp, sub: ctx.sub, cr: ctx.cr, cid: ctx.cid, pid: ctx.pid, wissel: ctx.wissel, arm: arm.id, land: ctx.land || '' };
  const u = arm.url.replace(/\{([a-z]+)\}/g, (m, k) => (k in vul ? encodeURIComponent(vul[k] === '-' ? '' : String(vul[k] || '')) : m));
  if (!urlOk(u)) return null;
  const x = new URL(u); if (!x.searchParams.has('mmc')) x.searchParams.set('mmc', ctx.cid); // klik-id altijd mee, zodat de bestemming de uitkomst kan melden
  return x.href;
}
// ---- klik in de wissel vastleggen (naast het klikregister) ----
export async function wisselKlik(kv, w, keuze, ctx) {
  const D = dag(), wk = 'mm:w:' + D, pre = w.naam + '|' + keuze.arm.id + '|', ck = 'mm:cid:' + ctx.cid, pk = 'mm:p:' + ctx.pid;
  const cmd = [['HINCRBY', wk, pre + 'n', 1], ['HINCRBY', wk, pre + (keuze.soort.includes('nieuw') ? 'nieuw' : keuze.soort.includes('herhaal') ? 'herhaal' : 'terug'), 1], ['EXPIRE', wk, T.teller],
    ...(keuze.regel ? [['HINCRBY', wk, pre + 'regel_' + keuze.regel, 1]] : []),
    ['HSET', ck, 't', Date.now(), 'pid', ctx.pid, 'wissel', w.naam, 'arm', keuze.arm.id, 'net', ctx.net, 'zone', ctx.zone, 'camp', ctx.camp, 'tag', keuze.arm.tag || ''], ['EXPIRE', ck, T.cid]];
  if (!keuze.vast && keuze.sig) cmd.push(['HSET', pk, 'w:' + w.naam, keuze.arm.id + '|' + keuze.sig]);
  await Promise.all(cmd.map(c => kv.raw(c)));
}
// klik-id koppelen voor /go (zonder wissel), zodat ook die klikken een uitkomst kunnen krijgen
export async function cidKoppel(kv, ctx) { const ck = 'mm:cid:' + ctx.cid; await kv.raw(['HSET', ck, 't', Date.now(), 'pid', ctx.pid, 'wissel', '', 'arm', ctx.arm || '', 'net', ctx.net, 'zone', ctx.zone, 'camp', ctx.camp, 'tag', ctx.tag || '', ...(ctx.shop ? ['shop', ctx.shop] : [])]); await kv.raw(['EXPIRE', ck, T.cid]); }

// ---- uitkomst van een bestemming (echt, actie, aanmelding, koop), eenmaal per klik en soort ----
export async function uitkomst(kv, { cid, soort, waarde, bron }) {
  cid = String(cid || ''); soort = String(soort || '').toLowerCase();
  if (!/^[0-9a-f]{8,24}$/.test(cid)) return { ok: false, fout: 'cid' };
  if (!UITKOMSTEN.includes(soort)) return { ok: false, fout: 'soort: ' + UITKOMSTEN.join(', ') };
  const k = Object.fromEntries(paren(await kv.raw(['HGETALL', 'mm:cid:' + cid])));
  if (!k.pid) return { ok: false, fout: 'onbekende klik (ouder dan 30 dagen of nooit via /go of /w)' };
  const nieuw = String(await kv.raw(['SET', 'mm:u:' + cid + ':' + soort, '1', 'NX', 'EX', T.cid])) === 'OK';
  if (!nieuw) return { ok: true, dubbel: true };
  const D = new Date(N(k.t) || Date.now()).toISOString().slice(0, 10), cent = Math.max(0, Math.min(1e7, Math.round(N(waarde) * 100)));
  const cmd = [['HINCRBY', 'mm:zu:' + D, k.net + '|' + k.zone + '|' + soort, 1], ['EXPIRE', 'mm:zu:' + D, T.teller],
    ['HINCRBY', 'mm:p:' + k.pid, soort, 1], ['HSET', 'mm:p:' + k.pid, 'laatsteUitkomst', soort + '|' + Date.now() + '|' + String(bron || '').slice(0, 40)]];
  if (soort === 'aanmelding') cmd.push(['HSET', 'mm:p:' + k.pid, 'abonnee', String(bron || 'ja').slice(0, 40)]);
  if (k.wissel) { const wk = 'mm:w:' + D, pre = k.wissel + '|' + k.arm + '|'; cmd.push(['HINCRBY', wk, pre + soort, 1], ['EXPIRE', wk, T.teller]); if (cent) cmd.push(['HINCRBY', wk, pre + 'cent', cent]); }
  if (k.modal) { // lerende modal (lib/modal.js): tellers voor arm, moment en variant, en de gebeurtenis per beslissing voor het model
    const md = 'mm:md:' + D, pre = k.modal + '|';
    cmd.push(['HINCRBY', md, pre + k.arm + '|' + (k.seg || 'm-n') + '|' + soort, 1], ['EXPIRE', md, T.teller], ['HSET', 'mm:mdv:' + D, cid + '|' + soort, 1], ['EXPIRE', 'mm:mdv:' + D, 21 * 86400]);
    if (k.mom) cmd.push(['HINCRBY', md, pre + '@' + k.mom + '|*|' + soort, 1]);
    if (k.var) cmd.push(['HINCRBY', md, pre + k.arm + '~' + k.var + '|*|' + soort, 1]);
  }
  cmd.push(['EXPIRE', 'mm:p:' + k.pid, 180 * 86400]);
  if (k.camp && k.camp !== '-') cmd.push(['HINCRBY', 'mm:cu:' + D, k.net + '|' + k.camp + '|' + soort, 1], ['EXPIRE', 'mm:cu:' + D, T.teller]);
  // voorspellers (lib/voorspel.js): deze uitkomst telt voor de voorspellers van de klik, op de dag van de klik
  if ((k.vf || k.vf2) && ['echt', 'actie', 'aanmelding', 'koop'].includes(soort)) cmd.push(...telCmds(D, 'g', Object.assign(vfLees(k.vf), vfLees(k.vf2)), { [soort]: 1 }));
  cmd.push(['RPUSH', 'mm:raw:' + dag(), JSON.stringify({ ty: 'u', t: Date.now(), cid, pid: k.pid, soort, cent, bron: String(bron || '').slice(0, 60), wissel: k.wissel, arm: k.arm, net: k.net, zone: k.zone, camp: k.camp })]);
  await Promise.all(cmd.map(c => kv.raw(c)));
  // Yoors Shop (lib/shopdirect.js): echt en actie op yoo.rs gaan naar de shop-lus; bij de directe route is de eerste tik het hoofddoel voor het netwerk
  let shop = null; if (k.shop) { try { shop = await shopUitkomst(kv, k.shop, soort); } catch (e) { shop = { ok: false, fout: String(e && e.message || e).slice(0, 80) }; } }
  return { ok: true, soort, wissel: k.wissel || null, arm: k.arm || null, zone: k.zone, ...(shop ? { shop } : {}) };
}
// ---- Associates-cijfers per tag per dag (van de dagronde) ----
export async function amazonUitkomst(kv, q) {
  const d = String(q.dag || ''); if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return { ok: false, fout: 'dag JJJJ-MM-DD' };
  if (!tagOk(q.tag)) return { ok: false, fout: 'tag' };
  const r = { kliks: N(q.kliks), artikelen: N(q.artikelen), omzet: N(q.omzet), verdiend: N(q.verdiend), bron: String(q.bron || 'associates').slice(0, 40), at: new Date().toISOString() };
  await kv.raw(['HSET', 'mm:amz:' + d, q.tag, JSON.stringify(r)]); await kv.raw(['EXPIRE', 'mm:amz:' + d, T.amz]);
  return { ok: true, dag: d, tag: q.tag, ...r };
}

// ---- stand per wissel (laatste dagen) ----
export async function wisselStand(kv, w, dagen = 7) {
  const D = Array.from({ length: Math.max(1, Math.min(30, dagen)) }, (_, i) => dag(-i));
  const hs = await Promise.all(D.map(d => kv.raw(['HGETALL', 'mm:w:' + d]).catch(() => null)));
  const amz = await Promise.all(D.map(d => kv.raw(['HGETALL', 'mm:amz:' + d]).catch(() => null)));
  const A = {}; for (const a of w.armen) A[a.id] = { id: a.id, soort: a.soort, wie: a.wie, tag: a.tag, n: 0, nieuw: 0, terug: 0, herhaal: 0, echt: 0, actie: 0, aanmelding: 0, koop: 0, cent: 0, amazon: { dagen: 0, kliksVerstuurd: 0, amazonKliks: 0, artikelen: 0, omzet: 0, verdiend: 0 } };
  hs.forEach((h, i) => {
    const perArmDag = {};
    for (const [f, v] of paren(h)) { const p = f.split('|'); if (p[0] !== w.naam || !A[p[1]]) continue; A[p[1]][p[2]] = N(A[p[1]][p[2]]) + N(v); if (p[2] === 'n') perArmDag[p[1]] = N(v); }
    const am = Object.fromEntries(paren(amz[i]));
    for (const a of w.armen) if (a.soort === 'amazon' && am[a.tag]) { try { const r = JSON.parse(am[a.tag]); const s = A[a.id].amazon; s.dagen++; s.kliksVerstuurd += N(perArmDag[a.id]); s.amazonKliks += N(r.kliks); s.artikelen += N(r.artikelen); s.omzet += N(r.omzet); s.verdiend += N(r.verdiend); } catch (e) {} }
  });
  return Object.values(A);
}

// ---- Thompson sampling: kans dat elke arm de beste is, met een vloer ----
function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function gamma(k) { if (k < 1) return gamma(k + 1) * Math.pow(Math.random(), 1 / k); const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { x = gauss(); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = Math.random(); if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; } }
export function beta(a, b) { const x = gamma(a), y = gamma(b); return x / (x + y); }
export function thompson(stand, { doel = 'opbrengst', verken = 0.1, trekkingen = 4000 } = {}) {
  const armen = stand.filter(a => a);
  if (!armen.length) return {};
  const tel = (a) => {
    if (doel === 'opbrengst') {
      if (a.soort === 'amazon') { const s = a.amazon; return { n: s.kliksVerstuurd, s: s.artikelen, w: s.artikelen ? s.verdiend / s.artikelen : null }; }
      return { n: a.n, s: a.koop || a.aanmelding, w: a.koop ? a.cent / 100 / a.koop : null };
    }
    const s = doel === 'echt' ? a.echt + a.actie + a.aanmelding + a.koop : doel === 'actie' ? a.actie + a.aanmelding + a.koop : doel === 'aanmelding' ? a.aanmelding : a.koop;
    return { n: a.n, s, w: 1 };
  };
  const t = armen.map(tel);
  const ws = t.filter(x => x.w != null).map(x => x.w); const gemW = ws.length ? ws.reduce((p, q) => p + q, 0) / ws.length : 1;
  const winst = armen.map(() => 0);
  for (let i = 0; i < trekkingen; i++) {
    let best = -1, bi = 0;
    t.forEach((x, j) => { const v = beta(1 + x.s, 1 + Math.max(0, x.n - x.s)) * (x.w != null ? x.w : gemW); if (v > best) { best = v; bi = j; } });
    winst[bi]++;
  }
  const k = armen.length, vloer = Math.min(verken / k, 1 / k), rest = 1 - vloer * k;
  return Object.fromEntries(armen.map((a, j) => [a.id, Math.round((vloer + rest * winst[j] / trekkingen) * 1000) / 10]));
}
