// Dagelijkse AI-update van nexy.help per onderwerp (17 nov 2026, Henkjan: "Zorg dat je kun abonneren op dagelijkse digest dat moet op IEDERE
// keuzehulp" en "iedere dag mailen we een digest op dat onderwerp"). Zelfde motor als lib/zorgmail.js (lib/tsc-mail.js stuur via Resend,
// dubbele opt-in, afmelden met één klik). Onderwerp = de categorie van de pagina waar iemand zich aanmeldde (lib/nexyhelp.js onderwerp).
// Elke dag: de vraag van de dag uit dat onderwerp en de tool van de dag met prijs en gratis deel zoals gecontroleerd (met datum).
// Wie zich aanmeldt staat ook op de Nexy-lijst (nexy:wacht), en dat staat zo in het aanmeldvak.
// Tellers nexy:d:<dag> (toon_<plek>, aanvraag_<plek>, bevestigd, verstuurd, af). Plek = blok (in de pagina) of modal (venster).
import { createHash, randomBytes } from 'node:crypto';
import { kv } from './db.js';
import { stuur } from './tsc-mail.js';

const FROM = 'nexy.help <ai@todayin.email>';
const API = 'https://nexy.help/api/keuze-tools?tool=nexy';
const hash = s => createHash('sha256').update(String(s)).digest('hex');
const token = () => randomBytes(24).toString('hex');
const okTok = t => /^[a-f0-9]{48}$/.test(t || '');
const dag = () => new Date().toISOString().slice(0, 10);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const okMail = e => /^[^\s@<>()[\],;:"]{1,64}@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}$/i.test(e) && e.length <= 254;
export async function tel(wat, n = 1) { try { const k = 'nexy:d:' + dag(); await kv.raw(['HINCRBY', k, String(wat).replace(/[^a-z_]/g, '').slice(0, 30), String(n)]); await kv.raw(['EXPIRE', k, String(120 * 86400)]); } catch (e) {} }

const knop = (href, t) => `<a href="${esc(href)}" style="display:inline-block;background:#2B47C4;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:999px">${esc(t)}</a>`;
function schil(voorkop, inhoud, voet) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#fff"><span style="display:none;max-height:0;overflow:hidden">${esc(voorkop)}</span><div style="max-width:560px;margin:0 auto;padding:28px 20px;font:17px/1.55 Inter,-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#111113"><p style="margin:0 0 22px;font-weight:700;font-size:18px">nexy<span style="color:#2B47C4">.help</span></p>${inhoud}<div style="border-top:1px solid #E5E7EB;margin-top:28px;padding-top:16px;font-size:13px;color:#555">${voet}<br><br>nexy.help · AdsFair B.V. · Albert Plesmanplein 20, 2805 AB Gouda, the Netherlands</div></div></body></html>`;
}
const alsTekst = html => html.replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, '$2 ($1)').replace(/<span style="display:none[^>]*>[\s\S]*?<\/span>/, '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const metBron = u => u + (u.includes('?') ? '&' : '?') + 'utm_source=email&utm_medium=owned&utm_campaign=digest';

export async function digestMail(a, d = dag()) {
  const N = await import('./nexyhelp.js'); const x = N.digestDeel(a.pad, d); const af = API + '&op=af&t=' + a.af;
  const inhoud = `<h1 style="font-size:24px;line-height:1.25;margin:0 0 16px">${esc(x.naam)}: today</h1>`
    + (x.vraag ? `<p style="margin:0 0 4px;font-weight:600">Question of the day: ${esc(x.vraag.q)}</p><p style="margin:0 0 20px">${esc(x.vraag.a)}</p>` : '')
    + (x.tool ? `<div style="background:#EEF1FC;border-radius:14px;padding:14px 16px;margin:0 0 20px"><p style="margin:0 0 4px;font-weight:600">Tool of the day: ${esc(x.tool.naam)}${x.tool.maker ? ' (' + esc(x.tool.maker) + ')' : ''}</p><p style="margin:0 0 4px">${esc(x.tool.bestVoor)}</p><p style="margin:0 0 4px"><b>${esc(x.tool.prijs)}</b>${x.tool.gratis ? '. Free: ' + esc(x.tool.gratis) : ''}</p><p style="margin:0;font-size:14px;color:#6B7280">Checked on the maker's site${x.tool.datum ? ' on ' + esc(x.tool.datum) : ''}. <a href="${esc(metBron(x.tool.url))}" style="color:#2B47C4">Details and sources</a></p></div>` : '')
    + `<p style="margin:0 0 10px">${knop(metBron(x.url), 'See all ' + x.naam.toLowerCase() + ' compared')}</p>`;
  const voet = `You get this because you signed up on nexy.help and confirmed your address: one short email a day about ${esc(x.naam.toLowerCase())}. <a href="${esc(af)}" style="color:#555">Unsubscribe in one click</a>`;
  const html = schil(x.vraag ? x.vraag.q : x.naam, inhoud, voet);
  return { from: FROM, subject: x.naam + ': ' + (x.vraag ? x.vraag.q : 'today'), html, text: alsTekst(html), headers: { 'List-Unsubscribe': '<' + af + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } };
}

export async function aanmelden(b, ip) {
  const email = String(b.email || '').trim().toLowerCase(); if (!okMail(email)) return { ok: false, fout: 'email' };
  if (b.website) return { ok: true }; // honeypot
  const rk = 'nexy:rl:' + hash(ip + ':' + Math.floor(Date.now() / 60000)).slice(0, 24), n = await kv.incr(rk); if (n === 1) await kv.raw(['EXPIRE', rk, '120']); if (n > 5) return { ok: false, fout: 'druk' };
  const dn = await kv.incr('nexy:bevdag:' + dag()); if (dn === 1) await kv.raw(['EXPIRE', 'nexy:bevdag:' + dag(), '172800']); if (dn > 500) return { ok: false, fout: 'druk' };
  const pad = String(b.pad || '/').replace(/[^a-z0-9/-]/gi, '').slice(0, 120) || '/', plek = b.plek === 'modal' ? 'modal' : 'blok', v = /^[a-z0-9]{1,4}$/.test(String(b.v || '')) ? String(b.v) : '';
  const id = hash('nexy:' + email).slice(0, 32), bev = token();
  await kv.set('nexy:wacht:' + id, { email, pad, at: Date.now() }); await kv.raw(['SADD', 'nexy:wacht', id]);
  await kv.set('nexy:pend:' + hash(bev), { id, email, pad, plek, v, at: Date.now() }, { ex: 259200 });
  const N = await import('./nexyhelp.js'); const c = N.onderwerp(pad);
  const inhoud = `<h1 style="font-size:24px;margin:0 0 14px">Confirm your daily AI update</h1><p>Click the button and you get one short email a day about ${esc(c.naam.toLowerCase())}: the question of the day and a tool of the day with its price, checked on the maker's site. We also tell you once when Nexy opens.</p><p style="margin:22px 0">${knop(API + '&op=bevestig&t=' + bev, 'Yes, send me the daily update')}</p><p style="font-size:15px;color:#555">Did not ask for this? Ignore this email and we will not write again.</p>`;
  const html = schil('Confirm your daily AI update', inhoud, 'AdsFair B.V.');
  try { await stuur([{ from: FROM, to: [email], subject: 'Confirm: your daily AI update', html, text: alsTekst(html) }], 'nexy-bev-' + hash(bev).slice(0, 32)); }
  catch (e) { await tel('bevestigmail_fout'); return { ok: false, fout: 'mail_tijdelijk' }; }
  await tel('aanvraag_' + plek); if (v) await tel('aanvraag_v' + v);
  return { ok: true };
}
export async function bevestig(t) {
  if (!okTok(t)) return null; const p = await kv.get('nexy:pend:' + hash(t)); if (!p) return null;
  const oud = await kv.get('nexy:abo:' + p.id);
  if (oud && oud.actief && p.klaar) return { ...oud, al: true };
  const a = { ...(oud || {}), ...p, actief: true, bevestigd: oud?.bevestigd || Date.now(), af: oud?.af || token() }; delete a.klaar;
  await kv.set('nexy:abo:' + p.id, a); await kv.set('nexy:af:' + hash(a.af), p.id); await kv.raw(['SADD', 'nexy:abos', p.id]); await kv.set('nexy:pend:' + hash(t), { ...p, klaar: Date.now() }, { ex: 259200 });
  if (!oud?.bevestigd) { await tel('bevestigd'); await tel('bevestigd_' + (p.plek || 'blok')); if (p.v) await tel('bevestigd_v' + p.v); }
  try { await bezorg(a); } catch (e) { await tel('mailfout'); }
  return a;
}
export async function afmelden(t) {
  if (!okTok(t)) return null; const id = await kv.get('nexy:af:' + hash(t)); if (!id) return null;
  const a = await kv.get('nexy:abo:' + id); if (!a) return null;
  await kv.set('nexy:abo:' + id, { ...a, actief: false, afAt: Date.now() }); await kv.raw(['SREM', 'nexy:abos', id]); await tel('af'); return a;
}
async function bezorg(a, d = dag()) {
  const lock = 'nexy:lock:' + a.id; if (!await kv.raw(['SET', lock, '1', 'NX', 'EX', '300'])) return false;
  try {
    const vers = await kv.get('nexy:abo:' + a.id); if (!vers?.actief || vers.laatst === d) return false;
    await stuur([{ to: [vers.email], ...(await digestMail(vers, d)) }], 'nexy-' + vers.id + '-' + d);
    await kv.set('nexy:abo:' + a.id, { ...vers, laatst: d }); await tel('verstuurd'); return true;
  } finally { await kv.raw(['DEL', lock]).catch(() => null); }
}
export async function ronde({ droog = false } = {}) {
  const ids = (await kv.raw(['SMEMBERS', 'nexy:abos'])) || [], d = dag(), out = { dag: d, abonnees: ids.length, mail: 0, fouten: [], droog };
  for (const id of ids) {
    try { const a = await kv.get('nexy:abo:' + id); if (!a?.actief || a.laatst === d) continue; if (droog) { out.mail++; continue; } if (await bezorg(a, d)) out.mail++; }
    catch (e) { out.fouten.push(String(e.message || e).slice(0, 80)); }
  }
  if (!droog) await kv.set('nexy:ronde', { ...out, at: new Date().toISOString() });
  return out;
}
export async function stand() {
  const ids = (await kv.raw(['SMEMBERS', 'nexy:abos']).catch(() => [])) || [], dagen = [];
  for (let i = 0; i < 14; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); const r = await kv.raw(['HGETALL', 'nexy:d:' + d]).catch(() => []); const o = Array.isArray(r) ? Object.fromEntries(Array.from({ length: r.length / 2 }, (_, j) => [r[j * 2], Number(r[j * 2 + 1])])) : (r || {}); if (Object.keys(o).length) dagen.push({ dag: d, ...o }); }
  return { abonnees: ids.length, ronde: await kv.get('nexy:ronde').catch(() => null), dagen };
}

