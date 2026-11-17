# Overdracht Kadoly Spaarpot

Levend document voor elke chat en elk account dat aan de Kadoly Spaarpot werkt of hem test.
Live te lezen (met de stand van dit moment bovenaan): https://hjdk-api-henq.vercel.app/api/gids?op=dkoverdracht
(in een Claude-chat met de Vercel-tool `web_fetch_vercel_url`; de host zit achter de Vercel-inlog van team henq).

Bron in de repo: `OVERDRACHT-KADOLY-SPAARPOT.md` (dit bestand), code in `lib/dagkans.js`.
Werk dit bestand bij in dezelfde commit als elke wijziging aan de Spaarpot: de juiste sectie en één regel in het logboek (nieuwste bovenaan).

---

## 1. In één alinea

De Kadoly Spaarpot is een dagelijkse mail waarmee mensen samen tegoed sparen voor een gratis cadeau van Kadoly (kadoly.com).
Elke ochtend krijg je één mail met je eigen link. Tik je erop, dan komt er €0,10 in je pot. Tikken jij en een vriend op dezelfde dag,
dan krijgen jullie allebei €0,10 extra. Is je pot genoeg, dan kies je een cadeau tot €30 en sturen wij het gratis op, binnen 3 werkdagen thuis.
Er is geen loting en geen kans: wat je spaart, is van jou. Daardoor is het geen kansspel en loopt het gewoon altijd door.

## 2. Stand (17 nov 2026)

| Onderdeel | Stand |
|---|---|
| Testwereld | Werkt, getest door Claude op 15 nov (aanmelden, tikken, vrienden, vriendentegoed, reeksbonus, cadeau kiezen, bestelmail, afmelden, vervallen). |
| Live | **Staat uit.** Gaat pas aan op Henkjans woord (KV-sleutel `dk:aan`). |
| Live-adres | Nog niet gekozen. Nu alleen bereikbaar via `/api/gids?op=dk` op de testhost. Bij de start komt er een nette route op gids.kadoly.com (voorstel: `/spaarpot`). |
| Bedragen | Door Claude gekozen, nog niet door Henkjan bevestigd (zie 4.2). |
| Pot als korting in de kassa | Nog niet mogelijk; de kassa van kadoly.com moet daarvoor een kortingscode kunnen maken (open punt). |

## 3. Hoe het zo gekomen is

- 14 nov 2026, Henkjan: *"Stel we maken dagelijkse nieuwsbrief waarin als je opent ... Je gratis een product kunt kiezen als je gewonnen hebt. Kan alleen als je streak van minimaal 10 dagen of doorgestuurd naar minimaal 10 mensen en is ook geopend door hen."*
- Daarna: *"Sterker? Verhoog je kans per vriend die ook doorstuurt."* en *"Bouw het en laat het me zien op test url zodat we samen goed kunnen testen. Voordat je bouwt doe nog een keer grondige assessment."*
- Eerste versie: **Kadoly Winterkans**, een dagelijkse loting met lootjes per vriend. Omdat dat een promotioneel kansspel is, moest die tijdelijk zijn (t/m 31 jan 2027) en onder €4.500 aan prijzen blijven (Gedragscode Promotionele Kansspelen, art. 8).
- Dezelfde avond, Henkjan: *"Je krijgt een tegoed met elkaar. We kunnen het nog slimmer maken een tegoed opbouwen gewoon samen zonder dat je win kans hebt."* en *"Gewoon altijd."*
- Daarom is de loting vervangen door de **Spaarpot**: geen kans, dus geen kansspel, geen einddatum, geen prijzenplafond en geen kansspelbelasting. De Winterkans bestaat niet meer.
- 17 nov 2026, Henkjan: *"Zet uitgebreide MD op vercel dan kan ik gaan testen in ander account."* Dit document.

## 4. Werking

### 4.1 Voor een deelnemer

