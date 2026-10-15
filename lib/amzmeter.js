// Amazon-meter (Henkjan 14 okt 2026): per Associates-tag en per hele dag de betaalde kliks (PropellerAds + Mondiad, campagnes
// met die tag in de naam) naast wat Amazon telt, plus artikelen en omzet. Zo zie je wanneer de conversie bij Amazon stijgt omdat
// Amazon minder kliks telt (nepkliks vallen weg) in plaats van door meer kopers.
// ALLEEN METEN, NOOIT BLOKKEREN. Henkjan: "alleen als je absoluut zeker bent". Dat zijn we niet: Amazon geeft kliks alleen per tag,
// niet per zone, en een laag deel geteld zegt niet dat de zones niets opleveren (14 okt tussenstand: bl-bku-20 49% geteld en toch
// 3x terugverdiend). Zones gaan eruit op geld (opbrengst per betaalde klik tegen kosten per klik, hele dagen), zoals de kliktest
// ctrh/ctrl, niet op dit percentage.
// Les 14 okt: vergelijk altijd dezelfde uren. Een Amazon-dag (Amerikaanse tijd) naast een PropellerAds-dag in UTC gaf eerst een
// vals beeld (bl-ctrh-20 leek 37% geteld, in dezelfde uren was het 69%).
// Invoer Associates per tag per dag: /api/mm/amazon?dag=&tag=&kliks=&artikelen=&omzet= (beschermde host).
// Amazon US rekent in Amerikaanse tijd; PropellerAds wordt daarom opgehaald in Pacific-tijd (oktober: -0700).
import { md } from './mdmcp.js';
import { TAG_ALIAS } from './mensmeter.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const COMMISSIE = { '-20': 0.03, '-21': 0.045 }; // gemiddeld tarief op de blanket (Associates aug: ~3% op alle US-tags); schatting tot de verdiensten binnen zijn
const rows = x => (Array.isArray(x) ? x : Array.isArray(x && x.data) ? x.data : Array.isArray(x && x.items) ? x.items : Array.isArray(x && x.content) ? x.content : []);
const tagIn = (naam, tag) => new RegExp('(^|[^a-z0-9-])' + tag.replace(/[^a-z0-9-]/gi, '') + '($|[^a-z0-9-])', 'i').test(String(naam || ''));

async function paPerCampagne(dag, tz) {
  const s = process.env.SHOP_SLEUTEL || ''; if (!s) return { fout: 'SHOP_SLEUTEL ontbreekt', rijen: [] };
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 28000);
  try {
    const r = await fetch((process.env.PA_LUS_URL || 'https://propellerads-mcp.vercel.app') + '/api/statistiek', { method: 'POST', headers: { 'content-type': 'application/json', 'x-shop-sleutel': s }, body: JSON.stringify({ perCampagne: true, dag, tz }), signal: ac.signal });
    const j = await r.json().catch(() => ({}));
    return j && j.ok ? { rijen: j.rijen || [] } : { fout: String((j && j.fout) || 'HTTP ' + r.status).slice(0, 100), rijen: [] };
  } catch (e) { return { fout: String(e.message || e).slice(0, 100), rijen: [] }; } finally { clearTimeout(t); }
}

async function mdPerCampagne(dag) {
  try {
    const rep = rows(await md('mondiad_campaign_report', { startDate: dag, endDate: dag, breakdown: 'CAMPAIGN', size: 500, sortBy: 'SPENT', sortDirection: 'DESC' }));
    if (!rep.length) return { rijen: [] };
    // Namen ophalen voor alle campagnes in het rapport; Mondiad geeft max 500 per pagina en we hebben er meer dan 800 (les 15 okt:
    // alleen pagina 1 liet de nieuwste campagnes, zoals de boeken, buiten de meter).
    const nodig = new Set(rep.map(r => String(r.campaignId))), naam = {};
    for (let pagina = 0; pagina < 6 && [...nodig].some(id => !(id in naam)); pagina++) {
      const lijst = rows(await md('mondiad_list_campaigns', { size: 500, page: pagina, sortBy: 'ID', sortDirection: 'DESC', responseFields: ['ID', 'NAME'] }));
      for (const c of lijst) naam[String(c.id)] = String(c.name || '');
      if (lijst.length < 500) break;
    }
    return { rijen: rep.map(r => ({ camp: 'md' + r.campaignId, naam: naam[String(r.campaignId)] || '', kliks: N(r.clicks), kosten: N(r.spent) })) };
  } catch (e) { return { fout: String(e.message || e).slice(0, 100), rijen: [] }; }
}

