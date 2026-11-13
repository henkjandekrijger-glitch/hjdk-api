"""Generieke KDP-omslag (full wrap met bleed, 6x9, wit papier) via Chromium.
Gebruik: from omslag_gen import maak; maak(cfg)  (zie men/omslag_cfg.py)."""
from playwright.sync_api import sync_playwright
from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject
from PIL import Image
import subprocess, os, tempfile

E = 'file:///home/claude/boek/emoji/'
G = 'file:///usr/share/fonts/truetype/google-fonts/'
C = 'file:///usr/share/fonts/truetype/crosextra/'
B = 0.125


def img(code, x, y, s, r, schaduw=True):
    f = 'filter:drop-shadow(0 0.03in 0.02in rgba(0,0,0,.22));' if schaduw else ''
    return (f'<img src="{E}{code}.svg" style="position:absolute;left:{x}in;top:{y}in;width:{s}in;height:{s}in;'
            f'transform:rotate({r}deg);{f}">')


def vink(kleur):
    return (f'<svg viewBox="0 0 10 10" style="width:.13in;height:.13in;vertical-align:-0.01in"><path d="M1 5.5 L4 8.5 L9 1.5" '
            f'fill="none" stroke="{kleur}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>')


def html(c, W, H, RUG, BO=B, PW=6, SH=0):
    X_RUG = BO + PW; fp = X_RUG + RUG; fx = fp + SH; ty = BO
    k = c['kleur']
    TH = c.get('trim_h', 9); TW = c.get('trim_w', 6); AB = c.get('achter_breed', 5)
    titels = ''.join(f'<div class="titel abs" style="left:{fx+0.38}in; top:{ty+top}in; font-size:{sz}pt;">{t}</div>'
                     for t, sz, top in c['titel'])
    em = ''.join(img(e, fx + x, ty + y, s, r) for e, x, y, s, r in c['emoji'])
    held = img(*((c['held'][0], fx + c['held'][1], ty + c['held'][2]) + tuple(c['held'][3:]))) if c.get('held') else ''
    kaarten = ''.join(f'<div class="kaart" style="left:{BO+0.5}in; top:{ty+top}in; width:{AB}in;"><b class="nr">{nr}</b>{t}</div>'
                      for nr, t, top in c['kaarten'])
    lijst = ''.join(f'<div>{vink(k["accent"])}&nbsp; {t}</div>' for t in c['lijst'])
    em_a = ''.join(img(e, BO + x, ty + y, s, r) for e, x, y, s, r in c.get('emoji_achter', []))
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face {{ font-family:PopB; src:url('{G}Poppins-Bold.ttf'); }}
@font-face {{ font-family:PopM; src:url('{G}Poppins-Medium.ttf'); }}
@font-face {{ font-family:Car; src:url('{C}Carlito-Regular.ttf'); }}
@font-face {{ font-family:CarB; src:url('{C}Carlito-Bold.ttf'); }}
@page {{ size:{W}in {H}in; margin:0; }}
html,body {{ margin:0; padding:0; }}
body {{ width:{W}in; height:{H}in; position:relative; overflow:hidden;
  background: radial-gradient(ellipse at {fx+3}in 3.2in, {k['bg1']} 0%, {k['bg2']} 55%, {k['bg3']} 100%); }}
.abs {{ position:absolute; }}
.titel {{ font-family:PopB; color:{k['inkt']}; line-height:.86; letter-spacing:-0.01em; white-space:nowrap; }}
.acc {{ color:{k['accent']}; }}
.kaart {{ position:absolute; background:{k['kaart']}; border-radius:.12in; box-shadow:0 .03in .06in rgba(0,0,0,.2);
  font-family:Car; color:{k['kaartinkt']}; font-size:12.5pt; line-height:1.28; padding:.13in .18in .13in .72in; box-sizing:border-box; }}
.kaart b.nr {{ position:absolute; left:.15in; top:.12in; font-family:PopB; color:{k.get('nr', k['accent'])}; font-size:12pt; }}
.lijst {{ font-family:PopM; font-size:11.5pt; line-height:1.55; color:{k['inkt']}; }}
</style></head><body>
<div class="abs" style="left:{fx+0.42}in; top:{ty+0.38}in; font-family:PopB; font-size:12pt; letter-spacing:.22em; color:{k['inkt']};">{c['label']}</div>
{titels}
{held}
<div class="abs" style="left:{fx+0.42}in; top:{ty+c['sub_top']}in; width:{c.get('sub_breed', 4.6)}in; font-family:PopB; font-size:{c.get('sub_pt', 17)}pt; line-height:1.22; color:{k['inkt']};">{c['sub']}</div>
{em}
<div class="abs" style="left:{fx}in; top:{ty+TH-1.38}in; width:{TW}in; text-align:center; font-family:PopB; font-size:15pt; letter-spacing:.3em; color:{k['inkt']};">{c['auteur'].upper()}</div>
<div class="abs" style="left:{fp}in; top:{ty+TH-0.85}in; width:{round(W-fp,4)}in; height:{round(H-ty-(TH-0.85),4)}in; background:{k['band']}; color:{k['bandinkt']};
  font-family:PopB; text-align:center; letter-spacing:.08em; font-size:{c.get('band_pt', 13.5)}pt; padding-top:.27in; box-sizing:border-box; padding-right:{BO}in;">{c['band']}</div>
