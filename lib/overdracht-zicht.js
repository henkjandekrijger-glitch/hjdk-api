// Overdracht ZICHT voor andere chats, projecten en collega's. Live: https://hjdk-api-henq.vercel.app/api/zicht?op=overdracht
export const OVERDRACHT_ZICHT = `# ZICHT: de lerende lus voor vindbaarheid in Google en vermeldingen in AI-assistenten

Voor elk project en elke chat. Draait in de cloud, in Vercel-project hjdk-api (repo henkjandekrijger-glitch/hjdk-api, bestanden lib/zicht.js en api/zicht.js).
Adres: https://hjdk-api-henq.vercel.app/api/zicht

## Wat het is
- Een kennisbank met lessen over SEO en over genoemd worden door ChatGPT, Perplexity, Copilot, Gemini en Claude.
  - Elke les heeft een score: de kans dat hij werkt (voorkennis uit onderzoek plus eigen proeven) maal het gemeten effect, gedeeld door de moeite.
  - De lijst ordent zichzelf: wat bewezen werkt stijgt, wat niet werkt zakt en wordt na 5 mislukte proeven 'verworpen'.
- Metingen per site, elke dag:
  - Search Console: vertoningen en kliks.
  - Indexering per pagina, via de URL-inspectie van Google.
  - AI-crawlers die de site lezen.
  - Of AI-assistenten de site noemen: Perplexity krijgt elke dag 8 echte zoekvragen van de site en we kijken of de site in de bronnen staat. Ook wie er wél genoemd wordt.
- Proeven: alles wat je toepast, meld je als proef. Na 14 tot 21 dagen beoordeelt de lus zelf of het beter werd. Dat gaat tegen een controlegroep, of anders tegen de hele site. De uitkomst gaat terug in de score van de les.
- Een onderzoeker leest elke week de data en voegt hooguit 3 nieuwe, toetsbare lessen toe.

## Gebruiken (lezen, zonder sleutel)
- Draaiboek als tekst: /api/zicht?op=draaiboek&t=1 (voor één site: &site=kz, alleen AI: &kanaal=llm)
- Stand per site (metingen, historie, proeven en uitkomsten): /api/zicht?op=stand&site=kz
- Aangemelde sites: /api/zicht?op=sites

## Terugmelden (schrijven, met token)
Stuur het token mee als Authorization: Bearer <token>. Dat is de gedeelde team-variabele ZICHT_TOKEN, GADS_TOKEN of HJDK_TOKEN.
- Iets toegepast? POST /api/zicht?op=proef met {"site":"kz","les":"<id uit het draaiboek>","urls":["https://..."],"controle":["https://..."],"metric":"gsc|index|llm","wat":"wat je deed","van":"naam van je project of chat"}
  - gsc = vertoningen per pagina
  - index = komt de pagina in Google
  - llm = noemen AI-assistenten de site
- Zelf een uitkomst gemeten? POST /api/zicht?op=uitkomst met {"site":"kz","les":"<id>","uitkomst":"beter|slechter|gelijk","effect":0.25,"toelichting":"..."}
- Nieuw inzicht of nieuw bewijs? POST /api/zicht?op=les met {"les":"een zin wat te doen","kanaal":"google|llm|beide","bewijs":"wat je zag, met cijfers","bron":"url of project","sterkte":2,"moeite":2}
  Een bestaande id voegt bewijs toe aan die les.
- Een nieuwe site laten meten? POST /api/zicht?op=site met {"id":"todayin","host":"todayin.email","taal":"en","land":"US","merk":["todayin"],"vragen":["echte koop- of zoekvragen ..."]}
  Search Console meet alleen mee als het serviceaccount seo-leerlus@hjdk-seo.iam.gserviceaccount.com toegang heeft (dan "gsc": true).

## Werkwijze voor elke chat die aan SEO of AI-vermeldingen werkt
1. Lees eerst het draaiboek (&t=1) en begin bij de hoogste score die op jouw site nog niet is toegepast.
2. Pas het toe, en meld het als proef. Zonder proef leert niemand ervan.
3. Zie je iets nieuws (wat werkt, wat niet, wie AI wél noemt), meld het als les met bewijs.
4. Nooit: massaal gegenereerde pagina's, nep-reviews, verborgen tekst, of pagina's per kleine zoekvariant (doorway). Wat we publiceren mag niet als AI-content ogen.

## Wat al automatisch meedoet
- keuzehulp.best, whichtobuy.best en kaufberater.best: elke titel- of FAQ-wijziging uit de Search Console-ronde wordt een proef.
- keuzehulp.best: pagina's die Google nog niet kent krijgen interne links. 1 op 5 pagina's blijft als controlegroep zonder links, zodat we kunnen meten of het helpt.
- Planners kiezen onderwerpen met Demand Radar.

## Tijden (UTC)
- 02:40: Search Console-ronde
- 04:15: indexcheck
- 05:30: ZICHT-ronde (meten, beoordelen, herrangschikken, onderzoeker)
`;
