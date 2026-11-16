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

// Wat de bezoeker denkt, bovenaan elke pagina (Henkjan 15 nov 2026: "moet veel duidelijker gaan over waar zij over nadenken. Bewegen maar
// niet kunnen, nu kan het wel. Weten wat ze waard zijn, hun voorwaarden gelden nu. Werking moet ook duidelijk zijn. Absoluut ANONIEM").
export const GEDACHTE = {
  waarde: {
    nl: 'Je denkt al een tijd over verkopen, maar je weet niet wat je bedrijf waard is. En vragen kan niet zonder dat iemand denkt dat je weg wilt. Nu weet je het, zonder dat iemand het merkt.',
    de: 'Sie denken schon länger an einen Verkauf, wissen aber nicht, was Ihr Unternehmen wert ist. Fragen geht nicht, ohne dass jemand denkt, Sie wollen raus. Jetzt wissen Sie es, ohne dass es jemand merkt.',
    en: 'You have been thinking about selling for a while, but you don\'t know what your business is worth. And you can\'t ask without someone thinking you want out. Now you can find out, and nobody notices.' },
  verkopen: {
    nl: 'Je wilt al een tijd verder, maar verkopen leek onmogelijk zonder dat personeel, klanten of concurrenten het merken. Nu kan het wel: niemand weet wie je bent, en jouw voorwaarden gelden.',
    de: 'Sie wollen schon länger weiter, aber ein Verkauf schien unmöglich, ohne dass Mitarbeiter, Kunden oder Wettbewerber es merken. Jetzt geht es: Niemand weiß, wer Sie sind, und Ihre Bedingungen gelten.',
    en: 'You have wanted to move on for a while, but selling seemed impossible without staff, customers or competitors finding out. Now it isn\'t: nobody knows who you are, and your terms apply.' },
  bod: {
    nl: 'Er ligt een bod en je twijfelt. Is het genoeg? Zou een ander meer bieden? Nu weet je het, zonder dat de bieder het merkt, en reageer je met jouw voorwaarden.',
    de: 'Es liegt ein Angebot vor und Sie zweifeln. Reicht es? Würde ein anderer mehr bieten? Jetzt wissen Sie es, ohne dass der Bieter es merkt, und antworten mit Ihren Bedingungen.',
    en: 'There is an offer on the table and you are not sure. Is it enough? Would someone else pay more? Now you can find out without the bidder noticing, and reply with your terms.' },
  outplacement: {
    nl: 'Je vertrek staat vast of komt eraan. Je wilt de beste begeleiding, maar de markt mag het nog niet weten. Nu komen bureaus naar jou, op jouw voorwaarden, zonder je naam.',
    de: 'Ihr Abschied steht fest oder zeichnet sich ab. Sie wollen die beste Begleitung, aber der Markt soll es noch nicht wissen. Jetzt kommen Anbieter zu Ihnen, zu Ihren Bedingungen, ohne Ihren Namen.',
    en: 'Your exit is agreed or on its way. You want the best support, but the market must not know yet. Now providers come to you, on your terms, without your name.' },
  opentowork: {
    nl: 'Je wilt weg, maar die groene rand ziet je werkgever ook. Nu vinden de juiste mensen jou, en ziet niemand anders het.',
    en: 'You want out, but your employer can see that green banner too. Now the right people find you, and nobody else sees it.' },
  headhunter: {
    nl: 'Je wilt bewegen, maar in jouw positie solliciteer je niet. Nu zien headhunters wat jij zoekt en wat je waard bent, niet wie je bent.',
    de: 'Sie wollen sich verändern, aber in Ihrer Position bewirbt man sich nicht. Jetzt sehen Headhunter, was Sie suchen und was Sie wert sind, nicht wer Sie sind.',
    en: 'You want to move, but in your position you don\'t apply for jobs. Now headhunters see what you want and what you are worth, not who you are.' },
  toezicht: {
    nl: 'Je wilt een rol als commissaris, maar je wilt er niet om vragen in je netwerk. Nu zien raden wat jij brengt, zonder je naam.',
    en: 'You want a board seat, but you don\'t want to ask your network for one. Now boards see what you bring, without your name.' },
};

