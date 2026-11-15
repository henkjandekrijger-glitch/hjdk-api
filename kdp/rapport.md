# KDP-rondes: draaiboek (4x per dag)

Bron voor alle geplande KDP-rondes. De geplande berichten zelf zijn kort en verwijzen hiernaar; nieuwe kennis zet je HIER (en in lib/werking.js), niet in de prompts.

## Opdracht van Henkjan

- 6 nov: "Gebruik /campagnes-henkjan iedere dag nieuwe copy maken enz. Rapporteer hier iedere dag. Ik stuur je verkoop."
- 11 nov: "Ja speel met de beide ads platforms en maak het zeer hoge ROI. Zet aan en leer iedere dag van de ads. En verbeter dan ook de ads." / "Optimaliseer ze maximaal met goed research" / "Ik wil geen cent verspillen !!"
- 13 nov: "Dit moet jij gewoon doen als rendement daar hoger door wordt" en daarna **"Ja je mag dus alles doen als ROI maar maximaal is . En je hier dagelijks minimaal 4 x rapporteert ."**
- 15 nov: **"Geef hier ook altijd organische resultaten van de keuzehulpen ."** Dus elk rapport (alle 4 rondes) heeft een regel ORGANISCH, ook als het weinig is (dan kort: wat er staat en wat de volgende stap is).
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

Elke ronde is een send_later-keten die zichzelf 24 uur later opnieuw plant (stap 0, altijd eerst).

ORGANISCH in elke ronde: web_fetch_vercel_url https://hjdk-api-henq.vercel.app/api/wtb?op=boekstand&m=us (compact): per site (keuzehulp.best, whichtobuy.best, kaufberater.best) echte bezoekers uit zoek en AI in 7 dagen, Google 28 dagen (vertoningen, kliks, pagina's in Google), en per boekgids bezoek uit zoek en AI 7 dagen, Amazon-kliks 7 dagen, Google-vertoningen en zoekvragen met plek. Zet het tegen de vorige ronde (laatste regel hieronder bij Organisch). Ronde A doet daarnaast de indexaanvragen (GSC, 8 tot 10 per dag) en IndexNow voor gewijzigde gidsen.

## Organisch (keuzehulpen, nieuwste boven)

- 15 nov 12:40 UTC (start meting): keuzehulp.best 117 van 518 in Google, 7 dagen 0 uit zoek en 4 uit AI (ChatGPT), Google 28 dagen 612 vertoningen 5 kliks. whichtobuy.best 4 van 155 in Google (148 onbekend bij Google), 7 dagen 1 uit zoek, eigen pagina's 19 vertoningen 0 kliks. kaufberater.best 8 van 83 in Google, 7 dagen 1 uit zoek (Bing), eigen 24 vertoningen 2 kliks. Boekgidsen: nog geen Google-vertoningen (indexaanvragen 14 en 15 nov, 10 van 12 gedaan); nieuwe Duitse gids /adventskalender-fuer-maenner. Teller per gids voor bezoek uit zoek/AI en Amazon-kliks per dag loopt vanaf 15 nov. Rapport altijd HIER in de chat met SendUserMessage, kort Nederlands, alleen wat nieuw is (geen geleerde lessen herhalen), nooit nulgroei tonen. Daarna in de handover (Vercel-tool web_fetch_vercel_url: https://hjdk-api-henq.vercel.app/api/mm/handover?log=...&wie=kdp-rapport).

### VOL (ronde A)
1. Verkoop gisteren per boek en land: KDP Reports > Royalties Estimator in Chrome (kdpreports.amazon.com/royalties; kalendericoon Start Date, dag, nog eens de dag voor End Date; marktplaatsfilter). KDP gaat voor Keepa.
2. Ads per boek op beide platforms tegen royalty (tabel hieronder). Pas de stopregels toe, schaal winnaars op.
3. Teens #1 Canada: stand (zie onder).
4. Boekwedstrijd: 3 nieuwe kandidaten onderzoeken en scoren (kdp/boekwedstrijd.md, kdp/wachtrij.md), commit + push.
5. Rapport: VERKOOP eerst, ORGANISCH (boekstand, tegen gisteren), per boek ads tegen royalty, wat werkt en wat niet, wat geleerd (nieuw), wat ik verbeterde of stopte, Teens-rang tegen #1, top 3 wachtrij, tempo naar 10x (nov 2025: $101/dag royalty).