1. **Aanmelden** op de aanmeldpagina: e-mailadres plus vinkje "Ik ben 18 jaar of ouder en woon in Nederland". Kwam je via de link van een vriend, dan staat er "Een vriend nodigde je uit".
2. **Bevestigen**: je krijgt een mail "Bevestig je Kadoly Spaarpot". De knop opent een pagina die zichzelf na 0,4 seconde bevestigt (zonder JavaScript: knop indrukken). Je eerste tik telt meteen: pot €0,10.
3. **Elke ochtend** rond 07:04 Nederlandse tijd één mail: onderwerp "Je pot: €X · tik voor vandaag". In de mail: wat je vrienden gisteren voor je spaarden, hoeveel je nog nodig hebt voor het eerstvolgende cadeau, één knop "Tik voor vandaag".
4. **Tikken**: de knop opent een pagina die na 0,3 seconde zelf de tik doorgeeft (POST). Bots en linkscanners krijgen die automatische tik niet; zonder JavaScript is er een knop. Daarna zie je je pot.
5. **Je potpagina**:
   - kop "Je pot: €X";
   - blok **Vandaag**: wat er vandaag bij kwam (tik, reeksbonus, vriendentegoed van gisteren met hoeveel vrienden), "Dag N op rij" en wanneer de volgende €1 komt;
   - blok **Nog €X** met balk en het cadeau dat je dan kunt kiezen, of **Je pot is genoeg voor een cadeau** met knop "Kies je cadeau";
   - blok **Samen sparen**: met hoeveel vrienden en vrienden van vrienden je spaart, knop "Deel via WhatsApp" en je eigen link;
   - blok **Vandaag bij Kadoly**: drie producten van de dag (links naar kadoly.com met `utm_source=spaarpot`);
   - onderaan Voorwaarden en Afmelden.
6. **Cadeau kiezen**: lijst met alle cadeaus die je pot nu dekt, met foto, prijs en levertijd. Kies één, vul naam en Nederlands adres in, klaar. Het bedrag gaat van je pot af; je spaart gewoon door.
7. **Afmelden** met één klik onder elke mail (ook via de afmeldknop van de mailapp, List-Unsubscribe-Post). Per ongeluk? Knop "Meld me weer aan".

### 4.2 Bedragen en regels

Alle bedragen staan in centen bovenaan `lib/dagkans.js` in `R`:

| Regel | Waarde | In `R` |
|---|---|---|
| Per tik (per dag) | €0,10, direct | `tik: 10` |
| Reeksbonus | €1 op elke 10e dag op rij | `reeksElke: 10`, `reeksBonus: 100` |
| Per vriend die op dezelfde dag tikte | €0,10, de ochtend erna | `vriend: 10` |
| Per vriend van een vriend die op dezelfde dag tikte | €0,05, de ochtend erna | `vv: 5` |
| Vriendentegoed per dag | hooguit €0,90 | `vriendMax: 90` |
| Pot | hooguit €30 | `potMax: 3000` |
| Cadeau | tot €30 incl. verzending, levertijd hooguit 3 werkdagen | `prijsMax: 30`, `leverMax: 3` |
| Vriend telt mee na | 3 tikdagen van de nieuwe | `vriendDagen: 3` |
| Geen ochtendmail meer na | 14 dagen zonder tik (link blijft werken) | `rustNa: 14` |
| Pot vervalt na | 30 dagen zonder tik | `vervalNa: 30` |

- **Vrienden** zijn wie jou uitnodigde én wie jij uitnodigde. De band telt zodra de nieuwe 3 dagen heeft getikt (tegen nepadressen). Beide kanten sparen dus: "elke dag dat we allebei tikken, krijgen we allebei €0,10 extra".
- **Vrienden van vrienden** zijn de vrienden van je vrienden, zonder jezelf en zonder je eigen vrienden.
- Vriendentegoed krijg je **alleen als je die dag zelf ook tikte**.
- **Eén adres per persoon**: Gmail-punten en `+toevoegingen` tellen als hetzelfde adres.