<div class="abs" style="left:{X_RUG}in; top:0; width:{RUG}in; height:{H}in; display:{'block' if c['paginas'] >= 80 and c['rug'] else 'none'};">
  <div style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%) rotate(90deg); white-space:nowrap;
       font-family:PopB; font-size:{c.get('rug_pt', 7.6)}pt; color:{k['inkt']}; letter-spacing:.06em;">{c['rug']}&nbsp;&nbsp;&nbsp;&nbsp;<span style="font-family:PopM;">{c['auteur'].upper()}</span></div>
</div>
<div class="abs" style="left:{BO+0.5}in; top:{ty+0.5}in; width:{AB}in;">
  <div style="font-family:PopB; font-size:25pt; line-height:1.1; color:{k['inkt']};">{c['kop']}</div>
  <div style="font-family:Car; font-size:13pt; line-height:1.38; color:{k['inkt']}; margin-top:.16in;">{c['blurb']}</div>
</div>
{kaarten}
<div class="abs lijst" style="left:{BO+0.55}in; top:{ty+c['lijst_top']}in; width:{AB}in;">{lijst}</div>
{em_a}
<div class="abs" style="left:{BO+0.55}in; top:{ty+TH-0.8}in; font-family:PopM; font-size:10pt; letter-spacing:.2em; color:{k['inkt']};">{c['auteur'].upper()}</div>
</body></html>"""


def maak(c, hard=None):
    """hard = dict(spine=, w=, h=) uit de KDP-cover-calculator (case laminate): maakt omslag_hard.pdf."""
    m = c['map']
    if hard:
        RUG, W, H = hard['spine'], hard['w'], hard['h']
        geo = dict(BO=0.591, PW=round((W - 2*0.591 - RUG) / 2, 4), SH=0.15)
        naam = 'omslag_hard'
    else:
        RUG = round(c['paginas'] * 0.002252, 4)
        W = round(B + 6 + RUG + 6 + B, 4); H = 9.25
        geo = {}; naam = 'omslag'
    open(f'{m}/{naam}.html', 'w').write(html(c, W, H, RUG, **geo))
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': int(W*96), 'height': int(H*96)})
        pg.goto(f'file://{m}/{naam}.html'); pg.wait_for_timeout(800)
        pg.pdf(path=f'{m}/{naam}.pdf', width=f'{W}in', height=f'{H}in', print_background=True,
               margin={'top': '0', 'right': '0', 'bottom': '0', 'left': '0'})
        b.close()
    r = PdfReader(f'{m}/{naam}.pdf'); w = PdfWriter()
    for pg_ in r.pages:
        box = RectangleObject([0, 0, round(W*72, 3), round(H*72, 3)])
        pg_.mediabox = box; pg_.cropbox = box; pg_.trimbox = box; pg_.bleedbox = box
        w.add_page(pg_)
    w.write(f'{m}/{naam}.pdf')
    if hard:
        subprocess.run(['pdftoppm', '-r', '60', '-png', '-singlefile', f'{m}/{naam}.pdf', f'{m}/{naam}_klein'], check=True)
        print(f'hardcover {W} x {H} in, rug {RUG}'); return
    tmp = tempfile.mkdtemp()
    subprocess.run(['pdftoppm', '-r', '150', '-png', f'{m}/omslag.pdf', f'{tmp}/o'], check=True)
    im = Image.open(f'{tmp}/o-1.png'); dpi = 150
    x0 = int((B + 6 + RUG)*dpi); y0 = int(B*dpi)
    im.crop((x0, y0, x0 + 6*dpi, y0 + 9*dpi)).convert('RGB').save(f'{m}/voorkant.jpg', quality=92)
    im.resize((im.width // 2, im.height // 2)).save(f'{m}/omslag_klein.png')
    print(f'rug {RUG} in, {W} x {H} in, fonts:', subprocess.run(['pdffonts', f'{m}/omslag.pdf'], capture_output=True, text=True).stdout.count('\n') - 2)
