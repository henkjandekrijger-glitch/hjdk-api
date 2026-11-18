# Voegt de ruwe data van vier onderzoekers (18 nov 2026) samen tot de lijst plastic-korea. Draai: python3 plastic-korea-merge.py <map met de ruwe json> <uit.json>
# Keuzes: reviews alleen RealSelf (praktijkpagina = organization, /dr/-profiel = doctor); Trustpilot had alleen voor Grand een profiel (1 review),
# Yelp, Google, Gangnam Unni en Babitalk waren niet te lezen. Opgenomen: elke kliniek of arts met minstens 5 RealSelf-reviews, plus JK (KAHF).
# Registers: geen specialisten-, KSPRS-, ISAPS-, KOIHA- of JCI-register was te lezen, dus board blijft leeg. KAHF (aanwijzing van het ministerie
# voor buitenlandse patienten) telt als acc; alleen JK staat er met een bron in (Dailypharm 2023). ASPS alleen van find.plasticsurgery.org.
# De MOJ-lijst 2025 van 'uitmuntende' klinieken voor medisch toerisme (ministerie van Justitie, visumbeleid) telt niet mee in de score.
# Risico: de Fair Trade Commission (12 jul 2026) gaf View, AB en DA een correctiebevel voor verzwegen betaalde reviews (middel).
# Grand staat niet in de lijst: RealSelf toont het praktijkaccount als geschorst, met 0 reviews.
import json, sys
D = sys.argv[1].rstrip('/') + '/'
R = json.load(open(D + 'plastic-korea-reviews.json'))['klinieken']
DAG = '2026-11-18'
def rs(bron, score, aantal, scope, laatste):
  return {'platform': 'RealSelf', 'score': score, 'max': 5, 'aantal': aantal, 'scope': scope, 'pct_1ster': None, 'waarschuwing': '', 'bron': bron, 'datum': DAG, 'laatste': laatste or ''}
def rev(sub, arts=None):
  out = []
  for k in R:
    if sub.lower() not in k['naam'].lower(): continue
    if arts is not None and (k.get('arts') or '') != arts: continue
    for p in k['platforms']:
      if p['platform'] != 'RealSelf' or not p.get('aantal') or p.get('makelaar'): continue
      out.append(rs(p['bron'], p['score'], int(p['aantal']), p['scope'], p.get('laatste_review')))
  return out
