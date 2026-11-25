// Loopt alle openbare pagina's en de vaste chatantwoorden na: met de nieuwe prijszinnen aan mag er geen oude prijszin meer staan,
// en elke pagina die over betalen door de koper gaat noemt 250. node scripts/test-sealed-prijs.mjs
const I = await import('../lib/sealed-info.js'), S = await import('../lib/sealed.js'), L = await import('../lib/sealed-lp.js'), P = await import('../lib/sealed-chatpage.js'), C = await import('../lib/sealed-chat.js'), { prijsTekst, OUD_PRIJS, PRIJSZINNEN } = await import('../lib/sealed-prijs.js');
let fout = 0, geraakt = new Set(), n = 0;
const kijk = (naam, html) => { n++; const ruw = html, nieuw = prijsTekst(ruw, true); for (const [a] of PRIJSZINNEN) if (ruw.includes(a)) geraakt.add(a); const m = nieuw.match(OUD_PRIJS); if (m) { fout++; console.log('FOUT oude prijszin in', naam, ':', nieuw.slice(Math.max(0, m.index - 60), m.index + 90)); } if (/—/.test(nieuw.replace(ruw, ''))) { fout++; console.log('FOUT streepje', naam); } };
for (const u of [...S.sitemap().matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])) { const m = u.match(/sealedintent\.com\/(nl|en|de)(?:\/(.+))?$/); if (!m) continue; const [, t, s] = m;
  const info = s ? I.infoPagina(t, s) : null, lp = s ? L.zoekLp(t, s) : null;
  kijk(u, P.renderChatPage(t, lp || null, info ? { pagina: info, links: I.infoLinks(t, s) } : { links: I.infoLinks(t) })); }
for (const t of ['nl', 'en', 'de']) for (const rol of ['buyers', 'owners']) for (const vraag of ['wat kost het?', 'what does it cost?', 'was kostet das?']) { try { const r = await C.chatVraag({ get: async () => null, set: async () => 'OK', incr: async () => 1, raw: async () => null, mget: async () => [] }, { rol, stap: 'sector', taal: t, tekst: vraag }, null); kijk('chatvraag ' + t + ' ' + rol, JSON.stringify(r)); } catch (e) { fout++; console.log('FOUT chatvraag', t, rol, e.message); } }
const niet = PRIJSZINNEN.filter(([a]) => !geraakt.has(a)).map(([a]) => a.slice(0, 50));
console.log(n + ' pagina\'s en antwoorden nagelopen, ' + geraakt.size + ' van ' + PRIJSZINNEN.length + ' zinnen kwamen voor' + (niet.length ? '; niet gezien: ' + niet.join(' | ') : ''));
if (!geraakt.size) { fout++; console.log('FOUT: geen enkele zin geraakt, de controle meet niets'); }
console.log(fout ? fout + ' FOUT' : 'alles goed'); if (fout) process.exit(1);
