// Yoors Shop per uur: waar lekt de trechter? (lekkenpagina voor Babita, /api/shop/lekken)
//
// Eén Redis-hash per UTC-dag (hjdk:shu:JJJJMMDD), velden "UU|net|soort", 9 dagen bewaard. Zo kost het per dag één sleutel.
// Soorten: dv = aangekomen direct op de productpagina, view = aangekomen op de landingspagina, dm/lm = echt mens (cm.js),
// da/la = eerste tik, cart = winkelwagen, afreken = afrekenpagina geopend, betaal = betaling gestart, fout = betaling mislukt
// of afgebroken, koop = betaald, omzet = bedrag in centen. Bij afreken/betaal/fout/koop komt ook "soort:methode" mee (ideal, paypal ...).
// Betaalde kliks per uur haalt de pagina bij de PropellerAds-lus (propellerads-mcp /api/statistiek, perUur), 10 minuten bewaard.

const SLEUTEL = d => 'hjdk:shu:' + d;
const DAG = t => new Date(t).toISOString().slice(0, 10).replace(/-/g, '');
const UU = t => new Date(t).toISOString().slice(11, 13);
const N = v => Number(v) || 0;
export const SOORTEN_UUR = ['dv', 'view', 'dg', 'lg', 'dz', 'lz', 'dm', 'lm', 'da', 'la', 'cart', 'afreken', 'betaal', 'fout', 'koop', 'omzet'];
// dg/lg = productpagina geladen (cm.js draait op yoo.rs), dz/lz = 1 seconde in beeld. Henkjan 20 okt: "Eerst meten. Laat cm.js ook melden dat de pagina geladen is, en na 1 seconde in beeld."
const LAAD_SINDS = Date.parse('2026-10-20T22:40:00Z');
// Gedrag op de shop (cm.js, Henkjan 21 okt: "Zorg dat clikmind alles meet"): code -> uitleg. Telt per bezoeker eenmaal.
export const GEDRAG_KOLOM = [['t5', '5 s'], ['t15', '15 s'], ['t30', '30 s'], ['t60', '1 min'], ['t180', '3 min'], ['s25', 'scroll 25%'], ['s50', 'scroll 50%'], ['s90', 'scroll 90%'], ['fk', 'foto-tik'], ['bu', 'bundel gezien'], ['bk', 'bundel-tik'], ['vr', 'variant of aantal'], ['sv', 'bewaren'], ['vg', 'vergelijken'], ['dl', 'delen'], ['ch', 'chat'], ['wk', 'knop winkelwagen'], ['wp', 'winkelwagenpagina'], ['kk', 'knop afrekenen'], ['kp', 'afrekenpagina'], ['p2', '2+ pagina\'s'], ['p4', '4+ pagina\'s'], ['tr', 'kwam terug'], ['vz', 'verder-blok gezien'], ['vw', 'verder-tik'], ['dr', 'drukte gezien'], ['og', 'anderen-kozen-tik'], ['zk', 'zekerheid gezien'], ['pm', 'melding aangezet']];
const GEDRAG_SINDS = Date.parse('2026-10-21T20:00:00Z');

// Telt één of meer gebeurtenissen in het uur van t (standaard nu). Faalt stil: de shop of de klik mag hier nooit op wachten.
export async function uurTel(kv, net, soorten, t, n = 1) {
  try {
    const tt = Number(t) || Date.now(); const k = SLEUTEL(DAG(tt)), hh = UU(tt);
    const l = (Array.isArray(soorten) ? soorten : [soorten]).filter(Boolean);
    await Promise.all(l.map(s => kv.raw(['HINCRBY', k, hh + '|' + (net || 'x') + '|' + s, String(Math.round(n))])));
    await kv.raw(['EXPIRE', k, String(9 * 86400)]);
  } catch (e) {}
}

async function leesDag(kv, d) {
  try { const a = await kv.raw(['HGETALL', SLEUTEL(d)]); const o = {}; if (Array.isArray(a)) { for (let i = 0; i + 1 < a.length; i += 2) o[a[i]] = N(a[i + 1]); } else if (a && typeof a === 'object') { for (const [k, v] of Object.entries(a)) o[k] = N(v); } return o; } catch (e) { return {}; }
}

