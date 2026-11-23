# Compact binnenwerk The Definitive Apocrypha (KDP JMB92DMKYAP, 8,5 x 11 met bleed).
# Bron: Google Doc "Definitive Apocrypha" van Henkjan (export definitive_bron.docx).
# Gebruik: python3 bouw.py  -> binnenwerk.pdf (en binnenwerk.html)
import re, html, base64, io, sys
import docx, segno
from weasyprint import HTML

BRON = 'definitive_bron.docx'
REVIEW = 'https://whichtobuy.best/r/apo'
EDITIE = 'Revised Edition 2027'
KORT = {  # lopende kop
    'The First Book of Esdras': '1 Esdras', 'The Second Book of Esdras': '2 Esdras',
    'The Book of Tobit': 'Tobit', 'The Book of Judith': 'Judith',
    'The Greek Additions to Esther': 'Additions to Esther', 'The Book of Wisdom': 'Wisdom',
    'The Book of Sirach (or Ecclesiasticus)': 'Sirach', 'The Book of Baruch': 'Baruch',
    'Letter of Jeremiah': 'Letter of Jeremiah', 'The Song of the Three Holy Children': 'Song of the Three Holy Children',
    'The Book of Susanna': 'Susanna', 'The History of the Destruction of Bel and the Dragon': 'Bel and the Dragon',
    'The Prayer of Manasses': 'Prayer of Manasses', 'The First Book of the Maccabees': '1 Maccabees',
    'The Second Book of the Maccabees': '2 Maccabees',
}

def lees():
    ps = docx.Document(BRON).paragraphs
    voorwoord, boeken, cur, deel = [], [], None, None
    for p in ps:
        t = p.text.strip().replace(' ', ' ')
        st = p.style.name
        if not t:
            continue
        if st == 'Heading 1':
            if t == 'Contents':
                deel = None
            elif t.startswith('Foreword'):
                deel = 'voor'
            else:
                cur = {'titel': t, 'intro': [], 'hfd': [], 'los': []}
                boeken.append(cur); deel = 'boek'
            continue
        if st == 'Heading 2':
            continue
        if deel == 'voor':
            voorwoord.append(t)
        elif deel == 'boek':
            m = re.match(r'^(\d+):(\d+)\s+(.*)$', t)
            if t == 'King of Judah':
                cur['proza'] = []
                continue
            if 'proza' in cur and not m:
                cur['proza'].append(t)
                continue
            if m:
                c, v, tekst = int(m.group(1)), int(m.group(2)), m.group(3)
                if not cur['hfd'] or cur['hfd'][-1][0] != c:
                    cur['hfd'].append((c, []))
                cur['hfd'][-1][1].append((v, tekst))
            elif not cur['hfd']:
                cur['intro'].append(t)
            else:
                cur['hfd'][-1][1].append((None, t))
    return voorwoord, boeken

def e(s):
    return html.escape(s, quote=False)

def qr_svg(url):
    b = io.BytesIO(); segno.make(url, error='m').save(b, kind='svg', scale=4, border=0, dark='#000')
    return 'data:image/svg+xml;base64,' + base64.b64encode(b.getvalue()).decode()

CSS = r'''
@font-face { font-family: G; src: url(fonts/EBGaramond-Regular.ttf); font-weight: 400; font-style: normal; }
@font-face { font-family: G; src: url(fonts/EBGaramond-SemiBold.ttf); font-weight: 600; font-style: normal; }
@font-face { font-family: G; src: url(fonts/EBGaramond-Bold.ttf); font-weight: 700; font-style: normal; }
@font-face { font-family: G; src: url(fonts/EBGaramond-Italic.ttf); font-weight: 400; font-style: italic; }
@page { size: 8.625in 11.25in; margin: 0.82in 0.72in 0.8in 0.9in;
  @top-center { content: string(kop); font: italic 9.5pt G; color: #000; }
  @bottom-center { content: counter(page); font: 9.5pt G; color: #000; } }
@page :left { margin: 0.82in 0.9in 0.8in 0.72in; }
@page voor { @top-center { content: none } @bottom-center { content: none } }
@page boekstart { @top-center { content: none } }
html { font-family: G; font-size: 10.5pt; line-height: 1.2; color: #000; hyphens: auto; }
body { margin: 0; }
.voor { page: voor; }
.titel { break-after: page; text-align: center; padding-top: 2.4in; }
.titel h1 { font-size: 34pt; font-weight: 700; letter-spacing: 1pt; margin: 0 0 14pt; line-height: 1.1; }
.titel .sub { font-size: 15pt; margin: 0 0 30pt; }
.titel .ed { font-size: 12pt; letter-spacing: 2pt; text-transform: uppercase; margin-bottom: 70pt; }
.titel .door { font-size: 13pt; font-style: italic; }
.titel .uitg { font-size: 12pt; margin-top: 2.2in; letter-spacing: 2pt; text-transform: uppercase; }
.colofon { break-after: page; padding-top: 6.2in; font-size: 9.5pt; line-height: 1.35; }
.colofon p { margin: 0 0 7pt; }
.inhoud { break-after: page; }
.inhoud h2, .voorwoord h2 { font-size: 20pt; font-weight: 600; text-align: center; margin: 0.3in 0 22pt; }
.inhoud ol { list-style: none; padding: 0; margin: 0 0.6in; font-size: 12pt; line-height: 1.75; }
.inhoud a { color: #000; text-decoration: none; }
.inhoud a::after { content: leader('.') target-counter(attr(href), page); }
.voorwoord { break-after: page; }
.voorwoord p { text-align: justify; margin: 0 0 7pt; text-indent: 0; font-size: 11pt; line-height: 1.3; }
.voorwoord .sign { text-align: right; font-style: italic; margin-top: 14pt; }
.boek { break-before: page; }
.boek h2 { page: boekstart; string-set: kop attr(data-kort); font-size: 22pt; font-weight: 600; text-align: center;
  margin: 0.1in 0 4pt; line-height: 1.15; }
.boek .lijn { text-align: center; font-size: 11pt; margin: 0 0 14pt; letter-spacing: 6pt; }
.kolom { columns: 2; column-gap: 0.26in; column-fill: auto; }
.intro { font-style: italic; margin: 0 0 10pt; }
.intro p { margin: 0 0 5pt; text-align: justify; }
.intro .kopje { font-style: normal; font-weight: 600; font-size: 10pt; letter-spacing: 1.5pt; text-transform: uppercase; margin-bottom: 4pt; }
p.h { margin: 0 0 5pt; text-align: justify; text-indent: 0; orphans: 2; widows: 2; }
.cn { float: left; font-size: 25pt; line-height: 0.82; font-weight: 600; margin: 2pt 4pt 0 0; }
sup { font-size: 6.8pt; font-weight: 600; vertical-align: 2.6pt; line-height: 0; margin-right: 1pt; }
p.pk { font-weight: 600; font-size: 10pt; letter-spacing: 1.5pt; text-transform: uppercase; margin: 0 0 6pt; }
.slot { break-before: page; page: voor; text-align: center; padding-top: 2.6in; }
.slot h2 { font-size: 20pt; font-weight: 600; margin: 0 0 16pt; }
.slot p { font-size: 12pt; line-height: 1.45; margin: 0 1.1in 12pt; }
.slot img { width: 1.45in; height: 1.45in; margin-top: 18pt; }
.slot .klein { font-size: 10pt; margin-top: 6pt; }
'''

