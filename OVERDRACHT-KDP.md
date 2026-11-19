# Overdracht KDP-boeken van Henkjan (Amazon KDP + Amazon Ads)

Live: https://hjdk-api-henq.vercel.app/api/wtb?op=kdpoverdracht (Vercel-inlog; in een Claude-chat met de Vercel-tool web_fetch_vercel_url). Bovenaan staan de laatste KDP-regels uit het werklog, daarna dit bestand, het draaiboek (kdp/rapport.md), de wachtrij en de boekwedstrijd. Bron: OVERDRACHT-KDP.md in repo henkjandekrijger-glitch/hjdk-api. Bijgewerkt: 19 nov 2026.

Werk je verder (ander account, andere chat)? Lees dit hele document, schrijf na elke stap een regel in het werklog (`/api/mm/handover?log=<tekst>&wie=kdp-<jouw chat>`) en zet nieuwe kennis in kdp/rapport.md (draaiboek) en zo nodig hier. Commit met expliciete bestandsnamen, eerst `git pull --rebase`, push naar main.

## 1. Doel en opdracht van Henkjan

- Doel: KDP-royalty dit kerstseizoen 10x, naar $1.000 per dag ("We moeten naar 1000 per dag", "ik wil naar nr 1 en 1k Royalties per dag"). Vorig jaar 15 nov-25 dec 2025: $11.084 (gem. $270/dag, beste dagen half dec $600-700).
- 13 nov: "Ja je mag dus alles doen als ROI maar maximaal is . En je hier dagelijks minimaal 4 x rapporteert ." Elke stap die het rendement verhoogt doe je zelf en meld je daarna.
- 15 nov: elk rapport heeft een regel ORGANISCH (keuzehulpen). 16 nov: "HOu mn ROI in de gaten en de ROAS !!"
- Taal: Nederlands, kort, compleet. Nooit nulgroei tonen. Geleerde lessen niet herhalen. Zuinig met tokens.

## 2. Harde regels

- Hoogstens $10 per dag per campagne. Uitzonderingen alleen met Henkjans woord ("Regel blijft vraag bij uitzonderingen"). Gekregen: Teens CA-duw (AUTO en PT elk CA$20/dag), PIT BOSS-duw (oordeel op totaal), LC-duw.
- Margeregel: alle ads van een boek samen hoogstens 50% van de royalty van dat boek. Pushes worden beoordeeld op totale royalty tegen de basis.
- Alle ads samen hoogstens ~$100 per dag netto.
- Amazon-campagnes: Dynamic bids down only, Limit reach to Amazon, "Increase bids for high-traffic days" uit. Geen bod boven max CPC (zie draaiboek, ROI en ROAS).
- PropellerAds voor KDP: alleen wijzigen na Henkjans "ja" in de chat; geen conversie-postback naar PropellerAds voor KDP. Nu staat alles van KDP op PropellerAds uit.
- Nooit campagnes in bulk herstarten ("Meld me wat je terug zet niet alles zomaar aan zetten").
- Publish-knoppen in KDP zijn van Henkjan: zet alles klaar als concept en stuur hem de link. Het vakje "I confirm that my answers are accurate" (AI-vragen) is een verklaring namens hem: laat dat ook aan hem.
- Nooit wachtwoorden typen; inloggen doet Henkjan. Nooit sleutels in code, pagina's of URL's. Zijn e-mailadres staat nergens.
- KDP-inhoud: geen dubbele inhoud met eigen boeken (vertalen mag), geen merk- of reekstitels van anderen, geen verzonnen reviews, quotes of studies, geen gedachtestreepjes in gepubliceerde tekst.

## 3. Wat je nodig hebt (toegang)

- Repo henkjandekrijger-glitch/hjdk-api met push (add_repo, clone naar /home/claude/hjdk-api, register_repo_root).
- Claude in Chrome op Henkjans computer, ingelogd in ZIJN Amazon-account voor KDP (kdp.amazon.com, kdpreports.amazon.com) en Amazon Ads (VS, Canada, VK). Let op: op 19 nov zat de Chrome in een ander Amazon-account (lege boekenplank, Ads vraagt registratie). Vraag Henkjan dan in te loggen; typ zelf niets.
- Vercel-connector (web_fetch_vercel_url) voor handover, boekstand en dit document.
- Keepa-connector voor rang en concurrenten: sinds 18 nov "No active API plan found" (Henkjan beslist over verlengen). Let op: Amazon ververst de verkooprang in VS en CA sinds ~16 nov niet; gebruik KDP Reports.
- PropellerAds-connector (Propads_Henkjan_versions) alleen voor Apocrypha-historie; niets wijzigen zonder ja.

