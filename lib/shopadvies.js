// Briefing voor Babita: wat de campagnes leren (live cijfers) en wat de verkoop in de shop tegenhoudt.
// De beoordeling van de productpagina is een momentopname (8 okt 2026, telefoonformaat, niet ingelogd);
// de cijfers bovenaan komen bij elk bezoek vers uit de leerlus. Wordt aangeroepen vanuit api/shop.js (/api/shop/advies).
import beelden from '../data/shop-advies-beelden.json' with { type: 'json' };

const PRODUCT = 'https://yoo.rs/product/oc_4174004347453441?lang=nl';

// Zo stond de shop bij de controle van 10 oktober 2026 (nacht). Wordt gebruikt als de live meting niet lukt.
const STAND_10OKT = { gast: true, afrekenNl: true, geenFee: true, koopblokBoven: true, balkVanafStart: true, bundelLeeg: true, thuisbezorgd: true, idealBijKnop: true, geldTerug: true, verkoper: true, adres: true,
  affiliate: true, registreren: true, sportBuiten: true, motorUitleg: true, fotos: 1, shipDays: '3-5', afrekenDagen: '2–4 werkdagen', shippingCost: 'null' };

// Per punt van 8 oktober: is het doorgevoerd, en wat staat er nu. st = live meting van de pagina (of de stand van 10 oktober).
const STATUS = [
  st => st.gast ? ['gedaan', 'Afrekenen kan zonder account. Het eerste veld is het e-mailadres; het account wordt na de betaling aangemaakt.'] : ['open', '"Nu kopen" vraagt nog om in te loggen.'],
  st => st.koopblokBoven && st.balkVanafStart ? ['gedaan', 'Op een telefoon staan nu eerst de foto\'s en dan titel, prijs en "Nu kopen". De vaste balk staat er vanaf binnenkomst.'] : ['open', 'Het koopblok staat op een telefoon nog niet direct onder de foto.'],
  st => st.geenFee && st.thuisbezorgd ? ['gedaan', 'De fee van €2,20 is weg bij producten van de shop zelf. Onder de prijs staat "Thuisbezorgd €36,45". Op de afrekenpagina staat de fee ook niet meer.'] : ['open', 'Het totaal bij het afrekenen is nog hoger dan de getoonde prijs.'],
  st => st.afrekenNl ? ['gedaan', 'De afrekenpagina en de retourpagina zijn Nederlands.'] : ['open', 'De afrekenpagina is nog Engels.'],
  st => st.bundelLeeg ? ['gedaan', 'In de bundel staat alleen dit product aangevinkt, en de bundel staat onder het koopblok.'] : ['open', 'De bundel staat nog vooraf aangevinkt.'],
  st => !st.idealBijKnop ? ['open', 'iDEAL staat nog niet bij de koopknop.'] : st.shipDays && st.afrekenDagen && !String(st.afrekenDagen).replace('–', '-').startsWith(st.shipDays) ? ['deels', 'iDEAL staat onder de knop en de levertijd staat erbij. Maar de productpagina zegt ' + st.shipDays + ' werkdagen en de afrekenpagina ' + st.afrekenDagen + '.'] : ['gedaan', 'iDEAL staat onder de knop en de levertijd staat erbij.'],
  st => st.motorUitleg || (st.fotos != null && st.fotos <= 1) ? ['open', 'Nog ' + (st.fotos == null ? 'steeds' : st.fotos) + ' foto, geen maat, en de zin over de batterijmotor leest nog alsof die erbij zit.'] : ['gedaan', 'Meer foto\'s en een duidelijke beschrijving.'],
  st => st.affiliate || st.sportBuiten ? ['deels', 'De kijkteller, "nog geen reviews", "Staat" en "Geplaatst" zijn weg. Nog over: ' + [st.affiliate && 'de regel "Maak content over dit product en verdien €2,65 per verkoop"', st.registreren && '"Registreren" in de kop', st.sportBuiten && 'de spinner staat nog onder Sport & buiten'].filter(Boolean).join(', ') + '.'] : ['gedaan', 'De cijfers en blokken die tegen de shop werkten zijn weg.'],
  st => st.verkoper && st.adres ? ['gedaan', 'De retourregel is overal gelijk: gratis retour bij producten van de shop zelf. Bij de knop staat "Verkocht door Yoors Shop (ADSFAIR B.V.)" en het postadres staat in de voettekst. Een telefoonnummer staat er niet; chatten kan wel.'] : ['open', 'Verkoper en postadres staan er nog niet.'],
  st => st.geldTerug ? ['gedaan', 'Direct onder de knop staat "Niet goed? Geld terug, gratis retour binnen 14 dagen". De uitleg in vier stappen staat onderaan.'] : ['open', '"Geld terug" staat nog niet bij de knop.'],
];

