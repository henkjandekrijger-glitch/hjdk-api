"""Kindle-eBook (EPUB 3, reflowable) uit dezelfde inhoud als het binnenwerk.

Gebruik:
  python3 bouw_epub.py <map met config.py> <uit.epub>      (boeken van bouw_boek.py)
  python3 bouw_epub.py boek0 <uit.epub>                     (Wait, That's True?! uit bouw_binnenwerk.py)
Maakt ook <map>/kindle_cover.jpg (voorkant uit omslag.pdf op 300 dpi).
"""
import re, sys, os, zipfile, uuid, html, importlib.util
from datetime import date

HIER = os.path.dirname(os.path.abspath(__file__))


def laad_config(map_):
    spec = importlib.util.spec_from_file_location('cfg', os.path.join(map_, 'config.py'))
    cfg = importlib.util.module_from_spec(spec); spec.loader.exec_module(cfg)
    return cfg.BOEK


def boek0():
    sys.path.insert(0, HIER)
    os.chdir(HIER)
    import bouw_binnenwerk as b
    h = [(n, b.TEASERS[n], fs) for n, fs in b.lees()]
    return dict(
        modus='facts', titel_meta=b.TITEL, auteur=b.AUTEUR,
        titel_regels=[('WAIT,', 0), ('THAT\u2019S TRUE?!', 0)],
        ondertitel='1,000 Weird, Funny &amp; Mind-Blowing Facts Nobody Told You',
        tagline='Trivia Gift Book for Teens and Adults',
        copyright=[
            f'<b>{b.TITEL}</b> 1,000 Weird, Funny &amp; Mind-Blowing Facts Nobody Told You',
            'Copyright \u00a9 2026 Elias Grant. All rights reserved.',
            'No part of this book may be reproduced, stored or shared in any form without written permission from the author, '
            'except for short quotations in reviews.',
            'Every fact in this book was checked against reliable sources at the time of writing. Records get broken and science '
            'moves on, so a few numbers may have changed by the time you read this. Where experts still disagree, we say so.',
            'Brand names mentioned in this book belong to their owners and are used only to tell true stories about them.',
            'Cover emoji artwork from Noto Emoji by Google, used under the Apache License 2.0.',
            'First edition, 2026.'],
        intro_kop='Before You Start',
        intro=[
            'This book has one job: to make you stop, blink and say <b>\u201cWait, that\u2019s true?!\u201d</b> about a thousand times.',
            'Inside are 1,000 real facts about your body, animals, space, food, history, money, language, the internet and much more. '
            'Every one of them is true. Some of them are so strange that you will want to check, and you should. That is half the fun.',
            'There is no right way to read it. Go cover to cover, open a random page, or jump straight to the chapter that grabs you. '
            'Every fact stands on its own, so it works in two minutes or two hours.',
            '<b>A few ways to use it:</b>',
            '\u2022  Read one fact out loud at dinner and watch the table go quiet.<br/>'
            '\u2022  Quiz your friends: true or false?<br/>'
            '\u2022  Win the next car ride, sleepover or office coffee break.<br/>'
            '\u2022  Keep it on your phone for every waiting room.',
            'Ready? Fact number one is waiting.'],
        hoofdstukken=h, tf_quiz=b.QUIZ, label='FACTS',
        slot_kop='A Small Favor',
        slot=[
            'You made it through all 1,000 facts. (Or you skipped to the end. We will not tell anyone.)',
            'If this book made you laugh, gasp or win an argument, would you leave a short review on Amazon? '
            'It takes less than a minute, and it helps other curious people find the book. Even one sentence makes a real difference.',
            'Which fact surprised you most? Mention it in your review. We read every one.',
            'Thank you for reading, and keep asking \u201cWait, is that true?\u201d',
            '<b>\u2014 Elias Grant</b>'],
        ook=[('Stocking Stuffers for Teens', 'The Weirdest, Smartest, Most Hilarious 408 Facts You Will Ever Hear'),
             ('Stocking Stuffers for Adults', 'Mind-Blowing Facts You Won\u2019t Believe (But Totally Should)')],
        _map=HIER)


