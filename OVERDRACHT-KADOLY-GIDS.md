# Overdracht: gids.kadoly.com (keuzehulpen van Kadoly)

Werk je hieraan? Lees eerst dit bestand en de skill zicht-seo-llm. Werk in dezelfde commit de stand en het logboek hieronder bij (nieuwste boven).

## Opdracht (Henkjan, 30 okt 2026)
- "We gaan Kadoly.help maken en daar keuzehulpen maken voor alle content van Kadoly ... dit gaat over long term de long game om te verkopen via SEO en LLM. Denk goed na over WAT klanten willen zien. Hoe we ze naar de kassa krijgen. Wat de onzekerheden zijn ... Dit is ons LAB ook voor Kadoly maar zeker dus ook content marketing."
- Na het plan en een panel (psycholoog, kassa-conversie, SEO nieuwe domeinen, AI-vindbaarheid) koos Henkjan: plek **gids.kadoly.com** (niet een los domein; kadoly.help alleen kopen en doorsturen), Google Shopping repareren **later**, producten zelf bestellen **nog niet** (dus afraden alleen op harde feiten).
- Inspiratie van Henkjan: vertrouwen groeit als de klant ziet hoe de winkel handelt wanneer zijn belang en het verkoopbelang uiteenlopen (geschiktheidscheck die kan afraden, zichtbare selectie, eerlijk over hoe we verdienen, retourroute vooraf, cadeauzekerheid).

## Hoe het werkt
- Code: api/gids.js (pagina's, sitemap, robots, llms.txt, teller, op=feiten voor productfeiten via de beschermde vercel.app-host), gidsen in lib/gidsen-kadoly.js (met de hand geschreven op echte productfeiten), kliks via /naar/<pid> naar api/shop.js op=gidsuit en dan Clickmind direct() naar kadoly.com met hj-code (net x, utm_source kadoly-gids, utm_medium gids, utm_campaign <gids>).
- Routes in vercel.json voor host gids.kadoly.com. Testen kan al op https://hjdk-api-henq.vercel.app/api/gids?slug=<gids>.
- Tellers: hash gk:d:<dag> (60 dagen): <gids>|v (weergave), <gids>|uit-<blok> (klik naar de shop), <gids>|check-<uitkomst>. Lezen: /api/gids?op=stand&dagen=7.
- Prijzen en levertijd live uit de shopcatalogus (hjdk:shop:cat); uitverkocht product verdwijnt vanzelf uit de gids.
- Pagina-opbouw: kort antwoord, Onze keuze (prijs inclusief verzending, verwachte bezorgdag, waarom, let op), tabel per situatie, snelle check die ook kan afraden, uitleg, zo kozen we, zekerheid, FAQ, delen via WhatsApp. Schema: Organization, Article, BreadcrumbList, ItemList met Product en Offer, FAQPage.

## Stand
- 30 okt: gids.kadoly.com toegevoegd aan Vercel-project hjdk-api (geverifieerd). DNS ontbreekt nog: bij AWS Route 53 van kadoly.com een CNAME gids -> 1cb0d436b4cbaa55.vercel-dns-017.com (Henkjan of de beheerder van kadoly.com).
- Eerste gidsen (keuze panel, zoekvolume nog niet getoetst): 3D houten puzzel volwassenen (148 producten van Art Bizniz), oplaadbare tafellamp, lootjes of secret santa cadeau 20 euro.
- Nog te doen: Search Console en Bing voor gids.kadoly.com, aanmelden bij ZICHT (op=site), link vanaf kadoly.com ("Hulp bij kiezen"), kadoly.help kopen en doorsturen (prijsquote aan Henkjan voorleggen).

## Onzekerheden
- Lange termijn: eerste zoekverkeer na 1 a 2 maanden, omzet uit gidsen pas later; Sinterklaas 2026 halen de gidsen niet via Google.
- Kassa lekt (30 okt: 15 op de afrekenpagina, 1 betaling gestart, 0 betaald) en Google Shopping staat uit (feed haalt nog uit yoo.rs): beide buiten deze site, maar ze bepalen of gidsbezoek verkoopt.
- Catalogus wisselt; geen eigen productervaring, dus geen kwaliteitsoordeel.

## Logboek (nieuwste boven)
- 2026-10-30: site gebouwd (api/gids.js, lib/gidsen-kadoly.js, op=gidsuit in api/shop.js), domein gids.kadoly.com aan het project gehangen. Plan en panel: zie boven.
