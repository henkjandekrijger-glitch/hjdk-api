// Antwoorden op concrete zoekvragen, binnen de bestaande bedrijfspagina: geen dubbele SEO-pagina's.
import fs from 'node:fs';
export const PRAKTISCHE_HULP = {
  videoland: {
    titel: 'Videoland opzeggen: welke route past bij jouw betaling?',
    bijgewerkt: '2026-11-24',
    bron: 'https://hulp.videoland.com/s/article/hulp-videoland-com-article-gebruikersvoorwaarden-videoland',
    bronTitel: 'Videoland-abonnementsvoorwaarden, gewijzigd 27 augustus 2026',
    antwoord: 'Betaal je rechtstreeks aan Videoland? Ga op de website naar Accountinstellingen en het tabblad Abonnement. Betaal je via een televisie- of telecomaanbieder, controleer dan je abonnement bij die aanbieder. De factuur laat zien welke route je moet controleren.',
    vragen: [
      { vraag: 'Hoe zeg ik Videoland op als er geen opzegknop staat?', antwoord: 'Controleer op de Videoland-website of je in het juiste RTL-account zit. Kijk daarna wie de betaling afhandelt. Een abonnement via een andere aanbieder valt ook onder diens procedures. Blijft de route onduidelijk, vraag de klantenservice om bevestiging van het abonnement en de einddatum.' },
      { vraag: 'Is mijn RTL-account verwijderen hetzelfde als Videoland opzeggen?', antwoord: 'Videoland beschrijft het opzeggen van het abonnement en het beëindigen van je RTL-account als afzonderlijke handelingen. Controleer eerst dat het betaalde abonnement is gestopt en bewaar die bevestiging.' },
      { vraag: 'Er gaat na het opzeggen nog geld af. Wat controleer ik?', antwoord: 'Leg de opzegbevestiging, de genoemde einddatum en de periode op de factuur naast elkaar. Vraag de partij die factureert om uitleg als de betaling daar niet bij past. WAM kan zonder die stukken niet vaststellen of een afschrijving onterecht is.' }
    ]
  }
};
Object.assign(PRAKTISCHE_HULP, JSON.parse(fs.readFileSync(new URL('../data/wam/hulp-nl-2026-11-24.json', import.meta.url), 'utf8')));
Object.assign(PRAKTISCHE_HULP.videoland, {
  kop: 'Videoland opzeggen.', seoTitel: 'Videoland opzeggen, betaalroute en ervaringen | WAM', kort: 'Betaal je aan Videoland of via je tv-aanbieder? Controleer eerst via wie jouw abonnement loopt.',
  anker: 'opzeggen', actie: { naam: 'Naar mijn Videoland-account', url: 'https://www.videoland.com/nl/?redirect=%2Faccount' },
  stappenTitel: 'Onze controlelijst als je vastloopt',
  stappen: ['Zoek je laatste factuur en de bevestiging van je abonnement erbij. Een betaalverwerker op je afschrift is niet vanzelf de aanbieder bij wie je opzegt.', 'Controleer het account waarin het betaalde abonnement staat. Een werkende app bewijst niet via wie je betaalt.', 'Leg de bevestigde einddatum naast de betaalde factuurperiode. Bewaar je bevestiging en vraag om een schriftelijke toelichting als iets afwijkt.'],
  noot: 'Videoland noemt verschillende looptijden. Controleer daarom de voorwaarden van jouw abonnement; één algemene einddatum past niet bij iedereen.'
});
export function praktischeHulp(id, e, zonderIntro = false) {
  const h = PRAKTISCHE_HULP[id]; if (!h) return '';
  const bronnen = h.bronnen || [{ naam: h.bronTitel, url: h.bron, uitleg: 'Artikelen 3 en 4; de controlelijst is onze redactionele uitwerking.' }];
  const link = (url, tekst) => '<a href="' + e(url) + '"' + (url.startsWith('https:') ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + e(tekst) + '</a>';
  return '<section id="' + e(h.anker) + '" class="praktische-hulp"><h2>' + e(h.titel) + '</h2>' + (zonderIntro ? '' : '<p>' + e(h.antwoord) + '</p>') + '<h3>' + e(h.stappenTitel) + '</h3><ol class="checklist">' + h.stappen.map(s => '<li>' + e(s) + '</li>').join('') + '</ol>' + (h.routes ? '<div class="rows hulp-routes">' + h.routes.map(r => '<div class="row"><b>' + e(r.situatie) + '</b><p>' + link(r.url, r.route) + '</p></div>').join('') + '</div>' : '') + (h.extra ? '<h3>' + e(h.extra.kop) + '</h3><p>' + e(h.extra.tekst) + '</p>' : '') + '<p class="note">' + e(h.noot) + '</p><div class="hulp-bronnen"><h3>Bronnen bij deze uitleg</h3>' + bronnen.map(b => '<p class="meta">' + link(b.url, b.naam) + '. ' + e(b.uitleg) + '</p>').join('') + '<p class="meta">Nagelezen op <time datetime="' + h.bijgewerkt + '">24 november 2026</time>.</p></div><div class="hulp-vragen">' + h.vragen.map(v => '<div class="dossier-vraag"><h3>' + e(v.vraag) + '</h3><p>' + e(v.antwoord) + '</p></div>').join('') + '</div></section>';
}
