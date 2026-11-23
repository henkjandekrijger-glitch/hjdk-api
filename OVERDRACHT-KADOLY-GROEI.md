# Overdracht Kadoly organische groei en contentmarketing

Live: https://hjdk-api-henq.vercel.app/api/shop?op=groeioverdracht (met de Clickmind-stand van vandaag bovenaan; als tekst: `&vorm=tekst`; lezen met de Vercel-tool `web_fetch_vercel_url`). Bron: `OVERDRACHT-KADOLY-GROEI.md` in repo hjdk-api. Werk dit bestand bij in dezelfde commit als elke wijziging in hoe de groei werkt: de stand, een regel in het logboek en de dagupdate.

Opgezet op 23 nov 2026. Henkjan gaf de opdracht: "Maak een plan voor me voor organische groei dan ga ik die aan andere chat uitbesteden . We MOETEN ook met content marketing groeien ." en daarna: "Mag heel uitgebreid zijn met dagelijkse grote updates ik maak heel acccount vrij ervooor ."

Dit plan wordt sinds 23 november uitgevoerd in een eigen ChatGPT-werkaccount (verder: het groei-account). Dat account werkt elke dag aan organische groei van kadoly.com en stuurt Henkjan elke dag één grote update. Twee geplande taken zijn actief om 09:43 en 17:43 UTC. De pushinstelling is via de beschikbare tools niet instelbaar of bevestigd.

## Actuele meetafspraken (groei-account, 23 november 2026)
- `orgstand?dagen=7` begrenst alleen dagelijkse kliktellers. Kanaal- en posttotalen zijn cumulatief sinds 16 november. Ze zijn geen weekcijfers. Dagelijkse snapshots staan vanaf nu in `kadoly/groei/`; weekvergelijkingen en opt-ins per motor blijven onbekend totdat er passend afgebakende data is.
- Eerste onderzoek en beheerderstaak: `docs/kadoly-groei-ochtendronde-2026-11-23.md`. De botmeting simuleert headers vanaf één verbinding, geen echte provider-IP's. Ochtendmeting: Pinterest kreeg 200 op home en robots.txt; Facebook, Bing en Google kregen daar 403. Middagcontrole hieronder gebruikt een andere verbinding en vervangt geen echte crawlerinspectie. Blokkerende regel en echte crawlerstatus moeten nog in de logs en inspectietools worden vastgesteld.
- Koopmeting: 2 TikTok-kopen voor samen € 91,36 bevestigd; organische kooproute en het verschil met 5 betaalde feedregels blijven onbewezen en zijn aan de shop overgedragen. Geen testkoop of conversie nagebootst.
- Nieuwe lootjestool: concept in `docs/kadoly-lootjes-concept.html`, alleen lokaal en expliciet uitgesloten van Vercel. Geen echte groepen of deelnemerslinks, geen openbare route. Wacht op Henkjans ja.
- Werktoegang: GitHub-connector heeft pushrecht. Bij ontbrekend lokaal Git-netwerk lees/schrijf via die connector, controleer de actuele main en alle betrokken bestands-SHA's, behoud andermans wijzigingen en werk in één geteste commit. De oude `/home/claude`-paden en `add_repo` zijn geen beschikbare tools in dit werkaccount. De Zernio-connector is hier niet beschikbaar. Op 23 november is de ingelogde Zernio-browser gebruikt voor de drie expliciet goedgekeurde merkconcepten; publicatie is met post-ID’s en openbare pinlinks bevestigd (zie de aanvulling in Dagupdates).

## 0. Leesroute voor elke sessie
1. Lees dit document helemaal, live via de link hierboven. Begin daarna bij de dagupdate van gisteren (onderaan).
2. Lees de werkafspraken in `CLAUDE.md` van hjdk-api: kosten, push en router.
3. Lees de deeloverdrachten die je raakt (zie 13): social, TikTok, gids en redactie, shop.
4. Doe het werk van vandaag (zie 8 en 9) en eindig met de dagupdate (zie 9).

## 1. Stand bij de start (23 nov 2026)
Kadoly (kadoly.com, ADSFAIR B.V.) is een webshop van onafhankelijke merken. Er staan ongeveer 3.800 producten in, waarvan 743 uniek: die zijn nergens anders met een vergelijkbare prijs te vinden. Pakketten (vaste sets) en de hoek Rust & ritueel komen erbij. De klant betaalt EUR 6,95 verzending per bestelling. Prijzen op kadoly.com zijn alles-in. Klantenservice is open ma t/m vr van 9:00 tot 17:30 (NL).

Organisch verkeer, Clickmind 16 tot 22 nov (`/api/shop?op=orgstand&dagen=7`):

| Kanaal | Kliks | Echte mensen | Actie | Mandje | Koop |
|---|---|---|---|---|---|
| Facebook | 33 | 9 | 2 | 1 | 0 |
| gids.kadoly.com | 6 | 1 | 1 | 0 | 0 |
| Pinterest | 3 | 0 | 0 | 0 | 0 |

- Posts met de meeste kliks: v-kersthoek_set (6), v-n261119a (5) en 1117-sieraad (4). v-kerstfinds gaf het enige mandje. Keuzehulpen die al kliks gaven: cadeau voor een zwangere vrouw, cadeau oma 80 jaar, cadeau juf of meester.
- Social 16 tot 20 nov:
  - Facebook: 0 volgers;
  - Instagram: 1 volger, bijna geen bereik;
  - Pinterest: 2 volgers, 65 vertoningen, 10 pinkliks.
  Sinds 20 nov gaan er op Facebook en Instagram geen productposts meer uit, alleen video's.
- gids.kadoly.com:
  - 38 gidsen en 5 cadeautipshubs (voor haar, voor hem, kerstcadeau, housewarming, voor moeder);
  - elke dag een nieuwe gids en elke dag een redactieartikel;
  - de AI-crawlers komen er al (GPTBot, ClaudeBot, Meta, Bing, Apple);
  - Google-vertoningen zijn er nog bijna niet;
  - de nieuwsbrief heeft 0 abonnees;
  - in de gidsuitproef van 28 dagen leverde de productpagina-arm 391 kliks op, 7 keer de kassa, 5 keer betalen en 0 kopen.
