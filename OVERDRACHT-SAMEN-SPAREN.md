# Overdracht Samen sparen, clubs en clubwerving (Kadoly)

Live met de stand erboven: https://hjdk-api-henq.vercel.app/api/gids?op=ss&overdracht=1 (lezen met de Vercel-tool web_fetch_vercel_url; `&format=json` voor JSON). Bron: dit bestand in repo henkjandekrijger-glitch/hjdk-api.

Werk je hieraan, dan doe je in dezelfde commit:
- dit bestand bijwerken (de sectie die verandert en een regel bovenaan het logboek, sectie 13);
- `lib/werking.js` bijwerken (regels "Samen sparen bij Kadoly", "Clubwerving", "Kadoly partnermodel") en `WERKING_DATUM` op vandaag;
- het logboek van `OVERDRACHT-YOORS-SHOP.md` als het de winkel raakt;
- het werklog: `https://hjdk-api-henq.vercel.app/api/mm/handover?wie=spaar-<chat>&log=<wat je deed en wat er nog ligt>`.

Henkjan: Nederlands, kort, niet technisch, één stap tegelijk vragen, zuinig met tokens. Hij wil alles eerst zien met een klikbare link voor het live gaat. Nooit grijs, één zwarte knop per scherm.

## 0. In één minuut

**Wat het is**
- **Samen sparen**: elke betaalde bestelling bij Kadoly geeft meteen 1 zegel aan de koper en 1 aan wie hem uitnodigde.
- **Kaarten**: 5 zegels is een kaart. Elk cadeau in de winkel kost een aantal kaarten.
- **Doorgeven**: elke zegel die je krijgt mag je één keer doorgeven met een link.
- **Clubs en sites**: verdienen €2 per aankoop van een lid. Geeft een lid zijn eigen zegel ook aan de club, dan €4.
- **Clubwerving**: vindt verenigingen in heel Nederland (OpenStreetMap plus hun sponsorpagina) en mailt ze uit Henkjans eigen Gmail via Zernio, lerend van elk antwoord.

**Stand (23 nov 2026, avond)**
- Alles is gebouwd, getest en staat als concept op de beschermde host. Alle 19 schermen en mails zijn vereenvoudigd en staan in de echte kadoly.com-look.
- **LIVE staat uit.** Daarvoor zorgen drie vlaggen en één kv-sleutel (sectie 10).
- Er gaat geen mail naar clubs of leden, en de winkel toont nog geen zegels.

**Waar we op wachten**
1. **De winkel bouwt TAAK Z** (`lib/shopprompt.js`): zegels tonen op product, mandje en bedankpagina, en later inwisselen in de kassa.
2. **Henkjans "go".** Hij zei op 23 nov: "Als de boel live is id winkel": dan 10 clubs per werkdag.
3. **Henkjans feedback per schermnummer.** Hij wilde de hele flow eerst zelf doorlopen.

**Wat een nieuwe chat als eerste doet**
1. De live overdracht hierboven lezen.
2. `node scripts/test-samensparen.mjs` draaien. Die moet "ALLES GOED" geven.
3. Kijken of Henkjan feedback of een go gaf (werklog in /api/mm/handover, regels met wie=spaar-...).

## 1. Henkjans besluiten (met zijn woorden)

**22 november 2026: het model**
- "Geven van zegels met een link en zo geconnect sparen 1 zegel per aan koop"
- "Alles geeft een zegel . Retouren etc wel id gaten houden"
- "ze tellen meteen", "kost pas als er werkelijke aankoopt wodr gedaan"
- "je moet dus hele keten meten" en "De bijvangst van branding en attenderen ... moeten we allemaal meenemen"
- Partnermodel: "terug naar affiliate model want hebben we nog steeds niet"

**23 november 2026: de clubwerving**
- "Maak een mail voor verenigingen en clubs en vindt al die clubs om ze te mailen met een aanbieding die ze niet kunnen weerstaaan dan gaan we er iedere dag 10 mailen . of meer . Dit moet lerend zijn"
- "Ja maak mail lerend . Stuur nooit naar iemand die NU al in mijn email box zit . Dus die ik zou kennen . Maak de email compleet lerend dus check iedere reactie wat je ervan kunt leren . Je kunt gewoon bestuursleden persoonlijk mailen als je email adres vindt en info mag ook gewoon van mij"
  - Hij koos dit na uitleg over artikel 11.7 van de Telecommunicatiewet.
- "Ja aanzetten . Box is gekoppeld." Daarmee kwam de leerronde als geplande taak. Henkjan zette ZERNIO_API_KEY zelf in Vercel.

