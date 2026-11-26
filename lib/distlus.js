// Clickmind distributie: het lerende brein achter elke reactie die we ergens plaatsen (Henkjan 19 nov 2026: "Alleen volkomen gericht replyen vaak
// zelfs niet met link . Dit moet via clickmind link ook zodat korte link en we opbrengst meten . Clickmind moet het lerende brein zijn van onze
// continue distributie .").
// - Elke reactie (Reddit, Facebook-groep, forum, nieuwssite) wordt hier eerst gemeld: kanaal, plek, onderwerp, met of zonder link, de tekst.
// - Met link: een korte link op het eigen domein (curacao.day/d/<code>, of <eigen host>/m/<code>); een klik komt in het
//   klikregister van Clickmind (net = kanaal, camp = dist-<project>, zone = plek, sub = reactie-id) en de pagina krijgt ?mmc=<klik-id>&src=<kanaal>,
//   zodat cm.js en de site het bezoek, de leesduur en een aanmelding aan deze reactie koppelen.
// - Zonder link: de reactie telt ook; uitkomsten (stemmen, antwoorden, iemand die ons noemt) meldt de ronde later met op=distuitkomst.
// - Leren: per kanaal, plek, onderwerp en met/zonder link: kliks, echte mensen en uitkomsten per reactie (/api/mm?op=diststand).
import { randomBytes } from 'node:crypto';
import { kv } from './db.js';
import { verwerkKlik, serverSignalen, dcVan, laterAf } from './mensmeter.js';
import { berichten, HAIKU } from './ai.js';
import * as VM from './videomind.js';

// AI leest elke post (Henkjan 26 nov 2026: "Ja we doen 1 - 3"): het goedkoopste model labelt haak, emotie, belofte en doelgroep, eenmaal per tekst
// (antwoord bewaard op de tekst, dus nooit dubbel betaald). Zo leert Clickmind waarom iets werkt, niet alleen dat het werkt.
const HAKEN_AI = ['probleem', 'nieuwsgierigheid', 'cijfer', 'belofte', 'verhaal', 'vraag', 'zelfspot', 'tip', 'vergelijking'];
const EMOTIES = ['frustratie', 'opluchting', 'humor', 'nieuwsgierig', 'herkenning', 'neutraal'];
const DOELGROEPEN = ['ouders', 'zzp', 'kantoor', 'stellen', 'vrienden', 'ondernemer', 'algemeen'];
const SYS_LABEL = 'Je labelt een social-mediapost. Antwoord met alleen JSON: {"haak":"' + HAKEN_AI.join('|') + '","emotie":"' + EMOTIES.join('|') + '","doelgroep":"' + DOELGROEPEN.join('|') + '","belofte":"wat de lezer krijgt, hooguit 6 woorden, Nederlands"}. Kies per veld precies één waarde uit de lijst.';
export async function labelAI(id) {
  const r = await kv.get('dist:r:' + id); if (!r || !r.tekst || r.ai) return null;
  const a = await berichten({ fn: 'dist-label', model: HAIKU, system: SYS_LABEL, user: 'Soort: ' + (r.soort || '-') + '\nUsecase: ' + (r.onderwerp || '-') + '\nTekst:\n' + r.tekst.slice(0, 900), max: 120, timeout: 20000, cacheTtl: 90 * 86400 }).catch(() => null);
  const m = a && String(a.txt || '').match(/\{[\s\S]*\}/); if (!m) return null;
  let j; try { j = JSON.parse(m[0]); } catch (e) { return null; }
  const ai = { haak: HAKEN_AI.includes(j.haak) ? j.haak : 'anders', emotie: EMOTIES.includes(j.emotie) ? j.emotie : 'anders', doelgroep: DOELGROEPEN.includes(j.doelgroep) ? j.doelgroep : 'anders', belofte: kort(j.belofte, 60) };
  const r2 = await kv.get('dist:r:' + id); if (!r2) return null; r2.ai = ai; await kv.set('dist:r:' + id, r2, { ex: 400 * 86400 }); return ai;
}

