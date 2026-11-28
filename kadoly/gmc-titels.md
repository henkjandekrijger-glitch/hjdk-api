# Kadoly gratis vermeldingen: titels met de zoekterm voorop

Henkjan, 28 nov 2026: "Optimaliseer GMC gratis zodat meer verkeer ." en "Kijk ook naar demandradar en zoek woorden uit de longtail waar we mee kunnen scoren ?"

Code `lib/gmctitel.js`, titels in `data/kadoly-gmc-titels.json`, zoekwoorden in `data/kadoly-zoekwoorden.json`, test `node scripts/test-gmctitel.mjs`.
De aanvullende bron Kadoly titels (Merchant Center 5876502305, bron 10802261974, eerst in de regel) haalt elke nacht `https://keuzehulp.best/api/shop/gmctitels.csv` op.

## Proef

- Arm b (vaste helft op het product-id, `arm(id)`) krijgt een nieuwe titel, arm a houdt de winkeltitel en is de controle.
- Start 29 nov met 152 producten (op voorraad, geen variant, marge minstens EUR 5). Oordeel 13 dec op `/api/shop?op=gmctitels&vorm=stand`: gratis vertoningen en kliks per 100 producten, b tegen a.
- Raak (b minstens 20% meer): alle producten krijgen zo'n titel, ook arm a. Mis: titels uit de bron, les in de overdracht.

## Uitbreiden (elke dag hoogstens 100 titels, tot de proef klaar is)

1. Lijst: `/api/shop?op=gmctitels&vorm=lijst&n=2000&marge=-1000` (beschermde host). Neem rijen met `arm: "b"` en `heeft: false`, de hoogste marge eerst.
2. Zet de ids van rijen met `arm: "a"` uit dezelfde lijst bij `controle` (zelfde keuze, zodat de vergelijking eerlijk blijft).
3. Schrijf per product één titel, regels:
   - Begin met het woord waarop mensen zoeken, in de vorm uit `data/kadoly-zoekwoorden.json` (bijvoorbeeld `Oorbellen goud verguld`, `Zilveren ketting`, `Parelketting`, `Oplaadbare lamp`, `Bloempot binnen`, `Plantenbak buiten`, `Bijzettafel`, `Wasmand`, `Rieten mand`, `Dienblad hout`, `Lantaarn`).
   - Daarna de feiten uit de titel van de winkel: materiaal, kleur, maat, aantal, modelnaam. Merk aan het eind, behalve Kadoly.
   - Alleen wat in de titel, het merk of de soort staat. Verguld wordt `goud verguld`, goudkleurig blijft `goudkleurig` (nooit `gouden` als het geen goud is), sterling zilver wordt `zilveren ... sterling zilver`.
   - Geen sfeerwoorden (`voor gezellige avonden`, `tijdloos design`, `elegant`), geen prijs, geen `gratis`, `korting`, `actie`, `beste` of `nu`, geen gedachtestreepje, hoogstens 150 tekens; de eerste 70 tellen het zwaarst.
   - `dames` of `heren` alleen als de winkeltitel het zegt (unisex wordt `heren en dames`).
4. `node scripts/test-gmctitel.mjs` moet slagen, dan één commit en één push.
5. Werklog `wie=kadoly-gmc-titels`: hoeveel titels erbij, hoeveel in de bron (`x-titels` op de .csv).

## Kansen zonder product (voor de inkoop, niet voor titels)

Demand Radar NL+BE per maand, 28 nov 2026, waar de winkel nog niets voor heeft: hanglamp eettafel 24.100, horloge heren 32.500 en dames 17.700, tulpenvaas 10.490, aroma diffuser 8.500, wasmand 3 vakken 7.320, boeket kunstbloemen 7.190, sierkussens voor op de bank 5.400.
