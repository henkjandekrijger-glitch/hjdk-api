// We Are Many: meldingen op de telefoon met één tik (Henkjan 9 nov: 0 contacten op 43 gesprekken; mensen tikken op de contactknop
// maar typen geen e-mailadres). Web Push zonder extra pakket: een push zonder inhoud met een VAPID-handtekening (ES256); de service
// worker (/sw.js op wearemany.now) haalt daarna zelf de tekst op (/api/wam?op=pushinhoud). De server maakt zijn eigen sleutelpaar
// bij het eerste gebruik en bewaart het in de opslag (wam:vapid); er gaat geen sleutel door een chat of URL.
import crypto from 'node:crypto';
import { kv } from './db.js';

export async function sleutels() {
  let k = await kv.get('wam:vapid').catch(() => null);
  if (!k || !k.pub || !k.jwk) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const p = publicKey.export({ format: 'jwk' });
    const raw = Buffer.concat([Buffer.from([4]), Buffer.from(p.x, 'base64url'), Buffer.from(p.y, 'base64url')]);
    k = { pub: raw.toString('base64url'), jwk: privateKey.export({ format: 'jwk' }), t: Date.now() };
    await kv.set('wam:vapid', k);
  }
  return k;
}
export const publiek = async () => (await sleutels()).pub;

const b64u = s => Buffer.from(s).toString('base64url');
export async function stuurPush(sub, ttl = 172800) {
  if (!sub || !/^https:\/\//.test(String(sub.endpoint || ''))) throw Error('geen push-adres');
  const k = await sleutels(), aud = new URL(sub.endpoint).origin;
  const kop = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' })), lijf = b64u(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'mailto:wam@wearemany.now' }));
  const sig = crypto.sign('sha256', Buffer.from(kop + '.' + lijf), { key: crypto.createPrivateKey({ key: k.jwk, format: 'jwk' }), dsaEncoding: 'ieee-p1363' });
  const r = await fetch(sub.endpoint, { method: 'POST', headers: { TTL: String(ttl), Urgency: 'normal', Authorization: 'vapid t=' + kop + '.' + lijf + '.' + sig.toString('base64url') + ', k=' + k.pub, 'Content-Length': '0' }, signal: AbortSignal.timeout(10000) });
  if (r.status === 404 || r.status === 410) { const e = Error('push-adres bestaat niet meer'); e.weg = true; throw e; }
  if (!r.ok) throw Error('push ' + r.status);
  return true;
}

export const SW = `self.addEventListener('install',function(){self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim())});
self.addEventListener('push',function(e){e.waitUntil((async function(){var d={title:'We Are Many',body:'I have something for you.',url:'/'};
try{var s=await self.registration.pushManager.getSubscription();var r=await fetch('/api/wam?op=pushinhoud&e='+encodeURIComponent(s?s.endpoint:''),{cache:'no-store'});if(r.ok){var j=await r.json();if(j&&j.title)d=j}}catch(x){}
await self.registration.showNotification(d.title,{body:d.body,data:{url:d.url},icon:'/api/wam?op=beeld&h=regelaar&t=en&v=icon',badge:'/api/wam?op=beeld&h=regelaar&t=en&v=icon'})})())});
self.addEventListener('notificationclick',function(e){e.notification.close();var u=(e.notification.data&&e.notification.data.url)||'/';e.waitUntil(self.clients.openWindow(u))});`;
