// Checkoutrapportage: klikgedrag, aangemaakte orders en providerresultaat zijn verschillende metingen.
const DAG = 86400000;

export function kassaTeller(rec, soort, letter) {
  // kl was zowel de directe checkoutlanding als lang vertrek. Bewaar oude data als gemengd.
  const code = soort === 'kpag' && rec.ka ? 'k0' : soort === 'kweglang' ? 'k9' : letter;
  return (rec.arm === 'd' ? 'd' : 'l') + code;
}

function tel(rijen) {
  const uit = { bestellingen: 0, betaald: 0, verlopen: 0, anders: 0, methodes: {} };
  for (const r of rijen) {
    const status = String(r.status || '').trim().toLowerCase();
    uit.bestellingen++;
    if (status === 'paid' || status === 'betaald') uit.betaald++;
    else if (status === 'expired' || status === 'verlopen') uit.verlopen++;
    else uit.anders++;
    const sleutel = (r.methode || '-') + ':' + status;
    uit.methodes[sleutel] = (uit.methodes[sleutel] || 0) + 1;
  }
  return uit;
}

function groepeer(rijen, sleutel) {
  const groepen = new Map();
  for (const r of rijen) {
    const k = sleutel(r);
    if (!groepen.has(k)) groepen.set(k, []);
    groepen.get(k).push(r);
  }
  return Object.fromEntries([...groepen].map(([k, r]) => [k, tel(r)]));
}

export function kassaBestellingen(lijst, { dagen = 28, nu = Date.now(), feedFout = null } = {}) {
  dagen = Math.max(1, Math.min(60, Math.trunc(Number(dagen)) || 28));
  const vandaag = Math.floor(nu / DAG) * DAG;
  const van = vandaag - (dagen - 1) * DAG;
  const uitgesloten = { buitenPeriode: 0, datumOntbreekt: 0, toekomst: 0, test: 0, dubbel: 0 };
  const ids = new Set(), rijen = [];
  for (const r of lijst) {
    const at = Date.parse(r.at || '');
    if (!Number.isFinite(at)) { uitgesloten.datumOntbreekt++; continue; }
    if (at < van) { uitgesloten.buitenPeriode++; continue; }
    if (at > nu) { uitgesloten.toekomst++; continue; }
    if (r.test === true) { uitgesloten.test++; continue; }
    const id = String(r.order || '');
    if (id && ids.has(id)) { uitgesloten.dubbel++; continue; }
    if (id) ids.add(id);
    rijen.push(r);
  }
  return {
    totaal: rijen.length,
    perNet: groepeer(rijen, r => r.net || '?'),
    perMethode: groepeer(rijen, r => r.methode || '-'),
    perDag: groepeer(rijen, r => new Date(Date.parse(r.at)).toISOString().slice(0, 10)),
    periode: { dagen, van: new Date(van).toISOString(), tot: new Date(nu).toISOString(), tijdzone: 'UTC', basis: 'created_at' },
    uitgesloten,
    teststatusOnbekend: rijen.filter(r => r.test == null).length,
    meetdefinitie: 'Aangemaakte bestellingen uit de beschikbare shopfeed (maximaal 200 regels). Geen bevestigde providerstarts of bankacceptatiegraad. Een onbekende teststatus bewijst geen echte klant.',
    feedFout,
    lijst: rijen
  };
}
