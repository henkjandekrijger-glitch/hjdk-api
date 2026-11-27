// Test paspoort en geheugen (lib/paspoort.js) tegen een lokale Redis: KV_REDIS_URL=redis://127.0.0.1:6397 node scripts/test-paspoort.mjs
// De bronnen worden gevuld zoals de motoren dat doen: cm:camp:<dag> (lib/cmcamp.js), dist:r (lib/distlus.js), vm:v (lib/videomind.js), post:mail (lib/postlus.js).
if (!/127\.0\.0\.1|localhost/.test(String(process.env.KV_REDIS_URL || ''))) { console.log('overgeslagen: alleen tegen een lokale Redis (KV_REDIS_URL=redis://127.0.0.1:...)'); process.exit(0); }
const { kv } = await import('../lib/db.js'); await kv.raw(['FLUSHDB']);
const P = await import('../lib/paspoort.js');
const ok = (c, n) => { if (!c) { console.log('FOUT', n); process.exitCode = 1; } else console.log('ok  ', n); };
const DAG = 864e5, nu = Date.now(), dag = t => new Date(t).toISOString().slice(0, 10), iso = t => new Date(t).toISOString();

// ---- paspoort ----
ok(!P.schoon({ project: 'kadoly', tekst: 'x' }).ok, 'zonder medium geweigerd');
ok(!P.schoon({ medium: 'x', tekst: 'x' }).ok, 'zonder project geweigerd');
ok(!P.schoon({ medium: 'x', project: 'nexy', tekst: 'x' }, null, { streng: true }).ok, 'streng: zonder doel geweigerd');
const a = P.schoon({ medium: 'Twitter', project: 'nexyplatform', tekst: 'Missed a call again? Nexy answers for you.' });
ok(a.ok && a.stuk.medium === 'x' && a.stuk.voor.project === 'nexy' && a.stuk.doel.soort === 'store' && a.stuk.doel.afgeleid === true, 'alias medium en project, doel van het project afgeleid');
const b2 = P.schoon({ medium: 'propeller', project: 'todayin', doel: 'adres', titel: '¿Qué playa hoy?', tekst: 'Pregunta al chat', pagina: 'https://todayin.email/?lang=es&c=propeller&s=${SUBID}' });
ok(b2.ok && b2.stuk.doel.soort === 'aanmelding' && !b2.stuk.doel.afgeleid && b2.stuk.voor.project === 'curacao' && b2.stuk.voor.pagina === 'todayin.email' && b2.stuk.betaald && b2.stuk.soort === 'advertentie', 'eigen doel, pagina zonder macro\'s, betaald');
ok(P.doelUitNaam('TK ADRES BEWEZEN NL | CPA = adres') === 'aanmelding' && P.doelUitNaam('WAM INCASSO | CPA = echt mens') === 'echt' && P.doelUitNaam('WHICHTOBUY POWER STATION CHAT US') === 'actie' && P.doelUitNaam('[In-Page] SHOP-LUS PAKKET Bureau set winactie') === 'aanmelding', 'doel uit de campagnenaam');
const v = P.vorm('Sinterklaas voor hem / Houten kaart, 92 x 69 cm, €99,95');
ok(v.prijs === 'ja' && v.getal === 'ja' && v.vraag === 'nee', 'vorm: prijs en getal herkend');
ok(P.regelCheck(P.schoon({ medium: 'propeller', project: 'kadoly', titel: 'Sinterklaas voor hem', tekst: 'Houten kaart, €99,95' }).stuk).includes('prijs in de advertentie'), 'vaste regel: prijs in een advertentie gemeld');
ok(P.regelCheck(P.schoon({ medium: 'x', project: 'kadoly', tekst: 'Nu €99,95' }).stuk).length === 0, 'vaste regel geldt niet voor een post');

