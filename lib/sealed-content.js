// Sealed Intent (sealedintent.com), inhoud van de landingspagina's. Henkjan 15 nov 2026: "maak zeker de totaal geoptimaliseerde
// landingpagina's die de ingang vormen. ALLES moet lerend zijn, ALLES moet SEO en LLM optimised zijn, ik wil deze week al resultaat."
// Eén pagina per echte zoekvraag (Demand Radar, 15 nov 2026), per taal; geen varianten per kleine zoekterm. Elke pagina: antwoord met
// cijfers en bron bovenaan, dan het hulpmiddel, dan veelgestelde vragen uit echte zoekvragen. Cijfers alleen met bron en datum.
export const BIJGEWERKT = '2026-11-16';

// Bronnen (één keer, per sleutel)
export const BRON = {
  barometer: ['Overname Barometer, Brookz en Dealsuite, februari 2026', 'https://www.accountant.nl/nieuws/2026/2/nederlandse-mkb-bedrijven-waren-nog-nooit-zo-duur/'],
  dealterms: ['Brookz Deal Terms 2025, 937 koopovereenkomsten', 'https://www.accountant.nl/nieuws/2025/10/overnames-in-het-mkb-steeds-meer-op-de-pof/'],
  kbi: ['Kleinbedrijf Index, editie 19, februari 2026', 'https://www.accountancyvanmorgen.nl/2026/02/13/meer-dan-500-000-kleine-bedrijven-zoeken-een-opvolger-hier-ligt-een-kans-voor-de-accountant/'],
  abn: ['ABN AMRO en Ipsos I&O, 519 ondernemers, december 2025', 'https://assets.abnamro.com/api/public/content/sectorprognoses-abn-amro-bedrijfsopvolging-dec-2025.pdf'],
  bw662: ['Burgerlijk Wetboek, artikel 7:662 en verder', 'https://wetten.overheid.nl/BWBR0005290/'],
  bw250: ['Burgerlijk Wetboek, artikel 2:250', 'https://wetten.overheid.nl/BWBR0003045/'],
  kfw: ['KfW-Nachfolge-Monitoring Mittelstand, Januar 2026', 'https://www.kfw.de/%C3%9Cber-die-KfW/Newsroom/Aktuelles/Pressemitteilungen-Details_876352.html'],
  dihk: ['DIHK-Report Unternehmensnachfolge 2025', 'https://www.dihk.de/de/newsroom/unternehmensnachfolge-report-2025-157794'],
  dub: ['DUB KMU Multiples Q2 2026, via Unternehmeredition, August 2026', 'https://www.unternehmeredition.de/die-bewertungsluecke-im-mittelstand/'],
  bbs: ['BizBuySell Insight Report, Q3 2026', 'https://www.bizbuysell.com/news/media_insight.html'],
  epi: ['Exit Planning Institute, State of Owner Readiness 2025 (1,162 owners)', 'https://exit-planning-institute.org/hubfs/25SOOR-Generational.pdf'],
  hyper: ['HYPER and Vanson Bourne, 150 executives in the UK and Switzerland, 2017', 'https://www.globalbankingandfinance.com/accessing-the-hidden-market-for-executive-positions-hyper-research-reveals-over-75-of-executives-lack-visibility-and-access/'],
  wharton: ['Knowledge at Wharton, study of about 2,000 executives', 'https://knowledge.wharton.upenn.edu/article/headhunters-call-surprising-number-executives-answer/'],
  fees: ['JRG Partners, retained search fees 2026', 'https://www.jrgpartners.com/?p=79153'],
  experteer: ['Experteer, Headhunter-Netzwerk', 'https://www.experteer.de/docs/advantages_headhunter'],
  outpl: ['Salaris Vanmorgen, gerichte vrijstelling outplacement, december 2025', 'https://www.salarisvanmorgen.nl/2025/12/02/gerichte-vrijstelling-voor-outplacementkosten-bij-loon-uit-tegenwoordige-arbeid/'],
  ukcode: ['UK Corporate Governance Code, Financial Reporting Council', 'https://www.frc.org.uk/library/standards-codes-policy/corporate-governance/uk-corporate-governance-code/'],
};

// Waardering per markt (gebruikt door het rekenhulpje in de pagina). NL: gemiddelde factor x winst voor rente, belasting en afschrijving.
export const MULT = {
  nl: { bron: 'barometer', sectoren: [['Software', 7.5], ['IT-diensten', 6.7], ['Zorg en farma', 6.5], ['Zakelijke dienstverlening', 5.0, 1], ['Industrie en productie', 5.0, 1], ['Bouw en installatie', 5.0, 1], ['Transport en logistiek', 5.0, 1], ['Groothandel', 5.0, 1], ['Horeca en recreatie', 3.3], ['Retail', 2.5]] },
  de: { bron: 'dub', sectoren: [['Software und digitale Plattformen', 6.3, 8.0], ['Maschinen- und Anlagenbau', 3.5, 4.5], ['Konsumgüterhersteller', 2.4, 4.0]] },
  en: { bron: 'bbs', klein: 2.30, groot: 3.73 },
};

