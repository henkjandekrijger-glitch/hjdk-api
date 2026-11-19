"""Opmaakmotor voor Lasting Change Workbook 2027: widgets die van boven naar beneden lopen.
Elke widget krijgt (c, x, y, w) en geeft de nieuwe y terug. 6 x 9 inch, zwart-wit, alle fonts ingebed."""
import os
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import black, white, Color

HIER = os.path.dirname(os.path.abspath(__file__))
G = '/usr/share/fonts/truetype/google-fonts/'
F = os.path.join(HIER, 'fonts') + '/'
for naam, pad in [('PopB', G + 'Poppins-Bold.ttf'), ('PopSB', G + 'Poppins-Medium.ttf'), ('PopM', G + 'Poppins-Medium.ttf'),
                  ('PopR', G + 'Poppins-Regular.ttf'), ('PopL', G + 'Poppins-Light.ttf'), ('PopI', G + 'Poppins-Italic.ttf'),
                  ('Lora', F + 'Lora-400.ttf'), ('LoraSB', F + 'Lora-600.ttf'), ('LoraB', F + 'Lora-700.ttf'),
                  ('LoraI', F + 'LoraItalic-400.ttf'), ('LoraSBI', F + 'LoraItalic-600.ttf')]:
    pdfmetrics.registerFont(TTFont(naam, pad))

W, H = 6 * inch, 9 * inch
BUITEN, BINNEN = 0.6 * inch, 0.8 * inch
BOVEN, ONDER = 0.55 * inch, 0.6 * inch
GRIJS = Color(0.45, 0.45, 0.45)
MIDDEN = Color(0.62, 0.62, 0.62)
LIJN = Color(0.70, 0.70, 0.70)
LICHT = Color(0.86, 0.86, 0.86)
VLAK = Color(0.94, 0.94, 0.94)
SCHRIJF = 25  # afstand tussen schrijflijnen (pt): ruim genoeg voor gewoon handschrift


class Overloop(Exception):
    pass


def marges(links):
    """links = linkerpagina (even): binnenkant rechts."""
    return (BUITEN, W - BINNEN) if links else (BINNEN, W - BUITEN)


def breedte(t, f, s):
    return pdfmetrics.stringWidth(t, f, s)


def wrap(t, f, s, w):
    regels, r = [], ''
    for woord in t.split():
        test = (r + ' ' + woord).strip()
        if breedte(test, f, s) > w and r:
            regels.append(r)
            r = woord
        else:
            r = test
    if r:
        regels.append(r)
    return regels


def tekst(c, t, x, y, w, f='Lora', s=10.5, lead=14.5, kleur=black, uitlijn='l'):
    c.setFillColor(kleur)
    c.setFont(f, s)
    for r in wrap(t, f, s, w):
        if uitlijn == 'c':
            c.drawCentredString(x + w / 2, y, r)
        else:
            c.drawString(x, y, r)
        y -= lead
    c.setFillColor(black)
    return y


def rijk(c, delen, x, y, w, s=10.5, lead=14.5):
    """Tekst met vet en cursief: delen = [(tekst, font), ...] als een alinea."""
    woorden = []
    for t, f in delen:
        for i, wd in enumerate(t.split(' ')):
            if wd:
                woorden.append((wd, f))
    cx = x
    for wd, f in woorden:
        bw = breedte(wd, f, s)
        if cx + bw > x + w + 0.1 and cx > x:
            y -= lead
            cx = x
        c.setFont(f, s)
        c.drawString(cx, y, wd)
        cx += bw + breedte(' ', f, s)
    return y - lead


def label(c, t, x, y, kleur=GRIJS, s=7.5):
    c.setFillColor(kleur)
    c.setFont('PopM', s)
    c.drawString(x, y, ' '.join(t.upper()))  # ruime spatiering voor labels
    c.setFillColor(black)


def label_rechts(c, t, x, y, kleur=GRIJS, s=7.5):
    c.setFillColor(kleur)
    c.setFont('PopM', s)
    c.drawRightString(x, y, ' '.join(t.upper()))
    c.setFillColor(black)


