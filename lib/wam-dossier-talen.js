import { personenMedia } from './wam-personen.js';
// Vertaalde dossierpagina's (Henkjan 25 nov 2026: "Vertaal errezeta eerst in engels en duits en italiaans en zet dat er netjes bij").
// Bron: data/wam/dossier-errezeta-i18n.json, zelfde volgorde als het Nederlandse dossier. Paden /en|de|it/dossier/errezeta.
// De pagina's volgen de opmaak van het Nederlandse dossier; de reacties gaan naar dezelfde moderatie (op=dreactie, bedrijf errezeta).
import fs from 'node:fs';
import { DOSSIERLIJST, DEEL_JS, zichtBlok, deelBlok } from './wam-dossiers.js';

const I18N = JSON.parse(fs.readFileSync(new URL('../data/wam/dossier-errezeta-i18n.json', import.meta.url), 'utf8'));
export const DOSSIER_TALEN = { errezeta: ['en', 'de', 'it'] };
export const TAAL_PADEN = Object.entries(DOSSIER_TALEN).flatMap(([id, t]) => t.map(x => x + '/dossier/' + id));
const LOCALE = { en: 'en-GB', de: 'de-DE', it: 'it-IT', nl: 'nl-NL' };
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tijd = (d, taal) => { const [y, m, n] = d.split('-').map(Number); return '<time datetime="' + d + '">' + new Date(Date.UTC(y, m - 1, n)).toLocaleDateString(LOCALE[taal], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) + '</time>'; };
const EUR = (n, taal) => '€' + Number(n).toLocaleString(LOCALE[taal], { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const bron = (url, naam) => '<a href="' + e(url) + '" rel="nofollow noopener" target="_blank">' + e(naam) + '</a>';

// Alle taalversies van een dossier, voor hreflang en de taalregel. Nederlands is de standaard (x-default).
export function dossierAlternates(id) {
  const t = DOSSIER_TALEN[id]; if (!t) return null;
  return [{ taal: 'nl', pad: '/dossier/' + id }, ...t.map(x => ({ taal: x, pad: '/' + x + '/dossier/' + id }))];
}
export function taalRegel(id, huidig) {
  const alt = dossierAlternates(id); if (!alt) return '';
  const naam = { nl: 'Nederlands', en: 'English', de: 'Deutsch', it: 'Italiano' };
  const kop = { nl: 'Dit dossier in', en: 'This dossier in', de: 'Dieses Dossier auf', it: 'Questo dossier in' }[huidig];
  return '<p class="meta taalregel">' + kop + ': ' + alt.map(a => a.taal === huidig ? '<b>' + naam[a.taal] + '</b>' : '<a href="' + a.pad + '" hreflang="' + a.taal + '" lang="' + a.taal + '">' + naam[a.taal] + '</a>').join(' · ') + '</p>';
}

function form(id, naam, T) {
  const L = T.L, fid = 'ervaring-' + id + '-' + T._taal;
  return '<div class="reader" id="reageren"><form class="reader-form" method="post" action="/api/wam?op=dreactie" data-bedrijf="' + e(id) + '" data-bezig="' + e(L.bezig) + '" data-dank="' + e(L.bedankt) + '" data-wis="' + e(L.wis) + '" data-fout="' + e(L.fout) + '"><label class="sr-only" for="' + fid + '">' + e(T.oproep.knop) + '</label><div class="composer"><textarea id="' + fid + '" name="tekst" rows="1" minlength="20" maxlength="2000" required placeholder="' + e(T.oproep.placeholder) + '"></textarea><button class="primary" type="submit" aria-label="' + e(T.oproep.knop) + '"><span aria-hidden="true">→</span></button></div><label class="trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><p class="consent-note">' + e(L.consent) + ' <a href="/privacy#lezersreacties">' + e(L.privacy) + '</a>.</p></form><p class="msg" role="status"></p></div>';
}

export function vertaaldDossier(p, groepen, h) {
  const m = /^(en|de|it)\/dossier\/([a-z0-9-]+)$/.exec(p); if (!m) return null;
  const [, taal, id] = m; if (!(DOSSIER_TALEN[id] || []).includes(taal)) return null;
  const d = DOSSIERLIJST.find(x => x.id === id), T = { ...I18N[taal], _taal: taal }, L = T.L;
  const betalingen = '<section id="betalingen"><h2>' + e(L.betalingenKop) + '</h2><div class="table-scroll"><table class="case-table"><caption>' + e(L.betalingenCaption) + '</caption><thead><tr><th scope="col">' + e(L.datumKol) + '</th><th scope="col">' + e(L.bedragKol) + '</th></tr></thead><tbody>' + d.betalingen.map((b, i) => '<tr><th scope="row">' + tijd(b.datum, taal) + '<br>' + e(T.betalingen[i]) + '</th><td>' + EUR(b.bedrag, taal) + '</td></tr>').join('') + '<tr class="total"><th scope="row">' + e(L.totaal) + '</th><td>' + EUR(d.betalingen.reduce((s, b) => s + b.bedrag, 0), taal) + '</td></tr></tbody></table></div><p class="note">' + e(L.betalingenNoot) + '</p></section>';
  const tl = d.tijdlijn.map((t, i) => [t, T.tijdlijn[i], i]).sort((a, b) => b[0].datum.localeCompare(a[0].datum) || b[2] - a[2]);
  const tijdlijn = '<section id="tijdlijn"><h2>' + e(L.tijdlijnKop) + '</h2><p class="meta">' + e(L.nieuwste) + '</p><ol class="dossier-tijdlijn">' + tl.map(([t, v]) => '<li><p class="meta">' + tijd(t.datum, taal) + '</p><h3>' + e(v.kop) + '</h3><p>' + e(v.tekst) + '</p><p class="meta">' + e(v.bron) + '</p></li>').join('') + '</ol></section>';
  const onderbouwing = '<section id="onderbouwing"><h2>' + e(L.gecontroleerdKop) + '</h2><p>' + e(T.bronverantwoording) + '</p><h3>' + e(L.besloten) + '</h3><div class="rows">' + T.documenten.map(s => '<div class="row"><b>' + e(s.naam) + '</b><p>' + e(s.status) + '</p></div>').join('') + '</div><div class="rows">' + d.bronnen.map((s, i) => '<div class="source"><h3>' + bron(s.url, (T.bronnenNaam || [])[i] || s.naam) + '</h3><p>' + e(T.bronnenUitleg[i] || s.uitleg) + '</p><p class="meta">' + e(L.geraadpleegd) + ' ' + tijd(d.bijgewerkt, taal) + '</p></div>').join('') + '</div></section>';
  const leiding = (d.leiding || []).map(l => '<p><b>' + e(l.naam) + '</b> · ' + e(T.leidingFunctie) + '</p>' + personenMedia(l.naam, { taal }) + '<p class="meta">' + bron(l.bron, 'Companies House') + ' · ' + e(L.geraadpleegd) + ' ' + tijd(l.datum, taal) + '</p>').join('');
  const eigen = '<details class="sources" id="eigen-dossier"><summary>' + e(L.eigenDossier) + '</summary><p class="dossier-status"><b>' + e(L.stand) + '</b> ' + e(T.status) + '</p><section><h2>' + e(L.stukkenKop) + '</h2>' + T.feiten.map(f => '<p>' + e(f) + '</p>').join('') + '</section>' + betalingen + tijdlijn + onderbouwing + '<section id="bedrijf"><h2>' + e(L.bedrijfKop) + '</h2><p>' + e(T.reactieBedrijf) + '</p></section><section class="responsible"><h2>' + e(L.leidingKop) + '</h2>' + leiding + '<p class="note">' + e(L.leidingNoot) + '</p></section><section><h2>' + e(L.openKop) + '</h2><p>' + e(T.volgendeStap) + '</p></section></details>';
  const zicht = d.zicht ? zichtBlok({ ...d.zicht, metingen: d.zicht.metingen.map((z, i) => ({ ...z, bron: T.zichtBron[i] || z.bron, zegt: T.zicht[i] || z.zegt })) }, { kop: L.zichtKop, meta: L.zichtMeta, veranderd: L.zichtVeranderd }, s => tijd(s, taal)) : '';
  const vragen = '<section id="vragen"><h2>' + e(L.vragenKop) + '</h2>' + T.vragen.map(q => '<div class="dossier-vraag"><h3>' + e(q.vraag) + '</h3><p>' + e(q.antwoord) + '</p></div>').join('') + '</section>';
  const reacties = (groepen && groepen.length) ? h.reactiesBlok(groepen) : '<p>' + e(L.reactiesLeeg) + '</p>';
  const faq = { '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: taal, mainEntity: T.vragen.map(q => ({ '@type': 'Question', name: q.vraag, acceptedAnswer: { '@type': 'Answer', text: q.antwoord } })) };
  return { pad: '/' + taal + '/dossier/' + id, taal, alternates: dossierAlternates(id), geenVolg: true, titel: T.seoTitel, desc: T.kort, volgTitel: L.volg,
    body: '<main id="inhoud" lang="' + taal + '"><p class="meta"><a href="/">' + e(L.voorkant) + '</a> · <a href="/dossiers">' + e(L.dossiers) + '</a></p>' + taalRegel(id, taal) + '<p class="eyebrow">' + e(L.eyebrow) + '</p><h1>' + e(T.titel) + '</h1><p>' + e(T.kort) + '</p>' + form(id, d.naam, T) + deelBlok(d, h, taal, '/' + taal + '/dossier/' + id, T.titel) + '<p class="meta">' + e(L.watIs) + '</p><div class="acts"><a class="text-link" href="#aanleiding">' + e(L.waarom) + '</a></div><p class="meta">' + e(L.bijgewerkt) + ' ' + tijd(d.bijgewerkt, taal) + '</p><section><h2>' + e(L.doelKop) + '</h2><p>' + e(T.oproep.doel) + '</p><p>' + L.henkjan + '</p></section>' + zicht + '<section id="oproep-reacties"><h2>' + e(L.reactiesKop) + '</h2>' + reacties + '</section><section id="aanleiding"><h2>' + e(L.aanleidingKop) + '</h2><p>' + e(T.oproep.aanleiding) + '</p>' + eigen + '</section>' + vragen + '</main><script type="application/ld+json">' + JSON.stringify(faq).replace(/</g, '\\u003c') + '</script>',
    script: h.readerScript + DEEL_JS };
}
