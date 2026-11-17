// Intentiechat op alle keuzehulpen (keuzehulp.best, whichtobuy.best, kaufberater.best). Henkjan 16 nov 2026: "ontwerp deze zelf lerende zelf
// reparerende hyper intelligente intent chat ook gericht op mensen om je heen" en "ja zeker" op bouwen op de WAM-motor, "Leer van elkaar".
// Van WAM overgenomen (lib/wam-overdracht.js, lessen 13 tot 16 nov): terugbereiken is het lek, dus na een antwoord eerst één tik op de
// hoogte blijven (push waar de site dat heeft); delen alleen rond een echte samen-beslissing; geen antwoord zonder bron; veiligheidsfilter
// en tempo (lib/wam-leer.js veilig, tempoOk); vaste dagkosten (KZ_CHAT_PLAFOND, standaard $3).
// Zelfreparerend: valt de AI uit (fout, geen sleutel, plafond), dan antwoordt een woordzoeker uit de eigen pagina. Elke vraag wordt een intentie
// (lib/intentie.js) met wat, voor wie, budget, wanneer en of het een samen-beslissing is; onbeantwoorde vragen in kz:chat:open voor de nachtronde.
import { createHash } from 'node:crypto';
import { kv } from './db.js';
import { berichten, HAIKU } from './ai.js';
import { intentieLog } from './intentie.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const kort = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
const dag = () => new Date().toISOString().slice(0, 10);
const TAAL = { nl: 'Dutch', us: 'English', de: 'German' };
const HOST = { nl: 'keuzehulp.best', us: 'whichtobuy.best', de: 'kaufberater.best' };
const NIET = { nl: 'Dat staat nog niet op onze pagina\'s. Je vraag staat nu op de lijst; we zoeken het uit.', us: 'That is not on our pages yet. Your question is on our list now and we will look into it.', de: 'Das steht noch nicht auf unseren Seiten. Deine Frage steht jetzt auf unserer Liste, wir kümmern uns darum.' };
const DRUK = { nl: 'Het is even druk. Stel je vraag over een paar minuten opnieuw.', us: 'It is busy right now. Please ask again in a few minutes.', de: 'Gerade ist viel los. Frag bitte in ein paar Minuten noch einmal.' };
const PLAFOND = () => Number(process.env.KZ_CHAT_PLAFOND || 3);
const STOP = new Set('de het een en of voor met van in op je jij bij wat hoe welke welk is zijn the a an and or for with of to what which how do does is are der die das ein eine und oder für mit von zu was wie welche ist ich my mijn mein kan can kann'.split(' '));
const woorden = s => String(s || '').toLowerCase().replace(/[^a-z0-9à-ÿ ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));

// alle keuzehulpen van een site (NL uit api/kz.js, US/DE uit lib/wtb.js), 10 minuten in het geheugen
const CACHE = {};
async function alle(site) {
  const c = CACHE[site]; if (c && Date.now() - c.at < 600000) return c.l;
  let l = [];
  if (site === 'nl') { const { allItems } = await import('../api/kz.js'); l = await allItems(); try { const R = await import('./rdam.js'); l = l.concat(await R.chatItems()); } catch (e) {} }
  else { const W = await import('./wtb.js'); l = await W.items(W.MARKETS[site]); }
  CACHE[site] = { at: Date.now(), l }; return l;
}

// wat de chat weet: de pagina zelf (kort antwoord, uitleg, fouten, vragen, FAQ), de producten met prijs van vandaag per situatie (NL) en de
// keuzehulpen die het best bij de vraag passen uit de hele catalogus (les curacao.day: de chat kent de hele catalogus)
async function kennis(site, it, vraag, all) {
  const r = [];
  if (it) {
    r.push('THIS PAGE (slug ' + it.slug + '): ' + kort(it.title || it.h1, 140));
    if (it.kort) r.push('Short answer: ' + kort(it.kort, 700));
    if (it.uitleg || it.guide) r.push('What matters: ' + kort(it.uitleg || it.guide, 1500));
    const fouten = it.fouten || it.mistakes; if (fouten && fouten.length) r.push('Common mistakes: ' + fouten.slice(0, 6).map(x => kort(x, 160)).join(' | '));
    (it.questions || []).forEach((q, i) => r.push('Choice question ' + (i + 1) + ': ' + kort(q.q, 120) + ' Options: ' + (q.options || []).map(o => kort(o.label, 60)).join(' / ')));
    (it.faq || []).slice(0, 10).forEach(f => r.push('FAQ: ' + kort(f.q, 160) + ' Answer: ' + kort(f.a, 500)));
    if (site === 'nl') { try { const t = await kv.get('hjdk:kz:sit:' + it.slug); if (t && t.rijen) r.push('Products by situation, price at bol.com on ' + t.dag + ': ' + t.rijen.slice(0, 12).map(x => kort(x.situatie, 60) + ' -> ' + kort(x.product, 70) + ' EUR ' + Number(x.prijs).toFixed(2)).join(' | ')); } catch (e) {} }
  }
  const q = woorden(vraag); const sc = all.filter(x => x && x.slug && (!it || x.slug !== it.slug)).map(x => { const w = new Set(woorden((x.term || '') + ' ' + x.slug.replace(/-/g, ' ') + ' ' + (x.title || ''))); return { x, s: q.filter(z => w.has(z)).length }; }).filter(o => o.s > 0).sort((a, b) => b.s - a.s).slice(0, 12);
  if (sc.length) r.push('OTHER GUIDES ON THIS SITE (slug: title: short answer): ' + sc.map(o => o.x.slug + ': ' + kort(o.x.title, 90) + ': ' + kort(o.x.kort || o.x.intro, 160)).join(' | '));
  return r.join('\n');
}

