// Dashboard voor alle projecten (Henkjan 25 nov 2026: "Maak een klikbaar dashboard voor alle projecten met planning en
// overdracht logboeken en doelstelling En wat de progressie is . Die gebruik ik dus vr alle projecten." en "moet draaien op
// vercel dit plan zodat bereikbaar voor ieder account onafh computer").
// Eén pagina: per project het doel, de voortgang, de planning, de overdracht en het logboek. Draait op Vercel, dus elk account
// en elke chat leest en schrijft hetzelfde.
//   Lezen:    https://hjdk-api-henq.vercel.app/api/mm/dashboard   (?vorm=json of ?vorm=tekst voor een chat; ?project=<id> voor één project)
//   Schrijven: /api/mm/dashboard?zet=<JSON>   met {"project":"kdp", ...} en alleen de velden die veranderen:
//     doel (tekst), nu en doelgetal (getallen) met eenheid en gemeten (tekst), plan ([{"d":"2026-11-27","t":"wat","klaar":false}], vervangt de lijst),
//     klaar (tekst of datum van één planregel die af is), erbij ({"d":..,"t":..} één planregel erbij),
//     taken ([{"naam":..,"waar":"Vercel-cron|Claude-taak|hand","wanneer":..,"wat":..,"link":..}], vervangt de lijst: alles wat vanzelf draait, Henkjan 25 nov "zet alles wat je doet in dashboard dus geplande taken en andere taken zodat alles onafh comp en account"),
//     naam, wat, overdracht ([[naam,url]]), site, logs (["kdp"]: begin van de naam waarmee chats in het werklog schrijven).
//   Logboek: het bestaande werklog (/api/mm/handover?log=<tekst>&wie=<project>-<chat>); het dashboard toont per project de regels
//   waarvan de naam met een van zijn logs begint, plus de deploys waarvan de commitregel het project noemt.
//   Archiveren (Henkjan 25 nov: "zorg dat ik makkelijk een project kan archiveren dus niet meer zie"): knop Archiveer bij elk project, of
//   ?archiveer=<id>; terug met ?terug=<id> of de knop onder Archief. Een gearchiveerd project staat niet meer in het overzicht, de planning of de tekst.
//   Vormgeving: die van sealedintent.com (lib/sealed.js CSS: Inter, 680 px, inkt #0B1640, accent #2B47C4, ronde knoppen, dunne lijnen).
//   Verder in Claude (Henkjan 25 nov: "Als ik klik op een project opent claude op juiste project of nieuwe start en schiet ik meteen context claude in"):
//   elke rij en elke kaart heeft de knop Verder in Claude. Die opent een nieuwe sessie met de repo erbij (claude.ai/code/new?q=&repo=) en de opdracht
//   al ingevuld: dashboard en overdracht lezen, doel, eerstvolgende stap, werklog. Heeft het project een eigen Claude-project (zet "claude":"https://claude.ai/project/<id>"),
//   dan opent de knop dat project met dezelfde opdracht. Clickmind meet zijn voortgang zelf uit de uurwacht (mm:wachtuur:laatst), zonder chat.
// De vaste lijst hieronder is het begin; wat een chat met zet opslaat (kv mm:dash:<id>) gaat voor. Geen sleutels of geheimen.

import { zetGeld, geldData, opvallend, schoonVast } from './dashgeld.js';
import { doelKeten, ketenTekst, doelDag } from './doelketen.js';
import { leesSkill } from './skills.js';

const HOST = 'https://hjdk-api-henq.vercel.app';
const DASH = 'mm:dash:';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const kort = (x, n) => String(x == null ? '' : x).slice(0, n);
const vandaag = () => new Date(Date.now() - 4 * 36e5).toISOString().slice(0, 10); // Curaçao (UTC-4)
const getal = x => { const n = Number(x); return Number.isFinite(n) ? n : null; };

// De leerprompt: hoe elk project zelfstandig naar zijn doel werkt (Henkjan 25 nov 2026: "intelligent autonoom compounding bouwen aan het doel 24/7",
// "Zet deze leer prompt ook ih dashboard zodat ik die als oversight kan wijzigen"). Dit is versie 1; wat Henkjan op het dashboard opslaat (kv mm:dash:leerprompt) gaat voor.
// Skills (Henkjan 25 nov 2026: "Zet alle skills ... in een overzicht om aan te roepen"): de bron staat in de repo (.claude/skills/<naam>/SKILL.md), los van een Claude-account.
// Elke chat leest een skill met ?vorm=skill&naam=<naam>. Een nieuwe skill = map in .claude/skills en een regel hier.
// Startopdracht voor een chat die alleen de dashboardlink krijgt (Henkjan 26 nov 2026: "als ik dashboard link geef vind de chat dan de overdracht prompt ? Maak dat wel zo").
// Staat als commentaar bovenaan de HTML, bovenaan ?vorm=tekst en los op ?vorm=start; de projectenlijst komt live uit het dashboard.
export function startTekst(d) {
  const lijst = (d && d.projecten || []).map(p => '- ' + p.id + ': ' + p.naam + (p.doel ? '' : ' (nog geen doel)')).join('\n');
  return ['STARTOPDRACHT VOOR EEN CHAT (Henkjan gaf je deze link: begin hier)',
    '',
    '1. Kies het project. Noemt Henkjan het niet, vraag welk project uit deze lijst (id: naam):',
    lijst,
    '2. Lees met web_fetch_vercel_url ' + HOST + '/api/mm/dashboard?vorm=tekst&project=<id> : doel, stand, planning, geld, overdracht, logboek en onderaan de leerprompt. Werk volgens die leerprompt: jij bent eigenaar van het doel.',
    '3. Open de overdracht die daar onder Overdracht staat en lees de skill die bij je werk past (' + HOST + '/api/mm/dashboard?vorm=skill&naam=<naam>; lijst onderaan ?vorm=tekst). Werk je in de repo henkjandekrijger-glitch/hjdk-api, lees ook CLAUDE.md. Die regels gaan voor.',
    '4. Meet het getal van nu, zoek het grootste lek, kies de actie met de meeste waarde per kost en maak die af: live, getest, met een controle die zelf meet.',
    '5. Schrijf in dezelfde beurt bij: dashboard (' + HOST + '/api/mm/dashboard?zet={"project":"<id>",...}: meting, planregel af en erbij, geld van de dag) en werklog (' + HOST + '/api/mm/handover?log=<wat je deed en wat er ligt>&wie=<id>-<chat>).',
    '6. Omzet en minder churn gaan altijd voor. Geld uitgeven, campagnes stoppen, mail versturen, iets live zetten wat uit stond of het doel wijzigen: alleen op Henkjans woord. Geen doel: stel er een voor (een zin, een getal, een datum) en wacht op zijn ja.',
    '7. Rapport aan Henkjan: hooguit zes regels, Nederlands, gewone taal, alleen wat bewoog, met links naar de live pagina\'s.'].join('\n');
}

export const SKILLS = [
  { naam: 'vraagsignalen', kort: 'Demand Radar', dienst: 'https://demandradar-ivory.vercel.app/', voor: 'aparte dienst voor de vraagsignalen (Henkjan 25 nov 2026): waar al vraag is in NL, DE en US en waar AI nog geen goed antwoord geeft; eerst hier kijken voor je een campagne, product, titel of prijs kiest' },
  { naam: 'campagnes-henkjan', kort: 'Campagnes', voor: 'elk werk aan advertentiecampagnes op elk netwerk: aanmaken, zones, bewaken, verspilling, echte mensen, rapport' },
  { naam: 'clickmind', kort: 'Clickmind', voor: 'alles wat van kliks leert: klikregister /go, wissel /w, lerende modal, leerronde, terugbetaling' },
  { naam: 'zicht-seo-llm', kort: 'Zicht', voor: 'gevonden worden in Google en Bing en genoemd worden door AI-assistenten' },
  { naam: 'mail-lerend', kort: 'Mailmind', voor: 'elke mail die namens Henkjan de deur uit gaat, los of in aantallen' },
  { naam: 'leerlus', kort: 'Leerlus', voor: 'een zelflerende lus bouwen of bijsturen op een site, funnel, mailreeks of campagne' },
  { naam: 'keuzehulp-bouw', kort: 'Keuzehulp bouwen', voor: 'een keuzehulp kiezen, maken, verbeteren of onderhouden' },
  { naam: 'keuzehulpen-groei', kort: 'Keuzehulpen groei', voor: 'de dagronde die de keuzehulpen elke dag laat groeien' },
  { naam: 'x-reply-en-groei', kort: 'X', voor: 'reacties op X beantwoorden en gericht reageren bij anderen' },
];
export const skillUrl = n => HOST + '/api/mm/dashboard?vorm=skill&naam=' + n;
export function skillsLijst() { return SKILLS.map(s => ({ ...s, url: skillUrl(s.naam), staat: !!leesSkill(s.naam) })); }
export function skillTekst(naam) { return SKILLS.some(s => s.naam === naam) ? leesSkill(naam) : null; }

