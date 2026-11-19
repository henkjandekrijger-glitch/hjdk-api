"""Lasting Change Workbook, nieuw binnenwerk (2027): twee voorbeeldpagina's (dag 1, links en rechts).
6 x 9 inch, zwart-wit, fonts ingebed. Gebruik: python3 voorbeeld.py <uit.pdf>"""
import sys
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import black, white, Color

G = '/usr/share/fonts/truetype/google-fonts/'
C = '/usr/share/fonts/truetype/crosextra/'
pdfmetrics.registerFont(TTFont('PopB', G + 'Poppins-Bold.ttf'))
pdfmetrics.registerFont(TTFont('PopM', G + 'Poppins-Medium.ttf'))
pdfmetrics.registerFont(TTFont('PopI', G + 'Poppins-Italic.ttf'))
pdfmetrics.registerFont(TTFont('Car', C + 'Carlito-Regular.ttf'))
pdfmetrics.registerFont(TTFont('CarB', C + 'Carlito-Bold.ttf'))
pdfmetrics.registerFont(TTFont('CarI', C + 'Carlito-Italic.ttf'))

W, H = 6 * inch, 9 * inch
GRIJS = Color(0.55, 0.55, 0.55)
LICHT = Color(0.88, 0.88, 0.88)


def alinea(c, tekst, x, y, breedte, font='Car', size=11, lead=15):
    """Eenvoudige woordafbreking; geeft de nieuwe y terug."""
    c.setFont(font, size)
    regel = ''
    for woord in tekst.split():
        test = (regel + ' ' + woord).strip()
        if c.stringWidth(test, font, size) > breedte:
            c.drawString(x, y, regel)
            y -= lead
            regel = woord
        else:
            regel = test
    if regel:
        c.drawString(x, y, regel)
        y -= lead
    return y


def lijn(c, x, y, breedte, label=None):
    if label:
        c.setFont('CarB', 10.5)
        c.drawString(x, y + 3, label)
        lw = c.stringWidth(label, 'CarB', 10.5) + 6
    else:
        lw = 0
    c.setStrokeColor(GRIJS)
    c.setLineWidth(0.6)
    c.line(x + lw, y, x + breedte, y)
    c.setStrokeColor(black)


def kop(c, links, dag, week):
    m = 0.75 * inch if links else 0.875 * inch
    c.setFont('PopM', 8.5)
    c.setFillColor(GRIJS)
    c.drawString(m, H - 0.55 * inch, week.upper())
    c.setFillColor(black)
    return m


