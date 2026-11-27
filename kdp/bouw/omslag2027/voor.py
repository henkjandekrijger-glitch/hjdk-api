# Nieuwe voorkanten 2027. Elke voorkant is 1000 px breed = trim + 0,125 in bleed rechts, boven, onder
# (in de omslag komt de bleed links weg tegen de rug). Render: dsf 1 = voorbeeld, dsf = 300 dpi.
import base64, os, sys
from pathlib import Path

D = Path(__file__).parent
FS = D / 'node_modules/@fontsource'

def font(fam, pkg, w, style='normal'):
    f = FS / pkg / 'files' / f'{pkg}-latin-{w}-{style}.woff2'
    b = base64.b64encode(f.read_bytes()).decode()
    return f"@font-face{{font-family:'{fam}';src:url(data:font/woff2;base64,{b});font-weight:{w};font-style:{style}}}"

FONTS = ''.join([
    font('Cinzel', 'cinzel', 700), font('Cinzel', 'cinzel', 900), font('Cinzel', 'cinzel', 400),
    font('Bebas', 'bebas-neue', 400), font('Oswald', 'oswald', 700), font('Oswald', 'oswald', 500),
    font('Playfair', 'playfair-display', 700), font('Playfair', 'playfair-display', 400, 'italic'),
    font('Allura', 'allura', 400), font('Fredoka', 'fredoka', 700), font('Fredoka', 'fredoka', 600),
])

def img64(p):
    return 'data:image/jpeg;base64,' + base64.b64encode(Path(p).read_bytes()).decode()

# trim (in) per boek; hoogte in px volgt uit de breedte van 1000 px
TRIM = {'B0DMFSY1LR': (6, 9), 'B0D3KBF8MJ': (8, 10)}
def maat(a):
    w, h = TRIM.get(a, (8.5, 11))
    W, H = w + .125, h + .25
    return 1000, round(1000 * H / W), W

BASE = """*{margin:0;padding:0;box-sizing:border-box}html,body{width:%dpx;height:%dpx;overflow:hidden}
body{position:relative;font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased}
.abs{position:absolute}.c{left:0;right:0;text-align:center}
.badge{position:absolute;border-radius:50%%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;line-height:.9}
"""

def pagina(a, css, body):
    W, H, _ = maat(a)
    return f"<!doctype html><html><head><meta charset=utf-8><style>{FONTS}{BASE % (W, H)}{css}</style></head><body>{body}</body></html>"

# ---------- de 11 ontwerpen ----------
B = {}

B['B09SWQ8F3S'] = ("""
body{background:radial-gradient(ellipse at 50% 62%,#5b2bd6 0%,#2a0f73 38%,#0d0433 75%)}
.t1{top:70px;font:400 150px/0.9 Bebas;color:#ffd23f;letter-spacing:4px}
.t2{top:215px;font:400 94px/1 Bebas;color:#fff;letter-spacing:3px}.t2 i{font:700 40px Oswald;font-style:normal;color:#ffd23f;vertical-align:28px;margin-right:12px}
.sub{top:335px;font:500 34px/1.25 Oswald;color:#fff;letter-spacing:.5px;padding:0 100px}
.sub b{color:#ffd23f}
.atoom{left:200px;top:470px;width:600px;height:600px}
.cta{bottom:150px;left:120px;right:120px;background:#ffd23f;color:#1b0a55;font:700 30px/1.15 Oswald;padding:18px 20px;border-radius:14px;text-align:center;text-transform:uppercase;letter-spacing:.5px}
.naam{bottom:62px;font:500 32px Oswald;color:#fff;letter-spacing:14px}
.badge{right:70px;top:430px;width:170px;height:170px;background:#16e08a;color:#0d0433;transform:rotate(10deg);box-shadow:0 0 0 7px #0d0433,0 0 0 11px #16e08a}
.badge b{font:400 64px Bebas}.badge span{font:700 22px Oswald;text-transform:uppercase}
""", """
<div class="abs c t1">QUANTUM PHYSICS</div>
<div class="abs c t2"><i>FOR</i>BEGINNERS</div>
<div class="abs c sub">How to use quantum physics to make <b>your dreams your reality</b></div>
<svg class="abs atoom" viewBox="-300 -300 600 600"><defs><radialGradient id="g"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#ffd23f"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/></radialGradient>
<filter id="f"><feGaussianBlur stdDeviation="4"/></filter></defs>
<circle r="150" fill="url(#g)" opacity=".55"/>
<g fill="none" stroke="#ffd23f" stroke-width="7"><ellipse rx="270" ry="95"/><ellipse rx="270" ry="95" transform="rotate(60)"/><ellipse rx="270" ry="95" transform="rotate(-60)"/></g>
<g fill="none" stroke="#fff" stroke-width="3" filter="url(#f)" opacity=".8"><ellipse rx="270" ry="95"/><ellipse rx="270" ry="95" transform="rotate(60)"/><ellipse rx="270" ry="95" transform="rotate(-60)"/></g>
<circle r="46" fill="#ffd23f"/><circle r="22" fill="#fff"/>
<circle cx="270" cy="0" r="16" fill="#16e08a"/><circle cx="-135" cy="-234" r="16" fill="#16e08a"/><circle cx="-135" cy="234" r="16" fill="#16e08a"/></svg>
<div class="badge"><b>2027</b><span>edition</span></div>
<div class="abs cta">The Law of Attraction, explained by science</div>
<div class="abs c naam">BILLY WALSH</div>
""")

