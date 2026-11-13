// Vindbaarheid van de verlanglijst-pagina's (ZICHT, 13 nov 2026; Henkjan: "zorg dat jij dat ook regelt voor de kadoly gids asap").
// Per pagina: titel met de zoekterm voorop, kort antwoord bovenaan, uitleg en vragen als gewone tekst in de HTML (niet pas na JavaScript),
// en JSON-LD dat precies de zichtbare tekst volgt. Vragen in het Nederlands (de markt met het seizoen); andere talen krijgen de korte uitleg.
import { T } from './taal.js';
import { esc } from './pagina.js';

const ADRES = 'https://gids.kadoly.com';
export const TITEL = {
  home: { nl: 'Verlanglijstje maken: gratis, uit elke winkel', en: 'Make a wishlist: free, from any shop', de: 'Wunschliste erstellen: kostenlos, aus jedem Shop', fr: 'Créer une liste d\'envies : gratuite, toutes boutiques', es: 'Crear una lista de deseos: gratis, de cualquier tienda' },
  lootjes: { nl: 'Lootjes trekken online: gratis, met verlanglijst', en: 'Secret Santa generator: free, with wishlists', de: 'Wichteln online: kostenlos, mit Wunschliste', fr: 'Tirage au sort en ligne : gratuit, avec listes', es: 'Amigo invisible online: gratis, con listas' },
  gedicht: { nl: 'Sinterklaasgedicht maken: gratis gedicht op maat', en: 'Gift poem generator: a free poem made to measure', de: 'Gedicht zum Geschenk: kostenlos und persönlich', fr: 'Poème pour un cadeau : gratuit et personnalisé', es: 'Poema para un regalo: gratis y personalizado' },
  zoek: { nl: 'Cadeau-ideeën: cadeauzoeker voor iedereen', en: 'Gift ideas: a gift finder for anyone', de: 'Geschenkideen: Geschenkefinder für jeden', fr: 'Idées cadeaux : trouveur de cadeaux pour tous', es: 'Ideas de regalo: buscador para cualquiera' }
};
// echte vragen (zoals mensen ze intikken) met antwoorden die kloppen met wat de pagina doet
const VRAGEN = {
  home: [
    ['Hoe maak ik een verlanglijstje?', 'Vul je naam in, kies waarvoor (bijvoorbeeld Sinterklaas of je verjaardag) en plak links uit elke winkel of typ een wens. Je hebt geen account nodig. Deel daarna de link in de groepsapp.'],
    ['Kan ik producten uit elke winkel op mijn verlanglijst zetten?', 'Ja: bol, Coolblue, IKEA, Amazon of een kleine webshop. Plak de link; naam, prijs en foto worden aangevuld als de winkel dat toelaat. Lukt dat niet, dan vul je de naam zelf in. Een foto of screenshot van iets wat je mooi vindt kan ook.'],
    ['Hoe voorkom je dat iemand twee keer hetzelfde koopt?', 'Gevers tikken op "Ik geef dit". Andere gevers zien dan dat het al gekozen is. Jij als eigenaar ziet dat niet, zodat het een verrassing blijft.'],
    ['Kun je samen één duur cadeau geven?', 'Ja. Een gever start een pot bij een wens en zet zijn eigen betaalverzoek erbij, zoals een Tikkie. Anderen zeggen een bedrag toe en betalen via dat verzoek. Kadoly komt niet aan het geld.'],
    ['Is de verlanglijst gratis?', 'Ja. Sommige winkellinks geven Kadoly een kleine vergoeding; jij en je gevers betalen niets extra.']
  ],
  lootjes: [
    ['Hoe werkt lootjes trekken online?', 'Vul de namen in, kies eventueel wie iemand niet mag trekken (bijvoorbeeld partners) en tik op Trek de lootjes. Iedereen krijgt een eigen link, bijvoorbeeld via WhatsApp, en ziet alleen zijn eigen lootje.'],
    ['Heb je een e-mailadres of account nodig?', 'Nee. Iedereen krijgt een eigen link met zijn lootje. Er is geen account en geen e-mailadres nodig.'],
    ['Kan de organisator zien wie wie heeft getrokken?', 'Als jij de namen invult, stuur jij de links rond. Wil je zelf ook verrast worden, deel dan de aanmeldlink: iedereen meldt zich zelf aan en niemand ziet de lootjes van een ander, ook jij niet.'],
    ['Kan iedereen een verlanglijst toevoegen?', 'Ja. Vanuit je lootje maak je een eigen verlanglijst met links uit elke winkel. Wie jou trok, ziet die meteen bij zijn lootje.'],
    ['Wat is de roddelbox?', 'Je verklapt anoniem wat iemand stiekem wil. Alleen wie die persoon trok, leest het. Daarmee kan ook een Sinterklaasgedicht worden geschreven.']
  ],
  gedicht: [
    ['Hoe maak je een Sinterklaasgedicht?', 'Vul in voor wie het is en wat erin moet: hobby\'s, grappige gewoontes, iets wat de persoon dit jaar deed. Je krijgt een gedicht in gepaard rijm, ondertekend door Sint en Piet. Bevalt het niet, vraag dan een nieuwe versie.'],
    ['Hoe lang is een Sinterklaasgedicht?', 'Meestal 12 tot 20 regels. Dit gedicht heeft 12 tot 16 regels in gepaard rijm: steeds twee regels die op elkaar rijmen.'],
    ['Verklapt het gedicht wat het cadeau is?', 'Nee. Het cadeau wordt niet genoemd en ook niet wie het geeft. Wil je een hint, zet die dan bij wat erin moet.'],
    ['Mag ik het gedicht aanpassen?', 'Ja. Kopieer het en pas het aan zoals je wilt; het gedicht is van jou.'],
    ['Wordt wat ik invul bewaard?', 'Nee. Wat je invult wordt alleen gebruikt om het gedicht te schrijven en niet bewaard.']
  ],
  zoek: [
    ['Hoe vind ik een goed cadeau?', 'Beschrijf de persoon: leeftijd, hobby\'s, wat hij of zij al heeft en je budget. Je krijgt ideeën uit alle winkels met zoeklinks naar bol, Amazon en Google Shopping, plus producten uit de Kadoly-winkel die passen.'],
    ['Kan ik een budget opgeven?', 'Ja. Zet het bedrag in je beschrijving, bijvoorbeeld "max 40 euro". De ideeën en producten blijven daarbinnen.'],
    ['Wat als de persoon al een verlanglijst heeft?', 'Kijk dan eerst op die lijst: wat erop staat, wil iemand echt. De cadeauzoeker is voor als er geen lijst is of als je iets extra\'s zoekt.']
  ]
};
const UITLEG = {
  home: t => [t.hoe1, t.hoe2, t.hoe3],
  lootjes: t => [t.lt_sub, t.lt_zelf_s, t.rod_s],
  gedicht: t => [t.ged_pagina_s || t.zk_sub],
  zoek: t => [t.zk_sub]
};

