// GET  /api/hjdk/config            -> huidige config (JSON)
// POST /api/hjdk/config            -> config vervangen; header x-hjdk-token moet gelijk zijn aan env HJDK_TOKEN
import { kv } from '../../lib/db.js';
const DEFAULT = {}; // leeg = engine gebruikt ingebouwde teksten
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') {
    let cfg = DEFAULT;
    try { cfg = (await kv.get('hjdk:config')) || DEFAULT; } catch (e) {}
    return res.status(200).json(cfg);
  }
  if (req.method === 'POST') {
    if (!process.env.HJDK_TOKEN || req.headers['x-hjdk-token'] !== process.env.HJDK_TOKEN) return res.status(401).json({ error: 'unauthorized' });
    const body = typeof req.body === 'object' && req.body ? req.body : {};
    await kv.set('hjdk:config', body);
    return res.status(200).json({ ok: true });
  }
  res.status(405).end();
}