// ---- bronnen vullen ----
const cr = (id, titel, haak, kliks, conv) => ({ id, vert: kliks * 150, kliks, kosten: kliks * 0.001, conv, conv2: 0, titel, tekst: 'cada mañana', beeld: '', cta: '', ai: { haak, emotie: 'nieuwsgierig', belofte: 'x' } });
const camp = (id, naam, project, crs, eigen, landing) => ({ net: 'propeller', id, naam, project, merk: project, kliks: crs.reduce((s, c) => s + c.kliks, 0), kosten: crs.reduce((s, c) => s + c.kosten, 0), eigen, gemeten: true, waarde: 2, instellingen: { status: 6, formaat: 61, biedmodel: 'cpag', landing, gestart: dag(nu - 3 * DAG), boden: [{ bod: 0.01, landen: ['co', 've'] }] }, creatives: crs });
const dagCamps = () => [
  camp('111', 'TODAYIN CURACAO CO VE | In-Page | CPA 0.01', 'todayin', [cr('a1', '¿Qué playa hoy en Curaçao?', 'vraag', 200, 24), cr('a2', '¿Hace sol hoy?', 'vraag', 200, 22), cr('a3', '¿Dónde comer hoy?', 'vraag', 200, 23), cr('a4', 'Lo mejor de Curaçao', 'voordeel', 200, 4), cr('a5', 'Recibe tu día', 'voordeel', 200, 3), cr('a6', 'Planes y clima', 'voordeel', 200, 5), cr('a7', '4 cruceros hoy', 'getal', 200, 10), cr('a8', '13.000 visitantes', 'getal', 200, 9)], { echt: 500, actie: 0, aanmelding: 100, dialoog: 0, koop: 0, bezoek: 1500 }, 'https://todayin.email/?lang=es&c=propeller&z={zoneid}'),
  camp('222', 'WAM SAMEN NL | In-Page | CPA 0.01', 'wam', [cr('b1', 'Sta je er alleen voor?', 'vraag', 150, 12), cr('b2', 'Wij zijn met velen', 'persoonlijk', 150, 3), cr('b3', 'Zeg je loterij op', 'voordeel', 150, 4), cr('b4', 'Incasso? Reken het na', 'vraag', 150, 11)], { echt: 100, actie: 0, aanmelding: 30, dialoog: 0, koop: 0, bezoek: 500 }, 'https://wearemany.now/samen'),
  camp('333', '[In-Page] SHOP-LUS PAKKET Bureau set | NL iOS | CPA 0.01', 'kadoly', [cr('c1', 'Sinterklaas voor hem', 'voordeel', 250, 0), cr('c2', 'Houten kaart, €99,95', 'getal', 250, 0)], { echt: 40, actie: 0, aanmelding: 0, dialoog: 0, koop: 0, bezoek: 400 }, 'https://go.kadoly.com/shop?bundel=pbureau'),
];
const kopie = () => camp('444', 'TODAYIN CURACAO CO VE | In-Page | CPA 0.01 | kopie 111', 'todayin', [cr('k1', '¿Qué playa hoy en Curaçao?', 'vraag', 200, 20), cr('k2', 'Lo mejor de Curaçao', 'voordeel', 200, 4), cr('k3', 'Mapa de playas', 'voordeel', 200, 6), cr('k4', 'Eventos de hoy', 'voordeel', 200, 6)], { echt: 200, actie: 0, aanmelding: 30, dialoog: 0, koop: 0, bezoek: 700 }, 'https://todayin.email/?lang=es');
for (let i = 1; i <= 3; i++) await kv.set('cm:camp:' + dag(nu - i * DAG), [...dagCamps(), kopie()]);
// posts (zoals lib/distlus.js ze bewaart)
const post = (id, project, kanaal, tekst, haak, imp, kliks, store, extra = {}) => ({ id, t: iso(nu - 5 * DAG), dag: dag(nu - 5 * DAG), project, kanaal, plek: 'eigen account', onderwerp: 'gemiste oproep', taal: 'en', soort: 'tekst-link', metLink: true, doel: 'https://nexy.now/missed-calls', code: 'bcdfg', tekst, status: 'geplaatst', kliks, scans: 0, uitkomsten: [], store, stats: { imp, likes: 3, reacties: 1, delen: 0 }, ai: { haak, emotie: 'herkenning', doelgroep: 'zzp', belofte: 'nooit meer missen' }, ...extra });
const posts = [post('aaaaaaaaaa01', 'nexy', 'x', 'Missed a client call again? Here is what it cost me.', 'probleem', 4000, 40, 6), post('aaaaaaaaaa02', 'nexy', 'x', 'Missed 3 calls yesterday. One was a $2k job.', 'probleem', 4000, 44, 7), post('aaaaaaaaaa03', 'nexy', 'x', 'Another missed call, another lost client?', 'probleem', 4000, 38, 5),
  post('aaaaaaaaaa04', 'nexy', 'x', 'Nexy is a messenger with an AI assistant.', 'belofte', 4000, 6, 0), post('aaaaaaaaaa05', 'nexy', 'x', 'Try our new app today.', 'belofte', 4000, 5, 0), post('aaaaaaaaaa06', 'nexy', 'x', 'We built an assistant for your phone.', 'belofte', 4000, 4, 1),
  post('aaaaaaaaaa07', 'nexy', 'linkedin', 'Freelancers lose jobs to voicemail.', 'cijfer', 2000, 10, 1, { doelsoort: 'klik' })];
const kaal = (id, plek, kliks, tekst = '') => ({ id, t: iso(nu - 5 * DAG), dag: dag(nu - 5 * DAG), project: 'nexy', kanaal: 'anders', plek, onderwerp: '/v/voicemail-alternative', taal: 'en', soort: 'tekst-link', metLink: true, doel: 'https://nexy.now/v/voicemail-alternative', code: 'bcdfh', tekst, status: 'geplaatst', kliks, scans: 0, uitkomsten: [] });
posts.push(kaal('bbbbbbbbbb01', 'bluesky', 6, 'Voicemail is where calls go to die.'), kaal('bbbbbbbbbb02', 'bluesky', 5), kaal('bbbbbbbbbb03', 'bluesky', 0), kaal('bbbbbbbbbb04', 'bluesky', 0), kaal('bbbbbbbbbb05', 'bluesky', 0), kaal('bbbbbbbbbb06', 'threads', 0));
for (const p of posts) { await kv.set('dist:r:' + p.id, p); await kv.raw(['LPUSH', 'dist:lijst', p.id]); }
// video's en mails
const VM = await import('../lib/videomind.js');
await VM.zet({ id: 'ml-cdl-1', project: 'mylevel', platform: 'youtube', vorm: 'short', titel: 'CDL: can you answer this?', onderwerp: 'cdl', at: iso(nu - 4 * DAG), link: 'https://mylevel.today/cdl-practice-test' });
await VM.zet({ id: 'ml-cdl-2', project: 'mylevel', platform: 'youtube', vorm: 'short', titel: 'CDL: how far behind a truck?', onderwerp: 'cdl', at: iso(nu + 2 * DAG), doelsoort: 'klik' });
const mail = (id, extra) => ({ id, t: iso(nu - 6 * DAG), project: 'sealed', doel: 'een gesprek van 15 minuten', aan: 'iemand@voorbeeld.nl', soort: 'bedrijf', taal: 'nl', onderwerp: 'Uw artikel over bedrijfsopvolging', variant: 'a', status: 'verstuurd', verstuurd: iso(nu - 6 * DAG), ...extra });
for (const m of [mail('0000000000a1', { uitkomst: 'antwoord' }), mail('0000000000a2', { uitkomst: 'geen' }), mail('0000000000a3', { prive: true, onderwerp: 'Privé' }), mail('0000000000a4', { status: 'concept' })]) { await kv.set('post:mail:' + m.id, m); await kv.raw(['LPUSH', 'post:ids', m.id]); }