def hokje(c, x, y, z=9, dik=0.9, vol=False):
    c.setLineWidth(dik)
    c.setStrokeColor(black)
    c.rect(x, y, z, z, stroke=1, fill=1 if vol else 0)


def schrijflijn(c, x, y, x2, kleur=LIJN, dik=0.6):
    c.setStrokeColor(kleur)
    c.setLineWidth(dik)
    c.line(x, y, x2, y)
    c.setStrokeColor(black)


# ---------------------------------------------------------------- widgets

def w_h(c, x, y, w, t, s=11.5):
    c.setFont('PopB', s)
    for r in wrap(t, 'PopB', s, w):
        c.drawString(x, y, r)
        y -= s + 4
    return y - 3


def w_para(c, x, y, w, t, s=10.6, lead=14.6, f='Lora'):
    return tekst(c, t, x, y, w, f=f, s=s, lead=lead) - 2


def w_noot(c, x, y, w, t):
    return tekst(c, t, x, y, w, f='LoraI', s=9.5, lead=12.5, kleur=GRIJS) - 3


def w_lijnen(c, x, y, w, n, lab=None, eerst=None):
    """n schrijflijnen; lab = vet label voor de eerste lijn."""
    y -= eerst if eerst is not None else 16
    for i in range(n):
        if i == 0 and lab:
            c.setFont('LoraSB', 10)
            c.drawString(x, y + 3, lab)
            lw = breedte(lab, 'LoraSB', 10) + 6
            schrijflijn(c, x + lw, y, x + w)
        else:
            schrijflijn(c, x, y, x + w)
        y -= SCHRIJF
    return y + SCHRIJF - 14


def w_labellijnen(c, x, y, w, labels, af=SCHRIJF + 2):
    y -= 16
    for lab in labels:
        c.setFont('LoraSB', 10)
        c.drawString(x, y + 3, lab)
        lw = breedte(lab, 'LoraSB', 10) + 6
        schrijflijn(c, x + lw, y, x + w)
        y -= af
    return y + af - 14


def w_vul(c, x, y, w, sjabloon, s=10.5, lead=SCHRIJF, eerst=16):
    """Zin met invulruimte: ___ = 70pt, ___120 = 120pt, ___* = tot het einde van de regel."""
    y -= eerst
    cx = x
    toks = []
    for tok in sjabloon.split(' '):
        if tok and toks and toks[-1].startswith('___') and all(ch in '.,:;!?)' for ch in tok):
            toks[-1] += tok
        else:
            toks.append(tok)
    for tok in toks:
        if not tok:
            continue
        if tok.startswith('___'):
            rest = tok[3:]
            na = ''
            while rest and not (rest[0].isdigit() or rest[0] == '*'):
                na += rest[0]
                rest = rest[1:]
            spec = ''.join(ch for ch in rest if ch.isdigit() or ch == '*')
            na2 = rest[len(spec):]
            na = na + na2
            if spec == '*':
                if cx > x + w - 40:
                    y -= lead
                    cx = x
                schrijflijn(c, cx, y - 2, x + w - breedte(na, 'Lora', s))
                cx = x + w - breedte(na, 'Lora', s)
            else:
                bw = float(spec) if spec else 70
                if cx + bw > x + w + 0.1:
                    y -= lead
                    cx = x
                schrijflijn(c, cx, y - 2, cx + bw)
                cx += bw
            if na:
                c.setFont('Lora', s)
                c.drawString(cx + 1, y, na)
                cx += breedte(na, 'Lora', s) + 1
            cx += breedte(' ', 'Lora', s)
        else:
            bw = breedte(tok, 'Lora', s)
            if cx + bw > x + w + 0.1 and cx > x:
                y -= lead
                cx = x
            c.setFont('Lora', s)
            c.drawString(cx, y, tok)
            cx += bw + breedte(' ', 'Lora', s)
    return y - 14


