// VIDEOMIND: register en leergeheugen voor elke video van elk project (Henkjan 26 nov 2026). Code lib/videomind.js, skill .claude/skills/videomind/SKILL.md.
//   GET  /api/videomind?op=skill                 de skill (markdown), op elke host: voor iedereen
//   GET  /api/videomind[?project=<id>][&vorm=tekst|json]   stand per project en per video, met de lessen (beschermde host)
//   GET  /api/videomind?op=lessen[&project=][&platform=][&vorm=tekst]
//   GET|POST /api/videomind?op=zet&json=<video of lijst>     video registreren vóór plaatsen (id = utm_content)
//   GET|POST /api/videomind?op=meting&json={"id":..,"koop":1,"omzet":49,"bron":".."}   eigen meting van een project
//   GET|POST /api/videomind?op=les&les=<zin met getal>&project=&platform=&bron=
//   GET  /api/videomind?op=ronde[&droog=1]       cron elke 6 uur: Zernio-cijfers en Clickmind-bezoeken bijwerken
//   GET  /api/videomind?op=seed&project=mylevel   eenmalig de bestaande MyLevel-video's (lib/videomind-seed.js), bestaande regels blijven
// Schrijven en lezen alleen op de beschermde vercel.app-host, met de gedeelde team-sleutel (x-hjdk-token of Bearer), of als cron.
import * as V from '../lib/videomind.js';
import { leesSkill } from '../lib/skills.js';

const beschermd = req => /\.vercel\.app$/i.test(String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]) && /\.vercel\.app$/i.test(String(req.headers.host || '').split(':')[0]);
const sleutel = req => { const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''); const given = [req.headers['x-hjdk-token'], bearer].filter(Boolean);
  const ok = [process.env.ZICHT_TOKEN, process.env.GADS_TOKEN, process.env.HJDK_TOKEN].filter(Boolean); return given.some(g => ok.includes(g)); };
const cron = req => (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(String(req.headers['user-agent'] || ''));
function body(req) { const b = req.body; if (b && typeof b === 'object') return b; try { return b ? JSON.parse(String(b)) : null; } catch (e) { return null; } }
function json(q, b) { if (q.json) { try { return JSON.parse(q.json); } catch (e) { return undefined; } } return b; }

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex'); res.setHeader('access-control-allow-origin', '*'); res.setHeader('access-control-allow-headers', 'content-type,authorization,x-hjdk-token');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const q = Object.fromEntries(new URL(req.url || '/', 'http://x').searchParams); const b = req.method === 'POST' ? body(req) : null; const op = q.op || (q.les ? 'les' : 'stand');
  const txt = (s, code = 200) => { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(code).send(s); };
  try {
    if (op === 'skill') { const t = leesSkill('videomind'); res.setHeader('content-type', 'text/markdown; charset=utf-8'); return t ? res.status(200).send(t) : res.status(404).send('skill niet gevonden'); }
    if (op === 'ronde') { if (!cron(req) && !beschermd(req) && !sleutel(req)) return res.status(403).json({ ok: false }); return res.status(200).json(await V.ronde({ droog: q.droog === '1' })); }
    if (!beschermd(req) && !sleutel(req)) return res.status(403).send('alleen via de beschermde vercel.app-host of met de team-sleutel; de skill is openbaar: ?op=skill');
    if (op === 'zet') { const x = json(q, b); if (x === undefined || x === null) return res.status(400).json({ ok: false, fout: 'json=<video of lijst>; velden: id, project, platform, vorm, titel, onderwerp, pagina, haak, lengte, at, zid, link, net, camp' });
      const l = Array.isArray(x) ? x : Array.isArray(x.videos) ? x.videos : null; const r = l ? await V.zetVeel(l) : await V.zet(x); return res.status(r.ok ? 200 : 400).json(r); }
    if (op === 'meting') { const x = json(q, b) || q; const r = await V.meting(x, 'project'); return res.status(r.ok ? 200 : 400).json(r); }
    if (op === 'les') { const r = await V.les(Object.assign({}, q, b || {})); return res.status(r.ok ? 200 : 400).json(r); }
    if (op === 'seed') { if (q.project !== 'mylevel') return res.status(400).json({ ok: false, fout: 'seed alleen voor project=mylevel' }); return res.status(200).json(await V.seed('mylevel')); }
    if (op === 'lessen') { const L = await V.lessen({ project: q.project || '', platform: q.platform || '' }); return q.vorm === 'tekst' ? txt(V.lessenTekst(L)) : res.status(200).json({ ok: true, ...L }); }
    if (op === 'stand') { const s = await V.stand({ project: q.project || '', id: q.id || '' }); return q.vorm === 'json' ? res.status(200).json(s) : txt(V.tekst(s)); }
    return res.status(400).json({ ok: false, fout: 'onbekende op; zie ?op=skill' });
  } catch (e) { return res.status(500).json({ ok: false, fout: String(e && e.message || e).slice(0, 160) }); }
}