B['B09XT6QR79'] = ("""
body{background:#232a4d}
.t1{top:80px;left:80px;font:400 220px/.86 Bebas;color:#ffd23f;letter-spacing:2px}
.huis{left:700px;top:60px;width:230px}
.lijn{top:560px;left:80px;width:840px;height:10px;background:#ffd23f}
.t2{top:610px;left:80px;font:400 104px/.95 Bebas;color:#fff;letter-spacing:1px}.t2 b{color:#ffd23f;font-weight:400}
.t3{top:835px;left:80px;font:700 50px/1.1 Oswald;color:#3ee6a8;text-transform:uppercase}
.cta{top:965px;left:80px;right:80px;display:flex;gap:16px}
.cta div{flex:1;background:#fff;color:#232a4d;border-radius:12px;padding:22px 10px;font:700 27px/1.15 Oswald;text-transform:uppercase;text-align:center}
.cta div b{display:block;font:400 54px Bebas;color:#e8365d}
.naam{bottom:60px;left:80px;font:400 46px Bebas;color:#fff;letter-spacing:6px}
""", """
<div class="abs t1">AIRBNB<br>BUSINESS</div>
<svg class="abs huis" viewBox="0 0 100 90"><path d="M8 46 50 10 92 46" fill="none" stroke="#ffd23f" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 40v42h60V40" fill="none" stroke="#ffd23f" stroke-width="7" stroke-linejoin="round"/><rect x="42" y="52" width="16" height="30" fill="#3ee6a8"/></svg>
<div class="abs lijn"></div>
<div class="abs t2">HOW TO MAKE MONEY<br>ON AIRBNB <b>IN 2027</b></div>
<div class="abs t3">Without owning property</div>
<div class="abs cta"><div><b>STEP 1</b>Find the right rental</div><div><b>STEP 2</b>Win the landlord</div><div><b>STEP 3</b>Fill your calendar</div></div>
<div class="abs naam">BY JOSE CARLTON</div>
""")

