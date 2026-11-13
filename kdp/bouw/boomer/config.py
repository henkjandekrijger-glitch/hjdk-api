import os, random
D = os.path.dirname(os.path.abspath(__file__))

TEASERS = {
 "The Fabulous Fifties": "Poodle skirts, drive-ins and the birth of rock 'n' roll.",
 "The Swinging Sixties": "Moon shots, Beatlemania and a world that changed fast.",
 "The Groovy Seventies": "Disco, pet rocks and big hair. Can you dig it?",
 "The Totally Eighties": "Arcades, shoulder pads and the dawn of the home computer.",
 "TV Classics": "Pull up a chair in front of the console set.",
 "At the Movies": "Popcorn, double features and the stars who lit up the big screen.",
 "Music and Rock 'n' Roll": "Put a record on and test your ears.",
 "Sports Heroes": "Legends, records and unforgettable moments.",
 "Cars, Toys and Candy": "Tail fins, Slinkys and a pocket full of penny candy.",
 "Everyday Life Back Then": "Rotary phones, green stamps and the milkman at the door.",
 "Space, Science and Big News": "The headlines everyone remembers.",
 "Famous Faces": "The stars, legends and characters of a lifetime.",
}


def lees():
    h = []
    for blk in open(os.path.join(D, 'vragen.txt'), encoding='utf-8').read().split('## ')[1:]:
        r = [l.strip() for l in blk.split('\n') if l.strip()]
        items = []
        for regel in r[1:]:
            delen = [x.strip() for x in regel.split('|')]
            assert len(delen) == 5, regel
            vraag, goed, *fout = delen
            opties = [goed] + fout
            random.Random(vraag).shuffle(opties)
            items.append((vraag, opties, 'ABCD'[opties.index(goed)]))
        h.append((r[0], TEASERS[r[0]], items))
    assert len(h) == 12 and all(len(x[2]) == 30 for x in h), [len(x[2]) for x in h]
    return h


H = lees()

BOEK = dict(
    modus='quiz', label='QUESTIONS', groot=True, kort=16,
    kop='Back in Our Day', titel_meta='Back in Our Day',
    titel_regels=[('BACK IN', 40), ('OUR DAY', 40)],
    ondertitel='Large Print Trivia for Seniors: 360 Fun Quiz Questions from the 1950s, 60s, 70s and 80s',
    tagline='A Nostalgic Gift for Grandparents and Boomers', auteur='Elias Grant',
    copyright=[
        '<b>Back in Our Day</b> Large Print Trivia for Seniors: 360 Fun Quiz Questions from the 1950s, 60s, 70s and 80s',
        'Copyright © 2026 Elias Grant. All rights reserved.',
        'No part of this book may be reproduced, stored or shared in any form without written permission from the author, except for short quotations in reviews.',
        'Every question and answer was checked against reliable sources at the time of writing.',
        'Names of people, shows, films, songs and brands are used only to ask about them. They belong to their owners.',
        'Cover emoji artwork from Noto Emoji by Google, used under the Apache License 2.0.',
        'First edition, 2026. Large print edition.'],
    intro_kop='How to Play',
    intro=[
        'Remember when a phone hung on the kitchen wall, gas cost about 30 cents and the whole family gathered around one TV set? This book is a trip back to those days.',
        'Inside are 360 multiple-choice questions about the 1950s, 60s, 70s and 80s: TV shows, movies, music, sports, toys, candy, cars, everyday life and the big moments in the news.',
        'Each chapter has 30 questions. The answers are at the end of each chapter, so nobody has to flip to the back of the book.',
        '<b>Ways to play:</b><br/>'
        '•  On your own, with a cup of coffee.<br/>'
        '•  Out loud with your spouse, friends or grandchildren.<br/>'
        '•  As a game night: one person reads, everyone else guesses.<br/>'
        '•  Keep score and see who really remembers the good old days.',
        'Score yourself per chapter: 25 or more is a perfect memory, 18 to 24 is very sharp, and anything below that is a great excuse to tell a few stories.'],
    hoofdstukken=H,
    slot_kop='A Small Favor',
    slot=[
        'We hope this book brought back some happy memories.',
        'If you enjoyed it, would you leave a short review on Amazon? It helps other families find the book. Even one sentence makes a big difference.',
        'Tell us which question brought back the best memory. We read every review.',
        '<b>— Elias Grant</b>'],
    ook=[("Wait, That's True?!", '1,000 Weird, Funny & Mind-Blowing Facts Nobody Told You'),
         ("Wait, That's True?! For Men", '800 Unusual Facts & Rare Knowledge for Men Who Have Everything')],
)
