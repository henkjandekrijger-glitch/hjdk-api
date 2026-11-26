// We are many now buiten Nederland (Henkjan 26 nov 2026: "Vind top 10 in die landen en voeg toe zodat we SEO en LLM tractie gaan krijgen ism
// demandradar . Ook duitsland ."). Per markt (VS, VK, Canada, Duitsland) één pagina met de tien bedrijven waarover mensen het vaakst zoeken hoe
// ze opzeggen of geld terugkrijgen, gemeten met Demand Radar (data/wam/intl-top10-2026-11-26.json). Eigen data met datum en methode: dat is wat
// zoekmachines en AI-assistenten kunnen citeren. Per bedrijf een knop Me too / Ich auch (op=dmetoo, wmn:metoo, een keer per bezoeker per dag).
// E-mailaanmelding met scope = markt (lib/wam-aanmelden.js INTL_TAAL), welkomstmail in het Engels of Duits via Mailmind-stromen wam-volg-en en wam-volg-de.
import fs from 'node:fs';

export const INTL = JSON.parse(fs.readFileSync(new URL('../data/wam/intl-top10-2026-11-26.json', import.meta.url), 'utf8'));
export const INTL_MARKTEN = Object.keys(INTL.markten);
export const INTL_PADEN = INTL_MARKTEN;
const HREF = { us: 'en-US', uk: 'en-GB', ca: 'en-CA', de: 'de-DE' };
export const intlAlternates = () => INTL_MARKTEN.map(m => ({ taal: HREF[m], pad: '/' + m }));
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const intlItem = (m, id) => INTL.markten[m]?.items.find(x => x.id === id) || null;

