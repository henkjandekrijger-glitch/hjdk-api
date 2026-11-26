# Kadoly: elke dag een uitlegvideo (dagtaak)

Henkjan 26 nov 2026: "Heb goede ervaring bij Youtub maak goede uitleg filmpjes van de artikelen van iedere dag", "niks verkopen maar wel naar de winkel verwijzen", "Mag geen robot voice zijn" en "4 platformen iedere dag mix van nuttig en gewoon product hq vids kort . Altijd links en CTAs niks intypen zorg dat CM er tussen zit".

Eén video per dag, nuttig (geen verkoop), 30 tot 50 seconden, echte stem en muziek, naar TikTok, Instagram, YouTube en Pinterest. De productvideo's komen apart uit kadoly-video (taak-social.md stap 7b). Voorbeeld: `u261126led` in reels.json (led kaarsen).

## Stappen

1. **Al gedaan?** Staat er in `kadoly/reels.json` al een video met `soort: uitleg` en `gepost` van vandaag: stoppen.
2. **Onderwerp.** Lees `https://gids.kadoly.com/sitemap.xml` (web_fetch_vercel_url) en kies het nieuwste artikel onder /redactie/ dat nog niet als `gids` in reels.json staat. Geen nieuw artikel: kies een gids van gids.kadoly.com met een vraag die mensen nu stellen (seizoen, kerst, cadeau). Lees het hele artikel.
3. **Script** (`/tmp/uv/spec.json`, voorbeeld hieronder). 5 tot 7 scènes plus een productscène. Scène 1 is de haak: een vraag of verrassing die de kijker zelf heeft. Elke scène: `titel` (max 8 woorden), `tekst` (max 18 woorden), `bron` (de bron uit het artikel), `vo` (wat de stem zegt, max 18 woorden, gewone spreektaal, cijfers voluit als ze anders vreemd klinken). Alleen feiten uit het artikel. Geen gedachtestreepjes, geen prijzen, geen 'goud' of '18k' bij verguld. De productscène: hoogstens 4 producten uit het artikel (pid en korte naam), `vo` zegt wat je ziet, geen verkooppraat. `eind_vo` laat je weg (standaard: "Tik op de link. Daar staat de hele uitleg, met alle bronnen."). Nooit een adres uitspreken of tonen om over te typen.
4. **Stem, muziek, foto's** (web_fetch_vercel_url; grote antwoorden worden een bestand, gebruik dat pad):
   - stem: `https://hjdk-api-henq.vercel.app/api/shop?op=stem&m=elevenlabs/eleven-v3&t=<vo 1>&t=<vo 2>...` in de volgorde scènes, producten, eind (de eindregel ook meesturen). Eén aanroep.
   - muziek: `...?op=muziek&s=55&t=warm calm acoustic background, soft piano and light percussion, no vocals, cozy` (stemming bij het onderwerp, altijd 'no vocals').
   - foto's: `...?op=fotob64&t=sq&p=<pid>,<pid>`.
   Kosten samen ongeveer $0,20 (AI Gateway; geen eigen account dat stem maakt).
