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
    for (const x of g) r.push('  - ' + String(x.t).slice(0, 16).replace('T', ' ') + ': ' + x.samenvatting + ((x.fouten || []).length ? ' (fouten: ' + x.fouten.join('; ') + ')' : ''));
    r.push('');
  }
  r.push('## Bijwerken', '', '- Deze pagina werkt zichzelf bij. Verander je iets aan Clickmind, de modal of het todayin-formulier: zet de regel en de uitleg in de code (lib/overdracht.js) zodat de volgende chat het hier leest.');
  return r.join('\n');
}
