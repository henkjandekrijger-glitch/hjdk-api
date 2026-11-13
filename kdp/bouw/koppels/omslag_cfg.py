import sys; sys.path.insert(0, '/home/claude/boek')
from omslag_gen import maak

maak(dict(
    map='/home/claude/boek/koppels', paginas=int(sys.argv[1]) if len(sys.argv) > 1 else 58, auteur='Elias Grant',
    kleur=dict(bg1='#FF8FB1', bg2='#EC4D79', bg3='#B3174F', inkt='#FFFFFF', accent='#FFE082',
               band='#4A0E33', bandinkt='#FFFFFF', kaart='#FFFFFF', kaartinkt='#6A1037', nr='#EC4D79'),
    label='300 QUESTIONS FOR TWO',
    titel=[('CHOOSE', 88, 0.75), ('WISELY,', 88, 1.95), ('<span class="acc">DARLING</span>', 70, 3.13)],
    held=('1f914', 4.98, 3.10, 0.90, 10),
    sub='<span style="color:#FFE082; font-size:19pt;">300 Would You Rather Questions for Couples</span><br/>'
        '<span style="font-size:14.5pt;">Funny, Romantic and Thought-Provoking Date Night Game</span>',
    sub_top=4.22, sub_pt=15, sub_breed=5.1,
    emoji=[('2764', 0.35, 5.60, 0.90, -8), ('1f970', 1.40, 5.50, 0.95, 4), ('1f377', 2.50, 5.65, 0.85, -6),
           ('1f339', 3.50, 5.55, 0.90, 14), ('1f3b2', 4.60, 5.60, 0.80, -10), ('1f37f', 0.60, 6.65, 0.75, 6),
           ('1f495', 1.65, 6.70, 0.70, -8), ('1f60d', 2.65, 6.65, 0.75, 0), ('1f498', 3.70, 6.70, 0.72, 10),
           ('1f491', 4.65, 6.60, 0.78, 0)],
    band='A FUN VALENTINE&#8217;S DAY GIFT FOR HIM OR HER', band_pt=13,
    rug='CHOOSE WISELY, <span class="acc">DARLING</span>',
    kop='One question. <span class="acc">Two answers.</span> Endless fun.',
    blurb='Would you rather read each other&#8217;s minds or never have a secret again? <b style="font-family:CarB;">300 funny, '
          'romantic and thought-provoking questions</b> for date nights, road trips and cozy evenings at home. Laugh, debate, '
          'and discover things about each other you never knew.',
    kaarten=[('?', 'Would you rather slow dance in the kitchen or dance at a big party?', 2.90),
             ('?', 'Would you rather share your fries or never order fries again?', 3.72),
             ('?', 'Would you rather fight one horse-sized duck or ten duck-sized horses?', 4.54)],
    lijst=['300 questions in 12 fun chapters', 'From silly to sweet to deep talk',
           'Space to mark both of your answers', 'Great for Valentine&#8217;s Day, anniversaries and date nights'], lijst_top=5.50,
    emoji_achter=[('2764', 0.55, 6.85, 0.55, -6), ('1f377', 1.20, 6.85, 0.55, 8), ('1f3b2', 1.85, 6.90, 0.5, 0)],
))
