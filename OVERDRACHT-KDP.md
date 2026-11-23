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

**19 nov 15:40 UTC (Henkjan: "Andere account neemt over"):** de rondes en het campagnebeheer liggen nu bij het andere account. De send_later-keten van de oorspronkelijke chat (session_018fX8wVRvYzXXcTu4rMFhXp) is gestopt; LC 2027 is op 19 nov 20:50 UTC ook overgedragen (paragraaf 7a); in de oude chat staat alleen nog de geplande boekronde van zondag 22 nov 00:12 UTC (trig_01MxsrBoD9gioX5ZQd7kpUuB: Moment mal-hardcover en de volgende paperback). Het nieuwe account plant zijn eigen 4 rondes zoals hieronder. Eerste oordeel dat nu bij het nieuwe account ligt: PIT BOSS-duw (20 nov ronde A).

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
| KDP LC NIEUWJAAR EXACT | A00430132MU3YXJN4IMNK | loopt sinds 20 nov, $10/dag, tot 22 nov 0 vertoningen (bod te laag, kost dus niets); 20 dec omhoog, zie decemberplan |
| KDP Definitive Apocrypha US EXACT 0.40 \| 23nov | A0245750H215ZXJWBAV5 | start 25 nov (na de update met 147 p. en $14,99, royalty $5,49), $10/dag, down only, 14 exacte woorden op $0,40 (voorgesteld $0,32-0,38): apocrypha, the apocrypha, apocrypha book(s), the apocrypha book, kjv apocrypha, king james apocrypha, apocrypha kjv, books of the apocrypha, books removed from the bible, lost books of the bible, books left out of the bible, deuterocanonical books, apocrypha bible. Bewust niet: het merk THE COMPLETE APOCRYPHA en Covenant Press-titels (merkklacht 2024). Check 25 nov (trig_018cc5P5KTmCc81fWAiCkgxW): update niet live = pauzeren |
| KDP Adults US AUTO 0.38 \| 22nov | A039358795EOJP34ZDKI | nieuw 22 nov (Henkjan: "Ja adults aan"): $5/dag, automatisch, bod $0,38 (voorgesteld $0,31-0,54), down only, hoog-verkeerregel uit, alleen Adults B0DJQS1K5Z ($9,99, 74 reviews). Let op: rang 22 nov 18:15 Curacao VS #1,2 mln, CA #15.490 (CA$13,99): Adults verkoopt in Canada, de VS-test is dus een proef op een nieuwe markt |
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
| KDP Adults CA AUTO, 17nov | A07207233G0Q4GG7X0I10 | CA$10/dag, alleen Adults B0DJQS1K5Z; Close 0,85 (sinds 22 nov), Complements 0,50, Loose pauze, Substitutes 0,55; top of search +30% (22 nov); aan sinds 18 nov ~10:40 UTC |

**Amazon VK** (advertising.amazon.co.uk, entity ENTITY1PRAGR2NUXBCU): Aut Experiment UK (A0809704ERKZFTUU8LIM), GBP 8/dag, alleen Apocrypha B09YTZ72KZ en Enoch B0B5KV79N1; Close GBP 0,23 (was 0,18, voorgesteld 0,23), Loose 0,26 (was 0,20, voorgesteld 0,37), Substitutes 0,15, Complements uit (23 nov). Vervangt PropellerAds Apocrypha. Lifetime 625 aankopen, ACOS 39%; uitgaven zakten vanaf juni 2026 van GBP 300-550 naar ~GBP 10 per maand; 16-22 nov GBP 3,13, 2 aankopen (ACOS 12%).

**Amazon DE**: console vraagt eenmalige login van Henkjan (advertising.amazon.de, ENTITYNF358E6R5PN1); plan voor de Adventskalender staat in het draaiboek.

**PropellerAds KDP**: alles uit.

## 6. Lopende duwen en oordelen

| Wat | Oordeel | Regel |
|---|---|---|
| Teens CA-duw (sinds 14 nov) | tussen 18 nov: +$52,49 extra royalty tegen $43,83 ads = door. Eind 21 nov (trig_01NZvwHBWJPUGeSsczafDMJA) | Teens CA-royalty boven basis $4,79/dag moet de Teens CA-ads dekken; verlengen alleen met Henkjans woord |
| PIT BOSS-duw 17-19 nov (prijs $14,99 sinds 17 nov) | 20 nov ronde A | PIT BOSS-royalty dagen 17-19 lager dan PIT BOSS-ads = alle biedingen terug naar $0,40. Dag 1: $8,95 ads, 1 verkoop, -$3,89 |
| LC-duw (sinds 17 nov 13:00 UTC) | 18-20 nov | totale LC-royalty tegen LC-ads; lager = broad-woorden weer pauzeren. Piek LC is 27 dec-3 jan |
| LC-prijs terug naar $24,99 | 20 dec ronde A | Henkjan 19 nov: akkoord op $19,99 bij de 2027-uitgave om rang op te bouwen, en op 20 dec (start KDP LC NIEUWJAAR EXACT) terug naar $24,99 (royalty $12,48). Ronde zet het prijsconcept klaar en stuurt Henkjan de link voor Publish |
| Adults CA-test | 22 nov: 7 dagen CA$6,20, 11 kliks, 1 verkoop (CA$13,99, zoekterm "books"). Te weinig om een exacte campagne uit te oogsten; draait door (geeft ~CA$1,50/dag uit) | Adults CA-royalty tegen Adults CA-ads |
| Adults US-test (sinds 22 nov) | 29 nov ronde A | Adults-ads (US + CA) hoogstens 50% van de Adults-royalty, anders US-test uit. Gehaald en ACOS onder ~35%: US naar $10/dag en de verkopende zoektermen als exacte woorden erbij (bod = voorgesteld) |
| Cadeauboeken afbouwen | 19 dec ronde A | decemberplan sectie 11: Teens en Adults terug naar de biedingen van voor de push, Kindle blijft |
| LC-omschakeling | 20 dec ronde A | decemberplan sectie 11: NIEUWJAAR naar voorgesteld bod, LC broad-woorden aan, elk hoogstens $10/dag tot 31 jan; rem 50% van LC-royalty over 3 dagen |
| Apocrypha/Enoch VK | doorlopend | 2 dagen geen vertoningen = stap omhoog binnen de marge |

