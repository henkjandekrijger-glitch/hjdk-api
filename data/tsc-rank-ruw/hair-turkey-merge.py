import json, re, urllib.parse, sys
D='/tmp/claude-0/-home-claude/943bb184-118a-57cf-a1f3-dfc1684f03cc/scratchpad/rank/'
K=json.load(open(D+'kandidaten.json'))['klinieken']; R=json.load(open(D+'reviews.json'))['klinieken']; O=json.load(open(D+'openheid.json'))['klinieken']; G=json.load(open(D+'registers.json'))
def kand(sub): return next((x for x in K if sub.lower() in x['naam'].lower()), None)
def rev(sub): return next((x for x in R if sub.lower() in x['naam'].lower()), None)
def opn(sub): return next((x for x in O if sub.lower() in x['naam'].lower()), None)
def ish(sub): return next((x for x in G['ishrs'] if sub.lower() in x['arts'].lower()), None)
def abh(sub): return next((x for x in G['abhrs'] if sub.lower() in x['arts'].lower()), None)
def spec(sub): return next((x for x in G['specialisme'] if sub.lower() in x['arts'].lower()), None)
VALUE = ['pekiner','biçer','keser','demirsoy','fuecapilar','yaman']  # waardelijst van de moderator op r/HairTransplants
def vermeld(k, id):
  if not k: return []
  out=[]
  for u in k['vermeld_in']:
    h=urllib.parse.urlparse(u).netloc.replace('www.','')
    if 'ggtyler' in h:
      if any(v in k['naam'].lower() for v in VALUE): out.append(u.replace('https://cal1.lr.ggtyler.dev','https://www.reddit.com'))
    elif h in ('hairrestorationnetwork.com','hairlosstalk.com','americanhairloss.org','community.realself.com'): out.append(u)
  return list(dict.fromkeys(out))[:4]
def pct(v):
  if v is None: return None
  m=re.search(r'[\d.,]+',str(v)); return float(m.group(0).replace(',','.')) if m else None
NEUTRAAL=re.compile(r'invited|uitgenodigd|uitnodig|merged|samengevoegd|not be representative|niet representatief',re.I)
ZWAAR=re.compile(r'nep|fake|schending|suspend|opgeschort',re.I)
def reviews(r):
  if not r: return []
  out=[]
  for p in r['platforms']:
    pl=p['platform']
    if re.search(r'eigen site|google \(op|provenexpert|google \+',pl,re.I): continue
    w=p.get('waarschuwing') or ''
    w2 = ('Trustpilot removed fake reviews' if 'trustpilot' in pl.lower() else 'account suspended') if (w and ZWAAR.search(w)) else ''
    if p.get('score') is None and not w2: continue
    out.append({'platform':re.sub(r'\s*\(.*','',pl),'score':p.get('score'),'aantal':int(re.sub(r'\D','',str(p.get('aantal')))) if p.get('aantal') not in (None,'') and re.sub(r'\D','',str(p.get('aantal'))) else None,'pct_1ster':pct(p.get('pct_1ster')),'waarschuwing':w2,'bron':p['bron'],'datum':p.get('gezien','2026-11-15')})
  return out
# openheid: handmatig geduid uit openheid.json (zie samenvatting onderzoeker), bron uit het bestand
OPEN = {
 'cosmedica':('Cosmedica','deels',True), 'aygin':('Serkan Aygin','',False), 'smile':('Smile','deels',True), 'vera':('Vera','',False),
 'asmed':('Asmed','deels',True), 'hermest':('Hermest','',False), 'clinicana':('Clinicana','',True), 'cinik':('Cinik','deels',True),
 'estenove':('Estenove','',False), 'estefavor':('Este Favor','deels',False), 'cliniccenter':('Clinic Center','',True), 'medart':('Medart','deels',True),
 'hairmedico':('Hairmedico','deels',True), 'yaman':('Resul Yaman','deels',False), 'hlc':('HLC','ja',False), 'istanbulhaircenter':('Istanbul Hair Center','ja',True),
 'elithair':('Elithair','nee',True), 'sule':('Sule','nee',True), 'gethair':('Get Hair','',False), 'naturalhair':('Natural Hair','',True),
}
def openheid(id):
  if id not in OPEN: return {}
  sub,arts,gar = OPEN[id]; o=opn(sub)
  if not o: return {}
  pr=o.get('prijs') or {}; wie=o.get('wie_opereert') or {}; nz=o.get('nazorg') or {}
  pub = bool(pr.get('bedrag')) and not re.match(r'(niet|geen)',pr.get('bedrag',''),re.I)
  return {'prijs': pr.get('bedrag') if pub else '', 'prijs_bron': pr.get('bron',''), 'arts_opereert': arts, 'arts_tekst': wie.get('tekst','') if arts else '', 'arts_bron': wie.get('bron',''), 'garantie': nz.get('tekst','') if gar else '', 'garantie_bron': nz.get('bron','')}
