// Public patient-experience index. Editorial aggregation, not a validated clinical quality measure.
// A platform count is never labelled a count of unique patients. No payment fields enter the calculation.
export const REVIEW_POLICY = { version: 'experience-v3-2026-11-15', minimum: 5, perSourceCap: 100, shrinkage: 20, fallback: 4.0 };
const number = v => v == null || v === '' ? null : Number(String(v).replace(',', '.'));
const median = a => { const v = a.slice().sort((x, y) => x - y); return v.length ? (v[Math.floor((v.length - 1) / 2)] + v[Math.ceil((v.length - 1) / 2)]) / 2 : REVIEW_POLICY.fallback; };
const keyOf = r => { try { const u = new URL(r.bron); return u.hostname.replace(/^(www|nl|de|uk|at)\./, '') + ':' + u.pathname.replace(/\/$/, ''); } catch { return ''; } };
export function sourceScope(review) { return review.scope || (/\/dr\//.test(review.bron || '') ? 'doctor' : 'organization'); }

export function reviewSources(provider) {
  const scope = provider.scope || (provider.kind === 'doctor' ? 'doctor' : 'organization'), seen = new Map(), extra = [];
  for (const raw of provider.reviews || []) {
    const score = number(raw.score), max = number(raw.max) || 5, n = number(raw.aantal), key = keyOf(raw);
    const restricted = /suspend|guideline.{0,30}(breach|violat)|rating.{0,20}unavailable|account.{0,20}geschorst/i.test(raw.waarschuwing || '') || raw.platform_status === 'restricted';
    const excluded = restricted || !key || score == null || !Number.isFinite(score) || score < 0 || score > max || !Number.isFinite(n) || n < 1 || raw.rating_available === false || raw.excluded === true;
    const match = sourceScope(raw) === scope;
    if (excluded || !match) { extra.push({ ...raw, included: false, reason: restricted ? 'platform_restriction' : excluded ? 'unavailable_or_invalid' : 'different_entity_scope' }); continue; }
    const previous = seen.get(key);
    if (!previous || String(raw.datum || '') > String(previous.datum || '')) seen.set(key, { ...raw, normalized: score / max * 5, max, aantal: n, source_key: key, included: true });
  }
  // Several profiles on one platform do not create extra platform votes. Keep the latest/largest matching entity profile.
  const platforms = new Map();
  for (const review of seen.values()) {
    const key = String(review.platform || new URL(review.bron).hostname).toLowerCase();
    const previous = platforms.get(key);
    if (!previous || String(review.datum || '') > String(previous.datum || '') || review.datum === previous.datum && review.aantal > previous.aantal) {
      if (previous) extra.push({ ...previous, included: false, reason: 'same_platform' });
      platforms.set(key, review);
    } else extra.push({ ...review, included: false, reason: 'same_platform' });
  }
  return { included: [...platforms.values()], excluded: extra };
}

export function experienceIndex(provider, benchmark = REVIEW_POLICY.fallback) {
  const sources = reviewSources(provider), valid = sources.included;
  const held = provider.restriction?.status === 'active' || provider.restriction?.status === 'under_review' || (provider.risico || []).some(r => r.ernst === 'zwaar');
  const eligible = !held && valid.some(r => r.aantal >= REVIEW_POLICY.minimum);
  const adjusted = valid.map(r => { const weight = Math.min(r.aantal, REVIEW_POLICY.perSourceCap); return (weight * r.normalized + REVIEW_POLICY.shrinkage * benchmark) / (weight + REVIEW_POLICY.shrinkage); });
  const score = adjusted.length ? adjusted.reduce((a, b) => a + b, 0) / adjusted.length : null;
  const range = valid.length > 1 ? Math.max(...valid.map(r => r.normalized)) - Math.min(...valid.map(r => r.normalized)) : null;
  return { version: REVIEW_POLICY.version, score, benchmark, eligible, held, platforms: valid.length, source_counts: valid.map(r => ({ platform: r.platform, count: r.aantal })), range, sources, clinical_quality: false, unique_patients: null };
}

export function physicianRecords(records) {
  const out = [], seen = new Set();
  for (const provider of records || []) {
    if (provider.kind === 'doctor') { out.push(provider); continue; }
    for (const doctor of provider.artsen || []) {
      // A direct doctor profile must match the published doctor's source. Never inherit clinic ratings.
      const slug = doctor.naam.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/^drs?\.?\s+/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const reviews = (provider.reviews || []).filter(r => sourceScope(r) === 'doctor' && (doctor.bron === r.bron || (() => { try { return new URL(r.bron).pathname.startsWith('/dr/' + slug + '-'); } catch { return false; } })()));
      if (!reviews.length || seen.has(doctor.bron)) continue;
      seen.add(doctor.bron);
      out.push({ ...provider, id: provider.id + '-doctor-' + out.length, naam: doctor.naam, kind: 'doctor', scope: 'doctor', reviews, artsen: [doctor], signalen: {}, parent_clinic: provider.naam });
    }
  }
  return out;
}

export function reviewRanking(list, kind = 'clinic') {
  const records = kind === 'doctor' ? physicianRecords(list.klinieken || []) : (list.klinieken || []).filter(k => k.kind !== 'doctor');
  const benchmark = median(records.flatMap(k => reviewSources(k).included.filter(r => r.aantal >= REVIEW_POLICY.minimum).map(r => r.normalized)));
  const all = records.map(k => ({ k, review: experienceIndex(k, benchmark) }));
  const ranked = all.filter(r => r.review.eligible).sort((a, b) => b.review.score - a.review.score || b.review.platforms - a.review.platforms || a.k.naam.localeCompare(b.k.naam));
  return { ranked, unranked: all.filter(r => !r.review.eligible), benchmark, kind, policy: REVIEW_POLICY };
}