PERK = """
body{background:radial-gradient(ellipse at 50% 45%,#9c4a26 0%,#6e2d14 55%,#3d160a 100%)}
body:after{content:'';position:absolute;inset:26px;border:4px solid #e9b949;outline:2px solid #e9b949;outline-offset:-14px}
.boven{top:78px;font:400 30px Cinzel;color:#f4d27a;letter-spacing:3px}
.t1{font:900 150px/.95 Cinzel;color:#f4c542;text-shadow:0 4px 0 #3d160a}
.sub{font:400 34px/1.3 Cinzel;color:#ffe9b0;padding:0 110px}
.kruis{left:330px;width:340px}
.badge{width:190px;height:190px;background:#c8432b;border:5px solid #f4c542;color:#fff;box-shadow:0 0 0 6px #6e2d14}
.badge b{font:900 40px Cinzel}.badge span{font:700 20px Cinzel;letter-spacing:1px}
.ed{font:900 46px Cinzel;color:#f4c542;letter-spacing:2px}
.uitg{font:400 40px Playfair;font-style:italic;color:#ffe9b0}
"""
KRUIS = """<svg class="abs kruis" style="top:%dpx" viewBox="-170 -170 340 360"><g stroke="#f4c542" stroke-width="4" opacity=".75">%s</g>
<path d="M-26-150h52v95h88v52h-88V180h-52V-3h-88v-52h88z" fill="#f4c542" stroke="#3d160a" stroke-width="5"/></svg>"""
STRALEN = ''.join(f'<line x1="0" y1="-30" x2="{round(160*__import__("math").cos(i*0.3927),1)}" y2="{round(-30+160*__import__("math").sin(i*0.3927),1)}"/>' for i in range(16))

B['B0B5KV79N1'] = (PERK + """
.t1{top:130px}.sub{top:470px}.badge{right:70px;top:820px}.ed{bottom:150px}.uitg{bottom:80px}
""", f"""
<div class="abs c boven">A COMPLETE COLLECTION OF 3 BOOKS</div>
<div class="abs c t1">BOOKS OF<br>ENOCH</div>
<div class="abs c sub">1 The Ethiopian Book of Enoch<br>2 The Book of the Secrets of Enoch<br>3 The Hebrew Book of Enoch</div>
{KRUIS % (690, STRALEN)}
<div class="badge" style="right:70px;top:760px"><span>ALL 3 BOOKS</span><b>IN ONE</b><span>VOLUME</span></div>
<div class="abs c ed">2027 EDITION</div>
<div class="abs c uitg">Holy Reads</div>
""")

B['B0DDBTXC9J'] = (PERK + """
.t0{top:80px;font:700 62px Cinzel;color:#f4d27a;letter-spacing:2px}
.t1{top:150px;font-size:128px}.sub{top:330px}.ed{bottom:150px}.uitg{bottom:80px}
""", f"""
<div class="abs c t0">THE DEFINITIVE</div>
<div class="abs c t1">APOCRYPHA</div>
<div class="abs c sub">Every book rejected from the Bible, in one volume. With foreword and introductions by Edward Whelan</div>
{KRUIS % (600, STRALEN)}
<div class="badge" style="left:70px;top:700px"><span>JOIN</span><b>1000s</b><span>OF READERS</span></div>
<div class="abs c ed">2027 EDITION</div>
<div class="abs c uitg">Holy Reads</div>
""")

B['B0CHL3MH5Q'] = ("""
body{background:#0b0b0b}
.foto{left:0;top:560px;width:1000px;height:440px;background:url(%s) center/cover no-repeat}
.foto:after{content:'';position:absolute;inset:0;background:linear-gradient(#0b0b0b 0%%,rgba(11,11,11,0) 25%%,rgba(11,11,11,0) 75%%,#0b0b0b 100%%)}
.t0{top:50px;font:400 100px/1 Bebas;color:#fff;letter-spacing:3px}
.t1{top:130px;font:400 260px/.9 Bebas;color:#ff7a00;letter-spacing:4px;background:linear-gradient(#ffb000,#ff5a00);-webkit-background-clip:text;color:transparent}
.t2{top:350px;font:400 150px/1 Bebas;color:#fff;letter-spacing:5px}
.sub{top:508px;font:700 30px/1.25 Oswald;color:#ffb000;text-transform:uppercase;padding:0 90px;text-shadow:0 2px 8px #000}
.badge{left:60px;top:880px;width:190px;height:190px;background:conic-gradient(#ff3b3b,#ffb000,#ffe600,#3ad15a,#2fa7ff,#8a4dff,#ff3bb0,#ff3b3b);box-shadow:0 0 0 8px #0b0b0b}
.badge div{width:146px;height:146px;border-radius:50%%;background:#0b0b0b;display:flex;flex-direction:column;justify-content:center;color:#fff}
.badge b{font:400 50px Bebas;color:#ffb000}.badge span{font:700 19px/1.1 Oswald}
.cta{bottom:120px;left:70px;right:70px;background:#ff5a00;color:#fff;font:400 54px/1 Bebas;letter-spacing:2px;padding:18px;text-align:center;border-radius:10px}
.naam{bottom:45px;right:70px;font:400 52px Bebas;color:#fff;letter-spacing:3px}
""" % img64(D / 'crop/griddle4x.png'), """
<div class="abs foto"></div>
<div class="abs c t0">THE OUTDOOR</div>
<div class="abs c t1">GRIDDLE</div>
<div class="abs c t2">BIBLE</div>
<div class="abs c sub">Your guide to mouthwatering BBQ griddle delights</div>
<div class="badge"><div><b>2027</b><span>FULL COLOR<br>EDITION</span></div></div>
<div class="abs cta">Restaurant-style griddle meals in your own backyard</div>
<div class="abs naam">ALEC POOLE</div>
""")

