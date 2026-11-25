// Binnenkort-pagina's op gids.kadoly.com (25 nov 2026, Henkjan: "maak iigv vast de paginas als mensen klikken is uitverkocht . Zodat we organisch pakken .")
// Onderwerpen met stijgende vraag (Demand Radar) waarvan Kadoly nog geen voorraad heeft. De pagina beantwoordt de vraag eerlijk,
// zegt dat het product nog niet (of tijdelijk niet) leverbaar is en vangt de vraag met de Kadoly-mail (lib/kadoly-nieuws.js, waar = binnenkort-<slug>).
// Zo wordt de pagina alvast gevonden en meten we per onderwerp hoeveel mensen willen kopen. Geen nepprijzen, geen nepvoorraad.
// Staat het product in de winkel, haal de slug hier weg en maak er een gewone gids van (lib/gidsen-*.js).

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const BINNENKORT = {
  'metaaldetector-beginners': {
    slug: 'metaaldetector-beginners', bijgewerkt: '25 november 2026', status: 'nog',
    titel: 'Metaaldetector voor beginners: wat mag in Nederland?',
    h1: 'Metaaldetector voor beginners: wat mag je in Nederland?',
    beschrijving: 'Een metaaldetector als cadeau of hobby: waar je mag zoeken, hoe diep je mag graven, wat je met een vondst doet en waar je op let bij een beginnersset.',
    kicker: 'Keuzehulp · metaaldetectors',
    kort: 'In Nederland mag je met een metaaldetector zoeken als de grondeigenaar toestemming geeft, je niet dieper graaft dan 30 centimeter en je gemeente het niet verbiedt. Vind je iets ouds, dan meld je het bij PAN, het register voor vondsten van amateurs. Voor een beginner is een eenvoudige detector met een pinpointer genoeg: diep zoeken mag toch niet.',
    vraag: 'Zoekopdrachten naar metaaldetectors stijgen in Nederland al maanden.',
    secties: [
      ['Waar mag je zoeken?', [
        'Altijd met toestemming van wie de grond is: een boer, de gemeente of een particulier.',
        'Kijk in de APV van je gemeente. Sommige gemeenten verbieden zoeken met een detector in openbaar groen of op het strand.',
        'Nooit op een archeologisch monument, in uiterwaarden of langs de waterlijn.'
      ]],
      ['Hoe diep mag je graven?', [
        'Niet dieper dan 30 centimeter. Dieper is opgraven, en daar heb je een vergunning voor nodig.',
        'Wantrouw dus advertenties die meters diepte beloven. Je mag die diepte niet gebruiken, en goedkope detectors halen het ook niet.'
      ]],
      ['Wat doe je met een vondst?', [
        'Meld voorwerpen van vóór 1946 bij PAN (Portable Antiquities of the Netherlands). Dat kan online.',
        'Gemelde vondsten uit de bovenste 30 centimeter zijn van de vinder.',
        'Vind je munitie of iets dat erop lijkt: niet aanraken en 112 bellen.'
      ]],
      ['Waar let je op bij een beginnersset?', [
        'Een pinpointer (een staafje dat het voorwerp in het gat terugvindt) scheelt veel graven.',
        'Een schepje en een vondstenzakje horen erbij.',
        'Kijk of er een CE-markering en een Nederlandse handleiding bij zitten.'
      ]]
    ],
    faq: [
      { v: 'Mag je in Nederland zomaar met een metaaldetector zoeken?', a: 'Nee. Je hebt toestemming nodig van de grondeigenaar, je graaft niet dieper dan 30 centimeter en je kijkt of je gemeente het verbiedt. Op archeologische monumenten, in uiterwaarden en langs de waterlijn mag het nooit.' },
      { v: 'Hoe diep mag je graven met een metaaldetector?', a: 'Hooguit 30 centimeter. Dieper graven is archeologisch onderzoek en daar is een vergunning voor nodig.' },
      { v: 'Wat moet je doen met een vondst?', a: 'Voorwerpen van vóór 1946 meld je bij PAN, het register voor vondsten van amateurs. Gemelde vondsten uit de bovenste 30 centimeter zijn van de vinder.' },
      { v: 'Is een metaaldetector een goed cadeau?', a: 'Ja, voor iemand die graag buiten is en geduld heeft. Geef er een pinpointer en een schepje bij, en zoek samen uit waar het in jullie gemeente mag.' }
    ],
    bronnen: [
      ['Verkorte regels metaaldetectie in Nederland (Kooistra Detectors)', 'https://kooistra-detectors.eu/media/c0/65/b3/1633354560/NL-3-Verkorte%20regels%20metaaldetectie%20NL.pdf'],
      ['Archeologische vondst melden (Rijksoverheid)', 'https://www.rijksoverheid.nl/vraag-en-antwoord/erfgoed/archeologische-vondst-melden']
    ]
  },
  'book-nook': {
    slug: 'book-nook', bijgewerkt: '25 november 2026', status: 'tijdelijk',
    titel: 'Book nook: wat is het en welke kies je?',
    h1: 'Book nook kopen: wat is het en welke past bij jou?',
    beschrijving: 'Een book nook is een miniatuurwereld om zelf te bouwen en tussen je boeken te zetten. Wat zit erin, hoe lang bouw je eraan en waar let je op bij het kopen.',
    kicker: 'Keuzehulp · bouwpakketten',
    kort: 'Een book nook is een bouwpakket van hout of karton dat je tussen je boeken zet: een straatje, bibliotheek of sprookje met een lampje erin. Reken voor een eerste op 4 tot 8 uur bouwen, verspreid over een paar avonden. Kijk bij het kopen vooral of het lampje erbij zit en of de onderdelen compleet zijn: dat zijn de meest gehoorde klachten.',
    vraag: 'Zoekopdrachten naar doe-het-zelfpakketten voor volwassenen zijn in Nederland ruim verdubbeld.',
    secties: [
      ['Wat zit er in een book nook?', [
        'Voorgesneden platen hout of karton, kleine onderdelen en vaak een lampje op batterijen of USB.',
        'Soms zit lijm, een hobbymes en een pincet erbij. Anders heb je die zelf nodig.'
      ]],
      ['Welke maat past?', [
        'De meeste book nooks zijn 8 tot 12 centimeter breed en ongeveer 20 tot 25 centimeter hoog.',
        'Meet de ruimte tussen je boeken voor je kiest.'
      ]],
      ['Waar let je op?', [
        'Of het lampje erbij zit en werkt. Kapotte lampjes en ontbrekende onderdelen zijn de klachten die het vaakst terugkomen.',
        'Een Nederlandse of duidelijke beeldhandleiding scheelt veel uitzoeken.',
        'Voor een eerste keer: kies een eenvoudig model, de grote zijn een uitdaging voor gevorderden.'
      ]]
    ],
    faq: [
      { v: 'Wat is een book nook?', a: 'Een miniatuurwereldje in de vorm van een boek, dat je tussen de boeken in je kast zet. Je bouwt het zelf uit een pakket van hout of karton, vaak met een lampje erin.' },
      { v: 'Hoe lang duurt het om een book nook te bouwen?', a: 'Een eerste book nook kost al snel 4 tot 8 uur, verspreid over een paar avonden. Grotere modellen meer.' },
      { v: 'Is een book nook een goed cadeau?', a: 'Ja, vooral voor mensen die lezen of graag iets met hun handen doen. Het is een cadeau van een paar gezellige avonden, en daarna staat het mooi in de kast.' }
    ],
    bronnen: []
  }
};