const DOELEN = ['curacao.day', 'nexy.now', 'keuzehulp.best', 'whichtobuy.best', 'kaufberater.best', 'nexy.help', 'wearemany.now', 'sealedintent.com', 'gids.kadoly.com']; // domeinen waar /m/<code> of /d/<code> naar Clickmind gaat (nexy.now: clickmind-distribution vercel.json /m/:code -> whichtobuy.best/api/mm?op=distklik, 24 nov 2026)
const KANALEN = ['reddit', 'facebook', 'instagram', 'tiktok', 'x', 'linkedin', 'whatsapp', 'telegram', 'forum', 'nieuwssite', 'quora', 'tripadvisor', 'google', 'youtube', 'mail', 'anders'];
const UITKOMSTEN = ['upvote', 'antwoord', 'bedankt', 'verwijderd', 'genoemd', 'niets'];
const ABC = 'bcdfghjkmnpqrstvwxz23456789';
const kort = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
const vandaag = () => new Date().toISOString().slice(0, 10);
// Kenmerken van de tekst zelf (26 nov 2026, Henkjan: rijkere data per stuk content): gratis, zonder AI, bij elke melding.
// Zo leert Clickmind niet alleen per soort en usecase maar ook welke vorm van tekst werkt: lengte, vraag, getal, wie er spreekt, opening.
export function kenmerken(t) {
  t = String(t || '').trim(); if (!t) return null;
  const eerste = (t.split(/(?<=[.?!])\s|\n/)[0] || '').trim(), w = eerste.split(/\s+/)[0].toLowerCase().replace(/[^a-z']/g, '');
  return {
    lengte: t.length < 90 ? 'kort' : t.length < 200 ? 'middel' : 'lang',
    vraag: /\?/.test(t) ? 'ja' : 'nee',
    getal: /\d/.test(t) ? 'ja' : 'nee',
    spreker: /^(i|my|i'm|ik|mijn)$/.test(w) ? 'ik' : /^(we|our|wij|we're|onze|ons)$/.test(w) ? 'wij' : /^(you|your|jij|je|jouw|u)$/.test(w) ? 'jij' : 'anders',
    opening: /\?$/.test(eerste) ? 'vraag' : /\d/.test(eerste) ? 'getal' : eerste.length < 40 ? 'kort statement' : 'zin'
  };
}

function hostVan(doel) { try { const u = new URL(doel); return u.protocol === 'https:' ? u.hostname.replace(/^www\./, '') : ''; } catch (e) { return ''; } }
// de korte link op hetzelfde domein als de bestemming
export function kortVoor(doel, code) {
  const h = hostVan(doel); if (!DOELEN.includes(h)) return null;
  if (h === 'curacao.day') return `https://curacao.day/d/${code}`; /* bzz vercel.json: /d/<code> naar Clickmind */
  return `https://${h}/m/${code}`;
}

export async function maak(b = {}) {
  const kanaal = KANALEN.includes(String(b.kanaal)) ? String(b.kanaal) : 'anders';
  const doel = String(b.doel || '').trim(); const metLink = !!doel;
  if (metLink && !DOELEN.includes(hostVan(doel))) return { ok: false, fout: 'doel moet een eigen site zijn: ' + DOELEN.join(', ') };
  const id = randomBytes(6).toString('hex');
  let code = '';
  if (metLink) for (let p = 0; p < 6 && !code; p++) { let c = ''; const r = randomBytes(5); for (let j = 0; j < 5; j++) c += ABC[r[j] % ABC.length]; if (!(await kv.get('dist:k:' + c))) code = c; }
  const r = { id, t: new Date().toISOString(), dag: vandaag(), project: kort(b.project || 'curacao', 30).toLowerCase().replace(/[^a-z0-9-]/g, ''), kanaal, plek: kort(b.plek, 120), plekUrl: kort(b.plekUrl, 300), onderwerp: kort(b.onderwerp, 80).toLowerCase(), taal: kort(b.taal || '', 5), kenmerken: kenmerken(b.tekst), soort: kort(b.soort || '', 20).toLowerCase().replace(/[^a-z0-9-]/g, ''), metLink, doel: metLink ? doel : '', code, tekst: kort(b.tekst, 1200), wie: kort(b.wie, 40), status: b.geplaatst ? 'geplaatst' : 'concept', kliks: 0, scans: 0, uitkomsten: [] };
  await kv.set('dist:r:' + id, r, { ex: 400 * 86400 });
  if (code) await kv.set('dist:k:' + code, id, { ex: 400 * 86400 });
  await kv.raw(['LPUSH', 'dist:lijst', id]); await kv.raw(['LTRIM', 'dist:lijst', '0', '2999']);
  if (r.tekst) laterAf(labelAI(id).catch(() => {}));
  return { ok: true, id, code, link: code ? kortVoor(doel, code) : null, status: r.status };
}

export async function zet(id, b = {}) {
  const r = await kv.get('dist:r:' + String(id || '').replace(/[^0-9a-f]/g, '')); if (!r) return { ok: false, fout: 'onbekend id' };
  if (b.geplaatst) { r.status = 'geplaatst'; r.geplaatstOp = new Date().toISOString(); if (b.plekUrl) r.plekUrl = kort(b.plekUrl, 300); }
  let nieuweTekst = false;
  if (b.tekst && !r.tekst) { r.tekst = kort(b.tekst, 1200); r.kenmerken = kenmerken(r.tekst); nieuweTekst = true; }
  // tikken naar de App Store of Google Play vanuit deze post (telefoon via de korte link, geteld op de eigen site): de echte uitkomst per post
  if (b.store != null && Number.isFinite(Number(b.store))) r.store = Math.max(0, Math.min(1e6, Math.round(Number(b.store))));
  // cijfers van het platform zelf (vertoningen, likes, reacties, delen), vervangen de vorige stand; zo leert Clickmind per soort content en usecase
  if (b.stats && typeof b.stats === 'object') { const n = x => Math.max(0, Math.min(1e9, Math.round(Number(x) || 0))); r.stats = { imp: n(b.stats.imp), likes: n(b.stats.likes), reacties: n(b.stats.reacties), delen: n(b.stats.delen), t: new Date().toISOString() }; }
  if (b.uitkomst) { if (!UITKOMSTEN.includes(b.uitkomst)) return { ok: false, fout: 'uitkomst is een van: ' + UITKOMSTEN.join(', ') }; r.uitkomsten.push({ t: new Date().toISOString(), u: b.uitkomst, n: Math.max(1, Math.min(9999, Number(b.n) || 1)) }); }
  await kv.set('dist:r:' + r.id, r, { ex: 400 * 86400 });
  if (nieuweTekst || (r.tekst && !r.ai)) laterAf(labelAI(r.id).catch(() => {}));
  return { ok: true, id: r.id, status: r.status, uitkomsten: r.uitkomsten.length };
}

export async function klik(code, req) {
  if (!/^[a-z0-9]{5}$/.test(String(code || ''))) return null;
  const id = await kv.get('dist:k:' + code); const r = id && await kv.get('dist:r:' + id); if (!r || !r.doel) return null;
  const srv = serverSignalen(req), ua = String(req.headers['user-agent'] || '');
  const voor = /prefetch|prerender/i.test(String(req.headers['sec-purpose'] || req.headers.purpose || '')) || req.method === 'HEAD';
  const scan = voor || !!dcVan(srv).dc || !ua || /bot|crawl|spider|scan|preview|facebookexternalhit|redditbot|twitterbot|slackbot|whatsapp|telegrambot|python|curl|headless/i.test(ua);
  let pid = (String(req.headers.cookie || '').match(/(?:^|;\s*)mmp=([0-9a-f]{16})/) || [])[1]; const nieuw = !pid; if (nieuw) pid = randomBytes(8).toString('hex');
  const cid = randomBytes(6).toString('hex');
  if (scan) r.scans++; else { r.kliks++; r.laatsteKlik = new Date().toISOString(); if (r.status === 'concept') { r.status = 'geplaatst'; r.geplaatstOp = r.laatsteKlik; } }
  await kv.set('dist:r:' + r.id, r, { ex: 400 * 86400 });
  if (!voor) laterAf(verwerkKlik(kv, { cid, pid, nieuw, arm: '302', tag: '-', net: r.kanaal, camp: 'dist-' + r.project, zone: kort(r.plek, 40) || '-', sub: r.id, cr: r.onderwerp || '-', kw: '', doel: r.doel, p: 'dist' }, srv).catch(() => {}));
  const u = new URL(r.doel); u.searchParams.set('mmc', cid); if (!u.searchParams.get('src')) u.searchParams.set('src', r.kanaal);
  return { doel: u.toString(), cookie: 'mmp=' + pid + '; Max-Age=15552000; Path=/; Secure; HttpOnly; SameSite=Lax' };
}
export async function klikAntwoord(req, res, code) {
  res.setHeader('cache-control', 'no-store, private'); res.setHeader('x-robots-tag', 'noindex, nofollow'); res.setHeader('referrer-policy', 'origin');
  const r = await klik(code, req).catch(() => null);
  if (!r) { res.statusCode = 404; res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.end('Deze link bestaat niet (meer).'); }
  res.setHeader('set-cookie', r.cookie); res.statusCode = 302; res.setHeader('location', r.doel); return res.end();
}

// het brein: wat werkt per kanaal, plek, onderwerp en met of zonder link (reacties van de laatste 30 dagen)
export async function stand({ dagen = 30, project = '' } = {}) {
  const ids = (await kv.raw(['LRANGE', 'dist:lijst', '0', '1999'])) || [], grens = Date.now() - dagen * 864e5, rs = [];
  for (const id of ids) { const r = await kv.get('dist:r:' + id); if (r && Date.parse(r.t) > grens && (!project || r.project === project)) rs.push(r); }
  // Video's horen erbij (Henkjan 26 nov 2026: "Moeten vid niet gewoon integreren in clickmind?"): elke video uit Videomind telt als stuk content
  // met soort video-<vorm>, onderwerp = de usecase, de weergaven als vertoningen en de echte mensen als kliks.
  try {
    for (const v of await VM.alleVideos()) {
      if (!v || (project && v.project !== project) || !v.at || Date.parse(v.at) < grens || Date.parse(v.at) > Date.now()) continue;
      const sv = await VM.standVideo(v).catch(() => null); if (!sv) continue;
      rs.push({ id: 'vm:' + v.id, t: v.at, dag: String(v.at).slice(0, 10), project: v.project, kanaal: v.platform === 'x' ? 'x' : KANALEN.includes(v.platform) ? v.platform : 'anders', plek: v.platform, onderwerp: String(v.onderwerp || v.pagina || '-').toLowerCase(), soort: 'video-' + (v.vorm || 'short'), metLink: !!v.link, kliks: sv.mens || 0, uitkomsten: [], status: 'geplaatst', tekst: v.titel || '', kenmerken: kenmerken(v.titel || ''), ai: v.haak ? { haak: v.haak } : null, stats: { imp: sv.weergaven || 0, likes: sv.likes || 0, reacties: sv.reacties || 0, delen: 0 }, video: true });
    }
  } catch (e) {}
  const groep = f => { const o = {}; for (const r of rs.filter(x => x.status === 'geplaatst')) { const k = f(r); const g = o[k] = o[k] || { reacties: 0, met_link: 0, kliks: 0, uitkomsten: 0, vertoningen: 0, inzet: 0 }; g.reacties++; if (r.metLink) g.met_link++; g.kliks += r.kliks || 0; if (r.stats) { g.vertoningen += r.stats.imp || 0; g.inzet += (r.stats.likes || 0) + (r.stats.reacties || 0) + (r.stats.delen || 0); } g.store = (g.store || 0) + (r.store || 0); g.uitkomsten += (r.uitkomsten || []).reduce((s, u) => s + (u.u === 'verwijderd' || u.u === 'niets' ? 0 : u.n), 0); } for (const g of Object.values(o)) { g.kliks_per_reactie = g.met_link ? Math.round(100 * g.kliks / g.met_link) / 100 : null; g.uitkomst_per_reactie = Math.round(100 * g.uitkomsten / g.reacties) / 100; g.inzet_per_1000 = g.vertoningen ? Math.round(10000 * g.inzet / g.vertoningen) / 10 : null; g.kliks_per_1000 = g.vertoningen ? Math.round(10000 * g.kliks / g.vertoningen) / 10 : null; g.store_per_post = Math.round(100 * (g.store || 0) / g.reacties) / 100; } return Object.fromEntries(Object.entries(o).sort((a, b) => (b[1].kliks + b[1].uitkomsten) - (a[1].kliks + a[1].uitkomsten))); };
  let buiten = null; // vraag van buiten naast wat werkte (lib/buiten.js)
  if (project) try { const B = await import('./buiten.js'); const x = await kv.get('buiten:' + B.projectId(project)); if (x) buiten = { dag: x.dag, stijgers: (x.stijgers || []).slice(0, 6), dalers: (x.dalers || []).slice(0, 3), haken: (x.haken || []).slice(0, 5) }; } catch (e) {}
  return {
    buiten,
    uitleg: 'Clickmind distributie: elke gerichte reactie wordt hier gemeld (op=distmaak), met of zonder korte link. kliks = echte mensen via de korte link; uitkomsten = upvotes, antwoorden, bedankjes of iemand die ons noemt (op=distuitkomst). Echte mensen en aanmeldingen per reactie staan in het klikregister onder camp dist-<project>, sub = reactie-id. Leer hieruit: welk kanaal, welke plek, welk onderwerp en of een link helpt.',
    reacties: rs.length, geplaatst: rs.filter(r => r.status === 'geplaatst').length, concepten: rs.filter(r => r.status === 'concept').map(r => ({ id: r.id, kanaal: r.kanaal, plek: r.plek, onderwerp: r.onderwerp, link: r.code ? kortVoor(r.doel, r.code) : null, tekst: r.tekst.slice(0, 200) })).slice(0, 20),
    per_kanaal: groep(r => r.kanaal), per_link: groep(r => r.metLink ? 'met link' : 'zonder link'), per_onderwerp: groep(r => r.onderwerp || '-'), per_soort: groep(r => r.soort || '-'), per_ai: Object.fromEntries(['haak', 'emotie', 'doelgroep'].map(k => [k, groep(r => (r.ai && r.ai[k]) || '-')])), per_kenmerk: Object.fromEntries(['lengte', 'vraag', 'getal', 'spreker', 'opening'].map(k => [k, groep(r => (r.kenmerken && r.kenmerken[k]) || '-')])), per_usecase_soort: groep(r => (r.onderwerp || '-') + ' · ' + (r.soort || '-')), per_plek: groep(r => r.kanaal + ' · ' + (r.plek || '-')),
    laatste: rs.slice(0, 15).map(r => ({ id: r.id, dag: r.dag, kanaal: r.kanaal, plek: r.plek, onderwerp: r.onderwerp, status: r.status, link: r.code ? kortVoor(r.doel, r.code) : null, kliks: r.kliks, uitkomsten: r.uitkomsten.map(u => u.u + (u.n > 1 ? ' x' + u.n : '')).join(', ') })),
  };
}
