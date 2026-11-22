"""Omslag (full wrap, 6 x 9, wit papier, met bleed) voor "Ich tu nur so, als ob". Eigen ontwerp: geel notitieblaadje op marineblauw.
Gebruik: python3 omslag.py  (leest paginas.txt van bouw.py) -> omslag.pdf, voorkant.jpg, omslag_klein.png"""
import os, subprocess, tempfile
from playwright.sync_api import sync_playwright
from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject
from PIL import Image

HIER = os.path.dirname(os.path.abspath(__file__))
E = f'file://{HIER}/emoji/'
G = 'file:///usr/share/fonts/truetype/google-fonts/'
C = 'file:///usr/share/fonts/truetype/crosextra/'
B = 0.125
NAVY, NAVY2, GEEL, INKT = '#1E2A47', '#16203A', '#FFD84A', '#1E2A47'


def emo(naam, x, y, s, r=0):
    return (f'<img src="{E}{naam}.svg" style="position:absolute;left:{x}in;top:{y}in;width:{s}in;height:{s}in;transform:rotate({r}deg);'
            f'filter:drop-shadow(0 .04in .03in rgba(0,0,0,.35));">')


def vink():
    return (f'<svg viewBox="0 0 10 10" style="width:.14in;height:.14in;vertical-align:-0.015in"><path d="M1 5.5 L4 8.5 L9 1.5" fill="none" '
            f'stroke="{GEEL}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>')


