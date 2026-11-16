// Yoors Shop: directe route met Clickmind onzichtbaar ertussen (Henkjan, 14 okt 2026).
import { uurTel } from './shopuur.js';
// Een advertentieklik op keuzehulp.best/shop gaat per persoon (vast) naar de landingspagina (arm l) of in één keer
// door naar de productpagina op yoo.rs (arm d, 302). In arm d logt Clickmind de klik (bot- en terugbetalingsbewijs)
// en gaan hj (winkelwagen en betaling via de shop) en mmc (Clickmind-klik-id) mee in de URL.
// Op yoo.rs meldt cm.js (één regel van Babita) "echt" en "actie" terug via /api/mm/uitkomst; lib/wissel.js roept dan
// shopUitkomst aan. In arm d is de eerste tik op de productpagina (actie) het hoofddoel voor het netwerk: dat is het
// equivalent van de doorklik op de landingspagina. Clickadu krijgt alleen de betaling (SmartCPA rekent per conversie).
import { createHash } from 'node:crypto';
import { whEvent } from './whop.js';

export const PB = { pa: 'https://ad.propellerads.com/conversion.php?aid=3772727&pid=&tid=151850&visitor_id={clickid}', md: 'https://postback.mondiad.com/track?uid=31070&clickid={clickid}', ra: 'https://us.ahows.co/log?action=conversion&key={clickid}' };
if (/^https:\/\/\S+\{clickid\}/.test(process.env.SHOP_PB_CLICKADU || '')) PB.ca = process.env.SHOP_PB_CLICKADU.trim();
// MGID (4 nov 2026, Henkjan: "Zet voor morgen MGID op voor 10 kansrijke producten ... zet zeer zeker Clickmind er zeer stevig tussen en meet alle gedrag"):
// drie conversiestappen per campagne, elk een eigen melding (e=): interest = echt mens op de shop (Clickmind), decision = afrekenpagina open,
// buy = betaald met bedrag (r=). 878485 is het MGID-klantnummer (geen sleutel). Zelfde namen als de stappen in set_conversions.
export const MG_STAP = { echt: 'kdecht', kassa: 'kdkassa', koop: 'kdkoop' };
const MG_PB = 'https://a.mgid.com/postback/878485?c={clickid}&e=';
// MGID wil per account unieke meldingsnamen: de naam krijgt het campagnenummer erachter (kdecht12534207). Alleen de eerste campagne
// (12534206, 4 nov) heeft de namen zonder nummer. Zo stel je een nieuwe campagne in: set_conversions met postback kdecht<id>, kdkassa<id>, kdkoop<id>.
const MG_ZONDER = new Set(['12534206']);
export const mgEvent = (e, camp) => { const c = String(camp || '').replace(/\D/g, ''); return c && !MG_ZONDER.has(c) ? e + c : e; };
export const mgUrl = (clickid, e, r) => MG_PB.replace('{clickid}', encodeURIComponent(clickid)) + e + (Number(r) > 0 ? '&r=' + Number(r).toFixed(2) : '');
PB.mg = MG_PB + MG_STAP.echt;
export const CM_NET = { pa: 'propeller', md: 'mondiad', ra: 'richads', ca: 'clickadu', mg: 'mgid', tt: 'tiktok', wh: 'whop', pi: 'pinterest', x: 'onbekend' };
// Gedrag op de shop dat cm.js op yoo.rs meldt (Henkjan 21 okt: "Zorg dat clikmind alles meet"), soort -> code. Elke soort telt eenmaal per klik.
export const GEDRAG = { terug: 'tr', p2: 'p2', p4: 'p4', wpag: 'wp', kpag: 'kp', t5: 't5', t15: 't15', t30: 't30', t60: 't60', t180: 't180', s25: 's25', s50: 's50', s90: 's90', wklik: 'wk', kklik: 'kk', bklik: 'bk', fklik: 'fk', bundel: 'bu', bewaar: 'sv', vergelijk: 'vg', deel: 'dl', chat: 'ch', keuze: 'vr', verderzicht: 'vz', verder: 'vw', drukte: 'dr', ookgekozen: 'og', zeker: 'zk', melding: 'pm', kt20: 'k2', kt60: 'k6', kmail: 'ke', kadres: 'ka', kmeth: 'km', kknop: 'kz', kpay: 'kb', kpp: 'kq', kfout: 'kf', kweg: 'kw', kprijs: 'kr', kfee: 'kg', kt5: 'k5', kscroll: 'ks', kterug: 'kt', kweg5: 'kx', kweg20: 'ky', kweglang: 'kl', kuit: 'ku', bsopen: 'bo', bsmail: 'bm', bsadres: 'ba', bsgoogle: 'bg', bsverder: 'bn', bsvast: 'bv', bsdicht: 'bd', bsweg: 'bw', wkwag: 'ww', wnav: 'wn' }; // 14 nov: het koopblad op mobiel (Nu kopen opent "Waar mag het heen?" op de productpagina, pas na Verder naar betalen de afrekenpagina), In winkelwagen en het winkelwagen-icoon apart // 10 nov: waarom 29 van de 38 weggaan (binnen 5 s, 5-20 s of later, gescrold, terug naar het product) // k*: de afrekenpagina (3 nov, Henkjan: "Clickmind meten natuurlijk") // laatste zes: de bezoekersblokken van Babita-taak 10 tot 15 (data-cm / data-cm-zicht)
export const SOORTEN_DIRECT = ['dv', 'dm', 'da', 'lm', 'la', 'dg', 'dz', 'lg', 'lz', ...Object.values(GEDRAG).map(c => 'd' + c)]; // dg/dz, lg/lz = pagina geladen en 1 s in beeld (20 okt);// dv = aangekomen via de directe route, dm/da = echt/actie op de shop (arm d), lm/la = idem voor wie via de landingspagina kwam
const K_INST = 'hjdk:shop:direct', K_MEET = 'hjdk:shop:ymeet';
const D8 = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');
const pk = pid => String(pid).toLowerCase().replace(/[^a-z0-9]/g, '');
const num = v => Number(v) || 0;

