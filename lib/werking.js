// Werking van het hele systeem (Henkjan 19 okt 2026: "Zorg dat op vercel een handover doc staat met complete status en dat dat
// handover doc altijd wordt bijgewerkt bestaat uit complete werking en status"). Dit is het deel 'werking' van de centrale
// overdracht (lib/handover.js). Projecten met een eigen repo sturen hun eigen werking en stand mee (POST /api/mm/handoverzet);
// dit bestand beschrijft wat ertussen zit. Regel (CLAUDE.md): wie verandert hoe iets werkt, werkt in dezelfde commit dit bestand
// of de werking van dat project bij. Geen sleutels.
export const WERKING_DATUM = '2026-10-19';

export const WERKING = [
  '### Projecten',
  '- MyLevel (mylevel.today, repo mylevel): oefentests, eerst gratis, eenmalig betalen via Paddle. Testproject. Stuurt zijn eigen werking en stand elke 15 minuten mee (hieronder).',
  '- todayin (todayin.email): nieuwsbrief en for-you, aanmeldingen via PropellerAds (TODAYIN, FOR-YOU). Testproject. Eigen overdracht in de todayin-repo.',
  '- Yoors Shop (SHOP-LUS NL, yoo.rs): shop met Babita; PropellerAds-lus en Google Shopping via Demand Radar. Shoptest sinds 19 okt: elke dag 20 producten (dagkeuze /api/shop/kies uit Demand Radar, prijsradar en marge), per product een campagne (propellerads-mcp lib/shoptest.ts, cron :15 van 05 tot 21 UTC), presterend en veelbelovend blijven, af en 3 dagen zonder oordeel stoppen. Plekken alleen relatief tegen het paginagemiddelde blokkeren. Overdracht: /api/shop/overdracht.',
  '- Spellen (SPEL): spel.todayin.email en quizzen. Testproject.',
  '- Amazon-blanket: GESTOPT en de bewaking staat op nul (Henkjan 19 okt: "Ja AMZ omzet en bewaking op nul. Is voorlopig uit."): geen gedekte omzet voor Amazon-kliks in de budgetwacht, de PropellerAds-ronde slaat de blanketregels over, de connector weigert AMZ-starts, geen Associates-voedingsalarm (schakelaars AMAZON_UIT in propellerads-mcp lib/budget.ts en hjdk-api lib/wachtuur.js). Henkjans Amazon Associates-account is op 19 okt gesloten; alle AMZ-campagnes staan uit (280 op PropellerAds, de AMZ-campagnes op Mondiad). Niet herstarten.',
  '',
  '### Netwerken en wie wat doet',
  '- PropellerAds: connector propellerads-mcp (MCP-tools voor campagnes, zones, creatives, budget). De ronde (/api/ronde, elke 10 minuten) bewaakt alle campagnes: dure zones, zones zonder echte mensen, stopregel, witte lijsten, budgetwacht, tempowacht. Clickmind voert zijn ingrepen elk uur om :20 uit (/api/clickmind).',
  '- Mondiad: wacht in hjdk-api (/api/md/wacht elke 10 minuten, /api/md/ronde om :07 en :37). Pauzeren en weer aanzetten via /api/mm/mdpauze (?aan=1), alleen op Henkjans woord.',
  '- RichAds en MGID: wacht in richads-mcp. Clickadu: nog geen wacht.',
  '- Elke wacht meldt zijn uitgaven per campagne aan propellerads-mcp /api/wachtlog; het antwoord zegt wat hij om het budget moet stoppen of weer aanzetten.',
  '',
  '### Centrale regels (afgedwongen in code)',
  '- Budgetwacht (propellerads-mcp lib/budget.ts): per saldo hoogstens $100 per budgetdag (PropellerAds-dag, 05:00 UTC) over alle netwerken; testprojecten $20 per dag en 10 dagen vanaf 18 okt, daarna quitte of stil tot Henkjan de regel openbreekt (budget_regel_open).',
  '- Bod (lib/tempo.ts): elke nieuwe campagne en kopie start op CPA $0,01. Verhogen alleen bij succes: 3 dagen omzet minstens 1,2 x de kosten, minstens $5 kosten (verkoopproject minstens 2 verkopen), gisteren minder dan 80% van het dagbudget op; dan hoogstens +20% en een keer per dag.',
  '- Tempowacht (lib/tempo.ts): een dagbudget moet 8 uur meegaan. Te snel: bod omlaag; mag dat niet (PropellerAds weigert een lager CPA-bod op een lopende campagne) dan een uur stil en weer aan. Een campagne boven $0,01 zonder succes zet de budgetwacht niet meer aan: kopie op $0,01.',
  '- Slots (lib/slots.ts): PropellerAds staat 100 starts per dag toe; elke nieuwe campagne, play en creative-wijziging telt. Zonder slot weigert de connector.',
  '- Stopregel (lib/stopregel.ts): relatief tegen ijkprijs P per project; verliezers stoppen mag zonder vragen.',
  '- Zonelijsten (lib/zonelijst.ts): zwart erbij of wit eraf; een witte lijst wordt nooit gewist (foto en herstel).',
  '- Opruimen bij elke kopie: kopie aan en de voorganger uit, een campagne per zoekterm. Nooit zelf campagnes in bulk herstarten: eerst melden wat terug aan moet en Henkjans woord afwachten.',
  '',
  '### Clickmind (hjdk-api)',
  '- Klikregister /go en mensmeter (/mm.js): elke advertentieklik, echt mens of niet, per netwerk, campagne en zone.',
  '- Uurwacht (/api/mm/wachtuur elk uur om :47): aankomst per netwerk, geld per uniek mens, eigen projecten (shop, todayin), alarmen naar Telegram.',
  '- Ingrijpen (lib/tagstop.js): stelt per netwerk voor welke campagnes stil moeten (kapot, geen mens, nul uitkomsten bij 3 x de projectprijs); PropellerAds voert het uit om :20, Mondiad zelf. Uit te zetten met mm:instelling.tagstop=false.',
  '- Lekketen van advertentie tot betaling (lib/lekketen.js, /api/mm/lekketen?vorm=tekst; Henkjan 19 okt: "lek is vanaf ad naar betaling. Daar haken mensen af ieder punt waar lek zit los je op tot er geen lekken meer zijn", "gebruik vooral clickmind", "kijk naar de leerlus skill"). MyLevel: PropellerAds-kliks per UTC-uur -> geland -> test geladen -> vraag 1 in beeld -> aangeraakt -> antwoord 1 -> antwoord 2 -> gratis deel af -> prijs gezien -> koopklik -> checkout open -> betaalmethode -> betaalpoging -> betaald. De paginastappen telt MyLevel eenmaal per advertentiebezoeker (keten, meegestuurd met de projectoverdracht); ernaast de mensmeter van Clickmind per campagne (gemeten, echt mens; op MyLevel aan sinds 19 okt) en de eigenwacht-alarmen. Elke stap tegen een maatstaf (KETEN in lib/lekketen.js); lek = onder de maatstaf, alarm = onder de helft, kapot = 10+ erin en 0 door; grootste lek = meeste gemiste verkopen. Geen lekken = elke stap met 30+ erin haalt zijn maatstaf. De MyLevel-leerlus (elk half uur) dicht elke ronde het grootste lek volgens de leerlus-skill.',
  '- Remarketing (lib/retarget.js): segmenten echt, warm, heet, koper per project in PropellerAds-publieken (nu mylevel-us). Lookalikes en verkenner per project (lib/lookalike.js).',
  '',
  '### Leren',
  '- Centrale leerlus (propellerads-mcp /api/leerlus, MCP-tools leerlus_skill en leerlus_leer): lessen en besluiten van alle projecten, eigen maatstaven per trechterstap. Projecten melden hun stappen en experimenten zelf (MyLevel elke 15 minuten).',
  '- Per project een uurlijkse leerlus als cloudtaak (MyLevel: lekken per stap, experimenten om de 100 views, aftersales).',
  '- ZICHT (vindbaarheid in Google en AI-assistenten): /api/zicht, rondes 05:30 en 05:50 UTC, per site zicht.json.',
  '',
  '### Deze overdracht',
  '- Wordt bij elk bezoek opnieuw opgebouwd: werking (dit deel plus de werking die projecten meesturen), live stand (budget, slots, tempowacht, uurwacht, projecten), alarmen, open punten en werklog.',
  '- Projecten sturen elke 15 minuten hun stand en werking: met hun leerlus-sleutel via propellerads-mcp (POST /api/leerlus, soort overdracht; MyLevel doet dit) of rechtstreeks (POST /api/mm/handoverzet met de gedeelde team-sleutel). Is een stand ouder dan 1 uur, of is de regelset van een project nieuwer dan zijn werking, dan staat er een waarschuwing bij.',
  '- Elke deploy van hjdk-api komt vanzelf in het werklog. Chats schrijven bij met ?log=<tekst>&wie=<chat> en zetten open punten met ?open=<JSON-lijst>.'
];
