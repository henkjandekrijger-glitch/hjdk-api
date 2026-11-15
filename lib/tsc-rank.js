// Rankings van klinieken en chirurgen op todayin surgery (Henkjan 14 nov 2026: "Ik moet echt rankings gaan zien van klinieken en chirurgen
// door alle data te verzamelen en reviews en dan een conclusie te trekken die je schrijft en laten we dat vooral zoveel mogelijk op data baseren").
// Data per lijst in data/tsc-rank.json (verzameld door onderzoekers, elk feit met bron en datum). De score rekent deze module uit, altijd
// dezelfde openbare methode (METHODE hieronder en op elke pagina). Geen kliniek betaalt. Te weinig data = geen plek, wel genoemd.
// Geen aggregateRating in de JSON-LD (scores van derden horen daar niet), wel een ItemList.
import RANK from '../data/tsc-rank.json' with { type: 'json' };

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const N = v => { const n = Number(String(v == null ? '' : v).replace(',', '.')); return Number.isFinite(n) ? n : null; };

// ---------- de methode ----------
// Kwalificaties 30, vergunning en accreditatie 15, patiëntervaringen 30, openheid 15, risico tot -20. Rangen alleen bij genoeg data.
export const METHODE = { kwal: 30, verg: 15, erv: 30, open: 15, risico: -20, minReviews: 100, bayesM: 50, bayesC: 4.0 };

function ervaring(reviews) {
  // gewogen gemiddelde over alle platforms met een score en een aantal; Bayesiaans naar 4,0 getrokken zodat weinig reviews weinig zeggen
  const r = (reviews || []).filter(x => N(x.score) != null && N(x.aantal) > 0 && N(x.score) <= 5);
  const n = r.reduce((a, x) => a + N(x.aantal), 0); if (!n) return { punten: 0, gem: null, n: 0 };
  const gem = r.reduce((a, x) => a + N(x.score) * N(x.aantal), 0) / n;
  const bayes = (n * gem + METHODE.bayesM * METHODE.bayesC) / (n + METHODE.bayesM);
  let p = Math.max(0, Math.min(25, (bayes - 3.5) / 1.5 * 25)) + Math.min(5, Math.log10(Math.max(1, n)) * 1.5);
  if (r.some(x => x.waarschuwing)) p -= 5; // platform waarschuwt (bijv. Trustpilot over nepreviews of uitnodigen)
  const pct1 = r.filter(x => N(x.pct_1ster) != null); if (pct1.length && pct1.some(x => N(x.pct_1ster) >= 15)) p -= 3; // veel 1-sterrenreviews
  return { punten: Math.max(0, Math.round(p * 10) / 10), gem: Math.round(gem * 100) / 100, n };
}
export function scoor(k) {
  const s = k.signalen || {};
  const kwal = Math.min(METHODE.kwal, (s.ishrs ? (/fellow|fishrs/i.test(String(s.ishrs)) ? 18 : 15) : 0) + (s.abhrs ? 10 : 0) + (s.specialist ? 5 : 0));
  const verg = (s.healthturkiye === 'ja' ? 10 : 0) + (s.jci ? 5 : 0);
  const e = ervaring(k.reviews);
  const o = k.openheid || {};
  const open = (o.prijs ? 5 : 0) + (o.arts_opereert === 'ja' ? 7 : o.arts_opereert === 'deels' ? 3 : 0) + (o.garantie ? 3 : 0);
  const ernst = (k.risico || []).reduce((a, x) => a + (x.ernst === 'zwaar' ? 10 : x.ernst === 'middel' ? 5 : 2), 0);
  const risico = -Math.min(20, ernst);
  const categorieen = [kwal + verg > 0, e.n > 0, open > 0].filter(Boolean).length;
  const genoeg = e.n >= METHODE.minReviews && categorieen >= 2;
  const totaal = Math.max(0, Math.round((kwal + verg + e.punten + open + risico) * 10) / 10);
  return { totaal, kwal, verg, erv: e.punten, gem: e.gem, n: e.n, open, risico, genoeg };
}

