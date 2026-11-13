import os
D = os.path.dirname(os.path.abspath(__file__))
TEASERS = {
 "Warm-Up Laughs": "Silly questions to get the giggles going.",
 "Date Night": "Plan your next night out, one question at a time.",
 "Food Fights": "Settle the big debates about what's for dinner.",
 "Travel and Adventure": "Where in the world would you go together?",
 "Home Sweet Home": "Big houses, small houses and who does the dishes.",
 "Sweet and Romantic": "The questions that make you blush a little.",
 "Couple Superpowers": "If you two had magic powers, what would you choose?",
 "Money and Dreams": "Big dreams, small budgets and everything in between.",
 "Embarrassing Moments": "Brace yourself. These ones are awkward.",
 "Movie Night and Fun": "Popcorn, games and silly showdowns.",
 "Deep Talk": "Slow down and really get to know each other.",
 "Our Future Together": "Dream out loud about the years ahead.",
}
def lees():
    h = []
    for blk in open(os.path.join(D, 'vragen.txt'), encoding='utf-8').read().split('## ')[1:]:
        r = [l.strip() for l in blk.split('\n') if l.strip()]
        h.append((r[0], TEASERS[r[0]], r[1:]))
    assert len(h) == 12 and sum(len(x[2]) for x in h) == 300
    return h
BOEK = dict(
    modus='wyr', label='QUESTIONS', schaal=1.2,
    antwoordregel='ME&nbsp;&nbsp;<font name="DV">☐</font> first&nbsp;&nbsp;<font name="DV">☐</font> second&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;YOU&nbsp;&nbsp;<font name="DV">☐</font> first&nbsp;&nbsp;<font name="DV">☐</font> second',
    kop='Choose Wisely, Darling', titel_meta='Choose Wisely, Darling',
    titel_regels=[('CHOOSE', 44), ('WISELY,', 44), ('DARLING', 36)],
    ondertitel='300 Would You Rather Questions for Couples',
    tagline='Funny, Romantic and Thought-Provoking Date Night Game', auteur='Elias Grant',
    copyright=[
        '<b>Choose Wisely, Darling</b> 300 Would You Rather Questions for Couples',
        'Copyright © 2026 Elias Grant. All rights reserved.',
        'No part of this book may be reproduced, stored or shared in any form without written permission from the author, except for short quotations in reviews.',
        'Brand and place names are used only to ask fun questions. They belong to their owners.',
        'Cover emoji artwork from Noto Emoji by Google, used under the Apache License 2.0.',
        'First edition, 2026.'],
    intro_kop='How to Play',
    intro=[
        'Two people. One question. No wrong answers, but plenty of surprising ones.',
        'Take turns reading a question out loud. Both of you pick an answer, then explain why. The explaining is where the fun starts: you will laugh, argue a little and learn things about each other you never knew.',
        '<b>Ways to play:</b><br/>'
        '•  On a date night with no phones allowed.<br/>'
        '•  On a road trip, one chapter per hour.<br/>'
        '•  Guess first what your partner will pick, then score a point for every right guess.<br/>'
        '•  Save the Deep Talk chapter for a quiet evening.',
        'Ready? Choose wisely, darling.'],
    hoofdstukken=lees(),
    slot_kop='A Small Favor',
    slot=[
        'We hope these questions gave you lots of laughs and a few new things to love about each other.',
        'If you enjoyed this book, would you leave a short review on Amazon? It helps other couples find it.',
        'Which question started the best conversation? Tell us in your review.',
        '<b>— Elias Grant</b>'],
    ook=[("Wait, That's True?!", '1,000 Weird, Funny & Mind-Blowing Facts Nobody Told You'),
         ("Wait, That's True?! For Men", '800 Unusual Facts & Rare Knowledge for Men Who Have Everything')],
)