// ---- ronde ----
const r = await P.ronde({});
ok(r.ok && r.bronnen.advertenties.stukken === 18 && r.bronnen.posts.stukken === 13 && r.bronnen.videos.stukken === 2 && r.bronnen.mails.stukken === 2, 'ronde laadt 18 advertenties, 13 posts, 2 video\'s en 2 mails (privé en concept niet) ' + JSON.stringify(r.bronnen));
ok(r.fouten.length === 0 && r.nieuw === 35, 'geen fouten, 35 nieuwe stukken ' + JSON.stringify(r.fouten));
const a1 = await P.lees('ad:propeller:a1');
ok(a1 && a1.cijfers.kliks === 600 && a1.cijfers.doel === 72 && a1.medium === 'propeller' && a1.voor.project === 'curacao' && a1.doel.soort === 'aanmelding' && a1.doel.afgeleid && a1.plek === 'in-page push' && a1.voor.publiek === 'co,ve' && a1.voor.pagina === 'todayin.email' && a1.ouder === 'camp:propeller:111', 'advertentie: cijfers opgeteld over 3 dagen, paspoort compleet');
ok(a1.inhoud.haak === 'vraag' && a1.inhoud.vorm.vraag === 'ja', 'advertentie: haak en vorm');
const c1 = await P.lees('ad:propeller:c1');
ok(c1.cijfers.doel == null && c1.doel.soort === 'koop' && c1.doel.afgeleid, 'campagne zonder gemelde conversies: doel leeg, doel uit de naam (koop)');
const m1 = await P.lees('mail:0000000000a1');
ok(m1 && !JSON.stringify(m1).includes('voorbeeld.nl') && m1.doel.soort === 'antwoord' && m1.cijfers.antwoord === 1, 'mail: geen adres in het stuk, uitkomst antwoord');
ok(!(await P.lees('mail:0000000000a3')), 'privémail blijft buiten het geheugen');
const p7 = await P.lees('post:aaaaaaaaaa07'); ok(p7.doel.soort === 'klik' && !p7.doel.afgeleid, 'post met eigen doelsoort');
const vid = await P.lees('video:ml-cdl-2'); ok(vid.status === 'gepland' && vid.doel.soort === 'klik' && !vid.doel.afgeleid, 'geplande video met eigen doel');

// ---- oordeel en lessen ----
const st = await P.stand({ vers: true });
const uitslag = async id => (P.oordelen(await P.alle({})).find(x => x.id === id) || {}).oordeel;
ok((await uitslag('ad:propeller:a1')).uitslag === 'raak' && (await uitslag('ad:propeller:a5')).uitslag === 'mis', 'oordeel: vraag-advertentie raak, voordeel-advertentie mis ' + JSON.stringify(await uitslag('ad:propeller:a1')));
ok(st.tel.stukken === 35 && st.tel.families === 32 && st.tel.raak >= 3 && st.tel.mis >= 3, 'stand telt raak en mis ' + JSON.stringify(st.tel));
ok(st.lessen.some(l => l.medium === 'propeller' && l.doel === 'aanmelding' && l.kenmerk === 'haak' && l.waarde === 'vraag' && l.oordeel === 'werkt') && st.lessen.some(l => l.kenmerk === 'haak' && l.waarde === 'voordeel' && l.oordeel === 'werkt niet'), 'les: haak vraag werkt, haak voordeel werkt niet');
ok(st.tegenRegel.some(x => x.id === 'ad:propeller:c2' && /prijs/.test(x.regel)), 'advertentie met prijs staat onder tegen een vaste regel');
ok(st.poort.some(p => p.pagina === 'go.kadoly.com/shop' && p.kliks === 1500), 'uitkomstpoort: 1.500 kliks naar een pagina zonder uitkomst ' + JSON.stringify(st.poort));
ok(st.tel.afgeleid === 31 && st.tel.zonderTekst === 5, 'telt stukken zonder eigen doel (' + st.tel.afgeleid + ')');
ok(/GEHEUGEN VAN CLICKMIND/.test(P.standTekst(st)) && /<h1>35 stukken/.test(P.standHtml(st, 'body{}')), 'tekst en pagina');

// ---- eerlijk vergelijken: binnen de eigen campagne, kopieën als één familie, geen 'verkopen' zonder verkoopmeting ----
const o1 = await uitslag('ad:propeller:a1'), ok1 = await uitslag('ad:propeller:k1');
ok(o1.kopieen === 2 && ok1.kopieen === 2 && o1.fam === ok1.fam && /2 keer ingezet/.test(o1.waarom) && /conversies tegen/.test(o1.waarom) && !/verkopen|aanmeldingen/.test(o1.waarom), 'zelfde tekst in twee campagnes is één familie: ' + o1.waarom);
ok((await uitslag('ad:propeller:c1')).uitslag === 'geen meting per stuk', 'advertentie zonder conversies van het netwerk krijgt geen oordeel');
ok(P.meet({ betaald: true, doel: { soort: 'koop' }, cijfers: { kliks: 100, koop: 5 } }) === null, 'betaald zonder netwerkconversies: geen meting per advertentie (eigen verkopen naar rato zeggen niets per advertentie)');
const bl = await P.lees('post:bbbbbbbbbb01'), th = await P.lees('post:bbbbbbbbbb06');
ok(bl.medium === 'bluesky' && th.medium === 'threads', 'kanaal anders: medium uit de plek (bluesky, threads)');
ok(P.projectId('tk-mailchimp') === 'tk' && P.projectId('wam-volg') === 'wam' && P.projectId('awin-aanmelding') === 'awin-aanmelding' && P.projectId('todayin') === 'curacao', 'projectnamen met een bekend voorvoegsel');
const ob = await uitslag('post:bbbbbbbbbb01');
ok(ob.uitslag === 'raak' && ob.voorlopig === true && /voorlopig op kliks/.test(ob.waarom), 'post zonder store-tikken: voorlopig oordeel op kliks: ' + ob.waarom);
const bb = await P.briefing({ medium: 'bluesky', project: 'nexy' });
ok(bb.voorlopig && bb.zonderTekst === 4 && /tekst niet gemeld/.test(bb.tekst), 'briefing: voorlopig signaal en melding van stukken zonder tekst');
ok(st.perMedium.bluesky && st.perMedium.bluesky.kliks === 11 && st.perMedium.propeller.conv > 0, 'per medium: kliks en conversies');