def bouw(uit='binnenwerk.pdf'):
    voorwoord, boeken = lees()
    h = ['<!doctype html><html lang="en"><head><meta charset="utf-8"><style>', CSS, '</style></head><body>']
    h.append('<section class="voor titel"><h1>The Definitive Apocrypha</h1>'
             '<p class="sub">Collection of all the 16 Books Rejected from the Bible</p>'
             f'<p class="ed">{EDITIE}</p><p class="door">Foreword and Introductions by Edward Whelan</p>'
             '<p class="uitg">Holy Reads</p></section>')
    h.append('<section class="voor colofon"><p><b>The Definitive Apocrypha</b><br>' + EDITIE + '</p>'
             '<p>The scripture text is the Apocrypha of the King James Version (1611, revised 1769), which is in the public domain.</p>'
             '<p>Foreword and introductions by Edward Whelan. Copyright Holy Reads. All rights reserved for the foreword, the introductions and the arrangement of this edition.</p>'
             '<p>Published by Holy Reads.</p></section>')
    h.append('<section class="voor inhoud"><h2>Contents</h2><ol>'
             '<li><a href="#voorwoord">Foreword and Introduction</a></li>')
    for i, b in enumerate(boeken):
        h.append(f'<li><a href="#b{i}">{e(b["titel"])}</a></li>')
    h.append('</ol></section>')
    h.append('<section class="voor voorwoord" id="voorwoord"><h2>Foreword and Introduction</h2>')
    for t in voorwoord:
        if t.strip() == 'Edward Whelan':
            h.append(f'<p class="sign">{e(t)}</p>')
        else:
            h.append(f'<p>{e(t)}</p>')
    h.append('</section>')
    for i, b in enumerate(boeken):
        kort = KORT.get(b['titel'], b['titel'])
        h.append(f'<section class="boek"><h2 id="b{i}" data-kort="{e(kort)}">{e(b["titel"])}</h2><p class="lijn">&#10022;</p><div class="kolom">')
        if b['intro']:
            h.append('<div class="intro"><p class="kopje">Introduction</p>' + ''.join(f'<p>{e(t)}</p>' for t in b['intro']) + '</div>')
        if b.get('proza'):
            h.append('<p class="pk">The Prayer of Manasses, King of Judah</p>' + ''.join(f'<p class="h">{e(t)}</p>' for t in b['proza']))
        for c, verzen in b['hfd']:
            delen = [f'<span class="cn">{c}</span>']
            for v, t in verzen:
                if v is None:
                    delen.append(f' <i>{e(t)}</i> ')
                elif v == 1:
                    delen.append(e(t) + ' ')
                else:
                    delen.append(f'<sup>{v}</sup>{e(t)} ')
            h.append('<p class="h">' + ''.join(delen).strip() + '</p>')
        h.append('</div></section>')
    h.append('<section class="slot"><h2>Thank you for reading</h2>'
             '<p>How did you find this edition? A short, honest review on Amazon helps other readers decide whether it is right for them. One sentence is enough.</p>'
             f'<img src="{qr_svg(REVIEW)}"><p class="klein">Scan to write your review</p></section>')
    h.append('</body></html>')
    src = ''.join(h)
    open('binnenwerk.html', 'w').write(src)
    doc = HTML(string=src, base_url='.').render()
    doc.write_pdf(uit)
    return len(doc.pages)

if __name__ == '__main__':
    n = bouw(sys.argv[1] if len(sys.argv) > 1 else 'binnenwerk.pdf')
    print('pagina', n)
