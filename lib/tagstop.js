// Clickmind grijpt in op de campagnes (Henkjan 18 okt 2026: "Zet uit en stop geleerde in clickmind. Kan CM niet
// proactief naar de campagne sturen want dit is niet goed en kost geld").
//
// Waarom dit er is. Clickmind mat de Amazon-blanket wel (lib/amzmeter.js: betaalde kliks tegen getelde kliks per tag,
// lib/termles.js: tagGeenKoper), maar deed er niets mee: de blanket viel expres buiten de stopregel van de
// PropellerAds-lus (lib/stopregel.ts: "Geldt voor ELKE campagne die geen Amazon-blanket is"), omdat Amazon geen
// conversie terugmeldt. Gevolg op 18 okt: bl-t20-20 (905 Amazon-kliks), bl-t09-20 (409) en luxury08c2-20 (274) liepen
// een halve dag door met nul artikelen terwijl bl-t14-20 op 2,55% stond. Dat is ongeveer $6 per halve dag die naar
// tags gaat waarvan Clickmind al wist dat ze niet verkopen.
//
// Wat het nu doet. Deze module maakt elke dag een VOORSTEL in mm:tagstop:<net>, precies zoals het zonevoorstel in
// mm:blok:<net>. De PropellerAds-lus leest dat elk uur (app/api/clickmind/route.ts) en zet de campagnes stil. Zo blijft
// de PropellerAds-sleutel in zijn eigen project en beslist Clickmind alleen.
//
// Grenzen (Henkjan 16 okt: "niet absolute bedragen maar relatieve"; 17 okt: "Campagne moet altijd optimaliseren op profit"):
//  - Alleen hele dagen. Een halve dag is geen oordeel: Amazon telt in Amerikaanse tijd en kopers komen 's avonds.
//  - Alleen tags met genoeg kliks (minKliks). Amazon verbergt kleine aantallen; onder die grens is nul geen bewijs.
//  - Het oordeel is relatief: elke tag wordt gelegd naast de middelste VERKOPENDE tag van dezelfde markt (ijk).
//  - De beste tag van een markt gaat nooit uit, en nooit meer dan maxPerRonde campagnes per ronde.
//  - Henkjan kan een tag vrijgeven (mm:instelling.tagOk) en het geheel uitzetten (mm:instelling.tagstop = false).
// Alles wat de lus uitvoert komt terug in mm:tagstopgedaan via /api/mm/blokgedaan?soort=tag.

import { TAG_ALIAS } from './mensmeter.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const COMMISSIE = { '-20': 0.03, '-21': 0.045 }; // zelfde schatting als lib/amzmeter.js tot de verdiensten binnen zijn
const tagIn = (naam, tag) => new RegExp('(^|[^a-z0-9-])' + String(tag).replace(/[^a-z0-9-]/gi, '') + '($|[^a-z0-9-])', 'i').test(String(naam || ''));
// Amazon US rekent in Amerikaanse tijd; "vandaag" is daarom de Pacific-dag.
const dagPT = (n = 0) => new Date(Date.now() - 7 * 3600e3 + n * 864e5).toISOString().slice(0, 10);
// Markt van een tag. Het achtervoegsel alleen is niet genoeg: -21 is zowel DE als UK, en die converteren heel anders
// (18 okt: DE 0,54% tegen US 1,51%). De dagtaak schrijft daarom per rij een markt mee; het achtervoegsel is de terugval.
const markt = (tag, rij) => String((rij && rij.markt) || '').toLowerCase() || (String(tag).slice(-3) === '-21' ? 'eu' : 'us');

