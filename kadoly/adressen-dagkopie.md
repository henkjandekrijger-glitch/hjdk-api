# Kadoly adressen: elke dag een verse kopie tot $0,05 per adres

Henkjan, 28 nov 2026: "adressen campagne die start iedere dag opnieuw vers met geleerde en 8 ads met verbeterde creatives tot we op max 5 cent per adres zitten . Zet in dboard."

De geplande taak "Kadoly adressen dagkopie" voert dit elke dag om 07:17 Nederlandse tijd uit (voor het dagvenster van 08:00). Verander de werkwijze hier, niet in de geplande taak. Chatnaam op het dashboard: `kadoly-adressen`.

## Lijnen

Een lijn is een soort adrescampagne op PropellerAds (NL, iPhone, In-Page). Elke lijn heeft per dag precies één lopende campagne: de kopie van vandaag.

| Lijn | Landt op | Naam begint met | Stand 28 nov |
|---|---|---|---|
| W, winactie Bureau set | winactiepagina | `[In-Page] KADOLYWIN PAKKET Bureau set winactie` | A2 12201178, CPA-doel $0,75, 08-23 NL; ook 12195955 (SHOP-LUS ... winactie C, $0,10) hoort hierbij |
| T, winactie tafelhaard | winactiepagina met tafelhaard | `[In-Page] SHOP-LUS WONEN Tafelhaard Zand winactie` | 12190717, CPA $0,01 sinds 26 nov |
| Z, spaarzegels | zegelpagina | `[In-Page] KADOLYWIN ZEGEL` | B 12199133 ($0,15) en C 12201180 ($0,05) |

Dagbudget per kopie: W $10, T $5, Z $5. Samen nooit meer dan het testbudget SHOP-LUS ($20 per dag per saldo, tool `budget_stand`). Harde grenzen uit CLAUDE.md gelden altijd.

## Bodtrap

Stappen voor het CPA-doel: $0,75 > $0,50 > $0,35 > $0,25 > $0,15 > $0,10 > $0,05. Lijn T staat al op $0,01 en blijft daar zolang hij adressen geeft.

Per lijn, op de cijfers van gisteren (kopie van gisteren; zie Meten):

- 5 of meer adressen: een stap omlaag.
- 2 tot 4 adressen: zelfde stap.
- 0 of 1 adres bij $1 of meer kosten, of minder dan $0,50 uitgegeven (geen volume): een stap omhoog, nooit boven $0,75.
- $3 of meer kosten zonder één adres: die lijn krijgt vandaag geen kopie; melden.
- Twee dagen op rij $0,05 of minder per adres met 5 of meer adressen: doel gehaald. De lijn blijft dagelijks vers op die stap; meld het één keer met de cijfers.
- Kost een lijn twee dagen op rij meer dan 3 keer zoveel per adres als de goedkoopste lijn en meer dan $0,50: geen kopie meer; melden.

## Meten (gisteren, per campagne)

1. Kosten: `api_get /adv/statistics?tz=%2B0000&day_from=<gisteren> 00:00:00&day_to=<gisteren> 23:59:59&group_by[]=campaign_id&campaign_id[]=...` (veld `spent`).
2. Adressen, eigen telling (gaat voor PropellerAds): `https://hjdk-api-henq.vercel.app/api/shop?op=winstand&k=<ids met komma>` > `campagnes[id].adressen`. Telt sinds de start van die campagne; een kopie loopt één dag, dus dat is de dag.
3. Kosten per adres = kosten / eigen adressen.
4. Per advertentie: `creative_stats` (gisteren) en in winstand `proef.gezien.advertentie` (winactie) of `zegelProef.gezien.advertentie` (zegel): bezoek, tik, mail per banner-id.

## De kopie maken

