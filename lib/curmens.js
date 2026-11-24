// Eén meetgrens voor gidsen en bedrijven; geen runtime-AI of extra netwerkbron.
export const MEET_SINDS = '2026-11-23';
export function botUa(ua) { return /bot|crawler|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|flipboardproxy/i.test(String(ua || '')); }
export function bijMens(fn) {
  var w = window, d = document, n = navigator;
  if (n.webdriver || /bot|crawler|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|flipboardproxy/i.test(n.userAgent || '')) return;
  if (w.__curMens) { w.__curMens(fn); return; }
  var klaar = false, rij = [], timer = null;
  w.__curMens = function (f) { if (klaar) f(); else rij.push(f); };
  function start(e) { if (klaar || (e && e.isTrusted === false)) return; klaar = true; clearTimeout(timer); while (rij.length) { try { rij.shift()(); } catch (_) {} } }
  function zicht() { clearTimeout(timer); if (d.visibilityState !== 'hidden' && !klaar) timer = setTimeout(start, 3000); }
  ['pointerdown', 'touchstart', 'keydown', 'scroll', 'click'].forEach(function (e) { d.addEventListener(e, start, { passive: true, capture: true }); });
  d.addEventListener('visibilitychange', zicht); w.__curMens(fn); zicht();
}
