// Aangegeven organische herkomst uit de gidsreferer, geen bewezen platformbezoek of koop.
// Alleen een volledige HTTPS-referer van onze gids; nooit willekeurige queryvelden of persoonsgegevens bewaren.
export function gidsHerkomst(referer) {
  try {
    const u = new URL(referer);
    if (u.protocol !== 'https:' || u.host !== 'gids.kadoly.com' || u.username || u.password) return {};
    const source = u.searchParams.get('utm_source') || '', medium = u.searchParams.get('utm_medium') || '', campaign = u.searchParams.get('utm_campaign') || '';
    if (!['pinterest', 'youtube', 'instagram', 'facebook', 'tiktok', 'flipboard'].includes(source)) return {};
    if (!['organic_social', 'social', 'video', 'organic'].includes(medium) || !/^[a-zA-Z0-9_-]{1,80}$/.test(campaign)) return {};
    return { gids_source: source, gids_medium: medium, gids_campaign: campaign };
  } catch { return {}; }
}