**23 november 2026: de flow en de schermen**
- "voor we gaan mailen wil ik hele flow live doorlopen en feedback geven . Van hele zegel systeem een stap voor stap": de doorloop-pagina.
- "Doe laatste assessement kijkend naar alle systemen of we nu best of all worlds hebben": een beoordeling met 6 punten. Zijn antwoord: "Ja 1. is opgelost . 2-4 bouwen . Alle schermen simpeler !! ZO min mogelijjk op een scherm om juist duidelijker te zijn . Ja shop komt het in . Ok 6 . Als de boel live is id winkel ."
  1. Het kassalek: door Henkjan zelf opgelost.
  2. Clubs warm houden met mijlpaalmails: gebouwd.
  3. Vast uitbetalen op de 1e van de maand, met het rekeningnummer bij de eerste €10: gebouwd.
  4. Alle schermen simpeler: gebouwd.
  5. Inwisselen in de kassa: komt in de shop (TAAK Z punt 5).
  6. 10 clubs per werkdag, zodra het live in de winkel staat.
- "Nu in echte kadoly look laten zien": kop, voet en stijl van kadoly.com.

**Staande regels voor dit werk**
- Mails volgen de skill mail-lerend:
  - geen gedachtestreepjes, geen uitroeptekens;
  - de eerste zin gaat over de ontvanger;
  - hoogstens 120 woorden;
  - contactgegevens erbij;
  - meetlinks van Clickmind;
  - altijd een manier om af te melden.
- Koude mail nooit via Resend: de voorwaarden van Resend verbieden het. Wel uit Henkjans Gmail via Zernio.
- Geen nullen of lege tellers op pagina's of in mails.
- Een seintje aan Henkjan hoogstens 1 per uur.
- Alles eerst laten zien met een link. Live alleen op zijn woord.

## 2. Hoe het werkt

### 2.1 Zegels en kaarten (`lib/samensparen.js`)

**Zegels**
- Elke betaalde bestelling (bedrag boven 0) geeft meteen 1 zegel aan de koper.
- Er gaat ook 1 zegel naar precies één uitnodiger, in deze volgorde:
  1. een lid;
  2. anders de club of site van het lid;
  3. anders de partner van de klik (7 dagen).
- Een club of site krijgt €2 in plaats van een zegel (`lib/partner.js`).
- Een lid dat via een club kwam, kan zijn eigen zegel ook aan de club geven. De club krijgt dan €4 voor die aankoop.

**Kaarten en cadeaus**
- Een kaart is 5 zegels (`KAART`).
- Een cadeau kost een aantal kaarten (`kaartenVoor`): wat het ons kost (`zegelsNodig`: inkoop met btw plus verzending) gedeeld door 5 maal de zegelwaarde, naar boven afgerond.
- De zegelwaarde (`R.zegelEur`) is standaard €2, binnen €1,50 en €3.
- Je kunt een cadeau nu nemen of doorsparen.
- Kiezen kan uit de hele winkel (`kiesLijst`): per aantal kaarten de 3 met de hoogste winkelprijs.
- Hooguit 2 cadeauzegels per kaart. De rest spaar je met aankopen.

**Retour**
- Bij een retour of terugbetaling gaat de zegel van die bestelling eraf, bij de koper en bij de uitnodiger.
- Was hij al ingewisseld, dan wordt dat `m.schuld` en staat de kaart een zegel achter.
- Clubgeld wordt teruggeboekt (`stornoBestelling`).

**Geldigheid**
- Zegels blijven 6 maanden geldig na de laatste zegel.
- Daarna volgt een mail en heb je 3 weken (`ssRonde`).

**Spelregels**
- De spelregels staan in `SPELREGELS` en zijn onder "Meer" op elke pagina te lezen.

### 2.2 Doorgeven

- Elke zegel die je krijgt, mag je één keer doorgeven (rechten = ontvangen min gegeven).
- De deellink (`op=ss&go=deel`) maakt een record `ss:deel:<code>` met een echte deadline.
- Wie op tijd pakt, krijgt 1 of 2 zegels van jou.
- Een drempelzoeker test hoeveel zegels en hoeveel dagen het beste werken:
  - instellingen in kv `ss:regels`, velden armen en dagen;
  - per lid willekeurig gekozen;
  - meting per aanbod in `ss:niv`;
  - instellen met `op=ss&zet=1&armen=1,2&dagen=3,7,21`.
- Wie te laat is, wordt wel gekoppeld, maar met de gewone eerste zegel.

### 2.3 Clubs en partners (`lib/partner.js`)

**Aanmelden**
- Een club zet zijn klaarstaande pagina aan op `op=clubs&c=<tok>`.
- Dat maakt een partner van soort club (`maakPartner`) met:
  - een code;
  - een dashboardsleutel `k`;
  - de clublink `gids.kadoly.com/p/<code>/samen-sparen`;
  - een tekst voor de groepsapp (`groepsTekst`).
- Een proefclub uit de doorloop krijgt een code `test-...` en telt nergens mee.

