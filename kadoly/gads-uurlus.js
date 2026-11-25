// KADOLY Shopping uurlus (Henkjan 23 nov 2026: "IK MOET echt een google verkoop hebben . Optimaliseer dus ads veel frequenter .")
// Google Ads-script in account Kadoly 460-749-3899, draait elk uur in Google zelf. Bron: hjdk-api kadoly/gads-uurlus.js.
// Raakt alleen campagne KADOLY SHOPPING NL (24521637835). Budget blijft altijd van Henkjan (dit script zet geen budget).
// Vorige inhoud van dit script (20 nov, eenmalig): dagbudget KADOLY SHOPPING NL van EUR 8 naar EUR 15.
var CAMPAGNE = 24521637835;
var MIN = 0.15, MAX = 1.20, START = 0.90;
var BEWEZEN = ['oc_4173959244120065', 'oc_4174003417645057', 'oc_4174002164744193']; // al eens verkocht: nooit uit, nooit onder 0,60
var MERKEN = ['ikea', 'blokker', 'action', 'hema', 'xenos', 'kwantum', 'leen bakker', 'jysk', 'klippan', 'tweedmill', 'marktplaats', 'tweedehands', 'bol.com', 'amazon'];
var MAX_UIT_PER_UUR = 3;
var CONV_BRON = 'https://keuzehulp.best/api/shop?op=gconv'; // 25 nov 2026 (Henkjan: "Meld terug aan google"): betaalde bestellingen met gclid, alleen klik-id, tijd en bedrag
var CONV_NAAM = 'Kadoly aankoop (server)'; // conversieactie van het type Importeren > Conversies van klikken
var VAST = { 'oc_4174002164400133': 0.60, 'oc_4174003456851970': 0.60, 'oc_4174002211717121': 0.60 }; // lokkers (23 nov, Henkjan: "Ja zet live"): vast bod, nooit uit; hun stopregel zit in de prijslijst (fn/shop.js lokkerStand)

function r2(x) { return Math.round(x * 100) / 100; }
function isBewezen(pg) { var v = String(pg.getValue() || '').toLowerCase(); return BEWEZEN.indexOf(v) >= 0; }

