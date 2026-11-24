// Lezerservaringen: eerst een besloten wachtrij, daarna uitsluitend geredigeerde samenvattingen.
// De originele tekst vervalt na 30 dagen en verdwijnt direct bij goedkeuren of afwijzen.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { kv } from './db.js';

export const REACTIE_BEDRIJVEN = new Set(['vriendenloterij', 'postcodeloterij', 'videoland', 'flanderijn', 'ziggo', 'ns', 'postnl', 'kpn', 'intrum', 'anwb', 'blendle', 'anp', 'hosters']);
export const THEMAS = { contact: 'Contact en bereikbaarheid', betaling: 'Betalingen en kosten', opzeggen: 'Opzeggen', uitvoering: 'Dienstverlening', oplossing: 'Oplossing en herstel', correctie: 'Aanvulling of correctie' };
export const ERVARINGEN = { positief: 'Positief', gemengd: 'Gemengd', negatief: 'Negatief', aanvulling: 'Aanvulling' };
const WACHT = 'wmn:r:wacht', JAAR = 365 * 86400, MAAND = 30 * 86400;
const hash = s => createHash('sha256').update(String(s)).digest('hex');
const sleutel = s => /^[a-f0-9]{24}$/.test(String(s || ''));
const tekst = s => String(s || '').normalize('NFKC').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim();
export function priveGegevens(s) { return /\S+@\S+|https?:\/\/|\b[A-Z]{2}\d{2}[\sA-Z0-9]{10,30}\b|\b\d[\d ()+.-]{7,}\d\b/i.test(s); }
export function redigeerInvoer(s) { return tekst(s).replace(/\S+@\S+/g, '[e-mailadres verwijderd]').replace(/https?:\/\/\S+/g, '[link verwijderd]').replace(/\b[A-Z]{2}\d{2}[\sA-Z0-9]{10,30}\b/g, '[rekeningnummer verwijderd]').replace(/\b\d[\d ()+.-]{7,}\d\b/g, '[nummer verwijderd]'); }
function gelijk(a, b) { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y); }

export async function bewaarReactie(b, ip, db = kv, nu = Date.now()) {
  if (!b || !REACTIE_BEDRIJVEN.has(b.bedrijf) || !Object.hasOwn(THEMAS, b.thema) || !Object.hasOwn(ERVARINGEN, b.ervaring) || b.akkoord !== true) return { ok: false, fout: 'Controleer het bedrijf, onderwerp en je toestemming.' };
  if (String(b.website || '')) return { ok: false, fout: 'Dat lukt niet. Probeer het opnieuw.' };
  const raw = tekst(b.tekst);
  if (raw.length < 20 || raw.length > 2000) return { ok: false, fout: 'Beschrijf je ervaring in 20 tot 2.000 tekens.' };
  const uur = Math.floor(nu / 3600000), rl = 'wmn:r:rl:' + hash(ip || 'onbekend').slice(0, 24) + ':' + uur;
  const n = Number(await db.incr(rl)); if (n === 1) await db.raw(['EXPIRE', rl, 3600]);
  if (n > 8) return { ok: false, fout: 'Je hebt al meerdere reacties gestuurd. Probeer het later opnieuw.' };
  const id = randomBytes(12).toString('hex'), tok = randomBytes(18).toString('hex');
  const dubbel = 'wmn:r:dubbel:' + hash(b.bedrijf + '|' + raw.toLowerCase());
  const r = { id, bedrijf: b.bedrijf, thema: b.thema, ervaring: b.ervaring, tekst: redigeerInvoer(raw), t: nu };
  // Opslaan, wachtrij en ontdubbelen zijn samen atomair; fouten leveren nooit een ontvangstbevestiging op.
  const code = "redis.call('ZREMRANGEBYSCORE',KEYS[2],'-inf',ARGV[1]); if redis.call('ZCARD',KEYS[2])>=3000 then return 'vol' end; if redis.call('EXISTS',KEYS[4])==1 then return 'dubbel' end; redis.call('SET',KEYS[1],ARGV[2],'EX',ARGV[3]); redis.call('ZADD',KEYS[2],ARGV[4],ARGV[5]); redis.call('SET',KEYS[3],ARGV[6],'EX',ARGV[7]); redis.call('SET',KEYS[4],'1','EX',ARGV[3]); return 'OK'";
  const uit = await db.raw(['EVAL', code, 4, 'wmn:r:' + id, WACHT, 'wmn:r:bewijs:' + id, dubbel, nu - MAAND * 1000, JSON.stringify(r), MAAND, nu, id, JSON.stringify({ hash: hash(tok), bedrijf: b.bedrijf, dubbel }), JAAR]);
  if (uit !== 'OK') return { ok: false, fout: uit === 'dubbel' ? 'Deze ervaring hebben we al ontvangen.' : 'De wachtrij is vol. Probeer het later opnieuw.' };
  return { ok: true, id, tok, status: 'wacht-op-moderatie' };
}