FTC = 'https://www.koreatimes.co.kr/southkorea/society/20260713/gangnam-plastic-surgery-clinics-penalized-over-incentivized-positive-reviews'
FTC_KR = 'https://dailypharm.com/user/news/340374'
def ftc(naam, bevel): return [{'wat': 'The Korea Fair Trade Commission found that ' + naam + ', together with two other Seoul clinics, gave promotional models undisclosed surgery discounts in exchange for positive reviews from 2018 to May 2026, and gave it ' + bevel + '. No fine was reported.', 'datum': '2026-07-12', 'bron': FTC if naam != 'DA Plastic Surgery' else FTC_KR, 'ernst': 'middel'}]
RP = 'https://www.realself.com/practices/'
C = [
 {'id': 'ab', 'naam': 'AB Plastic Surgery', 'stad': 'Seoul', 'site': 'https://abplasticsurgerykorea.com/',
  'artsen': [{'naam': 'Bae In Ho', 'titel': 'MD', 'bron': RP + 'ab-plastic-surgery-seoul-south-korea'}], 'reviews': rev('AB Plastic'),
  'signalen': {'chirurg': 'Jinho Lee, Jaeik Choi', 'asps': True, 'asps_bron': 'https://find.plasticsurgery.org/city/seoul'},
  'risico': ftc('AB Plastic Surgery', 'a corrective order')},
 {'id': 'girin', 'naam': 'Girin Plastic Surgery & Dermatology', 'stad': 'Seoul', 'site': '',
  'artsen': [{'naam': 'Seung Ryong Lee', 'titel': 'MD', 'bron': RP + 'girin-plastic-surgery-seoul-seoul'}], 'reviews': rev('Girin')},
 {'id': 'vip', 'naam': 'VIP Plastic Surgery Center Korea', 'stad': 'Jeju', 'site': 'http://www.vippskorea.com/',
  'artsen': [{'naam': 'Myung Ju Lee', 'titel': 'MD, PhD', 'bron': 'https://www.realself.com/dr/myung-ju-lee-seoul-south-korea'}, {'naam': 'Yongwoo Lee', 'titel': 'MD', 'bron': RP + 'vip-plastic-surgery-center-korea-seoul'}],
  'reviews': rev('VIP'), 'signalen': {'chirurg': 'Yongwoo Lee', 'asps': True, 'asps_bron': 'https://find.plasticsurgery.org/country/south%20korea'}},
 {'id': 'nana', 'naam': 'Nana Plastic Surgery', 'stad': 'Seoul', 'site': 'http://en.nanaprs.com/',
  'artsen': [{'naam': 'Dong Yeon Hwang', 'titel': 'MD', 'bron': RP + 'nana-plastic-surgery-hospital-seoul-seoul'}], 'reviews': rev('Nana'), 'vermeld': ['https://www.koreaherald.com/article/10589177']},
 {'id': 'da', 'naam': 'DA Plastic Surgery', 'stad': 'Seoul', 'site': 'https://daprs.com/',
  'artsen': [{'naam': 'Sang Woo Lee', 'titel': 'MD', 'bron': RP + 'da-plastic-surgery-clinic-seoul'}], 'reviews': rev('DA Plastic'), 'risico': ftc('DA Plastic Surgery', 'an order not to repeat it')},
 {'id': 'view', 'naam': 'View Plastic Surgery', 'stad': 'Seoul', 'site': 'https://www.viewplasticsurgery.com/',
  'artsen': [{'naam': 'Choi Soon Woo', 'titel': 'MD', 'bron': 'https://www.viewplasticsurgery.com/viewis/doctors/'}], 'reviews': rev('View Plastic'),
  'vermeld': ['https://www.koreatimes.co.kr/southkorea/society/20250429/from-k-pop-to-k-beauty-plastic-surgery-becomes-koreas-next-big-allure'],
  'openheid': {'prijs': 'Geschatte prijsklasse per implantaat voor borstvergroting, bijvoorbeeld $10.000 tot $14.000 (Motiva Ergonomix); geen vaste prijs.', 'prijs_bron': 'https://www.viewplasticsurgery.com/blog/breast-augmentation-cost-in-korea-2026-pricing-guide-clinical-analysis/',
    'arts_opereert': 'ja', 'arts_tekst': '"Real-Name Surgery System": de chirurg is "fully responsible for every step", "no proxy surgeries occur"; CCTV in de operatiekamers.', 'arts_bron': 'https://www.viewplasticsurgery.com/safe-system/safety-first.html'},
  'risico': ftc('View Plastic Surgery', 'a corrective order and an order to publish a notice of it')},
 {'id': 'idhospital', 'naam': 'ID Hospital', 'stad': 'Seoul', 'site': 'https://eng.idhospital.com/',
  'artsen': [{'naam': 'Sang Hoon Park', 'titel': 'MD', 'bron': RP + 'id-hospital-seoul-gangnam-gu'}], 'reviews': rev('ID Hospital')},
 {'id': 'jw', 'naam': 'JW Plastic Surgery', 'stad': 'Seoul', 'site': 'https://jwbeauty.net/',
  'artsen': [{'naam': 'Man Koon Suh', 'titel': 'MD', 'bron': RP + 'jw-plastic-surgery-center-seoul-gangnam-gu'}], 'reviews': rev('JW Plastic'),
  'openheid': {'arts_opereert': 'deels', 'arts_tekst': '"All procedures are executed by board-certified plastic surgery specialists", zonder de opererende chirurg te noemen; camera in elke operatiekamer.', 'arts_bron': 'https://jwbeauty.net/special-services/?noredirect=en-US'}},
 {'id': 'banobagi', 'naam': 'Banobagi Plastic Surgery', 'stad': 'Seoul', 'site': 'https://eng.banobagi.com/',
  'artsen': [{'naam': 'Chang-Hyun Oh', 'titel': 'MD', 'bron': 'https://www.realself.com/dr/chang-hyun-oh-seoul-south-korea'}, {'naam': 'Hyun-Taek Lee', 'titel': 'MD', 'bron': 'https://www.realself.com/find/South-Korea/Plastic-Surgeon/Hyun-Taek-Lee'}],
  'reviews': rev('Banobagi'), 'vermeld': ['https://www.koreatimes.co.kr/www/nation/2020/01/113_282366.html'],
  'openheid': {'arts_opereert': 'ja', 'arts_tekst': '"Banobagi is against ghost surgeries", een "REAL-NAME SYSTEM"; de chirurg "performs the entire procedure from start to finish" (neuspagina); vier anesthesiologen met naam.', 'arts_bron': 'https://eng.banobagi.com/'}},
 {'id': 'regen', 'naam': 'Regen Plastic Surgery', 'stad': 'Seoul', 'site': '',
  'artsen': [{'naam': 'Myung June Oh', 'titel': 'MD', 'bron': 'https://www.realself.com/dr/myung-june-oh-seoul-south-korea'}, {'naam': 'Seok Jun Lee', 'titel': 'MD', 'bron': 'https://www.realself.com/dr/seok-jun-lee-seoul-south-korea'}], 'reviews': rev('Regen')},
 {'id': 'ryu', 'naam': 'Dr. Min-Hee Ryu (RNWOOD Plastic Surgery)', 'stad': 'Seoul', 'site': 'https://rnwoodseoul.com/',
  'artsen': [{'naam': 'Min-Hee Ryu', 'titel': 'MD', 'bron': 'https://www.realself.com/dr/min-hee-ryu-seoul-south-korea'}], 'reviews': rev('RNWOOD')},
 {'id': 'wooa', 'naam': 'WOOA Plastic Surgery', 'stad': 'Seoul', 'site': 'https://wooaeng.com/',
  'artsen': [{'naam': 'Woo Jung Kim', 'titel': 'MD', 'bron': RP + 'wooa-plastic-surgery-clinic-gangnam-gu-seoul'}], 'reviews': rev('WOOA')},
 {'id': 'eight', 'naam': 'Eight Plastic Surgery & Dermatology', 'stad': 'Seoul', 'site': '',
  'artsen': [{'naam': 'Hanjo Kim', 'titel': 'MD', 'bron': 'https://www.realself.com/dr/hanjo-kim-seoul-south-korea'}], 'reviews': rev('Eight')},
 {'id': 'thankyou', 'naam': 'Thank You Plastic Surgery', 'stad': 'Seoul', 'site': '', 'artsen': [], 'reviews': rev('Thank You')},
 {'id': 'braun', 'naam': 'Braun Plastic Surgery', 'stad': 'Seoul', 'site': 'https://www.braunps.com/',
  'artsen': [{'naam': 'Tae-Gyu Kim', 'titel': 'MD', 'bron': RP + 'braun-plastic-surgery-seoul-south-korea'}], 'reviews': rev('Braun')},
 {'id': 'ts', 'naam': 'TS Plastic Surgery', 'stad': 'Seoul', 'site': '', 'artsen': [], 'reviews': rev('TS Plastic')},
 {'id': 'vg', 'naam': 'VG Plastic Surgery', 'stad': 'Seoul', 'site': '', 'artsen': [], 'reviews': rev('VG Plastic')},
 {'id': 'note', 'naam': 'Note Plastic Surgery', 'stad': 'Seoul', 'site': '', 'artsen': [], 'reviews': rev('Note Plastic')},
 {'id': 'jk', 'naam': 'JK Plastic Surgery Center', 'stad': 'Seoul', 'site': 'https://www.jkplastic.com/en/',
  'artsen': [{'naam': 'Joo Kwon', 'titel': 'MD', 'bron': 'https://lifestyle.inquirer.net/?p=43627'}], 'reviews': [],
  'signalen': {'acc': 'ja', 'acc_bron': 'https://m.dailypharm.com/user/news/21219'},
  'vermeld': ['https://www.medicaltimes.com/Main/view.html?ID=1113654', 'https://m.dailypharm.com/user/news/21219', 'https://lifestyle.inquirer.net/?p=43627', 'https://www.koreabiomed.com/news/articleView.html?idxno=1499']},
]
out = []
for c in C:
  assert c['reviews'] or c['id'] == 'jk', c['id']
  # een arts-profiel telt alleen voor de arts als artsen[].bron overeenkomt; zet de bron van de arts gelijk aan zijn RealSelf-profiel
  out.append({'id': c['id'], 'naam': c['naam'], 'stad': c['stad'], 'site': c['site'], 'artsen': c['artsen'], 'signalen': c.get('signalen', {}),
              'reviews': c['reviews'], 'vermeld': c.get('vermeld', []), 'openheid': c.get('openheid', {}), 'risico': c.get('risico', [])})