- kadoly.com in Google: ongeveer 431 organische kliks per 28 dagen (stand 14 nov).
- Verkopen tot nu toe: 2, beide via TikTok-advertenties (15 tot 20 nov). TikTok-advertenties staan stil. Google Shopping loopt op EUR 15 per dag, maar dat is betaald en valt buiten dit plan.
- Vertrouwen: WebwinkelKeur is aangevraagd (aspirant, nog 0 reviews). Google Klantenreviews is aangevraagd op 19 nov.

## 2. Doel, noordster en streefcijfers
Noordster: **verkopen uit organisch verkeer**, gemeten in Clickmind (keten klik, echt mens, actie, mandje, koop). Voorlopers die we elke dag volgen:
- echte bezoekers per kanaal;
- e-mailadressen met toestemming;
- terugkerende bezoekers.

Henkjan wil vooral kopers die terugkomen ("Die herhalings aankopen van deze mensen daar gaat het om dus alles moet perfect verlopen !!"). Elke organische koper telt dus dubbel: hij moet een goede ervaring hebben en een reden om terug te komen.

Streefcijfers per week (organisch, Clickmind). Stel ze bij na week 1 met de echte cijfers:

| Week | Echte bezoekers | Adressen | Organische verkopen | Wat er moet staan |
|---|---|---|---|---|
| 1 (23 tot 29 nov) | 150 | 30 | eerste mandjes | blokkades weg, lootjes live, Pinterest op orde |
| 2 (30 nov tot 6 dec) | 400 | 100 | 3 | Sinterklaas-piek, merken delen, eerste persverhaal |
| 3 (7 tot 13 dec) | 800 | 200 | 10 | kerst: Secret Santa, kerstgidsen, video's die werken op schaal |
| 4 (14 tot 20 dec) | 1.200 | 300 | 15 | laatste besteldag kerst 16 dec, daarna last minute |
| 5 en 6 (21 dec tot 3 jan) | houd 50% van week 4 | | | januari en Valentijn voorbereiden |

## 3. Spelregels (gelden voor alles)
- **Eerst laten zien, dan live.** Een nieuw soort ding (tool, paginatype, mail, kanaal): eerst het idee in een paar regels, dan het stuk zelf met een klikbare link, live pas na Henkjans ja. Gaat het om meer van iets wat al goedgekeurd is (de volgende gids, pin of video in een bestaande vorm), dan mag het gewoon live.
- **Eerlijk.** Echte productfoto's, echte prijzen, echte levertijden. Nooit nep-reviews, nooit verzonnen schaarste of urgentie. Een deadline alleen als hij echt is. Elk cijfer in een tekst komt van een pagina of uit de data.
- **Positionering.** Kadoly is een webshop van onafhankelijke merken voor alles. Cadeauvragen zijn een goede ingang, maar noem Kadoly nooit een cadeauwinkel.
- **Per medium.** Elk medium krijgt een stuk dat daarvoor gemaakt is, niet een tekstje dat overal hetzelfde is. Leer per medium.
- **Clickmind in elke link**, behalve op Pinterest:
  - vorm: `go.kadoly.com/o?k=<kanaal>&p=<pid>&c=<post>` (b=<pakket> voor een pakket);
  - kanalen: fb, ig, pin, tt, th, x, li, yt, tg, wa, gbp, nb, bs, rd, g;
  - Pinterest linkt direct naar kadoly.com met utm (zie de social-overdracht), want doorstuurlinks ziet Pinterest als spam;
  - op gids.kadoly.com lopen de links via `/naar` en `op=gidsuit`.
- **Teksten schrijft Claude zelf**, in de sessie. Geen AI Gateway en geen AI-aanroep tijdens het laden van een pagina.
- **Mail namens Henkjan** gaat altijd via de skill mail-lerend:
  - regels lezen;
  - concept melden met `op=meld`;
  - aan Henkjan laten zien;
  - pas versturen na zijn "verstuur".
  Adressen van ontvangers komen nooit in code, pagina's of het werklog.
- **Geen geld uitgeven.** Geen advertenties, boosts, aankopen of abonnementen. Demand Radar alleen binnen zijn dagrem: per thema hooguit één aankoop per 7 dagen, nooit in een lus.
- **Code in hjdk-api:**
  - eerst `git pull --rebase`;
  - commit met expliciete bestandsnamen, nooit `git add -A`;
  - de rooktest moet slagen (`node scripts/rooktest.mjs`, met de commentaarcheck);
  - een nieuw eindpunt komt als actie (op=...) in een bestaand bestand in fn/, nooit in api/;
  - elke push is een build en kost geld, dus hooguit 2 pushes per ronde, liefst 1;
  - posts via Zernio hebben geen push nodig.
- **Meldingen** aan Henkjan: hooguit één per uur. De grote dagupdate is de vaste melding.
- **Nooit vastlopen.** Bouw bij alles wat je maakt meteen de controle die meet of het werkt. Na een fout probeer je het hooguit één keer opnieuw op dezelfde manier, daarna een andere aanpak, of melden met de reden. Blijf nooit langer dan 15 minuten hangen.
- **Wat alleen Henkjan kan** (wachtwoorden, codes, betalen, koppelingen in apps): vraag het hem stap voor stap, één vraag per keer, met de exacte link.

## 4. Wie doet wat
Er draaien al rondes. Het groei-account is de regisseur van alle organische groei en verdubbelt die rondes niet: het stuurt ze bij via hun opdrachtbestanden in de repo.

