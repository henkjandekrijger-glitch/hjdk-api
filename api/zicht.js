// ZICHT — lerende lus voor vindbaarheid in Google/Bing en vermeldingen in AI-assistenten, voor ieder project en iedere chat.
//   GET  /api/zicht?op=draaiboek[&site=kz][&kanaal=llm][&t=1]   lessen op volgorde van bewezen effect (t=1: gewone tekst)
//   GET  /api/zicht?op=stand[&site=kz]                          metingen, historie, proeven en uitkomsten
//   GET  /api/zicht?op=overdracht                               uitleg voor andere chats en collega's (tekst)
//   POST /api/zicht?op=les        {id?, les, kanaal, bewijs, bron, sterkte?, moeite?, risico?}   nieuw inzicht of nieuw bewijs
//   POST /api/zicht?op=proef      {site, les, urls[], controle[]?, metric: gsc|index|llm, na?: dagen, wat?, van?}   iets toegepast: de lus beoordeelt het zelf
//   POST /api/zicht?op=uitkomst   {site, les, uitkomst: beter|slechter|gelijk, effect?, toelichting}   zelf gemeten uitkomst melden
//   POST /api/zicht?op=toegepast {site, les}  markeer een les als al toegepast (zonder proef)
//   POST /api/zicht?op=site       {id, host, taal, land, merk[], vragen[], gsc?}   een site aanmelden voor de metingen
//   GET  /api/zicht?op=ronde      cron (dagelijks 05:30 UTC) of met token: meten, beoordelen, herrangschikken, nieuwe inzichten
// Schrijven: token in Authorization: Bearer, header x-hjdk-token of ?token= (gedeelde team-variabele ZICHT_TOKEN, GADS_TOKEN of HJDK_TOKEN).
import { vraagAI } from '../lib/zicht.js';
import { lessen, draaiboek, stand, voegLesToe, nieuweProef, verwerkUitkomst, zetSite, ronde, meet, sites, DAY } from '../lib/zicht.js';
import { OVERDRACHT_ZICHT } from '../lib/overdracht-zicht.js';

const mag = req => { const q = req.query || {}; const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''); const given = [q.token, req.headers['x-hjdk-token'], bearer].filter(Boolean);
  const ok = [process.env.ZICHT_TOKEN, process.env.GADS_TOKEN, process.env.HJDK_TOKEN].filter(Boolean); return given.some(g => ok.includes(g)) || /vercel-cron/i.test(String(req.headers['user-agent'] || '')); };
