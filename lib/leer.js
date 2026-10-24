// Clickmind: de leerronde.
// LEERRONDE (Henkjan 14 okt 2026, stap 3 van het klikregister): elk uur, in de cloud (Vercel-cron /api/mm/leer).
// 1. Zoneprofielen over alle netwerken: bezoeken, personen, herhaalkliks, datacenter, headless/emulator, besturingssystemen, uren, uitkomsten.
// 2. Aankomst: wat PropellerAds per zone afrekent tegen wat er echt bij /go en /w aankomt (alleen als de PropellerAds-sleutel in dit project staat).
// 3. Lijkt-op-winnaar: zones zonder uitkomst die qua profiel lijken op zones met echte uitkomsten (kandidaten voor een eigen campagne of hoger bod, op Henkjans woord).
// 4. Botfarms en dezelfde site via twee netwerken (zelfde vingerafdrukken in zones van verschillende netwerken).
// 5. Wissels in modus "leer": nieuwe gewichten met Thompson sampling.
// 6. Blokvoorstel per netwerk in mm:blok:<net>. Uitvoeren gebeurt alleen als Henkjan het aanzet (mm:instelling.blokkeren); tot dan is het een lijst.
// Uitkomst in mm:leer:laatst (JSON) en een regel per ronde in mm:leerlog. Grenzen: nooit een zone met een uitkomst, nooit de grootste bron van een campagne,
// behalve zones die Henkjan zelf vrijgaf (mm:instelling.henkjanOk.<net>, bijv. 17 okt "Ja kill die zones": 10799219, 10858179, 11768999).
import { zones, patronen, dag } from './mensmeter.js';
import { alleWissels, wisselStand, thompson } from './wissel.js';
import { modalLeer } from './modal.js';
import { claude } from './wtb.js';
import { externUitkomsten } from './extern.js';
import { voorspel } from './voorspel.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const paren = h => { if (!h) return []; if (Array.isArray(h)) { const o = []; for (let i = 0; i + 1 < h.length; i += 2) o.push([String(h[i]), h[i + 1]]); return o; } return Object.entries(h); };
const pct = (a, b) => (b ? Math.round(a / b * 1000) / 10 : null);
const dagen = n => Array.from({ length: n }, (_, i) => dag(-i));

export async function instelling(kv) { const s = (await kv.get('mm:instelling').catch(() => null)) || {}; return { blokkeren: s.blokkeren === true, minKliksAankomst: N(s.minKliksAankomst) || 10, aankomstGrens: N(s.aankomstGrens) || 30, ...s }; }

async function hashOver(kv, prefix, D) {
  const hs = await Promise.all(D.map(d => kv.raw(['HGETALL', prefix + d]).catch(() => null)));
  const R = {}; for (const h of hs) for (const [f, v] of paren(h)) R[f] = N(R[f]) + N(v); return R;
}
// "net|zone|veld" -> { "net|zone": { veld: n } }
function perSleutel(R, delen = 2) {
  const Z = {}; for (const [f, v] of Object.entries(R)) { const p = f.split('|'); if (p.length < delen + 1) continue; const k = p.slice(0, delen).join('|'), veld = p.slice(delen).join('|'); (Z[k] || (Z[k] = {}))[veld] = N((Z[k] || {})[veld]) + v; } return Z;
}

