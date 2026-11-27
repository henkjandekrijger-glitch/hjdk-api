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
// OORDEEL = elk stuk met genoeg cijfers krijgt raak, mis of gemiddeld tegen zijn soortgenoten (zelfde medium en doel).
// LESSEN = per kenmerk (haak, emotie, opening, lengte, knoptekst, soort) wat aantoonbaar beter of slechter werkt dan het gemiddelde.
// BRIEFING = wat een chat of ronde leest vóór hij iets maakt (op=briefing&medium=&project=&doel=): vaste regels, wat hier werkte en niet,
//   wat elders werkt en hier nog niet is geprobeerd (kruisbestuiving), startkennis uit bestaande research en de vraag van buiten.
// RESEARCH = startkennis (data/stuk-priors.json, data/post-priors.json, data/zicht-priors.json, Videomind-lessen, lib/buiten.js). Research
//   geeft een voorsprong maar beslist niet: zodra eigen cijfers een les bevestigen of tegenspreken staat dat erbij en gaat eigen data voor.
//
// Opslag (Redis): ps:s:<id> stuk (240 dagen), ps:ix (zset id op tijd), ps:campdoel (hash net:campagne -> doel), ps:stand (laatste ronde),
// ps:streng (lijst bronnen waar een stuk zonder eigen doel geweigerd wordt). Geen adressen van ontvangers en geen beelddata in een stuk.
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { kv } from './db.js';

const HOST = 'https://hjdk-api-henq.vercel.app';
const S = 'ps:s:', IX = 'ps:ix', STAND = 'ps:stand', CAMPDOEL = 'ps:campdoel', STRENG = 'ps:streng', TTL = 240 * 86400, DAG = 864e5;
export const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const kort = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
const r1 = x => Math.round(N(x) * 10) / 10, r2 = x => Math.round(N(x) * 100) / 100;
const dagUtc = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const paren = h => { if (!h) return []; if (Array.isArray(h)) { const o = []; for (let i = 0; i + 1 < h.length; i += 2) o.push([String(h[i]), h[i + 1]]); return o; } return Object.entries(h); };

