---
name: videomind
description: Videomind, Henkjans register en leergeheugen voor elke video van elk project (YouTube, TikTok, Instagram, Pinterest). Gebruik vóór je een video maakt, plant of plaatst, en bij elke vraag over hoe video's het doen: registreren, link met utm_content via Clickmind, meten na 48 uur en 7 dagen, lessen lezen en bijschrijven.
---

# Videomind: elke video lerend

Videomind is het register en het geheugen van alle video's van alle projecten (Henkjan 26 nov 2026: "We maken een videomind om al het geleerde op te slaan en tracken per video voor alle projecten"). Broertje van Clickmind (leert van elke klik) en Mailmind (leert van elke mail). Live: https://hjdk-api-henq.vercel.app/api/videomind (lezen met web_fetch_vercel_url; tekst is de standaard, `&vorm=json` voor JSON). Code `lib/videomind.js`, eindpunt `fn/videomind.js`, deze skill `.claude/skills/videomind/SKILL.md` (live ook voor iedereen: `/api/videomind?op=skill`).

## Wanneer

Bij elke video voor elk project (mylevel, kadoly, nexy, wam, tk, kdp, ...), op elk platform: Shorts, lange video's, TikTok, Reels, Pinterest-video. Geen video de deur uit zonder regel in Videomind.

## Werkwijze per video

0. **Briefing van Clickmind (27 nov 2026):** elke video staat ook in het ene geheugen van Clickmind, naast advertenties, posts en mails. Lees `https://hjdk-api-henq.vercel.app/api/mm/briefing?medium=<youtube|tiktok|instagram|pinterest>&project=<id>&doel=<doel>` voor wat op dit medium en in andere media werkt, en geef bij het registreren `doelsoort` mee (koop, aanmelding, store, actie, klik, reactie of bereik): welk getal deze video moet bewegen.
0b. **Eerst kijken wat op dat platform extreem goed loopt (Henkjan 27 nov 2026: "kijk met video mind -bouw dat in - eerst altijd naar wat er op dat platform extreem goed loopt ."):** lees `/api/videomind?op=trend&platform=<platform>&project=<id>`. Staat daar 'eerst kijken' (geen scan van de laatste 7 dagen), zoek het dan eerst uit, in de soort van het project en het land van het publiek:
   - TikTok: TikTok Creative Center (Top Ads en trending hashtags, geluiden en makers, land en branche), en de bovenste video's op de zoekterm van het product;
   - Instagram: de Reels met de meeste weergaven onder de hashtags van de soort, en wat de grootste merken in de soort deze week posten;
   - YouTube: Shorts op de zoekterm, gesorteerd op weergaven, uploaddatum deze week of deze maand;
   - Pinterest: Pinterest Trends voor het land, en de video-pins met de meeste saves op de zoekterm.
   Leg per platform 2 tot 5 vormen vast: `op=trend&json={"platform":"tiktok","project":"<id>","niche":"<soort, land>","wat":"<de vorm: eerste seconde, opbouw, lengte, tekst in beeld, geluid>","haak":"<pov|keuze|uitdaging|lijst|unboxing|voor-na|...>","voorbeeld":"https://...","maat":"<het getal: weergaven, saves of likes in hoeveel dagen>","bron":"<waar je het zag>"}` (een lijst kan ook). Nooit een getal verzinnen: geen getal gevonden, dan geen trend. Maak je video daarna naar de sterkste vorm, met eigen product, eigen beeld en eigen tekst (nooit beeld, geluid of tekst van een ander overnemen), en zet bij het registreren `trend` = de vorm die je volgt. De lessen zetten 'volgt een trend' naast 'eigen idee'.