def raster(kleur, letters, top, h):
    import random
    random.seed(7)
    s = ''
    for r in range(h):
        for k in range(11):
            s += f'<span>{random.choice("ABCDEFGHIKLMNOPRSTUVW")}</span>'
    return s

B['B0CZRWNZBB'] = ("""
body{background:#ff7fae}
.grid{left:20px;right:20px;top:120px;display:grid;grid-template-columns:repeat(11,1fr);font:600 40px/1.55 Fredoka;color:#ffb3cf;text-align:center}
.kop{top:0;left:0;right:0;height:110px;background:#e8467f;display:flex;align-items:center;justify-content:center;font:400 78px Bebas;color:#fff;letter-spacing:16px}
.kaart{left:95px;right:95px;top:175px;height:690px;background:#e8467f;border:10px solid #fff;border-radius:28px;display:flex;flex-direction:column;align-items:center;justify-content:center}
.kaart div{font:400 205px/.86 Bebas;color:#fff;letter-spacing:4px;text-align:center}
.tag{top:890px;font:700 34px/1.2 Oswald;color:#7a0f3a;text-transform:uppercase;letter-spacing:1px}
.tulp{left:0;right:0;bottom:90px;height:230px}
.badge{right:30px;top:770px;width:190px;height:190px;transform:rotate(8deg);background:#fff;color:#e8467f;box-shadow:0 0 0 8px #e8467f}
.badge b{font:400 82px Bebas}.badge span{font:700 22px Oswald}
.voet{bottom:0;left:0;right:0;height:90px;background:#e8467f;display:flex;align-items:center;justify-content:center;font:400 44px Bebas;color:#fff;letter-spacing:6px}
""", f"""
<div class="abs grid">{raster(0,0,0,16)}</div>
<div class="abs kop">LARGE PRINT</div>
<div class="abs kaart"><div>MOM'S<br>WORD<br>SEARCH</div></div>
<div class="abs c tag">1000 words · easy on the eyes</div>
<svg class="abs tulp" viewBox="0 0 1000 230" preserveAspectRatio="none">{''.join(f'<path d="M{x} 230 C{x} 170 {x+6} 140 {x+4} 110" stroke="#2f9e44" stroke-width="9" fill="none"/><path d="M{x-28} 110 C{x-30} 60 {x-10} 40 {x+4} 60 C{x+18} 40 {x+38} 60 {x+36} 110 Z" fill="{c}"/>' for x,c in zip(range(40,1000,72),['#e8467f','#fff','#c2185b']*5))}</svg>
<div class="badge"><b>2027</b><span>EDITION</span></div>
<div class="abs voet">PUZZLES FOR RELAXATION &amp; HAPPINESS</div>
""")

