// Merchant Center uitlezen (sinds 14 nov 2026 standaard Kadoly 5876502305, serviceaccount alleen-lezen; het oude Yoors 5875752564 met &account=) via de Merchant API met het serviceaccount van Search Console (lib/gsc.js token, scope content).
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
        t.producten++; const vb = p.offerId || p.name; if (t.voorbeelden.length < 25 && !t.voorbeelden.includes(vb)) t.voorbeelden.push(vb);
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

// 22 nov 2026 (Henkjan: "Ik wil dat je totaal optimaliseert de GMC icm g ads"): aanvullende bron met labels per product (go.kadoly.com/api/shop/gmclabels.csv:
// custom_label_0 prijspositie, _1 marge, _2 pakket, _3 seizoen), elke nacht opgehaald en gekoppeld aan de hoofdfeed, zodat de Shopping-campagne op marge kan splitsen.
// Vereist het serviceaccount als Admin in Merchant Center Kadoly (sinds 22 nov). Idempotent: bestaat de bron al, dan alleen koppelen en opnieuw ophalen.
export async function labelBron(tok, acc, { uri = 'https://go.kadoly.com/api/shop/gmclabels.csv', naam = 'Kadoly labels', proef = false } = {}) {
  const a = `accounts/${acc}`; const lijst = await get(tok, `datasources/{v}/${a}/dataSources?pageSize=100`); const alle = lijst.dataSources || [];
  const hoofd = alle.find(d => d.primaryProductDataSource && d.fileInput) || alle.find(d => d.primaryProductDataSource);
  if (!hoofd) return { ok: false, fout: 'geen hoofdfeed gevonden', bronnen: alle.map(d => d.displayName) };
  const pp = hoofd.primaryProductDataSource; const feedLabel = pp.feedLabel || 'NL', contentLanguage = pp.contentLanguage || 'nl';
  let extra = alle.find(d => d.supplementalProductDataSource && (d.displayName === naam || ((d.fileInput || {}).fetchSettings || {}).fetchUri === uri));
  const stappen = { hoofd: { naam: hoofd.name, titel: hoofd.displayName, feedLabel, contentLanguage, regel: pp.defaultRule || null } };
  if (proef) return { ok: true, proef: true, ...stappen, bestaat: !!extra };
  if (!extra) {
    const m = await stuur(tok, 'POST', `datasources/{v}/${a}/dataSources`, { displayName: naam, supplementalProductDataSource: { feedLabel, contentLanguage },
      fileInput: { fetchSettings: { enabled: true, frequency: 'FREQUENCY_DAILY', timeOfDay: { hours: 2 }, timeZone: 'Europe/Amsterdam', fetchUri: uri } } });
    if (!m.ok) return { ok: false, stap: 'maken', ...m, ...stappen }; extra = m.antwoord; stappen.gemaakt = extra.name;
  } else stappen.bestond = extra.name;
  const nu = ((pp.defaultRule || {}).takeFromDataSources || []); const al = nu.some(r => r.supplementalDataSourceName === extra.name);
  if (!al) { const regel = { takeFromDataSources: (nu.length ? nu : [{ self: true }]).concat([{ supplementalDataSourceName: extra.name }]) };
    const k = await stuur(tok, 'PATCH', `datasources/{v}/${hoofd.name}?updateMask=primaryProductDataSource.defaultRule`, { primaryProductDataSource: { defaultRule: regel } });
    stappen.koppel = k.ok ? { ok: true, regel: ((k.antwoord.primaryProductDataSource || {}).defaultRule) || regel } : k; } else stappen.koppel = { ok: true, al: true };
  const f = await stuur(tok, 'POST', `datasources/{v}/${extra.name}:fetch`, {}); stappen.ophalen = f.ok ? { ok: true } : f;
  return { ok: !!(stappen.koppel && stappen.koppel.ok), ...stappen };
}
// Labels van één product terugzien (controle na het ophalen van de labelbron).
export async function productLabels(tok, acc, id, { feedLabel = 'NL', taal = 'nl' } = {}) {
  const p = await veilig(tok, `products/{v}/accounts/${acc}/products/${encodeURIComponent(taal + '~' + feedLabel + '~' + id)}`);
  if (p.fout) return { id, fout: p.fout }; const at = p.productAttributes || p.attributes || {};
  return { id, titel: at.title, labels: [0, 1, 2, 3, 4].map(i => at['customLabel' + i] || null), bronnen: p.dataSource || null };
}

