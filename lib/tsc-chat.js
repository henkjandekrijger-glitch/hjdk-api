// Chat bovenaan elke pagina van todayin surgery (Henkjan 14 nov 2026: "chat ... heel prominent en volkomen lerend voor onze content en voor alle
// volgende mensen"). Zo leert hij:
// 1. Tik op een voorbeeldvraag: vast antwoord uit de FAQ van de pagina (geen AI) en een tel per vraag (tsc:tik:<slug>). De volgorde van de
//    voorbeeldvragen op de pagina volgt die tellen: wat mensen het meest willen weten staat bovenaan (lib/tsc.js chips).
// 2. Eigen vraag: Claude Haiku rechtstreeks (eigen sleutel ANTHROPIC_API_KEY, geen Gateway) met ALLEEN de tekst van onze pagina's en bronnen.
//    Elke vraag gaat in tsc:vragen (laatste 1000). Weet hij het niet uit onze pagina's, dan gaat de vraag in tsc:open.
// 3. De dagelijkse Claude-taak (14:07 UTC) leest /surgery/vragen (alleen op de beschermde host), zoekt bij open vragen een echte bron en zet het
//    antwoord als FAQ of sectie in lib/tsc-data.js. Daarna beantwoordt de pagina die vraag voor iedereen, ook in Google en AI-assistenten.
// Grenzen: geen gezondheidsgegevens vragen of bewaren (vragen worden zonder IP of adres opgeslagen), geen persoonlijk medisch advies,
// zeggen dat het een AI is, hoogstens 800 AI-antwoorden per dag en 20 per IP per dag.
import { createHash } from 'node:crypto';
import { kv } from './db.js';
import { berichten, HAIKU } from './ai.js';
import { SITE, SRC, PAGES, CHECK } from './tsc-data.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const kort = (t, n) => String(t == null ? '' : t).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const dag = () => new Date().toISOString().slice(0, 10);
const zonderBron = t => String(t).replace(/\s*\[[a-zA-Z0-9]+\]/g, '');
const bronnenIn = t => [...String(t).matchAll(/\[([a-zA-Z0-9]+)\]/g)].map(m => m[1]).filter(k => SRC[k]);

// alle kennis als platte tekst: eerst de pagina waar de bezoeker is, dan de rest kort
function tekstVan(slug, pg) {
  const r = [pg.h1, zonderBron(pg.kort)];
  for (const s of pg.secties || []) { r.push(s.h + ': ' + (s.p || []).map(zonderBron).join(' ')); if (s.l) r.push(s.l.map(zonderBron).join(' ')); }
  for (const f of pg.faq || []) r.push('V: ' + f.q + ' A: ' + f.a);
  const br = [...new Set([pg.kort, ...(pg.secties || []).flatMap(s => [...(s.p || []), ...(s.l || [])])].flatMap(bronnenIn))];
  return 'PAGINA ' + slug + '\n' + r.join('\n') + (br.length ? '\nBRONNEN: ' + br.map(k => SRC[k].t).join('; ') : '');
}
function kennis(slug) {
  const hier = PAGES[slug] ? tekstVan(slug, PAGES[slug]) : '';
  const rest = Object.entries(PAGES).filter(([s]) => s !== slug).map(([s, p]) => tekstVan(s, p)).join('\n\n');
  const chk = Object.entries(CHECK).map(([k, c]) => 'PAGINA check-surgeon-' + k + '\nHow to check a plastic surgeon in ' + c.land + ': ' + zonderBron(c.kort) + ' Steps: ' + c.stappen.map(zonderBron).join(' ') + ' Risks: ' + c.risico.map(zonderBron).join(' ')).join('\n\n');
  return (hier ? 'DE PAGINA VAN DE BEZOEKER\n' + hier + '\n\n' : '') + 'ANDERE PAGINA\'S\n' + rest + '\n\n' + chk;
}

const TAAL = { en: 'English', nl: 'Nederlands', de: 'Deutsch' };
const NIET = {
  en: 'I do not have a sourced answer to that yet. We are looking it up; leave your email below and you get the answer in the morning mail.',
  nl: 'Daar heb ik nog geen antwoord met bron op. We zoeken het uit; laat hieronder je e-mail achter, dan krijg je het antwoord in de ochtendmail.',
  de: 'Darauf habe ich noch keine Antwort mit Quelle. Wir suchen sie heraus; tragen Sie unten Ihre E-Mail ein, dann kommt die Antwort mit der Morgenmail.'
};
const DRUK = { en: 'Too many questions right now. Try again later.', nl: 'Even te veel vragen tegelijk. Probeer het straks opnieuw.', de: 'Gerade zu viele Fragen. Bitte später noch einmal.' };

export async function tscTik(slug, i) {
  const k = 'tsc:tik:' + String(slug).slice(0, 80); await kv.raw(['HINCRBY', k, String(N(i)), '1']).catch(() => null);
  await kv.raw(['HINCRBY', 'tsc:d:' + dag(), 'tik', '1']).catch(() => null); await kv.raw(['EXPIRE', 'tsc:d:' + dag(), String(120 * 86400)]).catch(() => null);
}
export async function tikTellen(slug) {
  let h = []; try { h = await kv.raw(['HGETALL', 'tsc:tik:' + String(slug).slice(0, 80)]); } catch (e) {}
  const o = {}; if (Array.isArray(h)) for (let i = 0; i + 1 < h.length; i += 2) o[h[i]] = N(h[i + 1]); else Object.assign(o, h || {}); return o;
}

