// Amazon PA-API voor de brug en de engine (via rewrite /api/amz/:op):
//   GET /api/amz/check              -> werken de sleutels? (nooit de waarden zelf)
//   GET /api/amz/pick?q=<zoekterm>  -> één passend product (24u cache): {ok, product:{asin,title,url,image,price,priceText,strike,prime}, at}
//   GET /api/amz/search?q=..&n=6    -> productlijst (20 min cache)
import { kv } from '../lib/db.js';
import { getAmzCreds, amzSearchCached } from '../lib/amz.js';

const clean = s => String(s || '').replace(/\s+/g, ' ').trim();

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  res.setHeader('cache-control', 'no-store');
  const url = new URL(req.url, 'http://x');
  const op = url.searchParams.get('op') || url.pathname.replace(/^\/api\/amz\/?/, '').split('/')[0];
  try {
    if (op === 'check') {
      const c = await getAmzCreds(); if (!c) return res.status(200).json({ amazon: 'geen sleutels (zet ze via /setup)' });
      try { const r = await amzSearchCached('afvalemmer', { count: 1 }); const p = r.products[0]; return res.status(200).json({ amazon: 'OK (bron: ' + c.from + ', ' + c.market + ')', proef: p ? p.title.slice(0, 60) + (p.priceText ? ' ' + p.priceText : '') : 'geen resultaat' }); } catch (e) { return res.status(200).json({ amazon: 'FOUT: ' + String(e && e.message || e).slice(0, 200), bron: c.from, markt: c.market }); }
    }
    if (op === 'pick') {
      const q = clean(url.searchParams.get('q') || '').slice(0, 120).toLowerCase(); if (!q) return res.status(400).json({ ok: false, error: 'q ontbreekt' });
      const key = 'hjdk:amzpick:' + q.slice(0, 80);
      try { const c = await kv.get(key); if (c && c.at && Date.now() - c.at < 24 * 3600 * 1000) return res.status(200).json({ ok: !!c.product, product: c.product || null, at: c.at, cached: true }); } catch (e) {}
      let product = null, error = '', at = Date.now();
      try { const r = await amzSearchCached(q, { count: 6 }); at = r.at; const cands = r.products.filter(p => p.price != null && p.image); product = cands[0] || r.products[0] || null; } catch (e) { error = String(e && e.message || e).slice(0, 160); }
      if (!error) { try { await kv.set(key, { at, product }); } catch (e) {} }
      return res.status(200).json({ ok: !!product, product, at, error: error || undefined });
    }
    if (op === 'search') {
      const q = clean(url.searchParams.get('q') || '').slice(0, 120); if (!q) return res.status(400).json({ ok: false, error: 'q ontbreekt' });
      const r = await amzSearchCached(q, { count: Math.max(1, Math.min(10, Number(url.searchParams.get('n')) || 6)) });
      return res.status(200).json({ ok: true, products: r.products, total: r.total, at: r.at, market: r.market });
    }
    return res.status(400).json({ error: 'bad op', op });
  } catch (e) { return res.status(500).json({ ok: false, error: String(e && e.message || e).slice(0, 200) }); }
}