| Ronde | Wanneer | Opdrachtbestand | Groei-account |
|---|---|---|---|
| Social (FB, IG, YouTube, Pinterest) | 08:41 UTC | `kadoly/taak-social.md` | stuurt vorm, aantallen en thema's bij in dat bestand |
| Gidsronde (nieuwe gids per dag) | 11:20 UTC | `OVERDRACHT-KADOLY-GIDS.md` (Nieuwe gids kiezen) | geeft het seizoensthema en de voorrangslijst mee |
| Redactie (artikel per dag) | 13:07 UTC | `OVERDRACHT-KADOLY-GIDS.md` (Redactie) | zet de onderwerpen van de week klaar |
| TikTok en video's | TikTok-chat, kadoly-video | `OVERDRACHT-KADOLY-TIKTOK.md`, `kadoly/reels.json` | vraagt vormen en producten aan |
| Google Shopping en shop | Henkjans hoofdchat | `OVERDRACHT-YOORS-SHOP.md` | alleen lezen; koopproblemen melden |

Wat het groei-account zelf bouwt en draait: de motoren A, E, F, G en H hieronder, de meting over alle kanalen, en de dagupdate.

Afspraak over bestanden: verander in de opdrachtbestanden van een andere ronde alleen de werkwijze, niet hun logboeken of data. Zet bovenaan zo'n wijziging "(groei-account, <dag>)".

Mailt de hoofdchat de eerste klanten persoonlijk (stond op 23 nov open), dan doet het groei-account dat niet nog eens.

## 5. Blokkades eerst (dag 1 en 2)
1. **Bottoegang tot kadoly.com.** Meting 23 november: volledige browser- en Pinterest-header krijgen 200 op home en robots.txt; Facebook-, Bing- en Google-header krijgen 403 via CloudFront. Andere nagebootste zoekbotheaders geven een gemengd resultaat. Dit bewijst geen blokkade van echte geverifieerde crawler-IP's, geen specifieke WAF-regel en ook geen bevestigde mislukte Pinterest-claim.

   Eerst de beheerder en logregels rond 12:09 UTC vaststellen, dan echte crawlerinspectie en één product/feed controleren. Alleen de aangetoonde blokkade voor geverifieerde zoek- en previewbots op openbare pagina's aanpassen. Geen algemene allow op user-agent. AWS-labeluitzonderingen staan na de bestaande Bot Control-groep en vóór de betrokken volgende blokregel; exacte plaats pas na inspectie. Bescherming van betaal- en accountpaden behouden. Trainingbots zijn een aparte keuze. De concrete beheerderstaak en primaire AWS-bron staan in het onderzoeksverslag hierboven.
2. **Wordt een organische koop gemeten?** De keten liep tot nu toe nooit tot koop. Controleer of een betaalde bestelling na een organische klik als koop in Clickmind komt (org:p, org:d). Gebruik als test de twee TikTok-bestellingen van 15 tot 20 nov: staan ze als koop in de keten van hun campagne? Zo niet, zoek waar de koop wegvalt en repareer dat eerst; zonder koopmeting leert niets.
3. **Lek aan het eind.** In de gidsuitproef kwamen 5 mensen bij betalen en kocht er niemand. Zoek uit of dat meting is of echt afhaken (betaalmethoden, verzendkosten die pas laat komen, vertrouwen). Rapporteer het aan de shop (OVERDRACHT-YOORS-SHOP.md); de shop lost het op.
4. **Na de firewall:**
   - kadoly.com opnieuw claimen op Pinterest kadolyshop (de meta-tag staat al);
   - catalogus Kadoly NL (4868048294986) aan de Pinterest-feed koppelen;
   - in Bing Webmaster Tools de sitemap van kadoly.com indienen en IndexNow sturen.

## 6. De motoren
Elke motor heeft een eigen Clickmind-code, zodat we per motor de keten tot koop zien. Oordeel na 14 dagen (zie 10).

### A. Lootjes en verlanglijst (seizoensmotor, groeit vanzelf via WhatsApp-groepen)
- **Wat:** een gratis hulpmiddel op `gids.kadoly.com/lootjes`:
  - groep maken zonder account, namen toevoegen, eventueel uitsluiten (partners trekken elkaar niet), budget en datum kiezen, trekken;
  - iedereen krijgt een eigen link voor WhatsApp en ziet alleen zijn eigen lootje;
  - iedereen vult een verlanglijst in (vrije tekst of producten van Kadoly aanklikken), en wie jou trok ziet jouw lijst;
  - bij het budget komen suggesties met echte producten van kleine merken, met alles-in prijs en de echte levertijd tot 5 december.
- **Waarom:** lootjes trekken is een vaste Nederlandse gewoonte. Eén organisator stuurt de link naar 5 tot 15 mensen, dus elke groep brengt nieuwe bezoekers zonder advertentiegeld. Deelnemers starten later zelf een groep (voor het werk, de vrienden, de kerst).
- **Sinterklaas-extra's:**
  - een gedichtenhulp: per soort cadeau een paar korte rijmpjes, vooraf door Claude geschreven en vast op de pagina, niet live gegenereerd;
  - surprise-ideeën: een surprise maken rond het cadeau.
- **Kerst:** dezelfde tool als Secret Santa, met een variant voor collega's en teams. Daarna het hele jaar een verlanglijst voor verjaardagen.
- **Privacy:** alleen voornamen, geen account. Een groep wordt 30 dagen na de datum gewist. Het e-mailadres is optioneel en alleen voor één herinnering met de laatste besteldag, en dan alleen als iemand dat aanvinkt.
- **Vindbaar:** de pagina richt zich op "lootjes trekken" en "lootjes trekken online". Check de grootte in Demand Radar en de concurrenten (lootjestrekken.nl, Elfster, Drawnames). Ons verschil: de verlanglijst met echte cadeaus, de gedichtjes en geen account nodig.
- **Meten** (k=lootjes):
  - groepen, deelnemers per groep, lijsten ingevuld, kliks op suggesties, adressen, verkopen;
  - de virale maat: nieuwe groepen per groep (een deelnemer die zelf een groep start).
- **Planning:** het idee op dag 1 aan Henkjan, live op dag 2 of 3. Henkjan deelt hem als eerste in zijn eigen familie- en vriendengroep. Sinterklaaslootjes worden nu getrokken, dus elke dag telt.

