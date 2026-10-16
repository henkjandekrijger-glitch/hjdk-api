// Wat Clickmind leert van Amazon-zoektermen en -tags (Henkjan 16 okt: "leer eerst waarom dat is en zorg dat Clickmind er wat mee kan").
// Aanleiding 15 okt: 61 Mondiad-campagnes met merkzoektermen (ml-push-20: Chanel, Tom Ford, Creed, Dyson, Canada Goose ...) gaven
// 4.562 Amazon-kliks en minder dan 5 artikelen, terwijl de parfumwinnaars (bl-bku-20: dupes, cadeausets, body mist) op dezelfde
// 17 zones 1,5 tot 2 artikelen per 100 kliks gaven. Drie lessen, elk als controle in code:
//  1. Prijs: pushkopers kopen goedkoop. Gemiddeld besteld bedrag per artikel 14-15 okt: bku $15-23, notcart $21, t20 $22.
//     Zoektermen waarvan Amazon vooral producten boven $40 toont (merkparfum $100-300, Dyson $250+, Canada Goose $150+) verkopen niet.
//     termPrijs() kijkt dat na met de Amazon-API voordat een campagne wordt gemaakt.
//  2. Tag: een tag met 1.500+ Amazon-kliks en (bijna) geen artikelen is geen koper. tagGeenKoper() leest de Associates-meter.
//  3. Verzadiging: op dezelfde witte lijst geeft meer campagnes vooral meer kliks van dezelfde mensen, niet meer kopers.
//     bl-bku-20: 14 okt 2.463 kliks, 53 artikelen, $1.194; 15 okt (met 38 /go-kopieën erbij) 4.327 kliks (+76%), 66 artikelen
//     (+25%), $986 (-17%). verzadiging() meldt zo'n patroon per tag.
// Alles alleen meten en adviseren; mdgo slaat bronnen over die op les 1 of 2 zakken (met forceer=1 toch).
import { MARKETS, amzSearch, amzReady } from './wtb.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const MARKT = { '': 'us', com: 'us', us: 'us', de: 'de' };
export const GRENS = { prijsMediaan: 40, aandeelOnder40: 0.4, tagMinKliks: 1500, tagMaxConversie: 0.3, verzKliks: 1.4, verzArtikelen: 1.15, verzMinKliks: 1000 };

export const LESSEN = [
  { dag: '2026-10-15', wat: 'ml-push-20 (61 Mondiad-campagnes, merkzoektermen)', cijfers: '4.562 Amazon-kliks, <5 artikelen, $14,30 kosten',
    waarom: 'zoektermen voor dure merkproducten ($100-600); pushkopers kopen artikelen van $15-25; dezelfde mensen zagen al de bku-advertenties (zelfde 17 zones)',
    regel: 'voor een nieuwe zoekterm eerst termPrijs: mediaan onder $40 en minstens 40% van de producten onder $40; een nieuwe groep termen een eigen tag geven zodat Associates per groep meet' },
  { dag: '2026-10-15', wat: 'bl-bku-20 met 38 /go-kopieën erbij op dezelfde witte lijst', cijfers: 'kliks +76%, artikelen +25%, omzet -17% tegen 14 okt',
    waarom: 'zelfde 17 zones, frequentie 1 per campagne per dag: meer campagnes = vaker dezelfde mensen, niet meer kopers',
    regel: 'groei zoeken met nieuwe zones of nieuwe kopersgroepen, niet met meer kopieën op dezelfde witte lijst; kopie en origineel niet naast elkaar laten lopen' }
];