const T = {
  en: {
    datum: '26 November 2026',
    seo: M => 'What ' + M.inwoners + ' most search to cancel or get money back (2026 data) | we are many now',
    desc: (M, top) => 'Top 10 companies ' + M.inwoners + ' search how to cancel or get money back from, ranked by monthly Google searches on 26 November 2026. Number one: ' + top.naam + '.',
    eyebrow: M => 'Search data · ' + M.land + ' · 26 November 2026',
    h1: M => 'The ten companies ' + M.inwoners + ' most search to cancel or get money back from.',
    lead: M => 'Every month, ' + M.inwoners + ' type these questions into Google. One line per company, ranked by monthly searches. We are many now bundles single complaints, so a company can no longer treat them as one-offs.',
    getal: v => 'about ' + v.toLocaleString('en-US') + ' searches a month',
    trend: y => y > 0 ? 'up ' + y + '% on a year ago' : y < 0 ? 'down ' + Math.abs(y) + '% on a year ago' : 'level with a year ago',
    metoo: 'Me too', geteld: 'Counted. Thank you.', n: n => n.toLocaleString('en-US') + (n === 1 ? ' person said me too' : ' people said me too'),
    oproepKop: 'Stuck with one of these?',
    oproep: 'Tap Me too at that company. It counts once a day per visitor, and the total stays on this page. Once many people count in for one company, we ask that company for a response and publish it here.',
    methodeKop: 'How we measured',
    methode: M => 'Source: Demand Radar, the search-data tool of we are many now. It collects what people type into Google and Bing in ' + M.land + ' and adds monthly search volumes from Google Ads, measured on 26 November 2026. These are estimates. Variants of the same question are not added up: per company we show its largest single search term. The year-on-year change compares the latest month with the same month a year earlier.',
    andereKop: 'Other countries',
    vragenKop: 'Questions',
    vragen: (M, top) => [
      { vraag: 'Which company do ' + M.inwoners + ' search most often about cancelling or getting money back?', antwoord: top.naam + '. The search “' + top.k + '” gets ' + T.en.getal(top.v) + ' in ' + M.land + ' (Google Ads estimate, November 2026).' },
      { vraag: 'Is this a list of the worst companies?', antwoord: 'No. It ranks how often people search how to cancel or get money back. A company with many customers can rank high without treating them worse. It does show where many people get stuck.' },
      { vraag: 'What happens when I tap Me too?', antwoord: 'Your tap is added to the total for that company, once a day. We do not ask for your name or email. The totals are public on this page.' }],
    land: { us: 'US', uk: 'UK', ca: 'Canada', de: 'Deutschland' }, nl: 'Nederland (Dutch dossiers)',
    volgKop: 'Get the step-by-step guide by email.', volg: 'We are writing a guide per company, starting with number one. Leave your email and we send it when it is ready, plus the company\'s answer once it replies.',
    email: 'Your email address', knop: 'Send me the guide', consent: 'By signing up you agree to these emails. Unsubscribe with one click in every email.', ok: 'Done. Check your inbox for a short welcome note.', naTik: 'Want the guide when it is ready?'
  },
  de: {
    datum: '26. November 2026',
    seo: () => 'Was Menschen in Deutschland am häufigsten kündigen wollen (Daten 2026) | we are many now',
    desc: (M, top) => 'Die zehn Unternehmen, bei denen Menschen in Deutschland am häufigsten suchen, wie sie kündigen, sich beschweren oder Geld zurückbekommen. Gemessen am 26. November 2026. Platz eins: ' + top.naam + '.',
    eyebrow: () => 'Suchdaten · Deutschland · 26. November 2026',
    h1: () => 'Die zehn Unternehmen, bei denen Menschen in Deutschland am häufigsten nach Kündigung, Beschwerde oder Geld zurück suchen.',
    lead: () => 'Jeden Monat tippen Menschen in Deutschland diese Fragen bei Google ein. Eine Zeile pro Unternehmen, sortiert nach monatlichen Suchanfragen. We are many now bündelt einzelne Beschwerden, damit ein Unternehmen sie nicht mehr als Einzelfälle abtun kann.',
    getal: v => 'etwa ' + v.toLocaleString('de-DE') + ' Suchanfragen pro Monat',
    trend: y => y > 0 ? y + ' % mehr als vor einem Jahr' : y < 0 ? Math.abs(y) + ' % weniger als vor einem Jahr' : 'so viel wie vor einem Jahr',
    metoo: 'Ich auch', geteld: 'Gezählt. Danke.', n: n => n.toLocaleString('de-DE') + (n === 1 ? ' Person sagt: ich auch' : ' Personen sagen: ich auch'),
    oproepKop: 'Steckst du bei einem davon fest?',
    oproep: 'Tippe bei diesem Unternehmen auf Ich auch. Es zählt einmal pro Tag und Besucher, die Summe bleibt auf dieser Seite. Wenn viele Menschen bei einem Unternehmen mitzählen, bitten wir es um eine Stellungnahme und veröffentlichen sie hier.',
    methodeKop: 'So haben wir gemessen',
    methode: () => 'Quelle: Demand Radar, das Suchdaten-Werkzeug von we are many now. Es sammelt, was Menschen in Deutschland bei Google und Bing eintippen, und ergänzt die monatlichen Suchvolumen aus Google Ads, gemessen am 26. November 2026. Das sind Schätzungen. Varianten derselben Frage werden nicht addiert: Pro Unternehmen zeigen wir den größten einzelnen Suchbegriff. Die Veränderung vergleicht den letzten Monat mit demselben Monat ein Jahr zuvor.',
    andereKop: 'Andere Länder',
    vragenKop: 'Fragen',
    vragen: (M, top) => [
      { vraag: 'Bei welchem Unternehmen suchen Menschen in Deutschland am häufigsten nach Kündigung oder Geld zurück?', antwoord: top.naam + '. Die Suche „' + top.k + '“ hat ' + T.de.getal(top.v) + ' (Schätzung aus Google Ads, November 2026).' },
      { vraag: 'Ist das eine Liste der schlechtesten Unternehmen?', antwoord: 'Nein. Sie zeigt, wie oft Menschen suchen, wie sie kündigen, sich beschweren oder Geld zurückbekommen. Ein Unternehmen mit vielen Kunden kann weit oben stehen, ohne sie schlechter zu behandeln. Sie zeigt aber, wo viele Menschen hängen bleiben.' },
      { vraag: 'Was passiert, wenn ich auf Ich auch tippe?', antwoord: 'Dein Tippen zählt einmal pro Tag für dieses Unternehmen. Wir fragen nicht nach Name oder E-Mail. Die Summen stehen öffentlich auf dieser Seite.' }],
    land: { us: 'USA', uk: 'Großbritannien', ca: 'Kanada', de: 'Deutschland' }, nl: 'Niederlande (Dossiers auf Niederländisch)',
    volgKop: 'Die Schritt-für-Schritt-Anleitung per E-Mail.', volg: 'Wir schreiben pro Unternehmen eine Anleitung, angefangen mit Platz eins. Hinterlasse deine E-Mail-Adresse, dann schicken wir sie dir, sobald sie fertig ist, und die Antwort des Unternehmens, sobald es reagiert.',
    email: 'Deine E-Mail-Adresse', knop: 'Anleitung schicken', consent: 'Mit der Anmeldung stimmst du diesen E-Mails zu. Abmelden geht mit einem Klick in jeder E-Mail.', ok: 'Erledigt. In deinem Postfach liegt eine kurze Begrüßung.', naTik: 'Anleitung haben, sobald sie fertig ist?'
  }
};

