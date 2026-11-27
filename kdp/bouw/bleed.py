# Binnenwerk zonder bleed omzetten naar een binnenwerk met bleed voor KDP.
# Aanleiding: KDP keurde op 26 nov 2026 Mom's Word Search af ("insufficient bleed" op p. 51-55, 103-105, 107:
# bloemenranden tot de rand terwijl het boek op 'no bleed' stond).
# KDP-maat met bleed: breedte trim + 0,125 in (alleen aan de buitenkant), hoogte trim + 0,25 in.
# De originele pagina blijft vector; alleen de nieuwe bleedrand wordt gevuld met het gespiegelde randje van 0,125 in
# (300 dpi), zodat randen en achtergronden doorlopen tot voorbij de snijlijn. Rechterpagina's (1, 3, ...) krijgen de
# bleed rechts, linkerpagina's links.
# Gebruik: python3 bleed.py in.pdf uit.pdf     Daarna in KDP op de Content-pagina 'Bleed (PDF only)' kiezen.
import io, sys
import pymupdf as fitz
from PIL import Image

B = 9  # 0,125 in in punten
DPI = 300

def rand(src, i, clip, flip):
    pix = src[i].get_pixmap(clip=clip, dpi=DPI, alpha=False)
    im = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    for f in flip:
        im = im.transpose(f)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=90)
    return b.getvalue()

def zet_bleed(inp, uit):
    src = fitz.open(inp); out = fitz.open()
    H_, V_ = Image.Transpose.FLIP_LEFT_RIGHT, Image.Transpose.FLIP_TOP_BOTTOM
    for i, pg in enumerate(src):
        w, h = pg.rect.width, pg.rect.height
        nw, nh = w + B, h + 2 * B
        rechts = i % 2 == 0  # pagina 1 is een rechterpagina: buitenkant rechts
        ox, oy = (0 if rechts else B), B
        np_ = out.new_page(width=nw, height=nh)
        np_.show_pdf_page(fitz.Rect(ox, oy, ox + w, oy + h), src, i)
        # boven en onder
        np_.insert_image(fitz.Rect(ox, 0, ox + w, B), stream=rand(src, i, fitz.Rect(0, 0, w, B), [V_]), keep_proportion=False)
        np_.insert_image(fitz.Rect(ox, oy + h, ox + w, nh), stream=rand(src, i, fitz.Rect(0, h - B, w, h), [V_]), keep_proportion=False)
        # buitenkant met hoeken
        if rechts:
            np_.insert_image(fitz.Rect(w, oy, nw, oy + h), stream=rand(src, i, fitz.Rect(w - B, 0, w, h), [H_]), keep_proportion=False)
            np_.insert_image(fitz.Rect(w, 0, nw, B), stream=rand(src, i, fitz.Rect(w - B, 0, w, B), [H_, V_]), keep_proportion=False)
            np_.insert_image(fitz.Rect(w, oy + h, nw, nh), stream=rand(src, i, fitz.Rect(w - B, h - B, w, h), [H_, V_]), keep_proportion=False)
        else:
            np_.insert_image(fitz.Rect(0, oy, B, oy + h), stream=rand(src, i, fitz.Rect(0, 0, B, h), [H_]), keep_proportion=False)
            np_.insert_image(fitz.Rect(0, 0, B, B), stream=rand(src, i, fitz.Rect(0, 0, B, B), [H_, V_]), keep_proportion=False)
            np_.insert_image(fitz.Rect(0, oy + h, B, nh), stream=rand(src, i, fitz.Rect(0, h - B, B, h), [H_, V_]), keep_proportion=False)
    out.save(uit, garbage=3, deflate=True)
    # controle: zelfde aantal pagina's, juiste maat
    c = fitz.open(uit)
    assert len(c) == len(src), 'aantal pagina\'s wijkt af'
    for p, q in zip(src, c):
        assert abs(q.rect.width - p.rect.width - B) < .01 and abs(q.rect.height - p.rect.height - 2 * B) < .01
    w_in, h_in = c[0].rect.width / 72, c[0].rect.height / 72
    print(f'{uit}: {len(c)} pagina\'s, {w_in:.3f} x {h_in:.3f} in (bleed)')

if __name__ == '__main__':
    zet_bleed(sys.argv[1], sys.argv[2])