### B. Pinterest als zoekmachine
- Pinterest werkt zonder volgers. De social-ronde zet nu 3 productpins per dag. Het groei-account:
  - maakt borden per ontvanger en gelegenheid (Sinterklaas, kerst, Secret Santa, collega, oma, juf, housewarming, cadeau onder 10, 20 of 25 euro), met titels met zoekwoord voorop;
  - laat de social-ronde ideepins maken op cadeauvragen uit Demand Radar en Pinterest Trends (NL);
  - verhoogt na week 2 het aantal pins volgens de maat in taak-social.md (plafond eerst 5, dan 10 als bereik per pin houdt);
  - koppelt de catalogus zodra de firewall open is, zodat elk goedgekeurd product vanzelf een productpin wordt.
- Meten: Clickmind via utm op kadoly.com (cm.js) en Zernio-analytics per pin.

### C. Antwoordcontent voor Google en AI-assistenten
- **Gidsen en keuzehulpen** (bestaande ronde): het groei-account geeft elke week een voorrangslijst mee in de gidsoverdracht. Volgorde:
  1. seizoen, met piek binnen 6 weken;
  2. vraag zonder gids;
  3. een gat in AI-antwoorden (Demand Radar gaps);
  4. kliks die we al hebben.

  Voorbeelden voor nu, toets ze eerst aan de data:
  - lootjes cadeau 20 euro;
  - Secret Santa cadeau en cadeau collega kerst;
  - surprise ideeën;
  - schoencadeautjes (bestaat al: aanscherpen);
  - kerstcadeau onder 25 euro;
  - cadeau voor iemand die alles heeft;
  - duurzaam cadeau.

  Elke gids krijgt:
  - de echte laatste besteldag (Sinterklaas 27 nov, kerst 16 dec, zoals de gidsen nu);
  - de pakketten als kant-en-klaar antwoord, zodra die live staan.
- **Redactie** (bestaande ronde): een artikel per dag dat lezers echt verder helpt. Onderwerpen voor de komende weken:
  - laatste besteldag Sinterklaas en kerst, met echte levertijden per merk;
  - lootjes trekken: regels en tips;
  - surprise maken: ideeën met stappen;
  - cadeau inpakken zonder plastic;
  - Black Friday en Cyber Monday echt checken (bestaat al: bijwerken);
  - retour en bedenktijd van een cadeau;
  - wat geef je iemand die alles heeft.
- **Waar ChatGPT-bezoek binnenkomt:** keuzehulp.best (Kadoly-blok, KADOLY_BIJ). Elke nieuwe gids krijgt daar ook een plek.
- Volg de skill zicht-seo-llm. Elke nieuwe pagina krijgt een proef in ZICHT. Geen pagina per kleine zoekvariant: één sterke pagina per echte vraag.

### D. Video's (TikTok, Instagram Reels, Facebook Reels, YouTube Shorts)
- kadoly-video maakt elke nacht 3 video's; de social-ronde zet ze uit (minstens 2 per dag per platform). Het groei-account:
  - kijkt welke vormen echte bezoekers opleveren (nu: kersthoek-set, kerstfinds, sieraden);
  - laat kadoly-video daar meer van maken, met nieuwe vormen erbij:
    - een pakket uitpakken;
    - een lootje van 20 euro, wat krijg je;
    - één vraag, drie antwoorden (voor haar, voor hem, voor oma);
    - merkverhaal in 15 seconden;
  - houdt per vorm de maat bij in `kadoly/reels.json` > lerend.
- TikTok en YouTube staan nog niet in Zernio (alleen Facebook, Instagram en Pinterest). Vraag Henkjan ze te koppelen in Zernio; tot dan doet de TikTok-chat TikTok.

### E. Merken als verspreiders
- **Wat:** elk merk in de pakketten en elk merk met verkoop of mandjes krijgt:
  - een pagina "<merk> bij Kadoly" (bestaat er al een merkpagina op kadoly.com, gebruik die);
  - een deelpakket: pinbeeld, storybeeld 1080x1920, korte tekst, en een link met eigen Clickmind-code (`c=merk-<slug>`).
- **Mail:** volgens mail-lerend, soort partner. Eén vraag: willen ze het delen met hun volgers of op hun site zetten. Henkjan ziet elk concept; hooguit 5 per dag, elk na zijn "verstuur".
- **Begin bij** de merken in de pakketten: Mica, Housevitamin, Kolibri, Green Goose, Soeji.
- **Meten:** kliks en kopen per merkcode, antwoorden in de postlus.

### F. Klanten en terugkoop
- Elke organische koper moet een perfecte ervaring hebben. Volg elke bestelling uit organisch verkeer tot ze bezorgd is (Orderchamp-mails "verzonden"). Zie je een probleem, meld het dezelfde dag aan Henkjan.
- Na bezorging (alleen na Henkjans ja op de opzet): één persoonlijke mail van Henkjan met:
  - de vraag of alles goed kwam;
  - een reviewlink (WebwinkelKeur zodra goedgekeurd, Google Klantenreviews);
  - hoe ze hem bereiken.
- Terugkomen:
  - een seizoensherinnering (verjaardag, Moederdag) alleen met toestemming;
  - de Kadoly Spaarpot (staat uit tot Henkjans woord);
  - eventueel 10% tegoed, als Henkjan daar ja op zegt (dat staat open).

### G. Eigen publiek: e-mail en een WhatsApp-kanaal
- Elke motor vraagt met toestemming een e-mailadres: lootjes, herinnering laatste besteldag, nieuwe pakketten, nieuwe gidsen. Gebruik het bestaande blok Kadoly-nieuws en de dubbele opt-in van de gidsen (`lib/kadoly-nieuws.js`). Eén mail per week hooguit, alleen als er iets nieuws is.
- Een WhatsApp-kanaal "Kadoly vondsten" (één vondst per dag, via Clickmind k=wa) kan een sterk eigen kanaal worden in NL. Dat loopt via Henkjans nummer, dus alleen na zijn ja.

### H. Pers en links: data-verhalen
- Eens per twee weken een verhaal met eigen data. Voorbeelden:
  - wat kost een Sinterklaascadeau van een klein merk (alle producten tot 25 euro);
  - de 10 meest gekozen cadeaus op de verlanglijsten (pas als A genoeg data heeft, alleen totalen, nooit namen);
  - hoeveel Black Friday-kortingen echt waren (op de catalogusprijzen).