export const INTL_CSS = '.intl-lijst{list-style:none;margin:24px 0;padding:0}.intl-rij{display:flex;gap:14px;padding:16px 0;border-top:1px solid var(--line)}.intl-nr{font-size:1.5rem;font-weight:700;min-width:2ch;color:var(--ink)}.intl-rij h2{margin:0 0 4px;font-size:1.25rem}.intl-rij p{margin:0 0 6px}.intl-zoek{color:var(--ink)}.intl-rij .acts{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px}.metoo-n{font-weight:700;color:var(--ink)}';
export const INTL_JS = String.raw`(function(){var D=document;D.querySelectorAll('[data-metoo]').forEach(function(b){b.addEventListener('click',function(){var p=b.dataset.metoo.split('|');b.disabled=true;try{if(typeof window.wamMeetActie==='function')window.wamMeetActie()}catch(x){}fetch('/api/wam?op=dmetoo',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({m:p[0],id:p[1]})}).then(function(r){return r.json()}).then(function(j){var s=b.parentNode.querySelector('.metoo-n');if(s&&j&&j.tekst)s.textContent=j.tekst;b.textContent=b.dataset.ok;var na=b.parentNode.querySelector('.intl-na');if(na)na.hidden=false}).catch(function(){b.disabled=false})})});D.querySelectorAll('form.intl-volg').forEach(function(f){var msg=f.parentNode.querySelector('.msg');f.addEventListener('submit',function(ev){ev.preventDefault();var k=f.querySelector('button');k.disabled=true;var ref='';try{ref=sessionStorage.getItem('wmnr')||localStorage.getItem('wmnr')||''}catch(x){}fetch('/api/wam?op=daanmelden',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:f.email.value,website:f.website.value,scope:f.dataset.scope,toestemming:true,waar:'vast',arm:'intl',ref:ref})}).then(function(r){return r.json()}).then(function(j){if(j&&j.ok){f.hidden=true;msg.textContent=f.dataset.ok;try{if(typeof window.mmUitkomst==='function')window.mmUitkomst('aanmelding')}catch(x){}}else{msg.textContent=(j&&j.fout)||'';k.disabled=false}}).catch(function(){k.disabled=false})})})})();`;

