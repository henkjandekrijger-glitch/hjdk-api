# Overdracht Kadoly: TikTok, Clickmind-gezicht, creators, Droppery

Stand 20 nov 2026 14:50 UTC. Geschreven door de TikTok/Clickmind-chat (account Henkjan, sessie 019LLtjXQyubUYnwSFzEiDhZ) voor de chat die dit in een ander account oppakt. Henkjan 20 nov: "Zet overdracht op vercel zodat ik verder kan in ander account . Grondige overdracht !! Daarna geen activiteit tot maandag 2000 hier ." Deze chat doet tot maandag 23 nov 20:00 Curaçao-tijd (24 nov 00:00 UTC) niets meer.

Live lezen: https://hjdk-api-henq.vercel.app/api/shop?op=ttoverdracht (web_fetch_vercel_url; `&vorm=tekst` voor platte tekst). Bron: `OVERDRACHT-KADOLY-TIKTOK.md` in repo henkjandekrijger-glitch/hjdk-api. Werk dit bestand bij in dezelfde commit als elke wijziging, en schrijf een regel in het werklog: `https://hjdk-api-henq.vercel.app/api/mm/handover?log=<tekst>&wie=<chat>`.

Lees daarnaast: de algemene handover https://hjdk-api-henq.vercel.app/api/mm/handover, de skills campagnes-henkjan, clickmind en mail-lerend (repo `.claude/skills/`), en `OVERDRACHT-YOORS-SHOP.md` (shop, kassa, prijzen).

## 1. Waar het om draait

- Doel Henkjan: Kadoly winstgevend laten verkopen, zo snel mogelijk ("laat me vandaag nog 2 verkopen zien", 20 nov). Adviseer hem, niet andersom ("Jij moet MIJ adviseren").
- Werkwijze: Nederlands, kort, geen gedachtestreepjes. Campagnebudget, bod en optimalisatie alleen op zijn woord. Stoppen van advertenties en groepen zonder verkoop mag zelf (20 nov: "Veel sneller stoppen als geen verkoop"). Sleutels nooit in code of URL's. Adressen van mensen nooit in code, pagina's of werklog.

## 1b. PAKKETTEST 3 DAGEN (vanaf 23 nov 2026, gaat voor alles hieronder)

Henkjan 23 nov: "Ja doe de TT maar max 3 dagen ik wil het nu echt zien . Ad moet veel sneller uit . Pakket moet veel sneller uit . Alles stopt bij 40 zonder verkoop je moet echt betere ads maken en vaker . Ads maken kost niks slechte ads kosten geld ."
Waarom: 17 tot 23 nov €145 voor 2 verkopen met samen €12,47 marge (losse producten ~€6 marge). Pakketten hebben €28 tot €55 marge, dus alleen pakketten.

1. **Eerst** groep algemeen (1882048854125746) en alle andere groepen UIT. Daarna pas bijvullen (Henkjan doet dat: €40 prepaid = de harde grens).
2. Twee nieuwe campagnes (kopie van de instellingen van algemeen: NL 25+, optimaliseren op INITIATE_ORDER), elk €10 per dag, met per pakket een eigen advertentiegroep van €5 per dag:
   - KADOLY PAKKET WONEN: Sfeerset haard en geur (bundel phaardgeur20261121, marge €29,55) en Winteravond box (pwinteravond20261121, €37,01).
   - KADOLY PAKKET CADEAU: Plantenhoek set (pplantenhoek20261121, €54,50) en Winterse verwenbox (pverwen20261121, €28,45).
