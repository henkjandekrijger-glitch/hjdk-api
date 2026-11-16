// Sealed Intent: actuele werking en live stand. Geen persoonsgegevens of sleutels.
import { PAGINAS, UI, PARTIJ, BIJGEWERKT } from './sealed-content.js';
import { extraPages } from './sealed-pages.js';
export const OVERDRACHT_DATUM = '2026-11-16';
export const VAST = `# Sealed Intent: actuele overdracht

## Waar het staat
- Domein sealedintent.com, team henq, Vercel-project hjdk-api; repo henkjandekrijger-glitch/hjdk-api. Host-rewrites in vercel.json naar api/sealed.js. Push naar main = productie. Eerst actuele main en de live handover lezen, alleen expliciete bestanden committen en wijzigingen van andere chats behouden.
- api/sealed.js: openbare pagina's, anonieme intake, privébeheer, IndexNow, growth, overdracht. lib/sealed-anonymous.js: allowlist, spamrem, cryptografische privésleutel, opslag, inhoudelijke AI-voorcontrole en intrekken. lib/sealed-pages.js: 12 authored informatiepagina's en anonieme formulieren. lib/sealed-briefs.js: dezelfde acht fictieve casussen en invoervoorbeelden per taal voor formulier en AI. lib/sealed-copy.js: actuele teksten op de 19 bestaande landingspagina's. lib/sealed.js: HTML, hulpmiddelen en sitemap. lib/sealed-content.js: oorspronkelijke bronnen en metadata. scripts/test-sealed-anonymous.mjs: controles zonder externe diensten.
- lib/werking.js bevat de centrale werking. Na iedere wijziging ook deze overdracht en het logboek bijwerken; centraal werklog via /api/mm/handover?log=<wat>&wie=sealed-<chat>. Nooit sleutels of persoonsgegevens in logs, commits of openbare overdracht.

## Besluit en verandering 16 november 2026: anonieme voorwaarden, geen borg
- Henkjan vroeg totaalassessment en betere inhoud, plus breder welke sealed intent: "ze hoeven ons ook niets te geven alleen een borg ... of helemaal niets". Uitgevoerd: gratis anonieme intake zonder verplichte naam, account, e-mail of betaling; geen borg ingevoerd. Acht intentsoorten: verkoop, opvolging, groeikapitaal, loopbaan/interim, bestuursrol, samenwerking, bezit en voorwaardelijke aankoop/overstap. Dit zijn mogelijkheden, geen live voorraad of bewezen marktvraag.
- Nieuwe eigenaar- en partij-inzendingen lopen beide via de anonieme intake. Bestaande rekenhulpen blijven lokaal en geven geen bedragen door. Alleen een soortcode gaat mee naar /<taal>/seal. Partijpagina's houden noindex; een anoniem proefantwoord op een fictieve casus vervangt bedrijfsnaam en e-mail als ingang.
- Nieuwe opslag schema 2: alleen mode, type, brede sector/markt, termijn, voorwaarden, taal, status en datums. Geen contactdetails, referrer, URL of exacte rekenhulpinvoer. Verwijdering via een willekeurige 256-bit capability in het URL-fragment van /<taal>/manage, op de server alleen SHA-256; lezen/verwijderen uitsluitend met POST body. Privépagina zonder Clickmind-script, no-store/noindex en no-referrer. Sleutel nooit loggen of delen. Verlies = geen herstelmail.
- Formulieren tonen na de soortkeuze een concreet voorbeeld met gewenste uitkomst, voorwaarde en grens. Partijen krijgen per soort een eigen expliciet fictieve casus; AI krijgt exact diezelfde casus in de gekozen taal. De 24 combinaties (8 soorten × NL/EN/DE) zijn functioneel gecontroleerd. Voorbeelden worden niet als inzending ingevuld.
- Status blijft pending-review; er bestaat nog geen automatische publicatie of vrijgave. AI beoordeelt alleen het begrip en de volledigheid van een partij-proefantwoord via lib/ai.js, max 20 beoordelingen/dag, max 250 antwoordtokens. Bij uitval blijft de aanvraag voor menselijke beoordeling staan. Geen AI-bewijs van identiteit, bevoegdheid, financiering of betrouwbaarheid, geen automatische toegang of selectie voor een baan.
- Nieuwe inzendingen vervallen na 90 dagen. Intrekken verwijdert de actieve record. Hostinglogs en eventuele back-ups zijn geen onderdeel van een onmiddellijke-erasureclaim. Tijdelijke spamrem: keyed IP-digest, dagelijks gewisselde salt, geen ruwe IP in de applicatie.
- 19 bestaande pagina's inhoudelijk herschreven met concrete beslisvragen; 12 nieuwe openbare pagina's (uitleg/8 toepassingen, privacy, antwoordkwaliteit, opvolging in NL/EN/DE), sitemap nu 35 openbare URL's inclusief root en hubs. Formulieren en privépagina's buiten sitemap en noindex. Wederkerige hreflang inclusief x-default. US-rekenvoorbeeld expliciet USD en geen bedrijfswaardering.
- Demand Radar: twee begrensde thema's in demand_radar, 9 markten, aanvullende aankoopkosten $0,603 gerapporteerd ($0,436 + $0,167); aanvullende dagruimte +$2 vervalt na vandaag. 3.525 zoektermrecords, geen unieke personen of volledige dekking; synoniemen en ruis eerst handmatig beoordelen. FR/ES/IT gemeten, nog geen beloofde gelokaliseerde dienst.
- Weekdoel is meetbare eerste relevante zoek/AI-bezoeken, geen garantie. Baseline 16 nov: 1 van 23 oude openbare URL's geïndexeerd; geen Search Console-klikken en 0/4 citaties in het vaste Perplexity-panel. Niet verwarren met bewezen afwezigheid van menselijk verkeer: betrouwbare bezoekbrondata ontbrak.
- Open: echte private antwoorduitwisseling en toestemming per partij, identiteits-/mandaat-/financieringscontrole bij een latere introductie, betaalafspraak per geaccepteerde introductie, Bing Webmaster Tools. Geen outreach verzonden; eerst geadresseerde en relevante introductievraag kiezen.


## Vindbaarheid en meten
- 35 openbare sitemap-URL's: root, 3 hubs, 19 bestaande landingspagina's en 12 nieuwe informatiepagina's. Eigen canonicals en hreflang met retourlinks en x-default. Formulier-/privépaden en partijpagina's blijven noindex en buiten de sitemap. Geen aparte pagina per klein zoekwoord.
- Robots laten Googlebot, Bingbot en AI-zoekbots toe; toelating is geen indexering of citatie. Search Console is geverifieerd en sitemap ingediend. IndexNow verstuurt de openbare URL's eenmaal per inhoudsversie (nu BIJGEWERKT + anonymous-v2), niet iedere keer opnieuw.
- SEO-stand: /api/zicht?op=stand&site=sealed. Indexbron: /api/gsc?op=index&site=sealed, nooit domeinnaam als site-id; n=5 begrenst een handmatige inspectie. Vaste AI-panelhash behouden. Proeven blijven 21/28 dagen lopen; geen winnaars uit minimale data.
- Growth: /api/sealed?op=growth toont dag/kanaal browser-signalen en ingestuurde formulieren. Browser-signalen zijn geen bewezen unieke mensen of bevestigde zoekklikken. Betaald, zoek, AI, e-mail en direct/onbekend gescheiden. Geen visitor-ID, volledige verwijzer of query opgeslagen. Tests en bots buiten conclusies houden.
- De oude Clickmind-proef stijl/CTA/volgorde draait op marketingpagina's. De historische e-mailwaardering is geen stap in de huidige intake; deze proef meet marketinginteractie en schrijft anonieme inzendingen niet aan een variant toe. Anonieme formulieren en privébeheer laden dat script niet. Een getypte e-mail is geen nieuwe conversiestap meer; stuur op ontvangen bruikbare voorwaarden, goedgekeurde voorstellen en geaccepteerde introducties.

## Verdienmodel en grenzen
- Gratis voorwaarden vastleggen. Een partij betaalt later per geaccepteerde introductie, volgens vooraf afgesproken voorwaarden. Geen percentage van de transactie. Er is nog geen facturatie, automatische toegang, volledig antwoord-inboxproces of gegarandeerde tegenpartij.
- Anonimiteit betekent hier geen verplichte identiteitsvelden en geen automatische publicatie, niet dat hostingnetwerkverkeer ontraceerbaar is. AI beoordeelt alleen inhoud, niet waarheid, identiteit of menselijke geschiktheid. Vertrouwen moet later per processtap worden onderbouwd.

## Logboek (nieuwste boven)
- 2026-11-16: hervatting en contextcontrole: generieke overnamecasus vervangen door acht soortspecifieke fictieve casussen in NL/EN/DE. Ook initiatiefnemers krijgen een passend invoervoorbeeld met uitkomst, voorwaarde en grens. AI ontvangt dezelfde getoonde casus en alleen het anonieme proefantwoord. 24 context-/formuliercontroles plus bestaande opslag-, privacy-, intrek-, spamrem-, AI-uitval- en dagmaximumcontroles slagen. Nieuwe voorbeelden voegen geen echte deals toe; private uitwisseling en introducties blijven open.
- 2026-11-16: hervatting na vastlopen: acht toepassingen gelijkgetrokken met de intake (deelverkoop onder verkoop; samenwerking toegevoegd) in NL/EN/DE. Privacy verduidelijkt: vrije tekst kan identificeren en bevoegde beheerders kunnen inhoud beoordelen; privélink is geen exclusieve end-to-end encryptie. Concrete gronden voor aanvullen/afwijzen/verder onderzoeken toegevoegd, altijd menselijke beslissing en geen automatisch toegangsrecht.
- 2026-11-16: publieke browsercontrole en contactdetails-weigering live bevestigd. Nieuwe info-/privépagina’s renderen direct zonder 900ms marketing-wachtlaag. Eigen QA-bronbezoeken niet als organisch resultaat tellen.
- 2026-11-16: functionele tests slagen lokaal en op GitHub Actions Node 24; productie 73436bc READY. Live formulier weigert een technische controle met contactgegevens zonder inzending op te slaan. Visuele controle: flex-volgorde voor nieuwe pagina’s hersteld en dubbele formulierkop verwijderd.
- 2026-11-16: totaalassessment, 9 markten via Demand Radar, acht intentsoorten, 19 herschreven pagina's, 12 informatiepagina's, anonieme intake zonder e-mail/borg, privésleutelbeheer en inhoudelijke AI-proefantwoordcontrole met menselijke beoordeling.
- 2026-11-16: oorspronkelijke overdracht en 19 landingspagina's live; ZICHT, Search Console, IndexNow en stijl-/CTA-proef.
- 2026-11-15: naam gekozen, domein gekocht en eerste vraag-/concurrentieonderzoek.
`;
// Stand uit de live gegevens; alleen aantallen, nooit inhoud van intenties of aanvragen.
export async function overdracht(kv, { proefStand, proefTekst } = {}) {
  const r = { bijgewerkt: OVERDRACHT_DATUM, inhoud: BIJGEWERKT, commit: (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7), commitTekst: String(process.env.VERCEL_GIT_COMMIT_MESSAGE || '').split('\n')[0].slice(0, 160) };
  try { r.verzegeld = +(await kv.get('si:anon-intent-count')) || 0; } catch (e) { r.verzegeld = null; }
  try { r.aanvragen = +(await kv.get('si:anon-partner-count')) || 0; } catch (e) { r.aanvragen = null; }
  try { r.indexnow = await kv.get('si:indexnow'); } catch (e) { r.indexnow = null; }
  try { if (proefStand) { const s = await proefStand(kv, 'sealed'); r.proef = proefTekst ? proefTekst(s) : s; } } catch (e) { r.proef = null; }
  r.proefBereik = 'Marketinginteractie. De historische e-mailstap vervalt in de huidige intake; anonieme inzendingen zijn niet per variant gekoppeld. Geen conclusies over introducties of omzet.';
  const per = {}; for (const p of PAGINAS) per[p.taal] = (per[p.taal] || 0) + 1;
  r.paginas = { informatie: extraPages().length, sitemap: 4+PAGINAS.length+extraPages().length, totaal: PAGINAS.length, per, talen: Object.keys(UI), partij: Object.keys(PARTIJ).map(t => '/' + t + '/' + PARTIJ[t].slug) };
  return r;
}
export function overdrachtTekst(r) {
  const L = ['## Stand nu (live opgebouwd)',
    `- Draaiende versie: ${r.commit || 'onbekend'}${r.commitTekst ? ' (' + r.commitTekst + ')' : ''}. Inhoud bijgewerkt ${r.inhoud}.`,
    `- Pagina's: ${r.paginas.totaal} landingspagina's (${Object.entries(r.paginas.per).map(([t, n]) => t.toUpperCase() + ' ' + n).join(', ')}), hubs ${r.paginas.talen.map(t => '/' + t).join(' ')}, partijpagina ${r.paginas.partij.join(' ')}.`,
    r.verzegeld == null ? '- Verzegelde intenties: niet te lezen.' : r.verzegeld > 0 ? `- Ontvangen anonieme intenties (inclusief eventuele technische tests, geen matchteller): ${r.verzegeld}.` : '- Verzegelde intenties: nog geen.',
    r.aanvragen == null ? '- Aanvragen van partijen: niet te lezen.' : r.aanvragen > 0 ? `- Ontvangen anonieme proefantwoorden van partijen (geen geverifieerde partijen): ${r.aanvragen}.` : '- Aanvragen van partijen: nog geen.',
    r.indexnow ? `- Laatste IndexNow: ${String(r.indexnow.t || '').slice(0, 16).replace('T', ' ')} UTC, status ${r.indexnow.status}, ${r.indexnow.n} adressen, versie ${r.indexnow.versie || '?'}.` : '- Laatste IndexNow: niet bekend.',
    '', '## Clickmind-proef', r.proefBereik || '', r.proef ? (typeof r.proef === 'string' ? r.proef : JSON.stringify(r.proef)) : 'Niet te lezen; zie https://keuzehulp.best/api/mm/proefstand?site=sealed&vorm=tekst'];
  return L.join('\n');
}