## 4. Rondes: 4 keer per dag

| Ronde | UTC | Curacao | Soort |
|---|---|---|---|
| A | 06:20 | 02:20 | VOL: verkoop gisteren per boek, alle ads, ROI/ROAS, optimaliseren, boekwedstrijd, indexaanvragen |
| B | 12:20 | 08:20 | TUSSEN |
| C | 17:20 | 13:20 | TUSSEN |
| D | 22:20 | 18:20 | TUSSEN + dagafsluiting |

**19 nov 15:40 UTC (Henkjan: "Andere account neemt over"):** de rondes en het campagnebeheer liggen nu bij het andere account. De send_later-keten van de oorspronkelijke chat (session_018fX8wVRvYzXXcTu4rMFhXp) is gestopt; die chat doet alleen nog LC 2027 (paragraaf 7) en de geplande boekronde van zondag 22 nov 00:12 UTC (trig_01MxsrBoD9gioX5ZQd7kpUuB: Moment mal-hardcover en de volgende paperback). Het nieuwe account plant zijn eigen 4 rondes zoals hieronder. Eerste oordeel dat nu bij het nieuwe account ligt: PIT BOSS-duw (20 nov ronde A).

**Neemt een ander account over?** Spreek met Henkjan af wie de rondes draait, zodat ze niet dubbel lopen: de oude keten stopt met delete_trigger op de id's hierboven (alleen het account dat ze maakte kan dat), of door de stap 0 niet meer uit te voeren. Het nieuwe account maakt 4 terugkerende geplande taken (create_trigger, cron `20 6 * * *`, `20 12 * * *`, `20 17 * * *`, `20 22 * * *`, de computer van Henkjan nodig) met de tekst hieronder; stap 0 (send_later) is dan niet nodig. Het rapport gaat dan als eindbericht van de run (en met PushNotification als dat er is).

Opdrachttekst ronde A (VOL):