Break-even ROAS: Teens CA 2,93; PIT BOSS ($14,99) 4,61; LC ($24,99) 2,10 (break-even ACOS 47,7%); Adults ongeveer als Teens. Volledige tabel met max CPC: draaiboek, ROI en ROAS.

## 7. Boeken in de maak

- **Lasting Change Workbook 2027**: klaar om te uploaden, zie 7a.
- **Moment mal, das stimmt?! Für Männer** paperback GHCXH02H6WW: nieuwe omslag zonder rugtekst staat als concept; Henkjan vinkt de AI-verklaring aan en publiceert. Hardcover 22 nov (trig_01MxsrBoD9gioX5ZQd7kpUuB).
- Volgende in de wachtrij: Stocking Stuffers For Teen Girls (81, eigen nieuwe feiten), Would You Rather? Stocking Stuffers for Kids & Teens (72), Klobuch DE (77). Zie wachtrij.

### 7a. LC 2027: zo pak je het op (overgedragen 19 nov 2026, 20:50 UTC)

Henkjan 19 nov: "Zet even in handover op vercel dan kan ik in andere account op pakken ." Het nieuwe account neemt LC 2027 nu over, net als de rondes.

**Wat het is.** Zelfde boek (paperback ASIN B0F1SM1L5J, titel, ondertitel en auteur liggen vast: 130 reviews blijven), helemaal nieuw binnenwerk en nieuwe omslag. Henkjan: "HEEL ERG GOED", "ik wil 5 sterren voor dit boek", "frontpage met 2027 erop en quote over niet nog een jaar weggooien", achterkant "Moet veel meer raken ... niet negatief", QR "waarmee ze me kunnen appen voor advies ... Dear John, I am reader and have a question".

**Bestanden (repo, map kdp/bouw/lc2027):**
- `binnenwerk.pdf`: 126 pagina's, 6 x 9 in, zwart-wit, geen bleed, alle fonts ingebed, marges binnen 0,8 / buiten 0,6 in (gecontroleerd: geen tekst buiten de veilige zone, geen gedachtestreepjes).
- `omslag.pdf`: hele omslag 12,534 x 9,25 in (6 x 9 met 0,125 bleed, rug 0,284 in voor 126 p. wit papier), 300 dpi, zonder losse fonts.
- Opnieuw bouwen: `cd kdp/bouw/lc2027 && python3 bouw.py binnenwerk.pdf` (reportlab, fonts in fonts/, QR met `pip install segno`) en `python3 omslag.py 126 omslag.pdf` (Playwright/Chromium, Inter Display uit /usr/share/fonts/opentype/inter). Inhoud staat in `inhoud.py`, opmaak in `motor.py` en `bouw.py`.

**Inhoud:**
- Voorwerk: titelpagina met NEW FOR 2027 en "Don't throw away another year.", inhoud, hoe het werkt, de 30-dagenkaart, kies een gewoonte, dag 0, contract, check-in-uitleg, buddy en snelstart met QR.
- 4 weken: Start tiny, Make it easy on hard days, Make it stick, Make it me. Elke week heeft een openingsspread; elke dag is een spread met een eigen oefening, een "Why it works" met echte bron en een vaste dagelijkse check-in. Weekreviews op dag 7, 14, 21 en 28; dag 30 met certificaat.
- Deel 2, dag 31-66: één pagina per dag met een vraag en een mini check-in (66 dagen = mediaan uit Lally et al. 2010).
- Achterin: tracker 67-120, slechte-dagkaart met QR, 2 gewoonteplannen, wins, 15 bronnen, slotwoord met QR.

**Omslag:**
- Voorkant: huisstijl van nu (LASTING zwart, CHANGE rood gespiegeld, WORKBOOK), badge NEW FOR 2027 en "Don't throw away another year." Bewust niet "2027 Edition": een nieuwe editie zou een nieuw boek zonder reviews betekenen.
- Achterkant: "Make 2027 the year it finally sticks.", "It was never about willpower. It was about the plan.", 5 punten en "Next December, you'll be glad you started today." Gekozen na 4 agenten (copywriter, psycholoog, Amazon-markt, lezerspanel).
- QR naar WhatsApp van Henkjan: https://wa.me/31655395630?text=Dear%20John%2C%20I%20am%20a%20reader%20and%20have%20a%20question. Staat op de achterkant linksonder en binnenin op p. 13, 121 en 126. Alle QR's zijn met een decoder gecontroleerd.
- Niet op de voorkant: onleesbaar als Amazon-plaatje, en het ontwerp blijft rustig. Henkjan mag hem er alsnog op willen.
- Een doorstuurlink met teller kon niet, want het project lastingchange staat op pauze bij Vercel.

