import os
D = os.path.dirname(os.path.abspath(__file__))

TEASERS = {
 "Santa Says Ho Ho Ho": "Jokes about the big guy in the red suit.",
 "Reindeer Giggles": "Nine reindeer, ninety reasons to laugh.",
 "Elf Yourself": "Small helpers, big laughs.",
 "Snowman Snickers": "Cool jokes for frosty friends.",
 "Christmas Tree Trouble": "Pine-tastic puns for the whole family.",
 "Presents and Wrapping": "Jokes you can unwrap again and again.",
 "Cookies, Treats and Candy Canes": "Sweet, crunchy and a little bit silly.",
 "Winter Animal Antics": "Penguins, polar bears and other chilly comedians.",
 "Knock-Knock, Who's There?": "Grab a friend. One knocks, one answers.",
 "Snow Day Silliness": "No school today, just jokes!",
 "Riddles for Clever Kids": "Think hard before you peek at the answer.",
 "Christmas Dinner and Family Fun": "Read these out loud at the table.",
}


def lees():
    h = []
    for blk in open(os.path.join(D, 'moppen.txt'), encoding='utf-8').read().split('## ')[1:]:
        r = [l.strip() for l in blk.split('\n') if l.strip()]
        items = [tuple(x.strip() for x in l.split('|')) for l in r[1:]]
        h.append((r[0], TEASERS[r[0]], items))
    assert len(h) == 12 and sum(len(x[2]) for x in h) == 300
    return h


BOEK = dict(
    modus='jokes', label='JOKES', schaal=1.45,
    kop='Ho Ho Ha Ha!', titel_meta='Ho Ho Ha Ha! Christmas Joke Book for Kids',
    titel_regels=[('HO HO', 48), ('HA HA!', 48)],
    ondertitel='Christmas Joke Book for Kids: 300 Silly Jokes, Riddles and Knock-Knock Jokes',
    tagline='A Stocking Stuffer for Boys and Girls Ages 6 to 12', auteur='Elias Grant',
    copyright=[
        '<b>Ho Ho Ha Ha!</b> Christmas Joke Book for Kids: 300 Silly Jokes, Riddles and Knock-Knock Jokes',
        'Copyright © 2026 Elias Grant. All rights reserved.',
        'No part of this book may be reproduced, stored or shared in any form without written permission from the author, except for short quotations in reviews.',
        'Cover emoji artwork from Noto Emoji by Google, used under the Apache License 2.0.',
        'First edition, 2026.'],
    intro_kop='How to Use This Book',
    intro=[
        'This book is full of 300 Christmas jokes, riddles and knock-knock jokes. They are clean, silly and perfect for sharing.',
        'Every joke has the question in <b>bold</b> and the answer right underneath. Cover the answer with your hand, read the question out loud and let someone guess.',
        '<b>Fun ways to play:</b><br/>'
        '•  Tell one joke at breakfast every day in December.<br/>'
        '•  Have a joke-off: whoever makes the other person laugh first wins.<br/>'
        '•  Read the knock-knock jokes with a friend. One knocks, one answers.<br/>'
        '•  Try the riddles on grown-ups. They are harder than they look!',
        'Ready? Santa is waiting on the next page.'],
    hoofdstukken=lees(),
    slot_kop='Your Turn!',
    slot=[
        'Now it is your turn to be the comedian. Write your very own Christmas joke here:',
        'My joke: ' + '_' * 24,
        '_' * 30,
        'The answer: ' + '_' * 21,
        'Tell it to your family at Christmas dinner and see who laughs the loudest!',
        '<b>A note for grown-ups:</b> if this book made your family laugh, a short review on Amazon helps other families find it. Thank you!',
        '<b>— Elias Grant</b>'],
    ook=[("Wait, That's True?!", '1,000 Weird, Funny & Mind-Blowing Facts Nobody Told You'),
         ('Stocking Stuffers for Teens', 'The Weirdest, Smartest, Most Hilarious 408 Facts You Will Ever Hear')],
)