// PropellerAds: kliks per campagne en zone vandaag (UTC), alleen voor campagnes die via /go of /w lopen
async function paKliks(campagnes) {
  const tok = process.env.PROPELLER_API_TOKEN || process.env.PROPELLER_API_TOKEN_BACKUP || process.env.PROPELLER_TOKEN || '';
  if (!tok) { // geen sleutel in dit project: vraag het aan de PropellerAds-lus (propellerads-mcp), die de sleutel wel heeft (alleen lezen, met de gedeelde SHOP_SLEUTEL)
    const s = process.env.SHOP_SLEUTEL || ''; if (!s) return { sleutel: false, rijen: [] }; if (!campagnes.length) return { sleutel: true, via: 'lus', rijen: [] };
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 25000);
    try { const r = await fetch((process.env.PA_LUS_URL || 'https://propellerads-mcp.vercel.app') + '/api/statistiek', { method: 'POST', headers: { 'content-type': 'application/json', 'x-shop-sleutel': s }, body: JSON.stringify({ campagnes: campagnes.slice(0, 50) }), signal: ac.signal }); const j = await r.json().catch(() => ({})); return j && j.ok ? { sleutel: true, via: 'lus', rijen: (j.rijen || []).map(x => ({ camp: String(x.camp), zone: String(x.zone), kliks: N(x.kliks), kosten: N(x.kosten) })) } : { sleutel: true, via: 'lus', fout: String((j && j.fout) || 'HTTP ' + r.status).slice(0, 100), rijen: [] }; }
    catch (e) { return { sleutel: true, via: 'lus', fout: String(e && e.message || e).slice(0, 100), rijen: [] }; } finally { clearTimeout(t); }
  }
  if (!campagnes.length) return { sleutel: true, rijen: [] };
  const d = dag(), q = new URLSearchParams({ tz: '+0000', day_from: d + ' 00:00:00', day_to: d + ' 23:59:59', per_page: '1000' });
  q.append('group_by[]', 'campaign_id'); q.append('group_by[]', 'zone_id'); for (const c of campagnes.slice(0, 50)) q.append('campaign_id[]', c);
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 12000);
  try {
    const r = await fetch('https://ssp-api.propellerads.com/v5/adv/statistics?' + q, { headers: { Authorization: 'Bearer ' + tok, Accept: 'application/json' }, signal: ac.signal });
    if (!r.ok) return { sleutel: true, fout: 'HTTP ' + r.status, rijen: [] };
    const j = await r.json(); return { sleutel: true, rijen: (j.items || []).map(x => ({ camp: String(x.campaign_id), zone: String(x.zone_id), kliks: N(x.clicks), kosten: N(x.spent) })) };
  } catch (e) { return { sleutel: true, fout: String(e && e.message || e).slice(0, 100), rijen: [] }; } finally { clearTimeout(t); }
}

// profiel als getallen tussen 0 en 1, voor vergelijken
const KENMERKEN = ['mob', 'os_android', 'os_ios', 'os_windows', 'os_mac', 'uur_nacht', 'uur_ochtend', 'uur_middag', 'uur_avond', 'inapp', 'terug', 'rep', 'dc', 'js'];
function profiel(z, f) {
  const v = Math.max(1, N(z.v)), o = {};
  for (const k of KENMERKEN) {
    if (k === 'rep' || k === 'dc' || k === 'js') o[k] = N(z[k]) / v;
    else o[k] = N(f && f[k]) / v;
  }
  return o;
}
const cos = (a, b) => { let x = 0, y = 0, z = 0; for (const k of KENMERKEN) { x += a[k] * b[k]; y += a[k] * a[k]; z += b[k] * b[k]; } return y && z ? x / Math.sqrt(y * z) : 0; };

