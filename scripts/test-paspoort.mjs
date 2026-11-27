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
await kv.raw(['FLUSHDB']); process.exit(process.exitCode || 0);
