# Voegt de ruwe data van vier onderzoekers (16 nov 2026) samen tot de lijst plastic-colombia. Draai: python3 plastic-colombia-merge.py <map met de ruwe json> <uit.json>
# Keuzes: Google-cijfers kwamen alleen via colombiahealthcare.com (een gids waar klinieken betaalde plaatsingen kopen) en Trustindex (widget die de kliniek kiest):
# die tellen niet. Wel RealSelf (per kliniek alleen het grootste profiel), Doctoralia en Top Doctors. SCCP-lidmaatschap telt als 'board' (alleen voor wie we
# zelf op cirugiaplastica.org.co zagen), ASPS-lidmaatschap alleen uit find.plasticsurgery.org of plasticsurgery.org, ISAPS alleen van isaps.org.
import json, re, sys
D = sys.argv[1].rstrip('/') + '/'
K = json.load(open(D+'plastic-colombia-kandidaten.json'))['klinieken']; R = json.load(open(D+'plastic-colombia-reviews.json'))['klinieken']
O = json.load(open(D+'plastic-colombia-openheid.json'))['klinieken']; G = json.load(open(D+'plastic-colombia-registers.json'))
def by(lst, sub, veld='naam'): return next((x for x in lst if sub and sub.lower() in x.get(veld, '').lower()), None) if sub else None
url = lambda s: (s or '').split(' ')[0].rstrip(';')
def reg(arts, kk):
  p = by(G['per_kandidaat'], arts, 'arts') or {}
  sig = {'chirurg': p.get('arts', arts)}
  if p.get('sccp') == 'ja': sig.update(board=True, board_bron=url(p['sccp_bron']))
  if p.get('asps') == 'ja': sig.update(asps=True, asps_bron=url(p['asps_bron']))
  else:
    a = [v['url'] for v in (kk or {}).get('vermeld_in', []) if v['soort'] == 'asps' and ('plasticsurgery.org' in v['url'])]
    if a: sig.update(asps=True, asps_bron=a[0])
  if p.get('isaps') == 'ja': sig.update(isaps=True, isaps_bron=url(p['isaps_bron']))
  return sig
TELT = ('RealSelf', 'Doctoralia', 'Top Doctors')
def scope(u): return 'doctor' if ('/dr/' in u or 'doctoralia.co/' in u and '/clinicas/' not in u or '/doctor/' in u) else 'organization'
def reviews(sub):
  # alle profielen met score en aantal; scope zegt of het een arts- of praktijkprofiel is (lib/tsc-reviewrank.js telt per scope en per platform maar één)
  r = by(R, sub)
  if not r: return []
  ps = [p for p in r['platforms'] if not p.get('makelaar') and p.get('score') is not None and p.get('aantal') and p['platform'].startswith(TELT)]
  return [{'platform': p['platform'].split(' (')[0].replace(' Colombia', ''), 'score': p['score'], 'max': 5, 'aantal': int(p['aantal']), 'scope': scope(p['bron']), 'pct_1ster': None, 'waarschuwing': '', 'bron': p['bron'], 'datum': p.get('gezien', '2026-11-16'), 'laatste': p.get('laatste_review') or ''} for p in ps]
def vermeld(kk, extra=()):
  # alleen onafhankelijk nieuws en forums; promotionele stukken (El Tiempo 'carrusel', colombia.com 'sdi', IMCAS-profiel) en persberichten tellen niet
  slecht = ('carrusel', '/sdi/', 'imcas.com', 'newswire')
  return [v['url'] for v in (kk or {}).get('vermeld_in', []) if v['soort'] in ('forum', 'nieuws') and not any(s in v['url'] for s in slecht)][:4]
def openheid(sub, ao):
  o = by(O, sub)
  if not o: return {}
  pr = o['prijs']; w = o['wie_opereert']
  pub = bool(pr.get('bedrag')) and not re.match(r'(niet|geen|operatieprijs niet)', pr.get('bedrag', ''), re.I)
  return {'prijs': pr['bedrag'] if pub else '', 'prijs_bron': pr.get('bron', ''), 'arts_opereert': ao, 'arts_bron': w.get('bron', ''), 'garantie': '', 'garantie_bron': o['nazorg'].get('bron', '')}
def risico(sub):
  # Alan González: El Tiempo (14 dec 2022) noemt een 'Alan Albeiro González' zonder kliniek of stad; niet aantoonbaar dezelfde chirurg, dus niet meegeteld
  o = by(O, sub)
  return [{'wat': x['wat'], 'datum': x['datum'], 'bron': x['bron'], 'ernst': x['ernst']} for x in (o or {}).get('risico', []) if 'Albeiro' not in x['wat']]
