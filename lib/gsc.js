// Google Search Console zonder sleutel: Vercel geeft elke functie een OIDC-token; Google wisselt dat in (Workload Identity Federation)
// voor een token van serviceaccount seo-leerlus@hjdk-seo. Geen geheimen in Vercel nodig. Alles hieronder is openbaar en mag in code staan.
import { kv } from './db.js';

const CFG = () => ({
  projectNumber: process.env.GSC_PROJECT_NUMBER || '544726642898',
  pool: process.env.GSC_POOL || 'vercel', provider: process.env.GSC_PROVIDER || 'vercel',
  sa: process.env.GSC_SA || 'seo-leerlus@hjdk-seo.iam.gserviceaccount.com'
});
export const SITES = { kz: 'keuzehulp.best', us: 'whichtobuy.best', de: 'kaufberater.best' };

export function claims(oidc) { try { const p = JSON.parse(Buffer.from(String(oidc).split('.')[1], 'base64url').toString()); return { iss: p.iss, aud: p.aud, sub: p.sub, exp: p.exp }; } catch (e) { return null; } }

export async function token(oidc) {
  const c0 = await kv.get('hjdk:gsc:at').catch(() => null); if (c0 && c0.exp > Date.now() + 120000) return c0.t;
  oidc = oidc || process.env.VERCEL_OIDC_TOKEN; if (!oidc) throw new Error('geen Vercel OIDC-token');
  const c = CFG();
  const sts = await fetch('https://sts.googleapis.com/v1/token', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
    grantType: 'urn:ietf:params:oauth:grant-type:token-exchange', audience: `//iam.googleapis.com/projects/${c.projectNumber}/locations/global/workloadIdentityPools/${c.pool}/providers/${c.provider}`,
    scope: 'https://www.googleapis.com/auth/cloud-platform', requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token', subjectToken: oidc, subjectTokenType: 'urn:ietf:params:oauth:token-type:jwt' }) });
  const s = await sts.json().catch(() => ({})); if (!sts.ok) throw new Error('google sts ' + sts.status + ': ' + JSON.stringify(s).slice(0, 200));
  const r = await fetch(`https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(c.sa)}:generateAccessToken`, { method: 'POST', headers: { authorization: 'Bearer ' + s.access_token, 'content-type': 'application/json' }, body: JSON.stringify({ scope: ['https://www.googleapis.com/auth/webmasters.readonly'], lifetime: '3600s' }) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error('google serviceaccount ' + r.status + ': ' + JSON.stringify(j).slice(0, 200));
  try { await kv.set('hjdk:gsc:at', { t: j.accessToken, exp: Date.parse(j.expireTime) }, { ex: 3500 }); } catch (e) {}
  return j.accessToken;
}

export async function sites(oidc) {
  const r = await fetch('https://www.googleapis.com/webmasters/v3/sites', { headers: { authorization: 'Bearer ' + await token(oidc) } });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error('sites ' + r.status + ': ' + JSON.stringify(j).slice(0, 200));
  return (j.siteEntry || []).map(s => s.siteUrl);
}
// eigendom in Search Console voor een host: domeineigendom heeft voorrang, anders de https-variant
export function propFor(list, host) { return list.find(u => u === 'sc-domain:' + host) || list.find(u => u === 'https://' + host + '/') || list.find(u => u === 'https://www.' + host + '/') || null; }

export async function rows(prop, days, oidc) {
  const end = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10); const start = new Date(Date.now() - (2 + (days || 28)) * 864e5).toISOString().slice(0, 10);
  const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(prop)}/searchAnalytics/query`, { method: 'POST', headers: { authorization: 'Bearer ' + await token(oidc), 'content-type': 'application/json' }, body: JSON.stringify({ startDate: start, endDate: end, dimensions: ['page', 'query'], rowLimit: 25000 }) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error('query ' + r.status + ': ' + JSON.stringify(j).slice(0, 200));
  return (j.rows || []).map(x => ({ page: x.keys[0], q: x.keys[1], clicks: x.clicks, imp: x.impressions, ctr: x.ctr, pos: x.position }));
}

const STOP = new Set('de het een en van voor met in op te is wat welke welk beste best goede kopen koop 2025 2026 the a an for of to and or with which what best buy der die das und für mit welcher welche welches beste kaufen ein eine im zu vs'.split(' '));
const toks = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').split(/[^a-z0-9]+/).filter(t => t.length > 1 && !STOP.has(t));
const slugOf = u => { try { return new URL(u).pathname.replace(/^\/(keuzehulp\/)?/, '').replace(/\/$/, ''); } catch (e) { return ''; } };

// pages = [{slug, title, term}] — wat we al hebben. Uitkomst: open zoekvragen (vertoond, maar geen pagina gaat er echt over) en pagina's met te lage CTR.
export function analyse(rs, pages) {
  const doc = pages.map(p => ({ slug: p.slug, t: new Set(toks([p.slug, p.title, p.term, p.h1].join(' '))) }));
  const cover = q => { const qt = toks(q); if (!qt.length) return 1; let best = 0; doc.forEach(d => { const hit = qt.filter(t => d.t.has(t) || [...d.t].some(x => x.length > 4 && (x.startsWith(t) || t.startsWith(x)))).length / qt.length; if (hit > best) best = hit; }); return best; };
  const perQ = {}; rs.forEach(r => { const k = r.q; const x = perQ[k] || (perQ[k] = { q: k, imp: 0, clicks: 0, posW: 0, pages: new Set() }); x.imp += r.imp; x.clicks += r.clicks; x.posW += r.pos * r.imp; x.pages.add(slugOf(r.page)); });
  const totI = rs.reduce((a, r) => a + r.imp, 0); const minImp = totI < 200 ? 1 : 3; // jonge site: elke vertoning telt
  const open = Object.values(perQ).filter(x => x.imp >= minImp).map(x => ({ q: x.q, imp: x.imp, clicks: x.clicks, pos: Math.round(x.posW / x.imp * 10) / 10, cover: Math.round(cover(x.q) * 100) / 100 })).filter(x => x.cover < 0.5).sort((a, b) => b.imp - a.imp).slice(0, 40);
  const perP = {}; rs.forEach(r => { const s = slugOf(r.page); if (!s) return; const x = perP[s] || (perP[s] = { slug: s, imp: 0, clicks: 0, posW: 0, qs: [] }); x.imp += r.imp; x.clicks += r.clicks; x.posW += r.pos * r.imp; x.qs.push([r.q, r.imp]); });
  const totImp = rs.reduce((a, r) => a + r.imp, 0), totClk = rs.reduce((a, r) => a + r.clicks, 0); const avg = totImp ? totClk / totImp : 0;
  const laagCtr = Object.values(perP).map(x => ({ slug: x.slug, imp: x.imp, clicks: x.clicks, ctr: x.imp ? x.clicks / x.imp : 0, pos: Math.round(x.posW / Math.max(1, x.imp) * 10) / 10, topQ: x.qs.sort((a, b) => b[1] - a[1]).slice(0, 6).map(q => q[0]) }))
    .filter(x => (avg > 0 && x.imp >= 50 && x.ctr < 0.6 * avg) || (avg === 0 && x.imp >= 100 && x.pos <= 15)).sort((a, b) => b.imp - a.imp).slice(0, 15);
  return { totaal: { imp: totImp, clicks: totClk, ctr: Math.round(avg * 10000) / 100, zoekvragen: Object.keys(perQ).length, paginas: Object.keys(perP).length }, open, laagCtr };
}
