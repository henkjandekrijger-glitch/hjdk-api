// Pinterest API v5: OAuth (tokens in KV, nooit in code), boards en pins. App-id/secret via /setup (KV 'hjdk:secrets') of env PINTEREST_APP_ID / PINTEREST_APP_SECRET.
import { kv } from './db.js';

const API = 'https://api.pinterest.com/v5';
export const REDIRECT = 'https://hjdk-api.vercel.app/api/pinterest/callback';
export const SCOPES = 'boards:read,boards:write,pins:read,pins:write,user_accounts:read';
const TOKEN_KEY = 'hjdk:pinterest:token';

export async function getApp() {
  if (process.env.PINTEREST_APP_ID && process.env.PINTEREST_APP_SECRET) return { id: process.env.PINTEREST_APP_ID, secret: process.env.PINTEREST_APP_SECRET, from: 'env' };
  let c = {}; try { c = (await kv.get('hjdk:secrets')) || {}; } catch (e) {}
  return c.PINTEREST_APP_ID && c.PINTEREST_APP_SECRET ? { id: c.PINTEREST_APP_ID, secret: c.PINTEREST_APP_SECRET, from: 'setup' } : null;
}
export function authUrl(app, state) {
  return 'https://www.pinterest.com/oauth/?client_id=' + encodeURIComponent(app.id) + '&redirect_uri=' + encodeURIComponent(REDIRECT) + '&response_type=code&scope=' + encodeURIComponent(SCOPES) + '&state=' + encodeURIComponent(state);
}
async function tokenCall(app, params) {
  const r = await fetch(API + '/oauth/token', { method: 'POST', headers: { authorization: 'Basic ' + Buffer.from(app.id + ':' + app.secret).toString('base64'), 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params).toString() });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error('pinterest token ' + r.status + ' ' + (j.message || j.error || JSON.stringify(j)).slice(0, 160));
  const cur = (await kv.get(TOKEN_KEY)) || {};
  const tok = { access: j.access_token, refresh: j.refresh_token || cur.refresh || '', exp: Date.now() + (Number(j.expires_in) || 2592000) * 1000, refreshExp: j.refresh_token_expires_in ? Date.now() + Number(j.refresh_token_expires_in) * 1000 : (cur.refreshExp || 0), at: Date.now() };
  await kv.set(TOKEN_KEY, tok);
  return tok;
}
export async function exchangeCode(app, code) { return tokenCall(app, { grant_type: 'authorization_code', code, redirect_uri: REDIRECT }); }
export async function getToken() {
  const tok = await kv.get(TOKEN_KEY); if (!tok || !tok.access) return null;
  if (tok.exp - Date.now() > 24 * 3600 * 1000) return tok.access;
  const app = await getApp(); if (!app || !tok.refresh) return tok.exp > Date.now() ? tok.access : null;
  try { const t = await tokenCall(app, { grant_type: 'refresh_token', refresh_token: tok.refresh }); return t.access; } catch (e) { return tok.exp > Date.now() ? tok.access : null; }
}
export async function tokenStatus() { const tok = await kv.get(TOKEN_KEY); if (!tok || !tok.access) return 'niet verbonden'; return 'verbonden (token tot ' + new Date(tok.exp).toISOString().slice(0, 10) + (tok.refresh ? ', ververst zichzelf' : '') + ')'; }

export async function api(path, opts) {
  const t = await getToken(); if (!t) throw new Error('Pinterest niet verbonden');
  const r = await fetch(API + path, Object.assign({ headers: { authorization: 'Bearer ' + t, 'content-type': 'application/json', accept: 'application/json' } }, opts || {}));
  const txt = await r.text(); let j = {}; try { j = JSON.parse(txt); } catch (e) {}
  if (!r.ok) throw new Error('pinterest ' + r.status + ' ' + (j.message || txt).slice(0, 200));
  return j;
}
export async function listBoards() { const out = []; let bm = ''; for (let i = 0; i < 5; i++) { const j = await api('/boards?page_size=100' + (bm ? '&bookmark=' + encodeURIComponent(bm) : '')); (j.items || []).forEach(b => out.push({ id: b.id, name: b.name })); bm = j.bookmark; if (!bm) break; } return out; }
export async function ensureBoard(name, description) {
  const key = 'hjdk:pinterest:board:' + name.toLowerCase();
  try { const c = await kv.get(key); if (c && c.id) return c.id; } catch (e) {}
  const boards = await listBoards(); const hit = boards.find(b => b.name.toLowerCase() === name.toLowerCase());
  let id = hit ? hit.id : null;
  if (!id) { const j = await api('/boards', { method: 'POST', body: JSON.stringify({ name, description: description || '', privacy: 'PUBLIC' }) }); id = j.id; }
  try { await kv.set(key, { id, at: Date.now() }); } catch (e) {}
  return id;
}
export async function createPin({ boardId, title, description, link, imageUrl, altText }) {
  return api('/pins', { method: 'POST', body: JSON.stringify({ board_id: boardId, title: String(title || '').slice(0, 100), description: String(description || '').slice(0, 500), link, alt_text: String(altText || title || '').slice(0, 500), media_source: { source_type: 'image_url', url: imageUrl } }) });
}