**Stand 19 nov 21:20 UTC (nieuw account, op Henkjans "voer door"): paperback staat klaar, wacht op Henkjan.** Paperback-id is 6FFFY398EVH (hetzelfde id als de hardcover, het formaat staat in de URL). Huidige uitgave was 182 p., 6 x 9, groundwood-papier, met bleed. Gedaan op de Content-pagina: papier naar wit (de rug van de omslag is op wit gebouwd; beter om in te schrijven), No Bleed, binnenwerk.pdf en omslag.pdf geupload, Previewer zonder meldingen (126 p., rugtekst binnen de lijnen, barcode vrij van de QR), Approve. Dit blijft na herladen staan. Drukprijs $2,51 (was $3,07). Beschrijving: de QR-zin staat erin (Details, Save Successful). Prijsconcept staat op $19,99 (royalty $9,48; bij $24,99 is het $12,48); Canada volgt de VS (CA$27,27, royalty CA$13,09).
NIET opgeslagen: de AI-antwoorden. KDP bewaart die alleen samen met het vakje "I confirm that my answers are accurate", en dat vakje is van Henkjan; zonder het vakje weigert ook Save as Draft. Henkjan doet op https://kdp.amazon.com/en_US/print-setup/paperback/6FFFY398EVH/content : AI-Generated Content = Yes; Texts = Entire work, with minimal or no editing, tool Claude; Images = One or a few AI-generated images, with minimal or no editing, tool Claude (de omslag is door Claude opgemaakt; wil hij "None", dan is dat zijn keuze); Translations = None; vakje aan; Save and Continue; op de prijspagina de prijs kiezen en Publish.
Nog te doen: hardcover (nu 137 p., wit, met bleed, drukprijs $7,29): zelfde binnenwerk, eigen omslag met de maten uit de KDP-cover-calculator; pas bouwen als Henkjan de paperback heeft gezien, zodat een wijziging aan de omslag niet twee keer hoeft.

**Stappen in KDP (Chrome moet in Henkjans boekenaccount zitten; op 19 nov zat de Chrome van de oude chat in een leeg account):**
1. Boekenplank, zoek "Lasting Change". Open de paperback (B0F1SM1L5J) en kijk op Paperback Content naar trim, papier en het huidige aantal pagina's (geschat ~170 p. uit drukkosten $3,07). Let op: 6FFFY398EVH kwam ook als hardcover-id voor (hardcover B0F3TL9TWR); neem het id uit de boekenplank.
2. Trim moet 6 x 9 zijn, wit papier, zwart-wit, geen bleed. Wijkt de trim af, dan moet `bouw.py` (W, H in motor.py) en `omslag.py` (TRIM_W, TRIM_H) mee: een trimwijziging kan niet op hetzelfde boek, dus dan eerst Henkjan vragen.
3. Manuscript: upload `binnenwerk.pdf`. Book cover: kies "Upload a cover you already have", upload `omslag.pdf`. Launch Previewer, controleer dat er geen meldingen zijn (rug, marges), Approve.
4. AI-vragen: tekst door Claude (Entire work, minimal editing), afbeeldingen geen, vertalingen geen. Het vakje "I confirm that my answers are accurate" is van Henkjan.
5. Save as Draft. Op Paperback Details de beschrijving aanvullen met de zin uit `kdp/bouw/lc/kdp.json` (beschrijving_2027_extra). Geen nummer of link in de beschrijving, want dat is een KDP-regel.
6. Prijs: blijft $24,99. Bij 126 p. is de drukprijs ~$2,51 en de royalty ~$12,48 (was $11,92); lees de echte waarde op de prijspagina en zet die in kdp/rapport.md (Royalty per verkoop en ROI en ROAS).
7. Publish is Henkjans knop: stuur hem de link https://kdp.amazon.com/en_US/title-setup/paperback/<id>/pricing .
8. Daarna de hardcover B0F3TL9TWR: zelfde binnenwerk, eigen omslag (rug en hinge volgens de KDP-calculator, `omslag.py` heeft nog geen hardcovermodus; voorbeeld in kdp/bouw/omslag_gen.py met hard=...). Doel: alles live voor 15 dec.

**Let op:** de geplande boekronde van zondag 22 nov 00:12 UTC (trig_01MxsrBoD9gioX5ZQd7kpUuB: Moment mal-hardcover en de volgende paperback) draait nog in de oude chat. Doet het nieuwe account die ronde zelf, dan zet Henkjan die taak uit (uitzetten vanuit de oude chat werd geblokkeerd).

### 7b. Omslagen 2027 (23 nov 2026, Henkjan: "Check alle booeken en maak nieuwe covers 2027 als nodig", "Maak goede CTAs en fris voorkanten lekker op", "Ja maak alles en zet erin")

Van 101 boeken hadden er 11 een oud jaartal op de omslag. Nieuwe omslag (voor, rug, achter met CTA) gebouwd met kdp/bouw/omslag2027 (zie LEESMIJ.md) en op de Content-pagina geupload; Previewer zonder fouten en Approve bij 9 boeken:
Apocrypha JMB92DMKYAP, Griddle 4B9BMX0XG7J, High Blood Pressure M8308T2BWC9, Bariatric EXPECWTNR8Y, DBT 4F1NDPS3VAZ, Quantum 633CJ9Z9ND2, Mom's Word Search E8HW2RW0Q7A, 9000 Word Search J7A0BYZNPBT, Airbnb WWJH22W4BVX.
- Henkjan per boek op de Content-pagina: AI-Generated Content = Yes; Images = One or a few AI-generated images (tool Claude; de omslag is door Claude opgemaakt); Texts = None, tenzij het binnenwerk ook met AI is gemaakt (weet hij); vakje "I confirm" aan; Save and Continue; Publish op de prijspagina.
- Books of Enoch A7CVDBYEZGH: nieuwe omslag staat erin, maar de Previewer gaf een fout op het OUDE binnenwerk ("Unsupported fonts ... LucidaGrande"). Origineel manuscript was weg. Opgelost: PDF-proef uit de Previewer (KDP_PRINT_INTERIOR_SPREAD, 62 spreads) gesplitst naar 121 pagina's 8,5 x 11 (pagina 1 = rechts op spread 1, laatste spread "Proof" weg), alleen de 16 spreads met Lucida via ghostscript -dNoOutputFonts naar contouren. Bestand (33 MB, te groot voor file_upload) staat in Henkjans Downloads als "BOOKS OF ENOCH 2027 binnenwerk.pdf"; Henkjan uploadt het als manuscript, Previewer, Approve.
- High Blood Pressure: beschrijving had emoji (KDP weigert) en gezondheidsbeloftes; nieuwe beschrijving zonder emoji en zonder claims opgeslagen (Save Successful, 23 nov). Andere boeken op emoji controleren als Henkjan erop stuit.
- Manifest Your Sh*t journal (B0DMFSY1LR) heeft "for 2025" in de titel; titel van een gepubliceerde paperback kan niet veranderen, dus 2027 wordt een nieuw boek. Voorkant staat klaar in voor.py; binnenwerk moet nog.

