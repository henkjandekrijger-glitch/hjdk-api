# Overdracht Kadoly social: Facebook, Instagram, Pinterest

Stand 20 nov 2026 15:30 UTC. Geschreven door de chat kadoly-social (account Henkjan) voor wie dit in een ander account oppakt. Henkjan 20 nov: "Ja zet hier zodat delen."

Regie (sinds 23 nov 2026): het groei-account van Kadoly is regisseur van alle organische groei en stuurt deze lus bij via `kadoly/taak-social.md`. Plan: `OVERDRACHT-KADOLY-GROEI.md`, live https://hjdk-api-henq.vercel.app/api/shop?op=groeioverdracht.

Live lezen: https://hjdk-api-henq.vercel.app/api/shop?op=socoverdracht (met web_fetch_vercel_url; `&vorm=tekst` voor platte tekst). Bovenaan staat dan de live stand uit Clickmind. Bron: `OVERDRACHT-KADOLY-SOCIAL.md` in repo henkjandekrijger-glitch/hjdk-api. Werk dit bestand bij in dezelfde commit als elke wijziging aan de social-lus, en schrijf een regel in het werklog: `https://hjdk-api-henq.vercel.app/api/mm/handover?log=<tekst>&wie=kadoly-social`.

Lees daarnaast: `kadoly/taak-social.md` (de dagelijkse opdracht, dat is de bron van de werkwijze), `OVERDRACHT-YOORS-SHOP.md` (shop en kassa), `OVERDRACHT-KADOLY-TIKTOK.md` (TikTok en het Clickmind-gezicht) en de algemene handover https://hjdk-api-henq.vercel.app/api/mm/handover.

## Aanvulling 23 november 2026: goedgekeurde merkproef live

Na "JA allemaal live netjes ." op de getoonde UX heeft groei drie merkontwerpen gepubliceerd: drie stories op Facebook, dezelfde drie op Instagram, en drie pins op Pinterest @kadolyshop (Cadeau-ideeën). Alle zes Zernio-postobjecten zijn Published; alle negen plaatsingen en de openbare links staan in `kadoly/groei/2026-11-23-merken-live.json` en `kadoly/social-log.json`. De bestaande dagronde niet herhaald. De drie bestaande productpins van vandaag zijn in het log van gepland naar gepubliceerd gezet na dashboardcontrole.

Dit is een eenmalige extra proef met de drie goedgekeurde ontwerpen. Vaste frequentie blijft gelijk; geen borden, accounts of mail toegevoegd. De knop in de stories is beeld: Instagram Graph API ondersteunt geen linkstickers en toont geen captions. Facebook heeft de Clickmind-link in de custom caption, maar klikbaarheid is niet bevestigd. De pins hebben de juiste directe UTM-productlinks, openbaar HTTP 200. Geen bereik of koop uit publiceren afgeleid. De volgende ronde meet vóór de stories verlopen.

## 1. Wat het oplevert (16 tot en met 20 nov)
**Akkoord en uitvoering 26 november 2026:** Henkjans twee goedgekeurde gids-pins staan Scheduled in Zernio: tv 26 november 18:45 UTC, planten 27 november 18:45 UTC. Groei heeft planning, platformvalidatie en 1000x1500-beelden gecontroleerd, niet opnieuw geplaatst. Het latere Pinterest-plafond uit taak-social.md gaat voor de oorspronkelijke drie-pinsafspraak. De connector werkt hier nu; Facebook, Instagram, Pinterest, TikTok en YouTube zijn healthy volgens de live accountgezondheid. Publicatie en uitgaande pinlink na de geplande tijden controleren; campagnebehoud tot koop blijft onbewezen. Bewijs: kadoly/groei/2026-11-26-middag.json.


| Kanaal | Volgers | Posts | Bereik | Kliks (Clickmind) | Echte mensen | Mandje | Verkoop |
|---|---|---|---|---|---|---|---|
| Facebook-pagina Kadoly | 0 | 10 (6 product, 3 reels, 1 hook) | beeldposts 0, reel 1 weergave | 26 | 5 | 0 | 0 |
| Instagram @kadoly.shop | 1 | 10 (7 beeld, 3 reels) | hooguit 2 per post | 0 (biolink) | 0 | 0 | 0 |
| Pinterest kadolyshop | 2 | 10 pins | 65 vertoningen, 50 per maand | 10 pinkliks, 4 via Clickmind | 0 | 0 | 0 |