def platte_tekst(t):
    """Gewone tekst (feiten, vragen): escapen en typografische aanhalingstekens."""
    t = html.escape(t, quote=False)
    t = re.sub(r'(^|[\s(\[])"', '\\1\u201c', t)
    t = t.replace('"', '\u201d').replace("'", '\u2019')
    return t


def opmaak(t):
    """Tekst met de kleine opmaak van reportlab (<b>, <i>, <br/>) geldig maken voor XHTML."""
    t = t.replace('&nbsp;', '&#160;')
    t = re.sub(r'&(?!#?\w+;)', '&amp;', t)
    t = re.sub(r'<br\s*/?>', '<br/>', t)
    t = re.sub(r'<font[^>]*>|</font>', '', t)
    return t


CSS = """body{font-family:serif;line-height:1.45;margin:0 0.4em}
h1{font-family:sans-serif;font-size:1.6em;text-align:center;margin:2em 0 0.3em}
h2{font-family:sans-serif;font-size:1.35em;margin:1.4em 0 0.2em;page-break-before:always}
p{margin:0 0 0.7em;text-indent:0}
.label{font-family:sans-serif;font-size:0.75em;letter-spacing:0.08em;color:#555;margin:0}
.teaser{font-style:italic;color:#444;margin-bottom:1.2em}
.f{margin:0 0 0.75em}
.n{font-family:sans-serif;font-weight:bold}
.sub{text-align:center;font-size:1.05em;margin:0.6em 0}
.tag{text-align:center;font-style:italic}
.auteur{text-align:center;font-family:sans-serif;margin-top:2.5em}
.klein{font-size:0.85em}
.antw{margin:0 0 0.35em}
"""


def xhtml(titel, body):
    return ('<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n'
            '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en" xml:lang="en">\n'
            f'<head><meta charset="utf-8"/><title>{html.escape(titel)}</title>'
            '<link rel="stylesheet" type="text/css" href="style.css"/></head>\n'
            f'<body>\n{body}\n</body></html>\n')


