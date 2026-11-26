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
async function hash(kv, k, status) {
  const uit = {};
  try {
    const h = await kv.raw(['HGETALL', k]);
    if (h == null || (Array.isArray(h) && !h.length)) { status[k] = 'ontbreekt'; return uit; }
    if (!Array.isArray(h) || h.length % 2 || h.some((v, i) => i % 2 ? !['string', 'number'].includes(typeof v) || String(v).trim() === '' || !Number.isSafeInteger(Number(v)) || Number(v) < 0 : typeof v !== 'string')) { status[k] = 'ongeldig'; return uit; }
    for (let i = 0; i < h.length; i += 2) uit[h[i]] = Number(h[i + 1]);
    status[k] = 'gelezen';
  } catch { status[k] = 'leesfout'; }
  return uit;
}

export async function dagCijfers(kv, d) {
  const meetstatus = {};
  const tel = await hash(kv, 'bs:tel:' + d, meetstatus), klik = await hash(kv, 'bs:klik:' + d, meetstatus), gosrc = await hash(kv, 'bs:gosrc:' + d, meetstatus);
  const uit = { meetstatus, dag: d, site: {}, paginas: [], amazon: 0, amazonOrganisch: 0, amazonPerBron: {}, amazonPerSite: {}, lcVerkoop: 0 };
  for (const [k, n] of Object.entries(tel)) {
    const p = k.split('|');
    if (!['bs', 'lc'].includes(p[0]) || (p[1] !== 'p' && !BRON_OK.test(p[1] || ''))) continue;
    if (p[1] === 'p') { uit.paginas.push({ site: p[0], pad: p.slice(2).join('|'), n }); continue; }
    const s = uit.site[p[0]] || (uit.site[p[0]] = { totaal: 0, organisch: 0, perBron: {} });
    s.totaal += n; s.perBron[p[1]] = (s.perBron[p[1]] || 0) + n; if (ORGANISCH.includes(p[1])) s.organisch += n;
  }
  uit.paginas.sort((a, b) => b.n - a.n);
  uit.amazon = Object.values(klik).reduce((a, b) => a + b, 0);
  for (const [k, n] of Object.entries(gosrc)) {
    const [site, bron] = k.split('|'), b = bron || site;
    uit.amazonPerBron[b] = (uit.amazonPerBron[b] || 0) + n;
    if (ORGANISCH.includes(b)) uit.amazonOrganisch += n;
    // Oude bronregels zonder site blijven onbekend; wijs ze nooit aan Stocking Books toe.
    const id = bron && ['bs', 'lc'].includes(site) ? site : 'onbekend';
    uit.amazonPerSite[id] = (uit.amazonPerSite[id] || 0) + n;
  }
  try {
    const n = await kv.raw(['HGET', 'lc:verkoop', d]);
    uit.meetstatus.verkoop = n == null ? 'ontbreekt' : n === '' || !Number.isSafeInteger(Number(n)) || Number(n) < 0 ? 'ongeldig' : 'gelezen';
    if (uit.meetstatus.verkoop === 'gelezen') uit.lcVerkoop = Number(n);
  } catch { uit.meetstatus.verkoop = 'leesfout'; }
  return uit;
}