0c. **Native en trend als tweeling (Henkjan 27 nov 2026: "voor ieder platform alles native EN ... maak daar altijd een alternatief mee"):** maak naast je eigen idee altijd een tweede video op een trend uit 0b en registreer ze als tweeling: de ene met `variant: "native"`, de andere met `variant: "trend"`, `trend: "<welke trend>"` en `paar: "<id van de andere video>"`. Clickmind leert welke van de twee wint; de briefing uit stap 0 toont de trendscan van Videomind erbij.
1. **Lessen lezen vóór je begint:** `/api/videomind?op=lessen&project=<id>&vorm=tekst` (en zonder project voor wat over alle projecten werkt). Kies titelvorm, lengte, uur en onderwerp naar wat daar wint. Geen les voor jouw geval: kies de sterkste les van hetzelfde platform en zet de rest als proef.
2. **Id kiezen:** het video-id is overal de sleutel en moet uniek zijn over alle projecten: `<project>-<onderwerp>-<n>` (bijv. `kadoly-kerstpakket-3`). Bestaande MyLevel-id's (`cdl-0`, `long-dmv`) blijven zoals ze zijn.
3. **Link via Clickmind:** de link in de beschrijving (en de vastgezette reactie) is de pagina met `?utm_source=<platform>&utm_medium=<shorts|long|reels|...>&utm_content=<video-id>`. Op een site met de Clickmind-meter (cm.js) telt Clickmind dan elk bezoek en elk echt mens onder net = utm_source, zone = utm_content. Een site zonder meter krijgt eerst cm.js (skill clickmind). Een getypte korte link (bijv. mylevel.today/cdl) is niet per video te meten: zet daar `utm_content=<onderwerp>` en reken het als bezoek op het onderwerp.
4. **Registreren vóór plaatsen:** `/api/videomind?op=zet&json={"id":"...","project":"...","platform":"youtube","vorm":"short","titel":"...","haak":"uitdaging","onderwerp":"...","pagina":"/...","lengte":15,"taal":"en","at":"2026-12-01T14:00:00Z","zid":"<Zernio-post-id>","link":"https://...&utm_content=<id>"}`. Meer tegelijk: `json=[...]` of POST `{"videos":[...]}`. Vanuit de cloud: POST met de gedeelde team-sleutel in `x-hjdk-token`. `haak` is de titelvorm (`uitdaging` = "can you answer this?", `vraag` = de vraag zelf in de titel, `n-vragen` = "20 vragen met antwoord", `uitleg`, `lijst`); laat je hem weg, dan leidt Videomind hem af uit de titel. Geen Zernio-id nog: registreer zonder `zid` en zet hem erbij zodra de post er is (`op=zet` met alleen id, project, platform en zid).
5. **Meten gaat vanzelf:** de ronde (cron elke 6 uur op :19) haalt uit Zernio weergaven, likes, reacties, delen, kijkduur en uitkijkpercentage (jonge video's elke 5 uur, tot 14 dagen elke 20 uur, daarna wekelijks) en uit Clickmind de bezoeken en echte mensen per dag. Na **48 uur** en na **7 dagen** legt hij de weergaven vast (m48, m7): daarop vergelijk je, niet op de stand van nu. Wat alleen het project weet (verkopen, omzet, aanmeldingen uit de eigen kassa) meld je zelf: `op=meting&json={"id":"<id>","koop":1,"omzet":49,"bron":"paddle"}`.
6. **Na 48 uur en na 7 dagen kijken:** `/api/videomind?project=<id>&vorm=tekst`. Een video die na 48 uur onder de helft van de mediaan van zijn soort zit: niet nog een van die soort maken. Een soort die twee keer boven de mediaan zit: meer daarvan.
7. **Les opschrijven** als je iets ziet wat de automatische lessen niet zeggen (thumbnail, eerste seconde, reactie die werkte): `op=les&les=<een zin met het getal>&project=<id>&platform=<platform>&bron=<waar het getal vandaan komt>`. Nooit een les zonder getal, nooit verzonnen.

## Lessen

- **Automatisch** per platform en project: mediaan weergaven na 48 uur per titelvorm, vorm, lengte, uur van plaatsen (blokken van 3 uur UTC) en onderwerp, met bezoeken en echte mensen per 1.000 weergaven en verkopen. Een les telt vanaf 3 geplaatste video's per kant; zolang de 48 uur-meting te dun is, staat erbij dat het de stand van nu is (ongelijke leeftijd).
- **Met de hand** (op=les): wat een chat zag, met bron.
- Het dashboard (project `video`) toont video's deze week, weergaven erbij, bezoeken en echte mensen via video, en de beste les.

## Titelregels die nu winnen (stand 26 nov 2026, MyLevel YouTube Shorts; lees de live lessen voor de nieuwste cijfers)

- **Zoekterm voorop:** titel en eerste regel van de beschrijving beginnen met de zoekterm die mensen typen (bijv. "CNA Practice Test 2026"), hashtags aan het eind (MyLevel seo.mjs, 26 nov).
- **Uitdaging wint van de vraag zelf:** "<test>: can you answer this?" (haak uitdaging) liep op 24 nov voor op "<test>: <vraag>" (CNA 41 en CDL 38 weergaven tegen ASVAB 27); nog te weinig video's voor een harde les.
- **Weergaven zijn nog geen bezoekers:** op 26 nov 0 echte bezoekers via YouTube bij ruim 220 weergaven. Elke video vraagt in beeld en in de eerste regel om de link, en de lange video's zetten de link als eerste regel. Meet een nieuwe vorm op echte mensen per 1.000 weergaven, niet op weergaven alleen.
- **Doelgroep die kan betalen:** voor MyLevel alleen nog Shorts voor volwassen kopers en dure pakketten (real estate $79, CDL $49), geen scooter of bromfiets (Henkjan 26 nov).

## Grenzen

- Videomind plaatst niets en geeft geen geld uit: plaatsen gaat via de chat van het project (Zernio) en alleen binnen de regels van dat project.
- Geen sleutels in code of URL; Zernio leest de ronde met de gedeelde team-variabele ZERNIO_API_KEY.
- Een id is van één project: een tweede project met hetzelfde id wordt geweigerd.
- Werklog na elke ronde met video's: `/api/mm/handover?log=<wat>&wie=<project>-video`. Verander je hoe Videomind werkt: pas deze skill, `lib/videomind.js` en `lib/werking.js` aan in dezelfde commit.