B['B0D5375859'] = ("""
body{background:#ffe600}
.t1{top:40px;font:400 290px/.9 Bebas;color:#2f5fd0;letter-spacing:6px;-webkit-text-stroke:6px #0d2a73}
.t2{top:300px;font:400 205px/.88 Bebas;color:#fff;-webkit-text-stroke:7px #111;letter-spacing:4px}
.jaar{top:680px;left:70px;font:400 150px Bebas;color:#2f5fd0;-webkit-text-stroke:4px #0d2a73}
.drie{right:0;top:650px;width:400px;height:200px;background:#9b3fc9;border-radius:100px 0 0 100px;display:flex;align-items:center;justify-content:center;font:400 120px Bebas;color:#fff}
.lijst{left:70px;right:70px;top:880px;display:flex;gap:14px}
.lijst div{flex:1;background:#111;color:#ffe600;border-radius:14px;padding:16px 6px;text-align:center;font:700 22px/1.1 Oswald;text-transform:uppercase}
.lijst b{display:block;font:400 60px Bebas;color:#fff}
.voet{bottom:0;left:0;right:0;height:120px;background:#2f5fd0;display:flex;align-items:center;justify-content:center;font:400 54px Bebas;color:#fff;letter-spacing:7px}
""", """
<div class="abs c t1">9000</div>
<div class="abs c t2">WORD<br>SEARCH</div>
<div class="abs jaar">2027</div>
<div class="abs drie">3 IN 1</div>
<div class="abs lijst"><div><b>9000</b>words to find</div><div><b>225</b>fun themes</div><div><b>LARGE</b>print, easy to read</div></div>
<div class="abs voet">PUZZLE BOOK FOR ADULTS</div>
""")

B['B0D3KBF8MJ'] = ("""
body{background:linear-gradient(#1eb6e6 0%,#7fd8f5 55%,#bff0ff 100%)}
.t0{top:50px;font:400 92px/1 Bebas;color:#fff;letter-spacing:3px}
.t1{top:140px;font:400 250px/.85 Bebas;color:#ffe600;-webkit-text-stroke:5px #0a5d86}
.t2{top:360px;font:400 92px Bebas;color:#fff;letter-spacing:4px}
.t3{top:450px;font:400 200px/.9 Bebas;color:#ffe600;-webkit-text-stroke:5px #0a5d86;letter-spacing:3px}
.t4{top:625px;font:400 70px Bebas;color:#fff;letter-spacing:16px}
.zee{left:0;right:0;bottom:0;height:420px}
.cta{left:90px;right:90px;top:730px;background:#0a5d86;color:#fff;border-radius:14px;padding:16px;text-align:center;font:700 31px/1.2 Oswald;text-transform:uppercase}
.cta b{color:#ffe600}
.badge{right:60px;top:880px;width:180px;height:180px;background:#ffe600;color:#0a5d86;box-shadow:0 0 0 7px #fff}
.badge b{font:400 72px Bebas}.badge span{font:700 20px Oswald}
.naam{bottom:40px;font:400 50px Bebas;color:#fff;letter-spacing:6px}
""", """
<svg class="abs zee" viewBox="0 0 1000 420" preserveAspectRatio="none"><path d="M0 170 Q125 90 250 170 T500 170 T750 170 T1000 170 V420 H0Z" fill="#2a9fd6"/><path d="M0 250 Q125 175 250 250 T500 250 T750 250 T1000 250 V420 H0Z" fill="#0a7fb8"/><path d="M0 330 Q125 265 250 330 T500 330 T750 330 T1000 330 V420 H0Z" fill="#0a5d86"/></svg>
<div class="abs c t0">CALMING THE STORM</div>
<div class="abs c t1">DBT</div>
<div class="abs c t2">WORKBOOK FOR</div>
<div class="abs c t3">ANXIETY</div>
<div class="abs c t4">RELIEF</div>
<div class="abs cta">Simple, time-saving techniques to <b>calm anxiety fast</b></div>
<div class="badge"><b>2027</b><span>EDITION</span></div>
<div class="abs c naam">ETHAN STEELE</div>
""")

