# Volledige KDP-omslag (achter + rug + voor) als PDF van 300 dpi.
# Maten volgens KDP: breedte = 0,125 + trim + rug + trim + 0,125; hoogte = trim + 0,25.
# Rug = pagina's x dikte (wit z/w 0,002252; creme 0,0025; standaard kleur 0,002252; premium kleur 0,002347).
import sys
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright
import voor

D = Path(__file__).parent
DPI = 300
DIK = {'BW_WHITE': .002252, 'BW_CREAM': .0025, 'COLOR_WHITE': .002252, 'COLOR_COLOR': .002347}

# asin: kdp-id, trim, papier, pagina's, auteur, kort (rug), thema
BOEK = {
 'B0B5KV79N1': ('A7CVDBYEZGH', (8.5, 11), 'BW_CREAM', 121, 'Holy Reads', 'BOOKS OF ENOCH', 'perk'),
 'B0DDBTXC9J': ('JMB92DMKYAP', (8.5, 11), 'BW_WHITE', 148, 'Holy Reads', 'THE DEFINITIVE APOCRYPHA', 'perk'),
 'B0CHL3MH5Q': ('4B9BMX0XG7J', (8.5, 11), 'COLOR_WHITE', 95, 'Alec Poole', 'THE OUTDOOR GRIDDLE BIBLE', 'grill'),
 'B0DR5Z8SLL': ('M8308T2BWC9', (8.5, 11), 'COLOR_WHITE', 157, 'Optima Health Press', 'HIGH BLOOD PRESSURE DIET COOKBOOK', 'kook'),
 'B0DPSS16X3': ('EXPECWTNR8Y', (8.5, 11), 'COLOR_WHITE', 123, 'Optima Health Press', 'BARIATRIC DIET COOKBOOK', 'kook'),
 'B0D3KBF8MJ': ('4F1NDPS3VAZ', (8, 10), 'BW_WHITE', 116, 'Ethan Steele', 'DBT WORKBOOK FOR ANXIETY RELIEF', 'zee'),
 'B09SWQ8F3S': ('633CJ9Z9ND2', (8.5, 11), 'BW_WHITE', 52, 'Billy Walsh', '', 'quantum'),
 'B0CZRWNZBB': ('E8HW2RW0Q7A', (8.5, 11), 'BW_WHITE', 107, 'Golden Years Publishing', "MOM'S WORD SEARCH", 'mom'),
 'B0D5375859': ('J7A0BYZNPBT', (8.5, 11), 'BW_WHITE', 286, 'Golden Memories Publishing', '9000 WORD SEARCH · 3 IN 1', 'geel'),
 'B09XT6QR79': ('WWJH22W4BVX', (8.5, 11), 'BW_WHITE', 46, 'Jose Carlton', '', 'airbnb'),
 'B0BFV4C31K': ('PPSW8Y8AF7M', (8.5, 11), 'BW_WHITE', 146, 'Isabella Williams', 'LEAN AND GREEN COOKBOOK', 'kook'),
 '1080901272': ('JY8QSEZHPN2', (6, 9), 'BW_WHITE', 128, 'Emotional Pathway', 'HOW TO ANALYZE PEOPLE', 'psy'),
}

# thema: achtergrond, kop-kleur, tekstkleur, accent (vinkjes, CTA-vlak), CTA-tekstkleur, kopfont, rugkleur, rugtekst
THEMA = {
 'perk': ('radial-gradient(ellipse at 50% 40%,#9c4a26 0%,#6e2d14 55%,#3d160a 100%)', '#f4c542', '#ffe9b0', '#f4c542', '#3d160a', "900 72px/1.05 Cinzel", '#4a1a0b', '#f4c542'),
 'grill': ('#0b0b0b', '#ff7a00', '#fff', '#ff5a00', '#fff', "400 110px/.95 Bebas", '#0b0b0b', '#ff7a00'),
 'kook': ('#0b0b0b', '#8dff3a', '#fff', '#8dff3a', '#0b0b0b', "400 110px/.95 Bebas", '#0b0b0b', '#8dff3a'),
 'zee': ('linear-gradient(#1eb6e6,#0a7fb8)', '#ffe600', '#fff', '#ffe600', '#0a5d86', "400 110px/.95 Bebas", '#0a7fb8', '#ffe600'),
 'quantum': ('radial-gradient(ellipse at 50% 40%,#3a1aa0 0%,#1a0a55 55%,#0d0433 100%)', '#ffd23f', '#fff', '#ffd23f', '#1b0a55', "400 110px/.95 Bebas", '#0d0433', '#ffd23f'),
 'mom': ('#ff7fae', '#fff', '#5a0a2c', '#e8467f', '#fff', "400 120px/.95 Bebas", '#e8467f', '#fff'),
 'geel': ('#ffe600', '#2f5fd0', '#111', '#111', '#ffe600', "400 120px/.95 Bebas", '#2f5fd0', '#fff'),
 'airbnb': ('#232a4d', '#ffd23f', '#fff', '#ffd23f', '#232a4d', "400 120px/.95 Bebas", '#232a4d', '#ffd23f'),
 'psy': ('radial-gradient(ellipse at 50% 40%,#123a6b 0%,#0a1f3d 55%,#050f22 100%)', '#4fb8ff', '#fff', '#4fb8ff', '#050f22', "400 110px/.95 Bebas", '#050f22', '#4fb8ff'),
}

