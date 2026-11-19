# Voegt de ruwe data van vier onderzoekers (19 nov 2026) samen tot de lijst plastic-thailand. Draai: python3 plastic-thailand-merge.py <map met de ruwe json> <uit.json>
# Keuzes: reviews van RealSelf (artsprofielen, scope doctor) en Trustpilot (ziekenhuizen, scope organization). Trustpilot meldt bij alle Thaise
# ziekenhuizen dat het bedrijf klanten niet (recent) uitnodigt en dat de reviews daardoor misschien niet representatief zijn; dat is een
# standaardmelding over uitnodigen, geen melding over nepreviews, dus geen waarschuwing (geen aftrek). Destination Beauty (Trustpilot 4,6 uit 615)
# is een bemiddelaar en telt niet. Google, Tripadvisor en Facebook: score en aantal niet betrouwbaar te lezen.
# Registers: alleen de open data van HA Thailand (stand 31 aug 2026) en de ASPS-zoeker waren te lezen. De artsencheck van de Thai Medical Council,
# de Thai Board (RCST), PRST, ISAPS en de JCI-lijst niet, dus board blijft leeg en JCI telt niet (alleen claims van ziekenhuizen zelf).
# HA telt als acc alleen bij een geldige accreditatie op 19 nov 2026 (Yanhee verlopen 2019, Siriroj verlopen 2007, Kamol en Lelux zonder trap).
# ASPS-lidmaatschap alleen van find.plasticsurgery.org; ASPS controleert profielen niet zelf.
# Vermeld: alleen nieuws, forums en vakliteratuur (geen RealSelf, geen ASPS, geen betaalde PR of dealpagina's).
# Phuket Plastic Surgery Institute zit in Bangkok Hospital Siriroj (voorheen Phuket International Hospital): één vermelding.
# Prijs van PPSI telt niet: de actieprijs gold tot 31 mei 2026. Geen kliniek zegt dat de genoemde chirurg zelf opereert.
# Opgenomen: elk artsprofiel met minstens 13 RealSelf-reviews, elk ziekenhuis of elke kliniek met data in een tweede groep.
import json, sys
D = sys.argv[1].rstrip('/') + '/'
R = json.load(open(D + 'plastic-thailand-reviews.json'))['klinieken']
DAG = '2026-11-19'
HA = 'https://data.ha.or.th/dataset/ebc2438a-4597-46e1-9e03-335b01c60981/resource/d9832ac9-a1b3-4ac9-8e7b-eef682d7985a/download/ha.csv'
ASPS1 = 'https://find.plasticsurgery.org/country/thailand'
ASPS2 = 'https://find.plasticsurgery.org/country/thailand/?page=2'
DR = 'https://www.realself.com/dr/'
def rev(platform, sub, veld='naam'):
  out = []
  for k in R:
    if sub.lower() not in (k.get(veld) or '').lower(): continue
    for p in k['platforms']:
      if p['platform'] != platform or not p.get('aantal') or p.get('makelaar') or p.get('score') is None: continue
      out.append({'platform': platform, 'score': p['score'], 'max': 5, 'aantal': int(p['aantal']), 'scope': p['scope'], 'pct_1ster': p.get('pct_1ster') if platform == 'Trustpilot' else None,
                  'waarschuwing': '', 'bron': p['bron'], 'datum': DAG, 'laatste': p.get('laatste_review') or ''})
  assert out, (platform, sub)
  return out