// ---- briefing ----
const br = await P.briefing({ medium: 'propeller', project: 'wam', doel: 'aanmelding' });
ok(br.ok && br.vast.some(x => x.id === 'ads-verkooptekst') && br.vast.some(x => x.id === 'boodschap-klopt'), 'briefing: vaste regels voor advertenties');
ok(br.laatste.length === 4 && br.families === 4 && /MELD JE STUK/.test(br.tekst), 'briefing: eerdere stukken van dit project en meldadres');
ok(br.elders.some(l => l.kenmerk === 'getal in de tekst' || l.kenmerk === 'haak' || l.kenmerk === 'opening'), 'briefing: kruisbestuiving uit alle projecten op dit medium ' + JSON.stringify(br.elders.map(l => l.kenmerk + '=' + l.waarde)));
ok(br.research.some(x => x.id === 'uitkomst-op-pagina' && /nog niet/.test(x.stand)), 'briefing: research als startkennis met stand');
const bx = await P.briefing({ medium: 'x', project: 'nexy' });
ok(bx.doel === 'store' && bx.werkt.some(l => l.kenmerk === 'haak' && l.waarde === 'probleem') && bx.werktNiet.some(l => l.kenmerk === 'haak' && l.waarde === 'belofte'), 'briefing posts: haak probleem werkt, belofte niet ' + JSON.stringify(bx.werkt.map(l => l.kenmerk + '=' + l.waarde)));
ok(bx.research.some(x => x.id === 'klachten-als-haak' && /bevestigd door eigen cijfers/.test(x.stand)), 'research bevestigd door eigen cijfers: ' + (bx.research.find(x => x.id === 'klachten-als-haak') || {}).stand);
ok(bx.vast.some(x => x.id === 'per-medium') && !bx.vast.some(x => x.id === 'ads-verkooptekst'), 'briefing posts: regel per medium wel, advertentieregel niet');
const bm = await P.briefing({ medium: 'mail', project: 'sealed' });
ok(bm.doel === 'antwoord' && (bm.vast.length + bm.research.length) >= 5, 'briefing mail: regels van de POST-lus ingeladen (' + (bm.vast.length + bm.research.length) + ')');
ok(!(await P.briefing({ medium: 'bestaatniet', project: 'x' })).ok, 'briefing zonder geldig medium geweigerd');

// ---- doel van een campagne vastzetten, met de hand melden, vergrendeling in distmaak ----
ok((await P.zetCampDoel('propeller:333', 'aanmelding')).ok && !(await P.zetCampDoel('propeller:333', 'onzin')).ok, 'campagnedoel zetten');
await P.ronde({}); const c1b = await P.lees('ad:propeller:c1'); ok(c1b.doel.soort === 'aanmelding' && !c1b.doel.afgeleid, 'creatives erven het doel van de campagne');
ok((await P.ronde({ rem: 5 })).overgeslagen, 'rem: niet twee keer binnen 5 uur');
const h1 = await P.zet({ medium: 'pinterest', project: 'kadoly', titel: 'Cadeau voor hem' }, { streng: ['hand'] }); ok(!h1.ok && /doel/.test(h1.fout), 'met de hand: zonder doel geweigerd');
const h2 = await P.zet({ medium: 'pinterest', project: 'kadoly', doel: 'klik', titel: 'Cadeau voor hem', pagina: 'https://gids.kadoly.com/cadeau-voor-hem' }, { streng: ['hand'] }); ok(h2.ok && h2.id.startsWith('hand:') && /op=briefing&medium=pinterest&project=kadoly&doel=klik/.test(h2.briefing), 'met de hand: volledig paspoort, briefing terug');
const h3 = await P.zet({ id: h2.id, cijfers: { vert: 900, kliks: 12 } }, { streng: ['hand'] }); ok(h3.ok && !h3.nieuw && (await P.lees(h2.id)).cijfers.kliks === 12 && (await P.lees(h2.id)).inhoud.titel === 'Cadeau voor hem', 'bijwerken met cijfers houdt het paspoort');
const D = await import('../lib/distlus.js');
const dm = await D.maak({ project: 'nexy', kanaal: 'x', plek: 'eigen account', onderwerp: 'gemiste oproep', soort: 'tekst-link', doel: 'https://nexy.now/missed-calls', doelsoort: 'store', tekst: 'Missed a call? Nexy picked up.' });
ok(dm.ok && dm.paspoort && dm.paspoort.medium === 'x' && dm.paspoort.doel.soort === 'store' && !dm.paspoort.doel.afgeleid && /op=briefing/.test(dm.briefing), 'distmaak: paspoort meteen in het geheugen, briefing terug');
ok(!!(await P.lees('post:' + dm.id)), 'distmaak: stuk staat in het geheugen');
const dm2 = await D.maak({ project: 'curacao', kanaal: 'reddit', plek: 'r/curacao', onderwerp: 'stranden', tekst: 'Playa Kenepa is rustig op dinsdag.' });
ok(dm2.ok && dm2.paspoort.doel.afgeleid && /doel van het project/.test(dm2.let), 'distmaak zonder doelsoort: doel van het project en een melding');
const dz = await D.zet(dm2.id, { haak: 'Tip', doelsoort: 'klik' }); const pz = await P.lees('post:' + dm2.id);
ok(dz.ok && pz.inhoud.haak === 'tip' && pz.doel.soort === 'klik' && !pz.doel.afgeleid, 'distzet: haak en doel van de maker komen meteen in het geheugen');
const dm3 = await D.maak({ project: 'nexy', kanaal: 'bluesky', plek: 'bluesky', onderwerp: '/v/x', doel: 'https://nexy.now/v/x' });
ok(dm3.ok && /geen tekst/.test(dm3.let) && (await P.lees('post:' + dm3.id)).medium === 'bluesky', 'distmaak zonder tekst waarschuwt; kanaal bluesky wordt herkend');
await D.zet(dm3.id, { tekst: 'Voicemail is where calls go to die.', haak: 'probleem' }); const p3 = await P.lees('post:' + dm3.id);
ok(p3.inhoud.tekst.startsWith('Voicemail') && p3.inhoud.haak === 'probleem', 'distzet met tekst: de tekst staat direct in het geheugen');
await P.stand({ vers: true }); const pc = await P.poortCheck('https://go.kadoly.com/shop?bundel=x&clickid=${SUBID}'), pc2 = await P.poortCheck('https://todayin.email/?lang=es');
ok(pc.dicht === true && pc.kliks === 1500 && pc2.dicht === false, 'uitkomstpoort: bestemming zonder uitkomst is dicht, een pagina met aanmeldingen open');
const blok = await P.dashBlok(); ok(blok && /stukken met paspoort/.test(blok.regels[0]), 'dashboardregel: ' + blok.regels[0]);
if (process.env.TOON) { console.log('\n' + (await P.briefing({ medium: 'x', project: 'nexy' })).tekst + '\n\n' + (await P.briefing({ medium: 'propeller', project: 'wam', doel: 'aanmelding' })).tekst + '\n\n' + P.standTekst(await P.stand({ vers: true }))); }

