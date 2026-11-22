// Partnerlink naar een zoekopdracht bij bol, voor pagina's buiten fn/kz.js (beslisgidsen in lib/dienstgids.js).
// Zelfde opbouw als de reservelink in fn/kz.js (advies zonder producten): partner.bol.com met het Site-ID van keuzehulp.best
// en een subid 'kz_<slug>-koop', zodat de klik in het bol-partnerrapport per pagina zichtbaar is.
// Het Site-ID komt uit BOL_SITE_KZ als die als omgevingsvariabele bestaat, anders het vaste ID van keuzehulp.best.
const BOL_SITE = String(process.env.BOL_SITE_KZ || '1547300').replace(/[^0-9]/g, '') || '1547300';
export function bolZoekLink(zoek, slug) {
  return 'https://partner.bol.com/click/click?p=1&t=url&s=' + BOL_SITE + '&f=TXL&url=' + encodeURIComponent('https://www.bol.com/nl/nl/s/?searchtext=' + encodeURIComponent(String(zoek || ''))) + '&subid=' + encodeURIComponent('kz_' + slug + '-koop');
}
