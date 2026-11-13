"""Bouwt het binnenwerk (6x9 inch, zonder bleed) van 'Wait, That's True?!'."""
import re, sys
from reportlab.lib.pagesizes import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
                                PageBreak, NextPageTemplate, Table, TableStyle, KeepTogether, Flowable)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

G = '/usr/share/fonts/truetype/google-fonts/'
C = '/usr/share/fonts/truetype/crosextra/'
for naam, pad in [('PopB', G+'Poppins-Bold.ttf'), ('PopM', G+'Poppins-Medium.ttf'), ('PopR', G+'Poppins-Regular.ttf'),
                  ('PopL', G+'Poppins-Light.ttf'), ('Car', C+'Carlito-Regular.ttf'), ('CarB', C+'Carlito-Bold.ttf'),
                  ('CarI', C+'Carlito-Italic.ttf')]:
    pdfmetrics.registerFont(TTFont(naam, pad))
from reportlab.pdfbase.pdfmetrics import registerFontFamily
registerFontFamily('Car', normal='Car', bold='CarB', italic='CarI', boldItalic='CarB')
registerFontFamily('CarI', normal='CarI', bold='CarB', italic='CarI', boldItalic='CarB')

W, H = 6*inch, 9*inch
IN, OUT, TOP, BOT = 0.7*inch, 0.5*inch, 0.72*inch, 0.7*inch
DONKER, GRIJS, LICHT = HexColor('#1a1a1a'), HexColor('#6b6b6b'), HexColor('#c8c8c8')
TITEL = "Wait, That\u2019s True?!"
AUTEUR = "Elias Grant"

TEASERS = {
 "Your Body Is Weird": "You live in it every day. You have no idea what it gets up to.",
 "Animal Oddities": "Meet the creatures that make humans look boring.",
 "Under the Sea": "Most of our planet is water, and most of that water is a mystery.",
 "Space Is Strange": "Look up tonight. It gets weirder the farther you go.",
 "Food Facts": "You will never look at your dinner the same way again.",
 "History's Strangest Moments": "The past was far stranger than any history class let on.",
 "Science That Sounds Fake": "It sounds made up. It is not.",
 "Words & Language": "The stories hiding inside the words you use every day.",
 "Inventions & Happy Accidents": "Some of the best ideas in history started as mistakes.",
 "Money": "Strange stories about the stuff everyone wants.",
 "Sports & Games": "Wins, losses and the weirdest records in play.",
 "Wild Planet Earth": "Our home planet is wilder than you think.",
 "Bugs & Creepy Crawlies": "Tiny, everywhere and utterly bizarre.",
 "Your Brain & Mind": "The strangest object in the universe is reading this sentence.",
 "Tech & the Internet": "The surprising backstory of the screens in your life.",
 "Around the World": "Odd places, strange rules and customs from every corner of the globe.",
 "Plants & Fungi": "They cannot run away, but they have some very clever tricks.",
 "Dinosaurs & Ancient Life": "Earth\u2019s early residents were stranger than the movies.",
 "Numbers & Records": "Big numbers, odd math and records you will want to share.",
 "Christmas & Holidays": "Festive facts to bring out at your next holiday dinner.",
}