// Een bevinding: wat de bezoeker nu ziet, waarom het verkoop kost, wat er moet veranderen.
const BEVINDINGEN = [
  { t: 'Kopen kan alleen met een account', effect: 'groot', werk: 'dagen',
    nu: 'Een tik op "Nu kopen" brengt een nieuwe bezoeker naar een inlogpagina met de kop "Welkom terug". Product en prijs zijn weg en de cookiemelding ligt over de onderkant. Wie geen account heeft moet naar "Account aanmaken", waar staat: "Begin met schrijven, delen en verdienen". Daar vul je een e-mailadres in, ga je naar je mailbox, tik je op een link en zoek je daarna zelf het product terug. Afrekenen als gast bestaat niet.',
    waarom: 'Het moment waarop iemand op "Nu kopen" tikt is het moment waarop hij het liefst wil kopen. Elke stap die je daar tussen zet kost kopers, en dit zijn er vijf. In onderzoek van Baymard noemt 18% van de afhakers een verplicht account als reden.',
    doen: '"Nu kopen" opent direct de afrekenpagina, zonder inloggen. Het eerste veld is het e-mailadres. Na de betaling wordt het account stil aangemaakt en staat de inloglink in de bevestigingsmail. Tot dat gebouwd is: houd foto, titel en prijs in beeld op de inlogpagina, zet erboven "Reken af als nieuwe klant", en stuur iemand na het activeren terug naar de afrekenpagina van dat product.' },
  { t: 'Titel, prijs en koopknop staan op het vijfde scherm', effect: 'groot', werk: 'uren',
    nu: 'Op een telefoon is de pagina 5170 pixels hoog, ruim zes schermen. Het eerste scherm toont de foto en het kopje "Beschrijving". De titel staat op 3484 pixels, de prijs op 3594 en "Nu kopen" op 3798. De vaste balk onderaan met prijs en knop verschijnt pas nadat je voorbij de gewone knop bent gescrold. Op een groot scherm staat het wel goed, rechts naast de foto.',
    waarom: 'De advertentie beloofde een windspinner met kolibrie voor €30. Wat niet in beeld staat, bestaat voor een bezoeker niet. Wie de prijs en de knop niet terugziet denkt dat hij verkeerd zit en gaat weg.',
    doen: 'Zet op een telefoon het koopblok (titel, prijs, voorraad, knop, drie vinkjes) direct onder de foto, voor de beschrijving. Laat de vaste balk met prijs en "Nu kopen" vanaf binnenkomst zien en verberg hem alleen als de gewone knop in beeld is.' },
  { t: '€30 wordt bij het afrekenen €38,65', effect: 'groot', werk: 'uren',
    nu: 'Advertentie, landingspagina en productpagina noemen €30. De verzendkosten van €6,45 staan klein en grijs onder de prijs. De "Buyer Protection fee" van €2,20 staat nergens op de productpagina en verschijnt pas op de afrekenpagina. Het totaal is 29% hoger dan de prijs uit de advertentie. De eigen voorwaarden van de shop zeggen: "Purchases from Yoors itself have no fee."',
    waarom: 'Een prijs die onderweg stijgt voelt als verlies, en verlies weegt zwaarder dan dezelfde winst. Bij Baymard noemt 40% van de afhakers te hoge bijkomende kosten en 12% dat het totaal niet vooraf te zien was. Bij bol kost een windspinner van hetzelfde merk en dezelfde maat €32,50 inclusief bezorging.',
    doen: 'Haal de fee van €2,20 weg bij producten die de shop zelf verkoopt, zoals de voorwaarden al zeggen, of verwerk hem in de productprijs. Zet onder de prijs en in de vaste balk het hele bedrag: "Thuisbezorgd €36,45". Geef de verzendkosten door in de productlijst (veld shipping_cost uit de eerste briefing); dan zet de lus het bedrag ook op de landingspagina.' },
  { t: 'Afrekenen is in het Engels', effect: 'middel', werk: 'dagen',
    nu: 'De afrekenpagina is altijd Engels, ook voor een Nederlandse bezoeker: "Order", "Address", "Pick-up point", "Buyer Protection fee", "Total to pay", "Pay". Een telefoon met Engels als eerste taal krijgt de hele shop in het Engels. De pagina\'s over retourneren, verzending, kopersbescherming en de voorwaarden zijn ook Engels.',
    waarom: 'Als de taal wisselt op het moment dat je moet betalen, vraag je je af of je nog bij dezelfde winkel bent. Bij een winkel die je niet kent is dat genoeg om te stoppen.',
    doen: 'Vertaal de afrekenpagina en de vier informatiepagina\'s. Houd de taal vast van de productpagina tot en met de betaling. Aan mijn kant is het al aangepast: elke link uit een advertentie krijgt nu ?lang=nl mee.' },
  { t: 'De bundel staat al aangevinkt, voor de koopknop', effect: 'middel', werk: 'uren',
    nu: 'Het eerste bedrag en de eerste koopknop die een telefoonbezoeker tegenkomt zijn "€94,50" en "Bundel kopen" (op 3230 pixels, voor de gewone knop). Er staan drie producten aangevinkt: dit product en twee andere die hij niet koos, bij elk bezoek andere.',
    waarom: 'Het eerste bedrag dat iemand ziet wordt zijn ijkpunt. Hij kwam voor €30 en ziet €94,50. Iets dat al voor je is aangevinkt voelt als aansmeren. De ACM zegt hierover: "U mag geen opties vooraf aanvinken of opties standaard toevoegen aan een bestelling."',
    doen: 'Zet het bundelblok onder het koopblok en vink alleen dit product aan. Of bied de bundel pas aan op de afrekenpagina of na de bestelling.' },
  { t: 'iDEAL en de levertijd staan er niet, terwijl ze er wel zijn', effect: 'middel', werk: 'uren',
    nu: 'Het blok "Betalen" op de productpagina noemt PayPal, Visa en Mastercard. iDEAL staat alleen in de voettekst en op de afrekenpagina, waar het de aanbevolen keuze is. Bij "Levering" staat "Berekend bij het afrekenen", terwijl de afrekenpagina "2-4 business days" zegt en de verzendpagina 3 tot 5 werkdagen.',
    waarom: 'iDEAL is goed voor 71% van de online aankopen in Nederland. Wie het niet ziet staan, denkt dat hij een PayPal-account of creditcard nodig heeft. Zonder bezorgdatum weet een koper niet of het op tijd komt, zeker bij een cadeau of iets voor Halloween.',
    doen: 'Zet het iDEAL-logo als eerste onder de koopknop. Zet bij de prijs "Bezorgd in 2 tot 4 werkdagen met DHL", nadat bij de leverancier is nagegaan welke termijn klopt. Geef de levertijd door in de productlijst (veld delivery_days).' },
  { t: 'Je weet niet wat je krijgt', effect: 'middel', werk: 'dagen',
    nu: 'Er is een foto, op een witte achtergrond. Er staat geen doorsnede, geen gewicht en niet wat er in de doos zit. De regel "Binnenoptie: kan binnenshuis worden gebruikt met een batterijmotor" leest alsof die motor erbij zit. Volgens de site van het merk Art Bizniz is dit artikel 12DHU300: doorsnede 30 cm, met haakje, zonder motor. Dat moet bij de leverancier bevestigd worden.',
    waarom: 'Op een losse foto kan hij 10 of 40 centimeter zijn. Wie twijfelt koopt niet, en wie verkeerd gokt stuurt terug.',
    doen: 'Zet de doorsnede in de titel en bij de specificaties. Voeg toe wat er in de doos zit en dat de motor niet wordt meegeleverd. Toon drie tot vijf foto\'s, waarvan een in een tuin en een met de maat erbij, en een kort filmpje van de draaiende spinner. Geen van de andere winkels heeft een filmpje of tuinfoto, dus dit is een goedkoop voordeel.' },
  { t: 'Cijfers en blokken die tegen de shop werken', effect: 'middel', werk: 'uren',
    nu: 'Op de pagina staan: "8 keer bekeken", "Nog geen reviews voor deze verkoper", "Staat: New with tags", "Geplaatst 7 okt 2026", "Dit product melden" en "Maak content over dit product en verdien €2,65 per verkoop". "Registreren" is de opvallendste knop op het eerste scherm. In de rij categorieen draait een laad-rondje dat nooit stopt. Het product staat onder "Sport & buiten".',
    waarom: 'Laten zien wat anderen doen werkt twee kanten op. "8 keer bekeken" en "nog geen reviews" zeggen dat hier niemand koopt. "New with tags" en "Geplaatst" horen bij tweedehands spullen van particulieren. De €2,65 vertelt de koper dat er een opslag op de prijs zit. Een rondje dat blijft draaien ziet eruit als een kapotte pagina.',
    doen: 'Toon de kijkteller en het reviewblok pas boven een drempel, bijvoorbeeld 50 keer bekeken en 3 reviews. Haal bij producten die de shop zelf verkoopt "Staat", "Geplaatst" en "Dit product melden" weg. Toon de affiliate-regel en "Registreren" niet aan bezoekers uit een advertentie (utm_medium=push), of zet ze in de voettekst. Repareer het laad-rondje. Zet het product onder "Tuin".' },
  { t: 'Beloftes die niet kloppen met de eigen voorwaarden', effect: 'klein tot middel', werk: 'uren, plus een jurist',
    nu: 'De productpagina belooft "Gratis retourneren binnen 14 dagen". De retourpagina zegt dat dit alleen geldt bij "pro shops" en anders: "standard return shipping applies, the exact cost is shown on the listing" (dat bedrag staat er niet). De voorwaarden zeggen bij koop van Yoors zelf: "The cost of sending it back is yours". De pagina noemt nergens wie de verkoper is, terwijl de voorwaarden zeggen: "The product page always shows who the seller is." Een postadres en telefoonnummer ontbreken.',
    waarom: 'Een winkel die je niet kent moet het van zekerheid hebben. Wie doorklikt naar de kleine lettertjes en daar iets anders leest, haakt af. Daarnaast loopt de shop hier risico bij de toezichthouder.',
    doen: 'Kies een retourregel en zet die gelijk op de productpagina, de retourpagina en in de voorwaarden, in het Nederlands. Zet bij de koopknop "Verkocht en verzonden door Yoors Shop (AdsFair B.V.)". Zet een postadres en telefoonnummer in de voettekst.' },
  { t: 'De sterkste belofte staat klein', effect: 'klein tot middel', werk: 'uren',
    nu: 'Het blok "Zo is je betaling beschermd" neemt anderhalf scherm in, voor de prijs. Stap 3 vraagt de koper te "bevestigen dat je tevreden bent om de betaling vrij te geven". De zin die telt, dat je betaling wordt vastgehouden tot je pakket binnen is, staat klein onder de knop.',
    waarom: 'Mensen zijn banger om geld kwijt te raken dan dat ze blij zijn met een koopje. "Geld terug" naast de knop neemt die angst weg. Een uitleg in vier stappen leest als gedoe.',
    doen: 'Zet een regel direct onder de knop: "Niet goed? Geld terug. Wij houden je betaling vast tot je pakket binnen is." Maak de vier stappen inklapbaar en zet ze onderaan.' },
];

