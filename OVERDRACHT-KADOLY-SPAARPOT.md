# Overdracht Kadoly Spaarpot

Levend document voor elke chat en elk account dat aan de Kadoly Spaarpot werkt of hem test.
Live te lezen (met de stand van dit moment bovenaan): https://hjdk-api-henq.vercel.app/api/gids?op=dkoverdracht
(in een Claude-chat met de Vercel-tool `web_fetch_vercel_url`; de host zit achter de Vercel-inlog van team henq).

Bron in de repo: `OVERDRACHT-KADOLY-SPAARPOT.md` (dit bestand), code in `lib/dagkans.js`.
Werk dit bestand bij in dezelfde commit als elke wijziging aan de Spaarpot: de juiste sectie en één regel in het logboek (nieuwste bovenaan).

---

## 1. In één alinea

De Kadoly Spaarpot is een dagelijkse mail waarmee mensen samen tegoed sparen voor een gratis cadeau van Kadoly (kadoly.com).
Je start met een gevulde pot: bij je aanmelding staat er meteen €5 in. Elke ochtend krijg je één mail met wat je samen met je vrienden gespaard hebt.
Klik je, dan krijg jij €0,10 en krijgt elke vriend €0,10. Klikt een vriend, dan krijg jij €0,10. Jij klikt voor hen, zij klikken voor jou.
Na de klik staat het cadeau-idee van vandaag bovenaan (een product van Kadoly), zodat elke klik ook naar een product leidt.
Is je pot genoeg, dan kies je een cadeau tot €30 en sturen wij het gratis op. Geen loting: wat je spaart, is van jou. Geen kansspel, dus het loopt gewoon altijd.

## 2. Stand (20 nov 2026)

| Onderdeel | Stand |
|---|---|
| Testwereld | Werkt. Versie met startpot en samen klikken getest op 20 nov (lokaal en live). |
| Live | **Staat uit.** Gaat pas aan op Henkjans woord (KV-sleutel `dk:aan`). |
| Live-adres | Nog niet gekozen. Nu alleen bereikbaar via `/api/gids?op=dk` op de testhost. Bij de start komt er een nette route op gids.kadoly.com (voorstel: `/spaarpot`). |
| Advertenties | Acht advertenties voor e-mailadressen in NL gemaakt op 20 nov (zie logboek); nog niet geplaatst, netwerk en budget op Henkjans woord. |
| Bedragen | Startpot €5 (Henkjan 20 nov: "We starten met een gevulde spaarpot"); de rest door Claude gekozen, nog niet bevestigd (zie 4.2). |
| Pot als korting in de kassa | Nog niet mogelijk; de kassa van kadoly.com moet daarvoor een kortingscode kunnen maken (open punt). |

## 3. Hoe het zo gekomen is

- 14 nov 2026, Henkjan: *"Stel we maken dagelijkse nieuwsbrief waarin als je opent ... Je gratis een product kunt kiezen als je gewonnen hebt. Kan alleen als je streak van minimaal 10 dagen of doorgestuurd naar minimaal 10 mensen en is ook geopend door hen."*
- Daarna: *"Sterker? Verhoog je kans per vriend die ook doorstuurt."* en *"Bouw het en laat het me zien op test url zodat we samen goed kunnen testen. Voordat je bouwt doe nog een keer grondige assessment."*
- Eerste versie: **Kadoly Winterkans**, een dagelijkse loting met lootjes per vriend. Omdat dat een promotioneel kansspel is, moest die tijdelijk zijn (t/m 31 jan 2027) en onder €4.500 aan prijzen blijven (Gedragscode Promotionele Kansspelen, art. 8).
- Dezelfde avond, Henkjan: *"Je krijgt een tegoed met elkaar. We kunnen het nog slimmer maken een tegoed opbouwen gewoon samen zonder dat je win kans hebt."* en *"Gewoon altijd."*
- Daarom is de loting vervangen door de **Spaarpot**: geen kans, dus geen kansspel, geen einddatum, geen prijzenplafond en geen kansspelbelasting. De Winterkans bestaat niet meer.
- 17 nov 2026, Henkjan: *"Zet uitgebreide MD op vercel dan kan ik gaan testen in ander account."* Dit document.
- 19 nov 2026, Henkjan: *"Niet duidelijk wat krijgen ze dan iedere ochtend?"* De ochtendmail bood alleen €0,10; te weinig om elke dag te openen.
- 20 nov 2026, Henkjan: *"We starten met een gevulde spaarpot?"* en *"Iedere dag krijg je in je mail wat je SAMEN gespaard hebt dus als iemand klikt krijg je beiden een punt. Jij klikt voor hen. Zij klikken voor jou. En WEER klikken naar product."* Daarom: startpot €5, elke klik geeft direct ook al je vrienden €0,10, de ochtendmail toont wat je samen gespaard hebt, en na de klik staat het cadeau-idee van vandaag bovenaan. Vrienden van vrienden tellen niet meer mee (eenvoudiger).

## 4. Werking

### 4.1 Voor een deelnemer

1. **Aanmelden** op de aanmeldpagina ("Start met een gevulde spaarpot"): e-mailadres plus vinkje "Ik ben 18 jaar of ouder en woon in Nederland". Kwam je via de link van een vriend, dan staat er "Een vriend nodigde je uit".
2. **Bevestigen**: mail "Bevestig je Kadoly Spaarpot" ("je pot staat klaar, met €5 erin"). De knop opent een pagina die zichzelf na 0,4 seconde bevestigt. Pot: €5 startpot + €0,10 voor de eerste klik = €5,10.
3. **Elke ochtend** rond 07:04 Nederlandse tijd één mail.
   - Met vrienden: onderwerp "Samen gespaard: €X · klik voor je vrienden"; kop "Samen gespaard: €X" (jouw pot plus die van je vrienden), "Gisteren klikten N vrienden voor je: +€Y in jouw pot.", "Jouw pot: €Z. Nog €W, dan kies je <cadeau> gratis.", knop "Klik voor je vrienden", eronder "Jij krijgt €0,10 en je N vrienden krijgen elk €0,10."
   - Zonder vrienden: onderwerp "Je pot: €X · klik voor vandaag"; knop "Klik voor vandaag"; eronder "Er komt €0,10 in je pot. Nodig een vriend uit, dan klikken jullie voor elkaar."
   - Onderaan: hoe je Henkjan bereikt (antwoorden, of app of bel +31 6 55395630), voorwaarden, afmelden met één klik.
