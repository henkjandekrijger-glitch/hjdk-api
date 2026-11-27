// Databronnen voor de botcontrole van Clickmind (Henkjan 27 nov 2026: "Kijk of je gratis of betaalde databronnen kunt vinden die waarde
// toevoegen" en "Ja doen . En houw bij in nexy.now/o").
// 1) proxycheck.io (gratis 1.000 checks per dag): steekproef per zone, pas na het antwoord aan de bezoeker (laterAf), dus nooit vertragend.
//    Hoogstens PX.perZone kliks per zone per dag en PX.perDag samen. Per zone per dag: n, proxy, vpn, soort verbinding en provider (ASN).
//    Sleutel: Vercel-variabele PROXYCHECK_KEY (Henkjan zet hem zelf). Hij gaat alleen mee in het HTTPS-verzoek van server naar proxycheck.io,
//    nooit in een pagina, link of log. Het IP-adres zelf wordt nergens bewaard (alleen de uitkomst per zone).
// 2) Cloudflare Radar (gratis API): botaandeel per provider (ASN), eens per dag voor de providers die in de steekproef het vaakst voorkomen.
//    Sleutel: Vercel-variabele CLOUDFLARE_RADAR_TOKEN.
// Lezen: /api/mm?op=bronnen (stand van alle databronnen, tekst; &json=1), /api/mm?op=bronnen&zones=1 (per zone). Cron: op=bronnen&run=1, dagelijks.
import { kv as KV } from './db.js';

export const PX = { perDag: 900, perZone: 3, dagen: 14, minN: 3, grens: 0.6 };
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const dagUtc = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const schoon = s => String(s || '-').replace(/[|\s]/g, '').slice(0, 60) || '-';
const paren = h => { const o = []; if (Array.isArray(h)) for (let i = 0; i + 1 < h.length; i += 2) o.push([String(h[i]), h[i + 1]]); else if (h && typeof h === 'object') o.push(...Object.entries(h)); return o; };

