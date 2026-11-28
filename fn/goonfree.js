// GoonFree 2.0 (app, overgenomen 27 nov 2026; repo henkjandekrijger-glitch/goonfree). Openbaar via https://keuzehulp.best/api/goonfree
//   POST ?op=coach  { d, l, m:[{r:'u'|'c',t}], ctx:{dagen,uur,drangen,waarom,plannen,triggers,terugval,piek,geloof,land} } -> { t }
//                   AI-coach bij een drang die de gebruiker kent (Haiku, eigen sleutel eerst, gateway als terugval). Alles komt van het toestel, niets wordt bewaard.
//   POST ?op=inzicht { d, l, ctx:{...zelfde, week:{drang,gehaald,daling,terugval,checkins}} } -> { t }  weekinzicht: 3 korte zinnen, hoogstens 3 per toestel per dag
//   POST ?op=ev     { d, e, p, os, v, l } -> { ok }  elke stap in de app telt (Clickmind-principe), tellers per dag, unieke toestellen (HyperLogLog)
//   GET  ?op=stand[&dagen=7][&vorm=tekst]  tellers per dag voor dashboard en rondes
//   Kracht (Henkjan 28 nov 2026: concurrenten wegblazen met iets wat nog niet vertoond is): echte mensen op het moment zelf.
//   POST ?op=kracht {d,l,k,dag}  iemand vanaf dag 7 stuurt kracht (vaste zinnen k1..k8, geen vrije tekst, dus veilig); hoogstens 10 per toestel per dag
//   GET  ?op=kracht&l=nl&d=..  bij de rode knop: het nieuwste bericht van een ander (liefst van de laatste 30 minuten) {id,k,dag,min}
//   POST ?op=kracht_hielp {id}  de ontvanger won: de afzender hoort dat zijn kracht hielp (helper-therapie: helpen helpt de helper)
//   GET  ?op=kracht_stand&d=..  {hielp, week, nuZwaar}: hoe vaak jouw kracht hielp en hoeveel mensen het in de laatste 15 minuten zwaar hadden
//   GET  ?op=wij&f=f1..f6  Samen (Henkjan 28 nov 2026: "Kunnen we app zelf ook laten leren en deze feedback in de app meteen terug geven"):
//        anonieme cijfers van iedereen voor de fase van de gebruiker: hoeveel mensen nu in die fase zitten, hoeveel % met de knop wint
//        en hoeveel de drang zakt, piekuren, welke plannen het best standhouden, wat het vaakst voor een terugval kwam.
//        Alleen tellingen (geen tekst); een getal onder MIN gaat niet mee. 10 minuten in kv bewaard zodat het de app nooit vertraagt.
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
Sometimes the user does not have an urge but asks help with today's lesson task (the message starts like "Help me with this:").
Then make it small and practical: ask what makes it hard for them (the moment, something they need, or forgetting), and give
2 or 3 concrete steps for their situation, for example where to charge the phone, a cheap alarm clock, or Do Not Disturb with favourites.
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

