// Redactie van Kadoly op gids.kadoly.com/redactie (Henkjan 19 nov 2026: "Maak iedere dag een post met een redactie die nuttig is voor lezers en bezoekers op kadoly.com"
// en "Meet alles met clickmind . Aan links wat er in komt"). Eén artikel per dag, met de hand geschreven op echte bronnen.
// Onderwerp per artikel: zoekvraag uit Demand Radar (zoekvraag, check, suggesties) plus het gat in AI-antwoorden (llmgat: welke vraag AI nog
// generiek of zonder eerste keus beantwoordt). Werkwijze voor de dagelijkse ronde: OVERDRACHT-KADOLY-GIDS.md, sectie Redactie.
//
// Meting (Clickmind en het baken van de gids):
// - elke externe link loopt via /redactie/<slug>/link/<n> (telt red-<slug>|link-<n> in gk:d:<dag>, daarna 302 naar de bron); interne links direct
// - productkaarten via /naar/<pid>?g=red-<slug>&b=<blok> (keten tot betaald in Clickmind, op=gidsuit in fn/shop.js)
// - baken: v-<herkomst>, t15, t60, s50, s90 onder g=red-<slug>; Clickmind cm.js met data-site="kadolyredactie" (klik, scroll, echt mens)
// - stand per artikel: /api/gids?op=redstand
//
// Tekstregels: zoekterm voorop in titel en kop, kort antwoord bovenaan (eerste 60 woorden), elke bewering met een bron die we zelf lazen,
// geen gedachtestreepjes, geen verzonnen reviews of cijfers, eerlijk over wat Kadoly (nog) niet heeft.

export const REDACTIE_DAG = '2026-11-19';

// Stand van Kadoly zelf, één plek: werk dit bij zodra iets verandert (toont op elk artikel met status: true).
export const STATUS = {
  bijgewerkt: '2026-11-19',
  regels: [
    ['Bedrijf', 'Kadoly is een handelsnaam van ADSFAIR B.V., Albert Plesmanplein 20, 2805 AB Gouda, KVK 60126035. Het nummer kun je zelf opzoeken in het handelsregister.', 'kvk'],
    ['WebwinkelKeur', 'Aangevraagd op 19 november 2026. Het logo zetten we pas op de site als de keuring rond is, met een link naar onze ledenpagina bij WebwinkelKeur zelf.', 'wwk'],
    ['Google Klantenreviews', 'We sluiten aan op 19 november 2026. Na een bestelling vraagt Google je zelf of je mee wilt doen; de beoordeling komt pas in beeld als genoeg kopers hebben gereageerd.', 'gcr'],
    ['Retour', '14 dagen na ontvangst melden, met gratis retourlabel.', 'retour'],
    ['Betalen', 'iDEAL, PayPal, creditcard of Klarna. Een account is niet nodig.', ''],
    ['Contact', 'Antwoord van een mens via WhatsApp op +31 6 55395630.', 'wa'],
  ],
  // korte versie voor de kaarten op de pagina: [titel, tekst, link, loopt nog]
  kaarten: [
    ['Bedrijf', 'ADSFAIR B.V., Gouda. KVK 60126035.', 'kvk'],
    ['Retour', '14 dagen, met gratis retourlabel.', 'retour'],
    ['Betalen', 'iDEAL, PayPal, creditcard of Klarna.', ''],
    ['Contact', 'Een mens antwoordt.', 'wa'],
    ['WebwinkelKeur', 'Aangevraagd op 19 november. Logo pas na de keuring.', '', true],
    ['Google Klantenreviews', 'Aansluiting op 19 november. Score volgt na genoeg reviews.', '', true],
  ],
};

