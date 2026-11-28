# Bouwt lib/koopkracht-tabel.js uit US Census-cijfers per ZIP (28 nov 2026, taak l9144w: "koopkracht per postcode ... als vaste tabel").
# Gebruik: python3 -I scripts/koopkracht-tabel-maak.py <simple_db.sqlite> [uit.js]
# Bron: de sqlite van het open-source project uszipcode (https://github.com/MacHu-GWU/uszipcode-project), tabel simple_zipcode met
# zipcode, population en median_household_income (US Census, bevolking rond 2010). Draai dit niet vanuit een map met onbekende bestanden.
# Emmers: bevolkingsgewogen vijfden binnen het land (elke ZIP telt met zijn inwoners), gesneden op de mediane huishoudinkomens.
# NL: de CBS-kerncijfers per PC4 hebben vanaf 2024 geen inkomen meer (alles -99995 in de gpkg van 2024), dus NL blijft leeg tot er een
# verifieerbare bron is; zet dan NL hier neer als 9000 tekens (index = pc4 - 1000, '0' onbekend, '1'..'5' emmer).
import sqlite3, sys, os

db = sys.argv[1]
uit = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib', 'koopkracht-tabel.js')
c = sqlite3.connect('file:' + db + '?mode=ro', uri=True)
rijen = [(str(z), int(p or 0), float(i)) for z, p, i in c.execute(
    "select zipcode, population, median_household_income from simple_zipcode where median_household_income is not null and median_household_income > 0")
    if str(z).isdigit() and len(str(z)) == 5]
rijen = [r for r in rijen if r[1] > 0]
rijen.sort(key=lambda r: r[2])
totaal = sum(r[1] for r in rijen)
grens, som, emmers = [], 0, {}
k = 1
for z, p, i in rijen:
    som += p
    # een ZIP hoort bij de emmer waarin zijn middelpunt (cumulatief aantal inwoners min de helft van zichzelf) valt
    mid = (som - p / 2) / totaal
    e = min(5, int(mid * 5) + 1)
    emmers[int(z)] = e
    if e != k:
        grens.append(i); k = e
tabel = ''.join(str(emmers.get(n, 0)) for n in range(100000))
assert len(tabel) == 100000
print('zips', len(rijen), 'inwoners', totaal, 'grenzen (mediaan huishoudinkomen)', grens)
print('per emmer', [sum(1 for e in emmers.values() if e == j) for j in range(1, 6)])

js = """// Koopkracht per postcode als vaste tabel (28 nov 2026, taak l9144w: "koopkracht per postcode (CBS pc4 voor NL, US Census per ZIP, als vaste tabel)").
// Gemaakt door scripts/koopkracht-tabel-maak.py; wordt alleen laat geladen (lib/omgeving.js), nooit in het klikpad.
// US: index = ZIP als getal, teken '0' onbekend, '1'..'5' = vijfde deel van de bevolking van laag naar hoog mediaan huishoudinkomen.
// NL: index = PC4 - 1000, zelfde tekens. Leeg: zie BRON.nl.
export const BRON = {
  us: { bron: 'US Census (median_household_income per ZIP, bevolking rond 2010), verpakt door het open-source project uszipcode (https://github.com/MacHu-GWU/uszipcode-project)', zips: %d, inwoners: %d, emmers: 'bevolkingsgewogen vijfden binnen de VS; grenzen mediaan huishoudinkomen in dollars: %s', jaar: 'census 2010-tijdperk, bedragen niet geindexeerd; het gaat om de rangorde, niet om het bedrag' },
  nl: { bron: 'CBS kerncijfers per postcode (PC4)', status: 'leeg: inkomen per PC4 is in de CBS-uitgave van 2024 niet meer gepubliceerd (-99995); geen verifieerbare kopie gevonden. Nooit schatten.' }
};
export const US = '%s';
export const NL = '';
""" % (len(rijen), totaal, ', '.join(str(int(g)) for g in grens), tabel)
open(uit, 'w').write(js)
print('geschreven', uit, len(js), 'tekens')
