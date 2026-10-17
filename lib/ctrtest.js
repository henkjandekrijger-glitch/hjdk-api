// CTR-test per zoekterm (Henkjan 17 okt: "Kunnen we hier geen campagne van maken om uit te zoeken wat de hoogste CTR is aan het
// begin van de funnel, bij de advertentie?", naar aanleiding van de termoverlap: dezelfde mensen klikken gevoerde damesboots en
// gevoerde damespantoffels aan).
// Opzet: één campagne, dus dezelfde zones, hetzelfde bod en dezelfde mensen, met per zoekterm een paar advertenties. Het netwerk
// meet per advertentie vertoningen en kliks (CTR); /go stuurt elke advertentie naar haar eigen Amazon-zoekterm. Zo is het verschil in
// CTR het verschil tussen de termen, niet tussen zones of campagnes.
// Link: /go?...&b={bannerid}&k=<standaardterm>&t=<testnaam>. Instelling mm:ctrtest:<naam> =
//   { naam, campagne, markt, tag, armen: { "<bannerid>": { k, term } }, gemaakt }.
// Per advertentie telt Clickmind ook wat er na de klik gebeurt: aangekomen bij /go (n), unieke mensen (HyperLogLog) en snelle
// herhaalklikken komen uit de gewone /go-meting (mm:ct:<naam>:<dag>, mm:ctp:<naam>:<dag>:<banner>).
// Alleen meten: nooit stoppen, bod of budget wijzigen. Advertenties die achterblijven pauzeren of de campagne opschalen: Henkjans woord.

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const dagStr = (o = 0) => new Date(Date.now() + o * 864e5).toISOString().slice(0, 10);
export const testNaam = s => String(s || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20);
const CACHE = new Map();

export async function leesTest(kv, naam, vers = false) {
  const n = testNaam(naam); if (!n) return null;
  const c = CACHE.get(n); if (!vers && c && Date.now() - c.at < 60000) return c.v;
  let v = null; try { v = await kv.get('mm:ctrtest:' + n); } catch (e) {}
  CACHE.set(n, { at: Date.now(), v }); return v;
}
export async function zetTest(kv, j) {
  const n = testNaam(j && j.naam); if (!n) return { ok: false, fout: 'naam' };
  const oud = (await leesTest(kv, n, true)) || {};
  const armen = Object.assign({}, oud.armen || {});
  for (const [b, a] of Object.entries((j && j.armen) || {})) {
    const id = String(b).replace(/[^0-9]/g, '').slice(0, 14); if (!id) continue;
    if (a === null) { delete armen[id]; continue; }
    const k = String((a && a.k) || '').trim().slice(0, 120); if (!k) continue;
    armen[id] = { k, term: String((a && a.term) || k).slice(0, 60) };
  }
  const v = { naam: n, campagne: String(j.campagne || oud.campagne || '').replace(/[^0-9]/g, ''), markt: String(j.markt || oud.markt || 'com').toLowerCase().slice(0, 6), tag: String(j.tag || oud.tag || '').slice(0, 40), armen, gemaakt: oud.gemaakt || new Date().toISOString(), bijgewerkt: new Date().toISOString() };
  await kv.set('mm:ctrtest:' + n, v); CACHE.delete(n);
  return { ok: true, test: v };
}
// voor /go: welke zoekterm hoort bij deze advertentie?
export async function termVoorAdvertentie(kv, naam, banner) {
  const t = await leesTest(kv, naam); if (!t || !t.armen) return null;
  return t.armen[String(banner || '').replace(/[^0-9]/g, '')] || null;
}
export function telCmds(naam, D, banner, pid) {
  const n = testNaam(naam), b = String(banner || '').replace(/[^0-9]/g, '').slice(0, 14) || '-'; if (!n) return [];
  const k = 'mm:ct:' + n + ':' + D, hp = 'mm:ctp:' + n + ':' + D + ':' + b;
  return [['HINCRBY', k, b + '|n', 1], ['EXPIRE', k, 60 * 86400], ['PFADD', hp, String(pid || '-')], ['EXPIRE', hp, 60 * 86400]];
}
// stand: per advertentie en per term de Clickmind-kant (aangekomen, unieke mensen). De netwerkkant (vertoningen, kliks, CTR) komt
// uit PropellerAds (creative_stats of /adv/statistics met group_by banner_id) en kan worden meegegeven als pa = { "<banner>": {impressions, clicks, spent} }.
export async function testStand(kv, naam, { dagen = 7, pa = null } = {}) {
  const t = await leesTest(kv, naam, true); if (!t) return { ok: false, fout: 'onbekende test' };
  const D = Array.from({ length: Math.max(1, Math.min(30, N(dagen) || 7)) }, (_, i) => dagStr(-i));
  const per = {};
  for (const d of D) {
    let h = null; try { h = await kv.raw(['HGETALL', 'mm:ct:' + t.naam + ':' + d]); } catch (e) {}
    for (let i = 0; h && i < h.length; i += 2) { const [b, veld] = String(h[i]).split('|'); const x = per[b] || (per[b] = { banner: b, n: 0 }); if (veld === 'n') x.n += N(h[i + 1]); }
  }
  const rijen = [];
  for (const [b, a] of Object.entries(t.armen || {})) {
    const x = per[b] || { banner: b, n: 0 }; let mensen = null; try { mensen = N(await kv.raw(['PFCOUNT', ...D.map(d => 'mm:ctp:' + t.naam + ':' + d + ':' + b)])); } catch (e) {}
    const p = pa && pa[b]; const r = { banner: b, term: a.term, k: a.k, aangekomen: x.n, mensen };
    if (p) { r.vertoningen = N(p.impressions); r.kliks = N(p.clicks); r.ctr = r.vertoningen ? Math.round(10000 * r.kliks / r.vertoningen) / 100 : null; r.kosten = Math.round(N(p.spent) * 1000) / 1000; r.aankomst = r.kliks ? Math.round(1000 * x.n / r.kliks) / 10 : null; }
    rijen.push(r);
  }
  const termen = {};
  for (const r of rijen) { const x = termen[r.term] || (termen[r.term] = { term: r.term, advertenties: 0, vertoningen: 0, kliks: 0, aangekomen: 0, mensen: 0, kosten: 0 }); x.advertenties++; x.vertoningen += N(r.vertoningen); x.kliks += N(r.kliks); x.aangekomen += N(r.aangekomen); x.mensen += N(r.mensen); x.kosten += N(r.kosten); }
  for (const x of Object.values(termen)) { x.ctr = x.vertoningen ? Math.round(10000 * x.kliks / x.vertoningen) / 100 : null; x.kosten = Math.round(x.kosten * 1000) / 1000; }
  return { ok: true, test: { naam: t.naam, campagne: t.campagne, markt: t.markt, tag: t.tag }, dagen: D, termen: Object.values(termen).sort((a, b) => N(b.ctr) - N(a.ctr)), advertenties: rijen.sort((a, b) => N(b.ctr) - N(a.ctr)) };
}
