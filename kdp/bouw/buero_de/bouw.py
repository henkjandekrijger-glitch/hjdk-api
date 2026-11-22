"""Binnenwerk van "Ich tu nur so, als ob" (David Warrior): 6 x 9 in, wit papier, zwart-wit, geen bleed.
Gebruik: python3 bouw.py  -> binnenwerk.pdf (+ paginas.txt met het aantal).
Eigen opmaak op canvas (tabellen, bingokaarten, puzzels en invulpagina's passen niet in bouw_boek.py)."""
import io, os, random, sys
from collections import deque
import segno
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

HIER = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HIER)
import inhoud as I

G = '/usr/share/fonts/truetype/google-fonts/'; C = '/usr/share/fonts/truetype/crosextra/'
for n, f in [('PopB', G + 'Poppins-Bold.ttf'), ('PopM', G + 'Poppins-Medium.ttf'), ('PopR', G + 'Poppins-Regular.ttf'),
             ('Car', C + 'Carlito-Regular.ttf'), ('CarB', C + 'Carlito-Bold.ttf'), ('CarI', C + 'Carlito-Italic.ttf')]:
    pdfmetrics.registerFont(TTFont(n, f))
from reportlab.pdfbase.pdfmetrics import registerFontFamily
registerFontFamily('Car', normal='Car', bold='CarB', italic='CarI', boldItalic='CarB')

W, H = 6 * inch, 9 * inch
BIN, BUIT, BOV, OND = 0.72 * inch, 0.52 * inch, 0.72 * inch, 0.72 * inch
FW = W - BIN - BUIT
ZWART, DONKER, MID, LICHT, VLAK = HexColor('#111111'), HexColor('#333333'), HexColor('#8A8A8A'), HexColor('#DADADA'), HexColor('#EFEFEF')


def st(naam, font='Car', size=12, lead=None, kleur=ZWART, al=TA_LEFT, **k):
    return ParagraphStyle(naam, fontName=font, fontSize=size, leading=lead or size * 1.3, textColor=kleur, alignment=al, **k)


S = dict(body=st('body', size=12.5, lead=17), bodyc=st('bodyc', size=12.5, lead=17, al=TA_CENTER), kop=st('kop', 'PopB', 22, 27),
         sub=st('sub', 'PopB', 13.5, 18), klein=st('klein', size=10.5, lead=13.5), kleinc=st('kleinc', size=10.5, lead=13.5, al=TA_CENTER),
         cel=st('cel', 'PopM', 8.6, 10.4, al=TA_CENTER), tab=st('tab', size=11.5, lead=14.5), tabb=st('tabb', 'CarB', 11.5, 14.5))


def x0(n):  # linkerrand van het zetvlak; oneven = rechterpagina (binnenmarge links)
    return BIN if n % 2 == 1 else BUIT


def P(c, tekst, stijl, x, ytop, w):
    p = Paragraph(tekst, stijl); _, h = p.wrap(w, 2000); p.drawOn(c, x, ytop - h); return h


def hoogte(tekst, stijl, w):
    return Paragraph(tekst, stijl).wrap(w, 2000)[1]


def mid_tekst(c, tekst, font, size, x, y, kleur=ZWART, spatie=0):
    c.setFillColor(kleur); t = c.beginText(); t.setFont(font, size); t.setCharSpace(spatie)
    w = pdfmetrics.stringWidth(tekst, font, size) + spatie * (len(tekst) - 1); t.setTextOrigin(x - w / 2, y); t.textLine(tekst)
    t.setCharSpace(0); c.drawText(t)  # tekenafstand is PDF-tekststatus en blijft anders hangen in de volgende alinea's


def tekst(c, s, font, size, x, y, kleur=ZWART, spatie=0):
    c.setFillColor(kleur); t = c.beginText(); t.setFont(font, size); t.setCharSpace(spatie); t.setTextOrigin(x, y); t.textLine(s)
    t.setCharSpace(0); c.drawText(t)


def vakje(c, x, y, s=0.16 * inch):
    c.setStrokeColor(ZWART); c.setLineWidth(0.9); c.roundRect(x, y, s, s, 2, stroke=1, fill=0)


def lijn(c, x1, y, x2, kleur=MID, dik=0.6):
    c.setStrokeColor(kleur); c.setLineWidth(dik); c.line(x1, y, x2, y)


PAGINAS = []  # (functie(c, n), kopregel of None)
TEIL_START = {}


def pagina(kop=None):
    def deco(f):
        PAGINAS.append((f, kop)); return f
    return deco


def voeg(f, kop=None):
    PAGINAS.append((f, kop))


def kop_titel(c, n, titel, ondertitel=None):
    y = H - BOV - 0.05 * inch
    h = P(c, titel, S['kop'], x0(n), y, FW)
    y -= h + 4
    if ondertitel:
        y -= 2; y -= P(c, ondertitel, st('ot', size=12, lead=15.5, kleur=DONKER), x0(n), y, FW)
    c.setFillColor(ZWART); c.rect(x0(n), y - 9, 0.55 * inch, 3, stroke=0, fill=1)
    return y - 24


# ---------------------------------------------------------------- voorwerk
@pagina()
def titelpagina(c, n):
    mid_tekst(c, 'ICH TU NUR', 'PopB', 40, W / 2, H - 2.9 * inch)
    mid_tekst(c, 'SO, ALS OB', 'PopB', 40, W / 2, H - 3.5 * inch)
    mid_tekst(c, I.UNTERTITEL, 'PopM', 15, W / 2, H - 4.15 * inch, DONKER)
    lijn(c, W / 2 - 0.4 * inch, H - 4.5 * inch, W / 2 + 0.4 * inch, ZWART, 1.5)
    mid_tekst(c, I.AUTOR.upper(), 'PopB', 13, W / 2, 1.6 * inch, ZWART, 3)


@pagina()
def impressum(c, n):
    regels = ['Copyright © 2026 David Warrior. Alle Rechte vorbehalten.',
              'Dieses Buch darf ohne schriftliche Genehmigung des Autors weder ganz noch in Teilen vervielfältigt werden. '
              'Ausgenommen sind kurze Zitate für Rezensionen.',
              'Alle Figuren, Firmen und Situationen in diesem Buch sind frei erfunden. Ähnlichkeiten mit deinem Büro, deinem Chef '
              'oder deinem Kollegen am Fenster sind rein zufällig. Ehrlich.',
              'Die Tests in diesem Buch sind zur Unterhaltung gedacht und ersetzen keine Beratung, keinen Urlaub und keinen Kaffee.',
              'Erste Auflage 2026']
    y = 3.2 * inch
    for r in regels:
        y -= P(c, r, st('imp', size=9.5, lead=12.5, kleur=DONKER), x0(n), y, FW) + 8


@pagina()
def widmung(c, n):
    y = H - 1.3 * inch
    mid_tekst(c, 'EIN GESCHENK', 'PopB', 26, W / 2, y); y -= 0.55 * inch
    for lab in ['Für:', 'Von:']:
        tekst(c, lab, 'PopB', 14, x0(n), y); lijn(c, x0(n) + 0.65 * inch, y - 2, x0(n) + FW, ZWART, 0.8); y -= 0.55 * inch
    y -= 0.05 * inch
    tekst(c, 'Weil …', 'PopB', 14, x0(n), y); y -= 0.42 * inch
    for g in I.WIDMUNG_GRUENDE:
        vakje(c, x0(n), y - 2); tekst(c, g, 'Car', 13, x0(n) + 0.3 * inch, y); y -= 0.37 * inch
    vakje(c, x0(n), y - 2); tekst(c, 'du', 'Car', 13, x0(n) + 0.3 * inch, y); lijn(c, x0(n) + 0.55 * inch, y - 2, x0(n) + FW, ZWART, 0.8)
    y -= 0.62 * inch
    P(c, 'Lies es heimlich im nächsten Meeting. Ich verrate dich nicht.', st('w', 'CarI', 12.5, 16, DONKER, TA_CENTER), x0(n), y, FW)


@pagina()
def vorwort(c, n):
    y = kop_titel(c, n, 'Bevor du anfängst')
    for t in I.VORWORT:
        y -= P(c, t, S['body'], x0(n), y, FW) + 10
    y -= 6
    c.setFillColor(VLAK); c.roundRect(x0(n), y - 1.05 * inch, FW, 1.05 * inch, 8, stroke=0, fill=1)
    P(c, '<b>Tipp:</b> Alle Seiten zum Ausfüllen kannst du kopieren. So reicht das Bingo für ein ganzes Jahr voller Meetings.',
      st('tip', size=12, lead=16), x0(n) + 0.2 * inch, y - 0.2 * inch, FW - 0.4 * inch)


