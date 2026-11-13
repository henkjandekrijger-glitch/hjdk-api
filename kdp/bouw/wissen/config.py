import os
D = os.path.dirname(os.path.abspath(__file__))

VOLGORDE = ['Autos & Motoren', 'Flugzeuge & Piloten', 'Schiffe & das Meer', 'Kuriose Militärgeschichte', 'Entdecker & Abenteurer',
            'Die härtesten Männer der Geschichte', 'Sportlegenden', 'Weltraum & Astronauten', 'Bauwerke der Superlative',
            'Erfinder & große Ideen', 'Geld & Geschäfte', 'Grillen, Fleisch & Essen', 'Bier, Kaffee & Whisky',
            'Überleben in der Wildnis', 'Wilde Tiere', 'Film & Fernsehen', 'Rock & Roll', 'Der männliche Körper',
            'Kuriose Gesetze & Rekorde', 'Werkzeug & Technik']


def lees():
    h = {}
    for f in ['fakten1.txt', 'fakten2.txt']:
        for blk in open(os.path.join(D, f), encoding='utf-8').read().split('## ')[1:]:
            r = [l.strip() for l in blk.split('\n') if l.strip()]
            naam, teaser = [x.strip() for x in r[0].split('|')]
            h[naam] = (naam, teaser, r[1:])
    assert sorted(h) == sorted(VOLGORDE), set(h) ^ set(VOLGORDE)
    uit = [h[n] for n in VOLGORDE]
    assert all(len(x[2]) == 20 for x in uit), [(x[0], len(x[2])) for x in uit]
    alle = [f for x in uit for f in x[2]]
    assert len(set(alle)) == len(alle)
    return uit


TF = [
    ('Um das Jahr 1900 war etwa ein Drittel der Autos in den USA elektrisch.', True, 'ein Drittel der Autos'),
    ('Dieselmotoren brauchen Zündkerzen.', False, 'Dieselmotoren haben keine Zündkerzen'),
    ('Die Spruce Goose bestand größtenteils aus Fichtenholz.', False, 'größtenteils aus Birkenholz'),
    ('Die Deutsche Luft Hansa wurde schon 1926 gegründet.', True, 'Luft Hansa'),
    ('Kolumbus bewies, dass die Erde rund ist.', False, 'Kolumbus hat nicht bewiesen'),
    ('Das D in D-Day steht für Doom, also Untergang.', False, 'steht einfach für Day'),
    ('George Washington trug ein Gebiss aus Holz.', False, 'aber nie aus Holz'),
    ('Der kürzeste Krieg der Geschichte dauerte drei Tage.', False, 'kürzeste Krieg'),
    ('Die erste Frau im All war eine Amerikanerin.', False, 'Tereschkowa'),
    ('Pizza Hut hat schon eine Pizza ins All geliefert.', True, 'Pizza Hut'),
    ('Der Hoover Dam wurde später fertig als geplant.', False, 'zwei Jahre früher als geplant'),
    ('Venedig steht auf Holzpfählen.', True, 'Holzpfählen'),
    ('Charles Goodyear gründete die Reifenfirma Goodyear.', False, 'nichts zu tun'),
    ('Toyota baute zuerst Webstühle.', True, 'Webstühlen'),
    ('Zu einem echten Chicago-Hotdog gehört Ketchup.', False, 'nie mit Ketchup'),
    ('Bourbon darf nur in Kentucky gebrannt werden.', False, 'muss nicht aus Kentucky kommen'),
    ('Auch entkoffeinierter Kaffee enthält Koffein.', True, 'entkoffeinierter Kaffee'),
    ('Vor einem Bären wegzulaufen ist die sicherste Flucht.', False, 'Vor einem Bären wegzulaufen'),
    ('Bisons verletzen im Yellowstone mehr Besucher als Bären.', True, 'Bisons verletzen'),
    ('Das Blut in der Duschszene von Psycho war Schokoladensirup.', True, 'Schokoladensirup'),
    ('Am Ende von Pulp Fiction sieht man, was im Koffer steckt.', False, 'wird nie verraten'),
    ('Bob Dylan bekam den Literaturnobelpreis.', True, 'Literaturnobelpreis'),
    ('Männer leben weltweit im Schnitt länger als Frauen.', False, 'fünf Jahre kürzer'),
    ('Im Fußball zählt ein Tor direkt aus einem Einwurf.', False, 'Einwurf kein direktes Tor'),
    ('Die Thermosflasche wurde erfunden, um Kaffee warm zu halten.', False, 'Chemikalien kalt'),
]

