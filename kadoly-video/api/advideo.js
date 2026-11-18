// Advertentievideo op bestelling (18 nov 2026, Henkjan: "Maak de ads en vindt uit wat verkoopt ... werken met je creatives en CTA").
// Zelfde opmaak als de nachtvideo's (lib/render.js), maar voor één product of één set, met eigen tekstregels en een eigen id.
// Gaat naar Vercel Blob onder kadoly/ad/<id>.mp4 (openbaar, zodat TikTok hem per URL kan ophalen); komt niet in de social-wachtrij.
// Aanroep alleen via een beschermde deployment-URL: /api/advideo?id=deken_kleur_a&p=pid1,pid2,pid3&r=regel 1|regel 2|regel 3
// Eén product met één foto: geef de pid drie keer (p=pid,pid,pid), dan wisselen alleen de tekstregels.
import ffmpeg from 'ffmpeg-static';
import { put } from '@vercel/blob';
import { maakVideo } from '../lib/render.js';

const foto = id => 'https://keuzehulp.best/api/shop?op=img&t=ig&p=' + id;

export default async function handler(req, res) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0];
  if (/^kadoly-video(-henq)?\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
  const url = new URL(req.url, 'https://x');
  const id = String(url.searchParams.get('id') || '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 40);
  const pids = String(url.searchParams.get('p') || '').split(',').map(x => x.trim()).filter(x => /^oc_\d{6,30}$/.test(x)).slice(0, 4);
  const regels = String(url.searchParams.get('r') || '').split('|').map(x => x.trim()).filter(Boolean).slice(0, 4);
  if (!id || !pids.length || !regels.length) return res.status(400).json({ ok: false, fout: 'id, p (pids) en r (regels met |) zijn nodig' });
  while (regels.length < pids.length) regels.push(regels[regels.length - 1]);
  const t0 = Date.now();
  try {
    const buf = await maakVideo({ fotos: pids.map(foto), regels: regels.slice(0, pids.length) }, ffmpeg);
    const b = await put('kadoly/ad/' + id + '.mp4', buf, { access: 'public', contentType: 'video/mp4', addRandomSuffix: false, allowOverwrite: true });
    return res.status(200).json({ ok: true, id, url: b.url, bytes: buf.length, seconden: Math.round((Date.now() - t0) / 1000) });
  } catch (e) { return res.status(500).json({ ok: false, id, fout: String(e.message || e).slice(0, 500) }); }
}
