import os
D = os.path.dirname(os.path.abspath(__file__))


def lees():
    h = []
    for blk in open(os.path.join(D, 'fakten.txt'), encoding='utf-8').read().split('## ')[1:]:
        r = [l.strip() for l in blk.split('\n') if l.strip()]
        naam, teaser = [x.strip() for x in r[0].split('|')]
        h.append((naam, teaser, r[1:]))
    assert len(h) == 24 and all(len(x[2]) == 20 for x in h), [(x[0], len(x[2])) for x in h]
    alle = [f for x in h for f in x[2]]
    assert len(set(alle)) == len(alle)
    return h


TF = [
    ('Schneeflocken haben fast immer acht Arme.', False, 'sechs Arme'),
    ('Bertha Benz kaufte das Benzin für ihre erste Fernfahrt in einer Apotheke.', True, 'Stadt-Apotheke in Wiesloch'),
    ('Löwen können bis zu 20 Stunden am Tag schlafen.', True, '20 Stunden am Tag'),
    ('Das Oktoberfest begann als Feier zu einer Hochzeit.', True, 'Kronprinz Ludwig'),
    ('Der erste Deutsche im All kam aus der DDR.', True, 'Sigmund Jähn'),
    ('Theodore Roosevelt sagte seine Rede nach dem Schuss sofort ab.', False, 'Redemanuskript'),
    ('Deutschland ist dreimal Fußballweltmeister geworden.', False, 'viermal Weltmeister'),
    ('Die Blackbox eines Flugzeugs ist schwarz.', False, 'leuchtend orange'),
    ('Thomas Edison hielt über 1.000 US-Patente.', True, '1.093'),
    ('In Terminator spricht Arnold Schwarzenegger nur etwa 17 Sätze.', True, '17 Sätze'),
    ('Die Belagerung von Leningrad dauerte genau ein Jahr.', False, '872 Tage'),
    ('Der Hamburger ist nach der Stadt Hamburg benannt.', True, 'Stadt Hamburg'),
    ('Bohemian Rhapsody von Queen hat einen eingängigen Refrain.', False, 'keinen Refrain'),
    ('Amundsen erreichte den Südpol erst nach Scott.', False, 'fünf Wochen vor'),
    ('Der Name Haribo steht für Hans Riegel Bonn.', True, 'HAns RIegel'),
    ('Starbucks ist nach einem Kaffeebauern benannt.', False, 'Moby Dick'),
    ('SOS ist die Abkürzung für Save Our Souls.', False, 'steht für nichts'),
    ('Eine Mütze kann eine Glatze verursachen.', False, 'keine Glatze'),
    ('Big Ben ist der Name des Uhrturms in London.', False, 'großen Glocke'),
    ('Die meisten Menschen, die vom Blitz getroffen werden, überleben.', True, 'vom Blitz getroffen werden'),
    ('Steffi Graf gewann 1988 alle vier Grand-Slam-Turniere und Olympiagold.', True, 'Golden Slam'),
    ('WD-40 wurde zuerst zum Schutz von Raketen verwendet.', True, 'Außenhaut von Raketen'),
    ('In Singapur ist der Verkauf von Kaugummi verboten.', True, 'Kaugummi seit 1992'),
    ('Coca-Cola hat den Weihnachtsmann im roten Mantel erfunden.', False, 'nicht erfunden'),
]

