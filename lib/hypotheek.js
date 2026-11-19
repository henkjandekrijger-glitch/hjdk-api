// Rekenhulp hypotheek berekenen en hypotheekrente op keuzehulp.best (19 nov 2026). Henkjan, na de Demand Radar-ophaling huis kopen
// (hypotheek berekenen 165.000 per maand vaste vraag, hypotheekrente 74.000, maximale hypotheek berekenen 27.100, hoeveel hypotheek kan ik krijgen 22.200,
// nhg 14.800): "Maak hier rekenhulp van die alles wat er bestaat overtreft . Als rekenhulp nodig of mogelijk altijd toevoegen !"
// - /hypotheek-berekenen: maximale hypotheek op inkomen (normen 2026 en 2027 naast elkaar) en op woningwaarde, energielabel, studielening, AOW,
//   maandlasten annuitair en lineair bruto en netto, kosten koper en eigen geld; alles in de browser, deelbare link met de invoer in de hash,
//   zonder JavaScript rekent de server met dezelfde kern (GET met dezelfde velden). Rekenkern: lib/hypotheek-kern.js, test scripts/test-hypotheek.mjs.
// - /hypotheekrente: gemiddelde rente op nieuwe hypotheken in Nederland per rentevaste periode uit de rentestatistiek van DNB en de ECB (ECB Data Portal, MIR),
//   live opgehaald en 12 uur bewaard in KV hyp:ecb, met de maand erbij; reserve is de laatst opgehaalde stand.
// Routes: tool=hyp in api/keuze-tools.js; sitemap /hypotheek/sitemap.xml (robots.txt in api/kz.js); llms.txt via llmsDeel; chat via chatItems (lib/kzchat.js).
import { kv } from './db.js';
import { kzuxBlok } from './kzux.js';
import { esc, CSS as RCSS } from './rdam.js';
import * as K from './hypotheek-kern.js';
const { D } = K;

const HOST = 'keuzehulp.best', B = 'https://' + HOST, DATUM = '2026-11-19';
export const PADEN = ['/hypotheek-berekenen', '/hypotheekrente'];
export const BRONNEN = {
  rhk27: ['Wijzigingsregeling hypothecair krediet 2027, Staatscourant 2026, 38415 (2 november 2026)', 'https://zoek.officielebekendmakingen.nl/stcrt-2026-38415.html'],
  rhk: ['Tijdelijke regeling hypothecair krediet, geldend vanaf 1 januari 2026 (wetten.overheid.nl)', 'https://wetten.overheid.nl/BWBR0032503/2026-01-01/0'],
  nibud: ['Nibud, Advies hypotheeknormen 2027 (bijlage bij de Kamerbrief van 14 oktober 2026)', 'https://www.tweedekamer.nl/downloads/document?id=2026D54667'],
  ro: ['Rijksoverheid, leennormen 2027: maximale hypotheek iets omhoog (2 november 2026)', 'https://www.rijksoverheid.nl/actueel/nieuws/2026/11/02/leennormen-2027-maximale-hypotheek-iets-omhoog'],
  gc: ['Gedragscode Hypothecaire Financieringen 2020, artikel 4.5 (NVB)', 'https://www.nvb.nl/media/3402/gedragscode-hypothecaire-financieringen-2020.pdf'],
  ib26: ['Belastingdienst, tarieven box 1 en heffingskortingen 2026', 'https://www.belastingdienst.nl/wps/wcm/connect/nl/voorlopige-aanslag/content/voorlopige-aanslag-tarieven-en-heffingskortingen'],
  ewf: ['Belastingdienst, eigenwoningforfait 2026 en aftrek geen of kleine eigenwoningschuld', 'https://www.belastingdienst.nl/wps/wcm/connect/nl/koopwoning/content/hoe-werkt-eigenwoningforfait'],
  ib27: ['Fiscale sleuteltabel 2027, Belastingplan 2027 (september 2026)', 'https://www.rijksfinancien.nl/sites/default/files/bestanden/belastingplan-2027/pakket-belastingplan-2027/Fiscale-sleuteltabel-2027-incl-correctie-tarieven-energiebelasting-zelfstandigenaftrek.pdf'],
  ewf27: ['Rendement, eigenwoningforfait blijft 0,35% in 2027 (15 september 2026)', 'https://www.rendement.nl/hypotheek-en-eigen-woning/nieuws/percentage-eigenwoningforfait-blijft-gelijk-in-2027.html'],
  hyp: ['Hypotheker, Prinsjesdag 2026: wat verandert er voor huizenkopers in 2027 (17 september 2026)', 'https://www.hypotheker.nl/actueel/nieuwsberichten/2026/prinsjesdag-2026-wat-verandert-er-voor-huizenkopers-in-2027/'],
  nhg26: ['Kamerbrief NHG-grens en betaalbaarheidsgrens 2026, Kamerstuk 32847 nr. 1381 (8 oktober 2025)', 'https://zoek.officielebekendmakingen.nl/kst-32847-1381.html'],
  cb: ['Consumentenbond, dit verandert er voor je hypotheek in 2027 (2 november 2026)', 'https://www.consumentenbond.nl/hypotheek/dit-verandert-er-voor-je-hypotheek-in-2027'],
  ovb: ['Belastingdienst, startersvrijstelling overdrachtsbelasting (gewijzigd 6 januari 2026)', 'https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/woning/overdrachtsbelasting/startersvrijstelling'],
  abn: ['ABN AMRO, bijkomende kosten huis kopen (4 februari 2025)', 'https://www.abnamro.nl/nl/prive/hypotheken/wonen/bijkomende-kosten.html'],
  ecb: ['ECB Data Portal, rentestatistiek banken (MIR), Nederland, nieuwe woninghypotheken, gegevens van DNB', 'https://data.ecb.europa.eu/data/datasets/MIR'],
  rabo: ['Rabobank, hypotheek berekenen (waar je rente van afhangt)', 'https://www.rabobank.nl/particulieren/hypotheek/hypotheek-berekenen'],
};
const bron = k => '<a href="' + esc(BRONNEN[k][1]) + '" target="_blank" rel="noopener nofollow">' + esc(BRONNEN[k][0]) + '</a>';
const E = n => '€ ' + Math.round(n).toLocaleString('nl-NL');
const P = n => Number(n).toLocaleString('nl-NL', { maximumFractionDigits: 3 }) + '%';
const MAAND = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
const maandNL = m => { const [y, mm] = String(m).split('-'); return MAAND[Number(mm) - 1] + ' ' + y; };

