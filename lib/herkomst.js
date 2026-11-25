// Herkomst van elke betaalde bestelling in Kadoly (25 nov 2026, Henkjan: "Zorg dat je niets meer mist en altijd bron kan vinden !").
// Aanleiding: 25 nov 07:30 UTC 2x tafelhaard EUR 69,95 zonder kenmerk; van de laatste 5 betaalde bestellingen hadden er 3 geen bron.
// Volgorde van bewijs (sterkste eerst):
//  1. kenmerk hj van onze eigen advertentieroute (Clickmind-record: netwerk, plek, minuten na de klik)
//  2. zelfde e-mail-vingerafdruk als bij een eerdere klik (lib/cmmatch.js, ander apparaat of later teruggekomen)
//  3. klik-id in de order: gclid/gbraid/wbraid (Google Ads), srsltid (Google Shopping gratis), ttclid (TikTok), fbclid/wacid (Meta/Whop),
//     epik (Pinterest), msclkid (Bing); uit herkomst_laatst of herkomst_eerst (TAAK H) of de losse velden (TAAK K)
//  4. utm_source/utm_medium uit herkomst_laatst, dan herkomst_eerst
//  5. verwijzende site (referrer-host) uit herkomst_laatst, dan herkomst_eerst
//  6. antwoord op de bedankpagina "Hoe kwam je bij Kadoly?" (hoe_gevonden)
//  7. ad_network dat de shop zelf meegaf
// Niets gevonden = 'onbekend' met de reden (de winkel stuurt nog geen herkomst mee: TAAK H). Geen persoonsgegevens in de uitkomst.

const KLIK = [
  ['gclid', 'google-ads'], ['gbraid', 'google-ads'], ['wbraid', 'google-ads'], ['srsltid', 'google-shopping-gratis'],
  ['ttclid', 'tiktok'], ['fbclid', 'meta'], ['wacid', 'meta-whop'], ['epik', 'pinterest'], ['msclkid', 'bing']
];
const NET = { tt: 'tiktok', pa: 'propellerads', md: 'mondiad', mg: 'mgid', ca: 'clickadu', ra: 'richads', wh: 'meta-whop', x: 'x', pi: 'pinterest', go: 'google-ads' };
const HOST = [
  [/(^|\.)google\./, 'google'], [/(^|\.)bing\.com$/, 'bing'], [/duckduckgo|ecosia|yahoo\./, 'zoekmachine'],
  [/(^|\.)tiktok\.com$/, 'tiktok'], [/facebook\.com$|fb\.com$|instagram\.com$|messenger\.com$/, 'meta'], [/pinterest\./, 'pinterest'],
  [/(^|\.)whop\.com$/, 'meta-whop'], [/chatgpt\.com$|openai\.com$|perplexity\.ai$|gemini\.google|copilot\.microsoft|claude\.ai$/, 'ai-assistent'],
  [/^gids\.kadoly\.com$/, 'kadoly-gids'], [/keuzehulp\.best$|whichtobuy\.best$|kaufberater\.best$/, 'keuzehulp'],
  [/mail\.|outlook\.|gmail/, 'e-mail'], [/^(www\.)?kadoly\.com$/, null]
];
const HOE = { google: 'google', tiktok: 'tiktok', 'instagram/facebook': 'meta', instagram: 'meta', facebook: 'meta', pinterest: 'pinterest', 'via iemand': 'mond-tot-mond', 'al eerder gekocht': 'terugkerend', anders: 'anders' };

function obj(x) { if (!x) return null; if (typeof x === 'object') return x; try { const j = JSON.parse(String(x)); return j && typeof j === 'object' ? j : null; } catch (e) { return null; } }
const schoon = (s, n = 60) => String(s || '').replace(/[^\w .:/-]/g, '').slice(0, n);
function hostVan(r) { const s = String(r || '').trim(); if (!s) return ''; try { return new URL(/^https?:/i.test(s) ? s : 'https://' + s).hostname.toLowerCase(); } catch (e) { return s.toLowerCase().slice(0, 80); } }
function hostBron(h) { for (const [re, b] of HOST) if (re.test(h)) return b === null ? '' : b; return h ? 'site:' + h : ''; }

function uitTouch(t, wanneer) {
  if (!t) return null;
  for (const [k, b] of KLIK) if (t[k]) return { bron: b, via: k + ' (' + wanneer + ')' };
  if (t.hj || t.mmc) return { bron: 'eigen-advertentie', via: (t.hj ? 'hj' : 'mmc') + ' (' + wanneer + ')' };
  const us = String(t.utm_source || '').toLowerCase();
  if (us) return { bron: schoon(us, 30) + (t.utm_medium ? '/' + schoon(String(t.utm_medium).toLowerCase(), 20) : ''), via: 'utm (' + wanneer + ')', campagne: t.utm_campaign ? schoon(t.utm_campaign) : undefined };
  const h = hostVan(t.referrer || t.ref || t.referrer_host || t.r);
  const hb = hostBron(h); if (hb) return { bron: hb, via: 'verwijzer ' + h + ' (' + wanneer + ')' };
  return null;
}