// Betaalde PropellerAds-kliks per UTC-uur voor de SHOP-LUS-campagnes (via de lus, die de sleutel heeft).
async function paUren(kv) {
  const K = 'hjdk:shop:pauren';
  try { const c = await kv.get(K); if (c && Date.now() - c.at < 600000) return c; } catch (e) {}
  const s = process.env.SHOP_SLEUTEL || ''; if (!s) return { at: Date.now(), fout: 'geen gedeelde sleutel', uren: {} };
  const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), 20000);
  try {
    const r = await fetch((process.env.PA_LUS_URL || 'https://propellerads-mcp.vercel.app') + '/api/statistiek', { method: 'POST', headers: { 'content-type': 'application/json', 'x-shop-sleutel': s }, body: JSON.stringify({ perUur: true, naam: 'SHOP-LUS' }), signal: ac.signal });
    const j = await r.json(); const uit = { at: Date.now(), ok: !!j.ok, fout: j.ok ? null : String(j.fout || 'HTTP ' + r.status).slice(0, 80), campagnes: N(j.campagnes), uren: j.uren || {} };
    if (uit.ok) { try { await kv.set(K, uit, { ex: 3600 }); } catch (e) {} }
    return uit;
  } catch (e) { return { at: Date.now(), fout: String(e && e.message || e).slice(0, 80), uren: {} }; } finally { clearTimeout(tm); }
}

const nlUurLabel = t => { try { return new Date(t).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }); } catch (e) { return new Date(t).toISOString().slice(5, 16); } };