export async function wachtlijst(db = kv, nu = Date.now()) {
  await db.raw(['ZREMRANGEBYSCORE', WACHT, '-inf', nu - MAAND * 1000]);
  const ids = await db.raw(['ZRANGE', WACHT, 0, 49]);
  const lijst = ids.length ? await db.mget(...ids.map(id => 'wmn:r:' + id)) : [];
  return lijst.filter(r => r && REACTIE_BEDRIJVEN.has(r.bedrijf));
}
export async function maakModeratieToken(db = kv) {
  const tok = randomBytes(24).toString('hex'); await db.set('wmn:r:csrf:' + hash(tok), 1, { ex: 3600 }); return tok;
}
export async function modereerReactie(b, beschermd, db = kv, nu = Date.now()) {
  if (!beschermd || !/^[a-f0-9]{48}$/.test(String(b?.csrf || '')) || !await db.get('wmn:r:csrf:' + hash(b.csrf))) return { ok: false, fout: 'Geen toegang. Open de moderatiepagina opnieuw.' };
  if (!sleutel(b.id) || !['publiceer', 'afwijzen'].includes(b.actie)) return { ok: false, fout: 'Ongeldige handeling.' };
  const r = await db.get('wmn:r:' + b.id);
  if (!r || !REACTIE_BEDRIJVEN.has(r.bedrijf)) return { ok: false, fout: 'Deze reactie is al behandeld of verlopen.' };
  const pub = 'wmn:r:pub:' + r.bedrijf;
  if (b.actie === 'afwijzen') { await db.raw(['EVAL', "redis.call('DEL',KEYS[1]); redis.call('ZREM',KEYS[2],ARGV[1]); return 1", 2, 'wmn:r:' + b.id, WACHT, b.id]); return { ok: true }; }
  const zin = tekst(b.samenvatting).replace(/\s+/g, ' ');
  if (!Object.hasOwn(THEMAS, b.thema) || !Object.hasOwn(ERVARINGEN, b.ervaring) || zin.length < 20 || zin.length > 240 || /[<>]/.test(zin) || priveGegevens(zin) || b.gecontroleerd !== true) return { ok: false, fout: 'Controleer de anonieme samenvatting (20 tot 240 tekens), het onderwerp en de publicatiecontrole.' };
  const u = { thema: b.thema, ervaring: b.ervaring, zin, t: nu };
  // Alleen de redactioneel gecontroleerde zin komt in de publieke verzameling; de oorspronkelijke tekst gaat weg.
  const code = "if redis.call('EXISTS',KEYS[1])==0 then return 0 end; redis.call('SET',KEYS[4],ARGV[2],'EX',ARGV[3]); redis.call('ZREMRANGEBYSCORE',KEYS[3],'-inf',ARGV[5]); redis.call('ZADD',KEYS[3],ARGV[4],ARGV[1]); redis.call('EXPIRE',KEYS[3],ARGV[3]); redis.call('EXPIRE',KEYS[5],ARGV[3]); redis.call('DEL',KEYS[1]); redis.call('ZREM',KEYS[2],ARGV[1]); return 1";
  const ok = Number(await db.raw(['EVAL', code, 5, 'wmn:r:' + b.id, WACHT, pub, 'wmn:r:goedgekeurd:' + b.id, 'wmn:r:bewijs:' + b.id, b.id, JSON.stringify(u), JAAR, nu, nu - JAAR * 1000]));
  return ok ? { ok: true } : { ok: false, fout: 'Deze reactie is intussen al behandeld.' };
}
export function concentreerReacties(lijst) {
  const groepen = new Map();
  for (const r of lijst) {
    if (!r || !Object.hasOwn(THEMAS, r.thema) || !Object.hasOwn(ERVARINGEN, r.ervaring) || typeof r.zin !== 'string' || r.zin.length > 240 || priveGegevens(r.zin) || /[<>]/.test(r.zin)) continue;
    const k = r.thema + '|' + r.ervaring;
    if (!groepen.has(k)) groepen.set(k, { thema: r.thema, ervaring: r.ervaring, n: 0, zinnen: [], t: 0 });
    const g = groepen.get(k); g.n++; g.t = Math.max(g.t, Number(r.t) || 0);
    if (g.zinnen.length < 3 && !g.zinnen.includes(r.zin)) g.zinnen.push(r.zin);
  }
  return [...groepen.values()].sort((a, b) => b.n - a.n || b.t - a.t);
}
export async function publiekeReacties(bedrijf, db = kv) {
  if (!REACTIE_BEDRIJVEN.has(bedrijf)) return [];
  const nu = Date.now();
  await db.raw(['ZREMRANGEBYSCORE', 'wmn:r:pub:' + bedrijf, '-inf', nu - JAAR * 1000]);
  const ids = await db.raw(['ZRANGE', 'wmn:r:pub:' + bedrijf, 0, -1]);
  const l = ids.length ? await db.mget(...ids.map(id => 'wmn:r:goedgekeurd:' + id)) : [];
  return concentreerReacties(l.filter(r => r && Number(r.t) > nu - JAAR * 1000));
}
export async function wisReactie(b, db = kv) {
  if (!sleutel(b?.id) || !/^[a-f0-9]{36}$/.test(String(b?.tok || ''))) return { ok: false };
  const r = await db.get('wmn:r:bewijs:' + b.id);
  if (!r || !REACTIE_BEDRIJVEN.has(r.bedrijf) || !gelijk(r.hash, hash(b.tok))) return { ok: false };
  const dubbel = /^wmn:r:dubbel:[a-f0-9]{64}$/.test(String(r.dubbel || '')) ? r.dubbel : 'wmn:r:geen-dubbel:' + b.id;
  await db.raw(['EVAL', "redis.call('DEL',KEYS[1],KEYS[2],KEYS[5],KEYS[6]); redis.call('ZREM',KEYS[3],ARGV[1]); redis.call('ZREM',KEYS[4],ARGV[1]); return 1", 6, 'wmn:r:' + b.id, 'wmn:r:bewijs:' + b.id, WACHT, 'wmn:r:pub:' + r.bedrijf, 'wmn:r:goedgekeurd:' + b.id, dubbel, b.id]);
  return { ok: true };
}

