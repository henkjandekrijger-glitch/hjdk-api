# Voegt de ruwe data van vier onderzoekers (20 nov 2026) samen tot de lijst dental-turkey (tandimplantaten Turkije).
# Draai: python3 dental-turkey-merge.py <map met de ruwe json> <uit.json>
# Keuzes:
# - Methode 'tand' (lib/tsc-rank.js METHODE_T): specialist kaakchirurgie, parodontologie of prothetiek buiten de eigen site bevestigd 15,
#   alleen op de eigen site 5, doctoraat 5, ITI/ICOI fellow 5 of lid 3, nationale vereniging 5; ministerie (zorgtoerisme) 10, JCI 5.
# - Reviews alleen Trustpilot (organisatieprofielen). WhatClinic is een boekings- en aanvraagplatform en telt niet. Tripadvisor, Google en
#   Reddit waren niet te lezen. Trustpilot-profielen met de melding 'score niet beschikbaar, nepreviews verwijderd' krijgen die waarschuwing
#   en geen score (Natural Clinic, Smile Team Turkey, Dental Design Turkey, Serinsey Smile).
# - Ministerielijst (shgmturizmdb, sublijsten geblokkeerd door robots.txt) en JCI-zoeker niet te lezen: vergunning telt voor niemand.
#   Esnan meldt zelf JCI sinds 2 juli 2026 (Dental Tribune 10 aug 2026, op basis van de kliniek): niet geteld.
# - Specialist onafhankelijk bevestigd: Dentfix, Assoc. Prof. Dr. Ayse Atay (cv Altinbas Universiteit: doctoraat prothetiek Ege 2006-2010,
#   lid Turk Prostodonti ve Implantoloji Dernegi); de koppeling aan Dentfix staat alleen op de site van Dentfix.
#   Smile Dental Turkey, Dr. Ozkan Ozkaynak (doktorsitesi.com, artsenportaal: Uzm. Dt. kaakchirurgie Ankara 2000-2006, lid van de Turkse
#   vereniging voor kaakchirurgie); dat portaal noemt als werkplek een andere kliniek (Falez), de koppeling staat op de site van Smile Dental.
#   Zijn doctoraat staat alleen op de eigen site en telt niet.
# - Specialist alleen op de eigen site: Dentakay (kaakchirurgen zonder titel), DentaTur (Dr. Eren Ozil), Hospitadent (Dr. Musa Erdem),
#   Acibadem, Medipol.
# - Vermeld: alleen nieuws en forums. Dentakay: City AM (2x) en Evening Standard tellen; Saga en Luxury London niet (niet vermeld wie de
#   behandeling betaalde). Dr. Cinik (DHA, informatie van de kliniek zelf) telt niet.
# - Openheid: prijs alleen bij echte bedragen per implantaat (Dentakay geeft alleen startprijzen per kaak, Hospitadent marktprijzen: tellen niet).
#   Garantie telt alleen met jaren en voorwaarden (Smile Dental Turkey, Dental Centre Turkey); 'levenslange garantie' zonder voorwaarden
#   (Dentfix, DentaTur) staat erbij maar telt niet.
# - Geen kliniek met een gemeld incident in betrouwbare media; algemene risico's (BDA, FCDO, Turkse regels 2025) staan in de teksten.
import json, sys
D = sys.argv[1].rstrip('/') + '/'
DAG = '2026-11-20'
TP = lambda score, aantal, pct, bron, w='': [{'platform': 'Trustpilot', 'score': score, 'max': 5, 'aantal': aantal, 'scope': 'organization', 'pct_1ster': pct,
                                          'waarschuwing': w, 'bron': bron, 'datum': DAG, 'laatste': ''}]
