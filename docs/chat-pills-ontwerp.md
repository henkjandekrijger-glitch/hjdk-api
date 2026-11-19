# Chat met pills: ontwerp (onderzoek 19 nov 2026, nog niets live)

## Wat we nu zien
- kzuxnl sinds 17 nov: 254 zagen de chat, 30 tikten iets (12%), 13 een situatie, 12 een vraag, 1 naar de winkel, 0 bleven. iPhone 73 bezoekers, 0 tikken: eerst op een echte iPhone nakijken of het blok wel zichtbaar en tikbaar is.
- Lek 1: een situatie-pill springt de chat uit (klikt de oude quiz onderaan aan en scrolt naar #adv). Wie daar tikt krijgt dus nooit een antwoord in de chat en nooit het blijf-aanbod. Dat verklaart een deel van de 0 blijvers.
- Lek 2: na de eerste pill hangt de volgende stap af van wat Haiku als `opties` teruggeeft. Geen vaste stappen, geen "Iets anders", velden alleen uit AI.
- Opener en blijf staan op 0 keer gezien: of er kwam sinds 18 nov geen verkeer, of de meting van die twee onderdelen telt niet. Nakijken voor je er conclusies aan hangt.

## (a) Tien regels
1. **Hooguit 4 pills en "Iets anders" per stap.** Vanaf 6 opties raken mensen vermoeid (RevenueHunt: 3 tot 6, Aiden: bij meer dan 6 samenvoegen). Smart Reply toont er 3.
2. **Labels van 1 tot 3 woorden, hooguit 20 tekens, nooit twee keer dezelfde bedoeling.** Smart Reply laat per bedoeling maar één antwoord toe. Messenger kapt lange labels af.
3. **Altijd een uitweg**: "Iets anders" (zet het tekstveld klaar) en bij budget "Maakt niet uit". Bij een budgetvraag kiest ongeveer 40% "geen voorkeur" (Aiden).
4. **Typen blijft mogelijk, maar komt op de tweede plek**: een smal veld onder de pills ("of typ het zelf"). Volgens NN/g zijn beide nodig. Bij shopping-bots haalden bots met veel knoppen 1,5x meer betrokkenheid (Dashbot 2017).
5. **Eén vraag per beurt, de makkelijkste eerst** (wat, of voor wie), budget als laatste. Beantwoorden moet binnen 5 seconden kunnen (Aiden, RevenueHunt).
6. **Na hooguit 3 tikken een advies, en na elke tik al iets nuttigs.** Schrap elke vraag die het advies niet verandert. Quizzen vallen vaak bij vraag 3 af (Shopify-community). Met 6 vragen hou je 90% van het resultaat (Aiden).
7. **Laat de voortgang zien en geef een voorsprong.** Op een keuzehulppagina is "wat" al bekend, dus de balk toont meteen "1 van 3 klaar". Bij de autowasstudie maakte 34% de kaart vol met 2 stempels voorsprong, tegen 19% zonder (Nunes en Drèze 2006).
8. **Vraag pas na het advies of iemand blijft, met een concrete reden en één tik**: "Seintje als de prijs zakt" of "Herinnering voor 5 december". Op Android en desktop eerst een melding, op iPhone eerst mail. Octane haalt 29% opt-in vlak voor de uitslag en Interact 40% van de starters. Een melding wordt op mobiel 3x vaker geaccepteerd dan op desktop (Chrome UX Report). Een terug-op-voorraadmail wordt 63% geopend (Notify Me).
9. **Elke tik vult een veld vast in, zonder AI.** Een pill heeft een betekenis (bijvoorbeeld `voorWie=moeder`), dus 2 tikken zijn al een intentie met 2 velden.
10. **De pills leren en de antwoorden bewaren** (zie onder): een bandit per stap, een cache per pill-pad en een steekproef naar het model.

## (b) Verloop
**Voorkant** (keuzehulp.best/, whichtobuy, kaufberater):
- Stap 1 "Waar wil je hulp bij kiezen?": 4 geleerde pills (start: Cadeau, Zorgverzekering, Energie, Thuisbatterij) en "Iets anders". Geen voortgang tonen op deze stap.
- Stap 2 "Voor wie?": Mezelf, Partner, Familie, Kind, Iets anders. Met deze tik is er een intentie (wat en voor wie).
- Stap 3 "Ongeveer hoeveel?": 3 bedragen bij het onderwerp, Maakt niet uit. Bij een cadeau daarna eventueel "Wanneer?": Sinterklaas, Kerst, Later.
- Advies: de beste keuze met prijs en reden, en een link naar de keuzehulp. Daarna het blijf-aanbod (regel 8). "Samen kiezen" alleen als iemand Familie of Collega's tikte.

**Keuzehulppagina**:
- Kop "1 van 3 klaar: {term}".
- Stap 1: de situatie-pills (vraag 1 van de quiz). Het antwoord komt in de chat: "Voor jou: X, € Y vandaag", uit de tabel situatie naar product. Geen AI nodig en we springen niet meer naar de quiz.
- Stap 2: de belangrijkste andere quizvraag (gebruik of budget), Maakt niet uit.
- Advies: de top 1, met de 2 andere op één tik. Daarna blijven: "Seintje als de prijs zakt".

## (c) Meten en proef
- **Per stap**: gezien, getikt per pill en per plek, wie hier afhaakt, getypt of getikt, tijd tot de tik.
- **Over de hele trechter**: intentie met 2 of meer velden, advies gezien, naar de winkel, gebleven, op een latere dag terug. Steeds per toestel (Android, iPhone, computer).
- **Proef `pillflow`** (vervangt `top` en `opener`, zodat er weinig losse variabelen zijn):
  - a = de chat van nu (pill, dan een vervolgvraag van de AI);
  - b = het vaste stappenverloop hierboven, met voortgang en "Iets anders".
  - Rechter: intenties met 2 velden per 100 bezoekers. Daarnaast gebleven per 100. Bij beide 300 keer gezien.
- **Daarna proef `blijfmoment`**:
  - a = na het advies één tik voor een seintje;
  - b = top 1 meteen, en "hele top 3 en een prijsseintje" op één tik vlak voor de rest.

## Leren welke pills (Henkjan: "steeds minder tokens, af en toe steekproeven")
- **Kandidaten per stap**: per onderwerp en stap hooguit 8, waarvan er 4 te zien zijn.
- **Kiezen**: Thompson-sampling. Waarde is hoe ver iemand na die tik komt, op de ladder van de proef: volgende stap 1, intentie 3, advies 4, winkel 10, blijf 12, terug 20.
- **Leren over pagina's heen**: met ongeveer 125 bezoekers per dag delen pagina's van hetzelfde soort onderwerp hun kennis.
- **Plek**: de volgorde wisselt, en de plek wordt mee opgeslagen.
- **Nieuwe kandidaten** komen uit wat mensen typen. De nachtronde telt in `kz:chat:log` de genormaliseerde waarden van wat, voor wie en budget, en elke waarde die 3 keer of vaker voorkomt wordt een kandidaat. Ook de AI-`opties` die vaak terugkomen.
- **Voorkennis voor een nieuwe kandidaat**: geen startkans van 50%, maar zo gekozen dat hij ongeveer 10% kans krijgt om de beste te verslaan (Dynamic Prior TS 2026). Hooguit één nieuwe per stap per nacht.
- **Uit de rij**: na 200 keer gezien, als hij duidelijk achterblijft. Nooit twee pills met dezelfde bedoeling naast elkaar.
- **Cache per pill-pad**: de sleutel is `site|slug|pad|datadag`, bijvoorbeeld `nl|cadeau-vinden|partner>tot50|2026-11-20`. Dat is exact zoeken en geen semantisch zoeken, omdat pills vaste invoer zijn (Portkey: exact past bij gestructureerde invoer).
  - Antwoorden met een prijs gelden 1 dag (de datadag van de prijstabel zit in de sleutel). Zonder prijs 7 dagen.
  - Verandert de pagina, dan gaat de cache van die pagina leeg.
- **Steekproef**:
  - Een nieuw pad gaat naar het model tot het 3 keer hetzelfde advies gaf (zelfde product). Daarna gaat 5% van de treffers alsnog naar het model: we tonen het bewaarde antwoord en vergelijken.
  - Wijkt het product of de prijs af, dan vervangen we het antwoord en gaat de steekproef op dat pad terug naar 25%.
  - Komen we boven 3% afwijking, dan gaat de steekproef omhoog (tianpan, Portkey, AWS).
- **Getypte tekst** gaat altijd naar het model. Een semantische cache daarvoor heeft pas zin als van 100 vragen er meer dan 20 op elkaar lijken.
- **Meten**: treffers, modelaanroepen per intentie, afwijking in de steekproef, kosten per dag.

## (d) Wijzigingen (geen code)
- **lib/kzux.js**
  - Klikafhandeling (situatie-pill, rond regel 76): niet meer naar de quiz springen, maar in de chat antwoorden en de volgende stap tonen.
  - Nieuw stappenblok in het script: stand met stap en velden, pills uit `C.stappen`, voortgang, "Iets anders" zet het veld klaar, en het tekstveld onder de pills.
  - `vraag()`/`toon()`: pad en velden meesturen. "Iets anders" komt bij elke rij `opties`. Het blijf-aanbod komt na het advies in plaats van na antwoord 1 of 2 (NA/BN), met melding of mail per toestel.
  - `stuur()`: nieuwe gebeurtenis voor gezien en tik per pill.
  - `T`: korte labels.
  - `kzuxBlok(o)`: neemt `o.stappen` aan.
- **lib/kzchat.js**
  - `kzChat`: neemt `pad` en `velden` aan. Velden uit pills gaan voor die van de AI.
  - Cache plus steekproef vóór `berichten()`, met tellers in `kz:pc:d:<dag>`.
  - Nieuw: `kzPills` (kiest 4 per stap) en `kzPillEv` (gezien, tik, waarde), met kandidaten in `kz:pil:<site>:<soort>:<stap>`.
  - De prompt vraagt `opties` van hooguit 3 woorden.
  - `kzChatStand`: cijfers over pills en cache erbij.
- **Ook nodig in dezelfde commit**:
  - lib/proef.js (factor `pillflow`, `top` en `opener` uit);
  - lib/cadeauvinder.js (de vragen in VOORKANT en VINDER worden stappen);
  - api/keuze-tools.js (routes voor pills);
  - de nachtronde (kandidaten uit het chatlog);
  - lib/werking.js en het logboek in lib/overdracht-kz-tekst.js.

## Bronnen
- [RevenueHunt drop-off](https://docs.revenuehunt.com/customer-success/reduce-dropoff/)
- [RevenueHunt benchmark jun 2026](https://revenuehunt.com/state-of-product-recommendation-quizzes/): 69% maakt af, 45 mln antwoorden
- [Interact sep 2026](https://tryinteract.com/blog/quiz-conversion-rate-report/): 40,1% van de starters laat een adres achter, 65% maakt af
- [Octane AI](https://octaneai.com/blog/quiz-questions-that-convert)
- [Aiden volgorde dec 2024](https://aiden.cx/academy/volgorde-flow-keuzehulp-bepalen)
- [Aiden budgetvraag](https://www.aiden.cx/academy/budgetvraag-keuzehulp)
- [NN/g 2018](https://www.nngroup.com/articles/chatbots/)
- [Dashbot 2017](https://blog.dashbot.io/2017/04/26/to-click-or-to-chatthat-is-still-the-question)
- [VentureBeat/Dashbot 2016](https://venturebeat.com/business/too-many-buttons-spoil-the-bot/)
- [Smart Reply (Kannan 2016)](https://blog.acolyer.org/2016/11/24/smart-reply-automated-response-suggestion-for-email/)
- [Messenger quick replies](https://developers.facebook.com/docs/messenger-platform/send-messages/quick-replies)
- [Nunes en Drèze 2006](https://www.coglode.com/nuggets/endowed-progress-effect)
- [OneSignal/Chrome UX 2020](https://onesignal.com/blog/boost-your-web-push-opt-in-rates/)
- [Notify Me 2026](https://notify-me.io/reports/what-moves-back-in-stock-conversion-price-channels-basket)
- [Shopify-community](https://community.shopify.com/t/the-more-product-finder-quizzes-i-see-the-more-convinced-i-am-that-most-of-them-die-at-question-3/646767)
- [Dynamic Prior TS 2026](https://arxiv.org/html/2602.00943v1)
- [Semantische cache in productie 2026](https://tianpan.co/blog/2026/04/09/semantic-caching-llm-production)
- [Portkey drempels](https://portkey.ai/blog/semantic-caching-thresholds/)
- [AWS ElastiCache](https://docs.aws.eu/AmazonElastiCache/latest/dg/semantic-caching-best-practices.html)

De cijfers komen van de verkopers zelf (Octane, Interact, RevenueHunt, Aiden). Het zijn richtgetallen, geen proeven.