function main() {
  var log = [];
  var cit = AdsApp.shoppingCampaigns().withIds([CAMPAGNE]).get();
  if (!cit.hasNext()) { Logger.log('campagne niet gevonden'); return; }
  var camp = cit.next();

  // 1. Productgroepen: idempotent, dus elk uur draaien geeft hetzelfde bod bij dezelfde kosten.
  var it = AdsApp.productGroups().withCondition('campaign.id = ' + CAMPAGNE).get();
  while (it.hasNext()) {
    var pg = it.next();
    if (pg.isExcluded() || pg.isOtherCase()) continue;
    if (pg.children().get().hasNext()) continue; // alleen bladeren hebben een bod
    var s14 = pg.getStatsFor('LAST_14_DAYS'), s30 = pg.getStatsFor('LAST_30_DAYS');
    var kost = s14.getCost(), conv = s30.getConversions(), bod = pg.getMaxCpc() || 0;
    var naam = String(pg.getValue() || pg.getDimension());
    var item = /ITEM/i.test(String(pg.getDimension()));
    var bewezen = isBewezen(pg);
    var vast = VAST[String(pg.getValue() || '').toLowerCase()]; if (vast) { if (bod !== vast) { pg.setMaxCpc(vast); log.push(naam + ' lokker: bod ' + bod + ' -> ' + vast); } continue; }
    if (conv >= 1) { var hoog = Math.min(MAX, Math.max(bod, 1.00)); if (hoog > bod) { pg.setMaxCpc(hoog); log.push(naam + ' verkocht: bod ' + bod + ' -> ' + hoog); } continue; }
    if (!item) continue; // groeistappen (custom_label_3: verkocht, trek, nieuw, kans, stil) wisselen elke nacht van producten; de labelbron zet een product zelf op uit na 12 betaalde kliks zonder verkoop
    if (kost >= 8 && !bewezen) { pg.exclude(); log.push(naam + ' uit: EUR ' + r2(kost) + ' in 14 dagen zonder verkoop'); continue; }
    if (kost >= 2) {
      var doel = r2(Math.max(MIN, START - 0.10 * Math.floor(kost / 2)));
      if (bewezen) doel = Math.max(doel, 0.60);
      if (doel < bod) { pg.setMaxCpc(doel); log.push(naam + ' lager: bod ' + bod + ' -> ' + doel + ' (EUR ' + r2(kost) + ' zonder verkoop)'); }
    }
  }

  // 2. Zoektermen: dure termen zonder verkoop en merken van andere winkels uitsluiten.
  var bestaand = {};
  var nk = camp.negativeKeywords().get();
  while (nk.hasNext()) { bestaand[String(nk.next().getText()).toLowerCase()] = 1; }
  var q = 'SELECT search_term_view.search_term, metrics.clicks, metrics.cost_micros, metrics.conversions FROM search_term_view ' +
          'WHERE campaign.id = ' + CAMPAGNE + ' AND segments.date DURING LAST_30_DAYS AND metrics.clicks >= 2';
  var rows = AdsApp.search(q), uit = 0;
  while (rows.hasNext() && uit < MAX_UIT_PER_UUR) {
    var row = rows.next();
    var term = String(row.searchTermView.searchTerm || '').toLowerCase();
    var klik = Number(row.metrics.clicks || 0), eur = Number(row.metrics.costMicros || 0) / 1e6, cv = Number(row.metrics.conversions || 0);
    if (!term || cv > 0) continue;
    var merk = null;
    for (var i = 0; i < MERKEN.length; i++) { if ((' ' + term + ' ').indexOf(' ' + MERKEN[i] + ' ') >= 0) { merk = MERKEN[i]; break; } }
    var tekst = merk ? '"' + merk + '"' : (klik >= 5 && eur >= 2.5 ? '[' + term + ']' : null);
    if (!tekst || bestaand[tekst] || (merk && bestaand[merk])) continue;
    try { camp.createNegativeKeyword(tekst); bestaand[tekst] = 1; uit++; log.push('uitgesloten zoekterm ' + tekst + ' (' + klik + ' kliks, EUR ' + r2(eur) + ')'); } catch (e) { log.push('kon ' + tekst + ' niet uitsluiten: ' + e); }
  }

  // 3. Verkopen terugmelden: elke betaalde bestelling met Google-klik als offline conversie. Google weigert dubbele (zelfde klik, actie en tijd)
  //    en klikken van voor het aanmaken van de conversieactie; dat staat dan in Tools > Uploads, het script gaat gewoon door.
  try {
    var resp = UrlFetchApp.fetch(CONV_BRON, { muteHttpExceptions: true });
    var j = resp.getResponseCode() === 200 ? JSON.parse(resp.getContentText()) : null;
    var lijst = (j && j.lijst) || [];
    if (lijst.length) {
      var up = AdsApp.bulkUploads().newCsvUpload(['Google Click ID', 'Conversion Name', 'Conversion Time', 'Conversion Value', 'Conversion Currency'], { moneyInMicros: false });
      up.forOfflineConversions();
      up.setFileName('Kadoly verkopen ' + Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd HH:mm'));
      for (var c = 0; c < lijst.length; c++) {
        var cv = lijst[c];
        up.append({ 'Google Click ID': cv.gclid, 'Conversion Name': CONV_NAAM, 'Conversion Time': cv.tijd, 'Conversion Value': cv.waarde, 'Conversion Currency': 'EUR' });
      }
      up.apply();
      log.push('verkopen naar Google: ' + lijst.length + ' met gclid aangeboden');
    }
  } catch (e) { log.push('verkopen terugmelden mislukt: ' + e); }

  Logger.log(log.length ? log.join('\n') : 'niets te doen');
}
