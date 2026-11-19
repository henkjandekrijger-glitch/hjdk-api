// Geven (Henkjan 19 nov 2026: "Doe iedere dag minimaal 20 van deze reacties altijd echt geven . Mag nooit spamachtig zijn . Geven geven geven ."
// en "Doe dit onafhankelijk van account dus via vercel ." en "Als je AI gateway gebruik gebruik goedkoopste methode ."):
// elk uur zoekt de cloud echte, onbeantwoorde vragen over Curaçao, haalt het antwoord uit de eigen chat van curacao.day (eigen data,
// en een webzoektocht met bronnen als de data het niet heeft), laat het goedkoopste model (Haiku, model via de opruimlus) er een kort,
// menselijk forumantwoord van maken met alleen die feiten, en plaatst het waar dat via een API kan (Reddit, zodra de sleutels in Vercel
// staan). Waar geen API is (Tripadvisor) blijft het een concept in de rij. Elk geplaatst antwoord gaat naar Clickmind (lib/distlus.js).
import { kv } from './db.js';
import { berichten, HAIKU } from './ai.js';
import * as D from './distlus.js';

const UA = 'web:curacao-day-geven:1.0 (helpful answers about Curacao)';
const DAG_DOEL = 20, PER_BRON = 10, PER_RONDE = 4, GEZIEN_DAGEN = 30;
const vandaag = () => new Date().toISOString().slice(0, 10);
const kort = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
const VRAAG = /\?|\b(any|anyone|recommend|recommendation|tips?|advice|where|which|what|how|should|best|worth|is it|can i|do i|wat|waar|hoe|welke|tips|dónde|donde|qué|cual|cuál|recomend|wo|welche|empfehl)\b/i;

function taalVan(t) {
  const s = ' ' + String(t).toLowerCase() + ' ';
  const tel = re => (s.match(re) || []).length;
  const sc = { nl: tel(/ (de|het|een|naar|wij|jullie|niet|ook|waar|hoe) /g), es: tel(/ (el|la|los|que|para|una|dónde|cómo|qué) /g), de: tel(/ (der|die|und|nicht|ich|wir|nach|wo|wie) /g), pt: tel(/ (não|você|uma|para|onde|como|os|as) /g), en: tel(/ (the|and|is|to|we|are|what|where|how|for) /g) };
  return Object.entries(sc).sort((a, b) => b[1] - a[1])[0][1] > 0 ? Object.entries(sc).sort((a, b) => b[1] - a[1])[0][0] : 'en';
}