// ---- stap 7 (27 nov 2026): pins, modal, paginaproef, sneller uit, opruimen, native en trend, voorstel ----
await kv.set('bs:pinlog', [{ id: '20261125-we-dad-syxw', haak: 'we-dad', a: 'B0DK3CSYXW', post: 'p1', t: iso(nu - 2 * DAG), m: { klik: 4, saves: 2, imp: 300 } }, { id: '20261125-bestaatniet', haak: 'geen-haak', a: 'B0DK3CSYXW', t: iso(nu - 2 * DAG) }]);
await kv.set('hjdk:pin-direct:records', { 'nl:airfryer:0': { status: 'published', at: nu - 2 * DAG, title: 'Welke airfryer past bij jou?', target: 'https://keuzehulp.best/airfryer?utm_source=pinterest', board: 'Keuzehulpen · Keuken', pinId: '123' }, 'nl:stofzuiger:1': { status: 'uncertain', at: nu, title: 'x' } });
await kv.del('ps:stand'); const r7 = await P.ronde({});
ok(r7.bronnen.pins && r7.bronnen.pins.stukken === 2 && !r7.bronnen.pins.fout, 'ronde laadt 2 pins (boek en keuzehulp; onbekende haak en onbevestigde pin niet) ' + JSON.stringify(r7.bronnen.pins));
const pb = await P.lees('pin:bs-20261125-we-dad-syxw'), pk = await P.lees('pin:kz-nl.airfryer.0');
ok(pb && pb.medium === 'pinterest' && pb.soort === 'pin' && pb.voor.project === 'content' && pb.cijfers.kliks === 4 && pb.cijfers.vert === 300 && /dad jokes/i.test(pb.inhoud.titel) && pb.voor.pagina === 'stockingbooks.com/white-elephant-gifts-under-10', 'boekpin: tekst uit de haak, cijfers van Pinterest');
ok(pk && pk.voor.project === 'keuzehulpen' && pk.inhoud.titel.startsWith('Welke airfryer') && pk.cijfers == null && P.meet(pk) === null, 'keuzehulp-pin: staat in het geheugen, zonder cijfers geen meting (telt niet als nul)');
const md = P.stukkenUitModalData([{ site: 'kadoly', taal: 'nl', domeinen: ['kadoly.com'], armen: [{ id: 'ctrl', soort: 'geen' }, { id: 'mail1', soort: 'email', titel: 'Elke week een cadeautip', tekst: 'Eén mail per week', knop: 'Stuur mij tips' }], varianten: { mail1: [{ vid: 'v1', titel: 'Nooit meer een cadeau vergeten', tekst: 'Wij denken mee', knop: 'Ja graag' }, { vid: 'v2', uit: true, titel: 'weg' }] } }],
  { 'kadoly|mail1~v0': { toon: 500, klik: 40, aanmelding: 5 }, 'kadoly|mail1~v1': { toon: 500, klik: 60, aanmelding: 20 }, 'kadoly|mail1~v2': { toon: 90 } });