- Elk verhaal wordt een redactieartikel met de cijfers en de bron, plus een pitch aan 10 tot 20 journalisten en cadeautipsrubrieken (soort journalist in de postlus). Concepten eerst aan Henkjan.

### I. Vertrouwen dat organisch verkeer laat kopen
- Geen eigen motor, wel een voorwaarde. Eerlijke trustsignalen op gidsen en landingspagina's:
  - wie erachter zit;
  - klantenservice-tijden;
  - verzendkosten vooraf;
  - echte levertijd;
  - retour.
- Logo's van WebwinkelKeur en Google pas na hun goedkeuring. Productpagina's zelf horen bij de shop; meld daar wat je ziet.

## 7. Kalender
- Black Friday vr 27 nov, Cyber Monday ma 30 nov.
- Sinterklaas za 5 dec; laatste besteldag in de gidsen 27 nov (per merk nakijken).
- Secret Santa en kerstborrels in de eerste helft van december.
- Kerst vr 25 dec; laatste besteldag in de gidsen 16 dec. Daarna last minute: alles met snelle levering.
- Oud en nieuw. Daarna:
  - januari (opruimen, wonen, goede voornemens, Blue Monday 18 jan);
  - Valentijn zo 14 feb (start 3 weken eerder);
  - Pasen 28 mrt;
  - Moederdag zo 9 mei;
  - Vaderdag zo 20 jun.
- Regel: een seizoensonderwerp staat 6 weken voor de piek live, zodat Google en Pinterest het op tijd vinden.

## 8. Weekplan
**Week 1 (23 tot 29 nov): fundament en Sinterklaas**
- ma 23 en di 24:
  - firewall opnieuw meten en de beheerder via Henkjan;
  - koopmeting controleren;
  - lootjes: idee aan Henkjan;
  - borden op Pinterest;
  - voorrangslijst voor gidsen en redactie.
- wo 25: lootjestool live na Henkjans ja (test op 360x640, contrast, links) en eerste deling door Henkjan.
- do 26 en vr 27 (Black Friday):
  - laatste besteldag Sinterklaas in gidsen, pins en video's;
  - deelpakketten voor de 5 pakketmerken;
  - mailconcepten aan Henkjan.
- za 28 en zo 29: eerste meting per motor; weekbericht in de dagupdate van maandag.

**Week 2 (30 nov tot 6 dec): Sinterklaas-piek en kerst klaarzetten**
- Lootjes naar Secret Santa.
- Kerstgidsen aanscherpen.
- Eerste data-verhaal plus pitch.
- Wat in week 1 werkte, verdrievoudigen.
- Na 5 dec: Sinterklaas-content laten staan voor volgend jaar en het archief aanvullen.

**Week 3 (7 tot 13 dec): kerst op schaal**
- Secret Santa voor teams en collega's.
- Pins en video's op de winnende vormen.
- Pakketten in gidsen en pins.
- Merken die deelden een tweede keer vragen.

**Week 4 (14 tot 20 dec): laatste besteldag 16 dec, daarna last minute**
- Alles met snelle levering vooraan.
- Na 16 dec: "nog op tijd" alleen voor merken die het echt halen.

**Week 5 en 6 (21 dec tot 3 jan)**
- Januari en Valentijn klaarzetten.
- Verlanglijst voor verjaardagen.
- Weekbalans van december aan Henkjan, met een voorstel voor het eerste kwartaal.

## 9. Dagritme en de grote dagupdate
Twee geplande taken in het groei-account (prompts in 14):
- **Ochtendronde, 09:43 UTC (05:43 Curaçao, 10:43 NL):**
  1. meten;
  2. lek kiezen;
  3. het grootste stuk werk van de dag bouwen;
  4. live controleren;
  5. de dagupdate schrijven, zodat die klaarstaat als Henkjan wakker wordt.
- **Middagronde, 17:43 UTC (13:43 Curaçao, 18:43 NL):** het tweede stuk werk (vaak content in bulk: borden, gidsvoorrang, deelpakketten, mailconcepten), opvolgen wat 's ochtends live ging, en antwoorden van merken en pers verwerken. Geen eigen update, tenzij er iets brak.

**De dagupdate** (elke dag, ook in het weekend). Titel: "Kadoly groei, <weekdag> <dag> <maand>". Inhoud, kort en concreet, zonder nullen:
1. **Uitkomst:** organische verkopen gisteren en deze week. Echte bezoekers, mandjes en adressen per kanaal en motor, met de pijl tegen de week ervoor.
2. **Live gegaan:** wat er gisteren en vandaag online kwam, met klikbare links.
3. **Geleerd:** wat werkte en wat niet, met cijfers. Welke vorm, welk onderwerp, welk tijdvak.
4. **Grootste lek nu:** waar in de keten (zien, klik, echt, actie, mandje, koop), wat er al aan gedaan is, en wanneer het volgende oordeel komt.
5. **Vandaag en morgen:** de twee grootste stukken werk.
6. **Eén vraag aan Henkjan,** alleen als het werk erop wacht, met de exacte link of stap.

Op maandag komt er een weekbalans bij: streefcijfers tegen de werkelijkheid, en welke motor meer of minder tijd krijgt.

Waar de update terechtkomt:
- als eindbericht van de ochtendronde, met push aan bij de geplande taak;
- bovenaan de sectie Dagupdates van dit document (bewaar de laatste 14, oudere naar het logboek in één regel);
- één regel in het werklog: `/api/mm/handover?log=<kort>&wie=kadoly-groei`.

## 10. Leerlus en oordeel
- **Maat per stuk content:** koop x100, mandje x10, echt mens x2, klik x1, per 1.000 vertoningen (zonder vertoningen: per stuk). Dezelfde maat als de social-ronde, zodat alles vergelijkbaar is.
- **Grootste lek eerst:** per motor de stap met de grootste val. Als een stap op nul blijft, los dat meteen op binnen deze regels en meld het daarna.
- **Oordeel:**
  - een vorm (soort post, video, pin, gids) die na 5 stuks 0 echte mensen geeft, gaat uit;
  - een vorm met 2x de gemiddelde maat over 5 of meer stuks krijgt 3x zoveel;
  - een motor die na 14 dagen geen echte bezoeker per dag oplevert, gaat uit of wordt omgebouwd (met reden in het logboek);
  - een pagina met 0 vertoningen in Google na 21 dagen wordt verbeterd of samengevoegd (ZICHT-les).