// ---------- paspoort: medium, waarvoor, doel ----------
export const MEDIA = {
  propeller: { naam: 'PropellerAds', betaald: true }, mondiad: { naam: 'Mondiad', betaald: true }, gads: { naam: 'Google Ads', betaald: true },
  'tiktok-ads': { naam: 'TikTok-advertenties', betaald: true }, meta: { naam: 'Meta-advertenties', betaald: true }, bing: { naam: 'Microsoft Ads', betaald: true },
  richads: { naam: 'RichAds', betaald: true }, mgid: { naam: 'MGID', betaald: true }, clickadu: { naam: 'Clickadu', betaald: true }, 'amazon-ads': { naam: 'Amazon Ads', betaald: true },
  x: { naam: 'X' }, instagram: { naam: 'Instagram' }, tiktok: { naam: 'TikTok' }, youtube: { naam: 'YouTube' }, pinterest: { naam: 'Pinterest' }, facebook: { naam: 'Facebook' },
  linkedin: { naam: 'LinkedIn' }, threads: { naam: 'Threads' }, reddit: { naam: 'Reddit' }, whatsapp: { naam: 'WhatsApp' }, telegram: { naam: 'Telegram' }, forum: { naam: 'Forum' },
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
export const doelId = d => { d = String(d || '').toLowerCase().trim(); return DOELEN[d] ? d : DOEL_ALIAS[d] || ''; };

// projecten: de id's van het dashboard; namen die andere systemen gebruiken wijzen naar één project
const PROJECT_ALIAS = { todayin: 'curacao', 'todayin-cw': 'curacao', taniakross: 'tk', 'tk-podcast': 'tk', keuzehulp: 'keuzehulpen', whichtobuy: 'keuzehulpen', kaufberater: 'keuzehulpen', nexyplatform: 'nexy', bookstuffers: 'content', stockingbooks: 'content', lastingchange: 'content', lc: 'content', yoors: 'kadoly', shop: 'kadoly', surgery: 'chirurgie', tsc: 'chirurgie', sealedintent: 'sealed', 'you-and-ai': 'youandai', yai: 'youandai' };
export const projectId = p => { p = String(p || '').toLowerCase().trim().replace(/[^a-z0-9-]/g, ''); return PROJECT_ALIAS[p] || p; };
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
  if (!oud || zonderTijd(oud) !== zonderTijd(st)) { await kv.set(S + st.id, st, { ex: TTL }); await kv.raw(['ZADD', IX, String(Date.parse(st.t)), st.id]).catch(() => {}); } else nieuw = false;
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
const formaatVan = (naam, f) => /in-?page/i.test(naam) ? 'in-page push' : /onclick|popunder|\bpop\b/i.test(naam) ? 'onclick' : /interstitial/i.test(naam) ? 'interstitial' : /telegram/i.test(naam) ? 'telegram' : /\bpush\b/i.test(naam) ? 'push' : f != null && f !== '' ? 'formaat ' + f : '';

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
      x.c.vert += N(cr.vert); x.c.kliks += N(cr.kliks); x.c.kosten += N(cr.kosten); x.conv += N(cr.conv); campConv[x.camp] = N(campConv[x.camp]) + N(cr.conv);
      x.c.echt += N(e.echt) * a; x.c.actie += (N(e.actie) + N(e.dialoog)) * a; x.c.aanmelding += N(e.aanmelding) * a; x.c.koop += N(e.koop) * a; x.c.waarde += N(c.waarde) * a;
      const project = projectId(c.merk || c.project || 'overig') || 'overig', landen = (i.boden || []).flatMap(q => q.landen || []).slice(0, 6).join(',');
      const eigenDoel = campDoel[medium + ':' + c.id] || '';
      if (!x.b || dag >= x.laatst) { x.laatst = dag; x.b = { id, bron: 'ad', medium, soort: 'advertentie', plek: formaatVan(c.naam || '', i.formaat), project, pagina: i.landing || '', publiek: landen, doel: eigenDoel || undefined, naam: c.naam || '', titel: cr.titel || '', tekst: cr.tekst || '', cta: cr.cta || '', beeld: /^https:\/\//.test(String(cr.beeld || '')) ? cr.beeld : '', haak: cr.ai ? cr.ai.haak : undefined, emotie: cr.ai ? cr.ai.emotie : undefined, belofte: cr.ai ? cr.ai.belofte : undefined, ouder: 'camp:' + medium + ':' + c.id, status: 'geplaatst', t: (i.gestart || dag) + 'T12:00:00Z' }; }
    }
  }
  // het netwerk telt per creative hoe vaak het doel van de campagne gehaald is (conv); meldt de campagne dat nergens, dan blijft doel leeg en telt de eigen meting naar rato van de kliks
  return Object.values(A).map(x => Object.assign(x.b, { t: (x.b.t < x.eerste ? x.b.t : x.eerste + 'T12:00:00Z'), cijfers: Object.assign(x.c, { doel: campConv[x.camp] > 0 ? x.conv : null }) }));
}
// posts en reacties uit Clickmind distributie (dist:r:<id>)
export function stukUitPost(r) {
  if (!r || !r.id) return null; const s = r.stats || {};
  return { id: 'post:' + r.id, bron: 'post', medium: mediumId(r.kanaal) || 'anders', soort: /repl|reactie|antwoord/.test(String(r.soort || '')) ? 'reactie' : 'post', plek: [r.soort, r.plek].filter(Boolean).join(' · '), project: r.project, pagina: r.doel || '', publiek: [r.taal, r.ai && r.ai.doelgroep].filter(Boolean).join(' '), doel: r.doelsoort || undefined,
    naam: r.onderwerp || '', tekst: r.tekst || '', haak: r.ai ? r.ai.haak : undefined, emotie: r.ai ? r.ai.emotie : undefined, belofte: r.ai ? r.ai.belofte : undefined, status: r.status === 'geplaatst' ? 'geplaatst' : 'concept', wie: r.wie || '', t: r.geplaatstOp || r.t,
    cijfers: { vert: N(s.imp), kliks: N(r.kliks), inzet: N(s.likes) + N(s.reacties) + N(s.delen) + (r.uitkomsten || []).reduce((t, u) => t + (u.u === 'verwijderd' || u.u === 'niets' ? 0 : N(u.n)), 0), store: N(r.store) } };
}
// video's uit Videomind (v = register, sv = standVideo)
export function stukUitVideo(v, sv) {
  if (!v || !v.id) return null; sv = sv || {};
  return { id: 'video:' + v.id, bron: 'video', medium: mediumId(v.platform) || 'anders', soort: 'video', plek: v.vorm || 'short', project: v.project, pagina: v.link || v.pagina || '', publiek: v.taal || '', doel: v.doelsoort || undefined, naam: v.onderwerp || '', titel: v.titel || '', haak: v.haak || undefined, status: v.at && Date.parse(v.at) <= Date.now() ? 'geplaatst' : 'gepland', t: v.at || v.sinds,
    cijfers: { vert: N(sv.weergaven), kliks: N(sv.bezoeken), echt: N(sv.mens), inzet: N(sv.likes) + N(sv.reacties), aanmelding: N(sv.aanmelding), koop: N(sv.koop) } };
}
// mails uit de POST-lus (post:mail:<id>): alleen onderwerpregel en uitkomst, nooit het adres; privémail blijft buiten het geheugen
export function stukUitMail(m) {
  if (!m || !m.id || m.prive || m.status !== 'verstuurd') return null;
  return { id: 'mail:' + m.id, bron: 'mail', medium: 'mail', soort: 'mail', plek: m.soort || '', project: m.project, publiek: m.taal || '', doel: 'antwoord', naam: kort(m.doel, 140), titel: m.onderwerp || '', status: 'geplaatst', wie: m.wie || '', t: m.verstuurd || m.t,
    cijfers: { verstuurd: 1, antwoord: ['antwoord', 'ja', 'nee'].includes(m.uitkomst) ? 1 : 0, kliks: m.uitkomst === 'klik' || N(m.kliks) > 0 ? 1 : 0 } };
}

