"""Bouwt de omslag (full wrap, met bleed) als PDF via Chromium."""
import sys, subprocess
from playwright.sync_api import sync_playwright

PAGINAS = int(sys.argv[1]) if len(sys.argv) > 1 else 104
RUG = round(PAGINAS * 0.002252, 4)          # wit papier
B = 0.125                                   # bleed
W = round(B + 6 + RUG + 6 + B, 4)
H = 9.25
X_RUG = B + 6
X_VOOR = X_RUG + RUG
E = 'file:///home/claude/boek/emoji/'
G = 'file:///usr/share/fonts/truetype/google-fonts/'
C = 'file:///usr/share/fonts/truetype/crosextra/'

GEEL, ROOD, ZWART = '#FFD43B', '#E63946', '#111111'

emoji_voor = [  # (code, x, y, grootte, rotatie) in inch t.o.v. trim voorkant
    ('1f995', 0.30, 5.55, 1.05, -8), ('1f419', 1.45, 6.20, 0.95, 6), ('1f680', 4.85, 5.15, 0.95, 18),
    ('1f34c', 2.55, 6.30, 0.80, -14), ('1fa90', 4.55, 6.30, 0.95, 0), ('1f9e0', 3.45, 5.80, 0.85, 8),
    ('1f992', 5.15, 4.30, 0.72, -6), ('26a1', 3.90, 5.22, 0.50, -12), ('1f4a1', 3.70, 6.75, 0.60, -10),
    ('1f988', 1.95, 5.35, 0.70, -4), ('1f41d', 2.95, 5.15, 0.45, 15), ('1f30b', 0.40, 6.75, 0.62, 0),
]


def img(code, x, y, s, r, extra=''):
    return (f'<img src="{E}{code}.svg" style="position:absolute;left:{x}in;top:{y}in;width:{s}in;height:{s}in;'
            f'transform:rotate({r}deg);{extra}">')


