import { updateReport } from './keuze-updates.js';
// Public aggregate adapter; no names, emails, sessions or credentials leave this project.
import { kv } from './db.js';
import { organicStatus } from './organic.js';
import { dailyUsage, usageDay } from './guide-usage.js';
export const PROJECTS = { kz: 'keuzehulpen-nl', us: 'keuzehulpen-us', de: 'keuzehulpen-de' };
export function measurement(site, rows, now = new Date()) {
  if (!PROJECTS[site]) throw new Error('onbekende site');
  const guides = rows.filter(r => r.slug !== '__fp');
  const views = guides.reduce((n,r) => n + r.view, 0), uses = guides.reduce((n,r) => n + r.use, 0);
  if (uses > views) throw new Error('meetcontrole: gebruik groter dan gidsweergaven');
  return {
    soort: 'meting', project: PROJECTS[site], dag: usageDay(now), tijdzone: 'America/Curacao', at: now.toISOString(),
    stappen: [{ van: 'gids-gezien', naar: 'gids-gebruikt', label: 'Gidsweergave naar eerste keuze/rekenactie (tabsessie/gids/dag)', in: views, door: uses }],
    experimenten: [],
    dekking: {
      eenheid: 'tabsessie per gids per dag, geen unieke personen', sinds: null,
      fpInGebruik: guides.reduce((n,r) => n + r.fpUse, 0),
      trendingGeldig: guides.reduce((n,r) => n + r.eligible, 0),
      ontbreekt: ['afzonderlijke antwoorden', 'advies gezien', 'winkelklik in dezelfde cohort', 'dagelijkse toegeschreven verkoop per arm', 'aftersales', 'push/email per arm'],
      verkoop: site === 'kz' ? 'Bestaande bol-rapportage heeft eigen periode; niet vermengd met deze dagtrechter.' : 'Amazon-verkoopattributie ontbreekt; winkelkliks zijn geen verkopen.',
      experimenten: 'Geen nieuw experiment of winnaar geclaimd; bestaande losse experimenten nog niet naar dit schema vertaald.'
    }
  };
}
export async function syncLessons() {
  const key = 'hjdk:leerlus:lessen';
  let old = null; try { old = await kv.get(key); } catch {}
  if (old && Date.now() - old.at < 15 * 60000) return old;
  try {
    const r = await fetch('https://propellerads-mcp.vercel.app/api/leerlus?vorm=json', { signal: AbortSignal.timeout(5000), headers: { accept: 'application/json' } });
    const j = await r.json();
    if (!r.ok || !j.ok || !Array.isArray(j.lessen)) throw new Error('geen lessen');
    const data = { at: Date.now(), lessen: j.lessen.filter(l => l.status === 'actief').slice(0,20).map(l => ({ sleutel: String(l.sleutel).slice(0,60), les: String(l.les).slice(0,400), proeven: Number(l.proeven)||0, beter: Number(l.beter)||0, slechter: Number(l.slechter)||0 })) };
    await kv.set(key, data, { ex: 7 * 86400 }); return data;
  } catch { return old; }
}
export async function keuzeMeting(site) {
  const day = usageDay();
  const [rows, lessons, since] = await Promise.all([dailyUsage(site, day), syncLessons(), kv.get('guide:tracking-since')]);
  const out = measurement(site, rows); out.dekking.sinds = since || null;
  out.centraleLessen = { opgehaaldOp: lessons?.at ? new Date(lessons.at).toISOString() : null, aantal: lessons?.lessen?.length || 0 };
  const updates = await updateReport(site);
  out.experimenten = updates.experiments;
  const subjects = updates.mailSubjectArms;
  out.experimenten.push({ id: 'updates-subject-v1', stap: 'mail ontvangen naar betrokken terugkeer', metric: 'echte site-terugkeer na interactie of 5s zichtbaar, geen openpixels', armen: { v0: { d: Number(subjects[0]) || 0, n: Number(subjects[1]) || 0 }, v1: { d: Number(subjects[2]) || 0, n: Number(subjects[3]) || 0 } }, uit: [], namen: { v0: 'Nieuw', v1: 'Volgende keuzehulp' } });
  const cohort = updates.cohortToday;
  out.stappen.push({ van: 'updateblok-gezien', naar: 'email-bevestigd', label: 'Bevestigde opt-in uit blokken getoond op deze Curaçao-dag (cohort)', in: cohort.cta, door: cohort.confirmed });
  out.updates = { activeSubscribers: updates.activeSubscribers, signupHours: updates.signupHours, worker: updates.worker, decision: updates.decision };
  out.dekking.ontbreekt = ['volledige vraagvolgorde per hulpmiddel', 'verkoop per experimentarm', 'aftersales bij externe winkels'];
  out.dekking.experimenten = updates.decision;
  out.organisch = await organicStatus(site, site === 'kz' ? Number(process.env.KZ_PER_DAG || 12) : Number(process.env['WTB_PER_DAG_' + site.toUpperCase()] || 10));
  out.dekking.organisch = 'Google-meetperiode en indexcontrole staan apart; geen CTR of verkoopratio berekenen met de Curaçao-dagtrechter als noemer.';
  return out;
}


