// Droppery-brug voor Kadoly (lib/droppery.js). Routes:
//   https://gids.kadoly.com/wp-json/...            WooCommerce-REST voor Droppery (consumer key/secret)
//   /api/dp?op=sleutels                            consumer key en secret tonen (alleen beschermde vercel.app-host, voor Henkjan)
//   /api/dp?op=stand | op=log                      stand en logboek van Droppery-aanroepen (beschermde host)
//   /api/dp?op=feed                                producten voor de Kadoly-shop (header X-Lus-Key = SHOP_FEED_KEY, of beschermde host)
//   POST /api/dp?op=order                          betaalde Kadoly-order met Droppery-producten (X-Lus-Key)
//   /api/dp?op=status&order=<kadoly-order-id>      status en track-and-trace terug (X-Lus-Key)
import { wcRoute, dpSleutels, dpStand, dpLog, dpFeed, dpNieuweOrder, dpOrderStatus, DP_HOST } from '../lib/droppery.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async function handler(req, res) {
  const url = new URL(req.url, 'https://x'); const q = url.searchParams;
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0];
  const beschermd = /\.vercel\.app$/i.test(host);
  const lus = !!process.env.SHOP_FEED_KEY && String(req.headers['x-lus-key'] || '') === process.env.SHOP_FEED_KEY;
  res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
  try {
    if (q.has('wc')) return await wcRoute(req, res, q.get('wc') || '', q);
    const op = q.get('op') || '';
    if (op === 'sleutels') {
      if (!beschermd) return res.status(404).send('Niet gevonden');
      const k = await dpSleutels(true); res.setHeader('content-type', 'text/html; charset=utf-8');
      return res.status(200).send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Droppery-koppeling Kadoly</title><body style="font:16px/1.5 system-ui;max-width:640px;margin:32px auto;padding:0 16px"><h1 style="font-size:24px">Droppery koppelen aan Kadoly</h1><p>Zet in Droppery onder <b>Settings, Base information</b> de Store URL op <code>${esc(DP_HOST)}</code> (webshop type WooCommerce). Zet daarna onder <b>Settings, API credentials</b>:</p><p>Consumer key<br><input readonly style="width:100%;font:14px monospace;padding:8px" value="${esc(k.key)}" onclick="this.select()"></p><p>Consumer secret<br><input readonly style="width:100%;font:14px monospace;padding:8px" value="${esc(k.secret)}" onclick="this.select()"></p><p>Druk op Submit. Deze pagina staat alleen achter de Vercel-inlog; deel de waarden niet.</p></body>`);
    }
    if (op === 'stand') { if (!beschermd) return res.status(404).send('Niet gevonden'); return res.status(200).json(await dpStand()); }
    if (op === 'log') { if (!beschermd) return res.status(404).send('Niet gevonden'); return res.status(200).json(await dpLog(Number(q.get('n')) || 100)); }
    if (op === 'feed') { if (!beschermd && !lus) return res.status(401).json({ ok: false, fout: 'X-Lus-Key ontbreekt' }); return res.status(200).json(await dpFeed()); }
    if (op === 'order') {
      if (!lus) return res.status(401).json({ ok: false, fout: 'X-Lus-Key ontbreekt' });
      if (req.method !== 'POST') return res.status(405).json({ ok: false, fout: 'POST' });
      const b = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
      const r = await dpNieuweOrder(b); return res.status(r.ok ? 200 : 400).json(r);
    }
    if (op === 'status') { if (!lus && !beschermd) return res.status(401).json({ ok: false, fout: 'X-Lus-Key ontbreekt' }); return res.status(200).json(await dpOrderStatus(q.get('order'))); }
    return res.status(404).json({ ok: false, fout: 'onbekend' });
  } catch (e) { return res.status(500).json({ ok: false, fout: String(e.message || e).slice(0, 200) }); }
}