FAKE = 'Trustpilot removed fake reviews'
def tpw(aantal, pct, bron): return TP(None, aantal, pct, bron, FAKE)
CITYAM1 = 'https://www.cityam.com/?p=1923560'
CITYAM2 = 'https://www.cityam.com/teeth-tourism-and-hairlines-is-turkey-the-future-of-british-healthcare/'
ES = 'https://www.inkl.com/news/turkish-clinic-reports-surge-in-britons-seeking-dental-treatment'
REUT = 'https://www.dailysabah.com/business/economy/turkiye-among-hot-spots-as-more-brits-seek-dental-treatment-abroad'
MUMS = 'https://www.mumsnet.com/talk/am_i_being_unreasonable/5322524-anyone-have-recommendations-for-turkey-dentist'
EXP1 = 'https://www.expat.com/en/forum/middle-east/turkey/931889-dental-work.html'
EXP2 = 'https://www.expat.com/en/forum/middle-east/turkey/931889-dental-work-p2.html'
EXP3 = 'https://www.expat.com/en/forum/middle-east/turkey/1033247-dentists-in-turkey.html'
SDT = 'https://www.smiledentalturkey.com/treatment/dental-implants/'
DOKS = 'https://www.doktorsitesi.com/uzm-dt-ozkan-ozkaynak/dis-hekimi-agiz-dis-ve-cene-cerrahisi/antalya'
ATAY = 'https://web.altinbas.edu.tr/ayse.atay/cv/?L=EN'
C = [
 {'id': 'smiledental-tr', 'naam': 'Smile Dental Turkey', 'stad': 'Antalya', 'site': 'https://www.smiledentalturkey.com/',
  'artsen': [{'naam': 'Özkan Özkaynak', 'titel': 'DDS, oral surgeon', 'bron': 'https://www.smiledentalturkey.com/'}, {'naam': 'Ceyda Özkaynak', 'titel': 'DDS, oral surgeon', 'bron': 'https://www.smiledentalturkey.com/'}, {'naam': 'Fatma Uslu', 'titel': 'DDS, Assoc. Prof., prosthodontics', 'bron': 'https://www.smiledentalturkey.com/'}],
  'signalen': {'chirurg': 'Özkan Özkaynak', 'specialist': 'Uzm. Dt. Ağız, Diş ve Çene Cerrahisi', 'specialist_onafh': True, 'specialist_bron': DOKS,
               'nationaal': 'Türk Oral ve Maksillofasiyal Cerrahi Derneği', 'nationaal_bron': DOKS},
  'reviews': TP(4.9, 1190, 0, 'https://es.trustpilot.com/review/smiledentalturkey.com'),
  'openheid': {'prijs': 'Enkel implantaat met abutment, contant: Neodent GBP 392, Nobel Biocare GBP 538, Straumann GBP 632; zirkoniumkroon GBP 167 extra. All-on-4 per kaak GBP 1.753 tot 2.822.', 'prijs_bron': SDT,
               'arts_opereert': 'deels', 'arts_tekst': 'Noemt kaakchirurg Dr. Özkan Özkaynak; casussen op de site zeggen dat hij de implantaten plaatste.', 'arts_bron': 'https://www.smiledentalturkey.com/treatment/all-on-4-dental-implants/',
               'garantie': 'Levenslange fabrieksgarantie op het implantaat; het eerste jaar een revisie na goedkeuring met vlucht tot GBP 200, 6 hotelnachten en vervoer; daarna 4 jaar garantie op kronen en bruggen.', 'garantie_bron': SDT, 'nazorg_status': 'verified', 'nazorg_bron': SDT}},
 {'id': 'dentfix', 'naam': 'Dentfix Clinic', 'stad': 'Istanbul', 'site': 'https://dentfixturkey.com/',
  'artsen': [{'naam': 'Ayşe Atay', 'titel': 'Assoc. Prof. Dr., prosthodontist', 'bron': ATAY}, {'naam': 'Siavash Abbasgholizadeh', 'titel': 'Dr., oral surgeon', 'bron': 'https://dentfixturkey.com/dental-implants'}],
  'signalen': {'chirurg': 'Ayşe Atay', 'specialist': 'Protetik Diş Tedavisi', 'specialist_onafh': True, 'specialist_bron': ATAY, 'phd': True, 'phd_bron': ATAY,
               'nationaal': 'Türk Prostodonti ve İmplantoloji Derneği', 'nationaal_bron': ATAY},
  'reviews': TP(4.3, 138, 10, 'https://www.trustpilot.com/review/dentfixturkey.com'),
  'openheid': {'prijs': 'Enkel implantaat EUR 272 tot 490 (standaard internationaal merk), EUR 690 tot 890 (Straumann of Nobel Biocare), met abutment, kroon, scans en controles; botopbouw en sinuslift apart.', 'prijs_bron': 'https://dentfixturkey.com/dental-implants',
               'arts_opereert': 'ja', 'arts_tekst': 'De implantatenpagina noemt kaakchirurg Dr. Siavash Abbasgholizadeh als degene die de implantaten plaatst; de kronen plant prothetist Assoc. Prof. Dr. Ayşe Atay.', 'arts_bron': 'https://dentfixturkey.com/dental-implants',
               'garantie': 'Zegt levenslange garantie op implantaten en 5 tot 10 jaar op kronen en facings; voorwaarden staan niet op de pagina.', 'garantie_bron': 'https://dentfixturkey.com/dental-implants'}},
 {'id': 'dentatur-tr', 'naam': 'DentaTur', 'stad': 'Antalya', 'site': 'https://dentatur.com/',
  'artsen': [{'naam': 'Sevil Kaderli', 'titel': 'Dr., chief physician', 'bron': 'https://dentatur.com/the-team/'}, {'naam': 'Eren Özil', 'titel': 'Dt. Dr., oral and maxillofacial surgeon', 'bron': 'https://dentatur.com/the-team/'}, {'naam': 'Ufuk Arısoy', 'titel': 'Dt., prosthetics specialist', 'bron': 'https://dentatur.com/the-team/'}],
  'signalen': {'chirurg': 'Eren Özil', 'specialist': 'oral and maxillofacial surgeon', 'specialist_bron': 'https://dentatur.com/the-team/'},
  'reviews': TP(4.9, 1261, 0, 'https://www.trustpilot.com/review/dentatur.com'),
  'openheid': {'prijs': 'Enkel implantaat vanaf GBP 300 (Straumann Nuvo), Neodent GBP 400, Medentica GBP 490, Nobel Biocare GBP 590; niet vermeld wat erbij zit. De All-on-4-bedragen op dezelfde pagina spreken elkaar tegen.', 'prijs_bron': 'https://dentatur.com/blog/teeth-implants-turkey-antalya-cost-reviews/',
               'garantie': 'Zegt levenslange garantie op implantaten en 10 jaar op kronen, zonder voorwaarden.', 'garantie_bron': 'https://dentatur.com/blog/teeth-implants-turkey-antalya-cost-reviews/'}},
 {'id': 'dentakay-tr', 'naam': 'Dentakay Dental Clinic', 'stad': 'Istanbul', 'site': 'https://dentakay.com/',
  'artsen': [{'naam': 'Gülay Akay', 'titel': 'Dr., founder', 'bron': 'https://dentakay.com/our-doctors'}, {'naam': 'Ahmet Alper Kaya', 'titel': 'Dr., implantologist', 'bron': 'https://dentakay.com/our-doctors'}, {'naam': 'Ali Ekemen', 'titel': 'Dr., oral and maxillofacial surgeon', 'bron': 'https://dentakay.com/our-doctors'}],
  'signalen': {'specialist': 'oral and maxillofacial surgeons', 'specialist_bron': 'https://dentakay.com/our-doctors'},
  'reviews': TP(4.3, 1700, 14, 'https://ca.trustpilot.com/review/dentakay.com/location/antalya'),
  'vermeld': [CITYAM1, CITYAM2, ES]},
 {'id': 'hospitadent', 'naam': 'Hospitadent', 'stad': 'Istanbul', 'site': 'https://www.hospitadent.com/en',
  'artsen': [{'naam': 'Musa Erdem', 'titel': 'Dr., oral, dental and maxillofacial surgeon', 'bron': 'https://hospitadent.com/en/hekim/dr-musa-erdem-6'}, {'naam': 'Mehmet Kaan Bilecen', 'titel': 'Dr. Dt., prosthodontics', 'bron': 'https://www.hospitadent.com/en/doctors'}],
  'signalen': {'specialist': 'oral, dental and maxillofacial surgeon', 'specialist_bron': 'https://hospitadent.com/en/hekim/dr-musa-erdem-6'},
  'reviews': TP(4.4, 453, 5, 'https://ca.trustpilot.com/review/hospitadent.com')},
 {'id': 'verasmile', 'naam': 'Vera Smile', 'stad': 'Istanbul', 'site': 'https://www.verasmile.com/', 'artsen': [],
  'reviews': TP(4.5, 137, 4, 'https://nz.trustpilot.com/review/verasmile.com')},
 {'id': 'dci-antalya', 'naam': 'DCI Dental Center International', 'stad': 'Antalya', 'site': '', 'artsen': [],
  'reviews': TP(4.7, 159, 5, 'https://ca.trustpilot.com/review/dcidentalclinic.com')},
 {'id': 'ozdemir-dental', 'naam': 'Özdemir Dental Center', 'stad': 'Antalya', 'site': '', 'artsen': [],
  'reviews': TP(4.9, 300, 0, 'https://ca.trustpilot.com/review/ozdemirdentalcenter.com')},
 {'id': 'medicaldental-tr', 'naam': 'Medical Dental Turkey', 'stad': 'Antalya', 'site': '', 'artsen': [],
  'reviews': TP(4.9, 253, 0, 'https://www.trustpilot.com/review/medicaldentalturkey.com')},
 {'id': 'antalyasmile', 'naam': 'Antalya Smile Dental', 'stad': 'Antalya', 'site': '', 'artsen': [],
  'reviews': TP(4.8, 386, 2, 'https://www.trustpilot.com/review/antalyasmiledesigns.com')},
 {'id': 'dentadavista', 'naam': 'Dent Adavista', 'stad': 'Kuşadası', 'site': '', 'artsen': [],
  'reviews': TP(4.9, 126, 0, 'https://ca.trustpilot.com/review/dentadavista.com')},
 {'id': 'drsmile-antalya', 'naam': 'Dr Smile Antalya', 'stad': 'Antalya', 'site': '', 'artsen': [],
  'reviews': TP(4.9, 120, 0, 'https://uk.trustpilot.com/review/drsmileantalya.com')},
 {'id': 'naturalclinic-tr', 'naam': 'Natural Clinic Istanbul', 'stad': 'Istanbul', 'site': '', 'artsen': [],
  'reviews': tpw(1132, 17, 'https://uk.trustpilot.com/review/natural.clinic')},
 {'id': 'smileteam-tr', 'naam': 'Smile Team Turkey', 'stad': 'Antalya', 'site': '', 'artsen': [],
  'reviews': tpw(727, 0, 'https://ca.trustpilot.com/review/smileteamturkey.com'), 'vermeld': [EXP1]},
 {'id': 'dentaldesign-tr', 'naam': 'Dental Design Turkey', 'stad': 'Antalya', 'site': '', 'artsen': [],
  'reviews': tpw(526, 0, 'https://www.trustpilot.com/review/dentaldesignturkey.com')},
 {'id': 'serinsey', 'naam': 'Serinsey Smile', 'stad': 'Istanbul', 'site': '', 'artsen': [],
  'reviews': tpw(199, 9, 'https://uk.trustpilot.com/review/serinsey.com')},
 {'id': 'dentalcentre-tr', 'naam': 'Dental Centre Turkey', 'stad': 'Antalya', 'site': 'https://dentalcentreturkey.com/', 'artsen': [], 'reviews': [],
  'vermeld': [MUMS],
  'openheid': {'prijs': 'Implantaat met abutment: Osstem GBP 476 tot 529, Nobel GBP 593 tot 659, Straumann GBP 692 tot 769 (twee bedragen per regel zonder uitleg). All-on-4 Nobel Biocare per kaak GBP 2.699 tot 2.999.', 'prijs_bron': 'https://dentalcentreturkey.com/dental-treatment-prices-in-turkey',
               'garantie': 'Levenslang tegen breuk van de implantaatschroef; vervalt bij botverlies, terugtrekkend tandvlees, migratie van het implantaat en afstoting van een bottransplantaat; reis en verblijf voor herstel betaalt de patiënt.', 'garantie_bron': 'https://dentalcentreturkey.com/guarantee', 'nazorg_status': 'verified', 'nazorg_bron': 'https://dentalcentreturkey.com/guarantee'}},
 {'id': 'esnan', 'naam': 'Esnan Dental Clinics', 'stad': 'Istanbul', 'site': '', 'artsen': [], 'reviews': [], 'vermeld': [MUMS, EXP1]},
 {'id': 'towerdental', 'naam': 'Tower Dental Clinic', 'stad': 'Istanbul', 'site': '', 'artsen': [], 'reviews': [], 'vermeld': [REUT]},
 {'id': 'dentroyal', 'naam': 'Dent Royal', 'stad': 'İzmir', 'site': '', 'artsen': [], 'reviews': [], 'vermeld': [REUT]},
 {'id': 'dentasey', 'naam': 'Dentasey Dental Care', 'stad': 'Kuşadası', 'site': 'https://www.dentalcarekusadasi.com', 'artsen': [], 'reviews': [], 'vermeld': [EXP3, EXP2]},
]
out = []
for c in C:
  out.append({'id': c['id'], 'naam': c['naam'], 'stad': c['stad'], 'site': c['site'], 'artsen': c['artsen'], 'signalen': c.get('signalen', {}),
              'reviews': c['reviews'], 'vermeld': c.get('vermeld', []), 'openheid': c.get('openheid', {}), 'risico': c.get('risico', [])})
