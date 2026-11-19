"""Bouwt het binnenwerk van Lasting Change Workbook 2027. Gebruik: python3 bouw.py <uit.pdf> [--tot <pagina>]"""
import sys
from reportlab.pdfgen import canvas
from reportlab.lib.colors import black, white
import motor as M
from motor import W, H, BOVEN, ONDER, GRIJS, MIDDEN, LIJN, LICHT, VLAK, SCHRIJF, label, label_rechts, tekst, wrap, breedte, teken, teken_vol, schrijflijn, hokje
import inhoud as I

CHECKIN_H = 138
GRENS_R = ONDER + CHECKIN_H + 12
GRENS_L = ONDER + 40


def paginanummer(c, nr):
    c.setFont('Lora', 8.5)
    c.setFillColor(GRIJS)
    c.drawCentredString(W / 2, 26, str(nr))
    c.setFillColor(black)


def vinkje(c, x, y, z=9):
    c.setLineWidth(1.6)
    p = c.beginPath()
    p.moveTo(x + 1.5, y + z * 0.5)
    p.lineTo(x + z * 0.42, y + 1.5)
    p.lineTo(x + z + 2, y + z + 2)
    c.drawPath(p, stroke=1, fill=0)
    c.setLineWidth(0.8)


def checkin(c, links, n, voorbeeld=False):
    x0, x1 = M.marges(links)
    w = x1 - x0
    yT = ONDER + CHECKIN_H
    c.setLineWidth(1.4)
    c.line(x0, yT, x1, yT)
    label(c, 'Daily check-in', x0, yT - 13, kleur=black, s=7.5)
    label_rechts(c, f'Day {n}', x1, yT - 13, kleur=black, s=7.5)
    y = yT - 33
    hokje(c, x0, y - 1.5, 10, 1.1)
    c.setFont('LoraSB', 10)
    c.drawString(x0 + 16, y, 'I did my tiny habit today')
    mx = x0 + w * 0.64
    c.setFont('Lora', 10)
    c.drawString(mx, y, 'Minutes:')
    schrijflijn(c, mx + breedte('Minutes:', 'Lora', 10) + 5, y - 2, x1)
    y2 = yT - 56
    c.setFont('Lora', 10)
    c.drawString(x0, y2, 'How it felt:')
    bx = x0 + breedte('How it felt:', 'Lora', 10) + 14
    for i in range(5):
        c.setLineWidth(0.8)
        c.circle(bx + i * 19, y2 + 3.5, 7.2, stroke=1, fill=0)
        c.setFont('PopM', 7.5)
        c.drawCentredString(bx + i * 19, y2 + 0.8, str(i + 1))
    c.setFont('LoraI', 7.5)
    c.setFillColor(GRIJS)
    c.drawString(bx - 7, y2 - 11, 'ugh')
    c.drawRightString(bx + 4 * 19 + 7, y2 - 11, 'easy')
    c.setFillColor(black)
    hokje(c, mx, y2 - 1.5, 10, 1.1)
    c.setFont('Lora', 10)
    c.drawString(mx + 16, y2, 'Texted my buddy')
    # streak: 2 rijen van 15
    vak = w / 15
    ys = yT - 80
    for i in range(30):
        r, k = divmod(i, 15)
        bx2 = x0 + k * vak
        by = ys - r * (vak - 1)
        vandaag = (i + 1 == n)
        c.setStrokeColor(black if vandaag else LIJN)
        c.setLineWidth(1.6 if vandaag else 0.7)
        if voorbeeld and i + 1 < n:
            c.setFillColor(MIDDEN)
            c.rect(bx2 + 1.2, by - vak + 3, vak - 2.4, vak - 2.4, stroke=0, fill=1)
            c.setFillColor(black)
        c.rect(bx2 + 1.2, by - vak + 3, vak - 2.4, vak - 2.4, stroke=1, fill=0)
        c.setFont('PopB' if vandaag else 'PopL', 6.5)
        c.setFillColor(black if vandaag else GRIJS)
        c.drawCentredString(bx2 + vak / 2, by - vak / 2 + 0.5, str(i + 1))
        c.setFillColor(black)
    c.setStrokeColor(black)
    yt = ys - 2 * (vak - 1) - 18
    c.setFont('Lora', 10)
    c.drawString(x0, yt, 'Tomorrow, one tiny tweak:')
    schrijflijn(c, x0 + breedte('Tomorrow, one tiny tweak:', 'Lora', 10) + 5, yt - 2, x1)
    if voorbeeld:
        vinkje(c, x0, y - 1.5, 10)
        vinkje(c, mx, y2 - 1.5, 10)
        c.setFont('LoraI', 11)
        c.setFillColor(GRIJS)
        c.drawString(mx + breedte('Minutes:', 'Lora', 10) + 12, y + 1, '2')
        c.drawString(x0 + breedte('Tomorrow, one tiny tweak:', 'Lora', 10) + 10, yt + 1, 'shoes by the door tonight')
        c.setFillColor(black)
        c.setLineWidth(1.3)
        c.circle(bx + 3 * 19, y2 + 3.5, 9.5, stroke=1, fill=0)
    return yT


def kop_rechts(c, tekstje):
    x0, x1 = M.marges(False)
    label_rechts(c, tekstje, x1, H - BOVEN)


def kop_links(c, tekstje):
    x0, x1 = M.marges(True)
    label(c, tekstje, x0, H - BOVEN)


def grap_onder(c, links, t):
    x0, x1 = M.marges(links)
    regels = wrap(t, 'LoraI', 10.5, x1 - x0)
    y = ONDER + 4 + (len(regels) - 1) * 13.5
    c.setLineWidth(1.2)
    c.line(x0, y + 16, x0 + 26, y + 16)
    tekst(c, t, x0, y, x1 - x0, f='LoraI', s=10.5, lead=13.5)


def dagkop(c, links, week, n, titel, kop):
    x0, x1 = M.marges(links)
    w = x1 - x0
    label(c, f'Week {week["n"]}  /  {week["naam"]}', x0, H - BOVEN)
    y = H - BOVEN - 34
    c.setFont('PopB', 30)
    c.drawString(x0, y, f'DAY {n}')
    dx = x0 + breedte(f'DAY {n}', 'PopB', 30) + 10
    c.setFillColor(GRIJS)
    c.setFont('PopM', 11)
    c.drawString(dx, y + 1, titel.upper())
    c.setFillColor(black)
    y -= 24
    c.setFont('PopM', 13)
    for r in wrap(kop, 'PopM', 13, w):
        c.drawString(x0, y, r)
        y -= 17
    return y - 8


