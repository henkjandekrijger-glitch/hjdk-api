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
//   GET  /api/zicht?op=ronde&groep=2  cron 05:50 UTC: dezelfde ronde voor alle andere projecten (lib/zicht.js PROJECT_SITES)
//   GET  /api/zicht?op=werk[&site=todayin][&t=1]  wat elk project nu moet doen: technische problemen, dan de hoogste open les
//   GET  /api/zicht?op=tech&site=todayin           laatste techcheck (robots, bots, sitemap, homepage, zicht.json)
//   GET  /api/zicht?op=controleer&site=todayin     techcheck + zicht.json nu (zonder token hooguit eens per uur per site)
//   GET  /api/zicht?op=manifest                    uitleg van https://<host>/zicht.json: zo meldt een project zonder token
// Schrijven: token in Authorization: Bearer, header x-hjdk-token of ?token= (gedeelde team-variabele ZICHT_TOKEN, GADS_TOKEN of HJDK_TOKEN).
import { vraagAI, gapScan } from '../lib/zicht.js';
import { lessen, draaiboek, stand, voegLesToe, nieuweProef, verwerkUitkomst, zetSite, ronde, meet, sites, DAY, zoekvragen, bewaarZoekvragen } from '../lib/zicht.js';
import { organicStatus } from '../lib/organic.js';
import { OVERDRACHT_ZICHT } from '../lib/overdracht-zicht.js';
import { leesSkill } from '../lib/skills.js';
import { zoekVolumes } from '../lib/demandradar.js';

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
    if (op === 'volumes') { // zoekvolumes (Google Ads, 13 maanden) via demandradar; zonder token hooguit 8 keer per dag, max 60 termen
      const { kv } = await import('../lib/db.js'); if (!mag(req)) { const n = Number(await kv.raw(['INCR', 'zicht:volumes:n:' + DAY()]).catch(() => 0)); if (n > 8) return res.status(429).json({ fout: 'daglimiet volumes (8)' }); }
      const kws = String(q.v || '').split('|').map(x => x.trim()).filter(Boolean).slice(0, 60); if (!kws.length) return res.status(400).json({ fout: 'geef v=term1|term2' });
      return res.status(200).json(await zoekVolumes(kws, q.cc || 'NL')); }
    if (op === 'skill') { const t = leesSkill(q.naam || 'zicht-seo-llm'); res.setHeader('content-type', 'text/markdown; charset=utf-8'); return t ? res.status(200).send(t) : res.status(404).send('skill niet gevonden'); }
    if (op === 'draaiboek' || op === 'playbook') {
      const db = await draaiboek(q.site, q.kanaal); const n = Math.min(Number(q.n) || 40, 100);
      if (q.t) { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send('Draaiboek vindbaarheid en AI-vermeldingen (' + DAY() + (q.site ? ', site ' + q.site : '') + '). Hoogste score eerst; score = kans dat het werkt (voorkennis + eigen proeven) x effect / moeite.\nToegepast? Meld het: POST /api/zicht?op=proef. Nieuw inzicht? POST /api/zicht?op=les. Uitleg: /api/zicht?op=overdracht\n\n' + tekst(db.slice(0, n))); }
      return res.status(200).json({ ok: true, dag: DAY(), site: q.site || null, lessen: db.slice(0, n) });
    }
    if (op === 'llmtest') { // proef van de AI-meting: ruwe vorm van het antwoord (sleutels en bronnen), hooguit 20 per dag
      const { kv } = await import('../lib/db.js'); const k = 'zicht:llmtest:' + DAY(); const n = Number(await kv.raw(['INCR', k]).catch(() => 0)); if (n > 20) return res.status(429).json({ fout: 'daglimiet' });
      const j = await vraagAI(q.model || process.env.ZICHT_LLM_MODEL || 'perplexity/sonar', q.q || 'welke airfryer kopen', q.taal || 'nl', oidc, { fn: 'zicht-llmtest', vers: true }); const raw = JSON.stringify(j);
      return res.status(200).json({ ok: true, sleutels: Object.keys(j), bericht: Object.keys(((j.choices || [])[0] || {}).message || {}), urls: (raw.match(/https?:\/\/[^\s"'<>)\]]+/g) || []).slice(0, 20), tekst: String((((j.choices || [])[0] || {}).message || {}).content || '').slice(0, 600), ruw: raw.slice(0, 2500) });
    }
    if (op === 'gapscan') { // gatscan: stel tot 40 keuzevragen aan een AI-assistent en laat zien waar de antwoorden zwak zijn (zonder token hooguit 6 scans per dag)
      const { kv } = await import('../lib/db.js'); if (!mag(req)) { const n = Number(await kv.raw(['INCR', 'zicht:gapscan:n:' + DAY()]).catch(() => 0)); if (n > 6) return res.status(429).json({ fout: 'daglimiet gatscan (6)' }); }
      const vragen = (Array.isArray(q.vragen) ? q.vragen : String(q.v || '').split('|')).map(x => String(x).trim()).filter(Boolean).slice(0, 40); if (!vragen.length) return res.status(400).json({ fout: 'geef v=vraag1|vraag2|... of POST {vragen:[...]}' });
      const r = await gapScan(vragen, q.taal || 'nl', oidc, q.model); const naam = String(q.naam || 'scan').replace(/[^a-z0-9-]/gi, '').slice(0, 40);
      await kv.set('zicht:gapscan:' + DAY() + ':' + naam, r, { ex: 60 * 86400 }).catch(() => {}); await kv.raw(['LPUSH', 'zicht:gapscan:index', 'zicht:gapscan:' + DAY() + ':' + naam]).catch(() => {}); await kv.raw(['LTRIM', 'zicht:gapscan:index', '0', '49']).catch(() => {}); return res.status(200).json(Object.assign({ ok: true, naam }, r)); }
    if (op === 'organisch') {
      const ids = q.site ? [q.site].filter(s => ['kz', 'us', 'de'].includes(s)) : ['kz', 'us', 'de'];
      const { MARKETS } = await import('../lib/wtb.js');
      const result = await Promise.all(ids.map(id => organicStatus(id, id === 'kz' ? Number(process.env.KZ_PER_DAG || 12) : MARKETS[id].perDay())));
      if (q.t) { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send('ORGANISCHE GROEI — ' + DAY() + '\n\n' + result.map(x => x.site.toUpperCase() + ': ' + x.budget.inGoogle + '/' + x.budget.gecontroleerd + ' gecontroleerde URL’s in Google (indexcontrole ' + x.budget.indexDag + ').\nAutomatische nieuwbouw maximaal ' + x.budget.perDag + '/dag. ' + x.budget.reden + '\nGoogle' + (x.google.periode ? ' (' + x.google.periode.startDate + ' t/m ' + x.google.periode.endDate + ')' : '') + ': ' + (x.google.totaal ? x.google.totaal.imp + ' vertoningen, ' + x.google.totaal.clicks + (x.google.totaal.clicks === 1 ? ' klik' : ' kliks') : 'volledige totalen nog niet gemeten') + '. ' + x.google.basis + '\n' + x.prioriteit + '\n' + x.kansen.map(p => '- /' + p.slug + ': ' + p.vragen.map(v => v.vraag + ' (positie ' + v.positie + ')').join('; ')).join('\n') + '\n' + x.interpretatie).join('\n\n')); }
      return res.status(200).json({ ok: true, sites: result });
    }
    if (op === 'zoekvragen') { // alle bewaarde Search Console-zoekvragen per site; &ververs=1 haalt de laatste 10 dagen nu op (hooguit eens per uur per site)
      const id = String(q.site || ''); if (!(await sites())[id]) return res.status(400).json({ fout: 'onbekende site' });
      let ververst = null; if (q.ververs) { const { kv } = await import('../lib/db.js'); const k = 'zicht:zv:ververs:' + id; if (mag(req) || !(await kv.get(k).catch(() => null))) { await kv.set(k, 1, { ex: 3600 }).catch(() => {}); ververst = await bewaarZoekvragen(id, oidc).catch(e => ({ fout: String(e.message).slice(0, 120) })); } else ververst = { overgeslagen: 'binnen het uur al ververst' }; }
      return res.status(200).json(Object.assign({ ok: true, ververst }, await zoekvragen(id, q.dagen, q.dag)));
    }
    if (op === 'stand') return res.status(200).json({ ok: true, dag: DAY(), sites: await stand(q.site) });
    if (op === 'manifest') { const PJ = await import('../lib/zicht-projecten.js'); res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(PJ.MANIFEST_UITLEG); }
    if (op === 'werk') { const PJ = await import('../lib/zicht-projecten.js'); const w = await PJ.werk(await sites(), q.site || null);
      if (q.t) { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send('ZICHT werk per project (' + DAY() + '). Eerst PROBLEMEN, dan de genummerde lessen (hoogste score eerst). Pas toe op een deel van de pagina\'s, houd vergelijkbare als controle en meld het in https://<host>/zicht.json (uitleg: /api/zicht?op=manifest).\n\n' + PJ.werkTekst(w)); }
      return res.status(200).json({ ok: true, dag: DAY(), werk: w }); }
    if (op === 'tech') { const PJ = await import('../lib/zicht-projecten.js'); return res.status(200).json({ ok: true, tech: await PJ.techVan(String(q.site || '')) }); }
    if (op === 'controleer') { const ss = await sites(); const s = ss[String(q.site || '')]; if (!s) return res.status(400).json({ fout: 'onbekende site' });
      if (!mag(req)) { const { kv } = await import('../lib/db.js'); const lk = 'zicht:controleer:last:' + s.id; const last = await kv.get(lk).catch(() => 0); if (last && Date.now() - last < 3600e3) return res.status(429).json({ fout: 'deze site is het afgelopen uur al gecontroleerd', tech: '/api/zicht?op=tech&site=' + s.id }); await kv.set(lk, Date.now()); }
      const PJ = await import('../lib/zicht-projecten.js'); return res.status(200).json({ ok: true, site: s.id, controle: await PJ.controleer(s) }); }
    if (op === 'sites') return res.status(200).json({ ok: true, sites: await sites() });
    if (op === 'ronde' && !mag(req)) { // zonder token: hooguit eens per 6 uur
      const { kv } = await import('../lib/db.js'); const g = Number(q.groep) === 2 ? 2 : 1; const lk = 'zicht:ronde:last' + (g === 2 ? ':2' : ''); const last = await kv.get(lk).catch(() => 0); if (last && Date.now() - last < 6 * 3600e3) return res.status(429).json({ fout: 'laatste ronde minder dan 6 uur geleden', stand: '/api/zicht?op=stand' });
      await kv.set(lk, Date.now()); return res.status(200).json(Object.assign({ ok: true }, await ronde(oidc, { groep: g }))); }
    if (op === 'meet' && !mag(req)) { // zonder token: per site hooguit eens per uur
      const { kv } = await import('../lib/db.js'); const site = String(q.site || 'kz'); const lk = 'zicht:meet:last:' + site; const last = await kv.get(lk).catch(() => 0); if (last && Date.now() - last < 3600e3) return res.status(429).json({ fout: 'deze site is het afgelopen uur al gemeten' });
      await kv.set(lk, Date.now()); return res.status(200).json({ ok: true, meting: await meet(site, oidc) }); }
    if (!mag(req)) return res.status(401).json({ fout: 'token nodig (ZICHT_TOKEN, GADS_TOKEN of HJDK_TOKEN)' });
    if (op === 'les') return res.status(200).json({ ok: true, les: await voegLesToe(q) });
    if (op === 'proef') return res.status(200).json({ ok: true, proef: await nieuweProef(q) });
    if (op === 'uitkomst') { if (!['beter', 'slechter', 'gelijk'].includes(q.uitkomst)) return res.status(400).json({ fout: 'uitkomst moet beter, slechter of gelijk zijn' }); return res.status(200).json({ ok: true, les: await verwerkUitkomst(q.les, q.uitkomst, q.effect != null ? Number(q.effect) : NaN, q.site, q.toelichting) }); }
    if (op === 'toegepast') { const ls = await lessen(); const l = ls.find(e => e.id === q.les); if (!l || !q.site) return res.status(400).json({ fout: 'site en bestaande les nodig' }); const { bewaarLessen } = await import('../lib/zicht.js'); l.toegepast = Object.assign({}, l.toegepast, { [q.site]: q.dag || DAY() }); await bewaarLessen(ls); return res.status(200).json({ ok: true, les: l.id, toegepast: l.toegepast }); }
    if (op === 'site') return res.status(200).json({ ok: true, site: await zetSite(q) });
    if (op === 'meet') return res.status(200).json({ ok: true, meting: await meet(q.site || 'kz', oidc) });
    if (op === 'ronde' && q.alsNodig) { // vangnet: alleen draaien als de ochtendronde vandaag niets heeft gemeten (storing, volle database)
      const { kv } = await import('../lib/db.js'); const d = new Date().toISOString().slice(0, 10); const al = await kv.get('zicht:meting:' + (Number(q.groep) === 2 ? 'todayin' : 'kz') + ':' + d).catch(() => null);
      if (al) return res.status(200).json({ ok: true, gedaan: 'niets', reden: 'vandaag al gemeten' }); }
    if (op === 'ronde') return res.status(200).json(Object.assign({ ok: true }, await ronde(oidc, { zonderMeten: !!q.zonderMeten, groep: Number(q.groep) || 1 })));
    return res.status(400).json({ fout: 'onbekende op' });
  } catch (e) { return res.status(500).json({ fout: String(e.message || e).slice(0, 300) }); }
}
