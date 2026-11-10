// WAM via WhatsApp (Henkjan 10 nov 2026 22:59 UTC: "Ja mag even mijn whatsapp zijn morgen pak ik een nieuw nr daarvoor . MCP vind je op vercel ."):
// een bezoeker stuurt met één tik "Meld mijn match <code>" naar het WhatsApp-nummer van de koppeling (whatsappp-mcp op Railway, adres met sleutel
// alleen in de Vercel-variabele WHAPP_MCP_URL). WAM leest die berichten, koppelt de code aan de bezoeker en bewaart het nummer als contact.
// Bij een match gaat er één bericht naar wie eerst zelf schreef; nooit naar vreemden, binnen de dagelimiet van de koppeling.
export async function whapp(naam, args = {}) {
  const url = process.env.WHAPP_MCP_URL;
  if (!url) throw new Error('WHAPP_MCP_URL ontbreekt in Vercel');
  const res = await fetch(url, {
    method: 'POST', signal: AbortSignal.timeout(30000),
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: naam, arguments: args } }),
  });
  const txt = await res.text();
  if (res.status === 401) throw new Error('koppeling weigert de sleutel (401)');
  if (!res.ok) throw new Error('koppeling ' + res.status);
  const regel = txt.split('\n').filter((x) => x.startsWith('data:')).pop();
  const j = JSON.parse(regel ? regel.slice(5) : txt);
  if (j.error) throw new Error(String(j.error.message || 'fout').slice(0, 200));
  const t = (j.result && j.result.content && j.result.content[0] && j.result.content[0].text) || '';
  if (j.result && j.result.isError) throw new Error(String(t).slice(0, 200));
  try { return JSON.parse(t); } catch { return t; }
}
export const waKlaar = () => !!process.env.WHAPP_MCP_URL;
// verkenning (beschermd): is de koppeling er, welk nummer, welke kolommen heeft messages
export async function waProbe() {
  if (!waKlaar()) return { klaar: false };
  const uit = { klaar: true };
  try { const s = await whapp('status', {}); uit.status = typeof s === 'string' ? s.slice(0, 600) : JSON.stringify(s).slice(0, 600); } catch (e) { uit.statusFout = String(e.message || e).slice(0, 200); }
  try { const q = await whapp('query', { sql: 'SELECT * FROM messages ORDER BY rowid DESC LIMIT 1' }); uit.kolommen = typeof q === 'string' ? q.slice(0, 400) : Object.keys((Array.isArray(q) ? q[0] : (q.rows || [])[0]) || {}); } catch (e) { uit.queryFout = String(e.message || e).slice(0, 200); }
  return uit;
}