// HTML na de app: uitleg en vragen (alleen nl), plus JSON-LD
export function seoBlok(view, taal) {
  const t = T[taal] || T.en; const v = taal === 'nl' ? (VRAGEN[view] || []) : [];
  const uitleg = (UITLEG[view] ? UITLEG[view](t) : []).filter(Boolean);
  if (!uitleg.length && !v.length) return '';
  return `<section class="seo" aria-labelledby="seo-h"><h2 id="seo-h">${esc(TITEL[view] ? TITEL[view][taal] || TITEL[view].en : '')}</h2>${uitleg.map(x => `<p>${esc(x)}</p>`).join('')}${v.length ? '<h2>Veelgestelde vragen</h2>' + v.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('') : ''}</section>`;
}
export function seoLd(view, taal, pad) {
  const naam = TITEL[view] ? TITEL[view][taal] || TITEL[view].en : 'Kadoly';
  const g = [{ '@type': 'WebApplication', name: naam, url: ADRES + pad, applicationCategory: 'LifestyleApplication', operatingSystem: 'Web', inLanguage: taal, isAccessibleForFree: true, offers: { '@type': 'Offer', price: 0, priceCurrency: 'EUR' }, publisher: { '@type': 'Organization', name: 'Kadoly', url: 'https://kadoly.com', legalName: 'Adsfair B.V.' } }];
  if (taal === 'nl' && VRAGEN[view]) g.push({ '@type': 'FAQPage', mainEntity: VRAGEN[view].map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': g }).replace(/</g, '\\u003c')}</script>`;
}