B['B0DMFSY1LR'] = ("""
body{background:#ffb8c9}
.t1{top:90px;left:80px;font:900 168px/.9 'Inter Display';color:#111;letter-spacing:-4px}
.sh{top:430px;left:110px;font:400 380px/1 Allura;color:#111;letter-spacing:-28px}
.sub{top:860px;left:80px;font:700 40px/1.3 Oswald;color:#111;text-transform:uppercase;letter-spacing:2px}
.cta{top:950px;left:80px;right:80px;background:#111;color:#ffb8c9;font:700 40px/1.2 Oswald;padding:20px;border-radius:12px;text-transform:uppercase}
.jaar{bottom:70px;left:80px;font:900 260px/1 'Inter Display';color:#111;letter-spacing:-6px}
""", """
<div class="abs t1">MANIFEST<br>YOUR</div>
<div class="abs sh">Sh<span style="font:900 200px Inter;letter-spacing:0;vertical-align:90px;margin:0 6px 0 22px">*</span>t</div>
<div class="abs sub">5 minute manifestation journal</div>
<div class="abs cta">5 minutes a day to make 2027 your year</div>
<div class="abs jaar">2027</div>
""")

def kook(sub_boven, t1, t2, onder, ribbon, extra=''):
    return ("""
body{background:url(%s) center/cover}
body:before{content:'';position:absolute;inset:0;background:rgba(0,0,0,.18)}
.ring{left:22px;top:110px;width:956px;height:1010px;background:#fff;clip-path:polygon(25%% 0,75%% 0,100%% 50%%,75%% 100%%,25%% 100%%,0 50%%)}
.hex{left:36px;top:124px;width:928px;height:982px;background:#0b0b0b;clip-path:polygon(25%% 0,75%% 0,100%% 50%%,75%% 100%%,25%% 100%%,0 50%%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 140px}
.st{right:40px;top:930px;width:210px;height:210px;border-radius:50%%;background:#8dff3a;color:#0b0b0b;box-shadow:0 0 0 8px #0b0b0b;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(-8deg);line-height:.9}
.st b{font:400 84px Bebas}.st span{font:700 22px Oswald}
.hex .a{font:400 40px/1.2 Playfair;font-style:italic;color:#fff}
.hex .b{font:400 170px/.9 Bebas;color:#8dff3a;letter-spacing:2px;margin-top:14px}
.hex .c{font:400 110px/.95 Bebas;color:#fff;letter-spacing:2px}
.hex .d{font:400 34px/1.25 Playfair;font-style:italic;color:#8dff3a;margin-top:18px}
.ed{top:930px;left:300px;right:300px;background:#8dff3a;color:#0b0b0b;font:400 50px Bebas;letter-spacing:3px;padding:6px;border-radius:40px;text-align:center}
.rib{bottom:0;left:0;right:0;height:140px;background:#0b0b0b;display:flex;align-items:center;justify-content:center;font:400 72px Bebas;color:#fff;letter-spacing:8px}
.rib b{color:#8dff3a;font-weight:400;margin:0 18px}
""" % img64(D / 'crop/B0DPSS16X3_4x.jpg'), f"""
<div class="abs ring"></div><div class="abs hex"><div class="a">{sub_boven}</div><div class="b">{t1}</div><div class="c">{t2}</div><div class="d">{onder}</div></div>
<div class="abs st"><b>2027</b><span>EDITION</span></div>{extra}
<div class="abs rib">{ribbon}</div>
""")

B['B0DPSS16X3'] = kook('Transform your health with a 28-day meal plan', 'BARIATRIC', 'DIET COOKBOOK',
                       'Adapt to your new stomach, enhance recovery and boost energy after surgery',
                       'SCIENCE-BACKED <b>·</b> 28-DAY PLAN')
B['B0DR5Z8SLL'] = kook('Optima Health Press', 'HIGH BLOOD<br>PRESSURE', 'DIET COOKBOOK',
                       'Delicious recipes to enhance heart health',
                       'FULL COLOR <b>·</b> 28-DAY MEAL PLAN')
B['B0DR5Z8SLL'] = (B['B0DR5Z8SLL'][0].replace('B0DPSS16X3', 'B0DR5Z8SLL') + '.hex .b{font-size:140px}', B['B0DR5Z8SLL'][1])
# eigen achtergrondfoto voor de bloeddrukkookboek
B['B0DR5Z8SLL'] = (B['B0DR5Z8SLL'][0].split('body{background:url(')[0] + 'body{background:url(' + img64(D / 'crop/B0DR5Z8SLL_4x.jpg') + ') center/cover}' + B['B0DR5Z8SLL'][0].split(') center/cover}', 1)[1], B['B0DR5Z8SLL'][1])

