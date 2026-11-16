# Todayin surgery: dagelijkse onderhouds- en conversielus

Ingang: https://todayin.email/surgery/overdracht?vorm=json. Lees ook CLAUDE.md, .claude/skills/zicht-seo-llm/SKILL.md en docs/todayin-surgery-assessment-2026-11-16.md. Actuele blobs en main vóór schrijven herlezen; werk van andere chats behouden.

## Planning

- ChatGPT-taak **Surgery tandheelkunde en groei**, ingeschakeld vanaf 16 november 2026, dagelijks rond 01:30 America/Curacao. Taak-id voor beheer: Automation_f1693a67c85c81919bbc05fab300c488. Flexibele uitvoering, dus geen belofte van exact die minuut.
- Bestaande mailcron 08:10 UTC = 04:10 Curaçao, niet gewijzigd. Dagelijkse mail alleen met expliciete daily-toestemming; legacy alleen bij passende wijziging.
- Bestaande Claude-dagronde 11:37 UTC en rankingronde 13:13 UTC behouden; hun actuele bestaan/status via eigen taakomgeving controleren. De ChatGPT-taak heeft die externe scheduler niet gewijzigd of onafhankelijk bevestigd.
- Eerste nacht: tandheelkundige bronnen, NL-campagne, voorbeeldmail en aanmelding verdiepen vóór de lezerswerving. Weekevaluatie zondag 22 november, niet pas na veertien dagen naar nul verkeer kijken.

## Elke ronde

1. Lees eigen `/surgery/stand`, ZICHT surgery-stand, open vragen/correcties en de campagnereceipts via de gekoppelde beschermde Vercel-host. Houd onbekend, niet gecontroleerd, geen verkeer en werkelijk nul uiteen. Noem de meetperiode en de beperkingen.
2. Controleer minstens drie echte primaire bronnen: één tandbehandeling met een actueel of ontbrekend prijsdetail, één relevante thuis-/reisroute, één aanbieder met zwakke of oude onderbouwing. Rouleer behandeling, land en taal. Bewaar URL, leesdatum, entiteit, behandeling, merk en concrete wijziging. Bij onbereikbaarheid geen datum verversen alsof gecontroleerd.
3. Vul eerst NL/BE/DE en bestaande Europese reisroutes, daarna aanwezige wereldregio's. Alle 249 thuislanden zijn mogelijk; een menukeuze bewijst geen dossier. Publiceer alleen betekenisvolle inhoud, geen lege landpagina's of kopieën om zoektermen te bezetten.
4. Prijsrecord vereist valuta, eenheid, omvang, expliciete inclusies en onbekende posten. Een losse schroef, complete tand en volledige kaak blijven verschillend. Merken alleen met expliciete bron. Geen reviews van een organisatie aan een arts of behandeling toeschrijven.
5. Vertaal echte relevante wijzigingen naar data/tsc-nieuws.json in EN/NL/DE. Eigen gids-/inventarisupdates als zodanig labelen. Onderwerp, thuisland en expliciete bestemming respecteren. Bij geen bronwijziging blijft een bestaande vergelijking of keuzevraag herkenbaar; niets als nieuw fabriceren.
6. Lees echte zoek-/chatvragen. Beantwoord brongebaseerd en voeg blijvende FAQ/context toe; geen persoonlijk medisch advies, diagnoses of dossiers vragen. Een onbeantwoorde vraag is een onderzoeksspoor, geen toegezegd antwoord morgen.
7. Controleer de complete route: campagnebelofte → passende landing → zichtbaar formulier → eerlijke bevestigingsaanvraag → expliciete POST-bevestiging → werkelijk bronoverzicht → voorkeuren/afmelding. GET/HEAD muteren niet. Betaalde acquisitie en SEO apart rapporteren.
8. Laat de v2-knopproef staan zolang de steekproef onvoldoende is. Hoogstens één nieuwe conversiehypothese met voorspelling, arm, metric, minimum en beslisdatum. Geen winnaar bij één abonnee. Onderwerpregels leren alleen van vrijwillig gemeten expliciete fasewijzigingen, nooit opens.
9. Verifieer concrete wijzigingen, commit expliciete bestanden, wacht op Vercel READY en controleer de publieke NL/EN/DE-uitkomst. Werk werking, open punten en werklog bij. Maak voortgang en resterende onzekerheid zichtbaar.

## Overgenomen uit Curaçao.day

Bronnen: repo todayin, spel/leerlus/werking.md, spel/leerlus/taak-lokaal.md en bzz/lib/cwmail.js/cwronde2.js. Herbruikbaar zijn gedateerde bronfeiten, snapshots vergelijken, lezersvragen als input, QA vóór aflevering, campagnebelofte doorzetten naar de welkomroute en een expliciete proef met terugkoppeling. Surgery neemt geen demografische lookalikes, gezondheidsprofilering of opens als belangstelling over. Leermeting blijft apart vrijwillig.

