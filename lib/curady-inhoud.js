// Inhoud van Curady (curady.com): keuzehulpen in NL, DE en EN. Onderwerpen en zoektermen uit Demand Radar, thema wellness
// (https://demandradar-ivory.vercel.app/api/zoekvraag?thema=wellness, opgebouwd 19 nov 2026, NL BE DE, Google-volume per maand):
// DE gartensauna 110.000, whirlpool outdoor 40.500, fasssauna 22.200 (kaufen 6.600), massagesessel 27.100, infrarotkabine 18.100,
// saunaofen mit holz 5.400, eisbad 2.900; NL jacuzzi 33.100, opblaasbare jacuzzi 22.200, hottub 9.900, massagestoel 8.100,
// infraroodsauna 5.400, sauna aanbieding 4.400, ijsbad 4.400 (kopen 1.600); BE jacuzzi 22.200, jacuzzi kopen 3.600, hottub kopen 1.900.
// Regel: alleen algemene, controleerbare kennis; geen prijzen of levertijden zolang er geen leverancier vastligt (Henkjan 19 nov:
// "eerst tractie zien"). Elke keuzehulp eindigt bij Curady als leverancier: de uitkomst vult de offerteaanvraag in.
// Per keuzehulp: vragen (opties met een zin voor het advies en een korte spec voor de offerte), delen (kopje, tekst) en faq.

export const TALEN = ['en', 'nl', 'de'];
export const UI = {
  en: { taal: 'English', home: 'Saunas, hot tubs and massage chairs, chosen with care', homeDesc: 'Free buying guides with a short quiz for outdoor saunas, hot tubs, massage chairs, infrared saunas and ice baths. Get a personal quote, delivered to your home in Europe.', homeH1: 'Wellness at home, chosen with care', homeLede: 'Answer three questions, get honest advice on what fits your home and garden, and ask Curady for a quote with the price delivered to your door. No obligation.', kies: 'Choose in three questions', uitkomst: 'Our advice for you', vraagPrijs: 'Ask Curady for this price', opnieuw: 'Change answers', gids: 'Buying guide', vragen: 'Questions', offerte: 'Ask for a quote', offerteTekst: 'Tell us what you are looking for. We come back with a matching model from our suppliers, the price delivered to your door and the delivery time. No obligation.', product: 'Product', wens: 'What do you need?', wensPh: 'For example: sauna for 4 people, wood heater', budget: 'Budget', wanneer: 'When', land: 'Country', naam: 'Name', email: 'Email', privacy: 'We only use your details to answer this request.', stuur: 'Send my request', wa: 'or WhatsApp us', dank: 'Thank you. We will reply by email within one working day.', fout: 'Please check your email address.', nietZeker: 'Not sure yet', budgetOpt: ['Under 3,000 euro', '3,000 to 6,000 euro', '6,000 to 10,000 euro', 'Over 10,000 euro'], wanneerOpt: ['As soon as possible', 'Within 3 months', 'This year', 'Just looking'], landPh: 'Netherlands', voet: 'Curady is part of Kadoly, run by AdsFair B.V., Albert Plesmanplein 20, 2805 AB Gouda, the Netherlands.', bij: 'Updated', waTekst: 'Hi Curady, I have a question about ', alle: 'All guides', waarom: 'Why Curady', waaromL: ['Honest advice first: we also tell you when a cheaper option suits you better.', 'One contact for the whole order: choice, delivery and questions afterwards.', 'Delivered to your home anywhere in the Netherlands, Belgium and Germany.'] },
  nl: { taal: 'Nederlands', home: 'Sauna, hottub en massagestoel kopen met eerlijk advies', homeDesc: 'Gratis keuzehulpen voor buitensauna, hottub, massagestoel, infraroodsauna en ijsbad. Drie vragen, eerlijk advies en een offerte met de prijs tot aan je deur.', homeH1: 'Wellness thuis, met zorg gekozen', homeLede: 'Beantwoord drie vragen, krijg eerlijk advies over wat bij je huis en tuin past, en vraag Curady een offerte met de prijs tot aan je deur. Vrijblijvend.', kies: 'Kies in drie vragen', uitkomst: 'Ons advies voor jou', vraagPrijs: 'Vraag Curady deze prijs', opnieuw: 'Antwoorden wijzigen', gids: 'Keuzehulp', vragen: 'Vragen', offerte: 'Vraag een offerte', offerteTekst: 'Vertel wat je zoekt. Wij komen terug met een passend model van onze leveranciers, de prijs tot aan je deur en de levertijd. Vrijblijvend.', product: 'Product', wens: 'Wat zoek je?', wensPh: 'Bijvoorbeeld: sauna voor 4 personen, houtkachel', budget: 'Budget', wanneer: 'Wanneer', land: 'Land', naam: 'Naam', email: 'E-mail', privacy: 'We gebruiken je gegevens alleen voor deze aanvraag.', stuur: 'Verstuur mijn aanvraag', wa: 'of app ons', dank: 'Dank je. We mailen je binnen één werkdag terug.', fout: 'Kijk je e-mailadres even na.', nietZeker: 'Weet ik nog niet', budgetOpt: ['Onder 3.000 euro', '3.000 tot 6.000 euro', '6.000 tot 10.000 euro', 'Meer dan 10.000 euro'], wanneerOpt: ['Zo snel mogelijk', 'Binnen 3 maanden', 'Dit jaar', 'Ik kijk rond'], landPh: 'Nederland', voet: 'Curady hoort bij Kadoly, van AdsFair B.V., Albert Plesmanplein 20, 2805 AB Gouda.', bij: 'Bijgewerkt', waTekst: 'Hoi Curady, ik heb een vraag over ', alle: 'Alle keuzehulpen', waarom: 'Waarom Curady', waaromL: ['Eerst eerlijk advies: we zeggen het ook als iets goedkopers beter bij je past.', 'Eén aanspreekpunt voor de hele bestelling: keuze, levering en vragen achteraf.', 'Thuisbezorgd in heel Nederland, België en Duitsland.'] },
  de: { taal: 'Deutsch', home: 'Sauna, Whirlpool und Massagesessel kaufen, ehrlich beraten', homeDesc: 'Kostenlose Kaufberater für Gartensauna, Whirlpool outdoor, Massagesessel, Infrarotkabine und Eisbad. Drei Fragen, ehrliche Beratung und ein Angebot mit Lieferung bis vor die Tür.', homeH1: 'Wellness zu Hause, mit Sorgfalt gewählt', homeLede: 'Beantworte drei Fragen, bekomme eine ehrliche Empfehlung für Haus und Garten und frag bei Curady ein Angebot mit Preis inklusive Lieferung an. Unverbindlich.', kies: 'In drei Fragen zur Wahl', uitkomst: 'Unsere Empfehlung für dich', vraagPrijs: 'Preis bei Curady anfragen', opnieuw: 'Antworten ändern', gids: 'Kaufberater', vragen: 'Fragen', offerte: 'Angebot anfragen', offerteTekst: 'Sag uns, was du suchst. Wir melden uns mit einem passenden Modell unserer Lieferanten, dem Preis inklusive Lieferung und der Lieferzeit. Unverbindlich.', product: 'Produkt', wens: 'Was suchst du?', wensPh: 'Zum Beispiel: Sauna für 4 Personen, Holzofen', budget: 'Budget', wanneer: 'Wann', land: 'Land', naam: 'Name', email: 'E-Mail', privacy: 'Wir nutzen deine Daten nur für diese Anfrage.', stuur: 'Anfrage senden', wa: 'oder per WhatsApp', dank: 'Danke. Wir antworten innerhalb eines Werktags per E-Mail.', fout: 'Bitte prüfe deine E-Mail-Adresse.', nietZeker: 'Noch unklar', budgetOpt: ['Unter 3.000 Euro', '3.000 bis 6.000 Euro', '6.000 bis 10.000 Euro', 'Über 10.000 Euro'], wanneerOpt: ['So schnell wie möglich', 'In 3 Monaten', 'Dieses Jahr', 'Ich schaue mich um'], landPh: 'Deutschland', voet: 'Curady gehört zu Kadoly, betrieben von AdsFair B.V., Albert Plesmanplein 20, 2805 AB Gouda, Niederlande.', bij: 'Aktualisiert', waTekst: 'Hallo Curady, ich habe eine Frage zu ', alle: 'Alle Kaufberater', waarom: 'Warum Curady', waaromL: ['Erst ehrliche Beratung: Wir sagen es auch, wenn etwas Günstigeres besser passt.', 'Ein Ansprechpartner für die ganze Bestellung: Auswahl, Lieferung und Fragen danach.', 'Lieferung nach Hause in ganz Deutschland, den Niederlanden und Belgien.'] },
};

