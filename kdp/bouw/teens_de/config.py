import os
D = os.path.dirname(os.path.abspath(__file__))


def lees():
    uit = []
    for f in ['fakten1.txt', 'fakten2.txt', 'fakten3.txt', 'fakten4.txt']:
        for blk in open(os.path.join(D, f), encoding='utf-8').read().split('## ')[1:]:
            r = [l.strip() for l in blk.split('\n') if l.strip()]
            naam, teaser = [x.strip() for x in r[0].split('|')]
            uit.append((naam, teaser, r[1:]))
    assert len(uit) == 20 and all(len(x[2]) == 20 for x in uit), [(x[0], len(x[2])) for x in uit]
    alle = [f for x in uit for f in x[2]]
    assert len(set(alle)) == len(alle)
    return uit


TF = [
    ('Tauziehen war früher eine olympische Sportart.', True, 'Tauziehen war von 1900'),
    ('Headis wurde in Kaiserslautern erfunden.', True, 'Kaiserslautern'),
    ('Der kürzeste Krieg der Geschichte dauerte drei Tage.', False, 'kürzeste Krieg'),
    ('Wikinger trugen Helme mit Hörnern.', False, 'Helme mit Hörnern'),
    ('Die Chinesische Mauer kann man vom Mond aus mit bloßem Auge sehen.', False, 'Chinesische Mauer'),
    ('George Washington hatte Zähne aus Holz.', False, 'keine Holzzähne'),
    ('Napoleon war für seine Zeit sehr klein.', False, 'Napoleon war gar nicht'),
    ('Kleopatra lebte näher an der Mondlandung als am Bau der Großen Pyramide.', True, 'Kleopatra lebte'),
    ('Die Mikrowelle wurde wegen eines geschmolzenen Schokoriegels erfunden.', True, 'Schokoriegel'),
    ('Play-Doh war zuerst ein Tapetenreiniger.', True, 'Tapetenreiniger'),
    ('Karotten waren schon immer orange.', False, 'Karotten waren früher'),
    ('Grönlandhaie können über 270 Jahre alt werden.', True, 'Grönlandhaie'),
    ('Ein Oktopus hat drei Herzen.', True, 'drei Herzen'),
    ('Bei Seepferdchen bekommen die Weibchen die Babys.', False, 'Seepferdchen'),
    ('Haie gibt es schon länger als Bäume.', True, 'länger als Bäume'),
    ('Nur weibliche Mücken stechen.', True, 'Nur weibliche Mücken'),
    ('Kopfläuse können springen.', False, 'Kopfläuse'),
    ('Wombats machen würfelförmigen Kot.', True, 'würfelförmigen'),
    ('Elefanten können springen.', False, 'Elefanten können nicht springen'),
    ('Giraffen haben mehr Halswirbel als Menschen.', False, 'Halswirbel'),
    ('Mit etwas Übung kann man sich selbst kitzeln.', False, 'selbst kitzeln'),
    ('Ein Erwachsener hat mehr Knochen als ein Baby.', False, '300 Knochen'),
    ('Morgens bist du ein bisschen größer als abends.', True, 'Morgens bist du'),
    ('Verschluckter Kaugummi bleibt sieben Jahre im Magen.', False, 'Verschluckter Kaugummi'),
    ('Erdnüsse sind echte Nüsse.', False, 'Erdnüsse sind keine'),
    ('Ein Tag auf der Venus dauert länger als ein Jahr auf der Venus.', True, 'Ein Tag auf der Venus'),
    ('Auf dem Mars ist der Sonnenuntergang rot.', False, 'Sonnenuntergang blau'),
    ('Mario hieß in seinem ersten Spiel "Jumpman".', True, 'Jumpman'),
    ('Bluetooth ist nach einem König benannt.', True, 'Harald Blauzahn'),
    ('In Island wimmelt es im Sommer von Mücken.', False, 'In Island'),
]

TITEL = 'Echt jetzt?!'
ONDER = '400 verrückte, kluge und urkomische Fakten für Teenager'

