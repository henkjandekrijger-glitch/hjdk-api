// GoonFree 2.0 (app, overgenomen 27 nov 2026; repo henkjandekrijger-glitch/goonfree). Openbaar via https://keuzehulp.best/api/goonfree
//   POST ?op=coach  { d, l, m:[{r:'u'|'c',t}], ctx:{dagen,uur,drangen,waarom,plannen,triggers,terugval,piek,geloof,land} } -> { t }
//                   AI-coach bij een drang die de gebruiker kent (Haiku, eigen sleutel eerst, gateway als terugval). Alles komt van het toestel, niets wordt bewaard.
//   POST ?op=inzicht { d, l, ctx:{...zelfde, week:{drang,gehaald,daling,terugval,checkins}} } -> { t }  weekinzicht: 3 korte zinnen, hoogstens 3 per toestel per dag
//   POST ?op=ev     { d, e, p, os, v, l } -> { ok }  elke stap in de app telt (Clickmind-principe), tellers per dag, unieke toestellen (HyperLogLog)
//   GET  ?op=stand[&dagen=7][&vorm=tekst]  tellers per dag voor dashboard en rondes
// Regels (Henkjan 27 nov 2026): 18+, geen advertenties, nooit NoFap of andermans merknamen; de coach noemt geen andere programma's of gemeenschappen.
// Kosten: hoogstens 60 coachbeurten per toestel per dag en 4.000 per dag in totaal; daarboven een vaste tip zonder AI.
import { kv } from '../lib/db.js';
import { berichten, HAIKU } from '../lib/ai.js';

const DAG = () => new Date().toISOString().slice(0, 10);
const TTL = 60 * 60 * 24 * 90;
const PER_TOESTEL = 60, PER_DAG = 4000;
const schoon = (s, n) => String(s || '').replace(/[\u0000-\u001f]/g, ' ').slice(0, n);

const SYSTEEM = `You are the coach inside GoonFree, an app for adults (18+) who want to stop compulsive porn use and gooning.
The user opens you at the moment of an urge. Your job: get them through the next 10 minutes, then help them understand the pattern.
Style: warm, direct, never shaming, no lectures. Max 70 words. Plain text, no lists unless asked, no emojis. One question at a time.
Use proven tools: name the urge and rate it 1-10, urge surfing (urges peak and pass in about 15-20 minutes), the 10-minute delay,
leave the room or put the phone in another room, cold water on the face, a short walk or push-ups, text a friend, HALT check
(hungry, angry, lonely, tired), and replace the trigger habit with something concrete. Celebrate every urge they beat.
After a slip: no shame, their total clean days stay, focus on the next hour and on what triggered it.
Never write sexual content, never describe porn, never suggest "just a little". Never name other quitting programs, challenges,
communities, apps or brands. If they ask what you are: the GoonFree coach, an AI, not a therapist.
If the user mentions self-harm, suicide or being in danger: respond with care, tell them to contact local emergency services or a
crisis line now (US and Canada 988, UK and Ireland 116 123, Australia 13 11 14, Germany 0800 111 0 111, NL 113 or 0800-0113),
and stay with them in the conversation.
If problems are heavy or long-lasting, suggest a professional therapist who treats compulsive sexual behaviour.
You know this user from the context below: use their own why and their own if-then plans by name, refer to their pattern
(risk hour, triggers before earlier slips) when it helps, but never repeat the whole profile back.
If the context says faith=yes, the user welcomes faith-based encouragement (grace, prayer, purpose); keep it gentle and
non-denominational unless they name their faith. If faith=no, keep it secular.
Always answer in the user's language (code: {LANG}).`;

const INZICHT = `You write the weekly insight inside GoonFree, an app for adults who want to stop compulsive porn use.
You get the user's numbers for the last 7 days and their profile. Write exactly 3 short sentences, max 60 words total, no lists, no emojis:
1) what went well, with one concrete number from the data; 2) the clearest pattern (an hour, a trigger or a feeling);
3) one concrete if-then plan for next week that fits that pattern. Warm and direct, never shaming. If faith=yes you may end with one
gentle line of faith-based encouragement. Never name other programs, apps or brands. Answer in the user's language (code: {LANG}).`;

