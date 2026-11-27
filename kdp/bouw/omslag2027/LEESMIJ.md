# Omslagen 2027 (23 nov 2026)

Nieuwe omslagen voor de 10 boeken met een oud jaartal. Alleen code staat hier; bron- en tussenbeelden niet.

1. `npm i @fontsource/cinzel @fontsource/bebas-neue @fontsource/playfair-display @fontsource/allura @fontsource/oswald @fontsource/fredoka` in deze map.
2. Huidige Amazon-voorkanten naar `bron/<ASIN>.jpg` (m.media-amazon.com/images/I/<id>.jpg, id staat in lib/bs-data.js veld i; max 1000 px).
3. Foto-uitsneden 4x vergroten met OpenCV FSRCNN (`pip install "opencv-contrib-python-headless<5"`, model FSRCNN_x4.pb van github.com/Saafke/FSRCNN_Tensorflow): `crop/griddle4x.png` = bron/B0CHL3MH5Q.jpg crop (250,880,1000,1190); `crop/B0DPSS16X3_4x.jpg` en `crop/B0DR5Z8SLL_4x.jpg` = hele voorkant.
4. `python3 voor.py` (voorbeelden in voor/), `python3 wrap.py [ASIN ...]` (volledige omslag-PDF van 300 dpi in omslag/).
5. `python3 veilig.py [ASIN ...]` voor elke upload: alle tekst minstens 0,375 in van de snijrand, rugtekst 0,0625 in van de vouw (KDP keurde Mom's Word Search op 26 nov 2026 af op tekst te dicht bij de rand). Slaagt hij niet, dan niet uploaden.

Maten in wrap.py BOEK (kdp-id, trim, papier, pagina's) komen van de KDP Content-pagina; rug = pagina's x dikte per papiersoort. Barcodevlak rechtsonder op de achterkant blijft leeg (KDP zet de barcode).