def arts(sub): return rev('RealSelf', sub, 'arts')
def ha(): return {'acc': 'ja', 'acc_bron': HA}
C = [
 # artsen met een RealSelf-profiel
 {'id': 'bonnie', 'naam': 'Bonnie Clinic (Dr. Boonchai Taweerattanasil)', 'stad': 'Bangkok', 'site': '',
  'artsen': [{'naam': 'Boonchai Taweerattanasil', 'titel': 'MD', 'bron': DR + 'boonchai-taweerattanasil-bangkok-thailand'}], 'reviews': arts('Boonchai'),
  'signalen': {'chirurg': 'Boonchai Taweerattanasil', 'asps': True, 'asps_bron': ASPS1}},
 {'id': 'kamol', 'naam': 'Kamol Cosmetic Hospital (Dr. Kamol Pansritum)', 'stad': 'Bangkok', 'site': 'https://www.kamolhospital.com/',
  'artsen': [{'naam': 'Kamol Pansritum', 'titel': 'MD', 'bron': DR + 'kamol-pansritum-bangkok-thailand'}], 'reviews': arts('Kamol Pansritum') + rev('Trustpilot', 'Kamol')},
 {'id': 'parin', 'naam': 'Dr. Parin Tatsanavivat', 'stad': 'Bangkok', 'site': '',
  'artsen': [{'naam': 'Parin Tatsanavivat', 'titel': 'MD', 'bron': DR + 'parin-tatsanavivat-bangkok-thailand'}], 'reviews': arts('Parin Tatsanavivat')},
 {'id': 'veerawat', 'naam': 'Dr. Veerawat Tirananmongkol', 'stad': 'Bangkok', 'site': '',
  'artsen': [{'naam': 'Veerawat Tirananmongkol', 'titel': 'MD', 'bron': 'https://www.phyathai.com/en/pyt2/doctor/dr-veerawat-tirananmongkol'}], 'reviews': arts('Veerawat'),
  'vermeld': ['https://forum.purseblog.com/threads/thailand-for-breast-augmentation-implant.1044424']},
 {'id': 'siripong', 'naam': 'Dr. Siripong Plastic Surgery (Dr. Siripong Prasertsuntarasai)', 'stad': 'Bangkok', 'site': '',
  'artsen': [{'naam': 'Siripong Prasertsuntarasai', 'titel': 'MD, FRCST', 'bron': DR + 'siripong-prasertsuntarasai-bangkok-thailand'}], 'reviews': arts('Siripong'),
  'signalen': {'chirurg': 'Siripong Prasertsuntarasai', 'asps': True, 'asps_bron': ASPS1}},
 {'id': 'angkana', 'naam': 'Dr. Angkana Tanvatanagul', 'stad': 'Bangkok', 'site': '',
  'artsen': [{'naam': 'Angkana Tanvatanagul', 'titel': 'MD', 'bron': DR + 'angkana-tanvatanagul-bangkok-thailand'}], 'reviews': arts('Angkana')},
 {'id': 'kasemsak', 'naam': 'The Empire Place (Dr. Kasemsak Pyungtanasup)', 'stad': 'Bangkok', 'site': '',
  'artsen': [{'naam': 'Kasemsak Pyungtanasup', 'titel': 'MD', 'bron': DR + 'kasemsak-pyungtanasup-bangkok-thailand'}], 'reviews': arts('Kasemsak'),
  'signalen': {'chirurg': 'Kasemsak Pyungtanasup', 'asps': True, 'asps_bron': ASPS1}},
 {'id': 'jungceylon', 'naam': 'Jungceylon Plastic Surgery Clinic (Dr. Piyapas Pichaichanarong)', 'stad': 'Phuket', 'site': '',
  'artsen': [{'naam': 'Piyapas Pichaichanarong', 'titel': 'MD', 'bron': DR + 'piyapas-pichaichanarong-phuket-thailand'}], 'reviews': arts('Piyapas'),
  'signalen': {'chirurg': 'Piyapas Pichaichanarong', 'asps': True, 'asps_bron': ASPS2}},
 {'id': 'chakarin', 'naam': 'Dr. Chakarin Suchakaro', 'stad': 'Bangkok', 'site': '',
  'artsen': [{'naam': 'Chakarin Suchakaro', 'titel': 'MD', 'bron': DR + 'chakarin-suchakaro-bangkok-thailand'}], 'reviews': arts('Chakarin'),
  'signalen': {'chirurg': 'Chakarin Suchakaro', 'asps': True, 'asps_bron': ASPS1}},
 {'id': 'ronachai', 'naam': 'Dr. Ronachai Komthong', 'stad': 'Bangkok', 'site': '',
  'artsen': [{'naam': 'Ronachai Komthong', 'titel': 'MD', 'bron': DR + 'ronachai-komthong-bangkok-thailand'}], 'reviews': arts('Ronachai')},
 {'id': 'rungkit', 'naam': 'Dr. Rungkit Tanjapatkul', 'stad': 'Bangkok', 'site': '',
  'artsen': [{'naam': 'Rungkit Tanjapatkul', 'titel': 'MD', 'bron': DR + 'rungkit-tanjapatkul-bangkok-thailand'}], 'reviews': arts('Rungkit')},
 {'id': 'dalip', 'naam': 'Dr. Dalip Juneja', 'stad': 'Bangkok', 'site': '',
  'artsen': [{'naam': 'Dalip Juneja', 'titel': 'MD', 'bron': DR + 'dalip-juneja-bangkok-thailand'}], 'reviews': arts('Dalip')},
 # ziekenhuizen en klinieken
 {'id': 'yanhee', 'naam': 'Yanhee International Hospital', 'stad': 'Bangkok', 'site': 'https://www.yanhee.net/',
  'artsen': [{'naam': 'Greechart Pornsinsirirak', 'titel': 'Dr', 'bron': 'https://www.khaosodenglish.com/life/2015/02/02/1422855268/'}], 'reviews': rev('Trustpilot', 'Yanhee'),
  'vermeld': ['https://www.nationthailand.com/news/30379032', 'https://www.khaosodenglish.com/life/2015/02/02/1422855268/', 'https://channel4.com/news/dangers-plastic-surgery-thailand', 'https://aseannow.com/topic/98163-plastic-surgery/', 'https://aseannow.com/topic/232248-facelift-in-or-around-bangkok/', 'https://fodors.com/community/asia/medical-tourism-facelift-in-bangkok-1650034/page2'],
  'openheid': {'prijs': 'Neuscorrectie THB 105.000 (2 nachten), mid-facelift THB 165.000.', 'prijs_bron': 'https://yanhee.net/price/plastic-surgery/nose-reshaping'}},
 {'id': 'bumrungrad', 'naam': 'Bumrungrad International Hospital', 'stad': 'Bangkok', 'site': 'https://www.bumrungrad.com/plastic-surgery',
  'artsen': [{'naam': 'Amorn Poomee', 'titel': 'MD', 'bron': 'https://www.bumrungrad.com/en/doctors/amorn-poomee'}, {'naam': 'Seree Iamphongsai', 'titel': 'MD', 'bron': 'https://www.bumrungrad.com/en/doctors/seree-iamphongsai'}],
  'reviews': rev('Trustpilot', 'Bumrungrad'), 'signalen': ha(),
  'vermeld': ['https://aseannow.com/topic/232248-facelift-in-or-around-bangkok/', 'https://fodors.com/community/asia/medical-tourism-facelift-in-bangkok-1650034/page2', 'https://aseannow.com/topic/98163-plastic-surgery/', 'https://phuketwan.com/tourism/phukets-uplifting-stitch-time-road-show/'],
  'risico': [{'wat': "Thailand's Supreme Court upheld a ruling that Bumrungrad and two doctors must jointly pay THB 1 million plus interest for negligence in failing to detect a child's birth defects. This was an obstetric case, not cosmetic surgery.", 'datum': '2018-03-13', 'bron': 'https://www.nationthailand.com/news/30340932', 'ernst': 'middel'}]},
 {'id': 'bangkokhospital', 'naam': 'Bangkok Hospital', 'stad': 'Bangkok', 'site': 'https://www.bangkokhospital.com/en/bangkok/center-clinic/surgery/bangkok-plastic-surgery-and-reconstruction-center/overview',
  'artsen': [], 'reviews': rev('Trustpilot', 'Bangkok Hospital'), 'signalen': ha(),
  'openheid': {'prijs': 'Ooglidcorrectie boven of onder (lokale verdoving) THB 60.000, neuscorrectie (lokale verdoving) THB 46.000.', 'prijs_bron': 'https://www.bangkokhospital.com/en/bangkok/package/plastic-surgery-packages'}},
 {'id': 'siriroj', 'naam': 'Phuket Plastic Surgery Institute (Bangkok Hospital Siriroj)', 'stad': 'Phuket', 'site': 'https://www.phuketpsi.com/',
  'artsen': [{'naam': 'Sanguan Kunaporn', 'titel': 'Dr', 'bron': 'https://www.phuketpsi.com/our-services/rhinoplasty-nose-surgery/'}, {'naam': 'Pongsatorn Sanguanchua', 'titel': 'MD', 'bron': 'https://find.plasticsurgery.org/country/thailand/for-medical-professionals'}, {'naam': 'Rushapol Sdawat', 'titel': 'MD', 'bron': ASPS1}],
  'reviews': [], 'signalen': {'chirurg': 'Pongsatorn Sanguanchua, Rushapol Sdawat', 'asps': True, 'asps_bron': ASPS1},
  'vermeld': ['https://pmc.ncbi.nlm.nih.gov/articles/3312144', 'https://forum.purseblog.com/threads/thailand-for-breast-augmentation-implant.1044424', 'https://phuketwan.com/tourism/phuket-takes-aussie-doctors-surgery-wars-12550/', 'https://phuketwan.com/tourism/phukets-face-medi-tours-12632/'],
  'openheid': {'garantie': 'Schriftelijke regeling: meld een probleem binnen 12 maanden na de operatie, dan beslist een commissie over geen operatie, een revisie tegen lagere prijs of een gratis revisie.', 'garantie_bron': 'https://www.phuketpsi.com/surgical-promise-and-condition/', 'nazorg_status': 'verified', 'nazorg_bron': 'https://www.phuketpsi.com/surgical-promise-and-condition/'}},
 {'id': 'bangkokphuket', 'naam': 'Bangkok Hospital Phuket', 'stad': 'Phuket', 'site': 'https://www.phukethospital.com/', 'artsen': [], 'reviews': [], 'signalen': ha(),
  'vermeld': ['https://phuketwan.com/tourism/phuket-takes-aussie-doctors-surgery-wars-12550/']},
 {'id': 'samitivej', 'naam': 'Samitivej Sukhumvit Hospital', 'stad': 'Bangkok', 'site': 'https://www.samitivejhospitals.com/center/detail/samitivej-plastic-and-esthetic-surgery-institute', 'artsen': [], 'reviews': [], 'signalen': ha(),
  'vermeld': ['https://phuketwan.com/tourism/phukets-uplifting-stitch-time-road-show/']},
 {'id': 'bnh', 'naam': 'BNH Hospital', 'stad': 'Bangkok', 'site': 'https://www.bnhhospital.com/',
  'artsen': [{'naam': 'Nond Rojvachiranonda', 'titel': 'Prof., MD', 'bron': 'https://www.bnhhospital.com/doctors/prof-nond-rojvachiranonda-m-d/'}], 'reviews': [], 'signalen': ha(),
  'vermeld': ['https://www.iol.co.za/travel/world/famed-thai-sex-change-doc-does-it-live-229260', 'https://aseannow.com/topic/232248-facelift-in-or-around-bangkok/']},
 {'id': 'phyathai2', 'naam': 'Phyathai 2 International Hospital', 'stad': 'Bangkok', 'site': 'https://www.phyathai.com/en/pyt2', 'artsen': [], 'reviews': [], 'signalen': ha(),
  'openheid': {'prijs': 'Geslachtsbevestigende operatie man naar vrouw (met darmdeel) THB 500.000, inclusief artsenhonorarium en 5 nachten.', 'prijs_bron': 'https://www.phyathai.com/en/pyt2/package/sex-reassignment-surgery-pt2'}},
 {'id': 'pai', 'naam': 'Preecha Aesthetic Institute (PAI)', 'stad': 'Bangkok', 'site': 'https://pai.co.th/',
  'artsen': [{'naam': 'Preecha Tiewtranon', 'titel': 'Assoc. Prof.', 'bron': 'https://pai.co.th/srs-penile-skin-inversion/'}], 'reviews': [],
  'vermeld': ['https://www.theglobeandmail.com/news/world/transgender-surgery-niche-growing-in-thailand/article27002194/', 'https://typeinvestigations.org/analysis/2013/10/02/global-medical-tourism-sex-reassignment-surgery/']},
 {'id': 'suporn', 'naam': 'Suporn Clinic (Dr. Suporn Watanyusakul)', 'stad': 'Chonburi', 'site': '',
  'artsen': [{'naam': 'Suporn Watanyusakul', 'titel': 'Dr', 'bron': 'https://www.urotoday.com/recent-abstracts/pelvic-health-reconstruction/gu-trauma-reconstruction/116515-vaginoplasty-modifications-to-improve-vulvar-aesthetics.html'}], 'reviews': [],
  'vermeld': ['https://www.urotoday.com/recent-abstracts/pelvic-health-reconstruction/gu-trauma-reconstruction/116515-vaginoplasty-modifications-to-improve-vulvar-aesthetics.html', 'https://pmc.ncbi.nlm.nih.gov/articles/3312144']},
 {'id': 'lelux', 'naam': 'Lelux Hospital', 'stad': 'Bangkok', 'site': 'https://www.lelux.co.th/en/',
  'artsen': [{'naam': 'Vitusinee Udee', 'titel': 'MD', 'bron': ASPS2}], 'reviews': [], 'signalen': {'chirurg': 'Vitusinee Udee', 'asps': True, 'asps_bron': ASPS2}},
 {'id': 'asiacosmetic', 'naam': 'Asia Cosmetic Hospital', 'stad': 'Bangkok', 'site': 'https://www.asiacosmeticthailand.com/', 'artsen': [], 'reviews': rev('Trustpilot', 'Asia Cosmetic')},
]
out = []
for c in C:
  out.append({'id': c['id'], 'naam': c['naam'], 'stad': c['stad'], 'site': c['site'], 'artsen': c['artsen'], 'signalen': c.get('signalen', {}),
              'reviews': c['reviews'], 'vermeld': c.get('vermeld', []), 'openheid': c.get('openheid', {}), 'risico': c.get('risico', [])})