def html(BO=B, PW=6, SH=0, RUG_=None, W_=None, H_=None):
    RUG_ = RUG if RUG_ is None else RUG_; W_ = W if W_ is None else W_; H_ = H if H_ is None else H_
    X_RUG_ = BO + PW; fp = X_RUG_ + RUG_
    fx = fp + SH  # linkerrand inhoud voorkant
    ty = BO       # bovenrand trim/bord
    em = ''.join(img(c, fx + x, ty + y, s, r, 'filter:drop-shadow(0 0.03in 0.02in rgba(0,0,0,.18));')
                 for c, x, y, s, r in emoji_voor)
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face {{ font-family:PopB; src:url('{G}Poppins-Bold.ttf'); }}
@font-face {{ font-family:PopM; src:url('{G}Poppins-Medium.ttf'); }}
@font-face {{ font-family:PopR; src:url('{G}Poppins-Regular.ttf'); }}
@font-face {{ font-family:Car; src:url('{C}Carlito-Regular.ttf'); }}
@font-face {{ font-family:CarB; src:url('{C}Carlito-Bold.ttf'); }}
@page {{ size:{W_}in {H_}in; margin:0; }}
html,body {{ margin:0; padding:0; }}
body {{ width:{W_}in; height:{H_}in; position:relative; overflow:hidden;
  background: radial-gradient(ellipse at {fx+3}in 3.2in, #FFE47A 0%, {GEEL} 55%, #F9C513 100%); }}
.abs {{ position:absolute; }}
.titel {{ font-family:PopB; color:{ZWART}; line-height:.86; letter-spacing:-0.01em; }}
.rood {{ color:{ROOD}; }}
.band {{ position:absolute; background:{ZWART}; color:#fff; font-family:PopB; text-align:center; letter-spacing:.08em; }}
.kaart {{ position:absolute; background:#fff; border-radius:.12in; box-shadow:0 .03in .06in rgba(0,0,0,.18);
  font-family:Car; color:{ZWART}; font-size:12.5pt; line-height:1.28; padding:.13in .18in .13in .70in; box-sizing:border-box; }}
.kaart b.nr {{ position:absolute; left:.15in; top:.12in; font-family:PopB; color:{ROOD}; font-size:12pt; }}
.lijst {{ font-family:PopM; font-size:11.5pt; line-height:1.55; color:{ZWART}; }}
.lijst svg {{ width:.13in; height:.13in; vertical-align:-0.01in; }}
</style></head><body>

<!-- ===== VOORKANT ===== -->
<div class="abs" style="left:{fx+0.42}in; top:{ty+0.38}in; width:5.2in;">
  <div class="abs" style="left:0; top:0; font-family:PopB; font-size:12pt; letter-spacing:.22em; color:{ZWART};">1,000 TRUE FACTS</div>
</div>
<div class="titel abs" style="left:{fx+0.38}in; top:{ty+0.72}in; font-size:100pt;">WAIT,</div>
<div class="titel abs" style="left:{fx+0.38}in; top:{ty+2.12}in; font-size:84pt;">THAT&#8217;S</div>
<div class="titel abs" style="left:{fx+0.38}in; top:{ty+3.26}in; font-size:84pt;">TRUE<span class="rood">?!</span></div>
{img('1f92f', fx+4.45, ty+0.30, 1.42, 12, 'filter:drop-shadow(0 0.05in 0.04in rgba(0,0,0,.25));')}
<div class="abs" style="left:{fx+0.42}in; top:{ty+4.52}in; width:4.6in; font-family:PopB; font-size:17pt; line-height:1.22; color:{ZWART};">
  1,000 Weird, Funny &amp; Mind-Blowing Facts Nobody Told You</div>
{em}
<div class="abs" style="left:{fx}in; top:{ty+7.62}in; width:6in; text-align:center; font-family:PopB; font-size:15pt; letter-spacing:.3em; color:{ZWART};">ELIAS GRANT</div>
<div class="band" style="left:{fp}in; top:{ty+8.15}in; width:{round(W_-fp,4)}in; height:{round(H_-ty-8.15,4)}in; font-size:13.5pt; padding-top:.27in; box-sizing:border-box; padding-right:{BO}in;">
  TRIVIA GIFT BOOK FOR TEENS AND ADULTS</div>

<!-- ===== RUG ===== -->
<div class="abs" style="left:{X_RUG_}in; top:0; width:{RUG_}in; height:{H_}in;">
  <div style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%) rotate(90deg); white-space:nowrap;
       font-family:PopB; font-size:7.6pt; color:{ZWART}; letter-spacing:.06em;">
    WAIT, THAT&#8217;S TRUE<span class="rood">?!</span>&nbsp;&nbsp;&nbsp;&nbsp;<span style="font-family:PopM;">ELIAS GRANT</span></div>
</div>

<!-- ===== ACHTERKANT ===== -->
<div class="abs" style="left:{BO+0.5}in; top:{ty+0.5}in; width:5in;">
  <div style="font-family:PopB; font-size:25pt; line-height:1.1; color:{ZWART};">Warning: this book causes <span class="rood">jaw drops.</span></div>
  <div style="font-family:Car; font-size:13pt; line-height:1.38; color:{ZWART}; margin-top:.16in;">
    Did you know your body glows? That octopuses taste with their arms? That a cloud can weigh as much as 100 elephants?
    Packed with <b style="font-family:CarB;">1,000 true, surprising facts</b> from space, history, animals, food, money, the human brain
    and much more, this is the book that turns any dinner, car ride or holiday party into a round of
    &#8220;Wait, that&#8217;s true?!&#8221;</div>
</div>
<div class="kaart" style="left:{BO+0.5}in; top:{ty+3.05}in; width:5in;"><b class="nr">#251</b>Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid.</div>
<div class="kaart" style="left:{BO+0.5}in; top:{ty+3.86}in; width:5in;"><b class="nr">#58</b>Wombats produce cube-shaped poop.</div>
<div class="kaart" style="left:{BO+0.5}in; top:{ty+4.45}in; width:5in;"><b class="nr">#151</b>One day on Venus is longer than one year on Venus.</div>
<div class="kaart" style="left:{BO+0.5}in; top:{ty+5.04}in; width:5in;"><b class="nr">#202</b>Bananas are berries, but strawberries are not.</div>
<div class="abs lijst" style="left:{BO+0.55}in; top:{ty+5.9}in; width:5in;">
  <div><svg viewBox="0 0 10 10"><path d="M1 5.5 L4 8.5 L9 1.5" fill="none" stroke="#E63946" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>&nbsp; 1,000 fact-checked facts in 20 fun chapters</div>
  <div><svg viewBox="0 0 10 10"><path d="M1 5.5 L4 8.5 L9 1.5" fill="none" stroke="#E63946" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>&nbsp; Bonus true-or-false quiz to test your friends</div>
  <div><svg viewBox="0 0 10 10"><path d="M1 5.5 L4 8.5 L9 1.5" fill="none" stroke="#E63946" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>&nbsp; Short, punchy facts you can read in seconds</div>
  <div><svg viewBox="0 0 10 10"><path d="M1 5.5 L4 8.5 L9 1.5" fill="none" stroke="#E63946" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>&nbsp; A perfect stocking stuffer for teens and adults</div>
</div>
{img('1f384', BO+0.55, ty+7.35, 0.62, -6)}
{img('1f995', BO+1.3, ty+7.42, 0.55, 8)}
{img('2b50', BO+1.95, ty+7.4, 0.4, 12)}
<div class="abs" style="left:{BO+0.55}in; top:{ty+8.2}in; font-family:PopM; font-size:10pt; letter-spacing:.2em; color:{ZWART};">ELIAS GRANT</div>
</body></html>"""


if __name__ == '__main__':
    open('/home/claude/boek/omslag.html', 'w').write(html())
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': int(W*96), 'height': int(H*96)}, device_scale_factor=2)
        pg.goto('file:///home/claude/boek/omslag.html')
        pg.wait_for_timeout(800)
        pg.pdf(path='/home/claude/boek/omslag.pdf', width=f'{W}in', height=f'{H}in', print_background=True,
               margin={'top': '0', 'right': '0', 'bottom': '0', 'left': '0'})
        b.close()
    from pypdf import PdfReader, PdfWriter
    from pypdf.generic import RectangleObject
    r = PdfReader('/home/claude/boek/omslag.pdf'); w = PdfWriter()
    for pg_ in r.pages:
        box = RectangleObject([0, 0, round(W*72, 3), round(H*72, 3)])
        pg_.mediabox = box; pg_.cropbox = box; pg_.trimbox = box; pg_.bleedbox = box
        w.add_page(pg_)
    w.write('/home/claude/boek/omslag.pdf')
    print(f'rug {RUG} in, breedte {W} in x {H} in')