// Korte stand voor Babita's briefing, 1 uur bewaard (de volledige stand vraagt Google per keer een paar seconden).
export async function merchantKort(kv, tokFn, acc = '5876502305') {
  const k = 'hjdk:shop:mcstand'; const c = await kv.get(k).catch(() => null); if (c && Date.now() - c.at < 3600e3) return c;
  try {
    const tok = await tokFn(); const st = await merchantStand(tok, acc); const af = await veilig(tok, `accounts/{v}/accounts/${acc}/autofeedSettings`);
    const code = c2 => (st.productMeldingen || []).filter(x => x.code === c2 && x.ernst === 'DISAPPROVED').reduce((a, x) => a + x.producten, 0);
    const auto = Object.entries(st.perBron || {}).find(([n]) => (st.bronnen || []).some(b => b.naam === n && b.invoer === 'AUTOFEED'));
    const uit = { at: Date.now(), ok: !!(st.producten && st.producten.totaal), producten: st.producten, autofeedAan: !!(af && af.enableProducts), autofeedProducten: auto ? auto[1].producten : 0, autofeedAfgekeurd: auto ? auto[1].afgekeurd : 0, nietBeschikbaar: code('landing_page_error'), telefoonGeverifieerd: !!(st.bedrijf && st.bedrijf.telefoonGeverifieerd === 'PHONE_VERIFICATION_STATE_VERIFIED') };
    await kv.set(k, uit, { ex: 7200 }); return uit;
  } catch (e) { return c || { at: Date.now(), ok: false, fout: String(e.message || e).slice(0, 120) }; }
}

// 23 nov 2026 (Henkjan: "Zorg dat dit optimaliseert als een gek met onze produkten" en "Zorg dat je echt alles meet"): kliks en vertoningen per product
// uit Merchant Center, gratis vermeldingen (ORGANIC) en advertenties (ADS) apart. gk/gv = gratis kliks/vertoningen, bk/bv = betaald.
export async function prestaties(tok, acc, dagen = 14) {
  const d = n => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
  const query = `SELECT offer_id, marketing_method, clicks, impressions FROM product_performance_view WHERE date BETWEEN '${d(dagen)}' AND '${d(1)}'`;
  const uit = {}; let pagina = '', fout = null, rijen = 0;
  for (let i = 0; i < 30; i++) {
    let j = null;
    for (const v of ['v1', 'v1beta']) {
      const r = await fetch(`${API}reports/${v}/accounts/${acc}/reports:search`, { method: 'POST', headers: { authorization: 'Bearer ' + tok, 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ query, pageSize: 1000 }, pagina ? { pageToken: pagina } : {})), signal: AbortSignal.timeout(20000) });
      const x = await r.json().catch(() => ({}));
      if (r.ok) { j = x; break; }
      fout = r.status + ' ' + String((x.error && x.error.message) || '').slice(0, 200); if (r.status !== 404) break;
    }
    if (!j) break; fout = null;
    for (const row of j.results || []) { const p = row.productPerformanceView || {}; const id = String(p.offerId || ''); if (!id) continue; rijen++;
      const o = uit[id] || (uit[id] = { gk: 0, gv: 0, bk: 0, bv: 0 }); const g = /ORGANIC/i.test(String(p.marketingMethod || ''));
      o[g ? 'gk' : 'bk'] += Number(p.clicks || 0); o[g ? 'gv' : 'bv'] += Number(p.impressions || 0); }
    pagina = j.nextPageToken || ''; if (!pagina) break;
  }
  return { ok: !fout, fout, van: d(dagen), tot: d(1), rijen, producten: uit };
}

