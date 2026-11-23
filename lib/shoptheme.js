// Kadoly-thema voor de Shopify-winkel (21 nov 2026, Henkjan: "Ok doen we trek vormgeving helemaal gelijk dat mensen verschil niet zien .").
//
// De Shopify-winkel (Kadoly Inkoop) wordt ook een verkoopkanaal: Shopify zet de producten in ChatGPT, Gemini, Google AI Mode,
// Copilot en Meta (Agentic Storefronts) en in Google Shopping. Wie daar klikt, moet op een pagina komen die er precies uitziet
// als kadoly.com. Daarom bouwt dit bestand het thema uit kadoly.com zelf:
//   - kop en voet: letterlijk van kadoly.com (productpagina en categoriepagina), links naar kadoly.com, winkelwagen blijft hier;
//   - CSS: dezelfde bestanden van cdn.kadoly.com plus alle stijlblokken van die pagina's (per soort pagina een eigen bestand);
//   - productpagina, categorie, zoeken en winkelwagen: dezelfde opbouw en klassen als kadoly.com (pdp, buybox, sh-grid, sh-card).
// Elke nacht (op=shnacht) haalt de ronde kop, voet en CSS opnieuw op en zet ze in het thema, zo blijft het gelijk als kadoly.com verandert.
// Nieuw thema: op=shthema&doe=maak (Shopify haalt het zip op via de openbare host met een eenmalige sleutel).
// Live zetten (publiceren) alleen op Henkjans woord: op=shthema&doe=publiceer.
import { kv } from './db.js';
import { shGql, shHub } from './shophub.js';