// Aanmeldvak in de pagina en hetzelfde vak als venster (modal), lerend: twee teksten per plek, de bezoeker krijgt er één (vaste helft per
// browser), getoond en aangemeld worden per variant geteld. Het venster komt na 20 s, bij 50% scrollen of bij weggaan, hooguit eens per dag.
const VAR = {
  a: { t: 'Get a daily AI update on {o}', d: 'One short email a day: the question of the day and one tool with its price, checked on the maker’s site. Plus one email when Nexy opens.', b: 'Send me the update' },
  b: { t: 'Still choosing an AI for {o}?', d: 'Every morning one question answered and one tool checked, with price and free plan. Unsubscribe in one click.', b: 'Yes, every day' },
};
export function vak(pad, onderwerpNaam) {
  const o = String(onderwerpNaam || 'AI').toLowerCase();
  const v = Object.fromEntries(Object.entries(VAR).map(([k, x]) => [k, { t: x.t.replace('{o}', o), d: x.d, b: x.b }]));
  return `<style>.nw{border:1px solid var(--line);border-radius:16px;padding:20px 22px;margin:24px 0;background:var(--bg)}.nw h2{font-size:20px;margin:0 0 4px}.nw p{margin:0}.nwr{display:grid;grid-template-columns:1fr auto;gap:10px;margin:14px 0 10px}.nwr input{min-width:0;min-height:48px;border:1px solid var(--line2);border-radius:999px;padding:10px 18px;font:inherit;font-size:16px;background:var(--bg);color:var(--ink)}.nwr button{min-height:48px;border:0;border-radius:999px;background:var(--acc);color:#fff;font:inherit;font-weight:600;font-size:16px;padding:10px 22px;cursor:pointer;white-space:nowrap}@media (max-width:560px){.nwr{grid-template-columns:1fr}}#nwo{position:fixed;inset:0;z-index:2147483000;background:rgba(17,17,19,.45);display:none;align-items:flex-end;justify-content:center}#nwo .nw{margin:0;width:100%;max-width:520px;position:relative;border-radius:16px 16px 0 0}@media (min-width:640px){#nwo{align-items:center}#nwo .nw{border-radius:16px}}#nwo .x{position:absolute;top:8px;right:10px;border:0;background:transparent;font-size:28px;line-height:1;color:var(--muted);cursor:pointer;padding:6px}</style>`
    + `<div id="nwplek"></div><script>(function(){var V=${JSON.stringify(v)},P=${JSON.stringify(String(pad || '/'))},k="b";try{k=localStorage.getItem("nwv")||(Math.random()<.5?"a":"b");localStorage.setItem("nwv",k)}catch(e){}var x=V[k]||V.a,bot=/bot|crawl|spider|preview|headless/i.test(navigator.userAgent)||navigator.webdriver;`
    + `function tel(w){if(bot)return;try{navigator.sendBeacon("/api/keuze-tools?tool=nexy&op=tel",new Blob([JSON.stringify({w:w,v:k})],{type:"text/plain"}))}catch(e){}}`
    + `function maak(plek){var s=document.createElement("section");s.className="nw";s.innerHTML='<h2></h2><p class="klein"></p><form novalidate><div class="nwr"><input type="email" required autocomplete="email" inputmode="email" placeholder="Your email" aria-label="Your email"><button type="submit"></button></div><input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><p class="klein" role="status">You first get an email to confirm. Unsubscribe in one click.</p></form>';s.querySelector("h2").textContent=x.t;s.querySelector("p").textContent=x.d;s.querySelector("button[type=submit]").textContent=x.b;var f=s.querySelector("form");`
    + `f.addEventListener("submit",function(e){e.preventDefault();var u=f.querySelector("[role=status]"),m=f.querySelector("input[type=email]").value.trim();if(!/^\\S+@\\S+\\.\\S+$/.test(m)){u.textContent="Please enter a valid email.";return}u.textContent="One moment...";fetch("/api/keuze-tools?tool=nexy&op=aanmelden",{method:"POST",headers:{"content-type":"text/plain"},body:JSON.stringify({email:m,pad:P,plek:plek,v:k,website:f.website.value})}).then(function(r){return r.json()}).then(function(j){if(j&&j.ok){f.innerHTML="<p><strong>Check your inbox.</strong> Click the button in the email to start the daily update.</p>";try{localStorage.setItem("nwdone","1")}catch(e){}}else u.textContent=j&&j.fout==="druk"?"It is busy, please try again in a minute.":"That did not work. Please try again."}).catch(function(){u.textContent="That did not work. Please try again."})});return s}`
    + `var blok=maak("blok"),pl=document.getElementById("nwplek");pl.replaceWith(blok);var gz=0;if(window.IntersectionObserver)new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting&&!gz){gz=1;tel("toon_blok")}})},{threshold:.4}).observe(blok);`
    + `var ov=document.createElement("div");ov.id="nwo";ov.setAttribute("role","dialog");ov.setAttribute("aria-modal","true");var mb=maak("modal"),xb=document.createElement("button");xb.type="button";xb.className="x";xb.setAttribute("aria-label","Close");xb.textContent="\\u00d7";mb.prepend(xb);ov.appendChild(mb);document.body.appendChild(ov);var open=0;function dicht(){ov.style.display="none";open=0}xb.onclick=dicht;ov.addEventListener("click",function(e){if(e.target===ov)dicht()});document.addEventListener("keydown",function(e){if(e.key==="Escape"&&open)dicht()});`
    + `function toon(f){if(open||bot)return;var t=0,klaar=0;try{t=Number(localStorage.getItem("nwmt"))||0;klaar=localStorage.getItem("nwdone")}catch(e){}if(!f&&(klaar||Date.now()-t<864e5))return;var a=document.activeElement;if(!f&&a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))return;open=1;ov.style.display="flex";try{localStorage.setItem("nwmt",String(Date.now()))}catch(e){}tel("toon_modal")}`
    + `window.__cuOpen=function(){toon(1)};setTimeout(function(){toon(0)},20000);addEventListener("scroll",function(){if((scrollY+innerHeight)/Math.max(1,document.documentElement.scrollHeight)>.5)toon(0)},{passive:true});document.addEventListener("mouseout",function(e){if(!e.relatedTarget&&e.clientY<=0)toon(0)})})()</script>`;
}