const lijst = (x, n) => (Array.isArray(x) ? x.slice(0, 6).map(v => schoon(v, n)).filter(Boolean) : []);
function profiel(c) {
  const r = [`current clean run ${Number(c.dagen) || 0} days`, `local hour ${Number(c.uur) || 0}`, `urges logged ${Number(c.drangen) || 0}`];
  if (c.waarom) r.push(`their why: "${schoon(c.waarom, 80)}"`);
  const p = lijst(c.plannen, 140); if (p.length) r.push(`their if-then plans: ${p.map(x => '"' + x + '"').join('; ')}`);
  const t = lijst(c.triggers, 40); if (t.length) r.push(`their risk moments: ${t.join(', ')}`);
  const v = lijst(c.terugval, 60); if (v.length) r.push(`before recent slips: ${v.join(', ')}`);
  if (Number.isFinite(Number(c.piek)) && c.piek !== null && c.piek !== '') r.push(`peak urge hour ${Number(c.piek)}:00`);
  r.push('faith=' + (c.geloof ? 'yes' : 'no'));
  if (c.land) r.push('country ' + schoon(c.land, 3));
  return 'Context: ' + r.join(', ') + '.';
}

function lijf(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; }
}

async function coach(req, res) {
  const b = lijf(req), d = schoon(b.d, 40) || 'anon', dag = DAG();
  const m = Array.isArray(b.m) ? b.m.slice(-12).map(x => ({ r: x && x.r === 'u' ? 'u' : 'c', t: schoon(x && x.t, 800) })).filter(x => x.t) : [];
  if (!m.length || m[m.length - 1].r !== 'u') return res.status(400).json({ fout: 'geen vraag' });
  const [eigen, totaal] = await Promise.all([kv.incr('gf:coach:' + dag + ':' + d), kv.incr('gf:coach:' + dag)]);
  if (eigen === 1) await kv.raw(['EXPIRE', 'gf:coach:' + dag + ':' + d, 172800]).catch(() => {});
  if (totaal === 1) await kv.raw(['EXPIRE', 'gf:coach:' + dag, TTL]).catch(() => {});
  if (eigen > PER_TOESTEL || totaal > PER_DAG) return res.json({ t: '', grens: true });
  const c = b.ctx || {};
  const context = profiel(c);
  const gesprek = m.map(x => (x.r === 'u' ? 'User: ' : 'Coach: ') + x.t).join('\n');
  try {
    const r = await berichten({
      fn: 'goonfree-coach', model: HAIKU, max: 260, timeout: 15000,
      system: SYSTEEM.replace('{LANG}', schoon(b.l, 5) || 'en'),
      user: context + '\n\nConversation so far:\n' + gesprek + '\n\nWrite the coach reply only.',
      oidc: String(req.headers['x-vercel-oidc-token'] || ''), directKey: process.env.ANTHROPIC_API_KEY,
    });
    const t = String(r.txt || '').replace(/^coach:\s*/i, '').trim().slice(0, 900);
    await kv.incr('gf:ev:' + dag + ':coach_antwoord').catch(() => {});
    return res.json({ t });
  } catch (e) {
    await kv.incr('gf:ev:' + dag + ':coach_fout').catch(() => {});
    return res.status(502).json({ t: '', fout: 'ai' });
  }
}

