"""Omslag Lasting Change Workbook 2027 (paperback, 6x9, wit papier). Huisstijl van de huidige omslag:
LASTING zwart, CHANGE rood en gespiegeld, WORKBOOK gespatieerd. Nieuw: badge NEW FOR 2027 en de regel "Don't throw away another year."
Gebruik: python3 omslag.py <paginas> <uit.pdf> [<voorkant.png>]"""
import sys, asyncio
from playwright.async_api import async_playwright

BLEED = 0.125
TRIM_W, TRIM_H = 6.0, 9.0
ROOD = '#D7262E'


def html(paginas):
    rug = paginas * 0.002252  # wit papier, zwart-wit
    W = BLEED * 2 + TRIM_W * 2 + rug
    H = TRIM_H + BLEED * 2
    voor_x = BLEED + TRIM_W + rug  # linkerkant voorkant (trim)
    achter_x = BLEED
    rug_tekst = paginas > 79
    import segno, io
    buf = io.BytesIO()
    segno.make('https://wa.me/31655395630?text=Dear%20John%2C%20I%20am%20a%20reader%20and%20have%20a%20question.', error='m').save(buf, kind='png', border=2, scale=24, dark='#111')
    import base64
    qr_svg = '<img style="width:100%;height:100%;image-rendering:pixelated" src="data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode() + '">'
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face {{ font-family: IDB; src: url(file:///usr/share/fonts/opentype/inter/InterDisplay-Black.otf); }}
@font-face {{ font-family: IDX; src: url(file:///usr/share/fonts/opentype/inter/InterDisplay-ExtraBold.otf); }}
@font-face {{ font-family: Pop; src: url(file:///usr/share/fonts/truetype/google-fonts/Poppins-Medium.ttf); }}
@font-face {{ font-family: PopB; src: url(file:///usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf); }}
@font-face {{ font-family: Lora; src: url(file:///usr/share/fonts/truetype/google-fonts/Lora-Variable.ttf); }}
@font-face {{ font-family: LoraI; src: url(file:///usr/share/fonts/truetype/google-fonts/Lora-Italic-Variable.ttf); }}
@page {{ size: {W}in {H}in; margin: 0; }}
html, body {{ margin: 0; padding: 0; }}
body {{ width: {W}in; height: {H}in; position: relative; background: #fff; overflow: hidden; color: #111; }}
.abs {{ position: absolute; }}
.voor {{ left: {voor_x}in; top: {BLEED}in; width: {TRIM_W}in; height: {TRIM_H}in; }}
.achter {{ left: {achter_x}in; top: {BLEED}in; width: {TRIM_W}in; height: {TRIM_H}in; }}
.sub {{ font-family: Pop; font-size: 15pt; line-height: 1.32; text-align: center; color: #111; }}
.quote {{ font-family: LoraI; font-weight: 600; font-size: 21pt; text-align: center; color: #111; }}
.auteur {{ font-family: IDB; font-size: 27pt; letter-spacing: 0.02em; text-align: center; }}
.badge {{ width: 1.28in; height: 1.28in; border-radius: 50%; background: {ROOD}; color: #fff; text-align: center; transform: rotate(8deg); }}
.badge .k {{ font-family: PopB; font-size: 9.5pt; letter-spacing: 0.18em; margin-top: 0.27in; }}
.badge .j {{ font-family: IDB; font-size: 30pt; line-height: 1; margin-top: 0.02in; }}
.achter h2 {{ font-family: IDB; font-size: 30pt; line-height: 1.05; margin: 0; }}
.achter p, .achter li {{ font-family: Lora; font-size: 11.2pt; line-height: 1.45; margin: 0; }}
.achter ul {{ margin: 0; padding: 0; list-style: none; }}
.achter li {{ padding-left: 0.22in; position: relative; margin-bottom: 0.06in; }}
.achter li::before {{ content: ''; position: absolute; left: 0; top: 0.075in; width: 0.09in; height: 0.09in; background: {ROOD}; }}
.achter b {{ font-family: PopB; font-weight: normal; }}
.rug {{ left: {BLEED + TRIM_W}in; top: 0; width: {rug}in; height: {H}in; }}
.rugtekst {{ position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(90deg); white-space: nowrap; font-family: PopB; font-size: 7.6pt; letter-spacing: 0.08em; }}
</style></head><body>

<div class="abs voor">
  <div class="abs badge" style="right:0.42in; top:0.38in;"><div class="k">NEW FOR</div><div class="j">2027</div></div>
  <svg class="abs" style="left:0.45in; top:1.55in" width="5.1in" height="4.2in" viewBox="0 0 510 420">
    <text x="0" y="112" font-family="IDB" font-size="138" textLength="510" lengthAdjust="spacingAndGlyphs" fill="#111">LASTING</text>
    <g transform="translate(510,0) scale(-1,1)"><text x="0" y="250" font-family="IDB" font-size="138" textLength="510" lengthAdjust="spacingAndGlyphs" fill="{ROOD}">CHANGE</text></g>
    <text x="4" y="318" font-family="IDX" font-size="42" textLength="502" lengthAdjust="spacing" fill="#111" letter-spacing="10">WORKBOOK</text>
  </svg>
  <div class="abs sub" style="left:0.6in; width:4.8in; top:5.32in;">The Anti-Boring Playbook to Rewire Your Habits, Upgrade Your Identity, and Stay Consistent for Life</div>
  <div class="abs" style="left:2.6in; width:0.8in; top:6.55in; height:3px; background:{ROOD};"></div>
  <div class="abs quote" style="left:0.5in; width:5in; top:6.72in;">&ldquo;Don&rsquo;t throw away another year.&rdquo;</div>
  <div class="abs auteur" style="left:0; width:6in; top:8.02in;">JOHN WARRIOR</div>
</div>

<div class="abs rug">{'<div class="rugtekst">LASTING CHANGE WORKBOOK &nbsp;&middot;&nbsp; JOHN WARRIOR</div>' if rug_tekst else ''}</div>

<div class="abs achter">
  <div class="abs" style="left:0.55in; top:0.62in; width:4.9in;">
    <h2>Make <span style="color:{ROOD}">2027</span> the year<br>it finally sticks.</h2>
    <p style="margin-top:0.22in; font-family:PopB; font-size:12.5pt; line-height:1.35;">It was never about willpower.<br>It was about the plan.</p>
    <p style="margin-top:0.12in">This workbook gives you one. Pick one habit, give it about <b>3 minutes a day</b>, and let 30 small, playful moves do the heavy lifting. Then 36 short pages carry you to Day 66, the point where habits typically start to feel automatic.</p>
    <ul style="margin-top:0.2in">
      <li><b>Never boring twice.</b> A different 3-minute move every day: shrink it, anchor it, celebrate it, play it.</li>
      <li><b>Win on any day.</b> Three sizes for normal, busy and terrible days, plus a plan for missed ones.</li>
      <li><b>Become that person.</b> Every check-in is a vote for who you are becoming.</li>
      <li><b>Bring your people.</b> A buddy, a signed contract and a script for the people close to you.</li>
      <li><b>Real research, zero fluff.</b> 15 sources, listed in the back and explained in plain words.</li>
    </ul>
    <p style="margin-top:0.18in; font-family:LoraI; font-weight:600; font-size:14pt;">Next December, you&rsquo;ll be glad you started today.</p>
  </div>
  <div class="abs" style="left:0.55in; top:7.2in; width:3.05in; height:1.15in; background:#F2F2F2; border-radius:0.08in;">
    <div class="abs" style="left:0.08in; top:0.08in; width:0.99in; height:0.99in; background:#fff;">{qr_svg}</div>
    <div class="abs" style="left:1.2in; top:0.16in; width:1.78in;">
      <div style="font-family:PopB; font-size:11pt; line-height:1.2;">Questions?<br>Ask the author.</div>
      <div style="font-family:Lora; font-size:9.6pt; line-height:1.35; margin-top:0.05in;">Scan to message John on WhatsApp. He answers personally.</div>
    </div>
  </div>
</div>
</body></html>''', W, H


async def maak(paginas, uit, png=None):
    h, W, H = html(paginas)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': int(W * 96), 'height': int(H * 96)}, device_scale_factor=2)
        import os, tempfile
        f = os.path.join(os.path.dirname(os.path.abspath(uit)), '_omslag.html')
        open(f, 'w').write(h)
        await pg.goto('file://' + f, wait_until='networkidle')
        await pg.evaluate('document.fonts.ready')
        await pg.pdf(path=uit + '.tmp.pdf', width=f'{W}in', height=f'{H}in', print_background=True, prefer_css_page_size=True)
        if png:
            voor_x = (BLEED + TRIM_W + paginas * 0.002252) * 96
            await pg.screenshot(path=png, clip={'x': voor_x - BLEED * 96 * 0, 'y': 0, 'width': (TRIM_W + BLEED) * 96, 'height': H * 96})
        await b.close()
    # exacte maat: Chromium rondt af op pixels; zet de pagina op precies W x H inch
    import pymupdf as fitz, os
    bron = fitz.open(uit + '.tmp.pdf')
    doel = fitz.open()
    pagina = doel.new_page(width=W * 72, height=H * 72)
    pagina.show_pdf_page(pagina.rect, bron, 0, keep_proportion=False)
    # rasteren op 300 dpi: geen losse fonts meer in het bestand (Chromium zet sommige als Type3), KDP-veilig
    pm = pagina.get_pixmap(dpi=300)
    rast = fitz.open()
    rp = rast.new_page(width=W * 72, height=H * 72)
    rp.insert_image(rp.rect, stream=pm.tobytes('png'))
    rast.save(uit, garbage=3, deflate=True)
    os.remove(uit + '.tmp.pdf')
    return W, H


if __name__ == '__main__':
    n = int(sys.argv[1])
    print(asyncio.run(maak(n, sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)))
