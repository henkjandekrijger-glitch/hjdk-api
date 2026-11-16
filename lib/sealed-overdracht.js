// Overdracht van Sealed Intent, live op https://sealedintent.com/overdracht (JSON: ?format=json).
// Henkjan 16 nov 2026: "zullen we handover maken voor sealed intent . Zet dat trouwens ook op vercel zodat altijd onafh account en computer ik door kan."
// VAST = complete werking, regels, open punten en logboek: werk dit bij in dezelfde commit als elke wijziging aan hoe Sealed Intent werkt
// (logboek: nieuwste boven, één regel). De stand wordt bij elk bezoek opgebouwd uit de live gegevens (api/sealed.js op=overdracht).
// Nooit sleutels, e-mailadressen of andere persoonsgegevens in dit bestand of in de stand.
import { PAGINAS, UI, PARTIJ, BIJGEWERKT } from './sealed-content.js';

export const OVERDRACHT_DATUM = '2026-11-16';

export const VAST = `# Sealed Intent: overdracht

Lees dit eerst als je aan Sealed Intent werkt. Live: https://sealedintent.com/overdracht (JSON: ?format=json). Het vaste deel staat in hjdk-api lib/sealed-overdracht.js: werk het bij in dezelfde commit als elke wijziging aan hoe Sealed Intent werkt, en zet een regel in het logboek (nieuwste boven). Schrijf daarnaast een regel in het centrale werklog: /api/mm/handover?log=<wat>&wie=sealed-<chat> (hjdk-api-henq.vercel.app, met web_fetch_vercel_url).

## Wat het is
- Eigenaren en topmensen leggen anoniem een intentie neer: bedrijf verkopen, reageren op een bod, gevonden worden door headhunters of outplacement, commissaris worden. Alleen gecontroleerde partijen zien een anoniem profiel met de voorwaarden. De naam komt pas vrij als de eigenaar of bestuurder ja zegt tegen die ene partij.
- Belofte in de teksten (Henkjan 15 nov): "Bewegen maar niet kunnen, nu kan het wel. Weten wat ze waard zijn, hun voorwaarden gelden nu. Werking moet duidelijk zijn. Absoluut ANONIEM."
- Verdienmodel (Henkjan 15 nov): partijen (kopers, investeerders, M&A-adviseurs, headhunters, outplacementbureaus, raden) betalen per geaccepteerde introductie. Geen percentage van de deal ("percentage is zo moeilijk te controleren"). Gratis voor wie verzegelt. Bedrag per introductie nog niet bepaald.
- Merk en domein: Sealed Intent, sealedintent.com (gekocht 15 nov 2026 bij Vercel; www stuurt door naar het kale domein). Dienst van Adsfair B.V., Albert Plesmanplein 20, 2805 AB Gouda (staat in de voet van elke pagina).

## Waar het staat
- Repo henkjandekrijger-glitch/hjdk-api, Vercel-project hjdk-api (team henq). Alle verzoeken op sealedintent.com lopen via host-rewrites bovenaan vercel.json naar api/sealed.js. Push naar main = live.
- api/sealed.js: routes (voordeur, hubs, landingspagina's, partijpagina, robots.txt, sitemap.xml, llms.txt, zicht.json, iconen, manifest, overdracht), POST op=intent en op=partij, eigenaar op=intents (token HJDK_TOKEN), op=indexnow.
- lib/sealed.js: HTML-opbouw, rekenhulp en formulieren in de pagina (inline JS, geen AI tijdens het laden), taalhint, partijpagina, sitemap, llms.txt, zicht.json, logo.
- lib/sealed-content.js: alle teksten en cijfers: PAGINAS (19 landingspagina's), GEDACHTE (wat de bezoeker denkt), ANONIEM, UI (hubs, zo werkt het), PARTIJ (partijpagina), BRON (bronnen), MULT (factoren voor de rekenhulp).
- lib/sealed-icons.js: favicon.ico, apple-touch-icon, icon-192/512 (base64). lib/sealed-overdracht.js: dit document.
- lib/proef.js: Clickmind-proef 'sealed'. lib/zicht.js: ZICHT-site 'sealed'. lib/werking.js: één regel in de centrale werking.

## Pagina's
- 19 landingspagina's, één per echte zoekvraag uit Demand Radar (15 nov 2026, thema's bedrijf-verkopen, executives, executives-en, stille-intenties), geen varianten per kleine zoekterm:
  - Ondernemers: waarde (nl wat-is-mijn-bedrijf-waard, de unternehmenswert-berechnen, en what-is-my-business-worth), verkopen (bedrijf-verkopen, firma-verkaufen, sell-my-business), bod (bod-op-mijn-bedrijf, kaufangebot-firma, offer-for-my-business).
  - Executives: outplacement (nl, de, en outplacement-services), open to work (nl open-to-work-uitzetten, en turn-off-open-to-work), headhunter (nl, de, en headhunter-called), commissaris (nl commissaris-worden, en non-executive-director).
- Opbouw van elke pagina: datum (<time>), H1 = de zoekvraag, wat de bezoeker denkt (vet), het antwoord met cijfers, het hulpmiddel, Zo werkt het (3 stappen), Absoluut anoniem, In cijfers met bron, veelgestelde vragen (zichtbaar = JSON-LD FAQPage), bronnen, verwante pagina's. Cijfers alleen met bron en datum.
- Hubs /nl /de /en. De voordeur / kiest de taal: eerst de eigen keuze (cookie si_taal, gezet bij een tik op een taal), dan Accept-Language, anders Engels; zonder Accept-Language (bots) toont hij zelf de voordeur, dat adres is x-default; Vary: Accept-Language, Cookie. Op elke pagina staat één regel naar de vertaling als de browser een andere taal voorop heeft; nooit automatisch doorsturen.
- Partijpagina (de kant van de klant): /nl/partijen, /de/partner, /en/partners. Wat partijen wel en nooit zien, spelregels, voorbeeldprofiel (duidelijk als voorbeeld), waarom nu (alleen cijfers met bron), wat het kost, aanvraagformulier. Staat op noindex en buiten de sitemap tot Henkjan de spelregels goedkeurt (PARTIJ_INDEX in lib/sealed.js).
- Stijl: outname.now-look (Inter, wit, blauw #2B47C4), één tekstmaat 18 px, titels groter, nooit grijs, donkere modus. Logo: effen cirkel met sleutelgat (versie A, gekozen door Henkjan 16 nov 2026).

## Rekenhulp
- NL: factor x winst voor rente, belasting en afschrijving per sector (Overname Barometer, tweede helft 2025: gemiddeld 5,0x, software 7,5x, retail 2,5x), plus of min 15%, bijgesteld voor afhankelijkheid van de eigenaar (+0,5 / 0 / -1) en -0,5 voor de kleinste band.
- DE: DUB Micro-Cap-spanne per branche (Software 6,3-8,0x, Maschinenbau 3,5-4,5x, Konsumgüter 2,4-4,0x).
- EN: BizBuySell Q3 2026: 2,30x cash flow onder $1M, 3,73x daarboven, plus of min 15%.
- Bodcheck: bod gedeeld door het midden van de winstband, naast het sectorgemiddelde.

## Verzegelen en aanvragen
- Verzegelen: POST /api/sealed?op=intent naar Redis si:i:<id>, lijst si:list, teller si:n (400 dagen), melding in Telegram via spel /api/meld (MELD_SLEUTEL). Hooguit 10 per IP per uur.
- Aanvraag van een partij: POST op=partij naar si:p:<id>, lijst si:plist, Telegram.
- Inzien: /api/sealed?op=intents&token=<HJDK_TOKEN> (e-mail gemaskeerd). Nooit persoonsgegevens in deze overdracht of in commits.
- Nog niet gebouwd: bevestigingsmail met intrek-link (Resend), controle en matching, omgeving voor partijen, betaling.

## Lerend
- Clickmind-proef 'sealed' (lib/proef.js): onderdelen stijl (a clean, b corporate: koppen in Source Serif 4, marineblauw), cta (knoptekst) en volgorde (antwoord eerst of hulpmiddel eerst). Waarde per bezoeker: tik 1, start 2, uitkomst 4, voorwaarden 6, e-mail 10, verzegeld 20, aanvraag partij 20. Stand: https://keuzehulp.best/api/mm/proefstand?site=sealed&vorm=tekst. Bots en bezoekers zonder JavaScript zien versie a.

## Vindbaarheid (ZICHT)
- ZICHT-site 'sealed', manifest https://sealedintent.com/zicht.json (25+ lessen toegepast, proeven si-index-1116 na 21 dagen en si-llm-1116 na 28 dagen). AI-zoekbots toegelaten in robots.txt, llms.txt, hreflang met x-default, sitemap met eerlijke lastmod (BIJGEWERKT).
- Search Console: sc-domain:sealedintent.com geverifieerd met DNS-TXT (16 nov) via het serviceaccount, sitemap ingediend (/api/gsc?op=verifieer&site=sealedintent.com&doe=1&sitemap=1).
- IndexNow: /api/sealed?op=indexnow pingt één keer per versie van BIJGEWERKT (dagelijkse cron 07:10 UTC).
- Bing Webmaster Tools: nog niet (Henkjan: importeren uit Search Console).

## Regels
- Absoluut anoniem. Nooit nep-profielen, nep-tellers of nep-reviews: het voorbeeldprofiel staat er als voorbeeld, de teller verschijnt pas vanaf 1. Nooit 0 tonen.
- Teksten schrijft Claude zelf, niet via de AI Gateway. Geen massaal gemaakte pagina's.
- Budgetregels voor campagnes gelden ook hier (CPA, start 0,01, hooguit $10 per campagne per dag, testproject hooguit $20 per dag per saldo). Message match tussen advertentie en landingspagina; Clickmind-link ertussen.
- Werk in hjdk-api: eerst git pull --rebase, commit met expliciete bestandsnamen (nooit git add -A), push naar main. Sleutels nooit in code, pagina's of URL's.

## Open
1. Henkjan: spelregels van de partijpagina akkoord? (hooguit 5 partijen per profiel, beperkte plekken per sector en regio, betalen per geaccepteerde introductie). Daarna PARTIJ_INDEX = true en de partijpagina's in de sitemap.
2. Henkjan: bedrag per introductie.
3. Henkjan: Bing Webmaster Tools (importeren uit Search Console).
4. Meer talen: taal volgt de browser, nu NL, DE en EN; andere browsertalen krijgen Engels. Kandidaten FR, ES, IT; per taal eigen cijfers met bron nodig.
5. Verkeer naar de landingspagina's (betaald, met message match en Clickmind-link), binnen de budgetregels.
6. Bevestigingsmail na verzegelen (Resend) met intrek-link.
7. Omgeving voor partijen: toegang na controle, anonieme profielen per sector en regio, reageren binnen de voorwaarden.
8. Eén echte test-verzegeling op de live site en controleren dat de Telegram-melding binnenkomt.

## Logboek (nieuwste boven)
- 2026-11-16: overdracht live op /overdracht (dit document plus stand uit de live gegevens).
- 2026-11-16: teksten over wat de bezoeker denkt, Zo werkt het en Absoluut anoniem op elke pagina; partijpagina in NL, DE en EN (noindex).
- 2026-11-16: strakker logo, favicon en iconen; voordeur kiest taal uit de browser; taalhint op pagina's.
- 2026-11-16: ZICHT-chat: IndexNow dagelijks per versie (cron 07:10 UTC).
- 2026-11-16: live met 19 landingspagina's, Clickmind-proef, ZICHT, Search Console en IndexNow.
- 2026-11-15: concurrentie- en zoekonderzoek (Demand Radar), naam Sealed Intent gekozen, domein gekocht, model: introducties verkopen aan dealmakers.
`;

