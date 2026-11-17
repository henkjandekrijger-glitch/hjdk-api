// Share only the article's own content and photography. Flipboard's documented
// extraction hints prevent site-wide emergency contacts from becoming the excerpt.
// https://about.flipboard.com/inside-flipboard/tips-to-optimize-your-web-content-for-display-on-flipboard/
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const decode = s => String(s || '').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;/g, "'");
const attr = (tag, key) => {
  const m = new RegExp('\\b' + key + '\\s*=\\s*(["\\\'])([\\s\\S]*?)\\1', 'i').exec(tag);
  return m ? decode(m[2]) : '';
};
const meta = (html, key) => [...html.matchAll(/<meta\b[^>]*>/gi)]
  .filter(m => (attr(m[0], 'property') || attr(m[0], 'name')).toLowerCase() === key)
  .map(m => attr(m[0], 'content'));
const withClass = (tag, cls) => {
  if (new RegExp('(?:^|\\s)' + cls + '(?:\\s|$)').test(attr(tag, 'class'))) return tag;
  return /\bclass\s*=/i.test(tag)
    ? tag.replace(/\bclass\s*=\s*(["'])(.*?)\1/i, (_, q, value) => 'class=' + q + value + ' ' + cls + q)
    : tag.replace(/\s*\/?>$/, end => ' class="' + cls + '"' + end);
};
function photoUrl(raw, base) {
  if (!raw || /^(data|blob|javascript):/i.test(raw)) return '';
  try {
    const u = new URL(decode(raw), base);
    if (!/^https?:$/.test(u.protocol) || /(?:\.svg|\.gif)(?:$|\?)/i.test(u.href)) return '';
    // The default brand tile is not a photograph. Do not replace it with an
    // unrelated stock photo or a photo found in the navigation / footer.
    const subject = u.searchParams.get('u') || u.href;
    if (/\/brand\/|todayin-curacao|cw-vlag|(?:^|[\/_.-])(logo|avatar|icon|favicon)(?:[\/_.-]|$)/i.test(subject)) return '';
    return u.href;
  } catch { return ''; }
}
export function socialHtml(html) {
  if (typeof html !== 'string' || !/<\/head>/i.test(html) || !/<main\b/i.test(html)) return html;
  const canonicalTag = [...html.matchAll(/<link\b[^>]*>/gi)].find(m => attr(m[0], 'rel').toLowerCase() === 'canonical');
  const canonical = canonicalTag ? attr(canonicalTag[0], 'href') : '';
  try { if (new URL(canonical).hostname !== 'curacao.day') return html; } catch { return html; }
  // Preserve scripts and styles byte-for-byte. HTML-looking strings in JavaScript
  // must not acquire extraction classes or change registration / analytics flows.
  const parts = html.split(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>)/gi);
  const markup = parts.filter((_, i) => i % 2 === 0).join('');
  const main = (markup.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i) || [])[1] || '';
  const primary = main.split(/<(?:section|div|aside)\b[^>]*\bid=["'](?:ama|nummers)["']/i)[0];
  const images = [...primary.matchAll(/<img\b[^>]*>/gi)];
  const first = images.map(m => ({ tag: m[0], url: photoUrl(attr(m[0], 'src'), canonical), alt: attr(m[0], 'alt') }))
    .find(x => x.url);
  const image = meta(markup.split(/<\/head>/i)[0], 'og:image').map(u => photoUrl(u, canonical)).find(Boolean) || first?.url || '';
  const selectedAlt = first?.url === image ? first.alt : '';
  const imageKeys = new Set(['og:image', 'og:image:url', 'og:image:secure_url', 'og:image:alt', 'og:image:width', 'og:image:height', 'og:image:type', 'twitter:image', 'twitter:card']);
  for (let i = 0; i < parts.length; i += 2) {
    let p = parts[i];
    p = p.replace(/<meta\b[^>]*>/gi, tag => imageKeys.has((attr(tag, 'property') || attr(tag, 'name')).toLowerCase()) ? '' : tag);
    p = p.replace(/<(?:header|nav|footer)\b[^>]*>/gi, tag => withClass(tag, 'flipboard-remove'));
    p = p.replace(/<(?:section|div|aside)\b[^>]*>/gi, tag =>
      /^(?:nummers|aanmeld|ama)$/.test(attr(tag, 'id')) ? withClass(tag, 'flipboard-remove') : tag);
    p = p.replace(/<h1\b[^>]*>/gi, tag => withClass(tag, 'flipboard-title'));
    p = p.replace(/<p\b[^>]*>/gi, tag =>
      /(?:^|\s)(?:s|lead|intro)(?:\s|$)/.test(attr(tag, 'class')) ? withClass(tag, 'flipboard-keep') : tag);
    p = p.replace(/<img\b[^>]*>/gi, tag =>
      image && photoUrl(attr(tag, 'src'), canonical) === image ? withClass(tag, 'flipboard-image') : tag);
    p = p.replace(/<\/head>/i, () => (image
      ? '<meta property="og:image" content="' + esc(image) + '"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="' + esc(image) + '">' + (selectedAlt ? '<meta property="og:image:alt" content="' + esc(selectedAlt) + '">' : '')
      : '<meta name="twitter:card" content="summary">') + '</head>');
    parts[i] = p;
  }
  return parts.join('');
}
