# KDP-rondes: draaiboek (4x per dag)

Bron voor alle geplande KDP-rondes. De geplande berichten zelf zijn kort en verwijzen hiernaar; nieuwe kennis zet je HIER (en in lib/werking.js), niet in de prompts.

## Opdracht van Henkjan

- 6 nov: "Gebruik /campagnes-henkjan iedere dag nieuwe copy maken enz. Rapporteer hier iedere dag. Ik stuur je verkoop."
- 11 nov: "Ja speel met de beide ads platforms en maak het zeer hoge ROI. Zet aan en leer iedere dag van de ads. En verbeter dan ook de ads." / "Optimaliseer ze maximaal met goed research" / "Ik wil geen cent verspillen !!"
- 13 nov: "Dit moet jij gewoon doen als rendement daar hoger door wordt" en daarna **"Ja je mag dus alles doen als ROI maar maximaal is . En je hier dagelijks minimaal 4 x rapporteert ."**
- 13 nov over Teens: "Kunnen we deze niet naar nr1 brengen ?" / over nieuwe boeken: "blijf iedere dag onderzoeken welke we als volgende moeten gaan maken En laat die dan tegen elkaar op boksen om uiteindelijk beste max aantal te releasen".

Dus: elke stap die het rendement maximaliseert doe je zelf en meld je daarna (biedingen, pauzeren, campagnes bijzetten of opschalen, zoekwoorden, categorieen, prijzen, beschrijvingen, nieuwe boeken klaarzetten). Grenzen die blijven: hoogstens $10 per dag per campagne (uitzondering alleen met Henkjans woord), margeregel (alle ads van een boek samen hoogstens 50% van de royalty van dat boek), geen conversie-postback naar PropellerAds voor KDP, nooit wachtwoorden typen, geen dubbele inhoud of andermans merk/reekstitel (KDP-regels). Geen cent verspillen: wat geld kost zonder verkoop gaat uit.

Publish-knoppen in KDP (Publish Your Paperback/Hardcover/Kindle eBook) klikt Claude niet: die klik wordt geblokkeerd (13 nov opnieuw geprobeerd voor de Teens-categorieen). Zet alles klaar als concept en stuur Henkjan de link naar de prijspagina; herinner hem in elke ronde zolang iets wacht.

## Schema (UTC; Curacao = UTC-4)

| Ronde | UTC | Curacao | Soort |
|---|---|---|---|
| A | 06:20 | 02:20 | VOL: verkoop gisteren, alle ads, optimaliseren, boekwedstrijd |
| B | 12:20 | 08:20 | TUSSEN |
| C | 17:20 | 13:20 | TUSSEN |
| D | 22:20 | 18:20 | TUSSEN + dagafsluiting |