const PAD = [
  ['Advertentie', 'Foto, "Windspinner voor in de tuin", "Roestvrijstalen kolibrie, €30".', 'Verwachting: dit product voor €30.'],
  ['Landingspagina', 'Dezelfde foto, titel en prijs, knop "Bekijk in de shop".', 'Hier klikt ruim de helft van de echte bezoekers door.'],
  ['Productpagina, eerste scherm', 'Foto en "Beschrijving". Geen titel, geen prijs, geen knop.', 'Wie de prijs niet terugziet, gaat weg.'],
  ['Scherm 2 tot en met 4', 'Tekst, uitleg over betalen, dan de bundel van €94,50 met "Bundel kopen".', 'Het eerste bedrag is drie keer zo hoog als beloofd.'],
  ['Scherm 5', 'Titel, €30, "+ €6,45 verzendkosten", "Nu kopen".', 'Je moet vier schermen scrollen om hier te komen.'],
  ['Na "Nu kopen"', '"Welkom terug, log in op je Yoors-account."', 'Een nieuwe bezoeker heeft geen account. Het product is uit beeld.'],
  ['Account aanmaken', '"Begin met schrijven, delen en verdienen." E-mail invullen, naar je mailbox, link tikken.', 'Daarna moet je zelf het product terugzoeken.'],
  ['Afrekenen', 'In het Engels. Adres invullen. Totaal €38,65 door een fee van €2,20.', 'Andere taal en een hoger bedrag dan beloofd.'],
  ['Betalen', 'iDEAL, PayPal of kaart.', 'Dit deel is goed, maar het staat achter alle stappen hierboven.'],
];

const VOLGORDE = [
  'Smalle kop met alleen het logo.',
  'Foto\'s, om doorheen te vegen.',
  'Titel, het hele bedrag, "Op voorraad, bezorgd in 2 tot 4 werkdagen".',
  '"Nu kopen", met de betaallogo\'s eronder, iDEAL voorop.',
  'Drie vinkjes: geld terug, betaling vastgehouden tot je pakket binnen is, track & trace.',
  'Vier kernpunten, met de maat en wat er in de doos zit.',
  'Beschrijving en specificaties, inklapbaar.',
  'Verzending, retourneren en betalen.',
  '"Zo is je betaling beschermd", ingekort.',
  'Reviews, alleen als ze er zijn.',
  'Bundel & bespaar, met alleen dit product aangevinkt.',
  'Voettekst, met daarin de affiliate-regel en Delen.',
];