## Technische contracten

- Bronaanbod: data/tsc-dental.json en bestaande directorybestanden. Per aanbod bron-URL/type en checked_at. Leesdatum is geen publicatiedatum of nieuwe verificatie van alle andere feiten.
- Inhoud: lib/tsc-dental.js levert hub, offertechecklist, prijssnapshots, voorbeeldmail, echte bronoverzichten en chatfeiten uit dezelfde data. Voorbeeldmail is noindex; zes voldoende gevulde behandelingsoverzichten en drie hubs indexeerbaar.
- Toestemming: zelfgekozen onderwerpen/landen, zichtbare uitleg, aanvraagknop en double opt-in. Geen verborgen bestemming. `follow_countries` is een expliciete instelling. Geen overdracht aan artsen zonder eigen toestemming en bouw.
- Bevestiging: stabiele pending-payload/token en Resend-idempotencykey, gedeelde ontvangerlock, eerlijk retrybaar providerprobleem. Provideracceptatie is geen inboxbezorging.
- Dagmail: bestaande gedeelde lock, bewaarde dagpayload, CAS/atomaire deelupdates en laatste toestemmingscheck. Welkom en cron samen maximaal één mail per dag. Afmelding tijdens verzending en gewijzigde voorkeuren blijven getest.
- Experiment: `visible-form-v2-2026-11-16`; servertoewijzing → browser past de nog zichtbare variant toe → geacknowledgede receipt. 24–64 hex view, opaque receipt, korte opslagtermijn. Onzichtbare toewijzing is geen denominator; latere bevestiging telt alleen bij geacknowledgede receipt als proefuitkomst.
- Acquisitie: source/medium/campaign/content begrensd en gesaneerd; geen volledige URL of zoekterm. `browser_reported_visible_form_receipts; confirmed_first_optins` is de expliciete semantiek. Geen veronderstelde unieke mensen of klikfraude-audit. Uitgaven/CPA onbekend zonder werkelijke gekoppelde besteding.
- Drempels: minimaal 200 waarnemingen per arm en 30 uitkomsten, 99%-vergelijking, daarna 10% uitdager. Geen dagelijkse geforceerde winnaar.
- ZICHT: chirurgiepad `/surgery`; vier vaste tandvragen vanaf 16 november, nieuwe nulmeting. 14-daagse indexproef `surgery-dental-index-1116`, gecombineerd pakket observationeel. Geen extra betaalde keywordcalls; Demand Radar-cache gebruiken.

## QA en afronding

Productie gebruikt Node 24 en JSON import attributes. Gebruik een passende runtime. De lokale Node18-QA-kopie mag uitsluitend de importsyntax naar assertions omzetten; die omzetting nooit in productie committen.

Voer `node scripts/test-tsc-choice.mjs` en `node scripts/test-tsc-countries.mjs` uit bij wijzigingen aan die routes/contracts. Nieuwe fouten eerst oplossen. QA gebruikt een in-memory mailprovider; geen echte testabonnees aanmelden. Check bronlinks, mobiel land-/onderwerppaneel, unieke ids, scripts, canonical/hreflang/noindex en sitemap/llms. Browsercontroles met `?controle=1` niet als echt bezoek meten. Runtime-errors op de eigen deployment bekijken. IndexNow pas melden na READY en publieke inhoudscontrole.

Werklog: `/api/mm/handover?wie=surgery-tandheelkunde&log=...`, met concrete wijzigingen, tests, commit, deployment en wat niet geverifieerd is. WERKING/OPEN in lib/tsc-overdracht.js en lib/werking.js dezelfde commit; SEO-log in lib/overdracht-kz-tekst.js. Geen nieuwe advertentieuitgaven, domeinaankoop, betaalde keywordinkoop of contactoverdracht zonder concrete opdracht.


## Bekende uitvoerstatus 16 november

Eerste automatische ChatGPT-poging: algemene foutmelding, geen technische oorzaak of vraag om gebruikersactie. Herhaalprompt daarna in de actieve chat uitgevoerd; taak blijft dagelijks ingeschakeld, toekomstige achtergrondrun nog onbewezen. De bestaande mailcron werkte wel: 1 provideracceptatie, 0 fouten. Neem de eerstvolgende echte taakuitkomst opnieuw door en rapporteer een mislukking eerlijk. Geen platformfout als bron-/conversiesucces presenteren. Oude rendercohorten blijven onder legacy_cohorts, buiten de actieve v2-zichtbaarheidsproef. Browser-QA van de nieuwe versie had een sessiefout; SSR/metadata/scripts zijn wel publiek gecontroleerd.
