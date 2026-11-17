# Voegt de ruwe data van vier onderzoekers (17 nov 2026) samen tot de lijst bbl-dr. Draai: python3 bbl-dr-merge.py <map met de ruwe json> <uit.json>
# Keuzes: reviews alleen RealSelf (per arts het /dr/-profiel); Doctoralia, Top Doctors, Trustpilot en Yelp hadden voor geen kandidaat een profiel,
# WhatClinic en Bookimed zijn bemiddelaars en tellen niet. Alleen 'Account Suspended' is een platformwaarschuwing; 'neemt geen consulten aan via RealSelf',
# afwijkende tellingen en de AI-samenvatting van RealSelf zijn dat niet. SODOCIPRE telt als 'board' (naam zelf gezien in de ledenlijst op sodocipre.net,
# 308 namen), ASPS alleen van find.plasticsurgery.org of plasticsurgery.org, ISAPS alleen van isaps.org. Eigen sites waren niet te lezen: openheid is leeg.
import json, sys
D = sys.argv[1].rstrip('/') + '/'
K = json.load(open(D+'bbl-dr-kandidaten.json'))['klinieken']; R = json.load(open(D+'bbl-dr-reviews.json'))['klinieken']
O = json.load(open(D+'bbl-dr-openheid.json'))['klinieken']; G = json.load(open(D+'bbl-dr-registers.json'))['per_kandidaat']
def by(lst, sub, veld='naam'): return next((x for x in lst if sub and sub.lower() in x.get(veld, '').lower()), None) if sub else None
url = lambda s: (s or '').split(' ; ')[0].split(' | ')[0].strip().replace(' ', '%20')
def reg(sub, naam):
  p = by(G, sub, 'arts') or {}
  sig = {'chirurg': naam}
  if p.get('sodocipre') == 'ja': sig.update(board=True, board_bron=url(p['sodocipre_bron']))
  if p.get('asps') == 'ja': sig.update(asps=True, asps_bron=url(p['asps_bron']))
  if p.get('isaps') == 'ja': sig.update(isaps=True, isaps_bron=url(p['isaps_bron']))
  return sig
def reviews(sub):
  r = by(R, sub)
  out = []
  for p in (r or {}).get('platforms', []):
    if p.get('makelaar') or p.get('score') is None or not p.get('aantal') or not p['platform'].startswith('RealSelf') or '/dr/' not in p['bron']: continue
    w = 'account suspended on RealSelf' if 'Account Suspended' in (p.get('waarschuwing') or '') else ''
    out.append({'platform': 'RealSelf', 'score': p['score'], 'max': 5, 'aantal': int(p['aantal']), 'scope': 'doctor', 'pct_1ster': None, 'waarschuwing': w, 'bron': p['bron'], 'datum': p.get('gezien', '2026-11-17'), 'laatste': p.get('laatste_review') or ''})
  return out
# alleen onafhankelijk nieuws dat de arts zelf noemt; elDigital (promotionele toon) en Excelsior (alleen titel gezien) tellen niet
VERMELD = {'mallol': ['https://eldia.com.do/hay-que-disminuir-los-riesgos-cirugia-plastica/'],
           'giudicelli': ['https://elnuevodiario.com.do/cirujanos-plasticos-saludan-medidas-del-ministerio-salud-publica/']}
