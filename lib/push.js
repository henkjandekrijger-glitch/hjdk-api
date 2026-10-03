// Web push zonder extra pakketten: VAPID (ES256) met Node-crypto en "lege" pushes.
// De browser krijgt alleen een seintje; de service worker haalt daarna zelf de tekst op (/api/kz/pushmsg).
// De VAPID-sleutels maakt de server zelf aan bij het eerste gebruik en bewaart ze in Redis (niemand hoeft ze in te vullen).
import crypto from 'crypto';
import { kv } from './db.js';

const VKEY = 'hjdk:kz:vapid';
const b64u = buf => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const subHash = endpoint => crypto.createHash('sha256').update(String(endpoint)).digest('hex').slice(0, 24);

let cache = null;
export async function vapid() {
  if (cache) return cache;
  let v = await kv.get(VKEY);
  if (!v || !v.pub || !v.jwk) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const jwk = privateKey.export({ format: 'jwk' });
    const pubJwk = publicKey.export({ format: 'jwk' });
    const raw = Buffer.concat([Buffer.from([4]), Buffer.from(pubJwk.x, 'base64'), Buffer.from(pubJwk.y, 'base64')]);
    v = { pub: b64u(raw), jwk, at: Date.now() };
    const again = await kv.get(VKEY); if (again && again.pub) v = again; else await kv.set(VKEY, v);
  }
  cache = v; return v;
}

function jwt(aud, v, subject) {
  const head = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const body = b64u(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject }));
  const key = crypto.createPrivateKey({ key: v.jwk, format: 'jwk' });
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + body), { key, dsaEncoding: 'ieee-p1363' });
  return head + '.' + body + '.' + b64u(sig);
}

// stuurt een lege push; geeft {ok, status, gone} terug (gone = abonnement bestaat niet meer -> opruimen)
export async function sendPush(endpoint, subject) {
  const v = await vapid(); let aud;
  try { aud = new URL(endpoint).origin; } catch (e) { return { ok: false, status: 0, gone: true }; }
  try {
    const r = await fetch(endpoint, { method: 'POST', headers: { TTL: '86400', Urgency: 'normal', 'Content-Length': '0', Authorization: 'vapid t=' + jwt(aud, v, subject || 'mailto:henkjan@keuzehulp.best') + ', k=' + v.pub } });
    return { ok: r.status >= 200 && r.status < 300, status: r.status, gone: r.status === 404 || r.status === 410 };
  } catch (e) { return { ok: false, status: 0, gone: false }; }
}