def maak(B, uit):
    titel = re.sub('<[^>]+>', '', B['titel_meta'])
    delen = []  # (id, bestandsnaam, kop, xhtml)

    # titelpagina
    regels = ''.join(f'<h1>{platte_tekst(t)}</h1>' if i == 0 else f'<p class="sub"><b>{platte_tekst(t)}</b></p>'
                     for i, (t, _) in enumerate(B['titel_regels']))
    body = (regels + f'<p class="sub">{opmaak(B["ondertitel"])}</p>'
            + (f'<p class="tag">{opmaak(B["tagline"])}</p>' if B.get('tagline') else '')
            + f'<p class="auteur">{platte_tekst(B["auteur"]).upper()}</p>')
    delen.append(('titel', 'titel.xhtml', 'Title Page', xhtml(titel, body)))
    delen.append(('copy', 'copyright.xhtml', 'Copyright',
                  xhtml('Copyright', ''.join(f'<p class="klein">{opmaak(t)}</p>' for t in B['copyright']))))
    delen.append(('intro', 'intro.xhtml', re.sub('<[^>]+>', '', B['intro_kop']),
                  xhtml(B['intro_kop'], f'<h2>{opmaak(B["intro_kop"])}</h2>' + ''.join(f'<p>{opmaak(t)}</p>' for t in B['intro']))))

    nr = 0
    modus = B['modus']
    for i, (naam, teaser, items) in enumerate(B['hoofdstukken'], 1):
        if modus == 'facts':
            lab = f'CHAPTER {i:02d} \u2022 FACTS {nr+1}\u2013{nr+len(items)}'
        else:
            lab = f'CHAPTER {i:02d}'
        body = f'<p class="label">{lab}</p><h2 style="page-break-before:avoid">{platte_tekst(naam)}</h2><p class="teaser">{platte_tekst(teaser)}</p>'
        if modus == 'facts':
            for f in items:
                nr += 1
                body += f'<p class="f" id="f{nr}"><span class="n">{nr}.</span> {platte_tekst(f)}</p>'
        elif modus == 'jokes':
            for q, a in items:
                nr += 1
                body += f'<p class="f"><span class="n">{nr}.</span> {platte_tekst(q)}<br/><i>{platte_tekst(a)}</i></p>'
        elif modus == 'wyr':
            for q in items:
                nr += 1
                body += f'<p class="f"><span class="n">{nr}.</span> {platte_tekst(q)}</p>'
        elif modus == 'quiz':
            antw = []
            for j, (q, opties, goed) in enumerate(items, 1):
                letters = 'ABCD'
                body += (f'<p class="f"><span class="n">{j}.</span> {platte_tekst(q)}<br/>'
                         + '<br/>'.join(f'{letters[k]}) {platte_tekst(o)}' for k, o in enumerate(opties)) + '</p>')
                antw.append(f'<b>{j}.</b> {goed} \u2014 {platte_tekst(opties["ABCD".index(goed)])}')
            body += '<h3>Answers</h3>' + ''.join(f'<p class="antw">{a}</p>' for a in antw)
        delen.append((f'h{i}', f'h{i:02d}.xhtml', naam, xhtml(naam, body)))

    if B.get('tf_quiz'):
        alle = [f for _, _, fs in B['hoofdstukken'] for f in fs]
        body = ('<p class="label">BONUS</p><h2 style="page-break-before:avoid">True or False?</h2>'
                f'<p class="teaser">{len(B["tf_quiz"])} quick ones to test yourself or your friends. Decide true or false, then check the answers below.</p>')
        for i, (q, _, _) in enumerate(B['tf_quiz'], 1):
            body += f'<p class="f"><span class="n">{i}.</span> {platte_tekst(q)}</p>'
        body += '<h2>Answers</h2>'
        for i, (q, waar, zoek) in enumerate(B['tf_quiz'], 1):
            tr = [n for n, f in enumerate(alle, 1) if zoek.lower() in f.lower()]
            assert len(tr) == 1, (zoek, tr)
            body += f'<p class="antw"><b>{i}. {"TRUE" if waar else "FALSE"}</b> \u2014 see <a href="{fact_bestand(B, tr[0])}#f{tr[0]}">fact {tr[0]}</a></p>'
        body += '<p><b>Your score:</b> 25 or more: walking encyclopedia. 15 to 24: seriously sharp. Under 15: perfect excuse to read the book again.</p>'
        delen.append(('quiz', 'quiz.xhtml', 'Bonus: True or False? Quiz', xhtml('True or False?', body)))

    body = f'<h2>{opmaak(B["slot_kop"])}</h2>' + ''.join(f'<p>{opmaak(t)}</p>' for t in B['slot'])
    if B.get('ook'):
        body += f'<h3>Also by {platte_tekst(B["auteur"])}</h3>' + ''.join(
            f'<p><b>{platte_tekst(t)}</b><br/>{platte_tekst(o)}</p>' for t, o in B['ook'])
    delen.append(('slot', 'slot.xhtml', re.sub('<[^>]+>', '', B['slot_kop']), xhtml(B['slot_kop'], body)))

    # navigatie
    nav = ('<nav epub:type="toc" id="toc"><h1>Contents</h1><ol>'
           + ''.join(f'<li><a href="{b}">{html.escape(k)}</a></li>' for _, b, k, _ in delen[2:]) + '</ol></nav>'
           '<nav epub:type="landmarks" hidden=""><ol><li><a epub:type="bodymatter" href="intro.xhtml">Start</a></li>'
           '<li><a epub:type="toc" href="nav.xhtml">Contents</a></li></ol></nav>')
    navx = xhtml('Contents', nav)
    ncx = ('<?xml version="1.0" encoding="utf-8"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">'
           f'<head><meta name="dtb:uid" content="urn:uuid:{B["_uid"]}"/></head><docTitle><text>{html.escape(titel)}</text></docTitle><navMap>'
           + ''.join(f'<navPoint id="n{i}" playOrder="{i}"><navLabel><text>{html.escape(k)}</text></navLabel><content src="{b}"/></navPoint>'
                     for i, (_, b, k, _) in enumerate(delen[2:], 1)) + '</navMap></ncx>')
    manifest = ''.join(f'<item id="{i}" href="{b}" media-type="application/xhtml+xml"/>' for i, b, _, _ in delen)
    manifest += ('<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>'
                 '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>'
                 '<item id="css" href="style.css" media-type="text/css"/>'
                 '<item id="cover" href="cover.jpg" media-type="image/jpeg" properties="cover-image"/>')
    spine = '<itemref idref="titel"/><itemref idref="copy"/><itemref idref="nav"/>' + ''.join(
        f'<itemref idref="{i}"/>' for i, _, _, _ in delen[2:])
    opf = ('<?xml version="1.0" encoding="utf-8"?>'
           '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid" xml:lang="en">'
           '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">'
           f'<dc:identifier id="uid">urn:uuid:{B["_uid"]}</dc:identifier><dc:title>{html.escape(titel)}</dc:title>'
           f'<dc:creator>{html.escape(B["auteur"])}</dc:creator><dc:language>en</dc:language>'
           f'<meta property="dcterms:modified">{date.today().isoformat()}T00:00:00Z</meta><meta name="cover" content="cover"/>'
           f'</metadata><manifest>{manifest}</manifest><spine toc="ncx">{spine}</spine></package>')

    cover = os.path.join(B['_map'], 'kindle_cover.jpg')
    with zipfile.ZipFile(uit, 'w') as z:
        z.writestr(zipfile.ZipInfo('mimetype'), 'application/epub+zip', compress_type=zipfile.ZIP_STORED)
        z.writestr('META-INF/container.xml', '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">'
                   '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>',
                   compress_type=zipfile.ZIP_DEFLATED)
        z.writestr('OEBPS/content.opf', opf, compress_type=zipfile.ZIP_DEFLATED)
        z.writestr('OEBPS/nav.xhtml', navx, compress_type=zipfile.ZIP_DEFLATED)
        z.writestr('OEBPS/toc.ncx', ncx, compress_type=zipfile.ZIP_DEFLATED)
        z.writestr('OEBPS/style.css', CSS, compress_type=zipfile.ZIP_DEFLATED)
        z.write(cover, 'OEBPS/cover.jpg', compress_type=zipfile.ZIP_DEFLATED)
        for _, b, _, x in delen:
            z.writestr('OEBPS/' + b, x, compress_type=zipfile.ZIP_DEFLATED)
    return len(delen), nr


