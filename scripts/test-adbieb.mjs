// Test van lib/adbieb.js zonder netwerk en zonder Redis: een kv-stub in het geheugen en een ingespoten haal() en trend/taken.
import assert from 'node:assert/strict';
import * as AB from '../lib/adbieb.js';
import { briefingTekst } from '../lib/paspoort.js';

const NU = Date.parse('2026-11-28T03:00:00Z'), DAG = 864e5;
const stub = () => { const m = new Map(); return { m, async get(k) { const v = m.get(k); return v === undefined ? null : JSON.parse(v); }, async set(k, v) { m.set(k, JSON.stringify(v)); return 'OK'; },
  async raw(a) { if (a[0] === 'SET' && a.includes('NX')) { if (m.has(a[1])) return null; m.set(a[1], '"1"'); return 'OK'; } return null; } }; };
const meta = (id, pagina, dag, bereik, tekst, extra = {}) => ({ id, page_id: 'p-' + pagina, page_name: pagina, ad_delivery_start_time: new Date(NU - dag * DAG).toISOString().slice(0, 10), ad_creative_bodies: [tekst, tekst], ad_creative_link_titles: ['Titel ' + id],
  publisher_platforms: ['facebook', 'instagram'], eu_total_reach: bereik, media: [{ type: 'image', url: 'x' }], destination_urls: ['https://' + pagina.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.example/product?utm=1#a'], ad_library_url: 'https://www.facebook.com/ads/library/?id=' + id, ...extra });
let ok = 0; const t = (naam, f) => Promise.resolve().then(f).then(() => { ok++; console.log('ok  ', naam); }, e => { console.error('FOUT', naam, '\n', e); process.exitCode = 1; });

await t('normMeta: velden, unieke tekst, landing zonder query, geen media-URL', () => {
  const n = AB.normMeta(meta('1', 'Lamp BV', 143, 6641, 'Licht zonder snoer'), NU, 'cadeau');
  assert.equal(n.dagen, 143); assert.equal(n.bereik, 6641); assert.equal(n.tekst, 'Licht zonder snoer'); assert.equal(n.landing, 'https://lamp-bv.example/product'); assert.equal(n.beeld, 'beeld'); assert.ok(!JSON.stringify(n).includes('"url"'));
  assert.equal(AB.normMeta(meta('2', 'x', 5, 1, 't', { media: [{ type: 'video' }] }), NU).beeld, 'video'); assert.equal(AB.normMeta(meta('3', 'x', 5, 1, 't', { media: [{}, {}, {}] }), NU).beeld, 'carrousel (3)');
  const zonder = meta('4', 'x', 5, 1, 't'); delete zonder.media; assert.equal(AB.normMeta(zonder, NU).beeld, 'onbekend'); assert.equal(AB.normMeta({}, NU), null);
});
await t('kiesLanglopers: lang en groot eerst, hoogstens 2 per landingsdomein en 3 per pagina, kopieen tellen een keer, schaal per pagina', () => {
  const r = []; for (let i = 0; i < 5; i++) r.push(AB.normMeta(meta('a' + i, 'Groot', 200 - i, 5000, 'tekst ' + i), NU));
  r.push(AB.normMeta(meta('k1', 'Klein', 40, 100, 'zelfde'), NU), AB.normMeta(meta('k2', 'Klein', 41, 100, 'zelfde'), NU), AB.normMeta(meta('z', 'Nieuw', 2, 99999, 'gisteren'), NU));
  const k = AB.kiesLanglopers(r, { nu: NU }); assert.equal(k.filter(x => x.pagina === 'Groot').length, 2, 'hoogstens 2 per landingsdomein'); assert.equal(k.find(x => x.pagina === 'Groot').schaal, 5);
  const zl = r.filter(x => x.pagina === 'Groot').map(x => ({ ...x, landing: '' })); assert.equal(AB.kiesLanglopers(zl, { nu: NU }).length, 3, 'zonder landingspagina geldt hoogstens 3 per pagina');
  assert.equal(k.filter(x => x.pagina === 'Klein').length, 1); assert.equal(k[0].pagina, 'Groot'); assert.ok(k.findIndex(x => x.pagina === 'Nieuw') > k.findIndex(x => x.pagina === 'Klein'));
  assert.equal(AB.kiesLanglopers(Array.from({ length: 30 }, (_, i) => AB.normMeta(meta('b' + i, 'P' + i, 50, 10, 't' + i), NU)), { nu: NU }).length, 12);
});
await t('termen wisselen per dag: 4 per project, alles komt aan bod, overschrijving gaat voor, Kadoly krijgt productnamen', () => {
  const l = Array.from({ length: 10 }, (_, i) => 'term' + i); const gezien = new Set();
  for (let d = 0; d < 3; d++) { const v = AB.termenVandaag(l, NU + d * DAG); assert.equal(v.length, 4); v.forEach(x => gezien.add(x)); } assert.equal(gezien.size, 10);
  assert.deepEqual(AB.termenVandaag(['a', 'b'], NU), ['a', 'b']);
  const k = AB.termenVan('kadoly'); assert.ok(k.meta.some(x => x.product === 'Tavellio lamp')); assert.ok(k.meta.length > 4);
  const o = AB.termenVan('kadoly', { kadoly: { meta: [['bloemen', 'NL', 'nl']], tiktok: { land: 'BE', cats: ['FOOD'] } } }); assert.equal(o.meta.length, 1); assert.equal(o.meta[0].q, 'bloemen'); assert.equal(o.tt.land, 'BE');
  for (const p of Object.keys(AB.ZOEK)) { const T = AB.termenVan(p); assert.ok(T.meta.length >= 3 && T.meta.length <= 5 + 9, p); assert.ok(!T.tt || (T.tt.cats.length >= 1 && T.tt.cats.length <= 3), p); assert.equal(!!T.tt, ['kadoly', 'nexy'].includes(p), p + ': TikTok alleen waar het project op TikTok zit'); }
});
await t('TikTok: hashtags top en stijgers, video\'s uit share_url, benchmark met te weinig vertoningen is een melding', async () => {
  const fx = JSON.parse((await import('node:fs')).readFileSync(new URL('./fixtures/adbieb-tt.json', import.meta.url), 'utf8'));
  const h = AB.kiesHashtags(fx.trending.data.list, { land: 'NL', cat: 'HOUSEHOLD_PRODUCTS' }); assert.ok(h.length >= 3 && h.length <= 8); assert.equal(h[0].naam, 'speelgoed', 'groot in het eigen land gaat voor'); assert.equal(h[0].lokaal, true); assert.equal(h[1].naam, 'lego'); assert.equal(h[1].rang, 1);
  const nw = AB.kiesHashtags([...fx.trending.data.list, { hashtag_id: '9', hashtag_name: 'stoomreiniger', rank_position: '41', rank_change: 'NEW', views: 1008176, posts: 122, top_country_list: ['NL', 'BE'] }], { land: 'NL' }).find(x => x.naam === 'stoomreiniger'); assert.ok(nw && nw.nieuw && nw.stijger && nw.verandering === 0, 'NEW telt als stijger');
  assert.ok(h.some(x => x.stijger && x.verandering >= 5)); assert.equal(new Set(h.map(x => x.id)).size, h.length);
  const v = AB.kiesVideos(fx.videos.data.list); assert.equal(v.length, 2); assert.ok(v.every(x => /^https:\/\/www\.tiktok\.com\/@/.test(x.url) && !x.url.includes('?'))); assert.equal(v[0].naam, 'speelgoed');
  const b = AB.benchSamen(fx.bench.data); assert.equal(b.totaal, 3); assert.equal(b.metWaarden, 1); assert.match(b.melding, /1 van 3/); assert.equal(b.ads[0].ctr, 0.4);
  assert.match(AB.benchSamen({ items: [{ info: { ad_id: '1' }, metrics: {} }] }).melding, /minder dan 1\.000 vertoningen/);
});

// ronde met ingespoten haal: Meta geeft 2 rijen bij 90 dagen (dus ook 30 proberen), TikTok geeft de fixture, een term geeft een HTTP-fout
const fx = JSON.parse((await import('node:fs')).readFileSync(new URL('./fixtures/adbieb-tt.json', import.meta.url), 'utf8'));
const FALEND = AB.termenVandaag(AB.termenVan('kadoly').meta, NU)[0].q; const aanroepen = []; const haal = async (url, o) => {
  const u = new URL(url); aanroepen.push(u); const js = (j, status = 200) => ({ ok: status < 400, status, json: async () => j, text: async () => JSON.stringify(j) });
  if (u.hostname === 'zernio.com') { assert.match(o.headers.authorization, /^Bearer /); const q = u.searchParams.get('q');
    if (q === FALEND) return js({ error: 'fout van test' }, 500);
    const tot = u.searchParams.get('until') === new Date(NU - 90 * DAG).toISOString().slice(0, 10) ? 2 : 4; return js({ platform: 'meta', data: Array.from({ length: tot }, (_, i) => meta('r' + q.length + i + tot, 'Pagina ' + (i % 2), 120 - i, 1000 * (i + 1), 'Tekst ' + q + i)), paging: {} }); }
  if (u.pathname.endsWith('/trending_list/')) return js(fx.trending); if (u.pathname.endsWith('/video_list/')) return js(fx.videos); if (u.pathname.endsWith('/ad_benchmark/get/')) return js(fx.bench);
  throw new Error('onverwacht ' + url); };
const getrend = []; const hulp = { trend: { zetTrend: async b => { getrend.push(b); return { ok: true, erbij: b.items.length }; } }, taken: { leesTaken: async () => ({ taken: [] }), zetTaken: async (k, b) => { hulp.gezet.push(b); return { ok: true, taak: 'T1' }; } }, gezet: [] };
const kvx = stub();
await t('ronde: elke (project, bron, term) een keer, fout stopt de rest niet, tweede aanroep maakt af, daarna niets meer', async () => {
  const r = await AB.ronde({ nu: NU, haal, kvx, sleutels: { zernio: 'z', tiktok: 't', adv: '1' }, alleen: 'kadoly', hulp });
  assert.equal(r.ok, true); assert.ok(r.fouten.some(f => f.includes(FALEND) && /500/.test(f)), 'HTTP-fout zichtbaar: ' + r.fouten); assert.equal(r.meta.fout, 1); assert.ok(r.meta.ok >= 1); assert.ok(r.tiktok.ok >= 3);
  assert.ok(aanroepen.some(u => u.searchParams.get('includeMedia') === 'true' && u.searchParams.get('status') === 'ACTIVE' && u.searchParams.get('countries')));
  assert.ok(aanroepen.some(u => u.hostname === 'zernio.com' && u.searchParams.get('until') === new Date(NU - 30 * DAG).toISOString().slice(0, 10)), 'te weinig rijen: venster 30 dagen');
  const p = await kvx.get('ab:p:kadoly'); assert.ok(p.meta.length >= 1 && p.tt.hashtags.length >= 3 && p.bench); const S = await AB.stand({ kvx, nu: NU }); assert.ok(S.bronnen.meta.laatsteOk); assert.match(S.bronnen.meta.laatsteFout || '', /500/);
  const n1 = aanroepen.length; const r2 = await AB.ronde({ nu: NU, haal, kvx, sleutels: { zernio: 'z', tiktok: 't', adv: '1' }, alleen: 'kadoly', hulp });
  assert.equal(r2.meta.ok, 0); assert.equal(r2.meta.fout, 1, 'alleen de mislukte term opnieuw'); assert.equal(aanroepen.length - n1 <= 1, true, 'niets dubbel'); assert.ok(r2.open <= 1);
});
await t('trendkennis: meta en tiktok gemeld, niets twee keer, hoogstens 12', async () => {
  assert.ok(getrend.some(b => b.medium === 'meta' && b.items.every(x => /^https:\/\//.test(x.bron) && x.maat && x.items === undefined))); const tk = getrend.find(b => b.medium === 'tiktok'); assert.ok(tk && tk.items.length >= 1 && tk.items.every(x => x.maat && /^https:\/\/www\.tiktok\.com\/tag\//.test(x.bron)));
  assert.ok(getrend.every(b => b.items.length <= 12)); const voor = getrend.length; const m = await AB.meldTrend({ kvx, nu: NU, hulp }); assert.deepEqual(m, {}); assert.equal(getrend.length, voor);
});
await t('zonder sleutel: duidelijke fout in de stand, geen crash', async () => {
  const k2 = stub(); const r = await AB.ronde({ nu: NU, haal, kvx: k2, sleutels: { zernio: '', tiktok: '' }, alleen: 'tk', hulp: { ...hulp, gezet: [] } }); assert.ok(r.fouten.length >= 2 && r.fouten.every(f => /geen (Zernio|TikTok)-sleutel/.test(f)));
  assert.match((await AB.stand({ kvx: k2, nu: NU })).bronnen.meta.laatsteFout, /Zernio-sleutel/);
});
await t('zet: ruwe rijen van een chat, onbekend project en lege rijen geweigerd', async () => {
  const k2 = stub(); const r = await AB.zet({ project: 'curacao', bron: 'meta', term: 'Curacao holiday', landen: 'GB', rijen: [meta('c1', 'Tui', 300, 9000, 'Curacao holiday in de zon'), meta('c2', 'Tui', 200, 100, 'Curacao holiday aan zee'), meta('c3', 'Busverhuur', 400, 50000, 'A family that travels together')] }, { kvx: k2, nu: NU, hulp });
  assert.equal(r.ok, true); assert.equal(r.langlopers, 2, 'de rij zonder de zoekwoorden valt weg'); assert.equal((await k2.get('ab:p:curacao')).meta[0].id, 'c1');
  assert.equal((await AB.zet({ project: 'curacao', bron: 'meta', term: 'Curacao holiday', rijen: [meta('c9', 'Busverhuur', 400, 50000, 'A family that travels together')] }, { kvx: k2, nu: NU, hulp })).ok, false);
  assert.equal((await AB.zet({ project: 'bestaatniet', bron: 'meta' }, { kvx: k2, nu: NU, hulp })).ok, false); assert.equal((await AB.zet({ project: 'tk', bron: 'meta', term: 'x', rijen: [] }, { kvx: k2, nu: NU, hulp })).ok, false);
  const t2 = await AB.zet({ project: 'tk', bron: 'tiktok', land: 'NL', cat: 'MUSIC', lijst: fx.trending.data.list, videos: fx.videos.data.list, benchmark: fx.bench }, { kvx: k2, nu: NU, hulp }); assert.equal(t2.ok, true); assert.ok(t2.hashtags >= 3);
});
await t('voorBriefing en briefingtekst: betaald medium krijgt langlopers, tiktok-ads hashtags en benchmark, Kadoly het Whop-bewijs, leeg en oud melden het', async () => {
  const k2 = stub();
  await AB.zet({ project: 'kadoly', bron: 'meta', term: 'Tavellio lamp', landen: 'NL,BE', rijen: [meta('w1', 'Luminize', 443, 20000, 'Tavellio lamp zonder snoer'), meta('w2', 'Luminize', 300, 900, 'Tavellio lamp als cadeau')] }, { kvx: k2, nu: NU, hulp });
  await AB.zet({ project: 'kadoly', bron: 'tiktok', land: 'NL', cat: 'HOME_AND_GARDEN', lijst: fx.trending.data.list, videos: fx.videos.data.list, benchmark: fx.bench }, { kvx: k2, nu: NU, hulp });
  const p = await AB.voorBriefing({ project: 'kadoly', medium: 'propeller', nu: NU, kvx: k2 }); assert.equal(p.vers, true); assert.ok(p.langlopers[0].includes('Luminize') && p.langlopers[0].includes('443 dagen')); assert.equal(p.tiktok.length, 0); assert.ok(p.producten[0].startsWith('Tavellio lamp: 2 langlopers'));
  const tt = await AB.voorBriefing({ project: 'kadoly', medium: 'tiktok-ads', nu: NU, kvx: k2 }); assert.ok(tt.tiktok.some(x => x.startsWith('#lego')) && tt.tiktok.some(x => /^Benchmark/.test(x))); assert.ok(tt.langlopers.length >= 1, 'ook tiktok-ads is betaald: langlopers erbij');
  assert.equal(await AB.voorBriefing({ project: 'kadoly', medium: 'instagram', nu: NU, kvx: k2 }), null); assert.equal(await AB.voorBriefing({ project: 'onbekend', medium: 'propeller', nu: NU, kvx: k2 }), null);
  const b0 = { medium: 'propeller', mediumNaam: 'PropellerAds', project: 'kadoly', doelNaam: 'klik', doel: 'klik', t: new Date(NU).toISOString(), stukkenHier: 0, families: 0, zonderTekst: 0, vast: [], werkt: [], werktNiet: [], onbeslist: [], best: [], slecht: [], laatste: [], elders: [], nietElders: [], research: [], video: [], buiten: null, nietGeprobeerd: [], poort: [], trend: null, nuBest: [], tweeling: null };
  const tx = briefingTekst({ ...b0, bibliotheek: p }); assert.match(tx, /LANGLOPERS BIJ ANDEREN/); assert.match(tx, /geen wet/); assert.match(tx, /nooit de tekst/); assert.match(tx, /Luminize/); assert.match(tx, /WHOP-PRODUCT/);
  assert.match(briefingTekst({ ...b0, bibliotheek: { leeg: true, vers: false, langlopers: [], tiktok: [], producten: [] } }), /GEEN BIBLIOTHEEKKENNIS/); assert.match(briefingTekst({ ...b0, bibliotheek: { ...p, vers: false, dagenOud: 5 } }), /BIBLIOTHEEKKENNIS VAN KADOLY IS OUD/);
  assert.doesNotMatch(briefingTekst({ ...b0, bibliotheek: null }), /BIBLIOTHEEK/);
});
await t('bewaak: niets binnen 36 uur, een taak erna, slot van 20 uur, niet als er al een open staat', async () => {
  const k2 = stub(), h = { taken: { leesTaken: async () => ({ taken: h.open ? [{ tekst: 'Advertentiebibliotheken voor Clickmind: x', status: 'wacht' }] : [] }), zetTaken: async (k, b) => { h.gezet.push(b); return { ok: true, taak: 'T' }; } }, gezet: [], open: false };
  assert.deepEqual((await AB.bewaak({ kvx: k2, nu: NU, hulp: h })).stil, []);
  const later = NU + 37 * 36e5; const r = await AB.bewaak({ kvx: k2, nu: later, hulp: h }); assert.deepEqual(r.stil, ['meta', 'tiktok']); assert.equal(h.gezet.length, 1);
  const tekst = h.gezet[0].taak.tekst; assert.match(tekst, /^Advertentiebibliotheken voor Clickmind/); assert.match(tekst, /ad_library_search_ad_library/); assert.match(tekst, /discovery_trending_list/); assert.match(tekst, /op=adbieb/); assert.equal(h.gezet[0].taak.project, 'clickmind'); assert.ok(!/key|token|secret/i.test(tekst.replace(/Access|tool/g, '')));
  assert.equal((await AB.bewaak({ kvx: k2, nu: later, hulp: h })).taak, 'vandaag al gezet'); assert.equal(h.gezet.length, 1);
  const k3 = stub(); await k3.set('ab:eerst', new Date(NU).toISOString()); h.open = true; assert.equal((await AB.bewaak({ kvx: k3, nu: later, hulp: h })).taak, 'staat al open');
  const k4 = stub(); await k4.set('ab:eerst', new Date(NU).toISOString()); await k4.set('ab:stand', { bronnen: { meta: { ok: new Date(later - 3 * 36e5).toISOString() }, tiktok: { ok: new Date(later - 3 * 36e5).toISOString() } } }); assert.deepEqual((await AB.bewaak({ kvx: k4, nu: later, hulp: h })).stil, []);
});
await t('zoek en tekst: overschrijving en leesbaar overzicht', async () => {
  const k2 = stub(); const z = await AB.zetZoek({ kadoly: { meta: [['bloemen', 'NL', 'nl']] }, nep: { meta: [] } }, { kvx: k2 }); assert.equal(z.ok, false); assert.equal(z.zoek.kadoly.meta[0][0], 'bloemen');
  const tx = await AB.tekst('kadoly', { kvx: k2, nu: NU }); assert.match(tx, /bloemen \[NL\]/); assert.match(tx, /nog nooit geslaagd/); assert.doesNotMatch(tx, /== tk ==/);
});
// volgorde en bescherming van de ronde (28 nov 2026): TikTok eerst, Meta om de beurt per project, drie fouten op rij stopt de bron, niets leeg afvinken
const js = (j, status = 200) => ({ ok: status < 400, status, json: async () => j, text: async () => JSON.stringify(j) });
const haalGoed = async url => { const u = new URL(url); if (u.hostname === 'zernio.com') { const q = u.searchParams.get('q'); return js({ platform: 'meta', data: Array.from({ length: 5 }, (_, i) => meta('g' + q + i, 'Pagina ' + q + i, 150 - i, 500, 'Tekst ' + q + i)), paging: {} }); }
  return js(u.pathname.endsWith('/trending_list/') ? fx.trending : u.pathname.endsWith('/video_list/') ? fx.videos : fx.bench); };
const S2 = { zernio: 'z', tiktok: 't', adv: '1' }, stil = { trend: { zetTrend: async b => ({ ok: true, erbij: b.items.length }) }, taken: { leesTaken: async () => ({ taken: [] }), zetTaken: async () => ({ ok: true }) } };
await t('volgorde: TikTok eerst, daarna Meta om de beurt per project, en elke dag begint een ander project', async () => {
  const r = await AB.ronde({ nu: NU, haal: haalGoed, kvx: stub(), sleutels: S2, hulp: stil }), n = Object.keys(AB.ZOEK).length;
  const eersteMeta = r.log.findIndex(x => / meta /.test(x)), laatsteTt = r.log.map(x => / tiktok /.test(x)).lastIndexOf(true); assert.ok(eersteMeta > laatsteTt, 'TikTok staat voor Meta');
  const eersten = r.log.filter(x => / meta /.test(x)).slice(0, n).map(x => x.split(' ')[0]); assert.equal(new Set(eersten).size, n, 'de eerste ' + n + ' Meta-zoekopdrachten zijn van ' + n + ' projecten');
  const r2 = await AB.ronde({ nu: NU + DAG, haal: haalGoed, kvx: stub(), sleutels: S2, hulp: stil }); assert.notEqual(r2.log.find(x => / meta /.test(x)).split(' ')[0], eersten[0], 'de volgende dag begint een ander project');
  const totaal = Object.keys(AB.ZOEK).reduce((a, p) => a + Math.min(AB.MAX_META_PER_DAG, AB.termenVan(p).meta.length), 0); assert.equal(r.fouten.length, 0);
  assert.equal(r.meta.ok, AB.META_MAX_VERZOEKEN - 1, 'hoogstens 30 zoekopdrachten per aanroep (uurquotum van Zernio)'); assert.ok(r.log.some(x => /hoogstens 30 per aanroep/.test(x)));
  const k3 = stub(), a1 = await AB.ronde({ nu: NU, haal: haalGoed, kvx: k3, sleutels: S2, hulp: stil }), a2 = await AB.ronde({ nu: NU, haal: haalGoed, kvx: k3, sleutels: S2, hulp: stil }); assert.equal(a1.meta.ok + a2.meta.ok, totaal, 'de tweede aanroep maakt de rest af'); assert.equal((await AB.stand({ kvx: k3, nu: NU })).open.length, 0);
});
await t('drie fouten op rij stopt die bron voor deze aanroep, de andere bron loopt door', async () => {
  const haalStuk = st => async url => new URL(url).hostname === 'zernio.com' ? js({ error: 'stuk' }, st) : haalGoed(url);
  const r = await AB.ronde({ nu: NU, haal: haalStuk(500), kvx: stub(), sleutels: S2, hulp: stil }); assert.equal(r.meta.fout, AB.FOUTEN_OP_RIJ); assert.equal(r.meta.ok, 0); assert.ok(r.tiktok.ok > 3); assert.ok(r.log.some(x => /meta: 3 fouten op rij/.test(x)));
  const q = await AB.ronde({ nu: NU, haal: haalStuk(429), kvx: stub(), sleutels: S2, hulp: stil }); assert.equal(q.meta.fout, 1, 'bij 429 meteen stoppen: het uurquotum is op'); assert.ok(q.log.some(x => /uurquotum van Zernio/.test(x))); assert.ok(q.tiktok.ok > 3);
});
await t('video\'s worden niet leeg afgevinkt als de lijsten mislukten', async () => {
  const k = stub(), haalTt = async url => { const u = new URL(url); return u.pathname.endsWith('/trending_list/') ? js({ code: 40001, message: 'geen toegang' }) : haalGoed(url); };
  const r = await AB.ronde({ nu: NU, haal: haalTt, kvx: k, sleutels: S2, alleen: 'nexy', hulp: stil }); assert.ok(r.fouten.some(f => /40001/.test(f)) && r.fouten.some(f => /nog geen hashtags/.test(f)));
  assert.equal((await k.get('ab:dag:' + new Date(NU).toISOString().slice(0, 10) + ':nexy')).videos, null); assert.ok(r.meta.ok >= 3, 'Meta loopt door');
});
await t('trendkennis over dagen: langloper elke dag opnieuw, hashtag pas na 3 dagen', async () => {
  const k = stub(), gez = [], h = { ...stil, trend: { zetTrend: async b => { gez.push(b.medium); return { ok: true, erbij: b.items.length }; } } };
  await AB.ronde({ nu: NU, haal: haalGoed, kvx: k, sleutels: S2, alleen: 'kadoly', hulp: h }); assert.deepEqual(gez.sort(), ['meta', 'tiktok']);
  gez.length = 0; await AB.meldTrend({ kvx: k, nu: NU + DAG, hulp: h }); assert.deepEqual(gez, ['meta']);
  gez.length = 0; await AB.meldTrend({ kvx: k, nu: NU + 3 * DAG - 1000, hulp: h }); assert.deepEqual(gez.sort(), ['meta', 'tiktok']);
});
await t('langlopers: hoogstens 2 per landingsdomein, met het aantal pagina\'s dat ernaar stuurt; producten zonder langlopers staan niet in de briefing', async () => {
  const zelfde = { destination_urls: ['https://www.winkel.example/mini?x=1'] }, r = ['A', 'B', 'C', 'D', 'E'].map((p, i) => AB.normMeta(meta('d' + i, 'Pagina ' + p, 100 + i, 1000, 'tekst ' + i, zelfde), NU)); r.push(AB.normMeta(meta('los', 'Ander', 60, 500, 'los'), NU));
  const k = AB.kiesLanglopers(r, { nu: NU }); assert.equal(k.filter(x => /winkel\.example/.test(x.landing)).length, 2); assert.equal(k[0].paginasDomein, 5); assert.ok(k.some(x => x.pagina === 'Ander' && !x.paginasDomein));
  assert.equal(AB.kiesLanglopers(r, { nu: NU, perDomein: 25 }).length, 6);
  const k2 = stub(); await AB.zet({ project: 'kadoly', bron: 'meta', term: 'Tavellio lamp', landen: 'NL,BE', rijen: [meta('w1', 'Luminize', 443, 20000, 'Tavellio lamp zonder snoer')] }, { kvx: k2, nu: NU, hulp: stil });
  const p = await k2.get('ab:p:kadoly'); p.producten['Wollen deken MoST'] = { dag: '2026-11-28', aantal: 0, langste: 0, bereik: 0, paginas: 0, top: null }; await k2.set('ab:p:kadoly', p);
  const b = await AB.voorBriefing({ project: 'kadoly', medium: 'propeller', nu: NU, kvx: k2 }); assert.equal(b.producten.length, 1); assert.match(await AB.tekst('kadoly', { kvx: k2, nu: NU }), /Wollen deken MoST: geen langlopers gevonden/);
});
await t('raakt: de zoekwoorden moeten in de advertentie staan; bereik telt zwaar; bereik uit het gebied als er geen EU-bereik is', () => {
  assert.equal(AB.raakt('family organizer app', 'A family that travels together, stays together'), false); assert.equal(AB.raakt('family organizer app', 'The family organizer everyone needs'), true);
  assert.equal(AB.raakt('cadeau', 'Het mooiste kerstcadeau'), true); assert.equal(AB.raakt('Snijplank eiken', 'Aanrechtplank van eikenhout, ook als snijplank'), true); assert.equal(AB.raakt('music therapy', 'Body composition scale, limited offer'), false);
  assert.equal(AB.raakt('driving theory test app', 'Pass your theory test first time'), true); assert.equal(AB.raakt('driving theory test app', 'Test your broadband speed'), false); assert.equal(AB.raakt('', 'x'), true);
  const r = [AB.normMeta(meta('n1', 'Geen bereik', 390, 0, 'cadeau zonder bereik'), NU, 'cadeau'), AB.normMeta(meta('n2', 'Klein', 108, 316, 'cadeau klein'), NU, 'cadeau'), AB.normMeta(meta('n3', 'Groot', 100, 28000, 'cadeau groot'), NU, 'cadeau')];
  assert.deepEqual(AB.kiesLanglopers(r, { nu: NU }).map(x => x.id), ['n3', 'n2', 'n1']); assert.ok(r.every(x => x.raak === true));
  assert.equal(AB.normMeta({ ...meta('n4', 'VK', 100, 0, 'cadeau'), total_reach_by_location: [{ key: 'GB', value: 4000 }, { key: 'EU', value: 500 }] }, NU, 'cadeau').bereik, 4500); assert.equal(AB.normMeta(meta('n5', 'x', 5, 1, 'iets anders'), NU, 'cadeau').raak, false);
});
await t('afronden: oude rijen zonder toets krijgen hem alsnog, en een dag met alleen fouten laat de oude stand en datum staan', async () => {
  const k = stub(), dag = new Date(NU).toISOString().slice(0, 10), oudRij = (id, pagina, tekst) => { const x = AB.normMeta(meta(id, pagina, 200, 9000, tekst), NU, 'Curacao holiday'); delete x.raak; return x; };
  await k.set('ab:dag:' + dag + ':curacao', { meta: { 'curacao-holiday|GBIE': { q: 'Curacao holiday', landen: 'GB,IE', rijen: [oudRij('o1', 'Tui', 'Curacao holiday deals'), oudRij('o2', 'Busverhuur', 'A family that travels together')] } }, tt: {}, videos: null, bench: null, fout: {} });
  const r = await AB.afronden('curacao', dag, { kvx: k, nu: NU }); assert.deepEqual(r.meta.map(x => x.id), ['o1']);
  const morgen = NU + DAG, dag2 = new Date(morgen).toISOString().slice(0, 10); await k.set('ab:dag:' + dag2 + ':curacao', { meta: {}, tt: {}, videos: null, bench: null, fout: { 'meta|x': 'Zernio HTTP 500' } });
  const r2 = await AB.afronden('curacao', dag2, { kvx: k, nu: morgen }); assert.equal(r2.dag, dag, 'de datum van de laatste geslaagde dag blijft staan'); assert.equal((await k.get('ab:p:curacao')).t, r.t);
});
console.log(ok + ' tests geslaagd'); if (process.exitCode) console.error('MISLUKT');