- **Proeven:** hooguit één nieuwe proef per stap van de keten tegelijk, altijd als arm tegen de huidige versie (zie de leerlus-skill). Minder dan 10 stuks per arm: niets concluderen.
- Leg elk besluit met cijfers vast in het logboek hieronder.

## 11. Beslissingen van Henkjan
Vraag ze één voor één, in deze volgorde, en alleen als het werk erop wacht.
1. Wie beheert de firewall van kadoly.com, en mag de allow-regel voor de bots erin?
2. Lootjes en verlanglijst: is het idee goed? (eerst het idee, dan de link)
3. Deelt Henkjan de lootjeslink in zijn eigen familie- en vriendengroepen?
4. Mogen we de merken mailen, hooguit 5 per dag en elk na zijn "verstuur"?
5. Mogen we een data-verhaal aan journalisten pitchen?
6. Komt er een WhatsApp-kanaal Kadoly vanuit zijn nummer?
7. Mogen we zijn Facebook-vrienden uitnodigen om de Kadoly-pagina te volgen? (stond al open)
8. Koppelt hij TikTok en YouTube in Zernio? (zijn stap; geef de link)
9. Zet hij de Instagram-biolink `go.kadoly.com/o?k=ig&c=bio` in de app? (zijn stap)
10. Komt er 10% tegoed voor een tweede aankoop? (stond al open in de hoofdchat)

## 12. Toegang die het groei-account nodig heeft
- GitHub: repo `henkjandekrijger-glitch/hjdk-api` met push (add_repo, access push). Voor Demand Radar: `demand_radar` (openbaar; alleen lezen tenzij er een thema bij moet).
- Vercel-connector op team henq (`web_fetch_vercel_url` voor de beschermde vercel.app-hosts).
- Zernio-connector (profiel Kadoly `6afaf9820c09220040d746f4`). Account-id's:
  - Facebook `6afafaf7446856cecd87324f`;
  - Instagram `6afb8787a26245ebf04dc7be`;
  - Pinterest `6afb8a5d86e8bb18f844fc95`.
- Gmail-connector, alleen voor concepten en lezen. Let op: de Gmail-koppeling herschrijft links. Mail met een link gaat via Gmail in de browser; zie de skill mail-lerend.
- Chrome of de ingebouwde browser, voor Pinterest, Bing Webmaster Tools en Search Console. Wachtwoorden en codes vult Henkjan zelf in.
- Push-meldingen aan bij de geplande taken.

## 13. Waar alles staat
- Social: `https://hjdk-api-henq.vercel.app/api/shop?op=socoverdracht`. Bron `OVERDRACHT-KADOLY-SOCIAL.md`, werkwijze `kadoly/taak-social.md`, log `kadoly/social-log.json`, video's `kadoly/reels.json`.
- TikTok: `https://hjdk-api-henq.vercel.app/api/shop?op=ttoverdracht`. Video's: `https://kadoly-video-henq.vercel.app/api/lijst`.
- Gidsen en redactie: `OVERDRACHT-KADOLY-GIDS.md`. Stand `https://hjdk-api-henq.vercel.app/api/gids?op=stand&dagen=7`, redactie `op=redstand`, Google-groei `op=groei`. Code: `lib/kadoly-*.js`, `lib/gidsen-*.js`, `fn/gids.js`.
- Vraag en AI-gaten:
  - `https://hjdk-api-henq.vercel.app/api/gids?op=vraagkansen&kort=1`;
  - Demand Radar `https://demandradar-ivory.vercel.app/api/gaps?latest=1` en `/api/zoekvraag?thema=kadoly-cadeau` (ook kadoly-wonen, kadoly-hobby).
- Organische stand (Clickmind): `https://hjdk-api-henq.vercel.app/api/shop?op=orgstand&dagen=7` (kanalen en posts). Code: op=org en orgStand in `fn/shop.js`, kanalen in KAN_ORG.
- Producten kiezen:
  - `https://hjdk-api-henq.vercel.app/api/shop?op=kies&kort=1` (tractie, alles-in prijs, beeld);
  - zoeken: `op=zoek&kort=1&q=<woorden>`;
  - beelden: `https://keuzehulp.best/api/shop/img?p=<id>&t=ig`.
- Shop, Shopping, pakketten en koopproblemen: `OVERDRACHT-YOORS-SHOP.md` (live `/api/shop/overdracht`).
- ZICHT (vindbaarheid): skill zicht-seo-llm, sites kadolygids en kadoly.
- Mail: skill mail-lerend, regels `https://hjdk-api-henq.vercel.app/api/post?op=regels&t=1`.
- Werklog en overdracht van alles: `https://hjdk-api-henq.vercel.app/api/mm/handover`.

## 14. Start in het groei-account
**Eerste bericht in het nieuwe account** (Henkjan plakt dit):

> Jij bent het groei-account van Kadoly. Lees eerst de overdracht met de Vercel-tool web_fetch_vercel_url: https://hjdk-api-henq.vercel.app/api/shop?op=groeioverdracht&vorm=tekst. Koppel de repo henkjandekrijger-glitch/hjdk-api met push-toegang en lees CLAUDE.md. Maak daarna de twee geplande taken uit sectie 14 aan (push aan) en begin meteen met de ochtendronde van vandaag. Praat Nederlands met me, kort, zonder gedachtestreepjes. Laat elk nieuw soort ding eerst zien voor het live gaat.

**Geplande taak 1: "Kadoly groei: ochtendronde"**, dagelijks 09:43 UTC:

> Je bent het groei-account van Kadoly. Lees de overdracht: web_fetch_vercel_url https://hjdk-api-henq.vercel.app/api/shop?op=groeioverdracht&vorm=tekst en voer sectie 9 (ochtendronde) uit volgens het weekplan in sectie 8 en de regels in sectie 3. Repo: cd /home/claude/hjdk-api && git pull --rebase (ontbreekt hij: add_repo henkjandekrijger-glitch/hjdk-api met push, git clone, register_repo_root). Eindig met de dagupdate volgens sectie 9, zet die bovenaan Dagupdates in OVERDRACHT-KADOLY-GROEI.md, commit met bestandsnaam, push, en schrijf één regel in het werklog (wie=kadoly-groei). Is Henkjan er niet: vraag niets, kies de veiligste optie en zet je vraag in de update.

**Geplande taak 2: "Kadoly groei: middagronde"**, dagelijks 17:43 UTC:

> Je bent het groei-account van Kadoly. Lees de overdracht: web_fetch_vercel_url https://hjdk-api-henq.vercel.app/api/shop?op=groeioverdracht&vorm=tekst en de dagupdate van vanochtend. Doe het tweede stuk werk van vandaag uit sectie 9 (middagronde) volgens sectie 8 en de regels in sectie 3. Controleer wat vanochtend live ging. Commit met bestandsnaam, hooguit 2 pushes, één regel in het werklog (wie=kadoly-groei). Alleen een bericht aan Henkjan als er iets brak of als een stuk klaar is om te laten zien.

## Dagupdates (nieuwste bovenaan)

### Livegang merkconcepten, maandag 23 november 2026

