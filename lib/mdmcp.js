// Mondiad vanuit de cloud: OAuth (eenmalig koppelen, daarna zelf verversen) + de officiële Mondiad MCP-server als API.
// Zo draait de leerlus op Vercel, los van een Claude-account of een laptop.
import { createHash, randomBytes } from 'node:crypto';
import { kv } from './db.js';

const BASE = 'https://mcp.members.mondiad.com';
const K = 'hjdk:md:oauth';
const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function jfetch(url, opt) { const r = await fetch(url, opt); const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) {} return { ok: r.ok, status: r.status, j, t, h: r.headers }; }

export async function mdState() { try { return (await kv.get(K)) || null; } catch (e) { return null; } }

export async function mdStart(redirect) {
  let st = (await mdState()) || {};
  if (!st.client_id || st.redirect !== redirect) {
    const r = await jfetch(BASE + '/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ client_name: 'keuzehulp-leerlus', redirect_uris: [redirect], grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'], token_endpoint_auth_method: 'none', scope: 'mcp' }) });
    if (!r.j || !r.j.client_id) throw new Error('registreren bij Mondiad mislukt (' + r.status + '): ' + r.t.slice(0, 200));
    st = Object.assign({}, st, { client_id: r.j.client_id, redirect }); await kv.set(K, st);
  }
  const verifier = b64u(randomBytes(48)), state = b64u(randomBytes(16));
  await kv.set('hjdk:md:pkce:' + state, { verifier, redirect }, { ex: 1800 });
  const challenge = b64u(createHash('sha256').update(verifier).digest());
  return BASE + '/authorize?' + new URLSearchParams({ response_type: 'code', client_id: st.client_id, redirect_uri: redirect, code_challenge: challenge, code_challenge_method: 'S256', state, scope: 'mcp', resource: BASE }).toString();
}

async function saveTok(st, j) {
  const next = Object.assign({}, st, { access_token: j.access_token, refresh_token: j.refresh_token || st.refresh_token, exp: Date.now() + (Number(j.expires_in) || 3600) * 1000, at: Date.now(), fout: null });
  await kv.set(K, next); return next;
}

