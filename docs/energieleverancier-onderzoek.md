# Onderzoek: energieleverancier vergelijken

Datum: 18 oktober 2026. Scope: Nederlandse huishoudens, stroom/gas.

## DemandRadar

Gelezen via https://demandradar-ivory.vercel.app/api/demand?view=money&cc=NL&limit=100 . Aanvullend products/rise/missing/coming bekeken; niet iedere lijst bevat deze termen. De API geeft brondag 2026-10-14 en zoekperiode 2026-09. Dit is geen live telling van zoekopdrachten van vandaag.

| Zoekgroep | Per maand volgens Radar | Maandgroei | Jaargroei | Verwante termen |
|---|---:|---:|---:|---|
| energiecontract | 136200 | 188% | 74% | delta energiecontract, dynamisch energiecontract, dynamische energiecontract |
| energieleverancier | 23500 | 34% | 45% | energieleverancier, energieleveranciers goedkoopste, energieleverancier goedkoopste |
| overstappen energie | 9900 | 22% | 50% |  |

Deze waarden horen bij de gerapporteerde groep. Geen aparte volumes voor elke variant, geen optelling van mogelijk overlappende groepen, geen prijs- of besparingsbewijs. Het screenshot rondt 23.500 af naar ongeveer 24K. De exacte beschikbaarheid en afbakening van de groepen volgt de bestaande Radar-integratie.

## Redactionele keuze

Eén URL: https://keuzehulp.best/energieleverancier-vergelijken . Goedkoopste energieleverancier, energieleveranciers vergelijken, dynamisch energiecontract en overstappen energie zijn als samenhangende vragen opgenomen. Delta krijgt een neutrale vergelijkvraag, geen onbevestigde productbelofte. Geen nieuwe internationale pagina's: de opdracht en vraagdata betreffen NL.

## Product

27 routes (huidig contract × zonnepanelen × prijsrisico), persoonlijk vergelijkplan en een lokale calculator voor twee complete jaaroffertes. Offertegegevens blijven in de browser. Geen postcode of naam gevraagd. Geen tarievenfeed of energieaffiliate beschikbaar; daarom geen marktwinnaar of gegarandeerde besparing. Rekentool is een scenariovergelijking en vraagt expliciet of periode en grondslag overeenkomen.

## Bronnen gecontroleerd

- https://consument.acm.nl/vergelijken-en-overstappen/energie/aanbod-op-maat
- https://consument.acm.nl/elektriciteit-en-gas/overstappen-vergelijken-en-verhuizen/tips-bij-het-kiezen-van-een-energieleverancier
- https://consument.acm.nl/elektriciteit-en-gas/overstappen-vergelijken-en-verhuizen/energiecontract-opzeggen-alles-over-opzegvergoeding-en-opzegtermijn
- https://www.milieucentraal.nl/energie-besparen/inzicht-in-je-energierekening/energiecontracten-welke-zijn-er/
- https://www.rijksoverheid.nl/themas/klimaat-milieu-en-natuur/energie-thuis/salderingsregeling
- Vergelijkuitgangen gecontroleerd: https://www.gaslicht.com/ en https://www.pricewise.nl/energie-vergelijken/ . Geen partner-ID toegevoegd.

## UnitedConsumers (19 november 2026)

Aanleiding: Awin-aanvraag voor UnitedConsumers NL afgewezen ("URL is niet relevant voor merk van adverteerder"). De pagina heeft nu een blok Leveranciers naast elkaar met de top 5 van Overstappen.nl (1 jaar vast, 3 nov 2026) en een feitentabel over UnitedConsumers Energie, elk feit met bron. Gewone link naar unitedconsumers.com/energie, geen partnercode (nog niet geaccepteerd). Data in `lib/energie-keuze.js` (ENERGY_TOP, ENERGY_UC).

Gelezen op 19 nov 2026:
- https://www.overstappen.nl/nieuws/dit-zijn-de-goedkoopste-energieleveranciers-in-november-2026/ (lijst 3 nov: UnitedConsumers plek 1, € 224,45 per maand, € 465 korting, hoogste gastarief van de top 5)
- https://www.overstappen.nl/energie/leveranciers/united-consumers-energie (tarieven 19 nov, meer dan 500.000 leden, inkoop bij ENGIE, 19 staffels terugleverkosten)
- https://www.energievergelijk.nl/energieleverancier/unitedconsumers (contracten, geen dynamisch, 8,8 uit 312 beoordelingen, opzeggen na afloop)
- https://www.gaslicht.com/energie-vergelijken/unitedconsumers/modelcontract-stroom-en-gas-1-jaar-vast-5344 (vaste leveringskosten, stroometiket 100% groen NL, prijswijziging 16 nov)
- Niet gelezen: unitedconsumers.com/energie zelf en de Gaslicht-leverancierspagina (fetch geweigerd). Consumentenbond-lijst van 16 nov noemt UnitedConsumers niet.

Tarieven verschillen per bron en per regio (netbeheerder, verbruik). Bij een update alle vier opnieuw lezen en de datums in ENERGY_UC bijwerken.