### TUSSEN (rondes B, C, D)
1. Ads van vandaag sinds middernacht per campagne (Amazon US + Canada, PropellerAds Apocrypha): vertoningen, kliks, kosten, aankopen. Stopregels toepassen; campagnes zonder vertoningen een stap omhoog binnen de marge; zoektermen met aankoop exact toevoegen.
2. Verkoop vandaag tot nu (Royalties Estimator, vandaag) als KDP het al toont.
3. Teens CA-rang en #1 in Teen Reference (Keepa), status van openstaande KDP-wijzigingen (in review / live).
4. Iets wat het rendement verhoogt en nu kan: doen.
5. Rapport in hooguit 7 regels: verkoop vandaag, kosten vandaag, ORGANISCH (boekstand: bezoek uit zoek en AI, Amazon-kliks uit de boekgidsen, nieuw in Google), wat ik veranderde, wat opviel. Ronde D sluit de dag af: totaal royalty en ads vandaag, plan voor morgen.

## Campagnes

Alle Amazon-campagnes: Dynamic bids down only, alleen Amazon (Limit reach to Amazon), "Increase bids for high-traffic days" uit (controleer met JS of de checkbox echt uit staat), hoogstens $10/dag.

**Amazon US** (Chrome: advertising.amazon.com/campaign-manager/all-campaigns?entityId=ENTITY2QK5HDABOJQO8; datum bij de tegel Date range en apart bij "Lifetime" boven de tabel, dag twee keer klikken, Apply):
- TEST 12-15 nov op marktbod (Henkjan "Ja"): Lasting change LASTING CHANGE KW (A04830353R9IVCG7VO45Z), PIT BOSS Cerebro BROAD2 (A08157981F0U0IXIHTP17), Enoch scaling KW (A07314352JF7DPT0LBI2X). Geen verlaging tijdens de test; 15 nov per boek oordelen: royalty 12-15 nov (organisch mee) tegen alle ads van dat boek; ads <= 50% = houden en beste woorden opschalen, anders terug naar oude biedingen of uit.
- TESTUITSLAG 15 nov 06:40 UTC (12-14 nov, VS-dag 15 nov nog niet begonnen): PIT BOSS Cerebro BROAD2 $9,44 ads, 12 kliks, 0 aankopen, PIT BOSS-royalty $0 = GEPAUZEERD. Enoch scaling KW $1,87, 4 kliks, 0 aankopen, Enoch US-royalty $0 (de $4,19 Enoch kwam uit AU) = GEPAUZEERD; Enoch Cerebro KW 0.12 blijft als goedkope versie. Lasting change LASTING CHANGE KW: vertoningen, 0 kosten, LC-royalty $0 = blijft (kost niets). Les: marktbod op oude PIT BOSS- en Enoch-woorden levert kliks zonder verkoop; niet herhalen zonder nieuw bewijs.
- KDP For Men KERST EXACT 0.45 | 13nov (A094841238T75L5P00YDA): For Men B0HRGNJ7CY, 12 kerstcadeauwoorden $0,45 (3 niche $0,50).
- KDP Feitenboeken PT concurrenten 0.35 | 13nov (A002679099X7YQ0MNAMT): Wait, That's True?! B0HRFY3TLB + For Men B0HRGNJ7CY op 11 boekpagina's exact $0,35 (160433696X, B0FVKQH4KS, 1922590657, B0HMFZDC2G, 1648451233, B0B6XFT4RH, 3982670632, B0DJQLBM75, B0H8LY3F6V, 1648451306, 1648451217). Boeken zonder reviews: pagina met kosten > $3,40 en 0 verkopen pauzeren.
- KDP Wait Thats True EXACT | 12nov (A05992682MW2DU09KSFTY, marktbod, max $3,35/aankoop).
- B0F1SM1L5J-AUTO (A03228661CQIWZXX5IXLQ), Traeger Cerebro BROAD Copy 2 (A07419671HF50HRG5N4MG, max $2,95), KDP Crock Pot EXACT 0.35 (A1041734BNY8PUAJFCY2, sinds 14 nov alle 10 woorden $0,45, max $3,74), KDP Griddle EXACT 0.40 (A06363731IM3I67SGN8N7, sinds 14 nov alle 10 woorden $0,50, max $5,07), Enoch Cerebro KW 0.12 (A0731099I4B9XDZBQXPG, $5).
- Les 12 nov: ook op marktbod nauwelijks vertoningen op de oude zoekwoorden; groei komt van concurrentpagina's en cadeauzoekwoorden.
- Les 14 nov: voorgestelde biedingen zijn $0,75-$1,47 (Griddle $1,06-$1,47, Crock Pot $0,75-$1,01); onze $0,35-$0,50 halen 2-3 vertoningen in 3 dagen. Break-even CPC = max ads per verkoop x conversie (~10%): Griddle ~$0,50, Crock Pot ~$0,37. Hoger bieden dan dat is verlies; deze campagnes blijven dus klein. 11-13 nov: PIT BOSS 4.633 vertoningen, 7 kliks, $5,64, 0 aankopen (test, oordeel 15 nov); Wait That's True EXACT 279 vertoningen, 1 klik $1,29; Teens CA AUTO 42, EXACT 19, PT 0 vertoningen.
- Bod aanpassen in bulk: campagne > ad group > Targeting > vinkje alles > Bulk actions > Adjust bid > Set bid to > bedrag > Save changes (melding "10 of 10 targets updated").

