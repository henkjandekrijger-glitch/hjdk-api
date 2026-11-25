// Kadoly koopcheck, 25 Nov 2026. Only explicit supplier facts: no AI estimates of dimensions, load or material.
// Shared by the browser enhancement and the modal's fixed/AI answers. No new subscription, cookie or API call.
export function returnPolicy(listing = {}) {
  const id = String(listing.id || '');
  if (listing.type === 'digital') return { cost: 'digital', days: null };
  if (id.startsWith('dp_')) return { cost: 'buyer', days: 14 };
  if (/^(oc_|c2b_|sh_|pf_)/.test(id) && Number(listing.seller_id || 0) === 0) return { cost: 'free', days: 14 };
  if (Number(listing.seller_id) > 0) return { cost: 'buyer', days: 14 };
  return { cost: 'unknown', days: 14 };
}

export function returnAnswer(ctx = {}) {
  const id = String(ctx.listingId || (/\/(?:product|checkout)\/((?:dp_|oc_|c2b_|sh_|pf_)[a-z0-9_-]+)/i.exec(String(ctx.url || '')) || [])[1] || '');
  const p = returnPolicy({ id });
  const costs = p.cost === 'buyer'
    ? 'Bij dit product zijn de retourkosten bij bedenken voor jou. Het retourbedrag is nog niet bevestigd; vraag Kadoly om de kosten vóór je bestelt.'
    : p.cost === 'free' ? 'Bij dit product is retourneren bij bedenken gratis; Kadoly stuurt je een retourlabel.'
    : 'Retourkosten verschillen per product. Kijk naar de retourafspraak bij het product; zonder die gegevens kan ik niet bevestigen dat de retour gratis is.';
  return costs + ' Laat binnen 14 dagen na ontvangst weten dat je wilt retourneren; daarna heb je nog 14 dagen om terug te sturen. Is iets defect of anders dan beschreven? Dan helpt Kadoly met een kosteloze oplossing.';
}

export function chosenVariant(listing = {}, requested = '') {
  const list = (Array.isArray(listing.variants) ? listing.variants : []).filter(v => v && v.id != null);
  if (!list.length) return null;
  return list.find(v => String(v.id) === String(requested))
    || list.filter(v => v.available !== false).sort((a, b) => Number(a.retail_price || listing.price) - Number(b.retail_price || listing.price))[0]
    || list[0];
}

export function productFacts(listing = {}) {
  const source = String(listing.description_source || listing.description || '').replace(/<[^>]*>/g, ' ').slice(0, 20000);
  const number = s => Number(String(s).replace(',', '.'));
  const dimensions = { width: null, height: null, depth: null };
  const candidates = { width: [], height: [], depth: [] };
  const evidence = [];
  // Accept only triples with an explicit axis on every number and an explicit unit. Never guess an unlabelled order.
  const re = /\b(\d+(?:[.,]\d+)?)\s*([HBWD])\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*([HBWD])\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*([HBWD])\s*(mm|cm|m)\b/gi;
  let match;
  while ((match = re.exec(source))) {
    // Packaging dimensions do not prove the size of the assembled product.
    const before = source.slice(Math.max(0, match.index - 70), match.index).split(/[.\n;]/).pop();
    if (/verpakk|packag|carton|karton|embalaj/i.test(before)) continue;
    const axis = c => ({ H: 'height', B: 'width', W: 'width', D: 'depth' })[c.toUpperCase()];
    const keys = [axis(match[2]), axis(match[4]), axis(match[6])];
    if (new Set(keys).size !== 3) continue;
    const factor = match[7].toLowerCase() === 'mm' ? 0.1 : match[7].toLowerCase() === 'm' ? 100 : 1;
    const values = [match[1], match[3], match[5]].map(v => Math.round(number(v) * factor * 100) / 100);
    if (values.some(v => !Number.isFinite(v) || v <= 0 || v > 10000)) continue;
    keys.forEach((key, i) => candidates[key].push(values[i]));
    evidence.push(match[0]);
  }
  for (const key of Object.keys(dimensions)) {
    const values = [...new Set(candidates[key])];
    if (values.length === 1) dimensions[key] = values[0]; // conflicting measurements stay unknown
  }
  const weight = /(?:^|[.\n;])\s*(?:gewicht|weight|peso)\s*:\s*(\d+(?:[.,]\d+)?)\s*kg\b/i.exec(source);
  const material = /(?:^|[.\n;])\s*(?:materials?|materialen|materiaal|materialien|materiales)\s*:\s*([^\n]{1,180})/i.exec(source);
  const materialChoice = !!(material && /choose between|kies tussen|wahl zwischen|elige entre|\bor\b|\bof\b|\boder\b/i.test(material[1]));
  const variants = Array.isArray(listing.variants) ? listing.variants : [];
  return {
    dimensions,
    evidence: [...new Set(evidence)],
    ownWeightKg: weight && number(weight[1]) > 0 ? number(weight[1]) : null,
    // A shipping weight or the furniture's own weight is NEVER a permitted load.
    topLoadKg: null,
    material: material ? material[1].trim() : null,
    unconfirmedMaterial: materialChoice && variants.length === 0,
    source: listing.description_source ? 'supplier' : 'description',
  };
}