const tekst = db => db.map((l, i) => (i + 1) + '. [' + l.score + '] ' + l.les + ' (' + l.kanaal + ', moeite ' + l.moeite + (l.proeven ? ', ' + l.proeven + ' proeven: ' + l.beter + ' beter, ' + l.slechter + ' slechter, gem. effect ' + Math.round(l.effect * 100) + '%' : ', nog niet zelf getoetst') + (l.status === 'regel' ? ', VASTE REGEL' : '') + ')\n   id: ' + l.id + (l.toegepastOp && typeof l.toegepastOp === 'string' ? ' · toegepast ' + l.toegepastOp : '') + '\n   bewijs: ' + (l.bewijs[0] || '-') + (l.risico ? '\n   let op: ' + l.risico : '')).join('\n');

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store'); res.setHeader('access-control-allow-origin', '*'); res.setHeader('access-control-allow-headers', 'content-type,authorization,x-hjdk-token');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const q = Object.assign({}, req.query || {}, typeof req.body === 'object' && req.body ? req.body : {}); const op = q.op || 'draaiboek';
  const oidc = req.headers['x-vercel-oidc-token'] || process.env.VERCEL_OIDC_TOKEN;
  try {
    if (op === 'overdracht') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(OVERDRACHT_ZICHT); }
    if (op === 'draaiboek' || op === 'playbook') {
      const db = await draaiboek(q.site, q.kanaal); const n = Math.min(Number(q.n) || 40, 100);
      if (q.t) { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send('Draaiboek vindbaarheid en AI-vermeldingen (' + DAY() + (q.site ? ', site ' + q.site : '') + '). Hoogste score eerst; score = kans dat het werkt (voorkennis + eigen proeven) x effect / moeite.\nToegepast? Meld het: POST /api/zicht?op=proef. Nieuw inzicht? POST /api/zicht?op=les. Uitleg: /api/zicht?op=overdracht\n\n' + tekst(db.slice(0, n))); }
      return res.status(200).json({ ok: true, dag: DAY(), site: q.site || null, lessen: db.slice(0, n) });
    }
    if (op === 'llmtest') { // proef van de AI-meting: ruwe vorm van het antwoord (sleutels en bronnen), hooguit 20 per dag
      const { kv } = await import('../lib/db.js'); const k = 'zicht:llmtest:' + DAY(); const n = Number(await kv.raw(['INCR', k]).catch(() => 0)); if (n > 20) return res.status(429).json({ fout: 'daglimiet' });
      const j = await vraagAI(q.model || process.env.ZICHT_LLM_MODEL || 'perplexity/sonar', q.q || 'welke airfryer kopen', q.taal || 'nl', oidc); const raw = JSON.stringify(j);
      return res.status(200).json({ ok: true, sleutels: Object.keys(j), bericht: Object.keys(((j.choices || [])[0] || {}).message || {}), urls: (raw.match(/https?:\/\/[^\s"'<>)\]]+/g) || []).slice(0, 20), tekst: String((((j.choices || [])[0] || {}).message || {}).content || '').slice(0, 600), ruw: raw.slice(0, 2500) });
    }
    if (op === 'stand') return res.status(200).json({ ok: true, dag: DAY(), sites: await stand(q.site) });
    if (op === 'sites') return res.status(200).json({ ok: true, sites: await sites() });
    if (op === 'ronde' && !mag(req)) { // zonder token: hooguit eens per 6 uur
      const { kv } = await import('../lib/db.js'); const last = await kv.get('zicht:ronde:last').catch(() => 0); if (last && Date.now() - last < 6 * 3600e3) return res.status(429).json({ fout: 'laatste ronde minder dan 6 uur geleden', stand: '/api/zicht?op=stand' });
      await kv.set('zicht:ronde:last', Date.now()); return res.status(200).json(Object.assign({ ok: true }, await ronde(oidc, {}))); }
    if (!mag(req)) return res.status(401).json({ fout: 'token nodig (ZICHT_TOKEN, GADS_TOKEN of HJDK_TOKEN)' });
    if (op === 'les') return res.status(200).json({ ok: true, les: await voegLesToe(q) });
    if (op === 'proef') return res.status(200).json({ ok: true, proef: await nieuweProef(q) });
    if (op === 'uitkomst') { if (!['beter', 'slechter', 'gelijk'].includes(q.uitkomst)) return res.status(400).json({ fout: 'uitkomst moet beter, slechter of gelijk zijn' }); return res.status(200).json({ ok: true, les: await verwerkUitkomst(q.les, q.uitkomst, q.effect != null ? Number(q.effect) : NaN, q.site, q.toelichting) }); }
    if (op === 'toegepast') { const ls = await lessen(); const l = ls.find(e => e.id === q.les); if (!l || !q.site) return res.status(400).json({ fout: 'site en bestaande les nodig' }); const { bewaarLessen } = await import('../lib/zicht.js'); l.toegepast = Object.assign({}, l.toegepast, { [q.site]: q.dag || DAY() }); await bewaarLessen(ls); return res.status(200).json({ ok: true, les: l.id, toegepast: l.toegepast }); }
    if (op === 'site') return res.status(200).json({ ok: true, site: await zetSite(q) });
    if (op === 'meet') return res.status(200).json({ ok: true, meting: await meet(q.site || 'kz', oidc) });
    if (op === 'ronde') return res.status(200).json(Object.assign({ ok: true }, await ronde(oidc, { zonderMeten: !!q.zonderMeten })));
    return res.status(400).json({ fout: 'onbekende op' });
  } catch (e) { return res.status(500).json({ fout: String(e.message || e).slice(0, 300) }); }
}