TITEL = 'Moment mal, das stimmt?! Für Männer'
ONDER = '400 verblüffende Fakten und kurioses Wissen für Männer, die schon alles haben'

BOEK = dict(
    modus='facts', label='FAKTEN', schaal=1.3, taal='de',
    kop=TITEL, titel_meta=TITEL,
    titel_regels=[('MOMENT MAL,', 36), ('DAS STIMMT?!', 36), ('FÜR MÄNNER', 27)],
    ondertitel=ONDER,
    tagline='Das lustige Geschenk für Papa, Ehemann und Opa', auteur='Max Falk',
    t=dict(inhoud='Inhalt', hlabel='KAPITEL {i2}  •  {label} {a}–{b}',
           quiz_toc='Bonus: Wahr oder falsch?', quiz_kop='Bonus-Quiz', quiz_label='BONUS', quiz_titel='Wahr oder falsch?',
           quiz_teaser='{n} schnelle Fragen für dich oder deine Freunde. Kreuze W oder F an und prüfe dann die Antworten.',
           tf='W&nbsp;&nbsp;&nbsp;F', antworten='Antworten', waar='WAHR', onwaar='FALSCH', zie='siehe Fakt',
           score='<b>Deine Punkte:</b> 22 oder mehr: wandelndes Lexikon. 15 bis 21: richtig scharf. Unter 15: die perfekte Ausrede, das Buch gleich noch einmal zu lesen.',
           ook='Ebenfalls von {auteur}'),
    copyright=[
        f'<b>{TITEL}</b>. {ONDER}',
        'Copyright © 2026 Max Falk. Alle Rechte vorbehalten.',
        'Kein Teil dieses Buches darf ohne schriftliche Genehmigung des Autors vervielfältigt, gespeichert oder verbreitet werden, ausgenommen kurze Zitate in Rezensionen.',
        'Alle Fakten wurden beim Schreiben anhand verlässlicher Quellen geprüft. Rekorde fallen und die Wissenschaft geht weiter, deshalb können sich einzelne Zahlen inzwischen geändert haben. Wo eine Geschichte eine Legende oder eine Vermutung ist, sagen wir das dazu.',
        'Markennamen gehören ihren Inhabern und werden nur genannt, um wahre Geschichten über sie zu erzählen.',
        'Emoji-Grafiken auf dem Umschlag: Noto Emoji von Google, Apache License 2.0.',
        'Erste Auflage 2026.'],
    intro_kop='Bevor es losgeht',
    intro=[
        'Dieses Buch ist für den Mann, der schon alles hat, außer der perfekten Geschichte für den nächsten Grillabend.',
        'Hier warten <b>400 wahre Fakten</b> in <b>20 Kapiteln</b>: Autos, Flugzeuge, Schiffe, Weltraum, Geld, Grillen, Bier und Whisky, wilde Tiere, Filme, Rock und vieles mehr. '
        'Jeder Fakt ist in einer Minute gelesen und so verrückt, dass du ihn sofort jemandem erzählen willst.',
        'Kein Kapitel baut auf einem anderen auf. Schlag das Buch irgendwo auf: in der Garage, auf dem Sofa, am Grill oder dort, wo Männer am liebsten lesen.',
        '<b>Ein paar Ideen:</b>',
        '•  Gewinne die nächste Diskussion am Stammtisch.<br/>'
        '•  Lies auf langen Autofahrten einen Fakt laut vor.<br/>'
        '•  Teste deine Kumpels mit dem Wahr-oder-falsch-Quiz am Ende.<br/>'
        '•  Leg es dorthin, wo du fünf ruhige Minuten hast. Du weißt schon, wo.',
        'Kleine Warnung: Du wirst öfter als einmal rufen: <b>Moment mal, das stimmt?!</b>'],
    slot_kop='Eine kleine Bitte',
    slot=[
        'Wenn dir dieses Buch ein paar gute Geschichten geschenkt hat, freue ich mich sehr über eine ehrliche Bewertung bei Amazon. Für einen kleinen Autor ist das die größte Hilfe, und andere finden so ein Geschenk, das wirklich gelesen wird.',
        'Viel Spaß beim Weitererzählen!',
        'Max Falk'],
    ook=[('Adventskalender für Männer', '24 Tage kuriose Fakten, unglaubliche Geschichten und Angeberwissen')],
    tf_quiz=TF,
)
BOEK['hoofdstukken'] = lees()