// De laatste `uren` uren, nieuwste eerst, met per uur de trechter en de lekken.
export async function uurStand(kv, uren = 36) {
  const nu = Date.now(), start = Math.floor(nu / 3600e3) * 3600e3; const dagen = {};
  for (let i = 0; i < uren; i++) dagen[DAG(start - i * 3600e3)] = 1;
  const data = {}; for (const d of Object.keys(dagen)) data[d] = await leesDag(kv, d);
  const pa = await paUren(kv); const rijen = [];
  for (let i = 0; i < uren; i++) {
    const t = start - i * 3600e3, d = DAG(t), hh = UU(t), h = data[d] || {}; const r = { t, uur: nlUurLabel(t), lopend: i === 0, net: {}, methode: {} };
    for (const [f, v] of Object.entries(h)) { const [u, net, soort] = f.split('|'); if (u !== hh || !soort) continue; const [s, m] = soort.split(':');
      if (m) { const x = r.methode[m] || (r.methode[m] = {}); x[s] = N(x[s]) + v; continue; }
      const x = r.net[net] || (r.net[net] = {}); x[s] = N(x[s]) + v; r[s] = N(r[s]) + v; }
    const p = pa.uren[new Date(t).toISOString().slice(0, 13)]; r.paKliks = p ? p.kliks : 0; r.paKosten = p ? Math.round(p.kosten * 100) / 100 : 0;
    const paAan = N((r.net.pa || {}).dv) + N((r.net.pa || {}).view);
    r.aangekomen = N(r.dv) + N(r.view); r.echt = N(r.dm) + N(r.lm); r.tik = N(r.da) + N(r.la);
    r.geladen = N(r.dg) + N(r.lg); r.zicht = N(r.dz) + N(r.lz); r.laadMeting = t + 3600e3 > LAAD_SINDS; // pagina geladen en 1 s in beeld: gemeten sinds 20 okt
    r.pctGeladen = r.laadMeting && N(r.dv) ? Math.round(100 * N(r.dg) / N(r.dv)) : null; r.pctZicht = r.laadMeting && N(r.dv) ? Math.round(100 * N(r.dz) / N(r.dv)) : null;
    r.gedragMeting = t + 3600e3 > GEDRAG_SINDS; r.gedrag = {}; for (const [c] of GEDRAG_KOLOM) r.gedrag[c] = N(r['d' + c]) + N(r['l' + c]);
    r.pctAan = r.paKliks ? Math.round(100 * paAan / r.paKliks) : null; r.pctEcht = r.aangekomen ? Math.round(100 * r.echt / r.aangekomen) : null;
    const lek = [];
    if (r.laadMeting && t >= LAAD_SINDS && N(r.dv) >= 15 && r.pctGeladen !== null && r.pctGeladen < 60) lek.push({ waar: 'laden', ernst: 'rood', tekst: 'Van ' + N(r.dv) + ' bezoekers zag maar ' + r.pctGeladen + '% de productpagina laden: de rest was al weg (trage pagina of misklik).' });
    else if (r.laadMeting && t >= LAAD_SINDS && N(r.dg) >= 15 && r.pctZicht !== null && r.pctGeladen && r.pctZicht < 0.7 * r.pctGeladen) lek.push({ waar: 'in beeld', ernst: 'oranje', tekst: 'Pagina laadde bij ' + r.pctGeladen + '%, maar maar ' + r.pctZicht + '% hield hem 1 seconde in beeld.' });
    if (r.paKliks >= 20 && r.pctAan !== null && r.pctAan < 50) lek.push({ waar: 'aankomst', ernst: 'rood', tekst: 'Van ' + r.paKliks + ' betaalde kliks kwamen er ' + paAan + ' aan (' + r.pctAan + '%). Meting viel uit of de pagina laadt niet.' });
    if (r.aangekomen >= 15 && r.pctEcht !== null && r.pctEcht < 15) lek.push({ waar: 'productpagina', ernst: 'oranje', tekst: 'Maar ' + r.pctEcht + '% van de bezoekers is een echt mens op de pagina (doel 15% of meer).' });
    if (r.gedragMeting && r.geladen >= 15 && r.gedrag.t5 < 0.3 * r.geladen) lek.push({ waar: 'eerste 5 seconden', ernst: 'oranje', tekst: 'Van ' + r.geladen + ' geladen pagina\'s bleef maar ' + r.gedrag.t5 + ' 5 seconden kijken.' });
    if (r.gedragMeting && r.gedrag.wk >= 3 && N(r.cart) === 0) lek.push({ waar: 'winkelwagenknop', ernst: 'rood', tekst: r.gedrag.wk + ' keer op de winkelwagenknop getikt, 0 winkelwagens gemeld door de shop.' });
    if (N(r.cart) > 0 && N(r.afreken) === 0 && N(r.koop) === 0) lek.push({ waar: 'winkelwagen', ernst: 'oranje', tekst: N(r.cart) + ' winkelwagen, niemand op de afrekenpagina.' });
    if (N(r.afreken) > 0 && N(r.betaal) === 0 && N(r.koop) === 0) lek.push({ waar: 'afrekenen', ernst: 'oranje', tekst: N(r.afreken) + ' op de afrekenpagina, geen betaling gestart.' });
    if (N(r.betaal) > 0 && N(r.koop) === 0) lek.push({ waar: 'betaling', ernst: 'rood', tekst: N(r.betaal) + ' betaling gestart, 0 betaald.' });
    if (N(r.fout) > 0) lek.push({ waar: 'betaling', ernst: 'rood', tekst: N(r.fout) + ' betaling mislukt of afgebroken.' });
    r.lekken = lek; rijen.push(r);
  }
  const som = k => rijen.reduce((a, r) => a + N(r[k]), 0);
  const tot = { paKliks: som('paKliks'), paKosten: Math.round(rijen.reduce((a, r) => a + r.paKosten, 0) * 100) / 100, aangekomen: som('aangekomen'), geladen: som('geladen'), zicht: som('zicht'), echt: som('echt'), tik: som('tik'), cart: som('cart'), afreken: som('afreken'), betaal: som('betaal'), fout: som('fout'), koop: som('koop'), omzet: som('omzet') / 100, gedrag: Object.fromEntries(GEDRAG_KOLOM.map(([c]) => [c, rijen.reduce((a, r) => a + N(r.gedrag[c]), 0)])) };
  return { at: nu, uren, pa: { ok: !!pa.ok, fout: pa.fout || null, campagnes: pa.campagnes || 0, at: pa.at }, totaal: tot, rijen };
}

