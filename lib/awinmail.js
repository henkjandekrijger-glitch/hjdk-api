// Awin-heraanvragen: korte mail per merk met de ene keuzehulp waar het merk op staat (Henkjan 21 nov 2026: "verstuur rustig aan een paar per keer",
// "Mail altijd met de clickmind link ... ik wil weten of ze lezen en klikken"). Verstuurd via Resend (open en klik meetbaar), niet via Gmail.
// Alleen mails waarvan het id in data/awin-zend.json staat gaan weg: dat bestand is de goedkeuring en staat in de repo, dus niemand kan via de URL
// zelf iets laten versturen. Het adres staat alleen in de gemelde mail (kv post:mail:<id>), nooit in de repo.
import { readFileSync } from 'node:fs';
import { kv } from './db.js';
import { maakMeting } from './mailopen.js';
import { uitkomst } from './postlus.js';
import { resendDomeinen } from './terugauto.js';

const lees = () => { try { return JSON.parse(readFileSync(new URL('../data/awin-zend.json', import.meta.url), 'utf8')); } catch (e) { return { mails: [] }; } };
const sleutel = async () => process.env.RESEND_API_KEY || process.env.RESEND || ((await kv.get('hjdk:secrets').catch(() => null)) || {}).RESEND_API_KEY || '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function tekst(merk, link, variant) {
  const zin = 'keuzehulp.best helpt Nederlandse kopers kiezen met een korte keuzehulp en een chat, met de prijzen van vandaag. Geen couponsite, geen cashback, geen bieden op jullie merknaam.';
  const kop = variant === 'b'
    ? [`Beste ${merk}-team,`, '', `Hier staat ${merk} op keuzehulp.best: ${link}`, '', `Wij vroegen deelname aan jullie Awin-programma aan (AdsFair B.V., publisher 3159915).`, '', zin]
    : [`Beste ${merk}-team,`, '', `Wij vroegen deelname aan jullie Awin-programma aan (AdsFair B.V., publisher 3159915). Dit is de pagina waar ${merk} op staat:`, link, '', zin];
  return kop.concat(['', 'Hebben jullie opmerkingen bij de pagina? Antwoord op deze mail of bel of app +31 6 55395630.', '', 'Henkjan de Krijger', 'AdsFair B.V.']).join('\n');
}

async function afzender() {
  if (process.env.AWIN_MAIL_FROM) return process.env.AWIN_MAIL_FROM;
  const d = await resendDomeinen(kv).catch(() => null), ok = new Set(((d && d.domeinen) || []).filter(x => x.status === 'verified').map(x => x.naam));
  for (const dom of ['adsfair.xyz', 'keuzehulp.best']) if (ok.has(dom)) return 'Henkjan de Krijger <henkjan@' + dom + '>';
  return null;
}

// Stuurt hoogstens `max` goedgekeurde mails die nog niet weg zijn. Dubbel versturen kan niet: Resend idempotency-key = mail-id en kv awin:mail:<id>.
export async function stuurAwin(max = 3, droog = false) {
  const key = await sleutel(); if (!key) return { ok: false, fout: 'geen Resend-sleutel' };
  const van = await afzender(); if (!van) return { ok: false, fout: 'geen geverifieerd afzenddomein (adsfair.xyz of keuzehulp.best)' };
  const uit = [];
  for (const g of lees().mails || []) {
    if (uit.filter(x => x.verstuurd).length >= max) break;
    if (!/^[0-9a-f]{12}$/.test(g.id) || await kv.get('awin:mail:' + g.id)) continue;
    const m = await kv.get('post:mail:' + g.id); if (!m || m.project !== 'awin-aanvragen' || !m.aan) { uit.push({ id: g.id, fout: 'niet gemeld' }); continue; }
    // Controle: het merk moet echt op de pagina staan (21 nov 2026: LG stond niet op /tv, Nespresso niet op /koffiezetapparaat). Anders niet versturen.
    const doel = (m.links || [])[0], zoek = String(g.zoek || g.merk);
    const pag = doel ? await fetch(doel, { signal: AbortSignal.timeout(15000) }).then(r => r.ok ? r.text() : '').catch(() => '') : '';
    const zicht = pag.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
    if (!zicht.toLowerCase().includes(zoek.toLowerCase())) { uit.push({ id: g.id, merk: g.merk, fout: zoek + ' staat niet op ' + (doel || 'de pagina') + ': niet verstuurd' }); continue; }
    const pix = (await maakMeting(g.id)).pixel, txt = tekst(g.merk, g.link, m.variant);
    const html = '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111113">' + esc(txt).split('\n').map(r => r ? r.replace(/(https:\/\/keuzehulp\.best\/m\/[a-z0-9]+)/, '<a href="$1">$1</a>') : '').join('<br>') + '</div><img src="' + pix + '" width="1" height="1" alt="" style="display:block;border:0">';
    if (droog) { uit.push({ id: g.id, merk: g.merk, van, onderwerp: m.onderwerp, tekst: txt }); continue; }
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000), headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json', 'idempotency-key': 'awin-' + g.id }, body: JSON.stringify({ from: van, to: [m.aan], reply_to: 'henkjan@adsfair.xyz', subject: m.onderwerp, text: txt, html }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok) { uit.push({ id: g.id, merk: g.merk, fout: 'resend ' + (r ? r.status : 'geen antwoord') + ' ' + String(j.message || '').slice(0, 120) }); continue; }
    await kv.set('awin:mail:' + g.id, { at: new Date().toISOString(), resend: j.id }, { ex: 365 * 86400 });
    await uitkomst({ id: g.id, uitkomst: 'verstuurd' }).catch(() => {});
    uit.push({ id: g.id, merk: g.merk, verstuurd: true });
  }
  return { ok: true, van, uit };
}
