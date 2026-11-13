# KDP-boekwedstrijd: welk boek maken we als volgende?

Vastgelegd 13 nov 2026 op verzoek van Henkjan: "maak het dus vast inderdaad en blijf iedere dag onderzoeken welke we als volgende moeten gaan maken En laat die dan tegen elkaar op boksen om uiteindelijk beste max aantal te releasen". Doel: 10x KDP-royalty dit kerstseizoen, hoog rendement, geen cent verspillen.

## Spelregels

1. **Elke dag 3 nieuwe kandidaten** onderzoeken in het dagrapport (send_later-keten 06:20 UTC). Bewijs komt uit Keepa (rang, 30-dagenrang, datum van verschijnen, prijs, reviews), niet uit gevoel.
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

## Werkwijze per nieuw boek

Bouwers en bronnen staan in `kdp/bouw/` (spiegel van `/home/claude/boek` in de cloudsessie): `bouw_boek.py <map> <uit.pdf>` (binnenwerk, reportlab, alle fonts ingebed), `omslag_gen.py` via `<map>/omslag_cfg.py` (paperback, en met `hard=dict(spine, w, h)` de hardcover), `bouw_epub.py` (Kindle). Per boek: `config.py`, feitenbestanden, `kdp.json` (titel, ondertitel, 7 zoekwoorden, categorieen, prijzen, AI-verklaring, beschrijving). Fonts: Poppins en Carlito uit /usr/share/fonts, emoji Noto (Apache 2.0) in `kdp/bouw/emoji`.