export const LEERPROMPT = "LEERPROMPT VOOR ELK PROJECT\n\nJij bent eigenaar van het doel van dit project. Niet van een taak: van het doel. Je werkt er zelfstandig naartoe, elke ronde een stap, tot het gehaald is. Alles mag daarvoor worden ingezet: content, code, UX, data, vindbaarheid in Google en AI, distributie, prijs, een andere route.\n\nRANGORDE\nOmzet staat altijd voorop: meer omzet en minder churn (klanten, lezers en abonnees die blijven) is prioriteit 1, in elk project. Kies bij twijfel de actie die het snelst echt geld oplevert of behoudt. Een bestaande klant of lezer houden gaat voor een nieuwe winnen. Botst jouw doel met dat van een ander project, dan gaat het project voor dat de meeste omzet maakt of redt.\n\n1. BEGIN ELKE RONDE BIJ DE STAND\nLees het dashboard van je project, de overdracht en het logboek. Je hebt geen geheugen: wat niet is opgeschreven, bestaat niet. Bouw voort op wat andere chats deden, maak niets ernaast.\n\n2. MEET EERST\nWat is het getal nu, tegen het doel en tegen de vorige ronde? Klopt de meting niet of ontbreekt hij, dan is de meting repareren je eerste werk. Zonder hard getal geen oordeel.\n\n3. ZOEK HET GROOTSTE LEK\nLoop de keten af van eerste contact tot uitkomst. Waar valt het meeste weg? Daar werk je. Niet waar het werk leuk of makkelijk is.\n\n4. KIES OP WAARDE\nBedenk minstens drie acties, ook een die een heel andere route neemt. Schat per actie: hoeveel dichter bij het doel, hoe zeker, wat kost het (tokens, geld, bouwtijd, Henkjans aandacht). Doe de actie met de meeste waarde per kost. Schrijf vooraf op wat je verwacht dat het getal doet.\n\n5. MAAK HET AF\nAf is: live, getest, met een controle die zelf meet of het werkt. Half werk is erger dan geen werk. Kijk je eigen werk na alsof het van een ander is, op de pagina zelf en met het getal, niet op gevoel.\n\n6. LAAT IETS ACHTER DAT BLIJFT WERKEN\nElke ronde moet de volgende goedkoper of beter maken: een les in de overdracht of skill, een meting die voortaan vanzelf loopt, een test, een herbruikbaar onderdeel. Zoek niets twee keer uit. Wat werkt, automatiseer je op Vercel zodat het zonder chat doorloopt. Wat niet werkte schrijf je ook op, met het getal.\n\n7. SCHRIJF BIJ\nDashboard: de meting van nu, planregels af en erbij, altijd een eerstvolgende stap met datum. Geld: de kosten en de opbrengst van de dag per post, zodra je ze ziet. Werklog: wat je deed, wat het getal deed tegen je verwachting, wat je leerde.\n\nWAT HENKJAN NIET WEET DAT HIJ NIET WEET\nElke maandag, en altijd als het getal twee rondes niet beweegt, beantwoord je kort:\n- Meten we het goede? Kan het getal stijgen terwijl het echte doel (geld, echte mensen, vertrouwen) niet dichterbij komt?\n- Welke aanname onder dit doel is nooit getest?\n- Wat doen de besten ter wereld hier anders? Zoek het op.\n- Wat kan morgen wegvallen: een account, een platform, een sleutel, een computer, een regel van Google of Amazon?\n- Zit dit project een ander project van Henkjan in de weg, of kan het er een helpen?\n- Is er een route die tien keer zo snel is, ook als die het huidige plan overbodig maakt?\nMeld de drie belangrijkste aan Henkjan, met wat je er zelf al aan doet.\n\nZUINIG, NOOIT KRENTERIG\n- Lees eerst wat er al is. Neem de kleinste proef die een echt antwoord geeft. Doe zelf wat je zelf kunt, geen betaalde AI of dienst als het zonder kan. Eén push per afgeronde taak.\n- Bezuinig nooit op meten, op nakijken, of op de stap die het doel direct dichterbij brengt. Eén dure actie met groot effect gaat voor tien goedkope zonder effect. Tokens zijn er om waarde te maken: een ronde zonder blijvend resultaat is de duurste.\n- Draait iets rond zonder dat het getal beweegt: stop ermee, zeg het, kies iets anders.\n\nWAARDE ALS ER NOG GEEN OMZET IS\nLevert je project nog geen geld op maar wel lezers, aanmeldingen of leads, schat dan wat één zo'n uitkomst waard is in dollars. Doe dat uit de context: wat levert een lezer per jaar op, wat betaalt een adverteerder of partner, hoeveel blijven er na een maand. Zet het bedrag met je redenering in één zin op het dashboard (zet waarde) en stel het bij zodra je meer weet. Schat liever te laag dan te hoog. Geschatte waarde staat apart van echt geld en telt nooit als omzet. Je volgende stap is altijd: de schatting vervangen door echte omzet.\n\nGELD\nGeld uitgeven doe je niet zelf. Heb je campagnebudget nodig, vraag het Henkjan in vier regels: bedrag en duur, wat je verwacht dat het oplevert, hoe je het meet, bij welk getal je stopt. Werk ondertussen door aan alles wat geen geld kost.\n\nGRENZEN\n- De regels in CLAUDE.md en in de overdracht van je project gaan voor deze tekst. Wat daar op Henkjans woord wacht, wacht.\n- Niets de deur uit namens Henkjan (mail, posts op zijn naam) zonder zijn ja. Nooit wachtwoorden of sleutels typen of tonen.\n- Wat niet terug te draaien is, vraag je eerst: verwijderen, live zetten wat uit stond, prijzen, alles met een account dat geblokkeerd kan worden.\n- Verzin niets: geen cijfers, reviews, bronnen of resultaten. Werk nooit aan het getal in plaats van aan het doel. De meting pas je alleen aan om hem eerlijker te maken, en dat meld je.\n- Loop je vast: hooguit één nieuwe poging op dezelfde manier, daarna een andere aanpak of melden. Nooit langer dan 15 minuten op één mogelijke fout.\n\nRAPPORT AAN HENKJAN\nHooguit zes regels, gewoon Nederlands, alleen wat bewoog: het getal nu tegen doel en vorige keer, wat je deed, wat het opleverde tegen je verwachting, wat je leerde, wat je nu gaat doen, wat je van hem nodig hebt (met link).\n\nHEEFT JE PROJECT GEEN DOEL\nStel er een voor: één zin, één getal, één datum, met het getal van nu. Zet het als advies op het dashboard en wacht op Henkjans ja. Bouw ondertussen de meting.";
const LP = 'mm:dash:leerprompt';
export async function leesLeerprompt(kv) { const v = await kv.get(LP).catch(() => null); return v && v.tekst ? v : { tekst: LEERPROMPT, bijgewerkt: '', wie: 'versie 1', vorige: '' }; }
export async function zetLeerprompt(kv, tekst, wie = '') {
  const t = String(tekst == null ? '' : tekst).replace(/\r/g, '').trim(); if (t.length < 200) return { ok: false, fout: 'te kort: de leerprompt moet minstens 200 tekens zijn' }; if (t.length > 12000) return { ok: false, fout: 'te lang: hoogstens 12.000 tekens' };
  const oud = await leesLeerprompt(kv); if (oud.tekst === t) return { ok: true, gelijk: true };
  await kv.set(LP, { tekst: t, bijgewerkt: new Date().toISOString(), wie: kort(wie || 'Henkjan', 60), vorige: oud.tekst }); return { ok: true, tekens: t.length };
}
export async function vorigeLeerprompt(kv) { const v = await leesLeerprompt(kv); if (!v.vorige) return { ok: false, fout: 'geen vorige versie' }; return zetLeerprompt(kv, v.vorige, 'vorige versie terug'); }

