import sys; sys.path.insert(0, '/home/claude/boek')
from omslag_gen import maak

maak(dict(
    map='/home/claude/boek/men', paginas=int(sys.argv[1]) if len(sys.argv) > 1 else 96, auteur='Elias Grant',
    kleur=dict(bg1='#34465E', bg2='#1F2B3A', bg3='#141B25', inkt='#FFFFFF', accent='#FFC23C',
               band='#FFC23C', bandinkt='#141B25', kaart='#FFFFFF', kaartinkt='#141B25'),
    label='800 TRUE FACTS',
    titel=[('WAIT,', 92, 0.70), ('THAT&#8217;S', 76, 1.98), ('TRUE<span class="acc">?!</span>', 76, 3.00),
           ('<span class="acc">FOR MEN</span>', 50, 4.02)],
    held=('1f92f', 4.50, 0.28, 1.38, 12),
    sub='800 Unusual Facts &amp; Rare Knowledge for Men Who Have Everything', sub_top=4.92, sub_pt=16.5, sub_breed=4.9,
    emoji=[('1f697', 0.30, 5.85, 1.0, -6), ('2708', 1.40, 5.75, 0.85, 10), ('1f37a', 2.40, 6.35, 0.78, -10),
           ('1f969', 3.30, 5.90, 0.82, 8), ('1f3b8', 4.25, 6.30, 0.92, -14), ('1f680', 5.05, 5.55, 0.82, 18),
           ('1f43b', 0.45, 6.85, 0.70, 0), ('1f3c6', 1.55, 6.80, 0.62, -8), ('2693', 3.15, 6.90, 0.55, 6),
           ('1f527', 5.15, 6.75, 0.55, -20), ('1f943', 2.60, 5.55, 0.48, 12)],
    band='FUNNY GIFT FOR DAD, HUSBAND OR GRANDPA', band_pt=13,
    rug='WAIT, THAT&#8217;S TRUE<span class="acc">?!</span> FOR MEN',
    kop='The man who has everything <span class="acc">doesn&#8217;t have this.</span>',
    blurb='Did you know Teddy Roosevelt gave a 90-minute speech with a bullet in his chest? That Buzz Aldrin fixed his Moon lander with a felt-tip pen? '
          '<b style="font-family:CarB;">800 true, surprising facts</b> about cars, planes, war, sports, space, money, BBQ, whiskey, '
          'wild animals, movies and rock and roll. The gift he will actually read, quote and pass around.',
    kaarten=[('#2', 'Bertha Benz took the first long car trip without telling her husband, and fixed a fuel line with her hatpin.', 3.36),
             ('#127', 'A bear named Wojtek served with the Polish army in World War II and was made a corporal.', 4.16),
             ('#248', 'Even without a single goal, Wayne Gretzky would still be the NHL&#8217;s all-time top scorer.', 4.96),
             ('#571', 'Bison injure more visitors to Yellowstone than bears do.', 5.76)],
    lijst=['800 fact-checked facts in 20 chapters', 'Bonus true-or-false quiz to challenge your buddies',
           'Short stories you can read in a minute', 'A great gift for Christmas, birthdays and Father&#8217;s Day'], lijst_top=6.42,
    emoji_achter=[('1f969', 0.55, 7.52, 0.5, -6), ('1f37a', 1.15, 7.50, 0.5, 8), ('1f697', 1.75, 7.55, 0.5, 0)],
))