def html(W, H, RUG):
    fx = B + 6 + RUG  # linkerrand voorkant (trim)
    bx = B            # linkerrand achterkant (trim)
    kaarten = [('Lass uns das offline besprechen.', 'Lass uns das nie besprechen.'),
               ('Gute Frage!', 'Ich habe keine Ahnung.'),
               ('Wir sind auf einem guten Weg.', 'Wir haben noch nicht angefangen.')]
    k_html = ''.join(f'''<div class="kaart" style="top:{B + 3.3 + i * 0.84}in;"><div class="zeg">„{a}“</div><div class="bed">{b}</div></div>'''
                     for i, (a, b) in enumerate(kaarten))
    lijst = ['Büro-Übersetzer mit 80 Sätzen', 'Ausreden-Generator und 42 fertige Ausreden', '6 Bingo-Karten für Meetings und Weihnachtsfeier',
             'Tests, Büro-Horoskop, Rätsel und Labyrinthe', 'Formulare, Bucket-List und Weihnachtsfeier-Guide']
    l_html = ''.join(f'<div>{vink()}&nbsp; {t}</div>' for t in lijst)
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face {{ font-family:PopB; src:url('{G}Poppins-Bold.ttf'); }}
@font-face {{ font-family:PopM; src:url('{G}Poppins-Medium.ttf'); }}
@font-face {{ font-family:Car; src:url('{C}Carlito-Regular.ttf'); }}
@font-face {{ font-family:CarB; src:url('{C}Carlito-Bold.ttf'); }}
@page {{ size:{W}in {H}in; margin:0; }}
html,body {{ margin:0; padding:0; }}
body {{ width:{W}in; height:{H}in; position:relative; overflow:hidden;
  background: radial-gradient(ellipse at {fx + 3}in 3.4in, #2A3A60 0%, {NAVY} 50%, {NAVY2} 100%); }}
.abs {{ position:absolute; }}
.noot {{ position:absolute; left:{fx + 0.62}in; top:{B + 1.12}in; width:4.75in; height:4.55in; background:{GEEL}; transform:rotate(-3deg);
  box-shadow: 0 .09in .16in rgba(0,0,0,.45); }}
.noot:after {{ content:''; position:absolute; left:0; right:0; bottom:0; height:.5in; background:linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,.07)); }}
.tape {{ position:absolute; left:{fx + 2.35}in; top:{B + 0.93}in; width:1.4in; height:.38in; background:rgba(255,255,255,.55); transform:rotate(-6deg); }}
.titel {{ font-family:PopB; color:{INKT}; line-height:.9; letter-spacing:-0.01em; white-space:nowrap; }}
.kaart {{ position:absolute; left:{bx + 0.5}in; width:5.0in; background:#FFFFFF; border-radius:.1in; padding:.11in .2in .12in .2in; box-sizing:border-box;
  box-shadow:0 .03in .06in rgba(0,0,0,.3); border-left:.09in solid {GEEL}; }}
.zeg {{ font-family:Car; font-size:12pt; color:#555; }}
.bed {{ font-family:PopB; font-size:13pt; color:{INKT}; margin-top:.02in; }}
.lijst {{ font-family:PopM; font-size:11.5pt; line-height:1.62; color:#FFFFFF; }}
</style></head><body>
<!-- voorkant -->
<div class="abs" style="left:{fx}in; top:{B + 0.42}in; width:6in; text-align:center; font-family:PopB; font-size:11.5pt; letter-spacing:.24em; color:{GEEL};">DAS WICHTELGESCHENK FÜR KOLLEGEN</div>
<div class="noot">
  <div class="titel abs" style="left:.36in; top:.68in; font-size:52pt;">ICH TU NUR</div>
  <div class="titel abs" style="left:.36in; top:1.5in; font-size:52pt;">SO, ALS OB</div>
  <div class="abs" style="left:.4in; top:2.55in; width:3.4in; height:.07in; background:{INKT};"></div>
  <div class="abs" style="left:.38in; top:2.82in; font-family:PopB; font-size:19pt; line-height:1.25; color:{INKT}; width:4in;">Das Überlebensbuch<br>fürs Büro</div>
</div>
<div class="tape"></div>
{emo('paperclip', fx + 0.3, B + 0.95, 0.95, -25)}
{emo('face-with-rolling-eyes', fx + 4.6, B + 4.75, 1.15, 10)}
{emo('hot-beverage', fx + 3.35, B + 5.15, 1.05, -6)}
<div class="abs lijst" style="left:{fx + 0.55}in; top:{B + 6.1}in; width:5in; font-size:13pt; line-height:1.55;">
  <div>{vink()}&nbsp; Meeting-Übersetzer</div><div>{vink()}&nbsp; Ausreden-Generator</div><div>{vink()}&nbsp; Büro-Bingo</div><div>{vink()}&nbsp; Tests und Rätsel</div>
</div>
<div class="abs" style="left:{fx}in; top:{B + 8.25}in; width:6in; text-align:center; font-family:PopB; font-size:14pt; letter-spacing:.32em; color:#FFFFFF;">DAVID WARRIOR</div>
<!-- rug -->
<div class="abs" style="left:{B + 6}in; top:0; width:{RUG}in; height:{H}in;">
  <div style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%) rotate(90deg); white-space:nowrap; font-family:PopB; font-size:7.4pt;
       color:{GEEL}; letter-spacing:.06em;">ICH TU NUR SO, ALS OB&nbsp;&nbsp;&nbsp;&nbsp;<span style="font-family:PopM; color:#FFFFFF;">DAVID WARRIOR</span></div>
</div>
<!-- achterkant -->
<div class="abs" style="left:{bx + 0.5}in; top:{B + 0.5}in; width:5in;">
  <div style="font-family:PopB; font-size:22pt; line-height:1.12; color:#FFFFFF;">Für alle, die im Meeting nicken und an <span style="color:{GEEL};">Feierabend</span> denken.</div>
  <div style="font-family:Car; font-size:13pt; line-height:1.38; color:#E8ECF5; margin-top:.15in;">Endlich ein Buch, das versteht, was im Büro wirklich los ist.
  Mit Übersetzer für Büro-Deutsch, Ausreden für jede Lage, Bingo für endlose Meetings und Tests, die dir sagen, wer du wirklich bist.
  <b style="font-family:CarB; color:#FFFFFF;">Über 100 Seiten zum Lachen, Ausfüllen und Weiterschenken.</b></div>
</div>
<div class="abs" style="left:{bx + 0.5}in; top:{B + 3.05}in; font-family:PopB; font-size:9pt; letter-spacing:.2em; color:{GEEL};">WAS SIE SAGEN, UND WAS SIE MEINEN</div>
{k_html}
<div class="abs lijst" style="left:{bx + 0.52}in; top:{B + 5.92}in; width:5in;">{l_html}</div>
<div class="abs" style="left:{bx + 0.5}in; top:{B + 7.42}in; width:3.0in; font-family:PopM; font-size:10.5pt; line-height:1.4; color:#E8ECF5;">Das perfekte Wichtelgeschenk unter 10 Euro, für Kollegen, Chefs und alle, die nur so tun, als ob.</div>
<div class="abs" style="left:{bx + 0.5}in; top:{B + 8.32}in; font-family:PopM; font-size:10pt; letter-spacing:.2em; color:#FFFFFF;">DAVID WARRIOR</div>
</body></html>"""


def maak():
    paginas = int(open(os.path.join(HIER, 'paginas.txt')).read())
    RUG = round(paginas * 0.002252, 4); W = round(B + 6 + RUG + 6 + B, 4); H = 9.25
    m = HIER
    open(f'{m}/omslag.html', 'w').write(html(W, H, RUG))
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': int(W * 96), 'height': int(H * 96)})
        pg.goto(f'file://{m}/omslag.html'); pg.wait_for_timeout(900)
        pg.pdf(path=f'{m}/omslag.pdf', width=f'{W}in', height=f'{H}in', print_background=True, margin={'top': '0', 'right': '0', 'bottom': '0', 'left': '0'})
        b.close()
    r = PdfReader(f'{m}/omslag.pdf'); w = PdfWriter()
    for pg_ in r.pages:
        box = RectangleObject([0, 0, round(W * 72, 3), round(H * 72, 3)])
        pg_.mediabox = box; pg_.cropbox = box; pg_.trimbox = box; pg_.bleedbox = box; w.add_page(pg_)
    w.write(f'{m}/omslag.pdf')
    tmp = tempfile.mkdtemp()
    subprocess.run(['pdftoppm', '-r', '200', '-png', f'{m}/omslag.pdf', f'{tmp}/o'], check=True)
    im = Image.open(f'{tmp}/o-1.png'); dpi = 200
    x0 = int((B + 6 + RUG) * dpi); y0 = int(B * dpi)
    im.crop((x0, y0, x0 + 6 * dpi, y0 + 9 * dpi)).convert('RGB').save(f'{m}/voorkant.jpg', quality=92)
    im.resize((im.width // 3, im.height // 3)).save(f'{m}/omslag_klein.png')
    print(f'{paginas} p., rug {RUG} in, {W} x {H} in')


if __name__ == '__main__':
    maak()