export const PROJECTEN = [
  { id: 'kdp', naam: 'KDP-boeken', wat: 'Amazon KDP en Amazon Ads voor de boekenplank (287 titels).', site: 'https://kdpreports.amazon.com/royalties',
    doel: '$200 royalty per dag, ook na januari (ongeveer $6.000 per maand).', nu: 47, doelgetal: 200, eenheid: '$ per dag', gemeten: '18-24 nov 2026',
    overdracht: [['Overdracht en plan boekenplank', HOST + '/api/wtb?op=kdpoverdracht']], logs: ['kdp'], woorden: /\bkdp\b/i,
    plan: [
      { d: '2026-11-27', t: 'Oordeel PIT BOSS op voorgesteld bod: ads boven 40% van de PIT BOSS-royalty = terug naar $0,75.' },
      { d: '2026-11-28', t: 'Oordeel Australië (Enoch en Teens AU) op de 40%-regel.' },
      { d: '2026-11-28', t: 'Oordeel Lasting Change NIEUWJAAR: $15 zonder verkoop = generieke woorden terug naar $0,30.' },
      { d: '2026-11-29', t: 'Oordeel Adults VS.' },
      { d: '2026-11-30', t: 'Eerste twee instructieproeven: Adults en Definitive Apocrypha.' },
      { d: '2026-12-01', t: 'Lasting Change-omschakeling: broad-woorden aan, AUTO Loose naar voorgesteld bod.' },
      { d: '2026-12-01', t: 'Maandtoets: royalty november tegen $6.000 en het seizoenboek voor de volgende 8 weken.' },
      { d: '2026-12-18', t: 'Einde kerstvenster Teens en Adults: terugschakelen en afrekenen.' },
    ] },
  { id: 'wam', naam: 'We Are Many', wat: 'Dossiersite wearemany.now: klachten bundelen per bedrijf, plus de chat.', site: 'https://wearemany.now',
    doel: '1.000 organische bezoeken per dag op 31 december 2026 (betaald telt apart).', doelgetal: 1000, eenheid: 'organische bezoeken per dag',
    overdracht: [['Overdracht WAM', HOST + '/api/wam?op=overdracht'], ['Overdracht dossiersite', HOST + '/api/wam?op=doverdracht'], ['Stand dossiers', HOST + '/api/wam?op=dstand']], logs: ['wam'], woorden: /\bwam\b|we are many/i,
    plan: [{ d: '2026-12-01', t: 'Hercontrole vindbaarheid nieuwe NL-pagina\'s (Postcode Loterij, NS, Flanderijn, incassokosten).' }, { d: '2026-12-08', t: 'Tweede hercontrole vindbaarheid.' }, { d: '2026-12-31', t: 'Noordster: 1.000 organische bezoeken per dag.' }] },
  { id: 'keuzehulpen', naam: 'Keuzehulpen', wat: 'keuzehulp.best, whichtobuy.best en kaufberater.best: groei via Google en AI-assistenten.', site: 'https://keuzehulp.best',
    overdracht: [['Levende overdracht', HOST + '/api/kz?op=overdracht'], ['Skill dagelijkse groei', HOST + '/api/zicht?op=skill&naam=keuzehulpen-groei'], ['Skill bouwen', HOST + '/api/zicht?op=skill&naam=keuzehulp-bouw'], ['Skill vindbaarheid', HOST + '/api/zicht?op=skill']], logs: ['kz', 'keuzehulp', 'zicht', 'groei'], woorden: /keuzehulp|whichtobuy|kaufberater|\bzicht\b/i },
  { id: 'curacao', naam: 'curacao.day', wat: 'Bedrijvengids, gidsen als nieuws en de chat op curacao.day.', site: 'https://curacao.day',
    overdracht: [['Overdracht bedrijfspagina\'s', HOST + '/curacao-gids?op=bzoverdracht'], ['Tikken per blok', HOST + '/curacao-gids?op=uxstand'], ['Vindbaarheid', HOST + '/api/gsc?op=curvind']], logs: ['cur', 'curacao', 'todayin'], woorden: /cura[cç]ao|\bcur\b|bedrijvengids/i },
  { id: 'kadoly', naam: 'Kadoly', wat: 'Webshop kadoly.com: gids en redactie, Spaarpot, Samen sparen en clubs.', site: 'https://gids.kadoly.com',
    overdracht: [['Overdracht Spaarpot', HOST + '/api/gids?op=dkoverdracht'], ['Overdracht Samen sparen', HOST + '/api/gids?op=ss&overdracht=1'], ['Stand redactie', HOST + '/api/gids?op=redstand']], logs: ['redactie', 'spaarpot', 'spaar', 'kadoly'], woorden: /kadoly|spaarpot|samen sparen/i },
  { id: 'sealed', naam: 'Sealed Intent', wat: 'sealedintent.com: bedrijfsverkoop met kopers.', site: 'https://sealedintent.com',
    overdracht: [['Overdracht', 'https://sealedintent.com/overdracht']], logs: ['sealed'], woorden: /sealed/i },
  { id: 'chirurgie', naam: 'Keuzehulp chirurgie', wat: 'Rankings van klinieken op whichtobuy.best/surgery, keuzehulp.best/chirurgie en kaufberater.best/chirurgie.', site: 'https://keuzehulp.best/chirurgie/nl',
    overdracht: [['Levende overdracht', 'https://keuzehulp.best/chirurgie/overdracht']], logs: ['surgery', 'chirurgie'], woorden: /chirurgie|surgery/i },
  { id: 'nexy', repo: 'henkjandekrijger-glitch/clickmind-distribution', meet: 'https://nexy.now/api/redactie?merk=nexy&vorm=voortgang', naam: 'Nexy distributie', wat: 'Onbetaalde distributie voor Nexy (VS en NL): posts op alle socials volgens een lerend dagrooster, nexy.now en nexy.help, redactie en de proef op de landingspagina. Betaald komt er later bij.', site: 'https://nexy.now',
    doel: 'Op 31 december 2026 gemiddeld 50 mensen per dag (7 dagen) die via onbetaalde kanalen op nexy.now of nexy.help doorklikken naar de App Store, Google Play of de webapp. Betaald telt apart.', doelgetal: 50, eenheid: 'doorkliks naar store of webapp per dag (7-daags gemiddelde, onbetaald)',
    overdracht: [['Verkeer vandaag', 'https://nexy.now/api/redactie?merk=nexy&vorm=uur'], ['Rooster VS en NL', 'https://nexy.now/api/redactie?merk=nexy&vorm=rooster'], ['Reacties die op je ja wachten', 'https://nexy.now/api/redactie?merk=nexy&vorm=reacties'], ['Redactie van vandaag', 'https://nexy.now/api/redactie?merk=nexy&vorm=tekst'], ['Proefstand landingspagina', HOST + '/api/mm/proefstand?site=nexylp&vorm=tekst'], ['Kanalen en koppelingen', 'https://nexy.now/api/stand']], logs: ['nexy'], woorden: /nexy/i,
    plan: [
      { d: '2026-11-26', t: 'Eerste Facebook-reel, Instagram-story, LinkedIn-carrousel en -peiling geplaatst en gecontroleerd.' },
      { d: '2026-11-26', t: 'WhatsApp-kanaal: QR scannen (Henkjan) en MCP_SECRET als gedeelde Vercel-variabele.' },
      { d: '2026-12-01', t: 'Weekmeting: welke vorm, welk vak (VS of NL) en welke tactiek wint; tempo naar de winnaars.' },
      { d: '2026-12-02', t: 'LinkedIn: 50 uitnodigingen aan NL- en EU-connecties als het beter draait (Henkjan 25 nov).' },
      { d: '2026-12-08', t: 'Tussendoel 15 doorkliks per dag.' },
      { d: '2026-12-15', t: 'Tussendoel 25 doorkliks per dag; Threads erbij.' },
      { d: '2026-12-22', t: 'Tussendoel 40 doorkliks per dag.' },
      { d: '2026-12-31', t: 'Doel: 50 doorkliks per dag (7-daags gemiddelde).' }
    ],
    taken: [
      { naam: 'Ronde per merk', waar: 'Vercel-cron', wanneer: 'elke 15 minuten', wat: 'Posts volgens het lerende rooster (VS en NL), vormen en tactieken per platform, Clickmind-link onder elke post, IndexNow; redactie schrijft vanaf 11:00 UTC nieuwe pagina\'s.', link: 'https://nexy.now/api/redactie?merk=nexy&vorm=log' },
      { naam: 'Dashboard en reacties', waar: 'Vercel-cron', wanneer: 'elk uur', wat: 'Zet de voortgang hier bij en haalt reacties op onze posts op met een antwoordvoorstel (plaatsen na Henkjans ja).', link: 'https://nexy.now/api/redactie?merk=nexy&vorm=reacties' },
      { naam: 'Proef landingspagina (Clickmind)', waar: 'Vercel-cron', wanneer: 'doorlopend', wat: 'Kop, ondertitel (tagline), storeknop en bewijs leren per bezoeker.', link: HOST + '/api/mm/proefstand?site=nexylp&vorm=tekst' },
      { naam: 'ZICHT en Demand Radar', waar: 'Vercel-cron', wanneer: 'dagelijks 05:30 UTC', wat: 'Vindbaarheid van nexy.now en nexy.help in Google en AI-assistenten; zoektermen naar de vaste pagina.', link: HOST + '/api/zicht?op=stand' },
      { naam: 'Uurrapport in de chat', waar: 'Claude-taak', wanneer: 'elk uur 12-23 UTC', wat: 'Kort verkeersrapport aan Henkjan in de chat Distributie. Hangt aan het Claude-account; dezelfde cijfers staan hier zonder chat.' },
      { naam: 'Dagronde Nexy', waar: 'Claude-taak', wanneer: 'dagelijks 08:13 Curaçao', wat: 'Redactie en proef nakijken, en de voorraad posts aanvullen met de tokens van de Claude-chat (lib/voorraad.js in clickmind-distribution): de motor pakt die eerst, de AI Gateway is alleen terugval (Henkjan 26 nov 2026).' }
    ] },
  { id: 'nexyplatform', naam: 'Nexy', wat: 'Het Nexy-platform zelf: app, infrastructuur, diensten en team. Hier staan alle kosten van Nexy op een rij.', site: 'https://nexy.now', overdracht: [], logs: ['nexyplatform'], woorden: /nexy-platform|nexyplatform/i },
  { id: 'clickmind', naam: 'Clickmind', wat: 'Leert van elke klik wie een echt mens is en wat hij doet, en stuurt daarmee elke campagne naar de juiste mensen voor het minste geld.', site: HOST + '/api/mm/clickmind',
    advies: 'Van elke 100 betaalde kliks eindigen er 5 in een uitkomst (aanmelding of verkoop), over alle campagnes samen, op 31 december 2026. Dat is het doel van Clickmind in één getal: de juiste mensen zo goedkoop mogelijk. Het telt zichzelf uit de uurwacht, dus geen chat nodig om het bij te houden.', doelgetal: 5, eenheid: 'uitkomsten per 100 betaalde kliks',
    overdracht: [['Overdracht Clickmind', HOST + '/api/mm/overdracht'], ['In gewone taal', HOST + '/api/mm/clickmind'], ['Alles op één pagina', HOST + '/api/mm/overzicht']], logs: ['clickmind', 'cm', 'mm'], woorden: /clickmind|mensmeter|\bwissel\b/i },
  { id: 'campagnes', naam: 'Campagnes', wat: 'PropellerAds, Mondiad, RichAds en MGID: budget, wachten en de uurlijkse verspillingscheck.', site: HOST + '/api/mm/handover',
    overdracht: [['Handover campagnes', HOST + '/api/mm/handover']], logs: ['campagne', 'chat', 'wacht', 'dbwacht'], woorden: /propeller|mondiad|richads|mgid/i },
  { id: 'shop', naam: 'Yoors Shop', wat: 'Campagnes naar yoo.rs/shop met de lerende lus.', site: 'https://yoo.rs/shop',
    overdracht: [['Overdracht', HOST + '/api/shop/overdracht']], logs: ['shop', 'yoors'], woorden: /yoors|\bshop\b/i },
  { id: 'content', naam: 'Content en distributie', wat: 'stockingbooks.com, lastingchange.works, Pinterest voor de boeken en dagelijkse artikelen.', site: 'https://stockingbooks.com',
    overdracht: [['Overdracht met stand', HOST + '/api/bs?op=content']], logs: ['content', 'bs', 'pin'], woorden: /stockingbooks|bookstuffers|pinterest|lastingchange/i },
  { id: 'tk', repo: '', naam: 'taniakross.media', wat: 'Dossier Muziek als medicijn met elke dag een artikel.', site: 'https://taniakross.media',
    overdracht: [['Overdracht', HOST + '/api/wtb?op=tkoverdracht']], logs: ['tk'], woorden: /taniakross|muziek als medicijn/i },
  { id: 'mail', naam: 'Mail (POST-lus)', wat: 'Elke mail namens Henkjan gaat eerst langs de regels.', site: HOST + '/api/post?op=stand',
    overdracht: [['Stand van alle mail', HOST + '/api/post?op=stand'], ['Regels', HOST + '/api/post?op=regels&t=1'], ['Skill', HOST + '/api/post?op=skill']], logs: ['post', 'mail'], woorden: /\bmail\b|postlus/i },
  { id: 'mylevel', naam: 'MyLevel', wat: 'mylevel.today: van advertentie tot betaling.', site: 'https://mylevel.today',
    overdracht: [['Lekketen', HOST + '/api/mm/lekketen?project=mylevel&vorm=tekst']], logs: ['mylevel'], woorden: /mylevel/i },
  { id: 'kosten', naam: 'Kosten en lussen', wat: 'De kostenwacht houdt elke 2 uur de open lekken per post en project bij.', site: 'https://opruimlus.vercel.app/overdracht',
    overdracht: [['Overdracht opruimlus', 'https://opruimlus.vercel.app/overdracht'], ['Router gezond', HOST + '/api/routergezond']], logs: ['opruim', 'kosten'], woorden: /opruim|kostenwacht/i },
];

