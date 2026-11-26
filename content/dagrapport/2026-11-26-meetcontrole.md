# Meetcontrole boeken,26nov2026

Status: concreet reviewvoorstel, geen livecode of instelling. Waarneming 2026-11-26T13:39:08.783Z. Bouwt voort op het meetvoorstel van25nov, geen tweede proef of extra content.

## Waarom dit nu voorrang heeft
Gesloten25novUTC geeft de bestaande droge rapportage13Stocking- en3LCpaginaopeningen tegen42/5op24nov. De bronverdeling ontbreekt in het antwoord. lib/bsorganisch.js bevat de reeds bestaande dagCijfers/rapportTekst.x/y met perBron/paginatotalen; dagRapport retourneert bij droog alleen tekst. Dus de meetwaarden kunnen bestaan zonder dat ze uitleesbaar zijn: onbekend is geen nul. lib/bsmeet.js verzendt geen utm_content; de afzonderlijke bron- en paginatellers geven geen gezamenlijke pinlanding.
ZICHT-queryrows25nov:4vertoningen/0kliks,pos38/83/86/95. Het ongedateerde GSC-sitetotaal0/0 conflicteert hiermee; niet samenvoegen. Queryregels missen geanonimiseerde vragen. Geen positie4tot15-kans of CTRproef op top10 uit deze vierregels afleiden.

## Precieze kleinste aanvulling op bestaand voorstel
Eerst een optionele gestructureerde vorm van het BESTAANDE droge dagrapport laten retourneren: expliciete dag/periode/waarneming/bron, de reeds aanwezige x/y per site/perBron/pagina en leesstatus per opslaghash. Parameternaam nog voorstel, niet aanroepbaar. Leesfout en lege opslag van elkaar onderscheiden; dagCijfers.hash vangt nu fouten als leegobject, dus een platte JSON-export zonder foutstatus is niet genoeg. Geen sleutels/rawKV-API blootleggen en geen nieuw endpoint.
Daarna uitsluitend bekende gepubliceerde UTMpinIDs gezamenlijk met site/pagina/bron/UTCdag tellen, zoals25novvoorgesteld. Geen vrije querystring, PII, fingerprint of sessie-ID. Dat zijn geregistreerde landingsopeningen, geen unieke mensen. Geen terugwerkende attributie.

## Acceptatie vóór live
- Droog verzoek veroorzaakt geen Telegram, IndexNow of schrijfactie.
- Twee sites/twee bronklassen/twee pagina's/twee pinIDs worden niet gekruist. Afzonderlijke totalen blijven gelijk.
- Ontbrekende hash, leesfout en geldige expliciete nul krijgen verschillende meetstatussen. Ontbrekend blijft onbekend.
- UTCmiddernacht en vorige gesloten dag worden correct gekozen, actuele gebeurtenissen apart.
- Ongeldige pinID, bot en intern doorbladeren leveren geen nieuwe pin-aankomst op. Herladen wordt als beperking benoemd.
- Alle22huidige leerregels/historische snapshots en controles blijven behouden; geen productiebezoek of providerpost als test.

Na exact implementatieakkoord: aparte reviewbranch en isolatietest. Eerst technische werking uiterlijk2dec toetsen. Daarna primaire organische uitgaande providerkliks plus geregistreerde landingsopeningen,14tot21dagen na echte goedgekeurde publicatie en met voldoende vergelijkbare data. Geen winnaar zonder venster/bord/onderwerp/leeftijd. Directe Pinterestanalyticsroute is een andere beveiligde integratie; niet zonder passend account/access overnemen als Zernio-uitslag. Geen sleutelzoekactie.
