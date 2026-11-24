# Conclusies bijgewerkt na de verversing van 2026-11-24 (alleen wat de data zegt); smile daarna: 'Sterk op reviews'
import json
D=json.load(open('data/tsc-rank.json')); K={k['id']:k for k in D['lijsten']['hair-turkey']['klinieken']}
def zet(id,**c): K[id]['conclusie']=c
def vervang(id,oud,nieuw):
  for t in ('en','nl','de'):
    assert oud[t] in K[id]['conclusie'][t], (id,t)
    K[id]['conclusie'][t]=K[id]['conclusie'][t].replace(oud[t],nieuw[t])
zet('apaydin',
 en="Dr. İlker Apaydın is a plastic surgeon and full ISHRS member, with 419 RealSelf reviews averaging 4.8. We have not yet checked his site for prices or who does which step.",
 nl="Dr. İlker Apaydın is plastisch chirurg en volwaardig ISHRS-lid, met 419 reviews op RealSelf, gemiddeld 4,8. Prijzen en wie welke stap doet hebben we op zijn site nog niet nagekeken.",
 de="Dr. İlker Apaydın ist plastischer Chirurg und Vollmitglied der ISHRS, mit 419 Bewertungen auf RealSelf, im Schnitt 4,8. Preise und wer welchen Schritt macht, haben wir auf seiner Website noch nicht geprüft.")
zet('serdaroglu',
 en="Dr. İlhan Serdaroğlu is a plastic surgeon and full ISHRS member, with 105 reviews on RealSelf and Trustpilot averaging 4.9. We have not yet checked his site for prices or who does which step.",
 nl="Dr. İlhan Serdaroğlu is plastisch chirurg en volwaardig ISHRS-lid, met 105 reviews op RealSelf en Trustpilot, gemiddeld 4,9. Prijzen en wie welke stap doet hebben we op zijn site nog niet nagekeken.",
 de="Dr. İlhan Serdaroğlu ist plastischer Chirurg und Vollmitglied der ISHRS, mit 105 Bewertungen auf RealSelf und Trustpilot, im Schnitt 4,9. Preise und wer welchen Schritt macht, haben wir auf seiner Website noch nicht geprüft.")
zet('cliniccenter',
 en="4.7 from about 3,000 Trustpilot reviews and prices from GBP 1,500 on the site. A guarantee certificate is mentioned without published terms, and the site does not say who does which step.",
 nl="4,7 uit zo'n 3.000 Trustpilot-reviews en prijzen vanaf GBP 1.500 op de site. Er is een garantiecertificaat zonder gepubliceerde voorwaarden, en de site zegt niet wie welke stap doet.",
 de="4,7 aus rund 3.000 Trustpilot-Bewertungen und Preise ab GBP 1.500 auf der Website. Ein Garantiezertifikat wird genannt, ohne veröffentlichte Bedingungen, und die Website sagt nicht, wer welchen Schritt macht.")
vervang('smile',{'en':'Highest score on the data: about','nl':'Hoogste score op de data: zo\'n','de':'Höchste Punktzahl nach den Daten: rund'},
 {'en':'The best reviewed clinic with published prices: about','nl':'Best beoordeelde kliniek met prijzen op de site: zo\'n','de':'Die am besten bewertete Klinik mit veröffentlichten Preisen: rund'})
vervang('elithair',{'en':'4.7 from about 4,600','nl':'4,7 uit zo\'n 4.600','de':'4,7 aus rund 4.600'},{'en':'4.8 from about 4,800','nl':'4,8 uit zo\'n 4.800','de':'4,8 aus rund 4.800'})
vervang('vera',{'en':'4.8 from','nl':'4,8 uit','de':'4,8 aus'},{'en':'4.9 from','nl':'4,9 uit','de':'4,9 aus'})
vervang('hairmedico',{'en':'4.9 from 121 Trustpilot reviews','nl':'4,9 uit 121 Trustpilot-reviews','de':'4,9 aus 121 Trustpilot-Bewertungen'},
 {'en':'4.5 from 122 Trustpilot reviews (was 4.9), 7% of them one star,','nl':'4,5 uit 122 Trustpilot-reviews (was 4,9), waarvan 7% één ster,','de':'4,5 aus 122 Trustpilot-Bewertungen (vorher 4,9), davon 7% ein Stern,'})
vervang('naturalhair',{'en':'3.0 from 929','nl':'3,0 uit 929','de':'3,0 aus 929'},{'en':'2.9 from 930','nl':'2,9 uit 930','de':'2,9 aus 930'})
for t,s in {'en':' Trustpilot removed fake reviews and shows no score.','nl':' Trustpilot verwijderde nepreviews en toont geen score.','de':' Trustpilot hat gefälschte Bewertungen entfernt und zeigt keine Punktzahl.'}.items():
  if s.strip() not in K['sule']['conclusie'][t]: K['sule']['conclusie'][t]+=s
json.dump(D,open('data/tsc-rank.json','w'),ensure_ascii=False,indent=1); print('ok')