L = {'id': 'plastic-korea', 'land': 'KR', 'ingreep': 'eyelid', 'comparison_title': {'en': 'Plastic surgery South Korea', 'nl': 'Plastische chirurgie Zuid-Korea', 'de': 'Schönheitschirurgie Südkorea'}, 'naar': 'south-korea', 'methode': 'plastisch',
     'registers': {'board': 'KSPRS', 'vereniging': '', 'regionaal': '', 'acc': 'KAHF (Ministry of Health designation for foreign patients)',
       'boardTekst': {'en': 'a member of KSPRS, the Korean Society of Plastic and Reconstructive Surgeons, which admits only board-certified plastic surgeons (we could not read its member search, so no surgeon has these points yet)', 'nl': 'lid van KSPRS, de Koreaanse vereniging voor plastische en reconstructieve chirurgie, die alleen erkende plastisch chirurgen toelaat (de ledenzoeker was niet te lezen, dus nog geen chirurg heeft deze punten)', 'de': 'Mitglied der KSPRS, der koreanischen Gesellschaft für plastische und rekonstruktive Chirurgie, die nur anerkannte plastische Chirurgen aufnimmt (die Mitgliedersuche war nicht lesbar, daher hat noch kein Chirurg diese Punkte)'},
       'boardKort': {'en': 'verified KSPRS membership', 'nl': 'bewezen lidmaatschap van KSPRS', 'de': 'belegter KSPRS-Mitgliedschaft'}},
     'gecontroleerd': DAG, 'gepubliceerd': DAG,
     'slugs': {'en': 'best-plastic-surgeons-south-korea', 'nl': 'nl/beste-plastisch-chirurgen-zuid-korea', 'de': 'de/beste-schoenheitschirurgen-suedkorea'},
     'klinieken': out,
     'niet_gerangschikt': [{'naam': 'Grand Plastic Surgery (Seoul)', 'reden': 'not ranked: RealSelf shows its practice account as suspended, with no reviews', 'bron': RP + 'grand-plastic-surgery-korea-seoul'}]}
T = json.load(open(D + 'plastic-korea-teksten.json'))
L['tekst'] = T['tekst']
for k in out:
  if k['id'] in T['conclusie']: k['conclusie'] = T['conclusie'][k['id']]
json.dump(L, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
print(len(out))
