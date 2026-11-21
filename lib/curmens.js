// Eén meetpoort voor gidsen en curbedrijf. Dit zijn filters, geen bewijs van identiteit.
export const BOTS = [['gptbot', /GPTBot/i], ['oai-search', /OAI-SearchBot/i], ['chatgpt-user', /ChatGPT-User/i], ['perplexity', /Perplexity/i], ['claude', /Claude(Bot|-User|-SearchBot)|anthropic/i], ['google-ext', /Google-Extended/i], ['googlebot', /Googlebot/i], ['bingbot', /bingbot/i], ['applebot', /Applebot/i], ['meta', /meta-externalagent|facebookexternalhit/i]];
export const EXTRA_BOT = /bot\b|crawler|spider|HeadlessChrome|Playwright|Puppeteer|Selenium|PhantomJS|lighthouse|PageSpeed|curl\/|wget\/|python-requests/i;
export const botUa = ua => !String(ua || '').trim() || BOTS.some(b => b[1].test(ua)) || EXTRA_BOT.test(ua);
export const VOORBEELD = process.env.VERCEL_ENV === 'preview';
export const meetPrefix = () => VOORBEELD ? 'cur:voorbeeld:' : 'cur:';
export const mensPrefix = () => meetPrefix() + 'mens:';
export const proefSite = site => site === 'curbedrijf' && VOORBEELD ? 'curbedrijfvoorbeeld' : site;

export function mensVerzoek(req, b) {
  if (botUa(req?.headers?.['user-agent'])) return false;
  const m = b?.mens;
  return !!m && m.v === 1 && m.webdriver === false && m.zichtbaar === true
    && (m.signaal === 'tik' || m.signaal === 'scroll'
      || (m.signaal === 'zichtbaar' && Number.isFinite(m.ms) && m.ms >= 3000));
}
function browserPoort(botBron) {
  if (window.__curMens) return;
  var bot = navigator.webdriver === true || new RegExp(botBron, 'i').test(navigator.userAgent || '') || !navigator.userAgent;
  var wacht = [], bewijs = null, timer = null, vanaf = 0;
  window.__curMens = {
    na: function (fn) { if (bot) return; if (bewijs) fn(bewijs); else wacht.push(fn); },
    bewijs: function () { return bewijs; }
  };
  if (bot) return;
  function zichtbaar() { return document.visibilityState === 'visible'; }
  function stop() { if (timer !== null) clearTimeout(timer); timer = null; }
  function klaar(signaal) {
    if (bewijs || !zichtbaar() || navigator.webdriver === true) return;
    bewijs = { v: 1, webdriver: false, zichtbaar: true, signaal: signaal, ms: Math.max(0, Date.now() - vanaf) };
    stop(); document.removeEventListener('visibilitychange', zicht);
    document.removeEventListener('click', tik, true); window.removeEventListener('scroll', scroll, true);
    var rij = wacht; wacht = []; rij.forEach(function (fn) { try { fn(bewijs); } catch (e) {} });
  }
  function tik(e) { if (e.isTrusted) klaar('tik'); }
  function scroll(e) { if (e.isTrusted) klaar('scroll'); }
  function zicht() { stop(); if (!bewijs && zichtbaar()) { vanaf = Date.now(); timer = setTimeout(function () { klaar('zichtbaar'); }, 3000); } }
  document.addEventListener('click', tik, true); window.addEventListener('scroll', scroll, true);
  document.addEventListener('visibilitychange', zicht); zicht();
}
export function mensJs() {
  const bron = BOTS.map(b => b[1].source).concat(EXTRA_BOT.source).join('|');
  return '(' + browserPoort.toString() + ')(' + JSON.stringify(bron) + ');';
}

// De eerste actie kan vóór de zichtbeacon aankomen. Eén atomaire Redis-bewerking
// bewaart exposure en actie samen, zonder dubbele telling bij parallelle requests.
export const CUR_PROEF_LUA = `
local raw = redis.call('HGET', KEYS[1], ARGV[1])
local rec = raw and cjson.decode(raw) or {v={},c=ARGV[2],f={},m=0,st={}}
local vs = cjson.decode(ARGV[3])
local bestaand = {}
for _,fid in ipairs(rec.f) do bestaand[fid]=true end
for fid,vid in pairs(vs) do
  if not bestaand[fid] then
    rec.v[fid]=vid
    table.insert(rec.f,fid)
    redis.call('HINCRBY',KEYS[2],fid..'|'..vid..'|'..rec.c..'|n',1)
  end
end
local e=ARGV[4]
local w=tonumber(ARGV[5])
local oud=tonumber(rec.m) or 0
if e~='zie' and #rec.f>0 then
  local eerst=not rec.st[e]
  if w>oud or eerst then
    local dw=math.max(0,w-oud)
    local dq=w>oud and w*w-oud*oud or 0
    for _,fid in ipairs(rec.f) do
      local p=fid..'|'..rec.v[fid]..'|'
      if dw>0 then
        redis.call('HINCRBYFLOAT',KEYS[2],p..rec.c..'|s',dw)
        redis.call('HINCRBYFLOAT',KEYS[2],p..rec.c..'|q',dq)
      end
      if eerst then redis.call('HINCRBY',KEYS[2],p..'*|'..e,1) end
    end
    rec.m=math.max(oud,w)
    rec.st[e]=true
  end
end
redis.call('HSET',KEYS[1],ARGV[1],cjson.encode(rec))
redis.call('EXPIRE',KEYS[1],777600)
return 1
`;
export async function curProefEv(kv, b, cfg) {
  const v = {};
  for (const f of cfg.factoren) {
    const vid = b.v?.[f.id];
    if (!f.uit && (f.varianten || []).some(x => !x.uit && x.id === vid)) v[f.id] = vid;
  }
  const site = proefSite('curbedrijf');
  await kv.raw(['EVAL', CUR_PROEF_LUA, 2, 'mm:pfm:' + site + ':' + b.d,
    'mm:pf:' + site + ':' + cfg.ronde, b.pid, ['i', 'a', 'd'].includes(b.c) ? b.c : 'd',
    JSON.stringify(v), b.e, b.e === 'zie' ? 0 : cfg.waarde[b.e]]);
  return { ok: true };
}
