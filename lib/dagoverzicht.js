// Dagelijks overzicht keuzehulpen voor Henkjan (21 okt: "meet ook hoe vaak gedeeld ... en in een dagelijks overzicht voor mij").
// Eén bericht per dag via Telegram (doorgeefluik MELD_SLEUTEL, anders eigen bot), rond 08:00 Curaçao, over gisteren (UTC-dag),
// met de dag ervoor ernaast. Live: /api/keuze-updates?op=overzicht (&dag=YYYY-MM-DD).
import { kv } from './db.js';
import { BRONNEN } from './kleur.js';

async function som(match, per) {
  let cur = '0', n = 0; const uit = {};
  do { const [c, keys] = await kv.scan(cur, { match, count: 1000 }); cur = String(c); if (keys.length) { const vals = await kv.mget(...keys); keys.forEach((k, i) => { const g = per(k); if (g) uit[g] = (uit[g] || 0) + (Number(vals[i]) || 0); }); } n++; } while (cur !== '0' && n < 600);
  return uit;
}
export async function dagCijfers(d) {
  const d8 = d.replace(/-/g, '');
  const sites = { kz: 'keuzehulp.best', wtbus: 'whichtobuy.best', wtbde: 'kaufberater.best' }; const out = { dag: d, sites: {}, cur: {}, deel: {}, aanmeld: {} };
  for (const [p, host] of Object.entries(sites)) {
    // rechtstreeks per bron lezen (geen scan: de scan over de hele database liep voortijdig af en gaf 0, 29 okt)
    const vals = await kv.mget(...BRONNEN.map(b => 'c:' + p + '-hv-' + d + '-' + b), ...BRONNEN.map(b => 'c:' + p + '-hcs-' + d + '-' + b));
    const v = {}; let klik = 0; BRONNEN.forEach((b, i) => { const n = Number(vals[i]) || 0; if (n) v[b] = n; klik += Number(vals[BRONNEN.length + i]) || 0; });
    out.sites[host] = { bezoek: Object.values(v).reduce((a, b) => a + b, 0), perBron: v, winkelklik: klik };
  }
  out.cur = await som('cur:h:' + d + ':*', k => { const kk = k.split(':').slice(5).join(':'); return kk.startsWith('view-') ? 'bezoek' : kk.startsWith('out-') ? 'klik' : kk.startsWith('deel-') ? 'gedeeld' : kk === 'deelopen' ? 'geopend' : null; });
  out.deel = await som('c:deel-*-' + d8 + '-*', k => { const x = k.slice(2).split('-'); return x[1] + '-' + x[3]; });
  for (const s of ['kz', 'us', 'de']) { const [w, b] = await kv.mget('updates:vd:' + d + ':' + s + ':win', 'updates:vd:' + d + ':' + s + ':confirmed'); out.aanmeld[s] = { aangemeld: Number(w) || 0, bevestigd: Number(b) || 0 }; }
  return out;
}
const fmt = (a, b) => a + (b === undefined ? '' : ' (' + (a - b >= 0 ? '+' : '') + (a - b) + ')');
export async function overzichtTekst(d) {
  const dv = new Date(Date.parse(d + 'T12:00:00Z') - 864e5).toISOString().slice(0, 10);
  const [x, y] = await Promise.all([dagCijfers(d), dagCijfers(dv)]);
  const gedeeld = o => Object.entries(o.deel).filter(([k]) => k.endsWith('-tik')).reduce((a, [, v]) => a + v, 0), geopend = o => Object.entries(o.deel).filter(([k]) => k.endsWith('-open')).reduce((a, [, v]) => a + v, 0);
  const r = ['Keuzehulpen ' + d + ' (tussen haakjes: verschil met de dag ervoor)'];
  for (const h of Object.keys(x.sites)) { const a = x.sites[h], b = y.sites[h]; const bron = Object.entries(a.perBron).sort((p, q) => q[1] - p[1]).slice(0, 3).map(([k, v]) => k + ' ' + v).join(', '); r.push(h + ': ' + fmt(a.bezoek, b.bezoek) + ' bezoeken, ' + fmt(a.winkelklik, b.winkelklik) + ' naar de winkel' + (bron ? ' (' + bron + ')' : '')); }
  r.push('Curaçao: ' + fmt(x.cur.bezoek || 0, y.cur.bezoek || 0) + ' bezoeken, ' + fmt(x.cur.klik || 0, y.cur.klik || 0) + ' doorgeklikt naar een aanbieder');
  r.push('Gedeeld: ' + fmt(gedeeld(x), gedeeld(y)) + ' keer, ' + fmt(geopend(x), geopend(y)) + ' keer geopend door wie de link kreeg');
  const am = o => Object.values(o.aanmeld).reduce((a, v) => a + v.aangemeld, 0), bv = o => Object.values(o.aanmeld).reduce((a, v) => a + v.bevestigd, 0);
  r.push('Aanmeldingen (mail of meldingen): ' + fmt(am(x), am(y)) + ', mail bevestigd: ' + fmt(bv(x), bv(y)));
  r.push('Details: https://keuzehulp.best/api/keuze-updates?op=overzicht&dag=' + d);
  return { tekst: r.join('\n'), x, y };
}
async function telegram(tekst) {
  const s = process.env.MELD_SLEUTEL;
  if (s) { try { const r = await fetch((process.env.MELD_URL || 'https://spel.todayin.email') + '/api/meld', { method: 'POST', headers: { 'content-type': 'application/json', 'x-meld-sleutel': s }, body: JSON.stringify({ bron: 'Keuzehulpen', tekst: tekst.slice(0, 3800) }), signal: AbortSignal.timeout(8000) }); if (r.ok) return true; } catch {} }
  const tok = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID; if (!tok || !chat) return false;
  try { const r = await fetch('https://api.telegram.org/bot' + tok + '/sendMessage', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text: tekst.slice(0, 3900), disable_web_page_preview: true }), signal: AbortSignal.timeout(8000) }); return r.ok; } catch { return false; }
}
// aanroepen vanuit de kwartierplanning: verstuurt hooguit één keer per dag, vanaf 12:00 UTC (08:00 Curaçao)
export async function dagelijksOverzicht() {
  const nu = new Date(); if (nu.getUTCHours() < 12) return { wacht: true };
  const vandaag = nu.toISOString().slice(0, 10), gisteren = new Date(nu - 864e5).toISOString().slice(0, 10);
  const k = 'overzicht:verstuurd:' + vandaag; let nieuw = null; try { nieuw = await kv.raw(['SET', k, '1', 'NX', 'EX', String(3 * 86400)]); } catch {}
  if (!nieuw) return { al: true };
  const { tekst } = await overzichtTekst(gisteren); const ok = await telegram(tekst);
  if (!ok) { try { await kv.del(k); } catch {} }
  try { await kv.set('overzicht:laatste', { at: Date.now(), dag: gisteren, ok, tekst }, { ex: 30 * 86400 }); } catch {}
  return { verstuurd: ok, dag: gisteren };
}