// --- vinden ---------------------------------------------------------------
async function redditVragen() {
  const uit = [];
  for (const u of ['https://www.reddit.com/r/curacao/new.json?limit=40', 'https://www.reddit.com/search.json?q=curacao&sort=new&t=week&limit=40']) {
    try {
      const r = await fetch(u, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(8000) }); if (!r.ok) continue;
      const j = await r.json();
      for (const c of (j.data && j.data.children) || []) {
        const d = c.data || {}; const tekst = (d.title || '') + ' ' + (d.selftext || '');
        if (!/cura[cç]ao/i.test(tekst) && d.subreddit !== 'curacao') continue;
        if (d.over_18 || d.locked || d.archived || d.removed_by_category) continue;
        if ((Date.now() / 1000 - d.created_utc) > 3 * 86400 || (d.num_comments || 0) > 1 || !VRAAG.test(tekst)) continue;
        uit.push({ bron: 'reddit', id: 'rd:' + d.id, thing: d.name, url: 'https://www.reddit.com' + d.permalink, plek: 'r/' + d.subreddit, titel: kort(d.title, 200), tekst: kort(d.selftext, 1500), reacties: d.num_comments || 0 });
      }
    } catch (e) {}
  }
  if (!uit.length) { // JSON geweigerd vanaf Vercel: de RSS-feed, met het aantal reacties uit wat-leeft van curacao.day (lib/cwleeft.js)
    try {
      const lf = await fetch('https://curacao.day/api/cw?w=leeft', { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(8000) }).then(r => r.json()).catch(() => ({}));
      const nReac = new Map(((lf && lf.reddit) || []).map(x => [String(x.url).replace(/\/$/, ''), x.reacties || 0]));
      for (const u of ['https://www.reddit.com/r/curacao/new/.rss?limit=40', 'https://old.reddit.com/r/curacao/new/.rss?limit=40']) {
        const r = await fetch(u, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(8000) }); if (!r.ok) continue;
        const x = await r.text();
        for (const e of x.split('<entry>').slice(1)) {
          const g = re => (e.match(re) || [])[1] || '';
          const id = g(/<id>t3_([a-z0-9]+)<\/id>/), titel = g(/<title>([\s\S]*?)<\/title>/).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'"), url = g(/<link href="([^"]+)"/).replace(/\/$/, ''), wanneer = Date.parse(g(/<(?:published|updated)>([^<]+)</));
          const tekst = g(/<content[^>]*>([\s\S]*?)<\/content>/).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/<[^>]+>/g, ' ').replace(/submitted by[\s\S]*$/i, '');
          if (!id || !titel || !(Date.now() - wanneer < 3 * 864e5)) continue;
          const reacties = nReac.has(url) ? nReac.get(url) : 0; if (reacties > 1 || !VRAAG.test(titel + ' ' + tekst)) continue;
          uit.push({ bron: 'reddit', id: 'rd:' + id, thing: 't3_' + id, url, plek: 'r/curacao', titel: kort(titel, 200), tekst: kort(tekst, 1500), reacties });
        }
        if (uit.length) break;
      }
    } catch (e) {}
  }
  return uit;
}

