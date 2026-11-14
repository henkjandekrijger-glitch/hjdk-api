// Vercel OIDC-token van een ander project controleren (14 nov 2026): zo kan Demand Radar (project demand_radar) gegevens van
// hjdk-api lezen zonder gedeeld geheim. Het token is een JWT, ondertekend door Vercel; de sleutels staan openbaar bij de uitgever.
import { createPublicKey, verify } from 'node:crypto';

const keys = new Map(); // uitgever -> { t, jwks }
async function jwks(iss) {
  const c = keys.get(iss); if (c && c.t > Date.now() - 6 * 3600e3) return c.jwks;
  const r = await fetch(`${iss}/.well-known/jwks`, { signal: AbortSignal.timeout(8000) }); if (!r.ok) throw new Error('jwks ' + r.status);
  const j = await r.json(); keys.set(iss, { t: Date.now(), jwks: j }); return j;
}
const b64 = s => JSON.parse(Buffer.from(s, 'base64url').toString());
export async function verifyVercelOidc(tok, { owner = 'henq', projects = [] } = {}) {
  const [h, p, sig] = String(tok || '').split('.'); if (!h || !p || !sig) throw new Error('geen token');
  const head = b64(h), body = b64(p);
  if (!/^https:\/\/oidc\.vercel\.com(\/[\w-]+)?$/.test(String(body.iss))) throw new Error('uitgever');
  if (!(body.exp * 1000 > Date.now())) throw new Error('verlopen');
  const sub = String(body.sub || ''), own = body.owner || (sub.match(/owner:([^:]+)/) || [])[1], proj = body.project || (sub.match(/project:([^:]+)/) || [])[1];
  if (owner && own !== owner) throw new Error('team');
  if (projects.length && !projects.includes(proj)) throw new Error('project');
  const set = await jwks(body.iss), jwk = (set.keys || []).find(k => k.kid === head.kid); if (!jwk) throw new Error('sleutel');
  const ok = verify('RSA-SHA256', Buffer.from(`${h}.${p}`), createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(sig, 'base64url'));
  if (!ok) throw new Error('handtekening');
  return { owner: own, project: proj, environment: body.environment || (sub.match(/environment:([^:]+)/) || [])[1] };
}