ACHTER = {
 'B0B5KV79N1': ('The books that were left out of the Bible.', [
    'All three books of Enoch in one volume', '1 Enoch: the Ethiopian Book of Enoch', '2 Enoch: the Book of the Secrets of Enoch',
    '3 Enoch: the Hebrew Book of Enoch'], 'Read the ancient story of the Watchers, the Nephilim and the heavens for yourself.', ''),
 'B0DDBTXC9J': ('Every book rejected from the Bible, in one volume.', [
    'The complete collection of apocryphal books', 'Foreword and introductions by Edward Whelan',
    'Each text with its background and context', 'For study, reflection and discussion groups'],
    'Discover what was left out, and decide for yourself why.', ''),
 'B0CHL3MH5Q': ('Fire up the griddle. Feed the crowd.', [
    'Mouthwatering BBQ griddle recipes', 'Full-color pages that make you hungry', 'From quick weeknight meals to backyard feasts',
    'Clear steps that work on any outdoor griddle'], 'Your griddle is ready. Turn the page and start cooking.', ''),
 'B0DR5Z8SLL': ('Heart-healthy food that tastes great.', [
    'Delicious recipes to support heart health', 'A 28-day meal plan to get you started', 'Full-color photos', 'Everyday ingredients, simple steps'],
    'Start your 28 days today.', 'This book is not medical advice. Always follow the advice of your doctor.'),
 'B0DPSS16X3': ('Life after surgery, made delicious.', [
    'A science-backed 28-day meal plan', 'Recipes to adapt to your new stomach', 'Support your recovery and boost your energy', 'Full-color photos'],
    'Start your 28 days today.', 'This book is not medical advice. Always follow the advice of your medical team.'),
 'B0D3KBF8MJ': ('Calm the storm inside.', [
    'Dialectical Behavior Therapy explained simply', 'Quick techniques for anxious moments', 'Exercises that fit into a busy day', 'Build calm that lasts'],
    'Take the first step to a calmer you today.', 'This book does not replace professional help. In a crisis, call or text 988 (US).'),
 'B09SWQ8F3S': ('What if your thoughts really shape your reality?', [
    'Quantum physics explained in plain English', 'How meditation, spirituality and science connect', 'The law of attraction, explained',
    'Simple ideas you can use today'], 'Turn the page and start creating the life you want.', ''),
 'B0CZRWNZBB': ('Relax, unwind and find every word.', [
    'Large print, easy on the eyes', '1000 words to find', 'Puzzles for relaxation and happiness', 'A thoughtful gift for Mom'],
    'Grab a pen and enjoy some me-time.', ''),
 'B0D5375859': ('9000 words. 225 themes. Hours of fun.', [
    '3 books in 1', 'Large print, easy to read', 'For women, men and seniors', 'The perfect gift for puzzle lovers'],
    'Grab a pen. The first puzzle is waiting.', ''),
 'B09XT6QR79': ('Earn from Airbnb without buying a property.', [
    'How short-term rental works without owning property', 'Finding the right rental and the right landlord',
    'Setting up a listing guests want to book', 'A step-by-step plan for a successful business'],
    'Start your short-term rental business in 2027.', ''),
 'B0BFV4C31K': ('Lean and green meals, made simple.', [
    'Lean and green recipes for every day', 'Fueling hacks for busy days', 'Clear steps for beginners', 'Everyday ingredients'],
    'Start your first lean and green week today.', 'This book is not medical advice. Talk to your doctor before you change your diet.'),
 '1080901272': ('Read people like an open book.', [
    'Body language analysis, explained', 'Behavioral psychology in plain English', 'Speed reading people in everyday life',
    'Practical tips for every conversation'], 'Know what people think before they say it.', ''),
}