const schoonPlan = l => (Array.isArray(l) ? l : []).map(x => (x && typeof x === 'object' ? { d: /^\d{4}-\d{2}-\d{2}$/.test(String(x.d || '')) ? String(x.d) : '', t: kort(x.t, 400).trim(), klaar: !!x.klaar } : null)).filter(x => x && x.t).slice(0, 60);

// Schrijven: alleen de velden die meegestuurd worden veranderen.
export async function zetDash(kv, b, wie = '') {
  const id = String((b && b.project) || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30); if (!id) return { ok: false, fout: 'project ontbreekt' };
  const vast = PROJECTEN.find(p => p.id === id);
  const oud = (await kv.get(DASH + id).catch(() => null)) || {};
  const v = Object.assign({}, oud);
  if (b.claude != null) { const c = String(b.claude).trim(); if (c && !/^https:\/\/claude\.ai\/project\/[\w-]+$/.test(c)) return { ok: false, fout: 'claude: https://claude.ai/project/<id>' }; v.claude = c; }
  if (b.doel != null) v.advies = '';
  for (const k of ['naam', 'wat', 'doel', 'eenheid', 'gemeten', 'site']) if (b[k] != null) v[k] = kort(b[k], k === 'doel' || k === 'wat' ? 400 : 160).trim();
  for (const k of ['nu', 'doelgetal']) if (b[k] != null) { const n = getal(b[k]); if (n == null) return { ok: false, fout: k + ' moet een getal zijn' }; v[k] = n; }
  if (b.nu != null && b.gemeten == null) v.gemeten = vandaag();
  if (b.geld != null) { const u = await zetGeld(kv, id, b.geld); if (!u.ok) return u; if (Object.keys(b).filter(k => k !== 'project' && k !== 'geld').length === 0 && (vast || oud.naam)) return { ok: true, project: id, geld: u }; }
  if (b.waarde != null) { const w = b.waarde || {}; const n = getal(w.bedrag); if (n == null || n < 0) return { ok: false, fout: 'waarde: {"bedrag":<dollars per uitkomst>,"per":"aanmelding","waarom":"redenering in één zin"}' }; if (n > 0 && String(w.waarom || '').trim().length < 20) return { ok: false, fout: 'waarde: geef in waarom de redenering (minstens 20 tekens)' }; v.waarde = n ? { bedrag: n, per: kort(w.per || 'uitkomst', 40), waarom: kort(w.waarom, 400), sinds: vandaag() } : null; }
  if (b.vast != null) { const l = schoonVast(b.vast); if (!l) return { ok: false, fout: 'vast: [{"post":"AWS","perMaand":<bedrag>,"bron":"waar het getal vandaan komt"}]' }; v.vast = l; }
  if (b.archief != null) { v.archief = !!b.archief; v.gearchiveerd = v.archief ? vandaag() : ''; }
  if (b.plan != null) v.plan = schoonPlan(b.plan);
  const basis = () => (v.plan || (vast && vast.plan ? schoonPlan(vast.plan) : []));
  if (b.erbij) { const e = schoonPlan([b.erbij]); if (!e.length) return { ok: false, fout: 'erbij: {"d":"JJJJ-MM-DD","t":"wat"}' }; v.plan = basis().concat(e); }
  if (b.klaar) { const z = String(b.klaar).toLowerCase(); const p = basis(); let n = 0; for (const r of p) if (!r.klaar && (r.d === z || r.t.toLowerCase().includes(z))) { r.klaar = true; r.af = vandaag(); n++; } if (!n) return { ok: false, fout: 'geen open planregel gevonden met "' + kort(b.klaar, 60) + '"' }; v.plan = p; }
  if (Array.isArray(b.overdracht)) v.overdracht = b.overdracht.filter(x => Array.isArray(x) && /^https:\/\//.test(String(x[1] || ''))).slice(0, 10).map(x => [kort(x[0], 80), kort(x[1], 300)]);
  if (Array.isArray(b.taken)) v.taken = b.taken.filter(x => x && x.naam).slice(0, 20).map(x => ({ naam: kort(x.naam, 80), waar: kort(x.waar, 40), wanneer: kort(x.wanneer, 80), wat: kort(x.wat, 300), link: /^https:\/\//.test(String(x.link || '')) ? kort(x.link, 300) : '' }));
  if (Array.isArray(b.logs)) v.logs = b.logs.map(x => String(x).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30)).filter(Boolean).slice(0, 8);
  if (!vast && !v.naam) return { ok: false, fout: 'nieuw project: geef ook naam' };
  v.bijgewerkt = new Date().toISOString(); v.wie = kort(wie || b.wie || 'chat', 60);
  await kv.set(DASH + id, v); await kv.raw(['SADD', DASH + 'lijst', id]);
  return { ok: true, project: id, opgeslagen: Object.keys(b).filter(k => k !== 'project') };
}

// Adressen per land voor curacao.day (Henkjan 25 nov 2026: "Ik wil in rapport welke landen adressen vandaag en cummulatief zien").
// Bron: de eigen teller van curacao.day, bzz.today/api/cw?cmdata=1 (per dag en per rij cc = land en s = nieuw e-mailadres of push, alleen bezoekers uit campagnes).
// Het antwoord is groot, dus hooguit eens per 30 minuten ophalen; lukt het niet, dan de vorige telling.
const LAND_KV = 'mm:dash:landen:curacao';
export function telLanden(j) {
  const dagen = (j && Array.isArray(j.dagen) ? j.dagen : []).filter(d => d && d.dag); if (!dagen.length) return null;
  const laatste = dagen.map(d => String(d.dag)).sort().pop(), eerste = dagen.map(d => String(d.dag)).sort()[0]; const per = {};
  for (const d of dagen) for (const r of d.rijen || []) { const n = Number(r.s) || 0; if (!n) continue; const cc = String(r.cc || '??').toLowerCase(); const x = per[cc] || (per[cc] = { cc, vandaag: 0, totaal: 0 }); x.totaal += n; if (String(d.dag) === laatste) x.vandaag += n; }
  const landen = Object.values(per).sort((a, b) => b.totaal - a.totaal);
  return { dag: laatste, sinds: eerste, vandaag: landen.reduce((t, x) => t + x.vandaag, 0), totaal: landen.reduce((t, x) => t + x.totaal, 0), landen };
}
async function landenCuracao(kv) {
  const oud = await kv.get(LAND_KV).catch(() => null);
  if (oud && oud.t && Date.now() - oud.t < 30 * 60e3) return oud;
  try {
    const r = await fetch((process.env.BZZ_URL || 'https://bzz.today') + '/api/cw?cmdata=1&dagen=45', { headers: { 'user-agent': 'hjdk-dashboard' }, signal: AbortSignal.timeout(7000) }); if (!r.ok) throw new Error('http ' + r.status);
    const u = telLanden(await r.json()); if (!u) throw new Error('leeg'); u.t = Date.now(); await kv.set(LAND_KV, u).catch(() => null); return u;
  } catch (e) { return oud || null; }
}
let LANDNAAM = null; const landNaam = cc => { if (cc === '??') return 'Onbekend land'; try { LANDNAAM = LANDNAAM || new Intl.DisplayNames(['nl'], { type: 'region' }); return LANDNAAM.of(cc.toUpperCase()) || cc.toUpperCase(); } catch (e) { return cc.toUpperCase(); } };

async function lijst(kv, key, n) { try { return ((await kv.raw(['LRANGE', key, 0, n - 1])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean); } catch (e) { return []; } }

export async function dashData(kv) {
  let ids = []; try { ids = (await kv.raw(['SMEMBERS', DASH + 'lijst'])) || []; } catch (e) {}
  let gestuurdIds = []; try { gestuurdIds = (await kv.raw(['SMEMBERS', 'mm:handover:project:lijst'])) || []; } catch (e) {}
  const alle = [...new Set(PROJECTEN.map(p => p.id).concat(ids))];
  const leerprompt = await leesLeerprompt(kv);
  const landen = await landenCuracao(kv).catch(() => null);
  const [uur, log, eigen, gestuurd] = await Promise.all([
    kv.get('mm:wachtuur:laatst').catch(() => null),
    lijst(kv, 'mm:handover:log', 300),
    Promise.all(alle.map(id => kv.get(DASH + id).catch(() => null))),
    Promise.all(gestuurdIds.map(id => kv.get('mm:handover:project:' + id).catch(() => null))),
  ]);
  // projecten met een eigen meetpunt (vast.meet, openbaar JSON met nu en gemeten): live ophalen, hooguit 2,5 seconde
  const metingen = {}; await Promise.all(PROJECTEN.filter(p => p.meet && alle.includes(p.id)).map(async p => { try { const r = await fetch(p.meet, { signal: AbortSignal.timeout(2500) }); const j = await r.json(); if (j && Number.isFinite(j.nu)) metingen[p.id] = j; } catch (e) {} }));
  const dag = vandaag();
  const gisteren = await doelDag(kv, new Date(Date.now() - 864e5).toISOString().slice(0, 10));
  const projecten = alle.map((id, i) => {
    const vast = PROJECTEN.find(p => p.id === id) || { id, logs: [id] }; const e = eigen[i] || {};
    const p = { id, naam: e.naam || vast.naam || id, wat: e.wat || vast.wat || '', site: e.site || vast.site || '', doel: e.doel || vast.doel || '',
      nu: e.nu != null ? e.nu : (vast.nu != null ? vast.nu : null), doelgetal: e.doelgetal != null ? e.doelgetal : (vast.doelgetal != null ? vast.doelgetal : null),
      eenheid: e.eenheid || vast.eenheid || '', gemeten: e.gemeten || vast.gemeten || '', overdracht: e.overdracht || vast.overdracht || [], logs: e.logs || vast.logs || [id],
      plan: e.plan || schoonPlan(vast.plan || []), taken: e.taken || vast.taken || [], bijgewerkt: e.bijgewerkt || '', wie: e.wie || '', archief: !!e.archief, gearchiveerd: e.gearchiveerd || '', waarde: e.waarde || null, vast: e.vast || [], claude: e.claude || '', repo: vast.repo != null ? vast.repo : 'henkjandekrijger-glitch/hjdk-api', advies: e.advies != null ? e.advies : (e.doel ? '' : vast.advies || '') };
    if (id === 'clickmind') { const P = (uur && uur.eigen && uur.eigen.projecten) || {}; let kl = 0, uit = 0; for (const k of Object.keys(P)) if (!k.includes('|')) { kl += Number(P[k].kliks) || 0; uit += (Number(P[k].aanmelding) || 0) + (Number(P[k].koop) || 0); } if (kl >= 100) { p.nu = Math.round(1000 * uit / kl) / 10; p.gemeten = 'vandaag tot nu (UTC), ' + uit + ' uitkomsten op ' + kl + ' kliks, telt zichzelf'; } const kt = doelKeten((uur && uur.eigen && uur.eigen.campagnes) || []); if (kt.kliks >= 100) p.keten = kt; if (gisteren && gisteren.kliks >= 100) p.gemeten += '; gisteren ' + num(gisteren.nu) + ' (' + gisteren.uit + ' op ' + gisteren.kliks + ')'; }
    if (metingen[id]) { p.nu = metingen[id].nu; p.gemeten = metingen[id].gemeten || p.gemeten; }
    p.pct = p.nu != null && p.doelgetal ? Math.max(0, Math.min(100, Math.round(100 * p.nu / p.doelgetal))) : null;
    p.plan = p.plan.slice().sort((a, b) => (a.klaar - b.klaar) || String(a.d || '9').localeCompare(String(b.d || '9')));
    p.open = p.plan.filter(r => !r.klaar); p.telaat = p.open.filter(r => r.d && r.d < dag).length;
    p.log = log.filter(x => { const w = String(x.wie || '').toLowerCase(); return p.logs.some(l => w.startsWith(l)) || (w === 'deploy' && vast.woorden && vast.woorden.test(String(x.tekst || ''))); }).slice(0, 25);
    const g = gestuurd.find(x => x && (x.project === id || p.logs.includes(x.project))); if (g) p.stand = { ontvangen: g.ontvangen, regels: (g.stand || []).slice(0, 12) };
    if (id === 'curacao' && landen) p.landen = landen;
    p.laatste = p.log[0] ? p.log[0].t : '';
    p.verder = verderUrl(p);
    return p;
  });
  const archief = projecten.filter(p => p.archief).map(p => ({ id: p.id, naam: p.naam, sinds: p.gearchiveerd }));
  const actief = projecten.filter(p => !p.archief);
  const agenda = []; for (const p of actief) for (const r of p.open) if (r.d) agenda.push({ d: r.d, t: r.t, id: p.id, naam: p.naam, telaat: r.d < dag });
  agenda.sort((a, b) => a.d.localeCompare(b.d));
  const geld = await geldData(kv, uur, actief).catch(() => ({ dagen: 7, perMunt: [], leeg: true }));
  const basis = { vandaag: dag, projecten: actief };
  const valtOp = opvallend(basis, geld).map(o => { const p = actief.find(x => x.id === o.id); return Object.assign(o, { verder: p ? verderUrl(p, o.opdracht) : '' }); });
  return { gemaakt: new Date().toISOString(), vandaag: dag, geld, opvallend: valtOp, leerprompt: { tekst: leerprompt.tekst, bijgewerkt: leerprompt.bijgewerkt, wie: leerprompt.wie, heeftVorige: !!leerprompt.vorige }, projecten: actief, archief, agenda, zonderDoel: actief.filter(p => !p.doel).map(p => p.naam), zonderPlan: actief.filter(p => !p.open.length).map(p => p.naam) };
}

// De opdracht die Claude meekrijgt: genoeg om meteen verder te gaan, kort genoeg voor een link.
function verderUrl(p, ingreep) {
  const stap = p.open[0];
  const t = (ingreep ? 'INGRIJPEN bij ' + p.naam + ' (Henkjan tikte op het dashboard): ' + ingreep + '\n' : 'Werk verder aan ' + p.naam + '. Praat Nederlands, kort.\n')
    + '1. Lees de stand: ' + HOST + '/api/mm/dashboard?vorm=tekst&project=' + p.id + ' (met de Vercel-tool web_fetch_vercel_url).\n'
    + (p.overdracht.length ? '2. Lees de overdracht: ' + p.overdracht.slice(0, 2).map(o => o[1]).join(' en ') + '.\n' : '')
    + (p.repo ? '3. Repo ' + p.repo + ': volg CLAUDE.md.\n' : '')
    + 'Doel: ' + (p.doel || (p.advies ? 'nog niet gezet; advies: ' + p.advies : 'nog niet gezet, stel er een voor')) + '\n'
    + (stap ? 'Eerstvolgende stap' + (stap.d ? ' (' + stap.d + ')' : '') + ': ' + stap.t + '\n' : '')
    + 'Werk volgens de leerprompt die onderaan die standpagina staat: jij bent eigenaar van het doel en werkt er zelfstandig naartoe. Zeg in 5 regels waar het staat en wat je nu doet, en doe het. Schrijf daarna het werklog (handover?log=...&wie=' + p.logs[0] + '-chat) en werk het dashboard bij.';
  const q = encodeURIComponent(t);
  if (p.claude) return p.claude + '?q=' + q;
  return p.repo ? 'https://claude.ai/code/new?q=' + q + '&repo=' + encodeURIComponent(p.repo) : 'https://claude.ai/new?q=' + q;
}

const NL_MND = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const dagKort = d => (/^\d{4}-\d{2}-\d{2}/.test(String(d || '')) ? Number(String(d).slice(8, 10)) + ' ' + NL_MND[Number(String(d).slice(5, 7)) - 1] : '');
const tijdKort = t => (t ? dagKort(t) + ' ' + String(t).slice(11, 16) + ' UTC' : '');
const geldNum = n => (Math.round(Number(n) * 100) / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const num = n => (n == null ? '' : String(Math.round(n * 100) / 100).replace('.', ','));

const TEKEN = m => (m === 'USD' ? '$' : m === 'EUR' ? '€' : m + ' ');
const geldVan = (d, id) => d.geld.perMunt.map(m => { const p = m.projecten.find(x => x.id === id); return p ? { t: TEKEN(m.munt), p } : null; }).filter(Boolean);

export function dashTekst(d, alleen) {
  const r = ['DASHBOARD ALLE PROJECTEN, ' + d.vandaag + ' (Curaçao). Bron: ' + HOST + '/api/mm/dashboard', ''];
  if (!alleen) r.push(startTekst(d), '');
  if (!alleen) { r.push('WAT KOMT ERAAN'); for (const a of d.agenda.slice(0, 20)) r.push('- ' + dagKort(a.d) + (a.telaat ? ' (te laat)' : '') + ' | ' + a.naam + ': ' + a.t); r.push(''); }
  for (const p of d.projecten.filter(x => !alleen || x.id === alleen)) {
    r.push('## ' + p.naam + ' (' + p.id + ')'); if (p.wat) r.push(p.wat);
    r.push('Doel: ' + (p.doel || (p.advies ? 'niet gezet. Advies (wacht op Henkjans ja): ' + p.advies : 'niet gezet')));
    if (p.pct != null) r.push('Voortgang: ' + num(p.nu) + ' van ' + num(p.doelgetal) + ' ' + p.eenheid + ' = ' + p.pct + '%' + (p.gemeten ? ' (gemeten ' + p.gemeten + ')' : ''));
    for (const g of geldVan(d, p.id)) r.push('Geld ' + d.geld.dagen + ' dagen: kosten ' + g.t + num(g.p.kosten) + ', opbrengst ' + g.t + num(g.p.opbrengst) + (g.p.waarde ? ', geschatte waarde ' + g.t + num(g.p.waarde) : '') + ' (' + Object.keys(g.p.posten).map(k => k + ' ' + g.t + num(g.p.posten[k])).join('; ') + ')');
    for (const o of d.opvallend.filter(x => x.id === p.id)) r.push('Opvallend: ' + o.tekst);
    if (p.keten && alleen) for (const z of ketenTekst(p.keten)) r.push(z);
    if (p.landen) { r.push('Adressen per land (' + dagKort(p.landen.dag) + ' UTC, en totaal sinds ' + dagKort(p.landen.sinds) + '; alleen adressen uit campagnes): vandaag ' + p.landen.vandaag + ', totaal ' + p.landen.totaal); for (const x of p.landen.landen.slice(0, alleen ? 40 : 8)) r.push('- ' + landNaam(x.cc) + ': vandaag ' + x.vandaag + ', totaal ' + x.totaal); }
    if (p.vast.length) r.push('Vaste kosten per maand: ' + p.vast.map(v => v.post + ' ' + TEKEN(v.munt) + num(v.perMaand) + (v.bron ? ' (' + v.bron + ')' : '')).join('; '));
    if (p.waarde) r.push('Geschatte waarde: $' + num(p.waarde.bedrag) + ' per ' + p.waarde.per + ' (' + p.waarde.waarom + ')');
    if (p.plan.length) { r.push('Planning:'); for (const x of p.plan) r.push('- ' + (x.klaar ? '[af] ' : '[open] ') + (x.d ? dagKort(x.d) + ': ' : '') + x.t); }
    for (const t of p.taken) r.push('Taak: ' + t.naam + ' (' + [t.waar, t.wanneer].filter(Boolean).join(', ') + ')' + (t.wat ? ': ' + t.wat : '') + (t.link ? ' ' + t.link : ''));
    for (const o of p.overdracht) r.push('Overdracht: ' + o[0] + ' ' + o[1]);
    if (p.stand) for (const s of p.stand.regels) r.push('Stand: ' + s);
    if (p.log.length) { r.push('Logboek:'); for (const x of p.log.slice(0, alleen ? 25 : 5)) r.push('- ' + tijdKort(x.t) + ' [' + x.wie + '] ' + x.tekst); }
    r.push('');
  }
  if (!alleen) {
    if (d.opvallend.length) { r.push('OPVALLEND'); for (const o of d.opvallend) r.push('- ' + o.naam + ': ' + o.tekst); r.push(''); }
    for (const m of d.geld.perMunt) { const t = TEKEN(m.munt); r.push('GELD laatste ' + d.geld.dagen + ' dagen (' + m.munt + ', dagen in UTC): kosten ' + t + num(m.totaal.kosten) + ', opbrengst ' + t + num(m.totaal.opbrengst) + ', saldo ' + t + num(m.totaal.saldo) + (m.totaal.waarde ? ', geschatte waarde (geen omzet) ' + t + num(m.totaal.waarde) : '')); for (const x of m.dagen) if (x.kosten || x.opbrengst) r.push('- ' + dagKort(x.dag) + ': kosten ' + t + num(x.kosten) + ', opbrengst ' + t + num(x.opbrengst)); for (const x of m.projecten) r.push('- ' + x.naam + ': kosten ' + t + num(x.kosten) + ', opbrengst ' + t + num(x.opbrengst) + (x.waarde ? ', geschatte waarde ' + t + num(x.waarde) : '')); r.push(''); }
  }
  if (!alleen && d.archief.length) r.push('Gearchiveerd (niet in het overzicht): ' + d.archief.map(a => a.naam + ' (' + a.id + ')').join(', '), '');
  r.push('SKILLS (lees de skill die bij je werk past voor je begint; bron in de repo, .claude/skills):'); for (const k of skillsLijst()) r.push('- ' + k.kort + ' (' + k.naam + '): ' + k.voor + '. ' + (k.dienst ? 'Dienst: ' + k.dienst + ' (AI-gaten: ' + k.dienst + 'api/gaps?latest=1). Werkwijze: ' : '') + (k.staat ? k.url : 'ontbreekt in deze uitrol')); r.push('');
  r.push('=== ' + d.leerprompt.tekst.split('\n')[0] + ' (zo werk je; Henkjan beheert deze tekst op het dashboard' + (d.leerprompt.bijgewerkt ? ', laatst gewijzigd ' + dagKort(d.leerprompt.bijgewerkt) : '') + ') ===', d.leerprompt.tekst.split('\n').slice(1).join('\n').trim(), '');
  r.push('Waarde per uitkomst schatten (projecten zonder omzet): ' + HOST + '/api/mm/dashboard?zet={"project":"<id>","waarde":{"bedrag":<dollars>,"per":"aanmelding","waarom":"<redenering>"}}');
  r.push('Geld boeken (kosten en opbrengst per dag, in dollars tenzij munt erbij): ' + HOST + '/api/mm/dashboard?zet={"project":"<id>","geld":{"dag":"JJJJ-MM-DD","kosten":{"<post>":<bedrag>},"opbrengst":{"<post>":<bedrag>}}}');
  r.push('Bijwerken: ' + HOST + '/api/mm/dashboard?zet=<JSON> met {"project":"<id>","nu":<getal>,"klaar":"<tekst of datum>","erbij":{"d":"JJJJ-MM-DD","t":"wat"},"doel":"..."}; logboek: ' + HOST + '/api/mm/handover?log=<tekst>&wie=<project>-<chat>');
  return r.join('\n') + '\n';
}

// Vormgeving als sealedintent.com, zo min mogelijk variabelen (Henkjan 25 nov: "Dashboard word rommelig maak veel strakker zo min mogelijk ux variabelen"):
// drie lettermaten (18, 26, 40), één accentkleur, één knop (Verder in Claude en Opslaan), al het andere is een link; één rijpatroon (label links, inhoud rechts)
// voor planning, geld, landen, taken en logboek; elk project staat één keer op de pagina, als uitklapbare rij.
const CSS = ':root{--bg:#fff;--ink:#0B1640;--accent:#2B47C4;--on:#fff;--soft:#EEF1FC;--line:#D3DAF4}'
  + '@media (prefers-color-scheme:dark){:root{--bg:#0A1030;--ink:#EEF1FC;--accent:#9DB0FF;--on:#0A1030;--soft:#141D4A;--line:#2A3670;color-scheme:dark}}'
  + '*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}'
  + 'body{margin:0;background:var(--bg);color:var(--ink);font:400 18px/1.55 "Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}'
  + '.w{max-width:680px;margin:0 auto;padding:18px max(16px,env(safe-area-inset-left,0px)) 56px;display:flex;flex-direction:column;gap:44px}'
  + 'header{display:flex;align-items:center;justify-content:space-between;gap:12px}.merk{font-weight:700;letter-spacing:-.01em;color:var(--ink);text-decoration:none}.meta{color:var(--accent)}'
  + 'h1,h2,h3{margin:0;text-wrap:balance}h1{font-size:40px;line-height:1.08;font-weight:700;letter-spacing:-.025em}h2{font-size:26px;line-height:1.2;font-weight:600;letter-spacing:-.015em}h3{font-size:18px;line-height:1.4;font-weight:700}'
  + 'p{margin:0}a{color:var(--accent);text-underline-offset:4px;text-decoration-thickness:1px}'
  + 'section{display:flex;flex-direction:column;gap:14px}'
  + '.lijst{display:flex;flex-direction:column;border-top:1px solid var(--line)}'
  + '.r{display:grid;grid-template-columns:84px 1fr;gap:14px;padding:13px 0;border-bottom:1px solid var(--line);overflow-wrap:anywhere}.r>b{color:var(--accent);font-weight:700;font-variant-numeric:tabular-nums}'
  + 'details{border-bottom:1px solid var(--line)}summary{cursor:pointer;padding:14px 0;list-style:none;display:grid;grid-template-columns:1fr auto;gap:2px 14px}summary::-webkit-details-marker{display:none}summary b{font-weight:700}summary i{font-style:normal;font-weight:700;color:var(--accent);font-variant-numeric:tabular-nums}summary span{grid-column:1/-1;color:var(--accent)}summary .balk{grid-column:1/-1}'
  + '.balk{height:8px;border-radius:999px;background:var(--soft);overflow:hidden;margin-top:6px}.balk i{display:block;height:100%;border-radius:999px;background:var(--accent)}'
  + '.in{padding:6px 0 26px;display:flex;flex-direction:column;gap:22px}.blok{display:flex;flex-direction:column;gap:8px}'
  + '.btn{align-self:flex-start;background:var(--accent);color:var(--on);border:0;border-radius:999px;padding:15px 28px;font:inherit;font-weight:700;line-height:1.2;text-decoration:none;text-align:center;cursor:pointer}'
  + '.tool{background:var(--soft);border-radius:18px;padding:22px;display:flex;flex-direction:column;gap:14px}'
  + 'textarea{width:100%;min-height:520px;background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:14px;font:inherit}'
  + 'footer{padding-top:18px;border-top:1px solid var(--line)}'
  + ':focus-visible{outline:2px solid var(--accent);outline-offset:3px}'
  + '@media (max-width:480px){h1{font-size:32px}h2{font-size:23px}.btn{align-self:stretch}.w{gap:36px}}';

export function dashHtml(d, melding) {
  const balk = p => (p.pct == null ? '' : '<div class="balk" role="img" aria-label="' + p.pct + ' procent"><i style="width:' + p.pct + '%"></i></div>');
  const onder = p => [p.pct == null ? (p.doel ? 'Doel gezet, meting volgt' : 'Doel nog zetten') : (!p.doel && p.advies ? 'Advies voor het doel, wacht op je ja' : ''), p.open.length ? p.open.length + ' open' + (p.telaat ? ', ' + p.telaat + ' te laat' : '') : '', p.laatste ? 'laatste werk ' + dagKort(p.laatste) : ''].filter(Boolean).join(' · ');
  const r = (label, inhoud) => '<div class="r"><b>' + label + '</b><span>' + inhoud + '</span></div>';
  const lijst = rijen => (rijen.length ? '<div class="lijst">' + rijen.join('') + '</div>' : '');
  const blok = (k, h) => (h ? '<div class="blok"><h3>' + k + '</h3>' + h + '</div>' : '');
  const knip = (t, n) => { t = String(t || ''); return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + ' …' : t; };
  const kaart = p => '<details id="' + esc(p.id) + '"><summary><b>' + esc(p.naam) + '</b>' + (p.pct != null ? '<i>' + p.pct + '%</i>' : '<i></i>') + (onder(p) ? '<span>' + esc(onder(p)) + '</span>' : '') + balk(p) + '</summary><div class="in">'
    + (p.wat ? '<p>' + esc(p.wat) + '</p>' : '')
    + '<a class="btn" href="' + esc(p.verder) + '">Verder in Claude</a>'
    + blok(p.doel || !p.advies ? 'Doel' : 'Advies voor het doel, wacht op je ja', '<p>' + (p.doel ? esc(p.doel) : (p.advies ? esc(p.advies) : 'Zeg het doel in een chat, dan staat het hier.')) + '</p>' + (p.pct != null ? '<p>Nu ' + esc(num(p.nu)) + ' van ' + esc(num(p.doelgetal)) + ' ' + esc(p.eenheid) + (p.gemeten ? ', gemeten ' + esc(p.gemeten) : '') + '.</p>' : ''))
    + blok('Planning', lijst(p.plan.filter(x => !x.klaar).map(x => r(x.d ? esc(dagKort(x.d)) : 'Open', esc(x.t) + (x.d && x.d < d.vandaag ? ' (te laat)' : ''))).concat(p.plan.filter(x => x.klaar).slice(0, 3).map(x => r('Af', esc(x.t))))))
    + blok('Geld, laatste ' + d.geld.dagen + ' dagen', lijst(geldVan(d, p.id).flatMap(g => [r('Kosten', g.t + esc(geldNum(g.p.kosten))), r('Omzet', g.t + esc(geldNum(g.p.opbrengst)))].concat(g.p.waarde ? [r('Geschat', g.t + esc(geldNum(g.p.waarde)) + ' waarde, geen omzet')] : [], Object.keys(g.p.posten).map(k => r('', esc(k) + ' ' + g.t + esc(geldNum(g.p.posten[k])))))).concat(p.vast.map(v => r('Vast', esc(v.post) + ' ' + TEKEN(v.munt) + esc(geldNum(v.perMaand)) + ' per maand' + (v.bron ? ', ' + esc(v.bron) : ''))), p.waarde ? [r('Waarde', '$' + esc(geldNum(p.waarde.bedrag)) + ' per ' + esc(p.waarde.per) + '. ' + esc(p.waarde.waarom))] : [])))
    + (p.landen ? blok('Adressen per land, vandaag en totaal', lijst(p.landen.landen.slice(0, 20).map(x => r(x.vandaag ? '+' + x.vandaag : '', esc(landNaam(x.cc)) + ' ' + x.totaal)).concat([r('+' + p.landen.vandaag, '<b>Samen ' + p.landen.totaal + '</b>, sinds ' + esc(dagKort(p.landen.sinds)) + ', alleen uit campagnes')]))) : '')
    + blok('Draait vanzelf', lijst(p.taken.map(t => r(esc(t.waar || 'Taak'), (t.link ? '<a href="' + esc(t.link) + '">' + esc(t.naam) + '</a>' : esc(t.naam)) + (t.wanneer ? ', ' + esc(t.wanneer) : '') + (t.wat ? '. ' + esc(t.wat) : '')))))
    + blok('Stand van het project zelf', lijst(((p.stand && p.stand.regels) || []).slice(0, 6).map(s => r('', esc(knip(s, 300))))))
    + blok('Overdracht', '<p>' + p.overdracht.map(o => '<a href="' + esc(o[1]) + '">' + esc(o[0]) + '</a>').concat(p.site ? ['<a href="' + esc(p.site) + '">Naar de site</a>'] : []).join(' · ') + '</p>')
    + blok('Logboek', lijst(p.log.slice(0, 5).map(x => r(esc(dagKort(x.t)), esc(knip(x.tekst, 320))))) + (p.log.length ? '<p><a href="?vorm=tekst&amp;project=' + esc(p.id) + '">Hele logboek</a></p>' : '<p>Chats schrijven hier met de naam ' + esc(p.logs[0]) + '-&lt;chat&gt;.</p>'))
    + '<p><a href="?archiveer=' + esc(p.id) + '">Archiveer ' + esc(p.naam) + '</a></p>'
    + '</div></details>';
  const geld = d.geld.perMunt.map(m => { const t = TEKEN(m.munt); const g = n => t + esc(geldNum(n)); const regel = x => 'kosten ' + g(x.kosten) + ' · omzet ' + g(x.opbrengst) + (x.waarde ? ' · geschat ' + g(x.waarde) : '');
    return '<section><h2>Geld, laatste ' + d.geld.dagen + ' dagen' + (d.geld.perMunt.length > 1 ? ' in ' + esc(m.munt) : '') + '</h2>' + lijst(m.dagen.filter(x => x.kosten || x.opbrengst || x.waarde).map(x => r(esc(dagKort(x.dag)), regel(x))).concat([r('Samen', '<b>' + regel(m.totaal) + ' · saldo ' + g(m.totaal.saldo) + '</b>')]))
      + '<details><summary><b>Per project</b><i></i></summary><div class="in">' + lijst(m.projecten.map(x => r('', '<a href="#' + esc(x.id) + '">' + esc(x.naam) + '</a><br>' + regel(x)))) + '</div></details></section>'; }).join('');
  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex"><title>Dashboard alle projecten</title><link rel="alternate" type="text/plain" href="?vorm=tekst" title="Voor een chat"><!--\n' + startTekst(d).replace(/--/g, '- -') + '\n-->'
    + '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap">'
    + '<style>' + CSS + '</style></head><body><div class="w"><header><a class="merk" href="?">Dashboard</a><span class="meta">' + esc(dagKort(d.vandaag)) + '</span></header>'
    + (melding ? '<div class="tool"><p>' + esc(melding.tekst) + (melding.terug ? ' <a href="?terug=' + esc(melding.terug) + '">Toch terugzetten</a>' : '') + '</p></div>' : '')
    + (d.opvallend.length ? '<section class="tool"><h2>Opvallend</h2>' + d.opvallend.slice(0, 5).map(o => '<p><b>' + esc(o.naam) + '.</b> ' + esc(o.tekst) + (o.verder ? ' <a href="' + esc(o.verder) + '">Laat Claude ingrijpen</a>' : '') + '</p>').join('') + '</section>' : '')
    + '<section><h1>Projecten</h1><div class="lijst">' + d.projecten.map(kaart).join('') + '</div></section>'
    + (d.agenda.length ? '<section><h2>Wat komt eraan</h2>' + lijst(d.agenda.slice(0, 7).map(a => r(esc(dagKort(a.d)), '<a href="#' + esc(a.id) + '">' + esc(a.naam) + '</a>' + (a.telaat ? ' (te laat)' : '') + '<br>' + esc(a.t)))) + '</section>' : '')
    + geld
    + '<section><h2>Instellingen</h2><div class="lijst"><details id="leerprompt"><summary><b>Leerprompt</b><i></i><span>Zo werkt elk project zelfstandig naar zijn doel' + (d.leerprompt.bijgewerkt ? ' · gewijzigd ' + esc(dagKort(d.leerprompt.bijgewerkt)) : '') + '</span></summary><div class="in"><p>Elke chat en elke ronde leest deze tekst voor hij begint. Pas hem aan en sla op; de vorige versie blijft bewaard.</p><textarea id="lp" spellcheck="false">' + esc(d.leerprompt.tekst) + '</textarea><button class="btn" id="lpo">Opslaan</button><p id="lpm" class="meta" role="status"></p>' + (d.leerprompt.heeftVorige ? '<p><a href="?leerprompt=vorige">Vorige versie terugzetten</a></p>' : '') + '</div></details>'
    + '<details id="skills"><summary><b>Skills</b><i>' + skillsLijst().length + '</i><span>Vaste werkwijzen die elke chat kan aanroepen</span></summary><div class="in">' + lijst(skillsLijst().map(k => r(esc(k.kort), (k.dienst ? '<a href="' + esc(k.dienst) + '">Open de dienst</a> · ' : '') + (k.staat ? '<a href="' + esc(k.url) + '">' + esc(k.naam) + '</a>' : esc(k.naam) + ' (ontbreekt)') + ' · ' + esc(k.voor)))) + '</div></details>'
    + (d.archief.length ? '<details><summary><b>Archief</b><i>' + d.archief.length + '</i></summary><div class="in">' + lijst(d.archief.map(a => r(a.sinds ? esc(dagKort(a.sinds)) : '', esc(a.naam) + ' · <a href="?terug=' + esc(a.id) + '">Terugzetten</a>'))) + '</div></details>' : '')
    + '</div></section>'
    + '<footer><p>Voor chats: <a href="?vorm=tekst">het dashboard als tekst</a>.</p></footer></div>'
    + '<script>function o(){var h=location.hash.slice(1);if(!h)return;var e=document.getElementById(h);if(e&&e.tagName==="DETAILS"){e.open=true;e.scrollIntoView()}}addEventListener("hashchange",o);o();document.getElementById("lpo").onclick=function(){var m=document.getElementById("lpm");m.textContent="Bezig met opslaan";fetch(location.pathname,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({leerprompt:document.getElementById("lp").value})}).then(function(r){return r.json()}).then(function(u){m.textContent=u.ok?(u.gelijk?"Niets gewijzigd":"Opgeslagen. Elke chat werkt vanaf nu met deze tekst."):"Niet opgeslagen: "+(u.fout||"fout")}).catch(function(){m.textContent="Niet opgeslagen: geen verbinding"})}</script>'
    + '</body></html>';
}