**Geld en boeking**
- Bedrag per bestelling: `pt:regels.perBestelling`, standaard €2.
- Uitbetalen vanaf `drempel`, standaard €10.
- De boeking per bestelling staat in grootboek `pt:o:<code>` en saldo `pt:s:<code>`. Een order kan maar één keer geboekt worden (`pt:ord:<order>`).

**Mails aan de club** (`mailClub`, via Resend, de gewone Kadoly-mailschil, één knop naar de groepsapp)
- `welkom`: "De pagina van X staat aan".
- `eerste`: "De eerste €2 voor X".
- `drempel` bij het passeren van €10: zonder rekeningnummer vraagt de mail het rekeningnummer.
- `maand` op de 1e van de maand: de stand.

**Uitbetalen**
- Vast op de 1e van de maand vanaf €10 (`maandRonde`, loopt in `ssRonde`).
- Henkjan krijgt de lijst via meld (Telegram en WhatsApp).
- Hij betaalt zelf en zet per club "Betaald" op `op=partner&uitbetalen=1` (beschermd). Dat boekt `pt:s.betaald`.
- Het rekeningnummer vult de club in op zijn dashboard (`a=iban`, IBAN-controle mod 97, `ibanOk`).

**Dashboard** (`op=partner&c=<code>&k=<sleutel>`)
- Bovenaan staan de naam en groot het verdiende bedrag (of de zin "Zet het bericht in de groepsapp...").
- Daaronder het IBAN-formulier (alleen als er geld klaarstaat) en één knop: Stuur naar de groepsapp.
- Onderaan staat de clublink, met de rest onder "Meer".

### 2.4 Clubwerving (`lib/clubwerf.js`, `op=clubs`)

**Vinden**
- Elke 2 uur draait een cron: `op=clubs&zoek=1`.
- Eens per 60 dagen worden alle clubs met een website uit OpenStreetMap gelezen.
  - Dat gaat per provincie via Overpass, met de ISO-code en anders de naam: Noord-Holland gaf 0 via de code.
  - Bij een fout wacht de ronde een uur. Een mislukte provincie gaat achteraan zodat de rest doorloopt; na 4 keer wordt hij overgeslagen tot de volgende lezing (`cw:osm.mis`). Op 24 nov hield Noord-Holland met steeds een time-out de andere 9 tegen.
- Daarna worden 40 sites per ronde gescand (`scanRonde`, `scanClub`) in deze volgorde:
  1. de sponsorpagina;
  2. dan de contact- of bestuurspagina;
  3. dan de homepage.
- Mailadressen achter Cloudflare-beveiliging worden ontcijferd.
- Eerste meting in Zuid-Holland: 540 clubs, ongeveer 55% met een bruikbaar adres.

**Het adres** (`score`)
- Eén adres per club, met de pagina als bron, in deze volgorde:
  1. sponsor of commercie (6 punten);
  2. bestuur of secretariaat (4);
  3. info (3);
  4. iemand op het eigen domein (2);
  5. een persoonlijk gratis adres (1), alleen van een bestuurs- of contactpagina.
- Nooit een adres van een ander domein: dat zijn de sponsors zelf.

**Nooit mailen naar wie al in Henkjans mailbox staat** (`bekend`, `bekendQuery`)
- Vóór de eerste mail zoekt de ronde in elke Zernio-mailbox (`zAccounts`, alleen accounts met @) naar het adres, en bij een eigen domein naar het hele domein.
- Gevonden, of niet te controleren, betekent: niet mailen.

**Mailen** (`ronde`)
- Een cron `op=clubs&ronde=1` draait op werkdagen tussen 8 en 19 uur Nederlandse tijd, elke 2 uur.
- Per ronde gaat perDag/6 de deur uit. perDag begint op 10.
- Verzending via Zernio uit Henkjans Gmail (`verstuur`), met een List-Unsubscribe-header.
- Elke mail wordt gemeld in de POST-lus (`lib/postlus.js`, project kadoly-clubs) met een meetlink (gids.kadoly.com/m/<code>) naar de klaarstaande clubpagina.

**De tekst** (`mailTekst`)
- Opening: "Ik las de sponsorpagina van X." als het adres van de sponsorpagina komt, anders "Ik zag de site van X."
- Tot 5 december noemt de mail Sinterklaas en kerst.
- Ondertekend door Henkjan met 06 55395630 en een WhatsApp-link.
- Laatste regel: "Liever geen mail meer van mij? Antwoord met stop".
- Na 7 dagen zonder reactie volgt één opvolgmail in dezelfde draad, met als nieuw feit de €4.

**Antwoorden lezen** (`leesAntwoorden`, `leesAntwoord`)
- Elke ronde leest de mailboxen en deelt elk antwoord in: afwezig, stop, nee, later, ja, vraag of anders.
- Bezwaren worden geteld per soort (`BEZWAREN`) en per onderwerp.
- Een "stop" komt op de afmeldlijst (`cw:af`).
- Bij ja, vraag of later krijgt Henkjan één seintje (`meldHenkjan`).

