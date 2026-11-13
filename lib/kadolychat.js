// Kadoly-chat: vragen van bezoekers in de modal en op WhatsApp (Henkjan 11 nov 2026: "een chat moment in de modal verwerken met
// vragen of gewoon ze kunnen er tegen praten ? Je kunt in de chat ook prima een whatsap link aanbieden want die gaat naar mij . Je kan
// dan antwoorden met kadoly antwoorden maar ik kan ook in grijpen ." Nummer: zijn eigen nummer, "Ja ik ben ook official owner").
// - Tikknoppen (levertijd, verzendkosten, retour, betalen, betrouwbaar) krijgen een vast antwoord uit de feiten hieronder, zonder AI,
//   en tellen als reden van twijfel (mm:kreden:<site>:<dag>): zo leren we waarom mensen vastlopen.
// - Een eigen vraag gaat naar Claude (Haiku) met alleen deze feiten en de productinfo van de pagina; verzint niets, weet hij het niet,
//   dan verwijst hij naar WhatsApp (in de modal) of zegt hij dat Henkjan meeleest (op WhatsApp).
// - WhatsApp: whatsappp-mcp (src/kadoly.js) stuurt elk bericht uit een gesprek dat met "Kadoly" begon hierheen (kanaal wa).
// - Grenzen tegen misbruik: hoogstens 1500 AI-antwoorden per dag in totaal, 30 per IP per dag (WhatsApp 800).
import { createHash } from 'node:crypto';
import { berichten, HAIKU } from './ai.js';

export const WA_NUMMER = '31655395630';
export { KEUZES } from './kadolykeuzes.js';
const BEDRIJF = 'ADSFAIR B.V., Albert Plesmanplein 20, 2805 AB Gouda (KvK 60126035, btw-nummer NL853775485B01)';
const FEITEN = [
  'Kadoly (kadoly.com) is een Nederlandse webshop voor bijzondere spullen en cadeaus, van ' + BEDRIJF + '.',
  'Verzending: bij je eerste bestelling betaalt Kadoly de verzending. Daarna zie je de verzendkosten op de afrekenpagina, voordat je betaalt.',
  'Levertijd: de verwachte bezorgdatum staat bij elk product en op de afrekenpagina, voordat je betaalt. Noem alleen een datum als die in de productinfo staat.',
  'Retour: niet goed? Dan krijg je je geld terug; binnen 14 dagen gratis retourneren.',
  'Betalen: iDEAL | Wero, Apple Pay, Google Pay, creditcard, PayPal en Klarna. Je betaalt op de afrekenpagina, via je eigen bank of app. Een account is niet nodig.',
  'Contact: via WhatsApp (Henkjan van Kadoly leest mee) of in deze chat.',
];
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const kort = (t, n) => String(t == null ? '' : t).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const dag = () => new Date().toISOString().slice(0, 10);

export function vastAntwoord(id, ctx = {}) {
  const lev = kort(ctx.levering, 120);
  return {
    levering: lev ? lev.replace(/\.$/, '') + '. Je ziet de verwachte datum ook op de afrekenpagina, voordat je betaalt.' : 'De verwachte bezorgdatum staat bij het product en op de afrekenpagina, voordat je betaalt.',
    verzending: 'Bij je eerste bestelling betalen wij de verzending. Daarna zie je de verzendkosten op de afrekenpagina, voordat je betaalt: geen verrassingen achteraf.',
    retour: 'Niet goed? Dan krijg je je geld terug. Je kunt binnen 14 dagen gratis retourneren.',
    betalen: 'Je betaalt met iDEAL | Wero, Apple Pay, Google Pay, creditcard, PayPal of Klarna, via je eigen bank of app. Een account aanmaken hoeft niet.',
    vertrouwen: 'Kadoly is een Nederlandse webshop van ' + BEDRIJF + '. Je betaalt veilig via je eigen bank (iDEAL) of PayPal, en je hebt 14 dagen om gratis te retourneren.',
  }[id] || '';
}

async function telReden(kv, site, r) { const k = 'mm:kreden:' + site + ':' + dag(); await kv.raw(['HINCRBY', k, r, 1]).catch(() => null); await kv.raw(['EXPIRE', k, 60 * 86400]).catch(() => null); }
export async function redenenVandaag(kv, site = 'kadoly') { let h = []; try { h = await kv.raw(['HGETALL', 'mm:kreden:' + site + ':' + dag()]); } catch (e) {} const o = {}; if (Array.isArray(h)) for (let i = 0; i + 1 < h.length; i += 2) o[h[i]] = N(h[i + 1]); else Object.assign(o, h || {}); return o; }