def week_van(n):
    return I.WEKEN[(n - 1) // 7] if n <= 28 else I.WEKEN[3]


# ------------------------------------------------------------------ dagspread

def dag_links(c, d, nr):
    x0, x1 = M.marges(True)
    w = x1 - x0
    week = week_van(d['n'])
    y = dagkop(c, True, week, d['n'], d['titel'], d['kop'])
    y = M.w_balk(c, x0, y, w, "Today's 3-minute move")
    y = tekst(c, d['zet'], x0, y, w, f='Lora', s=11.2, lead=15.2) - 7
    c.setFont('PopB', 9.5)
    c.drawString(x0, y, 'Why it works')
    y -= 13.5
    y = tekst(c, d['waarom'], x0, y, w, f='Lora', s=10.2, lead=13.8)
    if d.get('bron'):
        y = tekst(c, 'Research: ' + d['bron'], x0, y - 1, w, f='LoraI', s=8, lead=10, kleur=GRIJS)
    y -= 10
    teken_vol(c, x0, y, w, d['links'], GRENS_L + 8, f'dag {d["n"]} links', notities=None)
    grap_onder(c, True, d['grap'])
    paginanummer(c, nr)


def dag_rechts(c, d, nr):
    x0, x1 = M.marges(False)
    kop_rechts(c, f'Day {d["n"]}  /  {d["titel"]}')
    y = H - BOVEN - 30
    teken_vol(c, x0, y, x1 - x0, d['rechts'], GRENS_R, f'dag {d["n"]} rechts', notities=True)
    checkin(c, False, d['n'])
    paginanummer(c, nr)


def review_links(c, n, nr):
    x0, x1 = M.marges(True)
    w = x1 - x0
    r = I.REVIEW[n]
    week = week_van(n)
    y = dagkop(c, True, week, n, 'Review', 'Look back for three minutes. Then look ahead.')
    y = M.w_balk(c, x0, y, w, 'My week')
    labels = [f'Day {i}' for i in range(n - 6, n + 1)]
    y = M.w_dagen(c, x0, y - 4, w, labels)
    y = M.w_vul(c, x0, y + 14, w, 'Days done: ___40 out of 7.  Felt easy (4 or 5): ___40 days.')
    y -= 4
    c.setFont('LoraSB', 10)
    c.drawString(x0, y, r['vraag'])
    y -= 8
    if len(r['opties']) <= 3:
        y = M.w_omcirkel(c, x0, y - 10, w, r['opties'])
    else:
        y = M.w_keuzes(c, x0, y - 8, w, r['opties'], kol=2)
    y = teken_vol(c, x0, y, w, [('lijnen', 2, 'What made it easy:'), ('lijnen', 2, 'What got in the way:')], GRENS_L, f'review {n} links')
    grap_onder(c, True, r['grap'])
    paginanummer(c, nr)


def review_rechts(c, n, nr):
    x0, x1 = M.marges(False)
    w = x1 - x0
    kop_rechts(c, f'Day {n}  /  Keep, shrink or grow')
    y = H - BOVEN - 30
    groei = n >= 21
    rijen = [['6 or 7 days, and it felt easy', 'Keep it. Do not grow it yet.' if not groei else 'You may turn the dial up one notch (Day 18).'],
             ['4 or 5 days', 'Keep it. Check your hook and your cue.'],
             ['0 to 3 days', 'Shrink it. It is too big, or the hook is wrong.']]
    lijst = [('h', 'Keep, shrink or grow?'),
             ('tabel', ['If this week was...', 'Then...'], rijen, {'kolw': [0.45, 0.55], 'rh': 22}),
             ('keuzes', ['Keep it the same', 'Shrink it to:'] + (['Grow it one notch to:'] if groei else []), {'kol': 1}),
             ('lijnen', 1, None, {'eerst': 6}),
             ('vul', 'My one change for next week: ___* .' if n < 28 else 'My one change for the last two days: ___* .'),
             ('vul', 'My reward for finishing this week: ___* .')]
    teken_vol(c, x0, y, w, lijst, GRENS_R, f'review {n} rechts', notities=True)
    checkin(c, False, n)
    paginanummer(c, nr)


def eind_links(c, nr):
    x0, x1 = M.marges(True)
    w = x1 - x0
    y = dagkop(c, True, I.WEKEN[3], 30, 'Graduation', 'Look how far you came.')
    y = M.w_balk(c, x0, y, w, "Today's 3-minute move")
    y = tekst(c, 'Compare today with Day 0 (page 8). Fill in both columns, then sign your certificate on the next page.', x0, y, w, s=10.8, lead=14.5) - 8
    lijst = [('tabel', ['', 'Day 0', 'Today'], [['Days a week I did it', '', ''], ['I believe I can make it stick (1-10)', '', ''], ['It matters to me (1-10)', '', ''], ['My biggest obstacle', '', '']], {'kolw': [0.5, 0.25, 0.25], 'rh': 26}),
             ('vul', 'Total days done: ___40 out of 30.  Longest streak: ___40 days.'),
             ('vul', 'The day I almost quit, and did it anyway: Day ___40 .'),
             ('lijnen', 2, 'What changed, besides the habit:')]
    teken_vol(c, x0, y, w, lijst, GRENS_L, 'dag 30 links')
    grap_onder(c, True, 'Frame it. Or at least do not use it as a coaster.')
    paginanummer(c, nr)


def eind_rechts(c, nr):
    x0, x1 = M.marges(False)
    w = x1 - x0
    kop_rechts(c, 'Day 30  /  Graduation')
    top = H - BOVEN - 22
    onder = GRENS_R + 6
    c.setLineWidth(2)
    c.rect(x0, onder, w, top - onder, stroke=1, fill=0)
    c.setLineWidth(0.6)
    c.rect(x0 + 5, onder + 5, w - 10, top - onder - 10, stroke=1, fill=0)
    y = top - 34
    c.setFont('PopB', 15)
    c.drawCentredString(x0 + w / 2, y, 'CERTIFICATE OF')
    y -= 20
    c.drawCentredString(x0 + w / 2, y, 'LASTING CHANGE')
    y -= 26
    ix0, iw = x0 + 22, w - 44
    y = M.w_vul(c, ix0, y + 16, iw, 'This certifies that ___* showed up for 30 days, kept going on bad days, and became someone who ___* .', lead=26)
    y -= 4
    for lab in ['Signed', 'Date', 'Witness (my buddy)']:
        y -= 10
        c.setFont('LoraSB', 9.5)
        c.drawString(ix0, y + 3, lab)
        schrijflijn(c, ix0 + breedte(lab, 'LoraSB', 9.5) + 6, y, ix0 + iw, kleur=black)
        y -= 16
    # zegel
    zy = (y + onder) / 2
    zr = min(44, (y - onder) / 2 - 8)
    if zr > 24:
        zx = x0 + w / 2
        c.setLineWidth(2)
        c.circle(zx, zy, zr, stroke=1, fill=0)
        c.setLineWidth(0.7)
        c.circle(zx, zy, zr - 5, stroke=1, fill=0)
        c.setFont('PopB', zr * 0.75)
        c.drawCentredString(zx, zy - zr * 0.12, '30')
        c.setFont('PopM', 6.5)
        c.drawCentredString(zx, zy - zr * 0.52, 'D A Y S')
    checkin(c, False, 30)
    paginanummer(c, nr)


# ------------------------------------------------------------------ weekopener

def week_links(c, wk, nr):
    x0, x1 = M.marges(True)
    w = x1 - x0
    label(c, f'Week {wk["n"]}  /  at a glance', x0, H - BOVEN)
    y = H - BOVEN - 40
    c.setFont('PopB', 20)
    c.drawString(x0, y, 'This week')
    y -= 22
    y = tekst(c, wk['vaardigheid'], x0, y, w, f='LoraI', s=12, lead=16) - 16
    start = (wk['n'] - 1) * 7 + 1
    eind = start + 7 if wk['n'] < 4 else 31
    stap = min(52, (y - (ONDER + 76)) / (eind - start))
    for n in range(start, eind):
        d = I.DAGEN[n - 1]
        titel = d.get('titel') or ('Week review' if d.get('review') else 'Graduation')
        hokje(c, x0, y - 2, 11, 1)
        c.setFont('PopB', 11)
        c.drawString(x0 + 22, y, f'Day {n}')
        c.setFont('Lora', 11)
        c.drawString(x0 + 70, y, titel)
        kop = d.get('kop') or ('Look back, then look ahead.' if d.get('review') else '')
        ks = 9
        while ks > 7 and breedte(kop, 'LoraI', ks) > w - 70:
            ks -= 0.25
        c.setFont('LoraI', ks)
        c.setFillColor(GRIJS)
        for r in wrap(kop, 'LoraI', ks, w - 70)[:1]:
            c.drawString(x0 + 70, y - 12, r)
        c.setFillColor(black)
        y -= stap
    c.setFillColor(VLAK)
    c.roundRect(x0, ONDER + 8, w, 52, 5, stroke=0, fill=1)
    c.setFillColor(black)
    label(c, 'Every day', x0 + 10, ONDER + 44, kleur=black, s=7)
    c.setFont('Lora', 10)
    c.drawString(x0 + 10, ONDER + 28, 'Read the left page (1 min). Do the move (2 min).')
    c.drawString(x0 + 10, ONDER + 15, 'Do your tiny habit. Check in (30 sec).')
    paginanummer(c, nr)


def week_rechts(c, wk, nr):
    x0, x1 = M.marges(False)
    w = x1 - x0
    c.setFont('PopB', 13)
    c.drawString(x0, H - 2.1 * 72, f'WEEK {wk["n"]}')
    c.setFont('PopB', 120)
    c.drawString(x0 - 6, H - 3.75 * 72, str(wk['n']))
    y = H - 4.35 * 72
    c.setFont('PopB', 26)
    for r in wrap(wk['naam'].upper(), 'PopB', 26, w):
        c.drawString(x0, y, r)
        y -= 30
    y -= 4
    c.setLineWidth(2)
    c.line(x0, y, x0 + 40, y)
    y -= 22
    y = tekst(c, wk['belofte'], x0, y, w, f='Lora', s=11.5, lead=16) - 10
    tekst(c, wk['grap'], x0, y, w, f='LoraI', s=11.5, lead=15, kleur=GRIJS)
    paginanummer(c, nr)


# ------------------------------------------------------------------ voorwerk

def titelpagina(c, nr):
    x0, x1 = M.marges(False)
    w = x1 - x0
    label(c, 'New for 2027', x0, H - 2.6 * 72 + 46, kleur=black, s=8.5)
    y = H - 2.6 * 72
    c.setFont('PopB', 30)
    for r in ['LASTING', 'CHANGE', 'WORKBOOK']:
        c.drawString(x0, y, r)
        y -= 34
    y -= 6
    c.setLineWidth(2.4)
    c.line(x0, y, x0 + 50, y)
    y -= 26
    y = tekst(c, I.ONDERTITEL, x0, y, w * 0.8, f='Lora', s=13, lead=18)
    tekst(c, '\u201cDon\u2019t throw away another year.\u201d', x0, y - 22, w, f='LoraI', s=15, lead=19)
    c.setFont('PopM', 11)
    c.drawString(x0, 1.3 * 72, I.AUTEUR.upper())
    c.setFont('LoraI', 10)
    c.setFillColor(GRIJS)
    c.drawString(x0, 1.3 * 72 - 16, 'One habit. 30 days. About 3 minutes a day.')
    c.setFillColor(black)


def copyright(c, nr):
    x0, x1 = M.marges(True)
    w = x1 - x0
    y = 3.4 * 72
    for t in ['Copyright © 2026 John Warrior. All rights reserved.',
              'No part of this book may be copied or shared in any form without written permission from the author, except for short quotations in reviews. You are welcome to copy the blank tool pages at the back for your own personal use.',
              'This workbook is for general education and self-reflection. It is not medical, psychological or financial advice. If you are struggling with your physical or mental health, please talk to a qualified professional.',
              'The research mentioned in this book is listed under Sources at the back. Examples are illustrations, not stories of real people.',
              'Updated edition, 2027.']:
        y = tekst(c, t, x0, y, w, f='Lora', s=8.5, lead=11.5, kleur=GRIJS) - 7


def inhoudspagina(c, nr, plan):
    x0, x1 = M.marges(False)
    w = x1 - x0
    y = H - BOVEN - 34
    c.setFont('PopB', 22)
    c.drawString(x0, y, 'Inside')
    y -= 34
    regels = [('Read this first', plan['start']), ('Pick one habit', plan['kies']), ('Day 0: where I am now', plan['dag0']), ('My contract and my buddy', plan['contract']), None]
    for wk in I.WEKEN:
        regels.append((f'Week {wk["n"]}  /  {wk["naam"]}', plan[f'week{wk["n"]}']))
    regels += [None, ('Part 2  /  The autopilot stretch', plan['dag31']), ('Days 67 to 120', plan['tracker']), ('The bad-day card', plan['slecht']), ('One-page habit plans', plan['plan']), ('My wins', plan['wins']), ('Sources', plan['bronnen'])]
    for r in regels:
        if r is None:
            y -= 12
            continue
        t, p = r
        c.setFont('PopM' if t.startswith('Week') else 'Lora', 11)
        c.drawString(x0, y, t)
        c.setFont('PopM', 10)
        c.drawRightString(x1, y, str(p))
        c.setStrokeColor(LICHT)
        c.setDash(1, 2)
        c.line(x0 + breedte(t, 'PopM' if t.startswith('Week') else 'Lora', 11) + 6, y + 2, x1 - breedte(str(p), 'PopM', 10) - 6, y + 2)
        c.setDash()
        c.setStrokeColor(black)
        y -= 22
    paginanummer(c, nr)


def lees_eerst(c, nr):
    x0, x1 = M.marges(True)
    w = x1 - x0
    kop_links(c, 'Read this first')
    y = H - BOVEN - 34
    c.setFont('PopB', 20)
    c.drawString(x0, y, 'How this book works')
    y -= 18
    c.setFont('LoraI', 11)
    c.setFillColor(GRIJS)
    c.drawString(x0, y, 'Reading time: about 90 seconds.')
    c.setFillColor(black)
    y -= 26
    blokken = [('This is not a book you read. It is a book you do.', 'One habit. 30 days. About 3 minutes a day. No 5 a.m. miracle routine, no 40-page chapters, no guilt.'),
               ('Every day is two pages.', 'On the left: one small idea and today\'s 3-minute move. On the right: a short exercise and your daily check-in.'),
               ('Your habit comes on top, at its tiniest size.', 'On most days that takes under two minutes too. Tiny is not a compromise. It is the method.'),
               ('Four weeks, four skills.', 'Start tiny. Make it easy on hard days. Make it stick. Make it me. Each week builds on the one before.'),
               ('Then part 2.', 'After Day 30, one short page a day takes you to Day 66, the point where most habits start to run on autopilot.'),
               ('You need three things.', 'This book, a pen, and one person you can text.'),
               ('Missed a day?', 'Do not skip ahead and do not start over. Just do the next day. Day 13 shows you how to bounce back.')]
    for kop, t in blokken:
        c.setFont('PopB', 11)
        for r in wrap(kop, 'PopB', 11, w):
            c.drawString(x0, y, r)
            y -= 15
        y = tekst(c, t, x0, y, w, s=10.8, lead=14.6) - 13
    y -= 4
    label(c, 'Your daily rhythm', x0, y, kleur=black, s=7)
    stappen = [('READ', '1 minute'), ('MOVE', '2 minutes'), ('HABIT', 'tiny version'), ('CHECK IN', '30 seconds')]
    gap = 12
    bw = (w - 3 * gap) / 4
    for i, (k, t) in enumerate(stappen):
        bx = x0 + i * (bw + gap)
        c.setFillColor(black if i == 2 else VLAK)
        c.roundRect(bx, y - 50, bw, 40, 5, stroke=0, fill=1)
        c.setFillColor(white if i == 2 else black)
        c.setFont('PopB', 9)
        c.drawCentredString(bx + bw / 2, y - 27, k)
        c.setFont('Lora', 8.5)
        c.drawCentredString(bx + bw / 2, y - 40, t)
        c.setFillColor(black)
        if i < 3:
            ay = y - 30
            p = c.beginPath()
            p.moveTo(bx + bw + 3, ay + 3.5)
            p.lineTo(bx + bw + gap - 3, ay)
            p.lineTo(bx + bw + 3, ay - 3.5)
            p.close()
            c.drawPath(p, stroke=0, fill=1)
    paginanummer(c, nr)


def kaart30(c, nr):
    x0, x1 = M.marges(False)
    w = x1 - x0
    kop_rechts(c, 'The 30-day map')
    y = H - BOVEN - 34
    c.setFont('PopB', 20)
    c.drawString(x0, y, 'The 30-day map')
    y -= 22
    for wk in I.WEKEN:
        c.setFillColor(black)
        c.roundRect(x0, y - 44, 34, 50, 4, stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont('PopB', 20)
        c.drawCentredString(x0 + 17, y - 26, str(wk['n']))
        c.setFillColor(black)
        c.setFont('PopB', 11)
        c.drawString(x0 + 44, y - 4, wk['naam'].upper())
        start = (wk['n'] - 1) * 7 + 1
        eind = start + 6 if wk['n'] < 4 else 30
        c.setFont('PopM', 7.5)
        c.setFillColor(GRIJS)
        c.drawRightString(x1, y - 4, f'DAYS {start}-{eind}')
        c.setFillColor(black)
        tekst(c, wk['vaardigheid'], x0 + 44, y - 19, w - 44, s=10, lead=13)
        y -= 72
    y -= 6
    c.setFont('PopB', 12)
    c.drawString(x0, y, 'Three rules for all 30 days')
    y -= 22
    for i, (k, t) in enumerate([('Tiny beats big.', 'A habit you do beats a habit you plan.'), ('Daily beats perfect.', 'The terrible-day version counts as a win.'), ('Never miss twice.', 'One miss is an accident. Two is a decision.')]):
        c.setFont('PopB', 22)
        c.drawString(x0, y - 6, str(i + 1))
        c.setFont('PopB', 10.5)
        c.drawString(x0 + 24, y, k)
        tekst(c, t, x0 + 24, y - 14, w - 24, s=10.5, lead=13.5)
        y -= 46
    paginanummer(c, nr)


def kies_menu(c, nr):
    x0, x1 = M.marges(True)
    w = x1 - x0
    kop_links(c, 'Pick one habit')
    y = H - BOVEN - 34
    c.setFont('PopB', 20)
    c.drawString(x0, y, 'Pick one habit')
    y -= 18
    y = tekst(c, 'Not sure where to start? Here are habits people often pick, each with a tiny version that works on day one. Steal one, or use them as a model for your own.', x0, y, w, s=10, lead=13.5) - 8
    rijen = [['Move', 'Walk every day', 'Put on my shoes and step outside'], ['Read', 'Read more', 'Read one page'], ['Sleep', 'Better sleep', 'Phone on the charger outside the bedroom'],
             ['Money', 'Save more', 'Check my balance once a day'], ['Calm', 'Less stress', 'Three slow breaths when I sit in the car'], ['Food', 'Eat better', 'One piece of fruit after lunch'],
             ['Screens', 'Less scrolling', 'Phone face down while I eat'], ['Home', 'A tidy house', 'Put away three things after dinner'], ['Learn', 'A new language', 'One app lesson with my coffee'],
             ['People', 'Closer relationships', 'One kind text after lunch'], ['Work', 'Stop procrastinating', 'Write tomorrow\'s first task before I log off'], ['Mind', 'Journal', 'One sentence when I get into bed']]
    teken(c, x0, y, w, [('tabel', ['Area', 'Habit', 'Tiny version'], rijen, {'kolw': [0.18, 0.32, 0.5], 'rh': 28, 's': 9.6})], ONDER + 10, 'kies menu')
    paginanummer(c, nr)


def kies_eigen(c, nr):
    x0, x1 = M.marges(False)
    w = x1 - x0
    kop_rechts(c, 'Pick one habit')
    y = H - BOVEN - 34
    c.setFont('PopB', 20)
    c.drawString(x0, y, 'Choose yours')
    y -= 20
    c.setFont('PopM', 12)
    c.drawString(x0, y, 'One habit. Not three. One.')
    y -= 22
    lijst = [('h', 'The four tests'),
             ('keuzes', ['I actually want this, not just "should" want it.', 'I can do the tiny version in under two minutes.', 'I can do it every single day, at home or away.', 'I will know exactly when it is done.']),
             ('vul', 'My habit for the next 30 days: ___* .'),
             ('vul', 'The tiny version: ___* .'),
             ('vul', 'Where I will do it: ___* .'),
             ('kader', 'Vague  >  specific', ['"Exercise more"  >  "Put on my walking shoes after my coffee."', '"Be less stressed"  >  "Three slow breaths when I sit down in the car."', '"Read more"  >  "Read one page when I get into bed."']),
             ('kader', 'Tempted to pick two?', ['Park the second one in a one-page habit plan at the back of the book. Day 26 shows you when and how to add it.'])]
    teken_vol(c, x0, y, w, lijst, ONDER + 10, 'kies eigen', maxgap=18)
    paginanummer(c, nr)


def dag0_links(c, nr):
    x0, x1 = M.marges(True)
    w = x1 - x0
    label(c, 'Before you start', x0, H - BOVEN)
    y = H - BOVEN - 34
    c.setFont('PopB', 30)
    c.drawString(x0, y, 'DAY 0')
    c.setFillColor(GRIJS)
    c.setFont('PopM', 11)
    c.drawString(x0 + breedte('DAY 0', 'PopB', 30) + 10, y + 1, 'WHERE I AM NOW')
    c.setFillColor(black)
    y -= 26
    y = tekst(c, 'Be honest. Nobody grades this page. On Day 30 you will compare, and the difference is the fun part.', x0, y, w, s=10.3, lead=13.8) - 10
    lijst = [('vul', 'Today\'s date: ___* .'),
             ('schaal', 'Last week, I did this habit on how many days?', 8, '', '', 0),
             ('schaal', 'How much do I believe I can make it stick?', 10, 'not at all', 'completely'),
             ('schaal', 'How much does this habit matter to me?', 10, 'a little', 'a lot'),
             ('lijnen', 3, 'What I tried before, and why it did not last:')]
    teken_vol(c, x0, y, w, lijst, ONDER + 10, 'dag 0 links')
    paginanummer(c, nr)


def dag0_rechts(c, nr):
    x0, x1 = M.marges(False)
    w = x1 - x0
    kop_rechts(c, 'Day 0  /  Where I am now')
    y = H - BOVEN - 30
    lijst = [('keuzes', ['Too tired', 'I forget', 'No time', 'Not in the mood', 'All or nothing', 'Phone or TV', 'Other people', 'Stress', 'Strong start, then I fade', 'I don\'t know where to start'], {'kol': 2, 'titel': 'What usually stops me (tick all that apply)'}),
             ('ruimte', 4),
             ('h', 'Why now works'),
             ('para', 'There is a reason you feel like changing at New Year, on Mondays and on birthdays. Researchers call it the fresh start effect: dates like these make the past feel like "the old me" and the future like a clean page. Use that feeling, but do not depend on it. Motivation gets you to Day 1. The system in this book gets you to Day 30.', {'s': 10, 'lead': 13.5}),
             ('noot', 'Research: Dai, Milkman & Riis (2014)'),
             ('lijnen', 2, 'Why I am doing this:'),
             ('lijnen', 2, 'What it costs me if nothing changes:')]
    teken_vol(c, x0, y, w, lijst, ONDER + 10, 'dag 0 rechts')
    paginanummer(c, nr)


def contract(c, nr):
    x0, x1 = M.marges(True)
    w = x1 - x0
    kop_links(c, 'My contract')
    y = H - BOVEN - 34
    c.setFont('PopB', 20)
    c.drawString(x0, y, 'My 30-day contract')
    y -= 18
    y = tekst(c, 'A plan with a when, a where and a witness is much harder to ignore. Fill it in, sign it, and ask your buddy to sign too.', x0, y, w, s=10.3, lead=13.8) - 4
    lijst = [('labellijnen', ['I,', 'will do this tiny habit:', 'right after I', 'every day for 30 days, starting on', 'If I miss a day, the next day I will', 'My buddy is', 'We check in by (text, call or photo)', 'at this time of day:'], 31),
             ('ruimte', 6),
             ('labellijnen', ['Signed', 'Date', 'My buddy'], 31)]
    teken_vol(c, x0, y, w, lijst, ONDER + 10, 'contract')
    paginanummer(c, nr)


def uitleg_checkin(c, nr):
    x0, x1 = M.marges(False)
    w = x1 - x0
    kop_rechts(c, 'How to check in')
    y = H - BOVEN - 34
    c.setFont('PopB', 20)
    c.drawString(x0, y, 'Your daily check-in')
    y -= 18
    y = tekst(c, 'Every right-hand page ends with this box. It takes 30 seconds. Here is one filled in on Day 4:', x0, y, w, s=10.3, lead=13.8) - 10
    uitleg = [('Tick the box', 'if you did your tiny version. Any size counts.'), ('Minutes', 'is the real number. Even 1.'), ('How it felt', 'from 1 (ugh) to 5 (easy). You will use these scores on Day 18.'),
              ('Buddy', 'send "Day 4 done" or a photo of the page.'), ('Color in', 'today\'s box in the streak. Watching it fill up is half the fun.'), ('Tomorrow', 'one tiny tweak, like "shoes by the door tonight."')]
    for k, t in uitleg:
        c.setFont('PopB', 10)
        c.drawString(x0, y, k)
        tekst(c, t, x0 + breedte(k, 'PopB', 10) + 5, y, w - breedte(k, 'PopB', 10) - 5, s=10.4, lead=13)
        y -= 25
    checkin(c, False, 4, voorbeeld=True)
    paginanummer(c, nr)


def buddy(c, nr):
    x0, x1 = M.marges(True)
    w = x1 - x0
    kop_links(c, 'Your buddy')
    y = H - BOVEN - 34
    c.setFont('PopB', 20)
    c.drawString(x0, y, 'Pick a buddy')
    y -= 18
    y = tekst(c, 'Your buddy does not have to do the challenge. They only have to answer a text. Writing your progress down and sharing it makes you more likely to keep going (more on Day 15).', x0, y, w, s=10.3, lead=13.8) - 8
    lijst = [('keuzes', ['Reliable: answers within a day', 'Kind: cheers, does not lecture', 'Not your harshest critic', 'Happy to be asked'], {'titel': 'A good buddy is'}),
             ('h', 'The deal'),
             ('para', 'Every day you text "Day __ done" or a photo of your page. They reply with anything, even a thumbs up. If they have not heard from you by the agreed time, they send you a "?"', {'s': 10, 'lead': 13.5}),
             ('labellijnen', ['Buddy:', 'Their number:', 'Our check-in time:']),
             ('noot', 'No buddy right now? Send your daily photo to the "note to self" chat on your phone. It still works better than keeping it in your head.')]
    teken_vol(c, x0, y, w, lijst, ONDER + 10, 'buddy')
    paginanummer(c, nr)


def snelstart(c, nr):
    x0, x1 = M.marges(False)
    w = x1 - x0
    kop_rechts(c, 'Quick start')
    y = H - BOVEN - 34
    c.setFont('PopB', 20)
    c.drawString(x0, y, 'Before you turn the page')
    y -= 30
    stappen = ['I picked one habit and wrote its tiny version.', 'I filled in Day 0.', 'I signed my contract.', 'I texted my buddy: "I am starting a 30-day habit challenge tomorrow. Can I text you \'done\' every day?"', 'I put this book and a pen where I will see them tomorrow.']
    for s in stappen:
        hokje(c, x0, y - 2, 12, 1.1)
        y = tekst(c, s, x0 + 24, y, w - 24, s=11.5, lead=15.5) - 22
    y -= 40
    c.setFont('PopB', 26)
    c.drawString(x0, y, 'See you on Day 1.')
    y -= 22
    tekst(c, 'Turn the page tomorrow, after your hook. Three minutes. You have got this.', x0, y, w, f='LoraI', s=11, lead=15, kleur=GRIJS)
    paginanummer(c, nr)


# ------------------------------------------------------------------ nawerk

def dag31(c, nr):
    x0, x1 = M.marges(True)
    w = x1 - x0
    kop_links(c, 'After Day 30')
    y = H - BOVEN - 34
    c.setFont('PopB', 20)
    c.drawString(x0, y, 'Day 31 and beyond')
    y -= 20
    y = tekst(c, 'Here is something most habit books skip: in one study, it took people a median of 66 days for a new daily habit to feel automatic, and the range was huge. So Day 30 is not the finish line. It is the day you know exactly how to do it.', x0, y, w, s=10.3, lead=13.8)
    y = tekst(c, 'Research: Lally et al. (2010)', x0, y - 1, w, f='LoraI', s=8, lead=10, kleur=GRIJS) - 10
    lijst = [('h', 'My next 36 days, to Day 66'),
             ('keuzes', ['Keep the same habit at the same level', 'Turn the dial up one notch to:', 'Add habit 2 (from Day 26) on Day:']),
             ('lijnen', 1, None, {'eerst': 6}),
             ('h', 'Rules for the long run'),
             ('para', '1. Never miss twice.   2. Shrink before you quit.   3. Restart on a fresh-start day.   4. Keep checking in, even with a tally mark on a sticky note.', {'s': 10, 'lead': 13.5}),
             ('noot', 'Use the tracker on the next page for days 31 to 120.'),
             ('h', 'Checkpoint: Day 66'),
             ('schaal', 'It feels automatic, like brushing my teeth:', 10, 'not yet', 'totally'),
             ('lijnen', 2, 'What I will keep doing for life:')]
    teken_vol(c, x0, y, w, lijst, ONDER + 10, 'dag 31')
    paginanummer(c, nr)


def tracker(c, nr):
    x0, x1 = M.marges(nr % 2 == 0)
    w = x1 - x0
    (kop_links if nr % 2 == 0 else kop_rechts)(c, 'Days 67 to 120')
    y = H - BOVEN - 34
    c.setFont('PopB', 20)
    c.drawString(x0, y, 'Keep the chain going')
    y -= 16
    c.setFont('LoraI', 10)
    c.setFillColor(GRIJS)
    c.drawString(x0, y, 'Color one box for every day you do your habit.')
    c.setFillColor(black)
    y -= 16
    kol = 6
    vak = w / kol
    hv = min(vak * 0.8, (y - ONDER - 40) / 9)
    for i in range(54):
        r, k = divmod(i, kol)
        bx = x0 + k * vak
        by = y - r * hv
        c.setStrokeColor(LIJN)
        c.setLineWidth(0.7)
        c.rect(bx + 1.5, by - hv + 1.5, vak - 3, hv - 3, stroke=1, fill=0)
        c.setFont('PopL', 7)
        c.setFillColor(GRIJS)
        c.drawString(bx + 4, by - 9, str(67 + i))
        c.setFillColor(black)
        if (67 + i) == 120:
            c.setStrokeColor(black)
            c.setLineWidth(1.6)
            c.rect(bx + 1.5, by - hv + 1.5, vak - 3, hv - 3, stroke=1, fill=0)
    c.setStrokeColor(black)
    yy = y - 9 * hv - 14
    c.setFont('LoraI', 9)
    c.setFillColor(GRIJS)
    c.drawString(x0, yy, 'Day 120 is the bold box. By then this is simply who you are.')
    c.setFillColor(black)
    paginanummer(c, nr)


def slechte_dag(c, nr):
    x0, x1 = M.marges(True)
    w = x1 - x0
    kop_links(c, 'The bad-day card')
    top = H - BOVEN - 20
    onder = ONDER + 10
    c.setLineWidth(1.2)
    c.setDash(4, 3)
    c.roundRect(x0, onder, w, top - onder, 8, stroke=1, fill=0)
    c.setDash()
    y = top - 36
    c.setFont('PopB', 20)
    c.drawCentredString(x0 + w / 2, y, 'READ THIS WHEN')
    y -= 24
    c.drawCentredString(x0 + w / 2, y, 'YOU WANT TO QUIT')
    y -= 34
    stappen = [('Do the terrible-day version.', 'Thirty seconds. It counts as a full day. It always has.'),
               ('Count your votes.', 'Look at your streak. Every colored box is proof of who you are becoming.'),
               ('Read your letter.', 'Future-you wrote to you on Day 25. They are waiting for you.'),
               ('Text your buddy one word.', '"Help." That is all. Let someone carry it with you for a minute.'),
               ('Remember the rule.', 'Missing once is an accident. You only have to not miss twice.')]
    for i, (k, t) in enumerate(stappen):
        c.setFont('PopB', 20)
        c.drawString(x0 + 16, y - 4, str(i + 1))
        c.setFont('PopB', 11)
        c.drawString(x0 + 42, y, k)
        tekst(c, t, x0 + 42, y - 15, w - 58, s=10.5, lead=13.5)
        y -= 66
    c.setFont('LoraI', 9)
    c.setFillColor(GRIJS)
    c.drawCentredString(x0 + w / 2, onder + 12, 'Copy or photograph this page and keep it in your wallet or phone.')
    c.setFillColor(black)
    paginanummer(c, nr)


def gewoonteplan(c, nr, links, nummer):
    x0, x1 = M.marges(links)
    w = x1 - x0
    (kop_links if links else kop_rechts)(c, f'One-page habit plan  /  {nummer}')
    y = H - BOVEN - 34
    c.setFont('PopB', 20)
    c.drawString(x0, y, 'One-page habit plan')
    y -= 20
    lijst = [('labellijnen', ['My habit:', 'Tiny version:', 'After I', 'I will', 'My celebration:', 'My cue goes:', 'Normal day:', 'Busy day:', 'Terrible day:', 'If', 'then I', 'My buddy:', 'Why it matters:', 'Start date:'], 31)]
    teken(c, x0, y, w, lijst, ONDER + 10, 'plan')
    paginanummer(c, nr)


SCHRIJF_PLAN = 26


def wins(c, nr):
    x0, x1 = M.marges(False)
    w = x1 - x0
    kop_rechts(c, 'My wins')
    y = H - BOVEN - 34
    c.setFont('PopB', 20)
    c.drawString(x0, y, 'Wins worth remembering')
    y -= 16
    c.setFont('LoraI', 10)
    c.setFillColor(GRIJS)
    c.drawString(x0, y, 'Small ones count. Especially small ones.')
    c.setFillColor(black)
    y -= 8
    teken(c, x0, y, w, [('genummerd', 19)], ONDER + 10, 'wins')
    paginanummer(c, nr)


def bronnen(c, nr):
    x0, x1 = M.marges(True)
    w = x1 - x0
    kop_links(c, 'Sources')
    y = H - BOVEN - 34
    c.setFont('PopB', 20)
    c.drawString(x0, y, 'Sources')
    y -= 22
    for b in I.BRONNEN:
        y = tekst(c, b, x0, y, w, s=8.4, lead=10.8) - 4.5
        if y < ONDER + 10:
            raise M.Overloop('bronnen lopen over')
    paginanummer(c, nr)


def nawoord(c, nr):
    x0, x1 = M.marges(False)
    w = x1 - x0
    kop_rechts(c, 'Thank you')
    y = H - BOVEN - 60
    c.setFont('PopB', 20)
    c.drawString(x0, y, 'You did the work.')
    y -= 30
    for t in ['Most people who buy a workbook never fill in a single page. You did. Whether you ticked all 30 days or 13 of them, you now know how to make a habit small enough to start, strong enough for bad days and personal enough to keep.',
              'Use the one-page plans for your next habit, and the bad-day card whenever you need it. And come back to this book next year. Your Day 0 page will make you smile.',
              'If this workbook helped you, an honest review on Amazon helps other readers decide whether it is right for them. Thank you for reading, and for doing.']:
        y = tekst(c, t, x0, y, w, s=10.8, lead=15) - 10
    y -= 8
    c.setFont('PopM', 11)
    c.drawString(x0, y, 'John Warrior')
    paginanummer(c, nr)


# ------------------------------------------------------------------ deel 2: dag 31-66

def fase_van(n):
    for a, e, naam, t in I.DEEL2_FASEN:
        if a <= n <= e:
            return naam
    return ''


def mini_checkin(c, links, n):
    x0, x1 = M.marges(links)
    w = x1 - x0
    yT = ONDER + 84
    c.setLineWidth(1.2)
    c.line(x0, yT, x1, yT)
    y = yT - 18
    hokje(c, x0, y - 1.5, 10, 1.1)
    c.setFont('LoraSB', 10)
    c.drawString(x0 + 16, y, 'I did my habit today')
    c.setFont('Lora', 10)
    mx = x0 + w * 0.5
    c.drawString(mx, y, 'Felt:')
    bx = mx + breedte('Felt:', 'Lora', 10) + 12
    for i in range(5):
        c.setLineWidth(0.8)
        c.circle(bx + i * 18, y + 3.5, 7, stroke=1, fill=0)
        c.setFont('PopM', 7.5)
        c.drawCentredString(bx + i * 18, y + 0.8, str(i + 1))
    vak = w / 18
    ys = yT - 34
    for i in range(36):
        r, k = divmod(i, 18)
        d = 31 + i
        bx2 = x0 + k * vak
        by = ys - r * (vak - 1)
        nu = d == n
        c.setStrokeColor(black if nu else LIJN)
        c.setLineWidth(1.5 if nu else 0.7)
        c.rect(bx2 + 1, by - vak + 3, vak - 2, vak - 2, stroke=1, fill=0)
        c.setFont('PopB' if nu else 'PopL', 5.8)
        c.setFillColor(black if nu else GRIJS)
        c.drawCentredString(bx2 + vak / 2, by - vak / 2 + 1, str(d))
        c.setFillColor(black)
    c.setStrokeColor(black)


def deel2_dag(c, n, nr):
    links = nr % 2 == 0
    x0, x1 = M.marges(links)
    w = x1 - x0
    (label if links else (lambda cc, t, xx, yy: label_rechts(cc, t, x1, yy)))(c, f'Part 2  /  {fase_van(n)}', x0, H - BOVEN)
    y = H - BOVEN - 36
    c.setFont('PopB', 26)
    c.drawString(x0, y, f'DAY {n}')
    c.setFillColor(GRIJS)
    c.setFont('PopM', 10)
    rest = 66 - n
    c.drawString(x0 + breedte(f'DAY {n}', 'PopB', 26) + 10, y + 1, (f'{rest} TO GO' if rest > 1 else ('1 TO GO' if rest == 1 else 'THE FINISH')))
    c.setFillColor(black)
    y -= 28
    c.setFont('PopM', 13.5)
    for r in wrap(I.DEEL2[n], 'PopM', 13.5, w):
        c.drawString(x0, y, r)
        y -= 18
    y -= 6
    if n == 61:
        y = M.w_schaal(c, x0, y - 6, w, '', 10, 'still effort', 'autopilot') - 4
    if n == 66:
        y = M.w_tabel(c, x0, y - 4, w, ['', 'Day 0', 'Day 66'], [['Days a week I do it', '', ''], ['It feels automatic (1-10)', '', ''], ['It matters to me (1-10)', '', '']], kolw=[0.5, 0.25, 0.25], rh=24) - 2
        c.setFont('LoraSB', 10)
        c.drawString(x0, y, 'My rule for the next year:')
        y -= 4
    grens = ONDER + 84 + 18
    y -= 18
    while y > grens:
        schrijflijn(c, x0, y, x1)
        y -= SCHRIJF
    mini_checkin(c, links, n)
    paginanummer(c, nr)


def deel2_links(c, nr):
    x0, x1 = M.marges(True)
    w = x1 - x0
    kop_links(c, 'Part 2  /  at a glance')
    y = H - BOVEN - 40
    c.setFont('PopB', 20)
    c.drawString(x0, y, 'Why 66 days?')
    y -= 22
    y = tekst(c, 'Here is something most habit books skip. In a study that followed people building a new daily habit, it took a median of 66 days before the habit felt automatic, and the range was wide. So Day 30 is not the finish line. It is the day you know exactly how to do it.', x0, y, w, s=10.8, lead=14.8)
    y = tekst(c, 'Research: Lally et al. (2010)', x0, y - 1, w, f='LoraI', s=8, lead=10, kleur=GRIJS) - 14
    y = tekst(c, 'Part 2 is lighter: one page a day, one question, a few lines and a mini check-in. About two minutes.', x0, y, w, s=10.8, lead=14.8) - 14
    for a, e, naam, t in I.DEEL2_FASEN:
        c.setFont('PopB', 11)
        c.drawString(x0, y, naam.upper())
        c.setFont('PopM', 7.5)
        c.setFillColor(GRIJS)
        c.drawRightString(x1, y, f'DAYS {a}-{e}')
        c.setFillColor(black)
        y = tekst(c, t, x0, y - 14, w, s=10.2, lead=13.5) - 12
    y -= 6
    teken_vol(c, x0, y, w, [('keuzes', ['Same habit, same level', 'Same habit, one notch up:'], {'titel': 'My plan for part 2'}), ('lijnen', 1, None, {'eerst': 6})], ONDER + 10, 'deel 2 links')
    paginanummer(c, nr)


def deel2_rechts(c, nr):
    x0, x1 = M.marges(False)
    w = x1 - x0
    c.setFont('PopB', 13)
    c.drawString(x0, H - 2.1 * 72, 'PART 2')
    c.setFont('PopB', 100)
    c.drawString(x0 - 4, H - 3.6 * 72, '66')
    y = H - 4.25 * 72
    c.setFont('PopB', 26)
    for r in ['THE AUTOPILOT', 'STRETCH']:
        c.drawString(x0, y, r)
        y -= 30
    y -= 4
    c.setLineWidth(2)
    c.line(x0, y, x0 + 40, y)
    y -= 22
    y = tekst(c, 'Days 31 to 66. Thirty-six pages, one question each. This is where your habit stops being a project and starts being part of your day.', x0, y, w, f='Lora', s=11.5, lead=16) - 10
    tekst(c, 'Rule one still applies: tiny counts.', x0, y, w, f='LoraI', s=11.5, lead=15, kleur=GRIJS)
    paginanummer(c, nr)


# ------------------------------------------------------------------ plan en bouw

def plan_maken():
    P = []  # (functie, args)
    P += [(titelpagina, ()), (copyright, ()), ('inhoud', ()), (lees_eerst, ()), (kaart30, ()), (kies_menu, ()), (kies_eigen, ()),
          (dag0_links, ()), (dag0_rechts, ()), (contract, ()), (uitleg_checkin, ()), (buddy, ()), (snelstart, ())]
    sleutels = {'start': 4, 'kies': 6, 'dag0': 8, 'contract': 10}
    for wk in I.WEKEN:
        sleutels[f'week{wk["n"]}'] = len(P) + 1
        P += [(week_links, (wk,)), (week_rechts, (wk,))]
        start = (wk['n'] - 1) * 7 + 1
        eind = start + 6 if wk['n'] < 4 else 30
        for n in range(start, eind + 1):
            d = I.DAGEN[n - 1]
            if d.get('review'):
                P += [(review_links, (n,)), (review_rechts, (n,))]
            elif d.get('eind'):
                P += [(eind_links, ()), (eind_rechts, ())]
            else:
                P += [(dag_links, (d,)), (dag_rechts, (d,))]
    sleutels['dag31'] = len(P) + 1
    P += [(deel2_links, ()), (deel2_rechts, ())]
    for n in range(31, 67):
        P += [(deel2_dag, (n,))]
    sleutels['tracker'] = len(P) + 1
    P += [(tracker, ())]
    sleutels['slecht'] = len(P) + 1
    P += [(slechte_dag, ())]
    sleutels['plan'] = len(P) + 1
    P += [(gewoonteplan, (False, 1)), (gewoonteplan, (True, 2))]
    sleutels['wins'] = len(P) + 1
    P += [(wins, ())]
    sleutels['bronnen'] = len(P) + 1
    P += [(bronnen, ()), (nawoord, ())]
    return P, sleutels


def bouw(uit, tot=None, van=1):
    P, sleutels = plan_maken()
    c = canvas.Canvas(uit, pagesize=(W, H), initialFontName='Lora', initialFontSize=10)
    c.setTitle(I.TITEL)
    c.setAuthor(I.AUTEUR)
    fouten = []
    for i, (fn, args) in enumerate(P):
        nr = i + 1
        if nr < van or (tot and nr > tot):
            continue
        links = nr % 2 == 0
        try:
            if fn == 'inhoud':
                inhoudspagina(c, nr, sleutels)
            elif fn is gewoonteplan:
                gewoonteplan(c, nr, links, args[1])
            else:
                fn(c, *args, nr)
        except M.Overloop as e:
            fouten.append(f'p{nr}: {e}')
        c.showPage()
    c.save()
    return len(P), fouten, sleutels


if __name__ == '__main__':
    tot = int(sys.argv[sys.argv.index('--tot') + 1]) if '--tot' in sys.argv else None
    van = int(sys.argv[sys.argv.index('--van') + 1]) if '--van' in sys.argv else 1
    n, fouten, s = bouw(sys.argv[1], tot, van)
    print('pagina\'s:', n, 'secties:', s)
    for f in fouten:
        print('OVERLOOP', f)
