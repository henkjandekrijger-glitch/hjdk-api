# Verversing hair-turkey (2026-11-24): reviews opnieuw gelezen, één nieuwszoekopdracht per kliniek (geen nieuwe risico's), registers niet leesbaar.
import json, re
R='data/tsc-rank-ruw/'
D=json.load(open('data/tsc-rank.json')); L=D['lijsten']['hair-turkey']
N={k['id']:k for k in json.load(open(R+'hair-turkey-reviews-2026-11-24.json'))['klinieken']}
ZWAAR=re.compile(r'fake|nep|breach|schending|suspend|opgeschort',re.I)
# keuzes per kliniek: dubbele profielen niet dubbel tellen, onzekere signalen weglaten
OVERSLAAN={
 ('cinik','https://www.realself.com/dr/emrah-cinik-besiktas-istanbul-turkey'),  # artsprofiel overlapt met praktijkprofiel
 ('elithair','https://www.trustpilot.com/review/elithair.com'),  # samengevoegd profiel, we tellen het profiel van het domein van de site
}
GEEN_WAARSCH={'yaman'}  # 'Account Suspended' alleen in een zoektitel gezien, niet op de pagina
NIET_OPNEMEN={'gethair'}  # Trustpilot-profiel 'Not Actively Used For Reviews', koppeling met de kliniek niet zeker
def norm(id,r):
  w=r.get('waarschuwing') or ''
  w2=''
  if id not in GEEN_WAARSCH and ZWAAR.search(w) and 'invite' not in w.lower()[:0]:
    w2='Trustpilot removed fake reviews' if r['platform'].lower()=='trustpilot' else 'account suspended'
  return {'platform':r['platform'],'score':r.get('score'),'aantal':r.get('aantal'),'pct_1ster':r.get('pct_1ster'),'waarschuwing':w2,'bron':r['bron'],'datum':r.get('datum') if r.get('ververst',True) else None}
for k in L['klinieken']:
  n=N.get(k['id'])
  if not n or k['id'] in NIET_OPNEMEN: continue
  oud={r['bron']:r for r in k['reviews']}
  nieuw=[]
  for r in n['reviews']:
    if (k['id'],r['bron']) in OVERSLAAN: continue
    x=norm(k['id'],r)
    if x['datum'] is None:  # niet opnieuw gelezen: oude waarden en datum houden
      o=oud.get(r['bron']); 
      if o: nieuw.append(o)
      continue
    if x['score'] is None and not x['waarschuwing']: continue
    nieuw.append(x)
  k['reviews']=nieuw
  for x in n.get('risico_nieuw') or []: k['risico'].append(x)
cap=next(k for k in L['klinieken'] if k['id']=='capil'); cap['site']='https://capilclinic.es'  # stond per vergissing op fuecapilar.com; domein volgens Trustpilot-profiel
L['gecontroleerd']='2026-11-24'
json.dump(D,open('data/tsc-rank.json','w'),ensure_ascii=False,indent=1)
print('ok')
