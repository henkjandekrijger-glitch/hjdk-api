// Telefoonnummers verbergen zonder productcodes, aantallen of bedragen te beschadigen.
export function verbergContact(value,max=400,veld=''){
  const txt=String(value??'').replace(/[^\s@]+@[^\s@]+\.[a-z]{2,}/gi,'[verborgen]');
  return txt.replace(/\+?\d[\d\s().-]{7,}\d/g,(n,pos,bron)=>{
    const voor=bron.slice(Math.max(0,pos-45),pos),na=bron.slice(pos+n.length,pos+n.length+30),cijfers=n.replace(/\D/g,'');
    const code=/\b(ean|gtin|isbn|sku|mpn|productcode|artikelnummer|onderdeelnummer|part number)\s*[:#=]?\s*$/i.test(voor);
    const codeVeld=/(ean|gtin|isbn|productcode|artikelnummer)/i.test(String(veld))&&!n.startsWith('+')&&[8,10,12,13,14].includes(cijfers.length);
    const bedrag=/[€$£]\s*$|\b(eur|usd|prijs|price|budget|omzet|revenue)\s*[:=]?\s*$/i.test(voor)||/^\s*(euro|eur|usd|dollar)\b/i.test(na);
    const aantal=/^\s*(stuks|units|orders|bestellingen|pallets|mm|cm|kg|liter)\b/i.test(na);
    return code||codeVeld||bedrag||aantal?n:'[verborgen]';
  }).slice(0,max);
}