// Absoluut anoniem: wat wij beloven en doen (zelfde punten op elke pagina; 'e' alleen bij executives)
export const ANONIEM = {
  nl: { kop: 'Absoluut anoniem', punten: ['Partijen zien nooit je naam, bedrijfsnaam, werkgever, plaats of precieze cijfers. Alleen sector, provincie, een bandbreedte en jouw voorwaarden.', 'Wij lezen elk profiel voordat iemand het ziet. Is het toch te herkennen, dan maken we het grover.', 'Je e-mailadres is alleen voor ons, om jou iets te vragen. Geen enkele partij krijgt het.', 'Wil een partij je spreken, dan vragen we het eerst aan jou. Pas na jouw ja krijgt alleen die partij je naam.', 'Intrekken kan altijd. Dan verwijderen we alles binnen 24 uur.'], e: 'Je werkgever en de partijen die jij uitsluit, zien je profiel nooit.' },
  de: { kop: 'Absolut anonym', punten: ['Partner sehen nie Ihren Namen, Firmennamen, Arbeitgeber, Ort oder genaue Zahlen. Nur Branche, Bundesland, eine Spanne und Ihre Bedingungen.', 'Wir lesen jedes Profil, bevor es jemand sieht. Ist es doch erkennbar, machen wir es gröber.', 'Ihre E-Mail-Adresse ist nur für uns, um Sie zu fragen. Kein Partner erhält sie.', 'Möchte ein Partner mit Ihnen sprechen, fragen wir zuerst Sie. Erst nach Ihrem Ja erhält nur dieser Partner Ihren Namen.', 'Zurückziehen geht jederzeit. Dann löschen wir alles innerhalb von 24 Stunden.'], e: 'Ihr Arbeitgeber und die Partner, die Sie ausschließen, sehen Ihr Profil nie.' },
  en: { kop: 'Absolutely anonymous', punten: ['Parties never see your name, company name, employer, location or exact figures. Only industry, region, a range and your terms.', 'We read every profile before anyone sees it. If it could still identify you, we make it broader.', 'Your email address is only for us, to ask you things. No party ever gets it.', 'If a party wants to talk to you, we ask you first. Only after your yes does that one party get your name.', 'You can withdraw at any time. We then delete everything within 24 hours.'], e: 'Your employer and the parties you exclude never see your profile.' },
};
// Zo werkt het, duidelijker (vervangt UI.stappen en UI.gratis)
Object.assign(UI.nl, { stappen: ['Je zegt wat je wilt en wat jouw voorwaarden zijn. Zonder naam, in 2 minuten.', 'Gecontroleerde partijen zien alleen een anoniem profiel. Wie wil, reageert met een voorstel binnen jouw voorwaarden.', 'Jij kiest met wie je praat. Pas als jij ja zegt, krijgt alleen die partij je naam.'], gratis: 'Gratis voor jou. Partijen betalen voor de introductie, niet jij.', partijLink: 'Voor kopers, investeerders en headhunters' });
Object.assign(UI.de, { stappen: ['Sie sagen, was Sie wollen und welche Bedingungen gelten. Ohne Namen, in 2 Minuten.', 'Geprüfte Partner sehen nur ein anonymes Profil. Wer will, antwortet mit einem Vorschlag innerhalb Ihrer Bedingungen.', 'Sie wählen, mit wem Sie sprechen. Erst nach Ihrem Ja erhält nur dieser Partner Ihren Namen.'], gratis: 'Für Sie kostenlos. Partner zahlen für die Vorstellung, nicht Sie.', partijLink: 'Für Käufer, Investoren und Headhunter' });
Object.assign(UI.en, { stappen: ['You say what you want and what your terms are. No name, two minutes.', 'Verified parties see only an anonymous profile. Those who want to, reply with a proposal within your terms.', 'You choose who to talk to. Only when you say yes does that one party get your name.'], gratis: 'Free for you. Parties pay for the introduction, not you.', partijLink: 'For buyers, investors and headhunters' });
UI.nl.hub.lead = 'Je wilt verder: verkopen, overstappen, een nieuwe rol. Maar niemand mag het nog weten. Nu kan het wel: zonder naam, op jouw voorwaarden.';
UI.de.hub.lead = 'Sie wollen weiter: verkaufen, wechseln, eine neue Rolle. Aber noch darf es niemand wissen. Jetzt geht es: ohne Namen, zu Ihren Bedingungen.';
UI.en.hub.lead = 'You want to move: sell, switch, take a new role. But nobody can know yet. Now you can: no name, on your terms.';

