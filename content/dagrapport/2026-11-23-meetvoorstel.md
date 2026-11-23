# Voorstel: pagina en Amazonklik koppelen
Datum: 23 november 2026. Status: concept, geen productiecode gewijzigd.

## Probleem en bron
Het gesloten dagrapport voor 22 november telt 7 Stocking Books- en 13 Lasting Change-pagina-openingen naast 208 ruwe redirects. De bestaande teller koppelt een redirect niet aan de betreffende pagina-opening. Een verhouding van deze aantallen bewijst geen menselijke conversie. De herstelde LC-knoppen gaan inmiddels via /go; het koppelen per pagina blijft een aparte ontbrekende stap.

Bronnen: /api/bs?op=dagrapport&droog=1, fn/bs.js en lib/bsmeet.js. Het openbare LC-artikel is op 23 november opnieuw gecontroleerd: HTTP200, indexeerbaar, juiste canonical, startplan aanwezig en paperback via /go.

## Kleinste reparatie ter beoordeling
1. Geef elke openbare pagina-opening een willekeurig tijdelijk pagina-ID in het documentgeheugen, zonder blijvend persoonsprofiel. Verstuur site, canoniek pad, bron en ID naar de bestaande teller.
2. Stuur bij een echte browserklik op een Amazonknop hetzelfde pagina-ID plus ASIN en knoppositie naar die teller. Houd de redirect zelf werkend, ook zonder JavaScript of geldig meetevent.
3. Bewaar ruwe redirects apart. De nieuwe maat wordt per site, bron en pagina: pagina-openingen met ten minste één gekoppelde browserklik gedeeld door gekoppelde pagina-openingen. Meerdere kliks op dezelfde pagina tellen eenmaal in deze verhouding.
4. Noem ook de nieuwe maat browseracties, geen bewezen unieke mensen of verkopen. Een tijdelijk ID en browserkliksignaal bewijzen geen identiteit of botvrijheid. Sluit beschermde previews en herkenbare automatische controles uit.
5. Toon ontbrekende bron, ontbrekende koppeling en niet-vergelijkbare historie apart. Meng de nieuwe meetreeks niet met oude redirectpercentages. Geen tekst van de coach-chat of andere persoonlijke inhoud opslaan.

## Vereiste controles vóór uitrol
- Eén pagina met drie klikken levert drie ruwe verzoeken maar één pagina met doorklik.
- Site, pagina en bron worden niet over de twee websites vermengd.
- Klik zonder voorafgaande pagina-opening blijft ongekoppeld en wordt geen conversie.
- Preview en automatische controle vervuilen de publieksmeting niet.
- De kooproute blijft werken bij ontbrekende JavaScript/meetopslag.
- Bestaande paginatests blijven slagen; geen echte betaal- of kooptransacties testen.

## Beslisregel
Eerst goedkeuring van dit concrete meetvoorstel. Daarna implementeren binnen het bestaande eindpunt, geen nieuwe api/-functie. Binnen 24 uur na uitrol de koppeldekking en werking toetsen. Pas met voldoende vergelijkbare pagina-openingen een inhoudslek beoordelen. Geen CTR-winnaar of omzetclaim uit deze reparatie afleiden. De inhoudelijke publicatie-evaluatie van het uitstelartikel blijft 7 tot 14 december, met voldoende data.
