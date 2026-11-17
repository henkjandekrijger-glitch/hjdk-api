// Rotterdam: diensten in een plaats (Henkjan 16 nov 2026: "Ja ga voor Rotterdam" en "Los dit dan op voor producten ... bij diensten in een plaats
// is die bron er vaak niet"). Les van curacao.day: AI zoekt een bron die compleet en actueel is. Per dienst een keuzehulp met ALLE zaken in de
// gemeente Rotterdam (uit OpenStreetMap, met bron en datum), wie nu open is, bellen, route en website in één tik, en per zaak een eigen pagina.
// Geen scores van derden, geen verzonnen feiten: de volgorde is hoe compleet de gegevens zijn, en dat staat erbij.
// Data: KV rdam:d:<dienst> {t, items}; ververst via /api/keuze-tools?tool=rdam&op=ververs (cron, de oudste dienst per keer).
// Tikken per zaak (bellen, route, website) in KV rdam:tik:<dienst> (hash slug:soort -> aantal): de basis voor betalen per contact later.
import { kv } from './db.js';
import { lookNieuw } from './look.js';
import { kzuxBlok } from './kzux.js';

const HOST = 'keuzehulp.best', BASIS = 'https://' + HOST + '/rotterdam';
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' en ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// dienst: OSM-filters (Overpass), schema-type, en eigen uitleg (algemeen geldende feiten, geen cijfers zonder bron)
export const DIENSTEN = [
  { slug: 'tandarts', gcat: ["dentist"], gidsW: ["tandenborstel", "flosser", "tandpasta", "mondwater"], naam: 'Tandarts', mv: 'tandartsen', een: 'een tandarts', osm: ['nwr[amenity=dentist]', 'nwr[healthcare=dentist]', 'naam:tandarts|mondzorg|tandheelk|orthodont'], type: 'Dentist',
    tips: ['Vraag eerst of de praktijk nieuwe patiënten aanneemt: veel praktijken hebben een wachtlijst of een stop.', 'Controleer de tandarts in het BIG-register; daar staat of hij of zij bevoegd is.', 'De tarieven voor mondzorg zijn maximumtarieven van de NZa. Tot 18 jaar betaalt de basisverzekering de meeste zorg; daarna heb je een aanvullende verzekering nodig of betaal je zelf.'],
    faq: [['Hoe vind ik een tandarts in Rotterdam die nieuwe patiënten aanneemt?', 'Bel of app een paar praktijken bij jou in de buurt; hieronder zie je wie nu open is en kun je meteen bellen. Vraag naar een wachtlijst en hoe lang die is.'], ['Wat kost een tandarts in Rotterdam?', 'Overal in Nederland gelden dezelfde maximumtarieven van de NZa. Een praktijk mag lager zitten, niet hoger. Vraag bij grotere behandelingen altijd een begroting vooraf.'], ['Wat doe ik bij spoed buiten openingstijden?', 'Bel je eigen tandarts: het antwoordapparaat noemt de tandarts van dienst. Zonder eigen tandarts kun je een praktijk hieronder bellen die nu open is.']] },
  { slug: 'fysiotherapeut', gcat: ["physiotherapist"], gidsW: ["massage", "foamroller", "bureaustoel", "sta-bureau", "zit-sta", "hardloopschoen"], naam: 'Fysiotherapeut', mv: 'fysiotherapeuten', een: 'een fysiotherapeut', osm: ['nwr[healthcare=physiotherapist]', 'nwr[amenity=physiotherapist]', 'naam:fysio|fysiotherap|manuele therap'], type: 'Physiotherapy',
    tips: ['Je kunt zonder verwijzing van de huisarts naar een fysiotherapeut.', 'Controleer de fysiotherapeut in het BIG-register.', 'Kijk in je polis hoeveel behandelingen de aanvullende verzekering vergoedt en of de praktijk een contract heeft met je verzekeraar.'],
    faq: [['Heb ik een verwijzing nodig voor een fysiotherapeut?', 'Nee, je kunt direct een afspraak maken. Een verwijzing kan wel nodig zijn voor vergoeding bij sommige verzekeringen.'], ['Wordt fysiotherapie vergoed?', 'Uit de basisverzekering alleen bij bepaalde chronische aandoeningen en voor kinderen. Anders hangt het af van je aanvullende verzekering.'], ['Hoe kies ik een fysiotherapeut?', 'Let op afstand (je gaat vaak meerdere keren), een specialisatie die past bij je klacht en of ze een contract hebben met je verzekeraar.']] },
  { slug: 'loodgieter', gcat: ["plumber"], gidsW: ["douche", "kraan", "boiler", "ontstopper", "waterontharder"], naam: 'Loodgieter', mv: 'loodgieters', een: 'een loodgieter', osm: ['nwr[craft=plumber]', 'naam:loodgiet|sanitair|ontstop'], type: 'Plumber',
    tips: ['Vraag aan de telefoon naar voorrijkosten, uurtarief en toeslag buiten kantoortijd, voordat er iemand komt.', 'Wees voorzichtig met bovenaan geplaatste advertenties zonder vestigingsadres; kies een bedrijf met een adres in de buurt.', 'Vraag bij groter werk een schriftelijke offerte en betaal liever niet contant ter plekke.'],
    faq: [['Wat kost een loodgieter in Rotterdam?', 'Dat verschilt per bedrijf. Vraag vooraf naar voorrijkosten, uurtarief en spoedtoeslag; dan weet je waar je aan toe bent.'], ['Hoe vind ik snel een loodgieter bij spoed?', 'Hieronder zie je wie nu open is; bel er een paar en vraag wanneer ze kunnen komen en wat het kost.'], ['Hoe herken ik een betrouwbare loodgieter?', 'Een vast adres, een KvK-nummer, duidelijke prijzen vooraf en een factuur met btw.']] },
  { slug: 'elektricien', gcat: ["electrician"], gidsW: ["laadpaal", "verlengsnoer", "stekkerdoos", "thuisbatterij", "stekkerbatterij", "zonnepaneel"], naam: 'Elektricien', mv: 'elektriciens', een: 'een elektricien', osm: ['nwr[craft=electrician]', 'naam:elektricien|elektrotechn|elektra'], type: 'Electrician',
    tips: ['Heeft de hele straat geen stroom? Dan is het een storing van de netbeheerder (in Rotterdam Stedin), niet iets voor een elektricien.', 'Laat werk aan de meterkast en nieuwe groepen door een vakman doen en vraag om een factuur.', 'Vraag voorrijkosten en uurtarief vooraf.'],
    faq: [['Wanneer bel ik een elektricien en wanneer de netbeheerder?', 'Valt alleen bij jou de stroom uit, of slaat een groep steeds door: een elektricien. Valt de hele straat uit: de netbeheerder.'], ['Wat kost een elektricien in Rotterdam?', 'Dat verschilt per bedrijf. Vraag voorrijkosten en uurtarief vooraf, en bij groter werk een offerte.'], ['Hoe kies ik een elektricien?', 'Kies een bedrijf met een vast adres en vraag of ze het soort werk vaker doen, zoals een laadpaal, een nieuwe groepenkast of zonnepanelen.']] },
  { slug: 'schilder', gcat: ["painter"], gidsW: ["verf", "kwast", "verfroller", "ladder", "trap"], naam: 'Schilder', mv: 'schilders', een: 'een schilder', osm: ['nwr[craft=painter]', 'naam:schilder'], type: 'HousePainter',
    tips: ['Vraag meerdere offertes met daarin de oppervlakte, het aantal lagen en welke verf.', 'Voor schilderwerk aan een woning van meer dan 2 jaar oud geldt 9% btw over het arbeidsloon.', 'Buitenschilderwerk plan je het best in het voorjaar of de zomer; goede schilders zitten dan snel vol.'],
    faq: [['Wat kost een schilder in Rotterdam?', 'Dat hangt af van de oppervlakte, de staat van het hout en de verf. Vergelijk offertes op dezelfde punten.'], ['Hoeveel btw betaal ik voor een schilder?', 'Voor het arbeidsloon aan een woning ouder dan 2 jaar 9%, voor de verf 21%.'], ['Wanneer kan ik het best een schilder boeken?', 'Voor buitenwerk ruim voor het voorjaar; binnenwerk kan het hele jaar.']] },
  { slug: 'verhuizer', gcat: ["moving_company"], gidsW: ["verhuisdoos", "steekwagen", "opslagbox", "ladder"], naam: 'Verhuizer', mv: 'verhuisbedrijven', een: 'een verhuizer', osm: ['nwr[office=moving_company]', 'nwr[shop=moving_company]', 'nwr[craft=removal]', 'naam:verhuis|verhuiz'], type: 'MovingCompany',
    tips: ['Laat een verhuizer eerst komen kijken of geef een complete lijst; dan krijg je een vaste prijs in plaats van een uurtarief.', 'Vraag hoe je spullen verzekerd zijn tijdens de verhuizing.', 'Check bij de gemeente of je een ontheffing nodig hebt om de verhuiswagen voor de deur te zetten.'],
    faq: [['Wat kost een verhuizer in Rotterdam?', 'Dat hangt af van de hoeveelheid spullen, de verdieping, een lift en de afstand. Vraag een vaste prijs na een bezichtiging.'], ['Hoe ver vooruit boek ik een verhuizer?', 'Aan het eind van de maand en in de zomer is het druk; boek dan een paar weken vooruit.'], ['Waar let ik op bij een verhuizer?', 'Een vaste prijs, een verzekering voor je spullen en een vestigingsadres.']] },
  { slug: 'schoonmaakbedrijf', gcat: ["house_cleaning_service", "commercial_cleaning_service"], gidsW: ["stofzuiger", "robotstofzuiger", "dweil", "stoomreiniger", "raamwisser"], naam: 'Schoonmaakbedrijf', mv: 'schoonmaakbedrijven', een: 'een schoonmaakbedrijf', osm: ['nwr[office=cleaning]', 'nwr[craft=cleaning]', 'nwr[shop=cleaning]', 'naam:schoonmaak'], type: 'LocalBusiness',
    tips: ['Een vaste schoonmaker die je zelf inhuurt valt onder de Regeling dienstverlening aan huis zolang die minder dan 4 dagen per week bij jou werkt.', 'Via een bedrijf betaal je meer per uur, maar regelt het bedrijf vervanging bij ziekte en vakantie.', 'Vraag of het bedrijf verzekerd is voor schade.'],
    faq: [['Wat kost schoonmaak in Rotterdam?', 'Dat verschilt per bedrijf en per soort werk (wekelijks, eenmalig, opleveren). Vraag een prijs per uur of per klus.'], ['Wat is de Regeling dienstverlening aan huis?', 'Als particulier mag je iemand minder dan 4 dagen per week inhuren voor huishoudelijk werk zonder werkgever te worden voor de belasting.'], ['Bureau of zelf iemand inhuren?', 'Een bureau regelt vervanging en verzekering; zelf inhuren is goedkoper maar je regelt alles zelf.']] },
  { slug: 'kapper', gcat: ["hair_salon", "barber_shop"], gidsW: ["fohn", "stijltang", "krultang", "tondeuse", "haardroger", "scheerapparaat"], naam: 'Kapper', mv: 'kappers', een: 'een kapper', osm: ['nwr[shop=hairdresser]'], type: 'HairSalon',
    tips: ['Kijk of je online kunt boeken en of ze ook zonder afspraak knippen.', 'Vraag de prijs vooraf, zeker voor kleuren of lang haar.', 'Kies een kapper dicht bij huis of werk; je komt elke paar weken terug.'],
    faq: [['Welke kapper in Rotterdam is nu open?', 'Hieronder staat bij elke kapper of hij nu open is, met de tijden van vandaag.'], ['Kan ik zonder afspraak naar de kapper?', 'Bij veel kappers wel, vooral doordeweeks. Bel even; hieronder kun je met één tik bellen.'], ['Wat kost een kapper in Rotterdam?', 'Dat verschilt per zaak en per behandeling; vraag de prijs vooraf.']] },
  { slug: 'autogarage', gcat: ["car_repair"], gidsW: ["autostoel", "dashcam", "bandenpomp", "acculader", "starthulp", "ruitenwisser", "winterband"], naam: 'Autogarage', mv: 'garages', een: 'een garage', osm: ['nwr[shop=car_repair]', 'nwr[craft=car_repair]'], type: 'AutoRepair',
    tips: ['Voor de APK moet de garage een erkenning van de RDW hebben.', 'Bij een BOVAG-garage kun je bij een geschil naar de Geschillencommissie.', 'Vraag een prijsopgave vooraf en spreek af dat ze bellen als het duurder wordt.'],
    faq: [['Waar kan ik in Rotterdam APK laten doen?', 'Bij elke garage met een APK-erkenning van de RDW. Bel een garage hieronder en vraag het.'], ['Hoe kies ik een betrouwbare garage?', 'Kijk naar een erkenning (RDW voor APK, BOVAG), duidelijke prijzen vooraf en een factuur met wat er gedaan is.'], ['Wat kost een APK in Rotterdam?', 'Dat verschilt per garage. Vraag de prijs vooraf, ook voor eventuele reparaties.']] },
  { slug: 'slotenmaker', gcat: ["locksmith"], gidsW: ["deurslot", "videodeurbel", "deurbel", "kluis", "camera", "alarm"], naam: 'Slotenmaker', mv: 'slotenmakers', een: 'een slotenmaker', osm: ['nwr[shop=locksmith]', 'nwr[craft=locksmith]', 'naam:slotenmaker|slotenservice'], type: 'Locksmith',
    tips: ['Buitengesloten? Vraag aan de telefoon de totaalprijs (voorrijkosten, openen, eventueel nieuw slot) voordat iemand komt.', 'Wees voorzichtig met advertenties bovenaan zonder vestigingsadres: daar komen vaak hoge rekeningen vandaan.', 'Nieuwe sloten: kijk naar het Politiekeurmerk Veilig Wonen en SKG-sterren.'],
    faq: [['Wat doe ik als ik buitengesloten ben in Rotterdam?', 'Bel een slotenmaker hieronder die nu open is en vraag de totaalprijs vooraf. Een huurwoning? Bel eerst je verhuurder.'], ['Wat kost een slotenmaker?', 'Dat verschilt per bedrijf en tijdstip. Spreek de totaalprijs af voordat iemand komt.'], ['Welke sloten zijn veilig?', 'Sloten met SKG-sterren; voor het Politiekeurmerk Veilig Wonen gelden eisen per deur en raam.']] },
];
const D = Object.fromEntries(DIENSTEN.map(d => [d.slug, d]));
const MIN = 8; // een dienst met minder zaken is nog niet compleet genoeg om als gids te tonen (geen hub, geen sitemap, noindex)

