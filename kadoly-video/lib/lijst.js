// Wachtrij van gemaakte video's in Vercel Blob (kadoly/lijst.json)
import { list } from '@vercel/blob';
export const LIJST = 'kadoly/lijst.json';
export async function leesLijst() {
  const { blobs } = await list({ prefix: LIJST }); const b = blobs.find(x => x.pathname === LIJST); if (!b) return [];
  const r = await fetch(b.url + '?t=' + Date.now(), { cache: 'no-store' }); return r.ok ? await r.json() : [];
}
