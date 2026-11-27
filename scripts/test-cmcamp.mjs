// Test campagne-archief (lib/cmcamp.js) tegen een lokale Redis, zonder netwerk (nagemaakte antwoorden van de netwerken):
//   redis-server --port 6413 --save "" --appendonly no --daemonize yes
//   KV_REDIS_URL=redis://127.0.0.1:6413 node scripts/test-cmcamp.mjs ; redis-cli -p 6413 shutdown nosave
if (!/127\.0\.0\.1|localhost/.test(String(process.env.KV_REDIS_URL || ''))) { console.log('overgeslagen: alleen tegen een lokale Redis (KV_REDIS_URL=redis://127.0.0.1:...)'); process.exit(0); }
const { kv } = await import('../lib/db.js'); await kv.raw(['FLUSHDB']);
const C = await import('../lib/cmcamp.js'), P = await import('../lib/paspoort.js');
const ok = (c, n) => { if (!c) { console.log('FOUT', n); process.exitCode = 1; } else console.log('ok  ', n); };
const dag = i => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10), D = dag(2), D1 = dag(3), D2 = dag(4);

// ---- nagemaakte netwerken ----
let md = { calls: 0, meta: 0, stuk: false };
C.B.md = async (naam, a) => {
  md.calls++; if (md.stuk) throw new Error('Mondiad ligt eruit');
  if (naam === 'mondiad_campaign_report' && a.breakdown === 'CAMPAIGN') return { meta: { totalPages: 1 }, data: [{ campaignId: 11, campaignName: 'TODAYIN CURACAO NL | CLASSIC PUSH', impressions: 3000, clicks: 40, spent: 0.1234, conversions: 3 }, { campaignId: 12, campaignName: 'WAM SAMEN NL | push', impressions: 10, clicks: 0, spent: 0, conversions: 0 }] };
  if (naam === 'mondiad_campaign_report') return { meta: { totalPages: 1 }, data: [ // twee rijen voor creative 101 (per carrier): optellen
    { campaignId: 11, creativeId: 101, creativeTag: 'c1', creativeTitle: 'Waar is het strand?', carrierName: 'Wi-Fi/Wired', impressions: 1000, clicks: 10, spent: 0.03, conversions: 1 },
    { campaignId: 11, creativeId: 101, creativeTag: 'c1', creativeTitle: 'Waar is het strand?', carrierName: 'Mobile', impressions: 500, clicks: 10, spent: 0.02, conversions: 0 },
    { campaignId: 11, creativeId: 102, creativeTag: 'c2', creativeTitle: 'Open vandaag', carrierName: 'Wi-Fi/Wired', impressions: 1500, clicks: 20, spent: 0.0734, conversions: 2 }] };
  if (naam === 'mondiad_get_creatives_by_campaign') { md.meta++; return [{ id: 101, tag: 'c1', title: 'Waar is het strand?', description: 'Vraag het de chat', image: 'https://img.test/a.png', icon: 'i.png', status: 'Active', campaignId: 11 }, { id: 102, tag: 'c2', title: 'Open vandaag', description: 'Wie is nu open', image: null, icon: 'icon_2.png', status: 'Active', campaignId: 11 }]; }
  if (naam === 'mondiad_get_campaign_details') return [{ id: 11, name: 'x', status: 'Running', bid: 0.15, bidType: 'CPA', dailyBudget: 10, url: 'https://todayin.email/?c=md[campaignid]', countryTargeting: ['NL'], adType: ['CLASSIC_PUSH'] }];
  throw new Error('onbekend ' + naam);
};
let pa = [{ id: '900', naam: 'TODAYIN CURACAO ES | In-Page', kliks: 50, kosten: 0.5, vert: 5000, conv: 4, instellingen: { formaat: 61, landing: 'https://todayin.email/?lang=es' }, creatives: [{ id: 'p1', titel: '¿Qué playa hoy?', tekst: 'Pregunta', vert: 5000, kliks: 50, kosten: 0.5, conv: 4 }] }];
let tt = { ok: true, campagnes: [] };
C.B.propeller = async () => ({ ok: true, campagnes: pa.map(c => ({ net: 'propeller', ...c, project: 'todayin' })) });
C.B.gads = async () => ({ ok: true, campagnes: [] });
C.B.tiktok = async () => tt;
C.B.meta = async () => ({ ok: true, campagnes: [] });
C.B.labels = async () => ({ nieuw: 0 });
C.B.geheugen = async () => ({ stukken: 0 });
const N = x => Number(x) || 0;
const lees = async d => (await kv.get('cm:camp:' + d)) || [];
const van = (l, net) => l.filter(c => c.net === net);