@pagina()
def inhaltsverzeichnis(c, n):
    y = kop_titel(c, n, 'Inhalt')
    for i, (t, _) in enumerate(I.TEILE):
        p = TEIL_START[i]
        tekst(c, f'{i + 1:02d}', 'PopB', 12, x0(n), y, MID); tekst(c, t, 'PopM', 12.5, x0(n) + 0.45 * inch, y)
        w = pdfmetrics.stringWidth(str(p), 'PopB', 12.5); tekst(c, str(p), 'PopB', 12.5, x0(n) + FW - w, y)
        y -= 0.43 * inch
    for t, k in [('Urkunde', 'urkunde'), ('Lösungen', 'loesung')]:
        tekst(c, t, 'PopM', 12.5, x0(n) + 0.45 * inch, y); p = TEIL_START[k]
        w = pdfmetrics.stringWidth(str(p), 'PopB', 12.5); tekst(c, str(p), 'PopB', 12.5, x0(n) + FW - w, y); y -= 0.43 * inch


@pagina()
def eid(c, n):
    y = kop_titel(c, n, 'Der Büro-Eid', 'Bitte rechte Hand auf die Kaffeetasse legen und laut vorlesen. Oder leise. Hauptsache feierlich.')
    y -= 6
    for i, r in enumerate(I.EID):
        y -= P(c, r, st('eid', 'PopM' if i == 0 or i == len(I.EID) - 1 else 'Car', 14, 19), x0(n) + (0 if i == 0 else 0.25 * inch), y, FW - 0.25 * inch) + 9
    y -= 0.35 * inch
    for lab in ['Unterschrift', 'Datum']:
        lijn(c, x0(n), y, x0(n) + 2.6 * inch, ZWART, 0.8); tekst(c, lab, 'Car', 10, x0(n), y - 13, MID); y -= 0.6 * inch


# ---------------------------------------------------------------- teil-titel
def teil_pagina(i):
    titel, intro = I.TEILE[i]

    def f(c, n):
        mid_tekst(c, f'{i + 1:02d}', 'PopB', 170, W / 2 + (0.2 if n % 2 else -0.2) * inch, H - 3.3 * inch, VLAK)
        mid_tekst(c, f'TEIL {i + 1}', 'PopB', 11, W / 2, H - 3.75 * inch, MID, 3)
        P(c, titel, st('tt', 'PopB', 25, 30, ZWART, TA_CENTER), x0(n), H - 3.95 * inch, FW)
        # notitieblaadje met de intro
        c.saveState(); c.translate(W / 2, 2.35 * inch); c.rotate(-2.5)
        s = 3.3 * inch
        c.setFillColor(HexColor('#E4E4E4')); c.rect(-s / 2 + 3, -s / 2 - 3, s, s, stroke=0, fill=1)
        c.setFillColor(VLAK); c.rect(-s / 2, -s / 2, s, s, stroke=0, fill=1)
        c.setFillColor(LICHT); c.rect(-s / 2, s / 2 - 0.32 * inch, s, 0.32 * inch, stroke=0, fill=1)
        P(c, intro, st('in', 'PopM', 12.5, 18, ZWART, TA_CENTER), -s / 2 + 0.3 * inch, s / 2 - 0.62 * inch, s - 0.6 * inch)
        c.restoreState()
    TEIL_START[i] = len(PAGINAS) + 1
    voeg(f)