def w_keuzes(c, x, y, w, items, kol=1, s=10.2, rij=None, titel=None):
    """Afvinklijst; bij meer kolommen rij voor rij gevuld (links-rechts), zodat de rijen gelijk lopen."""
    if titel:
        y = w_h(c, x, y, w, titel, s=10.5)
    kb = w / kol
    rij = rij or (s + 6.8)
    per = (len(items) + kol - 1) // kol
    kolommen = [items[k * per:(k + 1) * per] for k in range(kol)]
    for r in range(per):
        hoogste = 1
        for k in range(kol):
            if r >= len(kolommen[k]):
                continue
            it = kolommen[k][r]
            hokje(c, x + k * kb, y - 1.5, 8.5, 0.8)
            regels = wrap(it, 'Lora', s, kb - 20)
            c.setFont('Lora', s)
            for j, rr in enumerate(regels):
                c.drawString(x + k * kb + 14, y - j * (s + 2.5), rr)
            hoogste = max(hoogste, len(regels))
        y -= rij + (hoogste - 1) * (s + 2.5)
    return y - 4


def w_kader(c, x, y, w, titel, regels, s=9.6, lead=13, vlak=VLAK):
    """Grijs voorbeeldkader."""
    alle = []
    for r in regels:
        alle += wrap(r, 'Lora', s, w - 20) + ['']
    alle = alle[:-1]
    h = 18 + len(alle) * lead + 8
    c.setFillColor(vlak)
    c.roundRect(x, y - h + 10, w, h, 5, stroke=0, fill=1)
    c.setFillColor(black)
    label(c, titel, x + 10, y - 3, kleur=black, s=7)
    yy = y - 18
    c.setFont('Lora', s)
    for r in alle:
        if r:
            c.drawString(x + 10, yy, r)
            yy -= lead
        else:
            yy -= 4
    return y - h - 2


