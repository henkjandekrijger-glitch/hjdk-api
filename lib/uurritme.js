// Clickmind-uurritme voor iedereen (Henkjan 28 okt 2026: "Zorg dat clikcmind minder inkoopt als mensen eten inderdaad" en
// "Wat goed zorg dat dit robuust in clickminds zit voor iedereen !").
//
// Meten: Clickmind telt per UTC-uur, per netwerk en campagne, hoeveel betaalde kliks binnenkwamen (k, lib/mensmeter.js verwerkKlik en
// paginabezoeken via mm.js) en hoeveel daarvan een echt mens bleken (m, uitkomst 'echt' in lib/wissel.js en het mensoordeel van mm.js),
// geteld in het uur van de klik. Eén Redis-hash per UTC-dag (mm:uur:JJJJMMDD), velden "UU|net|campagne|k of m", 9 dagen bewaard.
//
// Oordelen (ritme): voor een groep campagnes (zelfde project en land) per lokaal uur van de bezoeker over de laatste 7 dagen het aandeel
// echte mensen per klik, relatief tegen het gemiddelde van die groep:
//   - zwak uur (genoeg kliks en minder dan 70% van het gemiddelde): factor 0,5;
//   - etenstijd (17 tot 20 uur lokaal): factor 0,5, tenzij de cijfers laten zien dat dat uur minstens gemiddeld is;
//   - geen of te weinig mensmeting in de groep (minder dan 30 echte mensen in 7 dagen): factor 1, niets doen.
// Inkopen: de lus van elk netwerk zet elk uur het bod = basisbod x factor (PropellerAds: propellerads-mcp lib/uurritme.ts) en daarna
// weer terug; nooit hoger dan het basisbod. PropellerAds kent zelf geen bod per uur; daarom past de lus elk uur het campagnebod aan.
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const DAG = t => new Date(t).toISOString().slice(0, 10).replace(/-/g, '');
const UU = t => new Date(t).toISOString().slice(11, 13);
export const K_UUR = d => 'mm:uur:' + d;
export const ETENSTIJD = [17, 18, 19];
export const MIN_KLIKS_UUR = 150, MIN_MENSEN = 30, ZWAK = 0.7, FACTOR = 0.5;

// Redis-opdrachten om een klik (k) of een echt mens (m) te tellen in het uur van de klik t
export function uurCmd(net, camp, soort, t) {
  const c = String(camp || ''); if (!c || c === '-' || (soort !== 'k' && soort !== 'm')) return [];
  const tt = N(t) || Date.now(), k = K_UUR(DAG(tt));
  return [['HINCRBY', k, UU(tt) + '|' + String(net || 'onbekend') + '|' + c + '|' + soort, 1], ['EXPIRE', k, String(9 * 86400)]];
}
export function lokaalUur(tz, t) {
  try { return Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz || 'UTC', hour: '2-digit', hour12: false }).format(new Date(t))) % 24; } catch (e) { return new Date(t).getUTCHours(); }
}
const paren = a => { if (Array.isArray(a)) { const o = []; for (let i = 0; i + 1 < a.length; i += 2) o.push([String(a[i]), a[i + 1]]); return o; } return a && typeof a === 'object' ? Object.entries(a) : []; };

// Oordeel per lokaal uur voor een groep campagnes; uren = [{ uur, kliks, echt, aandeel, factor, reden }]
export function oordeel(per, tz, nu = Date.now()) {
  let sk = 0, sm = 0; per.forEach(p => { sk += p.k; sm += p.m; });
  const gem = sk ? sm / sk : 0, meting = sm >= MIN_MENSEN;
  const uren = per.map((p, uur) => {
    const aandeel = p.k ? p.m / p.k : 0, genoeg = meting && p.k >= MIN_KLIKS_UUR, ratio = gem ? aandeel / gem : 0;
    let factor = 1, reden = !meting ? 'geen mensmeting' : genoeg ? 'normaal' : 'te weinig kliks';
    if (genoeg && ratio < ZWAK) { factor = FACTOR; reden = 'zwak uur: ' + (100 * aandeel).toFixed(1) + '% echte mensen tegen gemiddeld ' + (100 * gem).toFixed(1) + '%'; }
    else if (meting && ETENSTIJD.includes(uur) && !(genoeg && ratio >= 1)) { factor = FACTOR; reden = 'etenstijd' + (genoeg ? ' (' + (100 * aandeel).toFixed(1) + '% tegen gemiddeld ' + (100 * gem).toFixed(1) + '%)' : ''); }
    return { uur, kliks: p.k, echt: p.m, aandeel: Math.round(aandeel * 1000) / 10, factor, reden };
  });
  const u = lokaalUur(tz, nu);
  return { tz, lokaalUur: u, factorNu: uren[u].factor, redenNu: uren[u].reden, gemiddeld: Math.round(gem * 1000) / 10, kliks: sk, mensen: sm, meting, uren };
}

export async function ritme(kv, { net = 'propeller', camps = [], tz = 'Europe/Amsterdam' } = {}) {
  const set = new Set((camps || []).map(String).filter(Boolean)); const nu = Date.now();
  const per = Array.from({ length: 24 }, () => ({ k: 0, m: 0 }));
  if (set.size) {
    for (let i = 0; i <= 7; i++) {
      const d = DAG(nu - i * 864e5); let a = null; try { a = await kv.raw(['HGETALL', K_UUR(d)]); } catch (e) {}
      for (const [f, v] of paren(a)) {
        const [hh, n, c, s] = f.split('|'); if (n !== net || !set.has(c) || (s !== 'k' && s !== 'm')) continue;
        const t = Date.parse(d.slice(0, 4) + '-' + d.slice(4, 6) + '-' + d.slice(6, 8) + 'T' + hh + ':30:00Z'); if (!Number.isFinite(t) || nu - t > 7 * 864e5) continue;
        per[lokaalUur(tz, t)][s] += N(v);
      }
    }
  }
  return Object.assign({ at: new Date(nu).toISOString(), net, campagnes: set.size, dagen: 7 }, oordeel(per, tz, nu));
}