// Herstel na een test (alleen beschermde host): min=<reden> haalt 1 tel van vandaag af, wisvraag=<begin> haalt vragen uit het vragenlog.
export async function kadolyHerstel(kv, { min, wisvraag, site = 'kadoly' }) {
  const uit = { ok: true };
  if (min) { const k = 'mm:kreden:' + site + ':' + dag(); uit.min = N(await kv.raw(['HINCRBY', k, String(min).slice(0, 40), -1]).catch(() => null)); if (uit.min <= 0) await kv.raw(['HDEL', k, String(min).slice(0, 40)]).catch(() => null); }
  if (wisvraag) { let l = []; try { l = await kv.raw(['LRANGE', 'mm:kvragen:' + site, '0', '299']); } catch (e) {} let n = 0; for (const x of (Array.isArray(l) ? l : [])) { let v = ''; try { v = JSON.parse(x).v || ''; } catch (e) {} if (v.startsWith(String(wisvraag))) { await kv.raw(['LREM', 'mm:kvragen:' + site, '0', x]).catch(() => null); n++; } } uit.gewist = n; }
  return uit;
}

// Persoonlijk antwoord (13 nov, Henkjan: "Ja zorg dat je contact krijgt met de pot koper ."): na het eerste antwoord kan de bezoeker zijn
// e-mailadres achterlaten. Henkjan krijgt het gesprek per mail (antwoorden gaat direct naar de bezoeker); bewaard in mm:kcontact:<site>, 30 dagen.
const MAILOK = /^[^\s@<>()[\],;:"]{1,64}@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}$/i;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export async function kadolyContact(kv, { kontakt, hist, ctx, ip, site = 'kadoly' }) {
  const mail = String(kontakt || '').trim().toLowerCase(); if (!MAILOK.test(mail)) return { ok: false, fout: 'Vul een geldig e-mailadres in.' };
  const ih = createHash('sha256').update('kk|' + String(ip || '')).digest('hex').slice(0, 16), k = 'kc:kk:' + ih + ':' + dag();
  const n = N(await kv.raw(['INCR', k]).catch(() => 0)); await kv.raw(['EXPIRE', k, 2 * 86400]).catch(() => null); if (n > 5) return { ok: true, antwoord: 'Dank je! We hebben je bericht al.' };
  ctx = ctx && typeof ctx === 'object' ? ctx : {}; const c = { titel: kort(ctx.titel, 120), url: kort(ctx.url, 160) };
  const h = (Array.isArray(hist) ? hist : []).slice(-8).map(x => [x && x[0] === 'k' ? 'k' : 'u', kort(x && x[1], 400)]);
  await kv.raw(['LPUSH', 'mm:kcontact:' + site, JSON.stringify({ t: Date.now(), mail, p: c.url, titel: c.titel, hist: h })]).catch(() => null);
  await kv.raw(['LTRIM', 'mm:kcontact:' + site, '0', '199']).catch(() => null); await kv.raw(['EXPIRE', 'mm:kcontact:' + site, 30 * 86400]).catch(() => null);
  await telReden(kv, site, 'e-mail achtergelaten');
  try { const { mailHenkjan } = await import('./kadoly-nieuws.js');
    const gesprek = h.map(([w, t]) => '<p style="margin:0 0 8px"><b>' + (w === 'k' ? 'Kadoly' : 'Bezoeker') + ':</b> ' + esc(t) + '</p>').join('');
    await mailHenkjan({ subject: 'Kadoly-chat: ' + (c.titel ? 'vraag over ' + c.titel : 'vraag van een bezoeker'), replyTo: mail,
      html: '<div style="font:15px/1.5 system-ui,sans-serif;color:#0f172a"><p>Een bezoeker wil persoonlijk antwoord. Druk op <b>Antwoorden</b>, dan gaat je mail naar <b>' + esc(mail) + '</b>.</p>' + (c.url ? '<p>Pagina: <a href="https://kadoly.com' + esc(c.url) + '">kadoly.com' + esc(c.url) + '</a></p>' : '') + gesprek + '</div>' });
  } catch (e) { return { ok: true, antwoord: 'Dank je! Henkjan van Kadoly mailt je zo snel mogelijk.', fout: String(e.message || e).slice(0, 80) }; }
  return { ok: true, antwoord: 'Dank je! Henkjan van Kadoly mailt je zo snel mogelijk.' };
}