export async function leerRonde(kv, { droog = false } = {}) {
  const start = Date.now(), log = [], inst = await instelling(kv);
  const D3 = dagen(3), D7 = dagen(7);
  // 1. zoneprofielen
  const zr = await zones(kv, { dagen: 3 });
  const kenm = perSleutel(await hashOver(kv, 'mm:zf:', D3));
  // eigen bestemmingen zonder klik-id (todayin, lib/extern.js): hun keuzes en aanmeldingen per zone tellen mee als uitkomst
  const extern = await externUitkomsten(kv, { schrijf: !droog }).catch(e => [{ ok: false, fout: String(e && e.message || e).slice(0, 120) }]);
  // Amazon: verzadiging per tag (meer kliks, niet meer kopers) uit de Associates-meter van gisteren (lib/termles.js)
  const verz = await import('./termles.js').then(T => T.verzadiging(kv)).catch(e => ({ fout: String(e && e.message || e).slice(0, 120) }));
  const plus = (a, b) => { for (const [f, v] of Object.entries(b)) a[f] = N(a[f]) + v; return a; };
  const uit = perSleutel(plus(await hashOver(kv, 'mm:zu:', D7), await hashOver(kv, 'mm:zx:', D7)));
  const cu = perSleutel(plus(await hashOver(kv, 'mm:cu:', D7), await hashOver(kv, 'mm:cx:', D7)));
  // todayin: zones met 10+ echte mensen op todayin in 3 dagen en geen enkele keuze of aanmelding (alleen melden, nooit zelf blokkeren)
  const zxl = perSleutel(await hashOver(kv, 'mm:zxl:', D3)), zx3 = perSleutel(await hashOver(kv, 'mm:zx:', D3));
  const zonderKeuze = Object.entries(zxl).filter(([k, x]) => N(x.m) >= 10 && !N((zx3[k] || {}).actie) && !N((zx3[k] || {}).aanmelding)).map(([k, x]) => ({ netwerk: k.split('|')[0], zone: k.split('|')[1], bezoeken: N(x.v), mensen: N(x.m) })).sort((a, b) => b.mensen - a.mensen).slice(0, 40);
  const rijen = zr.zones.map(z => {
    const k = z.netwerk + '|' + z.zone, u = uit[k] || {}, f = kenm[k] || {};
    const uitkomst = N(u.echt) + N(u.actie) + N(u.aanmelding) + N(u.koop);
    return { ...z, uitkomsten: { echt: N(u.echt), actie: N(u.actie), aanmelding: N(u.aanmelding), koop: N(u.koop) }, uitkomst, profiel: profiel(z, f), kenmerken: f };
  });
  // 2. aankomst (PropellerAds)
  const ckeys = Object.keys(perSleutel(await hashOver(kv, 'mm:c:', [dag()]))).filter(k => k.startsWith('propeller|')).map(k => k.split('|')[1]).filter(c => /^\d+$/.test(c));
  const pa = await paKliks(ckeys);
  const vandaag = perSleutel(await hashOver(kv, 'mm:z:', [dag()]));
  const aankomst = [];
  const paZone = {}; for (const r of pa.rijen) { const k = 'propeller|' + r.zone; const x = paZone[k] || (paZone[k] = { zone: r.zone, kliks: 0, kosten: 0, campagnes: [] }); x.kliks += r.kliks; x.kosten += r.kosten; if (r.kliks) x.campagnes.push(r.camp); }
  for (const [k, x] of Object.entries(paZone)) { const n = N((vandaag[k] || {}).n); if (x.kliks >= inst.minKliksAankomst) aankomst.push({ netwerk: 'propeller', zone: x.zone, betaald: x.kliks, aangekomen: n, pct: pct(n, x.kliks), kosten: Math.round(x.kosten * 1000) / 1000, campagnes: x.campagnes }); }
  aankomst.sort((a, b) => a.pct - b.pct);
  // grootste bron per campagne (nooit automatisch blokkeren)
  const grootste = new Set(); const perCamp = {}; for (const r of pa.rijen) { if (!perCamp[r.camp] || r.kliks > perCamp[r.camp].kliks) perCamp[r.camp] = r; } for (const r of Object.values(perCamp)) grootste.add('propeller|' + r.zone);
  // vangnet (16 okt): valt het ophalen van de PropellerAds-kliks uit, dan blijven de grootste bronnen van de vorige geslaagde ronde
  // en alles wat toen op Henkjans woord wachtte beschermd. Anders zou een time-out de grootste bron van een campagne vrijgeven.
  try {
    if (pa.rijen.length && !pa.fout) { if (!droog) await kv.set('mm:grootste:propeller', [...grootste].map(x => x.split('|')[1]), { ex: 7 * 86400 }); }
    else { const oud = (await kv.get('mm:grootste:propeller')) || []; const wacht = ((await kv.get('mm:blok:propeller')) || {}).wachtOpHenkjan || []; for (const z of [...oud, ...wacht]) grootste.add('propeller|' + z); }
  } catch (e) {}

  // 3. lijkt-op-winnaar
  const winnaars = rijen.filter(r => r.uitkomst >= 2 || (r.uitkomst >= 1 && r.v <= 20));
  let lijkt = [];
  if (winnaars.length) {
    const c = {}; for (const k of KENMERKEN) c[k] = winnaars.reduce((s, r) => s + r.profiel[k], 0) / winnaars.length;
    lijkt = rijen.filter(r => !r.uitkomst && r.v >= 10 && r.oordeel !== 'zwart').map(r => ({ netwerk: r.netwerk, zone: r.zone, v: r.v, gelijkenis: Math.round(cos(r.profiel, c) * 1000) / 1000 })).sort((a, b) => b.gelijkenis - a.gelijkenis).slice(0, 25);
  }
  // 4. botfarms en dezelfde site via twee netwerken
  const pt = await patronen(kv, { dagen: 3 }).catch(() => ({ vingerafdrukken: [], zones: [] }));
  const tweeNetten = [];
  for (const v of pt.vingerafdrukken || []) if ((v.netwerken || []).length >= 2) tweeNetten.push({ vingerafdruk: v.fp.slice(0, 8), bezoeken: v.bezoeken, zones: v.voorbeeldZones });
  // 5. wissels in leermodus
  const wissels = await alleWissels(kv), wisselUit = [];
  for (const w of wissels) {
    const st = await wisselStand(kv, w, 7);
    let nieuw = null;
    if (w.modus === 'leer') {
      nieuw = thompson(st, { doel: w.doel, verken: w.verken });
      if (!droog) { const vers = await kv.get('mm:wissel:' + w.naam); if (vers && vers.versie === w.versie) { vers.leer = nieuw; vers.leerAt = new Date().toISOString(); await kv.set('mm:wissel:' + w.naam, vers); } }
    }
    wisselUit.push({ naam: w.naam, uit: w.uit, modus: w.modus, doel: w.doel, gewichtenNu: nieuw || Object.fromEntries(w.armen.map(a => [a.id, a.gewicht])), armen: st.map(a => ({ id: a.id, n: a.n, nieuw: a.nieuw, terug: a.terug, herhaal: a.herhaal, echt: a.echt, actie: a.actie, aanmelding: a.aanmelding, koop: a.koop, amazon: a.soort === 'amazon' ? a.amazon : undefined })) });
  }
  // 6. blokvoorstel per netwerk
  const blok = {};
  const voeg = (net, zone, waarom, bewijs) => { if (net === 'propeller' && bewijs && !bewijs.campagnes) bewijs = { ...bewijs, campagnes: ((paZone['propeller|' + zone] || {}).campagnes || []) }; const k = net + '|' + zone; const r = rijen.find(x => x.netwerk === net && x.zone === zone); if (r && r.uitkomst) return; const ok = ((inst.henkjanOk || {})[net] || []).map(String).includes(String(zone)); if (grootste.has(k) && !ok) { (blok[net] || (blok[net] = {}))[zone] = { waarom, bewijs, wacht: 'grootste bron van een campagne: alleen op Henkjans woord' }; return; } const b = (blok[net] || (blok[net] = {})); if (!b[zone]) b[zone] = { waarom, bewijs }; };
  for (const r of rijen) {
    if (r.oordeel === 'zwart') voeg(r.netwerk, r.zone, r.waarom, { v: r.v });
    else if (r.oordeel === 'verdacht' && r.v >= 15) voeg(r.netwerk, r.zone, r.waarom, { v: r.v });
  }
  for (const a of aankomst) if (a.pct < inst.aankomstGrens) voeg(a.netwerk, a.zone, 'maar ' + a.pct + '% van ' + a.betaald + ' betaalde kliks kwam aan', a);
  for (const z of pt.zones || []) if (N(z.aandeelPct) >= 50 && N(z.bezoeken) >= 10) voeg(z.netwerk, z.zone, z.aandeelPct + '% van de bezoeken komt van een botfarm-vingerafdruk', z);
  // spellen (praisy.me, 24 okt): eerste antwoorden zonder vinger op het scherm of met webdriver = bot. 3+ in 3 dagen en geen enkel echt antwoord of deling.
  for (const [k, x] of Object.entries(zxl)) { const bot = N(x.bot), u = zx3[k] || {}; if (bot >= 3 && !N(u.actie) && !N(u.aanmelding)) voeg(k.split('|')[0], k.split('|')[1], bot + ' eerste antwoorden zonder aanraking of met webdriver (bot) en geen echt antwoord', { v: N(x.v), bot }); }
  const blokLijsten = {};
  for (const [net, zs] of Object.entries(blok)) {
    const lijst = Object.entries(zs).map(([zone, x]) => ({ zone, ...x }));
    blokLijsten[net] = { klaar: lijst.filter(x => !x.wacht).map(x => x.zone), wacht: lijst.filter(x => x.wacht).map(x => x.zone), details: lijst };
    if (!droog) await kv.set('mm:blok:' + net, { bijgewerkt: new Date().toISOString(), aan: inst.blokkeren, zones: blokLijsten[net].klaar, wachtOpHenkjan: blokLijsten[net].wacht, details: lijst.slice(0, 200) }, { ex: 3 * 86400 });
  }
  // lerende modal: gewichten per segment (Thompson op waarde per bezoeker)
  // zonekwaliteit voor de lerende modal (m = echte uitkomsten, z = zwart of verdacht), 3 dagen geldig
  if (!droog) { const zq = []; for (const r of rijen) { if (r.uitkomst) zq.push(r.netwerk + '|' + r.zone, 'm'); else if (r.oordeel === 'zwart' || r.oordeel === 'verdacht') zq.push(r.netwerk + '|' + r.zone, 'z'); } if (zq.length) { await kv.raw(['DEL', 'mm:zq']); for (let i = 0; i < zq.length; i += 400) await kv.raw(['HSET', 'mm:zq', ...zq.slice(i, i + 400)]); await kv.raw(['EXPIRE', 'mm:zq', 3 * 86400]); } }
  const modals = await modalLeer(kv, { droog, claude: droog ? null : claude }).catch(e => [{ fout: String(e && e.message || e).slice(0, 120) }]);
  // menszones: zones met echte uitkomsten (nooit blokkeren, kandidaat voor meer)
  const mens = rijen.filter(r => r.uitkomst).sort((a, b) => b.uitkomst - a.uitkomst).slice(0, 25).map(r => ({ netwerk: r.netwerk, zone: r.zone, v: r.v, ...r.uitkomsten }));
  const campUit = Object.entries(cu).map(([k, u]) => ({ campagne: k, ...u }));
  // 7. voorspellers: welke kenmerken van een klik voorspellen wat hij doet (lib/voorspel.js, 7 dagen)
  let vsp = null; try { vsp = await voorspel(kv, { dagen: 7 }); if (!droog) await kv.set('mm:voorspel', vsp, { ex: 2 * 86400 }); } catch (e) { vsp = { ok: false, fout: String(e && e.message || e).slice(0, 120) }; }
  const voorspelKort = vsp && vsp.ok ? { kliks: vsp.kliks, bezoeken: vsp.bezoeken, vondsten: vsp.aantalVondsten, top: (vsp.top || []).slice(0, 5).map(x => x.zin), amazon: (vsp.amazon || []).slice(0, 3).map(x => x.zin) } : vsp;
  const uitkomst = {
    bijgewerkt: new Date().toISOString(), duurMs: Date.now() - start, droog, blokkerenAan: inst.blokkeren,
    zones: { totaal: rijen.length, oordelen: zr.aantal },
    aankomst: { propellerSleutel: pa.sleutel, fout: pa.fout || null, campagnes: ckeys, laagste: aankomst.slice(0, 25) },
    blokvoorstel: blokLijsten, menszones: mens, lijktOpWinnaar: lijkt, winnaars: winnaars.length,
    botfarms: { aantal: pt.botfarms || 0, zones: (pt.zones || []).slice(0, 25) }, zelfdeSiteTweeNetwerken: tweeNetten.slice(0, 20),
    wissels: wisselUit, modals, uitkomstenPerCampagne: campUit.slice(0, 50), extern, todayinZonderKeuze: zonderKeuze, amazonVerzadiging: verz, voorspellers: voorspelKort
  };
  const regel = new Date().toISOString().slice(0, 16) + ' | zones ' + rijen.length + ' | blok ' + Object.entries(blokLijsten).map(([n, b]) => n + ' ' + b.klaar.length + (b.wacht.length ? '+' + b.wacht.length + ' wacht' : '')).join(', ') +
    ' | aankomst ' + (pa.sleutel ? aankomst.length + ' zones' : 'geen PA-sleutel') + ' | menszones ' + mens.length + ' | lijkt-op ' + lijkt.length + ' | botfarms ' + (pt.botfarms || 0) + ' | voorspellers ' + (vsp && vsp.ok ? vsp.aantalVondsten : 'fout') + ' | wissels ' + wissels.length + ' | modals ' + modals.length + ' | extern ' + extern.map(x => x.bron + (x.ok ? ' ' + x.aanmeldingen + ' aanm/' + x.acties + ' keuzes' : ' FOUT')).join(', ') + (inst.blokkeren ? ' | BLOKKEREN AAN' : '');
  if (!droog) { await kv.set('mm:leer:laatst', uitkomst, { ex: 7 * 86400 }); await kv.raw(['LPUSH', 'mm:leerlog', regel]); await kv.raw(['LTRIM', 'mm:leerlog', 0, 199]); }
  log.push(regel);
  return { ...uitkomst, regel };
}