**De leerronde** (geplande taak, zie sectie 7)
- Leest elk nieuw antwoord via `op=clubs&leer=1`.
- Schrijft lessen (`&les=`), nieuwe onderwerpregels (`&uitdager=`) en vragen met antwoord voor de clubpagina (`&vraag=vraag|antwoord`).
- Markeert gelezen met `&leer=1&klaar=1`.

**Leren in de ronde zelf** (`leer`)
- Onderwerpregel a tegen b, om en om tot 10 mails, daarna Thompson-sampling.
- Winnaar bij 95% kans, vanaf 60 mails per arm. Dan komt de volgende uit `ONDERWERPEN` of uit de extra regels van de leerronde.
- Volume: +5 per 3 dagen tot 40, als bounces en afmeldingen onder 3% blijven. Halveren bij 6% bounces of 5% afmeldingen.

**Afmelden**
- Een link in de mail (`op=clubs&af=<tok>`) en de one-click-header. Beide zetten het adres op `cw:af`.

### 2.5 Economie en kettingmeter (`ssKetting`, `ssMarges`)

**De kettingmeter** (dagelijks in `ssRonde`, los: `op=ss&ketting=1`)
- 10% van de kopers zonder kaart en zonder uitnodiger is controlegroep en krijgt geen zegel (`ss:grp:ctrl` tegen `ss:grp:test`).
- Vergelijken: extra marge van de testgroep tegen de kosten. De kosten zijn de cadeaus, het clubgeld en de open zegels maal de zegelwaarde.
- Daarbovenop telt de bijvangst: echte bezoekers via gedeelde links maal `ss:regels.bezoekEur` (standaard €0,20).

**Wanneer de knop draait**
- Pas een oordeel vanaf 50 kopers met zegels en 10 in de controlegroep.
- Dan hooguit één stap per 7 dagen:
  - saldo negatief: zegelwaarde +€0,25, zodat cadeaus meer kaarten kosten;
  - saldo ruim positief: zegelwaarde −€0,25.
- Elke stap komt in het logboek `ss:knop`.

### 2.6 Look (`lib/kadolylook.js`)

**De kadoly.com-look**
- Samen sparen, de clubpagina en het clubdashboard krijgen kop, voet, stylesheets en stijlblokken van kadoly.com zelf.
- Bron: kadoly.com/shop/wonen, opgehaald met dezelfde helpers als het Shopify-thema in `lib/shoptheme.js`.
- Bewaard in kv `kd:look` en 12 uur in het geheugen.
- Lukt ophalen niet, dan valt de pagina terug op de gidsschil van gids.kadoly.com (`kaalKd` in `fn/gids.js`).

**Aanpassingen aan de kop van kadoly.com**
- De chatknop en de taalkeuze gaan eruit: die werken alleen op kadoly.com.
- Zoeken wordt een formulier naar kadoly.com/zoeken.
- De winkelwagen blijft naar kadoly.com/cart wijzen.

**Eigen stijl** (alleen binnen `.kd-main`)
- Knoppen zoals kadoly.com: zwart #111827, hoeken 12px, op de telefoon over de volle breedte.
- Ruimte onder de vaste kop: 88px, op de telefoon 132px.

**Controle en verversen**
- `op=kdbron&kit=1` op de beschermde host geeft de lengte van kop, voet en css, of de fout.
- De kop van kadoly.com heette eerst `ypn` en nu `ys-navbar ynav`. `kopBegin` zoekt beide. Verandert hij weer, dan geeft `kit=1` de fout met de kop die er wél staat.

**Mails**
- Mails gebruiken de bestaande Kadoly-mailschil (`kadoly-nieuws.js` mailSchil) met het Kadoly-logo.
- De knoppen in de mails zijn nog helemaal rond. Op de site hebben ze hoeken van 12px. Henkjan is gevraagd of de mails ook zo moeten; dat geldt dan voor alle Kadoly-mails (open punt).

### 2.7 Wat de winkel moet bouwen (TAAK Z in `lib/shopprompt.js`)

1. **Productpagina**: `https://gids.kadoly.com/api/gids?op=ss&product=<id>` levert een veld `tekst`. Die komt onder de prijs, maar alleen als `live` true is.
2. **Mandje**: `op=ss&mand=<id>:<n>,...` levert `tekst` boven de afrekenknop.
3. **Bedankpagina en bevestigingsmail**: "Deze bestelling gaf 1 zegel" met een knop naar `op=ss&o=<ordernummer>`.
4. **/api/lus-feed**: ook "bezorgd" (delivered en delivered_at) doorgeven. Refund, retour en cancel blijven doorkomen.
5. **Later**: een volle kaart inwisselen in de kassa met een code die één cadeau op €0 zet. Tot dan loopt inwisselen via WhatsApp met Henkjan, daarna geboekt met `op=ss&inwissel=1&m=<kaart>&c=<product>` (beschermd).