# id, naam, stad, sleutel kandidaten, sleutel reviews, sleutel openheid, arts (registers), arts_opereert ('ja' expliciet zelf, 'deels' chirurg bij naam, '' niet gezegd wie opereert)
C = [
 ('premiumcare', 'Premium Care Plastic Surgery (Dr. Alex Campbell, Dr. Carolina Restrepo)', 'Cartagena', 'Premium Care', 'Premium Care', 'Premium Care Plastic Surgery (Alex Campbell)', 'Alex Campbell', 'deels'),
 ('gonzalez', 'Dr. Alan González (Vitalum IPS)', 'Bogotá, Barranquilla, Cali', 'Alan Gonzalez', 'Alan González', 'Alan González', 'Alan Gonzalez', 'ja'),
 ('amaya', 'AmayaClinic (Dr. Felipe Amaya)', 'Bogotá', 'Amaya', 'Amaya', 'Amaya', 'Felipe Amaya', 'deels'),
 ('pavajeau', 'Ciencia y Estética (Dr. Luis Pavajeau)', 'Bogotá', 'Pavajeau', 'Pavajeau', 'Pavajeau', 'Luis Pavajeau', 'ja'),
 ('plazas', 'Dr. Luis Eduardo Plazas', 'Cali', 'Plazas', 'Plazas', None, 'Plazas', ''),
 ('mejia', 'Dr. Juan Diego Mejía', 'Medellín', 'Juan Diego', 'Juan Diego', 'Juan Diego', 'Juan Diego Mejia', ''),
 ('villalobos', 'Dr. Harold Villalobos', 'Cali', 'Villalobos', 'Villalobos', 'Villalobos', 'Villalobos', 'deels'),
 ('triana', 'Corpus & Rostrum (Dr. Lina Triana)', 'Cali', 'Triana', 'Triana', 'Triana', 'Triana', 'ja'),
 ('garcia', 'Dr. Héctor García', 'Medellín', 'Hector Garcia', 'Héctor García', 'Héctor García', 'Hector Garcia', ''),
 ('rios', 'Centro Médico Santuario (Dr. Carlos Alberto Ríos)', 'Cali', 'Santuario', 'Santuario', 'Santuario', 'Carlos Alberto Rios', 'deels'),
 ('rodriguez', 'Dr. Lina Rodríguez', 'Barranquilla', 'Lina Rodriguez', 'Lina Rodríguez', 'Lina Rodríguez', 'Lina Rodriguez', 'ja'),
 ('hoyos', 'Total Definer (Dr. Alfredo Hoyos)', 'Bogotá', 'Hoyos', 'Hoyos', 'Hoyos', 'Hoyos', 'deels'),
 ('gomez', 'Dr. Carlos Gómez', 'Cali', 'Carlos Gomez', 'Dr. Carlos Gómez', 'Carlos Gómez', 'Carlos Gomez', ''),
 ('soto', 'Sublime Plastic Surgery (Dr. Javier Soto)', 'Cartagena', 'Sublime', 'Javier Soto', 'Sublime', 'Javier Soto', ''),
 ('correa', 'Dr. Fulvio Correa', 'Cartagena', 'Fulvio', 'Fulvio', 'Fulvio', 'Fulvio Correa', 'ja'),
 ('diazpaz', 'Dr. Andrés Díaz Paz', 'Cali', 'Diaz Paz', 'Díaz Paz', 'Díaz Paz', 'Diaz Paz', 'deels'),
 ('henao', 'Dr. Alder James Henao Bonilla', 'Cali', 'Henao', 'Henao', None, 'Henao', ''),
 ('recio', 'Dr. Carlos Recio', 'Cali', 'Recio', 'Recio', 'Recio', 'Recio', 'ja'),
 ('oswaldo', 'Dr. Oswaldo Gómez Díaz', 'Bogotá', 'Oswaldo', 'Oswaldo', 'Oswaldo', 'Oswaldo', 'deels'),
 ('guarin', 'Dr. David Guarín', 'Cali', 'Guarin', 'Guarín', None, 'Guarin', ''),
 ('orlas', 'Dr. John Orlas Blair', 'Medellín', 'Orlas', 'Orlas', 'Orlas', 'Orlas', 'deels'),
 ('betancur', 'Dr. Carlos Betancur', 'Medellín', 'Betancur', 'Betancur', 'Betancur', 'Betancur', 'deels'),
 ('puello', 'Dr. Jorge Puello White', 'Bogotá, Cartagena', 'Puello', None, 'Puello', 'Puello', ''),
 ('cardenas', 'Dr. Yesid Cárdenas', 'Medellín', 'Cardenas', 'Cárdenas', None, 'Cardenas', ''),
 ('paez', 'Dr. Zamir Páez', 'Medellín', 'Zamir', 'Páez', None, 'Paez', ''),
]
out = []
for id, naam, stad, ks, rk, ok, arts, ao in C:
  kk = by(K, ks); r = by(R, rk); o = by(O, ok)
  assert kk or r or o, id
  site = (o or {}).get('site') or (kk or {}).get('site') or ''
  if id == 'garcia': site = ''  # site noemt Bucaramanga, RealSelf Medellín: niet zeker dezelfde praktijk
  artsen = [{'naam': a['naam'], 'titel': a.get('titel', 'MD'), 'bron': a.get('bron', '')} for a in (kk or {}).get('chirurgen', [])][:3]
  rv = reviews(rk)
  for a in artsen:  # bron van de naam = het RealSelf-artsprofiel als dat er is, zodat de artsenranking de juiste reviews koppelt
    ln = a['naam'].split()[-1].lower().replace('í', 'i').replace('é', 'e')
    dr = [x['bron'] for x in rv if '/dr/' in x['bron'] and ln in x['bron']]
    if dr: a['bron'] = dr[0]
  out.append({'id': id, 'naam': naam, 'stad': stad, 'site': site, 'artsen': artsen, 'signalen': reg(arts, kk), 'reviews': rv, 'vermeld': vermeld(kk), 'openheid': openheid(ok, ao), 'risico': risico(ok)})
