// Maakt de video's van vannacht (17 nov 2026, Henkjan: "moet hele NL dag ... al via clickmind en lerend wat het doet" en "Zet dit door").
// Plan (welke producten, regels, teksten) komt uit de shop: keuzehulp.best/api/shop?op=videoplan (hjdk-api, lib/kadolyvideoplan.js).
// Elke video gaat naar Vercel Blob (openbaar, vaste naam); kadoly/lijst.json houdt de wachtrij bij die de dagtaak social plant.
import ffmpeg from 'ffmpeg-static';
import { put } from '@vercel/blob';
import { maakVideo } from '../lib/render.js';
import { LIJST, leesLijst } from '../lib/lijst.js';

const PLAN = 'https://keuzehulp.best/api/shop?op=videoplan';

export default async function handler(req, res) {
  const t0 = Date.now(), ua = String(req.headers['user-agent'] || ''), host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0];
  const cron = /vercel-cron/i.test(ua) || (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET);
  // de vaste projectnaam is openbaar; renderen mag alleen via de cron of via een (beschermde) deployment-URL
  if (!cron && /^kadoly-video(-henq)?\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
  const pj = await (await fetch(PLAN, { signal: AbortSignal.timeout(60000) })).json();
  const lijst = await leesLijst(), al = new Set(lijst.map(v => v.id)), gedaan = [], fout = [];
  for (const v of (pj.plan || [])) {
    if (al.has(v.id)) continue;
    if (Date.now() - t0 > 200000) break; // ruim binnen 300 s; de tweede cron maakt de rest af
    try {
      const buf = await maakVideo(v, ffmpeg);
      const b = await put('kadoly/video/' + v.id + '.mp4', buf, { access: 'public', contentType: 'video/mp4', addRandomSuffix: false, allowOverwrite: true });
      const rij = { id: v.id, soort: v.soort, url: b.url, pids: v.pids, tekst: v.tekst, tiktok_tekst: v.tiktok_tekst, gemaakt: new Date().toISOString(), bytes: buf.length };
      lijst.push(rij); al.add(v.id); gedaan.push({ id: v.id, url: b.url, seconden: Math.round((Date.now() - t0) / 1000) });
      await put(LIJST, JSON.stringify(lijst.slice(-200), null, 1), { access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60 });
    } catch (e) { fout.push({ id: v.id, fout: String(e.message || e).slice(0, 400) }); }
  }
  return res.status(200).json({ ok: true, dag: pj.dag, gepland: (pj.plan || []).length, gedaan, fout, inLijst: lijst.length });
}