// ---------- hypotheekrente: rentestatistiek DNB/ECB ----------
const RV = [['F', 'Variabel of tot 1 jaar vast'], ['I', '1 tot 5 jaar vast'], ['O', '5 tot en met 10 jaar vast'], ['P', 'Langer dan 10 jaar vast']];
// laatst opgehaald op 19 nov 2026 (reserve als de ECB niet antwoordt)
const RESERVE = { maand: '2026-09', opgehaald: '2026-11-19', reeks: { F: [['2026-07', 4.22], ['2026-08', 4.3], ['2026-09', 4.36]], I: [['2026-07', 4.13], ['2026-08', 4.18], ['2026-09', 4.2]], O: [['2026-07', 3.87], ['2026-08', 3.93], ['2026-09', 3.87]], P: [['2026-07', 3.32], ['2026-08', 3.38], ['2026-09', 3.28]], AM: [['2026-07', 3.85], ['2026-08', 3.91], ['2026-09', 3.87]] } };
const ECB = 'https://data-api.ecb.europa.eu/service/data/MIR/M.NL.B.A2C.F+I+O+P+AM.R.A.2250.EUR.N?format=csvdata&lastNObservations=13';
function rentesUit(s) {
  const r = { maand: '', reeks: {} };
  for (const k of Object.keys(s.reeks)) { const l = s.reeks[k]; if (l.length) { r[k] = { v: l[l.length - 1][1], m: l[l.length - 1][0] }; r.reeks[k] = l; if (l[l.length - 1][0] > r.maand) r.maand = l[l.length - 1][0]; } }
  r.opgehaald = s.opgehaald; return r;
}
export async function rentes() {
  let s = null; try { s = await kv.get('hyp:ecb'); } catch (e) {}
  if (!s || Date.now() - Number(s.t || 0) > 12 * 3600e3) {
    try {
      const r = await fetch(ECB, { headers: { 'user-agent': 'keuzehulp.best rekenhulp hypotheek' }, signal: AbortSignal.timeout(8000) });
      if (r.ok) { const t = await r.text(), reeks = {};
        for (const m of t.matchAll(/^MIR\.M\.NL\.B\.A2C\.(\w+)\.R\.A\.2250\.EUR\.N,M,NL,B,A2C,\w+,R,A,2250,EUR,N,(\d{4}-\d{2}),([\d.]+)/gm)) (reeks[m[1]] = reeks[m[1]] || []).push([m[2], Number(m[3])]);
        if (reeks.O && reeks.O.length) { for (const k in reeks) reeks[k].sort((a, b) => a[0] < b[0] ? -1 : 1); s = { t: Date.now(), opgehaald: new Date().toISOString().slice(0, 10), reeks }; await kv.set('hyp:ecb', s).catch(() => {}); } }
    } catch (e) {}
  }
  return rentesUit(s && s.reeks ? s : RESERVE);
}

// ---------- uitkomst (zelfde functie op de server en in de browser: geen verwijzingen naar buiten) ----------
export function uitkomstHtml(R) {
  const E = n => '€ ' + Math.round(n).toLocaleString('nl-NL'), P = n => Number(n).toLocaleString('nl-NL', { maximumFractionDigits: 3 }) + '%';
  const x = R.x, m = R.m, a = R.ander, l = R.l, la = R.lAnder, k = R.k, ann = x.vorm === 'ann' ? l : la, lin = x.vorm === 'lin' ? l : la;
  const w = [];
  w.push('Toetsinkomen ' + E(m.ti) + (x.partner ? ': jullie bruto jaarinkomens samen. Het tweede inkomen telt volledig mee.' : ': je bruto jaarinkomen.'));
  w.push('Toetsrente ' + P(m.tr) + (x.rvp >= 10 ? ': je rente staat 10 jaar of langer vast, dus telt je eigen rente.' : m.toetsAfm ? ': je rente staat korter dan 10 jaar vast, dus rekent de bank met de AFM-toetsrente van ' + P(x.afm) + ' (minstens 5%).' : ': je rente staat korter dan 10 jaar vast; je eigen rente is hoger dan de AFM-toetsrente, dus die telt.'));
  w.push('Financieringslastpercentage ' + P(m.pct) + ' uit tabel ' + (m.aowNu ? '2 (AOW-leeftijd bereikt)' : '1') + ' van de Regeling hypothecair krediet ' + m.j + ', rij toetsinkomen ' + (m.rij ? 'vanaf ' + E(m.rij) : 'onder ' + E(m.minRij)) + ', kolom toetsrente ' + (m.kolVan ? 'vanaf ' + P(m.kolVan) : '') + (m.kolTot ? ' tot en met ' + P(m.kolTot) : '') + '. Je mag dus ' + E(m.jaarlast) + ' per jaar, ' + E(m.maandlast) + ' per maand, kwijt zijn aan rente en aflossing.');
  if (m.stud) w.push('Studielening: ' + E(x.studie) + ' per maand maal ' + String(m.fb).replace('.', ',') + ' (de factor bij deze toetsrente) = ' + E(m.stud) + ' per maand minder.');
  if (m.lening) w.push('Andere leningen: ' + E(m.lening) + ' per maand minder.');
  w.push('Bij ' + E(m.ruimte) + ' per maand hoort bij een annuïteitenhypotheek van 30 jaar tegen ' + P(m.tr) + ' een hypotheek van ' + E(m.naAow && m.naAow.laagst ? m.ruimte / m.af : m.hInk) + '.');
  if (m.naAow) w.push('Na de AOW-leeftijd: inkomen ' + E(m.naAow.ti) + ', ' + P(m.naAow.pct) + ' uit tabel 2, dat geeft ' + E(m.naAow.h) + '. ' + (m.naAow.laagst ? 'Dat is lager, dus dit bedrag telt.' : 'Dat is hoger, dus het bedrag van nu telt.'));
  if (m.alleen) w.push('Alleenstaand met een toetsinkomen boven ' + E(m.j === 2027 ? 31000 : (m.aowNu ? 29000 : 30000)) + ': de bank mag ' + E(m.alleen) + ' buiten de berekening laten. Vraag of jouw bank dat doet.');
  if (m.lab) w.push('Energielabel ' + (x.label === 'A++++G' ? 'A++++ met garantie' : x.label) + ': ' + E(m.lab) + ' extra, buiten de woonlasten gerekend.');
  if (x.maat) w.push('Verduurzamen: ' + E(m.maat) + ' extra' + (m.maat < x.maat ? ' (bij dit label hoogstens ' + E(m.maatMax) + ')' : '') + '.');
  if (m.opWaarde != null) w.push('Woningwaarde ' + E(x.waarde) + ': je leent hoogstens 100% van de waarde' + (x.maat ? ', met verduurzamen hoogstens 106%' : '') + ', dus ' + E(m.opWaarde) + '.');
  const rij = (t, v1, v2) => '<tr><th scope="row">' + t + '</th><td>' + v1 + '</td><td>' + v2 + '</td></tr>';
  let h = '<div class="hb-kop"><p class="hb-k">Maximale hypotheek ' + m.j + '</p><p class="hb-groot">' + E(m.max) + '</p><p>Op je inkomen ' + E(m.opInkomen) + (m.opWaarde != null ? ', op de woningwaarde ' + E(m.opWaarde) + (m.grens === 'waarde' ? '; de woningwaarde is hier de grens' : '') : '') + '. Met de normen van ' + a.j + ': ' + E(a.max) + '.</p></div>' +
    '<h3>Waarom dit bedrag</h3><ol class="hb-w">' + w.map(t => '<li>' + t + '</li>').join('') + '</ol>' +
    '<h3>Maandlasten voor ' + E(R.H) + '</h3>' + (R.teHoog ? '<p class="hb-let">Dit is meer dan je maximale hypotheek van ' + E(m.max) + '.</p>' : '') +
    '<div class="hb-tab"><table><thead><tr><th></th><th scope="col">Annuïteit' + (x.vorm === 'ann' ? ' (gekozen)' : '') + '</th><th scope="col">Lineair' + (x.vorm === 'lin' ? ' (gekozen)' : '') + '</th></tr></thead><tbody>' +
    rij('Bruto eerste maand', E(ann.eerste), E(lin.eerste)) + rij('Bruto laatste maand', E(ann.laatste), E(lin.laatste)) + rij('Netto per maand, eerste jaar', E(ann.nettoMaand), E(lin.nettoMaand)) +
    rij('Renteaftrek eerste jaar', E(ann.voordeel), E(lin.voordeel)) + rij('Rente over 30 jaar', E(ann.totaalRente), E(lin.totaalRente)) + '</tbody></table></div>' +
    '<p class="hb-n">Rente ' + P(x.rente) + ', ' + x.rvp + ' jaar vast, looptijd 30 jaar. Netto: bruto min de hypotheekrenteaftrek in het eerste jaar, toegerekend aan de hoogste verdiener (' + E(l.ink) + '), tegen hoogstens ' + P(m.j === 2027 ? 38.16 : 37.56) + (x.waarde ? ', min het eigenwoningforfait van ' + E(l.ewf) + ' (koopsom als WOZ-waarde)' : '') + '. Heffingskortingen zijn niet meegerekend.' + (l.hillenGeschat ? ' Het afbouwpercentage voor een kleine eigenwoningschuld in 2027 is nog niet gepubliceerd; we rekenen met dat van 2026 (71,867%).' : '') + '</p>';
  if (k) {
    h += '<h3>Kosten koper en eigen geld</h3><div class="hb-tab hb-k2"><table><tbody>' +
      '<tr><th scope="row">Koopsom</th><td>' + E(k.k) + '</td></tr>' + (x.maat ? '<tr><th scope="row">Verduurzamen</th><td>' + E(x.maat) + '</td></tr>' : '') +
      '<tr><th scope="row">Overdrachtsbelasting</th><td>' + (k.ovbVrij ? E(0) + ' (startersvrijstelling, woning tot ' + E(k.startGrens) + ')' : E(k.ovb) + ' (2%' + (k.starterTeDuur ? '; boven ' + E(k.startGrens) + ' geldt de startersvrijstelling niet' : '') + ')') + '</td></tr>' +
      '<tr><th scope="row">NHG</th><td>' + (k.nhgKan ? (x.nhg ? E(k.nhg) + ' (eenmalig 0,4% van de hypotheek)' : 'niet gekozen') : 'kan niet: boven de grens van ' + E(k.nhgGrens)) + '</td></tr>' +
      '<tr><th scope="row">Notaris, taxatie, advies en keuring</th><td>' + E(k.overig) + ' (' + P(x.kostPct) + ' van de koopsom, pas aan met je offertes)</td></tr>' +
      '<tr><th scope="row">Totaal nodig</th><td><b>' + E(k.totaal) + '</b></td></tr><tr><th scope="row">Hypotheek</th><td>' + E(R.H) + '</td></tr>' +
      '<tr><th scope="row">Eigen geld nodig</th><td><b>' + E(k.eigen) + '</b></td></tr></tbody></table></div>';
  } else h += '<p class="hb-n">Vul een koopsom in, dan rekenen we ook de grens op de woningwaarde, de kosten koper en het eigen geld uit.</p>';
  return h;
}