RISICO = {'pizzoglio': [{'wat': 'A court in Santo Domingo ordered the surgeon and the CECIP clinic together to pay a patient from Puerto Rico RD$5.86 million in damages for breaching the surgical protocol in a 2022 operation; no criminal conviction.', 'datum': '2023-08-02', 'bron': 'https://diariolibre.com/actualidad/justicia/2023/08/02/mujer-lesionada-durante-liposuccion-recibira-rd58-millones/2421519', 'ernst': 'middel'}]}
# ids diaz-do en mejia-do: diaz en mejia bestaan al in plastic-colombia (procedurepagina's voegen lijsten samen)
# id, naam, stad, sleutel reviews, sleutel registers, sleutel kandidaten
C = [
 ('yily', 'Dr. Yily De Los Santos', 'Santo Domingo', 'Yily', 'Yily', 'Yily'),
 ('hilario', 'Dr. Agustina Hilario Duran', 'Santo Domingo', 'Hilario', 'Hilario', None),
 ('mallol', 'Dr. Emmanuel Mallol Cotes', 'Santo Domingo', 'Mallol', 'Mallol', 'Mallol'),
 ('robles', 'Dr. Walkiris Robles', 'Santo Domingo', 'Walkiris', 'Walkiris', 'Walkiris'),
 ('medina', 'Dr. Tania Medina de Garcia', 'Santo Domingo', 'Tania Medina', 'Tania Medina', 'Tania Medina'),
 ('fragoso', 'Dr. Australia Fragoso-Baez', 'Santo Domingo', 'Fragoso', 'Fragoso', None),
 ('ulerio', 'Dr. Jairo Ulerio', 'Santo Domingo', 'Ulerio', 'Ulerio', 'Ulerio'),
 ('sang', 'Dr. Derby Sang Caputo', 'Santo Domingo', 'Derby Sang', 'Derby Sang', 'Derby Sang'),
 ('pizzoglio', 'Dr. Alejandro Hernández Pizzoglio (CECIP)', 'Santo Domingo', 'Pizzoglio', 'Pizzoglio', 'Pizzoglio'),
 ('diaz-do', 'Dr. Manuel Díaz', 'Santo Domingo', 'Manuel Diaz', 'Manuel Diaz', 'Manuel Diaz'),
 ('mejia-do', 'Dr. Luis A. Mejía (CECILIP)', 'Santo Domingo', 'Luis A. Mejia', 'Luis A. Mejia', 'Luis A. Mejia'),
 ('almanzar', 'Dr. Gustavo Almánzar (NUDAH Clinic)', 'Santo Domingo', 'Gustavo Almanzar', 'Gustavo Almanzar', 'Gustavo Almanzar'),
 ('mota', 'Dr. Miguel Mota', 'Santo Domingo', 'Miguel Mota', 'Miguel Mota', 'Miguel Mota'),
 ('leon', 'Dr. José León', 'Santo Domingo', 'Jose Leon', 'Jose Leon', 'Jose Leon'),
 ('tactuk', 'Cirugía Plástica del Caribe (Dr. Luis Tactuk Simó)', 'Santo Domingo', 'Tactuk', 'Tactuk', 'Tactuk'),
 ('disla', 'Dr. Cynthia Disla', 'Santo Domingo', 'Disla', 'Disla', None),
 ('giudicelli', 'Dr. Jean Paul Giudicelli Saba (CECIP)', 'Santo Domingo', 'Giudicelli', 'Giudicelli', 'Giudicelli'),
 ('rodrigueztavarez', 'Dr. Alexandrish Rodríguez Tavárez (CECILIP)', 'Santo Domingo', 'Alexandrish', 'Alexandrish', 'Alexandrish'),
 ('guzman', 'Dr. Massiel Guzmán Reyes (Plastimedic)', 'Santo Domingo', 'Massiel', 'Massiel', 'Massiel'),
 ('sesto', 'Dr. Adolfo Sesto', 'Santo Domingo', 'Sesto', 'Sesto', 'Sesto'),
 ('eusebio', 'Dr. Kelvin Eusebio', 'Santo Domingo', 'Eusebio', 'Eusebio', 'Eusebio'),
 ('rosario', 'Dr. Francisco Rodríguez Rosario', 'Santo Domingo', 'Rodriguez Rosario', 'Rodriguez Rosario', None),
 ('cruz', 'Dr. Geuris Cruz Quiroz (CECIP)', 'Santo Domingo', 'Geuris', 'Geuris', 'Geuris'),
 ('ventura', 'Dr. Ricardo Ventura', 'Santo Domingo', 'Ventura', 'Ventura', None),
 ('estevez', 'Dr. Rafael E. Estévez Hernández', 'Santo Domingo', 'Estevez', 'Estevez', None),
 ('lopezcollado', 'Dr. Carlos López Collado', 'Santo Domingo', 'Lopez Collado', 'Lopez Collado', None),
 ('rubio', 'Dr. Nelson Rubio', 'Santiago', 'Rubio', 'Rubio', 'Rubio'),
 ('hungria', 'Dr. José Hungría', 'Santo Domingo', 'Hungria', 'Hungria', None),
 ('espinal', 'Dr. Pedro Espinal', 'Santo Domingo', 'Espinal', 'Espinal', None),
 ('redondo', 'Dr. Luis E. Redondo', 'Puerto Plata', 'Redondo', 'Redondo', 'Redondo'),
 ('acosta', 'Dr. José Luis Acosta Collado', 'Santo Domingo', 'Acosta Collado', 'Acosta Collado', None),
 ('escobar', 'Dr. Rodrigo Escobar Jaramillo', 'Santiago', 'Escobar', 'Escobar', 'Escobar'),
 ('baez', 'Dr. Javier Báez Anglés', 'Santiago', 'Baez Angles', 'Baez Angles', None),
]
out = []
for id, naam, stad, rk, gk, kk in C:
  r = by(R, rk); k = by(K, kk) or {}
  assert r, id
  rv = reviews(rk); assert rv, id
  arts = naam.split(' (')[0].replace('Cirugía Plástica del Caribe', 'Dr. Luis Tactuk Simó')
  site = k.get('site') or ''
  out.append({'id': id, 'naam': naam, 'stad': stad, 'site': site, 'artsen': [{'naam': arts.replace('Dr. ', ''), 'titel': 'MD', 'bron': rv[0]['bron']}],
              'signalen': reg(gk, arts.replace('Dr. ', '')), 'reviews': rv, 'vermeld': VERMELD.get(id, []), 'openheid': {}, 'risico': RISICO.get(id, [])})
