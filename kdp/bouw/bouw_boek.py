"""Generieke bouwer voor KDP-binnenwerken (6x9 inch, zonder bleed).

Gebruik: python3 bouw_boek.py <map met config.py> <uit.pdf>
config.py levert BOEK = dict(...) met:
  modus: 'facts' | 'quiz' | 'jokes' | 'wyr'
  kop: kopregel op linkerpagina's; titel_regels: [(tekst, grootte)], ondertitel, tagline, auteur
  copyright: [regels]; intro_kop, intro: [alinea's]; slot_kop, slot: [alinea's]; ook: [(titel, ondertitel)]
  hoofdstukken: [(naam, teaser, items)]  items per modus:
     facts: str  | quiz: (vraag, [A,B,C,D], 'B')  | jokes: (vraag, antwoord) | wyr: str
  tf_quiz: optioneel [(stelling, waar, zoekwoord)] (alleen facts)
  label: 'FACTS' / 'QUESTIONS' / 'JOKES'; groot: True voor large print
"""
import re, sys, importlib.util
from reportlab.lib.pagesizes import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
                                Table, TableStyle, KeepTogether, Flowable)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

G = '/usr/share/fonts/truetype/google-fonts/'
C = '/usr/share/fonts/truetype/crosextra/'
for naam, pad in [('PopB', G+'Poppins-Bold.ttf'), ('PopM', G+'Poppins-Medium.ttf'), ('PopR', G+'Poppins-Regular.ttf'),
                  ('Car', C+'Carlito-Regular.ttf'), ('CarB', C+'Carlito-Bold.ttf'), ('CarI', C+'Carlito-Italic.ttf')]:
    pdfmetrics.registerFont(TTFont(naam, pad))