const T = {
  en: { methode: 'How we score', pnt: 'points', rang: 'Rank', kliniek: 'Clinic', stad: 'City', score: 'Score', reviews: 'Reviews', te: 'Not enough public data to rank yet', kwal: 'Qualifications', verg: 'Licence and accreditation', erv: 'Patient reviews', open: 'Transparency', risico: 'Reported risks', bronnen: 'Sources', bijgewerkt: 'Data checked', concl: 'Our conclusion', corr: 'Clinic owner or doctor? Send a correction with a source and we check it within a day.', corrK: 'Send correction', corrOk: 'Thank you. We check it and update the page if the source holds.', gemid: 'average', van: 'from', site: 'website', artsen: 'Lead doctors', geen: 'none reported',
    uitleg: m => ['Qualifications, up to ' + m.kwal + ' points: lead doctor is a member (15) or fellow (18) of the ISHRS, a diplomate of the ABHRS (10), a dermatologist or plastic surgeon (5).', 'Licence and accreditation, up to ' + m.verg + ': listed as licensed on HealthTurkiye (10), JCI accreditation (5).', 'Patient reviews, up to ' + m.erv + ': all platforms together, weighted by the number of reviews and pulled towards 4.0 when there are few, plus a small bonus for volume. Minus points when a platform shows a warning or many 1-star reviews.', 'Transparency, up to ' + m.open + ': price published (5), the named doctor does the key steps himself (7, partly 3), written guarantee or 12-month follow-up (3).', 'Reported risks, up to ' + m.risico + ': deaths, regulator rulings or licence problems reported by reliable sources (-10 each), lawsuits (-5), smaller issues (-2).', 'A clinic is ranked only with at least ' + m.minReviews + ' reviews and data in two of the groups. No clinic pays to be listed. Scores are our calculation from public data on the date shown, not medical advice.'] },
  nl: { methode: 'Zo scoren we', pnt: 'punten', rang: 'Plek', kliniek: 'Kliniek', stad: 'Stad', score: 'Score', reviews: 'Reviews', te: 'Nog te weinig openbare data voor een plek', kwal: 'Kwalificaties', verg: 'Vergunning en accreditatie', erv: 'Ervaringen van patiënten', open: 'Openheid', risico: 'Gemelde risico\'s', bronnen: 'Bronnen', bijgewerkt: 'Data gecontroleerd', concl: 'Onze conclusie', corr: 'Eigenaar of arts van een kliniek? Stuur een correctie met bron, dan kijken we het binnen een dag na.', corrK: 'Stuur correctie', corrOk: 'Dank je. We kijken het na en passen de pagina aan als de bron klopt.', gemid: 'gemiddeld', van: 'uit', site: 'website', artsen: 'Artsen', geen: 'geen gemeld',
    uitleg: m => ['Kwalificaties, tot ' + m.kwal + ' punten: de hoofdarts is lid (15) of fellow (18) van de ISHRS, diplomate van de ABHRS (10), dermatoloog of plastisch chirurg (5).', 'Vergunning en accreditatie, tot ' + m.verg + ': met vergunning in HealthTurkiye (10), JCI-accreditatie (5).', 'Ervaringen van patiënten, tot ' + m.erv + ': alle platforms samen, gewogen naar het aantal reviews en naar 4,0 getrokken als het er weinig zijn, plus een kleine bonus voor het aantal. Aftrek als een platform waarschuwt of bij veel 1-sterrenreviews.', 'Openheid, tot ' + m.open + ': prijs staat erbij (5), de genoemde arts doet de belangrijkste stappen zelf (7, deels 3), schriftelijke garantie of controle na 12 maanden (3).', 'Gemelde risico\'s, tot ' + m.risico + ': overlijden, uitspraken van toezichthouders of vergunningsproblemen uit betrouwbare bronnen (-10 elk), rechtszaken (-5), kleinere zaken (-2).', 'Een kliniek krijgt pas een plek met minstens ' + m.minReviews + ' reviews en data in twee groepen. Geen kliniek betaalt voor een plek. De score is onze berekening uit openbare data op de genoemde datum, geen medisch advies.'] },
  de: { methode: 'So bewerten wir', pnt: 'Punkte', rang: 'Platz', kliniek: 'Klinik', stad: 'Stadt', score: 'Punkte', reviews: 'Bewertungen', te: 'Noch zu wenig öffentliche Daten für einen Platz', kwal: 'Qualifikation', verg: 'Lizenz und Akkreditierung', erv: 'Patientenbewertungen', open: 'Transparenz', risico: 'Gemeldete Risiken', bronnen: 'Quellen', bijgewerkt: 'Daten geprüft', concl: 'Unser Fazit', corr: 'Inhaber oder Arzt einer Klinik? Schicken Sie eine Korrektur mit Quelle, wir prüfen sie innerhalb eines Tages.', corrK: 'Korrektur senden', corrOk: 'Danke. Wir prüfen es und ändern die Seite, wenn die Quelle stimmt.', gemid: 'Durchschnitt', van: 'aus', site: 'Website', artsen: 'Ärzte', geen: 'keine gemeldet',
    uitleg: m => ['Qualifikation, bis ' + m.kwal + ' Punkte: der leitende Arzt ist Mitglied (15) oder Fellow (18) der ISHRS, Diplomate des ABHRS (10), Dermatologe oder plastischer Chirurg (5).', 'Lizenz und Akkreditierung, bis ' + m.verg + ': lizenziert laut HealthTurkiye (10), JCI-Akkreditierung (5).', 'Patientenbewertungen, bis ' + m.erv + ': alle Plattformen zusammen, nach Anzahl gewichtet und bei wenigen Bewertungen Richtung 4,0 gezogen, dazu ein kleiner Bonus für die Menge. Abzug bei Warnungen einer Plattform oder vielen 1-Stern-Bewertungen.', 'Transparenz, bis ' + m.open + ': Preis veröffentlicht (5), der genannte Arzt macht die wichtigsten Schritte selbst (7, teilweise 3), schriftliche Garantie oder Kontrolle nach 12 Monaten (3).', 'Gemeldete Risiken, bis ' + m.risico + ': Todesfälle, Entscheidungen von Behörden oder Lizenzprobleme aus verlässlichen Quellen (-10 je Fall), Klagen (-5), kleinere Fälle (-2).', 'Einen Platz bekommt eine Klinik erst ab ' + m.minReviews + ' Bewertungen und mit Daten in zwei Gruppen. Keine Klinik zahlt für einen Platz. Die Punkte sind unsere Berechnung aus öffentlichen Daten am genannten Datum, keine medizinische Beratung.'] }
};