async function inzicht(req, res) {
  const b = lijf(req), d = schoon(b.d, 40) || 'anon', dag = DAG(), c = b.ctx || {}, w = c.week || {};
  const [eigen, totaal] = await Promise.all([kv.incr('gf:inz:' + dag + ':' + d), kv.incr('gf:coach:' + dag)]);
  if (eigen === 1) await kv.raw(['EXPIRE', 'gf:inz:' + dag + ':' + d, 172800]).catch(() => {});
  if (eigen > 3 || totaal > PER_DAG) return res.json({ t: '', grens: true });
  const n = k => Math.max(0, Math.round(Number(w[k]) || 0));
  const week = `Last 7 days: urges logged ${n('drang')}, urges beaten ${n('gehaald')}, average urge drop ${Math.round((Number(w.daling) || 0) * 10) / 10} points on 1-10, slips ${n('terugval')}, daily check-ins ${n('checkins')} (hard days ${n('zwaar')}).`;
  try {
    const r = await berichten({
      fn: 'goonfree-inzicht', model: HAIKU, max: 220, timeout: 15000,
      system: INZICHT.replace('{LANG}', schoon(b.l, 5) || 'en'),
      user: profiel(c) + '\n' + week + '\n\nWrite the 3 sentences only.',
      oidc: String(req.headers['x-vercel-oidc-token'] || ''), directKey: process.env.ANTHROPIC_API_KEY,
    });
    await kv.incr('gf:ev:' + dag + ':inzicht_antwoord').catch(() => {});
    return res.json({ t: String(r.txt || '').trim().slice(0, 600) });
  } catch (e) {
    await kv.incr('gf:ev:' + dag + ':inzicht_fout').catch(() => {});
    return res.status(502).json({ t: '', fout: 'ai' });
  }
}

async function ev(req, res) {
  const b = lijf(req), e = schoon(b.e, 40).replace(/[^a-z0-9_]/gi, ''), d = schoon(b.d, 40), dag = DAG();
  if (!e) return res.status(400).json({ fout: 'geen e' });
  const k = 'gf:ev:' + dag + ':' + e;
  const n = await kv.incr(k);
  if (n === 1) await kv.raw(['EXPIRE', k, TTL]).catch(() => {});
  if (d) await kv.raw(['PFADD', 'gf:dev:' + dag, d]).then(() => kv.raw(['EXPIRE', 'gf:dev:' + dag, TTL])).catch(() => {});
  if (e === 'drang_uitkomst' && b.p && typeof b.p.gehaald === 'boolean') await kv.incr('gf:ev:' + dag + ':drang_' + (b.p.gehaald ? 'gehaald' : 'verloren')).catch(() => {});
  return res.json({ ok: true });
}

async function stand(req, res) {
  const dagen = Math.min(30, Math.max(1, Number(req.query.dagen) || 7)), uit = [];
  for (let i = 0; i < dagen; i++) {
    const dag = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10), tel = {};
    let cur = '0';
    do {
      const r = await kv.scan(cur, { match: 'gf:ev:' + dag + ':*', count: 200 });
      cur = String(r[0] ?? r.cursor ?? '0');
      const keys = r[1] || r.keys || [];
      if (keys.length) { const v = await kv.mget(...keys); keys.forEach((k, j) => { tel[k.split(':').pop()] = Number(v[j]) || 0; }); }
    } while (cur !== '0');
    const toestellen = Number(await kv.raw(['PFCOUNT', 'gf:dev:' + dag]).catch(() => 0)) || 0;
    uit.push({ dag, toestellen, coach: Number(await kv.get('gf:coach:' + dag)) || 0, tel });
  }
  if (req.query.vorm === 'tekst') {
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    return res.send(uit.map(x => `${x.dag}: ${x.toestellen} toestellen, coach ${x.coach}; ` + Object.entries(x.tel).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(', ')).join('\n'));
  }
  return res.json({ dagen: uit });
}

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  res.setHeader('access-control-allow-origin', '*');
  if (req.method === 'OPTIONS') { res.setHeader('access-control-allow-headers', 'content-type'); return res.status(204).end(); }
  const op = String(req.query.op || 'stand');
  try {
    if (op === 'coach' && req.method === 'POST') return await coach(req, res);
    if (op === 'ev' && req.method === 'POST') return await ev(req, res);
    if (op === 'inzicht' && req.method === 'POST') return await inzicht(req, res);
    if (op === 'stand') return await stand(req, res);
    if (op === 'gezond') return res.json({ ok: true, app: 'goonfree', v: 1 });
    return res.status(404).json({ fout: 'onbekende op' });
  } catch (e) {
    return res.status(500).json({ fout: String(e && e.message || e).slice(0, 200) });
  }
}
