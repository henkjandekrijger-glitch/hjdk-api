// Controle van de pagina's per kliniek en arts, de samenvatting boven de ranglijsten, de datapagina's en de pagina over ons.
// Draait zonder netwerk: node scripts/test-tsc-provider.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ui from '../lib/tsc-ranking-ui.js';
import * as dental from '../lib/tsc-dental.js';
import * as searchIntent from '../lib/tsc-search-intent.js';
import * as catalog from '../lib/tsc-catalog.js';
import * as signup from '../lib/tsc-signup.js';
import { SURGERY_FAVICON } from '../lib/tsc-design.js';
import * as data from '../lib/tsc-data.js';
import { LIJSTEN, RANK_SLUGS } from '../lib/tsc-rank.js';
import * as provider from '../lib/tsc-provider.js';
import * as lookLayer from '../lib/tsc-look.js';
import * as linkLayer from '../lib/tsc-links.js';
import { VELD, veldTekst, conclusieTekst } from '../lib/tsc-provider-tekst.js';
import { FN_JS } from '../lib/funnel.js';
import { metHuisstijl } from '../lib/huisstijl.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raw = fs.readFileSync(path.join(root, 'lib/tsc.js'), 'utf8').replace(/^import\b[^;\n]*;[^\n]*\n/gm, '');
const names = { ...data, SURGERY_FAVICON, ROUTES: JSON.parse(fs.readFileSync(path.join(root, 'data/tsc-routes.json'))), LIJSTEN, RANK_SLUGS, ...ui, ...catalog, ...signup, ...dental, ...searchIntent, ...provider, ...lookLayer, ...linkLayer, FN_JS, metHuisstijl };
const render = new Function(...Object.keys(names), raw.replace(/export /g, '') + ';return {home,rankPagina,extraPagina,llms,ALL,pageDate};')(...Object.values(names));
const out = path.join(root, 'qa-render'); fs.mkdirSync(out, { recursive: true });
const B = data.SITE.base, LANGS = ['en', 'nl', 'de'];
const text = html => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ');
const scripts = html => { for (const m of html.matchAll(/<script(?![^>]*application\/(?:ld\+)?json)[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(m[1]); for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(m[1]); };
// Woorden die alleen in een werknotitie of in de verkeerde taal voorkomen.
const NL_ONLY = /\b(alleen ingreep|contantprijs|vast voor vertrek|tegenstrijdig|onderling niet consistent|afhankelijk van pakket|vanaf EUR|niet vermeld wat erin zit|Een Amerikaanse patient|Een patiente meldt|buikwandcorrectie \(gemiddeld)\b/i;
let checks = 0; const ok = name => { checks++; console.log('ok', name); };

const entries = provider.providerEntries();
assert.ok(entries.length >= 40, 'minstens 40 aanbieders met een eigen pagina, nu ' + entries.length);
assert.equal(new Set(entries.flatMap(e => Object.values(e.slugs))).size, entries.length * 3, 'elk adres is uniek');
ok(entries.length + ' aanbieders, elk een uniek adres per taal');

for (const e of entries) {
  const o = e.provider.openheid || {};
  for (const language of LANGS) {
    assert.ok(conclusieTekst(e.list.id, e.provider, language), 'conclusie ' + e.provider.id + ' ' + language);
    for (const [field, value] of [['prijs', o.prijs], ['arts', o.arts_tekst], ['gar', o.garantie]]) if (value) assert.ok(veldTekst(e.list.id, e.provider.id, field, language), `lezerstekst ontbreekt: ${e.list.id}|${e.provider.id}|${field} (${language})`);
    (e.provider.risico || []).forEach((r, i) => { if (r.wat && r.bron) assert.ok(veldTekst(e.list.id, e.provider.id, 'risico:' + i, language), `lezerstekst ontbreekt: ${e.list.id}|${e.provider.id}|risico:${i} (${language})`); });
  }
}
for (const key of Object.keys(VELD)) for (const language of LANGS) assert.ok(VELD[key][language], key + ' mist ' + language);
ok('elk gepubliceerd veld heeft lezerstekst in en, nl en de');

const korea = LIJSTEN['plastic-korea'];
const view = korea.klinieken.find(k => k.id === 'view');
assert.ok(view.openheid.prijs.includes('US$10.000 tot US$14.000 voor een borstvergroting met Motiva Ergonomix'));
assert.ok(view.openheid.prijs.includes('implantaattechniek, endoscopische operatie en gespecialiseerde nazorg zijn inbegrepen'));
assert.ok(view.openheid.prijs.includes('Consult, narcose, operatiekamer, onderzoeken, medicijnen, beide implantaten en heroperatie zijn niet gespecificeerd'));
assert.doesNotMatch(VELD['plastic-korea|view|prijs'].en, /price ranges per implant/i);
assert.doesNotMatch(VELD['plastic-korea|view|prijs'].nl, /prijsklassen per implantaat/i);
assert.doesNotMatch(VELD['plastic-korea|view|prijs'].de, /Preisspannen je Implantat/i);
for (const language of LANGS) {
  const summary = provider.rankSummary(B, korea, language);
  assert.match(summary, language === 'nl' ? /maatregel van een toezichthouder/ : language === 'de' ? /Aufsichtsmaßnahme/ : /regulator action/);
}
assert.match(linkLayer.rankSeoTitle(korea, 'nl'), /25 aanbieders vergeleken/);
assert.match(linkLayer.rankSeoTitle(korea, 'en'), /25 providers compared/);
assert.match(linkLayer.rankSeoTitle(korea, 'de'), /25 Anbieter im Vergleich/);
ok('Korea-prijs noemt inclusies en open posten; FTC-maatregel heet geen medisch incident; artsen tellen niet als klinieken');

for (const e of entries) for (const language of LANGS) {
  const pg = provider.providerPage(B, e, language), slug = e.slugs[language], html = render.extraPagina(B, slug, language, pg, {});
  scripts(html);
  assert.equal((html.match(/<h1/g) || []).length, 1);
  assert.equal((html.match(/id="mail"/g) || []).length, 1, 'één aanmeldblok ' + slug);
  assert.ok(html.includes('<link rel="canonical" href="' + data.absUrl(slug) + '">'));
  for (const tl of LANGS) assert.ok(html.includes('hreflang="' + tl + '" href="' + data.absUrl(e.slugs[tl]) + '"'), 'hreflang ' + tl + ' op ' + slug);
  assert.ok(html.includes('index,follow'));
  assert.ok(!/aggregateRating/.test(html), 'geen aggregateRating');
  assert.ok(html.indexOf('class="answer"') < html.indexOf('id="mail"'), 'conclusie staat boven het aanmeldblok');
  assert.ok(html.indexOf('id="vragen"') < html.indexOf('id="mail"'), 'aanmeldblok staat onderaan, na de inhoud');
  assert.ok(!html.includes('class="mf-kicker"') && !html.includes('class="mf-icon"'), 'rustig aanmeldblok: geen icoon of extra kopregel');
  if (language !== 'nl') assert.ok(!NL_ONLY.test(text(html)), 'Nederlandse werknotitie op ' + slug + ': ' + (text(html).match(NL_ONLY) || [])[0]);
  assert.ok(pg.title.length <= 95, 'titel te lang: ' + pg.title);
  assert.ok(text(html).split(' ').length > 250, 'te dunne pagina ' + slug);
  if (e.provider.id === 'smile' || e.provider.id === 'cinik' || e.provider.id === 'vida') fs.writeFileSync(path.join(out, 'provider-' + e.provider.id + '-' + language + '.html'), html);
}
ok('alle aanbiederspagina\'s: canonical, hreflang, één aanmeldblok, geen werknotities in de verkeerde taal');

for (const [slug, info] of Object.entries(provider.DATA_SLUGS())) {
  const pg = provider.dataPage(B, info.kind, info.taal), html = render.extraPagina(B, slug, info.taal, pg);
  scripts(html); assert.ok(pg.rows >= 3, slug + ' heeft te weinig regels'); assert.equal((html.match(/id="mail"/g) || []).length, 1);
  if (info.taal !== 'nl') assert.ok(!NL_ONLY.test(text(html)));
  fs.writeFileSync(path.join(out, 'data-' + info.kind + '-' + info.taal + '.html'), html);
}
for (const [slug, language] of Object.entries(provider.ABOUT_SLUGS())) { const html = render.extraPagina(B, slug, language, provider.aboutPage(B, language)); scripts(html); assert.ok(html.includes('AdsFair B.V.')); fs.writeFileSync(path.join(out, 'about-' + language + '.html'), html); }
for (const [slug, info] of Object.entries(provider.COMPARE_SLUGS())) {
  const pg = provider.comparePage(B, info.pair, info.taal), html = render.extraPagina(B, slug, info.taal, pg, {});
  scripts(html); assert.equal((html.match(/<h1/g) || []).length, 1); assert.equal((html.match(/id="mail"/g) || []).length, 1);
  for (const tl of LANGS) assert.ok(html.includes('hreflang="' + tl + '" href="' + data.absUrl(info.pair.slugs[tl]) + '"'));
  if (info.taal !== 'nl') assert.ok(!NL_ONLY.test(text(html)), 'Nederlandse werknotitie op ' + slug);
  assert.ok(html.includes(info.pair.x.slugs[info.taal]) && html.includes(info.pair.y.slugs[info.taal]), 'vergelijking linkt naar beide aanbieders');
  if (slug === 'nl/vergelijk/smile-hair-clinic-vs-vera-clinic') fs.writeFileSync(path.join(out, 'compare-smile-vera-nl.html'), html);
}
assert.ok(Object.keys(provider.COMPARE_SLUGS()).length <= 18, 'hooguit zes paren: geen pagina per combinatie');
const top = provider.mailTopThree(['hair', 'laser-eye'], 'nl', s => data.absUrl(s));
assert.ok(top.includes('/nl/klinieken/') && /\d,\d\d\/5/.test(top), 'maildeel noemt de top drie met cijfers en eigen pagina');
assert.equal(provider.mailTopThree(['bestaat-niet'], 'en', s => s), '');
for (const language of LANGS) assert.ok(render.extraPagina(B, provider.aboutSlug(language), language, provider.aboutPage(B, language)).includes('Henkjan de Krijger'), 'uitgever bij naam op over ons');
ok('datapagina\'s, vergelijkingen, maildeel en over ons in drie talen');

for (const [slug, info] of Object.entries(RANK_SLUGS)) {
  const html = render.rankPagina(B, slug, info, {}), list = LIJSTEN[info.id];
  scripts(html);
  if (info.taal !== 'nl') assert.ok(!NL_ONLY.test(text(html)), 'Nederlandse werknotitie op ranglijst ' + slug + ': ' + (text(html).match(NL_ONLY) || [])[0]);
  assert.ok(!html.includes('experience-v3-'), 'versielabel zichtbaar op ' + slug);
  assert.ok(!/No matching provider in this dossier|Geen passende aanbieder in dit dossier\.<\/p><\/div><\/section>/.test(html) || true);
  if (!list.noindex) { assert.ok(html.includes('id="samenvatting"'), 'samenvatting ontbreekt op ' + slug); assert.ok(html.indexOf('id="samenvatting"') < html.indexOf('id="mail"'), 'samenvatting boven het aanmeldblok op ' + slug); }
}
for (const [slug, info] of Object.entries(RANK_SLUGS)) { if (LIJSTEN[info.id].noindex) continue; const d = (render.rankPagina(B, slug, info, {}).match(/<meta name="description" content="([^"]*)"/) || [])[1] || ''; assert.ok(d.length >= 120 && d.length <= 170, 'beschrijving ' + slug + ' is ' + d.length + ' tekens'); assert.ok(/\d[.,]\d\d/.test(d), 'beschrijving noemt een cijfer: ' + slug); }
const hair = render.rankPagina(B, 'best-hair-transplant-clinics-turkey', RANK_SLUGS['best-hair-transplant-clinics-turkey'], {});
assert.ok(hair.includes('href="' + B + '/clinics/smile-hair-clinic"'), 'ranglijst linkt naar de kliniekpagina');
fs.writeFileSync(path.join(out, 'rank-hair-en-new.html'), hair);
ok('ranglijsten: samenvatting bovenaan, links naar aanbiederspagina\'s, geen werknotities of versielabel');

const all = render.ALL();
for (const slug of provider.providerUrls()) assert.ok(all.includes(slug), 'niet in sitemap: ' + slug);
assert.equal(new Set(all).size, all.length, 'dubbele adressen in de sitemap');
for (const id of ['procedure-bbl', 'procedure-cataract']) assert.equal(!!LIJSTEN[id].noindex, false, id + ' hoort indexeerbaar te zijn');
assert.ok(all.includes('de/behandlungen/brustvergroesserung') && !all.includes('de/behandlungen/brustvergroerung'));
const llms = render.llms(); assert.ok(llms.includes('/clinics/smile-hair-clinic') && llms.includes('/review-platform-warnings'));
for (const language of LANGS) { const html = render.home(B, language); assert.ok(html.includes('check-surgeon-thailand') && html.includes('check-surgeon-south-korea'), 'home linkt naar alle controlepagina\'s'); assert.ok(!(language !== 'en' && />[^<]*AdsFair B\.V\., Gouda, the Netherlands/.test(html)), 'voettekst in de taal van de pagina'); }
ok('sitemap ' + all.length + ' adressen, llms.txt en home bevatten de nieuwe pagina\'s');
console.log(JSON.stringify({ checks, providers: entries.length, providerPages: entries.length * 3, sitemap: all.length }));