QUIZ = [  # (stelling, waar?, zoekwoord in het feit)
 ("The Great Wall of China can be seen from the Moon with the naked eye.", False, "cannot be seen from the Moon"),
 ("Bananas are berries.", True, "Bananas are berries"),
 ("Lightning never strikes the same place twice.", False, "Lightning does strike the same place twice"),
 ("An octopus has three hearts.", True, "three hearts and blue blood"),
 ("Humans only use about 10 percent of their brains.", False, "only use 10 percent"),
 ("Vikings wore horned helmets into battle.", False, "horned helmets"),
 ("A day on Venus is longer than a year on Venus.", True, "One day on Venus"),
 ("Napoleon was unusually short.", False, "Napoleon was not unusually short"),
 ("Honey can stay edible for thousands of years.", True, "Honey never spoils"),
 ("Your tongue has separate zones for sweet and bitter.", False, "tongue map"),
 ("Hippos are strong swimmers.", False, "Hippos cannot swim"),
 ("Wombats make cube-shaped poop.", True, "cube-shaped poop"),
 ("Coca-Cola invented Santa\u2019s red suit.", False, "Coca-Cola did not invent"),
 ("If you cut an earthworm in half, you get two worms.", False, "Cutting an earthworm in half"),
 ("Sharks have been around longer than trees.", True, "longer than trees"),
 ("Old windows are thicker at the bottom because glass slowly flows.", False, "Glass is not a slow-moving liquid"),
 ("The fax machine was invented before the telephone.", True, "fax machine"),
 ("Peanuts are nuts.", False, "Peanuts are not nuts"),
 ("Spider silk is stronger than steel of the same weight.", True, "Spider silk is stronger"),
 ("Most people swallow several spiders a year in their sleep.", False, "swallow several spiders"),
 ("Earth\u2019s spin decides which way your sink drains.", False, "which way your sink"),
 ("The real Velociraptor was about the size of a turkey.", True, "size of a turkey"),
 ("You can only balance an egg on its end during the equinox.", False, "balance an egg"),
 ("Mount Everest is the tallest mountain from base to peak.", False, "Mauna Kea"),
 ("Polar bears have black skin under their fur.", True, "Polar bears have black skin"),
 ("Some early humans lived alongside T. rex.", False, "never lived at the same time"),
 ("A tomato is a fruit.", True, "Tomatoes are fruits"),
 ("The Moon is slowly drifting away from Earth.", True, "moving away from Earth"),
 ("Both male and female mosquitoes bite.", False, "Only female mosquitoes bite"),
 ("The Monopoly man wears a monocle.", False, "monocle"),
]


def mooi(t):
    """Typografische aanhalingstekens en escapes voor Paragraph."""
    t = t.replace('&', '&amp;')
    t = re.sub(r'(^|[\s(])"', '\\1\u201c', t)
    t = t.replace('"', '\u201d')
    t = t.replace("'", '\u2019')
    return t


def lees():
    hoofdstukken = []
    for f in ['feiten1.txt', 'feiten2.txt', 'feiten3.txt', 'feiten4.txt']:
        for blk in open(f, encoding='utf-8').read().split('## ')[1:]:
            regels = [l.strip() for l in blk.split('\n') if l.strip()]
            hoofdstukken.append((regels[0], regels[1:]))
    assert len(hoofdstukken) == 20 and all(len(f) == 50 for _, f in hoofdstukken)
    return hoofdstukken


st_fact = ParagraphStyle('f', fontName='Car', fontSize=12.2, leading=16.4, textColor=DONKER)
st_num = ParagraphStyle('n', fontName='PopB', fontSize=10.5, leading=16.4, textColor=DONKER, alignment=TA_RIGHT)
st_hlabel = ParagraphStyle('hl', fontName='PopM', fontSize=8.5, leading=11, textColor=GRIJS, alignment=TA_LEFT)
st_htitel = ParagraphStyle('ht', fontName='PopB', fontSize=25, leading=29, textColor=DONKER)
st_teaser = ParagraphStyle('te', fontName='CarI', fontSize=12, leading=15.5, textColor=GRIJS)
st_body = ParagraphStyle('b', fontName='Car', fontSize=11.5, leading=16, textColor=DONKER, spaceAfter=9)
st_klein = ParagraphStyle('k', fontName='Car', fontSize=9.5, leading=13, textColor=DONKER, spaceAfter=7)
st_kop = ParagraphStyle('kop', fontName='PopB', fontSize=20, leading=25, textColor=DONKER, spaceAfter=14)


class Lijn(Flowable):
    def __init__(self, breedte, dikte=3, kleur=DONKER, ruimte=10):
        super().__init__(); self.b, self.d, self.k, self.r = breedte, dikte, kleur, ruimte
    def wrap(self, aw, ah):
        return aw, self.d + self.r
    def draw(self):
        self.canv.setFillColor(self.k); self.canv.rect(0, self.r/2, self.b, self.d, stroke=0, fill=1)