export const TAGREGELS = {
  dagen: 3,          // hele dagen die meetellen
  minKliks: 1500,    // Amazon-kliks in dat venster voordat een tag een oordeel krijgt (zelfde grens als termles)
  maxConversie: 0.3, // % artikelen per Amazon-klik; daaronder verkoopt de tag niet
  zwakDeel: 0.35,    // verdient per Amazon-klik minder dan dit deel van de middelste verkopende tag
  minIjkTags: 2,     // zoveel verkopende tags zijn nodig voor een ijk; anders alleen de harde regel
  maxPerRonde: 25,   // hoogstens zoveel campagnes per ronde stilzetten
  instortKliks: 900, // instorting binnen de dag: zoveel Amazon-kliks vandaag
  instortConv: 0.5,  // ... bij een tag die in het venster nog minstens zo goed converteerde, en vandaag nul artikelen
};
// Waarom een instorting binnen de dag telt en een gewone nul niet (18 okt 2026): bl-t20-20 deed op 16 okt 0,99% en
// verdiende 2,5x terug; op 18 okt stond hij op 905 Amazon-kliks en nul artikelen. De kans daarop bij 0,99% is ongeveer
// 1 op 10.000, dus dat is geen toeval maar een kapotte dag (verkeerde zoektermen, nieuwe zones, verkeerde link).
// Wachten op een hele dag kost dan een dag geld; daarom grijpt de regel hier wel binnen de dag in. Onder instortKliks
// blijft het wachten op hele dagen, want Amazon verbergt kleine aantallen.

async function amzDag(kv, d) {
  const o = {};
  try { const h = await kv.raw(['HGETALL', 'mm:amz:' + d]); for (let i = 0; h && i < h.length; i += 2) { try { o[h[i]] = JSON.parse(h[i + 1]); } catch (e) {} } } catch (e) {}
  return o;
}

// Kliks en kosten per campagne van vandaag, via de PropellerAds-lus (die heeft de sleutel; hier staat hij niet).
async function paVandaag(dag) {
  const s = process.env.SHOP_SLEUTEL || '';
  if (!s) return { fout: 'SHOP_SLEUTEL ontbreekt', rijen: [] };
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 25000);
  try {
    const r = await fetch((process.env.PA_LUS_URL || 'https://propellerads-mcp.vercel.app') + '/api/statistiek', {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-shop-sleutel': s },
      body: JSON.stringify({ perCampagne: true, dag, tz: '-0700' }), signal: ac.signal,
    });
    const j = await r.json().catch(() => ({}));
    return j && j.ok ? { rijen: j.rijen || [] } : { fout: String((j && j.fout) || 'HTTP ' + r.status).slice(0, 120), rijen: [] };
  } catch (e) { return { fout: String(e && e.message || e).slice(0, 120), rijen: [] }; } finally { clearTimeout(t); }
}

// Wat de Associates-meter over hele dagen zegt, per tag.
export async function tagCijfers(kv, { dagen = TAGREGELS.dagen, tot = null } = {}) {
  const eind = /^\d{4}-\d{2}-\d{2}$/.test(String(tot || '')) ? String(tot) : dagPT(-1);
  const D = Array.from({ length: Math.max(1, Math.min(14, dagen)) }, (_, i) => new Date(Date.parse(eind + 'T00:00:00Z') - i * 864e5).toISOString().slice(0, 10));
  const hs = await Promise.all(D.map(d => amzDag(kv, d)));
  const T = {};
  hs.forEach((h, i) => {
    for (const [tag, x] of Object.entries(h)) {
      const t = T[tag] || (T[tag] = { tag, markt: markt(tag, x), dagen: 0, kliks: 0, artikelen: 0, omzet: 0, verdiend: 0, laatsteDag: null });
      if (x && x.markt) t.markt = String(x.markt).toLowerCase(); // de nieuwste dag met een markt wint
      t.dagen++; t.kliks += N(x.kliks); t.artikelen += N(x.artikelen); t.omzet += N(x.omzet); t.verdiend += N(x.verdiend);
      if (!t.laatsteDag) t.laatsteDag = D[i];
    }
  });
  for (const t of Object.values(T)) {
    const tarief = COMMISSIE[t.tag.slice(-3)] || 0.03;
    t.opbrengst = Math.round((t.verdiend || t.omzet * tarief) * 100) / 100;
    t.conversie = t.kliks ? Math.round(10000 * t.artikelen / t.kliks) / 100 : null;
    t.perKlik = t.kliks ? Math.round(100000 * t.opbrengst / t.kliks) / 100000 : null;
  }
  return { venster: { van: D[D.length - 1], tot: eind, dagen: D.length }, tags: Object.values(T).sort((a, b) => b.kliks - a.kliks) };
}