- Verkoop via social: 0. De verkopen van 17 en 19 nov kwamen van TikTok-advertenties.
- Facebook: 135 keer haalde een bot de linkvoorvertoning op (Clickmind telt die apart als `voorbeeld`, niet als klik). Beste posts op echte mensen: 1118-nieuw (serveertray, 2 echt) en v-kersthoek_set (6 kliks).
- Pinterest is het enige kanaal met bereik zonder volgers: dip dye kaarsen 32 vertoningen en 3 kliks, Sinterklaaszak 14 en 4, hartring 10 en 1, strikoorbellen 8 en 1. Samen ongeveer 15% klik op vertoning en 5 keer bewaard.
- Volgens Zernio geven Facebook en Instagram nog 0 bereik bij beeldposts. Een nieuwe pagina zonder volgers wordt bijna aan niemand getoond, ook reels nog niet (1 tot 2 weergaven).

### Wat het betekent (advies, nog geen besluit van Henkjan)
1. Pinterest is het kanaal dat zonder volgers en zonder geld werkt, want het is een zoekmachine. Het groeit pas echt als de catalogus erin staat: dan wordt elk product (5.116 in de feed) een productpin. Dat blokkeert nu op de firewall van kadoly.com (zie 5).
2. Facebook en Instagram leveren zonder volgers niets op. De dagelijkse productposts kosten wel elke ochtend een ronde. Opties: alleen nog reels (die worden aan niet-volgers getoond), of de Facebook- en Instagram-posts stilzetten tot er een manier is om volgers te halen (Meta-advertenties zijn dicht, het advertentieaccount is beperkt).

## 2. Accounts (allemaal in Zernio, profiel Kadoly `6afaf9820c09220040d746f4`)

- Facebook-pagina Kadoly: https://www.facebook.com/profile.php?id=61596079596846 (pagina-id 122111228361535986). Zernio account_id `6afafaf7446856cecd87324f`. Gebruikersnaam `kadolyshop` gaf Facebook nog niet (nieuwe pagina); de dagronde probeert het elke maandag.
- Instagram @kadoly.shop, zakelijk, ig-id 17841476967447591. Zernio account_id `6afb8787a26245ebf04dc7be`. Biolink hoort te zijn `https://go.kadoly.com/o/ig` (alleen in de app te zetten door Henkjan). Clickmind telt nog geen enkele biolinkklik: nakijken of hij er staat.
- Pinterest kadolyshop (account Kadoly, nieuw sinds 16 nov). Zernio account_id `6afb8a5d86e8bb18f844fc95`. Borden: Sieraden 271060540011940606 (standaard), Wonen en decoratie 271060540011940607, Cadeau-ideeën 271060540011940609, Hobby en creatief 271060540011940610.
- Oud Pinterest-account kadoly_shop (henkjan@kadoly.com): niet meer voor posts gebruiken. Daar staan nog Business Manager 450008325174655399, advertentierekening 549763863238 en campagne KADOLY PIN NL verkeer. Pas verwijderen als dat naar kadolyshop is overgezet.
- Zernio: accounts 1 en 2 gratis, 3 tot 10 kosten $6 per maand per account. Betaalmethode heeft Henkjan op 16 nov toegevoegd. Op hetzelfde Zernio-account staan ook curacao.day en MyLevel (andere profielen); raak die niet aan.

## 3. Hoe het werkt

(groei-account, 23 november 2026) De concrete voorrangslijst voor deze week staat in `kadoly/taak-social.md`: bestaande vormen schoencadeautjes/kerstfinds/collega, huidige frequentie behouden en geen nieuwe borden zonder eerst tonen. `orgstand`-kanaal- en posttotalen zijn cumulatief, ook met dagen=7. Geen weekvergelijking uit deze totalen afleiden. De Pinterest-header kreeg nu 200; andere botheaders 403. Dat is geen verificatie van echte crawlers. Groei heeft zelf geen posts, borden of logdata van deze ronde gewijzigd.