Rekenvoorbeeld (cadeaus beginnen nu rond €8,74):
- Alleen, elke dag tikken: na 10 dagen €2, na 40 dagen €8. Eerste cadeau na ongeveer 6 weken.
- Met 4 vrienden die elk 2 vrienden hebben en iedereen tikt: €0,10 + €0,80 per dag, plus €1 per 10 dagen. Eerste cadeau na ongeveer 10 dagen.

Wat het kost: hooguit €1 tegoed per persoon per dag (plus €1 per 10 dagen reeks), pot nooit boven €30. Je betaalt alleen voor mensen die echt blijven tikken; een pot vervalt na 30 dagen zonder tik.

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
  - **Volgende dag (vriendentegoed + dagmail)**: zet de testdag één dag verder, boekt het vriendentegoed van gisteren en stuurt de ochtendmail naar alle echte testadressen.
  - **Volgende dag zonder mail**: hetzelfde zonder mail.
  - **Maak 4 testvrienden (met elk 2 vrienden)**: 4 vrienden en 8 vrienden van vrienden die meteen meetellen en vandaag al tikten.
  - **Zet mijn reeks op 9**: de volgende dag levert de €1 reeksbonus op.
  - **Zet €10 in mijn pot**: om het cadeau kiezen te testen.
  - **Bekijk de mails**: de ochtendmail (met jouw pot) en de bevestigingsmail.
  - **Alle testdeelnemers** en **Alles wissen** (begint de testwereld opnieuw; geldt voor iedereen die test).
- Testvrienden (adressen op `@voorbeeld.invalid`) krijgen nooit mail en tikken elke dag vanzelf.
- De testwereld loopt ook elke ochtend mee in de cron: wie zich met een echt adres aanmeldde, krijgt dus ook echt elke ochtend een [TEST]-mail, tot 14 dagen zonder tik of tot "Alles wissen".
- Let op: de testdag kan voorlopen op de echte datum (elke "Volgende dag" zet hem een dag verder).

### 5.4 Testscript met wat je moet zien

| Stap | Doen | Verwacht |
|---|---|---|
| 1 | Open de aanmeldpagina, vul je adres in, vink 18+ aan, "Start mijn Spaarpot". | Tekst "Bijna klaar: bevestig via de mail die we je net stuurden." |
| 2 | Open de mail "[TEST] Bevestig je Kadoly Spaarpot", tik "Start mijn Spaarpot". | Potpagina: "Je pot: €0,10", blok "Gelukt, je pot staat klaar", "Dag 1 op rij. Over 9 dagen krijg je €1 extra.", blok "Nog €X" met het goedkoopste cadeau. |
| 3 | Zelfde adres nog eens aanmelden (ook met punten of `+test` bij Gmail). | Geen tweede mail; je bestaande pot blijft. |
| 4 | "Maak 4 testvrienden". | "Je spaart samen met 4 vrienden en 8 vrienden van vrienden." |
| 5 | "Volgende dag (vriendentegoed + dagmail)". | Pagina "Het is nu <datum>" met het vriendentegoed van gisteren. Mail "[TEST] Je pot: €0,90 · tik voor vandaag" met "Gisteren spaarden je vrienden €0,80 voor je." |
| 6 | Tik in die mail op "Tik voor vandaag". | "Je pot: €1", met "+€0,10 voor je tik van vandaag." en "+€0,80 van gisteren, omdat 4 vrienden en 8 vrienden van vrienden ook tikten." |
| 7 | Dezelfde dag nog eens tikken. | Pot blijft gelijk (één tik per dag). |
| 8 | "Zet mijn reeks op 9", dan "Volgende dag", dan tikken. | "+€1 voor 10 dagen op rij." |
| 9 | "Zet €10 in mijn pot". | Blok "Je pot is genoeg voor een cadeau" met knop "Kies je cadeau". |
| 10 | "Kies je cadeau", kies er een, vul een testadres in (postcode als 2805 AB). | "Top, je cadeau komt eraan", pot is met de prijs verlaagd. Henkjan krijgt de mail "[TEST] Spaarpot: bestel <product> voor <voornaam>". Laat dit Henkjan weten, zodat hij die niet echt bestelt. |
| 11 | Open "Kies je cadeau" opnieuw na het kiezen (of met de terugknop het formulier nog eens versturen). | Alleen cadeaus die je overgebleven pot dekt, of "Nog even sparen" met het bedrag dat nog nodig is. Opnieuw versturen van een te duur cadeau: "Je pot is nog niet genoeg voor dit cadeau." |
| 12 | "Deel via WhatsApp". | WhatsApp opent met: "Doe je mee met de Kadoly Spaarpot? Elke dag dat we allebei tikken, sparen we allebei €0,10 extra voor een gratis cadeau." plus je eigen link. |
| 13 | Open je eigen link (uit "Je eigen link", zelfde browser mag) en meld een tweede adres aan. | Aanmeldpagina met "Een vriend nodigde je uit." Bij jou staat "1 vriend telt mee na 3 dagen tikken." Na bevestigen en 3 tikdagen van het tweede adres (Volgende dag, dan met beide adressen tikken) telt hij als vriend, voor jullie allebei: de ochtend erna krijgen jullie allebei €0,10 extra. |
| 14 | Afmelden via de link onder de mail. | "Je bent afgemeld" met de knop "Per ongeluk? Meld me weer aan". Daarna "Volgende dag": geen mail meer voor dat adres. |
| 15 | (optioneel) 31x "Volgende dag zonder mail" zonder te tikken, dan tikken. | Melding dat de vorige pot is vervallen; nieuwe pot €0,10. |
| 16 | Bekijk de pagina's op een telefoon en in donkere modus. | Strak, geen grijs, knoppen in het eerste scherm, alles leesbaar. |

