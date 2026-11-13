import sys; sys.path.insert(0, '/home/claude/boek')
from omslag_gen import maak

maak(dict(
    map='/home/claude/boek/boomer', paginas=int(sys.argv[1]) if len(sys.argv) > 1 else 114, auteur='Elias Grant',
    kleur=dict(bg1='#FFF0CC', bg2='#FBD38A', bg3='#F2B256', inkt='#2B1A0E', accent='#B8400E',
               band='#1F6F6B', bandinkt='#FFF5E0', kaart='#FFFDF6', kaartinkt='#2B1A0E'),
    label='LARGE PRINT &#8226; 360 QUESTIONS',
    titel=[('BACK IN', 82, 0.78), ('<span class="acc">OUR DAY</span>', 82, 1.98)],
    held=('1f4fa', 4.40, 3.05, 1.30, 6),
    sub='<span style="color:#B8400E; font-size:21pt;">Large Print Trivia for Seniors</span><br/>'
        '<span style="font-size:15.5pt;">360 Fun Quiz Questions from the 1950s, 60s, 70s and 80s</span>',
    sub_top=3.20, sub_pt=16, sub_breed=3.85,
    emoji=[('1f4fb', 0.30, 5.35, 0.95, -8), ('1f697', 1.35, 5.55, 0.95, 4), ('1f4bf', 2.45, 5.30, 0.80, 0),
           ('1f680', 3.40, 5.45, 0.85, 16), ('1f3ac', 4.40, 5.30, 0.85, -6), ('1f4de', 0.55, 6.50, 0.75, 10),
           ('1f57a', 1.60, 6.55, 0.85, 0), ('1f3b5', 2.70, 6.45, 0.62, -12), ('1f4f7', 3.55, 6.55, 0.75, 6),
           ('1f9e9', 4.60, 6.45, 0.72, -10)],
    band='A NOSTALGIC GIFT FOR GRANDPARENTS AND BOOMERS', band_pt=12.5,
    rug='BACK IN <span class="acc">OUR DAY</span> &#8226; LARGE PRINT TRIVIA',
    kop='Remember <span class="acc">when?</span>',
    blurb='Rotary phones, drive-in movies, Elvis on Ed Sullivan and the night we landed on the Moon. '
          '<b style="font-family:CarB;">360 fun multiple-choice questions</b> about the TV shows, movies, music, sports, toys, '
          'candy, cars and big news of the 1950s, 60s, 70s and 80s. Play alone with your morning coffee, or read them out loud '
          'and see who really remembers the good old days.',
    kaarten=[('Q', 'Which toy was invented after an engineer watched a spring tumble off a shelf?', 2.95),
             ('Q', 'How many castaways were stranded on Gilligan&#8217;s Island?', 3.73),
             ('Q', 'Which department store&#8217;s Christmas catalog was nicknamed the Wish Book?', 4.33)],
    lijst=['360 questions in 12 nostalgic chapters', 'Large 16-point print, easy on the eyes',
           'Answers at the end of every chapter', 'Perfect for game nights with family and friends'], lijst_top=5.30,
    emoji_achter=[('1f4fa', 0.55, 6.75, 0.6, -6), ('1f3b5', 1.25, 6.80, 0.5, 8), ('1f697', 1.85, 6.80, 0.55, 0)],
))