def lijst_paginas(items, maak, kop, eerste=None, ruimte=10, start_y=None):
    """items -> blokken met gemeten hoogte -> pagina's. maak(c, x, y, item) tekent en geeft hoogte; maak(None, ...) meet."""
    bruikbaar = H - BOV - OND
    pag, cur, h_cur = [], [], 0
    eerste_h = eerste[1] if eerste else 0
    for it in items:
        h = maak(None, 0, 0, it) + ruimte
        cap = bruikbaar - (eerste_h if not pag else 0)
        if h_cur + h > cap and cur:
            pag.append(cur); cur, h_cur = [], 0
        cur.append(it); h_cur += h
    if cur:
        pag.append(cur)
    if not eerste and len(pag) > 1:  # gelijk verdelen, zodat de laatste pagina niet half leeg is
        per = -(-len(items) // len(pag)); gelijk = [items[i:i + per] for i in range(0, len(items), per)]
        if len(gelijk) == len(pag) and all(sum(maak(None, 0, 0, it) + ruimte for it in g) <= bruikbaar for g in gelijk):
            pag = gelijk
    for k, groep in enumerate(pag):
        def f(c, n, groep=groep, k=k):
            y = H - BOV
            if k == 0 and eerste:
                y = eerste[0](c, n)
            for it in groep:
                y -= maak(c, x0(n), y, it) + ruimte
        voeg(f, kop)
    return len(pag)


# ---------------------------------------------------------------- 1 Übersetzer
teil_pagina(0)


def ue_rij(c, x, y, it):
    links, rechts = it; wl, wr = FW * 0.5, FW * 0.5
    hl = hoogte(links, S['tab'], wl - 14); hr = hoogte(rechts, S['tabb'], wr - 14); h = max(hl, hr) + 14
    if c:
        c.setFillColor(VLAK); c.roundRect(x + wl, y - h, wr, h, 5, stroke=0, fill=1)
        P(c, links, S['tab'], x + 2, y - 7, wl - 14); P(c, rechts, S['tabb'], x + wl + 10, y - 7, wr - 18)
    return h


def ue_kop(c, n):
    y = H - BOV
    tekst(c, 'WAS SIE SAGEN', 'PopB', 9, x0(n) + 2, y - 8, MID, 1.5); tekst(c, 'WAS SIE MEINEN', 'PopB', 9, x0(n) + FW / 2 + 10, y - 8, MID, 1.5)
    return y - 22


def ue_alle():
    bruikbaar = H - BOV - OND - 22
    pag, cur, hc = [], [], 0
    for it in I.UEBERSETZER:
        h = ue_rij(None, 0, 0, it) + 6
        if hc + h > bruikbaar and cur:
            pag.append(cur); cur, hc = [], 0
        cur.append(it); hc += h
    pag.append(cur)
    for groep in pag:
        def f(c, n, groep=groep):
            y = ue_kop(c, n)
            for it in groep:
                y -= ue_rij(c, x0(n), y, it) + 6
        voeg(f, I.TEILE[0][0])


ue_alle()

# ---------------------------------------------------------------- 2 Ausreden
teil_pagina(1)


@pagina(I.TEILE[1][0])
def generator1(c, n):
    y = kop_titel(c, n, 'Bau dir deine Ausrede', 'Nimm aus jeder Spalte einen Teil. Augen zu und mit dem Finger tippen, oder nimm drei Zahlen von 1 bis 20: '
                  'dein Geburtstag (ab 21 ziehst du 20 ab), die Minuten der Uhrzeit (so lange 20 abziehen, bis es passt) und die Zahl deiner offenen Browser-Tabs.')
    y -= 2
    c.setFillColor(VLAK); c.roundRect(x0(n), y - 0.62 * inch, FW, 0.62 * inch, 6, stroke=0, fill=1)
    P(c, '„Sorry, ich schaffe es heute leider nicht, weil <b>[A]</b> <b>[B]</b>, <b>[C]</b>“', st('fo', 'Car', 13, 17), x0(n) + 0.15 * inch, y - 0.12 * inch, FW - 0.3 * inch)
    y -= 0.62 * inch + 14
    wa = FW * 0.38; wb = FW - wa
    tekst(c, 'A', 'PopB', 12, x0(n), y); tekst(c, 'B', 'PopB', 12, x0(n) + wa, y); y -= 8
    rij = (y - OND) / 20
    for i in range(20):
        yy = y - i * rij - rij * 0.72
        if i % 2 == 0:
            c.setFillColor(VLAK); c.rect(x0(n), y - (i + 1) * rij, FW, rij, stroke=0, fill=1)
        tekst(c, str(i + 1), 'PopB', 8.5, x0(n) + 2, yy, MID); tekst(c, I.AUSREDE_A[i], 'Car', 10.5, x0(n) + 0.24 * inch, yy)
        tekst(c, str(i + 1), 'PopB', 8.5, x0(n) + wa, yy, MID); tekst(c, I.AUSREDE_B[i], 'Car', 10.5, x0(n) + wa + 0.24 * inch, yy)


@pagina(I.TEILE[1][0])
def generator2(c, n):
    y = H - BOV
    tekst(c, 'C', 'PopB', 12, x0(n), y - 10); y -= 18
    rij = 0.29 * inch
    for i in range(20):
        yy = y - i * rij - rij * 0.7
        if i % 2 == 0:
            c.setFillColor(VLAK); c.rect(x0(n), y - (i + 1) * rij, FW, rij, stroke=0, fill=1)
        tekst(c, str(i + 1), 'PopB', 8.5, x0(n) + 2, yy, MID); tekst(c, I.AUSREDE_C[i], 'Car', 10.5, x0(n) + 0.24 * inch, yy)
    y -= 20 * rij + 0.3 * inch
    y -= P(c, '<b>Beispiel 7 · 3 · 12:</b> „Sorry, ich schaffe es heute leider nicht, weil mein Paketbote spontan in Rente gegangen ist, '
           'und der Kundendienst ist bis Januar im Urlaub.“', S['body'], x0(n), y, FW) + 18
    tekst(c, 'Meine beste Ausrede bisher:', 'PopB', 12, x0(n), y); y -= 0.42 * inch
    for _ in range(3):
        lijn(c, x0(n), y, x0(n) + FW); y -= 0.36 * inch


def ausrede_blok(c, x, y, it):
    titel, regels = it
    h = 0
    st_t = st('at', 'PopB', 13, 17); st_r = st('ar', 'Car', 11.5, 14.6)
    h += hoogte(titel, st_t, FW) + 6
    zin = lambda r: '„' + r.replace(' (', '“ <i>(', 1) + '</i>' if ' (' in r else '„' + r + '“'  # regieaanwijzing buiten de aanhalingstekens
    hs = [hoogte(zin(r), st_r, FW - 0.28 * inch) + 5 for r in regels]
    if c:
        y2 = y - P(c, titel, st_t, x, y, FW) - 6
        for r, hr in zip(regels, hs):
            c.setFillColor(ZWART); c.circle(x + 4, y2 - 7.5, 2.2, stroke=0, fill=1)
            P(c, zin(r), st_r, x + 0.18 * inch, y2, FW - 0.28 * inch)
            y2 -= hr
    return h + sum(hs)


def ausreden_eerste(c, n):
    return kop_titel(c, n, 'Fertige Ausreden', 'Für alle, die keine Zeit haben, sich eine auszudenken.')


lijst_paginas(I.AUSREDEN_FERTIG, ausrede_blok, I.TEILE[1][0], eerste=(ausreden_eerste, 1.05 * inch), ruimte=14)

# ---------------------------------------------------------------- 3 Bingo
teil_pagina(2)


@pagina(I.TEILE[2][0])
def bingo_regels(c, n):
    y = kop_titel(c, n, 'Die Regeln')
    for t, u in I.BINGO_REGELN:
        y -= P(c, t, S['sub'], x0(n), y, FW) + 4
        y -= P(c, u, S['body'], x0(n), y, FW) + 16
    y -= 4
    c.setFillColor(VLAK); c.roundRect(x0(n), y - 1.05 * inch, FW, 1.05 * inch, 8, stroke=0, fill=1)
    P(c, '<b>Strichliste:</b> So oft habe ich schon gewonnen:', st('sl', size=12, lead=16), x0(n) + 0.2 * inch, y - 0.18 * inch, FW - 0.4 * inch)


def bingo_kaart(titel, frei, vakken, leeg=False):
    def f(c, n):
        y = H - BOV
        mid_tekst(c, titel.upper(), 'PopB', 20, x0(n) + FW / 2, y - 18, ZWART, 1)
        if not leeg:
            mid_tekst(c, 'B   I   N   G   O', 'PopB', 11, x0(n) + FW / 2, y - 38, MID)
        else:
            tekst(c, 'Für:', 'PopM', 10.5, x0(n), y - 40, DONKER); lijn(c, x0(n) + 0.35 * inch, y - 42, x0(n) + FW, MID)
        cel = FW / 5; top = y - 0.78 * inch
        r = random.Random(titel); vs = list(vakken); r.shuffle(vs) if vs else None
        k = 0
        for rij in range(5):
            for kol in range(5):
                xx = x0(n) + kol * cel; yy = top - (rij + 1) * cel
                midden = rij == 2 and kol == 2
                if midden:
                    c.setFillColor(LICHT); c.rect(xx, yy, cel, cel, stroke=0, fill=1)
                    mid_tekst(c, 'FREI', 'PopB', 12, xx + cel / 2, yy + cel / 2 + 1)
                    if frei:
                        mid_tekst(c, frei, 'Car', 8.5, xx + cel / 2, yy + cel / 2 - 11, DONKER)
                elif not leeg:
                    sz = 8.6  # kleiner zetten tot het langste woord in het vak past (geen afgebroken woorden)
                    while max(pdfmetrics.stringWidth(wd + '-', 'PopM', sz) for wd in vs[k].replace('\xad', ' ').split()) > cel - 10 and sz > 6.5:  # \xad = zacht afbreekstreepje
                        sz -= 0.2
                    p = Paragraph(vs[k], st('cel', 'PopM', sz, sz * 1.21, ZWART, TA_CENTER)); _, hh = p.wrap(cel - 8, cel)
                    p.drawOn(c, xx + 4, yy + (cel - hh) / 2); k += 1
        c.setStrokeColor(ZWART); c.setLineWidth(1.4)
        for i in range(6):
            c.line(x0(n), top - i * cel, x0(n) + FW, top - i * cel); c.line(x0(n) + i * cel, top, x0(n) + i * cel, top - 5 * cel)
        yb = top - 5 * cel - 0.3 * inch
        if leeg:
            P(c, 'Schreib in jedes Feld einen Satz, den du in deinem Büro ständig hörst. Dann tauschst du die Karte mit einem Kollegen.',
              S['kleinc'], x0(n), yb, FW)
        else:
            tekst(c, 'Datum:', 'PopM', 10, x0(n), yb - 4, DONKER); lijn(c, x0(n) + 0.55 * inch, yb - 6, x0(n) + 2.1 * inch, MID)
            tekst(c, 'Gewonnen um:', 'PopM', 10, x0(n) + 2.4 * inch, yb - 4, DONKER); lijn(c, x0(n) + 3.4 * inch, yb - 6, x0(n) + FW, MID)
    return f


for titel, frei, vakken in I.BINGO:
    assert len(vakken) == 24, (titel, len(vakken))
    voeg(bingo_kaart(titel, frei, vakken), I.TEILE[2][0])
voeg(bingo_kaart('Dein eigenes Bingo', '', [], leeg=True), I.TEILE[2][0])
voeg(bingo_kaart('Noch ein eigenes Bingo', '', [], leeg=True), I.TEILE[2][0])

# ---------------------------------------------------------------- 4 Tests
teil_pagina(3)
UE_PAGINA = TEIL_START[0] + 1


def test_paginas(t):
    def vragen(c, n, deel):
        y = kop_titel(c, n, t['titel'], t['uitleg']) if deel == 0 else H - BOV - 0.1 * inch
        reeks = list(enumerate(t['fragen']))[deel * 4:(deel + 1) * 4]
        for vs, os_, gap in [(13, 12.5, 16), (12.5, 12, 13), (12, 11.5, 10), (11.5, 11, 8)]:  # grootste maat die op de pagina past
            stv = st('tv', 'PopB', vs, vs * 1.3); sto = st('to', 'Car', os_, os_ * 1.24)
            tot = sum(hoogte(f'{i + 1}. {v}', stv, FW) + 4 + sum(hoogte(f'<b>A</b>&nbsp; {o}', sto, FW - 0.4 * inch) + 4 for o in opts) + gap
                      for i, (v, opts) in reeks)
            if y - tot >= OND:
                break
        assert y - tot >= OND - 4, t['titel']
        for i, (v, opts) in reeks:
            y -= P(c, f'{i + 1}. {v}', stv, x0(n), y, FW) + 4
            for j, o in enumerate(opts):
                vakje(c, x0(n) + 0.12 * inch, y - os_ * 0.98, 0.14 * inch)
                y -= P(c, f'<b>{"ABC"[j]}</b>&nbsp; {o}', sto, x0(n) + 0.4 * inch, y, FW - 0.4 * inch) + 4
            y -= gap

    def uitslag(c, n):
        y = kop_titel(c, n, 'Auswertung', t['titel'])
        if t.get('loesung'):
            y -= P(c, 'Richtig ist: ' + ' · '.join(f'{i + 1}{a}' for i, a in enumerate(t['loesung'])), st('lo', 'PopB', 12, 16), x0(n), y, FW) + 14
        else:
            tekst(c, 'Meine Punkte / mein Buchstabe:', 'PopM', 11.5, x0(n), y - 10); c.setStrokeColor(ZWART); c.setLineWidth(1)
            c.roundRect(x0(n) + 2.75 * inch, y - 18, 0.8 * inch, 0.32 * inch, 4); y -= 0.55 * inch
        for kop, txt in t['ergebnis']:
            hk = hoogte(kop, S['sub'], FW - 0.4 * inch); ht = hoogte(txt.replace('{UE}', str(UE_PAGINA)), S['body'], FW - 0.4 * inch)
            hb = hk + ht + 0.4 * inch
            c.setFillColor(VLAK); c.roundRect(x0(n), y - hb, FW, hb, 8, stroke=0, fill=1)
            P(c, kop, S['sub'], x0(n) + 0.2 * inch, y - 0.17 * inch, FW - 0.4 * inch)
            P(c, txt.replace('{UE}', str(UE_PAGINA)), S['body'], x0(n) + 0.2 * inch, y - 0.17 * inch - hk - 5, FW - 0.4 * inch)
            y -= hb + 14
    voeg(lambda c, n: vragen(c, n, 0), I.TEILE[3][0]); voeg(lambda c, n: vragen(c, n, 1), I.TEILE[3][0]); voeg(uitslag, I.TEILE[3][0])


for t in I.TESTS:
    test_paginas(t)


def horoskop(deel):
    def f(c, n):
        y = kop_titel(c, n, 'Dein Büro-Horoskop', 'Die Sterne haben in deinen Kalender geschaut. Für das neue Jahr sagen sie Folgendes voraus.') if deel == 0 else H - BOV
        for zeichen, datum, txt in I.HOROSKOP[deel * 6:(deel + 1) * 6]:
            tekst(c, zeichen, 'PopB', 13.5, x0(n), y - 13); tekst(c, datum, 'PopM', 9.5, x0(n) + pdfmetrics.stringWidth(zeichen, 'PopB', 13.5) + 8, y - 13, MID)
            y -= 0.27 * inch
            y -= P(c, txt, st('hk', 'Car', 11.5, 15), x0(n), y, FW) + 14
        assert y >= OND - 4, 'horoskop'
    voeg(f, I.TEILE[3][0])


horoskop(0); horoskop(1)

# ---------------------------------------------------------------- 5 Rätsel
teil_pagina(4)
OPLOSSINGEN = {'ws': [], 'lab': []}
VUL = 'EEEEEENNNNIIIISSSRRRAAATTTDDHHUULLCCGGMMOOBBWFKZPV'


def maak_wortsuche(titel, woorden, moeilijk, N=14):
    r = random.Random('ws' + titel)
    dirs = [(1, 0), (0, 1), (1, 1)] + ([(-1, 0), (0, -1), (1, -1), (-1, -1), (-1, 1)] if moeilijk else [])
    for poging in range(500):
        g = [[None] * N for _ in range(N)]; plek = {}; ok = True
        for w in sorted(woorden, key=len, reverse=True):
            gezet = False
            for _ in range(400):
                dx, dy = r.choice(dirs); x = r.randrange(N); y = r.randrange(N)
                ex, ey = x + dx * (len(w) - 1), y + dy * (len(w) - 1)
                if not (0 <= ex < N and 0 <= ey < N):
                    continue
                if all(g[y + dy * i][x + dx * i] in (None, w[i]) for i in range(len(w))):
                    for i in range(len(w)):
                        g[y + dy * i][x + dx * i] = w[i]
                    plek[w] = (x, y, ex, ey); gezet = True; break
            if not gezet:
                ok = False; break
        if ok:
            vul = VUL + ('ÄÖÜÜ' if any(ch in 'ÄÖÜ' for w in woorden for ch in w) else '')
            for y in range(N):
                for x in range(N):
                    if g[y][x] is None:
                        g[y][x] = r.choice(vul)
            return g, plek
    raise RuntimeError(titel)


def teken_grid(c, g, x, ytop, cel, font, plek=None):
    N = len(g)
    if plek:
        c.setStrokeColor(LICHT); c.setLineWidth(cel * 0.72); c.setLineCap(1)
        for (sx, sy, ex, ey) in plek.values():
            c.line(x + (sx + 0.5) * cel, ytop - (sy + 0.5) * cel, x + (ex + 0.5) * cel, ytop - (ey + 0.5) * cel)
        c.setLineCap(0)
    for yy in range(N):
        for xx in range(N):
            mid_tekst(c, g[yy][xx], font, cel * 0.52, x + (xx + 0.5) * cel, ytop - (yy + 0.5) * cel - cel * 0.18)
    c.setStrokeColor(ZWART); c.setLineWidth(1.2); c.roundRect(x - 4, ytop - N * cel - 4, N * cel + 8, N * cel + 8, 6)


def wortsuche_pagina(titel, woorden, moeilijk):
    g, plek = maak_wortsuche(titel, woorden, moeilijk)
    OPLOSSINGEN['ws'].append((titel, g, plek))

    def f(c, n):
        y = kop_titel(c, n, 'Wortsuche: ' + titel, 'Die Wörter stehen waagerecht, senkrecht und diagonal' + (', auch rückwärts.' if moeilijk else '.'))
        cel = (FW - 8) / 14
        teken_grid(c, g, x0(n) + 4, y - 4, cel, 'PopM')
        y -= 14 * cel + 0.32 * inch
        kol = 3; bw = FW / kol
        for i, w in enumerate(sorted(woorden)):
            xx = x0(n) + (i % kol) * bw; yy = y - (i // kol) * 0.27 * inch
            vakje(c, xx, yy - 2, 0.12 * inch); tekst(c, w, 'PopM', 10.5, xx + 0.2 * inch, yy)
    voeg(f, I.TEILE[4][0])


for t, w, m in I.WORTSUCHE:
    wortsuche_pagina(t, w, m)


def maak_maze(cols, rows, seed):
    r = random.Random(seed)
    muur = {(x, y): {'N', 'S', 'E', 'W'} for x in range(cols) for y in range(rows)}
    stap = {'N': (0, -1, 'S'), 'S': (0, 1, 'N'), 'E': (1, 0, 'W'), 'W': (-1, 0, 'E')}
    gezien = {(0, 0)}; stapel = [(0, 0)]
    while stapel:
        x, y = stapel[-1]
        opties = [(d, x + dx, y + dy, o) for d, (dx, dy, o) in stap.items() if 0 <= x + dx < cols and 0 <= y + dy < rows and (x + dx, y + dy) not in gezien]
        if not opties:
            stapel.pop(); continue
        d, nx, ny, o = r.choice(opties)
        muur[(x, y)].discard(d); muur[(nx, ny)].discard(o); gezien.add((nx, ny)); stapel.append((nx, ny))
    # pad
    prev = {(0, 0): None}; q = deque([(0, 0)])
    while q:
        x, y = q.popleft()
        for d, (dx, dy, o) in stap.items():
            if d not in muur[(x, y)] and (x + dx, y + dy) not in prev:
                prev[(x + dx, y + dy)] = (x, y); q.append((x + dx, y + dy))
    pad = []; p = (cols - 1, rows - 1)
    while p:
        pad.append(p); p = prev[p]
    return muur, pad[::-1]


def teken_maze(c, muur, cols, rows, x, ytop, cel, pad=None, dik=1.6):
    if pad:
        c.setStrokeColor(MID); c.setLineWidth(cel * 0.3); c.setLineCap(1); c.setLineJoin(1)
        pth = c.beginPath(); pth.moveTo(x + 0.5 * cel, ytop + 0.2 * cel)
        for (px, py) in pad:
            pth.lineTo(x + (px + 0.5) * cel, ytop - (py + 0.5) * cel)
        pth.lineTo(x + (cols - 0.5) * cel, ytop - rows * cel - 0.2 * cel); c.drawPath(pth, stroke=1, fill=0); c.setLineCap(0)
    c.setStrokeColor(ZWART); c.setLineWidth(dik); c.setLineCap(2)
    for (cx, cy), m in muur.items():
        X = x + cx * cel; Y = ytop - cy * cel
        if 'N' in m and not (cx == 0 and cy == 0):
            c.line(X, Y, X + cel, Y)
        if 'W' in m:
            c.line(X, Y, X, Y - cel)
        if cy == rows - 1 and 'S' in m and not (cx == cols - 1):
            c.line(X, Y - cel, X + cel, Y - cel)
        if cx == cols - 1 and 'E' in m:
            c.line(X + cel, Y, X + cel, Y - cel)
    c.setLineCap(0)


MAZE_MATEN = [(12, 14), (14, 17), (16, 19), (18, 22)]


def maze_pagina(i, titel, uitleg, start, doel):
    cols, rows = MAZE_MATEN[i]; muur, pad = maak_maze(cols, rows, 'maze' + titel)
    OPLOSSINGEN['lab'].append((titel, muur, cols, rows, pad))

    def f(c, n):
        y = kop_titel(c, n, 'Labyrinth: ' + titel, uitleg)
        beschik_h = y - OND - 0.6 * inch
        cel = min(FW / cols, beschik_h / rows); bx = x0(n) + (FW - cols * cel) / 2
        ytop = y - 0.3 * inch
        tekst(c, 'START: ' + start.upper(), 'PopB', 9, bx, ytop + 0.1 * inch, ZWART, 1)
        teken_maze(c, muur, cols, rows, bx, ytop, cel)
        s = 'ZIEL: ' + doel.upper(); w = pdfmetrics.stringWidth(s, 'PopB', 9) + len(s)
        tekst(c, s, 'PopB', 9, bx + cols * cel - w, ytop - rows * cel - 0.22 * inch, ZWART, 1)
    voeg(f, I.TEILE[4][0])


for i, (t, u, s, d) in enumerate(I.LABYRINTHE):
    maze_pagina(i, t, u, s, d)

SALAT_GEMIXT = []
_r = random.Random('salat')
for w, hint in I.SALAT:
    for _ in range(100):
        l = list(w); _r.shuffle(l); m = ''.join(l)
        if m != w and m[:2] != w[:2]:
            break
    SALAT_GEMIXT.append((m, hint, w))


def salat_pagina(deel):
    def f(c, n):
        y = kop_titel(c, n, 'Buchstabensalat' + (' (Fortsetzung)' if deel else ''),
                      'Bring die Buchstaben in die richtige Reihenfolge. Der Hinweis hilft. Ein bisschen.')
        stap = (y - OND) / 12
        for i, (m, hint, w) in enumerate(SALAT_GEMIXT[deel * 12:(deel + 1) * 12]):
            nr = deel * 12 + i + 1
            tekst(c, f'{nr}.', 'PopB', 11, x0(n), y - 12, MID)
            tekst(c, ' '.join(m), 'PopB', 12.5, x0(n) + 0.35 * inch, y - 12)
            tekst(c, hint, 'CarI', 10.5, x0(n) + 0.35 * inch, y - 25, DONKER)
            lijn(c, x0(n) + FW * 0.55, y - 14, x0(n) + FW, MID)
            y -= stap
    voeg(f, I.TEILE[4][0])


salat_pagina(0); salat_pagina(1)

# ---------------------------------------------------------------- 6 Ausfüllen
teil_pagina(5)


def veld(c, x, y, lab, w, breed=None):
    tekst(c, lab, 'PopM', 11, x, y); lw = pdfmetrics.stringWidth(lab, 'PopM', 11)
    lijn(c, x + lw + 6, y - 2, x + (breed or w), MID); return 0.42 * inch


def keuze(c, x, y, lab, opties, w):
    tekst(c, lab, 'PopM', 11, x, y); y -= 0.3 * inch; xx = x
    for o in opties:
        ow = pdfmetrics.stringWidth(o, 'Car', 11) + 0.35 * inch
        if xx + ow > x + w:
            xx = x; y -= 0.28 * inch
        vakje(c, xx, y - 2, 0.13 * inch); tekst(c, o, 'Car', 11, xx + 0.2 * inch, y); xx += ow + 0.1 * inch
    return y


def steckbrief(nr):
    def f(c, n):
        y = kop_titel(c, n, f'Kollegen-Steckbrief {nr}', 'Für die Personalakte, die es nie geben wird.')
        c.setStrokeColor(ZWART); c.setLineWidth(1); c.rect(x0(n) + FW - 1.35 * inch, y - 1.55 * inch, 1.35 * inch, 1.55 * inch)
        mid_tekst(c, 'Foto oder', 'Car', 9.5, x0(n) + FW - 0.675 * inch, y - 0.72 * inch, MID); mid_tekst(c, 'Zeichnung', 'Car', 9.5, x0(n) + FW - 0.675 * inch, y - 0.88 * inch, MID)
        bw = FW - 1.5 * inch
        for lab in ['Name:', 'Spitzname im Büro:', 'Abteilung:', 'Im Büro seit:']:
            y -= veld(c, x0(n), y - 12, lab, bw)
        y -= 0.1 * inch
        y = keuze(c, x0(n), y - 12, 'Kaffee:', ['schwarz', 'mit Milch', 'mit Zucker', 'Tee, bitte', 'nur mit Kuchen'], FW) - 0.42 * inch
        y = keuze(c, x0(n), y, 'Schreibtisch:', ['ordentlich', 'kreativ', 'Fundbüro', 'archäologische Ausgrabung'], FW) - 0.42 * inch
        for lab in ['Lieblingssatz im Meeting:', 'Geheimes Talent:', 'Superkraft im Büro:', 'Macht im Notfall:', 'Kann ich immer fragen nach:', 'Das sollte jeder über sie/ihn wissen:']:
            y -= veld(c, x0(n), y, lab, FW)
        y -= 0.05 * inch; lijn(c, x0(n), y, x0(n) + FW, MID)
    return f


voeg(steckbrief(1), I.TEILE[5][0]); voeg(steckbrief(2), I.TEILE[5][0])


def protokoll(c, n):
    y = kop_titel(c, n, 'Meeting-Protokoll für Ehrliche', 'Das offizielle Protokoll schreibt jemand anders. Dieses hier ist das wahre.')
    for lab in ['Datum:', 'Thema laut Einladung:']:
        y -= veld(c, x0(n), y - 12, lab, FW)
    tekst(c, 'Geplante Dauer:', 'PopM', 11, x0(n), y - 12); lijn(c, x0(n) + 1.2 * inch, y - 14, x0(n) + 2.2 * inch, MID)
    tekst(c, 'Echte Dauer:', 'PopM', 11, x0(n) + 2.45 * inch, y - 12); lijn(c, x0(n) + 3.4 * inch, y - 14, x0(n) + FW, MID); y -= 0.42 * inch
    tekst(c, 'Anwesend:', 'PopM', 11, x0(n), y - 12); tekst(c, 'davon wach:', 'PopM', 11, x0(n) + 2.45 * inch, y - 12)
    lijn(c, x0(n) + 0.85 * inch, y - 14, x0(n) + 2.2 * inch, MID); lijn(c, x0(n) + 3.35 * inch, y - 14, x0(n) + FW, MID); y -= 0.55 * inch
    hw = FW / 2 - 6
    tekst(c, 'Was gesagt wurde', 'PopB', 11, x0(n), y); tekst(c, 'Was gemeint war', 'PopB', 11, x0(n) + FW / 2 + 6, y); y -= 0.32 * inch
    for _ in range(4):
        lijn(c, x0(n), y, x0(n) + hw, MID); lijn(c, x0(n) + FW / 2 + 6, y, x0(n) + FW, MID); y -= 0.34 * inch
    y -= 0.05 * inch
    y = keuze(c, x0(n), y, 'Ergebnis:', ['keins', 'ein neues Meeting', 'Kekse', 'eine Aufgabe für den, der fehlte'], FW) - 0.45 * inch
    y = keuze(c, x0(n), y, 'Hätte das eine Mail sein können?', ['ja', 'JA', 'eine kurze Nachricht hätte gereicht'], FW) - 0.45 * inch
    y = keuze(c, x0(n), y, 'Die Stimmung danach:', ['motiviert', 'müde', 'hungrig', 'Ich brauche Urlaub.'], FW) - 0.45 * inch
    y -= veld(c, x0(n), y, 'Satz des Tages:', FW)


voeg(protokoll, I.TEILE[5][0]); voeg(protokoll, I.TEILE[5][0])


def tasse(c, x, y, s):
    c.setStrokeColor(DONKER); c.setLineWidth(0.8)
    c.roundRect(x, y, s * 0.72, s * 0.78, s * 0.12); c.circle(x + s * 0.8, y + s * 0.42, s * 0.16)


@pagina(I.TEILE[5][0])
def kaffee_tracker(c, n):
    y = kop_titel(c, n, 'Kaffee-Tracker', 'Male für jede Tasse eine aus. Rein wissenschaftlich. Am Ende des Monats weißt du, warum du so wach bist.')
    dagen = ['Mo', 'Di', 'Mi', 'Do', 'Fr']
    rij = (y - OND - 0.4 * inch - 4 * 0.3 * inch) / 20; s = rij * 0.72  # 4 weken x 5 dagen passend op de pagina
    for wk in range(4):
        tekst(c, f'Woche {wk + 1}', 'PopB', 11, x0(n), y - 10); y -= 0.3 * inch
        for d in dagen:
            tekst(c, d, 'PopM', 10, x0(n), y - s + 3, DONKER)
            for k in range(10):
                tasse(c, x0(n) + 0.45 * inch + k * 0.42 * inch, y - s, s)
            y -= rij
    y -= 0.2 * inch
    tekst(c, 'Tassen insgesamt:', 'PopB', 11, x0(n), y); lijn(c, x0(n) + 1.6 * inch, y - 2, x0(n) + 2.8 * inch, ZWART, 0.8)


@pagina(I.TEILE[5][0])
def beschwerde(c, n):
    y = kop_titel(c, n, 'Offizielles Beschwerdeformular', 'Formular B-17 zur Einreichung von Beschwerden aller Art. Bitte in Druckbuchstaben ausfüllen.')
    for lab in ['Name (freiwillig):', 'Datum und Uhrzeit des Vorfalls:']:
        y -= veld(c, x0(n), y - 12, lab, FW)
    y = keuze(c, x0(n), y - 12, 'Meine Beschwerde betrifft:', ['Kollegen', 'Kaffee', 'Drucker', 'Raumtemperatur', 'Meetings', 'Montag', 'den Kühlschrank', 'Sonstiges'], FW) - 0.48 * inch
    tekst(c, 'Wie schlimm ist es? (bitte einkreisen)', 'PopM', 11, x0(n), y); y -= 0.38 * inch
    for k in range(10):
        xx = x0(n) + 0.1 * inch + k * (FW - 0.2 * inch) / 9
        mid_tekst(c, str(k + 1), 'PopB', 12, xx, y - 4)
    y -= 0.22 * inch
    tekst(c, 'ärgerlich', 'Car', 9.5, x0(n), y - 6, MID); s = 'Ich kündige gleich'; tekst(c, s, 'Car', 9.5, x0(n) + FW - pdfmetrics.stringWidth(s, 'Car', 9.5), y - 6, MID)
    y -= 0.45 * inch
    tekst(c, 'Beschreibung des Vorfalls:', 'PopM', 11, x0(n), y); y -= 0.38 * inch
    for _ in range(3):
        lijn(c, x0(n), y, x0(n) + FW, MID); y -= 0.34 * inch
    y = keuze(c, x0(n), y + 0.06 * inch, 'Gewünschte Lösung:', ['Entschuldigung', 'Kuchen', 'früher Feierabend', 'alles davon'], FW) - 0.5 * inch
    c.setFillColor(VLAK); c.roundRect(x0(n), y - 0.6 * inch, FW, 0.6 * inch, 6, stroke=0, fill=1)
    P(c, 'Bitte werfen Sie das ausgefüllte Formular in den nächsten Papierkorb. Wir kümmern uns darum, sobald wir Zeit haben.',
      st('bf', 'CarI', 10.5, 13.5), x0(n) + 0.15 * inch, y - 0.1 * inch, FW - 0.3 * inch)


@pagina(I.TEILE[5][0])
def team_dieren(c, n):
    y = kop_titel(c, n, 'Dein Team als Tiere', 'Wer ist die Eule, wer das Faultier und wer der Hund, der sich über jeden Besucher freut? Zeichne es.')
    bw = (FW - 0.25 * inch) / 2; bh = (y - OND - 3 * 0.48 * inch) / 3
    for i in range(6):
        xx = x0(n) + (i % 2) * (bw + 0.25 * inch); yy = y - (i // 2) * (bh + 0.48 * inch)
        c.setStrokeColor(ZWART); c.setLineWidth(1); c.roundRect(xx, yy - bh, bw, bh, 6)
        lijn(c, xx, yy - bh - 0.3 * inch, xx + bw, MID)


@pagina(I.TEILE[5][0])
def kuendigung(c, n):
    y = kop_titel(c, n, 'Die Kündigung, die du nie abschickst', 'Ein Lückentext für schwere Tage. Ausfüllen, laut lesen, lachen und dann zurück an die Arbeit.')
    zinnen = ['Sehr geehrte Damen und Herren,', 'hiermit kündige ich mit sofortiger Wirkung meine Teilnahme an',
              'Der Grund ist einfach:', 'Ich werde in Zukunft meine Zeit lieber mit', 'verbringen.',
              'Vermissen werde ich vor allem', 'Nicht vermissen werde ich',
              'Meinen Schreibtisch überlasse ich', 'und die Pflanze am Fenster', 'Mit freundlichen Grüßen und ohne Groll,']
    for z in zinnen:
        tekst(c, z, 'Car', 12.5, x0(n), y - 12); zw = pdfmetrics.stringWidth(z, 'Car', 12.5)
        if not z.endswith(',') and z != 'verbringen.':
            if zw < FW - 1.0 * inch:
                lijn(c, x0(n) + zw + 6, y - 14, x0(n) + FW, MID); y -= 0.42 * inch
            else:
                y -= 0.36 * inch; lijn(c, x0(n), y - 14, x0(n) + FW, MID); y -= 0.42 * inch
        else:
            y -= 0.42 * inch
    y -= 0.2 * inch; lijn(c, x0(n), y - 14, x0(n) + 2.6 * inch, ZWART, 0.8); tekst(c, 'Unterschrift', 'Car', 10, x0(n), y - 28, MID)
    c.saveState(); c.translate(x0(n) + FW - 1.0 * inch, y - 0.15 * inch); c.rotate(12); c.setStrokeColor(DONKER); c.setLineWidth(1.5)
    c.roundRect(-0.85 * inch, -0.25 * inch, 1.7 * inch, 0.5 * inch, 6); mid_tekst(c, 'NICHT ABSCHICKEN', 'PopB', 10, 0, -4, DONKER, 1); c.restoreState()


@pagina(I.TEILE[5][0])
def zitate(c, n):
    y = kop_titel(c, n, 'Zitate aus dem Büro', 'Die besten Sätze, die du in deinem Büro gehört hast. Für die Ewigkeit. Oder zumindest bis zur nächsten Weihnachtsfeier.')
    for i in range(6):
        tekst(c, '„', 'PopB', 26, x0(n), y - 22, LICHT)
        lijn(c, x0(n) + 0.35 * inch, y - 8, x0(n) + FW, MID); lijn(c, x0(n) + 0.35 * inch, y - 0.36 * inch, x0(n) + FW, MID)
        tekst(c, 'Wer?', 'PopM', 9.5, x0(n) + 0.35 * inch, y - 0.62 * inch, MID); lijn(c, x0(n) + 0.75 * inch, y - 0.64 * inch, x0(n) + 2.6 * inch, MID)
        tekst(c, 'Wann?', 'PopM', 9.5, x0(n) + 2.8 * inch, y - 0.62 * inch, MID); lijn(c, x0(n) + 3.3 * inch, y - 0.64 * inch, x0(n) + FW, MID)
        y -= 1.0 * inch


@pagina(I.TEILE[5][0])
def drei_gewinnt(c, n):
    y = kop_titel(c, n, 'Drei gewinnt', 'Das Spiel für zwei Personen im selben Meeting. Kreis gegen Kreuz. Wer verliert, schreibt das nächste Protokoll.')
    s = 1.2 * inch; gap = (FW - 3 * s) / 2
    for i in range(9):
        xx = x0(n) + (i % 3) * (s + gap); yy = y - 0.1 * inch - (i // 3) * (s + 0.42 * inch)
        c.setStrokeColor(ZWART); c.setLineWidth(1.4)
        for k in (1, 2):
            c.line(xx + k * s / 3, yy, xx + k * s / 3, yy - s); c.line(xx, yy - k * s / 3, xx + s, yy - k * s / 3)


@pagina(I.TEILE[5][0])
def kaesekaestchen(c, n):
    y = kop_titel(c, n, 'Käsekästchen', 'Abwechselnd eine Linie zwischen zwei Punkten ziehen. Wer ein Kästchen schließt, schreibt seinen Anfangsbuchstaben hinein und ist noch einmal dran. Die meisten Kästchen gewinnen.')
    nx = 13; d = FW / (nx - 1); ny = int((y - OND - 0.2 * inch) / d) + 1
    c.setFillColor(ZWART)
    for j in range(ny):
        for i in range(nx):
            c.circle(x0(n) + i * d, y - 0.1 * inch - j * d, 1.6, stroke=0, fill=1)


@pagina(I.TEILE[5][0])
def buero_jahr(c, n):
    y = kop_titel(c, n, 'Mein Jahr im Büro', 'Der Jahresrückblick, den kein Chef je lesen wird.')
    for lab in ['Mein bester Moment:', 'Mein peinlichster Moment:', 'Das Meeting des Jahres:', 'Die Ausrede des Jahres:', 'Der Satz des Jahres:',
                'Kollege oder Kollegin des Jahres:', 'Geschätzte Tassen Kaffee:', 'Das nehme ich mir fürs neue Jahr vor:']:
        tekst(c, lab, 'PopM', 11, x0(n), y - 12); lijn(c, x0(n), y - 0.42 * inch, x0(n) + FW, MID); y -= 0.7 * inch
    y -= 0.05 * inch
    tekst(c, 'Note für dieses Jahr (1 bis 6):', 'PopB', 11, x0(n), y - 10); c.setStrokeColor(ZWART); c.setLineWidth(1)
    c.roundRect(x0(n) + 2.45 * inch, y - 18, 0.55 * inch, 0.32 * inch, 4)


# ---------------------------------------------------------------- 7 Bucket-List
teil_pagina(6)


def bucket_rij(c, x, y, it):
    i, t = it; h = hoogte(t, st('bk', 'Car', 11.5, 14), FW - 0.75 * inch)
    if c:
        vakje(c, x, y - 12, 0.15 * inch); tekst(c, f'{i}.', 'PopB', 10, x + 0.27 * inch, y - 10, MID)
        P(c, t, st('bk', 'Car', 11.5, 14), x + 0.62 * inch, y - 1, FW - 0.75 * inch)
    return max(h, 14)


lijst_paginas(list(enumerate(I.BUCKET, 1)), bucket_rij, I.TEILE[6][0], ruimte=8.5)

# ---------------------------------------------------------------- 8 Abwesenheitsnotizen
teil_pagina(7)


def notiz(c, x, y, it):
    i, t = it; hb = hoogte(t, st('nz', 'Car', 12, 15.8), FW - 0.4 * inch) + 0.62 * inch
    if c:
        c.setStrokeColor(LICHT); c.setLineWidth(1); c.setFillColor(white); c.roundRect(x, y - hb, FW, hb, 8, stroke=1, fill=0)
        tekst(c, f'AUTOMATISCHE ANTWORT  #{i}', 'PopB', 8.5, x + 0.2 * inch, y - 0.25 * inch, MID, 1)
        P(c, t, st('nz', 'Car', 12, 15.8), x + 0.2 * inch, y - 0.36 * inch, FW - 0.4 * inch)
    return hb


lijst_paginas(list(enumerate(I.ABWESEND, 1)), notiz, I.TEILE[7][0], ruimte=12)

# ---------------------------------------------------------------- 9 Weisheiten
teil_pagina(8)


def weisheit(c, x, y, it):
    i, t = it; h = hoogte(t, st('ws', 'PopM', 12, 16.5), FW - 0.5 * inch)
    if c:
        tekst(c, f'{i:02d}', 'PopB', 11, x, y - 12, MID); P(c, t, st('ws', 'PopM', 12, 16.5), x + 0.5 * inch, y, FW - 0.5 * inch)
    return h


lijst_paginas(list(enumerate(I.WEISHEITEN, 1)), weisheit, I.TEILE[8][0], ruimte=14)

# ---------------------------------------------------------------- 10 Wörterbuch
teil_pagina(9)


def wort(c, x, y, it):
    w, u = it; t = f'<font name="PopB">{w}</font>&nbsp;&nbsp;{u}'; h = hoogte(t, st('wb', 'Car', 12, 16), FW - 0.42 * inch)
    if c:
        c.setFillColor(VLAK); c.roundRect(x, y - 0.3 * inch, 0.3 * inch, 0.3 * inch, 4, stroke=0, fill=1)
        mid_tekst(c, w[0], 'PopB', 12, x + 0.15 * inch, y - 0.21 * inch)
        P(c, t, st('wb', 'Car', 12, 16), x + 0.42 * inch, y - 2, FW - 0.42 * inch)
    return max(h, 0.3 * inch)


lijst_paginas(I.WOERTERBUCH, wort, I.TEILE[9][0], ruimte=11)

# ---------------------------------------------------------------- 11 Weihnachtsfeier
teil_pagina(10)


def typ(c, x, y, it):
    i, (t, u) = it; ht = hoogte(t, S['sub'], FW - 0.5 * inch); hu = hoogte(u, S['body'], FW - 0.5 * inch)
    if c:
        c.setFillColor(ZWART); c.circle(x + 0.15 * inch, y - 0.14 * inch, 0.15 * inch, stroke=0, fill=1)
        mid_tekst(c, str(i), 'PopB', 10, x + 0.15 * inch, y - 0.18 * inch, white)
        P(c, t, S['sub'], x + 0.5 * inch, y, FW - 0.5 * inch); P(c, u, S['body'], x + 0.5 * inch, y - ht - 2, FW - 0.5 * inch)
    return ht + hu + 2


def typen_eerste(c, n):
    return kop_titel(c, n, 'Die 10 Typen auf jeder Weihnachtsfeier', 'Kreuze an, wen du dieses Jahr schon gesehen hast. Und sei ehrlich: Welcher bist du?')


lijst_paginas(list(enumerate(I.TYPEN, 1)), typ, I.TEILE[10][0], eerste=(typen_eerste, 1.2 * inch), ruimte=13)


@pagina(I.TEILE[10][0])
def smalltalk(c, n):
    y = kop_titel(c, n, 'Smalltalk-Notfallkarten', 'Die Stille am Stehtisch wird unangenehm? Zieh eine Karte. Diese Fragen funktionieren immer.')
    bw = (FW - 0.2 * inch) / 2; bh = (y - OND - 5 * 0.12 * inch) / 6
    for i, q in enumerate(I.SMALLTALK):
        xx = x0(n) + (i % 2) * (bw + 0.2 * inch); yy = y - (i // 2) * (bh + 0.12 * inch)
        c.setDash(3, 3); c.setStrokeColor(MID); c.setLineWidth(0.8); c.roundRect(xx, yy - bh, bw, bh, 6); c.setDash()
        hq = hoogte(q, st('sm', 'PopM', 10.5, 13.5, ZWART, TA_CENTER), bw - 0.3 * inch)
        P(c, q, st('sm', 'PopM', 10.5, 13.5, ZWART, TA_CENTER), xx + 0.15 * inch, yy - (bh - hq) / 2, bw - 0.3 * inch)


@pagina(I.TEILE[10][0])
def wichtelregeln(c, n):
    y = kop_titel(c, n, 'Die goldenen Regeln des Wichtelns')
    for i, (t, u) in enumerate(I.WICHTELREGELN, 1):
        tekst(c, f'{i}', 'PopB', 22, x0(n), y - 22, LICHT)
        y -= P(c, t, S['sub'], x0(n) + 0.45 * inch, y, FW - 0.45 * inch) + 2
        y -= P(c, u, S['body'], x0(n) + 0.45 * inch, y, FW - 0.45 * inch) + 15


# ---------------------------------------------------------------- slot
def urkunde(c, n):
    m = 0.1 * inch; xl = x0(n) - m; yb = OND - 0.2 * inch; bw = FW + 2 * m; bh = H - BOV - OND + 0.35 * inch
    c.setStrokeColor(ZWART); c.setLineWidth(2.5); c.rect(xl, yb, bw, bh); c.setLineWidth(0.8); c.rect(xl + 6, yb + 6, bw - 12, bh - 12)
    cx = x0(n) + FW / 2; y = H - BOV - 0.75 * inch
    mid_tekst(c, 'URKUNDE', 'PopB', 34, cx, y, ZWART, 4); y -= 0.45 * inch
    mid_tekst(c, 'Hiermit wird feierlich bestätigt, dass', 'Car', 13, cx, y); y -= 0.65 * inch
    lijn(c, x0(n) + 0.4 * inch, y, x0(n) + FW - 0.4 * inch, ZWART, 0.8); y -= 0.45 * inch
    mid_tekst(c, 'das Büro-Jahr 20____', 'PopB', 15, cx, y); y -= 0.35 * inch
    mid_tekst(c, 'offiziell überlebt hat.', 'PopB', 15, cx, y); y -= 0.55 * inch
    mid_tekst(c, 'Mit Auszeichnung in:', 'PopM', 11.5, cx, y, DONKER); y -= 0.42 * inch
    opties = ['Meetings überstehen', 'Kaffee trinken', 'Ausreden erfinden', 'Drucker reparieren', 'Kuchen teilen', 'So tun, als ob']
    for i, o in enumerate(opties):
        xx = x0(n) + 0.35 * inch + (i % 2) * (FW / 2); yy = y - (i // 2) * 0.36 * inch
        vakje(c, xx, yy - 2, 0.14 * inch); tekst(c, o, 'Car', 12, xx + 0.24 * inch, yy)
    y -= 3 * 0.36 * inch + 0.55 * inch
    c.setStrokeColor(DONKER); c.setLineWidth(1.3); c.circle(cx, y - 0.35 * inch, 0.48 * inch); c.circle(cx, y - 0.35 * inch, 0.42 * inch)
    mid_tekst(c, 'GEPRÜFT', 'PopB', 9, cx, y - 0.3 * inch, DONKER, 1); mid_tekst(c, 'UND', 'PopB', 7, cx, y - 0.42 * inch, DONKER, 1)
    mid_tekst(c, 'ÜBERLEBT', 'PopB', 9, cx, y - 0.56 * inch, DONKER, 1)
    y -= 1.15 * inch
    lijn(c, x0(n) + 0.3 * inch, y, x0(n) + 2.1 * inch, ZWART, 0.8); lijn(c, x0(n) + FW - 2.1 * inch, y, x0(n) + FW - 0.3 * inch, ZWART, 0.8)
    mid_tekst(c, 'Datum', 'Car', 10, x0(n) + 1.2 * inch, y - 13, MID); mid_tekst(c, 'Unterschrift (Chef, Kollege', 'Car', 10, x0(n) + FW - 1.2 * inch, y - 13, MID)
    mid_tekst(c, 'oder Kaffeemaschine)', 'Car', 10, x0(n) + FW - 1.2 * inch, y - 25, MID)


TEIL_START['urkunde'] = len(PAGINAS) + 1
voeg(urkunde)


def loes_ws(paar):
    def f(c, n):
        y = H - BOV if paar else kop_titel(c, n, 'Lösungen', 'Nicht schummeln. Oder doch, wir sind ja unter uns.')
        if not paar:
            y += 0.05 * inch
        items = OPLOSSINGEN['ws'][paar * 4:(paar + 1) * 4]
        bw = (FW - 0.3 * inch) / 2; cel = (bw - 8) / 14
        for i, (t, g, plek) in enumerate(items):
            xx = x0(n) + (i % 2) * (bw + 0.3 * inch); yy = y - (i // 2) * (14 * cel + 0.62 * inch)
            tekst(c, t, 'PopB', 10, xx, yy - 10); teken_grid(c, g, xx + 4, yy - 0.28 * inch, cel, 'PopM', plek)
    voeg(f, 'Lösungen')


def loes_rest(c, n):
    y = H - BOV
    bw = (FW - 0.3 * inch) / 2
    for i, (t, muur, cols, rows, pad) in enumerate(OPLOSSINGEN['lab']):
        cel = min(bw / cols, 2.3 * inch / rows)
        xx = x0(n) + (i % 2) * (bw + 0.3 * inch); yy = y - (i // 2) * (2.3 * inch + 0.55 * inch)
        P(c, t, st('lt', 'PopB', 9.5, 11.5), xx, yy, bw)
        teken_maze(c, muur, cols, rows, xx + (bw - cols * cel) / 2, yy - 0.38 * inch, cel, pad, dik=0.9)


def loes_salat(c, n):
    y = H - BOV
    tekst(c, 'Buchstabensalat', 'PopB', 13, x0(n), y - 12); y -= 0.42 * inch
    kol = FW / 2
    for i, (m, hint, w) in enumerate(SALAT_GEMIXT):
        xx = x0(n) + (i // 12) * kol; yy = y - (i % 12) * 0.3 * inch
        tekst(c, f'{i + 1}.', 'PopB', 10.5, xx, yy, MID); tekst(c, w, 'PopM', 11.5, xx + 0.35 * inch, yy)
    y -= 12 * 0.3 * inch + 0.3 * inch
    tekst(c, 'Wie gut sprichst du Büro? (Test 3)', 'PopB', 13, x0(n), y - 12); y -= 0.42 * inch
    tekst(c, '   '.join(f'{i + 1}{a}' for i, a in enumerate(I.TESTS[2]['loesung'])), 'PopM', 12, x0(n), y)


TEIL_START['loesung'] = len(PAGINAS) + 1
loes_ws(0); loes_ws(1); voeg(loes_rest, 'Lösungen'); voeg(loes_salat, 'Lösungen')


def danke(c, n):
    y = kop_titel(c, n, 'Danke!')
    for t in I.DANKE:
        y -= P(c, t, S['body'], x0(n), y, FW) + 10
    buf = io.BytesIO(); segno.make(I.REVIEW, error='m').save(buf, kind='png', scale=12, border=2); buf.seek(0)
    s = 1.55 * inch; c.drawImage(ImageReader(buf), x0(n) + (FW - s) / 2, y - s - 0.1 * inch, s, s)
    y -= s + 0.35 * inch
    mid_tekst(c, 'Scannen und bewerten', 'PopB', 12, x0(n) + FW / 2, y)
    y -= 0.7 * inch
    P(c, 'Und jetzt: zurück an die Arbeit. Oder zumindest so tun, als ob.', st('dk', 'PopM', 13, 18, ZWART, TA_CENTER), x0(n), y, FW)


voeg(danke)


def notizen(c, n):
    y = kop_titel(c, n, 'Notizen')
    while y > OND + 0.1 * inch:
        lijn(c, x0(n), y, x0(n) + FW, LICHT); y -= 0.34 * inch


voeg(notizen)
if len(PAGINAS) % 2:
    voeg(notizen)


# ---------------------------------------------------------------- render
def render(uit):
    c = canvas.Canvas(uit, pagesize=(W, H), initialFontName='Car', initialFontSize=12)
    c.setTitle(f'{I.TITEL}: {I.UNTERTITEL}'); c.setAuthor(I.AUTOR); c.setSubject(I.UNTERTITEL)
    voorwerk = 6
    for i, (f, kop) in enumerate(PAGINAS):
        n = i + 1
        f(c, n)
        if kop:
            s = kop.upper() if n % 2 else 'ICH TU NUR SO, ALS OB'
            sp = 1.2; w = pdfmetrics.stringWidth(s, 'PopM', 7.5) + sp * (len(s) - 1)
            tekst(c, s, 'PopM', 7.5, (x0(n) + FW - w) if n % 2 else x0(n), H - 0.45 * inch, MID, sp)
        if n > voorwerk:
            s = str(n); w = pdfmetrics.stringWidth(s, 'PopB', 9.5)
            tekst(c, s, 'PopB', 9.5, (x0(n) + FW - w) if n % 2 else x0(n), 0.42 * inch, DONKER)
        c.showPage()
    c.save()
    return len(PAGINAS)


if __name__ == '__main__':
    n = render(os.path.join(HIER, 'binnenwerk.pdf'))
    open(os.path.join(HIER, 'paginas.txt'), 'w').write(str(n))
    print('paginas', n, 'teilen', {k: v for k, v in TEIL_START.items()})
