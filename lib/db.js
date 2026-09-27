// Kleine Redis-laag (Vercel Redis, env KV_REDIS_URL). Zelfde functies als @vercel/kv: get/set/incr/scan/mget.
import { createClient } from 'redis';
let clientP = null;
async function client() {
  if (!clientP) {
    const url = process.env.KV_REDIS_URL || process.env.REDIS_URL;
    if (!url) throw new Error('KV_REDIS_URL ontbreekt');
    const c = createClient({ url, socket: { connectTimeout: 5000 } });
    c.on('error', () => {});
    clientP = c.connect().then(() => c).catch(e => { clientP = null; throw e; });
  }
  return clientP;
}
export const kv = {
  async get(k) { const c = await client(); const v = await c.get(k); if (v === null || v === undefined) return null; try { return JSON.parse(v); } catch (e) { return v; } },
  async set(k, v, opts) { const c = await client(); const ttl = opts && opts.ex; await c.set(k, typeof v === 'string' ? v : JSON.stringify(v), ttl ? { EX: Math.round(ttl) } : undefined); return 'OK'; },
  async incr(k) { const c = await client(); return c.incr(k); },
  async incrBy(k, n) { const c = await client(); return c.incrBy(k, Math.round(Number(n) || 0)); },
  // veel tellers in één rondje (pipeline): pairs = [[key, n], ...]
  async incrMany(pairs) { const c = await client(); if (!pairs.length) return []; const m = c.multi(); for (const [k, n] of pairs) { if (n === 1) m.incr(k); else m.incrBy(k, n); } return m.exec(); },
  async mget(...keys) { const c = await client(); if (!keys.length) return []; const vals = await c.mGet(keys); return vals.map(v => { if (v === null) return null; try { return JSON.parse(v); } catch (e) { return v; } }); },
  async scan(cursor, opts) { const c = await client(); const r = await c.scan(String(cursor || 0), { MATCH: opts && opts.match || '*', COUNT: opts && opts.count || 500 }); return [String(r.cursor), r.keys]; }
};