L = {'id': 'plastic-thailand', 'land': 'TH', 'ingreep': 'breast', 'comparison_title': {'en': 'Plastic surgery Thailand', 'nl': 'Plastische chirurgie Thailand', 'de': 'Schönheitschirurgie Thailand'}, 'naar': 'thailand', 'methode': 'plastisch',
     'registers': {'board': 'Thai Board of Plastic Surgery', 'vereniging': '', 'regionaal': '', 'acc': 'HA Thailand (Healthcare Accreditation Institute)',
       'boardTekst': {'en': 'certified in plastic surgery by the Thai Board (Royal College of Surgeons of Thailand), as shown in the doctor check of the Thai Medical Council (we could not read that check, so no surgeon has these points yet)', 'nl': 'erkend plastisch chirurg via de Thai Board (Royal College of Surgeons of Thailand), zoals te zien in de artsencheck van de Thai Medical Council (die check was niet te lezen, dus nog geen chirurg heeft deze punten)', 'de': 'als plastischer Chirurg anerkannt durch das Thai Board (Royal College of Surgeons of Thailand), sichtbar in der Arztsuche des Thai Medical Council (diese Suche war nicht lesbar, daher hat noch kein Chirurg diese Punkte)'},
       'boardKort': {'en': 'verified Thai Board certification in plastic surgery', 'nl': 'bewezen Thaise erkenning als plastisch chirurg', 'de': 'belegter thailändischer Facharztanerkennung für plastische Chirurgie'}},
     'gecontroleerd': DAG, 'gepubliceerd': DAG,
     'slugs': {'en': 'best-plastic-surgeons-thailand', 'nl': 'nl/beste-plastisch-chirurgen-thailand', 'de': 'de/beste-schoenheitschirurgen-thailand'},
     'klinieken': out,
     'niet_gerangschikt': [{'naam': 'Destination Beauty (Bangkok)', 'reden': 'not ranked: a broker that arranges surgery trips, not a clinic; its 615 Trustpilot reviews do not count for a surgeon', 'bron': 'https://se.trustpilot.com/review/destinationbeauty.com'}]}
T = json.load(open(D + 'plastic-thailand-teksten.json'))
L['tekst'] = T['tekst']
for k in out:
  if k['id'] in T['conclusie']: k['conclusie'] = T['conclusie'][k['id']]
json.dump(L, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
print(len(out))