const mediaan = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

// Het oordeel per tag, relatief aan de middelste verkopende tag van dezelfde markt.
export function tagOordeel(tags, { vrij = [], vandaag = {} } = {}) {
  const R = TAGREGELS, vrijSet = new Set(vrij.map(x => String(x).toLowerCase()));
  const ijk = {}, beste = {};
  for (const m of [...new Set(tags.map(t => t.markt))]) {
    const verkopers = tags.filter(t => t.markt === m && t.artikelen > 0 && t.kliks >= 200 && t.perKlik != null);
    ijk[m] = verkopers.length >= R.minIjkTags ? mediaan(verkopers.map(t => t.perKlik)) : null;
    beste[m] = verkopers.length ? verkopers.reduce((a, b) => (b.perKlik > a.perKlik ? b : a)).tag : null;
  }
  return tags.map(t => {
    const i = ijk[t.markt], o = { ...t, ijkPerKlik: i, besteVanMarkt: beste[t.markt] === t.tag };
    if (vrijSet.has(t.tag.toLowerCase())) return { ...o, oordeel: 'vrijgegeven door Henkjan', stop: false };
    // instorting binnen de dag: een tag die het wel kon, maar vandaag niets verkoopt op veel kliks
    const nu = vandaag[t.tag];
    if (nu && N(nu.kliks) >= R.instortKliks && !N(nu.artikelen) && t.conversie != null && t.conversie >= R.instortConv) {
      return { ...o, vandaag: { kliks: N(nu.kliks), artikelen: N(nu.artikelen) }, stop: true, oordeel: 'ingestort vandaag: ' + N(nu.kliks) + ' Amazon-kliks en nul artikelen, terwijl deze tag in ' + t.dagen + ' dag(en) nog ' + t.conversie + '% deed' };
    }
    if (t.kliks < R.minKliks) return { ...o, oordeel: 'te weinig kliks voor een oordeel (' + t.kliks + ' van ' + R.minKliks + ')', stop: false };
    if (o.besteVanMarkt) return { ...o, oordeel: 'beste tag van deze markt', stop: false };
    if (t.conversie != null && t.conversie < R.maxConversie) {
      return { ...o, stop: true, oordeel: 'verkoopt niet: ' + t.kliks + ' Amazon-kliks in ' + t.dagen + ' dag(en) en ' + t.artikelen + ' artikelen (' + t.conversie + '%, grens ' + R.maxConversie + '%)' };
    }
    if (i && t.perKlik != null && t.perKlik < R.zwakDeel * i) {
      return { ...o, stop: true, oordeel: 'brengt $' + t.perKlik.toFixed(4) + ' per Amazon-klik op, minder dan ' + Math.round(R.zwakDeel * 100) + '% van de middelste verkopende tag ($' + i.toFixed(4) + ')' };
    }
    return { ...o, oordeel: 'verdient zich terug', stop: false };
  });
}