3. Landing per pakket: `https://go.kadoly.com/shop?bundel=<code>&utm_source=tiktok&utm_medium=video&utm_campaign=nl-pakket-<code>&arm=d&lang=nl&campaignid=__CAMPAIGN_ID__&zoneid=__AID__&creativeid=__CID__`. CTA SHOP_NOW.
4. De 8 eerste advertenties (video's gemaakt 23 nov, `https://ga3huwvh2mwrwypu.public.blob.vercel-storage.com/kadoly/ad/<id>.mp4`), elke advertentie met haar eigen tekst:
   - pk_haard_a: "Geen open haard? Echt vuur op tafel en geurstokjes erbij. Bestel de sfeerset."
   - pk_haard_b: "Zo maak je een winteravond af: vlammetje aan, geurstokjes erbij. Geef de sfeerset."
   - pk_avond_a: "Bank, plaid, kaarsje aan. Lantaarn, plaid en kandelaar in één box. Bestel hem nu."
   - pk_avond_b: "Cadeau voor mama? Lantaarn, plaid en kandelaar die ze elke avond gebruikt."
   - pk_plant_a: "Kale hoek in huis? Houten standaard en twee witte potten. Maak je hoek af."
   - pk_plant_b: "Plantenliefhebber in je leven? Standaard en twee potten, de planten kiest zij zelf."
   - pk_verwen_a: "Cadeau voor haar? Alpacasokken, bad en zelfzorg in één verwenbox. Bestel hem nu."
   - pk_verwen_b: "Lootje getrokken? Deze verwenbox met alpacasokken maakt haar blij."
5. Stopregels (elk uur, Clickmind voor echt en kassa: /api/shop?op=clickmind&vorm=json&dagen=1):
   - advertentie uit bij €1 zonder echte bezoeker, €2 zonder kassabezoek, of €3 zonder verkoop;
   - pakket (groep) uit bij €10 zonder verkoop;
   - ALLES uit bij €40 totaal zonder verkoop, en na 72 uur hoe dan ook (dan besluit Henkjan);
   - met verkoop: blijft aan zolang de kosten per verkoop onder de marge van het pakket blijven.
6. Meer en betere advertenties: elke uitgezette advertentie wordt in dezelfde ronde vervangen door een nieuwe met een andere haak voor hetzelfde pakket (video via kadoly-video `/api/advideo`, sectie 2), zodat er steeds 8 lopen. Haken: wie het voor is (mama, zus, collega, lootje), het moment (avond, eerste advent, Sinterklaas), het probleem (kale hoek, geen open haard). Tekst en beeld moeten kloppen: geen tekst over vuur op een foto van iets anders, geen planten of kaarsen beloven die er niet bij zitten. Geen prijs, geen levertijd, geen nep-urgentie.
7. Elke ronde met een wijziging: één regel in het werklog (wie=tiktok-pakkettest). Bericht aan Henkjan alleen bij een verkoop, bij het stoppen van een pakket of bij de eindstand.

## 2. TikTok Ads

Account Kadoly NL `7708796437043265537` (prepaid, valuta EUR, "Automatic payment paused": saldo bijvullen doet Henkjan; 20 nov ochtend €30 via PayPal). Werken via de MCP TikTok_for_Business (`tool_execute`, `report_integrated_get`).

### Groepen (20 nov 14:50 UTC)
| Groep | id | Campagne | Budget | Stand |
|---|---|---|---|---|
| algemeen ("NL 25+ afrekenpagina 20 ads") | 1882048854125746 | 1882032006515938 | €30/dag, optimaliseert op INITIATE_ORDER | AAN, enige groep die draait |
| lampen (Droppery) | 1882285883013137 | 1882032006515938 | €40/dag | UIT sinds 20 nov ochtend (Henkjan "rest uit") |
| meubels (Droppery) | 1882285883386978 | 1882032006515938 | €30/dag | UIT sinds 20 nov 14:18 UTC (geen verkoop, Henkjan "sneller stoppen") |
| catalogus marge15 | 1882288051160130 | 1882114210312257 | €20/dag | UIT sinds 20 nov 14:18 UTC (geen verkoop) |
| oude groep (eerste test) | 1882032703867938 | 1882032006515938 | | UIT |

### Actieve advertenties in algemeen (13)
colyn_b_ic 1882048961969153 (verkocht 19 nov, €52,91, 2 stuks), colyn_c 1882324181269521 (CTR 1,47%), colyn_e 1882324287561809, kolibri_goud_a 1882324327694418, kerstbal_goud_a 1882324327703666, servies_zondag_d 1882296767791314, vuurbak_tuin_a 1882289477886082, kerstboom_papier_a 1882289472190497, tafelhaard_b_ic 1882048961873921 (verkocht 17 nov, €38,45; 20 nov weer aan op Henkjans woord "Ja tafelhaard weer aan maar test ook veel ads"), en sinds 20 nov 14:26 UTC nieuw: colyn_f 1882387648280674 ("Kale vensterbank? Twee groene potten"), colyn_g 1882387651427522 ("Plastic pot eruit"), tafelhaard_c 1882387658547298 ("Geen open haard? Echt vuur op je tafel"), kerstbal26_goud_a 1882387698785425 ("Je boom in 5 minuten klaar", set van 26 goud, marge €3,94).
20 nov uitgezet (geen verkoop): swirl_a, colyn_d (CTR 0,21%), servies_kerst_c (€11,14 zonder verkoop).

### Resultaat 17 tot en met 20 nov (14:05 UTC)
- Kosten €133,86 (16 nov €4,81 nog niet in Clickmind). 2 verkopen, omzet €91,36, marge €12,47. Verlies ongeveer €121.
- Kassa (kassalek, 7 dagen, net tt): 1.221 aangekomen, 591 echte mensen, 51 op de afrekenpagina, 2 vulden e-mail in, 2 betaald (iDEAL en Klarna). 53 van de 60 die de kassa verlieten deden dat binnen 20 seconden. Grootste lek: afrekenpagina naar e-mail.
- Verzending zit sinds 17 nov in de prijs (Henkjan 20 nov: "Verzendkosten zijn niet meer zichtbaar zitten nu in prijs"); verzending is dus niet de afhaakreden. Oorzaak nog niet gevonden (de kassa kon ik niet openen in Chrome, zie 7).
- Marge is het grote probleem: bijna elk product ~€1,30 marge (Colyn €1,33 op €29,89 thuis; kerstballen 42 goud €1,31). Uitzondering: kerstballen set van 26 (goud, wit, rood, champagne, bruin) €3,79 tot €3,94. Met TikTok-kosten per verkoop van €10 tot €20 kost elke verkoop geld. Advies aan Henkjan (nog geen besluit): prijzen naar ongeveer €8 marge, of producten met meer marge.

### Stopregels en rouleren (Henkjan 20 nov: "Je moet sneller rouleren en testen dus bij TT . Veel sneller stoppen als geen verkoop")
- Per advertentie zonder verkoop uit bij: 400 vertoningen en CTR onder 0,7%; of €1,50 en niemand op de afrekenpagina (Clickmind `kassa` 0); of €4 hoe dan ook.
- Een advertentie met verkoop gaat pas uit als haar kosten hoger zijn dan 3 keer de marge van haar verkopen.
- Groep zonder verkoop uit bij €40.
- Elk uur aanvullen tot 8 of meer actieve advertenties in algemeen, hooguit 4 nieuwe per ronde, haken op wat verkoopt (Colyn, tafelhaard, kerstballen set van 26). "test ook veel ads".
- Het TikTok-veld `checkout` is altijd 0 (het event komt niet aan): gebruik Clickmind voor de afrekenstap.

### Vaste TikTok-uurtoets (scheduled task in dit account)
`trig_018WuJ13WD1vVe85CepQRKHz` "TikTok uurtoets Kadoly", elk uur 06:17 tot 21:17 UTC, draait door in het weekend met de OUDE regels (uit bij €1,50 en CTR < 0,6%; €2,50 en CTR < 0,8%; €6 zonder checkout, en checkout is altijd 0, dus elke advertentie zonder verkoop gaat bij €6 uit; houdt lampen/meubels/catalogus op 5 advertenties, terwijl die groepen uit staan). De prompt bijwerken naar de nieuwe regels werd twee keer geweigerd door de toestemmingscheck van dit account; Henkjan moet "ok uurtoets" zeggen of het in het nieuwe account opnieuw inrichten. De nieuwe prompttekst staat onderaan (bijlage A).

### Nieuwe advertentie maken (werkt, 20 nov getest)
1. Video: nieuwste READY productie-deployment van Vercel-project `kadoly-video` (team henq; 20 nov: kadoly-video-nn8ltf8js-henq.vercel.app), dan `GET https://<die-url>/api/advideo?id=<naam>&p=<pid>&r=<regel1>|<regel2>|<regel3>` (URL-gecodeerd) via web_fetch_vercel_url. Werkt ook voor Droppery (`dp_`). Geeft een blob-URL.
2. `tool_execute file_video_ad_upload` (advertiser_id, upload_type UPLOAD_BY_URL, video_url, file_name uniek) en `file_image_ad_upload` met de `video_cover_url` uit het antwoord.
3. `tool_execute ad_create` met adgroup_id en een `creatives`-lijst: identity_type TT_USER, identity_id d9f679dc-319c-5192-87c5-e4c1c38a83c6, ad_format SINGLE_VIDEO, video_id, image_ids [cover image_id], ad_text tot 100 tekens (haak eerst, geen prijs, geen nep-urgentie), call_to_action SHOP_NOW of ORDER_NOW, landing_page_url `https://go.kadoly.com/shop?utm_source=tiktok&utm_medium=video&utm_campaign=nl-<laatste 8 tekens pid>&p=<pid>&arm=d&lang=nl&campaignid=__CAMPAIGN_ID__&zoneid=__AID__&creativeid=__CID__`. Catalogusgroep: zonder landing, met catalog_id 7709106797482706696, product_specific_type PRODUCT_SET, product_set_id 17823399, vertical_video_strategy SINGLE_VIDEO.
4. Productgegevens en marge: `https://hjdk-api-henq.vercel.app/api/shop?op=zoek&q=<term>` (prijs ex verzending, verzending, thuis, inkoop, marge, levertijd).

## 3. Clickmind-gezicht (gebouwd 20 nov, Henkjan: "Maak voor ons ook een wetracked maar dan 100 x beter" en "Clickmind heeft voor mij nu geen gezicht maak dat er meteen bij")

- Pagina: https://hjdk-api-henq.vercel.app/clickmind (`?dagen=1|7|28`, `&vorm=json`). Alleen op de beschermde vercel.app-host. Winst per netwerk en per advertentie (marge op betaalde verkopen min advertentiekosten), echte mensen en afrekenpagina per TikTok-advertentie (sinds de start), laatste bestellingen, koppelingen, advies stop/bijsturen/opschalen.
- Code: `fn/shop.js` (op=kosten, op=clickmind, pxVerwerk met hashes), `lib/clickmind-gezicht.js` (advies en HTML), `lib/cmmatch.js` (e-mail/telefoonhash koppelen en terugvinden), `lib/shopdirect.js` ttEvent (TikTok Events API met ttclid, e-mail, telefoon, external_id, IP, browser), `vercel.json` rewrite `/clickmind`. Werking ook in `lib/werking.js` en `lib/overdracht.js`.
- Kosten: `GET /api/shop?op=kosten&net=tt&dag=JJJJ-MM-DD&d=<URL-gecodeerde JSON [{"id","naam","kosten","kliks","vert","groep"}]>` (HSET cm:kosten:<dag>, 120 dagen). Geladen: 17, 18, 19 en 20 nov (tot 14:05 UTC). NIET automatisch: de server kan TikTok niet zelf lezen (geen TikTok Marketing-sleutel; koppelen via https://hjdk-api-henq.vercel.app/api/shop/ttkoppel na een app in het TikTok developer portal met TIKTOK_APP_ID en TIKTOK_APP_SECRET in Vercel). Is de koppeling er, dan zet de TikTok-uurwacht (`op=ttstand`) de kosten elk uur zelf weg en haalt `op=kosten&net=tt&haal=1&dagen=7` terug. Tot dan: kosten per ronde posten vanuit een chat met de TikTok-MCP.
- Verkoop koppelen: op advertentie-id (`rec.a`), anders plek. Terugvinden via e-mailhash werkt pas als de shop `em`/`ph` (sha256), `ip` en `ua` meestuurt: opdracht voor de Kadoly-code staat in bijlage B (nog niet door Henkjan doorgevoerd).

## 4. Droppery (lampen en meubels)

- Meubels €1.500 tot €1.800 (Tanner bed, dressoir, mediaconsole; Oxford en Winston eettafel), lampen (Whipped, Dome, Sky, Macaron XL). Op TikTok ongeveer €45 uitgegeven, geen verkoop, niemand op de afrekenpagina; groepen uit.
- Henkjan 20 nov: "Nee maak hier meer content voor en actiever in GMZ ads zetten deze." Bedoeld: Google Shopping (Merchant Center), bevestigd.
- Google Shopping bestaat al via een andere chat: campagne KADOLY SHOPPING NL, account 460-749-3899 onder MCC 653-555-4776 (check daarvan stond voor 20 nov 15:00 UTC in sessie 019LLtjZUrtCSNeQDSrqzX49, "Kadoly: Pinterest en Google Shopping check"). Adspirer ziet Google Ads Speecho 3826034452 (actief) en 1310358887, 4740924497 (niet geactiveerd); Speecho stond eerder onderbroken voor verificatie.
- Te doen: Droppery-producten (dp_) in de Merchant Center-feed controleren (feed via Demand Radar `https://demandradar-ivory.vercel.app/api/feed?shop=yoors&cc=NL&status=1`), een eigen productgroep of campagne voor Droppery in Google Shopping met hogere biedingen (marge per stuk onbekend: inkoop staat niet in de catalogus, eerst bij Droppery opvragen), en meer content: video's per product via kadoly-video (dp_ werkt) voor Pinterest (kadolyshop) en eventueel TikTok later.

## 5. Creators (Henkjan 20 nov: "Laten we meer creators aan schrijven", "we doen er 20 over de hele dag zorg dat je leert we doen per 4")

- Ronde 1 verstuurd 20 nov 12:20 UTC vanaf henkjandekrijger@gmail.com: Perle Hagesteijn (variant a, meetlink gids.kadoly.com/m/164e84754f651), Laura Tenteniez (b, /m/8c44a27f97301), Iris Delouise (a, /m/2a9e87f0cf3a1), Robine Maaike (b, /m/75592d1973fd1). Onderwerp "<naam>, een product van Kadoly voor een video". Versie a met 15% commissie via eigen link, versie b zonder. Fout: de Gmail-koppeling heeft de links herschreven naar google.com/url (Henkjan: "Opnieuw sturen met goede link maag nooit meer gebeuren !"). Correctiemail met schone link nog NIET verstuurd. Om 14:30 UTC nog geen antwoorden.
- Ronde 2 tot en met 5 (16 creators) NIET verstuurd. Lijst op naam: ronde 2 Christmaholic, Groen in huis, Ivy Bakarbessy, Merle Mara; ronde 3 Janna Rijks, Regards Lauryn, Newkith (Nathalie), Julie Mariman; ronde 4 Margot Seys, M. Shoeraja, Jade (r.geer), Nortzy Influence (Chantal); ronde 5 Fermanova, Makers Avenue (Roxy), Nostrezz (Amber Charlotte), Lena (vdssen); reserve Barts Boekje, Zoe Brown. Contactadressen staan op hun eigen profiel of site (niet in deze repo, regel van de mail-skill).
- Verzendroute: de Gmail-koppeling herschrijft elke link (ook zonder https). Gmail in Chrome werkte 20 nov niet ("Can't interact with browser-internal", ook kadoly.com niet; waarschijnlijk een andere Chrome-extensie). Zernio heeft wel e-mailtools maar geen mailbox gekoppeld. Oplossing nodig: extensie uit, of Gmail koppelen in Zernio, of sturen zonder link.
- Mail-lus: `/api/post?op=meld|uitkomst|stand|regels`, regels in `data/post-priors.json` en skill mail-lerend. Concepten eerst aan Henkjan, versturen pas na zijn "verstuur".
- TikTok One (creator marketplace): bedrijfsverificatie AdsFair B.V. ingediend 20 nov (ID 7709884498162319412, project 7709903131267514376), in beoordeling; creators zoeken daar kan pas daarna.

## 6. Open bij Henkjan

1. "ok uurtoets": de vaste uurtoets de nieuwe snelle regels geven (bijlage A), of in het nieuwe account een eigen uurtoets maken.
2. Algemeen tijdelijk van €30 naar €50 per dag (geld uit meubels en catalogus): ja of nee.
3. Prijzen omhoog naar ongeveer €8 marge per product (nu ~€1,30), of meer producten met marge; opdracht voor de Kadoly-code maken na zijn ja.
4. Opdracht bijlage B (e-mail/telefoonhash) doorvoeren in de Kadoly-code.
5. TikTok Marketing-koppeling (ttkoppel) zodat Clickmind de kosten zelf leest.
6. Mailroute voor creators (zie 5).
7. Droppery in Google Shopping (zie 4).

## 7. Wat er draait over het weekend (zonder deze chat)

- TikTok groep algemeen: €30/dag met 13 advertenties, de uurtoets (oude regels) stopt advertenties zonder verkoop.
- Scheduled tasks van deze chat die nog afgaan maar niets doen tot maandag: "TikTok snelle rouleerronde" (15:21 UTC), "Uurcheck creatormails Kadoly" (15:30 UTC), "Kadoly creatormails ronde 2 (opnieuw)" (15:35 UTC). Verwijderen werd geweigerd door de toestemmingscheck; ze komen in deze sessie binnen en deze sessie doet er tot maandag 20:00 Curaçao niets mee. De ronde-3-taak, de 21:30-meubelcheck en de 19:00-avondronde zijn verwijderd.
- Andere chats en vaste taken in dit account (KDP-rondes, curacao.day, keuzehulpen, MyLevel) lopen door; die vallen buiten deze overdracht.

## Logboek (nieuwste bovenaan)
- 23 nov 13:15 UTC (kadoly-shopify-chat): pakkettest van 3 dagen klaargezet (sectie 1b), 8 pakketvideo's gemaakt en gecontroleerd. Wacht op: uitvoering in de chat met de TikTok-connector en €40 bijvullen door Henkjan.
- 20 nov 14:50 UTC: overdracht geschreven; activiteit van deze chat gestopt tot maandag 23 nov 20:00 Curaçao.
- 20 nov 14:26 UTC: tafelhaard_b_ic weer aan, 4 nieuwe advertenties (colyn_f, colyn_g, tafelhaard_c, kerstbal26_goud_a).
- 20 nov 14:18 UTC: meubels en catalogus uit, swirl_a, colyn_d, servies_kerst_c uit. Clickmind toont echte mensen en afrekenpagina per advertentie; advies stop na €4 of €1,50 zonder afrekenpagina.
- 20 nov 14:05 UTC: Clickmind-gezicht live, TikTok-kosten 17 tot 20 nov geladen.
- 20 nov 12:20 UTC: creatorronde 1 verstuurd (links herschreven door de Gmail-koppeling).

## Bijlage A: nieuwe prompt voor de TikTok-uurtoets

TikTok uurtoets Kadoly (Henkjan 19 nov: "Eigen regel moet strenger", "Moeten dan sneller betere ads komen", "Maak veel meer varianten en ga verkopen"; 20 nov: "Je moet sneller rouleren en testen dus bij TT . Veel sneller stoppen als geen verkoop"). Werk kort en zuinig; Nederlands, geen gedachtestreepjes.
Account 7708796437043265537. Alleen groep 1882048854125746 algemeen draait (campagne 1882032006515938, €30/dag, optimaliseert op afrekenpagina). Lampen, meubels en catalogus staan uit; niet aanzetten. Budget, bod en optimalisatie nooit wijzigen.
Cijfers: report_integrated_get (BASIC, AUCTION_AD, dimensions ["ad_id"], metrics ad_name, adgroup_id, spend, impressions, clicks, ctr, complete_payment, query_lifetime true) voor de actieve advertenties. Afrekenstap uit Clickmind: https://hjdk-api-henq.vercel.app/api/shop?op=clickmind&vorm=json&dagen=28 (per advertentie kosten, echt, kassa, verkopen, marge). Verkopen ook in /api/shop?op=kassalek&dagen=7.
Regel 0: een advertentie met verkoop gaat pas uit als haar kosten hoger zijn dan 3 keer de marge van haar verkopen.
Zonder verkoop uit bij: 400 vertoningen en CTR onder 0,7%; of €1,50 en kassa 0; of €4.
Elke ronde aanvullen tot minstens 8 actieve advertenties, hooguit 4 nieuwe, haken op wat verkoopt (Colyn oc_4174003417645057, tafelhaard oc_4174002164744193, kerstballen set van 26 goud oc_4174003396820994, kerstballen 42 goud oc_4174003444039682, kolibri goud oc_4173958828179457). Maken zoals in sectie 2 van OVERDRACHT-KADOLY-TIKTOK.md.
Kosten van vandaag (Europe/Amsterdam) elke ronde naar /api/shop?op=kosten&net=tt&dag=<dag>&d=<JSON>; om 06:17 UTC ook gisteren.
Na elke ronde met een wijziging één regel in https://hjdk-api-henq.vercel.app/api/mm/handover?log=<tekst>&wie=tiktok-uurtoets. Bericht aan Henkjan alleen bij een verkoop of als er iets uit ging of nieuw kwam, met cijfers.

## Bijlage B: opdracht voor de Kadoly-code (e-mail- en telefoonhash naar Clickmind)

Waarom: Clickmind kan een betaalde bestelling zonder kenmerk (ander apparaat, terug via Google, link kwijt) alsnog aan de juiste advertentie koppelen, en TikTok herkent de koper ook zonder klik-id. Alleen hashes gaan mee, nooit het adres of nummer zelf.
1. Bij elke melding aan /api/shop/px (afreken, betaal, koop) meesturen zodra bekend: `em` = sha256 van het e-mailadres (trim, kleine letters, 64 tekens hex), `ph` = sha256 van het telefoonnummer in E.164 zonder plus en spaties, `ip` en `ua` van de koper (op de server). De melding bij "afreken" pas sturen nadat het e-mailveld is ingevuld.
2. In de lus-feed (/shop/api/lus-feed) per bestelling dezelfde velden, ook bij bestellingen zonder `hj`.
3. Optioneel `kostprijs` per regel (inkoop ex btw), dan rekent Clickmind de echte winst.
Test: klik een advertentielink, reken af met een test-e-mail zonder te betalen; dan op een ander apparaat zonder link afrekenen met hetzelfde adres en betalen; op /clickmind staat "Teruggevonden via e-mail" 1. Hash maken op de server (Node crypto), nooit adressen loggen.
