// Alleen-lezen bewijs voor TAAK G: links in de server-HTML en de gids-sitemap in robots.txt.
// Geen browserzichtbaarheid, echte crawler-IP-toegang of indexering uit deze signalen afleiden.
const HOST = 'gids.kadoly.com';
const decode = s => String(s || '').replace(/&(?:amp|quot|apos|lt|gt);|&#(?:x[0-9a-f]+|[0-9]+);/gi, m => {
  const namen = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' };
  if (namen[m.toLowerCase()]) return namen[m.toLowerCase()];
  const n = m.slice(2, -1); const k = /^x/i.test(n) ? parseInt(n.slice(1), 16) : Number(n);
  return k > 0 && k <= 0x10ffff ? String.fromCodePoint(k) : '';
});
function attrs(tag) {
  const a = {};
  for (const m of tag.matchAll(/([^\s=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) a[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  return a;
}
export function gidsOntdekking(inhoud, basis = 'https://kadoly.com/', opt = {}) {
  const tekst = String(inhoud || '');
  const html = tekst.replace(/<!--[\s\S]*?-->|<(script|style|template|textarea|title|xmp|iframe|noembed|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  const links = [], gezien = new Set();
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)) {
    const a = attrs(m[1]); if (!a.href) continue;
    let u; try { u = new URL(a.href, basis); } catch { continue; }
    if (u.protocol !== 'https:' || u.hostname !== HOST || u.username || u.password) continue;
    const rel = String(a.rel || '').toLowerCase().split(/\s+/).filter(Boolean);
    const sleutel = u.href + '|' + rel.join(' '); if (gezien.has(sleutel)) continue; gezien.add(sleutel);
    links.push({ url: u.href, tekst: decode(m[2].replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 180), rel, volgbaar: !rel.some(x => ['nofollow', 'sponsored', 'ugc'].includes(x)) && !Object.hasOwn(a, 'hidden') });
  }
  let robots = false; try { robots = new URL(basis).pathname === '/robots.txt' && /^text\/plain(?:;|$)/i.test(opt.contentType || ''); } catch {}
  const sitemaps = robots ? [...tekst.matchAll(/^\s*Sitemap:\s*(\S+)/gim)].map(m => m[1]).filter(u => u === 'https://' + HOST + '/sitemap.xml') : [];
  return { bron: 'server-HTML en robots-tekst; geen bewijs van zichtbaarheid of indexering', gidsLinks: links.slice(0, 100), gidsLinksAfgekapt: links.length > 100, gidsSitemapInRobots: sitemaps.length > 0 };
}
