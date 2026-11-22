---
name: mail-lerend
description: Gebruik bij elke mail die namens Henkjan de deur uit gaat (koude mail, outreach, opvolging, antwoord, automatische mail). Lees eerst de regels van de POST-lus, toets het concept, meld het, en laat het dan pas aan Henkjan zien.
---

# POST: elke mail eerst langs de lus

Eén gedeelde, lerende lus in de cloud (Vercel-project hjdk-api, lib/postlus.js en fn/post.js). Elke chat van elk account gebruikt dezelfde regels en voedt ze. De bron van deze skill is de repo (.claude/skills/mail-lerend/SKILL.md), niet een Claude-account.

- Regels: https://hjdk-api-henq.vercel.app/api/post?op=regels&t=1
- Stand: https://hjdk-api-henq.vercel.app/api/post?op=stand

Ophalen met web_fetch_vercel_url (curl naar deze domeinen wordt vanuit de cloud geblokkeerd).

## Vóór je een mail aan Henkjan laat zien

1. Lees de regels (op=regels&t=1). De volgorde is de score: regels met [vast] gelden altijd, de rest staat op bewezen effect.
2. Schrijf het doel in één zin: wat moet de ontvanger doen? Eén mail, één vraag.
3. Schrijf het concept en loop elke regel na. Past een regel niet bij deze mail, laat hem dan bewust weg.
4. Gaat het om 10 of meer mails met hetzelfde doel: maak twee varianten (a en b) die op één ding verschillen en verdeel ze om en om.
5. Meld elk concept (zonder token mogelijk):
   `/api/post?op=meld&project=<project>&doel=<één zin>&aan=<adres>&soort=<journalist|onderzoeker|organisatie|kliniek|bedrijf|klant|partner|anders>&taal=<nl|en|de>&onderwerp=<onderwerpregel>&variant=<a|b>&lessen=<ids van de toegepaste regels, komma's>&wie=<chat>`
   Het antwoord geeft een id. Gebruik per project en doel steeds dezelfde tekst, anders zijn varianten niet te vergelijken.
   Geef elke link in de mail mee met `&links=<url>|<url>`. Het antwoord geeft per link onder `gebruik` de meetlink (`<eigen host>/m/<code>`); zet die in de mail, niet de kale pagina. De klik komt in Clickmind (netwerk mail, campagne post-<project>) en de pagina krijgt `?mmc=<klik-id>`, zodat cm.js het gedrag daarna volgt. Links naar sites van anderen blijven kaal.
6. Laat het concept in de chat aan Henkjan zien. Pas na zijn "verstuur" gaat het in Gmail. Nooit zelf versturen.

## Links en de Gmail-koppeling van de chat (18 nov 2026: "Dit NOOIT meer doen: niet de goede link")

De Gmail-koppeling van Claude herschrijft elke link die met https begint naar een google.com/url-link, ook in een a-href. Controleer dus elk concept na het aanmaken met get_draft (RAW of FULL_CONTENT). Staat er google.com/url in: niet versturen. Zonder https ervoor helpt niet meer: op 20 nov 2026 herschreef de koppeling ook gids.kadoly.com/m/CODE en zelfs een kaal kadoly.com (getest met een concept, vier creatormails gingen zo de deur uit). Een mail met een link verstuur je daarom via Gmail in de browser (Chrome, tab daarna sluiten) of je laat de link weg. Verstuur nooit een mail waarvan je de links niet hebt teruggelezen; maak bij twijfel eerst een testconcept aan jezelf en lees het terug.

## Na het versturen

Verstuur je zelf vanuit de chat (na Henkjans "verstuur"), meld dat dan meteen: `/api/post?op=uitkomst&id=<id>&uitkomst=verstuurd`. Verstuur rustig: hooguit een paar per dag per project.

Niets melden: de dagelijkse ronde kijkt in Gmail (alleen lezen) of de mail in Verzonden staat, of de ontvanger antwoordde en of hij terugkwam. Is Gmail niet gekoppeld (stand: gmail.gekoppeld false), meld dan zelf:
`/api/post?op=uitkomst&id=<id>&uitkomst=<antwoord|ja|nee|klik|bounce|geen>&toelichting=<kort>`

"ja" en "nee" zijn inhoudelijke antwoorden (link geplaatst, afspraak gemaakt, afgewezen); meld die ook als Gmail gekoppeld is, want de ronde ziet alleen dat er antwoord kwam.

## Heel Gmail

Is Gmail gekoppeld, dan leest de ronde vier keer per dag alle verzonden mail (alleen kenmerken: lengte, links, vraag, onderwerplengte, uur) en telt per kenmerk hoe vaak er antwoord kwam. Wat daaruit blijkt staat bovenaan de regels onder "Geleerd uit je eigen Gmail" en gaat voor op een startregel. Ook mail die Henkjan zelf typt of die een andere chat verstuurde telt zo mee, zonder melden.

## Automatische mail (Resend)

Ochtendmails, updates en bevestigingen van alle projecten staan in de stand onder `automatisch`: per stroom (afzender en onderwerp) verstuurd, bezorgd, kliks, bounces en klachten over 7 dagen, en een lijst `werk` met wat aandacht vraagt. Werk je aan een project met zo'n mail: lees die lijst en pak het punt van jouw stroom op als proef in het project zelf. Geopend is alleen een aanwijzing en telt niet mee voor een oordeel.

## Leren

- Een nieuwe regel of nieuw bewijs: voeg toe aan data/post-priors.json (id, les, soort, bron met cijfers, sterkte 1-4) en push.
- Oordeel op antwoorden en kliks, niet op gevoel. Minder dan 10 verstuurde mails per variant: niets concluderen.
- Staan er in de stand concepten die langer dan 2 dagen liggen (`conceptenDieLiggen`): meld dat aan Henkjan in één regel.

## Vaste regels

- Alleen adressen die op een pagina zijn gezien. Elk cijfer in een mail is op een pagina gelezen.
- Elke mail noemt hoe je Henkjan bereikt: antwoorden, of +31 6 55395630 (bellen of appen). De meetinglink voorlopig niet: hij werkt nog niet (Henkjan 18 nov 2026: "volgt later").
- Een eerste mail vraagt niet om een link of citaat, maar of de ontvanger opmerkingen heeft (Henkjan 18 nov 2026).
- Professioneel en recht voor z'n raap. Geen gedachtestreepjes, geen reclametaal.
- Adressen van ontvangers nooit in code, pagina's of het werklog.
