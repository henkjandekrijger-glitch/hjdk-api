# Amazon-doorklik per pagina meten

24 november 2026 · voorstel ter inzage · broncode en productie geverifieerd.

## Waarneming

Op 23 november UTC kwamen 32 geregistreerde pagina-openingen binnen op Stocking Books en 12 op Lasting Change. Eén opening op Stocking Books kwam via Pinterest. De bestaande rapportage registreerde 630 ruwe Amazonredirects. Het meetscript telt openingen apart en geeft de bron door op een Amazon-link. De redirect telt per boek en bron, zonder betrouwbare koppeling aan de geopende pagina. De verhouding van die tellers zegt daarom niets over het percentage lezers dat doorklikt.

## Wijziging ter inzage

Meet via het bestaande `op=tel` twee gebeurtenissen binnen dezelfde paginaweergave: opening en eerste bewuste klik op een Amazon-link. Gebruik één willekeurige, tijdelijke ID per weergave, zonder cookie. Leg de canonieke pagina en bron bij de opening vast. Laat de klik dezelfde ID gebruiken en registreer op de server hoogstens één doorklik per weergave. Houd tijdelijk beide gebeurtenissen vast, zodat omgekeerde aankomstvolgorde hetzelfde resultaat geeft. Rapporteer alleen gekoppelde paren in het openingsvenster en begrens padwaarden tot bekende pagina’s. Activeer de meting alleen op openbare pagina’s. Laat het bestaande /go-pad en de huidige ruwe rapportage doorlopen.

## Eerste controle

Controleer de checkoutlinks niet door naar Amazon te reizen. Test de eigen meetroute en onderschep navigatie in de test. Controleer één uitstelartikel en de gratis kerstwoordzoekers. Een normale klik, klik op de omslag en toetsenbordactivatie moeten meetellen. Herhaald klikken, dubbele ontvangst, een directe /go-opvraag en een conceptweergave mogen het aantal gekoppelde weergaven niet verhogen. Controleer beide aankomstvolgordes, een paginaweergave zonder klik en een paginaweergave over de UTC-daggrens.

Eerste rapport na één volledige UTC-dag: gekoppelde paginaweergaven met klik gedeeld door gemeten paginaweergaven, per pagina en bron waar het volume dat toelaat. Dit meet browserinteracties. Verkoop blijft een aparte meting. Kies pas daarna één inhoudsproef, met de gratis woordzoekers als bestaande controle zolang die proef loopt.

## Parallelle distributie

Het uitstelartikel is live. De start-over-preview heeft HTTP 200, noindex en zeven dagstappen. De bestaande concepttekst is behouden. De twee goedgekeurde pins blijven klaar voor deduplicatie en controle van de gedeelde accountcapaciteit. In deze sessie stuurt Zernio het dashboard door naar het inlogscherm. Er is geen nieuwe providerplaatsing of prestatie vastgesteld.
