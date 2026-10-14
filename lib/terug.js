// TERUGBETALINGSDOSSIER (Henkjan 14 okt 2026): per netwerk per dag de kliks waarvan we kunnen aantonen dat ze nep of verspild waren,
// met de klik-id van het netwerk, tijd (ook in de tijdzone van het netwerk), campagne, zone, netwerkdeel van het IP, ASN en de reden.
// Alleen kliks die via /go of /w liepen (alleen daar hebben we bewijs per klik). Indienen gebeurt NIET automatisch: dat is een bericht
// namens Henkjan en gaat alleen op zijn woord. Termijnen (onderzocht 14 okt): PropellerAds 3 dagen voor een onderbouwd rapport over de
// statistiek (voorwaarden §4.2), RichAds 5 dagen (§3.10, alleen herhaalkliks van hetzelfde IP op een plek of verkeerde targeting),
// MGID 30 dagen via de accountmanager (correctie bij meer dan 5% en minstens $5), Mondiad onbekend (schriftelijk vragen).
import { dag } from './mensmeter.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
export const NETWERK = {
  propeller: { tz: 'EST (vast UTC-5, zoals de PropellerAds-statistiek)', vast: -5, termijnDagen: 3, hoe: 'onderbouwd rapport binnen 3 kalenderdagen (voorwaarden §4.2); de statistiek van PropellerAds is leidend, fraude beslissen zij' },
  richads: { tz: 'UTC', vast: null, termijnDagen: 5, hoe: 'binnen 5 kalenderdagen; alleen abnormale kliks van hetzelfde IP op een plek, als RichAds bots bevestigt (§3.10)' },
  mgid: { tz: 'Europe/Amsterdam', vast: null, termijnDagen: 30, hoe: 'via de accountmanager, schriftelijk binnen 30 dagen met bewijs; correctie bij meer dan 5% ongeldig en minstens $5' },
  mondiad: { tz: 'UTC', vast: null, termijnDagen: null, hoe: 'geen beleid gevonden: schriftelijk vragen bij de accountmanager' },
  clickadu: { tz: 'UTC', vast: null, termijnDagen: null, hoe: 'niet onderzocht' }
};
const tijdIn = (t, tz, vast) => { if (vast != null) return new Date(t + vast * 3600000).toISOString().replace('T', ' ').slice(0, 19) + ' (UTC' + (vast < 0 ? '' : '+') + vast + ')'; try { return new Intl.DateTimeFormat('sv-SE', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(t)); } catch (e) { return new Date(t).toISOString(); } };

async function rawDag(kv, d, cb) {
  const k = 'mm:raw:' + d, tot = N(await kv.raw(['LLEN', k]));
  for (let van = 0; van < tot; van += 2000) {
    const l = (await kv.raw(['LRANGE', k, van, van + 1999])) || [];
    for (const x of l) { try { cb(JSON.parse(x)); } catch (e) {} }
  }
  return tot;
}