// De ronde: alles inladen, oordelen, lessen en de stand bewaren. Loopt mee met bestaande crons; rem = hooguit één keer per zoveel uur.
export async function ronde({ dagen = 45, rem = 0 } = {}) {
  const vorig = await kv.get(STAND).catch(() => null);
  if (rem && vorig && Date.now() - Date.parse(vorig.t) < rem * 3600e3) return { ok: true, overgeslagen: 'laatste ronde ' + vorig.t };
  const bronnen = {}, lijst = [];
  const laad = async (naam, f) => { try { const l = (await f()).filter(Boolean); bronnen[naam] = { stukken: l.length }; lijst.push(...l); } catch (e) { bronnen[naam] = { stukken: 0, fout: String(e && e.message || e).slice(0, 140) }; } };
  await laad('advertenties', async () => {
    const perDag = []; for (let i = 0; i <= dagen; i++) { const d = dagUtc(Date.now() - i * DAG), c = await kv.get('cm:camp:' + d).catch(() => null); if (c) perDag.push({ dag: d, camps: c }); }
    const cd = Object.fromEntries(paren(await kv.raw(['HGETALL', CAMPDOEL]).catch(() => null)));
    return stukkenUitCampagnes(perDag, cd);
  });
  await laad('posts', async () => {
    const ids = (await kv.raw(['LRANGE', 'dist:lijst', '0', '2999']).catch(() => [])) || [], uit = [], grens = Date.now() - dagen * DAG;
    for (let i = 0; i < ids.length; i += 200) for (const r of await kv.mget(...ids.slice(i, i + 200).map(x => 'dist:r:' + x))) if (r && Date.parse(r.t) > grens) uit.push(stukUitPost(r));
    return uit;
  });
  await laad('videos', async () => { const VM = await import('./videomind.js'); const uit = []; for (const v of await VM.alleVideos()) uit.push(stukUitVideo(v, await VM.standVideo(v).catch(() => null))); return uit; });
  await laad('mails', async () => { const P = await import('./postlus.js'); return (await P.lijst(1500)).map(stukUitMail); });
  // schrijven: alleen wat veranderde
  let gezet = 0, nieuw = 0; const fouten = [], streng = (await kv.get(STRENG).catch(() => null)) || [];
  for (let i = 0; i < lijst.length; i += 200) {
    const deel = lijst.slice(i, i + 200), oud = await kv.mget(...deel.map(b => S + b.id)).catch(() => deel.map(() => null));
    for (let j = 0; j < deel.length; j++) { const r = await zet(deel[j], { oud: oud[j] || null, streng }).catch(e => ({ ok: false, fout: String(e.message || e) })); if (r.ok) { gezet++; if (r.nieuw) nieuw++; } else if (fouten.length < 8) fouten.push(deel[j].id + ': ' + String(r.fout).slice(0, 90)); }
  }
  const st = await stand({ vers: true, bronnen, fouten });
  return { ok: true, t: st.t, ingeladen: gezet, nieuw, bronnen, fouten, stukken: st.tel.stukken, raak: st.tel.raak, mis: st.tel.mis, zonderEigenDoel: st.tel.afgeleid };
}

// ---------- oordeel en lessen ----------
// uit = hoe vaak het doel gehaald is; basis = waar je dat tegen afzet (kliks, vertoningen, verstuurde mails of gewoon per stuk)
export function kans(st) {
  const c = st.cijfers || {}, d = st.doel.soort; let uit = 0, basis = 0, soort = 'stuk';
  // betaald: het netwerk telt per advertentie hoe vaak het doel gehaald is (c.doel); de kliks kosten geld, dus die zijn de basis.
  // onbetaald: bereik is schaars, dus een diep doel telt per vertoning als die gemeten is (zo telt mee dat een post ook de klik moet winnen).
  if (d === 'koop' || d === 'aanmelding' || d === 'echt' || d === 'actie' || d === 'store') {
    uit = st.betaald && c.doel != null && d !== 'actie' && d !== 'store' ? N(c.doel) : N(c[d]);
    if (st.betaald || !N(c.vert)) { basis = N(c.kliks); soort = 'kliks'; } else { basis = N(c.vert); soort = 'vert'; }
  }
  else if (d === 'antwoord') { uit = N(c.antwoord); basis = N(c.verstuurd); soort = 'verstuurd'; }
  else if (d === 'klik') { uit = N(c.kliks); basis = N(c.vert); soort = 'vert'; }
  else if (d === 'reactie') { uit = N(c.inzet); basis = N(c.vert); soort = 'vert'; }
  else { uit = N(c.vert); basis = 1; soort = 'stuk'; }
  if (!basis) { basis = 1; soort = 'stuk'; }
  return { uit: soort === 'stuk' ? uit : Math.min(uit, basis), basis, soort };
}
const MIN = { kliks: 60, vert: 500, verstuurd: 9999, stuk: 9999 }; // zoveel basis nodig voor een oordeel over één stuk
const PER = { kliks: [100, 'per 100 kliks'], vert: [1000, 'per 1.000 vertoningen'], verstuurd: [100, 'per 100 mails'], stuk: [1, 'per stuk'] };
export function wilson(s, n, z = 1.64) { if (!n) return [0, 1]; s = Math.min(s, n); const p = s / n, d = 1 + z * z / n, c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)]; }
const groepKey = st => st.medium + '|' + st.doel.soort;

