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

export async function merchantStand(tok, acc) {
  const a = `accounts/${acc}`;
  const [issues, info, home, verzend, retour] = await Promise.all([
    veilig(tok, `accounts/{v}/${a}/issues?languageCode=nl&pageSize=100`), veilig(tok, `accounts/{v}/${a}/businessInfo`), veilig(tok, `accounts/{v}/${a}/homepage`),
    veilig(tok, `accounts/{v}/${a}/shippingSettings`), veilig(tok, `accounts/{v}/${a}/onlineReturnPolicies`)]);
  if (issues.fout && issues.status === 403) return { ok: false, account: acc, fout: issues.fout, oplossing: 'Voeg seo-leerlus@hjdk-seo.iam.gserviceaccount.com toe als gebruiker in Merchant Center (Instellingen > Mensen en toegang), en zet de Merchant API aan in Google Cloud-project hjdk-seo.' };
  // producten: status per bestemming en meldingen per product
  const tel = {}, best = {}; let n = 0, goed = 0, afgekeurd = 0, wacht = 0, pagina = '', fout = null;
  for (let i = 0; i < 20; i++) {
    let j; try { j = await get(tok, `products/{v}/${a}/products?pageSize=1000${pagina ? '&pageToken=' + encodeURIComponent(pagina) : ''}`); } catch (e) { fout = e.message; break; }
    for (const p of j.products || []) {
      n++; const st = p.productStatus || {};
      const ds = st.destinationStatuses || []; const af = ds.some(d => (d.disapprovedCountries || []).length), w = ds.some(d => (d.pendingCountries || []).length);
      if (af) afgekeurd++; else if (w) wacht++; else goed++;
      for (const x of st.itemLevelIssues || []) {
        const k = [x.severity, x.code, x.attribute || ''].join('|');
        const t = tel[k] || (tel[k] = { ernst: x.severity, code: x.code, veld: x.attribute || null, wat: x.description, uitleg: x.detail, oplossing: x.resolution, waar: x.reportingContext, producten: 0, voorbeelden: [] });
        t.producten++; if (t.voorbeelden.length < 3) t.voorbeelden.push(p.offerId || p.name);
      }
    }
    pagina = j.nextPageToken; if (!pagina) break;
  }
  const ernstVolg = { DISAPPROVED: 0, NOT_IMPACTED: 2, DEMOTED: 1 };
  return { ok: !fout, account: acc, at: new Date().toISOString(),
    producten: { totaal: n, goedgekeurd: goed, afgekeurd, inBehandeling: wacht }, productFout: fout,
    productMeldingen: Object.values(tel).sort((x, y) => (ernstVolg[x.ernst] ?? 3) - (ernstVolg[y.ernst] ?? 3) || y.producten - x.producten),
    accountMeldingen: issues.fout ? { fout: issues.fout } : (issues.accountIssues || []).map(x => ({ titel: x.title, ernst: x.severity, gevolg: (x.impactedDestinations || []).map(d => d.reportingContext + ': ' + (d.impacts || []).map(i => i.severity + ' ' + i.regionCode).join(', ')).join('; '), uitleg: x.detail, link: x.documentationUri })),
    bedrijf: info.fout ? { fout: info.fout } : { adres: !!info.address, telefoon: !!info.phone, telefoonGeverifieerd: info.phoneVerificationState || null, klantenservice: !!info.customerService },
    website: home.fout ? { fout: home.fout } : { url: home.uri, geclaimd: !!home.claimed },
    verzending: verzend.fout ? { fout: verzend.fout } : { diensten: (verzend.services || []).map(s => ({ naam: s.serviceName, land: (s.deliveryCountries || []).join(','), actief: s.active, levertijd: s.deliveryTime ? { verwerking: [s.deliveryTime.minHandlingDays, s.deliveryTime.maxHandlingDays], onderweg: [s.deliveryTime.minTransitDays, s.deliveryTime.maxTransitDays] } : null })) },
    retour: retour.fout ? { fout: retour.fout } : { beleid: (retour.onlineReturnPolicies || []).map(r => ({ naam: r.label, landen: r.countries, dagen: r.policy && r.policy.days, type: r.policy && r.policy.type, kosten: r.returnShippingFee ? r.returnShippingFee.type : null })) } };
}