// ---- A: Mondiad met advertenties ----
let r = await C.ronde({ dag: D });
let l = await lees(D), m11 = van(l, 'mondiad');
ok(r.ok && m11.length === 1 && m11[0].id === '11', 'A: alleen Mondiad-campagnes met kosten of kliks (12 zonder niets valt weg)');
ok(m11[0].creatives.length === 2 && m11[0].kliks === 40 && m11[0].kosten === 0.1234 && m11[0].vert === 3000 && m11[0].conv === 3, 'A: campagne met creatives, vier decimalen kosten');
const c101 = m11[0].creatives.find(c => c.id === '101'), c102 = m11[0].creatives.find(c => c.id === '102');
ok(c101 && c101.kliks === 20 && c101.vert === 1500 && Math.abs(c101.kosten - 0.05) < 1e-9 && c101.tekst === 'Vraag het de chat' && c101.beeld === 'https://img.test/a.png' && c101.titel === 'Waar is het strand?', 'A: rijen per carrier opgeteld, tekst en beeld uit get_creatives');
ok(c102 && c102.beeld === 'icon_2.png' && c102.tag === 'c2', 'A: zonder image het icoon');
const i11 = m11[0].instellingen; ok(i11.formaat === 'classic push' && i11.biedmodel === 'CPA' && i11.boden[0].bod === 0.15 && i11.boden[0].landen[0] === 'nl' && i11.dagbudget === 10 && /todayin/.test(i11.landing), 'A: instellingen uit campaign_details');
ok(m11[0].project === 'todayin' && m11[0].eigen && 'echt' in m11[0].eigen && van(l, 'propeller').length === 1, 'A: project en eigen uitkomsten erbij, PropellerAds ernaast');
const metaNa1 = md.meta; await C.ronde({ dag: D });
ok(md.meta === metaNa1 && (await kv.get('cm:mdcr:11')).cr['101'], 'A: creatives en instellingen uit kv, niet opnieuw opgehaald');
const stukken = P.stukkenUitCampagnes([{ dag: D, camps: l }]);
ok(stukken.some(s => s.medium === 'mondiad' && /Vraag het de chat/.test(s.tekst) && s.id === 'ad:mondiad:101'), 'D: paspoort laadt de Mondiad-creatives (medium mondiad)');

// ---- tijdsbudget: zonder tijd blijft de creative staan met de titel uit het rapport ----
await kv.raw(['DEL', 'cm:mdcr:11']);
const t = await C.mondiadDag(D, { md: C.B.md, tijd: -1 });
ok(t.ok && t.campagnes[0].creatives.length === 2 && t.campagnes[0].creatives[0].titel && t.campagnes[0].creatives[0].tekst === '' && t.fouten.some(f => /tijdsbudget/.test(f)), 'A: tijdsbudget op: creatives met titel uit het rapport, zonder tekst');
// een fout bij tekst en beeld wordt kort onthouden en laat de creative staan
await kv.raw(['DEL', 'cm:mdcr:11']); const echt = C.B.md; let faal = 0;
const m2 = await C.mondiadDag(D, { md: async (n, a) => { if (/get_/.test(n)) { faal++; throw new Error('429'); } return echt(n, a); } });
ok(m2.ok && m2.campagnes[0].creatives.length === 2 && faal === 2 && (await kv.get('cm:mdcr:11')).fout && (await kv.raw(['TTL', 'cm:mdcr:11'])) <= 900, 'A: fout bij tekst of instellingen: creatives blijven, fout 15 minuten onthouden');
await kv.raw(['DEL', 'cm:mdcr:11']);