**Amazon Canada** (Chrome: advertising.amazon.ca/campaign-manager/all-campaigns?entityId=ENTITY1M4S6BSL29IE3):
- KDP Teens CA EXACT 0.35 | 12nov (A00497891W6LJG83V0FN2, CA$13,80/dag, start 13 nov).
- KDP Teens CA AUTO 0.35 | 13nov (A00785372M8F3DEDU6DQR, CA$5/dag).
- KDP Teens CA PT concurrenten 0.35 | 13nov (A06071251IK63T2R1K3RO, CA$5/dag, exact op B0FTF7LH51, B0B6XFT4RH, 1648451438, 164845044X, 1951806409, 1546595902).
- Stopregel Teens: doel of zoekterm > CA$2,40 kosten en 0 verkopen = pauzeren of negatief exact; AUTO-zoektermen met verkoop exact in EXACT. Geen vertoningen na 2 dagen: hoogstens CA$0,45.
- **TEENS-DUW CANADA 14-21 nov** (Henkjan 14 nov: "Ja we gaan voor teens in Ca"): doel rang omhoog voor de kerstpiek (14 nov 2025 rang 840, 20 dec #99; 14 nov 2026 rang 8.889). Gezet 14 nov ~13:45 UTC: budget elk CA$10/dag (EXACT, AUTO, PT = CA$30/dag, max CA$210 in 7 dagen). EXACT: 12 woorden CA$0,60, 6 duurdere (gifts for teenage boys, gifts for teens, stocking stuffer boy, stocking stuffers for kids, stocking stuffers for teen boys, teen stocking stuffers) CA$0,90; AUTO: voorgesteld bod CA$0,50-0,69; PT: voorgesteld bod CA$0,61-1,36. Dynamic down only blijft. De margeregel per ad-verkoop geldt hier NIET (bewuste uitzondering); stopregel op totaal: op 18 nov (dagen 15-17 nov) moet de extra Teens-royalty in Canada (KDP Royalties Estimator, marktplaats Canada, tegen het gemiddelde per dag van 7-13 nov) minstens gelijk zijn aan de Teens CA-adskosten van die dagen; anders terug naar CA$0,35 en budgets EXACT CA$13, AUTO CA$5, PT CA$5. 21 nov: eindoordeel 7 dagen, verlengen alleen met Henkjans woord en cijfers. Elke ronde: Teens CA-kosten, rang, zoektermen met aankoop exact in EXACT, zoektermen > CA$5 zonder aankoop negatief exact. 15 nov 06:45 UTC: AUTO was op 14 nov 'Out of budget' (CA$10 op, 2 aankopen) = budget AUTO CA$14, EXACT CA$6 (gaf CA$5,10 in 3 dagen uit), PT blijft CA$10: totaal blijft CA$30/dag. Rang 15 nov 6.059 (14 nov 8.889-10.204). Amazon.ca zet het boek nu ook in Curiosities & Wonders (952922) en Trivia (952926), nog niet in de Teen-nodes. 14 nov (dag 1, stand 22:30 UTC): Teens CA-ads CA$7,33 (EXACT CA$4,20 5 kliks, AUTO CA$2,37 4 kliks, PT CA$0,76 1 klik); AUTO 2 aankopen = 3 stuks, CA$41,97 omzet (~CA$14,30 royalty): zoekterm "teen boy read" (2 stuks, Substitutes) en "408 random facts" (merkzoekterm, 1 stuk, CA$0,58). "teen boy read" exact in EXACT op CA$0,60 gezet (14 nov 22:35 UTC). Merkzoektermen niet als exact toevoegen (zou organische verkoop betalen).

**PropellerAds**: alleen KDP APOCRYPHA UK (bod 0,01, dagkopie door trig_015Lh3CptvRcbCBZwj48qsch 05:47 UTC; voorganger moet gestopt zijn, 8 ads, botzones uit /api/mm/blok). Lasting Change US, Grillboek US, Remarketing US en Traeger US blijven uit (push-kliks naar Amazon gaven 0 boekverkoop).
- 15 nov 06:45 UTC: dagkopie 12144115 heeft het venster (campagnetijd uren 02-16 = 07:00-22:00 UTC, iets korter dan 07-24), maar voorganger 12141917 draait ook nog (status 6): twee Apocrypha-campagnes tegelijk. Voorstel aan Henkjan: 12141917 stoppen (de dagronde hoort dat te doen).
- Apocrypha UK meten tegen oktober (zonder ads): oktober UK $36,93 = $8,34 per 7 dagen; 7-13 nov UK $29,38 met $17,60 PropellerAds (kosten per periode: /adv/statistics?group_by=campaign_id&day_from=...&day_to=...&campaign_id[]=...). Extra royalty +$21 > ads, maar ads 60% van de royalty (regel 50%). Henkjan 13 nov: "ja Apocrypha venster": dagvenster 07:00-24:00 UTC (nacht eruit) staat sinds 13 nov 20:50 UTC op 12137006. Elke ronde A controleert of de dagkopie van 05:47 UTC het venster heeft (time_table alleen uren 02 t/m 18 in campagnetijd UTC-5); zo niet: update_campaign day_window "07:00-00:00" op de kopie. Dagkopie 14 nov: 12141917 (voorganger 12137006 gestopt, venster 07-24 UTC door de dagronde bevestigd; nieuwe id's staan in de handover onder wie=kdp-dagronde). Beoordelen op 20 nov: Apocrypha UK-royalty per week tegen ads, doel ads <= 50%. Een PropellerAds-wijziging vanuit een geplande ronde werd op 13 nov door de veiligheidscontrole geblokkeerd: zulke wijzigingen als voorstel in het rapport en pas uitvoeren na Henkjans "ja" in de chat.

**Amazon-cijfers van vandaag** staan er overdag (UTC) nog niet (rapportvertraging, VS-tijd): in rondes B en C de tabel op gisteren + vandaag zetten (datumkiezer boven de tabel, twee dagen klikken, Apply). 11-13 nov kostten alle Amazon-campagnes samen $1,37 (PIT BOSS, 1 klik): de campagnes krijgen bijna geen vertoningen.

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

Cijfers 14 nov definitief: $9,85 (Teens $6,70 CA, Bible Color By Number $3,15). 12-14 nov $35,06 (Teens $18,04, Bible Color $6,30, Apocrypha $4,44, Enoch $4,19, Mom's Word Search $1,66). 1-15 nov $183,40. Amazon-ads 12-14 nov CA$39,12 (~$27). Cijfers 14 nov dagafsluiting 22:30 UTC: KDP $6,70 (nog niet bijgewerkt sinds de middag), alle Amazon-ads 14 nov CA$13,89 (~$9,70) met 2 ad-aankopen (Teens CA AUTO), PropellerAds Apocrypha $1,79 (284 kliks), Teens CA-rang 10.204. Eerder: tot 17:30 UTC $6,70, alles Teens Canada (~2 stuks); Amazon-ads 13-14 nov ~$7,80 + CA$1,80 (PIT BOSS $5,39 7 kliks, Wait That's True $1,97 2 kliks, Teens CA EXACT CA$1,80 2 kliks), 0 aankopen; Teens CA AUTO 249 en PT 85 vertoningen sinds de duw (eerst 42 en 0); Apocrypha UK PropellerAds 14 nov $1,76, 275 kliks; Teens CA-rang 8.889. Cijfers: 11 nov $20,40; 12 nov $13,70; 13 nov $8,20 (Enoch AU $4,21, Teens $2,33, Mom's Word Search US $1,66; ads $3,10 Apocrypha UK + $5,50 Amazon); 7-13 nov $122,39; 1-14 nov $173,35 (nov 2026 ~$12/dag tegen nov 2025 $101/dag); november t/m 13 nov $166,38; Teens november $76,34 uit 27 bestellingen (13 nov).

## Teens naar #1 in Canada

Teens B0DJQLBM75 (119 reviews, 4,5 ster in CA) verkoopt vooral in Canada: CA-rang 10.505 (13 nov), beste in 30 dagen 2.614, vorig jaar ~20 dec CA #99. Doel: oranje #1 in CA Teen & Young Adult > Education & Reference > Reference (node 20941581011; #1 op 13 nov rang 3.290) en Teen > Games & Activities > Questions & Answers (202398473011). Curiosities & Wonders (#1 Guinness, rang 38) is niet haalbaar. Categoriewijziging in KDP-paperback YX7G68DWSFT (Curiosities & Wonders + Teen Q&A + Teen Reference in plaats van Antiques & Collectibles) is op 13 nov ~16:15 UTC door Henkjan gepubliceerd; KDP verwerkt dat in hooguit 72 uur. 13 nov 17:40 UTC: paperback weer Live op de boekenplank. 14 nov: Amazon.ca zette het boek in Children's > Games > Questions & Answers (938856, #1 rang 28) en Party Games (938852, #1 rang 51) naast Curiosities & Wonders, NIET in de Teen-nodes 20941581011/202398473011; CA-rang 6.789 (13 nov 10-11k). #1 in die kindercategorieen is voor kerst niet haalbaar. Als de Teen-nodes op 16 nov nog ontbreken: KDP Support vragen (kdp.amazon.com/en_US/contact-us, onderwerp categorieen) om Teen & Young Adult > Reference in Canada. Henkjan 14 nov: "Prima" (= ja). Geplande taak 16 nov 16:30 UTC. Tekst:
  > Subject: Amazon.ca category placement - Stocking Stuffers For Teens (ASIN B0DJQLBM75)
  > Hello KDP Support, on November 13 I updated the categories of my paperback "Stocking Stuffers For Teens: The Weirdest, Smartest, Most Hilarious 408 Facts You Will Ever Hear" (ASIN B0DJQLBM75, ISBN 9798342200967) to Teen & Young Adult > Reference and Teen & Young Adult > Games & Activities > Questions & Answers. On Amazon.ca the book now appears in Children's Books > Activities, Crafts & Games > Games > Questions & Answers and Party Games instead. The book is written for teenagers (reading age 12-17). Could you please place it on Amazon.ca in Books > Teen & Young Adult > Education & Reference > Reference (browse node 20941581011) and, if possible, Teen & Young Adult > Questions & Answers (browse node 202398473011)? Thank you, kind regards. Meld in elke ronde of de nodes al live zijn en de rang tegen #1. Hardcover van Teens gebouwd op 13 nov uit Henkjans Kindle Create-bestand (408_facts_interior.kpf): 5,5 x 8,5 met bleed, 147 p., omslag 13,0983 x 9,918 (kdp/bouw/teens); wordt zondag 15 nov aangemaakt (hardcoverplek 2) en gaat via Amazon.com ook naar Amazon.ca. Check met Keepa get_products (domain ca, raw: categories bevat 20941581011) en get_best_sellers (20941581011, ca, 3).

## Openstaand

- Hardcovers Wait, That's True?! (B0HRKRTRFF) en For Men (B0HRHVDSRT) Live, $24,99 (gezien 14 nov 17:30 UTC).
- Stocking Stuffers for Adults Kindle (B0DJ3MHCH4, A284PODSXOKXOK): KDP-kwaliteitsmelding "Keywords are missing"; 14 nov 7 zoekwoorden ingevuld en als concept bewaard (stocking stuffers for adults, white elephant gifts for adults funny, fun facts trivia book for adults, bathroom reader for adults, gifts for men who have everything, secret santa gifts for coworkers, conversation starters book for adults). Henkjan klikt Publish: https://kdp.amazon.com/en_US/title-setup/kindle/A284PODSXOKXOK/pricing
- Kindle-eBooks Wait, That's True?! (A1NZ4PXA2W9L9O) en For Men (A34DE110B1IJJG): Publish faalt met "Please fix the highlighted error(s)" zonder rood veld. 14 nov gecontroleerd: Details en Content Complete, Pricing "In Progress", alle velden gevuld (KDP Select aan, alle territoria, 70%, US $4,99). Publish is Henkjans knop: links in het rapport; blijft het falen, dan KDP Support (alleen met Henkjans ja).
- 15 nov 12:30 UTC: Adventskalender für Männer LIVE: paperback B0HRRCXTNV, hardcover B0HRR4JXPP. Volgende: Duitse boekgids op kaufberater.best, Amazon-ads DE (als de marktplaats in het advertentieaccount zit; max EUR 10/dag, ads <= 50% van EUR 5,74 royalty), PropellerAds DE $5/dag alleen met Henkjans ja. Moment mal paperback GHCXH02H6WW staat 15 nov 12:30 weer op Draft zonder zichtbare fout: Henkjan opnieuw Publish laten klikken en de melding vragen.
- 15 nov: Adventskalender paperback + hardcover en Teens hardcover door Henkjan gepubliceerd, in review (rondes: controleren tot live, dan ASIN's in de boekgidsen en kaufberater). Moment mal paperback GHCXH02H6WW door Henkjan gepubliceerd 15 nov, in review. Nog Publish bij Henkjan: Adults-eBook (zoekwoorden, "Live with unpublished changes") https://kdp.amazon.com/en_US/title-setup/kindle/A284PODSXOKXOK/pricing en de 2 Kindle-eBooks (Draft). KDP-weeklimiet: 1 nieuwe paperback en 2 nieuwe hardcovers per week. Moment mal hardcover: zondag 22 nov 00:12 UTC (trig_01MxsrBoD9gioX5ZQd7kpUuB). Les: krijg je bij Save and Continue van een nieuwe titel "An error occurred", kijk eerst op de boekenplank; het concept kan al aangemaakt zijn.
- 15 nov 15:17 UTC: biedingen LC NIEUWJAAR herijken (trig_01XFKR9gQ6X5ahE3CiEckxBh).
- Lasting Change: paperback-upgrade live op 14 nov (nieuwe beschrijving "Another year is almost over...", #880 in Time Management). Hardcover B0F3TL9TWR staat "Live with unpublished changes": Henkjan klikt Publish op https://kdp.amazon.com/en_US/title-setup/hardcover/6FFFY398EVH/pricing; herinneren in elke VOL-ronde tot het weg is.
- Boekgidsen whichtobuy.best (12, sinds 14 nov; proef wtb-kdp-boekgidsen-1114): 14 nov Request indexing gedaan voor /stocking-stuffers-for-teens en /fun-facts-books-for-adults, daarna "Quota exceeded"; sitemap opnieuw ingediend, IndexNow 200. Ronde A en B 15 nov: in Chrome Search Console (property https://whichtobuy.best/, vak "Inspect any URL" bovenaan, dan REQUEST INDEXING) de overige 10 aanvragen tot de quota op is, rest de volgende ronde: book-of-enoch, griddle-cookbook, slow-cooker-cookbook-for-beginners, habit-change-workbook, large-print-word-search-for-seniors, coin-collecting-book-for-beginners, funny-stocking-stuffers-for-adults, bible-coloring-books-for-kids, apocrypha-book, pellet-grill-cookbook. Controlegroep (6 cadeaugidsen) NIET aanvragen. Afgevinkt hier bijhouden. 15 nov 06:50 UTC: aangevraagd book-of-enoch, griddle-cookbook, slow-cooker-cookbook-for-beginners, habit-change-workbook, large-print-word-search-for-seniors, coin-collecting-book-for-beginners, funny-stocking-stuffers-for-adults, bible-coloring-books-for-kids; daarna weer Quota exceeded (limiet ~8-10 per dag). Nog over: apocrypha-book, pellet-grill-cookbook (ronde A 16 nov).