4. **Klikken**: de knop opent een pagina die na 0,3 seconde zelf de klik doorgeeft (POST). Bots en linkscanners krijgen die automatische klik niet; zonder JavaScript is er een knop.
5. **De potpagina na de klik**, in deze volgorde:
   - kop "Je pot: €X";
   - blok **Samen gespaard: €X** (of **Vandaag** zonder vrienden): "+€0,10 voor je klik, en je klik gaf N vrienden elk €0,10", "+€Y, want N vrienden klikten vandaag voor je", "Gisteren klikten N vrienden voor je", reeksbonus, "Dag N op rij";
   - **Je pot is genoeg voor een cadeau** met knop "Kies je cadeau" (alleen als dat zo is);
   - **Cadeau-idee van vandaag**: één product groot met foto, prijs en levertijd en knop "Bekijk bij Kadoly", plus twee kleine (links naar kadoly.com met `utm_source=spaarpot`);
   - **Nog €X** met balk en het eerstvolgende cadeau (als de pot nog niet genoeg is);
   - **Samen sparen**: met hoeveel vrienden je spaart, knop "Deel via WhatsApp" en je eigen link;
   - onderaan Voorwaarden en Afmelden.
6. **Cadeau kiezen**: lijst met alle cadeaus die je pot nu dekt, met foto, prijs en levertijd. Kies één, vul naam en Nederlands adres in, klaar. Het bedrag gaat van je pot af; je spaart gewoon door.
7. **Afmelden** met één klik onder elke mail (ook via de afmeldknop van de mailapp, List-Unsubscribe-Post). Per ongeluk? Knop "Meld me weer aan".

### 4.2 Bedragen en regels

Alle bedragen staan in centen bovenaan `lib/dagkans.js` in `R`:

| Regel | Waarde | In `R` |
|---|---|---|
| Startpot bij aanmelding | €5, één keer per persoon | `start: 500` |
| Per klik (per dag) | €0,10, direct | `tik: 10` |
| Reeksbonus | €1 op elke 10e dag op rij | `reeksElke: 10`, `reeksBonus: 100` |
| Per klik van een vriend | €0,10 voor jou, direct | `vriend: 10` |
| Van vrienden samen per dag | hooguit €0,90 | `vriendMax: 90` |
| Pot | hooguit €30 | `potMax: 3000` |
| Cadeau | tot €30 incl. verzending; levertijd bekend en hooguit 7 werkdagen, of onbekend (kortste eerst) | `prijsMax: 30`, `leverMax: 7` |
| Vriend telt mee na | 3 klikdagen van de nieuwe | `vriendDagen: 3` |
| Geen ochtendmail meer na | 14 dagen zonder klik (link blijft werken) | `rustNa: 14` |
| Pot vervalt na | 30 dagen zonder klik, ook wat vrienden spaarden | `vervalNa: 30` |

- **Vrienden** zijn wie jou uitnodigde én wie jij uitnodigde. De band telt zodra de nieuwe 3 dagen heeft geklikt (tegen nepadressen).
- **Jij klikt voor hen, zij klikken voor jou**: elke klik geeft de klikker €0,10 en elke vriend direct €0,10. Een ontvanger hoeft daarvoor die dag niet zelf te klikken.
- **Eén adres per persoon**: Gmail-punten en `+toevoegingen` tellen als hetzelfde adres.

Rekenvoorbeeld (cadeaus beginnen nu rond €8,74, de pot start op €5):
- Alleen, elke dag klikken: na 10 dagen €5 + €1 + €1 reeks = €7, na ongeveer 18 dagen genoeg voor het eerste cadeau.
- Met 4 vrienden die ook elke dag klikken: €0,10 + €0,40 per dag, eerste cadeau na ongeveer 7 dagen.

Wat het kost: €5 startpot per bevestigd adres, maar die is pas te gebruiken als de pot een cadeau dekt; wie niet blijft klikken kost niets (pot vervalt na 30 dagen). Per actieve deelnemer verder hooguit €1 tegoed per dag (plus €1 per 10 dagen reeks); pot nooit boven €30.

### 4.2b Economie: de pot betaalt zichzelf (20 nov 2026)

Henkjan 20 nov: "Maak het economisch totaal werkend en groeiende dus bij groei gaat relatief minder kosten ?"

- **Elk tegoed komt uit iets wat al geld oplevert.** Bronnen per 30 dagen:
  - €0,50 per nieuw lid via een vriend of site (wat een advertentie anders kost, `ECO.lidWaard`);
  - 50% van de winst op aankopen van leden (`ecoVerkoop`, nog te koppelen aan de shop);
  - geld van merken (`op=dkeco&merk=<euro>`);
  - een startbudget per dag, alleen op Henkjans woord (`&startbudget=<euro>`).
- **Spaarrente.** Het bedrag per klik, per vriendenklik en de bonus voor 10 dagen op rij zetten zich elke maandag (`renteZet` in de ochtendronde).
  - De verwachte kosten van nieuw tegoed mogen niet hoger zijn dan de inkomsten.
  - Verwachte kosten = het deel van het tegoed dat echt een cadeau wordt (30% tot er €100 aan cadeaus is, daarna gemeten) maal wat een cadeau Henkjan per euro tegoed kost.
  - Een cadeau kost Henkjan wat hij betaalt (Henkjan 20 nov: "Ik moet dat cadeau inkoop en verzend betalen natuurlijk"): inkoop met btw plus de verzending die wij betalen, uit `hjdk:shop:kost` (lib/shopmarge.js). Zonder doorgegeven inkoop is het een schatting uit de marge.
  - De cadeaulijst kiest de cadeaus met het meeste cadeau per uitgegeven euro, en nooit een cadeau dat meer kost dan het tegoed. De bestelmail aan Henkjan noemt wat het cadeau hem kost.
  - Per week hooguit een kwart omhoog of omlaag, tussen 20% en 200% van de basis (€0,10, €0,10 en €1). De eerste keer staat hij op de basis.
  - Wat in een pot zit, verandert nooit.
- **Vaste bedragen (acquisitie).** De startpot (€5) en de vriendbonus (€1 voor beiden zodra een nieuwe vriend 3 dagen klikt) staan apart in de stand, met de verwachte kosten per nieuw lid. Vergelijk die met wat een advertentie per lid kost.
- **Waarom het bij groei relatief goedkoper wordt:**
  - Steeds meer leden komen via vrienden en sites. Die betalen we uit wat ze opleveren, niet vooraf.
  - Merken betalen meer voor een groter publiek.
  - Vaste kosten (mail, techniek) verdelen zich over meer leden.
  - Vervallen tegoed vloeit terug.
  - De rente stijgt mee als de inkomsten per lid stijgen, en dat maakt meedoen weer aantrekkelijker.
- **Stand:** `op=dkeco` (beschermde host; `&test=1` voor de testwereld), met een `tekst` in gewone taal.

### 4.2c Meer of minder van dit (20 nov 2026)

Henkjan 20 nov: "Waar klik je precies op ? Daar kunnen we leer element in brengen . Meer of minder van dit . En zo verzamelen we ook data de handeling wordt betaald de uitkomst niet ."

