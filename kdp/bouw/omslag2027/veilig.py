# Controle veilige zone van een omslag (KDP-afwijzing Mom's Word Search 26 nov 2026:
# "move all text at least 0.375 inches away from all edges of the cover").
# Meet elke regel tekst (ook SVG-tekst en letterrasters) op voorkant en achterkant en meldt
# alles wat dichter dan 0.375 in bij een snijrand staat. Rug: tekst minstens 0.0625 in van de vouw.
# Gebruik: python3 veilig.py [ASIN ...]   (zonder ASIN: alle boeken in wrap.BOEK)
import sys
from playwright.sync_api import sync_playwright
import voor, wrap

MIN = .375
JS = """() => {
  const out = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    if (!n.textContent.trim()) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    for (const b of r.getClientRects()) if (b.width > 1 && b.height > 1)
      out.push({t: n.textContent.trim().slice(0, 30), l: b.left, r: b.right, o: b.top, u: b.bottom});
  }
  return out;
}"""

def meet(br, html, W, H):
    pg = br.new_page(viewport={'width': W, 'height': H})
    pg.set_content(html); pg.wait_for_timeout(800)
    boxes = pg.evaluate(JS); pg.close()
    return boxes

def check(br, a):
    kid, (tw, th), pap, pag, *_ = wrap.BOEK[a]
    Win, Hin = tw + .125, th + .25
    fout = []
    # voorkant: links = rugvouw (geen bleed), rechts/boven/onder 0.125 bleed
    css, body = voor.B[a]
    Wf, Hf, _ = voor.maat(a)
    s = Wf / Win
    for b in meet(br, voor.pagina(a, css, body), Wf, Hf):
        d = {'boven': b['o'] / s - .125, 'onder': (Hf - b['u']) / s - .125,
             'buiten': (Wf - b['r']) / s - .125, 'rug': b['l'] / s}
        for k, v in d.items():
            if v < MIN: fout.append(('voor', k, round(v, 3), b['t']))
    # achterkant: links = bleed, rechts = rugvouw
    ah, Wa, Ha = wrap.achter_html(a, Win, Hin)
    s = Wa / Win
    for b in meet(br, ah, Wa, Ha):
        d = {'boven': b['o'] / s - .125, 'onder': (Ha - b['u']) / s - .125,
             'buiten': b['l'] / s - .125, 'rug': (Wa - b['r']) / s}
        for k, v in d.items():
            if v < MIN: fout.append(('achter', k, round(v, 3), b['t']))
    # rug: tekst gedraaid, dus de hoogte van de letters ligt over de breedte van de rug
    rug = pag * wrap.DIK[pap]
    rh, Wr, Hr = wrap.rug_html(a, rug, Hin)
    s = Hr / Hin
    for b in meet(br, rh, Wr, Hr):
        for k, v in {'links': b['l'] / s, 'rechts': (Wr - b['r']) / s}.items():
            if v < .0625: fout.append(('rug', k, round(v, 3), b['t']))
        for k, v in {'boven': b['o'] / s - .125, 'onder': (Hr - b['u']) / s - .125}.items():
            if v < MIN: fout.append(('rug', k, round(v, 3), b['t']))
    return fout

if __name__ == '__main__':
    ids = sys.argv[1:] or list(wrap.BOEK)
    slecht = 0
    with sync_playwright() as p:
        br = p.chromium.launch()
        for a in ids:
            f = check(br, a)
            if not f:
                print(a, 'OK'); continue
            slecht += 1
            # per kant en rand alleen de kleinste afstand tonen
            kort = {}
            for kant, rand, v, t in f:
                k = (kant, rand)
                if k not in kort or v < kort[k][0]: kort[k] = (v, t, sum(1 for x in f if x[:2] == k))
            print(a, 'TE DICHT BIJ DE RAND:')
            for (kant, rand), (v, t, n) in sorted(kort.items()):
                print(f'   {kant:6} {rand:7} {v:6.3f} in  ({n}x, bv. "{t}")')
        br.close()
    sys.exit(1 if slecht else 0)
