import sys; sys.path.insert(0, '/home/claude/boek')
from omslag_gen import maak

CFG = dict(
    map='/home/claude/boek/teens_de', paginas=int(sys.argv[1]) if len(sys.argv) > 1 else 72, auteur='Elias Grant',
    kleur=dict(bg1='#2A2A2A', bg2='#1A1A1A', bg3='#0E0E0E', inkt='#FFFFFF', accent='#FFD23F',
               band='#FFD23F', bandinkt='#111111', kaart='#FFFFFF', kaartinkt='#111111', nr='#111111'),
    label='DAS GESCHENK FÜR TEENS',
    titel=[('ECHT', 92, 0.80), ('JETZT<span class="acc">?!</span>', 92, 2.02),
           ('<span class="acc">400 FAKTEN</span>', 48, 3.32)],
    held=('1f92f', 4.45, 0.95, 1.15, 10),
    sub='Verrückt, klug und urkomisch: Wissen, mit dem du jeden überraschst', sub_top=4.30, sub_pt=16.5, sub_breed=5.0,
    emoji=[('1f988', 0.30, 5.85, 1.0, -6), ('1f9e0', 1.40, 5.75, 0.85, 10), ('1f602', 2.40, 6.35, 0.78, -10),
           ('1f680', 3.30, 5.90, 0.82, 8), ('1f996', 4.25, 6.30, 0.92, -14), ('26a1', 5.05, 5.55, 0.82, 18),
           ('1f3c8', 0.45, 6.85, 0.70, 0), ('1f3c6', 1.55, 6.80, 0.62, -8), ('1fa90', 3.15, 6.90, 0.55, 6),
           ('1f419', 5.15, 6.75, 0.55, -20), ('1f9e9', 2.60, 5.55, 0.48, 12)],
    band='DAS PERFEKTE GESCHENK FÜR JUNGS &amp; MÄDCHEN AB 12', band_pt=12,
    rug='',  # geen rugtekst: bij 80 p. keurde KDP dat af (Moment mal, 16 nov)
    kop='Das Buch, das sie <span class="acc">wirklich lesen.</span>',
    blurb='Wusstest du, dass Haie älter sind als Bäume? Dass ein Tag auf der Venus länger dauert als ein Jahr? '
          '<b style="font-family:CarB;">400 wahre, verrückte Fakten in 20 Kapiteln</b>: Sport, Geschichte, Tiere, der menschliche Körper, '
          'Weltall, Games und Filme. Kurze Fakten, die man sofort weitererzählen will.',
    kaarten=[('#113', 'Wikinger trugen keine Helme mit Hörnern.', 3.36),
             ('#185', 'Seeotter halten sich beim Schlafen an den Pfoten.', 4.13),
             ('#244', 'Du kannst dich nicht selbst kitzeln.', 4.72),
             ('#333', 'Auf dem Mars ist der Sonnenuntergang blau.', 5.31)],
    lijst=['400 geprüfte Fakten in 20 Kapiteln', 'Bonus-Quiz: Wahr oder falsch?',
           'Große, gut lesbare Schrift', 'Perfekt zu Weihnachten, Nikolaus und zum Geburtstag'], lijst_top=6.16,
    emoji_achter=[('1f988', 0.55, 7.55, 0.5, -6), ('1f602', 1.15, 7.52, 0.5, 8), ('1f9e0', 1.75, 7.57, 0.5, 0)],
)

if __name__ == '__main__':
    maak(CFG)

# Hardcover (case laminate, 6x9, 80 p.): maten uit de KDP-cover-calculator, gelijk aan de Adventskalender (80 p.). Controleer bij upload.
HARD = dict(spine=0.369, w=13.944, h=10.417)
if __name__ == '__main__' and 'hard' in sys.argv:
    maak(CFG, hard=HARD)