Bestellingen komen binnen via `ssBestelling` (aangeroepen vanuit de winkelkoppeling in fn/shop.js) en retouren via `ssRetour`.

## 3. De 19 schermen en mails (volgorde van de doorloop)

Overzicht met schermafdrukken in de echte look (privé artifact van Henkjan): https://claude.ai/artifact/9FeQDMtKETMoLdjKs8yZyL

**De club**
1. Mail aan de club (uit Henkjans Gmail).
2. Clubpagina: "X krijgt €2 bij elke aankoop van een lid", adres al ingevuld, knop "Zet de pagina aan".
3. Mail "Jullie pagina staat aan".
4. Clubdashboard.
5. Bericht in de groepsapp.

**Het lid**

6. Startpagina via de clublink: "Spaar mee met X".
7. Welkomstmail: de eerste zegel is cadeau.
8. Spaarkaart 1 van 5.
9. Mail na een aankoop.
10. Kaart 2 van 5.
11. Mail aan de club: "De eerste €2 is binnen".

**De vriend**

12. Doorgeven via WhatsApp, met een datum.
13. Uitnodigingspagina: "Sanne geeft je een zegel".
14. Welkomstmail van de vriend.
15. Mail aan Sanne: "Petra kocht iets: 1 zegel voor jou".

**De volle kaart**

16. Mail "Je kaart is vol".
17. De volle kaart.
18. Kies je cadeau.
19. Inwisselen (nu via WhatsApp).

Henkjan geeft feedback met het nummer erbij.

## 4. Code

| Bestand | Wat |
|---|---|
| `lib/samensparen.js` | zegels, kaarten, doorgeven, pagina's en mails van leden, kettingmeter, `ssOp` (alle `op=ss`), `ssRonde` (dagelijks), test-hulpen `ssProefKoop`, `ssProefLid`, `ssProefOpruimen` |
| `lib/partner.js` | partners en clubs, grootboek, `mailClub`, `maandRonde`, `ibanOk`, dashboard en aanmelden (`partnerOp`), klik via /p/ (`ptOp`) |
| `lib/clubwerf.js` | clubs vinden, adres kiezen, mailen via Zernio, antwoorden, leren, doorloop, voorbeeld, clubpagina (`clubOp`) |
| `lib/kadolylook.js` | kadoly.com-look (`kadolyKit`, `kadolySchil`, `kdBron`) |
| `lib/shoptheme.js` | helpers om kadoly.com te lezen (`haal`, `blok`, `absoluut`, `stijlen`, `koplinks`, `kopBegin`), ook voor het Shopify-thema |
| `lib/kadoly-nieuws.js` | mailschil, knop, verzenden via Resend (`stuurMails`, `mailKlaar`) |
| `lib/postlus.js` | POST-lus: meld en uitkomst van elke mail, meetlinks |
| `fn/gids.js` | router: `op=ss`, `op=clubs`, `op=partner`, `op=pt`, `op=kdbron`; `kaalKd` (look); `ssRonde` in de cron `op=indexnow` |
| `lib/shopprompt.js` | TAAK Z voor de winkel |
| `scripts/test-samensparen.mjs` | alle proeven zonder sleutels of netwerk (sectie 9) |

Vlaggen: `LIVE` in `lib/samensparen.js`, `lib/partner.js` en `lib/clubwerf.js`, plus kv `cw:regels.aan`.

## 5. Eindpunten

"Beschermd" betekent: alleen op hjdk-api-henq.vercel.app (Vercel-login, in een chat via web_fetch_vercel_url). Zolang LIVE uit staat, werkt alles alleen daar.

**Samen sparen**

| Adres | Wat | Beschermd |
|---|---|---|
| `/api/gids?op=ss` | startpagina; `&pt=<code>` via een club | concept |
| `op=ss&m=<kaart>&k=<sleutel>` | spaarkaart van een lid; `&kies=1` cadeau kiezen; `&nieuw=1` net begonnen | concept |
| `op=ss&u=<lid>&d=<code>` | uitnodiging (doorgegeven zegel) | concept |
| `op=ss&o=<order>` | pagina na de bestelling | concept |
| `op=ss&product=<id>`, `op=ss&mand=...` | aantallen voor de winkel (JSON, openbaar) | nee |
| `op=ss&stand=1` | stand en lekken | ja |
| `op=ss&overdracht=1` | deze overdracht met de live stand | ja |
| `op=ss&zet=1&...`, `&marges=1`, `&ketting=1`, `&inwissel=1&m=&c=` | instellen, marges, kettingmeter, inwisselen boeken | ja |

**Clubs en partners**

| Adres | Wat | Beschermd |
|---|---|---|
| `/api/gids?op=partner&c=<code>&k=<sleutel>` | clubdashboard; POST `a=iban` | concept |
| `op=partner&uitbetalen=1` | uitbetaallijst met knop Betaald | ja |
| `op=partner&stand=1` | stand partners | ja |