const lijst = o => Object.entries(o).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${NAAM[k] || k} ${n}`).join(', ');
const verschil = (a, b) => (b == null ? '' : a > b ? ` (+${a - b})` : a < b ? ` (${a - b})` : '');

export async function rapportTekst(kv, d, { zicht = null, pins = null, arts = [] } = {}) {
  const [x, y] = await Promise.all([dagCijfers(kv, d), dagCijfers(kv, dagVan(d, -1))]);
  const r = [`Organisch boeken, ${d} (UTC)`];
  const naam = { bs: 'stockingbooks.com', lc: 'lastingchange.works' };
  let iets = false;
  for (const site of ['bs', 'lc']) {
    const s = x.site[site], v = y.site[site];
    if (!s || !s.totaal) continue; iets = true;
    const org = Object.fromEntries(Object.entries(s.perBron).filter(([b]) => ORGANISCH.includes(b)));
    r.push(`${naam[site]}: ${s.totaal} geregistreerde pagina-openingen${verschil(s.totaal, v && v.totaal)}` + (s.organisch ? `, organisch ${s.organisch}${verschil(s.organisch, v && v.organisch)} (${lijst(org)})` : ''));
  }
  if (x.amazon) { iets = true; r.push(`Amazonverzoeken: ${x.amazon} (ruwe redirects, geen unieke personen)` + (x.amazonOrganisch ? `, uit organisch ${x.amazonOrganisch} (${lijst(Object.fromEntries(Object.entries(x.amazonPerBron).filter(([b]) => ORGANISCH.includes(b))))})` : '')); }
  const amzSites = ['bs', 'lc'].filter(id => x.amazonPerSite[id]).map(id => `${naam[id]} ${x.amazonPerSite[id]}`);
  if (amzSites.length) r.push('Amazonverzoeken per site: ' + amzSites.join(', '));
  if (x.lcVerkoop) { iets = true; r.push(`Lasting Change PDF verkocht: ${x.lcVerkoop}`); }
  const top = x.paginas.slice(0, 3).filter(p => p.n > 1);
  if (top.length) r.push('Beste pagina\'s: ' + top.map(p => `${naam[p.site] || p.site}${p.pad} ${p.n}`).join(', '));
  if (pins && pins.geplaatst) r.push(`Pinterest: ${pins.geplaatst} pins geplaatst` + (pins.klik ? `, ${pins.klik} kliks` : '') + (pins.saves ? `, ${pins.saves} saves` : '') + (pins.beste ? `; beste kop: ${pins.beste}` : ''));
  const nieuw = arts.filter(a => a.datum === d), open = arts.filter(a => a.status === 'concept');
  for (const a of nieuw) r.push(`Nieuw LC-artikel: ${a.titel}` + (a.volume ? ` (zoekvraag ${a.volume}/mnd)` : '') + (a.status === 'live' ? ` https://lastingchange.works/${a.slug}` : ''));
  if (open.length) r.push(`Wacht op jouw ok (${open.length}): ` + open.slice(0, 3).map(a => `${a.titel}: bekijk https://hjdk-api-henq.vercel.app/api/bs?site=lc&p=${a.slug}&concept=1 · live zetten https://hjdk-api-henq.vercel.app/api/bs?site=lc&op=lclive&slug=${a.slug}`).join(' | '));
  if (zicht) { const z = []; if (zicht.imp) z.push(`Google ${zicht.imp} vertoningen` + (zicht.clicks ? `, ${zicht.clicks} kliks` : '')); if (zicht.geindexeerd) z.push(`${zicht.geindexeerd} pagina's in Google`); if (zicht.ai) z.push(`AI noemt ons bij ${zicht.ai}`); if (z.length) r.push(z.join(' · ')); }
  // De redirectteller bevat herhaalde en ongekoppelde verzoeken van beide sites.
  // Zonder koppeling per pagina/browseractie is een conversiepercentage of 5%-lek niet vastgesteld.
  if (x.amazon || Object.values(x.site).some(s => s.totaal >= 30)) r.push('Meetlek: pagina-openingen en Amazonverzoeken zijn niet per klik gekoppeld. Nog geen betrouwbaar doorklikpercentage; eerst meten, dan een inhoudsproef kiezen.');
  if (!iets) r.push('Nog geen meetbaar bezoek: de pagina\'s zijn net gemeld bij Bing en de pins lopen. Google pakt nieuwe sites meestal binnen 1 tot 3 weken op.');
  r.push('Details: https://stockingbooks.com/overdracht');
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


// Alleen uitlezen: geen Telegram, pings, providers of writes. Onbekende bron/padwaarden nooit exporteren.
export async function rapportData(kv, { nu = new Date(), publiekePaden = { bs: ['/'], lc: ['/'] } } = {}) {
  const waargenomen = nu.toISOString(), meetdag = dagVan(waargenomen.slice(0, 10), -1);
  const maak = x => {
    const telOK = x.meetstatus['bs:tel:' + x.dag] === 'gelezen';
    const bronOK = x.meetstatus['bs:gosrc:' + x.dag] === 'gelezen';
    const site = {};
    for (const id of ['bs', 'lc']) {
      const src = telOK && x.site[id] ? Object.fromEntries(Object.entries(x.site[id].perBron).filter(([b]) => BRON_OK.test(b))) : {};
      const bekend = Object.keys(src).length > 0;
      const veiligPad = new Set(publiekePaden[id] || []);
      site[id] = {
        paginaOpeningen: bekend ? Object.values(src).reduce((a, b) => a + b, 0) : null,
        organischeOpeningen: bekend ? Object.entries(src).filter(([b]) => ORGANISCH.includes(b)).reduce((a, [, n]) => a + n, 0) : null,
        perBron: bekend ? src : null,
        paginas: telOK ? x.paginas.filter(p => p.site === id && veiligPad.has(p.pad)).map(p => ({ pad: p.pad, openingen: p.n })) : null,
        amazonVerzoeken: bronOK && Object.hasOwn(x.amazonPerSite, id) ? x.amazonPerSite[id] : null
      };
    }
    return {
      meetdag: x.dag,
      meetperiode: { vanaf: x.dag + 'T00:00:00.000Z', totExclusief: dagVan(x.dag, 1) + 'T00:00:00.000Z' },
      site,
      amazonVerzoeken: x.meetstatus['bs:klik:' + x.dag] === 'gelezen' ? x.amazon : null,
      pdfVerkoop: x.meetstatus.verkoop === 'gelezen' ? x.lcVerkoop : null,
      leesstatus: x.meetstatus
    };
  };
  const [x, y] = await Promise.all([dagCijfers(kv, meetdag), dagCijfers(kv, dagVan(meetdag, -1))]);
  return {
    droog: true, waargenomen, dag: maak(x), vorige: maak(y),
    definitie: 'Geregistreerde bronopeningen, geen unieke personen. Paginatotalen bevatten ook intern doorbladeren. Amazonverzoeken zijn ruwe redirects, geen verkoop.',
    beperkingen: ['Ontbrekende bron of site is onbekend, geen expliciete nul.', 'Geen gezamenlijke per-pin landingmeting of conversiepercentage.', 'Alleen bekende publieke paginapaden worden getoond.']
  };
}
