// Procedure coverage is a source inventory, not a claim to cover every provider in a market.
import { reviewRanking } from './tsc-reviewrank.js';
import { INDEXABLE_PROCEDURES } from './tsc-procedure-context.js';
import DIRECTORY from '../data/tsc-directory.json' with { type: 'json' };
export const PROCEDURES = DIRECTORY.procedures;
export const PROCEDURE_BY_ID = Object.fromEntries(PROCEDURES.map(p => [p.id, p]));
export const DIRECTORY_DATE = DIRECTORY.checked_at;
export const procedureLabel = (id, language = 'en') => (PROCEDURE_BY_ID[id] || {})[language] || (PROCEDURE_BY_ID[id] || {}).en || id;
export const procedureSlug = (id, language = 'en') => {
  const p = PROCEDURE_BY_ID[id]; if (!p) return '';
  return (language === 'nl' ? 'nl/ingrepen/' : language === 'de' ? 'de/behandlungen/' : 'procedures/') + p.slugs[language || 'en'];
};
export const catalogSlug = language => language === 'nl' ? 'nl/ingrepen' : language === 'de' ? 'de/behandlungen' : 'procedures';

export function directoryProviders(baseLists) {
  const map = new Map();
  for (const [id, list] of Object.entries(baseLists || {})) for (const record of list.klinieken || []) {
    const individual = /^dr\.?\s/i.test(record.naam) && (record.artsen || []).length === 1;
    const key = (individual ? 'doctor:' + record.naam : 'clinic:' + String(record.site || record.naam).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')).toLowerCase();
    const previous = map.get(key);
    const offer = { source_url: record.site || record.artsen?.[0]?.bron || '', source_type: 'existing_researched_list', checked_at: list.gecontroleerd };
    if (previous) { previous.offers[list.ingreep] = offer; continue; }
    map.set(key, { ...record, kind: individual ? 'doctor' : 'clinic', scope: individual ? 'doctor' : 'organization', land: list.land, checked_at: list.gecontroleerd, offers: { [list.ingreep]: offer }, list_id: id });
  }
  for (const record of DIRECTORY.providers) map.set('directory:' + record.id, record);
  return [...map.values()];
}

export function extendLists(baseLists) {
  const providers = directoryProviders(baseLists), out = Object.fromEntries(Object.entries(baseLists).map(([id,l]) => [id,{...l,klinieken:l.klinieken.map(k=>providers.find(p=>p.list_id===id&&p.id===k.id)||k)}]));
  for (const p of PROCEDURES) {
    const records = providers.filter(k => k.offers[p.id]);
    if (!records.length) continue;
    const id = 'procedure-' + p.id;
    out[id] = { id, catalog: true, ingreep: p.id, naar: 'any', land: '', gecontroleerd: DIRECTORY_DATE, gepubliceerd: DIRECTORY_DATE,
      slugs: Object.fromEntries(['en', 'nl', 'de'].map(language => [language, procedureSlug(p.id, language)])),
      comparison_title: Object.fromEntries(['en', 'nl', 'de'].map(language => [language, p[language]])),
      tekst: Object.fromEntries(['en', 'nl', 'de'].map(language => [language, { h1: p[language], title: p[language], desc: p[language], kort: '', faq: [] }])),
      klinieken: records, coverage: { providers: records.length, source: 'data/tsc-directory.json', market_complete: false },
      // Single-provider inventory pages remain usable but do not enter the indexable sitemap.
      noindex: !INDEXABLE_PROCEDURES.has(p.id) || reviewRanking({klinieken:records}).ranked.length + reviewRanking({klinieken:records},'doctor').ranked.length < 3
    };
  }
  return out;
}

export function publishedDoctors(records) {
  const people = new Map();
  for (const record of records || []) for (const doctor of record.artsen || []) {
    if (!doctor.naam || !doctor.bron) continue;
    const id = doctor.naam.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\bdrs?\.?\s*/g, '').replace(/[^a-z0-9]+/g, '-');
    if (!people.has(id)) people.set(id, { ...doctor, id, affiliations: [] });
    const person = people.get(id);
    if (!person.affiliations.some(a => a.id === record.id)) person.affiliations.push({ id: record.id, name: record.naam, country: record.land });
  }
  return [...people.values()].sort((a, b) => a.naam.localeCompare(b.naam));
}