### 5.5 Terugmelden

Meld per stap wat je zag als het anders was dan verwacht, met de stapnummer, wat je deed, wat je zag (screenshot) en wat je verwachtte.
Zet het in de chat met Henkjan of in het werklog: `https://hjdk-api-henq.vercel.app/api/mm/handover?log=<tekst>&wie=spaarpot-test`.

## 6. Techniek

### 6.1 Bestanden

| Bestand | Wat |
|---|---|
| `lib/dagkans.js` | Alles: regels (`R`), aanmelden, bevestigen, tikken, kring, vriendentegoed, cadeau kiezen, mails, pagina's, testwereld, routes (`dkOp`). |
| `api/gids.js` | Stuurt elke `op=dk...` door: `if (/^dk[a-z]*$/.test(op)) return await (await import('../lib/dagkans.js')).dkOp(...)` en geeft `kaal`, `leesBody`, `isBot` mee. |
| `lib/kadoly-nieuws.js` | Levert `stuurMails`, `mailSchil`, `knop`, `mailHenkjan`, `mailKlaar`, `KADOLY_BEDRIJF` (zelfde afzender en opmaak als de Kadoly-nieuwsbrief, via Resend). |
| `vercel.json` | Cron `/api/gids?op=dkronde` om 06:04 UTC; `includeFiles` van `api/gids.js` voor dit bestand. |
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
| `dkoverdracht` | beschermde host | Dit document met de live stand erboven (`&format=json` kan ook). |

Live staat alles behalve `dkronde`, `dkstand` en `dkoverdracht` op "Niet gevonden" zolang `dk:aan` ontbreekt.

### 6.3 Opslag (KV, Vercel Redis)

Voorvoegsel `dk:` = live, `dkt<versie>:` = testwereld (`dktv` is de versie; "Alles wissen" verhoogt die).