- Henkjan gaf na de klikbare UX met Housevitamin, Mica Decorations en Kolibri Company akkoord: "JA allemaal live netjes ." Dit geldt voor die stories en pins. Geen merkmail, lootjestool, nieuw bord, nieuw kanaal of advertentie uit dit akkoord afgeleid.
- Alle drie de ontwerpen zijn als story gepubliceerd op Facebook Kadoly en Instagram @kadoly.shop, plus als pin op Pinterest @kadolyshop, bestaand bord Cadeau-ideeën. Zernio toont alle zes postobjecten als Published, samen negen plaatsingen. Eigen publicaties zijn vastgelegd in `kadoly/groei/2026-11-23-merken-live.json` en `kadoly/social-log.json`.
- Openbare pins, elk HTTP 200 en met de juiste directe productlink plus UTM: [Housevitamin](https://www.pinterest.com/pin/271060471319685927/), [Mica Decorations](https://www.pinterest.com/pin/271060471319685939/), [Kolibri Company](https://www.pinterest.com/pin/271060471319685971/). Instagram-stories: [Housevitamin](https://www.instagram.com/stories/kadoly.shop/4036974094599238408/), [Mica](https://www.instagram.com/stories/kadoly.shop/4036974665511881394/), [Kolibri](https://www.instagram.com/stories/kadoly.shop/4036975353160367734/). Stories verdwijnen na 24 uur. Facebook geeft één storyverzameling-link terug, geen unieke losse permalink bevestigd.
- Echte catalogusfoto’s, geen prijs- of deadlineclaims. Alle drie de producten opnieuw leverbaar bevonden via op=zoek; niet op de verborgen tekst "Uitverkocht" van de producttemplate afgegaan. Exports zijn 1080x1920 (story) en 1080x1620 (pin), met de uitleg welk product op de sfeerfoto wordt aangeboden.
- Meetbeperking: de knop in de story is beeld. Instagram Graph API ondersteunt geen linksticker of storycaption. Facebook kreeg de Clickmind-link in zijn custom caption; een klikbare storylink is niet bevestigd. Geen bewezen storyverkeer of organische koop uit deze publicatie afleiden. Pins hebben bevestigde productlinks. Koopmeting en pushmeldingen blijven onbevestigd.
- De bestaande ronde was al uitgevoerd: de drie geplande productpins en de twee getoonde video’s op Facebook/Instagram stonden Published. Niet opnieuw geplaatst. Vier boekenpins stonden ook op hetzelfde Pinterest-account; dat is gezien, niet vanuit groei gedupliceerd of aangepast. De drie extra merkpins zijn een eenmalige uitvoering van het concrete akkoord, geen permanente verhoging van de dagfrequentie.
- Volgende ronde: vóór de stories verlopen de beschikbare story-inzichten vastleggen; pins en merkcodes na 24 uur volgen. Ontbrekende cijfers onbekend laten. Nog geen winnaar of opschaling op basis van deze publicatie.


### Middagcontrole maandag 23 november 2026

- Vanochtend opgeleverd werk staat nog live: groeioverdracht met de ochtendupdate, prioriteiten in gids/socialopdrachten en een gezonde router met 39 handlers. Het lootjesconcept blijft buiten productie (404), geen akkoord voor livegang ontvangen.
- Momentopname circa 17:43 UTC: Facebook cumulatief 35 kliks, 11 echt, 2 acties en 2 mandjes; tegenover de ochtend +2 kliks, +2 als echt gemeten bezoeken en +1 mandje. Gids 37 kliks tegenover 6, maar nog steeds 1 echt en 1 actie. Pinterest blijft 3 kliks. Dit zijn tellerstanden en verschillen, geen bewezen unieke personen of weekgroei. De 31 extra gidskliks zijn geen reden om op te schalen; herkomst en eventuele controles nog niet gescheiden.
- Laatste betaalmeldingen staan op test=true. Geen nieuwe echte verkoop uit afgeleid; organische kooproute nog niet bewezen. De foutlijst geeft niet voor elke rij een testmarkering: geen percentage echte betaalfouten uit afleiden. De aparte shopchat werkt inmiddels aan prijs/meting; geen winkel- of advertentiewerk overgenomen.
- Botheaders krijgen nu op home en robots.txt allemaal 200 (browser, Pinterest, Bing en Facebook). Deze run gebruikt een andere verbinding met een envoy-tussenlaag dan de ochtend. Dit is geen bevestiging dat Tim de WAF heeft aangepast of dat echte crawler-IP's mogen crawlen. Geen antwoord van Tim gevonden in de gerichte mailzoekactie; zijn bericht niet verstuurd. Herstel blijft te verifiëren met echte logs/inspectie.
- Tweede stuk werk klaar: drie deelconcepten voor Housevitamin, Mica Decorations en Kolibri Company met actuele productbron, echte foto, Pinteresttekst, storytekst en kanaalcorrecte meetlink. Bestand `docs/kadoly-groei-review/merken-deelconcepten-2026-11-23.html`, uitgesloten van productie. Foto's alle drie HTTP 200; review is opmaak in 9:16, nog geen geëxporteerde storybestanden. Geen prijzen, besteldeadlines, keurmerk- of reviewclaims in de kopij. Geen mails of socialposts verstuurd. Nieuwe borden en lootjestool wachten op akkoord; bestaande socialronde niet gedupliceerd.
- Nieuwe snapshot `kadoly/groei/2026-11-23-middag.json`; ochtendsnapshot behouden. Bestaande redactie-stand toont nog de artikelen van 19 en 20 november, geen artikel met datum 23 november bevestigd. Dit blijft een opvolgpunt voor de bestaande redactieronde, geen tweede artikel vanuit groei aangemaakt.
- Volgende controle: echte betaalattributie en botlogs; pas na akkoord de deelconcepten exporteren en elk bericht aan een merk afzonderlijk voorleggen. Pushinstelling nog steeds niet uitleesbaar. Geen vaste frequentie verhoogd en geen onderzoek of advertenties ingekocht.


### Kadoly groei, maandag 23 november

1. **Uitkomst:** cumulatief sinds 16 november Facebook 33 kliks, 9 echt, 2 acties en 1 mandje; gids 6 kliks, 1 echt en 1 actie; Pinterest 3 kliks. Gisteren registreerde Facebook 7 uitgaande kliks. Organische verkopen niet geregistreerd. Kooproute organisch nog niet bewezen. Adressen per kanaal en een week-op-week-vergelijking ontbreken; geen verzonnen pijl.
2. **Opgeleverd:** eerste nulmeting `kadoly/groei/2026-11-23.json`, [volledig verslag](https://github.com/henkjandekrijger-glitch/hjdk-api/blob/main/docs/kadoly-groei-ochtendronde-2026-11-23.md), seizoenprioriteiten in de bestaande gids- en socialopdrachten, concrete attributie- en retourvragen in de shopoverdracht. Geen nieuwe openbare tool of derdenbericht. Lootjesconcept alleen ter beoordeling en uitgesloten van productie.
3. **Geleerd:** twee TikTok-kopen staan in Clickmind, samen € 91,36. Dit bewijst de algemene betaalroute voor TikTok, niet de organische attributie of alle feedorders. `v-kerstfinds` gaf één echt mens en één mandje; te klein voor opschalen. De gids heeft 6 geïndexeerde pagina's uit 68 bekeken adressen; het Perplexity-panel met 8 vragen geeft nog geen citaat van de gids.
4. **Grootste lek:** browser/Pinterest-header 200, Facebook/Bing/Google-header 403. Nagebootste headers bewijzen geen echte crawlerblokkade. Beheerderstaak en logtijd klaargezet, beheerder gevraagd. Volgende oordeel in de middagronde om 17:43 UTC, mits echte log-/inspectiedata beschikbaar is. Metingslek direct afgevangen door cumulatieve cijfers te labelen en de nulmeting te bewaren.
5. **Vandaag en morgen:** middag controleert bottoegang en shopattributie, volgt de bestaande redactie/socialronde en verwerkt reactie beheerder. Morgen snapshots vergelijken en alleen na akkoord de lootjestool verder bouwen. Rooktest inclusief syntax, vercel.json en commentaarcheck geslaagd. Twee taken actief om 05:43 en 13:43 Curaçao; pushinstelling niet bevestigd.
6. **Reactie Henkjan:** Tim beheert de firewall. Op zijn verzoek is een kort bericht voor Tim gemaakt en in de chat getoond. Niet verstuurd, want de opdracht was het bericht maken. Concept en beheerderstaak staan in het verslag; vervolg wacht op de echte log-/inspectie-uitkomst.

**Weekbalans:** week 1 start vandaag. Streefwaarde 150 echte bezoekers en 30 adressen met toestemming. De bestaande bron geeft daarvoor nog geen vergelijkbare weekstand of adresuitsplitsing; dit is de nulmeting. Frequentie blijft gelijk en geen motor wordt op één datapunt tot winnaar verklaard.

## Logboek (nieuwste bovenaan)
- 2026-11-23 na expliciet UX-akkoord: drie merkontwerpen geëxporteerd en als zes stories plus drie pins live gezet via de juiste Kadoly-accounts. Publicatiestatus en pinlinks gecontroleerd; bestaande ronde niet verdubbeld. Bewijs in kadoly/groei/2026-11-23-merken-live.json. Storylinkbeperking vastgelegd; geen mail, geld, nieuw kanaal of bord.
- 2026-11-23 middag (groei-account): ochtendresultaat en router gecontroleerd, actuele tellerstanden met ochtendsnapshot vergeleken, betaaltests uitgesloten van koopconclusies, bots opnieuw bereikbaar met runtimevoorbehoud. Drie merkdeelconcepten ter beoordeling voorbereid en uitgesloten van productie; foto-URLs gecontroleerd, geen mail/post. Nieuwe middagsnapshot, bestaande redactieronde als opvolgpunt.
- 2026-11-23 (groei-account): repo met pushrecht en CLAUDE.md gelezen, ochtend- en middagtaak actief; botheaders en koopmeting onderzocht, cumulatieve kanaalcijfers afgebakend, nulmeting bewaard en bestaande gids/socialronde bijgestuurd. Shop krijgt attributie- en retoursignaal. Lootjesconcept lokaal ter beoordeling en uitgesloten van Vercel. Pushmeldingen niet bevestigd. Beheerder CloudFront/WAF gevraagd; volgende controle middagronde.
- 2026-11-23: plan geschreven in de hoofdchat en live gezet op /api/shop?op=groeioverdracht. Startstand in sectie 1. Henkjan maakt een eigen account vrij voor de uitvoering, met elke dag een grote update.
