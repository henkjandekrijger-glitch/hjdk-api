import { keuzeMeting, PROJECTS } from '../lib/keuze-leerlus.js';
export default async function handler(req, res) {
  res.setHeader('cache-control','no-store'); res.setHeader('x-robots-tag','noindex');
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).json({ fout: 'GET nodig' });
  const site = new URL(req.url,'https://keuzehulp.best').searchParams.get('site') || 'kz';
  if (!PROJECTS[site]) return res.status(400).json({ fout: 'site moet kz, us of de zijn' });
  try { return res.status(200).json(await keuzeMeting(site)); }
  catch { return res.status(503).json({ fout: 'meting niet beschikbaar; niet als nulmeting gebruiken' }); }
}
