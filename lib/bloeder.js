// Bloeders afkappen (Henkjan 24 nov 2026: "Zorg dat je meteen afkapt als een ad een bleeder is en maak nieuwe ad . Ads zijn gratis geld niet . Neem wel leer tijd in acht .").
// Eén regel voor elke advertentie op elk kanaal (TikTok, Meta via Whop, Pinterest). Leertijd eerst: geen oordeel zolang een advertentie minder dan
// leerVert vertoningen en minder dan leerSpend euro of dollar uitgaf. Daarna uit bij de eerste van:
//   1. klikratio onder ctrMin van dat kanaal (mensen scrollen erlangs);
//   2. geenMens uitgegeven en Clickmind zag nog geen echt mens aankomen (alleen waar Clickmind per advertentie meet);
//   3. geenStap uitgegeven zonder één bewuste afrekenstap (tik op de koopknop, afrekenpagina, mandje) of verkoop.
// Een advertentie met een verkoop gaat nooit uit. Per groep blijft er altijd een minimum aan (de aanroeper bewaakt dat), en elke uitgezette
// advertentie krijgt een nieuwe met een andere haak voor hetzelfde product (Whop zelf in lib/whop.js; TikTok en Pinterest via de sieradencontrole).
export const BLOED = { leerVert: 1000, leerSpend: 1.5, ctrMin: { tt: 0.0035, wh: 0.005, pin: 0.003 }, geenMens: 2.5, geenStap: 4 };
export function bloeder(x, net) {
  const vert = Number(x.vert) || 0, kliks = Number(x.kliks) || 0, spend = Number(x.spend) || 0, koop = Number(x.koop) || 0;
  if (koop > 0) return null;
  if (vert < BLOED.leerVert && spend < BLOED.leerSpend) return null; // leertijd
  const ctr = vert ? kliks / vert : 0, min = BLOED.ctrMin[net] || 0.004;
  if (vert >= BLOED.leerVert && ctr < min) return { soort: 'ctr', reden: `klikratio ${(ctr * 100).toFixed(2)}% na ${vert} vertoningen (grens ${(min * 100).toFixed(2)}%)` };
  if (x.echt != null && spend >= BLOED.geenMens && Number(x.echt) === 0) return { soort: 'mens', reden: `${spend.toFixed(2)} uitgegeven, ${kliks} kliks, geen echt mens aangekomen` };
  if (spend >= BLOED.geenStap && !(Number(x.stap) > 0)) return { soort: 'stap', reden: `${spend.toFixed(2)} uitgegeven zonder afrekenstap of verkoop` };
  return null;
}