def w_balk(c, x, y, w, t):
    c.setFillColor(black)
    c.roundRect(x, y - 6, w, 19, 3, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont('PopB', 8.5)
    c.drawString(x + 8, y, ' '.join(t.upper()) if len(t) < 28 else t.upper())
    c.setFillColor(black)
    return y - 22


def w_schaal(c, x, y, w, vraag, n=5, laag='', hoog='', start=1):
    if vraag:
        c.setFont('LoraSB', 10)
        for r in wrap(vraag, 'LoraSB', 10, w):
            c.drawString(x, y, r)
            y -= 13
        y -= 8
    stap = (w - 30) / max(n - 1, 1)
    r = 9.5 if n <= 7 else 7.8
    for i in range(n):
        cx = x + 15 + i * stap
        c.setLineWidth(0.8)
        c.circle(cx, y, r, stroke=1, fill=0)
        c.setFont('PopM', 8.5 if n <= 7 else 7.5)
        c.drawCentredString(cx, y - 3, str(start + i))
    c.setFont('LoraI', 8.5)
    c.setFillColor(GRIJS)
    if laag:
        c.drawString(x + 15 - r, y - r - 10, laag)
    if hoog:
        c.drawRightString(x + 15 + (n - 1) * stap + r, y - r - 10, hoog)
    c.setFillColor(black)
    return y - r - 30


def w_tabel(c, x, y, w, koppen, rijen, kolw=None, rh=24, vast=None, s=9.3, vink=False):
    """rijen: lijst van lijsten (tekst of ''), kolw: fracties. vast = aantal rijen met vooraf ingevulde tekst."""
    n = len(koppen)
    kolw = kolw or [1 / n] * n
    xs = [x]
    for f in kolw:
        xs.append(xs[-1] + f * w)
    hh = 15
    c.setFillColor(VLAK)
    c.rect(x, y - hh + 10, w, hh, stroke=0, fill=1)
    c.setFillColor(black)
    for i, k in enumerate(koppen):
        c.setFont('PopM', 7)
        c.drawString(xs[i] + 5, y - 1.5, k.upper())
    yy = y - hh + 10
    c.setStrokeColor(LIJN)
    c.setLineWidth(0.6)
    for rij in rijen:
        regels = [wrap(t, 'Lora', s, (xs[i + 1] - xs[i]) - 10) if t else [] for i, t in enumerate(rij)]
        hoog = max(rh, max((len(r) for r in regels), default=0) * (s + 3) + 10)
        if vink:
            c.setStrokeColor(black)
            hokje(c, xs[0] + (xs[1] - xs[0]) / 2 - 4.5, yy - 13, 9, 0.8)
            c.setStrokeColor(LIJN)
            c.setLineWidth(0.6)
        for i, rr in enumerate(regels):
            c.setFont('Lora', s)
            for j, r in enumerate(rr):
                c.drawString(xs[i] + 5, yy - 12 - j * (s + 3), r)
        yy -= hoog
        c.line(x, yy, x + w, yy)
    for xx in xs[1:-1]:
        c.line(xx, y - hh + 10, xx, yy)
    c.setStrokeColor(black)
    return yy - 14


def w_vakken(c, x, y, w, titels, hoog=46, kol=None, s=7):
    """Rij of raster van open vakken met een kop (bijv. WOOP of drie maten)."""
    kol = kol or len(titels)
    gap = 8
    bw = (w - gap * (kol - 1)) / kol
    rijen = (len(titels) + kol - 1) // kol
    for i, t in enumerate(titels):
        r, k = divmod(i, kol)
        bx = x + k * (bw + gap)
        by = y - r * (hoog + gap)
        c.setStrokeColor(LIJN)
        c.setLineWidth(0.8)
        c.roundRect(bx, by - hoog + 10, bw, hoog, 4, stroke=1, fill=0)
        c.setStrokeColor(black)
        if isinstance(t, tuple):
            label(c, t[0], bx + 7, by - 1, kleur=black, s=s)
            c.setFont('LoraI', 8.5)
            c.setFillColor(GRIJS)
            yy = by - 12
            for rr in wrap(t[1], 'LoraI', 8.5, bw - 14):
                c.drawString(bx + 7, yy, rr)
                yy -= 10.5
            c.setFillColor(black)
        else:
            label(c, t, bx + 7, by - 1, kleur=black, s=s)
    return y - rijen * (hoog + gap) + gap - 6


def w_kolommen(c, x, y, w, koppen, n=3):
    gap = 10
    bw = (w - gap * (len(koppen) - 1)) / len(koppen)
    for i, k in enumerate(koppen):
        bx = x + i * (bw + gap)
        label(c, k, bx, y, kleur=black, s=7)
        for j in range(n):
            schrijflijn(c, bx, y - 22 - j * SCHRIJF, bx + bw)
    return y - 22 - (n - 1) * SCHRIJF - 16


def w_paren(c, x, y, w, links, rechts, n=5):
    gap = 46
    bw = (w - gap) / 2
    label(c, links, x, y, kleur=black, s=7)
    label(c, rechts, x + bw + gap, y, kleur=black, s=7)
    for j in range(n):
        yy = y - 22 - j * SCHRIJF
        schrijflijn(c, x, yy, x + bw)
        schrijflijn(c, x + bw + gap, yy, x + w)
        c.circle(x + bw + 7, yy + 3, 2, stroke=0, fill=1)
        c.circle(x + bw + gap - 7, yy + 3, 2, stroke=0, fill=1)
    return y - 22 - (n - 1) * SCHRIJF - 16


def w_cirkels(c, x, y, w, n, tekst_na=None, r=8):
    stap = min(26, (w - 2 * r) / max(n - 1, 1))
    for i in range(n):
        c.setLineWidth(0.8)
        c.circle(x + r + i * stap, y, r, stroke=1, fill=0)
    if tekst_na:
        c.setFont('LoraI', 9)
        c.setFillColor(GRIJS)
        c.drawString(x + 2 * r + (n - 1) * stap + 8, y - 3, tekst_na)
        c.setFillColor(black)
    return y - r - 16


def w_bingo(c, x, y, w, n=3, maat=None):
    maat = maat or min(w / n, 52)
    x0 = x + (w - maat * n) / 2
    c.setStrokeColor(MIDDEN)
    c.setLineWidth(0.8)
    for i in range(n + 1):
        c.line(x0 + i * maat, y, x0 + i * maat, y - n * maat)
        c.line(x0, y - i * maat, x0 + n * maat, y - i * maat)
    c.setStrokeColor(black)
    c.setFont('PopB', 7)
    c.setFillColor(MIDDEN)
    c.drawCentredString(x0 + maat * 1.5, y - maat * 1.5 - 2.5, 'FREE')
    c.setFillColor(black)
    return y - n * maat - 14


def w_energie(c, x, y, w, van=6, tot=23):
    """Energiegrafiek: uren op de x-as, 1-5 op de y-as, punten om te verbinden."""
    links = 18
    n = tot - van + 1
    stap = (w - links - 4) / (n - 1)
    hoog = 24
    c.setFont('PopM', 7.5)
    c.setFillColor(GRIJS)
    for e in range(5):
        c.drawRightString(x + links - 6, y - (4 - e) * hoog - 2, str(e + 1))
    for i in range(n):
        u = van + i
        tl = (str(u if u <= 12 else u - 12) + ('a' if u < 12 else 'p'))
        if i % 2 == 0:
            c.drawCentredString(x + links + i * stap, y - 4 * hoog - 14, tl)
        for e in range(5):
            c.setFillColor(MIDDEN)
            c.circle(x + links + i * stap, y - e * hoog, 1.5, stroke=0, fill=1)
    c.setFillColor(black)
    return y - 4 * hoog - 30


def w_lus(c, x, y, w, vakken=('CUE', 'ROUTINE', 'REWARD'), sub=('When, where, what feeling?', 'What I do now', 'What it really gives me'), hoog=58):
    gap = 18
    bw = (w - 2 * gap) / 3
    for i, (t, s) in enumerate(zip(vakken, sub)):
        bx = x + i * (bw + gap)
        c.setStrokeColor(black)
        c.setLineWidth(1)
        c.roundRect(bx, y - hoog, bw, hoog, 5, stroke=1, fill=0)
        label(c, t, bx + 6, y - 11, kleur=black, s=6.8)
        c.setFont('LoraI', 7.6)
        c.setFillColor(GRIJS)
        yy = y - 21
        for r in wrap(s, 'LoraI', 7.6, bw - 12):
            c.drawString(bx + 6, yy, r)
            yy -= 9
        c.setFillColor(black)
        if i < 2:
            ax = bx + bw + 3
            ay = y - hoog / 2
            c.setLineWidth(1)
            c.line(ax, ay, ax + gap - 6, ay)
            p = c.beginPath()
            p.moveTo(ax + gap - 6, ay + 3)
            p.lineTo(ax + gap - 2, ay)
            p.lineTo(ax + gap - 6, ay - 3)
            p.close()
            c.drawPath(p, stroke=0, fill=1)
    return y - hoog - 16


def w_meter(c, x, y, w, laag='1', hoog='10'):
    """Halve cirkel met 10 streepjes: waar sta ik."""
    import math
    r = 46
    cx, cy = x + w / 2, y - r - 4
    c.setLineWidth(1.4)
    c.arc(cx - r, cy - r, cx + r, cy + r, 0, 180)
    for i in range(10):
        a = math.pi - (i + 0.5) * math.pi / 10
        c.setLineWidth(0.8)
        c.line(cx + (r - 6) * math.cos(a), cy + (r - 6) * math.sin(a), cx + r * math.cos(a), cy + r * math.sin(a))
        c.setFont('PopM', 6.5)
        c.drawCentredString(cx + (r + 8) * math.cos(a), cy + (r + 8) * math.sin(a) - 2, str(i + 1))
    c.circle(cx, cy, 2.5, stroke=0, fill=1)
    return cy - 18


def w_kralen(c, x, y, w, n=30, per=15):
    r = 6.2
    stap = (w - 2 * r) / (per - 1)
    for i in range(n):
        rij, k = divmod(i, per)
        c.setLineWidth(0.8)
        c.circle(x + r + k * stap, y - rij * 18, r, stroke=1, fill=0)
    return y - ((n - 1) // per) * 18 - r - 14


def w_keten(c, x, y, w, vakken):
    gap = 12
    bw = (w - gap * (len(vakken) - 1)) / len(vakken)
    hoog = 46
    for i, t in enumerate(vakken):
        bx = x + i * (bw + gap)
        c.setStrokeColor(black)
        c.setLineWidth(0.9)
        c.roundRect(bx, y - hoog, bw, hoog, 4, stroke=1, fill=0)
        label(c, t, bx + 5, y - 10, kleur=black, s=6.3)
        if i < len(vakken) - 1:
            ay = y - hoog / 2
            c.line(bx + bw + 2, ay, bx + bw + gap - 3, ay)
            p = c.beginPath()
            p.moveTo(bx + bw + gap - 5, ay + 2.5)
            p.lineTo(bx + bw + gap - 1, ay)
            p.lineTo(bx + bw + gap - 5, ay - 2.5)
            p.close()
            c.drawPath(p, stroke=0, fill=1)
    return y - hoog - 14


def w_ruimte(c, x, y, w, pt):
    return y - pt


def w_genummerd(c, x, y, w, n, start=1):
    y -= 16
    for i in range(n):
        c.setFont('PopB', 9)
        c.drawString(x, y + 3, str(start + i) + '.')
        schrijflijn(c, x + 16, y, x + w)
        y -= SCHRIJF
    return y + SCHRIJF - 14


def w_omcirkel(c, x, y, w, opties, s=10):
    """Woorden om te omcirkelen, gelijk verdeeld."""
    stap = w / len(opties)
    c.setFont('PopM', s)
    for i, o in enumerate(opties):
        c.drawCentredString(x + stap * (i + 0.5), y, o)
    return y - 20


def w_dagen(c, x, y, w, labels):
    """Rij van vakjes met een label eronder (weekoverzicht)."""
    n = len(labels)
    stap = w / n
    z = min(22, stap - 8)
    for i, l in enumerate(labels):
        bx = x + i * stap + (stap - z) / 2
        c.setLineWidth(0.9)
        c.rect(bx, y - z, z, z, stroke=1, fill=0)
        c.setFont('PopM', 6.5)
        c.setFillColor(GRIJS)
        c.drawCentredString(bx + z / 2, y - z - 9, l)
        c.setFillColor(black)
    return y - z - 22


def w_notities(c, x, y, w, n):
    y -= 6
    label(c, 'Notes', x, y, kleur=MIDDEN, s=6.5)
    y -= 4
    for i in range(n):
        y -= SCHRIJF
        schrijflijn(c, x, y, x + w, kleur=LICHT)
    return y - 10


WIDGETS = {k[2:]: v for k, v in dict(globals()).items() if k.startswith('w_')}


def meet(x, y, w, lijst):
    import io
    from reportlab.pdfgen import canvas as _cv
    d = _cv.Canvas(io.BytesIO(), pagesize=(W, H))
    return teken(d, x, y, w, lijst, -1e9)


def teken_vol(c, x, y, w, lijst, ondergrens, wat='', notities=False, maxgap=14):
    """Tekent de lijst en verdeelt de vrije ruimte: extra lucht tussen de onderdelen en, als het kan, notitielijnen."""
    eind = meet(x, y, w, lijst)
    vrij = eind - ondergrens
    if (notities and vrij > 80) or (notities is None and vrij > 110):
        n = int((vrij - 30) // SCHRIJF)
        lijst = list(lijst) + [('notities', n)]
        vrij -= 20 + n * SCHRIJF
    gap = max(0, min(maxgap, vrij / max(len(lijst), 1))) if vrij > 0 else 0
    return teken(c, x, y, w, lijst, ondergrens, wat, gap)


def teken(c, x, y, w, lijst, ondergrens, wat='', gap=0):
    for i, item in enumerate(lijst):
        if i:
            y -= gap
        soort, args = item[0], item[1:]
        kw = {}
        if args and isinstance(args[-1], dict):
            kw = args[-1]
            args = args[:-1]
        y = WIDGETS[soort](c, x, y, w, *args, **kw)
        if y < ondergrens - 2:
            raise Overloop(f'{wat}: {soort} eindigt op {y:.0f}, grens {ondergrens:.0f}')
    return y