// Eén ronde: cijfers lezen, oordelen, en het voorstel klaarzetten voor de PropellerAds-lus.
export async function tagRonde(kv, { net = 'propeller', droog = false, dagen = TAGREGELS.dagen, paRijen = null, moRijen = null } = {}) {
  const inst = (await kv.get('mm:instelling').catch(() => null)) || {};
  const aan = inst.tagstop !== false; // Henkjan vroeg er zelf om (18 okt); uitzetten kan met mm:instelling.tagstop = false
  const { venster, tags } = await tagCijfers(kv, { dagen });
  const vandaag = await amzDag(kv, dagPT()); // tussenstand van vandaag, alleen voor de instortingsregel
  const oordelen = tagOordeel(tags, { vrij: Array.isArray(inst.tagOk) ? inst.tagOk : [], vandaag });
  const dood = oordelen.filter(t => t.stop);
  const uit = { net, aan, bijgewerkt: new Date().toISOString(), venster, regels: TAGREGELS, tags: oordelen, campagnes: [], fouten: [] };
  // Bewaking op de voeding zelf: zonder Associates-cijfers slaapt deze regel zonder dat iemand het merkt. Amazon heeft er
  // geen API voor (het rapport-endpoint weigert een herhaald verzoek, 18 okt), dus de cijfers komen van de dagtaak.
  const gisteren = dagPT(-1);
  uit.voeding = { laatsteHeleDag: gisteren, aanwezig: tags.some(t => t.laatsteDag === gisteren), vandaag: Object.keys(vandaag).length };
  if (!tags.length) uit.fouten.push('geen Associates-cijfers in dit venster (voeden: /api/mm/amazon)');
  else if (!uit.voeding.aanwezig) uit.fouten.push('Associates-cijfers van ' + gisteren + ' ontbreken: het oordeel loopt op oudere dagen');
  if (dood.length) {
    const pa = Array.isArray(paRijen) ? { rijen: paRijen } : await paVandaag(dagPT());
    if (pa.fout) uit.fouten.push(pa.fout);
    // Mondiad hoort er ook bij: ml-push-20 en bl-bku-20 draaien daar, en een tag zonder kopers is daar even duur
    const alle = [...(pa.rijen || []).map(r => ({ ...r, net: 'propeller' })), ...(Array.isArray(moRijen) ? moRijen : []).map(r => ({ ...r, net: 'mondiad' }))];
    for (const t of dood) {
      const namen = [t.tag, ...Object.keys(TAG_ALIAS || {}).filter(k => String(TAG_ALIAS[k]).toLowerCase() === t.tag.toLowerCase())];
      for (const r of alle) {
        if (!(N(r.kliks) > 0) || !namen.some(n => tagIn(r.naam, n))) continue;
        uit.campagnes.push({ net: r.net, cid: String(r.camp).replace(/^md/, ''), naam: String(r.naam || '').slice(0, 120), tag: t.tag, kliksVandaag: N(r.kliks), kostenVandaag: Math.round(N(r.kosten) * 100) / 100, reden: t.oordeel });
      }
    }
    // de duurste eerst: anders vullen oude kopieën die centen uitgeven de ronde en blijft de grootste verspiller lopen
    uit.campagnes.sort((a, b) => b.kostenVandaag - a.kostenVandaag || b.kliksVandaag - a.kliksVandaag);
    uit.campagnes = uit.campagnes.slice(0, TAGREGELS.maxPerRonde);
  }
  uit.samenvatting = uit.campagnes.length
    ? uit.campagnes.length + ' campagnes stilzetten over ' + dood.length + ' tag(s): ' + dood.map(t => t.tag).join(', ')
    : dood.length ? dood.length + ' tag(s) afgekeurd, maar geen lopende campagnes gevonden' : 'niets af te keuren';
  if (!droog) {
    await kv.set('mm:tagstop:' + net, uit);
    try {
      await kv.raw(['LPUSH', 'mm:tagstoplog', JSON.stringify({ t: uit.bijgewerkt, venster, samenvatting: uit.samenvatting, tags: dood.map(t => ({ tag: t.tag, kliks: t.kliks, artikelen: t.artikelen, oordeel: t.oordeel })) })]);
      await kv.raw(['LTRIM', 'mm:tagstoplog', 0, 59]);
    } catch (e) {}
  }
  return uit;
}