// Lekkenpagina (alleen lezen, geen sleutels, geen bezoekersgegevens): per uur de trechter, rood waar het lekt.
export function lekkenPagina(st, { esc, link = '' } = {}) {
  const e = esc || (s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])));
  const n = v => (v ? String(v) : '<span class="nul">0</span>');
  const pct = (v, grens) => v === null || v === undefined ? '<span class="nul">–</span>' : '<span class="' + (v < grens ? 'rood' : 'goed') + '">' + v + '%</span>';
  const dag24 = st.rijen.slice(0, 24); const s = k => dag24.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const t = { paKliks: s('paKliks'), aan: s('aangekomen'), geladen: s('geladen'), zicht: s('zicht'), echt: s('echt'), cart: s('cart'), afreken: s('afreken'), betaal: s('betaal'), fout: s('fout'), koop: s('koop'), omzet: s('omzet') / 100 };
  const g5 = dag24.reduce((a, r) => a + (Number(r.gedrag && r.gedrag.t5) || 0), 0), gwk = dag24.reduce((a, r) => a + (Number(r.gedrag && r.gedrag.wk) || 0), 0);
  const stap = [['Betaalde kliks (PropellerAds)', t.paKliks], ['Aangekomen op de shop', t.aan], ...(t.geladen ? [['Productpagina geladen', t.geladen], ['1 seconde in beeld', t.zicht]] : []), ['Echt mens op de pagina', t.echt], ...(g5 ? [['5 seconden gekeken', g5], ['Knop winkelwagen', gwk]] : []), ['Winkelwagen', t.cart], ['Afrekenpagina', t.afreken], ['Betaling gestart', t.betaal], ['Betaald', t.koop]];
  let grootste = null; for (let i = 1; i < stap.length; i++) { const [naam, v] = stap[i], vorig = stap[i - 1][1]; if (vorig >= 3 && v === 0) { grootste = { na: stap[i - 1][0], naar: naam, vorig }; } }
  if (t.cart > 0 && t.koop === 0) grootste = { na: 'Winkelwagen', naar: 'Betaald', vorig: t.cart };
  const methoden = {}; for (const r of st.rijen) for (const [m, x] of Object.entries(r.methode || {})) { const y = methoden[m] || (methoden[m] = {}); for (const [k, v] of Object.entries(x)) y[k] = (y[k] || 0) + v; }
  const rijen = st.rijen.map(r => '<tr class="' + (r.lekken.some(l => l.ernst === 'rood') ? 'rij-rood' : r.lekken.length ? 'rij-oranje' : '') + '"><td class="uur">' + e(r.uur) + (r.lopend ? ' <span class="nul">(loopt)</span>' : '') + '</td><td>' + n(r.paKliks) + '</td><td>' + n(r.aangekomen) + ' ' + (r.paKliks ? pct(r.pctAan, 50) : '') + '</td><td>' + (r.laadMeting ? n(r.geladen) + ' ' + (r.pctGeladen !== null ? pct(r.pctGeladen, 60) : '') : '<span class="nul">–</span>') + '</td><td>' + (r.laadMeting ? n(r.zicht) + ' ' + (r.pctZicht !== null ? pct(r.pctZicht, 40) : '') : '<span class="nul">–</span>') + '</td><td>' + n(r.echt) + ' ' + (r.aangekomen ? pct(r.pctEcht, 15) : '') + '</td><td>' + n(r.tik) + '</td><td>' + n(r.cart) + '</td><td>' + n(r.afreken) + '</td><td>' + n(r.betaal) + '</td><td>' + (r.fout ? '<span class="rood">' + r.fout + '</span>' : n(0)) + '</td><td>' + (r.koop ? '<b class="goed">' + r.koop + '</b>' + (r.omzet ? ' <span class="nul">€' + (r.omzet / 100).toFixed(2).replace('.', ',') + '</span>' : '') : n(0)) + '</td><td class="lek">' + r.lekken.map(l => '<span class="' + (l.ernst === 'rood' ? 'rood' : 'oranje') + '">' + e(l.tekst) + '</span>').join('<br>') + '</td></tr>').join('');
  const gm = st.rijen.filter(r => r.gedragMeting);
  const grij = gm.length ? '<div class="tw"><table><tr><th>Uur</th><th>Geladen</th>' + GEDRAG_KOLOM.map(([, l]) => '<th>' + e(l) + '</th>').join('') + '</tr>' + gm.map(r => '<tr><td class="uur">' + e(r.uur) + (r.lopend ? ' <span class="nul">(loopt)</span>' : '') + '</td><td>' + n(r.geladen) + '</td>' + GEDRAG_KOLOM.map(([c]) => '<td>' + n(r.gedrag[c]) + (r.geladen && r.gedrag[c] ? ' <span class="nul">' + Math.round(100 * r.gedrag[c] / r.geladen) + '%</span>' : '') + '</td>').join('') + '</tr>').join('') + '</table></div>' : '<p class="meta">Nog geen uren met deze meting.</p>';
  const mrij = Object.entries(methoden).sort((a, b) => (b[1].afreken || 0) - (a[1].afreken || 0)).map(([m, x]) => '<tr><td>' + e(m) + '</td><td>' + n(x.afreken) + '</td><td>' + n(x.betaal) + '</td><td>' + (x.fout ? '<span class="rood">' + x.fout + '</span>' : n(0)) + '</td><td>' + n(x.koop) + '</td></tr>').join('');
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><meta http-equiv="refresh" content="300"><title>Yoors Shop per uur</title>
<style>:root{--ink:#10131a;--ink-2:#3c4350;--ink-3:#6b7280;--line:#e4e7ec;--bg:#fff;--bg-2:#f7f8fa;--rood:#b91c1c;--oranje:#b45309;--goed:#15803d;--rbg:#fef2f2;--obg:#fffbeb}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--ink:#f3f5f8;--ink-2:#c3c9d4;--ink-3:#8d95a3;--line:#262b36;--bg:#0c0e13;--bg-2:#13161d;--rood:#f87171;--oranje:#fbbf24;--goed:#4ade80;--rbg:#2a1215;--obg:#2a210f}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:400 1rem/1.55 ui-sans-serif,-apple-system,"Segoe UI",Inter,Roboto,Helvetica,Arial,sans-serif}main{max-width:72rem;margin:0 auto;padding:24px 16px 48px}
h1{font-size:1.75rem;margin:0 0 6px;letter-spacing:-.02em}h2{font-size:1.2rem;margin:34px 0 10px}.meta{color:var(--ink-3);font-size:.875rem;margin:0 0 18px}
.box{border:1px solid var(--line);border-left:4px solid var(--rood);background:var(--rbg);border-radius:10px;padding:14px 16px;margin:0 0 18px}.box.ok{border-left-color:var(--goed);background:var(--bg-2)}
.trechter{display:grid;grid-template-columns:repeat(auto-fit,minmax(9rem,1fr));gap:8px;margin:0 0 8px}.stap{border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--bg-2)}.stap b{display:block;font-size:1.4rem}.stap span{font-size:.8125rem;color:var(--ink-3)}
.tw{overflow-x:auto;border:1px solid var(--line);border-radius:10px}table{border-collapse:collapse;width:100%;font-size:.875rem}th,td{padding:7px 9px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top;white-space:nowrap}td.lek{white-space:normal;min-width:16rem}th{color:var(--ink-3);font-weight:600;background:var(--bg-2)}
.rij-rood td{background:var(--rbg)}.rij-oranje td{background:var(--obg)}.rood{color:var(--rood);font-weight:650}.oranje{color:var(--oranje);font-weight:600}.goed{color:var(--goed);font-weight:650}.nul{color:var(--ink-3)}.uur{font-weight:600}
ul{padding-left:20px}li{margin:4px 0;color:var(--ink-2)}</style></head><body><main>
<h1>Yoors Shop per uur: waar lekt het?</h1>
<p class="meta">Nederlandse tijd, nieuwste uur bovenaan, laatste ${st.uren} uur. Ververst zichzelf elke 5 minuten. ${st.pa.ok ? 'Betaalde kliks: ' + st.pa.campagnes + ' PropellerAds-campagnes (SHOP-LUS).' : '<span class="oranje">Betaalde kliks nu niet op te halen (' + e(st.pa.fout || 'onbekend') + ').</span>'} Mondiad geeft geen cijfers per uur; die bezoekers tellen wel mee vanaf "aangekomen".${link ? ' <a href="' + e(link) + '">Terug naar de briefing</a>' : ''}</p>
${grootste ? `<div class="box"><b>Grootste lek, laatste 24 uur:</b> ${e(grootste.vorig)} keer "${e(grootste.na.toLowerCase())}", en daarna 0 keer "${e(grootste.naar.toLowerCase())}".</div>` : `<div class="box ok"><b>Geen stap die op 0 blijft</b> in de laatste 24 uur.</div>`}
<div class="trechter">${stap.map(([naam, v]) => '<div class="stap"><b>' + v + '</b><span>' + e(naam) + '</span></div>').join('')}<div class="stap"><b>€${t.omzet.toFixed(2).replace('.', ',')}</b><span>Omzet uit campagnes</span></div></div>
<p class="meta">Laatste 24 uur. Een stap die steeds op 0 blijft terwijl de stap ervoor er wel is, is het lek.</p>
<h2>Per uur</h2>
<div class="tw"><table><tr><th>Uur</th><th>Betaalde kliks</th><th>Aangekomen</th><th>Pagina geladen</th><th>1 s in beeld</th><th>Echt mens</th><th>Tik</th><th>Winkelwagen</th><th>Afrekenpagina</th><th>Betaling gestart</th><th>Mislukt</th><th>Betaald</th><th>Lek</th></tr>${rijen}</table></div>
<h2>Gedrag op de pagina</h2>
<p class="meta">Wat bezoekers op yoo.rs doen, per uur (gemeten door Clickmind sinds 21 oktober 22:00 NL). Elke bezoeker telt per kolom hoogstens één keer.</p>
${grij}
<h2>Per betaalmethode</h2>
${mrij ? `<div class="tw"><table><tr><th>Methode</th><th>Afrekenpagina</th><th>Betaling gestart</th><th>Mislukt</th><th>Betaald</th></tr>${mrij}</table></div>` : '<p class="meta">Nog geen meldingen met een betaalmethode. Die komen binnen zodra de shop afrekenen(), betaalStart(), betaalMislukt() en betaald() aanroept met de methode erbij.</p>'}
<h2>Wat de kolommen betekenen</h2>
<ul><li><b>Betaalde kliks</b>: wat PropellerAds dat uur afrekende.</li><li><b>Aangekomen</b>: wat bij ons binnenkwam. Het percentage is het deel van de PropellerAds-kliks. Onder 50% is rood: de meting viel uit of de pagina laadt niet.</li>
<li><b>Pagina geladen</b>: de productpagina op yoo.rs is zo ver geladen dat cm.js draait (gemeten sinds 20 oktober). Onder 60% van de directe bezoekers is rood: de rest was al weg voor ze iets zagen. <b>1 s in beeld</b>: de pagina stond minstens 1 seconde zichtbaar op het scherm.</li><li><b>Echt mens</b>: bezoekers die de pagina 3 seconden zagen en hem aanraakten of scrolden (cm.js). Onder 15% is rood: de productpagina houdt ze niet vast.</li><li><b>Tik</b>: eerste klik op de pagina.</li>
<li><b>Gedrag op de pagina</b>: tijd dat de shop zichtbaar op het scherm stond (opgeteld over alle pagina's van het bezoek), hoe ver er gescrold is, tikken op foto, bundel, variant of aantal, bewaren, vergelijken, delen, chat, winkelwagen- of bestelknop en afrekenknop, of de bundel in beeld kwam, of iemand de winkelwagen- of afrekenpagina opende, meer pagina's bekeek, of later zelf terugkwam. Het percentage is het deel van de geladen pagina's. Rood als er wel op de winkelwagenknop getikt wordt maar de shop geen winkelwagen meldt.</li>
<li><b>Winkelwagen, Afrekenpagina, Betaling gestart, Mislukt, Betaald</b>: meldingen van de shop zelf (yoors-shop-conversies.php). Betaald telt ook als de bestelling alleen in de datapagina van de shop staat; zo valt er geen betaling weg.</li></ul>
<p class="meta">Alleen totalen per uur, geen personen, adressen of sleutels. Bijgewerkt ${e(new Date(st.at).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' }))}.</p>
</main></body></html>`;
}

// Eenmalig: de uren van vóór deze teller vullen uit de klikrecords (hjdk:shc:*), laatste 48 uur. Draait hooguit één keer (SET NX).
export async function uurAanvullen(kv) {
  try { const ok = await kv.raw(['SET', 'hjdk:shu:aangevuld', String(Date.now()), 'NX', 'EX', String(30 * 86400)]); if (ok !== 'OK') return { al: true }; } catch (e) { return { fout: true }; }
  const grens = Date.now() - 48 * 3600e3, LIVE = Date.parse('2026-10-16T23:25:56Z'); let cur = '0', n = 0, gezien = 0; // vanaf LIVE telt uurTel zelf
  const vroeg = v => v && v < LIVE;
  do { const [c, keys] = await kv.scan(cur, { match: 'hjdk:shc:*', count: 1000 }); cur = c;
    for (let i = 0; i < keys.length; i += 200) { const vals = await kv.mget(...keys.slice(i, i + 200)); gezien += vals.length;
      for (const r of vals) { if (!r || r.t || !r.at || r.at < grens) continue; const net = r.s || 'x', d = r.arm === 'd';
        if (vroeg(r.at)) { await uurTel(kv, net, d ? 'dv' : 'view', r.at); n++; }
        if (vroeg(r.ym)) await uurTel(kv, net, d ? 'dm' : 'lm', r.ym); if (vroeg(r.ya)) await uurTel(kv, net, d ? 'da' : 'la', r.ya);
        if (r.px) { if (vroeg(r.px.cart)) await uurTel(kv, net, 'cart', r.px.cart); for (const [k, v] of Object.entries(r.px)) if (k.startsWith('koop') && vroeg(v)) await uurTel(kv, net, 'koop', v); } } }
  } while (cur !== '0' && gezien < 60000);
  return { aangevuld: n };
}

// Uurritme (Henkjan 28 okt 2026: "Zorg dat clikcmind minder inkoopt als mensen eten inderdaad"). Per Nederlands uur van de dag,
// over de laatste 7 dagen: het aandeel echte mensen per aankomst (PropellerAds, directe route naar kadoly.com). Een uur koopt minder
// in (factor 0,5) als dat aandeel duidelijk onder het gemiddelde ligt (onder 70% ervan, relatief, bij genoeg aankomsten), en
// etenstijd (17 tot 20 uur NL) koopt standaard minder in, tot de cijfers laten zien dat dat uur minstens gemiddeld is.
// De PropellerAds-ronde (propellerads-mcp lib/shoptest.ts, elk uur) zet het bod van elke shopcampagne op basisbod x factor.
export const ETENSTIJD = [17, 18, 19];
const nlUurVan = t => Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hour: '2-digit', hour12: false }).format(new Date(t))) % 24;
export async function uurRitme(kv, net = 'pa') {
  const nu = Date.now(); const per = Array.from({ length: 24 }, () => ({ dv: 0, dm: 0, da: 0 }));
  for (let i = 0; i <= 7; i++) {
    const d = DAG(nu - i * 864e5); const o = await leesDag(kv, d);
    for (const [k, v] of Object.entries(o || {})) {
      const [hh, n, s] = String(k).split('|'); if (n !== net || (s !== 'dv' && s !== 'dm' && s !== 'da')) continue;
      const t = Date.parse(d.slice(0, 4) + '-' + d.slice(4, 6) + '-' + d.slice(6, 8) + 'T' + hh + ':30:00Z'); if (!Number.isFinite(t) || nu - t > 7 * 864e5) continue;
      per[nlUurVan(t)][s] += N(v);
    }
  }
  let sv = 0, sm = 0; per.forEach(p => { sv += p.dv; sm += p.dm; });
  const gem = sv ? sm / sv : 0;
  const uren = per.map((p, uur) => {
    const aandeel = p.dv ? p.dm / p.dv : 0, genoeg = p.dv >= 150, ratio = gem ? aandeel / gem : 0;
    let factor = 1, reden = genoeg ? 'normaal' : 'te weinig cijfers';
    if (genoeg && ratio < 0.7) { factor = 0.5; reden = 'zwak uur: ' + (100 * aandeel).toFixed(1) + '% echte mensen tegen gemiddeld ' + (100 * gem).toFixed(1) + '%'; }
    else if (ETENSTIJD.includes(uur) && !(genoeg && ratio >= 1)) { factor = 0.5; reden = 'etenstijd' + (genoeg ? ' (' + (100 * aandeel).toFixed(1) + '% tegen gemiddeld ' + (100 * gem).toFixed(1) + '%)' : ''); }
    return { uur, aankomsten: p.dv, echt: p.dm, actie: p.da, aandeel: Math.round(aandeel * 1000) / 10, factor, reden };
  });
  const nlUur = nlUurVan(nu);
  return { at: new Date(nu).toISOString(), net, dagen: 7, gemiddeld: Math.round(gem * 1000) / 10, nlUur, factorNu: uren[nlUur].factor, redenNu: uren[nlUur].reden, uren };
}