export const BINNENKORT_SLUGS = Object.keys(BINNENKORT);

const STATUS = {
  nog: ['Nog niet op voorraad bij Kadoly', 'We testen nu beginnerssets op kwaliteit voordat we ze verkopen. Laat je e-mailadres achter, dan hoor je het zodra ze er zijn.'],
  tijdelijk: ['Tijdelijk uitverkocht bij Kadoly', 'We controleren de nieuwe voorraad op complete onderdelen en werkende lampjes. Laat je e-mailadres achter, dan hoor je het zodra ze er weer zijn.']
};

export function bkJsonLd(b) {
  return '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: b.faq.map(f => ({ '@type': 'Question', name: f.v, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }).replace(/</g, '\\u003c') + '</script>';
}

// alleen de inhoud (tussen kop en voet van fn/gids.js)
export function bkInhoud(b) {
  const [stKop, stTekst] = STATUS[b.status] || STATUS.nog;
  const sec = b.secties.map(([h, l]) => `<h2>${esc(h)}</h2><ul>${l.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`).join('');
  const faq = `<h2>Vragen</h2>${b.faq.map(f => `<details class="bk-f"><summary>${esc(f.v)}</summary><p>${esc(f.a)}</p></details>`).join('')}`;
  const bron = b.bronnen.length ? `<p class="meta">Bronnen: ${b.bronnen.map(([t, u]) => `<a href="${esc(u)}" rel="noopener">${esc(t)}</a>`).join(' · ')}.</p>` : '';
  return `<style>.bk-st{border:2px solid var(--ink,#111113);border-radius:14px;padding:16px 18px;margin:18px 0}.bk-st h2{margin:0 0 6px;font-size:18px}.bk-st p{margin:0 0 12px}.bk-knop{display:inline-block;background:var(--ink,#111113);color:#fff!important;padding:12px 18px;border-radius:10px;font-weight:700;text-decoration:none!important}.bk-f{border-top:1px solid var(--line,#E5E7EB);padding:10px 0}.bk-f summary{font-weight:700;cursor:pointer}</style>`
    + `<nav class="crumbs"><a href="/">Kadoly gids</a> › ${esc(b.kicker.replace(/^Keuzehulp · /, ''))}</nav><p class="kicker">${esc(b.kicker)}</p><h1>${esc(b.h1)}</h1>`
    + `<p class="lead">${esc(b.kort)}</p>`
    + `<section class="bk-st" data-bk="${esc(b.slug)}"><h2>${esc(stKop)}</h2><p>${esc(stTekst)}</p><a class="bk-knop" href="#nb" data-bk-klik="${esc(b.slug)}">Mail me als het er is</a></section>`
    + sec + faq + bron
    + `<script>(function(){var k=document.querySelector('[data-bk-klik]');if(!k)return;k.addEventListener('click',function(){try{fetch('/api/gids?op=tel&g=${encodeURIComponent(b.slug)}&s=bk-klik',{method:'POST',keepalive:true})}catch(e){}var w=document.querySelector('#nb input[type=email]');if(w)setTimeout(function(){w.focus()},400)});})();</script>`;
}