// ---------------------------------------------------------------------------
// Alle projecten, niet alleen de blanket (Henkjan 18 okt 2026: "Ja en die grijpt in op alle projecten").
// De uurwacht (lib/eigenwacht.js) keek al per campagne mee bij Yoors Shop, todayin, MyLevel en de deeltest, maar mocht
// alleen melden ("Alleen meten en melden, nooit stoppen"). Die grens gaat er hier af: dezelfde cijfers worden nu een
// voorstel. Drie soorten verspilling, alle drie relatief aan het project zelf:
//   kapot        - betaald verkeer komt niet eens op de pagina aan (pagina of meting stuk)
//   geen mens    - er komt wel verkeer aan, maar geen enkel echt mens (botzones)
//   geen uitkomst- veel duurder dan de rest van hetzelfde project en nul uitkomsten
// De campagne die de ijkprijs van een project bepaalt gaat nooit uit, en een campagne met een uitkomst vandaag ook niet.
export const CAMPREGELS = {
  kapotKliks: 200,     // zoveel afgerekende kliks
  kapotKosten: 0.5,    // en zoveel kosten, met nul bezoeken, terwijl het project wel gemeten wordt
  mensKosten: 1,       // zoveel kosten
  mensBezoek: 20,      // en zoveel bezoeken, met geen enkel echt mens
  duurFactor: 3,       // zoveel keer de middelste prijs per uitkomst van hetzelfde project, met nul uitkomsten
  minKostenUitkomst: 0.5,
  maxPerRonde: 15,
};
const GEMETEN = new Set(['shop', 'todayin']); // projecten waar Clickmind zelf per campagne bezoeken meet

export function campagneOordeel(camps = []) {
  const R = CAMPREGELS, uit = [];
  const uitkomst = c => N(c.koop) + N(c.aanmelding) + N(c.actie);
  // ijkprijs per project: de middelste prijs per uitkomst van de campagnes die wel iets opleverden
  const ijk = {};
  for (const p of new Set(camps.map(c => c.project))) {
    const prijzen = camps.filter(c => c.project === p && uitkomst(c) > 0 && N(c.kosten) > 0).map(c => N(c.kosten) / uitkomst(c)).sort((a, b) => a - b);
    ijk[p] = prijzen.length ? prijzen[Math.floor(prijzen.length / 2)] : null;
  }
  for (const c of camps) {
    if (c.project === 'amazon') continue; // de blanket gaat op tags, niet per campagne
    if (uitkomst(c) > 0) continue;        // vandaag iets opgeleverd: nooit stoppen
    const k = N(c.kosten), kl = N(c.kliks), bez = N(c.bezoek), mens = N(c.mens);
    let reden = null;
    if (GEMETEN.has(c.project) && kl >= R.kapotKliks && !bez && k >= R.kapotKosten) reden = 'kapot: ' + kl + ' betaalde kliks, $' + k.toFixed(2) + ' en geen enkel bezoek op de pagina';
    else if (k >= R.mensKosten && bez >= R.mensBezoek && !mens && c.mens != null) reden = 'geen mens: $' + k.toFixed(2) + ' en ' + bez + ' bezoeken zonder een enkel echt mens';
    else if (ijk[c.project] && k >= Math.max(R.minKostenUitkomst, R.duurFactor * ijk[c.project])) reden = 'nul uitkomsten bij $' + k.toFixed(2) + ', meer dan ' + R.duurFactor + 'x de middelste prijs per uitkomst van ' + c.project + ' ($' + ijk[c.project].toFixed(2) + ')';
    if (reden) uit.push({ net: c.net, cid: String(c.camp), naam: String(c.naam || '').slice(0, 120), project: c.project, kliksVandaag: kl, kostenVandaag: Math.round(k * 100) / 100, bron: 'clickmind-uitkomst', reden });
  }
  return uit.sort((a, b) => b.kostenVandaag - a.kostenVandaag).slice(0, R.maxPerRonde);
}