pdfmetrics.registerFont(TTFont('DV', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
registerFontFamily('Car', normal='Car', bold='CarB', italic='CarI', boldItalic='CarB')
registerFontFamily('CarI', normal='CarI', bold='CarB', italic='CarI', boldItalic='CarB')
import reportlab.platypus.tables as _tab
_tab.CellStyle.fontname = 'Car'

W, H = 6*inch, 9*inch
IN, OUT, TOP, BOT = 0.7*inch, 0.5*inch, 0.72*inch, 0.7*inch
DONKER, GRIJS, LICHT = HexColor('#1a1a1a'), HexColor('#5f5f5f'), HexColor('#c8c8c8')
FW = W - IN - OUT


TAAL = 'en'
EN = dict(inhoud='Contents', hlabel='CHAPTER {i2}  \u2022  {label} {a}\u2013{b}', quiz_toc='Bonus: True or False? Quiz',
          quiz_kop='Bonus Quiz', quiz_label='BONUS', quiz_titel='True or False?',
          quiz_teaser='{n} quick ones to test yourself or your friends. Circle T or F, then check the answers.',
          tf='T&nbsp;&nbsp;&nbsp;F', antworten='Answers', waar='TRUE', onwaar='FALSE', zie='see fact',
          score='<b>Your score:</b> 25 or more: walking encyclopedia. 15 to 24: seriously sharp. Under 15: perfect excuse to read the book again.',
          ook='Also by {auteur}')


def mooi(t):
    t = t.replace('&', '&amp;')
    if TAAL == 'de':
        t = re.sub(r'(^|[\s(\[])"', '\\1\u201e', t)
        return t.replace('"', '\u201c').replace("'", '\u2019')
    t = re.sub(r'(^|[\s(\[])"', '\\1\u201c', t)
    t = t.replace('"', '\u201d').replace("'", '\u2019')
    return t


class Lijn(Flowable):
    def __init__(self, b, d=3.5, r=14):
        super().__init__(); self.b, self.d, self.r = b, d, r
    def wrap(self, aw, ah): return aw, self.d + self.r
    def draw(self): self.canv.setFillColor(DONKER); self.canv.rect(0, self.r/2, self.b, self.d, stroke=0, fill=1)


class Stil(Flowable):
    def __init__(self, fn): super().__init__(); self.fn = fn
    def wrap(self, aw, ah): return 0, 0
    def draw(self): self.fn(self.canv._doc_ref, self.canv)


class Doc(BaseDocTemplate):
    def __init__(self, pad, boek):
        super().__init__(pad, pagesize=(W, H), leftMargin=0, rightMargin=0, topMargin=0, bottomMargin=0,
                         title=boek['titel_meta'], author=boek['auteur'], initialFontName='Car', initialFontSize=10)
        self.boek, self.paginas, self.hst, self.modus = boek, {}, '', 'kaal'
        r = Frame(IN, BOT, FW, H-TOP-BOT, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        l = Frame(OUT, BOT, FW, H-TOP-BOT, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates([PageTemplate('kaal_r', [r], onPage=self.ref), PageTemplate('kaal_l', [l], onPage=self.ref),
                               PageTemplate('tekst_r', [r], onPage=self.ref, onPageEnd=self.kop_voet),
                               PageTemplate('tekst_l', [l], onPage=self.ref, onPageEnd=self.kop_voet)])

    def handle_pageBegin(self):
        naam = self.modus + ('_r' if (self.page + 1) % 2 else '_l')
        self.pageTemplate = [t for t in self.pageTemplates if t.id == naam][0]
        super().handle_pageBegin()

    def handle_documentBegin(self):
        super().handle_documentBegin(); self.canv._doc_ref = self

    def ref(self, canv, doc): canv._doc_ref = self

    def kop_voet(self, canv, doc):
        n = canv.getPageNumber(); recto = n % 2 == 1
        canv.saveState(); canv.setFont('PopM', 8); canv.setFillColor(GRIJS)
        y = H - 0.45*inch
        if not self.paginas.get('_start_%d' % n):
            if recto: canv.drawRightString(W - OUT, y, self.hst.upper())
            else: canv.drawString(OUT, y, self.boek['kop'].upper())
            canv.setStrokeColor(LICHT); canv.setLineWidth(0.5)
            x0 = IN if recto else OUT
            canv.line(x0, y - 6, x0 + FW, y - 6)
        canv.setFont('PopM', 9); canv.setFillColor(DONKER)
        (canv.drawRightString(W - OUT, 0.42*inch, str(n)) if recto else canv.drawString(OUT, 0.42*inch, str(n)))
        canv.restoreState()


def zet_modus(m): return Stil(lambda d, c: setattr(d, 'modus', m))
def markeer(k): return Stil(lambda d, c: d.paginas.__setitem__(k, c.getPageNumber()))
def hoofdstuk(naam):
    def f(d, c):
        d.hst = naam.replace("'", '\u2019'); d.paginas['_start_%d' % c.getPageNumber()] = True
    return Stil(f)


def stijlen(B):
    k = 1.32 if B.get('groot') else B.get('schaal', 1.0)
    return dict(
        item=ParagraphStyle('i', fontName='Car', fontSize=12.2*k, leading=16.4*k, textColor=DONKER),
        num=ParagraphStyle('n', fontName='PopB', fontSize=10.5*k, leading=16.4*k, textColor=DONKER, alignment=TA_RIGHT),
        opt=ParagraphStyle('o', fontName='Car', fontSize=12.2*k, leading=15.6*k, textColor=DONKER),
        ant=ParagraphStyle('a', fontName='CarI', fontSize=12.2*k, leading=16.4*k, textColor=GRIJS),
        hlabel=ParagraphStyle('hl', fontName='PopM', fontSize=8.5*min(k, 1.2), leading=11*min(k, 1.2), textColor=GRIJS),
        htitel=ParagraphStyle('ht', fontName='PopB', fontSize=25*min(k, 1.15), leading=29*min(k, 1.15), textColor=DONKER),
        teaser=ParagraphStyle('te', fontName='CarI', fontSize=12.2*k, leading=15.5*k, textColor=GRIJS),
        body=ParagraphStyle('b', fontName='Car', fontSize=(12.2 if B.get('groot') else 11.5)*k, leading=16.4*k, textColor=DONKER, spaceAfter=9),
        klein=ParagraphStyle('k', fontName='Car', fontSize=12.2 if B.get('groot') else 9.5, leading=16 if B.get('groot') else 13, textColor=DONKER, spaceAfter=7),
        kop=ParagraphStyle('kop', fontName='PopB', fontSize=20*min(k, 1.15), leading=25*min(k, 1.15), textColor=DONKER, spaceAfter=14),
        k=k)


def rij(cellen, breedtes, onder=10.5):
    t = Table([cellen], colWidths=breedtes, hAlign='LEFT')
    t.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0),
                           ('RIGHTPADDING', (0, 0), (0, 0), 8), ('RIGHTPADDING', (1, 0), (-1, -1), 0),
                           ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), onder)]))
    return t