// Instelling: welk deel van de betaalde bezoekers direct naar de shop gaat. Standaard 50 (proef: helft direct, helft landingspagina).
export async function directInst(kv) { let c = null; try { c = await kv.get(K_INST); } catch (e) {} const pct = c && Number.isFinite(Number(c.pct)) ? Math.max(0, Math.min(100, Math.round(Number(c.pct)))) : 50; return { pct, at: (c && c.at) || null, door: (c && c.door) || null }; }
export async function zetDirect(kv, pct, door) { const p = Math.max(0, Math.min(100, Math.round(Number(pct)))); if (!Number.isFinite(p)) throw new Error('pct 0 tot 100'); const c = { pct: p, at: new Date().toISOString(), door: String(door || '').slice(0, 40) }; await kv.set(K_INST, c); return c; }
// Meet cm.js op yoo.rs al? (gezet bij de eerste "echt" van een shopbezoeker, 2 dagen geldig)
export async function shopMeet(kv) { try { const t = num(await kv.get(K_MEET)), tt = num(await kv.get(K_MEET + ':test')); return { aan: !!t, laatst: t ? new Date(t).toISOString() : null, test: tt ? new Date(tt).toISOString() : null }; } catch (e) { return { aan: false, laatst: null, test: null }; } }
// Vaste arm per persoon (zelfde apparaat = zelfde arm), los van of het een bot lijkt: iedereen krijgt dezelfde behandeling (geen cloaking).
export function shopArm(sleutel, pct) { const h = createHash('sha256').update('shoparm|' + String(sleutel || '')).digest(); return (h.readUInt16BE(0) % 100) < pct ? 'd' : 'l'; }
// Deel van het geld dat bij de landingspagina hoort, voor regels die op doorkliks oordelen (o = tellers met view en dv).
// Meet cm.js op de shop, dan telt de directe route mee via da (eerste tik op de productpagina) en schalen we niet.
export function landDeel(o, meet) { const v = num(o && o.view), d = num(o && o.dv); if (meet || v + d === 0) return 1; return v / (v + d); }
export const doorkliks = (o, meet) => num(o && o.klik) + (meet ? num(o && o.da) : 0);

