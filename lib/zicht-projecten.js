// ZICHT voor elk project (Henkjan 17 okt 2026: "Zet zicht draaiboek beschikbaar voor iedere project op vercel zodat dat altijd
// wordt uitgevoerd en met het geleerde uit data wordt geoptimaliseerd").
// Drie dingen, zonder dat een project een token nodig heeft:
//  1. techcheck: de dagelijkse ronde controleert zelf per site wat van buitenaf te zien is (robots.txt, AI-bots krijgen 200,
//     sitemap, noindex/nosnippet, inhoud als gewone HTML, titel) en zet lessen die aantoonbaar kloppen op 'toegepast'.
//     Wat niet klopt wordt 'werk' met voorrang boven nieuwe lessen.
//  2. manifest: elk project publiceert op zijn eigen domein https://<host>/zicht.json (zie MANIFEST_UITLEG). Alleen wie het
//     domein beheert kan dat bestand zetten, dus dat is de echtheid. De ronde leest het en meldt proeven, toegepaste lessen,
//     niet-passende lessen (nvt), nieuwe lessen, zoekvragen en eigen metingen (bezoek uit zoekmachines/AI, AI-crawlers).
//  3. werk: GET /api/zicht?op=werk[&site=<id>][&t=1] zegt per site wat nu moet: eerst de technische problemen, dan de
//     hoogst scorende les die op die site nog niet is toegepast en niet als nvt is gemeld. De dagelijkse uitvoerder
//     (geplande cloudtaak 'ZICHT uitvoerder') en de eigen lussen van projecten werken die lijst af.
import { kv } from './db.js';
import { lessen, bewaarLessen, nieuweProef, voegLesToe, DAY, log } from './zicht.js';

export const MANIFEST_UITLEG = 'zicht.json (op https://<host>/zicht.json, of het adres in site.manifest): {"zicht":1, "site":{"vragen":["echte zoekvragen, hooguit 30"], "merk":["namen waarmee AI de site noemt"], "taal":"nl|en|de", "land":"NL|US|DE", "repo":"eigenaar/repo"}, "toegepast":[{"les":"<id>","dag":"JJJJ-MM-DD","wat":"..."}], "nvt":[{"les":"<id>","waarom":"..."}], "proeven":[{"id":"uniek, nooit hergebruiken","les":"<id>","urls":["/pad of volledige url"],"controle":["..."],"metric":"index|gsc|llm","wat":"...","na":21}], "lessen":[{"id":"kort-kebab","les":"een zin wat te doen","kanaal":"google|llm|beide","bewijs":"wat je zag, met cijfers","sterkte":2,"moeite":2}], "meting":{"bezoek7d":{"zoek":0,"ai":0,"perBron":{"google":0,"chatgpt":0}},"aiBots7d":{"gptbot":0,"oai-searchbot":0,"claudebot":0,"perplexitybot":0,"googlebot":0,"bingbot":0}}}. Alleen toevoegen, verzonden regels nooit wijzigen (een id wordt één keer gemeld).';