export async function tscVraag({ vraag, slug, taal, hist, ip, test }) {
  taal = TAAL[taal] ? taal : 'en'; slug = PAGES[slug] || /^check-surgeon-/.test(String(slug)) || slug === '' ? String(slug || '') : '';
  const v = kort(vraag, 500); if (v.length < 3) return { ok: false, fout: 'leeg' };
  const d = dag();
  if (!test) {
    const ih = createHash('sha256').update('tsc|' + String(ip || '')).digest('hex').slice(0, 16);
    const tot = N(await kv.raw(['INCR', 'tsc:ai:' + d]).catch(() => 0)); await kv.raw(['EXPIRE', 'tsc:ai:' + d, '172800']).catch(() => null);
    const per = N(await kv.raw(['INCR', 'tsc:ip:' + ih + ':' + d]).catch(() => 0)); await kv.raw(['EXPIRE', 'tsc:ip:' + ih + ':' + d, '172800']).catch(() => null);
    if (tot > 800 || per > 20) return { ok: true, a: DRUK[taal], limiet: true };
    await kv.raw(['HINCRBY', 'tsc:d:' + d, 'vraag', '1']).catch(() => null); await kv.raw(['EXPIRE', 'tsc:d:' + d, String(120 * 86400)]).catch(() => null);
  }
  const h = (Array.isArray(hist) ? hist : []).slice(-6).map(x => (x && x[0] === 'k' ? 'Assistant: ' : 'Visitor: ') + kort(x && x[1], 400)).join('\n');
  const system = 'You answer visitors of ' + SITE.name + ' (' + SITE.base + '), an independent guide to the cost of surgery at home and abroad, how to check a surgeon and what insurance pays. You are an AI assistant.\n' +
    'Rules:\n- Answer in ' + TAAL[taal] + ', in at most 3 short sentences, plain words, no lists, no dashes.\n' +
    '- Use ONLY the facts in the pages below. Never invent prices, names, clinics, laws or numbers. Name the source in a few words when you give a number (for example: according to ASPS).\n' +
    '- Never give personal medical advice: do not say whether a procedure is safe or right for this person, do not ask about their health, body, age or medicines. For that, tell them to ask a surgeon or their own doctor.\n' +
    '- Never recommend a specific clinic or surgeon. You may explain how to check one.\n' +
    '- If the pages do not contain the answer, say so honestly and set weet to false.\n' +
    '- Add the slug of the most useful page for this question in pagina (one of the PAGINA names below), or an empty string.\n' +
    'Reply with JSON only: {"a":"answer","weet":true,"pagina":"slug"}\n\n' + kennis(slug);
  const user = (h ? 'Conversation so far:\n' + h + '\n\n' : '') + 'New question: ' + v;
  let j = null, fout = '';
  try {
    const r = await berichten({ fn: 'tsc-chat', model: HAIKU, system, user, max: 350, timeout: 20000, directKey: process.env.ANTHROPIC_API_KEY, cacheTtl: 6 * 3600 });
    const m = String(r.txt || '').match(/\{[\s\S]*\}/); j = m ? JSON.parse(m[0]) : null;
  } catch (e) { fout = String(e.message || e).slice(0, 80); }
  const weet = !!(j && j.a && j.weet !== false);
  const pagina = j && (PAGES[j.pagina] || /^check-surgeon-[a-z-]+$/.test(String(j.pagina || ''))) ? String(j.pagina) : '';
  const rij = JSON.stringify({ t: Date.now(), v: v.slice(0, 300), s: slug, taal, weet, a: kort(j && j.a, 400) });
  if (!test) {
    await kv.raw(['LPUSH', 'tsc:vragen', rij]).catch(() => null); await kv.raw(['LTRIM', 'tsc:vragen', '0', '999']).catch(() => null);
    if (!weet) { await kv.raw(['LPUSH', 'tsc:open', rij]).catch(() => null); await kv.raw(['LTRIM', 'tsc:open', '0', '299']).catch(() => null); await kv.raw(['HINCRBY', 'tsc:d:' + d, 'open', '1']).catch(() => null); }
  }
  return { ok: true, a: weet ? kort(j.a, 700) : NIET[taal], weet, pagina, ...(fout ? { fout } : {}) };
}

// voor de dagelijkse Claude-taak en de stand: laatste vragen, open vragen, tellingen per dag
export async function tscVragen(n = 200) {
  const lees = async k => { let l = []; try { l = await kv.raw(['LRANGE', k, '0', String(n - 1)]); } catch (e) {} return (Array.isArray(l) ? l : []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean); };
  const [vragen, open] = await Promise.all([lees('tsc:vragen'), lees('tsc:open')]);
  return { vragen, open };
}
export async function tscWisOpen(begin) { // na verwerking: open vragen die met deze tekst beginnen weghalen
  let l = []; try { l = await kv.raw(['LRANGE', 'tsc:open', '0', '299']); } catch (e) {} let n = 0;
  for (const x of Array.isArray(l) ? l : []) { let v = ''; try { v = JSON.parse(x).v || ''; } catch (e) {} if (v.toLowerCase().startsWith(String(begin).toLowerCase())) { await kv.raw(['LREM', 'tsc:open', '0', x]).catch(() => null); n++; } }
  return { gewist: n };
}