L = {'id': 'bbl-dr', 'land': 'DO', 'ingreep': 'bbl', 'comparison_title': {'en': 'BBL and tummy tuck Dominican Republic', 'nl': 'BBL en buikwandcorrectie Dom. Republiek', 'de': 'BBL und Bauchstraffung Dom. Republik'}, 'naar': 'dominican-republic', 'methode': 'plastisch',
     'registers': {'board': 'SODOCIPRE', 'vereniging': '', 'regionaal': '', 'acc': 'MISPAS (habilitación)',
       'boardTekst': {'en': 'listed as a member of SODOCIPRE, the Dominican plastic surgery society that the health ministry and the press point to for checking a plastic surgeon', 'nl': 'staat in de ledenlijst van SODOCIPRE, de Dominicaanse vereniging voor plastische chirurgie waar het ministerie en de pers naar verwijzen om een plastisch chirurg na te kijken', 'de': 'steht in der Mitgliederliste der SODOCIPRE, der dominikanischen Gesellschaft für plastische Chirurgie, auf die Ministerium und Presse zur Prüfung eines plastischen Chirurgen verweisen'},
       'boardKort': {'en': 'listing in the SODOCIPRE member list', 'nl': 'vermelding in de ledenlijst van SODOCIPRE', 'de': 'Eintrag in der SODOCIPRE-Mitgliederliste'}},
     'gecontroleerd': '2026-11-17', 'gepubliceerd': '2026-11-17',
     'slugs': {'en': 'best-bbl-tummy-tuck-surgeons-dominican-republic', 'nl': 'nl/beste-bbl-buikwandcorrectie-chirurgen-dominicaanse-republiek', 'de': 'de/beste-bbl-bauchdeckenstraffung-chirurgen-dominikanische-republik'},
     'klinieken': out,
     'niet_gerangschikt': [
       {'naam': 'CIPLA, Centro Internacional de Cirugía Plástica Avanzada (Santo Domingo)', 'reden': 'not ranked: the health ministry closed it temporarily in July 2017 after a CDC report of infections, and again in May 2019 after a patient died', 'bron': 'https://www.diariolibre.com/actualidad/salud/las-clinicas-de-esteticas-cerradas-en-2019-por-muerte-de-pacientes-e-irregularidades-HM15808582'},
       {'naam': 'Clideme (Santo Domingo)', 'reden': 'not ranked: the health ministry closed its operating rooms in April 2026 after a patient died; it had also been closed in February 2019 for operating without a licence', 'bron': 'https://zolfm.com/noticia/salud-clausura-quirofanos-de-clinica-tras-muerte-de-paciente'}]}
T = json.load(open(D + 'bbl-dr-teksten.json'))
L['tekst'] = T['tekst']
for k in out:
  if k['id'] in T['conclusie']: k['conclusie'] = T['conclusie'][k['id']]
json.dump(L, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
print(len(out))
