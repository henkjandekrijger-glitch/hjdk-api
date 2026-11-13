import sys; sys.path.insert(0, '/home/claude/boek')
from omslag_gen import maak

# Hardcover van Stocking Stuffers For Teens (B0DJQLBM75), 5,5 x 8,5 inch, 147 pagina's wit papier.
# Maten volgens de KDP-formule voor case laminate: breedte = 2 x 0,591 + 2 x 5,5 + 2 x 0,197 + rug, hoogte 9,918.
HARD = dict(spine=0.5223, w=13.0983, h=9.918)

CFG = dict(
    map='/home/claude/boek/teens', paginas=147, auteur='Elias Grant', trim_h=8.5, trim_w=5.5, achter_breed=4.6, rug_pt=10,
    kleur=dict(bg1='#2A2A2A', bg2='#141414', bg3='#000000', inkt='#FFFFFF', accent='#FFD23C',
               band='#FFD23C', bandinkt='#111111', kaart='#FFFFFF', kaartinkt='#111111', nr='#111111'),
    label='STOCKING STUFFERS FOR TEENS',
    titel=[('THE WEIRDEST,', 34, 0.80), ('SMARTEST, MOST', 34, 1.30), ('HILARIOUS', 34, 1.80),
           ('<span class="acc">408 FACTS</span>', 58, 2.70)],
    held=('1f92f', 3.50, 1.86, 0.84, 12),
    sub='You Will Ever Hear: Blow Minds, Break the Ice, and Become the Funniest Person in the Room', sub_top=3.70, sub_pt=15, sub_breed=4.6,
    emoji=[('1f988', 0.30, 5.00, 0.95, -8), ('1f9e0', 1.35, 4.95, 0.80, 8), ('1f602', 2.30, 5.40, 0.78, -10),
           ('1f680', 3.25, 4.90, 0.85, 14), ('1f996', 4.25, 5.30, 0.90, -6), ('1f3c8', 0.55, 6.05, 0.62, 18),
           ('1f9e9', 1.55, 6.10, 0.60, -8), ('1fa90', 2.55, 6.25, 0.62, 6), ('26a1', 3.50, 6.05, 0.55, -12),
           ('1f419', 4.45, 6.25, 0.62, 10)],
    band='THE PERFECT STOCKING STUFFER FOR TEENS', band_pt=12,
    rug='STOCKING STUFFERS FOR TEENS <span class="acc">&#183; 408 FACTS</span>',
    kop='The stocking stuffer <span class="acc">they will actually read.</span>',
    blurb='Did you know sharks have been around longer than trees? That sloths move so slowly that algae grows on their fur? '
          '<b style="font-family:CarB;">408 weird, smart and hilarious facts</b> about animals, sports, the human body, space, history and more. '
          'Blow minds, break the ice and become the funniest person in the room.',
    kaarten=[('WILD', 'Sea otters hold hands while sleeping so they don&#8217;t drift apart in the water.', 3.25),
             ('MIND', 'Your brain can store about 2.5 petabytes, roughly a million gigabytes.', 3.95),
             ('PLAY', 'Dodgeball is played as a professional sport, with leagues across the world.', 4.65)],
    lijst=['408 mind-blowing facts in short, punchy boxes', 'Great for ages 12 and up',
           'Perfect for road trips, sleepovers and the bathroom', 'A fun gift for Christmas, birthdays and Easter'], lijst_top=5.55,
    emoji_achter=[('1f988', 0.55, 6.85, 0.5, -6), ('1f602', 1.15, 6.82, 0.5, 8), ('1f9e0', 1.75, 6.87, 0.5, 0)],
)

if __name__ == '__main__':
    maak(CFG, hard=HARD)