class Markeer(Flowable):
    """Onzichtbaar; noteert op welke pagina een hoofdstuk begint."""
    def __init__(self, sleutel):
        super().__init__(); self.sleutel = sleutel
    def wrap(self, aw, ah):
        return 0, 0
    def draw(self):
        self.canv._doctemplate_ref.paginas[self.sleutel] = self.canv.getPageNumber()


class Doc(BaseDocTemplate):
    def __init__(self, pad, **kw):
        super().__init__(pad, pagesize=(W, H), leftMargin=0, rightMargin=0, topMargin=0, bottomMargin=0,
                         title=TITEL, author=AUTEUR, **kw)
        self.paginas = {}
        self.huidig_hoofdstuk = ''
        fw = W - IN - OUT
        fh = H - TOP - BOT
        rechts = Frame(IN, BOT, fw, fh, id='r', leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        links = Frame(OUT, BOT, fw, fh, id='l', leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates([
            PageTemplate('kaal_r', [rechts], onPage=self.kaal),
            PageTemplate('kaal_l', [links], onPage=self.kaal),
            PageTemplate('tekst_r', [rechts], onPage=self.kaal, onPageEnd=self.kop_voet),
            PageTemplate('tekst_l', [links], onPage=self.kaal, onPageEnd=self.kop_voet),
        ])
        self.modus = 'kaal'

    def handle_pageBegin(self):
        n = self.page + 1
        naam = self.modus + ('_r' if n % 2 else '_l')
        self.pageTemplate = [t for t in self.pageTemplates if t.id == naam][0]
        super().handle_pageBegin()

    def handle_documentBegin(self):
        super().handle_documentBegin()
        self.canv._doctemplate_ref = self

    def kaal(self, canv, doc):
        canv._doctemplate_ref = self

    def kop_voet(self, canv, doc):
        canv._doctemplate_ref = self
        n = canv.getPageNumber()
        recto = n % 2 == 1
        canv.saveState()
        canv.setFont('PopM', 8)
        canv.setFillColor(GRIJS)
        y = H - 0.45*inch
        if self.paginas.get('_start_' + str(n)):
            pass  # hoofdstukbegin: geen kopregel
        else:
            if recto:
                canv.drawRightString(W - OUT, y, (self.huidig_hoofdstuk or '').upper())
            else:
                canv.drawString(OUT, y, TITEL.upper())
            canv.setStrokeColor(LICHT); canv.setLineWidth(0.5)
            x0 = IN if recto else OUT
            canv.line(x0, y - 6, x0 + W - IN - OUT, y - 6)
        canv.setFont('PopM', 9); canv.setFillColor(DONKER)
        if recto:
            canv.drawRightString(W - OUT, 0.42*inch, str(n))
        else:
            canv.drawString(OUT, 0.42*inch, str(n))
        canv.restoreState()


class Modus(Flowable):
    def __init__(self, m):
        super().__init__(); self.m = m
    def wrap(self, aw, ah):
        return 0, 0
    def draw(self):
        self.canv._doctemplate_ref.modus = self.m


class ZetHoofdstuk(Flowable):
    def __init__(self, naam):
        super().__init__(); self.naam = naam
    def wrap(self, aw, ah):
        return 0, 0
    def draw(self):
        d = self.canv._doctemplate_ref
        d.huidig_hoofdstuk = self.naam.replace("'", '\u2019')
        d.paginas['_start_' + str(self.canv.getPageNumber())] = True


def feit_blok(nr, tekst, fw):
    t = Table([[Paragraph(str(nr), st_num), Paragraph(mooi(tekst), st_fact)]],
              colWidths=[38, fw - 38 - 4], hAlign='LEFT')
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (0, 0), 0), ('RIGHTPADDING', (0, 0), (0, 0), 8),
        ('LEFTPADDING', (1, 0), (1, 0), 0), ('RIGHTPADDING', (1, 0), (1, 0), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 10.5),
    ]))
    return t


