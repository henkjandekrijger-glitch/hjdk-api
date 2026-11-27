// Paspoort en geheugen van Clickmind: één register voor alles wat de deur uit gaat (Henkjan 27 nov 2026: "Clikmind moet altijd medium
// meenemen waarop en waarvoor en welk doel er gepost wordt en van ieder vorige bericht of alle vorige berichten leren", "Moet ook alle
// ad copy en creatives meenemen !!!!!  Dus content en creatives ." en "Ook altijd vast bestaande research inladen zonder dat we daar
// ons vooleidig door laten leiden maar kan data voorsprong geven").
//
// STUK = één ding dat de deur uit gaat: een advertentie (tekst en beeld), een post of reactie, een video, een mail, een pin, een paginakop.
// PASPOORT = wat elk stuk verplicht bij zich heeft: medium (waarop), voor (waarvoor: project, pagina, publiek) en doel (welk getal moet
//   bewegen). Geeft de maker geen doel op, dan krijgt het stuk het doel van zijn project en staat er 'afgeleid' bij; de pagina telt die.
// GEHEUGEN = alle stukken in één register, ingeladen uit de motoren die al bestaan: het campagne-archief (lib/cmcamp.js, elke creative),
//   Clickmind distributie (lib/distlus.js, elke post), Videomind (lib/videomind.js, elke video) en de POST-lus (lib/postlus.js, elke mail).
//   Een chat of een ander project meldt een stuk zelf met op=stuk. De ronde draait mee met bestaande crons (geen eigen cron).
// OORDEEL = elk stuk met genoeg cijfers krijgt raak, mis of gemiddeld tegen wat je binnen zijn eigen campagne (advertentie) of binnen zijn
//   project en medium (post, video, mail) mocht verwachten; dezelfde tekst in kopieën van een campagne telt als één familie.
// LESSEN = per kenmerk (haak, emotie, opening, lengte, knoptekst, soort) wat aantoonbaar beter of slechter werkt dan het gemiddelde.
// BRIEFING = wat een chat of ronde leest vóór hij iets maakt (op=briefing&medium=&project=&doel=): vaste regels, wat hier werkte en niet,
//   wat elders werkt en hier nog niet is geprobeerd (kruisbestuiving), startkennis uit bestaande research en de vraag van buiten.
// RESEARCH = startkennis (data/stuk-priors.json, data/post-priors.json, data/zicht-priors.json, Videomind-lessen, lib/buiten.js). Research
//   geeft een voorsprong maar beslist niet: zodra eigen cijfers een les bevestigen of tegenspreken staat dat erbij en gaat eigen data voor.
//
// NATIVE EN TREND (Henkjan 27 nov 2026: "Maak inderdaad voor ieder platform alles native EN check er altijd bij wat op dat moment goed werkt
//   en maak daar altijd een alternatief mee . Dus trending of mega op dat plaform die kennis gebruik je ."): elk stuk is voor zijn platform
//   gemaakt en krijgt een tweeling: variant 'native' en variant 'trend' (gebouwd op wat nu groot is op dat platform, lib/trend.js), aan elkaar
//   gekoppeld met paar. Het geheugen leert welke van de twee wint (kenmerk 'native of trend').
// SNELLER UIT: een advertentie die binnen zijn eigen campagne hard 'mis' is gaat op de uit-lijst van de vroege voorspeller (uitAds, /api/mm/vroeguit).
//
// Opslag (Redis): ps:s:<id> stuk (240 dagen), ps:ix (zset id op tijd), ps:campdoel (hash net:campagne -> doel), ps:stand (laatste ronde),
// ps:streng (lijst bronnen waar een stuk zonder eigen doel geweigerd wordt), ps:gezien (hash id -> dag waarop het stuk voor het laatst in zijn
// bron stond), ps:uit:<dag> (advertenties die vanuit het geheugen op de uit-lijst kwamen). Geen adressen van ontvangers en geen beelddata in een stuk.
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { kv } from './db.js';