**Clubwerving**

| Adres | Wat | Beschermd |
|---|---|---|
| `/api/gids?op=clubs&c=<tok>` | klaarstaande clubpagina; POST zet hem aan | concept |
| `op=clubs&stand=1` | stand clubwerving: gevonden, rij, verstuurd, antwoorden, lessen, lekken, wachtOp | ja |
| `op=clubs&voorbeeld=1` | de echte mails voor de eerste 3 clubs in de rij, met hun clubpagina | ja |
| `op=clubs&doorloop=1` | doorloop in 12 stappen, met acties start, koop, retour en opruimen | ja |
| `op=clubs&zoek=1`, `op=clubs&ronde=1` | de rondes (cron) | ja |
| `op=clubs&leer=1` (+`&klaar=1`), `&les=`, `&uitdager=`, `&vraag=` | leerronde | ja |
| `op=clubs&zet=1&...` | regels instellen (aan, perDag, max) | ja |
| `op=clubs&ztest=1` | Zernio-koppeling testen (mailboxen, vorm van een bericht) | ja |
| `op=clubs&af=<tok>` | afmelden | nee |

**Look**

| Adres | Wat | Beschermd |
|---|---|---|
| `/api/gids?op=kdbron&kit=1` | look verversen en controleren | ja |
| `op=kdbron&u=<url>` | een bestand van kadoly.com of cdn.kadoly.com doorgeven (voor schermafdrukken) | ja |

## 6. Opslag (kv, `lib/db.js`)

| Sleutel | Wat |
|---|---|
| `ss:m:<id>`, `ss:em:<hash>`, `ss:leden` | leden en kaarten |
| `ss:ord:<order>`, `ss:ordinfo:`, `ss:los:` | geboekte bestellingen (één keer), info, losse zegels |
| `ss:deel:<code>` | doorgegeven zegels met deadline |
| `ss:regels`, `ss:niv`, `ss:actie` | instellingen, meting per aanbod, actie |
| `ss:tel:<dag>` | tellers per dag (zie, start, leden, deel, open, mee, mailNietKlaar, mailFout, ...) |
| `ss:grp:test`, `ss:grp:ctrl`, `ss:grp:verwezen`, `ss:ketting`, `ss:knop`, `ss:kost`, `ss:inwissel` | kettingmeter, kosten, inwisselingen |
| `pt:p:<code>`, `pt:alle`, `pt:o:<code>`, `pt:s:<code>`, `pt:ord:<order>`, `pt:maand:`, `pt:regels`, `pt:tel:` | partners, grootboek, saldo, dubbelslot, maandronde, regels, tellers |
| `cw:club`, `cw:rij`, `cw:scan`, `cw:osm`, `cw:adres`, `cw:domein` | gevonden clubs, rij om te mailen, rij om te scannen, voortgang OSM, adressen |
| `cw:gestuurd`, `cw:tok`, `cw:af`, `cw:antw`, `cw:bezwaar`, `cw:lessen`, `cw:arm:`, `cw:tot`, `cw:tel:<dag>`, `cw:regels`, `cw:laatste`, `cw:test`, `cw:zacc` | verzonden, clubpagina's, afmeldingen, antwoorden, leren, tellers, regels, proefclub, Zernio-account |
| `kd:look` | kop, voet en css van kadoly.com |

## 7. Crons en geplande taken

**Crons in vercel.json**

| Cron | Wanneer (UTC) | Wat |
|---|---|---|
| `/api/gids?op=clubs&zoek=1` | 41 */2 * * * | clubs vinden en sites scannen; draait ook terwijl LIVE uit staat, om de rij te vullen |
| `/api/gids?op=clubs&ronde=1` | 17 7-17/2 * * 1-5 | mailen, opvolgen, antwoorden lezen; doet niets zolang LIVE of cw:regels.aan uit staat |
| `/api/gids?op=indexnow` | 55 6 * * * | daarin `ssRonde`: geldigheid, kettingmeter, en op de 1e van de maand `maandRonde` (uitbetalen) |

**Geplande taak**
- "Clubwerving: leer van elk antwoord" (trig_015Yyy4khJXQh3fndNobbgXb).
- Werkdagen om 20:34 Nederlandse tijd, automatische goedkeuring.
- Leest `op=clubs&leer=1` en stopt meteen als er niets nieuws is. Verstuurt zelf nooit mail.

## 8. Sleutels en accounts (alleen namen, nooit waarden)

**Sleutels in Vercel, project hjdk-api**
- `ZERNIO_API_KEY`: Henkjan zette hem zelf, link: zernio.com, instellingen, API.
- `ZERNIO_MAIL_ACCOUNT`: optioneel. Zonder deze sleutel kiest de code het eerste Zernio-account met een @.
- `MELD_SLEUTEL`: seintjes naar spel.todayin.email/api/meld.
- De Resend-sleutel van kadoly-nieuws.