// ---- B: alleen laat andere netwerken staan ----
pa = [{ id: '901', naam: 'ANDERE CAMPAGNE', kliks: 1, kosten: 0.01, creatives: [] }];
r = await C.ronde({ dag: D, alleen: 'mondiad' }); l = await lees(D);
ok(r.alleen === 'mondiad' && van(l, 'propeller').length === 1 && van(l, 'propeller')[0].id === '900' && van(l, 'mondiad').length === 1, 'B: alleen=mondiad laat PropellerAds van die dag zoals hij was');
ok(!(await C.ronde({ dag: D, alleen: 'mgid' })).ok, 'B: alleen=mgid geweigerd (geen ophaalbaar netwerk)');

// ---- C: leg(mgid) ----
const mg = (id, naam, k) => ({ id, naam, vert: 1000, kliks: 10, kosten: k, conv: 0, munt: 'EUR', instellingen: { formaat: 'mgid product native', landing: 'https://keuzehulp.best/shop', boden: [{ bod: 0.03, landen: ['nl'] }] }, creatives: [{ id: 'm' + id, titel: 'Titel', tekst: 'Tekst van de advertentie', beeld: 'https://img.test/m.jpg', cta: 'Try now', landing: 'https://keuzehulp.best/shop', vert: 1000, kliks: 10, kosten: k, conv: 0 }] });
const bestand = { net: 'mgid', bron: 'test', munt: 'EUR', dagen: { [D]: [mg('5', 'SHOP-LUS MGID 2026-11-04 A | wonen', 4.5), mg('6', 'TODAYIN CURACAO NL DE US MGID', 1.25)], [D1]: [mg('5', 'SHOP-LUS MGID 2026-11-04 A | wonen', 2)] } };
r = await C.leg('mgid', { bestand }); l = await lees(D);
ok(r.ok && r.dagen === 2 && r.koers === 1.155 && r.munt === 'USD' && r.munt_bron === 'EUR' && r.kosten_bron_totaal === 7.75 && r.kosten_totaal === 8.95 && r.per[D].kosten === 6.64 && r.per[D].kosten_bron === 5.75 && van(l, 'mgid').length === 2 && van(l, 'propeller').length === 1 && van(l, 'mondiad').length === 1, 'C: leg(mgid) zet de dagen erin en laat de rest van de dag staan');
const g5 = van(l, 'mgid').find(c => c.id === '5'); ok(g5.project && g5.merk && g5.eigen && 'waarde' in g5, 'C: project, merk, eigen uitkomsten en waarde bij de ingelegde campagne');
ok(g5.munt === 'USD' && g5.munt_bron === 'EUR' && g5.kosten_bron === 4.5 && g5.kosten === 5.2 && Math.abs(g5.creatives[0].kosten - 5.1975) < 1e-9 && Math.abs(g5.instellingen.boden[0].bod - 0.0347) < 1e-9, 'C: euro\'s omgerekend naar dollars (koers /api/geld), het bedrag in euro blijft in kosten_bron');
ok((await kv.raw(['SISMEMBER', 'cm:campdagen', D1])) == 1 && (await lees(D1)).length === 1, 'C: dag in cm:campdagen');
r = await C.ronde({ dag: D }); l = await lees(D);
ok(van(l, 'mgid').length === 2 && van(l, 'propeller')[0].id === '901', 'C: een volgende ronde laat MGID staan (en haalt de rest opnieuw op)');
ok(!(await C.leg('propeller')).ok && !(await C.leg('mgid', { bestand: { dagen: null } })).ok, 'C: leg weigert een netwerk dat de ronde zelf ophaalt en een leeg bestand');
// het echte bestand in de repo
const echtBestand = await C.leg('mgid').catch(e => ({ ok: false, fout: String(e) }));
ok(echtBestand.ok && echtBestand.dagen === 5 && Math.abs(echtBestand.kosten_bron_totaal - 193.59) < 0.005 && echtBestand.munt_bron === 'EUR' && Math.abs(echtBestand.kosten_totaal - 193.59 * 1.155) < 0.06, 'C: data/camp-historie/mgid.json: 5 dagen, som 193,59 EUR, in dollars 223,60');
// eerder gemeten uitkomsten blijven staan als de dagtellers verlopen zijn (hier: er zijn geen tellers), bij een campagne die blijft staan en bij een die opnieuw is opgehaald
{ const DX = dag(20); await kv.set('cm:camp:' + DX, [{ net: 'propeller', id: '901', naam: 'ANDERE CAMPAGNE', project: 'todayin', kosten: 1, kliks: 5, creatives: [], gemeten: true, eigen: { echt: 7, actie: 2, aanmelding: 1, dialoog: 0, koop: 0, bezoek: 9 } }, { net: 'mondiad', id: '11', naam: 'TODAYIN CURACAO NL | CLASSIC PUSH', project: 'todayin', kosten: 0.1, kliks: 40, creatives: [], gemeten: true, eigen: { echt: 3, actie: 0, aanmelding: 0, dialoog: 0, koop: 0, bezoek: 4 } }], {});
  await C.ronde({ dag: DX, alleen: 'mondiad' }); let lx = await lees(DX);
  ok(van(lx, 'propeller')[0].eigen.echt === 7 && van(lx, 'propeller')[0].gemeten === true && van(lx, 'mondiad')[0].eigen.echt === 3 && van(lx, 'mondiad')[0].gemeten === true && van(lx, 'mondiad')[0].creatives.length === 2, 'B: eerder gemeten uitkomsten blijven staan als er geen dagtellers meer zijn');
  await kv.raw(['HSET', 'mm:cu:' + DX, 'mondiad|11|echt', '5']); await C.ronde({ dag: DX, alleen: 'mondiad' }); lx = await lees(DX);
  ok(van(lx, 'mondiad')[0].eigen.echt === 5 && van(lx, 'propeller')[0].eigen.echt === 7, 'B: zijn er wel tellers, dan gaat de nieuwe telling voor'); }

