import os
D = os.path.dirname(os.path.abspath(__file__))

TEASERS = {
 "Cars & Engines": "Horsepower, hatpins and the stories behind the machines.",
 "Planes & Pilots": "The daredevils, the jets and the tricks that keep you in the air.",
 "Ships & the Sea": "Pirates, warships and the giants that carry the world's cargo.",
 "Military History": "Bears, pigeons, inflatable tanks and other true war stories.",
 "Explorers & Adventurers": "The men who went first, and somehow came back.",
 "Toughest Men in History": "If you think you had a rough week, read this chapter.",
 "Sports Legends": "Records, rivalries and the stories behind the greatest athletes.",
 "Space & Astronauts": "Felt-tip pens, moon dust and life 400 kilometers up.",
 "Engineering Marvels": "The biggest, longest and boldest things humans ever built.",
 "Inventors & Big Ideas": "The garages, sheds and lucky breaks behind the things you use.",
 "Money & Business": "Fortunes made, fortunes missed and deals that changed everything.",
 "Food, BBQ & Meat": "Smoke, steak and the science of a great cookout.",
 "Beer, Coffee & Whiskey": "Raise a glass to the stories in your mug.",
 "Survival & the Great Outdoors": "What really works out there, and the myths that don't.",
 "Wild Animals": "Meet the toughest creatures on the planet.",
 "Movies & TV Behind the Scenes": "What really happened when the cameras were rolling.",
 "Rock & Roll": "Guitars, legends and the stories behind the music.",
 "The Male Body": "The owner's manual nobody gave you.",
 "Odd Laws, Rules & Records": "Strange rules, longest games and laws that are actually real.",
 "Gadgets & Tools": "The hidden stories inside your toolbox and junk drawer.",
}


def lees():
    h = []
    for f in ['feiten1.txt', 'feiten2.txt']:
        for blk in open(os.path.join(D, f), encoding='utf-8').read().split('## ')[1:]:
            r = [l.strip() for l in blk.split('\n') if l.strip()]
            h.append((r[0], TEASERS[r[0]], r[1:]))
    extra = {}
    for blk in open(os.path.join(D, 'feiten3.txt'), encoding='utf-8').read().split('## ')[1:]:
        r = [l.strip() for l in blk.split('\n') if l.strip()]
        extra[r[0]] = r[1:]
    h = [(n, t, items + extra[n]) for n, t, items in h]
    assert len(h) == 20 and all(len(x[2]) == 40 for x in h), [len(x[2]) for x in h]
    alle = [f for x in h for f in x[2]]
    assert len(set(alle)) == len(alle)
    return h


