# Voegt de ruwe data van vier onderzoekers (15 nov 2026) samen tot de lijst tummy-mexico. Draai: python3 tummy-mexico-merge.py <map met de ruwe json> <uit.json>
import json, re, sys, urllib.parse
D = sys.argv[1].rstrip('/') + '/'
K = json.load(open(D+'tummy-mexico-kandidaten.json'))['klinieken']; R = json.load(open(D+'tummy-mexico-reviews.json'))['klinieken']
O = json.load(open(D+'tummy-mexico-openheid.json'))['klinieken']; G = json.load(open(D+'tummy-mexico-registers.json'))
def by(lst, sub, veld='naam'): return next((x for x in lst if sub.lower() in x[veld].lower()), None)
def reg(arts):
  p = by(G['per_kandidaat'], arts, 'arts') or {}
  sig = {'chirurg': p.get('arts', '')}
  if p.get('cmcper') == 'ja': sig.update(board=True, board_bron=p['cmcper_bron'])          # 'waarschijnlijk' telt niet
  if p.get('amcper') == 'ja' and 'aangenomen' not in p.get('amcper_naam', ''): sig.update(vereniging=True, vereniging_bron=p['amcper_bron']) # 'ja (aangenomen ...)' telt niet
  if p.get('colegio_bc') == 'ja': sig.update(regionaal=True, regionaal_bron=p['colegio_bc_bron'])
  if p.get('asps') == 'ja' and 'photo-gallery' not in p.get('asps_bron', ''): sig.update(asps=True, asps_bron=p['asps_bron'])
  if p.get('isaps') == 'ja': sig.update(isaps=True, isaps_bron=p['isaps_bron'])
  return sig
def reviews(sub):
  # alleen onafhankelijke platforms met score; geen bemiddelaars; per kliniek alleen het grootste RealSelf-profiel (praktijk of arts), zodat niets dubbel telt
  r = by(R, sub)
  if not r: return []
  ps = [p for p in r['platforms'] if not p.get('makelaar') and p.get('score') is not None and p.get('aantal')]
  rs = [p for p in ps if p['platform'].startswith('RealSelf')]; rest = [p for p in ps if not p['platform'].startswith('RealSelf')]
  if rs: rs = [max(rs, key=lambda p: p['aantal'])]
  return [{'platform': 'RealSelf' if p['platform'].startswith('RealSelf') else p['platform'], 'score': p['score'], 'aantal': int(p['aantal']), 'pct_1ster': p.get('pct_1ster'), 'waarschuwing': '', 'bron': p['bron'], 'datum': p.get('gezien', '2026-11-15'), 'laatste': p.get('laatste_review', '')} for p in rs + rest]
def vermeld(sub):
  k = by(K, sub)
  return [v['url'] for v in (k or {}).get('vermeld_in', []) if v['soort'] in ('forum', 'nieuws') and 'complaintsboard' not in v['url']][:4]
def openheid(sub, arts):
  o = by(O, sub)
  if not o: return {}
  pr = o['prijs']; w = o['wie_opereert']; n = o['nazorg']
  pub = bool(pr.get('bedrag')) and not re.match(r'(niet|geen)', pr.get('bedrag', ''), re.I)
  return {'prijs': pr['bedrag'] if pub else '', 'prijs_bron': pr.get('bron', ''), 'arts_opereert': arts, 'arts_tekst': w.get('tekst', '') if arts else '', 'arts_bron': w.get('bron', ''),
          'garantie': n.get('tekst', '') if n.get('garantie') else '', 'garantie_bron': n.get('bron', '')}
def risico(sub):
  o = by(O, sub)
  return [{'wat': x['wat'], 'datum': x['datum'], 'bron': x['bron'], 'ernst': x['ernst']} for x in (o or {}).get('risico', [])]