// ---------- data uit OpenStreetMap ----------
export async function ververs(slug) {
  const d = D[slug]; if (!d) return { ok: false, fout: 'dienst' };
  const q = '[out:json][timeout:35];area["name"="Rotterdam"]["admin_level"="8"]["boundary"="administrative"]->.a;(' + d.osm.flatMap(f => f.startsWith('naam:') ? ['craft', 'office', 'shop', 'healthcare'].map(k => 'nwr["' + k + '"]["name"~"' + f.slice(5) + '",i]') : [f]).map(f => f + '(51.84,3.97,52.01,4.61)(area.a);').join('') + ');out center tags 3000;';
  const gzP = google(d); // Google tegelijk met OSM, zodat een trage Overpass de tijd niet opeet
  let j = null; const st = []; const t0 = Date.now(); for (const u of ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter']) { if (Date.now() - t0 > 60000) break;
    try { const r = await fetch(u, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'keuzehulp.best (dienstengids Rotterdam)' }, body: 'data=' + encodeURIComponent(q), signal: AbortSignal.timeout(28000) }); st.push(r.status); if (r.ok) { j = await r.json(); break; } } catch (e) { st.push(String(e.name || e).slice(0, 30)); }
  }
  const gz = await gzP;
  if ((!j || !Array.isArray(j.elements)) && !gz.length) return { ok: false, fout: 'overpass en google', status: st };
  const gezien = new Set(), slugs = new Set(), items = [];
  for (const e of (j && j.elements) || []) {
    const t = e.tags || {}, naam = String(t.name || '').trim(); if (!naam || t.highway || t.public_transport || t.railway || t.disused || t['disused:shop'] || /^(yes|no)$/i.test(naam)) continue;
    const lat = e.lat ?? (e.center && e.center.lat), lon = e.lon ?? (e.center && e.center.lon); if (lat == null) continue;
    const id = e.type[0] + e.id; const dub = naam.toLowerCase() + '|' + (t['addr:postcode'] || '') + '|' + (t['addr:housenumber'] || ''); if (gezien.has(dub)) continue; gezien.add(dub);
    let s = slugify(naam) || id; if (slugs.has(s)) s = s + '-' + (String(t['addr:postcode'] || '').replace(/\s/g, '').toLowerCase() || id); if (slugs.has(s)) s += '-' + id; slugs.add(s);
    const straat = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ');
    items.push({ s, id, naam: naam.slice(0, 90), lat: +(+lat).toFixed(5), lon: +(+lon).toFixed(5), adres: straat, pc: t['addr:postcode'] || '', plaats: t['addr:city'] || 'Rotterdam',
      tel: t.phone || t['contact:phone'] || '', web: t.website || t['contact:website'] || '', uren: t.opening_hours || '', rolstoel: t.wheelchair || '' });
  }
  // Overpass onbereikbaar: neem de OSM-zaken van de vorige keer over (anders vallen ze weg)
  if (!j) { const oud = await data(slug).catch(() => null); ((oud && oud.items) || []).filter(i => !String(i.id).startsWith('g')).forEach(i => { const { gcid, score, aantal, e, ...rest } = i; if (!slugs.has(rest.s)) { slugs.add(rest.s); items.push(rest); } }); }
  // Google-bedrijfsvermeldingen erbij (Demand Radar op=plaatscat): score en aantal reviews bij dezelfde zaak (zelfde telefoon, of naam lijkt en < 200 m), en zaken die OSM mist
  const kaal = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\b(tandartspraktijk|tandarts|praktijk|kapsalon|kapper|bv|b\.v\.|vof|rotterdam)\b/g, '').replace(/[^a-z0-9]/g, '');
  const telk = t => telLink(t || '').slice(-9); let gekoppeld = 0, nieuwG = 0;
  for (const g of gz) {
    const gk = kaal(g.naam), gt = g.tel ? telk(g.tel) : '';
    const m = items.find(x => !x.gcid && ((gt && x.tel && telk(x.tel) === gt) || (gk.length >= 4 && (kaal(x.naam).includes(gk) || gk.includes(kaal(x.naam))) && kaal(x.naam).length >= 4 && afstand(x, { lat: g.lat, lon: g.lng }) < 0.25)));
    const ur = g.uren ? googleUren(g.uren) : '';
    if (m) { m.gcid = g.cid; m.score = g.score; m.aantal = g.aantal; if (!m.tel && g.tel) m.tel = g.tel; if (!m.web && g.site) m.web = g.site; if (!rooster(m.uren) && ur) m.uren = ur; if (!m.adres && g.adres) m.adres = g.adres.replace(/,\s*\d{4}\s?[A-Z]{2}.*$/, ''); gekoppeld++; continue; }
    let s2 = slugify(g.naam) || 'g' + g.cid; if (slugs.has(s2)) s2 += '-' + (String(g.pc || '').replace(/\s/g, '').toLowerCase() || String(g.cid).slice(-6)); if (slugs.has(s2)) s2 += '-' + String(g.cid).slice(-6); slugs.add(s2);
    items.push({ s: s2, id: 'g' + g.cid, gcid: g.cid, naam: String(g.naam).slice(0, 90), lat: +(+g.lat).toFixed(5), lon: +(+g.lng).toFixed(5), adres: String(g.adres || '').replace(/,\s*\d{4}\s?[A-Z]{2}.*$/, ''), pc: g.pc || '', plaats: 'Rotterdam', tel: g.tel || '', web: g.site || '', uren: ur, rolstoel: '', score: g.score, aantal: g.aantal }); nieuwG++;
  }
  items.sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));
  const uit = { t: new Date().toISOString(), n: items.length, google: { gekoppeld, nieuw: nieuwG }, items };
  await kv.set('rdam:d:' + slug, uit); try { const n = (await kv.get('rdam:n').catch(() => null)) || {}; n[slug] = items.length; await kv.set('rdam:n', n); } catch (e) {} await kv.set('rdam:t:' + slug, String(Date.now())).catch(() => {});
  return { ok: true, dienst: slug, n: items.length, osm: j ? 'ok' : st, google: { gevonden: gz.length, gekoppeld, nieuw: nieuwG } };
}
// Google-vermeldingen per dienst via Demand Radar (DataForSEO Business Listings, 30 dagen bewaard daar); alleen binnen de gemeente (postcode 30xx, 3151, 3181, 3195-3199 of plaats Rotterdam)
async function google(d) {
  const DR = process.env.DEMANDRADAR_URL || 'https://demandradar-ivory.vercel.app'; const uit = [];
  for (const c of d.gcat || []) {
    try { const r = await fetch(DR + '/api/reviews?op=plaatscat&plaats=rotterdam&cat=' + c, { signal: AbortSignal.timeout(60000) }); const j = r.ok ? await r.json() : null; (j && j.items || []).forEach(g => { const pc = String(g.pc || '').replace(/\s/g, ''); if (g.lat == null || !(/^30\d\d|^3151|^3181|^319\d/.test(pc) || /(^|\s)rotterdam$/i.test(String(g.plaats || '')))) return; if (!uit.some(x => x.cid && x.cid === g.cid)) uit.push(g); }); } catch (e) {}
  }
  return uit;
}
const GD = { mon: 'Mo', tue: 'Tu', wed: 'We', thu: 'Th', fri: 'Fr', sat: 'Sa', sun: 'Su' };
function googleUren(u) { const r = Object.keys(GD).map(k => GD[k] + ' ' + (u[k] && /\d/.test(u[k]) ? u[k].replace(/\s+/g, '') : 'off')); return r.join('; '); }
async function tellingen() { let n = await kv.get('rdam:n').catch(() => null); if (!n) { n = {}; const v = await Promise.all(DIENSTEN.map(d => data(d.slug))); DIENSTEN.forEach((d, i) => { n[d.slug] = (v[i] && v[i].n) || 0; }); await kv.set('rdam:n', n).catch(() => {}); } return n; }
const zichtbaar = n => DIENSTEN.filter(d => (n[d.slug] || 0) >= MIN);
export async function data(slug) {
  const [x, e] = await Promise.all([kv.get('rdam:d:' + slug).catch(() => null), kv.get('rdam:e2:' + slug).catch(() => null)]);
  if (x && e) x.items.forEach(i => { if (e[i.s]) i.e = e[i.s]; }); return x || null;
}
// Verrijken (Henkjan 17 nov 2026: "Er zijn meer scores zoals trustpilot ed ... Artikelen opmerkingen reddit etc . Balanceer je score !"): per zaak één
// Google-zoekopdracht via Demand Radar (op=zaakserp, ca. $0,002, 30 dagen bewaard) voor scores op Trustpilot, Zorgkaart, Werkspot, Klantenvertellen,
// Treatwell enz. en vermeldingen op Reddit, fora en nieuwssites. Eerst de zaken die het hoogst staan; hooguit n per ronde.
export async function verrijk(slug, n = 25) {
  const d = D[slug]; if (!d) return { ok: false }; const x0 = await data(slug); if (!x0) return { ok: false, fout: 'geen data' };
  const e = (await kv.get('rdam:e2:' + slug).catch(() => null)) || {}; const DR = process.env.DEMANDRADAR_URL || 'https://demandradar-ivory.vercel.app';
  const todo = rangschik(x0.items).map(r => r.x).filter(x => (x.aantal || x.web || x.tel) && !(e[x.s] && Date.now() - e[x.s].t < 30 * 864e5)).slice(0, n);
  let ok = 0, later = 0;
  for (let i = 0; i < todo.length; i += 5) {
    await Promise.all(todo.slice(i, i + 5).map(async x => { try {
      const host = x.web ? webLink(x.web).replace(/^https?:\/\/(www\.)?/i, '').replace(/\/.*$/, '') : '';
      const r = await fetch(DR + '/api/reviews?op=zaakserp&m=NL&plaats=Rotterdam&q=' + encodeURIComponent(x.naam) + (host ? '&site=' + encodeURIComponent(host) : ''), { signal: AbortSignal.timeout(40000) });
      const j = r.ok ? await r.json() : null; if (j && j.later) { later++; return; } if (!j || !Array.isArray(j.bronnen)) return;
      e[x.s] = { t: Date.now(), bronnen: j.bronnen.slice(0, 5), vermeld: (j.vermeld || []).slice(0, 4) }; ok++;
    } catch (er) {} }));
    if (later) break;
  }
  if (ok) await kv.set('rdam:e2:' + slug, e);
  return { ok: true, dienst: slug, verrijkt: ok, later: !!later, open: todo.length - ok };
}
export async function verrijkRonde() { for (const d of DIENSTEN) { const r = await verrijk(d.slug); if (r.later) return r; if (r.verrijkt) return r; } return { ok: true, klaar: true }; }
export async function oudste() {
  const v = await kv.mget(...DIENSTEN.map(d => 'rdam:t:' + d.slug)).catch(() => []);
  let best = null, bt = Infinity; DIENSTEN.forEach((d, i) => { const t = Number(v[i]) || 0; if (t < bt) { bt = t; best = d.slug; } });
  return best;
}
export async function verversOudste() { const s = await oudste(); const r = await ververs(s); if (!r.ok) await kv.set('rdam:t:' + s, String(Date.now() - 6 * 864e5)).catch(() => {}); return r; }