- **Dagronde**: geplande taak `trig_01Nv2F4rtiHPtLwVVxEG9oL3` "Kadoly Facebook en Instagram posten en leren", elke dag 08:41 UTC, staat AAN, laatste ronde 20 nov 08:44 UTC gelukt (19 nov niet gedraaid). Hij voert `kadoly/taak-social.md` uit: meten, leren, producten kiezen, posts inplannen via Zernio, vastleggen in `kadoly/social-log.json` en `kadoly/reels.json`, commit "Kadoly social <dag> (Claude)".
- **Productposts**: 2 per dag per platform, 12:15 en 19:45 Nederlandse tijd, soorten sieraad, mandje (meeste mandjes), nieuw, wonen; elke dag schuiven de soorten één tijdvak op. Leren per soort en tijdvak, plafond 4 per dag.
- **Video's (reels)**: wachtrij `kadoly/reels.json` (23 video's, 4 gepost), aangevuld uit het project kadoly-video (`https://kadoly-video-henq.vercel.app/api/lijst`, 3 per nacht). Tijdvakken 08:30, 15:30 en 21:00 NL.
- **Producten**: `https://hjdk-api-henq.vercel.app/api/shop?op=kies&kort=1` (tractie, zonder wat elders goedkoper of uitverkocht is, met `beeld` 1080x1350) en voor sieraden `op=zoek&kort=1&q=ring,ketting,oorbel,...`. Beeld: `https://keuzehulp.best/api/shop/img?p=<pid>&t=ig` (1080x1350) of `t=sq` (1080x1080).
- **Tekst**: Nederlands, kort, alleen feiten van de productpagina, geen prijs, geen levertijd, geen gedachtestreepjes, 3 tot 5 hashtags. Kadoly is een webshop voor alles, nooit als cadeauwinkel neerzetten.
- **Meten via Clickmind** (Henkjan 16 nov: "zorg dat alles via clickmind loopt" en "leren met clikmind !"):
  - Facebook-links: korte link `go.kadoly.com/o/<code>` uit `https://hjdk-api-henq.vercel.app/api/shop?op=orgkort&k=fb&p=<pid>&c=<post>&vorm=tekst` (sinds 24 nov; de lange vorm met ?k= werkt nog maar komt niet meer in posts; post = dag-soort, bijv. 1118-nieuw; video's `v-<id>`). Instagram: "Link in bio" met `go.kadoly.com/o/ig`.
  - Route: `vercel.json` stuurt `/o` naar `fn/shop.js` `op=org`. Die telt per dag `org:d:<dag>` (`k|uit`, `k|profiel`, `k|voorbeeld`), per post `org:p:<post>`, en geeft de klik aan `direct()` met net `x`, zone `o<kanaal>` en camp `<post>`. Zo meet Clickmind de hele keten per kanaal en per post: kliks, echt mens, actie, mandje, koop. Linkvoorvertoningsbots krijgen een 302 zonder telling.
  - Kanaalcodes (`KAN_ORG`): fb, ig, pin, tt, th, x, li, yt, tg, wa, gbp, nb, bs, rd. Een nieuw kanaal is alleen een nieuwe `k=`.
  - Stand: `https://keuzehulp.best/api/shop/orgstand` (openbaar, alleen totalen; `?dagen=` tot 30).
  - Maat per post: koop x100 > mandje x10 > echt x2 > kliks, per 1000 bereik.
- **Pinterest**: geen doorstuurlinks (Pinterest ziet die als spam). Pins linken direct naar `https://kadoly.com/product/<pid>?lang=nl&utm_source=pinterest&utm_medium=social&utm_campaign=pin-<post>&utm_content=<pid>`; cm.js op kadoly.com meet. Posten met Zernio `call_tool` `posts_create_post` en `platformSpecificData` {boardId, title (max 100), link}. Week 1 en 2 hooguit 3 pins per dag, titel met zoekwoord voorop, geen hashtags, nooit hetzelfde product binnen 14 dagen.

## 4. Grenzen

- Geen berichten of DM's, niet zelf reageren op reacties (wel lezen en melden), niemand volgen of liken, geen boost of advertenties zonder Henkjans woord.
- Wachtwoorden, codes en betaalgegevens doet Henkjan zelf. Sleutels nooit in code, pagina's of URL's.
- Alleen Kadoly-producten. Niet aan campagnes komen waar Henkjan niet om vroeg.
- Commit met expliciete bestandsnamen, eerst `git pull --rebase`, push naar main (Vercel rolt uit).

## 5. Open, wacht op iemand

1. **Firewall kadoly.com** (grootste blokkade): de CloudFront/AWS WAF van kadoly.com geeft 403 aan bots (Pinterest, Pinterestbot, facebookexternalhit, Twitterbot, bingbot), browsers krijgen 200. Gevolg: Pinterest kan kadoly.com niet claimen en de feed `https://kadoly.com/pinterest.xml` niet lezen, Facebook en Pinterest tonen geen linkvoorvertoning en Bing kan de shop niet lezen. Nodig: een allow-regel voor die bots vóór de botregel, door de beheerder van kadoly.com (gevonden door distributie-chat, 20 nov 12:56 UTC).
2. **Pinterest claim en catalogus** (na punt 1): kadoly.com opnieuw claimen op kadolyshop (meta-tag `p:domain_verify` 04b613fe3ca1840528bcedd649e8f946 staat al in de kop), dan catalogus Kadoly NL (4868048294986) koppelen aan de feed. Daarna advertentierekening en campagne van kadoly_shop overzetten.
3. **Instagram-biolink** nakijken (Henkjan, in de app): `go.kadoly.com/o/ig`.
4. **Besluit Henkjan**: Facebook en Instagram doorgaan, alleen reels, of stilzetten (zie 1).
5. **Besluit Henkjan**: mogen we zijn Facebook-vrienden uitnodigen om de Kadoly-pagina te volgen (snelste manier aan de eerste volgers)?
6. **Centrale hub** voor alle kanalen van alle projecten via Clickmind (ontwerp 16 nov: één kanaalregister, één post-wachtrij, kruisposten, leren per kanaal, soort en tijdvak): wacht op Henkjans go. De meting (`op=org`, `KAN_ORG`) staat al klaar voor elk kanaal.

## 6. Logboek (nieuwste bovenaan)

- 27 nov 2026, taak 4qiye9 (Kadoly Pinterest opschonen): de boekpins (Engels, stockingbooks.com en lastingchange.works) staan via lib/bspin.js op dit account; er is een schakelaar gebouwd (`/api/bs?op=pinschakel&uit=1|0`, niet omgezet) en een lijst voor Henkjans ja (`/api/bs?op=pinlijst`). Taak-stap 7a: nieuwe pinhaken `uitdaging` en `n vragen` met trendtweeling. Er is niets verwijderd.

- 2026-11-26 (kadoly-chat, video): Henkjan: "4 platformen iedere dag mix van nuttig en gewoon product hq vids kort . Altijd links en CTAs niks intypen zorg dat CM er tussen zit". Video's nu naar TikTok @kadoly.com, Instagram, YouTube en Pinterest (plus Facebook als die werkt), per dag 1 uitlegvideo en de rest product. Geen 'zoek op' meer: biolinks go.kadoly.com/o/tt en /o/ig tonen de producten van de laatste video's (één tik, Clickmind c=v-<id>), YouTube en Facebook krijgen een korte link, Pinterest een directe link met utm. Clickmind kan nu ook naar een gidsartikel (u=<pad>). Eerste uitlegvideo: led kaarsen (64 s, echte stem eleven-v3 en muziek, eind 'Tik op de link'), id u261126led in reels.json, bestanden op de media-branch. Pinterest-plafond 8 per dag vanaf 27 nov (12 vanaf 1 dec, 15 vanaf 4 dec), gidspins naast productpins; de kaarsenhouder-productpin is teruggezet (6b08418dd98a40f15d5f4693).
- 2026-11-26 (kadoly-chat): twee goedgekeurde gids-pins ingepland op Pinterest kadolyshop, bord Wonen en decoratie, met eigen beeld 1000x1500 (go.kadoly.com/api/shop/beeld/<pid>/g.jpg?s=gids). Tv-meubel 26 nov 18:45 UTC (Zernio 6b083a2d58833ba789e0e2f8) in plaats van de kaarsenhouder-productpin (verwijderd), planten home staging 27 nov 18:45 UTC (6b083a2d58833ba789e0e2ff). Op 27 nov dus maar twee productpins (11:00 en 15:00). Meten na 24 uur en 7 dagen via utm_campaign gids-tv-20261125 en gids-planten-20261125.
- 2026-11-23: concrete UX-goedkeuring uitgevoerd: zes merkstories en drie merkpins gepubliceerd via ingelogd Zernio, alle postobjecten Published; publieke pins en UTM-links gecontroleerd. Meetbeperking storylink vastgelegd en bestaande ronde niet herhaald.

- 2026-11-20: overdracht geschreven, live op `/api/shop?op=socoverdracht`. Stand: 0 verkoop via social, Pinterest enige kanaal met bereik, firewall kadoly.com blokkeert Pinterest.
- 2026-11-18: video's (reels) erbij in de dagronde, wachtrij `kadoly/reels.json`.
- 2026-11-17: verkoop 17 nov bleek TikTok (tafelhaard, advertentie 1882048854125746), niet social.
- 2026-11-16: Facebook-pagina ingevuld, hook-post, Instagram @kadoly.shop en Pinterest kadolyshop aangemaakt en in Zernio gekoppeld, Clickmind-route `go.kadoly.com/o` live, dagronde 08:41 UTC gestart.