const MK = { tech: id => 'zicht:tech:' + id, man: id => 'zicht:manifest:' + id, mproef: (id, p) => 'zicht:mproef:' + id + ':' + p, mles: (id, l) => 'zicht:mles:' + id + ':' + l };
const BROWSER = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36';
const BOTS = [
  ['googlebot', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
  ['bingbot', 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'],
  ['oai-searchbot', 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot'],
  ['chatgpt-user', 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot'],
  ['claude-searchbot', 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +https://www.anthropic.com)'],
  ['perplexitybot', 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)']
];
const ROBOT_TOKENS = ['googlebot', 'bingbot', 'oai-searchbot', 'chatgpt-user', 'claude-searchbot', 'claude-user', 'perplexitybot'];

async function haal(url, ua, ms, max) {
  try { const r = await fetch(url, { redirect: 'follow', headers: { 'user-agent': ua || BROWSER, accept: '*/*' }, signal: AbortSignal.timeout(ms || 12000) });
    const t = await r.text(); return { status: r.status, url: r.url, type: r.headers.get('content-type') || '', text: t.slice(0, max || 600000), robotsTag: r.headers.get('x-robots-tag') || '' };
  } catch (e) { return { status: 0, fout: String(e.message || e).slice(0, 100), text: '' }; }
}
// robots.txt: welke van de zoek- en AI-bots mogen de homepage niet lezen (Disallow: / in hun eigen groep, of in * als ze geen eigen groep hebben)
export function robotsBlokkeert(txt) {
  const groups = []; let cur = null, lastUa = false;
  for (const raw of String(txt || '').split(/\r?\n/)) { const line = raw.replace(/#.*/, '').trim(); if (!line) continue; const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i); if (!m) continue; const key = m[1].toLowerCase(), val = m[2].trim();
    if (key === 'user-agent') { if (!lastUa || !cur) { cur = { uas: [], rules: [] }; groups.push(cur); } cur.uas.push(val.toLowerCase()); lastUa = true; }
    else { lastUa = false; if (cur && (key === 'disallow' || key === 'allow')) cur.rules.push([key, val]); } }
  const sitemaps = [...String(txt || '').matchAll(/^\s*sitemap\s*:\s*(\S+)/gim)].map(x => x[1]);
  const voor = tok => { const eigen = groups.filter(g => g.uas.some(u => u !== '*' && tok.includes(u.replace(/\*$/, '')))); const g = eigen.length ? eigen : groups.filter(x => x.uas.includes('*')); const rules = g.flatMap(x => x.rules);
    const dis = rules.some(([k, v]) => k === 'disallow' && (v === '/' || v === '/*')); const al = rules.some(([k, v]) => k === 'allow' && (v === '/' || v === '/*' || v === '/$')); return dis && !al; };
  return { blokkeert: ROBOT_TOKENS.filter(voor), sitemaps };
}
const tekstVan = html => String(html || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
async function sitemapInfo(urls) {
  for (const u of urls) { const r = await haal(u, null, 15000, 3000000); if (r.status !== 200 || !/<(urlset|sitemapindex)/i.test(r.text)) continue;
    const locs = [...r.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m => m[1]);
    if (/<sitemapindex/i.test(r.text)) { let n = 0, lm = 0; const kind = []; for (const c of locs.slice(0, 12)) { const x = await haal(c, null, 12000, 3000000); if (x.status !== 200) continue; const l = [...x.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m => m[1]); n += l.length; lm += (x.text.match(/<lastmod>/g) || []).length; kind.push(...l.slice(0, 50)); }
      return { url: u, index: true, kinderen: locs.length, urls: n, metLastmod: lm, voorbeeld: kind.slice(0, 400) }; }
    return { url: u, index: false, urls: locs.length, metLastmod: (r.text.match(/<lastmod>/g) || []).length, voorbeeld: locs.slice(0, 400) }; }
  return null;
}

// ---------- 1. techcheck ----------
export async function techcheck(s) {
  const base = 'https://' + s.host; const t = { dag: DAY(), host: s.host, problemen: [], goed: [] };
  const [rb, home, llms, man] = await Promise.all([haal(base + '/robots.txt', null, 10000, 200000), haal(base + '/', BROWSER, 15000), haal(base + '/llms.txt', null, 8000, 2000), haal(s.manifest || base + '/zicht.json', null, 10000, 400000)]);
  t.http = home.status; t.eindUrl = home.url;
  if (home.status !== 200) { t.problemen.push('homepage geeft status ' + (home.status || 'geen antwoord') + (home.fout ? ' (' + home.fout + ')' : '')); t.bereikbaar = false; }
  else t.bereikbaar = true;
  const bots = await Promise.all(BOTS.map(async ([n, ua]) => [n, (await haal(base + '/', ua, 12000, 1000)).status]));
  t.bots = Object.fromEntries(bots);
  const geweigerd = bots.filter(([, st]) => st !== 200 && t.bereikbaar); if (geweigerd.length) t.problemen.push('bots krijgen geen 200 op de homepage: ' + geweigerd.map(([n, st]) => n + ' ' + st).join(', ') + ' (firewall of botblokkade?)');
  const r = rb.status === 200 && !/<html/i.test(rb.text) ? robotsBlokkeert(rb.text) : { blokkeert: [], sitemaps: [] };
  t.robots = { status: rb.status, blokkeert: r.blokkeert, sitemaps: r.sitemaps.length };
  if (r.blokkeert.length) t.problemen.push('robots.txt blokkeert ' + r.blokkeert.join(', '));
  const sm = await sitemapInfo([...new Set([...r.sitemaps, base + '/sitemap.xml'])].slice(0, 3));
  t.sitemap = sm ? { url: sm.url, index: sm.index, urls: sm.urls, metLastmod: sm.metLastmod } : null;
  if (!sm && t.bereikbaar) t.problemen.push('geen leesbare sitemap (robots.txt Sitemap: of /sitemap.xml)');
  if (home.status === 200) { const h = home.text; const meta = (h.match(/<meta[^>]+name=["']robots["'][^>]*>/gi) || []).join(' ').toLowerCase() + ' ' + home.robotsTag.toLowerCase();
    const title = ((h.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').replace(/\s+/g, ' ').trim(); const tekst = tekstVan(h);
    t.home = { title: title.slice(0, 120), titleLen: title.length, h1: /<h1[\s>]/i.test(h), tekst: tekst.length, noindex: /noindex/.test(meta), nosnippet: /nosnippet|max-snippet\s*:\s*0/.test(meta), canonical: ((h.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)/i) || [])[1] || null), jsonld: (h.match(/application\/ld\+json/gi) || []).length, lang: ((h.match(/<html[^>]+lang=["']([^"']+)/i) || [])[1] || null) };
    if (t.home.noindex) t.problemen.push('homepage staat op noindex'); if (t.home.nosnippet) t.problemen.push('nosnippet/max-snippet:0 op de homepage (beperkt ook AI Overviews)');
    if (!title) t.problemen.push('homepage heeft geen <title>'); if (tekst.length < 400) t.problemen.push('homepage heeft bijna geen tekst in de server-HTML (' + tekst.length + ' tekens; alleen JavaScript?)');
    if (!t.home.lang) t.problemen.push('geen lang-attribuut op <html>'); }
  t.llms = llms.status === 200 && !/<html/i.test(llms.text);
  t.manifest = man.status === 200 && /^\s*\{/.test(man.text) ? 'ok' : (man.status || 'geen');
  t._manifestTekst = t.manifest === 'ok' ? man.text : null; t._sitemapVoorbeeld = sm ? sm.voorbeeld : [];
  // wat aantoonbaar klopt -> lessen op 'toegepast'
  const aiOk = t.bereikbaar && !r.blokkeert.length && bots.every(([, st]) => st === 200);
  if (aiOk) t.goed.push('ai-zoekbots-toelaten'); if (t.bereikbaar && !r.blokkeert.includes('googlebot') && t.bots.googlebot === 200 && !(t.home && t.home.nosnippet)) t.goed.push('google-extended-is-geen-aio-knop');
  if (t.home && t.home.tekst >= 1500) t.goed.push('ssr-gids-inhoud'); if (t.llms) t.goed.push('llms-txt-lage-prio');
  return t;
}

// ---------- 2. manifest ----------
const opHost = (host, u) => { try { const x = new URL(String(u).startsWith('http') ? u : 'https://' + host + '/' + String(u).replace(/^\//, '')); const h = x.hostname.replace(/^www\./, ''); return (h === host || h.endsWith('.' + host)) ? x.href : null; } catch (e) { return null; } };
export async function leesManifest(s, tekst) {
  let j; try { j = JSON.parse(tekst); } catch (e) { return { fout: 'zicht.json is geen geldige JSON' }; }
  if (!j || typeof j !== 'object') return { fout: 'zicht.json leeg' };
  const uit = { proeven: [], toegepast: [], nvt: [], lessen: [], fouten: [] }; const ls = await lessen(); const ids = new Set(ls.map(l => l.id)); let veranderd = false;
  // nieuwe lessen eerst (zodat proeven ernaar kunnen verwijzen), hooguit 3 per dag per site
  for (const x of (Array.isArray(j.lessen) ? j.lessen : []).slice(0, 20)) { if (uit.lessen.length >= 3) break; const key = MK.mles(s.id, String(x.id || x.les || '').slice(0, 60)); if (await kv.get(key).catch(() => null)) continue;
    try { const l = await voegLesToe({ id: x.id, les: x.les, kanaal: x.kanaal, bewijs: x.bewijs, bron: 'https://' + s.host + '/zicht.json', sterkte: Math.min(3, Number(x.sterkte) || 2), moeite: x.moeite, risico: x.risico }); await kv.set(key, DAY()); uit.lessen.push(l.id); ids.add(l.id); } catch (e) { uit.fouten.push('les ' + (x.id || '') + ': ' + String(e.message).slice(0, 80)); } }
  const ls2 = uit.lessen.length ? await lessen() : ls;
  for (const x of (Array.isArray(j.toegepast) ? j.toegepast : []).slice(0, 100)) { const id = typeof x === 'string' ? x : x && x.les; const l = ls2.find(e => e.id === id); if (!l) { if (id) uit.fouten.push('toegepast: onbekende les ' + id); continue; }
    if (!(l.toegepast || {})[s.id]) { l.toegepast = Object.assign({}, l.toegepast, { [s.id]: (x && x.dag) || DAY() }); uit.toegepast.push(id); veranderd = true; } }
  for (const x of (Array.isArray(j.nvt) ? j.nvt : []).slice(0, 100)) { const id = typeof x === 'string' ? x : x && x.les; const l = ls2.find(e => e.id === id); if (!l) continue;
    if (!(l.nvt || {})[s.id]) { l.nvt = Object.assign({}, l.nvt, { [s.id]: String((x && x.waarom) || 'past niet bij deze site').slice(0, 160) }); uit.nvt.push(id); veranderd = true; } }
  if (veranderd) await bewaarLessen(ls2);
  for (const p of (Array.isArray(j.proeven) ? j.proeven : []).slice(0, 200)) { if (uit.proeven.length >= 10) break; if (!p || !p.id || !p.les) continue; const key = MK.mproef(s.id, String(p.id).slice(0, 80)); if (await kv.get(key).catch(() => null)) continue;
    const urls = [].concat(p.urls || []).map(u => opHost(s.host, u)).filter(Boolean); const controle = [].concat(p.controle || []).map(u => opHost(s.host, u)).filter(Boolean);
    if (!urls.length) { uit.fouten.push('proef ' + p.id + ': geen urls op ' + s.host); await kv.set(key, 'fout'); continue; }
    try { const r = await nieuweProef({ site: s.id, les: p.les, urls, controle, metric: p.metric, na: p.na, wat: p.wat, van: 'zicht.json ' + s.host + ' (' + p.id + ')' }); await kv.set(key, r.id); uit.proeven.push(p.id); } catch (e) { uit.fouten.push('proef ' + p.id + ': ' + String(e.message).slice(0, 100)); if (!/onbekende les/.test(e.message)) await kv.set(key, 'fout'); } }
  const si = j.site && typeof j.site === 'object' ? j.site : {}; const clean = a => (Array.isArray(a) ? a : []).map(x => String(x).trim()).filter(x => x && x.length < 140);
  const m = { dag: DAY(), vragen: clean(si.vragen).slice(0, 30), merk: clean(si.merk).slice(0, 8), taal: si.taal || null, land: si.land || null, repo: si.repo || null, meting: j.meting && typeof j.meting === 'object' ? j.meting : null };
  await kv.set(MK.man(s.id), m, { ex: 30 * 86400 }); uit.vragen = m.vragen.length;
  return uit;
}
export const manifestVan = id => kv.get(MK.man(id)).catch(() => null);

// ---------- techcheck + manifest voor één site (in de dagelijkse ronde) ----------
export async function controleer(s, vooraf) {
  const t = vooraf || await techcheck(s); if (t.fout) return { fout: t.fout }; const res = { problemen: t.problemen, bots: t.bots, sitemap: t.sitemap && t.sitemap.urls, manifest: t.manifest };
  if (t.goed.length) { const ls = await lessen(); let n = 0; for (const id of t.goed) { const l = ls.find(e => e.id === id); if (l && !(l.toegepast || {})[s.id]) { l.toegepast = Object.assign({}, l.toegepast, { [s.id]: DAY() }); n++; } } if (n) await bewaarLessen(ls); res.autoToegepast = t.goed; }
  if (t._manifestTekst) { try { res.manifestVerwerkt = await leesManifest(s, t._manifestTekst); } catch (e) { res.manifestFout = String(e.message).slice(0, 120); } }
  const opslag = Object.assign({}, t); delete opslag._manifestTekst; opslag.sitemapVoorbeeld = (t._sitemapVoorbeeld || []).slice(0, 400); delete opslag._sitemapVoorbeeld;
  await kv.set(MK.tech(s.id), opslag, { ex: 30 * 86400 }); return res;
}
export const techVan = id => kv.get(MK.tech(id)).catch(() => null);

// ---------- 3. werk: wat moet een site nu doen ----------
export async function werk(ss, siteId) {
  const ls = await lessen(); const ids = siteId ? [siteId] : Object.keys(ss); const out = {};
  for (const id of ids) { const s = ss[id]; if (!s) continue; const t = await techVan(id); const m = await manifestVan(id);
    const isHJ = l => /Search Console|Webmaster Tools/i.test(l.les); // alleen Henkjan kan dat (verifiëren, sitemap indienen, rapporten aanzetten)
    const open = ls.filter(l => l.status === 'actief' && !(l.toegepast || {})[id] && !(l.nvt || {})[id] && !(s.alleenVoor && l.alleenVoor && !l.alleenVoor.includes(id)));
    const exp = (await kv.get('zicht:exp:' + id).catch(() => null)) || [];
    out[id] = { host: s.host, repo: (m && m.repo) || s.repo || null, eigenUitvoerder: s.eigenUitvoerder || null, laatsteCheck: t && t.dag, bereikbaar: t ? t.bereikbaar : null, manifest: t ? t.manifest : null,
      problemen: (t && t.problemen) || [], zonderManifest: !t || t.manifest !== 'ok', vragen: m ? m.vragen.length : (s.vragen || []).length,
      volgende: open.filter(l => !isHJ(l)).slice(0, 3).map(l => ({ id: l.id, score: l.score, les: l.les, kanaal: l.kanaal, moeite: l.moeite, risico: /^geen\.?$/i.test(String(l.risico || '').trim()) ? '' : (l.risico || '') })),
      henkjan: open.filter(isHJ).slice(0, 3).map(l => ({ id: l.id, les: l.les })),
      proeven: { lopend: exp.filter(p => p.status === 'loopt').length, klaar: exp.filter(p => p.status === 'klaar').length } }; }
  return out;
}
export function werkTekst(w) {
  return Object.entries(w).map(([id, x]) => '## ' + id + ' (' + x.host + ')' + (x.repo ? ' · repo ' + x.repo : ' · repo onbekend') + (x.eigenUitvoerder ? ' · eigen uitvoerder: ' + x.eigenUitvoerder : '') + '\n' +
    (x.bereikbaar === false ? '- NIET BEREIKBAAR\n' : '') + (x.problemen.length ? x.problemen.map(p => '- PROBLEEM: ' + p).join('\n') + '\n' : '') +
    (x.zonderManifest ? '- nog geen https://' + x.host + '/zicht.json (zet hem neer, zie op=manifest)\n' : '') + (x.vragen ? '' : '- geen zoekvragen bekend: zet echte vragen in zicht.json site.vragen, anders meet ZICHT geen AI-vermeldingen\n') +
    x.volgende.map((l, i) => (i + 1) + '. [' + l.score + '] ' + l.les + ' (id ' + l.id + ', ' + l.kanaal + ', moeite ' + l.moeite + ')' + (l.risico ? ' let op: ' + l.risico : '')).join('\n') +
    (x.henkjan.length ? '\n- ALLEEN HENKJAN (vraag het hem, één stap per keer): ' + x.henkjan.map(l => l.les + ' (id ' + l.id + ')').join(' | ') : '') +
    '\n- proeven: ' + x.proeven.lopend + ' lopend, ' + x.proeven.klaar + ' beoordeeld').join('\n\n');
}
export async function logRonde(r) { await log({ wat: 'projecten', res: JSON.stringify(r).slice(0, 3000) }); }
