# Keuzehulpen: aanvullende werking, 23 november 2026

De avondronde op verzoek van Henkjan werkt zoveel mogelijk relevante, onafhankelijke verbeteringen af. Nieuwbouwrem, bestaande budgetten en één chatproeffactor per dag blijven gelden.

## Inkomsten

lib/inkomsten.js telt ontbrekende of onleesbare brondata niet meer als nul. compleet geeft aan of bol en Awin beide beschikbaar zijn. vandaag, week, maand en totaal per rij zijn null bij onvolledige dekking; bekend bevat alleen de beschikbare deelsommen. Een ontbrekende bron krijgt perBron[naam].totaal=null. De HTML toont Onbekend en de melding dat het totaal onvolledig is. Een werkelijke nul van een beschikbare bron blijft nul in de gegevens. Vijf regressies in scripts/test-inkomsten-onbekend.mjs.

## Voorkant

De gevraagde complete voorkant wordt eerst als voorbeeld getoond. De bestaande homepages blijven staan tot de bespreking van het voorbeeld. De inventaris bevat 818 site-URLs: NL511, US176 en DE131, met losse keuzemodules apart. Plan en aankondigingen: data/keuzehulpen-groei/voorkant-plan-2026-11-23.json. De bron voor de geplande kaart is de bestaande hulp of de vastgelegde Demand Radar-/officiële bron; gepland betekent niet gebouwd.

## Ronde en checks

Beginmeting en tien live controles: data/keuzehulpen-groei/2026-11-23-avond.json. Alle tien HTTP200, eigen canonical, index/follow, één H1 en chat. De bestaande huisstijlcontrole gaf25 goede pagina's. Geen runtimefouten gevonden op de drie keuzehulproutes in zes uur. De eerder gecorrigeerde losse meter is niet terug als batterijadvies. Geen tweede proefbeslissing vandaag. Vindbaarheid en opbrengst zijn nog niet aantoonbaar gegroeid.

De volledige oude overdracht is niet herschreven: automatische goedkeuringscontrole blokkeerde die blob vanwege een opgenomen sleutel en operationele metadata. Deze aanvulling bevat alleen de wijzigingen van deze ronde en wordt ook in het levende werklog gemeld.
