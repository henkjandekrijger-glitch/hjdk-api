// Merchant Center (Yoors 5875752564) uitlezen via de Merchant API met het serviceaccount van Search Console (lib/gsc.js token, scope content).
// Vereist: het serviceaccount seo-leerlus@hjdk-seo.iam.gserviceaccount.com als gebruiker in Merchant Center, en de Merchant API aan in Google Cloud-project hjdk-seo.
// Alleen lezen. Geeft per melding het aantal producten, zodat duidelijk is wat het meeste oplevert om te repareren.
const API = 'https://merchantapi.googleapis.com/';
async function get(tok, pad) {
  let laatste = null;
  for (const v of ['v1', 'v1beta']) {
    const r = await fetch(API + pad.replace('{v}', v), { headers: { authorization: 'Bearer ' + tok }, signal: AbortSignal.timeout(20000) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) return j;
    laatste = { status: r.status, fout: String((j.error && j.error.message) || JSON.stringify(j)).slice(0, 300) };
    if (r.status !== 404) break;
  }
  throw Object.assign(new Error(laatste.fout), { status: laatste.status });
}
const veilig = async (tok, pad) => { try { return await get(tok, pad); } catch (e) { return { fout: e.message, status: e.status }; } };

// Eenmalig: het Google Cloud-project koppelen aan het Merchant-account (vereist sinds 2025; het serviceaccount is beheerder).
async function registreer(tok, acc, email) {
  for (const v of ['v1', 'v1beta']) {
    const r = await fetch(`${API}accounts/${v}/accounts/${acc}/developerRegistration:registerGcp`, { method: 'POST', headers: { authorization: 'Bearer ' + tok, 'content-type': 'application/json' }, body: JSON.stringify({ developerEmail: email }), signal: AbortSignal.timeout(20000) });
    const j = await r.json().catch(() => ({})); if (r.ok) return { ok: true, v, j }; if (r.status !== 404) return { ok: false, status: r.status, fout: String((j.error && j.error.message) || JSON.stringify(j)).slice(0, 300) };
  }
  return { ok: false, fout: 'registerGcp niet gevonden' };
}
export async function merchantStand(tok, acc, opt = {}) {
  const a = `accounts/${acc}`;
  const proef = await veilig(tok, `accounts/{v}/${a}/homepage`);
  let registratie = null;
  if (opt.dev || (proef.fout && /not registered|API_DEVELOPER/i.test(proef.fout))) registratie = await registreer(tok, acc, opt.dev || 'seo-leerlus@hjdk-seo.iam.gserviceaccount.com'); // ontwikkelaar = het serviceaccount zelf (al geverifieerde gebruiker)
  const bronnen = await veilig(tok, `datasources/{v}/${a}/dataSources?pageSize=100`);
  const [issues, info, home, verzend, retour] = await Promise.all([
    veilig(tok, `accounts/{v}/${a}/issues?languageCode=nl&pageSize=100`), veilig(tok, `accounts/{v}/${a}/businessInfo`), veilig(tok, `accounts/{v}/${a}/homepage`),
    veilig(tok, `accounts/{v}/${a}/shippingSettings`), veilig(tok, `accounts/{v}/${a}/onlineReturnPolicies`)]);
  if (issues.fout && issues.status === 403) return { ok: false, account: acc, fout: issues.fout, oplossing: 'Voeg seo-leerlus@hjdk-seo.iam.gserviceaccount.com toe als gebruiker in Merchant Center (Instellingen > Mensen en toegang), en zet de Merchant API aan in Google Cloud-project hjdk-seo.' };
  // producten: status per bestemming en meldingen per product
  const tel = {}, best = {}, perBron = {}; let n = 0, goed = 0, afgekeurd = 0, wacht = 0, pagina = '', fout = null;
  for (let i = 0; i < 20; i++) {
    let j; try { j = await get(tok, `products/{v}/${a}/products?pageSize=1000${pagina ? '&pageToken=' + encodeURIComponent(pagina) : ''}`); } catch (e) { fout = e.message; break; }
    for (const p of j.products || []) {
      n++; const st = p.productStatus || {}; const bron = p.dataSource || '?'; const B = perBron[bron] || (perBron[bron] = { producten: 0, afgekeurd: 0, voorbeelden: [] }); B.producten++; if (B.voorbeelden.length < 3) B.voorbeelden.push((p.offerId || '') + ' ' + String((p.productAttributes && p.productAttributes.title) || (p.attributes && p.attributes.title) || '').slice(0, 50));
      const ds = st.destinationStatuses || []; const af = ds.some(d => (d.disapprovedCountries || []).length), w = ds.some(d => (d.pendingCountries || []).length);
      if (af) { afgekeurd++; B.afgekeurd++; } else if (w) wacht++; else goed++;
      for (const x of st.itemLevelIssues || []) {
        const k = [x.severity, x.code, x.attribute || ''].join('|');
        const t = tel[k] || (tel[k] = { ernst: x.severity, code: x.code, veld: x.attribute || null, wat: x.description, uitleg: x.detail, oplossing: x.resolution, waar: x.reportingContext, producten: 0, voorbeelden: [] });
        t.producten++; if (t.voorbeelden.length < 3) t.voorbeelden.push(p.offerId || p.name);
      }
    }
    pagina = j.nextPageToken; if (!pagina) break;
  }
  const ernstVolg = { DISAPPROVED: 0, NOT_IMPACTED: 2, DEMOTED: 1 };
  return { ok: !fout, account: acc, at: new Date().toISOString(), registratie,
    producten: { totaal: n, goedgekeurd: goed, afgekeurd, inBehandeling: wacht }, productFout: fout, perBron, bronnen: bronnen.fout ? { fout: bronnen.fout } : (bronnen.dataSources || []).map(d => ({ naam: d.name, titel: d.displayName, soort: d.primaryProductDataSource ? 'primair' : d.supplementalProductDataSource ? 'aanvullend' : Object.keys(d).filter(k => /DataSource$/.test(k)).join(','), invoer: d.input, bestand: d.fileInput ? (d.fileInput.fetchSettings || {}).fetchUri || d.fileInput.fileName : null, landen: d.primaryProductDataSource ? d.primaryProductDataSource.countries || (d.primaryProductDataSource.destinations || []).map(x => x.destination) : null })),
    productMeldingen: Object.values(tel).sort((x, y) => (ernstVolg[x.ernst] ?? 3) - (ernstVolg[y.ernst] ?? 3) || y.producten - x.producten),
    accountMeldingen: issues.fout ? { fout: issues.fout } : (issues.accountIssues || []).map(x => ({ titel: x.title, ernst: x.severity, gevolg: (x.impactedDestinations || []).map(d => d.reportingContext + ': ' + (d.impacts || []).map(i => i.severity + ' ' + i.regionCode).join(', ')).join('; '), uitleg: x.detail, link: x.documentationUri })),
    bedrijf: info.fout ? { fout: info.fout } : { adres: !!info.address, telefoon: !!info.phone, telefoonGeverifieerd: info.phoneVerificationState || null, klantenservice: !!info.customerService },
    website: home.fout ? { fout: home.fout } : { url: home.uri, geclaimd: !!home.claimed },
    verzending: verzend.fout ? { fout: verzend.fout } : { diensten: (verzend.services || []).map(s => ({ naam: s.serviceName, land: (s.deliveryCountries || []).join(','), actief: s.active, levertijd: s.deliveryTime ? { verwerking: [s.deliveryTime.minHandlingDays, s.deliveryTime.maxHandlingDays], onderweg: [s.deliveryTime.minTransitDays, s.deliveryTime.maxTransitDays] } : null })) },
    retour: retour.fout ? { fout: retour.fout } : { beleid: (retour.onlineReturnPolicies || []).map(r => ({ naam: r.label, landen: r.countries, dagen: r.policy && r.policy.days, type: r.policy && r.policy.type, kosten: r.returnShippingFee ? r.returnShippingFee.type : null })) } };
}

// Schrijven (alleen op Henkjans woord; 20 okt: "Ja zet uit in MC En zet dat goed de verzending").
async function stuur(tok, methode, pad, body) {
  let laatste = null;
  for (const v of ['v1', 'v1beta']) {
    const r = await fetch(API + pad.replace('{v}', v), { method: methode, headers: { authorization: 'Bearer ' + tok, 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) return { ok: true, v, antwoord: j };
    laatste = { ok: false, status: r.status, fout: String((j.error && j.error.message) || JSON.stringify(j)).slice(0, 400) };
    if (r.status !== 404) break;
  }
  return laatste;
}
// De automatische productbron (Google haalt zelf "producten" van de website) uit- of aanzetten.
export async function autofeed(tok, acc, aan) {
  const voor = await veilig(tok, `accounts/{v}/accounts/${acc}/autofeedSettings`);
  const zet = await stuur(tok, 'PATCH', `accounts/{v}/accounts/${acc}/autofeedSettings?updateMask=enableProducts`, { enableProducts: !!aan });
  return { voor, zet };
}
// Levertijd van alle verzenddiensten zetten (verwerking en onderweg in werkdagen); de rest van de verzendinstellingen blijft gelijk.
export async function levertijd(tok, acc, { minVerwerking = 1, maxVerwerking = 2, minOnderweg = 3, maxOnderweg = 4, tz = 'Europe/Amsterdam' } = {}) {
  const huidig = await get(tok, `accounts/{v}/accounts/${acc}/shippingSettings`);
  const nieuw = JSON.parse(JSON.stringify(huidig)); delete nieuw.name;
  for (const s of nieuw.services || []) s.deliveryTime = Object.assign({}, s.deliveryTime || {}, { minHandlingDays: minVerwerking, maxHandlingDays: maxVerwerking, minTransitDays: minOnderweg, maxTransitDays: maxOnderweg }, s.deliveryTime && s.deliveryTime.cutoffTime ? { cutoffTime: Object.assign({}, s.deliveryTime.cutoffTime, { timeZone: tz }) } : {});
  const zet = await stuur(tok, 'POST', `accounts/{v}/accounts/${acc}/shippingSettings:insert`, nieuw);
  return { voor: (huidig.services || []).map(s => s.deliveryTime), zet: zet.ok ? { ok: true, na: ((zet.antwoord || {}).services || []).map(s => s.deliveryTime) } : zet };
}

// Korte stand voor Babita's briefing, 1 uur bewaard (de volledige stand vraagt Google per keer een paar seconden).
export async function merchantKort(kv, tokFn, acc = '5875752564') {
  const k = 'hjdk:shop:mcstand'; const c = await kv.get(k).catch(() => null); if (c && Date.now() - c.at < 3600e3) return c;
  try {
    const tok = await tokFn(); const st = await merchantStand(tok, acc); const af = await veilig(tok, `accounts/{v}/accounts/${acc}/autofeedSettings`);
    const code = c2 => (st.productMeldingen || []).filter(x => x.code === c2 && x.ernst === 'DISAPPROVED').reduce((a, x) => a + x.producten, 0);
    const auto = Object.entries(st.perBron || {}).find(([n]) => (st.bronnen || []).some(b => b.naam === n && b.invoer === 'AUTOFEED'));
    const uit = { at: Date.now(), ok: !!(st.producten && st.producten.totaal), producten: st.producten, autofeedAan: !!(af && af.enableProducts), autofeedProducten: auto ? auto[1].producten : 0, autofeedAfgekeurd: auto ? auto[1].afgekeurd : 0, nietBeschikbaar: code('landing_page_error'), telefoonGeverifieerd: !!(st.bedrijf && st.bedrijf.telefoonGeverifieerd === 'PHONE_VERIFICATION_STATE_VERIFIED') };
    await kv.set(k, uit, { ex: 7200 }); return uit;
  } catch (e) { return c || { at: Date.now(), ok: false, fout: String(e.message || e).slice(0, 120) }; }
}