// Samen: tellingen per fase (f1 dag 1-3, f2 4-7, f3 8-14, f4 15-30, f5 31-66, f6 67+), per uur, per plan en per hulpmiddel.
const FASEN = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'];
const MIN = 20;
const fase = x => (FASEN.includes(x) ? x : '');
const sleutel = x => String(x || '').replace(/[^a-z0-9_]/gi, '').slice(0, 20);
async function telSamen(e, p, d, dag) {
  const f = fase(p.f), paren = [];
  if (e === 'fase' && f && d) { await kv.raw(['PFADD', 'gf:fase:' + dag + ':' + f, d]); await kv.raw(['EXPIRE', 'gf:fase:' + dag + ':' + f, TTL]).catch(() => {}); return; }
  if (e === 'drang_start') {
    const u = Number(p.uur); if (u >= 0 && u < 24) paren.push(['gf:uur:' + dag + ':' + Math.floor(u), 1]);
    const km = 'gf:nu:' + minuut(Date.now()); const n = await kv.incr(km); if (n === 1) await kv.raw(['EXPIRE', km, 3600]).catch(() => {});
  }
  if (e === 'drang_uitkomst' && typeof p.gehaald === 'boolean') {
    const w = p.gehaald ? 1 : 0, voor = Number(p.voor), na = Number(p.na);
    if (w) paren.push(['gf:w:' + dag + ':all:won', 1]);
    if (f) {
      paren.push(['gf:w:' + dag + ':' + f + ':n', 1]); if (w) paren.push(['gf:w:' + dag + ':' + f + ':won', 1]);
      if (voor >= 1 && voor <= 10 && na >= 1 && na <= 10) { paren.push(['gf:dl:' + dag + ':' + f + ':n', 1], ['gf:dl:' + dag + ':' + f + ':voor', voor], ['gf:dl:' + dag + ':' + f + ':na', na]); }
    }
    const plan = sleutel(p.plan); if (plan) { paren.push(['gf:pl:' + dag + ':' + plan + ':n', 1]); if (w) paren.push(['gf:pl:' + dag + ':' + plan + ':won', 1]); }
  }
  if (e === 'terugval' && Array.isArray(p.k)) p.k.slice(0, 8).map(sleutel).filter(Boolean).forEach(k => paren.push(['gf:tr:' + dag + ':' + k, 1]));
  if (!paren.length) return;
  const r = await kv.incrMany(paren);
  await Promise.all(paren.map(([k, n], i) => (Number(r[i]) === n ? kv.raw(['EXPIRE', k, TTL]) : null)).filter(Boolean)).catch(() => {});
}