5. **Maken:** vanuit /home/claude/hjdk-api: `node scripts/uitlegvideo/maak.mjs /tmp/uv/spec.json <stem> <muziek> <fotos> /tmp/uv/uit`. Geeft `<id>-bio.mp4`, `-link.mp4`, `-pin.mp4` en twee controlebeelden. Bekijk die beelden (Read). Langer dan 55 seconden: scènes inkorten en opnieuw.
6. **Online zetten:** media-branch (bouwt niet): `git clone -q --depth 1 -b media <origin-url> /tmp/media` (of fetch als hij er is), kopieer de drie mp4's als `kadoly-<id>-<bio|link|pin>.mp4`, commit, `git push -q origin media`. Controleer met Zernio `validate_media` op de bio-url.
7. **Clickmind-link** voor YouTube: `https://hjdk-api-henq.vercel.app/api/shop?op=orgkort&k=yt&u=<gidspad>&c=v-<id>&vorm=tekst`.
8. **Plannen** met Zernio `call_tool posts_create_post`, één post met vier platforms, `external_id` `v-<id>`, en per platform een eigen `scheduledFor` (Henkjan 26 nov: 19:30 NL voor alles is "niet ideale tijd"). Tijden staan in reels.json > `lerend` > `uitleg_tijd` (NL-tijd); start: YouTube 18:00 (Shorts worden een paar uur na plaatsen pas breed getoond), Instagram 20:30, TikTok 21:00, Pinterest 21:30 (eigen Kadoly-data: de meeste aanmeldingen tussen 21 en 23 uur NL). Is een tijd vandaag voorbij of is het minder dan 30 minuten ervoor: morgen dezelfde tijd. Leren: elke zondag per platform de tijd met de minste Clickmind-kliks per 1000 weergaven een uur opschuiven richting de beste (na minstens 3 uitlegvideo's), en het besluit in `lerend.besluiten`.
   - TikTok `6b0843e70e9a0994700ea737`, media `-bio`, tekst: haak, 'Tik op de link in ons profiel voor de hele uitleg met bronnen.', een Engelse regel, 3 tot 4 hashtags; platformSpecificData {privacyLevel: PUBLIC_TO_EVERYONE, allowComment: true, allowDuet: false, allowStitch: false, commercialContentType: brand_organic, contentPreviewConfirmed: true, expressConsentGiven: true}.
   - Instagram `6afb8787a26245ebf04dc7be`, media `-bio`, zelfde soort tekst, {contentType: reels}.
   - YouTube `6b08384bff3a28e7d1bf3f5c`, media `-link`, tekst met 'Hele uitleg met alle bronnen: <korte link>', {title: '<haak> #shorts' (max 100), visibility: public}.
   - Pinterest `6afb8a5d86e8bb18f844fc95`, media `-pin`, bord dat past (Wonen 271060540011940607, Cadeau-ideeën 271060540011940609, Sieraden 271060540011940606, Hobby 271060540011940610), {title, link: `https://gids.kadoly.com/<gidspad>?utm_source=pinterest&utm_medium=video&utm_campaign=v-<id>`} (geen doorstuurlink op Pinterest).
   - Facebook alleen als `accounts_list` de pagina als werkend toont.
   Eerst `validate_post` met dezelfde platforms.
9a. **Videomind** (skill `videomind`, sinds 26 nov het register voor elke video van alle projecten): lees vóór stap 2 `https://hjdk-api-henq.vercel.app/api/videomind?op=lessen&project=kadoly&vorm=tekst` en registreer na het plannen elke platformversie met `op=zet&json=[...]` (id `kadoly-<onderwerp>-<yt|tt|ig|pin>`, project kadoly, platform, vorm short, titel, haak, onderwerp, pagina, lengte, taal nl, at, zid, link). Voorbeeld: kadoly-led-kaarsen-yt. Videomind meet dan zelf na 48 uur en 7 dagen.
9. **Vastleggen:** in reels.json een video {id, soort: uitleg, titel, gids, url (bio), url_link, url_pin, pids, bron, gepost (dag), platforms {tiktok, instagram, youtube, pinterest: {zernio_id, tijdvak}}}. De biolinks go.kadoly.com/o/tt en /o/ig tonen hem dan bovenaan. Commit `kadoly/reels.json` (git add met naam), `git pull --rebase`, push. Werklog: `https://hjdk-api-henq.vercel.app/api/mm/handover?log=<Kadoly uitlegvideo <id>: onderwerp, lengte, gepland>&wie=kadoly-video`.
10. **Leren:** de social-ronde meet elke video na 24 uur (taak-social.md 7b) en zet per soort de maat in reels.json > lerend. Lees vóór stap 2 `lerend.soorten.uitleg` en de `gemeten` van eerdere uitlegvideo's: welke haak en welk onderwerp gaf de meeste Clickmind-kliks per 1000 weergaven. Kies het volgende onderwerp en de haak daarnaar en zet in `lerend.besluiten` één regel als je iets verandert.

## Voorbeeld spec.json

```json
{"id":"u261126led","scenes":[
 {"kicker":"Kerst 2026","titel":"Led kaars of echte kaars?","tekst":"4 regels van de brandweer. En 1 die bijna niemand kent.","accent":"warm","vo":"Led kaars of echte kaars? Dit zijn vier regels van de brandweer. En één die bijna niemand kent."},
 {"nr":1,"titel":"Geen echte kaars in een kerststukje","tekst":"Zet er een led-kaarsje in.","bron":"Brandweer Nederland","vo":"Eén: geen echte kaars in een kerststukje. Zet er een led-kaarsje in."}],
 "producten":{"kicker":"Geen vlam, wel sfeer","titel":"Zo ziet licht zonder vlam eruit","items":[{"pid":"oc_4173959244120065","naam":"Tafellamp brons"}],"vo":"Zo ziet licht zonder vlam eruit."}}
```
`accent`: leeg (blauw), `warm` of `rood` (waarschuwing).

## Grenzen

Alleen feiten uit het artikel met bron. Niets verkopen in beeld of stem. Geen reacties of berichten sturen. Een stap die mislukt: één nieuwe poging, daarna overslaan en de reden in het werklog.