BOEK = dict(
    modus='facts', label='FAKTEN', schaal=1.42, taal='de',
    kop=TITEL, titel_meta=TITEL,
    titel_regels=[('ECHT', 40), ('JETZT?!', 40), ('400 FAKTEN', 26)],
    ondertitel=ONDER,
    tagline='Das perfekte Geschenk für Jungs und Mädchen ab 12', auteur='Elias Grant',
    t=dict(inhoud='Inhalt', hlabel='KAPITEL {i2}  •  {label} {a}–{b}',
           quiz_toc='Bonus: Wahr oder falsch?', quiz_kop='Bonus-Quiz', quiz_label='BONUS', quiz_titel='Wahr oder falsch?',
           quiz_teaser='{n} schnelle Fragen für dich oder deine Freunde. Kreuze W oder F an und prüfe dann die Antworten.',
           tf='W&nbsp;&nbsp;&nbsp;F', antworten='Antworten', waar='WAHR', onwaar='FALSCH', zie='siehe Fakt',
           score='<b>Deine Punkte:</b> 25 oder mehr: wandelndes Lexikon. 15 bis 24: richtig schlau. Unter 15: die perfekte Ausrede, das Buch gleich noch einmal zu lesen.',
           ook='Ebenfalls von {auteur}', scan='Scannen und Rezension schreiben'),
    copyright=[
        f'<b>{TITEL}</b> {ONDER}',
        'Copyright © 2026 Elias Grant. Alle Rechte vorbehalten.',
        'Kein Teil dieses Buches darf ohne schriftliche Genehmigung des Autors vervielfältigt, gespeichert oder verbreitet werden, ausgenommen kurze Zitate in Rezensionen.',
        'Alle Fakten wurden beim Schreiben anhand verlässlicher Quellen geprüft. Rekorde fallen und die Wissenschaft geht weiter, deshalb können sich einzelne Zahlen inzwischen geändert haben. Wo eine Geschichte eher Legende als belegt ist, steht das dabei.',
        'Markennamen gehören ihren Inhabern und werden nur genannt, um wahre Geschichten über sie zu erzählen.',
        'Emoji-Grafiken auf dem Umschlag: Noto Emoji von Google, Apache License 2.0.',
        'Erste Auflage 2026.'],
    intro_kop='Bevor es losgeht',
    intro=[
        'Willkommen! Dieses Buch macht dich zu der Person, die immer noch einen Fakt mehr kennt.',
        'Hier warten <b>400 wahre Fakten</b> in <b>20 Kapiteln</b>: verrückte Sportarten, peinliche Geschichte, Tiere mit Superkräften, dein seltsamer Körper, das Weltall, Games, Filme und vieles mehr. '
        'Jeder Fakt ist in einer Minute gelesen und so verrückt, dass du ihn sofort jemandem erzählen willst.',
        'Du musst nicht vorne anfangen. Schlag das Buch irgendwo auf: im Bus, in der Pause, vor dem Einschlafen oder auf dem Klo. Wir verraten es niemandem.',
        '<b>Ein paar Ideen:</b>',
        '•  Frag einfach mal: „Wusstest du schon …?“<br/>'
        '•  Teste deine Freunde mit dem Wahr-oder-falsch-Quiz am Ende.<br/>'
        '•  Lies auf langen Autofahrten einen Fakt laut vor.<br/>'
        '•  Schick deine Lieblingsfakten in den Gruppenchat.',
        'Kleine Warnung: Du wirst öfter als einmal rufen: <b>Echt jetzt?!</b>'],
    review='https://kaufberater.best/r/echtjetzt',
    slot_kop='Eine kleine Bitte',
    slot=[
        'Wie hat dir das Buch gefallen? Eine kurze, ehrliche Bewertung bei Amazon hilft anderen, ein Geschenk zu finden, das wirklich gelesen wird, und für einen kleinen Autor ist sie die größte Hilfe. Ein Satz reicht.',
        'Viel Spaß beim Weitererzählen!',
        'Elias Grant'],
    ook=[],
    tf_quiz=TF,
)
BOEK['hoofdstukken'] = lees()
