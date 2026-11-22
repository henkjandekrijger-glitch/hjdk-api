// Organisch scoren voor bookstuffers.com en lastingchange.works, gemeten en elke dag gemeld (Henkjan 22 nov 2026: "Zorg dat ik echt scoor
// met Organisch rapporteer het in de telegram post iedere dag onafh accounts of computers"). Alles draait op Vercel (cron in vercel.json),
// niet in een Claude-account of op Henkjans computer.
// Meting: elke pagina stuurt bij laden één tel (op=tel) met site, bron en pad; een klik naar Amazon gaat via /go/<ASIN>?s=<bron>.
// Opslag per UTC-dag: bs:tel:<dag> (site|bron en site|p|pad), bs:klik:<dag> (per ASIN), bs:gosrc:<dag> (site|bron), 60 dagen.
// Rapport: één Telegram-bericht per dag (doorgeefluik MELD_SLEUTEL, zelfde als het keuzehulpoverzicht), nooit nullen.
import { telegram } from './dagoverzicht.js';

import { ORGANISCH, BRON_OK, meetJs } from './bsmeet.js';
export { ORGANISCH, BRON_OK, meetJs };
const NAAM = { google: 'Google', bing: 'Bing', duckduckgo: 'DuckDuckGo', chatgpt: 'ChatGPT', perplexity: 'Perplexity', copilot: 'Copilot', gemini: 'Gemini', pinterest: 'Pinterest', social: 'social', direct: 'direct', overig: 'overig', mail: 'mail' };