| Sleutel | Inhoud |
|---|---|
| `p:<id>` | Deelnemer: `email, at, bevestigd, actief, af, link, code, van, reeks, laatste, dagen, act, pot (centen), log, samen, cadeaus, rust, vervallen`. `id` = `d` + hash van het genormaliseerde adres. |
| `link:<hash>`, `af:<hash>` | Eigen link en afmeldtoken naar id (alleen hashes opgeslagen). |
| `code:<code>` | Deelcode (6 tekens) naar id. |
| `pending:<hash>` | Aanmelding die nog bevestigd moet worden (2 dagen). |
| `emails` | Set met alle actieve deelnemers. |
| `kids:<id>` | Iedereen die via deze persoon binnenkwam. |
| `act:<id>` | Uitgenodigden die al 3 dagen tikten (de vriendschapsband). |
| `tik:<dag>` | Wie op die dag tikte (90 dagen). |
| `samen:<dag>` | Slot: vriendentegoed van die dag is al geboekt. |
| `tel:<dag>` | Tellers: `aanvraag, bevestigd, tik, samencent, dagmail, cadeau, cadeaucent, af`. |
| `adres:<id>:<dag>` | Bezorgadres bij een cadeau (60 dagen). |
| `offset` | Alleen test: hoeveel dagen de testwereld voorloopt. |
| `dk:aan` | Live-schakelaar (alleen zetten op Henkjans woord). |

Cadeaus komen uit de shopcatalogus `hjdk:shop:cat`: in voorraad, met foto, levertijd 1 tot 3 werkdagen, prijs incl. verzending tot €30, de populairste 30.

### 6.4 De ochtendronde (`dkronde`, 06:04 UTC)

1. Vriendentegoed van gisteren boeken (één keer per dag, slot `samen:<dag>`): voor iedereen die gisteren tikte, vrienden en vrienden van vrienden tellen die ook tikten.
2. Testwereld: testvrienden tikken voor vandaag.
3. Ochtendmail aan elke actieve deelnemer die in de laatste 14 dagen tikte, in batches van 90 via Resend (idempotency-sleutel per dag), met List-Unsubscribe.

### 6.5 Live zetten (alleen op Henkjans woord)

1. Kies het adres en zet een rewrite in `vercel.json` op host `gids.kadoly.com` (bijv. `/spaarpot` naar `/api/gids?op=dk`), plus de vervolgpagina's als dat netter is.
2. Zet `dk:aan` in de KV.
3. Controleer de aanmeldpagina, de bevestigingsmail en de eerste ochtendronde (`dkstand`).
4. Werk dit document, `lib/werking.js` en het werklog bij.

## 7. Open punten en beslissingen

1. **Bedragen bevestigen** (Henkjan): €0,10 per tik, €0,10 per vriend, €0,05 per vriend van een vriend, €1 per 10 dagen, pot max €30.
2. **Pot als korting in de kassa** van kadoly.com: met €6 in je pot iets van €35 voor €29 kopen. Dat maakt elke pot een reden om te kopen (verkoop), maar vraagt een kortingscode in de kassa. Nog uitzoeken of de kassa dat kan.
3. **Live-adres** op gids.kadoly.com en het startmoment.
4. **Waar de aanmeldpagina komt**: modal op kadoly.com, de Kadoly-gidsen, de bevestigde nieuwsbrief-abonnees.
5. **De wekelijkse winactie** van de Kadoly-nieuwsbrief (`lib/kadoly-nieuws.js`) is wél een kansspel en heeft geen einddatum. Besluit van Henkjan: stoppen, einddatum geven, of ook ombouwen naar tegoed.

## 8. Logboek (nieuwste bovenaan)

- 2026-11-17: Dit document gemaakt en live gezet op `op=dkoverdracht` (Henkjan: "Zet uitgebreide MD op vercel dan kan ik gaan testen in ander account").
- 2026-11-15: Winterkans-loterij vervangen door de Spaarpot (geen kans, geen einddatum). Getest in de testwereld met echte catalogus: pot €0,10 na eerste tik, €1 op dag 2 met 4+8 testvrienden, ochtendmail, cadeau kiezen, bestelmail, afmelden, vervallen na 30 dagen.
- 2026-11-14: Kadoly Winterkans gebouwd (dagelijkse loting met lootjes per vriend, drand), testwereld op `op=dk&test=1`.