const TEKST = [
  ['Elegante windspinner voor uw tuin', 'Windspinner met kolibries voor in je tuin', 'De rest van de pagina zegt je, hier staat u.'],
  ['voegt een vleugje charme toe aan elke buitenruimte', 'Rood-groene windspinner van roestvrij staal, [Ø 30 cm].', 'Zegt niets over het product.'],
  ['Gemaakt van roestvrijstaand roestvrij staal.', 'Roestvrij staal: roest niet en kan buiten blijven hangen.', 'Vertaalfout.'],
  ['Voorzien van een hoogwaardige haak en draaimechanisme voor eenvoudig draaien.', 'Draait soepel: het haakje en de wartel zitten erbij.', 'Krom.'],
  ['Kan binnenshuis worden gebruikt met een batterijmotor.', 'Binnen draait hij alleen met een losse motor op batterijen (niet meegeleverd).', 'Leest nu alsof de motor erbij zit.'],
  ['Plat verpakt voor gemakkelijke gifting.', 'Plat verpakt, makkelijk cadeau te geven.', 'Half Engels.'],
  ['Staat: New with tags', 'Nieuw, in de originele verpakking', 'Engels, en klinkt als tweedehands.'],
  ['Levering: Berekend bij het afrekenen', 'Bezorgd in 2 tot 4 werkdagen', 'De termijn is bekend, zet hem erbij.'],
  ['Locatie: NL', 'Verzonden vanuit Nederland', 'Duidelijker.'],
];

const MARKT = [
  ['Yoors Shop', '€30 + €6,45 = €36,45 (tot 9 okt €38,65)', 'niet vermeld', '1', PRODUCT],
  ['Art Bizniz zelf (voor winkeliers)', '€32,50, verzending niet vermeld', 'Ø 30 cm', '1', 'https://www.artbizniz.nl/product/spin-art-rvs-kolibrie-windspinner-12dhu300-o-30cm/'],
  ['Klank en Ontspanning (niet op voorraad)', '€34,99, verzending niet vermeld', 'circa 30 cm', '1', 'https://www.klankenontspanning.nl/verkoop/product/1678-windspinner-spinart-hummingbird-kolibrie/category_pathway-131'],
  ['bol, zelfde merk en maat, met vlinder', '€32,50 inclusief bezorging', 'Ø 30 cm', '2', 'https://www.bol.com/nl/nl/p/spin-art-windspinner-vlinder-rvs-o-30-cm-blauw/9200000072536885/'],
];

// [punt, oordeel, bron, bron-nr, bron-nr, is het opgelost (index in STATUS of null)]
const REGELS = [
  ['Fee van €2,20 buiten de getoonde prijs', 'Lijkt in strijd', 'ACM: "In de prijs zitten alle bijkomende kosten." Anders "mogen consumenten ze weigeren te betalen, of later terugvragen". Vinted moest in 2024 na klachten over zijn verplichte kopersbijdrage de totaalprijs duidelijker tonen.', 1, 2, 2],
  ['Verzendkosten niet in de advertentieprijs', 'Grijs gebied', 'Op de productpagina staan ze naast de prijs. In de advertentie en op de landingspagina nog niet.', 1, 0, null],
  ['"Gratis retourneren" tegenover de eigen voorwaarden', 'Lijkt in strijd', 'ACM: "Vertel wie het terugsturen betaalt, anders zijn deze kosten voor u." De drie teksten van de shop spreken elkaar tegen.', 3, 0, 8],
  ['Drie producten vooraf aangevinkt in de bundel', 'Grijs gebied', 'ACM: "U mag geen opties vooraf aanvinken of opties standaard toevoegen aan een bestelling."', 1, 0, 4],
  ['Verplicht account om te kopen', 'Grijs gebied', 'De ACM zag in 2023 geen overtreding. De Europese privacytoezichthouders (EDPB) schreven eind 2025 in een conceptaanbeveling dat een eenmalige aankoop geen verplicht account rechtvaardigt.', 4, 5, 0],
  ['Levertijd pas zichtbaar na inloggen', 'Grijs gebied', 'ACM: "Maak voor de koop duidelijk wanneer en hoe u producten levert."', 6, 0, 5],
  ['Niet duidelijk wie de verkoper is', 'Lijkt in strijd', 'ACM: marktplaatsen "moeten consumenten voor de aankoop informeren met wie zij zaken doen".', 7, 0, 8],
  ['Geen postadres en telefoonnummer', 'Lijkt in strijd', 'Ondernemersplein noemt adres, e-mailadres en telefoonnummer als verplichte gegevens voor een webwinkel. Het postadres staat er nu; een telefoonnummer nog niet.', 8, 0, null],
];

const BRONNEN = [
  ['ACM, prijzen vermelden', 'https://www.acm.nl/nl/verkoop-aan-consumenten/consumenten-informeren/prijzen-vermelden'],
  ['ACM, Vinted moet duidelijker zijn over prijzen (18 juni 2024)', 'https://www.acm.nl/nl/publicaties/eu-consumententoezichthouders-dwingen-vinted-duidelijker-te-zijn-over-prijzen-en-voorwaarden'],
  ['ACM, bedenktijd en retourkosten', 'https://www.acm.nl/nl/verkoop-aan-consumenten/klantenservice/bedenktijd'],
  ['Consumentenbond, webwinkels verplichten onnodig accounts', 'https://www.consumentenbond.nl/internet-privacy/webwinkels-verplichten-onnodig-accounts'],
  ['EDPB, aanbevelingen over verplichte accounts (concept, december 2025)', 'https://www.edpb.europa.eu/system/files/2025-12/edpb-recommendations-202502-mandatory-user-accounts_en.pdf'],
  ['ACM, levering en levertijd', 'https://www.acm.nl/nl/onderwerpen/verkoop-aan-consumenten/verkopen-aan-consumenten/levering-levertijd-en-risico/'],
  ['ACM, strengere regels voor online verkopers', 'https://www.acm.nl/nl/publicaties/acm-strengere-regels-voor-online-verkopers'],
  ['Ondernemersplein, regels voor online verkoop', 'https://ondernemersplein.overheid.nl/regels-voor-online-verkoop/'],
  ['Baymard, redenen om af te haken bij het afrekenen (Amerikaanse kopers)', 'https://baymard.com/lists/cart-abandonment-rate'],
  ['Betaalvereniging Nederland, online betalen', 'https://www.betaalvereniging.nl/en/knowledge-base/online-payments/'],
];