## 8. Wacht op Henkjan

- Omslagen 2027 (7b): AI-vragen en Publish voor 9 boeken; manuscript Books of Enoch aanleveren.

- Chrome inloggen in zijn boekenaccount (KDP en Ads).
- Moment mal Publish: https://kdp.amazon.com/en_US/print-setup/paperback/GHCXH02H6WW/content
- Adults Kindle Publish (zoekwoorden): https://kdp.amazon.com/en_US/title-setup/kindle/A284PODSXOKXOK/pricing
- LC hardcover "Live with unpublished changes" Publish: https://kdp.amazon.com/en_US/title-setup/hardcover/6FFFY398EVH/pricing
- Keepa-abonnement verlengen of niet.
- Inloggen op advertising.amazon.de (Adventskalender-ads).
- Kindle-eBooks Wait, That's True?! en For Men: Publish faalt bij KDP zonder rood veld.

## 9. Lessen die tijd besparen

- KDP Content-pagina van een live boek: uploads (manuscript, omslag), papier, bleed en de goedkeuring in de Previewer worden direct bewaard, ook zonder Save. De AI-antwoorden niet: na een nieuwe upload eist KDP het vakje "I confirm that my answers are accurate" en weigert anders ook Save as Draft; na de Previewer springen de AI-antwoorden terug naar de oude stand. Laat ze dus aan Henkjan, met de antwoorden erbij.
- Uploaden vanuit een cloudsessie kan met file_upload op de verborgen file-input (ref uit find), pad in de repo-clone, hoogstens 3,8 MB per keer.
- Papiersoort (wit, creme, groundwood) is op een live zwart-witboek nog te wijzigen; trim niet. Lees de papiersoort voor je een rug berekent.
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
- Specs per boek: op de boekenplank zoekt het zoekvak ook op ASIN (paperback-id uit de content-link); op de Content-pagina geven de aangevinkte radio's papier (BW_WHITE, BW_CREAM, COLOR_WHITE = standaard kleur, COLOR_COLOR = premium kleur), bleed en glans; "Page count: n" en "Trim Size" staan in de tekst. Meerdere Previewers tegelijk kan in aparte tabbladen; Approve-knop via find (JS vindt hem niet).
- Een nieuwe omslag laat de Previewer ook het oude binnenwerk opnieuw keuren: oude manuscripten met niet-ingesloten lettertypes geven dan een fout die eerder niet blokkeerde.
- Amazon-omslagbeelden zijn hoogstens 1000 px breed: te klein om te drukken. Bouw de omslag opnieuw (tekst als vector) en vergroot alleen foto's.

## 10. Bestanden

- kdp/rapport.md: draaiboek met campagnes, royalty per verkoop, ROI en ROAS, Organisch-log en openstaande punten (nieuwste onderaan in Openstaand staan per datum).
- kdp/wachtrij.md en kdp/boekwedstrijd.md: welk boek als volgende (scorekaart van 100, elke ochtend 3 kandidaten).
- kdp/bouw/: bouwers (bouw_boek.py binnenwerk, omslag_gen.py, bouw_epub.py), per boek een map met config, feiten en kdp.json; kdp/bouw/lc2027 voor de nieuwe LC; kdp/bouw/omslag2027 voor de omslagen 2027 (voor.py, wrap.py, voor-na.jpg).
- lib/kdp-guides.js en /api/wtb?op=boekstand: boekgidsen op whichtobuy.best en kaufberater.best (organisch).
- lib/werking.js: korte werking van het geheel (KDP-regels).

## 11. Kerstsprint (Henkjan 20 nov 2026: "Check status . En go we gaan niet hard genoeg . Kom met een plan .")

**Wie wat doet:** beslissingen komen uit de oorspronkelijke KDP-chat (Henkjan 20 nov: "We gaan hier nu bepalen"); het andere account draait de rondes en volgt de regels met "BESLUITEN HENKJAN" in het werklog.

**Besluiten 20 nov:**
1. Wait That's True en For Men naar $9,99: ja (Publish is Henkjans knop).
2. PIT BOSS-ads uit: gedaan 15:15 UTC, beide campagnes op pauze. Niet weer aanzetten.
3. Teens Australië A$10/dag als korte test: ja. Wacht op Henkjans eenmalige login op amazon.com.au (de AU-console vraagt inloggen).
4. LC blijft $19,99 en start nu: KDP LC NIEUWJAAR EXACT (A00430132MU3YXJN4IMNK) loopt sinds 20 nov (was 20 dec), tot 30 jan, $10/dag.

