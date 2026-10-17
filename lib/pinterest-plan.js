// Pure publication decisions; network and Redis live in pinterest-direct.js.
export const DAY = 86400000;
export function nextPin(catalog, market, records, now, legacy = new Set()) {
  for (const item of catalog) {
    const base = records[market + ':' + item.slug + ':0'];
    for (let v = 0; v < 3; v++) {
      const id = market + ':' + item.slug + ':' + v;
      if (records[id]) continue; // Includes uncertain attempts: never blindly duplicate.
      if (v === 0 && legacy.has(item.slug)) continue;
      if (v > 0 && base?.status !== 'published') continue;
      if (v > 0 && now < base.at + [0, 7, 21][v] * DAY) continue;
      return { id, item, market, variant: v };
    }
  }
  return null;
}
export function localDay(now) { return new Date(now - 4 * 3600000).toISOString().slice(0, 10); }
export function validateConfig(input) {
  const markets = [...new Set(input.markets || [])];
  if (!markets.length || markets.some(m => !['nl','us','de'].includes(m))) throw new Error('Kies NL, US en/of DE');
  return { enabled: input.enabled === true, markets, standard: input.standard === true,
    dailyPerMarket: Math.min(3, Math.max(1, Math.floor(Number(input.dailyPerMarket) || 1))) };
}