BOEK = dict(
    modus='facts', label='FAKTEN', schaal=1.1, taal='de',
    kop='Adventskalender für Männer', titel_meta='Adventskalender für Männer',
    titel_regels=[('ADVENTS-', 40), ('KALENDER', 40), ('FÜR MÄNNER', 27)],
    ondertitel='24 Tage kuriose Fakten, unglaubliche Geschichten und Angeberwissen',
    tagline='Für Männer, die schon alles haben', auteur='Max Falk',
    t=dict(inhoud='Inhalt', hlabel='TÜRCHEN {i}  •  {i}. DEZEMBER  •  FAKTEN {a}–{b}',
           quiz_toc='Bonus: Wahr oder falsch?', quiz_kop='Bonus-Quiz', quiz_label='BONUS', quiz_titel='Wahr oder falsch?',
           quiz_teaser='{n} Fragen, eine für jedes Türchen. Kreuze W oder F an und prüfe dann die Antworten. Perfekt für Heiligabend am Tisch.',
           tf='W&nbsp;&nbsp;&nbsp;F', antworten='Antworten', waar='WAHR', onwaar='FALSCH', zie='siehe Fakt',
           score='<b>Deine Punkte:</b> 20 oder mehr: wandelndes Lexikon. 12 bis 19: richtig scharf. Unter 12: die perfekte Ausrede, das Buch nächstes Jahr noch einmal zu lesen.',
           ook='Ebenfalls von {auteur}'),
    copyright=[
        '<b>Adventskalender für Männer</b>. 24 Tage kuriose Fakten, unglaubliche Geschichten und Angeberwissen',
        'Copyright © 2026 Max Falk. Alle Rechte vorbehalten.',
        'Kein Teil dieses Buches darf ohne schriftliche Genehmigung des Autors vervielfältigt, gespeichert oder verbreitet werden, ausgenommen kurze Zitate in Rezensionen.',
        'Alle Fakten wurden beim Schreiben anhand verlässlicher Quellen geprüft. Rekorde fallen und die Wissenschaft geht weiter, deshalb können sich einzelne Zahlen inzwischen geändert haben. Wo eine Geschichte eine Legende oder eine Vermutung ist, sagen wir das dazu.',
        'Markennamen gehören ihren Inhabern und werden nur genannt, um wahre Geschichten über sie zu erzählen.',
        'Emoji-Grafiken auf dem Umschlag: Noto Emoji von Google, Apache License 2.0.',
        'Erste Auflage 2026.'],
    intro_kop='So funktioniert dein Adventskalender',
    intro=[
        'Schokolade hat er schon. Socken auch. Dieses Buch ist für den Mann, der alles hat, außer der perfekten Geschichte für den nächsten Grillabend.',
        'Hinter jedem der <b>24 Türchen</b> warten <b>20 kuriose, wahre Fakten</b> zu einem Thema: vom Kälterekord am 1. Dezember über Fußball, Bier und Weltraum bis zu den seltsamsten Weihnachtsbräuchen an Heiligabend.',
        'Lies jeden Tag ein Türchen, beim Frühstück, auf dem Sofa oder dort, wo Männer am liebsten lesen. Ein Türchen dauert keine fünf Minuten. Und wer nicht warten kann: Wir verraten nichts.',
        'Am Ende wartet ein <b>Bonus-Quiz</b> mit 24 Wahr-oder-falsch-Fragen, eine für jedes Türchen. Ideal, um am Heiligabend die ganze Familie herauszufordern.',
        'Viel Spaß beim Staunen, Angeben und Weitererzählen. Und wenn du beim Lesen ausrufst: Moment mal, das stimmt?!, dann hat dieses Buch seinen Job gemacht.'],
    slot_kop='Frohe Weihnachten!',
    slot=[
        'Geschafft: 24 Türchen, 480 Fakten und hoffentlich jede Menge Stoff zum Angeben unter dem Weihnachtsbaum.',
        'Wenn dir dieser Adventskalender Spaß gemacht hat, freue ich mich sehr über eine ehrliche Bewertung bei Amazon. Für einen kleinen Autor ist das die größte Hilfe, und andere finden so ein Geschenk, das wirklich gelesen wird.',
        'Frohe Weihnachten und einen guten Rutsch!',
        'Max Falk'],
    ook=[('Moment mal, das stimmt?! Für Männer', '400 verblüffende Fakten und kurioses Wissen für Männer, die schon alles haben')],
    tf_quiz=TF,
)
BOEK['hoofdstukken'] = lees()