# arts_opereert: 'ja' = de tummy tuck-pagina zegt dat de genoemde chirurg de stappen zelf doet; 'deels' = noemt de chirurg, niet dat hij zelf opereert; '' = geen chirurg bij naam of geen site
C = [  # id, naam, kandidaat-sleutel, hoofdchirurg (registers), arts_opereert
 ('lazos', 'Dr. Omar Lazos', 'Omar Lazos', 'Omar Lazos', ''),
 ('cardenas', 'Dr. Carmina Cárdenas', 'Carmina', 'Carmina Cardenas', ''),
 ('pantoja', 'Health & Beauty (Dr. Salvador Pantoja)', 'Pantoja', 'Salvador Pantoja', 'deels'),
 ('vida', 'VIDA Wellness and Beauty / Cosmed Clinic', 'VIDA', 'Alejandro J. Quiroz', ''),
 ('balza', 'Dr. Isabel Balza Mirabal', 'Balza', 'Balza', 'deels'),
 ('vega', 'Vemont Plastic Surgery (Dr. Ricardo Vega)', 'Vemont', 'Ricardo Vega', 'ja'),
 ('camberos', 'PLASTIKS (Dr. Rafael Camberos)', 'PLASTIKS', 'Camberos', 'deels'),
 ('marciales', 'Marciales Plastic Surgery (Dr. Carlos Marciales)', 'Marciales', 'Marciales', 'ja'),
 ('cervantes', 'Cervantes & Aragon Plastic Surgery Group', 'Cervantes', 'Juan Pablo Cervantes', ''),
 ('guerrero', 'Guerrero Plastic Surgery (Dr. Luis Eduardo Guerrero)', 'Guerrero', 'Luis Eduardo Guerrero', 'deels'),
 ('leyva', 'Dr. Nicolás Leyva', 'Leyva', 'Nicolas Leyva', 'deels'),
 ('ochoa', 'Dr. Eduardo Ochoa (EOC)', 'Ochoa', 'Eduardo Ochoa', ''),
 ('mcc', 'Mexico Cosmetic Center', 'Mexico Cosmetic', 'Jorge Chang', ''),
 ('moran', 'Moran Plastic Surgery (Dr. Mario Morán)', 'Moran', 'Moran Romero', 'ja'),
 ('sigler', 'Dr. Alicia Sigler', 'Sigler', 'Alicia Sigler', 'deels'),
 ('lara', 'Doctor Lara Plastic Surgery (Dr. Alberto Lara)', 'Lara', 'Lara Jimenez', 'deels'),
 ('rios', 'Dr. Andrei Ríos', 'Andrei', 'Andrei Rios', ''),
 ('najar', 'Dr. Tania Najar', 'Najar', 'Tania Najar', ''),
 ('caloca', 'Dr. Jaime Caloca Jr.', 'Caloca', 'Caloca', ''),
 ('mpsg', 'Mexico Plastic Surgery Group (mexicotummytuck.com)', 'Mexico Plastic Surgery Group', 'Chama', ''),
 ('diaz', 'Dr. Diaz Plastic Surgery (Dr. Jorge L. Díaz)', 'Diaz Plastic', 'Diaz Martinez', 'deels'),
 ('vive', 'Vive Plastic Surgery', 'Vive', 'Marquez Villalobos', ''),
 ('ciplastic', 'Ciplastic', 'Ciplastic', 'Avila Pelayo', ''),
 ('mybestbody', 'MyBestBodyEver! (Dr. Rodolfo Castillo)', 'MyBestBody', 'Castillo Calderon', 'ja'),
 ('gutierrez', 'Cosmetic & Bariatric Surgery Center (Dr. Manuel Gutiérrez)', 'Cosmetic & Bariatric', 'Gutierrez Romero', 'deels'),
 ('munoz', 'Dr. Arturo Muñoz Meza', 'Munoz', 'Munoz Meza', ''),
 ('uribe', 'Dr. Víctor Gutiérrez Uribe', 'Gutierrez Uribe', 'Gutierrez Uribe', ''),
]
out = []
for id, naam, ks, arts, ao in C:
  k = by(K, ks); assert k, ks
  site = (k.get('site') or '').split(' ')[0]
  if site and not site.startswith('http'): site = 'https://' + site
  artsen = [{'naam': a['naam'], 'titel': a.get('titel', ''), 'bron': a.get('bron', '')} for a in k.get('chirurgen', [])][:3]
  out.append({'id': id, 'naam': naam, 'stad': 'Tijuana', 'site': site, 'artsen': artsen, 'signalen': reg(arts), 'reviews': reviews(ks), 'vermeld': vermeld(ks), 'openheid': openheid(ks, ao), 'risico': risico(ks)})
L = {'id': 'tummy-mexico', 'land': 'MX', 'ingreep': 'tummy', 'naar': 'mexico', 'methode': 'plastisch',
     'registers': {'board': 'CMCPER', 'vereniging': 'AMCPER', 'regionaal': 'CCPERBC', 'acc': 'CSG (Consejo de Salubridad General)'},
     'gecontroleerd': '2026-11-15', 'gepubliceerd': '2026-11-15',
     'slugs': {'en': 'best-tummy-tuck-surgeons-tijuana-mexico', 'nl': 'nl/beste-buikwandcorrectie-klinieken-tijuana-mexico', 'de': 'de/beste-bauchdeckenstraffung-kliniken-tijuana-mexiko'},
     'klinieken': out,
     'niet_gerangschikt': [{'naam': 'Art Siluette (Dr. Jesús Manuel Báez López)', 'reden': 'not ranked: a patient died during surgery in 2021 and news reports say he is not trained as a plastic surgeon', 'bron': 'https://abc7.com/woman-dies-plastic-surgery-in-mexico-dr-jesus-manuel-baez-lopez-death-keuana-weaver/10557840/'}]}
T = json.load(open(D + 'tummy-mexico-teksten.json'))
L['tekst'] = T['tekst']
for k in out:
  if k['id'] in T['conclusie']: k['conclusie'] = T['conclusie'][k['id']]
json.dump(L, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
print(len(out))
