// CLICKMIND ZONE SCORE: openbare productpagina en zone-check (lib/zonescore.js; Henkjan 13 nov 2026, punt 7 "Clickmind als product verkopen").
//   https://whichtobuy.best/zone-score                    pagina (rewrite in vercel.json naar /api/zonescore?op=pagina)
//   GET  /api/zonescore?net=propeller&zone=123           zone-check als JSON (&vorm=html: ook het kaartje voor de pagina); 30 per uur per IP
//   POST /api/zonescore?op=wacht {email,nets,spend}      wachtlijst voor de volledige lijsten (5 per uur per IP), meldt Henkjan via todayin-spel /api/meld
//   POST /api/zonescore?op=ev                            gedrag op de pagina (tijd zichtbaar, scroll, kliks), zonder cookies
//   GET  /api/zonescore?op=bewijs                        de afgeronde live cijfers die op de pagina staan
//   Beschermd (*.vercel.app): ?op=stand, ?op=wachtlijst, ?op=wachtweg&email=, ?op=wacht via GET (testen)
import { kv } from '../lib/db.js';
import { check, leesInvoer, limiet, tel, bewijs, wacht, wachtlijst, wachtWeg, ev, stand, pagina, kaartHtml, bronVanRef } from '../lib/zonescore.js';

const BOT = /bot\b|bot\/|crawler|spider|slurp|curl\/|wget|python|headless|lighthouse|preview|fetch|monitor/i;
const beschermd = req => /\.vercel\.app$/i.test(String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]) && /\.vercel\.app$/i.test(String(req.headers.host || '').split(':')[0]);
function leesJson(b) { if (!b) return null; if (typeof b === 'object' && !Buffer.isBuffer(b)) return b; try { return JSON.parse(String(b)); } catch (x) { return null; } }

export default async function handler(req, res) {
  const url = new URL(req.url, 'https://x'), q = k => url.searchParams.get(k), op = q('op') || '';
  const h = k => String(Array.isArray(req.headers[k]) ? req.headers[k][0] : (req.headers[k] || ''));
  const ip = (h('x-forwarded-for') || h('x-real-ip')).split(',')[0].trim(), land = h('x-vercel-ip-country'), ua = h('user-agent');
  if (req.method === 'OPTIONS') return res.status(204).end();
  res.setHeader('cache-control', 'no-store');
  try {
    if (op === 'ev') { if (req.method !== 'POST' || BOT.test(ua)) return res.status(204).end(); await ev(kv, leesJson(req.body)); return res.status(204).end(); }
    if (op === 'wacht') {
      const viaGet = req.method !== 'POST';
      if (viaGet && !beschermd(req)) return res.status(405).json({ ok: false, fout: 'POST only' });
      const rl = await limiet(kv, ip, 'w', 5);
      if (!rl.ok) return res.status(429).json({ ok: false, fout: 'Too many sign-ups from your connection. Try again later.' });
      const b = viaGet ? { email: q('email'), nets: q('nets'), spend: q('spend'), zone: q('zone') } : leesJson(req.body);
      const r = await wacht(kv, b, { land, bron: bronVanRef(h('referer')) });
      return res.status(r.ok ? 200 : 400).json(r);
    }
    if (op === 'bewijs') return res.status(200).json(await bewijs(kv));
    if (op === 'stand' || op === 'wachtlijst' || op === 'wachtweg') {
      if (!beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen op de beschermde host' });
      if (op === 'stand') return res.status(200).json(await stand(kv));
      if (op === 'wachtlijst') return res.status(200).json({ ok: true, aanmeldingen: await wachtlijst(kv) });
      return res.status(200).json(await wachtWeg(kv, q('email')));
    }
    const zoneQ = q('zone');
    // zone-check als JSON
    if (op !== 'pagina' && zoneQ != null && zoneQ !== '') {
      const inv = leesInvoer(q('net') || 'propeller', zoneQ);
      if (inv.fout) return res.status(400).json({ ok: false, fout: inv.fout });
      const rl = await limiet(kv, ip, 'c');
      if (!rl.ok) { await tel(kv, { check_rl: 1 }); res.setHeader('retry-after', String(rl.wacht)); return res.status(429).json({ ok: false, fout: 'You reached 30 checks this hour. Try again in ' + Math.max(1, Math.ceil(rl.wacht / 60)) + ' minutes, or get the full lists.', retryAfterSeconds: rl.wacht }); }
      const r = await check(kv, { ...inv, land });
      if (q('vorm') === 'html') r.html = kaartHtml(r);
      if (rl.over != null) res.setHeader('x-checks-left', String(rl.over));
      return res.status(200).json(r);
    }
    // pagina (met uitslag als ?net=&zone= in de URL staat, dan telt hij mee voor de limiet)
    let uitslag = null, net = 'propeller', zone = '';
    if (zoneQ) {
      const inv = leesInvoer(q('net') || 'propeller', zoneQ);
      if (inv.fout) uitslag = { ok: false, fout: inv.fout };
      else { net = inv.net; zone = inv.zone; const rl = await limiet(kv, ip, 'c'); uitslag = rl.ok ? await check(kv, { ...inv, land }) : { ok: false, fout: 'You reached 30 checks this hour. Try again later, or get the full lists below.' }; }
    } else if (q('net')) { const inv = leesInvoer(q('net'), '0'); if (!inv.fout) net = inv.net; }
    const bew = await bewijs(kv).catch(() => null);
    if (!BOT.test(ua)) await tel(kv, { view: 1, ['view_' + bronVanRef(h('referer'))]: 1 });
    res.setHeader('content-type', 'text/html; charset=utf-8');
    return res.status(200).send(pagina({ bew, uitslag, net, zone }));
  } catch (x) {
    return res.status(500).json({ ok: false, fout: 'Something went wrong. Try again.' });
  }
}