export const LIJSTEN = RANK.lijsten || {};
// slug -> { lijst, taal }
export const RANK_SLUGS = Object.fromEntries(Object.entries(LIJSTEN).flatMap(([id, l]) => Object.entries(l.slugs || {}).map(([tl, s]) => [s, { id, taal: tl }])));

export function gerangschikt(id) {
  const l = LIJSTEN[id]; if (!l) return { rang: [], weinig: [] };
  const alle = (l.klinieken || []).map(k => ({ ...k, s: scoor(k) }));
  const rang = alle.filter(k => k.s.genoeg).sort((a, b) => b.s.totaal - a.s.totaal || b.s.n - a.s.n);
  const weinig = alle.filter(k => !k.s.genoeg).sort((a, b) => a.naam.localeCompare(b.naam));
  return { rang, weinig };
}

// HTML-inhoud van de pagina (de omlijsting, chat en aanmelding komen uit lib/tsc.js)
export function rankBody(id, taal, cite, used) {
  const l = LIJSTEN[id], t = T[taal] || T.en, { rang, weinig } = gerangschikt(id), tx = l.tekst[taal] || l.tekst.en;
  const bron = (u, label) => u ? ' <a href="' + esc(u) + '" rel="nofollow noopener" target="_blank">' + esc(label || 'bron') + '</a>' : '';
  const rij = (k, i) => '<tr><td>' + (i + 1) + '</td><td><a href="#k-' + esc(k.id) + '">' + esc(k.naam) + '</a></td><td>' + esc(k.stad || '') + '</td><td><strong>' + k.s.totaal + '</strong></td><td>' + (k.s.gem != null ? k.s.gem.toLocaleString(taal) + ' (' + k.s.n.toLocaleString(taal) + ')' : '') + '</td></tr>';
  let h = '<div class="answer"><p>' + cite(tx.kort, used) + '</p></div><p class="meta"><time datetime="' + esc(l.gecontroleerd) + '">' + esc(t.bijgewerkt) + ' ' + esc(l.gecontroleerd) + '</time></p>';
  h += '<div class="tabel" role="region" aria-label="' + esc(tx.h1) + '" tabindex="0"><table><thead><tr><th>' + t.rang + '</th><th>' + t.kliniek + '</th><th>' + t.stad + '</th><th>' + t.score + '</th><th>' + t.reviews + '</th></tr></thead><tbody>' + rang.map(rij).join('') + '</tbody></table></div>';
  h += '<details class="methode"><summary>' + esc(t.methode) + '</summary><ol>' + t.uitleg(METHODE).map(x => '<li>' + esc(x) + '</li>').join('') + '</ol></details>';
  for (const [i, k] of rang.entries()) h += kaart(k, i + 1, t, taal, bron);
  if (weinig.length) h += '<h2>' + esc(t.te) + '</h2><ul>' + weinig.map(k => '<li id="k-' + esc(k.id) + '">' + esc(k.naam) + (k.stad ? ', ' + esc(k.stad) : '') + (k.conclusie && k.conclusie[taal] ? ': ' + esc(k.conclusie[taal]) : '') + '</li>').join('') + '</ul>';
  h += '<section class="mail" id="correctie"><p>' + esc(t.corr) + '</p><form class="mf" id="tsc-c"><input id="tsc-ck" placeholder="' + esc(t.kliniek) + '" maxlength="120" aria-label="' + esc(t.kliniek) + '"><input id="tsc-ct" placeholder="' + esc(t.bronnen) + ' (URL) + ..." maxlength="1000" aria-label="' + esc(t.bronnen) + '"><button class="b" type="submit">' + esc(t.corrK) + '</button></form><p class="klein" id="tsc-cn"></p></section>';
  return h;
}
function kaart(k, plek, t, taal, bron) {
  const s = k.s, c = (k.conclusie && (k.conclusie[taal] || k.conclusie.en)) || '';
  const regel = (lbl, pnt, max, extra) => '<li><strong>' + esc(lbl) + '</strong>: ' + pnt + (max != null ? ' / ' + max : '') + ' ' + esc(t.pnt) + (extra ? '. ' + extra : '') + '</li>';
  const sig = k.signalen || {}, o = k.openheid || {};
  const kwalTxt = [sig.ishrs ? 'ISHRS' + bron(sig.ishrs_bron, '') : '', sig.abhrs ? 'ABHRS' + bron(sig.abhrs_bron, '') : '', sig.specialist ? esc(sig.specialist) + bron(sig.specialist_bron, '') : ''].filter(Boolean).join(', ');
  const vergTxt = [sig.healthturkiye === 'ja' ? 'HealthTurkiye' + bron(sig.healthturkiye_bron, '') : '', sig.jci ? 'JCI' + bron(sig.jci_bron, '') : ''].filter(Boolean).join(', ');
  const revTxt = (k.reviews || []).filter(x => N(x.score) != null).map(x => esc(x.platform) + ' ' + N(x.score).toLocaleString(taal) + ' (' + (N(x.aantal) || 0).toLocaleString(taal) + ')' + bron(x.bron, '') + (x.waarschuwing ? ' [' + esc(x.waarschuwing) + ']' : '')).join(', ');
  const openTxt = [o.prijs ? esc(o.prijs) + bron(o.prijs_bron, '') : '', o.arts_tekst ? esc(o.arts_tekst) + bron(o.arts_bron, '') : '', o.garantie ? esc(o.garantie) + bron(o.garantie_bron, '') : ''].filter(Boolean).join('. ');
  const risTxt = (k.risico || []).map(x => esc(x.wat) + (x.datum ? ' (' + esc(x.datum) + ')' : '') + bron(x.bron, '')).join('. ');
  return '<section class="kaart" id="k-' + esc(k.id) + '"><h2>' + plek + '. ' + esc(k.naam) + (k.stad ? ', ' + esc(k.stad) : '') + ' <span class="sc">' + s.totaal + '</span></h2>' + (c ? '<p><strong>' + esc(t.concl) + ':</strong> ' + esc(c) + '</p>' : '') +
    '<ul class="deel">' + regel(t.kwal, s.kwal, METHODE.kwal, kwalTxt) + regel(t.verg, s.verg, METHODE.verg, vergTxt) + regel(t.erv, s.erv, METHODE.erv, revTxt) + regel(t.open, s.open, METHODE.open, openTxt) + regel(t.risico, s.risico, null, risTxt || esc(t.geen)) + '</ul>' +
    ((k.artsen || []).length ? '<p class="meta">' + esc(t.artsen) + ': ' + k.artsen.map(a => esc(a.naam) + (a.titel ? ' (' + esc(a.titel) + ')' : '') + bron(a.bron, '')).join(', ') + (k.site ? ' · <a href="' + esc(k.site) + '" rel="nofollow noopener" target="_blank">' + esc(t.site) + '</a>' : '') + '</p>' : '') + '</section>';
}
export const RANK_CSS = '.tabel{overflow-x:auto;margin:16px 0}table{border-collapse:collapse;width:100%;font-size:16px}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}th{font-weight:700}.kaart{border-top:1px solid var(--line);padding-top:8px}.kaart h2{font-size:24px}.kaart .sc{color:var(--acc);white-space:nowrap}.deel{font-size:16px}.methode{margin:16px 0}';
export function rankLd(id, taal, url) {
  const l = LIJSTEN[id], tx = l.tekst[taal] || l.tekst.en, { rang } = gerangschikt(id);
  return { '@type': 'ItemList', name: tx.h1, url, numberOfItems: rang.length, itemListOrder: 'https://schema.org/ItemListOrderDescending', itemListElement: rang.map((k, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'MedicalClinic', name: k.naam, ...(k.site ? { url: k.site } : {}), ...(k.stad ? { address: { '@type': 'PostalAddress', addressLocality: k.stad, addressCountry: l.land || '' } } : {}) } })) };
}
