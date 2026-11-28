# Voorstel: boeken meetbaar in Clickmind (taak obiwrz, 27 nov 2026)

Branch `claude/boeken-clickmind-meetbaar`. Niets hiervan staat live. Er is niets gepubliceerd, geen pin, mail, modal, CTA, campagne of betaalinstelling aangeraakt.

## In één zin
Pins en artikelkoppen voor stockingbooks.com en lastingchange.works kunnen een eigen korte link per stuk krijgen (zoals de andere sites al hebben), en het geheugen leert niet meer "0 kliks" van een stuk waarvan we alleen de vertoningen kennen.

## Wat er nu is (gemeten op 27 nov)
- `/m/<code>` is in vercel.json één regel zonder host-voorwaarde: elke host van hjdk-api stuurt hem naar `/api/post?op=k`. Live nagekeken: `stockingbooks.com/m/zzzzz` en `lastingchange.works/m/zzzzz` geven allebei de 404 van de klikroute ("Deze link bestaat niet (meer)."), een code van 4 tekens geeft de gewone 404. De route bestaat dus al op beide domeinen.
- Codevormen op `/m/`: 12 hex + linknummer = mail (POST-lus); 5 tekens = eerst een korte mailcode (`post:k`), dan een postcode (`dist:k`). Mail gaat dus altijd voor.
- `op=distmaak` weigerde stockingbooks.com en lastingchange.works als doel (`DOELEN` in lib/distlus.js). Daarom gaan pins nu rechtstreeks naar de pagina met `utm_source=pinterest&utm_content=<pin-id>` en weet Clickmind niet per pin hoeveel mensen doorklikten.
- Meetrisico: in het paspoort telde een post zonder korte link, of een stuk dat met `op=stuk` alleen vertoningen meldde, als "0 kliks op N vertoningen". Dat trekt het gemiddelde omlaag en kan een stuk ten onrechte "mis" geven. De briefing van vandaag toont dat patroon: "bord sok: 0 tegen 1,2", "bord lc: 0 tegen 0,6".

## Wat de branch verandert (code)
1. `lib/distlus.js`: `stockingbooks.com` en `lastingchange.works` erbij in `DOELEN`. Gevolg: `op=distmaak` met een doel op die sites geeft `https://stockingbooks.com/m/<code>` of `https://lastingchange.works/m/<code>`.
2. `lib/distlus.js` en `lib/postlus.js`: een nieuwe postcode wordt nooit een bestaande korte mailcode en andersom. Zo kan een post nooit een mailklik kapen (en een mail nooit een postklik).
3. `lib/paspoort.js`: onbekend is geen 0. Een post zonder korte link, een video zonder link, een boekpin waarvoor Pinterest alleen vertoningen gaf (geen uitgaande kliks) en een proefversie zonder lagere stap krijgen kliks = onbekend; `meet()` geeft geen meting op kliks als de kliks onbekend zijn. Een echt gemeten 0 (post met korte link, niemand klikte) blijft 0.
4. `lib/werking.js` en `OVERDRACHT-CONTENT.md`: bijgewerkt. Nieuwe test `scripts/test-boeken-clickmind.mjs`.

Wat níet verandert: de pinmotor (lib/bspin.js) maakt nog dezelfde links; geen enkele bestaande pin of pagina verandert; de Bookstuffers-modal (oud domein, 10% controle) en de LC-config (404) blijven zoals ze zijn; mail blijft precies zo lopen.

## Wat een bezoeker straks ziet (pas na een tweede ja, als de pinmotor overgaat)
Voor (nu):
- Pin linkt naar `https://stockingbooks.com/white-elephant-gifts?utm_source=pinterest&utm_content=20261127-test-abcd`

Na:
- Pin linkt naar `https://stockingbooks.com/m/jjfb8`
- Een tik geeft één doorverwijzing (302) op hetzelfde domein naar `https://stockingbooks.com/white-elephant-gifts?utm_source=pinterest&utm_content=20261127-test-abcd&mmc=<12 tekens>&src=pinterest`
- De pagina zelf is gelijk. Alleen de adresbalk heeft twee parameters meer (`mmc`, `src`). Pinterest toont als bestemming nog steeds stockingbooks.com.
- Lastingchange.works werkt hetzelfde (`https://lastingchange.works/m/<code>`).

## Testuitslag (lokaal, Redis op 127.0.0.1, geen live data)
- `scripts/test-boeken-clickmind.mjs`: 31 van 31 ok. Onder meer: korte link op beide domeinen; klik geeft 302 naar dezelfde pagina; utm_source, utm_medium en utm_content blijven; elke klik een eigen mmc; bot telt als scan; onbekende code 404 zonder schrijven; Amazon als doel geweigerd; mail met lange code en met korte mailcode gaat naar de mail en telt daar; alleen vertoningen = geen meting; gemeten 0 blijft 0; boekpin met alleen vertoningen = onbekend, met gemeten 0 = 0; en de controle dat hetzelfde stuk met "kliks 0" wel mis zou krijgen (het oude risico).
- `scripts/test-paspoort.mjs`: 84 van 84 ok (de test van main, na rebase op main van 27 nov 14:30).

## Risico's en terug
- Pinterest en doorverwijzingen: een 302 op hetzelfde domein is gangbaar, maar Pinterest kan een link met redirect anders beoordelen. Daarom gaat de pinmotor pas over na een aparte ja, eerst met een paar pins.
- Pins worden sinds vandaag (main, geheugen stap 7) in het paspoort ingeladen met de Pinterest-cijfers. Gaf Pinterest voor een pin geen uitgaande kliks, dan telde dat tot nu toe als 0: dat is precies het risico dat hier dicht gaat.
- Bestaande paspoorten met kliks 0 die met de hand (op=stuk) zijn gemeld: als iemand daar expliciet `kliks: 0` meegaf terwijl het onbekend was, blijft dat 0. Alleen stukken zonder kliks-veld en posts zonder korte link zijn hersteld (bij de eerstvolgende paspoortronde, die de cijfers opnieuw inlaadt).
- Terug: één commit terugdraaien. Er is geen opgeslagen data die omgezet moet worden.

## Wat nog onbekend is
- Of Pinterest een pin met een korte link even goed verspreidt als met de directe link (alleen te meten na de tweede stap).
- Hoeveel van de 34 paspoorten van vandaag expliciet kliks 0 meekregen in plaats van niets.

## De vraag aan Henkjan
Mag deze branch (beide domeinen als doel voor korte links, botsvrije codes, onbekende kliks niet meer als 0) naar main? Er verandert niets wat een bezoeker ziet. De pinmotor omzetten naar korte links vraag ik daarna apart, met eerst een paar pins.