def links(c):
    m = kop(c, True, 1, 'Week 1  ·  Start tiny')
    br = W - m - 0.875 * inch
    y = H - 1.05 * inch
    c.setFont('PopB', 30)
    c.drawString(m, y, 'DAY 1')
    y -= 26
    c.setFont('PopM', 13)
    c.drawString(m, y, 'Make it so small it is almost embarrassing.')
    y -= 30

    # blok: de beweging van vandaag
    c.setFillColor(black)
    c.roundRect(m, y - 6, br, 20, 4, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont('PopB', 10)
    c.drawString(m + 8, y, "MY 3-MINUTE MOVE TODAY")
    c.setFillColor(black)
    y -= 24
    y = alinea(c, 'I write my habit at its smallest possible size. Not "run 5K", but "put on my running shoes". '
                  'Not "read 30 pages", but "read one page". If I could not do it on my worst day, I shrink it again.',
               m, y, br, size=11.5, lead=15.5)
    y -= 10

    c.setFont('PopB', 11)
    c.drawString(m, y, 'Why this works')
    y -= 16
    y = alinea(c, 'Big plans run on motivation, and motivation changes like the weather. A tiny habit does not care '
                  'about the weather. Starting is the hard part, so I make starting easy. Growing it comes later.',
               m, y, br, size=11, lead=14.5)
    y -= 14

    c.setFont('PopB', 11)
    c.drawString(m, y, 'My shrink ladder')
    y -= 22
    for label in ['Big version:', 'Smaller:', 'Smaller still:', 'My Day 1 version:']:
        lijn(c, m, y, br, label)
        y -= 28

    # voorbeeld
    y -= 4
    c.setFillColor(Color(0.94, 0.94, 0.94))
    c.roundRect(m, y - 62, br, 72, 6, stroke=0, fill=1)
    c.setFillColor(black)
    c.setFont('PopB', 9.5)
    c.drawString(m + 10, y - 6, 'EXAMPLE LADDER')
    c.setFont('Car', 10.5)
    for i, t in enumerate(['Run 5K  >  jog 10 minutes  >  walk to the corner',
                           '>  put on my running shoes after coffee.',
                           'That last one is my Day 1. Done in 60 seconds.']):
        c.drawString(m + 10, y - 22 - i * 14, t)
    y -= 92

    # grap onderaan
    y -= 6
    c.setStrokeColor(black)
    c.setLineWidth(1.2)
    c.line(m, y, m + 28, y)
    y -= 18
    c.setFont('PopI', 11)
    c.drawString(m, y, 'If my habit needs a pep talk, it is too big.')
    c.setFont('Car', 9)
    c.setFillColor(GRIJS)
    c.drawCentredString(W / 2, 0.45 * inch, '12')
    c.setFillColor(black)


def rechts(c):
    m = 0.875 * inch
    br = W - m - 0.75 * inch
    c.setFont('PopM', 8.5)
    c.setFillColor(GRIJS)
    c.drawRightString(W - 0.75 * inch, H - 0.55 * inch, 'DAY 1  ·  CHECK-IN')
    c.setFillColor(black)
    y = H - 1.05 * inch
    c.setFont('PopB', 18)
    c.drawString(m, y, 'Did I do it?')
    y -= 30

    # vinkje
    c.setLineWidth(1.4)
    c.rect(m, y - 4, 16, 16, stroke=1, fill=0)
    c.setFont('CarB', 12.5)
    c.drawString(m + 26, y, 'Yes, I did my tiny version today.')
    c.setFont('CarI', 10.5)
    c.drawString(m + 26, y - 14, 'One page counts. Shoes on counts. Tiny is the point.')
    y -= 44

    c.setFont('CarB', 10.5)
    c.drawString(m, y + 3, 'It took me about')
    c.setStrokeColor(GRIJS); c.setLineWidth(0.6)
    x0 = m + c.stringWidth('It took me about', 'CarB', 10.5) + 6
    c.line(x0, y, x0 + 46, y)
    c.setStrokeColor(black)
    c.drawString(x0 + 52, y + 3, 'minutes.')
    y -= 34

    c.setFont('CarB', 10.5)
    c.drawString(m, y, 'How it felt (circle one):')
    y -= 22
    labels = ['ugh', '', 'okay', '', 'easy']
    for i in range(5):
        cx = m + 18 + i * (br - 36) / 4
        c.setLineWidth(0.8)
        c.circle(cx, y, 11, stroke=1, fill=0)
        c.setFont('PopM', 10)
        c.drawCentredString(cx, y - 3.5, str(i + 1))
        if labels[i]:
            c.setFont('Car', 9)
            c.setFillColor(GRIJS)
            c.drawCentredString(cx, y - 24, labels[i])
            c.setFillColor(black)
    y -= 50

    c.setFont('PopB', 11)
    c.drawString(m, y, 'Evidence')
    y -= 15
    y = alinea(c, 'One thing I did today that the person I want to become would also do:', m, y, br, size=10.5, lead=14)
    y -= 12
    lijn(c, m, y, br)
    y -= 26
    lijn(c, m, y, br)
    y -= 34

    lijn(c, m, y, br, 'Tomorrow, one tiny tweak:')
    y -= 40

    # streakbalk 30 vakjes, 2 rijen van 15
    c.setFont('PopB', 9.5)
    c.drawString(m, y, 'MY 30 DAYS')
    y -= 8 + br / 15
    vak = br / 15
    for r in range(2):
        for k in range(15):
            n = r * 15 + k + 1
            x = m + k * vak
            if n == 1:
                c.setFillColor(black)
                c.rect(x + 1, y - r * vak, vak - 2, vak - 2, stroke=0, fill=1)
                c.setFillColor(white)
            else:
                c.setFillColor(black)
                c.setStrokeColor(LICHT if n > 1 else black)
                c.setLineWidth(0.8)
                c.rect(x + 1, y - r * vak, vak - 2, vak - 2, stroke=1, fill=0)
                c.setStrokeColor(black)
            c.setFont('Car', 7)
            c.drawCentredString(x + vak / 2, y - r * vak + vak / 2 - 4, str(n))
            c.setFillColor(black)
    y -= 2 * vak + 22

    c.setFont('PopB', 10.5)
    c.drawString(m, y, 'Never miss twice.')
    y -= 15
    y = alinea(c, 'Missing once is an accident. Missing twice is the start of a new habit, and not the one I picked.',
           m, y, br, font='Car', size=10.5, lead=14)
    y -= 16
    c.setLineWidth(1.2)
    c.rect(m, y - 4, 14, 14, stroke=1, fill=0)
    c.setFont('CarB', 11)
    c.drawString(m + 22, y, 'I texted my buddy: "Day 1 done."')
    c.setFont('Car', 9)
    c.setFillColor(GRIJS)
    c.drawCentredString(W / 2, 0.45 * inch, '13')
    c.setFillColor(black)


def maak(uit):
    c = canvas.Canvas(uit, pagesize=(W, H), initialFontName='Car', initialFontSize=11)
    c.setTitle('Lasting Change Workbook, voorbeeld dag 1')
    links(c)
    c.showPage()
    rechts(c)
    c.showPage()
    c.save()


if __name__ == '__main__':
    maak(sys.argv[1])