def verhaal(hoofdstukken, toc_paginas):
    fw = W - IN - OUT
    s = []
    # p1 titelpagina
    s.append(Spacer(1, 1.6*inch))
    s.append(Paragraph('WAIT,', ParagraphStyle('t1', fontName='PopB', fontSize=44, leading=48, textColor=DONKER, alignment=TA_CENTER)))
    s.append(Paragraph('THAT\u2019S TRUE?!', ParagraphStyle('t2', fontName='PopB', fontSize=34, leading=40, textColor=DONKER, alignment=TA_CENTER)))
    s.append(Spacer(1, 18))
    s.append(Paragraph('1,000 Weird, Funny &amp; Mind-Blowing Facts Nobody Told You',
                       ParagraphStyle('t3', fontName='PopM', fontSize=13, leading=18, textColor=DONKER, alignment=TA_CENTER)))
    s.append(Spacer(1, 8))
    s.append(Paragraph('Trivia Gift Book for Teens and Adults',
                       ParagraphStyle('t4', fontName='CarI', fontSize=12.5, leading=16, textColor=GRIJS, alignment=TA_CENTER)))
    s.append(Spacer(1, 2.2*inch))
    s.append(Paragraph(AUTEUR.upper(), ParagraphStyle('t5', fontName='PopM', fontSize=12, leading=16, textColor=DONKER, alignment=TA_CENTER)))
    s.append(PageBreak())
    # p2 copyright
    s.append(Spacer(1, 4.4*inch))
    for t in [
        f'<b>{mooi(TITEL)}</b> 1,000 Weird, Funny &amp; Mind-Blowing Facts Nobody Told You',
        'Copyright \u00a9 2026 Elias Grant. All rights reserved.',
        'No part of this book may be reproduced, stored or shared in any form without written permission from the author, '
        'except for short quotations in reviews.',
        'Every fact in this book was checked against reliable sources at the time of writing. Records get broken and science '
        'moves on, so a few numbers may have changed by the time you read this. Where experts still disagree, we say so.',
        'Brand names mentioned in this book belong to their owners and are used only to tell true stories about them.',
        'Cover emoji artwork from Noto Emoji by Google, used under the Apache License 2.0.',
        'First edition, 2026.',
    ]:
        s.append(Paragraph(t, st_klein))
    s.append(PageBreak())
    # p3 intro
    s.append(Spacer(1, 0.3*inch))
    s.append(Paragraph('Before You Start', st_kop))
    for t in [
        'This book has one job: to make you stop, blink and say <b>\u201cWait, that\u2019s true?!\u201d</b> about a thousand times.',
        'Inside are 1,000 real facts about your body, animals, space, food, history, money, language, the internet and much more. '
        'Every one of them is true. Some of them are so strange that you will want to check, and you should. That is half the fun.',
        'There is no right way to read it. Go cover to cover, open a random page, or jump straight to the chapter that grabs you. '
        'Every fact stands on its own, so it works in two minutes or two hours.',
        '<b>A few ways to use it:</b>',
        '\u2022  Read one fact out loud at dinner and watch the table go quiet.<br/>'
        '\u2022  Quiz your friends: true or false?<br/>'
        '\u2022  Win the next car ride, sleepover or office coffee break.<br/>'
        '\u2022  Keep it in the bathroom. Nobody will ever leave on time again.',
        'Ready? Fact number one is waiting.',
    ]:
        s.append(Paragraph(t, st_body))
    s.append(PageBreak())
    # p4 inhoud
    s.append(Spacer(1, 0.3*inch))
    s.append(Paragraph('Contents', st_kop))
    rijen = []
    for i, (naam, _) in enumerate(hoofdstukken, 1):
        rijen.append([Paragraph(f'{i:02d}', ParagraphStyle('ci', fontName='PopB', fontSize=10, leading=14, textColor=GRIJS)),
                      Paragraph(mooi(naam), ParagraphStyle('cn', fontName='PopM', fontSize=11, leading=14, textColor=DONKER)),
                      Paragraph(str(toc_paginas.get(naam, '')), ParagraphStyle('cp', fontName='PopM', fontSize=11, leading=14, textColor=DONKER, alignment=TA_RIGHT))])
    rijen.append([Paragraph('', st_klein), Paragraph('Bonus: True or False? Quiz', ParagraphStyle('cn3', fontName='PopM', fontSize=11, leading=14, textColor=DONKER)),
                  Paragraph(str(toc_paginas.get('_quiz', '')), ParagraphStyle('cp3', fontName='PopM', fontSize=11, leading=14, textColor=DONKER, alignment=TA_RIGHT))])
    rijen.append([Paragraph('', st_klein), Paragraph('A Small Favor', ParagraphStyle('cn2', fontName='PopM', fontSize=11, leading=14, textColor=DONKER)),
                  Paragraph(str(toc_paginas.get('_gunst', '')), ParagraphStyle('cp2', fontName='PopM', fontSize=11, leading=14, textColor=DONKER, alignment=TA_RIGHT))])
    tt = Table(rijen, colWidths=[28, fw - 28 - 36, 36])
    tt.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('LEFTPADDING', (0, 0), (-1, -1), 0),
                            ('RIGHTPADDING', (0, 0), (-1, -1), 0), ('TOPPADDING', (0, 0), (-1, -1), 3.2),
                            ('BOTTOMPADDING', (0, 0), (-1, -1), 3.2),
                            ('LINEBELOW', (0, 0), (-1, -2), 0.4, LICHT)]))
    s.append(tt)
    s.append(Modus('tekst'))
    # hoofdstukken
    nr = 0
    for i, (naam, feiten) in enumerate(hoofdstukken, 1):
        s.append(PageBreak())
        s.append(ZetHoofdstuk(naam))
        s.append(Markeer(naam))
        s.append(Spacer(1, 0.05*inch))
        s.append(Paragraph(f'CHAPTER {i:02d}  \u2022  FACTS {nr+1}\u2013{nr+50}', st_hlabel))
        s.append(Spacer(1, 4))
        s.append(Paragraph(mooi(naam), st_htitel))
        s.append(Spacer(1, 4))
        s.append(Paragraph(mooi(TEASERS[naam]), st_teaser))
        s.append(Spacer(1, 6))
        s.append(Lijn(46, 3.5, DONKER, 14))
        for f in feiten:
            nr += 1
            s.append(feit_blok(nr, f, fw))
    # bonusquiz
    alle = [f for _, fs in hoofdstukken for f in fs]
    s.append(PageBreak())
    s.append(ZetHoofdstuk('Bonus Quiz'))
    s.append(Markeer('_quiz'))
    s.append(Spacer(1, 0.05*inch))
    s.append(Paragraph('BONUS', st_hlabel))
    s.append(Spacer(1, 4))
    s.append(Paragraph('True or False?', st_htitel))
    s.append(Spacer(1, 4))
    s.append(Paragraph('Thirty quick ones to test yourself or your friends. Circle T or F, then check the answers.', st_teaser))
    s.append(Spacer(1, 6))
    s.append(Lijn(46, 3.5, DONKER, 14))
    st_q = ParagraphStyle('q', parent=st_fact)
    st_tf = ParagraphStyle('tf', fontName='PopM', fontSize=10, leading=16.4, textColor=GRIJS, alignment=TA_RIGHT)
    for i, (q, _, _) in enumerate(QUIZ, 1):
        t = Table([[Paragraph(str(i), st_num), Paragraph(mooi(q), st_q), Paragraph('T&nbsp;&nbsp;&nbsp;F', st_tf)]],
                  colWidths=[38, fw - 38 - 52, 52], hAlign='LEFT')
        t.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'),
                               ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (0, 0), 9),
                               ('RIGHTPADDING', (1, 0), (-1, -1), 0), ('TOPPADDING', (0, 0), (-1, -1), 0),
                               ('BOTTOMPADDING', (0, 0), (-1, -1), 10.5)]))
        s.append(t)
    s.append(PageBreak())
    s.append(Spacer(1, 0.05*inch))
    s.append(Paragraph('Answers', st_kop))
    st_a = ParagraphStyle('a', fontName='Car', fontSize=11.5, leading=15, textColor=DONKER)
    cellen = []
    for i, (q, waar, zoek) in enumerate(QUIZ, 1):
        treffers = [n for n, f in enumerate(alle, 1) if zoek.lower() in f.lower()]
        assert len(treffers) == 1, (zoek, treffers)
        oordeel = 'TRUE' if waar else 'FALSE'
        cellen.append(Paragraph(f'<b>{i}. {oordeel}</b> \u2014 see fact {treffers[0]}', st_a))
    rijen_a = [[cellen[r], cellen[r + 15]] for r in range(15)]
    ta = Table(rijen_a, colWidths=[fw / 2, fw / 2], hAlign='LEFT')
    ta.setStyle(TableStyle([('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                            ('TOPPADDING', (0, 0), (-1, -1), 2.5), ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5)]))
    s.append(ta)
    s.append(Spacer(1, 10))
    s.append(Paragraph('<b>Your score:</b> 25 or more: walking encyclopedia. 15 to 24: seriously sharp. Under 15: perfect excuse to read the book again.', st_body))
    # slot
    s.append(PageBreak())
    s.append(ZetHoofdstuk('A Small Favor'))
    s.append(Markeer('_gunst'))
    s.append(Spacer(1, 0.3*inch))
    s.append(Paragraph('A Small Favor', st_kop))
    for t in [
        'You made it through all 1,000 facts. (Or you skipped to the end. We will not tell anyone.)',
        'If this book made you laugh, gasp or win an argument, would you leave a short review on Amazon? '
        'It takes less than a minute, and it helps other curious people find the book. Even one sentence makes a real difference.',
        'Which fact surprised you most? Mention it in your review. We read every one.',
        'Thank you for reading, and keep asking \u201cWait, is that true?\u201d',
        '<b>\u2014 Elias Grant</b>',
    ]:
        s.append(Paragraph(t, st_body))
    s.append(Spacer(1, 0.35*inch))
    s.append(Lijn(46, 3.5, DONKER, 14))
    s.append(Paragraph('Also by Elias Grant', ParagraphStyle('ab', fontName='PopB', fontSize=14, leading=19, textColor=DONKER, spaceAfter=8)))
    for t in ['<b>Stocking Stuffers for Teens</b><br/>The Weirdest, Smartest, Most Hilarious 408 Facts You Will Ever Hear',
              '<b>Stocking Stuffers for Adults</b><br/>Mind-Blowing Facts You Won\u2019t Believe (But Totally Should)']:
        s.append(Paragraph(t, st_body))
    if LEGE_SLOT:
        s.append(Modus('kaal'))
        s.append(PageBreak())
        s.append(Spacer(1, 1))  # lege slotpagina: even aantal pagina's
    return s


LEGE_SLOT = False


def bouw(pad, toc):
    d = Doc(pad)
    d.build(verhaal(lees(), toc))
    return d


if __name__ == '__main__':
    uit = sys.argv[1] if len(sys.argv) > 1 else 'binnenwerk.pdf'
    d1 = bouw(uit, {})
    toc = {k: v for k, v in d1.paginas.items() if not k.startswith('_start_')}
    d2 = bouw(uit, toc)
    toc2 = {k: v for k, v in d2.paginas.items() if not k.startswith('_start_')}
    assert toc == toc2, (toc, toc2)
    if d2.page % 2:
        LEGE_SLOT = True
        d3 = bouw(uit, toc2)
        print('lege slotpagina toegevoegd', d3.page)
    print('ok', toc2)
