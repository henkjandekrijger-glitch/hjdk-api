// POST — lerende lus voor alle mail die we versturen (lib/postlus.js). Voor elke chat en elk account.
//   GET  /api/post?op=skill            de skill mail-lerend (bron: .claude/skills/mail-lerend/SKILL.md)
//   GET  /api/post?op=regels[&t=1]     de regels op volgorde van bewezen effect (t=1: gewone tekst)
//   GET  /api/post?op=stand            persoonlijke mail (concept, verstuurd, antwoord per project, soort en variant) en automatische mail per stroom
//   GET|POST /api/post?op=meld&project=&doel=&aan=&soort=&taal=&onderwerp=&variant=&lessen=a,b&wie=   een concept melden vóór het naar Henkjan gaat
//   GET|POST /api/post?op=uitkomst&id=&uitkomst=antwoord|ja|nee|klik|bounce|geen[&toelichting=]      zelf een uitkomst melden
//   GET  /api/post?op=ronde            cron (dagelijks): Gmail nalopen op verstuurd, antwoord en bounce; Resend-stromen tellen
//   GET  /api/post?op=koppel           Gmail koppelen (alleen lezen); Google stuurt terug naar op=terug
// Zonder token mag een chat melden (hooguit 150 per dag); de stand toont nooit een volledig adres.
import { regels, stand, meld, uitkomst, ronde, koppelUrl, koppelTerug, DAG, gmailLes, gmailRegels, klikAntwoord } from '../lib/postlus.js';
import { leesSkill } from '../lib/skills.js';
import { kv } from '../lib/db.js';
import { beeldAntwoord, meetStand } from '../lib/mailopen.js';

const mag = req => { const q = req.query || {}; const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''); const given = [q.token, req.headers['x-hjdk-token'], bearer].filter(Boolean);
  const ok = [process.env.ZICHT_TOKEN, process.env.GADS_TOKEN, process.env.HJDK_TOKEN].filter(Boolean); return given.some(g => ok.includes(g)) || /vercel-cron/i.test(String(req.headers['user-agent'] || '')); };
const pagina = (titel, tekst) => '<!doctype html><html lang="nl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>' + titel + '</title><main style="max-width:560px;margin:60px auto;padding:20px;font:17px/1.6 system-ui"><h1 style="font-size:24px">' + titel + '</h1><p>' + tekst + '</p></main></html>';

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex'); res.setHeader('access-control-allow-origin', '*'); res.setHeader('access-control-allow-headers', 'content-type,authorization,x-hjdk-token');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const q = Object.assign({}, req.query || {}, typeof req.body === 'object' && req.body ? req.body : {}); const op = q.op || 'regels';
  try {
    if (op === 'o') return await beeldAntwoord(req, res, String(q.code || ''));
    if (op === 'meting') { const r = await meetStand(String(q.sleutel || '')); return res.status(r ? 200 : 404).json(r || { ok: false }); }
    if (op === 'k') return await klikAntwoord(req, res, String(q.code || ''));
    if (op === 'skill') { const t = leesSkill('mail-lerend'); res.setHeader('content-type', 'text/markdown; charset=utf-8'); return t ? res.status(200).send(t) : res.status(404).send('skill niet gevonden'); }
    if (op === 'regels') {
      const r = await regels();
      const eigen = await gmailRegels().then(x => gmailLes(x).lessen).catch(() => []);
      if (q.t) { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send((eigen.length ? 'Geleerd uit je eigen Gmail:\n' + eigen.map(x => '- ' + x).join('\n') + '\n\n' : '') + r.map((l, i) => (i + 1) + '. [' + (l.vast ? 'vast' : l.score) + '] ' + l.les + ' (' + l.id + '; ' + (l.verstuurd ? l.goed + ' van ' + l.verstuurd + ' mails met antwoord of klik' : l.bron) + ')').join('\n')); }
      return res.status(200).json({ ok: true, uitEigenGmail: eigen, regels: r });
    }
    if (op === 'awindomein') { const A = await import('../lib/awinmail.js'); return res.status(200).json(await A.adsfairDomein(q.stap === 'maak' ? 'maak' : 'check', /^(adsfair\.xyz|whichtobuy\.best)$/.test(String(q.d || '')) ? String(q.d) : 'adsfair.xyz')); }
    if (op === 'awinstuur') { const A = await import('../lib/awinmail.js'); return res.status(200).json(await A.stuurAwin(Math.max(1, Math.min(5, Number(q.max) || 3)), String(q.droog || '') === '1')); }
    if (op === 'stand') return res.status(200).json(await stand());
    if (op === 'meld' || op === 'uitkomst') {
      const open = !mag(req);
      if (open) { const n = Number(await kv.incr('post:open:' + DAG()).catch(() => 0)); if (n > 150) return res.status(429).json({ ok: false, fout: 'daglimiet zonder token bereikt' }); }
      const r = op === 'meld' ? await meld(q, open) : await uitkomst(q); return res.status(r.ok ? 200 : 400).json(r);
    }
    if (op === 'ronde') {
      if (!mag(req)) { const laatst = await kv.get('post:ronde'); if (laatst && Date.now() - Date.parse(laatst.at) < 6 * 3600000) return res.status(200).json({ ok: true, alGedraaid: laatst }); }
      return res.status(200).json(await ronde());
    }
    if (op === 'koppel') { const r = await koppelUrl(); if (!r.ok) { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(400).send(pagina('Gmail koppelen kan nog niet', r.fout + '.')); } res.setHeader('location', r.url); return res.status(302).end(); }
    if (op === 'terug') {
      const r = q.error ? { ok: false, fout: 'geweigerd bij Google' } : await koppelTerug(q.code, q.state); res.setHeader('content-type', 'text/html; charset=utf-8');
      return res.status(r.ok ? 200 : 400).send(r.ok ? pagina('Gmail is gekoppeld', 'Account ' + r.adres + ', alleen lezen. De dagelijkse ronde ziet nu zelf welke mails verstuurd zijn en waar antwoord op kwam.') : pagina('Koppelen is niet gelukt', r.fout + '.'));
    }
    return res.status(400).json({ ok: false, fout: 'onbekende op' });
  } catch (e) { return res.status(500).json({ ok: false, fout: String(e && e.message || e).slice(0, 120) }); }
}