// Stand uit de live gegevens; alleen aantallen, nooit inhoud van intenties of aanvragen.
export async function overdracht(kv, { proefStand, proefTekst } = {}) {
  const r = { bijgewerkt: OVERDRACHT_DATUM, inhoud: BIJGEWERKT, commit: (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7), commitTekst: String(process.env.VERCEL_GIT_COMMIT_MESSAGE || '').split('\n')[0].slice(0, 160) };
  try { r.verzegeld = +(await kv.get('si:n')) || 0; } catch (e) { r.verzegeld = null; }
  try { r.aanvragen = +(await kv.raw(['LLEN', 'si:plist'])) || 0; } catch (e) { r.aanvragen = null; }
  try { r.indexnow = await kv.get('si:indexnow'); } catch (e) { r.indexnow = null; }
  try { if (proefStand) { const s = await proefStand(kv, 'sealed'); r.proef = proefTekst ? proefTekst(s) : s; } } catch (e) { r.proef = null; }
  const per = {}; for (const p of PAGINAS) per[p.taal] = (per[p.taal] || 0) + 1;
  r.paginas = { totaal: PAGINAS.length, per, talen: Object.keys(UI), partij: Object.keys(PARTIJ).map(t => '/' + t + '/' + PARTIJ[t].slug) };
  return r;
}
export function overdrachtTekst(r) {
  const L = ['## Stand nu (live opgebouwd)',
    `- Draaiende versie: ${r.commit || 'onbekend'}${r.commitTekst ? ' (' + r.commitTekst + ')' : ''}. Inhoud bijgewerkt ${r.inhoud}.`,
    `- Pagina's: ${r.paginas.totaal} landingspagina's (${Object.entries(r.paginas.per).map(([t, n]) => t.toUpperCase() + ' ' + n).join(', ')}), hubs ${r.paginas.talen.map(t => '/' + t).join(' ')}, partijpagina ${r.paginas.partij.join(' ')}.`,
    r.verzegeld == null ? '- Verzegelde intenties: niet te lezen.' : r.verzegeld > 0 ? `- Verzegelde intenties: ${r.verzegeld}.` : '- Verzegelde intenties: nog geen.',
    r.aanvragen == null ? '- Aanvragen van partijen: niet te lezen.' : r.aanvragen > 0 ? `- Aanvragen van partijen: ${r.aanvragen}.` : '- Aanvragen van partijen: nog geen.',
    r.indexnow ? `- Laatste IndexNow: ${String(r.indexnow.t || '').slice(0, 16).replace('T', ' ')} UTC, status ${r.indexnow.status}, ${r.indexnow.n} adressen, versie ${r.indexnow.versie || '?'}.` : '- Laatste IndexNow: niet bekend.',
    '', '## Clickmind-proef', r.proef ? (typeof r.proef === 'string' ? r.proef : JSON.stringify(r.proef)) : 'Niet te lezen; zie https://keuzehulp.best/api/mm/proefstand?site=sealed&vorm=tekst'];
  return L.join('\n');
}
