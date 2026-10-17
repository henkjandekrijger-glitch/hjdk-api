// Client gebruikt exact dezelfde geteste naamregels als de server (op=rules).
export const TOOL_CLIENT = String.raw`
import { suggestDomains, annualCosts } from '/api/keuze-tools?op=rules';
const node = document.getElementById('tool-config');
const cfg = node ? JSON.parse(node.textContent) : null;
const $ = id => document.getElementById(id);
const text = (tag, value, className) => { const n = document.createElement(tag); n.textContent = value; if (className) n.className = className; return n; };
function hit(event) {
  if (!cfg) return;
  const prefix = cfg.market === 'nl' ? 'hjdk6-kz-' + cfg.slug : 'wtb-' + cfg.market + '-' + cfg.slug;
  try { navigator.sendBeacon('/api/hjdk/stats/hits', new Blob([JSON.stringify({ hits: [[prefix + '-' + event, 1]] })], { type: 'text/plain' })); } catch {}
}
if (cfg) {
  hit(cfg.market === 'nl' ? 'page' : 'view');
  const day = new Date().toISOString().slice(0, 10);
  let origin = 'direct';
  try {
    const utm = new URLSearchParams(location.search).get('utm_source') || '';
    const host = document.referrer ? new URL(document.referrer).hostname : '';
    const value = (utm + ' ' + host).toLowerCase();
    origin = /gemini/.test(value) ? 'gemini' : /google/.test(value) ? 'google' : /chatgpt|openai/.test(value) ? 'chatgpt' : /perplexity/.test(value) ? 'perplexity' : /bing/.test(value) ? 'bing' : /copilot/.test(value) ? 'copilot' : /claude/.test(value) ? 'claude' : /pinterest/.test(value) ? 'pinterest' : /keuzehulp|whichtobuy|kaufberater/.test(host) ? 'intern' : host ? 'other' : 'direct';
    if (origin !== 'intern') {
      const keys = cfg.market === 'nl' ? ['hjdk6-kz-org-' + cfg.slug, 'hjdk6-kz-org-src-' + origin, 'hjdk6-kz-orgd-' + day.replace(/-/g, ''), 'hjdk6-kz-orgd-' + day.replace(/-/g, '') + '-' + origin] : ['wtb-' + cfg.market + '-src-' + origin, 'wtb-' + cfg.market + '-d-' + day + '-' + origin];
      navigator.sendBeacon('/api/hjdk/stats/hits', new Blob([JSON.stringify({ hits: keys.map(k => [k, 1]) })], { type: 'text/plain' }));
    }
  } catch {}
  const u = cfg.ui || {};
  document.querySelectorAll('[data-need]').forEach(b => b.addEventListener('click', () => { hit('need-' + b.dataset.need); $('feedback-status').textContent = u.thanks; b.disabled = true; }));
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-out],a[data-product]'); if (!a) return;
    hit(a.dataset.product ? a.dataset.product + '-clk' : 'help-' + a.dataset.out + '-clk');
    if (a.dataset.product) hit('clk');
  });
  if (cfg.tool === 'domain') {
    let names = [], revision = 0, controller = null;
    const result = $('domain-results'), status = $('domain-status'), check = $('domain-check');
    function generate(e) {
      if (e) e.preventDefault();
      if (!$('domain-form').reportValidity()) return;
      ++revision; if (controller) controller.abort(); check.disabled = false;
      names = suggestDomains($('brand').value, cfg.market, Number($('kind').value), $('audience').value === 'global');
      result.replaceChildren(); status.textContent = names.length ? '' : u.empty; check.hidden = !names.length;
      names.forEach(p => {
        const card = text('div', '', 'tool-card'); card.dataset.domain = p.domain;
        card.append(text('strong', p.domain, 'name'), text('p', u.score + ': ' + p.score + '/100 · ' + p.length + ' ' + u.length, 'score'));
        card.append(text('p', [p.short && u.short, p.noHyphen && u.noHyphen, p.noNumber && u.noNumber, p.fit && u.tld].filter(Boolean).join(' · '), 'tool-note'));
        card.append(text('p', u.status, 'availability'));
        const copy = text('button', u.copy); copy.type = 'button'; copy.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(p.domain); copy.textContent = u.copied; hit('copy'); }
          catch { const range = document.createRange(); range.selectNodeContents(card.querySelector('.name')); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); }
        }); card.append(copy); result.append(card);
      });
      if (names.length) hit('generate');
    }
    $('domain-form').addEventListener('submit', generate);
    ['audience', 'kind'].forEach(id => $(id).addEventListener('change', () => { if (names.length) generate(); }));
    $('brand').addEventListener('input', () => { ++revision; if (controller) controller.abort(); names = []; result.replaceChildren(); check.hidden = true; check.disabled = false; status.textContent = ''; });
    check.addEventListener('click', async () => {
      if (!names.length) return;
      const rev = revision; controller = new AbortController(); check.disabled = true; status.textContent = u.checking; result.setAttribute('aria-busy', 'true');
      try {
        const response = await fetch('/api/keuze-tools?op=domains', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ domains: names.map(n => n.domain) }), signal: controller.signal });
        if (!response.ok) throw new Error('lookup');
        const data = await response.json(); if (!data.ok || !Array.isArray(data.results)) throw new Error('lookup');
        if (rev !== revision) return;
        data.results.forEach(p => {
          const card = [...result.children].find(x => x.dataset.domain === p.domain); if (!card) return;
          const label = card.querySelector('.availability'); label.textContent = p.available === true ? u.free : p.available === false ? u.taken : u.unknown; label.className = 'availability' + (p.available === true ? ' good' : '');
          const parts = []; const usd = x => new Intl.NumberFormat(cfg.market === 'de' ? 'de-DE' : cfg.market === 'nl' ? 'nl-NL' : 'en-US', { style: 'currency', currency: 'USD' }).format(x);
          if (p.unsupported && p.registry) { const link = text('a', cfg.market === 'nl' ? 'Controleer bij het register' : cfg.market === 'de' ? 'Beim Register prüfen' : 'Check the registry'); link.href = p.registry; link.target = '_blank'; link.rel = 'noopener'; label.append(document.createTextNode(' · '), link); }
          if (p.years && p.price != null) parts.push(u.cost + ': ' + usd(p.price) + ' / ' + p.years + ' ' + u.term);
          if (p.years && p.renewalPrice != null) parts.push(u.renewal + ': ' + usd(p.renewalPrice) + ' / ' + p.years + ' ' + u.term);
          if (p.premium) parts.push('Premium');
          if (parts.length) label.append(text('span', ' · ' + parts.join(' · '), 'tool-prices'));
        });
        status.textContent = u.source + ' · ' + new Date(data.checkedAt).toLocaleString(cfg.market === 'us' ? 'en-US' : cfg.market === 'de' ? 'de-DE' : 'nl-NL'); hit('availability');
      } catch (e) { if (e.name !== 'AbortError' && rev === revision) { status.textContent = u.offline; hit('availability-error'); } }
      finally { if (rev === revision) { check.disabled = false; result.removeAttribute('aria-busy'); } }
    });
  }
  if (cfg.tool === 'laadpaal') {
    const form = $('laad-form'), result = $('laad-result'); let seq = 0, controller = null, fallback = false;
    const seen = new Set();
    async function update(e) {
      if (fallback && e && e.type === 'submit') return;
      if (e) e.preventDefault();
      const route = [0, 1, 2].map(i => form.elements['q' + i].value), current = ++seq;
      if (controller) controller.abort(); controller = new AbortController();
      result.textContent = 'Je advies wordt bijgewerkt…'; result.setAttribute('aria-busy', 'true'); $('laad-products').replaceChildren();
      try {
        const response = await fetch('/api/keuze-tools?op=laadadvies&a=' + route.join('-'), { signal: controller.signal });
        if (!response.ok) throw new Error('advice'); const data = await response.json(); if (!data.ok) throw new Error('advice'); if (current !== seq) return;
        result.innerHTML = data.html; $('laad-products').innerHTML = data.productsHtml;
        const url = new URL(location.href); route.forEach((v, i) => url.searchParams.set('q' + i, v)); history.replaceState(null, '', url);
        hit('r' + route.join('') + '-imp'); hit('adv'); fallback = false;
      } catch (error) { if (error.name !== 'AbortError' && current === seq) { result.textContent = 'Het advies kon niet worden bijgewerkt. Klik op Bekijk mijn advies om de pagina opnieuw te laden.'; fallback = true; } }
      finally { if (current === seq) result.removeAttribute('aria-busy'); }
    }
    form.addEventListener('submit', update);
    form.addEventListener('change', e => { const i = e.target.name.slice(1); hit('q' + i + '-' + e.target.value); if (!seen.has(i)) { seen.add(i); hit('q' + i); } update(e); });
    $('cost-form').addEventListener('submit', e => {
      e.preventDefault(); const values = ['km', 'use', 'home', 'public', 'share'].map(n => $('cost-' + n).value), costs = annualCosts(values);
      if (!costs) { $('cost-result').textContent = 'Vul geldige waarden binnen de aangegeven grenzen in.'; return; }
      const euro = x => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(x);
      $('cost-result').textContent = Math.round(costs.kwh) + ' kWh per jaar: ' + euro(costs.home) + ' thuis tegenover ' + euro(costs.public) + ' openbaar. Verschil: ' + euro(Math.abs(costs.difference)) + (costs.difference >= 0 ? ' minder' : ' meer') + ' stroomkosten bij thuisladen.'; hit('calculator');
    });
  }
}
`;
