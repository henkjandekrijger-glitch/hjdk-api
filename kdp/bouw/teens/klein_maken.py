"""Teens hardcover-binnenwerk klein maken voor upload (<10 MB): per pagina een lichte achtergrond (100 dpi, tekst eruit)
plus twee 1-bit maskers (CCITT G4): zwart (lijnen, iconen) en donkergrijs (tekst, waarde uit de pagina)."""
import io, sys, glob, pikepdf, numpy as np
from PIL import Image, ImageFilter
from pikepdf import Name, Dictionary, Stream
src_glob, out, MASK_DPI = sys.argv[1], sys.argv[2], int(sys.argv[3])
PW, PH = 5.625*72, 8.75*72
def g4(m):
    buf = io.BytesIO(); m.save(buf, 'TIFF', compression='group4', tiffinfo={278: m.height})
    t = Image.open(io.BytesIO(buf.getvalue())); off, cnt = t.tag_v2[273], t.tag_v2[279]
    assert len(off) == 1
    return buf.getvalue()[off[0]:off[0]+cnt[0]], t.tag_v2.get(262, 0)
def maskobj(pdf, m):
    data, ph = g4(m)
    s = Stream(pdf, data); s.Type = Name.XObject; s.Subtype = Name.Image
    s.Width = m.width; s.Height = m.height; s.ImageMask = True; s.BitsPerComponent = 1
    s.Filter = Name.CCITTFaxDecode; s.DecodeParms = Dictionary(K=-1, Columns=m.width, Rows=m.height, BlackIs1=(ph == 1))
    return s
pdf = pikepdf.new(); tot = 0
for f in sorted(glob.glob(src_glob)):
    im = Image.open(f).convert('L'); a = np.asarray(im)
    if a.mean() < 200:  # donkere pagina (titelpagina, witte tekst op zwart): hele beeld houden
        page = pdf.add_blank_page(page_size=(PW, PH))
        st = Stream(pdf, im.tobytes()); st.Type = Name.XObject; st.Subtype = Name.Image
        st.Width = im.width; st.Height = im.height; st.ColorSpace = Name.DeviceGray; st.BitsPerComponent = 8
        page.Resources = Dictionary(XObject=Dictionary(Im=st))
        page.Contents = pdf.make_stream(f'q {PW} 0 0 {PH} 0 0 cm /Im Do Q'.encode())
        continue
    dark = a[a < 160]
    tg = int(np.median(dark[dark >= 50])) if (dark >= 50).sum() > 500 else 84
    s = MASK_DPI/300
    big = im.resize((round(im.width*s), round(im.height*s)), Image.LANCZOS) if s != 1 else im
    b = np.asarray(big)
    zwart = Image.fromarray(np.where(b < (tg//2 + 10), 0, 255).astype('uint8')).convert('1')
    zr = np.asarray(Image.fromarray(np.where(b < (tg//2 + 10), 0, 255).astype('uint8')).filter(ImageFilter.MinFilter(5)))
    grijs = Image.fromarray(np.where((b >= (tg//2 + 10)) & (b < (tg + 237)//2) & (zr > 0), 0, 255).astype('uint8')).convert('1')
    # randen van zwarte lijnen (anti-aliasing) bij zwart rekenen
    zwart = Image.fromarray(np.where((b < (tg + 237)//2) & (zr == 0), 0, 255).astype('uint8')).convert('1')
    bg = im.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(9))
    bg = bg.resize((round(PW/72*100), round(PH/72*100)), Image.BOX).quantize(8).convert('L')
    page = pdf.add_blank_page(page_size=(PW, PH))
    bgs = Stream(pdf, bg.tobytes()); bgs.Type = Name.XObject; bgs.Subtype = Name.Image
    bgs.Width = bg.width; bgs.Height = bg.height; bgs.ColorSpace = Name.DeviceGray; bgs.BitsPerComponent = 8
    page.Resources = Dictionary(XObject=Dictionary(Bg=bgs, Z=maskobj(pdf, zwart), G=maskobj(pdf, grijs)))
    gv = tg/255
    page.Contents = pdf.make_stream(f'q {PW} 0 0 {PH} 0 0 cm /Bg Do Q q {gv:.3f} g {PW} 0 0 {PH} 0 0 cm /G Do Q q 0 g {PW} 0 0 {PH} 0 0 cm /Z Do Q'.encode())
pdf.save(out, compress_streams=True)
print('ok', len(pdf.pages))