// slug per taal; id is de vaste sleutel (offerte, tellers)
export const ONDERWERPEN = [
  {
    id: 'sauna', slug: { en: 'barrel-saunas', nl: 'buitensauna', de: 'gartensauna' },
    t: {
      en: {
        kort: 'Outdoor saunas', titel: 'Outdoor and barrel sauna buying guide: size, heater and wood',
        desc: 'Choose an outdoor barrel sauna in three questions: how many people, wood or electric heater, with or without a changing room. Honest advice and a quote delivered to your garden.',
        lede: 'For most gardens a barrel sauna for 4 people with a wood heater is the best start: it heats fast, needs no power cable and fits a normal back garden. Pick an electric heater if you want to switch on and go, and a longer barrel with a changing room if you use it in winter.',
        vragen: [
          { v: 'How many people at the same time?', o: [['2-4', '2 to 4 people', 'A barrel of about 2 to 2.4 metres is enough and warms up quickly.', '2 to 4 people'], ['4-6', '4 to 6 people', 'Take a barrel of about 3 metres, with benches on both sides.', '4 to 6 people'], ['6+', '6 or more', 'Go for the longest barrel of about 4 metres; it needs a strong heater.', '6 or more people']] },
          { v: 'Which heater?', o: [['hout', 'Wood', 'A wood heater needs no power cable and gives the classic soft heat; plan a chimney and dry firewood.', 'wood heater'], ['elek', 'Electric', 'An electric heater is the easiest to use; ask an electrician about the connection before you order.', 'electric heater'], ['?', 'Not sure', 'Not sure about the heater? We send you both options with the price.', 'heater: advise me']] },
          { v: 'Changing room?', o: [['ja', 'Yes', 'A changing room keeps your clothes dry and the heat inside; very welcome in winter.', 'with changing room'], ['nee', 'No', 'Without a changing room the barrel stays shorter and sits closer to the house.', 'no changing room']] },
        ],
        delen: [
          ['Wood: spruce, thermowood or cedar', 'Spruce is the common and affordable choice and lasts well with a good roof. Thermowood is heat-treated so it takes up less water and moves less outside. Cedar resists rot best and smells strongest. The roof cover matters as much as the wood.'],
          ['Base and permit', 'A barrel rests on cradles and needs a flat, firm base: paving slabs, a concrete strip or a solid deck. Check the local rules for a garden building and for a wood stove close to neighbours.'],
          ['Delivery and assembly', 'A barrel comes as a kit or fully built. A kit goes through a garden gate and two handy people build it in a day or two. A fully built barrel needs a truck with a crane and clear access. We tell you upfront which one you get.'],
        ],
        faq: [['How hot does a barrel sauna get?', 'A traditional Finnish sauna runs at about 70 to 90 degrees Celsius. A well-sized heater reaches that comfortably.'], ['Can a barrel sauna stand outside all year?', 'Yes. Give it a roof cover, keep it off wet ground on its cradles and let it dry with the door open after use.'], ['Wood or electric, which is cheaper to run?', 'That depends on your price for power and for firewood. Electric is easier every day; wood needs no connection at all.']],
      },
      nl: {
        kort: 'Buitensauna', titel: 'Buitensauna of barrelsauna kopen: keuzehulp voor maat, kachel en hout',
        desc: 'Kies je buitensauna in drie vragen: hoeveel personen, houtkachel of elektrisch, met of zonder kleedruimte. Eerlijk advies en een offerte tot in je tuin.',
        lede: 'Voor de meeste tuinen is een barrelsauna voor 4 personen met houtkachel de beste start: snel warm, geen stroomkabel nodig en hij past in een gewone achtertuin. Kies elektrisch als je wilt aanzetten en gaan, en een langere barrel met kleedruimte als je hem ook in de winter veel gebruikt.',
        vragen: [
          { v: 'Met hoeveel personen tegelijk?', o: [['2-4', '2 tot 4', 'Een barrel van ongeveer 2 tot 2,4 meter is genoeg en is snel warm.', '2 tot 4 personen'], ['4-6', '4 tot 6', 'Neem een barrel van ongeveer 3 meter, met banken aan twee kanten.', '4 tot 6 personen'], ['6+', '6 of meer', 'Kies de langste barrel van ongeveer 4 meter; die vraagt een stevige kachel.', '6 of meer personen']] },
          { v: 'Welke kachel?', o: [['hout', 'Hout', 'Een houtkachel heeft geen stroom nodig en geeft de klassieke zachte warmte; reken op een schoorsteen en droog hout.', 'houtkachel'], ['elek', 'Elektrisch', 'Een elektrische kachel is het makkelijkst; vraag een installateur vooraf naar de aansluiting in je meterkast.', 'elektrische kachel'], ['?', 'Weet ik niet', 'Twijfel je over de kachel? We sturen je beide opties met de prijs.', 'kachel: graag advies']] },
          { v: 'Met kleedruimte?', o: [['ja', 'Ja', 'Een kleedruimte houdt je kleren droog en de warmte binnen; in de winter heel fijn.', 'met kleedruimte'], ['nee', 'Nee', 'Zonder kleedruimte blijft de barrel korter en past hij dichter bij huis.', 'zonder kleedruimte']] },
        ],
        delen: [
          ['Hout: vuren, thermowood of ceder', 'Vuren is de gangbare en betaalbare keuze en gaat met een goed dak lang mee. Thermowood is hout dat met hitte is behandeld: het neemt minder water op en werkt minder buiten. Ceder is het best bestand tegen rot en ruikt het sterkst. Het dak telt even zwaar als het hout.'],
          ['Ondergrond en vergunning', 'Een barrel ligt op twee of drie dragers en wil een vlakke, stevige ondergrond: tegels, een betonstrook of een vlonder die niet beweegt. Een sauna in de achtertuin is vaak vergunningvrij, maar check het altijd in het Omgevingsloket, zeker met een houtkachel dicht bij de buren.'],
          ['Levering en opbouw', 'Een barrel komt als bouwpakket of in één stuk. Een bouwpakket past door een tuinpoort en twee handige mensen zetten hem in een of twee dagen in elkaar. In één stuk is er een vrachtwagen met kraan en vrije toegang nodig. We zeggen vooraf wat je krijgt.'],
        ],
        faq: [['Hoe warm wordt een barrelsauna?', 'Een klassieke Finse sauna draait op ongeveer 70 tot 90 graden. Een goed passende kachel haalt dat ruim.'], ['Mag een barrelsauna het hele jaar buiten staan?', 'Ja, daar is hij voor gemaakt. Met een dak, op de dragers van de natte grond, en na gebruik met de deur open laten drogen.'], ['Hout of elektrisch, wat is goedkoper in gebruik?', 'Dat hangt af van wat jij betaalt voor stroom en voor hout. Elektrisch is dagelijks makkelijker; hout heeft geen aansluiting nodig.']],
      },
      de: {
        kort: 'Gartensauna', titel: 'Gartensauna und Fasssauna kaufen: Kaufberater für Größe, Ofen und Holz',
        desc: 'Finde deine Gartensauna in drei Fragen: wie viele Personen, Holzofen oder elektrisch, mit oder ohne Vorraum. Ehrliche Beratung und ein Angebot bis in deinen Garten.',
        lede: 'Für die meisten Gärten ist eine Fasssauna für 4 Personen mit Holzofen der beste Einstieg: schnell warm, kein Stromanschluss nötig und sie passt in einen normalen Garten. Wähle einen Elektroofen, wenn du einschalten und los willst, und ein längeres Fass mit Vorraum, wenn du sie auch im Winter viel nutzt.',
        vragen: [
          { v: 'Wie viele Personen gleichzeitig?', o: [['2-4', '2 bis 4', 'Ein Fass von etwa 2 bis 2,4 Metern reicht und ist schnell warm.', '2 bis 4 Personen'], ['4-6', '4 bis 6', 'Nimm ein Fass von etwa 3 Metern mit Bänken auf beiden Seiten.', '4 bis 6 Personen'], ['6+', '6 oder mehr', 'Wähle das längste Fass von etwa 4 Metern; es braucht einen kräftigen Ofen.', '6 oder mehr Personen']] },
          { v: 'Welcher Ofen?', o: [['hout', 'Holz', 'Ein Holzofen braucht keinen Strom und gibt die klassische weiche Wärme; plane einen Schornstein und trockenes Holz ein.', 'Holzofen'], ['elek', 'Elektrisch', 'Ein Elektroofen ist am einfachsten; lass vorher einen Elektriker den Anschluss prüfen.', 'Elektroofen'], ['?', 'Weiß nicht', 'Unsicher beim Ofen? Wir schicken dir beide Varianten mit Preis.', 'Ofen: bitte beraten']] },
          { v: 'Mit Vorraum?', o: [['ja', 'Ja', 'Ein Vorraum hält die Kleidung trocken und die Wärme drinnen; im Winter sehr angenehm.', 'mit Vorraum'], ['nee', 'Nein', 'Ohne Vorraum bleibt das Fass kürzer und passt näher ans Haus.', 'ohne Vorraum']] },
        ],
        delen: [
          ['Holz: Fichte, Thermoholz oder Zeder', 'Fichte ist die übliche und günstige Wahl und hält mit einem guten Dach lange. Thermoholz ist hitzebehandelt, nimmt weniger Wasser auf und arbeitet draußen weniger. Zeder ist am besten gegen Fäulnis geschützt und duftet am stärksten. Das Dach zählt genauso viel wie das Holz.'],
          ['Untergrund und Genehmigung', 'Ein Fass liegt auf Auflagern und braucht einen ebenen, festen Untergrund: Gehwegplatten, einen Betonstreifen oder ein stabiles Deck. Ob eine Gartensauna genehmigungsfrei ist, hängt vom Bundesland ab; frag beim Bauamt nach. Für einen Holzofen berät dich der Schornsteinfeger.'],
          ['Lieferung und Aufbau', 'Ein Fass kommt als Bausatz oder fertig montiert. Ein Bausatz passt durch ein Gartentor, zwei geschickte Leute bauen ihn in ein bis zwei Tagen auf. Fertig montiert braucht es einen Lkw mit Kran und freie Zufahrt. Wir sagen dir vorher, was du bekommst.'],
        ],
        faq: [['Wie heiß wird eine Fasssauna?', 'Eine klassische finnische Sauna läuft bei etwa 70 bis 90 Grad. Ein passender Ofen schafft das gut.'], ['Kann eine Fasssauna das ganze Jahr draußen stehen?', 'Ja, dafür ist sie gemacht. Mit Dach, auf den Auflagern über dem nassen Boden und nach der Nutzung mit offener Tür trocknen lassen.'], ['Holz oder Strom, was ist günstiger im Betrieb?', 'Das hängt von deinen Preisen für Strom und Holz ab. Strom ist im Alltag einfacher; Holz braucht gar keinen Anschluss.']],
      },
    },
  },
  {
    id: 'hottub', slug: { en: 'hot-tubs', nl: 'hottub', de: 'whirlpool-outdoor' },
    t: {
      en: {
        kort: 'Hot tubs', titel: 'Hot tub buying guide: inflatable, wood-fired or acrylic spa',
        desc: 'Choose a hot tub in three questions: how often you use it, wood or electric heating, and how many people. Honest advice, including when an inflatable tub is enough.',
        lede: 'Use it a few times a summer? An inflatable hot tub is enough and we will tell you so. For use all year, choose a wood-fired tub if there is no power in the garden, or an insulated acrylic spa if you want warm water at any moment.',
        vragen: [
          { v: 'How often will you use it?', o: [['af-en-toe', 'Now and then', 'For a few times a summer an inflatable tub from a large store is the cheapest choice; Curady does not sell those.', 'occasional use'], ['vaak', 'Every week', 'Weekly use asks for a solid tub that lasts: wood-fired or an acrylic spa.', 'weekly use'], ['jaar', 'All year', 'For all year use, insulation and a good lid make the biggest difference in cost and comfort.', 'all year use']] },
          { v: 'Heating?', o: [['hout', 'Wood', 'A wood-fired tub needs no power for heating and fits anywhere in the garden.', 'wood-fired'], ['elek', 'Electric', 'An electric spa keeps the water warm all the time; it needs its own power group, so ask an electrician.', 'electric spa'], ['?', 'Not sure', 'We send you both with the price and the running costs to compare.', 'heating: advise me']] },
          { v: 'How many people?', o: [['2-4', '2 to 4', 'A compact tub for up to 4 heats faster and uses less wood or power.', '2 to 4 people'], ['5+', '5 or more', 'A larger tub holds more water: plan a strong base and more heating time.', '5 or more people']] },
        ],
        delen: [
          ['Inflatable, wood-fired or acrylic', 'An inflatable tub is cheap and easy to store, but loses heat fast and lasts a few seasons. A wood-fired tub heats with a stove, with the stove inside or next to the tub. An acrylic spa is insulated, keeps its temperature with a heater and a pump, and offers jets.'],
          ['Base and power', 'A full tub is very heavy, so it needs a flat, firm base. Wood-fired tubs only need power for extras such as a filter or lights. An electric spa needs a dedicated connection from your meter box.'],
          ['Clean water', 'A filter and a lid keep the water clean longer and cut heating time. Without a filter you change the water more often.'],
        ],
        faq: [['Is an inflatable hot tub worth it?', 'For occasional summer use, yes. For weekly or all year use a solid, insulated tub is cheaper in the long run and much more comfortable.'], ['Do I need electricity for a wood-fired hot tub?', 'Not for heating. Only extras such as a filter pump, bubbles or lights need power.'], ['Can I use a hot tub in winter?', 'Yes. Keep it heated or drain it in frost, so water cannot freeze in the pipes.']],
      },
      nl: {
        kort: 'Hottub en jacuzzi', titel: 'Hottub of jacuzzi kopen: opblaasbaar, houtgestookt of vaste spa?',
        desc: 'Kies je hottub of buitenjacuzzi in drie vragen: hoe vaak, hout of stroom, hoeveel personen. Eerlijk advies, ook als een opblaasbare jacuzzi genoeg is.',
        lede: 'Gebruik je hem een paar keer per zomer? Dan is een opblaasbare jacuzzi genoeg, en dat zeggen we ook. Voor het hele jaar kies je een houtgestookte hottub als er geen stroom in de tuin is, of een geïsoleerde acryl spa als je op elk moment warm water wilt.',
        vragen: [
          { v: 'Hoe vaak ga je erin?', o: [['af-en-toe', 'Af en toe', 'Voor een paar keer per zomer is een opblaasbare jacuzzi van een grote winkel het goedkoopst; die verkoopt Curady niet.', 'af en toe'], ['vaak', 'Elke week', 'Wekelijks gebruik vraagt een stevige bak die lang meegaat: houtgestookt of een acryl spa.', 'wekelijks'], ['jaar', 'Het hele jaar', 'Voor het hele jaar maken isolatie en een goede deksel het grootste verschil in kosten en comfort.', 'het hele jaar']] },
          { v: 'Verwarmen met?', o: [['hout', 'Hout', 'Een houtgestookte hottub heeft geen stroom nodig om te verwarmen en past overal in de tuin.', 'houtgestookt'], ['elek', 'Stroom', 'Een elektrische spa houdt het water steeds warm; hij vraagt een eigen groep in de meterkast, vraag een installateur.', 'elektrische spa'], ['?', 'Weet ik niet', 'We sturen je beide met de prijs en de gebruikskosten naast elkaar.', 'verwarming: graag advies']] },
          { v: 'Met hoeveel personen?', o: [['2-4', '2 tot 4', 'Een compacte bak tot 4 personen is sneller warm en gebruikt minder hout of stroom.', '2 tot 4 personen'], ['5+', '5 of meer', 'Een grotere bak houdt meer water: reken op een stevige ondergrond en een langere opwarmtijd.', '5 of meer personen']] },
        ],
        delen: [
          ['Opblaasbaar, houtgestookt of acryl', 'Een opblaasbare jacuzzi is goedkoop en makkelijk op te bergen, maar verliest snel warmte en gaat een paar seizoenen mee. Een houtgestookte hottub warmt op met een kachel, in of naast de bak. Een acryl spa is geïsoleerd, houdt zijn temperatuur met een verwarming en pomp, en heeft massagestralen.'],
          ['Ondergrond en stroom', 'Een volle bak is erg zwaar en wil een vlakke, stevige ondergrond. Een houtgestookte hottub heeft alleen stroom nodig voor extra\'s zoals een filter of verlichting. Een elektrische spa vraagt een eigen aansluiting vanuit de meterkast.'],
          ['Schoon water', 'Een filter en een deksel houden het water langer schoon en korten de opwarmtijd. Zonder filter ververs je het water vaker.'],
        ],
        faq: [['Is een opblaasbare jacuzzi het waard?', 'Voor af en toe in de zomer wel. Voor wekelijks of het hele jaar is een stevige, geïsoleerde hottub op termijn goedkoper en veel prettiger.'], ['Heb ik stroom nodig voor een houtgestookte hottub?', 'Niet om te verwarmen. Alleen extra\'s zoals een filterpomp, bubbels of licht hebben stroom nodig.'], ['Kan ik een hottub in de winter gebruiken?', 'Ja. Houd hem bij vorst warm of laat hem leeg, zodat er geen water in de leidingen bevriest.']],
      },
      de: {
        kort: 'Whirlpool outdoor', titel: 'Whirlpool outdoor und Hot Tub kaufen: aufblasbar, Holz oder Acryl?',
        desc: 'Finde deinen Outdoor-Whirlpool in drei Fragen: wie oft, Holz oder Strom, wie viele Personen. Ehrliche Beratung, auch wenn ein aufblasbarer Whirlpool reicht.',
        lede: 'Nur ein paar Mal im Sommer? Dann reicht ein aufblasbarer Whirlpool, und das sagen wir auch. Für das ganze Jahr wählst du einen holzbeheizten Hot Tub, wenn im Garten kein Strom liegt, oder einen isolierten Acryl-Whirlpool, wenn das Wasser jederzeit warm sein soll.',
        vragen: [
          { v: 'Wie oft nutzt du ihn?', o: [['af-en-toe', 'Ab und zu', 'Für ein paar Mal im Sommer ist ein aufblasbarer Whirlpool aus dem Baumarkt am günstigsten; den verkauft Curady nicht.', 'gelegentlich'], ['vaak', 'Jede Woche', 'Wöchentliche Nutzung braucht eine solide Wanne, die lange hält: holzbeheizt oder Acryl.', 'wöchentlich'], ['jaar', 'Das ganze Jahr', 'Für das ganze Jahr machen Dämmung und eine gute Abdeckung den größten Unterschied bei Kosten und Komfort.', 'ganzjährig']] },
          { v: 'Heizen mit?', o: [['hout', 'Holz', 'Ein holzbeheizter Hot Tub braucht zum Heizen keinen Strom und passt überall in den Garten.', 'holzbeheizt'], ['elek', 'Strom', 'Ein elektrischer Whirlpool hält das Wasser ständig warm; er braucht einen eigenen Stromkreis, frag einen Elektriker.', 'elektrisch'], ['?', 'Weiß nicht', 'Wir schicken dir beide mit Preis und Betriebskosten zum Vergleich.', 'Heizung: bitte beraten']] },
          { v: 'Wie viele Personen?', o: [['2-4', '2 bis 4', 'Eine kompakte Wanne bis 4 Personen ist schneller warm und braucht weniger Holz oder Strom.', '2 bis 4 Personen'], ['5+', '5 oder mehr', 'Eine größere Wanne fasst mehr Wasser: plane einen stabilen Untergrund und mehr Heizzeit ein.', '5 oder mehr Personen']] },
        ],
        delen: [
          ['Aufblasbar, Holz oder Acryl', 'Ein aufblasbarer Whirlpool ist günstig und leicht zu verstauen, verliert aber schnell Wärme und hält ein paar Saisons. Ein Hot Tub mit Holzofen heizt mit einem Ofen in oder neben der Wanne. Ein Acryl-Whirlpool ist isoliert, hält seine Temperatur mit Heizung und Pumpe und hat Massagedüsen.'],
          ['Untergrund und Strom', 'Eine volle Wanne ist sehr schwer und braucht einen ebenen, festen Untergrund. Ein holzbeheizter Hot Tub braucht Strom nur für Extras wie Filter oder Licht. Ein elektrischer Whirlpool braucht einen eigenen Anschluss aus dem Sicherungskasten.'],
          ['Sauberes Wasser', 'Ein Filter und eine Abdeckung halten das Wasser länger sauber und verkürzen die Heizzeit. Ohne Filter wechselst du das Wasser öfter.'],
        ],
        faq: [['Lohnt sich ein aufblasbarer Whirlpool?', 'Für gelegentliche Nutzung im Sommer ja. Für jede Woche oder das ganze Jahr ist ein stabiler, isolierter Hot Tub auf Dauer günstiger und viel angenehmer.'], ['Braucht ein Hot Tub mit Holzofen Strom?', 'Nicht zum Heizen. Nur Extras wie Filterpumpe, Sprudel oder Licht brauchen Strom.'], ['Kann ich einen Whirlpool im Winter nutzen?', 'Ja. Halte ihn bei Frost warm oder lass ihn leer, damit kein Wasser in den Leitungen gefriert.']],
      },
    },
  },
  {
    id: 'massage', slug: { en: 'massage-chairs', nl: 'massagestoel', de: 'massagesessel' },
    t: {
      en: {
        kort: 'Massage chairs', titel: 'Massage chair buying guide: S, L or SL track and the right fit',
        desc: 'Choose a massage chair in three questions: where it hurts, your height and the space in your room. Honest advice on tracks, zero gravity and service.',
        lede: 'Choose the track first: an SL track for the whole back from neck to glutes, an S track if you only want neck and shoulders. Then check the chair fits your height and the room it reclines in. Programmes and colours come last.',
        vragen: [
          { v: 'Where do you want the most relief?', o: [['nek', 'Neck and shoulders', 'An S or SL track reaches your neck and shoulders well.', 'neck and shoulders'], ['rug', 'Lower back and hips', 'Take an L or SL track: it runs on under the seat to the glutes.', 'lower back and hips'], ['alles', 'The whole body', 'Choose an SL track with airbags for arms, legs and feet.', 'whole body, airbags']] },
          { v: 'Your height?', o: [['klein', 'Under 1.65 m', 'Check the lower end of the height range; many chairs suit 1.55 m and up.', 'height under 1.65 m'], ['midden', '1.65 to 1.85 m', 'Most chairs fit you; pick on track and features.', 'height 1.65 to 1.85 m'], ['groot', 'Over 1.85 m', 'Look for a long track and an adjustable leg rest.', 'height over 1.85 m']] },
          { v: 'Space in the room?', o: [['krap', 'Tight', 'Pick a space-saving chair that slides forward and stands close to the wall.', 'space-saving'], ['ruim', 'Enough room', 'You can choose any chair; keep space behind it to recline fully.', 'enough room']] },
        ],
        delen: [
          ['The track: S, L or SL', 'An S track follows the curve of your spine from neck to lower back. An L track goes on under the seat to the glutes and thighs. An SL track does both and follows your back most closely.'],
          ['Zero gravity, airbags and heat', 'Zero gravity tilts you back with your knees above your heart and takes weight off your spine. Airbags squeeze arms, legs and feet. Heat in the back or calves loosens muscles. These matter more than a long list of programmes.'],
          ['Delivery and service', 'A massage chair is large and heavy: measure your door and the spot before you order. Ask who repairs it at home and how long the warranty runs; we tell you before you buy.'],
        ],
        faq: [['What is the difference between an L and an SL track?', 'An L track runs from the neck down under the seat. An SL track adds the S curve along your spine, so it follows your back more closely.'], ['How much space does a massage chair need?', 'Check the size when fully reclined plus the space behind it. Space-saving models slide forward instead of tilting back.'], ['Who should not use a massage chair?', 'Ask your doctor first if you are pregnant, have a pacemaker, recent surgery, a blood clot or a serious back problem.']],
      },
      nl: {
        kort: 'Massagestoel', titel: 'Massagestoel kopen: keuzehulp voor S-, L- of SL-rail en de juiste maat',
        desc: 'Kies je massagestoel in drie vragen: waar het zeer doet, je lengte en de ruimte in je kamer. Eerlijk advies over rails, zero gravity en service.',
        lede: 'Kies eerst de rail: een SL-rail voor de hele rug van nek tot billen, een S-rail als je vooral nek en schouders wilt. Kijk dan of de stoel past bij je lengte en de kamer waarin hij achterover gaat. Programma\'s en kleuren komen het laatst.',
        vragen: [
          { v: 'Waar wil je de meeste verlichting?', o: [['nek', 'Nek en schouders', 'Een S- of SL-rail komt goed bij nek en schouders.', 'nek en schouders'], ['rug', 'Onderrug en heupen', 'Neem een L- of SL-rail: die loopt door onder de zitting tot aan de billen.', 'onderrug en heupen'], ['alles', 'Het hele lichaam', 'Kies een SL-rail met luchtkussens voor armen, benen en voeten.', 'hele lichaam, luchtkussens']] },
          { v: 'Hoe lang ben je?', o: [['klein', 'Onder 1,65 m', 'Let op de ondergrens van de lengte; veel stoelen passen vanaf 1,55 m.', 'lengte onder 1,65 m'], ['midden', '1,65 tot 1,85 m', 'De meeste stoelen passen je; kies op rail en functies.', 'lengte 1,65 tot 1,85 m'], ['groot', 'Boven 1,85 m', 'Zoek een lange rail en een verstelbare beensteun.', 'lengte boven 1,85 m']] },
          { v: 'Ruimte in de kamer?', o: [['krap', 'Krap', 'Kies een ruimtebesparende stoel die naar voren schuift en dicht bij de muur staat.', 'ruimtebesparend'], ['ruim', 'Ruim genoeg', 'Elke stoel kan; houd ruimte achter de stoel om helemaal achterover te gaan.', 'ruimte genoeg']] },
        ],
        delen: [
          ['De rail: S, L of SL', 'Een S-rail volgt de bocht van je ruggengraat van nek tot onderrug. Een L-rail loopt door onder de zitting tot je billen en bovenbenen. Een SL-rail doet allebei en volgt je rug het nauwst.'],
          ['Zero gravity, luchtkussens en warmte', 'Zero gravity kantelt je achterover met je knieën boven je hart en haalt druk van je rug. Luchtkussens masseren armen, benen en voeten. Warmte in rug of kuiten maakt spieren los. Dat telt meer dan een lange lijst programma\'s.'],
          ['Levering en service', 'Een massagestoel is groot en zwaar: meet je deur en de plek voor je bestelt. Vraag wie hem thuis repareert en hoe lang de garantie loopt; dat zeggen we je voor je koopt.'],
        ],
        faq: [['Wat is het verschil tussen een L- en een SL-rail?', 'Een L-rail loopt van de nek omlaag tot onder de zitting. Een SL-rail heeft daarbij de S-bocht langs je ruggengraat, dus hij volgt je rug nauwer.'], ['Hoeveel ruimte heeft een massagestoel nodig?', 'Kijk naar de maat in de stand helemaal achterover plus de ruimte erachter. Ruimtebesparende stoelen schuiven naar voren in plaats van te kantelen.'], ['Wie kan beter geen massagestoel gebruiken?', 'Vraag eerst je arts als je zwanger bent, een pacemaker hebt, net geopereerd bent, een trombose hebt of een ernstig rugprobleem.']],
      },
      de: {
        kort: 'Massagesessel', titel: 'Massagesessel kaufen: Kaufberater für S-, L- oder SL-Schiene und die richtige Größe',
        desc: 'Finde deinen Massagesessel in drei Fragen: wo es zieht, deine Größe und der Platz im Raum. Ehrliche Beratung zu Schienen, Zero Gravity und Service.',
        lede: 'Wähle zuerst die Schiene: eine SL-Schiene für den ganzen Rücken vom Nacken bis zum Gesäß, eine S-Schiene, wenn es dir vor allem um Nacken und Schultern geht. Prüfe dann, ob der Sessel zu deiner Größe und zum Raum passt, in dem er sich zurücklehnt. Programme und Farben kommen zuletzt.',
        vragen: [
          { v: 'Wo brauchst du am meisten Entlastung?', o: [['nek', 'Nacken und Schultern', 'Eine S- oder SL-Schiene erreicht Nacken und Schultern gut.', 'Nacken und Schultern'], ['rug', 'Unterer Rücken und Hüfte', 'Nimm eine L- oder SL-Schiene: Sie läuft unter der Sitzfläche bis zum Gesäß weiter.', 'unterer Rücken und Hüfte'], ['alles', 'Ganzer Körper', 'Wähle eine SL-Schiene mit Luftkissen für Arme, Beine und Füße.', 'ganzer Körper, Luftkissen']] },
          { v: 'Deine Größe?', o: [['klein', 'Unter 1,65 m', 'Achte auf die untere Grenze; viele Sessel passen ab 1,55 m.', 'Größe unter 1,65 m'], ['midden', '1,65 bis 1,85 m', 'Die meisten Sessel passen; wähle nach Schiene und Funktionen.', 'Größe 1,65 bis 1,85 m'], ['groot', 'Über 1,85 m', 'Such eine lange Schiene und eine verstellbare Beinauflage.', 'Größe über 1,85 m']] },
          { v: 'Platz im Raum?', o: [['krap', 'Eng', 'Wähle einen platzsparenden Sessel, der nach vorn gleitet und nah an der Wand steht.', 'platzsparend'], ['ruim', 'Genug Platz', 'Jeder Sessel geht; lass hinten Platz zum vollen Zurücklehnen.', 'genug Platz']] },
        ],
        delen: [
          ['Die Schiene: S, L oder SL', 'Eine S-Schiene folgt der Kurve der Wirbelsäule vom Nacken bis zum unteren Rücken. Eine L-Schiene läuft unter der Sitzfläche bis zum Gesäß und den Oberschenkeln weiter. Eine SL-Schiene kann beides und folgt dem Rücken am engsten.'],
          ['Zero Gravity, Luftkissen und Wärme', 'Zero Gravity kippt dich zurück, mit den Knien über dem Herzen, und entlastet die Wirbelsäule. Luftkissen massieren Arme, Beine und Füße. Wärme im Rücken oder an den Waden lockert die Muskeln. Das zählt mehr als eine lange Liste an Programmen.'],
          ['Lieferung und Service', 'Ein Massagesessel ist groß und schwer: Miss Tür und Stellplatz, bevor du bestellst. Frag, wer ihn zu Hause repariert und wie lange die Garantie läuft; das sagen wir dir vor dem Kauf.'],
        ],
        faq: [['Was ist der Unterschied zwischen L- und SL-Schiene?', 'Eine L-Schiene läuft vom Nacken bis unter die Sitzfläche. Eine SL-Schiene hat zusätzlich die S-Kurve entlang der Wirbelsäule und folgt dem Rücken genauer.'], ['Wie viel Platz braucht ein Massagesessel?', 'Schau auf die Maße in voller Liegeposition plus den Platz dahinter. Platzsparende Modelle gleiten nach vorn statt zu kippen.'], ['Wer sollte keinen Massagesessel nutzen?', 'Frag zuerst deinen Arzt, wenn du schwanger bist, einen Herzschrittmacher hast, frisch operiert bist, eine Thrombose oder ein ernstes Rückenproblem hast.']],
      },
    },
  },
  {
    id: 'infrarood', slug: { en: 'infrared-saunas', nl: 'infraroodsauna', de: 'infrarotkabine' },
    t: {
      en: {
        kort: 'Infrared saunas', titel: 'Infrared sauna buying guide: cabin size, heaters and where it fits',
        desc: 'Choose an infrared sauna in three questions: indoor or outdoor, how many people and the heat you like. Honest advice on full spectrum, power and space.',
        lede: 'An infrared cabin warms your body directly at a lower air temperature than a classic sauna, so it is ready fast and fits indoors. For one or two people a small cabin is often enough; pick a hybrid if you also want the classic sauna heat.',
        vragen: [
          { v: 'Where will it stand?', o: [['binnen', 'Indoors', 'Indoors a small cabin fits a spare room or attic; check the floor and a nearby socket.', 'indoors'], ['buiten', 'Outdoors', 'Outdoors you need a cabin made for weather, with a roof and a solid base.', 'outdoors']] },
          { v: 'How many people?', o: [['1-2', '1 or 2', 'A one or two person cabin is compact and quick to warm up.', '1 to 2 people'], ['3+', '3 or more', 'Take a larger cabin with heaters on more sides so everyone feels the warmth.', '3 or more people']] },
          { v: 'Which heat do you like?', o: [['zacht', 'Mild warmth', 'Pure infrared gives a mild air temperature and deep warmth.', 'infrared only'], ['beide', 'Also classic sauna', 'A hybrid cabin combines infrared with a classic sauna heater.', 'hybrid infrared and sauna']] },
        ],
        delen: [
          ['Infrared or classic sauna', 'A classic sauna heats the air to about 70 to 90 degrees. Infrared heats your body directly while the air stays much cooler, which many people find easier to sit in for longer.'],
          ['Heaters and spectrum', 'Carbon heaters spread the heat over a large surface. Full spectrum heaters combine several wavelengths. More heaters on the back, sides and legs give an even warmth.'],
          ['Power and space', 'Many small cabins run on a normal socket; larger cabins and hybrids may need their own power group. Measure the room height and the door before you order.'],
        ],
        faq: [['How warm does an infrared sauna get?', 'The air usually stays well below a classic sauna, often somewhere between about 40 and 60 degrees, while the heaters warm your body directly.'], ['Can I put an infrared sauna in my bedroom?', 'Often yes, if there is room, a solid floor and a suitable socket nearby.'], ['Is infrared a real sauna?', 'It feels different: less hot air, more direct warmth. A hybrid cabin gives you both.']],
      },
      nl: {
        kort: 'Infraroodsauna', titel: 'Infraroodsauna kopen: keuzehulp voor maat, stralers en plek',
        desc: 'Kies je infraroodsauna of infraroodcabine in drie vragen: binnen of buiten, hoeveel personen en welke warmte. Eerlijk advies over full spectrum, stroom en ruimte.',
        lede: 'Een infraroodcabine verwarmt je lichaam direct bij een lagere luchttemperatuur dan een klassieke sauna. Hij is daardoor snel klaar en past binnen. Voor een of twee personen is een kleine cabine vaak genoeg; kies een combicabine als je ook de klassieke saunawarmte wilt.',
        vragen: [
          { v: 'Waar komt hij te staan?', o: [['binnen', 'Binnen', 'Binnen past een kleine cabine op een logeerkamer of zolder; let op de vloer en een stopcontact in de buurt.', 'binnen'], ['buiten', 'Buiten', 'Buiten heb je een cabine nodig die tegen weer kan, met dak en stevige ondergrond.', 'buiten']] },
          { v: 'Voor hoeveel personen?', o: [['1-2', '1 of 2', 'Een cabine voor een of twee personen is compact en snel warm.', '1 tot 2 personen'], ['3+', '3 of meer', 'Neem een grotere cabine met stralers aan meer kanten, zodat iedereen de warmte voelt.', '3 of meer personen']] },
          { v: 'Welke warmte vind je fijn?', o: [['zacht', 'Milde warmte', 'Alleen infrarood geeft een milde luchttemperatuur en diepe warmte.', 'alleen infrarood'], ['beide', 'Ook klassieke sauna', 'Een combicabine combineert infrarood met een gewone saunakachel.', 'combi infrarood en sauna']] },
        ],
        delen: [
          ['Infrarood of klassieke sauna', 'Een klassieke sauna verwarmt de lucht tot ongeveer 70 tot 90 graden. Infrarood verwarmt je lichaam direct terwijl de lucht veel koeler blijft; veel mensen houden het daardoor langer vol.'],
          ['Stralers en spectrum', 'Carbonstralers verdelen de warmte over een groot oppervlak. Full spectrum stralers combineren meerdere golflengtes. Meer stralers op rug, zijkanten en benen geven een gelijkmatige warmte.'],
          ['Stroom en ruimte', 'Veel kleine cabines werken op een gewoon stopcontact; grotere cabines en combicabines kunnen een eigen groep nodig hebben. Meet de hoogte van de kamer en de deur voor je bestelt.'],
        ],
        faq: [['Hoe warm wordt een infraroodsauna?', 'De lucht blijft meestal flink onder een klassieke sauna, vaak ergens rond de 40 tot 60 graden, terwijl de stralers je lichaam direct verwarmen.'], ['Kan een infraroodsauna in de slaapkamer?', 'Vaak wel, als er ruimte is, een stevige vloer en een geschikt stopcontact in de buurt.'], ['Is infrarood een echte sauna?', 'Het voelt anders: minder hete lucht, meer directe warmte. Een combicabine geeft je allebei.']],
      },
      de: {
        kort: 'Infrarotkabine', titel: 'Infrarotkabine kaufen: Kaufberater für Größe, Strahler und Stellplatz',
        desc: 'Finde deine Infrarotkabine oder Infrarotsauna in drei Fragen: drinnen oder draußen, wie viele Personen und welche Wärme. Ehrliche Beratung zu Vollspektrum, Strom und Platz.',
        lede: 'Eine Infrarotkabine wärmt deinen Körper direkt bei niedrigerer Lufttemperatur als eine klassische Sauna. Sie ist deshalb schnell bereit und passt in die Wohnung. Für ein oder zwei Personen reicht oft eine kleine Kabine; wähle eine Kombikabine, wenn du auch die klassische Saunawärme willst.',
        vragen: [
          { v: 'Wo soll sie stehen?', o: [['binnen', 'Drinnen', 'Drinnen passt eine kleine Kabine ins Gästezimmer oder unters Dach; achte auf den Boden und eine Steckdose in der Nähe.', 'drinnen'], ['buiten', 'Draußen', 'Draußen brauchst du eine wetterfeste Kabine mit Dach und festem Untergrund.', 'draußen']] },
          { v: 'Für wie viele Personen?', o: [['1-2', '1 oder 2', 'Eine Kabine für ein oder zwei Personen ist kompakt und schnell warm.', '1 bis 2 Personen'], ['3+', '3 oder mehr', 'Nimm eine größere Kabine mit Strahlern auf mehreren Seiten, damit alle die Wärme spüren.', '3 oder mehr Personen']] },
          { v: 'Welche Wärme magst du?', o: [['zacht', 'Milde Wärme', 'Reines Infrarot gibt eine milde Lufttemperatur und tiefe Wärme.', 'nur Infrarot'], ['beide', 'Auch klassische Sauna', 'Eine Kombikabine verbindet Infrarot mit einem normalen Saunaofen.', 'Kombi Infrarot und Sauna']] },
        ],
        delen: [
          ['Infrarot oder klassische Sauna', 'Eine klassische Sauna heizt die Luft auf etwa 70 bis 90 Grad. Infrarot wärmt den Körper direkt, während die Luft deutlich kühler bleibt; viele halten es so länger aus.'],
          ['Strahler und Spektrum', 'Carbonstrahler verteilen die Wärme über eine große Fläche. Vollspektrumstrahler kombinieren mehrere Wellenlängen. Mehr Strahler an Rücken, Seiten und Beinen geben eine gleichmäßige Wärme.'],
          ['Strom und Platz', 'Viele kleine Kabinen laufen an einer normalen Steckdose; größere Kabinen und Kombikabinen brauchen oft einen eigenen Stromkreis. Miss Raumhöhe und Tür, bevor du bestellst.'],
        ],
        faq: [['Wie warm wird eine Infrarotkabine?', 'Die Luft bleibt meist deutlich unter einer klassischen Sauna, oft etwa zwischen 40 und 60 Grad, während die Strahler den Körper direkt wärmen.'], ['Kann eine Infrarotkabine ins Schlafzimmer?', 'Oft ja, wenn Platz da ist, der Boden fest ist und eine passende Steckdose in der Nähe liegt.'], ['Ist Infrarot eine echte Sauna?', 'Es fühlt sich anders an: weniger heiße Luft, mehr direkte Wärme. Eine Kombikabine bietet beides.']],
      },
    },
  },
  {
    id: 'ijsbad', slug: { en: 'ice-baths', nl: 'ijsbad', de: 'eisbad' },
    t: {
      en: {
        kort: 'Ice baths', titel: 'Ice bath buying guide: tub, chiller or ice, and where it stands',
        desc: 'Choose an ice bath or cold plunge in three questions: how cold, how often and where. Honest advice on a chiller versus bags of ice, and on safety.',
        lede: 'Cold plunge a few times a week? A tub with a chiller is the easy way: the water stays cold and clean without buying ice. For now and then, an insulated tub with ice from the freezer is enough.',
        vragen: [
          { v: 'How often?', o: [['af-en-toe', 'Now and then', 'An insulated tub with ice is enough for occasional use.', 'occasional'], ['vaak', 'Several times a week', 'With a chiller the water stays at the temperature you set, without buying ice.', 'several times a week, chiller']] },
          { v: 'Where will it stand?', o: [['buiten', 'Garden or terrace', 'Outdoors, choose a tub with a lid that can stand in sun and frost.', 'outdoors'], ['binnen', 'Indoors or bathroom', 'Indoors a compact tub with a drain close by works best.', 'indoors']] },
          { v: 'Next to a sauna?', o: [['ja', 'Yes', 'Next to a sauna or hot tub you get the classic hot and cold routine.', 'next to sauna'], ['nee', 'No', 'On its own it is a quick morning routine.', 'stand-alone']] },
        ],
        delen: [
          ['Chiller or ice', 'A chiller cools and filters the water and keeps it at your temperature. Ice is cheap to start with but you buy or freeze it every time.'],
          ['Tub and lid', 'An insulated tub with a lid keeps the water cold longer and clean. Check that you can get in and out safely.'],
          ['Start safely', 'Start with water that is not too cold and short sessions of one to three minutes, never alone at first. Ask your doctor first if you have heart or blood pressure problems.'],
        ],
        faq: [['How cold should an ice bath be?', 'Beginners often start around 10 to 15 degrees for one to three minutes, and go colder step by step.'], ['Do I need a chiller?', 'Not for occasional use. For several times a week a chiller saves buying ice and keeps the water clean.'], ['Is an ice bath safe for everyone?', 'No. With heart problems, high blood pressure or pregnancy, ask your doctor first.']],
      },
      nl: {
        kort: 'IJsbad', titel: 'IJsbad kopen: keuzehulp voor bak, koeler of ijs, en de plek',
        desc: 'Kies je ijsbad of cold plunge in drie vragen: hoe vaak, waar en naast een sauna of niet. Eerlijk advies over een koeler tegen zakken ijs, en over veilig beginnen.',
        lede: 'Een paar keer per week een koude duik? Een bak met koeler is het makkelijkst: het water blijft koud en schoon zonder ijs te kopen. Voor af en toe is een geïsoleerde bak met ijs uit de vriezer genoeg.',
        vragen: [
          { v: 'Hoe vaak?', o: [['af-en-toe', 'Af en toe', 'Voor af en toe is een geïsoleerde bak met ijs genoeg.', 'af en toe'], ['vaak', 'Een paar keer per week', 'Met een koeler blijft het water op de temperatuur die jij instelt, zonder ijs te kopen.', 'een paar keer per week, koeler']] },
          { v: 'Waar komt hij te staan?', o: [['buiten', 'Tuin of terras', 'Buiten kies je een bak met deksel die tegen zon en vorst kan.', 'buiten'], ['binnen', 'Binnen of badkamer', 'Binnen werkt een compacte bak met een afvoer dichtbij het best.', 'binnen']] },
          { v: 'Naast een sauna?', o: [['ja', 'Ja', 'Naast een sauna of hottub krijg je het klassieke warm-koud ritueel.', 'naast sauna'], ['nee', 'Nee', 'Los is het een snelle ochtendroutine.', 'los']] },
        ],
        delen: [
          ['Koeler of ijs', 'Een koeler koelt en filtert het water en houdt het op jouw temperatuur. IJs is goedkoop om mee te beginnen, maar je koopt of vriest het elke keer opnieuw.'],
          ['Bak en deksel', 'Een geïsoleerde bak met deksel houdt het water langer koud en schoon. Let erop dat je er veilig in en uit kunt.'],
          ['Veilig beginnen', 'Begin met water dat niet te koud is en korte sessies van een tot drie minuten, en eerst nooit alleen. Vraag eerst je arts als je hart- of bloeddrukklachten hebt.'],
        ],
        faq: [['Hoe koud moet een ijsbad zijn?', 'Beginners starten vaak rond de 10 tot 15 graden voor een tot drie minuten, en gaan stap voor stap kouder.'], ['Heb ik een koeler nodig?', 'Niet voor af en toe. Voor een paar keer per week scheelt een koeler ijs kopen en blijft het water schoon.'], ['Is een ijsbad voor iedereen veilig?', 'Nee. Met hartklachten, hoge bloeddruk of als je zwanger bent: vraag eerst je arts.']],
      },
      de: {
        kort: 'Eisbad', titel: 'Eisbad kaufen: Kaufberater für Wanne, Kühler oder Eis und Stellplatz',
        desc: 'Finde dein Eisbad oder Cold Plunge in drei Fragen: wie oft, wo und ob neben der Sauna. Ehrliche Beratung zu Kühler gegen Eiswürfel und zum sicheren Einstieg.',
        lede: 'Ein paar Mal pro Woche kalt baden? Eine Wanne mit Kühler ist am einfachsten: Das Wasser bleibt kalt und sauber, ohne Eis zu kaufen. Für ab und zu reicht eine isolierte Wanne mit Eis aus dem Gefrierfach.',
        vragen: [
          { v: 'Wie oft?', o: [['af-en-toe', 'Ab und zu', 'Für gelegentliche Nutzung reicht eine isolierte Wanne mit Eis.', 'gelegentlich'], ['vaak', 'Mehrmals pro Woche', 'Mit einem Kühler bleibt das Wasser auf deiner Temperatur, ohne Eis zu kaufen.', 'mehrmals pro Woche, Kühler']] },
          { v: 'Wo soll es stehen?', o: [['buiten', 'Garten oder Terrasse', 'Draußen wählst du eine Wanne mit Deckel, die Sonne und Frost verträgt.', 'draußen'], ['binnen', 'Drinnen oder Bad', 'Drinnen funktioniert eine kompakte Wanne mit Abfluss in der Nähe am besten.', 'drinnen']] },
          { v: 'Neben einer Sauna?', o: [['ja', 'Ja', 'Neben Sauna oder Hot Tub bekommst du das klassische Heiß-kalt-Ritual.', 'neben der Sauna'], ['nee', 'Nein', 'Allein ist es eine schnelle Morgenroutine.', 'einzeln']] },
        ],
        delen: [
          ['Kühler oder Eis', 'Ein Kühler kühlt und filtert das Wasser und hält es auf deiner Temperatur. Eis ist zum Einstieg günstig, aber du kaufst oder gefrierst es jedes Mal neu.'],
          ['Wanne und Deckel', 'Eine isolierte Wanne mit Deckel hält das Wasser länger kalt und sauber. Achte darauf, dass du sicher ein- und aussteigen kannst.'],
          ['Sicher anfangen', 'Fang mit nicht zu kaltem Wasser und kurzen Einheiten von ein bis drei Minuten an, am Anfang nie allein. Frag zuerst deinen Arzt, wenn du Herz- oder Blutdruckprobleme hast.'],
        ],
        faq: [['Wie kalt sollte ein Eisbad sein?', 'Einsteiger beginnen oft bei etwa 10 bis 15 Grad für ein bis drei Minuten und gehen Schritt für Schritt kälter.'], ['Brauche ich einen Kühler?', 'Für gelegentliche Nutzung nicht. Für mehrmals pro Woche spart ein Kühler das Eis und hält das Wasser sauber.'], ['Ist ein Eisbad für alle sicher?', 'Nein. Bei Herzproblemen, Bluthochdruck oder in der Schwangerschaft frag zuerst deinen Arzt.']],
      },
    },
  },
  {
    id: 'kamado', slug: { en: 'kamado-grills' }, alleen: ['en'],
    t: {
      en: {
        kort: 'Kamado grills', titel: 'Kamado grill buying guide: size, ceramic and what comes with it',
        desc: 'Choose a kamado grill in three questions: how many people, how you cook and where it stands. Honest advice on size, ceramic and the accessories you will use.',
        lede: 'A kamado is a thick ceramic grill that holds heat for hours on little charcoal: one grill for steaks, slow-cooked brisket and pizza. Choose the size for your usual group, then a stand or table, and a heat deflector for slow cooking.',
        vragen: [
          { v: 'For how many people?', o: [['2-4', '2 to 4', 'A medium kamado is plenty and heats up quickly.', '2 to 4 people'], ['5+', '5 or more', 'A large or XL kamado gives room for two zones.', '5 or more people']] },
          { v: 'How do you cook?', o: [['grill', 'Mostly grilling', 'Grill grates and a good thermometer are what you use most.', 'grilling'], ['laag', 'Slow and low too', 'Take a heat deflector so the kamado works as an oven and smoker.', 'slow cooking, heat deflector']] },
          { v: 'Where will it stand?', o: [['wielen', 'Moves around', 'A stand on wheels lets you move a heavy kamado.', 'stand on wheels'], ['vast', 'Fixed spot', 'A table with a work surface looks finished on a terrace.', 'table']] },
        ],
        delen: [
          ['Size', 'Kamados are sized by the diameter of the grate. A larger kamado uses more charcoal and takes longer to heat, but gives room for two zones.'],
          ['Ceramic and build', 'Thick, well-fired ceramic holds heat and does not crack easily. Look at the hinge, the gasket and the vents: those are what you touch every time.'],
          ['Accessories', 'A heat deflector, a pizza stone, a second grate level and a good thermometer are what most people use. Buy a full set if it is a gift.'],
        ],
        faq: [['What can you cook on a kamado?', 'Grilling, smoking, roasting and baking: from steaks and vegetables to pulled pork, bread and pizza.'], ['Does a kamado use a lot of charcoal?', 'No. The ceramic holds the heat, so it runs long on a small amount of lump charcoal.'], ['Can a kamado stay outside?', 'Yes, with a cover. Keep it dry inside and protect it from frost when it is wet.']],
      },
    },
  },
];
export const OUD = { 'wood-fired-hot-tubs': 'hot-tubs' }; // eerdere adressen (19 nov) -> nieuw
export const vindOnderwerp = (taal, slug) => ONDERWERPEN.find(o => o.slug[taal] === slug);
export const talenVan = o => (o.alleen || TALEN).filter(t => o.slug[t]);
export const pad = (taal, slug) => (taal === 'en' ? '' : '/' + taal) + (slug ? '/' + slug : (taal === 'en' ? '/' : ''));
