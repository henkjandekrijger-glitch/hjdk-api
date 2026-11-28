// 51Degrees-toestelherkenning voor Clickmind (Henkjan 27 nov 2026: "Zorg voor top voorspellingen !! Je bent de patroon herkenner !!").
// Uit de user-agent en de client hints van de meetpagina (model, Android-versie) haalt 51Degrees het echte toestel: merk, model,
// marktnaam, soort toestel, bouwjaar en of het een crawler is. Dat gaat als voorspellers het voorspelmodel in (lib/vmodel.js).
// Gratis plan: 100.000 opvragingen per maand. Sleutel: D51_KEY in Vercel (de Resource Key van https://51degrees.com/configure/jWWpKvsD).
// Nooit vertragend: de opvraag loopt na het antwoord (laterAf) en elk toestel wordt 30 dagen bewaard, zodat hetzelfde toestel niet nog eens kost.
// Opslag: mm:d51:<hash> antwoord (30 d), mm:d51n:<JJJJ-MM> opvragingen deze maand, mm:d51fout fouten per status, mm:d51laatst laatste fout.
import crypto from 'node:crypto';

export const D51 = { url: 'https://cloud.51degrees.com/api/v4/json', maand: 90000, ttl: 30 * 86400, tijd: 2500, values: 'HardwareVendor,HardwareModel,HardwareName,DeviceType,ReleaseYear,IsCrawler,IsEmulatingDesktop' };
const N = x => Number(x) || 0;
const een = v => Array.isArray(v) ? v[0] : v;
const tekst = (v, max = 40) => { v = een(v); if (v == null) return ''; const s = String(v).trim(); return /^unknown$/i.test(s) ? '' : s.slice(0, max); };

// het bewijs dat 51Degrees krijgt: user-agent plus client hints zoals de browser ze als header zou sturen
export function bewijs(c) {
  if (!c || typeof c !== 'object') return null;
  const ua = String(c.ua || '').slice(0, 512); if (!ua) return null;
  const h = c.uah || {}, e = { 'user-agent': ua };
  const android = /Android/.test(ua);
  if (h.model) e['sec-ch-ua-model'] = '"' + String(h.model).slice(0, 60) + '"';
  if (h.pv) e['sec-ch-ua-platform-version'] = '"' + String(h.pv).slice(0, 20) + '"';
  if (android) { e['sec-ch-ua-platform'] = '"Android"'; e['sec-ch-ua-mobile'] = '?1'; }
  if (h.fv) e['sec-ch-ua-full-version-list'] = String(h.fv).slice(0, 300).split(', ').map(x => { const i = x.lastIndexOf(' '); return '"' + x.slice(0, i) + '";v="' + x.slice(i + 1) + '"'; }).join(', ');
  return e;
}

// het antwoord terugbrengen tot wat Clickmind nodig heeft
export function velden(j) {
  const d = (j && j.device) || {};
  const jaar = N(tekst(d.releaseyear));
  return {
    v: tekst(d.hardwarevendor), m: tekst(d.hardwaremodel), n: tekst(d.hardwarename, 50), ty: tekst(d.devicetype, 20),
    j: jaar > 1990 && jaar < 2100 ? jaar : 0, cr: /^true$/i.test(String(een(d.iscrawler))) ? 1 : 0, em: /^true$/i.test(String(een(d.isemulatingdesktop))) ? 1 : 0
  };
}

// voorspellers (lib/voorspel.js LABEL: toestel, tjaar, ttype, tcrawler)
export function voorspellers(r, nu = new Date()) {
  const f = {}; if (!r) return f;
  const naam = r.n || r.m; if (r.v || naam) f.toestel = ((r.v ? r.v + ' ' : '') + (naam || '?')).toLowerCase().replace(/[^a-z0-9 .+-]/g, '').slice(0, 40);
  if (r.j) { const oud = nu.getUTCFullYear() - r.j; f.tjaar = oud <= 1 ? '0-1 jaar oud' : oud <= 3 ? '2-3 jaar oud' : oud <= 5 ? '4-5 jaar oud' : '6+ jaar oud'; }
  if (r.ty) f.ttype = r.ty.toLowerCase().slice(0, 20);
  if (r.cr) f.tcrawler = 'ja';
  return f;
}

// opvragen met bewaren: eerst het geheugen, dan 51Degrees (hoogstens D51.maand per maand)
export async function lees(kv, c, { fetchFn = fetch, sleutel = process.env.D51_KEY } = {}) {
  const e = bewijs(c); if (!e || !sleutel) return null;
  const h = crypto.createHash('sha1').update(JSON.stringify(e)).digest('hex').slice(0, 20), ck = 'mm:d51:' + h;
  const oud = await kv.raw(['GET', ck]).catch(() => null);
  if (oud) { try { return JSON.parse(oud); } catch (x) {} }
  const mk = 'mm:d51n:' + new Date().toISOString().slice(0, 7);
  const n = N(await kv.raw(['INCR', mk]).catch(() => 0)); if (n === 1) await kv.raw(['EXPIRE', mk, 40 * 86400]).catch(() => {});
  if (n > D51.maand) return null;
  // Resource Key (eigen eigenschappenlijst) of License Key (dan met values); welke werkt staat in mm:d51modus
  const vraag = modus => fetchFn(D51.url, { method: 'POST', headers: Object.assign({ 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' }, modus === 'licentie' ? { 'X-51D-License-Key': sleutel, 'X-51D-Values': D51.values } : { 'X-51D-Resource-Key': sleutel }), body: new URLSearchParams(e).toString(), signal: AbortSignal.timeout(D51.tijd) });
  let r, modus = (await kv.raw(['GET', 'mm:d51modus']).catch(() => null)) || 'resource';
  try {
    r = await vraag(modus);
    if (!r.ok && [400, 401, 403].includes(r.status)) { const ander = modus === 'resource' ? 'licentie' : 'resource', r2 = await vraag(ander); if (r2.ok) { r = r2; modus = ander; await kv.raw(['SET', 'mm:d51modus', ander, 'EX', 30 * 86400]).catch(() => {}); } }
  } catch (x) { await kv.raw(['HINCRBY', 'mm:d51fout', 'net', 1]).catch(() => {}); return null; }
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    await Promise.all([kv.raw(['HINCRBY', 'mm:d51fout', String(r.status), 1]), kv.raw(['SET', 'mm:d51laatst', new Date().toISOString() + ' ' + r.status + ' ' + t.slice(0, 300), 'EX', 7 * 86400])]).catch(() => {});
    return null;
  }
  const v = velden(await r.json().catch(() => ({})));
  await kv.raw(['SET', ck, JSON.stringify(v), 'EX', D51.ttl]).catch(() => {});
  return v;
}

// stand voor /api/mm?op=bronnen
export async function stand(kv) {
  const mk = 'mm:d51n:' + new Date().toISOString().slice(0, 7);
  const [n, f, l] = await Promise.all([kv.raw(['GET', mk]).catch(() => 0), kv.raw(['HGETALL', 'mm:d51fout']).catch(() => null), kv.raw(['GET', 'mm:d51laatst']).catch(() => null)]);
  const fout = {}; if (Array.isArray(f)) for (let i = 0; i < f.length; i += 2) fout[f[i]] = N(f[i + 1]);
  return { aan: !!process.env.D51_KEY, dezeMaand: N(n), max: D51.maand, fout, laatsteFout: l || null };
}
