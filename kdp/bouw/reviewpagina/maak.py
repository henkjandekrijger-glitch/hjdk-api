"""Reviewpagina achterin elk boek: eerlijke vraag + QR naar de Amazon-reviewpagina.
Amazon staat toe om om een eerlijke review te vragen; niets ervoor geven, niet om sterren vragen.
Gebruik: python3 maak.py <ASIN> <uit.pdf> [taal en|de] [breedte_in hoogte_in] [auteur]"""
import sys, io, segno
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
G = '/usr/share/fonts/truetype/google-fonts/'
for n, f in [('PopB', 'Poppins-Bold.ttf'), ('PopR', 'Poppins-Regular.ttf')]:
    pdfmetrics.registerFont(TTFont(n, G + f))
TXT = {
 'en': dict(kop=['Which fact', 'surprised you most?'], tekst=[
   'Tell the next reader. A short, honest review on Amazon',
   'helps other people find this book, and it means a lot',
   'to an independent author. One sentence is enough.'],
   scan='Scan to write your review', dank='Thank you,', url='amazon.com'),
 'de': dict(kop=['Welcher Fakt hat dich', 'am meisten überrascht?'], tekst=[
   'Erzähl es dem nächsten Leser. Eine kurze, ehrliche Rezension',
   'auf Amazon hilft anderen, dieses Buch zu finden, und sie',
   'bedeutet einem unabhängigen Autor sehr viel. Ein Satz reicht.'],
   scan='Scannen und Rezension schreiben', dank='Danke,', url='amazon.de'),
}
def maak(asin, uit, taal='en', w=6.0, h=9.0, auteur='Elias Grant'):
    t = TXT[taal]; W, H = w*inch, h*inch
    url = f'https://www.{t["url"]}/review/create-review?asin={asin}'
    c = canvas.Canvas(uit, pagesize=(W, H)); c.setTitle('Review')
    y = H - 1.9*inch
    c.setFillColorRGB(0, 0, 0)
    for r in t['kop']:
        c.setFont('PopB', 26); c.drawCentredString(W/2, y, r); y -= 34
    y -= 14
    for r in t['tekst']:
        c.setFont('PopR', 11.5); c.drawCentredString(W/2, y, r); y -= 18
    q = segno.make(url, error='m'); b = io.BytesIO(); q.save(b, kind='png', scale=12, border=2); b.seek(0)
    s = 2.1*inch; y -= 22 + s
    c.drawImage(ImageReader(b), (W-s)/2, y, s, s)
    y -= 26; c.setFont('PopB', 13); c.drawCentredString(W/2, y, t['scan'])
    y -= 46; c.setFont('PopR', 12); c.drawCentredString(W/2, y, t['dank'])
    y -= 18; c.setFont('PopB', 12); c.drawCentredString(W/2, y, auteur)
    c.showPage(); c.save(); return url
if __name__ == '__main__':
    a = sys.argv
    print(maak(a[1], a[2], *(a[3:4] or ['en']), *[float(x) for x in a[4:6]], *(a[6:7])))