ok(md.length === 2 && md[0].id === 'modal:kadoly.mail1.v0' && md[1].doel === 'aanmelding' && md[1].cijfers.aanmelding === 20 && md[1].ouder === 'modal:kadoly.mail1' && md[1].cta === 'Ja graag', 'modal: elke getoonde variant van een arm is een stuk met doel aanmelding (uitgezette variant niet)');
const pf = P.stukkenUitProefStand({ ok: true, site: 'wmn', waarde: { tik: 1, deel: 20, meld: 40, aanmelding: 100 }, factoren: [{ id: 'lknop', pagina: 'voorkant', wat: 'Knop van het aansluitblok', versies: [{ id: 'a', naam: 'Ik doe mee', gezien: 400, stappen: { tik: 50, aanmelding: 12 } }, { id: 'b', naam: 'Sluit me aan', gezien: 0, stappen: {} }] }, { id: 'vkop', uit: true, versies: [{ id: 'a', naam: 'Dit zoeken we uit.', gezien: 900, stappen: {} }] }] });
ok(pf.length === 1 && pf[0].id === 'proef:wmn.lknop.a' && pf[0].project === 'wam' && pf[0].doel === 'aanmelding' && pf[0].cijfers.vert === 400 && pf[0].cijfers.aanmelding === 12 && pf[0].cijfers.kliks === 50 && pf[0].soort === 'paginakop', 'paginaproef: versie als stuk met de diepste stap als doel (onderdeel dat uit staat niet)');
for (const b of [...md, ...pf]) await P.zet(b);
const om = P.oordelen(await P.alle({})).find(x => x.id === 'modal:kadoly.mail1.v1');
ok(om && om.oordeel && /aanmeldingen tegen/.test(om.oordeel.waarom || '') && om.oordeel.uitslag === 'raak', 'modalvariant telt tegen zijn eigen arm: ' + JSON.stringify(om && om.oordeel));

// sneller uit: hard mis binnen de eigen campagne, liep de laatste 3 dagen nog
const st7 = await P.stand({ vers: true });
ok(st7.uit.length >= 1 && st7.uit.every(x => x.net === 'propeller' && /^\d+$/.test(x.campagne) === true && x.index <= 50 && x.verwacht >= 3 && x.bezoeken >= 100 && x.sinds) && !st7.uit.some(x => x.advertentie === 'a1'), 'uit-lijst: alleen advertenties die hard mis zijn ' + JSON.stringify(st7.uit.map(x => x.advertentie + ' ' + x.conversies + '/' + x.verwacht)));
const ua = await P.uitAds('propeller'); ok(ua.length === st7.uit.length && ua[0].campagne && ua[0].advertentie && ua[0].bron === 'geheugen' && (await P.uitAds('mondiad')).length === 0, 'uitAds: zelfde vorm als de lijst van de vroege voorspeller, per netwerk');
const oudeAds = P.oordelen(await P.alle({})).map(x => x.bron === 'ad' ? Object.assign({}, x, { laatst: dag(nu - 9 * DAG) }) : x);
ok(P.uitKandidaten(P.oordelen(oudeAds)).length === 0, 'uit-lijst: een advertentie die al 9 dagen niet meer loopt staat er niet op');
ok(/OP DE UIT-LIJST VANUIT HET GEHEUGEN/.test(P.standTekst(st7)) && /Gaat uit/.test(P.standHtml(st7, 'body{}')) && (await P.dashBlok()).regels.some(x => /uit-lijst/.test(x)), 'uit-lijst staat op de pagina, in de tekst en op het dashboard');
const lj = await P.lijst({ project: 'kadoly', regel: true });
ok(lj.ok && lj.stukken.some(x => x.id === 'ad:propeller:c2' && x.regel.includes('prijs in de advertentie') && x.campagne === 'camp:propeller:333') && !lj.stukken.some(x => x.id === 'ad:propeller:c1'), 'lijst: stukken tegen een vaste regel opvragen');

// opruimen: uit een bron, binnen het laadvenster, 14 dagen niet meer gezien
await P.zet({ id: 'post:dddddddddd01', bron: 'post', medium: 'x', project: 'nexy', tekst: 'Bestaat niet meer in de bron', t: iso(nu - 6 * DAG) }); await P.zet({ id: 'post:dddddddddd02', bron: 'post', medium: 'x', project: 'nexy', tekst: 'Nog kort geleden gezien', t: iso(nu - 6 * DAG) });
await kv.raw(['HSET', 'ps:gezien', 'post:dddddddddd01', dag(nu - 20 * DAG), 'post:dddddddddd02', dag(nu - 5 * DAG)]);
ok((await P.ruimOp({ bronnen: { posts: { stukken: 0, fout: 'bron stuk' } } })).weg === 0 && !!(await P.lees('post:dddddddddd01')), 'opruimen: een bron die niet gelezen kon worden ruimt niets op');
const ro = await P.ruimOp({ bronnen: { posts: { stukken: 13 } } });
ok(ro.weg === 1 && !(await P.lees('post:dddddddddd01')) && !!(await P.lees('post:dddddddddd02')) && !!(await P.lees(h2.id)) && !!(await P.lees('modal:kadoly.mail1.v0')), 'opruimen: alleen het stuk dat 14 dagen niet meer in zijn bron stond; met de hand gemeld en modal blijven');