const HOST = 'https://hjdk-api-henq.vercel.app';
const S = 'ps:s:', IX = 'ps:ix', STAND = 'ps:stand', CAMPDOEL = 'ps:campdoel', STRENG = 'ps:streng', GEZIEN = 'ps:gezien', TTL = 240 * 86400, DAG = 864e5;
export const REGEL_SINDS = '2026-11-28';
export const TREND_MEDIA = ['x', 'instagram', 'tiktok', 'youtube', 'pinterest', 'facebook', 'linkedin', 'threads', 'bluesky', 'reddit']; // platforms met een eigen trend; een forum, Tripadvisor of Telegram heeft die niet // vanaf deze dag hoort bij elk onbetaald stuk een trend-alternatief
export const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const kort = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
const r1 = x => Math.round(N(x) * 10) / 10, r2 = x => Math.round(N(x) * 100) / 100;
const dagUtc = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const nlGetal = n => String(Math.round(N(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.'), nl = nlGetal;
const paren = h => { if (!h) return []; if (Array.isArray(h)) { const o = []; for (let i = 0; i + 1 < h.length; i += 2) o.push([String(h[i]), h[i + 1]]); return o; } return Object.entries(h); };

// ---------- paspoort: medium, waarvoor, doel ----------
export const MEDIA = {
  propeller: { naam: 'PropellerAds', betaald: true }, mondiad: { naam: 'Mondiad', betaald: true }, gads: { naam: 'Google Ads', betaald: true },
  'tiktok-ads': { naam: 'TikTok-advertenties', betaald: true }, meta: { naam: 'Meta-advertenties', betaald: true }, bing: { naam: 'Microsoft Ads', betaald: true },
  richads: { naam: 'RichAds', betaald: true }, mgid: { naam: 'MGID', betaald: true }, clickadu: { naam: 'Clickadu', betaald: true }, 'amazon-ads': { naam: 'Amazon Ads', betaald: true },
  x: { naam: 'X' }, instagram: { naam: 'Instagram' }, tiktok: { naam: 'TikTok' }, youtube: { naam: 'YouTube' }, pinterest: { naam: 'Pinterest' }, facebook: { naam: 'Facebook' },
  linkedin: { naam: 'LinkedIn' }, threads: { naam: 'Threads' }, bluesky: { naam: 'Bluesky' }, mastodon: { naam: 'Mastodon' }, reddit: { naam: 'Reddit' }, whatsapp: { naam: 'WhatsApp' }, telegram: { naam: 'Telegram' }, forum: { naam: 'Forum' },
  nieuwssite: { naam: 'Nieuwssite' }, quora: { naam: 'Quora' }, tripadvisor: { naam: 'Tripadvisor' }, google: { naam: 'Google (profiel of zoekresultaat)' },
  mail: { naam: 'Mail' }, site: { naam: 'Eigen pagina' }, anders: { naam: 'Anders' }
};
const MEDIUM_ALIAS = { propellerads: 'propeller', pa: 'propeller', md: 'mondiad', google_ads: 'gads', googleads: 'gads', tt: 'tiktok-ads', ttads: 'tiktok-ads', twitter: 'x', fb: 'facebook', ig: 'instagram', yt: 'youtube', email: 'mail', 'e-mail': 'mail', pagina: 'site', web: 'site', microsoft: 'bing', bi: 'bing' };
export const mediumId = m => { m = String(m || '').toLowerCase().trim().replace(/\s+/g, '-'); return MEDIA[m] ? m : MEDIUM_ALIAS[m] || ''; };
export const SOORTEN = ['advertentie', 'post', 'reactie', 'video', 'mail', 'pin', 'paginakop', 'modal', 'anders'];
// doel = welk getal het stuk moet bewegen; van diep (geld) naar ondiep (bereik)
export const DOELEN = { koop: 'verkoop', aanmelding: 'aanmelding (adres of lid)', store: 'tik naar App Store of Google Play', antwoord: 'antwoord op de mail', actie: 'actie op de pagina', echt: 'echte mens op de pagina', klik: 'klik naar de pagina', reactie: 'likes, reacties en delen', bereik: 'vertoningen of weergaven' };
export const DOEL_MV = { koop: 'verkopen', aanmelding: 'aanmeldingen', store: 'store-tikken', antwoord: 'antwoorden', actie: 'acties', echt: 'echte mensen', klik: 'kliks', reactie: 'reacties', bereik: 'vertoningen' };
const DOEL_ALIAS = { verkoop: 'koop', sale: 'koop', aankoop: 'koop', adres: 'aanmelding', signup: 'aanmelding', lid: 'aanmelding', lezer: 'aanmelding', install: 'store', app: 'store', reply: 'antwoord', mens: 'echt', kliks: 'klik', bezoek: 'klik', inzet: 'reactie', engagement: 'reactie', views: 'bereik', weergaven: 'bereik', vertoningen: 'bereik' };
export const variantId = v => { v = String(v || '').toLowerCase().trim(); return v === 'trend' || v === 'trending' || v === 'alternatief' ? 'trend' : v === 'native' ? 'native' : ''; };
export const doelId = d => { d = String(d || '').toLowerCase().trim(); return DOELEN[d] ? d : DOEL_ALIAS[d] || ''; };

// projecten: de id's van het dashboard; namen die andere systemen gebruiken wijzen naar één project
const PROJECT_ALIAS = { todayin: 'curacao', 'todayin-cw': 'curacao', taniakross: 'tk', 'tk-podcast': 'tk', keuzehulp: 'keuzehulpen', whichtobuy: 'keuzehulpen', kaufberater: 'keuzehulpen', nexyplatform: 'nexy', bookstuffers: 'content', stockingbooks: 'content', lastingchange: 'content', lc: 'content', yoors: 'kadoly', shop: 'kadoly', surgery: 'chirurgie', tsc: 'chirurgie', sealedintent: 'sealed', 'you-and-ai': 'youandai', yai: 'youandai', wmn: 'wam', curbedrijf: 'curacao', kz: 'keuzehulpen', wtb: 'keuzehulpen', bs: 'content' };
const PROJECT_VOOR = ['tk', 'wam', 'kadoly', 'nexy', 'curacao', 'kdp', 'mylevel', 'sealed', 'keuzehulpen', 'chirurgie'];
export const projectId = p => { p = String(p || '').toLowerCase().trim().replace(/[^a-z0-9-]/g, ''); if (PROJECT_ALIAS[p]) return PROJECT_ALIAS[p]; const v = p.split('-')[0]; return p.includes('-') && (PROJECT_VOOR.includes(v) || PROJECT_ALIAS[v]) ? (PROJECT_ALIAS[v] || v) : p; };
// doel van het project als de maker er geen opgeeft (uit de doelen op het dashboard, 27 nov 2026)
const PROJECT_DOEL = { kadoly: 'koop', curacao: 'aanmelding', wam: 'aanmelding', nexy: 'store', mylevel: 'koop', keuzehulpen: 'actie', tk: 'aanmelding', kdp: 'koop', content: 'klik', sealed: 'aanmelding', chirurgie: 'aanmelding', youandai: 'aanmelding', bzz: 'aanmelding' };
// de naam van een campagne zegt vaak zelf waar hij op stuurt
export function doelUitNaam(naam) {
  const s = String(naam || '');
  if (/CPA\s*=\s*(adres|aanmeld|lid|e-?mail)|winactie|KADOLYWIN|\bADRES\b|\bLEZER\b/i.test(s)) return 'aanmelding';
  if (/CPA\s*=\s*(echt|mens)/i.test(s)) return 'echt';
  if (/CPA\s*=\s*(koop|verkoop|sale)|\bPAKKET\b|\bSHOP-LUS\b/i.test(s)) return 'koop';
  if (/\bCHAT\b/i.test(s)) return 'actie';
  if (/store|install/i.test(s)) return 'store';
  return '';
}
export function standaardDoel(project, medium, naam) {
  return doelUitNaam(naam) || (medium === 'mail' ? 'antwoord' : '') || PROJECT_DOEL[project] || ((MEDIA[medium] || {}).betaald ? 'echt' : 'klik');
}

// vorm van de tekst zelf: gratis, zonder AI, bij elk stuk (zelfde gedachte als kenmerken() in lib/distlus.js, met woorden in plaats van tekens
// zodat een advertentiekop en een post in dezelfde bakjes vallen)
export function vorm(t) {
  t = String(t || '').trim(); if (!t) return null;
  const woorden = t.split(/\s+/).length, eerste = (t.split(/(?<=[.?!])\s|\n| \/ /)[0] || '').trim(), w = eerste.split(/\s+/)[0].toLowerCase().replace(/[^a-zà-ÿ']/g, '');
  return {
    lengte: woorden <= 6 ? 'tot 6 woorden' : woorden <= 14 ? '7 tot 14 woorden' : woorden <= 40 ? '15 tot 40 woorden' : 'meer dan 40 woorden',
    vraag: /[?¿]/.test(t) ? 'ja' : 'nee',
    getal: /\d/.test(t) ? 'ja' : 'nee',
    spreker: /^(i|my|i'm|ik|mijn|yo|mi|ich|mein)$/.test(w) ? 'ik' : /^(we|our|wij|we're|onze|ons|wir|unser)$/.test(w) ? 'wij' : /^(you|your|jij|je|jouw|u|tu|tú|du|dein)$/.test(w) ? 'jij' : 'anders',
    opening: /[?]$/.test(eerste) || /^¿/.test(eerste) ? 'vraag' : /\d/.test(eerste) ? 'getal' : eerste.split(/\s+/).length <= 5 ? 'korte zin' : 'zin',
    prijs: /(€|\$|£)\s?\d|\d+[.,]\d{2}\b|\b\d+\s?(euro|dollar)\b/i.test(t) ? 'ja' : 'nee',
    emoji: /\p{Extended_Pictographic}/u.test(t) ? 'ja' : 'nee'
  };
}
// vaste regels die een machine kan nakijken (data/stuk-priors.json): prijs of levertijd in een advertentie
export function regelCheck(st) {
  const uit = [], t = [st.inhoud.titel, st.inhoud.tekst].filter(Boolean).join(' ');
  if (st.betaald && t) {
    if ((vorm(t) || {}).prijs === 'ja') uit.push('prijs in de advertentie');
    if (/\b(morgen|vandaag) (in huis|bezorgd|geleverd)|levertijd|binnen \d+ (werk)?dagen|next[- ]day delivery|delivered (by|in)\b/i.test(t)) uit.push('levertijd in de advertentie');
  }
  return uit;
}

const pagina = u => { try { const x = new URL(String(u || '').replace(/[${}]/g, '')); return (x.hostname.replace(/^www\./, '') + x.pathname).replace(/\/$/, '').slice(0, 120); } catch (e) { return kort(u, 120); } };

// Maak van invoer een stuk met volledig paspoort. Geeft { ok, stuk } of { ok:false, fout, mist }.
// b: { id | (bron, bronId), medium, soort, plek, project, pagina | bestemming, publiek, doel ('aanmelding' of {soort,getal,op}), titel, tekst,
//      cta, beeld (https-url), haak, emotie, belofte, ouder, t, naam, wie, status, cijfers: {vert,kliks,kosten,doel,echt,actie,aanmelding,koop,store,inzet,antwoord,verstuurd,waarde} }
export function schoon(b = {}, oud = null, { streng = false } = {}) {
  const mist = [], o = oud || {};
  const medium = mediumId(b.medium) || o.medium || ''; if (!medium) mist.push('medium (waarop): ' + Object.keys(MEDIA).join(', '));
  const project = projectId(b.project || (b.voor && b.voor.project)) || (o.voor && o.voor.project) || ''; if (!project) mist.push('project (waarvoor), bijvoorbeeld kadoly, curacao, nexy, wam, mylevel, keuzehulpen, tk');
  const dIn = b.doel && typeof b.doel === 'object' ? b.doel : { soort: b.doel, getal: b.doelgetal, op: b.doelop };
  let doelSoort = doelId(dIn.soort), afgeleid = false;
  if (!doelSoort && o.doel && !o.doel.afgeleid) doelSoort = o.doel.soort; // een eerder opgegeven doel blijft staan
  if (!doelSoort) { if (streng) mist.push('doel (welk getal moet bewegen): ' + Object.keys(DOELEN).join(', ')); else { doelSoort = medium && project ? standaardDoel(project, medium, b.naam || o.naam) : ''; afgeleid = true; } }
  if (mist.length) return { ok: false, fout: 'paspoort onvolledig: ' + mist.join('; '), mist };
  const bron = kort(b.bron || o.bron || 'hand', 12).toLowerCase().replace(/[^a-z]/g, '') || 'hand';
  const id = kort(b.id || o.id || (b.bronId ? bron + ':' + b.bronId : ''), 90).replace(/[^A-Za-z0-9:._-]/g, '') || 'hand:' + randomBytes(5).toString('hex');
  const soort = SOORTEN.includes(String(b.soort || '').toLowerCase()) ? String(b.soort).toLowerCase() : o.soort || ((MEDIA[medium] || {}).betaald ? 'advertentie' : medium === 'mail' ? 'mail' : medium === 'site' ? 'paginakop' : 'post');
  const t0 = Date.parse(b.t || o.t || ''); const t = new Date(Number.isFinite(t0) ? t0 : Date.now()).toISOString();
  const titel = kort(b.titel != null ? b.titel : o.inhoud && o.inhoud.titel, 200), tekst = kort(b.tekst != null ? b.tekst : o.inhoud && o.inhoud.tekst, 700);
  const oi = o.inhoud || {};
  const st = {
    id, bron, t, dag: t.slice(0, 10), medium, betaald: !!(MEDIA[medium] || {}).betaald, soort, plek: kort(b.plek != null ? b.plek : o.plek, 80).toLowerCase(),
    voor: { project, pagina: pagina(b.pagina || b.bestemming || (o.voor && o.voor.pagina) || ''), publiek: kort(b.publiek != null ? b.publiek : o.voor && o.voor.publiek, 60).toLowerCase() },
    doel: { soort: doelSoort, getal: Number.isFinite(Number(dIn.getal)) && dIn.getal !== '' && dIn.getal != null ? Number(dIn.getal) : (o.doel && o.doel.getal != null && !afgeleid ? o.doel.getal : null), op: /^\d{4}-\d{2}-\d{2}$/.test(String(dIn.op || '')) ? dIn.op : (o.doel && o.doel.op) || '', afgeleid },
    inhoud: { titel, tekst, cta: kort(b.cta != null ? b.cta : oi.cta, 60), beeld: /^https:\/\//.test(String(b.beeld || '')) ? kort(b.beeld, 300) : oi.beeld || '',
      haak: kort(b.haak != null ? b.haak : oi.haak, 30).toLowerCase(), emotie: kort(b.emotie != null ? b.emotie : oi.emotie, 30).toLowerCase(), belofte: kort(b.belofte != null ? b.belofte : oi.belofte, 60), vorm: vorm([titel, tekst].filter(Boolean).join(' / ')) },
    ouder: kort(b.ouder != null ? b.ouder : o.ouder, 90), naam: kort(b.naam != null ? b.naam : o.naam, 140), status: kort(b.status || o.status || 'geplaatst', 12), wie: kort(b.wie || o.wie, 40),
    // native of trend: 'trend' = het alternatief op wat op dat moment groot is op het platform (trend = welke trend, paar = id van de tweeling)
    variant: variantId(b.variant) || o.variant || 'native', trend: kort(b.trend != null ? b.trend : o.trend, 120), paar: kort(b.paar != null ? b.paar : o.paar, 90).replace(/[^A-Za-z0-9:._-]/g, ''),
    laatst: /^\d{4}-\d{2}-\d{2}$/.test(String(b.laatst || '')) ? b.laatst : o.laatst || '', // laatste dag dat het stuk liep (advertentie, modal, paginaproef)
    cijfers: o.cijfers || null, eerst: o.eerst || new Date().toISOString()
  };
  if (b.cijfers && typeof b.cijfers === 'object') { const c = {}; for (const k of ['vert', 'kliks', 'kosten', 'doel', 'echt', 'actie', 'aanmelding', 'koop', 'store', 'inzet', 'antwoord', 'verstuurd', 'waarde']) if (b.cijfers[k] != null && Number.isFinite(Number(b.cijfers[k]))) c[k] = Math.max(0, k === 'kosten' || k === 'waarde' ? Math.round(Number(b.cijfers[k]) * 1000) / 1000 : r2(b.cijfers[k])); st.cijfers = Object.assign({}, c, { t: new Date().toISOString() }); }
  return { ok: true, stuk: st };
}

export const briefingUrl = st => HOST + '/api/mm?op=briefing&medium=' + st.medium + '&project=' + st.voor.project + '&doel=' + st.doel.soort;
async function strengVoor(bron) { const l = await kv.get(STRENG).catch(() => null); return bron === 'hand' || (Array.isArray(l) && l.includes(bron)); }
const zonderTijd = st => JSON.stringify(Object.assign({}, st, { cijfers: st.cijfers ? Object.assign({}, st.cijfers, { t: '' }) : null }));

// Zet één stuk (nieuw of bijwerken). Schrijft alleen als er iets veranderde.
export async function zet(b, { oud = undefined, streng = undefined } = {}) {
  if (!b || typeof b !== 'object') return { ok: false, fout: 'JSON met medium, project, doel en de tekst' };
  const idIn = kort(b.id || (b.bronId ? kort(b.bron || 'hand', 12) + ':' + b.bronId : ''), 90).replace(/[^A-Za-z0-9:._-]/g, '');
  if (oud === undefined) oud = idIn ? await kv.get(S + idIn).catch(() => null) : null;
  const bron = String(b.bron || (oud && oud.bron) || 'hand'); const r = schoon(b, oud, { streng: streng !== undefined ? (bron === 'hand' || streng.includes(bron)) : await strengVoor(bron) }); if (!r.ok) return r;
  const st = r.stuk; let nieuw = !oud;
  if (!oud || zonderTijd(oud) !== zonderTijd(st)) { await kv.set(S + st.id, st, { ex: TTL }); await kv.raw(['ZADD', IX, String(Math.max(Date.parse(st.t), st.laatst ? Date.parse(st.laatst + 'T12:00:00Z') : 0)), st.id]).catch(() => {}); } else nieuw = false;
  return { ok: true, id: st.id, nieuw, paspoort: { medium: st.medium, voor: st.voor, doel: st.doel }, let: st.doel.afgeleid ? 'geen doel opgegeven: doel van het project gebruikt (' + st.doel.soort + '). Geef het doel zelf mee met doel=<' + Object.keys(DOELEN).join('|') + '>' : undefined, regels: regelCheck(st), briefing: briefingUrl(st) };
}
export const lees = id => kv.get(S + kort(id, 90)).catch(() => null);
export async function alle({ dagen = 90 } = {}) {
  const ids = (await kv.raw(['ZRANGEBYSCORE', IX, String(Date.now() - dagen * DAG), '+inf']).catch(() => [])) || [], uit = [];
  for (let i = 0; i < ids.length; i += 200) uit.push(...(await kv.mget(...ids.slice(i, i + 200).map(x => S + x))).filter(Boolean));
  return uit;
}
// doel van een hele campagne vastzetten (de creatives erven het bij de volgende ronde): ?op=stuk&campagne=<net>:<id>&doel=aanmelding
export async function zetCampDoel(sleutel, doel) {
  const d = doelId(doel), [net, id] = String(sleutel || '').split(':'); if (!mediumId(net) || !id || !d) return { ok: false, fout: 'campagne=<netwerk>:<campagne-id>&doel=<' + Object.keys(DOELEN).join('|') + '>' };
  await kv.raw(['HSET', CAMPDOEL, mediumId(net) + ':' + kort(id, 30), d]); return { ok: true, campagne: mediumId(net) + ':' + id, doel: d };
}

// ---------- inladen uit de motoren die al bestaan ----------
const NET_MEDIUM = { propeller: 'propeller', gads: 'gads', mondiad: 'mondiad', tiktok: 'tiktok-ads', richads: 'richads', mgid: 'mgid', clickadu: 'clickadu', meta: 'meta', bing: 'bing' };
const formaatVan = (naam, f) => /in-?page/i.test(naam) || String(f) === '61' ? 'in-page push' : /onclick|popunder|\bpop\b/i.test(naam) ? 'onclick' : /interstitial/i.test(naam) ? 'interstitial' : /telegram/i.test(naam) ? 'telegram' : /\bpush\b/i.test(naam) ? 'push' : f != null && f !== '' ? 'formaat ' + f : '';

// advertenties: elke creative van elke campagne uit het campagne-archief (cm:camp:<dag>), cijfers opgeteld over de dagen
export function stukkenUitCampagnes(perDag, campDoel = {}) {
  const A = {}, campConv = {};
  for (const { dag, camps } of perDag) for (const c of camps || []) {
    const medium = NET_MEDIUM[c.net] || mediumId(c.net); if (!medium) continue;
    const crs = c.creatives || [], kl = crs.reduce((s, y) => s + N(y.kliks), 0) || 1, e = c.eigen || {}, i = c.instellingen || {};
    for (const cr of crs) {
      const tekst = [cr.titel, cr.tekst].filter(Boolean).join(' / '); if (!cr.id && tekst.length < 4) continue;
      const id = 'ad:' + medium + ':' + String(cr.id || c.id + '-' + tekst.slice(0, 24)).replace(/[^A-Za-z0-9._-]/g, '');
      const a = N(cr.kliks) / kl, x = A[id] || (A[id] = { b: null, camp: medium + ':' + c.id, conv: 0, c: { vert: 0, kliks: 0, kosten: 0, doel: null, echt: 0, actie: 0, aanmelding: 0, koop: 0, waarde: 0 }, eerste: dag });
      if (dag < x.eerste) x.eerste = dag;
      if ((N(cr.vert) || N(cr.kliks)) && dag > (x.actief || '')) x.actief = dag;
      x.c.vert += N(cr.vert); x.c.kliks += N(cr.kliks); x.c.kosten += N(cr.kosten); x.conv += N(cr.conv); campConv[x.camp] = N(campConv[x.camp]) + N(cr.conv);
      x.c.echt += N(e.echt) * a; x.c.actie += (N(e.actie) + N(e.dialoog)) * a; x.c.aanmelding += N(e.aanmelding) * a; x.c.koop += N(e.koop) * a; x.c.waarde += N(c.waarde) * a;
      const project = projectId(c.merk || c.project || 'overig') || 'overig', landen = (i.boden || []).flatMap(q => q.landen || []).slice(0, 6).join(',');
      const eigenDoel = campDoel[medium + ':' + c.id] || '';
      if (!x.b || dag >= x.laatst) { x.laatst = dag; x.b = { id, bron: 'ad', medium, soort: 'advertentie', plek: formaatVan(c.naam || '', i.formaat), project, pagina: i.landing || '', publiek: landen, doel: eigenDoel || undefined, naam: c.naam || '', titel: cr.titel || '', tekst: cr.tekst || '', cta: cr.cta || '', beeld: /^https:\/\//.test(String(cr.beeld || '')) ? cr.beeld : '', haak: cr.ai ? cr.ai.haak : undefined, emotie: cr.ai ? cr.ai.emotie : undefined, belofte: cr.ai ? cr.ai.belofte : undefined, ouder: 'camp:' + medium + ':' + c.id, status: 'geplaatst', t: (i.gestart || dag) + 'T12:00:00Z' }; }
    }
  }
  // het netwerk telt per creative hoe vaak het doel van de campagne gehaald is (conv); meldt de campagne dat nergens, dan blijft doel leeg en telt de eigen meting naar rato van de kliks
  return Object.values(A).map(x => Object.assign(x.b, { laatst: x.actief || undefined, t: (x.b.t < x.eerste ? x.b.t : x.eerste + 'T12:00:00Z'), cijfers: Object.assign(x.c, { doel: campConv[x.camp] > 0 ? x.conv : null }) }));
}
// posts en reacties uit Clickmind distributie (dist:r:<id>)
export function stukUitPost(r) {
  if (!r || !r.id) return null; const s = r.stats || {};
  const mk = mediumId(r.kanaal), mp = mediumId(String(r.plek || '').toLowerCase().split(/[\s@·-]/)[0]); /* kanalen die de postmotor nog als 'anders' meldt (bluesky, threads, mastodon, pinterest) staan in plek */
  return { id: 'post:' + r.id, bron: 'post', medium: mk && mk !== 'anders' ? mk : mp || 'anders', soort: /repl|reactie|antwoord/.test(String(r.soort || '')) ? 'reactie' : 'post', plek: [r.soort, r.plek].filter(Boolean).join(' · '), project: r.project, pagina: r.doel || '', publiek: [r.taal, r.ai && r.ai.doelgroep].filter(Boolean).join(' '), doel: r.doelsoort || undefined,
    naam: r.onderwerp || '', tekst: r.tekst || '', variant: r.variant || undefined, trend: r.trend || undefined, paar: r.paar ? 'post:' + r.paar : undefined, haak: (r.ai && r.ai.haak && r.ai.haak !== 'anders' ? r.ai.haak : '') || r.haak || undefined, emotie: r.ai ? r.ai.emotie : undefined, belofte: r.ai ? r.ai.belofte : undefined, status: r.status === 'geplaatst' ? 'geplaatst' : 'concept', wie: r.wie || '', t: r.geplaatstOp || r.t,
    cijfers: { vert: N(s.imp), kliks: N(r.kliks), inzet: N(s.likes) + N(s.reacties) + N(s.delen) + (r.uitkomsten || []).reduce((t, u) => t + (u.u === 'verwijderd' || u.u === 'niets' ? 0 : N(u.n)), 0), store: N(r.store) } };
}
// video's uit Videomind (v = register, sv = standVideo)
export function stukUitVideo(v, sv) {
  if (!v || !v.id) return null; sv = sv || {};
  return { id: 'video:' + v.id, bron: 'video', medium: mediumId(v.platform) || 'anders', soort: 'video', plek: v.vorm || 'short', project: v.project, pagina: v.link || v.pagina || '', publiek: v.taal || '', doel: v.doelsoort || undefined, naam: v.onderwerp || '', titel: v.titel || '', variant: v.variant || (v.trend ? 'trend' : undefined), trend: v.trend || undefined, paar: v.paar ? 'video:' + String(v.paar).replace(/^video:/, '') : undefined, haak: v.haak || undefined, status: v.at && Date.parse(v.at) <= Date.now() ? 'geplaatst' : 'gepland', t: v.at || v.sinds,
    cijfers: { vert: N(sv.weergaven), kliks: N(sv.bezoeken), echt: N(sv.mens), inzet: N(sv.likes) + N(sv.reacties), aanmelding: N(sv.aanmelding), koop: N(sv.koop) } };
}
// mails uit de POST-lus (post:mail:<id>): alleen onderwerpregel en uitkomst, nooit het adres; privémail blijft buiten het geheugen
export function stukUitMail(m) {
  if (!m || !m.id || m.prive || m.status !== 'verstuurd') return null;
  return { id: 'mail:' + m.id, bron: 'mail', medium: 'mail', soort: 'mail', plek: m.soort || '', project: m.project, publiek: m.taal || '', doel: 'antwoord', naam: kort(m.doel, 140), titel: m.onderwerp || '', status: 'geplaatst', wie: m.wie || '', t: m.verstuurd || m.t,
    cijfers: { verstuurd: 1, antwoord: ['antwoord', 'ja', 'nee'].includes(m.uitkomst) ? 1 : 0, kliks: m.uitkomst === 'klik' || N(m.kliks) > 0 ? 1 : 0 } };
}

// pins van de boeken (bs:pinlog, lib/bspin.js): kop en tekst uit de haak, cijfers van Pinterest (vertoningen, uitgaande kliks, saves)
export function stukUitBoekpin(x, haak, boek) {
  if (!x || !x.id || !haak || !boek) return null; const m = x.m || null;
  return { id: 'pin:bs-' + x.id, bron: 'pin', medium: 'pinterest', soort: 'pin', plek: 'bord ' + haak.bord, project: 'content', pagina: haak.doel(boek), publiek: 'us en', doel: 'klik', naam: haak.id, titel: haak.titel(boek), tekst: haak.tekst(boek),
    beeld: 'https://stockingbooks.com/pin/' + boek.a + '-' + haak.id + '.png', status: 'geplaatst', t: x.t, cijfers: m ? { vert: N(m.imp), kliks: N(m.klik), inzet: N(m.saves) } : undefined };
}
// pins van de keuzehulpen (hjdk:pin-direct:records, lib/pinterest-direct.js): titel, bord en bestemming; Pinterest-cijfers per pin worden daar niet bewaard
export function stukUitKzPin(id, r) {
  if (!r || r.status !== 'published' || !r.title) return null; const [markt, slug, v] = String(id).split(':');
  return { id: 'pin:kz-' + [markt, slug, v].join('.'), bron: 'pin', medium: 'pinterest', soort: 'pin', plek: 'bord ' + kort(r.board, 60), project: 'keuzehulpen', pagina: r.target || '', publiek: markt || '', doel: 'klik', naam: slug || '', titel: r.title, status: 'geplaatst', t: new Date(N(r.at) || Date.now()).toISOString() };
}
// teksten van de lerende modal (lib/modal.js): elke variant van elke arm die de laatste 14 dagen getoond is, met vertoningen, kliks en aanmeldingen
const MODAL_DOEL = { email: 'aanmelding', push: 'aanmelding', site: 'klik', gids: 'klik', chat: 'actie', knop: 'actie' };
export function stukkenUitModalData(modals, T) {
  const uit = [];
  for (const m of modals || []) for (const a of (m.alleArmenRuw || m.alleArmen || m.armen || [])) {
    if (!a || a.soort === 'geen') continue;
    const vs = [{ vid: 'v0', titel: a.titel, tekst: a.tekst, knop: a.knop }].concat(((m.varianten || {})[a.id] || []).filter(x => x && !x.uit));
    for (const v of vs) { const t = T[m.site + '|' + a.id + '~' + v.vid] || {}; if ((!v.titel && !v.tekst) || !N(t.toon)) continue;
      const doel = MODAL_DOEL[a.soort] || 'klik';
      uit.push({ id: 'modal:' + m.site + '.' + a.id + '.' + v.vid, bron: 'modal', medium: 'site', soort: 'modal', plek: 'modal ' + a.soort, project: projectId(m.site) || m.site, pagina: (m.domeinen || [])[0] ? 'https://' + m.domeinen[0] : '', publiek: m.taal || '', doel, naam: m.site + ' ' + a.id, titel: v.titel || '', tekst: v.tekst || '', cta: v.knop || '', ouder: 'modal:' + m.site + '.' + a.id, status: 'geplaatst', laatst: dagUtc(),
        cijfers: { vert: N(t.toon), kliks: N(t.klik), aanmelding: N(t.aanmelding), actie: N(t.klik), koop: N(t.koop) } }); }
  }
  return uit;
}
async function stukkenUitModals(dagen = 14) {
  const M = await import('./modal.js'), ms = await M.alleModals(kv), T = {}; if (!ms.length) return [];
  for (let i = 0; i < dagen; i++) for (const [f, v] of paren(await kv.raw(['HGETALL', 'mm:md:' + dagUtc(Date.now() - i * DAG)]).catch(() => null))) {
    const p = String(f).split('|'); if (p[2] !== '*' || !p[1] || !p[1].includes('~')) continue; const t = T[p[0] + '|' + p[1]] || (T[p[0] + '|' + p[1]] = {}); t[p[3]] = N(t[p[3]]) + N(v); }
  return stukkenUitModalData(ms, T);
}
// versies van de paginaproeven (lib/proef.js): elke versie van elk onderdeel dat getest wordt, met hoe vaak gezien en de diepste stap van de proef
export function stukkenUitProefStand(s) {
  const uit = []; if (!s || !s.ok) return uit;
  const W = s.waarde || {}, stappen = Object.keys(W).sort((a, b) => N(W[b]) - N(W[a])), top = stappen[0] || '', laag = stappen[stappen.length - 1] || '';
  const doel = /koop|betaal/.test(top) ? 'koop' : /aanmeld|optin|bevestig|lid|adres|meld/.test(top) ? 'aanmelding' : 'actie';
  for (const f of s.factoren || []) { if (f.uit) continue;
    for (const v of f.versies || []) { if (!v.naam || !N(v.gezien)) continue; const st = v.stappen || {};
      uit.push({ id: 'proef:' + s.site + '.' + f.id + '.' + v.id, bron: 'proef', medium: 'site', soort: 'paginakop', plek: 'proef ' + (f.pagina || ''), project: projectId(s.site) || s.site, doel, naam: kort(f.wat, 140), titel: v.naam, ouder: 'proef:' + s.site + '.' + f.id, status: 'geplaatst', laatst: v.uit ? undefined : dagUtc(),
        cijfers: { vert: N(v.gezien), [doel]: N(st[top]), kliks: laag && laag !== top ? N(st[laag]) : 0 } }); }
  }
  return uit;
}
async function stukkenUitProeven() {
  const PR = await import('./proef.js'), sites = new Set(Object.keys(PR.PROEVEN)), uit = [];
  for (const n of ((await kv.raw(['SMEMBERS', 'mm:modals']).catch(() => [])) || [])) sites.add(String(n));
  for (const site of sites) uit.push(...stukkenUitProefStand(await PR.proefStand(kv, site).catch(() => null)));
  const gezien = new Set(); return uit.filter(b => !gezien.has(b.id) && gezien.add(b.id));
}

// De ronde: alles inladen, oordelen, lessen en de stand bewaren. Loopt mee met bestaande crons; rem = hooguit één keer per zoveel uur.
export async function ronde({ dagen = 45, rem = 0 } = {}) {
  const vorig = await kv.get(STAND).catch(() => null);
  if (rem && vorig && Date.now() - Date.parse(vorig.t) < rem * 3600e3) return { ok: true, overgeslagen: 'laatste ronde ' + vorig.t };
  const bronnen = {}, lijst = [];
  const laad = async (naam, f) => { try { const l = (await f()).filter(Boolean); bronnen[naam] = { stukken: l.length }; lijst.push(...l); } catch (e) { bronnen[naam] = { stukken: 0, fout: String(e && e.message || e).slice(0, 140) }; } };
  await laad('advertenties', async () => {
    // alle dagen die in het campagne-archief staan (cm:campdagen, ook ingehaalde oude dagen), tot de bewaartijd van het archief (120 dagen),
    // zodat de cijfers van een advertentie over zijn hele looptijd tellen en niet alleen over de laatste weken
    const grens = dagUtc(Date.now() - 120 * DAG), set = ((await kv.raw(['SMEMBERS', 'cm:campdagen']).catch(() => [])) || []).map(String);
    const lijst = [...new Set([...set, ...Array.from({ length: dagen + 1 }, (_, i) => dagUtc(Date.now() - i * DAG))])].filter(x => /^\d{4}-\d{2}-\d{2}$/.test(x) && x >= grens).sort().reverse();
    const perDag = []; for (const d of lijst) { const c = await kv.get('cm:camp:' + d).catch(() => null); if (Array.isArray(c) && c.length) perDag.push({ dag: d, camps: c }); }
    const cd = Object.fromEntries(paren(await kv.raw(['HGETALL', CAMPDOEL]).catch(() => null)));
    return stukkenUitCampagnes(perDag, cd);
  });
  await laad('posts', async () => {
    const ids = (await kv.raw(['LRANGE', 'dist:lijst', '0', '2999']).catch(() => [])) || [], uit = [], grens = Date.now() - dagen * DAG;
    for (let i = 0; i < ids.length; i += 200) for (const r of await kv.mget(...ids.slice(i, i + 200).map(x => 'dist:r:' + x))) if (r && Date.parse(r.geplaatstOp || r.t) > grens) uit.push(stukUitPost(r));
    return uit;
  });
  await laad('videos', async () => { const VM = await import('./videomind.js'); const uit = []; for (const v of await VM.alleVideos()) uit.push(stukUitVideo(v, await VM.standVideo(v).catch(() => null))); return uit; });
  await laad('mails', async () => { const P = await import('./postlus.js'); return (await P.lijst(1500)).map(stukUitMail); });
  await laad('pins', async () => {
    const uit = [], B = await import('./bspin.js'), log = (await kv.get('bs:pinlog').catch(() => null)) || [];
    for (const x of Array.isArray(log) ? log : []) uit.push(stukUitBoekpin(x, B.haakVan(x.haak), B.vind(x.a)));
    for (const [id, r] of Object.entries((await kv.get('hjdk:pin-direct:records').catch(() => null)) || {})) uit.push(stukUitKzPin(id, r));
    return uit;
  });
  await laad('modals', () => stukkenUitModals());
  await laad('proeven', () => stukkenUitProeven());
  // schrijven: alleen wat veranderde
  let gezet = 0, nieuw = 0; const fouten = [], streng = (await kv.get(STRENG).catch(() => null)) || [];
  for (let i = 0; i < lijst.length; i += 200) {
    const deel = lijst.slice(i, i + 200), oud = await kv.mget(...deel.map(b => S + b.id)).catch(() => deel.map(() => null));
    for (let j = 0; j < deel.length; j++) { const r = await zet(deel[j], { oud: oud[j] || null, streng }).catch(e => ({ ok: false, fout: String(e.message || e) })); if (r.ok) { gezet++; if (r.nieuw) nieuw++; } else if (fouten.length < 8) fouten.push(deel[j].id + ': ' + String(r.fout).slice(0, 90)); }
  }
  // gezien: elk stuk dat vandaag in zijn bron stond; daarna opruimen wat daar 14 dagen niet meer staat
  const vandaag = dagUtc(), gz = []; for (const b of lijst) gz.push(b.id, vandaag);
  for (let i = 0; i < gz.length; i += 400) await kv.raw(['HSET', GEZIEN, ...gz.slice(i, i + 400)]).catch(() => {});
  const opgeruimd = await ruimOp({ dagen, bronnen }).catch(e => ({ weg: 0, fout: String(e.message || e).slice(0, 100) }));
  const st = await stand({ vers: true, bronnen, fouten });
  return { ok: true, t: st.t, ingeladen: gezet, nieuw, opgeruimd: opgeruimd.weg, bronnen, fouten, stukken: st.tel.stukken, raak: st.tel.raak, mis: st.tel.mis, zonderEigenDoel: st.tel.afgeleid, uitLijst: (st.uit || []).length };
}

// Opruimen: een stuk dat uit een bron komt, binnen het laadvenster van die bron valt en daar 14 dagen niet meer stond, bestaat daar niet meer
// (hernoemd, verwijderd of een proefstuk). Met de hand gemelde stukken blijven. Een bron die vandaag niet gelezen kon worden ruimt niets op.
const BRON_NAAM = { ad: 'advertenties', post: 'posts', video: 'videos', mail: 'mails', pin: 'pins' };
export async function ruimOp({ dagen = 45, bronnen = {}, nu = Date.now(), max = 200 } = {}) {
  const gz = Object.fromEntries(paren(await kv.raw(['HGETALL', GEZIEN]).catch(() => null))), weg = [];
  for (const st of await alle({ dagen: Math.max(7, dagen - 3) })) {
    const b = BRON_NAAM[st.bron]; if (!b || !bronnen[b] || bronnen[b].fout || !bronnen[b].stukken) continue;
    const g = Date.parse((gz[st.id] || String(st.eerst || st.t).slice(0, 10)) + 'T00:00:00Z');
    if (Number.isFinite(g) && nu - g > 14 * DAG && weg.length < max) weg.push(st.id);
  }
  for (const id of weg) { await kv.raw(['DEL', S + id]).catch(() => {}); await kv.raw(['ZREM', IX, id]).catch(() => {}); await kv.raw(['HDEL', GEZIEN, id]).catch(() => {}); }
  return { weg: weg.length, ids: weg.slice(0, 20) };
}

// ---------- oordeel en lessen ----------
// Eerlijk vergelijken (27 nov 2026, na de eerste echte ronde): campagnes en projecten verschillen te veel om hun stukken op één hoop te gooien.
// Daarom telt elk stuk tegen wat je mocht VERWACHTEN binnen zijn eigen stratum: een advertentie binnen zijn eigen campagne (zelfde landing,
// publiek, bod en conversiedoel), een post, video of mail binnen zijn project, medium en doel. Dezelfde tekst in meerdere kopieën van een
// campagne is één familie: de kopieën tellen op. Een les telt de families van alle campagnes op, elk tegen zijn eigen verwachting.
// meet = wat er per stuk te tellen is. Betaald: de conversies die het netwerk per advertentie telt op het doel waarop de campagne biedt
// (dat is niet altijd het doel van het paspoort, daarom heet het 'conversies' en nooit 'verkopen'). Onbetaald: het doel zelf per vertoning
// of per stuk; ondiep = kliks via de korte link, als voorlopig signaal zolang het doel zelf nog te weinig voorkomt.
export function meet(st, ondiep = false) {
  if (!st.cijfers) return null; // geen cijfers per stuk gemeld (pins van de keuzehulpen): niet meetellen als nul
  const c = st.cijfers, d = st.doel.soort;
  if (st.betaald) return c.doel == null || !N(c.kliks) ? null : { uit: N(c.doel), basis: N(c.kliks), soort: 'kliks', wat: 'conversies' };
  if (d === 'antwoord') return N(c.verstuurd) ? { uit: N(c.antwoord), basis: N(c.verstuurd), soort: 'verstuurd', wat: 'antwoorden' } : null;
  const veld = ondiep || d === 'klik' ? 'kliks' : d === 'reactie' ? 'inzet' : d === 'bereik' ? 'vert' : d, wat = ondiep || d === 'klik' ? 'kliks' : DOEL_MV[d];
  return N(c.vert) && veld !== 'vert' ? { uit: N(c[veld]), basis: N(c.vert), soort: 'vert', wat } : { uit: N(c[veld]), basis: 1, soort: 'stuk', wat };
}
const BASIS_NAAM = { kliks: 'kliks', vert: 'vertoningen', verstuurd: 'mails', stuk: 'stukken' };
const stratum = st => (st.bron === 'ad' || st.bron === 'modal' || st.bron === 'proef') && st.ouder ? st.ouder : st.voor.project + '|' + st.medium + '|' + st.doel.soort;
const norm = t => String(t || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const familie = st => st.bron + '|' + st.medium + '|' + st.voor.project + '|' + (norm([st.inhoud.titel, st.inhoud.tekst].filter(Boolean).join(' ')) || st.id);
// verwachting per stuk: basis x het gemiddelde van zijn stratum (minstens 3 stukken en 3 keer raak in het stratum, anders geen verwachting)
export function verwacht(stukken, ondiep = false) {
  const T = {}, M = new Map();
  for (const st of stukken) { if (st.status !== 'geplaatst') continue; const m = meet(st, ondiep); if (!m) continue; M.set(st.id, m); const k = stratum(st) + '|' + m.soort, t = T[k] || (T[k] = { uit: 0, basis: 0, n: 0 }); t.uit += m.uit; t.basis += m.basis; t.n++; }
  const V = new Map();
  for (const st of stukken) { const m = M.get(st.id); if (!m) continue; const t = T[stratum(st) + '|' + m.soort]; if (t.n < (st.bron === 'modal' || st.bron === 'proef' ? 2 : 3) || t.uit < 3 || !t.basis) continue; /* een arm van de modal of een onderdeel van een proef heeft vaak maar twee versies */ V.set(st.id, { O: m.uit, E: m.basis * t.uit / t.basis, basis: m.basis, soort: m.soort, wat: m.wat }); }
  return V;
}
// toets: aantallen tegen de verwachting (Poisson, z van 1,96: ongeveer 1 op de 40 is toeval per kant); onder 3 verwacht en 3 gehaald geen oordeel
const toets = (O, E) => { if (E < 3 && O < 3) return null; const z = (O - E) / Math.sqrt(Math.max(E, 0.5)); return z >= 1.96 && O >= 3 ? 'raak' : z <= -1.96 ? 'mis' : 'gemiddeld'; };
const kom = x => String(x).replace('.', ',');
const pct = (O, E) => E > 0 ? Math.round(100 * (O / E - 1)) : null;
const meerMinder = v => v == null ? '' : v >= 0 ? v + '% meer' : -v + '% minder';

// oordeel per stuk: de familie (zelfde tekst, medium en project) tegen haar verwachting
export function oordelen(stukken) {
  const V = verwacht(stukken, false), V2 = verwacht(stukken.filter(s => !s.betaald && s.doel.soort !== 'antwoord'), true), F = {};
  for (const st of stukken) { const k = familie(st), f = F[k] || (F[k] = { n: 0, O: 0, E: 0, basis: 0, O2: 0, E2: 0, basis2: 0, jong: false, v: null, v2: null }); f.n++; if (Date.now() - Date.parse(st.t) < 3 * DAG) f.jong = true;
    const v = V.get(st.id); if (v) { f.O += v.O; f.E += v.E; f.basis += v.basis; f.v = v; } const w = V2.get(st.id); if (w) { f.O2 += w.O; f.E2 += w.E; f.basis2 += w.basis; f.v2 = w; } }
  for (const f of Object.values(F)) {
    let u = f.v ? toets(f.O, f.E) : null, O = f.O, E = f.E, basis = f.basis, v = f.v, voorlopig = false;
    if (!u && f.v2) { const u2 = toets(f.O2, f.E2); if (u2) { u = u2; O = f.O2; E = f.E2; basis = f.basis2; v = f.v2; voorlopig = true; } }
    if (!u) { f.oordeel = { uitslag: !f.v && !f.v2 ? 'geen meting per stuk' : f.jong ? 'open' : 'te weinig cijfers', waarom: !f.v && !f.v2 ? 'geen cijfers per stuk om tegen af te zetten' : 'nog te weinig ' + (v || f.v2).wat + ' voor een oordeel' }; continue; }
    const ver = pct(O, E);
    f.oordeel = { uitslag: u, voorlopig, per: ver, waarom: Math.round(O) + ' ' + v.wat + ' tegen ' + kom(r1(E)) + ' verwacht' + (ver != null ? ' (' + meerMinder(ver) + ')' : '') + (f.n > 1 ? ', ' + f.n + ' keer ingezet' : '') + (v.soort === 'stuk' ? '' : ', ' + nlGetal(basis) + ' ' + BASIS_NAAM[v.soort]) + (voorlopig ? '; voorlopig op kliks, het doel zelf is nog te weinig gemeten' : '') };
  }
  for (const st of stukken) { const f = F[familie(st)]; st.oordeel = st.status !== 'geplaatst' ? { uitslag: 'niet geplaatst' } : Object.assign({ kopieen: f.n, fam: familie(st) }, f.oordeel); }
  return stukken;
}

// kenmerken waarop geleerd wordt
const KENMERKEN = [
  ['haak', st => st.inhoud.haak], ['emotie', st => st.inhoud.emotie], ['opening', st => st.inhoud.vorm && st.inhoud.vorm.opening], ['vraag in de tekst', st => st.inhoud.vorm && st.inhoud.vorm.vraag],
  ['getal in de tekst', st => st.inhoud.vorm && st.inhoud.vorm.getal], ['wie spreekt', st => st.inhoud.vorm && st.inhoud.vorm.spreker], ['lengte', st => st.inhoud.vorm && st.inhoud.vorm.lengte],
  ['prijs in de tekst', st => st.inhoud.vorm && st.inhoud.vorm.prijs], ['emoji', st => st.inhoud.vorm && st.inhoud.vorm.emoji], ['knoptekst', st => st.betaald ? (st.inhoud.cta ? 'met knoptekst' : 'zonder knoptekst') : ''],
  ['vorm of plek', st => st.betaald ? '' : st.plek], ['onderwerp', st => st.betaald ? '' : st.naam],
  ['native of trend', st => st.bron === 'modal' || st.bron === 'proef' || st.bron === 'mail' ? '' : st.variant === 'trend' ? 'trend-alternatief' : 'native']
];
// lessen voor een verzameling stukken: per kenmerk en waarde wat er uitkwam tegen wat je binnen de eigen campagne of het eigen project mocht verwachten
export function lessenVan(stukken, { ondiep = false } = {}) {
  const V = verwacht(stukken, ondiep), mee = stukken.filter(st => V.has(st.id)); if (!mee.length) return { basis: null, lessen: [], stukken: 0, ondiep };
  const uit = []; let wat = '';
  for (const [naam, f] of KENMERKEN) {
    const W = {}; for (const st of mee) { const w = String(f(st) || '').trim(); if (!w || w === '-' || w === 'anders') continue; const v = V.get(st.id), g = W[w] || (W[w] = { O: 0, E: 0, n: 0 }); g.O += v.O; g.E += v.E; g.n++; wat = v.wat; }
    if (Object.keys(W).length < 2) continue;
    for (const [w, g] of Object.entries(W)) { const u = g.n >= 3 ? toets(g.O, g.E) : null; uit.push({ kenmerk: naam, waarde: w, stukken: g.n, uit: Math.round(g.O), verwacht: r1(g.E), verschil: pct(g.O, g.E), wat, oordeel: u === 'raak' ? 'werkt' : u === 'mis' ? 'werkt niet' : 'onbeslist' }); }
  }
  uit.sort((a, b) => (a.oordeel === 'onbeslist') - (b.oordeel === 'onbeslist') || Math.abs(N(b.verschil)) - Math.abs(N(a.verschil)));
  const tO = mee.reduce((s, st) => s + V.get(st.id).O, 0);
  return { basis: { wat: wat || (V.get(mee[0].id) || {}).wat, uit: Math.round(tO), stukken: mee.length }, lessen: uit, stukken: mee.length, ondiep };
}
const lesZin = l => l.kenmerk + ' "' + l.waarde + '": ' + meerMinder(l.verschil) + ' ' + l.wat + ' dan verwacht (' + l.uit + ' tegen ' + kom(l.verwacht) + ', ' + l.stukken + ' stukken)';
// diep als het doel genoeg voorkomt, anders (onbetaald) het voorlopige signaal op kliks
export function lessenSlim(stukken) { const L = lessenVan(stukken); if ((L.basis && L.basis.uit >= 5) || !stukken.some(s => !s.betaald && s.doel.soort !== 'antwoord')) return L; const L2 = lessenVan(stukken, { ondiep: true }); return L2.stukken ? L2 : L; }

// ---------- sneller uit: advertenties die binnen hun eigen campagne hard mis zijn ----------
// Hard = de familie (zelfde tekst) is 'mis' op de conversies die het netwerk telt (nooit het voorlopige signaal op kliks), de advertentie zelf
// haalde hoogstens de helft van wat zijn campagne deed verwachten bij minstens 3 verwachte conversies en 100 kliks, en hij liep de laatste
// 3 dagen nog. De lijst gaat mee in /api/mm/vroeguit; de ronde van het netwerk houdt zijn eigen grenzen (nooit onder 4 actief, hoogstens 10 per uur).
export const UIT = { minE: 3, deel: 0.5, minKliks: 100, dagen: 3 };
const siteVan = pg => String(pg || '').split('/')[0].toLowerCase().replace(/^www\./, '').slice(0, 40) || '?';
export function uitKandidaten(stukken, { nu = Date.now() } = {}) {
  const V = verwacht(stukken, false), uit = [];
  for (const st of stukken) {
    if (st.bron !== 'ad' || !st.oordeel || st.oordeel.uitslag !== 'mis' || st.oordeel.voorlopig || st.status !== 'geplaatst') continue;
    const v = V.get(st.id); if (!v || v.E < UIT.minE || v.O > v.E * UIT.deel || N(st.cijfers && st.cijfers.kliks) < UIT.minKliks) continue;
    if (!st.laatst || nu - Date.parse(st.laatst + 'T00:00:00Z') > UIT.dagen * DAG) continue;
    const delen = st.id.split(':'), camp = String(st.ouder || '').split(':')[2] || '';
    if (!camp || !/^[A-Za-z0-9]+$/.test(delen[2] || '')) continue; // een advertentie zonder eigen id van het netwerk (afgeleid id met een streepje) kan de wacht niet stilzetten
    uit.push({ id: st.id, net: st.medium, project: st.voor.project, site: siteVan(st.voor.pagina), campagne: camp, advertentie: delen[2], bezoeken: Math.round(N(st.cijfers.kliks)), index: Math.round(100 * v.O / v.E), conversies: Math.round(v.O), verwacht: r1(v.E), tekst: stukTekst(st), naam: kort(st.naam, 70), laatst: st.laatst, bron: 'geheugen' });
  }
  return uit.sort((a, b) => a.index - b.index);
}
// voor de netwerkwachten: zelfde vorm als uitLijst in lib/vroeg.js (site, campagne, advertentie, bezoeken, index); leest de laatste ronde
export async function uitAds(net = 'propeller') {
  if (await kv.get('ps:uitstop').catch(() => null)) return []; // noodrem: ?op=stukken&uitstop=1 (beschermde host) houdt de uit-lijst van het geheugen leeg
  const s = await kv.get(STAND).catch(() => null), m = mediumId(net) || net;
  return ((s && s.uit) || []).filter(x => x.net === m && Date.now() - Date.parse(s.t) < 36 * 3600e3).map(x => ({ site: x.site, campagne: x.campagne, advertentie: x.advertentie, bezoeken: x.bezoeken, index: x.index, bron: 'geheugen' }));
}
// stukken opvragen met hun oordeel (voor een chat die nieuwe versies schrijft): ?op=stukken&lijst=1&project=&medium=&bron=&uitslag=&regel=1&n=
export async function lijst({ project = '', medium = '', bron = '', uitslag = '', regel = false, variant = '', n = 60, dagen = 90 } = {}) {
  const pj = projectId(project), md = mediumId(medium), gezien = new Set(), uit = [];
  for (const st of oordelen(await alle({ dagen })).sort((a, b) => N(b.cijfers && b.cijfers.kliks) - N(a.cijfers && a.cijfers.kliks))) {
    if ((pj && st.voor.project !== pj) || (md && st.medium !== md) || (bron && st.bron !== bron) || (uitslag && st.oordeel.uitslag !== uitslag) || (variant && st.variant !== variant)) continue;
    const rc = regelCheck(st); if (regel && !rc.length) continue;
    const fk = st.oordeel.fam || st.id; if (gezien.has(fk + '|' + st.ouder)) continue; gezien.add(fk + '|' + st.ouder);
    uit.push({ id: st.id, medium: st.medium, project: st.voor.project, doel: st.doel.soort, campagne: st.ouder, naam: st.naam, pagina: st.voor.pagina, publiek: st.voor.publiek, plek: st.plek, titel: st.inhoud.titel, tekst: st.inhoud.tekst, cta: st.inhoud.cta, beeld: st.inhoud.beeld, haak: st.inhoud.haak, variant: st.variant, paar: st.paar || undefined, laatst: st.laatst || undefined, dag: st.dag, regel: rc.length ? rc : undefined, cijfers: st.cijfers, oordeel: st.oordeel.uitslag, waarom: st.oordeel.waarom });
    if (uit.length >= Math.max(1, Math.min(300, N(n) || 60))) break;
  }
  return { ok: true, aantal: uit.length, stukken: uit };
}

// ---------- research: startkennis die een voorsprong geeft maar niet beslist ----------
function leesJson(naam) { for (const p of [process.cwd() + '/data/' + naam, new URL('../data/' + naam, import.meta.url).pathname]) { try { return JSON.parse(readFileSync(p, 'utf8')); } catch (e) {} } return []; }
export const priors = () => leesJson('stuk-priors.json');
const priorPast = (p, medium, doel) => { const m = MEDIA[medium] || {}, pm = p.media, pd = p.doelen;
  const mOk = pm === 'alle' || (pm === 'betaald' && m.betaald) || (pm === 'organisch' && !m.betaald && medium !== 'mail' && medium !== 'site') || (Array.isArray(pm) && pm.includes(medium));
  return mOk && (pd === 'alle' || !doel || (Array.isArray(pd) && pd.includes(doel))); };
// bestaande research voor dit medium en project: eigen startregels, de mailregels, ZICHT, Videomind-lessen en de vraag van buiten
export async function research({ medium, project, doel, lessen = [] }) {
  const vast = [], start = [];
  for (const p of priors()) {
    if (!priorPast(p, medium, doel)) continue;
    let stand = 'nog niet met eigen cijfers gemeten';
    if (p.kenmerk && p.waarde) { const l = lessen.find(x => x.kenmerk.startsWith(p.kenmerk) && x.waarde === p.waarde && x.oordeel !== 'onbeslist'); if (l) { const zegtMeer = p.richting === 'meer'; stand = (l.oordeel === 'werkt') === zegtMeer ? 'bevestigd door eigen cijfers: ' + lesZin(l) : 'tegengesproken door eigen cijfers (eigen data gaat voor): ' + lesZin(l); } }
    (p.vast ? vast : start).push({ id: p.id, les: p.les, bron: p.bron, sterkte: p.sterkte, stand: p.vast ? 'vaste regel' : stand });
  }
  if (medium === 'mail') for (const p of leesJson('post-priors.json').slice(0, 13)) (p.vast ? vast : start).push({ id: 'mail-' + p.id, les: p.les, bron: 'data/post-priors.json: ' + kort(p.bron, 120), sterkte: p.sterkte, stand: p.vast ? 'vaste regel' : 'startregel van de POST-lus; de actuele stand per regel staat op ' + HOST + '/api/post?op=regels&t=1' });
  if (medium === 'site' || medium === 'google') for (const p of leesJson('zicht-priors.json').filter(x => N(x.sterkte) >= 5).slice(0, 6)) start.push({ id: 'zicht-' + p.id, les: p.les, bron: kort(p.bron, 160), sterkte: p.sterkte, stand: 'ZICHT-research; de stand per les staat op ' + HOST + '/api/zicht?op=stand' });
  let video = [], buiten = null;
  if (['youtube', 'tiktok', 'instagram', 'pinterest', 'facebook'].includes(medium)) try { const VM = await import('./videomind.js'); const L = await VM.lessen({ platform: medium }); video = [...(L.hand || []).slice(0, 4).map(x => kort(x.les, 220) + ' (Videomind, met de hand)'), ...(L.automatisch || []).slice(0, 4).map(x => kort(x.les, 220) + ' (Videomind, uit de cijfers)')]; } catch (e) {}
  try { const B = await import('./buiten.js'); const x = await kv.get('buiten:' + B.projectId(project)).catch(() => null); if (x) buiten = { dag: x.dag, stijgers: (x.stijgers || []).slice(0, 5).map(s => s.cc + ' "' + s.k + '" ' + s.v + ' per maand, ' + s.groei), dalers: (x.dalers || []).slice(0, 3).map(s => s.cc + ' "' + s.k + '" ' + s.groei), klachten: (x.haken || []).slice(0, 5) }; } catch (e) {}
  return { vast, start: start.sort((a, b) => N(b.sterkte) - N(a.sterkte)), video, buiten };
}

// ---------- briefing: lezen vóór je iets maakt ----------
const stukTekst = st => kort([st.inhoud.titel, st.inhoud.tekst].filter(Boolean).join(' / ') || st.naam || '(zonder tekst)', 150);
const stukRegel = st => '[' + ((st.oordeel && st.oordeel.uitslag) || 'open') + '] ' + st.dag + ' ' + stukTekst(st) + (st.inhoud.haak ? ' (haak ' + st.inhoud.haak + ')' : '') + (st.oordeel && st.oordeel.waarom ? ' | ' + st.oordeel.waarom : '');
// één regel per familie (dezelfde tekst in kopieën van een campagne telt één keer), nieuwste eerst
const perFamilie = l => { const gezien = new Set(); return [...l].sort((a, b) => b.t.localeCompare(a.t)).filter(st => { const k = (st.oordeel && st.oordeel.fam) || st.id; if (gezien.has(k)) return false; gezien.add(k); return true; }); };
export async function briefing({ medium, project, doel, dagen = 90 } = {}) {
  medium = mediumId(medium); project = projectId(project); if (!medium || !project) return { ok: false, fout: 'geef medium en project: ?op=briefing&medium=<' + Object.keys(MEDIA).join('|') + '>&project=<id>[&doel=<' + Object.keys(DOELEN).join('|') + '>]' };
  doel = doelId(doel) || standaardDoel(project, medium, '');
  const stukken = oordelen(await alle({ dagen })), zelfdeDoel = stukken.filter(s => s.doel.soort === doel);
  const hier = zelfdeDoel.filter(s => s.medium === medium && s.voor.project === project), mediumBreed = zelfdeDoel.filter(s => s.medium === medium), soortBreed = stukken.filter(s => s.medium !== medium && !!s.betaald === !!MEDIA[medium].betaald);
  const Lh = lessenSlim(hier), Lm = lessenSlim(mediumBreed), Ls = lessenSlim(soortBreed);
  const getest = new Set(Lh.lessen.filter(l => l.stukken >= 3).map(l => l.kenmerk + '|' + l.waarde)), inhoud = l => !/vorm of plek|onderwerp/.test(l.kenmerk) && Math.abs(N(l.verschil)) >= 15 && !getest.has(l.kenmerk + '|' + l.waarde);
  const elders = [...Lm.lessen.filter(l => l.oordeel === 'werkt').map(l => ({ ...l, waar: 'alle projecten op ' + MEDIA[medium].naam })), ...Ls.lessen.filter(l => l.oordeel === 'werkt').map(l => ({ ...l, waar: 'andere ' + (MEDIA[medium].betaald ? 'advertentienetwerken' : 'onbetaalde media') }))].filter(inhoud).slice(0, 8);
  const nietElders = Lm.lessen.filter(l => l.oordeel === 'werkt niet').map(l => ({ ...l, waar: 'alle projecten op ' + MEDIA[medium].naam })).filter(inhoud).slice(0, 5);
  const fam = perFamilie(hier.filter(s => s.status === 'geplaatst'));
  const best = fam.filter(s => s.oordeel.uitslag === 'raak').sort((a, b) => N(b.oordeel.per) - N(a.oordeel.per)).slice(0, 5), slecht = fam.filter(s => s.oordeel.uitslag === 'mis').sort((a, b) => N(a.oordeel.per) - N(b.oordeel.per)).slice(0, 5);
  const laatste = perFamilie(hier).slice(0, 12);
  const R = await research({ medium, project, doel, lessen: [...Lh.lessen, ...Lm.lessen] });
  const alleHaken = [...new Set(stukken.filter(s => !!s.betaald === !!MEDIA[medium].betaald).map(s => s.inhoud.haak).filter(h => h && h !== '-' && h !== 'anders'))];
  const gebruikt = new Set(hier.map(s => s.inhoud.haak)), nietGeprobeerd = alleHaken.filter(h => !gebruikt.has(h)).slice(0, 8);
  const poort = poortVan(stukken).filter(p => p.project === project).slice(0, 4), zonderTekst = hier.filter(s => !s.inhoud.titel && !s.inhoud.tekst).length;
  // wat nu groot is op dit platform (lib/trend.js) en wat op dit medium de laatste 14 dagen bij ons zelf het best liep (alle projecten)
  let trend = null; try { const TR = await import('./trend.js'); trend = await TR.leesTrend(medium); } catch (e) {}
  const nuBest = perFamilie(stukken.filter(s => s.medium === medium && s.status === 'geplaatst' && Date.now() - Date.parse(s.t) < 14 * DAG && (s.oordeel.uitslag === 'raak' || N(s.cijfers && s.cijfers.kliks) >= 3))).sort((a, b) => (b.oordeel.uitslag === 'raak') - (a.oordeel.uitslag === 'raak') || N(b.cijfers.kliks) - N(a.cijfers.kliks)).slice(0, 5);
  const tw = tweeling(hier);
  const uit = { ok: true, medium, mediumNaam: MEDIA[medium].naam, project, doel, doelNaam: DOELEN[doel], t: new Date().toISOString(), stukkenHier: hier.length, families: fam.length, zonderTekst, basis: Lh.basis, voorlopig: !!Lh.ondiep,
    vast: R.vast, werkt: Lh.lessen.filter(l => l.oordeel === 'werkt').slice(0, 8), werktNiet: Lh.lessen.filter(l => l.oordeel === 'werkt niet').slice(0, 8), onbeslist: Lh.lessen.filter(l => l.oordeel === 'onbeslist' && l.stukken >= 3 && Math.abs(N(l.verschil)) >= 20).slice(0, 6),
    best, slecht, laatste, elders, nietElders, research: R.start, video: R.video, buiten: R.buiten, nietGeprobeerd, poort, trend, nuBest, tweeling: tw };
  uit.tekst = briefingTekst(uit); return uit;
}
export function briefingTekst(b) {
  const L = ['BRIEFING ' + b.mediumNaam + ' · ' + b.project + ' · doel: ' + b.doelNaam, 'Lees dit vóór je iets maakt. Eigen cijfers gaan voor research; research is alleen een voorsprong. Stand ' + b.t.slice(0, 16).replace('T', ' ') + ' UTC: ' + b.stukkenHier + ' eerdere stukken op dit medium voor dit project met dit doel (' + b.families + ' verschillende).',
    (MEDIA[b.medium].betaald ? 'Een advertentie telt tegen wat je binnen zijn eigen campagne mocht verwachten; conversies = wat het netwerk per advertentie telt op het doel waarop de campagne biedt.' : 'Een stuk telt tegen wat je binnen dit project en medium mocht verwachten.') + (b.voorlopig ? ' Het doel zelf (' + DOEL_MV[b.doel] + ') komt nog te weinig voor: de lessen hieronder zijn een voorlopig signaal op kliks.' : ''), ''];
  if (b.zonderTekst) L.push('LET OP: van ' + b.zonderTekst + ' van de ' + b.stukkenHier + ' stukken is de tekst niet gemeld. Daar kan Clickmind niet van leren: geef bij op=distmaak altijd tekst= mee.', '');
  const blok = (kop, regels) => { if (regels.length) { L.push(kop); for (const r of regels) L.push('- ' + r); L.push(''); } };
  blok('VASTE REGELS (altijd)', b.vast.map(v => v.les + ' [' + kort(v.bron, 110) + ']'));
  const betaald = MEDIA[b.medium].betaald, tr = b.trend;
  L.push('NATIVE EN TREND (vaste regel, Henkjan 27 nov 2026): maak elk stuk voor ' + b.mediumNaam + ' zelf, nooit een tekst van een ander platform. Maak er ALTIJD een tweede versie naast op wat nu groot is op ' + b.mediumNaam + ' (trend-alternatief). Meld ze als tweeling: variant=native en variant=trend met trend=<welke trend> en paar=<id van de ander>. Clickmind meet welke wint.');
  if (tr && tr.vers) blok('WAT NU GROOT IS OP ' + b.mediumNaam.toUpperCase() + ' (nagekeken ' + tr.laatst.slice(0, 10) + '; bouw het alternatief hierop)', tr.items.map(x => x.wat + (x.maat ? ' (' + x.maat + ')' : '') + (x.vorm ? ' Zo gebruik je het: ' + x.vorm : '') + (x.voorbeeld ? ' Voorbeeld: ' + x.voorbeeld : '') + ' [' + kort(x.bron, 100) + ', ' + x.t.slice(0, 10) + ']'));
  else L.push((tr && tr.items.length ? 'DE TRENDKENNIS VAN ' + b.mediumNaam.toUpperCase() + ' IS OUD (nagekeken ' + tr.laatst.slice(0, 10) + ')' : 'ER IS NOG GEEN TRENDKENNIS VAN ' + b.mediumNaam.toUpperCase()) + ': ' + (betaald ? 'gebruik als trend wat de laatste 14 dagen bij ons zelf het best liep (hieronder).' : 'zoek eerst op wat nu groot is op ' + b.mediumNaam + ' (vormen, geluiden, onderwerpen, haken; minstens 2 bronnen van deze week) en meld het: ' + HOST + '/api/mm?op=trend&j={"medium":"' + b.medium + '","items":[{"wat":"...","vorm":"hoe je het native gebruikt","voorbeeld":"...","bron":"https://..."}]}. Maak daarna pas het alternatief.'), ...(tr && tr.items.length ? tr.items.slice(0, 4).map(x => '- (oud) ' + x.wat + ' [' + kort(x.bron, 80) + ', ' + x.t.slice(0, 10) + ']') : []), '');
  blok('LIEP DE LAATSTE 14 DAGEN HET BEST OP ' + b.mediumNaam.toUpperCase() + ' (eigen cijfers, alle projecten)', b.nuBest.map(st => st.voor.project + ': ' + stukRegel(st)));
  if (b.tweeling && b.tweeling.zonder) L.push('LET OP: ' + b.tweeling.zonder + ' van de ' + b.tweeling.sinds + ' stukken hier sinds ' + REGEL_SINDS + ' hebben nog geen trend-alternatief.', '');
  blok('WERKT HIER (eigen cijfers, aantoonbaar beter dan verwacht)', b.werkt.map(l => lesZin(l)));
  blok('WERKT HIER NIET (aantoonbaar slechter: niet herhalen)', b.werktNiet.map(l => lesZin(l)));
  blok('BESTE STUKKEN HIER (bouw hierop voort)', b.best.map(stukRegel));
  blok('SLECHTSTE STUKKEN HIER (niet nog eens zo)', b.slecht.map(stukRegel));
  blok('WERKT ELDERS, HIER NOG NIET GEPROBEERD (kruisbestuiving: neem er minstens één mee)', b.elders.map(l => lesZin(l) + ' [' + l.waar + ']'));
  blok('WERKT ELDERS NIET', b.nietElders.map(l => lesZin(l) + ' [' + l.waar + ']'));
  blok('NOG ONBESLIST HIER (meer stukken nodig)', b.onbeslist.map(l => lesZin(l)));
  blok('STARTKENNIS UIT RESEARCH (voorsprong, geen wet)', b.research.map(r => r.les + ' [' + kort(r.bron, 110) + '; ' + r.stand + ']'));
  blok('VIDEOMIND', b.video);
  if (b.buiten) { blok('VRAAG VAN BUITEN (Demand Radar, ' + b.buiten.dag + '): stijgers', b.buiten.stijgers); blok('Klachten over concurrenten (haken)', b.buiten.klachten); }
  blok('HAKEN DIE HIER NOG NIET ZIJN GEPROBEERD', b.nietGeprobeerd);
  blok('LET OP: BESTEMMING ZONDER UITKOMST', b.poort.map(p => p.pagina + ': ' + nl(p.kliks) + ' kliks, geen aanmelding of verkoop gemeten. ' + p.advies));
  blok('LAATSTE STUKKEN HIER (herhaal niet wat er al staat)', b.laatste.map(stukRegel));
  L.push('MELD JE STUK (verplicht, in dezelfde beurt): ' + HOST + '/api/mm?op=stuk&j={"medium":"' + b.medium + '","project":"' + b.project + '","doel":"' + b.doel + '","titel":"...","tekst":"...","haak":"...","pagina":"https://...","plek":"...","publiek":"...","variant":"native|trend","trend":"...","paar":"<id van de tweeling>"}',
    'Posts met een korte link gaan via op=distmaak (geef doelsoort=' + b.doel + ', tekst=, variant= en bij het alternatief trend= en paar=<id van de native post> mee), video\'s via Videomind, mail via de POST-lus: die komen vanzelf in het geheugen. Het doel van een campagne zet je vast met ?op=stuk&campagne=<netwerk>:<id>&doel=' + b.doel + '.',
    'Alle stukken en lessen: ' + HOST + '/geheugen');
  return L.join('\n');
}

// tweeling: hoeveel onbetaalde stukken sinds de regel een trend-alternatief hebben (modal, paginaproef en mail tellen niet mee)
export function tweeling(stukken) {
  const mee = stukken.filter(s => !s.betaald && !['modal', 'proef', 'mail'].includes(s.bron) && s.dag >= REGEL_SINDS && s.status !== 'niet geplaatst'), ids = new Set(mee.filter(s => s.variant === 'trend').map(s => s.paar).filter(Boolean));
  const trend = mee.filter(s => s.variant === 'trend').length, native = mee.filter(s => s.variant !== 'trend'), met = native.filter(s => s.paar || ids.has(s.id)).length;
  return { sinds: mee.length, trend, native: native.length, met, zonder: native.length - met };
}

// ---------- uitkomstpoort: bestemmingen waar veel kliks heen gaan en niets uit komt ----------
export function poortVan(stukken) {
  const P = {};
  for (const st of stukken) { if (!st.betaald || !st.voor.pagina || !st.cijfers) continue;
    const k = st.voor.project + '|' + st.voor.pagina, p = P[k] || (P[k] = { project: st.voor.project, pagina: st.voor.pagina, kliks: 0, kosten: 0, uitkomsten: 0, stukken: 0 });
    p.kliks += N(st.cijfers.kliks); p.kosten += N(st.cijfers.kosten); p.uitkomsten += N(st.cijfers.aanmelding) + N(st.cijfers.koop); p.stukken++; } /* eigen meting van Clickmind, naar rato van de kliks: opgeteld per pagina klopt het weer */
  return Object.values(P).filter(p => p.kliks >= 300 && p.uitkomsten < 0.5).map(p => ({ ...p, kliks: Math.round(p.kliks), kosten: r2(p.kosten), uitkomsten: 0, advies: 'Eerst een aanmelding of gemeten verkoop op deze pagina, dan pas nieuw verkeer.' })).sort((a, b) => b.kliks - a.kliks);
}

// Vóór een nieuwe campagne of kopie: staat de bestemming op de lijst zonder uitkomst? (?op=stuk&poort=<landing-url>); leest de laatste ronde
export async function poortCheck(url) {
  const p = pagina(url); if (!p) return { ok: false, fout: 'poort=<landing-url>' };
  const s = await kv.get(STAND).catch(() => null), x = ((s && s.poort) || []).find(q => q.pagina === p);
  return x ? { ok: true, pagina: p, dicht: true, kliks: x.kliks, kosten: x.kosten, advies: 'Deze pagina kreeg ' + nl(x.kliks) + ' betaalde kliks zonder één gemeten aanmelding of verkoop. Zet eerst een aanmelding of gemeten verkoop op de pagina; nieuw verkeer alleen op Henkjans woord.' } : { ok: true, pagina: p, dicht: false, ronde: s ? s.t : null };
}

// ---------- stand: het geheugen in één overzicht ----------
export async function stand({ vers = false, bronnen = null, fouten = null, dagen = 90 } = {}) {
  if (!vers) { const s = await kv.get(STAND).catch(() => null); if (s) return s; }
  const stukken = oordelen(await alle({ dagen })), tel = { stukken: stukken.length, families: 0, raak: 0, mis: 0, gemiddeld: 0, open: 0, afgeleid: 0, regel: 0, zonderTekst: 0 };
  const perMedium = {}, perProject = {}, perBron = {}, tegenRegel = [], famGezien = new Set(), regelGezien = new Set();
  for (const st of stukken) {
    const u = (st.oordeel || {}).uitslag, fk = st.oordeel.fam || st.id, eerste = !famGezien.has(fk); famGezien.add(fk);
    if (eerste) { tel.families++; if (u === 'raak') tel.raak++; else if (u === 'mis') tel.mis++; else if (u === 'gemiddeld') tel.gemiddeld++; else tel.open++; }
    if (st.doel.afgeleid) tel.afgeleid++; if (!st.inhoud.titel && !st.inhoud.tekst) tel.zonderTekst++;
    const rc = regelCheck(st); if (rc.length && st.status === 'geplaatst' && !regelGezien.has(fk)) { regelGezien.add(fk); tel.regel++; if (tegenRegel.length < 12) tegenRegel.push({ id: st.id, project: st.voor.project, medium: st.medium, tekst: stukTekst(st), regel: rc.join(', '), naam: kort(st.naam, 70) }); }
    const c = st.cijfers || {};
    for (const [o, k] of [[perMedium, st.medium], [perProject, st.voor.project], [perBron, st.bron]]) { const g = o[k] || (o[k] = { stukken: 0, raak: 0, mis: 0, afgeleid: 0, kliks: 0, kosten: 0, conv: 0, zonderTekst: 0 }); g.stukken++; if (eerste && u === 'raak') g.raak++; if (eerste && u === 'mis') g.mis++; if (st.doel.afgeleid) g.afgeleid++; g.kliks += N(c.kliks); g.kosten += N(c.kosten); g.conv += N(c.doel); if (!st.inhoud.titel && !st.inhoud.tekst) g.zonderTekst++; }
  }
  for (const o of [perMedium, perProject, perBron]) for (const g of Object.values(o)) { g.kliks = Math.round(g.kliks); g.kosten = r2(g.kosten); g.conv = Math.round(g.conv); }
  // lessen per medium en doel; alleen wat aantoonbaar werkt of niet werkt
  const G = {}; for (const st of stukken) (G[st.medium + '|' + st.doel.soort] || (G[st.medium + '|' + st.doel.soort] = [])).push(st);
  const lessen = [], briefings = [];
  for (const [k, l] of Object.entries(G)) { const [m, d] = k.split('|'), L = lessenSlim(l); for (const x of L.lessen.filter(x => x.oordeel !== 'onbeslist').slice(0, 6)) lessen.push({ medium: m, doel: d, voorlopig: !!L.ondiep, ...x }); }
  const combi = {}; for (const st of stukken) { const k = st.voor.project + '|' + st.medium + '|' + st.doel.soort; combi[k] = (combi[k] || 0) + 1; }
  for (const [k, n] of Object.entries(combi).sort((a, b) => b[1] - a[1]).slice(0, 40)) { const [p, m, d] = k.split('|'); briefings.push({ project: p, medium: m, doel: d, stukken: n, url: HOST + '/api/mm?op=briefing&medium=' + m + '&project=' + p + '&doel=' + d + '&vorm=tekst' }); }
  const toon = st => ({ id: st.id, project: st.voor.project, medium: st.medium, doel: st.doel.soort, dag: st.dag, tekst: stukTekst(st), haak: st.inhoud.haak, waarom: st.oordeel.waarom, per: st.oordeel.per, voorlopig: !!st.oordeel.voorlopig });
  const uniek = perFamilie(stukken.filter(st => st.status === 'geplaatst'));
  // sneller uit: wat het geheugen op de uit-lijst zet, met sinds wanneer; loopt een advertentie 2 dagen na plaatsing op de lijst nog, dan pakt de wacht van het netwerk hem niet
  const uit = uitKandidaten(stukken), vandaag = dagUtc();
  if (uit.length) { for (const x of uit) await kv.raw(['HSETNX', 'ps:uitlog', x.id, vandaag]).catch(() => {}); const log = Object.fromEntries(paren(await kv.raw(['HGETALL', 'ps:uitlog']).catch(() => null)));
    for (const x of uit) { x.sinds = log[x.id] || vandaag; x.looptNog = x.laatst > dagUtc(Date.parse(x.sinds + 'T00:00:00Z') + DAG); } }
  // native en trend: tweelingen sinds de regel, en per platform of de trendkennis vers is
  const tw = tweeling(stukken), inGebruik = [...new Set(stukken.filter(st => TREND_MEDIA.includes(st.medium) && Date.now() - Date.parse(st.t) < 30 * DAG).map(st => st.medium))];
  let trends = {}, voorstellen = []; try { const TR = await import('./trend.js'); trends = await TR.alleTrends(inGebruik); if (vers) await TR.trendTaak(inGebruik); voorstellen = (await TR.voorstellen(8)).map(v => ({ id: v.id, titel: v.titel, project: v.project, medium: v.medium, status: v.status, stukken: v.items.length, t: v.t })); } catch (e) {}
  const s = { t: new Date().toISOString(), dagen, tel, perMedium, perProject, perBron, uit, uitStop: !!(await kv.get('ps:uitstop').catch(() => null)), tweeling: tw, trends, voorstellen, lessen: lessen.sort((a, b) => Math.abs(N(b.verschil)) - Math.abs(N(a.verschil))).slice(0, 40),
    raak: uniek.filter(st => st.oordeel.uitslag === 'raak').sort((a, b) => N(b.oordeel.per) - N(a.oordeel.per)).slice(0, 15).map(toon),
    mis: uniek.filter(st => st.oordeel.uitslag === 'mis').sort((a, b) => N(b.cijfers && b.cijfers.kosten) - N(a.cijfers && a.cijfers.kosten)).slice(0, 15).map(toon),
    tegenRegel, poort: poortVan(stukken).slice(0, 10), briefings, bronnen: bronnen || ((await kv.get(STAND).catch(() => null)) || {}).bronnen || null, fouten: fouten || [], priors: priors().length,
    ontbreekt: ['Pins van de keuzehulpen die Pinterest zelf uit de feed haalt (geen register per pin) en de Pinterest-cijfers per keuzehulp-pin', 'Mailmind-stromen die niet via de POST-lus lopen', 'Vertoningen, echte mensen en aanmeldingen per post (nu alleen kliks via de korte link)'] };
  await kv.set(STAND, s, { ex: 14 * 86400 }).catch(() => {});
  return s;
}
const mediumRegel = (m, g) => { const b = (MEDIA[m] || {}).betaald; return g.stukken + (g.stukken === 1 ? ' stuk' : ' stukken') + (b ? (g.kliks ? ', ' + nl(g.kliks) + ' kliks, $' + kom(g.kosten) + (g.conv ? ', ' + nl(g.conv) + ' conversies' : '') : '') : (g.kliks ? ', ' + kom(r2(g.kliks / g.stukken)) + ' kliks per stuk' : ', geen kliks')) + (g.raak || g.mis ? ', ' + g.raak + ' raak, ' + g.mis + ' mis' : '') + (g.zonderTekst ? ', ' + g.zonderTekst + ' zonder tekst' : ''); };
export function standTekst(s) {
  const L = ['GEHEUGEN VAN CLICKMIND: alles wat de deur uit ging, laatste ' + s.dagen + ' dagen (ronde ' + s.t.slice(0, 16).replace('T', ' ') + ' UTC)',
    nl(s.tel.stukken) + ' stukken met paspoort (medium, waarvoor, doel), ' + nl(s.tel.families) + ' verschillende. Daarvan ' + s.tel.raak + ' raak, ' + s.tel.mis + ' mis, ' + s.tel.gemiddeld + ' gemiddeld en ' + nl(s.tel.open) + ' nog zonder oordeel. ' + nl(s.tel.afgeleid) + ' stukken kregen het doel van hun project omdat de maker er geen opgaf' + (s.tel.zonderTekst ? '; van ' + nl(s.tel.zonderTekst) + ' stukken is de tekst niet gemeld (daar valt niet van te leren)' : '') + '.',
    'Een advertentie telt tegen wat je binnen zijn eigen campagne mocht verwachten, een post, video of mail binnen zijn project en medium. Conversies = wat het netwerk per advertentie telt op het doel waarop de campagne biedt.', ''];
  L.push('PER MEDIUM'); for (const [m, g] of Object.entries(s.perMedium).sort((a, b) => b[1].stukken - a[1].stukken)) L.push('- ' + ((MEDIA[m] || {}).naam || m) + ': ' + mediumRegel(m, g));
  L.push('', 'PER PROJECT'); for (const [p, g] of Object.entries(s.perProject).sort((a, b) => b[1].stukken - a[1].stukken)) L.push('- ' + p + ': ' + g.stukken + ' stukken, ' + g.raak + ' raak, ' + g.mis + ' mis');
  if (s.lessen.length) { L.push('', 'WAT AANTOONBAAR WERKT OF NIET WERKT'); for (const l of s.lessen.slice(0, 25)) L.push('- ' + ((MEDIA[l.medium] || {}).naam || l.medium) + ', doel ' + l.doel + (l.voorlopig ? ' (voorlopig, op kliks)' : '') + ': ' + (l.oordeel === 'werkt' ? 'WERKT ' : 'WERKT NIET ') + lesZin(l)); }
  if (s.raak.length) { L.push('', 'RAAK'); for (const x of s.raak.slice(0, 12)) L.push('- ' + x.project + ' · ' + x.medium + ': ' + x.tekst + ' | ' + x.waarom); }
  if (s.mis.length) { L.push('', 'MIS'); for (const x of s.mis.slice(0, 12)) L.push('- ' + x.project + ' · ' + x.medium + ': ' + x.tekst + ' | ' + x.waarom); }
  if (s.tegenRegel.length) { L.push('', 'TEGEN EEN VASTE REGEL (' + s.tel.regel + ' verschillende)'); for (const x of s.tegenRegel) L.push('- ' + x.project + ' · ' + x.medium + ': ' + x.tekst + ' | ' + x.regel); }
  if ((s.uit || []).length) { L.push('', 'OP DE UIT-LIJST VANUIT HET GEHEUGEN (hard mis binnen de eigen campagne; de ronde van het netwerk zet ze stil, nooit onder 4 actief)'); for (const x of s.uit) L.push('- ' + x.project + ' · ' + x.net + ' · campagne ' + x.campagne + ' · advertentie ' + x.advertentie + ': ' + x.tekst + ' | ' + x.conversies + ' conversies tegen ' + kom(x.verwacht) + ' verwacht, ' + nl(x.bezoeken) + ' kliks, sinds ' + x.sinds + (x.looptNog ? ' | LOOPT NOG: de wacht van het netwerk pakte hem niet' : '')); }
  if (s.tweeling) L.push('', 'NATIVE EN TREND (regel sinds ' + REGEL_SINDS + '): ' + s.tweeling.sinds + ' onbetaalde stukken, ' + s.tweeling.trend + ' trend-alternatieven, ' + s.tweeling.zonder + ' native stukken zonder alternatief.');
  if (s.trends && Object.keys(s.trends).length) { L.push('TRENDKENNIS PER PLATFORM: ' + Object.entries(s.trends).map(([m, t]) => ((MEDIA[m] || {}).naam || m) + ' ' + (t.vers ? 'vers' : t.aantal ? 'oud' : 'leeg')).join(', ') + '. Lezen en melden: ' + HOST + '/api/mm?op=trend&vorm=tekst'); }
  if ((s.voorstellen || []).length) { L.push('', 'VOORSTELLEN (Henkjan ziet ze eerst)'); for (const v of s.voorstellen) L.push('- [' + v.status + '] ' + v.titel + ' (' + v.stukken + ' stukken): ' + HOST + '/voorstel?id=' + v.id); }
  if (s.poort.length) { L.push('', 'BESTEMMINGEN ZONDER UITKOMST (300 of meer kliks, geen aanmelding of verkoop gemeten)'); for (const p of s.poort) L.push('- ' + p.project + ' · ' + p.pagina + ': ' + nl(p.kliks) + ' kliks, $' + kom(p.kosten)); }
  L.push('', 'BRIEFING PER PROJECT EN MEDIUM (lees vóór je iets maakt)'); for (const b of s.briefings.slice(0, 25)) L.push('- ' + b.project + ' · ' + b.medium + ' · ' + b.doel + ' (' + b.stukken + '): ' + b.url);
  if (s.bronnen) L.push('', 'INGELADEN: ' + Object.entries(s.bronnen).map(([k, v]) => k + ' ' + v.stukken + (v.fout ? ' (fout: ' + v.fout + ')' : '')).join(', '));
  L.push('NOG NIET IN HET GEHEUGEN: ' + s.ontbreekt.join('; ') + '.');
  L.push('', 'STUK MELDEN: ' + HOST + '/api/mm?op=stuk&j={"medium":"...","project":"...","doel":"...","titel":"...","tekst":"..."}', 'BRIEFING: ' + HOST + '/api/mm?op=briefing&medium=<medium>&project=<id>&doel=<doel>&vorm=tekst');
  return L.join('\n');
}
export function standHtml(s, CSS) {
  const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const r = (l, i) => '<div class="r"><b>' + l + '</b><span>' + i + '</span></div>', lijst = a => a.length ? '<div class="lijst">' + a.join('') + '</div>' : '';
  const mn = m => (MEDIA[m] || {}).naam || m, oud = Date.now() - Date.parse(s.t) > 26 * 3600e3;
  const sec = (kop, inh, uitleg) => inh ? '<section><h2>' + kop + '</h2>' + (uitleg ? '<p>' + uitleg + '</p>' : '') + inh + '</section>' : '';
  const pc = v => v == null ? '' : (v >= 0 ? '+' : '') + v + '%';
  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex"><title>Geheugen van Clickmind</title><link rel="alternate" type="text/plain" href="?op=stukken&vorm=tekst">'
    + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"><style>' + CSS + '</style></head><body><div class="w"><header><a class="merk" href="/dashboard">Dashboard</a><span class="meta">Geheugen</span></header>'
    + '<section class="tool"><h1>' + nl(s.tel.stukken) + ' stukken in één geheugen</h1><p>Alles wat de deur uit ging in ' + s.dagen + ' dagen: advertenties, posts, video\'s, mails, pins en de teksten van de modal en de paginaproeven. Elk stuk heeft een paspoort: op welk medium, waarvoor en met welk doel.</p>'
    + '<p>' + nl(s.tel.families) + ' verschillende stukken: ' + s.tel.raak + ' raak, ' + s.tel.mis + ' mis, ' + s.tel.gemiddeld + ' gemiddeld. De rest heeft nog te weinig cijfers.</p>'
    + (s.tel.afgeleid ? '<p>' + nl(s.tel.afgeleid) + ' stukken kregen het doel van hun project, omdat de maker er geen opgaf.</p>' : '')
    + (s.tel.zonderTekst ? '<p><b>Van ' + nl(s.tel.zonderTekst) + ' stukken is de tekst niet gemeld. Daar kan Clickmind niet van leren.</b></p>' : '')
    + (oud ? '<p><b>Let op: de laatste ronde is van ' + esc(s.t.slice(0, 16).replace('T', ' ')) + ' UTC.</b></p>' : '') + '</section>'
    + sec('Wacht op jou', lijst((s.voorstellen || []).filter(v => v.status === 'wacht').map(v => r(v.stukken, '<a href="/voorstel?id=' + esc(v.id) + '">' + esc(v.titel) + '</a><br>' + esc(v.project + ' · ' + mn(v.medium))))), 'Nieuwe stukken die je eerst ziet. Niets gaat live zonder jouw ja.')
    + sec('Native en trend', s.tweeling && s.trends ? lijst([r(s.tweeling.trend, 'trend-alternatieven sinds ' + esc(REGEL_SINDS) + (s.tweeling.zonder ? '<br><b>' + s.tweeling.zonder + ' stukken nog zonder alternatief</b>' : '')), ...Object.entries(s.trends).map(([m, t]) => r(t.vers ? 'Vers' : t.aantal ? 'Oud' : 'Leeg', esc(mn(m)) + (t.items[0] ? '<br>' + esc(t.items[0].wat) : '')))]) : '', 'Elk stuk is voor zijn platform gemaakt en krijgt een tweede versie op wat daar nu groot is. Het geheugen meet welke wint.')
    + sec('Gaat uit', lijst((s.uit || []).map(x => r(x.index + '%', esc(x.tekst) + '<br>' + esc(x.project + ' · ' + mn(x.net) + ' · ' + x.conversies + ' conversies tegen ' + kom(x.verwacht) + ' verwacht · ' + nl(x.bezoeken) + ' kliks') + (x.looptNog ? '<br><b>Loopt nog: de wacht van het netwerk pakte hem niet.</b>' : '')))), (s.uitStop ? 'De uit-lijst staat stil (noodrem). ' : '') + 'Advertenties die binnen hun eigen campagne aantoonbaar slecht lopen. De ronde van het netwerk zet ze stil, nooit onder 4 actieve advertenties.')
    + sec('Wat werkt en wat niet', lijst(s.lessen.slice(0, 16).map(l => r(pc(l.verschil), esc(mn(l.medium) + ', doel ' + l.doel + (l.voorlopig ? ', voorlopig op kliks' : '')) + '<br>' + esc(lesZin(l))))), 'Elk stuk telt tegen wat je binnen zijn eigen campagne of project mocht verwachten.')
    + sec('Raak', lijst(s.raak.slice(0, 10).map(x => r(pc(x.per), esc(x.tekst) + '<br>' + esc(x.project + ' · ' + mn(x.medium) + ' · ' + x.waarom)))))
    + sec('Mis', lijst(s.mis.slice(0, 10).map(x => r(pc(x.per), esc(x.tekst) + '<br>' + esc(x.project + ' · ' + mn(x.medium) + ' · ' + x.waarom)))))
    + sec('Tegen een vaste regel', lijst(s.tegenRegel.map(x => r('Regel', esc(x.tekst) + '<br>' + esc(x.project + ' · ' + mn(x.medium) + ' · ' + x.regel)))))
    + sec('Bestemmingen zonder uitkomst', lijst(s.poort.map(p => r(nl(p.kliks), esc(p.pagina) + '<br>' + esc(p.project + ' · $' + kom(p.kosten) + ' · geen aanmelding of verkoop gemeten')))), 'Pagina\'s met 300 of meer betaalde kliks waar geen aanmelding of verkoop is gemeten.')
    + sec('Per medium', lijst(Object.entries(s.perMedium).sort((a, b) => b[1].stukken - a[1].stukken).map(([m, g]) => r(nl(g.stukken), esc(mn(m)) + '<br>' + esc(mediumRegel(m, g).replace(/^\d+ stuk(ken)?,? ?/, ''))))))
    + sec('Per project', lijst(Object.entries(s.perProject).sort((a, b) => b[1].stukken - a[1].stukken).map(([p, g]) => r(nl(g.stukken), esc(p) + (g.raak || g.mis ? '<br>' + g.raak + ' raak, ' + g.mis + ' mis' : '')))))
    + sec('Briefing vóór je iets maakt', lijst(s.briefings.slice(0, 20).map(b => r(nl(b.stukken), '<a href="' + esc(b.url) + '">' + esc(b.project + ' · ' + mn(b.medium) + ' · ' + b.doel) + '</a>'))))
    + sec('Nog niet in het geheugen', lijst(s.ontbreekt.map(x => r('', esc(x)))))
    + '<footer><p>Ronde ' + esc(s.t.slice(0, 16).replace('T', ' ')) + ' UTC. Voor chats: <a href="?op=stukken&vorm=tekst">geheugen als tekst</a>.</p></footer></div></body></html>';
}
// korte regel voor het dashboard (project clickmind) en voor de overdracht
export async function dashBlok() {
  const s = await kv.get(STAND).catch(() => null); if (!s) return null;
  const w = s.lessen.find(l => l.oordeel === 'werkt');
  return { t: s.t, regels: ['Geheugen: ' + nl(s.tel.stukken) + ' stukken met paspoort, ' + s.tel.raak + ' raak, ' + s.tel.mis + ' mis' + (s.tel.afgeleid ? ', ' + nl(s.tel.afgeleid) + ' zonder eigen doel' : '') + (s.tel.zonderTekst ? ', ' + nl(s.tel.zonderTekst) + ' zonder tekst' : '') + '.', ...(w ? ['Sterkste les: ' + ((MEDIA[w.medium] || {}).naam || w.medium) + ', doel ' + w.doel + ', ' + lesZin(w) + '.'] : []), ...(s.poort.length ? [s.poort.length + ' bestemmingen zonder uitkomst, grootste: ' + s.poort[0].pagina + ' (' + nl(s.poort[0].kliks) + ' kliks).'] : []), ...(s.tel.regel ? [s.tel.regel + ' advertenties tegen een vaste regel (prijs of levertijd in de tekst).'] : []), ...((s.uit || []).length ? [s.uit.length + ' advertenties op de uit-lijst vanuit het geheugen' + (s.uit.some(x => x.looptNog) ? ', waarvan ' + s.uit.filter(x => x.looptNog).length + ' nog lopen' : '') + '.'] : []), ...(s.trends && Object.values(s.trends).some(t => !t.vers) ? ['Trendkennis oud of leeg: ' + Object.entries(s.trends).filter(([, t]) => !t.vers).map(([m]) => (MEDIA[m] || {}).naam || m).join(', ') + '.'] : []), ...((s.voorstellen || []).filter(v => v.status === 'wacht').map(v => 'Voorstel wacht op Henkjan: ' + v.titel + ' ' + HOST + '/voorstel?id=' + v.id))],
    oud: Date.now() - Date.parse(s.t) > 26 * 3600e3, url: HOST + '/geheugen' };
}
export async function zetUitStop(aan) { if (aan) await kv.set('ps:uitstop', new Date().toISOString()); else await kv.del('ps:uitstop'); return { ok: true, uitLijst: aan ? 'staat stil' : 'loopt' }; }
export async function zetStreng(lijst) { const l = String(lijst || '').split(',').map(x => x.trim().toLowerCase()).filter(x => ['post', 'video', 'ad', 'mail', 'hand'].includes(x)); await kv.set(STRENG, l); return { ok: true, streng: ['hand', ...l.filter(x => x !== 'hand')] }; }
