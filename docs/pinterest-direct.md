# Eigen Pinterest-koppeling

Beheer: https://keuzehulp.best/api/pin-connect . Dit is de rechtstreekse integratie; geen Metricool vereist. Geen MCP-server geclaimd: de beveiligde beheer-API kan later door een MCP-tool worden aangeroepen. Planning draait op de bestaande Vercel-cron en blijft doorgaan zonder chat.

## Eenmalig koppelen

1. Registreer de app via https://developers.pinterest.com/apps/ met een juiste beschrijving en actuele privacyverklaring voor de eigen sites. Accepteer zelf de ontwikkelaarsvoorwaarden.
2. OAuth-redirect exact: https://hjdk-api.vercel.app/api/pinterest/callback . Dit bestaande callback-adres blijft behouden, ook als je de beheerpagina op keuzehulp.best opent.
3. App-ID/secret via Vercel-teamvariabelen PINTEREST_APP_ID/PINTEREST_APP_SECRET of het beveiligde formulier. Vercel-env heeft voorrang boven formulierwaarden. Nooit geheimen in de chat/repo zetten. HJDK_TOKEN is de bestaande beheersleutel.
4. Klik Verbind Pinterest, autoriseer het juiste zakelijke account. De app vraagt boards:read/write, pins:read/write en user_accounts:read. OAuth-state is 10 minuten geldig en eenmalig.
5. Test de OAuth-flow. Vraag Standard-toegang aan met de vereiste demonstratievideo. Trial-pins en -borden zijn alleen voor de maker zichtbaar. Zie https://developer.pinterest.com/docs/key-concepts/access-tiers/ . Geen gegarandeerde goedkeuring of onbeperkte publicatie.
6. Bevestig Standard pas nadat Pinterest die heeft verleend, selecteer de landen en start. Standaard één pin per land per dag. Dit is een testcadans, geen bewezen optimum. Er is nog geen app-side API voor automatische vaststelling van de access-tier: dit is een beheerderbevestiging.

## Uitvoering

Bestaande cron /api/pinterest/post op minuut 15 van uren 06–21 UTC. Vercel moet CRON_SECRET configureren en Authorization: Bearer meesturen; handmatige beheer-API gebruikt HJDK_TOKEN. De route was eerder publiek muterend en is nu afgeschermd. Oude workflow blijft alleen beschikbaar zolang geen directe plannerconfig bestaat. OAuth-callback zet die nieuwe config altijd gepauzeerd; daarna neemt alleen de nieuwe planner over (oude Yoors-wachtrij blijft behouden, wordt niet gepubliceerd).

Drie varianten per levende gids, uit lib/social-keuzehulpen.js. Vervolgvarianten worden 7/21 dagen na de bevestigde eerste pin vrijgegeven. Eén pin per cronrun, maximaal 1–3 per land per lokale Curaçao-dag. Reeds via de oude API bevestigde NL-pins gelden als variant 0, met conservatief een nieuwe wachttijd van 7/21 dagen. Pins uit onbekende RSS-imports/Metricool zijn niet automatisch te herleiden: controleer eventuele eerdere distributie voordat je de planner inschakelt.

Atomair Redis SET NX EX 300 werkerslot. API-calltimeout 15 sec. Permanent variantrecord vóór create-Pin POST. Bij timeout/crash of ontbrekende pin-ID blijft status uncertain staan; geen automatische retries, ook niet na lockexpiry. Zoek bij twijfel de pin op Pinterest en herstel de registratie via een gecontroleerde onderhoudswijziging. De beheerpagina biedt bewust geen blinde retryknop. Succes bewaart pin-ID permanent; geen automatische verwijdering. Daglimiet telt ook onzekere pogingen. Recente lijst maximaal 120; individuele deduplicatierecords blijven voor alle gidsen bestaan.

Beveiligde POST /api/pin-connect met Bearer HJDK_TOKEN: status, credentials, connect, config, run en analytics. Geen credentials in JSON-response, URL of localStorage. Alleen health en de lege beheerpagina zijn openbaar. Analytics vraagt een eigen geregistreerde pin-ID, start/end YYYY-MM-DD; metrics IMPRESSION,SAVE,PIN_CLICK,OUTBOUND_CLICK. Pinterest kan voor bepaalde pins/datums geen analytics leveren; onbekend is geen nul. Webbezoek en winkelkliks zijn aparte UTM-metingen; geen claim dat orders hiermee zijn bewezen.

## Verificatie

node --test test/pinterest-direct.test.mjs . Tests gebruiken fake Redis en fake Pinterest; geen echte publicaties. Live health, authenticatie, status en OAuth vereisen aanvullende productiecontrole. Een werkende health bewijst geen geautoriseerde Pinterest-verbinding of succesvolle pin-publicatie.
