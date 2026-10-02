// Tellers. Werkt met deze URL-vormen (via rewrite in vercel.json):
//   GET /api/hjdk/stats/hit/{key}          -> +1, {value}
//   GET /api/hjdk/stats/add/{key}?n=123    -> +n (1..100000), {value}
//   GET /api/hjdk/stats/get/{key}          -> {value} (0 als onbekend)
//   GET /api/hjdk/stats/list?prefix=hjdk6- -> { key: value, ... }
//   POST /api/hjdk/stats/many  body {keys:[..]}          -> { key: value } (één verzoek voor alle tellers)
//   POST /api/hjdk/stats/hits  body {hits:[[key,n],..]}   -> tellers ophogen in één verzoek
// Het pad wordt uit req.url gelezen, dus de bestandsnaam maakt niet uit.
import { kv } from '../../lib/db.js';
const OK = /^[a-z0-9\-]{1,120}$/;
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  const url = new URL(req.url, 'http://x');
  let rest = url.searchParams.get('p') || url.pathname.replace(/^\/api\/hjdk\/stats\/?/, '');
  const parts = rest.split('/').filter(Boolean);
  const op = parts[0], key = parts[1] || url.searchParams.get('key');
  // body (POST als text/plain of json): {keys:[...]} of {hits:[[key,n],...]}
  let body = null; try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body && typeof req.body === 'object' ? req.body : null); } catch (e) { body = null; }
  const keyList = (arr) => (Array.isArray(arr) ? arr : String(arr || '').split(',')).map(k => String(k).trim()).filter(k => OK.test(k)).slice(0, 400);
  try {
    // many: alle gevraagde tellers in ÉÉN verzoek -> { key: value }
    if (op === 'many') { const keys = keyList((body && body.keys) || url.searchParams.get('keys')); const out = {}; if (keys.length) { const vals = await kv.mget(...keys.map(k => 'c:' + k)); keys.forEach((k, i) => { out[k] = Number(vals[i]) || 0; }); } return res.status(200).json(out); }
    // hits: meerdere tellers ophogen in ÉÉN verzoek: hits=[[key,n],...] of keys=a,b,c (elk +1)
    if (op === 'hits') { let pairs = []; if (body && Array.isArray(body.hits)) pairs = body.hits.map(h => Array.isArray(h) ? [String(h[0]), Math.round(Number(h[1]) || 1)] : [String(h), 1]); else pairs = keyList((body && body.keys) || url.searchParams.get('keys')).map(k => [k, 1]);
      pairs = pairs.filter(([k, n]) => OK.test(k) && n >= 1 && n <= 100000).slice(0, 400); if (pairs.length) await kv.incrMany(pairs.map(([k, n]) => ['c:' + k, n])); return res.status(200).json({ ok: true, n: pairs.length }); }
    if (op === 'hit' && OK.test(key || '')) { const v = await kv.incr('c:' + key); return res.status(200).json({ value: v }); }
    if (op === 'add' && OK.test(key || '')) { const n = Math.min(100000, Math.max(1, Math.round(Number(url.searchParams.get('n')) || 0))); const v = await kv.incrBy('c:' + key, n); return res.status(200).json({ value: v }); }
    if (op === 'get' && OK.test(key || '')) { const v = await kv.get('c:' + key); return res.status(200).json({ value: Number(v) || 0 }); }
    if (op === 'list') {
      const prefix = 'c:' + String(url.searchParams.get('prefix') || 'hjdk6-'); const out = {}; let cursor = 0;
      do { const r = await kv.scan(cursor, { match: prefix + '*', count: 500 }); cursor = Number(r[0]); const keys = r[1] || [];
           if (keys.length) { const vals = await kv.mget(...keys); keys.forEach((k, i) => { out[k.slice(2)] = Number(vals[i]) || 0; }); } } while (cursor !== 0);
      return res.status(200).json(out);
    }
    return res.status(400).json({ error: 'bad request', op: op || null });
  } catch (e) { return res.status(500).json({ error: 'storage', detail: String(e && e.message || e) }); }
}