// ---- een falend Mondiad of TikTok maakt de dag niet leeg ----
await kv.set('cm:camp:' + D2, [{ net: 'tiktok', id: 'tt-kadoly', naam: 'TikTok Kadoly', project: 'kadoly', kosten: 5, kliks: 9, creatives: [] }, ...m11], {});
md.stuk = true; tt = { ok: false, fout: 'token verlopen', campagnes: [] };
r = await C.ronde({ dag: D2 }); l = await lees(D2);
ok(van(l, 'mondiad').length === 1 && van(l, 'mondiad')[0].creatives.length === 2 && van(l, 'tiktok').length === 1 && r.fouten.some(f => /^mondiad/.test(f)) && r.fouten.some(f => /^tiktok/.test(f)), 'E: Mondiad of TikTok faalt: oude campagnes met creatives blijven staan');
md.stuk = false; tt = { ok: true, campagnes: [] };

// ---- B: inhaal per netwerk raakt cm:inhaal niet ----
const gewoon = { van: '2026-08-01', tot: '2026-11-26', gedaan: ['2026-08-01'], poging: {}, fouten: {}, per: { propeller: { dagen: 1, campagnes: 2, kosten: 3 } }, start: 'x' };
await kv.set('cm:inhaal', gewoon);
const v1 = dag(9), v2 = dag(8), v3 = dag(7);
r = await C.inhaal({ van: v1, tot: v3, alleen: 'mondiad', tijd: -1 });
ok(r.rest === 3 && r.alleen === 'mondiad' && !r.klaar, 'B: netwerk-inhaal gestart, zonder tijd blijft alles over');
r = await C.inhaalCron({ tijd: -1 }); // de gewone inhaal heeft rest en blijft eerst: geen netwerk-inhaal
ok(N(r.rest) > 0 && !r.netwerk && !(await kv.get('cm:inhaal:mondiad')).klaar, 'B: cron: de gewone inhaal gaat voor, de netwerk-inhaal wacht');
await kv.set('cm:inhaal', { ...gewoon, klaar: 'gisteren' });
r = await C.inhaalCron({}); const w = await kv.get('cm:inhaal:mondiad');
ok(r.gewoon && r.netwerk && r.netwerk.rest === 0 && w.klaar && w.gedaan.length === 3 && w.per.mondiad.dagen === 3 && w.geheugen.stukken === 0, 'B: cron: gewone klaar, dan de netwerk-inhaal; klaar laadt het geheugen één keer in');
const g2 = await kv.get('cm:inhaal'); ok(JSON.stringify({ ...g2, klaar: undefined }) === JSON.stringify({ ...gewoon, klaar: undefined }) && g2.klaar === 'gisteren', 'B: cm:inhaal (de lopende gewone inhaal) is onaangeroerd');
ok((await kv.raw(['EXISTS', 'cm:inhaal:slot'])) == 0 && (await kv.raw(['EXISTS', 'cm:inhaal:mondiad:slot'])) == 0, 'B: eigen slot per netwerk, geen slot blijft hangen');
ok((await lees(v2)).some(c => c.net === 'mondiad') && !(await lees(v2)).some(c => c.net === 'propeller'), 'B: ingehaalde dag heeft alleen Mondiad (de gewone inhaal vult de rest)');
// tijdsbudget voor tekst en beeld op: de dag komt terug in de netwerk-inhaal tot hij compleet is
{ const echtMd = C.B.mondiad, vx = dag(12); let vol = false;
  C.B.mondiad = async d => { const x = await echtMd(d); return vol ? x : { ...x, fouten: ['creatives mondiad: tijdsbudget op, 1 campagnes zonder tekst en beeld'] }; };
  r = await C.inhaal({ van: vx, tot: vx, alleen: 'mondiad' }); ok(r.rest === 1 && !r.klaar && (await lees(vx)).some(c => c.net === 'mondiad'), 'B: tijdsbudget op: de dag staat erin maar blijft in de netwerk-inhaal');
  vol = true; r = await C.inhaal({ alleen: 'mondiad' }); ok(r.rest === 0 && !!r.klaar, 'B: volgende poging zonder tekort: dag klaar');
  C.B.mondiad = echtMd; }
// ---- D: leer ----
const lr = await C.leer({ dagen: 14 });
ok(lr.ontbreekt.some(x => /RichAds/.test(x)) && lr.ontbreekt.some(x => /Clickadu/.test(x)) && lr.ontbreekt.some(x => /MGID: alleen de historie/.test(x)) && !lr.ontbreekt.some(x => /Mondiad/.test(x)), 'D: leer meldt wat echt ontbreekt (RichAds, Clickadu, MGID dagelijks), niet meer Mondiad');
ok(lr.netwerk === undefined && lr.kenmerken.netwerk.some(x => x.w === 'mondiad') && lr.kenmerken.netwerk.some(x => x.w === 'mgid') && !lr.let_munt, 'D: leer telt Mondiad en MGID mee, alles in dollars');
const stMg = P.stukkenUitCampagnes([{ dag: D, camps: await lees(D) }]);
ok(stMg.some(s => s.medium === 'mgid' && s.tekst === 'Tekst van de advertentie'), 'D: paspoort laadt ook de MGID-creatives (medium mgid)');
console.log(process.exitCode ? 'GEFAALD' : 'GESLAAGD');
await kv.raw(['FLUSHDB']); process.exit(process.exitCode || 0);