L = {'id': 'dental-turkey', 'land': 'TR', 'ingreep': 'dental-implants', 'comparison_title': {'en': 'Dental implants Turkey', 'nl': 'Tandimplantaten Turkije', 'de': 'Zahnimplantate Türkei'}, 'naar': 'turkey', 'methode': 'tand',
     'gecontroleerd': DAG, 'gepubliceerd': DAG,
     'slugs': {'en': 'best-dental-implant-clinics-turkey', 'nl': 'nl/beste-tandimplantaten-klinieken-turkije', 'de': 'de/beste-zahnimplantate-kliniken-tuerkei'},
     'klinieken': out,
     'niet_gerangschikt': [
       {'naam': 'Smile Center Turkey (Antalya)', 'reden': 'not ranked: Trustpilot says the company website was shut down and no new reviews can be left (905 reviews)', 'bron': 'https://se.trustpilot.com/review/smilecenterturkey.co'},
       {'naam': 'Phinova Clinic / CevreDent (Istanbul)', 'reden': 'not ranked: the Trustpilot profile (678 reviews) is named Phinova but describes CevreDent, so we cannot tell which clinic the reviews are about', 'bron': 'https://uk.trustpilot.com/review/arpanumedical.com'}]}
try:
  T = json.load(open(D + 'dental-turkey-teksten.json'))
  L['tekst'] = T['tekst']
  for k in out:
    if k['id'] in T['conclusie']: k['conclusie'] = T['conclusie'][k['id']]
except FileNotFoundError:
  L['tekst'] = {t: {'title': 'x', 'h1': 'x', 'desc': 'x', 'kort': 'x', 'faq': []} for t in ('en', 'nl', 'de')}
json.dump(L, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
print(len(out))
