// Tag per zonegroep (Henkjan 17 okt: "Mondiad-verdict geven en het allerbeste verkeer daar opsporen"). Amazon Associates toont
// kopers alleen per tag, niet per zone. Daarom kan /go de tag van een klik laten afhangen van de zone: dezelfde campagne, hetzelfde
// verkeer en dezelfde commissie, maar Associates laat dan per zonegroep zien wie er koopt.
// Instelling mm:zonetag = { "<netwerk>|<tag>": { "<zone>": "<tag>", "*": "<tag voor alle andere zones>" } }.
// Alleen geregistreerde, vrije tags gebruiken (anders telt Amazon de klik niet). Zonder instelling verandert er niets.
const CACHE = { at: 0, v: null };
export async function leesZoneTag(kv, vers = false) {
  if (!vers && CACHE.v && Date.now() - CACHE.at < 60000) return CACHE.v;
  let v = null; try { v = await kv.get('mm:zonetag'); } catch (e) {}
  CACHE.at = Date.now(); CACHE.v = v || {}; return CACHE.v;
}
const tagGoed = t => /^[a-z0-9-]{2,40}-2[01]$/.test(String(t || ''));
export async function tagVoorZone(kv, net, tag, zone) {
  const c = await leesZoneTag(kv); const r = c && c[String(net) + '|' + String(tag)]; if (!r) return tag;
  const z = String(zone || '').replace(/^md/, ''); const t = (z && r[z]) || r['*'];
  return tagGoed(t) ? t : tag;
}
export async function zetZoneTag(kv, j) {
  if (!j || typeof j !== 'object') return { ok: false, fout: 'j={"mondiad|bl-bku-20":{"1458":"ml-web-20","*":"rrpush-20"}}' };
  const oud = Object.assign({}, await leesZoneTag(kv, true));
  for (const [k, r] of Object.entries(j)) {
    if (!/^[a-z]+\|[a-z0-9-]+-2[01]$/.test(k)) continue;
    if (r === null) { delete oud[k]; continue; }
    const s = {}; for (const [z, t] of Object.entries(r || {})) if ((z === '*' || /^\d{1,9}$/.test(z)) && (t === 'zelf' || tagGoed(t))) s[z] = t === 'zelf' ? k.split('|')[1] : t;
    oud[k] = s;
  }
  await kv.set('mm:zonetag', oud); CACHE.v = null;
  return { ok: true, zonetag: oud };
}