// woordzoeker zonder AI (zelfreparatie): beste FAQ of kort antwoord van deze pagina, anders de best passende andere keuzehulp
function zoek(vraag, it, all) {
  const q = woorden(vraag); if (!q.length) return null;
  const tw = new Set(woorden(it && (it.term || it.title))); const qq = q.filter(w => !tw.has(w)); if (!qq.length) return null;
  let best = null;
  for (const f of (it && it.faq) || []) { const w = new Set(woorden(f.q + ' ' + f.a)); const s = qq.filter(x => w.has(x)).length + qq.filter(x => woorden(f.q).includes(x)).length; if (s >= 3 && (!best || s > best.s)) best = { s, a: kort(f.a, 600), pagina: '' }; }
  if (best) return best;
  for (const x of all) { if (it && x.slug === it.slug) continue; const w = new Set(woorden((x.term || '') + ' ' + x.slug.replace(/-/g, ' ') + ' ' + (x.title || ''))); const s = qq.filter(z => w.has(z)).length; if (s >= 2 && (!best || s > best.s)) best = { s, a: kort(x.kort || x.intro, 500), pagina: x.slug }; }
  return best;
}

export async function kzChat({ site, slug, vraag, hist, ip, oidc, test }) {
  site = HOST[site] ? site : 'nl'; const v = kort(vraag, 400); if (v.length < 2) return { ok: false, fout: 'leeg' };
  const d = dag();
  try { const { veilig } = await import('./wam-leer.js'); const vg = veilig(v); if (vg) return { ok: true, a: NIET[site], weet: false, geblokt: true }; } catch (e) {}
  if (!test) {
    const ih = createHash('sha256').update('kzc|' + String(ip || '')).digest('hex').slice(0, 16);
    const per = N(await kv.raw(['INCR', 'kz:chat:ip:' + ih + ':' + d]).catch(() => 0)); await kv.raw(['EXPIRE', 'kz:chat:ip:' + ih + ':' + d, '172800']).catch(() => null);
    if (per > 25) return { ok: true, a: DRUK[site], limiet: true };
    await kv.raw(['HINCRBY', 'kz:chat:d:' + d, site + ':vraag', '1']).catch(() => null); await kv.raw(['EXPIRE', 'kz:chat:d:' + d, String(90 * 86400)]).catch(() => null);
  }
  const all = await alle(site).catch(() => []); const it = all.find(x => x.slug === slug) || null;
  const h = (Array.isArray(hist) ? hist : []).slice(-6).map(x => (x && x[0] === 'k' ? 'Assistant: ' : 'Visitor: ') + kort(x && x[1], 300)).join('\n');
  const kost = N(await kv.raw(['HGET', 'kz:chat:kost', d]).catch(() => 0));
  let j = null, fout = '';
  if ((!process.env.ANTHROPIC_API_KEY && !oidc) || kost >= PLAFOND() * 1e6) { const z = zoek(v, it, all); j = z ? { a: z.a, weet: true, pagina: z.pagina } : { weet: false }; fout = kost >= PLAFOND() * 1e6 ? 'plafond' : 'zonder-ai'; }
  else {
    const system = 'You are the chat on ' + HOST[site] + ', an independent buying-guide site. You help a visitor choose, and you find out what they really want.\n' +
      'Rules:\n- Answer in ' + TAAL[site] + ', at most 3 short sentences, plain words, no lists, no dashes, no words in capitals.\n' +
      '- Use ONLY the facts below. Never invent products, prices, brands, numbers or shops. Give a price only with its date as shown.\n' +
      '- If another guide below fits the question better, say so and put its slug in pagina. Otherwise pagina is an empty string.\n' +
      '- If the facts do not answer the question, say that honestly and set weet to false.\n' +
      '- Then ask at most ONE short follow-up question, only if the answer to it changes the advice (who it is for, budget, when needed, size or use). Give 2 or 3 short tappable answers for it in opties (max 4 words each).\n' +
      '- Fill intentie from what the visitor said only: wat (the product or service), voorWie (self, a named relation like mother, a group like family or team), budget, wanneer. Empty string when unknown.\n' +
      '- samen is true only when the visitor decides together with others (a shared gift, a family purchase, neighbours, a team).\n' +
      'Reply with JSON only: {"a":"answer","weet":true,"pagina":"","vraag":"","opties":[],"intentie":{"wat":"","voorWie":"","budget":"","wanneer":""},"samen":false}\n\n' + await kennis(site, it, v, all);
    const user = (h ? 'Conversation so far:\n' + h + '\n\n' : '') + 'New message: ' + v;
    try {
      const r = await berichten({ fn: 'kz-chat', model: HAIKU, system, user, max: 450, timeout: 20000, directKey: process.env.ANTHROPIC_API_KEY, oidc: oidc || '', cacheTtl: 6 * 3600 });
      const m = String(r.txt || '').match(/\{[\s\S]*\}/); j = m ? JSON.parse(m[0]) : null;
      await kv.raw(['HINCRBY', 'kz:chat:kost', d, '2000']).catch(() => null);
    } catch (e) { fout = String(e.message || e).slice(0, 80); const z = zoek(v, it, all); if (z) j = { a: z.a, weet: true, pagina: z.pagina }; }
  }
  const weet = !!(j && j.a && j.weet !== false);
  const pagina = j && j.pagina && all.some(x => x.slug === j.pagina) ? String(j.pagina) : '';
  const pTitel = pagina ? kort((all.find(x => x.slug === pagina) || {}).title, 90) : '';
  const opties = (j && Array.isArray(j.opties) ? j.opties : []).map(x => kort(x, 40)).filter(Boolean).slice(0, 3);
  const vervolg = j && j.vraag ? kort(j.vraag, 160) : '';
  const ii = (j && j.intentie) || {}; const samen = !!(j && j.samen);
  if (!test) {
    const rij = JSON.stringify({ t: Date.now(), site, s: slug, v: v.slice(0, 300), weet, p: pagina, i: { wat: kort(ii.wat, 60), voorWie: kort(ii.voorWie, 40), budget: kort(ii.budget, 30), wanneer: kort(ii.wanneer, 30) }, samen, f: fout });
    await kv.raw(['LPUSH', 'kz:chat:log', rij]).catch(() => null); await kv.raw(['LTRIM', 'kz:chat:log', '0', '1999']).catch(() => null);
    if (!weet) { await kv.raw(['LPUSH', 'kz:chat:open', rij]).catch(() => null); await kv.raw(['LTRIM', 'kz:chat:open', '0', '499']).catch(() => null); await kv.raw(['HINCRBY', 'kz:chat:d:' + d, site + ':open', '1']).catch(() => null); }
    if (samen) await kv.raw(['HINCRBY', 'kz:chat:d:' + d, site + ':samen', '1']).catch(() => null);
    await intentieLog(kv, { q: v, site, slug, m: weet ? 1 : 0, bron: 'chat' }, { headers: { 'x-forwarded-for': ip || '' } }).catch(() => null);
  }
  const pad = pagina ? ((all.find(x => x.slug === pagina) || {}).pad || '') : '';
  return { ok: true, a: weet ? kort(j.a, 700) : NIET[site], weet, pagina, pad, pTitel, vervolg, opties, samen, ...(fout ? { fout } : {}) };
}

// stand voor de nachtronde en het dagrapport: tellers per dag, laatste vragen en open vragen (alleen beschermde host)
export async function kzChatStand(vol) {
  const paren = h => { if (!h) return {}; if (!Array.isArray(h)) return h; const o = {}; for (let i = 0; i + 1 < h.length; i += 2) o[String(h[i])] = h[i + 1]; return o; };
  const dagen = []; for (let i = 0; i < 7; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); dagen.push({ dag: d, ...paren(await kv.raw(['HGETALL', 'kz:chat:d:' + d]).catch(() => null)), kostUsd: N(await kv.raw(['HGET', 'kz:chat:kost', d]).catch(() => 0)) / 1e6 }); }
  const lees = async k => ((await kv.raw(['LRANGE', k, '0', '99']).catch(() => [])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean);
  return { ok: true, plafondUsd: PLAFOND(), dagen, ...(vol ? { laatst: await lees('kz:chat:log'), open: await lees('kz:chat:open') } : {}) };
}