# 27 nov 2026 (Henkjan: "Maak 2027 versie"): Lean and Green in de kook-stijl met de eigen groentefoto, Analyze People (6x9) in eigen stijl.
B['B0BFV4C31K'] = kook('+1500 days of fueling hacks and lean and green recipes', 'LEAN AND<br>GREEN', 'COOKBOOK',
                       'Burn fat, lose weight and manage your figure',
                       'FOR BEGINNERS <b>·</b> 1500 DAYS')
B['B0BFV4C31K'] = (B['B0BFV4C31K'][0].split('body{background:url(')[0] + 'body{background:url(' + img64(D / 'crop/lean_bg.jpg') + ') center/cover}' + B['B0BFV4C31K'][0].split(') center/cover}', 1)[1] + '.hex .b{font-size:150px}', B['B0BFV4C31K'][1])

TRIM['1080901272'] = (6, 9)
B['1080901272'] = ("""
body{background:radial-gradient(ellipse at 50%% 70%%,#123a6b 0%%,#0a1f3d 45%%,#050f22 100%%)}
.t0{top:70px;font:700 54px Oswald;color:#9fd3ff;letter-spacing:10px}
.t1{top:140px;font:400 250px/.86 Bebas;color:#fff;letter-spacing:3px}
.t2{top:575px;font:400 96px Bebas;color:#4fb8ff;letter-spacing:6px}
.lijn{left:120px;right:120px;height:4px;background:#d9b44a}
.sub{top:700px;font:500 34px/1.3 Oswald;color:#fff;padding:0 90px}
.brein{left:60px;right:60px;top:800px;height:430px;background:url(%s) center/cover no-repeat;-webkit-mask-image:radial-gradient(ellipse at center,#000 55%%,transparent 75%%)}
.cta{left:80px;right:80px;top:1250px;background:#4fb8ff;color:#050f22;font:700 32px/1.2 Oswald;padding:18px;border-radius:12px;text-align:center;text-transform:uppercase}
.badge{right:46px;top:760px;width:180px;height:180px;background:#d9b44a;color:#050f22;box-shadow:0 0 0 7px #050f22,0 0 0 11px #d9b44a;transform:rotate(8deg)}
.badge b{font:400 70px Bebas}.badge span{font:700 21px Oswald}
.naam{bottom:52px;font:500 40px Oswald;color:#fff;letter-spacing:10px}
""" % img64(D / 'crop/analyze_brein.jpg'), """
<div class="abs c t0">HOW TO</div>
<div class="abs c t1">ANALYZE<br>PEOPLE</div>
<div class="abs c t2">WITH PSYCHOLOGY</div>
<div class="abs lijn" style="top:683px"></div>
<div class="abs c sub">The ultimate guide to speed reading people through body language and behavioral psychology</div>
<div class="abs brein"></div>
<div class="badge"><b>2027</b><span>EDITION</span></div>
<div class="abs cta">Know what people think before they say it</div>
<div class="abs c naam">EMOTIONAL PATHWAY</div>
""")

if __name__ == '__main__':
    from playwright.sync_api import sync_playwright
    dsf = float(sys.argv[1]) if len(sys.argv) > 1 else 1
    os.makedirs(D / 'voor', exist_ok=True)
    with sync_playwright() as p:
        br = p.chromium.launch()
        for a, (css, body) in B.items():
            W, H, Win = maat(a)
            s = dsf if dsf > 0 else 1
            pg = br.new_page(viewport={'width': W, 'height': H}, device_scale_factor=s)
            html = pagina(a, css, body)
            (D / 'voor' / f'{a}.html').write_text(html)
            pg.set_content(html); pg.wait_for_timeout(300)
            pg.screenshot(path=str(D / 'voor' / f'{a}{"" if dsf == 1 else "_print"}.png'))
            pg.close()
        br.close()