// Volautomatisch koppelen met MONDIAD_CLIENT_ID + MONDIAD_CLIENT_SECRET (gedeelde Vercel-variabelen, of /setup): zelfde inlogformulier als in de browser, maar door de server.
async function creds() { let id = process.env.MONDIAD_CLIENT_ID, sec = process.env.MONDIAD_CLIENT_SECRET; if (!id || !sec) { try { const s = (await kv.get('hjdk:secrets')) || {}; id = id || s.MONDIAD_CLIENT_ID; sec = sec || s.MONDIAD_CLIENT_SECRET; } catch (e) {} } const cl = v => String(v).trim().replace(/^["'\s]+|["'\s]+$/g, ''); return id && sec ? { id: cl(id), sec: cl(sec) } : null; }
export async function mdHeeftSleutel() { return !!(await creds()); }
export async function mdAutoLogin() {
  const c0 = await creds(); if (!c0) throw new Error('Mondiad niet gekoppeld: zet MONDIAD_CLIENT_ID en MONDIAD_CLIENT_SECRET');
  try { return await autoLogin(c0); } catch (e) { if (!/Invalid client/i.test(String(e.message))) throw e; return await autoLogin({ id: c0.sec, sec: c0.id }); } // ID en secret omgewisseld ingevuld? dan andersom proberen
}
async function autoLogin(c) { if (!c) throw new Error('Mondiad niet gekoppeld: zet MONDIAD_CLIENT_ID en MONDIAD_CLIENT_SECRET');
  const loc = await mdStart('http://localhost:53682/callback'); const u = new URL(loc);
  const form = new URLSearchParams({ redirect_uri: u.searchParams.get('redirect_uri'), code_challenge: u.searchParams.get('code_challenge'), state: u.searchParams.get('state'), user_client_id: c.id, user_client_secret: c.sec });
  const r = await fetch(loc, { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form.toString() });
  const to = r.headers.get('location') || '';
  if (!/code=/.test(to)) { const t = await r.text().catch(() => ''); const body = t.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<script[\s\S]*?<\/script>/gi, ' '); const m = body.match(/class="[^"]*error[^"]*"[^>]*>([\s\S]{0,300}?)</i); const tekst = (m ? m[1] : body.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 200); throw new Error('Mondiad weigert de sleutel (' + r.status + '): ' + tekst + ' | id ' + c.id.length + ' tekens, secret ' + c.sec.length + ' tekens'); }
  const back = new URL(to, 'http://localhost'); return mdCallback(back.searchParams.get('code'), back.searchParams.get('state'));
}

export async function mdCallback(code, state) {
  const p = await kv.get('hjdk:md:pkce:' + state); if (!p) throw new Error('koppeling verlopen, begin opnieuw');
  const st = (await mdState()) || {};
  const r = await jfetch(BASE + '/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: p.redirect, client_id: st.client_id, code_verifier: p.verifier, resource: BASE }).toString() });
  if (!r.j || !r.j.access_token) throw new Error('token ophalen mislukt (' + r.status + '): ' + r.t.slice(0, 200));
  return saveTok(st, r.j);
}

async function token() {
  let st = await mdState(); if (!st || !st.refresh_token && !st.access_token) { if (await creds()) return (await mdAutoLogin()).access_token; throw new Error('Mondiad niet gekoppeld'); }
  if (st.access_token && st.exp - 120000 > Date.now()) return st.access_token;
  if (!st.refresh_token) { if (await creds()) return (await mdAutoLogin()).access_token; throw new Error('Mondiad-koppeling verlopen'); }
  const r = await jfetch(BASE + '/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: st.refresh_token, client_id: st.client_id, resource: BASE }).toString() });
  if ((!r.j || !r.j.access_token) && (await creds())) { try { return (await mdAutoLogin()).access_token; } catch (e) {} }
  if (!r.j || !r.j.access_token) { await kv.set(K, Object.assign({}, st, { fout: 'verversen mislukt ' + r.status + ' ' + r.t.slice(0, 120), foutAt: Date.now() })); throw new Error('Mondiad-token verversen mislukt (' + r.status + ')'); }
  return (await saveTok(st, r.j)).access_token;
}

// ---- MCP over HTTP (JSON-RPC, antwoord als JSON of als event-stream) ----
let SES = null, rid = 1;
const parse = (t, ct) => { if (/event-stream/.test(ct || '') || /^(event|data):/m.test(t)) { const ds = t.split(/\r?\n/).filter(l => l.startsWith('data:')).map(l => l.slice(5).trim()).filter(Boolean); for (let i = ds.length - 1; i >= 0; i--) { try { const j = JSON.parse(ds[i]); if (j && (j.result || j.error)) return j; } catch (e) {} } return null; } try { return JSON.parse(t); } catch (e) { return null; } };
async function rpc(method, params, notify) {
  const tok = await token();
  const headers = { authorization: 'Bearer ' + tok, 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-06-18' };
  if (SES && SES.id) headers['mcp-session-id'] = SES.id;
  const body = notify ? { jsonrpc: '2.0', method, params } : { jsonrpc: '2.0', id: rid++, method, params };
  const r = await fetch((SES && SES.url) || BASE, { method: 'POST', headers, body: JSON.stringify(body) });
  const t = await r.text(); if (notify) return null;
  if (!r.ok) throw new Error('Mondiad ' + method + ' ' + r.status + ' ' + t.slice(0, 160));
  const sid = r.headers.get('mcp-session-id'); if (sid && SES) SES.id = sid;
  const j = parse(t, r.headers.get('content-type')); if (!j) throw new Error('Mondiad: onleesbaar antwoord op ' + method);
  if (j.error) throw new Error('Mondiad ' + method + ': ' + (j.error.message || JSON.stringify(j.error)).slice(0, 200));
  return j.result;
}
async function init() {
  if (SES && SES.ready && Date.now() - SES.at < 600000) return;
  SES = { url: BASE, id: null, at: Date.now() };
  try { await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'keuzehulp-leerlus', version: '1.0' } }); }
  catch (e) { if (/40[34]/.test(String(e.message))) { SES.url = BASE + '/mcp'; await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'keuzehulp-leerlus', version: '1.0' } }); } else { SES = null; throw e; } }
  await rpc('notifications/initialized', {}, true); SES.ready = true;
}
// md('mondiad_campaign_report', {...}) -> het JSON-antwoord van de tool
export async function md(name, args) {
  await init();
  let res;
  try { res = await rpc('tools/call', { name, arguments: args || {} }); }
  catch (e) { if (/40[04]|session/i.test(String(e.message))) { SES = null; await init(); res = await rpc('tools/call', { name, arguments: args || {} }); } else throw e; }
  const txt = (res && res.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
  if (res && res.isError) throw new Error(name + ': ' + txt.slice(0, 300));
  if (res && res.structuredContent) return res.structuredContent;
  try { return JSON.parse(txt); } catch (e) { return txt; }
}
export async function mdTools() { await init(); const r = await rpc('tools/list', {}); return (r.tools || []).map(t => t.name); }