// ---------- formulier ----------
function formulier(x, rt) {
  const num = (n, lab, v, o) => '<div class="hb-v' + (o && o.cls ? ' ' + o.cls : '') + '"' + (o && o.verberg ? ' hidden' : '') + '><label for="hb-' + n + '">' + lab + '</label><input id="hb-' + n + '" name="' + n + '" type="number" inputmode="decimal" min="0" step="' + ((o && o.step) || 1) + '" value="' + esc(v) + '"' + (o && o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + '>' + (o && o.hint ? '<small>' + o.hint + '</small>' : '') + '</div>';
  const sel = (n, lab, opts, v, hint) => '<div class="hb-v"><label for="hb-' + n + '">' + lab + '</label><select id="hb-' + n + '" name="' + n + '">' + opts.map(([a, b]) => '<option value="' + esc(a) + '"' + (String(a) === String(v) ? ' selected' : '') + '>' + esc(b) + '</option>').join('') + '</select>' + (hint ? '<small>' + hint + '</small>' : '') + '</div>';
  const vink = (n, lab, aan) => '<label class="hb-c"><input type="checkbox" name="' + n + '" value="1"' + (aan ? ' checked' : '') + '> ' + lab + '</label>';
  const rvTekst = rt && rt.O ? 'Standaard: de gemiddelde rente op nieuwe hypotheken in ' + maandNL(rt.maand) + ' voor deze rentevaste periode (DNB en ECB). Vul de rente van je offerte in als je die hebt.' : '';
  return '<form id="hb" class="hb" method="get" action="/hypotheek-berekenen#uitkomst" novalidate>' +
    '<fieldset><legend>Jaar van de leennormen</legend><div class="hb-r"><label><input type="radio" name="j" value="2027"' + (x.j === 2027 ? ' checked' : '') + '> 2027</label><label><input type="radio" name="j" value="2026"' + (x.j === 2026 ? ' checked' : '') + '> 2026</label></div><small>Krijg je je hypotheekofferte nog in 2026, dan gelden de normen van 2026.</small></fieldset>' +
    '<fieldset><legend>Inkomen</legend>' + num('i1', 'Jouw bruto jaarinkomen', x.i1, { step: 100, hint: 'Inclusief vakantiegeld en een vaste dertiende maand.' }) + vink('p', 'We kopen samen', x.partner) + num('i2', 'Bruto jaarinkomen partner', x.i2, { step: 100, cls: 'hb-partner', verberg: !x.partner }) +
    sel('aow', 'AOW-leeftijd', [['nee', 'Niemand bereikt binnen 10 jaar de AOW-leeftijd'], ['binnen10', 'Iemand bereikt binnen 10 jaar de AOW-leeftijd'], ['al', 'Ik heb of wij hebben de AOW-leeftijd al']], x.aow) +
    num('ia', 'Verwacht inkomen na de AOW-leeftijd (samen, per jaar)', x.iAow || '', { step: 100, cls: 'hb-aow', verberg: x.aow !== 'binnen10', hint: 'AOW plus pensioen. De bank rekent ook met dit inkomen.' }) + '</fieldset>' +
    '<fieldset><legend>Schulden</legend>' + num('st', 'Studielening: maandbedrag bij DUO', x.studie || '', { ph: '0', hint: 'Het bedrag dat je nu betaalt. Betaal je nog niets of minder door je draagkracht, vraag dan het normale bedrag op bij DUO.' }) +
    num('le', 'Andere leningen: maandlast', x.lening || '', { ph: '0', hint: 'Bij een doorlopend krediet of creditcard ten minste 2% van de limiet per maand, ook als je hem niet gebruikt.' }) + '</fieldset>' +
    '<fieldset><legend>Rente</legend>' + sel('rv', 'Rentevaste periode', [[1, 'Variabel of 1 jaar'], [5, '5 jaar'], [10, '10 jaar'], [15, '15 jaar'], [20, '20 jaar'], [30, '30 jaar']], x.rvp) +
    num('r', 'Hypotheekrente (%)', x.rente, { step: 0.01, hint: rvTekst }) + num('afm', 'AFM-toetsrente (%)', x.afm, { step: 0.01, hint: 'Geldt alleen bij een rentevaste periode korter dan 10 jaar. Volgens de regeling minstens 5%.' }) + '</fieldset>' +
    '<fieldset><legend>Woning</legend>' + num('w', 'Koopsom of woningwaarde', x.waarde || '', { step: 1000, ph: 'bijvoorbeeld 400000' }) +
    sel('l', 'Energielabel', [['geen', 'Geen of onbekend'], ['G', 'G'], ['F', 'F'], ['E', 'E'], ['D', 'D'], ['C', 'C'], ['B', 'B'], ['A', 'A'], ['A+', 'A+'], ['A++', 'A++'], ['A+++', 'A+++'], ['A++++', 'A++++'], ['A++++G', 'A++++ met energieprestatiegarantie van 10 jaar']], x.label) +
    num('m', 'Bedrag voor verduurzamen (isolatie, warmtepomp, zonnepanelen)', x.maat || '', { step: 500, ph: '0' }) +
    vink('s', 'Ik ben 18 tot 35 jaar, ga er zelf wonen en koop voor het eerst', x.starter) + vink('n', 'Met NHG (als het kan)', x.nhg) +
    num('kp', 'Notaris, taxatie, advies en keuring (% van de koopsom)', x.kostPct, { step: 0.1, hint: 'ABN AMRO noemt 5 tot 6% kosten koper inclusief 2% overdrachtsbelasting. Vervang dit door je offertes.' }) +
    sel('v', 'Aflossen', [['ann', 'Annuïteit (gelijke maandlast)'], ['lin', 'Lineair (elke maand gelijke aflossing)']], x.vorm) +
    num('h', 'Hypotheekbedrag voor de maandlasten (leeg = maximaal)', x.h || '', { step: 1000, ph: 'automatisch' }) + '</fieldset>' +
    '<input type="hidden" name="n" value="0"><div class="hb-kn"><button type="submit" class="btn">Bereken</button><button type="button" class="hb-deel" id="hb-deel" hidden>Kopieer link naar deze berekening</button></div></form>';
}

const CSS = '.hb{display:grid;gap:18px;margin:8px 0 0}.hb fieldset{border:1px solid var(--line);border-radius:16px;padding:16px 18px 6px;margin:0;min-width:0}.hb legend{font-weight:700;font-size:16px;padding:0 6px}.hb-v{margin:0 0 14px}.hb-v[hidden]{display:none}.hb label{display:block;font-weight:600;font-size:16px;margin:0 0 6px}.hb input[type=number],.hb select{box-sizing:border-box;width:100%;font:inherit;font-size:16px;color:#111113;background:#fff;border:1px solid #B9BFC7;border-radius:10px;padding:11px 12px;min-height:46px}.hb small,.hb-n{display:block;font-size:13px;line-height:1.5;color:#4B5563;margin:6px 0 0}.hb .hb-c{display:flex;gap:10px;align-items:flex-start;font-weight:400;margin:0 0 14px}.hb .hb-c input{width:20px;height:20px;margin:2px 0 0;flex:none}.hb-r{display:flex;gap:18px}.hb-r label{display:flex;gap:8px;align-items:center;font-weight:600}.hb-kn{display:flex;flex-wrap:wrap;gap:10px}.hb-kn button{font:inherit;font-size:16px;min-height:46px;padding:10px 20px;border-radius:999px;cursor:pointer}.hb-deel{background:#fff;color:#111113;border:1px solid #B9BFC7}' +
  '.hb-uit{border:1px solid var(--line);border-radius:16px;padding:20px;margin:22px 0 0;scroll-margin-top:80px}.hb-kop{background:#F3F4F6;border-radius:12px;padding:16px 18px;margin:0 0 6px}.hb-k{font-size:13px;letter-spacing:.06em;text-transform:uppercase;font-weight:700;margin:0}.hb-groot{font-size:40px;line-height:1.1;font-weight:700;letter-spacing:-.02em;margin:4px 0 8px;color:#111113}.hb-kop p:last-child{margin:0;font-size:16px}.hb-uit h3{font-size:18px;margin:22px 0 8px}.hb-w{padding-left:22px;margin:0}.hb-w li{font-size:16px;line-height:1.6;margin:0 0 8px}.hb-tab{overflow-x:auto}.hb-tab table{width:100%;border-collapse:collapse;font-size:15px}.hb-tab th,.hb-tab td{text-align:left;padding:9px 8px 9px 0;border-bottom:1px solid var(--line);vertical-align:top}.hb-tab td{white-space:nowrap}.hb-tab tbody th{font-weight:600;color:#111113;white-space:normal}.hb-let{font-weight:700;color:#B3261E}.hb-k2 td{white-space:normal}' +
  '.tbl{overflow-x:auto}.tbl table{width:100%;border-collapse:collapse;font-size:15px}.tbl th,.tbl td{text-align:left;padding:9px 8px 9px 0;border-bottom:1px solid var(--line)}.bron{font-size:13px;color:#4B5563}.bron a{color:inherit}.kaart{background:#F3F4F6;border-radius:14px;padding:18px 20px;margin:16px 0}.kaart p:last-child{margin:0}.stap{counter-reset:s;list-style:none;padding:0}.stap li{counter-increment:s;padding:10px 0 10px 40px;position:relative;border-bottom:1px solid var(--line)}.stap li:before{content:counter(s);position:absolute;left:0;top:10px;width:26px;height:26px;border-radius:50%;background:#111113;color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center}@media(max-width:560px){.hb fieldset{padding:14px 12px 4px}.hb-uit{padding:14px}.hb-groot{font-size:34px}.hb-tab table{font-size:14px}}';

const KERN_FN = ['kolom', 'flPct', 'annu', 'bruteer', 'getal', 'invoer', 'maxHypotheek', 'forfait', 'aftrekVoordeel', 'margTarief', 'lasten', 'kosten', 'bereken'];
function clientJs(rt) {
  const rs = {}; for (const [k] of RV) if (rt[k]) rs[k] = { v: rt[k].v };
  return '<script>(function(){"use strict";var D=' + JSON.stringify(D) + ',RENTES=' + JSON.stringify(rs) + ';' + KERN_FN.map(n => K[n].toString()).join('\n') + '\n' + uitkomstHtml.toString() + '\n' +
  'var F=document.getElementById("hb"),U=document.getElementById("uitkomst"),eigen=false,eerste=true,tm;' +
  'function lees(){var o={};[].forEach.call(F.elements,function(e){if(!e.name||e.type==="hidden")return;if(e.type==="checkbox")o[e.name]=e.checked?"1":"0";else if(e.type==="radio"){if(e.checked)o[e.name]=e.value}else if(e.value!=="")o[e.name]=e.value});return o}' +
  'function zet(o){[].forEach.call(F.elements,function(e){if(!e.name||e.type==="hidden"||!(e.name in o))return;if(e.type==="checkbox")e.checked=o[e.name]==="1";else if(e.type==="radio")e.checked=e.value===o[e.name];else e.value=o[e.name]})}' +
  'function zichtbaar(){var p=F.querySelector("[name=p]").checked;F.querySelector(".hb-partner").hidden=!p;F.querySelector(".hb-aow").hidden=F.querySelector("[name=aow]").value!=="binnen10"}' +
  'function tel(k){try{navigator.sendBeacon("/api/hjdk/stats/hits",new Blob([JSON.stringify({hits:[["kzhyp-"+k,1]]})],{type:"text/plain"}))}catch(e){}}' +
  'function toon(push){zichtbaar();var o=lees(),x=invoer(o,RENTES),R=bereken(D,x);U.innerHTML=uitkomstHtml(R);if(push){var q=new URLSearchParams(o).toString();try{history.replaceState(null,"","#"+q)}catch(e){}if(eerste){eerste=false;tel("reken")}}}' +
  'F.addEventListener("input",function(e){if(e.target.name==="r")eigen=true;if(e.target.name==="rv"&&!eigen){var v=Number(e.target.value),c=v>=15?"P":v>=10?"O":v>=5?"I":"F";if(RENTES[c])F.querySelector("[name=r]").value=RENTES[c].v}clearTimeout(tm);tm=setTimeout(function(){toon(true)},250)});' +
  'F.addEventListener("change",function(){toon(true)});F.addEventListener("submit",function(e){e.preventDefault();toon(true);U.scrollIntoView({behavior:"smooth",block:"start"});tel("knop")});' +
  'var dl=document.getElementById("hb-deel");dl.hidden=false;dl.addEventListener("click",function(){toon(true);var u=location.href;tel("deel");if(navigator.share){navigator.share({title:document.title,url:u}).catch(function(){})}else if(navigator.clipboard){navigator.clipboard.writeText(u).then(function(){dl.textContent="Link gekopieerd"})}});' +
  'if(location.hash.length>2){var o={};new URLSearchParams(location.hash.slice(1)).forEach(function(v,k){o[k]=v});if(o.r)eigen=true;zet(o);toon(false)}else zichtbaar();' +
  '})()</script>';
}

// ---------- pagina-opbouw ----------
const ORG = { '@type': 'Organization', '@id': B + '/#org', name: 'keuzehulp.best', url: B + '/' };
function doc({ titel, desc, pad, body, schema }) {
  if (titel.length > 62 || desc.length > 155) throw new Error('titel of description te lang: ' + titel.length + '/' + desc.length);
  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(titel) + '</title><meta name="description" content="' + esc(desc) + '"><link rel="canonical" href="' + B + pad + '"><meta name="robots" content="index,follow,max-snippet:-1">' +
    '<meta property="og:type" content="website"><meta property="og:title" content="' + esc(titel) + '"><meta property="og:description" content="' + esc(desc) + '"><meta property="og:url" content="' + B + pad + '"><meta property="og:locale" content="nl_NL">' +
    '<link rel="icon" href="data:,"><link rel="alternate" type="text/plain" href="/llms.txt"><style>' + RCSS + CSS + '</style><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, '\\u003c') + '</script></head><body><header class="topbar"><div class="wrap"><a class="mark" href="/">keuzehulp<em>.best</em></a><nav class="topnav"><a href="/huis-kopen">Huis kopen</a><a href="/hypotheek-berekenen">Hypotheek</a><a href="/makelaar">Makelaars</a></nav></div></header><main><div class="wrap">' + body +
    '</div></main><footer><div class="wrap"><p>Rekenhulp met de officiële leennormen; geen advies. Niemand betaalt voor een plek.</p></div></footer></body></html>';
}
const faqBlok = faq => faq.map(([q, a, k]) => '<details class="faq"><summary>' + esc(q) + '</summary><p>' + esc(a) + (k ? ' <span class="bron">Bron: ' + k.split(',').map(bron).join(', ') + '</span>' : '') + '</p></details>').join('');
const faqLd = faq => ({ '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const kruim = l => ({ '@type': 'BreadcrumbList', itemListElement: l.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: B + u })) });
const chat = (slug, term, faq) => kzuxBlok({ alleenChat: true, kop: 'Vraag het de keuzehulp', taal: 'nl', site: 'kzuxrekenhulpen', slug, term, shop: '', prods: [], opties: [], faq: faq.map(([q, a]) => ({ q, a })) });
const mx = (j, ink, r, rv) => K.maxHypotheek(D, j, K.invoer({ j, i1: ink, p: '1', i2: 0, r, rv: rv || 10 })).opInkomen;

// FAQ: de grootste vraagtermen uit Demand Radar (thema huiskopen, NL, 19 nov 2026), elk antwoord met bron
function faqBerekenen(rt) {
  const r10 = rt.O ? rt.O.v : 3.87, m = rt.maand ? maandNL(rt.maand) : 'september 2026';
  return [
    ['Hoe kan ik mijn hypotheek berekenen?', 'Vul hierboven je bruto jaarinkomen in, eventueel dat van je partner, je studielening en andere leningen, de rente en de koopsom. De rekenhulp past de leennormen van de overheid toe en laat per stap zien welk percentage en welke rente hij gebruikt. Je hoeft niets achter te laten; alles rekent in je browser.', 'rhk27'],
    ['Hoeveel hypotheek kan ik krijgen?', 'Met de normen van 2027 en een rente van 4,25%: bij € 35.000 bruto per jaar € 142.887, bij € 50.000 € 204.124, bij € 70.000 € 294.074 en bij € 100.000 € 467.537. Bij 5% is dat € 135.830, € 194.043, € 279.267 en € 442.419. Dat geldt voor een huishouden zonder schulden; alleenstaanden kunnen tot € 18.000 meer lenen.', 'nibud,rhk27'],
    ['Hoe bereken ik mijn maximale hypotheek in 2027?', 'De bank zoekt bij je toetsinkomen en de toetsrente een financieringslastpercentage op in de Regeling hypothecair krediet 2027, bijvoorbeeld 25,0% bij € 50.000 en 5%. Dat deel van je bruto inkomen mag naar rente en aflossing. Dat bedrag per maand wordt omgerekend naar een annuïteitenhypotheek van 30 jaar. Studieschuld en andere leningen gaan eraf.', 'rhk27,rhk'],
    ['Telt het inkomen van mijn partner volledig mee?', 'Ja. Het tweede inkomen telt volledig mee, dus huishoudens met hetzelfde totale bruto inkomen kunnen evenveel lenen, hoe het inkomen ook verdeeld is. De bank gebruikt het percentage dat bij jullie samen opgetelde toetsinkomen hoort.', 'nibud,rhk'],
    ['Hoeveel scheelt een studieschuld in je hypotheek?', 'De bank telt je maandbedrag bij DUO mee, maal een factor van 1,05 tot 1,40 die hoort bij de toetsrente. Bij een toetsrente van 5% is de factor 1,30. Een studielening van € 100 per maand kost dan ongeveer € ' + Math.round((130 / K.annu(5, 360)) / 1000) + '.000 aan maximale hypotheek.', 'rhk'],
    ['Wat is de toetsrente?', 'Staat je rente 10 jaar of langer vast, dan rekent de bank met je eigen rente. Bij een kortere rentevaste periode rekent de bank met de rente die de AFM elk kwartaal publiceert, met een minimum van 5%, of met je eigen rente als die hoger is.', 'rhk'],
    ['Hoeveel mag ik extra lenen met een zuinig energielabel?', 'Bij label C of D € 5.000, bij A of B € 10.000, bij A+ of A++ € 20.000, bij A+++ € 25.000 en bij A++++ € 30.000 (met energieprestatiegarantie € 40.000). Voor verduurzamen kun je daarnaast lenen: bij E, F of G tot € 20.000, bij C of D € 15.000 en bij A tot A++ € 10.000, en hoogstens 106% van de woningwaarde.', 'rhk'],
    ['Wat is de NHG-grens in 2027 en wat kost NHG?', 'In 2027 kun je NHG krijgen voor een woning tot € 500.000, of € 530.000 als je ook energiebesparende maatregelen meefinanciert. In 2026 is dat € 470.000 en € 498.200. Je betaalt eenmalig 0,4% van je hypotheek.', 'cb,nhg26'],
    ['Hoeveel hypotheekrenteaftrek krijg ik?', 'Je trekt de betaalde rente af van je inkomen, min het eigenwoningforfait van 0,35% van de WOZ-waarde. Het voordeel is hoogstens 37,56% in 2026 en 38,16% in 2027 (Belastingplan 2027, nog niet aangenomen door de Eerste Kamer). In de laagste schijf is het 35,75% (2026). De rekenhulp rekent je netto maandlast zo uit.', 'ib26,ewf,hyp'],
    ['Kan ik meer lenen dan de waarde van het huis?', 'Nee, hoogstens 100% van de woningwaarde. Alleen als je energiebesparende voorzieningen meefinanciert mag het tot 106%. Kosten koper betaal je daarom meestal met eigen geld.', 'rhk'],
    ['Wat is de hypotheekrente nu?', 'De gemiddelde rente op nieuwe hypotheken in Nederland was in ' + m + ' ' + P(r10) + ' bij 5 tot en met 10 jaar vast' + (rt.P ? ' en ' + P(rt.P.v) + ' bij langer dan 10 jaar vast' : '') + ', volgens de rentestatistiek van DNB en de ECB. Je eigen rente hangt af van je bank, de rentevaste periode en hoeveel je leent ten opzichte van de woningwaarde.', 'ecb'],
    ['Annuïteit of lineair: wat is het verschil?', 'Bij een annuïteitenhypotheek betaal je elke maand hetzelfde bruto bedrag; eerst vooral rente, later vooral aflossing. Bij lineair los je elke maand hetzelfde bedrag af, dus je begint hoger en eindigt lager, en je betaalt in totaal minder rente. De bank toetst je maximale hypotheek altijd als annuïteit over 30 jaar.', 'rhk'],
  ];
}

export async function hypotheekBerekenen(query) {
  const rt = await rentes(), o = {}; if (query) for (const [k, v] of query) o[k] = v;
  const x = K.invoer(o, rt), R = K.bereken(D, x), faq = faqBerekenen(rt);
  const r10 = rt.O ? rt.O.v : 3.87, inks = [30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 120000];
  const tabel = '<div class="tbl"><table><thead><tr><th scope="col">Bruto inkomen huishouden</th><th scope="col">2027, rente ' + P(r10) + ' (10 jaar vast)</th><th scope="col">2027, toetsrente 5%</th><th scope="col">2026, rente ' + P(r10) + '</th></tr></thead><tbody>' +
    inks.map(i => '<tr><th scope="row">' + E(i) + '</th><td>' + E(mx(2027, i, r10)) + '</td><td>' + E(mx(2027, i, 5, 5)) + '</td><td>' + E(mx(2026, i, r10)) + '</td></tr>').join('') + '</tbody></table></div>';
  const body = '<p class="crumbs"><a href="/">keuzehulp.best</a> › <a href="/huis-kopen">Huis kopen</a> › Hypotheek berekenen</p><h1>Hypotheek berekenen</h1>' +
    '<p class="standfirst">Je maximale hypotheek met de leennormen van 2027 en 2026, je maandlasten bruto en netto, en wat je zelf moet inbrengen. Met bij elke stap welke norm en welk percentage we gebruiken.</p>' +
    chat('hypotheek-berekenen', 'hypotheek berekenen', faq) +
    formulier(x, rt);
  const uit = '<div class="hb-uit" id="uitkomst" aria-live="polite">' + uitkomstHtml(R) + '</div>';
  const rest = '<h2>Wat deze rekenhulp anders doet</h2><ul>' + [
    'De normen van 2027 en 2026 naast elkaar, zodat je ziet wat de jaarwisseling voor jou betekent.',
    'Bij elke uitkomst de stap erbij: welk financieringslastpercentage, welke toetsrente en welke factor voor je studieschuld.',
    'Energielabel, verduurzamen, AOW-leeftijd, alleenstaand en de grens van 100% of 106% van de woningwaarde zitten erin.',
    'Netto maandlasten met de hypotheekrenteaftrek en het eigenwoningforfait van het gekozen jaar, voor annuïteit en lineair.',
    'Kosten koper met overdrachtsbelasting, startersvrijstelling en NHG, en hoeveel eigen geld je nodig hebt.',
    'Geen e-mail, geen telefoonnummer, geen account. Je berekening staat in de link, dus je kunt hem delen met je partner of adviseur.'].map(t => '<li>' + t + '</li>').join('') + '</ul>' +
    '<h2>Maximale hypotheek per inkomen</h2><p>Voor een huishouden zonder studieschuld of andere leningen, annuïteit over 30 jaar. Alleenstaanden met een inkomen boven € 31.000 kunnen in 2027 tot € 18.000 meer lenen. Een rente korter dan 10 jaar vast wordt getoetst op 5%.</p>' + tabel +
    '<p class="bron">Uitgerekend met de financieringslastpercentages uit ' + bron('rhk27') + ' en ' + bron('rhk') + '. Rente: gemiddelde voor 5 tot en met 10 jaar vast in ' + maandNL(rt.maand || '2026-09') + ', ' + bron('ecb') + '. Onze kern geeft precies dezelfde bedragen als de 16 voorbeelden in ' + bron('nibud') + '.</p>' +
    '<h2>Zo rekent de bank je maximale hypotheek uit</h2><ol class="stap">' + [
      '<strong>Toetsinkomen.</strong> Je vaste bruto jaarinkomen, met je partner erbij opgeteld. Bereikt iemand binnen 10 jaar de AOW-leeftijd, dan telt ook het inkomen daarna mee.',
      '<strong>Toetsrente.</strong> Je eigen rente bij 10 jaar of langer vast; korter vast: de AFM-toetsrente van minstens 5%.',
      '<strong>Percentage uit de tabel.</strong> Bij inkomen en toetsrente hoort een financieringslastpercentage, voor 2027 tussen 16,8% en 32,6% (tabel 1). Dat deel van je bruto inkomen mag naar rente en aflossing.',
      '<strong>Schulden eraf.</strong> Je maandbedrag bij DUO maal een factor van 1,05 tot 1,40, en de maandlast van andere leningen (bij een doorlopend krediet ten minste 2% van de limiet).',
      '<strong>Omrekenen naar een hypotheek.</strong> Wat per maand overblijft, wordt een annuïteitenhypotheek van 30 jaar tegen de toetsrente.',
      '<strong>Extra ruimte.</strong> Voor een zuinig energielabel, voor verduurzamen en voor alleenstaanden mag de bank een bedrag buiten de berekening laten.',
      '<strong>Grens van de woning.</strong> Hoogstens 100% van de woningwaarde, of 106% met verduurzamen.'].map(t => '<li>' + t + '</li>').join('') + '</ol>' +
    '<p class="bron">Bronnen: ' + bron('rhk') + ', ' + bron('rhk27') + ', ' + bron('gc') + '.</p>' +
    '<h2>Huis kopen: verder lezen</h2><ul><li><a href="/hypotheekrente">Hypotheekrente nu per rentevaste periode</a>, met de maand erbij.</li><li><a href="/huis-kopen">Huis kopen in 7 stappen</a>: kosten koper, startersvrijstelling, bedenktijd.</li><li><a href="/makelaar">Makelaar kiezen per plaats</a>.</li><li><a href="/verzekeringen">Opstal- en inboedelverzekering</a> na de koop.</li></ul>' +
    '<h2>Vragen over hypotheek berekenen</h2>' + faqBlok(faq) +
    '<h2>Bronnen en controle</h2><ul class="bron">' + Object.keys(BRONNEN).filter(k => !['rabo'].includes(k)).map(k => '<li>' + bron(k) + '</li>').join('') + '</ul><p class="bron">Normen gecontroleerd op 19 november 2026. De belastingtarieven voor 2027 komen uit het Belastingplan 2027, dat nog door de Eerste Kamer moet. Dit is een rekenhulp en geen hypotheekadvies; je bank of adviseur rekent met je echte gegevens.</p>' + clientJs(rt);
  const volledig = body + uit + rest;
  const schema = { '@context': 'https://schema.org', '@graph': [ORG,
    { '@type': 'WebApplication', '@id': B + '/hypotheek-berekenen#app', name: 'Hypotheek berekenen', url: B + '/hypotheek-berekenen', applicationCategory: 'FinanceApplication', operatingSystem: 'Web', inLanguage: 'nl-NL', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }, publisher: { '@id': ORG['@id'] }, dateModified: DATUM,
      featureList: ['Maximale hypotheek op inkomen met de leennormen 2026 en 2027', 'Maximale hypotheek op woningwaarde (100% en 106%)', 'Studieschuld met bruteringsfactor', 'Energielabel en verduurzamen', 'AOW-leeftijd en alleenstaanden', 'Maandlasten annuïteit en lineair, bruto en netto', 'Kosten koper, startersvrijstelling en NHG', 'Deelbare link zonder gegevens achter te laten'] },
    { '@type': 'WebPage', '@id': B + '/hypotheek-berekenen', url: B + '/hypotheek-berekenen', name: 'Hypotheek berekenen', inLanguage: 'nl-NL', dateModified: DATUM, publisher: { '@id': ORG['@id'] }, mainEntity: { '@id': B + '/hypotheek-berekenen#app' }, citation: Object.values(BRONNEN).map(b => b[1]) },
    kruim([['keuzehulp.best', '/'], ['Huis kopen', '/huis-kopen'], ['Hypotheek berekenen', '/hypotheek-berekenen']]), faqLd(faq)] };
  return doc({ titel: 'Hypotheek berekenen 2027: maximale hypotheek en maandlasten', desc: 'Hypotheek berekenen met de leennormen 2027 en 2026: maximaal lenen, maandlasten bruto en netto, NHG en kosten koper. Met uitleg, zonder je gegevens.', pad: '/hypotheek-berekenen', body: volledig, schema });
}

export async function hypotheekrente() {
  const rt = await rentes(), m = maandNL(rt.maand || '2026-09');
  const terug = (k, n) => { const l = rt.reeks[k] || []; return l.length > n ? l[l.length - 1 - n] : null; };
  const rij = ([k, t]) => { const nu = rt[k], d3 = terug(k, 3), d12 = terug(k, 12); return nu ? '<tr><th scope="row">' + t + '</th><td><b>' + P(nu.v) + '</b></td><td>' + (d3 ? P(d3[1]) : '') + '</td><td>' + (d12 ? P(d12[1]) : '') + '</td></tr>' : ''; };
  const d3m = terug('O', 3), d12m = terug('O', 12);
  const voorbeeld = [['F', 1], ['I', 5], ['O', 10], ['P', 20]].filter(([k]) => rt[k]).map(([k, rv]) => '<tr><th scope="row">' + RV.find(r => r[0] === k)[1] + '</th><td>' + P(rt[k].v) + '</td><td>' + P(rv >= 10 ? rt[k].v : Math.max(5, rt[k].v)) + '</td><td>' + E(mx(2027, 60000, rt[k].v, rv)) + '</td><td><a href="/hypotheek-berekenen#i1=60000&amp;p=1&amp;rv=' + rv + '&amp;r=' + rt[k].v + '">Reken zelf</a></td></tr>').join('');
  const maanden = (rt.reeks.O || []).slice().reverse();
  const verloop = '<div class="tbl"><table><thead><tr><th scope="col">Maand</th>' + RV.map(([, t]) => '<th scope="col">' + t + '</th>').join('') + '</tr></thead><tbody>' + maanden.map(([mm]) => '<tr><th scope="row">' + maandNL(mm) + '</th>' + RV.map(([k]) => { const v = (rt.reeks[k] || []).find(z => z[0] === mm); return '<td>' + (v ? P(v[1]) : '') + '</td>'; }).join('') + '</tr>').join('') + '</tbody></table></div>';
  const faq = [
    ['Wat is de hypotheekrente nu?', 'In ' + m + ' was de gemiddelde rente op nieuwe hypotheken in Nederland ' + RV.filter(([k]) => rt[k]).map(([k, t]) => P(rt[k].v) + ' bij ' + t.toLowerCase()).join(', ') + '. Dat zijn gemiddelden over alle banken; je eigen rente kan hoger of lager zijn.', 'ecb'],
    ['Waar komen deze cijfers vandaan?', 'Uit de rentestatistiek van de banken die De Nederlandsche Bank verzamelt en de Europese Centrale Bank publiceert: de gemiddelde rente op nieuwe woninghypotheken per maand, per rentevaste periode. We halen ze elke dag op; de nieuwste maand is ' + m + '.', 'ecb'],
    ['Welke rente telt voor mijn maximale hypotheek?', 'Staat je rente 10 jaar of langer vast, dan je eigen rente. Bij een kortere rentevaste periode rekent de bank met de AFM-toetsrente van minstens 5%, of met je eigen rente als die hoger is. Een korte rentevaste periode met een lage rente geeft dus niet meer leenruimte.', 'rhk'],
    ['Waarom krijg ik een andere rente dan het gemiddelde?', 'Je rente hangt af van de soort hypotheek, de rentevaste periode en hoeveel je leent ten opzichte van de woningwaarde. Banken kunnen korting geven, bijvoorbeeld voor een energiezuinig huis.', 'rabo'],
    ['Hoeveel hypotheekrente mag ik aftrekken?', 'Je trekt de betaalde rente af van je inkomen, min het eigenwoningforfait (0,35% van de WOZ-waarde). Het voordeel is hoogstens 37,56% in 2026 en 38,16% in 2027 (Belastingplan 2027, nog niet aangenomen door de Eerste Kamer).', 'ib26,ewf,hyp'],
    ['Wat betekent een hogere rente voor wat ik kan lenen?', 'Bij een hogere toetsrente hoort een hoger financieringslastpercentage, maar je betaalt meer rente per euro, dus je kunt minder lenen. Met de normen van 2027 en een inkomen van € 60.000 is dat ' + E(mx(2027, 60000, 3.5)) + ' bij 3,5% en ' + E(mx(2027, 60000, 4.5)) + ' bij 4,5% (10 jaar vast).', 'rhk27'],
  ];
  const body = '<p class="crumbs"><a href="/">keuzehulp.best</a> › <a href="/huis-kopen">Huis kopen</a> › Hypotheekrente</p><h1>Hypotheekrente nu per rentevaste periode</h1>' +
    '<p class="standfirst">De gemiddelde rente op nieuwe hypotheken in Nederland, per maand, uit de rentestatistiek van DNB en de ECB. Met wat die rente betekent voor wat je kunt lenen.</p>' +
    chat('hypotheekrente', 'hypotheekrente', faq) +
    '<div class="kaart"><p><strong>' + m.charAt(0).toUpperCase() + m.slice(1) + ':</strong> ' + (rt.O ? P(rt.O.v) + ' gemiddeld bij 5 tot en met 10 jaar vast' + (d3m ? ' (drie maanden eerder ' + P(d3m[1]) + ')' : '') + (d12m ? ', een jaar eerder ' + P(d12m[1]) : '') + '. ' : '') + (rt.P ? 'Langer dan 10 jaar vast: ' + P(rt.P.v) + '. ' : '') + (rt.F ? 'Variabel: ' + P(rt.F.v) + '.' : '') + '</p><p class="bron">Bron: ' + bron('ecb') + ', opgehaald <time datetime="' + esc(rt.opgehaald) + '">' + esc(rt.opgehaald) + '</time>.</p></div>' +
    '<h2>Gemiddelde hypotheekrente in ' + esc(m) + '</h2><div class="tbl"><table><thead><tr><th scope="col">Rentevaste periode</th><th scope="col">' + esc(m) + '</th><th scope="col">3 maanden eerder</th><th scope="col">12 maanden eerder</th></tr></thead><tbody>' + RV.map(rij).join('') + '</tbody></table></div>' +
    '<p class="bron">Gemiddelde rente op nieuwe woninghypotheken van Nederlandse banken, op jaarbasis. De ECB-reeks voor 5 tot 10 jaar loopt tot en met 10 jaar vast.</p>' +
    '<h2>Wat je met die rente kunt lenen</h2><p>Bruto jaarinkomen huishouden € 60.000, geen schulden, normen 2027, annuïteit 30 jaar.</p><div class="tbl"><table><thead><tr><th scope="col">Rentevaste periode</th><th scope="col">Gemiddelde rente</th><th scope="col">Toetsrente</th><th scope="col">Maximale hypotheek</th><th scope="col"></th></tr></thead><tbody>' + voorbeeld + '</tbody></table></div>' +
    '<p>Reken met je eigen inkomen, schulden en rente in de <a href="/hypotheek-berekenen">rekenhulp hypotheek berekenen</a>.</p>' +
    '<h2>Verloop per maand</h2>' + verloop +
    '<h2>Vragen over hypotheekrente</h2>' + faqBlok(faq) + '<p class="bron">Gecontroleerd op 19 november 2026. Dit is een overzicht van gemiddelden, geen aanbod van een bank.</p>';
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebPage', '@id': B + '/hypotheekrente', url: B + '/hypotheekrente', name: 'Hypotheekrente nu per rentevaste periode', inLanguage: 'nl-NL', dateModified: rt.opgehaald || DATUM, publisher: { '@id': ORG['@id'] }, citation: [BRONNEN.ecb[1], BRONNEN.rhk[1]] },
    kruim([['keuzehulp.best', '/'], ['Huis kopen', '/huis-kopen'], ['Hypotheekrente', '/hypotheekrente']]), faqLd(faq)] };
  return doc({ titel: 'Hypotheekrente nu: gemiddelde rente per rentevaste periode', desc: ('Hypotheekrente ' + m + ': ' + (rt.O ? P(rt.O.v) + ' bij 10 jaar vast' : '') + (rt.P ? ', ' + P(rt.P.v) + ' bij langer vast' : '') + '. Gemiddelden van DNB en ECB per maand, en wat je ermee kunt lenen.').slice(0, 155), pad: '/hypotheekrente', body, schema });
}