- **De klik in de ochtendmail is een oordeel.** De mail toont één product met twee even grote knoppen: Meer van dit en Minder van dit (proefvariant b: Ja, leuk en Niet mijn ding).
  - Beide tellen als de klik van de dag en geven precies hetzelfde tegoed. Er staat bij: "Wat je ook kiest, je klik telt."
  - Per persoon telt één oordeel per dag (`p.smaak`).
- **Lerend.**
  - Per product en per soort in `<ns>oordeel` (`pid|meer`, `pid|minder`, `soort:<cat>>sub|...`).
  - Het product van morgen (`dagProductVoor`) kiest uit wat anderen vaak 'meer' gaven, wat bij jouw soorten past, plus verkenning, en nooit iets wat je al beoordeelde.
  - Na de klik staat dat product bovenaan je pagina met "Je koos: ...".
- **Data (smaakpanel):** `op=dkstand` onder `smaak`, met de producten en soorten met de meeste 'meer' (vanaf 5 oordelen). Dit is ook waardevol voor merken, en die kunnen ervoor betalen (inkomsten voor de spaarrente).

### 4.2d Doorsturen en advertenties (20 nov 2026)

Henkjan 20 nov: "Eerst doorsturen op gang krijgen" en "We starten met prop ads die we totaal optimaliseren . Dat moet voor 0.10 per persoon kunnen."

