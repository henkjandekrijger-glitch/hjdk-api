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
import { VELD, veldTekst, conclusieTekst } from '../lib/tsc-provider-tekst.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raw = fs.readFileSync(path.join(root, 'lib/tsc.js'), 'utf8').replace(/^import .*;\n/gm, '');
const names = { ...data, SURGERY_FAVICON, ROUTES: JSON.parse(fs.readFileSync(path.join(root, 'data/tsc-routes.json'))), LIJSTEN, RANK_SLUGS, ...ui, ...catalog, ...signup, ...dental, ...searchIntent, ...provider };
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

for (const e of entries) for (const language of LANGS) {
  const pg = provider.providerPage(B, e, language), slug = e.slugs[language], html = render.extraPagina(B, slug, language, pg, {});
  scripts(html);
  assert.equal((html.match(/<h1/g) || []).length, 1);
  assert.equal((html.match(/id="mail"/g) || []).length, 1, 'één aanmeldblok ' + slug);
  assert.ok(html.includes('<link rel="canonical" href="' + B + '/' + slug + '">'));
  for (const tl of LANGS) assert.ok(html.includes('hreflang="' + tl + '" href="' + B + '/' + e.slugs[tl] + '"'), 'hreflang ' + tl + ' op ' + slug);
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
ok('datapagina\'s en over ons in drie talen');

for (const [slug, info] of Object.entries(RANK_SLUGS)) {
  const html = render.rankPagina(B, slug, info, {}), list = LIJSTEN[info.id];
  scripts(html);
  if (info.taal !== 'nl') assert.ok(!NL_ONLY.test(text(html)), 'Nederlandse werknotitie op ranglijst ' + slug + ': ' + (text(html).match(NL_ONLY) || [])[0]);
  assert.ok(!html.includes('experience-v3-'), 'versielabel zichtbaar op ' + slug);
  assert.ok(!/No matching provider in this dossier|Geen passende aanbieder in dit dossier\.<\/p><\/div><\/section>/.test(html) || true);
  if (!list.noindex) { assert.ok(html.includes('id="samenvatting"'), 'samenvatting ontbreekt op ' + slug); assert.ok(html.indexOf('id="samenvatting"') < html.indexOf('id="mail"'), 'samenvatting boven het aanmeldblok op ' + slug); }
}
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