// ---------- openingstijden (OSM opening_hours, het gewone deel) ----------
const DG = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'], DNL = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
export function rooster(oh) {
  const s = String(oh || '').trim(); if (!s) return null; if (/^24\/7$/.test(s)) return DG.map(() => [[0, 1440]]);
  const R = DG.map(() => null); let iets = false;
  for (let regel of s.split(';')) {
    regel = regel.trim(); if (!regel || /\b(PH|SH|week|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|easter)\b/i.test(regel.split(/\s/)[0]) || /\bPH\b/.test(regel.split(' ')[0])) continue;
    const m = regel.match(/^((?:(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?,?)+)?\s*(.*)$/); if (!m) return null;
    let dagen = []; if (m[1]) { for (const p of m[1].split(',').filter(Boolean)) { const [a, b] = p.split('-'); const i = DG.indexOf(a), k = b ? DG.indexOf(b) : i; if (i < 0 || k < 0) return null; for (let x = i; ; x = (x + 1) % 7) { dagen.push(x); if (x === k) break; } } } else dagen = [0, 1, 2, 3, 4, 5, 6];
    const tijd = m[2].trim(); let vakken = [];
    if (/^(off|closed)$/i.test(tijd)) vakken = [];
    else { for (const v of tijd.split(',')) { const t = v.trim().match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/); if (!t) return null; const van = +t[1] * 60 + +t[2]; let tot = +t[3] * 60 + +t[4]; if (tot <= van) tot += 1440; vakken.push([van, tot]); } }
    dagen.forEach(x => { R[x] = vakken; }); iets = true;
  }
  return iets ? R.map(x => x || []) : null;
}
function nuNL(nu) { const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(nu || new Date()); const g = k => (p.find(x => x.type === k) || {}).value; return { dag: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(g('weekday')), min: (+g('hour') % 24) * 60 + +g('minute') }; }
const hm = m => String(Math.floor((m % 1440) / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
export function status(R, nu) {
  if (!R) return null; const { dag, min } = nuNL(nu); const gist = R[(dag + 6) % 7] || [];
  for (const v of gist) if (v[1] > 1440 && min < v[1] - 1440) return { open: true, tot: hm(v[1]) };
  for (const v of R[dag] || []) if (min >= v[0] && min < v[1]) return { open: true, tot: v[0] === 0 && v[1] >= 1440 ? '' : hm(v[1]) };
  for (let i = 0; i < 7; i++) { const x = (dag + i) % 7; const v = (R[x] || []).find(v => i > 0 || v[0] > min); if (v) return { open: false, dag: i, om: hm(v[0]), wd: DNL[x] }; }
  return { open: false };
}
const statusTekst = s => !s ? '' : s.open ? (s.tot ? 'Nu open, tot ' + s.tot : 'Nu open') : s.om ? 'Gesloten · ' + (s.dag === 0 ? 'open om ' : s.dag === 1 ? 'morgen om ' : s.wd + ' om ') + s.om : 'Gesloten';
const weekRegels = R => { const t = i => (R[i] || []).length ? R[i].map(v => hm(v[0]) + '-' + hm(v[1])).join(', ') : 'gesloten'; const g = []; for (let i = 0; i < 7; i++) { const l = g[g.length - 1]; if (l && l.t === t(i)) l.b = i; else g.push({ a: i, b: i, t: t(i) }); } return [g.map(x => DNL[x.a] + (x.b > x.a ? '-' + DNL[x.b] : '') + ' ' + x.t).join(' · ')]; };

// ---------- helpers ----------
const telLink = t => String(t).split(/[;,]/)[0].replace(/[^\d+]/g, '').replace(/^0031/, '+31').replace(/^0(?=\d{9}$)/, '+31');
const telTekst = t => { const x = telLink(t); if (!/^\+31\d{9}$/.test(x)) return String(t).split(/[;,]/)[0]; const n = '0' + x.slice(3); return /^0[68]/.test(n) ? n.slice(0, 2) + ' ' + n.slice(2, 6) + ' ' + n.slice(6) : /^0(10|20|30|40|50|70|7[0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])/.test(n) && /^0(10|13|15|20|23|24|26|30|33|35|36|38|40|43|45|46|50|53|55|58|70|71|72|73|74|75|76|77|78|79)/.test(n) ? n.slice(0, 3) + ' ' + n.slice(3, 6) + ' ' + n.slice(6) : n.slice(0, 4) + ' ' + n.slice(4); };
const webLink = w => { const u = String(w).split(/[;\s]/)[0]; return /^https?:\/\//i.test(u) ? u : 'https://' + u; };
const webTekst = w => webLink(w).replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '').slice(0, 40);
const routeLink = x => 'https://www.google.com/maps/dir/?api=1&destination=' + x.lat + ',' + x.lon;
const osmLink = x => 'https://www.openstreetmap.org/' + ({ n: 'node', w: 'way', r: 'relation' }[x.id[0]]) + '/' + x.id.slice(1);
// onze score: Google-beoordeling gewogen naar het aantal reviews (Bayesiaans gemiddelde met 30 denkbeeldige reviews op het gemiddelde van die dienst),
// zodat een 5,0 uit 3 reviews niet boven een 4,7 uit 300 komt
// Gebalanceerde score: alle reviewbronnen die we vinden (Google plus Trustpilot, Zorgkaart, Werkspot enz.), elk omgerekend naar 5 sterren en gewogen naar
// het aantal reviews (per bron hooguit 400, zodat één bron niet alles bepaalt; Facebook telt half, Trustpilot 0,8, Zorgkaart 1,2), samen als Bayesiaans
// gemiddelde met 30 denkbeeldige reviews op het gemiddelde van de dienst. Vermeldingen op Reddit, fora en in artikelen schuiven een beetje: positief +0,04
// (hooguit +0,12), negatief -0,08 (hooguit -0,24).
const BW = { Facebook: 0.5, Trustpilot: 0.8, 'Zorgkaart Nederland': 1.2 };
function bronnen(x) { const b = []; if (x.score && x.aantal) b.push({ bron: 'Google', s5: x.score, score: x.score, max: 5, aantal: x.aantal }); ((x.e && x.e.bronnen) || []).forEach(z => { if (z.score != null && z.aantal) b.push({ ...z, s5: z.score / (z.max || 5) * 5 }); }); return b; }
function ruw(x) { const b = bronnen(x); let W = 0, T = 0; b.forEach(z => { const w = (BW[z.bron] || 1) * Math.min(z.aantal, 400); W += w; T += w * z.s5; }); return W ? { r: T / W, W } : null; }
const gem = items => { let W = 0, T = 0; items.forEach(x => { const q = ruw(x); if (q) { W += q.W; T += q.r * q.W; } }); return W ? T / W : 4.3; };
function onzeScore(x, C) { const q = ruw(x); if (!q) return null; let o = (q.W * q.r + 30 * C) / (q.W + 30); const v = (x.e && x.e.vermeld) || []; o += Math.min(0.12, 0.04 * v.filter(z => z.toon === 'pos').length) - Math.min(0.24, 0.08 * v.filter(z => z.toon === 'neg').length); return Math.max(0, Math.min(5, o)); }
export function rangschik(items) { const C = gem(items); return items.map(x => ({ x, o: onzeScore(x, C), c: compleet(x) })).sort((a, b) => (b.o ?? -1) - (a.o ?? -1) || b.c - a.c || a.x.naam.localeCompare(b.x.naam, 'nl')); }
const komma = n => String(n).replace('.', ',');
const TOON = { pos: 'positief', neg: 'negatief', neutraal: '' };
const wieZegt = x => { const b = ((x.e && x.e.bronnen) || []).filter(z => z.url), v = (x.e && x.e.vermeld) || []; if (!b.length && !v.length) return ''; return '<h2>Wat anderen zeggen</h2><ul>' + b.map(z => '<li><a href="' + esc(z.url) + '" target="_blank" rel="noopener nofollow">' + esc(z.bron) + '</a>: ' + esc((z.max && z.max !== 5 ? komma(String(+z.score.toFixed(1))) + '/' + z.max : komma(z.score.toFixed(1)) + '/5') + ' uit ' + z.aantal + ' reviews') + '</li>').join('') + v.map(z => '<li>' + esc(z.soort === 'review' ? 'Review op ' + z.bron : (z.soort === 'forum' ? 'Forum' : 'Artikel') + ' (' + z.bron + ')') + ': ' + (z.url ? '<a href="' + esc(z.url) + '" target="_blank" rel="noopener nofollow">' + esc(z.titel) + '</a>' : esc(z.titel)) + (TOON[z.toon] ? ' · ' + TOON[z.toon] : '') + '</li>').join('') + '</ul>'; };
const bronTekst = z => z.bron + ' ' + (z.max && z.max !== 5 ? komma(String(+z.score.toFixed(1))) + '/' + z.max : komma(z.score.toFixed(1))) + ' (' + z.aantal + ')';
const sterRegel = (x, o) => { const b = bronnen(x); if (!b.length) return ''; const C = o != null ? o : (x._o ?? null); return '<span class="sc">' + (C != null ? '★ ' + komma(C.toFixed(1)) + ' onze score · ' : '') + b.map(bronTekst).join(' · ') + '</span>'; };
const compleet = x => (x.tel ? 2 : 0) + (x.web ? 1 : 0) + (rooster(x.uren) ? 2 : 0) + (x.adres ? 1 : 0);
const afstand = (a, b) => { const r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lon - a.lon) * r; const h = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
const datumNL = iso => new Date(iso).toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const ORG = { '@type': 'Organization', '@id': 'https://keuzehulp.best/#org', name: 'keuzehulp.best', url: 'https://keuzehulp.best/' };

const CSS = lookNieuw() + '.zaken{list-style:none;padding:0;margin:20px 0 0;border-top:1px solid var(--line)}.zaken li[hidden]{display:none}.zaken li{border-bottom:1px solid var(--line);padding:14px 0;display:grid;gap:4px}.zaken .n{font-weight:700;font-size:18px}.zaken .n a{text-decoration:none}.zaken .w{font-size:16px}.sc{font-size:16px;font-weight:700}.nu{font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px}.nu i{width:9px;height:9px;border-radius:50%;background:#1F7A4D;flex:none}.nu.dicht i{background:#B3261E}.kn{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 0}.kn a{font-size:16px;font-weight:700;border:1.5px solid var(--acc);color:var(--acc)!important;border-radius:999px;padding:6px 14px;text-decoration:none}.kn a.h{background:var(--acc);color:#fff!important}.fl{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 6px}.fl button{font:inherit;font-size:16px;font-weight:700;border:1.5px solid var(--acc);background:transparent;color:var(--acc);border-radius:999px;padding:6px 14px;cursor:pointer}.fl button[aria-pressed=true]{background:var(--acc);color:#fff}.feit{list-style:none;padding:0;margin:16px 0}.feit li{padding:8px 0;border-bottom:1px solid var(--line)}';
function doc({ titel, desc, pad, body, schema, noindex }) {
  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(titel) + '</title><meta name="description" content="' + esc(desc) + '"><link rel="canonical" href="https://' + HOST + pad + '">' + (noindex ? '<meta name="robots" content="noindex,follow">' : '') +
    '<link rel="icon" href="data:,"><style>' + CSS + '</style><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, '\\u003c') + '</script></head><body><header class="topbar"><div class="wrap"><a class="mark" href="/">keuzehulp<em>.best</em></a><nav class="topnav"><a href="/rotterdam">Rotterdam</a></nav></div></header><main><div class="wrap">' + body +
    '</div></main><footer><div class="wrap"><p>Gegevens uit OpenStreetMap (© OpenStreetMap-bijdragers, ODbL) en reviewscores van Google, Zorgkaart, Trustpilot en andere bronnen met link; de ranglijst is onze eigen berekening. Klopt er iets niet? Pas het aan op OpenStreetMap; wij nemen het bij de volgende verversing over. Niemand betaalt voor een plek in deze lijst.</p></div></footer>' + TIK_JS + '</body></html>';
}
const TIK_JS = '<script>document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[data-t]");if(!a)return;try{navigator.sendBeacon("/api/keuze-tools?tool=rdam&op=tik",new Blob([JSON.stringify({d:a.getAttribute("data-d"),s:a.getAttribute("data-s"),e:a.getAttribute("data-t")})],{type:"text/plain"}))}catch(x){}},true)</script>';
// de chat van keuzehulp.best (lib/kzux.js) bovenaan elke Rotterdam-pagina (Henkjan 16 nov 2026: "centrum is keuzehulp met intelligente chat overal boven en de notify me functie")
const chat = (d, faq) => kzuxBlok({ alleenChat: true, kop: 'Vraag het de keuzehulp', taal: 'nl', site: 'kzuxrdam', slug: 'rotterdam-' + d.slug, term: d.naam.toLowerCase() + ' in Rotterdam', shop: '', prods: [], opties: [], faq: faq.map(([q, a]) => ({ q, a })) });
function knoppen(d, x) {
  const at = t => ' data-t="' + t + '" data-d="' + d.slug + '" data-s="' + esc(x.s) + '"';
  return '<div class="kn">' + (x.tel ? '<a class="cta h" href="tel:' + esc(telLink(x.tel)) + '"' + at('bel') + '>Bel ' + esc(telTekst(x.tel)) + '</a>' : '') + '<a class="cta" href="' + esc(routeLink(x)) + '" target="_blank" rel="noopener nofollow"' + at('route') + '>Route</a>' + (x.web ? '<a class="cta" href="' + esc(webLink(x.web)) + '" target="_blank" rel="noopener nofollow"' + at('web') + '>Website</a>' : '') + '</div>';
}

// ---------- pagina's ----------
export async function hub() {
  const v = await Promise.all(DIENSTEN.map(d => data(d.slug)));
  const rij = DIENSTEN.map((d, i) => ({ d, n: (v[i] && v[i].n) || 0 })).filter(x => x.n >= MIN);
  const tot = rij.reduce((a, x) => a + x.n, 0);
  const body = '<p class="crumbs"><a href="/">keuzehulp.best</a> › Rotterdam</p><h1>Diensten in Rotterdam vergelijken</h1><div class="answer"><p>Alle ' + tot + ' zaken in de gemeente Rotterdam in ' + rij.length + ' soorten diensten, met wie nu open is en bellen, route en website in één tik. Gegevens uit OpenStreetMap, elke week ververst.</p></div><ul class="cards">' +
    rij.map(x => '<li><a href="/rotterdam/' + x.d.slug + '">' + esc(x.d.naam) + '</a><span>' + x.n + ' ' + esc(x.d.mv) + '</span></li>').join('') + '</ul>';
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'CollectionPage', name: 'Diensten in Rotterdam vergelijken', url: BASIS, inLanguage: 'nl-NL', publisher: { '@id': ORG['@id'] }, hasPart: rij.map(x => ({ '@type': 'WebPage', name: x.d.naam + ' in Rotterdam', url: BASIS + '/' + x.d.slug })) }] };
  return doc({ titel: 'Diensten in Rotterdam: ' + tot + ' zaken, nu open en bellen', desc: 'Tandarts, loodgieter, kapper, garage en meer in Rotterdam: alle ' + tot + ' zaken met tijden, telefoon en route. Uit OpenStreetMap, elke week ververst.', pad: '/rotterdam', body, schema });
}

