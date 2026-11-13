import sys; sys.path.insert(0, '/home/claude/boek')
from omslag_gen import maak

CFG = dict(
    map='/home/claude/boek/advent', paginas=int(sys.argv[1]) if len(sys.argv) > 1 else 80, auteur='Max Falk',
    kleur=dict(bg1='#B8232F', bg2='#8A1520', bg3='#560A12', inkt='#FFFFFF', accent='#FFD45C',
               band='#FFD45C', bandinkt='#560A12', kaart='#FFFFFF', kaartinkt='#3A0A0F', nr='#B8232F'),
    label='24 TÜRCHEN &#183; 480 FAKTEN',
    titel=[('ADVENTS-', 64, 0.80), ('KALENDER', 64, 1.66), ('<span class="acc">FÜR MÄNNER</span>', 44, 2.52)],
    held=('1f92f', 4.98, 1.66, 0.80, 12),
    sub='24 Tage kuriose Fakten, unglaubliche Geschichten und Angeberwissen', sub_top=3.40, sub_pt=17, sub_breed=5.0,
    emoji=[('1f384', 0.30, 5.05, 1.15, -6), ('1f381', 1.55, 5.55, 0.80, 10), ('1f37a', 2.45, 4.95, 0.80, -10),
           ('1f697', 3.35, 5.45, 0.85, 8), ('2744', 4.35, 4.85, 0.70, -14), ('1f680', 5.00, 5.50, 0.78, 18),
           ('1f43b', 0.45, 6.40, 0.70, 0), ('1f3c6', 1.45, 6.55, 0.62, -8), ('26c4', 2.40, 6.10, 0.78, 6),
           ('1f3b8', 3.45, 6.45, 0.70, -16), ('1f514', 4.40, 6.30, 0.62, 14), ('2b50', 5.20, 6.55, 0.50, 0)],
    band='DAS LUSTIGE GESCHENK FÜR PAPA, EHEMANN &amp; OPA', band_pt=12.5,
    rug='ADVENTSKALENDER FÜR MÄNNER',
    kop='Der Mann, der alles hat, <span class="acc">hat das noch nicht.</span>',
    blurb='Wusstest du, dass Bertha Benz 1888 die erste Fernfahrt der Autogeschichte machte und unterwegs eine Benzinleitung mit ihrer Hutnadel reparierte? '
          'Hinter <b style="font-family:CarB;">24 Türchen warten 480 wahre, verblüffende Fakten</b>: Autos, Fußball, Bier, Weltraum, Grillen, Rock, '
          'Made in Germany und die kuriosesten Weihnachtsbräuche. Jeden Tag ein Türchen, in fünf Minuten gelesen, und Stoff zum Angeben für das ganze Jahr.',
    kaarten=[('#206', 'Ein Bär namens Wojtek diente im Zweiten Weltkrieg in der polnischen Armee, als Korporal.', 3.30),
             ('#281', 'Haribo steht für HAns RIegel BOnn. Der Bonner erfand 1922 die Gummibärchen.', 4.00),
             ('#446', 'In Finnland richten sich Strafen für zu schnelles Fahren nach dem Einkommen: 121.000 Euro für einen Millionär.', 4.70),
             ('#464', 'Die ersten künstlichen Weihnachtsbäume kamen aus Deutschland, gemacht aus grün gefärbten Gänsefedern.', 5.40)],
    lijst=['24 Türchen mit je 20 verblüffenden Fakten', 'Bonus-Quiz für Heiligabend mit der ganzen Familie',
           'Jeden Tag in fünf Minuten gelesen', 'Perfekt als Wichtelgeschenk und für den Nikolausstiefel'], lijst_top=6.25,
    emoji_achter=[('1f384', 0.55, 7.55, 0.5, -6), ('1f37a', 1.15, 7.52, 0.5, 8), ('1f381', 1.75, 7.57, 0.5, 0)],
)

if __name__ == '__main__':
    maak(CFG)