// native en trend
const TR = await import('../lib/trend.js');
ok(!(await TR.zetTrend({ medium: 'x', items: [{ wat: 'kort', bron: 'https://x.com/a' }] })).ok && !(await TR.zetTrend({ medium: 'x', items: [{ wat: 'Threads waarin iemand een rekening laat zien doen het goed', bron: 'gehoord' }] })).ok, 'trend zonder inhoud of zonder bron geweigerd (niets verzinnen)');
const tz = await TR.zetTrend({ medium: 'x', wie: 'test', items: [{ wat: 'Posts die openen met een concreet bedrag dat iemand verloor krijgen deze week de meeste reposts', vorm: 'open met het bedrag, daarna één zin wat er gebeurde', voorbeeld: 'Lost a $2k job to voicemail.', bron: 'https://example.com/x-trends-week-48' }] });
const tx = await TR.leesTrend('x');
ok(tz.ok && tz.erbij === 1 && tx.vers && tx.items.length === 1 && tx.items[0].vorm.startsWith('open met'), 'trend melden en lezen: vers');
await kv.set('ps:trend:bluesky', { medium: 'bluesky', items: [{ id: 'o1', wat: 'Oude trend van vijf dagen terug op Bluesky', bron: 'https://example.com/b', t: iso(nu - 5 * DAG) }, { id: 'o2', wat: 'Trend van twintig dagen terug', bron: 'https://example.com/c', t: iso(nu - 20 * DAG) }] });
const tb = await TR.leesTrend('bluesky'); ok(!tb.vers && tb.items.length === 1, 'trend ouder dan 3 dagen is niet vers, ouder dan 14 dagen vervalt');
const tv = await TR.zetTrend({ medium: 'tiktok', wie: 'test', items: [{ wat: 'Unboxing zonder stem met alleen geluid van papier loopt extreem goed bij cadeaus', maat: '2,1 mln weergaven in 5 dagen', voorbeeld: 'https://www.tiktok.com/@x/video/1', bron: 'https://example.com/tiktok-trends' }] });
const tt = await TR.leesTrend('tiktok'); ok(tv.ok && tv.videomind === 1 && tt.vers && tt.items[0].maat.startsWith('2,1 mln') && (await VM.trends({ platform: 'tiktok' })).trends.length === 1, 'videotrend met een getal gaat naar de trendscan van Videomind en staat in de briefing van Clickmind');
const bx7 = await P.briefing({ medium: 'x', project: 'nexy' }), bb7 = await P.briefing({ medium: 'bluesky', project: 'nexy' }), bp7 = await P.briefing({ medium: 'propeller', project: 'wam', doel: 'aanmelding' });
ok(/NATIVE EN TREND/.test(bx7.tekst) && /WAT NU GROOT IS OP X/.test(bx7.tekst) && /concreet bedrag/.test(bx7.tekst) && bx7.vast.some(x => x.id === 'native-en-trend'), 'briefing: vaste regel native en trend, met wat nu groot is op X');
ok(/DE TRENDKENNIS VAN BLUESKY IS OUD/.test(bb7.tekst) && /op=trend/.test(bb7.tekst) && /het best liep/.test(bp7.tekst) && !/op=trend&j/.test(bp7.tekst), 'briefing: oude trendkennis zegt eerst zoeken en melden; een advertentienetwerk gebruikt de eigen winnaars');
const dn = await D.maak({ project: 'nexy', kanaal: 'x', plek: 'eigen account', onderwerp: 'gemiste oproep', soort: 'tekst-link', doel: 'https://nexy.now/missed-calls', doelsoort: 'store', variant: 'native', tekst: 'Your phone rang 4 times while you were on a job. Nexy answered all 4.' });
ok(dn.ok && /trend-alternatief/.test(dn.let) && dn.let.includes('paar=' + dn.id) && dn.trend && dn.trend.vers === true, 'distmaak: een native post krijgt de vraag om het trend-alternatief, met de trendkennis erbij');
const dt = await D.maak({ project: 'nexy', kanaal: 'x', plek: 'eigen account', onderwerp: 'gemiste oproep', soort: 'tekst-link', doel: 'https://nexy.now/missed-calls', doelsoort: 'store', variant: 'trend', trend: 'openen met een concreet bedrag', paar: dn.id, tekst: 'Lost a $2k job to voicemail last week. Now Nexy picks up.' });
const sn = await P.lees('post:' + dn.id), stt = await P.lees('post:' + dt.id);
ok(dt.ok && !/trend-alternatief/.test(dt.let || '') && stt.variant === 'trend' && stt.trend === 'openen met een concreet bedrag' && stt.paar === 'post:' + dn.id && sn.variant === 'native' && sn.paar === 'post:' + dt.id, 'tweeling: native en trend zijn aan elkaar gekoppeld in het geheugen');
const dt2 = await D.maak({ project: 'nexy', kanaal: 'x', doel: 'https://nexy.now/missed-calls', variant: 'trend', tekst: 'Zonder trend en zonder paar.' }); ok(/variant=trend zonder trend=/.test(dt2.let) && /geen paar=/.test(dt2.let), 'trend-alternatief zonder trend of paar krijgt een melding');
const twS = (id, variant, paar, extra = {}) => Object.assign({ id, betaald: false, bron: 'post', dag: '2026-12-01', status: 'geplaatst', variant, paar }, extra);
const tw = P.tweeling([twS('n1', 'native', 't1'), twS('t1', 'trend', 'n1'), twS('n2', 'native', ''), twS('n3', 'native', '', { dag: '2026-11-20' }), twS('m1', 'native', '', { bron: 'mail' }), twS('a1', 'native', '', { betaald: true })]);
ok(tw.sinds === 3 && tw.trend === 1 && tw.met === 1 && tw.zonder === 1, 'tweeling-telling: alleen onbetaalde stukken sinds de regel, zonder mail ' + JSON.stringify(tw));
const TK = await import('../lib/taken.js'), open7 = async () => (await TK.leesTaken(kv)).taken.filter(x => /^Trendcheck voor Clickmind/.test(x.tekst));
ok((await open7()).length === 1 && /Bluesky/.test((await open7())[0].tekst), 'de ronde zet zelf één trendtaak voor de platforms zonder verse trendkennis');
await kv.del('ps:trendtaak'); const tk1 = await TR.trendTaak(['x', 'bluesky']);
ok(tk1.oud.join() === 'bluesky' && tk1.taak === 'staat al open' && (await open7()).length === 1, 'trendtaak: geen tweede taak zolang er één open staat ' + JSON.stringify(tk1));

