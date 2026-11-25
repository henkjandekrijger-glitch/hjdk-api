# ANP: spelers, perspectieven en collectief verzet, 25 november 2026

Henkjan vraagt het live dossier volledig te verdiepen en noemt aanvullend Martine Bakx, rechtszaken en crowdfunding. Tijdens het werk verscheen een eerdere ANP-uitbreiding uit een andere chat. Die is volledig behouden: de bestaande dataset, acht ANP-uitspraken, controlelijst, kostencontext en openbare incidenten blijven staan. Nieuwe redactie staat apart in data/wam/anp-perspectieven-2026-11-25.json.

## Reikwijdte en bewijs

- Het samengestelde dossier bevat 21 spelersgroepen, 10 perspectieven, 10 verschillende uitspraken (8 eerder gecontroleerde ANP-zaken, Bakx2019 en een uitdrukkelijk afzonderlijke vergelijking2023), twee afzonderlijke crowdfundings en 62 bronverwijzingen. Officiële ECLI-vindplaatsen en leesbare reproducties tellen als afzonderlijke verwijzingen, niet als verschillende onafhankelijke bewijzen.
- Bakx' eigen legbatterijfotozaak, herroeping, verzoek cassatie in het belang der wet en haar optreden voor Kaviaar blijven gescheiden. Voor herroeping/PG-verzoek is een partijverslag gebruikt, geen eigen ingeziene beslissing van PG/HR.
- Kaviaar: eigen relaas over eerste betaling en tweede voorstel; intrekking tweede claim volgens Bakx21sept. Latere betwisting toeschrijving25sept, gesteld watermerk/downloadbewijs1okt (28dec2020) en stichtingcontext29okt toegevoegd. Originele bestanden/metadata, processtukken, eindvonnis en officiële oproeping niet door WAM ingezien. Behandeling21jan2027 blijft een gedateerde partijmelding.
- Bas van Beeks historische leiding en stichtingcontext zijn aan Bakx toegeschreven; geen actueel registeronderzoek geclaimd.
- GoFundMe januari2025 is voor Bakx' eigen strijd (doel3500euro); mei2026 gaat over Kaviaar (doel2500euro). Geen samenvoeging, actueel saldo of donoraantal: opgehaalde en geïndexeerde tellers verschilden.
- ANP's eigen uitleg, makersbelang en toewijzingen zijn even duidelijk zichtbaar als kritiek en afgewezen claims. Huidige Fair Licensing/PixRay-route gescheiden van oude ANP/VRG-route. Verify-klantcase bewijst niet dat FrameSeek ieder claimdossier draait.
- De eigen claimstukken, bedragen, kosten en eigen tijdlijn zijn behouden. 3april2025 is expliciet het laatste eigen claimstuk, geen datum van het openbare onderzoek.
- Geen externe berichten, donaties, nieuwe juridische stappen of publicatie van privé-originelen. Henkjan is alleen contactlink. Partijstellingen worden niet als bewezen bedrog of strafbare feiten gepresenteerd.

## Implementatie en meten

lib/wam-anp.js leest de bestaande dataset en de aanvulling. Bronnen worden alleen achteraan toegevoegd of op exact dezelfde URL van een stabiele id voorzien, zodat de bestaande numerieke bronindices intact blijven. d.onderzoek blijft het bestaande object; de nieuwe secties staan in d.verdieping. lib/wam-onderzoek.js rendert tekst en bronlinks met escaping. De bestaande ANP-proef en het vaste vier-vragenpanel blijven behouden; geen extra automation.

Titel en beschrijving behouden de gemeten hoofdterm ANP Fair Licensing. De al opgeslagen gerichte Demand Radar-meting (anp-zoekonderzoek-2026-11-25.json) bevat140 gemiddeld per maand, laatste maand okt2026 210; dit zijn schattingen, geen unieke personen. De algemene machteloos-snapshot bevatte geen ANP-termen; daaruit volgt geen nulvraag. De gerichte meting wordt hergebruikt, niet opnieuw gekocht.

Aanvullende diagnose: ZICHT gapscan wam-anp-verdieping-20261125, perplexity/sonar, 3/3 gelukt. Het Bakx-antwoord verwart de eigen herroepingsstrijd met de aparte Kaviaar-zaak. Geen volledige LLM-vergelijking of causaal rankinggat geclaimd. De vaste ANP-panelvraag had op25nov geen WAM-citatie; geen Google-verkeer of indexstatus ingevuld uit ontbrekende GSC-data.

De bestaande proef wam-anp-verdieping-20261125 blijft ongewijzigd; de inhoudelijke aanvulling staat apart in het manifest. Eerste hercontrole2dec, beoordeling van bestaande indexproef na21dagen. Schema en sitemap gebruiken de echte dossierdatum; llms benoemt het laatste eigen claimstuk. Bron-datums van andere dossiers schuiven niet mee.

## Validatie

21 gerichte tests slagen met echte data/renderers en alleen opslag-/AI-I/O offline vervangen. Controle op feitenbehoud, gescheiden fondsen, bronindices/ids, HTML-ankers, metadata, bestaande vertalingen en bestaande aanmeld/deelroutes. Een onafhankelijke read-only audit controleerde bronclaims en integratie. Hersteld: dossier Sportgeschiedenis gesloten (niet website); 2026:1023 noemt geen websitebouwer; recente Bakx-blogs/Bas toegevoegd; eigen claimdatum en bron-datums correct gelabeld.

Lokale previewserver kon wegens socketbeperking niet starten. Productie-HTML en visuele controle worden na de uitrol beoordeeld; resultaten en IndexNow komen in het centrale WAM-werklog.

## Open

Geen compleet claimregister, betrouwbaar winstpercentage, foutpercentage, totale ontvangsten of makersaandeel vastgesteld. Geen definitieve eigen afwikkeling, eindvonnis Kaviaar/ANP of officiële zittingsbevestiging ingezien. Geen nieuw specifiek wederhoorverzoek verzonden.