const NL = 'nl', DE = 'de', EN = 'en';
// paar = dezelfde pagina in een andere taal (hreflang); tool = het hulpmiddel in de pagina
export const PAGINAS = [
  // ===================== ONDERNEMERS =====================
  { taal: NL, slug: 'wat-is-mijn-bedrijf-waard', paar: 'waarde', groep: 'o', tool: 'waarde',
    title: 'Wat is mijn bedrijf waard? Bereken het anoniem in 2 minuten', desc: 'Een mkb-bedrijf bracht eind 2025 gemiddeld 5,0 keer de winst op, software 7,5 keer. Bereken de waarde van jouw bedrijf zonder naam, met de cijfers per sector.',
    h1: 'Wat is mijn bedrijf waard?',
    antwoord: 'Een Nederlands mkb-bedrijf bracht in de tweede helft van 2025 gemiddeld 5,0 keer de winst vóór rente, belasting en afschrijving op, het hoogste sinds de meting in 2015 begon. Software haalde 7,5 keer, IT-diensten 6,7 keer, zorg en farma 6,5 keer. Retail haalde 2,5 keer en horeca 3,3 keer. Hoe minder het bedrijf van jou afhangt en hoe meer omzet terugkerend is, hoe hoger de factor.',
    feiten: [['Software', '7,5×'], ['IT-diensten', '6,7×'], ['Zorg en farma', '6,5×'], ['Gemiddeld, alle sectoren', '5,0×'], ['Horeca en recreatie', '3,3×'], ['Retail', '2,5×']], feitenBron: 'barometer',
    faq: [
      ['Hoeveel keer de winst is een bedrijf waard?', 'Gemiddeld 5,0 keer de winst vóór rente, belasting en afschrijving (tweede helft 2025). Kleinere bedrijven en bedrijven die op de eigenaar draaien zitten lager; software, IT en zorg hoger.'],
      ['Hoe bereken je de waarde van een bedrijf?', 'Voor het mkb meestal zo: de winst vóór rente, belasting en afschrijving keer de factor van je sector. Trek de schulden eraf en tel het overtollige geld erbij. Dat is wat jij als aandeelhouder krijgt.'],
      ['Wat is een bedrijf waard bij overname?', 'De prijs op papier is niet wat je op de verkoopdag krijgt. In 2025 werd maar 9% van de deals in één keer betaald; 38% had een deel dat afhangt van latere resultaten en 29% een lening van de verkoper aan de koper.'],
      ['Weet iemand dat ik de waarde bereken?', 'Nee. Je hoeft geen naam of bedrijfsnaam in te vullen. Pas als je je intentie verzegelt, vragen we een e-mailadres, en ook dat ziet geen koper.'],
    ], bronnen: ['barometer', 'dealterms'], verwant: ['verkopen', 'bod'] },

  { taal: NL, slug: 'bedrijf-verkopen', paar: 'verkopen', groep: 'o', tool: 'waarde',
    title: 'Bedrijf verkopen zonder dat iemand het weet', desc: 'Verkoop je bedrijf zonder advertentie. Leg je intentie verzegeld neer met jouw voorwaarden; alleen gecontroleerde kopers zien het, zonder je naam.',
    h1: 'Bedrijf verkopen zonder dat iemand het weet',
    antwoord: 'Je hoeft geen advertentie te plaatsen. Leg je intentie verzegeld neer: sector, regio, omvang, termijn en jouw voorwaarden. Alleen gecontroleerde kopers die je voorwaarden accepteren zien het, zonder je naam. Jij beslist wie je spreekt. Bijna de helft van de verkopen duurt 6 tot 12 maanden, dus wie op tijd begint, houdt de regie.',
    feiten: [['Verkopen die 6 tot 12 maanden duren', '49%'], ['Verkopen die langer dan een jaar duren', '30%'], ['Verkoopt om leeftijd, zonder opvolger', '41%'], ['Gemiddelde leeftijd van de verkoper', '54'], ['Kleine ondernemers die binnen 5 jaar verkopen of overdragen', '35%']], feitenBron: 'barometer', feitenBron2: 'kbi',
    faq: [
      ['Wat gebeurt er met mijn personeel als ik mijn bedrijf verkoop?', 'Verkoop je de aandelen, dan lopen de arbeidsovereenkomsten gewoon door. Verkoop je de onderneming zelf, dan gaan de werknemers bij een overgang van onderneming van rechtswege mee, met hun arbeidsvoorwaarden. Bij Sealed Intent zet je "iedereen blijft in dienst" als voorwaarde.'],
      ['Wat kost een adviseur bij een bedrijfsovername?', 'Meestal een vast bedrag vooraf plus een succesfee als percentage van de koopprijs. Vraag het altijd vooraf op papier. Sealed Intent is gratis voor jou: kopers en adviseurs betalen.'],
      ['Moet ik belasting betalen als ik mijn bv verkoop?', 'De winst op je aandelen valt in box 2. Houd je de aandelen via een holding, dan blijft de opbrengst vaak belastingvrij binnen de holding. Laat het altijd door je fiscalist narekenen.'],
      ['Hoe verkoop ik mijn bedrijf zonder dat personeel en klanten het merken?', 'Zonder advertentie. Je intentie staat nergens openbaar; alleen kopers die passen en je voorwaarden accepteren zien een profiel zonder naam, plaats of precieze cijfers.'],
    ], bronnen: ['barometer', 'kbi', 'bw662'], verwant: ['waarde', 'bod'] },

  { taal: NL, slug: 'bod-op-mijn-bedrijf', paar: 'bod', groep: 'o', tool: 'bod',
    title: 'Bod op je bedrijf gekregen? Check het en reageer met jouw voorwaarden', desc: 'Reken een bod om naar keer de winst en vergelijk met je sector. Reageer met jouw voorwaarden en laat anoniem zien of anderen meer bieden.',
    h1: 'Bod op je bedrijf gekregen?',
    antwoord: 'Reken het bod om naar keer de winst en leg het naast je sector: gemiddeld 5,0 keer, IT-diensten 6,7 keer, retail 2,5 keer. Kijk daarna naar wat je op de verkoopdag krijgt. Reageer met jouw voorwaarden, en laat anoniem zien of anderen meer bieden. De bieder merkt daar niets van.',
    feiten: [['Deals in één keer betaald (2025)', '9%'], ['Deals met een earn-out', '38%'], ['Deals met een lening van de verkoper', '29%'], ['Deals in één keer betaald (2024)', '17%']], feitenBron: 'dealterms',
    faq: [
      ['Wat is een earn-out?', 'Een deel van de koopprijs dat je pas krijgt als het bedrijf na de verkoop bepaalde resultaten haalt. Bij deals met een earn-out ging het in 2025 om ongeveer 43% van de koopprijs.'],
      ['Moet ik reageren op een ongevraagd bod?', 'Nee, maar een ongevraagd bod is een van de twee meest genoemde redenen waarom eigenaren gaan verkopen. Reageer met voorwaarden in plaats van met ja of nee: dan houd jij de regie.'],
      ['Welke voorwaarden kan ik aan een bod verbinden?', 'Een minimumprijs, het deel dat je op de verkoopdag krijgt, of je personeel in dienst blijft, hoelang jij aanblijft, of de naam blijft en hoe lang een concurrentiebeding mag duren.'],
    ], bronnen: ['dealterms', 'barometer'], verwant: ['waarde', 'verkopen'] },

  // ===================== EXECUTIVES NL =====================
  { taal: NL, slug: 'outplacement', paar: 'outplacement', groep: 'e', tool: 'exec', soort: 'outplacement',
    title: 'Outplacement kiezen: laat bureaus anoniem een voorstel doen', desc: 'Vertrek met een outplacementbudget? Leg anoniem neer wat je zoekt; outplacementbureaus doen een voorstel, jij kiest. Je naam komt pas vrij als jij ja zegt.',
    h1: 'Outplacement kiezen, zonder dat iemand meekijkt',
    antwoord: 'Bij een vertrekregeling krijg je vaak een outplacementbudget. Een werkgever kan outplacementkosten onder voorwaarden belastingvrij vergoeden (de gerichte vrijstelling in de loonbelasting). Leg anoniem neer wat je zoekt: rol, sector, budget en termijn. Bureaus doen een voorstel; jij kiest wie je spreekt.',
    feiten: [['Vergoeding door de werkgever', 'onder voorwaarden belastingvrij'], ['Reiskosten voor outplacement', 'tot € 0,23 per km vrij']], feitenBron: 'outpl',
    faq: [
      ['Wat is outplacement?', 'Begeleiding naar een nieuwe baan na een vertrek: loopbaanscan, coaching, netwerk en sollicitatiehulp. De werkgever betaalt het meestal als onderdeel van de vaststellingsovereenkomst.'],
      ['Is outplacement belastingvrij?', 'Een werkgever kan outplacementkosten onder voorwaarden belastingvrij vergoeden via de gerichte vrijstelling (eindheffingsloon en de gebruikelijkheidstoets). Laat het in de vaststellingsovereenkomst goed vastleggen.'],
      ['Mag ik zelf een outplacementbureau kiezen?', 'Vaak wel, als je dat in de vaststellingsovereenkomst laat opnemen. Vraag dan meerdere voorstellen en kies op aanpak en netwerk in jouw sector.'],
    ], bronnen: ['outpl'], verwant: ['headhunter', 'opentowork'] },

  { taal: NL, slug: 'open-to-work-uitzetten', paar: 'opentowork', groep: 'e', tool: 'exec', soort: 'zichtbaar',
    title: 'Open to Work uitzetten op LinkedIn, en toch gevonden worden', desc: 'Zo zet je Open to Work uit. En zo laat je headhunters toch weten dat je openstaat, zonder dat je werkgever het ziet.',
    h1: 'Open to Work uitzetten, en toch gevonden worden',
    antwoord: 'Uitzetten gaat op je profiel: tik op het Open to Work-kader, kies bewerken en dan verwijderen. Ook met de instelling "alleen recruiters" zegt LinkedIn geen volledige privacy te kunnen garanderen. Wil je wel gevonden worden, leg dan verzegeld neer wat je zoekt: alleen erkende headhunters zien het, zonder naam.',
    feiten: [['Topfuncties die nooit openbaar worden', 'meer dan 90%'], ['Vond de huidige functie via een vacature', '6%'], ['Vindt discreet zoeken lastig', '70%'], ['Wil discreet benaderd worden', '78%']], feitenBron: 'hyper',
    faq: [
      ['Hoe zet ik Open to Work uit op LinkedIn?', 'Ga naar je profiel, tik op het Open to Work-kader onder je foto, kies het potlood (bewerken) en daarna "Uit profiel verwijderen". Het groene kader verdwijnt direct.'],
      ['Ziet mijn werkgever Open to Work met de instelling alleen recruiters?', 'LinkedIn probeert recruiters van je eigen werkgever het niet te tonen, maar zegt dat het geen volledige privacy kan garanderen. Op topniveau is dat een reëel risico.'],
      ['Hoe kom ik in beeld bij headhunters zonder dat mijn werkgever het weet?', 'Leg zonder naam neer wat je zoekt: rol, sector, pakketband en termijn. Sluit je werkgever, zijn groep en concurrenten uit. Je naam komt pas vrij als jij ja zegt.'],
    ], bronnen: ['hyper'], verwant: ['headhunter', 'outplacement'] },

  { taal: NL, slug: 'headhunter', paar: 'headhunter', groep: 'e', tool: 'exec', soort: 'headhunter',
    title: 'Gebeld door een headhunter? Reageer met jouw voorwaarden', desc: 'Reageer op een headhunter met voorwaarden in plaats van een cv. En laat tegelijk andere headhunters anoniem reageren.',
    h1: 'Gebeld door een headhunter?',
    antwoord: 'Je hoeft niet te kiezen tussen ja en nee. Reageer met jouw voorwaarden: rol, pakket en wat niet onderhandelbaar is. Laat tegelijk andere headhunters anoniem reageren. Een telefoontje van een headhunter is de belangrijkste reden waarom topmensen gaan rondkijken; van de benaderde executives zei 52% ja tegen een gesprek.',
    feiten: [['Benaderde executives die ja zeiden tegen een gesprek', '52%'], ['Fee van een headhunter (betaald door het bedrijf)', '25–35% van het eerste jaar'], ['Kennen gemiddeld persoonlijk', '3 headhunters']], feitenBron: 'wharton',
    faq: [
      ['Wat kost een headhunter?', 'Niets voor jou. Het bedrijf betaalt de headhunter, bij topfuncties meestal 25 tot 35% van het eerste-jaarsinkomen.'],
      ['Hoe reageer ik op een headhunter zonder mijn werkgever te alarmeren?', 'Reageer buiten je werkmail, met voorwaarden in plaats van een cv. Zo blijft er niets bij je werkgever achter en weet de headhunter meteen of het past.'],
      ['Wat is een headhunter?', 'Een bureau dat in opdracht van een bedrijf de juiste persoon zoekt voor een (top)functie en die zelf benadert. De meeste topfuncties worden zo ingevuld, niet via een vacature.'],
    ], bronnen: ['wharton', 'fees', 'hyper'], verwant: ['opentowork', 'toezicht'] },

  { taal: NL, slug: 'commissaris-worden', paar: 'toezicht', groep: 'e', tool: 'exec', soort: 'toezicht',
    title: 'Commissaris worden: discreet gevonden voor een raad van commissarissen', desc: 'Wat een commissaris doet en hoe je discreet in beeld komt voor een raad van commissarissen of raad van toezicht.',
    h1: 'Commissaris worden',
    antwoord: 'Een commissaris houdt toezicht op het bestuur en staat het met raad terzijde; bij een bv staat dat in artikel 2:250 van het Burgerlijk Wetboek. De meeste plekken worden via een netwerk of een bureau ingevuld. Leg verzegeld neer wat je zoekt: soort organisatie, sector, tijd per maand en je ervaring. Bureaus en raden zien het zonder naam.',
    feiten: [['Wettelijke taak', 'toezicht en advies aan het bestuur'], ['Rechtsvormen', 'nv, bv, stichting, coöperatie']], feitenBron: 'bw250',
    faq: [
      ['Wat doet een raad van commissarissen?', 'Toezicht houden op het beleid van het bestuur en de algemene gang van zaken, en het bestuur met raad terzijde staan. Bij een structuurvennootschap benoemt de raad ook het bestuur.'],
      ['Wat is het verschil tussen een raad van toezicht en een raad van commissarissen?', 'Een raad van commissarissen hoort bij een nv of bv, een raad van toezicht meestal bij een stichting of vereniging, zoals een zorginstelling of school. De taak is vergelijkbaar: toezicht en advies.'],
      ['Hoe word ik commissaris?', 'Via je netwerk, een bureau of een openbare werving. Wie na een exit of een topfunctie discreet laat weten beschikbaar te zijn, wordt eerder gevraagd voor plekken die nooit openbaar komen.'],
    ], bronnen: ['bw250'], verwant: ['headhunter', 'outplacement'] },

  // ===================== DUITS =====================
  { taal: DE, slug: 'unternehmenswert-berechnen', paar: 'waarde', groep: 'o', tool: 'waarde',
    title: 'Unternehmenswert berechnen: anonym in 2 Minuten', desc: 'EBITDA-Multiples für kleine Unternehmen (DUB, Q2 2026): Software 6,3–8,0, Maschinenbau 3,5–4,5. Berechnen Sie den Wert Ihrer Firma ohne Namen.',
    h1: 'Unternehmenswert berechnen',
    antwoord: 'Kleine Unternehmen mit weniger als 5 Mio. € Umsatz wurden im zweiten Quartal 2026 je nach Branche mit dem 2,4- bis 8-Fachen des EBITDA bewertet: Software 6,3–8,0, Maschinen- und Anlagenbau 3,5–4,5, Konsumgüter 2,4–4,0. Größere Firmen erzielen deutlich mehr: Maschinenbau ab 50 Mio. € Umsatz 5,6–7,1. Vom Ergebnis ziehen Sie Schulden ab und rechnen liquide Mittel hinzu.',
    feiten: [['Software, Micro Cap', '6,3–8,0×'], ['Maschinen- und Anlagenbau, Micro Cap', '3,5–4,5×'], ['Konsumgüter, Micro Cap', '2,4–4,0×'], ['Maschinenbau, Mid Cap (> 50 Mio. €)', '5,6–7,1×'], ['Erwarteter Kaufpreis von Altinhabern (Ø)', '499.000 €']], feitenBron: 'dub', feitenBron2: 'kfw',
    faq: [
      ['Wie berechnet man den Unternehmenswert?', 'Für kleine und mittlere Firmen meist mit dem Multiplikatorverfahren: EBITDA mal Branchenmultiple, minus Schulden, plus liquide Mittel. Das Ergebnis ist der Wert Ihrer Anteile.'],
      ['Warum ist meine Firma weniger wert als erhofft?', 'Laut DIHK verlangen 36 % der beratenen Altinhaber einen überhöhten Kaufpreis. Oft liegt es an der Abhängigkeit vom Inhaber und an der Größe: kleine Firmen erzielen deutlich niedrigere Multiples.'],
      ['Erfährt jemand, dass ich den Wert berechne?', 'Nein. Sie geben keinen Namen und keinen Firmennamen an. Erst wenn Sie Ihre Absicht versiegeln, fragen wir eine E-Mail-Adresse ab, und auch die sieht kein Käufer.'],
    ], bronnen: ['dub', 'kfw', 'dihk'], verwant: ['verkopen', 'bod'] },

  { taal: DE, slug: 'firma-verkaufen', paar: 'verkopen', groep: 'o', tool: 'waarde',
    title: 'Firma verkaufen, ohne dass es jemand erfährt', desc: 'Firma oder GmbH verkaufen ohne Inserat: Absicht versiegelt hinterlegen, nur geprüfte Käufer sehen sie, ohne Namen. Sie entscheiden, mit wem Sie sprechen.',
    h1: 'Firma verkaufen, ohne dass es jemand erfährt',
    antwoord: 'Sie brauchen kein Inserat. Hinterlegen Sie Ihre Absicht versiegelt: Branche, Region, Größe, Zeitrahmen und Ihre Bedingungen. Nur geprüfte Käufer, die Ihre Bedingungen akzeptieren, sehen sie, ohne Ihren Namen. Bis Ende 2029 suchen 545.000 Inhaber im Mittelstand eine Nachfolge; vier von zehn Kaufinteressenten haben Probleme mit der Finanzierung.',
    feiten: [['Inhaber, die bis Ende 2029 eine Nachfolge suchen', '545.000'], ['Inhaber 55 Jahre und älter', '57 %'], ['Altinhaber mit überhöhter Preisvorstellung', '36 %'], ['Beginnen zu spät (1–2 Jahre vorher)', '38 %']], feitenBron: 'kfw', feitenBron2: 'dihk',
    faq: [
      ['Wie verkaufe ich meine GmbH?', 'Meist als Anteilsverkauf (Share Deal): Käufer übernimmt die Geschäftsanteile, der Vertrag wird notariell beurkundet. Bewerten, Käufer finden, Absichtserklärung, Prüfung (Due Diligence), Kaufvertrag.'],
      ['Wie lange dauert ein Firmenverkauf?', 'Rechnen Sie mit sechs bis zwölf Monaten, oft länger. 38 % der Altinhaber beginnen laut DIHK zu spät, erst ein bis zwei Jahre vorher.'],
      ['Wie verkaufe ich, ohne dass Mitarbeiter und Kunden es merken?', 'Ohne Inserat. Ihre Absicht steht nirgends öffentlich; nur passende Käufer, die Ihre Bedingungen akzeptieren, sehen ein Profil ohne Namen, Ort oder genaue Zahlen.'],
    ], bronnen: ['kfw', 'dihk'], verwant: ['waarde', 'bod'] },

  { taal: DE, slug: 'kaufangebot-firma', paar: 'bod', groep: 'o', tool: 'bod',
    title: 'Kaufangebot für Ihre Firma? Prüfen und mit Bedingungen antworten', desc: 'Rechnen Sie ein Kaufangebot in ein EBITDA-Multiple um und vergleichen Sie es mit Ihrer Branche. Antworten Sie mit Bedingungen und lassen Sie anonym andere bieten.',
    h1: 'Kaufangebot für Ihre Firma erhalten?',
    antwoord: 'Rechnen Sie das Angebot in ein Vielfaches des EBITDA um und vergleichen Sie es mit Ihrer Branche: Software 6,3–8,0, Maschinenbau 3,5–4,5, Konsumgüter 2,4–4,0 (kleine Firmen, Q2 2026). Prüfen Sie dann, was Sie am Verkaufstag erhalten. Antworten Sie mit Ihren Bedingungen und lassen Sie anonym prüfen, ob andere mehr bieten. Der Bieter merkt davon nichts.',
    feiten: [['Software, Micro Cap', '6,3–8,0×'], ['Maschinenbau, Micro Cap', '3,5–4,5×'], ['Konsumgüter, Micro Cap', '2,4–4,0×']], feitenBron: 'dub',
    faq: [
      ['Muss ich auf ein unaufgefordertes Kaufangebot antworten?', 'Nein. Antworten Sie aber besser mit Bedingungen als mit Ja oder Nein: Mindestpreis, Anteil am Verkaufstag, Mitarbeiter, Ihre Rolle danach. So behalten Sie die Kontrolle.'],
      ['Was ist ein Earn-out?', 'Ein Teil des Kaufpreises, den Sie erst erhalten, wenn das Unternehmen nach dem Verkauf bestimmte Ziele erreicht. Je größer dieser Teil, desto höher Ihr Risiko.'],
    ], bronnen: ['dub'], verwant: ['waarde', 'verkopen'] },

  { taal: DE, slug: 'headhunter', paar: 'headhunter', groep: 'e', tool: 'exec', soort: 'headhunter',
    title: 'Headhunter diskret: gefunden werden, ohne dass Ihr Arbeitgeber es merkt', desc: 'Hinterlegen Sie anonym, was Sie suchen: Rolle, Branche, Gehaltsband, Zeitrahmen. Nur geprüfte Headhunter sehen es, ohne Namen.',
    h1: 'Headhunter, diskret',
    antwoord: 'Die meisten Führungspositionen werden nie ausgeschrieben; Headhunter finden Sie, wenn sie wissen, dass Sie offen sind. Das offen zu sagen ist riskant. Hinterlegen Sie deshalb versiegelt, was Sie suchen: Rolle, Branche, Gehaltsband, Zeitrahmen und wer nicht. Nur geprüfte Headhunter sehen es, ohne Ihren Namen.',
    feiten: [['Führungspositionen, die nie öffentlich werden', 'über 90 %'], ['Fand die aktuelle Position über eine Anzeige', '6 %'], ['Wollen diskret angesprochen werden', '78 %']], feitenBron: 'hyper',
    faq: [
      ['Was kostet ein Headhunter?', 'Für Sie nichts. Das Unternehmen zahlt den Headhunter, bei Führungspositionen meist 25 bis 35 % des ersten Jahresgehalts.'],
      ['Wie werde ich von Headhuntern gefunden, ohne dass mein Arbeitgeber es merkt?', 'Ohne Namen hinterlegen, was Sie suchen, und Ihren Arbeitgeber, seine Gruppe und Wettbewerber ausschließen. Ihr Name wird erst freigegeben, wenn Sie zustimmen.'],
    ], bronnen: ['hyper', 'fees'], verwant: ['outplacement'] },

  { taal: DE, slug: 'outplacement', paar: 'outplacement', groep: 'e', tool: 'exec', soort: 'outplacement',
    title: 'Outplacement-Beratung finden: Anbieter machen anonym ein Angebot', desc: 'Outplacement im Aufhebungsvertrag? Hinterlegen Sie anonym, was Sie suchen; Outplacement-Berater machen ein Angebot, Sie wählen.',
    h1: 'Outplacement-Beratung finden',
    antwoord: 'Outplacement wird oft im Aufhebungsvertrag vereinbart und vom Arbeitgeber bezahlt. Hinterlegen Sie anonym, was Sie suchen: Rolle, Branche, Budget und Zeitrahmen. Berater machen ein Angebot; Sie entscheiden, mit wem Sie sprechen. Ihr Name wird erst freigegeben, wenn Sie zustimmen.',
    feiten: [['Wer zahlt meist', 'der Arbeitgeber, im Aufhebungsvertrag'], ['Ihr Name', 'erst nach Ihrer Zustimmung']], feitenBron: null,
    faq: [
      ['Was ist Outplacement?', 'Begleitung in eine neue Position nach einer Trennung: Standortbestimmung, Coaching, Netzwerk und Bewerbung. Meist bezahlt vom bisherigen Arbeitgeber.'],
      ['Kann ich den Outplacement-Berater selbst wählen?', 'Oft ja, wenn das im Aufhebungsvertrag steht. Holen Sie mehrere Angebote ein und wählen Sie nach Ansatz und Netzwerk in Ihrer Branche.'],
    ], bronnen: [], verwant: ['headhunter'] },

  // ===================== ENGELS =====================
  { taal: EN, slug: 'what-is-my-business-worth', paar: 'waarde', groep: 'o', tool: 'waarde',
    title: 'What is my business worth? A confidential range in 2 minutes', desc: 'Small businesses sold for an average 2.30x cash flow under $1M and 3.73x above (Q3 2026). Get a range for yours without giving your name.',
    h1: 'What is my business worth?',
    antwoord: 'In the third quarter of 2026, US small businesses that sold for under $1 million went for an average of 2.30 times annual cash flow; those above $1 million averaged 3.73 times. The median sale price was $350,000, up 17% from a year earlier, on a median cash flow of $156,000. The less the business depends on you, the higher the multiple.',
    feiten: [['Average multiple, sales under $1M', '2.30×'], ['Average multiple, sales above $1M', '3.73×'], ['Median sale price', '$350,000'], ['Median cash flow of businesses sold', '$156,000'], ['Businesses sold in the quarter', '2,132']], feitenBron: 'bbs',
    faq: [
      ['How much is a business worth?', 'For small owner-run businesses, typically a multiple of annual cash flow (seller\'s discretionary earnings): about 2.3x under $1 million and 3.7x above (Q3 2026 averages). Larger companies are valued on EBITDA, usually at higher multiples.'],
      ['How do you calculate the value of a business?', 'Take annual cash flow or EBITDA, multiply by the multiple for your size and industry, subtract debt and add excess cash. That is what you receive as the owner.'],
      ['Will anyone know I am checking?', 'No. You do not enter a name or company name. Only when you seal your intent do we ask for an email address, and no buyer sees it.'],
    ], bronnen: ['bbs', 'epi'], verwant: ['verkopen', 'bod'] },

  { taal: EN, slug: 'sell-my-business', paar: 'verkopen', groep: 'o', tool: 'waarde',
    title: 'Sell my business confidentially, without a listing', desc: 'Sell your business without a public listing. Seal your intent with your terms; only verified buyers who accept them see it, without your name.',
    h1: 'Sell my business, confidentially',
    antwoord: 'You do not need a public listing. Seal your intent: industry, region, size, timing and your terms. Only verified buyers who accept your terms see it, without your name. You decide who you talk to. 75% of owners intend to transition within ten years, yet only 13% have a formal exit plan.',
    feiten: [['Owners planning to transition within 10 years', '75%'], ['Owners with a formal exit plan', '13%'], ['Share of net worth often tied up in the business', '80–90%'], ['Owners planning to sell who consider selling sooner', '27%']], feitenBron: 'epi', feitenBron2: 'bbs',
    faq: [
      ['How do I sell my business without employees finding out?', 'Without a public listing. Your intent is never published; only matching buyers who accept your terms see a profile without your name, location or exact figures.'],
      ['How long does it take to sell a small business?', 'Usually six to twelve months from preparation to closing, longer if the books or the dependence on the owner need work first.'],
      ['Do I need a business broker?', 'Many owners use one to run the process and negotiate. On Sealed Intent you stay free to choose: buyers and advisers respond to your sealed intent, and you decide who to talk to.'],
    ], bronnen: ['epi', 'bbs'], verwant: ['waarde', 'bod'] },

  { taal: EN, slug: 'offer-for-my-business', paar: 'bod', groep: 'o', tool: 'bod',
    title: 'Got an offer for your business? Check it and reply with your terms', desc: 'Turn an offer into a multiple of cash flow and compare it with recent sales. Reply with your terms and see anonymously whether others bid more.',
    h1: 'Got an offer for your business?',
    antwoord: 'Turn the offer into a multiple of annual cash flow and compare it with recent sales: an average 2.30 times under $1 million and 3.73 times above (Q3 2026). Then look at what you receive at closing. Reply with your terms, and see anonymously whether others bid more. The bidder will not know.',
    feiten: [['Average multiple, sales under $1M', '2.30×'], ['Average multiple, sales above $1M', '3.73×'], ['Buyer confidence index', '49']], feitenBron: 'bbs',
    faq: [
      ['Should I reply to an unsolicited offer?', 'You do not have to, but replying with terms instead of yes or no keeps you in control: minimum price, cash at closing, staff, your role afterwards and the length of any non-compete.'],
      ['What is a letter of intent when buying a business?', 'A document setting out the main terms before due diligence. It is usually not binding on price, but often binding on exclusivity and confidentiality, so read those clauses closely.'],
    ], bronnen: ['bbs'], verwant: ['waarde', 'verkopen'] },

  { taal: EN, slug: 'outplacement-services', paar: 'outplacement', groep: 'e', tool: 'exec', soort: 'outplacement',
    title: 'Outplacement services: let providers pitch to you anonymously', desc: 'Leaving with an outplacement budget? Seal what you are looking for; outplacement providers send a proposal and you choose. Your name stays sealed until you say yes.',
    h1: 'Outplacement services, on your terms',
    antwoord: 'An outplacement budget is often part of a severance agreement, paid by the employer. Seal what you are looking for: role, industry, budget and timing. Providers send a proposal; you decide who to talk to. Your name stays sealed until you say yes.',
    feiten: [['Who usually pays', 'the employer, as part of severance'], ['Your name', 'released only when you say yes']], feitenBron: null,
    faq: [
      ['What is outplacement?', 'Support in finding a new role after leaving a job: career assessment, coaching, network introductions and job-search help, usually paid by the former employer.'],
      ['Can I choose my own outplacement firm?', 'Often yes, if your severance agreement allows it. Ask several providers for a proposal and choose on approach and network in your industry.'],
    ], bronnen: [], verwant: ['headhunter', 'opentowork'] },

  { taal: EN, slug: 'turn-off-open-to-work', paar: 'opentowork', groep: 'e', tool: 'exec', soort: 'zichtbaar',
    title: 'Turn off Open to Work on LinkedIn, and still get found', desc: 'How to remove Open to Work from LinkedIn, and how to let headhunters know you are open without your employer seeing it.',
    h1: 'Turn off Open to Work, and still get found',
    antwoord: 'Go to your profile, select the Open to Work box, choose edit, then delete from profile. Even with "recruiters only", LinkedIn says it cannot guarantee full privacy. If you still want to be found, seal what you are looking for: only vetted executive search firms see it, without your name.',
    feiten: [['Executive roles never advertised', 'over 90%'], ['Found their current role through an ad', '6%'], ['Find confidentiality hard while searching', '70%'], ['Want to be approached discreetly', '78%']], feitenBron: 'hyper',
    faq: [
      ['How do I remove Open to Work on LinkedIn?', 'On your profile, select the Open to Work box under your photo, choose the pencil (edit) and then "Delete from profile". The green frame disappears at once.'],
      ['Can my employer see Open to Work if I choose recruiters only?', 'LinkedIn tries to hide it from recruiters at your own company but says it cannot guarantee full privacy. At senior level that is a real risk.'],
      ['How do I find a headhunter?', 'Most executive search firms work on retained assignments for companies and approach candidates themselves. The way in is to be findable for them: say what you are looking for without saying who you are.'],
    ], bronnen: ['hyper'], verwant: ['headhunter', 'outplacement'] },

  { taal: EN, slug: 'headhunter-called', paar: 'headhunter', groep: 'e', tool: 'exec', soort: 'headhunter',
    title: 'A headhunter called me: how to reply on your terms', desc: 'Reply to a headhunter with your terms instead of a CV, and let other executive search firms respond anonymously at the same time.',
    h1: 'A headhunter called you?',
    antwoord: 'You do not have to choose between yes and no. Reply with your terms: role, package and what is not negotiable. At the same time, let other search firms respond anonymously. A call from a recruiter is the most common trigger for an executive job search; 52% of executives contacted agreed to become candidates.',
    feiten: [['Executives contacted who agreed to become candidates', '52%'], ['Retained search fee (paid by the company)', '25–35% of first-year cash'], ['Search firms an executive knows personally, on average', '3']], feitenBron: 'wharton',
    faq: [
      ['What does a headhunter cost?', 'Nothing for you. The company pays the search firm, usually 25 to 35% of the first-year cash compensation for senior roles.'],
      ['How do I reply to a headhunter without alerting my employer?', 'Reply outside your work email, with terms instead of a CV. Nothing stays behind at your employer, and the search firm knows at once whether it fits.'],
    ], bronnen: ['wharton', 'fees', 'hyper'], verwant: ['opentowork', 'toezicht'] },

  { taal: EN, slug: 'non-executive-director', paar: 'toezicht', groep: 'e', tool: 'exec', soort: 'toezicht',
    title: 'How to become a non-executive director, discreetly', desc: 'What a non-executive director does, and how to become findable for board roles that are never advertised.',
    h1: 'How to become a non-executive director',
    antwoord: 'A non-executive director challenges and supports the executive team and protects shareholders\' interests. For UK premium-listed companies, the Corporate Governance Code requires at least half the board, excluding the chair, to be independent non-executives. Most seats are filled through networks and search firms. Seal what you are looking for: sector, time per month and experience. Boards and search firms see it without your name.',
    feiten: [['Independent NEDs on FTSE 350 boards (excluding chair)', 'at least half'], ['Typical time commitment', 'set out in the appointment letter']], feitenBron: 'ukcode',
    faq: [
      ['What is a non-executive director?', 'A board member who is not part of the management team. They oversee strategy, risk and the performance of the executives, and bring independent judgement.'],
      ['How do I get a non-executive director role?', 'Through your network, search firms and public appointments. Being discreetly findable for boards and search firms brings you into searches that are never advertised.'],
    ], bronnen: ['ukcode'], verwant: ['headhunter', 'outplacement'] },
];