def fact_bestand(B, n):
    tel = 0
    for i, (_, _, fs) in enumerate(B['hoofdstukken'], 1):
        tel += len(fs)
        if n <= tel:
            return f'h{i:02d}.xhtml'


def kindle_cover(map_):
    """Voorkant uit omslag.pdf knippen (zonder bleed) op 300 dpi."""
    import fitz
    d = fitz.open(os.path.join(map_, 'omslag.pdf'))
    p = d[0]
    w, h = p.rect.width, p.rect.height  # punten
    b = 0.125 * 72
    clip = fitz.Rect(w - b - 6 * 72, b, w - b, h - b)
    pix = p.get_pixmap(dpi=300, clip=clip)
    uit = os.path.join(map_, 'kindle_cover.jpg')
    pix.save(uit, jpg_quality=92) if hasattr(pix, 'save') else pix.pil_save(uit, quality=92)
    return uit, pix.width, pix.height


if __name__ == '__main__':
    bron, uit = sys.argv[1], os.path.abspath(sys.argv[2])
    if bron == 'boek0':
        B = boek0()
    else:
        B = laad_config(os.path.abspath(bron)); B['_map'] = os.path.abspath(bron)
    B['_uid'] = str(uuid.uuid5(uuid.NAMESPACE_URL, 'elias-grant/' + B['titel_meta']))
    print('cover', kindle_cover(B['_map']))
    print('delen, items', maak(B, uit))