const KD = 'https://kadoly.com';
const K = { thema: 'sh:thema', zip: 'sh:thema:zip' };
export const UA = { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36', 'accept-language': 'nl-NL,nl' };
const nu = () => new Date().toISOString().replace(/\.\d+Z$/, '');
const VOORBEELD = ['/product/lantern-modern-black-metal-frame-for-candles-mica-decorations?lang=nl'];

export async function haal(pad) {
  const r = await fetch(KD + pad, { headers: UA, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error('kadoly.com' + pad + ' gaf ' + r.status); return r.text();
}
// een productpagina die bestaat: eerst de vaste, anders de eerste van de shop
async function productPagina(shop) {
  for (const p of VOORBEELD) { try { const h = await haal(p); if (h.includes('class="buybox"')) return h; } catch (e) {} }
  const m = shop.match(/href="(\/product\/[^"#?]+)"/); if (!m) throw new Error('geen productpagina gevonden op kadoly.com');
  return haal(m[1] + '?lang=nl');
}
// blok met geneste tags van hetzelfde soort (header in header)
// begin van de kop van kadoly.com: de klasse wisselt (ypn, later ys-navbar ynav), dus zoeken op wat er is
export const kopBegin = h => { const m = h.match(/<header class="[^"]*\b(ypn|ynav|ys-navbar)\b[^"]*"/); return m ? m[0] : ''; };
export function blok(h, begin, tag) {
  const a = h.indexOf(begin); if (a < 0) return '';
  const re = new RegExp('<' + tag + '\\b|</' + tag + '>', 'g'); re.lastIndex = a + 1; let diep = 1, m;
  while ((m = re.exec(h))) { diep += m[0][1] === '/' ? -1 : 1; if (!diep) return h.slice(a, m.index + m[0].length); }
  return '';
}
export const absoluut = s => s
  .replace(/\b(href|src|action|srcset)="\/(?!\/)/g, (m, a) => a + '="' + KD + '/')
  .replace(/url\((['"]?)\/(?!\/)/g, 'url($1' + KD + '/')
  .replace(/href="https:\/\/kadoly\.com\/cart"/g, 'href="/cart"');
export function stijlen(h) {
  const gezien = new Set(), uit = [];
  for (const m of h.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) { const c = m[1].trim(); if (c && !gezien.has(c)) { gezien.add(c); uit.push(c); } }
  return absoluut(uit.join('\n'));
}
export function koplinks(h) {
  const kop = h.slice(0, h.indexOf('<body')); const uit = [];
  for (const m of kop.matchAll(/<link\b[^>]*>/g)) { const l = m[0]; if (/rel="(stylesheet|preconnect|icon|apple-touch-icon)"/.test(l) || /rel="stylesheet"/.test(l)) uit.push(absoluut(l)); }
  return [...new Set(uit)].join('\n');
}
// kop van kadoly.com: menu-voorvertoning en productlinks naar kadoly.com, taalkeuze naar de shop, aantal in de winkelwagen van Shopify
function maakKop(h) {
  let k = kopBegin(h) ? blok(h, kopBegin(h), 'header') : ''; if (!k) return '';
  const na = h.slice(h.indexOf(k) + k.length).match(/^(\s*(<style[\s\S]*?<\/style>|<script>[\s\S]*?<\/script>))*/);
  k = absoluut(k + (na ? na[0] : ''))
    .replace(/'\/shop\/api\/shop'/g, "'" + KD + "/shop/api/shop'")
    .replace(/(['"])\/product\//g, '$1' + KD + '/product/')
    .replace(/href="https:\/\/kadoly\.com\/product\/[^"?]*\?lang=(\w+)"/g, 'href="' + KD + '/shop?lang=$1"');
  return rauw(k).replace(/<span data-cart-count[^>]*><\/span>/, '{% endraw %}<span data-cart-count{% if cart.item_count == 0 %} hidden{% endif %}>{{ cart.item_count }}</span>{% raw %}');
}
const rauw = s => '{% raw %}' + String(s).replace(/\{%-?\s*endraw\s*-?%\}/g, '') + '{% endraw %}';
export const bodyKlasse = h => { const m = h.match(/<body[^>]*class="([^"]*)"/); return m ? m[1].trim() : ''; };

// ---------- vaste templates (Liquid), zelfde opbouw en klassen als kadoly.com ----------
const PIJL = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const KAR = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';
const SLOT = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
const RETOUR = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>';
const WA = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z"/></svg>';
const SCHILD = '<svg class="kwwk__logo" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5z"/><path d="m9 12 2 2 4-4"/></svg>';
const VERZEND = '6,95'; const VZ = 695; // alles-in zoals kadoly.com (Henkjan 21 nov: "Ja doen . 1"): op de pagina prijs + verzending, bij het afrekenen uitgesplitst

function layout({ links, bodyProduct, bodyShop }) {
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{ page_title }}{% unless page_title contains 'Kadoly' %} — Kadoly{% endunless %}</title>
{%- if page_description %}<meta name="description" content="{{ page_description | escape }}">{% endif %}
<link rel="canonical" href="{{ canonical_url }}">
<meta property="og:site_name" content="Kadoly">
<meta property="og:title" content="{{ page_title | escape }}">
{%- if template.name == 'product' and product.featured_image %}<meta property="og:image" content="https:{{ product.featured_image | image_url: width: 1200 }}">{% endif %}
${links}
{%- if template.name == 'product' -%}{{ 'kd-product.css' | asset_url | stylesheet_tag }}{%- else -%}{{ 'kd-shop.css' | asset_url | stylesheet_tag }}{%- endif %}
{{ 'kd-extra.css' | asset_url | stylesheet_tag }}
{{ content_for_header }}
</head>
<body class="{% if template.name == 'product' %}${bodyProduct}{% else %}${bodyShop}{% endif %} kd-shopify">
{%- if template.name == 'product' -%}{% render 'kd-kop-product' %}{%- else -%}{% render 'kd-kop-shop' %}{%- endif -%}
{{ content_for_layout }}
<div class="toast" id="toast" role="status"></div>
{%- if template.name == 'product' -%}{% render 'kd-voet-product' %}{%- else -%}{% render 'kd-voet-shop' %}{%- endif -%}
<script src="https://go.kadoly.com/cm.js" data-site="yoors" data-modal="kadoly" data-kanaal="shopify" async></script>
</body>
</html>`;
}

const PRODUCT = `{%- assign v = product.selected_or_first_available_variant -%}
<div class="crumb">
  <a href="${KD}/shop">Shop</a>
  {%- if collection %}<span class="sep">›</span><a href="{{ collection.url }}">{{ collection.title }}</a>{% endif -%}
</div>
<div class="page">
  <div class="pdp">
    <div>
      <div class="pp-mhead" id="pp-mhead" aria-hidden="true"><div class="pp-mhead__t" id="pp-mhead-t">{{ product.title }}</div><div class="pp-mhead__p" id="pp-mhead-p">{{ v.price | plus: ${VZ} | money }}</div></div>
      <div class="gal-main zoomable" id="gal-main">
        <img id="gal-img" src="{{ product.featured_image | image_url: width: 1200 }}" alt="{{ product.title | escape }}">
        {%- if product.images.size > 1 %}
        <button class="gal-arrow prev" id="gal-prev" aria-label="Vorige foto"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
        <button class="gal-arrow next" id="gal-next" aria-label="Volgende foto"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
        <div class="gal-count" id="gal-count">1 / {{ product.images.size }}</div>
        {%- endif %}
      </div>
      {%- if product.images.size > 1 %}
      <div class="gal-strip" id="gal-strip">
        {%- for img in product.images %}
        <div class="gal-thumb{% if forloop.first %} on{% endif %}" data-i="{{ forloop.index0 }}" data-src="{{ img | image_url: width: 1200 }}"><img src="{{ img | image_url: width: 200 }}" alt="Foto {{ forloop.index }}" loading="lazy"></div>
        {%- endfor %}
      </div>
      {%- endif %}
      {%- if product.description != blank %}
      <div class="block"><div class="block-h">Beschrijving</div><div class="pdx" id="desc-body">{{ product.description }}</div></div>
      {%- endif %}
      {%- if product.vendor != blank %}
      <div class="block bb-maker" id="maker-card"><div class="block-h">Over het merk</div><p class="bb-maker__name">{{ product.vendor }}</p>
        <p class="bb-maker__all"><a href="{{ product.vendor | url_for_vendor }}">Alles van {{ product.vendor }} bekijken →</a></p></div>
      {%- endif %}
      <div class="srp" id="good-to-know">
        <div class="srp-h">Goed om te weten</div>
        <div class="srp-row"><div class="srp-k">Levering</div><div class="srp-v">Met track &amp; trace, de verzending zit in de prijs · <a href="${KD}/shipping">Verzending &amp; levering</a></div></div>
        <div class="srp-row"><div class="srp-k">Retourneren</div><div class="srp-v"><b>Gratis retourneren</b> · binnen 14 dagen na ontvangst · <a href="${KD}/returns">zo werkt het</a> · <a href="${KD}/herroepen">Bestelling herroepen</a></div></div>
        <div class="srp-row"><div class="srp-k">Klantenservice</div><div class="srp-v"><b id="kd-open">Ma t/m vr 9:00 tot 17:30 uur</b> · <a href="https://wa.me/31655395630">WhatsApp</a> of de chat: binnen kantoortijd antwoord binnen een uur</div></div>
      </div>
    </div>
    <div class="buybox">
      <div>
        {%- if product.vendor != blank %}<a class="bb-brand" href="#maker-card">{{ product.vendor }}</a>{% endif %}
        <h1 class="bb-title" id="info-title">{{ product.title }}</h1>
      </div>
      <div class="bb-price-row">
        <div class="bb-price-line"><div class="bb-price" id="info-price">{{ v.price | plus: ${VZ} | money }}</div>
          {%- if v.compare_at_price > v.price %}<s class="bb-was">{{ v.compare_at_price | plus: ${VZ} | money }}</s>{% endif %}</div>
        <div class="bb-price-note">incl. verzending en btw</div>
      </div>
      <div class="bb-avail">
        <div class="bb-stock" id="bb-stock">{% render 'kd-voorraad', v: v %}</div>
        {%- render 'kd-levertijd', merk: product.vendor -%}
      </div>
      {%- form 'product', product, id: 'buy-form', class: 'bb-buy-form', novalidate: 'novalidate' %}
        <input type="hidden" name="id" id="kd-variant" value="{{ v.id }}">
        <input type="hidden" name="quantity" id="kd-qty" value="1">
        <input type="hidden" name="return_to" id="kd-return" value="">
      {%- endform %}
      {%- unless product.has_only_default_variant %}
      {%- for o in product.options_with_values %}
      <div class="bb-opt">
        <label class="bb-qty__label" for="kd-opt-{{ forloop.index }}">{{ o.name }}</label>
        <select class="kd-opt" id="kd-opt-{{ forloop.index }}" data-i="{{ forloop.index0 }}">
          {%- for w in o.values %}<option value="{{ w | escape }}"{% if o.selected_value == w %} selected{% endif %}>{{ w }}</option>{% endfor -%}
        </select>
      </div>
      {%- endfor %}
      {%- endunless %}
      <div class="bb-qty" id="bb-qty">
        <span class="bb-qty__label">Aantal</span>
        <div class="bb-qty__box" role="group" aria-label="Aantal">
          <button type="button" data-qty="-1" aria-label="−">−</button>
          <output id="bb-qty-n" aria-live="polite">1</output>
          <button type="button" data-qty="1" aria-label="+">+</button>
        </div>
      </div>
      <div class="bb-actions">
        <button type="submit" form="buy-form" class="btn-buy" id="buy-btn"{% unless v.available %} disabled{% endunless %}>Nu kopen ${PIJL}</button>
        <button type="button" class="btn-cart-add" id="cart-add-btn"{% unless v.available %} disabled{% endunless %}>${KAR} In winkelwagen</button>
      </div>
      <ul class="bb-trustline" aria-label="Veilig betalen">
        <li class="bb-trust-pay">${SLOT}<span>Veilig betalen: <span class="bb-pm">iDEAL</span><span class="bb-pm">PayPal</span><span class="bb-pm bb-pay-apple">Apple Pay</span><span class="bb-pm">Klarna</span></span></li>
        <li>${RETOUR}Gratis retourneren</li>
        <li>${WA}<a href="https://wa.me/31655395630" target="_blank" rel="noopener" data-cm="whatsapp">WhatsApp ons</a></li>
        <li class="kwwk kwwk--product"><a href="https://www.webwinkelkeur.nl/webshop/Kadoly_1226796" target="_blank" rel="noopener" data-cm="wwk-product">${SCHILD}Gekeurd door WebwinkelKeur</a></li>
      </ul>
      <p class="bb-company">Kadoly is van Henkjan de Krijger, medeoprichter van Mijndomein · een handelsnaam van AdsFair B.V., Gouda · KVK 60126035</p>
    </div>
  </div>
</div>
<div class="bb-sticky" id="bb-sticky" aria-hidden="true">
  <div><strong id="bb-sticky-price">{{ v.price | plus: ${VZ} | money }}</strong><span id="bb-sticky-sub">incl. verzending en btw</span></div>
  <button type="button" class="btn-buy" id="bb-sticky-buy" tabindex="-1">Nu kopen</button>
</div>
<script type="application/json" id="kd-product">{{ product | json }}</script>
<script>window.KD_VOORRAAD = { {%- for x in product.variants -%}{%- if x.inventory_management -%}"{{ x.id }}": {{ x.inventory_quantity }},{%- endif -%}{%- endfor -%} "_": 0 };</script>
<script>
(function () {
  var P = JSON.parse(document.getElementById('kd-product').textContent), $ = function (i) { return document.getElementById(i); };
  var euro = function (c) { return '€' + (c / 100).toFixed(2).replace('.', ',').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.'); };
  // foto's
  var thumbs = [].slice.call(document.querySelectorAll('.gal-thumb')), cur = 0;
  function toon(i) { if (!thumbs.length) return; cur = (i + thumbs.length) % thumbs.length; $('gal-img').src = thumbs[cur].dataset.src;
    thumbs.forEach(function (t, j) { t.classList.toggle('on', j === cur); }); if ($('gal-count')) $('gal-count').textContent = (cur + 1) + ' / ' + thumbs.length; }
  thumbs.forEach(function (t, j) { t.addEventListener('click', function () { toon(j); }); });
  if ($('gal-prev')) $('gal-prev').addEventListener('click', function () { toon(cur - 1); });
  if ($('gal-next')) $('gal-next').addEventListener('click', function () { toon(cur + 1); });
  // aantal
  var n = 1; document.querySelectorAll('[data-qty]').forEach(function (b) { b.addEventListener('click', function () { n = Math.max(1, Math.min(20, n + Number(b.dataset.qty))); $('bb-qty-n').textContent = n; $('kd-qty').value = n; }); });
  // variant
  var sels = [].slice.call(document.querySelectorAll('.kd-opt'));
  function variant() { if (!sels.length) return; var w = sels.map(function (s) { return s.value; });
    var v = P.variants.find(function (x) { return x.options.every(function (o, i) { return o === w[i]; }); }); if (!v) return;
    $('kd-variant').value = v.id; [$('info-price'), $('pp-mhead-p'), $('bb-sticky-price')].forEach(function (e) { if (e) e.textContent = euro(v.price + ${VZ}); });
    var vq = (window.KD_VOORRAAD || {})[v.id]; $('bb-stock').innerHTML = !v.available ? 'Uitverkocht' : '<span class="bb-dot" aria-hidden="true"></span>' + (vq > 0 && vq <= 5 ? 'Nog ' + vq + ' op voorraad' : vq >= 20 ? 'Ruim op voorraad' : 'Op voorraad');
    ['buy-btn', 'cart-add-btn'].forEach(function (i) { $(i).disabled = !v.available; });
    if (v.featured_image) $('gal-img').src = v.featured_image.src; history.replaceState(null, '', '?variant=' + v.id); }
  sels.forEach(function (s) { s.addEventListener('change', variant); });
  // nu kopen = meteen naar de kassa; in winkelwagen = blijft hier
  $('buy-form').addEventListener('submit', function () { $('kd-return').value = '/checkout'; });
  $('bb-sticky-buy').addEventListener('click', function () { $('kd-return').value = '/checkout'; $('buy-form').submit(); });
  $('cart-add-btn').addEventListener('click', function () {
    fetch('/cart/add.js', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ items: [{ id: Number($('kd-variant').value), quantity: n }] }) })
      .then(function (r) { if (!r.ok) throw 0; return fetch('/cart.js'); }).then(function (r) { return r.json(); }).then(function (c) {
        document.querySelectorAll('[data-cart-count]').forEach(function (e) { e.textContent = c.item_count; e.hidden = !c.item_count; });
        var t = $('toast'); t.textContent = 'In je winkelwagen'; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 1800);
      }).catch(function () { $('buy-form').submit(); });
  });
  // leverdatum: werkdagen van het merk, gerekend vanaf vandaag in Nederland (alleen als de levertijd bekend is)
  try { var lv = $('bb-delivery'); if (lv) { var nu = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }));
    var plus = function (n) { var x = new Date(nu); while (n > 0) { x.setDate(x.getDate() + 1); if (x.getDay() && x.getDay() < 6) n--; } return x; };
    var dag = function (x) { return x.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }); };
    var a = plus(Number(lv.dataset.min)), b = plus(Number(lv.dataset.max));
    lv.querySelector('b').textContent = 'Vandaag besteld, ' + (a.getTime() === b.getTime() ? dag(a) : 'tussen ' + dag(a) + ' en ' + dag(b)) + ' in huis'; lv.hidden = false; } } catch (e) {}
  // klantenservice in Nederlandse tijd: nu bereikbaar, of wanneer weer
  try { var nl = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' })), d = nl.getDay(), m = nl.getHours() * 60 + nl.getMinutes(), o = $('kd-open');
    var werk = d >= 1 && d <= 5, open = werk && m >= 540 && m < 1050;
    o.textContent = open ? 'Nu bereikbaar, tot 17:30 uur' : (werk && m < 540 ? 'Vandaag vanaf 9:00 uur bereikbaar' : (d >= 5 || d === 0 ? 'Maandag vanaf 9:00 uur bereikbaar' : 'Morgen vanaf 9:00 uur bereikbaar')) + ' (ma t/m vr 9:00 tot 17:30)'; } catch (e) {}
  // vaste knop onderin op de telefoon zodra de koopknop uit beeld is
  var st = $('bb-sticky'); if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { st.classList.toggle('is-on', !e[0].isIntersecting && window.innerWidth < 900); }).observe($('buy-btn'));
})();
</script>`;

const VOORRAAD = `{%- if v.available -%}<span class="bb-dot" aria-hidden="true"></span>{%- if v.inventory_management and v.inventory_quantity > 0 and v.inventory_quantity <= 5 -%}Nog {{ v.inventory_quantity }} op voorraad{%- elsif v.inventory_management and v.inventory_quantity >= 20 -%}Ruim op voorraad{%- else -%}Op voorraad{%- endif -%}{%- else -%}Uitverkocht{%- endif -%}`;
// levertijd in werkdagen per merk uit kv sh:hub:levertijd ({ merk: [min, max] }); onbekend = geen datum (nooit gokken)
function levertijdSnippet(lt) {
  const regels = Object.entries(lt || {}).filter(([, d]) => Array.isArray(d) && d[0] > 0 && d[1] >= d[0]);
  if (!regels.length) return '{%- comment -%}nog geen levertijden bekend{%- endcomment -%}';
  return '{%- case merk -%}' + regels.map(([m, d]) => `{%- when ${JSON.stringify(m)} -%}<div class="bb-delivery" id="bb-delivery" data-min="${d[0]}" data-max="${d[1]}" hidden><span><b></b></span></div>`).join('') + '{%- endcase -%}';
}
const KAART = `<a class="sh-card" href="{{ p.url }}">
  <div class="sh-img">{% if p.featured_image %}<img src="{{ p.featured_image | image_url: width: 480 }}" alt="{{ p.title | escape }}" loading="lazy">{% endif %}</div>
  <div class="sh-body"><span class="sh-title">{{ p.title }}</span> <span class="sh-price">{% if p.price_varies %}vanaf {% endif %}{{ p.price | plus: ${VZ} | money }}</span></div>
</a>`;
const TRUST = `<p class="sh-trust"><span>${RETOUR}<a href="${KD}/returns">Gratis retourneren</a></span> <span>${SLOT}Veilig betalen met iDEAL</span></p>`;
const lijst = (bron, titel, intro) => `<main class="wrap">
  <header class="sh-head">
    <nav class="sh-crumb" aria-label="Categorieën"><a href="${KD}/shop">Shop</a> › <span>${titel}</span></nav>
    <h1>${titel}</h1>
    ${intro}
  </header>
  ${TRUST}
  {%- paginate ${bron} by 48 %}
  <section id="sh-grid" aria-label="Producten"><div class="sh-grid">
    {%- for p in ${bron} %}{% render 'kd-kaart', p: p %}{% endfor -%}
  </div></section>
  {%- if paginate.next %}<div class="sh-more kd-more"><a class="btn-buy" href="{{ paginate.next.url }}">Meer producten</a></div>{% endif %}
  {%- endpaginate %}
</main>`;
const COLLECTIE = lijst('collection.products', '{{ collection.title }}', '{% if collection.description != blank %}<p class="sh-intro">{{ collection.description | strip_html | truncate: 260 }}</p>{% endif %}');
const INDEX = lijst('collections.all.products', 'Shop', '<p class="sh-intro">Bijzondere spullen en cadeaus, veilig besteld. Terugsturen is gratis.</p>');
const ZOEK = `<main class="wrap">
  <header class="sh-head"><nav class="sh-crumb"><a href="${KD}/shop">Shop</a> › <span>Zoeken</span></nav>
    <h1>{% if search.performed %}{{ search.results_count }} resultaten voor “{{ search.terms | escape }}”{% else %}Zoeken{% endif %}</h1></header>
  <form action="{{ routes.search_url }}" method="get" class="kd-zoek"><input type="search" name="q" value="{{ search.terms | escape }}" placeholder="Zoek producten, merken…"><input type="hidden" name="type" value="product"><button class="btn-buy" type="submit">Zoeken</button></form>
  {%- if search.performed %}{% paginate search.results by 48 %}
  <section id="sh-grid" aria-label="Producten"><div class="sh-grid">{% for p in search.results %}{% if p.object_type == 'product' %}{% render 'kd-kaart', p: p %}{% endif %}{% endfor %}</div></section>
  {%- if paginate.next %}<div class="sh-more kd-more"><a class="btn-buy" href="{{ paginate.next.url }}">Meer</a></div>{% endif %}
  {% endpaginate %}{% endif %}
</main>`;
const KAR_T = `<main class="wrap">
  <header class="sh-head"><nav class="sh-crumb"><a href="${KD}/shop">Shop</a> › <span>Winkelwagen</span></nav><h1>Winkelwagen</h1></header>
  {%- if cart.item_count == 0 %}
  <p class="sh-intro">Je winkelwagen is leeg.</p><p><a class="btn-buy kd-inline" href="${KD}/shop">Verder winkelen</a></p>
  {%- else %}
  <form action="{{ routes.cart_url }}" method="post" class="kd-cart">
    {%- for i in cart.items %}
    <div class="kd-cart__r">
      <a href="{{ i.url }}" class="kd-cart__img">{% if i.image %}<img src="{{ i.image | image_url: width: 160 }}" alt="">{% endif %}</a>
      <div class="kd-cart__t"><a href="{{ i.url }}">{{ i.product.title }}</a>{% unless i.product.has_only_default_variant %}<small>{{ i.variant.title }}</small>{% endunless %}
        <label>Aantal <input type="number" min="0" name="updates[]" value="{{ i.quantity }}"></label></div>
      <b class="kd-cart__p">{{ i.final_line_price | money }}</b>
    </div>
    {%- endfor %}
    {%- assign kd_lev = '' -%}{%- for i in cart.items -%}{%- assign kd_v = i.vendor | append: '|' -%}{%- unless kd_lev contains kd_v -%}{%- assign kd_lev = kd_lev | append: kd_v -%}{%- endunless -%}{%- endfor -%}
    {%- assign kd_n = kd_lev | split: '|' | size -%}{%- assign kd_vz = kd_n | times: ${VZ} -%}
    <div class="kd-cart__som kd-cart__klein"><span>Producten</span><span>{{ cart.total_price | money }}</span></div>
    <div class="kd-cart__som kd-cart__klein"><span>Verzending{% if kd_n > 1 %} ({{ kd_n }} pakketten){% endif %}</span><span>{{ kd_vz | money }}</span></div>
    <div class="kd-cart__som"><span>Totaal</span><b>{{ cart.total_price | plus: kd_vz | money }}</b></div>
    <p class="bb-price-note">incl. btw · €${VERZEND} verzending per pakket, elk merk stuurt zelf</p>
    <div class="kd-cart__knop"><button type="submit" name="update" class="btn-cart-add">Bijwerken</button><button type="submit" name="checkout" class="btn-buy">Afrekenen ${PIJL}</button></div>
  </form>
  {%- endif %}
  ${TRUST}
</main>`;
const PAGINA = `<main class="wrap"><header class="sh-head"><h1>{{ page.title }}</h1></header><div class="pdx kd-tekst">{{ page.content }}</div></main>`;
const NIET = `<main class="wrap"><header class="sh-head"><h1>Deze pagina bestaat niet (meer)</h1><p class="sh-intro">Kijk in de shop, daar staat alles.</p></header><p><a class="btn-buy kd-inline" href="${KD}/shop">Naar de shop</a></p></main>`;
const LIJSTEN = `<main class="wrap"><header class="sh-head"><h1>Shop</h1></header><div class="sh-grid">{% for c in collections %}{% if c.products_count > 0 %}<a class="sh-card" href="{{ c.url }}"><div class="sh-img">{% if c.featured_image %}<img src="{{ c.featured_image | image_url: width: 480 }}" alt="" loading="lazy">{% endif %}</div><div class="sh-body"><span class="sh-title">{{ c.title }}</span></div></a>{% endif %}{% endfor %}</div></main>`;
const WACHTWOORD = `{% layout none %}<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Kadoly</title>{{ content_for_header }}
<style>body{margin:0;font:16px/1.5 Inter,system-ui,sans-serif;color:#111827;background:#fff;display:grid;place-items:center;min-height:100vh}main{max-width:420px;padding:24px}h1{font-size:24px}input,button{font:16px Inter,system-ui;padding:12px 14px;border-radius:12px;border:1px solid #111827;width:100%;box-sizing:border-box;margin-top:8px}button{background:#111827;color:#fff;font-weight:700}</style></head>
<body><main><h1>Kadoly</h1><p>Deze winkel gaat binnenkort open. Tot die tijd vind je alles op <a href="${KD}">kadoly.com</a>.</p>{% form 'storefront_password' %}{{ form.errors | default_errors }}<input type="password" name="password" placeholder="Wachtwoord"><button type="submit">Binnen</button>{% endform %}</main></body></html>`;
// klein beetje eigen CSS voor wat kadoly.com anders oplost (variantkeuze, winkelwagen, meer-knop); zelfde kleuren, geen grijs
const EXTRA = `.kd-shopify .bb-opt{margin:12px 0}.kd-shopify .bb-opt select{display:block;width:100%;margin-top:6px;font:inherit;font-size:16px;padding:10px 12px;border:1px solid #111827;border-radius:12px;background:#fff;color:#111827}
.kd-shopify .bb-was{margin-left:8px;color:#B91C1C}.kd-shopify .btn-buy[disabled],.kd-shopify .btn-cart-add[disabled]{opacity:.5;cursor:not-allowed}
.kd-more{display:flex;justify-content:center;margin:24px 0}.kd-inline{display:inline-flex;text-decoration:none}
.kd-zoek{display:flex;gap:8px;margin:0 0 16px}.kd-zoek input{flex:1;font:inherit;font-size:16px;padding:12px 14px;border:1px solid #111827;border-radius:12px}
.kd-cart{display:grid;gap:12px;margin:8px 0 24px}.kd-cart__r{display:grid;grid-template-columns:80px 1fr auto;gap:12px;align-items:center;border:1px solid #E6E8EB;border-radius:12px;padding:10px}
.kd-cart__img img{width:80px;height:80px;object-fit:cover;border-radius:8px;display:block}.kd-cart__t a{color:#111827;font-weight:600;text-decoration:none}.kd-cart__t small{display:block}
.kd-cart__t label{display:flex;gap:8px;align-items:center;margin-top:6px;font-size:16px}.kd-cart__t input{width:64px;font:inherit;padding:6px 8px;border:1px solid #111827;border-radius:8px}
.kd-cart__som{display:flex;justify-content:space-between;font-size:18px}.kd-cart__knop{display:flex;gap:12px;flex-wrap:wrap}.kd-cart__knop .btn-buy{flex:1}
.kd-tekst{max-width:760px}`;

export async function bouwThema() {
  const shop = await haal('/shop/wonen'); const pdp = await productPagina(shop);
  const kopP = maakKop(pdp), kopS = maakKop(shop) || kopP;
  const voetP = blok(pdp, '<footer class="footer', 'footer'), voetS = blok(shop, '<footer class="footer', 'footer') || voetP;
  if (!kopP || !voetP) throw new Error('kop of voet niet gevonden op kadoly.com');
  const links = koplinks(pdp) + '\n' + koplinks(shop).split('\n').filter(l => !koplinks(pdp).includes(l)).join('\n');
  const f = {
    'layout/theme.liquid': layout({ links: links.trim(), bodyProduct: bodyKlasse(pdp), bodyShop: bodyKlasse(shop) }),
    'snippets/kd-kop-product.liquid': kopP, 'snippets/kd-kop-shop.liquid': kopS,
    'snippets/kd-voet-product.liquid': rauw(absoluut(voetP)), 'snippets/kd-voet-shop.liquid': rauw(absoluut(voetS)),
    'snippets/kd-kaart.liquid': KAART, 'snippets/kd-voorraad.liquid': VOORRAAD, 'snippets/kd-levertijd.liquid': levertijdSnippet(await kv.get('sh:hub:levertijd').catch(() => null)),
    'assets/kd-product.css': stijlen(pdp), 'assets/kd-shop.css': stijlen(shop), 'assets/kd-extra.css': EXTRA,
    'templates/product.liquid': PRODUCT, 'templates/collection.liquid': COLLECTIE, 'templates/index.liquid': INDEX,
    'templates/list-collections.liquid': LIJSTEN, 'templates/search.liquid': ZOEK, 'templates/cart.liquid': KAR_T,
    'templates/page.liquid': PAGINA, 'templates/404.liquid': NIET, 'templates/password.liquid': WACHTWOORD,
    'config/settings_schema.json': JSON.stringify([{ name: 'theme_info', theme_name: 'Kadoly', theme_version: '1.0.0', theme_author: 'Kadoly', theme_documentation_url: KD, theme_support_url: KD + '/help' }], null, 2),
    'config/settings_data.json': JSON.stringify({ current: {} }),
    'locales/nl.default.json': JSON.stringify({ kadoly: { winkelwagen: 'Winkelwagen' } }),
  };
  return f;
}

// ---------- zip (zonder compressie, genoeg voor Shopify) ----------
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
export function zip(bestanden) {
  const delen = [], centraal = []; let pos = 0;
  for (const [naam, inhoud] of Object.entries(bestanden)) {
    const n = Buffer.from(naam, 'utf8'), d = Buffer.from(inhoud, 'utf8'), c = crc32(d);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(0, 8); lh.writeUInt32LE(0, 10);
    lh.writeUInt32LE(c, 14); lh.writeUInt32LE(d.length, 18); lh.writeUInt32LE(d.length, 22); lh.writeUInt16LE(n.length, 26); lh.writeUInt16LE(0, 28);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(0, 10); ch.writeUInt32LE(0, 12);
    ch.writeUInt32LE(c, 16); ch.writeUInt32LE(d.length, 20); ch.writeUInt32LE(d.length, 24); ch.writeUInt16LE(n.length, 28); ch.writeUInt32LE(0, 30); ch.writeUInt32LE(0, 34); ch.writeUInt32LE(0, 38); ch.writeUInt32LE(pos, 42);
    delen.push(lh, n, d); centraal.push(ch, n); pos += 30 + n.length + d.length;
  }
  const cd = Buffer.concat(centraal), eind = Buffer.alloc(22); const aantal = Object.keys(bestanden).length;
  eind.writeUInt32LE(0x06054b50, 0); eind.writeUInt16LE(aantal, 8); eind.writeUInt16LE(aantal, 10); eind.writeUInt32LE(cd.length, 12); eind.writeUInt32LE(pos, 16);
  return Buffer.concat([...delen, cd, eind]);
}

// ---------- Shopify ----------
export async function themaStand() {
  const t = (await kv.get(K.thema).catch(() => null)) || {}; const h = await shHub();
  if (!t.id) return Object.assign({ klaar: false }, t);
  const r = await shGql('query($id:ID!){ theme(id:$id){ id name role processing processingFailed } }', { id: t.id });
  const th = r.data && r.data.theme; const num = String(t.id).split('/').pop();
  return Object.assign({}, t, { thema: th || null, fout: r.fout || null, voorbeeld: h ? 'https://' + h.shop + '.myshopify.com/?preview_theme_id=' + num : null });
}
// stap 1: eenmalige sleutel, Shopify haalt het zip op via de openbare host
export async function themaMaak({ basis = 'https://keuzehulp.best' } = {}) {
  const sleutel = Math.random().toString(36).slice(2) + Date.now().toString(36);
  await kv.set(K.zip, sleutel, { ex: 900 });
  const bron = basis + '/api/dp?op=shthemazip&k=' + sleutel;
  const M = 'mutation($s:URL!,$n:String){ themeCreate(source:$s, name:$n, role:UNPUBLISHED){ theme{ id name role processing } userErrors{ field message code } } }';
  const r = await shGql(M, { s: bron, n: 'Kadoly' });
  const d = r.data && r.data.themeCreate; const fout = r.fout || (d && d.userErrors && d.userErrors.length ? d.userErrors.map(e => e.message).join('; ') : '');
  if (d && d.theme) await kv.set(K.thema, { id: d.theme.id, naam: d.theme.name, at: nu(), sync: null });
  return { ok: !!(d && d.theme), fout, thema: d && d.theme };
}
export async function themaZipSleutel(k) { const s = await kv.get(K.zip).catch(() => null); return !!s && s === k; }
// stap 2 en elke nacht: alle bestanden opnieuw (kop, voet en CSS volgen kadoly.com)
export async function themaSync({ alleen } = {}) {
  const t = (await kv.get(K.thema).catch(() => null)) || {}; if (!t.id) return { ok: false, fout: 'nog geen thema (op=shthema&doe=maak)' };
  const f = await bouwThema(); const namen = Object.keys(f).filter(n => !alleen || alleen.test(n));
  const M = 'mutation($t:ID!,$f:[OnlineStoreThemeFilesUpsertFileInput!]!){ themeFilesUpsert(themeId:$t, files:$f){ upsertedThemeFiles{ filename } userErrors{ filename message } } }';
  const klaar = [], fouten = [];
  for (let i = 0; i < namen.length; i += 5) {
    const deel = namen.slice(i, i + 5).map(n => ({ filename: n, body: { type: 'TEXT', value: f[n] } }));
    const r = await shGql(M, { t: t.id, f: deel }); const d = r.data && r.data.themeFilesUpsert;
    if (r.fout) fouten.push(r.fout); if (d) { (d.upsertedThemeFiles || []).forEach(x => klaar.push(x.filename)); (d.userErrors || []).forEach(e => fouten.push(e.filename + ': ' + e.message)); }
  }
  t.sync = nu(); t.syncFouten = fouten.slice(0, 10); await kv.set(K.thema, t);
  return { ok: !fouten.length, bestanden: klaar.length, fouten: fouten.slice(0, 10) };
}
export async function themaPubliceer() {
  const t = (await kv.get(K.thema).catch(() => null)) || {}; if (!t.id) return { ok: false, fout: 'nog geen thema' };
  const r = await shGql('mutation($id:ID!){ themePublish(id:$id){ theme{ id role } userErrors{ message } } }', { id: t.id });
  const d = r.data && r.data.themePublish; const fout = r.fout || (d && d.userErrors && d.userErrors.length ? d.userErrors.map(e => e.message).join('; ') : '');
  if (!fout) { t.live = nu(); await kv.set(K.thema, t); } return { ok: !fout, fout, thema: d && d.theme };
}
