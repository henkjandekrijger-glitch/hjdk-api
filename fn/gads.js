// Google Ads rechtstreeks: zoekvolumes en zoekwoordideeën voor alle projecten (vervangt Adspirer).
// /api/gads?op=status            wat werkt er, wat ontbreekt (openbaar, geen geheimen)
// /api/gads?op=volumes&land=nl&q=wie bel je bij lekkage|wat kost een loodgieter   exacte cijfers voor vaste termen (token=HJDK_TOKEN of cron)
// /api/gads?op=ideeen&land=us&q=who to call for water leak|roof leak&vraag=1      ideeën rond startwoorden; vraag=1 houdt alleen vragende termen
// POST met {land, q:[...]} kan ook voor lange lijsten. Vanuit elk ander Vercel-project: fetch('https://keuzehulp.best/api/gads?op=volumes', {method:'POST', headers:{authorization:'Bearer '+process.env.GADS_TOKEN,'content-type':'application/json'}, body: JSON.stringify({land:'us', q:[...]})}). Uitkomsten worden 30 dagen bewaard onder hjdk:gads:vol:<land>:<term>.
import { kv } from '../lib/db.js';
import { cfg, toegang, volumes, ideeen, VRAAG, LAND } from '../lib/gads.js';
import { claims } from '../lib/gsc.js';

const DAY = () => new Date().toISOString().slice(0, 10);
// toegang voor ALLE Vercel-projecten: stuur een van de gedeelde team-tokens mee (GADS_TOKEN of HJDK_TOKEN) via ?token=, header x-hjdk-token of Authorization: Bearer
const mag = req => { const q = req.query || {}; const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''); const given = [q.token, req.headers['x-hjdk-token'], bearer].filter(Boolean);
  const ok = [process.env.GADS_TOKEN, process.env.HJDK_TOKEN].filter(Boolean); return given.some(g => ok.includes(g)) || String(req.headers['user-agent'] || '').includes('vercel-cron'); };
const lijst = v => (Array.isArray(v) ? v : String(v || '').split(/[|\n]/)).map(s => String(s).trim()).filter(Boolean);

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  const q = Object.assign({}, req.query || {}, typeof req.body === 'object' && req.body ? req.body : {});
  const op = q.op || 'status'; const oidc = req.headers['x-vercel-oidc-token'] || process.env.VERCEL_OIDC_TOKEN;
  try {
    if (op === 'status') {
      const c = cfg(); const st = { klaar: false, ontwikkelaarstoken: !!c.dev, account: c.cid || null, manager: c.login || null, oidc: !!(oidc && claims(oidc)), versie: await kv.get('hjdk:gads:ver').catch(() => null), vandaag: Number(await kv.get('hjdk:gads:n:' + DAY()).catch(() => 0)) || 0, laatsteFout: await kv.get('hjdk:gads:fout').catch(() => null) };
      const nodig = [];
      if (!c.dev) nodig.push('Ontwikkelaarstoken aanvragen in Google Ads (Tools > API-centrum, niveau Basic) en als gedeelde Vercel-variabele GADS_DEV_TOKEN zetten');
      if (!c.cid) nodig.push('GADS_CUSTOMER_ID zetten: het Google Ads-account (10 cijfers) waaronder we meten');
      if (c.dev) {
        try { st.toegang = await toegang(oidc); if (c.cid && !st.toegang.includes(c.cid) && !c.login) nodig.push('Serviceaccount ziet account ' + c.cid + ' niet: voeg seo-leerlus@hjdk-seo.iam.gserviceaccount.com toe als gebruiker (Beheer > Toegang en beveiliging), of zet GADS_LOGIN_CID op het manageraccount'); }
        catch (e) { st.toegangFout = String(e.message || e).slice(0, 300); if (/SERVICE_DISABLED|has not been used|is disabled/i.test(st.toegangFout)) nodig.push('Google Ads API aanzetten in Google Cloud-project hjdk-seo'); else if (/DEVELOPER_TOKEN_NOT_APPROVED|test account/i.test(st.toegangFout)) nodig.push('Ontwikkelaarstoken staat nog op testniveau: Basic aanvragen'); else if (/PERMISSION|not associated|USER_PERMISSION_DENIED/i.test(st.toegangFout)) nodig.push('Serviceaccount seo-leerlus@hjdk-seo.iam.gserviceaccount.com als gebruiker toevoegen in Google Ads'); }
      }
      st.klaar = !nodig.length && !st.toegangFout; st.nodig = nodig; st.landen = Object.keys(LAND);
      return res.status(200).json(st);
    }
    if (!mag(req)) return res.status(401).json({ fout: 'token nodig' });
    const land = String(q.land || 'nl').toLowerCase(); const termen = lijst(q.q);
    if (!termen.length) return res.status(400).json({ fout: 'geef zoektermen mee in q (gescheiden door |)' });
    if (op === 'volumes') {
      const r = await volumes(land, termen, oidc);
      await Promise.all(r.map(x => kv.set('hjdk:gads:vol:' + land + ':' + x.q.slice(0, 100), Object.assign({ dag: DAY() }, x), { ex: 30 * 86400 }).catch(() => {})));
      const gevonden = new Set(r.map(x => x.q)); return res.status(200).json({ land, n: r.length, termen: r, zonderCijfer: termen.map(t => t.toLowerCase()).filter(t => !gevonden.has(t)) });
    }
    if (op === 'ideeen') {
      let r = await ideeen(land, termen, { url: q.url, max: q.max }, oidc);
      if (q.vraag) r = r.filter(x => VRAAG.test(x.q));
      r.sort((a, b) => (b.vol || 0) - (a.vol || 0)); return res.status(200).json({ land, n: r.length, ideeen: r });
    }
    return res.status(400).json({ fout: 'onbekende op' });
  } catch (e) {
    const msg = String(e.message || e).slice(0, 300); kv.set('hjdk:gads:fout', { at: new Date().toISOString(), op, fout: msg }).catch(() => {});
    return res.status(500).json({ fout: msg });
  }
}
