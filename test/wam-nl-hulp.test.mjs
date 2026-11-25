import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { incassoBereken, incassoPagina, INCASSO_JS, INCASSO_VRAGEN } from '../lib/wam-incasso.js';
import { PRAKTISCHE_HULP } from '../lib/wam-hulp.js';
import { pagina, PADEN, sitemapLastmod } from '../lib/wam-dossier.js';
import { wamLlms, WAM_INDEXNOW_URLS } from '../lib/wam-vindbaarheid.js';

const schema = html => JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
test('staffel volgt officiële voorbeelden, grenzen, minimum en plafond', () => {
  for (const [bedrag, kosten] of [[0.01,40],[100,40],[250,40],[500,75],[2500,375],[3500,475],[5000,625],[10000,875],[200000,2775],[780000,5675],[1000000,6775],[2000000,6775]]) {
    assert.equal(incassoBereken(bedrag).kosten, kosten, String(bedrag));
  }
  assert.equal(incassoBereken(266.66).kosten, 40);
  assert.equal(incassoBereken(266.70).kosten, 40.01);
  assert.equal(incassoBereken('2.500,01').kosten, 375);
  assert.equal(incassoBereken('5000,10').kosten, 625.01);
  assert.equal(incassoBereken('€ 3.500,00').kosten, 475);
  for (const invalide of ['', null, undefined, 0, -1, '2e3', '1,000.00', '12,345', 'x', '<svg>', Infinity, '1000000001']) assert.equal(incassoBereken(invalide), null);
});
test('browser gebruikt exact dezelfde zelfstandige rekenkern als de server', () => {
  const browser = vm.runInNewContext('(' + incassoBereken.toString() + ')');
  for (const n of ['100','3.500,00','5000.10','200000','780000','1000000','abc']) assert.equal(JSON.stringify(browser(n)), JSON.stringify(incassoBereken(n)));
  new vm.Script(INCASSO_JS);
});
test('situatiewissel verwijdert oude serverinvoer; campagneparameter blijft behouden', () => {
  const nodes = new Map(), node = id => {
    if (!nodes.has(id)) nodes.set(id, { hidden: false, textContent: '', children: [], value: '', append(...v) { this.children.push(...v); }, appendChild(v) { this.children.push(v); }, replaceChildren() { this.children = []; } });
    return nodes.get(id);
  };
  const situaties = ['een','termijnen','zakelijk'].map(s => ({dataset:{situatie:s}}));
  let url = new URL('https://wearemany.now/incassokosten-berekenen?bedrag=3500&situatie=een&cid=behoud');
  const loc = {get pathname(){return url.pathname;}, get search(){return url.search;}, get hash(){return url.hash;}};
  vm.runInNewContext(INCASSO_JS, {
    URLSearchParams, location:loc, window:{}, history:{replaceState(a,b,p){url=new URL(p,url);}},
    document:{getElementById:node, createElement:tag=>node('nieuw-'+tag+'-'+Math.random()), querySelectorAll:s=>s==='[data-situatie]'?situaties:[]}
  });
  assert.equal(url.search, '?cid=behoud');
  assert.equal(url.hash, '#situatie=een&bedrag=3500');
  assert.equal(node('calc-uitkomst').children.length, 1);
  node('calc-terug').onclick(); situaties[1].onclick();
  assert.equal(node('calc-uitkomst').children.length, 0);
  assert.equal(url.search, '?cid=behoud'); assert.equal(url.hash, '');
  assert.ok(node('calc-melding').textContent.includes('termijnbetalingen'));
});
test('serverformulier werkt zonder JavaScript, bewaakt situatie en ontsmet invoer', () => {
  const h = pagina('incassokosten-berekenen', true, false, [], {bedrag:'3500',situatie:'een'});
  assert.ok(/Maximaal €\s475,00 volgens de staffel/.test(h));
  assert.ok(h.includes('method="get" action="/incassokosten-berekenen"'));
  assert.ok(h.includes('<details id="calc-zelf" class="sources" open>'));
  for (const situatie of ['', 'termijnen', 'zakelijk']) assert.ok(!incassoPagina({bedrag:'3500',situatie}).body.includes('Maximaal €'));
  const x = incassoPagina({bedrag:'"><img onerror=alert(1)>',situatie:'een'}).body;
  assert.ok(!x.includes('<img')); assert.ok(x.includes('&lt;img'));
  assert.ok(h.includes('exclusief eventuele btw') && h.includes('zes maanden') && h.includes('1 oktober 2024'));
});
test('praktische antwoorden staan voor reviews, brondata en FAQ stemmen overeen', () => {
  for (const id of ['postcodeloterij','ns','flanderijn','videoland','postnl']) {
    const g = PRAKTISCHE_HULP[id], h = pagina('bedrijven/' + id, true), graph = schema(h);
    assert.ok(h.includes(g.antwoord));
    assert.ok(h.indexOf('class="praktische-hulp"') < h.indexOf('<section id="bronnenbeeld">'));
    assert.ok(h.includes('Reactie van het bedrijf') && h.includes('2026-11-24'));
    assert.equal(graph.find(g => g['@type'] === 'Article').headline, g.kop);
    for (const q of graph.find(g => g['@type'] === 'FAQPage').mainEntity) assert.ok(h.includes(q.name) && h.includes(q.acceptedAnswer.text));
    assert.ok(g.seoTitel.length <= 60);
    assert.ok(!graph.some(g => g['@type'] === 'AggregateRating'));
  }
  const postnl = pagina('bedrijven/postnl', true), hulp = PRAKTISCHE_HULP.postnl;
  assert.ok(postnl.includes('alleen de afzender opdracht kan geven'));
  assert.ok(postnl.includes('Je kunt als ontvanger wel een bezorgklacht'));
  assert.ok(postnl.includes('<time datetime="2026-11-25">25 november 2026</time>'));
  assert.ok(postnl.includes('Praktische hulp · <time datetime="2026-11-25">25 november 2026</time>'));
  assert.ok(postnl.indexOf('class="praktische-hulp"') < postnl.indexOf('<section id="bronnenbeeld">'));
  assert.ok(wamLlms().includes('/bedrijven/postnl#pakket-niet-ontvangen'));
  assert.ok(WAM_INDEXNOW_URLS.includes('https://wearemany.now/bedrijven/postnl'));
  assert.equal(sitemapLastmod('/bedrijven/postnl'), '2026-11-25');
  assert.equal(sitemapLastmod('/bedrijven/kpn'), '2026-11-24');
  const h = pagina('incassokosten-berekenen', true), graph = schema(h);
  assert.equal(graph.find(g => g['@type'] === 'FAQPage').mainEntity.length, INCASSO_VRAGEN.length);
  for (const q of INCASSO_VRAGEN) assert.ok(h.includes(q.vraag) && h.includes(q.antwoord));
  assert.equal(graph.find(g => g['@type'] === 'WebApplication').isAccessibleForFree, true);
  assert.ok(h.includes('rel="canonical" href="https://wearemany.now/incassokosten-berekenen"'));
  assert.ok(PADEN.includes('incassokosten-berekenen'));
  assert.ok(WAM_INDEXNOW_URLS.includes('https://wearemany.now/incassokosten-berekenen'));
  assert.ok(wamLlms().includes('/bedrijven/ns#aanvragen') && wamLlms().includes('/incassokosten-berekenen'));
});