export async function dossier(kv, { net = 'propeller', van, tot, maxRijen = 5000 } = {}) {
  const info = NETWERK[net] || { tz: 'UTC', hoe: 'onbekend netwerk' };
  van = /^\d{4}-\d{2}-\d{2}$/.test(String(van || '')) ? van : dag(-1); tot = /^\d{4}-\d{2}-\d{2}$/.test(String(tot || '')) ? tot : van;
  const dagen = []; for (let t = Date.parse(van + 'T00:00:00Z'); t <= Date.parse(tot + 'T00:00:00Z') && dagen.length < 31; t += 864e5) dagen.push(new Date(t).toISOString().slice(0, 10));
  const go = [], b = {};
  // een dag verder lezen: browsermetingen kunnen net na middernacht binnenkomen
  for (const d of [...dagen, new Date(Date.parse(dagen[dagen.length - 1] + 'T00:00:00Z') + 864e5).toISOString().slice(0, 10)]) {
    await rawDag(kv, d, r => { if (r.ty === 'go' && r.net === net && dagen.includes(new Date(r.t).toISOString().slice(0, 10))) go.push(r); else if (r.ty === 'b' && r.net === net) b[r.cid] = r; });
  }
  go.sort((x, y) => x.t - y.t);
  // reeksen van dezelfde persoon: elke klik binnen 10 minuten na de vorige van die persoon is een herhaalklik; 3 of meer achter elkaar is een serie
  const perP = {}; for (const r of go) (perP[r.pid] || (perP[r.pid] = [])).push(r);
  const serie = new Set(), herh = new Set();
  for (const l of Object.values(perP)) {
    let reeks = [l[0]];
    const sluit = () => { if (reeks.length >= 3) reeks.forEach((r, i) => { if (i > 0) serie.add(r.cid); }); reeks.slice(1).forEach(r => herh.add(r.cid)); };
    for (let i = 1; i < l.length; i++) { if (l[i].t - l[i - 1].t < 600000) reeks.push(l[i]); else { sluit(); reeks = [l[i]]; } }
    sluit();
  }
  const rijen = [], perReden = {}, perCamp = {};
  // één betaalde klik = één klik-id van het netwerk. Komt dezelfde klik-id vaker binnen (bv. de bezoeker plus een Google-server die de link
  // ophaalt), dan is de klik alleen verdacht als ALLE verzoeken met die klik-id verdacht zijn. Zo claimen we nooit een echte klik.
  const redenVan = r => {
    const red = [], c = b[r.cid];
    if (r.ip && r.ip.dc === true) red.push('datacenter' + (r.ip.asn ? ' (AS' + r.ip.asn + ')' : ''));
    if ((r.redenen || []).some(x => /bot of headless in user-agent/.test(x))) red.push('bot of script volgens user-agent');
    if (c && c.vlag && c.vlag.hl) red.push('headless of automatisering in de browser' + (c.c && N(c.c.wd) === 1 ? ' (navigator.webdriver)' : ''));
    if (c && c.vlag && c.vlag.em) red.push('emulator of softwarerenderer (' + String(c.c && c.c.glr || '').slice(0, 60) + ')');
    if (serie.has(r.cid)) red.push('serieklik: zelfde persoon 3 of meer keer binnen 10 minuten');
    else if (herh.has(r.cid)) red.push('herhaalklik binnen 10 minuten');
    return red;
  };
  const perKlik = new Map(); for (const r of go) { const k = r.sub && r.sub !== '-' ? r.sub : 'cid:' + r.cid; const x = perKlik.get(k); if (x) x.push(r); else perKlik.set(k, [r]); }
  const dubbel = [...perKlik.values()].filter(l => l.length > 1).length;
  for (const l of perKlik.values()) {
    const rr = l.map(redenVan); if (rr.some(x => !x.length)) continue;
    const r = l[0], red = [...new Set(rr.flat())];
    if (l.length > 1) red.push('klik-id ' + l.length + ' keer binnengekomen, telkens verdacht');
    // sterk alleen als ELK verzoek met deze klik-id op zichzelf sterk bewijs heeft (een Google-server die de link ophaalt maakt een losse herhaalklik niet sterk)
    const sterk = rr.every(x => x.some(y => !/^herhaalklik/.test(y)));
    for (const x of red) { const k = x.replace(/ \(.*$/, ''); perReden[k] = N(perReden[k]) + 1; }
    const pc = perCamp[r.camp] || (perCamp[r.camp] = { campagne: r.camp, kliks: 0, verdacht: 0, sterk: 0 }); pc.verdacht++; if (sterk) pc.sterk++;
    if (rijen.length < maxRijen) rijen.push({ klikIdNetwerk: r.sub, tijdUTC: new Date(r.t).toISOString().replace('T', ' ').slice(0, 19), tijdNetwerk: tijdIn(r.t, info.tz, info.vast), campagne: r.camp, zone: r.zone, advertentie: r.cr, ipNetwerk: r.ip && r.ip.net, asn: r.ip && r.ip.asn, land: r.geo && r.geo.land, sterk, redenen: red });
  }
  for (const l of perKlik.values()) { const r = l[0]; const pc = perCamp[r.camp] || (perCamp[r.camp] = { campagne: r.camp, kliks: 0, verdacht: 0, sterk: 0 }); pc.kliks++; }
  const sterk = rijen.filter(r => r.sterk).length;
  return {
    netwerk: net, van, tot, tijdzoneNetwerk: info.tz, termijnDagen: info.termijnDagen, indienen: info.hoe,
    uiterlijkIndienen: info.termijnDagen ? new Date(Date.parse(tot + 'T00:00:00Z') + (info.termijnDagen + 1) * 864e5).toISOString().slice(0, 10) : null,
    kliksViaOns: perKlik.size, verzoeken: go.length, klikIdDubbel: dubbel, verdacht: rijen.length, sterkBewijs: sterk, pctVerdacht: perKlik.size ? Math.round(rijen.length / perKlik.size * 1000) / 10 : null,
    perReden, perCampagne: Object.values(perCamp).filter(x => x.verdacht).sort((a, b2) => b2.verdacht - a.verdacht),
    uitleg: 'Alleen kliks via whichtobuy.best/go of /w. Sterk bewijs: datacenter, bot of headless, emulator of serieklik. Een losse herhaalklik is zwak bewijs. Wat nooit bij ons aankwam staat hier niet in per klik: dat is per zone het verschil tussen wat het netwerk afrekent en wat wij zagen.',
    rijen
  };
}

export function naarCsv(d) {
  const kop = ['klik_id_netwerk', 'tijd_utc', 'tijd_netwerk', 'campagne', 'zone', 'advertentie', 'ip_netwerk', 'asn', 'land', 'sterk', 'redenen'];
  const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  return [kop.join(',')].concat(d.rijen.map(r => [r.klikIdNetwerk, r.tijdUTC, r.tijdNetwerk, r.campagne, r.zone, r.advertentie, r.ipNetwerk, r.asn, r.land, r.sterk ? 'ja' : 'nee', r.redenen.join('; ')].map(q).join(','))).join('\n');
}

// elke dag: dossier van gisteren per netwerk met verkeer via /go of /w, samenvatting 40 dagen bewaard (indienen alleen op Henkjans woord)
export async function dagDossiers(kv) {
  const d = dag(-1), nets = new Set();
  await rawDag(kv, d, r => { if (r.ty === 'go' && r.net) nets.add(r.net); });
  const uit = [];
  for (const net of nets) {
    if (net === 'test') continue;
    const x = await dossier(kv, { net, van: d, tot: d, maxRijen: 3000 });
    const kort = { ...x, rijen: undefined, aantalRijen: x.rijen.length, gemaakt: new Date().toISOString() };
    await kv.set('mm:terug:' + net + ':' + d, { ...kort, rijen: x.rijen }, { ex: 40 * 86400 });
    await kv.raw(['SADD', 'mm:terug:index', net + ':' + d]); await kv.raw(['EXPIRE', 'mm:terug:index', 40 * 86400]);
    uit.push(kort);
  }
  return { dag: d, dossiers: uit };
}