export const ARTIKELEN = [
  {
    slug: 'lootjes-cadeau-20-euro-tips-ruilen-secret-santa',
    datum: '2026-11-25', bijgewerkt: '2026-11-25', leestijd: 5,
    titel: 'Lootjes cadeau 20 euro: zo kies je iets wat echt gebruikt wordt',
    h1: 'Lootjes cadeau van 20 euro: zo kies je iets wat niet in de kast belandt',
    sub: 'Wat je afspreekt voor je trekt, hoe je binnen het bedrag blijft en hoe je het ruilen regelt. Het werkt net zo voor Secret Santa met kerst.',
    besch: 'Een lootjes cadeau van 20 euro kiezen: spreek bedrag en verlanglijstje af, tel verzendkosten mee en geef een ruilmogelijkheid mee. Zo werkt het ook bij Secret Santa.',
    zoektermen: ['lootjes cadeau 20 euro', 'lootjes cadeau ideeën', 'lootjes cadeau', 'secret santa cadeau 20 euro', 'secret santa cadeau collega', 'lootjes trekken online', 'cadeau ruilen kassabon'],
    // Voorrang groei-account 23-29 nov: praktisch antwoord op lootjes/Secret Santa, cadeau onder 20 of 25 euro alleen als het aanbod inclusief verzending past.
    // Demand Radar check 25 nov (NL): 'lootjes cadeau' 260 zoekopdrachten in nov 2025 en 110 in dec 2025, Google-suggesties lootjes cadeau 5, 10, 15, 20 en 25 euro, ideeën, idee;
    // 'secret santa cadeau' 210 in nov en 320 in dec 2025, suggesties 5 tot 50 euro, man, collega. AI-plank (4 modellen) per vraag elke winkel en elk merk één keer, geen eerste keus.
    // Eigen meting zonder webzoeken (25 nov): zes ideeën met merken (chocolade, mok met thee, sokken, spel, geurkaars, cadeaubon), geen eerste keus, niets over verzendkosten, ruilen of gravure.
    llmgat: { vraag: 'Wat is een goed lootjes cadeau van 20 euro?', level: 'generic', gemeten: '2026-11-25',
      wat: 'Bij "lootjes cadeau" en "secret santa cadeau" noemden vier AI-modellen in Demand Radar per vraag elke winkel en elk merk maar één keer: samen negen winkels en acht merken, van HEMA en bol tot Tony\'s Chocolonely en LEGO. Een gedeelde eerste keus was er niet. Een eigen meting zonder webzoeken gaf een lijstje van zes ideeën met merken, zonder eerste keus, zonder dat de verzendkosten binnen het bedrag moeten passen en zonder iets over ruilen of over cadeaus met naam die je niet terug kunt sturen.' },
    kort: 'Begin bij het verlanglijstje. Staat daar niets op wat binnen het bedrag past, kies dan iets wat opgaat of elke dag gebruikt wordt, zoals een mok, kaars of zeep. Een kwart van de Nederlanders gooit weleens een Sinterklaas- of kerstcadeau ongebruikt weg ([MMA](#3)). Spreek af dat verzendkosten in het bedrag zitten en vraag in een winkel of ruilen mag, want daar is het geen recht ([ACM](#4)).',
    noot: 'Kadoly verkoopt zelf producten en heeft een eigen gratis lootjestool; de genoemde bronnen betaalden ons niet en wij hen niet.',
    links: [
      { id: 1, url: 'https://static-cdn.drawnames.com/Content/Press/20251113-NL-Persbericht-Feestdagenonderzoek.pdf', bron: 'lootjestrekken.nl, 13 november 2025', titel: 'Feestdagenonderzoek 2025: recorduitgaven voor Sinterklaas (pdf)' },
      { id: 2, url: 'https://www.raisin.com/nl-nl/newsroom/nationale-sint-en-kerst-enquete-2026/', bron: 'Raisin, bijgewerkt 18 november 2026', titel: 'Nationale Sint en Kerst-enquête 2026' },
      { id: 3, url: 'https://www.hartvannederland.nl/algemeen-nieuws/artikelen/een-op-vier-nederlanders-gooit-sinterklaas-of-kerstcadeau-ongebruikt-weg', bron: 'Hart van Nederland, 28 november 2023, onderzoek van MMA', titel: 'Een op vier Nederlanders gooit sinterklaas- of kerstcadeau ongebruikt weg' },
      { id: 4, url: 'https://www.acm.nl/nl/verkoop-aan-consumenten/klantenservice/ruilen-en-retourneren', bron: 'ACM', titel: 'Ruilen en retourneren' },
      { id: 5, url: 'https://www.welingelichtekringen.nl/economie/cadeau-valt-verkeerd-in-de-winkel-heb-je-geen-recht-op-ruilen-online-tikt-de-klok-al', bron: 'Welingelichte Kringen, 12 november 2026', titel: 'Cadeau valt verkeerd? In de winkel heb je geen recht op ruilen, online tikt de klok al' },
      { id: 6, url: 'https://acm.nl/sites/default/files/documents/7-mythes-over-consumentenrechten.pdf', bron: 'ACM ConsuWijzer', titel: '7 mythes over consumentenrechten (pdf)' },
    ],
    blokken: [
      { h2: 'De helft van wie Sinterklaas viert, trekt lootjes' },
      { p: 'In een peiling van lootjestrekken.nl van november 2025 zei 52% van de Nederlanders dat ze Sinterklaas vieren. Van die vierders was 51% van plan lootjes te trekken, en 30% regelde dat via een app of website. Gemiddeld wilde men 134 euro aan Sinterklaascadeaus uitgeven, het hoogste bedrag sinds de meting in 2017 begon ([lootjestrekken.nl](#1)).' },
      { p: 'Kerst wint terrein. In een enquête van Raisin van november 2026 onder 810 mensen die cadeaus gaan kopen, geeft 57% meer uit aan kerst dan aan Sinterklaas en koopt 36% alleen cadeaus voor kerst ([Raisin](#2)). Trek je met kerst lootjes, als Secret Santa, dan gelden dezelfde afspraken als hieronder.' },
      { h2: 'Spreek drie dingen af voor je trekt' },
      { stappen: [
        ['Het bedrag, inclusief verzending', 'Zeg niet alleen 20 euro, maar 20 euro inclusief verzendkosten. Binnen het bedrag blijven is lastiger dan het lijkt: in een onderzoek van MMA uit 2023 vond twee derde dat moeilijk en zei bijna driekwart weleens over het afgesproken budget te gaan ([MMA](#3)).'],
        ['Een verlanglijstje per persoon', 'Vraag iedereen om een paar ideeën van verschillende prijzen, zodat er altijd iets binnen het bedrag past. Met [lootjes trekken online](/w/lootjes) krijgt iedereen een eigen link, ziet alleen zijn eigen lootje en kan er een verlanglijstje bij. Je stelt ook in wie elkaar niet mag trekken, zoals partners.'],
        ['Surprise en gedicht, of niet', 'Spreek af of er een surprise en een gedicht bij horen, want dat bepaalt hoeveel tijd iemand kwijt is. Voor het gedicht zoeken veel mensen hulp: 40% zegt in de enquête van Raisin zeker of misschien AI te gebruiken voor gedichten ([Raisin](#2)). Bij ons kan het met de gratis [gedichtengenerator](/w/gedicht).'],
      ] },
      { h2: 'Geen verlanglijstje? Kies iets wat opgaat' },
      { p: 'Een cadeau dat niet past, blijft liggen of verdwijnt. In het onderzoek van MMA zei de helft weleens een teleurstellend cadeau te hebben gekregen, en een kwart gooit weleens een Sinterklaas- of kerstcadeau ongebruikt weg. Bij jongeren tot 30 jaar is dat 42%. Ruim de helft gaf toe weleens binnen vijf minuten een cadeau te hebben gekocht ([MMA](#3)). Neem er dus even de tijd voor.' },
      { stappen: [
        ['Kijk wat iemand al gebruikt', 'Drinkt iemand elke dag thee, brandt er altijd een kaars of staat er een plant in de vensterbank? Dan weet je in welke hoek je zoekt.'],
        ['Kies opgaan boven grappig', 'Iets wat opgaat of elke dag gebruikt wordt, zoals zeep, een kaars of een mok, hoeft nergens een vaste plek te krijgen. Een grapje voor één avond wel.'],
        ['Liever één goed ding', 'Voor 20 euro koop je beter één ding van goede kwaliteit dan drie kleine dingen die het bedrag vol maken.'],
        ['Geen naam of gravure als je twijfelt', 'Een cadeau op maat, bijvoorbeeld met naam of gravure, stuur je online meestal niet terug: voor een op maat gemaakt product geldt de bedenktijd niet ([ACM](#6), [Welingelichte Kringen](#5)). Kies het alleen als je zeker weet dat het goed valt.'],
      ] },
      { h2: 'Geef een ruilmogelijkheid mee' },
      { p: 'In een gewone winkel is ruilen geen recht. De winkel bepaalt zelf of je mag ruilen of terugbrengen en tot wanneer, en mag dan om de kassabon vragen ([ACM](#4)). Vraag dus bij het afrekenen of het cadeau geruild mag worden en tot wanneer, en stop de bon in een envelop bij het cadeau ([Welingelichte Kringen](#5)).' },
      { p: 'Online heb je bij bijna alle aankopen 14 dagen bedenktijd. Binnen die tijd meld je dat je het niet houdt, daarna heb je nog 14 dagen om het terug te sturen ([ACM](#6)). De bedenktijd begint als het pakket binnenkomt, niet op pakjesavond ([Welingelichte Kringen](#5)). Komt je pakket op 1 december, dan is die op 15 december om. Bij een terugzending mag een webwinkel een tegoedbon aanbieden, maar je hebt recht op je geld ([ACM](#6)).' },
      { h2: 'Secret Santa met kerst: kijk naar de bezorgdagen' },
      { p: 'Trek je lootjes voor kerst, op het werk of in de familie, trek ze dan een paar weken van tevoren, zodat iedereen tijd heeft om te kiezen en te bestellen. Rond de feestdagen wordt niet elke dag bezorgd. Welke dagen wel, lees je in [Laatste besteldag Sinterklaas 2026](/redactie/laatste-besteldag-sinterklaas-2026-pakjesavond). Koop je met Black Friday al iets voor kerst, lees dan ook [Black Friday korting echt?](/redactie/black-friday-korting-echt-van-voor-prijs-checken)' },
      { h2: 'Cadeaus tot 20 euro, inclusief verzending' },
      { p: 'Bij Kadoly zie je bij elk product één prijs, inclusief btw en verzending, en de dag waarop het naar verwachting in huis is. Dat is een schatting, geen garantie: twijfel je over pakjesavond, kies dan iets met een vroegere datum. Voor in de schoen zijn er ook [schoencadeautjes voor Sinterklaas](/schoencadeautjes-sinterklaas).' },
      { producten: { n: 4, maxLt: 5, minPrijs: 8, maxPrijs: 20, zoek: ['mok', 'beker', 'kaars', 'zeep', 'sokken', 'puzzel', 'spel', 'thee', 'onderzetter', 'notitie', 'geur', 'oorbel', 'armband', 'ketting', 'sleutelhanger'] } },
    ],
    faq: [
      ['Wat is een goed lootjes cadeau van 20 euro?', 'Iets van het verlanglijstje van wie je trok. Staat daar niets op wat past, kies dan iets wat opgaat of elke dag gebruikt wordt, zoals een mok, kaars of zeep, en liever één goed ding dan drie kleine. Tel verzendkosten mee in de 20 euro en geef een ruilmogelijkheid mee. Een kwart van de Nederlanders gooit weleens een cadeau ongebruikt weg ([MMA](#3)).'],
      ['Tellen verzendkosten mee in het lootjesbedrag?', 'Dat bepaal je samen. Spreek het af voor je trekt, dan weet iedereen waar hij aan toe is. Binnen het budget blijven is voor veel mensen lastig: in een onderzoek van MMA uit 2023 ging bijna driekwart weleens over het afgesproken bedrag ([MMA](#3)).'],
      ['Kun je een lootjes cadeau ruilen?', 'In een winkel alleen als de winkel dat toestaat. Die bepaalt zelf of het mag en tot wanneer, en mag om de kassabon vragen ([ACM](#4)). Online heb je bij bijna alle aankopen 14 dagen bedenktijd vanaf de dag dat het pakket binnenkomt, behalve bij iets wat op maat is gemaakt ([ACM](#6), [Welingelichte Kringen](#5)).'],
      ['Hoe trek je lootjes online?', 'Vul de namen in, kies wie elkaar niet mag trekken en deel de links. Iedereen ziet alleen zijn eigen lootje. In november 2025 regelde 30% van de Sinterklaasvierders het lootjes trekken via een app of website ([lootjestrekken.nl](#1)). Bij Kadoly kan het gratis met [lootjes trekken online](/w/lootjes), met verlanglijstje.'],
      ['Kun je een cadeau met naam erop terugsturen?', 'Meestal niet. Voor een product dat op maat is gemaakt, zoals met naam of gravure, geldt de wettelijke bedenktijd niet ([ACM](#6), [Welingelichte Kringen](#5)). Kies het dus alleen als je zeker weet dat het goed valt.'],
      ['Werkt Secret Santa hetzelfde als lootjes trekken?', 'Ja. Je trekt een naam, koopt binnen een afgesproken bedrag een cadeau en niemand weet wie wie heeft. Voor veel mensen is kerst het grootste cadeaufeest: in de enquête van Raisin geeft 57% meer uit aan kerst dan aan Sinterklaas ([Raisin](#2)).'],
    ],
  },
  {
    slug: 'laatste-besteldag-sinterklaas-2026-pakjesavond',
    datum: '2026-11-24', bijgewerkt: '2026-11-24', leestijd: 5,
    titel: 'Laatste besteldag Sinterklaas 2026: zo is je cadeau op tijd',
    h1: 'Laatste besteldag Sinterklaas: zo is je cadeau op tijd voor pakjesavond',
    sub: 'Waarom een algemene datum weinig zegt, wat een paar grote winkels zelf beloven en wat je doet als het cadeau te laat komt.',
    besch: 'Pakjesavond valt in 2026 op zaterdag 5 december. Zo vind je de echte laatste besteldag per winkel, wat je doet als het te laat komt en wat er met kerst verandert.',
    zoektermen: ['laatste besteldag sinterklaas', 'laatste besteldag sinterklaas 2026', 'wanneer bestellen voor pakjesavond', 'sinterklaas cadeau op tijd', 'pakket te laat sinterklaas', 'bezorging rond de feestdagen'],
    // Voorrang groei-account 23-29 nov: laatste besteldagen per merk, geen algemene datum als bezorggarantie.
    // Demand Radar check 24 nov 'laatste besteldag sinterklaas' (NL, 4 modellen): AI-plank alleen chocolade- en snoepwinkels en -merken; Google-suggesties leeg (budget op), geen zoekvolume geclaimd.
    // Eigen meting zonder webzoeken (24 nov): "verschilt per winkel, bol en Coolblue vaak tot 4 december, kleinere winkels een week van tevoren", zonder weekdag, bronnen of rechten.
    llmgat: { vraag: 'Wat is de laatste besteldag voor Sinterklaas?', level: 'misread', gemeten: '2026-11-24',
      wat: 'Bij "laatste besteldag sinterklaas" noemden vier AI-modellen in Demand Radar samen alleen winkels en merken van chocolade en snoep, zoals HEMA, Jamin en Tony\'s Chocolonely, alsof je iets wilde kopen. Een eigen meting zonder webzoeken gaf "verschilt per winkel" met een geschatte datum, zonder dat pakjesavond dit jaar op zaterdag valt, zonder de regels van de winkels zelf en zonder wat je doet als het te laat komt.' },
    kort: 'Er is geen laatste besteldag die voor elke winkel geldt. Pakjesavond valt dit jaar op zaterdag 5 december ([DHL](#1)) en niet elke winkel bezorgt op zaterdag ([Smyths Toys](#9)). Kijk dus naar de bezorgdatum bij het product zelf en kies bij twijfel ophalen in de winkel. Zeg voor je bestelt dat het een cadeau voor 5 december is. Komt het dan te laat, dan mag je de koop meteen ongedaan maken ([Consumentenbond](#5)).',
    noot: 'Kadoly verkoopt zelf producten; de genoemde winkels en vervoerders betaalden ons niet en wij hen niet.',
    links: [
      { id: 1, url: 'https://www.dhlecommerce.nl/sites/default/files/content/PDF/Feestdagenkalender_2026_Consumenten_EN.pdf', bron: 'DHL eCommerce', titel: 'Holidays 2026: bezorging rond de feestdagen (pdf)' },
      { id: 2, url: 'https://www.sendcloud.com/nl/blog/pakketvolume-black-friday-week-2026/', bron: 'Sendcloud, 22 oktober 2026', titel: 'Pakketvolume tijdens Black Friday-week naar verwachting 71% hoger dan gemiddeld' },
      { id: 3, url: 'https://www.postnl.nl/klantenservice/algemene-bezorgdagen-tijden/feestdagen', bron: 'PostNL', titel: 'Bezorging rond de feestdagen 2026' },
      { id: 4, url: 'https://www.acm.nl/nl/verkoop-aan-consumenten/leveren-en-bezorgen', bron: 'ACM', titel: 'Leveren en bezorgen' },
      { id: 5, url: 'https://www.consumentenbond.nl/juridisch-advies/product-niet-geleverd', bron: 'Consumentenbond', titel: 'Product niet geleverd' },
      { id: 6, url: 'https://www.consumentenbond.nl/juridisch-advies/rechten-bij-aankoop/levertijd-bestelling', bron: 'Consumentenbond, bijgewerkt 29 juni 2026', titel: 'Levertijd van je bestelling' },
      { id: 7, url: 'https://www.coolblue.nl/klantenservice/bezorg-en-ophaalopties', bron: 'Coolblue', titel: 'Bezorg- en ophaalopties' },
      { id: 8, url: 'https://www.bol.com/nl/nl/select/', bron: 'bol', titel: 'Meer gemak en voordeel met Select' },
      { id: 9, url: 'https://www.smythstoys.com/nl/nl-nl/verzendkosten-en-levering', bron: 'Smyths Toys', titel: 'Verzendkosten en levering' },
      { id: 10, url: 'https://www.smythstoys.com/nl/nl-nl/click-en-collect', bron: 'Smyths Toys', titel: 'Click & Collect' },
      { id: 11, url: 'https://id.nl/huis-en-entertainment/computer-en-gaming/laptops-en-ultrabooks/via-amazon-kun-je-straks-tot-1500-uur-bestellen-en-dezelfde-dag-ontvangen', bron: 'ID.nl, 31 juli 2026', titel: 'Via Amazon kun je straks tot 15:00 uur bestellen en dezelfde dag ontvangen' },
    ],
    blokken: [
      { h2: 'Pakjesavond valt dit jaar op zaterdag' },
      { p: 'Sinterklaas valt in 2026 op zaterdag 5 december. DHL bezorgt die dag gewoon, net als op zaterdag 28 november, de dag na Black Friday. Op zondag 29 november rijdt DHL een extra bezorgronde ([DHL](#1)). Tussen Black Friday op vrijdag 27 november en pakjesavond zitten maar acht dagen ([Sendcloud](#2)).' },
      { p: 'Dat merk je aan de drukte. Verzendplatform Sendcloud verwacht in de Black Friday-week 71% meer pakketten dan in een gewone week en in de week van Cyber Monday 47% meer. Vorig jaar in december deden bijna 4 op de 10 pakketten er langer dan een dag over ([Sendcloud](#2)).' },
      { h2: 'Er is geen vaste laatste besteldag' },
      { p: 'Een datum in een advertentie of op een lijstje zegt weinig. Of je cadeau op tijd is, hangt af van de winkel, van wie het pakket verstuurt en van waar je woont. Kijk daarom altijd naar de bezorgdatum bij het product en in je winkelmandje. Zo pakken vier winkels het zelf aan, volgens hun eigen pagina\'s:' },
      { stappen: [
        ['bol', 'Vandaag-, avond- en zondagbezorging zijn bij Select gratis, maar alleen voor artikelen die bol zelf verstuurt. Of het kan, hangt af van het artikel en je postcode ([bol](#8)). Koop je bij een andere verkoper op bol, kijk dan extra goed naar de datum.'],
        ['Coolblue', 'Bezorgt ook op zondag, tussen 10.00 en 20.00 uur. Ligt het product in jouw winkel op voorraad, dan haal je het dezelfde dag op; anders reserveer je het voor de volgende dag ([Coolblue](#7)).'],
        ['Smyths Toys', 'Standaard besteld vóór 17.00 uur is binnen 1 tot 3 werkdagen in huis, maandag tot en met vrijdag. Met expresverzending de volgende werkdag, maar op zaterdag wordt niet geleverd ([Smyths Toys](#9)). Wil je het uiterlijk vrijdag 4 december hebben, dan bestel je standaard dus op dinsdag 1 december vóór 17.00 uur. Afhalen kan op werkdagen binnen een uur als je vóór 17.00 uur bestelt ([Smyths Toys](#10)).'],
        ['Amazon', 'ID.nl meldde in juli dat je vanaf 31 augustus tot 15.00 uur kunt bestellen voor bezorging dezelfde avond, alleen in postcodegebieden waar dat kan ([ID.nl](#11)).'],
      ] },
      { h2: 'Zeg erbij dat het een cadeau voor 5 december is' },
      { p: 'Spreek je niets af, dan heeft een webwinkel 30 dagen om te leveren ([ACM](#4)). Is het daarna nog niet binnen, dan geef je de winkel eerst een redelijke extra termijn ([Consumentenbond](#6)).' },
      { p: 'Anders wordt het als de winkel weet dat de datum ertoe doet. Zeg je voor de koop dat het op tijd moet zijn en levert de winkel te laat, dan moet hij alles terugbetalen ([ACM](#4)). De Consumentenbond zegt het zo: weet de verkoper dat de datum belangrijk is, dan mag je de koop meteen ongedaan maken en heb je recht op je geld terug ([Consumentenbond](#5)). Zet het dus in het opmerkingenveld van je bestelling of mail het voor je betaalt, en bewaar die mail.' },
      { p: 'Tot het pakket bij jou is, is de winkel verantwoordelijk. Bezorgt hij het bij de buren, dan blijft dat zo tot je het daar ophaalt. Dat verandert als je zelf vooraf toestemming gaf voor de buren of zelf een andere vervoerder koos ([ACM](#4)).' },
      { h2: 'Cadeaus die voor pakjesavond in huis kunnen zijn' },
      { p: 'Bij Kadoly zie je bij elk product één prijs, inclusief btw en verzending, en de dag waarop het naar verwachting bij je is. Dat is een schatting, geen garantie: twijfel je, kies dan iets met een vroegere datum. Voor de schoen zijn er ook [schoencadeautjes voor Sinterklaas](/schoencadeautjes-sinterklaas).' },
      { producten: { n: 4, maxLt: 4, minPrijs: 10, maxPrijs: 40 } },
      { h2: 'En met kerst: twee dagen zonder bezorging' },
      { p: 'Op eerste en tweede kerstdag, vrijdag 25 en zaterdag 26 december, bezorgen PostNL en DHL niet. Bij PostNL is maandag 28 december de eerstvolgende bezorgdag ([PostNL](#3), [DHL](#1)). Op donderdag 24 december is er bij DHL geen avondbezorging ([DHL](#1)). Sendcloud verwacht tot en met 20 december ruim 35% meer pakketten dan normaal ([Sendcloud](#2)).' },
      { p: 'Koop je nu al voor kerst, let dan ook op je bedenktijd: die loopt vanaf de dag dat je het pakket krijgt en is soms voor kerst al voorbij. Hoe dat zit lees je in [Black Friday korting echt?](/redactie/black-friday-korting-echt-van-voor-prijs-checken)' },
    ],
    faq: [
      ['Wat is de laatste besteldag voor Sinterklaas?', 'Die is er niet voor alle winkels samen. Pakjesavond valt in 2026 op zaterdag 5 december. Kijk bij elk product naar de bezorgdatum die de winkel noemt, en reken bij een winkel die niet op zaterdag bezorgt terug vanaf vrijdag 4 december ([DHL](#1), [Smyths Toys](#9)).'],
      ['Wordt er op zaterdag 5 december bezorgd?', 'DHL bezorgt op zaterdag 5 december gewoon ([DHL](#1)). Of jouw pakket die dag komt, hangt af van de winkel. Smyths Toys levert bijvoorbeeld niet op zaterdag ([Smyths Toys](#9)).'],
      ['Wat kan ik doen als mijn Sinterklaascadeau te laat komt?', 'Heb je voor de koop gezegd dat het voor 5 december moest zijn, dan mag je de koop meteen ongedaan maken en heb je recht op je geld terug ([Consumentenbond](#5), [ACM](#4)). Zonder afspraak heeft de winkel 30 dagen en geef je eerst een redelijke extra termijn ([Consumentenbond](#6)).'],
      ['Wie is verantwoordelijk als een pakket bij de buren zoekraakt?', 'De winkel, tot je het pakket bij de buren ophaalt. Gaf je vooraf zelf toestemming om het bij de buren te bezorgen, of koos je zelf een andere vervoerder, dan ligt het bij jou ([ACM](#4)).'],
      ['Kan ik op het laatste moment nog iets ophalen?', 'Bij Coolblue haal je een product dat in jouw winkel op voorraad ligt dezelfde dag op ([Coolblue](#7)). Bij Smyths Toys bestel je op werkdagen vóór 17.00 uur en haal je het binnen een uur af ([Smyths Toys](#10)).'],
      ['Wanneer moet ik bestellen voor kerst?', 'Op 25 en 26 december bezorgen PostNL en DHL niet; PostNL bezorgt weer op maandag 28 december ([PostNL](#3), [DHL](#1)). Kijk ook hier naar de datum bij het product en reken op drukte: tot en met 20 december verwacht Sendcloud ruim 35% meer pakketten dan normaal ([Sendcloud](#2)).'],
    ],
  },
  {
    slug: 'black-friday-korting-echt-van-voor-prijs-checken',
    datum: '2026-11-20', bijgewerkt: '2026-11-20', leestijd: 5,
    titel: 'Black Friday korting echt? Zo check je de van-voor-prijs',
    h1: 'Black Friday korting: zo reken je na of hij echt is',
    sub: 'Wat de regels zeggen over van-voor-prijzen, welke trucs deze maand werden gevonden en waarom je bij een kerstcadeau op je bedenktijd let.',
    besch: 'Zo check je in een minuut of een Black Friday korting echt is: de 30-dagenregel, de trucs die de Consumentenbond vond en wat je bedenktijd betekent voor een kerstcadeau.',
    zoektermen: ['black friday korting', 'black friday korting echt', 'nepkorting herkennen', 'van voor prijs regels', 'laagste prijs 30 dagen', 'black friday retour bedenktijd'],
    // Demand Radar 20 nov 2026: gaps 'black friday en' (NL) unclear, 3 van 3 AI's zonder eerste keus; check 'black friday korting' (4 modellen) noemt alleen winkels en merken.
    // Eigen meting zonder webzoeken (20 nov): tips en twee prijsvergelijkers, geen eerste stap, geen rekenvoorbeeld, niets over bedenktijd bij een kerstcadeau.
    llmgat: { vraag: 'Hoe weet ik of een Black Friday korting echt is?', level: 'unclear', gemeten: '2026-11-20',
      wat: 'Bij "black friday" geven drie AI-modellen geen eerste keus en vragen ze eerst wat je zoekt. Bij "black friday korting" noemen vier modellen alleen winkels en merken (Coolblue, bol, Amazon, Dyson). Een eigen meting zonder webzoeken gaf algemene tips en twee prijsvergelijkers, zonder rekenvoorbeeld, zonder de uitzonderingen op de regel en zonder wat de bedenktijd betekent voor een kerstcadeau.' },
    kort: 'Reken de korting zelf na vanaf de laagste prijs die de winkel de afgelopen 30 dagen vroeg. Zo moet de winkel het volgens de regels ook doen ([ACM](#2)). Die prijs vind je bij een prijsvergelijker met prijsgeschiedenis. Een doorgestreepte adviesprijs zegt weinig. Koop je nu een kerstcadeau, let dan op je bedenktijd: 14 dagen na ontvangst, dus vaak al voorbij voor kerst.',
    noot: 'Kadoly verkoopt zelf producten; de genoemde winkels en organisaties betaalden ons niet en wij hen niet.',
    links: [
      { id: 1, url: 'https://www.acm.nl/nl/publicaties/acm-ziet-nog-veel-misleidende-kortingen-en-adviseert-eerst-checken-dan-bestellen', bron: 'ACM, 20 november 2025', titel: 'ACM ziet nog veel misleidende kortingen en adviseert: eerst checken, dan bestellen' },
      { id: 2, url: 'https://www.acm.nl/nl/publicaties/acm-wil-einde-aan-nepkortingen-na-komst-strengere-regels', bron: 'ACM, 6 december 2022', titel: 'ACM wil einde aan nepkortingen na komst strengere regels' },
      { id: 3, url: 'https://www.acm.nl/nl/publicaties/acm-wil-eerlijke-kortingen-om-consumenten-te-beschermen-tegen-misleiding', bron: 'ACM, 19 september 2025', titel: 'ACM wil eerlijke kortingen om consumenten te beschermen tegen misleiding' },
      { id: 4, url: 'https://www.consumentenbond.nl/nieuws/2026/consumentenbond-webwinkels-omzeilen-kortingsregels-met-schijnvoordeel', bron: 'Consumentenbond, 18 november 2026', titel: 'Webwinkels omzeilen kortingsregels met schijnvoordeel' },
      { id: 5, url: 'https://www.consumentenbond.nl/acties-claims/nieuws/2026/nepaanbiedingen', bron: 'Consumentenbond, bijgewerkt 18 november 2026', titel: 'Webwinkels omzeilen kortingsregels' },
      { id: 6, url: 'https://www.consumentenbond.nl/nieuws/2025/black-friday-waarschuwing-nog-altijd-veel-nepaanbiedingen', bron: 'Consumentenbond, 18 november 2025', titel: 'Black Friday waarschuwing: nog altijd veel nepaanbiedingen' },
      { id: 7, url: 'https://www.ipsos.com/nl-nl/black-friday-2026-nuchterheid-en-kritische-blik-voeren-de-boventoon-maar-koopintentie-blijft', bron: 'Ipsos I&O, 19 november 2026', titel: 'Black Friday 2026: nuchterheid en kritische blik voeren de boventoon' },
      { id: 8, url: 'https://www.acm.nl/nl/bedenktijd', bron: 'ACM', titel: 'Bedenktijd' },
      { id: 9, url: 'https://acm.nl/sites/default/files/documents/7-mythes-over-consumentenrechten.pdf', bron: 'ACM ConsuWijzer', titel: '7 mythes over consumentenrechten (pdf)' },
    ],
    blokken: [
      { h2: 'Waarom je juist deze week nakijkt' },
      { p: 'Black Friday valt dit jaar op vrijdag 27 november. In een peiling van Ipsos I&O onder 5.255 Nederlanders zegt 30% dat ze dit jaar iets willen kopen; vorig jaar deed 33% dat ook echt ([Ipsos I&O](#7)). Tegelijk vond de ACM vorig jaar, in de aanloop naar Black Friday, Sinterklaas en kerst, bij 18 van de 24 onderzochte verkopers een of meer misleidende prijzen ([ACM](#1)).' },
      { h2: 'De regel: korting telt vanaf de laagste prijs van 30 dagen' },
      { p: 'Zet een winkel een van-prijs, een doorgestreepte prijs of een kortingspercentage neer, dan moet die korting gerekend worden vanaf de laagste prijs die hij in de 30 dagen ervoor vroeg ([ACM](#2)). Dat staat sinds 2022 in de wet ([Consumentenbond](#6)) en de ACM controleert erop sinds 1 januari 2023 ([ACM](#2)).' },
      { p: 'Het rekenvoorbeeld van de ACM zelf: een winkel verhoogt de prijs van een product van 50 naar 70 euro en begint 25 dagen later een actie met 35% korting. Je betaalt dan 45,50 euro. De laagste prijs in de 30 dagen ervoor was 50 euro, dus de echte korting is maar 9% ([ACM](#2)).' },
      { p: 'Er zijn drie uitzonderingen: producten die snel bederven, producten die korter dan 30 dagen te koop zijn (dan telt de laagste prijs sinds ze te koop zijn) en een korting die stap voor stap oploopt, zoals eerst 30% en daarna 50%. Dat laatste mag hooguit drie maanden ([ACM](#2)).' },
      { h2: 'Drie trucs die de Consumentenbond deze maand vond' },
      { p: 'De Consumentenbond volgt sinds mei de prijzen van grote webwinkels en telde tussen mei en oktober 2026 alleen bij Amazon al honderden nepaanbiedingen ([Consumentenbond](#4)). Drie voorbeelden laten zien hoe het werkt.' },
      { stappen: [
        ['Eerst de prijs omhoog', 'Een Playmobil-helikopter stond op 6 november bij Amazon voor 59,99 euro met 29% korting op een adviesprijs van 84,99 euro. Eerder kostte hij 51,79 euro; op 21 oktober ging de prijs omhoog. Wie de korting pakte, betaalde 8,20 euro meer dan voorheen ([Consumentenbond](#5)).'],
        ['Korting op een adviesprijs', 'Een airfryer van Tefal ging op 23 september van 66 naar 62,70 euro. Amazon meldde 30% korting op een adviesprijs van 90 euro; de echte verlaging was 5% ([Consumentenbond](#5)). Producten worden zelden voor de adviesprijs verkocht ([Consumentenbond](#4)). Een winkel mag hem noemen, maar volgens de ACM moet hij reëel zijn ([ACM](#3)).'],
        ['Een actie die geen actie is', 'Coolblue zette een printer van 249 euro bij zijn Onweerstaanbiedingen. Die prijs gold al weken voor de actie en lag eerder zelfs 10 euro lager ([Consumentenbond](#4)).'],
      ] },
      { h2: 'Zo check je een korting in een minuut' },
      { stappen: [
        ['Zoek de laagste prijs van 30 dagen', 'Kijk bij een prijsvergelijker met prijsgeschiedenis wat het product de afgelopen maand kostte, zoals de ACM aanraadt ([ACM](#1)). Ligt die laagste prijs dicht bij de actieprijs, dan is de korting klein, wat het label ook zegt.'],
        ['Vergelijk met andere winkels', 'Zoek hetzelfde product bij twee of drie andere winkels voor je bestelt. Is het daar zonder actie even duur, dan bespaar je niets ([ACM](#1), [Consumentenbond](#6)).'],
        ['Kijk langs de adviesprijs', 'Wantrouw een aanbieding die rekent vanaf een adviesprijs of een meestal-prijs ([Consumentenbond](#6)). Volgens de ACM wordt met die termen gegoocheld zonder dat duidelijk is wat ze betekenen ([ACM](#1)).'],
        ['Koop alleen wat je toch al wilde', 'Winkels geven het hele jaar korting ([Consumentenbond](#6)). Valt je check niet gunstig uit, bestel dan niet ([ACM](#1)).'],
      ] },
      { h2: 'Koop je nu een cadeau? Let op je bedenktijd' },
      { p: 'Bij bijna alle online aankopen heb je 14 dagen bedenktijd ([ACM](#9)). Die loopt vanaf de dag dat je het pakket ontvangt ([ACM](#8)). Binnen die 14 dagen meld je dat je afziet van de koop, daarna heb je nog 14 dagen om het terug te sturen ([ACM](#9)). De winkel betaalt je binnen 14 dagen terug ([ACM](#8)).' },
      { p: 'Voor pakjesavond komt dat goed uit. Voor kerst vaak niet: heb je je Black Friday-pakket op 1 december in huis, dan loopt je bedenktijd op 15 december af, tien dagen voor kerst. Vraag dus voor je bestelt of de winkel rond de feestdagen een langere ruiltermijn geeft, en geef de bon mee aan wie het cadeau krijgt.' },
      { p: 'Stuur je iets uit de uitverkoop terug, dan mag de winkel een tegoedbon aanbieden, maar die hoef je niet aan te nemen. Je hebt recht op je geld ([ACM](#9)).' },
      { h2: 'Cadeaus tot 25 euro die voor pakjesavond in huis zijn' },
      { p: 'Bij Kadoly zie je bij elk product één prijs, inclusief btw en verzending, en de dag waarop het naar verwachting in huis is. Deze cadeaus van makers hebben een korte levertijd.' },
      { producten: { n: 4, maxLt: 5, minPrijs: 10, maxPrijs: 25, zoek: ['sokken', 'kaars', 'zeep', 'puzzel', 'mok'] } },
      { h2: 'Klopt een korting niet? Meld het' },
      { p: 'Denk je dat een korting misleidend is, meld het dan bij ConsuWijzer van de ACM ([ACM](#3)). Twijfel je of een winkel wel bestaat, lees dan hoe je [een betrouwbare webshop herkent](/redactie/betrouwbare-webshop-herkennen-webwinkelkeur-google-reviews).' },
    ],
    faq: [
      ['Hoe weet ik of een Black Friday korting echt is?', 'Zoek de laagste prijs die de winkel de afgelopen 30 dagen vroeg, bijvoorbeeld bij een prijsvergelijker met prijsgeschiedenis, en reken de korting daar zelf tegen uit. Zo moet de winkel het volgens de regels ook doen. Vergelijk daarna met twee andere winkels en negeer een doorgestreepte adviesprijs ([ACM](#2), [ACM](#1)).'],
      ['Mag een winkel de prijs verhogen vlak voor Black Friday?', 'De prijs verhogen mag, maar een korting moet daarna gerekend worden vanaf de laagste prijs van de 30 dagen ervoor. In het voorbeeld van de ACM wordt 35% korting na een prijsverhoging van 50 naar 70 euro zo maar 9% ([ACM](#2)).'],
      ['Wat is een adviesprijs en klopt korting daarop?', 'Een adviesprijs is de prijs die een fabrikant adviseert. Producten worden er zelden voor verkocht, dus korting op een adviesprijs zegt weinig over wat je bespaart ([Consumentenbond](#4)). Een winkel mag hem noemen, maar hij moet reëel zijn ([ACM](#3)).'],
      ['Hoe lang kan ik een Black Friday aankoop terugsturen?', 'Online heb je meestal 14 dagen bedenktijd vanaf de dag dat je het pakket ontvangt. Daarna heb je nog 14 dagen om het terug te sturen, en de winkel betaalt binnen 14 dagen terug ([ACM](#8), [ACM](#9)).'],
      ['Kan ik een kerstcadeau van Black Friday na kerst nog ruilen?', 'Alleen als de winkel dat zelf aanbiedt. De wettelijke bedenktijd van 14 dagen na ontvangst is bij een bestelling rond Black Friday meestal voor kerst al voorbij. Vraag naar een langere ruiltermijn voor je bestelt ([ACM](#8)).'],
      ['Waar meld ik een nepkorting?', 'Bij ConsuWijzer van de ACM. De ACM controleert winkels op misleidende kortingen en kan sancties opleggen ([ACM](#3), [ACM](#1)).'],
    ],
  },
  {
    slug: 'betrouwbare-webshop-herkennen-webwinkelkeur-google-reviews',
    datum: '2026-11-19', bijgewerkt: '2026-11-19', leestijd: 5,
    titel: 'Betrouwbare webshop herkennen: WebwinkelKeur en Google-reviews uitgelegd',
    h1: 'Betrouwbare webshop herkennen voor Black Friday',
    sub: 'Wat WebwinkelKeur en Google Klantenreviews je echt vertellen, en hoe je in een minuut zelf controleert.',
    besch: 'Zo check je in vier stappen of een webshop te vertrouwen is. Wat een keurmerk als WebwinkelKeur wel en niet controleert, hoe Google Klantenreviews werkt en wat je doet als het misgaat.',
    zoektermen: ['betrouwbare webshop herkennen', 'betrouwbare webshop check', 'betrouwbare webshop keurmerk', 'webwinkelkeur betrouwbaar', 'webwinkelkeur klacht indienen', 'google klantenreviews'],
    // gemeten gat in AI-antwoorden (Demand Radar /api/check 19 nov 2026, 4 AI-modellen, en eigen meting zonder webzoeken)
    llmgat: { vraag: 'Hoe herken ik een betrouwbare webshop?', level: 'generic', gemeten: '2026-11-19',
      wat: 'Op "betrouwbare webshop" noemen de AI-modellen winkels (bol, Coolblue, MediaMarkt, Zalando) in plaats van hoe je zelf controleert. Op "webwinkelkeur" noemen ze alleen namen van keurmerken en reviewsites, zonder te zeggen wat een keurmerk wel en niet controleert of hoe je nakijkt of het logo echt is.' },
    kort: 'Een keurmerk zegt pas iets als je het kunt nakijken. Klik op het logo: je hoort op een pagina van het keurmerk zelf te komen, met dezelfde bedrijfsnaam en hetzelfde webadres. Zoek daarna het KVK-nummer op, lees ervaringen buiten de webshop en betaal liefst met PayPal of creditcard, zodat je geld kunt terugvragen als er niets komt.',
    links: [
      { id: 1, url: 'https://www.consumentenbond.nl/online-kopen/betrouwbare-webshop', bron: 'Consumentenbond', titel: 'Betrouwbare webshop herkennen' },
      { id: 2, url: 'https://twinklemagazine.nl/2026/10/thuiswinkel.org-gaat-nepwebshops-24-uur-per-dag-opsporen', bron: 'Twinkle, 8 oktober 2026', titel: 'Thuiswinkel.org gaat nepwebshops 24 uur per dag opsporen' },
      { id: 3, url: 'https://www.abnamro.com/nl/nieuws/onderzoek-abn-amro-7-op-de-10-nederlanders-zeggen-nepwebshops-nauwelijks-nog-te-herkennen', bron: 'ABN AMRO, november 2026', titel: '7 op de 10 Nederlanders zeggen nepwebshops nauwelijks nog te herkennen' },
      { id: 4, url: 'https://www.kvk.nl/veilig-zakendoen/geld-kwijt-en-niets-ontvangen-zo-herken-je-een-nepwebshop/', bron: 'KVK', titel: 'Geld kwijt en niets ontvangen. Zo herken je een nepwebshop' },
      { id: 5, url: 'https://www.consumentenbond.nl/online-kopen/keurmerken-webwinkels', bron: 'Consumentenbond', titel: 'Keurmerken voor webwinkels' },
      { id: 6, url: 'https://webwinkelkeur.nl/wp-content/uploads/2024/06/WebwinkelKeur-AV.pdf', bron: 'WebwinkelKeur', titel: 'Algemene voorwaarden WebwinkelKeur, artikel 4 Keuring' },
      { id: 7, url: 'https://support.google.com/googleshopping/answer/7163734?hl=nl', bron: 'Google', titel: 'Over Google Klantenreviews (voor kopers)' },
      { id: 8, url: 'https://support.google.com/merchants/answer/7124326?hl=nl', bron: 'Google', titel: 'Veelgestelde vragen over Google Klantenreviews' },
      { id: 9, url: 'https://support.google.com/google-ads/answer/2375474?hl=nl', bron: 'Google', titel: 'Over winkelbeoordelingen' },
      { id: 10, url: 'https://www.kvk.nl/zoeken/', bron: 'KVK', titel: 'Zoeken in het Handelsregister' },
      { id: 11, url: 'https://www.fraudehelpdesk.nl/', bron: 'Fraudehelpdesk', titel: 'Fraude melden' },
      { id: 12, url: 'https://www.consumentenbond.nl/veilig-internetten/december-nepshops', bron: 'Consumentenbond', titel: 'Nepshops in december' },
      { id: 13, url: 'https://support.google.com/merchants/answer/14632922?hl=nl', bron: 'Google', titel: 'FAQ over Google Klantenreviews voor winkels' },
    ],
    // [tekst](#n) = gemeten link naar links[n]; [tekst](/pad) = interne link
    blokken: [
      { h2: 'Waarom je juist nu beter kijkt' },
      { p: 'Rond Black Friday, Sinterklaas en kerst duiken de meeste nepwinkels op. De Fraudehelpdesk kreeg in 2025 35% meer meldingen van aankoopfraude dan het jaar ervoor, en volgens de Consumentenbond komt een flink deel daarvan van onbetrouwbare webshops ([Consumentenbond](#1)). Thuiswinkel.org schat dat 1,2 miljoen Nederlanders in 2025 zijn opgelicht via een nepwebshop ([Twinkle](#2)).' },
      { p: 'Het lastige: je ziet het er niet meer aan af. In een peiling van ABN AMRO van oktober 2026 zegt 7 op de 10 Nederlanders dat ze een nepwebshop nauwelijks nog herkennen ([ABN AMRO](#3)). Nepwinkels gebruiken namen en logo\'s van bekende partijen, nep-keurmerken en zelfs iDEAL om echt te lijken ([Consumentenbond](#12)). Kijken naar spelfouten helpt dus niet meer. Nakijken wel.' },
      { h2: 'Zo check je een webshop in vier stappen' },
      { stappen: [
        ['Klik op het keurmerk', 'Een echt keurmerk is een link naar een pagina op de site van het keurmerk zelf, met de naam en het webadres van de winkel. Is het alleen een plaatje, of kom je op een pagina van de winkel zelf, dan is het logo niets waard.'],
        ['Zoek het KVK-nummer op', 'Een Nederlandse webshop zet zijn KVK-nummer en adres op de site. Vul het nummer in bij het [Handelsregister van de KVK](#10) en kijk of naam, adres en activiteit kloppen met wat de winkel zegt.'],
        ['Lees ervaringen buiten de winkel', 'Reviews op de site van de winkel zelf zeggen weinig. Kijk bij Google, bij het keurmerk of op een reviewsite, en let op een plotselinge stroom korte vijfsterrenreviews: die zijn vaak nep.'],
        ['Betaal zo dat je geld kunt terugvragen', 'Met PayPal of een creditcard kun je een betaling terugvragen als er niets geleverd wordt. Een spotgoedkope aanbieding met alleen een bankoverschrijving is een rode vlag.'],
      ] },
      { h2: 'Wat een keurmerk als WebwinkelKeur wel en niet controleert' },
      { p: 'Een keurmerk is geen overheidsstempel maar een private club met eigen regels. WebwinkelKeur keurt een winkel voordat die het logo mag gebruiken ([WebwinkelKeur, artikel 4](#6)). De vijf grote keurmerken controleren bij aanmelding of de site aan de wet voldoet: contactgegevens, het recht op retour en wat je kunt doen bij een klacht ([Consumentenbond](#5)).' },
      { p: 'Wat een keurmerk niet doet: de producten testen, en volgens de Consumentenbond controleren de meeste keurmerken daarna niet regelmatig of een winkel nog aan alle eisen voldoet. Thuiswinkel Waarborg doet dat het grondigst, elk jaar opnieuw ([Consumentenbond](#5)). In het panel van de Consumentenbond kent 40% het logo van WebwinkelKeur en heeft 20% er veel vertrouwen in; bij Thuiswinkel Waarborg is dat 96% en 49%.' },
      { p: 'Het echte voordeel zit in wat er gebeurt als het misgaat. Kom je er met de winkel niet uit, dan kun je bij het keurmerk aankloppen, dat gaat bemiddelen. Meld je klacht wel eerst bij de winkel zelf en bewaar alle mails.' },
      { h2: 'Hoe Google Klantenreviews werkt' },
      { p: 'Google Klantenreviews is geen keurmerk maar een manier om beoordelingen te verzamelen die de winkel niet zelf in handen heeft. Na je bestelling vraagt Google of je mee wilt doen. Zeg je ja, dan mailt Google je een paar dagen na de verwachte bezorgdatum met één vraag over je ervaring ([Google](#7)).' },
      { p: 'Twee dingen maken dit sterker dan reviews op de site zelf. De winkel moet de vraag aan elke koper laten zien en mag de vraag niet al op de bevestigingspagina stellen, zodat je pas oordeelt als je pakket er is ([Google](#13), [Google](#8)). En de score die je naast een advertentie ziet, verschijnt pas bij een beoordeling van 3,5 of hoger ([Google](#9)). Zie je bij een onbekende winkel helemaal geen beoordelingen, dan betekent dat nog niet dat hij nep is, wel dat je de andere drie stappen extra serieus neemt.' },
      { h2: 'Hoe Kadoly het doet' },
      { p: 'We zijn een jonge winkel: Kadoly opende in oktober 2026. Daarom hebben we nog weinig reviews en zijn we nu bezig met WebwinkelKeur en Google Klantenreviews. Dit staat er vandaag:' },
      { status: true },
      { h2: 'Cadeaus die op tijd in huis zijn' },
      { p: 'Pakjesavond is op zaterdag 5 december. Deze cadeaus van makers tot 50 euro hebben een korte levertijd; bij elk product zie je de prijs inclusief btw en verzending en wanneer het in huis is.' },
      { producten: { n: 4, maxLt: 5, minPrijs: 15, maxPrijs: 50 } },
      { h2: 'Opgelicht? Dit doe je meteen' },
      { p: 'Neem contact op met je bank of PayPal om de betaling terug te vragen, meld de winkel bij de [Fraudehelpdesk](#11) en doe aangifte bij de politie ([KVK](#4)). Hoe sneller, hoe groter de kans dat een rekening wordt geblokkeerd.' },
    ],
    faq: [
      ['Is WebwinkelKeur betrouwbaar?', 'WebwinkelKeur keurt een webwinkel voordat die het logo mag voeren en bemiddelt als je er met een aangesloten winkel niet uitkomt. Het test geen producten. Klik altijd op het logo: alleen als je op een pagina van WebwinkelKeur zelf komt met de naam van de winkel, is het lidmaatschap echt.'],
      ['Wat is het verschil tussen WebwinkelKeur en Thuiswinkel Waarborg?', 'Beide keuren bij aanmelding of een winkel aan de wet voldoet. Thuiswinkel Waarborg controleert daarna elk jaar opnieuw en is veel bekender: in het panel van de Consumentenbond kent 96% het logo, tegen 40% bij WebwinkelKeur.'],
      ['Wat is Google Klantenreviews?', 'Een dienst van Google waarbij kopers na hun bestelling kunnen kiezen voor een korte enquête. Google mailt die een paar dagen na de verwachte bezorgdatum. De winkel mag niet kiezen wie de vraag krijgt.'],
      ['Hoe zie ik of een keurmerk op een webshop echt is?', 'Klik erop. Een echt keurmerk linkt naar een ledenpagina op de site van het keurmerk met dezelfde bedrijfsnaam en hetzelfde webadres. Een los plaatje of een link naar de winkel zelf is een slecht teken.'],
      ['Is Kadoly betrouwbaar?', 'Kadoly is een handelsnaam van ADSFAIR B.V. in Gouda, KVK 60126035. Je kunt betalen met PayPal of creditcard, hebt 14 dagen retour met gratis label en krijgt via WhatsApp antwoord van een mens. WebwinkelKeur is aangevraagd en Google Klantenreviews wordt aangezet; we zetten het logo pas neer als de keuring rond is.'],
      ['Wat moet ik doen als ik bij een nepwebshop heb betaald?', 'Vraag de betaling terug via je bank, PayPal of creditcardmaatschappij, meld de winkel bij de Fraudehelpdesk en doe aangifte bij de politie. Bewaar de bevestiging en alle mails.'],
    ],
  },
];