export async function dienstPagina(slug) {
  const d = D[slug]; if (!d) return null; const x0 = await data(slug); if (!x0 || !x0.items.length) return null;
  const rij = rangschik(x0.items).map(r => ({ ...r, R: rooster(r.x.uren) })); const metScore = rij.filter(r => r.o != null); const top = metScore.filter(r => bronnen(r.x).reduce((t, z) => t + z.aantal, 0) >= 20).slice(0, 3);
  const nu = new Date(), open = rij.filter(r => { const s = status(r.R, nu); return s && s.open; }).length, mTel = rij.filter(r => r.x.tel).length;
  const kop = metScore.length >= 5 ? 'Beste ' + d.naam.toLowerCase() + ' in Rotterdam' : d.naam + ' in Rotterdam kiezen';
  const li = rij.map(({ x, R, o }, i) => { const s = status(R, nu); return '<li data-open="' + (s && s.open ? 1 : 0) + '" data-web="' + (x.web ? 1 : 0) + '" data-lat="' + x.lat + '" data-lon="' + x.lon + '"><span class="n">' + (o != null ? (i + 1) + '. ' : '') + '<a href="/rotterdam/' + d.slug + '/' + esc(x.s) + '">' + esc(x.naam) + '</a></span>' + sterRegel(x, o) + (x.adres ? '<span class="w">' + esc(x.adres + (x.pc ? ', ' + x.pc : '')) + '</span>' : '') + (s ? '<span class="nu' + (s.open ? '' : ' dicht') + '"><i></i>' + esc(statusTekst(s)) + '</span>' : '') + knoppen(d, x) + '</li>'; }).join('');
  const filter = '<div class="fl"><button type="button" data-f="open" aria-pressed="false">Nu open</button><button type="button" data-f="web" aria-pressed="false">Met website</button><button type="button" data-f="dicht" aria-pressed="false">Dichtbij mij</button></div>';
  const fjs = '<script>(function(){var L=document.getElementById("zl"),F={};function zet(){[].forEach.call(L.children,function(li){li.hidden=(F.open&&li.dataset.open!=="1")||(F.web&&li.dataset.web!=="1")})}document.querySelector(".fl").addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;var f=b.dataset.f,on=b.getAttribute("aria-pressed")!=="true";if(f==="dicht"){if(!on||!navigator.geolocation)return;navigator.geolocation.getCurrentPosition(function(p){var a=p.coords;[].slice.call(L.children).map(function(li){var dl=li.dataset.lat-a.latitude,dn=(li.dataset.lon-a.longitude)*0.6;li._d=dl*dl+dn*dn;return li}).sort(function(x,y){return x._d-y._d}).forEach(function(li){L.appendChild(li)});b.setAttribute("aria-pressed","true")});return}b.setAttribute("aria-pressed",on?"true":"false");F[f]=on;zet()})})()</script>';
  const datum = datumNL(x0.t);
  const body = '<p class="crumbs"><a href="/rotterdam">Rotterdam</a> › ' + esc(d.naam) + '</p><h1>' + esc(kop) + '</h1>' + chat(d, d.faq) + '<div class="answer">' + (top.length >= 3 ? '<p><strong>Best beoordeeld: </strong>' + top.map(t => '<a href="/rotterdam/' + d.slug + '/' + esc(t.x.s) + '">' + esc(t.x.naam) + '</a> (' + komma(t.o.toFixed(1)) + ', ' + bronnen(t.x).reduce((q, z) => q + z.aantal, 0) + ' reviews uit ' + bronnen(t.x).length + (bronnen(t.x).length === 1 ? ' bron' : ' bronnen') + ')').join(', ') + '.</p>' : '') + '<p>Alle ' + rij.length + ' ' + esc(d.mv) + ' in de gemeente Rotterdam' + (open ? ', ' + open + ' nu open' : '') + '. ' + (metScore.length ? 'Onze score combineert alle reviewbronnen die we vinden (Google, Zorgkaart, Trustpilot, Werkspot, Klantenvertellen en meer), elk gewogen naar het aantal reviews, zodat een paar losse 5-sterren minder tellen dan honderden goede reviews. Vermeldingen op Reddit, fora en in artikelen tellen licht mee. Zonder reviews telt hoe compleet de gegevens zijn.' : 'Bovenaan staan de zaken met de meest complete gegevens.') + ' Niemand betaalt voor een plek.</p><p><time datetime="' + x0.t.slice(0, 10) + '">Bijgewerkt ' + esc(datum) + '</time></p></div>' +
    '<h2>Zo kies je ' + esc(d.een) + '</h2><ul>' + d.tips.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
    '<h2>Alle ' + rij.length + ' ' + esc(d.mv) + ' in Rotterdam</h2>' + filter + '<ul class="zaken" id="zl">' + li + '</ul>' + fjs +
    gidsBlok(await passendeGidsen(d)) + '<h2>Vragen over ' + esc(d.mv) + ' in Rotterdam</h2>' + d.faq.map(([q, a]) => '<details class="faq"><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('') +
    '<p class="rel">Ook in Rotterdam: ' + zichtbaar(await tellingen()).filter(x => x.slug !== slug).map(x => '<a href="/rotterdam/' + x.slug + '">' + esc(x.naam.toLowerCase()) + '</a>').join(', ') + '</p>';
  const schema = { '@context': 'https://schema.org', '@graph': [ORG,
    { '@type': 'WebPage', '@id': BASIS + '/' + slug, url: BASIS + '/' + slug, name: kop, inLanguage: 'nl-NL', dateModified: x0.t, publisher: { '@id': ORG['@id'] }, mainEntity: { '@id': BASIS + '/' + slug + '#lijst' } },
    { '@type': 'ItemList', '@id': BASIS + '/' + slug + '#lijst', name: d.mv + ' in Rotterdam', numberOfItems: rij.length, itemListElement: rij.slice(0, 100).map(({ x }, i) => ({ '@type': 'ListItem', position: i + 1, url: BASIS + '/' + slug + '/' + x.s, name: x.naam })) },
    { '@type': 'FAQPage', mainEntity: d.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] };
  const t1 = metScore.length >= 5 ? 'Beste ' + d.naam.toLowerCase() + ' Rotterdam: ' + rij.length + ' ' + d.mv + ' gerangschikt' : d.naam + ' Rotterdam: alle ' + rij.length + ' ' + d.mv + ', nu open';
  return doc({ titel: t1.length <= 60 ? t1 : (metScore.length >= 5 ? 'Beste ' + d.naam.toLowerCase() + ' Rotterdam: top ' + rij.length : d.naam + ' Rotterdam: alle ' + rij.length + ', nu open'), desc: ((top.length ? 'Best beoordeeld: ' + top[0].x.naam + ' (' + komma(top[0].o.toFixed(1)) + '). ' : '') + 'Alle ' + rij.length + ' ' + d.mv + ' in Rotterdam gerangschikt op reviews, met tijden en telefoon.').slice(0, 155), pad: '/rotterdam/' + slug, body, schema, noindex: rij.length < MIN });
}

export async function zaakPagina(slug, s) {
  const d = D[slug]; if (!d) return null; const x0 = await data(slug); const x = x0 && x0.items.find(i => i.s === s); if (!x) return null;
  const R = rooster(x.uren), st = status(R), dicht = x0.items.filter(i => i.s !== s).map(i => ({ i, km: afstand(x, i) })).sort((a, b) => a.km - b.km).slice(0, 4);
  const rang = rangschik(x0.items), plek = rang.findIndex(r => r.x.s === s) + 1, mS = rang.filter(r => r.o != null).length; const oV = {}; rang.forEach(r => { oV[r.x.s] = r.o; });
  const feiten = [x.adres ? 'Adres: ' + x.adres + (x.pc ? ', ' + x.pc : '') + ' ' + x.plaats : '', x.tel ? 'Telefoon: ' + telTekst(x.tel) : '', x.web ? 'Website: ' + webTekst(x.web) : '', x.rolstoel === 'yes' ? 'Rolstoeltoegankelijk' : ''].filter(Boolean);
  const body = '<p class="crumbs"><a href="/rotterdam">Rotterdam</a> › <a href="/rotterdam/' + d.slug + '">' + esc(d.naam) + '</a></p><h1>' + esc(x.naam) + '</h1><p>' + esc(d.naam) + ' in Rotterdam' + (oV[s] != null && plek <= mS ? ' · plek ' + plek + ' van ' + x0.items.length + ' in <a href="/rotterdam/' + d.slug + '">onze ranglijst</a>' : '') + '</p>' + (sterRegel(x, oV[s]) ? '<p>' + sterRegel(x, oV[s]) + '</p>' : '') +
    (st ? '<p class="nu' + (st.open ? '' : ' dicht') + '"><i></i>' + esc(statusTekst(st)) + '</p>' : '') + knoppen(d, x) + chat(d, d.faq) +
    '<ul class="feit">' + feiten.map(f => '<li>' + esc(f) + '</li>').join('') + (R ? '<li>' + weekRegels(R).map(esc).join('<br>') + '</li>' : x.uren ? '<li>Openingstijden: ' + esc(x.uren) + '</li>' : '') + '</ul>' +
    wieZegt(x) + '<h2>Waar je op let bij ' + esc(d.een) + '</h2><ul>' + d.tips.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
    (dicht.length ? '<h2>Andere ' + esc(d.mv) + ' dichtbij</h2><ul class="zaken">' + dicht.map(({ i, km }) => '<li><span class="n"><a href="/rotterdam/' + d.slug + '/' + esc(i.s) + '">' + esc(i.naam) + '</a></span>' + sterRegel(i, oV[i.s]) + '<span class="w">' + (km < 1 ? Math.round(km * 1000) + ' m' : km.toFixed(1).replace('.', ',') + ' km') + (i.adres ? ' · ' + esc(i.adres) : '') + '</span></li>').join('') + '</ul>' : '') +
    '<p class="rel">Ook in Rotterdam: ' + zichtbaar(await tellingen()).filter(z => z.slug !== slug).map(z => '<a href="/rotterdam/' + z.slug + '">' + esc(z.naam.toLowerCase()) + '</a>').join(', ') + '</p>' + '<p class="rel"><a href="/rotterdam/' + d.slug + '">Alle ' + x0.items.length + ' ' + esc(d.mv) + ' in Rotterdam</a> · <a href="' + esc(osmLink(x)) + '" rel="nofollow">Gegevens aanpassen op OpenStreetMap</a></p>';
  const lb = { '@type': d.type, '@id': BASIS + '/' + slug + '/' + s + '#zaak', name: x.naam, url: x.web ? webLink(x.web) : undefined, telephone: x.tel ? telLink(x.tel) : undefined, geo: { '@type': 'GeoCoordinates', latitude: x.lat, longitude: x.lon },
    address: x.adres ? { '@type': 'PostalAddress', streetAddress: x.adres, postalCode: x.pc || undefined, addressLocality: x.plaats, addressCountry: 'NL' } : undefined, openingHours: R && x.uren ? x.uren : undefined };
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebPage', url: BASIS + '/' + slug + '/' + s, name: x.naam, dateModified: x0.t, inLanguage: 'nl-NL', publisher: { '@id': ORG['@id'] }, about: { '@id': lb['@id'] } }, lb] };
  const t1 = x.naam + ': ' + d.naam.toLowerCase() + ' Rotterdam, tijden en telefoon';
  return doc({ titel: t1.length <= 60 ? t1 : x.naam.slice(0, 40) + ', ' + d.naam.toLowerCase() + ' Rotterdam', desc: x.naam + (x.adres ? ', ' + x.adres : '') + ' in Rotterdam: ' + (R ? 'openingstijden, ' : '') + (x.tel ? 'telefoon, ' : '') + 'route en ' + d.mv + ' in de buurt.', pad: '/rotterdam/' + slug + '/' + s, body, schema, noindex: compleet(x) < 3 || x0.items.length < MIN });
}

export async function sitemap() {
  const urls = [BASIS]; for (const d of DIENSTEN) { const x = await data(d.slug); if (!x || x.items.length < MIN) continue; urls.push(BASIS + '/' + d.slug); x.items.forEach(i => { if (compleet(i) >= 3) urls.push(BASIS + '/' + d.slug + '/' + i.s); }); }
  return { urls, xml: '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.map(u => '<url><loc>' + esc(u) + '</loc></url>').join('') + '</urlset>' };
}
export async function tik(b) {
  const d = D[b && b.d]; const e = ['bel', 'route', 'web'].includes(b && b.e) ? b.e : null; const s = String((b && b.s) || '').replace(/[^a-z0-9-]/g, '').slice(0, 90); if (!d || !e || !s) return { ok: false };
  await kv.raw(['HINCRBY', 'rdam:tik:' + d.slug, s + ':' + e, 1]).catch(() => {}); const dk = 'rdam:tik:dag:' + new Date().toISOString().slice(0, 10); await kv.raw(['HINCRBY', dk, d.slug + ':' + e, 1]).then(() => kv.raw(['EXPIRE', dk, String(90 * 86400)])).catch(() => {}); return { ok: true };
}
export async function stand() {
  const v = await Promise.all(DIENSTEN.map(d => data(d.slug)));
  return { ok: true, uitleg: 'Dienstengids Rotterdam (lib/rdam.js): per dienst alle zaken uit OpenStreetMap en Google-vermeldingen, gerangschikt op onze score (Google-beoordeling gewogen naar aantal reviews), met tikken (bellen, route, website).', diensten: DIENSTEN.map((d, i) => { const x = v[i]; return { dienst: d.slug, n: x ? x.n : 0, bijgewerkt: x ? x.t : null, metTel: x ? x.items.filter(z => z.tel).length : 0, metTijden: x ? x.items.filter(z => rooster(z.uren)).length : 0, geindexeerd: x ? x.items.filter(z => compleet(z) >= 3).length : 0, metScore: x ? x.items.filter(z => z.score).length : 0, google: x ? x.google || null : null }; }) };
}
// voor de intentiechat (lib/kzchat.js): elke Rotterdam-gids als keuzehulp, met tips, FAQ en de zaken (naam, adres, telefoon, tijden) als kennis
export async function chatItems() {
  const v = await Promise.all(DIENSTEN.map(d => data(d.slug))); const nu = new Date();
  return DIENSTEN.map((d, i) => ({ d, x: v[i] })).filter(o => o.x && o.x.items.length >= MIN).map(({ d, x }) => ({
    slug: 'rotterdam-' + d.slug, pad: '/rotterdam/' + d.slug, term: d.naam.toLowerCase() + ' rotterdam', title: d.naam + ' in Rotterdam kiezen',
    kort: 'Alle ' + x.items.length + ' ' + d.mv + ' in Rotterdam met tijden, telefoon en route (OpenStreetMap, bijgewerkt ' + x.t.slice(0, 10) + ').',
    uitleg: d.tips.join(' ') + ' Zaken in onze ranglijst (eerst de best beoordeelde, onze score combineert Google, Zorgkaart, Trustpilot en andere bronnen gewogen naar aantal reviews; naam, scores per bron, adres, telefoon, nu): ' + rangschik(x.items).map(r => r.x).slice(0, 60).map(z => { const st = status(rooster(z.uren), nu); return z.naam + (bronnen(z).length ? ', ' + bronnen(z).map(q => q.bron + ' ' + q.score + (q.max !== 5 ? '/' + q.max : '') + ' uit ' + q.aantal).join(', ') : '') + (z.adres ? ', ' + z.adres : '') + (z.tel ? ', tel ' + telTekst(z.tel) : '') + (st ? ', ' + statusTekst(st) : ''); }).join('; '),
    faq: d.faq.map(([q, a]) => ({ q, a })) }));
}
// productkeuzehulpen die bij een dienst passen (bestaande keuzehulpen op keuzehulp.best, op woorden in de slug)
async function passendeGidsen(d) {
  try { const { allItems } = await import('../api/kz.js'); const l = await allItems(); return l.filter(i => i && i.slug && (d.gidsW || []).some(w => i.slug.includes(w))).slice(0, 4).map(i => ({ slug: i.slug, t: i.title || i.slug })); } catch (e) { return []; }
}
const gidsBlok = g => g.length ? '<h2>Handig erbij</h2><ul>' + g.map(x => '<li><a href="/' + esc(x.slug) + '">' + esc(x.t) + '</a></li>').join('') + '</ul>' : '';
// llms.txt van keuzehulp.best: één kopje Rotterdam met elke getoonde dienst
export async function llmsDeel() {
  const n = await tellingen(); const z = zichtbaar(n); if (!z.length) return '';
  return '\n\n## Diensten in Rotterdam ([alle](' + BASIS + '))\n\n' + z.map(d => '- [' + d.naam + ' in Rotterdam](' + BASIS + '/' + d.slug + '): alle ' + n[d.slug] + ' ' + d.mv + ' in de gemeente Rotterdam met openingstijden, telefoon en route, uit OpenStreetMap. ' + d.tips[0]).join('\n');
}
// IndexNow voor nieuwe URL's (één keer per URL)
export async function meldNieuw() {
  const { createHash } = await import('node:crypto'); const hk = u => createHash('sha1').update(u).digest('hex').slice(0, 10);
  const gezien = new Set((await kv.get('rdam:ping').catch(() => null)) || []); const { urls } = await sitemap(); const nieuw = urls.filter(u => !gezien.has(hk(u))); if (!nieuw.length) return { nieuw: 0 };
  const key = '466971cbc1bbe43e6bb64a94465e4470';
  const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: HOST, key, keyLocation: 'https://' + HOST + '/' + key + '.txt', urlList: nieuw.slice(0, 9000) }), signal: AbortSignal.timeout(20000) }).catch(() => null);
  if (r && r.status < 300) { nieuw.forEach(u => gezien.add(hk(u))); await kv.set('rdam:ping', [...gezien]).catch(() => {}); }
  return { nieuw: nieuw.length, status: r ? r.status : 'fout' };
}