def achter_html(a, Win, Hin):
    W = 1000; H = round(1000 * Hin / Win)
    k = BOEK[a]; th = THEMA[k[6]]; kop, bul, cta, noot = ACHTER[a]
    s = W / Win  # px per inch
    vink = ''.join(f'<li><i>✓</i>{b}</li>' for b in bul)
    css = f"""body{{background:{th[0]};color:{th[2]}}}
.vak{{position:absolute;left:{.125*s+70}px;right:70px;top:{.125*s+80}px;bottom:{(.125+.25+1.2)*s+50}px;display:flex;flex-direction:column;justify-content:space-between}}
.kop{{font:{th[5]};color:{th[1]}}}
ul{{list-style:none;font:500 46px/1.25 Oswald}}
li{{display:flex;gap:24px;align-items:flex-start;margin:0 0 30px}}li i{{font-style:normal;flex:0 0 60px;height:60px;border-radius:50%;background:{th[3]};color:{th[4]};display:flex;align-items:center;justify-content:center;font:700 36px Inter}}
.cta{{background:{th[3]};color:{th[4]};border-radius:16px;padding:28px 32px;font:700 46px/1.15 Oswald;text-transform:uppercase}}
.noot{{left:{.125*s+70}px;width:{W-.125*s-70-2.7*s}px;bottom:{.125*s+.35*s}px;font:500 26px/1.35 Inter;color:{th[2]}}}
"""
    body = f'<div class="vak"><div class="kop">{kop}</div><ul>{vink}</ul><div class="cta">{cta}</div></div>' + (f'<div class="abs noot">{noot}</div>' if noot else '')
    return f"<!doctype html><html><head><meta charset=utf-8><style>{voor.FONTS}{voor.BASE % (W, H)}{css}</style></head><body>{body}</body></html>", W, H

def rug_html(a, rug_in, Hin):
    k = BOEK[a]; th = THEMA[k[6]]
    H = 1000; W = max(4, round(1000 * rug_in / Hin))
    tekst = ''
    if k[3] >= 79 and k[5]:
        fs = min(int(W * .55), 60)
        tekst = f'<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(90deg);white-space:nowrap;font:400 {fs}px Bebas;letter-spacing:2px;color:{th[7]}">{k[5]} <span style="opacity:.85;margin-left:{fs}px">2027 · {k[4].upper()}</span></div>'
    bg = th[6]
    return f"<!doctype html><html><head><meta charset=utf-8><style>{voor.FONTS}{voor.BASE % (W, H)}body{{background:{bg}}}</style></head><body>{tekst}</body></html>", W, H

def bouw(a, br):
    kid, (tw, thh), pap, pag, *_ = BOEK[a]
    rug = pag * DIK[pap]
    Win, Hin = tw + .125, thh + .25
    tot_w = round((2 * tw + rug + .25) * DPI); tot_h = round(Hin * DPI)
    paneel_w = round(Win * DPI)
    def shot(html, W, H, w_px, h_px):
        pg = br.new_page(viewport={'width': W, 'height': H}, device_scale_factor=w_px / W)
        pg.set_content(html); pg.wait_for_timeout(1500)
        p = D / 'tmp.png'; pg.screenshot(path=str(p)); pg.close()
        return Image.open(p).convert('RGB').resize((w_px, h_px), Image.LANCZOS)
    css, body = voor.B[a]
    Wf, Hf, _ = voor.maat(a)
    voorbeeld = shot(voor.pagina(a, css, body), Wf, Hf, paneel_w, tot_h)
    ah, Wa, Ha = achter_html(a, Win, Hin)
    achter = shot(ah, Wa, Ha, paneel_w, tot_h)
    rh, Wr, Hr = rug_html(a, rug, Hin)
    rug_px = tot_w - 2 * paneel_w
    rugim = shot(rh, Wr, Hr, max(rug_px, 1), tot_h)
    full = Image.new('RGB', (tot_w, tot_h))
    full.paste(achter, (0, 0)); full.paste(rugim, (paneel_w, 0)); full.paste(voorbeeld, (paneel_w + rug_px, 0))
    os = D / 'omslag'; os.mkdir(exist_ok=True)
    full.save(os / f'{a}.pdf', 'PDF', resolution=DPI, quality=92)
    full.resize((tot_w // 4, tot_h // 4)).save(os / f'{a}_klein.png')
    return tot_w / DPI, tot_h / DPI, rug

if __name__ == '__main__':
    ids = sys.argv[1:] or list(BOEK)
    with sync_playwright() as p:
        br = p.chromium.launch()
        for a in ids:
            w, h, r = bouw(a, br)
            print(a, f'{w:.3f} x {h:.3f} in, rug {r:.4f} in')
        br.close()
