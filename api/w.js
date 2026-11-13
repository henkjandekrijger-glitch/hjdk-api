// Verlanglijst voor alles, gids.kadoly.com/w (Henkjan 13 nov 2026: "Dan kunnen we beste verlanglijst super maken en daar ALLES in doen ... De cadeau zoeker" en "We gaan ze alle drie bouwen ik wil maandag live maak inderdaad taal agnostisch").
// Fase 1: lijst zonder account, link uit elke winkel (AI vult aan), delen, stiekem afvinken, lootjes, Kadoly-tips, bol-partnerlinks.
// Fase 2: foto/screenshot, smaaktest, roddelbox + gedicht, prijsvergelijk op EAN, herinnering via Resend.
// Fase 3: samen geven (toezeggingen + eigen betaalverzoek van wie start; wij komen niet aan geld), prijsalarm, cadeauzoeker over alle bronnen, vijf talen.
// Elke stap wordt geteld (c:wl:<dag>:<stap>); ?op=stand toont de tellers.
import crypto from 'node:crypto';
import { kv } from '../lib/db.js';
import { T, kiesTaal, tt, geld, GELEGENHEID } from '../lib/lijst/taal.js';
import * as D from '../lib/lijst/data.js';
import { haalLink, koopUrl, zoekUrl, catalogus, kdKaart, schoon, vergelijkBronnen, BRONNAAM } from '../lib/lijst/haal.js';
import * as S from '../lib/lijst/slim.js';
import { schil, APP_JS, esc, mailHtml, mailTekst } from '../lib/lijst/pagina.js';

const ADRES = 'https://gids.kadoly.com';
const BASIS = '/w';
const kort = D.kort;
const num = v => { const n = Number(String(v == null ? '' : v).replace(/[^\d.,]/g, '').replace(/,(\d{1,2})$/, '.$1').replace(/,/g, '')); return Number.isFinite(n) && n > 0 && n < 100000 ? Math.round(n * 100) / 100 : null; };
const datum = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : null;
const druk = { ok: false, fout: 'druk' };

async function mailSleutel() { if (process.env.RESEND_API_KEY || process.env.RESEND) return process.env.RESEND_API_KEY || process.env.RESEND; try { return ((await kv.get('hjdk:secrets')) || {}).RESEND_API_KEY || ''; } catch (e) { return ''; } }
async function stuur({ aan, taal, kop, tekst, knop, href, extra, onderwerp, idem }) {
  if (await D.afgemeld(aan)) return { ok: false, fout: 'afgemeld' };
  const key = await mailSleutel(); if (!key) return { ok: false, fout: 'fout' };
  const afUrl = ADRES + BASIS + '/af?t=' + await D.mailToken(aan) + '&taal=' + taal;
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(12000),
    headers: Object.assign({ authorization: 'Bearer ' + key, 'content-type': 'application/json' }, idem ? { 'idempotency-key': idem } : {}),
    body: JSON.stringify({ from: process.env.WL_FROM || 'Kadoly <lijst@post.kadoly.com>', to: [aan], subject: onderwerp || kop, html: mailHtml({ taal, kop, tekst, knop, href, extra, afUrl }), text: mailTekst({ taal, kop, tekst, knop, href, afUrl }),
      headers: { 'List-Unsubscribe': '<' + afUrl + '>' } }) });
  const j = await r.json().catch(() => ({})); if (!r.ok) console.log('wl mail', r.status, String(j.message || '').slice(0, 120));
  return { ok: r.ok };
}

const itemUit = i => ({ i: i.i, t: i.t, p: i.p || null, m: i.m || 'EUR', img: i.img || null, w: i.w || null, n: i.n || null, f: i.f ? 1 : 0, u: i.u ? 1 : 0, ean: i.ean || null, kd: i.kd || null, zoek: i.zoek || null });
const claimsUit = c => { const o = {}; for (const k in c) o[k] = { pid: c[k].pid, naam: c[k].naam || '', pot: c[k].pot ? 1 : 0 }; return o; };
const pottenUit = p => { const o = {}; for (const k in p) { const x = p[k]; let host = ''; try { host = new URL(x.link).hostname.replace(/^www\./, ''); } catch (e) {} o[k] = { naam: x.naam, link: x.link || null, host, doel: x.doel, munt: x.munt || 'EUR', som: (x.mee || []).reduce((a, b) => a + (Number(b.bedrag) || 0), 0), n: (x.mee || []).length }; } return o; };