// uitkomst van proxycheck.io v3 (of v2) terugbrengen tot wat de zone nodig heeft
export function pxUit(j, ip) {
  const r = (j && (j[ip] || Object.values(j).find(x => x && typeof x === 'object' && (x.detections || x.proxy || x.network)))) || {};
  const d = r.detections || {}, nw = r.network || {};
  const proxy = d.proxy === true || r.proxy === 'yes' || d.anonymous === true, vpn = d.vpn === true || /vpn/i.test(String(r.type || ''));
  const soort = String(nw.type || r.type || '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 20) || 'onbekend';
  const asn = String(nw.asn || r.asn || '').replace(/^AS/i, '').replace(/\D/g, '').slice(0, 10);
  return { proxy, vpn, soort, asn, hosting: d.hosting === true || /hosting/.test(soort) };
}

export async function pxSteekproef(kv, { net, zone, ip, asn = '', D = dagUtc() }, haal = fetch) {
  const k = process.env.PROXYCHECK_KEY; if (!k || !ip || !zone || zone === '-') return null;
  const tk = 'mm:px:t:' + D, z = schoon(net) + '|' + schoon(zone);
  const [nz, nt] = await Promise.all([kv.raw(['HINCRBY', tk, z, 1]), kv.raw(['HINCRBY', tk, '*', 1])]);
  await kv.raw(['EXPIRE', tk, 3 * 86400]).catch(() => {});
  if (N(nz) > PX.perZone || N(nt) > PX.perDag) return { overgeslagen: true };
  const r = await haal('https://proxycheck.io/v3/' + encodeURIComponent(ip) + '?key=' + encodeURIComponent(k), { signal: AbortSignal.timeout(5000) });
  if (!r.ok) { await kv.raw(['HINCRBY', 'mm:px:fout:' + D, String(r.status), 1]).catch(() => {}); return { fout: r.status }; }
  await kv.raw(['HINCRBY', tk, 'checks', 1]).catch(() => {});
  const u = pxUit(await r.json().catch(() => ({})), ip); if (!u.asn && asn) u.asn = String(asn).replace(/\D/g, '');
  const hk = 'mm:px:' + D, cmd = [['HINCRBY', hk, z + '|n', 1], ['HINCRBY', hk, z + '|s_' + u.soort, 1]];
  if (u.proxy) cmd.push(['HINCRBY', hk, z + '|proxy', 1]); if (u.vpn) cmd.push(['HINCRBY', hk, z + '|vpn', 1]); if (u.hosting) cmd.push(['HINCRBY', hk, z + '|hosting', 1]);
  if (u.asn) cmd.push(['HINCRBY', 'mm:pxasn:' + D, u.asn, 1], ['HINCRBY', 'mm:pxasn:' + D, u.asn + '|proxy', u.proxy || u.vpn ? 1 : 0], ['EXPIRE', 'mm:pxasn:' + D, (PX.dagen + 2) * 86400]);
  cmd.push(['EXPIRE', hk, (PX.dagen + 2) * 86400]);
  for (const c of cmd) await kv.raw(c).catch(() => {});
  return u;
}

// per zone over de laatste dagen: aandeel proxy/VPN, soort verbinding, en een oordeel zodra er genoeg steekproeven zijn
export async function pxZones(kv = KV, dagen = 7) {
  const Z = {};
  for (let i = 0; i < dagen; i++) {
    const h = await kv.raw(['HGETALL', 'mm:px:' + dagUtc(Date.now() - i * 864e5)]).catch(() => null);
    for (const [f, v] of paren(h)) { const p = f.split('|'); if (p.length < 3) continue; const z = p[0] + '|' + p[1], x = Z[z] || (Z[z] = { net: p[0], zone: p[1], n: 0, proxy: 0, vpn: 0, hosting: 0, soort: {} }); const veld = p.slice(2).join('|');
      if (veld.startsWith('s_')) x.soort[veld.slice(2)] = N(x.soort[veld.slice(2)]) + N(v); else x[veld] = N(x[veld]) + N(v); }
  }
  return Object.values(Z).map(x => { const anon = Math.max(x.proxy, x.vpn) / Math.max(1, x.n); return { ...x, anoniem: Math.round(anon * 100) / 100, oordeel: x.n >= PX.minN ? (anon >= PX.grens ? 'proxy' : anon > 0 ? 'deels' : 'schoon') : 'te weinig' }; })
    .sort((a, b) => b.anoniem - a.anoniem || b.n - a.n);
}

// Cloudflare Radar: botaandeel per provider (ASN) over 7 dagen, voor de providers die in de steekproef het vaakst voorkwamen
export async function radarRonde(kv = KV, { max = 25 } = {}, haal = fetch) {
  const t = process.env.CLOUDFLARE_RADAR_TOKEN; if (!t) return { ok: false, fout: 'CLOUDFLARE_RADAR_TOKEN ontbreekt in Vercel' };
  const tel = {}; for (let i = 0; i < 7; i++) for (const [f, v] of paren(await kv.raw(['HGETALL', 'mm:pxasn:' + dagUtc(Date.now() - i * 864e5)]).catch(() => null))) if (!f.includes('|')) tel[f] = N(tel[f]) + N(v);
  const asns = Object.entries(tel).sort((a, b) => b[1] - a[1]).slice(0, max).map(x => x[0]);
  const uit = {}, fouten = [];
  for (const a of asns) {
    try {
      const r = await haal('https://api.cloudflare.com/client/v4/radar/http/summary/bot_class?asn=' + a + '&dateRange=7d', { headers: { authorization: 'Bearer ' + t }, signal: AbortSignal.timeout(8000) });
      const j = await r.json().catch(() => ({})); const s = j && j.result && (j.result.summary_0 || j.result.summary) || null;
      if (r.ok && s) uit[a] = { bot: Math.round(N(s.bot) * 10) / 10, mens: Math.round(N(s.human) * 10) / 10, n: tel[a] }; else fouten.push(a + ': HTTP ' + r.status);
    } catch (e) { fouten.push(a + ': ' + String(e && e.message || e).slice(0, 60)); }
  }
  await kv.set('mm:radar:asn', { t: new Date().toISOString(), asn: uit }, { ex: 14 * 86400 }).catch(() => {});
  return { ok: true, providers: Object.keys(uit).length, fouten: fouten.slice(0, 5) };
}

// stand van alle databronnen (ook de nog niet gekoppelde), voor Henkjan en het dashboard
export const BRONNEN = [
  { id: 'proxycheck', naam: 'proxycheck.io', wat: 'VPN en proxy per klik, steekproef per zone', prijs: 'gratis (1.000 per dag)', env: 'PROXYCHECK_KEY' },
  { id: 'radar', naam: 'Cloudflare Radar', wat: 'botaandeel per provider (ASN)', prijs: 'gratis', env: 'CLOUDFLARE_RADAR_TOKEN' },
  { id: 'clarity', naam: 'Microsoft Clarity', wat: 'heatmaps en opnames op een deel van de landingsbezoekers', prijs: 'gratis', env: 'CLARITY_TOKEN', later: 'na proxycheck en Radar aan Henkjan voorleggen' },
  { id: 'merchant', naam: 'Google Merchant Center (bestsellers)', wat: 'populairste producten per land en categorie, voor Kadoly en de keuzehulpen', prijs: 'gratis, Merchant Center-account nodig', env: 'GMC_ID', later: 'na proxycheck en Radar aan Henkjan voorleggen' },
  { id: 'ipinfo', naam: 'ipinfo Max', wat: 'proxy via gewone thuisaansluitingen', prijs: 'vanaf $78 per maand (jaarplan)', env: 'IPINFO_TOKEN', later: 'alleen als proxycheck veel anoniem verkeer laat zien' },
  { id: 'adplexity', naam: 'AdPlexity Push', wat: 'push- en pop-advertenties en landingspagina\'s van concurrenten', prijs: '$149 per maand', env: '', later: 'een maand als proef, op Henkjans woord' }
];
export async function bronnenStand(kv = KV) {
  const D = dagUtc(), t = paren(await kv.raw(['HGETALL', 'mm:px:t:' + D]).catch(() => null)), tot = N((t.find(x => x[0] === 'checks') || [])[1]);
  const fout = paren(await kv.raw(['HGETALL', 'mm:px:fout:' + D]).catch(() => null)), radar = await kv.get('mm:radar:asn').catch(() => null);
  return BRONNEN.map(b => {
    const aan = b.env ? !!process.env[b.env] : false;
    const st = { ...b, aan, stand: aan ? 'gekoppeld' : b.later ? 'later: ' + b.later : 'wacht op de sleutel in Vercel (' + b.env + ')' };
    if (b.id === 'proxycheck' && aan) st.vandaag = { checks: tot, fouten: Object.fromEntries(fout) };
    if (b.id === 'radar' && radar) { st.laatst = radar.t; st.providers = Object.keys(radar.asn || {}).length; }
    return st;
  });
}
export function bronnenTekst(st, zones = []) {
  const r = ['DATABRONNEN CLICKMIND (Henkjan 27 nov 2026: "Ja doen")', ''];
  for (const b of st) r.push((b.aan ? 'AAN   ' : 'UIT   ') + b.naam + ' · ' + b.wat + ' · ' + b.prijs, '      ' + b.stand + (b.vandaag ? ' · vandaag ' + b.vandaag.checks + ' checks' : '') + (b.laatst ? ' · laatst ' + b.laatst.slice(0, 16) + ', ' + b.providers + ' providers' : ''));
  const z = zones.filter(x => x.oordeel !== 'te weinig').slice(0, 15);
  if (z.length) { r.push('', 'ZONES MET DE MEESTE PROXY/VPN (7 dagen, steekproef):'); for (const x of z) r.push('- ' + x.net + ' ' + x.zone + ': ' + Math.round(x.anoniem * 100) + '% anoniem van ' + x.n + ' (' + x.oordeel + ')'); }
  return r.join('\n');
}