- **Wat we overnamen uit onderzoek** (Morning Brew, Harry's, WhatsApp-onderzoek, Mention Me):
  - een concreet bedrag geven en krijgen ("Geef een vriend €5"; de vriend start met €5 via jouw link);
  - WhatsApp als eerste en grote knop;
  - delen bovenaan direct na het bevestigen (moment met de hoogste bereidheid);
  - je link en je voortgang in elke ochtendmail;
  - haalbare mijlpalen met een voortgangsbalk;
  - fraude tegengaan met IP en dubbele opt-in.
- **Mijlpalen.** Met 3 meegebrachte vrienden die meedoen mag je pot tot €50 (grotere cadeaus), met 10 tot €100 (`TREDEN`, `maxVan`, `p.nAct`). Kost niets extra tot het tegoed er is.
- **Zelfde IP als de uitnodiger bij aanmelden.** De band telt voor het samen klikken, maar zonder vriendbonus en zonder trede (`zelfdeip`).
- **Advertenties.**
  - Het aanmeldformulier stuurt de klik mee (`n`, `z`, `c`, `s` uit de landings-URL). Het lid krijgt `bron` (advertentie, vriend of direct).
  - Bij bevestigen gaat één terugmelding naar PropellerAds (`visitor_id = s`) of Mondiad. Dat doel van de CPA-campagne is een bevestigd lid. In de testwereld wordt hij alleen geteld (`pb-test-*`).
  - Landings-URL voor een campagne: `https://gids.kadoly.com/api/gids?op=dk&n=propeller&z=<zone-macro>&c=<campagne-macro>&s=<klik-id-macro>` (macro's overnemen uit een werkende campagne).
- **Controles (nooit vastlopen).** Een mislukte terugmelding probeert de ochtendronde opnieuw, hooguit 3 keer per lid. `op=dkstand` toont onder `lekken` het lek van gisteren met de actie: bevestigen (minder dan 30% van 20+ aanmeldingen), terugmelding mislukt, en niemand deelt bij 20+ kliks.
- **K-meter** in `op=dkstand` onder `doorsturen`: per bron het aantal leden, het aantal meegebrachte vrienden die meedoen, en K. Verder: gedeeld (WhatsApp vanaf pagina en mail), bezochte uitnodigingen, zelfde IP en terugmeldingen.
- **Deeltekst (proef `deeltekst`).** a: "Via mijn link start je met €5 ..."; b: "Wie klikt er elke dag voor mij? ... via mijn link start je met €5".

### 4.2e Je eigen doel en je smaak trainen (20 nov 2026)

Henkjan 20 nov: "Ik vind het trainen van je eigen profiel een goed iets of je eigen cadeaus kiezen is ook al trainen en zoeken door site. De ander mobiliseren en zo houden wordt lastiger."

- **Eigen doel** (`op=dkdoel`). Je kiest zelf je cadeau uit de cadeaus tot je mijlpaal-maximum, met een zoekvak (tot 400 cadeaus, op meeste cadeau per euro). `p.doel` en `p.doelNaam`.
  - Pagina en ochtendmail tonen "Nog €X tot je doel" met een balk. Wisselen mag altijd.
  - Zonder doel blijft "Nog €X, dan kies je … gratis", met een link "Kies zelf je cadeau".
- **Delen met een doel** wordt concreet: "Help me sparen voor …. Via mijn link start je met €5 …".
- **Smaak trainen** (`op=dktrain`). Na de klik van de dag kun je nog hooguit 10 producten per dag beoordelen (`TRAIN_MAX`).
  - Dat levert geen tegoed op, alleen betere cadeau-ideeën. Het telt mee in het smaakpanel (tellers `train-meer` en `train-minder`).
  - Onder je product van de dag staat "Jij kiest vaak meer van: …".

### 4.2f Eindelijk betaald voor je data: trainen, verlanglijstje en verjaardagskalender (21 nov 2026)

Henkjan 21 nov: "iedere keer als je de AI gaat trainen wat jij ok vindt krijg je 1 cent en de gene die je uitnodigde ook 1 cent", "Eindelijk betaald voor je data", "Er kunnen menselijk checks tussen de trainingen zitten. En je kunt alles vragen salaris etc", "Ja bouw het zo", "Ja zet er in gaan we testen of gebruikt wordt". Code: `lib/samen.js`, aangeroepen uit `dkOp`. Schermontwerp en klikbare proef: https://claude.ai/artifact/SRrfbrT18s9w7cgJUiAQte en https://claude.ai/artifact/PGaHs5K5zFEBRPZFNVpmnb.

- **Trainen** (`op=dktik`). 100 kaarten, 10 per dag: per dag 7 cadeaus ("Wil ik" / "Niet voor mij"), 2 vragen over jezelf (20 vragen: leeftijd, verjaardagen, voor wie, budget, salaris in bandbreedte, lootjes, kerst, wonen, kinderen, stijl …) en 1 mens-check ("Tik op de kaars"). Elke kaart 1 cent voor jou en 1 cent voor wie je uitnodigde (`&v=<code>`). Een vraag overslaan levert niets op.
  - Begint zonder formulier: de eerste kaart staat meteen op de pagina. Sessie in cookie `dktk` (testwereld `dktkt`), stand in `tk:<sessie>`.
  - Een dag telt niet als iemand binnen 0,7 seconde tikt (`SNEL_MS`), de check mist, of cadeau 38 (kaart 54, een herhaling van cadeau 2) anders beoordeelt. Hij hoort alleen dat de ronde niet telde.
  - "Jonger dan 18" stopt meteen (meedoen kan vanaf 18, zie voorwaarden).
  - E-mailadres pas aan het eind van dag 1 ("Bewaar je centen en je lijstje"). Tot bevestigen staan de centen klaar (`ok`, `okVan`); `bevestig` boekt ze op de pot van het nieuwe lid en van wie uitnodigde (niet bij hetzelfde IP). Leden krijgen hun centen direct; wie uitnodigde hooguit 100 cent per dag (`VRIEND_MAX_DAG`).
  - Elke "Wil ik" komt op een echte verlanglijst van gids.kadoly.com/w (`wl:l:<id>`, items met link naar kadoly.com/product). Daarmee werken delen, stiekem afvinken, samen geven en lootjes van die tool meteen.
  - Antwoorden: per persoon in `tk:`, als totaal per vraag in `tikant:<vraag>` (voor merken later alleen totalen) en per cadeau in `tikoord`.
- **Verjaardagskalender** (`op=dkkal`). Iemand maakt de kalender ("Familie De Vries") en zet de link in de familiegroep met de tekst "Wanneer ben jij jarig? Tik je dag aan, dat kost 5 seconden". Iedereen tikt maand en dag aan en typt zijn voornaam; daarna "Zet je gezin er meteen bij" en "Wil je een seintje?" (e-mail). Seintje 14 en 3 dagen vooraf; de jarige zelf krijgt "Stuur je verlanglijstje naar de familie". Alleen voornaam, dag en maand. `kal:<gid>`, set `kals`.
- **Verjaardagen uit het trainen**: leden krijgen 14 dagen vooraf "Over twee weken is je moeder jarig" met drie cadeaus (via Clickmind, `dkgo`).
- **Ingangen**: blok "Eindelijk betaald voor je data" op de ledenpagina, regel in de ochtendmail (`dkgo&w=k`), WhatsApp-knop "Laat een vriend ook verdienen" (`dktik&w=wa`), lootjes via gids.kadoly.com/w/lootjes.
- **Controles** (`dkstand` → `lekken`): 50+ kaarten zonder e-mailadres; meer dan de helft van de dagen telt niet (checks te streng); 3+ kalenders zonder verjaardagen erin. Tellers: `tik-nieuw`, `tik-kaart`, `tik-wil`, `tik-vraag`, `tik-jarig`, `tik-dag`, `tik-dagmis`, `tik-mis-<reden>`, `tik-mail`, `tik-lid`, `tik-deel`, `tik-lijstdeel`, `kal-maak`, `kal-lid`, `kal-mail`, `kal-deel`, `kal-herinner`, `tik-herinner`.
- **Wat we al wisten**: de verlanglijst- en lootjestool (sinds 13 nov) kreeg tussen 15 en 21 nov alleen bezoeken (lootjespagina 37, gedicht 26, zoeker 21), geen enkele lijst of trekking. Meten of het nu gebruikt wordt kan pas met echte bezoekers: live op Henkjans woord (`dk:aan`) en verkeer.

### 4.3 Juridisch

- **Geen kansspel**: er wordt niets verloot, iedereen krijgt wat hij spaart. De Gedragscode Promotionele Kansspelen, de einddatum, het plafond van €4.500 en kansspelbelasting gelden dus niet.
- Het is een gratis spaar- en loyaliteitsactie: duidelijke voorwaarden (`op=dkregels`), tegoed niet in te wisselen voor geld en niet over te dragen, vervallen staat erin, wijzigingen minstens 30 dagen vooraf melden.
- Aanmelden met dubbele opt-in; afmelden met één klik; Kadoly stuurt nooit berichten naar vrienden (de deelnemer deelt zelf).
- Privacy: e-mail alleen voor de Spaarpot, gewist uiterlijk 60 dagen na afmelden; bezorgadres alleen voor het cadeau, gewist binnen 60 dagen.
- Organisator in de voorwaarden: ADSFAIR B.V. (Kadoly Shop), Albert Plesmanplein 20, 2805 AB Gouda, KVK 60126035.

## 5. Testen (in een ander account)

### 5.1 Wat je nodig hebt

- Toegang tot het Vercel-team **henq** (de testhost zit achter de Vercel-inlog). In een Claude-chat: de Vercel-tool `web_fetch_vercel_url`, of de browser van iemand die bij Vercel is ingelogd.
- Een eigen e-mailadres waar je de testmails wilt ontvangen.

### 5.2 Adressen

| Wat | Adres |
|---|---|
| Aanmeldpagina (testwereld) | https://hjdk-api-henq.vercel.app/api/gids?op=dk&test=1 |
| Voorwaarden | https://hjdk-api-henq.vercel.app/api/gids?op=dkregels&test=1 |
| Voorbeeld van de mails | https://hjdk-api-henq.vercel.app/api/gids?op=dkmails&test=1 |
| Alle testdeelnemers | https://hjdk-api-henq.vercel.app/api/gids?op=dktest&test=1&actie=lijst |
| Stand testwereld (JSON) | https://hjdk-api-henq.vercel.app/api/gids?op=dkstand&test=1 |
| Stand live (JSON) | https://hjdk-api-henq.vercel.app/api/gids?op=dkstand |
| Deze overdracht, live | https://hjdk-api-henq.vercel.app/api/gids?op=dkoverdracht |

### 5.3 De testwereld

- Alleen bereikbaar op de beschermde host `hjdk-api-henq.vercel.app` met `&test=1`; op elke andere host geeft `test=1` "Niet gevonden".
- Eigen opslag (`dkt<versie>:` in de KV). Niets raakt echte deelnemers.
- Testmails gaan echt naar je inbox, met **[TEST]** voor het onderwerp. Afzender `Kadoly <nieuws@post.kadoly.com>`, antwoorden gaan naar Henkjan.
- Bovenaan elke testpagina staat een **gestippeld testblok** met knoppen:
  - **Snel een testdeelnemer zonder mail**: maakt een deelnemer met een nepadres en opent zijn pot.
  - **Volgende dag (vrienden klikken + ochtendmail)**: zet de testdag één dag verder, laat de testvrienden klikken en stuurt de ochtendmail naar alle echte testadressen.
  - **Volgende dag zonder mail**: hetzelfde zonder mail.
  - **Maak 4 testvrienden**: 4 vrienden die meteen meetellen en vandaag al voor je klikten (+€0,40).
  - **Zet mijn reeks op 9**: de volgende dag levert de €1 reeksbonus op.
  - **Zet €10 in mijn pot**: om het cadeau kiezen te testen.
  - **Bekijk de mails**: de ochtendmail (met jouw pot) en de bevestigingsmail.
  - **Alle testdeelnemers** en **Alles wissen** (begint de testwereld opnieuw; geldt voor iedereen die test).
- Testvrienden (adressen op `@voorbeeld.invalid`) krijgen nooit mail en klikken elke dag vanzelf.
- De testwereld loopt ook elke ochtend mee in de cron: wie zich met een echt adres aanmeldde, krijgt dus ook echt elke ochtend een [TEST]-mail, tot 14 dagen zonder tik of tot "Alles wissen".
- Let op: de testdag kan voorlopen op de echte datum (elke "Volgende dag" zet hem een dag verder).

### 5.4 Testscript met wat je moet zien

| Stap | Doen | Verwacht |
|---|---|---|
| 1 | Open de aanmeldpagina, vul je adres in, vink 18+ aan, "Start mijn Spaarpot". | Kop "Start met een gevulde spaarpot"; daarna "Bijna klaar: bevestig via de mail die we je net stuurden." |
| 2 | Open de mail "[TEST] Bevestig je Kadoly Spaarpot", klik "Start mijn Spaarpot". | Potpagina: "Je pot: €5,10", "+€5 startpot.", "+€0,10 voor je klik.", "Dag 1 op rij", cadeau-idee van vandaag, "Nog €X". |
| 3 | Zelfde adres nog eens aanmelden (ook met punten of `+test` bij Gmail). | Geen tweede mail en geen tweede startpot. |
| 4 | "Maak 4 testvrienden". | "Je pot: €5,50", "+€0,40, want 4 vrienden klikten vandaag voor je.", kop van het blok "Samen gespaard: €X". |
| 5 | "Volgende dag (vrienden klikken + ochtendmail)". | Mail "[TEST] Samen gespaard: €X · klik voor je vrienden" met "Gisteren klikten 4 vrienden voor je: +€0,40 in jouw pot." en knop "Klik voor je vrienden". |
| 6 | Klik in die mail op "Klik voor je vrienden". | "+€0,10 voor je klik, en je klik gaf 4 vrienden elk €0,10." en "+€0,40, want 4 vrienden klikten vandaag voor je." Cadeau-idee van vandaag staat boven Samen sparen. |
| 7 | Dezelfde dag nog eens klikken. | Pot blijft gelijk (één klik per dag). |
| 8 | "Zet mijn reeks op 9", dan "Volgende dag", dan klikken. | "+€1 voor 10 dagen op rij." |
| 9 | "Zet €10 in mijn pot". | Blok "Je pot is genoeg voor een cadeau" met knop "Kies je cadeau". |
| 10 | "Kies je cadeau", kies er een, vul een testadres in (postcode als 2805 AB). | "Top, je cadeau komt eraan", pot is met de prijs verlaagd. Henkjan krijgt de mail "[TEST] Spaarpot: bestel <product> voor <voornaam>". Laat dit Henkjan weten, zodat hij die niet echt bestelt. |
| 11 | Open "Kies je cadeau" opnieuw na het kiezen. | Alleen cadeaus die je overgebleven pot dekt, of "Nog even sparen" met het bedrag dat nog nodig is. |
| 12 | "Deel via WhatsApp". | WhatsApp opent met: "Doe je mee met de Kadoly Spaarpot? Je pot start gevuld. Klik jij, dan krijg ik €0,10. Klik ik, dan krijg jij €0,10. Zo sparen we samen voor een gratis cadeau." plus je eigen link. |
| 13 | Open je eigen link en meld een tweede adres aan. | "Een vriend nodigde je uit." Bij jou: "1 vriend telt mee na 3 dagen klikken." Na 3 klikdagen van het tweede adres geeft elke klik van de een de ander direct €0,10. |
| 14 | Afmelden via de link onder de mail. | "Je bent afgemeld"; daarna "Volgende dag": geen mail meer voor dat adres, en dat adres krijgt geen tegoed meer van vrienden. |
| 15 | (optioneel) 31x "Volgende dag zonder mail" zonder te klikken, dan klikken. | Melding dat de vorige pot is vervallen; nieuwe pot €0,10 (de startpot is één keer). |
| 16 | Bekijk de pagina's op een telefoon en in donkere modus. | Strak, geen grijs, knoppen in het eerste scherm, alles leesbaar. |

### 5.5 Terugmelden

Meld per stap wat je zag als het anders was dan verwacht, met de stapnummer, wat je deed, wat je zag (screenshot) en wat je verwachtte.
Zet het in de chat met Henkjan of in het werklog: `https://hjdk-api-henq.vercel.app/api/mm/handover?log=<tekst>&wie=spaarpot-test`.

## 6. Techniek

### 6.1 Bestanden

| Bestand | Wat |
|---|---|
| `lib/dagkans.js` | Alles: regels (`R`), aanmelden, bevestigen, klikken, kring, samen klikken, cadeau kiezen, mails, pagina's, testwereld, routes (`dkOp`). |
| `fn/gids.js` | Stuurt elke `op=dk...` door: `if (/^dk[a-z]*$/.test(op)) return await (await import('../lib/dagkans.js')).dkOp(...)` en geeft `kaal`, `leesBody`, `isBot` mee. |
| `lib/kadoly-nieuws.js` | Levert `stuurMails`, `mailSchil`, `knop`, `mailHenkjan`, `mailKlaar`, `KADOLY_BEDRIJF` (zelfde afzender en opmaak als de Kadoly-nieuwsbrief, via Resend). |
| `vercel.json` | Cron `/api/gids?op=dkronde` om 06:04 UTC; `includeFiles` van `fn/gids.js` voor dit bestand. |
| `lib/werking.js` | Regel "Kadoly Spaarpot" in de werking van het geheel. |
| `OVERDRACHT-KADOLY-SPAARPOT.md` | Dit document. |

### 6.2 Routes (`/api/gids?op=...`, testwereld met `&test=1`)

| op | Methode | Wat |
|---|---|---|
| `dk` | GET | Aanmeldpagina; `&v=<code>` = uitgenodigd door een vriend. |
| `dkaanmelden` | POST JSON `{email, oud, website, ms, v}` | Aanmelding; honingpot `website`, minimaal 1,2 s op de pagina, hooguit 6 per IP per minuut, 10 minuten pauze per adres. Stuurt de bevestigingsmail. |
| `dkbevestig` | GET / POST `&t=` | Bevestigen (token 2 dagen geldig); POST maakt de pot, telt de eerste tik en stuurt door naar `dkt`. |
| `dkt` | GET / POST `&k=` | Eigen link. GET zonder tik vandaag = tikpagina (zelf-POST na 0,3 s, niet voor bots); POST = tik; daarna de potpagina. |
| `dkkies` | GET / POST `&k=` | Cadeau kiezen; POST met `pid`, naam en adres. Slot van 20 s tegen dubbel kiezen. |
| `dkaf` | GET / POST `&t=` | Afmelden met één klik; POST zonder `weer` = mailapp; `&weer=1` = weer aanmelden. |
| `dkregels` | GET | Voorwaarden. |
| `dkmails` | GET (alleen test) | Voorbeelden van de mails. |
| `dktest` | GET (alleen test) | `&actie=maak`, `volgende` (`&mail=0`), `vrienden&n=4`, `reeks&n=9`, `pot&n=1000` (centen), `lijst`, `wis`. |
| `dkronde` | cron of beschermde host | Live ronde (doet niets zolang `dk:aan` ontbreekt); de cron draait ook de testwereld. |
| `dkstand` | beschermde host | JSON: aan of uit, testdag, deelnemers, tegoed in potten, tellers per dag. |
| `dkgo` | GET `&k=&w=t\|p` | Klik uit mail of pagina via Clickmind (register, `mmc`), daarna naar de klikpagina (`w=t`) of het product op kadoly.com (`w=p&p=<pid>`). |
| `dkdeel` | beacon `&k=&kanaal=wa\|mail` | Deelknop getikt (proefstap deel, teller). |
| `dkoverdracht` | beschermde host | Dit document met de live stand erboven (`&format=json` kan ook). |

Live staat alles behalve `dkronde`, `dkstand` en `dkoverdracht` op "Niet gevonden" zolang `dk:aan` ontbreekt.

### 6.3 Opslag (KV, Vercel Redis)

Voorvoegsel `dk:` = live, `dkt<versie>:` = testwereld (`dktv` is de versie; "Alles wissen" verhoogt die).

| Sleutel | Inhoud |
|---|---|
| `p:<id>` | Deelnemer: `email, at, bevestigd, actief, af, link, code, van, reeks, laatste, dagen, act, pot (centen), log, samen {D, n, c} (wat vrienden die dag voor je klikten), samenVorig (de dag ervoor), gaf {D, n} (hoeveel vrienden jouw klik iets gaf), cadeaus, rust, vervallen`. `id` = `d` + hash van het genormaliseerde adres. |
| `link:<hash>`, `af:<hash>` | Eigen link en afmeldtoken naar id (alleen hashes opgeslagen). |
| `code:<code>` | Deelcode (6 tekens) naar id. |
| `pending:<hash>` | Aanmelding die nog bevestigd moet worden (2 dagen). |
| `emails` | Set met alle actieve deelnemers. |
| `kids:<id>` | Iedereen die via deze persoon binnenkwam. |
| `act:<id>` | Uitgenodigden die al 3 dagen klikten (de vriendschapsband). |
| `tik:<dag>` | Wie op die dag klikte (90 dagen). |
| `tel:<dag>` | Tellers: `aanvraag, bevestigd, tik, samencent (tegoed dat klikken aan vrienden gaf), dagmail, cadeau, cadeaucent, af`. |
| `adres:<id>:<dag>` | Bezorgadres bij een cadeau (60 dagen). |
| `offset` | Alleen test: hoeveel dagen de testwereld voorloopt. |
| `dk:aan` | Live-schakelaar (alleen zetten op Henkjans woord). |

Cadeaus komen uit de shopcatalogus `hjdk:shop:cat`: in voorraad, met foto, levertijd 1 tot 3 werkdagen, prijs incl. verzending tot €30, de populairste 30.

### 6.4 De ochtendronde (`dkronde`, 06:04 UTC) en het samen klikken

- Samen klikken gebeurt direct bij elke klik (`tik` roept `geefVrienden` aan): elke actieve vriend krijgt `R.vriend`, tot `R.vriendMax` per ontvanger per dag.
- De ronde: (1) testwereld: testvrienden klikken voor vandaag (en geven dus jou tegoed); (2) ochtendmail aan elke actieve deelnemer die in de laatste 14 dagen klikte, in batches van 90 via Resend (idempotency-sleutel per dag), met List-Unsubscribe. De mail rekent "samen gespaard" uit (eigen pot plus die van de vrienden) en leest "gisteren" uit `samen` of `samenVorig`.

### 6.5 Lerend en Clickmind (20 nov 2026)

Henkjan 20 nov: "Maak het volkomen lerend . ALLE variabelen . /campagnes-henkjan altijd via clickmind en de mail ook alle links ze moeten doorsturen via email of whats app ook al die moeten lerend zijn cta s etc."

- Clickmind-proef `spaarpot` (live) en `spaarpottest` (testwereld) in `lib/proef.js`: elke deelnemer krijgt van elk onderdeel een versie (factorieel, Thompson sampling per apparaat, 30% verkennen tot 200 keer gezien, daarna 10%). Beslissing op de aanmeldpagina (cookie `dkpf`, 7 dagen), daarna op het record (`p.pf`).
- Onderdelen (a = nu, b = uitdager): `kop` (Start met een gevulde spaarpot / Spaar samen voor een gratis cadeau), `knop` (Start mijn Spaarpot / Pak mijn gevulde pot), `onderwerp` van de ochtendmail (Samen gespaard / N vrienden klikten voor je · klik terug), `mknop` (Klik voor je vrienden / Klik terug), `deel` (alleen WhatsApp / WhatsApp en per mail), `deeltekst` (wederkerig / uitdaging "Wie klikt er elke dag voor mij?"), `product` (cadeau-idee na of voor Samen gespaard).
- Waarde per deelnemer = de verste stap: aanvraag 2, deel 4, terug (klikt op een latere dag) 6, product 8, bevestigd 10, vriend (iemand bevestigt via zijn link) 30, koop 100. Bedragen leren bewust niet automatisch mee: de waarde telt de kosten nog niet.
- Stand: `op=dkstand&test=1` (veld `proef`) of https://keuzehulp.best/api/mm/proefstand?site=spaarpot&vorm=tekst.
- Clickmind: `cm.js` met `data-site=spaarpot` op elke pagina, met `data-net`, `data-zone`, `data-campaign`, `data-subid` uit de advertentielink (`n`, `z`, `c`, `s`). Elke link in de ochtendmail en elk product op de pagina loopt via `op=dkgo` (klik in het Clickmind-register: netwerk mail of web, campagne spaarpot, zone klik of product, sub = de versies van de deelnemer; doel krijgt `mmc`). Deelknoppen melden zich via `op=dkdeel` (sendBeacon).
- Delen volgens de quizlessen (todayin `spel/leerlus/viraliteit`): één grote knop "Stuur via WhatsApp", eronder "WhatsApp opent: kies een vriend of groep en tik op verstuur", na de tik "Verstuurd? Stuur hem ook naar een tweede groep" en "Kopieer je link"; een vriend telt pas na een echte bevestiging.
- Nog te doen bij de start van advertenties (campagne-skill): cmdata-route, `PAGINA_UIT` en `PROJECTEN` (lib/mensmeter.js, lib/lookalike.js), `puit` bij aanmelding, bron in lib/extern.js, en een Clickmind-advertentielink naar de aanmeldpagina.

### 6.6 Live zetten (alleen op Henkjans woord)

1. Kies het adres en zet een rewrite in `vercel.json` op host `gids.kadoly.com` (bijv. `/spaarpot` naar `/api/gids?op=dk`), plus de vervolgpagina's als dat netter is.
2. Zet `dk:aan` in de KV.
3. Controleer de aanmeldpagina, de bevestigingsmail en de eerste ochtendronde (`dkstand`).
4. Werk dit document, `lib/werking.js` en het werklog bij.

## 7. Open punten en beslissingen

1. **Kern "Samen naar 100%"** (Henkjan): pot tonen als % korting op een gekozen product, nieuwe vriend telt zwaarder dan een dagelijkse klik (voorstel: nieuwe vriend €1 voor beiden, dagelijkse klik €0,05). Zie sectie 8.
2. **Korting in de kassa van kadoly.com**: zonder kortingscode kan de pot alleen naar een gratis cadeau, wat bij de huidige marges niet uit kan. Uitzoeken of de kassa een persoonlijke code kan maken.
3. **Cadeaus met lage kostprijs en hoge waarde** kiezen voor 100% (eigen inkoop, bundels), in plaats van het goedkoopste product.
4. **Bedragen bevestigen**: startpot €5, klik €0,10, vriend €0,10 (max €0,90 per dag), €1 per 10 dagen, pot max €30.
5. **Eerst warm zaaien**: Kadoly-kopers, de modal op kadoly.com en de nieuwsbrief, daarna advertenties (netwerk, budget en start op Henkjans woord; campagne-skill, via Clickmind).
6. **Live-adres** op gids.kadoly.com en het startmoment (`dk:aan`).
7. ~~De wekelijkse winactie van de Kadoly-nieuwsbrief~~: gestopt op 20 nov 2026 (Henkjan: "stop wekelijks actie"). Er waren 0 aanmelders en geen trekkingen.

8. **Winst op aankopen in de pot-economie**: de shop moet bij een betaalde bestelling die via een Spaarpot-link kwam (utm_source=spaarpot, Clickmind-klik van `op=dkgo`) `ecoVerkoop(test, winstCent)` aanroepen. Tot dan telt alleen het geld van nieuwe leden, merken en het startbudget.
9. **Startbudget per dag** (Henkjans woord): bijvoorbeeld wat de advertenties voor dezelfde adressen zouden kosten. Zonder startbudget of merken zakt de spaarrente in de eerste weken naar 20% van de basis.
11. **Eerst doorsturen op gang** (Henkjan 20 nov: "Eerst doorsturen op gang krijgen"). Plan in 3 stappen:
    1. Bouwen in de testwereld: vier deelmomenten (na bevestigen, als een vriend voor je klikte, als je cadeau binnen bereik is, na je cadeau); WhatsApp-knop in de ochtendmail; uitnodigingspagina met de pot van de uitnodiger; "met 3 vrienden heb je je cadeau over X dagen"; K-meter per generatie in `op=dkstand`.
    2. Live alleen warm zaaien, op Henkjans woord: Kadoly-kopers, de modal, en Henkjans eigen kring. Doel 50 tot 100 leden.
    3. Advertenties pas als warm K ≥ 0,5 haalt.
    Stand 20 nov: op de keuzehulpen deelt 0,3% van de bezoekers (1.381 bezoeken, 4 keer gedeeld, 3 binnen via een link).
10. **Partners: clubs en sites** (20 nov, nog niet gebouwd; schermontwerpen: https://claude.ai/artifact/RiRsoJNbjMdiu69uJeuycX). Eén partnercode voor allebei: een club deelt de link via WhatsApp en een poster met QR-code, een site zet het blokje (`spaarpot.js` met `data-partner`) op de pagina. Zelfde beloning en partnerpagina. Een via een lid doorgestuurde vriend telt mee voor dezelfde partner.
    **Sites en verenigingen die het blokje plaatsen en meeverdienen** (Henkjan 20 nov): voorstel €0,50 per lezer die 3 dagen klikt plus 20% van de winst op hun aankopen; eerst op de eigen sites meten.

12. **Trainen, verlanglijstje en kalender testen met echte mensen** (21 nov): gebouwd en getest in de testwereld (41 controles in tik.mjs). Live gaat het samen met de Spaarpot aan (`dk:aan`, Henkjans woord) en vraagt verkeer. De oude regels (startpot €5, €0,10 per dagelijkse klik, vriendbonus) staan er nog naast; Henkjan beslist of die eruit gaan nu "betaald voor je data" de kern is.

## 8. Assessment en economie (20 nov 2026)

Henkjan 20 nov: "Kijk in quiz md wat wel en niet werkte en nu gaan we dit compounden . Doe verder onderzoek naar bestaande loyaltie programmas ... Hier is kern : Je klikt voor elkaar dus hoe meer mensen hoe meer korting of zelfs 100% korting . Doe totaal asessemnet ook even verder nog voor economics".

**Economie (feiten):** Kadoly verdient nu ~€6,67 per verkoop (2 verkopen 11-12 nov, €106 omzet, ~€13 winst; lib/waarde.js) en per product bij de huidige prijzen €0 tot €2 (OVERDRACHT-YOORS-SHOP, 17 nov); bundels halen €15. Een gratis cadeau van €8,74 kost Kadoly dus bijna €8,74. Een echt mens via advertenties kost ~$0,03; een eerste antwoord in NL kostte in de quiz ~$0,023.

**Economie (rekenvoorbeeld, aannames te meten):** per 100 bevestigde deelnemers €0,50 per adres = €50; 15 halen een cadeau = ~€131; samen €181. Terugverdienen vraagt ~27 verkopen (0,27 per deelnemer). Een dagelijkse mail haalt dat bij deze marges waarschijnlijk niet. Zo als gratis cadeau sluit de rekensom niet.

**Wat de rekensom wel laat sluiten:**
1. Tegoed als korting bij een aankoop (pot = % korting op een product, de rest betaal je): elke inwisseling brengt omzet mee. Vraagt een kortingscode in de kassa van kadoly.com.
2. 100% alleen op cadeaus met een lage kostprijs en een hoge waarde (eigen inkoop, bundels), niet op een willekeurig product van €8,74.
3. Geld naar nieuwe mensen, niet naar herhaling: een nieuwe vriend die meedoet is een adres zonder advertentiekosten (€0,25-0,75 waard); een dagelijkse klik van een bestaande vriend levert veel minder op. Voorstel: nieuwe vriend €1 voor beiden, dagelijkse klik €0,05.
4. Eerst warm zaaien: in de quiz deelden advertentiespelers bijna niet (0,08 vrienden per maker) en spelers die via een vriend kwamen wel (0,61, de generatie daarna 1,86). Begin bij Kadoly-kopers, de modal op kadoly.com en nieuwsbrief-abonnees, daarna pas koude advertenties.
5. Een plafond op het totaal: tegoed dat openstaat en cadeaus per maand hooguit wat Kadoly anders aan advertenties voor dezelfde adressen zou uitgeven.

**Loyaliteitsprogramma's die werken (wat we overnemen):**
- Gevulde start (Nunes & Drèze 2006, carwash): kaart met 2 van 10 stempels al gezet 34% maakt hem af, tegen 19% bij een lege kaart van 8. Hebben we (startpot); toon het ook als voortgang in procenten.
- Dropbox: beloning voor beide kanten, gebracht als cadeau van een vriend en ingebouwd in elk moment van het product; blijvend 60% meer aanmeldingen, 35% van de dagelijkse aanmeldingen via doorverwijzing. Hebben we (wederkerig); delen ook in de welkomstmail en na elk cadeau.
- Pinduoduo "help me de prijs omlaag": vrienden klikken de prijs naar nul, nieuwe gebruikers tellen zwaarder. Enorme groei, maar wantrouwen als de laatste procenten onhaalbaar zijn (een streamer bleef met naar eigen zeggen tot 60.000 helpers op 99,98% steken). Overnemen: nieuwe vrienden tellen zwaarder, procenten korting naar 100%; nooit een onhaalbare laatste stap.
- AH digitaal sparen: zegels delen via WhatsApp kennen Nederlanders al. Les uit de koopzegels (NOS, aug 2026): woede als regels in het nadeel veranderen. Voorwaarden beloven 30 dagen vooraf melden en houden wat in de pot zit.

**Kern van Henkjan ("hoe meer mensen, hoe meer korting, tot 100%"):** het voorstel is "Samen naar 100%": je kiest een product, elke klik van een vriend geeft % korting op dat product en elke nieuwe vriend een grote stap; bij 100% is het gratis, daaronder is het korting in de kassa. Het aantal benodigde klikken hangt af van de kostprijs, zodat elke klik begrensd geld kost.

## 9. Logboek (nieuwste bovenaan)

- 2026-11-21: "Eindelijk betaald voor je data" (sectie 4.2f): trainen voor centen (`op=dktik`, 100 kaarten, 10 per dag, cent voor jou en wie uitnodigde, mens-checks, 20 vragen), elke "Wil ik" op een echte verlanglijst van /w, verjaardagskalender voor de familie (`op=dkkal`) met seintjes 14 en 3 dagen vooraf, verjaardagen uit het trainen in de ochtendronde. Code `lib/samen.js`. Lokaal getest (41 controles in tik.mjs). Live uit tot `dk:aan`. Open: of de oude regels (startpot, dagklik, vriendbonus) blijven (punt 12).

- 2026-11-20: Eigen doel kiezen met zoeken (`op=dkdoel`), voortgang naar je doel in pagina en mail, delen met "Help me sparen voor …", smaak trainen tot 10 per dag zonder tegoed (`op=dktrain`). Lokaal getest (8 controles in doel.mjs; bestaande tests slagen).

- 2026-11-20: Stap 1 van het doorstuurplan gebouwd (sectie 4.2d): "Geef een vriend €5", delen bovenaan na bevestigen, deelregel met voortgang in elke ochtendmail (via `dkgo&w=d` naar WhatsApp), uitnodiging toont de pot van de uitnodiger, mijlpalen €50/€100, zelfde-IP-regel, advertentieklik mee bij aanmelden, terugmelding aan PropellerAds en Mondiad bij bevestigen, K-meter. Lokaal getest (10 controles in viral.mjs, plus de bestaande tests).

- 2026-11-20: Meer of minder van dit (sectie 4.2c): de klik van de dag is een oordeel over één product, beide knoppen geven hetzelfde tegoed, één oordeel per dag, product van morgen leert van alle oordelen en van je eigen smaak, smaakpanel in `op=dkstand`. Proef `mknop` is nu Meer/Minder tegen Ja, leuk/Niet mijn ding. Lokaal getest (9 controles: mail, twee knoppen, doorsturen, pagina, telling, één per dag, morgen ander product).

- 2026-11-20: Kosten van een cadeau = inkoop met btw + verzending die wij betalen (`hjdk:shop:kost`), anders geschat uit de marge. Cadeaulijst op meeste cadeau per uitgegeven euro, nooit duurder dan het tegoed. Bestelmail noemt de kosten. De spaarrente rekent hiermee.

- 2026-11-20: Economie gebouwd (sectie 4.2b): spaarrente die zich elke maandag instelt op de inkomsten (nieuwe leden via vriend of site, winst op aankopen, merken, startbudget), vriendbonus €1 voor beiden, stand op `op=dkeco`, voorwaarden aangepast. Getest met 22 testdagen: de rente zakt met een kwart per week als er niets binnenkomt en stijgt als er geld van merken bij komt. Open: winst op aankopen automatisch doorgeven vanuit de shop (`ecoVerkoop`).

- 2026-11-20: Live nagekeken: cadeau-idee van vandaag en "Nog €X" staan er weer (catalogus 3.021 producten, 738 cadeaus tot €30, 2.127 tot €60; telling in `op=dkstand` onder `cat`). Een lege catalogus wordt niet meer 10 minuten onthouden, en babyspullen (verschoonmat, bedbumper, peuterlepels) zijn geen cadeau of eerste doel meer.

- 2026-11-20: Live gezien dat er geen cadeau en geen cadeau-idee meer verscheen: de shopcatalogus (3.021 producten) geeft de levertijd niet meer bij elk product mee, en de lijst vroeg een bekende levertijd van hooguit 3 werkdagen. Nu: levertijd bekend en hooguit 7, of onbekend, kortste eerst; de belofte "binnen 3 werkdagen" is uit de teksten en voorwaarden (de levertijd staat bij elk cadeau).
- 2026-11-20: Alles lerend: Clickmind-proef spaarpot met 7 onderdelen (kop, knop, onderwerp, mailknop, deelkanaal WhatsApp/mail, deeltekst, plek van het product), gebeurtenissen vanuit de server, cm.js op elke pagina, alle mail- en productlinks via op=dkgo in het Clickmind-register, deelknoppen via op=dkdeel; delen volgens de quizlessen. Assessment en economie in sectie 8.
- 2026-11-20: Startpot €5 en samen klikken (elke klik geeft direct alle vrienden €0,10; vrienden van vrienden vervallen); ochtendmail "Samen gespaard" met wie gisteren voor je klikte en knop "Klik voor je vrienden"; na de klik het cadeau-idee van vandaag bovenaan; overal klik in plaats van tik; bereikbaarheid van Henkjan onder elke mail (regel uit de POST-lus). Acht advertenties voor e-mailadressen in NL gemaakt (beelden 492x328 en icoon 192x192), nog niet geplaatst.
- 2026-11-17: Dit document gemaakt en live gezet op `op=dkoverdracht` (Henkjan: "Zet uitgebreide MD op vercel dan kan ik gaan testen in ander account").
- 2026-11-15: Winterkans-loterij vervangen door de Spaarpot (geen kans, geen einddatum). Getest in de testwereld met echte catalogus: pot €0,10 na eerste tik, €1 op dag 2 met 4+8 testvrienden, ochtendmail, cadeau kiezen, bestelmail, afmelden, vervallen na 30 dagen.
- 2026-11-14: Kadoly Winterkans gebouwd (dagelijkse loting met lootjes per vriend, drand), testwereld op `op=dk&test=1`.