export function adviesPagina(o) {
  const { sk, css, esc, vandaag, gisteren = {}, totaal, kosten, inz, lessen, bijgewerkt, pxGezien, stand, nlTijd } = o;
  const st = stand || STAND_10OKT;
  const statussen = STATUS.map(f => f(st));
  const telStatus = w => statussen.filter(x => x[0] === w).length;
  const gemeten = stand && nlTijd ? 'live gemeten ' + nlTijd(new Date(stand.at).toISOString()) : 'gemeten op 10 oktober 2026';
  const topProducten = ((inz && inz.producten) || []).filter(x => x.doorVooraan + x.doorLijst >= 3).slice(0, 6);
  const n = v => Number(v) || 0;
  const usd = v => '$' + n(v).toFixed(2).replace('.', ',');
  const pct = (a, b) => (b ? String(Math.round(1000 * a / b) / 10).replace('.', ',') + '%' : '-');
  const tabel = (kop, rijen, leeg, kol) => `<div class="tw"><table><tr>${kop}</tr>${rijen || `<tr><td colspan="${kol}">${esc(leeg)}</td></tr>`}</table></div>`;
  const NETTEN = [['pa', 'PropellerAds'], ['ra', 'RichAds'], ['md', 'Mondiad'], ['ca', 'Clickadu'], ['x', 'Overig']];
  const som = (obj, s) => NETTEN.reduce((a, [k]) => a + n((obj[k] || {})[s]), 0);
  const kaart = (t, v, sub) => `<div class="k"><div class="kt">${esc(t)}</div><div class="kv">${v}</div>${sub ? `<div class="ks">${esc(sub)}</div>` : ''}</div>`;
  const beeld = (k, bij) => `<figure><img src="${beelden[k].src}" width="${Math.round(beelden[k].w * 0.72)}" height="${Math.round(beelden[k].h * 0.72)}" alt="${esc(bij)}" loading="lazy"><figcaption>${esc(bij)}</figcaption></figure>`;
  const bron = i => (i ? ` <a href="${esc(BRONNEN[i - 1][1])}">[${i}]</a>` : '');
  const kostenTot = Object.values(kosten || {}).reduce((a, v) => a + n(v), 0);
  const ads = ((inz && inz.advertenties) || []).filter(a => a.bezoekers >= 10).slice(0, 8);
  const themas = ((inz && inz.themas) || []).filter(t => t.bezoekers >= 5);
  const uren = ((inz && inz.uren) || []).slice().sort((a, b) => b.doorkliks - a.doorkliks).slice(0, 4).filter(u => u.doorkliks > 0);
  const kliks = som(totaal, 'klik');
  // Zolang de shop geen winkelwagens en bestellingen terugmeldt, zegt een les daarover niets; die regels blijven dan weg.
  const lesRegels = (lessen || []).filter(l => pxGezien || !/winkelwagen|bestelling/i.test(l));

  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><title>Briefing voor Babita: campagnes en verkoop</title>
<style>${css}.wrap{max-width:54rem}.tw{overflow-x:auto;border:1px solid var(--line);border-radius:12px;margin:0 0 14px}table{border-collapse:collapse;width:100%;font-size:.9375rem}th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}th{color:var(--ink-3);font-weight:650;white-space:nowrap}tr:last-child td{border-bottom:0}td.n,th.n{text-align:right;white-space:nowrap}td:first-child{min-width:9.5rem}
.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:0 0 14px}.k{background:var(--bg-2);border:1px solid var(--line);border-radius:12px;padding:12px 14px}.kt{font-size:.875rem;color:var(--ink-3)}.kv{font-size:1.625rem;font-weight:750}.ks{font-size:.8125rem;color:var(--ink-3)}
h1{font-size:1.875rem}h2{margin-top:46px}.t{color:var(--ink-3);font-size:.8125rem}.uitleg{color:var(--ink-2);font-size:.9375rem;margin:0 0 12px}
.bev{border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin:0 0 14px;background:var(--bg)}.bev h3{margin:0 0 4px;font-size:1.125rem}.bev .lab{font-size:.75rem;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-3);font-weight:650;margin:12px 0 2px}.bev p{margin:0;color:var(--ink-2)}.bev .doen{color:var(--ink)}
.pil{display:inline-block;font-size:.75rem;border:1px solid var(--line);border-radius:999px;padding:2px 9px;color:var(--ink-3);margin:0 6px 0 0}.pil.groot{border-color:var(--acc);color:var(--acc);font-weight:650}
.fig{display:flex;gap:14px;overflow-x:auto;margin:0 0 14px;padding:0 0 6px;align-items:flex-start}figure{margin:0;flex:0 0 auto}figure img{display:block;border:1px solid var(--line);border-radius:10px;height:auto}figcaption{font-size:.8125rem;color:var(--ink-3);max-width:259px;margin:6px 0 0;line-height:1.4}
ol.st,ul.st{padding-left:20px;margin:0 0 14px}ol.st li,ul.st li{margin:0 0 8px}.nw{border:1px solid var(--line);border-left:3px solid var(--acc);border-radius:10px;padding:14px 18px;margin:0 0 14px;background:var(--bg-2)}.nw p{margin:0 0 8px}.nw p:last-child{margin:0}
.st-gedaan,.st-deels,.st-open{display:inline-block;font-size:.75rem;font-weight:700;border-radius:999px;padding:2px 9px;white-space:nowrap}.st-gedaan{background:#DCFCE7;color:#166534}.st-deels{background:#FEF3C7;color:#92400E}.st-open{background:#FEE2E2;color:#991B1B}
@media (prefers-color-scheme:dark){.st-gedaan{background:#14532D;color:#BBF7D0}.st-deels{background:#78350F;color:#FDE68A}.st-open{background:#7F1D1D;color:#FECACA}}
details.oud{border:1px solid var(--line);border-radius:12px;padding:12px 16px;margin:0 0 14px}details.oud>summary{cursor:pointer;font-weight:650}</style></head><body><main class="wrap">
<p class="kicker">Yoors Shop · voor Babita</p><h1>Wat de campagnes leren en wat de verkoop nog tegenhoudt</h1>
<p class="standfirst">Van de tien punten van 8 oktober zijn er ${telStatus('gedaan')} doorgevoerd${telStatus('deels') ? `, ${telStatus('deels')} deels` : ''}${telStatus('open') ? ` en ${telStatus('open')} nog open` : ''}. Kopen zonder account, het koopblok bovenaan en het hele bedrag vooraf zijn geregeld. Wat nu het meest telt: de shop moet winkelwagens en betalingen terugmelden, anders zien we niet of het werkt.</p>
<p class="meta">Cijfers bijgewerkt ${esc(bijgewerkt)} (Nederlandse tijd); ze verversen bij elk bezoek aan deze pagina. De stand van de shop is ${esc(gemeten)}, als Nederlandse telefoon zonder account, op <a href="${esc(PRODUCT)}">deze productpagina</a> en de afrekenpagina erachter. <a href="/api/shop/overzicht?k=${esc(sk)}">Naar het leerlus-overzicht</a> · <a href="/api/shop/briefing?k=${esc(sk)}">Naar de eerste briefing (wat de shop moet teruggeven)</a></p>

<div class="answer"><p><strong>In het kort.</strong> Sinds de start kwamen ${som(totaal, 'view')} bezoekers op de landingspagina, waarvan ${som(totaal, 'mens')} aantoonbaar een mens. ${kliks} klikten door naar een productpagina in de shop. ${pxGezien ? `De shop meldde ${som(totaal, 'cart')} keer een winkelwagen en ${som(totaal, 'koop')} bestellingen.` : 'Of dat tot bestellingen leidde kan de lus nog niet zien, omdat de shop dat niet terugmeldt. Kijk in de shop zelf hoeveel bestellingen er sinds 8 oktober zijn binnengekomen.'}</p>
<p>De grootste drempels van 8 oktober zijn weg: je kunt kopen zonder account, op een telefoon staan prijs en knop direct onder de foto, en €30 wordt bij het afrekenen geen €38,65 meer maar €36,45, zoals vooraf staat. Wat er nu ligt is vooral productinformatie en een paar losse eindjes.</p>
<p>Een eerlijke kanttekening: de lus ziet nog geen enkele winkelwagen of betaling, dus we weten niet of de verbeteringen meer verkoop geven. De cijfers hieronder gaan alleen over het verkeer tot en met de doorklik naar de shop; die worden niet beter of slechter door wat er in de shop verandert.</p></div>

<h2>Nu nog doen</h2>
<ol class="st"><li><strong>Winkelwagen en betaling terugmelden${pxGezien ? ' (werkt al)' : ''}.</strong> ${pxGezien ? 'De lus ziet de meldingen binnenkomen.' : 'Er is nog geen enkele melding binnengekomen. Zonder dit stuurt de lus op doorkliks in plaats van op verkoop, en zien we niet of de verbeteringen van deze week iets doen.'} Het bestand en de stappen staan in <a href="/api/shop/briefing?k=${esc(sk)}">de eerste briefing</a>, punt 1.</li>
<li><strong>Productinformatie bij de producten die het meest bezocht worden:</strong> de maat, wat er in de doos zit, wat er niet bij zit, en meer dan één foto. Bij de windspinner staat nog ${st.fotos == null ? 'één' : st.fotos} foto en de zin over de batterijmotor. ${topProducten.length ? 'Begin met: ' + topProducten.map(x => esc(String(x.titel).slice(0, 55)) + ' (' + (x.doorVooraan + x.doorLijst) + ' doorkliks)').join('; ') + '.' : ''}</li>
${statussen[5][0] !== 'gedaan' ? `<li><strong>Eén levertijd.</strong> ${esc(statussen[5][1])} Kies een termijn en zet die op beide pagina's en in de productlijst (veld <code>delivery_days</code>).</li>` : ''}
${statussen[7][0] !== 'gedaan' ? `<li><strong>De laatste blokken die tegen de shop werken.</strong> ${esc(statussen[7][1].replace(/^.*Nog over: /, 'Nog over: '))} Verberg de affiliate-regel en "Registreren" voor bezoekers uit een advertentie (<code>utm_medium=push</code> of <code>ipp</code>).</li>` : ''}
${st.shippingCost === 'null' || st.shippingCost == null ? '<li><strong>Verzendkosten in de productlijst</strong> (veld <code>shipping_cost</code>, staat nu op leeg). Dan zet de lus "Thuisbezorgd €36,45" ook in de advertentie en op de landingspagina, zodat de prijs al vanaf de eerste tik klopt.</li>' : ''}</ol>

<h2>Wat sinds 8 oktober is veranderd</h2>
${tabel('<th>Punt van 8 oktober</th><th>Stand</th><th>Wat er nu staat</th>', BEVINDINGEN.map((b, i) => `<tr><td><b>${i + 1}. ${esc(b.t)}</b></td><td><span class="st-${statussen[i][0]}">${statussen[i][0]}</span></td><td>${esc(statussen[i][1])}</td></tr>`).join(''), '', 3)}
<p class="uitleg">Deze tabel meet de pagina zelf, hooguit eens per uur. Als er iets verandert in de shop, staat het hier vanzelf.</p>

<h2>Wat de campagnes leren</h2>
<div class="g">${kaart('Bezoekers', som(totaal, 'view'), 'gisteren ' + som(gisteren, 'view') + ', vandaag ' + som(vandaag, 'view'))}${kaart('Echte mensen', som(totaal, 'mens'), 'bewogen of tikten, ' + pct(som(totaal, 'mens'), som(totaal, 'view')))}${kaart('Door naar de shop', kliks, 'gisteren ' + som(gisteren, 'klik') + ', vandaag ' + som(vandaag, 'klik'))}${kaart('Bestellingen', som(totaal, 'koop'), pxGezien ? 'gemeld door de shop' : 'nog niet meetbaar')}${kaart('Kosten laatste dag', usd(kostenTot), 'per netwerk over de laatste volle dag')}</div>
${tabel('<th>Netwerk</th><th class="n">Bezoekers</th><th class="n">Echte mensen</th><th class="n">Naar de shop</th><th class="n">Kosten laatste dag</th>', NETTEN.filter(([k]) => n((totaal[k] || {}).view)).map(([k, naam]) => `<tr><td>${naam}</td><td class="n">${n(totaal[k].view)}</td><td class="n">${n(totaal[k].mens)}</td><td class="n">${n(totaal[k].klik)}</td><td class="n">${k === 'x' ? '-' : usd((kosten || {})[k])}</td></tr>`).join(''), 'Nog geen bezoekers', 5)}
<h3>Welke advertenties bezoekers naar de shop brengen</h3>
${tabel('<th>Advertentie</th><th class="n">Bezoekers</th><th class="n">Echte mensen</th><th class="n">Naar de shop</th><th class="n">Doorklik</th>', ads.map(a => `<tr><td><b>${esc(a.titel)}</b><br><span class="t">${esc(a.tekst)}</span></td><td class="n">${a.bezoekers}</td><td class="n">${a.echtPct == null ? '-' : String(a.echtPct).replace('.', ',') + '%'}</td><td class="n">${a.doorkliks}</td><td class="n">${a.doorklikPct == null ? '-' : String(a.doorklikPct).replace('.', ',') + '%'}</td></tr>`).join(''), 'Nog te weinig bezoekers per advertentie', 5)}
${themas.length ? `<h3>Welke thema's</h3>${tabel('<th>Thema</th><th class="n">Bezoekers</th><th class="n">Naar de shop</th><th class="n">Doorklik</th>', themas.map(t => `<tr><td>${esc(t.naam)}</td><td class="n">${t.bezoekers}</td><td class="n">${t.doorkliks}</td><td class="n">${t.doorklikPct == null ? '-' : String(t.doorklikPct).replace('.', ',') + '%'}</td></tr>`).join(''), '', 4)}` : ''}
${uren.length ? `<p class="uitleg">Beste uren tot nu toe (Nederlandse tijd): ${uren.map(u => `${String(u.uur).padStart(2, '0')}:00 (${u.doorkliks} doorkliks op ${u.bezoekers} bezoekers)`).join(', ')}.</p>` : ''}
${lesRegels.length ? `<h3>Lessen van de lus</h3><div class="nw">${lesRegels.map(l => `<p>${esc(l)}</p>`).join('')}</div>` : ''}
<h3>Wat dit voor de shop betekent</h3>
<ul class="st"><li><strong>Het verkeer is er en het is goedkoop.</strong> Een bezoeker op een productpagina kostte op de eerste dag ongeveer 2 cent. Elke verbetering in de shop telt dus direct.</li>
<li><strong>Van elke 100 bezoekers doen er ${Math.round(100 * som(totaal, 'mens') / Math.max(1, som(totaal, 'view')))} aantoonbaar iets.</strong> De rest tikte per ongeluk of is geen mens; de lus sluit die plekken zelf uit. Wie wel doorklikt heeft moeite gedaan. Die wil je niet kwijtraken op een inlogpagina.</li>
<li><strong>Bouwpakketten en seizoensproducten trekken het meest:</strong> book nooks, muziekdozen, de skull-lantaarn en de pumpkin spice-kaarsen. Zet die pagina's als eerste goed: Nederlandse titel, maat, meerdere foto's.</li>
<li><strong>De avond telt.</strong> Op de eerste dag kwamen de meeste doorkliks tussen 20 en 23 uur, op een telefoon. Dat is een koper die snel wil kunnen afrekenen met iDEAL.</li>
<li><strong>Lees de cijfers per advertentie voorzichtig.</strong> Een enkele advertentieplek levert een groot deel van de doorkliks. De lus houdt in de gaten of dat echte mensen zijn.</li></ul>

<h2>Zo stond het op 8 oktober</h2>
<details class="oud"><summary>Het pad van een bezoeker, de schermafbeeldingen en de tien punten met uitleg</summary>
<p class="uitleg">Zo liep iemand die op een advertentie tikte, stap voor stap, op een telefoon. Dit is de oude stand; de tabel hierboven zegt wat er nu staat.</p>
${tabel('<th>Stap</th><th>Wat hij ziet</th><th>Wat er misgaat</th>', PAD.map((r, i) => `<tr><td><b>${i + 1}. ${esc(r[0])}</b></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join(''), '', 3)}
<div class="fig">${beeld('scherm1', 'Het eerste scherm van de productpagina: geen titel, geen prijs, geen koopknop.')}${beeld('bundel', 'Het eerste bedrag met een knop: de bundel, met drie producten al aangevinkt.')}${beeld('login', 'Na een tik op "Nu kopen": inloggen. Het product is uit beeld.')}${beeld('totaal', 'De afrekenpagina: Engels, en €30 is €38,65 geworden.')}</div>

<h3>De tien punten</h3>
${BEVINDINGEN.map((b, i) => `<div class="bev"><h3>${i + 1}. ${esc(b.t)}</h3><span class="pil${b.effect === 'groot' ? ' groot' : ''}">effect: ${esc(b.effect)}</span><span class="pil">werk: ${esc(b.werk)}</span>
<span class="st-${statussen[i][0]}">${statussen[i][0]}</span><div class="lab">Op 8 oktober</div><p>${esc(b.nu)}</p><div class="lab">Waarom dit kopers kost</div><p>${esc(b.waarom)}</p><div class="lab">Veranderen</div><p class="doen">${esc(b.doen)}</p></div>`).join('')}
<h3>Zo moest de pagina er op een telefoon uitzien</h3>
<ol class="st">${VOLGORDE.map(v => `<li>${esc(v)}</li>`).join('')}</ol>
</details>


<h2>Betere tekst voor dit product</h2>
<p class="uitleg">De tekst van de windspinner is nog niet aangepast; dit geldt dus nog. Wat tussen [haken] staat moet eerst bij de leverancier worden nagegaan. Er is niets bij verzonnen.</p>
<div class="nw"><p><strong>Titel:</strong> Windspinner kolibrie, roestvrij staal, [Ø 30 cm]</p>
<p><strong>Onder de prijs:</strong><br>Roestvrij staal, [Ø 30 cm], haakje zit erbij<br>In [2 tot 4 werkdagen] in huis, verzonden vanuit Nederland met DHL<br>14 dagen retour, betalen met iDEAL of PayPal</p>
<p><strong>Beschrijving:</strong> Een rood-groene windspinner van roestvrij staal, met in het midden kolibries tussen de bloemen. Hang hem aan het meegeleverde haakje in een boom, aan de pergola of op je balkon. Bij een beetje wind gaat hij draaien en vangt hij het zonlicht. Roestvrij staal roest niet, dus hij kan buiten blijven hangen. Doorsnede [30 cm], gewicht [... gram]. Hij wordt plat verpakt geleverd [zelf in vorm buigen: ja of nee, met uitleg]. Wil je hem binnen laten draaien? Dan heb je een losse motor op batterijen nodig; die zit er niet bij.</p></div>
${tabel('<th>Staat er nu</th><th>Beter</th><th>Waarom</th>', TEKST.map(r => `<tr><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td><td>${esc(r[2])}</td></tr>`).join(''), '', 3)}
<p class="uitleg">Verder: kopjes met alleen het eerste woord een hoofdletter ("Klaar om te geven"), en de alinea's "Buiten Gebruik" en "Veelzijdig Gebruik" kunnen weg; ze herhalen wat er al staat.</p>

<h2>De prijs tegenover andere winkels</h2>
${tabel('<th>Winkel</th><th>Prijs</th><th>Maat vermeld</th><th class="n">Foto\'s</th>', MARKT.map(r => `<tr><td><a href="${esc(r[4])}">${esc(r[0])}</a></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td class="n">${esc(r[3])}</td></tr>`).join(''), '', 4)}
<p class="uitleg">€30 is een nette prijs: onder het merk zelf en onder de enige andere winkel met dit model. Thuisbezorgd €36,45 ligt nog bijna €4 boven wat bol voor dezelfde spinner met een ander motief vraagt; met de fee was dat ruim €6. Geen van deze winkels heeft een filmpje, een foto in een tuin of reviews. Daar is het verschil goedkoop te maken.</p>

<h2>Niet doen</h2>
<p class="uitleg">Er zijn trucs die op korte termijn verkopen en op lange termijn klanten en vertrouwen kosten. Gebruik ze niet: "nog 2 op voorraad" als dat niet klopt, aftelklokken, "12 mensen bekijken dit nu", verzonnen reviews en vooraf aangevinkte extra's. Wat wel werkt en eerlijk is: een echte bezorgdatum, het hele bedrag vooraf, "geld terug" groot in beeld, en echte reviews ophalen met een mail een week na levering.</p>

<h2>Regels: laat een jurist dit bevestigen</h2>
<p class="uitleg">Dit is geen juridisch advies. Het zijn punten waar de pagina afwijkt van wat de toezichthouder schrijft; de bron staat erbij.</p>
${tabel('<th>Punt</th><th>Stand</th><th>Oordeel</th><th>Wat de bron zegt</th>', REGELS.map(r => { const s0 = r[5] == null ? 'open' : statussen[r[5]][0]; return `<tr><td><b>${esc(r[0])}</b></td><td><span class="st-${s0}">${s0}</span></td><td>${esc(r[1])}</td><td>${esc(r[2])}${bron(r[3])}${bron(r[4])}</td></tr>`; }).join(''), '', 4)}

<h2>Wat aan de kant van de advertenties al is aangepast</h2>
<ul class="st"><li>Elke link van de landingspagina naar de shop krijgt nu <code>?lang=nl</code> mee, zodat ook een telefoon met Engels als taal de Nederlandse pagina krijgt.</li>
<li>Op de landingspagina staat nu "Betalen met iDEAL, PayPal of creditcard" in plaats van alleen PayPal.</li>
<li>Zodra de productlijst verzendkosten en levertijd doorgeeft (velden <code>shipping_cost</code> en <code>delivery_days</code>), zet de lus die op de landingspagina.</li>
<li>De doorklik gaat nu rechtstreeks naar <code>yoo.rs/product/…</code>, het nieuwe adres van de productpagina, zonder omweg via <code>/shop/product/</code>.</li>
<li>Als een prijs in de shop verandert, maakt de lus zelf dezelfde advertentie met de nieuwe prijs. Op 9 en 10 oktober veranderden ruim twintig prijzen; die advertenties zijn bijgewerkt.</li>
<li>Op PropellerAds komen er op 10 oktober campagnes bij voor tuin, keuken, kinderkamer, tassen en sokken, en planten, plus een campagne met alleen de advertenties die het best doorklikken.</li>
<li>Nu het koopblok bovenaan staat, testen we een deel van de advertenties rechtstreeks naar de productpagina, zonder tussenstap.</li></ul>

<h2>Hoe we zien of het werkt</h2>
<p class="uitleg">Met het bestand uit de eerste briefing meldt de shop twee momenten terug: de afrekenpagina wordt geopend (<code>ShopConversies::winkelwagen()</code>) en de betaling is binnen (<code>ShopConversies::betaald(...)</code>). Dan staat in het overzicht per advertentie: doorgeklikt, afrekenpagina geopend, betaald. Zo zien we na elke verandering in de shop of er meer mensen bij de volgende stap aankomen.</p>

<h2>Bronnen</h2>
<ol class="st">${BRONNEN.map(b => `<li><a href="${esc(b[1])}">${esc(b[0])}</a></li>`).join('')}</ol>
<p class="note">Deze pagina is alleen-lezen: er staan geen sleutels op en je kunt er niets mee wijzigen. De stand van de shop wordt live gemeten. De beoordeling van 8 oktober is eerst opgemeten op telefoonformaat en daarna beoordeeld door vier beoordelaars, elk met een eigen bril: gedragseconomie, mobiel kopen, vertrouwen en regels, en inhoud en prijs. De citaten uit de bronnen en de prijzen bij andere winkels zijn daarna nagelopen op de pagina's zelf.</p>
</main></body></html>`;
}