// ---------- sitemap, IndexNow, chat, llms.txt ----------
export function sitemap() { return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + PADEN.map(p => '<url><loc>' + B + p + '</loc><lastmod>' + DATUM + '</lastmod></url>').join('') + '</urlset>'; }
export async function ping() {
  const key = '466971cbc1bbe43e6bb64a94465e4470', urlList = PADEN.map(p => B + p);
  const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: HOST, key, keyLocation: B + '/' + key + '.txt', urlList }), signal: AbortSignal.timeout(20000) }).catch(() => null);
  return { n: urlList.length, status: r ? r.status : 'fout' };
}
export async function chatItems() {
  const rt = await rentes().catch(() => rentesUit(RESERVE)), f1 = faqBerekenen(rt);
  const tab = j => [30000, 40000, 50000, 60000, 70000, 80000, 100000].map(i => E(i) + ': ' + E(mx(j, i, rt.O ? rt.O.v : 3.87)) + ' (10 jaar vast) of ' + E(mx(j, i, 5, 5)) + ' (korter vast, toetsrente 5%)').join('; ');
  return [{ slug: 'hypotheek-berekenen', pad: '/hypotheek-berekenen', term: 'hypotheek berekenen', title: 'Hypotheek berekenen 2027: maximale hypotheek en maandlasten',
    kort: 'Rekenhulp met de leennormen 2027 en 2026: maximale hypotheek op inkomen en woningwaarde, studieschuld, energielabel, AOW, maandlasten bruto en netto, kosten koper en eigen geld. Alles in de browser, zonder gegevens achter te laten.',
    uitleg: 'Maximale hypotheek 2027 per bruto huishoudinkomen zonder schulden: ' + tab(2027) + '. Alleenstaand boven € 31.000: tot € 18.000 extra (2026: € 17.000 boven € 30.000). Studielening: maandbedrag x factor 1,05 tot 1,40 (1,30 bij 5%). Andere leningen: maandlast, doorlopend krediet minstens 2% van de limiet. Energielabel extra: C/D 5.000, A/B 10.000, A+/A++ 20.000, A+++ 25.000, A++++ 30.000. Woningwaarde: hoogstens 100%, met verduurzamen 106%. NHG 2027 tot € 500.000 (530.000 met verduurzamen), 0,4%. Overdrachtsbelasting 2%, starters 0% tot € 555.000 (2026) of € 615.000 (2027). Gemiddelde hypotheekrente ' + maandNL(rt.maand || '2026-09') + ': ' + RV.filter(([k]) => rt[k]).map(([k, t]) => t + ' ' + P(rt[k].v)).join(', ') + ' (DNB/ECB). Wil de bezoeker zijn eigen bedrag weten, vraag dan zo nodig naar inkomen en schulden en wijs de rekenhulp op deze pagina aan.',
    faq: f1.map(([q, a]) => ({ q, a })) },
    { slug: 'hypotheekrente', pad: '/hypotheekrente', term: 'hypotheekrente', title: 'Hypotheekrente nu per rentevaste periode',
      kort: 'Gemiddelde rente op nieuwe hypotheken in Nederland in ' + maandNL(rt.maand || '2026-09') + ': ' + RV.filter(([k]) => rt[k]).map(([k, t]) => t + ' ' + P(rt[k].v)).join(', ') + ' (rentestatistiek DNB en ECB).',
      uitleg: 'Toetsrente: 10 jaar of langer vast je eigen rente, korter vast de AFM-toetsrente van minstens 5%. Renteaftrek hoogstens 37,56% (2026) en 38,16% (2027). Voor de maximale hypotheek: hypotheek-berekenen.', faq: f1.filter(f => /rente/i.test(f[0])).map(([q, a]) => ({ q, a })) }];
}
export async function llmsDeel() {
  const rt = await rentes().catch(() => rentesUit(RESERVE));
  return '\n\n## Hypotheek ([hypotheek berekenen](' + B + '/hypotheek-berekenen))\n\n- [Hypotheek berekenen 2027: maximale hypotheek en maandlasten](' + B + '/hypotheek-berekenen): rekenhulp met de officiële leennormen 2027 en 2026 (Regeling hypothecair krediet), studieschuld, energielabel, AOW, 100%/106% woningwaarde, maandlasten bruto en netto, kosten koper en NHG; bij € 50.000 en 5% in 2027 € 194.043; elk percentage met bron.\n- [Hypotheekrente nu per rentevaste periode](' + B + '/hypotheekrente): gemiddelde rente op nieuwe hypotheken in Nederland in ' + maandNL(rt.maand || '2026-09') + (rt.O ? ', ' + P(rt.O.v) + ' bij 5 tot 10 jaar vast' : '') + ', uit de rentestatistiek van DNB en de ECB, met 12 maanden verloop.';
}
export async function stand() { const rt = await rentes(); return { ok: true, uitleg: 'Rekenhulp hypotheek (lib/hypotheek.js, kern lib/hypotheek-kern.js): normen 2026 en 2027 met bron; rente uit ECB MIR (KV hyp:ecb, 12 uur).', paden: PADEN, rente: { maand: rt.maand, opgehaald: rt.opgehaald, F: rt.F, I: rt.I, O: rt.O, P: rt.P } }; }