// TikTok (16 nov 2026, Henkjan: "Ik wil vandaag Tiktok advertentie starten . Help me daar door heen ."): conversies gaan via de Events API van
// TikTok (server naar server, geen pixel op kadoly.com nodig), gekoppeld aan de ttclid die TikTok achter de link zet. Pixel-code en token staan
// als gedeelde team-variabelen TIKTOK_PIXEL en TIKTOK_TOKEN in Vercel; zonder die twee wordt er niets gestuurd. Eenmaal per klik per soort (event_id).
// ViewContent = echt mens, AddToCart = doel 1 (zelfde regel als PropellerAds: tik op de koopknop na 10 s of bewust afrekenen), InitiateCheckout = afrekenpagina, CompletePayment = betaald met bedrag.
export async function ttEvent(rec, event, waarde, testCode) {
  const px = process.env.TIKTOK_PIXEL_NL || 'DBTIK0JC77U65UHP9VSG', tok = process.env.TIKTOK_TOKEN || process.env.TIKTOK_EVENTS_TOKEN; // pixel Kadoly in advertentieaccount Kadoly NL (16 nov). De oude variabele TIKTOK_PIXEL wijst nog naar de pixel van het US-account (DBTHR6RC77UEEP3E5ODG) en wordt daarom niet meer gelezen; de pixelcode is openbaar (openbare code, 16 nov)
  if (!px || !tok || !rec || !rec.c) return 0; if (/^ttx/.test(String(rec.c))) return 'zonder-ttclid'; // eigen klik-id zonder TikTok-klik: niets om aan te koppelen
  const d = { event, event_time: Math.floor(Date.now() / 1000), event_id: event + '-' + createHash('sha1').update(String(rec.c)).digest('hex').slice(0, 20), user: { ttclid: String(rec.c) }, page: { url: rec.vk ? 'https://kadoly.com/' : 'https://kadoly.com/product/' + encodeURIComponent(rec.p || '') } };
  d.properties = { currency: 'EUR', content_type: 'product', ...(rec.p && !rec.vk ? { contents: [{ content_id: String(rec.p), quantity: 1 }] } : {}), ...(Number(waarde) > 0 ? { value: Math.round(Number(waarde) * 100) / 100 } : {}) };
  let st = 0; try { const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 3000); const r = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', { method: 'POST', signal: ctl.signal, headers: { 'Access-Token': tok, 'content-type': 'application/json' }, body: JSON.stringify({ event_source: 'web', event_source_id: px, ...(testCode ? { test_event_code: String(testCode).slice(0, 40) } : {}), data: [d] }) }); clearTimeout(tm); st = r.status; try { const j = await r.json(); if (j && j.code !== 0) st = 'fout' + j.code; } catch (e) {} } catch (e) { st = 'weg'; }
  return st;
}
async function stuur(url) { let st = 0; try { const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 2500); const r = await fetch(url, { signal: ctl.signal }); clearTimeout(tm); st = r.status; } catch (e) {} return st; }

// Warm publiek (Henkjan 4 nov 2026: "Bedenk een strategie om abondoned carts de of warmste publiek nog een keer te bereiken en te vinden"):
// per Clickmind-persoon (cookie mmp op de Clickmind-link, rec.mp) het product waarmee hij het verst kwam: bekeken (echt mens), winkelmand,
// afrekenpagina of betaling gestart; weg na een koop; 30 dagen. Een link met rt=1 (de remarketingcampagnes) stuurt zo iemand meteen naar
// dat product (api/shop.js land); zonder spoor gaat hij naar p uit de link. Een verdere stap overschrijft, bekeken nooit een mandje.
const WARM_RANG = { bekeken: 0, cart: 1, afreken: 2, betaal: 3 };
export async function warmZet(kv, mp, p, w) { try { if (!/^[0-9a-f]{16}$/.test(String(mp || '')) || !p) return; const k = 'hjdk:warm:' + mp; if (w === 'koop') { await kv.del([k]); return; } if (WARM_RANG[w] === undefined) return; const oud = await kv.get(k); if (oud && WARM_RANG[oud.stap] > WARM_RANG[w]) return; if (oud && oud.p === p && oud.stap === w) return; await kv.set(k, { p, stap: w, at: Date.now() }, { ex: 30 * 86400 }); } catch (e) {} }

