// Echte kadoly.com-look voor Samen sparen, de clubpagina's en het clubdashboard op gids.kadoly.com
// (Henkjan 23 nov 2026: "Nu in echte kadoly look laten zien").
// Kop, voet, stylesheets en stijlblokken komen van kadoly.com zelf, met dezelfde helpers als het Shopify-thema (lib/shoptheme.js).
// Bewaard in kv (kd:look) en 12 uur in het geheugen; lukt ophalen niet, dan de laatste goede versie, en anders de gidsschil (fn/gids.js kaalKd).
// kdBron: alleen op de beschermde host, haalt een bestand van kadoly.com of cdn.kadoly.com door (voor de schermafdrukken in de chat).
import { kv } from './db.js';
import { UA, haal, blok, absoluut, stijlen, koplinks, bodyKlasse } from './shoptheme.js';

const KD = 'https://kadoly.com';
const KEY = 'kd:look', TTL = 12 * 3600e3;
let mem = null;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

async function maak() {
  const h = await haal('/shop/wonen');
  let kop = blok(h, '<header class="ypn', 'header');
  const voet = blok(h, '<footer class="footer', 'footer');
  if (!kop || !voet) throw new Error('kop of voet niet gevonden op kadoly.com');
  const na = h.slice(h.indexOf(kop) + kop.length).match(/^(\s*(<style[\s\S]*?<\/style>|<script>[\s\S]*?<\/script>))*/);
  kop = absoluut(kop + (na ? na[0] : ''))
    .replace(/'\/shop\/api\/shop'/g, "'" + KD + "/shop/api/shop'")
    .replace(/(['"])\/product\//g, '$1' + KD + '/product/');
  const terug = s => s.replace(/href="\/cart"/g, 'href="' + KD + '/cart"'); // absoluut zet de winkelwagen op /cart voor Shopify; hier blijft hij op kadoly.com
  return { t: Date.now(), links: koplinks(h), css: stijlen(h), kop: terug(kop), voet: terug(absoluut(voet)), body: bodyKlasse(h) };
}

export async function kadolyKit() {
  if (mem && Date.now() - mem.t < TTL) return mem;
  let k = null;
  try { k = await kv.get(KEY); } catch (e) {}
  if (k && k.kop && Date.now() - k.t < TTL) return (mem = k);
  try { const n = await maak(); await kv.set(KEY, n).catch(() => {}); return (mem = n); }
  catch (e) { if (k && k.kop) return (mem = k); throw e; }
}

// eigen stijl alleen binnen .kd-main: zelfde inkt en lijnen als kadoly.com, één tekstmaat, geen grijs
const EIGEN = `.kd-main{max-width:560px;margin:0 auto;padding:28px 18px 16px;color:#111827;font-size:16px;line-height:1.55}
.kd-main h1{font-size:30px;line-height:1.15;letter-spacing:-.02em;font-weight:700;margin:0 0 12px;text-wrap:balance;color:#111827}
.kd-main h2{font-size:20px;line-height:1.25;font-weight:700;margin:28px 0 8px;color:#111827}
.kd-main p{margin:0 0 12px}.kd-main a{color:#111827}.kd-main b,.kd-main strong{font-weight:700}
.kd-main .btn,.kd-main form button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:50px;padding:12px 24px;border-radius:999px;border:1.5px solid #111827;background:#fff;color:#111827;font:inherit;font-size:16px;font-weight:700;line-height:1.2;text-decoration:none;cursor:pointer;text-align:center}
.kd-main .btn.knop,.kd-main form button:not(.btn){background:#111827;color:#fff}
.kd-main input[type=text],.kd-main input[type=email]{width:100%;min-height:50px;border:1.5px solid #111827;border-radius:12px;padding:10px 14px;font:inherit;font-size:16px;background:#fff;color:#111827;box-sizing:border-box}
.kd-main details summary{cursor:pointer}.kd-main table{border-collapse:collapse;width:100%;table-layout:fixed}.kd-main td,.kd-main th{border-bottom:1px solid #E6E8EB;padding:10px 6px;text-align:left;vertical-align:top;overflow-wrap:anywhere}
.kd-main .kicker{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin:0 0 8px}`;

export function kadolySchil(kit, titel, inhoud, script) {
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titel)} | Kadoly</title><meta name="robots" content="noindex">
${kit.links}<style>${kit.css}</style><style>${EIGEN}</style></head><body class="${esc(kit.body)} kd-gids">${kit.kop}<main class="kd-main">${inhoud}</main>${kit.voet}${script || ''}</body></html>`;
}

export async function kdBron({ res, q, host }) {
  if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
  const u = String(q.u || '');
  if (!/^https:\/\/(cdn\.)?kadoly\.com\//.test(u)) return res.status(400).send('alleen kadoly.com');
  const r = await fetch(u, { headers: UA, signal: AbortSignal.timeout(20000) });
  res.setHeader('content-type', r.headers.get('content-type') || 'application/octet-stream');
  res.setHeader('cache-control', 'no-store');
  return res.status(r.status).send(Buffer.from(await r.arrayBuffer()));
}