> KDP-ronde A, 06:20 UTC, soort VOL (Henkjan 13 nov: "Ja je mag dus alles doen als ROI maar maximaal is . En je hier dagelijks minimaal 4 x rapporteert .", 15 nov: "Geef hier ook altijd organische resultaten van de keuzehulpen ." en 16 nov: "HOu mn ROI in de gaten en de ROAS !!").
> 1. add_repo henkjandekrijger-glitch/hjdk-api met push-toegang, clonen naar /home/claude/hjdk-api, register_repo_root (bestaat de map al: git pull --rebase). Lees de overdracht https://hjdk-api-henq.vercel.app/api/wtb?op=kdpoverdracht (web_fetch_vercel_url): regels, stand, draaiboek kdp/rapport.md, wachtrij en boekwedstrijd.
> 2. Voer de ronde VOL uit zoals in kdp/rapport.md: verkoop gisteren per boek (KDP Reports in Chrome), ads per boek op beide platforms tegen royalty met ROAS tegen break-even en doel (gisteren en 7 dagen; geen bod boven max CPC), stopregels en opschalen, Teens-rang in Canada tegen #1, boekwedstrijd (3 nieuwe kandidaten scoren), ORGANISCH van de keuzehulpen (web_fetch_vercel_url https://hjdk-api-henq.vercel.app/api/wtb?op=boekstand&m=us, tegen gisteren) plus indexaanvragen in Search Console (8 tot 10 per dag, boekgidsen eerst) en IndexNow voor gewijzigde gidsen. Doe zelf alles wat het rendement maximaliseert binnen de grenzen (hoogstens $10/dag per campagne, margeregel); Publish-knoppen in KDP laat je aan Henkjan (stuur de link).
> 3. Rapport kort Nederlands, alleen wat nieuw is: VERKOOP eerst, ROI (per boek met ads: kosten, ad-omzet, ROAS tegen break-even en doel, ROI op royalty, plus totaal alle ads; gisteren en 7 dagen), ORGANISCH, wat ik veranderde, wat werkt en wat niet, Teens-rang, top 3 wachtrij, tempo naar 10x.
> 4. Nieuwe kennis, gewijzigde campagnes en een regel onder Organisch in kdp/rapport.md (commit met expliciete bestandsnaam, push) en log in de handover (web_fetch_vercel_url https://hjdk-api-henq.vercel.app/api/mm/handover?log=...&wie=kdp-rapport). Reageert Chrome niet: nieuw tabblad maken en het oude sluiten; lukt het dan niet, meld dat kort en doe de rest.

Opdrachttekst rondes B, C en D (TUSSEN; bij D "met dagafsluiting"): gelijk aan A met stap 2 en 3 zo:

> 2. Voer de ronde TUSSEN uit zoals in kdp/rapport.md: ads van vandaag per campagne (Amazon US, Canada en VK), ROAS per boek tegen break-even (geen bod boven max CPC), stopregels toepassen, campagnes zonder vertoningen een stap omhoog binnen de marge, zoektermen met aankoop exact toevoegen, verkoop vandaag tot nu, status van openstaande KDP-wijzigingen, en ORGANISCH (boekstand, tegen de vorige regel onder Organisch).
> 3. Rapport in hooguit 7 regels Nederlands, alleen wat nieuw is: verkoop vandaag, kosten vandaag, ROI (ROAS per boek tegen break-even en ROI op royalty, plus totaal), ORGANISCH, wat ik veranderde, wat opviel. Ronde D sluit de dag af: royalty en ads van vandaag in totaal en plan voor morgen.

## 5. Stand 19 nov 2026

Cijfers: royalty 16 nov $60,18, 17 nov $50,87 (ads $28,62); november 1-18 $310,85. 18 en 19 nov nog niet binnengehaald (Chrome in verkeerd account). Vorig jaar half november ~$101/dag.

Royalty per boek 2025 / okt-dec 2025: PIT BOSS $13.496 / $5.258; Lasting Change $10.254 / $5.182 (plus oude editie $4.407); Teens $4.427 / $4.202; Apocrypha $2.018 / $747; Mom's Word Search $2.009 (Moederdag); Adults $612 / $502; Python Workbook $311 (geen duw).

**Amazon US** (advertising.amazon.com, entity ENTITY2QK5HDABOJQO8):

| Campagne | Id | Stand |
|---|---|---|
| PIT BOSS EXACT | A043648439COJRMAUIRWM | $10/dag, oude biedingen (~350 woorden $1,02, 2 woorden $1,52): DUW 17-19 nov |
| PIT BOSS - SP - Manual KW | A06472010M5G9DRRZ8PS | $10/dag, oude biedingen ($0,45/1,00/0,88/0,80): DUW |
| Lasting change LASTING CHANGE KW | A04830353R9IVCG7VO45Z | $10/dag, 4 broad-woorden $1,02 (DUW sinds 17 nov), exacte woorden $0,57-0,66 |
| B0F1SM1L5J-AUTO (LC) | A03228661CQIWZXX5IXLQ | Loose $0,60, andere groepen uit |
| KDP LC NIEUWJAAR EXACT | A00430132MU3YXJN4IMNK | gepland 20 dec-31 jan, $10/dag |
| KDP Wait Thats True EXACT | A05992682MW2DU09KSFTY | 10 woorden $0,35 |
| KDP For Men KERST EXACT 0.45 | A094841238T75L5P00YDA | 12 kerstwoorden $0,45-0,50 |
| KDP Feitenboeken PT concurrenten 0.35 | A002679099X7YQ0MNAMT | 11 boekpagina's $0,35 |
| KDP Crock Pot EXACT | A1041734BNY8PUAJFCY2 | $0,45 |
| KDP Griddle EXACT | A06363731IM3I67SGN8N7 | $0,50 |
| Traeger Cerebro BROAD Copy 2 | A07419671HF50HRG5N4MG | klein |
| Enoch Cerebro KW 0.12 | A0731099I4B9XDZBQXPG | $5/dag |
| PIT BOSS Cerebro BROAD2, Enoch scaling KW | A08157981F0U0IXIHTP17, A07314352JF7DPT0LBI2X | gepauzeerd 15 nov (kliks zonder verkoop) |

**Amazon Canada** (advertising.amazon.ca, entity ENTITY1M4S6BSL29IE3):

| Campagne | Id | Stand |
|---|---|---|
| KDP Teens CA AUTO | A00785372M8F3DEDU6DQR | CA$20/dag; Close 0,65, Complements 0,50, Loose 0,58, Substitutes 0,85 |
| KDP Teens CA PT concurrenten | A06071251IK63T2R1K3RO | CA$20/dag, 14 producttargets op voorgesteld bod |
| KDP Teens CA EXACT | A00497891W6LJG83V0FN2 | gepauzeerd |
| KDP Adults CA AUTO, 17nov | A07207233G0Q4GG7X0I10 | CA$10/dag, alleen Adults B0DJQS1K5Z, groepen 0,65/0,50/0,58/0,85; aan sinds 18 nov ~10:40 UTC |

**Amazon VK** (advertising.amazon.co.uk, entity ENTITY1PRAGR2NUXBCU): Aut Experiment UK (A0809704ERKZFTUU8LIM), GBP 8/dag, alleen Apocrypha B09YTZ72KZ en Enoch B0B5KV79N1; Close GBP 0,18, Loose 0,20, Substitutes 0,15, Complements uit. Vervangt PropellerAds Apocrypha.

**Amazon DE**: console vraagt eenmalige login van Henkjan (advertising.amazon.de, ENTITYNF358E6R5PN1); plan voor de Adventskalender staat in het draaiboek.

**PropellerAds KDP**: alles uit.

## 6. Lopende duwen en oordelen

| Wat | Oordeel | Regel |
|---|---|---|
| Teens CA-duw (sinds 14 nov) | tussen 18 nov: +$52,49 extra royalty tegen $43,83 ads = door. Eind 21 nov (trig_01NZvwHBWJPUGeSsczafDMJA) | Teens CA-royalty boven basis $4,79/dag moet de Teens CA-ads dekken; verlengen alleen met Henkjans woord |
| PIT BOSS-duw 17-19 nov (prijs $14,99 sinds 17 nov) | 20 nov ronde A | PIT BOSS-royalty dagen 17-19 lager dan PIT BOSS-ads = alle biedingen terug naar $0,40. Dag 1: $8,95 ads, 1 verkoop, -$3,89 |
| LC-duw (sinds 17 nov 13:00 UTC) | 18-20 nov | totale LC-royalty tegen LC-ads; lager = broad-woorden weer pauzeren. Piek LC is 27 dec-3 jan |
| Adults CA-test | 22 nov | Adults CA-royalty tegen Adults CA-ads |
| Apocrypha/Enoch VK | doorlopend | 2 dagen geen vertoningen = stap omhoog binnen de marge |

Break-even ROAS: Teens CA 2,93; PIT BOSS ($14,99) 4,61; LC ($24,99) 2,10 (break-even ACOS 47,7%); Adults ongeveer als Teens. Volledige tabel met max CPC: draaiboek, ROI en ROAS.

## 7. Boeken in de maak

- **Lasting Change Workbook 2027** (oorspronkelijke chat). Stand 19 nov 15:40 UTC: heel nieuw binnenwerk gebouwd, 89 pagina's 6x9 zwart-wit, fonts ingebed, marges gecontroleerd (bouwer kdp/bouw/lc2027: inhoud.py, motor.py, bouw.py; `python3 bouw.py uit.pdf`). Opzet: voorwerk (hoe het werkt, kies een gewoonte, dag 0, contract, buddy), 4 weken met elk een openingsspread, 30 dagen als spread (links idee, 3-minutenactie, waarom met echte bron, eigen oefening per dag; rechts oefening en vaste dagelijkse check-in met 30-dagenbalk), weekreviews, dag 30 met certificaat, achterin dag 31-120, slechte-dagkaart, 2 gewoonteplannen, wins, 15 echte bronnen. Concept-PDF naar Henkjan gestuurd. Volgende: paginatelling en trim van de huidige uitgave in KDP (6FFFY398EVH) lezen; wijkt het aantal pagina's af, dan moet de rug van de omslag mee; uploaden als concept; Publish is Henkjans knop. Henkjan 17 en 19 nov: zelfde boek (B0F1SM1L5J), nieuw binnenwerk, "HEEL ERG GOED", "ik wil 5 sterren voor dit boek".
- **Moment mal, das stimmt?! Für Männer** paperback GHCXH02H6WW: nieuwe omslag zonder rugtekst staat als concept; Henkjan vinkt de AI-verklaring aan en publiceert. Hardcover 22 nov (trig_01MxsrBoD9gioX5ZQd7kpUuB).
- Volgende in de wachtrij: Stocking Stuffers For Teen Girls (81, eigen nieuwe feiten), Would You Rather? Stocking Stuffers for Kids & Teens (72), Klobuch DE (77). Zie wachtrij.

## 8. Wacht op Henkjan

- Chrome inloggen in zijn boekenaccount (KDP en Ads).
- Moment mal Publish: https://kdp.amazon.com/en_US/print-setup/paperback/GHCXH02H6WW/content
- Adults Kindle Publish (zoekwoorden): https://kdp.amazon.com/en_US/title-setup/kindle/A284PODSXOKXOK/pricing
- LC hardcover "Live with unpublished changes" Publish: https://kdp.amazon.com/en_US/title-setup/hardcover/6FFFY398EVH/pricing
- Keepa-abonnement verlengen of niet.
- Inloggen op advertising.amazon.de (Adventskalender-ads).
- Kindle-eBooks Wait, That's True?! en For Men: Publish faalt bij KDP zonder rood veld.

## 9. Lessen die tijd besparen

- KDP Royalties Estimator: getypte datums verversen alleen het totaal; de tabel per boek ververst pas na klikken op begin- en einddag in de kalender. Marktplaats: Deselect All, Canada, Apply. KDP loopt een dag achter; KDP gaat voor Keepa.
- Amazon Ads: de tabel heeft een eigen datumkiezer los van de KPI-tegel (Lifetime, Yesterday). Zoekvak leegmaken met de knop "Clear search terms", niet overtypen.
- Nooit een generieke "Apply" met JS klikken: de rij heeft een eigen Apply voor het voorgestelde bod (17 nov ging zo een VK-bod per ongeluk omlaag).
- In instellingenvelden werkt ctrl+a niet (tekst wordt voorgeplakt; budget werd CA$1.020). Zet waarden met de native value-setter (`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set`, daarna input- en change-event) en klik Save; controleer na herladen.
- Bod in een popover: triple-click op het veld, getal typen, Save. Bulk: Targeting, alles aanvinken, Bulk actions, Adjust bid, Set bid to.
- Auto-campagnes: elke targetinggroep heeft een eigen bod; het standaardbod van de ad group geldt daar niet.
- Campagne kopieren: rijmenu, Copy. De kopie staat op pauze; nieuwe advertenties staan "Pending review" en hun schakelaar werkt pas na de review.
- Instellingen: Dynamic bids "down only" = LEGACY, alleen Amazon = MINIMIZE_SPEND.
- KDP "An error occurred" bij Save and Continue van een nieuwe titel: eerst op de boekenplank kijken; het concept kan al bestaan (een tweede klik kost de weeklimiet). Weeklimiet: per formaat 2 nieuwe titels aanmaken en 2 indienen, reset zondag 00:00 UTC.
- Chrome reageert niet: nieuw tabblad, oude sluiten. Onbereikbaar: kort melden en de rest doen.

## 10. Bestanden

- kdp/rapport.md: draaiboek met campagnes, royalty per verkoop, ROI en ROAS, Organisch-log en openstaande punten (nieuwste onderaan in Openstaand staan per datum).
- kdp/wachtrij.md en kdp/boekwedstrijd.md: welk boek als volgende (scorekaart van 100, elke ochtend 3 kandidaten).
- kdp/bouw/: bouwers (bouw_boek.py binnenwerk, omslag_gen.py, bouw_epub.py), per boek een map met config, feiten en kdp.json; kdp/bouw/lc2027 voor de nieuwe LC.
- lib/kdp-guides.js en /api/wtb?op=boekstand: boekgidsen op whichtobuy.best en kaufberater.best (organisch).
- lib/werking.js: korte werking van het geheel (KDP-regels).