async function tripadvisorVragen() {
  const uit = [];
  try {
    const r = await fetch('https://www.tripadvisor.com/ShowForum-g147277-i583-Curacao.html', { headers: { 'user-agent': 'Mozilla/5.0', 'accept-language': 'en' }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return uit;
    const h = await r.text();
    const rijen = h.split(/<tr[\s>]/i).slice(1);
    for (const rij of rijen) {
      const m = rij.match(/href="(\/ShowTopic-g147277-i583-k(\d+)-[^"]+)"[^>]*>([^<]{5,200})</i); if (!m) continue;
      const getallen = [...rij.replace(/<[^>]+>/g, ' ').matchAll(/\s(\d{1,4})\s/g)].map(x => Number(x[1]));
      const reacties = getallen.length ? getallen[0] : 99;
      if (reacties > 1) continue;
      uit.push({ bron: 'tripadvisor', id: 'ta:' + m[2], url: 'https://www.tripadvisor.com' + m[1], plek: 'Tripadvisor Curaçao-forum', titel: kort(m[3].replace(/&amp;/g, '&').replace(/&#39;/g, "'"), 200), tekst: '', reacties });
    }
  } catch (e) {}
  return uit;
}

async function tripadvisorTekst(v) {
  try {
    const r = await fetch(v.url, { headers: { 'user-agent': 'Mozilla/5.0', 'accept-language': 'en' }, signal: AbortSignal.timeout(8000) }); if (!r.ok) return '';
    const h = await r.text(); const m = h.match(/class="[^"]*postBody[^"]*"[^>]*>([\s\S]{20,4000}?)<\/div>/i);
    return m ? kort(m[1].replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'"), 1500) : '';
  } catch (e) { return ''; }
}

// --- antwoorden -----------------------------------------------------------
async function chatFeiten(vraag, taal) {
  try {
    const r = await fetch('https://curacao.day/api/cw', { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': UA },
      body: JSON.stringify({ actie: 'ama', amav: vraag.slice(0, 400), taal }), signal: AbortSignal.timeout(45000) });
    const j = await r.json().catch(() => null);
    if (!j || !j.ok || !j.antwoord || j.bron === 'leemte' || j.maker) return null;
    if (/(we|i) (don'?t|do not) (know|have)|niet gevonden|weet ik niet|no tenemos|haben wir (leider )?nicht|could not find|geen informatie/i.test(j.antwoord)) return null;
    return { feiten: kort(j.antwoord, 1500), bronnen: (j.links || []).map(l => l.url).filter(u => !/curacao\.day/.test(u)).slice(0, 3) };
  } catch (e) { return null; }
}

const SYSTEEM = `You write short, genuinely helpful replies on travel forums for people asking about Curaçao.
Rules:
- Use ONLY facts that appear in FACTS. Never add a fact, price, name, time or opening hour that is not in FACTS.
- Answer the actual question in 2 to 4 plain sentences, in the language of the question.
- Sound like a knowledgeable, friendly person: no emoji, no exclamation marks, no dashes, no lists, no sales tone.
- No links, no website names, no mention of a chat, an app or a newsletter. Never claim you were there yourself.
- If FACTS do not really answer the question, or the question is not a real question about Curaçao, reply exactly: SKIP`;

async function schrijf(v, feiten, taal) {
  const user = `QUESTION TITLE: ${v.titel}\nQUESTION: ${v.tekst || v.titel}\nLANGUAGE: ${taal}\nFACTS: ${feiten}`;
  const a = await berichten({ fn: 'geven', model: HAIKU, system: SYSTEEM, user, max: 300, timeout: 30000 });
  const t = kort(a.txt, 900);
  if (!t || /^SKIP/i.test(t) || /https?:\/\/|www\.|curacao\.day|—|–|!/.test(t) || t.split(' ').length < 12) return null;
  return t;
}

// --- plaatsen ---------------------------------------------------------------
let redditToken = null;
async function redditPlaats(v, tekst) {
  const id = process.env.REDDIT_CLIENT_ID, geheim = process.env.REDDIT_CLIENT_SECRET, gebr = process.env.REDDIT_USERNAME, ww = process.env.REDDIT_PASSWORD;
  if (!id || !geheim || !gebr || !ww) return { ok: false, reden: 'geen reddit-sleutels in Vercel' };
  if (!redditToken || redditToken.tot < Date.now()) {
    const r = await fetch('https://www.reddit.com/api/v1/access_token', { method: 'POST', headers: { authorization: 'Basic ' + Buffer.from(id + ':' + geheim).toString('base64'), 'content-type': 'application/x-www-form-urlencoded', 'user-agent': UA },
      body: new URLSearchParams({ grant_type: 'password', username: gebr, password: ww }) });
    const j = await r.json().catch(() => ({})); if (!j.access_token) return { ok: false, reden: 'reddit-inlog mislukt' };
    redditToken = { t: j.access_token, tot: Date.now() + ((j.expires_in || 3600) - 120) * 1000 };
  }
  const r = await fetch('https://oauth.reddit.com/api/comment', { method: 'POST', headers: { authorization: 'Bearer ' + redditToken.t, 'content-type': 'application/x-www-form-urlencoded', 'user-agent': UA },
    body: new URLSearchParams({ api_type: 'json', thing_id: v.thing, text: tekst }) });
  const j = await r.json().catch(() => ({})); const d = j && j.json && j.json.data && j.json.data.things && j.json.data.things[0] && j.json.data.things[0].data;
  if (!d || (j.json.errors || []).length) return { ok: false, reden: 'reddit weigerde: ' + JSON.stringify((j.json && j.json.errors) || '').slice(0, 120) };
  return { ok: true, url: 'https://www.reddit.com' + (d.permalink || '') };
}

// --- ronde ----------------------------------------------------------------
export async function ronde({ droog = false } = {}) {
  const dag = vandaag(), kDag = 'geven:dag:' + dag, lijst = (await kv.get(kDag).catch(() => null)) || [];
  const geplaatst = lijst.filter(x => x.status === 'geplaatst'), perBron = b => lijst.filter(x => x.bron === b).length;
  if (geplaatst.length >= DAG_DOEL * 1.5) return { ok: true, klaar: true, geplaatst: geplaatst.length };
  const kandidaten = [...await redditVragen(), ...await tripadvisorVragen()];
  const nieuw = [];
  for (const v of kandidaten) { if (nieuw.length >= PER_RONDE) break; if (perBron(v.bron) >= PER_BRON) continue; if (await kv.get('geven:gezien:' + v.id).catch(() => null)) continue; nieuw.push(v); }
  if (droog) return { ok: true, droog: true, dag, gevonden: kandidaten.length, zou_doen: nieuw.map(v => ({ bron: v.bron, url: v.url, titel: v.titel, reacties: v.reacties })), geplaatstVandaag: geplaatst.length };
  const gedaan = [];
  for (const v of nieuw) {
    if (!droog) await kv.set('geven:gezien:' + v.id, 1, { ex: GEZIEN_DAGEN * 86400 }).catch(() => {});
    if (v.bron === 'tripadvisor' && !v.tekst) v.tekst = await tripadvisorTekst(v);
    const taal = taalVan(v.titel + ' ' + v.tekst), vraag = (v.titel + '. ' + v.tekst).slice(0, 400);
    const f = await chatFeiten(vraag, ['nl', 'en', 'es', 'pt', 'de'].includes(taal) ? taal : 'en');
    if (!f) { gedaan.push({ id: v.id, overgeslagen: 'geen zeker antwoord' }); continue; }
    let antwoord = null; try { antwoord = await schrijf(v, f.feiten, taal); } catch (e) { gedaan.push({ id: v.id, overgeslagen: 'ai: ' + String(e.message).slice(0, 80) }); continue; }
    if (!antwoord) { gedaan.push({ id: v.id, overgeslagen: 'past niet' }); continue; }
    const item = { t: Date.now(), id: v.id, bron: v.bron, plek: v.plek, url: v.url, titel: v.titel, taal, antwoord, bronnen: f.bronnen, status: 'concept' };
    if (!droog && v.bron === 'reddit') {
      const p = await redditPlaats(v, antwoord).catch(e => ({ ok: false, reden: String(e.message).slice(0, 80) }));
      if (p.ok) { item.status = 'geplaatst'; item.plekUrl = p.url; } else item.reden = p.reden;
    }
    if (!droog && item.status === 'geplaatst') {
      const d = await D.maak({ project: 'curacao', kanaal: v.bron, plek: v.plek, plekUrl: item.plekUrl || v.url, onderwerp: kort(v.titel, 40), taal, tekst: antwoord, wie: 'geven-cloud', geplaatst: true }).catch(() => null);
      if (d && d.id) item.dist = d.id;
    }
    lijst.unshift(item); gedaan.push({ id: v.id, status: item.status, reden: item.reden });
  }
  if (!droog) await kv.set(kDag, lijst.slice(0, 200), { ex: 40 * 86400 }).catch(() => {});
  return { ok: true, dag, gevonden: kandidaten.length, gedaan, geplaatstVandaag: lijst.filter(x => x.status === 'geplaatst').length, conceptenVandaag: lijst.filter(x => x.status === 'concept').length };
}

export async function stand(dagen = 3) {
  const uit = [];
  for (let i = 0; i < dagen; i++) {
    const dag = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10), l = (await kv.get('geven:dag:' + dag).catch(() => null)) || [];
    uit.push({ dag, geplaatst: l.filter(x => x.status === 'geplaatst').length, concepten: l.filter(x => x.status === 'concept').length, items: l.map(x => ({ bron: x.bron, plek: x.plek, url: x.plekUrl || x.url, titel: x.titel, status: x.status, reden: x.reden, antwoord: x.antwoord })) });
  }
  return { uitleg: 'Geven (Henkjan 19 nov 2026): elk uur echte, onbeantwoorde vragen over Curaçao. Antwoord komt uit de chat van curacao.day (eigen data en bronnen), Haiku maakt er een kort forumantwoord van met alleen die feiten. Reddit wordt geplaatst zodra REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME en REDDIT_PASSWORD in Vercel staan; Tripadvisor heeft geen API en blijft concept. Doel: minstens 20 per dag, hoogstens 10 per plek.', doel: DAG_DOEL, reddit_sleutels: !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_USERNAME), dagen: uit };
}