// oordeel per stuk tegen soortgenoten (zelfde medium en doel; binnen het project als daar 8 of meer stukken met cijfers zijn)
export function oordelen(stukken) {
  const G = {};
  for (const st of stukken) { if (st.status !== 'geplaatst') continue; const k = kans(st); st._k = k; (G[groepKey(st) + '|' + k.soort] || (G[groepKey(st) + '|' + k.soort] = [])).push(st); }
  for (const st of stukken) {
    const k = st._k; if (!k) { st.oordeel = { uitslag: st.status === 'geplaatst' ? 'open' : 'niet geplaatst' }; continue; }
    const alleG = G[groepKey(st) + '|' + k.soort] || [], eigen = alleG.filter(x => x.voor.project === st.voor.project && x._k.basis >= (MIN[k.soort] || 1));
    const peers = eigen.length >= 8 ? eigen : alleG.filter(x => x._k.basis >= (MIN[k.soort] || 1));
    const [per, eenheid] = PER[k.soort];
    if (k.soort === 'stuk' || k.soort === 'verstuurd') { st.oordeel = { uitslag: 'telt mee in lessen', waarom: k.soort === 'verstuurd' ? 'één mail is te weinig voor een oordeel; de lessen tellen alle mails samen' : 'geen kliks of vertoningen gemeten om tegen af te zetten' }; continue; }
    if (k.basis < MIN[k.soort]) { st.oordeel = { uitslag: Date.now() - Date.parse(st.t) < 3 * DAG ? 'open' : 'te weinig cijfers', waarom: Math.round(k.basis) + ' ' + (k.soort === 'vert' ? 'vertoningen' : 'kliks') + ', nodig ' + MIN[k.soort] }; continue; }
    if (peers.length < 4) { st.oordeel = { uitslag: 'geen vergelijk', waarom: 'minder dan 4 soortgenoten met genoeg cijfers' }; continue; }
    const tu = peers.reduce((s, x) => s + x._k.uit, 0), tb = peers.reduce((s, x) => s + x._k.basis, 0), gem = tb ? tu / tb : 0, [lo, hi] = wilson(k.uit, k.basis);
    const eigenPer = r1(per * k.uit / k.basis), gemPer = r1(per * gem);
    st.oordeel = { uitslag: lo > gem ? 'raak' : hi < gem ? 'mis' : 'gemiddeld', waarom: kom(eigenPer) + ' ' + DOEL_MV[st.doel.soort] + ' ' + eenheid + ' tegen ' + kom(gemPer) + ' gemiddeld (' + peers.length + ' soortgenoten' + (eigen.length >= 8 ? ' in dit project' : ', alle projecten') + ')', per: eigenPer, gem: gemPer };
  }
  for (const st of stukken) delete st._k;
  return stukken;
}