**Zernio**
- Gmail-account 6b045a066867e20e778c04c7.
- Profiel Kadoly 6afaf9820c09220040d746f4.

## 9. Testen

```
node scripts/test-samensparen.mjs                      # leden (43), clubs (41), doorloop (5): moet ALLES GOED geven
node scripts/test-samensparen.mjs --schermen /tmp/ss   # ook alle schermen en mails als HTML
```

**Hoe de test werkt**
- De test kopieert `lib/*.js` naar een tijdelijke map en zet er de nepversies uit `scripts/test-samensparen/stub-leden` en `stub-clubs` overheen:
  - kv in het geheugen;
  - opgevangen mails;
  - nep-Clickmind;
  - een nep-POST-lus.
- `clubs.mjs` bootst Overpass, de clubsites en Zernio na met een nep-fetch.
- Faalt een aanpassing ("bevat ... niet meer"), dan veranderde de code en moet de test mee.

**Schermafdrukken in de echte look**
- Vanuit de cloudsessie zijn kadoly.com en cdn.kadoly.com geblokkeerd. Zo omzeil je dat:
  1. Haal een deellink op met de Vercel-tool `get_access_to_vercel_url` voor https://hjdk-api-henq.vercel.app. Zet die alleen in een cookiebestand in de kladmap, nooit in code of berichten.
  2. Haal met curl en dat cookie kadoly.com op via `op=kdbron&u=<url>`.
  3. Bouw de look lokaal met `kadolyKit`: nep-fetch naar het opgehaalde HTML-bestand.
  4. Zet de inhoud van elke pagina in `kadolySchil`.
  5. Maak de afdrukken met Playwright. Stuur in `page.route` alle aanvragen naar (cdn.)kadoly.com door via `op=kdbron` en breek andere hosts af.
  6. Telefoon: viewport 390x844, deviceScaleFactor 2.
- Productfoto's van leveranciers laden daar niet (andere host); zeg dat bij de afdrukken.

**Live controleren**
- Haal `op=clubs&c=<tok>` of `op=ss` op en zoek `ys-navbar` (de look) en `kd-main`.

## 10. Live zetten (alleen op Henkjans woord)

**Voorwaarden**
- De winkel toont zegels (TAAK Z punt 1 tot en met 3).
- `/api/lus-feed` geeft bezorgd en retour door.
- Henkjan zegt go.

**Volgorde**
1. `node scripts/test-samensparen.mjs` geeft ALLES GOED.
2. Controleer dat `op=kdbron&kit=1` ok geeft.
3. Zet `export const LIVE = true;` in `lib/samensparen.js` en `lib/partner.js`. Pagina's draaien dan op gids.kadoly.com:
   - `/samen-sparen`;
   - `/p/<code>/samen-sparen`;
   - `/api/gids?op=...`.
   Werk `lib/werking.js` en dit bestand bij, één commit en één push.
4. Controleer live:
   - gids.kadoly.com/samen-sparen;
   - `op=ss&product=<id>` geeft `live: true`;
   - een proefbestelling via de doorloop (die telt niet mee).
5. Pas daarna de clubwerving:
   - `LIVE = true` in `lib/clubwerf.js`, push;
   - dan `op=clubs&zet=1&aan=1` (perDag staat op 10).
   - Controleer de eerste ronde in `op=clubs&stand=1`: `verstuurd`, geen fouten, en `bekend` slaat over wie al in de mailbox staat.
6. Meld Henkjan: wat er live staat, de link, en wanneer de eerste oordelen komen:
   - de onderwerpregels bij 60 mails per arm;
   - de kettingmeter bij 50 kopers met zegels.

Uitzetten kan altijd terug: `op=clubs&zet=1&aan=0`, of de `LIVE`-vlaggen terug op false.

## 11. Open punten

1. **Henkjans feedback op de 19 schermen** (per nummer). Daarna aanpassen en de afdrukken vernieuwen.
2. **TAAK Z in de winkel**: zegels tonen, bedankpagina, bezorgd in /api/lus-feed, inwisselen in de kassa.
3. **Knoppen in de Kadoly-mails**: rond, of hoeken van 12px zoals de site? Antwoord van Henkjan nodig. Het geldt voor alle Kadoly-mails (`lib/kadoly-nieuws.js` knop).
4. **Live zetten volgens sectie 10.** Daarna 10 clubs per werkdag. Het volume stijgt vanzelf tot 40 als bounces en afmeldingen laag blijven.
5. **Uitbetalen is nog handwerk**: Henkjan maakt het geld zelf over. Pas automatiseren als er veel clubs zijn.
6. **Na live: lekken volgen** in `op=ss&stand=1` en `op=clubs&stand=1`:
   - niemand start;
   - niemand geeft door;
   - links niet geopend;
   - clubs bekijken maar zetten niet aan.
   Los een lek meteen op en meld het daarna (CLAUDE.md, "Nooit vastlopen").