Elke ronde is een send_later-keten die zichzelf 24 uur later opnieuw plant (stap 0, altijd eerst). Rapport altijd HIER in de chat met SendUserMessage, kort Nederlands, alleen wat nieuw is (geen geleerde lessen herhalen), nooit nulgroei tonen. Daarna in de handover (Vercel-tool web_fetch_vercel_url: https://hjdk-api-henq.vercel.app/api/mm/handover?log=...&wie=kdp-rapport).

### VOL (ronde A)
1. Verkoop gisteren per boek en land: KDP Reports > Royalties Estimator in Chrome (kdpreports.amazon.com/royalties; kalendericoon Start Date, dag, nog eens de dag voor End Date; marktplaatsfilter). KDP gaat voor Keepa.
2. Ads per boek op beide platforms tegen royalty (tabel hieronder). Pas de stopregels toe, schaal winnaars op.
3. Teens #1 Canada: stand (zie onder).
4. Boekwedstrijd: 3 nieuwe kandidaten onderzoeken en scoren (kdp/boekwedstrijd.md, kdp/wachtrij.md), commit + push.
5. Rapport: VERKOOP eerst, per boek ads tegen royalty, wat werkt en wat niet, wat geleerd (nieuw), wat ik verbeterde of stopte, Teens-rang tegen #1, top 3 wachtrij, tempo naar 10x (nov 2025: $101/dag royalty).

### TUSSEN (rondes B, C, D)
1. Ads van vandaag sinds middernacht per campagne (Amazon US + Canada, PropellerAds Apocrypha): vertoningen, kliks, kosten, aankopen. Stopregels toepassen; campagnes zonder vertoningen een stap omhoog binnen de marge; zoektermen met aankoop exact toevoegen.
2. Verkoop vandaag tot nu (Royalties Estimator, vandaag) als KDP het al toont.
3. Teens CA-rang en #1 in Teen Reference (Keepa), status van openstaande KDP-wijzigingen (in review / live).
4. Iets wat het rendement verhoogt en nu kan: doen.
5. Rapport in hooguit 6 regels: verkoop vandaag, kosten vandaag, wat ik veranderde, wat opviel. Ronde D sluit de dag af: totaal royalty en ads vandaag, plan voor morgen.

## Campagnes

Alle Amazon-campagnes: Dynamic bids down only, alleen Amazon (Limit reach to Amazon), "Increase bids for high-traffic days" uit (controleer met JS of de checkbox echt uit staat), hoogstens $10/dag.

**Amazon US** (Chrome: advertising.amazon.com/campaign-manager/all-campaigns?entityId=ENTITY2QK5HDABOJQO8; datum bij de tegel Date range en apart bij "Lifetime" boven de tabel, dag twee keer klikken, Apply):
- TEST 12-15 nov op marktbod (Henkjan "Ja"): Lasting change LASTING CHANGE KW (A04830353R9IVCG7VO45Z), PIT BOSS Cerebro BROAD2 (A08157981F0U0IXIHTP17), Enoch scaling KW (A07314352JF7DPT0LBI2X). Geen verlaging tijdens de test; 15 nov per boek oordelen: royalty 12-15 nov (organisch mee) tegen alle ads van dat boek; ads <= 50% = houden en beste woorden opschalen, anders terug naar oude biedingen of uit.
- KDP For Men KERST EXACT 0.45 | 13nov (A094841238T75L5P00YDA): For Men B0HRGNJ7CY, 12 kerstcadeauwoorden $0,45 (3 niche $0,50).
- KDP Feitenboeken PT concurrenten 0.35 | 13nov (A002679099X7YQ0MNAMT): Wait, That's True?! B0HRFY3TLB + For Men B0HRGNJ7CY op 11 boekpagina's exact $0,35 (160433696X, B0FVKQH4KS, 1922590657, B0HMFZDC2G, 1648451233, B0B6XFT4RH, 3982670632, B0DJQLBM75, B0H8LY3F6V, 1648451306, 1648451217). Boeken zonder reviews: pagina met kosten > $3,40 en 0 verkopen pauzeren.
- KDP Wait Thats True EXACT | 12nov (A05992682MW2DU09KSFTY, marktbod, max $3,35/aankoop).
- B0F1SM1L5J-AUTO (A03228661CQIWZXX5IXLQ), Traeger Cerebro BROAD Copy 2 (A07419671HF50HRG5N4MG, max $2,95), KDP Crock Pot EXACT 0.35 (A1041734BNY8PUAJFCY2, max $3,74), KDP Griddle EXACT 0.40 (A06363731IM3I67SGN8N7, max $5,07), Enoch Cerebro KW 0.12 (A0731099I4B9XDZBQXPG, $5).
- Les 12 nov: ook op marktbod nauwelijks vertoningen op de oude zoekwoorden; groei komt van concurrentpagina's en cadeauzoekwoorden.

**Amazon Canada** (Chrome: advertising.amazon.ca/campaign-manager/all-campaigns?entityId=ENTITY1M4S6BSL29IE3):
- KDP Teens CA EXACT 0.35 | 12nov (A00497891W6LJG83V0FN2, CA$13,80/dag, start 13 nov).
- KDP Teens CA AUTO 0.35 | 13nov (A00785372M8F3DEDU6DQR, CA$5/dag).
- KDP Teens CA PT concurrenten 0.35 | 13nov (A06071251IK63T2R1K3RO, CA$5/dag, exact op B0FTF7LH51, B0B6XFT4RH, 1648451438, 164845044X, 1951806409, 1546595902).
- Stopregel Teens: doel of zoekterm > CA$2,40 kosten en 0 verkopen = pauzeren of negatief exact; AUTO-zoektermen met verkoop exact in EXACT. Geen vertoningen na 2 dagen: hoogstens CA$0,45.

**PropellerAds**: alleen KDP APOCRYPHA UK (bod 0,01, dagkopie door trig_015Lh3CptvRcbCBZwj48qsch 05:47 UTC; voorganger moet gestopt zijn, 8 ads, botzones uit /api/mm/blok). Lasting Change US, Grillboek US, Remarketing US en Traeger US blijven uit (push-kliks naar Amazon gaven 0 boekverkoop).

**Builder-trucs**: bod in de builder via de popover (klik bodveld, triple-click, getal met punt, Save; na Save verschuift de lijst: posities opnieuw meten, anders raak je de x). Of vooraf Bid op "Default bid" met bedrag. Na lanceren Settings > Limit reach to Amazon > Save. Chrome reageert niet: nieuw tabblad (tabs_create_mcp), oude sluiten.

## Royalty per verkoop

| Boek | ASIN | Royalty | Max ads per verkoop |
|---|---|---|---|
| Stocking Stuffers For Teens (CA CA$13,99 / US $9,99) | B0DJQLBM75 | CA$4,78 / $3,23 | CA$2,39 / $1,61 |
| Wait, That's True?! ($14,99) | B0HRFY3TLB | ~$6,70 | $3,35 |
| Wait, That's True?! For Men ($14,99) | B0HRGNJ7CY | ~$6,84 | $3,42 |
| Lasting Change Workbook ($24,99) | B0F1SM1L5J | $11,92 | $5,96 |
| PIT BOSS | B0BKRPL5JX | ~$4,00 | $2,00 |
| Traeger ($16,99) | B0C4WXBN21 | $5,90 | $2,95 |
| Crock Pot | B09X4MCHCM | $7,47 | $3,74 |
| Griddle | | $10,14 | $5,07 |
| Enoch ($15,99) | B0B5KV79N1 | $6,54 | $3,27 |
| Apocrypha UK | B09YTZ72KZ | £3,36 (£4,56 bij £12,99) | 50% |
| Duitse titels (paperback EUR 12,99, vanaf ~20 nov) | | ~EUR 5,5 | ~EUR 2,75 |

Cijfers: 11 nov $20,40; 12 nov $13,70; november t/m 13 nov $166,38; Teens november $76,34 uit 27 bestellingen (13 nov).

## Teens naar #1 in Canada

Teens B0DJQLBM75 (119 reviews, 4,5 ster in CA) verkoopt vooral in Canada: CA-rang 10.505 (13 nov), beste in 30 dagen 2.614, vorig jaar ~20 dec CA #99. Doel: oranje #1 in CA Teen & Young Adult > Education & Reference > Reference (node 20941581011; #1 op 13 nov rang 3.290) en Teen > Games & Activities > Questions & Answers (202398473011). Curiosities & Wonders (#1 Guinness, rang 38) is niet haalbaar. Categoriewijziging in KDP-paperback YX7G68DWSFT (Curiosities & Wonders + Teen Q&A + Teen Reference in plaats van Antiques & Collectibles) is op 13 nov ~16:15 UTC door Henkjan gepubliceerd; KDP verwerkt dat in hooguit 72 uur. Meld in elke ronde of de nodes al live zijn en de rang tegen #1. Hardcover van Teens gebouwd op 13 nov uit Henkjans Kindle Create-bestand (408_facts_interior.kpf): 5,5 x 8,5 met bleed, 147 p., omslag 13,0983 x 9,918 (kdp/bouw/teens); wordt zondag 15 nov aangemaakt (hardcoverplek 2) en gaat via Amazon.com ook naar Amazon.ca. Check met Keepa get_products (domain ca, raw: categories bevat 20941581011) en get_best_sellers (20941581011, ca, 3).

## Openstaand

- Kindle-eBooks Wait, That's True?! (A1NZ4PXA2W9L9O) en For Men (A34DE110B1IJJG): Publish faalt met "Please fix the highlighted error(s)" zonder rood veld. Elke VOL-ronde een nieuwe poging; blijft het falen: KDP Support.
- Zondag 15 nov 00:12 UTC (trig_01EDncuGEXzWK6QZmy923y8f): paperbacks + hardcovers Adventskalender für Männer en Moment mal, das stimmt?! Für Männer klaarzetten.
- 15 nov 15:17 UTC: biedingen LC NIEUWJAAR herijken (trig_01XFKR9gQ6X5ahE3CiEckxBh).