// kenmerken waarop geleerd wordt
const KENMERKEN = [
  ['haak', st => st.inhoud.haak], ['emotie', st => st.inhoud.emotie], ['opening', st => st.inhoud.vorm && st.inhoud.vorm.opening], ['vraag in de tekst', st => st.inhoud.vorm && st.inhoud.vorm.vraag],
  ['getal in de tekst', st => st.inhoud.vorm && st.inhoud.vorm.getal], ['wie spreekt', st => st.inhoud.vorm && st.inhoud.vorm.spreker], ['lengte', st => st.inhoud.vorm && st.inhoud.vorm.lengte],
  ['prijs in de tekst', st => st.inhoud.vorm && st.inhoud.vorm.prijs], ['emoji', st => st.inhoud.vorm && st.inhoud.vorm.emoji], ['knoptekst', st => st.betaald ? (st.inhoud.cta ? 'met knoptekst' : 'zonder knoptekst') : ''],
  ['vorm of plek', st => st.plek], ['taal of publiek', st => st.voor.publiek]
];
// lessen voor een verzameling stukken met hetzelfde doel: per kenmerk en waarde de kans tegen het gemiddelde van de verzameling
export function lessenVan(stukken) {
  const l = stukken.filter(st => st.status === 'geplaatst'); if (!l.length) return { basis: null, lessen: [], stukken: 0 };
  for (const st of l) st._k = kans(st);
  // de basis die het meeste gewicht heeft in deze verzameling (kliks voor diepe doelen, vertoningen voor bereik); stukken met een andere basis doen niet mee
  const aant = {}; for (const st of l) aant[st._k.soort] = (aant[st._k.soort] || 0) + 1; const soort = Object.entries(aant).sort((a, b) => b[1] - a[1])[0][0];
  const mee = l.filter(st => st._k.soort === soort), tu = mee.reduce((s, x) => s + x._k.uit, 0), tb = mee.reduce((s, x) => s + x._k.basis, 0), gem = tb ? tu / tb : 0, [per, eenheid] = PER[soort];
  const uit = [];
  for (const [naam, f] of KENMERKEN) {
    const W = {}; for (const st of mee) { const w = String(f(st) || '').trim(); if (!w || w === '-' || w === 'anders') continue; const g = W[w] || (W[w] = { u: 0, b: 0, n: 0 }); g.u += st._k.uit; g.b += st._k.basis; g.n++; }
    if (Object.keys(W).length < 2) continue;
    for (const [w, g] of Object.entries(W)) {
      const kansW = g.b ? g.u / g.b : 0; let oordeel = 'onbeslist';
      if (soort === 'stuk') { if (g.n >= 5 && gem > 0) oordeel = kansW >= 1.5 * gem ? 'werkt' : kansW <= 0.5 * gem ? 'werkt niet' : 'onbeslist'; }
      else if (g.n >= 3 && g.b >= (soort === 'verstuurd' ? 10 : MIN[soort])) { const [lo, hi] = wilson(g.u, g.b); oordeel = lo > gem ? 'werkt' : hi < gem ? 'werkt niet' : 'onbeslist'; }
      uit.push({ kenmerk: naam, waarde: w, stukken: g.n, per: r1(per * kansW), gem: r1(per * gem), eenheid, basis: Math.round(g.b), oordeel, verschil: gem ? Math.round(100 * (kansW / gem - 1)) : null });
    }
  }
  for (const st of l) delete st._k;
  uit.sort((a, b) => (a.oordeel === 'onbeslist') - (b.oordeel === 'onbeslist') || Math.abs(N(b.verschil)) - Math.abs(N(a.verschil)));
  return { basis: { soort, eenheid, gem: r1(per * gem), uit: Math.round(tu), basis: Math.round(tb) }, lessen: uit, stukken: mee.length };
}
const kom = x => String(x).replace('.', ',');
const lesZin = l => l.kenmerk + ' "' + l.waarde + '": ' + kom(l.per) + ' tegen ' + kom(l.gem) + ' gemiddeld' + (l.eenheid ? ' ' + l.eenheid : '') + ' (' + l.stukken + ' stukken' + (l.verschil != null ? ', ' + (l.verschil >= 0 ? '+' : '') + l.verschil + '%' : '') + ')';

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
const stukRegel = st => '[' + ((st.oordeel && st.oordeel.uitslag) || 'open') + '] ' + st.dag + ' ' + kort([st.inhoud.titel, st.inhoud.tekst].filter(Boolean).join(' / ') || st.naam, 150) + (st.inhoud.haak ? ' (haak ' + st.inhoud.haak + ')' : '') + (st.oordeel && st.oordeel.waarom ? ' | ' + st.oordeel.waarom : '');
export async function briefing({ medium, project, doel, dagen = 90 } = {}) {
  medium = mediumId(medium); project = projectId(project); if (!medium || !project) return { ok: false, fout: 'geef medium en project: ?op=briefing&medium=<' + Object.keys(MEDIA).join('|') + '>&project=<id>[&doel=<' + Object.keys(DOELEN).join('|') + '>]' };
  doel = doelId(doel) || standaardDoel(project, medium, '');
  const stukken = oordelen(await alle({ dagen })), zelfdeDoel = stukken.filter(s => s.doel.soort === doel);
  const hier = zelfdeDoel.filter(s => s.medium === medium && s.voor.project === project), mediumBreed = zelfdeDoel.filter(s => s.medium === medium), soortBreed = zelfdeDoel.filter(s => s.medium !== medium);
  const Lh = lessenVan(hier), Lm = lessenVan(mediumBreed), Ls = lessenVan(soortBreed);
  const getest = new Set(Lh.lessen.filter(l => l.stukken >= 3).map(l => l.kenmerk + '|' + l.waarde));
  const elders = [...Lm.lessen.filter(l => l.oordeel === 'werkt').map(l => ({ ...l, waar: 'alle projecten op ' + MEDIA[medium].naam })), ...Ls.lessen.filter(l => l.oordeel === 'werkt').map(l => ({ ...l, waar: 'andere media, zelfde doel' }))].filter(l => !getest.has(l.kenmerk + '|' + l.waarde) && !/vorm of plek|taal of publiek/.test(l.kenmerk) && Math.abs(N(l.verschil)) >= 25).slice(0, 8);
  const nietElders = [...Lm.lessen.filter(l => l.oordeel === 'werkt niet').map(l => ({ ...l, waar: 'alle projecten op ' + MEDIA[medium].naam }))].filter(l => !getest.has(l.kenmerk + '|' + l.waarde) && Math.abs(N(l.verschil)) >= 25).slice(0, 5);
  const metOordeel = hier.filter(s => s.oordeel && (s.oordeel.uitslag === 'raak' || s.oordeel.uitslag === 'mis' || s.oordeel.uitslag === 'gemiddeld'));
  const best = metOordeel.filter(s => s.oordeel.uitslag === 'raak').sort((a, b) => N(b.oordeel.per) - N(a.oordeel.per)).slice(0, 4), slecht = metOordeel.filter(s => s.oordeel.uitslag === 'mis').sort((a, b) => N(a.oordeel.per) - N(b.oordeel.per)).slice(0, 4);
  const laatste = [...hier].sort((a, b) => b.t.localeCompare(a.t)).slice(0, 12);
  const R = await research({ medium, project, doel, lessen: [...Lh.lessen, ...Lm.lessen] });
  const alleHaken = [...new Set(stukken.filter(s => s.medium === medium || (MEDIA[s.medium] || {}).betaald === (MEDIA[medium] || {}).betaald).map(s => s.inhoud.haak).filter(h => h && h !== '-' && h !== 'anders'))];
  const gebruikt = new Set(hier.map(s => s.inhoud.haak)), nietGeprobeerd = alleHaken.filter(h => !gebruikt.has(h)).slice(0, 8);
  const poort = poortVan(stukken).filter(p => p.project === project).slice(0, 4);
  const uit = { ok: true, medium, mediumNaam: MEDIA[medium].naam, project, doel, doelNaam: DOELEN[doel], t: new Date().toISOString(), stukkenHier: hier.length, basis: Lh.basis,
    vast: R.vast, werkt: Lh.lessen.filter(l => l.oordeel === 'werkt').slice(0, 8), werktNiet: Lh.lessen.filter(l => l.oordeel === 'werkt niet').slice(0, 8), onbeslist: Lh.lessen.filter(l => l.oordeel === 'onbeslist' && l.stukken >= 2).slice(0, 6),
    best, slecht, laatste, elders, nietElders, research: R.start, video: R.video, buiten: R.buiten, nietGeprobeerd, poort };
  uit.tekst = briefingTekst(uit); return uit;
}
export function briefingTekst(b) {
  const L = ['BRIEFING ' + b.mediumNaam + ' · ' + b.project + ' · doel: ' + b.doelNaam, 'Lees dit vóór je iets maakt. Eigen cijfers gaan voor research; research is alleen een voorsprong. Stand ' + b.t.slice(0, 16).replace('T', ' ') + ' UTC, ' + b.stukkenHier + ' eerdere stukken op dit medium voor dit project met dit doel' + (b.basis ? ', gemiddeld ' + kom(b.basis.gem) + ' ' + DOEL_MV[b.doel] + ' ' + b.basis.eenheid : '') + '.', ''];
  const blok = (kop, regels) => { if (regels.length) { L.push(kop); for (const r of regels) L.push('- ' + r); L.push(''); } };
  blok('VASTE REGELS (altijd)', b.vast.map(v => v.les + ' [' + kort(v.bron, 110) + ']'));
  blok('WERKT HIER (eigen cijfers, aantoonbaar beter dan gemiddeld)', b.werkt.map(l => lesZin(l)));
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
  blok('LET OP: BESTEMMING ZONDER UITKOMST', b.poort.map(p => p.pagina + ': ' + p.kliks + ' kliks, ' + p.uitkomsten + ' aanmeldingen of verkopen. ' + p.advies));
  blok('LAATSTE STUKKEN HIER (herhaal niet wat er al staat)', b.laatste.map(stukRegel));
  L.push('MELD JE STUK (verplicht, in dezelfde beurt): ' + HOST + '/api/mm?op=stuk&j={"medium":"' + b.medium + '","project":"' + b.project + '","doel":"' + b.doel + '","titel":"...","tekst":"...","haak":"...","pagina":"https://...","plek":"...","publiek":"..."}',
    'Posts met een korte link gaan via op=distmaak (geef doelsoort=' + b.doel + ' mee), video\'s via Videomind, mail via de POST-lus: die komen vanzelf in het geheugen. Het doel van een campagne zet je vast met ?op=stuk&campagne=<netwerk>:<id>&doel=' + b.doel + '.',
    'Alle stukken en lessen: ' + HOST + '/api/mm?op=stukken');
  return L.join('\n');
}