// 23 nov 2026 (Henkjan: "Ja onderzoek en optimaliseer totaal ."): waarom de gratis vermeldingen bijna niets tonen. Leest per product de status per kanaal
// (FREE_LISTINGS, SHOPPING_ADS, ...), de prijsbenchmark van Google (price_competitiveness_product_view) en het prijsadvies (price_insights_product_view).
async function rapport(tok, acc, query, max = 20) {
  const rijen = []; let pagina = '', fout = null;
  for (let i = 0; i < max; i++) {
    let j = null;
    for (const v of ['v1', 'v1beta']) {
      const r = await fetch(`${API}reports/${v}/accounts/${acc}/reports:search`, { method: 'POST', headers: { authorization: 'Bearer ' + tok, 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ query, pageSize: 1000 }, pagina ? { pageToken: pagina } : {})), signal: AbortSignal.timeout(20000) });
      const x = await r.json().catch(() => ({})); if (r.ok) { j = x; break; }
      fout = r.status + ' ' + String((x.error && x.error.message) || '').slice(0, 200); if (r.status !== 404) break;
    }
    if (!j) break; fout = null; rijen.push(...(j.results || [])); pagina = j.nextPageToken || ''; if (!pagina) break;
  }
  return { rijen, fout };
}
const bedrag = m => m && m.amountMicros != null ? Number(m.amountMicros) / 1e6 : null;
export async function prijsAdvies(tok, acc) {
  const [b, a] = await Promise.all([
    rapport(tok, acc, "SELECT offer_id, title, price, benchmark_price FROM price_competitiveness_product_view WHERE report_country_code = 'NL'"),
    rapport(tok, acc, 'SELECT offer_id, title, price, suggested_price, predicted_impressions_change_fraction, predicted_clicks_change_fraction, predicted_conversions_change_fraction, effectiveness FROM price_insights_product_view')]);
  const uit = {};
  for (const r of b.rijen) { const p = r.priceCompetitivenessProductView || {}; const id = String(p.offerId || ''); if (!id) continue; const o = uit[id] || (uit[id] = { titel: p.title }); o.prijs = bedrag(p.price); o.benchmark = bedrag(p.benchmarkPrice); }
  for (const r of a.rijen) { const p = r.priceInsightsProductView || {}; const id = String(p.offerId || ''); if (!id) continue; const o = uit[id] || (uit[id] = { titel: p.title }); o.prijs = o.prijs ?? bedrag(p.price); o.advies = bedrag(p.suggestedPrice);
    o.meerVert = p.predictedImpressionsChangeFraction != null ? Math.round(p.predictedImpressionsChangeFraction * 100) : null; o.meerKliks = p.predictedClicksChangeFraction != null ? Math.round(p.predictedClicksChangeFraction * 100) : null;
    o.meerConv = p.predictedConversionsChangeFraction != null ? Math.round(p.predictedConversionsChangeFraction * 100) : null; o.effect = p.effectiveness || null; }
  return { ok: !b.fout || !a.fout, foutBenchmark: b.fout, foutAdvies: a.fout, producten: uit };
}
export async function kanaalStatus(tok, acc) {
  const a = `accounts/${acc}`, tel = {}, redenen = {}; let n = 0, pagina = '', fout = null;
  for (let i = 0; i < 20; i++) {
    let j; try { j = await get(tok, `products/{v}/${a}/products?pageSize=1000${pagina ? '&pageToken=' + encodeURIComponent(pagina) : ''}`); } catch (e) { fout = e.message; break; }
    for (const p of j.products || []) { n++; const st = p.productStatus || {};
      for (const d of st.destinationStatuses || []) { const k = d.reportingContext || '?'; const t = tel[k] || (tel[k] = { goed: 0, wacht: 0, af: 0 }); if ((d.approvedCountries || []).length) t.goed++; else if ((d.pendingCountries || []).length) t.wacht++; else if ((d.disapprovedCountries || []).length) t.af++; }
      for (const x of st.itemLevelIssues || []) if (/FREE_LISTINGS/.test(x.reportingContext || '')) { const k = x.code + (x.attribute ? ' (' + x.attribute + ')' : ''); redenen[k] = (redenen[k] || 0) + 1; } }
    pagina = j.nextPageToken; if (!pagina) break;
  }
  return { ok: !fout, fout, producten: n, perKanaal: tel, meldingenGratis: Object.entries(redenen).sort((x, y) => y[1] - x[1]).slice(0, 15) };
}