// Proef met echte Redis-opdrachten in een eigen, daarna gewiste naamruimte. Niets komt in publieke tellers of reacties.
export async function reactieProef(db = kv) {
  const prefix = 'wmn:proef:' + randomBytes(10).toString('hex') + ':', sleutels = new Set(), t = Date.now();
  const k = s => { const u = prefix + s; sleutels.add(u); return u; };
  const proefDb = {
    get: s => db.get(k(s)), set: (s, v, o) => db.set(k(s), v, o), incr: s => db.incr(k(s)), mget: (...s) => db.mget(...s.map(k)),
    raw: args => { const a = [...args]; if (a[0] === 'EVAL') { for (let i = 3; i < 3 + Number(a[2]); i++) a[i] = k(a[i]); } else a[1] = k(a[1]); return db.raw(a); }
  };
  const checks = {};
  try {
    const input = { bedrijf: 'flanderijn', thema: 'contact', ervaring: 'gemengd', tekst: 'Dit is een besloten technische proef van de moderatieroute.', akkoord: true };
    const r = await bewaarReactie(input, 'besloten-proef', proefDb);
    checks.ontvangen = r.ok && (await wachtlijst(proefDb)).length === 1;
    checks.niet_openbaar = (await publiekeReacties('flanderijn', proefDb)).length === 0;
    checks.ontdubbelen = !(await bewaarReactie(input, 'besloten-proef', proefDb)).ok;
    const csrf = await maakModeratieToken(proefDb);
    const b = { id: r.id, csrf, actie: 'publiceer', thema: 'contact', ervaring: 'gemengd', samenvatting: 'Een lezer beschrijft een gemengde ervaring met het contact.', gecontroleerd: true };
    checks.openbare_host_geweigerd = !(await modereerReactie(b, false, proefDb)).ok;
    checks.zonder_token_geweigerd = !(await modereerReactie({ ...b, csrf: '' }, true, proefDb)).ok;
    checks.privacy_geweigerd = !(await modereerReactie({ ...b, samenvatting: 'Mail naar persoon@example.invalid om deze ervaring te bespreken.' }, true, proefDb)).ok;
    checks.goedgekeurd = (await modereerReactie(b, true, proefDb)).ok;
    const pub = await publiekeReacties('flanderijn', proefDb);
    checks.geconcentreerd = pub.length === 1 && pub[0].n === 1 && pub[0].zinnen[0] === b.samenvatting;
    checks.origineel_verwijderd = !await proefDb.get('wmn:r:' + r.id) && (await wachtlijst(proefDb)).length === 0;
    checks.wislink_beveiligd = !(await wisReactie({ id: r.id, tok: '0'.repeat(36) }, proefDb)).ok;
    checks.wislink_werkt = (await wisReactie(r, proefDb)).ok && (await publiekeReacties('flanderijn', proefDb)).length === 0;
    const twee = await bewaarReactie({ ...input, tekst: input.tekst + ' Tweede inzending voor de afwijzingsproef.' }, 'besloten-proef', proefDb);
    checks.afwijzen = (await modereerReactie({ id: twee.id, csrf, actie: 'afwijzen' }, true, proefDb)).ok && (await wachtlijst(proefDb)).length === 0;
    return { ok: Object.values(checks).every(Boolean), checks, ms: Date.now() - t };
  } finally { await db.del([...sleutels]); }
}