// getRec(hj) geeft het Clickmind-record of null; zoekEm(o) geeft een hj-code bij dezelfde e-mail-vingerafdruk of null.
export async function bronVan(o, { getRec, zoekEm, bezoekVan } = {}) {
  const uit = { bron: 'onbekend', via: '', zeker: 0 };
  const zet = (b, via, zeker, extra) => Object.assign(uit, { bron: b, via, zeker }, extra || {});
  const lt = obj(o.herkomst_laatst), ft = obj(o.herkomst_eerst);
  if (ft) { const f = uitTouch(ft, 'eerste bezoek'); if (f) uit.eerst = f.bron; }
  // 1. eigen kenmerk
  const hj = String(o.hj || '').replace(/[^a-z0-9]/gi, '').slice(0, 14);
  if (hj && getRec) { let rec = null; try { rec = await getRec(hj); } catch (e) {} if (rec) { const at = Date.parse(o.created_at || '') || 0; return zet(NET[rec.s] || rec.s || '?', 'klik via onze advertentieroute', 3, { plek: rec.z || null, minNaKlik: rec.at && at ? Math.round((at - rec.at) / 60000) : null, test: !!rec.t }); } }
  // 2. e-mail-vingerafdruk bij een eerdere klik
  if (zoekEm) { let code = null; try { code = await zoekEm(o); } catch (e) {} if (code && getRec) { let rec = null; try { rec = await getRec(code); } catch (e) {} if (rec) return zet(NET[rec.s] || rec.s || '?', 'zelfde e-mail als een eerdere advertentieklik', 2, { plek: rec.z || null, test: !!rec.t }); } }
  // 2b. Clickmind-bezoeker met hetzelfde e-mailadres (cm.js op kadoly.com, elke bezoeker, sinds 25 nov)
  if (bezoekVan) { let b = null; try { b = await bezoekVan(o); } catch (e) {} if (b) {
    if (b.c && getRec) { let rec = null; try { rec = await getRec(b.c); } catch (e) {} if (rec) return zet(NET[rec.s] || rec.s || '?', 'Clickmind: zelfde bezoeker klikte eerder op onze advertentie', 3, { plek: rec.z || null, test: !!rec.t, eerst: b.ft ? (uitTouch(b.ft, 'eerste bezoek') || {}).bron : undefined }); }
    const bl = uitTouch(b.lt, 'laatste bezoek, Clickmind') || uitTouch(b.ft, 'eerste bezoek, Clickmind');
    if (bl) return zet(bl.bron, bl.via, 2, Object.assign({ bezoeken: b.n || null }, bl.campagne ? { campagne: bl.campagne } : null, b.ft ? { eerst: (uitTouch(b.ft, 'x') || { bron: 'direct' }).bron } : null));
    return zet('direct', 'Clickmind: bezoeker kwam zonder verwijzer (getypt, bladwijzer of app), landing ' + schoon((b.lt && b.lt.l) || (b.ft && b.ft.l) || '-', 80), 2, { bezoeken: b.n || null }); } }
  // 3-5. laatste en eerste bezoek (TAAK H), dan losse klik-id's (TAAK K)
  const l = uitTouch(lt, 'laatste bezoek'); if (l) return zet(l.bron, l.via, 2, l.campagne ? { campagne: l.campagne } : null);
  for (const [k, b] of KLIK) if (o[k]) return zet(b, k + ' bij de order', 2);
  const f = uitTouch(ft, 'eerste bezoek'); if (f) return zet(f.bron, f.via, 1, f.campagne ? { campagne: f.campagne } : null);
  // 6. antwoord van de koper
  const hoe = String(o.hoe_gevonden || '').trim().toLowerCase(); if (hoe) return zet(HOE[hoe] || schoon(hoe, 30), 'antwoord koper op de bedankpagina', 1);
  // 7. wat de shop zelf meegaf
  if (o.ad_network) return zet(NET[o.ad_network] || schoon(o.ad_network, 20), 'ad_network van de shop', 1);
  if (lt && (lt.landing || lt.pad)) return zet('direct', 'geen verwijzer, landing ' + schoon(lt.landing || lt.pad, 80), 1);
  uit.via = (lt || ft) ? 'herkomst zonder bron' : (o.em || o.email_sha256 || o.em_sha256) ? 'geen Clickmind-bezoek bij dit e-mailadres (bestelling van voor 25 nov of cm.js niet geladen)' : 'winkel stuurt geen e-mail-vingerafdruk en geen herkomst mee (TAAK H)';
  if (o.eerder_besteld === true || o.eerder_besteld === 'ja') uit.terugkerend = true;
  return uit;
}

// Samenvatting per bron voor een lijst met uitkomsten.
export function perBron(lijst) {
  const s = {}; for (const b of lijst) { const k = b.bron || 'onbekend'; const o = s[k] = s[k] || { bestellingen: 0, omzet: 0 }; o.bestellingen++; o.omzet = Math.round((o.omzet + (Number(b.bedrag) || 0)) * 100) / 100; }
  return s;
}