// Uitkomst van cm.js op yoo.rs voor een shopbezoeker (aangeroepen vanuit lib/wissel.js uitkomst, eenmaal per klik en soort).
const KASSALOG = new Set(['wklik', 'kpag', 'kt20', 'kt60', 'kmail', 'kadres', 'kmeth', 'kknop', 'kpay', 'kpp', 'kfout', 'kweg', 'kprijs', 'kfee', 'kt5', 'kscroll', 'kterug', 'kweg5', 'kweg20', 'kweglang', 'bsopen', 'bsmail', 'bsadres', 'bsgoogle', 'bsverder', 'bsvast', 'bsdicht', 'bsweg', 'wkwag']); // 3 nov: per bezoeker wat er op weg naar en op de afrekenpagina gebeurt
// Bewust afrekenen (5 nov 2026, panel van 13 experts op Henkjans "neem een heel groot panel aan experts"): 79% van wie op de afrekenpagina kwam,
// stond er binnen 15 s na de advertentieklik en 2 op de 3 waren binnen 5 s weg: tikken op de vaste koopbalk, geen koopwens. Daarvoor kregen
// PropellerAds (doel 2 en de terugval-hoofdconversie) en MGID (stap decision) een conversie, dus leerden ze snelle tikkers in te kopen.
// Nu pas bij bewust afrekenen: 20 s op de afrekenpagina, een veld ingevuld, een betaalmethode gekozen of op betalen gedrukt.
export const PA_TIK_MIN = 10000; // ms tussen aankomst en tik op de koopknop voordat die tik bij PropellerAds als doel 1 telt (14 nov)
const BEWUST = ['kt20', 'kmail', 'kadres', 'kmeth', 'kknop', 'kpay', 'kpp', 'bsmail', 'bsadres', 'bsgoogle', 'bsverder']; // 14 nov: e-mail, adres, Google of Verder in het koopblad op mobiel is ook bewust afrekenen
export const isBewust = rec => !!rec && (BEWUST.some(k => rec['y' + GEDRAG[k]]) || !!(rec.px && rec.px.betaal));
// stuurt hoogstens één keer per klik de kassadoelen naar het netwerk, alleen als de klik in de kassa kwam en bewust is
export async function kassaDoel(kv, rec) {
  if (!rec || rec.t || !rec.c || !rec.px || !(rec.px.cart || rec.px.afreken || rec.px.betaal) || !isBewust(rec)) return false;
  const net = rec.s, tel = []; let gedaan = false;
  if (net === 'mg' && !rec.px.mg2) { rec.px.mg2 = Date.now(); tel.push('sh-mg-pb2-' + await stuur(mgUrl(rec.c, mgEvent(MG_STAP.kassa, rec.k))), 'sh-d' + D8() + '-mg-pb2'); gedaan = true; }
  // 14 nov: bij PropellerAds is doel 2 nu echt mens (shopUitkomst); bewust afrekenen telt daar als doel 1 (de regel hieronder), niet meer als doel 2.
  if (rec.arm === 'd' && (net === 'pa' || net === 'md') && !rec.conv && PB[net]) { rec.conv = Date.now(); rec.pb = await stuur(PB[net].replace('{clickid}', encodeURIComponent(rec.c)) + (net === 'md' ? '&payout=0' : '')); tel.push('sh-' + net + '-conv', 'sh-d' + D8() + '-' + net + '-conv', 'sh-' + net + '-pbd' + rec.pb); if (rec.z) tel.push('sh-' + net + '-z' + rec.z + '-conv'); gedaan = true; }
  if (gedaan) { tel.push('sh-' + net + '-bewust', 'sh-d' + D8() + '-' + net + '-bewust'); try { await kv.incrMany(tel.map(k => ['c:' + k, 1])); } catch (e) {} }
  return gedaan;
}
export async function shopUitkomst(kv, code, soort, waarde) {
  const LETTER = { echt: 'm', actie: 'a', geladen: 'g', zicht1: 'z', ...GEDRAG }; // g = pagina geladen (cm.js draait), z = 1 seconde in beeld (20 okt)
  code = String(code || '').replace(/[^a-z0-9]/gi, '').slice(0, 14); if (!code || !LETTER[soort]) return { ok: false };
  const key = 'hjdk:shc:' + code; const rec = await kv.get(key); if (!rec) return { ok: false, fout: 'onbekend kenmerk' };
  const veld = 'y' + LETTER[soort]; if (rec[veld]) return { ok: true, dubbel: true };
  rec[veld] = Date.now(); const net = rec.s || 'x', direct = rec.arm === 'd', s = (direct ? 'd' : 'l') + LETTER[soort];
  if (BEWUST.includes(soort) && !rec.t) { try { await kassaDoel(kv, rec); } catch (e) {} if (rec.mp && rec.px && (rec.px.cart || rec.px.afreken)) await warmZet(kv, rec.mp, rec.p, rec.px.betaal ? 'betaal' : 'afreken'); } // 5 nov: kassadoelen en warm publiek pas bij bewust afrekenen
  if (KASSALOG.has(soort) && !rec.t) { try { await kv.raw(['LPUSH', 'hjdk:shop:kassalog', JSON.stringify({ c: code, s: net, p: rec.p || '', z: rec.z || '', at: rec.at || 0, soort, t: rec[veld], w: Number(waarde) || 0 })]); await kv.raw(['LTRIM', 'hjdk:shop:kassalog', '0', '2999']); await kv.raw(['EXPIRE', 'hjdk:shop:kassalog', String(14 * 86400)]); } catch (e) {} }
  const keys = ['sh-' + net + '-' + s, 'sh-d' + D8() + '-' + net + '-' + s];
  if (rec.z) keys.push('sh-' + net + '-z' + rec.z + '-' + s); if (rec.a) keys.push('sh-' + net + '-a' + rec.a + '-' + s); if (rec.k) keys.push('sh-' + net + '-k' + rec.k + '-' + s); if (rec.p) keys.push('sh-p-' + pk(rec.p) + '-' + s);
  let pb = null;
  // Hoofddoel voor het netwerk (PropellerAds doel 1). Henkjan 23 okt 2026 ("Ja doe dit nu al"): PropellerAds krijgt de vroege
  // conversie 'echt' (echt mens, ~5% van de klikkers) in plaats van 'actie' (eerste tik, ~0,8%), zodat het op CPA genoeg leert en
  // inkoopt. Mondiad en RichAds houden 'actie'. Winkelwagen (doel 2) en betaald (doel 3) blijven apart in api/shop.js.
  // 12 nov (Henkjan: "Het netwerk leert tikkers inkopen ... Los op in je campagnes morgen"): PropellerAds krijgt doel 1 pas als iemand de
  // productpagina half doorleest (s50: titel, prijs en opties gezien), niet meer bij de eerste aanraking. Zo leert het netwerk lezers inkopen.
  // 12 nov 11:25 UTC terug naar 'echt' (Henkjan: "Optimaliseeer weer voor clickmind en succes", koos "Echt mens, bod 0,02"): s50 gaf
  // ~1% van de kliks, te weinig om op te leren; echt mens ~5%, met het bod naar 0,02 zelfde kosten per bezoeker. Mandje en betaald blijven doel 2 en 3.
  // 14 nov 12:40 UTC (Henkjan: "Maak ervan in winkelmandje de CPA ... Maar ga niet alle campagnes allemaal nu weer opnieuw modereren"):
  // PropellerAds doel 1 = tik op de winkelwagenknop (wklik), of bewust afrekenen via kassaDoel als iemand zonder die tik in de kassa komt.
  // Echt mens gaat sindsdien als doel 2 naar PropellerAds; de stopregel en de botwacht van propellerads-mcp tellen voor SHOP-LUS doel 1 + doel 2
  // als echte mensen. Alleen de melding verandert, niet de campagnes: geen nieuwe moderatie.
  const doelSoort = net === 'pa' || net === 'tt' || net === 'wh' ? 'wklik' : net === 'mg' ? 'echt' : 'actie'; // MGID: echt mens = stap interest
  // 14 nov 23:45 UTC (Henkjan op "Zal ik doel 1 alleen laten tellen bij een tik na 10 seconden, of als iemand in het blad zijn e-mail invult?": "Ja of zelfs nog langer ."):
  // 13+14 nov tikten 35 van 50 binnen 9 s na aankomst op de koopknop en haalde 11% de afrekenpagina; na 10 s of later 40% (10-14 s 3 van 6,
  // 15 s en later 3 van 10: langer is niet beter en halveert het signaal). PropellerAds doel 1 = tik op de koopknop na PA_TIK_MIN, of bewust
  // afrekenen (e-mail, adres, Google of Verder in het koopblad; een veld, betaalmethode of betalen op de afrekenpagina).
  const paSnel = (net === 'pa' || net === 'tt' || net === 'wh') && soort === 'wklik' && Number(rec.at) > 0 && rec[veld] - Number(rec.at) < PA_TIK_MIN;
  if (paSnel && direct) keys.push('sh-' + net + '-wksnel', 'sh-d' + D8() + '-' + net + '-wksnel');
  if (net === 'tt' && direct && rec.c && !rec.t) { // TikTok: doel 1 = AddToCart, plus echt mens en afrekenpagina als losse gebeurtenissen
    const tev = soort === 'echt' && !rec.pe ? 'ViewContent' : soort === 'kpag' && !rec.ti ? 'InitiateCheckout' : ((soort === 'wklik' && !paSnel) || BEWUST.includes(soort)) && !rec.conv ? 'AddToCart' : '';
    if (tev) { const st = await ttEvent(rec, tev); if (tev === 'ViewContent') rec.pe = Date.now(); else if (tev === 'InitiateCheckout') rec.ti = Date.now(); else { rec.conv = Date.now(); rec.pb = st; keys.push('sh-tt-conv', 'sh-d' + D8() + '-tt-conv'); if (rec.z) keys.push('sh-tt-z' + rec.z + '-conv'); } keys.push('sh-tt-ev-' + tev + '-' + st); }
  }
  if (net === 'wh' && direct && rec.c && !rec.t) { // Whop (Meta): zelfde stappen als TikTok, via de Events API van Whop (lib/whop.js)
    const wev = soort === 'echt' && !rec.pe ? 'view_content' : soort === 'kpag' && !rec.ti ? 'initiate_checkout' : ((soort === 'wklik' && !paSnel) || BEWUST.includes(soort)) && !rec.conv ? 'add_to_cart' : '';
    if (wev) { const st = await whEvent(rec, wev); if (wev === 'view_content') rec.pe = Date.now(); else if (wev === 'initiate_checkout') rec.ti = Date.now(); else { rec.conv = Date.now(); rec.pb = st; keys.push('sh-wh-conv', 'sh-d' + D8() + '-wh-conv'); if (rec.z) keys.push('sh-wh-z' + rec.z + '-conv'); } keys.push('sh-wh-ev-' + wev + '-' + st); }
  }
  if (direct && ((soort === doelSoort && !paSnel) || (net === 'pa' && BEWUST.includes(soort))) && rec.c && !rec.t && !rec.conv && PB[net] && net !== 'ca') {
    pb = await stuur(net === 'mg' ? mgUrl(rec.c, mgEvent(MG_STAP.echt, rec.k)) : PB[net].replace('{clickid}', encodeURIComponent(rec.c))); rec.conv = Date.now(); rec.pb = pb;
    keys.push('sh-' + net + '-conv', 'sh-d' + D8() + '-' + net + '-conv', 'sh-' + net + '-pb' + (pb || 0)); if (rec.z) keys.push('sh-' + net + '-z' + rec.z + '-conv');
  }
  if (net === 'pa' && direct && soort === 'echt' && rec.c && !rec.t && !rec.pe && PB.pa) {
    const st = await stuur(PB.pa.replace('{clickid}', encodeURIComponent(rec.c)) + '&goal=2'); rec.pe = Date.now();
    keys.push('sh-pa-echt2', 'sh-d' + D8() + '-pa-echt2', 'sh-pa-pbe' + (st || 0));
  }
  if (!rec.t) { try { await kv.incrMany(keys.map(k => ['c:' + k, 1])); } catch (e) {} await uurTel(kv, net, s); } // rec.t = testklik (klik-id begint met test): telt niet mee
  await kv.set(key, rec, { ex: 30 * 86400 });
  if (soort === 'echt') { try { await kv.set(rec.t ? K_MEET + ':test' : K_MEET, Date.now(), { ex: 2 * 86400 }); } catch (e) {} }
  if (soort === 'echt' && rec.mp && !rec.t) await warmZet(kv, rec.mp, rec.p, 'bekeken');
  return { ok: true, arm: direct ? 'd' : 'l', soort, gemeld: pb };
}