**Stand bij de start (20 nov):** royalty nov 1-20 $379, laatste 7 dagen $209 (~$30/dag); ads 7 dagen $144, ROAS 1,46. Vorig jaar 15 nov tot 25 dec gemiddeld $270/dag. Doel tot 20 dec: ~$60/dag eind november, $150-250/dag van 10 tot 20 december, LC in januari. $1.000/dag is met de huidige titels niet haalbaar (daarvoor ~20 titels van ~$50/dag; volgend jaar in augustus beginnen).

**Plan:**
1. Elke zondag de weeklimiet vol, en nieuwe titels eerst als hardcover lanceren (hardcover heeft een eigen limiet). Wat na ~6 dec live komt, mist kerst.
   - Zo 22 nov: Echt jetzt?! (Teens in het Duits, paperback + hardcover, klaar in kdp/bouw/teens_de) en de Moment mal-hardcover.
   - Zo 29 nov: Stocking Stuffers for Teen Girls (VS/CA), Teens in het Frans (FR + CA), Stocking Stuffers for Kids 8-12.
2. Teens overal waar hij verkoopt omhoog: Australië (test), VK en VS alleen met het model dat werkt (AUTO Substitutes, PT Interesting Facts); A+ vergelijkingstabel met de hele reeks.
3. Nieuwjaar: 2027-planners onder het LC-merk (habit tracker 2027, goal planner 2027), gebouwd met de LC-bouwer.
4. Geen ads waar de ROAS onder break-even zit zonder dat de totale royalty stijgt.
5. Bestaande boeken beter laten werken (Henkjan 23 nov: "Ja doe"): elke maandag 2 instructieproeven op live boeken (beschrijving, zoekwoorden, categorieën, prijs of A+; één onderdeel per boek, oordeel na 14 dagen tegen controle), regels en logboek in kdp/rapport.md, sectie Instructieproeven. Boekwedstrijd: elke ochtend minstens 30 kandidaten bedenken, voorselectie met Demand Radar, Keepa alleen voor de top 5 (kdp/boekwedstrijd.md regel 1).

**Per boek (21 nov, nov 1-21 $413):** Teens maakt 63% van de royalty. De nieuwe titels (LC, WTT, For Men, Adventskalender, Moment mal) brachten in november $0. Les: ads op een titel zonder reviews verkopen niet; elk rapport begint met royalty per boek.

**Gedaan 21 nov:**
- Ads uit op de titels zonder reviews: KDP Wait Thats True EXACT | 12nov, KDP For Men KERST EXACT 0.45 | 13nov, KDP Feitenboeken PT concurrenten 0.35 | 13nov, KDP For Men CA PT op Teens. Alle vier op pauze. Pas weer aan met reviews.
- Nieuw: KDP Bible Color AUTO 0.15 | 21nov (A05440301GA9J3I32O129), VS, auto, bod $0,15, $5/dag, down only, sites Amazon, geen bodverhoging op drukke dagen. Bible Color verkoopt organisch (41 reviews, $9,81). Na 7 dagen oordelen: ACOS boven de marge = uit.
- Australië: de vier bestaande AU-campagnes staan op pauze (Australia auto Experiment A00584943OIP94V35W3YL op A$100/dag en drie op A$25/dag). Niet aanzetten; de Teens-test (A$10/dag, alleen Teens) wacht op Henkjans login op amazon.com.au.

**Reviews (Henkjan 21 nov: "Je kunt boeken bijna weggeven vr reviews"; akkoord KDP Select; geen StoryOrigin of andere reviewdiensten: "Ik haat die dingen"):**
- Kindle-eBooks Wait That's True (A1NZ4PXA2W9L9O) en For Men (A34DE110B1IJJG): KDP Select aan, $4,99, 70%, als concept bewaard. Publish is Henkjans knop (voor Claude geblokkeerd): https://kdp.amazon.com/en_US/title-setup/kindle/A1NZ4PXA2W9L9O/pricing en https://kdp.amazon.com/en_US/title-setup/kindle/A34DE110B1IJJG/pricing. Faalt het weer zonder rood veld, vraag Henkjan de melding.
- Zodra live: gratis dagen plannen (KDP Select > Promotions), 5 per 90 dagen, het liefst 2 dagen begin december.
- Reviewpagina met QR achterin: Echt jetzt?! (kaufberater.best/r/echtjetzt, binnenwerk in kdp/bouw/teens_de vernieuwd, 80 p.), Moment mal (/r/momentmal), Adventskalender (/r/advent), For Men (whichtobuy.best/r/men); paginatal gelijk. Nog te doen: Wait That's True (bouw_binnenwerk.py, /r/wtt), Teens (/r/teens; binnenwerk is Henkjans KPF), de live boeken opnieuw uploaden (Publish bij Henkjan). ASIN van Echt jetzt?! en Moment mal invullen in REV in fn/wtb.js zodra live. Scans: /api/wtb?op=rev&stand=1.
- Zondag 22 nov: ook Kindle-versies van Echt jetzt?! en Moment mal (EPUB uit bouw_epub.py), in KDP Select.

