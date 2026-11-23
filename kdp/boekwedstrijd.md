# KDP-boekwedstrijd: welk boek maken we als volgende?

Vastgelegd 13 nov 2026 op verzoek van Henkjan: "maak het dus vast inderdaad en blijf iedere dag onderzoeken welke we als volgende moeten gaan maken En laat die dan tegen elkaar op boksen om uiteindelijk beste max aantal te releasen". Doel: 10x KDP-royalty dit kerstseizoen, hoog rendement, geen cent verspillen.

## Spelregels

1. **Veel bedenken, goedkoop voorselecteren, duur alleen de top** (Henkjan 23 nov 2026: "Ja doe" op: "nu scoort de boekwedstrijd 3 kandidaten per dag, dat kunnen er 100 worden"). Elke ochtendronde (06:20 UTC): (a) bedenk minstens 30 nieuwe kandidaten (doelgroep x vorm x markt x moment), varianten van bewezen sjablonen en nieuwe haken; (b) voorselectie zonder Keepa-tokens: Demand Radar (zoekvraag en stijgers van die markt: https://demandradar-ivory.vercel.app/api/early?behoefte=1&cc=DE|US|NL, verrassingen ?fabriek=1), KDP-risico (regel 3), timing (kan het live voor de piek), hergebruik; schrap alles wat daar zakt; (c) alleen de top 5 krijgt de dure toets met Keepa (rang, 30-dagenrang, verschijndatum, prijs, reviews van de top in de niche); (d) de top 3 met score komt in het rapport en in `wachtrij.md`. Bewijs komt uit Keepa en Demand Radar, niet uit gevoel. Het aantal bedacht en voorgeselecteerd staat in het dagrapport, zodat te zien is hoeveel er per dag langs komen.
2. Elke kandidaat krijgt een **score van 100** (tabel hieronder) en komt in `wachtrij.md`, gesorteerd op score.
3. **KDP-risico diskwalificeert**: dubbele of bijna gelijke inhoud met een eigen boek (vertalen mag wel), merknamen of beschermde reekstitels in titel of ondertitel (voorbeeld: "Unnützes Wissen" is een NEON/Heyne-reeks), andermans namen in zoekwoorden, beloftes die het boek niet waarmaakt.
4. **Elke zondag 00:00 UTC** reset de KDP-weeklimiet: per formaat 2 nieuwe titels aanmaken en 2 indienen (paperback, hardcover en Kindle tellen apart). De top 2 van de wachtrij krijgt de paperbackplekken; de hardcoverplekken gaan naar de beste titels die al als paperback bestaan of tegelijk komen (zelfde binnenwerk, aparte omslag). Zo halen we het maximale aantal releases per week. Kindle zodra de publicatiefout bij KDP is opgelost.
5. Publiceren doet Henkjan (knop Publish Your Paperback Book). Claude zet alles klaar als concept.
6. **Na 14 dagen live** wordt elk boek afgerekend op echte royalty (KDP Reports > Royalties Estimator) tegen ads. De weging hieronder wordt dan bijgesteld: wat voorspelde de winnaars echt?

## Scorekaart (100 punten)

| Criterium | Punten | Wat telt |
|---|---|---|
| Vraag | 30 | Rang van de top 5 in de niche (lager is beter), aantal titels onder rang 10.000, zoekwoorden met volume |
| Doorbraakbewijs | 25 | Nieuwe titels van kleine uitgevers die binnen weken in de top 5.000 kwamen (bewijst dat een nieuwkomer kan breken) |
| Timing | 15 | Kan het live staan voor de piek (advent: voor ~20 nov; kerst: voor ~10 dec; Valentijn: begin januari) |
| Marge | 15 | Royalty per verkoop na drukkosten, en ruimte voor ads binnen de margeregel (ads hoogstens 50% van de royalty) |
| Hergebruik | 10 | Bouwer, inhoud of vertaling bestaat al (sneller, goedkoper), zonder dubbele inhoud |
| Concurrentie-gat | 5 | Wat ontbreekt bij de top (taal, doelgroep, grote letters, cadeau-invalshoek) |

## Bewijs tot nu toe (Keepa, 13 nov 2026)

- **Duitsland, feitenboeken voor mannen breken snel door**: Der Adventskalender für Männer, die nichts brauchen #63 (B0HG87J6PJ), B0HJDSZKR4 #774, Klugscheißer-Buch #1.757 (B0HNQDXBXJ), B0HN467TKF #4.001.
- **Duitsland, adventskalenders voor vrouwen**: #20 (Namasté), #172, #519. Gelanceerd aug-sep: volgend jaar vroeg starten.
- **Duitsland, klobuch-reeks** (Kack dich schlau #271, Jäger #2.552, Angler #7.188): bewezen sjabloon per doelgroep; eigen titel zonder die merknaam.
- **VS, kerstmoppen voor kinderen van nieuwe indies**: zwak (rang 48k-154k).
- **VS, trivia voor senioren**: zwak.
- **Canada, Stocking Stuffers For Teens** (eigen boek): CA-rang 10.505, vorig jaar 20 dec CA #99; #1 in Teen > Education & Reference > Reference CA staat op rang 3.290.

## Bewijs 14 nov 2026 (Keepa)

- **Duitsland, feitenboeken voor teenagers**: Unnützes Wissen für Teenager B0C9S9CCP4 #2.419 (indie, sinds 2023), FAKTISCH! 1970904135 nieuw 19 okt #14.382, Achtsam Ausrasten für Teenager 391155219X nieuw 30 sep al #138 (humor-cadeau voor teens). Kandidaat: Duitse vertaling van Teens (76).
- **Frankrijk, feiten voor ado's**: MAIS WHAT?! B0HMS6BRQ8 (indie) nieuw 12 okt, nu #2.484. Kandidaat: Franse vertaling van Teens voor FR en Frans Canada (75).
- **Spanje, datos curiosos adolescentes**: zwak (beste nieuwe #8.269). Kandidaat 48.
- **Canada, Teens na de categoriewijziging**: Amazon.ca plaatste het boek op 14 nov in Children's > Games > Questions & Answers (938856, #1 rang 28) en Party Games (938852, #1 rang 51), niet in de Teen-nodes. Rang 6.789 (was 10-11k).

## Werkwijze per nieuw boek

Bouwers en bronnen staan in `kdp/bouw/` (spiegel van `/home/claude/boek` in de cloudsessie): `bouw_boek.py <map> <uit.pdf>` (binnenwerk, reportlab, alle fonts ingebed), `omslag_gen.py` via `<map>/omslag_cfg.py` (paperback, en met `hard=dict(spine, w, h)` de hardcover), `bouw_epub.py` (Kindle). Per boek: `config.py`, feitenbestanden, `kdp.json` (titel, ondertitel, 7 zoekwoorden, categorieen, prijzen, AI-verklaring, beschrijving). Fonts: Poppins en Carlito uit /usr/share/fonts, emoji Noto (Apache 2.0) in `kdp/bouw/emoji`.

## Bewijs 15 nov 2026 (Keepa)

- **Canada, feitenboeken voor kinderen 8-12**: The Ultimate Book of Random Fun Facts 1648451233 #179, Quiz Whiz 1426310188 #246, Super Interesting Facts For Smart Kids B0BGGM9SGY #625 (30 dagen geleden ~10k: kerstpiek begint). Indie-doorbraak: 500+ Wild & Awesome Hockey Facts Book For Kids B0FZBZPFPQ (nov 2025) nu #1.938 in CA. Kandidaten: Hockey Facts for Kids (CA/US, 72) en Stocking Stuffers For Kids 8-12, het kleine broertje van Teens (CA/US, 70).
- **VS, kerst-Bijbel kleuren op nummer**: zwak. Christmas Nativity Color By Number B0HG1QNQ66 (aug 2026) #216.709; Christmas Color by Number for Kids (merk Majosta, B0FWKLZFYB #108.575, B08NS4FYXG #29.717). Kandidaat 42.
- **VK, Apocrypha hardcover**: zwak. Hardcover-concurrenten #241k tot #918k; alleen de Ethiopische Bijbel (B0FNMP7R17, #7.150, GBP 43) loopt. Geen kandidaat.
- **Eigen verkoop 12-14 nov**: Teens $18,04 (Canada), Bible Color By Number $6,30, Apocrypha $4,44, Enoch $4,19, Mom's Word Search $1,66. Bible Color By Number verkoopt zonder ads: kandidaat voor een eigen boekgids-push en een hardcover later.

## Bewijs 17 nov 2026 (Keepa)

- **VS, feitenboek voor meiden**: The Rare and Unusual Knowledge Book for Smart Girls B0GCB9HXRM (indie, sinds 23 dec 2025) nu #944, 90 dagen gemiddeld #3.621, 62 rangdalingen in 30 dagen. Breed: Book of Unusual Knowledge #25, True Facts That Sound Like Bull$#*t #71, Ultimate Book of Random Fun Facts #381. Kandidaat: Stocking Stuffers For Teen Girls (Elias Grant, US/CA, eigen nieuwe feiten, geen Teens-feiten) 81.
- **Canada, Would You Rather voor kinderen en teens**: Try Not to Laugh WYR 1951025083 #201, indie Would You Rather Game Book for Kids 1653075104 #885 (sinds 2020), Z Kids Made You Think 0593196791 #2.005 (met "Stocking Stuffers for Kids" in de titel); teen-specifieke indies zwak (#46k-#57k). Kandidaat: Would You Rather? Stocking Stuffers for Kids & Teens (Elias Grant, CA/US, sjabloon Choose Wisely Darling) 72.
- **VS, kersttrivia voor gezinnen**: nieuwe indie B0HMJYGG3R (okt 2026) #15.274, de rest #30k tot #1,1 mln; verkoopt alleen tot 25 dec. Kandidaat 57, niet dit jaar.