// h.metoo = { 'us|planet-fitness': 12, ... } (echte tellingen, alleen getoond vanaf 1)
export function intlPagina(m, h = {}) {
  const M = INTL.markten[m]; if (!M) return null;
  const L = T[M.taal], top = M.items[0], tel = h.metoo || {};
  const rijen = M.items.map((x, i) => { const n = Math.floor(Number(tel[m + '|' + x.id]) || 0);
    return '<li class="intl-rij" id="' + e(x.id) + '"><span class="intl-nr">' + (i + 1) + '</span><div><h2>' + e(x.naam) + '</h2><p class="intl-zoek">' + (M.taal === 'de' ? '„' : '“') + e(x.k) + (M.taal === 'de' ? '“' : '”') + '</p><p class="meta"><b>' + e(L.getal(x.v)) + '</b> · ' + e(L.trend(x.y)) + '</p><div class="acts"><button type="button" data-metoo="' + m + '|' + e(x.id) + '" data-ok="' + e(L.geteld) + '">' + e(L.metoo) + '</button><span class="metoo-n" role="status">' + (n ? e(L.n(n)) : '') + '</span><a class="intl-na" href="#volgen" hidden>' + e(L.naTik) + '</a></div></div></li>'; }).join('');
  const vragen = L.vragen(M, top);
  const andere = INTL_MARKTEN.filter(x => x !== m).map(x => '<a href="/' + x + '">' + e(L.land[x]) + '</a>').concat('<a href="/" lang="nl">' + e(L.nl) + '</a>').join(' · ');
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'ItemList', name: L.h1(M), itemListOrder: 'https://schema.org/ItemListOrderDescending', numberOfItems: M.items.length, itemListElement: M.items.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.naam, description: x.k + ': ' + L.getal(x.v) })) },
    { '@type': 'Dataset', name: L.h1(M), description: L.methode(M), inLanguage: M.taal, dateModified: INTL.gemeten, spatialCoverage: M.land, creator: { '@type': 'Organization', name: 'we are many now', url: 'https://wearemany.now/' }, variableMeasured: 'Monthly search volume (Google Ads estimate)' },
    { '@type': 'FAQPage', inLanguage: M.taal, mainEntity: vragen.map(q => ({ '@type': 'Question', name: q.vraag, acceptedAnswer: { '@type': 'Answer', text: q.antwoord } })) }] };
  return { pad: '/' + m, taal: M.taal === 'de' ? 'de' : 'en', alternates: intlAlternates(), geenVolg: true, titel: L.seo(M), desc: L.desc(M, top),
    body: '<main id="inhoud" lang="' + M.taal + '"><p class="eyebrow">' + e(L.eyebrow(M)) + '</p><h1>' + e(L.h1(M)) + '</h1><p>' + e(L.lead(M)) + '</p><ol class="intl-lijst">' + rijen + '</ol>' +
      '<section id="mee-tellen"><h2>' + e(L.oproepKop) + '</h2><p>' + e(L.oproep) + '</p></section>' +
      '<section class="volg" id="volgen"><h2>' + e(L.volgKop) + '</h2><p>' + e(L.volg) + '</p><form class="intl-volg" data-scope="' + m + '" data-ok="' + e(L.ok) + '"><label class="sr-only" for="intl-email">' + e(L.email) + '</label><div class="composer"><input id="intl-email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" placeholder="' + e(L.email) + '"><button type="submit" class="primary">' + e(L.knop) + ' <span aria-hidden="true">→</span></button></div><label class="trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><p class="consent-note">' + e(L.consent) + ' <a href="/privacy">Privacy</a>.</p></form><p class="msg" role="status"></p></section>' +
      '<section id="methode"><h2>' + e(L.methodeKop) + '</h2><p>' + e(L.methode(M)) + '</p></section>' +
      '<section id="vragen"><h2>' + e(L.vragenKop) + '</h2>' + vragen.map(q => '<div class="dossier-vraag"><h3>' + e(q.vraag) + '</h3><p>' + e(q.antwoord) + '</p></div>').join('') + '</section>' +
      '<p class="meta">' + e(L.andereKop) + ': ' + andere + '</p><script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script></main>',
    script: INTL_JS };
}
export const metooTekst = (m, n) => { const M = INTL.markten[m]; return M ? T[M.taal].n(n) : ''; };
