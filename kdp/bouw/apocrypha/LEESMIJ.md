# The Definitive Apocrypha, compact binnenwerk (23 nov 2026)

Doel: VS-versie rendabel. Oud: 8,5 x 11, 396 pagina's, druk $7,73, royalty $0,66 bij $13,99. Nieuw: 147 pagina's, druk $3,50, bij $14,99 $5,49 royalty (KDP-pagina 23 nov). Marge: kop en paginanummer minstens 0,55 in van de rand (KDP eist 0,375).

1. Bron: Google Doc "Definitive Apocrypha" in Henkjans Drive (id 1vH4wJiCM_AXnBtidE8iR2y8fxx6w5eL8padKHnafKTM), export als docx naar `definitive_bron.docx`.
2. Lettertype EB Garamond (OFL) van github.com/google/fonts (ofl/ebgaramond), statische gewichten 400/600/700 en italic 400 via fontTools instancer in `fonts/`.
3. `pip install weasyprint` en `python3 bouw.py` maakt `binnenwerk.pdf` (8,625 x 11,25 in met bleed, twee kolommen 10,5 pt, verzen doorlopend per hoofdstuk, lopende kop, inhoud met paginanummers, review-QR naar whichtobuy.best/r/apo).
4. Omslag: `kdp/bouw/omslag2027/wrap.py B0DDBTXC9J` (pagina's 148, rug 0,3333 in).
