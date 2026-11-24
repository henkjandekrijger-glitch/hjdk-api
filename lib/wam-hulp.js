// Antwoorden op concrete zoekvragen, binnen de bestaande bedrijfspagina: geen dubbele SEO-pagina's.
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
export function praktischeHulp(id, e) {
  const h = PRAKTISCHE_HULP[id]; if (!h) return '';
  return '<section id="opzeggen" class="praktische-hulp"><p class="eyebrow">Praktische hulp</p><h2>' + e(h.titel) + '</h2><p>' + e(h.antwoord) + '</p><p><a class="btn primary" href="https://www.videoland.com/nl/?redirect=%2Faccount" target="_blank" rel="noopener noreferrer">Naar mijn Videoland-account <span aria-hidden="true">→</span></a></p><h3>Onze controlelijst als je vastloopt</h3><ol class="checklist"><li>Zoek je laatste factuur en de bevestiging van je abonnement erbij. Een betaalverwerker op je afschrift is niet vanzelf de aanbieder bij wie je opzegt.</li><li>Controleer het account waarin het betaalde abonnement staat. Een werkende app bewijst niet via wie je betaalt.</li><li>Leg de bevestigde einddatum naast de betaalde factuurperiode. Bewaar je bevestiging en vraag om een schriftelijke toelichting als iets afwijkt.</li></ol><p class="note">Videoland noemt verschillende looptijden. Controleer daarom de voorwaarden van jouw abonnement; één algemene einddatum past niet bij iedereen.</p><p class="meta">Bron: <a href="' + e(h.bron) + '" target="_blank" rel="noopener noreferrer">' + e(h.bronTitel) + '</a>, artikelen 3 en 4. Nagelezen op <time datetime="' + h.bijgewerkt + '">24 november 2026</time>. De controlelijst is onze redactionele uitwerking.</p><div class="hulp-vragen">' + h.vragen.map(v => '<div class="dossier-vraag"><h3>' + e(v.vraag) + '</h3><p>' + e(v.antwoord) + '</p></div>').join('') + '</div></section>';
}
