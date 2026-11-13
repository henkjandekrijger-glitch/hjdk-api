import sys; sys.path.insert(0, '/home/claude/boek')
from omslag_gen import maak

CFG = dict(
    map='/home/claude/boek/wissen', paginas=int(sys.argv[1]) if len(sys.argv) > 1 else 80, auteur='Max Falk',
    kleur=dict(bg1='#34465E', bg2='#1F2B3A', bg3='#141B25', inkt='#FFFFFF', accent='#FFC23C',
               band='#FFC23C', bandinkt='#141B25', kaart='#FFFFFF', kaartinkt='#141B25', nr='#34465E'),
    label='400 WAHRE FAKTEN',
    titel=[('MOMENT', 68, 0.80), ('MAL, DAS', 68, 1.68), ('STIMMT<span class="acc">?!</span>', 68, 2.56),
           ('<span class="acc">FÜR MÄNNER</span>', 44, 3.56)],
    held=('1f92f', 4.55, 3.30, 1.15, 12),
    sub='400 verblüffende Fakten und kurioses Wissen für Männer, die schon alles haben', sub_top=4.42, sub_pt=16.5, sub_breed=5.0,
    emoji=[('1f697', 0.30, 5.85, 1.0, -6), ('2708', 1.40, 5.75, 0.85, 10), ('1f37a', 2.40, 6.35, 0.78, -10),
           ('1f969', 3.30, 5.90, 0.82, 8), ('1f3b8', 4.25, 6.30, 0.92, -14), ('1f680', 5.05, 5.55, 0.82, 18),
           ('1f43b', 0.45, 6.85, 0.70, 0), ('1f3c6', 1.55, 6.80, 0.62, -8), ('2693', 3.15, 6.90, 0.55, 6),
           ('1f527', 5.15, 6.75, 0.55, -20), ('1f943', 2.60, 5.55, 0.48, 12)],
    band='DAS LUSTIGE GESCHENK FÜR PAPA, EHEMANN &amp; OPA', band_pt=12.5,
    rug='MOMENT MAL, DAS STIMMT<span class="acc">?!</span> FÜR MÄNNER',
    kop='Der Mann, der alles hat, <span class="acc">kennt das noch nicht.</span>',
    blurb='Wusstest du, dass der kürzeste Krieg der Geschichte nur etwa 40 Minuten dauerte? Dass Pizza Hut schon eine Pizza ins All geliefert hat? '
          '<b style="font-family:CarB;">400 wahre, verblüffende Fakten in 20 Kapiteln</b>: Autos, Flugzeuge, Weltraum, Geld, Grillen, Bier und Whisky, '
          'wilde Tiere, Filme und Rock. Das Geschenk, das er wirklich liest, zitiert und herumreicht.',
    kaarten=[('#9', 'Rund zwei Drittel aller jemals gebauten Rolls-Royce fahren laut Hersteller noch heute.', 3.36),
             ('#218', 'Toyota begann als Hersteller von Webstühlen.', 4.13),
             ('#287', 'Bisons verletzen im Yellowstone mehr Besucher als Bären.', 4.72),
             ('#315', 'Das Blut in der berühmten Duschszene von Psycho war Schokoladensirup.', 5.31)],
    lijst=['400 geprüfte Fakten in 20 Kapiteln', 'Bonus-Quiz: Wahr oder falsch? Für den Stammtisch',
           'Große, gut lesbare Schrift', 'Perfekt zu Weihnachten, zum Geburtstag und zum Vatertag'], lijst_top=6.16,
    emoji_achter=[('1f969', 0.55, 7.55, 0.5, -6), ('1f37a', 1.15, 7.52, 0.5, 8), ('1f697', 1.75, 7.57, 0.5, 0)],
)

if __name__ == '__main__':
    maak(CFG)