export function widthCheck(productWidth, availableWidth) {
  const valid = v => (typeof v === 'number' || typeof v === 'string') && /^\d+(?:[.,]\d+)?$/.test(String(v).trim());
  if (!valid(availableWidth) || Number(String(availableWidth).replace(',', '.')) <= 0 || Number(String(availableWidth).replace(',', '.')) > 10000) return { status: 'invalid', spare: null };
  if (!valid(productWidth) || Number(productWidth) <= 0) return { status: 'unknown', spare: null };
  const spare = Math.round((Number(String(availableWidth).replace(',', '.')) - Number(productWidth)) * 100) / 100;
  return { status: spare >= 0 ? 'fits_width' : 'too_wide', spare };
}

function install({ returnPolicy, chosenVariant, productFacts, widthCheck }) {
  const W = window, D = document;
  if (!/^(www\.)?kadoly\.com$/.test(location.hostname) && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
  if (W.__kadolyKoopcheck) return;
  W.__kadolyKoopcheck = '2026-11-25.1';
  const lang = (D.documentElement.lang || 'nl').slice(0, 2);
  const copy = {
    nl: { title: 'Koopcheck', sub: 'Wat weten we zeker over dit product?', version: 'Uitvoering', noVersion: 'Zie de productnaam en beschrijving.', unconfirmed: 'Uitvoering nog niet bevestigd', material: 'De beschrijving noemt meerdere materialen, maar er is geen materiaalkeuze. Vraag welke uitvoering je ontvangt vóór je bestelt.', selected: 'Gekozen uitvoering', returns: 'Retour bij bedenken', free: 'Gratis retourneren', buyer: 'Retour op eigen kosten', unknown: 'Retourkosten nog niet bevestigd', period: 'Laat binnen 14 dagen na ontvangst weten dat je wilt retourneren. Daarna heb je nog 14 dagen om terug te sturen.', costs: 'Het retourbedrag is niet bekend. Vraag de kosten vóór je bestelt; bij een groot meubel kan speciaal vervoer nodig zijn.', faulty: 'Kapot of anders dan beschreven? Neem contact op met Kadoly voor een kosteloze oplossing. Dit staat los van retourneren omdat je je bedenkt.', delivery: 'Bezorging', lead: 'werkdagen, volgens de productgegevens. Dit is een verwachting.', deliveryUnknown: 'Geen levertijd bevestigd. Vraag Kadoly om duidelijkheid.', noDelivery: 'Dit product wordt niet bezorgd in het gekozen land.', lorry: 'Bezorging met een vrachtwagen. Verdieping, montage en uitpakken zijn niet bevestigd.', source: 'Waarop baseren we dit?', sourceNote: 'De oorspronkelijke productbeschrijving. Dit is leveranciersinformatie, geen onafhankelijke producttest.', sourceFallback: 'De beschikbare productbeschrijving. Een oorspronkelijke leveranciersbron ontbreekt.', dims: 'Afmetingen uit de beschrijving', width: 'breed', height: 'hoog', depth: 'diep', fit: 'Past het op mijn plek?', input: 'Beschikbare breedte in cm', check: 'Controleer de breedte', invalid: 'Vul een breedte groter dan 0 in cm in, bijvoorbeeld 180.', unknownWidth: 'De productbreedte is niet bevestigd.', yes: 'Op breedte past het.', no: 'Op breedte past het niet.', spare: 'cm ruimte over.', short: 'cm te weinig ruimte.', boundary: 'Alleen de breedte is gecontroleerd. Meet ook de diepte, loopruimte en de route door deuren en trappen.', load: 'Draagvermogen van het bovenblad: niet bevestigd. Gebruik deze check niet als bevestiging dat er een tv op kan.', ownWeight: 'Eigen gewicht', notLoad: 'Dit is geen draagvermogen.', ask: 'Vraag Kadoly om bevestiging', question: 'Hoi Kadoly, kun je voor dit product de uitvoering, retourkosten en eventuele ontbrekende maten bevestigen?', specific: 'Hoi Kadoly, kun je bevestigen welke materiaaluitvoering ik ontvang bij dit product?', policy: 'Retourvoorwaarden per product', policyNote: 'Bij producten met “gratis retourneren” betaalt Kadoly de retourzending. Staat er “retour op eigen kosten”, dan betaal je de retourzending zelf. Vraag een onbekend retourbedrag vóór je bestelt. Je regelt je retour met Kadoly.', checkoutNote: 'Controleer de retourafspraak per product hieronder.', evidenceNone: 'Er staan geen eenduidig gelabelde buitenmaten in de oorspronkelijke beschrijving.', damage: 'Meld zichtbare transportschade zo snel mogelijk met foto’s. Dit beperkt je wettelijke rechten niet.' },
    en: { title: 'Purchase check', sub: 'What do we know about this product?', version: 'Version', noVersion: 'See the product name and description.', unconfirmed: 'Material version not confirmed', material: 'The description lists different materials, but there is no material selector. Ask which version you will receive before ordering.', selected: 'Selected version', returns: 'Change-of-mind return', free: 'Free returns', buyer: 'Return shipping at your cost', unknown: 'Return costs not confirmed', period: 'Tell us within 14 days of delivery if you wish to withdraw. You then have another 14 days to send it back.', costs: 'The return amount is unknown. Ask for the cost before ordering; large furniture may need special transport.', faulty: 'Faulty or different from the description? Contact Kadoly for a solution at no cost. This is separate from a change-of-mind return.', delivery: 'Delivery', lead: 'working days according to the product data. This is an estimate.', deliveryUnknown: 'No delivery time confirmed. Ask Kadoly.', noDelivery: 'This product is not delivered to the selected country.', lorry: 'Delivery by truck. Upstairs delivery, assembly and unpacking are not confirmed.', source: 'What is this based on?', sourceNote: 'The original product description. This is supplier information, not an independent product test.', sourceFallback: 'The available product description. An original supplier source is missing.', dims: 'Dimensions from the description', width: 'wide', height: 'high', depth: 'deep', fit: 'Will it fit my space?', input: 'Available width in cm', check: 'Check the width', invalid: 'Enter a width greater than 0 in cm, for example 180.', unknownWidth: 'Product width is not confirmed.', yes: 'It fits in width.', no: 'It is too wide.', spare: 'cm of width left.', short: 'cm too little space.', boundary: 'Only width has been checked. Also measure depth, walking space, doors and stairs.', load: 'Permitted top load: not confirmed. This check does not confirm suitability for a TV.', ownWeight: 'Product weight', notLoad: 'This is not a permitted load.', ask: 'Ask Kadoly to confirm', question: 'Hi Kadoly, can you confirm the version, return costs and any missing measurements for this product?', specific: 'Hi Kadoly, which material version will I receive for this product?', policy: 'Return conditions per product', policyNote: 'For products marked “free returns”, Kadoly pays return shipping. For products marked “return shipping at your cost”, you pay it. Ask for any unknown return amount before ordering. Arrange your return with Kadoly.', checkoutNote: 'Check the return condition for each product below.', evidenceNone: 'The original description has no unambiguous labelled outer dimensions.', damage: 'Report visible transport damage as soon as possible with photos. This does not limit your statutory rights.' },
    de: { title: 'Kaufcheck', sub: 'Was wissen wir über dieses Produkt?', version: 'Ausführung', noVersion: 'Siehe Produktname und Beschreibung.', unconfirmed: 'Materialausführung nicht bestätigt', material: 'Die Beschreibung nennt mehrere Materialien, aber es gibt keine Materialauswahl. Frage vor dem Kauf, welche Ausführung du erhältst.', selected: 'Gewählte Ausführung', returns: 'Rückgabe bei Widerruf', free: 'Kostenlose Rücksendung', buyer: 'Rücksendung auf eigene Kosten', unknown: 'Rücksendekosten nicht bestätigt', period: 'Teile deinen Widerruf innerhalb von 14 Tagen nach Erhalt mit. Danach hast du weitere 14 Tage für die Rücksendung.', costs: 'Der Rücksendebetrag ist unbekannt. Frage vor dem Kauf nach den Kosten; große Möbel können einen besonderen Transport erfordern.', faulty: 'Defekt oder anders als beschrieben? Kontaktiere Kadoly für eine kostenlose Lösung. Das ist unabhängig vom Widerruf.', delivery: 'Lieferung', lead: 'Werktage laut Produktdaten. Dies ist eine Schätzung.', deliveryUnknown: 'Keine Lieferzeit bestätigt. Frage Kadoly.', noDelivery: 'Dieses Produkt wird nicht ins gewählte Land geliefert.', lorry: 'Lieferung per Lkw. Lieferung in die Wohnung, Montage und Auspacken sind nicht bestätigt.', source: 'Worauf beruht dieser Check?', sourceNote: 'Die ursprüngliche Produktbeschreibung. Lieferanteninformation, kein unabhängiger Produkttest.', sourceFallback: 'Die verfügbare Produktbeschreibung. Eine ursprüngliche Lieferantenquelle fehlt.', dims: 'Maße laut Beschreibung', width: 'breit', height: 'hoch', depth: 'tief', fit: 'Passt es an meinen Platz?', input: 'Verfügbare Breite in cm', check: 'Breite prüfen', invalid: 'Gib eine Breite größer als 0 in cm ein, zum Beispiel 180.', unknownWidth: 'Produktbreite nicht bestätigt.', yes: 'Die Breite passt.', no: 'Es ist zu breit.', spare: 'cm Breite übrig.', short: 'cm Platz fehlen.', boundary: 'Nur die Breite wurde geprüft. Miss auch Tiefe, Laufwege, Türen und Treppen.', load: 'Belastbarkeit der Oberseite: nicht bestätigt. Dieser Check bestätigt keine Eignung für einen Fernseher.', ownWeight: 'Eigengewicht', notLoad: 'Dies ist keine Belastbarkeit.', ask: 'Kadoly um Bestätigung bitten', question: 'Hallo Kadoly, könnt ihr Ausführung, Rücksendekosten und fehlende Maße für dieses Produkt bestätigen?', specific: 'Hallo Kadoly, welche Materialausführung erhalte ich bei diesem Produkt?', policy: 'Rücksendung je Produkt', policyNote: 'Bei Produkten mit „kostenloser Rücksendung“ zahlt Kadoly den Rückversand. Bei „Rücksendung auf eigene Kosten“ zahlst du ihn. Frage unbekannte Kosten vor dem Kauf an. Wickle die Rücksendung mit Kadoly ab.', checkoutNote: 'Prüfe unten die Rücksendebedingung je Produkt.', evidenceNone: 'Keine eindeutig bezeichneten Außenmaße in der ursprünglichen Beschreibung.', damage: 'Melde sichtbare Transportschäden möglichst schnell mit Fotos. Deine gesetzlichen Rechte bleiben bestehen.' },
    es: { title: 'Comprobación de compra', sub: '¿Qué sabemos de este producto?', version: 'Versión', noVersion: 'Consulta el nombre y la descripción.', unconfirmed: 'Material sin confirmar', material: 'La descripción menciona varios materiales, pero no hay selector. Pregunta qué versión recibirás antes de comprar.', selected: 'Versión elegida', returns: 'Devolución por cambio de opinión', free: 'Devolución gratuita', buyer: 'Devolución a tu cargo', unknown: 'Coste de devolución sin confirmar', period: 'Comunica el desistimiento en los 14 días posteriores a la entrega. Después tienes otros 14 días para devolverlo.', costs: 'El importe de devolución es desconocido. Pregunta antes de comprar; los muebles grandes pueden necesitar transporte especial.', faulty: '¿Defectuoso o distinto de lo descrito? Contacta con Kadoly para una solución sin coste. Esto es independiente del desistimiento.', delivery: 'Entrega', lead: 'días laborables según los datos del producto. Es una estimación.', deliveryUnknown: 'Plazo de entrega sin confirmar. Pregunta a Kadoly.', noDelivery: 'Este producto no se entrega en el país seleccionado.', lorry: 'Entrega en camión. Subirlo a la vivienda, montaje y desembalaje no están confirmados.', source: '¿En qué se basa?', sourceNote: 'La descripción original del producto. Información del proveedor, no una prueba independiente.', sourceFallback: 'La descripción disponible. Falta una fuente original del proveedor.', dims: 'Medidas de la descripción', width: 'de ancho', height: 'de alto', depth: 'de fondo', fit: '¿Cabe en mi espacio?', input: 'Ancho disponible en cm', check: 'Comprobar ancho', invalid: 'Introduce un ancho mayor que 0 en cm, por ejemplo 180.', unknownWidth: 'Ancho del producto sin confirmar.', yes: 'Cabe de ancho.', no: 'Es demasiado ancho.', spare: 'cm de ancho libres.', short: 'cm de espacio que faltan.', boundary: 'Solo se ha comprobado el ancho. Mide también fondo, zonas de paso, puertas y escaleras.', load: 'Carga máxima de la superficie: sin confirmar. Esto no confirma que soporte un televisor.', ownWeight: 'Peso del producto', notLoad: 'No es la carga máxima.', ask: 'Pedir confirmación a Kadoly', question: 'Hola Kadoly, ¿podéis confirmar la versión, los gastos de devolución y las medidas que faltan para este producto?', specific: 'Hola Kadoly, ¿qué versión de material recibiré con este producto?', policy: 'Devolución por producto', policyNote: 'Kadoly paga el envío de devolución si el producto indica “devolución gratuita”. Si indica “devolución a tu cargo”, lo pagas tú. Pregunta cualquier coste desconocido antes de comprar. Gestiona la devolución con Kadoly.', checkoutNote: 'Consulta abajo la devolución de cada producto.', evidenceNone: 'No hay medidas exteriores con etiquetas claras en la descripción original.', damage: 'Comunica daños de transporte visibles lo antes posible con fotos. Esto no limita tus derechos legales.' },
  };
  const T = copy[lang] || copy.en;
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const label = p => ({ free: T.free, buyer: T.buyer, unknown: T.unknown })[p.cost] || T.unknown;
  const wa = (listing, question) => 'https://wa.me/31655395630?text=' + encodeURIComponent(question + '\n' + String(listing.title || '') + '\n' + location.href);
  function textReplace(node, re, text) {
    if (!node) return;
    const walker = D.createTreeWalker(node, 4);
    let n;
    while ((n = walker.nextNode())) {
      const next = n.nodeValue.replace(re, text);
      if (next !== n.nodeValue) n.nodeValue = next;
    }
  }
  const freeWords = /(?:14 (?:dagen|days|Tage) )?(?:gratis retour(?:neren)?|free returns|kostenlose Rücksendung|devolución grat(?:is|uita))/gi;
  function product() {
    const L = W.YP && W.YP.listing;
    const actions = D.querySelector('.buybox .bb-actions');
    if (!L || !actions || L.type === 'digital' || D.getElementById('kadoly-koopcheck')) return;
    const F = productFacts(L), P = returnPolicy(L);
    // Leave the existing payment, stock, price, variant controls and buy links in charge.
    if (P.cost === 'buyer') {
      D.querySelectorAll('.bb-focus-line,.bb-trustline,#good-to-know .srp-v').forEach(n => textReplace(n, freeWords, T.buyer));
      const damage = /(?:schade binnen 3 dagen melden met foto['’]s|report damage within 3 days with photos|Schäden innerhalb von 3 Tagen mit Fotos melden|avisa de daños en 3 días con fotos)/gi;
      D.querySelectorAll('#good-to-know .srp-v').forEach(n => textReplace(n, damage, T.damage));
      const extra = D.querySelector('.bb-dp-returns');
      if (extra) extra.textContent = T.costs + ' ' + T.damage;
    }
    const box = D.createElement('details');
    box.id = 'kadoly-koopcheck'; box.className = 'k-koopcheck'; box.setAttribute('data-cm', 'koopcheck');
    const dims = Object.entries(F.dimensions).filter(([, value]) => value !== null);
    const ds = dims.map(([key, value]) => esc(value) + ' cm ' + esc(T[key])).join(' × ');
    const ship = D.querySelector('#buy-btn[data-nodeliver]') ? T.noDelivery : /^\d+\s*[-–]?\s*\d*$/.test(String(L.ship_days || '')) ? String(L.ship_days) + ' ' + T.lead : T.deliveryUnknown;
    const furniture = L._dp_lorry || /dressoir|sideboard|tv.meubel|kast|cabinet|tafel|table|schrank|mesa/i.test(String(L.title || ''));
    box.innerHTML = '<summary><strong>' + esc(T.title) + '</strong><span>' + esc(T.sub) + '</span></summary><div class="k-koopcheck__body">'
      + '<dl><div><dt>' + esc(T.version) + '</dt><dd data-k-version></dd></div><div><dt>' + esc(T.delivery) + '</dt><dd>' + esc(ship) + (L._dp_lorry || D.querySelector('.bb-dp-lorry') ? ' ' + esc(T.lorry) : '') + '</dd></div>'
      + '<div><dt>' + esc(T.returns) + '</dt><dd><strong>' + esc(label(P)) + '</strong>. ' + esc(T.period) + (P.cost === 'buyer' ? ' ' + esc(T.costs) : '') + '</dd></div></dl>'
      + (ds ? '<p><strong>' + esc(T.dims) + '</strong><br>' + ds + '</p>' : '')
      + (F.dimensions.width !== null ? '<form class="k-koopcheck__fit"><label for="kadoly-fit-width">' + esc(T.input) + '</label><div><input id="kadoly-fit-width" inputmode="decimal" autocomplete="off" type="text" maxlength="8" placeholder="180"><button type="submit">' + esc(T.check) + '</button></div><p data-k-result role="status" aria-live="polite"></p></form><p>' + esc(T.boundary) + '</p>' : '')
      + (furniture ? '<p class="k-koopcheck__unknown">' + esc(T.load) + (F.ownWeightKg !== null ? ' ' + esc(T.ownWeight) + ': ' + esc(F.ownWeightKg) + ' kg. ' + esc(T.notLoad) : '') + '</p>' : '')
      + '<p>' + esc(T.faulty) + '</p><a class="k-koopcheck__ask" href="' + esc(wa(L, F.unconfirmedMaterial ? T.specific : T.question)) + '" target="_blank" rel="noopener" data-cm="koopcheck-vraag">' + esc(T.ask) + '</a>'
      + '<details class="k-koopcheck__source"><summary>' + esc(T.source) + '</summary><p>' + esc(F.source === 'supplier' ? T.sourceNote : T.sourceFallback) + '</p>'
      + (F.evidence.length ? F.evidence.map(e => '<blockquote>' + esc(e) + '</blockquote>').join('') : '<p>' + esc(T.evidenceNone) + '</p>')
      + '<p><a href="/returns?lang=' + esc(lang) + '">' + esc(T.policy) + '</a> · ' + esc(L.id) + '</p></details></div>';
    const anchor = D.querySelector('.buybox .bb-trustline') || actions;
    anchor.insertAdjacentElement('afterend', box);
    const fit = box.querySelector('form');
    if (fit) fit.addEventListener('submit', e => {
      e.preventDefault();
      const r = widthCheck(F.dimensions.width, fit.querySelector('input').value);
      const out = fit.querySelector('[data-k-result]');
      out.dataset.state = r.status;
      out.textContent = r.status === 'invalid' ? T.invalid : r.status === 'unknown' ? T.unknownWidth : (r.status === 'fits_width' ? T.yes : T.no) + ' ' + Math.abs(r.spare).toLocaleString(lang) + ' ' + (r.status === 'fits_width' ? T.spare : T.short);
      fit.querySelector('input').setAttribute('aria-invalid', String(r.status === 'invalid'));
    });
    function syncVersion() {
      const V = chosenVariant(L, new URLSearchParams(location.search).get('variant'));
      const title = V && (Object.values(V.options || {}).filter(Boolean).join(' / ') || V.title);
      const value = box.querySelector('[data-k-version]');
      value.textContent = title ? T.selected + ': ' + title : F.unconfirmedMaterial ? T.material : T.noVersion;
    }
    syncVersion();
    D.getElementById('bb-variants')?.addEventListener('click', () => setTimeout(syncVersion, 0));
    if (F.unconfirmedMaterial) {
      const note = D.createElement('p'); note.className = 'k-koopcheck__warning'; note.setAttribute('role', 'note');
      note.innerHTML = '<strong>' + esc(T.unconfirmed) + '.</strong> ' + esc(T.material) + ' <a target="_blank" rel="noopener" href="' + esc(wa(L, T.specific)) + '">' + esc(T.ask) + '</a>';
      actions.insertAdjacentElement('beforebegin', note);
    }
  }
  function checkout() {
    const listing = W.CO_DATA && W.CO_DATA.listing;
    const rows = listing ? [listing] : typeof W.YCartLines === 'function' ? W.YCartLines().map(l => {
      const el = Array.from(D.querySelectorAll('[data-product-modal]')).find(n => n.getAttribute('data-product-modal') === String(l.id));
      return { ...l, title: el?.querySelector('.item-title')?.textContent?.trim() || l.id };
    }) : [];
    if (!Array.isArray(rows) || !rows.length || !rows.some(l => returnPolicy(l).cost === 'buyer')) return;
    const checkoutLabel = rows.length === 1 ? label(returnPolicy(rows[0])) : T.policy;
    D.querySelectorAll('.co-trust-line,.co-under__ticks li,#co-s1-sure').forEach(n => textReplace(n, freeWords, checkoutLabel));
    // The checkout rewrites this line after quantity/country changes. Observe only that small line, never the whole page.
    const sure = D.getElementById('co-s1-sure');
    if (sure) new MutationObserver(() => textReplace(sure, freeWords, checkoutLabel)).observe(sure, { childList: true, characterData: true, subtree: true });
    const pay = D.getElementById('pay-btn');
    if (!pay || D.getElementById('kadoly-return-preview')) return;
    const note = D.createElement('div'); note.id = 'kadoly-return-preview'; note.className = 'k-return-preview';
    note.innerHTML = '<strong>' + esc(T.policy) + '</strong>' + rows.filter(l => l.type !== 'digital').map(l => '<p>' + esc(l.title || l.id) + ': <b>' + esc(label(returnPolicy(l))) + '</b>.</p>').join('') + '<p>' + esc(T.costs) + '</p><p>' + esc(T.faulty) + '</p><a href="/returns?lang=' + esc(lang) + '" target="_blank" rel="noopener">' + esc(T.policy) + '</a>';
    pay.insertAdjacentElement('beforebegin', note);
  }
  function policyPage() {
    if (!/^\/returns\/?$/.test(location.pathname)) return;
    const section = D.getElementById('free');
    if (!section) return;
    const p = section.querySelector('p'); if (p) p.textContent = T.policyNote + ' ' + T.faulty;
    const intro = D.querySelector('.intro'); if (intro) intro.textContent = T.period + ' ' + T.policyNote;
    const overview = D.querySelector('#overview .callout span'); if (overview) overview.textContent = T.period + ' ' + T.policyNote;
    // Keep the legal withdrawal/refund sections intact; qualify the old blanket free-label instructions.
    D.querySelectorAll('#how-to li').forEach(n => {
      if (/gratis retourlabel|free return label|kostenlos|gratuit/i.test(n.textContent)) n.textContent = ({nl:'Kadoly stuurt je de retourinstructies. Een gratis retourlabel hoort bij producten met gratis retourneren.',en:'Kadoly sends the return instructions. A free return label applies to products with free returns.',de:'Kadoly schickt dir Rücksendeanweisungen. Ein kostenloses Etikett gilt für Produkte mit kostenloser Rücksendung.',es:'Kadoly envía las instrucciones. La etiqueta gratuita corresponde a productos con devolución gratuita.'})[lang] || copy.en.policyNote;
      else if (/label|Etikett|etiqueta/i.test(n.textContent)) n.textContent = ({nl:'Verstuur je pakket volgens de retourinstructies voor jouw product.',en:'Send the parcel following the return instructions for your product.',de:'Versende das Paket gemäß den Rücksendeanweisungen für dein Produkt.',es:'Envía el paquete siguiendo las instrucciones de tu producto.'})[lang] || copy.en.policyNote;
    });
    const address = D.querySelector('#address p');
    if (address) address.textContent = ({nl:'Vraag Kadoly om de retourinstructies en het juiste retouradres voor jouw product vóór je het pakket verstuurt.',en:'Ask Kadoly for return instructions and the correct address for your product before sending the parcel.',de:'Bitte Kadoly vor dem Versand um Rücksendeanweisungen und die richtige Adresse für dein Produkt.',es:'Pide a Kadoly las instrucciones y la dirección correcta de devolución antes de enviar el paquete.'})[lang] || copy.en.policyNote;
    const h = section.querySelector('h2'); if (h) h.textContent = T.policy;
    const toc = D.querySelector('a[href="#free"]'); if (toc) toc.textContent = T.policy;
  }
  function init() {
    const style = D.createElement('style');
    style.textContent = '.k-koopcheck,.k-return-preview{box-sizing:border-box;max-width:100%;margin:14px 0;padding:0;border:1px solid #b7d4c5;border-radius:12px;background:#fff;color:#182b22;font:14px/1.55 Inter,system-ui,sans-serif;text-align:left}.k-koopcheck>summary{cursor:pointer;padding:12px 14px;min-height:44px}.k-koopcheck>summary strong{font-size:15px}.k-koopcheck>summary span{display:block;font-size:13px;margin:2px 0 0 17px}.k-koopcheck__body,.k-return-preview{padding:0 14px 14px}.k-return-preview{padding-top:14px}.k-koopcheck p,.k-return-preview p{margin:10px 0}.k-koopcheck dl{margin:0}.k-koopcheck dl>div{padding:10px 0;border-top:1px solid #e0e9e4}.k-koopcheck dt{font-weight:700}.k-koopcheck dd{margin:3px 0 0}.k-koopcheck a,.k-koopcheck__warning a,.k-return-preview a{color:#175b3a;text-decoration:underline;text-underline-offset:3px}.k-koopcheck__fit{margin-top:14px}.k-koopcheck__fit label{display:block;font-weight:600;margin-bottom:6px}.k-koopcheck__fit>div{display:flex;gap:8px;flex-wrap:wrap}.k-koopcheck__fit input{box-sizing:border-box;min-width:0;flex:1 1 70px;max-width:110px;height:44px;border:1px solid #71857a;border-radius:7px;padding:8px;font:16px system-ui;color:#182b22;background:#fff}.k-koopcheck__fit button{min-height:44px;flex:1 1 145px;padding:8px 12px;border:1px solid #244b36;border-radius:7px;background:#244b36;color:#fff;font:600 14px system-ui;cursor:pointer}.k-koopcheck__fit [data-state=too_wide],.k-koopcheck__fit [data-state=invalid]{color:#942b1a;font-weight:600}.k-koopcheck__fit [data-state=fits_width]{color:#175b3a;font-weight:600}.k-koopcheck__source{border-top:1px solid #e0e9e4;margin-top:14px;padding-top:10px}.k-koopcheck__source summary{cursor:pointer;font-weight:600;min-height:32px}.k-koopcheck blockquote{border-left:2px solid #b7d4c5;padding-left:10px;margin:10px 0;overflow-wrap:anywhere}.k-koopcheck__warning{font:14px/1.5 Inter,system-ui,sans-serif;padding:10px 12px;border:1px solid #dccb9a;border-radius:9px;color:#604615;background:#fffdf6;margin:10px 0}.k-koopcheck__ask{display:inline-block;min-height:32px;line-height:32px}.k-koopcheck__unknown{padding:10px;border:1px solid #e0e9e4;border-radius:8px}.k-koopcheck :focus-visible,.k-koopcheck__warning :focus-visible{outline:2px solid #244b36;outline-offset:3px}.dark-mode .k-koopcheck,.dark-mode .k-return-preview{background:#18241e;color:#f1f6f3}.dark-mode .k-koopcheck a,.dark-mode .k-return-preview a{color:#b6dfc7}';
    D.head.appendChild(style);
    try { product(); checkout(); policyPage(); } catch (e) { /* enhancement must never interrupt checkout */ }
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init, { once: true }); else init();
}

export const KOOPCHECK_JS = '/* Kadoly koopcheck 2026-11-25.1 */\n(function(){const returnPolicy=' + returnPolicy.toString() + ';const chosenVariant=' + chosenVariant.toString() + ';const productFacts=' + productFacts.toString() + ';const widthCheck=' + widthCheck.toString() + ';(' + install.toString() + ')({returnPolicy,chosenVariant,productFacts,widthCheck});})();';
