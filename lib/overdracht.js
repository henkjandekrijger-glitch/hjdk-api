// Levende overdracht van Clickmind voor andere chats en sessies (Henkjan 14 okt 2026: "zorg dat dit bekend is op Vercel zodat de
// Todayin-chat dit begrijpt; overdracht die continu geüpdatet wordt"). Wordt bij elke aanvraag opnieuw opgebouwd uit de live
// instellingen en tellers, dus hij loopt nooit achter. Lezen: https://hjdk-api-henq.vercel.app/api/mm/overdracht[?project=todayin|yoors]
import { alleModals, leesModal, modalStand, catalogus } from './modal.js';
import { instelling } from './leer.js';
import { directInst, shopMeet } from './shopdirect.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const HOST = 'https://hjdk-api-henq.vercel.app';

async function lijst(kv, key, n) { try { return ((await kv.raw(['LRANGE', key, 0, n - 1])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean); } catch (e) { return []; } }

export async function overdracht(kv, { project = '' } = {}) {
  const p = String(project || '').toLowerCase(), alles = !p;
  const nu = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const modals = await alleModals(kv).catch(() => []);
  const r = [];
  r.push('# Clickmind: overdracht (live, ' + nu + ' UTC)', '');
  r.push('Deze tekst wordt bij elk bezoek opnieuw opgebouwd uit de live instellingen en cijfers van Clickmind (repo henkjandekrijger-glitch/hjdk-api, Vercel-project hjdk-api). Wat hier staat, is de stand van nu.', '');
  r.push('## Wat Clickmind is', '');
  r.push('- Henkjans systeem dat van elke advertentieklik en elk bezoek op zijn eigen sites leert: klikregister /go, wissel /w, mensmeter, leerronde (elk uur op :12), terugbetalingsdossier (03:40 UTC) en de lerende modal.');
  r.push('- Eén scriptregel per pagina: <script src="https://whichtobuy.best/cm.js" data-site="<site>" async></script>. Optioneel data-interest="<onderwerp van de pagina>" (wordt ingevuld in het todayin-aanbod).');
  r.push('- Overzicht in gewone taal voor Henkjan (netwerken, herkomst per site/app, zones, alle data): ' + HOST + '/api/mm/clickmind. Technisch overzicht en status: ' + HOST + '/api/mm/overzicht (Vercel-inlog; in een Claude-sessie met web_fetch_vercel_url).');
  r.push('- Alle data per dag: /api/mm/export?dag= (kliks via /go, met alle koppen) en /api/mm/export?soort=pagina&dag= (elk paginabezoek, 30 dagen). Herkomst per zone (site, app of push) staat sinds 15 okt in mm:bron:<dag>. Venster 0x0 per zone: /api/mm/venster?dag= (sinds 15 okt telt het zone-oordeel een meerderheid 0x0 met minder dan 5% mens als zwart).');
  r.push('- Ruwe kliklog in Vercel Blob (16 okt): de Redis-database (250 MB) liep vol door ~60 MB ruwe regels per dag. Elk uur verplaatst /api/mm/ruwarchief mm:raw en mm:rawp per dag naar Blob-store clickmind-ruw (privé, gzip, clickmind/<soort>/<dag>/<van>-<tot>.jsonl.gz); van vandaag blijven de nieuwste 300 regels in Redis. Export, terugbetalingsdossier en venster lezen Blob en Redis als één reeks. Stand: /api/mm/ruwstand, geheugen per sleutelgroep: /api/mm/geheugen.');
  r.push('- Voorspellers (16-17 okt, lib/voorspel.js, Henkjan: "bedenk andere variabelen waarmee we kunnen voorspellen wat een klik gaat doen"): per klik via /go en /w en per bezoek op een eigen pagina tellen we uur, weekdag en deel van de maand bij de bezoeker, land, regio, postcodegebied (2 cijfers), taal (en of die past bij het land), provider (ASN), app, besturingssysteem en browser, iOS- en Android-versie, merk, geheugen, kernen, schermbreedte en scherpte, verbinding (wifi of mobiel, databesparing), batterij en lader, donkere modus, nieuw of terug, tijd sinds de vorige klik, kliks en campagnes van dezelfde persoon in 24 uur, leeftijd van de zone en de zoekterm. Tellers in mm:vs:<dag> (bron|voorspeller=waarde|uitkomst) en voor Amazon per tag in mm:vst:<dag>; de voorspellers van een klik staan 30 uur in mm:vf:<cid> (a = server, b = browser) zodat latere uitkomsten (meetpagina geladen, terug binnen 24 uur, echt, actie, aanmelding, koop) meetellen. De leerronde rekent elk uur de lift uit (minstens 30 kliks, Wilson 95%); top 5 op ' + HOST + '/api/mm/clickmind, alles op ' + HOST + '/api/mm/voorspel?dagen=7. Dagen vóór de live tellers aanvullen uit de ruwe log: /api/mm/voorspelruw?dag=JJJJ-MM-DD (eenmalig per dag).');
  r.push('- Lookalikes op uitkomst (18 okt, lib/lookalike.js, Henkjan: "Kunnen we met clickmind goed lookalike clicks vinden nav een aankoop of een aanmelding? Pro actief?" -> "Ja"): les van die dag: echte mensen zijn geen aanmelders (zone 11261241: 93 echte mensen op todayin, 0 aanmeldingen); de oude lijkt-op-winnaar telde elke uitkomst even zwaar en vergeleek alleen OS en uren. Nu per project en land (eerst todayin VS): winnaars = zones met aanmeldingen per echt mens (projecttellers, getest vanaf 8 mensen), 15 mensmeter-kenmerken (mens, interactie, 3 s in beeld, unieke apparaten en IP, datacenter, headless, herhaal, in-app, terug, iOS, uren), kernel-regressie met de projectkans als prior, verwachte aanmeldingen per 1.000 bezoeken en kosten per aanmelding (PropellerAds-klikprijs). Openbaar: https://keuzehulp.best/api/mm/lookalike?project=todayin&land=us. Verkenner: een vaste witte-lijstcampagne per project (todayin VS: 12024558, bod \$0,10) die zichzelf ververst: zone na ~20 echte mensen houden bij een aanmelding of >= 25% onderwerp, anders eruit (14 dagen niet terug); hoogstens 4 nieuwe kandidaten per dag, nooit een lege lijst. Voorstel: /api/mm/verken?sleutel=todayin-us; uitvoerder propellerads-mcp app/api/verken (dagelijks), meldt terug via /api/mm/verkengedaan. MyLevel volgt zodra MyLevel per zone uitkomsten levert (zoals todayins cmdata).');
  r.push('- Amazon-lessen (16 okt, lib/termles.js, /api/mm/termen): (1) pushkopers kopen artikelen van \$15-25; een zoekterm waarvan Amazon vooral producten boven \$40 toont verkoopt niet (ml-push-20: 4.562 kliks, <5 artikelen). /api/mm/termen?k=<zoekterm> geeft mediaanprijs en oordeel. (2) Een tag met 1.500+ Amazon-kliks zonder kopers is geen koper (/api/mm/termen?tag=). (3) Verzadiging: meer campagnes op dezelfde witte lijst geeft meer kliks maar niet meer kopers (bl-bku-20 15 okt: kliks +76%, artikelen +25%, omzet -17%). mdgo slaat bronnen over die op (1) of (2) zakken; de leerronde meldt verzadiging onder amazonVerzadiging.');
  r.push('- Vaste regels: modal aan of uit en wijzigingen in andere repo\'s alleen op Henkjans woord; nooit Amazon in de modal; geen valse haast; controlegroep altijd minstens 10%.', '');

  // ---- lerende modal: waar hij draait ----
  r.push('## Lerende modal: waar hij nu draait', '');
  for (const m0 of modals) {
    const m = await leesModal(kv, m0.site, true).catch(() => m0) || m0;
    const armen = (m.alleArmen || m.armen).map(a => a.id + (a.soort === 'email' ? ' (e-mail, doel ' + a.doel + ')' : a.soort === 'site' ? ' (link)' : ' (controle)')).join(', ');
    r.push('- ' + m.site + ': ' + (m.uit ? 'UIT' : 'AAN') + ' op ' + m.domeinen.join(', ') + '. Aanbod: ' + armen + '. Waarde in centen: hoofdactie ' + N(m.waarde && m.waarde.hoofd) + ', aanmelding ' + N(m.waarde && m.waarde.aanmelding) + '.');
  }
  r.push('');

  // ---- todayin ----
  if (alles || p === 'todayin') {
    const naarTi = [];
    for (const m0 of modals) { const m = await leesModal(kv, m0.site, true).catch(() => m0) || m0; const a = (m.alleArmen || m.armen).filter(x => x.doel === 'todayin' || x.doelSite === 'todayin'); if (a.length) naarTi.push({ m, a }); }
    r.push('## Voor todayin (todayin.email)', '');
    r.push('- Op todayin zelf draait GEEN modal (Henkjan 14 okt: "bij todayin is de Clickmind-modal nu niet wenselijk"). cm.js staat wel op de todayin-pagina\'s voor meting en uitkomsten; de modal-instelling "todayin" staat uit.');
    r.push('- De modal op andere sites stuurt bezoekers ALTIJD naar todayin (Henkjan 14 okt). Twee vormen, de modal leert welke beter werkt, op aanmeldingen:');
    r.push('  1. Directe aanmelding in de modal (doel todayin): de bezoeker vult alleen zijn e-mailadres in. Plaats (uit het IP-adres) en onderwerp (de pagina, data-interest) zijn al ingevuld in de tekst, bijvoorbeeld "Today in San Antonio ... and the latest on air fryers".');
    r.push('  2. Een link naar todayin (aanbod x-todayin uit de catalogus).');
    r.push('- Hoe de aanmelding binnenkomt: hjdk-api (lib/modal.js, todayinAanmelden) post het gewone formulier naar https://todayin.email/api/ti (site/api/_ti.js POST) met de velden email, src=clickmind, campaign=cm-<site>, ts (ms op de pagina, minstens 2000), website (leeg), place en ipcity (stad uit het IP-adres), cc, rg, lat, lon en niche (het onderwerp; todayin maakt er zo nodig een niche-lijst van). Geeft todayin "Place not found", dan nog één keer met alleen de coördinaten. HTTP 200 telt als gelukt.');
    r.push('- Todayin-uitkomsten in Clickmind (15 okt): todayin-advertenties lopen niet via /go of /w, dus geen klik-id. De leerronde haalt elk uur https://todayin.email/api/ti?cmdata=1&dagen=7 op (lib/extern.js): k (onderwerp gekozen) telt als actie en s (aanmelding) als aanmelding per zone in mm:zx:<dag> en per campagne in mm:cx:<dag>, naast mm:zu/mm:cu. Zo kent Clickmind de zones die bij todayin aanmelden (menszones, lijkt-op-winnaar, nooit blokkeren). Zones met 10+ mensen maar nul keuze staan in mm:leer:laatst onder todayinZonderKeuze (alleen melden). Todayin: breek die JSON-vorm niet (site/lib/mine.js cmData).');
    r.push('- Spel-uitkomsten in Clickmind (24 okt, Henkjan: "Zet clickmind in om te voeden en bots te voorkomen"): de Quiz (praisy.me/k) laadt cm.js (data-site spel) met data-net, data-zone, data-campaign en data-subid op de advertentielanding; de leerronde haalt elk uur https://praisy.me/k?cmdata=1&dagen=7 op (zelfde vorm als todayin: v, j, m, k = eerste antwoord, s = gedeeld, nt = eerste antwoord zonder vinger). Spel: breek die JSON-vorm niet (spel/lib/routes/ken.js kenCmData).');
    r.push('- Afspraken voor todayin: breek dit formuliercontract niet (veldnamen en de 200 bij succes). Bron "clickmind" is eigen verkeer (staat in ORGANIC in site/api/_ti.js): geen netwerk-postback, telt niet als betaald. Duitsland: de directe aanmelding wordt daar niet aangeboden (dubbele bevestiging verplicht).');
    if (!naarTi.length) r.push('- Nu nergens een todayin-aanbod actief.');
    for (const { m, a } of naarTi) {
      const st = await modalStand(kv, m, 7).catch(() => []);
      r.push('- Site ' + m.site + ' (' + (m.uit ? 'uit' : 'aan') + '), laatste 7 dagen:');
      for (const arm of a) { const x = st.find(y => y.id === arm.id) || {}; r.push('  - ' + arm.id + ': ' + N(x.n) + ' bezoekers kregen dit aanbod, ' + N(x.toon) + ' keer getoond, ' + N(x.klik) + ' klikken, ' + N(x.aanmelding) + ' aanmeldingen' + (x.dollarPer1000 != null ? ', $' + x.dollarPer1000 + ' per 1.000 bezoekers' : '') + '. Tekst nu: "' + (arm.titel || '') + '" / "' + (arm.tekst || '') + '"'); }
      const c = st.find(y => y.soort === 'geen'); if (c) r.push('  - controlegroep (niets tonen): ' + N(c.n) + ' bezoekers, gewone klik ' + (c.pctHoofd == null ? '-' : c.pctHoofd + '%'));
    }
    const log = await lijst(kv, 'mm:tilog', 10);
    r.push('- Laatste aanmeldpogingen via de modal: ' + (log.length ? '' : 'nog geen.'));
    for (const x of log) r.push('  - ' + String(x.t).slice(0, 16).replace('T', ' ') + ' ' + x.site + ': ' + (x.ok ? 'gelukt' : 'mislukt (' + (x.fout || 'HTTP ' + x.status) + ')') + (x.plaats ? ', met plaats' : ', zonder plaats') + (x.onderwerp ? ', onderwerp "' + x.onderwerp + '"' : ''));
    r.push('- Wijzigen (alleen op Henkjans woord): ' + HOST + '/api/mm/modalbeheer?site=<site>&j=<JSON>. Bekijken: ' + HOST + '/api/mm/modalbeheer?site=whichtobuy. Testen zonder te tellen: zet ?mmm=todayin achter een whichtobuy-pagina.', '');
  }

  // ---- Yoors Shop ----
  if (alles || p === 'yoors' || p === 'shop') {
    const d = await directInst(kv).catch(() => ({ pct: null })), me = await shopMeet(kv).catch(() => ({}));
    r.push('## Voor de Yoors Shop', '');
    r.push('- Directe route: ' + d.pct + '% van de betaalde klikken op keuzehulp.best/shop gaat in één keer (302) naar de productpagina op yoo.rs met hj (winkelwagen en betaling) en mmc (Clickmind). Zie OVERDRACHT-YOORS-SHOP.md in de repo hjdk-api.');
    r.push('- cm.js op yoo.rs (Babita): ' + (me.aan ? 'meet, laatste melding ' + me.laatst : 'nog niet gezien') + '. Zonder die regel geen eerste-tik-conversie voor het netwerk.', '');
  }

  // ---- blokkeren ----
  if (alles) {
    const inst = await instelling(kv).catch(() => ({})), b = (await kv.get('mm:blok:propeller').catch(() => null)) || {}, g = await lijst(kv, 'mm:blokgedaan:propeller', 3);
    r.push('## Blokkeren door Clickmind', '');
    r.push('- Stand: ' + (inst.blokkeren ? 'AAN (Henkjan 14 okt)' : 'uit') + '. Voorstel PropellerAds: ' + (b.zones || []).length + ' zones klaar, ' + (b.wachtOpHenkjan || []).length + ' wachten op Henkjan (grootste bron van een campagne).');
    r.push('- Uitvoering (Henkjan 14 okt: "het moet voor alle MCP\'s werken"): elke netwerkwacht leest het blokvoorstel van zijn netwerk (/api/mm/blok?net=propeller|mondiad|richads|mgid) en zet de zones op de uitsluitlijst van elke campagne waar ze geld kostten, ook campagnes met een eigen lus. Altijd: alleen als blokkeren aan staat, alleen zones die klaar zijn, alleen toevoegen (nooit iets eraf), nooit de grootste bron van een campagne, nooit bij een witte lijst, nooit zones met echte uitkomsten.');
    r.push('  - PropellerAds: de wacht voor alle campagnes (repo propellerads-mcp, lib/ronde.ts, elke 10 minuten) en daarnaast elk uur om :20 app/api/clickmind voor de gemeten campagnes.');
    r.push('  - Mondiad: lib/mdwacht.js in hjdk-api (elke 10 minuten). RichAds: repo richads-mcp, app/api/wacht. MGID: repo richads-mcp, lib/mgid-wacht.ts (beide elke 10 minuten; gedeelde lezer lib/clickmind.ts).');
    r.push('  - Clickadu: geen automatische blokkade (de API is daar niet veilig genoeg); alleen op Henkjans woord.');
    r.push('- Bereik: Clickmind oordeelt alleen over zones die verkeer naar Henkjans eigen pagina\'s of via /go sturen. Campagnes die rechtstreeks naar Amazon linken ziet Clickmind niet zelf, maar ze krijgen wel dezelfde blokkades via de wachten zodra de zone daar geld kost.');
    r.push('- Uurwacht (lib/wachtuur.js, elk uur op :47, Henkjan 16 okt "we laten dingen liggen"): aankomst per netwerk en /go-campagne (afgerekend tegen aangekomen, UTC-dag, plus het laatste uur), geld vandaag naar tags die volgens de Associates-meter geen kopers geven, en verzadiging per tag. Alleen melden; alarm staat bovenaan /api/mm/overzicht en gaat per nieuw alarm naar Henkjans Telegram via todayin-spel /api/meld (sleutel MELD_SLEUTEL in beide projecten). Lezen: /api/mm/wachtuur?lees=1. Mondiad-campagnes pauzeren alleen op Henkjans woord via /api/mm/mdpauze?ids=&reden= (16 okt: de 61 ml-push-20-campagnes).');
    r.push('- Eigen pagina\'s in de uurwacht (lib/eigenwacht.js, Henkjan 17 okt: "zeer goed naar de Yoors Shop- en todayin-campagnes kijken, veel NL-verkeer"): per PropellerAds- en Mondiad-campagne naar yoo.rs, todayin of MyLevel de afgerekende kliks en kosten tegen bezoeken, echte mensen, acties, aanmeldingen en verkopen (mm:c, mm:cu, mm:cx), per project en NL apart, plus de shoptrechter per uur (lib/shopuur.js). Alarm bij kapotte pagina of meting, aankomst onder 30%, geld zonder mens, todayin zonder leden of boven 3x het doel van $0,10 per lid, rode shoplekken en elke shopverkoop. Yoors Shop wordt twee keer gemeten (Clickmind per campagne en de shoptrechter per dag); zien ze iets anders, dan meldt de wacht een meetgat in plaats van valse aankomst-alarmen per campagne. Les 16 okt: de volle database gaf ook bij de shop 12% aankomst (15 okt: 93%), dus eerst de meting controleren voor je een campagne afrekent.');
    r.push('- Per uniek mens (lib/mensgeld.js, Henkjan 17 okt: "wat kunnen we nog meer uit een klik halen, zeker als het een mens is"): /api/mm/mensgeld?dag= zet per netwerk, land en tag de kliks naast de unieke personen, herhaalkliks, kosten per uniek mens en het geld naar mensen die we die dag al hadden; per tag ook verdiend per mens. 15 okt: PropellerAds DE 1,82 kliks per mens, $9,64 van $21,40 naar al bereikte mensen (PA-campagnes hebben geen frequentiegrens, Mondiad 1 per 24 uur: 1,03-1,09 per mens). /api/mm/overlap: welke zoektermen dezelfde mensen aanklikken (bijgehouden in /go, mm:kwp). Alleen meten; frequentie of targeting wijzigen alleen op Henkjans woord.');
    r.push('- Clickmind-publiek / remarketing (lib/retarget.js; Henkjan 17 okt: "Ik wil dat we via clickmind altijd intelligent remarketing kunnen doen"): de publieks-pixel van een netwerk gaat alleen af bij bewezen echte mensen, alleen in de VS, nooit bij Global Privacy Control of Do Not Track, nooit in EU/VK/CH zonder toestemming, alleen op sites met privacytekst en afmeldknop (whichtobuy, /go, mylevel). Segmenten naar diepte van gedrag (?seg=): echt (bewezen mens), warm (gratis deel af, aanmelding, plan of terugkomst), heet (betaalmethode gekozen zonder koop), koper (wordt UIT alle publieken van zijn project gehaald met f=off). Publiek per segment: netwerken.propeller.publieken["<project>-<segment>-<land>"], valt terug op "<project>-<land>". Intelligent: remarket eerst heet, dan warm, dan echt; elke remarketingcampagne landt met src=rt zodat de site terugkomers en verkoop per segment telt; geld gaat naar het segment met de meeste verkoop (anders terugkomers) per dollar, met de stopregel van de campagneskill. Instelling en stand: /api/mm/retarget (?j= om te zetten). PropellerAds: publiek maken alleen in het dashboard (Audiences, pixel, Get code; max 15 per account, 90 dagen), partner-id hier zetten. MyLevel roept /api/mm/rt aan na 2 echte antwoorden, bij warm, bij betaalmethode en bij koop. Campagneskill live: https://propellerads-mcp.vercel.app/api/skill (MCP-tool campagne_skill).');
    for (const x of g) r.push('  - ' + String(x.t).slice(0, 16).replace('T', ' ') + ': ' + x.samenvatting + ((x.fouten || []).length ? ' (fouten: ' + x.fouten.join('; ') + ')' : ''));
    r.push('');
  }
  r.push('## Budget en winst (Henkjan 17 okt 2026)', '');
  r.push('- "Plafond 100 idd en test projecten zoals mylevel en today in op max 20 per dag. Voor max 10 dagen. Anders niet geslaagd project OF ik moet expliciet zeggen we breken de regel open." En: "Campagne moet altijd optimaliseren op profit."');
  r.push('- De centrale budgetwacht (repo propellerads-mcp, lib/budget.ts; MCP-tool budget_stand) telt per budgetdag (05:00 UTC) alle netwerken: per saldo (kosten min gegarandeerde omzet) hoogstens $100; elk testproject (MYLEVEL, TODAYIN, SPEL, SHOP-LUS, OVERIG) hoogstens $20 per dag en 10 dagen vanaf 18 okt, daarna per saldo quitte of alles van dat project stil tot Henkjan de regel openbreekt. Gegarandeerde omzet: Amazon-blanket kliks x geleerde opbrengst per klik, verkoop-postback verkopen x netto; aanmeldingen tellen als 0.');
  r.push('- Clickmind valt eronder: een remarketing- of Clickmind-campagne is een campagne van zijn project (telt mee in diens $20) en start niet als budget_stand dat project op dagplafond of niet geslaagd zet. Blokkeren blijft altijd mogen. Clickmind rangschikt zones en bronnen op winst per dollar waar een project omzet meet, anders op de stap het dichtst bij omzet.');
  r.push('');
  r.push('## Bijwerken', '', '- Werk je aan de campagnes zelf (Amazon-blanket, Yoors, Mondiad, CTR-tests)? Lees dan eerst de handover met stand, open punten en werklog: ' + HOST + '/api/mm/handover, en schrijf aan het eind wat je deed: ?log=<tekst>&wie=<chat>.');
  r.push('- Deze pagina werkt zichzelf bij. Verander je iets aan Clickmind, de modal of het todayin-formulier: zet de regel en de uitleg in de code (lib/overdracht.js) zodat de volgende chat het hier leest.');
  return r.join('\n');
}