L = {'id': 'plastic-colombia', 'land': 'CO', 'ingreep': 'bbl', 'comparison_title': {'en': 'Plastic surgery Colombia', 'nl': 'Plastische chirurgie Colombia', 'de': 'Schönheitschirurgie Kolumbien'}, 'naar': 'colombia', 'methode': 'plastisch',
     'registers': {'board': 'SCCP', 'vereniging': '', 'regionaal': '', 'acc': 'ICONTEC (Acreditación en Salud)',
       'boardTekst': {'en': 'member of SCCP, the Colombian plastic surgery society, which admits only plastic surgeons with a recognised specialist training', 'nl': 'lid van SCCP, de Colombiaanse vereniging voor plastische chirurgie, die alleen plastisch chirurgen met een erkende specialistenopleiding toelaat', 'de': 'Mitglied der SCCP, der kolumbianischen Gesellschaft für plastische Chirurgie, die nur plastische Chirurgen mit anerkannter Facharztausbildung aufnimmt'},
       'boardKort': {'en': 'verified SCCP membership', 'nl': 'bewezen lidmaatschap van SCCP', 'de': 'belegter SCCP-Mitgliedschaft'}},
     'gecontroleerd': '2026-11-16', 'gepubliceerd': '2026-11-16',
     'slugs': {'en': 'best-plastic-surgeons-colombia', 'nl': 'nl/beste-plastisch-chirurgen-colombia', 'de': 'de/beste-schoenheitschirurgen-kolumbien'},
     'klinieken': out,
     'niet_gerangschikt': [
       {'naam': 'Clínica Láser Surgical (Bogotá)', 'reden': 'not ranked: the health supervisor Supersalud closed its plastic surgery service in June 2026', 'bron': 'https://lakalle.bluradio.com/noticias/bogota/clausuran-una-de-las-clinicas-esteticas-mas-famosas-de-bogota-su-dueno-enfrenta-denuncias-rg10'},
       {'naam': 'Clínica de Obesidad y Envejecimiento (Bogotá)', 'reden': 'not ranked: Supersalud temporarily closed its plastic surgery service in May 2026 for operating without a licence', 'bron': 'https://www.vanguardia.com/colombia/2026/05/30/supersalud-ordena-cierre-temporal-a-clinica-de-cirugia-plastica-en-bogota/'}]}
T = json.load(open(D + 'plastic-colombia-teksten.json'))
L['tekst'] = T['tekst']
for k in out:
  if k['id'] in T['conclusie']: k['conclusie'] = T['conclusie'][k['id']]
json.dump(L, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
print(len(out))