1. Lees eerst `https://hjdk-api-henq.vercel.app/api/mm/dashboard?vorm=bij&project=kadoly` en de briefing `https://hjdk-api-henq.vercel.app/api/mm/briefing?medium=propeller&project=kadoly&doel=aanmelding`. Kijk de landing na op de uitkomstpoort: `/api/mm?op=stuk&poort=<doel-URL>`. Staat daar `dicht: true`: geen kopie, melden.
2. Behoud de 6 beste advertenties: meeste eigen adressen (mail), dan aanmeldingen per bezoek, dan CTR. Geen advertentie met prijs, levertijd of kale productnaam.
3. Maak 2 nieuwe, elk met `beeld_van` de beste advertentie en een knoptekst:
   - native: een variant op de beste tekst, met de kop of knop die op de landing het best scoort (winstand: `proef.factoren.kop` en `knop`, of `zegelProef`);
   - trend: wat de laatste 14 dagen bij ons het best liep volgens de briefing.
   Titel hoogstens 30 tekens, omschrijving hoogstens 40, gewoon Nederlands, geen gedachtestreepjes, geen prijs, geen levertijd.
4. `kopie_met_verse_creatives` met `campaign_id` = de kopie van gisteren, `behouden_ids` = de 6, `nieuwe_creatives` = de 2, `cta` = de knop van de beste, `doel` 8. Naam: dezelfde lijnnaam met `CPA-doel <stap> | <datum> | kopie <bron> | dagkopie 6 beste + 2 nieuw`.
5. Bod en budget op de kopie: `update_campaign` met `rate` = de stap, `daily_limit` volgens de tabel, `total_limit` 30, en `toestemming_henkjan`: `Henkjan 28 nov 2026: "adressen campagne die start iedere dag opnieuw vers met geleerde en 8 ads met verbeterde creatives tot we op max 5 cent per adres zitten" en 27 nov 2026: "Ja B"`.
6. Zegelkopie: zet hem in de zegelroute, anders landt hij op de winactie: `https://hjdk-api-henq.vercel.app/api/shop?op=zegelcamp&id=<nieuwe id>`.
7. Doel vastzetten: `/api/mm?op=stuk&campagne=propeller:<nieuwe id>&doel=aanmelding`.
8. Voorganger(s) stoppen zodra de kopie status 6 heeft en alle 8 advertenties goedgekeurd zijn (`api_get /adv/campaigns/<id>`: `status` 6, `creatives[].policy_status` 2): `update_campaign status stop` (met `opvolger_lager_bewust: true` als de kopie lager biedt). Nog in de keuring: plan met `send_later` over 45 minuten een vervolg in deze sessie dat stap 8 doet. Bij lijn W stopt ook 12195955 zodra de eerste W-dagkopie loopt.
9. Zet de 8 advertenties van elke kopie (6 oud, 2 nieuw) op een voorstel voor Henkjan: `/api/mm?op=voorstel&j=<JSON>` geeft `/voorstel?id=<id>`. Henkjan vroeg op 28 nov zelf om elke dag 8 ads met verbeterde creatives, dus de 2 nieuwe gaan meteen mee; zegt hij "eerst zien", dan wacht de kopie voortaan op zijn ja op het voorstel.

## Melden

- Dashboard, stand van chat `kadoly-adressen`: per lijn gisteren kosten, adressen, kosten per adres, het nieuwe CPA-doel, en de afstand tot $0,05. `wacht: []` tenzij er iets op Henkjans ja wacht. `toon`: de voorstellink van stap 9.
- Output per kopie: `zet={"project":"kadoly","output":{"wat":"...","intentie":"kosten per adres naar $0,05","metriek":"kosten","richting":"omlaag","drempel":0.05,"verwacht":"...","oordeel":"<morgen>","link":"https://hjdk-api-henq.vercel.app/api/shop?op=winstand"}}`.
- Werklog: `/api/mm/handover?log=<per lijn: gisteren kosten, adressen, per adres; vandaag kopie id, stap, welke 2 nieuw>&wie=kadoly-adressen`.
- Geld: de kosten van gisteren komen vanzelf uit de uurwacht.
- Geen bericht aan Henkjan bij een gewone dag; wel bij doel gehaald, een lijn zonder kopie, of een fout.
- OVERDRACHT-YOORS-SHOP.md alleen bijwerken als de werkwijze verandert (een push kost een build).

## Nooit

- Geen campagnes buiten deze drie lijnen aanraken. Niet in bulk herstarten.
- Geen conversie-postback wijzigen. Geen nieuwe landing.
- Hooguit één nieuwe poging bij een fout, daarna melden.
