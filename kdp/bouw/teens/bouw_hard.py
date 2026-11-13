"""Hardcover-binnenwerk Stocking Stuffers For Teens (5,5 x 8,5 inch met bleed) uit het Kindle Create-bestand van Henkjan.
Bron: 408_facts_interior.kpf (bevat book_1.pdf: 147 pagina's 5x8 met bleed, elke pagina een beeld van 300 dpi uit Canva).
Elke pagina wordt even groot geschaald tot hij 5,625 x 8,75 vult, midden bijgesneden (0,15 inch boven en onder, alleen patroon),
grijs met 16 tinten (scherp, klein bestand). Gebruik: python3 bouw_hard.py [pad naar .kpf]"""
import io, os, sys, zipfile, subprocess, tempfile
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader

kpf = sys.argv[1] if len(sys.argv) > 1 else '/mnt/user-data/uploads/408_facts_interior.kpf'
hier = os.path.dirname(os.path.abspath(__file__))
tmp = tempfile.mkdtemp()
zipfile.ZipFile(kpf).extract('book_1.pdf', tmp)
subprocess.run(['pdfimages', '-all', f'{tmp}/book_1.pdf', f'{tmp}/p'], check=True)
fs = sorted(f for f in os.listdir(tmp) if f.startswith('p-'))
PW, PH, DPI = 5.625, 8.75, 300
TW, TH = int(PW * DPI), int(PH * DPI)
c = canvas.Canvas(os.path.join(hier, 'binnenwerk_hard_5.5x8.5.pdf'), pagesize=(PW * inch, PH * inch), pageCompression=1)
for f in fs:
    im = Image.open(f'{tmp}/{f}').convert('L')
    s = max(TW / im.width, TH / im.height)
    nw, nh = round(im.width * s), round(im.height * s)
    im = im.resize((nw, nh), Image.LANCZOS)
    l, t = (nw - TW) // 2, (nh - TH) // 2
    im = im.crop((l, t, l + TW, t + TH)).quantize(16).convert('L')
    c.drawImage(ImageReader(im), 0, 0, PW * inch, PH * inch); c.showPage()
c.save()
print(len(fs), 'pagina\'s')
