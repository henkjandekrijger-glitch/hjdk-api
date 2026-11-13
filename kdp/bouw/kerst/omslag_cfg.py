import sys; sys.path.insert(0, '/home/claude/boek')
from omslag_gen import maak

maak(dict(
    map='/home/claude/boek/kerst', paginas=int(sys.argv[1]) if len(sys.argv) > 1 else 62, auteur='Elias Grant',
    kleur=dict(bg1='#EF5350', bg2='#C62828', bg3='#8E1515', inkt='#FFFFFF', accent='#FFD54F',
               band='#1B7F3B', bandinkt='#FFFFFF', kaart='#FFFFFF', kaartinkt='#7A1010'),
    label='300 CHRISTMAS JOKES',
    titel=[('HO HO', 104, 0.78), ('<span class="acc">HA HA!</span>', 104, 2.18)],
    held=('1f923', 4.55, 3.62, 1.05, 12),
    sub='<span style="color:#FFD54F; font-size:20pt;">Christmas Joke Book for Kids</span><br/>'
        '<span style="font-size:14.5pt;">300 Silly Jokes, Riddles and Knock-Knock Jokes</span>',
    sub_top=3.78, sub_pt=16, sub_breed=4.05,
    emoji=[('1f385', 0.30, 5.32, 1.05, -6), ('1f384', 1.45, 5.52, 1.00, 0), ('26c4', 2.55, 5.32, 0.95, 8),
           ('1f98c', 3.60, 5.47, 1.00, -4), ('1f381', 4.70, 5.37, 0.95, 10), ('1f36a', 0.50, 6.62, 0.70, -10),
           ('1f427', 1.45, 6.72, 0.80, 6), ('1f9e6', 2.45, 6.62, 0.78, -12), ('1f514', 3.45, 6.72, 0.70, 14),
           ('2744', 4.45, 6.67, 0.65, 0), ('1f602', 5.20, 6.57, 0.62, -8)],
    band='A STOCKING STUFFER FOR BOYS AND GIRLS AGES 6 TO 12', band_pt=12.5,
    rug='HO HO <span class="acc">HA HA!</span> &#8226; CHRISTMAS JOKES FOR KIDS',
    kop='Warning: may cause <span class="acc">giggle fits!</span>',
    blurb='What do snowmen call their kids? Chill-dren! This book is packed with <b style="font-family:CarB;">300 clean, silly '
          'Christmas jokes</b>, riddles and knock-knock jokes about Santa, reindeer, elves, snowmen, presents, cookies and more. '
          'Perfect for reading out loud at breakfast, in the car or around the Christmas tree.',
    kaarten=[('Q', 'What do you call a reindeer with no eyes? <i>No eye deer!</i>', 2.85),
             ('Q', 'Why are Christmas trees bad at knitting? <i>They keep dropping their needles!</i>', 3.45),
             ('Q', 'What do snowmen eat for breakfast? <i>Frosted Flakes!</i>', 4.27)],
    lijst=['300 clean, kid-friendly jokes and riddles', 'Knock-knock jokes to share with friends',
           'Big, easy-to-read print', 'A great stocking stuffer for ages 6 to 12'], lijst_top=5.05,
    emoji_achter=[('1f385', 0.55, 6.40, 0.62, -6), ('26c4', 1.25, 6.40, 0.6, 8), ('1f381', 1.95, 6.45, 0.58, 0)],
))
