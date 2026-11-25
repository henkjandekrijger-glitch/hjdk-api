// Openbaar ANP-onderzoek naast de bestaande eigen claim. Geen automatische verzending of oordeel over individuele verschuldigdheid.
import fs from 'node:fs';
import { onderzoekBlok } from './wam-onderzoek.js';
import { eigenFotoclaims } from './wam-eigen-fotoclaims.js';
const BASIS = JSON.parse(fs.readFileSync(new URL('../data/wam/dossier-anp-2026-11-25.json', import.meta.url), 'utf8'));
const EXTRA = JSON.parse(fs.readFileSync(new URL('../data/wam/anp-perspectieven-2026-11-25.json', import.meta.url), 'utf8'));
// Bestaande numerieke bronverwijzingen behouden hun index. Aanvullende bronnen krijgen stabiele ids.
const bronnen = BASIS.bronnen.map((b, i) => ({ ...b, id: 'bestaand-' + i }));
for (const b of EXTRA.bronnen) { const bestaand = bronnen.find(x => x.url === b.url); if (bestaand) bestaand.id = b.id; else bronnen.push(b); }
export const ANP_DOSSIER = { ...BASIS, bewijsStatus: BASIS.bewijsStatus.replace(/acht openbare vonnissen/i, 'acht oorspronkelijke en twee aanvullende openbare uitspraken'), titel: EXTRA.titel, seoTitel: EXTRA.seoTitel, metaBeschrijving: EXTRA.kort, kort: EXTRA.kort, laatsteStukLabel: EXTRA.laatsteStukLabel, verdieping: EXTRA.verdieping, bedragen: BASIS.bedragen.map(b => b.label === 'Nagelezen uitspraken' ? { ...b, waarde: String(BASIS.onderzoek.rechtspraak.length + EXTRA.verdieping.find(s => s.id === 'rechtszaken').items.length) } : b), bronnen, bronverantwoording: BASIS.bronverantwoording + ' ' + EXTRA.bronverantwoordingAanvulling, vragen: [...BASIS.vragen, ...EXTRA.vragen] };
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const datum = s => { const [y, m, d] = s.split('-').map(Number); return '<time datetime="' + e(s) + '">' + d + ' ' + ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'][m - 1] + ' ' + y + '</time>'; };
const refs = (d, ids = []) => ids.length ? '<span class="anp-bronrefs"> ' + [...new Set(ids)].map(i => '<a href="#anp-bron-' + (i + 1) + '" aria-label="Bron ' + (i + 1) + ': ' + e(d.bronnen[i].naam) + '">[' + (i + 1) + ']</a>').join(' ') + '</span>' : '';
const paras = (d, list) => list.map(p => '<p>' + e(p.tekst) + refs(d, p.bronnen) + '</p>').join('');
export function anpOnderzoek(d) {
  if (d.id !== 'anp' || !d.onderzoek) return '';
  const o = d.onderzoek;
  return '<section id="verdiepingen"><h2>De eigen zaken en het geld achter de claim</h2><p><a class="text-link" href="#eigen-mailzaken">Bekijk de eigen zaken uit het mailarchief</a> · <a class="text-link" href="/fotoclaims-verdienmodel">Lees het onderzoek naar fotoclaims als verdienmodel</a></p></section>' + eigenFotoclaims() + onderzoekBlok(d) + '<section id="controle"><h2>ANP-fotoclaim ontvangen? Controleer dit eerst.</h2><ol class="checklist">' +
    o.controle.map(p => '<li><h3>' + e(p.kop) + '</h3><p>' + e(p.tekst) + refs(d, p.bronnen) + '</p></li>').join('') +
    '</ol></section><section id="werkwijze"><h2>ANP, VRG en Fair Licensing: wie doet wat?</h2>' + paras(d, o.werkwijze) +
    '<p class="note">Zakelijk contact via de officiële ANP Foto-pagina: <a class="text-link" href="tel:+31704141123">+31 70 4141 123</a>. ' + refs(d, [1]) + '</p></section>' +
    '<section id="rechtspraak"><h2>Acht uitspraken over ANP-fotoclaims</h2><p>' + e(o.rechtspraakNoot) + '</p><div class="table-scroll" tabindex="0" role="region" aria-label="Tabel met acht uitspraken">' +
    '<table class="case-table anp-rechtspraak"><caption>Uitspraakdatum, uitkomst en beslissende onderbouwing</caption><thead><tr><th scope="col">Zaak</th><th scope="col">Uitkomst en betekenis</th></tr></thead><tbody>' +
    o.rechtspraak.map(z => '<tr><th scope="row">' + datum(z.datum) + '<br>' + e(z.instantie) + '<br><a class="text-link" href="' + e(d.bronnen[z.bron].url) + '" target="_blank" rel="noopener noreferrer">' + e(z.ecli) + '</a></th><td><b>' + e(z.uitkomst) + '</b><p>' + e(z.kern) + '</p><details><summary>Wat volgt hier wel en niet uit?</summary><p>' + e(z.grens) + '</p><p class="meta"><a class="text-link" href="' + e(d.bronnen[z.bron].tekstUrl) + '" target="_blank" rel="noopener noreferrer">Volledige tekst bij Rechtspraak</a></p></details></td></tr>').join('') +
    '</tbody></table></div><p class="note">Een toegewezen vergoeding uit een andere zaak is geen uitspraak over de eigen claim hieronder. Ook een afwijzing geeft geen algemene vrijstelling voor fotogebruik.</p></section>' +
    '<section id="historisch"><h2>Historische foto’s en oude gebruiksvoorwaarden</h2>' + paras(d, o.historisch) + '</section>' +
    '<section id="openbare-ontwikkelingen"><h2>Wat veranderde er in 2026?</h2><p>Openbare berichten over andere ontvangers staan apart van de eigen claimtijdlijn.</p><div class="rows">' +
    o.publiek.map(z => '<article class="source"><p class="meta">' + datum(z.datum) + ' · openbare publicatie</p><h3>' + e(z.kop) + '</h3><p>' + e(z.tekst) + refs(d, z.bronnen) + '</p></article>').join('') + '</div></section>' +
    '<section id="begrippen"><h2>Vier veelvoorkomende misverstanden</h2><div class="rows">' + o.uitleg.map(p => '<div class="source"><h3>' + e(p.kop) + '</h3><p>' + e(p.tekst) + refs(d, p.bronnen) + '</p></div>').join('') + '</div></section>' +
    '<section id="onderzoeksvragen"><h2>Wat is nog niet opgehelderd?</h2><ul class="checklist">' + o.openVragen.map(v => '<li>' + e(v) + '</li>').join('') + '</ul><p class="note">Dit zijn open onderzoeksvragen. Ze worden niet als bewezen tekortkomingen of als een al verstuurd wederhoorverzoek gepresenteerd.</p></section>';
}
export function anpKostenContext(d) {
  return d.id === 'anp' && d.onderzoek ? '<section id="kosten-vergelijken"><h2>Hoe verhoudt deze kostenopbouw zich tot andere claims?</h2>' + paras(d, d.onderzoek.kostenContext) + '</section>' : '';
}
export const ANP_CSS = '.anp-bronrefs{font-size:16px;white-space:nowrap}.anp-bronrefs a,.anp-rechtspraak a{text-decoration:underline;text-underline-offset:3px}.anp-rechtspraak{font-size:16px}.anp-rechtspraak th,.anp-rechtspraak td{padding:18px 12px 18px 0;text-align:left!important;white-space:normal!important;overflow-wrap:anywhere}.anp-rechtspraak th{width:38%;min-width:145px}.anp-rechtspraak td{min-width:240px}.anp-rechtspraak p{margin:8px 0}.anp-rechtspraak summary{font-size:16px}.anp-rechtspraak details{margin-top:10px}.anp-sprong{font-size:16px;line-height:2}.anp-sprong a{text-decoration:underline;text-underline-offset:3px}.anp-onderzoeksbron{scroll-margin-top:24px}';