export const ART = Object.fromEntries(ARTIKELEN.map(a => [a.slug, a]));
export const nieuwsteEerst = () => ARTIKELEN.slice().sort((a, b) => String(b.datum).localeCompare(String(a.datum)));
export const linkPad = (a, n) => '/redactie/' + a.slug + '/link/' + n;
export const linkVan = (slug, n) => { const a = ART[slug]; return a ? (a.links || []).find(l => String(l.id) === String(n)) || null : null; };

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// [tekst](#n) of [tekst](/pad) naar een link; een bron tussen haakjes, ([X](#1)) of ([X](#1), [Y](#2)), wordt een voetnootnummer
function opmaak(a, s) {
  const ref = n => { const l = linkVan(a.slug, n); return l ? `<a class="rd-ref" href="${linkPad(a, l.id)}" rel="noopener" data-rl="${l.id}" title="${esc(l.bron + ': ' + l.titel)}">${l.id}</a>` : ''; };
  let t = esc(s).replace(/\s?\(((?:\[[^\]]+\]\(#\d+\)(?:,\s*)?)+)\)/g, (m, binnen) => '<sup>' + [...binnen.matchAll(/\(#(\d+)\)/g)].map(x => ref(x[1])).join('') + '</sup>');
  return t.replace(/\[([^\]]+)\]\((#\d+|\/[a-z0-9\-\/#]*)\)/g, (m, x, h) => {
    if (h[0] === '#') { const l = linkVan(a.slug, h.slice(1)); return l ? `<a href="${linkPad(a, l.id)}" rel="noopener" data-rl="${l.id}">${x}</a>` : x; }
    return `<a href="${h}">${x}</a>`;
  });
}
const platOpmaak = s => String(s).replace(/\s?\(((?:\[[^\]]+\]\(#\d+\)(?:,\s*)?)+)\)/g, '').replace(/\[([^\]]+)\]\((#\d+|\/[^)]*)\)/g, '$1');
const datumNl = d => { try { return new Date(String(d).slice(0, 10) + 'T12:00:00Z').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return String(d); } };

// Kadoly-look (19 nov, Henkjan: "Opmaak van de post moet wel meer kadoly design overnemen . VEEL strakker"): smalle kolom, rustige grijze vlakken,
// voetnootnummers in plaats van bronnamen in de tekst, stappen en status als kaarten, producten als winkelkaarten met zwarte knop.
export const RED_CSS = `<style>
main.wrap{max-width:720px}
.rd-kop{margin:8px 0 28px}.rd-kick{display:flex;gap:10px;align-items:center;font-size:13px;letter-spacing:.06em;text-transform:uppercase;font-weight:700;margin:0 0 14px}.rd-kick a{color:var(--ink);text-decoration:none}.rd-kick span{font-weight:400;text-transform:none;letter-spacing:0;font-size:14px}
.rd-kop h1{font-size:clamp(30px,4.6vw,42px);line-height:1.08;letter-spacing:-.02em;margin:0 0 14px}.rd-kop .rd-sub{font-size:18px;line-height:1.5;margin:0;color:var(--ink)}
main.wrap h2{font-size:24px;letter-spacing:-.01em;margin:40px 0 12px}main.wrap p{font-size:17px;line-height:1.65}
.rd-kop .rd-kort{background:var(--bg-2);border-radius:18px;padding:18px 20px;margin:22px 0 8px;font-size:17px;line-height:1.6}.rd-kort p{margin:0}.rd-kort b{display:block;font-size:13px;letter-spacing:.06em;text-transform:uppercase;margin:0 0 6px}
sup{line-height:0}.rd-ref{display:inline-block;min-width:18px;height:18px;padding:0 5px;margin:0 0 0 3px;border-radius:9px;background:var(--bg-2);color:var(--ink)!important;font-size:11px;font-weight:700;line-height:18px;text-align:center;text-decoration:none!important;vertical-align:2px}.rd-ref:hover{background:var(--prim);color:var(--on-prim)!important}
.rd-st{list-style:none;padding:0;margin:14px 0 0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.rd-st li{border:1px solid var(--line);border-radius:18px;padding:16px 18px;font-size:16px;line-height:1.5}.rd-st i{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--prim);color:var(--on-prim);font-style:normal;font-weight:700;font-size:14px;margin:0 0 10px}.rd-st b{display:block;font-size:17px;margin:0 0 4px}
.rd-sta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0 6px}.rd-sta div{background:var(--bg-2);border-radius:16px;padding:14px 16px;font-size:15px;line-height:1.45}.rd-sta b{display:flex;gap:6px;align-items:center;font-size:15px;margin:0 0 4px}.rd-sta b::before{content:"";width:16px;height:16px;flex:none;border-radius:50%;background:#16a34a url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4.5 8.2l2.2 2.2 4.8-4.8' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")}.rd-sta div.wacht b::before{background:#f59e0b url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='2' fill='white'/%3E%3C/svg%3E")}.rd-sta a{color:var(--ink);font-weight:700}
.rd-pr{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:16px 0 4px}.rd-pk{display:flex;flex-direction:column;text-decoration:none!important}main a.rd-pk:is(.rd-pk,#rd-pk){color:var(--ink)!important}.rd-pk .im{display:block;aspect-ratio:1;border-radius:16px;background:#f3f4f6;overflow:hidden;margin:0 0 10px}.rd-pk img{width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply;display:block}.rd-pk .n{font-size:14px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:38px}.rd-pk .p{font-size:17px;font-weight:700;margin:4px 0 2px}.rd-pk .d{font-size:13px;margin:0 0 10px}.rd-pk .k{margin-top:auto;display:block;text-align:center;background:var(--prim);color:var(--on-prim);border-radius:999px;padding:9px 12px;font-size:14px;font-weight:700}.rd-pk:hover .k{opacity:.88}
.rd-bron{counter-reset:b;list-style:none;padding:0;margin:0;font-size:14px;line-height:1.5}.rd-bron li{display:flex;gap:10px;padding:8px 0;border-top:1px solid var(--line)}.rd-bron li span{flex:none;min-width:22px;height:22px;border-radius:11px;background:var(--bg-2);font-size:12px;font-weight:700;display:grid;place-items:center}.rd-bron a{color:var(--ink)}
.rd-lijst{list-style:none;padding:0;margin:0;display:grid;gap:12px}.rd .rd-lijst a:is(a,#rd-a){text-decoration:none!important}.rd-lijst{margin:8px 0 40px!important}.rd-lijst a{display:block;background:var(--bg-2);border:1.5px solid transparent;border-radius:20px;padding:20px 22px;text-decoration:none}.rd-lijst a:hover{border-color:var(--ink)}.rd-lijst b{display:block;font-size:22px;line-height:1.2;letter-spacing:-.01em;margin:0 0 8px}.rd-lijst .rd-dt{font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;margin:0 0 8px}.rd-bs{display:block;font-size:16px;line-height:1.5}.rd-lees{display:inline-block;margin-top:14px;background:var(--prim);color:var(--on-prim);border-radius:999px;padding:8px 16px;font-size:14px;font-weight:700}.rd .standfirst{font-size:18px;line-height:1.5}
.rd a:is(a,#rd-a){color:var(--ink)!important}.rd p a:not(.rd-ref):is(a,#rd-a),.rd .rd-st a:is(a,#rd-a){text-decoration:underline!important;text-decoration-thickness:1px!important;text-underline-offset:3px}.rd p a:not(.rd-ref):hover{text-decoration-thickness:2px!important}
.rd a.rd-ref:hover:is(a,#rd-a){color:var(--on-prim)!important}.rd .rd-st a,.rd .rd-sta a{font-weight:700}
.rd-noot{font-size:14px!important;line-height:1.5!important;margin:12px 0 0}.rd-dt{display:block;font-size:14px;margin:0 0 4px}.rd-bron a{font-weight:600}
.rd-alle:is(a,#rd-a){display:inline-block;margin-top:8px;font-weight:700;text-decoration:none!important;border:1.5px solid var(--ink);border-radius:999px;padding:9px 18px;font-size:15px}
.rd .kicker,.rd .standfirst,.rd .meta{color:var(--ink)!important}
@media(max-width:720px){.rd-st{grid-template-columns:1fr}.rd-sta{grid-template-columns:repeat(2,minmax(0,1fr))}.rd-pr{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>`;

// statusblok "Hoe Kadoly het doet": korte kaarten met vinkje (klaar) of stip (loopt nog)
function statusHtml(a) {
  const kaart = ([k, kort, x, wacht]) => {
    let link = '';
    if (x === 'kvk' && linkVan(a.slug, 10)) link = ` <a href="${linkPad(a, 10)}" rel="noopener" data-rl="10">Zoek op</a>`;
    if (x === 'retour') link = ' <a href="https://kadoly.com/returns">Beleid</a>';
    if (x === 'wa') link = ' <a href="https://wa.me/31655395630" rel="noopener nofollow" target="_blank">WhatsApp</a>';
    return `<div${wacht ? ' class="wacht"' : ''}><b>${esc(k)}</b>${esc(kort)}${link}</div>`;
  };
  return `<div class="rd-sta" id="status">${STATUS.kaarten.map(kaart).join('')}</div><p class="meta" style="font-size:14px">Stand van ${esc(datumNl(STATUS.bijgewerkt))}. Oranje loopt nog.</p>`;
}

// producten: korte levertijd, beste score, één per merk; kaarten via /naar (Clickmind-keten tot betaald)
// zoek: lijst woorden, één ervan moet in de titel staan (kleine letters); pids: vaste keuze gaat voor
export function kiesProducten(cat, { n = 4, maxLt = 5, zoek = null, pids = null, minPrijs = 0, maxPrijs = 1e9 } = {}, thuis) {
  const gezien = new Set();
  if (Array.isArray(pids) && pids.length) return pids.map(p => cat && cat[p]).filter(i => i && i.img && i.vr !== false && thuis(i) > 0).slice(0, n);
  const past = i => !Array.isArray(zoek) || !zoek.length || zoek.some(w => String(i.t).toLowerCase().includes(String(w).toLowerCase()));
  return Object.values(cat || {}).filter(i => i && i.id && i.t && i.img && i.vr !== false && Number(i.lt) > 0 && Number(i.lt) <= maxLt && thuis(i) > Math.max(0, minPrijs) && thuis(i) <= maxPrijs && past(i))
    .sort((x, y) => (Number(y.sc) || 0) - (Number(x.sc) || 0)).filter(i => { const b = String(i.b || i.id).toLowerCase(); if (gezien.has(b)) return false; gezien.add(b); return true; }).slice(0, n);
}

// het artikel (HTML van de main, zonder kop en voet)
export function artikelHtml(a, { cat, thuis, euro, leverDatum, nlDatum }) {
  const g = 'red-' + a.slug;
  let blokNr = 0;
  const body = a.blokken.map(b => {
    if (b.h2) return `<h2>${esc(b.h2)}</h2>`;
    if (b.p) return `<p>${opmaak(a, b.p)}</p>`;
    if (b.stappen) return `<ol class="rd-st">${b.stappen.map(([k, t], n) => `<li><i>${n + 1}</i><b>${esc(k)}</b>${opmaak(a, t)}</li>`).join('')}</ol>`;
    if (b.status) return statusHtml(a);
    if (b.producten) { blokNr++; const L = kiesProducten(cat, b.producten, thuis); if (!L.length) return '';
      return `<div class="rd-pr">${L.map(i => { const href = `/naar/${encodeURIComponent(i.id)}?g=${encodeURIComponent(g)}&amp;b=prod${blokNr}`; return `<a class="rd-pk" href="${href}" rel="nofollow"><span class="im"><img src="${esc(i.img)}" width="300" height="300" alt="${esc(i.t)}" loading="lazy" decoding="async"></span><span class="n">${esc(i.t)}</span><span class="p">${euro(thuis(i))}</span><span class="d">In huis ${esc(nlDatum(leverDatum(i.lt)))}</span><span class="k">Bekijk</span></a>`; }).join('')}</div>`; }
    return '';
  }).join('\n');
  const faq = (a.faq || []).map(([v, t]) => `<details class="faq"><summary>${esc(v)}</summary><div class="a"><p>${opmaak(a, t)}</p></div></details>`).join('');
  const bronnen = `<h2 id="bronnen">Bronnen</h2><ol class="rd-bron">${(a.links || []).map(l => `<li><span>${l.id}</span><div><a href="${linkPad(a, l.id)}" rel="noopener" data-rl="${l.id}">${esc(l.titel)}</a> · ${esc(l.bron)}</div></li>`).join('')}</ol><p class="rd-noot">Gelezen op ${esc(datumNl(a.bijgewerkt))}. ${esc(a.noot || 'Kadoly verkoopt zelf producten; de genoemde keurmerken en diensten betaalden ons niet en wij hen niet.')}</p>`;
  const meer = nieuwsteEerst().filter(x => x.slug !== a.slug).slice(0, 3);
  return `<article class="rd"><header class="rd-kop"><p class="rd-kick"><a href="/redactie">Redactie</a><span>${esc(datumNl(a.datum))} · ${a.leestijd} min</span></p><h1>${esc(a.h1)}</h1>${a.sub ? `<p class="rd-sub lead">${esc(a.sub)}</p>` : ''}<div class="rd-kort lead"><b>In het kort</b><p>${opmaak(a, a.kort)}</p></div></header>
${body}
<h2 id="vragen">Vragen</h2>${faq}
${bronnen}
${meer.length ? `<h2>Meer van de redactie</h2><ul class="rd-lijst">${meer.map(x => `<li><a href="/redactie/${esc(x.slug)}"><b>${esc(x.titel)}</b>${esc(x.besch)}</a></li>`).join('')}</ul>` : `<p><a class="rd-alle" href="/redactie">Alle artikelen van de redactie</a></p>`}</article>`;
}

export function artikelLd(a, HOST, ORG) {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [ORG,
    { '@type': 'Article', headline: a.titel, name: a.h1, description: a.besch, url: HOST + '/redactie/' + a.slug, mainEntityOfPage: HOST + '/redactie/' + a.slug, inLanguage: 'nl-NL', datePublished: a.datum, dateModified: a.bijgewerkt, author: { '@type': 'Organization', name: 'Kadoly redactie', url: HOST + '/redactie' }, publisher: { '@id': HOST + '/#org' }, keywords: (a.zoektermen || []).join(', '), citation: (a.links || []).map(l => l.url) },
    { '@type': 'FAQPage', mainEntity: (a.faq || []).map(([v, t]) => ({ '@type': 'Question', name: v, acceptedAnswer: { '@type': 'Answer', text: platOpmaak(t) } })) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kadoly gids', item: HOST + '/' }, { '@type': 'ListItem', position: 2, name: 'Redactie', item: HOST + '/redactie' }, { '@type': 'ListItem', position: 3, name: a.titel, item: HOST + '/redactie/' + a.slug }] }] }).replace(/</g, '\\u003c');
}

export function overzichtHtml() {
  const L = nieuwsteEerst();
  return `<div class="rd"><p class="kicker"><span class="live-dot"></span>Redactie van Kadoly</p><h1>Redactie: elke dag iets wat je echt helpt kiezen en kopen</h1><p class="standfirst">Elke dag een artikel over een vraag waar veel mensen nu mee zitten. Met bronnen die we zelf lazen, en eerlijk over wat wij als winkel wel en niet doen.</p>
<ul class="rd-lijst">${L.map(a => `<li><a href="/redactie/${esc(a.slug)}"><span class="rd-dt">${esc(datumNl(a.datum))} · ${a.leestijd} min</span><b>${esc(a.titel)}</b><span class="rd-bs">${esc(a.besch)}</span><span class="rd-lees">Lees het artikel</span></a></li>`).join('')}</ul></div>`;
}

export function redactieLlms(HOST, vol) {
  return '## Redactie van Kadoly\n\n' + HOST + '/redactie\n\n' + nieuwsteEerst().map(a => {
    let t = '### ' + a.titel + '\n\n' + HOST + '/redactie/' + a.slug + ' (' + a.datum + ')\n\n' + platOpmaak(a.kort) + '\n';
    if (vol) { t += '\n' + a.blokken.map(b => b.h2 ? '#### ' + b.h2 : b.p ? platOpmaak(b.p) : b.stappen ? b.stappen.map(([k, x], i) => (i + 1) + '. ' + k + ': ' + platOpmaak(x)).join('\n') : b.status ? STATUS.regels.map(([k, x]) => '- ' + k + ': ' + x).join('\n') : '').filter(Boolean).join('\n\n') + '\n\n#### Vragen\n\n' + (a.faq || []).map(([v, x]) => '**' + v + '**\n' + platOpmaak(x)).join('\n\n') + '\n\n#### Bronnen\n\n' + (a.links || []).map(l => '- ' + l.titel + ', ' + l.bron + ': ' + l.url).join('\n') + '\n'; }
    return t;
  }).join('\n') + '\n';
}

// pagina's voor sitemap en IndexNow (zelfde vorm als W_PAGINAS in fn/gids.js)
export const RED_PAGINAS = () => [{ pad: '/redactie', versie: 'r' + ARTIKELEN.length + '-' + (nieuwsteEerst()[0] || {}).bijgewerkt, lm: (nieuwsteEerst()[0] || {}).bijgewerkt || REDACTIE_DAG, naam: 'Redactie van Kadoly' }]
  .concat(ARTIKELEN.map(a => ({ pad: '/redactie/' + a.slug, versie: 'a-' + a.bijgewerkt, lm: a.bijgewerkt, naam: a.titel })));

// stand per artikel uit gk:d:<dag> (baken, links, productkliks)
export async function redStand(kv, dagen = 14) {
  const per = {};
  for (const a of ARTIKELEN) per[a.slug] = { titel: a.titel, datum: a.datum, lezers: 0, herkomst: {}, t15: 0, t60: 0, s50: 0, s90: 0, links: {}, productKliks: 0, ai: a.llmgat ? a.llmgat.level : null };
  for (let i = 0; i < dagen; i++) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    let arr = null; try { arr = await kv.raw(['HGETALL', 'gk:d:' + d]); } catch (e) {}
    if (!Array.isArray(arr)) continue;
    for (let j = 0; j + 1 < arr.length; j += 2) {
      const m = String(arr[j]).match(/^red-([a-z0-9-]+)\|(.+)$/); if (!m || !per[m[1]]) continue;
      const s = per[m[1]], k = m[2], n = Number(arr[j + 1]) || 0;
      if (k.startsWith('v-')) { s.lezers += n; s.herkomst[k.slice(2)] = (s.herkomst[k.slice(2)] || 0) + n; }
      else if (k === 't15' || k === 't60' || k === 's50' || k === 's90') s[k] += n;
      else if (k.startsWith('link-')) s.links[k.slice(5)] = (s.links[k.slice(5)] || 0) + n;
      else if (k.startsWith('uit-')) s.productKliks += n;
    }
  }
  return { ok: true, dagen, artikelen: per };
}