// mediaanprijs en aandeel onder $40 van de eerste 10 zoekresultaten (Amazon Creators API, 6 uur cache)
export async function termPrijs(k, m = '') {
  const markt = MARKETS[MARKT[String(m || '')] || 'us'];
  if (!markt || !amzReady()) return { ok: false, fout: 'Amazon-API niet ingesteld' };
  const r = await amzSearch(markt, String(k || '').slice(0, 150), { count: 10 }).catch(e => ({ fout: String(e.message || e).slice(0, 120) }));
  if (!r || r.fout) return { ok: false, fout: (r && r.fout) || 'geen resultaat' };
  const p = (r.products || []).map(x => N(x.price)).filter(x => x > 0).sort((a, b) => a - b);
  if (p.length < 3) return { ok: true, k, prijzen: p.length, oordeel: 'onbekend', waarom: 'te weinig prijzen' };
  const mediaan = p[Math.floor(p.length / 2)], onder = p.filter(x => x < 40).length / p.length;
  const duur = mediaan > GRENS.prijsMediaan && onder < GRENS.aandeelOnder40;
  return { ok: true, k, markt: markt.id, prijzen: p.length, mediaan: Math.round(mediaan), aandeelOnder40: Math.round(onder * 100), oordeel: duur ? 'te duur voor pushverkeer' : 'prijs past', waarom: 'pushkopers kopen artikelen van gemiddeld $15-25 (Associates 14-15 okt)' };
}

const dagMin = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') - n * 864e5).toISOString().slice(0, 10);
async function amzDag(kv, d) { const o = {}; try { const h = await kv.raw(['HGETALL', 'mm:amz:' + d]); for (let i = 0; h && i < h.length; i += 2) { try { o[h[i]] = JSON.parse(h[i + 1]); } catch (e) {} } } catch (e) {} return o; }

// is deze tag de laatste dagen een niet-koper? (Associates-meter, hele dagen)
export async function tagGeenKoper(kv, tag, { dagen = 3, tot = null } = {}) {
  const eind = tot || new Date(Date.now() - 7 * 3600e3 - 864e5).toISOString().slice(0, 10); let k = 0, a = 0, verborgen = 0, n = 0;
  for (let i = 0; i < dagen; i++) { const x = (await amzDag(kv, dagMin(eind, i)))[tag]; if (!x) continue; n++; k += N(x.kliks); a += N(x.artikelen); if (/verborgen/.test(String(x.bron || ''))) verborgen++; }
  const conv = k ? 100 * a / k : 0;
  const nee = k >= GRENS.tagMinKliks && conv < GRENS.tagMaxConversie;
  return { tag, dagen: n, kliks: k, artikelen: a, verborgen, conversie: Math.round(conv * 100) / 100, geenKoper: nee, waarom: nee ? k + ' Amazon-kliks en ' + (verborgen ? 'minder dan 5 artikelen per dag (verborgen)' : a + ' artikelen') + ' in ' + n + ' dag(en)' : null };
}

// verzadiging per tag: kliks stijgen fors, artikelen niet
export async function verzadiging(kv, { dag } = {}) {
  dag = /^\d{4}-\d{2}-\d{2}$/.test(String(dag || '')) ? dag : new Date(Date.now() - 7 * 3600e3 - 864e5).toISOString().slice(0, 10);
  const nu = await amzDag(kv, dag), toen = await amzDag(kv, dagMin(dag, 1)), uit = [];
  for (const [tag, x] of Object.entries(nu)) {
    const y = toen[tag]; if (!y || N(y.kliks) < GRENS.verzMinKliks || !N(y.artikelen)) continue;
    const rk = N(x.kliks) / N(y.kliks), ra = N(x.artikelen) / N(y.artikelen), ro = N(y.omzet) ? N(x.omzet) / N(y.omzet) : null;
    if (rk >= GRENS.verzKliks && ra < GRENS.verzArtikelen) uit.push({ tag, kliks: [N(y.kliks), N(x.kliks)], artikelen: [N(y.artikelen), N(x.artikelen)], omzet: [N(y.omzet), N(x.omzet)], kliksPct: Math.round((rk - 1) * 100), artikelenPct: Math.round((ra - 1) * 100), omzetPct: ro == null ? null : Math.round((ro - 1) * 100), les: 'meer kliks, niet meer kopers: niet verder opschalen met kopieën op dezelfde zones' });
  }
  return { dag, vorige: dagMin(dag, 1), verzadigd: uit };
}