**22 nov (zondag):** geplande zondagsupload is NIET afgegaan; handmatig gedaan in de KDP-chat.
- Royalty 22 nov tot 15:45 UTC $45,87 (14 orders, Teens 10), 21 nov $34,65 (11). Nov 1-22 $488 (Teens $311). Ads laatste 7 dagen ~US$130 (CA$186), 19 aankopen via ads; Teens CA AUTO CA$88 voor 12 aankopen (CA$7,35 per aankoop, royalty CA$4,78): werkt via de rang, niet per klik.
- Moment mal paperback LIVE (B0HRY6CYMD, ingevuld in REV). Moment mal hardcover (GHCXH02H6WW, ISBN 9798144920421) klaar als concept: binnenwerk met review-QR, omslag 13,944 x 10,417, glanzend, AI ingevuld (Claude, hele werk, ook vertaling), prijs EUR 19,99 incl. btw (lijst 18,68, royalty EUR 5,26), US $22,99, UK GBP 16,99. Publish bij Henkjan: https://kdp.amazon.com/en_US/print-setup/hardcover/GHCXH02H6WW/pricing
- LC 2027 (Henkjan 22 nov: "nieuwe inhoud en voorkant uploaden voor 2027"): binnenwerk (126 p.) en omslag (12,534 x 9,25) uit kdp/bouw/lc2027 geupload op paperback 6FFFY398EVH, Previewer goedgekeurd, AI Texts = Entire work, minimal or no editing (Claude), als concept bewaard. Henkjan: vinkje "I confirm that my answers are accurate", Save and Continue, prijs $19,99 laten staan, Publish: https://kdp.amazon.com/en_US/print-setup/paperback/6FFFY398EVH/content
- Echt jetzt?! paperback (PJ1XJ9RVJTP, ISBN 9798144924412) klaar als concept: DE, 3 categorieen (Jugendbücher > Bildung & Nachschlagewerk > Sachliteratur > Enzyklopädien; Geschenkbücher > Humor; Geschenkbücher > Advent & Weihnachten), 7 zoekwoorden, leeftijd 12-17, binnenwerk met review-QR, glanzend, AI ingevuld, EUR 9,99 incl. btw (lijst 9,34, 50% royalty EUR 2,62; vanaf lijst 9,99 = EUR 10,69 incl. zou 60% geven, EUR 3,94). Publish bij Henkjan: https://kdp.amazon.com/en_US/print-setup/paperback/PJ1XJ9RVJTP/pricing
- Echt jetzt?! hardcover (ISBN 9798144925815): details, content, Previewer goedgekeurd; prijzen ingevuld (EUR 17,99 incl., royalty EUR 4,14) maar NIET bewaard: Chrome viel weg voor Save as Draft. Prijzen opnieuw invullen (DE lijst 16,81, US 22,99, UK 16,99) en Publish: https://kdp.amazon.com/en_US/print-setup/hardcover/PJ1XJ9RVJTP/pricing
- Nog te doen: Kindle-versies van Echt jetzt?! en Moment mal (EPUB en cover in kdp/bouw/teens_de en wissen), KDP Select aan.
- NIEUW BOEK (Henkjan 22 nov: "Ok maak dit boek . Schrijver David Warrior . Daarna upload in book shelf met alles geoptimaliseerd ."): **Ich tu nur so, als ob: Das Überlebensbuch fürs Büro** (kdp/bouw/buero_de), Duits kantoorhumor-cadeauboek voor het wichtelen, 102 p. 6x9 wit, eigen tekst (Büro-Übersetzer 80 zinnen, Ausreden-Generator 20x20x20 plus 42 fertige, 6 bingokaarten plus 2 lege, 4 tests met horoscoop, 6 woordzoekers, 4 doolhoven, 24 Buchstabensalat, invulpagina's, bucketlist 60, 20 afwezigheidsberichten, 50 wijsheden, Büro-Deutsch A-Z, Weihnachtsfeier-gids, oorkonde, oplossingen, review-QR /r/buero). Omslag eigen ontwerp (geel notitieblaadje op marineblauw, rugtekst; rug 0,2297 in, marges 0,07 in). Op het omslag en in de ondertitel "Büro-Bingo" in plaats van "Bullshit" (Amazon Ads keurt grof taalgebruik in titel en omslag af); binnenin en in de zoekwoorden staat Bullshit-Bingo wel. Paperback-concept TVP91RHQFAW (ISBN 9798144943925): details (DE, 7 zoekwoorden, 3 categorieen Geschenkbücher > Weitere Anlässe & Themen > Arbeit & Wirtschaft, Geschenkbücher > Humor, Geschenkbücher > Advent & Weihnachten), binnenwerk en omslag geupload, glanzend. Bouwen: `python3 bouw.py && python3 omslag.py` in kdp/bouw/buero_de. Previewer zonder meldingen (rugtekst binnen de lijnen, barcode vrij), Approve. AI: Texts Entire work minimal editing (Claude), Images One or a few minimal editing (Claude, omslag en puzzels met code), Translations none. Prijs Amazon.de lijst 9,34 = EUR 9,99 incl. btw (50%, royalty EUR 2,62, drukprijs EUR 2,05), UK GBP 7,99 (60%, GBP 2,86), rest afgeleid van Amazon.de (US $10,24, CA $14,69). Op Henkjans woord (22 nov: "Ok zet in mijn booksherlf en publiceer .") gepubliceerd 22 nov ~17:20 UTC: status In review. Weeklimiet paperback is hiermee op (Echt jetzt + dit boek); hardcover kan zondag 29 nov.
- TEENS-PUSH (Henkjan 22 nov 15:49 Curacao: "Ja" op agressief pushen; doel "200 dollar per dag" totaal): 
  - Nieuw: KDP Teens CA WINNERS EXACT TOS | 22nov (A0959523MR7L7KZ6QC4), CA$15/dag, down only, top of search +50%, 10 exacte woorden uit de verkopende zoektermen van AUTO (stocking stuffers for teens, teen stocking stuffers, stocking stuffers for teen girls/boys, stocking stuffers for 14 year old male teen, funny gifts for teen boys op CA$0,60; gag gifts, stocking stuffers, teenage boy stuff, funny christmas gifts under 10 op CA$0,45).
  - KDP Teens CA AUTO: Loose match CA$0,40 -> 0,48 (+20%, voorgesteld 0,70-1,00), top of search +30% (beste ACOS 34%), Teens hardcover B0HRRLD4SV als tweede advertentie. Close match blijft op pauze. Uitgaven waren gezakt naar CA$3-5/dag op 20-21 nov.
  - KDP Teens CA PT concurrenten: budget CA$20 -> CA$5 (gaf ~CA$3/dag uit), zodat het plafond Teens CA CA$40/dag blijft (AUTO 20 + WINNERS 15 + PT 5).
  - Nieuw: KDP Teens US PT concurrenten 0.35 | 22nov (A0542953168TGZVTR79VN), $10/dag, down only, exacte producttargets op 8 concurrerende feitenboeken (B0B6XFT4RH, 1648451438, B0FTF7LH51, 164845044X, 1951806409, 1546595902, 1648451233, 1648451306).
  - Piekuren-biedingen bestaan niet in de console (geen schema voor biedingen); vervangen door top of search.
  - 23 nov 21:15 UTC (Henkjan 23 nov: "200 per dag moeten we naar toe ."): WINNERS kreeg in 1,5 dag 84 vertoningen en CA$0,43 uitgaven, biedingen lagen ver onder het voorgestelde bod. Nu: funny christmas gifts under 10 en stocking stuffers for teen boys CA$1,00 (voorgesteld 1,47 en 1,60, plafond 1,00), funny gifts for teen boys 0,87, gag gifts, stocking stuffers en teenage boy stuff 0,52, stocking stuffers for teen girls en teen stocking stuffers 0,61 (allemaal voorgesteld bod); stocking stuffers for teens (0,60, voorgesteld 0,56) en 14 year old male teen (geen voorstel) bleven. Budget blijft CA$15, rem hieronder geldt. Bulk: rijen aanvinken, Bulk actions, Adjust bid, Set bid to.
  - Stand 23 nov 21:10 UTC: vandaag $24,99 royalty (9 orders, Teens $22,27); november 54% Canada, 16% VK, 14% VS.
  - REM: Teens-royalty moet uiterlijk 26 nov >= $80-90/dag zijn en Teens-ads hoogstens 50% daarvan. Zo niet: WINNERS pauzeren, Loose terug naar 0,40, TOS 0%, US test uit. Dagcheck 12:40 UTC via send_later (23-26 nov).
- DECEMBERPLAN RANG (BESLUITEN HENKJAN 22 nov 16:43 Curacao: "zetten we live en voorbereiden met campagnes op december met ranking ?" en "Ja adults aan"). Rang komt van veel verkopen in korte tijd, dus het geld gaat naar het venster waarin gekocht wordt: cadeauboeken tot 18 dec, LC van 20 dec tot eind januari.
  - Nu: Henkjan publiceert LC 2027, Moment mal hardcover, Echt jetzt?! paperback en hardcover, Kindle WTT en For Men (links in het bericht van 22 nov). Daarna zet een ronde de Kindle-versies van Echt jetzt?! en Moment mal als concept klaar (EPUB en kindle_cover.jpg in kdp/bouw/teens_de en wissen, KDP Select aan) en vult de ASIN's in REV in fn/wtb.js.
  - Adults: KDP Adults US AUTO 0.38 | 22nov aan ($5/dag); oordeel 29 nov (tabel 6).
  - 1-5 dec: per Kindle-titel in KDP Select 2 gratis dagen (WTT, For Men, Echt jetzt?!, Moment mal), zodat de eerste reviews er voor de piek staan. Geen ads op titels zonder reviews (les 21 nov).
  - 1-18 dec: Teens-push loopt door binnen de rem; Adults volgt als hij de check van 29 nov haalt.
  - 19 dec ronde A: laatste dagen voor kerstbezorging van gedrukte boeken. Teens- en Adults-campagnes terug naar de biedingen van voor de push (Loose 0,40, TOS 0%, WINNERS en US-tests op pauze); Kindle-advertenties blijven.
  - 20 dec ronde A, LC-omschakeling: KDP LC NIEUWJAAR EXACT naar het voorgestelde bod (had tot 22 nov 0 vertoningen), de 4 broad-woorden in Lasting change LASTING CHANGE KW weer aan, B0F1SM1L5J-AUTO Loose naar voorgesteld bod. Elk hoogstens $10/dag, tot 31 jan. Prijs naar $24,99 volgens besluit 19 nov (Publish bij Henkjan). Rem: LC-ads over 3 dagen hoogstens 50% van de LC-royalty, anders broad-woorden weer uit.
  - Henkjan eenmalig: inloggen op advertising.amazon.de (Duitse titels, pas met reviews) en amazon.com.au (Teens AU-test).
- SCHAALREGEL (BESLUITEN HENKJAN 22 nov 18:25 Curacao: "Ok voor ranking opties door en agressief adverteren . Als het loont hoger budget per dag . ROAS moet dan stijgen ."), elke ronde A:
  - Royalty-ROAS per boek = royalty van het boek in alle markten (KDP-dashboard) / ads van dat boek, 3 dagen.
  - Omhoog: campagne gaf op 2 van de 3 dagen >= 80% van haar budget uit, royalty-ROAS >= 2 en hoger dan de 3 dagen ervoor: budget +30%. Mag dan boven $10/dag en boven de Teens CA-grens CA$40/dag.
  - Terug: royalty-ROAS na een stap 2 dagen op rij lager: vorig budget. Hoogstens 1 stap per campagne per 2 dagen. Elke stap in het werklog met de cijfers.
  - Rang 22 nov 18:15 Curacao: Teens CA #1.619 (#10 Curiosities & Wonders, #17 Trivia), VS #1,14 mln; Adults CA #15.490, VS #1,2 mln. Vorig jaar Teens CA 14 nov #840, 20 dec #99.
  - Gedaan 22 nov 22:40 UTC: KDP Adults CA AUTO Close match CA$0,65 -> 0,85 (voorgesteld 0,72; de enige groep met een verkoop, ACOS 9%), top of search 0% -> +30%. Loose blijft op pauze, Substitutes 0,55 en Complements 0,50 ongewijzigd.
  - Niet gedaan: Teens VS AUTO. Teens VS $9,99 heeft break-even max CPC $0,16 (kdp/rapport.md); alleen de PT-test van vandaag loopt.
- 22 nov avond door Henkjan gepubliceerd: LC 2027 paperback (updates in review), Moment mal hardcover (B0HSLVZT38), Echt jetzt?! hardcover (B0HSM3KSBN, ingevuld in REV) en paperback (in review), Kindle Wait That's True (in review). Kindle For Men (A34DE110B1IJJG) bleef Draft: Publish geeft een fout. Alle drie de pagina's slaan foutloos op; verborgen vinkje "geen DRM, downloaden mag" stond aan terwijl DRM aan staat, uitgezet. Paperbacks WTT en For Men staan nog op "Live with unpublished changes" ($9,99, besluit 20 nov): Publish bij Henkjan.
- APOCRYPHA EN BIBLE COLOR (23 nov, Henkjan: "check potentie moet meer te halen zijn", "Apo is alleen UK . Opfrissen ? 2027 edities ? Beter camps ? Prijszen oorlog ?"):
  - The Complete Apocrypha (B09YTZ72KZ, KDP 8D8EDKSSF7R) is sinds juni 2024 weg uit de VS: Covenant Press heeft het Amerikaanse merk "THE COMPLETE APOCRYPHA" en diende een klacht in (mail legal@ccc.one 5 jun 2024). Titel nooit opnieuw in de VS gebruiken. In het VK nummer 1 van de soort: #113.009 (54-Book #168k, 180-Book #170k, 100-Book #347k) en de goedkoopste (GBP 12,99 tegen 21-30). Geen prijsoorlog; na kerst eventueel GBP 14,99 testen.
  - VS-vervanger The Definitive Apocrypha (B0DDBTXC9J, KDP JMB92DMKYAP): #2,0 mln, 18 reviews, drukkosten $7,73 bij $13,99 = $0,66 royalty. Nieuwe 2027-omslag staat klaar (7b). Grootste kans: compacter binnenwerk (zelfde 16 boeken, drukkosten ~$4,40 zoals Complete) en $14,99 = ~$4,60 royalty, dan VS-ads op apocrypha. VS-top: 54-Book #15.542 (5.246 reviews, $32,95), 2018 Edition #16.987 (7.785 reviews, $14,56). Henkjan 23 nov 11:10: "US gaan we verbeteren". Gedaan 23 nov: compact binnenwerk uit zijn Google Doc (kdp/bouw/apocrypha, 139 p., EB Garamond, twee kolommen, review-QR whichtobuy.best/r/apo) en omslag met rug 0,3153 in (omslag2027/wrap.py, 140 p.). 23 nov 16:45 UTC geupload: binnenwerk 147 p. (kop en paginanummer binnen de KDP-marge na 1 Previewer-fout "text outside the margin"), omslag rug 0,3333 in (148 p.), Previewer goedgekeurd, prijs VS $14,99 bewaard (druk $3,50, royalty $5,49). Henkjan: AI-vragen, vinkje I confirm, Save and Continue, Publish (WhatsApp gestuurd). Check 26 nov (trig_018cc5P5KTmCc81fWAiCkgxW): live? dan VS-campagne voorstellen.
  - Bible Color By Number (B0D2KZGWYJ): VS #688.459, 41 reviews, ~$2,68 per verkoop; leider Busy Kid #66.514 (228 reviews, $9,99). KDP Bible Color AUTO had 18 vertoningen in 7 dagen op $0,15: Close en Loose naar $0,25 (23 nov), budget $5. Seizoen is Pasen.
- Keepa geeft "No active API plan": rondes die Keepa gebruiken zien geen rang en reviews meer.

**Voorstel 21 nov, wacht op akkoord:** (1) Teens overal: CA-push door tot 20 dec, AU-test, VS/VK lage boden op concurrenten; (2) volg wat organisch verkoopt (Bible Color VS, Apocrypha VK); (3) geen ads op titels zonder reviews; (4) PIT BOSS 1 dec opnieuw met de 11 winnaars op $17,99.

**Echt jetzt?! (kdp/bouw/teens_de):** 400 Duitse feiten in 20 hoofdstukken, gebaseerd op Teens maar gecorrigeerd: de vele mythes en dubbelingen uit het Engelse boek (o.a. Mona Lisa vrije dag, 17 spieren om te lachen, kauwgom 7 jaar) zijn vervangen door feiten die kloppen. 80 p. 6x9, wit, Wahr-oder-falsch-quiz. Omslag in de Teens-stijl (zwart, geel, emoji), geen rugtekst (80 p.), hardcover-omslag 13,944 x 10,417 in (rug 0,369, gelijk aan de Adventskalender; controleer in de KDP-calculator). Prijs EUR 9,99 (past in het wichtelbudget van 10 euro), hardcover EUR 17,99. Metadata en beschrijving: kdp.json. Bouwen: `python3 bouw_boek.py teens_de uit.pdf` (vanuit kdp/bouw) en `python3 omslag_cfg.py 80` / `python3 omslag_cfg.py 80 hard`.