def verhaal(B, toc):
    S = stijlen(B)
    T = dict(EN, **B.get('t', {}))
    k = S['k']; nb = 38 * min(k, 1.15)
    s = []
    # titelpagina
    s.append(Spacer(1, 1.5*inch))
    for tekst, grootte in B['titel_regels']:
        s.append(Paragraph(mooi(tekst), ParagraphStyle('t', fontName='PopB', fontSize=grootte, leading=grootte*1.12,
                                                       textColor=DONKER, alignment=TA_CENTER)))
    s.append(Spacer(1, 18))
    s.append(Paragraph(mooi(B['ondertitel']), ParagraphStyle('t3', fontName='PopM', fontSize=13, leading=18, textColor=DONKER, alignment=TA_CENTER)))
    s.append(Spacer(1, 8))
    s.append(Paragraph(mooi(B['tagline']), ParagraphStyle('t4', fontName='CarI', fontSize=12.5, leading=16, textColor=GRIJS, alignment=TA_CENTER)))
    s.append(Spacer(1, 2.0*inch))
    s.append(Paragraph(B['auteur'].upper(), ParagraphStyle('t5', fontName='PopM', fontSize=12, leading=16, textColor=DONKER, alignment=TA_CENTER)))
    s.append(PageBreak())
    # copyright
    s.append(Spacer(1, (2.0 if B.get('groot') else 4.2)*inch))
    for t in B['copyright']:
        s.append(Paragraph(t, S['klein']))
    s.append(PageBreak())
    # intro
    s.append(Spacer(1, 0.3*inch)); s.append(Paragraph(mooi(B['intro_kop']), S['kop']))
    for t in B['intro']:
        s.append(Paragraph(t, S['body']))
    s.append(PageBreak())
    # inhoud
    s.append(Spacer(1, 0.3*inch)); s.append(Paragraph(T['inhoud'], S['kop']))
    sc = lambda f, sz, kl, al=TA_LEFT: ParagraphStyle('c', fontName=f, fontSize=sz, leading=sz*1.3, textColor=kl, alignment=al)
    extra = ([(T['quiz_toc'], '_quiz')] if B.get('tf_quiz') else []) + [(B['slot_kop'], '_slot')]
    rijen = [[Paragraph(f'{i:02d}', sc('PopB', 10, GRIJS)), Paragraph(mooi(n), sc('PopM', 11*min(k, 1.15), DONKER)),
              Paragraph(str(toc.get(n, '')), sc('PopM', 11*min(k, 1.15), DONKER, TA_RIGHT))] for i, (n, _, _) in enumerate(B['hoofdstukken'], 1)]
    rijen += [[Paragraph('', S['klein']), Paragraph(mooi(n), sc('PopM', 11*min(k, 1.15), DONKER)),
               Paragraph(str(toc.get(key, '')), sc('PopM', 11*min(k, 1.15), DONKER, TA_RIGHT))] for n, key in extra]
    tt = Table(rijen, colWidths=[28, FW - 64, 36])
    tt.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('LEFTPADDING', (0, 0), (-1, -1), 0),
                            ('RIGHTPADDING', (0, 0), (-1, -1), 0), ('TOPPADDING', (0, 0), (-1, -1), 2.6),
                            ('BOTTOMPADDING', (0, 0), (-1, -1), 2.6), ('LINEBELOW', (0, 0), (-1, -2), 0.4, LICHT)]))
    s.append(tt)
    s.append(zet_modus('tekst'))
    # hoofdstukken
    nr = 0; label = B.get('label', 'FACTS')
    for i, (naam, teaser, items) in enumerate(B['hoofdstukken'], 1):
        s += [PageBreak(), hoofdstuk(naam), markeer(naam), Spacer(1, 4),
              Paragraph(T['hlabel'].format(i2=f'{i:02d}', i=i, label=label, a=nr+1, b=nr+len(items)), S['hlabel']), Spacer(1, 4),
              Paragraph(mooi(naam), S['htitel']), Spacer(1, 4), Paragraph(mooi(teaser), S['teaser']), Spacer(1, 6), Lijn(46)]
        antwoorden = []
        for it in items:
            nr += 1
            num = Paragraph(str(nr), S['num'])
            if B['modus'] == 'facts':
                s.append(rij([num, Paragraph(mooi(it), S['item'])], [nb, FW - nb - 4]))
            elif B['modus'] == 'wyr':
                cel = [Paragraph(mooi(it), S['item'])]
                if B.get('antwoordregel'):
                    cel.append(Paragraph(B['antwoordregel'], ParagraphStyle('ar', fontName='PopM', fontSize=8.5*k, leading=14*k,
                                                                           textColor=GRIJS, spaceBefore=4)))
                s.append(KeepTogether([rij([num, cel], [nb, FW - nb - 4], 14*k)]))
            elif B['modus'] == 'jokes':
                vraag, antw = it
                blok = Table([[num, Paragraph('<b>' + mooi(vraag) + '</b>', S['item'])],
                              ['', Paragraph(mooi(antw), S['ant'])]], colWidths=[nb, FW - nb - 4], hAlign='LEFT')
                blok.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0),
                                          ('RIGHTPADDING', (0, 0), (0, -1), 8), ('RIGHTPADDING', (1, 0), (1, -1), 0),
                                          ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, 0), 1),
                                          ('BOTTOMPADDING', (0, 1), (-1, 1), 12*k)]))
                s.append(KeepTogether([blok]))
            elif B['modus'] == 'quiz':
                vraag, opties, goed = it
                antwoorden.append((nr, goed, opties['ABCD'.index(goed)]))
                inner = [Paragraph('<b>' + mooi(vraag) + '</b>', S['item'])]
                ops = [Paragraph(f'<font name="PopB">{l}</font>&nbsp;&nbsp;{mooi(o)}', S['opt']) for l, o in zip('ABCD', opties)]
                bw = FW - nb - 4
                if max(len(o) for o in opties) <= B.get('kort', 22):
                    g = Table([[ops[0], ops[1]], [ops[2], ops[3]]], colWidths=[bw/2, bw/2], hAlign='LEFT')
                    g.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                                           ('TOPPADDING', (0, 0), (-1, -1), 1.5), ('BOTTOMPADDING', (0, 0), (-1, -1), 0)]))
                    inner += [Spacer(1, 3), g]
                else:
                    inner += [Spacer(1, 3)] + ops
                blok = Table([[num, inner]], colWidths=[nb, FW - nb - 4], hAlign='LEFT')
                blok.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0),
                                          ('RIGHTPADDING', (0, 0), (0, 0), 8), ('RIGHTPADDING', (1, 0), (1, 0), 0),
                                          ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 13*k)]))
                s.append(blok)
        if antwoorden:
            st_a = ParagraphStyle('aa', fontName='Car', fontSize=12.2*k, leading=15.6*k, textColor=DONKER)
            kop = [Spacer(1, 6), Lijn(46, 2.5, 10), Paragraph(f'Answers: {mooi(naam)}', ParagraphStyle('ak', parent=S['kop'], fontSize=15*min(k, 1.15), leading=19*min(k, 1.15), spaceAfter=8))]
            cel = [Paragraph(f'<b>{n}.</b> {g} \u2014 {mooi(o)}', st_a) for n, g, o in antwoorden]
            helft = (len(cel) + 1) // 2
            r2 = [[cel[j], cel[j + helft] if j + helft < len(cel) else ''] for j in range(helft)]
            ta = Table(r2, colWidths=[FW/2, FW/2], hAlign='LEFT')
            ta.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0),
                                    ('RIGHTPADDING', (0, 0), (-1, -1), 6), ('TOPPADDING', (0, 0), (-1, -1), 1.5),
                                    ('BOTTOMPADDING', (0, 0), (-1, -1), 1.5)]))
            s.append(KeepTogether(kop + [ta]))
    # waar/niet waar-quiz
    if B.get('tf_quiz'):
        alle = [f for _, _, fs in B['hoofdstukken'] for f in fs]
        s += [PageBreak(), hoofdstuk(T['quiz_kop']), markeer('_quiz'), Spacer(1, 4), Paragraph(T['quiz_label'], S['hlabel']), Spacer(1, 4),
              Paragraph(T['quiz_titel'], S['htitel']), Spacer(1, 4),
              Paragraph(T['quiz_teaser'].format(n=len(B['tf_quiz'])), S['teaser']),
              Spacer(1, 6), Lijn(46)]
        st_tf = ParagraphStyle('tf', fontName='PopM', fontSize=10, leading=16.4, textColor=GRIJS, alignment=TA_RIGHT)
        for i, (q, _, _) in enumerate(B['tf_quiz'], 1):
            s.append(rij([Paragraph(str(i), S['num']), Paragraph(mooi(q), S['item']), Paragraph(T['tf'], st_tf)], [nb, FW - nb - 52, 52]))
        s += [PageBreak(), Spacer(1, 4), Paragraph(T['antworten'], S['kop'])]
        st_a = ParagraphStyle('a2', fontName='Car', fontSize=11.5, leading=15, textColor=DONKER)
        cel = []
        for i, (q, waar, zoek) in enumerate(B['tf_quiz'], 1):
            tr = [n for n, f in enumerate(alle, 1) if zoek.lower() in f.lower()]
            assert len(tr) == 1, (zoek, tr)
            cel.append(Paragraph(f'<b>{i}. {T["waar"] if waar else T["onwaar"]}</b> \u2014 {T["zie"]} {tr[0]}', st_a))
        helft = (len(cel) + 1) // 2
        ta = Table([[cel[j], cel[j + helft] if j + helft < len(cel) else ''] for j in range(helft)], colWidths=[FW/2, FW/2], hAlign='LEFT')
        ta.setStyle(TableStyle([('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                                ('TOPPADDING', (0, 0), (-1, -1), 2.5), ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5)]))
        s.append(ta)
        s.append(Spacer(1, 10))
        s.append(Paragraph(T['score'], S['body']))
    # slot
    s += [PageBreak(), hoofdstuk(B['slot_kop']), markeer('_slot'), Spacer(1, 0.3*inch), Paragraph(mooi(B['slot_kop']), S['kop'])]
    for t in B['slot']:
        s.append(Paragraph(t, S['body']))
    if B.get('ook'):
        s += [Spacer(1, 0.3*inch), Lijn(46), Paragraph(T['ook'].format(auteur=B['auteur']),
                                                       ParagraphStyle('ab', fontName='PopB', fontSize=14, leading=19, textColor=DONKER, spaceAfter=8))]
        for t, o in B['ook']:
            s.append(Paragraph(f'<b>{mooi(t)}</b><br/>{mooi(o)}', S['body']))
    if B.get('_leeg'):
        s += [zet_modus('kaal'), PageBreak(), Spacer(1, 1)]
    return s


def bouw(B, uit, toc):
    global TAAL
    TAAL = B.get('taal', 'en')
    d = Doc(uit, B); d.build(verhaal(B, toc)); return d


if __name__ == '__main__':
    map_, uit = sys.argv[1], sys.argv[2]
    spec = importlib.util.spec_from_file_location('cfg', map_.rstrip('/') + '/config.py')
    cfg = importlib.util.module_from_spec(spec); spec.loader.exec_module(cfg)
    B = cfg.BOEK
    d1 = bouw(B, uit, {})
    toc = {k: v for k, v in d1.paginas.items() if not k.startswith('_start_')}
    d2 = bouw(B, uit, toc)
    toc2 = {k: v for k, v in d2.paginas.items() if not k.startswith('_start_')}
    assert toc == toc2, (toc, toc2)
    if d2.page % 2:
        B['_leeg'] = True; d2 = bouw(B, uit, toc2)
    print('paginas', d2.page, 'inhoud', toc2)