// De kant van de klant: partijen die toegang kopen (Henkjan 15 nov 2026: "Laat me ook de kant zien van onze klant. Die toegang gaan
// kopen. ... ze mogen niet zomaar iets zien. Wel Mega FOMO."). Staat op noindex tot Henkjan ja zegt (PARTIJ_INDEX in lib/sealed.js).
export const PARTIJ = {
  nl: { slug: 'partijen', title: 'Voor kopers, investeerders en headhunters: anonieme intenties van eigenaren en topmensen', desc: 'Eigenaren die willen verkopen en topmensen die willen overstappen, met hun voorwaarden. Jij ziet ze als eerste, anoniem. Toegang alleen na controle.',
    h1: 'Zie wie wil bewegen, voordat de markt het weet.', lead: 'Eigenaren die hun bedrijf willen verkopen en topmensen die willen overstappen, leggen hier hun intentie verzegeld neer, met hun voorwaarden. Jij ziet ze als eerste. Hun naam komt pas vrij als zij ja zeggen tegen jou.',
    voor: [['Kopers en investeerders', 'Bedrijven die nog nergens te koop staan, met de voorwaarden van de eigenaar erbij.'], ['M&A-adviseurs', 'Eigenaren die nog geen adviseur hebben en al weten wat ze willen.'], ['Headhunters en raden', 'Bestuurders en commissarissen die willen bewegen, met rol, sector en pakket.'], ['Outplacementbureaus', 'Topmensen bij wie het vertrek vaststaat, met budget en wensen.']],
    welKop: 'Wat je ziet', wel: ['Sector en provincie', 'Omvang in een bandbreedte: winst of pakket', 'Wanneer: nu, binnen een jaar of over 1 tot 3 jaar', 'Hun voorwaarden: wat ze minimaal op de verkoopdag willen, wat er met het personeel gebeurt, hun rol daarna', 'Bij topmensen: rol, sector, pakket en wie het niet mag zien'],
    nooitKop: 'Wat je nooit ziet', nooit: ['Naam', 'Bedrijfsnaam of werkgever', 'Plaats', 'Precieze cijfers', 'E-mailadres'],
    regelsKop: 'Spelregels', regels: ['Toegang alleen na controle: wij controleren je bedrijf in het handelsregister en wie je bent, en je tekent onze geheimhoudingsafspraak.', 'Alleen je eigen terrein: je ziet profielen in de sectoren en regio\'s waarvoor je bent toegelaten, nooit de hele lijst.', 'Eerst hun voorwaarden: reageren kan pas als je de voorwaarden van de eigenaar of bestuurder accepteert.', 'Per profiel hooguit 5 partijen. Wie eerst is, is eerst.', 'Wie probeert te achterhalen wie erachter zit, verliest zijn toegang voorgoed.'],
    waaromKop: 'Waarom nu', waarom: [['Kleine ondernemers die binnen 5 jaar willen verkopen of overdragen', '35%', 'kbi'], ['Verkopers die verkopen om hun leeftijd, zonder opvolger', '41%', 'barometer'], ['Verkopen die 6 tot 12 maanden duren: wie eerst praat, heeft de beste kaarten', '49%', 'barometer'], ['Benaderde executives die ja zeiden tegen een gesprek', '52%', 'wharton']],
    plek: 'Plekken zijn beperkt. Per sector en regio laten we maar een paar partijen toe, op volgorde van aanvraag.',
    voorbeeldKop: 'Zo ziet een profiel eruit', voorbeeldNoot: 'Voorbeeld, geen echt profiel.', voorbeeld: [['Sector', 'Installatietechniek'], ['Regio', 'Noord-Brabant'], ['Winst per jaar', '€ 1 – 2,5 mln'], ['Wanneer', 'Binnen een jaar'], ['Minimaal op de verkoopdag', '70%'], ['Personeel', 'Iedereen blijft in dienst'], ['Rol daarna', 'Hooguit een jaar']], verzegeld: 'Naam, bedrijf en plaats: verzegeld',
    prijsKop: 'Wat het kost', prijs: 'Je betaalt per introductie, en alleen als de eigenaar of bestuurder ja zegt tegen jou. Zegt hij nee, dan betaal je niets.',
    form: { kop: 'Vraag toegang aan', soort: 'Wat voor partij ben je?', soortO: ['Koper of investeerder', 'M&A-adviseur', 'Headhunter', 'Outplacementbureau', 'Raad van bestuur of commissarissen'], bedrijf: 'Bedrijfsnaam', site: 'Website', sector: 'Sectoren', sectorO: ['Software en IT', 'Zakelijke dienstverlening', 'Industrie', 'Bouw en installatie', 'Zorg', 'Handel', 'Transport', 'Horeca', 'Executives'], regio: 'Landen', regioO: ['Nederland', 'België', 'Duitsland', 'Oostenrijk', 'Zwitserland', 'Verenigd Koninkrijk', 'Verenigde Staten'], mail: 'Zakelijk e-mailadres', knop: 'Vraag toegang aan', klaar: 'Aanvraag ontvangen.', klaarTxt: 'We controleren je bedrijf en laten binnen 2 werkdagen weten of er plek is.', fout: 'Dat lukte niet. Probeer het zo nog eens.', mailFout: 'Vul een geldig e-mailadres in.', bedrijfFout: 'Vul je bedrijfsnaam in.' } },
  de: { slug: 'partner', title: 'Für Käufer, Investoren und Headhunter: anonyme Absichten von Inhabern und Führungskräften', desc: 'Inhaber, die verkaufen wollen, und Führungskräfte, die wechseln wollen, mit ihren Bedingungen. Sie sehen sie zuerst, anonym. Zugang nur nach Prüfung.',
    h1: 'Sehen Sie, wer sich bewegen will, bevor es der Markt weiß.', lead: 'Inhaber, die ihr Unternehmen verkaufen wollen, und Führungskräfte, die wechseln wollen, hinterlegen hier ihre Absicht versiegelt, mit ihren Bedingungen. Sie sehen sie zuerst. Der Name wird erst frei, wenn sie Ja zu Ihnen sagen.',
    voor: [['Käufer und Investoren', 'Unternehmen, die nirgends zum Verkauf stehen, mit den Bedingungen des Inhabers.'], ['M&A-Berater', 'Inhaber ohne Berater, die schon wissen, was sie wollen.'], ['Headhunter und Aufsichtsräte', 'Geschäftsführer und Aufsichtsräte, die wechseln wollen, mit Rolle, Branche und Gehalt.'], ['Outplacement-Anbieter', 'Führungskräfte, deren Abschied feststeht, mit Budget und Wünschen.']],
    welKop: 'Was Sie sehen', wel: ['Branche und Bundesland', 'Größe als Spanne: EBITDA oder Gehalt', 'Wann: jetzt, innerhalb eines Jahres oder in 1 bis 3 Jahren', 'Ihre Bedingungen: Mindestanteil am Verkaufstag, Mitarbeiter, Rolle danach', 'Bei Führungskräften: Rolle, Branche, Gehalt und wer es nicht sehen darf'],
    nooitKop: 'Was Sie nie sehen', nooit: ['Name', 'Firmenname oder Arbeitgeber', 'Ort', 'Genaue Zahlen', 'E-Mail-Adresse'],
    regelsKop: 'Spielregeln', regels: ['Zugang nur nach Prüfung: Wir prüfen Ihr Unternehmen im Handelsregister und wer Sie sind, und Sie unterschreiben unsere Vertraulichkeitsvereinbarung.', 'Nur Ihr Gebiet: Sie sehen Profile in den Branchen und Regionen, für die Sie zugelassen sind, nie die ganze Liste.', 'Erst ihre Bedingungen: Antworten können Sie erst, wenn Sie die Bedingungen akzeptieren.', 'Pro Profil höchstens 5 Partner. Wer zuerst kommt, ist zuerst dran.', 'Wer versucht herauszufinden, wer dahintersteht, verliert den Zugang für immer.'],
    waaromKop: 'Warum jetzt', waarom: [['Inhaber, die bis Ende 2029 eine Nachfolge suchen', '545.000', 'kfw'], ['Inhaber 55 Jahre und älter', '57 %', 'kfw'], ['Führungspositionen, die nie öffentlich werden', 'über 90 %', 'hyper'], ['Führungskräfte, die diskret angesprochen werden wollen', '78 %', 'hyper']],
    plek: 'Die Plätze sind begrenzt. Pro Branche und Region lassen wir nur wenige Partner zu, in der Reihenfolge der Anfragen.',
    voorbeeldKop: 'So sieht ein Profil aus', voorbeeldNoot: 'Beispiel, kein echtes Profil.', voorbeeld: [['Branche', 'Maschinen- und Anlagenbau'], ['Region', 'Baden-Württemberg'], ['EBITDA pro Jahr', '1 – 2,5 Mio. €'], ['Wann', 'Innerhalb eines Jahres'], ['Mindestens am Verkaufstag', '70 %'], ['Mitarbeiter', 'Alle bleiben'], ['Rolle danach', 'Höchstens ein Jahr']], verzegeld: 'Name, Firma und Ort: versiegelt',
    prijsKop: 'Was es kostet', prijs: 'Sie zahlen pro Vorstellung, und nur wenn der Inhaber oder die Führungskraft Ja zu Ihnen sagt. Bei Nein zahlen Sie nichts.',
    form: { kop: 'Zugang anfragen', soort: 'Welche Art Partner sind Sie?', soortO: ['Käufer oder Investor', 'M&A-Berater', 'Headhunter', 'Outplacement-Anbieter', 'Vorstand oder Aufsichtsrat'], bedrijf: 'Firmenname', site: 'Website', sector: 'Branchen', sectorO: ['Software und IT', 'Dienstleistungen', 'Industrie', 'Bau', 'Gesundheit', 'Handel', 'Logistik', 'Gastgewerbe', 'Führungskräfte'], regio: 'Länder', regioO: ['Deutschland', 'Österreich', 'Schweiz', 'Niederlande', 'Belgien', 'Vereinigtes Königreich', 'USA'], mail: 'Geschäftliche E-Mail-Adresse', knop: 'Zugang anfragen', klaar: 'Anfrage erhalten.', klaarTxt: 'Wir prüfen Ihr Unternehmen und melden uns innerhalb von 2 Werktagen, ob ein Platz frei ist.', fout: 'Das hat nicht geklappt. Bitte gleich noch einmal.', mailFout: 'Bitte eine gültige E-Mail-Adresse eingeben.', bedrijfFout: 'Bitte den Firmennamen eingeben.' } },
  en: { slug: 'partners', title: 'For buyers, investors and headhunters: anonymous intents from owners and executives', desc: 'Owners who want to sell and executives who want to move, with their terms. You see them first, anonymously. Access only after verification.',
    h1: 'See who wants to move, before the market knows.', lead: 'Owners who want to sell their business and executives who want to move seal their intent here, with their terms. You see them first. Their name is released only when they say yes to you.',
    voor: [['Buyers and investors', 'Businesses that are not listed anywhere, with the owner\'s terms attached.'], ['M&A advisors', 'Owners without an advisor who already know what they want.'], ['Headhunters and boards', 'Executives and directors who want to move, with role, industry and package.'], ['Outplacement providers', 'Executives whose exit is agreed, with budget and wishes.']],
    welKop: 'What you see', wel: ['Industry and region', 'Size as a range: cash flow or package', 'When: now, within a year or in 1 to 3 years', 'Their terms: cash at closing, staff, their role afterwards', 'For executives: role, industry, package and who must not see it'],
    nooitKop: 'What you never see', nooit: ['Name', 'Company name or employer', 'Location', 'Exact figures', 'Email address'],
    regelsKop: 'Rules', regels: ['Access only after verification: we check your company in the official register and who you are, and you sign our confidentiality agreement.', 'Only your own territory: you see profiles in the industries and regions you are admitted to, never the full list.', 'Their terms first: you can only respond once you accept the owner\'s or executive\'s terms.', 'At most 5 parties per profile. First come, first served.', 'Anyone who tries to find out who is behind a profile loses access for good.'],
    waaromKop: 'Why now', waarom: [['Owners planning to transition within 10 years', '75%', 'epi'], ['Owners with a formal exit plan', '13%', 'epi'], ['Executive roles never advertised', 'over 90%', 'hyper'], ['Executives contacted who agreed to become candidates', '52%', 'wharton']],
    plek: 'Places are limited. Per industry and region we admit only a few parties, in order of application.',
    voorbeeldKop: 'What a profile looks like', voorbeeldNoot: 'Example, not a real profile.', voorbeeld: [['Industry', 'HVAC services'], ['Region', 'Midwest'], ['Annual cash flow', '$500,000 – 1M'], ['When', 'Within a year'], ['Cash at closing, at least', '70%'], ['Staff', 'Everyone stays'], ['Role afterwards', 'Up to a year']], verzegeld: 'Name, company and location: sealed',
    prijsKop: 'What it costs', prijs: 'You pay per introduction, and only when the owner or executive says yes to you. If they say no, you pay nothing.',
    form: { kop: 'Apply for access', soort: 'What kind of party are you?', soortO: ['Buyer or investor', 'M&A advisor', 'Headhunter', 'Outplacement provider', 'Board'], bedrijf: 'Company name', site: 'Website', sector: 'Industries', sectorO: ['Software and IT', 'Business services', 'Industrial', 'Construction and trades', 'Healthcare', 'Retail and wholesale', 'Logistics', 'Hospitality', 'Executives'], regio: 'Countries', regioO: ['United States', 'United Kingdom', 'Netherlands', 'Belgium', 'Germany', 'Austria', 'Switzerland'], mail: 'Work email address', knop: 'Apply for access', klaar: 'Application received.', klaarTxt: 'We will verify your company and let you know within 2 business days whether there is a place.', fout: 'That did not work. Please try again in a moment.', mailFout: 'Please enter a valid email address.', bedrijfFout: 'Please enter your company name.' } },
};