export async function kadolyAntwoord(kv, { vraag, hist, kanaal, ctx, keuze, ip, oidc, test, site = 'kadoly' }) {
  kanaal = kanaal === 'wa' ? 'wa' : 'site'; ctx = ctx && typeof ctx === 'object' ? ctx : {};
  const c = { titel: kort(ctx.titel, 120), prijs: kort(ctx.prijs, 20), levering: kort(ctx.levering, 120), url: kort(ctx.url, 160) };
  if (keuze) { const t = vastAntwoord(String(keuze), c); if (!t) return { ok: false, fout: 'onbekende keuze' }; if (!test) await telReden(kv, site, String(keuze)); return { ok: true, antwoord: t, vast: true }; }
  if (String(vraag || '') === '__wa') { await telReden(kv, site, 'whatsapp'); return { ok: true }; }
  const v = kort(vraag, 600); if (v.length < 2) return { ok: false, fout: 'lege vraag' };
  if (!test) {
  const d = dag(), ih = createHash('sha256').update('kc|' + String(ip || '')).digest('hex').slice(0, 16);
  const totaal = N(await kv.raw(['INCR', 'kc:dag:' + d]).catch(() => 0)); await kv.raw(['EXPIRE', 'kc:dag:' + d, 2 * 86400]).catch(() => null);
  const perIp = N(await kv.raw(['INCR', 'kc:ip:' + ih + ':' + d]).catch(() => 0)); await kv.raw(['EXPIRE', 'kc:ip:' + ih + ':' + d, 2 * 86400]).catch(() => null);
  if (totaal > 1500 || perIp > (kanaal === 'wa' ? 800 : 30)) return { ok: true, antwoord: kanaal === 'wa' ? 'Dank je! Henkjan van Kadoly leest mee en reageert zo snel mogelijk.' : 'Dank je voor je vraag! Stel hem via WhatsApp, dan reageert Henkjan van Kadoly zelf.', limiet: true };
  await telReden(kv, site, kanaal === 'wa' ? 'whatsapp-vraag' : 'eigen vraag');
  await kv.raw(['LPUSH', 'mm:kvragen:' + site, JSON.stringify({ t: Date.now(), k: kanaal, v: v.slice(0, 200), p: c.url })]).catch(() => null);
  await kv.raw(['LTRIM', 'mm:kvragen:' + site, '0', '299']).catch(() => null); await kv.raw(['EXPIRE', 'mm:kvragen:' + site, 30 * 86400]).catch(() => null);
  }
  const h = (Array.isArray(hist) ? hist : []).slice(-6).map(x => (x && x[0] === 'k' ? 'Kadoly: ' : 'Klant: ') + kort(x && x[1], 400)).join('\n');
  const system = 'Je bent de klantenservice van Kadoly en antwoordt een bezoeker ' + (kanaal === 'wa' ? 'op WhatsApp' : 'in de chat op kadoly.com') + '.\n' +
    'Regels: antwoord in de taal van de klant (meestal Nederlands), warm, kort (hoogstens 3 zinnen), je-vorm, geen opsommingstekens. Gebruik ALLEEN de feiten en de productinfo hieronder. ' +
    'Verzin niets: geen kortingen, acties, voorraad, levertijden, maten of beloftes die er niet staan. Noem geen prijs die niet in de productinfo staat. Geen nep-haast. ' +
    'Weet je het antwoord niet, zeg dat eerlijk en ' + (kanaal === 'wa' ? 'zeg dat Henkjan van Kadoly meeleest en het uitzoekt.' : 'nodig uit om de vraag via WhatsApp te stellen, dan zoekt Henkjan van Kadoly het uit.') +
    ' Twijfelt iemand over bestellen, help eerlijk met de feiten; dring niet aan.\n\nFeiten:\n- ' + FEITEN.join('\n- ') +
    (c.titel ? '\n\nProductinfo van de pagina waar de klant is:\n- Product: ' + c.titel + (c.prijs ? '\n- Prijs: ' + c.prijs : '') + (c.levering ? '\n- Bezorging: ' + c.levering : '') : '');
  const user = (h ? 'Gesprek tot nu toe:\n' + h + '\n\n' : '') + 'Nieuwe vraag van de klant: ' + v;
  try {
    const r = await berichten({ fn: 'kadolychat', model: HAIKU, system, user, max: 300, timeout: 20000, oidc: oidc || '', directKey: process.env.ANTHROPIC_API_KEY });
    const t = kort(r.txt, 900); if (!t) throw new Error('leeg');
    return { ok: true, antwoord: t };
  } catch (e) {
    return { ok: true, antwoord: kanaal === 'wa' ? 'Goede vraag! Henkjan van Kadoly leest mee en reageert zo snel mogelijk.' : 'Goede vraag! Stel hem via WhatsApp, dan reageert Henkjan van Kadoly zelf.', fout: String(e.message || e).slice(0, 80) };
  }
}
