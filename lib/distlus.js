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

const DOELEN = ['curacao.day', 'keuzehulp.best', 'whichtobuy.best', 'kaufberater.best', 'nexy.help', 'wearemany.now', 'sealedintent.com', 'gids.kadoly.com']; // domeinen waar /m/<code> of /d/<code> naar Clickmind gaat
const KANALEN = ['reddit', 'facebook', 'instagram', 'tiktok', 'x', 'linkedin', 'whatsapp', 'telegram', 'forum', 'nieuwssite', 'quora', 'tripadvisor', 'google', 'mail', 'anders'];
const UITKOMSTEN = ['upvote', 'antwoord', 'bedankt', 'verwijderd', 'genoemd', 'niets'];
const ABC = 'bcdfghjkmnpqrstvwxz23456789';
const kort = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
const vandaag = () => new Date().toISOString().slice(0, 10);

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
  const r = { id, t: new Date().toISOString(), dag: vandaag(), project: kort(b.project || 'curacao', 30).toLowerCase().replace(/[^a-z0-9-]/g, ''), kanaal, plek: kort(b.plek, 120), plekUrl: kort(b.plekUrl, 300), onderwerp: kort(b.onderwerp, 80).toLowerCase(), taal: kort(b.taal || '', 5), metLink, doel: metLink ? doel : '', code, tekst: kort(b.tekst, 1200), wie: kort(b.wie, 40), status: b.geplaatst ? 'geplaatst' : 'concept', kliks: 0, scans: 0, uitkomsten: [] };
  await kv.set('dist:r:' + id, r, { ex: 400 * 86400 });
  if (code) await kv.set('dist:k:' + code, id, { ex: 400 * 86400 });
  await kv.raw(['LPUSH', 'dist:lijst', id]); await kv.raw(['LTRIM', 'dist:lijst', '0', '2999']);
  return { ok: true, id, code, link: code ? kortVoor(doel, code) : null, status: r.status };
}

export async function zet(id, b = {}) {
  const r = await kv.get('dist:r:' + String(id || '').replace(/[^0-9a-f]/g, '')); if (!r) return { ok: false, fout: 'onbekend id' };
  if (b.geplaatst) { r.status = 'geplaatst'; r.geplaatstOp = new Date().toISOString(); if (b.plekUrl) r.plekUrl = kort(b.plekUrl, 300); }
  if (b.uitkomst) { if (!UITKOMSTEN.includes(b.uitkomst)) return { ok: false, fout: 'uitkomst is een van: ' + UITKOMSTEN.join(', ') }; r.uitkomsten.push({ t: new Date().toISOString(), u: b.uitkomst, n: Math.max(1, Math.min(9999, Number(b.n) || 1)) }); }
  await kv.set('dist:r:' + r.id, r, { ex: 400 * 86400 });
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
  const groep = f => { const o = {}; for (const r of rs.filter(x => x.status === 'geplaatst')) { const k = f(r); const g = o[k] = o[k] || { reacties: 0, met_link: 0, kliks: 0, uitkomsten: 0 }; g.reacties++; if (r.metLink) g.met_link++; g.kliks += r.kliks || 0; g.uitkomsten += (r.uitkomsten || []).reduce((s, u) => s + (u.u === 'verwijderd' || u.u === 'niets' ? 0 : u.n), 0); } for (const g of Object.values(o)) { g.kliks_per_reactie = g.met_link ? Math.round(100 * g.kliks / g.met_link) / 100 : null; g.uitkomst_per_reactie = Math.round(100 * g.uitkomsten / g.reacties) / 100; } return Object.fromEntries(Object.entries(o).sort((a, b) => (b[1].kliks + b[1].uitkomsten) - (a[1].kliks + a[1].uitkomsten))); };
  return {
    uitleg: 'Clickmind distributie: elke gerichte reactie wordt hier gemeld (op=distmaak), met of zonder korte link. kliks = echte mensen via de korte link; uitkomsten = upvotes, antwoorden, bedankjes of iemand die ons noemt (op=distuitkomst). Echte mensen en aanmeldingen per reactie staan in het klikregister onder camp dist-<project>, sub = reactie-id. Leer hieruit: welk kanaal, welke plek, welk onderwerp en of een link helpt.',
    reacties: rs.length, geplaatst: rs.filter(r => r.status === 'geplaatst').length, concepten: rs.filter(r => r.status === 'concept').map(r => ({ id: r.id, kanaal: r.kanaal, plek: r.plek, onderwerp: r.onderwerp, link: r.code ? kortVoor(r.doel, r.code) : null, tekst: r.tekst.slice(0, 200) })).slice(0, 20),
    per_kanaal: groep(r => r.kanaal), per_link: groep(r => r.metLink ? 'met link' : 'zonder link'), per_onderwerp: groep(r => r.onderwerp || '-'), per_plek: groep(r => r.kanaal + ' · ' + (r.plek || '-')),
    laatste: rs.slice(0, 15).map(r => ({ id: r.id, dag: r.dag, kanaal: r.kanaal, plek: r.plek, onderwerp: r.onderwerp, status: r.status, link: r.code ? kortVoor(r.doel, r.code) : null, kliks: r.kliks, uitkomsten: r.uitkomsten.map(u => u.u + (u.n > 1 ? ' x' + u.n : '')).join(', ') })),
  };
}
