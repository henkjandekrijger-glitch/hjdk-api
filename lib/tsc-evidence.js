// Evidence contract v2. Patient experience is not a clinical safety score.
// No payment, commercial availability or platform review total enters these functions.
export const EVIDENCE_VERSION = 'surgery-evidence-2026-11-15-v2';
export const REQUIRED_CHECKS = ['identity', 'registration', 'procedure_scope', 'facility_permission', 'operator_roles', 'restrictions'];
export const EXPERIENCE_DIMENSIONS = ['communication', 'expectations', 'cost_clarity', 'aftercare'];

export function eligibility(record, today = new Date().toISOString().slice(0, 10)) {
  const checks = record.checks || {};
  const blocked = REQUIRED_CHECKS.filter(key => checks[key]?.status === 'failed');
  if (['active', 'under_review'].includes(record.restriction?.status) && record.restriction?.source_url) blocked.push('active_restriction');
  const missing = REQUIRED_CHECKS.filter(key => {
    const check = checks[key];
    const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
    return check?.status !== 'verified' || !/^https:\/\//.test(check.source_url || '') || !date(check.verified_at) || !date(check.valid_until) || check.verified_at > today || check.valid_until < today || check.valid_until < check.verified_at;
  });
  return { status: blocked.length ? 'held_for_review' : missing.length ? 'incomplete' : 'eligible', blocked, missing };
}

// One response per patient episode, question and follow-up wave. Newer revisions replace older ones.
// The episode key is a private, pseudonymous identifier; never publish it.
export function uniqueOwnReviews(reviews, { doctor_id, facility_id, procedure_id, followup_wave } = {}) {
  const seen = new Map();
  for (const review of reviews || []) {
    if (review.source_type !== 'own' || review.relationship_verified !== true || review.moderation_status !== 'published' || !review.episode_id || !review.review_id || !review.published_at) continue;
    if (doctor_id && review.doctor_id !== doctor_id) continue;
    if (facility_id && review.facility_id !== facility_id) continue;
    if (procedure_id && review.procedure_id !== procedure_id) continue;
    if (followup_wave && review.followup_wave !== followup_wave) continue;
    const key = review.episode_id + ':' + review.followup_wave;
    const previous = seen.get(key);
    if (!previous || review.published_at > previous.published_at) seen.set(key, review);
  }
  return [...seen.values()];
}

// Wilson interval describes sampling uncertainty in the responding cohort only.
// It does not correct self-selection, nonresponse, case mix or source manipulation.
export function wilson(positive, total, z = 1.96) {
  if (!Number.isInteger(total) || !Number.isInteger(positive) || total <= 0 || positive < 0 || positive > total) return null;
  const p = positive / total, z2 = z * z, den = 1 + z2 / total;
  const mid = (p + z2 / (2 * total)) / den;
  const half = z * Math.sqrt(p * (1 - p) / total + z2 / (4 * total * total)) / den;
  return { proportion: p, low: Math.max(0, mid - half), high: Math.min(1, mid + half), n: total };
}

export function experienceSummary(reviews, filter = {}) {
  const own = uniqueOwnReviews(reviews, filter), dimensions = {};
  for (const dimension of EXPERIENCE_DIMENSIONS) {
    const values = own.map(r => r[dimension]).filter(v => Number.isInteger(v) && v >= 1 && v <= 5);
    const positive = values.filter(v => v >= 4).length;
    dimensions[dimension] = { ...wilson(positive, values.length), answered: values.length, favourable: positive };
  }
  return { unique_episodes: own.length, cohort: { doctor_id: filter.doctor_id || null, facility_id: filter.facility_id || null, procedure_id: filter.procedure_id || null, followup_wave: filter.followup_wave || null }, dimensions, meaning: 'patient_reported_experience_only' };
}

// Draft policy, not a validated clinical ranking. Compare like-for-like cohorts only.
// The minimum of 20 is an editorial publication threshold, not proof of reliability.
export function rankExperience(cases, dimension, { today, minimum = 20, procedure_id, followup_wave } = {}) {
  if (!EXPERIENCE_DIMENSIONS.includes(dimension)) throw new Error('Unknown experience dimension');
  const included = [], held = [];
  const procedures = new Set((cases || []).map(c => c.procedure_id).filter(Boolean));
  if (procedures.size > 1 && !procedure_id) throw new Error('Choose one procedure cohort');
  for (const candidate of cases || []) {
    const check = eligibility(candidate, today);
    const measure = candidate.experience?.dimensions?.[dimension];
    const cohort = candidate.experience?.cohort || {};
    const comparable = !!candidate.doctor_id && !!candidate.facility_id && !!candidate.procedure_id && !!cohort.followup_wave && cohort.doctor_id === candidate.doctor_id && cohort.facility_id === candidate.facility_id && cohort.procedure_id === candidate.procedure_id && (!procedure_id || candidate.procedure_id === procedure_id) && (!followup_wave || cohort.followup_wave === followup_wave);
    if (!comparable || check.status !== 'eligible' || !measure || measure.answered < minimum || !Number.isFinite(measure.low)) {
      held.push({ id: candidate.id, status: check.status, missing: check.missing, incomparable_cohort: !comparable, insufficient_reviews: !measure || measure.answered < minimum });
    } else included.push({ ...candidate, comparison_measure: measure });
  }
  const waves = new Set(included.map(c => c.experience.cohort.followup_wave));
  if (waves.size > 1) throw new Error('Choose one follow-up cohort');
  included.sort((a, b) => b.comparison_measure.low - a.comparison_measure.low || a.id.localeCompare(b.id));
  let tier = 0, upper = null;
  const ordered = included.map(candidate => {
    const m = candidate.comparison_measure;
    // Overlapping intervals receive the same editorial group, not a claimed significant difference.
    if (upper === null || m.high < upper) { tier++; upper = m.low; }
    else upper = Math.min(upper, m.low);
    return { ...candidate, evidence_group: tier };
  });
  return { version: EVIDENCE_VERSION, dimension, ordered, held, clinical_quality_rank: false };
}
