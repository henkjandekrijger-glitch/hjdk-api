// Clickmind: uitkomsten van eigen bestemmingen die niet via /go of /w lopen (Henkjan 15 okt 2026: "zorg dat Clickmind de
// todayin-data ook heeft"). Todayin-advertenties gaan rechtstreeks naar todayin.email, dus er is geen klik-id (mmc) en
// /api/mm/uitkomst kan ze niet koppelen. Daarom haalt de leerronde elk uur todayins tellers per zone op:
//   GET https://todayin.email/api/ti?cmdata=1&dagen=7  (openbaar, alleen netwerk-, campagne- en zonenummers met aantallen)
// en zet ze per dag in mm:zx:<dag> (velden net|zone|actie en net|zone|aanmelding, zelfde vorm als mm:zu) en mm:cx:<dag>
// (net|camp|soort, zelfde vorm als mm:cu). Todayin is de bron: elke ronde vervangt de dag in zijn geheel, dus nooit dubbel.
// k (onderwerp gekozen) = actie, s (nieuwe aanmelding) = aanmelding. Bezoeken en mensen meet Clickmind al zelf met cm.js op
// todayin, die tellen hier niet mee. Daarnaast mm:zxl:<dag> (net|zone|v en net|zone|m) voor "veel mensen, nul keuze".
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const BRONNEN = [{ naam: 'todayin', url: () => (process.env.TODAYIN_URL || 'https://todayin.email') + '/api/ti?cmdata=1&dagen=7' }];
const NET = /^(propeller|mondiad|richads|mgid)$/, ID = /^\d{1,12}$/, DAG = /^\d{4}-\d{2}-\d{2}$/;

export async function externUitkomsten(kv, { schrijf = true } = {}) {
  const uit = [];
  for (const b of BRONNEN) {
    try {
      const r = await fetch(b.url(), { headers: { 'user-agent': 'clickmind-leerronde' }, signal: AbortSignal.timeout(8000) });
      if (!r.ok) { uit.push({ bron: b.naam, ok: false, fout: 'http ' + r.status }); continue; }
      const j = await r.json(); let rijen = 0, acties = 0, aanmeldingen = 0;
      for (const d of (j && j.dagen) || []) {
        if (!DAG.test(String(d.dag || ''))) continue;
        const zx = {}, cx = {}, zl = {};
        for (const x of d.rijen || []) {
          const net = String(x.net || '').toLowerCase(), zone = String(x.zone || ''), camp = String(x.camp || '');
          if (!NET.test(net) || !ID.test(zone)) continue; rijen++;
          const k = N(x.k), s = N(x.s); acties += k; aanmeldingen += s;
          if (k) zx[net + '|' + zone + '|actie'] = N(zx[net + '|' + zone + '|actie']) + k;
          if (s) zx[net + '|' + zone + '|aanmelding'] = N(zx[net + '|' + zone + '|aanmelding']) + s;
          if (ID.test(camp)) { if (k) cx[net + '|' + camp + '|actie'] = N(cx[net + '|' + camp + '|actie']) + k; if (s) cx[net + '|' + camp + '|aanmelding'] = N(cx[net + '|' + camp + '|aanmelding']) + s; if (N(x.v)) cx[net + '|' + camp + '|v'] = N(cx[net + '|' + camp + '|v']) + N(x.v); if (N(x.m)) cx[net + '|' + camp + '|m'] = N(cx[net + '|' + camp + '|m']) + N(x.m); }
          zl[net + '|' + zone + '|v'] = N(zl[net + '|' + zone + '|v']) + N(x.v); zl[net + '|' + zone + '|m'] = N(zl[net + '|' + zone + '|m']) + N(x.m);
        }
        if (!schrijf) continue;
        for (const [sl, h] of [['mm:zx:', zx], ['mm:cx:', cx], ['mm:zxl:', zl]]) {
          const key = sl + d.dag, paar = Object.entries(h).flat();
          await kv.raw(['DEL', key]);
          for (let i = 0; i < paar.length; i += 400) await kv.raw(['HSET', key, ...paar.slice(i, i + 400)]);
          if (paar.length) await kv.raw(['EXPIRE', key, 60 * 86400]);
        }
      }
      uit.push({ bron: b.naam, ok: true, rijen, acties, aanmeldingen });
    } catch (e) { uit.push({ bron: b.naam, ok: false, fout: String(e && e.message || e).slice(0, 120) }); }
  }
  return uit;
}
