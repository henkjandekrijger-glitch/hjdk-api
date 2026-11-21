// Rooktest bij elke deploy (npm run build): rendert een paar keuzehulppagina's. Gooit een pagina een fout of een 500, dan faalt de build
// en blijft de vorige versie live. Aanleiding: 21 nov 2026 gaven alle keuzehulpen 30 minuten een 500 (variabele in commentaar geschoven).
// Traag of geen antwoord binnen 20 s telt niet als fout: alleen echte fouten houden een deploy tegen.
const PAG = [['keuzehulp.best', '/api/kz?slug=airfryer'], ['keuzehulp.best', '/api/kz?slug=matras'], ['keuzehulp.best', '/api/kz']];
const kz = (await import('../api/kz.js')).default;
let fout = 0;
for (const [host, url] of PAG) {
  const uit = await new Promise(klaar => {
    const t = setTimeout(() => klaar('traag'), 20000);
    const res = { statusCode: 200, setHeader() {}, getHeader() {}, status(c) { this.statusCode = c; return this; }, send() { clearTimeout(t); klaar(this.statusCode); }, end() { this.send(); }, json() { this.send(); }, redirect() { clearTimeout(t); klaar(302); } };
    Promise.resolve().then(() => kz({ url, headers: { host }, query: {}, method: 'GET' }, res)).catch(e => { clearTimeout(t); klaar('fout: ' + (e && e.message)); });
  });
  const goed = uit === 'traag' || (typeof uit === 'number' && uit < 500);
  console.log((goed ? 'ok   ' : 'FOUT ') + host + url + ' -> ' + uit);
  if (!goed) fout++;
}
process.exit(fout ? 1 : 0);