// voorstel: Henkjan ziet het eerst; een tekst met prijs wordt geweigerd; plaatsen kan alleen na ja
const vz = await TR.zetVoorstel({ titel: 'Kadoly: zonder prijs naast met prijs', project: 'kadoly', medium: 'propeller', uitleg: 'Proef.', items: [{ campagne: '333', campagneNaam: 'SHOP-LUS PAKKET', oudId: 'ad:propeller:c2', oudTitel: 'Houten kaart, €99,95', titel: 'De kaart waar hij uren naar kijkt', tekst: 'Houten wereldkaart voor aan de muur', cta: 'Bekijk hem' }, { campagne: '333', campagneNaam: 'SHOP-LUS PAKKET', titel: 'Nu voor €89,95', tekst: 'Morgen in huis' }] });
ok(vz.ok && vz.stukken === 1 && vz.geweigerd.length === 1 && /prijs/.test(vz.geweigerd[0]) && /\/voorstel\?id=/.test(vz.link), 'voorstel: tekst met prijs of levertijd geweigerd, de rest staat op een link');
ok(!(await TR.besluitVoorstel(vz.id, 'geplaatst')).ok && (await TR.besluitVoorstel(vz.id, 'ja', { wie: 'henkjan' })).ok && (await TR.besluitVoorstel(vz.id, 'geplaatst')).ok && (await TR.leesVoorstel(vz.id)).status === 'geplaatst', 'voorstel: plaatsen kan alleen na Henkjans ja');
const vv = await TR.leesVoorstel(vz.id); ok(/De kaart waar hij uren naar kijkt/.test(TR.voorstelHtml(vv, 'body{}')) && /Houten kaart, €99,95/.test(TR.voorstelHtml(vv, 'body{}')) && /NIEUW: De kaart/.test(TR.voorstelTekst(vv)) && /Voorstellen/.test(TR.voorstelHtml(null, 'body{}', [vv])), 'voorstel: pagina toont nieuw naast nu, en de lijst');

// live-check van een advertentievoorstel (27 nov 2026): geen vraag aan Henkjan over campagnes die vandaag niet lopen
await kv.set('mm:dash:camp', { t: Date.now(), pa: { budget: { winst: [{ cid: '111', naam: 'TODAYIN CURACAO CO VE', net: 'propeller', kosten: 0.4 }], projecten: {} } } });
const vd = await TR.zetVoorstel({ titel: 'Dood', project: 'kadoly', medium: 'propeller', items: [{ campagne: '333', campagneNaam: 'SHOP-LUS PAKKET', oudId: 'ad:propeller:c2', titel: 'Cadeau voor hem geregeld', tekst: 'Houten kaart van NL' }] });
ok(!vd.ok && /loopt vandaag/.test(vd.fout), 'voorstel voor een campagne die vandaag niet loopt wordt geweigerd: ' + vd.fout);
const vm = await TR.zetVoorstel({ titel: 'Half', project: 'curacao', medium: 'propeller', items: [{ campagne: '111', campagneNaam: 'TODAYIN', oudId: 'ad:propeller:a1', titel: 'Wat doe je vandaag op Curacao?', tekst: 'Vraag het de chat' }, { campagne: '333', campagneNaam: 'SHOP-LUS', titel: 'Cadeau voor hem geregeld', tekst: 'Houten kaart van NL' }] });
const vmv = await TR.leesVoorstel(vm.id);
ok(vm.ok && /1 stukken/.test(vm.let) && vmv.items[0].loopt === true && vmv.items[1].loopt === false && /LOOPT NIET/.test(TR.voorstelTekst(vmv)), 'voorstel met een deel dat niet loopt: staat erbij, de rest mag');
await kv.del('mm:dash:camp');
ok((await TR.besluitVoorstel(vm.id, 'vervallen', { notitie: 'Campagnes staan uit.' })).ok && /Vervallen\. Campagnes staan uit\./.test(TR.voorstelTekst(await TR.leesVoorstel(vm.id))), 'voorstel sluiten als vervallen, met de reden erbij');
const bk = await P.briefing({ medium: 'propeller', project: 'kadoly', doel: 'koop' });
ok(bk.research.some(x => x.id === 'kadoly-prijs-1126'), 'les over prijs in de advertentie staat als startkennis in de briefing van advertenties');

// oude dagen uit het archief tellen mee (cm:campdagen), ook buiten de laatste 45 dagen; ouder dan 120 dagen niet
const oudDag = dag(nu - 60 * DAG), heelOud = dag(nu - 130 * DAG);
await kv.set('cm:camp:' + oudDag, [camp('555', 'TODAYIN CURACAO OUD | In-Page | CPA 0.01', 'todayin', [cr('o1', '¿Playa o ciudad hoy?', 'vraag', 100, 9)], { echt: 10, actie: 2, aanmelding: 1, dialoog: 0, koop: 0, bezoek: 90 }, 'https://todayin.email/?lang=es')]);
await kv.set('cm:camp:' + heelOud, [camp('556', 'TODAYIN CURACAO HEEL OUD', 'todayin', [cr('o2', 'Te oud', 'vraag', 100, 9)], { echt: 1 }, 'https://todayin.email/')]);
await kv.raw(['SADD', 'cm:campdagen', oudDag, heelOud]); await kv.del('ps:stand');
await P.ronde({});
ok(!!(await P.lees('ad:propeller:o1')) && !(await P.lees('ad:propeller:o2')), 'een ingehaalde dag van 60 dagen terug telt mee, ouder dan 120 dagen niet');
if (!process.env.LAAT) await kv.raw(["FLUSHDB"]); process.exit(process.exitCode || 0);