const dagVan = (d, n) => new Date(Date.parse(d + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);
async function hash(kv, k) { const uit = {}; try { const h = await kv.raw(['HGETALL', k]); for (let i = 0; h && i < h.length; i += 2) uit[h[i]] = (uit[h[i]] || 0) + (+h[i + 1] || 0); } catch (e) {} return uit; }

export async function dagCijfers(kv, d) {
  const tel = await hash(kv, 'bs:tel:' + d), klik = await hash(kv, 'bs:klik:' + d), gosrc = await hash(kv, 'bs:gosrc:' + d);
  const uit = { dag: d, site: {}, paginas: [], amazon: 0, amazonOrganisch: 0, amazonPerBron: {}, lcVerkoop: 0 };
  for (const [k, n] of Object.entries(tel)) {
    const p = k.split('|');
    if (p[1] === 'p') { uit.paginas.push({ site: p[0], pad: p.slice(2).join('|'), n }); continue; }
    const s = uit.site[p[0]] || (uit.site[p[0]] = { totaal: 0, organisch: 0, perBron: {} });
    s.totaal += n; s.perBron[p[1]] = (s.perBron[p[1]] || 0) + n; if (ORGANISCH.includes(p[1])) s.organisch += n;
  }
  uit.paginas.sort((a, b) => b.n - a.n);
  uit.amazon = Object.values(klik).reduce((a, b) => a + b, 0);
  for (const [k, n] of Object.entries(gosrc)) { const b = k.split('|')[1] || k; uit.amazonPerBron[b] = (uit.amazonPerBron[b] || 0) + n; if (ORGANISCH.includes(b)) uit.amazonOrganisch += n; }
  try { uit.lcVerkoop = +(await kv.raw(['HGET', 'lc:verkoop', d])) || 0; } catch (e) {}
  return uit;
}

const lijst = o => Object.entries(o).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${NAAM[k] || k} ${n}`).join(', ');
const verschil = (a, b) => (b == null ? '' : a > b ? ` (+${a - b})` : a < b ? ` (${a - b})` : '');

export async function rapportTekst(kv, d, { zicht = null, pins = null, arts = [] } = {}) {
  const [x, y] = await Promise.all([dagCijfers(kv, d), dagCijfers(kv, dagVan(d, -1))]);
  const r = [`Organisch boeken, ${d} (UTC)`];
  const naam = { bs: 'bookstuffers.com', lc: 'lastingchange.works' };
  let iets = false;
  for (const site of ['bs', 'lc']) {
    const s = x.site[site], v = y.site[site];
    if (!s || !s.totaal) continue; iets = true;
    const org = Object.fromEntries(Object.entries(s.perBron).filter(([b]) => ORGANISCH.includes(b)));
    r.push(`${naam[site]}: ${s.totaal} bezoeken${verschil(s.totaal, v && v.totaal)}` + (s.organisch ? `, organisch ${s.organisch}${verschil(s.organisch, v && v.organisch)} (${lijst(org)})` : ''));
  }
  if (x.amazon) { iets = true; r.push(`Naar Amazon: ${x.amazon} kliks${verschil(x.amazon, y.amazon)}` + (x.amazonOrganisch ? `, uit organisch ${x.amazonOrganisch} (${lijst(Object.fromEntries(Object.entries(x.amazonPerBron).filter(([b]) => ORGANISCH.includes(b))))})` : '')); }
  if (x.lcVerkoop) { iets = true; r.push(`Lasting Change PDF verkocht: ${x.lcVerkoop}`); }
  const top = x.paginas.slice(0, 3).filter(p => p.n > 1);
  if (top.length) r.push('Beste pagina\'s: ' + top.map(p => `${p.pad} ${p.n}`).join(', '));
  if (pins && pins.geplaatst) r.push(`Pinterest: ${pins.geplaatst} pins geplaatst` + (pins.klik ? `, ${pins.klik} kliks` : '') + (pins.saves ? `, ${pins.saves} saves` : '') + (pins.beste ? `; beste kop: ${pins.beste}` : ''));
  const nieuw = arts.filter(a => a.datum === d), open = arts.filter(a => a.status === 'concept');
  for (const a of nieuw) r.push(`Nieuw LC-artikel: ${a.titel}` + (a.volume ? ` (zoekvraag ${a.volume}/mnd)` : '') + (a.status === 'live' ? ` https://lastingchange.works/${a.slug}` : ''));
  if (open.length) r.push(`Wacht op jouw ok (${open.length}): ` + open.slice(0, 3).map(a => `${a.titel}: bekijk https://hjdk-api-henq.vercel.app/api/bs?site=lc&p=${a.slug}&concept=1 · live zetten https://hjdk-api-henq.vercel.app/api/bs?site=lc&op=lclive&slug=${a.slug}`).join(' | '));
  if (zicht) { const z = []; if (zicht.imp) z.push(`Google ${zicht.imp} vertoningen` + (zicht.clicks ? `, ${zicht.clicks} kliks` : '')); if (zicht.geindexeerd) z.push(`${zicht.geindexeerd} pagina's in Google`); if (zicht.ai) z.push(`AI noemt ons bij ${zicht.ai}`); if (z.length) r.push(z.join(' · ')); }
  // grootste lek: veel bezoek, weinig doorklik naar Amazon
  const bsT = (x.site.bs && x.site.bs.totaal) || 0;
  if (bsT >= 30 && x.amazon / bsT < 0.05) r.push(`Lek: van ${bsT} bezoeken klikten er ${x.amazon} door naar Amazon. Volgende ronde: boekkeuze hoger op de best bezochte pagina en de modal scherper.`);
  if (!iets) r.push('Nog geen meetbaar bezoek: de pagina\'s zijn net gemeld bij Bing en de pins lopen. Google pakt nieuwe sites meestal binnen 1 tot 3 weken op.');
  r.push('Details: https://bookstuffers.com/overdracht');
  return { tekst: r.join('\n'), x, y };
}

// Hooguit één keer per dag, vanaf 12:00 UTC (08:00 Curaçao), over gisteren.
export async function dagRapport(kv, { droog = false, extra = {} } = {}) {
  const nu = new Date(); if (!droog && nu.getUTCHours() < 12) return { wacht: true };
  const vandaag = nu.toISOString().slice(0, 10), gisteren = dagVan(vandaag, -1), k = 'bs:rapport:' + vandaag;
  if (!droog) { let nieuw = null; try { nieuw = await kv.raw(['SET', k, '1', 'NX', 'EX', String(3 * 86400)]); } catch (e) {} if (!nieuw) return { al: true }; }
  const { tekst } = await rapportTekst(kv, gisteren, extra);
  if (droog) return { droog: true, tekst };
  const ok = await telegram(tekst);
  if (!ok) { try { await kv.del(k); } catch (e) {} }
  try { await kv.set('bs:rapport:laatste', { at: new Date().toISOString(), dag: gisteren, ok, tekst }); } catch (e) {}
  return { verstuurd: ok, dag: gisteren, tekst };
}