// De ronde die de uurwacht draait: de blanket op tags, alle andere projecten op hun eigen uitkomsten, per netwerk
// klaargezet in mm:tagstop:<net>. PropellerAds haalt het elk uur op; Mondiad zetten we zelf stil (lib/mdmcp.js).
export async function ingreepRonde(kv, { camps = [], paRijen = [], moRijen = [], droog = false } = {}) {
  const inst = (await kv.get('mm:instelling').catch(() => null)) || {};
  const aan = inst.tagstop !== false;
  const vrij = new Set((Array.isArray(inst.campOk) ? inst.campOk : []).map(String));
  const amazon = await tagRonde(kv, { net: 'propeller', droog: true, paRijen, moRijen }).catch(e => ({ campagnes: [], tags: [], fouten: [String(e && e.message || e).slice(0, 120)], venster: null }));
  const rest = campagneOordeel(camps).filter(c => !vrij.has(c.cid));
  const perNet = {};
  for (const c of amazon.campagnes || []) { const n = c.net || 'propeller'; (perNet[n] || (perNet[n] = [])).push({ ...c, bron: 'amazon-tag' }); }
  for (const c of rest) (perNet[c.net] || (perNet[c.net] = [])).push(c);
  const uit = { bijgewerkt: new Date().toISOString(), aan, venster: amazon.venster, voeding: amazon.voeding || null, tags: (amazon.tags || []).filter(t => t.stop), fouten: amazon.fouten || [], netten: {} };
  for (const [net, lijst] of Object.entries(perNet)) {
    const v = { net, aan, bijgewerkt: uit.bijgewerkt, venster: amazon.venster, regels: { tag: TAGREGELS, campagne: CAMPREGELS }, campagnes: lijst.slice(0, TAGREGELS.maxPerRonde), fouten: uit.fouten };
    v.samenvatting = v.campagnes.length + ' campagnes stilzetten (' + [...new Set(v.campagnes.map(c => c.bron))].join(', ') + ')';
    uit.netten[net] = { campagnes: v.campagnes.length, samenvatting: v.samenvatting };
    if (!droog) await kv.set('mm:tagstop:' + net, v);
  }
  for (const net of ['propeller', 'mondiad', 'mgid', 'richads']) if (!perNet[net] && !droog) await kv.set('mm:tagstop:' + net, { net, aan, bijgewerkt: uit.bijgewerkt, campagnes: [], samenvatting: 'niets af te keuren', fouten: uit.fouten });
  // Mondiad kunnen we zelf stilzetten; PropellerAds doet de lus zelf (de sleutel blijft daar)
  if (!droog && aan && (perNet.mondiad || []).length) {
    uit.mondiad = [];
    for (const c of perNet.mondiad.slice(0, CAMPREGELS.maxPerRonde)) {
      try {
        const { mdSchakelaar } = await import('./mdwacht.js'); await mdSchakelaar.pauzeer(c.cid);
        uit.mondiad.push({ cid: c.cid, gedaan: true, reden: c.reden });
        await kv.raw(['LPUSH', 'mm:mdpauze', JSON.stringify({ t: uit.bijgewerkt, cid: c.cid, naam: c.naam, door: 'clickmind', reden: c.reden })]).catch(() => {});
        await kv.raw(['LTRIM', 'mm:mdpauze', 0, 49]).catch(() => {});
      }
      catch (e) { uit.mondiad.push({ cid: c.cid, gedaan: false, fout: String(e && e.message || e).slice(0, 120) }); }
    }
  }
  if (!droog) {
    try {
      await kv.raw(['LPUSH', 'mm:tagstoplog', JSON.stringify({ t: uit.bijgewerkt, venster: uit.venster, netten: uit.netten, tags: uit.tags.map(t => ({ tag: t.tag, kliks: t.kliks, artikelen: t.artikelen, oordeel: t.oordeel })), mondiad: uit.mondiad || null })]);
      await kv.raw(['LTRIM', 'mm:tagstoplog', 0, 59]);
    } catch (e) {}
  }
  return uit;
}

export async function tagStand(kv, { net = 'propeller' } = {}) {
  const v = (await kv.get('mm:tagstop:' + net).catch(() => null)) || { net, aan: true, tags: [], campagnes: [], bijgewerkt: null };
  let gedaan = null, log = [];
  try { const l = await kv.raw(['LRANGE', 'mm:tagstopgedaan:' + net, 0, 0]); gedaan = l && l[0] ? JSON.parse(l[0]) : null; } catch (e) {}
  try { const l = await kv.raw(['LRANGE', 'mm:tagstoplog', 0, 9]); log = (l || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean); } catch (e) {}
  return { ...v, laatstUitgevoerd: gedaan, logboek: log };
}