## 12. Valkuilen

**Privacy en commits**
- **Privacy-plugin.** Bash-opdrachten die `lib/werking.js`, `fn/gids.js` of `OVERDRACHT-*.md` bij naam noemen, worden geweigerd: daar staat Henkjans mailadres in.
  - Gebruik de Edit-tool of Python met `glob`.
  - Commit met `git add <bestanden>` en `git add -u`, nooit `git add -A`.
- **Eén push per afgeronde taak.** Elke push is een build (kosten).
- **Eerst `git pull --rebase`.** Bij een conflict in een OVERDRACHT-logboek: beide regels houden.

**Mail en Zernio**
- **Resend verbiedt koude mail.** Clubmail gaat altijd via Zernio uit Henkjans Gmail.
- **Zernio** geeft `{data:[...]}` terug. Berichten hebben `from.email`, `text`, `snippet` en `date`. Zoeken met `searchQueryNative`.
- **De productiefout "ids is not defined"** in `zAccounts` kwam door een `//`-commentaar achter code op één regel. De test zette `ZERNIO_MAIL_ACCOUNT` en sloeg dat pad over. `doorloop.mjs` draait daarom zonder die sleutel.

**Overpass (OpenStreetMap)**
- Heel Nederland in één vraag geeft 406 of 504, daarom per provincie.
- Een lege provincie wordt opnieuw gevraagd op naam.
- Noord-Holland geeft op naam een time-out. Een mislukte provincie gaat daarom achteraan en na 4 keer wordt hij overgeslagen; de stand meldt dat als lek. Opnieuw proberen: zet `cw:osm.mis` voor die provincie op 0.

**Look en kadoly.com**
- **De kop van kadoly.com verandert van naam.** Eerst `ypn`, sinds november `ys-navbar ynav`. Daardoor faalde ook de nachtelijke sync van het Shopify-thema. `kopBegin` vangt beide; controleer met `op=kdbron&kit=1`.
- **De kop van kadoly.com staat vast bovenaan** en op de telefoon zweeft de zoekbalk eronder. Zonder de extra ruimte in `.kd-main` valt de paginatitel eronder weg.

**Code en tests**
- **`q` in de router is een URLSearchParams.** Altijd `q.get('x')`, nooit `q.x`.
- **Testvolgorde bij de schermen.** `leden-schermen.mjs` doet een extra aankoop. Draai hem vóór `leden.mjs` (de runner doet dat), anders kloppen de latere schermen niet.
- **Proefdata telt nergens mee**: orders `PROEF-...`, partners `test-...`, `ssBestelling` met `test`. Ruim op via doorloopstap 12.

## 13. Logboek (nieuwste bovenaan)

- 2026-11-24 (spaar-chat): lek gevonden bij het maken van de overdracht: Noord-Holland gaf bij OpenStreetMap steeds een time-out en hield 9 provincies tegen (2 van 12 gelezen, 541 clubs). Nu gaat een mislukte provincie achteraan en na 4 keer overgeslagen; test erbij (clubs 41). Oordeel: de volgende zoekrondes, elke 2 uur, moeten Utrecht en verder lezen.
- 2026-11-23 (spaar-chat, Henkjan: "Zet uitgebreide overdracht klaar voor andere chat"): dit bestand, live op `op=ss&overdracht=1` met de stand erboven; proeven in de repo (`scripts/test-samensparen.mjs`); regel in CLAUDE.md.
- 2026-11-23 (spaar-chat, "Nu in echte kadoly look laten zien"): `lib/kadolylook.js`, kop en voet van kadoly.com, knoppen zoals kadoly.com; kopBegin in `lib/shoptheme.js` (ook de thema-sync); de 19 afdrukken vernieuwd.
- 2026-11-23 (spaar-chat, "2-4 bouwen . Alle schermen simpeler"): mijlpaalmails aan clubs (welkom, eerste €2, €10, maand), uitbetalen op de 1e met IBAN-vraag, uitbetaallijst; alle schermen en mails naar één kop, één zin, één knop.
- 2026-11-23 (spaar-chat): doorloop in 12 stappen, proefaankopen en proefpartner; voorbeeldpagina; flowpagina met afdrukken.
- 2026-11-23 (spaar-chat, clubwerving): `lib/clubwerf.js` met vinden via OSM, adres kiezen, nooit-bekend-controle via Zernio, mailen, opvolgen, antwoorden indelen, leren, afmelden; crons; geplande leerronde.
- 2026-11-22 (spaar-chat): Samen sparen-model (zegels, kaarten, doorgeven, clubs €2, retour, kettingmeter), partnermodel; TAAK Z voor de winkel.