// lootjes trekken: niemand trekt zichzelf of zijn uitzondering
function trek(leden) {
  const ms = leden.map(x => x.m);
  for (let p = 0; p < 4000; p++) {
    const sh = ms.slice(); for (let i = sh.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [sh[i], sh[j]] = [sh[j], sh[i]]; }
    let ok = true; const t = {};
    for (let i = 0; i < ms.length; i++) { if (ms[i] === sh[i] || (leden[i].niet || []).includes(sh[i])) { ok = false; break; } t[ms[i]] = sh[i]; }
    if (ok) return t;
  }
  return null;
}
const lidSleutel = (s, id) => D.hash('wl-lid:' + s + ':' + id).slice(0, 24); // vaste bewerksleutel voor de eigen lijst van een lootjeslid

async function api(b, ctx) {
  const op = String(b.op || ''); const ip = ctx.ip; const taal = T[b.taal] ? b.taal : ctx.taal;
  // dagplafond voor alle bezoekers samen (Haiku ~ $0,003 per vraag, Sonnet-gedicht ~ $0,01): hoogstens 1500 AI-vragen en 200 gedichten per dag
  if (['foto', 'smaak', 'zoek', 'gedicht'].includes(op) && !await D.mag('alle', op === 'gedicht' ? 'ged-totaal' : 'ai-totaal', op === 'gedicht' ? 200 : 1500)) return druk;
  const eigen = async () => { const l = await D.leesLijst(b.l); return D.isEigenaar(l, b.k) ? l : null; };

  if (op === 'maak') {
    if (!await D.mag(ip, 'maak', 30)) return druk;
    const naam = kort(b.naam, 40); if (!naam) return { ok: false, fout: 'fout' };
    const k = D.rid(20); const l = { id: D.rid(8), naam, gel: GELEGENHEID.includes(b.gel) ? b.gel : 'anders', datum: datum(b.datum), taal, ek: D.hash(k), items: [], t: Date.now() };
    await D.bewaarLijst(l); await D.tel('lijst_maak', taal); return { ok: true, id: l.id, k };
  }
  if (op === 'lees') {
    const l = await D.leesLijst(b.l); if (!l) return { ok: false, fout: 'fout' };
    if (D.isEigenaar(l, b.k)) { await D.tel('eigen'); return { ok: true, eigen: true, lijst: D.openbaar(l) }; }
    const [c, p] = await Promise.all([D.leesClaims(l.id), D.leesPotten(l.id)]); await D.tel('gast', taal);
    return { ok: true, eigen: false, lijst: D.openbaar(l), claims: claimsUit(c), potten: pottenUit(p) };
  }
  if (op === 'toe') {
    const l = await eigen(); if (!l) return { ok: false, fout: 'fout' }; l.items = l.items || []; if (l.items.length >= 150) return { ok: false, fout: 'fout' };
    const tekst = kort(b.tekst, 2000); if (!tekst) return { ok: false, fout: 'fout' }; const u = schoon(tekst); let it;
    if (u) { if (!await D.mag(ip, 'link', 200)) return druk; it = await haalLink(u.href, { taal: l.taal, ai: await D.mag(ip, 'ai', 80) }); if (!it) return { ok: false, fout: 'fout' }; await D.tel(it.half ? 'item_half' : 'item_link', it.w); }
    else { it = { t: kort(tekst, 120), zoek: kort(tekst, 120) }; await D.tel('item_tekst'); }
    const item = { i: D.rid(6), t: kort(it.t, 140), p: it.p || null, m: it.m || 'EUR', img: it.img || null, w: it.w || null, u: it.u || null, b: it.b || null, ean: it.ean || null, kd: it.kd || null, zoek: it.zoek || (it.half ? kort(it.t, 120) : null), add: Date.now() };
    l.items.unshift(item); await D.bewaarLijst(l); return { ok: true, item: itemUit(item), half: !!it.half };
  }
  if (op === 'foto') {
    const l = await eigen(); if (!l) return { ok: false, fout: 'fout' }; if (!await D.mag(ip, 'ai', 80)) return druk;
    const b64 = String(b.b64 || ''); if (b64.length < 200 || b64.length > 3500000 || !/^[A-Za-z0-9+/=]+$/.test(b64.slice(0, 400))) return { ok: false, fout: 'fout' };
    const mime = /^image\/(jpeg|png|webp)$/.test(b.mime) ? b.mime : 'image/jpeg';
    let r; try { r = await S.fotoHerken(b64, mime, taal); } catch (e) { console.log('wl foto', e.message); return { ok: false, fout: 'fout' }; }
    if (!r.titel || r.zeker < 0.25) { await D.tel('item_foto', 'niet'); return { ok: false, fout: 'foto_niet' }; }
    let img = null;
    if (process.env.BLOB_READ_WRITE_TOKEN) { try { const { put } = await import('@vercel/blob'); const x = await put('wl/' + l.id + '/' + D.rid(8) + '.jpg', Buffer.from(b64, 'base64'), { access: 'public', contentType: mime, addRandomSuffix: true }); img = x.url; } catch (e) { console.log('wl blob', e.message); } }
    const item = { i: D.rid(6), t: kort(r.titel, 140), p: null, m: 'EUR', img, w: null, u: null, b: r.merk, ean: null, kd: null, zoek: kort(r.zoek, 120), add: Date.now(), foto: 1 };
    l.items = l.items || []; l.items.unshift(item); await D.bewaarLijst(l); await D.tel('item_foto'); return { ok: true, item: itemUit(item) };
  }
  if (op === 'wijzig') {
    const l = await eigen(); if (!l) return { ok: false, fout: 'fout' }; const it = (l.items || []).find(x => x.i === b.i); if (!it) return { ok: false, fout: 'fout' };
    if (b.t != null && kort(b.t, 140)) it.t = kort(b.t, 140); if (b.p != null) it.p = num(b.p); if (b.n != null) it.n = kort(b.n, 200) || null; if (b.f != null) it.f = b.f ? 1 : 0;
    await D.bewaarLijst(l); return { ok: true, item: itemUit(it) };
  }
  if (op === 'weg') { const l = await eigen(); if (!l) return { ok: false, fout: 'fout' }; l.items = (l.items || []).filter(x => x.i !== b.i); await D.bewaarLijst(l); return { ok: true }; }
  if (op === 'lijst') {
    const l = await eigen(); if (!l) return { ok: false, fout: 'fout' };
    if (kort(b.naam, 40)) l.naam = kort(b.naam, 40); if (GELEGENHEID.includes(b.gel)) l.gel = b.gel; if (b.datum !== undefined) l.datum = datum(b.datum);
    await D.bewaarLijst(l); return { ok: true };
  }
  if (op === 'claim' || op === 'pot') {
    if (!await D.mag(ip, 'claim', 120)) return druk;
    const l = await D.leesLijst(b.l); const it = l && (l.items || []).find(x => x.i === b.i); if (!it) return { ok: false, fout: 'fout' };
    const c = await D.leesClaims(l.id); if (c[it.i]) return { ok: false, fout: 'gekozen_x', claim: claimsUit({ x: c[it.i] }).x };
    const geheim = D.rid(14), pid = D.rid(6); const naam = kort(b.naam, 40);
    if (op === 'pot') {
      const doel = num(b.doel) || it.p; const link = schoon(b.link); if (!doel || !naam) return { ok: false, fout: 'fout' };
      const p = await D.leesPotten(l.id); p[it.i] = { naam, link: link && link.protocol === 'https:' ? link.href : null, doel, munt: it.m || 'EUR', mee: [], t: Date.now() };
      c[it.i] = { pid, ch: D.hash(geheim), naam, pot: 1, t: Date.now() }; await Promise.all([D.bewaarClaims(l.id, c), D.bewaarPotten(l.id, p)]); await D.tel('pot_start');
      return { ok: true, pid, c: geheim, pot: pottenUit({ x: p[it.i] }).x };
    }
    c[it.i] = { pid, ch: D.hash(geheim), naam, t: Date.now() }; await D.bewaarClaims(l.id, c); await D.tel('claim', taal);
    return { ok: true, pid, c: geheim };
  }
  if (op === 'unclaim') {
    const c = await D.leesClaims(b.l); const x = c[b.i]; if (!x || x.ch !== D.hash(b.c)) return { ok: false, fout: 'fout' };
    delete c[b.i]; await D.bewaarClaims(b.l, c); if (x.pot) { const p = await D.leesPotten(b.l); delete p[b.i]; await D.bewaarPotten(b.l, p); }
    await D.tel('unclaim'); return { ok: true };
  }
  if (op === 'potmee') {
    if (!await D.mag(ip, 'claim', 120)) return druk;
    const p = await D.leesPotten(b.l); const x = p[b.i]; const bedrag = num(b.bedrag); if (!x || !bedrag) return { ok: false, fout: 'fout' };
    x.mee = (x.mee || []).concat({ naam: kort(b.naam, 40), bedrag, t: Date.now() }).slice(-60); await D.bewaarPotten(b.l, p); await D.tel('pot_mee');
    return { ok: true, pot: pottenUit({ x }).x };
  }
  if (op === 'alarm') {
    if (!D.geldigeMail(b.mail) || !await D.mag(ip, 'mail', 20)) return { ok: false, fout: 'fout' };
    const l = await D.leesLijst(b.l); const it = l && (l.items || []).find(x => x.i === b.i); if (!it || !it.u || !it.p) return { ok: false, fout: 'fout' };
    const k = 'wl:a:' + l.id + ':' + it.i; const a = (await kv.get(k)) || { p0: it.p, m: it.m || 'EUR', mails: [] };
    const mail = String(b.mail).trim().toLowerCase(); if (!a.mails.some(x => x.mail === mail)) a.mails.push({ mail, taal }); a.mails = a.mails.slice(-30);
    await kv.set(k, a, { ex: 180 * 86400 }); await kv.raw(['SADD', 'wl:alarmen', l.id + ':' + it.i]); await D.tel('alarm'); return { ok: true };
  }
  if (op === 'herinner') {
    if (!D.geldigeMail(b.mail) || !await D.mag(ip, 'mail', 20)) return { ok: false, fout: 'fout' };
    const l = await D.leesLijst(b.l); if (!l || !l.datum) return { ok: false, fout: 'fout' };
    const dg = new Date(l.datum + 'T12:00:00Z'); const nu = new Date(D.dagNL() + 'T12:00:00Z'); const dagen = Math.round((dg - nu) / 86400000); if (dagen <= 7) return { ok: false, fout: 'fout' };
    const wanneer = new Date(dg.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    await kv.raw(['RPUSH', 'wl:h:' + wanneer, JSON.stringify({ mail: String(b.mail).trim().toLowerCase(), l: l.id, taal })]); await kv.raw(['EXPIRE', 'wl:h:' + wanneer, String(40 * 86400)]);
    await D.tel('herinner'); return { ok: true };
  }
  if (op === 'mailmij') {
    const l = await eigen(); if (!l || !D.geldigeMail(b.mail)) return { ok: false, fout: 'fout' }; if (!await D.mag(ip, 'mail', 20)) return druk;
    const deel = ADRES + BASIS + '/' + l.id;
    const r = await stuur({ aan: String(b.mail).trim(), taal, kop: tt(taal, 'm_link_ond'), tekst: tt(taal, 'm_link_tekst'), knop: tt(taal, 'm_link_knop'), href: deel + '#k=' + b.k,
      extra: `<p style="margin:0 0 6px">${esc(tt(taal, 'm_deel'))}</p><p style="margin:0"><a href="${esc(deel)}" style="color:#2B47C4">${esc(deel)}</a></p>` });
    await D.tel('mailmij'); return r.ok ? { ok: true } : { ok: false, fout: 'fout' };
  }
  if (op === 'smaak') {
    const l = await eigen(); if (!l) return { ok: false, fout: 'fout' }; if (!await D.mag(ip, 'ai', 80)) return druk;
    const keuzes = (Array.isArray(b.keuzes) ? b.keuzes : []).slice(0, 8).map((x, i) => tt(l.taal, 's' + (i + 1) + (x ? 'b' : 'a')));
    if (keuzes.length < 8) return { ok: false, fout: 'fout' };
    const s = await S.smaakProfiel({ naam: l.naam, keuzes, items: (l.items || []).slice(0, 25).map(x => x.t), taal: l.taal });
    l.smaak = Object.assign(s, { keuzes: b.keuzes.slice(0, 8).map(x => x ? 1 : 0) }); l.kd = null; await D.bewaarLijst(l); await D.tel('smaak');
    return { ok: true, smaak: { tekst: s.tekst, richtingen: s.richtingen } };
  }
  if (op === 'tips') {
    const l = await D.leesLijst(b.l); if (!l || !(l.items || []).length) return { ok: true, per: {}, tips: [] };
    const sig = D.hash('v2:' + (l.items || []).map(x => x.i).join(',') + ':' + (l.smaak ? l.smaak.tekst : '')).slice(0, 12);
    l.kd = l.kd || {}; let x = l.kd[taal];
    if (!x || x.sig !== sig || Date.now() - x.t > 86400000) {
      if (!await D.mag(ip, 'ai', 80) || !await D.mag('alle', 'ai-totaal', 1500)) return { ok: true, per: {}, tips: [] };
      try { x = Object.assign(await S.kadolyTips({ items: l.items.slice(0, 20), smaak: l.smaak && l.smaak.tekst, taal }), { sig, t: Date.now() }); } catch (e) { console.log('wl tips', e.message); return { ok: true, per: {}, tips: [] }; }
      l.kd[taal] = x; await kv.set('wl:l:' + l.id, l, { ex: D.TTL });
    }
    const cat = await catalogus(); const per = {}; const byId = {}; cat.forEach(i => { byId[i.id] = i; });
    for (const i in (x.per || {})) { const pid = typeof x.per[i] === 'string' ? x.per[i] : x.per[i] && x.per[i].id; if (byId[pid]) per[i] = kdKaart(byId[pid]); }
    const tips = (x.tips || []).filter(y => byId[y.id]).map(y => Object.assign(kdKaart(byId[y.id]), { titel: y.titel }));
    await D.tel('tips'); return { ok: true, per, tips };
  }
  // ---- lootjes ----
  if (op === 'groep') {
    if (!await D.mag(ip, 'groep', 20)) return druk;
    const zelf = !!b.zelf; const leden = zelf ? [] : (Array.isArray(b.leden) ? b.leden : []).map(x => ({ naam: kort(x && x.naam, 40), niet: x && x.niet })).filter(x => x.naam).slice(0, 80);
    if (!zelf && leden.length < 3) return { ok: false, fout: 'lt_min' };
    const ak = D.rid(20);
    const g = { gid: D.rid(8), naam: kort(b.naam, 60) || tt(taal, 'lt_h1'), datum: datum(b.datum), budget: num(b.budget), gel: b.gel === 'sint' ? 'sint' : (b.gel === 'kerst' ? 'kerst' : 'anders'), taal, ak: D.hash(ak), jk: D.rid(10), zelf, leden: [], trek: null, roddel: {}, t: Date.now() };
    leden.forEach(x => { const s = D.rid(16); g.leden.push({ m: D.rid(6), naam: x.naam, s, sh: D.hash(s), niet: [], lijst: null, open: null }); });
    leden.forEach((x, i) => { const n = Number(x.niet); if (x.niet != null && Number.isInteger(n) && n >= 0 && n < leden.length && n !== i) g.leden[i].niet = [g.leden[n].m]; });
    if (!zelf) { const t = trek(g.leden); if (!t) return { ok: false, fout: 'lt_kan_niet' }; g.trek = t; g.getrokken = Date.now(); }
    await D.bewaarGroep(g); await D.tel('groep_maak', zelf ? 'zelf' : 'namen'); return { ok: true, gid: g.gid, ak };
  }
  if (op === 'groeplees' || op === 'trek') {
    const g = await D.leesGroep(b.g); if (!g || g.ak !== D.hash(b.ak)) return { ok: false, fout: 'fout' };
    if (op === 'trek') {
      if (g.leden.length < 3) return { ok: false, fout: 'lt_min' }; if (g.trek && g.leden.some(x => x.open)) return { ok: false, fout: 'lt_al_getrokken' };
      const t = trek(g.leden); if (!t) return { ok: false, fout: 'lt_kan_niet' }; g.trek = t; g.getrokken = Date.now(); await D.bewaarGroep(g); await D.tel('trek'); return { ok: true };
    }
    const links = {}; g.leden.forEach(x => { if (x.s) links[x.m] = x.s; });
    return { ok: true, jk: g.jk, links, groep: { naam: g.naam, datum: g.datum, budget: g.budget, gel: g.gel, zelf: !!g.zelf, getrokken: !!g.trek, leden: g.leden.map(x => ({ m: x.m, naam: x.naam, open: !!x.open, lijst: !!x.lijst })) } };
  }
  if (op === 'aanmeld') {
    if (!await D.mag(ip, 'groep', 40)) return druk;
    const g = await D.leesGroep(b.g); if (!g || g.jk !== String(b.j || '')) return { ok: false, fout: 'fout' }; if (g.trek) return { ok: false, fout: 'lt_al_getrokken' };
    const naam = kort(b.naam, 40); if (!naam || g.leden.length >= 80) return { ok: false, fout: 'fout' };
    const s = D.rid(16); const m = D.rid(6); g.leden.push({ m, naam, sh: D.hash(s), niet: [], lijst: null, open: null }); await D.bewaarGroep(g); await D.tel('aanmeld');
    return { ok: true, m, s };
  }
  if (['lot', 'lotlijst', 'roddel', 'gedicht'].includes(op) && b.g) {
    const g = await D.leesGroep(b.g); const ik = g && g.leden.find(x => x.m === b.m); if (!ik || ik.sh !== D.hash(b.s)) return { ok: false, fout: 'fout' };
    const doelM = g.trek ? g.trek[ik.m] : null; const doel = doelM ? g.leden.find(x => x.m === doelM) : null;
    if (op === 'lot') {
      const alOpen = !!ik.open; if (g.trek && !ik.open) { ik.open = Date.now(); await D.bewaarGroep(g); await D.tel('lot_open'); }
      let dl = null;
      if (doel) { const l = doel.lijst ? await D.leesLijst(doel.lijst) : null;
        if (l) { const [c, p] = await Promise.all([D.leesClaims(l.id), D.leesPotten(l.id)]); dl = { m: doel.m, naam: doel.naam, lijst: D.openbaar(l), claims: claimsUit(c), potten: pottenUit(p) }; await D.tel('lot_lijst'); }
        else dl = { m: doel.m, naam: doel.naam, lijst: null }; }
      return { ok: true, ik: { naam: ik.naam, lijst: ik.lijst || null, open: alOpen }, groep: { naam: g.naam, datum: g.datum, budget: g.budget, gel: g.gel }, doel: dl,
        roddel: doel ? ((g.roddel || {})[doel.m] || []).map(x => x.tekst) : [], leden: g.leden.filter(x => x.m !== ik.m).map(x => ({ m: x.m, naam: x.naam })) };
    }
    if (op === 'lotlijst') {
      let l = ik.lijst ? await D.leesLijst(ik.lijst) : null; const id = l ? l.id : D.rid(8); const k = lidSleutel(b.s, id);
      if (!l) { l = { id, naam: ik.naam, gel: g.gel === 'sint' ? 'sint' : (g.gel === 'kerst' ? 'kerst' : 'anders'), datum: g.datum, taal, ek: D.hash(k), items: [], gm: { g: g.gid, m: ik.m }, t: Date.now() };
        await D.bewaarLijst(l); ik.lijst = id; await D.bewaarGroep(g); await D.tel('lijst_maak', 'lootjes'); }
      else if (l.ek !== D.hash(k)) { l.ek = D.hash(k); await D.bewaarLijst(l); }
      return { ok: true, id, k };
    }
    if (op === 'roddel') {
      if (!await D.mag(ip, 'roddel', 60)) return druk;
      const over = g.leden.find(x => x.m === b.over && x.m !== ik.m); const tekst = kort(b.tekst, 300); if (!over || !tekst) return { ok: false, fout: 'fout' };
      g.roddel = g.roddel || {}; g.roddel[over.m] = (g.roddel[over.m] || []).concat({ tekst, t: Date.now() }).slice(-30); await D.bewaarGroep(g); await D.tel('roddel'); return { ok: true };
    }
    if (op === 'gedicht') {
      if (!doel) return { ok: false, fout: 'fout' }; if (!await D.mag(ip, 'gedicht', 15)) return druk;
      const l = doel.lijst ? await D.leesLijst(doel.lijst) : null;
      try { const tekst = await S.gedicht({ naam: doel.naam, gel: g.gel, taal, items: ((l && l.items) || []).slice(0, 12).map(x => x.t), roddel: ((g.roddel || {})[doel.m] || []).map(x => x.tekst).slice(-8), extra: kort(b.extra, 300), budget: g.budget ? geld(g.budget, 'EUR', taal) : '' });
        await D.tel('gedicht'); return { ok: true, tekst }; } catch (e) { console.log('wl gedicht', e.message); return { ok: false, fout: 'fout' }; }
    }
  }
  if (op === 'zoek') {
    if (!await D.mag(ip, 'zoek', 30)) return druk; const tekst = kort(b.tekst, 600); if (tekst.length < 4) return { ok: false, fout: 'fout' };
    let lijst = ''; if (b.l && D.geldigId(b.l)) { const l = await D.leesLijst(b.l); if (l) lijst = (l.items || []).slice(0, 15).map(x => x.t).join('; ') + (l.smaak ? ' | ' + l.smaak.tekst : ''); }
    try { const r = await S.zoekCadeau({ tekst, taal, lijst }); await D.tel('zoek', taal); return Object.assign({ ok: true }, r); } catch (e) { console.log('wl zoek', e.message); return { ok: false, fout: 'fout' }; }
  }
  if (op === 'ev') { const e = String(b.e || ''); if (['deel', 'deel_wa', 'deel_kopie', 'vergelijk', 'maak_ook'].includes(e)) await D.tel(e); return { ok: true }; }
  return { ok: false, fout: 'fout' };
}

// doorklik naar een winkel (geteld, met partnercode); alleen naar adressen die wij zelf opbouwen of die op een lijst staan
async function uit(res, url, taal) {
  const q = k => url.searchParams.get(k) || ''; const l = q('l'); let doel = null;
  if (q('kd')) { const cat = await catalogus(); const i = cat.find(x => x.id === q('kd')); if (i) { doel = await koopUrl('https://kadoly.com/product/' + i.id, D.geldigId(l) ? l : 'zoek'); await D.tel('uit_kd'); } }
  else if (q('z')) { doel = await zoekUrl(q('z'), q('q'), taal, D.geldigId(l) ? l : 'zoek'); if (doel) await D.tel('uit_zoek', q('z')); }
  else if (D.geldigId(l) && q('i')) { const L = await D.leesLijst(l); const it = L && (L.items || []).find(x => x.i === q('i')); if (it && it.u) { doel = await koopUrl(it.u, l); try { await D.tel('uit', new URL(it.u).hostname.replace(/^www\./, '')); } catch (e) {} } }
  res.setHeader('cache-control', 'no-store'); res.setHeader('referrer-policy', 'no-referrer-when-downgrade');
  res.statusCode = 302; res.setHeader('location', doel || BASIS); return res.end();
}

// dagelijkse ronde: herinneringen en prijsalarmen (cron 07:20 UTC)
async function ronde(droog) {
  const dag = D.dagNL(); const uit = { herinner: 0, alarm: 0, gecontroleerd: 0, fouten: 0 };
  if (!droog) { const lock = await kv.raw(['SET', 'wl:ronde:' + dag, '1', 'NX', 'EX', '80000']).catch(() => null); if (lock !== 'OK') return Object.assign(uit, { al: true }); }
  const hk = 'wl:h:' + dag; const her = (await kv.raw(['LRANGE', hk, '0', '499']).catch(() => [])) || [];
  for (const r of her) { let x; try { x = JSON.parse(r); } catch (e) { continue; } const l = await D.leesLijst(x.l); if (!l) continue;
    if (!droog) { const s = await stuur({ aan: x.mail, taal: x.taal, kop: tt(x.taal, 'm_her_ond', { n: l.naam }), tekst: tt(x.taal, 'm_her_tekst', { n: l.naam }), knop: tt(x.taal, 'm_knop'), href: ADRES + BASIS + '/' + l.id + '?taal=' + x.taal, idem: 'wl-h-' + D.hash(x.mail + l.id + dag) }); if (s.ok) { uit.herinner++; await D.tel('herinner_mail'); } else uit.fouten++; } else uit.herinner++; }
  if (!droog && her.length) await kv.del([hk]);
  const leden = (await kv.raw(['SRANDMEMBER', 'wl:alarmen', '40']).catch(() => [])) || [];
  const werk = async (lid) => { const [lId, iId] = String(lid).split(':'); const k = 'wl:a:' + lId + ':' + iId; const a = await kv.get(k); const l = await D.leesLijst(lId); const it = l && (l.items || []).find(x => x.i === iId);
    if (!a || !it || !it.u) { await kv.raw(['SREM', 'wl:alarmen', lid]); return; }
    uit.gecontroleerd++; const n = await haalLink(it.u, { taal: l.taal, ai: false }).catch(() => null); if (!n || !n.p || (n.m && n.m !== (a.m || 'EUR'))) return;
    if (n.p <= a.p0 * 0.95) { for (const m of a.mails) { if (droog) { uit.alarm++; continue; } const s = await stuur({ aan: m.mail, taal: m.taal, kop: tt(m.taal, 'm_alarm_ond', { t: it.t }), tekst: tt(m.taal, 'm_alarm_tekst', { t: it.t, n: l.naam, p: geld(n.p, a.m, m.taal), o: geld(a.p0, a.m, m.taal) }), knop: tt(m.taal, 'm_knop'), href: ADRES + BASIS + '/' + l.id + '?taal=' + m.taal, idem: 'wl-a-' + D.hash(m.mail + lid + n.p) }); if (s.ok) { uit.alarm++; await D.tel('alarm_mail'); } }
      if (!droog) { a.p0 = n.p; await kv.set(k, a, { ex: 180 * 86400 }); it.p = n.p; await D.bewaarLijst(l); } }
    else if (n.p > a.p0 && !droog) { a.p0 = n.p; await kv.set(k, a, { ex: 180 * 86400 }); } };
  for (let i = 0; i < leden.length; i += 8) await Promise.all(leden.slice(i, i + 8).map(x => werk(x).catch(() => { uit.fouten++; })));
  return uit;
}

export default async function handler(req, res) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  const url = new URL(req.url, 'https://' + (host || 'gids.kadoly.com'));
  const q = k => url.searchParams.get(k);
  const op = q('op') || ''; const { taal, vast } = kiesTaal(req, url);
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || '';
  if (req.headers['x-vercel-oidc-token']) process.env.VERCEL_OIDC_TOKEN = String(req.headers['x-vercel-oidc-token']); // AI Gateway (lib/ai.js) leest het token uit de omgeving
  try {
    if (op === 'js') { res.setHeader('content-type', 'application/javascript; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=600, s-maxage=86400'); return res.status(200).send(APP_JS); }
    if (op === 'api') {
      res.setHeader('cache-control', 'no-store'); if (req.method !== 'POST') return res.status(405).json({ ok: false });
      let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } } if (!b || typeof b !== 'object') b = {};
      return res.status(200).json(await api(b, { ip, taal }));
    }
    if (op === 'uit') return await uit(res, url, taal);
    if (op === 'stand') { res.setHeader('cache-control', 'no-store'); const s = await D.stand(Math.min(30, Number(q('dagen')) || 7));
      if (q('vorm') === 'tekst') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(Object.entries(s.dagen).map(([d, o]) => d + '  ' + (Object.entries(o).map(([k, v]) => k + ' ' + v).join(', ') || '-')).join('\n') + '\nprijsalarmen: ' + s.prijsalarmen + '\n'); }
      return res.status(200).json(Object.assign({ ok: true }, s)); }
    if (op === 'ronde') { const cron = /vercel-cron/i.test(String(req.headers['user-agent'] || '')) || (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET);
      res.setHeader('cache-control', 'no-store'); return res.status(200).json(Object.assign({ ok: true }, await ronde(!cron))); }
    if (vast) res.setHeader('set-cookie', 'wl_taal=' + taal + '; Path=/; Max-Age=31536000; SameSite=Lax; Secure');
    res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('vary', 'Accept-Language, Cookie');
    const t = T[taal]; const p = q('p') || ''; const g = q('g'), m = q('m');
    const bron = { bronnen: vergelijkBronnen(taal), bronnaam: BRONNAAM, taal, basis: BASIS };
    if (op === 'af') { const ok = await D.meldAf(q('t')); res.setHeader('cache-control', 'no-store');
      return res.status(200).send(schil(Object.assign({}, bron, { titel: 'Kadoly', view: 'af', ssr: `<h1>${esc(ok ? t.af_ok : t.fout)}</h1><p><a class="k" href="${BASIS}">${esc(t.naam_product)}</a></p>` }))); }
    res.setHeader('cache-control', 'no-store');
    if (g && m) { const G = await D.leesGroep(g); return res.status(200).send(schil(Object.assign({}, bron, { titel: (G ? G.naam + ' · ' : '') + t.lt_h1, view: 'lid', data: { g, m }, ssr: `<p>${esc(t.bezig)}</p>` }))); }
    if (g) { const G = await D.leesGroep(g); await D.tel('groep_open'); return res.status(200).send(schil(Object.assign({}, bron, { titel: (G ? G.naam + ' · ' : '') + t.lt_h1, beschrijving: t.lt_sub, view: 'groep', data: { g, naam: G ? G.naam : '', datum: G ? G.datum : null }, ssr: `<h1>${esc(G ? G.naam : t.lt_h1)}</h1><p>${esc(t.bezig)}</p>` }))); }
    if (p === 'lootjes') { await D.tel('lt_view', taal); 
      return res.status(200).send(schil(Object.assign({}, bron, { titel: t.lt_h1 + ' · Kadoly', beschrijving: t.lt_sub, view: 'lootjes', index: true, pad: BASIS + '/lootjes', ssr: `<h1>${esc(t.lt_h1)}</h1><p class="sub">${esc(t.lt_sub)}</p>` }))); }
    if (p === 'zoek') { await D.tel('zoek_view', taal);
      return res.status(200).send(schil(Object.assign({}, bron, { titel: t.zk_h1 + ' · Kadoly', beschrijving: t.zk_sub, view: 'zoek', index: !q('voor') && !q('l'), pad: BASIS + '/zoek', data: { voor: kort(q('voor'), 40), l: D.geldigId(q('l')) ? q('l') : '' }, ssr: `<h1>${esc(t.zk_h1)}</h1><p class="sub">${esc(t.zk_sub)}</p>` }))); }
    if (p && D.geldigId(p)) {
      const l = await D.leesLijst(p);
      if (!l) { res.statusCode = 404; return res.end(schil(Object.assign({}, bron, { titel: t.naam_product, view: 'home', ssr: '' }))); }
      const L = D.openbaar(l); const titel = tt(taal, 'van', { n: l.naam }); const eerste = (l.items || []).slice(0, 3).map(x => x.t).join(' · ');
      return res.status(200).send(schil(Object.assign({}, bron, { titel, beschrijving: eerste || t.deel_s, view: 'lijst', data: L, ogImg: ((l.items || []).find(x => x.img && /^https:/.test(x.img)) || {}).img,
        ssr: `<h1>${esc(titel)}</h1><p>${esc(t.bezig)}</p><noscript><ul>${(l.items || []).map(x => `<li>${esc(x.t)}</li>`).join('')}</ul></noscript>` }))); }
    await D.tel('home', taal); 
    return res.status(200).send(schil(Object.assign({}, bron, { titel: t.h1 + ' · Kadoly', beschrijving: t.sub, view: 'home', index: true, pad: BASIS, ssr: `<h1>${esc(t.h1)}</h1><p class="sub">${esc(t.sub)}</p>` })));
  } catch (e) {
    console.log('wl fout', op, e && e.message);
    if (op === 'api') return res.status(200).json({ ok: false, fout: 'fout' });
    return res.status(500).send('fout');
  }
}