def risico(id):
  if id!='cinik': return []
  o=opn('Cinik'); r=o['risico'][0]
  return [{'wat':'A 38-year-old British patient died in the clinic in July 2025 before his operation started; Turkish authorities opened an investigation and the clinic says the courts are investigating','datum':r.get('datum','2025-08-03'),'bron':r['bron'],'ernst':'zwaar'}]
C=[ # id, naam, stad, kandidaten-sleutel, reviews-sleutel, signalen
 ('asmed','Asmed (Dr. Koray Erdoğan)','Istanbul','ASMED','Asmed',{'iahrs':'member','iahrs_bron':'https://www.iahrs.org/'}),
 ('hlc','HLC Hairline Clinic (Dr. Özgür Öztan)','Ankara','HLC',None,{'ishrs':'Fellow (FISHRS)','ishrs_bron':ish('Oztan')['bron'],'abhrs':True,'abhrs_bron':'https://abhrs.org/directory/'}),
 ('smile','Smile Hair Clinic','Istanbul','Smile','Smile',{}),
 ('vera','Vera Clinic','Istanbul','Vera','Vera',{}),
 ('cosmedica','Cosmedica (Dr. Levent Acar)','Istanbul','Cosmedica','Cosmedica',{}),
 ('aygin','Dr. Serkan Aygın Clinic','Istanbul','Serkan','Serkan',{'specialist':'dermatologist','specialist_bron':spec('Aygin')['bron']}),
 ('pekiner','PHR Clinic (Dr. Kaan Pekiner)','Ankara','Pekiner',None,{'ishrs':'Full Member','ishrs_bron':ish('Pekiner')['bron']}),
 ('yaman','Dr. Resul Yaman Hair Clinic','Istanbul','Resul Yaman','Resul Yaman',{'iahrs':'associate','iahrs_bron':'https://www.iahrs.org/'}),
 ('fuecapilar','FUECAPILAR (Dr. Doğan Turan)','Istanbul','FUECAPILAR',None,{}),
 ('keser','Derma-Plast Clinic (Dr. Muttalip Keser)','Ankara','Keser',None,{}),
 ('elithair','Elithair','Istanbul','Elithair','Elithair',{}),
 ('bicer','Dr. Özlem Biçer Clinic','Istanbul','Biçer',None,{'ishrs':'Fellow (FISHRS)','ishrs_bron':ish('Bicer')['bron'],'abhrs':True,'abhrs_bron':'https://abhrs.org/directory/'}),
 ('ahd','AHD Clinic (Dr. Hakan Doğanay)','Antalya','AHD',None,{}),
 ('hermest','Hermest Hair Clinic','Istanbul','Hermest','Hermest',{'ishrs':'Associate Member','ishrs_bron':ish('Tugen')['bron']}),
 ('armamed','Armamed (Dr. Erkan Demirsoy)','Istanbul','Armamed',None,{'ishrs':'Full Member','ishrs_bron':ish('Demirsoy')['bron']}),
 ('cinik','Dr. Cinik Hospital (Dr. Emrah Cinik)','Istanbul','Cinik','Cinik',{}),
 ('aslitarcan','Asli Tarcan Clinic','Istanbul','Asli Tarcan',None,{}),
 ('hairofistanbul','Hair of Istanbul','Istanbul','Hair of Istanbul','Hair of Istanbul',{}),
 ('clinicana','Clinicana','Istanbul','Clinicana','Clinicana',{}),
 ('civas','Dr. Civas Hair Transplant (Dr. Ekrem Civas)','Ankara','Civas',None,{'ishrs':'Fellow (FISHRS)','ishrs_bron':ish('Civas')['bron'],'abhrs':True,'abhrs_bron':'https://abhrs.org/directory/','specialist':'dermatologist','specialist_bron':spec('Civas')['bron']}),
 ('drt','DrT Hair (Dr. Tayfun Oğuzoğlu)','Istanbul','Oğuzoğlu',None,{'ishrs':'Fellow (FISHRS)','ishrs_bron':ish('Oguzoglu')['bron'],'abhrs':True,'abhrs_bron':'https://abhrs.org/directory/'}),
 ('aek','AEK Hair Clinic (Dr. Emre Karadeniz)','Istanbul',None,None,{'ishrs':'Fellow (FISHRS)','ishrs_bron':ish('Karadeniz')['bron'],'abhrs':True,'abhrs_bron':'https://abhrs.org/directory/','specialist':'plastic surgery training','specialist_bron':spec('Karadeniz')['bron']}),
 ('getnewhair','Get New Hair (Dr. Kayıhan Şahinoğlu)','Istanbul',None,None,{'ishrs':'Fellow (FISHRS)','ishrs_bron':ish('Sahinoglu')['bron'],'abhrs':True,'abhrs_bron':'https://abhrs.org/directory/'}),
 ('estenove','Estenove','Istanbul','EsteNove','Estenove',{}),
 ('estemedical','Este Medical Group','Istanbul','Este Medical','Este Medical',{}),
 ('estefavor','Este Favor','Istanbul','Este Favor','Este Favor',{}),
 ('sule','Sule Hair Transplant','Istanbul','Sule','Sule',{}),
 ('hairmedico','Hairmedico (Dr. Arslan Musbeh)','Istanbul','Hairmedico','Hairmedico',{}),
 ('medart','Medart Hair','Istanbul',None,'Medart',{}),
 ('heva','Heva Clinic','Istanbul',None,'Heva',{}),
 ('cliniccenter','Clinic Center','Istanbul',None,'Clinic Center',{}),
 ('istanbulhaircenter','Istanbul Hair Center','Istanbul',None,'Istanbul Hair Center',{}),
 ('naturalhair','Natural Hair Turkey','Istanbul',None,'Natural Hair',{}),
 ('hairneva','HairNeva','Istanbul','HairNeva','HairNeva',{}),
 ('capil','Capilclinic','Istanbul','Capil','Capilclinic',{}),
 ('bht','BHT Clinic','Istanbul','BHT','BHT',{}),
 ('idealofmed','IdealofMeD','Istanbul',None,'IdealofMeD',{}),
 ('biohair','Bio Hair Clinic','Istanbul',None,'Bio Hair',{}),
 ('drhakan','Dr Hakan Clinic','Istanbul',None,'Dr Hakan',{}),
 ('istanbulvita','Istanbul Vita Hair Clinic','Istanbul',None,'Istanbul Vita',{}),
 ('hwt','HWT Clinic','Istanbul',None,'HWT',{}),
 ('gethair','GetHair','Istanbul',None,None,{}),
 ('transmed','Transmed (Dr. Melike Külahçı)','Istanbul',None,None,{'ishrs':'Full Member','ishrs_bron':ish('Kulahci')['bron']}),
 ('dkklinik','DK Klinik (Dr. Meltem Şentürk)','Antalya',None,None,{'ishrs':'Full Member','ishrs_bron':ish('Senturk')['bron']}),
 ('serdaroglu','Dr. İlhan Serdaroğlu Clinic','Istanbul',None,None,{'ishrs':'Full Member','ishrs_bron':ish('Serdaroglu')['bron'],'specialist':'plastic surgeon','specialist_bron':spec('Serdaroglu')['bron']}),
 ('apaydin','Dr. İlker Apaydın Clinic','Istanbul',None,None,{'ishrs':'Full Member','ishrs_bron':ish('Apaydin')['bron'],'specialist':'plastic surgeon','specialist_bron':spec('Apaydin')['bron']}),
]
out=[]
for id,naam,stad,ks,rs,sig in C:
  k=kand(ks) if ks else None; r=rev(rs) if rs else None
  site = (k or {}).get('site') or ''
  if site and not site.startswith('http'): site='https://'+site
  o=opn(OPEN[id][0]) if id in OPEN else None
  if not site and o and o.get('site'): site='https://'+urllib.parse.urlparse(o['site']).netloc
  artsen=[{'naam':a['naam'],'titel':a.get('titel',''),'bron':a['bron']} for a in (k or {}).get('artsen',[])]
  out.append({'id':id,'naam':naam,'stad':stad,'site':site,'artsen':artsen,'signalen':sig,'reviews':reviews(r),'vermeld':vermeld(k,id),'openheid':openheid(id),'risico':risico(id)})
L={'id':'hair-turkey','land':'TR','ingreep':'hair','naar':'turkey','gecontroleerd':'2026-11-15','gepubliceerd':'2026-11-15','slugs':{'en':'best-hair-transplant-clinics-turkey','nl':'nl/beste-haartransplantatie-klinieken-turkije','de':'de/beste-haartransplantation-kliniken-tuerkei'},'klinieken':out,
   'niet_gerangschikt':[{'naam':'Longevita','reden':'broker, not a clinic: says itself it does no procedures','bron':opn('Longevita')['site']}]}
json.dump(L,open(D+'lijst.json','w'),ensure_ascii=False,indent=1)
print(len(out))