export async function amazonMeter(kv, { dag, tz = '-0700' } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dag || ''))) return { ok: false, fout: 'dag JJJJ-MM-DD' };
  const vandaagPT = new Date(Date.now() - 7 * 3600e3).toISOString().slice(0, 10);
  const heleDag = dag < vandaagPT;
  const amz = {}; try { const h = await kv.raw(['HGETALL', 'mm:amz:' + dag]); for (let i = 0; h && i < h.length; i += 2) { try { amz[h[i]] = JSON.parse(h[i + 1]); } catch (e) {} } } catch (e) {}
  const tags = Object.keys(amz);
  if (!tags.length) return { ok: true, dag, heleDag, tags: [], melding: 'nog geen Associates-cijfers voor deze dag (invoer: /api/mm/amazon)' };
  const [pa, mo] = await Promise.all([paPerCampagne(dag, tz), mdPerCampagne(dag)]);
  const alle = [...pa.rijen.map(r => ({ ...r, net: 'propeller' })), ...mo.rijen.map(r => ({ ...r, net: 'mondiad' }))];
  const uit = [];
  for (const tag of tags) {
    // /go zet niet-geregistreerde tags in campagnenamen om naar geregistreerde (TAG_ALIAS): tel die campagnes mee bij de echte tag
    const namen = [tag, ...Object.keys(TAG_ALIAS).filter(k => TAG_ALIAS[k] === tag.toLowerCase())];
    const a = amz[tag], camps = alle.filter(r => namen.some(t => tagIn(r.naam, t)));
    const betaald = camps.reduce((s, r) => s + r.kliks, 0), kosten = camps.reduce((s, r) => s + r.kosten, 0);
    const geteld = N(a.kliks), artikelen = N(a.artikelen), omzet = N(a.omzet), tarief = COMMISSIE[tag.slice(-3)] || 0.03;
    const opbrengst = N(a.verdiend) || omzet * tarief;
    uit.push({
      tag, campagnes: camps.length, netwerken: [...new Set(camps.map(r => r.net))], betaald, geteld, artikelen, omzet: Math.round(omzet * 100) / 100,
      pctGeteld: betaald ? Math.round(1000 * geteld / betaald) / 10 : null,
      conversieAmazon: geteld ? Math.round(10000 * artikelen / geteld) / 100 : null,
      conversiePerBetaaldeKlik: betaald ? Math.round(10000 * artikelen / betaald) / 100 : null,
      kosten: Math.round(kosten * 100) / 100, opbrengstSchatting: Math.round(opbrengst * 100) / 100,
      terugverdiend: kosten > 0 ? Math.round(100 * opbrengst / kosten) / 100 : null,
      oordeel: !heleDag ? 'tussenstand: nog geen oordeel' : betaald < 300 ? 'te weinig kliks voor een oordeel' : opbrengst >= kosten ? 'verdient zich terug' : 'verdient zich niet terug (zones beoordelen op geld, niet op het percentage geteld)',
    });
  }
  uit.sort((x, y) => y.betaald - x.betaald);
  const som = k => uit.reduce((s, x) => s + N(x[k]), 0);
  return { ok: true, dag, tz, heleDag, regel: 'alleen meten, nooit blokkeren op dit percentage', fouten: [pa.fout, mo.fout].filter(Boolean), totaal: { betaald: som('betaald'), geteld: som('geteld'), artikelen: som('artikelen'), kosten: Math.round(som('kosten') * 100) / 100, opbrengstSchatting: Math.round(som('opbrengstSchatting') * 100) / 100 }, tags: uit };
}