// ---------- uitkomstpoort: bestemmingen waar veel kliks heen gaan en niets uit komt ----------
export function poortVan(stukken) {
  const P = {};
  for (const st of stukken) { if (!st.betaald || !st.voor.pagina || !st.cijfers) continue; if (st.doel.soort !== 'koop' && st.doel.soort !== 'aanmelding') continue;
    const k = st.voor.project + '|' + st.voor.pagina, p = P[k] || (P[k] = { project: st.voor.project, pagina: st.voor.pagina, kliks: 0, kosten: 0, uitkomsten: 0, stukken: 0 });
    p.kliks += N(st.cijfers.kliks); p.kosten += N(st.cijfers.kosten); p.uitkomsten += Math.max(N(st.cijfers.doel), N(st.cijfers.aanmelding) + N(st.cijfers.koop)); p.stukken++; }
  return Object.values(P).filter(p => p.kliks >= 300 && p.uitkomsten < 1).map(p => ({ ...p, kliks: Math.round(p.kliks), kosten: r2(p.kosten), uitkomsten: 0, advies: 'Eerst een aanmelding of gemeten verkoop op deze pagina, dan pas nieuw verkeer.' })).sort((a, b) => b.kliks - a.kliks);
}

// ---------- stand: het geheugen in één overzicht ----------
export async function stand({ vers = false, bronnen = null, fouten = null, dagen = 90 } = {}) {
  if (!vers) { const s = await kv.get(STAND).catch(() => null); if (s) return s; }
  const stukken = oordelen(await alle({ dagen })), tel = { stukken: stukken.length, raak: 0, mis: 0, gemiddeld: 0, open: 0, afgeleid: 0, regel: 0 };
  const perMedium = {}, perProject = {}, perBron = {}, tegenRegel = [];
  for (const st of stukken) {
    const u = (st.oordeel || {}).uitslag; if (u === 'raak') tel.raak++; else if (u === 'mis') tel.mis++; else if (u === 'gemiddeld') tel.gemiddeld++; else tel.open++;
    if (st.doel.afgeleid) tel.afgeleid++;
    const rc = regelCheck(st); if (rc.length && st.status === 'geplaatst') { tel.regel++; if (tegenRegel.length < 12) tegenRegel.push({ id: st.id, project: st.voor.project, medium: st.medium, tekst: kort([st.inhoud.titel, st.inhoud.tekst].filter(Boolean).join(' / '), 120), regel: rc.join(', '), naam: kort(st.naam, 70) }); }
    for (const [o, k] of [[perMedium, st.medium], [perProject, st.voor.project], [perBron, st.bron]]) { const g = o[k] || (o[k] = { stukken: 0, raak: 0, mis: 0, afgeleid: 0 }); g.stukken++; if (u === 'raak') g.raak++; if (u === 'mis') g.mis++; if (st.doel.afgeleid) g.afgeleid++; }
  }
  // lessen per medium en doel met genoeg stukken; alleen wat aantoonbaar werkt of niet werkt
  const G = {}; for (const st of stukken) (G[groepKey(st)] || (G[groepKey(st)] = [])).push(st);
  const lessen = [], briefings = [];
  for (const [k, l] of Object.entries(G)) { const [m, d] = k.split('|'), L = lessenVan(l); for (const x of L.lessen.filter(x => x.oordeel !== 'onbeslist').slice(0, 6)) lessen.push({ medium: m, doel: d, ...x }); }
  const combi = {}; for (const st of stukken) { const k = st.voor.project + '|' + st.medium + '|' + st.doel.soort; combi[k] = (combi[k] || 0) + 1; }
  for (const [k, n] of Object.entries(combi).sort((a, b) => b[1] - a[1]).slice(0, 40)) { const [p, m, d] = k.split('|'); briefings.push({ project: p, medium: m, doel: d, stukken: n, url: HOST + '/api/mm?op=briefing&medium=' + m + '&project=' + p + '&doel=' + d + '&vorm=tekst' }); }
  const toon = st => ({ id: st.id, project: st.voor.project, medium: st.medium, doel: st.doel.soort, dag: st.dag, tekst: kort([st.inhoud.titel, st.inhoud.tekst].filter(Boolean).join(' / ') || st.naam, 140), haak: st.inhoud.haak, waarom: st.oordeel.waarom, per: st.oordeel.per });
  const s = { t: new Date().toISOString(), dagen, tel, perMedium, perProject, perBron, lessen: lessen.sort((a, b) => Math.abs(N(b.verschil)) - Math.abs(N(a.verschil))).slice(0, 40),
    raak: stukken.filter(st => st.oordeel.uitslag === 'raak').sort((a, b) => N(b.oordeel.per) / (N(b.oordeel.gem) || 1) - N(a.oordeel.per) / (N(a.oordeel.gem) || 1)).slice(0, 15).map(toon),
    mis: stukken.filter(st => st.oordeel.uitslag === 'mis').sort((a, b) => N(b.cijfers && b.cijfers.kosten) - N(a.cijfers && a.cijfers.kosten)).slice(0, 15).map(toon),
    tegenRegel, poort: poortVan(stukken).slice(0, 10), briefings, bronnen: bronnen || ((await kv.get(STAND).catch(() => null)) || {}).bronnen || null, fouten: fouten || [], priors: priors().length,
    ontbreekt: ['Pins van de boeken en van de Kadoly-gids (lopen nog niet via Clickmind distributie)', 'Teksten van de lerende modal en de paginaproeven (leren al zelf, staan nog niet als stuk in dit geheugen)', 'Mailmind-stromen in aantallen (de losse mails van de POST-lus staan er wel in)', 'Echte mensen en aanmeldingen per post (nu: kliks via de korte link, vertoningen, likes en store-tikken)'] };
  await kv.set(STAND, s, { ex: 14 * 86400 }).catch(() => {});
  return s;
}
const nl = n => String(Math.round(N(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export function standTekst(s) {
  const L = ['GEHEUGEN VAN CLICKMIND: alles wat de deur uit ging, laatste ' + s.dagen + ' dagen (ronde ' + s.t.slice(0, 16).replace('T', ' ') + ' UTC)',
    nl(s.tel.stukken) + ' stukken met paspoort (medium, waarvoor, doel). ' + s.tel.raak + ' raak, ' + s.tel.mis + ' mis, ' + s.tel.gemiddeld + ' gemiddeld, ' + nl(s.tel.open) + ' nog zonder oordeel. ' + nl(s.tel.afgeleid) + ' kregen het doel van hun project omdat de maker er geen opgaf.', ''];
  L.push('PER MEDIUM'); for (const [m, g] of Object.entries(s.perMedium).sort((a, b) => b[1].stukken - a[1].stukken)) L.push('- ' + ((MEDIA[m] || {}).naam || m) + ': ' + g.stukken + ' stukken, ' + g.raak + ' raak, ' + g.mis + ' mis');
  L.push('', 'PER PROJECT'); for (const [p, g] of Object.entries(s.perProject).sort((a, b) => b[1].stukken - a[1].stukken)) L.push('- ' + p + ': ' + g.stukken + ' stukken, ' + g.raak + ' raak, ' + g.mis + ' mis');
  if (s.lessen.length) { L.push('', 'WAT AANTOONBAAR WERKT OF NIET WERKT'); for (const l of s.lessen.slice(0, 25)) L.push('- ' + ((MEDIA[l.medium] || {}).naam || l.medium) + ', doel ' + l.doel + ': ' + (l.oordeel === 'werkt' ? 'WERKT ' : 'WERKT NIET ') + lesZin(l)); }
  if (s.raak.length) { L.push('', 'RAAK'); for (const x of s.raak.slice(0, 10)) L.push('- ' + x.project + ' · ' + x.medium + ': ' + x.tekst + ' | ' + x.waarom); }
  if (s.mis.length) { L.push('', 'MIS'); for (const x of s.mis.slice(0, 10)) L.push('- ' + x.project + ' · ' + x.medium + ': ' + x.tekst + ' | ' + x.waarom); }
  if (s.tegenRegel.length) { L.push('', 'TEGEN EEN VASTE REGEL (' + s.tel.regel + ')'); for (const x of s.tegenRegel) L.push('- ' + x.project + ' · ' + x.medium + ': ' + x.tekst + ' | ' + x.regel); }
  if (s.poort.length) { L.push('', 'BESTEMMINGEN ZONDER UITKOMST'); for (const p of s.poort) L.push('- ' + p.project + ' · ' + p.pagina + ': ' + nl(p.kliks) + ' kliks, $' + kom(p.kosten) + ', geen aanmelding of verkoop'); }
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
  const sec = (kop, inh) => inh ? '<section><h2>' + kop + '</h2>' + inh + '</section>' : '';
  const groep = o => lijst(Object.entries(o).sort((a, b) => b[1].stukken - a[1].stukken).map(([k, g]) => r(nl(g.stukken), esc(MEDIA[k] ? mn(k) : k) + (g.raak || g.mis ? '<br>' + g.raak + ' raak, ' + g.mis + ' mis' : ''))));
  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex"><title>Geheugen van Clickmind</title><link rel="alternate" type="text/plain" href="?op=stukken&vorm=tekst">'
    + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"><style>' + CSS + '</style></head><body><div class="w"><header><a class="merk" href="/dashboard">Dashboard</a><span class="meta">Geheugen</span></header>'
    + '<section class="tool"><h1>' + nl(s.tel.stukken) + ' stukken in één geheugen</h1><p>Alles wat de deur uit ging in ' + s.dagen + ' dagen: advertenties, posts, video\'s en mails. Elk stuk heeft een paspoort: op welk medium, waarvoor en met welk doel.</p>'
    + '<p>' + s.tel.raak + ' raak, ' + s.tel.mis + ' mis, ' + s.tel.gemiddeld + ' gemiddeld. ' + (s.tel.afgeleid ? nl(s.tel.afgeleid) + ' stukken kregen het doel van hun project, omdat de maker er geen opgaf.' : 'Elk stuk heeft een eigen doel.') + '</p>'
    + (oud ? '<p><b>Let op: de laatste ronde is van ' + esc(s.t.slice(0, 16).replace('T', ' ')) + ' UTC.</b></p>' : '') + '</section>'
    + sec('Wat werkt en wat niet', lijst(s.lessen.slice(0, 16).map(l => r(l.oordeel === 'werkt' ? 'Werkt' : 'Niet', esc(mn(l.medium) + ', doel ' + l.doel) + '<br>' + esc(lesZin(l))))))
    + sec('Raak', lijst(s.raak.slice(0, 10).map(x => r(esc(kom(x.per)), esc(x.tekst) + '<br>' + esc(x.project + ' · ' + mn(x.medium) + ' · ' + x.waarom)))))
    + sec('Mis', lijst(s.mis.slice(0, 10).map(x => r(esc(kom(x.per)), esc(x.tekst) + '<br>' + esc(x.project + ' · ' + mn(x.medium) + ' · ' + x.waarom)))))
    + sec('Tegen een vaste regel', lijst(s.tegenRegel.map(x => r('Regel', esc(x.tekst) + '<br>' + esc(x.project + ' · ' + mn(x.medium) + ' · ' + x.regel)))))
    + sec('Bestemmingen zonder uitkomst', lijst(s.poort.map(p => r(nl(p.kliks), esc(p.pagina) + '<br>' + esc(p.project + ' · $' + kom(p.kosten) + ' · geen aanmelding of verkoop')))))
    + sec('Per medium', groep(s.perMedium)) + sec('Per project', groep(s.perProject))
    + sec('Briefing vóór je iets maakt', lijst(s.briefings.slice(0, 20).map(b => r(nl(b.stukken), '<a href="' + esc(b.url) + '">' + esc(b.project + ' · ' + mn(b.medium) + ' · ' + b.doel) + '</a>'))))
    + sec('Nog niet in het geheugen', lijst(s.ontbreekt.map(x => r('', esc(x)))))
    + '<footer><p>Ronde ' + esc(s.t.slice(0, 16).replace('T', ' ')) + ' UTC. Voor chats: <a href="?op=stukken&vorm=tekst">geheugen als tekst</a>.</p></footer></div></body></html>';
}
// korte regel voor het dashboard (project clickmind) en voor de overdracht
export async function dashBlok() {
  const s = await kv.get(STAND).catch(() => null); if (!s) return null;
  const w = s.lessen.find(l => l.oordeel === 'werkt');
  return { t: s.t, regels: ['Geheugen: ' + nl(s.tel.stukken) + ' stukken met paspoort, ' + s.tel.raak + ' raak, ' + s.tel.mis + ' mis' + (s.tel.afgeleid ? ', ' + nl(s.tel.afgeleid) + ' zonder eigen doel' : '') + '.', ...(w ? ['Sterkste les: ' + ((MEDIA[w.medium] || {}).naam || w.medium) + ', doel ' + w.doel + ', ' + lesZin(w) + '.'] : []), ...(s.poort.length ? [s.poort.length + ' bestemmingen zonder uitkomst, grootste: ' + s.poort[0].pagina + ' (' + nl(s.poort[0].kliks) + ' kliks).'] : [])],
    oud: Date.now() - Date.parse(s.t) > 26 * 3600e3, url: HOST + '/api/mm?op=stukken' };
}
export async function zetStreng(lijst) { const l = String(lijst || '').split(',').map(x => x.trim().toLowerCase()).filter(x => ['post', 'video', 'ad', 'mail', 'hand'].includes(x)); await kv.set(STRENG, l); return { ok: true, streng: ['hand', ...l.filter(x => x !== 'hand')] }; }