BOEK = dict(
    modus='facts', label='FACTS', schaal=1.07, kop='Wait, That’s True?! For Men', titel_meta='Wait, That’s True?! For Men',
    titel_regels=[('WAIT,', 44), ("THAT'S TRUE?!", 34), ('FOR MEN', 26)],
    ondertitel='800 Unusual Facts & Rare Knowledge for Men Who Have Everything',
    tagline='Funny Gift for Dad, Husband or Grandpa', auteur='Elias Grant',
    copyright=[
        '<b>Wait, That’s True?! For Men</b> 800 Unusual Facts &amp; Rare Knowledge for Men Who Have Everything',
        'Copyright © 2026 Elias Grant. All rights reserved.',
        'No part of this book may be reproduced, stored or shared in any form without written permission from the author, except for short quotations in reviews.',
        'Every fact in this book was checked against reliable sources at the time of writing. Records get broken and science moves on, so a few numbers may have changed by the time you read this. Where a story is a legend or a theory, we say so.',
        'Brand names mentioned in this book belong to their owners and are used only to tell true stories about them.',
        'Cover emoji artwork from Noto Emoji by Google, used under the Apache License 2.0.',
        'First edition, 2026.'],
    intro_kop='Before You Start',
    intro=[
        'This book is for the man who already has everything, except the perfect story to tell at the barbecue.',
        'Inside are 800 true facts about cars, planes, ships, war, sports, space, money, food, beer, whiskey, wild animals, movies, rock and roll and more. '
        'Short enough to read in a minute. Strange enough that you will want to tell someone right away.',
        'No chapter depends on another. Open it anywhere: in the garage, on the couch, by the grill or in the bathroom. Every fact stands on its own.',
        '<b>A few ways to use it:</b>',
        '•  Win the next argument at the bar or the dinner table.<br/>'
        '•  Read one out loud on a long drive.<br/>'
        '•  Test your buddies with the True or False quiz at the back.<br/>'
        '•  Keep it where you have five quiet minutes. You know where.',
        'Fair warning: you will say <b>“Wait, that’s true?!”</b> more than once.'],
    hoofdstukken=lees(),
    tf_quiz=[
        ("Bertha Benz took the first long-distance car trip without telling her husband.", True, "without telling her husband"),
        ("An airplane's black box is painted black.", False, "bright orange"),
        ("Searing a steak seals in the juices.", False, "does not seal in the juices"),
        ("Bourbon must be made in Kentucky.", False, "does not have to come from Kentucky"),
        ("George Washington had wooden false teeth.", False, "never wood"),
        ("Moss always grows on the north side of trees.", False, "Moss does not reliably"),
        ("A camel's hump stores water.", False, "stores fat, not water"),
        ("Elvis toured all over Europe.", False, "never performed a concert outside North America"),
        ("Cracking your knuckles causes arthritis.", False, "Cracking your knuckles does not"),
        ("Michael Jordan was cut from his high school team.", False, "was not cut"),
        ("Guinness is really a very dark red.", True, "very dark ruby red"),
        ("Tigers have striped skin, not just striped fur.", True, "striped skin"),
        ("Lamborghini started out making tractors.", True, "started out making tractors"),
        ("Wearing a hat causes baldness.", False, "Wearing a hat does not"),
        ("Running away is the best way to escape a bear.", False, "Running from a bear"),
        ("The D in D-Day stands for doom.", False, "simply stands for day"),
        ("Peugeot still makes pepper grinders.", True, "pepper grinders"),
        ("Pirates often made prisoners walk the plank.", False, "walk the plank"),
        ("Most of Oktoberfest takes place in September.", True, "most of Oktoberfest"),
        ("Johnny Cash served a long prison sentence.", False, "never served a prison sentence"),
        ("A crocodile's jaw-opening muscles are extremely strong.", False, "jaw-opening muscles"),
        ("Quicksand can swallow a grown man whole.", False, "Quicksand cannot"),
        ("Columbus proved the Earth was round.", False, "Columbus did not prove"),
        ("An espresso has more caffeine than a mug of drip coffee.", False, "less caffeine than a regular mug"),
        ("Nike paid $35 for its swoosh logo.", True, "paid $35"),
        ("Bison injure more Yellowstone visitors than bears do.", True, "Bison injure"),
        ("The Spruce Goose was built mostly of spruce.", False, "built mostly of birch"),
        ("Starbucks is named after a character in Moby-Dick.", True, "Moby-Dick"),
        ("Bull sharks can live in fresh water.", True, "Bull sharks can live in fresh water"),
        ("Einstein called compound interest the eighth wonder of the world.", False, "eighth wonder"),
    ],
    slot_kop='A Small Favor',
    slot=[
        'You made it through all 800 facts. (Or you skipped straight to the end. Your secret is safe.)',
        'If this book gave you a few good stories, would you leave a short review on Amazon? It takes less than a minute and helps other people find the book. Even one sentence makes a real difference.',
        'Which fact surprised you most? Mention it in your review. We read every one.',
        '<b>— Elias Grant</b>'],
    ook=[("Wait, That's True?!", '1,000 Weird, Funny & Mind-Blowing Facts Nobody Told You'),
         ('Stocking Stuffers for Teens', 'The Weirdest, Smartest, Most Hilarious 408 Facts You Will Ever Hear'),
         ('Stocking Stuffers for Adults', 'Mind-Blowing Facts You Won’t Believe (But Totally Should)')],
)
