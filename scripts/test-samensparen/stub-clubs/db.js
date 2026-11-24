const M = new Map(), T = new Map();
const g = k => M.get(k);
export const kv = {
  M,
  async get(k) { const v = g(k); if (v == null) return null; if (typeof v !== 'string') return null; try { return JSON.parse(v); } catch (e) { return v; } },
  async set(k, v) { M.set(k, typeof v === 'string' ? v : JSON.stringify(v)); return 'OK'; },
  async incr(k) { const n = Number(g(k) || 0) + 1; M.set(k, String(n)); return n; },
  async del(keys) { let n = 0; for (const k of keys) if (M.delete(k)) n++; return n; },
  async scan(cur, o) { const re = new RegExp('^' + o.match.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'); return ['0', [...M.keys()].filter(k => re.test(k))]; },
  async raw(a) { a = a.map(String); const [cmd, k] = a; const set = () => { let s = g(k); if (!(s instanceof Set)) { s = new Set(); M.set(k, s); } return s; };
    switch (cmd) {
      case 'SET': { if (a.includes('NX') && M.has(k)) return null; M.set(k, a[2]); return 'OK'; }
      case 'SADD': { const s = set(); let n = 0; for (const x of a.slice(2)) if (!s.has(x)) { s.add(x); n++; } return n; }
      case 'SREM': { const s = set(); let n = 0; for (const x of a.slice(2)) if (s.delete(x)) n++; return n; }
      case 'RPUSH': { let l = g(k); if (!Array.isArray(l)) { l = []; M.set(k, l); } l.push(...a.slice(2)); return l.length; }
      case 'LRANGE': { const l = g(k); if (!Array.isArray(l)) return []; let s = Number(a[2]), e = Number(a[3]); if (s < 0) s = Math.max(0, l.length + s); if (e < 0) e = l.length + e; return l.slice(s, e + 1); }
      case 'SMEMBERS': { const s = g(k); return s instanceof Set ? [...s] : []; }
      case 'SCARD': { const s = g(k); return s instanceof Set ? s.size : 0; }
      case 'EXPIRE': return 1;
      case 'HINCRBY': { let h = g(k); if (!(h instanceof Map)) { h = new Map(); M.set(k, h); } h.set(a[2], (h.get(a[2]) || 0) + Number(a[3])); return h.get(a[2]); }
      case 'HSET': { let h = g(k); if (!(h instanceof Map)) { h = new Map(); M.set(k, h); } for (let i = 2; i + 1 < a.length; i += 2) h.set(a[i], a[i + 1]); return 1; }
      case 'HLEN': { const h = g(k); return h instanceof Map ? h.size : 0; }
      case 'LLEN': { const l = g(k); return Array.isArray(l) ? l.length : 0; }
      case 'LPOP': { const l = g(k); return Array.isArray(l) && l.length ? l.shift() : null; }
      case 'LPUSH': { let l = g(k); if (!Array.isArray(l)) { l = []; M.set(k, l); } l.unshift(...a.slice(2)); return l.length; }
      case 'SISMEMBER': { const s = g(k); return s instanceof Set && s.has(a[2]) ? 1 : 0; }
      case 'HSETNX': { let h = g(k); if (!(h instanceof Map)) { h = new Map(); M.set(k, h); } if (h.has(a[2])) return 0; h.set(a[2], a[3]); return 1; }
      case 'HGET': { const h = g(k); return h instanceof Map && h.has(a[2]) ? String(h.get(a[2])) : null; }
      case 'LTRIM': return 'OK';
      case 'GET': { const v = g(k); return v == null ? null : (typeof v === 'string' ? v : JSON.stringify(v)); }
      case 'DEL': { M.delete(k); return 1; }
      case 'HGETALL': { const h = g(k); return h instanceof Map ? [...h].flat().map(String) : []; }
    } throw Error('raw ' + cmd); }
};