// Hubs per taal en teksten van de interface
export const UI = {
  nl: { naam: 'Nederlands', hub: { title: 'Sealed Intent: je volgende stap, verzegeld tot jij hem opent', desc: 'Bedrijf verkopen, een bod checken of discreet een nieuwe topfunctie vinden. Leg je intentie verzegeld neer; alleen gecontroleerde partijen zien het, zonder naam.', h1: 'Je volgende stap, verzegeld tot jij hem opent.', lead: 'Wat je deelt telt. Wie je bent blijft stil.' },
    o: 'Voor ondernemers', e: 'Voor executives', bij: 'Bijgewerkt', bronnen: 'Bronnen', faq: 'Veelgestelde vragen', ook: 'Ook handig', hoe: 'Zo werkt het', stappen: ['Je ziet eerst wat het waard is of wat er speelt, zonder naam.', 'Je verzegelt je intentie met jouw voorwaarden.', 'Passende partijen reageren anoniem. Jij beslist wie je spreekt.'], gratis: 'Gratis voor jou. Je naam komt pas vrij als jij ja zegt.', feiten: 'In cijfers', bedrijf: 'Sealed Intent is een dienst van Adsfair B.V., Albert Plesmanplein 20, 2805 AB Gouda.' },
  de: { naam: 'Deutsch', hub: { title: 'Sealed Intent: Ihr nächster Schritt, versiegelt bis Sie ihn öffnen', desc: 'Firma verkaufen, ein Kaufangebot prüfen oder diskret eine neue Führungsposition finden. Ihre Absicht bleibt versiegelt; nur geprüfte Partner sehen sie, ohne Namen.', h1: 'Ihr nächster Schritt, versiegelt bis Sie ihn öffnen.', lead: 'Was Sie teilen, zählt. Wer Sie sind, bleibt verborgen.' },
    o: 'Für Unternehmer', e: 'Für Führungskräfte', bij: 'Aktualisiert', bronnen: 'Quellen', faq: 'Häufige Fragen', ook: 'Auch hilfreich', hoe: 'So funktioniert es', stappen: ['Sie sehen zuerst, was es wert ist oder was möglich ist, ohne Namen.', 'Sie versiegeln Ihre Absicht mit Ihren Bedingungen.', 'Passende Partner antworten anonym. Sie entscheiden, mit wem Sie sprechen.'], gratis: 'Für Sie kostenlos. Ihr Name wird erst freigegeben, wenn Sie zustimmen.', feiten: 'In Zahlen', bedrijf: 'Sealed Intent ist ein Dienst der Adsfair B.V., Albert Plesmanplein 20, 2805 AB Gouda, Niederlande.' },
  en: { naam: 'English', hub: { title: 'Sealed Intent: your next move, sealed until you open it', desc: 'Sell your business, check an offer or find your next executive role discreetly. Seal your intent; only verified parties see it, without your name.', h1: 'Your next move, sealed until you open it.', lead: 'Your intent is heard. Your name is not.' },
    o: 'For business owners', e: 'For executives', bij: 'Updated', bronnen: 'Sources', faq: 'Frequently asked questions', ook: 'Also useful', hoe: 'How it works', stappen: ['First you see what it is worth or what is possible, without your name.', 'You seal your intent with your terms.', 'Matching parties respond anonymously. You decide who to talk to.'], gratis: 'Free for you. Your name is released only when you say yes.', feiten: 'In figures', bedrijf: 'Sealed Intent is a service of Adsfair B.V., Albert Plesmanplein 20, 2805 AB Gouda, the Netherlands.' },
};