// Kracht: berichten in een lijst per taal, de afzender alleen als sleutel voor de terugmelding.
const KRACHT = ['k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'k7', 'k8'];
const taal = x => (['nl', 'en', 'de'].includes(x) ? x : 'en');
const minuut = t => new Date(t).toISOString().slice(0, 16).replace(/[-T:]/g, '');
async function krachtZet(req, res) {
  const b = lijf(req), d = schoon(b.d, 40), k = String(b.k || ''), dag = Math.max(0, Math.min(5000, Number(b.dag) || 0));
  if (!d || !KRACHT.includes(k) || dag < 7) return res.status(400).json({ fout: 'niet geldig' });
  if (d.startsWith('test-')) return res.json({ ok: true, id: 'test', test: true }); // controles komen niet in de echte lijst
  const n = await kv.incr('gf:kr:n:' + DAG() + ':' + d);
  if (n === 1) await kv.raw(['EXPIRE', 'gf:kr:n:' + DAG() + ':' + d, 172800]).catch(() => {});
  if (n > 10) return res.json({ ok: false, grens: true });
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6), l = taal(b.l);
  await kv.raw(['LPUSH', 'gf:kr:' + l, JSON.stringify({ id, k, dag, t: Date.now() })]);
  await kv.raw(['LTRIM', 'gf:kr:' + l, '0', '499']);
  await kv.set('gf:kr:door:' + id, d, { ex: 30 * 86400 });
  await kv.incr('gf:ev:' + DAG() + ':kracht_gestuurd').catch(() => {});
  return res.json({ ok: true, id });
}
async function krachtHaal(req, res) {
  const l = taal(req.query.l), d = schoon(req.query.d, 40);
  const lijst = (await kv.raw(['LRANGE', 'gf:kr:' + l, '0', '199']).catch(() => [])) || [];
  const items = lijst.map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean);
  if (!items.length) return res.json({});
  const vers = items.filter(x => Date.now() - x.t < 30 * 60000);
  const pool = vers.length ? vers : items;
  for (let i = 0; i < 4; i++) {
    const x = pool[Math.floor(Math.random() * pool.length)];
    const door = d ? await kv.get('gf:kr:door:' + x.id).catch(() => null) : null;
    if (door && String(door).startsWith('test-')) continue; // testberichten nooit tonen
    if (door && String(door) === d && pool.length > 1) continue;
    return res.json({ id: x.id, k: x.k, dag: x.dag, min: Math.max(1, Math.round((Date.now() - x.t) / 60000)) });
  }
  return res.json({});
}
async function krachtHielp(req, res) {
  const b = lijf(req), id = schoon(b.id, 20).replace(/[^a-z0-9]/gi, '');
  const door = id ? await kv.get('gf:kr:door:' + id).catch(() => null) : null;
  if (!door) return res.json({ ok: false });
  const kw = 'gf:kr:hulp:' + door + ':' + DAG();
  const [, n] = await Promise.all([kv.incr('gf:kr:hulp:' + door), kv.incr(kw)]);
  if (n === 1) await kv.raw(['EXPIRE', kw, 8 * 86400]).catch(() => {});
  await kv.incr('gf:ev:' + DAG() + ':kracht_hielp').catch(() => {});
  return res.json({ ok: true });
}
async function krachtStand(req, res) {
  const d = schoon(req.query.d, 40);
  const dagen = [...Array(7)].map((_, i) => new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  const minuten = [...Array(15)].map((_, i) => 'gf:nu:' + minuut(Date.now() - i * 60000));
  const v = await kv.mget(...(d ? ['gf:kr:hulp:' + d, ...dagen.map(x => 'gf:kr:hulp:' + d + ':' + x)] : []), ...minuten);
  const getal = x => Number(x) || 0;
  const uit = {};
  if (d) { uit.hielp = getal(v[0]); uit.week = v.slice(1, 8).reduce((a, x) => a + getal(x), 0); }
  const nu = v.slice(d ? 8 : 0).reduce((a, x) => a + getal(x), 0);
  if (nu >= 3) uit.nuZwaar = nu;
  return res.json(uit);
}

const PLANNEN = ['night', 'morning', 'alone', 'weekend', 'bed', 'toilet', 'desk', 'social', 'stress', 'bored', 'lonely', 'tired', 'sad', 'horny'];
async function wij(req, res) {
  const f = fase(req.query.f) || 'f1', ck = 'gf:wij:' + f;
  const oud = await kv.get(ck).catch(() => null);
  if (oud && oud.t > Date.now() - 600000) return res.json(oud);
  const dagen = [...Array(14)].map((_, i) => new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  const week = dagen.slice(0, 7);
  const [nu, iedereen] = await Promise.all([
    kv.raw(['PFCOUNT', 'gf:fase:' + dagen[0] + ':' + f, 'gf:fase:' + dagen[1] + ':' + f]).catch(() => 0),
    kv.raw(['PFCOUNT', ...FASEN.flatMap(x => ['gf:fase:' + dagen[0] + ':' + x, 'gf:fase:' + dagen[1] + ':' + x])]).catch(() => 0),
  ]);
  const ks = [];
  week.forEach(d => { ks.push('gf:w:' + d + ':' + f + ':n', 'gf:w:' + d + ':' + f + ':won', 'gf:dl:' + d + ':' + f + ':n', 'gf:dl:' + d + ':' + f + ':voor', 'gf:dl:' + d + ':' + f + ':na'); for (let h = 0; h < 24; h++) ks.push('gf:uur:' + d + ':' + h); PLANNEN.forEach(k => ks.push('gf:tr:' + d + ':' + k)); });
  dagen.forEach(d => PLANNEN.forEach(k => ks.push('gf:pl:' + d + ':' + k + ':n', 'gf:pl:' + d + ':' + k + ':won')));
  ks.push('gf:w:' + dagen[0] + ':all:won');
  const v = await kv.mget(...ks), m = {};
  ks.forEach((k, i) => { m[k] = Number(v[i]) || 0; });
  const som = fn => week.reduce((a, d) => a + fn(d), 0);
  const n = som(d => m['gf:w:' + d + ':' + f + ':n']), won = som(d => m['gf:w:' + d + ':' + f + ':won']);
  const dn = som(d => m['gf:dl:' + d + ':' + f + ':n']);
  const uren = [...Array(24)].map((_, h) => som(d => m['gf:uur:' + d + ':' + h]));
  const urenTot = uren.reduce((a, b) => a + b, 0);
  const plannen = PLANNEN.map(k => { const pn = dagen.reduce((a, d) => a + m['gf:pl:' + d + ':' + k + ':n'], 0), pw = dagen.reduce((a, d) => a + m['gf:pl:' + d + ':' + k + ':won'], 0); return { k, n: pn, pct: pn ? Math.round((pw / pn) * 100) : 0 }; })
    .filter(x => x.n >= MIN).sort((a, b) => b.pct - a.pct);
  const trig = PLANNEN.map(k => ({ k, n: som(d => m['gf:tr:' + d + ':' + k]) })).filter(x => x.n >= MIN).sort((a, b) => b.n - a.n).slice(0, 3).map(x => x.k);
  const vandaag = m['gf:w:' + dagen[0] + ':all:won'];
  const uit = { t: Date.now(), f };
  if (Number(nu) >= MIN) uit.nu = Number(nu);
  if (Number(iedereen) >= MIN) uit.iedereen = Number(iedereen);
  if (n >= MIN) uit.winPct = Math.round((won / n) * 100);
  if (dn >= MIN) { uit.voor = Math.round((som(d => m['gf:dl:' + d + ':' + f + ':voor']) / dn) * 10) / 10; uit.na = Math.round((som(d => m['gf:dl:' + d + ':' + f + ':na']) / dn) * 10) / 10; }
  if (urenTot >= MIN) uit.piek = uren.indexOf(Math.max(...uren));
  if (plannen.length) uit.plannen = plannen.slice(0, 5);
  if (trig.length) uit.triggers = trig;
  if (vandaag >= MIN) uit.vandaag = vandaag;
  await kv.set(ck, uit, { ex: 900 }).catch(() => {});
  return res.json(uit);
}

async function ev(req, res) {
  const b = lijf(req), e = schoon(b.e, 40).replace(/[^a-z0-9_]/gi, ''), d = schoon(b.d, 40), dag = DAG();
  if (!e) return res.status(400).json({ fout: 'geen e' });
  const k = 'gf:ev:' + dag + ':' + e;
  const n = await kv.incr(k);
  if (n === 1) await kv.raw(['EXPIRE', k, TTL]).catch(() => {});
  if (d) await kv.raw(['PFADD', 'gf:dev:' + dag, d]).then(() => kv.raw(['EXPIRE', 'gf:dev:' + dag, TTL])).catch(() => {});
  if (e === 'drang_uitkomst' && b.p && typeof b.p.gehaald === 'boolean') await kv.incr('gf:ev:' + dag + ':drang_' + (b.p.gehaald ? 'gehaald' : 'verloren')).catch(() => {});
  if (b.p && typeof b.p === 'object') await telSamen(e, b.p, d, dag).catch(() => {});
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
    if (op === 'wij') return await wij(req, res);
    if (op === 'kracht' && req.method === 'POST') return await krachtZet(req, res);
    if (op === 'kracht') return await krachtHaal(req, res);
    if (op === 'kracht_hielp' && req.method === 'POST') return await krachtHielp(req, res);
    if (op === 'kracht_stand') return await krachtStand(req, res);
    if (op === 'stand') return await stand(req, res);
    if (op === 'gezond') return res.json({ ok: true, app: 'goonfree', v: 1 });
    return res.status(404).json({ fout: 'onbekende op' });
  } catch (e) {
    return res.status(500).json({ fout: String(e && e.message || e).slice(0, 200) });
  }
}
