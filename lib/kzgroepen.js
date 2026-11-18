// Overzicht per groep keuzehulpen (18 nov 2026, Henkjan: "Geef me om het uur een overzicht van de groepen keuzehulpen met hun verkeer").
// Leest de groepstellers van lib/kleur.js measureTag (elke keuzehulppagina telt in de browser, dus zonder bots):
//   c:<P>-gv-<dag>-<G>-<bron>         sessies per groep per bron (UTC-dag)
//   c:<P>-gu-<dag>-h<uu>-<G>-<bron>   sessies per groep per bron per UTC-uur
//   c:<P>-gp-<dag>-<G>, -gs-, -gc-    weergaven, gestart (chat of vraag), klik naar winkel of aanbieder
// plus het sitetotaal c:<P>-hv-<dag>-<bron> (bestond al) en de chats uit kz:chat:log. Eindpunt: /api/keuze-tools?tool=groepen&vorm=tekst.
import { kv } from './db.js';
import { BRONNEN } from './kleur.js';

export const GROEPEN = [
  { id: 'nl', naam: 'Keuzehulpen NL (keuzehulp.best)', delen: [['kz', 'nl']] },
  { id: 'zorg', naam: 'Zorgverzekering 2027', delen: [['kz', 'zorg']] },
  { id: 'rotterdam', naam: 'Rotterdam diensten', delen: [['kz', 'rotterdam']] },
  { id: 'verzekeringen', naam: 'Verzekeringen', delen: [['kz', 'verzekeringen']] },
  { id: 'rekenhulpen', naam: 'Rekenhulpen en losse gidsen', delen: [['kz', 'rekenhulpen'], ['wtbus', 'rekenhulpen'], ['wtbde', 'rekenhulpen']] },
  { id: 'us', naam: 'Which To Buy (VS)', delen: [['wtbus', 'us']] },
  { id: 'de', naam: 'Kaufberater (DE)', delen: [['wtbde', 'de']] },
  { id: 'nexy', naam: 'nexy.help (AI-keuzehulp)', delen: [['nexy', 'nexy']] }
];
const ZOEK = ['google', 'bing', 'duckduckgo'], AI = ['chatgpt', 'perplexity', 'copilot', 'gemini'];
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const dagVan = ms => new Date(ms).toISOString().slice(0, 10), uurVan = ms => 'h' + new Date(ms).toISOString().slice(11, 13);
const som = (o, l) => l.reduce((a, k) => a + N(o[k]), 0);

async function perBron(sleutel) { // sleutel(bron) -> waarde per bron, alleen niet-nul
  const v = await kv.mget(...BRONNEN.map(sleutel)).catch(() => []); const o = {}; BRONNEN.forEach((b, i) => { const n = N(v[i]); if (n) o[b] = n; }); return o;
}
const plus = (a, b) => { for (const [k, v] of Object.entries(b)) a[k] = (a[k] || 0) + v; return a; };

export async function groepen({ zet = false } = {}) {
  const nu = Date.now(), d = dagVan(nu), uurNu = uurVan(nu), uurVorig = uurVan(nu - 3600000), dVorig = dagVan(nu - 3600000);
  const dagen7 = Array.from({ length: 7 }, (_, i) => dagVan(nu - i * 86400000));
  const out = { at: new Date(nu).toISOString(), uur: dVorig + ' ' + uurVorig.slice(1) + ':00-' + uurNu.slice(1) + ':00 UTC', groepen: [], sites: {} };
  for (const g of GROEPEN) {
    const r = { id: g.id, naam: g.naam, uur: {}, vandaag: {}, week: 0, weergaven: 0, gestart: 0, klik: 0 };
    for (const [P, G] of g.delen) {
      plus(r.uur, await perBron(b => 'c:' + P + '-gu-' + dVorig + '-' + uurVorig + '-' + G + '-' + b));
      plus(r.vandaag, await perBron(b => 'c:' + P + '-gv-' + d + '-' + G + '-' + b));
      for (const dg of dagen7) r.week += Object.values(await perBron(b => 'c:' + P + '-gv-' + dg + '-' + G + '-' + b)).reduce((a, x) => a + x, 0);
      const v = await kv.mget('c:' + P + '-gp-' + d + '-' + G, 'c:' + P + '-gs-' + d + '-' + G, 'c:' + P + '-gc-' + d + '-' + G).catch(() => []);
      r.weergaven += N(v[0]); r.gestart += N(v[1]); r.klik += N(v[2]);
    }
    r.uurTotaal = Object.values(r.uur).reduce((a, x) => a + x, 0); r.vandaagTotaal = Object.values(r.vandaag).reduce((a, x) => a + x, 0);
    r.zoek = som(r.vandaag, ZOEK); r.ai = som(r.vandaag, AI);
    out.groepen.push(r);
  }
  for (const P of ['kz', 'wtbus', 'wtbde', 'nexy']) { const o = await perBron(b => 'c:' + P + '-hv-' + d + '-' + b); out.sites[P] = { totaal: Object.values(o).reduce((a, x) => a + x, 0), zoek: som(o, ZOEK), ai: som(o, AI) }; }
  const log = ((await kv.raw(['LRANGE', 'kz:chat:log', '0', '199']).catch(() => [])) || []).map(x => { try { return typeof x === 'string' ? JSON.parse(x) : x; } catch (e) { return null; } }).filter(Boolean);
  out.chats = log.filter(r => N(r.t) >= nu - 3600000).map(r => ({ site: r.site, pagina: r.s, vraag: String(r.v || '').slice(0, 140), beantwoord: !!r.weet }));
  if (zet) { try { await kv.set('kz:groepen:laatste', { at: out.at, groepen: out.groepen.map(g => ({ id: g.id, uur: g.uurTotaal, vandaag: g.vandaagTotaal })) }, { ex: 7 * 86400 }); } catch (e) {} }
  return out;
}

const bronTekst = o => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => k + ' ' + v).join(', ');
export function groepenTekst(o) {
  const r = ['Keuzehulpen per groep, uur ' + o.uur + ' (sessies van echte bezoekers, zonder bots)'];
  for (const g of o.groepen) {
    const delen = [];
    delen.push('uur ' + g.uurTotaal + (g.uurTotaal ? ' (' + bronTekst(g.uur) + ')' : ''));
    delen.push('vandaag ' + g.vandaagTotaal + (g.zoek || g.ai ? ' waarvan zoek ' + g.zoek + ', AI ' + g.ai : ''));
    delen.push('7 dagen ' + g.week);
    if (g.gestart) delen.push('gestart ' + g.gestart); if (g.klik) delen.push('doorklik ' + g.klik);
    r.push('- ' + g.naam + ': ' + delen.join(' · '));
  }
  const s = o.sites; r.push('Sites vandaag totaal: keuzehulp.best ' + s.kz.totaal + ' (zoek ' + s.kz.zoek + ', AI ' + s.kz.ai + '), whichtobuy ' + s.wtbus.totaal + ', kaufberater ' + s.wtbde.totaal + ', nexy.help ' + s.nexy.totaal);
  r.push('Chats dit uur: ' + o.chats.length + (o.chats.length ? ' (' + o.chats.filter(c => c.beantwoord).length + ' beantwoord)' : ''));
  o.chats.slice(0, 8).forEach(c => r.push('  ' + c.site + '/' + c.pagina + ': ' + c.vraag + (c.beantwoord ? '' : ' [geen antwoord]')));
  return r.join('\n');
}
